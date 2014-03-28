// To run the test cases: http://yourserver/path/to/liaison/tests/sandbox/client.html?config=liaison/tests/sandbox/intern
define({
	loader: {
		baseUrl: "../../..",
		packages: ["liaison"],
		map: {
			"liaison/tests/patches/Widget": {
				"delite/Widget": "delite/Widget"
			},
			"*": {
				"delite/Widget": "liaison/tests/patches/Widget"
			}
		}
	}
});
