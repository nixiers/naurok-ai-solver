import type {
  AIModel,
  AIModelConfig,
  AIResponse,
  ApiKeyConfig,
  ConsensusResult,
  ParsedQuestion,
  SolveMode,
  VotingDetail
} from "./types"
import { AI_MODELS } from "./types"

function buildPrompt(question: ParsedQuestion): string {
  let prompt = `Ти — експерт з українських шкільних та університетських тестів. Відповідай ТОЧНО та ПРАВИЛЬНО.

Питання: ${question.text}
`

  if (question.options.length > 0) {
    prompt += "\nВаріанти відповідей:\n"
    question.options.forEach((opt, i) => {
      prompt += `${i}: ${opt.text}\n`
    })
    prompt += `\nІНСТРУКЦІЯ:
1. Уважно прочитай питання та всі варіанти відповідей
2. Проаналізуй кожен варіант — який з них є правильним і чому
3. Подумай крок за кроком (think step by step)
4. Відповідай JSON:

{"reasoning": "<коротке пояснення чому саме цей варіант правильний>", "answer_index": <номер правильного варіанту (починаючи з 0)>, "answer_text": "<точний текст правильного варіанту>", "confidence": <0.0-1.0>}

Правила:
- answer_index — індекс правильного варіанту (0-based, тобто перший варіант = 0)
- answer_text — ТОЧНИЙ текст варіанту, скопійований з опцій вище
- confidence — твоя впевненість від 0.0 до 1.0
- reasoning — КОРОТКЕ пояснення (1-2 речення) чому цей варіант правильний
- Відповідай ТІЛЬКИ JSON, без додаткового тексту`
  } else {
    prompt += `\nЦе відкрите питання. Відповідай JSON:
{"reasoning": "<коротке пояснення>", "answer_text": "<твоя відповідь>", "confidence": <0.0-1.0>}

Правила:
- answer_text — коротка, точна відповідь
- confidence — твоя впевненість від 0.0 до 1.0
- Відповідай ТІЛЬКИ JSON, без додаткового тексту`
  }

  return prompt
}

function parseAIResponseText(
  text: string,
  question: ParsedQuestion
): { answerIndex: number; answerText: string; confidence: number } {
  // Strip <think>...</think> tags from reasoning models (Qwen3, DeepSeek-R1)
  const cleanText = text.replace(/<think>[\s\S]*?<\/think>/g, "").trim()
  const textToSearch = cleanText.length > 0 ? cleanText : text
  const startIdx = textToSearch.indexOf("{")
  const endIdx = textToSearch.lastIndexOf("}")
  if (startIdx !== -1 && endIdx > startIdx) {
    try {
      const parsed = JSON.parse(textToSearch.substring(startIdx, endIdx + 1))
      const answerIndex = parsed.answer_index ?? -1
      const answerText = parsed.answer_text ?? ""
      const confidence = Math.min(1, Math.max(0, parsed.confidence ?? 0.5))

      if (
        answerIndex >= 0 &&
        answerIndex < question.options.length &&
        answerText !== question.options[answerIndex]?.text
      ) {
        const matchByText = question.options.findIndex(
          (o) => o.text.toLowerCase().trim() === answerText.toLowerCase().trim()
        )
        if (matchByText !== -1) {
          return {
            answerIndex: matchByText,
            answerText: question.options[matchByText].text,
            confidence
          }
        }
      }

      return { answerIndex, answerText, confidence }
    } catch {
      // Fall through to text parsing
    }
  }

  const numberMatch = textToSearch.match(/^(\d+)/)
  if (numberMatch) {
    const idx = parseInt(numberMatch[1], 10)
    if (idx >= 0 && idx < question.options.length) {
      return {
        answerIndex: idx,
        answerText: question.options[idx].text,
        confidence: 0.5
      }
    }
  }

  if (question.options.length > 0) {
    const lowerText = textToSearch.toLowerCase().trim()
    for (let i = 0; i < question.options.length; i++) {
      if (lowerText.includes(question.options[i].text.toLowerCase())) {
        return {
          answerIndex: i,
          answerText: question.options[i].text,
          confidence: 0.5
        }
      }
    }
  }

  return { answerIndex: -1, answerText: text.trim(), confidence: 0.3 }
}

async function callOpenAICompatible(
  config: AIModelConfig,
  apiKey: string,
  prompt: string
): Promise<string> {
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: "system",
          content:
            "Ти — експерт з українських шкільних предметів. Відповідай ТІЛЬКИ у форматі JSON. Думай крок за кроком перед відповіддю. Будь максимально точним."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0,
      max_tokens: 500
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `${config.name} API error: ${response.status} - ${errorText}`
    )
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ""
}

async function callGemini(
  config: AIModelConfig,
  apiKey: string,
  prompt: string
): Promise<string> {
  const url = `${config.endpoint}/${config.model}:generateContent?key=${apiKey}`
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 500
      }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ""
}

async function callAnthropic(
  config: AIModelConfig,
  apiKey: string,
  prompt: string
): Promise<string> {
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
      system:
        "Ти — експерт з українських шкільних предметів. Відповідай ТІЛЬКИ у форматі JSON. Думай крок за кроком перед відповіддю. Будь максимально точним.",
      temperature: 0
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Claude API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text || ""
}

async function callModel(
  config: AIModelConfig,
  apiKey: string,
  prompt: string
): Promise<string> {
  switch (config.provider) {
    case "google":
      return callGemini(config, apiKey, prompt)
    case "anthropic":
      return callAnthropic(config, apiKey, prompt)
    default:
      return callOpenAICompatible(config, apiKey, prompt)
  }
}

async function queryModel(
  modelId: AIModel,
  question: ParsedQuestion,
  apiKeys: ApiKeyConfig[]
): Promise<AIResponse> {
  const config = AI_MODELS.find((m) => m.id === modelId)
  if (!config) throw new Error(`Unknown model: ${modelId}`)

  const keyConfig = apiKeys.find((k) => k.model === modelId && k.enabled)
  if (!keyConfig) throw new Error(`No API key for ${config.name}`)

  const prompt = buildPrompt(question)
  const startTime = Date.now()

  const responseText = await callModel(config, keyConfig.key, prompt)
  const parsed = parseAIResponseText(responseText, question)

  return {
    model: modelId,
    answer: parsed.answerText,
    answerIndex: parsed.answerIndex,
    confidence: parsed.confidence,
    reasoning: responseText,
    responseTime: Date.now() - startTime
  }
}

function buildConsensus(responses: AIResponse[]): ConsensusResult {
  if (responses.length === 0) {
    return {
      bestAnswer: "",
      bestAnswerIndex: -1,
      confidence: 0,
      responses: [],
      votingDetails: []
    }
  }

  if (responses.length === 1) {
    const r = responses[0]
    return {
      bestAnswer: r.answer,
      bestAnswerIndex: r.answerIndex,
      confidence: r.confidence,
      responses,
      votingDetails: [
        {
          answer: r.answer,
          answerIndex: r.answerIndex,
          votes: 1,
          avgConfidence: r.confidence,
          models: [r.model]
        }
      ]
    }
  }

  const voteMap = new Map<
    string,
    { answer: string; answerIndex: number; models: AIModel[]; confidences: number[] }
  >()

  for (const r of responses) {
    const key =
      r.answerIndex >= 0
        ? `idx:${r.answerIndex}`
        : `text:${r.answer.toLowerCase().trim()}`
    const existing = voteMap.get(key)
    if (existing) {
      existing.models.push(r.model)
      existing.confidences.push(r.confidence)
    } else {
      voteMap.set(key, {
        answer: r.answer,
        answerIndex: r.answerIndex,
        models: [r.model],
        confidences: [r.confidence]
      })
    }
  }

  const votingDetails: VotingDetail[] = Array.from(voteMap.values())
    .map((data) => ({
      answer: data.answer,
      answerIndex: data.answerIndex,
      votes: data.models.length,
      avgConfidence:
        data.confidences.reduce((a, b) => a + b, 0) / data.confidences.length,
      models: data.models
    }))
    .sort((a, b) => {
      if (b.votes !== a.votes) return b.votes - a.votes
      return b.avgConfidence - a.avgConfidence
    })

  const best = votingDetails[0]
  const totalVotes = responses.length
  const voteRatio = best.votes / totalVotes
  const consensusConfidence = Math.min(
    1,
    best.avgConfidence * (0.5 + 0.5 * voteRatio)
  )

  return {
    bestAnswer: best.answer,
    bestAnswerIndex: best.answerIndex,
    confidence: consensusConfidence,
    responses,
    votingDetails
  }
}

function getModelsForMode(
  mode: SolveMode,
  apiKeys: ApiKeyConfig[]
): AIModel[] {
  const available = apiKeys
    .filter((k) => k.enabled && k.key.length > 0)
    .map((k) => k.model)

  switch (mode) {
    case "grok_only":
      return available.includes("grok") ? ["grok"] : available.slice(0, 1)
    case "fast":
      return available.slice(0, 1)
    case "accuracy":
      return available
    default:
      return available
  }
}

const GROQ_CONSENSUS_MODELS = [
  "qwen/qwen3-32b",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "llama-3.3-70b-versatile"
]

async function queryGroqWithModel(
  modelName: string,
  question: ParsedQuestion,
  apiKey: string
): Promise<AIResponse> {
  const prompt = buildPrompt(question)
  const startTime = Date.now()

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: "system",
            content:
              "Ти — експерт з українських шкільних предметів. Відповідай ТІЛЬКИ у форматі JSON. Думай крок за кроком перед відповіддю. Будь максимально точним."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0,
        max_tokens: 2048
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Groq ${modelName} error: ${response.status}`)
  }

  const data = await response.json()
  const responseText = data.choices?.[0]?.message?.content || ""
  const parsed = parseAIResponseText(responseText, question)

  return {
    model: "groq" as AIModel,
    answer: parsed.answerText,
    answerIndex: parsed.answerIndex,
    confidence: parsed.confidence,
    reasoning: `[${modelName}] ${responseText}`,
    responseTime: Date.now() - startTime
  }
}

export async function solveQuestion(
  question: ParsedQuestion,
  apiKeys: ApiKeyConfig[],
  mode: SolveMode
): Promise<ConsensusResult> {
  const models = getModelsForMode(mode, apiKeys)

  if (models.length === 0) {
    throw new Error("No AI models configured. Add API keys in settings.")
  }

  const groqKey = apiKeys.find(
    (k) => k.model === "groq" && k.enabled && k.key.length > 0
  )
  const useGroqConsensus =
    groqKey && (mode === "accuracy" || models.length === 1)

  const queryPromises: Promise<AIResponse>[] = []

  if (useGroqConsensus) {
    const groqModels =
      mode === "accuracy"
        ? GROQ_CONSENSUS_MODELS
        : GROQ_CONSENSUS_MODELS.slice(0, 1)
    for (const modelName of groqModels) {
      queryPromises.push(
        queryGroqWithModel(modelName, question, groqKey.key)
      )
    }
    const otherModels = models.filter((m) => m !== "groq")
    for (const modelId of otherModels) {
      queryPromises.push(queryModel(modelId, question, apiKeys))
    }
  } else {
    for (const modelId of models) {
      queryPromises.push(queryModel(modelId, question, apiKeys))
    }
  }

  const results = await Promise.allSettled(queryPromises)

  const successfulResponses: AIResponse[] = []
  for (const result of results) {
    if (result.status === "fulfilled") {
      successfulResponses.push(result.value)
    }
  }

  if (successfulResponses.length === 0) {
    const errors = results
      .filter(
        (r): r is PromiseRejectedResult => r.status === "rejected"
      )
      .map((r) => r.reason?.message || "Unknown error")
    throw new Error(`All models failed: ${errors.join("; ")}`)
  }

  return buildConsensus(successfulResponses)
}

export { buildPrompt, getModelsForMode }
