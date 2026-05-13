import type { ConsensusResult, ParsedQuestion } from "./types"

const HIGHLIGHT_STYLES = {
  correct: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    border: "2px solid rgba(34, 197, 94, 0.6)",
    borderRadius: "8px",
    transition: "all 0.3s ease"
  },
  badge: {
    position: "absolute" as const,
    top: "-8px",
    right: "-8px",
    backgroundColor: "#22c55e",
    color: "white",
    fontSize: "11px",
    fontWeight: "700",
    padding: "2px 6px",
    borderRadius: "10px",
    zIndex: "10000",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
  }
}

function applyStyles(
  element: HTMLElement,
  styles: Record<string, string>
): void {
  for (const [key, value] of Object.entries(styles)) {
    element.style.setProperty(
      key.replace(/([A-Z])/g, "-$1").toLowerCase(),
      value
    )
  }
}

function highlightSingleOption(
  option: { element: Element | null },
  confidence: number
): void {
  if (!option.element) return
  const el = option.element as HTMLElement

  applyStyles(
    el,
    HIGHLIGHT_STYLES.correct as unknown as Record<string, string>
  )

  const existingBadge = el.querySelector(".naurok-ai-badge")
  if (existingBadge) existingBadge.remove()

  const badge = document.createElement("span")
  badge.className = "naurok-ai-badge"
  badge.textContent = `${Math.round(confidence * 100)}%`
  applyStyles(
    badge,
    HIGHLIGHT_STYLES.badge as unknown as Record<string, string>
  )
  el.style.position = "relative"
  el.appendChild(badge)
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

  const highlightedElements = document.querySelectorAll(
    '[style*="rgba(34, 197, 94"]'
  )
  highlightedElements.forEach((el) => {
    const htmlEl = el as HTMLElement
    htmlEl.style.backgroundColor = ""
    htmlEl.style.border = ""
    htmlEl.style.borderRadius = ""
  })
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
