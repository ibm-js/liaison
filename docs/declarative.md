---
layout: default
title: Declarative data binding
---

[Go up](./)

# Declarative data binding

liaison's declarative data binding is based on [`<template>` element](http://www.w3.org/TR/html5/scripting-1.html#the-template-element), one of the specs in [Web Components](http://w3c.github.io/webcomponents/explainer/) umbrella.

`<template>` element creates an inert DOM tree based on its content. liaison adds two-way data binding feature to `<template>`, which can be used by loading liaison/DOMTreeBindingTarget module and then calling `HTMLTemplateElement#bind()` API.

`HTMLTemplateElement#bind()` API creates one or multiple copies (called "instances") of `<template>`'s DOM tree, and can be used in one of the following ways:

1. To create a single instance based on data model: `HTMLTemplateElement#bind("bind", observable)`
2. To create repeating instances based on an array of data model: `HTMLTemplateElement#bind("repeat", observableArray)`

Let's take a look at the first one. If you have `<template>` like below:

<iframe width="100%" height="150" src="http://jsfiddle.net/ibmjs/VSzLz/embedded/html,js,result" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/VSzLz/">checkout the sample on JSFiddle</a></iframe>

You can instantiate it by assigning a data model by below code for example:

<iframe width="100%" height="225" src="http://jsfiddle.net/ibmjs/VSzLz/embedded/js,html,result" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/VSzLz/">checkout the sample on JSFiddle</a></iframe>

You can do the repeating one in a similar manner:

<iframe width="100%" height="425" src="http://jsfiddle.net/ibmjs/hL5NK/embedded/js,html,result" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/hL5NK/">checkout the sample on JSFiddle</a></iframe>

**Note**: `wrapper.wrap()` API creates a tree of "container object", called [`Observable` and `ObservableArray`](./Observable.html). "Container object" approach allows event-driven change noitification instead of dirty-checking, which ensures the best performance especially for large-scale applications with many watched objects. In environment where ES7 [`Object.observe()` and `Array.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe) are available natively, liaison's two-way data binding features work with plain JavaScript object/array.

`<template>` content is instantiated as siblings of `<template>`. Here's the (explanatory) state of DOM after repeating template instances are created (2nd example):

{% raw %}
```html
<template id="my-template">
    <div>
        First: <input type="text" value="{{first}}">
        Last: <input type="text" value="{{last}}">
    </div>
</template>
<div>
    First: <input type="text" value="Anne">
    Last: <input type="text" value="Ackerman">
</div>
<div>
    First: <input type="text" value="Ben">
    Last: <input type="text" value="Beckham">
</div>
<div>
    First: <input type="text" value="Chad">
    Last: <input type="text" value="Chapman">
</div>
<div>
    First: <input type="text" value="Irene">
    Last: <input type="text" value="Ira">
</div>
```
{% endraw %}

## Nested template

{% raw %}
`<template>` can be nested with `<template bind="{{observable}}">` and/or `<template repeat="{{observableArray}}">` syntaxes, which correspond to `template.bind("bind", observable)` and `template.bind("repeat", observableArray)` respectively. For example, you can do:
{% endraw %}

<iframe width="100%" height="300" src="http://jsfiddle.net/ibmjs/7pjxb/embedded/html,js,result" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/7pjxb/">checkout the sample on JSFiddle</a></iframe>

## Two-way data binding

liaison's data binding is two-way in many cases. With two-way binding, change in data model is reflected to UI, and change in UI is reflected back to model. In below example, change in `<input>` automatically updates data model. Update in data model automatically updates the text underneath:

<iframe width="100%" height="200" src="http://jsfiddle.net/ibmjs/qwU4g/embedded/html,js,result" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/qwU4g/">checkout the sample on JSFiddle</a></iframe>

See [here](./NodeBind.html) to see in what cases two-way binding is supported.

In addition to two-way data binding between model property and UI, repeating template instances reflects array splices in model:

<iframe width="100%" height="525" src="http://jsfiddle.net/ibmjs/y2yJ4/embedded/js,html,result" allowfullscreen="allowfullscreen" frameborder="0"><a href="http://jsfiddle.net/ibmjs/y2yJ4/">checkout the sample on JSFiddle</a></iframe>

Updating array element with particular index (e.g. `model.set(1, wrapper.wrap({first: "John", last: "Jacklin"}))`) as well as `push()`/`pop()`, etc. are translated to splices and are reflected to repeating template instances.

## More ways to work with `<template>`

liaison's declarative data binding provides more ways to work with `<template>`. See [here](./template.html) for details.
