/**
 * Envío del formulario de contacto (ver LEADS_INTEGRATION.md en la raíz).
 *
 * Una sola llamada a la Edge Function `send-contact-arquelia`, que manda el
 * email al equipo Y guarda la solicitud en la bandeja "Solicitudes" del admin
 * panel (tabla `lead`). La web no escribe nunca directamente en Supabase: la
 * tabla no tiene política de insert para la clave pública, a propósito.
 *
 * Supabase Edge Function, no una función de Vercel: ver el motivo en
 * supabase/functions/track-arquelia/index.ts. La anon key es pública a
 * propósito (la función se despliega con --no-verify-jwt para aceptar envíos
 * sin sesión); las claves que de verdad importan viven sólo en el servidor.
 */
import type { CTAFormData } from '../types/ctaForm'

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-contact-arquelia`
const COMPANY_ID = import.meta.env.VITE_ARQUELIA_COMPANY_ID as string | undefined

export type LeadResult = { ok: true } | { ok: false; reason: 'invalid' | 'network' | 'server' }

/**
 * `data.company_website` es el campo trampa anti-bots: tiene que llegar vacío.
 * `source_path` y `source_campaign` se rellenan solos con la URL actual.
 */
export async function submitLead(data: CTAFormData): Promise<LeadResult> {
  if (!COMPANY_ID) {
    // Sin company_id el email sigue saliendo, pero la solicitud no llegaría a
    // la bandeja: mejor avisar en consola que fallar en silencio.
    console.warn('[leads] VITE_ARQUELIA_COMPANY_ID no está configurado — no se guardará en la bandeja')
  }

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        ...data,
        company_id: COMPANY_ID,
        source_path: window.location.pathname,
        source_campaign: new URLSearchParams(window.location.search).get('utm_campaign') ?? undefined,
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (res.ok) {
      // Avisa a la analítica (lib/analytics.ts) de que ha habido un envío.
      // Se hace AQUÍ, tras la respuesta del servidor, y no en el clic del
      // botón: así el número de la analítica es el de solicitudes que de
      // verdad llegaron, y no el de intentos. Es un evento del DOM para que
      // este fichero no dependa de analytics.ts.
      window.dispatchEvent(new CustomEvent('moira:lead-sent'))
      return { ok: true }
    }
    return { ok: false, reason: res.status === 400 ? 'invalid' : 'server' }
  } catch {
    return { ok: false, reason: 'network' }
  }
}
