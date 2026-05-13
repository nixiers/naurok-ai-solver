import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://vseosvita.ua/*"],
  world: "MAIN",
  run_at: "document_start"
}

// Disable Fullscreen API so vseosvita test runs in normal mode
// This allows the extension panel and highlights to be visible

try {
  Object.defineProperty(document, "fullscreenEnabled", {
    get: () => false,
    configurable: true
  })
} catch {}

try {
  Object.defineProperty(document, "webkitFullscreenEnabled", {
    get: () => false,
    configurable: true
  })
} catch {}

try {
  Object.defineProperty(document, "fullscreenElement", {
    get: () => null,
    configurable: true
  })
} catch {}

try {
  Object.defineProperty(document, "webkitFullscreenElement", {
    get: () => null,
    configurable: true
  })
} catch {}

const noopFullscreen = () => Promise.resolve()

try {
  Element.prototype.requestFullscreen = noopFullscreen
} catch {}

try {
  // @ts-ignore
  Element.prototype.webkitRequestFullScreen = noopFullscreen
} catch {}

try {
  // @ts-ignore
  Element.prototype.webkitRequestFullscreen = noopFullscreen
} catch {}

try {
  document.exitFullscreen = noopFullscreen
} catch {}

try {
  // @ts-ignore
  document.webkitCancelFullScreen = noopFullscreen
} catch {}

// Clear fullscreen event handlers
try {
  document.onfullscreenchange = null
  // @ts-ignore
  document.onwebkitfullscreenchange = null
} catch {}

// Intercept addEventListener to block fullscreen change listeners
const origAddEventListener = EventTarget.prototype.addEventListener
EventTarget.prototype.addEventListener = function (
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: boolean | AddEventListenerOptions
) {
  if (
    type === "fullscreenchange" ||
    type === "webkitfullscreenchange" ||
    type === "mozfullscreenchange" ||
    type === "MSFullscreenChange"
  ) {
    return
  }
  return origAddEventListener.call(this, type, listener, options)
}

// Also spoof document.hasFocus to always return true
// (vseosvita may check if window lost focus)
try {
  Document.prototype.hasFocus = function () {
    return true
  }
} catch {}

// Block visibilitychange detection
try {
  Object.defineProperty(document, "hidden", {
    get: () => false,
    configurable: true
  })
  Object.defineProperty(document, "visibilityState", {
    get: () => "visible",
    configurable: true
  })
} catch {}
