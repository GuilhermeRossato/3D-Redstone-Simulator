function SettingsPersister() {
	Settings.cookie.lastingDays.attach(this, "cookiesLast");
	Settings.cookie.enabled.attach(this, "cookiesEnabled");
	this.loadSettingsState();
	this.startSaverTimer();
}

SettingsPersister.prototype = {
	constructor: SettingsPersister,
	update: function() {
		if (this.cookiesEnabled)
			this.saveSettingsState();
	},
	startSaverTimer: function() {
		//console.log("Settings persist timer activated");
		this.timer = setInterval(this.update, 5000);
	},
	stopTimer: function() {
		if (this.timer !== undefined) {
			clearInterval(this.timer);
			this.timer = undefined;
		}
	},
	forEachPropertyInObject: function(object, f) {
		for (var property in object) {
			if (object.hasOwnProperty(property)) {
				f(property, object[property]);
			}
		}
	},
	loadSettingsState: function() {
		if (typeof getCookie === "function") {
			this._recursiveLoad("rs", Settings);
		}
	},
	saveSettingsState: function() {
		if (typeof setCookie === "function") {
			this._recursiveSave("rs", Settings);
		}
	},
	_recursiveParse: function(last, object) {
		object.parent = last;
	},
	_loadBooleanSetting: function(cookieName, setting) {
		var cookieData = getCookie(cookieName)
		if (cookieData === "1")
			setting.value = true;
		else if (cookieData === "0")
			setting.value = false;
	},
	_loadFloatSetting: function(cookieName, setting) {
		var cookieData = getCookie(cookieName);
		if (cookieData && cookieData !== "") {
			cookieData = parseFloat(cookieData);
			if (!isNaN(cookieData))
				setting.value = cookieData;
		}
	},
	_loadIntegerSetting: function(cookieName, setting) {
		var cookieData = getCookie(cookieName);
		if (cookieData && cookieData !== "") {
			cookieData = parseInt(cookieData);
			if (!isNaN(cookieData))
				setting.value = cookieData;
		}
	},
	_loadVectorSetting: function(cookieName, setting) {
		var cookieData = getCookie(cookieName);
		if (cookieData && cookieData !== "") {
			cookieData = cookieData.split(",").filter(piece=>(piece && piece !== "")).map(piece=>parseFloat()).filter(float=>!isNaN(float));
			if (cookieData.length === 3)
				setting.set(cookieData[0], cookieData[1], cookieData[2]);
		}
	},
	_recursiveLoad: function(past, object) {
		if (object instanceof BooleanSetting)
			this._loadBooleanSetting(past, object)
		else if (object instanceof FloatSetting)
			this._loadFloatSetting(past, object);
		else if (object instanceof IntegerSetting)
			this._loadIntegerSetting(past, object);
		else if (object instanceof VectorSetting)
			this._loadVectorSetting(past, object);
		else if (object instanceof Array)
			object.forEach((subObject,i)=>{
				this._recursiveLoad(past + i, subObject);
			});
		else if (typeof object === "object")
			this.forEachPropertyInObject(object, (property,subObject)=>{
				this._recursiveLoad(past + "." + property, subObject);
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
