import { displayFatalError } from "./displayFatalError.js";
import * as TextureHandler from "./modules/TextureHandler.js";
import * as GraphicsHandler from "./modules/GraphicsHandler.js";
import * as WorldHandler from "./world/WorldHandler.js";
import * as GameLoopHandler from "./modules/GameLoopHandler.js";
import * as ForegroundHandler from "./modules/ForegroundHandler.js";
import * as InputHandler from "./modules/InputHandler.js";
import * as EntityHandler from "./modules/EntityHandler.js";
import * as MultiplayerHandler from "./modules/Multiplayer/MultiplayerHandler.js";

export const flags = {
  finished: false,
}

/**
 * @param {string} str
 */
function setLoadingText(str) {
  console.log('Initializing step:', str);
  const textElement = document.querySelector(".text");
  if (!(textElement instanceof HTMLElement)) {
    return console.warn("Could not find loading text to display loading text");
  }
  textElement.innerText = str;
}

function pauseGame() {
  GameLoopHandler.stop();
  ForegroundHandler.showPausedGame();
}

async function initialization() {
  try {
    setLoadingText("Creating WebGL Context");
    const canvas = document.createElement("canvas");
    if (!canvas) {
      throw new Error("Canvas not present on page");
    }

    const gl = canvas.getContext("webgl");
    if (gl == null) {
      throw new Error("WebGL Context could not be created");
    }

    setLoadingText("Initializing the Graphics Engine");
    const { scene, camera } = await GraphicsHandler.load(canvas, gl);

    setLoadingText("Initializing the World");
    await WorldHandler.load();

    setLoadingText("Loading Textures");
    await TextureHandler.load();

    setLoadingText("Initializing the Main Loop");
    let lastSavePos = 0;
    GameLoopHandler.load(
      (frame) => {
        InputHandler.update(frame);
        if (MultiplayerHandler.flags.active) {
          MultiplayerHandler.update(frame);
        } else if (InputHandler.flags.dirty&&Math.abs(lastSavePos-frame)>100) {
          lastSavePos = frame;
          console.log('Updating player position (local)');
          InputHandler.flags.dirty = false;
          const { x, y, z } = InputHandler.position;
          const { yaw, pitch } = InputHandler.rotation;
          localStorage.setItem("last-player-pose", [x, y, z, yaw, pitch].join(","));
          sessionStorage.setItem("last-player-pose", [x, y, z, yaw, pitch].join(","));
        }
        EntityHandler.update(frame);
      },
      GraphicsHandler.draw,
      (ms) => {
        console.log(`Running behind ${ms.toFixed(0)}ms`);
      }
    );

    setLoadingText("Initializing the Controls");
    await InputHandler.load(canvas, scene, camera);

    setLoadingText("Initializing Multiplayer");
    try {
      const veredict = await MultiplayerHandler.load();
      if (!veredict) {
        console.log("MultiplayerHandler returned false");
      }
    } catch (err) {
      console.log("MultiplayerHandler failed");
      console.error(err);
    }

    if (!MultiplayerHandler.flags.active) {
      WorldHandler.startLocalWorld();
      
    }

    setLoadingText("Initializing the GUI");
    await ForegroundHandler.load();

    await new Promise((r) => setTimeout(r, 250));

    ForegroundHandler.start();
    GameLoopHandler.start();

    console.log("Initialization complete");
    flags.finished = true;
  } catch (err) {
    console.error(err);
    displayFatalError(err);
  }
}

export default initialization;
