/** @module liaison/ObservablePath */
(function (root, factory) {
	// Module definition to support AMD, node.js and browser globals
	if (typeof exports === "object") {
		module.exports = factory(require("./Observable"), require("./BindingSource"));
	} else if (typeof define === "function" && define.amd) {
		define(["./Observable", "./BindingSource"], factory);
	} else {
		root.ObservablePath = factory(root.Observable, root.BindingSource);
	}
})(this, function (Observable, BindingSource) {
	"use strict";

	var EMPTY_OBJECT = {};

	function getPathComps(path, create) {
		return path === "" ? [] : typeof path.splice !== "function" ? path.split(".") : create ? path.slice() : path;
	}

	function getObjectPath(o, path) {
		for (var comps = getPathComps(path), i = 0, l = comps.length; i < l; ++i) {
			var comp = comps[i];
			o = o == null ? o : o[comp];
		}
		return o;
	}

	function setObjectPath(o, path, value) {
		var comps = getPathComps(path, true),
			prop = comps.pop();
		o = comps.length > 0 ? getObjectPath(o, comps) : o;
		return o == null || !path ? undefined :
			typeof o.set === "function" ? o.set(prop, value) :
			(o[prop] = value);
	}

	/**
	 * A path of {@link module:liaison/Observable Observable}.
	 * @class module:liaison/ObservablePath
	 * @augments module:liaison/BindingSource
	 * @param {Object} object The {@link module:liaison/Observable Observable} to observe a property of.
	 * @param {string} [path] The object path under the given {@link module:liaison/Observable Observable}.
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
		this.path = Array.isArray(path) ? path : path + "";
		this.formatter = formatter;
		this.parser = parser;
		this.observers = [];
	}

	ObservablePath.prototype = Object.create(BindingSource);

	/**
	 * Observes a change in a path of {@link module:liaison/Observable Observable}.
	 * @method module:liaison/ObservablePath#observe
	 * @param {module:liaison/BindingSource~ChangeCallback} callback The change callback.
	 * @returns {Handle}
	 *     The handle to stop observing.
	 *     This handle also has deliver()/discardChanges() methods to deliver/discard change records just for this .observe() call.
	 */
	ObservablePath.prototype.observe = function (callback) {
		if (this.removed) {
			console.warn("Trying to start observing ObservablePath that has been removed already.");
		} else if (!this.object || typeof this.object !== "object") {
			console.warn("Non-object " + this.object + " is used with ObservablePath. Observation not happening.");
		} else {
			var observer = new MiniObservablePath(this.object, this.path);
			observer.parent = this;
			this.observers.push(observer);
			observer.open(BindingSource.changeCallback.bind(this, callback));
			return observer;
		}
	};

	// Not using getter here.
	// If we do so, the property defined won't be observable by Observable.observe() or Object.observe()
	// given this class is not the only thing changing the path value
	/**
	 * @method module:liaison/ObservablePath#getFrom
	 * @returns The current value of {@link module:liaison/ObservablePath ObservablePath}.
	 */
	ObservablePath.prototype.getFrom = function () {
		var value = getObjectPath(this.object, this.path);
		return this.boundFormatter ? this.boundFormatter(value) : value;
	};

	// Not using setter here.
	// If we do so, the property defined won't be observable by Observable.observe() or Object.observe()
	// given this class is not the only thing changing the path value
	/**
	 * Sets a value to {@link module:liaison/ObservablePath ObservablePath}.
	 * @method module:liaison/ObservablePath#setTo
	 * @param value The value to set.
	 */
	ObservablePath.prototype.setTo = ObservablePath.prototype.setValue = function (value) {
		setObjectPath(this.object, this.path, this.boundParser ? this.boundParser(value) : value);
	};

	/**
	 * A synonym for {@link module:liaison/ObservablePath#setTo ObservablePath#setTo}.
	 * @method module:liaison/ObservablePath#setValue
	 */

	function MiniObservablePath(o, path) {
		if (typeof PathObserver !== "undefined") {
			/* global PathObserver */
			var observer = new PathObserver(o, path);
			observer.remove = observer.close;
			return observer;
		} else {
			path = Array.isArray(path) ? path : "" + path;
			var comps = getPathComps(path, true);
			this.o = o;
			this.prop = comps.shift();
			this.remainder = comps;
			this.remove = this.close;
		}
	}

	MiniObservablePath.prototype = {
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
						if (!this.beingDiscarded) {
							var oldPathValue = hasRemainder ? getObjectPath(oldValue, this.remainder) : oldValue,
								newPathValue = hasRemainder ? getObjectPath(newValue, this.remainder) : newValue;
							if (oldPathValue !== newPathValue) {
								callback(newPathValue, oldPathValue);
							}
						}
						if (newValue !== oldValue) {
							if (this.observerRemainder) {
								this.observerRemainder.remove();
								this.observerRemainder = null;
							}
							if (hasRemainder && (this.o || EMPTY_OBJECT)[this.prop] && typeof this.o[this.prop] === "object") {
								this.observerRemainder = new MiniObservablePath(this.o[this.prop], this.remainder);
								this.observerRemainder.open(callback);
							}
						}
					}
				}
			}
			return function (callback, thisObject) {
				var boundCallback = miniObservablePathCallback.bind(this, callback = callback.bind(thisObject));
				this.hProp = Observable.observe(this.o, boundCallback);
				this.hProp.boundCallback = boundCallback;
				if (this.remainder.length > 0 && (this.o || EMPTY_OBJECT)[this.prop] && typeof this.o[this.prop] === "object") {
					(this.observerRemainder = new MiniObservablePath(this.o[this.prop], this.remainder)).open(callback);
				}
				this.opened = true;
				return getObjectPath(this.o[this.path], this.remainder);
			};
		})(),

		deliver: function () {
			this.hProp && Observable.deliverChangeRecords(this.hProp.boundCallback);
			this.observerRemainder && this.observerRemainder.deliver();
		},

		discardChanges: function () {
			this.beingDiscarded = true;
			Observable.deliverChangeRecords(this.hProp.boundCallback);
			this.beingDiscarded = false;
			return this.observerRemainder ? this.observerRemainder.discardChanges() : getObjectPath(this.o[this.prop], this.remainder);
		},

		setValue: function (value) {
			if (this.remainder.length > 0) {
				setObjectPath(this.o[this.prop], this.remainder, value);
			} else if (typeof this.o.set === "function") {
				this.o.set(this.prop, value);
			} else {
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
			if (this.parent) {
				for (var index; (index = this.parent.observers.indexOf(this)) >= 0;) {
					this.parent.observers.splice(index, 1);
				}
			}
			this.closed = true;
		}
	};

	return ObservablePath;
});
