---
layout: default
title: Node#bind() and types of bindings
---

[Go up](./)

# `Node#bind()` and types of bindings

liaison's declarative data binding syntax uses `Node#bind(property, source)` API under the hood, which can be used for example:

<iframe width="100%" height="275" src="http://jsfiddle.net/ibmjs/bEg3Y/embedded/js,result" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/bEg3Y/">checkout the sample on JSFiddle</a></iframe>

`source` is an instance of [BindingSource API](./BindingSource.html) that's compatible to [Polymer Observer API](https://github.com/Polymer/observe-js#observable) and points to an property in object, etc. Updates in `source` is reflected to DOM, and update in DOM is reflected back to `source` where two-way binding is supported, which are in many cases.

liaison's declarative data binding syntax as well as the underlying `Node#bind()` API takes different types of DOM nodes and does different things upon the context. The remainder of this document explains what happens by different context.

## Text node

When you bind to a text node like below, it'll be one-way binding from data model to text node value:

{% raw %}
```html
<span>I'm {{feeling}}.</span>
```
{% endraw %}

It means that changing data model updates the text, but update to the text (by imperative DOM API) won't update data model.

## Element attributes

When you bind to a regular element attribute like `style`, it'll be one-way binding from data model to attribute value:

<iframe width="100%" height="250" src="http://jsfiddle.net/ibmjs/Ga3nT/embedded/html,result" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/Ga3nT/">checkout the sample on JSFiddle</a></iframe>

It means that changing data model updates the attribute value, but update to the attribute value (by imperative DOM API) won't update data model.

**Note**: There are special types of attributes which liaison's declarative data binding engine and its underlying `Node.bind()` API treat in special ways. Many of those support two-way binding, one example of those can seen in above example, which is, `value` attribute in `<select>`. Explanations comes later in this document.

## Form elements

The following attributes in form elements support two-way bindings. It means that in addition to data model update reflected to form UI, change in form UI is reflected back to data model:

* `checked` attribute for `<input type="checkbox">` and `value` attribute for other `<input>`
* `value` and `selectedIndex` attributes for `<select>`
* `value` attribute for `<textarea>`

## delite widget attributes

If an attribute in delite widget is one of its properties, liaison's data binding maps directly to the property two-way. It means that in addition to data model update reflected to widget, update in widget is reflected back to data model. To use delite widget attributes binding, you'll need to import liaison/delite/templateBinderExtension module. Here's an example:

<iframe width="100%" height="175" src="http://jsfiddle.net/ibmjs/XqEVa/embedded/html,js,result" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/XqEVa/">checkout the sample on JSFiddle</a></iframe>

## `bind`, `repeat` and `if` attributes in `<template>` and its equivalents

`bind`, `repeat` and `if` attributes in `<template>` and its equivalents instantiate template with the given data model. See [here](./declarative.html) for more details.
