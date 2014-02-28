define([
	"require",
	"intern!bdd"
], function (require, bdd) {
	function on(target, name, listener) {
		target.addEventListener(name, listener);
		return {
			remove: target.removeEventListener.bind(target, name, listener)
		};
	}
	function onMessage(w, topic, listener) {
		return on(w, "message", function (event) {
			var data;
			try {
				data = JSON.parse(event.data);
			} catch (e) {
				console.error("Wrong message event data: " + (e.stack || e));
			}
			if (topic == null || topic === "") {
				listener(data);
			} else if (data.topic === topic) {
				listener(data.event);
			}
		});
	}
	return function (suites, runner) {
		suites = typeof suites.join === "function" ? suites : [suites];
		/* jshint withstmt: true */
		/* global describe, afterEach, it */
		with (bdd) {
			describe("Test " + suites.join(", "), function () {
				var handles = [];
				afterEach(function () {
					for (var h; (h = handles.shift());) {
						h.remove();
					}
				});
				suites.forEach(function (suite) {
					it("Test " + suite, function () {
						var dfd = this.async(60000),
							iframe = document.createElement("iframe"),
							iframeReady = (function () {
								var ready;
								return function (event) {
									if (!ready && (event.type === "load" || iframe.readyState === "complete")) {
										var failedTests = [];
										handles.push(onMessage(iframe.contentWindow, "/error", dfd.rejectOnError(function (event) {
											// event is JSON instead of actual error object
											throw new Error("Error occured in sandbox: " + (event.stack || event.message));
										})));
										handles.push(onMessage(iframe.contentWindow, "/suite/error", dfd.rejectOnError(function (event) {
											// event is JSON instead of actual error object
											throw new Error("Error occured in sandbox: " + (event.stack || event.message));
										})));
										handles.push(onMessage(iframe.contentWindow, "/test/fail", dfd.rejectOnError(function (event) {
											failedTests.push(event);
										})));
										handles.push(onMessage(iframe.contentWindow, "/suite/end", dfd.rejectOnError(function (event) {
											if (event.name === "main") {
												if (failedTests.length > 0) {
													throw new Error(failedTests.map(function (test) {
														// test.error is JSON instead of actual error object
														return "FAIL: " + test.id + " (" + test.timeElapsed + "ms)"
															+ (test.error ? "\n" + (test.error.stack || test.error.message) : "");
													}).join("\n"));
												} else if (event.numFailedTests > 0) {
													throw new Error(event.numFailedTests
														+ " out of " + event.numTests + " sandbox tests have been failed.");
												}
												dfd.resolve(1);
											}
										})));
										ready = true;
									}
								};
							})();
						handles.push(on(iframe, "readyStateChange", dfd.rejectOnError(iframeReady)));
						handles.push(on(iframe, "load", dfd.rejectOnError(iframeReady)));
						iframe.style.width = "100%";
						iframe.src = require.toUrl(runner || "liaison/tests/sandbox/client.html")
							+ "?config=liaison/tests/sandbox/intern&suites=" + suite;
						document.body.appendChild(iframe);
						handles.push({
							remove: function () {
								iframe.parentNode.removeChild(iframe);
								iframe.src = "";
							}
						});
					});
				});
			});
		}
	};
});
