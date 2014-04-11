define([
	"intern!bdd",
	"intern/chai!expect",
	"../schedule"
], function (bdd, expect, schedule) {
	/* jshint withstmt: true */
	/* global describe, it, afterEach */
	with (bdd) {
		describe("Test liaison/schedule", function () {
			var handles = [];
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					typeof handle.close === "function" ? handle.close() : handle.remove();
				}
			});
			it("Schedule a task at end of microtask", function () {
				var endedMicrotask,
					dfd = this.async(1000),
					h = schedule(dfd.callback(function () {
						expect(endedMicrotask).to.be.true;
					}));
				handles.push(h);
				endedMicrotask = true;
			});
			it("Removing a scheduled task", function () {
				var dfd = this.async(1000),
					h = schedule(dfd.rejectOnError(function () {
						throw new Error("This task should never be executed.");
					}));
				handles.push(h);
				h.remove();
				setTimeout(dfd.callback(function () {}), 100);
			});
		});
	}
});
