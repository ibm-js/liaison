// To run the test cases:
//     With node.js:
//         > cd /path/to/liaison/node_modules/intern
//         > bin/intern-client.js config=../../../tests/intern
//     With browser: http://yourserver/path/to/liaison/node_modules/intern/client.html?config=/path/to/liaison/tests/intern
define({
	loader: {
		baseUrl: "../../..",
		packages: ["liaison"]
	},
	suites: ["liaison/tests/all"]
});
