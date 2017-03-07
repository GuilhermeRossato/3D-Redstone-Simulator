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
	"271 Wooden Axe": {
		onSelected: function(current) {
			
		},
		onDeselected: function(last) {
			
		},
		onLeftDown: function(ev) {
			
		},
		onLeftUp: function(ev) {
			
		}
	}
}

function onItemChange(last, current) {
	if (ItemFunctions[last.name] && ItemFunctions[last.name].onDeselected)
		ItemFunctions[last.name].onDeselected(current);
	if (ItemFunctions[current.name] && ItemFunctions[current.name].onSelected)
		ItemFunctions[current.name].onSelected(last);
}

function onWorldClick(ev) {
	if (ev.type === "LeftDown") {
		if (ItemFunctions[ev.selectedItem.name] && ItemFunctions[ev.selectedItem.name].onLeftDown)
			ItemFunctions[ev.selectedItem.name].onLeftDown(ev);
	} else if (ev.type === "LeftUp")
		if (ItemFunctions[ev.selectedItem.name] && ItemFunctions[ev.selectedItem.name].onLeftUp)
			ItemFunctions[ev.selectedItem.name].onLeftUp(ev);
	
}