import React, { useCallback, useEffect, useState } from "react"

import { getHistory, getSettings, saveSettings } from "~lib/storage"
import type { AppSettings, HistoryEntry, SolveMode } from "~lib/types"
import { AI_MODELS, DEFAULT_SETTINGS } from "~lib/types"
import type { Locale } from "~locales"
import { t } from "~locales"

import "~styles/popup.css"

type Tab = "main" | "settings" | "history"

function Popup() {
  const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [activeTab, setActiveTab] = useState<Tab>("main")
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [newKeyModel, setNewKeyModel] = useState(AI_MODELS[0].id)
  const [newKeyValue, setNewKeyValue] = useState("")

  useEffect(() => {
    getSettings().then(setSettingsState)
    getHistory().then(setHistory)
  }, [])

  const locale = t(settings.locale)

  const updateSettings = useCallback(
    (partial: Partial<AppSettings>) => {
      const updated = { ...settings, ...partial }
      setSettingsState(updated)
      saveSettings(updated)
    },
    [settings]
  )

  const addApiKey = useCallback(() => {
    if (!newKeyValue.trim()) return
    const keys = [
      ...settings.apiKeys.filter((k) => k.model !== newKeyModel),
      { model: newKeyModel, key: newKeyValue.trim(), enabled: true }
    ]
    updateSettings({ apiKeys: keys })
    setNewKeyValue("")
  }, [newKeyModel, newKeyValue, settings.apiKeys, updateSettings])

  const removeApiKey = useCallback(
    (model: string) => {
      updateSettings({
        apiKeys: settings.apiKeys.filter((k) => k.model !== model)
      })
    },
    [settings.apiKeys, updateSettings]
  )

  const sendCommand = (command: string) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { type: command })
      }
    })
  }

  return (
    <div className="popup">
      <div className="popup-header">
        <div className="popup-header-left">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="popup-logo">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span className="popup-title">{locale.appName}</span>
        </div>
        <span className="popup-version">v0.0.1</span>
      </div>

      <div className="popup-tabs">
        {(["main", "settings", "history"] as const).map((tab) => (
          <button key={tab} className={`popup-tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
            {tab === "main" ? "Solver" : tab === "settings" ? locale.settings : locale.history}
          </button>
        ))}
      </div>

      {activeTab === "main" && (
        <div className="popup-content">
          <div className="popup-section">
            <label className="popup-label">{locale.mode}</label>
            <div className="popup-mode-grid">
              {([
                { key: "accuracy" as const, label: locale.modeAccuracy },
                { key: "fast" as const, label: locale.modeFast },
                { key: "grok_only" as const, label: locale.modeGrokOnly }
              ]).map(({ key, label }) => (
                <button key={key} className={`popup-mode-btn ${settings.mode === key ? "active" : ""}`} onClick={() => updateSettings({ mode: key as SolveMode })}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="popup-section">
            <button className="popup-solve-btn" onClick={() => sendCommand("COMMAND_SOLVE_ALL")}>
              {locale.solveAll}
            </button>
          </div>

          <div className="popup-section">
            <div className="popup-toggle-row">
              <span>{locale.antiDetection}</span>
              <label className="popup-switch">
                <input type="checkbox" checked={settings.antiDetection} onChange={(e) => updateSettings({ antiDetection: e.target.checked })} />
                <span className="popup-slider" />
              </label>
            </div>
            <div className="popup-toggle-row">
              <div>
                <span>{locale.examMode}</span>
                <p className="popup-hint">{locale.examModeDesc}</p>
              </div>
              <label className="popup-switch">
                <input type="checkbox" checked={settings.examMode} onChange={(e) => updateSettings({ examMode: e.target.checked })} />
                <span className="popup-slider" />
              </label>
            </div>
          </div>

          <div className="popup-section">
            <div className="popup-info-row">
              <span>{locale.apiKeys}</span>
              <span className="popup-badge">{settings.apiKeys.filter((k) => k.enabled).length} active</span>
            </div>
          </div>

          <div className="popup-section popup-hotkeys">
            <label className="popup-label">{locale.hotkeys}</label>
            <div className="popup-hotkey-row"><span>{locale.hotkeysSolveAll}</span><kbd>Alt+S</kbd></div>
            <div className="popup-hotkey-row"><span>{locale.hotkeysSolveOne}</span><kbd>Alt+Q</kbd></div>
            <div className="popup-hotkey-row"><span>{locale.hotkeysToggle}</span><kbd>Alt+N</kbd></div>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="popup-content">
          <div className="popup-section">
            <label className="popup-label">{locale.apiKeys}</label>
            {settings.apiKeys.map((keyConfig) => {
              const model = AI_MODELS.find((m) => m.id === keyConfig.model)
              return (
                <div key={keyConfig.model} className="popup-key-item">
                  <div className="popup-key-info">
                    <span className="popup-key-name">{model?.name || keyConfig.model}</span>
                    <span className="popup-key-preview">...{keyConfig.key.slice(-6)}</span>
                  </div>
                  <div className="popup-key-actions">
                    <label className="popup-switch popup-switch-sm">
                      <input type="checkbox" checked={keyConfig.enabled} onChange={(e) => {
                        const keys = settings.apiKeys.map((k) => k.model === keyConfig.model ? { ...k, enabled: e.target.checked } : k)
                        updateSettings({ apiKeys: keys })
                      }} />
                      <span className="popup-slider" />
                    </label>
                    <button className="popup-delete-btn" onClick={() => removeApiKey(keyConfig.model)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                    </button>
                  </div>
                </div>
              )
            })}
            <div className="popup-add-key">
              <select className="popup-select" value={newKeyModel} onChange={(e) => setNewKeyModel(e.target.value as typeof newKeyModel)}>
                {AI_MODELS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <input className="popup-input" type="password" placeholder={locale.apiKeyPlaceholder} value={newKeyValue} onChange={(e) => setNewKeyValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addApiKey()} />
              <button className="popup-add-btn" onClick={addApiKey}>+</button>
            </div>
          </div>

          <div className="popup-section">
            <label className="popup-label">{locale.theme}</label>
            <div className="popup-mode-grid">
              {(["dark", "light", "auto"] as const).map((theme) => (
                <button key={theme} className={`popup-mode-btn ${settings.theme === theme ? "active" : ""}`} onClick={() => updateSettings({ theme })}>
                  {theme === "dark" ? locale.themeDark : theme === "light" ? locale.themeLight : locale.themeAuto}
                </button>
              ))}
            </div>
          </div>

          <div className="popup-section">
            <label className="popup-label">{locale.language}</label>
            <div className="popup-mode-grid">
              {([{ key: "uk" as const, label: "Українська" }, { key: "ru" as const, label: "Русский" }, { key: "en" as const, label: "English" }]).map(({ key, label }) => (
                <button key={key} className={`popup-mode-btn ${settings.locale === key ? "active" : ""}`} onClick={() => updateSettings({ locale: key as Locale })}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="popup-section">
            <label className="popup-label">{locale.antiDetection}</label>
            <div className="popup-delay-row">
              <span>Min delay (ms)</span>
              <input className="popup-input popup-input-sm" type="number" value={settings.minDelay} onChange={(e) => updateSettings({ minDelay: parseInt(e.target.value) || 500 })} />
            </div>
            <div className="popup-delay-row">
              <span>Max delay (ms)</span>
              <input className="popup-input popup-input-sm" type="number" value={settings.maxDelay} onChange={(e) => updateSettings({ maxDelay: parseInt(e.target.value) || 2000 })} />
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="popup-content">
          {history.length === 0 ? (
            <div className="popup-empty"><p>No history yet</p></div>
          ) : (
            <div className="popup-history-list">
              {history.slice(0, 20).map((entry) => (
                <a key={entry.id} href={entry.testUrl} target="_blank" rel="noopener noreferrer" className="popup-history-item">
                  <div className="popup-history-title">{entry.testTitle}</div>
                  <div className="popup-history-meta">
                    <span>{entry.solvedQuestions}/{entry.totalQuestions} solved</span>
                    <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="popup-footer">
        <span>{locale.disclaimer}</span>
      </div>
    </div>
  )
}

export default Popup
