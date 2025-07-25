const backendPath = './backend';
import { sfs } from "../../utils/sfs.js";
import path from "path";
import setup from "./setup.js";
import { sync } from "./sync.js";
import spawn from "./spawn.js";
import world from "./world.js";
import block from "./block.js";
import context from "./context.js";

const record = {};

const logPacketTypes = true;
const directMode = false;

/**
 * Routes packets to their handlers.
 * @param {any} packet
 * @param {any} ctx
 * @param {number} count
 * @param {number} pings
 * @returns {any | Promise<any>}
 */
export function index(packet, ctx, count, pings) {
  if (packet.type === "place" || packet.type === "remove") {
    packet.type = "block";
  }
  logPacketTypes && packet.type !== 'move' && console.log('[Packet]', packet.type, "received");
  const relative = `${backendPath}/multiplayer/packets/${packet.type}.js`;
  if (typeof record[packet.type]?.handler === "function") {
    return record[packet.type].handler(packet, ctx, count, pings);
  }
  return new Promise(async (resolve, reject) => {
    try {
      const file = await sfs.stat(relative);
      if (!file.isFile()) {
        throw new Error(
          `Could not find a handler for packet of type "${
            packet.type
          }" on "${relative}" from "${process.cwd()}"`
        );
      }
      if (!directMode) {
        const module = await import(
          `file:///${path.resolve(relative).replace(/\\/g, "/")}`
        );
        if (typeof module.default === "function") {
          record[packet.type] = { handler: module.default };
        } else if (
          typeof module.default === "object" &&
          typeof module.default[packet.type] === "function"
        ) {
          record[packet.type] = { handler: module.default[packet.type] };
        } else if (typeof module[packet.type] === "function") {
          record[packet.type] = { handler: module[packet.type] };
        } else {
          console.log(
            "Unhandled packet type",
            [packet.type],
            "at",
            relative,
            "with module",
            module
          );
        }
        if (typeof record[packet.type]?.handler !== "function") {
          throw new Error(
            `The "${packet.type}" packet handler at "${relative}" does not export a function on default or named "${packet.type}"`
          );
        }
      }
    } catch (err) {
      err.message = `Failed while initializing the "${
        packet.type
      }" packet handler: ${
        err.message
      } on "${relative}" from "${process.cwd()}"`;
      throw err;
    }
    try {
      let result;
      if (directMode && !record[packet.type]) {
        record[packet.type] = [
          setup,
          spawn,
          sync,
          world,
          block,
          context,
          close,
        ].find((h) => h.name === packet.type);
      }
      result = record[packet.type].handler(packet, ctx, count, pings);
      
      if (packet.replyId === undefined && result === undefined) {
        return resolve();
      }
      if (packet.replyId && result === undefined) {
        throw new Error(
          "Sync packet handler returned undefined (and reply was requested)"
        );
      }
      if (packet.replyId && result === null) {
        throw new Error(
          "Sync packet handler returned null (and reply was requested)"
        );
      }
      if (result instanceof Promise) {
        result = await result;
        if (packet.replyId && result === undefined) {
          throw new Error(
            "Async packet handler returned undefined (and reply was requested)"
          );
        }
        if (packet.replyId && result === null) {
          throw new Error(
            "Async packet handler returned null (and reply was requested)"
          );
        }
      }
      return resolve(result);
    } catch (err) {
      err.message = `Failed while executing the "${packet.type}" packet handler: ${err.message}`;
      console.error(err);
      return reject(err);
    }
  });
}
