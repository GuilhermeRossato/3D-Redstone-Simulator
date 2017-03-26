function LoadStatus(title, description, percent, debug) {
	this.title = title;
	this.description = description;
	this.percent = percent;
	this.debug = debug;
}

LoadStatus.prototype = {
	constructor: LoadStatus
}