define([
	"intern!bdd",
	"intern/chai!expect",
	"../Observable",
	"../ObservablePath"
], function (bdd, expect, Observable, ObservablePath) {
	/* jshint withstmt: true */
	/* global describe, afterEach, it */
	with (bdd) {
		describe("Test liaison/ObservablePath", function () {
			var handles = [],
				pseudoError = new Error("Error thrown on purpose. This error does not mean bad result of test case.");
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					handle.remove();
				}
			});
			it("Simple observation", function () {
				var dfd = this.async(1000),
					observable = new Observable({foo: "Foo0"});
				handles.push(new ObservablePath(observable, "foo").observe(dfd.callback(function (newValue, oldValue) {
					expect(newValue).to.equal("Foo1");
					expect(oldValue).to.equal("Foo0");
				})));
				observable.set("foo", "Foo1");
			});
			it("Observing non-object", function () {
				// Check if below line will ends up with an exception
				handles.push(new ObservablePath(undefined, "foo.bar").observe(function () {}));
				handles.push(new ObservablePath(null, "foo.bar").observe(function () {}));
				handles.push(new ObservablePath(true, "foo.bar").observe(function () {}));
				handles.push(new ObservablePath(1, "foo.bar").observe(function () {}));
				handles.push(new ObservablePath("a", "foo.bar").observe(function () {}));
			});
			// TODO(asudoh): Test wrong path
			it("Observing primitive object's property", function () {
				var dfd = this.async(1000),
					observableWithNumber = new Observable({foo: 1}),
					observableWithString = new Observable({foo: "Foo0"}),
					observablePathWithNumber = new ObservablePath(observableWithNumber, "foo.toExponential"),
					observablePathWithString = new ObservablePath(observableWithString, "foo.length");
				expect(observablePathWithNumber.getFrom()).to.equal(Number.prototype.toExponential);
				expect(observablePathWithString.getFrom()).to.equal(4);
				handles.push(observablePathWithString.observe(dfd.callback(function (newValue, oldValue) {
					expect(oldValue).to.equal(4);
					expect(newValue).to.equal(8);
				})));
				observableWithString.set("foo", "Foo0Foo1");
			});
			it("Simple observabation with formatter", function () {
				var dfd = this.async(1000),
					observable = new Observable({foo: "Foo0"});
				handles.push(new ObservablePath(observable, "foo", function (value) {
					return "*" + value;
				}).observe(dfd.callback(function (newValue, oldValue) {
					expect(newValue).to.equal("*Foo1");
					expect(oldValue).to.equal("*Foo0");
				})));
				observable.set("foo", "Foo1");
			});
			it("Simple observabation with formatter and parser, setting value to binding", function () {
				var binding,
					dfd = this.async(1000),
					observable = new Observable({foo: "Foo0"});
				handles.push(binding = new ObservablePath(observable, "foo", function (value) {
					return "*" + value;
				}, function (value) {
					return value.substr(1);
				}));
				binding.observe(dfd.callback(function (newValue, oldValue) {
					expect(newValue).to.equal("*Foo1");
					expect(oldValue).to.equal("*Foo0");
				}));
				binding.setTo("*Foo1");
			});
			it("Observing observable having property with object: Simple update", function () {
				var dfd = this.async(1000),
					observable = new Observable({plain: {foo: "Foo0"}}),
					source = new ObservablePath(observable, "plain.foo");
				handles.push(source.observe(dfd.callback(function (newValue, oldValue) {
					expect(newValue).to.equal("Foo1");
					expect(oldValue).to.equal("Foo0");
				})));
				observable.set("plain", {foo: "Foo1"});
			});
			it("Observing observable having property with object: Emptying the object", function () {
				var dfd = this.async(1000),
					observable = new Observable({plain: {foo: "Foo0"}}),
					source = new ObservablePath(observable, "plain.foo");
				handles.push(source.observe(dfd.callback(function (newValue, oldValue) {
					expect(newValue).to.equal(undefined);
					expect(oldValue).to.equal("Foo0");
				})));
				observable.set("plain", undefined);
			});
			it("Setting value to ObservablePath", function () {
				var dfd = this.async(1000),
					o = {foo: {bar: "Bar0"}},
					observable = new Observable(o.foo),
					observableShallow = new Observable(o),
					observableDeep = new Observable({foo: new Observable(o.foo)}),
					observablePath = new ObservablePath(observable, "bar"),
					observablePathShallow = new ObservablePath(observableShallow, "foo.bar"),
					observablePathInner = new ObservablePath({foo: new Observable(o.foo)}, "foo.bar"),
					observablePathDeep = new ObservablePath(observableDeep, "foo.bar"),
					observablePathPlain1 = new ObservablePath(o.foo, "bar"),
					observablePathPlain2 = new ObservablePath(o, "foo.bar"),
					count = 0,
					h = observablePath.observe(dfd.rejectOnError(function (newValue, oldValue) {
						expect(newValue).to.equal("Bar1");
						expect(oldValue).to.equal("Bar0");
						count++;
					})),
					hShallow = observablePathShallow.observe(dfd.rejectOnError(function () {
						throw new Error("ObservablePath should't respond to setValue() with shallow Observable tree.");
					})),
					hInner = observablePathInner.observe(dfd.rejectOnError(function (newValue, oldValue) {
						expect(newValue).to.equal("Bar1");
						expect(oldValue).to.equal("Bar0");
						count++;
					})),
					hDeep = observablePathDeep.observe(dfd.rejectOnError(function (newValue, oldValue) {
						expect(newValue).to.equal("Bar1");
						expect(oldValue).to.equal("Bar0");
						count++;
					})),
					hPlain1 = observablePathPlain1.observe(dfd.rejectOnError(function () {
						throw new Error("ObservablePath should't respond to setValue() with plain object.");
					})),
					hPlain2 = observablePathPlain2.observe(dfd.rejectOnError(function () {
						throw new Error("ObservablePath should't respond to setValue() with plain object.");
					}));
				handles.push(observablePath, observablePathShallow, observablePathInner, observablePathDeep);
				handles.push(observablePathPlain1, observablePathPlain2);
				h.setValue("Bar1");
				hShallow.setValue("Bar1");
				hInner.setValue("Bar1");
				hDeep.setValue("Bar1");
				hPlain1.setValue("Bar1");
				hPlain2.setValue("Bar1");
				setTimeout(dfd.callback(function () {
					expect(count).to.equal(3);
				}), 100);
			});
			it("Synchronous change delivery, change in top-level property", function () {
				var h0, h1, binding, h1Delivered, finishedMicrotask,
					dfd = this.async(1000),
					observable = new Observable({foo: new Observable({bar: "Bar0"})});
				handles.push(binding = new ObservablePath(observable, "foo.bar"));
				h0 = binding.observe(dfd.callback(function (newValue, oldValue) {
					expect(h1Delivered).to.be.true;
					expect(finishedMicrotask).to.be.true;
					expect(newValue).to.equal("Bar1");
					expect(oldValue).to.equal("Bar0");
				}));
				h1 = binding.observe(dfd.rejectOnError(function (newValue, oldValue) {
					expect(finishedMicrotask).not.to.be.true;
					expect(newValue).to.equal("Bar1");
					expect(oldValue).to.equal("Bar0");
					h1Delivered = true;
				}));
				observable.set("foo", new Observable({"bar": "Bar1"}));
				h1.deliver();
				finishedMicrotask = true;
			});
			it("Synchronous change delivery, change in sub-property", function () {
				var h0, h1, binding, h1Delivered, finishedMicrotask,
					dfd = this.async(1000),
					observable = new Observable({foo: new Observable({bar: "Bar0"})});
				handles.push(binding = new ObservablePath(observable, "foo.bar"));
				h0 = binding.observe(dfd.callback(function (newValue, oldValue) {
					expect(h1Delivered).to.be.true;
					expect(finishedMicrotask).to.be.true;
					expect(newValue).to.equal("Bar1");
					expect(oldValue).to.equal("Bar0");
				}));
				h1 = binding.observe(dfd.rejectOnError(function (newValue, oldValue) {
					expect(finishedMicrotask).not.to.be.true;
					expect(newValue).to.equal("Bar1");
					expect(oldValue).to.equal("Bar0");
					h1Delivered = true;
				}));
				observable.foo.set("bar", "Bar1");
				h1.deliver();
				finishedMicrotask = true;
			});
			it("Discarding change, change in top-level property", function () {
				var h0, h1, binding,
					dfd = this.async(1000),
					observable = new Observable({foo: new Observable({bar: "Bar0"})});
				handles.push(binding = new ObservablePath(observable, "foo.bar"));
				h0 = binding.observe(dfd.callback(function (newValue, oldValue) {
					expect(newValue).to.equal("Bar1");
					expect(oldValue).to.equal("Bar0");
				}));
				h1 = binding.observe(dfd.rejectOnError(function () {
					throw new Error("Change callback is called even though the change has been discarded.");
				}));
				observable.set("foo", new Observable({"bar": "Bar1"}));
				h1.discardChanges();
			});
			it("Discarding change, change in sub-property", function () {
				var h0, h1, binding,
					dfd = this.async(1000),
					observable = new Observable({foo: new Observable({bar: "Bar0"})});
				handles.push(binding = new ObservablePath(observable, "foo.bar"));
				h0 = binding.observe(dfd.callback(function (newValue, oldValue) {
					expect(newValue).to.equal("Bar1");
					expect(oldValue).to.equal("Bar0");
				}));
				h1 = binding.observe(dfd.rejectOnError(function () {
					throw new Error("Change callback is called even though the change has been discarded.");
				}));
				observable.foo.set("bar", "Bar1");
				h1.discardChanges();
			});
			it("Exception in observer callback", function () {
				var dfd = this.async(1000),
					count = 0,
					observable = new Observable({foo: new Observable({bar: "Bar0"})}),
					callbacks = [
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.equal("Bar1");
							expect(oldValue).to.equal("Bar0");
							observable.set("foo", new Observable({bar: "Bar2"}));
						}),
						dfd.callback(function (newValue, oldValue) {
							expect(newValue).to.equal("Bar2");
							expect(oldValue).to.equal("Bar1");
						})
					];
				handles.push(new ObservablePath(observable, "foo.bar").observe(function (newValue, oldValue) {
					try {
						callbacks[count](newValue, oldValue);
					} catch (e) {
						dfd.reject(e);
					}
					if (count++ === 0) {
						throw pseudoError;
					}
				}));
				observable.foo.set("bar", "Bar1");
			});
			it("Exception in formatter/parser", function () {
				var binding,
					dfd = this.async(1000),
					observable = new Observable({foo: "Foo0"});
				handles.push(binding = new ObservablePath(observable, "foo", function () {
					throw pseudoError;
				}, function () {
					throw pseudoError;
				}));
				binding.observe(dfd.callback(function (newValue, oldValue) {
					expect(newValue).to.equal("Foo1");
					expect(oldValue).to.equal("Foo0");
				}));
				binding.setTo("Foo1");
			});
			it("Synchronous change delivery", function () {
				var h0, h1, observablePath, deliveredBoth, finishedMicrotask,
					dfd = this.async(1000),
					count = 0,
					observable = new Observable({foo: "Foo0"}),
					callbacks = [
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(finishedMicrotask).not.to.be.true;
							expect(newValue).to.equal("Foo1");
							expect(oldValue).to.equal("Foo0");
						}),
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(finishedMicrotask).not.to.be.true;
							expect(newValue).to.equal("Foo2");
							expect(oldValue).to.equal("Foo1");
							deliveredBoth = true;
						})
					];
				handles.push(observablePath = new ObservablePath(observable, "foo"));
				h0 = observablePath.observe(dfd.callback(function (newValue, oldValue) {
					expect(deliveredBoth).to.be.true;
					expect(finishedMicrotask).to.be.true;
					expect(newValue).to.equal("Foo2");
					expect(oldValue).to.equal("Foo0");
				}));
				h1 = observablePath.observe(dfd.rejectOnError(function (newValue, oldValue) {
					callbacks[count++](newValue, oldValue);
				}));
				observable.set("foo", "Foo1");
				h1.deliver();
				observable.set("foo", "Foo2");
				h1.deliver();
				finishedMicrotask = true;
			});
			it("Discarding change", function () {
				var h0, h1, observablePath, finishedMicrotask,
					dfd = this.async(1000),
					observable = new Observable({foo: "Foo0"});
				handles.push(observablePath = new ObservablePath(observable, "foo"));
				h0 = observablePath.observe(dfd.callback(function (newValue, oldValue) {
					expect(finishedMicrotask).to.be.true;
					expect(newValue).to.equal("Foo1");
					expect(oldValue).to.equal("Foo0");
				}));
				h1 = observablePath.observe(dfd.rejectOnError(function () {
					throw new Error("Observer callback should never be called for changes being discarded.");
				}));
				observable.set("foo", "Foo1");
				h1.discardChanges();
				finishedMicrotask = true;
			});
			it("Round-trip of formatter/parser", function () {
				var formatter = function () {},
					parser = function () {},
					observablePath = new ObservablePath({}, "foo", formatter, parser);
				expect(observablePath.formatter).to.equal(formatter);
				expect(observablePath.parser).to.equal(parser);
			});
			it("Cleaning up observe() handle", function () {
				var observablePath,
					dfd = this.async(1000),
					observable = new Observable({foo: "Foo0"});
				handles.push(observablePath = new ObservablePath(observable, "foo"));
				var h = observablePath.observe(dfd.rejectOnError(function () {
					throw new Error("Observer callback should never be called after removal.");
				}));
				h.remove();
				expect(observablePath.observers && observablePath.observers.length > 0).not.to.be.true;
				observable.set("foo", "Foo1");
				h.deliver();
				observable.set("foo", "Foo2");
				setTimeout(dfd.callback(function () {}), 100);
			});
			it("Empty property", function () {
				var observable = new Observable({foo: "Foo"}),
					source = new ObservablePath(observable, "");
				expect(source.getFrom().foo).to.equal("Foo");
				source.setTo("Bar");
				expect(observable).to.deep.equal({foo: "Foo"}); // Make sure observable is intact
			});
		});
	}
});
