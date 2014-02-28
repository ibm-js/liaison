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
		"*": {
			"intern/dojo": "intern/node_modules/dojo"
		}
	};
})();
