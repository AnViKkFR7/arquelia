import { test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'

const company = '11111111-1111-4111-8111-111111111111'
type EdgeHandler = (request: Request) => Promise<Response>
type TestGlobals = typeof globalThis & { Deno?: unknown; __leadTestClient?: unknown }

test('el cliente conserva UTM y solo cuenta leads confirmados en la bandeja', async () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  const previousFetch = globalThis.fetch
  let response = { success: true, lead_saved: false }
  let eventCount = 0
  let payload: Record<string, unknown> = {}
  const fakeWindow = { location: { pathname: '/proyectos/proyecto', search: '?utm_source=newsletter&utm_campaign=otono&utm_medium=email&utm_term=reforma&utm_content=boton' }, dispatchEvent() { eventCount++ } }
  Object.defineProperty(globalThis, 'window', { configurable: true, value: fakeWindow })
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { referrer: 'https://example.com' } })
  globalThis.fetch = async (_input, options) => { payload = JSON.parse(String(options?.body)); return Response.json(response) }
  const output = await build({ entryPoints: ['src/lib/leads.ts'], bundle: true, write: false, format: 'esm', platform: 'node', define: {
    'import.meta.env.VITE_SUPABASE_URL': '"https://example.supabase.co"',
    'import.meta.env.VITE_SUPABASE_ANON_KEY': '"anon"', 'import.meta.env.VITE_ARQUELIA_COMPANY_ID': JSON.stringify(company),
  } })
  try {
    const { submitLead } = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString('base64')}`)
    fakeWindow.location.search = ''
    const data = { nombre: 'Ana', email: 'ana@example.com', telefono: '', poblacion: '', servicio: null, descripcion: '', company_website: '', consent_given: false }
    assert.deepEqual(await submitLead(data), { ok: true })
    assert.equal(eventCount, 0)
    assert.equal(payload.source_utm_source, 'newsletter')
    assert.equal(payload.source_campaign, 'otono')
    assert.equal(payload.source_utm_content, 'boton')
    assert.equal(payload.source_referrer, 'https://example.com')
    response = { success: true, lead_saved: true }
    assert.deepEqual(await submitLead(data), { ok: true })
    assert.equal(eventCount, 1)
    assert.deepEqual(await submitLead({ ...data, email: '' }), { ok: false, reason: 'invalid' })
    assert.equal(eventCount, 1)
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow)
    else Reflect.deleteProperty(globalThis, 'window')
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument)
    else Reflect.deleteProperty(globalThis, 'document')
    globalThis.fetch = previousFetch
  }
})

test('función de contacto: tenant fijo, consentimiento, atribución y resultados reales', async () => {
  const globals = globalThis as TestGlobals
  const previousDeno = globals.Deno
  const previousClient = globals.__leadTestClient
  const previousFetch = globalThis.fetch
  let serve: EdgeHandler = async () => new Response(null, { status: 500 })
  let moduleEnabled = true
  let insertFails = false
  let resendFails = false
  let inserts: Record<string, unknown>[] = []
  let emails = 0
  const chain = (table: string) => {
    const query = {
      select() { return query },
      eq() { return query },
      async maybeSingle() { return { data: table === 'companies' ? { id: company } : { is_enabled: moduleEnabled }, error: null } },
      async insert(row: Record<string, unknown>) {
        inserts.push(row)
        return { error: insertFails ? { message: 'Unavailable' } : null }
      },
    }
    return query
  }
  globals.__leadTestClient = { from: chain }
  globals.Deno = {
    env: { get: (key: string) => ({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'test', ARQUELIA_COMPANY_ID: company, RESEND_ARQUELIA_API_KEY: 'test' })[key] },
    serve(handler: EdgeHandler) { serve = handler },
  }
  globalThis.fetch = async () => { emails++; return new Response('{}', { status: resendFails ? 500 : 200 }) }
  const output = await build({
    entryPoints: ['supabase/functions/send-contact-arquelia/index.ts'], bundle: true, write: false,
    platform: 'node', format: 'esm',
    plugins: [{ name: 'mock-supabase', setup(build) {
      build.onResolve({ filter: /^npm:/ }, () => ({ path: 'client', namespace: 'mock' }))
      build.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: 'export const createClient = () => globalThis.__leadTestClient' }))
    } }],
  })
  const invoke = (body: unknown) => serve(new Request('https://example.com/contact', { method: 'POST', body: JSON.stringify(body) }))
  const base = { company_id: company, nombre: 'Ana', email: 'ana@example.com', source_item: 'Cocina · cocina-reformada', source_referrer: 'https://example.com', source_campaign: 'otono', source_utm_source: 'newsletter', source_utm_medium: 'email', source_utm_term: 'reforma', source_utm_content: 'boton' }
  try {
    await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString('base64')}`)
    assert.equal((await invoke(null)).status, 400)
    assert.equal((await invoke({ ...base, company_id: '22222222-2222-4222-8222-222222222222' })).status, 400)
    assert.equal(inserts.length, 0)
    const bot = await invoke({ ...base, company_website: 'bot' })
    assert.deepEqual(await bot.json(), { success: true, lead_saved: false })
    assert.equal(emails, 0)
    moduleEnabled = false
    assert.equal((await invoke(base)).status, 503)
    assert.equal(inserts.length, 0)
    moduleEnabled = true
    const accepted = await invoke({ ...base, consent_given: true, consent_text_version: 'arquelia-contact-2026-10-v1', crm_contact_id: 'attacker' })
    assert.equal(accepted.status, 200)
    assert.deepEqual(await accepted.json(), { success: true, lead_saved: true })
    assert.equal(inserts[0].company_id, company)
    assert.equal(inserts[0].source_item, base.source_item)
    assert.equal(inserts[0].source_utm_content, 'boton')
    assert.equal(inserts[0].consent_given, true)
    assert.equal(inserts[0].consent_source, 'public_contact_form')
    assert.equal(typeof inserts[0].consent_at, 'string')
    assert.equal('crm_contact_id' in inserts[0], false)
    inserts = []
    assert.equal((await invoke({ ...base, email: '', telefono: '673456693', consent_given: true })).status, 200)
    assert.equal(inserts[0].consent_given, false)
    assert.equal(inserts[0].consent_at, null)
    assert.equal(inserts[0].consent_text_version, null)
    assert.equal((await invoke({ ...base, email: '', telefono: '' })).status, 400)
    insertFails = true
    const emailOnly = await invoke(base)
    assert.deepEqual(await emailOnly.json(), { success: true, lead_saved: false })
    resendFails = true
    assert.equal((await invoke(base)).status, 502)
    insertFails = false
    assert.deepEqual(await (await invoke(base)).json(), { success: true, lead_saved: true })
  } finally {
    globals.Deno = previousDeno
    globals.__leadTestClient = previousClient
    globalThis.fetch = previousFetch
  }
})
