define([
	"intern!bdd",
	"intern/chai!expect",
	"dojo/Deferred",
	"../../Observable",
	"../waitFor",
	"requirejs-text/text!../templates/eventTemplate.html",
	"requirejs-text/text!../templates/nestedEventTemplate.html",
	"requirejs-text/text!../templates/styleBindingTemplate.html",
	"requirejs-text/text!../templates/styleWithAlternateBindingTemplate.html",
	"../../alternateBindingSource",
	"../sandbox/monitor"
], function (
	bdd,
	expect,
	Deferred,
	Observable,
	waitFor,
	eventTemplate,
	nestedEventTemplate,
	styleTemplate,
	styleWithAlternateBindingTemplate
) {
	/* jshint withstmt: true */
	/* global describe, afterEach, it */
	with (bdd) {
		describe("Test alternateBindingSource in Polymer platform", function () {
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
					dfd1stClick = new Deferred(),
					dfd2ndClick = new Deferred(),
					div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					model = {handleClick: "Foo"};
				this.timeout = 10000;
				template.setAttribute("bind", "");
				template.innerHTML = eventTemplate;
				template.model = model;
				handles.push({
					remove: template.unbind.bind(template, "iterator") // TODO(asudoh): Review unbind method with future Polymer versions
				});
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					model.handleClick = createDeclarativeEventResolver(dfd1stClick);
				}).then(waitFor.create(1000)).then(function () {
					senderDiv = template.nextSibling;
					targetDiv = senderDiv.firstChild;
					var event = document.createEvent("MouseEvents");
					event.initEvent("click", true, true);
					targetDiv.dispatchEvent(event);
				}).then(waitFor.create(dfd1stClick.promise)).then(function (data) {
					var event = data[1],
						sender = data[3];
					expect(event.type).to.equal("click");
					expect(sender).to.equal(senderDiv);
					model.handleClick = createDeclarativeEventResolver(dfd2ndClick);
				}).then(waitFor.create(1000)).then(function () {
					var event = document.createEvent("MouseEvents");
					event.initEvent("click", true, true);
					targetDiv.dispatchEvent(event);
				}).then(waitFor.create(dfd2ndClick.promise)).then(function (data) {
					var event = data[1],
						sender = data[3];
					expect(event.type).to.equal("click");
					expect(sender).to.equal(senderDiv);
				});
			});
			it("Nested declarative events", function () {
				var dfd1stClick = new Deferred(),
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
				this.timeout = 10000;
				template.setAttribute("bind", "");
				template.innerHTML = nestedEventTemplate;
				template.model = model;
				handles.push({
					remove: template.unbind.bind(template, "iterator") // TODO(asudoh): Review unbind method with future Polymer versions
				});
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					return div.querySelector("div");
				}).then(function () {
					var event = document.createEvent("MouseEvents");
					event.initEvent("click", true, true);
					div.querySelector("div").dispatchEvent(event);
				}).then(waitFor.create(dfd1stClick.promise)).then(function (data) {
					var thisObject = data[0],
						event = data[1],
						sender = data[3];
					expect(thisObject).to.equal(model);
					expect(event.type).to.equal("click");
					expect(sender).to.equal(div.querySelector("div"));
					model.foo.handleClick = createDeclarativeEventResolver(dfd2ndClick);
				}).then(waitFor.create(1000)).then(function () {
					var event = document.createEvent("MouseEvents");
					event.initEvent("click", true, true);
					div.querySelector("div").dispatchEvent(event);
				}).then(waitFor.create(dfd2ndClick.promise)).then(function (data) {
					var thisObject = data[0],
						event = data[1],
						sender = data[3];
					expect(thisObject).to.equal(model.foo);
					expect(event.type).to.equal("click");
					expect(sender).to.equal(div.querySelector("div"));
					model.foo.bar.handleClick = createDeclarativeEventResolver(dfd3rdClick);
				}).then(waitFor.create(1000)).then(function () {
					var event = document.createEvent("MouseEvents");
					event.initEvent("click", true, true);
					div.querySelector("div").dispatchEvent(event);
				}).then(waitFor.create(dfd3rdClick.promise)).then(function (data) {
					var thisObject = data[0],
						event = data[1],
						sender = data[3];
					expect(thisObject).to.equal(model.foo.bar);
					expect(event.type).to.equal("click");
					expect(sender).to.equal(div.querySelector("div"));
				});
			});
			it("Style binding", function () {
				/* global Platform */
				var div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					model = {
						show: true,
						hide: false,
						color: true,
						weight: true
					};
				this.timeout = 10000;
				template.setAttribute("bind", "");
				template.innerHTML = styleTemplate;
				template.model = model;
				handles.push({
					remove: template.unbind.bind(template, "iterator") // TODO(asudoh): Review unbind method with future Polymer versions
				});
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					var span = template.nextSibling;
					expect(span.style.display).to.equal("");
					expect(span.className).to.equal("color weight");
					model.hide = true;
					model.color = false;
					Platform.performMicrotaskCheckpoint();
				}).then(waitFor.create(function () {
					return template.nextSibling.style.display === "none";
				})).then(function () {
					var span = template.nextSibling;
					expect(span.className).to.equal(" weight");
					model.hide = false;
					Platform.performMicrotaskCheckpoint();
				}).then(waitFor.create(function () {
					return template.nextSibling.style.display === "";
				})).then(function () {
					model.show = false;
					Platform.performMicrotaskCheckpoint();
				}).then(waitFor.create(function () {
					return template.nextSibling.style.display === "none";
				})).then(function () {
					model.show = 2;
					Platform.performMicrotaskCheckpoint();
				}).then(waitFor.create(function () {
					return template.nextSibling.style.display === "";
				}));
			});
			it("Style binding with alternate binding source factory", function () {
				var div = document.createElement("div"),
					template = div.appendChild(document.createElement("template")),
					model = {
						show: 1,
						hide: 0,
						color: 1,
						weight: 1
					},
					origPrepareBinding = (template.bindingDelegate || {}).prepareBinding;
				(template.bindingDelegate = template.bindingDelegate || {}).prepareBinding = function (expression, name) {
					var match;
					if (!/^(l\-show|l\-hide|class)$/.test(name) && (match = /^boolean:(.*)$/i.exec(expression))) {
						return function (model) {
							/* global PathObserver, ObserverTransform */
							return new ObserverTransform(new PathObserver(model, match[1]), function (value) {
								return !!value;
							});
						};
					}
					return origPrepareBinding && origPrepareBinding.apply(this, arguments);
				};
				this.timeout = 10000;
				template.setAttribute("bind", "");
				template.innerHTML = styleWithAlternateBindingTemplate;
				template.model = model;
				handles.push({
					remove: template.unbind.bind(template, "iterator") // TODO(asudoh): Review unbind method with future Polymer versions
				});
				document.body.appendChild(div);
				handles.push({
					remove: function () {
						document.body.removeChild(div);
					}
				});
				return waitFor(function () {
					return template.nextSibling;
				}).then(function () {
					var span = template.nextSibling;
					expect(span.style.display).to.equal("");
					expect(span.className).to.equal("color weight");
					model.hide = 1;
					model.color = 0;
					Platform.performMicrotaskCheckpoint();
				}).then(waitFor.create(function () {
					return template.nextSibling.style.display === "none";
				})).then(function () {
					var span = template.nextSibling;
					expect(span.className).to.equal(" weight");
					model.hide = 0;
					Platform.performMicrotaskCheckpoint();
				}).then(waitFor.create(function () {
					return template.nextSibling.style.display === "";
				})).then(function () {
					model.show = 0;
					Platform.performMicrotaskCheckpoint();
				}).then(waitFor.create(function () {
					return template.nextSibling.style.display === "none";
				}));
			});
		});
	}
});
