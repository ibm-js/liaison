/** @module liaison/delite/createRenderer */
define([
	"../wrapStateful",
	"../templateElement",
	"../TemplateBinder"
], function (wrapStateful, templateElement, TemplateBinder) {
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
	 *             buildRendering: createRenderer(document.getElementById("basic-template").innerHTML),
	 *             baseClass: "liaison-example-basic",
	 *             first: "John",
	 *             last: "Doe"
	 *         });
	 *         register.parse();
	 *     });
	 */
	var createRenderer = function (template) {
		function getInstanceData() {
			return this.instanceData;
		}
		return function () {
			/* jshint validthis: true */
			if (!this._observable) {
				wrapStateful(this);
			}
			var prefix = "";
			if (document.all && template[0] === "{") {
				// Template string beginning with '{' seems to hang IE9/10 when the widget gets into another element (with appendChild(), etc.).
				// Adding "<!---->" to template string seems to work around that.
				var ieVer = parseFloat(navigator.appVersion.split("MSIE ")[1]) || undefined,
					mode = document.documentMode;
				if (mode && mode !== 5 && Math.floor(ieVer) !== mode) {
					ieVer = mode;
				}
				if (ieVer < 11) {
					prefix = "<!---->";
				}
			}
			this.binder = new TemplateBinder(templateElement.create(prefix + template, this.ownerDocument));
			this.binder.template.createBindingSourceFactory = this.createBindingSourceFactory;
			Object.defineProperty(this.binder.template, "instanceData", {
				get: getInstanceData.bind(this)
			});
			if (this.instanceData) {
				this.binder.template._instanceData = this.instanceData;
			}
			this.own(this.binder.create(this, this, "beforeEnd"));
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
	 *             buildRendering: renderer,
	 *             baseClass: "liaison-example-basic",
	 *             first: "John",
	 *             last: "Doe"
	 *         });
	 *         register.parse();
	 *     });
	 */
	createRenderer.load = function (mid, parentRequire, loaded) {
		parentRequire(["dojo/text!" + mid], function (template) {
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
