define([
	"require",
    "intern!object"
], function (require, registerSuite) {
	return function (suites, runner, excludeEnvironments) {
		suites = typeof suites.join === "function" ? suites : [suites];
		registerSuite(suites.reduce(function (o, suite) {
			o["Test " + suite] = function () {
				var exclude = excludeEnvironments && excludeEnvironments.some(function (env) {
					return Object.keys(env).every(function (s) {
						return env[s] === this.remote.environmentType[s];
					}, this);
				}, this);
				if (!exclude) {
					var url = require.toUrl(runner || "liaison/tests/sandbox/client.html")
						+ "?config=liaison/tests/sandbox/intern&reporters=liaison/tests/reporters/sandbox&suites=" + suite;
					this.timeout = 60000;
					return this.remote
						.get(url)
						.waitForCondition("!!window.sandboxResult", 60000)
						.execute("return JSON.stringify(window.sandboxResult);")
						.then(function (result) {
							result = JSON.parse(result);
							var message;
							if (result.state === "/error" || result.state === "/suite/error") {
								message = "Error occured in sandbox: " + (result.data.stack || result.data.message);
							} else if ((result.data.failedTests || []).length > 0) {
								message = result.data.failedTests.map(function (test) {
									// test.error is JSON instead of actual error object
									return "FAIL: " + test.id + " (" + test.timeElapsed + "ms)"
										+ (test.error ? "\n" + (test.error.stack || test.error.message) : "");
								}).join("\n");
							} else if (result.data.numFailedTests > 0) {
								message = result.data.numFailedTests + " out of " + result.data.numTests + " sandbox tests have been failed.";
							}
							if (message) {
								throw new Error(message + (result.data.diagData ? "\nDiagnosis data:\n" + JSON.stringify(result.data.diagData) : ""));
							}
						});
				}
			};
			return o;
		}, {
			name: "Test " + suites.join(", ")
		}));
	};
});
