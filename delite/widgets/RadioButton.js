/** @module liaison/delite/widgets/RadioButton */
define([
	"dcl/dcl",
	"delite/register",
	"./Widget"
], function (dcl, register, Widget) {
	function on(elem, eventName, listener) {
		elem.addEventListener(eventName, listener);
		return {
			remove: elem.removeEventListener.bind(elem, eventName, listener)
		};
	}

	/**
	 * Radio button.
	 * @class module:liaison/delite/widgets/RadioButton
	 * @augments {module:liaison/delite/widgets/Widget}
	 */
	var RadioButton = dcl(Widget, /** @lends module:liaison/delite/widgets/RadioButton# */ {
		baseClass: "d-l-radiobutton",

		/**
		 * The current value of the radio group of this radio button.
		 * @type {string}
		 */
		current: "",

		/**
		 * Coerces the input type to radio button and attach the change event handler, as this radio button is initialized.
		 */
		buildRendering: function () {
			var value = this.value;
			this.type = "radio";
			if (value !== this.value) {
				this.value = value; // Type coercion in IE9 causes .value changing to "on"
			}
			this.own(on(this, "change", this.onChange.bind(this)));
		},

		/**
		 * Watches for change in {@link module:liaison/delite/widgets/RadioButton#checked checked attribute},
		 * and updates the current value of the radio group of this radio button.
		 * @param {number} checked The new value.
		 */
		checkedChanged: function (checked) {
			if (checked) {
				this.set("current", this.value);
			}
		},

		/**
		 * Watches for change in {@link module:liaison/delite/widgets/RadioButton#value value attribute},
		 * and updates the current value of the radio group of this radio button.
		 * @param {number} value The new value.
		 */
		valueChanged: function (value) {
			if (this.checked) {
				this.set("current", value);
			}
		},

		/**
		 * Watches for change in {@link module:liaison/delite/widgets/RadioButton#current current attribute},
		 * and updates the checked state of this radio button.
		 * @param {number} current The new value.
		 */
		currentChanged: function (current) {
			this.set("checked", this.value + "" === current + "");
		},

		/**
		 * Updates the current value of the radio group of this radio button as user changes the checked state.
		 */
		onChange: function () {
			if (this.checked) {
				this.set("current", this.value);
			}
		}
	});

	return register("d-l-radiobutton", [HTMLInputElement, RadioButton]);
});
