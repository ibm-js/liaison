/** @module liaison/ObservablePath */
(function (root, factory) {
	// Module definition to support AMD, node.js and browser globals
	if (typeof exports === "object") {
		module.exports = factory(require("./assignObservable"), require("./Observable"));
	} else if (typeof define === "function" && define.amd) {
		define(["./assignObservable", "./Observable"], factory);
	} else {
		root.ObservablePath = factory(root.assignObservable, root.Observable);
	}
})(this, function (assignObservable, Observable) {
	"use strict";

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

	function observeCallback(context, newValue, oldValue) {
		// Given this function works as a low-level one,
		// it preferes regular loop over array extras,
		// which makes cyclomatic complexity higher.
		/* jshint maxcomplexity: 15, validthis: true */
		var found;
		if (!found && !context.discardChangeRecords) {
			for (var records = newValue, i = 0, l = records.length; i < l; ++i) {
				if (records[i].name === context.prop) {
					found = true;
					oldValue = records[i].oldValue;
					newValue = this[context.prop];
					break;
				}
			}
		}
		if (found) {
			var remainder = context.remainder,
				hasRemainder = remainder.length > 0,
				hRemainder = context.hRemainder,
				oldPathValue = hasRemainder ? getObjectPath(oldValue, remainder) : oldValue,
				newPathValue = hasRemainder ? getObjectPath(newValue, remainder) : newValue;
			if (oldPathValue !== newPathValue) {
				context.callback(newPathValue, oldPathValue);
			}
			if (newValue !== oldValue) {
				if (hRemainder) {
					hRemainder.remove();
					context.hRemainder = null;
				}
				if (hasRemainder) {
					context.hRemainder = observePath(newValue, remainder, context.callback);
				}
			}
		}
	}

	var observePath = (function () {
		function discardChangeRecordsFromCallback(callback) {
			/* jshint validthis: true */
			this.discardChangeRecords = true;
			Observable.deliverChangeRecords(callback);
			this.discardChangeRecords = false;
		}
		function deliver() {
			/* jshint validthis: true */
			if (this.hProp) {
				this.hProp.deliver();
			}
			if (this.hRemainder) {
				this.hRemainder.deliver();
			}
		}
		function discardChanges() {
			if (this.hProp) {
				this.hProp.discardChanges();
			}
			if (this.hRemainder) {
				this.hRemainder.discardChanges();
			}
		}
		function remove() {
			/* jshint validthis: true */
			if (this.hProp) {
				this.hProp.remove();
				this.hProp = null;
			}
			if (this.hRemainder) {
				this.hRemainder.remove();
				this.hRemainder = null;
			}
		}
		return function (o, path, callback) {
			var comps = getPathComps(path, true),
				isEmpty = comps.length === 0,
				prop = comps.shift(),
				remainder = comps,
				context = {
					callback: callback,
					prop: prop,
					remainder: remainder
				},
				boundObserveCallback = observeCallback.bind(o, context);

			if (typeof o === "object" && o) {
				context.hProp = Object.create(Observable.observe(o, boundObserveCallback));
				context.hProp.deliver = Observable.deliverChangeRecords.bind(Observable, boundObserveCallback);
				context.hProp.discardChanges = discardChangeRecordsFromCallback.bind(context, boundObserveCallback);
				if (!isEmpty) {
					context.hRemainder = observePath(o[prop], remainder, callback);
				}
			} else if (!isEmpty) {
				console.warn("Attempt to observe non-object " + o + " with " + path + ". Observation not happening.");
			}

			return {
				deliver: deliver.bind(context),
				discardChanges: discardChanges.bind(context),
				remove: remove.bind(context)
			};
		};
	})();

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
	 * A path of {@link module:liaison/Observable Observable}.
	 * @class module:liaison/ObservablePath
	 * @augments BindingSource
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
		this.path = path;
		this.formatter = formatter;
		this.parser = parser;
		this.callbacks = [];
	}

	ObservablePath.prototype = /** @lends module:liaison/ObservablePath# */ {
		/**
		 * Observes a change in a path of {@link module:liaison/Observable Observable}.
		 * @method
		 * @param {BindingSource~ChangeCallback} callback The change callback.
		 * @returns {Handle} The handle to stop observing.
		 */
		observe: (function () {
			function observePathCallback(newValue, oldValue) {
				/* jshint validthis: true */
				for (var callbacks = this.callbacks.slice(), i = 0, l = callbacks.length; i < l; ++i) {
					try {
						callbacks[i].call(
							this.object,
							this.boundFormatter ? this.boundFormatter(newValue) : newValue,
							this.boundFormatter ? this.boundFormatter(oldValue) : oldValue);
					} catch (e) {
						console.error("Error occured in ObservablePath callback: " + (e.stack || e));
					}
				}
			}
			function remove(callback) {
				/* jshint validthis: true */
				for (var index; (index = this.callbacks.indexOf(callback)) >= 0;) {
					this.callbacks.splice(index, 1);
				}
				if (this.callbacks.length === 0) {
					this.h.remove();
					this.h = null;
				}
			}
			return function (callback) {
				if (this.removed) {
					console.warn("Trying to start observing ObservablePath that has been removed already.");
				} else {
					var callbacks = this.callbacks;
					callbacks.push(callback);
					if (!this.h) {
						this.h = observePath(this.object, this.path, observePathCallback.bind(this));
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
		 * @returns The current value of this {@link module:liaison/ObservablePath ObservablePath}.
		 */
		open: function (callback, thisObject) {
			this.callbacks.splice(0, this.callbacks.length);
			this.observe(callback.bind(thisObject));
			return this.getFrom();
		},

		/**
		 * Synchronously delivers pending change records.
		 */
		deliver: function () {
			if (this.h) {
				this.h.deliver();
			}
		},

		/**
		 * Discards pending change records.
		 * @returns The current value of this {@link module:liaison/ObservablePath ObservablePath}.
		 */
		discardChanges: function () {
			if (this.h) {
				this.h.discardChanges();
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

		// Not using getter here.
		// If we do so, the property defined won't be observable by Observable.observe() or Object.observe()
		// given this class is not the only thing changing the path value
		/**
		 * @returns The current value of {@link module:liaison/ObservablePath ObservablePath}.
		 */
		getFrom: function () {
			var value = getObjectPath(this.object, this.path);
			return this.boundFormatter ? this.boundFormatter(value) : value;
		},

		// Not using setter here.
		// If we do so, the property defined won't be observable by Observable.observe() or Object.observe()
		// given this class is not the only thing changing the path value
		/**
		 * Sets a value to {@link module:liaison/ObservablePath ObservablePath}.
		 * @param value The value to set.
		 */
		setTo: function (value) {
			setObjectPath(this.object, this.path, this.boundParser ? this.boundParser(value) : value);
		},

		/**
		 * Stops all observations.
		 */
		remove: function () {
			if (this.h) {
				this.h.remove();
				this.h = null;
			}
			this.callbacks.splice(0, this.callbacks.length);
			this.removed = true;
		}
	};

	/**
	 * A synonym for {@link module:liaison/ObservablePath#setTo setTo() method}.
	 * @method module:liaison/ObservablePath#setValue
	 */
	ObservablePath.prototype.setValue = ObservablePath.prototype.setTo;

	/**
	 * A synonym for {@link module:liaison/ObservablePath#remove remove() method}.
	 * @method module:liaison/ObservablePath#close
	 */
	ObservablePath.prototype.close = ObservablePath.prototype.remove;

	return ObservablePath;
});
