/** @module liaison/wrapper */
define([
	"decor/Observable",
	"./ObservableArray"
], function (Observable, ObservableArray) {
	"use strict";

	var getPrototypeOf = Object.getPrototypeOf;

	/**
	 * @function module:liaison/wrapper.wrap
	 * @param {Object} o A plain object.
	 * @returns {module:decor/Observable} The {@link module:decor/Observable Observable} version of the given object.
	 */
	function wrap(o) {
		var root = o,
			tree = [];

		function wrapImpl(o) {
			var index = tree.indexOf(o);
			if (index >= 0) {
				return tree[index + 1];
			}

			var proto,
				isArray = Array.isArray(o),
				isObject = Observable.test(o) || o && typeof o === "object" && (o === root || (proto = getPrototypeOf(o)) && !getPrototypeOf(proto)),
				wrapped = isArray ? new ObservableArray() : isObject ? new Observable() : o;

			tree.push(o, wrapped);

			if (isArray) {
				for (var i = 0, l = o.length; i < l; ++i) {
					wrapped[i] = wrapImpl(o[i]);
				}
			} else if (isObject) {
				for (var s in o) {
					wrapped[s] = wrapImpl(o[s]);
				}
			}

			tree.splice(-2, 2);
			return wrapped;
		}

		return wrapImpl(o);
	}

	/**
	 * @function module:liaison/wrapper.unwrap
	 * @param {module:decor/Observable} o A {@link module:decor/Observable Observable}.
	 * @returns {Object} The plain object version of the given {@link module:decor/Observable Observable}.
	 */
	function unwrap(o) {
		var tree = [];

		function unwrapImpl(o) {
			var index = tree.indexOf(o);
			if (index >= 0) {
				return tree[index + 1];
			}

			var proto,
				isArray = Array.isArray(o),
				isObject = Observable.test(o) || o && typeof o === "object" && (proto = getPrototypeOf(o)) && !getPrototypeOf(proto),
				unwrapped = isArray ? [] : isObject ? {} : o;

			tree.push(o, unwrapped);

			if (isArray) {
				for (var i = 0, l = o.length; i < l; ++i) {
					unwrapped[i] = unwrapImpl(o[i]);
				}
			} else if (isObject) {
				for (var s in o) {
					unwrapped[s] = unwrapImpl(o[s]);
				}
			}

			tree.splice(-2, 2);
			return unwrapped;
		}

		return unwrapImpl(o);
	}

	return {
		wrap: wrap,
		unwrap: unwrap
	};
});