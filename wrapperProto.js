/**
 * @module liaison/wrapperProto
 * @borrows module:liaison/wrapper.computed as computed
 * @borrows module:liaison/wrapper.computedArray as computedArray
 * @borrows module:liaison/wrapper.isComputed as isComputed
 */
(function (root, factory) {
	// Module definition to support AMD, node.js and browser globals
	if (typeof exports === "object") {
		module.exports = factory("./Observable", "./wrapper");
	} else if (typeof define === "function" && define.amd) {
		define(["./Observable", "./wrapper"], factory);
	} else {
		root.wrapperProto = factory(root.Observable, root.wrapper);
	}
})(this, function (Observable, wrapper) {
	"use strict";

	var REGEXP_OBJECT_CONSTRUCTOR = /^\s*function Object\s*\(/;

	return /** @lends module:liaison/wrapperProto */ {
		/**
		 * Set up a prototype object for a custom element for data binding.
		 * @param {Object} o A plain object.
		 * @returns {Object} A converted version of the given object.
		 */
		wrap: (function () {
			function removeComputed() {
				for (var computed; (computed = this && this.shift());) {
					computed.remove();
				}
			}
			function applyInstanceToComputed() {
				if (this._computed) {
					this._computed = this._computed.map(function (computed) {
						return computed.clone().init(this).activate();
					}, this);
				}
				return {
					remove: removeComputed.bind(this._computed)
				};
			}
			return function (o) {
				var result = wrapper.wrap.apply(this, arguments);
				if (result._computed) {
					// dcl cannot inherit non-enumerable properties.
					// Given wrapperProto.wrap() does not support round-trip with unwrap(), make _computed enumerable.
					Object.defineProperty(result, "_computed", {enumerable: true});
				}
				if (Observable.test(o) || o && REGEXP_OBJECT_CONSTRUCTOR.test(o.constructor + "")) {
					result._applyInstanceToComputed = applyInstanceToComputed;
				}
				return result;
			};
		})(),
		computed: function () {
			var computed = wrapper.computed.apply(this, arguments);
			computed.lazyObjectAssignment = true;
			return computed;
		},
		computedArray: function () {
			var computedArray = wrapper.computedArray.apply(this, arguments);
			computedArray.lazyObjectAssignment = true;
			return computedArray;
		},
		isComputed: wrapper.isComputed
	};
});
