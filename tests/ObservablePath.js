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
			var handles = [];
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
				/* jshint nonew: false */
				var caught;
				try {
					handles.push(new ObservablePath(undefined, "foo").observe(function () {}));
					handles.push(new ObservablePath(null, "foo").observe(function () {}));
					handles.push(new ObservablePath(true, "foo").observe(function () {}));
					handles.push(new ObservablePath(1, "foo").observe(function () {}));
					handles.push(new ObservablePath("a", "foo").observe(function () {}));
				} catch (e) {
					caught = true;
				}
				expect(caught).not.to.be.true;
			});
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
			it("Setting value to ObservablePath with object having property with ObservablePath", function () {
				var binding,
					dfd = this.async(1000),
					o = {observable: new Observable({foo: "Foo0"})};
				handles.push(binding = new ObservablePath(o, "observable.foo"));
				binding.observe(dfd.callback(function (newValue, oldValue) {
					expect(newValue).to.equal("Foo1");
					expect(oldValue).to.equal("Foo0");
				}));
				binding.setTo("Foo1");
			});
			it("Exception in formatter/parser", function () {
				var binding,
					dfd = this.async(1000),
					observable = new Observable({foo: "Foo0"});
				handles.push(binding = new ObservablePath(observable, "foo", function () {
					throw new Error();
				}, function () {
					throw new Error();
				}));
				binding.observe(dfd.callback(function (newValue, oldValue) {
					expect(newValue).to.equal("Foo1");
					expect(oldValue).to.equal("Foo0");
				}));
				binding.setTo("Foo1");
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
