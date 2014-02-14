/** @module liaison/delite/widgets/Widget */
define([
	"dcl/dcl",
	"delite/Stateful",
	"delite/Widget",
	"../../wrapper",
	"../../wrapStateful",
	"../../Observable",
	"../../ObservablePath",
	"../TemplateBinderExtension"
], function (dcl, Stateful, Widget, wrapper, wrapStateful, Observable, ObservablePath) {
	var REGEXP_CHAGED_CALLBACK = /^(.+)Changed$/,
		REGEXP_OBJECT_CONSTRUCTOR = /^\s*function Object\s*\(/,
		REGEXP_COMPUTED_PROPERTIES_IN_WIDGET = /^__(.+)__Computed$/;

	/**
	 * The base widget class for Liaison.
	 * @class module:liaison/delite/widgets/Widget
	 * @augments {external:Widget}
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
				if ((tokens = REGEXP_COMPUTED_PROPERTIES_IN_WIDGET.exec(s)) && wrapper.isComputed(this[s])) {
					this.own(this[s].clone().activate(this, tokens[1]));
				} else if ((tokens = REGEXP_CHAGED_CALLBACK.exec(s)) && typeof this[s] === "function") {
					this.own(new ObservablePath(this, tokens[1]).observe(this[s].bind(this)));
				}
			}
		})
	});

	/**
	 * Set up delite widget prototype object for data binding.
	 * @function module:liaison/delite/widgets/Widget.wrap
	 * @param {Object} o A plain object.
	 * @returns {Object} A converted version of the given object.
	 */
	LiaisonWidget.wrap = function (o) {
		if (Observable.test(o) || o && REGEXP_OBJECT_CONSTRUCTOR.test(o.constructor + "")) {
			var wrapped = {};
			for (var s in o) {
				if (wrapper.isComputed(o[s])) {
					wrapped["__" + s + "__Computed"] = o[s];
					wrapped[s] = undefined; // Let delite/Stateful#_introspect handle this property
				} else {
					wrapped[s] = wrapper.wrap(o[s]);
				}
			}
			return wrapped;
		}
		return o;
	};

	return LiaisonWidget;
});
