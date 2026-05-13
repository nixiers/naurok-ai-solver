import type { ConsensusResult, ParsedQuestion } from "./types"

function injectHighlightCSS(): void {
  const cssContent = `
    .naurok-ai-highlighted {
      background-color: rgba(34, 197, 94, 0.25) !important;
      border: 3px solid #22c55e !important;
      border-radius: 8px !important;
      box-shadow: 0 0 12px rgba(34, 197, 94, 0.4) !important;
      position: relative !important;
      transition: all 0.3s ease !important;
    }
    .naurok-ai-badge {
      position: absolute !important;
      top: -10px !important;
      right: -10px !important;
      background-color: #22c55e !important;
      color: white !important;
      font-size: 12px !important;
      font-weight: 700 !important;
      padding: 3px 8px !important;
      border-radius: 12px !important;
      z-index: 999999 !important;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3) !important;
      font-family: sans-serif !important;
      line-height: 1 !important;
    }
    .naurok-ai-fs-overlay {
      position: fixed !important;
      bottom: 20px !important;
      right: 20px !important;
      background: rgba(0, 0, 0, 0.85) !important;
      color: white !important;
      padding: 12px 20px !important;
      border-radius: 12px !important;
      font-family: sans-serif !important;
      font-size: 15px !important;
      z-index: 2147483647 !important;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
      backdrop-filter: blur(8px) !important;
      max-width: 400px !important;
      pointer-events: none !important;
      transition: opacity 0.3s ease !important;
    }
    .naurok-ai-fs-overlay-answer {
      color: #4ade80 !important;
      font-weight: 700 !important;
      font-size: 16px !important;
      margin-top: 4px !important;
    }
    .naurok-ai-fs-overlay-conf {
      color: #86efac !important;
      font-size: 12px !important;
      margin-left: 8px !important;
    }
  `
  if (!document.getElementById("naurok-ai-highlight-css")) {
    const style = document.createElement("style")
    style.id = "naurok-ai-highlight-css"
    style.textContent = cssContent
    document.head.appendChild(style)
  }

  const fsEl = document.fullscreenElement
  if (fsEl && !fsEl.querySelector("#naurok-ai-highlight-css-fs")) {
    const fsStyle = document.createElement("style")
    fsStyle.id = "naurok-ai-highlight-css-fs"
    fsStyle.textContent = cssContent
    fsEl.appendChild(fsStyle)
  }
}

function highlightSingleOption(
  option: { element: Element | null },
  confidence: number
): void {
  if (!option.element) return
  const el = option.element as HTMLElement

  injectHighlightCSS()
  el.classList.add("naurok-ai-highlighted")

  const existingBadge = el.querySelector(".naurok-ai-badge")
  if (existingBadge) existingBadge.remove()

  const badge = document.createElement("span")
  badge.className = "naurok-ai-badge"
  badge.textContent = `${Math.round(confidence * 100)}%`
  el.appendChild(badge)
}

export function showFullscreenOverlay(answer: string, confidence: number): void {
  injectHighlightCSS()
  let overlay = document.getElementById("naurok-ai-fs-overlay")
  if (!overlay) {
    overlay = document.createElement("div")
    overlay.id = "naurok-ai-fs-overlay"
    overlay.className = "naurok-ai-fs-overlay"
  }
  overlay.innerHTML = `
    <div style="font-size:12px;opacity:0.7;margin-bottom:2px;">AI Answer:</div>
    <div class="naurok-ai-fs-overlay-answer">
      ${answer}
      <span class="naurok-ai-fs-overlay-conf">${Math.round(confidence * 100)}%</span>
    </div>
  `

  const fsElement = document.fullscreenElement
  if (fsElement) {
    fsElement.appendChild(overlay)
  } else {
    document.body.appendChild(overlay)
  }

  setTimeout(() => {
    overlay?.remove()
  }, 15000)
}

export function removeFullscreenOverlay(): void {
  document.getElementById("naurok-ai-fs-overlay")?.remove()
}

export function highlightAnswer(
  question: ParsedQuestion,
  result: ConsensusResult
): void {
  const indices =
    result.bestAnswerIndices && result.bestAnswerIndices.length > 0
      ? result.bestAnswerIndices
      : [result.bestAnswerIndex]

  for (const idx of indices) {
    if (idx < 0 || idx >= question.options.length) continue
    highlightSingleOption(question.options[idx], result.confidence)
  }

  const answers = indices
    .filter(idx => idx >= 0 && idx < question.options.length)
    .map(idx => question.options[idx].text)
  if (answers.length > 0 && document.fullscreenElement) {
    showFullscreenOverlay(answers.join(", "), result.confidence)
  }
}

function clickOption(el: HTMLElement, humanLike: boolean, delay: number): void {
  const clickTarget =
    el.querySelector('input[type="radio"]') ||
    el.querySelector('input[type="checkbox"]') ||
    el.querySelector(".option-marker") ||
    el

  if (humanLike) {
    setTimeout(() => {
      ;(clickTarget as HTMLElement).click()
    }, delay)
  } else {
    ;(clickTarget as HTMLElement).click()
  }
}

export function autoSelectAnswer(
  question: ParsedQuestion,
  result: ConsensusResult,
  humanLike: boolean = true
): void {
  const indices =
    result.bestAnswerIndices && result.bestAnswerIndices.length > 0
      ? result.bestAnswerIndices
      : [result.bestAnswerIndex]

  let baseDelay = Math.random() * 500 + 200
  for (const idx of indices) {
    if (idx < 0 || idx >= question.options.length) continue
    const option = question.options[idx]
    if (!option.element) continue
    clickOption(option.element as HTMLElement, humanLike, baseDelay)
    baseDelay += Math.random() * 300 + 150
  }
}

export function fillTextAnswer(
  question: ParsedQuestion,
  result: ConsensusResult,
  humanLike: boolean = true
): void {
  if (!question.element) return

  const input = question.element.querySelector(
    'input[type="text"], textarea'
  ) as HTMLInputElement | HTMLTextAreaElement | null

  if (!input) return

  if (humanLike) {
    input.focus()
    const text = result.bestAnswer
    let i = 0
    const typeInterval = setInterval(() => {
      if (i < text.length) {
        input.value += text[i]
        input.dispatchEvent(new Event("input", { bubbles: true }))
        i++
      } else {
        clearInterval(typeInterval)
        input.dispatchEvent(new Event("change", { bubbles: true }))
      }
    }, 50 + Math.random() * 100)
  } else {
    input.value = result.bestAnswer
    input.dispatchEvent(new Event("input", { bubbles: true }))
    input.dispatchEvent(new Event("change", { bubbles: true }))
  }
}

export function clearHighlights(): void {
  const badges = document.querySelectorAll(".naurok-ai-badge")
  badges.forEach((badge) => badge.remove())

  const highlighted = document.querySelectorAll(".naurok-ai-highlighted")
  highlighted.forEach((el) => el.classList.remove("naurok-ai-highlighted"))

  const highlightedElements = document.querySelectorAll(
    '[style*="rgba(34, 197, 94"]'
  )
  highlightedElements.forEach((el) => {
    const htmlEl = el as HTMLElement
    htmlEl.style.backgroundColor = ""
    htmlEl.style.border = ""
    htmlEl.style.borderRadius = ""
  })

  removeFullscreenOverlay()
}

export function applyResult(
  question: ParsedQuestion,
  result: ConsensusResult,
  autoSelect: boolean = true,
  antiDetection: boolean = true
): void {
  highlightAnswer(question, result)

  if (autoSelect) {
    if (question.type === "text_input") {
      fillTextAnswer(question, result, antiDetection)
    } else {
      autoSelectAnswer(question, result, antiDetection)
    }
  }
}
