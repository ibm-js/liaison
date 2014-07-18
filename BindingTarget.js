/** @module liaison/BindingTarget */
define(function () {
	"use strict";

	var EMPTY_OBJECT = {};

	/**
	 * A base class which abstracts a property (or an attribute) in different types of UI components,
	 * and for two-way binding between those and {@link module:liaison/BindingSource BindingSource} implementation.
	 * Points to something like an attribute of DOM element, a widget attribute, etc.
	 * @class module:liaison/BindingTarget
	 * @param {Object} object
	 *     The object this {@link module:liaison/BindingTarget BindingTarget} represents.
	 * @param {string} property
	 *     The property name of the object this {@link module:liaison/BindingTarget BindingTarget} represents.
	 * @param {Object} [options]
	 *     The parameters governing this {@link module:liaison/BindingTarget BindingTarget}'s behavior.
	 */
	function BindingTarget(object, property, options) {
		this.object = object;
		this.property = property;
		this.options = options;
		var bindings = object.bindings;
		if (!bindings) {
			Object.defineProperty(object, "bindings", { // Make bindings not enumerable or writable
				value: bindings = {},
				configurable: true
			});
		}
		bindings[property] = this;
	}

	BindingTarget.prototype = /** @lends module:liaison/BindingTarget# */ {
		get value() {
			return this.object[this.property];
		},

		set value(value) {
			if (typeof this.object.set === "function") {
				this.object.set(this.property, value);
			} else {
				this.object[this.property] = value;
			}
		},

		/**
		 * Establishes two-way binding
		 * between this {@link module:liaison/BindingTarget BindingTarget} and source.
		 * this {@link module:liaison/BindingTarget BindingTarget}’s initial value becomes the value of source.
		 * If source does not have {@link module:liaison/BindingSource BindingSource} interface,
		 * updates in source won’t be reflected to target, or vise versa.
		 * @param {BindingSource} source
		 *     The {@link module:liaison/BindingSource BindingSource} to bind this {@link module:liaison/BindingTarget BindingTarget} to.
		 */
		bind: (function () {
			function set(value) {
				/* jshint validthis: true */
				this.value = value;
			}
			return function (source) {
				if (this.h) {
					this.h.remove();
					this.h = null;
				}
				this.source = source;
				if (typeof (source || EMPTY_OBJECT).observe === "function") {
					this.h = source.observe(set.bind(this));
					this.value = source.getFrom();
				} else if (typeof (source || EMPTY_OBJECT).open === "function") {
					this.h = {remove: source.close.bind(source)};
					this.value = source.open(set, this);
				} else {
					this.value = source;
				}
				return this;
			};
		})(),

		/**
		 * Updates source with the current value of this {@link module:liaison/BindingTarget BindingTarget}.
		 */
		updateSource: function () {
			if ((this.source || EMPTY_OBJECT).setTo) {
				this.source.setTo(this.value);
			}
		},

		/**
		 * Stops the binding and does whatever additional cleanups are needed.
		 */
		remove: function () {
			/* jshint unused: false */
			if (this.h) {
				this.h.remove();
				this.h = null;
			}
			this.source = null;
			var found,
				bindings = this.object.bindings;
			bindings && delete bindings[this.property];
			for (var s in bindings) {
				found = true;
				break;
			}
			if (!found) {
				delete this.object.bindings;
			}
		}
	};

	BindingTarget.prototype.close = BindingTarget.prototype.remove;
	return BindingTarget;
});
