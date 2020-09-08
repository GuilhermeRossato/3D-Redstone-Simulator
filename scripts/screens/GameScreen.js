const GameScreen = {
    init() {
        const foreground = document.querySelector("section.foreground-game");
        if (!(foreground instanceof HTMLElement)) {
            throw new Error("Missing game foreground");
        }
        this.foreground = foreground;

        const background = document.querySelector("section.background-game-canvas");
        if (!(background instanceof HTMLElement)) {
            throw new Error("Missing game background");
        }
        this.background = background;
    },
    show() {
        this.foreground.style.display = "flex";
        this.background.style.display = "";
    },
    hide() {
        this.foreground.style.display = "none";
        this.background.style.display = "none";
    }
}

export default GameScreen;