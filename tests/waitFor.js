define(["dojo/Deferred"], function (Deferred) {
	var EMPTY_OBJECT = {},
		waitFor = function (test, interval, timeout) {
			var dfd = new Deferred();
			interval = interval || 100;
			function waitForImpl() {
				try {
					var result = typeof test === "function" ? test() : test;
					if (typeof (result || EMPTY_OBJECT).then === "function") {
						result.then(dfd.resolve.bind(dfd), dfd.reject.bind(dfd));
					} else if (result) {
						dfd.resolve(result);
					} else if (!dfd.isFulfilled()) {
						setTimeout(waitForImpl, interval);
					}
				} catch (e) {
					dfd.reject(e);
				}
			}
			setTimeout(waitForImpl, 0);
			setTimeout(function () {
				if (!dfd.isFulfilled()) {
					dfd.reject(new Error("Timeout (" + timeout + ") happened while waiting for a condition."));
				}
			}, timeout = timeout || 5000);
			return dfd.promise;
		};
	waitFor.time = function (duration) {
		var dfd = new Deferred();
		setTimeout(dfd.resolve.bind(dfd), duration || 0);
		return dfd.promise;
	};
	return waitFor;
});
