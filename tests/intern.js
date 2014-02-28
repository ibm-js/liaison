// To run the test cases:
//     With node.js:
//         > cd /path/to/liaison/
//         > cd ..
//         > node liaison/node_modules/intern/bin/intern-client.js config=liaison/tests/intern
//     With browser: http://yourserver/path/to/liaison/node_modules/intern/client.html?config=tests/intern
define({
	loader: {
		baseUrl: typeof window !== "undefined" ? "../../.." : undefined,
		packages: ["liaison"],
		map: {
			liaison: {
				"intern/lib/reporters/webdriver": "intern/lib/reporters/webdriver"
			},
			"*": {
				"intern/lib/reporters/webdriver": "liaison/tests/reporters/webdriver"
			}
		}
	},
	useLoader: {
		"host-node": "dojo/dojo",
		"host-browser": "../../../requirejs/require.js"
	},
	suites: ["liaison/tests/all"],
	excludeInstrumentation: /^((liaison(\/|\\)(node_modules|tests))|requirejs|dojo|dcl)/
});
