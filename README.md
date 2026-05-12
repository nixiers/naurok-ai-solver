# Naurok AI Solver

AI-powered Chrome extension for automatically solving tests on [naurok.com.ua](https://naurok.com.ua) using multi-model consensus voting.

## Features

- **Multi-Model AI**: Supports Grok (xAI), Gemini (Google), GPT-4o (OpenAI), Claude (Anthropic)
- **Consensus Voting**: Queries multiple AI models in parallel, selects the best answer by vote
- **Auto-Detection**: Scans test pages for questions (multiple choice, text input, true/false, matching)
- **Answer Highlighting**: Highlights correct answers in green with confidence badges
- **Anti-Detection**: Human-like delays, random mouse movements, scroll simulation
- **Localization**: Ukrainian, Russian, English
- **Modern UI**: Glassmorphism design, dark mode, floating panel

## Modes

| Mode | Description |
|------|-------------|
| Max Accuracy | All configured models + consensus voting |
| Fast | Single fastest model |
| Grok Only | Uses only Grok (xAI) |

## Hotkeys

- `Alt+S` — Solve all questions
- `Alt+Q` — Solve current question
- `Alt+N` — Toggle panel visibility

## Setup

```bash
pnpm install
pnpm dev      # Development mode with HMR
pnpm build    # Production build
pnpm package  # Create .crx package
```

### Load in Chrome

1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `build/chrome-mv3-dev/` (dev) or `build/chrome-mv3-prod/` (prod) directory

### Configure API Keys

1. Click the extension icon in the toolbar
2. Go to **Settings** tab
3. Add your API keys for the AI models you want to use

## Tech Stack

- [Plasmo](https://plasmo.com/) — Chrome Extension framework (Manifest V3)
- [React 18](https://react.dev/) — UI components
- [TypeScript](https://www.typescriptlang.org/) — Type safety
- Chrome Storage API — Settings & history persistence

## Architecture

```
popup.tsx          → Extension popup (settings, controls)
background.ts      → Service worker (AI API calls)
contents/          → Content scripts (injected into naurok pages)
lib/               → Core logic (parser, AI engine, highlighter, anti-detect)
locales/           → i18n translations (UK/RU/EN)
styles/            → CSS styles (glassmorphism design)
```

## Disclaimer

This tool is intended for educational purposes only.
