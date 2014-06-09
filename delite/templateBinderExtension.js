/**
 * A module to make {@link HTMLTemplateElement#bind}, etc. upgrade delite widgets in stamped out template content,
 * and to support data binding between widget property/attribute and {@link module:liaison/BindingSource BindingSource}.
 * @module liaison/delite/templateBinderExtemsion
 * @private
 */
define([
	"dojo/has",
	"delite/register",
	"../schedule",
	"../templateBinder",
	"../DOMTreeBindingTarget",
	"./WidgetBindingTarget"
], function (has, register, schedule, templateBinder) {
	"use strict";

	var slice = [].slice;

	// If document.register() is there, upgradable elements will be upgraded automatically.
	// "document-register" has() flag is tested in delite/register.
	if (!has("document-register") && typeof Node !== "undefined") {
		var origImportNode = templateBinder.importNode;
		templateBinder.importNode = function () {
			var imported = origImportNode.apply(this, arguments);
			if (imported.nodeType === Node.ELEMENT_NODE) {
				register.upgrade(imported);
				if (imported.startup && !imported._started) {
					schedule(imported.startup.bind(imported));
				}
			}
			return imported;
		};
	}

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

	/* global HTMLTemplateElement, HTMLUnknownElement */
	has.add("polymer-createInstance",
		typeof HTMLTemplateElement !== "undefined" && typeof HTMLTemplateElement.prototype.createInstance === "function");
	if (!has("polymer-createInstance")) {
		var list = [typeof HTMLTemplateElement !== "undefined" ? HTMLTemplateElement : HTMLUnknownElement, HTMLScriptElement];
		typeof Element !== "undefined" && list.push(Element); // <template> in <svg>
		typeof SVGElement !== "undefined" && list.push(SVGElement); // <template> in <svg>
		list.forEach(function (ElementClass) {
			var origInstantiate = ElementClass.prototype.instantiate;
			ElementClass.prototype.instantiate = function () {
				var instantiated = origInstantiate.apply(this, arguments);
				instantiated.remove = remove.bind(instantiated, instantiated.remove);
				return instantiated;
			};
		});
	}

	return templateBinder;
});
