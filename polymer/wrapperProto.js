/**
 * Polymer version of {@link module:liaison/wrapperProto liaison/wrapperProto}.
 * @module liaison/polymer/wrapperProto
 * @mixes module:liaison/wrapperProto
 */
define([
	"../Observable",
	"../wrapperProto",
	"./ready!"
], function (Observable, wrapperProto) {
	/* global Polymer */
	var origCreatedCallback = Polymer.api.instance.base.createdCallback,
		origLeftViewCallback = Polymer.api.instance.base.leftViewCallback;
	Polymer.api.instance.base.createdCallback = function () {
		if (!this._observable) {
			Observable.call(this);
		}
		if (typeof this.set !== "function") {
			this.set = Observable.prototype.set;
		}
		if (this._applyInstanceToComputed) {
			this._computedHandle = this._applyInstanceToComputed();
		}
		origCreatedCallback && origCreatedCallback.apply(this, arguments);
	};
	Polymer.api.instance.base.leftViewCallback = function () {
		if (!this.preventDispose && this._computedHandle) {
			this._computedHandle.remove();
			this._computedHandle = null;
		}
		origLeftViewCallback && origLeftViewCallback.apply(this, arguments);
	};
	return wrapperProto;
});
