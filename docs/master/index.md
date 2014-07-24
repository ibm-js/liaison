---
layout: default
title: liaison
---

# liaison

liaison is a data binding library that aims for emerging web standards compatibility.
It has [low-level observable objects](./Observable.html) that emit change records compatibile to ES7 [`Object.observe()` and `Array.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe).
It also has following APIs, they aim to provide good compatibilities to APIs that are foreseed to be standards in each layer:

* High-level observation API ([BindingSource](./BindingSource.html))
* [Declarative two-way bindings based on mustache syntax](./declarative.html)
* [Imperative two-way bindings to DOM and Custom Elements](./NodeBind.html)

## Basic usage

### Declarative binding

Below example establishes binding between properties and DOM elements. The bindings in `<input>` below are two-way:

<iframe width="100%" height="300" src="http://jsfiddle.net/ibmjs/7pjxb/embedded/html,js,result" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/7pjxb/">checkout the sample on JSFiddle</a></iframe>

See [here](./declarative.html) for more details on declarative binding, and [here](./template.html) for advanced topics to work with `<template>`.

### Imperative binding

Below example establishes binding between a property and DOM element.
`.set()` API is used for trigger change notification for observers. The binding in `<input>` below is two-way:

<iframe width="100%" height="275" src="http://jsfiddle.net/ibmjs/bEg3Y/embedded/js,result" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/bEg3Y/">checkout the sample on JSFiddle</a></iframe>

See [here](./NodeBind.html) for more details on imperative binding.

## Supported browsers

liaison supports newer browsers with better web standards conformance. Current list of supported browsers are:

* IE9+ (Document modes emulating older IEs are not supported)
* Safari 6.1/7.0
* Latest Firefox
* Latest Chrome
* Android “stock” browser 4.1+
