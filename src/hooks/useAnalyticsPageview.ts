import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageview } from '../lib/analytics'

/**
 * Registra cada página vista en la analítica propia (ver
 * ANALYTICS_INTEGRATION.md), incluida la primera carga: a diferencia de
 * `usePageviewTracking` (GTM), aquí no hay un script externo que ya cubra
 * esa primera vista por su cuenta — si no se cuenta aquí, no la cuenta nadie.
 */
export function useAnalyticsPageview() {
  const { pathname } = useLocation()

  // Sólo la ruta, sin query: la analítica nunca guarda la URL con su query
  // (podría llevar datos personales) y de las UTM de la primera vista se
  // encarga `trackPageview` leyéndolas del navegador.
  useEffect(() => {
    trackPageview(pathname)
  }, [pathname])
}
