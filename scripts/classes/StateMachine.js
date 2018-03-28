/*
 * Guilherme Rossato - June 2017
 *
 * A class to simplify a state machine in javascript, similar to machina.js but easy to digest and faster to run
 *
 * Example of usage:
 *
 * var sm = new StateMachine({
 *   waiting: {
 *     onExit: ()=>{console.log("stopped waiting")}
 *  },
 *  working: {
 *    onEnter: ()=>{console.log("started working")},
 *    iterate: ()=>{assert(this.states.working.iterate instanceof Function)}
 *  });
 * // assert(sm.state === "working"); // starts at first defined state
 * sm.state = "working"; // prints both logs
 * sm.state = "waiting"; // prints one log
 * sm.states.working.iterate(); // one way to reach that function
 *
 */

define(()=>class StateMachine {
	constructor(config) {
		var currentState, scope = this;
		scope.states = config;
		for (var key in config) {
			if (config.hasOwnProperty(key)) {
				if (typeof config[key] === "object") {
					currentState = key;
					break;
				} else if (typeof config[key] === "string") {
					currentState = config[key];
					break;
				}
			}
		}
		if (!currentState)
			console.error("No State");
		Object.defineProperty(this, "state", {
			get: function() {
				return currentState;
			},
			set: function(newState) {
				if (config[newState]) {
					if (newState != currentState) {
						if (config[currentState].onExit instanceof Function)
							config[currentState].onExit.call(scope, newState);
						if (config[newState].onEnter instanceof Function)
							config[newState].onEnter.call(scope, newState);
						currentState = newState;
					}
				} else {
					console.warn(`Denied transition because "${newState}" is not a valid state`);
				}
			}
		});
		if (config[currentState].onEnter instanceof Function && !config[currentState].ignoreInit)
			config[currentState].onEnter.call(scope);
	}
});