define(function () {
	var writeHtml = true;

	if (writeHtml) {
		var suiteNode = document.body,
			testNode,
			scroll = function () {
				window.scrollTo(0, document.documentElement.scrollHeight || document.body.scrollHeight);
			};
	}

	return {
		"/suite/end": function () {
			if (writeHtml) {
				suiteNode = suiteNode.parentNode.parentNode || document.body;
			}
		},

		"/suite/start": writeHtml ? function (suite) {
			var oldSuiteNode = suiteNode;

			suiteNode = document.createElement("ol");

			if (oldSuiteNode === document.body) {
				oldSuiteNode.appendChild(suiteNode);
			}
			else {
				var outerSuiteNode = document.createElement("li"),
					headerNode = document.createElement("div");

				headerNode.appendChild(document.createTextNode(suite.name));
				outerSuiteNode.appendChild(headerNode);
				outerSuiteNode.appendChild(suiteNode);
				oldSuiteNode.appendChild(outerSuiteNode);
			}

			scroll();
		} : null,

		"/test/start": writeHtml ? function (test) {
			testNode = document.createElement("li");
			testNode.appendChild(document.createTextNode(test.name));
			suiteNode.appendChild(testNode);
			scroll();
		} : null,

		"/test/pass": writeHtml ? function (test) {
			testNode.appendChild(document.createTextNode(" passed (" + test.timeElapsed + "ms)"));
			testNode.style.color = "green";
			scroll();
		} : null,

		"/test/fail": writeHtml ? function (test) {
			testNode.appendChild(document.createTextNode(" failed (" + test.timeElapsed + "ms)"));
			testNode.style.color = "red";

			var errorNode = document.createElement("pre");
			errorNode.appendChild(document.createTextNode(test.error.stack || test.error));
			testNode.appendChild(errorNode);
			scroll();
		} : null
	};
});
