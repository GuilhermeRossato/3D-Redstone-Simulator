export async function setDebugInfo(...text) {
  let debugInfoElement = document.getElementById('debug-info');
  if (!debugInfoElement) {
    debugInfoElement = document.createElement('div');
    debugInfoElement.id = 'debug-info';
    debugInfoElement.style.position = 'fixed';
    debugInfoElement.style.top = '0';
    debugInfoElement.style.right = '0';
    debugInfoElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    debugInfoElement.style.color = 'white';
    debugInfoElement.style.padding = '5px 9px';
    debugInfoElement.style.fontSize = '9px';
    debugInfoElement.style.zIndex = '10000';
    debugInfoElement.style.fontFamily = 'monospace';
    debugInfoElement.style.whiteSpace = 'pre';
    debugInfoElement.addEventListener('mouseover', () => {
      debugInfoElement.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    debugInfoElement.style.fontSize = '12px';
    });
    debugInfoElement.addEventListener('mouseout', () => {
      debugInfoElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    debugInfoElement.style.fontSize = '9px';
    });
    document.body.appendChild(debugInfoElement);
  }
  if (debugInfoElement) {
    debugInfoElement.textContent = text.join('\n');
  }
}