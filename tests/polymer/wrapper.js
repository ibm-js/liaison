define([
	"intern!bdd",
	"intern/chai!expect",
	"../../wrapper",
	"dojo/text!./templates/computedTemplate.html",
	"dojo/text!./templates/computedArrayTemplate.html"
], function (bdd, expect, wrapper, computedTemplate, computedArrayTemplate) {
	/* jshint withstmt: true */
	/* global describe, afterEach, it, PathObserver */
	with (bdd) {
		describe("Test liaison/wrapper with Polymer", function () {
			var handles = [];
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					typeof handle.close === "function" ? handle.close() : handle.remove();
				}
			});
			it("Computed property", function () {
				var changeCount = 0,
					dfd = this.async(1000),
					o = wrapper.wrap({
						first: "John",
						last: "Doe",
						name: wrapper.computed(function (first, last) {
							return first + " " + last;
						}, "first", "last"),
						nameLength: wrapper.computed(function (name) {
							return name.length;
						}, "name")
					});
				new PathObserver(o, "name").open(dfd.rejectOnError(function (name, oldName) {
					expect(name).to.equal("Ben Doe");
					expect(oldName).to.equal("John Doe");
					if (++changeCount >= 2) {
						dfd.resolve(1);
					}
				}));
				new PathObserver(o, "nameLength").open(dfd.rejectOnError(function (length, oldLength) {
					expect(length).to.equal(7);
					expect(oldLength).to.equal(8);
					if (++changeCount >= 2) {
						dfd.resolve(1);
					}
				}));
				o.first = "Ben";
			});
			it("Computed array", function () {
				var dfd = this.async(1000),
					o = wrapper.wrap({
						items: [
							{Name: "Anne Ackerman"},
							{Name: "Ben Beckham"},
							{Name: "Chad Chapman"},
							{Name: "Irene Ira"}
						],
						totalNameLength: wrapper.computedArray(function (a) {
							return a.reduce(function (length, entry) {
								return length + entry.Name.length;
							}, 0);
						}, "items")
					});
				new PathObserver(o, "totalNameLength").open(dfd.callback(function (length, oldLength) {
					expect(length).to.equal(57);
					expect(oldLength).to.equal(45);
				}));
				o.items.push({Name: "John Jacklin"});
			});
			it("Computed property with template", function () {
				var dfd = this.async(2000),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = computedTemplate;
				template.setAttribute("bind", "");
				template.model = wrapper.wrap({
					first: "John",
					last: "Doe",
					name: wrapper.computed(function (first, last) {
						return first + " " + last;
					}, "first", "last"),
					nameLength: wrapper.computed(function (name) {
						return name.length;
					}, "name")
				});
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						template.model = undefined;
						document.body.removeChild(div);
					}
				});
				setTimeout(dfd.rejectOnError(function () {
					var divName = template.nextSibling,
						divNameLength = divName.nextSibling;
					expect(divName.firstChild.nodeValue).to.equal("John Doe");
					expect(divNameLength.firstChild.nodeValue).to.equal("8");
					template.model.first = "Ben";
					setTimeout(dfd.callback(function () {
						expect(divName.firstChild.nodeValue).to.equal("Ben Doe");
						expect(divNameLength.firstChild.nodeValue).to.equal("7");
					}), 500);
				}), 500);
			});
			it("Computed array with template", function () {
				var dfd = this.async(2000),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = computedArrayTemplate;
				template.setAttribute("bind", "");
				template.model = wrapper.wrap({
					items: [
						{Name: "Anne Ackerman"},
						{Name: "Ben Beckham"},
						{Name: "Chad Chapman"},
						{Name: "Irene Ira"}
					],
					totalNameLength: wrapper.computedArray(function (a) {
						return a.reduce(function (length, entry) {
							return length + entry.Name.length;
						}, 0);
					}, "items")
				});
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						template.model = undefined;
						document.body.removeChild(div);
					}
				});
				setTimeout(dfd.rejectOnError(function () {
					var text = template.nextSibling;
					expect(text.nodeValue).to.equal("45");
					template.model.items.push({Name: "John Jacklin"});
					setTimeout(dfd.callback(function () {
						expect(text.nodeValue).to.equal("57");
					}), 500);
				}), 500);
			});
		});
	}
});
