/**
 * A module to make {@link HTMLTemplateElement#bind}, etc. upgrade delite widgets in stamped out template content,
 * and to support data binding between widget property/attribute and {@link module:liaison/BindingSource BindingSource}.
 * @module liaison/delite/TemplateBinderExtemsion
 * @private
 */
define([
	"dojo/has",
	"delite/register",
	"../schedule",
	"../TemplateBinder",
	"../DOMTreeBindingTarget",
	"./WidgetBindingTarget"
], function (has, register, schedule, TemplateBinder) {
	"use strict";

	var slice = [].slice;

	// If document.register() is there, upgradable elements will be upgraded automatically.
	// "document-register" has() flag is tested in delite/register.
	if (!has("document-register")) {
		var origImportNode = TemplateBinder.prototype.importNode;
		TemplateBinder.prototype.importNode = function () {
			var imported = origImportNode.apply(this, arguments);
			if (imported.nodeType === Node.ELEMENT_NODE) {
				register.upgrade(imported);
				if (imported.startup && !imported._started) {
					schedule(imported.startup.bind(imported));
				}
			}
			return imported;
		};

		var origCreate = TemplateBinder.prototype.create;
		TemplateBinder.prototype.create = (function () {
			function remove(origRemove) {
				this.childNodes.forEach(function (node) {
					var currentNode,
						iterator = node.ownerDocument.createNodeIterator(node, NodeFilter.SHOW_ELEMENT, null, false);
					while ((currentNode = iterator.nextNode())) {
						if (typeof currentNode.buildRendering === "function") {
							currentNode.destroy();
						}
					}
				});
				origRemove.apply(this, slice.call(arguments, 1));
			}
			return function () {
				var letTemplateCreateInstance = typeof this.template.createInstance === "function",
					instantiated = origCreate.apply(this, arguments);
				if (!letTemplateCreateInstance) {
					instantiated.remove = remove.bind(instantiated, instantiated.remove);
				}
				return instantiated;
			};
		})();
	}

	return TemplateBinder;
});
