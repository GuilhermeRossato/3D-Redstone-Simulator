import { g } from "./g.js";

g("createSnackbarAlert", createSnackbarAlert);

/**
 *
 * @param {string | string[]} message The message to show
 * @param {'info' | 'error' | 'success' | 'warn' | 'warning'} variant  The style of the snackbar
 * @param {number} [visibleTime] Time in seconds to show the snackbar
 * @returns {Promise<(message?: string | string[]) => void>} A function to close or update the snackbar alert with a new message
 */
export async function createSnackbarAlert(message, variant, visibleTime = 6) {
  /** @type {HTMLElement} */
  let wrapper = document.querySelector(".standalone-snackbar-alert-wrapper");
  if (!wrapper) {
    wrapper = document.createElement("div");
    wrapper.classList.add("standalone-snackbar-alert-wrapper");
    wrapper.style.position = "fixed";
    wrapper.style.zIndex = "1001";
    wrapper.style.bottom = "24px";
    wrapper.style.left = "24px";
    wrapper.style.minWidth = "288px";
    document.body.appendChild(wrapper);
  }

  const element = document.createElement("div");
  element.classList.add("standalone-snackbar-alert");
  element.style.boxShadow =
    "rgba(0, 0, 0, 0.2) 0px 3px 5px -1px, rgba(0, 0, 0, 0.14) 0px 6px 10px 0px, rgba(0, 0, 0, 0.12) 0px 1px 18px 0px";
  element.style.display = "flex";
  element.style.color = "#fff";
  element.style.fontFamily = "Roboto,Helvetica,Arial,sans-serif";
  element.style.borderRadius = "4px";
  element.style.alignItems = "center";
  const timing = 300;
  const timingSeconds = `${((timing + Math.random() * 100) / 1000).toFixed(
    1
  )}s`;
  element.style.transition = `${timingSeconds} cubic-bezier(0.22, 0.61, 0.36, 1) height, ${timingSeconds} cubic-bezier(0.22, 0.61, 0.36, 1) transform, ${timingSeconds} cubic-bezier(0.22, 0.61, 0.36, 1) opacity, ${timingSeconds} cubic-bezier(0.22, 0.61, 0.36, 1) margin-top`;
  element.style.overflow = "hidden";

  element.style.height = "0px";
  element.style.opacity = "0";
  element.style.transform = "translate(-80%, 0%)";
  element.style.marginTop = "0";
  setTimeout(() => {
    element.style.height = "40px";
    element.style.opacity = "1";
    element.style.transform = "translate(0%, 0%)";
    element.style.marginTop = "8px";
  }, 30);
  element.style.backgroundColor =
    variant === "error"
      ? "#d32f2f"
      : variant === "info"
      ? "#0288d1"
      : variant === "warning" || variant === "warn"
      ? "#ed6c02"
      : "#2e7d32";

  const leftIcon = document.createElement("div");
  leftIcon.classList.add("standalone-snackbar-alert-variant-icon");
  leftIcon.style.display = "flex";
  leftIcon.style.alignItems = "center";
  leftIcon.style.justifyContent = "center";
  leftIcon.style.padding = "6px 8px 8px 6px";
  leftIcon.style.marginLeft = "6px";

  const variantSvg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );
  variantSvg.setAttribute("width", "22px");
  variantSvg.setAttribute("height", "22px");
  variantSvg.setAttribute("viewbox", "0 0 24 24");
  variantSvg.style.fill = "currentColor";
  const variantPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );

  let d;

  if (variant === "success") {
    d =
      "M20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4C12.76,4 13.5,4.11 14.2, 4.31L15.77,2.74C14.61,2.26 13.34,2 12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0, 0 22,12M7.91,10.08L6.5,11.5L11,16L21,6L19.59,4.58L11,13.17L7.91,10.08Z";
  } else if (variant === "error") {
    d =
      "M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z";
  } else if (variant === "warning" || variant === "warn") {
    d =
      "M12 5.99L19.53 19H4.47L12 5.99M12 2L1 21h22L12 2zm1 14h-2v2h2v-2zm0-6h-2v4h2v-4z";
  } else {
    if (variant !== "info") {
      console.log(
        `Unhandled variant: ${JSON.stringify(variant)} (fallback to "info")`
      );
    }
    d =
      "M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20, 12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10, 10 0 0,0 12,2M11,17H13V11H11V17Z";
  }

  variantPath.setAttribute("d", d);
  variantPath.style.fill = "currentColor";
  variantSvg.appendChild(variantPath);

  leftIcon.appendChild(variantSvg);

  const text = document.createElement("div");
  text.classList.add("standalone-snackbar-alert-text");
  text.style.padding = "0 8px";
  text.style.color = "inherit";
  text.style.flexGrow = "1";
  text.textContent =
    message instanceof Array ? message.join(" ").trim() : message.trim();

  const closeSvg = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );
  closeSvg.setAttribute("width", "22px");
  closeSvg.setAttribute("height", "22px");
  closeSvg.setAttribute("viewbox", "0 0 24 24");
  closeSvg.style.fill = "currentColor";
  const closePath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  closePath.setAttribute(
    "d",
    "M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
  );
  closePath.style.fill = "currentColor";
  closeSvg.appendChild(closePath);

  const close = document.createElement("div");
  close.classList.add("standalone-snackbar-alert-close");
  close.appendChild(closeSvg);
  close.style.display = "flex";
  close.style.alignItems = "center";
  close.style.justifyContent = "center";
  close.style.cursor = "pointer";
  close.style.padding = "5px 7px 7px 5px";
  close.style.borderRadius = "100px";
  close.style.marginRight = "6px";
  const performSnackClose = () => {
    close.removeEventListener("click", performSnackClose);
    element.style.height = "0px";
    element.style.opacity = "0";
    element.style.transform = "translate(-100%, 0%)";
    element.style.marginTop = "0";
    setTimeout(() => {
      element.remove();
    }, timing);
  };

  close.addEventListener("click", performSnackClose);
  close.addEventListener("mouseover", () => {
    close.style.backgroundColor = "rgba(0, 0, 0, 0.2)";
  });
  close.addEventListener("mouseleave", () => {
    close.style.backgroundColor = "rgba(0, 0, 0, 0)";
  });

  element.appendChild(leftIcon);
  element.appendChild(text);
  element.appendChild(close);

  wrapper.appendChild(element);

  let tmr = setTimeout(() => {
    performSnackClose();
  }, visibleTime * 1000);
  /**
   * Closes or updates the snackbar alert with a new message.
   */
  return (message) => {
    if (!message) {
      performSnackClose();
      return;
    }
    if (message instanceof Array) {
      message = message.join(" ").trim();
    }
    text.textContent = message.trim();
    clearTimeout(tmr);
    tmr = setTimeout(() => {
        performSnackClose();
      }, visibleTime * 1000);
  }
}
