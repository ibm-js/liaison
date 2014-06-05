/** @module liaison/ObservableArray */
define(["./Observable"], function (Observable) {
	"use strict";

	/**
	 * The same argument list of Array, taking the length of the new array or the initial list of array elements.
	 * @typedef {number|...Anything} module:liaison/ObservableArray~CtorArguments
	 */

	/**
	 * An observable array, working as a shim
	 * of {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe ECMAScript Harmony Array.observe()}.
	 * @class
	 * @alias module:liaison/ObservableArray
	 * @augments module:liaison/Observable
	 * @param {module:liaison/ObservableArray~CtorArguments} [args]
	 *     The length of the new array or the initial list of array elements.
	 */
	var ObservableArray,
		augmentedMethods,
		defineProperty = Object.defineProperty,
		REGEXP_GLOBAL_OBJECT = /\[\s*object\s+global\s*\]/i; // Global object in node.js

	(function () {
		var observableArrayMarker = "_observableArray";

		if (Observable.useNative) {
			// For useNative case, make ObservableArray an instance of Array instead of an inheritance,
			// so that Array.observe() emits splices for .length update
			ObservableArray = function (length) {
				var self = [];
				Observable.call(self);
				// Make ObservableArray marker not enumerable, configurable or writable
				defineProperty(self, observableArrayMarker, {value: 1});
				defineProperty(self, "set", Object.getOwnPropertyDescriptor(Observable.prototype, "set"));
				if (typeof length === "number" && arguments.length === 1) {
					self.length = length;
				} else {
					[].push.apply(self, arguments);
				}
				return self;
			};
		} else {
			// TODO(asudoh):
			// Document that ObservableArray cannot be observed by Observable.observe()
			// without CHANGETYPE_SPLICE in accept list.
			// We need to create large amount of change records to do so,
			// when splice happens with large amount of removals/adds
			ObservableArray = function (length) {
				var beingConstructed = this && !REGEXP_GLOBAL_OBJECT.test(this) && !this.hasOwnProperty("length"),
					// If this is called as regular function (instead of constructor), work with a new instance
					self = beingConstructed ? [] : new ObservableArray();
				if (beingConstructed) {
					Observable.call(self);
					// Make ObservableArray marker not enumerable, configurable or writable
					defineProperty(self, observableArrayMarker, {value: 1});
					// Make those methods not enumerable
					for (var s in augmentedMethods) {
						defineProperty(self, s, {
							value: augmentedMethods[s],
							configurable: true,
							writable: true
						});
					}
				}
				if (typeof length === "number" && arguments.length === 1) {
					self.length = length;
				} else {
					[].push.apply(self, arguments);
				}
				return self;
			};
		}

		/**
		 * @method module:liaison/ObservableArray.test
		 * @param {Array} a The array to test.
		 * @returns {boolean} true if o is an instance of {@link module:liaison/ObservableArray ObservableArray}.
		 */
		ObservableArray.test = function (a) {
			return a && a[observableArrayMarker];
		};
	})();

	/**
	 * @method module:liaison/ObservableArray.canObserve
	 * @param {Array} a The array to test.
	 * @returns {boolean}
	 *     true if o can be observed with {@link module:liaison/ObservableArray.observe ObservableArray.observe()}.
	 */
	if (Observable.useNative) {
		ObservableArray.canObserve = function (a) {
			return typeof (a || {}).splice === "function";
		};
	} else {
		ObservableArray.canObserve = ObservableArray.test;
	}

	if (!Observable.useNative) {
		(function () {
			/**
			 * Adds and/or removes elements from an array
			 * and automatically emits a change record compatible
			 * with {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe ECMAScript Harmony Array.observe()}.
			 * @param {number} index Index at which to start changing the array.
			 * @param {number} removeCount [An integer indicating the number of old array elements to remove.
			 * @param {...Anything} [var_args] The elements to add to the array.
			 * @return {Array} An array containing the removed elements.
			 * @memberof module:liaison/ObservableArray#
			 */
			function splice(index, removeCount) {
				/* jshint validthis: true */
				if (index < 0) {
					index = this.length + index;
				}
				var oldLength = this.length,
					changeRecord = {
						type: Observable.CHANGETYPE_SPLICE,
						object: this,
						index: index,
						removed: this.slice(index, index + removeCount),
						addedCount: arguments.length - 2
					},
					result = [].splice.apply(this, arguments),
					notifier = Observable.getNotifier(this);
				notifier.notify(changeRecord);
				if (oldLength !== this.length) {
					notifier.notify({
						type: Observable.CHANGETYPE_UPDATE,
						object: this,
						name: "length",
						oldValue: oldLength
					});
				}
				return result;
			}

			augmentedMethods = /** @lends module:liaison/ObservableArray# */ {
				splice: splice,

				/**
				 * Sets a value and automatically emits change record(s)
				 * compatible with {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe ECMAScript Harmony Array.observe()}.
				 * @param {string} name The property name.
				 * @param value The property value.
				 * @returns The value set.
				 */
				set: function (name, value) {
					var args;
					if (name === "length") {
						args = new Array(Math.max(value - this.length, 0));
						args.unshift(Math.min(this.length, value), Math.max(this.length - value, 0));
						splice.apply(this, args);
					} else if (!isNaN(name) && +name >= this.length) {
						args = new Array(name - this.length);
						args.push(value);
						args.unshift(this.length, 0);
						splice.apply(this, args);
					} else {
						Observable.prototype.set.call(this, name, value);
					}
					return value;
				},

				/**
				 * Removes the last element from an array
				 * and automatically emits a change record compatible
				 * with {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe ECMAScript Harmony Array.observe()}.
				 * @returns The element removed.
				 */
				pop: function () {
					return splice.call(this, -1, 1)[0];
				},

				/**
				 * Adds one or more elements to the end of an array
				 * and automatically emits a change record compatible
				 * with {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe ECMAScript Harmony Array.observe()}.
				 * @param {...Anything} var_args The elements to add to the end of the array.
				 * @returns The new length of the array.
				 */
				push: function () {
					var args = [this.length, 0];
					[].push.apply(args, arguments);
					splice.apply(this, args);
					return this.length;
				},

				/**
				 * Reverses the order of the elements of an array
				 * and automatically emits a splice type of change record.
				 * @returns {Array} The array itself.
				 */
				reverse: function () {
					var changeRecord = {
							type: Observable.CHANGETYPE_SPLICE,
							object: this,
							index: 0,
							removed: this.slice(),
							addedCount: this.length
						},
						result = [].reverse.apply(this, arguments);
					// Treat this change as a splice instead of updates in each entry
					Observable.getNotifier(this).notify(changeRecord);
					return result;
				},

				/**
				 * Removes the first element from an array
				 * and automatically emits a change record compatible
				 * with {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe ECMAScript Harmony Array.observe()}.
				 * @returns The element removed.
				 */
				shift: function () {
					return splice.call(this, 0, 1)[0];
				},

				/**
				 * Sorts the elements of an array in place
				 * and automatically emits a splice type of change record.
				 * @returns {Array} The array itself.
				 */
				sort: function () {
					var changeRecord = {
							type: Observable.CHANGETYPE_SPLICE,
							object: this,
							index: 0,
							removed: this.slice(),
							addedCount: this.length
						},
						result = [].sort.apply(this, arguments);
					// Treat this change as a splice instead of updates in each entry
					Observable.getNotifier(this).notify(changeRecord);
					return result;
				},

				/**
				 * Adds one or more elements to the front of an array
				 * and automatically emits a change record compatible
				 * with {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe ECMAScript Harmony Array.observe()}.
				 * @param {...Anything} var_args The elements to add to the front of the array.
				 * @returns The new length of the array.
				 */
				unshift: function () {
					var args = [0, 0];
					[].push.apply(args, arguments);
					splice.apply(this, args);
					return this.length;
				}
			};
		})();
	}

	/**
	 * Observes an ObservableArray for changes.
	 * Internally calls {@link module:liaison/Observable.observe Observable.observe()}
	 * observing for the following types of change records:
	 * [
	 *     {@link module:liaison/Observable.CHANGETYPE_ADD Observable.CHANGETYPE_ADD},
	 *     {@link module:liaison/Observable.CHANGETYPE_UPDATE Observable.CHANGETYPE_UPDATE},
	 *     {@link module:liaison/Observable.CHANGETYPE_DELETE Observable.CHANGETYPE_DELETE},
	 *     {@link module:liaison/Observable.CHANGETYPE_SPLICE Observable.CHANGETYPE_SPLICE}
	 * ]
	 * All change records will be converted
	 * to {@link module:liaison/Observable.CHANGETYPE_SPLICE Observable.CHANGETYPE_SPLICE},
	 * and are merged to smaller number of change records.
	 * @method
	 * @param {Object} observable The {@link module:liaison/ObservableArray ObservableArray} to observe.
	 * @param {module:liaison/Observable~ChangeCallback} callback The change callback.
	 * @returns {Handle} The handle to stop observing.
	 * @throws {TypeError} If the 1st argument is non-object or null.
	 */
	ObservableArray.observe = (function () {
		function observeSpliceCallback(callback, records) {
			// Given this function works as a low-level one,
			// it preferes regular loop over array extras,
			// which makes cyclomatic complexity higher.
			/* jshint maxcomplexity: 20 */

			// Try merging splices
			var mergedRecord = [];
			for (var iRecord = 0, lRecord = records.length; iRecord < lRecord; ++iRecord) {
				var hasBeenMerged = false,
					newRecord = records[iRecord],
					newRecordTargetIndex = mergedRecord.length;
				if (newRecord.type === Observable.CHANGETYPE_ADD || newRecord.type === Observable.CHANGETYPE_UPDATE) {
					newRecord = {
						type: Observable.CHANGETYPE_SPLICE,
						object: newRecord.object,
						index: +newRecord.name,
						removed: [newRecord.oldValue],
						addedCount: 1
					};
				}

				for (var iMergedRecord = mergedRecord.length - 1; iMergedRecord >= 0; --iMergedRecord) {
					// We look at "dirty" range by splices,
					// which actually is [splice.index, splice.index + splice.addedCount).
					// We can merge two splices
					// if the dirty ranges of two splices are adjacent, intersect, or one contains another.
					// When second splice's index is smaller than first splice's index,
					// we need to adjust first splice's index with second splice's removal and addition.
					var targetRecord = mergedRecord[iMergedRecord],
						targetIndexIsSmaller = targetRecord.index < newRecord.index,
						splicesIntersectAmount = Math.min(
							targetIndexIsSmaller ? newRecord.removed.length : targetRecord.addedCount,
							(newRecord.index - targetRecord.index + (targetIndexIsSmaller ? -targetRecord.addedCount : newRecord.removed.length))
								* (targetIndexIsSmaller ? -1 : 1)),
						splicesIntersectOrAdjacent = splicesIntersectAmount >= 0,
						splicesIntersect = splicesIntersectAmount > 0;

					if (splicesIntersectOrAdjacent) {
						var removed = targetIndexIsSmaller ? targetRecord.removed.slice() : // .removed may be read-only
							splicesIntersect ? newRecord.removed.slice(0, targetRecord.index - newRecord.index) :
							newRecord.removed.slice(); // .removed may be read-only
						[].push.apply(
							removed,
							targetIndexIsSmaller ? newRecord.removed.slice(splicesIntersect ? splicesIntersectAmount : 0) : targetRecord.removed);
						if (!targetIndexIsSmaller) {
							// Addition happens when second splice's dirty range contains first splice's dirty range
							[].push.apply(removed, newRecord.removed.slice(targetRecord.index + targetRecord.addedCount - newRecord.index));
						}

						var addedCount = targetRecord.addedCount - splicesIntersectAmount + newRecord.addedCount;

						if (!hasBeenMerged) {
							// Merging new change record to target change record means
							// that we are treating new change record happened
							// at the same timing of target change record.
							// We need to adjust change records later than target change record.
							var earlierMergeRecordIndexAdjustment = newRecord.addedCount - newRecord.removed.length;
							for (var iMergedRecordToAdjust = iMergedRecord + 1, lMergedRecord = mergedRecord.length;
									iMergedRecordToAdjust < lMergedRecord;
									++iMergedRecordToAdjust) {
								var entry = mergedRecord[iMergedRecordToAdjust];
								mergedRecord[iMergedRecordToAdjust] = {
									type: entry.type,
									object: entry.object,
									index: entry.index + earlierMergeRecordIndexAdjustment, // .index may be read-only
									removed: entry.removed,
									addedCount: entry.addedCount
								};
							}
							hasBeenMerged = true;
						}

						newRecord = {
							type: Observable.CHANGETYPE_SPLICE,
							object: targetRecord.object,
							index: Math.min(targetRecord.index, newRecord.index),
							removed: removed,
							addedCount: addedCount
						};

						mergedRecord.splice(newRecordTargetIndex = iMergedRecord, 1);
					}
				}

				if (newRecord.removed.length !== 0 || newRecord.addedCount !== 0) {
					mergedRecord.splice(newRecordTargetIndex, 0, newRecord);
				}
			}

			if (mergedRecord.length > 0) {
				callback(mergedRecord);
			}
		}
		if (Observable.useNative) {
			return function (observableArray, callback) {
				Array.observe(observableArray, callback = observeSpliceCallback.bind(observableArray, callback));
				return {
					deliver: Object.deliverChangeRecords.bind(Object, callback),
					remove: Array.unobserve.bind(Array, observableArray, callback)
				};
			};
		} else {
			return function (observableArray, callback) {
				var h = Object.create(Observable.observe(observableArray, callback = observeSpliceCallback.bind(observableArray, callback), [
					Observable.CHANGETYPE_ADD,
					Observable.CHANGETYPE_UPDATE,
					Observable.CHANGETYPE_DELETE,
					Observable.CHANGETYPE_SPLICE
				]));
				h.deliver = Observable.deliverChangeRecords.bind(Observable, callback);
				return h;
			};
		}
	})();

	return ObservableArray;
});
