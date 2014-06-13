---
layout: default
title: BindingSource
---

[Go up](./)

# `BindingSource`

liaison library defines an interface, `BindingSource`, for abstracting various types of things that can be observed. `BindingSource` points to something like object path, a list of `BindingSource`, etc., which is called "source" thereafter, and observes changes in source. `BindingSource` has the following interface that's compatible with [Polymer Observer API](https://github.com/Polymer/observe-js#observable):

```javascript
{
	/**
	 * Starts the observation, and makes the given callback the only observer callback.
	 * @param {Function} callback The observer callback function that reports changes in value.
	 * @param {Object} thisObject
	 *     The object that works as `this` in the callback function, similar to `Array#forEach()`.
	 * @returns The current value of source.
	 */
	open: function (callback, thisObject) {},

	/**
	 * Synchronously delivers change records, that may end up with observer callback being called.
	 */
	deliver: function () {},

	/**
	 * Ignores pending change records for source.
	 * @returns The current value of source.
	 */
	discardChanges: function () {},

	/**
	 * An optional function that sets a value to source,
	 * that may end up with emitting change records to source and observer callback being called.
	 * @param value The value to set.
	 */
	setValue: function (value) {},

	/**
	 * Stops the observation and frees up resources.
	 */
	close: function () {},

	// The followings are extensions to Polymer Observer API...

	/**
	 * Adds an observer callback.
	 * @param {Function} callback The observer callback function that reports changes in value.
	 * @returns {Handle} Dojo-style handle to stop the observation and free up resources.
	 */
	observe: function (callback) {},

	/**
	 * @returns The current value of source.
	 */
	getFrom: function () {},

	/**
	 * A synonym of `setValue()`.
	 */
	setTo: function (value) {},

	/**
	 * A synonym of `close()`, for compatibility to several Dojo code.
	 */
	remove: function () {},

	/**
	 * An optional function to convert value from source to be passed to observer callback.
	 * @param value The value from source.
	 * @returns The converted value to be passed to observer callback.
	 */
	formatter: function (value) {},

	/**
	 * An optional function to convert value from `.setValue()` to be passed to source.
	 * @param value The value from `.setValue()`.
	 * @returns The converted value to be passed to source.
	 */
	parser: function (value) {}
}
```

The remainder of this document explains various implementations of `BindingSource` interface.

## `ObservablePath`

`ObservablePath` observes a value of object path. If ES7 [`Object.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe) is not available natively in browser, the object tree should be constructed by [`Observable`](./Observable.html) instances for automatic change notification. Here's a usage example:

<iframe width="100%" height="400" src="http://jsfiddle.net/asudoh/fh8t3/embedded/js,result" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/asudoh/fh8t3/">checkout the sample on JSFiddle</a></iframe>

**Note**: What above examples does with `<input>` and text node is very similar to what liaison's [DOM node binding](./NodeBind.html) does under the hood.
