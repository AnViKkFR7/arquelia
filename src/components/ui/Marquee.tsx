import styles from './Marquee.module.css'

interface MarqueeProps {
  text: string
  separator?: string
  /** Duración de un ciclo completo en segundos. Más alto = más lento. */
  speed?: number
  /** Variante compacta, en sans, para franjas secundarias. */
  small?: boolean
  className?: string
}

export function Marquee({ text, separator = '—', speed = 55, small, className }: MarqueeProps) {
  const item = (key: number) => (
    <span className={styles.item} key={key}>
      {text}
      <span className={styles.separator} aria-hidden="true">
        {separator}
      </span>
    </span>
  )

  return (
    <div
      className={`${styles.marquee} ${small ? styles.small : ''} ${className ?? ''}`}
      aria-label={text}
    >
      <div className={styles.track} style={{ animationDuration: `${speed}s` }} aria-hidden="true">
        {[0, 1, 2, 3].map(item)}
      </div>
    </div>
  )
}
