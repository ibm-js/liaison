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
	return has("js-setimmediate") && !has("dom-mutation-observer") ? function (callback) {
			var h = setImmediate(callback);
			return {
				remove: clearImmediate.bind(undefined, h)
			};
		} : (function () {
			var SCHEDULEID_PREFIX = "_schedule",
				seq = 0,
				uniqueId = Math.random() + "",
				callbacks = {},
				pseudoDiv = has("dom-mutation-observer") && document.createElement("div");
			function runCallbacks() {
				for (var id in callbacks) {
					var callback = callbacks[id];
					delete callbacks[id];
					callback();
				}
			}
			if (has("dom-mutation-observer")) {
				pseudoDiv.id = 0;
				new MutationObserver(runCallbacks).observe(pseudoDiv, {attributes: true});
			} else {
				window.addEventListener("message", function (event) {
					if (event.data === uniqueId) {
						runCallbacks();
					}
				});
			}
			return function (callback) {
				has("dom-mutation-observer") ? ++pseudoDiv.id : window.postMessage(uniqueId, "*");
				var id = callback._scheduleId || (callback._scheduleId = SCHEDULEID_PREFIX + seq++);
				if (!callbacks[id]) {
					callbacks[id] = callback;
				}
				return {
					remove: function () {
						delete callbacks[id];
					}
				};
			};
		})();
});
