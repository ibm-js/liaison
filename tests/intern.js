// To run the test cases:
//     With node.js:
//         > cd /path/to/liaison/
//         > node node_modules/intern/bin/intern-client.js config=tests/intern
//     With browser: http://yourserver/path/to/liaison/node_modules/intern/client.html?config=tests/intern
define({
	loader: {
		baseUrl: typeof window !== "undefined" ? "../../.." : "..",
		packages: ["liaison"]
	},
	useLoader: {
		"host-node": "dojo/dojo",
		"host-browser": "../../../requirejs/require.js"
	},
	suites: ["liaison/tests/all"],
	excludeInstrumentation: /^((liaison(\/|\\)(node_modules|tests))|delite(|ful)|dpointer|requirejs|dojo|dcl|platform|polymer)/
});
