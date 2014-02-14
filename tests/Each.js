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
			var handles = [];
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					handle.remove();
				}
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
			// TODO(asudoh): Add tests for oldValue
		});
	}
});
