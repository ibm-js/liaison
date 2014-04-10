define([
	"intern!bdd",
	"intern/chai!expect",
	"../../polymer/computed",
	"../waitFor"
], function (bdd, expect, computed, waitFor) {
	/* jshint withstmt: true */
	/* global describe, afterEach, it */
	with (bdd) {
		describe("Test liaison/computed with Polymer", function () {
			var handles = [];
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					typeof handle.close === "function" ? handle.close() : handle.remove();
				}
			});
			it("Computed property", function () {
				var dfd = this.async(10000),
					link = document.createElement("link");
				link.addEventListener("load", dfd.rejectOnError(function () {
					waitFor(dfd, function () {
						/* global Polymer */
						return Polymer.getRegisteredPrototype("liaison-test-computed");
					}, function () {
						var elem = document.createElement("liaison-test-computed");
						document.body.appendChild(elem);
						handles.push({
							remove: function () {
								if (document.body.contains(elem)) {
									document.body.removeChild(elem);
								}
							}
						});
						expect(elem.name).to.equal("John Doe");
						elem.first = "Ben";
						setTimeout(dfd.rejectOnError(function () {
							expect(elem.name).to.equal("Ben Doe");
							document.body.removeChild(elem);
							setTimeout(dfd.callback(function () {
								expect(elem.computed).to.be.null;
							}), 500);
						}), 500);
					});
				}));
				link.href = "./imports/computed.html";
				link.rel = "import";
				document.head.appendChild(link);
			});
			it("Computed array", function () {
				var dfd = this.async(10000),
					link = document.createElement("link");
				link.addEventListener("load", dfd.rejectOnError(function () {
					waitFor(dfd, function () {
						/* global Polymer */
						return Polymer.getRegisteredPrototype("liaison-test-computedarray");
					}, function () {
						var elem = document.createElement("liaison-test-computedarray");
						expect(elem.totalNameLength).to.equal(45);
						elem.items.push({Name: "John Jacklin"});
						setTimeout(dfd.callback(function () {
							expect(elem.totalNameLength).to.equal(57);
						}), 500);
					});
				}));
				link.href = "./imports/computedArray.html";
				link.rel = "import";
				document.head.appendChild(link);
			});
		});
	}
});
