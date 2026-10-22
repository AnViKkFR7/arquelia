// Endpoint de ingesta de analítica propia (ver ANALYTICS_INTEGRATION.md).
// Adaptación de company-site-snippet/api/track.ts a una Supabase Edge Function:
// las llamadas salientes desde las funciones serverless de Vercel de este
// proyecto se colgaban sin completarse nunca (mismo síntoma que tenía el
// envío de email, resuelto igual — ver supabase/functions/send-contact-arquelia).
//
// Qué decide el SERVIDOR y no el navegador (para que no se pueda falsear):
//   - quién: hash anónimo del visitante (sal del día + IP + user-agent)
//   - desde dónde: país/región/ciudad
//   - con qué: móvil / tableta / escritorio, del user-agent
// La IP no se guarda en ningún momento.
//
// Deploy: supabase functions deploy track-arquelia --no-verify-jwt
//
// Secretos (supabase secrets set ...):
//   ANALYTICS_SALT      Cadena larga al azar: `openssl rand -hex 32`. OBLIGATORIO:
//                       sin él la función responde 204 y no guarda nada.
//   ALLOWED_ORIGINS     Opcional. Orígenes de la web separados por comas.
//                       Por defecto: https://arquelia.es y https://www.arquelia.es
// SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase solos.
import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  businessDay,
  deviceFromUa,
  geoFromHeaders,
  isBot,
  isEventKeyAllowed,
  parseTrackPayload,
  visitorHash,
} from './trackCore.ts'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const ANALYTICS_SALT = Deno.env.get('ANALYTICS_SALT')
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://arquelia.es,https://www.arquelia.es')
  .split(',')
  .map((origin) => origin.trim().toLowerCase())
  .filter(Boolean)

// `navigator.sendBeacon` envía siempre con credenciales incluidas, y el CORS
// del navegador prohíbe el comodín '*' en cuanto el modo es 'include': hay
// que reflejar el origen real y declarar que se permiten credenciales.
function corsHeaders(req: Request) {
  return {
    'Access-Control-Allow-Origin': req.headers.get('origin') ?? '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
    Vary: 'Origin',
  }
}

// La medición nunca debe romper la web ni delatar nada: pase lo que pase se
// responde 204 y el navegador no reintenta.
const noContent = (req: Request) => new Response(null, { status: 204, headers: corsHeaders(req) })

// Un `Promise.race` con un temporizador de verdad no depende de que la
// librería de red coopere con un abort (ver send-contact-arquelia).
function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

// Aquí la web y la función están en dominios distintos, así que `Sec-Fetch-Site`
// es siempre 'cross-site' y no sirve (el `isSameOrigin` de trackCore es para
// cuando /api/track vive en el mismo dominio). En su lugar se exige que el
// `Origin` sea el de la web. Corta el envenenamiento fácil con curl o desde
// otro sitio: sin cabecera `Origin`, se descarta.
function originOf(req: Request): string | null {
  const origin = req.headers.get('origin')?.toLowerCase()
  return origin && ALLOWED_ORIGINS.includes(origin) ? origin : null
}

// Caché en memoria por instancia "caliente": evita consultar en cada clic
let definitionsCache: { companyId: string; keys: Set<string>; expiresAt: number } | null = null

async function activeEventKeys(companyId: string): Promise<Set<string>> {
  if (definitionsCache?.companyId === companyId && definitionsCache.expiresAt > Date.now()) {
    return definitionsCache.keys
  }
  const { data } = await withTimeout(
    supabase.from('analytics_event_definitions').select('key').eq('company_id', companyId).eq('is_active', true),
    4000
  )
  const keys = new Set((data ?? []).map((row) => row.key as string))
  definitionsCache = { companyId, keys, expiresAt: Date.now() + 5 * 60 * 1000 }
  return keys
}

// La sal del día la genera la base de datos y se borra a las 48 h; aquí solo
// se guarda la de hoy.
let saltCache: { day: string; salt: string } | null = null

async function dailySalt(day: string): Promise<string | null> {
  if (saltCache?.day === day) return saltCache.salt
  const { data, error } = await withTimeout(supabase.rpc('analytics_salt', { p_day: day }), 4000)
  if (error || typeof data !== 'string') return null
  saltCache = { day, salt: data }
  return data
}

// Si el hosting no da el país en cabeceras, se pide aparte. ip-api.com no
// exige cuenta ni clave (45 peticiones/min), a cambio de sólo HTTP; sin
// problema aquí porque la llamada es de servidor a servidor. Con timeout corto
// y en su propio try/catch: si falla o tarda, el evento se registra igual,
// sólo que sin país/ciudad.
async function lookupGeo(ip: string) {
  const empty = { country: null, region: null, city: null }
  if (!ip) return empty
  try {
    const res = await withTimeout(
      fetch(`http://ip-api.com/json/${ip}?fields=status,countryCode,regionName,city`),
      2000
    )
    const data = await res.json()
    if (data.status !== 'success') return empty
    return { country: data.countryCode ?? null, region: data.regionName ?? null, city: data.city ?? null }
  } catch {
    return empty
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  try {
    return await withTimeout(handle(req), 9000)
  } catch (err) {
    console.error('[track] error', err)
    return noContent(req)
  }
})

async function handle(req: Request): Promise<Response> {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders(req) })

  if (!ANALYTICS_SALT) {
    console.error('[track] ANALYTICS_SALT no configurada (supabase secrets set ANALYTICS_SALT=...) — no se guarda nada')
    return noContent(req)
  }

  const get = (header: string) => req.headers.get(header)

  // Bots y peticiones que no vienen de la propia web
  const userAgent = get('user-agent') ?? ''
  if (isBot(userAgent)) return noContent(req)
  const origin = originOf(req)
  if (!origin) return noContent(req)

  const raw = await req.text()
  if (raw.length > 4000) return noContent(req)

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return noContent(req)
  }

  const preliminary = parseTrackPayload(body, { ownHost: new URL(origin).host })
  if (!preliminary) return noContent(req)

  // Un clic con una clave que la empresa no ha dado de alta se descarta,
  // salvo las reservadas (teléfono, email, formulario), que valen siempre.
  if (preliminary.event_type === 'cta_click') {
    if (!preliminary.event_key) return noContent(req)
    const keys = await activeEventKeys(preliminary.company_id)
    if (!isEventKeyAllowed(preliminary.event_key, keys)) return noContent(req)
  }

  // company_id debe existir: evita inyectar tráfico en otra empresa
  const { data: company } = await withTimeout(
    supabase.from('companies').select('id').eq('id', preliminary.company_id).maybeSingle(),
    4000
  )
  if (!company) return noContent(req)

  const day = businessDay(new Date())
  const salt = await dailySalt(day)
  if (!salt) return noContent(req)

  const ip = get('cf-connecting-ip') ?? get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  const visitor = await visitorHash(`${salt}:${ANALYTICS_SALT}`, day, ip, userAgent)

  let geo = geoFromHeaders(get)
  if (!geo.country) geo = await lookupGeo(ip)

  const { error } = await withTimeout(
    supabase.from('analytics_events').insert({
      company_id: preliminary.company_id,
      event_type: preliminary.event_type,
      event_key: preliminary.event_key ?? null,
      value: preliminary.value ?? null,
      path: preliminary.path ?? null,
      visitor,
      device: deviceFromUa(userAgent),
      country: geo.country,
      region: geo.region,
      city: geo.city,
      lang: preliminary.lang ?? null,
      referrer: preliminary.referrer ?? null,
      utm_source: preliminary.utm_source ?? null,
      utm_medium: preliminary.utm_medium ?? null,
      utm_campaign: preliminary.utm_campaign ?? null,
    }),
    5000
  )

  // Un fallo al guardar tampoco se le cuenta al navegador
  if (error) console.error('[track] insert failed', error.message)
  return noContent(req)
}
