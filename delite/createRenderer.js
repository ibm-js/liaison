/** @module liaison/delite/createRenderer */
define([
	"../wrapStateful",
	"../templateElement",
	"../TemplateBinder"
], function (wrapStateful, templateElement, TemplateBinder) {
	"use strict";

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
		return function () {
			/* jshint validthis: true */
			if (!this._observable) {
				wrapStateful(this);
			}
			if (!this._template) {
				this._template = templateElement.create(template, this.ownerDocument);
				this._template.createBindingSourceFactory = this.createBindingSourceFactory;
			}
			new TemplateBinder(this._template).create(this, this, "beforeEnd");
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

	return createRenderer;
});
