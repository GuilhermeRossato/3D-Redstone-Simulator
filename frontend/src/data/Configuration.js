import FloatSetting from '../classes/settings/FloatSetting.js';
import StringSetting from '../classes/settings/StringSetting.js';
import EnumSetting from '../classes/settings/EnumSetting.js';
import KeySetting from '../classes/settings/KeySetting.js';

export default {
	inputType: new EnumSetting({
		default: 'unknown',
		options: ['unknown', 'desktop', 'mobile', 'gamepad']
	}),
	input: {
		desktopSettings: {
			mouseSensitivity: new FloatSetting({min: 0, max: 1, default: 0.5}),
			openInventoryKey: new KeySetting('KeyE'),
			openMenuKey: new KeySetting('Escape'),
			jumpKey: new KeySetting('Escape'),
			selectHotbar1Key: new KeySetting('Numpad1'),
			selectHotbar2Key: new KeySetting('Numpad2'),
			selectHotbar3Key: new KeySetting('Numpad3'),
			selectHotbar4Key: new KeySetting('Numpad4'),
			selectHotbar5Key: new KeySetting('Numpad5'),
			selectHotbar6Key: new KeySetting('Numpad6'),
			selectHotbar7Key: new KeySetting('Numpad7'),
			selectHotbar8Key: new KeySetting('Numpad8'),
			selectHotbar9Key: new KeySetting('Numpad9'),
		}
	},
	camera: {
		pov: new FloatSetting({min: 70, max: 120, default: 80})
	},
	rendering: {
		ao: new EnumSetting({
			default: 'enabled',
			options: ['enabled', 'disabled']
		}),
	}
};