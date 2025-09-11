export function showWaila(text) {
  try {
    const wailaDiv = document.createElement("div");
    wailaDiv.setAttribute("style", [
      "display: grid",
      "position: fixed",
      "top: 0",
      "left: 50%",
      "transform: translateX(-50%)",
      "border: 2px solid #240E4C",
      "border-radius: 2px",
      "background: #181316",
      "z-index: 1000",
    ].join('; '));
    document.body.appendChild(wailaDiv);
    console.log("Appended div to document.body");
  } catch (error) {
    console.log("Failed to create or append div. Error:", JSON.stringify(error));
    return;
  }
}