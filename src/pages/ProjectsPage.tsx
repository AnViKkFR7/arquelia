import { useEffect, useState } from 'react'
import { getPublishedProjects } from '../lib/projects'
import { ProjectRow } from '../components/projects/ProjectRow'
import { CtaBand } from '../components/home/CtaBand'
import { PageHero } from '../components/ui/PageHero'
import type { Project } from '../types/project'
import styles from './ProjectsPage.module.css'

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPublishedProjects()
      .then(setProjects)
      .catch((err) => console.error('Error loading projects', err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <PageHero
        eyebrow="Proyectos"
        title="Reformas que hablan por sí solas"
        lead="Una selección de obras entregadas en Barcelona y alrededores. Cada una con su propio carácter, todas con el mismo estándar de ejecución."
      />

      <div className={styles.rows}>
        {loading && <p className={`container ${styles.loading}`}>Cargando proyectos…</p>}

        {!loading && projects.length === 0 && (
          <p className={`container ${styles.loading}`}>
            Aún no hay proyectos publicados. Vuelve pronto.
          </p>
        )}

        {projects.map((p, i) => (
          <ProjectRow key={p.id} project={p} index={i} />
        ))}
      </div>

      <CtaBand
        title="¿Quieres algo así en tu casa?"
        text="Cada proyecto empieza con una visita. Cuéntanos qué tienes en mente y te preparamos una propuesta a medida."
      />
    </>
  )
}
