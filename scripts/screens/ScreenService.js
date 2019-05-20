export default class ScreenService {
	static clearScreen() {
		const elements = document.querySelector(".content").children;
		for (let i = elements.length-1; i>=0; i--) {
			elements[i].remove();
		}
	}
	static setScreen(object, desiredScreen) {
		if (object.screen && object.screen.hide) {
			object.screen.hide();
		}
		if (desiredScreen) {
			object.screen = desiredScreen;
			desiredScreen.show();
		}
	}
}