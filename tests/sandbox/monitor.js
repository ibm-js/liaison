define(["intern/dojo/topic"], function (topic) {
	// Early setup of error handler before Intern sets one up
	window.onerror = function (message, url, lineNumber, columnNumber, error) {
		var data = {
			topic: "/error",
			event: {
				message: message,
				url: url,
				lineNumber: lineNumber
			}
		};
		if (columnNumber !== undefined) {
			data.event.columnNumber = columnNumber;
		}
		if (error) {
			data.event.name = error.name;
			data.event.stack = "" + (error.stack || error);
		}
		// Try waiting for iframe's onload/onReadyStateChange event fires
		setTimeout(window.postMessage.bind(window, JSON.stringify(data), "*"), 10000);
	};
	return function () {
		[
			"start",
			"stop",
			"/suite/start",
			"/suite/end",
			"/suite/error",
			"/test/start",
			"/test/end",
			"/test/pass",
			"/test/fail"
		].forEach(function (entry) {
			topic.subscribe(entry, function (event) {
				window.postMessage(JSON.stringify({
					topic: entry,
					event: event.toJSON()
				}), "*");
			});
		});
		topic.subscribe("/error", function (error) {
			window.postMessage(JSON.stringify({
				topic: "/error",
				event: {
					name: error.name,
					message: error.message,
					stack: "" + (error.stack || error)
				}
			}), "*");
		});
	};
});
