import { Reveal } from '../ui/Reveal'
import { Button } from '../ui/Button'
import { ProjectCard } from './ProjectCard'
import type { Project } from '../../types/project'
import styles from './FeaturedProjectsShowcase.module.css'

interface FeaturedProjectsShowcaseProps {
  projects: Project[]
}

export function FeaturedProjectsShowcase({ projects }: FeaturedProjectsShowcaseProps) {
  if (projects.length === 0) return null

  return (
    <section className={styles.showcase}>
      <div className={`container ${styles.grid}`}>
        {projects.map((p, i) => (
          <Reveal key={p.id} variant="up" delay={i * 90}>
            <ProjectCard project={p} index={i} />
          </Reveal>
        ))}
      </div>

      <div className={`container ${styles.footer}`}>
        <Reveal variant="fade">
          <Button to="/proyectos" variant="outline" arrow>
            Ver todos los proyectos
          </Button>
        </Reveal>
      </div>
    </section>
  )
}
