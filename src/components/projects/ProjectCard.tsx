import { useNavigate } from 'react-router-dom'
import styles from './ProjectCard.module.css'

import type { Project } from '../../types/project'

interface ProjectCardProps {
  project: Project
  /** Índice mostrado en la esquina, p. ej. "01". */
  index?: number
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      className={styles.card}
      onClick={() => navigate(`/proyectos/${project.id}`)}
      aria-label={`Ver proyecto: ${project.title}`}
    >
      <span className={styles.frame}>
        <span
          className={styles.image}
          style={project.coverUrl ? { backgroundImage: `url(${project.coverUrl})` } : undefined}
        />
        <span className={styles.veil} />

        {index != null && (
          <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>
        )}

        {/* Botón "+" que rota 45° al hover — igual que la referencia */}
        <span className={styles.plus} aria-hidden="true" aria-label='Haz clic para saber más'>
          <span className={styles.plusBar} />
          <span className={`${styles.plusBar} ${styles.plusBarV}`} />
        </span>
      </span>

      <span className={styles.body}>
        <span className={styles.title}>{project.title}</span>
        <span className={styles.meta}>
          {[project.categoria, project.ubicacion].filter(Boolean).join(' · ')}
        </span>
      </span>
    </button>
  )
}
