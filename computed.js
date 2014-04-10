/**
 * @module liaison/computed
 */
(function (root, factory) {
	// Module definition to support AMD, node.js and browser globals
	if (typeof exports === "object") {
		module.exports = factory("./Observable", "./ObservablePath", "./BindingSourceList", "./Each");
	} else if (typeof define === "function" && define.amd) {
		define(["./Observable", "./ObservablePath", "./BindingSourceList", "./Each"], factory);
	} else {
		root.computed = factory(root.Observable, root.ObservablePath, root.BindingSourceList, root.Each);
	}
})(this, function (Observable, ObservablePath, BindingSourceList, Each) {
	"use strict";

	/* global PathObserver */
	var EMPTY_OBJECT = {},
		REGEXP_COMPUTED_MARKER = /^_computed/,
		REGEXP_SHADOW_PROP = /^_.*Attr$/,
		getPrototypeOf = Object.getPrototypeOf,
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
				if (typeof o._getProps !== "function" || !REGEXP_SHADOW_PROP.test(this.name)) {
					this.source = new BindingSourceList(this.paths.map(mapPath, o), callComputedCallback.bind(o, this.callback));
					this.source.open((typeof o.set === "function" ? o.set : set).bind(o, this.name));
					set.call(o, this.name, this.source.getFrom());
				}
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
		if (typeof o._getProps !== "function" || !REGEXP_SHADOW_PROP.test(this.name)) {
			this.source = new Each(new ObservablePathClass(o, this.path), this.callback);
			this.source.open((typeof o.set === "function" ? o.set : set).bind(o, this.name));
			set.call(o, this.name, this.source.getFrom());
		}
		return this;
	};

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
	 *         name: computed(function (first, last) {
	 *             return first + " " + last;
	 *         }, "first", "last")
	 *     });
	 *     computed.apply(o); // Makes computed properties under o active
	 *     new ObservablePath(o, "name").observe(function (newValue, oldValue) {
	 *         // "John Doe" comes to newValue
	 *         // "Ben Doe" comes to oldValue
	 *     });
	 *     o.set("first", "Ben");
	 */
	var computed = function (callback) {
		var result = new Computed(callback, [].slice.call(arguments, 1));
		return result;
	};

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
	 *         totalNameLength: computed.array(function (a) {
	 *             return a.reduce(function (length, entry) {
	 *                 return length + entry.Name.length;
	 *             }, 0);
	 *         }, "items")
	 *     });
	 *     computed.apply(o); // Makes computed properties under o active
	 *     new ObservablePath(o, "totalNameLength").observe(function (newValue, oldValue) {
	 *         // 57 comes to newValue
	 *         // 45 comes to oldValue
	 *     });
	 *     o.items.push({Name: "John Jacklin"});
	 */
	computed.array = function (callback, path) {
		return new ComputedArray(callback, path);
	};

	/**
	 * Look for computed properties under the given object and activate them by applying the object and the property name in thre tree.
	 * @param o The object tree.
	 */
	computed.apply = function (o) {
		var root = o,
			tree = [],
			handles = [];

		function applyImpl(o) {
			var proto,
				index = tree.indexOf(o),
				isRoot = root === o;

			if (index < 0) {
				tree.push(o);

				if (Array.isArray(o)) {
					o.forEach(function (entry, i) {
						computed.test(entry) ? handles.push(entry.clone().init(o, i).activate()) : applyImpl(entry);
					});
				} else if (Observable.test(o) || o && typeof o === "object" && (isRoot || (proto = getPrototypeOf(o)) && !getPrototypeOf(proto))) {
					for (var s in o) {
						var value;
						try {
							value = o[s];
						} catch (e) {
							continue; // IE9 throws accessing some DOM properties
						}
						computed.test(value) ? handles.push(value.clone().init(o, s).activate()) : applyImpl(value);
					}
				}

				tree.pop();
			}
		}

		applyImpl(o);
		return handles;
	};

	/**
	 * @param o A value
	 * @returns {boolean} True if the given value is a computed property.
	 */
	computed.test = function (o) {
		return REGEXP_COMPUTED_MARKER.test((o || EMPTY_OBJECT)._computedMarker);
	};

	return computed;
});
