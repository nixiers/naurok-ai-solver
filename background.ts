import type {
  ApiKeyConfig,
  ConsensusResult,
  ParsedQuestion,
  SolveMode
} from "~lib/types"

import { solveQuestion } from "~lib/ai-engine"

export {}

interface SolveRequest {
  type: "SOLVE_QUESTION"
  question: ParsedQuestion
  apiKeys: ApiKeyConfig[]
  mode: SolveMode
}

interface SolveResponse {
  type: "SOLVE_RESULT"
  questionId: string
  result?: ConsensusResult
  error?: string
}

chrome.runtime.onMessage.addListener(
  (
    message: SolveRequest,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: SolveResponse) => void
  ) => {
    if (message.type === "SOLVE_QUESTION") {
      solveQuestion(message.question, message.apiKeys, message.mode)
        .then((result) => {
          sendResponse({
            type: "SOLVE_RESULT",
            questionId: message.question.id,
            result
          })
        })
        .catch((error: Error) => {
          sendResponse({
            type: "SOLVE_RESULT",
            questionId: message.question.id,
            error: error.message
          })
        })
      return true
    }
    return false
  }
)

chrome.commands.onCommand.addListener((command: string) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0]
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, {
        type: `COMMAND_${command.toUpperCase().replace(/-/g, "_")}`
      })
    }
  })
})

chrome.runtime.onInstalled.addListener(() => {
  console.log("Naurok AI Solver installed")
})
