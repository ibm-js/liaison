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
				var input = createInput("text"),
					target = input.bind("value");
				handles.push(target);
				expect(input.bind("value")).to.equal(target);
				target.remove();
				var another = input.bind("value");
				handles.push(another);
				expect(another).not.to.equal(target);
				another.remove();
				expect(!!input._targets).not.to.be.true;
			});
			it("Text box reflecting model", function () {
				var dfd = this.async(1000),
					input = createInput("text"),
					observable = new Observable({foo: "Foo0"});
				handles.push(document.body.appendChild(input).bind("value", new ObservablePath(observable, "foo")));
				handles.push({
					remove: function () {
						document.body.removeChild(input);
					}
				});
				expect(input.value).to.equal("Foo0");
				setTimeout(dfd.rejectOnError(function () {
					observable.set("foo", "Foo1");
					setTimeout(dfd.callback(function () {
						expect(input.value).to.equal("Foo1");
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
					observable = new Observable({foo: false});
				handles.push(document.body.appendChild(input).bind("checked", new ObservablePath(observable, "foo")));
				handles.push({
					remove: function () {
						document.body.removeChild(input);
					}
				});
				expect(input.checked).to.equal(false);
				setTimeout(dfd.rejectOnError(function () {
					observable.set("foo", true);
					setTimeout(dfd.callback(function () {
						expect(input.checked).to.equal(true);
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
					observable = new Observable({foo: "Foo0"});
				handles.push(document.body.appendChild(text).bind("nodeValue", new ObservablePath(observable, "foo")));
				handles.push({
					remove: function () {
						document.body.removeChild(text);
					}
				});
				expect(text.nodeValue).to.equal("Foo0");
				setTimeout(dfd.rejectOnError(function () {
					observable.set("foo", "Foo1");
					setTimeout(dfd.callback(function () {
						expect(text.nodeValue).to.equal("Foo1");
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
