/**
 * Google Tag Manager, cargado sólo si el usuario da su consentimiento.
 *
 * A propósito no se inserta el snippet de GTM en `index.html` ni al arrancar
 * la app: mientras no hay consentimiento expreso (ver `CookieConsent.tsx`),
 * no debe salir ni una sola petición a googletagmanager.com. Así no hace
 * falta jugar con el "Consent Mode" de Google para bloquear cookies
 * mientras tanto — sencillamente no hay nada que cargar hasta que el
 * usuario acepta.
 */
const GTM_ID = import.meta.env.VITE_GTM_ID as string | undefined

declare global {
  interface Window {
    dataLayer: unknown[]
  }
}

let loaded = false

export function loadGTM() {
  if (loaded || !GTM_ID) return
  loaded = true

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`
  document.head.appendChild(script)
}

export function isGTMLoaded() {
  return loaded
}

/**
 * Cambio de página dentro de la SPA: al no haber recarga real, GTM no se
 * entera solo — cada navegación de react-router necesita este empujón.
 */
export function trackPageview(path: string) {
  if (!loaded) return
  window.dataLayer.push({ event: 'page_view', page_path: path })
}

/** Para eventos propios (clics en CTAs, envíos de formulario...). */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (!loaded) return
  window.dataLayer.push({ event: name, ...params })
}
