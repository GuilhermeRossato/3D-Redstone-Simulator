function Inventory(centeredDiv) {
	this.onItemSwitch = function(before, after) {}
	this.base = centeredDiv;
	/* Create Base Elements */
	this.main = document.createElement("div");
	this.itemsDiv = document.createElement("div");
	this.draggedContainer = document.createElement("div");
	this.selection = document.createElement("div");
	this.scroll = document.createElement("div");
	let selectionGrayEffect = document.createElement("div");
	let draggedImage = document.createElement("div");
	/* Setup Style, Sizing and Positioning */
	this.main.style.width = (195 * 2) + "px";
	this.main.style.height = (172 * 2) + "px";

	this.itemsDiv.style.position = "relative";
	this.itemsDiv.style.height = this.itemsDiv.style.width = "0px";

	this.selection.style.width = this.selection.style.height = "0px";
	this.selection.style.display = "none";
	this.selection.style.position = "relative";
	selectionGrayEffect.style.position = "relative";
	selectionGrayEffect.style.backgroundColor = "rgba(255,255,255,0.42)";
	selectionGrayEffect.style.width = selectionGrayEffect.style.height = "32px";
	this.selection.appendChild(selectionGrayEffect);

	this.draggedContainer.style.display = "none";
	this.draggedContainer.style.width = this.draggedContainer.style.height = "0px";
	draggedImage.style.position = "relative";
	draggedImage.backgroundColor = "green";
	draggedImage.style.width = draggedImage.style.height = "32px";
	this.draggedContainer.style.position = "absolute";
	this.draggedContainer.setPosition = (x, y) => {
		draggedImage.style.left = x+"px";
		draggedImage.style.top = y+"px";
	}
	this.draggedContainer.appendChild(draggedImage);
	/* Setup Scaled Main Background */
	let img = document.createElement("img");
	img.src = "Images/Menu/inventory.png";
	img.style.imageRendering = "-moz-crips-edges";
	img.style.imageRendering = "pixelated";
	img.width = (195 * 2);
	img.height = (172 * 2);
	img.style.width = (195 * 2) + "px";
	img.style.height = (172 * 2) + "px";

	let scrollImage = document.createElement("div");
	this.scroll.style.position = "relative"
	this.scroll.style.width = "0px";
	this.scroll.style.height = "0px";
	this.scroll.style.top = "36px";
	this.scroll.style.left = "350px";
	this.scroll.appendChild(scrollImage);
	scrollImage.style.position = "relative"
	scrollImage.backgroundColor = "red";
	scrollImage.style.width = "24px";
	scrollImage.style.height = "30px";
	scrollImage.style.backgroundRepeat = "no-repeat";
	scrollImage.style.backgroundPositionY = "0px";
	scrollImage.style.backgroundImage = "url(Images/Menu/scroll.png)";
	this.scroll.check = (x,y)=>(x > 350 && y > 36 && x < 350 + 24 && y < 36 + 30);
	this.scroll.below = (x,y)=>(x > 350 && y > 36 + 30 && x < 350 + 24 && y < 330);
	Object.defineProperty(this.scroll, "height", {
		get: function() {
			return this.height_num;
		},
		set: function(num) {
			scrollImage.style.top = num + "px";
			this.height_num = num;
		}
	})
	this.scroll.height = 0;
	scrollImage.style.left = "0px";
	this.scroll.onMouseMove = (x, y) => {

	}
	this.scroll.lower = ()=>{
	}
	Object.defineProperty(this.scroll, "state", {
		get: function() {
			return this.state_num;
		},
		set: function(value) {
			if (value >= 0 && value < 3) {
				this.state_num = value;
				if (value === 0)
					scrollImage.style.backgroundPositionY = "0px";
				else if (value === 1)
					scrollImage.style.backgroundPositionY = "-30px";
				else if (value === 2)
					scrollImage.style.backgroundPositionY = "-60px";
			}
		}
	});
	this.scroll.state_num = 0;
	this.scroll.image = scrollImage;
	/* Setup Functions and Events */
	this.selection.last = {
		x: -1,
		y: -1
	};
	this.selection.setPosition = function(gridPosition) {
		if (gridPosition.x < 0)
			this.hide();
		else {
			this.show();
			this.last = gridPosition;
			if (gridPosition.y === 0)
				this.style.top = 296 + "px";
			else
				this.style.top = gridPosition.y * 36 + "px";
			this.style.left = 18 + gridPosition.x * 36 + "px";
		}
	}
	this.scroll.hide = this.selection.hide = this.draggedContainer.hide = function() {
		this.style.display = "none";
	}
	this.scroll.show = this.selection.show = this.draggedContainer.show = function() {
		this.style.display = "block";
	}
	this.getOffsetLeft = function() {
		return img.offsetLeft;
	}
	this.getOffsetTop = function() {
		return img.offsetTop;
	}
	addEventListener("mousedown", (ev)=>{
		if (this.isShown()) {
			let mx = ev.clientX - img.offsetLeft + window.scrollX;
			let my = ev.clientY - img.offsetTop + window.scrollY;
			this.onMouseDown(ev.button, mx, my);
		}
	}
	)
	addEventListener("mousemove", (ev)=>{
		if (this.isShown()) {
			let mx = ev.clientX - img.offsetLeft + window.scrollX;
			let my = ev.clientY - img.offsetTop + window.scrollY;
			this.onMouseMove(mx, my);
		}
	}
	)
	addEventListener("mouseup", (ev)=>{
		if (this.isShown()) {
			let mx = ev.clientX - img.offsetLeft + window.scrollX;
			let my = ev.clientY - img.offsetTop + window.scrollY;
			this.onMouseUp(ev.button, mx, my);
		}
	}
	)
	/* Setup HTML Element Order */
	this.main.appendChild(this.itemsDiv);
	this.main.appendChild(this.scroll);
	this.main.appendChild(this.selection);
	this.main.appendChild(this.draggedContainer);
	this.main.appendChild(img);
	/* Setup items and display */
	this.items = [];
	this.hotbar = [];
	this.scrollY = 0;
	this.filtered = itensData.filter(obj=>(obj.id ? true : false));
	this.refreshItems();
	this.loadFromCookies();
}

Inventory.prototype = {
	constructor: Inventory,
	onMouseDown: function(btn, x, y) {
		if (btn === 0) {
			if (this.dragging)
				this.stopDragging(x, y);
			else if (this.scroll.check(x, y))
				this.scroll.state = 2;
			else if (this.scroll.below(x, y))
				this.scroll.lower();
			else
				this.startDragging(x, y);
		}
	},
	onMouseMove: function(x, y) {
		if (this.scroll.state === 2) {
			this.scroll.onMouseMove(x, y);
		} else if (this.scroll.check(x, y)) {
			if (this.scroll.state === 0)
				this.scroll.state = 1;
		} else if (this.scroll.state === 1)
			this.scroll.state = 0;
		else if (this.dragging)
			this.onMouseDrag(x, y);
		else
			this.handleSelection(x, y);
	},
	handleSelection: function(x, y) {
		let gridPosition = this.translatePixelToGrid(x, y);
		this.selection.setPosition(gridPosition);
	},
	onMouseDrag: function(x, y) {
		this.draggedContainer.setPosition(x - 16, y - 16);
	},
	onMouseUp: function(btn, x, y) {
		if (this.scroll.state === 2)
			this.scroll.stopDragging();
	},
	loadFromCookies: function() {
		let hotbar = [];
		if (typeof getCookie === "function") {
			for (let i = 0; i < 9; i++) {
				let ck = getCookie("itemId_" + (i + 1) + "_rs")
				hotbar.push(ck ? parseInt(ck) : -1);
			}
			hotbar.forEach((obj,i)=>{
				this.hotbar[i] = (obj !== -1) ? this.addItem(i, 0, obj) : undefined;
			}
			);
		}
	},
	saveToCookies: function() {
		if (typeof setCookie === "function") {
			for (let i = 0; i < 9; i++) {
				setCookie("itemId_" + (i + 1) + "_rs", this.hotbar[i] ? this.hotbar[i].itemId : -1);
			}
		}
	},
	show: function() {
		this.base.appendChild(this.main);
	},
	clearItems: function() {
		while (this.itemsDiv.firstChild)
			this.itemsDiv.removeChild(this.itemsDiv.firstChild);
	},
	refreshItems: function() {
		this.clearItems();
		let id = 0;
		for (var i = 0; i < 7; i++) {
			for (var j = 0; j < 9; j++) {
				if (this.filtered.length > id) {
					this.addItem(j, i + 1, this.filtered[id].i);
					id++;
				} else {
					break;
				}
			}
		}
		if (this.filtered.length > 7 * 9) {
			this.scroll.maxIndex = Math.ceil((this.filtered.length/9)-7);
			this.scroll.show();
		} else
			this.scroll.hide();
	},
	addItem: function(x, y, itemIndex) {
		var holder = document.createElement("div");
		holder.style.position = "relative";
		holder.style.height = "0px";
		holder.style.width = "0px";
		this.itemsDiv.appendChild(holder);
		var element = document.createElement("div");
		element.style.height = element.style.width = "32px";
		let layX = 18 + x * 36
		  , layY = y * 36;
		if (y === 0) {
			layY = 296;
		}
		element.style.position = "relative";
		element.style.top = layY + "px";
		element.style.left = layX + "px";
		element.style.backgroundRepeat = "no-repeat";
		element.style.backgroundPositionY = (-itensData[itemIndex].texture * 32) + "px";
		element.style.backgroundImage = "url(Images/Menu/items.png)";
		//element.style.backgroundColor = "green";
		element.itemId = itemIndex;
		element.x = x;
		element.y = y;
		element.onmousemove = this.selection.onmousemove;
		this.items.push(element);
		holder.appendChild(element);
		return element;
	},
	removeItem: function(element, x, y) {
		let len = this.items.length;
		for (let i = 0; i < len; i++) {
			if (this.items[i].x === x && this.items[i].y === y) {
				this.items.splice(i, 1);
				i--;
				len--;
			}
		}
		this.itemsDiv.removeChild(element);
	},
	translatePixelToGrid: function(x, y) {
		if (x >= 16 && x < 340) {
			if (y >= 34 && y < 286) {
				return {
					x: (((x - 16) / 36) | 0),
					y: (((y - 34) / 36) | 0) + 1
				}
			} else if (y > 294 && y <= 294 + 32) {
				return {
					x: (((x - 16) / 36) | 0),
					y: 0
				}
			}
		}
		return {
			x: -1,
			y: -1
		}
	},
	startDragging: function(x, y) {
		let gridPosition = this.translatePixelToGrid(x, y);
		if (gridPosition.x >= 0) {
			this.selectionData = this.items.filter((obj)=>obj.x === gridPosition.x && obj.y === gridPosition.y)[0];
			if (this.selectionData) {
				this.dragging = true;
				this.selection.hide();
				let element = this.draggedContainer.children[0];
				element.style.backgroundRepeat = this.selectionData.style.backgroundRepeat;
				element.style.backgroundPositionY = this.selectionData.style.backgroundPositionY;
				element.style.backgroundImage = this.selectionData.style.backgroundImage;
				this.draggedContainer.show();
				this.onMouseDrag(x, y);
			}
		}
		if ((gridPosition.y === 0) && (this.selectionData)) {
			if (!(this.hotbar[gridPosition.x])) {
				logger.error("Incorrect hotbar place");
			} else {
				if (this.onItemSwitch)
					this.onItemSwitch({
						position: gridPosition.x,
						id: this.hotbar[gridPosition.x].itemId
					}, {
						position: gridPosition.x,
						id: -1
					});
				this.selectionData = {
					itemId: this.selectionData.itemId,
					x: gridPosition.x,
					y: gridPosition.y,
					style: {}
				}
				this.removeItem(this.hotbar[gridPosition.x].parentNode, gridPosition.x, gridPosition.y);
				this.hotbar[gridPosition.x] = undefined;
				this.saveToCookies();
			}
		}
	},
	stopDragging: function(x, y) {
		let gridPosition = this.translatePixelToGrid(x, y);
		if (gridPosition.x >= 0) {
			this.dragging = false;
			this.draggedContainer.hide();
			this.selection.show();
			this.onMouseMove(x, y);
			if (gridPosition.y === 0) {
				if (this.hotbar[gridPosition.x] === undefined) {
					if (this.onItemSwitch)
						this.onItemSwitch({
							position: gridPosition.x,
							id: -1
						}, {
							position: gridPosition.x,
							id: this.selectionData.itemId
						});
					this.hotbar[gridPosition.x] = this.addItem(gridPosition.x, gridPosition.y, this.selectionData.itemId);
				} else {
					if (this.onItemSwitch)
						this.onItemSwitch({
							position: gridPosition.x,
							id: this.hotbar[gridPosition.x].itemId
						}, {
							position: gridPosition.x,
							id: this.selectionData.itemId
						});
					this.removeItem(this.hotbar[gridPosition.x].parentNode, gridPosition.x, gridPosition.y);
					this.hotbar[gridPosition.x] = this.addItem(gridPosition.x, gridPosition.y, this.selectionData.itemId);
				}
				this.saveToCookies();
			}
		}
	},
	hide: function() {
		if (this.dragging) {
			this.dragging = false;
			this.draggedContainer.hide();
			this.selection.hide();
		}
	},
	isShown: function() {
		if (this.main.parentNode)
			return ( this.main.style.display !== "none")
		else
			return false;
	}
}
