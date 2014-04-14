define([
	"intern!bdd",
	"intern/chai!expect",
	"../../Observable",
	"../../BindingTarget",
	"../waitFor",
	"requirejs-text/text!../../tests/delite/templates/buttonTemplate.html",
	"requirejs-text/text!../../tests/delite/templates/starRatingTemplate.html",
	"deliteful/Button",
	"deliteful/StarRating",
	"../../delite/TemplateBinderExtension"
], function (bdd, expect, Observable, BindingTarget, waitFor, buttonTemplate, starRatingTemplate) {
	/* jshint withstmt: true */
	/* global describe, afterEach, it */
	with (bdd) {
		describe("Test liaison/delite/TemplateBinderExtension", function () {
			var handles = [];
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					handle.remove();
				}
			});
			it("Simple binding: <d-button>", function () {
				var dfd = this.async(10000),
					model = new Observable({label: "Foo"}),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = buttonTemplate;
				handles.push(template.bind("bind", model));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				waitFor(function () {
					return (template.nextSibling || {}).textContent;
				}).then(function () {
					var w = template.nextSibling;
					expect(w.textContent).to.equal("Foo");
					expect(w.bindings.label.value).to.equal("Foo");
					w.label = "Bar";
					expect(model.label).to.equal("Bar");
				}).then(waitFor.bind(function () {
					return template.nextSibling.textContent !== "Foo";
				})).then(function () {
					var w = template.nextSibling;
					expect(w.textContent).to.equal("Bar");
					model.set("label", "Baz");
				}).then(waitFor.bind(function () {
					return template.nextSibling.textContent !== "Bar";
				})).then(dfd.callback(function () {
					var w = template.nextSibling;
					expect(w.textContent).to.equal("Baz");
				}), dfd.reject.bind(dfd));
			});
			it("Simple binding: <d-star-rating>", function () {
				var dfd = this.async(10000),
					model = new Observable({rating: 2}),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = starRatingTemplate;
				handles.push(template.bind("bind", model));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				waitFor(function () {
					return ((template.nextSibling || {}).nextSibling || {}).value;
				}).then(function () {
					var w = template.nextSibling.nextSibling;
					expect(w.value).to.equal(2);
					expect(w.bindings.value.value).to.equal(2);
					w.value = 4;
					expect(model.rating).to.equal(4);
					model.set("rating", 3);
				}).then(waitFor.bind(function () {
					return template.nextSibling.nextSibling.value !== 4;
				})).then(dfd.callback(function () {
					var w = template.nextSibling.nextSibling;
					expect(w.value).to.equal(3);
				}), dfd.reject.bind(dfd));
			});
		});
	}
});
