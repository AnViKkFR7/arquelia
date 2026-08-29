// Endpoint de ingesta de analítica propia (ver ANALYTICS_INTEGRATION.md).
// Movido de una función serverless de Vercel a una Supabase Edge Function:
// las llamadas salientes desde las funciones de Vercel de este proyecto se
// colgaban sin completarse nunca (mismo síntoma que tenía el envío de
// email, resuelto igual — ver supabase/functions/send-contact).
//
// Deploy: supabase functions deploy track --no-verify-jwt
// No hace falta configurar ningún secreto: SUPABASE_URL y
// SUPABASE_SERVICE_ROLE_KEY ya vienen inyectados automáticamente en toda
// Edge Function del mismo proyecto.
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

// Ver el mismo razonamiento en supabase/functions/send-contact/index.ts:
// un `Promise.race` con un temporizador de verdad no depende de que la
// librería de red coopere con un abort.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

const ALLOWED_EVENT_TYPES = new Set(['page_view', 'cta_click'])

// Caché en memoria por instancia "caliente" de la función — evita
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

interface Geo {
  country: string | null
  region: string | null
  city: string | null
}

// A diferencia de Vercel, Supabase no resuelve la geolocalización gratis en
// una cabecera — hay que pedirla aparte. ip-api.com no exige cuenta ni
// clave para su plan gratuito (45 peticiones/min), a cambio de sólo HTTP,
// no HTTPS — sin problema aquí porque la llamada es de servidor a
// servidor, no del navegador (la restricción de contenido mixto es sólo
// para páginas HTTPS pidiendo recursos HTTP, no aplica a un `fetch` desde
// Deno). Con timeout corto y en su propio try/catch: si falla o tarda, se
// sigue registrando el evento igual, sólo que sin país/ciudad.
async function lookupGeo(ip: string | null): Promise<Geo> {
  const empty: Geo = { country: null, region: null, city: null }
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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    return await withTimeout(handle(req), 9000)
  } catch {
    return new Response('Timeout', { status: 504, headers: corsHeaders })
  }
})

async function handle(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  let body: {
    company_id?: string
    event_type?: string
    event_key?: string
    path?: string
    session_id?: string
  }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return new Response('Bad request', { status: 400, headers: corsHeaders })
  }

  const { company_id, event_type, event_key, path, session_id } = body
  if (!company_id || !event_type || !ALLOWED_EVENT_TYPES.has(event_type) || !session_id) {
    return new Response('Bad request', { status: 400, headers: corsHeaders })
  }

  // company_id debe existir — evita inyectar tráfico a una empresa que no
  // sea la que corresponde a este despliegue.
  const { data: company } = await supabase.from('companies').select('id').eq('id', company_id).maybeSingle()
  if (!company) return new Response('Bad request', { status: 400, headers: corsHeaders })

  // Un clic con event_key que la empresa no ha dado de alta (o desactivado
  // desde el admin) se descarta en silencio: nunca da error al visitante.
  if (event_type === 'cta_click') {
    if (!event_key) return new Response('Bad request', { status: 400, headers: corsHeaders })
    const keys = await activeEventKeys(company_id)
    if (!keys.has(event_key)) return new Response(null, { status: 204, headers: corsHeaders })
  }

  const forwardedFor = req.headers.get('x-forwarded-for')
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : null
  const { country, region, city } = await lookupGeo(ip)

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

  if (error) return new Response('Error', { status: 500, headers: corsHeaders })
  return new Response(null, { status: 204, headers: corsHeaders })
}
