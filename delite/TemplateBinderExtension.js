/**
 * A module to make {@link HTMLTemplateElement#bind}, etc. upgrade delite widgets in stamped out template content,
 * and to support data binding between widget property/attribute and {@link BindingSource}.
 * @module liaison/delite/TemplateBinderExtemsion
 * @private
 */
define([
	"dojo/has",
	"delite/register",
	"../TemplateBinder",
	"../DOMTreeBindingTarget",
	"./WidgetBindingTarget"
], function (has, register, TemplateBinder) {
	"use strict";

	var origRemove = TemplateBinder.prototype.remove;

	// If document.register() is there, upgradable elements will be upgraded automatically.
	// "document-register" has() flag is tested in delite/register.
	if (!has("document-register")) {
		TemplateBinder.prototype.create = function (model, referenceNode, position) {
			this.createContent();
			this.parseNode(this.content);
			this.createSources(model);
			this.insert(referenceNode, position);
			for (var i = 0, l = this.childNodes.length; i < l; ++i) {
				if (this.childNodes[i].nodeType === Node.ELEMENT_NODE) {
					// Try to upgrade the root node.
					// register.upgrade() gracefully ignores elements that are not upgradable.
					register.upgrade(this.childNodes[i]);
					register.parse(this.childNodes[i]);
				}
			}
			this.bind();
			return this;
		};
	}

	TemplateBinder.prototype.remove = function () {
		for (var i = 0, l = this.childNodes.length; i < l; ++i) {
			var currentNode,
				iterator = this.childNodes[i].ownerDocument.createNodeIterator(
					this.childNodes[i],
					NodeFilter.SHOW_ELEMENT,
					null,
					false);
			while ((currentNode = iterator.nextNode())) {
				if (typeof currentNode.buildRendering === "function") {
					currentNode.destroy();
				}
			}
		}
		origRemove.apply(this, arguments);
	};

	return TemplateBinder;
});
