/**
 * A module to make {@link HTMLTemplateElement#bind}, etc. upgrade delite widgets in stamped out template content,
 * and to support data binding between widget property/attribute and {@link module:liaison/BindingSource BindingSource}.
 * @module liaison/delite/templateBinderExtemsion
 * @private
 */
define([
	"delite/register",
	"../features",
	"../schedule",
	"../templateBinder",
	"../DOMTreeBindingTarget",
	"./WidgetBindingTarget"
], function (register, has, schedule, templateBinder) {
	"use strict";

	var slice = [].slice;

	// Cope with the case where delite widget does not run `attachedCallback()`
	// Refs:
	// https://github.com/ibm-js/delite/blame/0.8.2/docs/architecture.md#L76
	// https://github.com/ibm-js/delite/blob/0.8.2/Container.js#L102-L108
	function attached(node) {
		if (node.ownerDocument.documentElement.contains(node) && typeof node.attachedCallback === "function" && !node.attached) {
			node.attachedCallback();
		}
		for (var child = node.firstChild; child; child = child.nextSibling) {
			attached(child);
		}
	}

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

		var origInsertBefore = templateBinder.insertBefore;
		templateBinder.insertBefore = function () {
			var result = origInsertBefore.apply(this, arguments);
			for (var i = 0, l = this.childNodes.length; i < l; ++i) {
				attached(this.childNodes[i]);
			}
			return result;
		};
	}

	function remove(origRemove) {
		this.childNodes.forEach(function (node) {
			var currentNode,
				iterator = node.ownerDocument.createNodeIterator(node, NodeFilter.SHOW_ELEMENT, null, false);
			while ((currentNode = iterator.nextNode())) {
				if (typeof currentNode.render === "function") {
					currentNode.destroy();
				}
			}
		});
		origRemove.apply(this, slice.call(arguments, 1));
	}

	/* global HTMLTemplateElement, HTMLUnknownElement */
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
