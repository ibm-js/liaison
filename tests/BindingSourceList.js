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
			var handles = [];
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
							expect(newValue).to.deep.equal(["Foo1", "Bar1", "Baz0"]);
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
			it("An observer changing a value that is observed. Such observer is defined before BindingSourceList.observe(). newValue should keep fresh value, oldValue should reflect change records in last run-loop", function () {
				var dfd = this.async(1000),
					count = 0,
					observable = new Observable({foo: "Foo0", bar: "Bar0", baz: "Baz0"}),
					path0 = new ObservablePath(observable, "foo"),
					path1 = new ObservablePath(observable, "bar"),
					path2 = new ObservablePath(observable, "baz"),
					source = new BindingSourceList([path0, path1, path2]),
					callbacks = [
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.deep.equal(["Foo1", "Bar1", "Baz0"]);
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
					throw new Error();
				}, function () {
					throw new Error();
				}));
				binding.observe(dfd.rejectOnError(function (newValue, oldValue) {
					callbacks[count++](newValue, oldValue);
				}));
				binding.setTo(["Foo1", "Bar1", "Baz1"]);
			});
			it("Cleaning up observe() handle", function () {
				var dfd = this.async(1000),
					observable = new Observable({foo: "Foo0", bar: "Bar0", baz: "Baz0"}),
					binding = new BindingSourceList([
						new ObservablePath(observable, "foo"),
						new ObservablePath(observable, "bar"),
						new ObservablePath(observable, "baz")
					]),
					h = binding.observe(dfd.rejectOnError(function () {
						expect(true).not.to.be.true;
					}));
				h.remove();
				expect(binding.handles && binding.handles.length > 0).not.to.be.true;
				observable.set("foo", "Foo1");
				setTimeout(dfd.callback(function () {}), 500);
			});
			it("Remove immediately after creation", function () {
				new BindingSourceList([]).remove();
			});
			// TODO(asudoh): Add test for observing BindingSourceList that has been removed already
		});
	}
});
