define(["liaison/ObservablePath"], function (ObservablePath) {
	"use strict";

	var EMPTY_OBJECT = {},
		REGEXP_DECLARATIVE_EVENT = /^on\-(.+)$/i;

	function EventBindingSource(object, path, node, name) {
		this.object = object;
		this.path = path;
		this.node = node;
		this.name = name;
	}

	EventBindingSource.prototype = {
		open: (function () {
			function on(elem, name, callback) {
				elem.addEventListener(name, callback);
				return {
					remove: elem.removeEventListener.bind(elem, name, callback)
				};
			}
			function handleEvent(event) {
				for (var fn, model = this.object, instanceData = this.node.instanceData;
					typeof (fn = ObservablePath.getObjectPath(model, this.path)) !== "function" && instanceData;
					model = instanceData.model, instanceData = instanceData.instanceData) {}
				if (typeof fn === "function") {
					fn.call(model, event, event.detail, this.node);
				} else {
					console.warn("Event handler function " + this.path + " not found.");
				}
			}
			return function () {
				this.callback = handleEvent.bind(this);
				this.h = on(this.node, REGEXP_DECLARATIVE_EVENT.exec(this.name)[1], this.callback);
				return this.node.getAttribute(this.name);
			};
		})(),
		deliver: function () {},
		discardChanges: function () {
			return this.callback;
		},
		setValue: function () {},
		close: function () {
			if (this.h) {
				this.h.remove();
				this.h = null;
			}
		}
	};

	var origCreateBindingSourceFactory = Element.prototype.createBindingSourceFactory;
	Element.prototype.createBindingSourceFactory = function (path, name) {
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

	(function () {
		/* global HTMLTemplateElement */
		function getInstanceData() {
			return this.instanceData;
		}
		if (typeof HTMLTemplateElement !== "undefined") {
			if (typeof HTMLTemplateElement.prototype.createInstance === "function") {
				var origCreateInstance = HTMLTemplateElement.prototype.createInstance;
				HTMLTemplateElement.prototype.createInstance = (function () {
					function prepareBinding(createBindingSourceFactory, bindingDelegate, path, name) {
						return createBindingSourceFactory && createBindingSourceFactory(path, name)
							|| (bindingDelegate || EMPTY_OBJECT).prepareBinding && bindingDelegate.prepareBinding(path, name);
					}
					return function (model, bindingDelegate) {
						var args = [].slice.call(arguments),
							delegate = Object.create(bindingDelegate || null);
						delegate.prepareBinding = prepareBinding.bind(delegate, this.createBindingSourceFactory, bindingDelegate);
						args.splice(0, 2, model, delegate);
						var instance = origCreateInstance.apply(this, args);
						if (instance.firstChild) {
							Object.defineProperty(instance.firstChild.templateInstance, "instanceData", {
								get: getInstanceData.bind(this),
								configurable: true
							});
						}
						return instance;
					};
				})();
			}
		}
	})();
});
