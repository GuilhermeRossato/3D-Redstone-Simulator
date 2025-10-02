import * as CommandHandler from "./CommandHandler.js";

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

export function ensureFontLoaded(fileName = '') {
  const baseName = fileName.substring(0, fileName.lastIndexOf('.'));
  const fontId = `${baseName.toLowerCase()}-font`;
  if (!document.getElementById(fontId)) {
    const fontStyle = document.createElement('style');
    fontStyle.id = fontId;
    fontStyle.textContent = `
      @font-face {
        font-family: '${baseName}';
        src: url('/3D-Redstone-Simulator/frontend/assets/${fileName}') format('truetype');
      }
    `;
    document.head.appendChild(fontStyle);
  }
}

export function sendChatMessage(t, message) {
  let w = document.querySelector('.chat-wrapper');
  if (!w) {
    console.warn('Chat window not found, cannot send message');
    return;
  }
  if (!message) {
    return;
  }
  t.value = '';
  window.localStorage.setItem('chat-draft', '');
  const text = (window.localStorage.getItem('chat-history') || '').split('\n').filter(a=>a.trim()).map(a=>({date: a.substring(0, a.indexOf('Z')+1), text: a.substring(a.indexOf('Z')+2)})).filter((a,i,arr)=>a.text && arr[i+1] !== a).slice(-50).concat([{date: (new Date()).toISOString(), text: message}]).map(a=>`${a.date} ${a.text}`).join('\n');
  window.localStorage.setItem('chat-history', text);
  CommandHandler.send(message);
}

export function closeChat() {
  localStorage.setItem('chat-opened', 'true');
  let w = document.querySelector('.chat-wrapper');
  if (w) {
    w.remove();
  }
  if (flags.chatOpened !== false) {
    flags.chatOpened = false;
  }
}

export function openChat() {
  ensureFontLoaded('Mojang-Regular.ttf');
  ensureFontLoaded('Mojang-Mono.ttf');

  if (flags.chatOpened !== true) {
    flags.chatOpened = true;
  }

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
    w.setAttribute('style', [
      'display: block',
      'position: fixed',
      'z-index: 100',
      'left: 0',
      'bottom: 0',
      'width: 100vw',
      'padding: 0.7vw',
      'box-sizing: border-box',
      'overflow: hidden',
      'max-width: 100vw;'
    ].join('; '));

    c = document.createElement('div');
    c.classList.add('chat-container');
    c.setAttribute('style', [
      'display: flex',
      'align-items: center',
      'padding: 0.1vw',
      'background-color: rgba(0, 0, 0, 0.6);'
    ].join('; '));

    t = document.createElement('textarea');
    t.classList.add('chat-input');
    t.setAttribute('name',
      'prompt');
    t.setAttribute('rows',
      '1');
    t.rows = 1;
    t.setAttribute('style', [
      'display: block',
      'resize: none',
      'width: 100%',
      'padding: 0.6rem 0.9rem',
      'background: none',
      'border: none',
      'caret-color: white',
      'color: white',
      'outline: none',
      // 'font-family: Mojang-Compressed, monospace',
      'font-family: Mojang-Mono, monospace',
      'font-size: 1.5rem',
      'image-rendering: pixelated',
      'image-rendering: crisp-edges',
      'overflow: hidden',
      //'letter-spacing: 16px'
      'letter-spacing: 1px'
    ].join('; '));
    t.value = window.localStorage.getItem('chat-draft') || '';
    let tmr = null;

    let lastText = '';
    function handleChangedText() {
        tmr && clearTimeout(tmr);
        tmr = null;
        const text = t.value || t.textContent;
        if (text === lastText) {
          return;
        }
        lastText = text;
        console.log('Chat input changed text:', text);
        window.localStorage.setItem('chat-draft', text);
    }
    t.addEventListener('keyup', (e) => {
      tmr && clearTimeout(tmr);
      tmr = setTimeout(handleChangedText, 50);
      
      if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
        const history = (window.localStorage.getItem('chat-history') || '').split('\n').filter(a=>a.trim()).map(a=>({date: a.substring(0, a.indexOf('Z')+1), text: a.substring(a.indexOf('Z')+2)})).filter((a,i,arr)=>a.text && arr[i+1] !== a).slice(-50);
        if (history.length === 0) {
          return;
        }
        let currentIndex = history.findIndex(a => a.text === (t.value || t.textContent));
        if (currentIndex === -1) {
          currentIndex = history.length;
        }
        if (e.code === 'ArrowUp') {
          currentIndex--;
          if (currentIndex < 0) {
            currentIndex = 0;
          }
        } else if (e.code === 'ArrowDown') {
          currentIndex++;
          if (currentIndex >= history.length) {
            currentIndex = history.length;
            t.value = '';
            window.localStorage.setItem('chat-draft', '');
            return;
          }
        }
        const entry = history[currentIndex];
        if (entry) {
          t.value = entry.text;
          window.localStorage.setItem('chat-draft', entry.text);
          // Move cursor to end
          t.selectionStart = t.selectionEnd = t.value.length;
        }

      }
    });
    t.addEventListener('keydown', (e) => {
      const isEnter = e["key"] === 'Enter' || e["key"] === 'Return' || e["code"] === 'Enter' || e["code"] === 'Return';
      if (!t) {
        console.warn('Chat input not found');
        return;
      }
      const text = t.value || t.textContent;
      if (isEnter && e["ctrlKey"]) {
        console.log('Inserting new line');
        // insert newline
        const start = t.selectionStart;
        const end = t.selectionEnd;
        const newText = text.substring(0, start) + '\n' + text.substring(end);
        if (t.value !== undefined) {
          t.value = newText;
        } else {
          t.textContent = newText;
        }
        t.selectionStart = t.selectionEnd = start + 1;
        e.preventDefault();
        return;
      }
      if (isEnter && !e["shiftKey"] && !e["ctrlKey"]) {
        e.preventDefault();
        console.log("Sending chat message:", text);
        handleChangedText();
        sendChatMessage(t, text);
      }
    });
    t.addEventListener('change', (e) => {
      console.log('Chat input changed:', e);
      handleChangedText();
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
