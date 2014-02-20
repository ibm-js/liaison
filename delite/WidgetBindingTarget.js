/** @module liaison/delite/WidgetBindingTarget */
define([
	"delite/register",
	"../BindingTarget",
	"../DOMBindingTarget"
], function (register, BindingTarget, DOMBindingTarget) {
	"use strict";

	var EMPTY_OBJECT = {},
		REGEXP_DIJIT_ATTRIBUTE_ACCESSOR_CONVERSION = /^[a-z]|-[a-zA-Z]/g;

	/**
	 * Binding target for a widget property/attribute.
	 * Created with {@link external:Widget#bind Widget.bind()}.
	 * @class module:liaison/delite/WidgetBindingTarget
	 * @augments module:liaison/BindingTarget
	 * @param {external:Widget} object The widget.
	 * @param {string} property The property/attribute name.
	 * @param {Object} [options]
	 *     The parameters governing
	 *     this {@link module:liaison/delite/WidgetBindingTarget WidgetBindingTarget}'s behavior.
	 */
	var WidgetBindingTarget = (function () {
		function setTo(name, old, current) {
			if ((this.source || EMPTY_OBJECT).setTo) {
				this.source.setTo(current);
			}
		}
		return function () {
			BindingTarget.apply(this, arguments);
			this.hw = this.object.own(this.object.watch(this.property, setTo.bind(this)))[0];
		};
	})();


	WidgetBindingTarget.prototype = Object.create(BindingTarget.prototype);

	WidgetBindingTarget.prototype.remove = function () {
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
			this.object[this.property] = value;
		},
		enumeable: true,
		configurable: true
	});

	if (!DOMBindingTarget.useExisting) {
		/** @class external:Widget */
		/**
		 * Establishes data binding between widget property/attribute and {@link BindingSource}.
		 * @method external:Widget#bind
		 * @param {string} property Property/attribute name in widget.
		 * @param {BindingSource} source The {@link BindingSource} to bind the widget property/attribute to.
		 * @returns {module:liaison/BindingTarget}
		 *     The {@link module:liaison/BindingTarget BindingTarget} instance
		 *     representing the widget property/attribute.
		 */

		var origBind = HTMLElement.prototype.bind;
		HTMLElement.prototype.bind = (function () {
			// Characters in attribute name can be lower-cased for unknown reason
			// TODO(asudoh): Create a test case for this
			function findProperty(name) {
				for (var s in this) {
					if (s.toLowerCase() === name.toLowerCase()) {
						return s;
					}
				}
			}
			return function (property, source) {
				register.upgrade(this);
				var target = this._targets && this._targets[property];
				if (!target) {
					var accessorName,
						convertedProperty,
						useWidgetAttribute = typeof this.buildRendering === "function"
							&& (this.alwaysUseWidgetAttribute
								|| (this._invalidatingProperties || EMPTY_OBJECT)[property]
								|| property in this
								|| (convertedProperty = findProperty.call(this, property))
								|| "_get" + (accessorName = property.replace(REGEXP_DIJIT_ATTRIBUTE_ACCESSOR_CONVERSION,
									function (token) {
										return token.charAt(token.length - 1).toUpperCase();
									}) + "Attr") in this
								|| "_set" + accessorName in this);
					if (useWidgetAttribute) {
						target = new WidgetBindingTarget(this,
							convertedProperty && !(property in this) && convertedProperty in this ?
								convertedProperty :
								property);
					} else {
						target = origBind.call(this, property);
					}
				}
				return target.bind(source);
			};
		})();
	}

	return WidgetBindingTarget;
});