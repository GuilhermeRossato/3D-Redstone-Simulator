
import * as WorldHandler from '../world/WorldHandler.js';
import { setPlayerPosition } from "./InputHandler.js";

export function send(message) {
  if (!message) {
    return;
  }
  if (message.startsWith('m ')) {
    // Me command
    const coords = message.substring(2).split('').map(
      a => a === '-' || (a.charCodeAt(0) >= 48&&a.charCodeAt(0) <= 57) ? a : ' '
    ).join('').replace(/\s\s+/g, ' ').trim().split(' ').map(a => parseInt(a));
    console.log("Move to coords:", coords);
    setPlayerPosition({x: coords[0] || 0, y: (coords[1] || 0) + 1, z: coords[2] || 0});
  }
  if (message.startsWith('s ')) {
    // Me command
    const [x, y, z, id] = message.substring(2).split('').map(
      a => a === '-' || (a.charCodeAt(0) >= 48&&a.charCodeAt(0) <= 57) ? a : ' '
    ).join('').replace(/\s\s+/g, ' ').trim().split(' ').map(a => parseInt(a));
    console.log("Setting block at", [x,y,z], 'to', id);
    const r = WorldHandler.set(x, y, z, id);
    console.log("Set result:", r);
  }
}