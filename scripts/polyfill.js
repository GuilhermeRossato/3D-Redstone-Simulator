// @ts-nocheck

if (!String.prototype.contains) {
	String.prototype.contains = function(str) {
		return (str === '') || (this.indexOf(str) !== -1)
	}
}

if (!Array.prototype.includes) {
	Array.prototype.includes = function(value) {
		return this.indexOf(value) !== -1;
	}
}

// Common mistake
if (!Array.prototype.contains) {
	Array.prototype.contains = Array.prototype.includes;
}