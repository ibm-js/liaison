---
layout: default
title: BindingSource
---

# `BindingSource`

liaison library defines an interface, `BindingSource`, for abstracting various types of things that can be observed.
`BindingSource` points to something like object path, a list of `BindingSource`, etc., which is called "source" thereafter, and observes changes in source.

`BindingSource` has the following methods:

* `observe(callback)` - Observes change in source, and calls callback with `newValue`, `oldValue` arguments. Returns a Dojo-style handle to unobserve.
* `getFrom()` - Returns the current value of source.
* `setTo(value)` - Sets a value to source.
* `remove()` - Stops all observations and does whatever additional cleanups are needed.

BindingSource has the following properties:

* `formatter` (optional) - Converts the value from source before being sent to `observe()` callback or `getFrom()`’s return value.
* `parser` (optional) - Converts the value in `setTo()` before being sent to source.
