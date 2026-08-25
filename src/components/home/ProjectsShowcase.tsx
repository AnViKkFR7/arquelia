import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Reveal } from '../ui/Reveal'
import { SectionHeader } from '../ui/SectionHeader'
import styles from './ProjectsShowcase.module.css'

interface ShowcaseItem {
  title: string
  desc: string
}

const IMAGES = [
  '/mockup-images/reforma_atico_integral_mockup.webp',
  '/mockup-images/reforma_cocina_bano_mockup.webp',
  '/mockup-images/rehabilitar_fachadas_mockup_v2.webp',
  '/mockup-images/suelo_parquet_mockup.webp',
]

const ROTATE_MS = 5000

/**
 * Formato "story": una imagen grande que rota entre 4 proyectos cada 5s,
 * con índices clicables debajo (llevan a `/proyectos`) que al pasar el
 * ratón adelantan la previsualización sin alterar la rotación de fondo.
 *
 * En móvil no hay hover ni sitio para cuatro índices con etiqueta, así que
 * pasa a ser un carrusel deslizable de toda la vida (scroll-snap + puntos),
 * mismo patrón que ya usa la cabecera de proyecto en móvil.
 */
export function ProjectsShowcase() {
  const { t } = useTranslation()
  const items = t('home.projectsShowcase.items', { returnObjects: true }) as ShowcaseItem[]

  const [active, setActive] = useState(0)
  const [hovered, setHovered] = useState<number | null>(null)
  const [isNarrow, setIsNarrow] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const apply = () => setIsNarrow(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // La rotación sigue de fondo aunque el ratón esté "espiando" otro índice:
  // al retirar el cursor, vuelve a mostrarse el que le tocase en ese momento.
  useEffect(() => {
    if (isNarrow || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setActive((a) => (a + 1) % items.length), ROTATE_MS)
    return () => clearInterval(id)
  }, [isNarrow, items.length])

  const shown = hovered ?? active

  if (isNarrow) {
    return (
      <section className={`section ${styles.section}`}>
        <div className="container">
          <SectionHeader
            title={t('home.projectsShowcase.title')}
            lead={t('home.projectsShowcase.lead')}
          />
        </div>
        <div className={styles.carousel}>
          {items.map((item, i) => (
            <Link key={item.title} to="/proyectos" className={styles.slide}>
              <span className={styles.slideImg} style={{ backgroundImage: `url(${IMAGES[i]})` }} />
              <span className={styles.slideVeil} />
              <span className={styles.slideMeta}>
                <span className={styles.slideIndex}>{String(i + 1).padStart(2, '0')}</span>
                <span className={styles.slideTitle}>{item.title}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <SectionHeader
          title={t('home.projectsShowcase.title')}
          lead={t('home.projectsShowcase.lead')}
        />
      </div>

      <div className="container">
        <Reveal variant="up">
          {/* `.stage` es un <div>, no un <Link>: los índices de abajo viven
              dentro de la misma imagen y también son enlaces, y un <a>
              dentro de otro <a> es HTML inválido (el navegador los
              reordena y rompe el click). El enlace grande y los índices son
              hermanos, cada uno con su propio <Link>. */}
          <div className={styles.stage}>
            <Link
              to="/proyectos"
              className={styles.stageLink}
              style={{ backgroundImage: `url(${IMAGES[shown]})` }}
              aria-label={t('home.projectsShowcase.seeAllAria')}
            >
              <span className={styles.stageScrim} />
              <span className={styles.stageIndex}>{String(shown + 1).padStart(2, '0')}</span>
              <span className={styles.stageMeta}>
                <span className={styles.stageTitle}>{items[shown].title}</span>
                <span className={styles.stageDesc}>{items[shown].desc}</span>
              </span>
            </Link>

            <ul className={styles.chips} onMouseLeave={() => setHovered(null)}>
              {items.map((item, i) => (
                <li key={item.title}>
                  <Link
                    to="/proyectos"
                    className={styles.chip}
                    aria-current={active === i ? 'true' : undefined}
                    onMouseEnter={() => setHovered(i)}
                    onFocus={() => setHovered(i)}
                    onBlur={() => setHovered(null)}
                  >
                    <span className={styles.chipTrack}>
                      {active === i && <span key={active} className={styles.chipFill} />}
                    </span>
                    <span className={styles.chipLabel}>{item.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
