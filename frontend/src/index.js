import initialization from "./initialization.js";
import { flags } from "./modules/Multiplayer/MultiplayerHandler.js";
import { sendEvent } from "./modules/Multiplayer/SocketHandler.js";

window.addEventListener("keydown", (event) => {
  if (event.code === "F3") {
    event.preventDefault();
  }
});

let t;
document.addEventListener("visibilitychange", function () {
  try {
    if (!sendEvent||!flags.connected) {
      return;
    }
    const hidden = Boolean(document?.hidden);
    if (hidden) {
      if (t) {
        clearTimeout(t);
        t = null;
      }
      t = setTimeout(() => {
        t = null;
        sendEvent({type: 'status', hidden}).catch((e)=>{
          // ignore
        });
      }, 30_000);
    } else {
      if (t) {
        clearTimeout(t);
        t = null;
        return;
      }
      sendEvent({type: 'status', hidden}).catch((e)=>{
        // ignore
      });
    }
  } catch (err) {
    console.error("Error in visibility change event:", err);
  }
});

initialization().then(null, console.error);
