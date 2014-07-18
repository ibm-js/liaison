/** @module liaison/delite/WidgetBindingTarget */
define([
	"delite/register",
	"../Observable",
	"../ObservablePath",
	"../BindingTarget",
	"../DOMBindingTarget"
], function (register, Observable, ObservablePath, BindingTarget) {
	"use strict";

	var EMPTY_OBJECT = {},
		EMPTY_ARRAY = [],
		REGEXP_ATTRIBUTE_POINTER = /^_(.*)$/,
		apn = {};

	/**
	 * Helper function to map "foo" --> "_setFooAttr" with caching to avoid recomputing strings.
	 */
	function propNames(name) {
		if (apn[name]) {
			return apn[name];
		}
		var uc = name.replace(/^[a-z]|-[a-zA-Z]/g, function (c) {
			return c.charAt(c.length - 1).toUpperCase();
		});
		var ret = apn[name] = {
			p: "_" + name + "Attr",		// shadow property, since real property hidden by setter/getter
			s: "_set" + uc + "Attr",	// converts dashes to camel case, ex: accept-charset --> _setAcceptCharsetAttr
			g: "_get" + uc + "Attr"
		};
		return ret;
	}

	/**
	 * Binding target for a widget property/attribute.
	 * Created with {@link module:delite/Widget#bind Widget.bind()}.
	 * @class module:liaison/delite/WidgetBindingTarget
	 * @augments module:liaison/BindingTarget
	 * @param {module:delite/Widget} object The widget.
	 * @param {string} property The property/attribute name.
	 * @param {Object} [options]
	 *     The parameters governing
	 *     this {@link module:liaison/delite/WidgetBindingTarget WidgetBindingTarget}'s behavior.
	 */
	var WidgetBindingTarget = (function () {
		function setTo(newValue) {
			if ((this.source || EMPTY_OBJECT).setValue) {
				this.source.setValue(newValue);
			}
		}
		return function () {
			var args = EMPTY_ARRAY.slice.call(arguments);
			BindingTarget.apply(this, args);
			this.targetProperty = (REGEXP_ATTRIBUTE_POINTER.exec(args[1]) || EMPTY_ARRAY)[1] || args[1];
			// Defining HTMLInputElement#value, etc. in prototype breaks <input> in IE.
			// Also Safari throws if we try to set up a "shadow property" for something like HTMLInputElement#value.
			// Therefore rather than relying 100% on decor/Stateful to trigger emitting change record,
			// we make the widget a "pseudo Obserable"
			// and use its pseudo .set() API to make sure a change record is emitted when a widget property gets a new value.
			if (!this.object.set) {
				this.object.set = Observable.prototype.set;
			}
			this.hw = new ObservablePath.Observer(this.object, this.targetProperty);
			if (typeof this.hw.remove !== "function") {
				this.hw.remove = this.hw.close;
			}
			this.hw.open(setTo, this);
			this.object.own(this.hw);
		};
	})();


	WidgetBindingTarget.prototype = Object.create(BindingTarget.prototype);

	WidgetBindingTarget.prototype.remove = WidgetBindingTarget.prototype.close = function () {
		if (this.hw) {
			this.hw.remove();
			this.hw = null;
		}
		BindingTarget.prototype.remove.apply(this, arguments);
	};

	Object.defineProperty(WidgetBindingTarget.prototype, "value", {
		get: function () {
			return this.object[this.targetProperty];
		},
		set: function (value) {
			this.object.set(this.targetProperty, value);
			this.hw.deliver(); // Deliver self-change immediately to avoid race condition
		},
		enumerable: true,
		configurable: true
	});

	/**
	 * Establishes data binding between widget property/attribute and {@link module:liaison/BindingSource BindingSource}.
	 * @method module:delite/Widget#bind
	 * @param {string} property Property/attribute name in widget.
	 * @param {BindingSource} source The {@link module:liaison/BindingSource BindingSource} to bind the widget property/attribute to.
	 * @returns {module:liaison/BindingTarget}
	 *     The {@link module:liaison/BindingTarget BindingTarget} instance
	 *     representing the widget property/attribute.
	 */

	/* global HTMLTemplateElement, HTMLUnknownElement */
	var ElementClassList = [];
	if (typeof Element !== "undefined") {
		ElementClassList.push(HTMLScriptElement, HTMLInputElement, HTMLSelectElement, HTMLTextAreaElement, HTMLUnknownElement, HTMLElement);
	}
	if (typeof HTMLTemplateElement !== "undefined") {
		ElementClassList.unshift(HTMLTemplateElement);
	}
	ElementClassList.forEach(function (ElementClass) {
		var origBind = ElementClass.prototype.bind;
		ElementClass.prototype.bind = (function () {
			function isOwned(property) {
				if (property) {
					var names = propNames(property);
					return names.p in this || names.g in this || names.s in this || (this.owns || EMPTY_OBJECT)[property];
				}
			}
			// HTMLElements#attributes in Chrome has attribute names in lower case
			function getWidgetProperty(property) {
				if (typeof this.buildRendering === "function") {
					var tokens = REGEXP_ATTRIBUTE_POINTER.exec(property),
						targetProperty = tokens ? tokens[1] : property;
					if (this.alwaysUseWidgetAttribute || property in this) {
						return property;
					}
					for (var s in this) {
						if (s.toLowerCase() === targetProperty.toLowerCase()) {
							return (tokens ? "_" : "") + s;
						}
					}
				}
			}
			return function (property, source) {
				register.upgrade(this);
				if (this.startup && !this._started) {
					this.startup();
				}
				var target = this.bindings && this.bindings[property];
				if (!target) {
					var widgetProperty = getWidgetProperty.call(this, property);
					target = isOwned.call(this, widgetProperty) && new WidgetBindingTarget(this, widgetProperty);
				}
				return target && target.bind(source) || origBind.call(this, property, source);
			};
		})();
	});

	return WidgetBindingTarget;
});
