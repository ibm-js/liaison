/** @module liaison/polymer/BindingSourceWrapper */
(function (root, factory) {
	// Module definition to support AMD, node.js and browser globals
	if (typeof exports === "object") {
		module.exports = factory();
	} else if (typeof define === "function" && define.amd) {
		define(factory);
	} else {
		root.BindingSourceWrapper = factory();
	}
})(this, function () {
	"use strict";

	/* global PathObserver */
	/**
	 * Polymer {@link https://github.com/polymer/observe-js#pathobserver PathObserver}.
	 * @class external:PathObserver
	 */
	/**
	 * @param {BindingSource} source The {@link BindingSource}
	 * to create Polymer {@link https://github.com/polymer/observe-js#pathobserver PathObserver} of.
	 * @return {external:PathObserver}
	 *    Polymer {@link https://github.com/polymer/observe-js#pathobserver PathObserver} instance
	 *    of the given {@link BindingSource}.
	 */
	return function (source) {
		var valueObj = {
				value: source.getFrom()
			},
			observer = new PathObserver(valueObj, "value"),
			origClose = observer.close,
			h = source.observe(function (newValue) {
				valueObj.value = newValue;
				observer.deliver();
			});
		observer.setValue = function (value) {
			source.setTo(value);
		};
		observer.close = function () {
			h.remove();
			h = null;
			origClose.apply(this, arguments);
		};
		return observer;
	};
});
