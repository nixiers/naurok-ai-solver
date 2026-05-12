---
name: testing-naurok-solver
description: Test the Naurok AI Solver Chrome extension end-to-end. Use when verifying UI, AI solving, answer highlighting, or new provider changes.
---

# Testing Naurok AI Solver

## Prerequisites

1. Build the extension: `cd /home/ubuntu/repos/naurok-ai-solver && pnpm build`
2. Load in Chrome: chrome://extensions → Developer mode → Load unpacked → select `build/chrome-mv3-prod/`
3. Verify no "Errors" badge on extension card

## Devin Secrets Needed

- `GROQ_API_KEY` — Groq API key (format: `gsk_...`), get from https://console.groq.com/keys
- Optionally: `GEMINI_API_KEY`, `OPENAI_API_KEY`, `GROK_API_KEY` for multi-model testing

## Test Page

Use: `https://naurok.com.ua/test/struktura-html-dokumenta-osnovni-tegi-30043.html`
- 12 multiple-choice questions about HTML basics
- Preview page (not testing mode) — questions and answers visible in DOM
- Extension's floating panel appears in top-right corner

## Testing Workflow

### 1. Add API Key
- Click extension icon → Settings tab
- Select provider from dropdown (Groq is first)
- Paste API key → click "+"
- Verify key card appears with masked preview and blue toggle

### 2. Solve All
- Switch to Solver tab
- Set mode to "Fast" for single-model testing
- Turn off Anti-Detection for faster results during testing
- Navigate to test page
- Click "Solve All" in floating panel
- Wait for progress bar to reach 12/12

### 3. Verify Results
- Scroll through all 12 questions
- Each correct answer should have green highlight with 100% badge
- Panel should show "Solved: 12/12" with answer list

## Provider Notes

| Provider | Key prefix | Endpoint | Compatible API |
|----------|-----------|----------|----------------|
| Groq | `gsk_` | api.groq.com/openai/v1 | OpenAI-compatible |
| Grok (xAI) | `xai-` | api.x.ai/v1 | OpenAI-compatible |
| Gemini | `AIza` | generativelanguage.googleapis.com | Google-specific |
| OpenAI | `sk-` | api.openai.com/v1 | OpenAI native |

**Important**: Groq and Grok are different services. Groq (api.groq.com) uses Llama models. Grok (api.x.ai) is xAI's model.

## Common Issues

- **Gemini 429 errors**: Free tier quota exhaustion. Need billing enabled or switch to Groq.
- **"Errors" badge on extension card**: Usually from previous API failures. Reload extension to clear.
- **Extension not injecting on naurok pages**: Make sure `host_permissions` includes `https://naurok.com.ua/*` in manifest.
- **Popup closes when clicking outside**: This is normal Chrome behavior. Use the floating panel on naurok pages for persistent UI.

## Build & Reload

```bash
cd /home/ubuntu/repos/naurok-ai-solver
pnpm build
# Then in Chrome: chrome://extensions → click reload icon on extension card
```

## Recording Tips

- Maximize browser before recording
- Use annotate_recording with test_start/assertion types
- Key screenshots: Settings with key added, Solve All in progress, green highlights on answers
- Scroll through all 12 questions to capture all highlights
