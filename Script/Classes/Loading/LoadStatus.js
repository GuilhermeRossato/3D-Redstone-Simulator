function LoadStatus(title, description, progress, debug) {
	this.title = title;
	this.description = description;
	this.progress = progress;
	this.debug = debug;
}

LoadStatus.prototype = {
	constructor: LoadStatus
}