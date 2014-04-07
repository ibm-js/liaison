define([
	"intern!bdd",
	"intern/chai!expect",
	"../../Observable",
	"../../ObservablePath",
	"../../BindingTarget"
], function (bdd, expect, Observable, ObservablePath, BindingTarget) {
	/* jshint withstmt: true */
	/* global describe, afterEach, it, PathObserver */
	with (bdd) {
		describe("Test liaison/BindingTarget", function () {
			var handles = [];
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					handle.remove();
				}
			});
			it("Object reflecting model", function () {
				var h,
					dfd = this.async(10000),
					o = {},
					observable = new Observable({foo: "Foo0"}),
					observer = new PathObserver(observable, "foo");
				handles.push(h = new BindingTarget(o, "Foo").bind(observer));
				expect(o.Foo).to.equal("Foo0");
				observable.set("foo", "Foo1");
				setTimeout(dfd.rejectOnError(function () {
					expect(o.Foo).to.equal("Foo1");
					h.remove();
					observable.set("foo", "Foo2");
					setTimeout(dfd.callback(function () {
						expect(o.Foo).to.equal("Foo1");
					}), 100);
				}), 100);
			});
		});
	}
});
