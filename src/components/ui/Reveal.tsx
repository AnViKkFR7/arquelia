import type { ElementType, ReactNode } from 'react'
import { useInView } from '../../hooks/useInView'
import styles from './Reveal.module.css'

type Variant = 'up' | 'fade' | 'left' | 'right' | 'clip'

interface RevealProps {
  children: ReactNode
  /** Dirección/tipo de entrada. */
  variant?: Variant
  /** Retardo en ms, para escalonar elementos hermanos. */
  delay?: number
  /** Etiqueta HTML a renderizar. */
  as?: ElementType
  className?: string
}

/**
 * Envoltorio de revelado al hacer scroll.
 * Una sola curva de easing en todo el sitio; respeta `prefers-reduced-motion`
 * (la media query global neutraliza la transición).
 */
export function Reveal({ children, variant = 'up', delay = 0, as, className }: RevealProps) {
  const Tag = (as ?? 'div') as ElementType
  const { ref, inView } = useInView<HTMLDivElement>()

  return (
    <Tag
      ref={ref}
      className={`${styles.reveal} ${styles[variant]} ${inView ? styles.in : ''} ${className ?? ''}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
