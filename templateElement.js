define(function () {
	"use strict";

	var EMPTY_OBJECT = {},
		REGEXP_TEMPLATE_TYPE = /template$/i;

	/** @exports liaison/templateElement */
	var templateElement = {
		/**
		 * @param  {string} string [description]
		 * @param  {Document} [ownerDocument] The document object the new template element should be created from.
		 * @return {HTMLTemplateElement} The template element given the template string.
		 */
		create: function (string, ownerDocument) {
			var element = (ownerDocument || document).createElement("template");
			element.innerHTML = string;
			return templateElement.upgrade(element);
		},

		/**
		 * Make template element or script element (with type="x-template") act like native template element,
		 * by adding {@link https://dvcs.w3.org/hg/webcomponents/raw-file/default/spec/templates/index.html#dfn-template-contents .content property}.
		 * @param {HTMLElement} element The template element or script element to upgrade.
		 * @returns {HTMLElement} The upgraded template element or script element.
		 */
		upgrade: (function () {
			function isUpgradable(node) {
				return node.tagName === "TEMPLATE"
					|| node.hasAttribute("template")
					|| node.tagName === "SCRIPT" && REGEXP_TEMPLATE_TYPE.test(node.getAttribute("type"));
			}
			return function (element) {
				if (!isUpgradable(element)) {
					throw new TypeError("Only <template>, <element template>,"
						+ " or <script type=\"x-template\"> can be used as a template.");
				}
				var template = element;
				if (template.tagName === "SCRIPT") {
					(template = element.ownerDocument.createElement("template")).innerHTML = element.innerHTML;
				}
				var isNativeTemplate = (template.content || EMPTY_OBJECT).nodeType === Node.DOCUMENT_FRAGMENT_NODE;
				if (!isNativeTemplate) {
					var frag = template.ownerDocument.createDocumentFragment();
					while (template.firstChild) {
						frag.appendChild(template.firstChild);
					}
					element.content = frag;
				} else if (template !== element) {
					element.content = template.content.cloneNode(true);
				}
				return element;
			};
		})(),

		/**
		 * Find template elements and script elements (with type="x-template") under the given element
		 * and call {@link module:liaison/templateElement.upgrade templateElement.upgrade()} for them,
		 * but do so only in one level.
		 * @param {Node} node The node to search template elements and script elements from.
		 * @returns {Node} The given node.
		 */
		upgradeChildren: function (node) {
			if (node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
				if (node.nodeType === Node.ELEMENT_NODE
					&& (node.tagName === "TEMPLATE"
						|| node.hasAttribute("template")
						|| node.tagName === "SCRIPT" && REGEXP_TEMPLATE_TYPE.test(node.getAttribute("type")))) {
					templateElement.upgrade(node);
				} else {
					for (var child = node.firstChild; child; child = child.nextSibling) {
						templateElement.upgradeChildren(child);
					}
				}
			}
			return node;
		}
	};

	return templateElement;
});
