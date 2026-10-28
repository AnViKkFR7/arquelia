import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getProjectByKey, getPublishedProjects } from '../lib/projects'
import { projectPath, validProjectSlug } from '../lib/projectRepository'
import { ProjectMeta } from '../components/projects/ProjectMeta'
import { NotFoundPage } from './NotFoundPage'
import { Reveal } from '../components/ui/Reveal'
import { Button } from '../components/ui/Button'
import { SectionHeader } from '../components/ui/SectionHeader'
import { ProjectCard } from '../components/projects/ProjectCard'
import { ProjectGallery } from '../components/projects/ProjectGallery'
import { CtaBand } from '../components/home/CtaBand'
import type { Project } from '../types/project'
import styles from './ProjectDetailPage.module.css'
import ButtonSlider from '../components/ui/ButtonSlider'

export function ProjectDetailPage() {
  const { t } = useTranslation()
  const { key = '' } = useParams<{ key: string }>()
  const [retry, setRetry] = useState(0)
  const requestKey = `${key}:${retry}`
  const [result, setResult] = useState<{ key: string; project: Project | null; others: Project[]; failed: boolean }>()
  const current = result?.key === requestKey ? result : undefined
  const project = current?.project ?? null
  const others = current?.others ?? []
  const loading = !current

  // En móvil la cabecera cambia de forma (tira deslizable en horizontal), y eso
  // hay que saberlo también en JS: ahí las tarjetas no llevan revelado, porque
  // se recorren en horizontal y el revelado va ligado al scroll vertical.
  const [isNarrow, setIsNarrow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 559px)')
    const apply = () => setIsNarrow(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    let active = true
    Promise.all([getProjectByKey(key), getPublishedProjects()])
      .then(([current, all]) => {
        if (active) setResult({ key: requestKey, project: current, others: all.filter((p) => p.id !== current?.id).slice(0, 3), failed: false })
      })
      .catch(() => { if (active) setResult({ key: requestKey, project: null, others: [], failed: true }) })
    return () => { active = false }
  }, [key, requestKey])

  if (loading) {
    return (
      <div className={`container ${styles.state}`}>
        <ProjectMeta project={null} failed={false} loading />
        <p>{t('projectDetail.loading')}</p>
      </div>
    )
  }

  if (current?.failed) {
    return (
      <div className={`container ${styles.state}`}>
        <ProjectMeta project={null} failed loading={false} />
        <p role="alert">{t('projects.loadError')}</p>
        <Button variant="outline" onClick={() => setRetry((value) => value + 1)}>{t('projects.retry')}</Button>
      </div>
    )
  }
  if (!project) return <><ProjectMeta project={null} failed={false} loading={false} /><NotFoundPage /></>
  if (validProjectSlug(project.slug) && key !== project.slug) return <Navigate to={projectPath(project)} replace />

  const stats = [
    project.categoria && {
      value: project.categoria,
      label: t('projectDetail.stats.typeLabel'),
      desc: t('projectDetail.stats.typeDesc'),
    },
    project.superficieM2 != null && {
      value: `${project.superficieM2} m²`,
      label: t('projectDetail.stats.surfaceLabel'),
      desc: t('projectDetail.stats.surfaceDesc'),
    },
    project.ubicacion && {
      value: project.ubicacion,
      label: t('projectDetail.stats.locationLabel'),
      desc: t('projectDetail.stats.locationDesc'),
    },
    {
      value: t('projectDetail.stats.deliveryValue'),
      label: t('projectDetail.stats.deliveryLabel'),
      desc: t('projectDetail.stats.deliveryDesc'),
    },
  ].filter(Boolean) as { value: string; label: string; desc: string }[]

  return (
    <>
      <ProjectMeta project={project} failed={false} loading={false} />
      {/* Hero: imagen + marquesina con el título */}
      <section
        className={styles.hero}
        data-lead-item={`${project.title} · ${project.slug || project.id}`}
        style={project.coverUrl ? { backgroundImage: `url(${project.coverUrl})` } : undefined}
      >
        <span className={styles.heroScrim} />
        <div className={`container ${styles.heroTitleContainer}`}>
          <Reveal variant="fade">
            <h1 className={styles.heroTitle}>{project.title}</h1>
          </Reveal>
        </div>
        <div className={styles.heroBottom}>

          {isNarrow && stats.length > 1 && (
            <div className="container">
              <span className={styles.swipeHint}>
                {t('projectDetail.stats.swipe')}
                <span className={styles.swipeArrow} aria-hidden="true" />
              </span>
            </div>
          )}

          <div className={`container ${styles.stats}`}>
            {stats.map((s) => {
              const content = (
                <>
                  <span className={styles.statValue}>{s.value}</span>
                  <span className={styles.statLabel}>{s.label}</span>
                  <span className={styles.statDesc}>{s.desc}</span>
                </>
              )
              return isNarrow ? (
                <div key={s.label} className={styles.stat}>
                  {content}
                </div>
              ) : (
                <div key={s.label} className={styles.stat}>
                  {content}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Cuerpo */}
      <section className={`section ${styles.body}`}>
        <div className={`container ${styles.descriptionHead}`}>
          <Reveal variant="fade">
            <span className="eyebrow">{t('projectDetail.description')}</span>
          </Reveal>
        </div>
        <div className={`container ${styles.bodyGrid}`}>
          <div>
            {project.summary && project.summary !== project.description && <p className={`lead ${styles.description}`}>{project.summary}</p>}
            {project.description && (
              <Reveal variant="up">
                <p className={`lead ${styles.description}`}>{project.description}</p>
              </Reveal>
            )}

            {project.whatWasDone.length > 0 && (
              <div className={styles.work}>
                <Reveal variant="fade">
                  <h2 className={`eyebrow ${styles.workTitle}`}>{t('projectDetail.workDone')}</h2>
                </Reveal>
                <ul className={styles.workList}>
                  {project.whatWasDone.map((item, i) => (
                    <Reveal key={item} variant="up" delay={i * 50} as="li">
                      <span className={styles.workIndex}>{String(i + 1).padStart(2, '0')}</span>
                      {item}
                    </Reveal>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <Reveal variant="up" delay={120}>
            <aside className={styles.aside}>
              <span className={styles.asideLabel}>{t('projectDetail.aside.label')}</span>
              <p className={styles.asideText}>{t('projectDetail.aside.text')}</p>
              {/* ButtonSlider no reenvía props arbitrarias al <a> interno — el
                  atributo va en el contenedor porque la detección de clics es
                  delegada (`closest('[data-track-event]')`), igual que en
                  FinalCta.tsx. */}
              <div className={styles.asideCta} data-track-event="clic_ir_a_contacto_arquelia">
                <ButtonSlider to="/contacto" text={t('projectDetail.aside.cta')} ></ButtonSlider>
              </div>
            </aside>
          </Reveal>
        </div>
      </section>

      {/* Galería: todas las imágenes, incluida la portada, para que no quede
          ninguna sin poder verse a tamaño completo. */}
      {project.media.length > 0 && (
        <section className={styles.gallery}>
          <div className={`container ${styles.galleryHead}`}>
            <Reveal variant="fade">
              <span className="eyebrow">{t('projectDetail.gallery.eyebrow')}</span>
            </Reveal>
          </div>
          <ProjectGallery media={project.media} title={project.title} />
        </section>
      )}

      {/* Otros proyectos */}
      {others.length > 0 && (
        <section className={`section ${styles.more}`}>
          <div className="container">
            <SectionHeader title={t('projectDetail.more.title')} />
            <div className={styles.moreGrid}>
              {others.map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaBand plain />
    </>
  )
}
