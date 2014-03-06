/** @module liaison/DOMBindingTarget */
define(["./BindingTarget"], function (BindingTarget) {
	"use strict";

	var EMPTY_ARRAY = [],
		REGEXP_TYPE_CHECKBOX = /^checkbox/i,
		REGEXP_ATTRIBUTE_VALUE = /^value$/i,
		REGEXP_ATTRIBUTE_CHECKED = /^checked$/i,
		useExisting = typeof HTMLElement.prototype.bind === "function";

	/**
	 * Binding target for a DOM attribute.
	 * Created with {@link HTMLElement#bind HTMLElement.bind()}.
	 * @class module:liaison/DOMBindingTarget
	 * @augments module:liaison/BindingTarget
	 * @param {Object} object The DOM element.
	 * @param {string} property The attribute name.
	 * @param {Object} [options]
	 *     The parameters governing this {@link module:liaison/DOMBindingTarget DOMBindingTarget}'s behavior.
	 */
	function DOMBindingTarget() {
		var args = EMPTY_ARRAY.slice.call(arguments);
		args[1] = args[1].toLowerCase();
		BindingTarget.apply(this, args);
	}

	DOMBindingTarget.prototype = Object.create(BindingTarget.prototype);

	Object.defineProperty(DOMBindingTarget.prototype, "value", {
		get: function () {
			return this.object.getAttribute(this.property);
		},
		set: function (value) {
			this.object.setAttribute(this.property, value != null ? value : "");
		},
		enumeable: true,
		configurable: true
	});

	DOMBindingTarget.useExisting = useExisting;

	/**
	 * Binding target for a conditional DOM attribute.
	 * Created with {@link HTMLElement#bind HTMLElement.bind()} when the last character of the name is "?".
	 * @class module:liaison/DOMBindingTarget~ConditionalDOMBindingTarget
	 * @augments module:liaison/BindingTarget
	 * @param {Object} object The DOM element.
	 * @param {string} property The attribute name.
	 * @param {Object} [options]
	 *     The parameters governing
	 *     this {@link module:liaison/DOMBindingTarget~ConditionalDOMBindingTarget ConditionalDOMBindingTarget}'s behavior.
	 */
	function ConditionalDOMBindingTarget() {
		var args = EMPTY_ARRAY.slice.call(arguments);
		args[1] = args[1].toLowerCase();
		BindingTarget.apply(this, args);
		this.targetAttribute = this.property.substr(0, this.property.length - 1);
	}

	ConditionalDOMBindingTarget.prototype = Object.create(BindingTarget.prototype);

	Object.defineProperty(ConditionalDOMBindingTarget.prototype, "value", {
		get: function () {
			return this.object.hasAttribute(this.targetAttribute);
		},
		set: function (value) {
			if (value) {
				this.object.setAttribute(this.targetAttribute, "");
			} else {
				this.object.removeAttribute(this.targetAttribute);
			}
		},
		enumeable: true,
		configurable: true
	});

	if (!useExisting) {
		Node.prototype.bind = Node.prototype.unbind = function () {
			throw new TypeError("Cannot bind/unbind to/from this node type: " + this.nodeType);
		};

		/** @class HTMLElement */
		/**
		 * Establishes data binding between element property/attribute and {@link module:liaison/BindingSource BindingSource}.
		 * @method HTMLElement#bind
		 * @param {string} property Property/attribute name in element.
		 * @param {BindingSource} source The {@link module:liaison/BindingSource BindingSource} to bind the element property/attribute to.
		 * @return {module:liaison/BindingTarget}
		 *     The {@link module:liaison/BindingTarget BindingTarget} instance
		 *     representing the element property/attribute.
		 */
		HTMLElement.prototype.bind = function (property, source) {
			var target = this._targets && this._targets[property];
			target = target || (property.lastIndexOf("?") === property.length - 1 ?
				new ConditionalDOMBindingTarget(this, property) :
				new DOMBindingTarget(this, property));
			return target.bind(source);
		};

		/**
		 * Stops data binding between element property/attribute and {@link module:liaison/BindingSource BindingSource}.
		 * @method HTMLElement#unbind
		 * @param {string} property Property/attribute name in element
		 */
		HTMLElement.prototype.unbind = function (property) {
			if (this._targets && this._targets[property]) {
				this._targets[property].remove();
			}
		};
	}

	/**
	 * A base class for binding target for a DOM property.
	 * @class module:liaison/DOMBindingTarget~DOMPropertyBindingTarget
	 * @augments module:liaison/BindingTarget
	 * @param {Object} object The DOM element.
	 * @param {string} property The property name.
	 * @param {Object} [options]
	 *     The parameters governing
	 *     this {@link module:liaison/DOMBindingTarget~DOMPropertyBindingTarget DOMPropertyBindingTarget}'s behavior.
	 */
	function DOMPropertyBindingTarget() {
		BindingTarget.apply(this, arguments);
	}

	DOMPropertyBindingTarget.prototype = Object.create(BindingTarget.prototype);

	Object.defineProperty(DOMPropertyBindingTarget.prototype, "value", {
		get: function () {
			return this.object[this.property];
		},
		set: function (value) {
			this.object[this.property] = value != null ? value : "";
		},
		enumeable: true,
		configurable: true
	});

	/**
	 * A base class for two-way binding target for a DOM property with which onchange event is fired when it's changed.
	 * @class module:liaison/DOMBindingTarget~ChangeableValueBindingTarget
	 * @augments module:liaison/DOMBindingTarget~DOMPropertyBindingTarget
	 * @param {Object} object The DOM element.
	 * @param {string} property The property name.
	 * @param {Object} [options]
	 *     The parameters governing
	 *     this {@link module:liaison/DOMBindingTarget~ChangeableValueBindingTarget ChangeableValueBindingTarget}'s behavior.
	 */
	function ChangeableValueBindingTarget() {
		DOMPropertyBindingTarget.apply(this, arguments);
		this.object.addEventListener("change", this.boundEventListenerCallback = this.eventListenerCallback.bind(this));
	}

	ChangeableValueBindingTarget.prototype = Object.create(DOMPropertyBindingTarget.prototype);

	ChangeableValueBindingTarget.prototype.eventListenerCallback = ChangeableValueBindingTarget.prototype.updateSource;

	ChangeableValueBindingTarget.prototype.remove = function () {
		BindingTarget.prototype.remove.call(this);
		if (this.boundEventListenerCallback) {
			this.object.removeEventListener("change", this.boundEventListenerCallback);
			this.boundEventListenerCallback = null;
		}
	};

	/**
	 * Two-way binding target for input elements value attribute.
	 * Created with {@link HTMLInputElement#bind HTMLInputElement.bind()}.
	 * @class module:liaison/DOMBindingTarget~InputValueBindingTarget
	 * @augments module:liaison/DOMBindingTarget~ChangeableValueBindingTarget
	 * @param {Object} object The DOM element.
	 * @param {string} property The property name.
	 * @param {Object} [options]
	 *     The parameters governing
	 *     this {@link module:liaison/DOMBindingTarget~InputValueBindingTarget InputValueBindingTarget}'s behavior.
	 */
	function InputValueBindingTarget() {
		var args = EMPTY_ARRAY.slice.call(arguments);
		args[1] = "value";
		ChangeableValueBindingTarget.apply(this, args);
	}

	InputValueBindingTarget.prototype = Object.create(ChangeableValueBindingTarget.prototype);

	/**
	 * Two-way binding target for input element's checked attribute.
	 * Created with {@link HTMLInputElement#bind HTMLInputElement.bind()}.
	 * @class module:liaison/DOMBindingTarget~CheckedValueBindingTarget
	 * @augments module:liaison/DOMBindingTarget~ChangeableValueBindingTarget
	 * @param {Object} object The DOM element.
	 * @param {string} property The property name.
	 * @param {Object} [options]
	 *     The parameters governing
	 *     this {@link module:liaison/DOMBindingTarget~CheckedValueBindingTarget CheckedValueBindingTarget}'s behavior.
	 */
	function CheckedValueBindingTarget() {
		var args = EMPTY_ARRAY.slice.call(arguments);
		args[1] = "checked";
		ChangeableValueBindingTarget.apply(this, args);
	}

	CheckedValueBindingTarget.prototype = Object.create(ChangeableValueBindingTarget.prototype);

	if (!useExisting) {
		/**
		 * @class HTMLInputElement
		 * @augments HTMLElement
		 */
		/**
		 * Establishes two-way data binding between input element property/attribute and {@link module:liaison/BindingSource BindingSource}.
		 * @method HTMLInputElement#bind
		 * @param {string} property Property/attribute name in input element.
		 * @param {BindingSource} source The {@link module:liaison/BindingSource BindingSource} to bind the input element property/attribute to.
		 * @return {module:liaison/BindingTarget}
		 *     The {@link module:liaison/BindingTarget BindingTarget} instance
		 *     representing the input element property/attribute.
		 */
		HTMLInputElement.prototype.bind = function (property, source) {
			var target = this._targets && this._targets[property];
			if (!target) {
				var isCheckbox = REGEXP_TYPE_CHECKBOX.test(this.type);
				target = !isCheckbox && REGEXP_ATTRIBUTE_VALUE.test(property) ?
						new InputValueBindingTarget(this, property) :
					isCheckbox && REGEXP_ATTRIBUTE_CHECKED.test(property) ?
						new CheckedValueBindingTarget(this, property) :
						HTMLElement.prototype.bind.call(this, property);
			}
			return target.bind(source);
		};
	}

	function TextNodeValueBindingTarget() {
		var args = EMPTY_ARRAY.slice.call(arguments);
		args[1] = "nodeValue";
		DOMPropertyBindingTarget.apply(this, args);
	}

	TextNodeValueBindingTarget.prototype = Object.create(DOMPropertyBindingTarget.prototype);

	if (!useExisting) {
		/* global Text */
		/** @class Text */
		/**
		 * Establishes data binding between text node value and {@link module:liaison/BindingSource BindingSource}.
		 * @method Text#bind
		 * @param {string} property Not used.
		 * @param {BindingSource} source The {@link module:liaison/BindingSource BindingSource} to bind the text node value to.
		 * @return {module:liaison/BindingTarget}
		 *     The {@link module:liaison/BindingTarget BindingTarget} instance representing the text node value.
		 */
		Text.prototype.bind = function (property, source) {
			var target;
			for (var s in this._targets) {
				target = this._targets[s];
				break;
			}
			return (target || new TextNodeValueBindingTarget(this, property)).bind(source);
		};
		Text.prototype.unbind = function () {
			for (var s in this._targets) {
				this._targets[s].remove();
			}
		};
	}

	return DOMBindingTarget;
});
