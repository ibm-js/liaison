/** @module liaison/BindingSourceList */
(function (root, factory) {
	// Module definition to support AMD, node.js and browser globals
	if (typeof exports === "object") {
		module.exports = factory(require("./BindingSource"));
	} else if (typeof define === "function" && define.amd) {
		define(["./BindingSource"], factory);
	} else {
		root.BindingSourceList = factory(root.BindingSource);
	}
})(this, function (BindingSource) {
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
		this.observers = [];
	}

	BindingSourceList.prototype = Object.create(BindingSource);

	/**
	 * Observes a change in a list of {@link module:liaison/BindingSource BindingSource}.
	 * @method module:liaison/BindingSourceList#observe
	 * @param {module:liaison/BindingSource~ChangeCallback} callback The change callback.
	 * @returns {Handle}
	 *     The handle to stop observing.
	 *     This handle also has deliver()/discardChanges() methods to deliver/discard change records just for this .observe() call.
	 */
	BindingSourceList.prototype.observe = function (callback) {
		if (this.removed) {
			console.warn("Trying to start observing BindingSourceList that has been removed already.");
		} else {
			var observer = new MiniBindingSourceList(this.sources);
			observer.parent = this;
			observer.open(BindingSource.changeCallback.bind(this, callback));
			this.observers.push(observer);
			return observer;
		}
	};

	// Not using getter here.
	// If we do so, the property defined won't be observable by Observable.observe() or Object.observe()
	// given this class is not the only thing changing the path values
	/**
	 * @method module:liaison/BindingSourceList#getFrom
	 * @returns The current value of {@link module:liaison/BindingSourceList BindingSourceList}.
	 */
	BindingSourceList.prototype.getFrom = function () {
		var a = [];
		for (var i = 0, l = this.sources.length; i < l; ++i) {
			a.push(this.sources[i].getFrom());
		}
		return this.boundFormatter ? this.boundFormatter(a) : a;
	};

	// Not using setter here.
	// If we do so, the property defined won't be observable by Observable.observe() or Object.observe()
	// given this class is not the only thing changing the path values
	/**
	 * Sets a value to {@link module:liaison/BindingSourceList BindingSourceList}.
	 * @method module:liaison/BindingSourceList#setTo
	 * @param a The value to set.
	 */
	BindingSourceList.prototype.setTo = BindingSourceList.prototype.setValue = function (a) {
		a = this.boundParser ? this.boundParser(a) : a;
		for (var i = 0, l = a.length; i < l; ++i) {
			this.sources[i].setTo(a[i]);
		}
	};

	/**
	 * A synonym for {@link module:liaison/BindingSourceList#setTo BindingSourceList#setTo}.
	 * @method module:liaison/BindingSourceList#setValue
	 */

	function MiniBindingSourceList(sources) {
		this.sources = sources;
		this.remove = this.close;
	}

	MiniBindingSourceList.prototype = {
		open: (function () {
			function miniBindingSourceListCallback(callback, changeIndex, newValue) {
				if (!this.closed) {
					var newValues = [],
						oldValues = this.values.slice();
					for (var i = 0, l = this.sources.length; i < l; ++i) {
						newValues[i] = this.sources[i].getFrom();
					}
					this.values[changeIndex] = newValue;
					callback(newValues, oldValues);
				}
			}
			return function (callback, thisObject) {
				var i, l = this.sources.length;
				this.values = [];
				this.handles = [];
				for (i = 0; i < l; ++i) {
					this.values[i] = this.sources[i].getFrom();
					this.handles[i] = this.sources[i].observe(miniBindingSourceListCallback.bind(this, callback.bind(thisObject), i));
				}
				this.opened = true;
				return this.values;
			};
		})(),

		deliver: function () {
			for (var i = 0, l = this.handles.length; i < l; ++i) {
				this.handles[i].deliver();
			}
		},

		discardChanges: function () {
			for (var i = 0, l = this.handles.length; i < l; ++i) {
				this.values[i] = this.handles[i].discardChanges();
			}
			return this.values;
		},

		setValue: function (value) {
			for (var i = 0, l = this.sources.length; i < l; ++i) {
				this.sources[i].setValue(value[i]);
			}
		},

		close: function () {
			for (var h; (h = this.handles.shift());) {
				h.remove();
			}
			if (this.parent) {
				for (var index; (index = this.parent.observers.indexOf(this)) >= 0;) {
					this.parent.observers.splice(index, 1);
				}
			}
			this.closed = true;
		}
	};

	return BindingSourceList;
});
