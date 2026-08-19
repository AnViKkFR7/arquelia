import styles from './ServiceCard.module.css'

interface ServiceCardProps {
  label: string
  /** Palabras que envuelven la etiqueta al hacer hover: "Reformas ⟨COCINA⟩ a medida". */
  prefix: string
  suffix: string
  image: string
  /** Desplaza la tarjeta verticalmente para escalonar la fila. */
  offset?: 0 | 1 | 2
}

/**
 * Tarjeta de categoría con revelado al hover.
 * Réplica del patrón "FOR ⟨MARINE⟩ LIVING" de la referencia: la etiqueta
 * está siempre visible y el resto de la frase aparece a los lados.
 */
export function ServiceCard({ label, prefix, suffix, image, offset = 0 }: ServiceCardProps) {
  return (
    <article className={`${styles.card} ${styles[`offset${offset}`]}`}>
      <span className={styles.image} style={{ backgroundImage: `url(${image})` }} />
      <span className={styles.veil} />

      <span className={styles.phrase}>
        <span className={styles.side}>{prefix}</span>
        <span className={styles.label}>{label}</span>
        <span className={styles.side}>{suffix}</span>
      </span>
    </article>
  )
}
