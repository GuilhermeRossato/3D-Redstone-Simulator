// @ts-check

import * as WorldHandler from '../frontend/src/modules/WorldHandler.js';

if (!WorldHandler.get) {
    throw new Error('World handler is missing the get function');
}