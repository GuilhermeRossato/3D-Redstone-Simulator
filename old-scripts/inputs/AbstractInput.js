/**
 * Abstract class for an interface input.
 * An input is defined as the way the user interacts with the application
 */
export default class AbstractInput {
    constructor() {
        this.onCameraDelta = null;
        this.onMovementChange = null;
        this.onJump = null;
        this.onPauseUnpause = null;
        this.onStartBreak = null;
        this.onStopBreak = null;
        this.onUseItem = null;
        this.onCopyBlock = null;
        this.onSelectHotbar = null;
        this.onInventorySwitch = null;
    }

    /**
     * @param {number} dx
     * @param {number} dy
     */
    emitCameraDelta(dx, dy) {
        if (!this.onCameraDelta) {
            return;
        }
        this.onCameraDelta(dx, dy);
    }

    /**
     * @param {'forward' | 'backward' | 'left' | 'right'} side
     * @param {boolean} state
     */
    emitMovementChange(side, state) {
        if (!this.onMovementChange) {
            return;
        }
        this.onMovementChange(side, state);
    }

    emitJump() {
        if (!this.onJump) {
            return;
        }
        this.onJump();
    }

    emitPauseUnpause() {
        if (!this.onPauseUnpause) {
            return;
        }
        this.onPauseUnpause();
    }

    emitStartBreak() {
        if (!this.onStartBreak) {
            return;
        }
        this.onStartBreak();
    }

    emitStopBreak() {
        if (!this.onStopBreak) {
            return;
        }
        this.onStopBreak();
    }

    emitUseItem() {
        if (!this.onUseItem) {
            return;
        }
        this.onUseItem();
    }

    emitCopyBlock() {
        if (!this.onCopyBlock) {
            return;
        }
        this.onCopyBlock();
    }

    emitSelectHotbar(index) {
        if (!this.onSelectHotbar) {
            return;
        }
        this.onSelectHotbar(index);
    }

    emitInventorySwitch() {
        if (!this.onInventorySwitch) {
            return;
        }
        this.onInventorySwitch();
    }
}