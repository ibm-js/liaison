define([
	"intern!bdd",
	"intern/chai!expect",
	"dojo/Deferred",
	"../Observable",
	"../ObservablePath",
	"./waitFor"
], function (bdd, expect, Deferred, Observable, ObservablePath, waitFor) {
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
					observable = new Observable({foo: "Foo0"}),
					observablePath = new ObservablePath(observable, "foo");
				observablePath.observe(function () {}).remove();
				waitFor(function () {
					try {
						var count = 0,
							dfdObserve = new Deferred(),
							callback = dfd.rejectOnError(function () {
								if (count++ > 0) {
									throw new Error("This callback should no longer be used.");
								}
								dfdObserve.resolve([].slice.call(arguments));
							});
						handles.push(observablePath.observe(callback));
						// Make sure the callback is called only once per change even if we register a callback twice
						handles.push(observablePath.observe(callback));
						observable.set("foo", "Foo1");
						return dfdObserve;
					} catch (e) {
						dfd.reject(e);
					}
				}).then(function (data) {
					expect(data[0]).to.equal("Foo1");
					expect(data[1]).to.equal("Foo0");
				}).then(function () {
					var dfdObserve = new Deferred();
					observablePath.open(function () {
						dfdObserve.resolve([].slice.call(arguments));
					});
					handles.push(observablePath);
					observable.set("foo", "Foo2");
					return dfdObserve;
				}).then(function (data) {
					expect(data[0]).to.equal("Foo2");
					expect(data[1]).to.equal("Foo1");
				}).then(dfd.resolve.bind(dfd), dfd.reject.bind(dfd));
			});
			it("Same value check", function () {
				var dfd = this.async(1000),
					observable = new Observable({foo: new Observable({bar: +0, baz: NaN})}),
					observablePath0 = new ObservablePath(observable, "foo.bar"),
					observablePath1 = new ObservablePath(observable, "foo.baz");
				handles.push(observablePath0.observe(dfd.rejectOnError(function (newValue, oldValue) {
					expect(newValue).to.equal(-0);
					expect(oldValue).to.equal(+0);
					setTimeout(dfd.resolve.bind(dfd, 1), 100);
				})));
				handles.push(observablePath1.observe(dfd.reject.bind(dfd, new Error("NaN should be treat as equal to NaN."))));
				observable.set("foo", new Observable({bar: -0, baz: NaN}));
			});
			it("Various types of path", function () {
				var dfd = this.async(1000),
					observable = new Observable({
						foo: new Observable({
							bar: new Observable({"baz": "Baz0"})
						})
					}),
					observablePath0 = new ObservablePath(observable),
					observablePath1 = new ObservablePath(observable, null),
					observablePath2 = new ObservablePath(observable, ["foo", "bar", "baz"]);
				expect(observablePath0.discardChanges()).to.equal(observable);
				expect(observablePath1.discardChanges()).to.equal(observable);
				expect(observablePath2.discardChanges()).to.equal("Baz0");
				handles.push(observablePath2.observe(dfd.callback(function (newValue, oldValue) {
					expect(newValue).to.equal("Baz1");
					expect(oldValue).to.equal("Baz0");
				})));
				observable.set("foo", new Observable({
					bar: new Observable({"baz": "Baz1"})
				}));
			});
			it("Observing non-object", function () {
				var observablePath,
					dfd = this.async(1000);
				observablePath = new ObservablePath(undefined);
				handles.push(observablePath);
				expect(observablePath.discardChanges()).to.equal(undefined);
				expect(observablePath.open(dfd.rejectOnError(function () {
					throw new Error("Change in non-observable shouldn't be observed.");
				}))).to.equal(undefined);
				observablePath.setTo("foo");
				observablePath = new ObservablePath(undefined, "foo.bar");
				handles.push(observablePath);
				expect(observablePath.discardChanges()).to.equal(undefined);
				expect(observablePath.open(dfd.rejectOnError(function () {
					throw new Error("Change in non-observable shouldn't be observed.");
				}))).to.equal(undefined);
				observablePath.setTo("foo");
				observablePath = new ObservablePath(null);
				handles.push(observablePath);
				expect(observablePath.discardChanges()).to.equal(null);
				expect(observablePath.open(dfd.rejectOnError(function () {
					throw new Error("Change in non-observable shouldn't be observed.");
				}))).to.equal(null);
				observablePath.setTo("foo");
				observablePath = new ObservablePath(null, "foo.bar");
				handles.push(observablePath);
				expect(observablePath.discardChanges()).to.equal(undefined);
				expect(observablePath.open(dfd.rejectOnError(function () {
					throw new Error("Change in non-observable shouldn't be observed.");
				}))).to.equal(undefined);
				observablePath.setTo("foo");
				observablePath = new ObservablePath(true);
				handles.push(observablePath);
				expect(observablePath.discardChanges()).to.equal(true);
				expect(observablePath.open(dfd.rejectOnError(function () {
					throw new Error("Change in non-observable shouldn't be observed.");
				}))).to.equal(true);
				observablePath.setTo("foo");
				observablePath = new ObservablePath(true, "valueOf");
				handles.push(observablePath);
				expect(observablePath.discardChanges()).to.equal(Boolean.prototype.valueOf);
				expect(observablePath.open(dfd.rejectOnError(function () {
					throw new Error("Change in non-observable shouldn't be observed.");
				}))).to.equal(Boolean.prototype.valueOf);
				observablePath.setTo("foo");
				observablePath = new ObservablePath(1);
				handles.push(observablePath);
				expect(observablePath.discardChanges()).to.equal(1);
				expect(observablePath.open(dfd.rejectOnError(function () {
					throw new Error("Change in non-observable shouldn't be observed.");
				}))).to.equal(1);
				observablePath.setTo("foo");
				observablePath = new ObservablePath(1, "valueOf");
				handles.push(observablePath);
				expect(observablePath.discardChanges()).to.equal(Number.prototype.valueOf);
				expect(observablePath.open(dfd.rejectOnError(function () {
					throw new Error("Change in non-observable shouldn't be observed.");
				}))).to.equal(Number.prototype.valueOf);
				observablePath.setTo("foo");
				observablePath = new ObservablePath("foo");
				handles.push(observablePath);
				expect(observablePath.discardChanges()).to.equal("foo");
				expect(observablePath.open(dfd.rejectOnError(function () {
					throw new Error("Change in non-observable shouldn't be observed.");
				}))).to.equal("foo");
				observablePath.setTo("foo");
				observablePath = new ObservablePath("foo", "length");
				handles.push(observablePath);
				expect(observablePath.discardChanges()).to.equal(3);
				expect(observablePath.open(dfd.rejectOnError(function () {
					throw new Error("Change in string length shouldn't be observed.");
				}))).to.equal(3);
				observablePath.setTo("foo");
				dfd.resolve(1);
			});
			it("Observing primitive object's property", function () {
				var dfd = this.async(1000),
					observableWithNumber = new Observable({foo: 1}),
					observableWithString = new Observable({foo: "Foo0"}),
					observablePathWithNumber = new ObservablePath(observableWithNumber, "foo.valueOf"),
					observablePathWithString = new ObservablePath(observableWithString, "foo.length");
				expect(observablePathWithNumber.getFrom()).to.equal(Number.prototype.valueOf);
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
					o = {foo: {bar: {baz: "Baz0"}}},
					observable = new Observable(o.foo.bar),
					observableShallow = new Observable(o),
					observableDeep = new Observable({foo: new Observable({bar: new Observable(o.foo.bar)})}),
					observablePath = new ObservablePath(observable, "baz"),
					observablePathShallow = new ObservablePath(observableShallow, "foo.bar.baz"),
					observablePathInner = new ObservablePath({foo: new Observable({bar: new Observable(o.foo.bar)})}, "foo.bar.baz"),
					observablePathDeep = new ObservablePath(observableDeep, "foo.bar.baz"),
					observablePathPlain1 = new ObservablePath(o.foo.bar, "baz"),
					observablePathPlain2 = new ObservablePath(o, "foo.bar.baz"),
					count = 0;
				observablePath.observe(dfd.rejectOnError(function (newValue, oldValue) {
					expect(newValue).to.equal("Baz1");
					expect(oldValue).to.equal("Baz0");
					count++;
				})),
				observablePathShallow.observe(dfd.rejectOnError(function (newValue, oldValue) {
					if (Observable.useNative) {
						expect(newValue).to.equal("Baz1");
						expect(oldValue).to.equal("Baz0");
						count++;
					} else {
						throw new Error("ObservablePath should't respond to setValue() with shallow Observable tree.");
					}
				})),
				observablePathInner.observe(dfd.rejectOnError(function (newValue, oldValue) {
					expect(newValue).to.equal("Baz1");
					expect(oldValue).to.equal("Baz0");
					count++;
				})),
				observablePathDeep.observe(dfd.rejectOnError(function (newValue, oldValue) {
					expect(newValue).to.equal("Baz1");
					expect(oldValue).to.equal("Baz0");
					count++;
				})),
				observablePathPlain1.observe(dfd.rejectOnError(function (newValue, oldValue) {
					if (Observable.useNative) {
						expect(newValue).to.equal("Baz1");
						expect(oldValue).to.equal("Baz0");
						count++;
					} else {
						throw new Error("ObservablePath should't respond to setValue() with plain object.");
					}
				})),
				observablePathPlain2.observe(dfd.rejectOnError(function (newValue, oldValue) {
					if (Observable.useNative) {
						expect(newValue).to.equal("Baz1");
						expect(oldValue).to.equal("Baz0");
						count++;
					} else {
						throw new Error("ObservablePath should't respond to setValue() with plain object.");
					}
				}));
				handles.push(observablePath, observablePathShallow, observablePathInner, observablePathDeep);
				handles.push(observablePathPlain1, observablePathPlain2);
				observablePath.setValue("Baz1");
				observablePathShallow.setValue("Baz1");
				observablePathInner.setValue("Baz1");
				observablePathDeep.setValue("Baz1");
				observablePathPlain1.setValue("Baz1");
				observablePathPlain2.setValue("Baz1");
				waitFor(function () {
					return Observable.useNative ? 6 : 3;
				}).then(dfd.resolve.bind(dfd), dfd.reject.bind(dfd));
			});
			it("Synchronous change delivery", function () {
				var observablePath, finishedMicrotask,
					dfd = this.async(1000),
					count = 0,
					observable = new Observable({foo: "Foo0"}),
					callbacks = [
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(finishedMicrotask).not.to.be.true;
							expect(newValue).to.equal("Foo1");
							expect(oldValue).to.equal("Foo0");
						}),
						dfd.callback(function (newValue, oldValue) {
							expect(finishedMicrotask).not.to.be.true;
							expect(newValue).to.equal("Foo2");
							expect(oldValue).to.equal("Foo1");
						})
					];
				handles.push(observablePath = new ObservablePath(observable, "foo"));
				observablePath.observe(dfd.rejectOnError(function (newValue, oldValue) {
					callbacks[count++](newValue, oldValue);
				}));
				observable.set("foo", "Foo1");
				observablePath.deliver();
				observable.set("foo", "Foo2");
				observablePath.deliver();
				finishedMicrotask = true;
			});
			it("Synchronous change delivery, change in top-level property", function () {
				var binding, h1Delivered, finishedMicrotask,
					dfd = this.async(1000),
					observable = new Observable({foo: new Observable({bar: "Bar0"})});
				handles.push(binding = new ObservablePath(observable, "foo.bar"));
				binding.observe(dfd.callback(function (newValue, oldValue) {
					expect(finishedMicrotask).not.to.be.true;
					expect(newValue).to.equal("Bar1");
					expect(oldValue).to.equal("Bar0");
					h1Delivered = true;
				}));
				observable.set("foo", new Observable({"bar": "Bar1"}));
				binding.deliver();
				finishedMicrotask = true;
			});
			it("Synchronous change delivery, change in sub-property", function () {
				var binding, h1Delivered, finishedMicrotask,
					dfd = this.async(1000),
					observable = new Observable({foo: new Observable({bar: "Bar0"})});
				handles.push(binding = new ObservablePath(observable, "foo.bar"));
				binding.observe(dfd.callback(function (newValue, oldValue) {
					expect(finishedMicrotask).not.to.be.true;
					expect(newValue).to.equal("Bar1");
					expect(oldValue).to.equal("Bar0");
					h1Delivered = true;
				}));
				observable.foo.set("bar", "Bar1");
				binding.deliver();
				finishedMicrotask = true;
			});
			it("Discarding change", function () {
				var observablePath, finishedMicrotask,
					dfd = this.async(1000),
					observable = new Observable({foo: "Foo0"});
				handles.push(observablePath = new ObservablePath(observable, "foo"));
				observablePath.observe(dfd.rejectOnError(function () {
					throw new Error("Observer callback should never be called for changes being discarded.");
				}));
				observable.set("foo", "Foo1");
				expect(observablePath.discardChanges()).to.equal("Foo1");
				finishedMicrotask = true;
				dfd.resolve(1);
			});
			it("Discarding change, change in top-level property", function () {
				var binding,
					dfd = this.async(1000),
					observable = new Observable({foo: new Observable({bar: "Bar0"})});
				handles.push(binding = new ObservablePath(observable, "foo.bar"));
				binding.observe(dfd.rejectOnError(function () {
					throw new Error("Change callback is called even though the change has been discarded.");
				}));
				observable.set("foo", new Observable({"bar": "Bar1"}));
				expect(binding.discardChanges()).to.equal("Bar1");
				dfd.resolve(1);
			});
			it("Discarding change, change in sub-property", function () {
				var binding,
					dfd = this.async(1000),
					observable = new Observable({foo: new Observable({bar: "Bar0"})});
				handles.push(binding = new ObservablePath(observable, "foo.bar"));
				binding.observe(dfd.rejectOnError(function () {
					throw new Error("Change callback is called even though the change has been discarded.");
				}));
				observable.foo.set("bar", "Bar1");
				expect(binding.discardChanges()).to.equal("Bar1");
				dfd.resolve(1);
			});
			it("Discarding change with formatter", function () {
				var observablePath, finishedMicrotask,
					dfd = this.async(1000),
					observable = new Observable({foo: "Foo0"});
				handles.push(observablePath = new ObservablePath(observable, "foo", function (value) {
					return "*" + value + "*";
				}));
				observablePath.observe(dfd.rejectOnError(function () {
					throw new Error("Observer callback should never be called for changes being discarded.");
				}));
				observable.set("foo", "Foo1");
				expect(observablePath.discardChanges()).to.equal("*Foo1*");
				finishedMicrotask = true;
				dfd.resolve(1);
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
				observable.set("foo", "Foo1");
				observablePath.deliver();
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
