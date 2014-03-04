---
layout: default
title: BindingTarget
---

# `BindingTarget`

liaison library defines an interface, `BindingTarget`, for abstracting a property (or an attribute) in different types of UI components, and for two-way binding between those and `BindingSource` implementation.
`BindingTarget` points to something like an attribute of DOM element, a widget attribute, etc., which is called "target" thereafter.

`BindingTarget` has the following methods:

* `bind(source)` - Establishes two-way binding between target and source.
  Target’s initial value becomes the value of source.
  If source does not have `BindingSource` interface, updates in source won’t be reflected to target, or vise versa.
* `remove()` - Stops the binding and does whatever additional cleanups are needed.

`BindingTarget` has the following properties:

* `value` - Represents the value of property/attribute. Implemented by a pair of getter/setter functions.
* `options` (optional) - An object governing the behavior of `BindingTarget`.
