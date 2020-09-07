export function debounce(func, delay) {
	let inDebounce
	return function(...args) {
		const context = this;
		(inDebounce !== undefined) && clearTimeout(inDebounce);
		inDebounce = setTimeout(() => func.apply(context, args), delay);
	}
}