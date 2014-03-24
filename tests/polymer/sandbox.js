define(["liaison/tests/sandbox/create"], function (create) {
	create([
		"liaison/tests/polymer/wrapper",
		"liaison/tests/polymer/wrapperProto",
		"liaison/tests/polymer/BindingTarget"
	], "liaison/tests/polymer/client.html", [
		{
			browserName: "internet explorer",
			version: "9"
		}
	]); // TODO(asudoh): Add more tests for Polymer
});
