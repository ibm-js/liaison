define([
	"intern!bdd",
	"intern/chai!expect",
	"../../Observable",
	"../../BindingTarget",
	"../waitFor",
	"requirejs-text/text!../../tests/delite/templates/buttonTemplate.html",
	"requirejs-text/text!../../tests/delite/templates/buttonPointerTemplate.html",
	"requirejs-text/text!../../tests/delite/templates/starRatingTemplate.html",
	"deliteful/Button",
	"deliteful/StarRating",
	"../../delite/templateBinderExtension",
	"../sandbox/monitor"
], function (bdd, expect, Observable, BindingTarget, waitFor, buttonTemplate, buttonPointerTemplate, starRatingTemplate) {
	/* jshint withstmt: true */
	/* global describe, afterEach, it */
	with (bdd) {
		describe("Test liaison/delite/templateBinderExtension", function () {
			var handles = [];
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					handle.remove();
				}
			});
/*
			// TODO(asudoh): Wait for deliteful/Button.js to be merged
			it("Simple binding: <d-button>", function () {
				var model = new Observable({label: "Foo"}),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				this.timeout = 10000;
				template.innerHTML = buttonTemplate;
				handles.push(template.bind("bind", model));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					return (template.nextSibling || {}).textContent;
				}).then(function () {
					var w = template.nextSibling;
					expect(w.textContent).to.equal("Foo");
					expect(w.bindings.label.value).to.equal("Foo");
					w.label = "Bar";
				}).then(waitFor.create(function () {
					return model.label !== "Foo";
				})).then(function () {
					expect(model.label).to.equal("Bar");
				}).then(waitFor.create(function () {
					return template.nextSibling.textContent !== "Foo";
				})).then(function () {
					var w = template.nextSibling;
					expect(w.textContent).to.equal("Bar");
					model.set("label", "Baz");
				}).then(waitFor.create(function () {
					return template.nextSibling.textContent !== "Bar";
				})).then(function () {
					var w = template.nextSibling;
					expect(w.textContent).to.equal("Baz");
				});
			});
			it("Pointer binding: <d-button>", function () {
				var model = new Observable({label: "Foo"}),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				this.timeout = 10000;
				template.innerHTML = buttonPointerTemplate;
				handles.push(template.bind("bind", model));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					return (template.nextSibling || {}).textContent;
				}).then(function () {
					var w = template.nextSibling;
					expect(w.textContent).to.equal("Foo");
					expect(w.bindings._label.value).to.equal("Foo");
					w.label = "Bar";
				}).then(waitFor.create(function () {
					return model.label !== "Foo";
				})).then(function () {
					expect(model.label).to.equal("Bar");
				}).then(waitFor.create(function () {
					return template.nextSibling.textContent !== "Foo";
				})).then(function () {
					var w = template.nextSibling;
					expect(w.textContent).to.equal("Bar");
					model.set("label", "Baz");
				}).then(waitFor.create(function () {
					return template.nextSibling.textContent !== "Bar";
				})).then(function () {
					var w = template.nextSibling;
					expect(w.textContent).to.equal("Baz");
				});
			});
*/
			it("Simple binding: <d-star-rating>", function () {
				var model = new Observable({rating: 2}),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				this.timeout = 10000;
				template.innerHTML = starRatingTemplate;
				handles.push(template.bind("bind", model));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					return ((template.nextSibling || {}).nextSibling || {}).value;
				}).then(function () {
					var w = template.nextSibling.nextSibling;
					expect(w.value).to.equal(2);
					expect(w.bindings.value.value).to.equal(2);
					w.value = 4;
				}).then(waitFor.create(function () {
					return model.rating !== 2;
				})).then(function () {
					expect(model.rating).to.equal(4);
					model.set("rating", 3);
				}).then(waitFor.create(function () {
					return template.nextSibling.nextSibling.value !== 4;
				})).then(function () {
					var w = template.nextSibling.nextSibling;
					expect(w.value).to.equal(3);
				});
			});
		});
	}
});
