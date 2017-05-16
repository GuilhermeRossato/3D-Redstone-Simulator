var input, persister;

function onLoad() {
	input = new InputListener();
	persister = new SettingsPersister();
	Application.init(input);
}

window.addEventListener("load", onLoad);