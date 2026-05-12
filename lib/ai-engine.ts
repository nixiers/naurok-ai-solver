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
  let prompt = `You are an expert at answering Ukrainian school/university test questions. Answer PRECISELY and CORRECTLY.

Question: ${question.text}
`

  if (question.options.length > 0) {
    prompt += "\nAnswer options:\n"
    question.options.forEach((opt, i) => {
      prompt += `${i}: ${opt.text}\n`
    })
    prompt += `\nRespond with ONLY a JSON object in this exact format:
{"answer_index": <number>, "answer_text": "<exact text of correct option>", "confidence": <0.0-1.0>}

Rules:
- answer_index must be the 0-based index of the correct option
- answer_text must be the exact text from the options
- confidence is your certainty from 0.0 to 1.0
- Do NOT add any explanation, only the JSON`
  } else {
    prompt += `\nThis is an open-ended question. Respond with ONLY a JSON object:
{"answer_text": "<your answer>", "confidence": <0.0-1.0>}

Rules:
- answer_text should be a short, precise answer
- confidence is your certainty from 0.0 to 1.0
- Do NOT add any explanation, only the JSON`
  }

  return prompt
}

function parseAIResponseText(
  text: string,
  question: ParsedQuestion
): { answerIndex: number; answerText: string; confidence: number } {
  const jsonMatch = text.match(/\{[\s\S]*?\}/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        answerIndex: parsed.answer_index ?? -1,
        answerText: parsed.answer_text ?? "",
        confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0.5))
      }
    } catch {
      // Fall through to text parsing
    }
  }

  const numberMatch = text.match(/^(\d+)/)
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
    const cleanText = text.toLowerCase().trim()
    for (let i = 0; i < question.options.length; i++) {
      if (cleanText.includes(question.options[i].text.toLowerCase())) {
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
            "You are an expert test solver. Respond only with the requested JSON format. Be precise and accurate."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 200
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
        temperature: 0.1,
        maxOutputTokens: 200
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
        "You are an expert test solver. Respond only with the requested JSON format. Be precise and accurate.",
      temperature: 0.1
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

export async function solveQuestion(
  question: ParsedQuestion,
  apiKeys: ApiKeyConfig[],
  mode: SolveMode
): Promise<ConsensusResult> {
  const models = getModelsForMode(mode, apiKeys)

  if (models.length === 0) {
    throw new Error("No AI models configured. Add API keys in settings.")
  }

  const results = await Promise.allSettled(
    models.map((modelId) => queryModel(modelId, question, apiKeys))
  )

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
