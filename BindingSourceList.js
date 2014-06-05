/** @module liaison/BindingSourceList */
define(["./BindingSource"], function (BindingSource) {
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
			function miniBindingSourceListCallback(changeIndex, newValue, oldValue) {
				if (!this.deliveringRest) {
					this.oldValues = this.values.slice();
				}
				this.values[changeIndex] = newValue;
				this.oldValues[changeIndex] = oldValue;
				if (!this.deliveringRest) {
					this.deliveringRest = true;
					this.sources.forEach(function (source, i) {
						if (i !== changeIndex) {
							source.deliver();
						}
					});
					this.callback(this.values, this.oldValues);
					this.deliveringRest = false;
				}
			}
			return function (callback, thisObject) {
				this.callback = callback.bind(thisObject);
				this.values = [];
				this.handles = [];
				for (var i = 0, l = this.sources.length; i < l; ++i) {
					if (typeof this.sources[i].observe === "function") {
						this.values[i] = this.sources[i].getFrom();
						this.handles[i] = this.sources[i].observe(miniBindingSourceListCallback.bind(this, i));
					} else if (typeof this.sources[i].open === "function") {
						this.handles[i] = this.sources[i];
						this.values[i] = this.sources[i].open(miniBindingSourceListCallback.bind(this, i));
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
			this.sources.forEach(function (source) {
				source.deliver();
			});
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
