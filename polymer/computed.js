/**
 * Polymer version of {@link module:liaison/computed liaison/computed}.
 * @module liaison/polymer/computed
 * @mixes module:liaison/computed
 */
define([
	"../computed",
	"./ready!"
], function (computed) {
	(function () {
		/* global HTMLTemplateElement */
		var origCreateInstance = HTMLTemplateElement.prototype.createInstance;
		HTMLTemplateElement.prototype.createInstance = (function () {
			/* jshint camelcase: false */
			function overrideCloseInstanceBindings(iterator) {
				if (!iterator._closeInstanceBindingsOverriden) {
					var origCloseInstanceBindings = iterator.closeInstanceBindings;
					iterator.closeInstanceBindings = function (instanceBindings) {
						if (!this.templateElement_.preventRemoveComputed && instanceBindings.computed) {
							for (var c; (c = instanceBindings.computed.shift());) {
								c.remove();
							}
						}
						origCloseInstanceBindings.apply(this, arguments);
					};
				}
				iterator._closeInstanceBindingsOverriden = true;
			}
			return function (model, bindingDelegate, bindingDelegateInitialized, instanceBindings) {
				var instance = origCreateInstance.call(this, model, bindingDelegate, bindingDelegateInitialized, instanceBindings);
				if (instanceBindings) {
					// Activate computed property only if template itself can clean them up
					// Alternatively <polymer-element> can manage computed property
					instanceBindings.computed = computed.apply(model);
					overrideCloseInstanceBindings(this.bindings.iterator);
				}
				return instance;
			};
		})();
	})();

	/* global Polymer */
	if (typeof Polymer !== "undefined" && Polymer.api) {
		(function () {
			var origCreatedCallback = Polymer.api.instance.base.createdCallback,
				origUnbindAll = Node.prototype.unbindAll;
			Polymer.api.instance.base.createdCallback = function () {
				var applied = computed.apply(this);
				if (applied.length > 0) {
					this.computed = applied;
				}
				origCreatedCallback.apply(this, arguments);
			};
			Node.prototype.unbindAll = function () {
				if (this.computed) {
					for (var c; (c = this.computed.shift());) {
						c.remove();
					}
					this.computed = null;
				}
				origUnbindAll.apply(this, arguments);
			};
		})();
	}

	return computed;
});
