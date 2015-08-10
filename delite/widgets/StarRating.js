/** @module liaison/delite/widgets/StarRating */
define([
	"dcl/dcl",
	"dojo/dom-class",
	"dojo/dom-geometry",
	"dojo/keys",
	"dojo/string",
	"dpointer/events",
	"decor/Observable",
	"decor/ObservableArray",
	"delite/register",
	"./Widget",
	"../createRenderer!./templates/StarRating.html",
	"../../ObservablePath",
	"../../computed",
	"dojo/i18n!deliteful/StarRating/nls/StarRating",
	"delite/theme!deliteful/StarRating/themes/{{theme}}/StarRating.css"
], function (dcl, domClass, domGeometry, keys, string, pointer, Observable, ObservableArray, register, Widget, renderer,
	ObservablePath, computed, messages) {
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
		 * The value of the Rating user is hovering over.
		 * @type {number}
		 */
		_hoveredValue: null,

		/**
		 * The value of the Rating that user sees in UI.
		 * @type {number}
		 */
		showingValue: computed(function (value, hoveredValue) {
			return hoveredValue != null ? hoveredValue : value;
		}, "value", "_hoveredValue"),

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
		 * If true, clicking on blank area at the left will set zero to the value.
		 * @type {boolean}
		 */
		allowZero: true,

		/**
		 * If true, this widget does not accept user's gestures.
		 * @type {boolean}
		 */
		passive: computed(function (disabled, readOnly) {
			return disabled || readOnly;
		}, "disabled", "readOnly"),

		/**
		 * If the Rating is not read only, define if the user allowed to edit half values (0.5, 1.5, ...)
		 * @type {boolean}
		 */
		editHalfValues: false,

		/**
		 * The number of pixel to add to the left of the widget (or right if the direction is rtl) to allow
		 * setting the value to 0 when readOnly is set to falsy. Default value is 0 if the widget is read only,
		 * 20 if the widget is not read only.
		 * Set this value to 0 to forbid the user from setting the value to zero during edition.
		 * Setting this attribute to a negative value is not supported.
		 * @type {number}
		 */
		_zeroAreaWidth: computed(function (allowZero, readOnly) {
			return allowZero && !readOnly ? 20 : 0;
		}, "allowZero", "readOnly"),

		_incrementKeyCodes: [keys.RIGHT_ARROW, keys.UP_ARROW, keys.NUMPAD_PLUS], // keys to press to increment value
		_decrementKeyCodes: [keys.LEFT_ARROW, keys.DOWN_ARROW, keys.NUMPAD_MINUS], // keys to press to decrement value
		stars: null,
		_entrySeq: 0,

		/**
		 * @returns {object} The list of attributes of this custom element to set after DOM is created.
		 */
		attribs: function () {
			return {
				"role": "slider",
				"tabIndex": this.hasAttribute("tabIndex") ? this.getAttribute("tabIndex") : "0",
				"aria-disabled": "{{passive}}",
				"aria-label": messages["aria-label"],
				"aria-valuemin": 0,
				"aria-valuemax": "{{max}}",
				"aria-valuenow": "{{value}}",
				"aria-valuetext": "{{aria:value}}"
			};
		},

		/**
		 * @returns {object} The list of attributes of attach point nodes to set after DOM is created.
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
		 * Builds DOM inside widget, stamps out the template
		 * and create data bindings that are not defined in the template.
		 */
		render: function () {
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
		 * Watches for change in {@link module:liaison/delite/widgets/StarRating#showingValue showingValue attribute},
		 * and updates states of stars that are affected.
		 * @param {number} value The new value.
		 * @param {number} oldValue The old value.
		 */
		showingValueChanged: function (value, oldValue) {
			if (this.stars) {
				var start = Math.floor(Math.max(Math.min(value, oldValue), 0));
				this.stars.slice(start, Math.ceil(Math.max(value, oldValue, 0))).forEach(function (entry, i) {
					var pos = i + start;
					entry.set("state", pos <= value - 1 ? "full" : pos >= value ? "empty" : "half");
				});
			}
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
							var pos = i + oldMax;
							return new Observable({
								uniqueId: "" + this._entrySeq++,
								state: pos <= this.value - 1 ? "full" : pos >= this.value ? "empty" : "half"
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
		},

		/**
		 * Watches for change in _zeroAreaWidth and updates CSS.
		 * @param {number} zeroAreaWidth The new value.
		 */
		_zeroAreaWidthChanged: function (zeroAreaWidth) {
			this.style.paddingLeft = zeroAreaWidth + "px";
		},

		/**
		 * Watches for change in {@link module:liaison/delite/widgets/StarRating#passive passive attribute},
		 * and sets or removes event handlers.
		 * @param {boolean} passive The new value.
		 */
		passiveChanged: function (passive) {
			if (passive) {
				if (this._keyDownHandle) {
					this._keyDownHandle.remove();
					this._keyDownHandle = null;
				}
				if (this._startHandles) {
					for (var h; (h = this._startHandles.shift());) {
						h.remove();
					}
					this._startHandles = null;
				}
			} else {
				this._boundKeyDownHandler = this._boundKeyDownHandler || this._keyDownHandler.bind(this);
				this._boundPointerEnterHandler = this._boundPointerEnterHandler || this._pointerEnterHandler.bind(this);
				this._boundWireHandlers = this._boundWireHandlers || this._wireHandlers.bind(this);
				this._keyDownHandle = this._keyDownHandle || this.on("keydown", this._boundKeyDownHandler);
				this._startHandles = this._startHandles || [
					this.on(pointer.events.ENTER, this._boundPointerEnterHandler),
					this.on(pointer.events.DOWN, this._boundWireHandlers)
				];
			}
		},

		/**
		 * Removes misc event handlers.
		 */
		_removeEventsHandlers: function () {
			for (var h; (h = this._otherEventsHandles.shift());) {
				h.remove();
			}
			this._otherEventsHandles = null;
		},

		/**
		 * Sets misc event handlers.
		 */
		_wireHandlers: function () {
			this._boundPointerMoveHandler = this._boundPointerMoveHandler || this._pointerMoveHandler.bind(this);
			this._boundPointerUpHandler = this._boundPointerUpHandler || this._pointerUpHandler.bind(this);
			this._boundPointerLeaveHandler = this._boundPointerLeaveHandler || this._pointerLeaveHandler.bind(this);
			this._otherEventsHandles = this._otherEventsHandles || [
				this.on(pointer.events.MOVE, this._boundPointerMoveHandler),
				this.on(pointer.events.UP, this._boundPointerUpHandler),
				this.on(pointer.events.LEAVE, this._boundPointerLeaveHandler),
				this.on(pointer.events.CANCEL, this._boundPointerLeaveHandler)
			];
		},

		/**
		 * Handles pointer enter event.
		 * @param {Event} event The event.
		 */
		_pointerEnterHandler: function (event) {
			this._wireHandlers();
			if (event.pointerType === "mouse") {
				this._hovering = true;
				domClass.add(this, this.baseClass + "-hovered");
			}
			this._enterValue = this.value;
		},

		/**
		 * Handles pointer move event.
		 * @param {Event} event The event.
		 */
		_pointerMoveHandler: function (event) {
			var newValue = this._coordToValue(event);
			if (this._hovering) {
				if (newValue !== this._hoveredValue) {
					domClass.add(this, this.baseClass + "-hovered");
					this.set("_hoveredValue", newValue);
				}
			} else {
				this.value = newValue;
			}
		},

		/**
		 * Handles pointer up event.
		 * @param {Event} event The event.
		 */
		_pointerUpHandler: function (event) {
			this.value = this._coordToValue(event);
			this._enterValue = this.value;
			if (!this._hovering) {
				this._removeEventsHandlers();
			} else {
				domClass.remove(this, this.baseClass + "-hovered");
			}
		},

		/**
		 * Handles pointer leave event.
		 */
		_pointerLeaveHandler: function () {
			if (this._hovering) {
				this._hovering = false;
				this.set("_hoveredValue", null);
				domClass.remove(this, this.baseClass + "-hovered");
				this.value = this._enterValue;
			}
			this._removeEventsHandlers();
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
			if (this.value > (this.allowZero ? 0 : 1)) {
				this.set("value", this.value - (this.editHalfValues ? 0.5 : 1));
			}
		},

		/**
		 * @param {Event} event The event hainvg position info.
		 * @returns {number} The value coressponding to the position.
		 */
		_coordToValue: function (event) {
			var box = domGeometry.position(this, false),
				xValue = event.clientX - box.x,
				rawValue = null,
				discreteValue;
			// fix off values observed on leave event
			if (xValue < 0) {
				xValue = 0;
			} else if (xValue > box.w) {
				xValue = box.w;
			}
			if (this._inZeroSettingArea(xValue, box.w)) {
				return 0;
			} else {
				rawValue = this._xToRawValue(xValue, box.w);
			}
			if (rawValue != null) {
				if (rawValue === 0) {
					rawValue = 0.1; // do not allow setting the value to 0 when clicking on a star
				}
				discreteValue = Math.ceil(rawValue);
				if (this.editHalfValues && (discreteValue - rawValue) > 0.5) {
					discreteValue -= 0.5;
				}
				return discreteValue;
			}
		},

		/**
		 * @param {number} x The horizontal position.
		 * @returns {boolean} True if the position is in zero area.
		 */
		_inZeroSettingArea: function (x) {
			return x < this._zeroAreaWidth;
		},

		/**
		 * @param {number} x The hotizontal position from an event.
		 * @param {number} domNodeWidth The width of this widget.
		 * @returns {number} The value associated with the horizontal position.
		 */
		_xToRawValue: function (x, domNodeWidth) {
			var starStripLength = domNodeWidth - this._zeroAreaWidth;
			return (x - this._zeroAreaWidth) / (starStripLength / this.max);
		}
	});

	return register("d-l-star-rating", [HTMLElement, StarRating]);
});
