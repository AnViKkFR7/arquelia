import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import type { Project } from '../../types/project'
import { projectMetadata } from '../../lib/projectRepository'

export function ProjectMeta({ project, failed, loading }: { project: Project | null; failed: boolean; loading: boolean }) {
  const { pathname } = useLocation()
  useEffect(() => {
    const meta = project ? projectMetadata(project, import.meta.env.VITE_SITE_URL || 'https://arquelia.es') : null
    const title = meta?.title ?? (loading ? 'Proyectos · Arquelia' : failed ? 'Proyectos no disponibles · Arquelia' : '404 · Arquelia')
    document.title = title
    const set = (key: string, value?: string, property = false) => {
      const attribute = property ? 'property' : 'name'
      let node = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
      if (!value) { node?.remove(); return }
      if (!node) { node = document.createElement('meta'); node.setAttribute(attribute, key); document.head.appendChild(node) }
      node.content = value
    }
    set('description', meta?.description ?? '')
    set('robots', meta?.indexable ? 'index, follow' : 'noindex, follow')
    set('og:title', title, true)
    set('og:description', meta?.description ?? '', true)
    set('og:url', meta?.indexable ? meta.url : undefined, true)
    set('og:image', meta?.image, true)
    set('og:type', 'website', true)
    set('twitter:card', meta?.image ? 'summary_large_image' : 'summary')
    set('twitter:title', title)
    set('twitter:description', meta?.description ?? '')
    set('twitter:image', meta?.image)
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (meta?.indexable) {
      if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical) }
      canonical.href = meta.url
    } else canonical?.remove()
  }, [project, failed, loading, pathname])
  return null
}
