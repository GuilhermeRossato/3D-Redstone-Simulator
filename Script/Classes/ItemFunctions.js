const WorldInterface = {
	getBlock: function(x,y,z) {
		let blockInfo = world.getBlock(x,y,z);
		if (blockInfo)
			return blockInfo.id;
	},
	setBlock: function(x,y,z,id) {
		world.setBlock(x,y,z,id);
	},
	getHotbarItem: function(id) {
		
	}
}

const ItemFunctions = {
	//"271 Wooden Axe": {
	"1 Stone": {
		onSelected: function() {
			console.log("Selected");
		},
		onDeselected: function() {
			console.log("Deselected");
		},
		onLeftDown: function() {
			
		},
		onLeftUp: function() {
			
		}
	}
}

function onWorldClick(ev) {
	if (ev.type === "LeftDown") {
		if (ItemFunctions[ev.selectedItem.name] && ItemFunctions[ev.selectedItem.name].onLeftDown)
			ItemFunctions[ev.selectedItem.name].onLeftDown(ev);
	} else if (ev.type === "LeftUp")
		if (ItemFunctions[ev.selectedItem.name] && ItemFunctions[ev.selectedItem.name].onLeftUp)
			ItemFunctions[ev.selectedItem.name].onLeftUp(ev);	
}