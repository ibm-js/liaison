define([
	"intern!bdd",
	"intern/chai!expect"
], function (bdd, expect) {
	/* jshint withstmt: true, newcap: false */
	/* global describe, afterEach, it */
	with (bdd) {
		describe("Test liaison/wrapperProto with Polymer", function () {
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
					require(["liaison/polymer/wrapperProto"], dfd.rejectOnError(function () {
						// Wait for <liaison-test-basic>'s dependency, and wait another 100ms to make sure <liaison-test-basic> is registered
						setTimeout(dfd.rejectOnError(function () {
							var elem = document.createElement("liaison-test-basic");
							expect(elem.name).to.equal("John Doe");
							elem.first = "Ben";
							setTimeout(dfd.callback(function () {
								expect(elem.name).to.equal("Ben Doe");
							}), 500);
						}), 100);
					}));
				}));
				link.href = "./imports/computed.html";
				link.rel = "import";
				document.head.appendChild(link);
			});
			it("Computed array", function () {
				var dfd = this.async(10000),
					link = document.createElement("link");
				link.addEventListener("load", dfd.rejectOnError(function () {
					require(["liaison/polymer/wrapperProto"], dfd.rejectOnError(function () {
						// Wait for <liaison-test-basic>'s dependency, and wait another 100ms to make sure <liaison-test-basic> is registered
						setTimeout(dfd.rejectOnError(function () {
							var elem = document.createElement("liaison-test-collection");
							expect(elem.totalNameLength).to.equal(45);
							elem.items.push({Name: "John Jacklin"});
							setTimeout(dfd.callback(function () {
								expect(elem.totalNameLength).to.equal(57);
							}), 500);
						}), 100);
					}));
				}));
				link.href = "./imports/computedArray.html";
				link.rel = "import";
				document.head.appendChild(link);
			});
		});
	}
});
