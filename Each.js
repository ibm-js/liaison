/**
 * @module liaison/Each
 */
(function (root, factory) {
	// Module definition to support AMD, node.js and browser globals
	if (typeof exports === "object") {
		module.exports = factory(require("./Observable"), require("./ObservableArray"));
	} else if (typeof define === "function" && define.amd) {
		define(["./Observable", "./ObservableArray"], factory);
	} else {
		root.Each = factory(root.Observable, root.ObservableArray);
	}
})(this, function (Observable, ObservableArray) {
	"use strict";

	/* global ArrayObserver */

	var EMPTY_OBJECT = {};

	/**
	 * A {@link BindingSource} to observe changes in array elements.
	 * @class module:liaison/Each
	 * @augments BindingSource
	 * @param {BindingSource} source The {@link BindingSource},
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
		if (typeof (source || EMPTY_OBJECT).observe === "function") {
			this.a = (this.source = source).getFrom();
		} else if (typeof (source || EMPTY_OBJECT).splice === "function") {
			this.a = source;
		}
		this.formatter = formatter;
		this.parser = parser;
		this.callbacks = [];
	}

	Each.prototype = /** @lends module:liaison/Each# */ {
		/**
		 * Observes a change in a path of {@link module:liaison/Observable Observable}.
		 * @method
		 * @param {BindingSource~ChangeCallback} callback The change callback.
		 * @returns {Handle} The handle to stop observing.
		 */
		observe: (function () {
			function observeSourceCallback(newValue) {
				/* jshint validthis: true */
				if (this.ha) {
					this.ha.remove();
					this.ha = null;
				}
				this.a = newValue;
				observeArrayCallback.call(this);
				if (ObservableArray.canObserve(newValue)) {
					var boundCallback = observeArrayCallback.bind(this);
					if (typeof ArrayObserver !== "undefined") {
						this.ha = Object.create(new ArrayObserver(newValue));
						this.ha.open(boundCallback);
						this.ha.remove = this.ha.close;
					} else {
						this.ha = Object.create(ObservableArray.observe(newValue, boundCallback));
						this.ha.deliver = Observable.deliverChangeRecords.bind(Observable, boundCallback);
					}
				} else {
					console.warn("The array from data source is not an instance of ObservableArray."
						+ " Observation not happening.");
				}
			}
			function discardChangeRecordsFromCallback(callback) {
				/* jshint validthis: true */
				this.discardChangeRecords = true;
				Observable.deliverChangeRecords(callback);
				this.discardChangeRecords = false;
			}
			function observeArrayCallback() {
				/* jshint validthis: true */
				if (!this.discardChangeRecords) {
					var newValue = this.getFrom();
					for (var callbacks = this.callbacks.slice(), i = 0, l = callbacks.length; i < l; ++i) {
						try {
							callbacks[i].call(this, newValue, this.oldValue);
						} catch (e) {
							console.error("Error occured in Each callback: " + (e.stack || e));
						}
					}
					this.oldValue = newValue;
				}
			}
			function remove(callback) {
				for (var index; (index = this.callbacks.indexOf(callback)) >= 0;) {
					this.callbacks.splice(index, 1);
				}
				if (this.callbacks.length === 0) {
					if (this.ha) {
						this.ha.remove();
						this.ha = null;
					}
					if (this.hSource) {
						this.hSource.remove();
						this.hSource = null;
					}
				}
			}
			return function (callback) {
				if (this.removed) {
					console.warn("Trying to start observing Each that has been removed already.");
				} else {
					var callbacks = this.callbacks;
					callbacks.push(callback);
					if (this.source && !this.hSource) {
						this.hSource = this.source.observe(observeSourceCallback.bind(this));
					}
					if (ObservableArray.canObserve(this.a)) {
						if (!this.ha) {
							var boundCallback = observeArrayCallback.bind(this);
							if (typeof ArrayObserver !== "undefined") {
								this.ha = Object.create(new ArrayObserver(this.a));
								this.ha.open(boundCallback);
								this.oldValue = this.ha.value;
							} else {
								this.ha = Object.create(ObservableArray.observe(this.a, boundCallback));
								this.ha.deliver = Observable.deliverChangeRecords.bind(Observable, boundCallback);
								this.ha.discardChanges = discardChangeRecordsFromCallback.bind(this, boundCallback);
								this.oldValue = this.getFrom();
							}
						}
					} else {
						console.warn(
							"The array from data source is not an instance of ObservableArray."
							+ " Observation not happening.");
					}
					return {
						remove: remove.bind(this, callback)
					};
				}
			};
		})(),

		/**
		 * Makes the given callback the only change callback.
		 * @param {function} callback The change callback.
		 * @param {Object} thisObject The object that should works as "this" object for callback.
		 * @returns The current value of this {@link module:liaison/Each Each}.
		 */
		open: function (callback, thisObject) {
			this.callbacks.splice(0, this.callbacks.length);
			this.observe(callback.bind(thisObject));
			return this.getFrom();
		},

		/**
		 * Synchronously delivers pending change records.
		 */
		deliver: function () {
			if (this.source) {
				this.source.deliver();
			}
			if (this.ha) {
				this.ha.deliver();
			}
		},

		/**
		 * Discards pending change records.
		 * @returns The current value of this {@link module:liaison/Each Each}.
		 */
		discardChanges: function () {
			if (this.source) {
				this.source.discardChanges();
			}
			if (this.ha) {
				this.ha.discardChanges();
			}
			return this.getFrom();
		},

		/**
		 * @returns The current value of {@link module:liaison/Each Each}.
		 */
		getFrom: function () {
			return this.formatter(this.source ? this.source.getFrom() : this.a);
		},

		/**
		 * Sets a value to {@link module:liaison/Each Each}.
		 * @param value The value to set.
		 */
		setTo: function (value) {
			var a = this.parser(value);
			this.source ? this.source.setTo(a) : (this.a = a);
		},

		/**
		 * Stops all observations.
		 */
		remove: function () {
			if (this.ha) {
				this.ha.remove();
				this.ha = null;
			}
			if (this.hSource) {
				this.hSource.remove();
				this.hSource = null;
			}
			this.callbacks.splice(0, this.callbacks.length);
			this.removed = true;
		}
	};

	/**
	 * A synonym for {@link module:liaison/Each#setTo setTo() method}.
	 * @method module:liaison/Each#setValue
	 */
	Each.prototype.setValue = Each.prototype.setTo;

	/**
	 * A synonym for {@link module:liaison/Each#remove remove() method}.
	 * @method module:liaison/Each#close
	 */
	Each.prototype.close = Each.prototype.remove;

	return Each;
});
