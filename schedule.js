/** @module liaison/schedule */
(function (root, factory) {
	// Module definition to support AMD, node.js and browser globals
	if (typeof exports === "object") {
		module.exports = factory();
	} else if (typeof define === "function" && define.amd) {
		define(factory);
	} else {
		root.schedule = factory();
	}
})(this, function () {
	"use strict";

	/**
	 * Calls a function at the end of microtask.
	 * @function module:liaison/schedule
	 * @param {Function} callback The function to call at the end of microtask.
	 */

	/* global setImmediate, clearImmediate */
	return typeof setImmediate === "function" ? function (callback) {
			var h = setImmediate(callback);
			return {
				remove: clearImmediate.bind(undefined, h)
			};
		} : typeof document !== undefined ? (function () {
			var uniqueId = Math.random() + "",
				// Avoid polyfill version of MutationObserver
				shouldUseMutationObserver
					= typeof MutationObserver !== "undefined"
						&& (/\[\s*native\s+code\s*\]/i.test(MutationObserver)
							|| !/^\s*function/.test(MutationObserver)),
				callbacks = [],
				pseudoDiv = shouldUseMutationObserver && document.createElement("div");
			if (shouldUseMutationObserver) {
				pseudoDiv.id = 0;
				new MutationObserver(function () {
					while (callbacks.length > 0) {
						callbacks.shift()();
					}
				}).observe(pseudoDiv, {attributes: true});
			} else {
				window.addEventListener("message", function (event) {
					if (event.data === uniqueId) {
						while (callbacks.length > 0) {
							callbacks.shift()();
						}
					}
				});
			}
			function remove(callback) {
				for (var index; (index = callbacks.indexOf(callback)) >= 0;) {
					callbacks.splice(index, 1);
				}
			}
			return function (callback) {
				shouldUseMutationObserver ? ++pseudoDiv.id : window.postMessage(uniqueId, "*");
				callbacks.indexOf(callback) < 0 && callbacks.push(callback);
				return {
					remove: remove.bind(undefined, callback)
				};
			};
		})() :
		function (callback) {
			var h = setTimeout(callback, 0);
			return {
				remove: clearTimeout.bind(undefined, h)
			};
		};
});
