---
layout: doc
title: liaison - A data binding library that aims for emerging web standards compatibility
---

liaison has many features that helps you write your application with good separation-of-concern, on top of emerging standards.

## Declarative/imperative bindings

* [Declarative two-way bindings based on `<template>` with mustache syntax](./declarative.html)
  * [Advanced topics to work with `<template>`](./template.html)
* [Imperative two-way bindings to DOM and Custom Elements](./NodeBind.html)

## Change observation

* [Low-level observable objects](./Observable.html), shims of ES7 [`Object.observe()` and `Array.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe) based on "value-holder object" approach
* High-level observation API ([BindingSource](./BindingSource.html))
