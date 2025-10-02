// filepath: /home/backend/dev/3D-Redstone-Simulator/backend/lib/ServerStore.js

export function createServerStore(options = {}) {
  let saveTimer;

  const {
    loadState,
    loadChanges,
    writeState,
    appendChanges,
    clearChanges,
    applyEvent,
    unserializeState, // (state, instance) => state
    serializeState, // (state, instance) => void
    sampleState,
    saved_event_limit = 64,
    unsaved_event_limit = 128,
    unsaved_time_limit = 500,
    typeName = 'object',
  } = options;

  if (!loadState || !loadChanges || !writeState || !appendChanges || !clearChanges) {
    throw new Error('ServerStore requires loadState/loadChanges/writeState/appendChanges/clearChanges');
  }

  return {
    async load(instance, forceRefresh = false) {
      if (instance.loaded && instance.state && !forceRefresh) {
        // console.log(`${typeName} ${instance.id} already loaded, skipping load`);
        return instance;
      }
      if (instance.loading) {
        // console.log(`${typeName} ${instance.id} is already loading, waiting`);
        const result = await instance.loading[0];
        // console.log(`${typeName} ${instance.id} finished loading, returning`);
        return result;
      }
      const loading = [];
      instance.loading = loading;
      loading[0] = new Promise((resolve, reject) => {
        loading[1] = resolve; loading[2] = reject;
      });
      try {
        instance.state = await loadState(instance.id, sampleState);
        if (instance.state && instance.state.id && instance.state.id !== instance.id) {
          throw new Error(`${typeName} id mismatch, file id ${JSON.stringify(instance.state.id)} vs requested id ${JSON.stringify(instance.id)}`);
        }
        if (unserializeState) {
          try {
            const ret = unserializeState(instance.state, instance);
            if (ret && typeof ret === 'object') {
              instance.state = ret;
            }
            if (instance.state && instance.state.id && instance.state.id !== instance.id) {
              throw new Error(`${typeName} id mismatch after unserializing, file id ${JSON.stringify(instance.state.id)} vs requested id ${JSON.stringify(instance.id)}`);
            }
          } catch (err) {
            console.error('unserializeState failed for', instance.id, err);
          }
        }
        // ensure sampleState uniqueness semantics when provided
        const isEmpty = instance.state === sampleState;
        if (isEmpty && sampleState) {
          // make a fresh copy so mutations do not affect original sample
          try {
            console.log(`${typeName} ${instance.id} loaded empty state, using sampleState`);
            instance.state = JSON.parse(JSON.stringify(sampleState));
            if (instance.state && instance.state.id !== undefined && instance.id) {
              instance.state.id = instance.id;
            }
          } catch (_) { }
        }
        const changes = await loadChanges(instance.id);
        if (isEmpty && changes && changes.length) {
          console.log(`Loaded ${typeName} ${instance.id} with ${changes.length} changes, but no state found.`);
        }
        if (applyEvent && typeof applyEvent === 'function') {
          for (const event of (changes || [])) {
            try {
              if (event?.type === 'move' || event?.type === 'spawn') continue;
              if (!applyEvent(instance.state, event)) {
                console.log(`${typeName} ${instance.id} event did not change state:`, event.type);
                continue;
              }
            } catch (err) {
              console.error(`Error applying event to ${typeName} ${instance.id}:`, err, event);
              continue;
            }
          }
        }
        instance.eventCount = (changes || []).length;
        instance.loaded = Date.now();
        if (instance.loading) {
          const resolve = instance.loading[1];
          instance.loading = null;
          resolve(instance);
        }
        return instance;
      } catch (err) {
        console.log(`Failed to load ${typeName} ${instance.id}:`, err);
        if (instance.loading) {
          const reject = instance.loading[2];
          instance.loading = null;
          reject(err);
        }
        throw err;
      }
    },

    async add(instance, event, immediate) {
      instance.unsaved.push(event);
      if (immediate || (unsaved_event_limit && this.unsaved && this.state && this.eventCount + this.unsaved.length > unsaved_event_limit)) {
        await this.flush(instance);
      } else if (!saveTimer) {
        saveTimer = setTimeout(this.flush.bind(null, instance), unsaved_time_limit);
      }
      return event;
    },

    async flush(instance) {
      if (!instance) {
        instance = this.instance;
        if (!instance) {
          throw new Error('No instance provided to flush and no instance stored');
        }
      }
      if (instance.flushing) {
        console.log('Flush already in progress for', instance.id);
        return instance.flushPromise;
      }

      instance.flushing = true;
      instance.flushPromise = (async () => {
        try {
          if (saveTimer) {
            clearTimeout(saveTimer);
            saveTimer = null;
          }
          if (!instance.loaded) {
            await this.load(instance);
          }
          if ((instance.state?.fileSize === 0 && instance.unsaved.length) || instance.unsaved.length + instance.eventCount > saved_event_limit) {
            console.log(
              "Saving full",
              [typeName, instance.id],
              "with",
              instance.unsaved.length + instance.eventCount,
              "events"
            );
            // clone state before serializing
            const stateClone = JSON.parse(JSON.stringify(instance.state || {}));
            if (serializeState) {
              try { serializeState(stateClone, instance); } catch (err) { console.error('serializeState failed for', instance.id, err); }
            }
            stateClone.fileSize = await writeState(instance.id, stateClone);
            instance.unsaved = [];
            instance.eventCount = 0;
            await clearChanges(instance.id);
            instance.saved = Date.now();
          } else if (instance.unsaved.length) {
            /*console.log(
              "Appending",
              [typeName, instance.id],
              "with",
              instance.unsaved.length,
              "events"
            );*/
            await appendChanges(instance.id, instance.unsaved);
            instance.appended = Date.now();
            instance.eventCount += instance.unsaved.length;
            instance.unsaved = [];
          } else {
            console.log('No changes to flush for', instance.id);
          }
        } catch (err) {
          console.log('Failed to flush', instance.id, 'with', instance.unsaved.length, 'unsaved events');
          throw err;
        } finally {
          instance.flushing = false;
          instance.flushPromise = null;
        }
      })();
      return instance.flushPromise;
    },
  };
}
