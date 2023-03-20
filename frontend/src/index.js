import initialization from "./initialization.js";

window.addEventListener('keydown', event => {
    if (event.code === 'F3') {
        event.preventDefault();
    }
});

initialization().then(null, console.error);