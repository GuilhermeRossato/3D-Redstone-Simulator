function SettingsPersister() {
	Settings.cookie.lastingDays.attach(this, "cookiesLast");
	Settings.cookie.enabled.attach(this, "cookiesEnabled");
	this.parseSettings();
}

SettingsPersister.prototype = {
	constructor: SettingsPersister,
	update: function() {
		if (this.cookiesEnabled)
			this.saveSettingsState();
	},
	forEachPropertyInObject: function(object, f) {
		for (var property in object) {
			if (object.hasOwnProperty(property)) {
				f(property, object[property]);
			}
		}
	},
	parseSettings: function() {
		if (typeof getCookie === "function") {
			this._recursiveParse("rs", Settings);
		}
	},
	saveSettingsState: function() {
		if (typeof setCookie === "function") {
			this._recursiveSave("rs", Settings);
		}
	},
	_parseBooleanSetting: function(cookieName, setting) {
		var cookieData = getCookie(cookieName)
		if (cookieData === "1")
			setting.value = true;
		else if (cookieData === "0")
			setting.value = false;
		setting.attach(function(value) {
			//console.log("savingb",cookieName);
			setCookie(cookieName, value?"1":"0");
		});
	},
	_parseFloatSetting: function(cookieName, setting) {
		var cookieData = getCookie(cookieName);
		if (cookieData && cookieData !== "") {
			cookieData = parseFloat(cookieData);
			if (!isNaN(cookieData))
				setting.value = cookieData;
		}
		setting.attach(function(value) {
			//console.log("savingf",cookieName);
			setCookie(cookieName, value);
		});
	},
	_parseIntegerSetting: function(cookieName, setting) {
		var cookieData = getCookie(cookieName);
		if (cookieData && cookieData !== "") {
			cookieData = parseInt(cookieData);
			if (!isNaN(cookieData))
				setting.value = cookieData;
		}
		setting.attach(function(value) {
			//console.log("savingi",cookieName);
			setCookie(cookieName, value);
		});
	},
	_parseVectorSetting: function(cookieName, setting) {
		["x", "y", "z"].forEach(axis => {
			let cookieData = getCookie(cookieName + axis);
			if (cookieData && cookieData !== "") {
				cookieData = parseFloat(cookieData);
				if (!isNaN(cookieData)) {
					setting[axis].value = cookieData;
				}
			}
			setting[axis].attach(function(value) {
				//console.log("saving",cookieName + axis);
				setCookie(cookieName + axis, value);
			});
		});
	},
	_recursiveParse: function(past, object) {
		if (object instanceof BooleanSetting) {
			this._parseBooleanSetting(past, object)
		} else if (object instanceof FloatSetting) {
			this._parseFloatSetting(past, object);
		} else if (object instanceof IntegerSetting) {
			this._parseIntegerSetting(past, object);
		} else if (object instanceof VectorSetting) {
			this._parseVectorSetting(past, object);
		} else if (object instanceof Array)
			object.forEach((subObject,i)=>{
				this._recursiveParse(past + i, subObject);
			});
		else if (typeof object === "object")
			this.forEachPropertyInObject(object, (property,subObject)=>{
				this._recursiveParse(past + "." + property, subObject);
			});
	},
	_saveBooleanSetting: function(cookieName, setting) {
		var value = (setting.value?"1":"0")
		setCookie(cookieName, value);
	},
	_saveFloatSetting: function(cookieName, setting) {
		var value = setting.value.toString();
		setCookie(cookieName, value);
	},
	_saveIntegerSetting: function(cookieName, setting) {
		var cookieData = getCookie(cookieName);
		if (cookieData && cookieData !== "") {
			cookieData = parseInt(cookieData);
			if (!isNaN(cookieData))
				setting.value = cookieData;
		}
	},
	_saveVectorSetting: function(cookieName, setting) {
		var cookieData = getCookie(cookieName);
		if (cookieData && cookieData !== "") {
			cookieData = cookieData.split(",").filter(piece=>(piece && piece !== "")).map(piece=>parseFloat()).filter(float=>!isNaN(float));
			if (cookieData.length === 3)
				setting.set(cookieData[0], cookieData[1], cookieData[2]);
		}
	},
	_recursiveSave: function(past, object) {
		if (object instanceof BooleanSetting)
			this._saveBooleanSetting(past, object)
		else if (object instanceof FloatSetting)
			this._saveFloatSetting(past, object);
		else if (object instanceof IntegerSetting)
			this._saveIntegerSetting(past, object);
		else if (object instanceof VectorSetting)
			this._saveVectorSetting(past, object);
		else if (object instanceof Array)
			object.forEach((subObject,i)=>{
				this._recursiveSave(past + i, subObject);
			});
		else if (typeof object === "object")
			forEachPropertyInObject(object, (property,subObject)=>{
				this._recursiveSave(past + "." + property, subObject);
			});
	}
}
