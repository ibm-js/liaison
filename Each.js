/**
 * @module liaison/Each
 */
(function (root, factory) {
	// Module definition to support AMD, node.js and browser globals
	if (typeof exports === "object") {
		module.exports = factory(require("./Observable"), require("./ObservableArray"), require("./BindingSource"), require("./ObservablePath"));
	} else if (typeof define === "function" && define.amd) {
		define(["./Observable", "./ObservableArray", "./BindingSource", "./ObservablePath"], factory);
	} else {
		root.Each = factory(root.Observable, root.ObservableArray, root.BindingSource, root.ObservablePath);
	}
})(this, function (Observable, ObservableArray, BindingSource, ObservablePath) {
	"use strict";

	/* global ArrayObserver */

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
		this.source = typeof (source || EMPTY_OBJECT).observe === "function" ? source : new ObservablePath(new Observable({a: source}), "a");
		this.formatter = formatter;
		this.parser = parser;
		this.observers = [];
	}

	Each.prototype = Object.create(BindingSource);

	/**
	 * Observes a change in a path of {@link module:liaison/Observable Observable}.
	 * @method module:liaison/Each#observe
	 * @param {module:liaison/BindingSource~ChangeCallback} callback The change callback.
	 * @returns {Handle} The handle to stop observing.
	 */
	Each.prototype.observe = function (callback) {
		if (this.removed) {
			console.warn("Trying to start observing Each that has been removed already.");
		} else {
			var observer = new MiniEach(this.source);
			observer.parent = this;
			this.observers.push(observer);
			observer.open(BindingSource.changeCallback.bind(this, callback));
			return observer;
		}
	};

	/**
	 * @method module:liaison/Each#getFrom
	 * @returns The current value of {@link module:liaison/Each Each}.
	 */
	Each.prototype.getFrom = function () {
		return this.boundFormatter(this.source.getFrom());
	};

	/**
	 * Sets a value to {@link module:liaison/Each Each}.
	 * @method module:liaison/Each#setTo
	 * @param value The value to set.
	 */
	Each.prototype.setTo = Each.prototype.setValue = function (value) {
		this.source.setTo(this.boundParser(value));
	};

	/**
	 * A synonym for {@link module:liaison/Each#setTo Each#setTo}.
	 * @method module:liaison/Each#setValue
	 */

	function MiniEach(source) {
		this.source = source;
		this.remove = this.close;
	}

	MiniEach.prototype = {
		open: (function () {
			function observeSourceCallback(boundObserveArrayCallback, newValue) {
				/* jshint validthis: true */
				if (this.ha) {
					this.ha.remove();
					this.ha = null;
				}
				this.a = newValue;
				this.opened && boundObserveArrayCallback();
				if (ObservableArray.canObserve(newValue)) {
					if (typeof ArrayObserver !== "undefined") {
						this.ha = Object.create(new ArrayObserver(newValue));
						this.ha.open(boundObserveArrayCallback);
						this.ha.remove = this.ha.close;
					} else {
						this.ha = Object.create(ObservableArray.observe(newValue, boundObserveArrayCallback));
						this.ha.discardChanges = discardChangeRecordsFromCallback.bind(this);
					}
				} else {
					console.warn("The array from data source is not an instance of ObservableArray. Observation not happening.");
				}
			}
			function observeArrayCallback(callback) {
				/* jshint validthis: true */
				if (!this.beingDiscarded && !this.closed) {
					var newValue = this.a;
					try {
						callback(newValue, this.oldValue);
					} catch (e) {
						console.error("Error occured in Each callback: " + (e.stack || e));
					}
					this.oldValue = Array.isArray(newValue) ? newValue.slice() : newValue;
				}
			}
			function discardChangeRecordsFromCallback() {
				/* jshint validthis: true */
				this.beingDiscarded = true;
				this.ha.deliver();
				this.beingDiscarded = false;
			}
			return function (callback, thisObject) {
				var boundObserveSourceCallback = observeSourceCallback.bind(this, observeArrayCallback.bind(this, callback.bind(thisObject)));
				this.hSource = this.source.observe(boundObserveSourceCallback);
				var value = this.source.getFrom();
				boundObserveSourceCallback(value);
				this.oldValue = Array.isArray(value) ? value.slice() : value;
				this.opened = true;
				return value;
			};
		})(),

		deliver: function () {
			this.hSource && this.hSource.deliver();
			this.ha && this.ha.deliver();
		},

		discardChanges: function () {
			this.beingDiscarded = true;
			this.hSource && this.hSource.deliver();
			this.ha && this.ha.deliver();
			this.beingDiscarded = false;
			return this.a;
		},

		setValue: function (value) {
			this.source.setTo(value);
		},

		close: function () {
			if (this.hSource) {
				this.hSource.remove();
				this.hSource = null;
			}
			if (this.ha) {
				this.ha.remove();
				this.ha = null;
			}
			if (this.parent) {
				for (var index; (index = this.parent.observers.indexOf(this)) >= 0;) {
					this.parent.observers.splice(index, 1);
				}
			}
			this.closed = true;
		}
	};

	return Each;
});
