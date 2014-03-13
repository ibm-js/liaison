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
			function createInput(type, name, initialValue) {
				var input = document.createElement("input");
				input.type = type;
				name && (input.name = name);
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
				observable.set("foo", "Foo1");
				setTimeout(dfd.callback(function () {
					expect(div.getAttribute("attrib")).to.equal("Foo1");
					expect(binding.value).to.equal("Foo1");
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
				observable.set("foo", true);
				setTimeout(dfd.callback(function () {
					expect(div.hasAttribute("attrib")).to.be.true;
					expect(binding.value).to.be.true;
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
				observable.set("foo", "Foo1");
				setTimeout(dfd.callback(function () {
					expect(input.value).to.equal("Foo1");
					expect(binding.value).to.equal("Foo1");
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
				event.initEvent("input", false, true);
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
				observable.set("foo", true);
				setTimeout(dfd.callback(function () {
					expect(input.checked).to.equal(true);
					expect(binding.value).to.equal(true);
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
			it("Radio button reflecting model", function () {
				var dfd = this.async(1000),
					radio0 = createInput("radio", "foo", "Foo0"),
					radio1 = createInput("radio", "foo", "Foo1"),
					observable = new Observable({0: true, 1: false}),
					binding0 = document.body.appendChild(radio0).bind("checked", new ObservablePath(observable, "0")),
					binding1 = document.body.appendChild(radio1).bind("checked", new ObservablePath(observable, "1"));
				handles.push(binding0, binding1);
				handles.push({
					remove: function () {
						document.body.removeChild(radio0);
						document.body.removeChild(radio1);
					}
				});
				expect(radio0.checked).to.be.true;
				expect(binding0.value).to.be.true;
				expect(radio1.checked).not.to.be.true;
				expect(binding1.value).not.to.be.true;
				observable.set(1, true);
				setTimeout(dfd.callback(function () {
					expect(radio0.checked).not.to.be.true;
					expect(binding0.value).not.to.be.true;
					expect(radio1.checked).to.be.true;
					expect(binding1.value).to.be.true;
					expect(observable["0"]).not.to.be.true;
				}), 500);
			});
			it("Model reflecting radio button", function () {
				var radio0 = createInput("radio", "foo", "Foo0"),
					radio1 = createInput("radio", "foo", "Foo1"),
					observable = new Observable({0: true, 1: false});
				handles.push(document.body.appendChild(radio0).bind("checked", new ObservablePath(observable, "0")));
				handles.push(document.body.appendChild(radio1).bind("checked", new ObservablePath(observable, "1")));
				handles.push({
					remove: function () {
						document.body.removeChild(radio0);
						document.body.removeChild(radio1);
					}
				});
				expect(radio0.checked).to.be.true;
				expect(radio1.checked).not.to.be.true;
				var event = document.createEvent("MouseEvents");
				event.initEvent("click", false, true);
				radio1.dispatchEvent(event);
				expect(observable["0"]).not.to.be.true;
				expect(observable["1"]).to.be.true;
			});
			it("Select value reflecting model", function () {
				var binding, option,
					dfd = this.async(1000),
					select = document.createElement("select"),
					observable = new Observable({foo: "Foo0", foo0: "Foo0", foo1: "Foo1"});
				option = document.createElement("option");
				handles.push(option.bind("value", new ObservablePath(observable, "foo0")));
				select.appendChild(option);
				option = document.createElement("option");
				handles.push(option.bind("value", new ObservablePath(observable, "foo1")));
				select.appendChild(option);
				handles.push(binding = document.body.appendChild(select).bind("value", new ObservablePath(observable, "foo")));
				handles.push({
					remove: function () {
						document.body.removeChild(select);
					}
				});
				expect(select.querySelectorAll("option")[0].selected).to.be.true;
				expect(select.querySelectorAll("option")[1].selected).not.to.be.true;
				expect(select.selectedIndex).to.equal(0);
				expect(select.value).to.equal("Foo0");
				expect(binding.value).to.equal("Foo0");
				observable.set("foo", "Foo1");
				setTimeout(dfd.callback(function () {
					expect(select.querySelectorAll("option")[0].selected).not.to.be.true;
					expect(select.querySelectorAll("option")[1].selected).to.be.true;
					expect(select.selectedIndex).to.equal(1);
					expect(select.value).to.equal("Foo1");
					expect(binding.value).to.equal("Foo1");
				}), 500);
			});
			it("Model reflecting select value", function () {
				var option,
					select = document.createElement("select"),
					observable = new Observable({foo: "Foo0", foo0: "Foo0", foo1: "Foo1"});
				option = document.createElement("option");
				handles.push(option.bind("value", new ObservablePath(observable, "foo0")));
				select.appendChild(option);
				option = document.createElement("option");
				handles.push(option.bind("value", new ObservablePath(observable, "foo1")));
				select.appendChild(option);
				handles.push(document.body.appendChild(select).bind("value", new ObservablePath(observable, "foo")));
				handles.push({
					remove: function () {
						document.body.removeChild(select);
					}
				});
				expect(select.querySelectorAll("option")[0].selected).to.be.true;
				expect(select.querySelectorAll("option")[1].selected).not.to.be.true;
				expect(select.selectedIndex).to.equal(0);
				expect(select.value).to.equal("Foo0");
				select.value = "Foo1";
				var event = document.createEvent("HTMLEvents");
				event.initEvent("change", false, true);
				select.dispatchEvent(event);
				expect(observable.foo).to.equal("Foo1");
			});
			it("Select index reflecting model", function () {
				var binding, option,
					dfd = this.async(1000),
					select = document.createElement("select"),
					observable = new Observable({index: 0});
				option = document.createElement("option");
				option.value = "Foo0";
				select.appendChild(option);
				option = document.createElement("option");
				option.value = "Foo1";
				select.appendChild(option);
				handles.push(binding = document.body.appendChild(select).bind("selectedIndex", new ObservablePath(observable, "index")));
				handles.push({
					remove: function () {
						document.body.removeChild(select);
					}
				});
				expect(select.querySelectorAll("option")[0].selected).to.be.true;
				expect(select.querySelectorAll("option")[1].selected).not.to.be.true;
				expect(select.selectedIndex).to.equal(0);
				expect(select.value).to.equal("Foo0");
				expect(binding.value).to.equal(0);
				observable.set("index", 1);
				setTimeout(dfd.callback(function () {
					expect(select.querySelectorAll("option")[0].selected).not.to.be.true;
					expect(select.querySelectorAll("option")[1].selected).to.be.true;
					expect(select.selectedIndex).to.equal(1);
					expect(select.value).to.equal("Foo1");
					expect(binding.value).to.equal(1);
				}), 500);
			});
			it("Model reflecting select index", function () {
				var option,
					select = document.createElement("select"),
					observable = new Observable({index: 0});
				option = document.createElement("option");
				option.value = "Foo0";
				select.appendChild(option);
				option = document.createElement("option");
				option.value = "Foo1";
				select.appendChild(option);
				handles.push(document.body.appendChild(select).bind("selectedIndex", new ObservablePath(observable, "index")));
				handles.push({
					remove: function () {
						document.body.removeChild(select);
					}
				});
				expect(select.querySelectorAll("option")[0].selected).to.be.true;
				expect(select.querySelectorAll("option")[1].selected).not.to.be.true;
				expect(select.selectedIndex).to.equal(0);
				expect(select.value).to.equal("Foo0");
				select.value = "Foo1";
				var event = document.createEvent("HTMLEvents");
				event.initEvent("change", false, true);
				select.dispatchEvent(event);
				expect(observable.index).to.equal(1);
			});
			it("Text area reflecting model", function () {
				var dfd = this.async(1000),
					textarea = document.createElement("textarea"),
					observable = new Observable({foo: "Foo0"}),
					binding = document.body.appendChild(textarea).bind("value", new ObservablePath(observable, "foo"));
				handles.push(binding);
				handles.push({
					remove: function () {
						document.body.removeChild(textarea);
					}
				});
				expect(textarea.value).to.equal("Foo0");
				expect(binding.value).to.equal("Foo0");
				observable.set("foo", "Foo1");
				setTimeout(dfd.callback(function () {
					expect(textarea.value).to.equal("Foo1");
					expect(binding.value).to.equal("Foo1");
				}), 500);
			});
			it("Model reflecting text area", function () {
				var textarea = document.createElement("textarea"),
					observable = new Observable({foo: "Foo0"});
				handles.push(document.body.appendChild(textarea).bind("value", new ObservablePath(observable, "foo")));
				handles.push({
					remove: function () {
						document.body.removeChild(textarea);
					}
				});
				expect(textarea.value).to.equal("Foo0");
				textarea.value = "Foo1";
				var event = document.createEvent("HTMLEvents");
				event.initEvent("input", false, true);
				textarea.dispatchEvent(event);
				expect(observable.foo).to.equal("Foo1");
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
				observable.set("foo", "Foo1");
				setTimeout(dfd.callback(function () {
					expect(text.nodeValue).to.equal("Foo1");
					expect(binding.value).to.equal("Foo1");
				}), 500);
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
				observable.set("foo", "color:blue;");
				setTimeout(dfd.callback(function () {
					expect(div.style.color).to.equal("blue");
				}), 500);
			});
		});
	}
});
