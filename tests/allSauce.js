define((function () {
	var list = ["./allNode"];
	if (typeof window !== "undefined") {
		list.push("./DOMBindingTarget",
			"./DOMTreeBindingTarget",
			"./delite/sandbox");
	}
	return list;
})(), 1);
