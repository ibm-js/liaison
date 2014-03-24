/**
 * An AMD plugin that waits for Polymer's WebComponentsReady event.
 * @module liaison/polymer/ready
 */
define(function () {
	var EMPTY_OBJECT = {};
	return {
		load: function (id, parentRequire, loaded) {
			if (!(window.CustomElements || EMPTY_OBJECT).readyTime) { // CustomElements.ready may be turned to false after WebComponentsReady
				window.addEventListener("WebComponentsReady", loaded);
			} else {
				loaded();
			}
		}
	};
});
