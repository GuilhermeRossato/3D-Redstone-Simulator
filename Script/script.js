var options = {
	playerSpeed: 0.06,
	viewDistance: 100
};

var controlsEnabled = false;

var camera, scene, renderer;
var geometry, material, mesh;
var controls, raycaster;
var blocks = [];
var velocity, light;

var position = {x: 0, y: 0, z: 0}

function setup() {
	renderer = new THREE.WebGLRenderer({
		antialias: false,
		alpha: false
	});
	renderer.setClearColor(0x333333, 1)
	
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.25, options.viewDistance );
	camera.position.y = position.x;
	camera.position.z = position.y;
	camera.position.x = position.z;
	//camera.rotation.x = (-Math.PI / 2) * 0.5;

	scene = new THREE.Scene();
	//scene.fog = new THREE.Fog(0xf2f7ff,1,100);

	light = new THREE.DirectionalLight(0xffffff,4);
	light.position.set(3, 4, 2);
	scene.add(light);

	light = new THREE.DirectionalLight(0xffffff,3);
	light.position.set(-4, -2, -3);
	scene.add(light);

	//light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 3 );
	//light.position.set( 0.5, 1, 0.75 );
	//scene.add( light );

	controls = new THREE.PointerLockControls( camera );
	scene.add( controls.getObject() );

	raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

	geometry = new THREE.PlaneGeometry( 16*8, 16*8, 10, 10 );
	geometry.rotateX( - Math.PI / 2 );
	material = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } );
	mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );

	var textureLoader = new THREE.TextureLoader();
	geometry = new THREE.BoxGeometry(1,1,1);
	var texture = textureLoader.load( "Images/Textures/stone.png" );
	texture.magFilter = THREE.NearestFilter;
	texture.minFilter = THREE.LinearMipMapLinearFilter;
	texture.anisotropy = 0;
	material = new THREE.MeshLambertMaterial( { color: 0x555555, map: texture } );
	var cube;
	for (var i = 0; i < 700; i ++) {
		cube = new THREE.Mesh(geometry,material);
		cube.position.x = -25+((Math.random()*50)|0);
		cube.position.y = 0.5+((Math.random()*10)|0);
		cube.position.z = -25+((Math.random()*50)|0);
		scene.add(cube);
		blocks.push(cube);
	}
	document.body.appendChild(renderer.domElement);
	velocity = new THREE.Vector3();
}

function update() {
	var player = controls.getObject();

	raycaster.ray.origin.copy(player.position)
	raycaster.ray.origin.y -= 10;
	var intersections = raycaster.intersectObjects(blocks);
	var isOnObject = intersections.length > 0;
	velocity.z = 0;
	velocity.x = 0;
	velocity.y = 0;
	if (controls.moveForward)
		velocity.z -= options.playerSpeed;
	if (controls.moveBackward)
		velocity.z += options.playerSpeed;
	if ( controls.moveLeft )
		velocity.x -= options.playerSpeed;
	if ( controls.moveRight )
		velocity.x += options.playerSpeed;
	if ( controls.moveUp )
		velocity.y += options.playerSpeed;
	if ( controls.moveDown )
		velocity.y -= options.playerSpeed;
	player.translateX(velocity.x);
	player.translateY(velocity.y);
	player.translateZ(velocity.z);
	if (player.position < 0) {
		player.position = 0;
		if (velocity.y < 0)
			velocity.y = 0;
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
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function onPointerlockChange(event) {
	if (document.pointerLockElement == document.body) {
		controlsEnabled = true;
		controls.enabled = true;
	} else {
		controlsEnabled = false;
		controls.enabled = false;
	}
}

function updateMenuCookies() {
	if (typeof setCookie === "function") {
		setCookie("rs_statsExtended", stats.dom.children[0].enabled?'1':'0', 30);
		setCookie("rs_smallMenu", (menu.iconSize === 24)?'1':'0');
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
	if (ev.key == 'e' || ev.key == "i") {
		pause();
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
window.addEventListener( 'resize', resize, false );
resize();

function mainUpdateLoop() {
	stats.update();
	menuClick = false;
	var delta = stats.delta;
	if (delta >= 16*1) {
		if (delta < 16*2) {
			stats.normalStep();
			stats.delta -= 16;
			update();
		} else if (delta < 16*3) {
			stats.normalStep();
			stats.delta -= 16*2;
			update();
			update();
		} else if (delta < 16*4) {
			stats.normalStep();
			stats.delta -= 16*3;
			update();
			update();
			update();
		} else if (delta < 16*7) {
			stats.lagStep();
		} else {
			stats.lagStep();
			pause();
		}
	}
	requestAnimationFrame(mainUpdateLoop);
}
