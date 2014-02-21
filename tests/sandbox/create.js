define([
	"require",
	"intern!bdd"
], function (require, bdd) {
	return function (suites, runner) {
		suites = typeof suites.join === "function" ? suites : [suites];
		/* jshint withstmt: true */
		/* global describe, afterEach, it */
		with (bdd) {
			describe("Test " + suites.join(", "), function () {
				var iframe;
				afterEach(function () {
					iframe.parentNode.removeChild(iframe);
					iframe.src = "";
				});
				suites.forEach(function (suite) {
					it("Test " + suite, function () {
						var dfd = this.async();
						iframe = document.createElement("iframe");
						iframe.addEventListener("load", dfd.rejectOnError(function () {
							iframe.contentWindow.addEventListener("message", dfd.rejectOnError(function (event) {
								var suite = JSON.parse(event.data);
								if (suite.__error) {
									dfd.reject(suite.__error);
								} else if (suite.name === "main") {
									if (suite.numFailedTests > 0) {
										throw new Error(suite.numFailedTests + " out of "
											+ suite.numTests + " sandbox tests have been failed.");
									}
									dfd.resolve(1);
								}
							}));
						}));
						iframe.style.width = iframe.style.height = "100%";
						iframe.src = require.toUrl(runner || "liaison/tests/sandbox/client.html")
							+ "?config=liaison/tests/sandbox/intern&suites=" + suite;
						document.body.appendChild(iframe);
					});
				});
			});
		}
	};
});
