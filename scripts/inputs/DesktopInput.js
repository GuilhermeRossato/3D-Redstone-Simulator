'use strict';

import AbstractInput from './AbstractInput.js';
import debounce from '../utils/debounce.js';
import Configuration from '../data/Configuration.js';

export default class DesktopInput extends AbstractInput {
	constructor() {
		super();
		this.mousemove = this.mousemove.bind(this);
		this.mousedown = debounce(this.mousedown.bind(this), 50);
		this.keydown = this.keydown.bind(this);
		this.update = null;
		this.isBreaking = false;
	}

	attachEvents() {
		window.addEventListener('mousemove', this.mousemove);
		window.addEventListener('mousedown', this.mousedown);
		window.addEventListener('keydown', this.keydown);
	}

	detachEvents() {
		window.removeEventListener('mousemove', this.mousemove);
		window.removeEventListener('mousedown', this.mousedown);
		window.removeEventListener('keydown', this.keydown);
	}

	/**
	 * @param {MouseEvent} event
	 */
	mousemove(event) {
		this.emitCameraDelta(event.movementX, event.movementY);
	}

	/**
	 * @param {MouseEvent} event
	 */
	mousedown(event) {
		if (event.button === 0) {
			if (!this.isBreaking) {
				this.isBreaking = true;
				this.emitStartBreak();
			}
		} else if (event.button === 1) {
			this.emitCopyBlock();
		} else if (event.button === 2) {
			this.emitUseItem();
		}
	}

	/**
	 * @param {KeyboardEvent} event
	 */
	keydown(event) {
		if (event.code === Configuration.input.desktopSettings.openInventoryKey.value) {
			return this.emitInventorySwitch();
		} else if (event.code === Configuration.input.desktopSettings.openMenuKey.value) {
			return this.emitPauseUnpause();
		} else if (event.code === Configuration.input.desktopSettings.jumpKey.value) {
			return this.emitJump();
		} else if (event.code === Configuration.input.desktopSettings.selectHotbar1Key.value) {
			return this.emitSelectHotbar(1);
		} else if (event.code === Configuration.input.desktopSettings.selectHotbar2Key.value) {
			return this.emitSelectHotbar(2);
		} else if (event.code === Configuration.input.desktopSettings.selectHotbar3Key.value) {
			return this.emitSelectHotbar(3);
		} else if (event.code === Configuration.input.desktopSettings.selectHotbar4Key.value) {
			return this.emitSelectHotbar(4);
		} else if (event.code === Configuration.input.desktopSettings.selectHotbar5Key.value) {
			return this.emitSelectHotbar(5);
		} else if (event.code === Configuration.input.desktopSettings.selectHotbar6Key.value) {
			return this.emitSelectHotbar(6);
		} else if (event.code === Configuration.input.desktopSettings.selectHotbar7Key.value) {
			return this.emitSelectHotbar(7);
		} else if (event.code === Configuration.input.desktopSettings.selectHotbar8Key.value) {
			return this.emitSelectHotbar(8);
		} else if (event.code === Configuration.input.desktopSettings.selectHotbar9Key.value) {
			return this.emitSelectHotbar(9);
		}
	}
}