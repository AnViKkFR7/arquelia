import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const SITE_URL = 'https://arquelia.es'

// Ruta → clave de `nav.*` para el nombre del segundo nivel de la miga de
// pan. La home no lleva entrada: no hay "Inicio > Inicio".
const BREADCRUMB_KEYS: Record<string, string> = {
  '/servicios': 'nav.services',
  '/proyectos': 'nav.projects',
  '/sobre-nosotros': 'nav.about',
  '/contacto': 'nav.contact',
}

/**
 * BreadcrumbList (JSON-LD) por ruta — ayuda a que Google muestre la ruta
 * de navegación en el resultado de búsqueda en vez de la URL pelada. Sólo
 * para páginas estáticas conocidas: el detalle de un proyecto
 * (`/proyectos/:id`) llevaría el nombre real del proyecto como tercer
 * nivel, que este componente no tiene sin que `ProjectDetailPage` se lo
 * pase — se deja fuera antes que emitir una miga genérica o inexacta.
 * No renderiza nada; vive una vez en `Layout`, por encima de todas las rutas.
 */
export function BreadcrumbSchema() {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const key = BREADCRUMB_KEYS[pathname]

  useEffect(() => {
    if (!key) return

    const data = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('nav.home'), item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: t(key), item: `${SITE_URL}${pathname}` },
      ],
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [key, pathname, t])

  return null
}
