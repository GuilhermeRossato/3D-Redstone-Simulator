Menu.prototype = {
	constructor: Menu,
	options: menu_structure,
	assert: function(condition, message) {
		if (!condition) {
			throw message || "Assertion failed";
		}
	},
	openSubmenu(submenuData) {
		if (this.submenu.open)
			this.closeSubmenu();

		submenuData.forEach(buttonData => {
			let buttonElement = document.createElement("div");
			buttonElement.className = "button";
			let labelElement = document.createElement("div");
			labelElement.className = "label";
			let button = this.addButton(this.submenu, buttonData, buttonElement, labelElement);
		})
		this.submenu.open = true;
		this.updateSizeStyle();
		//console.log("Opening menu", submenu);
	},
	closeSubmenu() {
		this.submenu.open = false;
		while(this.submenu.firstChild)
			this.submenu.removeChild(this.submenu.firstChild);
	},
	getButtonByLabel: function(label) {
		let find = undefined;
		this.buttons.some((button)=>{
			if (button.childNodes[0].innerText == label) {
				find = button;
				return true;
			}
			return false;
		}
		)
		return find;
	},
	setEventListenerOnButton(btnLabel, func) {
		this.events[btnLabel] = func;
	},
	releaseButtons: function(exception, group) {
		if (typeof group === "undefined") {
			this.buttons.forEach((button)=>{
				if (button != exception && button.state) {
					button.state = false;
					button.hold("up");
					let label = button.childNodes[0].innerText;
					if (this.events[label]instanceof Function) {
						this.events[label].call(window, button);
					}
				}
			}
			);
		} else if (typeof group === "number") {
			this.buttons.forEach((button)=>{
				if (button != exception && button.group == group && button.state) {
					button.state = false;
					button.hold("up");
					let label = button.childNodes[0].innerText;
					if (this.events[label]instanceof Function) {
						this.events[label].call(window, button);
					}
				}
			}
			);
		}
	},
	buttonChange: function(button) {
		let label = button.childNodes[0].innerText;
		if (this.events[label]instanceof Function) {
			this.events[label].call(window, button);
		}
	},
	addButton(menu, buttonData, domButton, domLabel) {
		domButton.parent = this;
		domButton.submenu = buttonData.submenu;
		domButton.state = buttonData.state;
		domButton.group = buttonData.group;
		domButton.oncontextmenu = ()=>false;
		domButton.enabled = true;
		domButton.appendChild(domLabel);
		domButton.appendChild(document.createElement("br"));
		if (buttonData.iconImage) {
			let image = document.createElement("img");
			image.className = "button-icon";
			image.src = "Images/Icons" + this.iconSize.toString() + "/" + buttonData.iconImage;
			//image.style.height = image.style.width = this.iconSize.toString() + "px";
			domButton.appendChild(image);
		}
		domButton.clickFunc = buttonData.onclick;
		domButton.destroy = buttonData.destroy;
		domButton.onclick = function() {
			if (this.enabled && this.clickFunc instanceof Function) {
				if (this.group != 1 || !this.state)
					this.clickFunc();
			}
			this.parent.buttonChange.call(this.parent, this);
		}
		domButton.changeIcon = function(str) {
			let icon = this.childNodes[2];
			icon.src = "Images/Icons" + this.parent.iconSize.toString() + "/" + str;
		}
		domButton.changeLabel = function(str) {
			let label = this.childNodes[0];
			label.innerHTML = str;
		}
		domButton.hold = function(str) {
			if (str == "down") {
				if (this.group)
					this.parent.releaseButtons(this, this.group);
				this.className = "button-down";
			} else if (str == "up") {
				this.className = "button";
			}
		}
		domButton.enable = function() {
			this.className = "button";
			this.enabled = true;
		}
		domButton.disable = function() {
			this.className = "button disabled";
			this.enabled = false;
		}
		domLabel.innerHTML = buttonData.name
		if (buttonData.init instanceof Function)
			buttonData.init.call(domButton);
		if (domButton.state) {
			domButton.state = false;
			domButton.onclick();
		}
		if (buttonData.disabled) {
			domButton.disable();
		}
		menu.appendChild(domButton);
		return domButton;
	},
	updateSizeStyle: function() {
		let objs = Array.from(document.getElementsByClassName("button-icon")).filter((obj)=>obj instanceof HTMLImageElement);
		objs.forEach((obj)=>{
			obj.src = "Images/Icons" + this.iconSize.toString() + "/" + obj.src.split("/").pop();
			obj.style.height = obj.style.width = this.iconSize.toString() + "px";
		}
		);
		objs = Array.from(document.getElementsByClassName("label")).filter((obj)=>obj instanceof HTMLDivElement);
		objs.forEach((obj)=>{
			obj.style.fontSize = (b(8, 13, ib(24, 48, this.iconSize))).toString() + "px";
			obj.style.height = (b(18, 30, ib(24, 48, this.iconSize))) + "px";
		}
		);
		objs = Array.from(document.getElementsByClassName("button")).filter((obj)=>obj instanceof HTMLDivElement);
		objs.push(...Array.from(document.getElementsByClassName("button-down")).filter((obj)=>obj instanceof HTMLDivElement))
		objs.forEach((obj)=>{
			obj.style.width = (b(41, 70, ib(24, 48, this.iconSize))) + "px";
			obj.style.height = (b(49, 89, ib(24, 48, this.iconSize))) + "px";
		}
		);
	},
	increaseIconSize: function() {
		if (this.iconSize == 24)
			this.iconSize = 48;
		this.updateSizeStyle();
	},
	decreaseIconSize: function() {
		if (this.iconSize == 48)
			this.iconSize = 24;
		this.updateSizeStyle();
	},
	onKeyDown: function(ev) {
		let id = ev.keyCode - 49;
		if (ev.ctrlKey && id >= 0 && id <= 4)
			this.buttons[id].onclick(this.buttons[id]);
		else if (ev.ctrlKey && ev.key == "z")
			this.getButtonByLabel("Undo").onclick();
		else if (ev.ctrlKey && ev.key == "y")
			this.getButtonByLabel("Redo").onclick();
		else if (ev.ctrlKey && ev.key == "v")
			this.getButtonByLabel("Insert").onclick();
		else if (ev.ctrlKey && ev.key == "x" || ev.keyCode == 46)
			this.getButtonByLabel("Remove").onclick();
		else if (ev.keyCode == 17 || ev.key == "Control")
			this.hiddenInput.oncopy();
		else if (!ev.ctrlKey && (ev.keyCode == 107 || ev.key == "+"))
			this.increaseIconSize();
		else if (!ev.ctrlKey && (ev.keyCode == 107 || ev.key == "-"))
			this.decreaseIconSize();
	},
	setupInput: function() {
		let input = document.createElement("input")
		input.parent = this;
		input.type = "text";
		input.value = this.selectedData;
		input.onblur = ()=>{
			input.focus();
			input.select();
		}
		input.oncopy = (ev)=>{
			input.value = (typeof this.selectedData === "string") ? this.selectedData : "";
			input.select();
		}
		input.onpaste = (ev)=>{
			if (ev.clipboardData instanceof DataTransfer) {
				if (this.pasteData instanceof Function) {
					this.pasteData(ev.clipboardData.getData("text"));
				}
			}
		}
		input.onkeyup = (ev)=>{
			input.select();
		}
		input.style.position = "fixed";
		input.style.top = "-30px";
		input.style.left = 0;
		input.style.color = 'transparent';
		input.style.border = 'none';
		input.style.outline = 'none';
		input.style.boxShadow = 'none';
		input.style.padding = 0;
		input.style.margin = 0;
		input.style.background = "transparent";
		return input;
	}
}
function Menu(domMenu, domSubmenu) {
	this.assert(domMenu instanceof HTMLDivElement, "Invalid Menu Element (Expected a DIV)");
	this.assert(domSubmenu instanceof HTMLDivElement, "Invalid Submenu Element (Expected a DIV)");
	let domButtons = document.createElement("div");
	domButtons.className = "buttons";
	this.buttons = [];
	this.events = {};
	this.submenu = domSubmenu;
	this.iconSize = 48;
	Menu.prototype.options.forEach((buttonData)=>{
		let buttonElement = document.createElement("div");
		buttonElement.className = "button";
		let labelElement = document.createElement("div");
		labelElement.className = "label";
		let button = this.addButton(domButtons, buttonData, buttonElement, labelElement);
		this.buttons.push(button);
	}
	);
	this.selectedData = "{ type: \"GStructure\", size: { x: 0, y: 0, z: 0 }, data: \"\" }";
	this.pasteData = function(text) {
		console.log("Change me!", text);
	}
	this.hiddenInput = this.setupInput();
	domMenu.appendChild(domButtons);
	domMenu.appendChild(this.hiddenInput);
	this.updateSizeStyle();
	document.addEventListener("keydown", (ev)=>this.onKeyDown.call(this, ev));
}
