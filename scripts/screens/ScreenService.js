export default class ScreenService {
	static setScreen(app, desiredScreen) {
		if (app.screen && app.screen.hide) {
			app.screen.hide();
		}
		if (desiredScreen) {
			app.screen = desiredScreen;
			desiredScreen.show();
		}
	}
}