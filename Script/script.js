var camera, scene, renderer;
var geometry, material, mesh;
var controls;
var velocity, light, player;
var blocks;
var animator;
var selection, helper;
var seed;
function manualRandom() {
	var x = Math.sin(seed++) * 10000;
	return x - Math.floor(x);
}
function generateArea(side) {
	seed = 9800;
	var map = new Uint8Array(side * side);
	var repeatSmoothing = 6;
	var maxHeight = 25;
	var i, j, k;
	for (i = 0; i < side * side; i++)
		map[i] = manualRandom() * maxHeight;
	for (k = 0; k < repeatSmoothing; k++) {
		var newMap = new Uint8Array(side * side);
		for (i = 0; i < side * side; i++) {
			var sum = 0;
			var count = 0;
			for (j = 0; j < 9; j++) {
				var realId = i + ((j % 3) - 1) + (((j / 3) | 0) - 1) * side;
				if (map[realId] !== undefined) {
					sum += map[realId];
					count += 1;
				}
			}
			newMap[i] = b(sum / count, map[i], 0);
		}
		map = newMap;
	}
	var min = map[0];
	for (i = 1; i < side * side; i++)
		min = Math.min(map[i], min);
	for (i = 0; i < side * side; i++)
		map[i] -= min;
	return map;
}
function addBlocksInWorld() {
	var area = generateArea(20);
	var candidates = [2, 2, 2, 98, 98, 98, 98, 178, 98, 98, 178, 98, 178, 98, 178, 178, 98, 178, 2, 178, 178, 98, 178, 17, 178, 178];
	seed = 1302;
	for (var i = 0; i < 20; i++) {
		for (var j = 0; j < 20; j++) {
			var selectedId = candidates[candidates.length * manualRandom() | 0];
			blocks.setBlock(i - 10, area[i + j * 20], j - 10, selectedId);
		}
	}
	/*blocks.setBlock(-1, area[9 + 10 * 20] + 1, 0, 203);
	blocks.setBlock(0, area[10 + 10 * 20] + 1, 0, 203);
	blocks.setBlock(1, area[11 + 10 * 20] + 1, 0, 203);
	blocks.setBlock(-1, area[9 + 12 * 20] + 1, 2, 203);
	blocks.setBlock(0, area[10 + 12 * 20] + 1, 2, 203);
	blocks.setBlock(1, area[11 + 12 * 20] + 1, 2, 203);*/
}
function setup() {
	/* Render Setup */
	renderer = new THREE.WebGLRenderer({
		antialias: false,
		alpha: false
	});
	renderer.setClearColor(0x333333, 1);
	/* Camera Setup*/
	camera = new THREE.PerspectiveCamera(75,window.innerWidth / window.innerHeight,0.25,options.viewDistance);
	document.body.appendChild(renderer.domElement);
	resize();
	/* Scene Setup */
	scene = new THREE.Scene();
	options.lights.placeInto(scene);
	/* Setup Blocks */
	blocks = new BlockController(scene);
	addBlocksInWorld();
	/* Control Setup */
	controls = new MinecraftControls(scene,camera);
	/* Base (Bottom Plane) Setup */
	geometry = new THREE.PlaneGeometry(16 * 4,16 * 4,10,10);
	geometry.rotateX(-Math.PI / 2);
	material = new THREE.MeshBasicMaterial({
		vertexColors: THREE.VertexColors
	});
	mesh = new THREE.Mesh(geometry,material);
	mesh.position.y = -0.5;
	scene.add(mesh);
	/* Animation Setup */
	animator = new AnimationController(camera);
	blocks.setBlock(0, 0, 0, 2);
	/* Initialize Variables */
	raycaster = new THREE.Raycaster(undefined, undefined, 0, 10);
	velocity = new THREE.Vector3(0,0,0);
	/* Initializing Selection Box */
	material = new THREE.MeshLambertMaterial({
		color: 0xff0000,
		wireframe: true
	});
	helper = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.2,0.2), material);
	scene.add(helper);
	var h = options.selectionBoundSpace / 2;
	geometry = new THREE.Geometry();
	geometry.vertices.push(
		new THREE.Vector3(-h,-h,-h),
		new THREE.Vector3(-h,h,-h),
		new THREE.Vector3(h,h,-h),
		new THREE.Vector3(h,-h,-h),
		new THREE.Vector3(-h,-h,-h),
		new THREE.Vector3(-h,-h,h),
		new THREE.Vector3(-h,h,h),
		new THREE.Vector3(h,h,h),
		new THREE.Vector3(h,-h,h),
		new THREE.Vector3(h,-h,-h),
		new THREE.Vector3(h,h,-h),
		new THREE.Vector3(-h,h,-h),
		new THREE.Vector3(-h,h,h),
		new THREE.Vector3(-h,-h,h),
		new THREE.Vector3(h,-h,h),
		new THREE.Vector3(h,h,h),
		new THREE.Vector3(h,h,-h)
	);
	material = new THREE.LineBasicMaterial({
		color: 0x000000
	});
	selection = new THREE.Line(geometry, material);
	scene.add(selection);
}
function update() {
	raycaster.setFromCamera(new THREE.Vector2(0,0), camera);
	selection.visible = false;
	helper.visible = false;
	var intersections = raycaster.intersectObjects(scene.children);
	var lastInter = undefined;
	intersections.some((obj)=>{
		if (obj.object.realPosition instanceof THREE.Vector3) {
			lastInter = obj;
			return true;
		}
		return false;
	}
	);
	controls.update();
	if (lastInter) {
		helper.visible = selection.visible = true;
		selection.position.copy(lastInter.object.realPosition);
		helper.position.copy(lastInter.point);
		helper.rotation.copy(camera.getWorldRotation());
		helper.rotateZ(-0.7854);
	}
	if (typeof animator === "object" && animator.enabled && !animator.manualStep) {
		animator.step();
	} else if (typeof animator === "object" && animator.enabled) {
		animator.updateCamera();
	}
	renderer.render(scene, camera);
}
function resize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}
function updateMenuCookies() {
	if (typeof setCookie === "function") {
		setCookie("rs_statsExtended", stats.dom.children[0].enabled ? '1' : '0', 30);
		setCookie("rs_smallMenu", (menu.iconSize === 24) ? '1' : '0');
	}
}
stats.begin();
setup();
mainUpdateLoop();
window.addEventListener('resize', resize, false);
function mainUpdateLoop() {
	stats.update();
	menuClick = false;
	var delta = stats.delta;
	if (delta >= 16 * 1) {
		if (delta < 16 * 2) {
			stats.normalStep();
			stats.delta -= 16;
			update();
		} else if (delta < 16 * 3) {
			stats.normalStep();
			stats.delta -= 16 * 2;
			update();
			update();
		} else if (delta < 16 * 4) {
			stats.normalStep();
			stats.delta -= 16 * 3;
			update();
			update();
			update();
		} else if (delta < 16 * 8) {
			stats.lagStep();
		} else {
			stats.lagStep();
			controls.releaseMouse();
		}
	}
	requestAnimationFrame(mainUpdateLoop);
}
