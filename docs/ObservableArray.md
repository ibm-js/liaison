---
layout: default
title: ObservableArray
---

# `ObservableArray`

`ObservableArray` is an object that extends native JavaScript array, and works as a shim of ECMAScript Harmony [`Array.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe).
`ObservableArray` has the following methods:

* `set(property, value)` - Works similar to `observable.set(property, value)`, but emits "splice" type of change record if it’s applicable.
* `pop()`/`push(entry)`/`shift()`/`unshift(entry)`/`splice(index, removeCount, addition0, addition1, ...)` - Removes and/or adds array entries, and automatically emits "splice" type of change record corresponding to the change.
* `reverse()` - Reverses the order of array entries, and automatically emits "splice" type of change record indicating that the entire array entries have changed [1].
* `sort(callback)` - Sorts array entries, and automatically emits "splice" type of change record indicating that the entire array entries have changed [2].

You can work with ObservableArray with the following APIs:

* `Observable.observe(observableArray, callback, accept)` - Observes changes in `observableArray`, in the same manner as [`Array.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe), if the list in `accept` indicates that array splice should be observed [3]. callback takes an argument, which is an array of change records in similar format to [`Array.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe). Returns a Dojo-style handle to unobserve.
* `ObservableArray.observe(observableArray, callback)` - Observes array splices and tries to merge multiple splices to smaller amount. `callback` takes an argument, which is an array of change records in similar format to `Array.observe()`. Returns a Dojo-style handle to unobserve.

ObservableArray uses ECMAScript Harmony [`Array.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe) API if it’s available in browser [4].

[1]: `reverse()` is one of the exceptions to [`Array.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe) compatibility: [`Array.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe) emits "update" type of change records for array entries.

[2]: `sort()` is one of the exceptions to [`Array.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe) compatibility: [`Array.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe) emits "update" type of change records for array entries.

[3]: `Observable.CHANGETYPE_ADD`, `Observable.CHANGETYPE_UPDATE`, `Observable.CHANGETYPE_DELETE` and `Observable.CHANGETYPE_SPLICE`. Unless [`Array.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe) is natively available or you manually emit change records, `Observable.CHANGETYPE_DELETE` won’t actually be emitted.

[4]: Due to recent change in [`Object.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe)/[`Array.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe) specifications that have not been in their implementations yet, the type property in change records will be different in native implementation. `Observable.CHANGETYPE_UPDATE`, etc. constants are available to abstract the difference.
