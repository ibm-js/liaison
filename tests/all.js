define((function () {
	var list = [
		"./Observable",
		"./ObservableArray",
		"./ObservablePath",
		"./BindingSourceList",
		"./Each",
		"./wrapper"
	];
	if (typeof window !== "undefined") {
		list.push("./DOMBindingTarget",
			"./DOMTreeBindingTarget",
			"./delite/sandbox",
			"./polymer/sandbox");
	}
	return list;
})(), 1);
