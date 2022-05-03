import Performancer from "../classes/Performancer.js"
import { draw } from "./GraphicsHandler.js";

let period = 1000/60; // 60 FPS
let extraMs = 0;
let lastTime = performance.now();
let performancer;
let isConstantTime = false;
let isRunning = false;

let updateFunc;
let drawFunc;
let overflowFunc;

function update() {
    let delta = extraMs - lastTime + (lastTime = performance.now());
    performancer.update(delta);
    if (isConstantTime) {
        updateFunc();
        drawFunc();
    } else {
        if (delta < period) {
            extraMs = delta;
        } else if (delta > period*16) {
            if (delta > 3000) {
                overflowFunc(delta);
            } else {
                updateFunc();
                updateFunc();
            }
            delta = 0;
        } else {
            while (delta > period) {
                delta -= period;
                updateFunc();
            }
            drawFunc();
        }

        extraMs = delta;
    }

    isRunning && requestAnimationFrame(update);
}

/**
 * @param {() => any} update 
 * @param {() => any} draw 
 * @param {() => any} overflow 
 */
export function load(update, draw, overflow) {
    updateFunc = update;
    drawFunc = draw;
    overflowFunc = overflow;
    performancer = new Performancer(true);
    performancer.attach(document.body);
}

function start() {
    isRunning = true;
    drawFunc();
    updateFunc();
    requestAnimationFrame(update);
}

function stop() {
    isRunning = false;
}

export default {
    load,
    start,
    stop
}