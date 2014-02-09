/** @module liaison/delite/widgets/Widget */
define([
	"dcl/dcl",
	"delite/Widget",
	"../../wrapStateful",
	"../../ObservablePath",
	"../TemplateBinderExtension"
], function (dcl, Widget, wrapStateful, ObservablePath) {
	var REGEXP_CHAGED_CALLBACK = /^(.+)Changed$/;

	/**
	 * The base widget class for Liaison.
	 * @class module:liaison/delite/widgets/Widget
	 * @augments {external:delite/Widget}
	 */
	return dcl(Widget, /** @lends module:liaison/delite/widgets/Widget# */ {
		/**
		 * Lifecycle callback for this custom element being created.
		 * Makes sure change in "introspected" property emits change records compatible
		 * with {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe ECMAScript Harmony Object.observe()}.
		 * Also adds support for propChanged() callback.
		 * @method
		 */
		createdCallback: dcl.before(function () {
			var tokens;
			wrapStateful(this);
			for (var s in this) {
				if ((tokens = REGEXP_CHAGED_CALLBACK.exec(s)) && typeof this[s] === "function") {
					this.own(new ObservablePath(this, tokens[1]).observe(this[s].bind(this)));
				}
			}
		})
	});
});
