'use strict';

import FloatSetting from '../classes/settings/FloatSetting.js';
import StringSetting from '../classes/settings/StringSetting.js';
import EnumSetting from '../classes/settings/EnumSetting.js';

import Configuration from '../data/Configuration.js';

const MainMenuScreen = {
	init() {
		this.shown = false;
		this.wrapper = document.querySelector('.main-menu');
		this.optionList = document.querySelector('.main-menu .option-list');
		this.settingList = document.querySelector('.main-menu .setting-list');

		this.buttons = {
			start: document.querySelector('.main-menu .start-simulation'),
			configuration: document.querySelector('.main-menu .configuration'),
			credits: document.querySelector('.main-menu .credits')
		};
		this.onSelectionMove = this.onSelectionMove.bind(this);
		this.onButtonSelect = this.onButtonSelect.bind(this);

		this.generateConfigurationElements();
		this.addEvents();
	},
	addEvents() {
		this.buttons.start.addEventListener('click', () => this.onButtonSelect(this.buttons.start));
		this.buttons.configuration.addEventListener('click', () => this.onButtonSelect(this.buttons.configuration));
		this.buttons.credits.addEventListener('click', () => this.onButtonSelect(this.buttons.credits));
	},
	onButtonSelect(button) {
		if (button == this.buttons.start) {

		} else if (button == this.buttons.configuration) {
			this.settingList.parentNode.classList.remove('list-hidden');
			this.optionList.parentNode.classList.add('list-hidden');
		} else if (button == this.buttons.credits) {

		}
	},
	generateConfigurationElements() {
		function getNameFromConfigKey(key) {
			const result = key.replace(/([A-Z])/g, ' $1').split('.');
			return result.map(name => name.charAt(0).toUpperCase() + name.slice(1)).join(' > ');
		}
		function generateFromSetting(key, setting) {
			if (setting instanceof FloatSetting) {
				const element = document.createElement('div');
				element.setAttribute('class', 'setting float-setting');
				element.setAttribute('data-key', key);
				const label = document.createElement('label');
				label.innerText = getNameFromConfigKey(key);
				const input = document.createElement('input');
				input.setAttribute('type', 'text');
				setting.attachOnProperty(input, 'value');
				input.onchange = function() {
					const value = input.value;
					if (isNaN(parseFloat(value))) {
						input.classList.add('invalid');
					} else {
						input.classList.remove('invalid');
						setting.value = parseFloat(value);
					}
				}
				element.appendChild(label);
				element.appendChild(input);
				return element;
			} else if (setting instanceof StringSetting) {
				const element = document.createElement('div');
				element.setAttribute('class', 'setting string-setting');
				element.setAttribute('data-key', key);
				const label = document.createElement('label');
				label.innerText = getNameFromConfigKey(key);
				const input = document.createElement('input');
				input.setAttribute('type', 'text');
				setting.attachOnProperty(input, 'value');
				input.onchange = function() {
					const value = input.value;
					setting.value = value;
				}

				element.appendChild(label);
				element.appendChild(input);
				return element;
			} else if (setting instanceof EnumSetting) {
				const element = document.createElement('div');
				element.setAttribute('class', 'setting enum-setting');
				element.setAttribute('data-key', key);
				const label = document.createElement('label');
				label.innerText = getNameFromConfigKey(key);
				const input = document.createElement('select');
				input.setAttribute('type', 'text');
				input.onchange = function() {
					const value = input.value;
					setting.value = value;
				}
				setting.options.forEach(option => {
					const optionElement = document.createElement('option');
					optionElement.setAttribute('value', option);
					optionElement.innerText = option;
					if (option == setting.value) {
						optionElement.setAttribute('selected', '');
					}
					input.appendChild(optionElement);
				});
				setting.attachOnProperty(input, 'value');
				element.appendChild(label);
				element.appendChild(input);
				return element;
			}
			return false;
		}
		function step(key, settingOrConfig, array = []) {
			// Treat settings
			const element = generateFromSetting(key, settingOrConfig);
			if (element) {
				array.push(element);
				return array;
			}
			// Treat configs
			if (typeof settingOrConfig == 'object') {
				for(let subkey in settingOrConfig) {
					if (settingOrConfig.hasOwnProperty(subkey) && settingOrConfig[subkey]) {
						step((key ? key + '.' : '') + subkey, settingOrConfig[subkey], array);
					}
				}
			}

			return array;
		}

		const elements = step('', Configuration);
		elements.forEach(element => this.settingList.appendChild(element));
	},
	onSelectionMove(direction) {

	},
	update() {

	},
	show() {
		this.wrapper.style.display = '';

	},
	hide() {
		this.wrapper.style.display = 'none';
	}
}

export default MainMenuScreen;