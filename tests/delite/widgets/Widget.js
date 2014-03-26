define([
	"intern!bdd",
	"intern/chai!expect",
	"delite/register",
	"liaison/wrapper",
	"liaison/ObservablePath",
	"liaison/delite/widgets/Widget"
], function (bdd, expect, register, wrapper, ObservablePath, Widget) {
	/* jshint withstmt: true */
	/* global describe, afterEach, it */
	with (bdd) {
		describe("Test liaison/delite/widgets/Widget", function () {
			var handles = [];
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					handle.remove();
				}
			});
			it("Changed watcher", function () {
				var changeCount = 0,
					dfd = this.async(10000);
				register("liaison-test-basic-data", [HTMLElement, Widget], Widget.wrap({
					first: "John",
					last: "Doe",
					firstChanged: dfd.rejectOnError(function (first, oldFirst) {
						expect(first).to.equal("Anne");
						expect(oldFirst).to.equal("John");
						if (++changeCount >= 2) {
							dfd.resolve(1);
						}
					}),
					lastChanged: dfd.rejectOnError(function (last, oldLast) {
						expect(last).to.equal("Ackerman");
						expect(oldLast).to.equal("Doe");
						if (++changeCount >= 2) {
							dfd.resolve(1);
						}
					})
				}));
				var elem = register.createElement("liaison-test-basic-data");
				elem.first = "Anne";
				elem.last = "Ackerman";
			});
			it("Computed property", function () {
				register("liaison-test-computed", [HTMLElement, Widget], Widget.wrap({
					baseClass: "liaison-test-computed",
					first: "John",
					last: "Doe",
					name: wrapper.computed(function (first, last) {
						return first + " " + last;
					}, "first", "last")
				}));
				var changeCount = 0,
					dfd = this.async(10000),
					elem = register.createElement("liaison-test-computed");
				handles.push({
					remove: function () {
						elem.destroy();
					}
				});
				handles.push(new ObservablePath(elem, "name").observe(dfd.rejectOnError(function (name, oldName) {
					expect(name).to.equal("Ben Doe");
					expect(oldName).to.equal("John Doe");
					if (++changeCount >= 2) {
						dfd.resolve(1);
					}
				})));
				handles.push(new ObservablePath(elem, "name.length").observe(dfd.rejectOnError(function (nameLength, oldNameLength) {
					expect(nameLength).to.equal(7);
					expect(oldNameLength).to.equal(8);
					if (++changeCount >= 2) {
						dfd.resolve(1);
					}
				})));
				elem.first = "Ben";
			});
			it("Computed array", function () {
				var dfd = this.async(10000);
				register("liaison-test-computedarray", [HTMLElement, Widget], Widget.wrap({
					baseClass: "liaison-test-computedarray",
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
					}, "items"),
					totalNameLengthChanged: dfd.callback(function (length, oldLength) {
						expect(length).to.equal(57);
						expect(oldLength).to.equal(45);
					})
				}));
				var elem = register.createElement("liaison-test-computedarray");
				handles.push({
					remove: function () {
						elem.destroy();
					}
				});
				elem.items.push({Name: "John Jacklin"});
			});
		});
	}
});
