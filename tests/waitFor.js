define(["dojo/Deferred"], function (Deferred) {
	var EMPTY_OBJECT = {},
		waitFor = function (test, interval, timeout) {
			var dfd = new Deferred();
			if (typeof this === "function"
				|| typeof (this || EMPTY_OBJECT).toPrecision === "function"
				|| typeof (this || EMPTY_OBJECT).then === "function") {
				// waitFor.bind(test, interval, timeout)
				timeout = interval;
				interval = test;
				test = this;
			}
			interval = interval || 100;
			function waitForImpl() {
				try {
					var result = typeof test === "function" ? test() : test;
					if (typeof (result || EMPTY_OBJECT).then === "function") {
						// Promise with timeout
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
			function timeoutWaiting() {
				if (!dfd.isFulfilled()) {
					var message
						= "Timeout (" + timeout + ") happened while waiting for a condition" + (typeof test === "function" ? ": " + test : ".");
					dfd.reject(new Error(message));
				}
			}
			if (typeof test === "number") {
				setTimeout(dfd.resolve.bind(dfd), test);
			} else {
				setTimeout(waitForImpl, 0);
				setTimeout(timeoutWaiting, timeout = timeout || 5000);
			}
			return dfd.promise;
		};
	return waitFor;
});
