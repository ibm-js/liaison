define(["./intern"], function (intern) {
	var config = {
		environments: [
			{browserName: "internet explorer"},
			{browserName: "firefox"},
			{browserName: "chrome"}
		],

		useSauceConnect: false
	};

	for (var key in intern) {
		if (!(key in config)) {
			config[key] = intern[key];
		}
	}

	return config;
});
