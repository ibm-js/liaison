define([
	"intern!bdd",
	"intern/chai!expect",
	"../ObservablePath",
	"../computed",
	"../wrapper"
], function (bdd, expect, ObservablePath, computed, wrapper) {
	/* jshint withstmt: true */
	/* global describe, it, afterEach */
	with (bdd) {
		describe("Test liaison/computed", function () {
			var handles = [];
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					typeof handle.close === "function" ? handle.close() : handle.remove();
				}
			});
			it("Computed property", function () {
				var changeCount = 0,
					dfd = this.async(10000),
					o = wrapper.wrap({
						first: "John",
						last: "Doe",
						name: computed(function (first, last) {
							return first + " " + last;
						}, "first", "last"),
						nameLength: computed(function (name) {
							return name.length;
						}, "name")
					});
				handles.push.apply(handles, computed.apply(o));
				handles.push(new ObservablePath(o, "name").observe(dfd.rejectOnError(function (name, oldName) {
					expect(name).to.equal("Ben Doe");
					expect(oldName).to.equal("John Doe");
					if (++changeCount >= 2) {
						dfd.resolve(1);
					}
				})));
				handles.push(new ObservablePath(o, "nameLength").observe(dfd.rejectOnError(function (length, oldLength) {
					expect(length).to.equal(7);
					expect(oldLength).to.equal(8);
					if (++changeCount >= 2) {
						dfd.resolve(1);
					}
				})));
				o.set("first", "Ben");
			});
			it("Computed array", function () {
				var count = 0,
					dfd = this.async(10000),
					o = wrapper.wrap({
						items: [
							{Name: "Anne Ackerman"},
							{Name: "Ben Beckham"},
							{Name: "Chad Chapman"},
							{Name: "Irene Ira"}
						],
						totalNameLength: computed.array(function (a) {
							return a.reduce(function (length, entry) {
								return length + entry.Name.length;
							}, 0);
						}, "items", "Name")
					}),
					callbacks = [
						dfd.rejectOnError(function (length, oldLength) {
							expect(length).to.equal(57);
							expect(oldLength).to.equal(45);
							o.items[4].set("Name", "John Doe");
						}),
						dfd.callback(function (length, oldLength) {
							expect(length).to.equal(53);
							expect(oldLength).to.equal(57);
						})
					];
				handles.push.apply(handles, computed.apply(o));
				handles.push(new ObservablePath(o, "totalNameLength").observe(dfd.rejectOnError(function (newValue, oldValue) {
					callbacks[count++](newValue, oldValue);
				})));
				o.items.push(wrapper.wrap({Name: "John Jacklin"}));
			});
			it("Computed property in array", function () {
				var dfd = this.async(10000),
					a = wrapper.wrap([
						"foo",
						computed(function (foo) {
							return "*" + foo + "*";
						}, 0)
					]);
				handles.push.apply(handles, computed.apply(a));
				handles.push(new ObservablePath(a, 1).observe(dfd.callback(function (newValue, oldValue) {
					expect(newValue).to.equal("*bar*");
					expect(oldValue).to.equal("*foo*");
				})));
				expect(a[1]).to.equal("*foo*");
				a.set(0, "bar");
			});
			it("Cleaning up computed properties/arrays", function () {
				var dfd = this.async(10000),
					o = wrapper.wrap({
						first: "John",
						last: "Doe",
						items: [
							{Name: "Anne Ackerman"},
							{Name: "Ben Beckham"},
							{Name: "Chad Chapman"},
							{Name: "Irene Ira"}
						],
						name: computed(function (first, last) {
							return first + " " + last;
						}, "first", "last"),
						totalNameLength: computed.array(function (a) {
							return a.reduce(function (length, entry) {
								return length + entry.Name.length;
							}, 0);
						}, "items")
					}),
					applied = computed.apply(o);
				handles.push.apply(handles, applied);
				handles.push(new ObservablePath(o, "nameLength").observe(dfd.rejectOnError(function () {
					throw new Error("Observation callback shouldn't be called for removed computed property.");
				})));
				handles.push(new ObservablePath(o, "totalNameLength").observe(dfd.rejectOnError(function () {
					throw new Error("Observation callback shouldn't be called for removed computed array.");
				})));
				applied.forEach(function (h) {
					h.remove();
				});
				o.set("first", "Ben");
				o.items.push({Name: "John Jacklin"});
				setTimeout(dfd.callback(function () {}), 100);
			});
			it("Circular reference in an object tree", function () {
				var o = {
					bar: computed(function (foo) {
						return foo;
					}, "foo")
				};
				o.foo = o;
				computed.apply(o);
				// Pass the test if above line does not hit the maximum call stack length
			});
		});
	}
});
