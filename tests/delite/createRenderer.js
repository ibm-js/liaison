define([
	"intern!bdd",
	"intern/chai!expect",
	"dojo/Deferred",
	"delite/register",
	"delite/Widget",
	"../../Observable",
	"../../ObservableArray",
	"../../ObservablePath",
	"../../delite/createRenderer",
	"../waitFor",
	"../../delite/createRenderer!./templates/inputTemplate.html",
	"requirejs-text/text!./templates/widgetWithInputTemplate.html",
	"requirejs-text/text!./templates/starRatingTemplate.html",
	"requirejs-text/text!./templates/widgetWithStarRatingTemplate.html",
	"../../delite/createRenderer!./templates/nestedTemplate.html",
	"requirejs-text/text!./templates/widgetWithNestedTemplate.html",
	"../../delite/createRenderer!./templates/nestedRepeatingTemplate.html",
	"requirejs-text/text!./templates/widgetWithNestedRepeatingTemplate.html",
	"../../delite/createRenderer!./templates/nestedWidgetTemplate.html",
	"../../delite/createRenderer!./templates/complexAttributeTemplate.html",
	"../../delite/createRenderer!./templates/attachPointTemplate.html",
	"../../delite/createRenderer!./templates/simpleWithAlternateBindingTemplate.html",
	"../../delite/createRenderer!../templates/eventTemplate.html",
	"deliteful/StarRating",
	"../../delite/TemplateBinderExtension",
	"../sandbox/monitor"
], function (
	bdd,
	expect,
	Deferred,
	register,
	Widget,
	Observable,
	ObservableArray,
	ObservablePath,
	createRenderer,
	waitFor,
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
					w = new InputTemplateWidget({object: new Observable({value: "Foo"})}).placeAt(document.body);
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				waitFor(function () {
					// Mixin properties are applied after template is instantiated
					var input = w.querySelector("input");
					return input && input.value === "Foo";
				}).then(dfd.callback(function () {
					// Mixin properties are applied after template is instantiated
					var input = w.querySelector("input");
					expect(input.value).to.equal("Foo");
					input.value = "Bar";
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					input.dispatchEvent(event);
					expect(w.object.value).to.equal("Bar");
				}), dfd.reject.bind(dfd));
			});
			it("Template with <input>: Declarative", function () {
				var dfd = this.async(10000),
					div = document.createElement("div"),
					observable = new Observable({object: new Observable({value: "Foo"})}),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = widgetWithInputTemplate;
				handles.push(template.bind("bind", observable));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				waitFor(function () {
					// Mixin properties are applied after template is instantiated
					var input = div.querySelector("input");
					return input && input.value === "Foo";
				}).then(dfd.callback(function () {
					var input = div.querySelector("liaison-test-input").querySelector("input");
					input.value = "Bar";
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					input.dispatchEvent(event);
					expect(observable.object.value).to.equal("Bar");
				}), dfd.reject.bind(dfd));
			});
			it("Template with <d-star-rating>: Programmatic", function () {
				var dfd = this.async(10000),
					w = new StarRatingTemplateWidget({rating: 2, allowZero: false}).placeAt(document.body);
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				waitFor(function () {
					// Mixin properties are applied after template is instantiated
					var star = w.querySelector("d-star-rating");
					return star && star.value === 2;
				}).then(dfd.callback(function () {
					var star = w.querySelector("d-star-rating");
					expect(star.allowZero).to.be.false;
					star.value = 4;
					expect(w.rating).to.equal(4);
				}), dfd.reject.bind(dfd));
			});
			it("Template with <d-star-rating>: Declarative", function () {
				var dfd = this.async(10000),
					div = document.createElement("div"),
					observable = new Observable({rating: 2, allowZero: false}),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = widgetWithStarRatingTemplate;
				handles.push(template.bind("bind", observable));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				waitFor(function () {
					var star = div.querySelector("d-star-rating");
					return star && star.value === 2;
				}).then(dfd.callback(function () {
					var star = div.querySelector("liaison-test-starrating").querySelector("d-star-rating");
					expect(star.allowZero).to.be.false;
					star.value = 4;
					expect(observable.rating).to.equal(4);
				}), dfd.reject.bind(dfd));
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
				waitFor(function () {
					return w.getElementsByTagName("input").length === 2;
				}).then(function () {
					if (w.firstChild.nodeType === Node.COMMENT_NODE) {
						w.removeChild(w.firstChild);
					}
					expect(w.childNodes[0].nodeValue).to.equal("John ");
					expect(w.childNodes[1].value).to.equal("John");
					expect(w.childNodes[3].textContent).to.equal("Ben ");
					expect(w.childNodes[4].value).to.equal("Ben");
				}).then(waitFor.bind(function () {
					var dfd = new Deferred();
					handles.push(new ObservablePath(w, "first").observe(dfd.resolve.bind(dfd)));
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					w.childNodes[1].value = "Anne";
					w.childNodes[1].dispatchEvent(event);
					w.childNodes[4].value = "Irene";
					w.childNodes[4].dispatchEvent(event);
					return dfd.promise;
				})).then(waitFor.bind(0)).then(dfd.callback(function () {
					// Make sure deliverAllByTimeout() finishes sending all change records before running below code
					expect(w.childNodes[0].nodeValue).to.equal("Anne ");
					expect(w.childNodes[3].textContent).to.equal("Irene ");
				}), dfd.reject.bind(dfd));
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
				waitFor(function () {
					return div.getElementsByTagName("input").length === 2;
				}).then(function () {
					var w = div.querySelector("liaison-test-nested");
					if (w.firstChild.nodeType === Node.COMMENT_NODE) {
						w.removeChild(w.firstChild);
					}
					expect(w.childNodes[0].nodeValue).to.equal("John ");
					expect(w.childNodes[1].value).to.equal("John");
					expect(w.childNodes[3].textContent).to.equal("Ben ");
					expect(w.childNodes[4].value).to.equal("Ben");
				}).then(waitFor.bind(function () {
					var w = div.querySelector("liaison-test-nested"),
						dfd = new Deferred();
					handles.push(new ObservablePath(w, "first").observe(dfd.resolve.bind(dfd)));
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					w.childNodes[1].value = "Anne";
					w.childNodes[1].dispatchEvent(event);
					w.childNodes[4].value = "Irene";
					w.childNodes[4].dispatchEvent(event);
					return dfd.promise;
				})).then(waitFor.bind(0)).then(dfd.callback(function () {
					// Make sure deliverAllByTimeout() finishes sending all change records before running below code
					var w = div.querySelector("liaison-test-nested");
					expect(w.childNodes[0].nodeValue).to.equal("Anne ");
					expect(w.childNodes[3].textContent).to.equal("Irene ");
					expect(observable.first).to.equal("Anne");
					expect(observable.name.first).to.equal("Irene");
				}), dfd.reject.bind(dfd));
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
				waitFor(function () {
					return w.getElementsByTagName("input").length === 5;
				}).then(function () {
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
				}).then(waitFor.bind(function () {
					var dfd = new Deferred();
					handles.push(ObservableArray.observe(w.names, dfd.resolve.bind(dfd)));
					w.names.reverse();
					return dfd.promise;
				})).then(waitFor.bind(0)).then(dfd.callback(function () {
					// Make sure deliverAllByTimeout() finishes sending all change records before running below code
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
				}), dfd.reject.bind(dfd));
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
				waitFor(function () {
					return div.getElementsByTagName("input").length === 5;
				}).then(function () {
					var w = div.querySelector("liaison-test-nestedrepeating");
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
				}).then(waitFor.bind(function () {
					var w = div.querySelector("liaison-test-nestedrepeating"),
						dfd = new Deferred();
					handles.push(ObservableArray.observe(w.names, dfd.resolve.bind(dfd)));
					observable.names.reverse();
					return dfd.promise;
				})).then(waitFor.bind(0)).then(dfd.callback(function () {
					// Make sure deliverAllByTimeout() finishes sending all change records before running below code
					var w = div.querySelector("liaison-test-nestedrepeating");
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
				}), dfd.reject.bind(dfd));
			});
			it("Nested widget template", function () {
				var dfd = this.async(10000),
					w = new NestedWidgetTemplateWidget({name: new Observable({value: "John"})}).placeAt(document.body);
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				waitFor(function () {
					// Mixin properties are applied after template is instantiated
					var input = w.querySelector("input");
					return input && input.value === "John";
				}).then(dfd.resolve.bind(dfd), dfd.reject.bind(dfd));
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
				waitFor(function () {
					// Mixin properties are applied after template is instantiated
					var span = w.querySelector("span");
					return span && span.getAttribute("attrib") === "First name: John";
				}).then(dfd.resolve.bind(dfd), dfd.reject.bind(dfd));
			});
			it("Attach point", function () {
				var dfd = this.async(10000),
					w = new AttachPointTemplateWidget().placeAt(document.body);
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				waitFor(function () {
					return w.valueNode;
				}).then(dfd.callback(function () {
					expect(w.valueNode).to.equal(w.querySelector("input"));
				}), dfd.reject.bind(dfd));
			});
			it("Simple binding with default alternate binding factory", function () {
				var dfd = this.async(10000),
					w = new AlternateBindingTemplateWidget({
						first: "John"
					}).placeAt(document.body);
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				waitFor(function () {
					var input = w.querySelector("input");
					return input && input.value === "John";
				}).then(function () {
					if (w.firstChild.nodeType === Node.COMMENT_NODE) {
						w.removeChild(w.firstChild);
					}
					expect(w.firstChild.textContent).to.equal("*John* ");
				}).then(waitFor.bind(function () {
					var dfd = new Deferred();
					handles.push(new ObservablePath(w, "first").observe(dfd.resolve.bind(dfd)));
					var input = w.querySelector("input");
					input.value = "Anne";
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					input.dispatchEvent(event);
					return dfd.promise;
				})).then(waitFor.bind(0)).then(dfd.callback(function () {
					// Make sure deliverAllByTimeout() finishes sending all change records
					expect(w.firstChild.textContent).to.equal("*Anne* ");
				}), dfd.reject.bind(dfd));
			});
			it("Declarative events", function () {
				function createDeclarativeEventResolver(dfd) {
					return function () {
						dfd.resolve([].slice.call(arguments));
					};
				}
				var senderDiv,
					targetDiv,
					dfd = this.async(10000),
					dfd1stClick = new Deferred(),
					dfd2ndClick = new Deferred(),
					w = new EventTemplateWidget({
						handleClick: createDeclarativeEventResolver(dfd1stClick)
					}).placeAt(document.body);
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				waitFor(500).then(function () {
					senderDiv = w.firstChild;
					targetDiv = senderDiv.firstChild;
					var event = document.createEvent("MouseEvents");
					event.initEvent("click", true, true);
					targetDiv.dispatchEvent(event);
				}).then(waitFor.bind(dfd1stClick.promise)).then(function (data) {
					var event = data[0],
						sender = data[2];
					expect(event.type).to.equal("click");
					expect(sender).to.equal(senderDiv);
					w.set("handleClick", createDeclarativeEventResolver(dfd2ndClick));
				}).then(waitFor.bind(500)).then(function () {
					var event = document.createEvent("MouseEvents");
					event.initEvent("click", true, true);
					targetDiv.dispatchEvent(event);
				}).then(waitFor.bind(dfd2ndClick.promise)).then(dfd.callback(function (data) {
					var event = data[0],
						sender = data[2];
					expect(event.type).to.equal("click");
					expect(sender).to.equal(senderDiv);
				}), dfd.reject.bind(dfd));
			});
		});
	}
});
