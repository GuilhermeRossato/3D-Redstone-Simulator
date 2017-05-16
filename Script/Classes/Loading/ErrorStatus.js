function ErrorStatus(owner, description, progress, debug) {
	this.owner = owner;
	this.description = description;
	this.progress = progress;
	this.debug = debug;
}

ErrorStatus.prototype = {
	constructor: ErrorStatus
}