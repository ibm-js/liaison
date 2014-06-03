/** @module liaison/Observable */
define([
	"./features",
	"./assignObservable",
	"./features!object-observe-api?:./schedule"
], function (has, assignObservable, schedule) {
	"use strict";

	/**
	 * An observable object, working as a shim
	 * of {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe ECMAScript Harmony Object.observe()}.
	 * @class
	 * @alias module:liaison/Observable
	 * @param {Object} o The object to mix-into the new Observable.
	 * @example
	 *     var observable = new Observable({foo: "Foo0"});
	 *     Observable.observe(observable, function (changeRecords) {
	 *         // Called at the end of microtask with:
	 *         //     [
	 *         //         {
	 *         //             type: Observable.CHANGETYPE_UPDATE,
	 *         //             object: observable,
	 *         //             name: "foo",
	 *         //             oldValue: "Foo0"
	 *         //         },
	 *         //         {
	 *         //             type: Observable.CHANGETYPE_ADD,
	 *         //             object: observable,
	 *         //             name: "bar"
	 *         //         }
	 *         //     ]
	 *     });
	 *     observable.set("foo", "Foo1");
	 *     observable.set("bar", "Bar0");
	 */
	var Observable,
		defineProperty = Object.defineProperty,
		getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

	/**
	 * Change record type.
	 * One of:
	 *     {@link module:liaison/Observable.CHANGETYPE_ADD Observable.CHANGETYPE_ADD},
	 *     {@link module:liaison/Observable.CHANGETYPE_UPDATE Observable.CHANGETYPE_UPDATE},
	 *     {@link module:liaison/Observable.CHANGETYPE_DELETE Observable.CHANGETYPE_DELETE},
	 *     {@link module:liaison/Observable.CHANGETYPE_RECONFIGURE Observable.CHANGETYPE_RECONFIGURE},
	 *     {@link module:liaison/Observable.CHANGETYPE_SETPROTOTYPE Observable.CHANGETYPE_SETPROTOTYPE},
	 *     {@link module:liaison/Observable.CHANGETYPE_PREVENTEXTENSIONS Observable.CHANGETYPE_PREVENTEXTENSIONS},
	 *     {@link module:liaison/Observable.CHANGETYPE_SPLICE Observable.CHANGETYPE_SPLICE}
	 * @typedef {string} module:liaison/Observable~ChangeType
	 */

	/**
	 * Change record seen in Observable.observe().
	 * @typedef {Object} module:liaison/Observable~ChangeRecord
	 * @property {module:liaison/Observable~ChangeType} type The type of change record.
	 * @property {Object} object The changed object.
	 * @property {string} [name] The changed property name. Set only for non-splice type of change records.
	 * @property {number} [index] The array index of splice. Set only for splice type of change records.
	 * @property {Array} [removed] The removed array elements. Set only for splice type of change records.
	 * @property {number} [addedCount] The count of added array elements. Set only for splice type of change records.
	 */

	/**
	 * Change callback.
	 * @callback module:liaison/Observable~ChangeCallback
	 * @param {Array.<module:liaison/Observable~ChangeRecord>} changeRecords The change records.
	 */

	(function () {
		var observableMarker = "_observable";

		Observable = function (o) {
			// Make Observable marker not enumerable, configurable or writable
			defineProperty(this, observableMarker, {value: 1});
			o && assignObservable(this, o);
		};

		/**
		 * @method module:liaison/Observable.test
		 * @param {Object} o The object to test.
		 * @returns {boolean} true if o is an instance of Observable.
		 */
		Observable.test = function (o) {
			return o && o[observableMarker];
		};
	})();

	/**
	 * @method module:liaison/Observable.canObserve
	 * @param {Object} o The object to test.
	 * @returns {boolean} true if o can be observed with {@link module:liaison/Observable.observe Observable.observe()}.
	 */
	if (has("object-observe-api")) {
		Observable.canObserve = function (o) {
			return typeof o === "object" && o != null;
		};
	} else {
		Observable.canObserve = Observable.test;
	}

	/**
	 * Indicates an addition of a property.
	 * @constant {string} module:liaison/Observable.CHANGETYPE_ADD
	 */
	Observable.CHANGETYPE_ADD = "add";

	/**
	 * Indicates an update to a property.
	 * @constant {string} module:liaison/Observable.CHANGETYPE_UPDATE
	 */
	Observable.CHANGETYPE_UPDATE = "update";

	/**
	 * Indicates a deletion of a property.
	 * Automatic emission of this change type is done only
	 * by native {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe ECMAScript Harmony Object.observe()}.
	 * @constant {string} module:liaison/Observable.CHANGETYPE_DELETE
	 */
	Observable.CHANGETYPE_DELETE = "delete";

	/**
	 * Indicates a reconfiguration of a property.
	 * Automatic emission of this change type is done only
	 * by native {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe ECMAScript Harmony Object.observe()}.
	 * @constant {string} module:liaison/Observable.CHANGETYPE_RECONFIGURE
	 */
	Observable.CHANGETYPE_RECONFIGURE = "reconfigure";

	/**
	 * Indicates a change to the prototype of an object.
	 * Automatic emission of this change type is done only
	 * by native {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe ECMAScript Harmony Object.observe()}.
	 * @constant {string} module:liaison/Observable.CHANGETYPE_SETPROTOTYPE
	 */
	Observable.CHANGETYPE_SETPROTOTYPE = "setPrototype";

	/**
	 * Indicates that an object has become non-extensible.
	 * Automatic emission of this change type is done only
	 * by native {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe ECMAScript Harmony Object.observe()}.
	 * @constant {string} module:liaison/Observable.CHANGETYPE_PREVENTEXTENSIONS
	 */
	Observable.CHANGETYPE_PREVENTEXTENSIONS = "preventExtensions";

	/**
	 * Indicates an addition of a property.
	 * Automatic emission of this change type is done
	 * by {@link module:liaison/ObservableArray.observe ObservableArray.observe()}
	 * and ECMAScript Harmony Array.observe().
	 * @constant {string} module:liaison/Observable.CHANGETYPE_SPLICE
	 */
	Observable.CHANGETYPE_SPLICE = "splice";

	if (has("object-observe-api")) {
		defineProperty(Observable.prototype, "set", { // Make set() not enumerable
			value: function (name, value) {
				this[name] = value;
				return value;
			},
			configurable: true,
			writable: true
		});

		Observable.observe = function (object, callback, accept) {
			Object.observe.call(this, object, callback, accept);
			return {
				remove: Object.unobserve.bind(Object, object, callback)
			};
		};

		Observable.getNotifier = Object.getNotifier;
		Observable.deliverChangeRecords = Object.deliverChangeRecords;
	} else {
		defineProperty(Observable.prototype, "set", { // Make set() not enumerable
			/**
			 * Sets a value.
			 * Automatically emits change record(s)
			 * compatible with {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe Object.observe()}
			 * if no ECMAScript setter is defined for the given property.
			 * If ECMAScript setter is defined for the given property,
			 * use {@link module:liaison/Observable~Notifier#notify Observable.getNotifier(observable).notify(changeRecord)}
			 * to manually emit a change record.
			 * @method module:liaison/Observable#set
			 * @param {string} name The property name.
			 * @param value The property value.
			 * @returns The value set.
			 */
			value: (function () {
				var areSameValues = has("object-is-api") ? Object.is : function (lhs, rhs) {
					return lhs === rhs && (lhs !== 0 || 1 / lhs === 1 / rhs) || lhs !== lhs && rhs !== rhs;
				};
				return function (name, value) {
					var type = name in this ? Observable.CHANGETYPE_UPDATE : Observable.CHANGETYPE_ADD,
						oldValue = this[name],
						// For defining setter, ECMAScript setter should be used
						setter = (getOwnPropertyDescriptor(this, name) || {}).set;
					this[name] = value;
					if (!areSameValues(value, oldValue) && setter === undefined) {
						// Auto-notify if there is no setter defined for the property.
						// Application should manually call Observable.getNotifier(observable).notify(changeRecord)
						// if a setter is defined.
						var changeRecord = {
							type: type,
							object: this,
							name: name + ""
						};
						if (type === Observable.CHANGETYPE_UPDATE) {
							changeRecord.oldValue = oldValue;
						}
						Observable.getNotifier(this).notify(changeRecord);
					}
					return value;
				};
			})(),
			configurable: true,
			writable: true
		});

		(function () {
			var seq = 0,
				hotCallbacks = {},
				deliverHandle = null;

			function deliverAllByTimeout() {
				/* global Platform */
				has("polymer-platform") && Platform.performMicrotaskCheckpoint(); // For Polymer watching for Observable
				for (var anyWorkDone = true; anyWorkDone;) {
					anyWorkDone = false;
					// Observation may stop during observer callback
					var callbacks = [];
					for (var s in hotCallbacks) {
						callbacks.push(hotCallbacks[s]);
					}
					hotCallbacks = {};
					callbacks = callbacks.sort(function (lhs, rhs) {
						return lhs._seq - rhs._seq;
					});
					for (var i = 0, l = callbacks.length; i < l; ++i) {
						if (callbacks[i]._changeRecords.length > 0) {
							Observable.deliverChangeRecords(callbacks[i]);
							anyWorkDone = true;
						}
					}
				}
				deliverHandle = null;
			}

			function removeGarbageCallback(callback) {
				if (callback._changeRecords.length === 0 && callback._refCountOfNotifier === 0) {
					callback._seq = undefined;
				}
			}

			/**
			 * Notifier object for Observable.
			 * @class module:liaison/Observable~Notifier
			 */
			/**
			 * Queue up a change record.
			 * It will be notified at the end of microtask,
			 * or when {@link module:liaison/Observable.deliverChangeRecords Observable.deliverChangeRecords()}
			 * is called.
			 * @method module:liaison/Observable~Notifier#notify
			 * @param {module:liaison/Observable~ChangeRecord} changeRecord
			 *     The change record to queue up for notification.
			 */

			/**
			 * Obtains a notifier object for the given {@link module:liaison/Observable Observable}.
			 * @method
			 * @param {Object} observable The {@link module:liaison/Observable Observable} to get a notifier object of.
			 * @returns {module:liaison/Observable~Notifier}
			 */
			Observable.getNotifier = (function () {
				function enqueue(changeRecord) {
					// Using Array#indexOf() for _acceptTable and hotCallbacks
					// may regress notify/delivery performance up to 10x esp. with iOS
					if (this._acceptTable[changeRecord.type]) {
						this._changeRecords.push(changeRecord);
						hotCallbacks[this._seq] = this;
						return true;
					}
				}
				function notify(changeRecord) {
					/* jshint validthis: true */
					if (this._activeChanges && !this._activeChanges.finished) {
						this._activeChanges.push(changeRecord);
					} else {
						for (var i = 0, l = this.callbacks.length; i < l; ++i) {
							enqueue.call(this.callbacks[i], changeRecord)
								|| this._activeChanges && this._activeChanges.forEach(enqueue, this.callbacks[i]);
						}
						if (!deliverHandle) {
							deliverHandle = schedule(deliverAllByTimeout);
						}
					}
				}
				function performChange(type, callback) {
					/* jshint validthis: true */
					var target = {
						type: type,
						object: this.target
					};
					this._activeChanges = [];
					var source = callback.call(undefined);
					this._activeChanges.finished = true;
					for (var s in source) {
						if (!(s in target)) {
							target[s] = source[s];
						}
					}
					this.notify(target);
					this._activeChanges = undefined;
				}
				return function (observable) {
					if (!getOwnPropertyDescriptor(observable, "_notifier")) {
						// Make the notifier reference not enumerable, configurable or writable
						defineProperty(observable, "_notifier", {
							value: {
								target: observable,
								callbacks: [],
								notify: notify,
								performChange: performChange
							}
						});
					}
					return observable._notifier;
				};
			})();

			/**
			 * Observes an {@link module:liaison/Observable Observable} for changes.
			 * @method
			 * @param {Object} observable The {@link module:liaison/Observable Observable} to observe.
			 * @param {module:liaison/Observable~ChangeCallback} callback The change callback.
			 * @param {Array.<module:liaison/Observable~ChangeType>}
			 *     [accept={@link module:liaison/Observable~DEFAULT_CHANGETYPES}]
			 *     The list of change record types to observe.
			 * @returns {Handle} The handle to stop observing.
			 * @throws {TypeError} If the 1st argument is non-object or null.
			 */
			Observable.observe = (function () {
				/**
				 * The default list of change record types, which is:
				 * [
				 *     {@link module:liaison/Observable.CHANGETYPE_ADD Observable.CHANGETYPE_ADD},
				 *     {@link module:liaison/Observable.CHANGETYPE_UPDATE Observable.CHANGETYPE_UPDATE},
				 *     {@link module:liaison/Observable.CHANGETYPE_DELETE Observable.CHANGETYPE_DELETE},
				 *     {@link module:liaison/Observable.CHANGETYPE_RECONFIGURE Observable.CHANGETYPE_RECONFIGURE},
				 *     {@link module:liaison/Observable.CHANGETYPE_SETPROTOTYPE Observable.CHANGETYPE_SETPROTOTYPE},
				 *     {@link module:liaison/Observable.CHANGETYPE_PREVENTEXTENSIONS Observable.CHANGETYPE_PREVENTEXTENSIONS}
				 * ]
				 * @constant {Array.<module:liaison/Observable~ChangeType>}
				 *     module:liaison/Observable~DEFAULT_CHANGETYPES
				 */
				var DEFAULT_ACCEPT_CHANGETYPES = [
					Observable.CHANGETYPE_ADD,
					Observable.CHANGETYPE_UPDATE,
					Observable.CHANGETYPE_DELETE,
					Observable.CHANGETYPE_RECONFIGURE,
					Observable.CHANGETYPE_SETPROTOTYPE,
					Observable.CHANGETYPE_PREVENTEXTENSIONS
				].reduce(function (types, type) {
					types[type] = 1;
					return types;
				}, {}); // Observable only supports the first two
				function remove(callback) {
					/* jshint validthis: true */
					for (var index; (index = this.callbacks.indexOf(callback)) >= 0;) {
						this.callbacks.splice(index, 1);
						--callback._refCountOfNotifier;
					}
					removeGarbageCallback(callback);
				}
				return function (observable, callback, accept) {
					if (Object(observable) !== observable) {
						throw new TypeError("Observable.observe() cannot be called on non-object.");
					}
					var acceptTable = accept ? accept.reduce(function (types, type) {
						types[type] = 1;
						return types;
					}, {}) : DEFAULT_ACCEPT_CHANGETYPES;
					if (!getOwnPropertyDescriptor(callback, "_seq")) {
						// Make the registration sequence number not enumerable, configurable or writable
						defineProperty(callback, "_seq", {value: seq++, writable: true});
					} else if (typeof callback._seq !== "number") {
						callback._seq = seq++;
					}
					if (!getOwnPropertyDescriptor(callback, "_changeRecords")) {
						// Make the change records not enumerable, configurable or writable
						defineProperty(callback, "_changeRecords", {value: []});
					}
					if (!getOwnPropertyDescriptor(callback, "_acceptTable")) {
						// Make the accepted change list not enumerable or configurable
						defineProperty(callback, "_acceptTable", {value: acceptTable, writable: true});
					} else {
						callback._acceptTable = acceptTable;
					}
					var notifier = Observable.getNotifier(observable);
					if (notifier.callbacks.indexOf(callback) < 0) {
						notifier.callbacks.push(callback);
						if (!getOwnPropertyDescriptor(callback, "_refCountOfNotifier")) {
							// Make the reference count (from notifiers) not enumerable or configurable
							defineProperty(callback, "_refCountOfNotifier", {value: 0, writable: true});
						}
						++callback._refCountOfNotifier;
					}
					return {
						remove: remove.bind(notifier, callback)
					};
				};
			})();

			/**
			 * Delivers change records immediately.
			 * @method
			 * @param {Function} callback The change callback to deliver change records of.
			 */
			Observable.deliverChangeRecords = function (callback) {
				var length = callback._changeRecords.length;
				try {
					callback(callback._changeRecords.splice(0, length));
				} catch (e) {
					console.error("Error occured in observer callback: " + (e.stack || e));
				}
				removeGarbageCallback(callback);
				return length > 0;
			};
		})();
	}

	return Observable;
});
