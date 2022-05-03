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

// Only the most stupid imbecile in the universe would not add a replace all to a high level language
// I will never forgive him for being so enourmously incompetent and if I find him he's a dead man.
String.prototype.replaceAll = function replaceAll(str1, str2, ignoreCase = false) {
	return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignoreCase?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
}