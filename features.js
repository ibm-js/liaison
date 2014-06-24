define(["requirejs-dplugins/has"], function (has) {
	/* global HTMLTemplateElement, Platform, Polymer, PathObserver */
	has.add("object-observe-api", typeof Object.observe === "function" && typeof Array.observe === "function");
	has.add("object-is-api", Object.is);
	has.add("setimmediate-api", typeof setImmediate === "function");
	has.add("mutation-observer-api",
		typeof MutationObserver !== "undefined"
			&& (/\[\s*native\s+code\s*\]/i.test(MutationObserver) // Avoid polyfill version of MutationObserver
				|| !/^\s*function/.test(MutationObserver)));
	has.add("polymer-platform", typeof Platform !== "undefined");
	has.add("polymer", typeof Polymer !== "undefined");
	has.add("polymer-pathobserver", typeof PathObserver !== "undefined");
	has.add("polymer-createInstance",
		typeof HTMLTemplateElement !== "undefined" && typeof HTMLTemplateElement.prototype.createInstance === "function");
	has.add("polymer-template-decorate", typeof HTMLTemplateElement !== "undefined" && typeof HTMLTemplateElement.decorate === "function");
	return has;
});
