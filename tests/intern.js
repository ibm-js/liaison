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

	proxyPort: 9000,

	proxyUrl: "http://localhost:9000/",

	capabilities: {
		"selenium-version": "2.37.0",
		"idle-timeout": 60
	},

	environments: [
		{browserName: "internet explorer", version: "9", platform: "Windows 7", name: "liaison"},
		{browserName: "internet explorer", version: "10", platform: "Windows 8", name: "liaison"},
		{browserName: "internet explorer", version: "11", platform: "Windows 8.1", name: "liaison"},
		{browserName: "firefox", version: "25", platform: [/*"OS X 10.6",*/ "Linux", "Windows 7"], name: "liaison"},
		{browserName: "chrome", version: "", platform: [/*"OS X 10.6", */ "Linux", "Windows 7"], name: "liaison"},
		{browserName: "safari", version: "6", platform: "OS X 10.8", name: "liaison"},
		{browserName: "safari", version: "7", platform: "OS X 10.9", name: "liaison"},
		// {browserName: "android", platform: "Linux", version: "4.1", name: "liaison"},
		// {browserName: "android", platform: "Linux", "device-type": "tablet", version: "4.1", name: "liaison"},
		// {browserName: "android", platform: "Linux", version: "4.1", name: "liaison"},
		// {browserName: "android", platform: "Linux", "device-type": "tablet", version: "4.0", name: "liaison"},
		// {browserName: "android", platform: "Linux", version: "4.0", name: "liaison"},
		// Non-empty selenium-version causes "browser failed to start" error for unknown reason
		{browserName: "iphone", platform: "OS X 10.9", version: "7", "device-orientation": "portrait", "selenium-version": "", name: "liaison"},
		{browserName: "ipad", platform: "OS X 10.9", version: "7", "device-orientation": "portrait", "selenium-version": "", name: "liaison"},
		// {browserName: "iphone", platform: "OS X 10.8", version: "6.0", "device-orientation": "portrait", "selenium-version": "", name: "liaison"},
		// {browserName: "ipad", platform: "OS X 10.8", version: "6.0", "device-orientation": "portrait", "selenium-version": "", name: "liaison"},
		{browserName: "iphone", platform: "OS X 10.8", version: "6.1", "device-orientation": "portrait", "selenium-version": "", name: "liaison"},
		{browserName: "ipad", platform: "OS X 10.8", version: "6.1", "device-orientation": "portrait", "selenium-version": "", name: "liaison"}
	],

	maxConcurrency: 3,

	useSauceConnect: true,

	webdriver: {
		host: "localhost",
		port: 4444
	},

	suites: ["liaison/tests/all"],

	functionalSuites: [
		"liaison/tests/delite/sandbox",
		"liaison/tests/polymer/sandbox",
		"liaison/tests/polymer-platform/sandbox",
		"liaison/tests/delite-polymer/sandbox"
	],

	excludeInstrumentation: /^((liaison(\/|\\)(node_modules|tests))|delite(|ful)|dpointer|requirejs|dojo|dcl|platform|polymer)/
});
