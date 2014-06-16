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
			it("Scheduling another task in schedule callback", function () {
				var dfd = this.async(1000);
				handles.push(schedule(dfd.rejectOnError(function () {
					handles.push(schedule(dfd.callback(function () {})));
				})));
			});
			it("Scheduling same task in schedule callback", function () {
				var count = 0,
					dfd = this.async(1000),
					cb = dfd.rejectOnError(function () {
						if (count++ === 0) {
							handles.push(schedule(cb));
						} else {
							dfd.resolve(1);
						}
					});
				handles.push(schedule(cb));
			});
			it("Running same callback twice", function () {
				var count = 0,
					dfd = this.async(1000),
					cb = dfd.rejectOnError(function () {
						count++;
					});
				handles.push(schedule(cb));
				handles.push(schedule(cb));
				setTimeout(dfd.callback(function () {
					expect(count).to.equal(2);
				}), 100);
			});
		});
	}
});
