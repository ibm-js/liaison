define((function () {
	var list = ["./allNode", "./allSauce"];
	if (typeof window !== "undefined") {
		if (document.all) {
			var ieVer = parseFloat(navigator.appVersion.split("MSIE ")[1]) || undefined,
				mode = document.documentMode;
			if (mode && mode !== 5 && Math.floor(ieVer) !== mode) {
				ieVer = mode;
			}
			if (ieVer > 9) {
				list.push("./polymer/sandbox");
			}
		} else {
			list.push("./polymer/sandbox");
		}
	}
	return list;
})(), 1);
