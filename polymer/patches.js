/**
 * A module to let Polymer aware
 * of {@link module:liaison/Observable Observable} and {@link module:liaison/ObservableArray ObservableArray}.
 * @module liaison/polymer/patches
 */
define(["../ObservableArray"], function (ObservableArray) {
	"use strict";

	var opts = ({}).toString;

	// Make array test work with ObservableArray
	Array.isArray = function (a) {
		return opts.call(a) === "[object Array]" || ObservableArray.test(a);
	};

	/* global Path */
	// setValueFrom to support Observable interface
	Path.prototype.setValueFrom = function (o, value) {
		var prop = this[this.length - 1];
		if (this.length > 0) {
			for (var i = 0, l = this.length - 1; i < l; ++i) {
				o = o == null ? o : o[this[i]];
			}
		}
		if (o != null && prop) {
			if (typeof o.set === "function") {
				o.set(prop, value);
			} else {
				o[prop] = value;
			}
			return true;
		}
		return false;
	};
});
