'use strict';

export default class MainLoop {
	constructor(config) {
		this.updateCall = config.update || (function() {});
		this.drawCall = config.draw || (function() {});
		this.overflowCall = config.overflow || (function() {});
		this.underflowCall = config.underflow || (function() {});
		this.constant = config.constant || false;
		this.performancer = config.performancer;
		this.fps = config.fps;

		this.period = 1000/config.fps;
		this.running = false;

		this.update = this.update.bind(this);
	}
	start() {
		if (this.running) {
			return console.warn("Main loop is already running.");
		}
		this.running = true;

		this.last = performance.now();
		this.extra = 0;
		requestAnimationFrame(this.update)
	}
	stop() {
		if (!this.running) {
			return console.warn("Main loop is already not running.");
		}
		this.running = false;
	}
	update() {
		const period = this.period;
		var delta = this.extra - this.last + (this.last = performance.now());
		this.performancer && this.performancer.update(delta);
		if (this.constant) {
			this.updateCall();
			this.drawCall();
		} else {
			if (delta < this.period) {
				this.extra = delta;
				this.underflowCall();
			} else if (delta > this.period*16) {
				if (delta > this.period*22) {
					this.overflowCall();
				} else {
					this.updateCall();
					this.updateCall();
				}
				delta = 0;
			} else {
				while (delta > period) {
					delta -= period;
					this.updateCall();
				}
				this.drawCall();
			}

			this.extra = delta;
		}

		this.running && requestAnimationFrame(this.update);
	}
}