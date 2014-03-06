/** @module liaison/BindingSource */
(function (root, factory) {
	// Module definition to support AMD, node.js and browser globals
	if (typeof exports === "object") {
		module.exports = factory();
	} else if (typeof define === "function" && define.amd) {
		define(factory);
	} else {
		root.BindingSource = factory();
	}
})(this, function () {
	"use strict";

	function callConverter(converter, value) {
		/* jshint validthis: true */
		try {
			return converter.call(this, value);
		} catch (e) {
			console.error("Error occured in data converter callback: " + (e.stack || e));
			return value;
		}
	}

	/**
	 * An interface that abstracts various types of things that can be observed.
	 * {@link module:liaison/BindingSource BindingSource} points to something like object path,
	 * a list of {@link module:liaison/BindingSource BindingSource}, etc.
	 * @class module:liaison/BindingSource
	 * @augments Handle
	 * @abstract
	 */

	/**
	 * Observes change in {@link module:liaison/BindingSource BindingSource}.
	 * @method module:liaison/BindingSource#observe
	 * @abstract
	 * @param {module:liaison/BindingSource~ChangeCallback} callback The change callback.
	 * @returns {Handle} The handle to stop observing.
	 */

	/**
	 * @method module:liaison/BindingSource#getFrom
	 * @abstract
	 * @returns The current value of {@link module:liaison/BindingSource BindingSource}.
	 */

	/**
	 * Sets a value to {@link module:liaison/BindingSource BindingSource}.
	 * @method module:liaison/BindingSource#setTo
	 * @abstract
	 * @param value The value to set.
	 */

	/**
	 * A synonym for {@link BindingSource#setTo}.
	 * @method module:liaison/BindingSource#setValue
	 * @abstract
	 * @param value The value to set.
	 */

	var BindingSource = /** @lends module:liaison/BindingSource# */ {
		/**
		 * Makes the given callback the only change callback.
		 * @param {function} callback The change callback.
		 * @param {Object} thisObject The object that should works as "this" object for callback.
		 * @returns The current value of this {@link module:liaison/BindingSource BindingSource}.
		 */
		open: function (callback, thisObject) {
			for (var observer; (observer = this.observers.shift());) {
				observer.remove();
			}
			this.observe(callback.bind(thisObject));
			return this.getFrom();
		},

		/**
		 * Synchronously delivers pending change records.
		 */
		deliver: function () {
			for (var i = 0, l = this.observers.length; i < l; ++i) {
				this.observers[i].deliver();
			}
		},

		/**
		 * Discards pending change records.
		 * @returns The current value of this {@link module:liaison/BindingSource BindingSource}.
		 */
		discardChanges: function () {
			for (var i = 0, l = this.observers.length; i < l; ++i) {
				this.observers[i].discardChanges();
			}
			return this.getFrom();
		},

		get formatter() {
			return this._formatter;
		},

		set formatter(formatter) {
			this._formatter = formatter;
			if ((this._formatter = formatter)) {
				this.boundFormatter = callConverter.bind(this, formatter);
			}
		},

		get parser() {
			return this._parser;
		},

		set parser(parser) {
			this._parser = parser;
			if ((this._parser = parser)) {
				this.boundParser = callConverter.bind(this, parser);
			}
		},

		/**
		 * Stops all observations.
		 */
		remove: function () {
			for (var observer; (observer = this.observers.shift());) {
				observer.remove();
			}
			this.removed = true;
		},

		changeCallback: function (callback, newValue, oldValue) {
			try {
				callback(
					this.boundFormatter ? this.boundFormatter(newValue) : newValue,
					this.boundFormatter ? this.boundFormatter(oldValue) : oldValue);
			} catch (e) {
				console.error("Error occured in BindingSource callback: " + (e.stack || e));
			}
		}
	};

	/**
	 * A synonym for {@link module:liaison/BindingSource#remove remove() method}.
	 * @method module:liaison/BindingSource#close
	 */
	BindingSource.close = BindingSource.remove;

	/**
	 * Change callback.
	 * @callback module:liaison/BindingSource~ChangeCallback
	 * @param newValue The new value.
	 * @param [oldValue] The old value.
	 */

	return BindingSource;
});
