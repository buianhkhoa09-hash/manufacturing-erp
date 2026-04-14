import { createContext, useContext, useState } from 'react'
import en from './en'
import de from './de'

const translations = { en, de }

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(
    () => localStorage.getItem('erp-lang') || 'en'
  )

  const switchLang = (l) => {
    setLang(l)
    localStorage.setItem('erp-lang', l)
  }

  const t = (key) => translations[lang][key] || key

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
