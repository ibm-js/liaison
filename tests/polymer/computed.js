define([
	"intern!bdd",
	"intern/chai!expect",
	"dojo/Deferred",
	"../../polymer/computed",
	"../waitFor"
], function (bdd, expect, Deferred, computed, waitFor) {
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
				var elem,
					dfd = this.async(10000),
					link = document.createElement("link");
				link.href = "./imports/computed.html";
				link.rel = "import";
				document.head.appendChild(link);
				waitFor(function () {
					/* global Polymer */
					return Polymer.getRegisteredPrototype("liaison-test-computed");
				}).then(function () {
					elem = document.createElement("liaison-test-computed");
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
				}).then(waitFor.bind(function () {
					return elem.name !== "John Doe";
				})).then(function () {
					expect(elem.name).to.equal("Ben Doe");
					document.body.removeChild(elem);
				}).then(waitFor.bind(function () {
					return !elem.computed;
				})).then(dfd.resolve.bind(dfd), dfd.reject.bind(dfd));
			});
			it("Computed array", function () {
				var dfd = this.async(10000),
					link = document.createElement("link");
				link.href = "./imports/computedArray.html";
				link.rel = "import";
				document.head.appendChild(link);
				waitFor(function () {
					/* global Polymer */
					return Polymer.getRegisteredPrototype("liaison-test-computedarray");
				}).then(function () {
					var elem = document.createElement("liaison-test-computedarray");
					expect(elem.totalNameLength).to.equal(45);
					elem.items.push({Name: "John Jacklin"});
				}).then(waitFor.bind(function () {
					return document.createElement("liaison-test-computedarray").totalNameLength !== 45;
				})).then(dfd.callback(function () {
					var elem = document.createElement("liaison-test-computedarray");
					expect(elem.totalNameLength).to.equal(57);
				}), dfd.reject.bind(dfd));
			});
		});
	}
});
