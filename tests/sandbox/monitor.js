define(["intern/dojo/topic"], function (topic) {
	var failedTests = [];
	// Early setup of error handler before Intern sets one up
	window.onerror = function (message, url, lineNumber, columnNumber, error) {
		var data = {
			message: message,
			url: url,
			lineNumber: lineNumber
		};
		if (columnNumber !== undefined) {
			data.columnNumber = columnNumber;
		}
		if (error) {
			data.name = error.name;
			data.stack = "" + (error.stack || error);
		}
		window.sandboxResult = {
			state: "/error",
			data: data
		};
	};
	return function () {
		topic.subscribe("/test/fail", failedTests.push.bind(failedTests));
		topic.subscribe("/suite/end", function (event) {
			var data = Object.create(event.toJSON());
			data.failedTests = failedTests;
			window.sandboxResult = {
				state: "/suite/end",
				data: data
			};
		});
		topic.subscribe("/suite/error", function (event) {
			window.sandboxResult = {
				state: "/suite/error",
				data: {
					name: event.name,
					message: event.message,
					stack: "" + (event.stack || event)
				}
			};
		});
		topic.subscribe("/error", function (error) {
			window.sandboxResult = {
				state: "/error",
				data: {
					name: error.name,
					message: error.message,
					stack: "" + (error.stack || error)
				}
			};
		});
	};
});
