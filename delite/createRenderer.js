/** @module liaison/delite/createRenderer */
define([
	"decor/Observable",
	"../DOMTreeBindingTarget"
], function (Observable) {
	"use strict";

	var forEach = [].forEach;

	/**
	 * @function module:liaison/delite/createRenderer
	 * @param {string} template The template string.
	 * @returns {Function}
	 *     A function to stamp out the template, which should be run as a delite widget's instance method.
	 *     The template will be bound to widget instance.
	 * @example
	 *     <script id="basic-template" type="text/x-template">
	 *         <div>
	 *             <input type="text" placeholder="Type your first name" value="{{first}}">
	 *             <input type="text" placeholder="Type your last name" value="{{last}}">
	 *         </div>
	 *     </script>
	 * @example
	 *     require([
	 *         "delite/register",
	 *         "delite/Widget",
	 *         "liaison/delite/createRenderer"
	 *     ], function (register, Widget, createRenderer) {
	 *         register("liaison-example-basic", [HTMLElement, Widget], {
	 *             render: createRenderer(document.getElementById("basic-template").innerHTML),
	 *             baseClass: "liaison-example-basic",
	 *             first: "John",
	 *             last: "Doe"
	 *         });
	 *         register.parse();
	 *     });
	 */
	var createRenderer = function (templateString) {
		function getInstanceData() {
			return this.instanceData;
		}
		return function () {
			/* jshint validthis: true */
			if (!this.set) {
				this.set = Observable.prototype.set;
			}
			var template = this.ownerDocument.createElement("template");
			template.innerHTML = templateString;
			template.upgradeToTemplate();
			template.createBindingSourceFactory = this.createBindingSourceFactory;
			Object.defineProperty(template, "instanceData", {
				get: getInstanceData.bind(this)
			});
			if (this.instanceData) {
				template._instanceData = this.instanceData;
			}
			this.own(template.instantiate(this).insertBefore(this))[0].content;
			forEach.call(this.querySelectorAll("[data-attach-point]"), function (elem) {
				var value = elem.getAttribute("data-attach-point");
				if (value) {
					this[value] = elem;
				}
			}, this);
		};
	};

	/**
	 * Implements AMD loader plugin
	 * to return a function to stamp out the template, which should be run as a delite widget's instance method.
	 * The template will be bound to widget instance.
	 * @function module:liaison/delite/createRenderer.load
	 * @param {string} mid The AMD module ID of the template string.
	 * @param {Function} parentRequire The require() function.
	 * @param {Function} loaded A callback function, taking the plugin module as the parameter.
	 * @example
	 *     require([
	 *         "delite/register",
	 *         "delite/Widget",
	 *         "liaison/delite/createRenderer!my/template"
	 *     ], function (register, Widget, renderer) {
	 *         register("liaison-example-basic", [HTMLElement, Widget], {
	 *             render: renderer,
	 *             baseClass: "liaison-example-basic",
	 *             first: "John",
	 *             last: "Doe"
	 *         });
	 *         register.parse();
	 *     });
	 */
	createRenderer.load = function (mid, parentRequire, loaded) {
		parentRequire(["requirejs-text/text!" + mid], function (template) {
			loaded(createRenderer(template));
		});
	};

	/**
	 * The binding source factory,
	 * used when {@link module:liaison/delite/createRenderer liaison/delite/createRenderer} stamps out the template content.
	 * This function has the same interface as {@link HTMLTemplateElement#createBindingSourceFactory}.
	 * @function module:delite/Widget#createBindingSourceFactory
	 */

	return createRenderer;
});
