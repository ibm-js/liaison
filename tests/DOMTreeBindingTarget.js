define([
	"intern!bdd",
	"intern/chai!expect",
	"dojo/Deferred",
	"decor/Observable",
	"../ObservablePath",
	"../ObservableArray",
	"../DOMTreeBindingTarget",
	"../computed",
	"./waitFor",
	"requirejs-text/text!./templates/simpleBindingTemplate.html",
	"requirejs-text/text!./templates/pointerBindingTemplate.html",
	"requirejs-text/text!./templates/simpleObjectPathBindingTemplate.html",
	"requirejs-text/text!./templates/simpleWithAlternateBindingTemplate.html",
	"requirejs-text/text!./templates/nestedTemplate.html",
	"requirejs-text/text!./templates/nestedScriptTemplate.html",
	"requirejs-text/text!./templates/deepNestedTemplate.html",
	"requirejs-text/text!./templates/simpleWithConditionalAttributeBindingTemplate.html",
	"requirejs-text/text!./templates/simpleConditionalBindingTemplate.html",
	"requirejs-text/text!./templates/simpleConditionalRepeatingTemplate.html",
	"requirejs-text/text!./templates/computedTemplate.html",
	"requirejs-text/text!./templates/attributeTemplate.html",
	"requirejs-text/text!./templates/emptyBindingTemplate.html",
	"requirejs-text/text!./templates/svgTemplate.html",
	"requirejs-text/text!./templates/svgNestedTemplate.html",
	"requirejs-text/text!./templates/styleClassValueTemplate.html",
	"requirejs-text/text!./templates/styleBindingTemplate.html",
	"requirejs-text/text!./templates/styleWithAlternateBindingTemplate.html",
	"requirejs-text/text!./templates/eventTemplate.html",
	"requirejs-text/text!./templates/nestedEventTemplate.html",
	"requirejs-text/text!./templates/irregularTemplate.html"
], function (
	bdd,
	expect,
	Deferred,
	Observable,
	ObservablePath,
	ObservableArray,
	DOMTreeBindingTarget,
	computed,
	waitFor,
	simpleTemplate,
	pointerTemplate,
	objectPathTemplate,
	alternateBindingTemplate,
	nestedTemplate,
	nestedScriptTemplate,
	deepNestedTemplate,
	simpleWithConditionalAttributeBindingTemplate,
	simpleConditionalBindingTemplate,
	simpleConditionalRepeatingTemplate,
	computedTemplate,
	attributeTemplate,
	emptyBindingTemplate,
	svgTemplate,
	svgNestedTemplate,
	styleValueTemplate,
	styleTemplate,
	styleWithAlternateBindingTemplate,
	eventTemplate,
	nestedEventTemplate,
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
			var getRGB = (function () {
				var REGEXP_HEXCOLOR = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
					REGEXP_DECIMALCOLOR = /^rgb\((\d+), *(\d+), *(\d+)\)$/;
				return function (str) {
					var match;
					if ((match = REGEXP_HEXCOLOR.exec(str))) {
						return match.slice(1).map(function (elem) {
							return parseInt(elem, 16);
						});
					} else if ((match = REGEXP_DECIMALCOLOR.exec(str))) {
						return match.slice(1).map(function (elem) {
							return parseInt(elem, 10);
						});
					} else {
						throw new Error("Wrong RGB string: " + str);
					}
				};
			})();
			function createDeclarativeEventResolver(dfd) {
				return function () {
					var a = [].slice.call(arguments);
					a.unshift(this);
					dfd.resolve(a);
				};
			}
			it("Upgrading template", function () {
				var caught,
					script = document.createElement("script");
				script.type = "text/javascript";
				try {
					script.upgradeToTemplate();
				} catch (e) {
					caught = true;
				}
				expect(caught).to.be.true;
				caught = false;
				var div = document.createElement("div");
				div.innerHTML = "<template><span>Foo</span></template>";
				try {
					div.upgradeToTemplate();
				} catch (e) {
					caught = true;
				}
				expect(caught).to.be.true;
				caught = false;
				var template = div.firstChild;
				template.upgradeToTemplate();
				expect(template.content.firstChild.tagName).to.equal("SPAN");
				expect(template.content.firstChild.firstChild.nodeValue).to.equal("Foo");
				script = document.createElement("script");
				script.type = "text/x-template";
				script.innerHTML = "<span>Foo</span>";
				script.upgradeToTemplate();
				expect(script.content.firstChild.tagName).to.equal("SPAN");
				expect(script.content.firstChild.firstChild.nodeValue).to.equal("Foo");
			});
			it("Assigning non-object/array", function () {
				var observable = new Observable({foo: 0}),
					observablePath = new ObservablePath(observable, "foo"),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				this.timeout = 10000;
				template.innerHTML = "<div></div>";
				var binding = template.bind("bind", observablePath);
				handles.push(binding);
				return waitFor(500).then(function () {
					expect(template.nextSibling).to.be.null;
					template.unbind("bind");
					binding = template.bind("repeat", observablePath);
					handles.push(binding);
				}).then(waitFor.create(500)).then(function () {
					expect(template.nextSibling).to.be.null;
				});
			});
			it("Simple binding: <template>", function () {
				var div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					observable = new Observable({first: "John"});
				this.timeout = 10000;
				template.innerHTML = simpleTemplate;
				var binding = template.bind("bind", observable);
				handles.push(binding);
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				expect(binding.value).to.equal(observable);
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					var text = template.nextSibling,
						input = text.nextSibling;
					expect(text.nodeValue).to.equal("John ");
					expect(input.value).to.equal("John");
					input.value = "Anne";
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					input.dispatchEvent(event);
				}).then(waitFor.create(function () {
					return template.nextSibling.nodeValue !== "John ";
				})).then(function () {
					expect(template.nextSibling.nodeValue).to.equal("Anne ");
				});
			});
			it("Simple binding: <script type=\"text/x-template\">", function () {
				var div = document.createElement("div"),
					template = div.appendChild(document.createElement("script")),
					observable = new Observable({first: "John"});
				this.timeout = 10000;
				template.setAttribute("type", "text/x-template");
				template.innerHTML = simpleTemplate;
				var binding = template.bind("bind", observable);
				handles.push(binding);
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				expect(binding.value).to.equal(observable);
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					var text = template.nextSibling,
						input = text.nextSibling;
					expect(text.nodeValue).to.equal("John ");
					expect(input.value).to.equal("John");
					input.value = "Anne";
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					input.dispatchEvent(event);
				}).then(waitFor.create(function () {
					return template.nextSibling.nodeValue !== "John ";
				})).then(function () {
					expect(template.nextSibling.nodeValue).to.equal("Anne ");
				});
			});
			it("Pointer binding: <template>", function () {
				var div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					observable = new Observable({
						value: "Foo0",
						checked: true,
						index: 1,
					});
				this.timeout = 10000;
				template.innerHTML = pointerTemplate;
				var binding = template.bind("bind", observable);
				handles.push(binding);
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					expect(template.nextSibling.getElementsByTagName("input")[0].value).to.equal("Foo0");
					expect(template.nextSibling.getElementsByTagName("input")[1].checked).to.be.true;
					expect(template.nextSibling.getElementsByTagName("option")[0].selected).to.be.true;
					expect(template.nextSibling.getElementsByTagName("option")[1].selected).to.be.false;
					expect(template.nextSibling.getElementsByTagName("option")[2].selected).to.be.false;
					expect(template.nextSibling.getElementsByTagName("option")[3].selected).to.be.true;
					observable.set("value", "Foo1");
					observable.set("checked", false);
					observable.set("index", 0);
				}).then(waitFor.create(function () {
					return template.nextSibling.getElementsByTagName("input")[0].value !== "Foo0";
				})).then(function () {
					expect(template.nextSibling.getElementsByTagName("input")[0].value).to.equal("Foo1");
					expect(template.nextSibling.getElementsByTagName("input")[1].checked).to.be.false;
					expect(template.nextSibling.getElementsByTagName("option")[0].selected).to.be.false;
					expect(template.nextSibling.getElementsByTagName("option")[1].selected).to.be.true;
					expect(template.nextSibling.getElementsByTagName("option")[2].selected).to.be.true;
					expect(template.nextSibling.getElementsByTagName("option")[3].selected).to.be.false;
				});
			});
			it("Simple object path binding", function () {
				var div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				this.timeout = 10000;
				template.innerHTML = objectPathTemplate;
				handles.push(template.bind("bind", {name: new Observable({first: "John"})}));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					var text = template.nextSibling,
						input = text.nextSibling;
					expect(text.nodeValue).to.equal("John ");
					expect(input.value).to.equal("John");
					input.value = "Anne";
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					input.dispatchEvent(event);
				}).then(waitFor.create(function () {
					return template.nextSibling.nodeValue !== "John ";
				})).then(function () {
					expect(template.nextSibling.nodeValue).to.equal("Anne ");
				});
			});
			it("Simple binding with alternate binding factory", function () {
				var div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				this.timeout = 10000;
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
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					var text = template.nextSibling,
						input = text.nextSibling;
					expect(text.nodeValue).to.equal("*John* ");
					expect(input.value).to.equal("John");
					input.value = "Anne";
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					input.dispatchEvent(event);
				}).then(waitFor.create(function () {
					return template.nextSibling.nodeValue !== "*John* ";
				})).then(function () {
					expect(template.nextSibling.nodeValue).to.equal("*Anne* ");
				});
			});
			it("Simple binding with default alternate binding factory", function () {
				var originalCreateBindingSourceFactory = Element.prototype.createBindingSourceFactory;
				Element.prototype.createBindingSourceFactory = function (descriptor) {
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
						Element.prototype.createBindingSourceFactory = originalCreateBindingSourceFactory;
					}
				});
				var div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				this.timeout = 10000;
				template.innerHTML = alternateBindingTemplate;
				handles.push(template.bind("bind", new Observable({first: "John"})));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					var text = template.nextSibling,
						input = text.nextSibling;
					expect(text.nodeValue).to.equal("*John* ");
					expect(input.value).to.equal("John");
					input.value = "Anne";
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					input.dispatchEvent(event);
				}).then(waitFor.create(function () {
					return template.nextSibling.nodeValue !== "*John* ";
				})).then(function () {
					expect(template.nextSibling.nodeValue).to.equal("*Anne* ");
				});
			});
			it("Binding with nested template: Basic", function () {
				var div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					observable = new Observable({first: "John"});
				this.timeout = 10000;
				template.innerHTML = nestedTemplate;
				handles.push(template.bind("bind", observable));
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
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
				}).then(waitFor.create(function () {
					return (template.nextSibling.nextSibling.nextSibling.nextSibling || {}).tagName === "SPAN";
				})).then(function () {
					var innerTemplate = template.nextSibling.nextSibling.nextSibling,
						innerSpan = innerTemplate.nextSibling,
						innerInput = innerSpan.nextSibling;
					expect(innerSpan.firstChild.nodeValue).to.equal("John ");
					expect(innerInput.value).to.equal("John");
					observable.set("name", new Observable({first: "Anne"}));
				}).then(waitFor.create(function () {
					var innerInput = (template.nextSibling.nextSibling.nextSibling.nextSibling || {}).nextSibling;
					return innerInput && innerInput.value !== "John";
				})).then(function () {
					var innerSpan = template.nextSibling.nextSibling.nextSibling.nextSibling,
						innerInput = innerSpan.nextSibling;
					expect(innerSpan.firstChild.nodeValue).to.equal("Anne ");
					expect(innerInput.value).to.equal("Anne");
				});
			});
			it("Binding with nested template: <script type=\"text/x-template\">", function () {
				var div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					observable = new Observable({first: "John"});
				this.timeout = 10000;
				template.innerHTML = nestedScriptTemplate;
				handles.push(template.bind("bind", observable));
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
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
				}).then(waitFor.create(function () {
					return (template.nextSibling.nextSibling.nextSibling.nextSibling || {}).tagName === "SPAN";
				})).then(function () {
					var innerTemplate = template.nextSibling.nextSibling.nextSibling,
						innerSpan = innerTemplate.nextSibling,
						innerInput = innerSpan.nextSibling;
					expect(innerSpan.firstChild.nodeValue).to.equal("John ");
					expect(innerInput.value).to.equal("John");
					observable.set("name", new Observable({first: "Anne"}));
				}).then(waitFor.create(function () {
					var innerInput = (template.nextSibling.nextSibling.nextSibling.nextSibling || {}).nextSibling;
					return innerInput && innerInput.value !== "John";
				})).then(function () {
					var innerSpan = template.nextSibling.nextSibling.nextSibling.nextSibling,
						innerInput = innerSpan.nextSibling;
					expect(innerSpan.firstChild.nodeValue).to.equal("Anne ");
					expect(innerInput.value).to.equal("Anne");
				});
			});
			it("Binding with nested template: Change in source", function () {
				var div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					grandchild = new Observable({first: "Anne"}),
					child = new Observable({first: "John", name: grandchild}),
					observable = new Observable({target: child}),
					observablePath = new ObservablePath(observable, "target");
				this.timeout = 10000;
				template.innerHTML = nestedTemplate;
				handles.push(template.bind("bind", observablePath));
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					var text = template.nextSibling,
						input = text.nextSibling;
					expect(text.nodeValue).to.equal("John ");
					expect(input.value).to.equal("John");
					var innerTemplate = input.nextSibling,
						innerSpanInTemplate = innerTemplate.firstChild,
						innerInputInTemplate = innerTemplate.lastChild;
					expect(((innerSpanInTemplate || {}).firstChild || {}).nodeValue).to.not.equal("Anne ");
					expect((innerInputInTemplate || {}).value).to.not.equal("Anne");
				}).then(waitFor.create(function () {
					return (template.nextSibling.nextSibling.nextSibling.nextSibling || {}).tagName === "SPAN";
				})).then(function () {
					var innerTemplate = template.nextSibling.nextSibling.nextSibling,
						innerSpan = innerTemplate.nextSibling,
						innerInput = innerSpan.nextSibling;
					expect(innerSpan.firstChild.nodeValue).to.equal("Anne ");
					expect(innerInput.value).to.equal("Anne");
					expect(innerInput.nextElementSibling).to.be.null;
					observable.set("target", new Observable({first: "Anne", name: new Observable({first: "John"})}));
				}).then(waitFor.create(function () {
					var input = (template.nextSibling || {}).nextSibling;
					return input && input.value !== "John";
				})).then(function () {
					var text = template.nextSibling,
						input = text.nextSibling;
					expect(text.nodeValue).to.equal("Anne ");
					expect(input.value).to.equal("Anne");
					var innerTemplate = input.nextSibling,
						innerSpanInTemplate = innerTemplate.firstChild,
						innerInputInTemplate = innerTemplate.lastChild;
					expect(((innerSpanInTemplate || {}).firstChild || {}).nodeValue).to.not.equal("John ");
					expect((innerInputInTemplate || {}).value).to.not.equal("John");
				}).then(waitFor.create(function () {
					var innerInput = (template.nextSibling.nextSibling.nextSibling.nextSibling || {}).nextSibling;
					return innerInput && innerInput.tagName === "INPUT" && innerInput.value !== "Anne";
				})).then(function () {
					var innerSpan = template.nextSibling.nextSibling.nextSibling.nextSibling,
						innerInput = innerSpan.nextSibling;
					expect(innerSpan.firstChild.nodeValue).to.equal("John ");
					expect(innerInput.value).to.equal("John");
					expect(innerInput.nextElementSibling).to.be.null;
				});
			});
			it("Binding with deep nested template", function () {
				var div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					grandchild = new Observable({first: "Ben"}),
					child = new Observable({first: "Anne", name: grandchild}),
					observable = new Observable({first: "John", name: child});
				this.timeout = 10000;
				template.innerHTML = deepNestedTemplate;
				handles.push(template.bind("bind", observable));
				return waitFor(function () {
					return Array.prototype.filter.call(div.getElementsByTagName("input"), function (input) {
						return input.parentNode.nodeType !== Node.ELEMENT_NODE || input.parentNode.tagName !== "TEMPLATE";
					}).length === 3;
				}).then(function () {
					var iterator = div.ownerDocument.createNodeIterator(div, NodeFilter.SHOW_TEXT, function (node) {
							return (/^\s*$/).test(node.nodeValue) ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
						}, false),
						values = ["John", "Anne", "Ben"];
					for (var inputs = div.getElementsByTagName("input"), i = 0, l = values.length; i < l; ++i) {
						expect(iterator.nextNode().nodeValue).to.equal(values[i] + " ");
						expect(inputs[i].value).to.equal(values[i]);
					}
				});
			});
			it("Simple repeat: <template>", function () {
				var div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					observableArray = ObservableArray.apply(undefined, [
						{first: "Anne"},
						{first: "Ben"},
						{first: "Chad"},
						{first: "Irene"}
					]);
				this.timeout = 10000;
				template.innerHTML = simpleTemplate;
				var binding = template.bind("repeat", observableArray);
				handles.push(binding);
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				expect(binding.value).to.equal(observableArray);
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					testRepeatValuesWithBasicTemplate(div, observableArray);
					observableArray.splice(1, 2, {first: "Chad"}, {first: "Ben"}, {first: "John"});
				}).then(waitFor.create(function () {
					var input = div.getElementsByTagName("input")[1];
					return input && input.value !== "Ben";
				})).then(function () {
					testRepeatValuesWithBasicTemplate(div, observableArray);
					observableArray.set(observableArray.length, {first: "Unnamed"});
				}).then(waitFor.create(function () {
					return Array.prototype.filter.call(div.getElementsByTagName("input"), function (input) {
						return !template.contains(input);
					}).length === 6;
				})).then(testRepeatValuesWithBasicTemplate.bind(undefined, div, observableArray));
			});
			it("Having two splices at once", function () {
				var div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					observableArray = ObservableArray.apply(undefined, [
						{first: "Anne"},
						{first: "Ben"},
						{first: "Chad"},
						{first: "Irene"},
						{first: "John"}
					]);
				this.timeout = 10000;
				template.innerHTML = simpleTemplate;
				var binding = template.bind("repeat", observableArray);
				handles.push(binding);
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					observableArray.splice(3, 1, {first: "Irene0"}, {first: "Irene1"});
					observableArray.splice(1, 1, {first: "Ben0"}, {first: "Ben1"});
				}).then(waitFor.create(function () {
					var input = div.getElementsByTagName("input")[1];
					return input && input.value !== "Ben";
				})).then(testRepeatValuesWithBasicTemplate.bind(undefined, div, observableArray));
			});
			it("Repeat with nested template", function () {
				var div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					observableArray = ObservableArray.apply(undefined, [
						{first: "Anne", name: {first: "John"}},
						{first: "Ben", name: {first: "John"}},
						{first: "Chad", name: {first: "John"}},
						{first: "Irene", name: {first: "John"}}
					]);
				this.timeout = 10000;
				template.innerHTML = nestedTemplate;
				handles.push(template.bind("repeat", observableArray));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					return Array.prototype.filter.call(div.getElementsByTagName("input"), function (input) {
						return input.parentNode.nodeType !== Node.ELEMENT_NODE || input.parentNode.tagName !== "TEMPLATE";
					}).length === 8;
				}).then(function () {
					testRepeatValuesWithNestedTemplate(div, observableArray);
					observableArray.splice(1, 2, {first: "Chad", name: {first: "John"}});
				}).then(waitFor.create(function () {
					return Array.prototype.filter.call(div.getElementsByTagName("input"), function (input) {
						return !template.contains(input);
					}).length === 6;
				})).then(testRepeatValuesWithNestedTemplate.bind(undefined, div, observableArray));
			});
			it("Repeat with swapping model", function () {
				var div = document.createElement("div"),
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
				this.timeout = 10000;
				template.innerHTML = simpleTemplate;
				handles.push(template.bind("repeat", observablePath));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					testRepeatValuesWithBasicTemplate(div, observable.a);
					observable.set("a", observableArray1);
				}).then(waitFor.create(function () {
					return Array.prototype.filter.call(div.getElementsByTagName("input"), function (input) {
						return !template.contains(input);
					}).length === 3;
				})).then(function () {
					testRepeatValuesWithBasicTemplate(div, observable.a);
					observable.set("a", observableArray0);
				}).then(waitFor.create(function () {
					return Array.prototype.filter.call(div.getElementsByTagName("input"), function (input) {
						return !template.contains(input);
					}).length === 4;
				})).then(function () {
					testRepeatValuesWithBasicTemplate(div, observable.a);
					observable.set("a", observableArray1);
				}).then(waitFor.create(function () {
					return Array.prototype.filter.call(div.getElementsByTagName("input"), function (input) {
						return !template.contains(input);
					}).length === 3;
				})).then(function () {
					testRepeatValuesWithBasicTemplate(div, observable.a);
				});
			});
			it("Binding to another array for repeat right after binding", function () {
				var div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				this.timeout = 10000;
				template.innerHTML = simpleTemplate;
				template.bind("repeat", new ObservableArray());
				handles.push(template.bind("repeat", new ObservableArray("a", "b", "c")));
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					expect(div.querySelectorAll("input").length).to.equal(3);
				});
			});
			it("disabled attribute reflecting model", function () {
				var div = document.createElement("div"),
					observable = new Observable({disabled: false}),
					template = div.appendChild(document.createElement("template"));
				this.timeout = 10000;
				template.innerHTML = simpleWithConditionalAttributeBindingTemplate;
				handles.push(template.bind("bind", observable));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					var input = template.nextSibling;
					expect(input.disabled).to.be.false;
					observable.set("disabled", true);
				}).then(waitFor.create(function () {
					return template.nextSibling.disabled;
				}));
			});
			it("Simple conditional template", function () {
				var observable = new Observable({first: "John"}),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				this.timeout = 10000;
				template.innerHTML = simpleConditionalBindingTemplate;
				handles.push(template.bind("bind", observable));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					var text = template.nextSibling,
						input = text.nextSibling.nextSibling;
					expect(text.nodeValue).to.equal("John ");
					expect(input.tagName).not.to.equal("INPUT");
					observable.set("showInput", true);
				}).then(waitFor.create(function () {
					return Array.prototype.filter.call(div.getElementsByTagName("input"), function (input) {
						return !template.contains(input);
					}).length === 1;
				})).then(function () {
					var text = template.nextSibling,
						input = text.nextSibling.nextSibling;
					expect(text.nodeValue).to.equal("John ");
					expect(input.value).to.equal("John");
					input.value = "Anne";
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					input.dispatchEvent(event);
				}).then(waitFor.create(function () {
					return template.nextSibling.nodeValue !== "John ";
				})).then(function () {
					expect(template.nextSibling.nodeValue).to.equal("Anne ");
				});
			});
			it("Simple conditional repeating template", function () {
				var observable = new Observable({names: new ObservableArray({first: "Anne"}, {first: "Ben"})}),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				this.timeout = 10000;
				template.innerHTML = simpleConditionalRepeatingTemplate;
				handles.push(template.bind("bind", observable));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					var innerTemplate = template.nextSibling;
					expect(innerTemplate.nextSibling).to.be.null;
					observable.set("showInput", true);
				}).then(waitFor.create(function () {
					return Array.prototype.filter.call(div.getElementsByTagName("input"), function (input) {
						return !template.contains(input);
					}).length === 2;
				})).then(function () {
					var innerTemplate = template.nextSibling;
					expect(innerTemplate.nextSibling.value).to.equal("Anne");
					expect(innerTemplate.nextSibling.nextSibling.value).to.equal("Ben");
				});
			});
			it("Computed property", function () {
				var valueChangedInLastTest,
					observable = new Observable({
						first: "John",
						last: "Doe",
						name: computed(function (first, last) {
							return first + " " + last;
						}, "first", "last")
					}),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				this.timeout = 10000;
				template.innerHTML = computedTemplate;
				handles.push(template.bind("bind", observable));
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					expect(div.querySelectorAll("span")[2].innerHTML).to.equal("John Doe");
					expect(div.querySelectorAll("span")[3].innerHTML).to.equal("8");
					observable.set("first", "Ben");
				}).then(waitFor.create(function () {
					return div.querySelectorAll("span")[2].innerHTML !== "John Doe";
				})).then(function () {
					expect(div.querySelectorAll("span")[2].innerHTML).to.equal("Ben Doe");
					expect(div.querySelectorAll("span")[3].innerHTML).to.equal("7");
					template.bind("bind", undefined);
					return waitFor(function () {
						return !template.nextSibling;
					});
				}).then(function () {
					handles.push(new ObservablePath(observable, "name").observe(function (value) {
						if (value === "Irene Doe") {
							valueChangedInLastTest = true;
						}
					}));
					observable.set("first", "Irene");
				}).then(waitFor.create(100)).then(function () {
					expect(valueChangedInLastTest).not.to.be.true;
				});
			});
			it("Prevent cleaning up computed property", function () {
				var observable = new Observable({
						first: "John",
						last: "Doe",
						name: computed(function (first, last) {
							return first + " " + last;
						}, "first", "last")
					}),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				this.timeout = 10000;
				template.innerHTML = computedTemplate;
				template.preventRemoveComputed = true;
				handles.push(template.bind("bind", observable));
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					template.bind("bind", undefined);
				}).then(waitFor.create(function () {
					return !template.nextSibling;
				})).then(function () {
					var dfd = new Deferred();
					handles.push(new ObservablePath(observable, "name").observe(function (value) {
						if (value === "Irene Doe") {
							dfd.resolve(1);
						}
					}));
					observable.set("first", "Irene");
					return dfd.promise;
				});
			});
			it("Attribute template", function () {
				var dfd = this.async(10000),
					observableArray = new ObservableArray(new ObservableArray("foo0", "foo1", "foo2"),
						new ObservableArray("bar0", "bar1", "bar2"),
						new ObservableArray("baz0", "baz1", "baz2")),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = attributeTemplate;
				handles.push(template.bind("bind", observableArray));
				waitFor(function () {
					return div.getElementsByTagName("td").length === 9;
				}).then(function () {
					var count = 0,
						iterator = template.ownerDocument.createNodeIterator(template.nextSibling, NodeFilter.SHOW_ELEMENT, function (node) {
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
				}, dfd.reject.bind(dfd));
			});
			it("Empty binding", function () {
				var div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					observableArray = ObservableArray.apply(undefined, [
						"Anne",
						"Ben",
						"Chad",
						"Irene"
					]),
					observable = new Observable({a: observableArray}),
					observablePath = new ObservablePath(observable, "a");
				this.timeout = 10000;
				template.innerHTML = emptyBindingTemplate;
				handles.push(template.bind("repeat", observablePath));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					var iterator = div.ownerDocument.createNodeIterator(div, NodeFilter.SHOW_TEXT, function (node) {
						return (/^\s*$/).test(node.nodeValue) ? NodeFilter.FILTER_SKIP : NodeFilter.FILTER_ACCEPT;
					}, false);
					for (var inputs = div.getElementsByTagName("input"), i = 0, l = observableArray.length; i < l; ++i) {
						expect(iterator.nextNode().nodeValue).to.equal(observableArray[i] + " ");
						expect(inputs[i].value).to.equal(observableArray[i]);
					}
				});
			});
			var ieVer = parseFloat(navigator.appVersion.split("MSIE ")[1]) || undefined,
				mode = document.documentMode;
			if (mode && mode !== 5 && Math.floor(ieVer) !== mode) {
				ieVer = mode;
			}
			if (ieVer === undefined || ieVer > 9) {
				it("SVG - Basic", function () {
					var div = document.createElement("div"),
						observable = new Observable({width: 250, height: 150, red: 128, green: 255, blue: 0});
					this.timeout = 10000;
					div.innerHTML = svgTemplate;
					var template = div.querySelector("template"),
						binding = template.bind("bind", observable);
					handles.push(binding);
					document.body.appendChild(div);
					handles.push({
						remove: function () {
							div.innerHTML = "";
							document.body.removeChild(div);
						}
					});
					return waitFor(function () {
						try {
							var rect = div.querySelector("rect"),
								rgb = rect && getRGB(document.defaultView.getComputedStyle(rect).fill);
							return rect && rect.width.baseVal.value > 0 && rgb[0] > 0;
						} catch (e) {}
					}).then(function () {
						var rect = div.querySelector("rect");
						expect(rect.width.baseVal.value).to.equal(250);
						expect(rect.height.baseVal.value).to.equal(150);
						var rgb = getRGB(document.defaultView.getComputedStyle(rect).fill);
						expect(rgb[0]).to.equal(128);
						expect(rgb[1]).to.equal(255);
						expect(rgb[2]).to.equal(0);
						observable.set("width", 150);
						observable.set("height", 250);
						observable.set("blue", 128);
					}).then(waitFor.create(function () {
						try {
							var rect = div.querySelector("rect"),
								rgb = getRGB(document.defaultView.getComputedStyle(rect).fill);
							return rect.width.baseVal.value !== 250 && rgb[2] > 0;
						} catch (e) {}
					})).then(function () {
						var rect = div.querySelector("rect");
						expect(rect.width.baseVal.value).to.equal(150);
						expect(rect.height.baseVal.value).to.equal(250);
						var rgb = getRGB(document.defaultView.getComputedStyle(rect).fill);
						expect(rgb[0]).to.equal(128);
						expect(rgb[1]).to.equal(255);
						expect(rgb[2]).to.equal(128);
					});
				});
				it("SVG - Nested", function () {
					var div = document.createElement("div"),
						template = div.appendChild(document.createElement("template")),
						observable = new Observable({width: 250, height: 150, red: 128, green: 255, blue: 0});
					this.timeout = 10000;
					template.innerHTML = svgNestedTemplate;
					handles.push(template.bind("bind", observable));
					document.body.appendChild(div);
					handles.push({
						remove: function () {
							document.body.removeChild(div);
						}
					});
					return waitFor(function () {
						try {
							var rect = div.querySelector("rect"),
								rgb = rect && getRGB(document.defaultView.getComputedStyle(rect).fill);
							return rect && rect.width.baseVal.value > 0 && rgb[0] > 0;
						} catch (e) {}
					}).then(function () {
						var rect = div.querySelector("rect");
						expect(rect.width.baseVal.value).to.equal(250);
						expect(rect.height.baseVal.value).to.equal(150);
						var rgb = getRGB(document.defaultView.getComputedStyle(rect).fill);
						expect(rgb[0]).to.equal(128);
						expect(rgb[1]).to.equal(255);
						expect(rgb[2]).to.equal(0);
						observable.set("width", 150);
						observable.set("height", 250);
						observable.set("blue", 128);
					}).then(waitFor.create(function () {
						try {
							var rect = div.querySelector("rect"),
								rgb = getRGB(document.defaultView.getComputedStyle(rect).fill);
							return rect.width.baseVal.value !== 250 && rgb[2] > 0;
						} catch (e) {}
					})).then(function () {
						var rect = div.querySelector("rect");
						expect(rect.width.baseVal.value).to.equal(150);
						expect(rect.height.baseVal.value).to.equal(250);
						var rgb = getRGB(document.defaultView.getComputedStyle(rect).fill);
						expect(rgb[0]).to.equal(128);
						expect(rgb[1]).to.equal(255);
						expect(rgb[2]).to.equal(128);
					});
				});
			}
			it("CSS class attribute with regular value", function () {
				var div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					observable = new Observable({value: "Foo"});
				this.timeout = 10000;
				template.innerHTML = styleValueTemplate;
				var binding = template.bind("bind", observable);
				handles.push(binding);
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					expect(template.nextSibling.className).to.equal("my-class-Foo");
					observable.set("value", "Bar");
				}).then(waitFor.create(function () {
					return template.nextSibling.className !== "my-class-Foo";
				})).then(function () {
					expect(template.nextSibling.className).to.equal("my-class-Bar");
				});
			});
			it("Style binding", function () {
				var div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					observable = new Observable({
						show: true,
						hide: false,
						color: true,
						weight: true
					});
				this.timeout = 10000;
				template.innerHTML = styleTemplate;
				var binding = template.bind("bind", observable);
				handles.push(binding);
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					var span = template.nextSibling;
					expect(span.style.display).to.equal("");
					expect(span.className).to.equal("color weight");
					observable.set("hide", true);
					observable.set("color", false);
				}).then(waitFor.create(function () {
					return template.nextSibling.style.display === "none";
				})).then(function () {
					var span = template.nextSibling;
					expect(span.className).to.equal(" weight");
					observable.set("hide", false);
				}).then(waitFor.create(function () {
					return template.nextSibling.style.display === "";
				})).then(function () {
					observable.set("show", false);
				}).then(waitFor.create(function () {
					return template.nextSibling.style.display === "none";
				})).then(function () {
					observable.set("show", 2);
				}).then(waitFor.create(function () {
					return template.nextSibling.style.display === "";
				}));
			});
			it("Style binding with alternate binding source factory", function () {
				var div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					observable = new Observable({
						show: 1,
						hide: 0,
						color: 1,
						weight: 1
					}),
					origCreateBindingSourceFactory = template.createBindingSourceFactory;
				template.createBindingSourceFactory = function (expression, name) {
					var match;
					if (!/^(l\-show|l\-hide|class)$/.test(name) && (match = /^boolean:(.*)$/i.exec(expression))) {
						return function (model) {
							return new ObservablePath(model, match[1], function (value) {
								return !!value;
							});
						};
					}
					return origCreateBindingSourceFactory && origCreateBindingSourceFactory.apply(this, arguments);
				};
				this.timeout = 10000;
				template.innerHTML = styleWithAlternateBindingTemplate;
				var binding = template.bind("bind", observable);
				handles.push(binding);
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					var span = template.nextSibling;
					expect(span.style.display).to.equal("");
					expect(span.className).to.equal("color weight");
					observable.set("hide", 1);
					observable.set("color", 0);
				}).then(waitFor.create(function () {
					return template.nextSibling.style.display === "none";
				})).then(function () {
					var span = template.nextSibling;
					expect(span.className).to.equal(" weight");
					observable.set("hide", 0);
				}).then(waitFor.create(function () {
					return template.nextSibling.style.display === "";
				})).then(function () {
					observable.set("show", 0);
				}).then(waitFor.create(function () {
					return template.nextSibling.style.display === "none";
				}));
			});
			it("Declarative events", function () {
				var senderDiv,
					targetDiv,
					dfd1stClick = new Deferred(),
					dfd2ndClick = new Deferred(),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					observable = new Observable({handleClick: "Foo"});
				this.timeout = 10000;
				template.innerHTML = eventTemplate;
				handles.push(template.bind("bind", observable));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					// Make sure sending event before setting declarative event handler won't cause an exception, etc.
					senderDiv = template.nextSibling;
					targetDiv = senderDiv.firstChild;
					var event = document.createEvent("MouseEvents");
					event.initEvent("click", true, true);
					targetDiv.dispatchEvent(event);
				}).then(function () {
					var source = template.nextSibling.bindings["on-click"].source;
					source.setValue("Foo"); // Should be no-op
					source.deliver(); // Should be no-op
					expect(typeof source.discardChanges()).to.equal("function");
				}).then(function () {
					observable.set("handleClick", createDeclarativeEventResolver(dfd1stClick));
				}).then(waitFor.create(1000)).then(function () {
					senderDiv = template.nextSibling;
					targetDiv = senderDiv.firstChild;
					var event = document.createEvent("MouseEvents");
					event.initEvent("click", true, true);
					targetDiv.dispatchEvent(event);
				}).then(waitFor.create(dfd1stClick.promise)).then(function (data) {
					var event = data[1],
						sender = data[3];
					expect(event.type).to.equal("click");
					expect(sender).to.equal(senderDiv);
					observable.set("handleClick", createDeclarativeEventResolver(dfd2ndClick));
				}).then(function () {
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
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					observable = new Observable({
						handleClick: createDeclarativeEventResolver(dfd1stClick),
						foo: new Observable({
							bar: new Observable()
						})
					});
				this.timeout = 10000;
				template.innerHTML = nestedEventTemplate;
				handles.push(template.bind("bind", observable));
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					var divInner = div.querySelector("div");
					return divInner && [
						divInner.parentNode,
						(divInner.parentNode || {}).parentNode,
						((divInner.parentNode || {}).parentNode || {}).parentNode
					].every(function (div) {
						return (div || {}).nodeType === Node.ELEMENT_NODE && (div || {}).tagName !== "TEMPLATE";
					});
				}).then(function () {
					var event = document.createEvent("MouseEvents");
					event.initEvent("click", true, true);
					div.querySelector("div").dispatchEvent(event);
				}).then(waitFor.create(dfd1stClick.promise)).then(function (data) {
					var thisObject = data[0],
						event = data[1],
						sender = data[3];
					expect(thisObject).to.equal(observable);
					expect(event.type).to.equal("click");
					expect(sender).to.equal(div.querySelector("div"));
					observable.foo.set("handleClick", createDeclarativeEventResolver(dfd2ndClick));
				}).then(function () {
					var event = document.createEvent("MouseEvents");
					event.initEvent("click", true, true);
					div.querySelector("div").dispatchEvent(event);
				}).then(waitFor.create(dfd2ndClick.promise)).then(function (data) {
					var thisObject = data[0],
						event = data[1],
						sender = data[3];
					expect(thisObject).to.equal(observable.foo);
					expect(event.type).to.equal("click");
					expect(sender).to.equal(div.querySelector("div"));
					observable.foo.bar.set("handleClick", createDeclarativeEventResolver(dfd3rdClick));
				}).then(function () {
					var event = document.createEvent("MouseEvents");
					event.initEvent("click", true, true);
					div.querySelector("div").dispatchEvent(event);
				}).then(waitFor.create(dfd3rdClick.promise)).then(function (data) {
					var thisObject = data[0],
						event = data[1],
						sender = data[3];
					expect(thisObject).to.equal(observable.foo.bar);
					expect(event.type).to.equal("click");
					expect(sender).to.equal(div.querySelector("div"));
				});
			});
			it("Irregular template", function () {
				var observable = new Observable({foo: "Foo"}),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				this.timeout = 10000;
				template.innerHTML = irregularTemplate;
				handles.push(template.bind("bind", observable));
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					expect(template.nextSibling.nodeValue).to.equal("{{Foo");
					expect(!!template.nextSibling.nextSibling.bindings).to.be.false;
				});
			});
			it("Unbinding right after binding", function () {
				var observable = new Observable(),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				this.timeout = 10000;
				template.innerHTML = "<div></div>";
				var binding = template.bind("bind", new ObservablePath(observable, "foo"));
				handles.push(binding);
				template.unbind("bind");
				return waitFor(500).then(function () {
					expect(template.nextSibling).to.be.null;
					binding = template.bind("repeat", new ObservableArray("a", "b", "c"));
					handles.push(binding);
					template.unbind("repeat");
				}).then(waitFor.create(500)).then(function () {
					expect(template.nextSibling).to.be.null;
				});
			});
			it("Template reference: From <template>", function () {
				var observable = new Observable({first: "John", ref: "template0"}),
					div = document.createElement("div"),
					template0 = div.appendChild(document.createElement("template")),
					template1 = div.appendChild(document.createElement("script")),
					template2 = div.appendChild(document.createElement("template"));
				this.timeout = 10000;
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						div.parentNode.removeChild(div);
					}
				});
				template0.innerHTML = simpleTemplate;
				template0.id = "template0";
				template1.type = "text/x-template";
				template1.innerHTML = "<div></div>";
				template1.id = "template1";
				handles.push(template2.bind("bind", observable), template2.bind("ref", new ObservablePath(observable, "ref")));
				return waitFor(function () {
					return template2.nextSibling;
				}).then(function () {
					var text = template2.nextSibling,
						input = text.nextSibling;
					expect(text.nodeValue).to.equal("John ");
					expect(input.value).to.equal("John");
					observable.set("ref", "template1");
				}).then(waitFor.create(function () {
					return template2.nextSibling && template2.nextSibling.tagName === "DIV";
				})).then(function () {
					observable.set("ref", "foo");
				}).then(waitFor.create(function () {
					return !template2.nextSibling;
				}));
			});
			it("Template reference: From <script type=\"x-template\">", function () {
				var observable = new Observable({first: "John", ref: "template0"}),
					div = document.createElement("div"),
					template0 = div.appendChild(document.createElement("template")),
					template1 = div.appendChild(document.createElement("script")),
					template2 = div.appendChild(document.createElement("script"));
				this.timeout = 10000;
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						div.parentNode.removeChild(div);
					}
				});
				template0.innerHTML = simpleTemplate;
				template0.id = "template0";
				template1.type = "text/x-template";
				template1.innerHTML = "<div></div>";
				template1.id = "template1";
				template2.type = "text/x-template";
				handles.push(template2.bind("bind", observable), template2.bind("ref", new ObservablePath(observable, "ref")));
				return waitFor(function () {
					return template2.nextSibling;
				}).then(function () {
					var text = template2.nextSibling,
						input = text.nextSibling;
					expect(text.nodeValue).to.equal("John ");
					expect(input.value).to.equal("John");
					observable.set("ref", "template1");
				}).then(waitFor.create(function () {
					return template2.nextSibling && template2.nextSibling.tagName === "DIV";
				})).then(function () {
					observable.set("ref", "foo");
				}).then(waitFor.create(function () {
					return !template2.nextSibling;
				}));
			});
		});
	}
});
