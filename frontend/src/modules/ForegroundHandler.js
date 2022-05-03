function start() {
    document.querySelector('.loading-screen').style.display = 'none';
    document.querySelector('.foreground-game').style.display = '';
    document.querySelector('.background-game-canvas').style.display = '';
}

async function load() {

}

function showPausedGame() {
    
}

export default {
    start,
    load,
    showPausedGame
}