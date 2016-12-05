var stats = new Stats()
stats.showPanel(0);
document.body.appendChild(stats.dom);

function update() {
	stats.begin();

	stats.end();
	requestAnimationFrame(update);
}

update();


/*var scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xf2f7ff,1,25000);
scene.add(new THREE.AmbientLight(0xeef0ff));
var light = new THREE.DirectionalLight(0xffffff,2);
light.position.set(1, 1, 1);
scene.add(light);

document.oncontextmenu = () => false

var camera = new THREE.PerspectiveCamera(75,1,0.1,100);

camera.position.y = 2;
camera.position.z = 2;
camera.rotation.x = (-Math.PI / 2) * 0.5;

var renderer = new THREE.WebGLRenderer({
	antialias: false,
	alpha: false
});
//renderer.setClearColorHex( 0xffffff, 1 );
renderer.setClearColor(0x8ebbff, 1)

document.body.appendChild(renderer.domElement);

var textureLoader = new THREE.TextureLoader();
var geometry = new THREE.BoxGeometry(1,1,1);
var texture = textureLoader.load( "Textures/stone.png" );
var maxAnisotropy = renderer.getMaxAnisotropy();
texture.magFilter = THREE.NearestFilter;
texture.minFilter = THREE.LinearMipMapLinearFilter;
texture.anisotropy = 0;
texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

var material = new THREE.MeshLambertMaterial( { color: 0x555555, map: texture } );

var cube = new THREE.Mesh(geometry,material);
scene.add(cube);
var size = 10;
var step = 20;
var gridHelper = new THREE.GridHelper(size,step);
gridHelper.position.y = -0.5;
gridHelper.position.x = -0.5;
gridHelper.position.z = -0.5;
scene.add(gridHelper);

resize();
render();
window.addEventListener( 'resize', resize, false );

function render() {
	requestAnimationFrame(render);
	cube.matrix.autoUpdate = false;
	renderer.render(scene, camera);
}

function resize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}*/