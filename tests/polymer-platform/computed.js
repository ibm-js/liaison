define([
	"intern!bdd",
	"intern/chai!expect",
	"dojo/Deferred",
	"../../polymer/computed",
	"../waitFor",
	"dojo/text!./templates/computedTemplate.html",
	"dojo/text!./templates/computedArrayTemplate.html"
], function (bdd, expect, Deferred, computed, waitFor, computedTemplate, computedArrayTemplate) {
	/* jshint withstmt: true */
	/* global describe, afterEach, it, PathObserver */
	with (bdd) {
		describe("Test liaison/computed with Polymer", function () {
			var handles = [];
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					typeof handle.close === "function" ? handle.close() : handle.remove();
				}
			});
			it("Computed property", function () {
				var observer,
					changeCount = 0,
					dfd = this.async(10000),
					o = {
						first: "John",
						last: "Doe",
						name: computed(function (first, last) {
							return first + " " + last;
						}, "first", "last"),
						nameLength: computed(function (name) {
							return name.length;
						}, "name")
					};
				handles.push.apply(handles, computed.apply(o));
				handles.push(observer = new PathObserver(o, "name"));
				observer.open(dfd.rejectOnError(function (name, oldName) {
					expect(name).to.equal("Ben Doe");
					expect(oldName).to.equal("John Doe");
					if (++changeCount >= 2) {
						dfd.resolve(1);
					}
				}));
				handles.push(observer = new PathObserver(o, "nameLength"));
				observer.open(dfd.rejectOnError(function (length, oldLength) {
					expect(length).to.equal(7);
					expect(oldLength).to.equal(8);
					if (++changeCount >= 2) {
						dfd.resolve(1);
					}
				}));
				o.first = "Ben";
			});
			it("Computed array", function () {
				var observer,
					dfd = this.async(10000),
					o = {
						items: [
							{Name: "Anne Ackerman"},
							{Name: "Ben Beckham"},
							{Name: "Chad Chapman"},
							{Name: "Irene Ira"}
						],
						totalNameLength: computed.array(function (a) {
							return a.reduce(function (length, entry) {
								return length + entry.Name.length;
							}, 0);
						}, "items")
					};
				handles.push.apply(handles, computed.apply(o));
				handles.push(observer = new PathObserver(o, "totalNameLength"));
				observer.open(dfd.callback(function (length, oldLength) {
					expect(length).to.equal(57);
					expect(oldLength).to.equal(45);
				}));
				o.items.push({Name: "John Jacklin"});
			});
			it("Computed property with template", function () {
				var dfd = this.async(10000),
					model = {
						first: "John",
						last: "Doe",
						name: computed(function (first, last) {
							return first + " " + last;
						}, "first", "last")
					},
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = computedTemplate;
				template.setAttribute("bind", "");
				template.model = model;
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						template.model = undefined;
						document.body.removeChild(div);
					}
				});
				waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					var divName = template.nextSibling,
						divNameLength = divName.nextSibling;
					expect(divName.firstChild.nodeValue).to.equal("John Doe");
					expect(divNameLength.firstChild.nodeValue).to.equal("8");
					template.model.first = "Ben";
					return waitFor(function () {
						return divName.firstChild.nodeValue !== "John Doe";
					});
				}).then(function () {
					var divName = template.nextSibling,
						divNameLength = divName.nextSibling;
					expect(divName.firstChild.nodeValue).to.equal("Ben Doe");
					expect(divNameLength.firstChild.nodeValue).to.equal("7");
					template.model = undefined;
					return waitFor(function () {
						return !template.nextSibling;
					});
				}).then(function () {
					model.first = "Irene";
					return waitFor.time(100);
				}).then(dfd.callback(function () {
					expect(model.name).not.to.equal("Irene Doe");
				}), dfd.reject.bind(dfd));
			});
			it("Computed array with template", function () {
				var dfd = this.async(10000),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = computedArrayTemplate;
				template.setAttribute("bind", "");
				template.model = {
					items: [
						{Name: "Anne Ackerman"},
						{Name: "Ben Beckham"},
						{Name: "Chad Chapman"},
						{Name: "Irene Ira"}
					],
					totalNameLength: computed.array(function (a) {
						return a.reduce(function (length, entry) {
							return length + entry.Name.length;
						}, 0);
					}, "items")
				};
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						template.model = undefined;
						document.body.removeChild(div);
					}
				});
				waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					var text = template.nextSibling;
					expect(text.nodeValue).to.equal("45");
					template.model.items.push({Name: "John Jacklin"});
					return waitFor(function () {
						return text.nodeValue !== "45";
					});
				}).then(dfd.callback(function () {
					var text = template.nextSibling;
					expect(text.nodeValue).to.equal("57");
				}), dfd.reject.bind(dfd));
			});
			it("Prevent template from cleaning up computed property", function () {
				var dfd = this.async(10000),
					model = {
						first: "John",
						last: "Doe",
						name: computed(function (first, last) {
							return first + " " + last;
						}, "first", "last")
					},
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = computedTemplate;
				template.preventRemoveComputed = true;
				template.setAttribute("bind", "");
				template.model = model;
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						template.model = undefined;
						document.body.removeChild(div);
					}
				});
				waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					template.model = undefined;
					return waitFor(function () {
						return !template.nextSibling;
					});
				}).then(function () {
					model.first = "Irene";
					return waitFor((function () {
						var dfd = new Deferred(),
							observer = new PathObserver(model, "name");
						handles.push(observer);
						observer.open(function (value) {
							if (value !== "John") {
								dfd.resolve(value);
							}
						});
						return dfd.promise;
					})());
				}).then(dfd.callback(function (value) {
					expect(value).to.equal("Irene Doe");
				}), dfd.reject.bind(dfd));
			});
		});
	}
});
