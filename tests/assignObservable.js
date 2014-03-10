define([
	"intern!bdd",
	"intern/chai!expect",
	"../Observable",
	"../assignObservable"
], function (bdd, expect, Observable, assignObservable) {
	/* jshint withstmt: true */
	/* global describe, it, afterEach */
	with (bdd) {
		describe("Test liaison/assignObservable", function () {
			var handles = [];
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					typeof handle.close === "function" ? handle.close() : handle.remove();
				}
			});
			it("To Observable", function () {
				var dfd = this.async(1000),
					dst = new Observable(),
					src = {
						foo: "Foo",
						bar: "Bar"
					};
				handles.push(Observable.observe(dst, dfd.callback(function (records) {
					expect(records).to.deep.equal([
						{
							type: Observable.CHANGETYPE_ADD,
							object: dst,
							name: "foo"
						},
						{
							type: Observable.CHANGETYPE_ADD,
							object: dst,
							name: "bar"
						}
					]);
				})));
				assignObservable(dst, src);
				expect(dst).to.deep.equal(src);
			});
			it("To plain object", function () {
				var dst = {},
					src = {
						foo: "Foo",
						bar: "Bar"
					};
				assignObservable(dst, src);
				expect(dst).to.deep.equal(src);
			});
		});
	}
});
