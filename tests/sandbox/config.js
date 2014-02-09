(function () {
	var config = this.__internConfig,
		internUrl = config.internUrl;
	config.packages = [
		{name: "intern", location: internUrl}
	];
	config.map = {
		intern: {
			dojo: "intern/node_modules/dojo",
			chai: "intern/node_modules/chai/chai"
		},
		"liaison/tests/sandbox/monitor": {
			"dojo/topic": "intern/node_modules/dojo/topic"
		},
		"*": {
			"intern/dojo": "intern/node_modules/dojo"
		}
	};
})();
