import { useNavigate } from 'react-router-dom'
import { Marquee } from '../ui/Marquee'
import { Reveal } from '../ui/Reveal'
import { useScrollProgress } from '../../hooks/useScrollProgress'
import type { Project } from '../../types/project'
import styles from './MosaicGallery.module.css'

import pasillo01 from '../../assets/pasillo_01.jpg'
import cocina01 from '../../assets/cocina_01.jpg'
import aseo01 from '../../assets/aseo_01.jpg'
import pasillo02 from '../../assets/pasillo_02.jpg'

/** Relleno de textura cuando aún no hay suficientes proyectos publicados. */
const filler = [pasillo01, cocina01, aseo01, pasillo02]

interface MosaicGalleryProps {
  projects: Project[]
}

export function MosaicGallery({ projects }: MosaicGalleryProps) {
  const navigate = useNavigate()
  const { ref, progress } = useScrollProgress<HTMLDivElement>()

  if (projects.length === 0) return null

  const [featured] = projects

  // La imagen destacada crece según cruza el viewport (0.9 → 1) y se detiene al centro.
  const scale = 0.9 + Math.min(progress / 0.55, 1) * 0.1

  // Los laterales son planos de detalle (atmósfera), no portadas de proyecto:
  // así el mosaico no repite lo que ya muestran las tarjetas de abajo.
  const sideImages = filler

  return (
    <section className={styles.section}>
      <div className={`container ${styles.head}`}>
        <Reveal variant="fade">
          <span className="eyebrow">
            <span className={styles.index}>02</span> Proyectos
          </span>
        </Reveal>
      </div>

      <div className={`container ${styles.mosaic}`}>
        {/* Columna izquierda */}
        <div className={`${styles.col} ${styles.colLeft}`}>
          <Reveal variant="up" className={styles.tile}>
            <span className={styles.tileImg} style={{ backgroundImage: `url(${sideImages[0]})` }} />
          </Reveal>
          <Reveal variant="up" delay={120} className={`${styles.tile} ${styles.tileWide}`}>
            <span className={styles.tileImg} style={{ backgroundImage: `url(${sideImages[1]})` }} />
          </Reveal>
        </div>

        {/* Destacado central */}
        <div ref={ref} className={styles.featuredWrap}>
          <button
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
              {featured.ubicacion && (
                <span className={styles.featuredLoc}>{featured.ubicacion}</span>
              )}
            </span>

            <span className={styles.featuredMarquee}>
              <Marquee
                small
                text="Haz clic para ver la reforma en detalle"
                separator="◆"
                speed={48}
              />
            </span>
          </button>
        </div>

        {/* Columna derecha */}
        <div className={`${styles.col} ${styles.colRight}`}>
          <Reveal variant="up" delay={80} className={`${styles.tile} ${styles.tileWide}`}>
            <span className={styles.tileImg} style={{ backgroundImage: `url(${sideImages[2]})` }} />
          </Reveal>
          <Reveal variant="up" delay={180} className={styles.tile}>
            <span className={styles.tileImg} style={{ backgroundImage: `url(${sideImages[3]})` }} />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
