import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import es from './locales/es.json'
import en from './locales/en.json'
import ca from './locales/ca.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      en: { translation: en },
      ca: { translation: ca },
    },
    fallbackLng: 'es',
    supportedLngs: ['es', 'en', 'ca'],
    interpolation: { escapeValue: false },
    // Sin 'navigator': detectar el idioma del navegador sonaba bien para
    // visitantes reales, pero Google indexa una única versión de cada URL
    // — la que su rastreador vio al renderizarla — y el idioma que reporta
    // el navegador de Google no tiene por qué ser español, así que el
    // título que salía en el buscador dependía de lo que detectara el
    // rastreador, no de quién buscara. Sin una señal de idioma/geolocalización
    // fiable que sí podamos implementar (eso exigiría contenido servido en
    // el servidor según el visitante, algo que este sitio no hace al ser
    // una SPA sin servidor propio), el idioma por defecto es siempre
    // español — pedido explícito del cliente ante esa limitación. Quien
    // cambie de idioma a mano lo sigue viendo en su próxima visita gracias
    // a `caches: ['localStorage']`.
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
    },
  })

export default i18n
