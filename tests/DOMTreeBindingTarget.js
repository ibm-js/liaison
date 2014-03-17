define([
	"intern!bdd",
	"intern/chai!expect",
	"../Observable",
	"../ObservablePath",
	"../ObservableArray",
	"../BindingTarget",
	"../DOMTreeBindingTarget",
	"dojo/text!../tests/templates/simpleBindingTemplate.html",
	"dojo/text!../tests/templates/simpleObjectPathBindingTemplate.html",
	"dojo/text!../tests/templates/simpleWithAlternateBindingTemplate.html",
	"dojo/text!../tests/templates/nestedTemplate.html",
	"dojo/text!../tests/templates/nestedScriptTemplate.html",
	"dojo/text!../tests/templates/deepNestedTemplate.html",
	"dojo/text!../tests/templates/simpleWithConditionalAttributeBindingTemplate.html",
	"dojo/text!../tests/templates/simpleConditionalBindingTemplate.html",
	"dojo/text!../tests/templates/simpleConditionalRepeatingTemplate.html",
	"dojo/text!../tests/templates/emptyBindingTemplate.html",
	"dojo/text!../tests/templates/eventTemplate.html",
	"dojo/text!../tests/templates/irregularTemplate.html"
], function (
	bdd,
	expect,
	Observable,
	ObservablePath,
	ObservableArray,
	BindingTarget,
	DOMTreeBindingTarget,
	basicTemplate,
	objectPathTemplate,
	alternateBindingTemplate,
	nestedTemplate,
	nestedScriptTemplate,
	deepNestedTemplate,
	simpleWithConditionalAttributeBindingTemplate,
	simpleConditionalBindingTemplate,
	simpleConditionalRepeatingTemplate,
	emptyBindingTemplate,
	eventTemplate,
	irregularTemplate
) {
	/* jshint withstmt: true */
	/* global describe, afterEach, it */
	with (bdd) {
		describe("Test liaison/DOMTreeBindingTarget", function () {
			var handles = [];
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					handle.remove();
				}
			});
			function testRepeatValuesWithBasicTemplate(root, a) {
				var iterator = root.ownerDocument.createNodeIterator(root, NodeFilter.SHOW_TEXT, function (node) {
					return (/^\s*$/).test(node.nodeValue) ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
				}, false);
				for (var inputs = root.getElementsByTagName("input"), i = 0, l = a.length; i < l; ++i) {
					expect(iterator.nextNode().nodeValue).to.equal(a[i].first + " ");
					expect(inputs[i].value).to.equal(a[i].first);
				}
			}
			function testRepeatValuesWithNestedTemplate(root, a) {
				var iterator = root.ownerDocument.createNodeIterator(root, NodeFilter.SHOW_TEXT, function (node) {
					return (/^\s*$/).test(node.nodeValue) ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
				}, false);
				for (var inputs = root.getElementsByTagName("input"), i = 0, l = a.length; i < l; ++i) {
					expect(iterator.nextNode().nodeValue).to.equal(a[i].first + " ");
					expect(iterator.nextNode().nodeValue).to.equal(a[i].name.first + " ");
					expect(inputs[i * 2].value).to.equal(a[i].first);
					expect(inputs[i * 2 + 1].value).to.equal(a[i].name.first);
				}
			}
			it("Assigning non-object/array", function () {
				var dfd = this.async(2000),
					observable = new Observable({foo: 0}),
					observablePath = new ObservablePath(observable, "foo"),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = "<div></div>";
				var binding = template.bind("bind", observablePath);
				handles.push(binding);
				setTimeout(dfd.rejectOnError(function () {
					expect(template.nextSibling).to.be.null;
					template.unbind("bind");
					binding = template.bind("repeat", observablePath);
					handles.push(binding);
					setTimeout(dfd.callback(function () {
						expect(template.nextSibling).to.be.null;
					}), 500);
				}), 500);
			});
			it("Simple binding: <template>", function () {
				var dfd = this.async(2000),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					observable = new Observable({first: "John"});
				template.innerHTML = basicTemplate;
				var binding = template.bind("bind", observable);
				handles.push(binding);
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				expect(binding.value).to.equal(observable);
				setTimeout(dfd.rejectOnError(function () {
					var text = template.nextSibling,
						input = text.nextSibling;
					expect(text.nodeValue).to.equal("John ");
					expect(input.value).to.equal("John");
					input.value = "Anne";
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					input.dispatchEvent(event);
					setTimeout(dfd.callback(function () {
						expect(text.nodeValue).to.equal("Anne ");
					}), 500);
				}), 500);
			});
			it("Simple binding: <script type=\"text/x-template\">", function () {
				var dfd = this.async(2000),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("script")),
					observable = new Observable({first: "John"});
				template.setAttribute("type", "text/x-template");
				template.innerHTML = basicTemplate;
				var binding = template.bind("bind", observable);
				handles.push(binding);
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				expect(binding.value).to.equal(observable);
				setTimeout(dfd.rejectOnError(function () {
					var text = template.nextSibling,
						input = text.nextSibling;
					expect(text.nodeValue).to.equal("John ");
					expect(input.value).to.equal("John");
					input.value = "Anne";
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					input.dispatchEvent(event);
					setTimeout(dfd.callback(function () {
						expect(text.nodeValue).to.equal("Anne ");
					}), 500);
				}), 500);
			});
			it("Simple object path binding", function () {
				var dfd = this.async(2000),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = objectPathTemplate;
				handles.push(template.bind("bind", {name: new Observable({first: "John"})}));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				setTimeout(dfd.rejectOnError(function () {
					var text = template.nextSibling,
						input = text.nextSibling;
					expect(text.nodeValue).to.equal("John ");
					expect(input.value).to.equal("John");
					input.value = "Anne";
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					input.dispatchEvent(event);
					setTimeout(dfd.callback(function () {
						expect(text.nodeValue).to.equal("Anne ");
					}), 500);
				}), 500);
			});
			it("Simple binding with alternate binding factory", function () {
				var dfd = this.async(2000),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = alternateBindingTemplate;
				template.createBindingSourceFactory = function (descriptor) {
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
				};
				handles.push(template.bind("bind", new Observable({first: "John"})));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				setTimeout(dfd.rejectOnError(function () {
					var text = template.nextSibling,
						input = text.nextSibling;
					expect(text.nodeValue).to.equal("*John* ");
					expect(input.value).to.equal("John");
					input.value = "Anne";
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					input.dispatchEvent(event);
					setTimeout(dfd.callback(function () {
						expect(text.nodeValue).to.equal("*Anne* ");
					}), 500);
				}), 500);
			});
			it("Simple binding with default alternate binding factory", function () {
				var originalCreateBindingSourceFactory = BindingTarget.createBindingSourceFactory;
				BindingTarget.createBindingSourceFactory = function (descriptor) {
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
				};
				handles.push({
					remove: function () {
						BindingTarget.createBindingSourceFactory = originalCreateBindingSourceFactory;
					}
				});
				var dfd = this.async(2000),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = alternateBindingTemplate;
				handles.push(template.bind("bind", new Observable({first: "John"})));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				setTimeout(dfd.rejectOnError(function () {
					var text = template.nextSibling,
						input = text.nextSibling;
					expect(text.nodeValue).to.equal("*John* ");
					expect(input.value).to.equal("John");
					input.value = "Anne";
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					input.dispatchEvent(event);
					setTimeout(dfd.callback(function () {
						expect(text.nodeValue).to.equal("*Anne* ");
					}), 500);
				}), 500);
			});
			it("Binding with nested template: Basic", function () {
				var dfd = this.async(3000),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					observable = new Observable({first: "John"});
				template.innerHTML = nestedTemplate;
				handles.push(template.bind("bind", observable));
				setTimeout(dfd.rejectOnError(function () {
					var text = template.nextSibling,
						input = text.nextSibling;
					expect(text.nodeValue).to.equal("John ");
					expect(input.value).to.equal("John");
					var innerTemplate = input.nextSibling,
						innerSpan = innerTemplate.firstChild,
						innerInput = innerTemplate.lastChild;
					expect(((innerSpan || {}).firstChild || {}).nodeValue).to.not.equal("John ");
					expect((innerInput || {}).value).to.not.equal("John");
					observable.set("name", new Observable({first: "John"}));
					setTimeout(dfd.rejectOnError(function () {
						var innerSpan = innerTemplate.nextSibling,
							innerInput = innerSpan.nextSibling;
						expect(innerSpan.firstChild.nodeValue).to.equal("John ");
						expect(innerInput.value).to.equal("John");
						setTimeout(dfd.rejectOnError(function () {
							observable.set("name", new Observable({first: "Anne"}));
							setTimeout(dfd.callback(function () {
								var innerSpan = innerTemplate.nextSibling,
									innerInput = innerSpan.nextSibling;
								expect(innerSpan.firstChild.nodeValue).to.equal("Anne ");
								expect(innerInput.value).to.equal("Anne");
							}), 500);
						}), 500);
					}), 500);
				}), 500);
			});
			it("Binding with nested template: <script type=\"text/x-template\">", function () {
				var dfd = this.async(3000),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					observable = new Observable({first: "John"});
				template.innerHTML = nestedScriptTemplate;
				handles.push(template.bind("bind", observable));
				setTimeout(dfd.rejectOnError(function () {
					var text = template.nextSibling,
						input = text.nextSibling;
					expect(text.nodeValue).to.equal("John ");
					expect(input.value).to.equal("John");
					var innerTemplate = input.nextSibling,
						innerSpan = innerTemplate.firstChild,
						innerInput = innerTemplate.lastChild;
					expect(((innerSpan || {}).firstChild || {}).nodeValue).to.not.equal("John ");
					expect((innerInput || {}).value).to.not.equal("John");
					observable.set("name", new Observable({first: "John"}));
					setTimeout(dfd.rejectOnError(function () {
						var innerSpan = innerTemplate.nextSibling,
							innerInput = innerSpan.nextSibling;
						expect(innerSpan.firstChild.nodeValue).to.equal("John ");
						expect(innerInput.value).to.equal("John");
						setTimeout(dfd.rejectOnError(function () {
							observable.set("name", new Observable({first: "Anne"}));
							setTimeout(dfd.callback(function () {
								var innerSpan = innerTemplate.nextSibling,
									innerInput = innerSpan.nextSibling;
								expect(innerSpan.firstChild.nodeValue).to.equal("Anne ");
								expect(innerInput.value).to.equal("Anne");
							}), 500);
						}), 500);
					}), 500);
				}), 500);
			});
			it("Binding with nested template: Change in source", function () {
				var dfd = this.async(2000),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					grandchild = new Observable({first: "Anne"}),
					child = new Observable({first: "John", name: grandchild}),
					observable = new Observable({target: child}),
					observablePath = new ObservablePath(observable, "target");
				template.innerHTML = nestedTemplate;
				handles.push(template.bind("bind", observablePath));
				setTimeout(dfd.rejectOnError(function () {
					var text = template.nextSibling,
						input = text.nextSibling;
					expect(text.nodeValue).to.equal("John ");
					expect(input.value).to.equal("John");
					var innerTemplate = input.nextSibling,
						innerSpanInTemplate = innerTemplate.firstChild,
						innerInputInTemplate = innerTemplate.lastChild,
						innerSpan = innerTemplate.nextSibling,
						innerInput = innerSpan.nextSibling;
					expect(((innerSpanInTemplate || {}).firstChild || {}).nodeValue).to.not.equal("Anne ");
					expect((innerInputInTemplate || {}).value).to.not.equal("Anne");
					expect(innerSpan.firstChild.nodeValue).to.equal("Anne ");
					expect(innerInput.value).to.equal("Anne");
					expect(innerInput.nextElementSibling).to.be.null;
					observable.set("target", new Observable({first: "Anne", name: new Observable({first: "John"})}));
					setTimeout(dfd.callback(function () {
						var text = template.nextSibling,
							input = text.nextSibling;
						expect(text.nodeValue).to.equal("Anne ");
						expect(input.value).to.equal("Anne");
						var innerTemplate = input.nextSibling,
							innerSpanInTemplate = innerTemplate.firstChild,
							innerInputInTemplate = innerTemplate.lastChild,
							innerSpan = innerTemplate.nextSibling,
							innerInput = innerSpan.nextSibling;
						expect(((innerSpanInTemplate || {}).firstChild || {}).nodeValue).to.not.equal("John ");
						expect((innerInputInTemplate || {}).value).to.not.equal("John");
						expect(innerSpan.firstChild.nodeValue).to.equal("John ");
						expect(innerInput.value).to.equal("John");
						expect(innerInput.nextElementSibling).to.be.null;
					}), 500);
				}), 500);
			});
			it("Binding with deep nested template", function () {
				var dfd = this.async(1000),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					grandchild = new Observable({first: "Ben"}),
					child = new Observable({first: "Anne", name: grandchild}),
					observable = new Observable({first: "John", name: child});
				template.innerHTML = deepNestedTemplate;
				handles.push(template.bind("bind", observable));
				setTimeout(dfd.callback(function () {
					var iterator = div.ownerDocument.createNodeIterator(div, NodeFilter.SHOW_TEXT, function (node) {
							return (/^\s*$/).test(node.nodeValue) ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
						}, false),
						values = ["John", "Anne", "Ben"];
					for (var inputs = div.getElementsByTagName("input"), i = 0, l = values.length; i < l; ++i) {
						expect(iterator.nextNode().nodeValue).to.equal(values[i] + " ");
						expect(inputs[i].value).to.equal(values[i]);
					}
				}), 500);
			});
			it("Simple repeat: <template>", function () {
				var dfd = this.async(2000),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					observableArray = ObservableArray.apply(undefined, [
						{first: "Anne"},
						{first: "Ben"},
						{first: "Chad"},
						{first: "Irene"}
					]);
				template.innerHTML = basicTemplate;
				var binding = template.bind("repeat", observableArray);
				handles.push(binding);
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				expect(binding.value).to.equal(observableArray);
				setTimeout(dfd.rejectOnError(function () {
					testRepeatValuesWithBasicTemplate(div, observableArray);
					observableArray.splice(1, 2, {first: "Chad"}, {first: "Ben"}, {first: "John"});
					setTimeout(dfd.rejectOnError(function () {
						testRepeatValuesWithBasicTemplate(div, observableArray);
						observableArray.set(observableArray.length, {first: "Unnamed"});
						setTimeout(dfd.callback(testRepeatValuesWithBasicTemplate.bind(undefined, div, observableArray)), 500);
					}), 500);
				}), 500);
			});
			it("Repeat with nested template", function () {
				var dfd = this.async(2000),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					observableArray = ObservableArray.apply(undefined, [
						{first: "Anne", name: {first: "John"}},
						{first: "Ben", name: {first: "John"}},
						{first: "Chad", name: {first: "John"}},
						{first: "Irene", name: {first: "John"}}
					]);
				template.innerHTML = nestedTemplate;
				handles.push(template.bind("repeat", observableArray));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				setTimeout(dfd.rejectOnError(function () {
					testRepeatValuesWithNestedTemplate(div, observableArray);
					observableArray.splice(1, 2, {first: "Chad", name: {first: "John"}});
					setTimeout(dfd.callback(testRepeatValuesWithNestedTemplate.bind(undefined, div, observableArray)), 500);
				}), 500);
			});
			it("Repeat with swapping model", function () {
				var dfd = this.async(4000),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					observableArray0 = ObservableArray.apply(undefined, [
						{first: "Anne"},
						{first: "Ben"},
						{first: "Chad"},
						{first: "Irene"}
					]),
					observableArray1 = ObservableArray.apply(undefined, observableArray0.slice(1)),
					observable = new Observable({a: observableArray0}),
					observablePath = new ObservablePath(observable, "a");
				template.innerHTML = basicTemplate;
				handles.push(template.bind("repeat", observablePath));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				setTimeout(dfd.rejectOnError(function () {
					testRepeatValuesWithBasicTemplate(div, observable.a);
					observable.set("a", observableArray1);
					setTimeout(dfd.rejectOnError(function () {
						testRepeatValuesWithBasicTemplate(div, observable.a);
						setTimeout(dfd.rejectOnError(function () {
							observable.set("a", observableArray0);
							setTimeout(dfd.rejectOnError(function () {
								testRepeatValuesWithBasicTemplate(div, observable.a);
								setTimeout(dfd.rejectOnError(function () {
									observable.set("a", observableArray1);
									var boundCallback
										= testRepeatValuesWithBasicTemplate.bind(undefined, div, observable.a);
									setTimeout(dfd.callback(boundCallback), 500);
								}), 500);
							}), 500);
						}), 500);
					}), 500);
				}), 500);
			});
			it("disabled attribute reflecting model", function () {
				var dfd = this.async(2000),
					div = document.createElement("div"),
					observable = new Observable({disabled: false}),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = simpleWithConditionalAttributeBindingTemplate;
				handles.push(template.bind("bind", observable));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				setTimeout(dfd.rejectOnError(function () {
					var input = template.nextSibling;
					expect(input.disabled).to.be.false;
					observable.set("disabled", true);
					setTimeout(dfd.callback(function () {
						expect(input.disabled).to.be.true;
					}), 500);
				}), 500);
			});
			it("Simple conditional template", function () {
				var dfd = this.async(2000),
					observable = new Observable({first: "John"}),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = simpleConditionalBindingTemplate;
				handles.push(template.bind("bind", observable));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				setTimeout(dfd.rejectOnError(function () {
					var text = template.nextSibling,
						input = text.nextSibling.nextSibling;
					expect(text.nodeValue).to.equal("John ");
					expect(input.tagName).not.to.equal("INPUT");
					observable.set("showInput", true);
					setTimeout(dfd.rejectOnError(function () {
						var text = template.nextSibling,
							input = text.nextSibling.nextSibling;
						expect(text.nodeValue).to.equal("John ");
						expect(input.value).to.equal("John");
						input.value = "Anne";
						var event = document.createEvent("HTMLEvents");
						event.initEvent("input", false, true);
						input.dispatchEvent(event);
						setTimeout(dfd.callback(function () {
							expect(text.nodeValue).to.equal("Anne ");
						}), 500);
					}), 500);
				}), 500);
			});
			it("Simple conditional repeating template", function () {
				var dfd = this.async(2000),
					observable = new Observable({names: new ObservableArray({first: "Anne"}, {first: "Ben"})}),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = simpleConditionalRepeatingTemplate;
				handles.push(template.bind("bind", observable));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				setTimeout(dfd.rejectOnError(function () {
					var innerTemplate = template.nextSibling;
					expect(innerTemplate.nextSibling).to.be.null;
					observable.set("showInput", true);
					setTimeout(dfd.callback(function () {
						expect(innerTemplate.nextSibling.value).to.equal("Anne");
						expect(innerTemplate.nextSibling.nextSibling.value).to.equal("Ben");
					}), 500);
				}), 500);
			});
			it("Empty binding", function () {
				var dfd = this.async(1000),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					observableArray = ObservableArray.apply(undefined, [
						"Anne",
						"Ben",
						"Chad",
						"Irene"
					]),
					observable = new Observable({a: observableArray}),
					observablePath = new ObservablePath(observable, "a");
				template.innerHTML = emptyBindingTemplate;
				handles.push(template.bind("repeat", observablePath));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				setTimeout(dfd.callback(function () {
					var iterator = div.ownerDocument.createNodeIterator(div, NodeFilter.SHOW_TEXT, function (node) {
						return (/^\s*$/).test(node.nodeValue) ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
					}, false);
					for (var inputs = div.getElementsByTagName("input"), i = 0, l = observableArray.length; i < l; ++i) {
						expect(iterator.nextNode().nodeValue).to.equal(observableArray[i] + " ");
						expect(inputs[i].value).to.equal(observableArray[i]);
					}
				}), 500);
			});
			it("Declarative events", function () {
				var event,
					senderDiv,
					targetDiv,
					dfd = this.async(2000),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					handleClick = dfd.rejectOnError(function (event, detail, sender) {
						expect(event.type).to.equal("click");
						expect(sender).to.equal(senderDiv);
						observable.set("handleClick", dfd.callback(function (event, detail, sender) {
							expect(event.type).to.equal("click");
							expect(sender).to.equal(senderDiv);
						}));
						setTimeout(dfd.rejectOnError(function () {
							event = document.createEvent("MouseEvents");
							event.initEvent("click", true, true);
							targetDiv.dispatchEvent(event);
						}), 500);
					}),
					observable = new Observable({handleClick: "Foo"});
				template.innerHTML = eventTemplate;
				handles.push(template.bind("bind", observable));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				setTimeout(dfd.rejectOnError(function () {
					observable.set("handleClick", handleClick);
					setTimeout(dfd.rejectOnError(function () {
						senderDiv = template.nextSibling;
						targetDiv = senderDiv.firstChild;
						event = document.createEvent("MouseEvents");
						event.initEvent("click", true, true);
						targetDiv.dispatchEvent(event);
					}), 100);
				}), 500);
			});
			it("Irregular template", function () {
				var dfd = this.async(1000),
					observable = new Observable({foo: "Foo"}),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = irregularTemplate;
				handles.push(template.bind("bind", observable));
				setTimeout(dfd.callback(function () {
					expect(template.nextSibling.nodeValue).to.equal("{{Foo");
					expect(!!template.nextSibling.nextSibling._targets).to.be.false;
				}), 500);
			});
			it("Unbinding right after binding", function () {
				var dfd = this.async(2000),
					observable = new Observable(),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = "<div></div>";
				var binding = template.bind("bind", new ObservablePath(observable, "foo"));
				handles.push(binding);
				template.unbind("bind");
				setTimeout(dfd.rejectOnError(function () {
					expect(template.nextSibling).to.be.null;
					binding = template.bind("repeat", new ObservableArray("a", "b", "c"));
					handles.push(binding);
					template.unbind("repeat");
					setTimeout(dfd.callback(function () {
						expect(template.nextSibling).to.be.null;
					}), 500);
				}), 500);
			});
			it("Template reference: From <template>", function () {
				var dfd = this.async(2000),
					observable = new Observable({first: "John", ref: "template0"}),
					div = document.createElement("div"),
					template0 = div.appendChild(document.createElement("template")),
					template1 = div.appendChild(document.createElement("script")),
					template2 = div.appendChild(document.createElement("template"));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						div.parentNode.removeChild(div);
					}
				});
				template0.innerHTML = basicTemplate;
				template0.id = "template0";
				template1.type = "text/x-template";
				template1.innerHTML = "<div></div>";
				template1.id = "template1";
				handles.push(template2.bind("bind", observable), template2.bind("ref", new ObservablePath(observable, "ref")));
				setTimeout(dfd.rejectOnError(function () {
					var text = template2.nextSibling,
						input = text.nextSibling;
					expect(text.nodeValue).to.equal("John ");
					expect(input.value).to.equal("John");
					observable.set("ref", "template1");
					setTimeout(dfd.rejectOnError(function () {
						expect(template2.nextSibling.tagName).to.equal("DIV");
						observable.set("ref", "foo");
						setTimeout(dfd.callback(function () {
							expect(template2.nextSibling).to.be.null;
						}), 500);
					}), 500);
				}), 500);
			});
			it("Template reference: From <script type=\"x-template\">", function () {
				var dfd = this.async(2000),
					observable = new Observable({first: "John", ref: "template0"}),
					div = document.createElement("div"),
					template0 = div.appendChild(document.createElement("template")),
					template1 = div.appendChild(document.createElement("script")),
					template2 = div.appendChild(document.createElement("script"));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						div.parentNode.removeChild(div);
					}
				});
				template0.innerHTML = basicTemplate;
				template0.id = "template0";
				template1.type = "text/x-template";
				template1.innerHTML = "<div></div>";
				template1.id = "template1";
				template2.type = "text/x-template";
				handles.push(template2.bind("bind", observable), template2.bind("ref", new ObservablePath(observable, "ref")));
				setTimeout(dfd.rejectOnError(function () {
					var text = template2.nextSibling,
						input = text.nextSibling;
					expect(text.nodeValue).to.equal("John ");
					expect(input.value).to.equal("John");
					observable.set("ref", "template1");
					setTimeout(dfd.rejectOnError(function () {
						expect(template2.nextSibling.tagName).to.equal("DIV");
						observable.set("ref", "foo");
						setTimeout(dfd.callback(function () {
							expect(template2.nextSibling).to.be.null;
						}), 500);
					}), 500);
				}), 500);
			});
		});
	}
});
