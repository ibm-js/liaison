/** @module liaison/wrapper */
(function (root, factory) {
	// Module definition to support AMD, node.js and browser globals
	if (typeof exports === "object") {
		module.exports = factory(require("./Observable"), require("./ObservableArray"));
	} else if (typeof define === "function" && define.amd) {
		define(["./Observable", "./ObservableArray"], factory);
	} else {
		root.wrapper = factory(root.Observable, root.ObservableArray);
	}
})(this, function (Observable, ObservableArray) {
	"use strict";

	var REGEXP_OBJECT_CONSTRUCTOR = /^\s*function Object\s*\(/;

	/**
	 * @function module:liaison/wrapper.wrap
	 * @param {Object} o A plain object.
	 * @returns {module:liaison/Observable} The {@link module:liaison/Observable Observable} version of the given object.
	 */
	function wrap(o) {
		var wrapped;
		if (typeof (o || {}).splice === "function") {
			wrapped = new ObservableArray();
			for (var i = 0, l = o.length; i < l; ++i) {
				wrapped.push(wrap(o[i]));
			}
			return wrapped;
		} else if (Observable.test(o) || o && REGEXP_OBJECT_CONSTRUCTOR.test(o.constructor + "")) {
			wrapped = new Observable();
			for (var s in o) {
				wrapped[s] = wrap(o[s]);
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
			unwrapped = [];
			for (var i = 0, l = o.length; i < l; ++i) {
				unwrapped.push(unwrap(o[i]));
			}
			return unwrapped;
		} else if (Observable.test(o) || REGEXP_OBJECT_CONSTRUCTOR.test(o.constructor + "")) {
			unwrapped = {};
			for (var s in o) {
				unwrapped[s] = unwrap(o[s]);
			}
			return unwrapped;
		}
		return o;
	}

	return {
		wrap: wrap,
		unwrap: unwrap
	};
});