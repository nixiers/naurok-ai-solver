import type { ParsedQuestion, QuestionOption, QuestionType } from "./types"

function generateId(): string {
  return Math.random().toString(36).substring(2, 10)
}

function getTextContent(el: Element | null): string {
  if (!el) return ""
  return el.textContent?.trim().replace(/\s+/g, " ") || ""
}

function detectQuestionType(
  questionEl: Element,
  options: QuestionOption[]
): QuestionType {
  const inputFields = questionEl.querySelectorAll(
    'input[type="text"], textarea'
  )
  if (inputFields.length > 0) return "text_input"

  const checkboxes = questionEl.querySelectorAll('input[type="checkbox"]')
  if (checkboxes.length > 0) return "multiple_select"

  const matchingContainer = questionEl.querySelector(
    ".matching, .match-container, [class*='match'], [class*='drag']"
  )
  if (matchingContainer) return "matching"

  if (options.length === 2) {
    const texts = options.map((o) => o.text.toLowerCase())
    const tfPairs = [
      ["так", "ні"],
      ["true", "false"],
      ["правда", "хибно"],
      ["да", "нет"],
      ["вірно", "невірно"],
      ["правильно", "неправильно"]
    ]
    for (const pair of tfPairs) {
      if (texts.includes(pair[0]) && texts.includes(pair[1])) {
        return "true_false"
      }
    }
  }

  if (options.length > 0) return "multiple_choice"

  return "unknown"
}

function parseVseosvitaPreviewPage(): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []
  const questionElements = document.querySelectorAll(
    ".vr-quest, .v-test-question"
  )
  if (questionElements.length === 0) return questions

  questionElements.forEach((el, index) => {
    const titleEl = el.querySelector(
      ".v-test-questions-title .content-box, .v-test-questions-title p, .v-test-questions-title"
    )
    const questionText = getTextContent(titleEl || el)
    if (!questionText) return

    const options: QuestionOption[] = []
    const optionSelectors = [
      ".answer-text",
      ".v-test-questions-select-block .t-text-guest",
      ".v-test-questions-select-block .t-text",
      ".t-test-questions .t-text-guest",
      ".t-test-questions .t-text",
      ".test-answer",
      "label[for]"
    ]

    const seen = new Set<string>()
    for (const selector of optionSelectors) {
      el.querySelectorAll(selector).forEach((optEl) => {
        const text = getTextContent(optEl)
        if (!text || seen.has(text)) return
        seen.add(text)
        options.push({
          index: options.length,
          text,
          element: optEl,
          imageUrl: optEl.querySelector("img")?.getAttribute("src") || undefined
        })
      })
      if (options.length > 0) break
    }

    if (options.length === 0) {
      el.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach((input) => {
        const label = input.closest("label") || input.parentElement
        const text = getTextContent(label)
        if (text && !seen.has(text)) {
          seen.add(text)
          options.push({
            index: options.length,
            text,
            element: label,
          })
        }
      })
    }

    const questionType = detectQuestionType(el, options)
    const imgEl = el.querySelector("img")

    questions.push({
      id: generateId(),
      index,
      type: questionType,
      text: questionText,
      options,
      imageUrl: imgEl?.getAttribute("src") || undefined,
      element: el
    })
  })

  return questions
}

function parseVseosvitaLivePage(): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []

  const questionRoot = document.querySelector(
    "#i-test-question-uwj219, .v-test-question, .v-test-go-bg, .v-test-go-body"
  )
  if (!questionRoot) return questions

  const titleNode = questionRoot.querySelector(
    ".v-test-questions-title .content-box, .v-test-questions-title p, .v-test-questions-title"
  )
  const questionText = getTextContent(titleNode || questionRoot)
  if (!questionText) return questions

  const options: QuestionOption[] = []
  const optionSelectors = [
    ".answer-text",
    ".v-test-questions-select-block .t-text-guest",
    ".v-test-questions-select-block .t-text",
    ".t-test-questions .t-text-guest",
    ".t-test-questions .t-text",
    ".test-answer",
    "label[for]"
  ]

  const seen = new Set<string>()
  for (const selector of optionSelectors) {
    questionRoot.querySelectorAll(selector).forEach((optEl) => {
      const text = getTextContent(optEl)
      if (!text || seen.has(text)) return
      seen.add(text)
      options.push({
        index: options.length,
        text,
        element: optEl,
        imageUrl: optEl.querySelector("img")?.getAttribute("src") || undefined
      })
    })
    if (options.length > 0) break
  }

  if (options.length === 0) {
    questionRoot.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach((input) => {
      const label = input.closest("label") || input.parentElement
      const text = getTextContent(label)
      if (text && !seen.has(text)) {
        seen.add(text)
        options.push({
          index: options.length,
          text,
          element: label,
        })
      }
    })
  }

  const hasCheckbox = questionRoot.querySelector('input[type="checkbox"]') !== null
  const questionType = hasCheckbox ? "multiple_select" : detectQuestionType(questionRoot, options)

  const imgEl = questionRoot.querySelector("img")

  questions.push({
    id: generateId(),
    index: 0,
    type: questionType,
    text: questionText,
    options,
    imageUrl: imgEl?.getAttribute("src") || undefined,
    element: questionRoot
  })

  return questions
}

function parsePreviewPage(): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []
  const questionElements = document.querySelectorAll(
    ".question-view-item, .content-block.entry-item"
  )

  questionElements.forEach((el, index) => {
    const contentEl = el.querySelector(".question-view-item-content")
    const optionsContainer = el.querySelector(".question-options")

    if (!contentEl) return

    const questionText = getTextContent(contentEl)
    if (!questionText) return

    const options: QuestionOption[] = []
    if (optionsContainer) {
      const optionEls = optionsContainer.querySelectorAll(
        ".text-only-option, .image-option, .option-item"
      )
      optionEls.forEach((optEl, optIndex) => {
        const textEl = optEl.querySelector(".option-text")
        const imgEl = optEl.querySelector("img")
        options.push({
          index: optIndex,
          text: getTextContent(textEl),
          element: optEl,
          imageUrl: imgEl?.src
        })
      })
    }

    const questionType = detectQuestionType(el, options)
    const imgEl = contentEl.querySelector("img")

    questions.push({
      id: generateId(),
      index,
      type: questionType,
      text: questionText,
      options,
      imageUrl: imgEl?.src,
      element: el
    })
  })

  return questions
}

function parseLiveTestingPage(): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []

  const questionContentEl = document.querySelector(
    ".test-question-content, .test-content-text-inner"
  )
  if (!questionContentEl) return questions

  const questionText = getTextContent(
    document.querySelector(".test-content-text-inner") || questionContentEl
  )
  if (!questionText) return questions

  const optionEls = document.querySelectorAll(
    ".question-option-inner, .question-option-inner-multiple"
  )
  if (optionEls.length === 0) return questions

  const options: QuestionOption[] = []
  optionEls.forEach((optEl, optIndex) => {
    const contentEl = optEl.querySelector(".question-option-inner-content")
    const text = getTextContent(contentEl || optEl)
    if (text && text.length > 0) {
      options.push({
        index: optIndex,
        text,
        element: optEl,
        imageUrl: (optEl.querySelector(".question-option-image img") as HTMLImageElement | null)?.src
      })
    }
  })

  const isMulti =
    document.querySelector(".question-option-inner-multiple") !== null
  const questionType = isMulti
    ? "multiple_select"
    : detectQuestionType(questionContentEl, options)

  const questionImgEl = document.querySelector(
    ".test-content-image img"
  ) as HTMLImageElement | null

  questions.push({
    id: generateId(),
    index: 0,
    type: questionType,
    text: questionText,
    options,
    imageUrl: questionImgEl?.src,
    element: document.querySelector(".test-container-inner") || questionContentEl
  })

  return questions
}

function parseTestingPage(): ParsedQuestion[] {
  const liveQuestions = parseLiveTestingPage()
  if (liveQuestions.length > 0) return liveQuestions

  const questions: ParsedQuestion[] = []

  const selectors = [
    ".test-question",
    ".question",
    ".quiz-question",
    "[class*='question-container']",
    "[class*='question-wrapper']",
    ".question-block",
    "[data-question]",
    ".realtime-question"
  ]

  let questionElements: NodeListOf<Element> | null = null
  for (const selector of selectors) {
    const els = document.querySelectorAll(selector)
    if (els.length > 0) {
      questionElements = els
      break
    }
  }

  if (!questionElements || questionElements.length === 0) {
    return parseFallback()
  }

  questionElements.forEach((el, index) => {
    const questionTextEl = el.querySelector(
      ".question-text, .question-content, .question-title, h2, h3, p:first-child"
    )
    const questionText = getTextContent(questionTextEl || el)
    if (!questionText) return

    const options: QuestionOption[] = []
    const optionEls = el.querySelectorAll(
      ".answer-option, .option, .choice, .variant, [class*='option'], [class*='answer'], [class*='choice'], label"
    )

    optionEls.forEach((optEl, optIndex) => {
      const text = getTextContent(optEl)
      if (text && text.length > 0 && text.length < 500) {
        options.push({
          index: optIndex,
          text,
          element: optEl,
          imageUrl: optEl.querySelector("img")?.src
        })
      }
    })

    const questionType = detectQuestionType(el, options)
    questions.push({
      id: generateId(),
      index,
      type: questionType,
      text: questionText,
      options,
      imageUrl: el.querySelector("img")?.src,
      element: el
    })
  })

  return questions
}

function parseFallback(): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []
  const body = document.body.innerHTML

  const questionPatterns = [
    /Запитання\s*(\d+)/gi,
    /Питання\s*(\d+)/gi,
    /Вопрос\s*(\d+)/gi,
    /Question\s*(\d+)/gi
  ]

  let foundQuestions = false
  for (const pattern of questionPatterns) {
    if (pattern.test(body)) {
      foundQuestions = true
      break
    }
  }

  if (!foundQuestions) return questions

  const allElements = document.querySelectorAll("div, section, article")
  const questionContainers: Element[] = []

  allElements.forEach((el) => {
    const text = el.textContent || ""
    const isQuestion = questionPatterns.some((p) => {
      p.lastIndex = 0
      return p.test(text)
    })
    if (isQuestion && el.children.length > 0 && el.children.length < 20) {
      const alreadyChild = questionContainers.some(
        (existing) => existing.contains(el) && existing !== el
      )
      if (!alreadyChild) {
        questionContainers.push(el)
      }
    }
  })

  questionContainers.forEach((el, index) => {
    const questionText = getTextContent(el)
    if (!questionText || questionText.length > 2000) return

    const options: QuestionOption[] = []
    const radioButtons = el.querySelectorAll(
      'input[type="radio"], input[type="checkbox"]'
    )
    if (radioButtons.length > 0) {
      radioButtons.forEach((radio, optIndex) => {
        const label = radio.closest("label") || radio.parentElement
        options.push({
          index: optIndex,
          text: getTextContent(label),
          element: label
        })
      })
    }

    questions.push({
      id: generateId(),
      index,
      type: options.length > 0 ? "multiple_choice" : "unknown",
      text: questionText,
      options,
      element: el
    })
  })

  return questions
}

export function isVseosvitaPage(): boolean {
  return window.location.hostname === "vseosvita.ua"
}

export function isVseosvitaLivePage(): boolean {
  const url = window.location.href
  return (
    isVseosvitaPage() &&
    (url.includes("/test/go-olp") ||
      url.includes("/test/start/") ||
      document.querySelector(".v-test-go-body, .v-test-question, #i-test-question-uwj219") !== null)
  )
}

export function parseQuestions(): ParsedQuestion[] {
  const url = window.location.href

  if (isVseosvitaPage()) {
    if (isVseosvitaLivePage()) {
      const vseosvitaLive = parseVseosvitaLivePage()
      if (vseosvitaLive.length > 0) return vseosvitaLive
    }
    const vseosvitaPreview = parseVseosvitaPreviewPage()
    if (vseosvitaPreview.length > 0) return vseosvitaPreview
  }

  if (url.includes("/test/testing/") || url.includes("/test/start/")) {
    const testingQuestions = parseTestingPage()
    if (testingQuestions.length > 0) return testingQuestions
  }

  const previewQuestions = parsePreviewPage()
  if (previewQuestions.length > 0) return previewQuestions

  const testingQuestions = parseTestingPage()
  if (testingQuestions.length > 0) return testingQuestions

  return parseFallback()
}

export function isLiveTestingPage(): boolean {
  if (isVseosvitaLivePage()) return true
  const url = window.location.href
  return (
    url.includes("/test/testing/") ||
    url.includes("/test/start/") ||
    document.querySelector(".test-container-inner") !== null
  )
}

export function getLiveTestingProgress(): {
  current: number
  total: number
} | null {
  const counterEl = document.querySelector(".numberQuestionsLeft")
  if (!counterEl) return null
  const text = counterEl.textContent?.trim() || ""
  const match = text.match(/(\d+)\s*\/\s*(\d+)/)
  if (!match) return null
  return { current: parseInt(match[1], 10), total: parseInt(match[2], 10) }
}

export function getPageTitle(): string {
  const h1 = document.querySelector("h1")
  if (h1) return getTextContent(h1)

  const title = document.title
  if (title) return title.replace(/\s*[|–—-]\s*.*$/, "").trim()

  return "Unknown Test"
}
