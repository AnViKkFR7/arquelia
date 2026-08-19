import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getProjectById, getPublishedProjects } from '../lib/projects'
import { Marquee } from '../components/ui/Marquee'
import { Reveal } from '../components/ui/Reveal'
import { Button } from '../components/ui/Button'
import { CtaBand } from '../components/home/CtaBand'
import type { Project } from '../types/project'
import styles from './ProjectDetailPage.module.css'

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [next, setNext] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)

    Promise.all([getProjectById(id), getPublishedProjects()])
      .then(([current, all]) => {
        setProject(current)
        const i = all.findIndex((p) => p.id === id)
        setNext(i >= 0 && all.length > 1 ? all[(i + 1) % all.length] : null)
      })
      .catch((err) => console.error('Error loading project', err))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className={`container ${styles.state}`}>
        <p>Cargando proyecto…</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className={`container ${styles.state}`}>
        <h1>Proyecto no encontrado</h1>
        <Button to="/proyectos" variant="outline" arrow className={styles.stateCta}>
          Ver todos los proyectos
        </Button>
      </div>
    )
  }

  const stats = [
    project.categoria && {
      value: project.categoria,
      label: 'Tipo de proyecto',
      desc: 'Categoría de la intervención realizada.',
    },
    project.superficieM2 != null && {
      value: `${project.superficieM2} m²`,
      label: 'Superficie',
      desc: 'Superficie total intervenida en el proyecto.',
    },
    project.ubicacion && {
      value: project.ubicacion,
      label: 'Ubicación',
      desc: 'Localización de la vivienda o local reformado.',
    },
    {
      value: 'Llave en mano',
      label: 'Entrega',
      desc: 'Proyecto finalizado y entregado con garantía post-obra.',
    },
  ].filter(Boolean) as { value: string; label: string; desc: string }[]

  const gallery = project.media.filter((m) => m.url !== project.coverUrl)

  return (
    <>
      {/* Hero: imagen + marquesina con el título */}
      <section
        className={styles.hero}
        style={project.coverUrl ? { backgroundImage: `url(${project.coverUrl})` } : undefined}
      >
        <span className={styles.heroScrim} />

        <div className={styles.heroBottom}>
          <div className={styles.marquee}>
            <Marquee text={project.title} separator="◆" speed={52} />
          </div>

          <div className={`container ${styles.stats}`}>
            {stats.map((s, i) => (
              <Reveal key={s.label} variant="up" delay={i * 80} className={styles.stat}>
                <span className={styles.statValue}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
                <span className={styles.statDesc}>{s.desc}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Cuerpo */}
      <section className={`section ${styles.body}`}>
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
                  <h2 className={`eyebrow ${styles.workTitle}`}>Trabajos realizados</h2>
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
              <span className={styles.asideLabel}>Un proyecto parecido</span>
              <p className={styles.asideText}>
                Si te encaja este estilo, podemos estudiar tu espacio y decirte qué es viable y con
                qué presupuesto.
              </p>
              <Button to="/contacto" variant="gold" arrow className={styles.asideCta}>
                Hablemos
              </Button>
            </aside>
          </Reveal>
        </div>
      </section>

      {/* Galería */}
      {gallery.length > 0 && (
        <section className={styles.gallery}>
          <div className={`container ${styles.galleryGrid}`}>
            {gallery.map((m, i) => (
              <Reveal
                key={m.id}
                variant="clip"
                delay={i * 70}
                className={`${styles.shot} ${i % 3 === 0 ? styles.shotWide : ''}`}
              >
                <img src={m.url} alt={m.altText ?? project.title} loading="lazy" />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Siguiente proyecto */}
      {next && (
        <button type="button" className={styles.next} onClick={() => navigate(`/proyectos/${next.id}`)}>
          <span
            className={styles.nextImg}
            style={next.coverUrl ? { backgroundImage: `url(${next.coverUrl})` } : undefined}
          />
          <span className={styles.nextScrim} />
          <span className={styles.nextInner}>
            <span className={`eyebrow ${styles.nextLabel}`}>Siguiente proyecto</span>
            <span className={styles.nextTitle}>{next.title}</span>
          </span>
        </button>
      )}

      <CtaBand plain />
    </>
  )
}
