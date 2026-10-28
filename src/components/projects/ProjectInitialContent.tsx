import * as React from 'react'
import type { Project } from '../../types/project.js'
import { projectPath } from '../../lib/projectRepository.js'

// Contenido equivalente al detalle React; no requiere router, sesión ni JavaScript.
export function ProjectInitialContent({ project }: { project: Project }) {
  return React.createElement('article', null,
    <a href="/proyectos">Todos los proyectos</a>,
    <h1>{project.title}</h1>,
    <p>{[project.categoria, project.ubicacion, project.superficieM2 !== null ? `${project.superficieM2} m²` : null].filter(Boolean).join(' · ')}</p>,
    project.summary && <p>{project.summary}</p>,
    project.description && <p>{project.description}</p>,
    project.whatWasDone.length > 0 && <section><h2>Qué hicimos</h2><ul>{project.whatWasDone.map((text, i) => <li key={i}>{text}</li>)}</ul></section>,
    <div className="project-initial-gallery">{project.media.map((image) => <figure key={image.id}>
      <img src={image.url} alt={image.altText?.trim() || project.title} loading="lazy" />
      {image.title && !/\.(webp|jpe?g|png|avif|gif)$/i.test(image.title.trim()) && <figcaption>{image.title}</figcaption>}
    </figure>)}</div>,
    <a href="/contacto">Solicitar presupuesto</a>,
  )
}

export function ProjectInitialList({ projects, page, hasMore }: { projects: Project[]; page: number; hasMore: boolean }) {
  return <section><h1>Proyectos de Arquelia</h1>
    {projects.length === 0 && <p>Próximamente compartiremos nuevos proyectos.</p>}
    {projects.map((project) => <article key={project.id}>
      <h2><a href={projectPath(project)}>{project.title}</a></h2>
      <p>{project.summary || project.description}</p>
      {project.coverUrl && <img src={project.coverUrl} alt={project.media.find((image) => image.url === project.coverUrl)?.altText?.trim() || project.title} loading="lazy" />}
    </article>)}
    {(page > 1 || hasMore) && <nav aria-label="Paginación">
      {page > 1 && <a href={page === 2 ? '/proyectos' : `/proyectos?page=${page - 1}`}>Anterior</a>}
      <span>{page}</span>{hasMore && <a href={`/proyectos?page=${page + 1}`}>Siguiente</a>}
    </nav>}
  </section>
}
