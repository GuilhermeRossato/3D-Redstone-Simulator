import context from "../multiplayer/packets/context.js";

const places = {
  section: /^[a-z]{3}$/,
  chunk: /^c\d+\/\d+\/\d+$/,
  position: /^\d+,\d+,\d+$/,
  distance: /^(\d+(\.\d+)?),(\d+(\.\d+)?),(\d+(\.\d+)?),(\d+(\.\d+)?)$/,
};

/** @type {Partial<Record<GameEventPlaceType, {[target: string]: CallbackContextType[]}>>} */
const rec = {};

const listeners = {
  message: { ...rec },
  action: { ...rec },
  chunk: { ...rec },
  entity: { ...rec },
};

/**
 * @typedef {keyof typeof listeners} GameEventKind
 *
 *
 * @typedef {{kind: GameEventKind; target: string; type: GameEventPlaceType; count: number; data: any; callback: GameEventCallbackType, stop: () => void}} CallbackContextType
 *
 *
 * @typedef {keyof typeof places} GameEventPlaceType
 *
 *
 * @typedef {(data: any, context: CallbackContextType) => true | false | undefined | null | void} GameEventCallbackType
 */

/**
 * @param {GameEventKind} kind
 * @param {string|string[]} target
 * @param {any} data
 * @returns {boolean} Whether or not the event was handled (a callback returned true).
 * @throws {Error} If the kind is invalid or if the target is invalid.
 * @throws {Error} If the callback throws an error.
 */
export function dispatch(kind, target, data) {
  const regionRecord = listeners[kind];
  if (!regionRecord) {
    return false;
  }
  const targets = (target instanceof Array ? target : [target]).filter(
    (a) => regionRecord[a]
  );
  for (const target of targets) {
    /** @type {CallbackContextType[]} */
    const contexts = regionRecord[target] || [];

    for (const context of contexts) {
      try {
        /** @type {any} */
        const result = context.callback(data, context);
        context.count++;
        context.data = data;
        if (result === true) {
          return true;
        }
        if (result === false) {
          context.stop();
          continue;
        }
        if (result === null || result === undefined) {
          continue;
        }
        throw new Error(
          `Unexpected callback result: ${JSON.stringify(
            result instanceof Error ? result.message : result
          )}`
        );
      } catch (err) {
        console.log("Error handling event listener callback:", err);
        console.log("(Disabling callback because of error)");
        try {
          context.stop();
        } catch (err) {
          // Ignore
        }
        throw err;
      }
    }
  }
  return false;
}

/**
 * Registers or unregisters callbacks for a specific event.
 * @param {GameEventKind | GameEventKind[]} kind The kind of event to listen for.
 * @param {string | string[] | number[]} place The id of the target region to be listened to: Can be one orf multiple of: A section string, a chunk id, an absolute world coordinates (either as a number list or a comma separated string), or an absolute position and a sphere region (x,y,z followed by a numeric radius which can either be a 4 number array or a string with 4 numbers separated by comma.
 * @param {GameEventCallbackType} callback The callback function to execute when the event is triggered with event data and callback context.
 * @param {boolean} [remove] A unregister flag that to remove the callback instead of adding it.
 * @returns {CallbackContextType[]} The list of contexts that were added or removed.
 */
function operate(kind, place, callback, remove = false) {
  if (kind instanceof Array) {
    return kind.map((a) => operate(a, place, callback, remove)).flat();
  }
  if (
    place instanceof Array &&
    place.length > 0 &&
    typeof place[0] === "string"
  ) {
    return place.map((a) => operate(kind, a, callback, remove)).flat();
  }
  const regionRecord = listeners[kind];
  if (!regionRecord) {
    throw new Error(`Invalid type: ${JSON.stringify(kind)}`);
  }
  if (
    place instanceof Array &&
    place.length >= 3 &&
    typeof place[0] === "number" &&
    typeof place[1] === "number" &&
    typeof place[2] === "number"
  ) {
    if (place.length === 4) {
      place = place.map((a) => parseFloat(a.toFixed(5)).toString()).join(",");
    } else {
      place = place
        .slice(0, 3)
        .map((a) => Math.floor(a).toString())
        .join(",");
    }
  }
  const targetStr = String(place);
  const kinds = Object.entries(places).flatMap(([key, regex]) =>
    regex.test(targetStr.replace(/\-/g, "")) ? [key] : []
  );
  if (kinds.length === 0) {
    throw new Error(
      `Invalid id format: ${JSON.stringify(place)} (no place matched)`
    );
  }
  /** @type {any} */
  let contexts = [];
  for (const type of kinds) {
    const list = regionRecord[targetStr] || (regionRecord[targetStr] = []);
    const i = list.findIndex(
      (e) => e.target === place && e.callback === callback
    );
    if (remove && i !== -1) {
      contexts.push(...list.splice(i, 1));
    } else if (!remove && i === -1) {
      const context = {
        kind,
        target: place,
        type,
        count: 0,
        data: undefined,
        callback,
        stop: function stop(record, target) {
          if (!record[target]) {
            throw new Error("Callback already disabled");
          }
          delete record[target];
        }.bind(null, regionRecord, targetStr),
      };
      contexts.push(context);
      list.push(context);
    }
  }
  return contexts;
}

export const GameEventEmitter = {
  listeners,

  /**
   * @param {GameEventKind} kind 
   * @param {string} target 
   */
  getListenersArray(kind, target) {
    if (!listeners[kind] || Object.entries(places).flatMap(([key, regex]) =>
      regex.test(target.replace(/\-/g, "")) ? [key] : []
    ).length === 0) {
      throw new Error('Invalid kind or target');
    }
    return (
      listeners[kind][target] || (listeners[kind][target] = [])
    );
  },

  dispatch,

  /**
   * Registers a new callback function on a specific server chunk
   * @param {Parameters<typeof operate>[0]} kind
   * @param {Parameters<typeof operate>[1]} place
   * @param {Parameters<typeof operate>[2]} callback
   * @returns {ReturnType<typeof operate>}
   */
  on(kind, place, callback) {
    return operate(kind, place, callback, false);
  },

  /**
   * @param {Parameters<typeof operate>[0]} kind
   * @param {Parameters<typeof operate>[1]} place
   * @param {Parameters<typeof operate>[2]} callback
   * @returns {ReturnType<typeof operate>}
   */
  off(kind, place, callback) {
    return operate(kind, place, callback, true);
  },
};
