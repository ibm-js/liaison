define([
	"intern!bdd",
	"intern/chai!expect",
	"delite/register",
	"../../../computed",
	"../../../wrapper",
	"../../../ObservablePath",
	"../../../delite/widgets/Widget",
	"../../waitFor",
], function (bdd, expect, register, computed, wrapper, ObservablePath, Widget, waitFor) {
	/* jshint withstmt: true */
	/* global describe, afterEach, it */
	with (bdd) {
		describe("Test liaison/delite/widgets/Widget", function () {
			var handles = [];
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					handle.remove();
				}
			});
			it("Changed watcher", function () {
				var created,
					changeCount = 0,
					dfd = this.async(10000);
				register("liaison-test-basic-data", [HTMLElement, Widget], wrapper.wrap({
					first: "John",
					last: "Doe",
					firstChanged: dfd.rejectOnError(function (first, oldFirst) {
						if (created) {
							expect(first).to.equal("Anne");
							expect(oldFirst).to.equal("John");
							if (++changeCount >= 2) {
								dfd.resolve(1);
							}
						}
					}),
					lastChanged: dfd.rejectOnError(function (last, oldLast) {
						if (created) {
							expect(last).to.equal("Ackerman");
							expect(oldLast).to.equal("Doe");
							if (++changeCount >= 2) {
								dfd.resolve(1);
							}
						}
					})
				}));
				var elem = register.createElement("liaison-test-basic-data");
				created = true;
				elem.first = "Anne";
				elem.last = "Ackerman";
			});
			it("Computed property", function () {
				register("liaison-test-computed", [HTMLElement, Widget], wrapper.wrap({
					baseClass: "liaison-test-computed",
					first: "John",
					last: "Doe",
					name: computed(function (first, last) {
						return first + " " + last;
					}, "first", "last")
				}));
				var changeCount = 0,
					dfd = this.async(10000),
					elem = register.createElement("liaison-test-computed");
				handles.push({
					remove: function () {
						elem.destroy();
					}
				});
				handles.push(new ObservablePath(elem, "name").observe(dfd.rejectOnError(function (name, oldName) {
					expect(name).to.equal("Ben Doe");
					expect(oldName).to.equal("John Doe");
					if (++changeCount >= 2) {
						dfd.resolve(1);
					}
				})));
				handles.push(new ObservablePath(elem, "name.length").observe(dfd.rejectOnError(function (nameLength, oldNameLength) {
					expect(nameLength).to.equal(7);
					expect(oldNameLength).to.equal(8);
					if (++changeCount >= 2) {
						dfd.resolve(1);
					}
				})));
				elem.first = "Ben";
			});
			it("Computed array", function () {
				var created,
					dfd = this.async(10000);
				register("liaison-test-computedarray", [HTMLElement, Widget], wrapper.wrap({
					baseClass: "liaison-test-computedarray",
					items: [
						{Name: "Anne Ackerman"},
						{Name: "Ben Beckham"},
						{Name: "Chad Chapman"},
						{Name: "Irene Ira"}
					],
					totalNameLength: computed.array(function (a) {
						return a.reduce(function (length, entry) {
							return length + entry.Name.length;
						}, 0);
					}, "items"),
					totalNameLengthChanged: dfd.rejectOnError(function (length, oldLength) {
						if (created) {
							expect(length).to.equal(57);
							expect(oldLength).to.equal(45);
							dfd.resolve(1);
						}
					})
				}));
				var elem = register.createElement("liaison-test-computedarray");
				created = true;
				handles.push({
					remove: function () {
						elem.destroy();
					}
				});
				elem.items.push({Name: "John Jacklin"});
			});
			it("Attribute mapping with plain object", function () {
				var dfd = this.async(10000);
				register("liaison-test-attribute-object", [HTMLElement, Widget], {
					value: "",
					attribs: {
						"aria-value": "{{value}}"
					},
					attachPointsAttribs: {
						"valueNode": {
							"value": "{{value}}"
						}
					},
					buildRendering: function () {
						this.valueNode = this.ownerDocument.createElement("input");
						this.valueNode.setAttribute("type", "text");
						this.appendChild(this.valueNode);
					}
				});
				var elem = register.createElement("liaison-test-attribute-object");
				handles.push({
					remove: function () {
						elem.destroy();
					}
				});
				elem.set("value", "value0");
				waitFor(function () {
					return elem.getAttribute("aria-value") && elem.valueNode.value;
				}).then(function () {
					expect(elem.getAttribute("aria-value")).to.equal("value0");
					expect(elem.valueNode.value).to.equal("value0");
					elem.valueNode.value = "value1";
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					elem.valueNode.dispatchEvent(event);
				}).then(waitFor.bind(function () {
					return elem.getAttribute("aria-value") !== "value0" && elem.valueNode.value !== "value0";
				})).then(dfd.callback(function () {
					expect(elem.value).to.equal("value1");
					expect(elem.getAttribute("aria-value")).to.equal("value1");
				}), dfd.reject.bind(dfd));
			});
			it("Attribute mapping with function", function () {
				var dfd = this.async(10000);
				register("liaison-test-attribute-function", [HTMLElement, Widget], {
					value: "",
					attribs: function () {
						return {
							"aria-value": "{{value}}"
						};
					},
					attachPointsAttribs: function () {
						return {
							"valueNode": {
								"value": "{{value}}"
							}
						};
					},
					buildRendering: function () {
						this.valueNode = this.ownerDocument.createElement("input");
						this.valueNode.setAttribute("type", "text");
						this.appendChild(this.valueNode);
					}
				});
				var elem = register.createElement("liaison-test-attribute-function");
				handles.push({
					remove: function () {
						elem.destroy();
					}
				});
				elem.set("value", "value0");
				waitFor(function () {
					return elem.getAttribute("aria-value") && elem.valueNode.value;
				}).then(function () {
					expect(elem.getAttribute("aria-value")).to.equal("value0");
					expect(elem.valueNode.value).to.equal("value0");
					elem.valueNode.value = "value1";
					var event = document.createEvent("HTMLEvents");
					event.initEvent("input", false, true);
					elem.valueNode.dispatchEvent(event);
				}).then(waitFor.bind(function () {
					return elem.getAttribute("aria-value") !== "value0" && elem.valueNode.value !== "value0";
				})).then(dfd.callback(function () {
					expect(elem.value).to.equal("value1");
					expect(elem.getAttribute("aria-value")).to.equal("value1");
				}), dfd.reject.bind(dfd));
			});
			it("Dispatch values at initialization", function () {
				var gotValue;
				register("liaison-test-dispatch", [HTMLElement, Widget], {
					value: "foo",
					valueChanged: function (value) {
						gotValue = value;
					}
				});
				var elem = register.createElement("liaison-test-dispatch");
				handles.push({
					remove: function () {
						elem.destroy();
					}
				});
				expect(gotValue).to.equal("foo");
			});
			it("Prevent dispatching values at initialization", function () {
				var got;
				register("liaison-test-preventdispatch", [HTMLElement, Widget], {
					preventDispatchValuesAtInitialization: true,
					value: "foo",
					valueChanged: function () {
						got = true;
					}
				});
				var elem = register.createElement("liaison-test-preventdispatch");
				handles.push({
					remove: function () {
						elem.destroy();
					}
				});
				expect(got).not.to.be.true;
			});
		});
	}
});
