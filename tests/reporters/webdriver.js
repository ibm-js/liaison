define(["intern/lib/reporters/webdriver"], function (webdriver) {
	var augmented = Object.create(webdriver);
	augmented["/test/fail"] = function (test) {
		// Older IE does not have .stack property in Error
		if (!test.error.stack) {
			test.error.stack = "" + test.error;
		}
		webdriver["/test/fail"].apply(this, arguments);
	};
	return augmented;
});
