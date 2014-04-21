define((function () {
	var list = ["./allNode"];
	if (typeof window !== "undefined") {
		list.push("./DOMBindingTarget", "./DOMTreeBindingTarget");
	}
	return list;
})(), 1);
