import { useTranslation } from 'react-i18next'
import { Reveal } from '../ui/Reveal'
import { ProjectCard } from './ProjectCard'
import type { Project } from '../../types/project'
import styles from './FeaturedProjectsShowcase.module.css'
import ButtonSlider from '../ui/ButtonSlider'

interface FeaturedProjectsShowcaseProps {
  projects: Project[]
}

export function FeaturedProjectsShowcase({ projects }: FeaturedProjectsShowcaseProps) {
  const { t } = useTranslation()
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
          <ButtonSlider to="/proyectos" text={t('home.showcase.seeAll')} />
        </Reveal>
      </div>
    </section>
  )
}
