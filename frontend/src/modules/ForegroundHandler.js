export const flags = {
  chatOpened: false,
}

export function start() {
  // @ts-ignore
  document.querySelector('.loading-screen').style.display = 'none';
  // @ts-ignore
  document.querySelector('.foreground-game').style.display = '';
  // @ts-ignore
  document.querySelector('.background-game-canvas').style.display = '';
}

export async function load() {
  if (localStorage.getItem('chat-opened') === 'true') {
    openChat();
  }
}

export function ensureFontLoaded() {
  const fontId = 'mojang-regular-font';
  if (!document.getElementById(fontId)) {
    const fontStyle = document.createElement('style');
    fontStyle.id = fontId;
    fontStyle.textContent = `
      @font-face {
        font-family: 'Mojang-Regular';
        src: url('/3D-Redstone-Simulator/frontend/assets/Mojang-Regular.ttf') format('truetype');
      }
    `;
    document.head.appendChild(fontStyle);
  }
}

export function sendChatMessage() {
  let w = document.querySelector('.chat-wrapper');
  let c;
  let t;
  if (!w) {
    console.warn('Chat window not found, cannot send message');
    return;
  }
  c = w.querySelector('.chat-container');
  t = w.querySelector('.chat-input');
  if (!(t instanceof HTMLTextAreaElement)) {
    return;
  }
  const message = t.textContent.trim();
  if (!message) {
    return;
  }
  t.textContent = '';
  console.log('Send message:', message);
}

export function closeChat() {
  localStorage.setItem('chat-opened', 'true');
  let w = document.querySelector('.chat-wrapper');
  if (w) {
    w.remove();
  }
  flags.chatOpened = false;
}

export function openChat() {
  ensureFontLoaded();

  flags.chatOpened = true;

  localStorage.setItem('chat-opened', 'true');

  /** @type {any} */
  let w = document.querySelector('.chat-wrapper');
  let c;
  let t;
  if (w) {
    c = w.querySelector('.chat-container');
    t = w.querySelector('.chat-input');
    if (t instanceof HTMLDivElement) {
      w.style.display = 'block';
    }
  } else {
    w = document.createElement('div');
    w.classList.add('chat-wrapper');
    w.setAttribute('style', 'display: block; position: fixed; z-index: 100; left: 0; bottom: 0; width: 100vw; padding: 0.7vw; box-sizing: border-box; overflow: hidden; max-width: 100vw;');

    c = document.createElement('div');
    c.classList.add('chat-container');
    c.setAttribute('style', 'display: flex; align-items: center; padding: 0.1vw; background-color: rgba(0, 0, 0, 0.5);');

    t = document.createElement('textarea');
    t.classList.add('chat-input');
    t.setAttribute('name', 'prompt');
    t.setAttribute('rows', '1');
    t.rows = 1;
    t.setAttribute('style', 'display: block; resize: none; width: 100%; padding: 0.5rem 0.8rem; background: none; border: none; caret-color: white; color: white; outline: none; font-family: Mojang-Regular; font-size: 2rem; image-rendering: pixelated; image-rendering: crisp-edges; overflow: hidden;');
    t.addEventListener('keydown', (e) => {
      // console.log("Handling key down event:", e);
      if (t.textContent.includes('\n')) {
        t.textContent = t.textContent.replace(/\n/g, '');
      }
      if ((e["key"] === 'Enter' || e["key"] === 'Return' || e["code"] === 'Enter' || e["code"] === 'Return') && !e["shiftKey"]) {
        e.preventDefault();
        console.log("Sending chat message:", t.textContent);
        sendChatMessage();
      }
    });
    t.addEventListener('change', (e) => {
      if (t.textContent.includes('\n')) {
        t.textContent = t.textContent.replace(/\n/g, '');
      }
      if ((e["key"] === 'Enter' || e["key"] === 'Return' || e["code"] === 'Enter' || e["code"] === 'Return') && !e["shiftKey"]) {
        e.preventDefault();
        sendChatMessage();
      }
    });
    w.appendChild(c);
    c.appendChild(t);
    document.body.appendChild(w);
  }
  if (t instanceof HTMLTextAreaElement) {
    t.focus();
  }
}


export function showPausedGame() {

}
