define([
	"intern!bdd",
	"intern/chai!expect",
	"delite/register",
	"liaison/wrapper",
	"liaison/Observable",
	"liaison/ObservablePath",
	"liaison/delite/widgets/RadioButton",
	"dojo/text!./templates/basicRadioButton.html",
	"liaison/delite/WidgetBindingTarget"
], function (bdd, expect, register, wrapper, Observable, ObservablePath, RadioButton, basicRadioButtonTemplate) {
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
				setTimeout(dfd.rejectOnError(function () {
					var inputs = div.getElementsByTagName("input");
					expect(inputs[0].checked).not.to.be.true;
					expect(inputs[1].checked).to.be.true;
					expect(inputs[2].checked).not.to.be.true;
					observable.set("current", "foo");
					setTimeout(dfd.callback(function () {
						expect(inputs[0].checked).to.be.true;
						expect(inputs[1].checked).not.to.be.true;
						expect(inputs[2].checked).not.to.be.true;
						inputs[2].checked = true;
						var event = document.createEvent("HTMLEvents");
						event.initEvent("change", false, true);
						inputs[2].dispatchEvent(event);
						expect(observable.current).to.equal("baz");
					}), 500);
				}), 500);
			});
			it("Changing checked", function () {
				var dfd = this.async(10000),
					observable = new Observable({current: "bar", bazValue: "baz"}),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = basicRadioButtonTemplate;
				handles.push(template.bind("bind", observable));
				setTimeout(dfd.rejectOnError(function () {
					observable.set("bazChecked", true);
					setTimeout(dfd.callback(function () {
						expect(observable.current).to.equal("baz");
					}), 500);
				}), 500);
			});
			it("Changing value", function () {
				var dfd = this.async(10000),
					observable = new Observable({current: "baz", bazValue: "baz"}),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template"));
				template.innerHTML = basicRadioButtonTemplate;
				handles.push(template.bind("bind", observable));
				setTimeout(dfd.rejectOnError(function () {
					observable.set("bazValue", "BAZ");
					setTimeout(dfd.callback(function () {
						expect(observable.current).to.equal("BAZ");
					}), 500);
				}), 500);
			});
		});
	}
});
