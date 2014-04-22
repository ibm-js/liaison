/** @module liaison/delite/WidgetBindingTarget */
define([
	"delite/register",
	"../wrapStateful",
	"../BindingTarget",
	"../DOMBindingTarget"
], function (register, wrapStateful, BindingTarget) {
	"use strict";

	var EMPTY_OBJECT = {};

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
		function setTo(name, old, current) {
			if ((this.source || EMPTY_OBJECT).setValue) {
				this.source.setValue(current);
			}
		}
		return function () {
			BindingTarget.apply(this, arguments);
			// Defining HTMLInputElement#value, etc. in prototype breaks <input> in IE.
			// Also Safari throws if we try to set up a "shadow property" for something like HTMLInputElement#value.
			// Therefore rather than relying 100% on delite/Stateful to trigger emitting change record,
			// we make the widget a "pseudo Obserable"
			// and use its pseudo .set() API to make sure a change record is emitted when a widget property gets a new value.
			wrapStateful(this.object);
			this.hw = this.object.own(this.object.watch(this.property, setTo.bind(this)))[0];
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
			return this.object[this.property];
		},
		set: function (value) {
			this.object.set(this.property, value);
		},
		enumeable: true,
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
	var ElementClassList = [HTMLScriptElement, HTMLInputElement, HTMLSelectElement, HTMLTextAreaElement, HTMLUnknownElement, HTMLElement];
	if (typeof HTMLTemplateElement !== "undefined") {
		ElementClassList.unshift(HTMLTemplateElement);
	}
	ElementClassList.forEach(function (ElementClass) {
		var origBind = ElementClass.prototype.bind;
		ElementClass.prototype.bind = (function () {
			// HTMLElements#attributes in Chrome has attribute names in lower case
			function findProperty(name) {
				for (var s in this) {
					if (s.toLowerCase() === name.toLowerCase()) {
						return s;
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
					var convertedProperty,
						useWidgetAttribute = typeof this.buildRendering === "function"
							&& (this.alwaysUseWidgetAttribute
								|| (this._invalidatingProperties || EMPTY_OBJECT)[property]
								|| property in this // Fast path for findProperty()
								|| (convertedProperty = findProperty.call(this, property)));
					if (useWidgetAttribute) {
						target = new WidgetBindingTarget(this, convertedProperty || property);
					} else {
						return origBind.call(this, property, source);
					}
				}
				return target.bind(source);
			};
		})();
	});

	return WidgetBindingTarget;
});
