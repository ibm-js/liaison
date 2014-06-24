/** @module liaison/DOMTreeBindingTarget */
define([
	"./features",
	"./schedule",
	"./ObservableArray",
	"./ObservablePath",
	"./BindingSourceList",
	"./BindingTarget",
	"./DOMBindingTarget",
	"./computed",
	"./templateBinder"
], function (has, schedule, ObservableArray, ObservablePath, BindingSourceList, BindingTarget, DOMBindingTarget, computed, templateBinder) {
	"use strict";

	var EMPTY_OBJECT = {},
		EMPTY_ARRAY = [],
		ATTRIBUTE_IF = "if",
		ATTRIBUTE_BIND = "bind",
		ATTRIBUTE_REPEAT = "repeat",
		ATTRIBUTE_REF = "ref",
		REGEXP_ATTRIBUTE_IF = /^if$/i,
		REGEXP_ATTRIBUTE_BIND = /^bind$/i,
		REGEXP_ATTRIBUTE_REPEAT = /^repeat$/i,
		REGEXP_ATTRIBUTE_REF = /^ref$/i,
		REGEXP_TEMPLATE_TAG = /^template$/i,
		REGEXP_TEMPLATE_TYPE = /template$/i,
		hasElement = typeof Element !== "undefined",
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

	DOMTreeBindingTarget.prototype.getTemplate = function () {
		var ref = this.object.getAttribute("ref"),
			template = ref && this.object.ownerDocument.getElementById(ref) || this.object;
		if (ref && !template) {
			console.warn("Invalid template reference detected. Ignoring: " + ref);
		}
		return template.upgradeToTemplate();
	};

	DOMTreeBindingTarget.prototype.remove = DOMTreeBindingTarget.prototype.close = function () {
		if (this.instanceData) {
			this.instanceData.remove();
			this.instanceData = null;
		}
		if (this.hInstantiation) {
			this.hInstantiation.remove();
			this.hInstantiation = null;
		}
		BindingTarget.prototype.remove.apply(this, arguments);
	};

	defineProperty(DOMTreeBindingTarget.prototype, "value", {
		get: function () {
			return this.model;
		},
		set: (function () {
			function refresh() {
				this.hInstantiation = null;
				if (this.instanceData) {
					this.instanceData.remove();
					this.instanceData = null;
				}
				var condition = this.object.bindings[ATTRIBUTE_IF];
				if (this.model && (!condition || condition.value)) {
					this.instanceData = this.getTemplate().instantiate(this.model);
					this.object.parentNode.insertBefore(this.instanceData.content, this.object.nextSibling);
				}
			}
			return function (value) {
				this.model = value;
				this.hInstantiation = this.hInstantiation || schedule(refresh.bind(this));
			};
		})(),
		enumerable: true,
		configurable: true
	});

	/**
	 * Binding target for declarative repeating data binding.
	 * Created with {@link HTMLTemplateElement#bind HTMLTemplateElement.bind()}.
	 * or {@link HTMLScriptElement#bind HTMLScriptElement.bind()}
	 * (if the script element has type="x-template")
	 * with "repeat" attribute.
	 * @class module:liaison/DOMTreeBindingTarget~Repeating
	 * @augments module:liaison/DOMTreeBindingTarget
	 * @param {Object} object The DOM element.
	 * @param {string} property Not used.
	 * @param {Object} [options]
	 *     The parameters governing
	 *     this {@link module:liaison/DOMTreeBindingTarget~Repeating RepeatingDOMTreeBindingTarget}'s behavior.
	 */
	function RepeatingDOMTreeBindingTarget() {
		var args = EMPTY_ARRAY.slice.call(arguments);
		args[1] = ATTRIBUTE_REPEAT;
		BindingTarget.apply(this, args);
		this.bound = [];
	}

	RepeatingDOMTreeBindingTarget.prototype = Object.create(DOMTreeBindingTarget.prototype);

	RepeatingDOMTreeBindingTarget.prototype.remove = RepeatingDOMTreeBindingTarget.prototype.close = function () {
		if (this.ha) {
			this.ha.remove();
			this.ha = null;
		}
		if (this.instanceDataList) {
			// Run own handle cleanup before parent class tries to do so
			for (var instanceData; (instanceData = this.instanceDataList.shift());) {
				instanceData.remove();
			}
		}
		if (this.hInstantiation) {
			this.hInstantiation.remove();
			this.hInstantiation = null;
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
				for (var i = 0, l = splices.length; i < l; ++i) {
					var spliceIndex = splices[i].index,
						instanceDataList = this.instanceDataList.splice(spliceIndex, splices[i].removed.length);
					for (var instanceDataToBeRemoved; (instanceDataToBeRemoved = instanceDataList.shift());) {
						instanceDataToBeRemoved.remove();
					}
					var child,
						referenceNode = this.object.nextSibling;
					if (spliceIndex < this.instanceDataList.length) {
						// templateBinder's instantiation context does not have firstChild, using childNodes here therefore
						for (child = this.instanceDataList[spliceIndex].childNodes[0]; child; child = child.nextSibling) {
							if (child.parentNode === this.object.parentNode) {
								referenceNode = child;
								break;
							}
						}
					} else if (spliceIndex >= 1 && spliceIndex - 1 < this.instanceDataList.length) {
						// templateBinder's instantiation context does not have lastChild, using childNodes here therefore
						var childNodes = this.instanceDataList[spliceIndex - 1].childNodes;
						for (child = childNodes[childNodes.length - 1]; child; child = child.previousSibling) {
							if (child.parentNode === this.object.parentNode) {
								referenceNode = child.nextSibling;
								break;
							}
						}
					}
					for (var iAddition = 0; iAddition < splices[i].addedCount; ++iAddition) {
						var instanceData = this.template.instantiate(this.model[spliceIndex + iAddition]);
						this.object.parentNode.insertBefore(instanceData.content, referenceNode);
						this.instanceDataList.splice(
							spliceIndex + iAddition,
							0,
							instanceData);
					}
				}
			}
			function refresh(old) {
				this.hInstantiation = null;
				this.instanceDataList = this.instanceDataList || [];
				if (ObservableArray.canObserve(this.model)) {
					this.ha = ObservableArray.observe(this.model, spliceCallback.bind(this));
				}
				if (this.model !== undefined && typeof (this.model || EMPTY_OBJECT).splice !== "function") {
					console.warn("An attempt to set a non-array value is detected. Auto-repeat won't happen.");
				}
				var condition = this.object.bindings[ATTRIBUTE_IF],
					shouldAdd = typeof (this.model || EMPTY_OBJECT).splice === "function" && (!condition || condition.value);
				this.template = this.getTemplate();
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
				this.hInstantiation = this.hInstantiation || schedule(refresh.bind(this, old));
			};
		})(),
		enumerable: true,
		configurable: true
	});

	/**
	 * Binding target for conditional declarative data binding.
	 * Created with {@link HTMLTemplateElement#bind HTMLTemplateElement.bind()}.
	 * or {@link HTMLScriptElement#bind HTMLScriptElement.bind()}
	 * (if the script element has type="x-template")
	 * with "if" attribute.
	 * @class module:liaison/DOMTreeBindingTarget~Conditional
	 * @augments module:liaison/BindingTarget
	 * @param {Object} object The DOM element.
	 * @param {string} property Not used.
	 * @param {Object} [options]
	 *     The parameters governing
	 *     this {@link module:liaison/DOMTreeBindingTarget~Conditional ConditionalDOMTreeBindingTarget}'s behavior.
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
			var target = this.object.bindings[ATTRIBUTE_REPEAT] || this.object.bindings[ATTRIBUTE_BIND];
			if (target) {
				target.value = target.value;
			}
		},
		enumerable: true,
		configurable: true
	});

	/**
	 * Binding target for external template reference.
	 * Created with {@link HTMLTemplateElement#bind HTMLTemplateElement.bind()}.
	 * or {@link HTMLScriptElement#bind HTMLScriptElement.bind()}
	 * (if the script element has type="x-template")
	 * with "ref" attribute.
	 * @class module:liaison/DOMTreeBindingTarget~TemplateReference
	 * @augments module:liaison/BindingTarget
	 * @param {Object} object The DOM element.
	 * @param {string} property Not used.
	 * @param {Object} [options]
	 *     The parameters governing
	 *     this {@link module:liaison/DOMTreeBindingTarget~TemplateReference TemplateReferenceBindingTarget}'s behavior.
	 */
	function TemplateReferenceBindingTarget() {
		var args = EMPTY_ARRAY.slice.call(arguments);
		args[1] = ATTRIBUTE_REF;
		DOMBindingTarget.apply(this, args);
	}

	TemplateReferenceBindingTarget.prototype = Object.create(DOMBindingTarget.prototype);

	defineProperty(TemplateReferenceBindingTarget.prototype, "value", {
		get: function () {
			return this.object.getAttribute(this.property);
		},
		set: function (value) {
			this.object.setAttribute(this.property, value != null ? value : "");
			var target = this.object.bindings[ATTRIBUTE_REPEAT] || this.object.bindings[ATTRIBUTE_BIND];
			if (target) {
				target.value = target.value;
			}
		},
		enumerable: true,
		configurable: true
	});

	/* global HTMLUnknownElement */
	var PossibleTemplateElementClassList = [];
	if (hasElement) {
		PossibleTemplateElementClassList.push(
			typeof HTMLTemplateElement !== "undefined" ? HTMLTemplateElement :
				typeof HTMLUnknownElement !== "undefined" ? HTMLUnknownElement :
				HTMLElement,
			HTMLScriptElement);
		typeof Element !== "undefined" && PossibleTemplateElementClassList.push(Element); // <template> in <svg>
		typeof SVGElement !== "undefined" && PossibleTemplateElementClassList.push(SVGElement); // <template> in <svg>
	}

	/** @class HTMLTemplateElement */

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

	/**
	 * A factory function to create binding source, given data model, mustache syntax, DOM node and attribute/property name.
	 * @callback HTMLTemplateElement~bindingSourceFactory
	 * @param {Object} model The data model the mustache syntax refers to.
	 * @param {DOMNode} node The DOM node where the mustache syntax is declared.
	 * @returns {module:liaison/BindingSource}
	 *     The binding source created.
	 *     If nothing is returned, the default binding source corresponding to the data binding syntax (`{{property.in.model}}`) will be created.
	 */

	/**
	 * Returns a factory function to create binding source, given data model, mustache syntax, DOM node and attribute/property name.
	 * Used as a callback when {@link HTMLTemplateElement#instantiate} tries
	 * to create {@link module:liaison/BindingSource BindingSource} instances for data binding syntax in template (`{{property.in.model}}`).
	 * @function HTMLTemplateElement#createBindingSourceFactory
	 * @param {string} path What's in the data binding syntax (`{{property.in.model}}`).
	 * @param {string} name The attribute/property name where the data binding syntax (`{{property.in.model}}`) is.
	 * @returns {HTMLTemplateElement~bindingSourceFactory}
	 *     A factory function to create binding source,
	 *     given data model, data binding syntax (`{{property.in.model}}`), DOM node and attribute/property name.
	 */

	function createBindingTarget(element, property, source) {
		var target = element.bindings && element.bindings[property];
		if (!target) {
			var BindingTargetClass = REGEXP_ATTRIBUTE_IF.test(property) && ConditionalDOMTreeBindingTarget
				|| REGEXP_ATTRIBUTE_BIND.test(property) && DOMTreeBindingTarget
				|| REGEXP_ATTRIBUTE_REPEAT.test(property) && RepeatingDOMTreeBindingTarget
				|| REGEXP_ATTRIBUTE_REF.test(property) && TemplateReferenceBindingTarget;
			if (BindingTargetClass) {
				target = new BindingTargetClass(element, property);
			}
		}
		return target && target.bind(source);
	}

	if (!DOMBindingTarget.useExisting) {
		PossibleTemplateElementClassList.forEach(function (ElementClass) {
			var origBind = ElementClass.prototype.bind;
			ElementClass.prototype.bind = function (property, source) {
				var isTemplate = REGEXP_TEMPLATE_TAG.test(this.tagName)
					|| this.tagName === "SCRIPT" && REGEXP_TEMPLATE_TYPE.test(this.getAttribute("type"));
				return isTemplate && createBindingTarget(this, property, source) || origBind.apply(this, arguments);
			};
		});
	}

	/**
	 * Make template element or script element (with type="x-template") act like native template element,
	 * by adding {@link https://dvcs.w3.org/hg/webcomponents/raw-file/default/spec/templates/index.html#dfn-template-contents .content property}.
	 * @method HTMLTemplateElement#upgradeToTemplate
	 * @returns {HTMLTemplateElement} The upgraded template element or script element.
	 */
	var upgradeToTemplate = (function () {
		function isUpgradable(node) {
			return node.tagName === "TEMPLATE"
				|| node.tagName === "template" && node.namespaceURI === "http://www.w3.org/2000/svg"
				|| node.hasAttribute("template")
				|| node.tagName === "SCRIPT" && REGEXP_TEMPLATE_TYPE.test(node.getAttribute("type"));
		}
		function hasBeenUpgraded(template) {
			return (template.content || EMPTY_OBJECT).nodeType === Node.DOCUMENT_FRAGMENT_NODE;
		}
		return function () {
			/* global HTMLTemplateElement */
			if (!isUpgradable(this)) {
				throw new TypeError("Only <template>, <element template>,"
					+ " or <script type=\"x-template\"> (except in SVG context) can be used as a template.");
			}
			if (!hasBeenUpgraded(this)) {
				if (has("polymer-template-decorate")) {
					// If Polymer TemplateBinding is there, let it upgrade the template
					HTMLTemplateElement.decorate(this);
				} else {
					var template = this;
					if (template.tagName === "SCRIPT") {
						(template = this.ownerDocument.createElement("template")).innerHTML = this.innerHTML;
					}
					if (!hasBeenUpgraded(template)) {
						var frag = template.ownerDocument.createDocumentFragment();
						while (template.firstChild) {
							frag.appendChild(template.firstChild);
						}
						this.content = frag;
					} else if (template !== this) {
						this.content = template.content.cloneNode(true);
					}
				}
			}
			if (has("polymer-template-decorate")) {
				// If Polymer TemplateBinding is there, let it upgrade sub-template
				HTMLTemplateElement.bootstrap(this);
			}
			return this;
		};
	})();

	PossibleTemplateElementClassList.forEach(function (ElementClass) {
		ElementClass.prototype.upgradeToTemplate = upgradeToTemplate;
	});

	/**
	 * Stamp out template content with data binding with given data model.
	 * @method HTMLTemplateElement#instantiate
	 * @param {Object} model The data model for the template.
	 * @returns {Node~instanceData} An object that describes template instance.
	 */
	var instantiate = (function () {
		function remove(bound, computed) {
			for (var target = null; (target = bound.shift());) {
				target.remove();
			}
			for (var node; (node = this.childNodes.pop());) {
				if (node.parentNode) {
					node.parentNode.removeChild(node);
				}
				node._instanceData = null;
			}
			if (computed) {
				for (var c; (c = computed.shift());) {
					c.remove();
				}
			}
		}

		function getInstanceData() {
			return this.instanceData;
		}

		return function (model) {
			var isTemplate = REGEXP_TEMPLATE_TAG.test(this.tagName)
				|| this.tagName === "SCRIPT" && REGEXP_TEMPLATE_TYPE.test(this.getAttribute("type"));
			if (!isTemplate) {
				throw new TypeError("Wrong element type for instantiating template content: " + this.tagName);
			}

			var letTemplateCreateInstance = typeof this.createInstance === "function";
			this.content.parsed = this.content.parsed || !letTemplateCreateInstance && templateBinder.parseNode(this.content);

			var toBeBound = [],
				bindings = [],
				boundCreateBindingSourceFactory = this.createBindingSourceFactory.bind(this),
				content = letTemplateCreateInstance ?
					this.createInstance(model,
						this.createBindingSourceFactory && {prepareBinding: boundCreateBindingSourceFactory},
						undefined,
						bindings) :
					templateBinder.createContent(this, this.content.parsed, toBeBound);

			!letTemplateCreateInstance && templateBinder.assignSources.call(this, model, toBeBound, boundCreateBindingSourceFactory);

			var instanceData = {
					model: model,
					content: content,
					childNodes: EMPTY_ARRAY.slice.call(content.childNodes)
				},
				applied = computed.apply(model);

			defineProperty(instanceData, "instanceData", {
				get: getInstanceData.bind(this),
				configurable: true
			});

			instanceData.remove = remove.bind(instanceData,
				letTemplateCreateInstance ?
					bindings.map(function (binding) {
						binding.remove = binding.close;
						return binding;
					}) :
					templateBinder.bind(toBeBound),
				!this.preventRemoveComputed && applied);

			EMPTY_ARRAY.forEach.call(instanceData.childNodes, function (node) {
				node._instanceData = instanceData;
			});

			return instanceData;
		};
	})();

	PossibleTemplateElementClassList.forEach(function (ElementClass) {
		ElementClass.prototype.instantiate = instantiate;
	});

	/**
	 * An object that describes template instance.
	 * @class Node~instanceData
	 * @augments Handle
	 * @property {Object} model The data model used to instantiate the template.
	 * @property {Array.<DOMNode>} childNodes The top-level nodes of instantiated template.
	 * @property {DocumentFragment} content
	 *     The instantiated template, typically used by the caller of {@link HTMLTemplateElement#instantiate} to put it in DOM.
	 */
	if (typeof Node !== "undefined" && !Object.getOwnPropertyDescriptor(Node.prototype, "instanceData")) {
		defineProperty(Node.prototype, "instanceData", {
			get: function () {
				/* jshint camelcase: false */
				return this._instanceData || this.templateInstance_ || (this.parentNode || EMPTY_OBJECT).instanceData;
			},
			configurable: true
		});
	}

	return DOMTreeBindingTarget;
});
