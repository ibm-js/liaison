/**
 * @module liaison/templateBinder
 * @private
 */
define([
	"./ObservablePath",
	"./BindingSourceList",
	"./DOMBindingTarget",
	"./alternateBindingSource"
], function (ObservablePath, BindingSourceList) {
	"use strict";

	var EMPTY_OBJECT = {},
		REGEXP_TEMPLATE_TYPE = /template$/i,
		ATTRIBUTE_IF = "if",
		ATTRIBUTE_BIND = "bind",
		ATTRIBUTE_REPEAT = "repeat",
		MUSTACHE_BEGIN = "{{",
		MUSTACHE_BEGIN_LENGTH = 2,
		MUSTACHE_END = "}}",
		MUSTACHE_END_LENGTH = 2,
		MUSTACHES_LENGTH = 4,
		PARSED_ENTRY_LENGTH = 4,
		PARSED_ENTRY_NODE = 0,
		PARSED_ENTRY_ATTRIBUTENAME = 1,
		PARSED_ENTRY_ATTRIBUTEVALUE = 2,
		PARSED_ENTRY_SOURCE = 3,
		forEach = [].forEach;

	function tokenize(text) {
		var index = 0,
			tokens = [];
		while (true) {
			var begin = text.indexOf(MUSTACHE_BEGIN, index);
			if (begin < 0) {
				break;
			}
			var end = text.indexOf(MUSTACHE_END, begin + MUSTACHE_BEGIN_LENGTH);
			if (end < 0) {
				break;
			}
			tokens.push(text.substring(index, begin));
			var targetToken = text.substring(begin, index = end + MUSTACHE_END_LENGTH);
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
	 * @class module:liaison/templateBinder
	 * @private
	 * @param {HTMLTemplateElement} template The template to stamp out.
	 */
	var templateBinder = /** @lends module:liaison/templateBinder */ {
		/**
		 * Finds attributes with data binding syntax.
		 * @param {Node} node The root node to parse from.
		 * @returns {Array} The parsed list of (node, attribute name, attribute value, empty) with data binding syntax.
		 */
		parseNode: function (node) {
			var currentNode,
				parsed = [],
				iterator = node.ownerDocument.createNodeIterator(
					node,
					NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
					null,
					false);
			while ((currentNode = iterator.nextNode())) {
				if (currentNode.nodeType === Node.ELEMENT_NODE) {
					forEach.call(currentNode.attributes, function (attribute) {
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
					});
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
			var imported,
				isBroadTemplate = node.tagName === "TEMPLATE"
					|| node.tagName === "template" && node.namespaceURI === "http://www.w3.org/2000/svg"
					|| node.tagName === "SCRIPT" && REGEXP_TEMPLATE_TYPE.test(node.type);

			if (!isBroadTemplate && node.nodeType === Node.ELEMENT_NODE && node.hasAttribute("template")) {
				imported = doc.createElement("template");
				if (!imported.content) {
					imported.content = doc.createDocumentFragment();
				}
				var root = imported.content.appendChild(doc.importNode(node, true));
				root.removeAttribute("template");
				root.removeAttribute(ATTRIBUTE_IF);
				root.removeAttribute(ATTRIBUTE_BIND);
				root.removeAttribute(ATTRIBUTE_REPEAT);
			} else {
				imported = doc.importNode(node, !!isBroadTemplate);
				if (isBroadTemplate) {
					// For non-native template, let recursive clone of node (above) copy the template content,
					// for native template, do that by copying innerHTML
					if (imported.content) {
						imported.innerHTML = node.innerHTML;
					}
					imported.upgradeToTemplate(); // To prevent parsed -> toBeBound copy for template contents
				} else {
					for (var child = node.firstChild; child; child = child.nextSibling) {
						imported.appendChild(templateBinder.importNode(doc, child, parsed, toBeBound));
					}
				}
			}

			for (var parsedIndex = 0; (parsedIndex = parsed.indexOf(node, parsedIndex)) >= 0; parsedIndex += PARSED_ENTRY_LENGTH) {
				toBeBound.push(
					imported,
					parsed[parsedIndex + PARSED_ENTRY_ATTRIBUTENAME],
					parsed[parsedIndex + PARSED_ENTRY_ATTRIBUTEVALUE],
					parsed[parsedIndex + PARSED_ENTRY_SOURCE]);
			}

			return imported;
		},

		/**
		 * Creates a clone of the content of this {@link module:liaison/templateBinder#template template}.
		 * @param {HTMLTemplateElement} template The `<template>` to stamp out the content from.
		 * @param {Array} parsed
		 *     The parsed list of (node in template, attribute name, attribute value, empty) with data binding syntax.
		 * @param {Array} toBeBound
		 *     The parsed list of (node in instantiated template, attribute name, attribute value, empty) with data binding syntax.
		 * @returns {DocumentFragment} The instantiated content of template.
		 */
		createContent: function (template, parsed, toBeBound) {
			return templateBinder.importNode(template.ownerDocument, template.content, parsed, toBeBound);
		},

		/**
		 * Go through parsed data binding syntax and assign {@link module:liaison/BindingSource BindingSource} to each entries.
		 * @param {Object} model The data model for the template.
		 * @param {Array} toBeBound
		 *     The parsed list of (node in instantiated template, attribute name, attribute value,
		 *     assinged {@link module:liaison/BindingSource BindingSource}) with data binding syntax.
		 * @param {Function} [createBindingSourceFactory]
		 *     A function that takes object path of the model and target attribute name as parameters
		 *     and returns a function to create the binding source given a model and a DOM node.
		 */
		assignSources: function (model, toBeBound, createBindingSourceFactory) {
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
					tokens = tokenize(value);
				if (tokens.length === 3 && !tokens[0] && !tokens[2]) {
					path = tokens[1].substr(MUSTACHE_BEGIN_LENGTH, tokens[1].length - MUSTACHES_LENGTH).trim();
					factory = createBindingSourceFactory && createBindingSourceFactory.call(this, path, name);
					toBeBound[iToBeBound + PARSED_ENTRY_SOURCE] = factory ? factory(model, node) : new ObservablePath(model, path);
				} else {
					var list = [],
						texts = [];
					for (var iToken = 0, lToken = tokens.length; iToken < lToken; ++iToken) {
						if (iToken % 2 === 0) {
							texts.push(tokens[iToken]);
						} else {
							path = tokens[iToken].substr(MUSTACHE_BEGIN_LENGTH, tokens[iToken].length - MUSTACHES_LENGTH).trim();
							factory = createBindingSourceFactory && createBindingSourceFactory.call(this, path, name);
							list.push(factory ? factory(model, node) : new ObservablePath(model, path));
						}
					}
					toBeBound[iToBeBound + PARSED_ENTRY_SOURCE] = new BindingSourceList(list, tokensFormatter.bind(texts));
				}
			}
		},

		/**
		 * Binds parsed node conents and element attributes to the corresponding {@link module:liaison/BindingSource BindingSource}.
		 * @param {Array} toBeBound
		 *     The parsed list of (node in instantiated template, attribute name, attribute value,
		 *     {@link module:liaison/BindingSource BindingSource}) with data binding syntax.
		 * @returns {Array.<module:liaison/BindingTarget>}
		 *     The list of data bindings for the parsed node contents and element attributes.
		 */
		bind: function (toBeBound) {
			var bound = [];
			for (var i = 0, l = toBeBound.length; i < l; i += PARSED_ENTRY_LENGTH) {
				var name = toBeBound[i + PARSED_ENTRY_ATTRIBUTENAME],
					source = toBeBound[i + PARSED_ENTRY_SOURCE];
				if (typeof (source || EMPTY_OBJECT).observe === "function" || typeof (source || EMPTY_OBJECT).open === "function") {
					bound.push(toBeBound[i + PARSED_ENTRY_NODE].bind(name, source));
				} else {
					console.warn("The specified binding source " + source + " does not have BindingSource interface. Ignoring.");
				}
			}
			return bound;
		}
	};

	return templateBinder;
});
