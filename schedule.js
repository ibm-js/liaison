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

	return (function () {
		/* global setImmediate */
		var inFlight,
			SCHEDULEID_PREFIX = "_schedule",
			seq = 0,
			uniqueId = Math.random() + "",
			callbacks = {},
			pseudoDiv = has("dom-mutation-observer") && document.createElement("div");
		function runCallbacks() {
			inFlight = false;
			for (var anyWorkDone = true; anyWorkDone;) {
				anyWorkDone = false;
				for (var id in callbacks) {
					var callback = callbacks[id];
					delete callbacks[id];
					callback();
					anyWorkDone = true;
				}
			}
		}
		if (has("dom-mutation-observer")) {
			pseudoDiv.id = 0;
			new MutationObserver(runCallbacks).observe(pseudoDiv, {attributes: true});
		} else if (!has("js-setimmediate")) {
			window.addEventListener("message", function (event) {
				if (event.data === uniqueId) {
					runCallbacks();
				}
			});
		}
		return function (callback) {
			var id = SCHEDULEID_PREFIX + seq++;
			callbacks[id] = callback;
			if (!inFlight) {
				has("dom-mutation-observer") ? ++pseudoDiv.id :
					has("js-setimmediate") ? setImmediate(runCallbacks) :
					window.postMessage(uniqueId, "*");
				inFlight = true;
			}
			return {
				remove: function () {
					delete callbacks[id];
				}
			};
		};
	})();
});
