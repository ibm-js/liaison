/**
 * A module to let Polymer aware of Liaison's {@link BindingSource} and createBindingSourceFactory interfaces.
 * @module liaison/polymer/prepareBinding
 */
define([
	"../Observable",
	"../ObservablePath",
	"../BindingTarget"
], function (Observable, ObservablePath, BindingTarget) {
	"use strict";

	var EMPTY_OBJECT = {};

	/**
	 * An implementation of Polymer's bindingDelegate API
	 * to let data binding handle Liaison's {@link BindingSource} and createBindingSourceFactory interfaces.
	 * @function module:liaison/Polymer/prepareBinding
	 * @param {string} expression What's in "{{}}" of attribute="{{property}}" syntax.
	 * @returns {external:PathObserver} The {@link external:PathObserver PathObserver} a DOM node should be bound to.
	 */
	function prepareBinding(expression) {
		/* global PathObserver */
		/* jshint validthis: true */
		var createBindingSourceFactory = this.createBindingSourceFactory || BindingTarget.createBindingSourceFactory,
			bindingSourceFactory = createBindingSourceFactory && createBindingSourceFactory(expression);

		return function (model) {
			var found = bindingSourceFactory || typeof (model || EMPTY_OBJECT).observe === "function";
			if (!found) {
				var o = model,
					comps = expression.split(".");
				for (var i = 0, l = comps.length; i < l; ++i) {
					o = (model || EMPTY_OBJECT)[comps[i]];
					if (typeof (o || EMPTY_OBJECT).observe === "function") {
						found = true;
						break;
					}
				}
			}
			return !found ? new PathObserver(model, expression) :
				bindingSourceFactory ? bindingSourceFactory(model) :
				new ObservablePath(model, expression);
		};
	}

	/* global HTMLTemplateElement */
	var origCreateInstance = HTMLTemplateElement.prototype.createInstance;
	HTMLTemplateElement.prototype.createInstance = function (model, bindingDelegate) {
		var args = [].slice.call(arguments, 2);
		args.unshift(model, bindingDelegate || {prepareBinding: prepareBinding.bind(this)});
		return origCreateInstance.apply(this, args);
	};

	return prepareBinding;
});
