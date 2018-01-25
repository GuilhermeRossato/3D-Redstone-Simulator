define(["Scripts/Classes/StateMachine.js","Scripts/Views/LoadingView.js"], (StateMachine, LoadingView)=>
class Interface extends StateMachine {
	constructor() {
		super({
			"loading": Interface.redirectView(LoadingView || {}),
			"show-error": {},
			"input-selection": {}
		});
	}
	static redirectView(view) {
		if (!view) throw new Error("Undefined view");
		return {
			onEnter: view.open,
			onExit: view.close
		}
	}
})