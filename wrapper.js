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
					for (var index; (index = this.callbacks.indexOf(callback)) >= 0;) {
						this.callbacks.splice(index, 1);
					}
					if (this.callbacks.length === 0) {
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
			// Returns an inactive state of clone
			return new Computed(this.callback, this.paths).init(this.o, this.name);
		},
		init: function (o, name) {
			this.remove();
			o !== undefined && (this.o = o);
			name !== undefined && (this.name = name);
			return this;
		},
		activate: (function () {
			function callComputedCallback(callback, a) {
				return callback.apply(this, a);
			}
			function mapPath(path) {
				return new ObservablePathClass(this, path);
			}
			return function () {
				var o = this.o;
				this.source = new BindingSourceList(this.paths.map(mapPath, o), callComputedCallback.bind(this, this.callback));
				this.source.open((typeof o.set === "function" ? o.set : set).bind(o, this.name));
				set.call(o, this.name, this.source.getFrom());
				return this;
			};
		})(),
		remove: function () {
			if (this.source) {
				this.source.remove();
				this.source = null;
			}
		}
	};

	function ComputedArray(callback, path) {
		this.callback = callback;
		this.path = path;
	}

	ComputedArray.prototype = Object.create(Computed.prototype);
	ComputedArray.prototype._computedMarker = "_computedArray";

	ComputedArray.prototype.clone = function () {
		return new ComputedArray(this.callback, this.path).init(this.o, this.name);
	};

	ComputedArray.prototype.activate = function () {
		var o = this.o;
		this.source = new Each(new ObservablePathClass(o, this.path), this.callback);
		this.source.open((typeof o.set === "function" ? o.set : set).bind(o, this.name));
		set.call(o, this.name, this.source.getFrom());
		return this;
	};

	/**
	 * @function module:liaison/wrapper.wrap
	 * @param {Object} o A plain object.
	 * @returns {module:liaison/Observable} The {@link module:liaison/Observable Observable} version of the given object.
	 */
	function wrap(o) {
		var wrapped;
		if (typeof (o || EMPTY_OBJECT).splice === "function") {
			return ObservableArray.apply(undefined, o.map(wrap));
		} else if (Observable.test(o) || o && REGEXP_OBJECT_CONSTRUCTOR.test(o.constructor + "")) {
			var handles = [];
			wrapped = new Observable();
			for (var s in o) {
				if (isComputed(o[s])) {
					handles.push(o[s].init(wrapped, s).activate());
				} else {
					wrapped[s] = wrap(o[s]);
				}
			}
			if (handles.length > 0) {
				// Make computed properties list not enumeable
				Object.defineProperty(wrapped, "_computed", {value: handles, configurable: true, writable: true});
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
		if (typeof (o || EMPTY_OBJECT).splice === "function") {
			return o.map(unwrap);
		} else if (Observable.test(o) || REGEXP_OBJECT_CONSTRUCTOR.test(o.constructor + "")) {
			unwrapped = {};
			for (var s in o) {
				unwrapped[s] = unwrap(o[s]);
			}
			if (o._computed) {
				for (var i = 0, l = o._computed.length; i < l; ++i) {
					var h = o._computed[i];
					unwrapped[h.name] = h;
				}
			}
			return unwrapped;
		}
		return o;
	}

	/**
	 * Removes {@link module:liaison/BindingSource BindingSource} for computed properties
	 * defined in the given {@link module:liaison/Observable Observable}.
	 * @function module:liaison/wrapper.remove
	 * @param {module:liaison/Observable} o A {@link module:liaison/Observable Observable}.
	 */
	function remove(o) {
		if (Array.isArray(o._computed)) {
			for (var h; (h = o._computed.shift());) {
				h.remove();
			}
			delete o._computed;
		}
		if (typeof (o || EMPTY_OBJECT).splice === "function") {
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