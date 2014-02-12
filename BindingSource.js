/**
 * An interface that abstracts various types of things that can be observed.
 * {@link BindingSource} points to something like object path, a list of {@link BindingSource}, etc.
 * @class BindingSource
 * @augments Handle
 * @abstract
 */

/**
 * Observes change in {@link BindingSource}.
 * @method BindingSource#observe
 * @abstract
 * @param {BindingSource~ChangeCallback} callback The change callback.
 * @returns {Handle} The handle to stop observing.
 */

/**
 * Makes the given callback the only change callback.
 * @method BindingSource#open
 * @abstract
 * @param {function} callback The change callback.
 * @param {Object} thisObject The object that should works as "this" object for callback.
 * @returns The current value of this {@link BindingSource}.
 */

/**
 * Synchronously delivers pending change records.
 * @method BindingSource#deliver
 * @abstract
 */

/**
 * Discards pending change records.
 * @method BindingSource#discardChanges
 * @abstract
 * @returns The current value of this {@link BindingSource}.
 */

/**
 * @method BindingSource#getFrom
 * @abstract
 * @returns The current value of {@link BindingSource}.
 */

/**
 * Sets a value to {@link BindingSource}.
 * @method BindingSource#setTo
 * @abstract
 * @param value The value to set.
 */

/**
 * A synonym for {@link BindingSource#setTo}.
 * @method BindingSource#setValue
 * @abstract
 * @param value The value to set.
 */

/**
 * Stops all observations and does whatever additional cleanups are needed.
 * @method BindingSource#remove
 * @abstract
 */

/**
 * A synonym for {@link BindingSource#remove remove() method}.
 * @method BindingSource#close
 * @abstract
 */

/**
 * Change callback.
 * @callback BindingSource~ChangeCallback
 * @param newValue The new value.
 * @param [oldValue] The old value.
 */
