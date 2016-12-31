var options = {
	playerSpeed: 0.075,
	viewDistance: 100
};
var controlsEnabled = false;
var camera, scene, renderer;
var geometry, material, mesh;
var controls;
var velocity, light, player;
var chunks;
var animator;

function setup() {
	renderer = new THREE.WebGLRenderer({
		antialias: false,
		alpha: false
	});
	renderer.setClearColor(0x333333, 1)
	camera = new THREE.PerspectiveCamera(75,window.innerWidth / window.innerHeight,0.25,options.viewDistance);
	scene = new THREE.Scene();
	chunks = new ChunkController(scene);
	chunks.createFirstMesh(168); // Stone Brick
	chunks.createFirstMesh(160); // Spruce Plank
	chunks.createFirstMesh(24); // Sandstone

	//scene.fog = new THREE.Fog(0xf2f7ff,1,100);

	light = new THREE.DirectionalLight(0xffffff,4);
	light.position.set(3, 4, 2);
	scene.add(light);
	light = new THREE.DirectionalLight(0xffffff,3);
	light.position.set(-4, -2, -3);
	scene.add(light);
	
	controls = new THREE.PointerLockControls(camera);
	
	player = controls.getObject();
	loadPlayerFromCookies();
	scene.add(player);
	//raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );
	geometry = new THREE.PlaneGeometry(16 * 4,16 * 4,10,10);
	geometry.rotateX(-Math.PI / 2);
	material = new THREE.MeshBasicMaterial({
		vertexColors: THREE.VertexColors
	});
	mesh = new THREE.Mesh(geometry,material);
	mesh.position.y = -0.5;
	scene.add(mesh);
	var translate = [0, 0, 0];
	var blockIdNow;
	function addBlock(x, y, z, geo, mater) {
		var cube = new THREE.Mesh(geo,mater);
		cube.position.x = x + translate[0];
		cube.position.y = y + translate[1];
		cube.position.z = z + translate[2];
		cube.blockId = blockIdNow;
		scene.add(cube);
		chunks.blocks.push(cube);
	}
	geometry = chunks.geometries.cube;
	blockIdNow = 24;
	material = chunks.getMesh(blockIdNow);
	for (var i = -4; i <= 4; i++) {
		for (var j = -4; j <= 4; j++) {
			addBlock(i, 0, j, geometry, material);
		}
	}
	blockIdNow = 160;
	material = chunks.getMesh(blockIdNow);
	translate[0] = -3;
	translate[2] = 0;
	addBlock(1, 1, 0, geometry, material);
	addBlock(1, 1, -1, geometry, material);
	addBlock(2, 2, 0, geometry, material);
	addBlock(1, 2, 0, geometry, material);
	addBlock(3, 2, 0, geometry, material);
	blockIdNow = 168;
	material = chunks.getMesh(blockIdNow);
	addBlock(3, 1, 0, geometry, material);
	addBlock(4, 1, 0, geometry, material);
	addBlock(5, 1, 0, geometry, material);
	addBlock(4, 1, 1, geometry, material);
	addBlock(5, 1, 1, geometry, material);
	blockIdNow = 24;
	material = chunks.getMesh(blockIdNow);
	translate[0] = 0;
	addBlock(0, 3, 0, geometry, material);
	addBlock(1, 3, -1, geometry, material);
	addBlock(1, 2, 0, geometry, material);
	document.body.appendChild(renderer.domElement);
	velocity = new THREE.Vector3();
	for (var x = -4 ; x <= 4; x ++) {
		for (var y = 0; y <= 3; y ++) {
			addBlock(5, y, x, geometry, material);
			addBlock(-5, y, x, geometry, material);
		}
	}
	animator = new AnimationController(camera, true, false);
}
function update() {
	//raycaster.ray.origin.copy(player.position)
	//raycaster.ray.origin.y -= 10;
	//var intersections = raycaster.intersectObjects(blocks);
	//var isOnObject = intersections.length > 0;
	
	velocity.x = 0;
	velocity.y = 0;
	velocity.z = 0;
	if (controls.moveForward)
		velocity.z -= 1;
	if (controls.moveBackward)
		velocity.z += 1;
	if (controls.moveLeft)
		velocity.x -= 1;
	if (controls.moveRight)
		velocity.x += 1;
	velocity.normalize();
	if (controls.moveUp)
		velocity.y += 1;
	if (controls.moveDown)
		velocity.y -= 1;
	velocity.multiplyScalar(options.playerSpeed);
	player.translateX(velocity.x);
	player.translateY(velocity.y);
	player.translateZ(velocity.z);
	if (player.position < 0) {
		player.position = 0;
		if (velocity.y < 0)
			velocity.y = 0;
	}
	if (typeof animator === "object" && animator.enabled && !animator.manualStep) {
		animator.step();
	} else if (typeof animator === "object" && animator.enabled) {
		animator.updateCamera();
	}
	renderer.render(scene, camera);
}
function pause() {
	document.exitPointerLock();
}
function resume() {
	document.body.requestPointerLock();
}
function onClick() {
	pause();
}
function resize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}
function onPointerlockChange(event) {
	if (document.pointerLockElement == document.body) {
		controlsEnabled = true;
		controls.enabled = true;
	} else {
		updatePositionalCookie();
		controlsEnabled = false;
		controls.enabled = false;
	}
}
function updatePositionalCookie() {
	if ((typeof setCookie === "function")&&((typeof animator === "object" && animator.enabled == false)||(typeof animator === "undefined"))) {
		setCookie("rs_posX", player.position.x, 30);
		setCookie("rs_posY", player.position.y, 30);
		setCookie("rs_posZ", player.position.z, 30);
		setCookie("rs_rotX", controls.getPitchObject().rotation.x, 30);
		setCookie("rs_rotY", player.rotation.y, 30);
	}
}
function loadPlayerFromCookies() {
	if (typeof getCookie === "function") {
		var x = getCookie("rs_posX")
		  , y = getCookie("rs_posY")
		  , z = getCookie("rs_posZ");
		if (x && y && z) {
			player.position.x = parseFloat(x);
			player.position.y = parseFloat(y);
			player.position.z = parseFloat(z);
		}
		x = getCookie("rs_rotX");
		y = getCookie("rs_rotY");
		if (x && y) {
			controls.getPitchObject().rotation.x = parseFloat(x);
			player.rotation.y = parseFloat(y);
		}
	}
}
function updateMenuCookies() {
	if (typeof setCookie === "function") {
		setCookie("rs_statsExtended", stats.dom.children[0].enabled ? '1' : '0', 30);
		setCookie("rs_smallMenu", (menu.iconSize === 24) ? '1' : '0');
	}
}
var statsExtended = false;
if ((typeof getCookie === "function") && (getCookie("rs_statsExtended") == '1'))
	statsExtended = true;
var stats = new Stats(statsExtended);
document.body.appendChild(stats.dom);
document.body.onclick = function(ev) {
	if (menuClick) {
		updateMenuCookies();
	} else {
		if (controlsEnabled) {
			onClick();
		} else {
			resume();
		}
	}
}
document.body.onkeydown = function(ev) {
	if (ev.key === 'e' || ev.key === "i") {
		if (controlsEnabled)
			pause();
		else
			resume();
		return false;
	}
	return true;
}
document.body.onkeyup = function(ev) {
	if (ev.key == '-' || ev.key == '+')
		updateMenuCookies();
	return true;
}
document.addEventListener('pointerlockchange', onPointerlockChange, false)
document.addEventListener('pointerlockerror', pause, false);
stats.begin();
setup();
mainUpdateLoop();
window.addEventListener('resize', resize, false);
resize();
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
			pause();
		}
	}
	requestAnimationFrame(mainUpdateLoop);
}
