function querySelectorAsync(selector, timeout) {
	function iterate(selector, started, timeout) {
		var element = document.querySelector(selector);

		if (element) {
			return element;
		}

		if (performance.now() - started_at > timeout) {
			return "Element '"+selector.toString()+"' not found after "+timeout+" ms";
		}

		return false;
	}

	const specificIterate = iterate.bind(this, selector, performance.now(), timeout);

	return new Promise((resolve, reject) => {
		const intervalId = setInterval(() => {
			var r = specificIterate();
			if (typeof r === "string") {
				reject(r);
			} else if (r !== false) {
				resolve(r);
			}
		}, 250);
	});
}

(async function() {
	const content = await querySelectorAsync('.content', 2000);
	if (!content) {
		return console.error("Cannot continue: elements not found");
	}

	var progress = 0;
	const maxProgress = 1;

	function setLoadingText(text) {
		if (progress < maxProgress) {
			progress ++;
		}
		const percentString = (100*progress/maxProgress).toFixed(0)+"%";
		content.querySelector(".text").innerText = text;
		content.querySelector(".bar .progress").style.width = percentString;
		content.querySelector(".percentage").innerText = percentString;
	}

	setLoadingText("Downloading images");
})();