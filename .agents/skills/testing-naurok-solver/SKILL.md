---
name: testing-naurok-solver
description: Test the Naurok AI Solver Chrome extension end-to-end on naurok.com.ua. Use when verifying extension UI, AI solving, floating panel, or live testing page features.
---

# Testing Naurok AI Solver

## Prerequisites

1. Build the extension: `pnpm install && pnpm build`
2. Load in Chrome: `chrome://extensions` → Developer mode → Load unpacked → `build/chrome-mv3-prod/`
3. Add an API key via popup Settings tab (Groq recommended — fast and free tier available)

## Devin Secrets Needed

- `GROQ_API_KEY` — Groq API key for AI solving (get from https://console.groq.com)
- Alternative: Gemini, OpenAI, Anthropic, or xAI API keys

## Test Pages

- **Preview page (testable):** `https://naurok.com.ua/test/struktura-html-dokumenta-osnovni-tegi-30043.html` — 12 questions, all visible at once
- **Live testing page (may be blocked):** `/test/testing/*` — one question at a time, accessed via `/test/start/*`

## Known Issues

- **CAPTCHA on `/test/start/*`:** naurok.com.ua may show a CAPTCHA ("Перевірка безпеки...") that blocks access to live testing pages from cloud VMs or automated environments. This is bot detection and does not resolve programmatically. Workaround: test live page features manually on a real device, or use code review to verify parser selectors match the DOM.
- **Groq vs Grok:** These are different services. Groq (api.groq.com, `gsk_` keys) uses OpenAI-compatible API. Grok (api.x.ai) is xAI's model. The extension supports both.

## Testing Flow

### Preview Page (Regression)
1. Navigate to a preview test page (e.g., the 12-question HTML test above)
2. Verify floating panel injects with "Naurok AI" header and question count badge
3. Click "Solve All" → verify progress bar, green answer highlights, confidence badges
4. Spot-check 3+ answers for correctness and confidence >= 70%
5. Test minimize → icon appears, restore → state preserved

### Live Testing Page
1. Navigate to `/test/start/<id>` — if CAPTCHA blocks, mark as UNTESTED
2. If accessible: enter name, start test
3. Click "Solve All" → verify sequential solving (parse → solve → click → wait → next)
4. Verify auto-advancement after each answer
5. Verify test end detection

### Extension Popup
1. Open popup → Settings tab
2. Verify API key persists with masked preview and toggle
3. Verify theme switching (Dark/Light/Auto)
4. Verify language switching (UK/RU/EN)

## Tips

- Always check browser console for errors during solving — the extension logs API calls and parsing results
- The floating panel shows real-time progress (X/Y) during solving
- Mode buttons (Max Accuracy, Fast, Grok Only) change how many models are queried
- If API returns errors, check the console — common issues are rate limits (429) or invalid keys
- Preview pages are the most reliable for automated testing since they don't require CAPTCHA
