import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { createServer } from 'node:http'
import { once } from 'node:events'
import { ARQUELIA_ITEM_TYPE, projectRepository, projectMetadata, projectPath } from '../src/lib/projectRepository'
import { projectRedirects } from '../src/lib/projectRedirects'
import projectHandler from '../api/project'
import blogHandler from '../api/blog'
import { auditProjects, prepareSeoSql, type SeoProposal } from '../scripts/items-seo-core'

const company = '11111111-1111-4111-8111-111111111111'
const id = '22222222-2222-4222-8222-222222222222'
const item = { id, company_id: company, item_type: ARQUELIA_ITEM_TYPE, status: 'published', title: 'Cocina & salón <abierto>', summary: 'Reforma de cocina.',
  slug: 'cocina-abierta', seo_title: 'Cocina "abierta" · Arquelia', seo_description: 'Cocina y salón reformados.', seo_og_image_url: null,
  updated_at: '2026-10-28T10:00:00Z', attribute_values: [
    { attribute_definitions: { key: 'description' }, value_text: 'Una cocina luminosa.' },
    { attribute_definitions: { key: 'what_was_done' }, value_text_array: ['Mobiliario', 'Pavimento'] },
    { attribute_definitions: { key: 'ubicacion' }, value_text: 'Cornellà' },
    { attribute_definitions: { key: 'superficie_m2' }, value_number: 30 },
  ] }
const cover = { id: 'cover', item_id: id, file_type: 'image', url_externa: 'https://example.com/kitchen.jpg', title: 'Cocina', alt_text: 'Cocina abierta al salón', is_cover: true, sort_order: 0 }

function setup(rows: Record<string, unknown>[] = [item], images: Record<string, unknown>[] = [cover], fail = '') {
  const requests: URL[] = []
  const fetcher = async (input: RequestInfo | URL) => {
    const url = new URL(String(input))
    requests.push(url)
    const table = url.pathname.split('/').at(-1)!
    if (table === fail) return Response.json({ message: 'Simulated database error' }, { status: 500 })
    let data = table === 'items' ? rows : table === 'item_media' ? images : []
    if (table === 'items') {
      assert.equal(url.searchParams.get('company_id'), `eq.${company}`)
      assert.equal(url.searchParams.get('item_type'), `eq.${ARQUELIA_ITEM_TYPE}`)
      assert.equal(url.searchParams.get('status'), 'eq.published')
    }
    for (const field of ['company_id', 'item_type', 'status', 'slug', 'id', 'file_type']) {
      const filter = url.searchParams.get(field)
      if (filter?.startsWith('eq.')) data = data.filter((row) => row[field] === filter.slice(3))
    }
    if (table === 'item_media') {
      const ids = url.searchParams.get('item_id')?.slice(4, -1).split(',') ?? []
      assert.equal(url.searchParams.get('file_type'), 'eq.image')
      data = data.filter((row) => ids.includes(String(row.item_id)))
    }
    const from = Number(url.searchParams.get('offset') ?? 0)
    const limit = Number(url.searchParams.get('limit') ?? data.length)
    return Response.json(data.slice(from, from + limit))
  }
  const client = createClient('https://example.supabase.co', 'anon', { auth: { persistSession: false }, global: { fetch: fetcher } })
  return { repository: projectRepository(client, company), requests, fetcher }
}

test('detalle por slug/UUID y listado aíslan tenant, tipo y estado; medios solo de IDs resueltos', async () => {
  const { repository, requests } = setup([item, { ...item, id: 'foreign', company_id: 'foreign' }, { ...item, id: 'wrong-type', item_type: 'otro' }, { ...item, id: 'draft', status: 'draft' }], [cover, { ...cover, id: 'foreign-media', item_id: 'foreign' }, { ...cover, id: 'insecure', url_externa: 'javascript:alert(1)' }])
  const project = await repository.get(item.slug)
  assert.equal(project?.id, id)
  assert.equal(project?.media.length, 1)
  assert.equal(project?.coverUrl, cover.url_externa)
  assert.equal(project?.media[0].altText, cover.alt_text)
  assert.equal((await repository.get(id))?.id, id)
  assert.equal((await repository.list()).projects.length, 1)
  assert.equal(await repository.get('../private'), null)
  assert.equal(await repository.get('inexistente'), null)
  assert.ok(requests.filter((request) => request.pathname.endsWith('item_media')).every((request) => request.searchParams.get('item_id') === `in.(${id})`))
})

test('paginación estable y errores de Supabase no se convierten en datos vacíos', async () => {
  const rows = Array.from({ length: 20 }, (_, i) => ({ ...item, id: `item-${i}`, slug: `proyecto-${i}` }))
  const { repository } = setup(rows, [])
  const first = await repository.list(1)
  const second = await repository.list(2)
  assert.equal(first.projects.length, 9)
  assert.equal(first.hasMore, true)
  assert.equal(second.projects[0].id, 'item-9')
  assert.equal((await repository.list(3)).hasMore, false)
  await assert.rejects(setup([item], [], 'items').repository.list())
  await assert.rejects(setup([item], [], 'item_media').repository.get(item.slug))
})

test('fallback SEO e imagen HTTPS; UUID sin slug no es indexable', async () => {
  const project = (await setup([{ ...item, slug: null, seo_title: null, seo_description: null, seo_og_image_url: 'http://example.com/og.jpg' }]).repository.get(id))!
  const meta = projectMetadata(project, 'https://arquelia.es')
  assert.equal(meta.title, item.title)
  assert.equal(meta.description, item.summary)
  assert.equal(meta.image, cover.url_externa)
  assert.equal(meta.indexable, false)
  assert.equal(projectPath(project), `/proyectos/${id}`)
  assert.throws(() => projectMetadata(project, 'http://insecure.example'), /HTTPS/)
  const noImage = { ...project, coverUrl: null, seoOgImageUrl: 'javascript:bad' }
  assert.equal(projectMetadata(noImage, 'https://arquelia.es').image, undefined)
})

test('auditoría y preparación SQL rechazan slugs, cambios de URL y filas fuera de alcance', async () => {
  const project = (await setup([{ ...item, slug: null }]).repository.get(id))!
  const snapshot = { company_id: company, item_type: ARQUELIA_ITEM_TYPE, exported_at: new Date().toISOString(), projects: [project] }
  const proposal: SeoProposal = { id, company_id: company, item_type: ARQUELIA_ITEM_TYPE, slug: 'cocina-abierta', seo_title: "Cocina d'autor", seo_description: 'Reforma de cocina.', seo_og_image_url: null }
  assert.ok(auditProjects([project])[0].issues.includes('missing_slug'))
  const sql = prepareSeoSql(snapshot, [proposal], company)
  assert.match(sql, /Cocina d''autor/)
  assert.match(sql, /i\.updated_at=p\.expected_updated_at/)
  assert.match(sql, /other\.company_id=p\.company_id/)
  assert.match(sql, /-- COMMIT;/)
  assert.doesNotMatch(sql, /SET title|SET summary|service_role/i)
  assert.throws(() => prepareSeoSql(snapshot, [{ ...proposal, company_id: 'foreign' }], company), /fuera/)
  assert.throws(() => prepareSeoSql(snapshot, [{ ...proposal, slug: id }], company), /Slug/)
  assert.throws(() => prepareSeoSql(snapshot, [proposal, proposal], company), /duplicado/)
  assert.throws(() => prepareSeoSql({ ...snapshot, projects: [{ ...project, slug: 'anterior' }] }, [proposal], company), /redirección/)
})

test('respuesta HTTP inicial real: SEO, fallbacks, 308, 404, 503, HEAD y sitemap', async () => {
  const originalFetch = globalThis.fetch
  const originalEnv = { ...process.env }
  let rows: Record<string, unknown>[] = [item]
  let fail = ''
  const requests: URL[] = []
  process.env.VITE_SUPABASE_URL = 'https://example.supabase.co'
  process.env.VITE_SUPABASE_ANON_KEY = 'public-anon'
  process.env.VITE_ARQUELIA_COMPANY_ID = company
  process.env.VITE_SITE_URL = 'https://arquelia.es'
  globalThis.fetch = async (input) => {
    const mocked = setup(rows, [cover], fail)
    const response = await mocked.fetcher(input)
    requests.push(...mocked.requests)
    return response
  }
  const server = createServer((req, res) => { void (req.url?.startsWith('/sitemap') ? blogHandler : projectHandler)(req, res).catch((error) => { res.statusCode = 500; res.end(String(error)) }) })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address() as { port: number }
  const request = (path: string, method = 'GET') => originalFetch(`http://127.0.0.1:${address.port}${path}`, { method, redirect: 'manual' })
  try {
    const full = await request('/proyectos?key=cocina-abierta')
    const html = await full.text()
    assert.equal(full.status, 200)
    assert.match(html, /<title>Cocina &quot;abierta&quot; · Arquelia<\/title>/)
    assert.match(html, /canonical" href="https:\/\/arquelia.es\/proyectos\/cocina-abierta"/)
    assert.match(html, /og:image" content="https:\/\/example.com\/kitchen.jpg"/)
    assert.match(html, /twitter:card" content="summary_large_image"/)
    assert.match(html, /<h1>Cocina &amp; salón &lt;abierto&gt;<\/h1>/)
    assert.match(html, /Una cocina luminosa|Mobiliario|Pavimento/)
    assert.match(html, /alt="Cocina abierta al salón"/)
    const redirect = await request(`/proyectos?key=${id}`)
    assert.equal(redirect.status, 308)
    assert.equal(redirect.headers.get('location'), 'https://arquelia.es/proyectos/cocina-abierta')
    const fallback = { ...item, seo_title: null, seo_description: null }
    rows = [fallback]
    assert.match(await (await request('/proyectos?key=cocina-abierta')).text(), /name="description" content="Reforma de cocina\."/)
    const head = await request('/proyectos?key=cocina-abierta', 'HEAD')
    assert.equal(head.status, 200)
    assert.equal(await head.text(), '')
    for (const status of ['draft', 'archived']) {
      rows = [{ ...item, status }]
      const response = await request('/proyectos?key=cocina-abierta')
      assert.equal(response.status, 404)
      assert.match(await response.text(), /noindex, follow/)
      assert.doesNotMatch(await (await request('/sitemap?mode=sitemap')).text(), /proyectos\/cocina-abierta/)
    }
    for (const wrong of [{ company_id: 'foreign' }, { item_type: 'otro' }]) {
      rows = [{ ...item, ...wrong }]
      assert.equal((await request(`/proyectos?key=${id}`)).status, 404)
    }
    rows = [item]
    assert.equal((await request('/proyectos?key=no-existe')).status, 404)
    const sitemap = await (await request('/sitemap?mode=sitemap')).text()
    assert.match(sitemap, /<loc>https:\/\/arquelia.es\/proyectos\/cocina-abierta<\/loc>/)
    assert.doesNotMatch(sitemap, new RegExp(id))
    rows = [{ ...item, slug: null }]
    const legacy = await request(`/proyectos?key=${id}`)
    assert.equal(legacy.status, 200)
    assert.match(await legacy.text(), /noindex, follow/)
    assert.doesNotMatch(await (await request('/sitemap?mode=sitemap')).text(), /proyectos\/cocina-abierta/)
    fail = 'items'
    const failed = await request('/proyectos?key=cocina-abierta')
    assert.equal(failed.status, 503)
    assert.match(await failed.text(), /noindex, follow/)
    assert.equal((await request('/sitemap?mode=sitemap')).status, 503)
    assert.equal(requests.filter((url) => url.pathname.endsWith('items')).every((url) => url.searchParams.get('item_type') === `eq.${ARQUELIA_ITEM_TYPE}`), true)
  } finally {
    server.close()
    globalThis.fetch = originalFetch
    process.env = originalEnv
  }
})

test('un slug anterior aprobado resuelve por UUID y vuelve a validar el estado', async () => {
  const redirects = projectRedirects as Record<string, string>
  redirects['cocina-anterior'] = id
  try {
    assert.equal((await setup().repository.get('cocina-anterior'))?.slug, 'cocina-abierta')
    assert.equal(await setup([{ ...item, status: 'archived' }]).repository.get('cocina-anterior'), null)
  } finally { delete redirects['cocina-anterior'] }
})
