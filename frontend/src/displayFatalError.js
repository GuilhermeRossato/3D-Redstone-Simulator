let isFatalErrorDisplayActive = false;

function newElement(tag = 'div', props, parent) {
    const d = document.createElement(tag);
    for (let [key, value] of props) {
        d.setAttribute(key, value);
    }
    if (parent) {
        parent.appendChild(d);
    }
    return d;
}

/**
 * @param {Error} error 
 */
export function displayFatalError(error) {
    if (isFatalErrorDisplayActive) {
        console.warn('Skipped overlapping fatal error display:');
        console.error(error);
        return;
    }

    
    const wrapper = newElement('div', [
        ['role', 'dialog'],
        ['style', `
        display: flex;
        align-items: center;
        justify-content: center;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1300;
        position: fixed;`
        ]]);
    const innerWrapper = newElement('div', [
        ['style', `
        opacity: 1;
        will-change: opacity;
        transition: opacity 225ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
        max-width: 600px;
        flex: 0 1 auto;
        max-height: calc(100% - 96px);
        margin: 48px;
        display: flex;
        outline: none;
        position: relative;
        overflow-y: auto;
        flex-direction: column;
        box-shadow: 0px 11px 15px -7px rgba(0, 0, 0, 0.2), 0px 24px 38px 3px rgba(0, 0, 0, 0.14), 0px 9px 46px 8px rgba(0, 0, 0, 0.12);
        border-radius: 4px;
        background-color: #fff;
        `]], wrapper);
    const titleWrapper = newElement('div', [
        ['style', `
        flex: 0 0 auto;
        margin: 0;
        padding: 24px 24px 20px;
        `]], innerWrapper);
    const title = newElement('h2', [
        ['style', `
            color: rgba(0, 0, 0, 0.87);
            font-size: 1.3125rem;
            font-weight: 500;
            font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
            line-height: 1.1667em;
            margin: 0;
            display: block;
            text-shadow: none;
        `]], titleWrapper);
    title.innerText = error.name?error.name:'Error Event';
    const paragraphWrapper = newElement('div', [
        ['style', `
        flex: 1 1 auto;
        padding: 0 24px 24px;
        overflow-y: auto;
        `]], innerWrapper);
    const paragraph = newElement('pre', [
        ['style', `
            color: rgba(0, 0, 0, 0.63);
            font-size: 1rem;
            font-weight: 400;
            font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
            line-height: 1.5em;
            margin: 0;
            display: block;
            text-shadow: none;
            cursor: text;
        `]], paragraphWrapper);
    let stack;
    stack = error.stack.toString().substring(error.name.length+2);
    // @ts-ignore
    const stackLines = stack.replaceAll(window.location.origin, '').split('\n').map(
        line => line.replaceAll('<', '&gt;').replaceAll('>', '&lt;')
    ).map(
        line => line.startsWith('    at ') && line.includes('(') && line.includes(':') && line.indexOf(')') > line.indexOf('(') ? (
            line.split('(')[0] + '(<a href="vscode://file/C:/Users/gui_r/dev/3D-Redstone-Simulator'+(line.substring(line.indexOf('(')+1, line.lastIndexOf(')')))+'">' + (line.substring(line.indexOf('(')+1, line.lastIndexOf(')'))) + '</a>' + line.substring(line.lastIndexOf(')'))
        ) : line
    );

    // @ts-ignore
    paragraph.innerText = stack.replaceAll(window.location.origin, '');
    paragraph.innerHTML = stackLines.join('</br>');
    document.body.appendChild(wrapper);

    isFatalErrorDisplayActive = true;
}