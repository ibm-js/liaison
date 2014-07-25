---
layout: default
title: Observable - A shim of ES7 Object.observe() by value-holder object
keywords: ['Object.observe', 'Array.observe', 'shim']
---

# Observable

`Observable` (now moved to [decor](https://github.com/ibm-js/decor) project) is an object working as a shim of ES7 [`Object.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe).
`Observable` has `.set()` method for automatic emission of change record, and static `Observable.observe()` method to observe for that, for example:

<iframe width="100%" height="225" src="http://jsfiddle.net/ibmjs/pngb8/embedded/js,result" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/pngb8/">checkout the sample on JSFiddle</a></iframe>

Similar to ES7 [`Object.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe), change records are delivered in batch at end of [micro-task](http://www.whatwg.org/specs/web-apps/current-work/multipage/webappapis.html#microtask). In above example, you'll see that change to `foo` property and change to `bar` properties are notified in a single callback, in a format of array. The format of change records is compatible with ES7 [`Object.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe).

Under the hood, `Observable.observe()` directly uses ES7 [`Object.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe) if it's available natively in browser.

## Synchronous delivery of change record

There are some cases you want to deliver change records immediately, instead of waiting for end of [micro-task](http://www.whatwg.org/specs/web-apps/current-work/multipage/webappapis.html#microtask). For that purpose, you can use `Observable.deliverChangeRecord()` that synchronously delivers change records that are queued for callback. Here's an example:

<iframe width="100%" height="300" src="http://jsfiddle.net/ibmjs/S83Ey/embedded/js,result" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/S83Ey/">checkout the sample on JSFiddle</a></iframe>

## Manual emission of change record

Similar to `Object.observe()`, `.set()` won't automatically emit a change record if:

* There is no actual change in value
* The given property has a setter (ECMAScript setter)

In such conditions, you can manually emit a change record (and queue it for delivery) by `Observable.getNotifier(observable).notify(changeRecord)` method, which is what `.set()` calls under the hood. Here's an example:

<iframe width="100%" height="300" src="http://jsfiddle.net/ibmjs/5ezRw/embedded/js,result" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/5ezRw/">checkout the sample on JSFiddle</a></iframe>

# ObservableArray

`ObservableArray` is an object that extends native JavaScript array, and works as a shim of ES7 [`Array.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe). Like `Observable`, `ObserableArray` has `.set()` method for automatic emission of change record, and static `ObservableArray.observe()` method to observe for that. With `ObservableArray.observe()`, change records are translated to a synthetic version representing array splice (which is compatible to ES7 [`Array.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe)) where applicable. Here's an example:

<iframe width="100%" height="200" src="http://jsfiddle.net/ibmjs/MtN79/embedded/js,result" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/MtN79/">checkout the sample on JSFiddle</a></iframe>

In addition to `.set()`, the following methods automatically emit change records, too:

* `pop()`
* `push()`
* `shift()`
* `unshift()`
* `splice()`
* `reverse()`
* `sort()`

**Note**: `reverse()` and `sort()` are exceptions to [`Array.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe) compatibility: [`Array.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe) emits "update" type of change records for array entries.

Here's an example with `.splice()`:

<iframe width="100%" height="200" src="http://jsfiddle.net/ibmjs/4dTAf/embedded/js,result" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/4dTAf/">checkout the sample on JSFiddle</a></iframe>

Under the hood, `ObservableArray.observe()` directly uses ES7 [`Array.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe) if it's available natively in browser.
