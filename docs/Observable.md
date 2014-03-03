---
layout: default
title: Observable
---

# `Observable`

`Observable` is an object working as a shim of ECMAScript Harmony [`Object.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe).
`Observable` has `.set(property, value)` method for automatic emission of change record [1].
You can work with `Observable` with the following APIs:

* `Observable.observe(observable, callback, accept)` - Observes changes in `observable`, in the same manner as `Object.observe()`.
  `callback` takes an argument, which is an array of change records similar to `Object.observe()`.
  Optional `accept` should indicate what type of change should be observed [2].
  Returns a Dojo-style handle to unobserve.
* `Observable.getNotifier(observable)` - Creates an object with `notify(changeRecord)` method, for manual emission of change record.
* `Observable.deliverChangeRecord(callback)` - Synchronously delivers change records that are queued for callback.

`observable.set(property, value)` internally calls `Observable.getNotifier(observable).notify(changeRecord)`.
`.notify(changeRecord)` queues `changeRecord` for delivery.
The delivery happens automatically at end of microtask, or you can manually deliver change records by `Observable.deliverChangeRecords(callback)`.

Observable directly uses ECMAScript Harmony [`Object.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe) if it’s available in browser [3].

[1]: Similar to [`Object.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe), `set()` won’t automatically deliver a change record if the given property has a setter (ECMAScript setter).

[2]: The default is: `Observable.CHANGETYPE_ADD`, `Observable.CHANGETYPE_UPDATE`, `Observable.CHANGETYPE_DELETE`, `Observable.CHANGETYPE_RECONFIGURE`, `Observable.CHANGETYPE_SETPROTOTYPE` and `Observable.CHANGETYPE_PREVENTEXTENSIONS`. Unless [`Object.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe) is natively available or you manually emit change records, only the first two are actually emitted.

[3]: Due to recent change in [`Object.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe)/[`Array.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe) specifications that have not been in their implementations yet, the type property in change records will be different in native implementation.

## Sample

Upon `Observable#set()` calls, callback specified in `Observable.observe()` is called at end of microtask.

```javascript
var observable = new Observable({foo: "Foo0"});
Observable.observe(observable, function (changeRecords) {
    // Called at end of microtask with:
    //     [
    //         {
    //             type: Observable.CHANGETYPE_UPDATE,
    //             object: observable,
    //             name: "foo",
    //             oldValue: "Foo0"
    //         },
    //         {
    //             type: Observable.CHANGETYPE_ADD,
    //             object: observable,
    //             name: "bar"
    //         }
    //     ]
});
observable.set("foo", "Foo1");
observable.set("bar", "Bar0");
```
