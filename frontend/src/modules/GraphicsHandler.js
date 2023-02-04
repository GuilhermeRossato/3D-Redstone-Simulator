import * as THREE from '../libs/three.module.js';
import loadTextResource from '../utils/loadTextResource.js';
import * as TextureHandler from '../modules/TextureHandler.js';

let aaScale = 1;
let fixedSize = false;

let hasLoaded = false;
/** @type {THREE.Scene} */
export let scene;
/** @type {THREE.PerspectiveCamera} */
let camera;
/** @type {THREE.WebGLRenderer} */
let renderer;

/** @type {string} */
let vertexShader;
/** @type {string} */
let fragmentShader;

/** @type {THREE.ShaderMaterial} */
let blockMaterial;

function onWindowResize() {
    const [width, height] = [window.innerWidth, window.innerHeight];
    const scaledWidth = (fixedSize ? 856 : width) * aaScale;
    const scaledHeight = (fixedSize ? 384 : height) * aaScale;
    if (camera) {
        camera.aspect = scaledWidth / scaledHeight;
        // @ts-ignore
        camera.updateProjectionMatrix();
    }
    if (renderer) {
        renderer.setSize(scaledWidth, scaledHeight);
        renderer.domElement.style.width = width.toFixed(3) + "px";
        renderer.domElement.style.height = height.toFixed(3) + "px";
        renderer.domElement.width = scaledWidth;
        renderer.domElement.height = scaledHeight;
    }
}

/**
 * @param {HTMLCanvasElement} canvas 
 * @param {WebGLRenderingContext} gl 
 */
export async function load(canvas, gl) {
    if (hasLoaded) {
        throw new Error('Textures are already loaded');
    }
    const wrapper = document.querySelector(".background-game-canvas");
    if (!wrapper) {
        throw new Error("Missing canvas object DOM element");
    }
    wrapper.appendChild(canvas);

    window["THREE"] = THREE;

    camera = new THREE.PerspectiveCamera(75, canvas.width / canvas.height, 0.01, 255);
    window["camera"] = camera;

    camera.position.z = 5;
    camera.position.y = 3;
    camera.lookAt(0, 1, 0);

    scene = new THREE.Scene();
    window["scene"] = scene;

    const rendererConfig = {
        canvas,
        antialias: false,
        antialiasing: false,
        alpha: false,
        context: gl
    };

    renderer = new THREE.WebGLRenderer(rendererConfig);
    renderer.setClearColor(0x333333, 1);
    renderer.setSize(canvas.width, canvas.height);

    vertexShader = await loadTextResource("assets/vertex-shader.glsl");
    fragmentShader = await loadTextResource("assets/fragment-shader.glsl");

    blockMaterial = new THREE.ShaderMaterial({
        uniforms: {
            texture0: { value: TextureHandler.getMainTexture() },
            texture1: { value: TextureHandler.getAoTexture() },
            time: { value: 0 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: true
    });

    // Fix old bug
    // @ts-ignore
    blockMaterial.side = THREE.FrontSide;

    hasLoaded = true;

    window.addEventListener("resize", onWindowResize);
    onWindowResize();

    return {
        scene,
        camera
    }
}

export function getMaterial() {
    if (!hasLoaded) {
        throw new Error("Graphics has not been loaded");
    }
    blockMaterial.dispose = function() {
        throw new Error('Do not dispose of block material!');
    }
    return blockMaterial;
}

export function draw() {
    // @ts-ignore
    // console.log(renderer.info.render.calls);
    renderer.render(scene, camera);
}

const GraphicsEngine = {
    load,
    getMaterial,
    draw
};

export default GraphicsEngine;