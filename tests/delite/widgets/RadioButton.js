define([
	"intern!bdd",
	"intern/chai!expect",
	"delite/register",
	"decor/Observable",
	"../../../wrapper",
	"../../../ObservablePath",
	"../../../delite/widgets/RadioButton",
	"../../waitFor",
	"requirejs-text/text!./templates/basicRadioButton.html",
	"../../../delite/WidgetBindingTarget",
	"../../sandbox/monitor"
], function (bdd, expect, register, Observable, wrapper, ObservablePath, RadioButton, waitFor, basicRadioButtonTemplate) {
	/* jshint withstmt: true */
	/* global describe, afterEach, it */
	with (bdd) {
		describe("Test liaison/delite/widgets/RadioButton", function () {
			var handles = [];
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					handle.remove();
				}
			});
			it("Basic", function () {
				var observable = new Observable({current: "bar", bazValue: "baz"}),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				this.timeout = 10000;
				template.innerHTML = basicRadioButtonTemplate;
				handles.push(template.bind("bind", observable));
				return waitFor(function () {
					// Putting element containing non-upgraded `<template>` (happens with IE) to render tree
					// causes content in `<template>` being upgraded by delite code
					// Ref: https://github.com/ibm-js/delite/blob/0.8.2/register.js#L505
					return (template.content || {}).nodeType === Node.DOCUMENT_FRAGMENT_NODE;
				}).then(function () {
					document.body.appendChild(div);
					handles.push({
						remove: function () {
							document.body.removeChild(div);
						}
					});
				}).then(waitFor.create(function () {
					var inputs = div.getElementsByTagName("input");
					return inputs.length === 3 && inputs[1].checked;
				})).then(function () {
					var inputs = div.getElementsByTagName("input");
					expect(inputs[0].checked).not.to.be.true;
					expect(inputs[2].checked).not.to.be.true;
					observable.set("current", "foo");
				}).then(waitFor.create(function () {
					return div.getElementsByTagName("input")[0].current === "foo";
				})).then(function () {
					var inputs = div.getElementsByTagName("input");
					expect(inputs[0].checked).to.be.true;
					expect(inputs[1].checked).not.to.be.true;
					expect(inputs[2].checked).not.to.be.true;
					inputs[2].checked = true;
					var event = document.createEvent("HTMLEvents");
					event.initEvent("change", false, true);
					inputs[2].dispatchEvent(event);
				}).then(waitFor.create(function () {
					return observable.current !== "foo";
				})).then(function () {
					expect(observable.current).to.equal("baz");
				});
			});
			it("Changing checked", function () {
				var observable = new Observable({current: "bar", bazValue: "baz"}),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				this.timeout = 10000;
				template.innerHTML = basicRadioButtonTemplate;
				handles.push(template.bind("bind", observable));
				return waitFor(function () {
					// Putting element containing non-upgraded `<template>` (happens with IE) to render tree
					// causes content in `<template>` being upgraded by delite code
					// Ref: https://github.com/ibm-js/delite/blob/0.8.2/register.js#L505
					return (template.content || {}).nodeType === Node.DOCUMENT_FRAGMENT_NODE;
				}).then(function () {
					document.body.appendChild(div);
					handles.push({
						remove: function () {
							document.body.removeChild(div);
						}
					});
				}).then(waitFor.create(function () {
					var inputs = div.getElementsByTagName("input");
					return inputs.length === 3 && inputs[1].checked;
				})).then(function () {
					observable.set("bazChecked", true);
				}).then(waitFor.create(function () {
					return observable.current !== "bar";
				})).then(function () {
					expect(observable.current).to.equal("baz");
				});
			});
			it("Changing value", function () {
				var observable = new Observable({current: "baz", bazValue: "baz"}),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				this.timeout = 10000;
				template.innerHTML = basicRadioButtonTemplate;
				handles.push(template.bind("bind", observable));
				return waitFor(function () {
					// Putting element containing non-upgraded `<template>` (happens with IE) to render tree
					// causes content in `<template>` being upgraded by delite code
					// Ref: https://github.com/ibm-js/delite/blob/0.8.2/register.js#L505
					return (template.content || {}).nodeType === Node.DOCUMENT_FRAGMENT_NODE;
				}).then(function () {
					document.body.appendChild(div);
					handles.push({
						remove: function () {
							document.body.removeChild(div);
						}
					});
				}).then(waitFor.create(function () {
					var inputs = div.getElementsByTagName("input");
					return inputs.length === 3 && inputs[2].checked;
				})).then(function () {
					observable.set("bazValue", "BAZ");
				}).then(waitFor.create(function () {
					return observable.current !== "baz";
				})).then(function () {
					expect(observable.current).to.equal("BAZ");
				});
			});
		});
	}
});
