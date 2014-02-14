/** @module liaison/BindingSourceList */
(function (root, factory) {
	// Module definition to support AMD, node.js and browser globals
	if (typeof exports === "object") {
		module.exports = factory();
	} else if (typeof define === "function" && define.amd) {
		define(factory);
	} else {
		root.BindingSourceList = factory();
	}
})(this, function () {
	"use strict";

	/**
	 * A list of {@link BindingSource}.
	 * @class
	 * @alias module:liaison/BindingSourceList
	 * @augments BindingSource
	 * @param {Array.<BindingSource>} sources The list of {@link BindingSource}.
	 * @param {Function} [formatter]
	 *     A function that converts the value from source
	 *     before being sent to {@link BindingSource#observe observe()} callback
	 *     or {@link BindingSource#getFrom getFrom()}’s return value.
	 * @param {Function} [parser]
	 *     A function that converts the value in {@link BindingSource#setTo setTo()}
	 *     before being sent to source.
	 */
	var BindingSourceList = (function () {
		function callConverter(converter, value) {
			/* jshint validthis: true */
			try {
				return converter.call(this, value);
			} catch (e) {
				console.error("Error occured in data converter callback: " + (e.stack || e));
				return value;
			}
		}
		return function (sources, formatter, parser) {
			this.sources = sources;
			this.boundFormatter = formatter && callConverter.bind(this, formatter);
			this.boundParser = parser && callConverter.bind(this, parser);
			this.rawOldValues = [];
			this.callbacks = [];
			for (var i = 0, l = sources.length; i < l; ++i) {
				this.rawOldValues.push(sources[i].getFrom());
			}
		};
	})();

	BindingSourceList.prototype = /** @lends module:liaison/BindingSourceList# */ {
		/**
		 * Observes a change in a list of {@link BindingSource}.
		 * @method
		 * @param {BindingSource~ChangeCallback} callback The change callback.
		 * @returns {Handle} The handle to stop observing.
		 */
		observe: (function () {
			function bindingSourceCallback(indexOf, newValue) {
				/* jshint validthis: true */
				var sources = this.sources,
					boundFormatter = this.boundFormatter,
					oldValues = boundFormatter ? boundFormatter(this.rawOldValues) : this.rawOldValues,
					newValues = this.getFrom();
				for (var callbacks = this.callbacks.slice(), i = 0, l = callbacks.length; i < l; ++i) {
					callbacks[i].call(sources, newValues, oldValues);
				}
				this.rawOldValues[indexOf] = newValue;
			}
			function remove(callback) {
				/* jshint validthis: true */
				var callbacks = this.callbacks;
				for (var i = callbacks.length - 1; i >= 0; --i) {
					if (callbacks[i] === callback) {
						callbacks.splice(i, 1);
					}
				}
				if (callbacks.length === 0 && this.handles) {
					for (var h = null; (h = this.handles.pop());) {
						h.remove();
					}
					delete this.handles;
				}
			}
			return function (callback) {
				if (this.removed) {
					console.warn("Trying to start observing BindingSourceList that has been removed already.");
				} else {
					this.callbacks.push(callback);
					if (!this.handles) {
						this.handles = [];
						for (var i = 0, l = this.sources.length; i < l; ++i) {
							this.handles.push(this.sources[i].observe(bindingSourceCallback.bind(this, i)));
						}
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
		 * @returns The current value of this {@link module:liaison/BindingSourceList BindingSourceList}.
		 */
		open: function (callback, thisObject) {
			this.callbacks.splice(0, this.callbacks.length);
			this.observe(callback.bind(thisObject));
			// Reset rawOldValues upon open()
			this.rawOldValues = [];
			for (var i = 0, l = this.sources.length; i < l; ++i) {
				this.rawOldValues.push(this.sources[i].getFrom());
			}
			return this.getFrom();
		},

		/**
		 * Synchronously delivers pending change records.
		 */
		deliver: function () {
			for (var i = 0, l = this.sources.length; i < l; ++i) {
				this.sources[i].deliver();
			}
		},

		/**
		 * Discards pending change records.
		 * @returns The current value of this {@link module:liaison/BindingSourceList BindingSourceList}.
		 */
		discardChanges: function () {
			for (var i = 0, l = this.sources.length; i < l; ++i) {
				this.sources[i].discardChanges();
			}
			return this.getFrom();
		},

		// Not using getter here.
		// If we do so, the property defined won't be observable by Observable.observe() or Object.observe()
		// given this class is not the only thing changing the path values
		/**
		 * @returns The current value of {@link module:liaison/BindingSourceList BindingSourceList}.
		 */
		getFrom: function () {
			var a = [];
			for (var i = 0, l = this.sources.length; i < l; ++i) {
				a.push(this.sources[i].getFrom());
			}
			return this.boundFormatter ? this.boundFormatter(a) : a;
		},

		// Not using setter here.
		// If we do so, the property defined won't be observable by Observable.observe() or Object.observe()
		// given this class is not the only thing changing the path values
		/**
		 * Sets a value to {@link module:liaison/BindingSourceList BindingSourceList}.
		 * @param a The value to set.
		 */
		setTo: function (a) {
			a = this.boundParser ? this.boundParser(a) : a;
			for (var i = 0, l = a.length; i < l; ++i) {
				this.sources[i].setTo(a[i]);
			}
		},

		/**
		 * Stops all observations.
		 */
		remove: function () {
			if (this.handles) {
				for (var h = null; (h = this.handles.shift());) {
					h.remove();
				}
			}
			this.callbacks.splice(0, this.callbacks.length);
			this.removed = true;
		}
	};

	/**
	 * A synonym for {@link module:liaison/BindingSourceList#setTo setTo() method}.
	 * @method module:liaison/BindingSourceList#setValue
	 */
	BindingSourceList.prototype.setValue = BindingSourceList.prototype.setTo;

	/**
	 * A synonym for {@link module:liaison/BindingSourceList#remove remove() method}.
	 * @method module:liaison/BindingSourceList#close
	 */
	BindingSourceList.prototype.close = BindingSourceList.prototype.remove;

	return BindingSourceList;
});
