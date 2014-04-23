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

	/* global PathObserver */
	var EMPTY_OBJECT = {},
		EMPTY_ARRAY = [],
		Observer = typeof PathObserver === "undefined" ? ObservablePath.Observer : PathObserver;

	/**
	 * A {@link module:liaison/BindingSource BindingSource} to observe changes in array elements.
	 * @class module:liaison/Each
	 * @augments module:liaison/BindingSource
	 * @param {BindingSource} source The {@link module:liaison/BindingSource BindingSource},
	 *     having {@link module:liaison/ObservableArray ObservableArray} as its value,
	 *     to observe changes in each elements of.
	 *     This parameter can optionally be an {@link module:liaison/ObservableArray ObservableArray} instance.
	 * @param {string} [path]
	 *     The path from each array entries to observe for changes.
	 * @param {Function} [formatter]
	 *     A function that converts the value from source
	 *     before being sent to {@link BindingSource#observe observe()} callback
	 *     or {@link BindingSource#getFrom getFrom()}’s return value.
	 * @param {Function} [parser]
	 *     A function that converts the value in {@link BindingSource#setTo setTo()}
	 *     before being sent to source.
	 */
	function Each(source, path, formatter, parser) {
		this.source = source;
		this.path = path;
		this.formatter = formatter;
		this.parser = parser;
	}

	Each.prototype = Object.create(BindingSource);

	Each.Observer = function (source, path) {
		this.source = source;
		this.path = path;
		this.remove = this.close;
	};

	Each.Observer.prototype = {
		open: (function () {
			function insertSplice(splices, splice) {
				var insertIndex = -1,
					insertAdjustment = 0;
				splices.forEach(function (current, i) {
					if (insertIndex < 0 && splice.index < current.index) {
						insertIndex = i;
						insertAdjustment += splice.addedCount - splice.removed.length;
					}
					current.index += insertAdjustment;
				});
				splices.splice(insertIndex >= 0 ? insertIndex : splices.length, 0, {
					index: splice.index,
					removed: splice.removed.slice(),
					addedCount: splice.addedCount
				}); // Change record may be frozen
				return splices;
			}
			function createObserver(entry) {
				var observer = new Observer(entry, this.path);
				observer.open(setupCallback, this);
				return observer;
			}
			function syncEntryObservers(splices) {
				splices
					.reduce(insertSplice, []) // Sort splices to get added entries from splice record
					.forEach(function (splice) {
						var args = this.a.slice(splice.index, splice.index + splice.addedCount).map(createObserver, this);
						args.unshift(splice.index, splice.removed.length);
						EMPTY_ARRAY.splice.apply(this.hEntries, args).forEach(Function.prototype.call, Observer.prototype.close);
					}, this);
			}
			function handleSplices(splices) {
				if (!this.splicesBeingDiscarded) {
					this.hEntries && syncEntryObservers.call(this, splices);
					setupCallback.call(this);
				}
			}
			function observeSourceCallback(newValue) {
				/* global ArrayObserver */
				if (this.ha) {
					this.splicesBeingDiscarded = true;
					this.ha.deliver();
					this.splicesBeingDiscarded = false;
					this.ha.remove();
					this.ha = null;
				}
				this.hEntries && syncEntryObservers.call(this, [{index: 0, removed: this.hEntries, addedCount: 0}]);
				this.a = newValue;
				if (typeof ArrayObserver !== "undefined" && Array.isArray(newValue)) {
					this.ha = Object.create(new ArrayObserver(newValue));
					this.ha.open(handleSplices, this);
					this.ha.remove = this.ha.close;
				} else if (ObservableArray.canObserve(newValue)) {
					this.ha = Object.create(ObservableArray.observe(newValue, handleSplices.bind(this)));
				} else {
					console.warn("The array from data source is not an instance of ObservableArray. Observation not happening.");
				}
				if (this.path && Array.isArray(this.a)) {
					this.hEntries = this.hEntries || [];
					syncEntryObservers.call(this, [{index: 0, removed: EMPTY_ARRAY, addedCount: this.a.length}]);
				}
				this.opened && setupCallback.call(this);
			}
			function setupCallback() {
				if (!this.beingDiscarded && !this.closed) {
					var oldValue = this.value;
					this.value = Array.isArray(this.a) ? this.a.slice() : this.a;
					if (this.beingDelivered) {
						this.hCallback && this.hCallback.remove();
						invokeCallback.call(this, oldValue);
					} else if (!this.hCallback) {
						this.hCallback = schedule(invokeCallback.bind(this, oldValue));
					}
				}
			}
			function invokeCallback(oldValue) {
				this.callback(this.value, oldValue);
				this.hCallback = null;
			}
			return function (callback, thisObject) {
				var value = this.source.open(observeSourceCallback, this);
				this.callback = callback.bind(thisObject);
				observeSourceCallback.call(this, value);
				this.value = Array.isArray(value) ? value.slice() : value;
				this.opened = true;
				return value;
			};
		})(),

		deliver: function () {
			this.beingDelivered = true;
			this.source.deliver();
			this.ha && this.ha.deliver();
			this.hEntries && this.hEntries.forEach(Function.prototype.call, Observer.prototype.deliver);
			this.beingDelivered = false;
		},

		discardChanges: function () {
			this.beingDiscarded = true;
			this.source.deliver();
			this.ha && this.ha.deliver();
			this.hEntries && this.hEntries.forEach(Function.prototype.call, Observer.prototype.discardChanges);
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
		return function () {
			if (!this.observer) {
				var source = typeof (this.source || EMPTY_OBJECT).deliver === "function" ? this.source :
					new Observer(new Observable({a: this.source}), "a");
				this.observer = new Each.Observer(source, this.path);
			}
			return this.observer;
		};
	})();

	return Each;
});
