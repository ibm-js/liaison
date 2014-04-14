/** @module liaison/BindingSourceList */
(function (root, factory) {
	// Module definition to support AMD, node.js and browser globals
	if (typeof exports === "object") {
		module.exports = factory(require("./schedule"), require("./BindingSource"));
	} else if (typeof define === "function" && define.amd) {
		define(["./schedule", "./BindingSource"], factory);
	} else {
		root.BindingSourceList = factory(root.schedule, root.BindingSource);
	}
})(this, function (schedule, BindingSource) {
	"use strict";

	/**
	 * A list of {@link module:liaison/BindingSource BindingSource}.
	 * @class module:liaison/BindingSourceList
	 * @augments module:liaison/BindingSource
	 * @param {Array.<BindingSource>} sources The list of {@link module:liaison/BindingSource BindingSource}.
	 * @param {Function} [formatter]
	 *     A function that converts the value from source
	 *     before being sent to {@link BindingSource#observe observe()} callback
	 *     or {@link BindingSource#getFrom getFrom()}’s return value.
	 * @param {Function} [parser]
	 *     A function that converts the value in {@link BindingSource#setTo setTo()}
	 *     before being sent to source.
	 */
	function BindingSourceList(sources, formatter, parser) {
		this.sources = sources;
		this.formatter = formatter;
		this.parser = parser;
	}

	BindingSourceList.prototype = Object.create(BindingSource);

	BindingSourceList.Observer = function (sources) {
		this.sources = sources;
		this.remove = this.close;
	};

	BindingSourceList.Observer.prototype = {
		open: (function () {
			function miniBindingSourceListCallback(callback, changeIndex, newValue) {
				var newValues = [],
					oldValues = this.values.slice();
				for (var i = 0, l = this.sources.length; i < l; ++i) {
					newValues[i] = i === changeIndex ? (this.values[i] = newValue) : this.values[i];
				}
				if (this.beingDelivered) {
					this.hCallback && this.hCallback.remove();
					invokeCallback.call(this, callback, oldValues);
				} else if (!this.hCallback) {
					this.hCallback = schedule(invokeCallback.bind(this, callback, oldValues));
				}
			}
			function invokeCallback(callback, oldValues) {
				callback(this.values, oldValues);
				this.hCallback = null;
			}
			return function (callback, thisObject) {
				var i, l = this.sources.length;
				this.values = [];
				this.handles = [];
				for (i = 0; i < l; ++i) {
					if (typeof this.sources[i].observe === "function") {
						this.values[i] = this.sources[i].getFrom();
						this.handles[i] = this.sources[i].observe(miniBindingSourceListCallback.bind(this, callback.bind(thisObject), i));
					} else if (typeof this.sources[i].open === "function") {
						this.handles[i] = this.sources[i];
						this.values[i] = this.sources[i].open(miniBindingSourceListCallback.bind(this, callback.bind(thisObject), i));
					} else {
						throw new Error("Cannot observe source: " + this.sources[i] + " at index: " + i);
					}
				}
				this.opened = true;
				return this.values;
			};
		})(),

		deliver: function () {
			this.beingDelivered = true;
			for (var i = 0, l = this.sources.length; i < l; ++i) {
				this.sources[i].deliver();
			}
			this.beingDelivered = false;
		},

		discardChanges: function () {
			var values = [];
			for (var i = 0, l = this.sources.length; i < l; ++i) {
				values[i] = this.sources[i].discardChanges();
			}
			return values;
		},

		setValue: function (value) {
			for (var i = 0, l = this.sources.length; i < l; ++i) {
				this.sources[i].setValue(value[i]);
			}
		},

		close: function () {
			if (this.handles) {
				for (var h; (h = this.handles.shift());) {
					typeof h.remove === "function" ? h.remove() : h.close();
				}
			}
			this.closed = true;
		}
	};

	BindingSourceList.prototype._ensureObserver = function () {
		if (!this.observer) {
			this.observer = new BindingSourceList.Observer(this.sources);
		}
		return this.observer;
	};

	return BindingSourceList;
});
