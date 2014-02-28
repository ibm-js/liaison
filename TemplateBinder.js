/**
 * @module liaison/TemplateBinder
 * @private
 */
define([
	"./templateElement",
	"./ObservablePath",
	"./BindingSourceList",
	"./BindingTarget",
	"./DOMBindingTarget"
], function (templateElement, ObservablePath, BindingSourceList, BindingTarget) {
	"use strict";

	var EMPTY_OBJECT = {},
		REGEXP_TEMPLATE_TYPE = /template$/i,
		REGEXP_DECLARATIVE_EVENT = /^on\-(.+)$/i,
		ATTRIBUTE_IF = "if",
		ATTRIBUTE_BIND = "bind",
		ATTRIBUTE_REPEAT = "repeat",
		MUSTACHE_BEGIN = "{{",
		MUSTACHE_BEGIN_LENGTH = 2,
		MUSTACHE_END = "}}",
		MUSTACHES_LENGTH = 4,
		PARSED_ENTRY_LENGTH = 4,
		PARSED_ENTRY_NODE = 0,
		PARSED_ENTRY_ATTRIBUTENAME = 1,
		PARSED_ENTRY_ATTRIBUTEVALUE = 2,
		PARSED_ENTRY_SOURCE = 3;

	function tokenize(text) {
		var index = 0,
			tokens = [];
		while (true) {
			var begin = text.indexOf(MUSTACHE_BEGIN, index);
			if (begin < 0) {
				break;
			}
			var end = text.indexOf(MUSTACHE_END, begin + 2);
			if (end < 0) {
				break;
			}
			tokens.push(text.substring(index, begin));
			var targetToken = text.substring(begin, index = end + 2);
			tokens.push(targetToken);
		}
		tokens.push(text.substr(index));
		return tokens;
	}

	function tokensFormatter(values) {
		var tokens = [];
		for (var i = 0, l = this.length; i < l; ++i) {
			tokens.push(this[i], values[i] != null ? values[i] : "");
		}
		return tokens.join("");
	}

	/**
	 * A class working as an internal logic of {HTMLTemplateElement#bind HTMLTemplateElement.bind()}
	 * to stamp out a template with data binding.
	 * @class module:liaison/TemplateBinder
	 * @private
	 * @param {HTMLTemplateElement} template The template to stamp out.
	 */
	function TemplateBinder(template) {
		/**
		 * The template to stamp out.
		 * @type {HTMLTemplateElement}
		 */
		this.template = template;
	}

	TemplateBinder.prototype = /** @lends module:liaison/TemplateBinder# */ {
		/**
		 * Finds attributes with data binding syntax.
		 * @param {Node} node The root node to parse from.
		 * @returns {Array} The parsed list of (node, attribute name, attribute value, empty) with data binding syntax.
		 */
		parseNode: function (node) {
			// Given this function works as a low-level one,
			// it preferes regular loop over array extras,
			// which makes cyclomatic complexity higher.
			/* jshint maxcomplexity: 15 */
			/**
			 * The list of (node, attribute name, attribute value) with data binding syntax.
			 * @type {Array}
			 */
			var currentNode,
				parsed = [],
				iterator = node.ownerDocument.createNodeIterator(
					node,
					NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
					null,
					false);
			while ((currentNode = iterator.nextNode())) {
				if (currentNode.nodeType === Node.ELEMENT_NODE) {
					for (var i = 0, l = currentNode.attributes.length; i < l; ++i) {
						var attribute = currentNode.attributes[i];
						if (attribute.value.indexOf(MUSTACHE_BEGIN) >= 0) {
							parsed.push(currentNode, attribute.name, attribute.value, undefined);
							var isTemplate = currentNode.tagName === "TEMPLATE"
								|| currentNode.hasAttribute("template")
								|| currentNode.tagName === "SCRIPT"
									&& REGEXP_TEMPLATE_TYPE.test(currentNode.getAttribute("type"));
							// Treat <template if="{{property}}"> as <template if="{{property}}" bind="{{}}">
							if (isTemplate
								&& attribute.name.toLowerCase() === ATTRIBUTE_IF
								&& !currentNode.getAttribute(ATTRIBUTE_BIND)
								&& !currentNode.getAttribute(ATTRIBUTE_REPEAT)) {
								parsed.push(currentNode, ATTRIBUTE_BIND, "{{}}", undefined);
							}
						}
					}
				} else if (currentNode.nodeType === Node.TEXT_NODE) {
					if (currentNode.nodeValue.indexOf(MUSTACHE_BEGIN) >= 0) {
						parsed.push(currentNode, "nodeValue", currentNode.nodeValue, undefined);
					}
				}
			}
			return parsed;
		},

		/**
		 * Instantiate a node in template content, and create a version of parsed data binding syntax adjusted for the instantiated node.
		 * @param {Document} doc The document that the instantiated node should belong to.
		 * @param {Node} node The node to instantiate.
		 * @param {Array} parsed
		 *     The parsed list of (node in template, attribute name, attribute value, empty) with data binding syntax.
		 * @param {Array} toBeBound
		 *     The parsed list of (node in instantiated template, attribute name, attribute value, empty) with data binding syntax.
		 * @returns {DocumentFragment} The instantiated node.
		 */
		importNode: function (doc, node, parsed, toBeBound) {
			var imported = doc.importNode(node, false);

			for (var parsedIndex = 0; (parsedIndex = parsed.indexOf(node, parsedIndex)) >= 0; parsedIndex += PARSED_ENTRY_LENGTH) {
				toBeBound.push(
					imported,
					parsed[parsedIndex + PARSED_ENTRY_ATTRIBUTENAME],
					parsed[parsedIndex + PARSED_ENTRY_ATTRIBUTEVALUE],
					parsed[parsedIndex + PARSED_ENTRY_SOURCE]);
			}

			if (node.tagName === "TEMPLATE") {
				imported.innerHTML = node.innerHTML;
				templateElement.upgrade(imported); // To prevent parsed -> toBeBound copy for template contents
			} else {
				for (var child = node.firstChild; child; child = child.nextSibling) {
					imported.appendChild(this.importNode(doc, child, parsed, toBeBound));
				}
			}

			return imported;
		},

		/**
		 * Creates a clone of the content of this {@link module:liaison/TemplateBinder#template template}.
		 * @param {Array} parsed
		 *     The parsed list of (node in template, attribute name, attribute value, empty) with data binding syntax.
		 * @param {Array} toBeBound
		 *     The parsed list of (node in instantiated template, attribute name, attribute value, empty) with data binding syntax.
		 * @returns {DocumentFragment} The instantiated content of template.
		 */
		createContent: function (parsed, toBeBound) {
			return this.importNode(this.template.ownerDocument, this.template.content, parsed, toBeBound);
		},

		/**
		 * Go through parsed data binding syntax and assign {@link BindingSource} to each entries.
		 * @param {Object} model The data model for the template.
		 * @param {Array} toBeBound
		 *     The parsed list of (node in instantiated template, attribute name, attribute value, assinged {@link BindingSource})
		 *     with data binding syntax.
		 */
		assignSources: function (model, toBeBound) {
			// Given this function works as a low-level one,
			// it preferes regular loop over array extras,
			// which makes cyclomatic complexity higher.
			/* jshint maxcomplexity: 15 */
			for (var iToBeBound = 0, lToBeBound = toBeBound.length; iToBeBound < lToBeBound; iToBeBound += PARSED_ENTRY_LENGTH) {
				var path,
					factory,
					node = toBeBound[iToBeBound + PARSED_ENTRY_NODE],
					name = toBeBound[iToBeBound + PARSED_ENTRY_ATTRIBUTENAME],
					value = toBeBound[iToBeBound + PARSED_ENTRY_ATTRIBUTEVALUE],
					tokens = tokenize(value),
					createBindingSourceFactory = this.template.createBindingSourceFactory || BindingTarget.createBindingSourceFactory;
				if (tokens.length === 3 && !tokens[0] && !tokens[2]) {
					path = tokens[1].substr(MUSTACHE_BEGIN_LENGTH, tokens[1].length - MUSTACHES_LENGTH).trim();
					factory = createBindingSourceFactory && createBindingSourceFactory(path, name);
					toBeBound[iToBeBound + PARSED_ENTRY_SOURCE] = factory ? factory(model, node) : new ObservablePath(model, path);
				} else {
					var list = [],
						texts = [];
					for (var iToken = 0, lToken = tokens.length; iToken < lToken; ++iToken) {
						if (iToken % 2 === 0) {
							texts.push(tokens[iToken]);
						} else {
							path = tokens[iToken].substr(MUSTACHE_BEGIN_LENGTH, tokens[iToken].length - MUSTACHES_LENGTH).trim();
							factory = createBindingSourceFactory && createBindingSourceFactory(path, name);
							list.push(factory ? factory(model, node) : new ObservablePath(model, path));
						}
					}
					toBeBound[iToBeBound + PARSED_ENTRY_SOURCE] = new BindingSourceList(list, tokensFormatter.bind(texts));
				}
			}
		},

		/**
		 * Inserts the cloned content into the specified position.
		 * @param {DocumentFragment} content The instantiated template content to insert.
		 * @param referenceNode {HTMLElement} referenceNode The element position refers to.
		 * @param {string} position
		 *     The position relative to referenceNode, and must be one of the following strings:
		 *     "beforeBegin" inserts the cloned content before referenceNode.
		 *     "afterBegin" inserts the cloned content inside referenceNode before its first child.
		 *     "beforeEnd" inserts the cloned content inside referenceNode after its last child.
		 *     "afterEnd" inserts the cloned content after referenceNode.
		 * @returns {Array.<Node>} Child nodes of the cloned content.
		 * @throws {SyntaxError} If the position is not one of "beforeBegin", "afterBegin", "beforeEnd", "afterEnd".
		 */
		insert: function (content, referenceNode, position) {
			/**
			 * Child nodes of the cloned content.
			 * @type {Array.<Node>}
			 */
			var childNodes = [].slice.call(content.childNodes);
			switch (position) {
			case "beforeBegin":
				referenceNode.parentNode.insertBefore(content, referenceNode);
				break;
			case "afterBegin":
				referenceNode.insertBefore(content, referenceNode.firstChild);
				break;
			case "beforeEnd":
				referenceNode.appendChild(content);
				break;
			case "afterEnd":
				referenceNode.parentNode.insertBefore(content, referenceNode.nextSibling);
				break;
			default:
				throw new SyntaxError("Invalid value for insertion position: " + position);
			}
			return childNodes;
		},

		/**
		 * Binds parsed node conents and element attributes to the corresponding {@link BindingSource}.
		 * @param {Array} toBeBound
		 *     The parsed list of (node in instantiated template, attribute name, attribute value, {@link BindingSource}) with data binding syntax.
		 * @returns {Array.<module:liaison/BindingTarget>}
		 *     The list of data bindings for the parsed node contents and element attributes.
		 */
		bind: function (toBeBound) {
			/**
			 * The list of data bindings for the parsed node contents and element attributes.
			 * @type {Array.<module:liaison/BindingTarget>}
			 */
			var bound = [];
			for (var i = 0, l = toBeBound.length; i < l; i += PARSED_ENTRY_LENGTH) {
				var name = toBeBound[i + PARSED_ENTRY_ATTRIBUTENAME],
					source = toBeBound[i + PARSED_ENTRY_SOURCE];
				if (typeof (source || EMPTY_OBJECT).observe === "function") {
					bound.push(toBeBound[i + PARSED_ENTRY_NODE].bind(name, source));
				} else {
					console.warn("The specified binding source " + source + " does not have BindingSource interface. Ignoring.");
				}
			}
			return bound;
		},

		/**
		 * Stamp out template content with data binding.
		 * @method
		 * @param {Object} model The data model for the template.
		 * @param {HTMLElement} referenceNode
		 *     The element position refers to, that determines where the stamped out template content is inserted into.
		 * @param {string} position
		 *     The position relative to referenceNode,
		 *     that determines where the stamped out template contents is inserted into,
		 *     and must be one of the following strings:
		 *     "beforeBegin" inserts the cloned content before referenceNode.
		 *     "afterBegin" inserts the cloned content inside referenceNode before its first child.
		 *     "beforeEnd" inserts the cloned content inside referenceNode after its last child.
		 *     "afterEnd" inserts the cloned content after referenceNode.
		 * @returns {TemplateBinder} This object.
		 */
		create: (function () {
			function remove(bound) {
				for (var target = null; (target = bound.shift());) {
					target.remove();
				}
				for (var node; (node = this.childNodes.pop());) {
					if (node.parentNode) {
						node.parentNode.removeChild(node);
					}
				}
			}
			return function (model, referenceNode, position) {
				this.parsed = this.parsed || this.parseNode(this.template.content);
				var toBeBound = [],
					content = this.createContent(this.parsed, toBeBound);
				this.assignSources(model, toBeBound);
				var instantiated = {
					childNodes: this.insert(content, referenceNode, position)
				};
				instantiated.remove = remove.bind(instantiated, this.bind(toBeBound));
				return instantiated;
			};
		})()
	};

	(function () {
		function EventBindingTarget(object, property) {
			this.object = object;
			var tokens = REGEXP_DECLARATIVE_EVENT.exec(this.property = property);
			if (!tokens) {
				throw new Error("Property name " + this.property + " is not suitable for EventBindingTarget.");
			}
			this.eventName = tokens[1];
		}

		// Not inherting the entire BindingTarget, just BindingTarget#bind for observation
		EventBindingTarget.prototype = {
			bind: BindingTarget.prototype.bind,
			remove: function () {
				if (this.handler) {
					this.object.removeEventListener(this.eventName, this.handler);
				}
				if (this.h) {
					this.h.remove();
					this.h = null;
				}
			}
		};

		Object.defineProperty(EventBindingTarget.prototype, "value", {
			get: function () {
				return this.handler;
			},
			set: (function () {
				function decoratedHandler(handler, event) {
					handler(event, event.detail, this);
				}
				return function (value) {
					if (this.handler) {
						this.object.removeEventListener(this.eventName, this.handler);
					}
					if (value != null) {
						if (typeof value === "function") {
							this.object.addEventListener(this.eventName, this.handler = decoratedHandler.bind(this.object, value));
						} else {
							console.warn("A non-function (" + value + ") is assigned to EventBindingTarget's value. Ignoring.");
						}
					}
				};
			})(),
			enumeable: true,
			configurable: true
		});

		var EventBindingSource = (function () {
			function declarativeEventFormatter(fn) {
				return fn.bind(this);
			}
			return function (o, path, node, name) {
				this.source = new ObservablePath(o, path, declarativeEventFormatter.bind(o));
				this.node = node;
				this.name = name;
				this.handles = [];
			};
		})();

		EventBindingSource.prototype = {
			observe: function () {
				var h = new EventBindingTarget(this.node, this.name).bind(this.source);
				this.handles.push(h);
				return h;
			},
			open: function (callback, thisObject) {
				this.callbacks.splice(0, this.callbacks.length);
				this.observe(callback.bind(thisObject));
				return this.getFrom();
			},
			deliver: function () {
				this.source.deliver();
			},
			discardChanges: function () {
				this.source.discardChanges();
				return this.getFrom();
			},
			getFrom: function () {
				return this.node.getAttribute(this.name);
			},
			setTo: function () {},
			setValue: function () {}
		};

		EventBindingSource.prototype.remove = EventBindingSource.prototype.close = function () {
			for (var h; (h = this.handles.shift());) {
				h.remove();
			}
		};

		var origCreateBindingSourceFactory = BindingTarget.createBindingSourceFactory;
		BindingTarget.createBindingSourceFactory = function (path, name) {
			var factory = origCreateBindingSourceFactory && origCreateBindingSourceFactory.apply(this, arguments);
			if (!factory) {
				var tokens = REGEXP_DECLARATIVE_EVENT.exec(name);
				if (tokens) {
					return function (model, node) {
						return new EventBindingSource(model, path, node, name);
					};
				}
			} else {
				return factory;
			}
		};
	})();

	return TemplateBinder;
});
