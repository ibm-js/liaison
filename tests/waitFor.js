define(function () {
	var waitFor = function (dfd, test, callback, interval, timeout) {
		var start = new Date();
		callback = dfd.rejectOnError(callback);
		interval = interval || 100;
		timeout = timeout || 10000;
		function waitForImpl() {
			try {
				if (test()) {
					callback();
				} else if (new Date() - start <= timeout) {
					setTimeout(waitForImpl, interval);
				} else {
					dfd.reject(new Error("Timeout (" + timeout + ") happened while waiting for a condition."));
				}
			} catch (e) {
				dfd.reject(e);
			}
		}
		waitForImpl();
	};
	return waitFor;
});
