/**
 * Prevents a 'callback' function from executing until there is a window of time of at least
 * 'delay' seconds after the last call of the returned function from this function.
 * 
 * @param {Function} func 
 * @param {number} delay 
 * @returns {Function}
 */
export default function debounce(func, delay) {
	let inDebounce;
	return function(...args) {
		const context = this;
		(inDebounce !== undefined) && clearTimeout(inDebounce);
		inDebounce = setTimeout(() => func.apply(context, args), delay);
	}
}