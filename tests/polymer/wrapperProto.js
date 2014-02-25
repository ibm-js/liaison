define([
	"intern!bdd",
	"intern/chai!expect",
	"dojo/text!./templates/computedPolymerElementTemplate.html",
	"dojo/text!./templates/computedArrayPolymerElementTemplate.html"
], function (bdd, expect, computedPolymerElementTemplate, computedArrayPolymerElementTemplate) {
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
				var dfd = this.async(2000),
					template = document.createElement("template");
				template.innerHTML = computedPolymerElementTemplate;
				document.head.appendChild(document.importNode(template.content, true));
				setTimeout(dfd.rejectOnError(function () {
					var elem = document.createElement("liaison-test-basic");
					expect(elem.name).to.equal("John Doe");
					elem.first = "Ben";
					setTimeout(dfd.callback(function () {
						expect(elem.name).to.equal("Ben Doe");
					}), 500);
				}), 500);
			});
			it("Computed array", function () {
				var dfd = this.async(2000),
					template = document.createElement("template");
				template.innerHTML = computedArrayPolymerElementTemplate;
				document.head.appendChild(document.importNode(template.content, true));
				setTimeout(dfd.rejectOnError(function () {
					var elem = document.createElement("liaison-test-collection");
					expect(elem.totalNameLength).to.equal(45);
					elem.items.push({Name: "John Jacklin"});
					setTimeout(dfd.callback(function () {
						expect(elem.totalNameLength).to.equal(57);
					}), 500);
				}), 500);
			});
		});
	}
});
