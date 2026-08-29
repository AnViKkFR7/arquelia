# Integración de analítica de tráfico — moira ordo

Este documento es **autocontenido**: pégalo en cualquier proyecto de web de
empresa que consuma el backend multi-tenant de moira ordo (Supabase
compartido) y, siguiendo los pasos de aquí, tendrás tráfico y clics medidos
sin depender de ningún otro archivo ni repositorio.

**Qué mide**: visitantes únicos, páginas vistas por ruta, país/ciudad,
tipo de dispositivo, y clics en cualquier botón/CTA que se marque a mano
(WhatsApp, "Reservar", enviar formulario, etc.), tantos como se quieran.

**Qué NO hace falta**: ni aviso de cookies, ni `localStorage`, ni ninguna
librería de terceros (nada de GTM/GA4). No se accede a ningún
almacenamiento del dispositivo del visitante — por eso no aplica el deber
de consentimiento de cookies (art. 22.2 LSSI-CE/ePrivacy).

Los resultados se ven en el panel de admin de moira ordo, pestaña
**"Analítica"**. El clic llega a Supabase al instante, pero el dashboard no
lee la tabla en crudo directamente: lee un resumen agregado por
empresa/día que se recalcula a las 10:00, 12:00, 14:00, 16:00 y 18:00 (hora
de Madrid) — no una sola vez de madrugada, así que los datos de hoy se van
viendo a lo largo del día, con un margen de un par de horas como mucho.
Para probar la integración sin esperar a la siguiente pasada, el propio
panel de admin tiene un botón **"Agregar ahora"** en esa misma pestaña que
recalcula el día de hoy al instante.

---

## 0. Requisitos previos

Antes de tocar código de este proyecto:

1. **La empresa ya debe existir** en la tabla `companies` de Supabase — se
   crea desde el panel de admin (`/profile` → Crear Compañía), no desde
   aquí. Necesitas su `id` (uuid).
2. **Tener a mano**, del mismo proyecto Supabase que ya usa el admin panel:
   - la URL del proyecto (`https://xxxxx.supabase.co`)
   - la **service role key** (Supabase → Settings → API → `service_role`,
     nunca la `anon` key para esto)
3. **El proyecto de esta web despliega en Vercel.** Si no es así, ver la
   nota "Otros hostings" al final del Paso 2 — el resto del documento
   asume Vercel porque la geolocalización sale gratis de sus cabeceras.

---

## 1. Variables de entorno

Configúralas en el proyecto Vercel de **esta web** (Settings → Environment
Variables), no en el admin panel:

| Variable | Prefijo público? | Valor |
|---|---|---|
| `SUPABASE_URL` | No — solo servidor | URL del proyecto Supabase compartido |
| `SUPABASE_SERVICE_ROLE_KEY` | **No, nunca** | Service role key de ese mismo proyecto |
| `VITE_COMPANY_ID` | Sí — pública, se sirve al navegador | `id` de esta empresa en `companies` |

> Si este proyecto no usa Vite (por ejemplo Next.js), sustituye
> `VITE_COMPANY_ID` por la convención de variables públicas de tu bundler
> (`NEXT_PUBLIC_COMPANY_ID` en Next.js) y ajusta la línea que la lee en el
> Paso 3.
>
> `SUPABASE_SERVICE_ROLE_KEY` da acceso total a la base de datos saltándose
> RLS. Solo debe existir como variable de entorno de servidor. Si alguna
> vez aparece en un archivo con prefijo `VITE_`/`NEXT_PUBLIC_`, el bundler
> la mete en el bundle del cliente y queda expuesta — no lo hagas nunca.

---

## 2. Endpoint de ingesta: `api/track.ts`

Crea este archivo tal cual, en `api/track.ts` (Vercel lo despliega como
Serverless Function automáticamente, sin configuración adicional):

```ts
// api/track.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ALLOWED_EVENT_TYPES = new Set(['page_view', 'cta_click'])

// Caché en memoria por invocación "caliente" de la función — evita
// consultar analytics_event_definitions en cada clic.
let definitionsCache: { keys: Set<string>; expiresAt: number } | null = null

async function activeEventKeys(companyId: string): Promise<Set<string>> {
  if (definitionsCache && definitionsCache.expiresAt > Date.now()) {
    return definitionsCache.keys
  }
  const { data } = await supabase
    .from('analytics_event_definitions')
    .select('key')
    .eq('company_id', companyId)
    .eq('is_active', true)
  const keys = new Set((data ?? []).map((d) => d.key as string))
  definitionsCache = { keys, expiresAt: Date.now() + 5 * 60 * 1000 }
  return keys
}

export default async function handler(req: Request) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  let body: { company_id?: string; event_type?: string; event_key?: string; path?: string; session_id?: string }
  try {
    body = await req.json()
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  const { company_id, event_type, event_key, path, session_id } = body
  if (!company_id || !event_type || !ALLOWED_EVENT_TYPES.has(event_type) || !session_id) {
    return new Response('Bad request', { status: 400 })
  }

  // company_id debe existir — evita inyectar tráfico a una empresa que no
  // sea la que corresponde a este despliegue.
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('id', company_id)
    .maybeSingle()
  if (!company) return new Response('Bad request', { status: 400 })

  // Un clic con event_key que la empresa no ha dado de alta (o desactivado
  // desde el admin) se descarta en silencio: nunca da error al visitante.
  if (event_type === 'cta_click') {
    if (!event_key) return new Response('Bad request', { status: 400 })
    const keys = await activeEventKeys(company_id)
    if (!keys.has(event_key)) return new Response(null, { status: 204 })
  }

  // Gratis en Vercel: geo ya resuelto por la CDN, sin llamar a ningún
  // servicio externo de geolocalización.
  const country = req.headers.get('x-vercel-ip-country') ?? null
  const region = req.headers.get('x-vercel-ip-country-region') ?? null
  const city = req.headers.get('x-vercel-ip-city') ?? null

  const ua = req.headers.get('user-agent') ?? ''
  const device = /mobile/i.test(ua) ? 'mobile' : /tablet|ipad/i.test(ua) ? 'tablet' : 'desktop'

  const { error } = await supabase.from('analytics_events').insert({
    company_id,
    event_type,
    event_key: event_type === 'cta_click' ? event_key : null,
    path,
    session_id,
    device,
    country,
    region,
    city,
  })

  if (error) return new Response('Error', { status: 500 })
  return new Response(null, { status: 204 })
}

export const config = { runtime: 'nodejs' }
```

**Otros hostings (no Vercel)**: el endpoint funciona igual en cualquier
runtime que acepte `Request`/`Response` estándar (Deno, Cloudflare Workers,
Next.js Route Handlers). Lo único que se pierde es la geolocalización
gratuita de las cabeceras `x-vercel-ip-*` — en ese caso, deja
`country`/`region`/`city` en `null` (se sigue midiendo todo lo demás) o
integra un servicio de geo-IP aparte.

---

## 3. Instrumentación cliente: `lib/analytics.ts`

Crea este archivo tal cual (ajusta la ruta a la convención de este
proyecto, p. ej. `src/lib/analytics.ts`):

```ts
// lib/analytics.ts
const ENDPOINT = '/api/track'
const COMPANY_ID = import.meta.env.VITE_COMPANY_ID
// Next.js: usar process.env.NEXT_PUBLIC_COMPANY_ID en su lugar.

// Un id aleatorio por PESTAÑA/SESIÓN, en memoria — no en localStorage ni en
// cookie. Se pierde al cerrar la pestaña a propósito: así no se accede a
// ningún almacenamiento del dispositivo y no hace falta consentimiento.
const sessionId = crypto.randomUUID()

type EventType = 'page_view' | 'cta_click'

function send(eventType: EventType, extra?: { path?: string; event_key?: string }) {
  if (!COMPANY_ID) {
    console.warn('[analytics] COMPANY_ID no está configurado — evento descartado')
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
// botón/link/CTA nuevo se mide con solo añadirle un atributo HTML — sin
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
```

---

## 4. Arrancar el tracking

En el punto de entrada de la app (`main.tsx`, `App.tsx` o equivalente),
una sola vez:

```ts
import { initAutoTracking } from './lib/analytics' // ajusta la ruta

initAutoTracking()
```

Y en el sitio donde ya gestiones el cambio de ruta (según el router de
este proyecto), llama a `trackPageview` con la nueva ruta:

**react-router:**
```tsx
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { trackPageview } from './lib/analytics'

function usePageviewTracking() {
  const location = useLocation()
  useEffect(() => {
    trackPageview(location.pathname)
  }, [location.pathname])
}
```

**Next.js App Router:**
```tsx
'use client'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { trackPageview } from '@/lib/analytics'

export function PageviewTracker() {
  const pathname = usePathname()
  useEffect(() => { trackPageview(pathname) }, [pathname])
  return null
}
```

Si es un sitio sin router de SPA (páginas estáticas tradicionales), basta
con llamar `trackPageview(window.location.pathname)` una vez al cargar cada
página.

---

## 5. Instrumentar botones y CTAs

Sin tocar `lib/analytics.ts` de nuevo, añade el atributo a cualquier
elemento clicable que se quiera medir:

```html
<button data-track-event="whatsapp_click">Escríbenos por WhatsApp</button>
<a href="tel:+34..." data-track-event="phone_click">Llamar</a>
<button type="submit" data-track-event="form_submit">Enviar</button>
```

**La clave (`whatsapp_click`, `form_submit`, ...) tiene que existir como
evento activo para esta empresa en el panel de admin** (pestaña
"Analítica" → "Nuevo evento"). Si el evento no está dado de alta ahí, el
clic se descarta en silencio — no rompe nada, simplemente no se cuenta.
Coordínate con quien gestione el admin de esta empresa para acordar las
claves antes de desplegar, o dalas de alta tú mismo si tienes acceso.

Eventos recomendados para empezar: `form_open` (al abrir el modal/sección
de contacto) y `form_submit` (al enviar con éxito) — si la empresa se creó
desde el admin panel, es posible que estos dos ya existan por defecto.

---

## 6. Verificación

1. Desplegar con las tres variables de entorno del Paso 1 configuradas.
2. Abrir la web en el navegador, DevTools → Network, filtrar por `track`.
   Cada cambio de página y cada clic instrumentado debe generar una
   petición `POST /api/track` con respuesta `204`.
3. Un `400` indica `company_id` inválido o payload mal formado — revisar
   `VITE_COMPANY_ID`. Un `204` en un clic que no aparece luego en el
   dashboard normalmente significa que el `event_key` no coincide con
   ningún evento activo dado de alta en el admin (se descarta en silencio
   a propósito, no es un error).
4. Pedir a quien tenga acceso al admin de esta empresa que pulse "Agregar
   ahora" en la pestaña "Analítica" (o esperar a la siguiente pasada
   automática, cada 2 horas aprox. entre las 10:00 y las 18:00) y comprobar
   que los datos de hoy aparecen ahí.

---

## 7. Checklist final

- [ ] `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` configuradas en Vercel
      (servidor, nunca con prefijo público)
- [ ] `VITE_COMPANY_ID` (o el equivalente del bundler) configurada con el
      `id` correcto de esta empresa
- [ ] `api/track.ts` desplegado
- [ ] `lib/analytics.ts` creado y `initAutoTracking()` llamado una vez al
      arrancar
- [ ] `trackPageview` cableado al cambio de ruta
- [ ] Al menos `form_open`/`form_submit` (u otros eventos ya acordados)
      instrumentados con `data-track-event` en los botones correspondientes
- [ ] Esos eventos existen y están activos en el panel de admin de esta
      empresa
- [ ] Verificado en Network que `/api/track` responde `204`
- [ ] Confirmado al día siguiente que los datos aparecen en la pestaña
      "Analítica" del admin