define([
	"intern!bdd",
	"intern/chai!expect",
	"../templateElement"
], function (bdd, expect, templateElement) {
	/* jshint withstmt: true */
	/* global describe, it, afterEach */
	with (bdd) {
		describe("Test liaison/templateElement", function () {
			var handles = [];
			afterEach(function () {
				for (var handle = null; (handle = handles.shift());) {
					typeof handle.close === "function" ? handle.close() : handle.remove();
				}
			});
			it("Upgrading template", function () {
				var caught,
					script = document.createElement("script");
				script.type = "text/javascript";
				try {
					templateElement.upgrade(script);
				} catch (e) {
					caught = true;
				}
				expect(caught).to.be.true;
				caught = false;
				var div = document.createElement("div");
				div.innerHTML = "<template><span>Foo</span></template>";
				try {
					templateElement.upgrade(div);
				} catch (e) {
					caught = true;
				}
				expect(caught).to.be.true;
				caught = false;
				var template = div.firstChild;
				templateElement.upgrade(template);
				expect(template.content.firstChild.tagName).to.equal("SPAN");
				expect(template.content.firstChild.firstChild.nodeValue).to.equal("Foo");
				script = document.createElement("script");
				script.type = "text/x-template";
				script.innerHTML = "<span>Foo</span>";
				templateElement.upgrade(script);
				expect(script.content.firstChild.tagName).to.equal("SPAN");
				expect(script.content.firstChild.firstChild.nodeValue).to.equal("Foo");
			});
			it("Creating template from string", function () {
				var str = "<span>Foo</span>",
					template = templateElement.create(str);
				expect(template.content.firstChild.tagName).to.equal("SPAN");
				expect(template.content.firstChild.firstChild.nodeValue).to.equal("Foo");
			});
		});
	}
});
