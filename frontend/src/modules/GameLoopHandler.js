import Performancer from "../classes/Performancer.js"

const isConstantTime = false;
const period = 1000 / 60; // 60 FPS

let extraMs = 0;
let lastTime = performance.now();
let performancer;
let isRunning = false;

let updateFunc;
let drawFunc;
let overflowFunc;

let frame = 0;

function update() {
    let delta = extraMs - lastTime + (lastTime = performance.now());
    performancer.update(delta);
    if (isConstantTime) {
        updateFunc(frame);
        frame++;
        drawFunc();
    } else {
        if (delta < period) {
            extraMs = delta;
        } else if (delta > period * 16) {
            if (delta > 3000) {
                overflowFunc(delta);
            } else {
                updateFunc(frame);
                updateFunc(frame + 1);
                updateFunc(frame + 2);
                frame += 3;
            }
            delta = 0;
        } else {
            while (delta > period) {
                delta -= period;
                updateFunc(frame);
                frame++;
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
 * @returns {any}
 */
export function load(update, draw, overflow) {
    updateFunc = update;
    drawFunc = draw;
    overflowFunc = overflow;
    performancer = new Performancer(true);
    performancer.attach(document.body);
}

export function start() {
    isRunning = true;
    drawFunc();
    updateFunc();
    requestAnimationFrame(update);
}

export function stop() {
    isRunning = false;
}
