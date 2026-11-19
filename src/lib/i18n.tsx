'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Language = 'en' | 'ua'

const translations = {
  en: {
    ranges: 'Ranges',
    play: 'Play',
    gameSetup: 'Game setup',
    format: 'Format',
    players: 'Players',
    yourSeat: 'Your seat',
    stack: 'Stack',
    rangeType: 'Range Type',
    openSize: 'Open size',
    gameMode: 'Game mode',
    cash: 'Cash',
    mtt: 'MTT',
    random: 'Random',
    preflop: 'Preflop',
    fullHands: 'Full hands',
  },
  ua: {
    ranges: 'Діапазони',
    play: 'Грати',
    gameSetup: 'Налаштування гри',
    format: 'Формат',
    players: 'Кількість гравців',
    yourSeat: 'Ваша позиція',
    stack: 'Стек',
    rangeType: 'Тип діапазонів',
    openSize: 'Розмір відкриття',
    gameMode: 'Режим гри',
    cash: 'Кеш',
    mtt: 'МТТ',
    random: 'Випадково',
    preflop: 'Префлоп',
    fullHands: 'Повні роздачі',
  },
} as const

type TranslationKey = keyof typeof translations.en

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    const saved = window.localStorage.getItem('konor-language')
    if (saved === 'en' || saved === 'ua') setLanguageState(saved)
  }, [])

  function setLanguage(next: Language) {
    setLanguageState(next)
    window.localStorage.setItem('konor-language', next)
    document.documentElement.lang = next === 'ua' ? 'uk' : 'en'
  }

  const value: LanguageContextValue = {
    language,
    setLanguage,
    t: (key) => translations[language][key],
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}
