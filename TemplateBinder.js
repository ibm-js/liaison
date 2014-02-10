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

	var REGEXP_TEMPLATE_TYPE = /template$/i,
		ATTRIBUTE_IF = "if",
		ATTRIBUTE_BIND = "bind",
		ATTRIBUTE_REPEAT = "repeat",
		MUSTACHE_BEGIN = "{{",
		MUSTACHE_BEGIN_LENGTH = 2,
		MUSTACHE_END = "}}",
		MUSTACHES_LENGTH = 4,
		PARSED_ENTRY_LENGTH = 3,
		PARSED_ENTRY_NODE = 0,
		PARSED_ENTRY_ATTRIBUTENAME = 1,
		PARSED_ENTRY_ATTRIBUTEVALUE = 2;

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

	function tokensFormatter(texts, values) {
		var tokens = [];
		for (var i = 0, l = texts.length; i < l; ++i) {
			tokens.push(texts[i], values[i] != null ? values[i] : "");
		}
		return tokens.join("");
	}

	/**
	 * A class working as an internal logic of {external:HTMLTemplateElement#bind HTMLTemplateElement.bind()}
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
		 * Creates a clone of the content of this {@link module:liaison/TemplateBinder#template template}.
		 */
		createContent: function () {
			/**
			 * Cloned content of this {@link module:liaison/TemplateBinder#template template}.
			 * @type {external:Node}
			 * @returns {HTMLElement} The cloned template content.
			 */
			this.content = templateElement.upgradeChildren(this.template.content.cloneNode(true));
			return this.content;
		},

		/**
		 * Finds attributes with data binding syntax.
		 * @param {Node} node The root node to parse from.
		 * @returns {Array} The parsed list of (node, attribute name, attribute value) with data binding syntax.
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
			this.parsed = this.parsed || [];
			var currentNode,
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
							this.parsed.push(currentNode, attribute.name, attribute.value);
							var isTemplate = currentNode.tagName === "TEMPLATE"
								|| currentNode.hasAttribute("template")
								|| currentNode.tagName === "SCRIPT"
									&& REGEXP_TEMPLATE_TYPE.test(currentNode.getAttribute("type"));
							// Treat <template if="{{property}}"> as <template if="{{property}}" bind="{{}}">
							if (isTemplate
								&& attribute.name.toLowerCase() === ATTRIBUTE_IF
								&& !currentNode.getAttribute(ATTRIBUTE_BIND)
								&& !currentNode.getAttribute(ATTRIBUTE_REPEAT)) {
								this.parsed.push(currentNode, ATTRIBUTE_BIND, "{{}}");
							}
						}
					}
				} else if (currentNode.nodeType === Node.TEXT_NODE) {
					if (currentNode.nodeValue.indexOf(MUSTACHE_BEGIN) >= 0) {
						this.parsed.push(currentNode, "nodeValue", currentNode.nodeValue);
					}
				}
			}
			return this.parsed;
		},

		/**
		 * Creates a hash table, keyed by attribute value with data binding syntax,
		 * of {@link BindingSource} associated with it.
		 * @param {Object} model The data model for the template.
		 * @returns {Object} The hash table created.
		 */
		createSources: function (model) {
			// Given this function works as a low-level one,
			// it preferes regular loop over array extras,
			// which makes cyclomatic complexity higher.
			/* jshint maxcomplexity: 15 */
			/**
			 * The hash table, keyed by attribute value with data binding syntax,
			 * of {@link BindingSource} associated with it.
			 * @type {Object}
			 */
			this.sources = {};
			for (var factories = {}, parsedIndex = 0, parsedLength = this.parsed.length;
					parsedIndex < parsedLength;
					parsedIndex += PARSED_ENTRY_LENGTH) {
				var path,
					factory,
					value = this.parsed[parsedIndex + PARSED_ENTRY_ATTRIBUTEVALUE],
					tokens = tokenize(value),
					createBindingSourceFactory
						= this.template.createBindingSourceFactory || BindingTarget.createBindingSourceFactory;
				if (tokens.length === 3 && !tokens[0] && !tokens[2]) {
					path = tokens[1].substr(MUSTACHE_BEGIN_LENGTH, tokens[1].length - MUSTACHES_LENGTH).trim();
					if (!this.sources[value]) {
						factory = !createBindingSourceFactory ? undefined :
							path in factories ? factories[path] :
							(factories[path] = createBindingSourceFactory(path));
						this.sources[value] = factory ? factory(model) : new ObservablePath(model, path);
					}
				} else {
					var list = [],
						texts = [];
					for (var tokenIndex = 0, tokenLength = tokens.length; tokenIndex < tokenLength; ++tokenIndex) {
						if (tokenIndex % 2 === 0) {
							texts.push(tokens[tokenIndex]);
						} else {
							path = tokens[tokenIndex].substr(
								MUSTACHE_BEGIN_LENGTH,
								tokens[tokenIndex].length - MUSTACHES_LENGTH).trim();
							factory = !createBindingSourceFactory ? undefined :
								path in factories ? factories[path] :
								(factories[path] = createBindingSourceFactory(path));
							list.push(factory ? factory(model) : new ObservablePath(model, path));
						}
					}
					if (!this.sources[value]) {
						this.sources[value] = new BindingSourceList(list, tokensFormatter.bind(undefined, texts));
					}
				}
			}
			return this.sources;
		},

		/**
		 * Inserts the cloned content into the specified position.
		 * @param referenceNode {HTMLElement} referenceNode The element position refers to.
		 * @param {string} position
		 *     The position relative to referenceNode, and must be one of the following strings:
		 *     "beforeBegin" inserts the cloned content before referenceNode.
		 *     "afterBegin" inserts the cloned content inside referenceNode before its first child.
		 *     "beforeEnd" inserts the cloned content inside referenceNode after its last child.
		 *     "afterEnd" inserts the cloned content after referenceNode.
		 * @returns {Array.<external:Node>} Child nodes of the cloned content.
		 * @throws {SyntaxError} If the position is not one of "beforeBegin", "afterBegin", "beforeEnd", "afterEnd".
		 */
		insert: function (referenceNode, position) {
			/**
			 * Child nodes of the cloned content.
			 * @type {Array.<external:Node>}
			 */
			this.childNodes = [].slice.call(this.content.childNodes);
			switch (position) {
			case "beforeBegin":
				referenceNode.parentNode.insertBefore(this.content, referenceNode);
				break;
			case "afterBegin":
				referenceNode.insertBefore(this.content, referenceNode.firstChild);
				break;
			case "beforeEnd":
				referenceNode.appendChild(this.content);
				break;
			case "afterEnd":
				referenceNode.parentNode.insertBefore(this.content, referenceNode.nextSibling);
				break;
			default:
				throw new SyntaxError("Invalid value for insertion position: " + position);
			}
			return this.childNodes;
		},

		/**
		 * Binds parsed node conents and element attributes to the corresponding {@link BindingSource}.
		 * @returns {Array.<module:liaison/BindingTarget>}
		 *     The list of data bindings for the parsed node contents and element attributes.
		 */
		bind: function () {
			/**
			 * The list of data bindings for the parsed node contents and element attributes.
			 * @type {Array.<module:liaison/BindingTarget>}
			 */
			this.bound = [];
			for (var i = 0, l = this.parsed.length; i < l; i += PARSED_ENTRY_LENGTH) {
				var source = this.sources[this.parsed[i + PARSED_ENTRY_ATTRIBUTEVALUE]];
				if (source) {
					this.bound.push(
						this.parsed[i + PARSED_ENTRY_NODE].bind(
							this.parsed[i + PARSED_ENTRY_ATTRIBUTENAME],
							source));
				}
			}
			return this.bound;
		},

		/**
		 * Stamp out template content with data binding.
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
		create: function (model, referenceNode, position) {
			this.createContent();
			this.parseNode(this.content);
			this.createSources(model);
			this.insert(referenceNode, position);
			this.bind();
			return this;
		},

		/**
		 * Stops data binding, and removes stamped out template content from DOM.
		 */
		remove: function () {
			if (this.bound) {
				for (var target = null; (target = this.bound.shift());) {
					target.remove();
				}
			}
			if (this.childNodes) {
				for (var node; (node = this.childNodes.pop());) {
					if (node.parentNode) {
						node.parentNode.removeChild(node);
					}
				}
			}
		}
	};

	return TemplateBinder;
});