define([
	"intern!bdd",
	"intern/chai!expect",
	"delite/register",
	"delite/Widget",
	"../../Observable",
	"../../ObservableArray",
	"../../ObservablePath",
	"../../delite/createRenderer",
	"../../delite/createRenderer!./templates/inputTemplate.html",
	"dojo/text!./templates/widgetWithInputTemplate.html",
	"dojo/text!./templates/starRatingTemplate.html",
	"dojo/text!./templates/widgetWithStarRatingTemplate.html",
	"../../delite/createRenderer!./templates/nestedTemplate.html",
	"dojo/text!./templates/widgetWithNestedTemplate.html",
	"../../delite/createRenderer!./templates/nestedRepeatingTemplate.html",
	"dojo/text!./templates/widgetWithNestedRepeatingTemplate.html",
	"../../delite/createRenderer!./templates/nestedWidgetTemplate.html",
	"../../delite/createRenderer!./templates/complexAttributeTemplate.html",
	"../../delite/createRenderer!./templates/attachPointTemplate.html",
	"../../delite/createRenderer!./templates/simpleWithAlternateBindingTemplate.html",
	"../../delite/createRenderer!../templates/eventTemplate.html",
	"deliteful/StarRating",
	"../../delite/TemplateBinderExtension"
], function (
	bdd,
	expect,
	register,
	Widget,
	Observable,
	ObservableArray,
	ObservablePath,
	createRenderer,
	renderInputTemplate,
	widgetWithInputTemplate,
	starRatingTemplate,
	widgetWithStarRatingTemplate,
	renderNestedTemplate,
	widgetWithNestedTemplate,
	renderNestedRepeatingTemplate,
	widgetWithNestedRepeatingTemplate,
	renderNestedWidgetTemplate,
	renderComplexAttributeTemplate,
	renderAttachPointTemplate,
	renderAlternateBindingTemplate,
	renderEventsTemplate
) {
	/* jshint withstmt: true */
	/* global describe, afterEach, it */
	with (bdd) {
		describe("Test liaison/delite/createRenderer", function () {
			var handles = [],
				InputTemplateWidget = register("liaison-test-input", [HTMLElement, Widget], {
					buildRendering: renderInputTemplate,
					baseClass: "liaison-test-input",
					object: undefined
				}),
				StarRatingTemplateWidget = register("liaison-test-starrating", [HTMLElement, Widget], {
					buildRendering: createRenderer(starRatingTemplate),
					baseClass: "liaison-test-starrating",
					rating: 0,
					zeroAreaWidth: 8
				}),
				NestedTemplateWidget = register("liaison-test-nested", [HTMLElement, Widget], {
					buildRendering: renderNestedTemplate,
					baseClass: "liaison-test-nested",
					first: undefined,
					name: undefined
				}),
				NestedRepeatingTemplateWidget = register("liaison-test-nestedrepeating", [HTMLElement, Widget], {
					buildRendering: renderNestedRepeatingTemplate,
					baseClass: "liaison-test-nestedrepeating",
					names: undefined
				}),
				NestedWidgetTemplateWidget = register("liaison-test-nestedwidget", [HTMLElement, Widget], {
					buildRendering: renderNestedWidgetTemplate,
					baseClass: "liaison-test-nestedwidget",
					name: undefined
				}),
				ComplexAttributeTemplateWidget = register("liaison-test-complexattribute", [HTMLElement, Widget], {
					buildRendering: renderComplexAttributeTemplate,
					baseClass: "liaison-test-complexattribute",
					name: undefined
				}),
				AttachPointTemplateWidget = register("liaison-test-attachpoint", [HTMLElement, Widget], {
					buildRendering: renderAttachPointTemplate,
					baseClass: "liaison-test-attachpoint"
				}),
				AlternateBindingTemplateWidget = register("liaison-test-alternatebinding", [HTMLElement, Widget], {
					buildRendering: renderAlternateBindingTemplate,
					baseClass: "liaison-test-alternatebinding",
					createBindingSourceFactory: function (descriptor) {
						var match = /(\w+):(.*)/.exec(descriptor),
							key = (match || [])[1],
							path = (match || [])[2];
						if (key === "decorated") {
							return function (model) {
								return new ObservablePath(model, path, function (value) {
									return "*" + value + "*";
								});
							};
						}
					},
					first: undefined
				}),
				EventTemplateWidget = register("liaison-test-events", [HTMLElement, Widget], {
					buildRendering: renderEventsTemplate,
					baseClass: "liaison-test-events",
					handleClick: undefined
				});
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					handle.remove();
				}
			});
			it("Template with <input>: Programmatic", function () {
				var dfd = this.async(10000),
					w = new InputTemplateWidget({object: new Observable({value: "Foo"})}).placeAt(document.body),
					input = w.querySelector("input");
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				setTimeout(dfd.callback(function () {
					// Mixin properties are applied after template is instantiated
					expect(input.value).to.equal("Foo");
					input.value = "Bar";
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					input.dispatchEvent(event);
					expect(w.object.value).to.equal("Bar");
				}), 500);
			});
			it("Template with <input>: Declarative", function () {
				var dfd = this.async(10000),
					div = document.createElement("div"),
					observable = new Observable({object: new Observable({value: "Foo"})}),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = widgetWithInputTemplate;
				handles.push(template.bind("bind", observable));
				document.body.appendChild(div);
				setTimeout(dfd.rejectOnError(function () {
					var input = div.querySelector("liaison-test-input").querySelector("input");
					handles.push({
						remove: function () {
							document.body.removeChild(div);
						}
					});
					setTimeout(dfd.callback(function () {
						expect(input.value).to.equal("Foo");
						input.value = "Bar";
						var event = document.createEvent("HTMLEvents");
						event.initEvent("input", false, true);
						input.dispatchEvent(event);
						expect(observable.object.value).to.equal("Bar");
					}), 500);
				}), 100);
			});
			it("Template with <d-star-rating>: Programmatic", function () {
				var dfd = this.async(10000),
					w = new StarRatingTemplateWidget({rating: 2}).placeAt(document.body),
					star = w.querySelector("d-star-rating");
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				setTimeout(dfd.callback(function () {
					// Mixin properties are applied after template is instantiated
					expect(star.value).to.equal(2);
					expect(star.zeroAreaWidth).to.equal(8);
					star.value = 4;
					expect(w.rating).to.equal(4);
				}), 500);
			});
			it("Template with <d-star-rating>: Declarative", function () {
				var dfd = this.async(10000),
					div = document.createElement("div"),
					observable = new Observable({rating: 2, zeroAreaWidth: 8}),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = widgetWithStarRatingTemplate;
				handles.push(template.bind("bind", observable));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				setTimeout(dfd.rejectOnError(function () {
					var star = div.querySelector("liaison-test-starrating").querySelector("d-star-rating");
					setTimeout(dfd.callback(function () {
						expect(star.value).to.equal(2);
						expect(star.zeroAreaWidth).to.equal(8);
						star.value = 4;
						expect(observable.rating).to.equal(4);
					}), 500);
				}), 100);
			});
			it("Nested template: Programmatic", function () {
				var dfd = this.async(10000),
					w = new NestedTemplateWidget({
						first: "John",
						name: new Observable({
							first: "Ben"
						})
					}).placeAt(document.body);
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				setTimeout(dfd.rejectOnError(function () {
					if (w.firstChild.nodeType === Node.COMMENT_NODE) {
						w.removeChild(w.firstChild);
					}
					expect(w.childNodes[0].nodeValue).to.equal("John ");
					expect(w.childNodes[1].value).to.equal("John");
					expect(w.childNodes[3].textContent).to.equal("Ben ");
					expect(w.childNodes[4].value).to.equal("Ben");
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					handles.push(new ObservablePath(w, "first").observe(dfd.rejectOnError(function () {
						setTimeout(dfd.callback(function () {
							expect(w.childNodes[0].nodeValue).to.equal("Anne ");
							expect(w.childNodes[3].textContent).to.equal("Irene ");
						}), 0);
					})));
					w.childNodes[1].value = "Anne";
					w.childNodes[1].dispatchEvent(event);
					w.childNodes[4].value = "Irene";
					w.childNodes[4].dispatchEvent(event);
				}), 500);
			});
			it("Nested template: Declarative", function () {
				var dfd = this.async(10000),
					div = document.createElement("div"),
					observable = new Observable({first: "John", name: new Observable({first: "Ben"})}),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = widgetWithNestedTemplate;
				handles.push(template.bind("bind", observable));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				setTimeout(dfd.rejectOnError(function () {
					var w = div.querySelector("liaison-test-nested");
					setTimeout(dfd.rejectOnError(function () {
						if (w.firstChild.nodeType === Node.COMMENT_NODE) {
							w.removeChild(w.firstChild);
						}
						expect(w.childNodes[0].nodeValue).to.equal("John ");
						expect(w.childNodes[1].value).to.equal("John");
						expect(w.childNodes[3].textContent).to.equal("Ben ");
						expect(w.childNodes[4].value).to.equal("Ben");
						var event = document.createEvent("HTMLEvents");
						event.initEvent("input", false, true);
						handles.push(new ObservablePath(w, "first").observe(dfd.rejectOnError(function () {
							setTimeout(dfd.callback(function () {
								expect(w.childNodes[0].nodeValue).to.equal("Anne ");
								expect(w.childNodes[3].textContent).to.equal("Irene ");
								expect(observable.first).to.equal("Anne");
								expect(observable.name.first).to.equal("Irene");
							}), 0);
						})));
						w.childNodes[1].value = "Anne";
						w.childNodes[1].dispatchEvent(event);
						w.childNodes[4].value = "Irene";
						w.childNodes[4].dispatchEvent(event);
					}), 500);
				}), 100);
			});
			it("Nested repeating template: Programmatic", function () {
				var dfd = this.async(10000),
					w = new NestedRepeatingTemplateWidget({
						names: new ObservableArray(
							{first: "Anne"},
							{first: "Ben"},
							{first: "Chad"},
							{first: "Irene"},
							{first: "John"}
						)
					}).placeAt(document.body);
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				setTimeout(dfd.rejectOnError(function () {
					expect(w.childNodes[1].textContent).to.equal("Anne ");
					expect(w.childNodes[2].value).to.equal("Anne");
					expect(w.childNodes[3].textContent).to.equal("Ben ");
					expect(w.childNodes[4].value).to.equal("Ben");
					expect(w.childNodes[5].textContent).to.equal("Chad ");
					expect(w.childNodes[6].value).to.equal("Chad");
					expect(w.childNodes[7].textContent).to.equal("Irene ");
					expect(w.childNodes[8].value).to.equal("Irene");
					expect(w.childNodes[9].textContent).to.equal("John ");
					expect(w.childNodes[10].value).to.equal("John");
					handles.push(ObservableArray.observe(w.names, dfd.rejectOnError(function () {
						setTimeout(dfd.callback(function () {
							expect(w.childNodes[1].textContent).to.equal("John ");
							expect(w.childNodes[2].value).to.equal("John");
							expect(w.childNodes[3].textContent).to.equal("Irene ");
							expect(w.childNodes[4].value).to.equal("Irene");
							expect(w.childNodes[5].textContent).to.equal("Chad ");
							expect(w.childNodes[6].value).to.equal("Chad");
							expect(w.childNodes[7].textContent).to.equal("Ben ");
							expect(w.childNodes[8].value).to.equal("Ben");
							expect(w.childNodes[9].textContent).to.equal("Anne ");
							expect(w.childNodes[10].value).to.equal("Anne");
						}), 0);
					})));
					w.names.reverse();
				}), 500);
			});
			it("Nested repeating template: Declarative", function () {
				var dfd = this.async(10000),
					div = document.createElement("div"),
					observable = new Observable({
						names: new ObservableArray(
							{first: "Anne"},
							{first: "Ben"},
							{first: "Chad"},
							{first: "Irene"},
							{first: "John"}
						)
					}),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = widgetWithNestedRepeatingTemplate;
				handles.push(template.bind("bind", observable));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				setTimeout(dfd.rejectOnError(function () {
					var w = div.querySelector("liaison-test-nestedrepeating");
					setTimeout(dfd.rejectOnError(function () {
						expect(w.childNodes[1].textContent).to.equal("Anne ");
						expect(w.childNodes[2].value).to.equal("Anne");
						expect(w.childNodes[3].textContent).to.equal("Ben ");
						expect(w.childNodes[4].value).to.equal("Ben");
						expect(w.childNodes[5].textContent).to.equal("Chad ");
						expect(w.childNodes[6].value).to.equal("Chad");
						expect(w.childNodes[7].textContent).to.equal("Irene ");
						expect(w.childNodes[8].value).to.equal("Irene");
						expect(w.childNodes[9].textContent).to.equal("John ");
						expect(w.childNodes[10].value).to.equal("John");
						handles.push(ObservableArray.observe(observable.names, dfd.rejectOnError(function () {
							setTimeout(dfd.callback(function () {
								expect(w.childNodes[1].textContent).to.equal("John ");
								expect(w.childNodes[2].value).to.equal("John");
								expect(w.childNodes[3].textContent).to.equal("Irene ");
								expect(w.childNodes[4].value).to.equal("Irene");
								expect(w.childNodes[5].textContent).to.equal("Chad ");
								expect(w.childNodes[6].value).to.equal("Chad");
								expect(w.childNodes[7].textContent).to.equal("Ben ");
								expect(w.childNodes[8].value).to.equal("Ben");
								expect(w.childNodes[9].textContent).to.equal("Anne ");
								expect(w.childNodes[10].value).to.equal("Anne");
							}), 0);
						})));
						observable.names.reverse();
					}), 500);
				}), 100);
			});
			it("Nested widget template", function () {
				var dfd = this.async(10000),
					w = new NestedWidgetTemplateWidget({name: new Observable({value: "John"})}).placeAt(document.body);
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				setTimeout(dfd.callback(function () {
					// Mixin properties are applied after template is instantiated
					expect(w.querySelector("input").value).to.equal("John");
				}), 500);
			});
			it("Template with complex attribtue", function () {
				var dfd = this.async(10000),
					w = new ComplexAttributeTemplateWidget({
						name: new Observable({first: "John"})
					}).placeAt(document.body);
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				setTimeout(dfd.callback(function () {
					// Mixin properties are applied after template is instantiated
					expect(w.querySelector("span").getAttribute("attrib")).to.equal("First name: John");
				}), 500);
			});
			it("Attach point", function () {
				var dfd = this.async(10000),
					w = new AttachPointTemplateWidget().placeAt(document.body);
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				setTimeout(dfd.callback(function () {
					expect(w.valueNode).to.equal(w.querySelector("input"));
				}), 500);
			});
			it("Simple binding with default alternate binding factory", function () {
				var dfd = this.async(10000),
					w = new AlternateBindingTemplateWidget({
						first: "John"
					}).placeAt(document.body),
					input = w.querySelector("input");
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				setTimeout(dfd.rejectOnError(function () {
					if (w.firstChild.nodeType === Node.COMMENT_NODE) {
						w.removeChild(w.firstChild);
					}
					expect(w.firstChild.textContent).to.equal("*John* ");
					expect(input.value).to.equal("John");
					input.value = "Anne";
					handles.push(new ObservablePath(w, "first").observe(dfd.rejectOnError(function () {
						setTimeout(dfd.callback(function () {
							expect(w.firstChild.textContent).to.equal("*Anne* ");
						}), 0);
					})));
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					input.dispatchEvent(event);
				}), 500);
			});
			it("Declarative events", function () {
				var event,
					senderDiv,
					targetDiv,
					dfd = this.async(10000),
					w = new EventTemplateWidget({
						handleClick: dfd.rejectOnError(function (event, detail, sender) {
							expect(event.type).to.equal("click");
							expect(sender).to.equal(senderDiv);
							w.set("handleClick", dfd.callback(function (event, detail, sender) {
								expect(event.type).to.equal("click");
								expect(sender).to.equal(senderDiv);
							}));
							setTimeout(dfd.rejectOnError(function () {
								event = document.createEvent("MouseEvents");
								event.initEvent("click", true, true);
								targetDiv.dispatchEvent(event);
							}), 500);
						})
					}).placeAt(document.body);
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				setTimeout(dfd.rejectOnError(function () {
					senderDiv = w.firstChild;
					targetDiv = senderDiv.firstChild;
					event = document.createEvent("MouseEvents");
					event.initEvent("click", true, true);
					targetDiv.dispatchEvent(event);
				}), 500);
			});
		});
	}
});
