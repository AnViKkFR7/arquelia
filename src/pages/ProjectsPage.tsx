import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getPublishedProjects } from '../lib/projects'
import { ProjectRow } from '../components/projects/ProjectRow'
import { CtaBand } from '../components/home/CtaBand'
import { PageHero } from '../components/ui/PageHero'
import type { Project } from '../types/project'
import styles from './ProjectsPage.module.css'

export function ProjectsPage() {
  const { t } = useTranslation()
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
        eyebrow={t('projects.hero.eyebrow')}
        title={t('projects.hero.title')}
        lead={t('projects.hero.lead')}
      />

      <div className={styles.rows}>
        {loading && <p className={`container ${styles.loading}`}>{t('projects.loading')}</p>}

        {!loading && projects.length === 0 && (
          <p className={`container ${styles.loading}`}>{t('projects.empty')}</p>
        )}

        {projects.map((p, i) => (
          <ProjectRow key={p.id} project={p} index={i} />
        ))}
      </div>

      <CtaBand title={t('projects.cta.title').toUpperCase()} text={t('projects.cta.text')} />
    </>
  )
}
