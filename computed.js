/**
 * @module liaison/computed
 */
define([
	"decor/Observable",
	"./ObservablePath",
	"./Each"
], function (Observable, ObservablePath, Each) {
	"use strict";

	var EMPTY_OBJECT = {},
		EMPTY_ARRAY = [],
		REGEXP_COMPUTED_MARKER = /^_computed/,
		REGEXP_SHADOW_PROP = /^_.*Attr$/,
		getPrototypeOf = Object.getPrototypeOf;

	function set(name, value) {
		this[name] = value;
	}

	function callComputedCallback(callback, a) {
		return callback.apply(this, a);
	}

	function mapPath(path) {
		return new ObservablePath(this, path);
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
		activate: function () {
			var o = this.o;
			if (typeof o._getProps !== "function" || !REGEXP_SHADOW_PROP.test(this.name)) {
				var sourcePaths = [],
					entryPaths = [];
				this.paths.forEach(function (path) {
					if (path[0] !== "@") {
						sourcePaths.push(path);
					} else {
						var index = sourcePaths.length - 1;
						(entryPaths[index] = entryPaths[index] || []).push(path.substr(1));
					}
				}, this);
				var sources = sourcePaths.map(mapPath, o),
					callback = callComputedCallback.bind(o, this.callback);
				this.source = new Each(sources, entryPaths, callback);
				set.call(o, this.name, this.source.open((typeof o.set === "function" ? o.set : set).bind(o, this.name)));
			}
			return this;
		},
		remove: function () {
			if (this.source) {
				this.source.remove();
				this.source = null;
			}
		}
	};

	/**
	 * @function module:liaison/computed
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
	 * @example
	 *     var o = wrapper.wrap({
	 *         items: [
	 *             {Name: "Anne Ackerman"},
	 *             {Name: "Ben Beckham"},
	 *             {Name: "Chad Chapman"},
	 *             {Name: "Irene Ira"}
	 *         ],
	 *         includeShortName: false,
	 *         totalNameLength: computed(function (a, includeShortName) {
	 *             return a.reduce(function (length, entry) {
	 *                 return length + (includeShortName || entry.Name.length >= 10 ? entry.Name.length : 0);
	 *             }, 0);
	 *         }, "items", "@Name", "includeShortName") // "@Name" let the computed array observe Name property in each array entries in o.items
	 *     });
	 *     computed.apply(o); // Makes computed properties under o active
	 *     new ObservablePath(o, "totalNameLength").observe(function (newValue, oldValue) {
	 *         // 57 comes to newValue
	 *         // 36 comes to oldValue
	 *     });
	 *     o.items.push({Name: "John Jacklin"});
	 *     o.set("includeShortName", true);
	 */
	var computed = function (callback) {
		return new Computed(callback, EMPTY_ARRAY.slice.call(arguments, 1));
	};

	/**
	 * Look for computed properties under the given object and activate them by applying the object and the property name in thre tree.
	 * @function module:liaison/computed.apply
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
	 * @function module:liaison/computed.test
	 * @param o A value
	 * @returns {boolean} True if the given value is a computed property.
	 */
	computed.test = function (o) {
		return REGEXP_COMPUTED_MARKER.test((o || EMPTY_OBJECT)._computedMarker);
	};

	return computed;
});
