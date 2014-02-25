/** @module liaison/delite/widgets/Widget */
define([
	"dcl/dcl",
	"delite/Stateful",
	"delite/Widget",
	"../../wrapperProto",
	"../../wrapStateful",
	"../../ObservablePath",
	"../TemplateBinderExtension"
], function (dcl, Stateful, Widget, wrapperProto, wrapStateful, ObservablePath) {
	var REGEXP_CHAGED_CALLBACK = /^(.+)Changed$/;

	/**
	 * The base widget class for Liaison.
	 * @class module:liaison/delite/widgets/Widget
	 * @augments {external:Widget}
	 * @borrows module:liaison/wrapperProto.wrap as wrap
	 * @borrows module:liaison/wrapper.computed as computed
	 * @borrows module:liaison/wrapper.computedArray as computedArray
	 * @borrows module:liaison/wrapper.isComputed as isComputed
	 */
	var LiaisonWidget = dcl(Widget, /** @lends module:liaison/delite/widgets/Widget# */ {
		/**
		 * Lifecycle callback for this custom element being created.
		 * Makes sure change in "introspected" property emits change records compatible
		 * with {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe ECMAScript Harmony Object.observe()}.
		 * Also adds support for propChanged() callback.
		 * @method
		 */
		createdCallback: dcl.before(function () {
			var tokens;
			this.watch = Stateful.prototype.watch; // From delite/Widget#preCreate
			wrapStateful(this);
			for (var s in this) {
				if ((tokens = REGEXP_CHAGED_CALLBACK.exec(s)) && typeof this[s] === "function") {
					this.own(new ObservablePath(this, tokens[1]).observe(this[s].bind(this)));
				}
			}
			if (this._applyInstanceToComputed) {
				this.own(this._applyInstanceToComputed());
			}
		})
	});

	LiaisonWidget.wrap = wrapperProto.wrap;
	LiaisonWidget.computed = wrapperProto.computed;
	LiaisonWidget.computedArray = wrapperProto.computedArray;
	LiaisonWidget.isComputed = wrapperProto.isComputed;
	return LiaisonWidget;
});
