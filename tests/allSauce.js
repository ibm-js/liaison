define((function () {
	var list = ["./allNode"];
	if (typeof window !== "undefined") {
		list.push("./templateElement",
			"./DOMBindingTarget",
			"./DOMTreeBindingTarget",
			"./delite/template",
			"./delite/TemplateBinderExtension",
			"./delite/widgets/Widget");
	}
	return list;
})(), 1);
