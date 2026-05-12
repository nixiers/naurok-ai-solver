export type QuestionType =
  | "multiple_choice"
  | "text_input"
  | "true_false"
  | "matching"
  | "multiple_select"
  | "ordering"
  | "unknown"

export interface QuestionOption {
  index: number
  text: string
  element: Element | null
  imageUrl?: string
}

export interface ParsedQuestion {
  id: string
  index: number
  type: QuestionType
  text: string
  options: QuestionOption[]
  imageUrl?: string
  element: Element | null
}

export type AIModel =
  | "grok"
  | "gemini"
  | "gpt-4o"
  | "gpt-o3"
  | "claude"
  | "openrouter"

export interface AIModelConfig {
  id: AIModel
  name: string
  provider: string
  apiKeyName: string
  endpoint: string
  model: string
  enabled: boolean
}

export interface AIResponse {
  model: AIModel
  answer: string
  answerIndex: number
  confidence: number
  reasoning?: string
  responseTime: number
}

export interface ConsensusResult {
  bestAnswer: string
  bestAnswerIndex: number
  confidence: number
  responses: AIResponse[]
  votingDetails: VotingDetail[]
}

export interface VotingDetail {
  answer: string
  answerIndex: number
  votes: number
  avgConfidence: number
  models: AIModel[]
}

export interface SolvedQuestion {
  question: ParsedQuestion
  result: ConsensusResult
  timestamp: number
  testUrl: string
}

export type SolveMode = "accuracy" | "fast" | "grok_only"

export type Theme = "dark" | "light" | "auto"

export interface ApiKeyConfig {
  model: AIModel
  key: string
  enabled: boolean
}

export interface AppSettings {
  mode: SolveMode
  theme: Theme
  locale: "uk" | "ru" | "en"
  antiDetection: boolean
  examMode: boolean
  autoSolve: boolean
  apiKeys: ApiKeyConfig[]
  minDelay: number
  maxDelay: number
}

export interface ModelStats {
  model: AIModel
  totalQuestions: number
  correctAnswers: number
  avgResponseTime: number
  accuracy: number
}

export interface HistoryEntry {
  id: string
  testTitle: string
  testUrl: string
  questions: SolvedQuestion[]
  timestamp: number
  totalQuestions: number
  solvedQuestions: number
  accuracy?: number
}

export interface SolveProgress {
  current: number
  total: number
  status: "idle" | "scanning" | "solving" | "done" | "error"
  currentQuestion?: string
  error?: string
}

export const DEFAULT_SETTINGS: AppSettings = {
  mode: "accuracy",
  theme: "dark",
  locale: "uk",
  antiDetection: true,
  examMode: false,
  autoSolve: false,
  apiKeys: [],
  minDelay: 500,
  maxDelay: 2000
}

export const AI_MODELS: AIModelConfig[] = [
  {
    id: "grok",
    name: "Grok (xAI)",
    provider: "xai",
    apiKeyName: "GROK_API_KEY",
    endpoint: "https://api.x.ai/v1/chat/completions",
    model: "grok-3-mini",
    enabled: true
  },
  {
    id: "gemini",
    name: "Gemini (Google)",
    provider: "google",
    apiKeyName: "GEMINI_API_KEY",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models",
    model: "gemini-2.0-flash",
    enabled: true
  },
  {
    id: "gpt-4o",
    name: "GPT-4o (OpenAI)",
    provider: "openai",
    apiKeyName: "OPENAI_API_KEY",
    endpoint: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o",
    enabled: true
  },
  {
    id: "claude",
    name: "Claude (Anthropic)",
    provider: "anthropic",
    apiKeyName: "CLAUDE_API_KEY",
    endpoint: "https://api.anthropic.com/v1/messages",
    model: "claude-sonnet-4-20250514",
    enabled: true
  }
]
