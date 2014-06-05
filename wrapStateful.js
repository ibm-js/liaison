/** @module liaison/wrapStateful */
define(["./Observable"], function (Observable) {
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
			if ("_" + name + "Attr" in this) {
				// If shadow property is there, let delite/Stateful#watch trigger emitting change record
				this[name] = value;
			} else {
				// Otherwise let Observable#set emit a change record
				Observable.prototype.set.call(this, name, value);
			}
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
