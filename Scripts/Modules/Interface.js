define(["Scripts/Classes/StateMachine.js"], (StateMachine)=>
class Interface extends StateMachine {
	constructor() {
		super({
			"loading": Interface.redirectView(LoadingView),
			"show-error": {},
			"input-selection": {}
		});
	}
	static redirectView(view) {
		return {
			onEnter: view.open,
			onExit: view.close
		}
	}
})