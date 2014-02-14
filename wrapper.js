/** @module liaison/wrapper */
(function (root, factory) {
	// Module definition to support AMD, node.js and browser globals
	if (typeof exports === "object") {
		module.exports = factory(
			require("./Observable"),
			require("./ObservableArray"),
			require("./ObservablePath"),
			require("./BindingSourceList"),
			require("./Each"));
	} else if (typeof define === "function" && define.amd) {
		define(["./Observable", "./ObservableArray", "./ObservablePath", "./BindingSourceList", "./Each"], factory);
	} else {
		root.wrapper = factory(root.Observable, root.ObservableArray, root.ObservablePath, root.BindingSourceList, root.Each);
	}
})(this, function (Observable, ObservableArray, ObservablePath, BindingSourceList, Each) {
	"use strict";

	/* global PathObserver */
	var EMPTY_OBJECT = {},
		REGEXP_OBJECT_CONSTRUCTOR = /^\s*function Object\s*\(/,
		REGEXP_COMPUTED_MARKER = /^_computed/,
		ObservablePathClass = typeof PathObserver === "undefined" ? ObservablePath : (function () {
			function DirtyCheckableObservablePath() {
				ObservablePath.apply(this, arguments);
			}

			DirtyCheckableObservablePath.prototype = Object.create(ObservablePath.prototype);

			DirtyCheckableObservablePath.prototype.observe = (function () {
				function iterateCallbacks() {
					for (var i = 0, l = this.callbacks.length; i < l; ++i) {
						try {
							this.callbacks[i].apply(this.object, arguments);
						} catch (e) {
							console.error("Error occured in DirtyCheckableObservablePath callback: " + (e.stack || e));
						}
					}
				}
				function remove(callback) {
					/* jshint validthis: true */
					var callbacks = this.callbacks;
					for (var i = callbacks.length - 1; i >= 0; --i) {
						if (callbacks[i] === callback) {
							callbacks.splice(i, 1);
						}
					}
					if (callbacks.length === 0) {
						this.h.remove();
						this.h = null;
					}
				}
				return function (callback) {
					(this.callbacks = this.callbacks || []).push(callback);
					if (!this.h) {
						(this.h = new PathObserver(this.object, this.path)).open(iterateCallbacks, this);
						this.h.remove = this.h.close;
					}
					return {
						remove: remove.bind(this)
					};
				};
			})();

			return DirtyCheckableObservablePath;
		})();

	function set(name, value) {
		this[name] = value;
	}

	/**
	 * @function module:liaison/wrapper.isComputed
	 * @param computed A value.
	 * @returns {boolean} True if the given argument is a computed property.
	 */
	function isComputed(computed) {
		return REGEXP_COMPUTED_MARKER.test((computed || EMPTY_OBJECT)._computedMarker);
	}

	function Computed(callback, paths) {
		this.callback = callback;
		this.paths = paths;
	}

	Computed.prototype = {
		_computedMarker: "_computed",
		clone: function () {
			if (this.source) {
				throw new Error("This computed property has been activated already. Cannot be cloned.");
			}
			return new Computed(this.callback, this.paths);
		},
		activate: (function () {
			function callComputedCallback(callback, a) {
				return callback.apply(this, a);
			}
			return function (o, name) {
				this.o = o;
				this.name = name;
				(this.source = new BindingSourceList(this.paths.map(function (path) {
					return new ObservablePathClass(o, path);
				}), callComputedCallback.bind(this, this.callback))).open((typeof o.set === "function" ? o.set : set).bind(o, name));
				set.call(o, name, this.source.getFrom());
				return this;
			};
		})(),
		remove: function () {
			this.source && this.source.remove();
		}
	};

	function ComputedArray(callback, path) {
		this.callback = callback;
		this.path = path;
	}

	ComputedArray.prototype = {
		_computedMarker: "_computedArray",
		clone: function () {
			if (this.source) {
				throw new Error("This computed property has been activated already. Cannot be cloned.");
			}
			return new ComputedArray(this.callback, this.path);
		},
		activate: function (o, name) {
			this.o = o;
			this.name = name;
			this.source = new Each(new ObservablePathClass(o, this.path), this.callback);
			this.source.open((typeof o.set === "function" ? o.set : set).bind(o, name));
			set.call(o, name, this.source.getFrom());
			return this;
		},
		remove: function () {
			this.source && this.source.remove();
		}
	};

	/**
	 * @function module:liaison/wrapper.wrap
	 * @param {Object} o A plain object.
	 * @returns {module:liaison/Observable} The {@link module:liaison/Observable Observable} version of the given object.
	 */
	function wrap(o) {
		var wrapped;
		if (typeof (o || {}).splice === "function") {
			return ObservableArray.apply(undefined, o.map(wrap));
		} else if (Observable.test(o) || o && REGEXP_OBJECT_CONSTRUCTOR.test(o.constructor + "")) {
			var handles = [];
			wrapped = new Observable();
			for (var s in o) {
				if (isComputed(o[s])) {
					handles.push(o[s].activate(wrapped, s));
				} else {
					wrapped[s] = wrap(o[s]);
				}
			}
			if (handles.length > 0) {
				// Make computed property's handles list not enumeable or writable
				Object.defineProperty(wrapped, "_computedHandles", {value: handles, configurable: true});
			}
			return wrapped;
		}
		return o;
	}

	/**
	 * @function module:liaison/wrapper.unwrap
	 * @param {module:liaison/Observable} o A {@link module:liaison/Observable Observable}.
	 * @returns {Object} The plain object version of the given {@link module:liaison/Observable Observable}.
	 */
	function unwrap(o) {
		var unwrapped;
		if (typeof (o || {}).splice === "function") {
			return o.map(unwrap);
		} else if (Observable.test(o) || REGEXP_OBJECT_CONSTRUCTOR.test(o.constructor + "")) {
			unwrapped = {};
			for (var s in o) {
				unwrapped[s] = unwrap(o[s]);
			}
			if (o._computedHandles) {
				for (var i = 0, l = o._computedHandles.length; i < l; ++i) {
					var h = o._computedHandles[i];
					unwrapped[h.name] = h;
				}
			}
			return unwrapped;
		}
		return o;
	}

	/**
	 * Removes {@link BindingSource} for computed properties defined in the given {@link module:liaison/Observable Observable}.
	 * @function module:liaison/wrapper.remove
	 * @param {module:liaison/Observable} o A {@link module:liaison/Observable Observable}.
	 */
	function remove(o) {
		if (Array.isArray(o._computedHandles)) {
			for (var h; (h = o._computedHandles.shift());) {
				h.remove();
			}
			delete o._computedHandles;
		}
		if (typeof (o || {}).splice === "function") {
			o.forEach(remove);
		} else if (Observable.test(o) || REGEXP_OBJECT_CONSTRUCTOR.test(o.constructor + "")) {
			for (var s in o) {
				remove(o[s]);
			}
		}
	}

	return /** @lends module:liaison/wrapper */ {
		/**
		 * @param {Function} callback The function to calculate computed property value.
		 * @param {...string} var_args The paths from the parent object.
		 * @returns
		 *     The computed property object.
		 *     The computed property is calculated every time one of the values of the paths changes.
		 * @example
		 *     var o = wrapper.wrap({
		 *         first: "John",
		 *         last: "Doe",
		 *         name: wrapper.computed(function (first, last) {
		 *             return first + " " + last;
		 *         }, "first", "last")
		 *     });
		 *     new ObservablePath(o, "name").observe(function (newValue, oldValue) {
		 *         // "John Doe" comes to newValue
		 *         // "Ben Doe" comes to oldValue
		 *     });
		 *     o.set("first", "Ben");
		 */
		computed: function (callback) {
			return new Computed(callback, [].slice.call(arguments, 1));
		},

		/**
		 * @param {Function} callback The function to calculate computed property value.
		 * @param {string} path The path from the parent object, which should point to an array.
		 * @returns
		 *     The computed property object.
		 *     The computed property is calculated every time the array changes.
		 * @example
		 *     var o = wrapper.wrap({
		 *         items: [
		 *             {Name: "Anne Ackerman"},
		 *             {Name: "Ben Beckham"},
		 *             {Name: "Chad Chapman"},
		 *             {Name: "Irene Ira"}
		 *         ],
		 *         totalNameLength: wrapper.computedArray(function (a) {
		 *             return a.reduce(function (length, entry) {
		 *                 return length + entry.Name.length;
		 *             }, 0);
		 *         }, "items")
		 *     });
		 *     new ObservablePath(o, "totalNameLength").observe(function (newValue, oldValue) {
		 *         // 57 comes to newValue
		 *         // 45 comes to oldValue
		 *     });
		 *     o.items.push({Name: "John Jacklin"});
		 */
		computedArray: function (callback, path) {
			return new ComputedArray(callback, path);
		},

		isComputed: isComputed,
		wrap: wrap,
		unwrap: unwrap,
		remove: remove
	};
});