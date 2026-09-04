import type { ReactNode } from 'react'
import styles from './PageHero.module.css'

interface PageHeroProps {
  eyebrow: string
  title: ReactNode
  lead?: ReactNode
  /** Imagen de fondo; si se omite, fondo negro sólido. */
  image?: string
  /** Ocupa toda la altura de pantalla. */
  tall?: boolean
  /** Título a un ancho mayor (hasta ~60% del hero) en vez de los 18ch por
   * defecto — para un titular corto en dos líneas en vez de cuatro. */
  wide?: boolean
}

/** Cabecera común de las páginas interiores. */
export function PageHero({ eyebrow, title, lead, image, tall, wide }: PageHeroProps) {
  return (
    <section
      className={`${styles.hero} ${tall ? styles.tall : ''} ${image ? styles.hasImage : ''}`}
      style={image ? { backgroundImage: `url(${image})` } : undefined}
    >
      {image && <span className={styles.scrim} />}

      <div className={`container ${styles.inner}`}>
        <span className={`eyebrow ${styles.eyebrow}`}>{eyebrow}</span>
        <h1 className={`${styles.title} ${wide ? styles.titleWide : ''}`}>{title}</h1>
        {lead && <p className={styles.lead}>{lead}</p>}
      </div>
    </section>
  )
}
