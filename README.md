# liaison

liaison is a data binding library that aims for emerging web standards compatibility.
It has [low-level observable objects](http://ibm-js.github.io/liaison/docs/master/Observable.html) that work as shims of ES7 [`Object.observe()` and `Array.observe()`](http://wiki.ecmascript.org/doku.php?id=harmony:observe) with "value-holder object" approach.
It also has following APIs, they aim to provide good compatibilities to APIs that are foreseed to be standards in each layer:

* High-level observation API ([BindingSource](http://ibm-js.github.io/liaison/docs/master/BindingSource.html))
* [Declarative two-way bindings based on mustache syntax](http://ibm-js.github.io/liaison/docs/master/declarative.html)
* [Imperative two-way bindings to DOM and Custom Elements](http://ibm-js.github.io/liaison/docs/master/NodeBind.html)

## Basic usage

### Declarative two-way binding

Below example establishes binding between properties and DOM elements. The bindings in `<input>` below are two-way:

```html
<template id="my-template">
    <template bind="{{manager}}">
        First: <input type="text" value="{{First}}">
        Last: <input type="text" value="{{Last}}">
    </template>
    <template repeat="{{managed}}">
        <div>
            Selected: <input type="checkbox" checked="{{selected}}">
            First: <input type="text" value="{{First}}">
            Last: <input type="text" value="{{Last}}">
        </div>
    </template>
</template>
```

```javascript
require([
    "liaison/wrapper",
    "liaison/DOMTreeBindingTarget"
], function (wrapper) {
    // wrapper.wrap() recursively creates Observable and ObservableArray
    var observable = wrapper.wrap({
        manager: {First: "Ben", Last: "Beckham"},
        managed: [
            {selected: true, First: "John", Last: "Doe"},
            {selected: false, First: "Anne", Last: "Ackerman"}
        ]
    });
    var template = document.getElementById("my-template");
    template.bind("bind", observable);
});
```

![Declarative binding example](http://ibm-js.github.io/liaison/docs/master/images/declarative.png)

See [here](http://ibm-js.github.io/liaison/docs/master/declarative.html) for more details on declarative binding, and [here](http://ibm-js.github.io/liaison/docs/master/template.html) for advanced topics to work with `<template>`.

### Imperative two-way binding

Below example establishes two-way binding between a property and DOM element.
`.set()` API is used for trigger change notification for observers:

```javascript
require([
    "liaison/Observable",
    "liaison/ObservablePath"
], function (Observable, ObservablePath) {
    var observable = new Observable({foo: "FooValue0"});
    var observablePath = new ObservablePath(observable, "foo");
    var input = document.querySelector("input");
    input.bind("value", observablePath); // input.value becomes "FooValue0"
    // input.value becomes "FooValue1" at the end of microtask
    observable.set("foo", "FooValue1");
});
```

See [here](http://ibm-js.github.io/liaison/docs/master/NodeBind.html) for more details on imperative binding.

## Explicit way of emitting change records

liaison takes an approach where you make an explicit API call to emit change records of an object or an array for observation.
With this approach, the underlying system doesn't need to do a heavylifting to compare old/new values of all object properties observed in your application, which becomes non-trivial for bigger-scale applications.

For example,

```javascript
observable.set("foo", "FooValue1")
```

in above example explicitly emits a change record of `observable` object for observation. If it were `observable.foo = "FooValue1"` change record would *not* be emitted and thus observation callback would't be called (unless ES7 `Object.observe()` is availble in your browser).

Similar for value assignment to array by index, call

```javascript
observableArray.set(n, "ValueForObservableArrayN")
```

to explicitly emit change records of `observableArray` for observation. If it were `observableArray[n] = "ValueForObservableArrayN"` change records would *not* be emitted and thus observation callback won't be called (unless ES7 `Array.observe()` is availble in your browser).

Here is the list of the APIs you can use to explicitly emit change records:

* [`Observable`](http://ibm-js.github.io/decor/docs/0.5.0/Observable.html) (In [decor](https://github.com/ibm-js/decor) library)
  * `#set()`
  * `.assign()` (New in 0.6.0)
* [`ObservableArray`](http://ibm-js.github.io/liaison/docs/master/Observable.html)
  * `#set()`
  * `#pop()`
  * `#push()`
  * `#shift()`
  * `#unshift()`
  * `#splice()`
  * `#reverse()`
  * `#sort()`
* [`ObservablePath`](http://ibm-js.github.io/liaison/docs/master/BindingSource.html)
  * `#setValue()` (New in post-0.1.5)

## Supported browsers

liaison supports newer browsers with better web standards conformance. Current list of supported browsers are:

* IE9+ (Document modes emulating older IEs are not supported)
* Safari 6.1/7.0
* Latest Firefox
* Latest Chrome
* Android “stock” browser 4.1+

## Status

No official release yet.

## Migration

## Licensing

This project is distributed by the Dojo Foundation and licensed under the ["New" BSD License](./LICENSE).
All contributions require a [Dojo Foundation CLA](http://dojofoundation.org/about/claForm).

## Dependencies

This project requires AMD loader ([requirejs](http://requirejs.org/) or [Dojo](http://dojotoolkit.org/)) to run in browser.

liaison's core observable object is now in decor project (http://github.com/ibm-js/decor). Other than that, AMD loader is the only dependency of liaison core code.
Code under delite directory is [delite](https://github.com/ibm-js/delite) integration code and therefore requires delite to run it. delite integration code also requires [DCL](http://www.dcljs.org).
Code under polymer directory is [Polymer](http://www.polymer-project.org/) integration code and therefore requires Polymer to run it.
Some sample code requires Dojo or [deliteful](https://github.com/ibm-js/deliteful).

## Installation

_Bower_ release installation:

    $ bower install liaison

_Manual_ master installation:

	$ git clone git://github.com/ibm-js/liaison.git

Then install dependencies with bower (or manually from github if you prefer to):

	$ cd liaison
	$ bower install

## Documentation

You can find documentation [here](http://ibm-js.github.io/liaison/docs/master/).
