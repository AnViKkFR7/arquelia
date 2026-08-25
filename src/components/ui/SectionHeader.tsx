import type { ReactNode } from 'react'
import { Reveal } from './Reveal'
import styles from './SectionHeader.module.css'

interface SectionHeaderProps {
  title?: ReactNode
  lead?: ReactNode
  /** Contenido extra alineado a la derecha en desktop. */
  aside?: ReactNode
  inverse?: boolean
  className?: string
}

export function SectionHeader({ title, lead, aside, inverse, className }: SectionHeaderProps) {
  return (
    <div className={`${styles.header} ${inverse ? styles.inverse : ''} ${className ?? ''}`}>
      <div className={styles.main}>
        {title && (
          <Reveal variant="up" delay={60}>
            <h2 className={styles.title}>{title}</h2>
          </Reveal>
        )}
      </div>

      {(lead || aside) && (
        <Reveal variant="up" delay={120} className={styles.side}>
          {lead && <p className={`lead ${styles.lead}`}>{lead}</p>}
          {aside}
        </Reveal>
      )}
    </div>
  )
}
