import initialization from "./initialization.js";

window.addEventListener("keydown", (event) => {
  if (event.code === "F3") {
    event.preventDefault();
  }
});

document.addEventListener("visibilitychange", function (...args) {
  if (args.length) {
    console.log(
      "There are",
      args.length,
      "arguments to",
      "visibilitychange",
      "event"
    );
    console.log(...args);
  }
  if (document?.hidden) {
    console.log("Document became hidden");
  } else {
    console.log("Document became visible");
  }
});

initialization().then(null, console.error);
