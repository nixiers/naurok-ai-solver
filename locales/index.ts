export type Locale = "uk" | "ru" | "en"

export interface Translations {
  appName: string
  solveAll: string
  solveQuestion: string
  settings: string
  history: string
  statistics: string
  apiKeys: string
  mode: string
  modeAccuracy: string
  modeFast: string
  modeGrokOnly: string
  confidence: string
  solving: string
  solved: string
  error: string
  noQuestions: string
  questionsFound: string
  answer: string
  answers: string
  correct: string
  export: string
  exportPdf: string
  exportJson: string
  theme: string
  themeDark: string
  themeLight: string
  themeAuto: string
  language: string
  antiDetection: string
  examMode: string
  examModeDesc: string
  addApiKey: string
  apiKeyPlaceholder: string
  save: string
  cancel: string
  delete: string
  reset: string
  modelStats: string
  accuracy: string
  avgTime: string
  totalSolved: string
  hotkeys: string
  hotkeysSolveAll: string
  hotkeysSolveOne: string
  hotkeysToggle: string
  disclaimer: string
  version: string
}

const uk: Translations = {
  appName: "Naurok AI Solver",
  solveAll: "Розв'язати все",
  solveQuestion: "Розв'язати питання",
  settings: "Налаштування",
  history: "Iсторiя",
  statistics: "Статистика",
  apiKeys: "API ключi",
  mode: "Режим",
  modeAccuracy: "Макс. точнiсть",
  modeFast: "Швидкий",
  modeGrokOnly: "Тiльки Grok",
  confidence: "Впевненiсть",
  solving: "Розв'язую...",
  solved: "Розв'язано",
  error: "Помилка",
  noQuestions: "Питань не знайдено",
  questionsFound: "Знайдено питань",
  answer: "Вiдповiдь",
  answers: "Вiдповiдi",
  correct: "Правильно",
  export: "Експорт",
  exportPdf: "Експорт PDF",
  exportJson: "Експорт JSON",
  theme: "Тема",
  themeDark: "Темна",
  themeLight: "Свiтла",
  themeAuto: "Авто",
  language: "Мова",
  antiDetection: "Антi-детект",
  examMode: "Режим iспиту",
  examModeDesc: "Приховує панель, розв'язує у фонi",
  addApiKey: "Додати API ключ",
  apiKeyPlaceholder: "Введiть API ключ...",
  save: "Зберегти",
  cancel: "Скасувати",
  delete: "Видалити",
  reset: "Скинути",
  modelStats: "Статистика моделей",
  accuracy: "Точнiсть",
  avgTime: "Сер. час",
  totalSolved: "Всього розв'язано",
  hotkeys: "Гарячi клавiшi",
  hotkeysSolveAll: "Розв'язати все",
  hotkeysSolveOne: "Розв'язати поточне",
  hotkeysToggle: "Показати/приховати",
  disclaimer: "Цей iнструмент призначений для навчання",
  version: "Версiя"
}

const ru: Translations = {
  appName: "Naurok AI Solver",
  solveAll: "Решить все",
  solveQuestion: "Решить вопрос",
  settings: "Настройки",
  history: "История",
  statistics: "Статистика",
  apiKeys: "API ключи",
  mode: "Режим",
  modeAccuracy: "Макс. точность",
  modeFast: "Быстрый",
  modeGrokOnly: "Только Grok",
  confidence: "Уверенность",
  solving: "Решаю...",
  solved: "Решено",
  error: "Ошибка",
  noQuestions: "Вопросов не найдено",
  questionsFound: "Найдено вопросов",
  answer: "Ответ",
  answers: "Ответы",
  correct: "Правильно",
  export: "Экспорт",
  exportPdf: "Экспорт PDF",
  exportJson: "Экспорт JSON",
  theme: "Тема",
  themeDark: "Темная",
  themeLight: "Светлая",
  themeAuto: "Авто",
  language: "Язык",
  antiDetection: "Анти-детект",
  examMode: "Режим экзамена",
  examModeDesc: "Скрывает панель, решает в фоне",
  addApiKey: "Добавить API ключ",
  apiKeyPlaceholder: "Введите API ключ...",
  save: "Сохранить",
  cancel: "Отмена",
  delete: "Удалить",
  reset: "Сбросить",
  modelStats: "Статистика моделей",
  accuracy: "Точность",
  avgTime: "Ср. время",
  totalSolved: "Всего решено",
  hotkeys: "Горячие клавиши",
  hotkeysSolveAll: "Решить все",
  hotkeysSolveOne: "Решить текущий",
  hotkeysToggle: "Показать/скрыть",
  disclaimer: "Этот инструмент предназначен для обучения",
  version: "Версия"
}

const en: Translations = {
  appName: "Naurok AI Solver",
  solveAll: "Solve All",
  solveQuestion: "Solve Question",
  settings: "Settings",
  history: "History",
  statistics: "Statistics",
  apiKeys: "API Keys",
  mode: "Mode",
  modeAccuracy: "Max Accuracy",
  modeFast: "Fast",
  modeGrokOnly: "Grok Only",
  confidence: "Confidence",
  solving: "Solving...",
  solved: "Solved",
  error: "Error",
  noQuestions: "No questions found",
  questionsFound: "Questions found",
  answer: "Answer",
  answers: "Answers",
  correct: "Correct",
  export: "Export",
  exportPdf: "Export PDF",
  exportJson: "Export JSON",
  theme: "Theme",
  themeDark: "Dark",
  themeLight: "Light",
  themeAuto: "Auto",
  language: "Language",
  antiDetection: "Anti-Detection",
  examMode: "Exam Mode",
  examModeDesc: "Hides panel, solves in background",
  addApiKey: "Add API Key",
  apiKeyPlaceholder: "Enter API key...",
  save: "Save",
  cancel: "Cancel",
  delete: "Delete",
  reset: "Reset",
  modelStats: "Model Statistics",
  accuracy: "Accuracy",
  avgTime: "Avg. time",
  totalSolved: "Total solved",
  hotkeys: "Hotkeys",
  hotkeysSolveAll: "Solve all",
  hotkeysSolveOne: "Solve current",
  hotkeysToggle: "Show/hide",
  disclaimer: "This tool is intended for educational purposes",
  version: "Version"
}

export const translations: Record<Locale, Translations> = { uk, ru, en }

export function t(locale: Locale): Translations {
  return translations[locale] || translations.uk
}
