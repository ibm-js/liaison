---
layout: default
title: NodeBind
---

# `Node#bind()`

liaison library implements `Node#bind(property, source)` API, unless it's implemented already.
The API intends to bind a `BindingSource` specified in `source` parameter to the specified `property` in `Node`,
but what it means depends on the context of `Node` and `property`, as follows by default.

* If `Node` is `<template>` or `<script type="text/x-template">` and `property` is `bind`,
  template content is instantiated with declarative data binding syntax in template activated, based on `source`.
* If `Node` is `<template>` or `<script type="text/x-template">` and `property` is `repeat`,
  template content is instantiated repeatedly with declarative data binding syntax in template activated, based on the array from `source`.
* If `Node` is an `<input type="checkbox">` and `property` is `checked`,
  check box is checked or unchecked based on the boolean value from `source`.
* If `Node` is an `<input>` and `property` is `value`, the value of the `<input>` is set based on the value from `source`.
* If `Node` is other DOM element and `property` ends with `?`,
  the existence of the DOM attribute with the name represented by `property` becomes based on the boolean value from `source`.
* If `Node` is other DOM element,
  the value of DOM attribute with the name represented by `property` is set based on the value from `source`.
* If `Node` is a text node, the value of the text node is set based on the value from `source`.
* Otherwise throws a `TypeError`.

Above behavior is from implementation of `#bind()` in various `Node` descendants.
`Node` descendants, for example, [custom elements](http://w3c.github.io/webcomponents/spec/custom/), can have different implementations `#bind()` based on its needs.
For example, liaison/delite/WidgetBindingTarget module has an implementation for [delite](https://github.com/ibm-js/delite/) widgets.
