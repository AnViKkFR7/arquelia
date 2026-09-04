import { useState } from 'react'
import styles from './FeaturedServiceCard.module.css'

interface FeaturedServiceCardProps {
  title: string
  desc: string
  image: string
  hasArrow?: boolean
}

/**
 * Mismo estilo base que las tarjetas de "Nuestros servicios" en portada
 * (imagen, título arriba a la izquierda con flecha) — pedido explícito,
 * para que no fueran un componente aparte con otra estética. Para que no
 * fueran exactamente iguales: al hacer hover se oscurece con un tinte
 * radial (mismo recurso que la viñeta del hero) y aparece una descripción
 * breve desde abajo.
 */
export function FeaturedServiceCard({ title, desc, image, hasArrow }: FeaturedServiceCardProps) {
  // En táctil no hay hover, así que el toque hace de interruptor — mismo
  // patrón que ya usaba el componente anterior de esta sección.
  const [active, setActive] = useState(false)

  return (
    <article
      className={`${styles.card} ${active ? styles.isActive : ''}`}
      style={{ backgroundImage: `url(${image})` }}
      onClick={() => setActive((a) => !a)}
    >
      <span className={styles.veil} />
      <span className={styles.tint} aria-hidden="true" />

      <span className={styles.title}>
        {title}
        {hasArrow && (
          <span className={styles.arrow} aria-hidden="true">
            &gt;
          </span>
        )}
      </span>

      <span className={styles.desc}>{desc}</span>
    </article>
  )
}
