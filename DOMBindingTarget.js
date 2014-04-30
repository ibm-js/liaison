/** @module liaison/DOMBindingTarget */
define(["./BindingTarget"], function (BindingTarget) {
	"use strict";

	var EMPTY_OBJECT = {},
		EMPTY_ARRAY = [],
		REGEXP_TYPE_RADIO = /^radio$/i,
		REGEXP_TYPES_CHECKBOX = /^(checkbox|radio)$/i,
		REGEXP_ATTRIBUTE_VALUE = /^value(@?)$/i,
		REGEXP_ATTRIBUTE_CHECKED = /^checked(@?)$/i,
		REGEXP_ATTRIBUTE_SELECTEDINDEX = /^selectedIndex(@?)$/i,
		REGEXP_ATTRIBUTE_POINTER = /^(.*)@$/,
		hasElement = typeof Element !== "undefined",
		useExisting = hasElement && typeof HTMLElement.prototype.bind === "function";

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
		this.targetProperty = (REGEXP_ATTRIBUTE_POINTER.exec(args[1]) || EMPTY_ARRAY)[1] || args[1];
	}

	DOMBindingTarget.prototype = Object.create(BindingTarget.prototype);

	Object.defineProperty(DOMBindingTarget.prototype, "value", {
		get: function () {
			return this.object.getAttribute(this.targetProperty);
		},
		set: function (value) {
			this.object.setAttribute(this.targetProperty, value != null ? value : "");
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

	if (!useExisting && hasElement) {
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
			var target = (this.bindings || EMPTY_OBJECT)[property];
			target = target
				|| (property.lastIndexOf("?") === property.length - 1 ? new ConditionalDOMBindingTarget(this, property) :
					new DOMBindingTarget(this, property));
			return target.bind(source);
		};

		/**
		 * Stops data binding between element property/attribute and {@link module:liaison/BindingSource BindingSource}.
		 * @method HTMLElement#unbind
		 * @param {string} property Property/attribute name in element
		 */
		HTMLElement.prototype.unbind = function (property) {
			if ((this.bindings || EMPTY_OBJECT)[property]) {
				this.bindings[property].remove();
			}
		};

		if (typeof SVGElement !== undefined) {
			/**
			 * @class SVGElement
			 * @borrows HTMLElement#bind as #bind
			 * @borrows HTMLElement#unbind as #unbind
			 */
			SVGElement.prototype.bind = HTMLElement.prototype.bind;
			SVGElement.prototype.unbind = HTMLElement.prototype.unbind;
		}
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
		var args = EMPTY_ARRAY.slice.call(arguments);
		BindingTarget.apply(this, args);
		this.targetProperty = (REGEXP_ATTRIBUTE_POINTER.exec(args[1]) || EMPTY_ARRAY)[1] || args[1];
	}

	DOMPropertyBindingTarget.prototype = Object.create(BindingTarget.prototype);

	Object.defineProperty(DOMPropertyBindingTarget.prototype, "value", {
		get: function () {
			return this.object[this.targetProperty];
		},
		set: function (value) {
			this.object[this.targetProperty] = value != null ? value : "";
		},
		enumeable: true,
		configurable: true
	});

	/**
	 * A base class for two-way binding target for a DOM property with which oninput/onchange event is fired when it's changed.
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
		this.object.addEventListener(this.eventName, this.boundEventListenerCallback = this.eventListenerCallback.bind(this));
	}

	ChangeableValueBindingTarget.prototype = Object.create(DOMPropertyBindingTarget.prototype);
	ChangeableValueBindingTarget.prototype.eventName = "change";

	ChangeableValueBindingTarget.prototype.eventListenerCallback = ChangeableValueBindingTarget.prototype.updateSource;

	ChangeableValueBindingTarget.prototype.remove = ChangeableValueBindingTarget.prototype.close = function () {
		BindingTarget.prototype.remove.call(this);
		if (this.boundEventListenerCallback) {
			this.object.removeEventListener(this.eventName, this.boundEventListenerCallback);
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
	var InputValueBindingTarget = (function () {
		var ieVer;
		return function () {
			var args = EMPTY_ARRAY.slice.call(arguments);
			args[1] = "value";
			ChangeableValueBindingTarget.apply(this, args);
			if (ieVer === undefined) {
				var mode = document.documentMode;
				ieVer = parseFloat(navigator.appVersion.split("MSIE ")[1]) || undefined;
				if (mode && mode !== 5 && Math.floor(ieVer) !== mode) {
					ieVer = mode;
				}
			}
			if (ieVer < 10) {
				if (!InputValueBindingTarget.all) {
					InputValueBindingTarget.all = [];
				}
				InputValueBindingTarget.all.push(this);
				var doc = this.object.ownerDocument;
				if (InputValueBindingTarget.docs.indexOf(doc) < 0) {
					InputValueBindingTarget.docs.push(doc);
					doc.addEventListener("selectionchange", InputValueBindingTarget.updateSourceForActiveElement);
				}
			}
		};
	})();

	InputValueBindingTarget.prototype = Object.create(ChangeableValueBindingTarget.prototype);
	InputValueBindingTarget.prototype.eventName = "input";

	InputValueBindingTarget.prototype.remove = InputValueBindingTarget.prototype.close = function () {
		ChangeableValueBindingTarget.prototype.remove.apply(this, arguments);
		for (var index; (index = (InputValueBindingTarget.all || EMPTY_ARRAY).indexOf(this)) >= 0;) {
			InputValueBindingTarget.all.splice(index, 1);
		}
		if ((InputValueBindingTarget.all || EMPTY_ARRAY).length === 0) {
			for (var doc; (doc = InputValueBindingTarget.docs.shift());) {
				doc.removeEventListener("selectionchange", InputValueBindingTarget.updateSourceForActiveElement);
			}
			delete InputValueBindingTarget.all;
		}
	};

	InputValueBindingTarget.docs = [];

	/**
	 * Update the data source of InputValueBindingTarget associated with the active element.
	 * Used for IE9 where backspace/delete keystrokes don't fire oninput event.
	 */
	InputValueBindingTarget.updateSourceForActiveElement = function () {
		var target = ((document.activeElement || EMPTY_OBJECT).bindings || EMPTY_OBJECT).value;
		target && target.object.tagName === "INPUT" && target.updateSource && target.updateSource();
	};

	// From: http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#radio-button-group
	function getOtherRadioButtonsInTheSameGroup(elem) {
		var list = [],
			root = elem.form;
		if (!elem.form) {
			root = elem;
			while (root.parentNode) {
				root = root.parentNode;
			}
		}
		for (var elems = root.querySelectorAll("input[type=\"radio\"][name=\"" + elem.name + "\"]"), i = 0, l = elems.length; i < l; ++i) {
			if (elems[i] !== elem
				&& elems[i].tagName === "INPUT"
				&& REGEXP_TYPE_RADIO.test(elems[i].type)
				&& elems[i].name.toLowerCase() === elem.name.toLowerCase()
				&& (elem.form || !elems[i].form)) {
				list.push(elems[i]);
			}
		}
		return list;
	}

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

	CheckedValueBindingTarget.prototype.eventListenerCallback = function () {
		this.updateSource();
		if (REGEXP_TYPE_RADIO.test(this.object.type)) {
			for (var elems = getOtherRadioButtonsInTheSameGroup(this.object), i = 0, l = elems.length; i < l; ++i) {
				var target = (elems[i].bindings || EMPTY_OBJECT).checked;
				target && target.updateSource();
			}
		}
	};

	Object.defineProperty(CheckedValueBindingTarget.prototype, "value", {
		get: function () {
			return this.object[this.property];
		},
		set: function (value) {
			if ((this.object[this.property] = value) && REGEXP_TYPE_RADIO.test(this.object.type)) {
				for (var elems = getOtherRadioButtonsInTheSameGroup(this.object), i = 0, l = elems.length; i < l; ++i) {
					var target = (elems[i].bindings || EMPTY_OBJECT).checked;
					target && target.updateSource();
				}
			}
		}
	});

	if (!useExisting && hasElement) {
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
		/**
		 * Establishes two-way data binding between textarea element property/attribute and {@link module:liaison/BindingSource BindingSource}.
		 * @method HTMLTextAreaElement#bind
		 * @param {string} property Property/attribute name in textarea element.
		 * @param {BindingSource} source The {@link module:liaison/BindingSource BindingSource} to bind the textarea element property/attribute to.
		 * @return {module:liaison/BindingTarget}
		 *     The {@link module:liaison/BindingTarget BindingTarget} instance
		 *     representing the textarea element property/attribute.
		 */
		HTMLInputElement.prototype.bind = HTMLTextAreaElement.prototype.bind = function (property, source) {
			var target = (this.bindings || EMPTY_OBJECT)[property];
			if (!target) {
				var tokens,
					isCheckbox = REGEXP_TYPES_CHECKBOX.test(this.type);
				target = !isCheckbox && (tokens = REGEXP_ATTRIBUTE_VALUE.exec(property)) ? new InputValueBindingTarget(this, "value" + tokens[1]) :
					isCheckbox && (tokens = REGEXP_ATTRIBUTE_CHECKED.exec(property)) ? new CheckedValueBindingTarget(this, "checked" + tokens[1]) :
					HTMLElement.prototype.bind.call(this, property);
			}
			return target.bind(source);
		};

		/**
		 * Establishes two-way data binding between select element property/attribute and {@link module:liaison/BindingSource BindingSource}.
		 * @method HTMLInputElement#bind
		 * @param {string} property Property/attribute name in select element.
		 * @param {BindingSource} source The {@link module:liaison/BindingSource BindingSource} to bind the select element property/attribute to.
		 * @return {module:liaison/BindingTarget}
		 *     The {@link module:liaison/BindingTarget BindingTarget} instance
		 *     representing the select element property/attribute.
		 */
		HTMLSelectElement.prototype.bind = function (property, source) {
			var tokens,
				target = (this.bindings || EMPTY_OBJECT)[property];
			if (!target) {
				target = (tokens = REGEXP_ATTRIBUTE_VALUE.exec(property)) ? new ChangeableValueBindingTarget(this, "value" + tokens[1]) :
					(tokens = REGEXP_ATTRIBUTE_SELECTEDINDEX.exec(property)) ? new ChangeableValueBindingTarget(this, "selectedIndex" + tokens[1]) :
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

	if (!useExisting && hasElement) {
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
			for (var s in this.bindings) {
				target = this.bindings[s];
				break;
			}
			return (target || new TextNodeValueBindingTarget(this, property)).bind(source);
		};
		Text.prototype.unbind = function () {
			for (var s in this.bindings) {
				this.bindings[s].remove();
			}
		};
	}

	return DOMBindingTarget;
});
