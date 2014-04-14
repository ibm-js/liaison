/**
 * @module liaison/Each
 */
(function (root, factory) {
	// Module definition to support AMD, node.js and browser globals
	if (typeof exports === "object") {
		module.exports = factory(require("./schedule"), require("./Observable"), require("./ObservableArray"),
			require("./BindingSource"), require("./ObservablePath"));
	} else if (typeof define === "function" && define.amd) {
		define(["./schedule", "./Observable", "./ObservableArray", "./BindingSource", "./ObservablePath"], factory);
	} else {
		root.Each = factory(root.schedule, root.Observable, root.ObservableArray, root.BindingSource, root.ObservablePath);
	}
})(this, function (schedule, Observable, ObservableArray, BindingSource, ObservablePath) {
	"use strict";

	var EMPTY_OBJECT = {};

	/**
	 * A {@link module:liaison/BindingSource BindingSource} to observe changes in array elements.
	 * @class module:liaison/Each
	 * @augments module:liaison/BindingSource
	 * @param {BindingSource} source The {@link module:liaison/BindingSource BindingSource},
	 *     having {@link module:liaison/ObservableArray ObservableArray} as its value,
	 *     to observe changes in each elements of.
	 *     This parameter can optionally be an {@link module:liaison/ObservableArray ObservableArray} instance.
	 * @param {Function} [formatter]
	 *     A function that converts the value from source
	 *     before being sent to {@link BindingSource#observe observe()} callback
	 *     or {@link BindingSource#getFrom getFrom()}’s return value.
	 * @param {Function} [parser]
	 *     A function that converts the value in {@link BindingSource#setTo setTo()}
	 *     before being sent to source.
	 */
	function Each(source, formatter, parser) {
		this.source = source;
		this.formatter = formatter;
		this.parser = parser;
	}

	Each.prototype = Object.create(BindingSource);

	Each.Observer = function (source) {
		this.source = source;
		this.remove = this.close;
	};

	Each.Observer.prototype = {
		open: (function () {
			function observeSourceCallback(boundObserveArrayCallback, newValue) {
				/* global ArrayObserver */
				/* jshint validthis: true */
				if (this.ha) {
					this.ha.remove();
					this.ha = null;
				}
				this.a = newValue;
				if (typeof ArrayObserver !== "undefined" && Array.isArray(newValue)) {
					this.ha = Object.create(new ArrayObserver(newValue));
					this.ha.open(boundObserveArrayCallback);
					this.ha.remove = this.ha.close;
				} else if (ObservableArray.canObserve(newValue)) {
					this.ha = Object.create(ObservableArray.observe(newValue, boundObserveArrayCallback));
				} else {
					console.warn("The array from data source is not an instance of ObservableArray. Observation not happening.");
				}
				this.opened && boundObserveArrayCallback();
			}
			function observeArrayCallback(callback) {
				/* jshint validthis: true */
				if (!this.beingDiscarded && !this.closed) {
					var oldValue = this.value;
					this.value = Array.isArray(this.a) ? this.a.slice() : this.a;
					if (this.beingDelivered) {
						this.hCallback && this.hCallback.remove();
						invokeCallback.call(this, callback, oldValue);
					} else if (!this.hCallback) {
						this.hCallback = schedule(invokeCallback.bind(this, callback, oldValue));
					}
				}
			}
			function invokeCallback(callback, oldValue) {
				callback(this.value, oldValue);
				this.hCallback = null;
			}
			return function (callback, thisObject) {
				var boundObserveSourceCallback = observeSourceCallback.bind(this, observeArrayCallback.bind(this, callback.bind(thisObject))),
					value = this.source.open(boundObserveSourceCallback);
				boundObserveSourceCallback(value);
				this.value = Array.isArray(value) ? value.slice() : value;
				this.opened = true;
				return value;
			};
		})(),

		deliver: function () {
			this.beingDelivered = true;
			this.source.deliver();
			this.ha && this.ha.deliver();
			this.beingDelivered = false;
		},

		discardChanges: function () {
			this.beingDiscarded = true;
			this.source.deliver();
			this.ha && this.ha.deliver();
			this.beingDiscarded = false;
			return this.a;
		},

		setValue: function (value) {
			this.source.setValue(value);
		},

		close: function () {
			this.source.close();
			if (this.ha) {
				this.ha.remove();
				this.ha = null;
			}
			this.closed = true;
		}
	};

	Each.prototype._ensureObserver = (function () {
		/* global PathObserver */
		var Observer = typeof PathObserver !== "undefined" ? PathObserver : ObservablePath.Observer;
		return function () {
			if (!this.observer) {
				var source = typeof (this.source || EMPTY_OBJECT).deliver === "function" ? this.source :
					new Observer(new Observable({a: this.source}), "a");
				this.observer = new Each.Observer(source);
			}
			return this.observer;
		};
	})();

	return Each;
});
