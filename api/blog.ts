import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createClient } from '@supabase/supabase-js'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { blogMetadata, blogRepository } from '../src/lib/blogRepository.js'
import type { BlogPost } from '../src/lib/blogRepository.js'
import { BlogContent } from '../src/components/blog/BlogContent.js'
import { projectRepository } from '../src/lib/projectRepository.js'

export const escapeAttribute = (value: string) => value.replace(/[&<>"']/g, (char) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)

export function renderBlogDocument(template: string, siteUrl: string, result: {
  posts: BlogPost[]; post?: BlogPost; hasMore: boolean
}, page: number, status = 200) {
  const meta = blogMetadata(result.post ?? null, siteUrl, page)
  const title = status === 404 ? '404 · Arquelia' : status === 503 ? 'Blog no disponible · Arquelia' : meta.title
  // Elimina los valores de portada para no entregar etiquetas duplicadas.
  let html = template.replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*(?:name=["'](?:description|robots|twitter:[^"']+)["']|property=["']og:[^"']+["'])[^>]*>/gi, '')
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, '')
  const tags = `<title>${escapeAttribute(title)}</title>
    <meta name="description" content="${escapeAttribute(meta.description)}">
    <meta name="robots" content="${status === 200 ? 'index, follow' : 'noindex, follow'}">
    <link rel="canonical" href="${escapeAttribute(meta.url)}">
    <meta property="og:type" content="${result.post ? 'article' : 'website'}">
    <meta property="og:title" content="${escapeAttribute(title)}">
    <meta property="og:description" content="${escapeAttribute(meta.description)}">
    <meta property="og:url" content="${escapeAttribute(meta.url)}">
    ${meta.image ? `<meta property="og:image" content="${escapeAttribute(meta.image)}">` : ''}`
  const body = status === 404 ? '<h1>Esta página no existe</h1><a href="/blog">Volver al blog</a>'
    : status === 503 ? '<h1>No se ha podido cargar el blog</h1><p>Inténtalo de nuevo en un momento.</p>'
    : renderToStaticMarkup(createElement(BlogContent, { ...result, page }))
  html = html.replace('</head>', `${tags}</head>`)
  return html.replace('<div id="root"></div>', () => `<div id="root"><main class="blog-page container">${body}</main></div>`)
}

export default async function handler(req: IncomingMessage & { query?: Record<string, string | string[] | undefined> }, res: ServerResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    res.statusCode = 405
    return res.end()
  }
  const url = new URL(req.url ?? '/', 'https://arquelia.es')
  // Vercel puede proporcionar los parámetros del rewrite en req.query.
  const parameter = (key: string) => typeof req.query?.[key] === 'string' ? req.query[key] as string : url.searchParams.get(key)
  const siteUrl = (process.env.VITE_SITE_URL || 'https://arquelia.es').replace(/\/$/, '')
  const page = Math.max(1, Math.min(10000, Number(parameter('page')) || 1)) | 0
  const slug = parameter('slug')
  const sitemap = parameter('mode') === 'sitemap'
  let status = 200
  let result: { posts: BlogPost[]; post?: BlogPost; hasMore: boolean } = { posts: [], hasMore: false }
  try {
    // Solo credenciales públicas; el tenant viene de la configuración del sitio.
    const client = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const repository = blogRepository(client, process.env.VITE_ARQUELIA_COMPANY_ID!)
    if (sitemap) {
      const canonicalSite = new URL(siteUrl)
      if (canonicalSite.protocol !== 'https:' || canonicalSite.pathname !== '/' || canonicalSite.search || canonicalSite.hash || canonicalSite.username || canonicalSite.password) throw new Error('VITE_SITE_URL no es un origen HTTPS')
      const posts = await repository.auditAndSitemap()
      const projects = await projectRepository(client, process.env.VITE_ARQUELIA_COMPANY_ID!).sitemap()
      const paths = ['/', '/servicios', '/proyectos', '/sobre-nosotros', '/contacto', '/blog', ...posts.map((post) => `/blog/${post.slug}`), ...projects.map((project) => `/proyectos/${project.slug}`)]
      const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${escapeAttribute(siteUrl + path)}</loc></url>`).join('')}</urlset>`
      res.setHeader('Content-Type', 'application/xml; charset=utf-8')
      res.setHeader('Cache-Control', 'no-store')
      return res.end(req.method === 'HEAD' ? undefined : xml)
    }
    if (slug !== null) {
      const post = await repository.get(slug)
      if (!post) status = 404
      else result.post = post
    } else {
      // El preflight no oculta silenciosamente artículos antiguos sin slug.
      await repository.auditAndSitemap()
      result = await repository.list(page)
    }
  } catch (error) {
    console.error('[blog] Error de carga:', error instanceof Error ? error.message : 'Supabase')
    status = 503
  }
  res.statusCode = status
  res.setHeader('Cache-Control', status === 200 ? 'public, s-maxage=60' : 'no-store')
  if (sitemap) return res.end('Sitemap unavailable')
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  const template = await readFile(join(process.cwd(), 'dist', 'index.html'), 'utf8')
  const html = renderBlogDocument(template, siteUrl, result, page, status)
  return res.end(req.method === 'HEAD' ? undefined : html)
}
