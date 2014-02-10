/** @module liaison/assignObservable */
(function (root, factory) {
	// Module definition to support AMD, node.js and browser globals
	if (typeof exports === "object") {
		module.exports = factory();
	} else if (typeof define === "function" && define.amd) {
		define(factory);
	} else {
		root.assignObservable = factory();
	}
})(this, function () {
	"use strict";

	/**
	 * Copy properties of given source objects to given target object.
	 * If target object has {@link module:liaison/Observable#set set()} function for the property, uses it.
	 * @function module:liaison/assignObservable
	 * @param {Object} dst The target object.
	 * @param {...Object} var_args The source objects.
	 * @returns {Object} The target object.
	 */
	return function (dst) {
		for (var hasDstSetter = typeof dst.set === "function", i = 1, l = arguments.length; i < l; ++i) {
			var src = arguments[i],
				props = Object.getOwnPropertyNames(src);
			for (var j = 0, m = props.length; j < m; ++j) {
				var prop = props[j];
				hasDstSetter ? dst.set(prop, src[prop]) : (dst[prop] = src[prop]);
			}
		}
		return dst;
	};
});
