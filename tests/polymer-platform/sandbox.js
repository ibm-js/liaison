define(["liaison/tests/sandbox/create"], function (create) {
	create([
		"liaison/tests/polymer-platform/computed",
		"liaison/tests/polymer-platform/BindingTarget",
		"liaison/tests/polymer-platform/EventBindingSource"
	], "liaison/tests/polymer-platform/client.html", [
		{
			browserName: "internet explorer",
			version: "9"
		},
		{
			browserName: "android"
		}
	]); // TODO(asudoh): Add more tests for Polymer
});
