import cssText from "data-text:~styles/content.css"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import React, { useCallback, useEffect, useRef, useState } from "react"

import { humanLikeBehavior } from "~lib/anti-detect"
import { applyResult, clearHighlights } from "~lib/highlighter"
import {
  getPageTitle,
  isLiveTestingPage,
  isVseosvitaPage,
  getLiveTestingProgress,
  parseQuestions
} from "~lib/parser"
import { addHistoryEntry, getSettings } from "~lib/storage"
import type {
  AppSettings,
  ConsensusResult,
  HistoryEntry,
  ParsedQuestion,
  SolvedQuestion,
  SolveProgress
} from "~lib/types"
import { DEFAULT_SETTINGS } from "~lib/types"
import { t } from "~locales"

import { ConfidenceBadge } from "~components/ConfidenceBadge"
import { ModelVotes } from "~components/ModelVotes"
import { ProgressBar } from "~components/ProgressBar"

export const config: PlasmoCSConfig = {
  matches: ["https://naurok.com.ua/*", "https://naurok.ua/*", "https://vseosvita.ua/*"],
  all_frames: true
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

function FloatingPanel() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [settingsLoaded, setSettingsLoaded] = useState(false)
  const [questions, setQuestions] = useState<ParsedQuestion[]>([])
  const [solvedQuestions, setSolvedQuestions] = useState<SolvedQuestion[]>([])
  const [progress, setProgress] = useState<SolveProgress>({
    current: 0,
    total: 0,
    status: "idle"
  })
  const [isVisible, setIsVisible] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeResultIndex, setActiveResultIndex] = useState<number | null>(
    null
  )

  useEffect(() => {
    getSettings()
      .then((s) => {
        setSettings(s)
        setSettingsLoaded(true)
      })
      .catch(() => {
        // Fallback: request settings from background worker
        chrome.runtime.sendMessage(
          { type: "GET_SETTINGS" },
          (response) => {
            if (response?.settings) {
              setSettings(response.settings)
            }
            setSettingsLoaded(true)
          }
        )
      })
  }, [])

  const locale = t(settings.locale)

  const scanQuestions = useCallback(() => {
    setProgress({ current: 0, total: 0, status: "scanning" })
    const parsed = parseQuestions()
    setQuestions(parsed)
    setProgress({
      current: 0,
      total: parsed.length,
      status: parsed.length > 0 ? "idle" : "error",
      error: parsed.length === 0 ? locale.noQuestions : undefined
    })
    return parsed
  }, [locale.noQuestions])

  const solveOneQuestion = useCallback(
    async (question: ParsedQuestion): Promise<SolvedQuestion | null> => {
      try {
        const freshSettings = await getSettings()
        if (freshSettings.apiKeys.length > 0) {
          setSettings(freshSettings)
        }
        const activeKeys =
          freshSettings.apiKeys.length > 0
            ? freshSettings.apiKeys
            : settings.apiKeys
        const activeMode = freshSettings.mode || settings.mode

        const result: ConsensusResult = await new Promise(
          (resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error("AI request timed out"))
            }, 30000)

            chrome.runtime.sendMessage(
              {
                type: "SOLVE_QUESTION",
                question: {
                  ...question,
                  element: null,
                  options: question.options.map((o) => ({
                    ...o,
                    element: null
                  }))
                },
                apiKeys: activeKeys,
                mode: activeMode
              },
              (response) => {
                clearTimeout(timeout)
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message))
                  return
                }
                if (response?.error) {
                  reject(new Error(response.error))
                  return
                }
                resolve(response.result)
              }
            )
          }
        )

        const isLive = isLiveTestingPage()
        applyResult(question, result, !isLive, settings.antiDetection)

        return {
          question: {
            ...question,
            element: null,
            options: question.options.map((o) => ({ ...o, element: null }))
          },
          result,
          timestamp: Date.now(),
          testUrl: window.location.href
        }
      } catch (error) {
        console.error(
          `Failed to solve question: ${(error as Error).message}`
        )
        return null
      }
    },
    [settings]
  )

  const solvingRef = useRef(false)
  const solvingStartTimeRef = useRef(0)

  const solveLiveTest = useCallback(async () => {
    const liveProgress = getLiveTestingProgress()
    const totalQuestions = liveProgress?.total || 0
    setProgress({ current: 0, total: totalQuestions, status: "solving" })
    clearHighlights()

    const qs = parseQuestions()
    if (qs.length === 0) {
      setProgress({
        current: 0,
        total: totalQuestions,
        status: "error",
        error: locale.noQuestions
      })
      return
    }

    const currentQ = qs[0]
    setProgress({
      current: liveProgress?.current || 0,
      total: totalQuestions,
      status: "solving",
      currentQuestion: currentQ.text.substring(0, 50)
    })

    try {
      const result = await solveOneQuestion(currentQ)
      if (result) {
        setSolvedQuestions((prev) => [...prev, result])
      }
    } catch {
      // ignore errors, allow next question to be solved
    }

    setProgress({
      current: liveProgress?.current || 1,
      total: totalQuestions,
      status: "done"
    })
  }, [settings, solveOneQuestion, locale.noQuestions])

  const liveQuestionTextRef = useRef<string>("")

  const checkForNewQuestion = useCallback(() => {
    const qs = parseQuestions()
    if (qs.length === 0) return
    const currentText = qs[0].text
    if (!currentText) return
    if (currentText === liveQuestionTextRef.current) return

    liveQuestionTextRef.current = currentText
    clearHighlights()

    // Force reset solvingRef if it's been stuck for > 15 seconds
    if (solvingRef.current && Date.now() - solvingStartTimeRef.current > 15000) {
      solvingRef.current = false
    }

    if (!solvingRef.current) {
      solvingRef.current = true
      solvingStartTimeRef.current = Date.now()
      solveLiveTest()
        .catch(() => {})
        .finally(() => {
          solvingRef.current = false
        })
    }
  }, [solveLiveTest])

  useEffect(() => {
    if (!isLiveTestingPage()) return

    const observer = new MutationObserver(() => checkForNewQuestion())

    const target = document.querySelector(".test-container-inner") || document.querySelector(".v-test-go-body") || document.querySelector(".v-test-question") || document.body
    observer.observe(target, { childList: true, subtree: true, characterData: true })

    // Polling every 800ms — catches Vue reactivity changes that MutationObserver misses
    const pollInterval = setInterval(() => checkForNewQuestion(), 800)

    return () => {
      observer.disconnect()
      clearInterval(pollInterval)
    }
  }, [checkForNewQuestion])

  const solveAll = useCallback(async () => {
    if (solvingRef.current) return
    solvingRef.current = true

    if (isLiveTestingPage()) {
      await solveLiveTest()
      solvingRef.current = false
      return
    }

    let qs = questions
    if (qs.length === 0) {
      qs = scanQuestions()
    }
    if (qs.length === 0) {
      solvingRef.current = false
      return
    }

    setProgress({ current: 0, total: qs.length, status: "solving" })
    clearHighlights()
    setSolvedQuestions([])

    const solved: SolvedQuestion[] = []

    for (let i = 0; i < qs.length; i++) {
      setProgress({
        current: i,
        total: qs.length,
        status: "solving",
        currentQuestion: qs[i].text.substring(0, 50)
      })

      if (settings.antiDetection) {
        await humanLikeBehavior(settings.minDelay, settings.maxDelay)
      }

      const result = await solveOneQuestion(qs[i])
      if (result) {
        solved.push(result)
        setSolvedQuestions([...solved])
      }

      setProgress({
        current: i + 1,
        total: qs.length,
        status: i === qs.length - 1 ? "done" : "solving"
      })
    }

    const historyEntry: HistoryEntry = {
      id: Math.random().toString(36).substring(2, 10),
      testTitle: getPageTitle(),
      testUrl: window.location.href,
      questions: solved,
      timestamp: Date.now(),
      totalQuestions: qs.length,
      solvedQuestions: solved.length
    }
    addHistoryEntry(historyEntry)
    solvingRef.current = false
  }, [questions, scanQuestions, settings, solveOneQuestion, solveLiveTest])

  useEffect(() => {
    const handleMessage = (message: { type: string }) => {
      if (message.type === "COMMAND_SOLVE_ALL") {
        solveAll()
      } else if (message.type === "COMMAND_TOGGLE_PANEL") {
        setIsVisible((v) => !v)
      } else if (message.type === "COMMAND_SOLVE_CURRENT") {
        const qs = questions.length > 0 ? questions : scanQuestions()
        if (qs.length > 0) {
          solveOneQuestion(qs[0])
        }
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage)
    return () => chrome.runtime.onMessage.removeListener(handleMessage)
  }, [questions, scanQuestions, solveAll, solveOneQuestion])

  if (!isVisible || settings.examMode) return null

  if (isMinimized) {
    return (
      <div
        className="naurok-ai-fab"
        onClick={() => setIsMinimized(false)}
        title="Naurok AI Solver">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
        {progress.status === "solving" && (
          <div className="naurok-ai-fab-badge">{progress.current}/{progress.total}</div>
        )}
      </div>
    )
  }

  return (
    <div className="naurok-ai-panel">
      {/* Header */}
      <div className="naurok-ai-header">
        <div className="naurok-ai-header-left">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="naurok-ai-logo">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span className="naurok-ai-title">Naurok AI</span>
          {questions.length > 0 && (
            <span className="naurok-ai-count">{questions.length}</span>
          )}
        </div>
        <div className="naurok-ai-header-right">
          <button className="naurok-ai-icon-btn" onClick={() => setIsMinimized(true)} title="Minimize">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /></svg>
          </button>
          <button className="naurok-ai-icon-btn" onClick={() => setIsVisible(false)} title="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
      </div>

      {/* Mode selector */}
      <div className="naurok-ai-modes">
        {(["accuracy", "fast", "grok_only"] as const).map((mode) => (
          <button
            key={mode}
            className={`naurok-ai-mode-btn ${settings.mode === mode ? "active" : ""}`}
            onClick={() => setSettings({ ...settings, mode })}>
            {mode === "accuracy" ? locale.modeAccuracy : mode === "fast" ? locale.modeFast : locale.modeGrokOnly}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="naurok-ai-actions">
        <button className="naurok-ai-btn-primary" onClick={solveAll} disabled={progress.status === "solving"}>
          {progress.status === "solving" ? (
            <>
              <svg className="naurok-ai-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>
              {locale.solving}
            </>
          ) : (
            locale.solveAll
          )}
        </button>
        <button className="naurok-ai-btn-secondary" onClick={scanQuestions}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          Scan
        </button>
      </div>

      {/* Progress */}
      {progress.status !== "idle" && (
        <div className="naurok-ai-progress">
          <ProgressBar current={progress.current} total={progress.total} status={progress.status} />
          {progress.currentQuestion && <p className="naurok-ai-current-q">{progress.currentQuestion}...</p>}
          {progress.error && <p className="naurok-ai-error">{progress.error}</p>}
        </div>
      )}

      {/* Results */}
      {solvedQuestions.length > 0 && (
        <div className="naurok-ai-results">
          <div className="naurok-ai-results-header">
            <span>{locale.solved}: {solvedQuestions.length}/{progress.total || questions.length || solvedQuestions.length}</span>
            <button className="naurok-ai-text-btn" onClick={() => { clearHighlights(); setSolvedQuestions([]) }}>
              {locale.reset}
            </button>
          </div>
          <div className="naurok-ai-results-list">
            {solvedQuestions.map((sq, idx) => (
              <div key={idx} className="naurok-ai-result-item" onClick={() => setActiveResultIndex(activeResultIndex === idx ? null : idx)}>
                <div className="naurok-ai-result-header">
                  <span className="naurok-ai-result-q">
                    Q{idx + 1}: {sq.question.text.substring(0, 40)}{sq.question.text.length > 40 ? "..." : ""}
                  </span>
                  <ConfidenceBadge confidence={sq.result.confidence} size="sm" />
                </div>
                <p className="naurok-ai-result-answer">{sq.result.bestAnswer}</p>
                {activeResultIndex === idx && sq.result.votingDetails.length > 1 && (
                  <div className="naurok-ai-votes">
                    <ModelVotes votingDetails={sq.result.votingDetails} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="naurok-ai-footer">
        <span className="naurok-ai-disclaimer">{locale.disclaimer}</span>
      </div>
    </div>
  )
}

export default FloatingPanel
