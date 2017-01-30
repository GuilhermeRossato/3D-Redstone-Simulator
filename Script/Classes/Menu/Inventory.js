var g;

function Inventory(centeredDiv) {
	this.base = centeredDiv;
	this.main = document.createElement("div");
	this.main.style.width = (195 * 2) + "px";
	this.main.style.height = (172 * 2) + "px";
	/* Setup Scaled Background */
	let img = document.createElement("img");
	img.src = "Images/Menu/inventory.png";
	img.width = 195 * 2;
	console.log(img.style.imageRendering);
	img.style.imageRendering = "-moz-crips-edges";
	img.style.imageRendering = "pixelated";
	this.main.appendChild(img);
	/* Setup items */
	this.items = [];
	this.topItems = document.createElement("div");
	this.topItems.style.position = "relative";
	this.topItems.style.height = this.topItems.style.width = "0px";
	this.main.appendChild(this.topItems);
	this.bottomItems = document.createElement("div");
	this.bottomItems.style.position = "relative";
	this.bottomItems.style.height = this.bottomItems.style.width = "0px";
	this.main.appendChild(this.bottomItems);
	/* Setup Mouse Hover Selection */
	this.selection = document.createElement("div");
	this.selection.style.backgroundColor = "rgba(255,255,255,0.42)";
	this.selection.style.width = this.selection.style.height = "32px";
	this.selection.style.display = "none";
	this.selection.style.position = "absolute";
	this.selection.setPosition = function(marginLeft, marginTop, mouseX, mouseY) {
		this.x = mouseX / 36 | 0;
		this.y = mouseY / 36 | 0;
		this.style.left = (img.offsetLeft + window.scrollX + marginLeft + (this.x) * 36) + "px";
		this.style.top = (img.offsetTop + window.scrollY + marginTop + (this.y) * 36) + "px";
	}
	this.getOffsetLeft = function() {
		return img.offsetLeft;
	}
	this.getOffsetTop = function() {
		return img.offsetTop;
	}
	this.selection.onmousemove = img.onmousemove = (ev)=>{
		this.onMouseMove(ev.clientX - img.offsetLeft + window.scrollX, ev.clientY - img.offsetTop + window.scrollY)
	}
	this.main.appendChild(this.selection);
	this.scrollY = 0;
	this.filtered = itemData;
	this.refreshItems();
}

Inventory.prototype = {
	constructor: Inventory,
	show: function() {
		this.base.appendChild(this.main);
	},
	clearItems: function() {
		while (this.topItems.firstChild)
			this.topItems.removeChild(this.topItems.firstChild);
		while (this.bottomItems.firstChild)
			this.bottomItems.removeChild(this.bottomItems.firstChild);
	},
	refreshItems: function() {
		this.clearItems();
		for (var i = 0; i < 9; i++) {
			for (var j = 0; j < 7; j++) {
				this.addItem(i,j+1,i+(j+this.scrollY)*9);
			}
		}
	},
	addItem: function(x, y, itemId) {
		var holder = document.createElement("div");
		holder.style.position = "relative";
		holder.style.height = "0px";
		holder.style.width = "0px";
		if (y === 0)
			this.bottomItems.appendChild(holder);
		else
			this.topItems.appendChild(holder);
			
		var element = document.createElement("div");
		element.style.height = element.style.width = "32px";
		let layX = 18+x*36, layY = 95+252-y*36;
		if (y === 0) {
			layY = 51;
		}
		element.style.position = "relative";
		element.style.top = "-"+layY+"px";
		element.style.left = layX+"px";
		//element.style.backgroundColor = "red";
		element.onmousemove = this.selection.onmousemove;
		holder.appendChild(element);
		element.style.backgroundRepeat = "no-repeat";
		element.style.backgroundPositionY = (-itemData[itemId].texture*32)+"px";
		element.style.backgroundImage = "url(Images/Menu/items.png)";

/*
	background-position-x: 0px;
	background-position-y: -32px;
	background-size: initial;
	background-repeat-x: no-repeat;
	background-repeat-y: no-repeat;
	*/
		g = element;
		//element.style.background = "url(Images/Menu/items.png) 0 -32px no-repeat;";
		this.items.push({
			itemId: itemId,
			element: element
		});
	},
	onMouseMove: function(x, y) {
		if (x >= 16 && x < 340) {
			if (y >= 34 && y < 286) {
				this.selection.style.display = "block";
				this.selection.setPosition(18, 0, x - 16, y - 34 + 36);
			} else if (y > 294 && y < 294 + 32) {
				this.selection.style.display = "block";
				this.selection.setPosition(18, 296, x - 16, y - 294);
			} else {
				this.selection.style.display = "none";
			}
		} else {
			this.selection.style.display = "none";
		}
		console.log(x, y, this.selection.x, this.selection.y);
	}
}
