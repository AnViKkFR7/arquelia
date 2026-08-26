import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const setMeta = (selector: string, attr: string, value: string) => {
  document.head.querySelector(selector)?.setAttribute(attr, value)
}

/**
 * Mantiene `<title>`, las meta de descripción/Open Graph y `lang` del
 * `<html>` en el idioma activo. No renderiza nada — vive una vez en
 * `Layout`, por encima de todas las rutas.
 */
export function DocumentMeta() {
  const { t, i18n } = useTranslation()

  useEffect(() => {
    const lang = i18n.language
    document.documentElement.lang = lang.startsWith('ca') ? 'ca' : lang.startsWith('en') ? 'en' : 'es'
    document.title = t('meta.title')
    setMeta('meta[name="description"]', 'content', t('meta.description'))
    setMeta('meta[property="og:title"]', 'content', t('meta.ogTitle'))
    setMeta('meta[property="og:description"]', 'content', t('meta.ogDescription'))
    setMeta('meta[property="og:locale"]', 'content', t('meta.locale'))
  }, [t, i18n.language])

  return null
}
