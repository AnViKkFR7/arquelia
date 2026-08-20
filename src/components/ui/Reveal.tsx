import type { ElementType, ReactNode } from 'react'
import { useInView } from '../../hooks/useInView'
import styles from './Reveal.module.css'

type Variant = 'up' | 'fade' | 'left' | 'right' | 'clip'

interface RevealProps {
  children: ReactNode
  /** Dirección/tipo de entrada. */
  variant?: Variant
  /** Retardo en ms al entrar, para escalonar elementos hermanos. */
  delay?: number
  /**
   * `true` (por defecto): se revela una vez y se queda así — es lo que
   * quieres en la mayoría de secciones, para que la página no "parpadee"
   * al subir y bajar.
   *
   * `false`: cada vez que el elemento sale del viewport (hacia arriba o
   * hacia abajo) vuelve a su estado inicial, y se anima de nuevo al
   * reaparecer — en cualquier dirección de scroll. Pensado para piezas
   * puntuales donde ese "respira cada vez" aporta (una tarjeta destacada,
   * un titular de sección), no para usarlo en todas partes: si se abusa,
   * la página se vuelve inquieta en vez de premium.
   */
  once?: boolean
  /** Etiqueta HTML a renderizar. */
  as?: ElementType
  className?: string
}

/**
 * Envoltorio de revelado al hacer scroll.
 * Una sola curva de easing en todo el sitio; respeta `prefers-reduced-motion`
 * (la media query global neutraliza la transición).
 */
export function Reveal({
  children,
  variant = 'up',
  delay = 0,
  once = true,
  as,
  className,
}: RevealProps) {
  const Tag = (as ?? 'div') as ElementType
  const { ref, inView } = useInView<HTMLDivElement>({ once })

  return (
    <Tag
      ref={ref}
      className={`${styles.reveal} ${styles[variant]} ${inView ? styles.in : ''} ${className ?? ''}`}
      // El retardo sólo se aplica al entrar. Al deshacerse (once={false} y el
      // elemento sale del viewport) queremos que retroceda ya, sin esperar:
      // si no, con varios hermanos escalonados el conjunto se ve descoordinado.
      style={delay ? { transitionDelay: inView ? `${delay}ms` : '0ms' } : undefined}
    >
      {children}
    </Tag>
  )
}
