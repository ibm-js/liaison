define([
	"intern!bdd",
	"intern/chai!expect",
	"dojo/Deferred",
	"delite/register",
	"delite/Widget",
	"../../Observable",
	"../../ObservableArray",
	"../../ObservablePath",
	"../../delite/createRenderer",
	"../waitFor",
	"requirejs-text/text!../templates/eventTemplate.html",
	"requirejs-text/text!../templates/nestedEventTemplate.html",
	"../../EventBindingSource",
	"../sandbox/monitor"
], function (
	bdd,
	expect,
	Deferred,
	register,
	Widget,
	Observable,
	ObservableArray,
	ObservablePath,
	createRenderer,
	waitFor,
	eventTemplate,
	nestedEventTemplate
) {
	/* jshint withstmt: true */
	/* global describe, afterEach, it */
	with (bdd) {
		describe("Test liaison/delite-polymer/createRenderer", function () {
			var handles = [];
			function createDeclarativeEventResolver(dfd) {
				return function () {
					var a = [].slice.call(arguments);
					a.unshift(this);
					dfd.resolve(a);
				};
			}
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					handle.remove();
				}
			});
			it("Declarative events", function () {
				var senderDiv,
					targetDiv,
					dfd = this.async(10000),
					dfd1stClick = new Deferred(),
					dfd2ndClick = new Deferred(),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					model = {handleClick: "Foo"};
				template.setAttribute("bind", "");
				template.innerHTML = eventTemplate;
				template.model = model;
				handles.push({
					remove: template.unbind.bind(template, "bind")
				});
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					model.handleClick = createDeclarativeEventResolver(dfd1stClick);
				}).then(waitFor.bind(1000)).then(function () {
					senderDiv = template.nextSibling;
					targetDiv = senderDiv.firstChild;
					var event = document.createEvent("MouseEvents");
					event.initEvent("click", true, true);
					targetDiv.dispatchEvent(event);
				}).then(waitFor.bind(dfd1stClick.promise)).then(function (data) {
					var event = data[1],
						sender = data[3];
					expect(event.type).to.equal("click");
					expect(sender).to.equal(senderDiv);
					model.handleClick = createDeclarativeEventResolver(dfd2ndClick);
				}).then(waitFor.bind(1000)).then(function () {
					var event = document.createEvent("MouseEvents");
					event.initEvent("click", true, true);
					targetDiv.dispatchEvent(event);
				}).then(waitFor.bind(dfd2ndClick.promise)).then(dfd.callback(function (data) {
					var event = data[1],
						sender = data[3];
					expect(event.type).to.equal("click");
					expect(sender).to.equal(senderDiv);
				}), dfd.reject.bind(dfd));
			});
			it("Nested declarative events", function () {
				var dfd = this.async(10000),
					dfd1stClick = new Deferred(),
					dfd2ndClick = new Deferred(),
					dfd3rdClick = new Deferred(),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					model = {
						handleClick: createDeclarativeEventResolver(dfd1stClick),
						foo: {
							bar: new Observable()
						}
					};
				template.setAttribute("bind", "");
				template.innerHTML = nestedEventTemplate;
				template.model = model;
				handles.push({
					remove: template.unbind.bind(template, "bind")
				});
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				waitFor(function () {
					return div.querySelector("div");
				}).then(function () {
					var event = document.createEvent("MouseEvents");
					event.initEvent("click", true, true);
					div.querySelector("div").dispatchEvent(event);
				}).then(waitFor.bind(dfd1stClick.promise)).then(function (data) {
					var thisObject = data[0],
						event = data[1],
						sender = data[3];
					expect(thisObject).to.equal(model);
					expect(event.type).to.equal("click");
					expect(sender).to.equal(div.querySelector("div"));
					model.foo.handleClick = createDeclarativeEventResolver(dfd2ndClick);
				}).then(waitFor.bind(1000)).then(function () {
					var event = document.createEvent("MouseEvents");
					event.initEvent("click", true, true);
					div.querySelector("div").dispatchEvent(event);
				}).then(waitFor.bind(dfd2ndClick.promise)).then(function (data) {
					var thisObject = data[0],
						event = data[1],
						sender = data[3];
					expect(thisObject).to.equal(model.foo);
					expect(event.type).to.equal("click");
					expect(sender).to.equal(div.querySelector("div"));
					model.foo.bar.handleClick = createDeclarativeEventResolver(dfd3rdClick);
				}).then(waitFor.bind(1000)).then(function () {
					var event = document.createEvent("MouseEvents");
					event.initEvent("click", true, true);
					div.querySelector("div").dispatchEvent(event);
				}).then(waitFor.bind(dfd3rdClick.promise)).then(function (data) {
					var thisObject = data[0],
						event = data[1],
						sender = data[3];
					expect(thisObject).to.equal(model.foo.bar);
					expect(event.type).to.equal("click");
					expect(sender).to.equal(div.querySelector("div"));
				}).then(dfd.resolve.bind(dfd), dfd.reject.bind(dfd));
			});
		});
	}
});
