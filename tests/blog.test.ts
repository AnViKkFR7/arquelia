import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
import { blogRepository, type BlogPost } from '../src/lib/blogRepository'
import handler, { renderBlogDocument } from '../api/blog'
import type { IncomingMessage, ServerResponse } from 'node:http'

const company = '11111111-1111-4111-8111-111111111111'
const post = { id: 'post-1', company_id: company, title: '<Reformas> & diseño', heading: 'Consejos', intro: 'Una introducción', body: '# Ideas\n\nTexto **seguro**.\n\n<script>alert(1)</script>\n\n[enlace](javascript:alert)\n\n[seguro](https://arquelia.es)', slug: 'reformas', seo_title: 'Reformas "Arquelia"', seo_description: 'Consejos & ideas', seo_og_image_url: null, published_at: '2026-10-01T12:00:00Z', updated_at: '2026-10-01T12:00:00Z', media: [], cover: null } satisfies BlogPost

function setup(rows: Record<string, unknown>[] = [post], media: Record<string, unknown>[] = [], failMedia = false) {
  const requests: URL[] = []
  const client = createClient('https://example.supabase.co', 'public-anon-key', {
    auth: { persistSession: false },
    global: { fetch: async (input) => {
      const url = new URL(String(input))
      requests.push(url)
      const isMedia = url.pathname.endsWith('blog_media')
      if (isMedia && failMedia) return new Response(JSON.stringify({ message: 'Media unavailable' }), { status: 500 })
      let data = isMedia ? media : rows.filter((item) => item.company_id === company && (item.status ?? 'published') === 'published')
      const slug = url.searchParams.get('slug')
      if (slug?.startsWith('eq.')) data = data.filter((item) => item.slug === slug.slice(3))
      if (slug === 'not.is.null') data = data.filter((item) => item.slug !== null)
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } })
    } },
  })
  return { repository: blogRepository(client, company), requests }
}

test('listado paginado limita empresa, estado y medios a posts publicados', async () => {
  const media = { id: 'image-1', post_id: post.id, url_externa: 'https://example.com/cover.jpg', alt_text: 'Cocina luminosa', title: null, sort_order: 1, is_cover_image: true }
  const { repository, requests } = setup(Array.from({ length: 10 }, (_, i) => ({ ...post, id: `post-${i}` })), [media])
  const result = await repository.list(2)
  assert.equal(result.posts.length, 9)
  assert.equal(result.hasMore, true)
  assert.equal(requests[0].searchParams.get('company_id'), `eq.${company}`)
  assert.equal(requests[0].searchParams.get('status'), 'eq.published')
  assert.equal(requests[0].searchParams.get('offset'), '9')
  assert.equal(requests[0].searchParams.get('limit'), '10')
  assert.equal(requests[1].searchParams.get('file_type'), 'eq.image')
  assert.match(requests[1].searchParams.get('post_id')!, /^in\.\(/)
  assert.equal(result.posts.find((item) => item.id === 'post-1')?.cover?.alt_text, 'Cocina luminosa')
})

test('slug inexistente, borrador y otra empresa no resuelven', async () => {
  const { repository, requests } = setup([
    { ...post, slug: 'borrador', status: 'draft' },
    { ...post, slug: 'otra-empresa', company_id: 'another' },
  ])
  for (const slug of ['inexistente', 'borrador', 'otra-empresa', '../privado']) assert.equal(await repository.get(slug), null)
  assert.equal(requests.length, 3)
  for (const url of requests) {
    assert.equal(url.searchParams.get('company_id'), `eq.${company}`)
    assert.equal(url.searchParams.get('status'), 'eq.published')
  }
})

test('errores de medios no se convierten en un blog vacío', async () => {
  const { repository } = setup([post], [], true)
  await assert.rejects(repository.list())
})

test('preflight detecta artículos antiguos sin slug y duplicados', async () => {
  await assert.rejects(setup([{ ...post, slug: null }]).repository.auditAndSitemap(), /sin slug/)
  await assert.rejects(setup([post, { ...post, id: 'post-2' }]).repository.auditAndSitemap(), /duplicados/)
})

test('HTML inicial incluye artículo, SEO, canonical y Markdown seguro', async () => {
  const template = await readFile('dist/index.html', 'utf8')
  const html = renderBlogDocument(template, 'https://arquelia.es', { posts: [], post, hasMore: false }, 1)
  assert.match(html, /<title>Reformas &quot;Arquelia&quot;<\/title>/)
  assert.match(html, /<link rel="canonical" href="https:\/\/arquelia.es\/blog\/reformas">/)
  assert.match(html, /og:description" content="Consejos &amp; ideas"/)
  assert.match(html, /&lt;Reformas&gt; &amp; diseño/)
  assert.match(html, /<strong>seguro<\/strong>/)
  assert.doesNotMatch(html, /<script>alert|href="javascript:|property="og:image"|googletagmanager/)
  assert.equal((html.match(/<title>/g) ?? []).length, 1)
  assert.match(renderBlogDocument(template, 'https://arquelia.es', { posts: [], hasMore: false }, 1, 404), /noindex, follow/)
})

test('OG usa imagen HTTPS y mantiene alt de medios', async () => {
  const template = await readFile('dist/index.html', 'utf8')
  const cover = { id: 'cover', post_id: post.id, url_externa: 'https://example.com/cover.jpg', title: null, alt_text: 'Cocina luminosa', sort_order: 0, is_cover_image: true }
  const html = renderBlogDocument(template, 'https://arquelia.es', { posts: [], post: { ...post, cover, seo_og_image_url: 'http://insecure.example/og.jpg' }, hasMore: false }, 1)
  assert.match(html, /og:image" content="https:\/\/example.com\/cover.jpg"/)
  assert.match(html, /alt="Cocina luminosa"/)
})

test('handler devuelve 404 real y sitemap sin borradores ni otras empresas', async () => {
  const originalFetch = globalThis.fetch
  const originalEnv = { ...process.env }
  process.env.VITE_SUPABASE_URL = 'https://example.supabase.co'
  process.env.VITE_SUPABASE_ANON_KEY = 'public-anon-key'
  process.env.VITE_ARQUELIA_COMPANY_ID = company
  globalThis.fetch = async (input) => {
    const url = new URL(String(input))
    assert.equal(url.searchParams.get('company_id'), `eq.${company}`)
    assert.equal(url.searchParams.get('status'), 'eq.published')
    return new Response(JSON.stringify(url.pathname.endsWith('/items') || url.searchParams.has('slug') ? [] : [{ slug: 'reformas', updated_at: post.updated_at }]), { headers: { 'Content-Type': 'application/json' } })
  }
  const invoke = async (url: string) => {
    let body = ''
    const res = { statusCode: 200, setHeader() {}, end(value?: string) { body = value ?? '' } }
    await handler({ method: 'GET', url } as IncomingMessage, res as unknown as ServerResponse)
    return { status: res.statusCode, body }
  }
  try {
    assert.equal((await invoke('/api/blog?slug=inexistente')).status, 404)
    const sitemap = await invoke('/api/blog?mode=sitemap')
    assert.match(sitemap.body, /<loc>https:\/\/arquelia.es\/blog\/reformas<\/loc>/)
    assert.doesNotMatch(sitemap.body, /draft|archived|another/)
  } finally {
    globalThis.fetch = originalFetch
    process.env = originalEnv
  }
})
