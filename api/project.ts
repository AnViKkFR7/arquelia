import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createClient } from '@supabase/supabase-js'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { projectMetadata, projectPath, projectRepository, validProjectSlug } from '../src/lib/projectRepository.js'
import { renderSeoDocument, type PageSeo } from '../src/lib/seoDocument.js'
import { ProjectInitialContent, ProjectInitialList } from '../src/components/projects/ProjectInitialContent.js'

export default async function handler(req: IncomingMessage & { query?: Record<string, string | string[] | undefined> }, res: ServerResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET, HEAD')
    return res.end()
  }
  const url = new URL(req.url ?? '/', 'https://arquelia.es')
  const parameter = (name: string) => typeof req.query?.[name] === 'string' ? req.query[name] as string : url.searchParams.get(name)
  const key = parameter('key')
  const page = Math.max(1, Math.min(10000, Math.floor(Number(parameter('page')) || 1)))
  let status = 200
  let body = ''
  let meta: PageSeo = { title: 'Proyectos · Arquelia', description: 'Proyectos de construcción y reformas de Arquelia.', indexable: false }
  try {
    const site = new URL(process.env.VITE_SITE_URL || 'https://arquelia.es')
    if (site.protocol !== 'https:' || site.pathname !== '/' || site.search || site.hash || site.username || site.password) throw new Error('VITE_SITE_URL no es un origen HTTPS')
    const client = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
    const repository = projectRepository(client, process.env.VITE_ARQUELIA_COMPANY_ID!)
    if (key !== null) {
      const project = await repository.get(key)
      if (!project) status = 404
      else {
        if (key !== project.slug && validProjectSlug(project.slug)) {
          res.statusCode = 308
          res.setHeader('Location', `${site.origin}${projectPath(project)}`)
          res.setHeader('Cache-Control', 'no-store')
          return res.end()
        }
        const detail = projectMetadata(project, site.origin)
        meta = { title: detail.title, description: detail.description, canonical: detail.indexable ? detail.url : undefined, image: detail.image, indexable: detail.indexable }
        body = renderToStaticMarkup(createElement(ProjectInitialContent, { project }))
      }
    } else {
      const result = await repository.list(page)
      meta = { ...meta, canonical: `${site.origin}/proyectos${page > 1 ? `?page=${page}` : ''}`, indexable: true }
      body = renderToStaticMarkup(createElement(ProjectInitialList, { ...result, page }))
    }
  } catch (error) {
    console.error('[projects] Error de carga:', error instanceof Error ? error.message : 'Supabase')
    status = 503
  }
  if (status !== 200) {
    meta = { title: status === 404 ? '404 · Arquelia' : 'Proyectos no disponibles · Arquelia', description: '', indexable: false }
    body = status === 404 ? '<h1>Este proyecto no existe</h1><a href="/proyectos">Ver proyectos</a>' : '<h1>No se han podido cargar los proyectos</h1><p>Inténtalo de nuevo en un momento.</p>'
  }
  res.statusCode = status
  // Sin caché compartida: una edición o despublicación se refleja en la siguiente petición.
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  const template = await readFile(join(process.cwd(), 'dist', 'index.html'), 'utf8')
  return res.end(req.method === 'HEAD' ? undefined : renderSeoDocument(template, meta, body))
}
