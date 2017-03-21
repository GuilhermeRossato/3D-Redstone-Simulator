function Hotbar(inventory, recipient) {
	this.onItemChange = function(x, id) {}
	/* Variables */
	this.selection = 0;
	this.inventory = inventory;
	/* Dom Elements */
	this.main = document.createElement("div");
	this.sub = document.createElement("div");
	let selection = document.createElement("img");
	let img = document.createElement("img");
	this.items = document.createElement("div");

	this.main.style.width = this.main.style.height = "0px";
	this.sub.style.position = "absolute";

	selection.style.imageRendering = "-moz-crips-edges";
	selection.style.imageRendering = "pixelated";
	selection.src = "Images/Menu/selection.png";
	selection.style.position = "relative";
	selection.style.width = selection.style.height = "48px";
	selection.style.top = "2px";
	selection.style.left = (-182 * 2 - 1) + "px";

	img.style.imageRendering = "-moz-crips-edges";
	img.style.imageRendering = "pixelated";
	img.src = "Images/Menu/gui.png";
	img.style.width = 182 * 2 + "px";
	img.style.height = 22 * 2 + "px";

	this.items.style.width = this.items.style.height = "0px";
	this.items.style.position = "relative";
	/* Append Childs */

	this.sub.appendChild(this.items);
	this.sub.appendChild(img);
	this.sub.appendChild(selection);
	this.main.appendChild(this.sub);

	/* Functions and events */
	window.addEventListener("keydown", (ev)=>{
		if (ev.key > '0' && ev.key <= '9')
			this.onNumberPress(parseInt(ev.key))
	}
	);
	window.addEventListener("wheel", (ev)=>{
		if (ev.deltaY > 0)
			this.onScrollDown();
		else
			this.onScrollUp();
	}
	);
	window.addEventListener("resize", (ev)=>{
		this.onWindowResize(window.innerWidth, window.innerHeight)
	}
	);
	this.setSelectionPosition = (id)=>{
		selection.style.left = (-365 + 40 * id) + "px";
	}
	this.show = ()=>{
		if (!this.isShown()) {
			this.updateHotbar();
			recipient.appendChild(this.main);
		}
	}
	this.ids = new Array(9);
	/* Function Calls */
	this.onWindowResize(window.innerWidth, window.innerHeight);
}

Hotbar.prototype = {
	constructor: Hotbar,
	onScrollUp: function() {
		if (this.isShown())
			this.updateSelection(this.selection <= 0 ? 8 : this.selection - 1);
	},
	onScrollDown: function() {
		if (this.isShown())
			this.updateSelection((this.selection + 1) % 9);
	},
	clearItems: function() {
		while (this.items.firstChild)
			this.items.removeChild(this.items.firstChild);
	},
	addItem: function(x, itemData) {
		var holder = document.createElement("div");
		holder.style.position = "relative";
		holder.style.height = "0px";
		holder.style.width = "0px";
		this.items.appendChild(holder);
		var element = document.createElement("div");
		element.itemId = itemData.itemId;
		element.style.height = element.style.width = "32px";
		element.style.position = "relative";
		element.style.top = "11px";
		element.style.left = (7 + x * 40) + "px";
		element.style.backgroundRepeat = "no-repeat";
		element.style.backgroundPositionY = (-itensData[element.itemId].texture * 32) + "px";
		element.style.backgroundImage = "url(Images/Menu/items.png)";
		holder.appendChild(element);
	},
	updateHotbar: function() {
		this.clearItems();
		for (var i = 0; i < 9; i++) {
			if (this.inventory.hotbar[i]) {
				this.addItem(i, this.inventory.hotbar[i]);
				this.ids[i] = this.inventory.hotbar[i].itemId;
			} else {
				this.ids[i] = -1;
			}
		}
	},
	isShown: function() {
		if (this.main.parentNode)
			return ( this.main.style.display !== "none")
		else
			return false;
	},
	updateSelection: function(number) {
		var before = {
			position: this.selection,
			id: this.ids[this.selection]
		};
		var after = {
			position: number,
			id: this.ids[number]
		}
		this.onItemChange(before, after);
		this.selection = number;
		this.setSelectionPosition(number);
	},
	onNumberPress: function(number) {
		this.updateSelection(number - 1);
	},
	onWindowResize: function(width, height) {
		this.sub.style.top = (height - 88) + "px";
		this.sub.style.left = (width / 2 - 182) + "px";
	}
}
