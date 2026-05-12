---
name: testing-naurok-solver
description: Test the Naurok AI Solver Chrome extension end-to-end. Use when verifying UI, content script injection, question scanning, or AI solving changes.
---

# Testing Naurok AI Solver

## Prerequisites

- Node.js + pnpm installed
- Chrome browser running

## Build

```bash
cd /home/ubuntu/repos/naurok-ai-solver
pnpm install
pnpm run build
```

Build output: `build/chrome-mv3-prod/`

Lint/typecheck: `pnpm run lint` (runs `tsc --noEmit`)

## Load Extension in Chrome

1. Navigate to `chrome://extensions`
2. Enable "Developer mode" toggle (top-right)
3. Click "Load unpacked" → select `build/chrome-mv3-prod/` directory
4. Verify extension card shows "Naurok AI Solver 0.0.1" with no errors badge
5. Pin the extension icon in the toolbar for easy popup access

## Test Pages

- **Preview page** (no login required): `https://naurok.com.ua/test/struktura-html-dokumenta-osnovni-tegi-30043.html` — has 12 questions with `.question-view-item` elements
- **Testing pages** require login: `https://naurok.com.ua/test/testing/*`
- Content script matches: `https://naurok.com.ua/*` and `https://naurok.ua/*`

## Key Test Flows

### 1. Popup UI
- Click extension icon → popup opens with dark glassmorphism theme
- Default locale is Ukrainian ("Розв'язати все", "Налаштування", "Історія")
- Three tabs: Solver (main), Settings, History
- Solver tab: mode selector (3 buttons), Solve All button, Anti-Detection toggle, Exam Mode toggle, hotkeys section
- Settings tab: API key management (add/remove/toggle), theme (Dark/Light/Auto), language (UK/RU/EN), anti-detection delays
- History tab: shows "No history yet" when empty

### 2. Floating Panel on Naurok Pages
- Navigate to a naurok test page → floating panel appears top-right
- Panel has: "Naurok AI" header with gradient text, mode selector, Solve All + Scan buttons
- Click "Scan" → question count badge appears (e.g., "12")
- Minimize (−) → panel collapses to FAB (bottom-right gradient button)
- Click FAB → panel restores with state preserved
- Close (×) → panel hidden entirely

### 3. API Key Management
- Settings tab → select model from dropdown → type key → click "+"
- Key card appears with model name, masked preview (last 6 chars), toggle, delete button
- Delete removes the card

### 4. Language Switching
- Settings tab → click language button (Українська/Русский/English)
- All labels across all tabs update immediately

### 5. Solve All (requires API keys)
- Without API keys: Solve All runs through all questions, shows progress spinner and counter, completes with "Done" status, button returns to normal
- With API keys: answers should be highlighted green with confidence % badges

## Devin Secrets Needed

To test actual AI solving, at least one API key is needed:
- `GROK_API_KEY` — xAI API key for Grok model
- `GEMINI_API_KEY` — Google AI API key for Gemini model
- `OPENAI_API_KEY` — OpenAI API key for GPT-4o
- `ANTHROPIC_API_KEY` — Anthropic API key for Claude

These are entered via the extension's Settings UI, not as environment variables.

## Common Issues

- **Plasmo entry file not found**: If you see "Unable to find any entry files", ensure `popup.tsx`, `background.ts`, and `contents/` are at the project root (not inside `src/`)
- **Service worker inactive**: This is normal — Chrome deactivates idle service workers. It activates when a message is sent.
- **Content script not injecting**: Make sure you're on a `naurok.com.ua` or `naurok.ua` domain. The extension won't inject on other domains.
