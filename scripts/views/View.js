define(()=>{
	createElementByData: function(data) {
		var element = document.createElement(data.tag || data.tagName || "div");
		for (var key in data) {
			if (data.hasOwnProperty(key) && key !== "tag" && key !== "tagName") {
				if (key === "innerText" || key === "innerHTML") {
					element[property] = data[key];
				} else {
					element.setAttribute(property, data[key]);
				}
			}
		}
		return element;
	}
});