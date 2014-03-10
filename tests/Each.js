define([
	"intern!bdd",
	"intern/chai!expect",
	"../Observable",
	"../ObservableArray",
	"../ObservablePath",
	"../Each"
], function (bdd, expect, Observable, ObservableArray, ObservablePath, Each) {
	/* jshint withstmt: true */
	/* global describe, afterEach, it */
	with (bdd) {
		describe("Test liaison/Each", function () {
			var handles = [],
				pseudoError = new Error("Error thrown on purpose. This error does not mean bad result of test case.");
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					handle.remove();
				}
			});
			it("Feeding non-array", function () {
				var each, each0, each1, each2, each3, observableArray,
					dfd = this.async(1000),
					count = 0,
					functionThatShouldNotBeCalled = dfd.rejectOnError(function () {
						throw new Error("Called observer callback that should never be called.");
					}),
					callbacks = [
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.equal(true);
							expect(oldValue).to.equal(undefined);
							each.setTo(1);
						}),
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.equal(1);
							expect(oldValue).to.equal(true);
							each.setTo("a");
						}),
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.equal("a");
							expect(oldValue).to.equal(1);
							each.setTo({});
						}),
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.deep.equal({});
							expect(oldValue).to.equal("a");
							each.setTo(observableArray = new ObservableArray("a", "b", "c"));
						}),
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.deep.equal(["a", "b", "c"]);
							expect(oldValue).to.deep.equal({});
							observableArray.push("d", "e");
						}),
						dfd.callback(function (newValue, oldValue) {
							expect(newValue).to.deep.equal(["a", "b", "c", "d", "e"]);
							expect(oldValue).to.deep.equal(["a", "b", "c"]);
						}),
					];
				handles.push(each = new Each(undefined));
				handles.push(each0 = new Each(true));
				handles.push(each1 = new Each(1));
				handles.push(each2 = new Each("a"));
				handles.push(each3 = new Each({}));
				each0.observe(functionThatShouldNotBeCalled);
				each1.observe(functionThatShouldNotBeCalled);
				each2.observe(functionThatShouldNotBeCalled);
				each3.observe(functionThatShouldNotBeCalled);
				each.observe(dfd.rejectOnError(function (newValue, oldValue) {
					callbacks[count++](newValue, oldValue);
				}));
				each.setTo(true);
			});
			it("Simple observation", function () {
				var dfd = this.async(1000),
					observableArray = new ObservableArray(
						{Name: "Anne Ackerman"},
						{Name: "Ben Beckham"},
						{Name: "Chad Chapman"}),
					each = new Each(observableArray, function (a) {
						return a.reduce(function (length, entry) {
							return length + entry.Name.length;
						}, 0);
					});
				expect(each.getFrom()).to.equal(36);
				handles.push(each.observe(dfd.callback(function (newValue) {
					expect(newValue).to.equal(57);
				})));
				observableArray.push({Name: "Irene Ira"},
					{Name: "John Jacklin"});
			});
			it("ObservableArray in Observable", function () {
				var dfd = this.async(1000),
					observable = new Observable({foo: new ObservableArray(
						{Name: "Anne Ackerman"},
						{Name: "Ben Beckham"},
						{Name: "Chad Chapman"})}),
					each = new Each(new ObservablePath(observable, "foo"), function (a) {
						return a.reduce(function (length, entry) {
							return length + entry.Name.length;
						}, 0);
					});
				expect(each.getFrom()).to.equal(36);
				handles.push(each.observe(dfd.callback(function (newValue) {
					expect(newValue).to.equal(57);
				})));
				observable.foo.push({Name: "Irene Ira"}, {Name: "John Jacklin"});
			});
			it("Switching ObservableArray in Observable", function () {
				var dfd = this.async(1000),
					count = 0,
					values = [45, 57],
					observable = new Observable({foo: new ObservableArray(
						{Name: "Anne Ackerman"},
						{Name: "Ben Beckham"},
						{Name: "Chad Chapman"})}),
					each = new Each(new ObservablePath(observable, "foo"), function (a) {
						return a.reduce(function (length, entry) {
							return length + entry.Name.length;
						}, 0);
					});
				expect(each.getFrom()).to.equal(36);
				handles.push(each.observe(dfd.rejectOnError(function (newValue) {
					// Change in observable.foo is notified asynchronously,
					// and observable.foo.push() had happened before then
					expect(newValue).to.equal(values[count++]);
					if (count < values.length) {
						setTimeout(function () {
							observable.foo.push({Name: "Chad Chapman"});
						}, 0);
					} else {
						dfd.resolve(1);
					}
				})));
				observable.set("foo", new ObservableArray({Name: "Irene Ira"}, {Name: "John Jacklin"}));
				observable.foo.push({Name: "Anne Ackerman"}, {Name: "Ben Beckham"});
			});
			it("Setting value to Each", function () {
				var dfd = this.async(1000),
					each = new Each(new ObservableArray("a", "b", "c"));
				handles.push(each);
				var h = each.observe(dfd.callback(function (newValue, oldValue) {
					expect(newValue).to.deep.equal(["d", "e"]);
					expect(oldValue).to.deep.equal(["a", "b", "c"]);
				}));
				h.setValue(["d", "e"]);
			});
			it("Exception in observer callback", function () {
				var each,
					count = 0,
					dfd = this.async(1000),
					observableArray = new ObservableArray(
						{Name: "Anne Ackerman"},
						{Name: "Ben Beckham"},
						{Name: "Chad Chapman"}),
					observable = new Observable({foo: observableArray}),
					callbacks = [
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.deep.equal([
								{Name: "Irene Ira"},
								{Name: "John Jacklin"}
							]);
							expect(oldValue).to.deep.equal([
								{Name: "Anne Ackerman"},
								{Name: "Ben Beckham"},
								{Name: "Chad Chapman"}
							]);
							observable.set("foo", new ObservableArray({Name: "John Doe"}));
						}),
						dfd.callback(function (newValue, oldValue) {
							expect(newValue).to.deep.equal([{Name: "John Doe"}]);
							expect(oldValue).to.deep.equal([
								{Name: "Irene Ira"},
								{Name: "John Jacklin"}
							]);
						})
					];
				handles.push(each = new Each(new ObservablePath(observable, "foo")));
				each.observe(function (newValue, oldValue) {
					try {
						callbacks[count](newValue, oldValue);
					} catch (e) {
						dfd.reject(e);
					}
					if (count++ === 0) {
						throw pseudoError;
					}
				});
				observable.set("foo", new ObservableArray({Name: "Irene Ira"}, {Name: "John Jacklin"}));
			});
			it("Exception in formatter/parser", function () {
				var each,
					dfd = this.async(1000),
					observableArray = new ObservableArray(
						{Name: "Anne Ackerman"},
						{Name: "Ben Beckham"},
						{Name: "Chad Chapman"}),
					observable = new Observable({foo: observableArray});
				handles.push(each = new Each(new ObservablePath(observable, "foo"), function () {
					throw pseudoError;
				}, function () {
					throw pseudoError;
				}));
				each.observe(dfd.callback(function (newValue, oldValue) {
					expect(newValue).to.deep.equal([
						{Name: "Irene Ira"},
						{Name: "John Jacklin"}
					]);
					expect(oldValue).to.deep.equal([
						{Name: "Anne Ackerman"},
						{Name: "Ben Beckham"},
						{Name: "Chad Chapman"}
					]);
				}));
				each.setTo(new ObservableArray({Name: "Irene Ira"}, {Name: "John Jacklin"}));
			});
			it("Synchronous change delivery", function () {
				var h0, h1, each, deliveredBoth, finishedMicrotask,
					dfd = this.async(1000),
					count = 0,
					observableArray = new ObservableArray(
						{Name: "Anne Ackerman"},
						{Name: "Ben Beckham"},
						{Name: "Chad Chapman"}),
					observable = new Observable({foo: observableArray}),
					callbacks = [
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(finishedMicrotask).not.to.be.true;
							expect(newValue).to.deep.equal([
								{Name: "Irene Ira"},
								{Name: "John Jacklin"}
							]);
							expect(oldValue).to.deep.equal([
								{Name: "Anne Ackerman"},
								{Name: "Ben Beckham"},
								{Name: "Chad Chapman"}
							]);
						}),
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(finishedMicrotask).not.to.be.true;
							expect(newValue).to.deep.equal([
								{Name: "Irene Ira"},
								{Name: "John Jacklin"},
								{Name: "Anne Ackerman"},
								{Name: "Ben Beckham"}
							]);
							expect(oldValue).to.deep.equal([
								{Name: "Irene Ira"},
								{Name: "John Jacklin"}
							]);
							deliveredBoth = true;
						})
					];
				handles.push(each = new Each(new ObservablePath(observable, "foo")));
				h0 = each.observe(dfd.callback(function (newValue, oldValue) {
					expect(deliveredBoth).to.be.true;
					expect(finishedMicrotask).to.be.true;
					expect(newValue).to.deep.equal([
						{Name: "Irene Ira"},
						{Name: "John Jacklin"},
						{Name: "Anne Ackerman"},
						{Name: "Ben Beckham"}
					]);
					expect(oldValue).to.deep.equal([
						{Name: "Anne Ackerman"},
						{Name: "Ben Beckham"},
						{Name: "Chad Chapman"}
					]);
				}));
				h1 = each.observe(dfd.rejectOnError(function (newValue, oldValue) {
					callbacks[count++](newValue, oldValue);
				}));
				observable.set("foo", new ObservableArray({Name: "Irene Ira"}, {Name: "John Jacklin"}));
				h1.deliver();
				observable.foo.push({Name: "Anne Ackerman"}, {Name: "Ben Beckham"});
				h1.deliver();
				finishedMicrotask = true;
			});
			it("Discarding change", function () {
				var h0, h1, each, finishedMicrotask,
					dfd = this.async(1000),
					observableArray = new ObservableArray(
						{Name: "Anne Ackerman"},
						{Name: "Ben Beckham"},
						{Name: "Chad Chapman"}),
					observable = new Observable({foo: observableArray});
				handles.push(each = new Each(new ObservablePath(observable, "foo")));
				h0 = each.observe(dfd.callback(function (newValue, oldValue) {
					expect(finishedMicrotask).to.be.true;
					expect(newValue).to.deep.equal([
						{Name: "Irene Ira"},
						{Name: "John Jacklin"},
						{Name: "Anne Ackerman"},
						{Name: "Ben Beckham"}
					]);
					expect(oldValue).to.deep.equal([
						{Name: "Anne Ackerman"},
						{Name: "Ben Beckham"},
						{Name: "Chad Chapman"}
					]);
				}));
				h1 = each.observe(dfd.rejectOnError(function () {
					throw new Error("Observer callback should never be called for changes being discarded.");
				}));
				observable.set("foo", new ObservableArray({Name: "Irene Ira"}, {Name: "John Jacklin"}));
				observable.foo.push({Name: "Anne Ackerman"}, {Name: "Ben Beckham"});
				h1.discardChanges();
				finishedMicrotask = true;
			});
			it("Round-trip of formatter/parser", function () {
				var formatter = function () {},
					parser = function () {},
					each = new Each(new ObservablePath(new Observable({foo: new ObservableArray(0, 1, 2)}), "foo"), formatter, parser);
				expect(each.formatter).to.equal(formatter);
				expect(each.parser).to.equal(parser);
			});
			it("Cleaning up observe() handle", function () {
				var each,
					dfd = this.async(1000),
					observableArray = new ObservableArray(
						{Name: "Anne Ackerman"},
						{Name: "Ben Beckham"},
						{Name: "Chad Chapman"}),
					observable = new Observable({foo: observableArray});
				handles.push(each = new Each(new ObservablePath(observable, "foo")));
				var h = each.observe(dfd.rejectOnError(function () {
					throw new Error("Observer callback should never be called after removal.");
				}));
				h.remove();
				expect(each.observers && each.observers.length > 0).not.to.be.true;
				observable.set("foo", new ObservableArray({Name: "Irene Ira"}, {Name: "John Jacklin"}));
				h.deliver();
				observable.foo.push({Name: "Anne Ackerman"}, {Name: "Ben Beckham"});
				setTimeout(dfd.callback(function () {}), 100);
			});
		});
	}
});
