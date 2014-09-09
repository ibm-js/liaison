/** @module liaison/delite/widgets/Widget */
define([
	"dcl/dcl",
	"decor/Observable",
	"delite/Widget",
	"../../computed",
	"../../wrapper",
	"../../ObservablePath",
	"../../templateBinder",
	"../templateBinderExtension"
], function (dcl, Observable, Widget, computed, wrapper, ObservablePath, templateBinder) {
	var MUSTACHE_BEGIN = "{{",
		REGEXP_CHAGED_CALLBACK = /^(.+)Changed$/;

	/**
	 * The base widget class for Liaison.
	 * @class module:liaison/delite/widgets/Widget
	 * @augments {module:delite/Widget}
	 */
	var LiaisonWidget = dcl(Widget, /** @lends module:liaison/delite/widgets/Widget# */ {
		/**
		 * The list of attributes of this custom element to set after DOM is created.
		 * If the attribute value contains data binding syntax, it's evaluated.
		 * Alternatively this can be a function that returns the list of attributes.
		 * @example <caption>Binds value property of this widget to aria-valuenow attribute of this widget.</caption>
		 * attribs: {
		 *     "aria-valuenow": "{{value}}"
		 * }
		 */
		attribs: null,

		/**
		 * The list of attributes of attach point nodes to set after DOM is created.
		 * If the attribute value contains data binding syntax, it's evaluated.
		 * Alternatively this can be a function that returns the list of attributes.
		 * @example <caption>Binds value property of this widget to value property of valueNode.</caption>
		 * attachPointsAttribs: {
		 *     "valueNode": {
		 *         "value": "{{value}}"
		 *     }
		 * }
		 */
		attachPointsAttribs: null,

		/**
		 * If true, don't call property change callbacks (`propCallback()`) at initialization.
		 */
		preventDispatchValuesAtInitialization: false,

		/**
		 * Lifecycle callback for this custom element being created.
		 * Makes sure change in "introspected" property emits change records compatible
		 * with {@link http://wiki.ecmascript.org/doku.php?id=harmony:observe ECMAScript Harmony Object.observe()}.
		 * Also adds support for propChanged() callback, as well as activates computed properties.
		 * @method
		 */
		preCreate: dcl.before(function () {
			if (!this.set) {
				this.set = Observable.prototype.set;
			}
			this.own.apply(this, computed.apply(this)); // Let widget manage computed property so that it works for non-templated widgets
		}),

		/**
		 * Looks at {@link module:liaison/delite/widgets/Widget#attribs liaison/delite/widgets/Widget#attribs}
		 * as well as {@link module:liaison/delite/widgets/Widget#attachPointsAttribs liaison/delite/widgets/Widget#attachPointsAttribs},
		 * assign those attributes, and start data binding as necessary.
		 * @method
		 */
		postCreate: dcl.after(function () {
			var toBeBound = [],
				nodes = [this],
				declarations = [typeof this.attribs === "function" ? this.attribs() : this.attribs],
				attachPointsAttribs = typeof this.attachPointsAttribs === "function" ? this.attachPointsAttribs() : this.attachPointsAttribs;

			for (var point in attachPointsAttribs) {
				if (this[point]) {
					nodes.push(this[point]);
					declarations.push(attachPointsAttribs[point]);
				}
			}
			nodes.forEach(function (node, i) {
				var declaration = declarations[i];
				for (var name in declaration) {
					if ((declaration[name] + "").indexOf(MUSTACHE_BEGIN) >= 0) {
						toBeBound.push(node, name, declaration[name], undefined);
					} else {
						node.setAttribute(name, declaration[name]);
					}
				}
			});

			templateBinder.assignSources.call(this, this, toBeBound, this.createBindingSourceFactory);
			this.own.apply(this, templateBinder.bind(toBeBound));

			var tokens;
			for (var prop in this) {
				if ((tokens = REGEXP_CHAGED_CALLBACK.exec(prop)) && typeof this[prop] === "function") {
					var value = this.own(new ObservablePath.Observer(this, tokens[1]))[0].open(this[prop], this);
					if (!this.preventDispatchValuesAtInitialization) {
						this[prop](value);
					}
				}
			}
		})
	});

	return LiaisonWidget;
});
