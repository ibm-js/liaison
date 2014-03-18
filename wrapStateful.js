/** @module liaison/wrapStateful */
(function (root, factory) {
	// Module definition to support AMD, node.js and browser globals
	if (typeof exports === "object") {
		module.exports = factory(require("./Observable"));
	} else if (typeof define === "function" && define.amd) {
		define(["./Observable"], factory);
	} else {
		root.makeObservable = factory(root.Observable);
	}
})(this, function (Observable) {
	"use strict";

	/**
	 * Make a stateful to emit a {@link module:liaison/Observable~ChangeRecord change record}
	 * upon change in {@link http://dojotoolkit.org/reference-guide/dojo/Stateful.html dojo/Stateful}.
	 * @function module:liaison/wrapStateful
	 * @param {external:dojo/Stateful} stateful
	 *     The {@link http://dojotoolkit.org/reference-guide/dojo/Stateful.html dojo/Stateful} instance.
	 * @return {Handle} The handle to stop emitting {@link module:liaison/Observable~ChangeRecord}.
	 */
	return (function () {
		function notify(name, old) {
			Observable.getNotifier(this).notify({
				// Always Observable.CHANGETYPE_UPDATE as Stateful cannot detect property addition
				type: Observable.CHANGETYPE_UPDATE,
				object: this,
				name: name + "",
				oldValue: old
			});
		}
		function set(name, value) {
			this[name] = value;
		}
		return function (stateful) {
			if (!stateful._observable) {
				Observable.call(stateful);
				var h = stateful.watch(notify.bind(stateful));
				stateful.set = set.bind(stateful);
				if (stateful.own) {
					stateful.own(h);
				}
				return h;
			}
		};
	})();
});
