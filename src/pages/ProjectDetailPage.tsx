import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getProjectById, getPublishedProjects } from '../lib/projects'
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
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [others, setOthers] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

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
    if (!id) return
    setLoading(true)

    Promise.all([getProjectById(id), getPublishedProjects()])
      .then(([current, all]) => {
        setProject(current)
        setOthers(all.filter((p) => p.id !== id).slice(0, 3))
      })
      .catch((err) => console.error('Error loading project', err))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className={`container ${styles.state}`}>
        <p>{t('projectDetail.loading')}</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className={`container ${styles.state}`}>
        <h1>{t('projectDetail.notFound')}</h1>
        <Button to="/proyectos" variant="outline" arrow className={styles.stateCta}>
          {t('projectDetail.seeAll')}
        </Button>
      </div>
    )
  }

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
      {/* Hero: imagen + marquesina con el título */}
      <section
        className={styles.hero}
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
