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
	"../../delite/createRenderer!../delite/templates/inputTemplate.html",
	"requirejs-text/text!../delite/templates/widgetWithInputTemplate.html",
	"requirejs-text/text!../delite/templates/starRatingTemplate.html",
	"requirejs-text/text!../delite/templates/widgetWithStarRatingTemplate.html",
	"../../delite/createRenderer!../delite/templates/nestedTemplate.html",
	"requirejs-text/text!../delite/templates/widgetWithNestedTemplate.html",
	"../../delite/createRenderer!../delite/templates/nestedRepeatingTemplate.html",
	"requirejs-text/text!../delite/templates/widgetWithNestedRepeatingTemplate.html",
	"../../delite/createRenderer!../delite/templates/nestedWidgetTemplate.html",
	"../../delite/createRenderer!../delite/templates/complexAttributeTemplate.html",
	"../../delite/createRenderer!../delite/templates/simpleWithAlternateBindingTemplate.html",
	"../../delite/createRenderer!./templates/attributeTemplate.html",
	"../../delite/createRenderer!../templates/eventTemplate.html",
	"deliteful/StarRating",
	"../../delite/templateBinderExtension",
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
	renderAlternateBindingTemplate,
	renderAttributeTemplate,
	renderEventsTemplate
) {
	/* jshint withstmt: true */
	/* global describe, afterEach, it */
	with (bdd) {
		describe("Test liaison/delite-polymer/createRenderer", function () {
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
					allowZero: true
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
				AttributeTemplateWidget = register("liaison-test-attributetempate", [HTMLElement, Widget], {
					buildRendering: renderAttributeTemplate,
					baseClass: "liaison-test-attributetempate",
					handleClick: undefined
				}),
				EventTemplateWidget = register("liaison-test-events", [HTMLElement, Widget], {
					buildRendering: renderEventsTemplate,
					baseClass: "liaison-test-events",
					handleClick: undefined
				}),
				NestedEventTemplateWidget = register("liaison-test-nested-events", [HTMLElement, Widget], {
					buildRendering: createRenderer("<liaison-test-nested-events-inner></liaison-test-nested-events-inner>"),
					baseClass: "liaison-test-nested-events",
					handleClick: undefined
				});
			register("liaison-test-nested-events-inner", [HTMLElement, Widget], {
				buildRendering: createRenderer("<liaison-test-events></liaison-test-events>"),
				baseClass: "liaison-test-nested-events-inner",
				handleClick: undefined
			});
			function createDeclarativeEventResolver(dfd) {
				return function () {
					var a = [].slice.call(arguments);
					a.unshift(this);
					dfd.resolve(a);
				};
			}
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					handle.remove();
				}
			});
			it("Template with <input>: Programmatic", function () {
				var w = new InputTemplateWidget({object: new Observable({value: "Foo"})}).placeAt(document.body),
					input = w.querySelector("input");
				this.timeout = 10000;
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				return waitFor(function () {
					// Mixin properties are applied after template is instantiated
					var input = w.querySelector("input");
					return input && input.value === "Foo";
				}).then(function () {
					input.value = "Bar";
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					input.dispatchEvent(event);
					expect(w.object.value).to.equal("Bar");
				});
			});
			it("Template with <input>: Declarative", function () {
				var div = document.createElement("div"),
					observable = new Observable({object: new Observable({value: "Foo"})}),
					template = div.appendChild(document.createElement("template"));
				this.timeout = 10000;
				template.innerHTML = widgetWithInputTemplate;
				template.setAttribute("bind", "");
				template.model = observable;
				handles.push({
					remove: template.unbind.bind(template, "iterator") // TODO(asudoh): Review unbind method with future Polymer versions
				});
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					// Mixin properties are applied after template is instantiated
					var input = div.querySelector("input");
					return input && input.value === "Foo";
				}).then(function () {
					var input = div.querySelector("liaison-test-input").querySelector("input");
					expect(input.value).to.equal("Foo");
					input.value = "Bar";
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					input.dispatchEvent(event);
					expect(observable.object.value).to.equal("Bar");
				});
			});
			it("Template with <d-star-rating>: Programmatic", function () {
				var w = new StarRatingTemplateWidget({rating: 2, allowZero: false}).placeAt(document.body);
				this.timeout = 10000;
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				return waitFor(function () {
					var star = w.querySelector("d-star-rating");
					// Mixin properties are applied after template is instantiated
					return star && star.value !== undefined && star.value !== 0 && star.allowZero !== undefined && star.allowZero !== true;
				}).then(function () {
					var star = w.querySelector("d-star-rating");
					expect(star.value).to.equal(2);
					expect(star.allowZero).to.be.false;
					star.value = 4;
				}).then(waitFor.create(function () {
					return w.rating !== 2;
				})).then(function () {
					expect(w.rating).to.equal(4);
				});
			});
			it("Template with <d-star-rating>: Declarative", function () {
				var div = document.createElement("div"),
					observable = new Observable({rating: 2, allowZero: false}),
					template = div.appendChild(document.createElement("template"));
				this.timeout = 10000;
				template.innerHTML = widgetWithStarRatingTemplate;
				template.setAttribute("bind", "");
				template.model = observable;
				handles.push({
					remove: template.unbind.bind(template, "iterator") // TODO(asudoh): Review unbind method with future Polymer versions
				});
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					var starTemplateWidget = div.querySelector("liaison-test-starrating"),
						star = starTemplateWidget && starTemplateWidget.querySelector("d-star-rating");
					// Mixin properties are applied after template is instantiated
					return star && star.value !== undefined && star.value !== 0 && star.allowZero !== undefined && star.allowZero !== true;
				}).then(function () {
					var star = div.querySelector("liaison-test-starrating").querySelector("d-star-rating");
					expect(star.value).to.equal(2);
					expect(star.allowZero).to.be.false;
					star.value = 4;
				}).then(waitFor.create(function () {
					return observable.rating !== 2;
				})).then(function () {
					expect(observable.rating).to.equal(4);
				});
			});
			it("Nested template: Programmatic", function () {
				var w = new NestedTemplateWidget({
						first: "John",
						name: new Observable({
							first: "Ben"
						})
					}).placeAt(document.body);
				this.timeout = 10000;
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				return waitFor(function () {
					return [
						(w.childNodes[0] || {}).nodeValue,
						(w.childNodes[1] || {}).value,
						(w.childNodes[3] || {}).textContent,
						(w.childNodes[4] || {}).value
					].every(function (value) {
						return value && value.trim();
					});
				}).then(function () {
					expect(w.childNodes[0].nodeValue).to.equal("John ");
					expect(w.childNodes[1].value).to.equal("John");
					expect(w.childNodes[3].textContent).to.equal("Ben ");
					expect(w.childNodes[4].value).to.equal("Ben");
				}).then(waitFor.create(function () {
					var dfd = new Deferred();
					handles.push(new ObservablePath(w, "first").observe(dfd.resolve.bind(dfd)));
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					w.childNodes[1].value = "Anne";
					w.childNodes[1].dispatchEvent(event);
					w.childNodes[4].value = "Irene";
					w.childNodes[4].dispatchEvent(event);
					return dfd.promise;
				})).then(waitFor.create(0)).then(function () {
					// Make sure deliverAllByTimeout() finishes sending all change records before running below test
					expect(w.childNodes[0].nodeValue).to.equal("Anne ");
					expect(w.childNodes[3].textContent).to.equal("Irene ");
				});
			});
			it("Nested template: Declarative", function () {
				var div = document.createElement("div"),
					observable = new Observable({first: "John", name: new Observable({first: "Ben"})}),
					template = div.appendChild(document.createElement("template"));
				this.timeout = 10000;
				template.innerHTML = widgetWithNestedTemplate;
				template.setAttribute("bind", "");
				template.model = observable;
				handles.push({
					remove: template.unbind.bind(template, "iterator") // TODO(asudoh): Review unbind method with future Polymer versions
				});
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					var w = div.querySelector("liaison-test-nested");
					return w && [
						(w.childNodes[0] || {}).nodeValue,
						(w.childNodes[1] || {}).value,
						(w.childNodes[3] || {}).textContent,
						(w.childNodes[4] || {}).value
					].every(function (value) {
						return value && value.trim();
					});
				}).then(function () {
					var w = div.querySelector("liaison-test-nested");
					expect(w.childNodes[0].nodeValue).to.equal("John ");
					expect(w.childNodes[1].value).to.equal("John");
					expect(w.childNodes[3].textContent).to.equal("Ben ");
					expect(w.childNodes[4].value).to.equal("Ben");
				}).then(waitFor.create(function () {
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
				})).then(waitFor.create(0)).then(function () {
					// Make sure deliverAllByTimeout() finishes sending all change records before running below test
					var w = div.querySelector("liaison-test-nested");
					expect(w.childNodes[0].nodeValue).to.equal("Anne ");
					expect(w.childNodes[3].textContent).to.equal("Irene ");
					expect(observable.first).to.equal("Anne");
					expect(observable.name.first).to.equal("Irene");
				});
			});
			it("Nested repeating template: Programmatic", function () {
				var w = new NestedRepeatingTemplateWidget({
						names: new ObservableArray(
							{first: "Anne"},
							{first: "Ben"},
							{first: "Chad"},
							{first: "Irene"},
							{first: "John"}
						)
					}).placeAt(document.body);
				this.timeout = 10000;
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				return waitFor(function () {
					/* jshint maxcomplexity: 15 */
					return [
						(w.childNodes[1] || {}).textContent,
						(w.childNodes[2] || {}).value,
						(w.childNodes[3] || {}).textContent,
						(w.childNodes[4] || {}).value,
						(w.childNodes[5] || {}).textContent,
						(w.childNodes[6] || {}).value,
						(w.childNodes[7] || {}).textContent,
						(w.childNodes[8] || {}).value,
						(w.childNodes[9] || {}).textContent,
						(w.childNodes[10] || {}).value
					].every(function (value) {
						return value && value.trim();
					});
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
				}).then(waitFor.create(function () {
					var dfd = new Deferred();
					handles.push(ObservableArray.observe(w.names, dfd.resolve.bind(dfd)));
					w.names.reverse();
					return dfd.promise;
				})).then(waitFor.create(0)).then(function () {
					// Make sure deliverAllByTimeout() finishes sending all change records before running below test
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
				});
			});
			it("Nested repeating template: Declarative", function () {
				var div = document.createElement("div"),
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
				this.timeout = 10000;
				template.innerHTML = widgetWithNestedRepeatingTemplate;
				template.setAttribute("bind", "");
				template.model = observable;
				handles.push({
					remove: template.unbind.bind(template, "iterator") // TODO(asudoh): Review unbind method with future Polymer versions
				});
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					/* jshint maxcomplexity: 15 */
					var w = div.querySelector("liaison-test-nestedrepeating");
					return w && [
						(w.childNodes[1] || {}).textContent,
						(w.childNodes[2] || {}).value,
						(w.childNodes[3] || {}).textContent,
						(w.childNodes[4] || {}).value,
						(w.childNodes[5] || {}).textContent,
						(w.childNodes[6] || {}).value,
						(w.childNodes[7] || {}).textContent,
						(w.childNodes[8] || {}).value,
						(w.childNodes[9] || {}).textContent,
						(w.childNodes[10] || {}).value
					].every(function (value) {
						return value && value.trim();
					});
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
				}).then(waitFor.create(function () {
					var dfd = new Deferred();
					handles.push(ObservableArray.observe(observable.names, dfd.resolve.bind(dfd)));
					observable.names.reverse();
					return dfd.promise;
				})).then(waitFor.create(0)).then(function () {
					// Make sure deliverAllByTimeout() finishes sending all change records before running below test
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
				});
			});
			it("Nested widget template", function () {
				var w = new NestedWidgetTemplateWidget({name: new Observable({value: "John"})}).placeAt(document.body);
				this.timeout = 10000;
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				return waitFor(function () {
					// Mixin properties are applied after template is instantiated
					var input = w.querySelector("input");
					return input && input.value === "John";
				});
			});
			it("Template with complex attribtue", function () {
				var w = new ComplexAttributeTemplateWidget({
						name: new Observable({first: "John"})
					}).placeAt(document.body);
				this.timeout = 10000;
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				return waitFor(function () {
					// Mixin properties are applied after template is instantiated
					var span = w.querySelector("span");
					return span && span.getAttribute("attrib") === "First name: John";
				});
			});
			it("Simple binding with default alternate binding factory", function () {
				var w = new AlternateBindingTemplateWidget({
						first: "John"
					}).placeAt(document.body),
					input = w.querySelector("input");
				this.timeout = 10000;
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				return waitFor(function () {
					var input = w.querySelector("input");
					return input && input.value === "John";
				}).then(function () {
					expect(w.firstChild.textContent).to.equal("*John* ");
					expect(input.value).to.equal("John");
				}).then(waitFor.create(function () {
					var dfd = new Deferred();
					handles.push(new ObservablePath(w, "first").observe(dfd.resolve.bind(dfd)));
					input.value = "Anne";
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					input.dispatchEvent(event);
					return dfd.promise;
				})).then(waitFor.create(0)).then(function () {
					// Make sure deliverAllByTimeout() finishes sending all change records before running below test
					expect(w.firstChild.textContent).to.equal("*Anne* ");
				});
			});
			it("Attribute template in widget template", function () {
				var dfd = this.async(10000),
					w = new AttributeTemplateWidget({
						a: new ObservableArray(new ObservableArray("foo0", "foo1", "foo2"),
							new ObservableArray("bar0", "bar1", "bar2"),
							new ObservableArray("baz0", "baz1", "baz2"))
					}).placeAt(document.body);
				this.timeout = 10000;
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				waitFor(function () {
					return w.getElementsByTagName("td").length === 9;
				}).then(dfd.callback(function () {
					var count = 0,
						iterator = document.createNodeIterator(document.body, NodeFilter.SHOW_ELEMENT, function (node) {
							return (/^(TABLE|TBODY|TR|TD)$/).test(node.tagName) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
						}, false),
						inspectCallbacks = [
							dfd.rejectOnError(function (node) {
								expect(node.tagName).to.equal("TABLE");
							}),
							dfd.rejectOnError(function (node) {
								expect(node.tagName).to.equal("TBODY");
							}),
							dfd.rejectOnError(function (node) {
								expect(node.tagName).to.equal("TR");
							}),
							dfd.rejectOnError(function (node) {
								expect(node.tagName).to.equal("TD");
								expect(node.innerHTML).to.equal("foo0");
							}),
							dfd.rejectOnError(function (node) {
								expect(node.tagName).to.equal("TD");
								expect(node.innerHTML).to.equal("foo1");
							}),
							dfd.rejectOnError(function (node) {
								expect(node.tagName).to.equal("TD");
								expect(node.innerHTML).to.equal("foo2");
							}),
							dfd.rejectOnError(function (node) {
								expect(node.tagName).to.equal("TR");
							}),
							dfd.rejectOnError(function (node) {
								expect(node.tagName).to.equal("TD");
								expect(node.innerHTML).to.equal("bar0");
							}),
							dfd.rejectOnError(function (node) {
								expect(node.tagName).to.equal("TD");
								expect(node.innerHTML).to.equal("bar1");
							}),
							dfd.rejectOnError(function (node) {
								expect(node.tagName).to.equal("TD");
								expect(node.innerHTML).to.equal("bar2");
							}),
							dfd.rejectOnError(function (node) {
								expect(node.tagName).to.equal("TR");
							}),
							dfd.rejectOnError(function (node) {
								expect(node.tagName).to.equal("TD");
								expect(node.innerHTML).to.equal("baz0");
							}),
							dfd.rejectOnError(function (node) {
								expect(node.tagName).to.equal("TD");
								expect(node.innerHTML).to.equal("baz1");
							}),
							dfd.callback(function (node) {
								expect(node.tagName).to.equal("TD");
								expect(node.innerHTML).to.equal("baz2");
							})
						];
					for (var node; (node = iterator.nextNode());) {
						inspectCallbacks[count++](node);
					}
				}));
			});
			it("Declarative events", function () {
				var senderDiv,
					targetDiv,
					dfd1stClick = new Deferred(),
					dfd2ndClick = new Deferred(),
					w = new EventTemplateWidget({
						handleClick: createDeclarativeEventResolver(dfd1stClick)
					}).placeAt(document.body);
				this.timeout = 10000;
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				return waitFor(1000).then(function () {
					senderDiv = w.firstChild;
					targetDiv = senderDiv.firstChild;
					var event = document.createEvent("MouseEvents");
					event.initEvent("click", true, true);
					targetDiv.dispatchEvent(event);
				}).then(waitFor.create(dfd1stClick.promise)).then(function (data) {
					var event = data[1],
						sender = data[3];
					expect(event.type).to.equal("click");
					expect(sender).to.equal(senderDiv);
					w.set("handleClick", createDeclarativeEventResolver(dfd2ndClick));
				}).then(waitFor.create(1000)).then(function () {
					var event = document.createEvent("MouseEvents");
					event.initEvent("click", true, true);
					targetDiv.dispatchEvent(event);
				}).then(waitFor.create(dfd2ndClick.promise)).then(function (data) {
					var event = data[1],
						sender = data[3];
					expect(event.type).to.equal("click");
					expect(sender).to.equal(senderDiv);
				});
			});
			it("Nested declarative events", function () {
				var dfd1stClick = new Deferred(),
					dfd2ndClick = new Deferred(),
					dfd3rdClick = new Deferred(),
					w = new NestedEventTemplateWidget({
						handleClick: createDeclarativeEventResolver(dfd1stClick)
					}).placeAt(document.body);
				this.timeout = 10000;
				handles.push({
					remove: function () {
						w.destroy();
					}
				});
				return waitFor(1000).then(function () {
					var event = document.createEvent("MouseEvents");
					event.initEvent("click", true, true);
					w.querySelector("div").dispatchEvent(event);
				}).then(waitFor.create(dfd1stClick.promise)).then(function (data) {
					var thisObject = data[0],
						event = data[1],
						sender = data[3];
					expect(thisObject).to.equal(w);
					expect(event.type).to.equal("click");
					expect(sender).to.equal(w.querySelector("div"));
					w.querySelector("liaison-test-nested-events-inner").set("handleClick", createDeclarativeEventResolver(dfd2ndClick));
				}).then(function () {
					var event = document.createEvent("MouseEvents");
					event.initEvent("click", true, true);
					w.querySelector("div").dispatchEvent(event);
				}).then(waitFor.create(dfd2ndClick.promise)).then(function (data) {
					var thisObject = data[0],
						event = data[1],
						sender = data[3];
					expect(thisObject).to.equal(w.querySelector("liaison-test-nested-events-inner"));
					expect(event.type).to.equal("click");
					expect(sender).to.equal(w.querySelector("div"));
					w.querySelector("liaison-test-events").set("handleClick", createDeclarativeEventResolver(dfd3rdClick));
				}).then(function () {
					var event = document.createEvent("MouseEvents");
					event.initEvent("click", true, true);
					w.querySelector("div").dispatchEvent(event);
				}).then(waitFor.create(dfd3rdClick.promise)).then(function (data) {
					var thisObject = data[0],
						event = data[1],
						sender = data[3];
					expect(thisObject).to.equal(w.querySelector("liaison-test-events"));
					expect(event.type).to.equal("click");
					expect(sender).to.equal(w.querySelector("div"));
				});
			});
		});
	}
});
