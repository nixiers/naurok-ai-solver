import type { AppSettings, HistoryEntry, ModelStats } from "./types"
import { DEFAULT_SETTINGS } from "./types"

const SETTINGS_KEY = "naurok_ai_settings"
const HISTORY_KEY = "naurok_ai_history"
const STATS_KEY = "naurok_ai_stats"

function getChromeStorage(): typeof chrome.storage.local | null {
  if (typeof chrome !== "undefined" && chrome.storage?.local) {
    return chrome.storage.local
  }
  return null
}

async function getFromStorage<T>(key: string, fallback: T): Promise<T> {
  const storage = getChromeStorage()
  if (storage) {
    return new Promise((resolve) => {
      storage.get(key, (result) => {
        resolve((result[key] as T) ?? fallback)
      })
    })
  }
  try {
    const stored = localStorage.getItem(key)
    return stored ? (JSON.parse(stored) as T) : fallback
  } catch {
    return fallback
  }
}

async function setToStorage<T>(key: string, value: T): Promise<void> {
  const storage = getChromeStorage()
  if (storage) {
    return new Promise((resolve) => {
      storage.set({ [key]: value }, resolve)
    })
  }
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or not available
  }
}

export async function getSettings(): Promise<AppSettings> {
  return getFromStorage<AppSettings>(SETTINGS_KEY, DEFAULT_SETTINGS)
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  return setToStorage(SETTINGS_KEY, settings)
}

export async function getHistory(): Promise<HistoryEntry[]> {
  return getFromStorage<HistoryEntry[]>(HISTORY_KEY, [])
}

export async function addHistoryEntry(entry: HistoryEntry): Promise<void> {
  const history = await getHistory()
  history.unshift(entry)
  if (history.length > 100) {
    history.splice(100)
  }
  return setToStorage(HISTORY_KEY, history)
}

export async function clearHistory(): Promise<void> {
  return setToStorage(HISTORY_KEY, [])
}

export async function getModelStats(): Promise<ModelStats[]> {
  return getFromStorage<ModelStats[]>(STATS_KEY, [])
}

export async function updateModelStats(
  stats: ModelStats[]
): Promise<void> {
  return setToStorage(STATS_KEY, stats)
}

export function exportToJson(history: HistoryEntry[]): string {
  return JSON.stringify(history, null, 2)
}

export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
