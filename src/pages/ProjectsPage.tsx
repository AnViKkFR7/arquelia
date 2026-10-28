import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { getPublishedProjectPage } from '../lib/projects'
import { PROJECT_PAGE_SIZE } from '../lib/projectRepository'
import { ProjectRow } from '../components/projects/ProjectRow'
import { CtaBand } from '../components/home/CtaBand'
import { PageHero } from '../components/ui/PageHero'
import type { Project } from '../types/project'
import styles from './ProjectsPage.module.css'

export function ProjectsPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const page = Math.max(1, Math.min(10000, Math.floor(Number(params.get('page')) || 1)))
  const [retry, setRetry] = useState(0)
  const requestKey = `${page}:${retry}`
  const [loaded, setLoaded] = useState<{ key: string; projects: Project[]; hasMore: boolean; failed: boolean }>()
  const current = loaded?.key === requestKey ? loaded : undefined
  const projects = current?.projects ?? []
  const loading = !current

  useEffect(() => {
    let active = true
    getPublishedProjectPage(page)
      .then((result) => { if (active) setLoaded({ ...result, key: requestKey, failed: false }) })
      .catch(() => { if (active) setLoaded({ key: requestKey, projects: [], hasMore: false, failed: true }) })
    window.scrollTo({ top: 0, behavior: 'instant' })
    return () => { active = false }
  }, [page, requestKey])

  return (
    <>
      <PageHero
        eyebrow={t('projects.hero.eyebrow')}
        title={t('projects.hero.title')}
        lead={t('projects.hero.lead')}
      />

      <div className={styles.rows}>
        {loading && <p className={`container ${styles.loading}`}>{t('projects.loading')}</p>}

        {current?.failed && <div role="alert" className={`container ${styles.loading}`}>
          <p>{t('projects.loadError')}</p><button onClick={() => setRetry((value) => value + 1)}>{t('projects.retry')}</button>
        </div>}
        {!loading && !current?.failed && projects.length === 0 && (
          <p className={`container ${styles.loading}`}>{t('projects.empty')}</p>
        )}

        {projects.map((p, i) => (
          <ProjectRow key={p.id} project={p} index={(page - 1) * PROJECT_PAGE_SIZE + i} />
        ))}
      </div>
      {!loading && !current?.failed && (page > 1 || current?.hasMore) && <nav className={styles.pagination} aria-label={t('projects.pagination')}>
        {page > 1 && <Link to={page === 2 ? '/proyectos' : `/proyectos?page=${page - 1}`}>{t('projects.previous')}</Link>}
        <span>{page}</span>{current?.hasMore && <Link to={`/proyectos?page=${page + 1}`}>{t('projects.next')}</Link>}
      </nav>}

      <CtaBand title={t('projects.cta.title').toUpperCase()} text={t('projects.cta.text')} />
    </>
  )
}
