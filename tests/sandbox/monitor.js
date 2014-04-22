define(["dojo/topic"], function (topic) {
	var failedTests = [];
	topic.subscribe("/test/fail", failedTests.push.bind(failedTests));
	topic.subscribe("/suite/end", function (event) {
		var data = Object.create(event.toJSON());
		data.failedTests = failedTests;
		if (window.sandboxDiagData) {
			data.diagData = window.sandboxDiagData;
		}
		window.sandboxResult = {
			state: "/suite/end",
			data: data
		};
	});
	topic.subscribe("/suite/error", function (event) {
		var data = {
			name: event.name,
			message: event.message,
			stack: "" + (event.stack || event)
		};
		if (window.sandboxDiagData) {
			data.diagData = window.sandboxDiagData;
		}
		window.sandboxResult = {
			state: "/suite/error",
			data: data
		};
	});
	topic.subscribe("/error", function (error) {
		var data = {
			name: error.name,
			message: error.message,
			stack: "" + (error.stack || error)
		};
		if (window.sandboxDiagData) {
			data.diagData = window.sandboxDiagData;
		}
		window.sandboxResult = {
			state: "/error",
			data: data
		};
	});
	return topic;
});
