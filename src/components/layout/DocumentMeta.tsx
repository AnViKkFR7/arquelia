import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const SITE_URL = 'https://arquelia.es'

// Ruta → clave dentro de `meta.pages` en los locales. La home usa las
// claves `meta.title`/`meta.description` de siempre, sin entrada aquí.
const PAGE_META_KEYS: Record<string, string> = {
  '/servicios': 'services',
  '/proyectos': 'projects',
  '/sobre-nosotros': 'about',
  '/contacto': 'contact',
}

const STATIC_ROUTES = new Set(['/', '/servicios', '/proyectos', '/sobre-nosotros', '/contacto', '/aviso-legal', '/cookies', '/privacidad'])

// Cualquier ruta que no sea una de las de arriba ni un detalle de proyecto
// (`/proyectos/:id`) ha caído en el `path="*"` de `NotFoundPage` — sin
// backend propio no hay forma de devolver un 404 HTTP de verdad (el
// rewrite de SPA en `vercel.json` sirve `index.html` con 200 para
// cualquier ruta), así que se marca `noindex` como mitigación: que Google
// al menos no la trate como contenido real aunque la respuesta sea 200.
const isKnownRoute = (pathname: string) => STATIC_ROUTES.has(pathname) || pathname.startsWith('/proyectos/')

const setMeta = (selector: string, attr: string, value: string) => {
  document.head.querySelector(selector)?.setAttribute(attr, value)
}

// A diferencia de `setMeta`, crea la etiqueta si `index.html` no la trae de
// serie — hace falta para `rel="canonical"`, que no tiene un valor por
// defecto sensato fuera de la portada.
const upsertLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    document.head.appendChild(el)
  }
  el.href = href
}

/**
 * Mantiene `<title>`, las meta de descripción/Open Graph, el canónico y
 * `lang` del `<html>` según la ruta y el idioma activos. No renderiza nada
 * — vive una vez en `Layout`, por encima de todas las rutas.
 */
export function DocumentMeta() {
  const { t, i18n } = useTranslation()
  const { pathname } = useLocation()

  useEffect(() => {
    const lang = i18n.language
    document.documentElement.lang = lang.startsWith('ca') ? 'ca' : lang.startsWith('en') ? 'en' : 'es'

    const pageKey = PAGE_META_KEYS[pathname]
    // Sin entrada específica para esta ruta (home, páginas legales, el
    // detalle de un proyecto...) se cae a la meta genérica del sitio en vez
    // de dejar el `<title>` de la ruta anterior colgando.
    const title = pageKey ? t(`meta.pages.${pageKey}.title`) : t('meta.title')
    const description = pageKey ? t(`meta.pages.${pageKey}.description`) : t('meta.description')

    document.title = title
    setMeta('meta[name="description"]', 'content', description)
    setMeta('meta[property="og:title"]', 'content', title)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[property="og:locale"]', 'content', t('meta.locale'))

    const url = `${SITE_URL}${pathname === '/' ? '' : pathname}`
    upsertLink('canonical', url)
    setMeta('meta[property="og:url"]', 'content', url)

    setMeta('meta[name="robots"]', 'content', isKnownRoute(pathname) ? 'index, follow' : 'noindex, follow')
  }, [t, i18n.language, pathname])

  return null
}
