import { test } from 'node:test'
import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { measurementAllowed, type Consent } from '../src/lib/consent'

test('la oposición y GPC impiden medir, aunque hubiera consentimiento guardado', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'navigator')
  const consent: Consent = { analytics: false, marketing: false, measurement: true, decidedAt: new Date().toISOString(), version: 1 }
  try {
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { globalPrivacyControl: false } })
    assert.equal(measurementAllowed(null), true)
    assert.equal(measurementAllowed({ ...consent, measurement: false }), false)
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { globalPrivacyControl: true } })
    assert.equal(measurementAllowed(null), false)
    assert.equal(measurementAllowed(consent), false)
  } finally {
    if (previous) Object.defineProperty(globalThis, 'navigator', previous)
  }
})

test('medición: no cuenta tiempo desactivado, limita a dos horas y prioriza CTAs propios', async () => {
  const previous = new Map(['window', 'document', 'navigator', 'performance'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  const payloads: Record<string, unknown>[] = []
  let now = 0
  const listeners: Record<string, () => void> = {}
  const output = await build({ entryPoints: ['src/lib/analytics.ts'], bundle: true, write: false, format: 'esm', platform: 'node', define: {
    'import.meta.env.PROD': 'true', 'import.meta.env.VITE_SUPABASE_URL': '"https://example.supabase.co"', 'import.meta.env.VITE_ARQUELIA_COMPANY_ID': '"company"',
  } })
  const fakeWindow = { location: { pathname: '/', search: '' }, addEventListener(name: string, callback: () => void) { listeners[name] = callback } }
  const fakeDocument = { referrer: '', visibilityState: 'visible', addEventListener() {} }
  try {
    for (const [key, value] of Object.entries({ window: fakeWindow, document: fakeDocument, navigator: { language: 'es', sendBeacon(_url: string, blob: Blob) { void blob.text().then((text) => payloads.push(JSON.parse(text))); return true } }, performance: { now: () => now } })) {
      Object.defineProperty(globalThis, key, { configurable: true, value })
    }
    const analytics = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString('base64')}`)
    analytics.initAutoTracking()
    analytics.trackPageview('/')
    now = 5000
    analytics.setMeasurement(false)
    now = 95000
    analytics.setMeasurement(true)
    now = 98000
    analytics.trackPageview('/blog')
    await new Promise((resolve) => setImmediate(resolve))
    assert.equal(payloads.find((item) => item.event_type === 'engagement')?.value, 3)
    now += 3 * 60 * 60 * 1000
    analytics.trackPageview('/contacto')
    await new Promise((resolve) => setImmediate(resolve))
    assert.equal(payloads.filter((item) => item.event_type === 'engagement')[1].value, 7200)
    const target = { closest(selector: string) { return { getAttribute() { return selector === '[data-track-event]' ? 'mi_evento' : 'tel:+34673456693' } } } }
    assert.equal(analytics.keyForClick(target), 'mi_evento')
    assert.ok(listeners['moira:lead-sent'])
  } finally {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else Reflect.deleteProperty(globalThis, key)
    }
  }
})
