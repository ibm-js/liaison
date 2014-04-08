define([
	"intern!bdd",
	"intern/chai!expect",
	"../Observable",
	"../ObservablePath",
	"../BindingSourceList"
], function (bdd, expect, Observable, ObservablePath, BindingSourceList) {
	/* jshint withstmt: true */
	/* global describe, afterEach, it */
	with (bdd) {
		describe("Test liaison/BindingSourceList", function () {
			var handles = [],
				pseudoError = new Error("Error thrown on purpose. This error does not mean bad result of test case.");
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					handle.remove();
				}
			});
			it("Simple observation", function () {
				var dfd = this.async(1000),
					count = 0,
					observable = new Observable({foo: "Foo0", bar: "Bar0", baz: "Baz0"}),
					callbacks = [
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.deep.equal(["Foo1", "Bar1", "Baz1"]);
							expect(oldValue).to.deep.equal(["Foo0", "Bar0", "Baz0"]);
						}),
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.deep.equal(["Foo1", "Bar1", "Baz1"]);
							expect(oldValue).to.deep.equal(["Foo1", "Bar0", "Baz0"]);
						}),
						dfd.callback(function (newValue, oldValue) {
							expect(newValue).to.deep.equal(["Foo1", "Bar1", "Baz1"]);
							expect(oldValue).to.deep.equal(["Foo1", "Bar1", "Baz0"]);
						})
					];
				handles.push(new BindingSourceList([
					new ObservablePath(observable, "foo"),
					new ObservablePath(observable, "bar"),
					new ObservablePath(observable, "baz")
				]).observe(dfd.rejectOnError(function (newValue, oldValue) {
					callbacks[count++](newValue, oldValue);
				})));
				observable.set("foo", "Foo1");
				observable.set("bar", "Bar1");
				observable.set("baz", "Baz1");
			});
			it("Simple observabation with formatter", function () {
				var dfd = this.async(1000),
					count = 0,
					observable = new Observable({foo: "Foo0", bar: "Bar0", baz: "Baz0"}),
					callbacks = [
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.equal("Foo1,Bar1,Baz1");
							expect(oldValue).to.equal("Foo0,Bar0,Baz0");
						}),
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.equal("Foo1,Bar1,Baz1");
							expect(oldValue).to.equal("Foo1,Bar0,Baz0");
						}),
						dfd.callback(function (newValue, oldValue) {
							expect(newValue).to.equal("Foo1,Bar1,Baz1");
							expect(oldValue).to.equal("Foo1,Bar1,Baz0");
						})
					];
				handles.push(new BindingSourceList([
					new ObservablePath(observable, "foo"),
					new ObservablePath(observable, "bar"),
					new ObservablePath(observable, "baz")
				], function (values) {
					return values.join(",");
				}).observe(dfd.rejectOnError(function (newValue, oldValue) {
					callbacks[count++](newValue, oldValue);
				})));
				observable.set("foo", "Foo1");
				observable.set("bar", "Bar1");
				observable.set("baz", "Baz1");
			});
			it("Simple observabation with formatter and parser, setting value to binding", function () {
				var binding,
					dfd = this.async(1000),
					count = 0,
					observable = new Observable({foo: "Foo0", bar: "Bar0", baz: "Baz0"}),
					callbacks = [
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.equal("Foo1,Bar1,Baz1");
							expect(oldValue).to.equal("Foo0,Bar0,Baz0");
						}),
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.equal("Foo1,Bar1,Baz1");
							expect(oldValue).to.equal("Foo1,Bar0,Baz0");
						}),
						dfd.callback(function (newValue, oldValue) {
							expect(newValue).to.equal("Foo1,Bar1,Baz1");
							expect(oldValue).to.equal("Foo1,Bar1,Baz0");
						})
					];
				handles.push(binding = new BindingSourceList([
					new ObservablePath(observable, "foo"),
					new ObservablePath(observable, "bar"),
					new ObservablePath(observable, "baz")
				], function (values) {
					return values.join(",");
				}, function (values) {
					return values.split(",");
				}));
				binding.observe(dfd.rejectOnError(function (newValue, oldValue) {
					callbacks[count++](newValue, oldValue);
				}));
				binding.setTo("Foo1,Bar1,Baz1");
			});
			it("An observer changing a value that is observed. Such observer should be defined after BindingSourceList.observe()", function () {
				var dfd = this.async(1000),
					count = 0,
					observable = new Observable({foo: "Foo0", bar: "Bar0", baz: "Baz0"}),
					path0 = new ObservablePath(observable, "foo"),
					path1 = new ObservablePath(observable, "bar"),
					path2 = new ObservablePath(observable, "baz"),
					source = new BindingSourceList([path0, path1, path2]),
					callbacks = [
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.deep.equal(["Foo1", "Bar0", "Baz0"]);
							expect(oldValue).to.deep.equal(["Foo0", "Bar0", "Baz0"]);
						}),
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.deep.equal(["Foo1", "Bar1", "Baz1"]);
							expect(oldValue).to.deep.equal(["Foo1", "Bar0", "Baz0"]);
						}),
						dfd.callback(function (newValue, oldValue) {
							expect(newValue).to.deep.equal(["Foo1", "Bar1", "Baz1"]);
							expect(oldValue).to.deep.equal(["Foo1", "Bar1", "Baz0"]);
						})
					];
				handles.push(source.observe(dfd.rejectOnError(function (newValue, oldValue) {
					callbacks[count++](newValue, oldValue);
				})));
				path0.observe(dfd.rejectOnError(function () {
					observable.set("bar", "Bar1");
				}));
				path1.observe(dfd.rejectOnError(function () {
					observable.set("baz", "Baz1");
				}));
				observable.set("foo", "Foo1");
			});
			it("An observer changing a value that is observed."
				+ " Such observer is defined before BindingSourceList.observe()."
				+ " newValue should keep fresh value, oldValue should reflect change records in last run-loop", function () {
				var dfd = this.async(1000),
					count = 0,
					observable = new Observable({foo: "Foo0", bar: "Bar0", baz: "Baz0"}),
					path0 = new ObservablePath(observable, "foo"),
					path1 = new ObservablePath(observable, "bar"),
					path2 = new ObservablePath(observable, "baz"),
					source = new BindingSourceList([path0, path1, path2]),
					callbacks = [
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.deep.equal(["Foo1", "Bar1", "Baz1"]);
							expect(oldValue).to.deep.equal(["Foo0", "Bar0", "Baz0"]);
						}),
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.deep.equal(["Foo1", "Bar1", "Baz1"]);
							expect(oldValue).to.deep.equal(["Foo1", "Bar0", "Baz0"]);
						}),
						dfd.callback(function (newValue, oldValue) {
							expect(newValue).to.deep.equal(["Foo1", "Bar1", "Baz1"]);
							expect(oldValue).to.deep.equal(["Foo1", "Bar1", "Baz0"]);
						})
					];
				handles.push(path0.observe(dfd.rejectOnError(function () {
					observable.set("bar", "Bar1");
				})));
				handles.push(path1.observe(dfd.rejectOnError(function () {
					observable.set("baz", "Baz1");
				})));
				handles.push(source.observe(dfd.rejectOnError(function (newValue, oldValue) {
					callbacks[count++](newValue, oldValue);
				})));
				observable.set("foo", "Foo1");
			});
			it("Setting value to BindingSourceList", function () {
				var dfd = this.async(1000),
					count = 0,
					observablePath0 = new ObservablePath(new Observable({foo: "Foo0"}), "foo"),
					observablePath1 = new ObservablePath(new Observable({bar: "Bar0"}), "bar"),
					observablePath2 = new ObservablePath(new Observable({baz: "Baz0"}), "baz"),
					list = new BindingSourceList([observablePath0, observablePath1, observablePath2]),
					callbacks = [
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.deep.equal(["Foo1", "Bar1", "Baz1"]);
							expect(oldValue).to.deep.equal(["Foo0", "Bar0", "Baz0"]);
						}),
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.deep.equal(["Foo1", "Bar1", "Baz1"]);
							expect(oldValue).to.deep.equal(["Foo1", "Bar0", "Baz0"]);
						}),
						dfd.callback(function (newValue, oldValue) {
							expect(newValue).to.deep.equal(["Foo1", "Bar1", "Baz1"]);
							expect(oldValue).to.deep.equal(["Foo1", "Bar1", "Baz0"]);
						})
					];
				handles.push(observablePath0, observablePath1, observablePath2, list);
				var h = list.observe(dfd.rejectOnError(function (newValue, oldValue) {
					callbacks[count++](newValue, oldValue);
				}));
				h.setValue(["Foo1", "Bar1", "Baz1"]);
			});
			it("Exception in formatter/parser", function () {
				var binding,
					dfd = this.async(1000),
					count = 0,
					observable = new Observable({foo: "Foo0", bar: "Bar0", baz: "Baz0"}),
					callbacks = [
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.deep.equal(["Foo1", "Bar1", "Baz1"]);
							expect(oldValue).to.deep.equal(["Foo0", "Bar0", "Baz0"]);
						}),
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.deep.equal(["Foo1", "Bar1", "Baz1"]);
							expect(oldValue).to.deep.equal(["Foo1", "Bar0", "Baz0"]);
						}),
						dfd.callback(function (newValue, oldValue) {
							expect(newValue).to.deep.equal(["Foo1", "Bar1", "Baz1"]);
							expect(oldValue).to.deep.equal(["Foo1", "Bar1", "Baz0"]);
						})
					];
				handles.push(binding = new BindingSourceList([
					new ObservablePath(observable, "foo"),
					new ObservablePath(observable, "bar"),
					new ObservablePath(observable, "baz")
				], function () {
					throw pseudoError;
				}, function () {
					throw pseudoError;
				}));
				binding.observe(dfd.rejectOnError(function (newValue, oldValue) {
					callbacks[count++](newValue, oldValue);
				}));
				binding.setTo(["Foo1", "Bar1", "Baz1"]);
			});
			it("Synchronous change delivery", function () {
				var h0, h1, list, deliveredBoth, finishedMicrotask,
					dfd = this.async(1000),
					count = 0,
					observable = new Observable({foo: "Foo0", bar: "Bar0"}),
					callbacks = [
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(finishedMicrotask).not.to.be.true;
							expect(newValue).to.deep.equal(["Foo1", "Bar0"]);
							expect(oldValue).to.deep.equal(["Foo0", "Bar0"]);
						}),
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(finishedMicrotask).not.to.be.true;
							expect(newValue).to.deep.equal(["Foo1", "Bar1"]);
							expect(oldValue).to.deep.equal(["Foo1", "Bar0"]);
							deliveredBoth = true;
						})
					];
				handles.push(list = new BindingSourceList([new ObservablePath(observable, "foo"), new ObservablePath(observable, "bar")]));
				h0 = list.observe(dfd.callback(function (newValue, oldValue) {
					expect(deliveredBoth).to.be.true;
					expect(finishedMicrotask).to.be.true;
					expect(newValue).to.deep.equal(["Foo1", "Bar1"]);
					expect(oldValue).to.deep.equal(["Foo0", "Bar0"]);
				}));
				h1 = list.observe(dfd.rejectOnError(function (newValue, oldValue) {
					callbacks[count++](newValue, oldValue);
				}));
				observable.set("foo", "Foo1");
				h1.deliver();
				observable.set("bar", "Bar1");
				h1.deliver();
				finishedMicrotask = true;
			});
			it("Discarding change", function () {
				var h0, h1, list, finishedMicrotask,
					dfd = this.async(1000),
					observable = new Observable({foo: "Foo0"});
				handles.push(list = new BindingSourceList([new ObservablePath(observable, "foo")]));
				h0 = list.observe(dfd.callback(function (newValue, oldValue) {
					expect(finishedMicrotask).to.be.true;
					expect(newValue).to.deep.equal(["Foo1"]);
					expect(oldValue).to.deep.equal(["Foo0"]);
				}));
				h1 = list.observe(dfd.rejectOnError(function () {
					throw new Error("Observer callback should never be called for changes being discarded.");
				}));
				observable.set("foo", "Foo1");
				expect(h1.discardChanges()).to.deep.equal(["Foo1"]);
				finishedMicrotask = true;
			});
			it("Round-trip of formatter/parser", function () {
				var formatter = function () {},
					parser = function () {},
					list = new BindingSourceList([new ObservablePath({}, "foo")], formatter, parser);
				expect(list.formatter).to.equal(formatter);
				expect(list.parser).to.equal(parser);
			});
			it("Cleaning up observe() handle", function () {
				var list,
					dfd = this.async(1000),
					observable = new Observable({foo: "Foo0", bar: "Bar0", baz: "Baz0"});
				handles.push(list = new BindingSourceList([
					new ObservablePath(observable, "foo"),
					new ObservablePath(observable, "bar"),
					new ObservablePath(observable, "baz")
				]));
				var h = list.observe(dfd.rejectOnError(function () {
					throw new Error("Observer callback should never be called after removal.");
				}));
				h.remove();
				expect(list.observers && list.observers.length > 0).not.to.be.true;
				observable.set("foo", "Foo1");
				h.deliver();
				observable.set("foo", "Foo2");
				setTimeout(dfd.callback(function () {}), 100);
			});
			it("Remove immediately after creation", function () {
				new BindingSourceList([]).remove();
			});
			// TODO(asudoh): Add test for observing BindingSourceList that has been removed already
		});
	}
});
