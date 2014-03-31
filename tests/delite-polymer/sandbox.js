define(["liaison/tests/sandbox/create"], function (create) {
	create([
		"liaison/tests/delite-polymer/createRenderer"
	], "liaison/tests/delite-polymer/client.html", [
		{
			browserName: "internet explorer",
			version: "9"
		},
		{
			browserName: "android"
		}
	]); // TODO(asudoh): Add more tests for Polymer
});
