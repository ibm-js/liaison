define([
	"intern!bdd",
	"intern/chai!expect",
	"../Observable"
], function (bdd, expect, Observable) {
	/* jshint withstmt: true */
	/* global describe, afterEach, it */
	with (bdd) {
		// TODO(asudoh): Look more at Object.observe() spec and add more tests
		describe("Test liaison/Observable", function () {
			var handles = [],
				pseudoError = new Error("Error thrown on purpose. This error does not mean bad result of test case.");
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					handle.remove();
				}
			});
			it("Enumerate observable instance", function () {
				/* jshint unused: false */
				var found = false,
					observable = new Observable();
				for (var s in observable) {
					found = true;
				}
				expect(found).to.equal(false);
			});
			it("Observing null", function () {
				var caught;
				try {
					Observable.observe(null, function () {});
				} catch (e) {
					caught = true;
				}
				expect(caught).to.be.true;
				expect(Observable.canObserve(null)).not.to.be.true;
			});
			it("Work with a single observable", function () {
				var dfd = this.async(1000),
					observable = new Observable();
				handles.push(Observable.observe(observable, dfd.callback(function (records) {
					expect(records).to.deep.equal([
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable,
							name: "foo"
						},
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable,
							name: "bar"
						},
						{
							type: Observable.CHANGETYPE_UPDATE,
							object: observable,
							name: "foo",
							oldValue: "Foo0"
						}
					]);
				})));
				observable.set("foo", "Foo0");
				observable.set("bar", "Bar");
				observable.set("foo", "Foo1");
			});
			it("Work with multiple observables, Observable.observe() callback defined earlier should be called earlier", function () {
				var dfd = this.async(1000),
					observable0 = new Observable(),
					observable1 = new Observable();
				handles.push(Observable.observe(observable1, dfd.rejectOnError(function (records) {
					expect(records).to.deep.equal([
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable1,
							name: "foo"
						},
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable1,
							name: "bar"
						}
					]);
				})));
				handles.push(Observable.observe(observable0, dfd.callback(function (records) {
					expect(records).to.deep.equal([
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable0,
							name: "foo"
						},
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable0,
							name: "bar"
						},
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable0,
							name: "baz"
						}
					]);
				})));
				observable0.set("foo", "Foo0");
				observable1.set("foo", "Foo0");
				observable0.set("bar", "Bar0");
				observable1.set("bar", "Bar0");
				observable0.set("baz", "Baz0");
			});
			it("Work with multiple observers per an observable", function () {
				var dfd = this.async(1000),
					observable = new Observable();
				handles.push(Observable.observe(observable, dfd.rejectOnError(function (records) {
					expect(records).to.deep.equal([
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable,
							name: "foo"
						},
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable,
							name: "bar"
						},
						{
							type: Observable.CHANGETYPE_UPDATE,
							object: observable,
							name: "foo",
							oldValue: "Foo0"
						}
					]);
				})));
				handles.push(Observable.observe(observable, dfd.callback(function (records) {
					expect(records).to.deep.equal([
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable,
							name: "foo"
						},
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable,
							name: "bar"
						},
						{
							type: Observable.CHANGETYPE_UPDATE,
							object: observable,
							name: "foo",
							oldValue: "Foo0"
						}
					]);
				})));
				observable.set("foo", "Foo0");
				observable.set("bar", "Bar");
				observable.set("foo", "Foo1");
			});
			it("Observer callback changing another observable", function () {
				var changeRecords = [],
					observable0ObserverCalledCount = 0,
					dfd = this.async(1000),
					observable0 = new Observable(),
					observable1 = new Observable();
				handles.push(Observable.observe(observable0, dfd.rejectOnError(function (records) {
					[].push.apply(changeRecords, records);
					if (++observable0ObserverCalledCount >= 2) {
						expect(observable0ObserverCalledCount).to.be.equal(2);
						expect(changeRecords).to.deep.equal([
							{
								type: Observable.CHANGETYPE_ADD,
								object: observable0,
								name: "foo0"
							},
							{
								type: Observable.CHANGETYPE_ADD,
								object: observable1,
								name: "foo1"
							},
							{
								type: Observable.CHANGETYPE_ADD,
								object: observable0,
								name: "bar0"
							}
						]);
						dfd.resolve(1);
					}
				})));
				handles.push(Observable.observe(observable1, dfd.rejectOnError(function (records) {
					observable0.set("bar0", "Bar0");
					[].push.apply(changeRecords, records);
				})));
				observable1.set("foo1", "Foo1");
				observable0.set("foo0", "Foo0");
			});
			it("Execution order of callback with observer callback changing another observable", function () {
				var first,
					changeRecords = [],
					dfd = this.async(1000),
					observable0 = new Observable(),
					observable1 = new Observable(),
					observable2 = new Observable();
				handles.push(Observable.observe(observable0, dfd.rejectOnError(function (records) {
					[].push.apply(changeRecords, records);
					console.log("observable0 callback");
					observable1.set("foo", "Foo0");
				})));
				handles.push(Observable.observe(observable1, dfd.rejectOnError(function (records) {
					[].push.apply(changeRecords, records);
					console.log("observable1 callback");
					if (!first) {
						first = true;
						observable0.set("foo", "Foo1");
					}
				})));
				handles.push(Observable.observe(observable2, dfd.rejectOnError(function (records) {
					[].push.apply(changeRecords, records);
					console.log("observable2 callback");
				})));
				observable0.set("foo", "Foo0");
				observable2.set("foo", "Foo0");
				setTimeout(dfd.callback(function () {
					expect(changeRecords).to.deep.equal([
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable0,
							name: "foo"
						},
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable1,
							name: "foo"
						},
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable2,
							name: "foo"
						},
						{
							type: Observable.CHANGETYPE_UPDATE,
							object: observable0,
							name: "foo",
							oldValue: "Foo0"
						}
					]);
				}), 100);
			});
			it("Setting a value that is same as the current property value", function () {
				var dfd = this.async(1000),
					observable = new Observable({
						foo: "Foo",
						bar: NaN,
						baz: 0
					});
				handles.push(Observable.observe(observable, dfd.callback(function (records) {
					expect(records).to.deep.equal([
						{
							type: Observable.CHANGETYPE_UPDATE,
							object: observable,
							name: "baz",
							oldValue: 0
						}
					]);
				})));
				observable.set("foo", "Foo");
				observable.set("bar", NaN);
				observable.set("baz", -0);
			});
			it("Observing with the same callback", function () {
				var dfd = this.async(1000),
					count = 0,
					observable = new Observable(),
					callback = dfd.rejectOnError(function () {
						expect(++count < 2).to.be.true;
					});
				handles.push(Observable.observe(observable, callback, [Observable.CHANGETYPE_UPDATE]));
				handles.push(Observable.observe(observable, callback, [Observable.CHANGETYPE_ADD]));
				observable.set("foo", "Foo0");
				setTimeout(dfd.callback(function () {
					expect(count).to.equal(1);
				}), 100);
			});
			it("Error in observer callback", function () {
				var dfd = this.async(1000),
					observable = new Observable();
				handles.push(Observable.observe(observable, function () {
					throw pseudoError;
				}));
				handles.push(Observable.observe(observable, dfd.callback(function (records) {
					expect(records).to.deep.equal([
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable,
							name: "foo"
						}
					]);
				})));
				observable.set("foo", "Foo0");
			});
			it("Synthetic change record", function () {
				var dfd = this.async(1000),
					observable = new Observable({0: 0, 1: 1, length: 2});
				Observable.observe(observable, dfd.rejectOnError(function (records) {
					expect(records).to.deep.equal([
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable,
							name: "2"
						},
						{
							type: Observable.CHANGETYPE_UPDATE,
							object: observable,
							name: "length",
							oldValue: 2
						},
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable,
							name: "3"
						},
						{
							type: Observable.CHANGETYPE_UPDATE,
							object: observable,
							name: "length",
							oldValue: 3
						}
					]);
				}));
				Observable.observe(observable, dfd.callback(function (records) {
					expect(records).to.deep.equal([
						{
							type: "fakesplice",
							object: observable,
							removed: [],
							addCount: 2
						}
					]);
				}), ["fakesplice"]);
				Observable.getNotifier(observable).performChange("fakesplice", function () {
					observable.set("2", 2);
					observable.set("length", 3);
					observable.set("3", 3);
					observable.set("length", 4);
					return {
						removed: [],
						addCount: 2
					};
				});
			});
			it("Synthetic change record; Nested", function () {
				function Thingy(a, b) {
					Observable.call(this, {a: a, b: b});
				}
				Thingy.prototype = Object.create(Observable.prototype);
				Thingy.prototype.increment = function (amount) {
					var notifier = Observable.getNotifier(this);
					notifier.performChange("increment", function () {
						this.set("a", this.a + amount);
						this.set("b", this.b + amount);
					}.bind(this));
					notifier.notify({
						object: this,
						type: "increment",
						incremented: amount
					});
				};
				Thingy.prototype.multiply = function (amount) {
					var notifier = Observable.getNotifier(this);
					notifier.performChange("multiply", function () {
						this.set("a", this.a * amount);
						this.set("b", this.b * amount);
					}.bind(this));
					notifier.notify({
						object: this,
						type: "multiply",
						multiplied: amount
					});
				};
				Thingy.prototype.incrementAndMultiply = function (incAmount, multAmount) {
					var notifier = Observable.getNotifier(this);
					notifier.performChange("incrementAndMultiply", function () {
						this.increment(incAmount);
						this.multiply(multAmount);
					}.bind(this));
					notifier.notify({
						object: this,
						type: "incrementAndMultiply",
						incremented: incAmount,
						multiplied: multAmount
					});
				};

				var thingy = new Thingy(2, 4),
					dfd = this.async(1000);

				Observable.observe(thingy, dfd.rejectOnError(function (records) {
					expect(records).to.deep.equal([
						{
							"type": "update",
							"object": thingy,
							"name": "a",
							"oldValue": 2
						},
						{
							"type": "update",
							"object": thingy,
							"name": "b",
							"oldValue": 4
						},
						{
							"object": thingy,
							"type": "multiply",
							"multiplied": 2
						}
					]);
				}), ["multiply", "update"]);

				Observable.observe(thingy, dfd.rejectOnError(function (records) {
					expect(records).to.deep.equal([
						{
							"object": thingy,
							"type": "increment",
							"incremented": 2
						},
						{
							"type": "update",
							"object": thingy,
							"name": "a",
							"oldValue": 4
						},
						{
							"type": "update",
							"object": thingy,
							"name": "b",
							"oldValue": 6
						}
					]);
				}), ["increment", "update"]);

				Observable.observe(thingy, dfd.rejectOnError(function (records) {
					expect(records).to.deep.equal([
						{
							"type": "update",
							"object": thingy,
							"name": "a",
							"oldValue": 2
						},
						{
							"type": "update",
							"object": thingy,
							"name": "b",
							"oldValue": 4
						},
						{
							"type": "update",
							"object": thingy,
							"name": "a",
							"oldValue": 4
						},
						{
							"type": "update",
							"object": thingy,
							"name": "b",
							"oldValue": 6
						}
					], "Observe callback with default acceptList (native types only)");
				}));

				Observable.observe(thingy, dfd.callback(function (records) {
					expect(records).to.deep.equal([
						{
							"object": thingy,
							"type": "incrementAndMultiply",
							"incremented": 2,
							"multiplied": 2
						}
					], "Observe callback that accepts everything");
				}), ["increment", "multiply", "incrementAndMultiply", "update"]);

				thingy.incrementAndMultiply(2, 2);
			});
			it("Unobserve", function () {
				var h0, h1,
					dfd = this.async(1000),
					observable0 = new Observable(),
					observable1 = new Observable();
				handles.push(h0 = Observable.observe(observable0, dfd.rejectOnError(function (records) {
					expect(records).to.deep.equal([
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable0,
							name: "foo0"
						},
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable0,
							name: "bar0"
						}
					]);
				})));
				handles.push(h1 = Observable.observe(observable1, dfd.callback(function (records) {
					expect(records).to.deep.equal([
						{
							type: Observable.CHANGETYPE_ADD,
							object: observable1,
							name: "foo1"
						}
					]);
				})));
				observable0.set("foo0", "Foo1");
				observable1.set("foo1", "Foo1");
				h1.remove();
				h1 = null;
				observable1.set("bar1", "Bar1");
				observable0.set("bar0", "Bar0");
				h0.remove();
				h0.remove(); // Make sure removing the handle twice won't cause any problem
				h0 = null;
			});
		});
		// TODO(asudoh): Add more enumerable/configuable/writable tests
		// TODO(asudoh): Add test for Observable.observe() is called twice for the same observable/callback pair, and removing that handle
	}
});
