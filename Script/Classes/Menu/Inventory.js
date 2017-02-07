function Inventory(centeredDiv) {
	this.base = centeredDiv;
	/* Create Base Elements */
	this.main = document.createElement("div");
	this.itemsDiv = document.createElement("div");
	this.draggedContainer = document.createElement("div");
	this.selection = document.createElement("div");
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
	this.draggedContainer.appendChild(draggedImage);
	/* Setup Scaled Main Background */
	let img = document.createElement("img");
	img.src = "Images/Menu/inventory.png";
	img.style.imageRendering = "-moz-crips-edges";
	img.style.imageRendering = "pixelated";
	img.width = 195 * 2;
	img.height = 172 * 2;
	img.style.width = (195*2)+"px";
	img.style.height = (172*2)+"px";
	/* Setup Functions and Events */
	this.draggedContainer.onmousemove = this.selection.onmousemove = img.onmousemove = (ev)=>{
		if (this.dragging)
			this.onMouseDrag(ev.clientX, ev.clientY)
		else
			this.onMouseMove(ev.clientX - img.offsetLeft + window.scrollX, ev.clientY - img.offsetTop + window.scrollY)
	}
	this.selection.last = {x:-1, y:-1};
	this.selection.setPosition = function(gridPosition) {
		if (gridPosition.x < 0)
			this.hide();
		else {
			this.show();
			this.last = gridPosition;
			if (gridPosition.y === 0)
				this.style.top = 296+"px";
			else
				this.style.top = gridPosition.y*36+"px";
			this.style.left = 18+gridPosition.x*36+"px";
		}
	}
	this.selection.hide = this.draggedContainer.hide = function() {
		this.style.display = "none";
	}
	this.selection.show = this.draggedContainer.show = function() {
		this.style.display = "block";
	}
	this.getOffsetLeft = function() {
		return img.offsetLeft;
	}
	this.getOffsetTop = function() {
		return img.offsetTop;
	}
	this.main.onmousedown = (ev) => {
		if (this.dragging)
			this.stopDragging(ev.clientX - img.offsetLeft + window.scrollX, ev.clientY - img.offsetTop + window.scrollY);
		else
			this.startDragging(ev.clientX - img.offsetLeft + window.scrollX, ev.clientY - img.offsetTop + window.scrollY, ev.clientX, ev.clientY);
	}
	/* Setup HTML Element Order */
	this.main.appendChild(this.itemsDiv);
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
	loadFromCookies: function() {
		let hotbar = [];
		if (typeof getCookie === "function") {
			for (let i = 0; i < 9; i++) {
				let ck = getCookie("itemId_"+(i+1)+"_rs")
				hotbar.push(ck?parseInt(ck):-1);
			}
			hotbar.forEach((obj,i) => {
				this.hotbar[i] = (obj !== -1)?this.addItem(i, 0, obj):undefined;
			});
		}
	},
	saveToCookies: function() {
		if (typeof setCookie === "function") {
			for (let i = 0; i < 9; i++) {
				setCookie("itemId_"+(i+1)+"_rs", this.hotbar[i]?this.hotbar[i].itemId:-1);
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
	},
	addItem: function(x, y, itemId) {
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
		element.style.backgroundPositionY = (-itensData[itemId].texture * 32) + "px";
		element.style.backgroundImage = "url(Images/Menu/items.png)";
		//element.style.backgroundColor = "green";
		element.itemId = itemId;
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
				this.items.splice(i,1);
				i--;
				len--;
			}
		}
		this.itemsDiv.removeChild(element);
	},
	translatePixelToGrid: function(x,y) {
		if (x >= 16 && x < 340) {
			if (y >= 34 && y < 286) {
				return {
					x: (((x-16)/36)|0),
					y: (((y-34)/36)|0)+1
				}
			} else if (y > 294 && y <= 294 + 32) {
				return {
					x: (((x-16)/36)|0),
					y: 0
				}
			}
		}
		return {x:-1, y:-1}
	},
	onMouseMove: function(x, y) {
		let gridPosition = this.translatePixelToGrid(x,y);
		this.selection.setPosition(gridPosition);
	},
	startDragging: function(x, y, rx, ry) {
		let gridPosition = this.translatePixelToGrid(x,y);
		if (gridPosition.x >= 0) {
			this.selectionData = this.items.filter((obj)=>obj.x===gridPosition.x&&obj.y===gridPosition.y)[0];
			if (this.selectionData) {
				this.dragging = true;
				this.selection.hide();
				this.draggedContainer.show();
				this.onMouseDrag(rx, ry);
				let element = this.draggedContainer.children[0];
				element.style.backgroundRepeat = this.selectionData.style.backgroundRepeat;
				element.style.backgroundPositionY = this.selectionData.style.backgroundPositionY;
				element.style.backgroundImage = this.selectionData.style.backgroundImage;
			}
		}
		if ((gridPosition.y === 0) && (this.selectionData)) {
			if (!(this.hotbar[gridPosition.x])) {
				//console.error("Incorrect hotbar place");
				logger.error("Incorrect hotbar place");
			} else {
				this.selectionData = {itemId: this.selectionData.itemId, x:gridPosition.x, y:gridPosition.y, style:{}}
				this.removeItem(this.hotbar[gridPosition.x].parentNode, gridPosition.x, gridPosition.y);
				this.hotbar[gridPosition.x] = undefined;
				this.saveToCookies();
			}
		}
	},
	stopDragging: function(x, y) {
		let gridPosition = this.translatePixelToGrid(x,y);
		if (gridPosition.x >= 0) {
			this.dragging = false;
			this.draggedContainer.hide();
			this.selection.show();
			this.onMouseMove(x,y);
			if (gridPosition.y === 0) {
				if (this.hotbar[gridPosition.x] === undefined) {
					this.hotbar[gridPosition.x] = this.addItem(gridPosition.x, gridPosition.y, this.selectionData.itemId);
				} else {
					this.removeItem(this.hotbar[gridPosition.x].parentNode, gridPosition.x, gridPosition.y);
					this.hotbar[gridPosition.x] = this.addItem(gridPosition.x, gridPosition.y, this.selectionData.itemId);
				}
				this.saveToCookies();
			}
		}
	},
	onMouseDrag: function(x, y) {
		this.draggedContainer.style.top = (y-16)+"px";
		this.draggedContainer.style.left = (x-16)+"px";
	}
}
