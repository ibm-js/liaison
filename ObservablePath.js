/** @module liaison/ObservablePath */
define([
	"decor/Observable",
	"./features",
	"./BindingSource"
], function (Observable, has, BindingSource) {
	"use strict";

	var EMPTY_OBJECT = {};

	function getPathComps(path, create) {
		return path === "" ? [] : typeof path.splice !== "function" ? path.split(".") : create ? path.slice() : path;
	}

	/**
	 * @method module:liaison/ObservablePath.getObjectPath
	 * @param {object} o An object.
	 * @param {string} path The path from object, either dot-concatenated string or an array.
	 * @returns The value of the object path.
	 */
	function getObjectPath(o, path) {
		for (var comps = getPathComps(path), i = 0, l = comps.length; i < l; ++i) {
			var comp = comps[i];
			o = o == null ? o : o[comp];
		}
		return o;
	}

	/**
	 * Sets a value to an object path.
	 * @method module:liaison/ObservablePath.setObjectPath
	 * @param {object} o An object.
	 * @param {string} path The path from object, either dot-concatenated string or an array.
	 * @returns The value set. Undefined if value cannot be set.
	 */
	function setObjectPath(o, path, value) {
		var comps = getPathComps(path, true),
			prop = comps.pop();
		o = comps.length > 0 ? getObjectPath(o, comps) : o;
		return Object(o) !== o || !path ? undefined : // Bail if the target is not an object
			typeof o.set === "function" ? o.set(prop, value) :
			(o[prop] = value);
	}

	/**
	 * A path of {@link module:decor/Observable Observable}.
	 * @class module:liaison/ObservablePath
	 * @augments module:liaison/BindingSource
	 * @param {Object} object The {@link module:decor/Observable Observable} to observe a property of.
	 * @param {string} [path] The object path under the given {@link module:decor/Observable Observable}.
	 * @param {Function} [formatter]
	 *     A function that converts the value from source
	 *     before being sent to {@link BindingSource#observe observe()} callback
	 *     or {@link BindingSource#getFrom getFrom()}’s return value.
	 * @param {Function} [parser]
	 *     A function that converts the value in {@link BindingSource#setTo setTo()}
	 *     before being sent to source.
	 */
	function ObservablePath(object, path, formatter, parser) {
		this.object = object;
		this.path = path;
		this.formatter = formatter;
		this.parser = parser;
	}

	ObservablePath.prototype = Object.create(BindingSource);

	/* global PathObserver */
	ObservablePath.Observer = has("polymer-pathobserver") ? PathObserver : function (o, path) {
		path = Array.isArray(path) ? path : path != null ? "" + path : [];
		var comps = getPathComps(path, true);
		this.o = o;
		this.prop = comps.shift();
		this.remainder = comps;
		this.remove = this.close;
	};

	if (!has("polymer-pathobserver")) {
		ObservablePath.Observer.prototype = {
			open: (function () {
				function miniObservablePathCallback(callback, records) {
					// Given this function works as a low-level one,
					// it preferes regular loop over array extras, which makes cyclomatic complexity higher.
					/* jshint maxcomplexity: 15 */
					if (!this.closed) {
						var found, newValue, oldValue;
						for (var i = 0, l = records.length; i < l; ++i) {
							if (records[i].name === this.prop) {
								found = true;
								oldValue = records[i].oldValue;
								newValue = this.o[this.prop];
								break;
							}
						}
						if (found) {
							var hasRemainder = this.remainder.length > 0;
							if (!Observable.is(newValue, oldValue)) {
								if (this.observerRemainder) {
									this.observerRemainder.remove();
									this.observerRemainder = null;
								}
								if (hasRemainder && Object(this.o[this.prop]) === this.o[this.prop]) {
									this.observerRemainder = new ObservablePath.Observer(this.o[this.prop], this.remainder);
									this.observerRemainder.open(callback);
								}
							}
							if (!this.beingDiscarded) {
								var oldPathValue = hasRemainder ? getObjectPath(oldValue, this.remainder) : oldValue,
									newPathValue = hasRemainder ? getObjectPath(newValue, this.remainder) : newValue;
								if (!Observable.is(oldPathValue, newPathValue)) {
									callback(newPathValue, oldPathValue);
								}
							}
						}
					}
				}
				return function (callback, thisObject) {
					if (Object(this.o) !== this.o) {
						console.warn("Non-object " + this.o + " is used with ObservablePath. Observation not happening.");
					} else {
						var boundCallback = miniObservablePathCallback.bind(this, callback = callback.bind(thisObject));
						this.hProp = Observable.observe(this.o, boundCallback);
						this.hProp.boundCallback = boundCallback;
						if (this.remainder.length > 0 && Object(this.o[this.prop]) === this.o[this.prop]) {
							(this.observerRemainder = new ObservablePath.Observer(this.o[this.prop], this.remainder)).open(callback);
						}
					}
					this.opened = true;
					return getObjectPath(this.prop ? (this.o || EMPTY_OBJECT)[this.prop] : this.o, this.remainder);
				};
			})(),

			deliver: function () {
				this.hProp && Observable.deliverChangeRecords(this.hProp.boundCallback);
				this.observerRemainder && this.observerRemainder.deliver();
			},

			discardChanges: function () {
				this.beingDiscarded = true;
				this.hProp && Observable.deliverChangeRecords(this.hProp.boundCallback);
				this.beingDiscarded = false;
				return this.observerRemainder ? this.observerRemainder.discardChanges() :
					getObjectPath(this.prop ? (this.o || EMPTY_OBJECT)[this.prop] : this.o, this.remainder);
			},

			setValue: function (value) {
				if (this.remainder.length > 0) {
					setObjectPath((this.o || EMPTY_OBJECT)[this.prop], this.remainder, value);
				} else if (typeof (this.o || EMPTY_OBJECT).set === "function" && this.prop) {
					this.o.set(this.prop, value);
				} else if (Object(this.o) === this.o && this.prop) { // Bail if the target is not an object
					this.o[this.prop] = value;
				}
			},

			close: function () {
				if (this.hProp) {
					this.hProp.remove();
					this.hProp = null;
				}
				if (this.observerRemainder) {
					this.observerRemainder.close();
					this.observerRemainder = null;
				}
				this.closed = true;
			}
		};
	}

	ObservablePath.prototype._ensureObserver = (function () {
		/* global PathObserver */
		return function () {
			if (!this.observer) {
				this.observer = new ObservablePath.Observer(this.object, this.path);
			}
			return this.observer;
		};
	})();

	ObservablePath.getObjectPath = getObjectPath;
	ObservablePath.setObjectPath = setObjectPath;

	return ObservablePath;
});
