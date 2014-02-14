define([
	"intern!bdd",
	"intern/chai!expect",
	"../Observable",
	"../ObservableArray",
	"../ObservablePath",
	"../wrapper"
], function (bdd, expect, Observable, ObservableArray, ObservablePath, wrapper) {
	/* jshint withstmt: true */
	/* global describe, it, afterEach */
	with (bdd) {
		describe("Test liaison/wrapper", function () {
			function CustomClz() {}
			var bool = true,
				num = Infinity,
				str = "Foo",
				date = new Date(),
				func = function (foo, bar) {
					console.log(foo);
					console.log(bar);
				},
				custom = new CustomClz(),
				o = {
					foo: "Foo",
					bar: "Bar",
					date: date,
					func: func,
					custom: custom,
					child: {
						foo: "Foo",
						bar: "Bar"
					},
					a: ["Foo", "Bar", date, func, custom, {
						foo: "Foo",
						bar: "Bar"
					}]
				},
				observableTree = new Observable({
					foo: "Foo",
					bar: "Bar",
					date: date,
					func: func,
					custom: custom,
					child: new Observable({
						foo: "Foo",
						bar: "Bar"
					}),
					a: new ObservableArray("Foo", "Bar", date, func, custom, new Observable({
						foo: "Foo",
						bar: "Bar"
					}))
				}),
				withComputed = {
					foo: "Foo",
					bar: "Bar",
					foobar: wrapper.computed(function (foo, bar) {
						return foo + " " + bar;
					}, "foo", "bar"),
					date: date,
					func: func,
					custom: custom,
					child: {
						foo: "Foo",
						bar: "Bar"
					},
					a: ["Foo", "Bar", date, func, custom, {
						foo: "Foo",
						bar: "Bar"
					}],
					aLength: wrapper.computedArray(function (a) {
						return a.length;
					}, "a")
				};
			var handles = [];
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					typeof handle.close === "function" ? handle.close() : handle.remove();
				}
			});
			it("Wrap non-object", function () {
				expect(wrapper.wrap(bool)).to.equal(bool);
				expect(wrapper.wrap(num)).to.equal(num);
				expect(wrapper.wrap(str)).to.equal(str);
				expect(wrapper.wrap(date)).to.equal(date);
				expect(wrapper.wrap(func)).to.equal(func);
			});
			it("Wrap an object", function () {
				var wrapped = wrapper.wrap(o);
				expect(wrapped).to.deep.equal(observableTree);
				expect(Observable.test(wrapped)).not.to.be.false;
				expect(typeof wrapped.date.getTime).to.equal("function");
				expect(wrapped.func.length).to.equal(2);
				expect(wrapped.custom).to.equal(custom);
				expect(Observable.test(wrapped.child)).not.to.be.false;
				expect(ObservableArray.test(wrapped.a)).not.to.be.false;
				expect(typeof wrapped.a[2].getTime).to.equal("function");
				expect(wrapped.a[3].length).to.equal(2);
				expect(wrapped.a[4]).to.equal(custom);
				expect(Observable.test(wrapped.a[5])).not.to.be.false;
			});
			it("Unwrap an observable tree", function () {
				var unwrapped = wrapper.unwrap(observableTree);
				expect(unwrapped).to.deep.equal(o);
				expect(Observable.test(unwrapped)).not.to.be.true;
				expect(typeof unwrapped.date.getTime).to.equal("function");
				expect(unwrapped.func.length).to.equal(2);
				expect(unwrapped.custom).to.equal(custom);
				expect(Observable.test(unwrapped.child)).not.to.be.true;
				expect(ObservableArray.test(unwrapped.a)).not.to.be.true;
				expect(typeof unwrapped.a[2].getTime).to.equal("function");
				expect(unwrapped.a[3].length).to.equal(2);
				expect(unwrapped.a[4]).to.equal(custom);
				expect(Observable.test(unwrapped.a[5])).not.to.be.true;
			});
			it("Round-trip", function () {
				var roundTripped = wrapper.unwrap(wrapper.wrap(o));
				expect(roundTripped).to.deep.equal(o);
				expect(Observable.test(roundTripped)).not.to.be.true;
				expect(typeof roundTripped.date.getTime).to.equal("function");
				expect(roundTripped.func.length).to.equal(2);
				expect(roundTripped.custom).to.equal(custom);
				expect(Observable.test(roundTripped.child)).not.to.be.true;
				expect(ObservableArray.test(roundTripped.a)).not.to.be.true;
				expect(typeof roundTripped.a[2].getTime).to.equal("function");
				expect(roundTripped.a[3].length).to.equal(2);
				expect(roundTripped.a[4]).to.equal(custom);
				expect(Observable.test(roundTripped.a[5])).not.to.be.true;
			});
			it("Round-trip with computed properties", function () {
				var roundTripped = wrapper.unwrap(wrapper.wrap(withComputed));
				expect(roundTripped).to.deep.equal(withComputed);
				expect(Observable.test(roundTripped)).not.to.be.true;
				expect(typeof roundTripped.date.getTime).to.equal("function");
				expect(roundTripped.func.length).to.equal(2);
				expect(roundTripped.custom).to.equal(custom);
				expect(Observable.test(roundTripped.child)).not.to.be.true;
				expect(ObservableArray.test(roundTripped.a)).not.to.be.true;
				expect(typeof roundTripped.a[2].getTime).to.equal("function");
				expect(roundTripped.a[3].length).to.equal(2);
				expect(roundTripped.a[4]).to.equal(custom);
				expect(Observable.test(roundTripped.a[5])).not.to.be.true;
			});
			it("Computed property", function () {
				var changeCount = 0,
					dfd = this.async(1000),
					o = wrapper.wrap({
						first: "John",
						last: "Doe",
						name: wrapper.computed(function (first, last) {
							return first + " " + last;
						}, "first", "last"),
						nameLength: wrapper.computed(function (name) {
							return name.length;
						}, "name")
					});
				new ObservablePath(o, "name").observe(dfd.rejectOnError(function (name, oldName) {
					expect(name).to.equal("Ben Doe");
					expect(oldName).to.equal("John Doe");
					if (++changeCount >= 2) {
						dfd.resolve(1);
					}
				}));
				new ObservablePath(o, "nameLength").observe(dfd.rejectOnError(function (length, oldLength) {
					expect(length).to.equal(7);
					expect(oldLength).to.equal(8);
					if (++changeCount >= 2) {
						dfd.resolve(1);
					}
				}));
				o.set("first", "Ben");
			});
			it("Computed array", function () {
				var dfd = this.async(1000),
					o = wrapper.wrap({
						items: [
							{Name: "Anne Ackerman"},
							{Name: "Ben Beckham"},
							{Name: "Chad Chapman"},
							{Name: "Irene Ira"}
						],
						totalNameLength: wrapper.computedArray(function (a) {
							return a.reduce(function (length, entry) {
								return length + entry.Name.length;
							}, 0);
						}, "items")
					});
				new ObservablePath(o, "totalNameLength").observe(dfd.callback(function (length, oldLength) {
					expect(length).to.equal(57);
					expect(oldLength).to.equal(45);
				}));
				o.items.push({Name: "John Jacklin"});
			});
		});
	}
});
