define([
	"intern!bdd",
	"intern/chai!expect",
	"delite/register",
	"../../../wrapper",
	"../../../Observable",
	"../../../ObservablePath",
	"../../../delite/widgets/RadioButton",
	"../../waitFor",
	"dojo/text!./templates/basicRadioButton.html",
	"../../../delite/WidgetBindingTarget"
], function (bdd, expect, register, wrapper, Observable, ObservablePath, RadioButton, waitFor, basicRadioButtonTemplate) {
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
				var dfd = this.async(10000),
					observable = new Observable({current: "bar", bazValue: "baz"}),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = basicRadioButtonTemplate;
				handles.push(template.bind("bind", observable));
				waitFor(function () {
					var inputs = div.getElementsByTagName("input");
					return inputs.length === 3 && inputs[1].checked;
				}).then(function () {
					var inputs = div.getElementsByTagName("input");
					expect(inputs[0].checked).not.to.be.true;
					expect(inputs[2].checked).not.to.be.true;
					observable.set("current", "foo");
					return waitFor(function () {
						return inputs[0].current === "foo";
					});
				}).then(dfd.callback(function () {
					var inputs = div.getElementsByTagName("input");
					expect(inputs[0].checked).to.be.true;
					expect(inputs[1].checked).not.to.be.true;
					expect(inputs[2].checked).not.to.be.true;
					inputs[2].checked = true;
					var event = document.createEvent("HTMLEvents");
					event.initEvent("change", false, true);
					inputs[2].dispatchEvent(event);
					expect(observable.current).to.equal("baz");
				}), dfd.reject.bind(dfd));
			});
			it("Changing checked", function () {
				var dfd = this.async(10000),
					observable = new Observable({current: "bar", bazValue: "baz"}),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = basicRadioButtonTemplate;
				handles.push(template.bind("bind", observable));
				waitFor(function () {
					var inputs = div.getElementsByTagName("input");
					return inputs.length === 3 && inputs[1].checked;
				}).then(function () {
					observable.set("bazChecked", true);
					return waitFor(function () {
						return observable.current !== "bar";
					});
				}).then(dfd.callback(function () {
					expect(observable.current).to.equal("baz");
				}), dfd.reject.bind(dfd));
			});
			it("Changing value", function () {
				var dfd = this.async(10000),
					observable = new Observable({current: "baz", bazValue: "baz"}),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = basicRadioButtonTemplate;
				handles.push(template.bind("bind", observable));
				waitFor(function () {
					var inputs = div.getElementsByTagName("input");
					return inputs.length === 3 && inputs[2].checked;
				}).then(function () {
					observable.set("bazValue", "BAZ");
					return waitFor(function () {
						return observable.current !== "baz";
					});
				}).then(dfd.callback(function () {
					expect(observable.current).to.equal("BAZ");
				}), dfd.reject.bind(dfd));
			});
		});
	}
});
