import type {
  ApiKeyConfig,
  AppSettings,
  ConsensusResult,
  ParsedQuestion,
  SolveMode
} from "~lib/types"
import { DEFAULT_SETTINGS } from "~lib/types"

import { solveQuestion } from "~lib/ai-engine"

export {}

const SETTINGS_KEY = "naurok_ai_settings"

async function loadSettings(): Promise<AppSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get(SETTINGS_KEY, (result) => {
      resolve((result[SETTINGS_KEY] as AppSettings) ?? DEFAULT_SETTINGS)
    })
  })
}

interface SolveRequest {
  type: "SOLVE_QUESTION" | "GET_SETTINGS"
  question?: ParsedQuestion
  apiKeys?: ApiKeyConfig[]
  mode?: SolveMode
}

interface SolveResponse {
  type: "SOLVE_RESULT" | "SETTINGS_RESULT"
  questionId?: string
  result?: ConsensusResult
  error?: string
  settings?: AppSettings
}

chrome.runtime.onMessage.addListener(
  (
    message: SolveRequest,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: SolveResponse) => void
  ) => {
    if (message.type === "GET_SETTINGS") {
      loadSettings().then((settings) => {
        sendResponse({ type: "SETTINGS_RESULT", settings })
      })
      return true
    }

    if (message.type === "SOLVE_QUESTION" && message.question) {
      loadSettings().then((storedSettings) => {
        const apiKeys =
          message.apiKeys && message.apiKeys.length > 0
            ? message.apiKeys
            : storedSettings.apiKeys
        const mode = message.mode || storedSettings.mode

        solveQuestion(message.question!, apiKeys, mode)
          .then((result) => {
            sendResponse({
              type: "SOLVE_RESULT",
              questionId: message.question!.id,
              result
            })
          })
          .catch((error: Error) => {
            sendResponse({
              type: "SOLVE_RESULT",
              questionId: message.question!.id,
              error: error.message
            })
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
