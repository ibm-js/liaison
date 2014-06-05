/** @module liaison/schedule */
define(["requirejs-dplugins/has"], function (has) {
	"use strict";

	has.add("js-setimmediate", typeof setImmediate === "function");
	has.add("dom-mutation-observer",
		typeof MutationObserver !== "undefined"
			&& (/\[\s*native\s+code\s*\]/i.test(MutationObserver) // Avoid polyfill version of MutationObserver
				|| !/^\s*function/.test(MutationObserver)));

	/**
	 * Calls a function at the end of microtask.
	 * @function module:liaison/schedule
	 * @param {Function} callback The function to call at the end of microtask.
	 */

	/* global setImmediate, clearImmediate */
	return has("js-setimmediate") ? function (callback) {
			var h = setImmediate(callback);
			return {
				remove: clearImmediate.bind(undefined, h)
			};
		} : (function () {
			var uniqueId = Math.random() + "",
				callbacks = [],
				pseudoDiv = has("dom-mutation-observer") && document.createElement("div");
			if (has("dom-mutation-observer")) {
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
				has("dom-mutation-observer") ? ++pseudoDiv.id : window.postMessage(uniqueId, "*");
				callbacks.indexOf(callback) < 0 && callbacks.push(callback);
				return {
					remove: remove.bind(undefined, callback)
				};
			};
		})();
});
