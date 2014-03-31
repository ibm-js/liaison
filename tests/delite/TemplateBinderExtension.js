define([
	"intern!bdd",
	"intern/chai!expect",
	"../../Observable",
	"../../BindingTarget",
	"dojo/text!../../tests/delite/templates/buttonTemplate.html",
	"dojo/text!../../tests/delite/templates/starRatingTemplate.html",
	"deliteful/Button",
	"deliteful/StarRating",
	"../../delite/TemplateBinderExtension"
], function (bdd, expect, Observable, BindingTarget, buttonTemplate, starRatingTemplate) {
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
				setTimeout(dfd.rejectOnError(function () {
					var w = template.nextSibling;
					expect(w.textContent).to.equal("Foo");
					expect(w.bindings.label.value).to.equal("Foo");
					w.label = "Bar";
					expect(model.label).to.equal("Bar");
					setTimeout(dfd.rejectOnError(function () {
						expect(w.textContent).to.equal("Bar");
						model.set("label", "Baz");
						setTimeout(dfd.callback(function () {
							expect(w.textContent).to.equal("Baz");
						}), 500);
					}), 500);
				}), 500);
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
				setTimeout(dfd.rejectOnError(function () {
					var w = template.nextSibling.nextSibling;
					expect(w.value).to.equal(2);
					expect(w.bindings.value.value).to.equal(2);
					w.value = 4;
					expect(model.rating).to.equal(4);
					model.set("rating", 3);
					setTimeout(dfd.callback(function () {
						expect(w.value).to.equal(3);
					}), 500);
				}), 100);
			});
		});
	}
});
