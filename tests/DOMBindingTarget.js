define([
	"intern!bdd",
	"intern/chai!expect",
	"../Observable",
	"../ObservablePath",
	"../DOMBindingTarget"
], function (bdd, expect, Observable, ObservablePath) {
	/* jshint withstmt: true */
	/* global describe, afterEach, it */
	with (bdd) {
		describe("Test liaison/DOMBindingTarget", function () {
			var handles = [];
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					handle.remove();
				}
			});
			function createInput(type, initialValue) {
				var input = document.createElement("input");
				input.type = type;
				input.value = initialValue || "";
				return input;
			}
			it("Getting existing BindingTarget", function () {
				var text = document.createTextNode(""),
					div = document.createElement("div"),
					input = createInput("text"),
					textTarget = text.bind("nodeValue"),
					divTarget = div.bind("attrib"),
					inputTarget = input.bind("value");
				handles.push(textTarget, divTarget, inputTarget);
				expect(text.bind("nodeValue")).to.equal(textTarget);
				expect(div.bind("attrib")).to.equal(divTarget);
				expect(input.bind("value")).to.equal(inputTarget);
				text.unbind("nodeValue");
				div.unbind("attrib");
				input.unbind("value");
				var anotherTextTarget = text.bind("nodeValue"),
					anotherDivTarget = div.bind("attrib"),
					anotherInputTarget = input.bind("value");
				handles.push(anotherTextTarget, anotherDivTarget, anotherInputTarget);
				expect(anotherTextTarget).not.to.equal(textTarget);
				expect(anotherDivTarget).not.to.equal(divTarget);
				expect(anotherInputTarget).not.to.equal(inputTarget);
				text.unbind("nodeValue");
				div.unbind("attrib");
				input.unbind("value");
				expect(!!text._targets).not.to.be.true;
				expect(!!div._targets).not.to.be.true;
				expect(!!input._targets).not.to.be.true;
				// Make sure unbinding twice won't cause anything wrong
				text.unbind("nodeValue");
				div.unbind("attrib");
				input.unbind("value");
				expect(!!text._targets).not.to.be.true;
				expect(!!div._targets).not.to.be.true;
				expect(!!input._targets).not.to.be.true;
			});
			it("DOM node without binding feature", function () {
				var caught,
					div = document.createElement("div"),
					observable = new Observable({foo: "Foo"});
				div.setAttribute("attrib", "value");
				expect(typeof div.attributes[0].bind).to.equal("function");
				try {
					div.attributes[0].bind("value", observable);
				} catch (e) {
					caught = true;
				}
				expect(caught).to.be.true;
				caught = false;
				var pi;
				try {
					pi = document.createProcessingInstruction("xml", "version=\"1.0\" encoding=\"utf-8\"");
				} catch (e) {
					expect(e.code).to.equal(e.NOT_SUPPORTED_ERR);
				}
				if (pi) {
					expect(typeof pi.bind).to.equal("function");
					try {
						pi.bind("value", observable);
					} catch (e) {
						caught = true;
					}
					expect(caught).to.be.true;
					caught = false;
				}
				div.innerHTML = "<!-- Comment -->";
				expect(typeof div.firstChild.bind).to.equal("function");
				try {
					div.firstChild.bind("value", observable);
				} catch (e) {
					caught = true;
				}
				expect(caught).to.be.true;
				caught = false;
				var xml = new DOMParser().parseFromString("<xml><![CDATA[cdata]]></xml>", "application/xml");
				expect(typeof xml.bind).to.equal("function");
				try {
					xml.bind("value", observable);
				} catch (e) {
					caught = true;
				}
				expect(caught).to.be.true;
				caught = false;
				var frag = document.createDocumentFragment();
				expect(typeof frag.bind).to.equal("function");
				try {
					frag.bind("value", observable);
				} catch (e) {
					caught = true;
				}
				expect(caught).to.be.true;
				var type = document.implementation.createDocumentType("html", "", "");
				expect(typeof type.bind).to.equal("function");
				try {
					type.bind("value", observable);
				} catch (e) {
					caught = true;
				}
				expect(caught).to.be.true;
				caught = false;
			});
			it("Attribute reflecting model", function () {
				var dfd = this.async(1000),
					div = document.createElement("div"),
					observable = new Observable({foo: "Foo0"}),
					binding = div.bind("attrib", new ObservablePath(observable, "foo"));
				handles.push(binding);
				expect(div.getAttribute("attrib")).to.equal("Foo0");
				expect(binding.value).to.equal("Foo0");
				setTimeout(dfd.rejectOnError(function () {
					observable.set("foo", "Foo1");
					setTimeout(dfd.callback(function () {
						expect(div.getAttribute("attrib")).to.equal("Foo1");
						expect(binding.value).to.equal("Foo1");
					}), 100);
				}), 500);
			});
			it("Conditional attribute reflecting model", function () {
				var dfd = this.async(1000),
					div = document.createElement("div"),
					observable = new Observable(),
					binding = div.bind("attrib?", new ObservablePath(observable, "foo"));
				handles.push(binding);
				expect(div.hasAttribute("attrib")).to.be.false;
				expect(binding.value).to.be.false;
				setTimeout(dfd.rejectOnError(function () {
					observable.set("foo", true);
					setTimeout(dfd.callback(function () {
						expect(div.hasAttribute("attrib")).to.be.true;
						expect(binding.value).to.be.true;
					}), 100);
				}), 500);
			});
			it("Text box reflecting model", function () {
				var dfd = this.async(1000),
					input = createInput("text"),
					observable = new Observable({foo: "Foo0"}),
					binding = document.body.appendChild(input).bind("value", new ObservablePath(observable, "foo"));
				handles.push(binding);
				handles.push({
					remove: function () {
						document.body.removeChild(input);
					}
				});
				expect(input.value).to.equal("Foo0");
				expect(binding.value).to.equal("Foo0");
				setTimeout(dfd.rejectOnError(function () {
					observable.set("foo", "Foo1");
					setTimeout(dfd.callback(function () {
						expect(input.value).to.equal("Foo1");
						expect(binding.value).to.equal("Foo1");
					}), 100);
				}), 500);
			});
			it("Model reflecting text box", function () {
				var input = createInput("text"),
					observable = new Observable({foo: "Foo0"});
				handles.push(document.body.appendChild(input).bind("value", new ObservablePath(observable, "foo")));
				handles.push({
					remove: function () {
						document.body.removeChild(input);
					}
				});
				expect(input.value).to.equal("Foo0");
				input.value = "Foo1";
				var event = document.createEvent("HTMLEvents");
				event.initEvent("change", false, true);
				input.dispatchEvent(event);
				expect(observable.foo).to.equal("Foo1");
			});
			it("Check box reflecting model", function () {
				var dfd = this.async(1000),
					input = createInput("checkbox"),
					observable = new Observable({foo: false}),
					binding = document.body.appendChild(input).bind("checked", new ObservablePath(observable, "foo"));
				handles.push(binding);
				handles.push({
					remove: function () {
						document.body.removeChild(input);
					}
				});
				expect(input.checked).to.equal(false);
				expect(binding.value).to.equal(false);
				setTimeout(dfd.rejectOnError(function () {
					observable.set("foo", true);
					setTimeout(dfd.callback(function () {
						expect(input.checked).to.equal(true);
						expect(binding.value).to.equal(true);
					}), 100);
				}), 500);
			});
			it("Model reflecting check box", function () {
				var input = createInput("checkbox"),
					observable = new Observable({foo: false});
				handles.push(document.body.appendChild(input).bind("checked", new ObservablePath(observable, "foo")));
				handles.push({
					remove: function () {
						document.body.removeChild(input);
					}
				});
				expect(input.checked).to.equal(false);
				var event = document.createEvent("MouseEvents");
				event.initEvent("click", false, true);
				input.dispatchEvent(event);
				expect(observable.foo).to.equal(true);
			});
			it("Text node reflecting model", function () {
				var dfd = this.async(1000),
					text = document.createTextNode(""),
					observable = new Observable({foo: "Foo0"}),
					binding = document.body.appendChild(text).bind("nodeValue", new ObservablePath(observable, "foo"));
				handles.push(binding);
				handles.push({
					remove: function () {
						document.body.removeChild(text);
					}
				});
				expect(text.nodeValue).to.equal("Foo0");
				expect(binding.value).to.equal("Foo0");
				setTimeout(dfd.rejectOnError(function () {
					observable.set("foo", "Foo1");
					setTimeout(dfd.callback(function () {
						expect(text.nodeValue).to.equal("Foo1");
						expect(binding.value).to.equal("Foo1");
					}), 500);
				}), 100);
			});
			it("Style attribute reflecting model", function () {
				var dfd = this.async(1000),
					div = document.createElement("div"),
					observable = new Observable({foo: "color:red;"});
				handles.push(document.body.appendChild(div).bind("style", new ObservablePath(observable, "foo")));
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				expect(div.style.color).to.equal("red");
				setTimeout(dfd.rejectOnError(function () {
					observable.set("foo", "color:blue;");
					setTimeout(dfd.callback(function () {
						expect(div.style.color).to.equal("blue");
					}), 500);
				}), 100);
			});
		});
	}
});
