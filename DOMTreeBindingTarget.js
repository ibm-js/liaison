/** @module liaison/DOMTreeBindingTarget */
define([
	"./schedule",
	"./templateElement",
	"./ObservableArray",
	"./ObservablePath",
	"./BindingSourceList",
	"./BindingTarget",
	"./DOMBindingTarget",
	"./TemplateBinder"
], function (schedule, templateElement, ObservableArray, ObservablePath, BindingSourceList,
	BindingTarget, DOMBindingTarget, TemplateBinder) {
	"use strict";

	var EMPTY_OBJECT = {},
		EMPTY_ARRAY = [],
		ATTRIBUTE_IF = "if",
		ATTRIBUTE_BIND = "bind",
		ATTRIBUTE_REPEAT = "repeat",
		REGEXP_ATTRIBUTE_IF = /^if$/i,
		REGEXP_ATTRIBUTE_BIND = /^bind$/i,
		REGEXP_ATTRIBUTE_REPEAT = /^repeat$/i,
		REGEXP_TEMPLATE_TYPE = /template$/i,
		defineProperty = Object.defineProperty;

	/**
	 * Binding target for declarative data binding.
	 * Created with {@link HTMLTemplateElement#bind HTMLTemplateElement.bind()}.
	 * or {@link HTMLScriptElement#bind HTMLScriptElement.bind()}
	 * (if the script element has type="x-template")
	 * with "bind" attribute.
	 * @class module:liaison/DOMTreeBindingTarget
	 * @augments module:liaison/BindingTarget
	 * @param {Object} object The DOM element.
	 * @param {string} property Not used.
	 * @param {Object} [options]
	 *     The parameters governing this {@link module:liaison/DOMTreeBindingTarget DOMTreeBindingTarget}'s behavior.
	 */
	function DOMTreeBindingTarget() {
		var args = EMPTY_ARRAY.slice.call(arguments);
		args[1] = ATTRIBUTE_BIND;
		BindingTarget.apply(this, args);
		this.bound = [];
	}

	DOMTreeBindingTarget.prototype = Object.create(BindingTarget.prototype);

	DOMTreeBindingTarget.prototype.remove = function () {
		if (this.content) {
			this.content.remove();
			this.content = null;
		}
		if (this.hInsantiation) {
			this.hInsantiation.remove();
			this.hInsantiation = null;
		}
		BindingTarget.prototype.remove.apply(this, arguments);
	};

	defineProperty(DOMTreeBindingTarget.prototype, "value", {
		get: function () {
			return this.model;
		},
		set: (function () {
			function refresh() {
				this.hInsantiation = null;
				if (this.content) {
					this.content.remove();
					this.content = null;
				}
				var condition = this.object._targets[ATTRIBUTE_IF];
				if (this.model && (!condition || condition.value)) {
					this.binder = this.binder || new TemplateBinder(templateElement.upgrade(this.object));
					this.content = this.binder.create(this.model, this.object, "afterEnd");
				}
			}
			return function (value) {
				this.model = value;
				this.hInsantiation = this.hInstantiation || schedule(refresh.bind(this));
			};
		})(),
		enumeable: true,
		configurable: true
	});

	/**
	 * Binding target for declarative repeating data binding.
	 * Created with {@link HTMLTemplateElement#bind HTMLTemplateElement.bind()}.
	 * or {@link HTMLScriptElement#bind HTMLScriptElement.bind()}
	 * (if the script element has type="x-template")
	 * with "repeat" attribute.
	 * @class module:liaison/DOMTreeBindingTarget~RepeatingDOMTreeBindingTarget
	 * @augments module:liaison/DOMTreeBindingTarget
	 * @param {Object} object The DOM element.
	 * @param {string} property Not used.
	 * @param {Object} [options]
	 *     The parameters governing
	 *     this {@link module:liaison/DOMTreeBindingTarget~RepeatingDOMTreeBindingTarget RepeatingDOMTreeBindingTarget}'s behavior.
	 */
	function RepeatingDOMTreeBindingTarget() {
		var args = EMPTY_ARRAY.slice.call(arguments);
		args[1] = ATTRIBUTE_REPEAT;
		BindingTarget.apply(this, args);
		this.bound = [];
	}

	RepeatingDOMTreeBindingTarget.prototype = Object.create(DOMTreeBindingTarget.prototype);

	RepeatingDOMTreeBindingTarget.prototype.remove = function () {
		if (this.ha) {
			this.ha.remove();
			this.ha = null;
		}
		if (this.contents) {
			// Run own handle cleanup before parent class tries to do so
			for (var content; (content = this.contents.shift());) {
				content.remove();
			}
		}
		if (this.hInsantiation) {
			this.hInsantiation.remove();
			this.hInsantiation = null;
		}
		DOMTreeBindingTarget.prototype.remove.apply(this, arguments);
	};

	defineProperty(RepeatingDOMTreeBindingTarget.prototype, "value", {
		get: function () {
			return this.model;
		},
		set: (function () {
			function spliceCallback(splices) {
				// Given this function works as a low-level one,
				// it preferes regular loop over array extras,
				// which makes cyclomatic complexity higher.
				/* jshint maxcomplexity: 15, validthis: true */
				this.binder = this.binder || new TemplateBinder(templateElement.upgrade(this.object));
				for (var i = 0, l = splices.length; i < l; ++i) {
					var spliceIndex = splices[i].index,
						contentsToBeRemoved = this.contents.splice(spliceIndex, splices[i].removed.length);
					for (var content; (content = contentsToBeRemoved.shift());) {
						content.remove();
					}
					var child,
						referenceNode = this.object.nextSibling;
					if (spliceIndex < this.contents.length) {
						// TemplateBinder's instantiation context does not have firstChild, using childNodes here therefore
						for (child = this.contents[spliceIndex].childNodes[0]; child; child = child.nextSibling) {
							if (child.parentNode === this.object.parentNode) {
								referenceNode = child;
								break;
							}
						}
					} else if (spliceIndex >= 1 && spliceIndex - 1 < this.contents.length) {
						// TemplateBinder's instantiation context does not have lastChild, using childNodes here therefore
						var childNodes = this.contents[spliceIndex - 1].childNodes;
						for (child = childNodes[childNodes.length - 1]; child; child = child.previousSibling) {
							if (child.parentNode === this.object.parentNode) {
								referenceNode = child.nextSibling;
								break;
							}
						}
					}
					var position = referenceNode ? "beforeBegin" : "beforeEnd";
					referenceNode = referenceNode || this.object.parentNode;
					for (var iAddition = 0; iAddition < splices[i].addedCount; ++iAddition) {
						this.contents.splice(
							spliceIndex + iAddition,
							0,
							this.binder.create(this.model[spliceIndex + iAddition], referenceNode, position));
					}
				}
			}
			function refresh(old) {
				this.hInsantiation = null;
				this.contents = this.contents || [];
				if (ObservableArray.canObserve(this.model)) {
					this.ha = ObservableArray.observe(this.model, spliceCallback.bind(this));
				}
				if (this.model !== undefined && typeof (this.model || EMPTY_OBJECT).splice !== "function") {
					console.warn("An attempt to set a non-array value is detected. Auto-repeat won't happen.");
				}
				var condition = this.object._targets[ATTRIBUTE_IF],
					shouldAdd = typeof (this.model || EMPTY_OBJECT).splice === "function"
						&& (!condition || condition.value);
				spliceCallback.call(this, [{
					index: 0,
					removed: typeof (old || EMPTY_OBJECT).splice === "function" ? old : EMPTY_ARRAY,
					addedCount: shouldAdd ? this.model.length : 0
				}]);
			}
			return function (value) {
				if (this.ha) {
					this.ha.remove();
					this.ha = null;
				}
				var old = this.model;
				this.model = value;
				this.hInsantiation = this.hInstantiation || schedule(refresh.bind(this, old));
			};
		})(),
		enumeable: true,
		configurable: true
	});

	/**
	 * Binding target for conditional declarative data binding.
	 * Created with {@link HTMLTemplateElement#bind HTMLTemplateElement.bind()}.
	 * or {@link HTMLScriptElement#bind HTMLScriptElement.bind()}
	 * (if the script element has type="x-template")
	 * with "if" attribute.
	 * @class module:liaison/DOMTreeBindingTarget~ConditionalDOMTreeBindingTarget
	 * @augments module:liaison/BindingTarget
	 * @param {Object} object The DOM element.
	 * @param {string} property Not used.
	 * @param {Object} [options]
	 *     The parameters governing
	 *     this {@link module:liaison/DOMTreeBindingTarget~ConditionalDOMTreeBindingTarget ConditionalDOMTreeBindingTarget}'s behavior.
	 */
	function ConditionalDOMTreeBindingTarget() {
		var args = EMPTY_ARRAY.slice.call(arguments);
		args[1] = ATTRIBUTE_IF;
		BindingTarget.apply(this, args);
	}

	ConditionalDOMTreeBindingTarget.prototype = Object.create(BindingTarget.prototype);

	defineProperty(ConditionalDOMTreeBindingTarget.prototype, "value", {
		get: function () {
			return this.condition;
		},
		set: function (value) {
			this.condition = value;
			var target = this.object._targets[ATTRIBUTE_REPEAT] || this.object._targets[ATTRIBUTE_BIND];
			if (target) {
				target.value = target.value;
			}
		},
		enumeable: true,
		configurable: true
	});

	if (!DOMBindingTarget.useExisting) {
		/* global HTMLTemplateElement, HTMLUnknownElement */
		var templateElementClass
			= typeof HTMLTemplateElement !== "undefined" ? HTMLTemplateElement : HTMLUnknownElement;

		/**
		 * Establishes data binding between script element property/attribute and {@link module:liaison/BindingSource BindingSource}.
		 * If the script element has type="x-template" attribute and the given property is "bind",
		 * stamps out a template with declarative data binding activated
		 * with the object the given {@link module:liaison/BindingSource BindingSource} has.
		 * If the script element has type="x-template" attribute and  the given property is "repeat",
		 * repeatedly stamps out a template with declarative data binding activated
		 * with the array the given {@link module:liaison/BindingSource BindingSource} has.
		 * If the script element has type="x-template" attribute and  the given property is "if",
		 * stamps out a template or not based on the boolean the given {@link module:liaison/BindingSource BindingSource} has.
		 * @method HTMLScriptElement#bind
		 * @param {string} property Property/attribute name in element.
		 * @param {BindingSource} source The {@link module:liaison/BindingSource BindingSource} to bind the element property/attribute to.
		 * @return {module:liaison/BindingTarget}
		 *     The {@link module:liaison/BindingTarget BindingTarget} instance
		 *     representing the element property/attribute.
		 */

		/**
		 * Establishes data binding between template element property/attribute and {@link module:liaison/BindingSource BindingSource}.
		 * If the given property is "bind",
		 * stamps out a template with declarative data binding activated
		 * with the object the given {@link module:liaison/BindingSource BindingSource} has.
		 * If the given property is "repeat",
		 * repeatedly stamps out a template with declarative data binding activated
		 * with the array the given {@link module:liaison/BindingSource BindingSource} has.
		 * If the given property is "if",
		 * stamps out a template or not based on the boolean the given {@link module:liaison/BindingSource BindingSource} has.
		 * @method HTMLTemplateElement#bind
		 * @param {string} property Property/attribute name in element.
		 * @param {BindingSource} source The {@link module:liaison/BindingSource BindingSource} to bind the element property/attribute to.
		 * @return {module:liaison/BindingTarget}
		 *     The {@link module:liaison/BindingTarget BindingTarget} instance
		 *     representing the element property/attribute.
		 * @example
		 *     <template id="my-template">
		 *         <template bind="{{manager}}">
		 *             First: <input type="text" value="{{First}}">
		 *             Last: <input type="text" value="{{Last}}">
		 *         </template>
		 *         <template repeat="{{managed}}">
		 *             <div>
		 *                 Selected: <input type="checkbox" checked="{{selected}}">
		 *                 First: <input type="text" value="{{First}}">
		 *                 Last: <input type="text" value="{{Last}}">
		 *             </div>
		 *         </template>
		 *     </template>
		 * @example
		 *     // wrapper.wrap() recursively creates Observable and ObservableArray
		 *     require(["liaison/wrapper", "liaison/DOMTreeBindingTarget"], function (wrapper) {
		 *         var observable = wrapper.wrap({
		 *             manager: {First: "Ben", Last: "Beckham"},
		 *             managed: [
		 *                 {selected: true, First: "John", Last: "Doe"},
		 *                 {selected: false, First: "Anne", Last: "Ackerman"}
		 *             ]
		 *         });
		 *         var template = document.getElementById("my-template");
		 *         template.bind("bind", observable);
		 *     });
		 */
		templateElementClass.prototype.bind = HTMLScriptElement.prototype.bind = function (property, source) {
			if (this.tagName === "TEMPLATE"
				|| this.tagName === "SCRIPT" && REGEXP_TEMPLATE_TYPE.test(this.getAttribute("type"))) {
				var target = this._targets && this._targets[property];
				if (!target) {
					if (REGEXP_ATTRIBUTE_IF.test(property)) {
						return new ConditionalDOMTreeBindingTarget(this, property).bind(source);
					} else if (REGEXP_ATTRIBUTE_BIND.test(property)) {
						return new DOMTreeBindingTarget(this, property).bind(source);
					} else if (REGEXP_ATTRIBUTE_REPEAT.test(property)) {
						return new RepeatingDOMTreeBindingTarget(this, property).bind(source);
					}
				}
			}
			return HTMLElement.prototype.bind.call(this, property, source);
		};
	}

	return DOMTreeBindingTarget;
});
