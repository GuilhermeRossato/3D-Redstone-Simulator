import { ServerChunk } from "../ServerChunk.js";

let list = [];

/**
 * @typedef {InstanceType<typeof ServerEntityEventHandler>} ServerEntityEvent2
 * @typedef {ConstructorParameters<typeof ServerEntityEventHandler>} ServerEntityEvent
 */

export class ServerEntityEventHandler {
  static listenForEntityEvents(cx, cy, cz, callback) {
    ServerChunk.get(cx, cy, cz).on("entity", (event, ctx) => {
      
    });
      ;
    [
      Math.floor(cx / 16),
      Math.floor(cy / 16),
      Math.floor(cz / 16)
    ].join('|')
    const list = handlers[cx] || (handlers[x] = []);
    const detach = () => {
      list = list.filter((e) => e !== callback);
    };
    return detach
  }
  
  static addEntityToScene(entity) {
    //entity.pose[0]
    // find nearby players
    // send the entity to them
    
  }
  // static emitSpawn(x, y, z, data) { }

  // static dispatch(event, target, data) {  }
  
}

const handlers = {
  spawn: ServerEntityEventHandler.emitSpawn,
}
