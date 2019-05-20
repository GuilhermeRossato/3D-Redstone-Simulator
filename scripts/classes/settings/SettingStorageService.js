export default class SettingStorageService {
	static load(name) {
		if (!window.localStorage) {
			return false;
		}
		return window.localStorage.getItem("mc-"+name);
	}
	static save(name, value) {
		if (!window.localStorage) {
			return false;
		}
		return window.localStorage.setItem("mc-"+name, value);
	}
}