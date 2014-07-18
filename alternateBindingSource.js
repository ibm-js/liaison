define([
	"./features",
	"./ObservablePath"
], function (has, ObservablePath) {
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

	function StyleBindingSource(source) {
		this.source = source;
		this.deliver = source.deliver.bind(source);
		this.close = this.remove = source.close.bind(source);
	}

	StyleBindingSource.prototype = {
		open: function (callback, thisObject) {
			return this.update(this.source.open(function (value, oldValue) {
				callback.call(thisObject, this.update(value), oldValue);
			}, this));
		},

		discardChanges: function () {
			return this.update(this.source.discardChanges());
		},

		setValue: function () {},
	};

	function StyleShowBindingSource(source, node, show) {
		StyleBindingSource.call(this, source);
		this.update = function (value) {
			node.style.display = !show ^ !value ? "none" : "";
			return value;
		};
	}

	StyleShowBindingSource.prototype = Object.create(StyleBindingSource.prototype);

	function StyleClassBindingSource(source, className) {
		StyleBindingSource.call(this, source);
		this.update = function (value) {
			return value ? className : "";
		};
	}

	StyleClassBindingSource.prototype = Object.create(StyleBindingSource.prototype);

	if (typeof Element !== "undefined") {
		var origCreateBindingSourceFactory = Element.prototype.createBindingSourceFactory;
		Element.prototype.createBindingSourceFactory = function (expression, name) {
			var factory,
				prepareBinding = (this.bindingDelegate || EMPTY_OBJECT).prepareBinding;
			if (name === "l-show" || name === "l-hide") {
				factory = prepareBinding ? prepareBinding(expression, "") :
					this.createBindingSourceFactory(expression, "");
				return function (model, node) {
					var source = factory && factory(model, node) || new ObservablePath.Observer(model, expression);
					return new StyleShowBindingSource(source, node, name === "l-show");
				};
			} else if (name === "class" && expression.indexOf(":") >= 0) {
				var tokens = expression.split(":"),
					className = tokens[0],
					path = tokens.slice(1).join(":");
				factory = prepareBinding ? prepareBinding(path, name + ":" + className) :
					this.createBindingSourceFactory(path, name + ":" + className);
				return function (model, node) {
					var source = factory && factory(model, node) || new ObservablePath.Observer(model, path);
					return new StyleClassBindingSource(source, className);
				};
			}
			factory = origCreateBindingSourceFactory && origCreateBindingSourceFactory.apply(this, arguments);
			if (!factory) {
				if (REGEXP_DECLARATIVE_EVENT.test(name)) {
					return function (model, node) {
						return new EventBindingSource(model, expression, node, name);
					};
				}
			} else {
				return factory;
			}
		};
	}

	if (has("polymer-createInstance")) {
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
							delegate.prepareBinding = prepareBinding.bind(delegate, this.createBindingSourceFactory.bind(this), bindingDelegate);
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
			// Same code as one in liaison/DOMTreeBindingTarget, for template instances created by Polymer TemplateBinding
			if (typeof Node !== "undefined" && !Object.getOwnPropertyDescriptor(Node.prototype, "instanceData")) {
				Object.defineProperty(Node.prototype, "instanceData", {
					get: function () {
						/* jshint camelcase: false */
						return this._instanceData || this.templateInstance_ || (this.parentNode || EMPTY_OBJECT).instanceData;
					},
					configurable: true
				});
			}
		})();
	}

	return EventBindingSource;
});
