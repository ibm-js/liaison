/** @module liaison/delite/widgets/StarRating */
define([
	"dcl/dcl",
	"dojo/dom-class",
	"dojo/keys",
	"dojo/string",
	"dpointer/events",
	"delite/register",
	"./Widget",
	"../createRenderer!./templates/StarRating.html",
	"../../Observable",
	"../../ObservableArray",
	"../../ObservablePath",
	"dojo/i18n!deliteful/StarRating/nls/StarRating",
	"delite/themes/load!deliteful/StarRating/themes/{{theme}}/StarRating_css"
], function (dcl, domClass, keys, string, pointer, register, Widget, renderer,
	Observable, ObservableArray, ObservablePath, messages) {
	/**
	 * Star rating widget based on Liaison features.
	 * This widget does not have all features that deliteful/StarRating has,
	 * but demonstrates how Liaison features simplifies widget implementation.
	 * @class module:liaison/delite/widgets/StarRating
	 * @augments {module:liaison/delite/widgets/Widget}
	 */
	var StarRating = dcl(Widget, /** @lends module:liaison/delite/widgets/StarRating# */ {
		baseClass: "d-star-rating",

		/**
		 * The maximum rating, that is also the number of stars to show.
		 * @type {number}
		 */
		max: 5,

		/**
		 * The current value of the Rating.
		 * @type {number}
		 */
		value: 0,

		/**
		 * Mandatory if using the star rating widget in a form, in order to have it value submited.
		 * @type {string}
		 */
		name: "",

		/**
		 * If true, the widget is disabled (its value will not be submited if it is included in a form).
		 * @type {boolean}
		 */
		disabled: false,

		/**
		 * If false, the widget is editable and allows editing the value of the Rating by touching / clicking the stars.
		 * @type {boolean}
		 */
		readOnly: false,

		/**
		 * If true, this widget does not accept user's gestures.
		 * @type {boolean}
		 */
		passive: false,

		/**
		 * The number of pixel to add to the left of the widget (or right if the direction is rtl) to allow
		 * setting the value to 0 when readOnly is set to falsy. Default value is 0 if the widget is read only,
		 * 20 if the widget is not read only.
		 * Set this value to 0 to forbid the user from setting the value to zero during edition.
		 * Setting this attribute to a negative value is not supported.
		 * @type {number}
		 */
		zeroAreaWidth: undefined,

		_incrementKeyCodes: [keys.RIGHT_ARROW, keys.UP_ARROW, keys.NUMPAD_PLUS], // keys to press to increment value
		_decrementKeyCodes: [keys.LEFT_ARROW, keys.DOWN_ARROW, keys.NUMPAD_MINUS], // keys to press to decrement value
		stars: null,
		_entrySeq: 0,

		/**
		 * The list of attributes of this custom element to set after DOM is created.
		 * @type {Object}
		 */
		attribs: function () {
			return {
				"role": "slider",
				"tabIndex": this.hasAttribute("tabIndex") ? this.getAttribute("tabIndex") : "0",
				"aria-label": messages["aria-label"],
				"aria-valuemin": 0,
				"aria-valuemax": "{{max}}",
				"aria-valuenow": "{{value}}",
				"aria-valuetext": "{{aria:value}}"
			};
		},

		/**
		 * The list of attributes of attach point nodes to set after DOM is created.
		 * @type {Function}
		 */
		attachPointsAttribs: function () {
			if (this.noReuseInput) {
				return {
					"valueNode": {
						"name": "{{name}}",
						"value": "{{value}}",
						"readOnly": "{{readOnly}}",
						"disabled": "{{disabled}}"
					}
				};
			}
		},

		/**
		 * Binding source factory implementation for this widget.
		 * @see {@link module:delite/Widget#createBindingSourceFactory module:delite/Widget#createBindingSourceFactory}.
		 * @param {string} path What's in the mustache syntax.
		 * @returns {Function} The function that creates an alternate binding source for `{{aria:xxx}}`, using aria-valuetext string resource.
		 */
		createBindingSourceFactory: function (path) {
			var match = /^aria:(.*)/.exec(path);
			if (match) {
				return function (model) {
					return new ObservablePath(model, match[1], function () {
						return string.substitute(messages["aria-valuetext"], model);
					});
				};
			}
		},

		/**
		 * Getter for {@link module:liaison/delite/widgets/StarRating#zeroAreaWidth zeroAreaWidth property}.
		 * @returns {number}
		 *     {@link module:liaison/delite/widgets/StarRating#zeroAreaWidth zeroAreaWidth property} value.
		 */
		_getZeroAreaWidthAttr: function () {
			var val = this._get("zeroAreaWidth");
			return val === undefined ? (this.readOnly ? 0 : 20) : val;
		},

		/**
		 * Builds DOM inside widget, stamps out the template
		 * and create data bindings that are not defined in the template.
		 */
		buildRendering: function () {
			pointer.setTouchAction(this, "none");

			var inputs = this.getElementsByTagName("input");
			if (inputs.length) {
				(this.valueNode = inputs[0]).parentNode.removeChild(this.valueNode);
				if (!isNaN(parseFloat(this.valueNode.value))) {
					this.value = this.valueNode.value;
				}
				this.valueNode.style.display = "none";
			} else {
				this.noReuseInput = true;
			}

			this.style.display = "inline-block";

			renderer.call(this);

			!this.stars && this.set("stars", new ObservableArray());

			if (this.noReuseInput) {
				this.valueNode = this.getElementsByTagName("input")[0];
			} else {
				this.appendChild(this.valueNode);
			}
		},

		/**
		 * Watches for change in {@link module:liaison/delite/widgets/StarRating#changed changed attribute},
		 * and updates states of stars that are affected.
		 * @param {number} value The new value.
		 * @param  {number} oldValue The old value.
		 */
		valueChanged: function (value, oldValue) {
			oldValue = oldValue || 0;
			var turnTo = value > oldValue ? "full" : "empty";
			this.stars && this.stars.slice(Math.max(Math.min(value, oldValue), 0), Math.max(value, oldValue, 0))
				.forEach(function (entry) {
					entry.set("state", turnTo);
				});
		},

		/**
		 * Watches for change in {@link module:liaison/delite/widgets/StarRating#max max attribute},
		 * and adds or removes stars.
		 * @param {number} max The new value.
		 * @param  {number} oldMax The old value.
		 */
		maxChanged: function (max, oldMax) {
			oldMax = oldMax || 0;
			if (max < oldMax) {
				this.stars.set("length", Math.max(max, 0));
			} else {
				this.stars.push.apply(this.stars,
					ObservableArray.apply(undefined, new ObservableArray(Math.max(max, 0) - Math.max(oldMax, 0)))
						.map(function (entry, i) {
							return new Observable({
								uniqueId: "" + this._entrySeq++,
								state: i + oldMax < this.value ? "full" : "empty"
							});
						}, this));
			}
		},

		/**
		 * Watches for change in disabled attribute,
		 * and updates CSS and {@link module:liaison/delite/widgets/StarRating#passive passive attribute}.
		 * @param {boolean} disabled The new value.
		 */
		disabledChanged: function (disabled) {
			domClass.toggle(this, this.baseClass + "-disabled", disabled);
			this.set("passive", disabled || this.readOnly);
		},

		/**
		 * Watches for change in {@link module:liaison/delite/widgets/StarRating#readOnly readOnly attribute},
		 * and updates CSS and {@link module:liaison/delite/widgets/StarRating#passive passive attribute}.
		 * @param  {boolean} readOnly The new value.
		 */
		readOnlyChanged: function (readOnly) {
			this.set("passive", this.disabled || readOnly);
			this.style.paddingLeft = (readOnly ? 0 : this.zeroAreaWidth) + "px";
		},

		/**
		 * Watches for change in {@link module:liaison/delite/widgets/StarRating#passive passive attribute},
		 * and sets or removes event handlers.
		 * @param {boolean} passive The new value.
		 */
		passiveChanged: function (passive) {
			if (passive) {
				if (this.hKeyDown) {
					this.hKeyDown.remove();
					this.hKeyDown = null;
				}
				if (this.hTap) {
					this.hTap.remove();
					this.hTap = null;
				}
			} else {
				this._boundKeyDownHandler = this._boundKeyDownHandler || this._keyDownHandler.bind(this);
				this.hKeyDown = this.hKeyDown || this.on("keydown", this._boundKeyDownHandler);
				this._boundTapHander = this._boundTapHander || this._tapHandler.bind(this);
				this.hTap = this.hTap || this.on("click", this._boundTapHander);
			}
		},

		/**
		 * Handles keydown event
		 * and increases or decreases {@link module:liaison/delite/widgets/StarRating#value value attribute}.
		 * @private
		 */
		_keyDownHandler: function (event) {
			if (this._incrementKeyCodes.indexOf(event.keyCode) >= 0) {
				event.preventDefault();
				this._incrementValue();
			} else if (this._decrementKeyCodes.indexOf(event.keyCode) >= 0) {
				event.preventDefault();
				this._decrementValue();
			}
		},

		/**
		 * Handles tap event
		 * and updates {@link module:liaison/delite/widgets/StarRating#value value attribute}.
		 * @private
		 */
		_tapHandler: function (event) {
			var index = -1,
				uniqueId = event.target.getAttribute("data-uniqueId");
			this.stars.some(function (entry, i) {
				if (entry.uniqueId === uniqueId) {
					index = i;
					return true;
				}
			});
			this.set("value", index + 1);
		},

		/**
		 * Increases {@link module:liaison/delite/widgets/StarRating#value value attribute}.
		 * @private
		 */
		_incrementValue: function () {
			if (this.value < this.max) {
				this.set("value", this.value + (this.editHalfValues ? 0.5 : 1));
			}
		},

		/**
		 * Decreases {@link module:liaison/delite/widgets/StarRating#value value attribute}.
		 * @private
		 */
		_decrementValue: function () {
			if (this.value > (this.zeroAreaWidth ? 0 : 1)) {
				this.set("value", this.value - 1);
			}
		}
	});

	return register("d-l-star-rating", [HTMLElement, StarRating]);
});
