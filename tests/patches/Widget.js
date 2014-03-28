define([
	"dcl/dcl",
	"delite/Widget"
], function (dcl, Widget) {
	return dcl(Widget, {
		attachedCallback: dcl.superCall(function (sup) {
			return function () {
				if (this.impl) {
					this.impl.baseClass = this.baseClass;
					this.impl.isLeftToRight = this.isLeftToRight;
				}
				// Workaround to an issue a mutation observer set in delite/Widget#attachedCallback,
				// calling Polymer DOM wrapper's setter instead of actual element's setter which ends up with infinite loop of mutation observer
				sup && sup.apply(this.impl || this, arguments);
			};
		})
	});
});
