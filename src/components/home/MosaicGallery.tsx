import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Marquee } from '../ui/Marquee'
import { Reveal } from '../ui/Reveal'
import { usePinProgress } from '../../hooks/usePinProgress'
import type { Project } from '../../types/project'
import styles from './MosaicGallery.module.css'

import pasillo01 from '../../assets/pasillo_01.jpg'
import cocina01 from '../../assets/cocina_01.jpg'
import aseo01 from '../../assets/aseo_01.jpg'
import pasillo02 from '../../assets/pasillo_02.jpg'

/** Relleno de textura cuando aún no hay suficientes proyectos publicados. */
const filler = [pasillo01, cocina01, aseo01, pasillo02]

/**
 * Cuánto del recorrido anclado se reserva antes de empezar a crecer, para
 * dar tiempo a que terminen las animaciones de entrada (700ms) de las
 * tarjetas laterales. No depende de ellas literalmente: es un margen que
 * a ritmo normal de scroll sobra de sobra.
 */
const SETTLE = 0.16
/** Alto extra del recorrido anclado, en pantallas, además de la que se ve. */
const GROW_SPAN = 0.85
/** Fracción del ancho de la sección que debe cubrir la tarjeta al crecer del todo. */
const TARGET_WIDTH_RATIO = 0.8

interface MosaicGalleryProps {
  projects: Project[]
}

export function MosaicGallery({ projects }: MosaicGalleryProps) {
  const navigate = useNavigate()
  const mosaicRef = useRef<HTMLDivElement | null>(null)
  const featuredRef = useRef<HTMLButtonElement | null>(null)

  // El efecto de "anclar y crecer" sólo tiene sentido en el layout de 3
  // columnas (≥900px): ahí la tarjeta destacada ocupa ~47% del ancho de
  // forma natural, así que crecer hasta el 80% es un crecimiento real. En
  // tablet ya ocupa el 100% del ancho (grid-column: 1 / -1) y en móvil se
  // apila a ancho completo: "crecer hasta el 80%" ahí sería encogerla.
  const [pinEnabled, setPinEnabled] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)')
    const apply = () => setPinEnabled(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const { ref: pinRef, progress } = usePinProgress<HTMLElement>([pinEnabled])

  // Cuánto hay que escalar la tarjeta para que su ancho natural (sin
  // escalar) llegue al 80% del ancho del mosaico. Se mide con offsetWidth,
  // que no varía con `transform`, así que sirve de referencia estable.
  const [targetScale, setTargetScale] = useState(1)
  useEffect(() => {
    if (!pinEnabled) return

    const measure = () => {
      const containerWidth = mosaicRef.current?.offsetWidth
      const naturalWidth = featuredRef.current?.offsetWidth
      if (!containerWidth || !naturalWidth) return
      setTargetScale(Math.max((containerWidth * TARGET_WIDTH_RATIO) / naturalWidth, 1))
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [pinEnabled])

  if (projects.length === 0) return null

  const [featured] = projects

  const growProgress = Math.max(progress - SETTLE, 0) / (1 - SETTLE)
  const scale = pinEnabled ? 1 + (targetScale - 1) * Math.min(growProgress, 1) : 1

  // Los laterales son planos de detalle (atmósfera), no portadas de proyecto:
  // así el mosaico no repite lo que ya muestran las tarjetas de abajo.
  const sideImages = filler

  const content = (
    <>
      <div className={`container ${styles.head}`}>
        <Reveal variant="fade" once={false}>
          <span className="eyebrow">
            <span className={styles.index}>02</span> Proyectos
          </span>
        </Reveal>
      </div>

      <div ref={mosaicRef} className={`container ${styles.mosaic}`}>
        {/* Columna izquierda */}
        <div className={`${styles.col} ${styles.colLeft}`}>
          <Reveal variant="up" className={styles.tile} once={false}>
            <span className={styles.tileImg} style={{ backgroundImage: `url(${sideImages[0]})` }} />
          </Reveal>
          <Reveal variant="up" delay={120} once={false} className={`${styles.tile} ${styles.tileWide}`}>
            <span className={styles.tileImg} style={{ backgroundImage: `url(${sideImages[1]})` }} />
          </Reveal>
        </div>

        {/* Destacado central */}
        <Reveal variant="up" delay={140} once={false} className={styles.featuredWrap}>
          <button
            ref={featuredRef}
            type="button"
            className={styles.featured}
            style={{ transform: `scale(${scale})` }}
            onClick={() => navigate(`/proyectos/${featured.id}`)}
            aria-label={`Ver ${featured.title}`}
          >
            <span
              className={styles.featuredImg}
              style={featured.coverUrl ? { backgroundImage: `url(${featured.coverUrl})` } : undefined}
            />
            <span className={styles.featuredScrim} />

            <span className={styles.featuredMeta}>
              <span className={styles.featuredTitle}>{featured.title}</span>
              {featured.ubicacion && <span className={styles.featuredLoc}>{featured.ubicacion}</span>}
            </span>

            <span className={styles.featuredMarquee}>
              <Marquee small text="Haz clic para ver la reforma en detalle" separator="◆" speed={48} />
            </span>
          </button>
        </Reveal>

        {/* Columna derecha */}
        <div className={`${styles.col} ${styles.colRight}`}>
          <Reveal variant="up" delay={80} once={false} className={`${styles.tile} ${styles.tileWide}`}>
            <span className={styles.tileImg} style={{ backgroundImage: `url(${sideImages[2]})` }} />
          </Reveal>
          <Reveal variant="up" delay={180} once={false} className={styles.tile}>
            <span className={styles.tileImg} style={{ backgroundImage: `url(${sideImages[3]})` }} />
          </Reveal>
        </div>
      </div>
    </>
  )

  if (!pinEnabled) {
    return <section className={styles.section}>{content}</section>
  }

  return (
    <section
      ref={pinRef}
      className={styles.pinSection}
      style={{ height: `${(1 + GROW_SPAN) * 100}svh` }}
    >
      <div className={styles.stage}>{content}</div>
    </section>
  )
}
