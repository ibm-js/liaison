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
			function noop() {}
			it("Wrong parameters", function () {
				var thrown;
				try {
					new Each(0).open(noop);
				} catch (e) {
					thrown = true;
				}
				expect(thrown).to.be.true;
				thrown = false;
				try {
					new Each(["a"], 0).open(noop);
				} catch (e) {
					thrown = true;
				}
				expect(thrown).to.be.true;
				thrown = false;
				try {
					new Each([["a"]], [0]).open(noop);
				} catch (e) {
					thrown = true;
				}
				expect(thrown).to.be.true;
			});
			it("Feeding non-array", function () {
				var each, each0, each1, each2, each3, observableArray,
					dfd = this.async(1000),
					count = 0,
					functionThatShouldNotBeCalled = dfd.rejectOnError(function () {
						throw new Error("Called observer callback that should never be called.");
					}),
					callbacks = [
						dfd.rejectOnError(function (newValues, oldValues) {
							expect(newValues).to.deep.equal([true]);
							expect(oldValues).to.deep.equal([undefined]);
							each.setTo([1]);
						}),
						dfd.rejectOnError(function (newValues, oldValues) {
							expect(newValues).to.deep.equal([1]);
							expect(oldValues).to.deep.equal([true]);
							each.setTo(["a"]);
						}),
						dfd.rejectOnError(function (newValues, oldValues) {
							expect(newValues).to.deep.equal(["a"]);
							expect(oldValues).to.deep.equal([1]);
							each.setTo([{}]);
						}),
						dfd.rejectOnError(function (newValues, oldValues) {
							expect(newValues).to.deep.equal([{}]);
							expect(oldValues).to.deep.equal(["a"]);
							each.setTo([observableArray = new ObservableArray("a", "b", "c")]);
						}),
						dfd.rejectOnError(function (newValues, oldValues) {
							expect(newValues).to.deep.equal([["a", "b", "c"]]);
							expect(oldValues).to.deep.equal([{}]);
							observableArray.push("d", "e");
						}),
						dfd.callback(function (newValues, oldValues) {
							expect(newValues).to.deep.equal([["a", "b", "c", "d", "e"]]);
							expect(oldValues).to.deep.equal([["a", "b", "c"]]);
						}),
					];
				handles.push(each = new Each([undefined]));
				handles.push(each0 = new Each([true]));
				handles.push(each1 = new Each([1]));
				handles.push(each2 = new Each(["a"]));
				handles.push(each3 = new Each([{}]));
				each0.observe(functionThatShouldNotBeCalled);
				each1.observe(functionThatShouldNotBeCalled);
				each2.observe(functionThatShouldNotBeCalled);
				each3.observe(functionThatShouldNotBeCalled);
				each.observe(dfd.rejectOnError(function (newValue, oldValue) {
					callbacks[count++](newValue, oldValue);
				}));
				each.setTo([true]);
			});
			it("Simple observation", function () {
				var dfd = this.async(1000),
					observableArray = new ObservableArray(
						{Name: "Anne Ackerman"},
						{Name: "Ben Beckham"},
						{Name: "Chad Chapman"}),
					each = new Each([observableArray], function (values) {
						return values[0].reduce(function (length, entry) {
							return length + entry.Name.length;
						}, 0);
					});
				each.observe(function () {}).remove();
				expect(each.getFrom()).to.equal(36);
				handles.push(each.observe(dfd.callback(function (newValue, oldValue) {
					expect(newValue).to.equal(57);
					expect(oldValue).to.equal(36);
				})));
				observableArray.push({Name: "Irene Ira"},
					{Name: "John Jacklin"});
			});
			it("ObservableArray in Observable", function () {
				var dfd = this.async(1000),
					observable = new Observable({
						foo: new ObservableArray(
							{Name: "Anne Ackerman"},
							{Name: "Ben Beckham"},
							{Name: "Chad Chapman"})
					}),
					each = new Each([new ObservablePath(observable, "foo")], function (values) {
						return values[0].reduce(function (length, entry) {
							return length + entry.Name.length;
						}, 0);
					});
				expect(each.getFrom()).to.equal(36);
				handles.push(each.observe(dfd.callback(function (newValue, oldValue) {
					expect(newValue).to.equal(57);
					expect(oldValue).to.equal(36);
				})));
				observable.foo.push({Name: "Irene Ira"}, {Name: "John Jacklin"});
			});
			it("Switching ObservableArray in Observable", function () {
				var dfd = this.async(1000),
					count = 0,
					observable = new Observable({
						foo: new ObservableArray(
							new Observable({Name: "Anne Ackerman"}),
							new Observable({Name: "Ben Beckham"}),
							new Observable({Name: "Chad Chapman"}))
					}),
					each = new Each([new ObservablePath(observable, "foo")], [["Name"]], function (values) {
						return values[0].reduce(function (length, entry) {
							return length + entry.Name.length;
						}, 0);
					}),
					callbacks = [
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.equal(45);
							expect(oldValue).to.equal(36);
							observable.foo.push(new Observable({Name: "Chad Chapman"}));
						}),
						dfd.callback(function (newValue, oldValue) {
							expect(newValue).to.equal(57);
							expect(oldValue).to.equal(45);
						})
					];
				expect(each.getFrom()).to.equal(36);
				handles.push(each.observe(dfd.rejectOnError(function (newValue, oldValue) {
					callbacks[count++](newValue, oldValue);
				})));
				observable.foo.push(new Observable({Name: "Anne Ackerman"}), new Observable({Name: "Ben Beckham"})); // Should be no-op
				observable.set("foo", new ObservableArray(new Observable({Name: "Irene Ira"}), new Observable({Name: "John Jacklin"})));
				observable.foo.push(new Observable({Name: "Anne Ackerman"}), new Observable({Name: "Ben Beckham"}));
			});
			it("Each observing array as well as non-array", function () {
				var count = 0,
					dfd = this.async(1000),
					observable = new Observable({
						foo: new ObservableArray(
							new Observable({Name: "Anne Ackerman"}),
							new Observable({Name: "Ben Beckham"}),
							new Observable({Name: "Chad Chapman"})),
						countShortFirst: true
					}),
					sources = [new ObservablePath(observable, "foo"), new ObservablePath(observable, "countShortFirst")],
					each = new Each(sources, [["Name"]], function (values) {
						var a = values[0],
							countShortFirst = values[1];
						return a.reduce(function (length, entry) {
							return length + (entry.Name.split(" ")[0].length >= 4 || countShortFirst ? entry.Name.length : 0);
						}, 0);
					}),
					callbacks = [
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.equal(57);
							expect(oldValue).to.equal(36);
							observable.set("countShortFirst", false);
						}),
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.equal(46);
							expect(oldValue).to.equal(57);
							observable.foo.splice(1, 1);
						}),
						dfd.callback(function (newValue, oldValue) {
							expect(newValue).to.equal(46);
							expect(oldValue).to.equal(46);
						})
					];
				expect(each.getFrom()).to.equal(36);
				handles.push(each.observe(dfd.rejectOnError(function (newValue, oldValue) {
					callbacks[count++](newValue, oldValue);
				})));
				observable.foo.push(new Observable({Name: "Irene Ira"}), new Observable({Name: "John Jacklin"}));
			});
			it("Setting value to Each", function () {
				var dfd = this.async(1000),
					each = new Each([new ObservableArray("a", "b", "c")]);
				handles.push(each);
				each.observe(dfd.callback(function (newValues, oldValues) {
					expect(newValues).to.deep.equal([["d", "e"]]);
					expect(oldValues).to.deep.equal([["a", "b", "c"]]);
				}));
				each.setValue([["d", "e"]]);
			});
			it("Observing for sub-properties in each array entry", function () {
				var count = 0,
					dfd = this.async(1000),
					observableArray = new ObservableArray(
						new Observable({Name: "Anne Ackerman"}),
						new Observable({Name: "Ben Beckham"}),
						new Observable({Name: "Chad Chapman"})),
					each = new Each([observableArray], [["Name"]], function (values) {
						return values[0].reduce(function (length, entry) {
							return length + entry.Name.length;
						}, 0);
					}),
					callbacks = [
						dfd.rejectOnError(function (newValue, oldValue) {
							expect(newValue).to.equal(72);
							expect(oldValue).to.equal(36);
							observableArray[0].set("Name", "Irene Ira");
						}),
						dfd.callback(function (newValue, oldValue) {
							expect(newValue).to.equal(69);
							expect(oldValue).to.equal(72);
						})
					];
				each.observe(function () {}).remove();
				expect(each.getFrom()).to.equal(36);
				handles.push(each.observe(dfd.rejectOnError(function (newValue, oldValue) {
					callbacks[count++](newValue, oldValue);
				})));
				observableArray.push(new Observable({Name: "John Jacklin"}));
				observableArray.splice(2, 0, new Observable({Name: "John Jacklin"}));
				observableArray.unshift(new Observable({Name: "John Jacklin"}));
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
						dfd.rejectOnError(function (newValues, oldValues) {
							expect(newValues).to.deep.equal([[
								{Name: "Irene Ira"},
								{Name: "John Jacklin"}
							]]);
							expect(oldValues).to.deep.equal([[
								{Name: "Anne Ackerman"},
								{Name: "Ben Beckham"},
								{Name: "Chad Chapman"}
							]]);
							observable.set("foo", new ObservableArray({Name: "John Doe"}));
						}),
						dfd.callback(function (newValues, oldValues) {
							expect(newValues).to.deep.equal([[{Name: "John Doe"}]]);
							expect(oldValues).to.deep.equal([[
								{Name: "Irene Ira"},
								{Name: "John Jacklin"}
							]]);
						})
					];
				handles.push(each = new Each([new ObservablePath(observable, "foo")]));
				each.observe(function (newValues, oldValues) {
					try {
						callbacks[count](newValues, oldValues);
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
				handles.push(each = new Each([new ObservablePath(observable, "foo")], function () {
					throw pseudoError;
				}, function () {
					throw pseudoError;
				}));
				each.observe(dfd.callback(function (newValues, oldValues) {
					expect(newValues).to.deep.equal([[
						{Name: "Irene Ira"},
						{Name: "John Jacklin"}
					]]);
					expect(oldValues).to.deep.equal([[
						{Name: "Anne Ackerman"},
						{Name: "Ben Beckham"},
						{Name: "Chad Chapman"}
					]]);
				}));
				each.setTo([new ObservableArray({Name: "Irene Ira"}, {Name: "John Jacklin"})]);
			});
			it("Synchronous change delivery", function () {
				var each, finishedMicrotask,
					dfd = this.async(1000),
					count = 0,
					observableArray = new ObservableArray(
						{Name: "Anne Ackerman"},
						{Name: "Ben Beckham"},
						{Name: "Chad Chapman"}),
					observable = new Observable({foo: observableArray}),
					callbacks = [
						dfd.rejectOnError(function (newValues, oldValues) {
							expect(finishedMicrotask).not.to.be.true;
							expect(newValues).to.deep.equal([[
								{Name: "Irene Ira"},
								{Name: "John Jacklin"}
							]]);
							expect(oldValues).to.deep.equal([[
								{Name: "Anne Ackerman"},
								{Name: "Ben Beckham"},
								{Name: "Chad Chapman"}
							]]);
						}),
						dfd.callback(function (newValues, oldValues) {
							expect(finishedMicrotask).not.to.be.true;
							expect(newValues).to.deep.equal([[
								{Name: "Irene Ira"},
								{Name: "John Jacklin"},
								{Name: "Anne Ackerman"},
								{Name: "Ben Beckham"}
							]]);
							expect(oldValues).to.deep.equal([[
								{Name: "Irene Ira"},
								{Name: "John Jacklin"}
							]]);
						})
					];
				handles.push(each = new Each([new ObservablePath(observable, "foo")]));
				each.observe(dfd.rejectOnError(function (newValues, oldValues) {
					callbacks[count++](newValues, oldValues);
				}));
				observable.set("foo", new ObservableArray({Name: "Irene Ira"}, {Name: "John Jacklin"}));
				each.deliver();
				observable.foo.push({Name: "Anne Ackerman"}, {Name: "Ben Beckham"});
				each.deliver();
				finishedMicrotask = true;
			});
			it("Discarding change", function () {
				var each,
					dfd = this.async(1000),
					observableArray = new ObservableArray(
						new Observable({Name: "Anne Ackerman"}),
						new Observable({Name: "Ben Beckham"}),
						new Observable({Name: "Chad Chapman"})),
					observable = new Observable({foo: observableArray});
				handles.push(each = new Each([new ObservablePath(observable, "foo")], [["Name"]]));
				each.observe(dfd.rejectOnError(function () {
					throw new Error("Observer callback should never be called for changes being discarded.");
				}));
				observable.set("foo", new ObservableArray(new Observable({Name: "Irene Ira"}), new Observable({Name: "John Jacklin"})));
				observable.foo.push(new Observable({Name: "Anne Ackerman"}), new Observable({Name: "Ben Beckham"}));
				expect(each.discardChanges()).to.deep.equal([[
					new Observable({Name: "Irene Ira"}),
					new Observable({Name: "John Jacklin"}),
					new Observable({Name: "Anne Ackerman"}),
					new Observable({Name: "Ben Beckham"})
				]]);
				dfd.resolve(1);
			});
			it("Round-trip of formatter/parser", function () {
				var formatter = function () {},
					parser = function () {},
					each = new Each([new ObservablePath(new Observable({foo: new ObservableArray(0, 1, 2)}), "foo")], formatter, parser);
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
				handles.push(each = new Each([new ObservablePath(observable, "foo")]));
				var h = each.observe(dfd.rejectOnError(function () {
					throw new Error("Observer callback should never be called after removal.");
				}));
				h.remove();
				observable.set("foo", new ObservableArray({Name: "Irene Ira"}, {Name: "John Jacklin"}));
				each.deliver();
				observable.foo.push({Name: "Anne Ackerman"}, {Name: "Ben Beckham"});
				setTimeout(dfd.callback(function () {}), 100);
			});
		});
	}
});
