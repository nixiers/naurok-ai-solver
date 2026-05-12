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

## Установка (простой способ)

1. **Скачай** ZIP из [GitHub Releases](https://github.com/nixiers/naurok-ai-solver/releases/latest)
2. **Распакуй** ZIP в любую папку
3. Открой `chrome://extensions` → включи **Developer mode** → нажми **Load unpacked** → выбери распакованную папку
4. Кликни иконку расширения → **Settings** → выбери **Groq** → вставь API ключ → **+**
5. Бесплатный Groq ключ: https://console.groq.com/keys

## Установка (для разработчиков)

```bash
git clone https://github.com/nixiers/naurok-ai-solver.git
cd naurok-ai-solver
pnpm install
pnpm build
```

Загрузи `build/chrome-mv3-prod/` в Chrome → `chrome://extensions` → **Load unpacked**

### Настройка API ключей

1. Кликни иконку расширения в тулбаре
2. Перейди на вкладку **Settings**
3. Добавь API ключи для нужных моделей (Groq рекомендуется)

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
