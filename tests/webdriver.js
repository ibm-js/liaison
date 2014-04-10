define(["./intern"], function (intern) {
	var config = {
		proxyPort: 9000,

		proxyUrl: "http://localhost:9000/",

		capabilities: {
			"selenium-version": "2.37.0",
			"idle-timeout": 60
		},

		environments: [
			{browserName: "internet explorer"},
			{browserName: "firefox"},
			{browserName: "chrome"}
		],

		maxConcurrency: 3,

		useSauceConnect: false,

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
