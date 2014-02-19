define((function () {
	var list = ["./allNode", "./allSauce"];
	if (typeof window !== "undefined") {
		list.push("./polymer/sandbox");
	}
	return list;
})(), 1);
