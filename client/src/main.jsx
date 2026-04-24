import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import locales from './locales.json'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: locales.en },
    de: { translation: locales.de }
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
