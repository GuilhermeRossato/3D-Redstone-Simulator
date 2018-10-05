if (!String.prototype.contains) {
	String.prototype.contains = function(str) {
		return (str === "") || (this.indexOf(str) !== -1)
	}
}