import { createElement as h } from 'react'
import type { Project } from '../../types/project.js'
import { projectPath } from '../../lib/projectRepository.js'

// Contenido equivalente al detalle React; no requiere router, sesión ni JavaScript.
export function ProjectInitialContent({ project }: { project: Project }) {
  return h('article', null,
    h('a', { href: '/proyectos' }, 'Todos los proyectos'),
    h('h1', null, project.title),
    h('p', null, [project.categoria, project.ubicacion, project.superficieM2 !== null ? `${project.superficieM2} m²` : null].filter(Boolean).join(' · ')),
    project.summary && h('p', null, project.summary),
    project.description && h('p', null, project.description),
    project.whatWasDone.length > 0 && h('section', null, h('h2', null, 'Qué hicimos'),
      h('ul', null, project.whatWasDone.map((text, i) => h('li', { key: i }, text)))),
    h('div', { className: 'project-initial-gallery' }, project.media.map((image) => h('figure', { key: image.id },
      h('img', { src: image.url, alt: image.altText?.trim() || project.title, loading: 'lazy' }),
      image.title && !/\.(webp|jpe?g|png|avif|gif)$/i.test(image.title.trim()) && h('figcaption', null, image.title),
    ))),
    h('a', { href: '/contacto' }, 'Solicitar presupuesto'),
  )
}

export function ProjectInitialList({ projects, page, hasMore }: { projects: Project[]; page: number; hasMore: boolean }) {
  return h('section', null,
    h('h1', null, 'Proyectos de Arquelia'),
    projects.length === 0 && h('p', null, 'Próximamente compartiremos nuevos proyectos.'),
    projects.map((project) => h('article', { key: project.id },
      h('h2', null, h('a', { href: projectPath(project) }, project.title)),
      h('p', null, project.summary || project.description),
      project.coverUrl && h('img', { src: project.coverUrl, alt: project.media.find((image) => image.url === project.coverUrl)?.altText?.trim() || project.title, loading: 'lazy' }),
    )),
    (page > 1 || hasMore) && h('nav', { 'aria-label': 'Paginación' },
      page > 1 && h('a', { href: page === 2 ? '/proyectos' : `/proyectos?page=${page - 1}` }, 'Anterior'),
      h('span', null, page), hasMore && h('a', { href: `/proyectos?page=${page + 1}` }, 'Siguiente'),
    ),
  )
}
