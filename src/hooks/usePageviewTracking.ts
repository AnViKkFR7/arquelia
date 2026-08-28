import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageview } from '../lib/gtm'

/**
 * Registra cada cambio de ruta como un `page_view` en GTM. La primera carga
 * de la página no pasa por aquí: si GTM ya está cargado en el montaje es
 * porque el usuario había aceptado en una visita anterior, y ese primer
 * `page_view` lo cubre el propio evento `gtm.js` con el que arranca el
 * contenedor (ver `loadGTM`); aquí sólo interesan las navegaciones
 * posteriores, que al ser una SPA no disparan una petición nueva por sí solas.
 */
export function usePageviewTracking() {
  const { pathname, search } = useLocation()
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    trackPageview(pathname + search)
  }, [pathname, search])
}
