define((function () {
	var list = ["./allNode"];
	if (typeof window !== "undefined") {
		list.push("./templateElement",
			"./DOMBindingTarget",
			"./DOMTreeBindingTarget");
	}
	return list;
})(), 1);
