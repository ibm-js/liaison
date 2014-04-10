define(["./intern"], function (intern) {
	var config = {
		proxyPort: 9000,

		proxyUrl: "http://localhost:9000/",

		capabilities: {
			"selenium-version": "2.37.0",
			"idle-timeout": 60
		},

		environments: [
			{browserName: "internet explorer", version: "9", platform: "Windows 7"},
			{browserName: "internet explorer", version: "10", platform: "Windows 8"},
			{browserName: "internet explorer", version: "11", platform: "Windows 8.1"},
			{browserName: "firefox", version: "25", platform: [/*"OS X 10.6",*/ "Linux", "Windows 7"]},
			{browserName: "chrome", version: "", platform: [/*"OS X 10.6", */ "Linux", "Windows 7"]},
			{browserName: "safari", version: "6", platform: "OS X 10.8"},
			{browserName: "safari", version: "7", platform: "OS X 10.9"},
			// {browserName: "android", platform: "Linux", version: "4.1"},
			// {browserName: "android", platform: "Linux", "device-type": "tablet", version: "4.1"},
			// {browserName: "android", platform: "Linux", version: "4.1"},
			// {browserName: "android", platform: "Linux", "device-type": "tablet", version: "4.0"},
			// {browserName: "android", platform: "Linux", version: "4.0"},
			// Non-empty selenium-version causes "browser failed to start" error for unknown reason
			{browserName: "iphone", platform: "OS X 10.9", version: "7", "device-orientation": "portrait", "selenium-version": ""},
			{browserName: "ipad", platform: "OS X 10.9", version: "7", "device-orientation": "portrait", "selenium-version": ""},
			{browserName: "iphone", platform: "OS X 10.8", version: "6.1", "device-orientation": "portrait", "selenium-version": ""},
			{browserName: "ipad", platform: "OS X 10.8", version: "6.1", "device-orientation": "portrait", "selenium-version": ""},
			{browserName: "iphone", platform: "OS X 10.8", version: "6.0", "device-orientation": "portrait", "selenium-version": ""},
			{browserName: "ipad", platform: "OS X 10.8", version: "6.0", "device-orientation": "portrait", "selenium-version": ""}
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
		]
	};

	for (var key in intern) {
		if (key !== "suites") {
			config[key] = intern[key];
		}
	}

	return config;
});
