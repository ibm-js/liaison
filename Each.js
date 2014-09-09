/** @module liaison/Each */
define([
	"decor/Observable",
	"./ObservableArray",
	"./BindingSource",
	"./ObservablePath",
	"./BindingSourceList"
], function (Observable, ObservableArray, BindingSource, ObservablePath, BindingSourceList) {
	"use strict";

	var EMPTY_OBJECT = {},
		EMPTY_ARRAY = [];

	/**
	 * A {@link module:liaison/BindingSource BindingSource} to observe changes in array elements.
	 * @class module:liaison/Each
	 * @augments module:liaison/BindingSource
	 * @param {Array.<BindingSource>} sources The list of {@link module:liaison/BindingSource BindingSource},
	 *     having {@link module:liaison/ObservableArray ObservableArray} as its value,
	 *     to observe changes in each elements of.
	 *     This parameter can optionally be a list of {@link module:liaison/ObservableArray ObservableArray} instances.
	 * @param {Array.<Array.<string>>} [paths]
	 *     The list of paths from each array entries, corresponding to sources, to observe for changes.
	 * @param {Function} [formatter]
	 *     A function that converts the value from source
	 *     before being sent to {@link BindingSource#observe observe()} callback
	 *     or {@link BindingSource#getFrom getFrom()}’s return value.
	 * @param {Function} [parser]
	 *     A function that converts the value in {@link BindingSource#setTo setTo()}
	 *     before being sent to source.
	 */
	function Each(sources, paths, formatter, parser) {
		this.sources = sources;
		if (typeof paths !== "function") {
			this.paths = paths;
			this.formatter = formatter;
			this.parser = parser;
		} else {
			this.formatter = paths;
			this.parser = formatter;
		}
	}

	Each.prototype = Object.create(BindingSource);

	Each.Observer = function (sources, paths) {
		if (!Array.isArray(paths = paths !== undefined ? paths : EMPTY_ARRAY)) {
			throw new TypeError("Paths in Each must be an array of paths corresponding to each sources. We instead got: " + paths);
		}
		return new BindingSourceList.Observer(sources.map(function (source, i) {
			return new Each.SubObserver(source, paths[i]);
		}));
	};

	Each.SubObserver = function (source, paths) {
		this.source = source;
		this.paths = paths;
		this.remove = this.close;
	};

	Each.SubObserver.prototype = {
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
				var observer = new BindingSourceList.Observer(this.paths.map(function (path) {
					return new ObservablePath.Observer(entry, path);
				}, this));
				observer.open(invokeCallback, this);
				return observer;
			}
			function syncEntryObservers(splices) {
				splices
					.reduce(insertSplice, []) // Sort splices to get added entries from splice record
					.forEach(function (splice) {
						var args = this.a.slice(splice.index, splice.index + splice.addedCount).map(createObserver, this);
						args.unshift(splice.index, splice.removed.length);
						EMPTY_ARRAY.splice.apply(this.hEntries, args).forEach(Function.prototype.call, BindingSourceList.Observer.prototype.close);
					}, this);
			}
			function handleSplices(splices) {
				if (!this.splicesBeingDiscarded) {
					this.hEntries && syncEntryObservers.call(this, splices);
					invokeCallback.call(this);
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
				}
				if (this.paths !== undefined && Array.isArray(this.a)) {
					if (!Array.isArray(this.paths)) {
						throw new TypeError("Paths in Each must be an array of paths corresponding to each sources. We instead got: " + this.paths);
					}
					this.hEntries = this.hEntries || [];
					syncEntryObservers.call(this, [{index: 0, removed: EMPTY_ARRAY, addedCount: this.a.length}]);
				}
				this.opened && invokeCallback.call(this);
			}
			function invokeCallback() {
				if (!this.beingDiscarded && !this.deliveringRest && !this.closed) {
					var oldValue = this.value;
					this.deliveringRest = true;
					this.deliver();
					this.deliveringRest = false;
					this.value = Array.isArray(this.a) ? this.a.slice() : this.a;
					this.callback(this.value, oldValue);
				}
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
			this.source.deliver();
			this.ha && this.ha.deliver();
			this.hEntries && this.hEntries.forEach(Function.prototype.call, BindingSourceList.Observer.prototype.deliver);
		},

		discardChanges: function () {
			this.beingDiscarded = true;
			this.source.deliver();
			this.ha && this.ha.deliver();
			this.hEntries && this.hEntries.forEach(Function.prototype.call, BindingSourceList.Observer.prototype.discardChanges);
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
				if (!Array.isArray(this.sources)) {
					throw new TypeError("Sources in Each must be an array. We instead got: " + this.sources);
				}
				this.observer = new Each.Observer(this.sources.map(function (source) {
					return typeof (source || EMPTY_OBJECT).deliver === "function" ? source :
						new ObservablePath.Observer(new Observable({a: source}), "a");
				}), this.paths);
			}
			return this.observer;
		};
	})();

	return Each;
});
