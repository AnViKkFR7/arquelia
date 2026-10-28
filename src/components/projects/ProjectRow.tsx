import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useInView } from '../../hooks/useInView'
import { Button } from '../ui/Button'
import type { Project } from '../../types/project'
import { projectPath } from '../../lib/projectRepository'
import styles from './ProjectRow.module.css'

interface ProjectRowProps {
  project: Project
  index: number
}

/**
 * Fila de proyecto: mitad texto sobre fondo sólido, mitad imagen.
 * Alterna el lado en cada índice — patrón "Private Courtyard" de la referencia.
 */
export function ProjectRow({ project, index }: ProjectRowProps) {
  const { t } = useTranslation()
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.12 })
  const reversed = index % 2 === 1

  const meta = [
    project.categoria,
    project.ubicacion,
    project.superficieM2 != null ? `${project.superficieM2} m²` : null,
  ].filter(Boolean)

  return (
    <article
      ref={ref}
      className={`${styles.row} ${reversed ? styles.reversed : ''} ${inView ? styles.in : ''}`}
    >
      <div className={styles.panel}>
        <span className={styles.index}>{String(index + 1).padStart(2, '0')}</span>

        <h2 className={styles.title}>{project.title}</h2>

        {meta.length > 0 && (
          <ul className={styles.meta}>
            {meta.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        )}

        {project.description && <p className={styles.desc}>{project.description}</p>}

        <Button variant="link" arrow to={projectPath(project)} className={styles.cta}>
          {t('common.seeProject')}
        </Button>
      </div>

      <Link
        to={projectPath(project)}
        className={styles.media}
        aria-label={t('common.seeAria', { title: project.title })}
      >
        <span
          className={styles.image}
          style={project.coverUrl ? { backgroundImage: `url(${project.coverUrl})` } : undefined}
        />
        <span className={styles.plus} aria-hidden="true">
          <span className={styles.plusBar} />
          <span className={`${styles.plusBar} ${styles.plusBarV}`} />
        </span>
      </Link>
    </article>
  )
}
