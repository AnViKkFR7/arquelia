/**
 * Analítica propia (ver ANALYTICS_INTEGRATION.md en la raíz del repo):
 * páginas vistas y clics en `[data-track-event]`, sin cookies ni
 * localStorage — por eso no necesita el aviso de consentimiento, a
 * diferencia de GTM/GA4 (ver `gtm.ts`).
 *
 * `VITE_ARQUELIA_COMPANY_ID` ya existía en este proyecto (la usa Supabase
 * para las tablas multi-tenant) — se reutiliza aquí en vez de introducir un
 * `VITE_COMPANY_ID` nuevo y redundante.
 */
const ENDPOINT = '/api/track'
const COMPANY_ID = import.meta.env.VITE_ARQUELIA_COMPANY_ID as string | undefined

// Un id aleatorio por PESTAÑA/SESIÓN, en memoria — no en localStorage ni en
// cookie. Se pierde al cerrar la pestaña a propósito: así no se accede a
// ningún almacenamiento del dispositivo y no hace falta consentimiento.
const sessionId = crypto.randomUUID()

type EventType = 'page_view' | 'cta_click'

function send(eventType: EventType, extra?: { path?: string; event_key?: string }) {
  if (!COMPANY_ID) {
    console.warn('[analytics] VITE_ARQUELIA_COMPANY_ID no está configurado — evento descartado')
    return
  }
  const body = JSON.stringify({
    company_id: COMPANY_ID,
    event_type: eventType,
    session_id: sessionId,
    ...extra,
  })
  // sendBeacon no bloquea la navegación ni se pierde si el usuario cambia
  // de página justo después del clic (a diferencia de un fetch normal).
  navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }))
}

export const trackPageview = (path: string) => send('page_view', { path })

// Auto-instrumentación: UN solo listener delegado en toda la app. Cualquier
// botón/link/CTA nuevo se mide con sólo añadirle el atributo HTML — sin
// escribir una función nueva por evento cada vez. La "clave" tiene que
// coincidir con un evento dado de alta (y activo) para esta empresa en el
// panel de admin — si no coincide, el backend lo descarta en silencio.
export function initAutoTracking() {
  document.addEventListener('click', (e) => {
    const target = e.target as Element | null
    const el = target?.closest?.('[data-track-event]')
    const key = el?.getAttribute('data-track-event')
    if (key) send('cta_click', { path: window.location.pathname, event_key: key })
  })
}
