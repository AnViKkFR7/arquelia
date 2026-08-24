import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Marquee } from '../ui/Marquee'
import { Reveal } from '../ui/Reveal'
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
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (projects.length === 0) return null

  const [featured] = projects

  // Los laterales son planos de detalle (atmósfera), no portadas de proyecto:
  // así el mosaico no repite lo que ya muestran las tarjetas de abajo.
  const sideImages = filler

  return (
    <section className={styles.section}>
      <div className={`container ${styles.head}`}>
        <Reveal variant="fade" once={false}>
          <span className="eyebrow">
            <span className={styles.index}>02</span> {t('home.mosaic.eyebrow')}
          </span>
        </Reveal>
      </div>

      <div className={`container ${styles.mosaic}`}>
        {/* Columna izquierda */}
        <div className={`${styles.col} ${styles.colLeft}`}>
          <Reveal variant="up" className={styles.tile} once={false}>
            <span className={styles.tileImg} style={{ backgroundImage: `url(${sideImages[0]})` }} />
          </Reveal>
          <Reveal variant="up" delay={120} className={`${styles.tile} ${styles.tileWide}`} once={false}>
            <span className={styles.tileImg} style={{ backgroundImage: `url(${sideImages[1]})` }} />
          </Reveal>
        </div>

        {/* Destacado central */}
        <Reveal variant="up" delay={140} className={styles.featuredWrap} once={false}>
          <button
            type="button"
            className={styles.featured}
            onClick={() => navigate(`/proyectos/${featured.id}`)}
            aria-label={t('common.seeAria', { title: featured.title })}
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
              <Marquee small text={t('home.mosaic.clickToSee')} separator="◆" speed={48} />
            </span>
          </button>
        </Reveal>

        {/* Columna derecha */}
        <div className={`${styles.col} ${styles.colRight}`}>
          <Reveal variant="up" delay={80} className={`${styles.tile} ${styles.tileWide}`} once={false}>
            <span className={styles.tileImg} style={{ backgroundImage: `url(${sideImages[2]})` }} />
          </Reveal>
          <Reveal variant="up" delay={180} className={styles.tile} once={false}>
            <span className={styles.tileImg} style={{ backgroundImage: `url(${sideImages[3]})` }} />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
