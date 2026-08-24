import type { ElementType, ReactNode } from 'react'
import { useInView } from '../../hooks/useInView'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import styles from './Reveal.module.css'

type Variant = 'up' | 'fade' | 'left' | 'right' | 'clip'

interface RevealProps {
  children: ReactNode
  /** Dirección/tipo de entrada. */
  variant?: Variant
  /**
   * Escalonado respecto a sus hermanos, en ms.
   *
   * En `up` no es un retardo de reloj: se traduce en recorrido de scroll, de
   * modo que a mitad de la entrada los hermanos están visiblemente a alturas
   * distintas (que es lo que hace que una rejilla "entre en escena" en vez de
   * aparecer en bloque). En el resto de variantes sí es un `transition-delay`.
   */
  delay?: number
  /**
   * `true` (por defecto): se revela una vez y se queda así.
   * `false`: vuelve a su estado inicial al salir del viewport y se anima de
   * nuevo al reaparecer.
   *
   * No aplica a `up`, que al ir ligado al scroll ya es reversible por sí solo.
   */
  once?: boolean
  /** Etiqueta HTML a renderizar. */
  as?: ElementType
  className?: string
}

/**
 * Envoltorio de revelado al hacer scroll.
 *
 * `up` va ligado al scroll de forma continua y suavizada (ver
 * `useScrollReveal`); el resto de variantes son una transición CSS de
 * duración fija disparada al entrar en el viewport. Todas respetan
 * `prefers-reduced-motion`.
 */
export function Reveal({ variant = 'up', ...props }: RevealProps) {
  // Dos componentes distintos en vez de dos ramas dentro de uno: cada rama
  // usa hooks diferentes, y mezclarlas rompería el orden de llamada.
  return variant === 'up' ? (
    <ScrollUpReveal {...props} />
  ) : (
    <TransitionReveal variant={variant} {...props} />
  )
}

function ScrollUpReveal({
  children,
  delay = 0,
  as,
  className,
}: Omit<RevealProps, 'variant'>) {
  const Tag = (as ?? 'div') as ElementType
  // El transform y la opacidad los escribe el ticker directamente en el nodo,
  // así que aquí no se pasa `style`: se pisarían el uno al otro.
  const ref = useScrollReveal<HTMLDivElement>(delay)

  return (
    <Tag ref={ref} className={`${styles.reveal} ${styles.upScroll} ${className ?? ''}`}>
      {children}
    </Tag>
  )
}

function TransitionReveal({
  children,
  variant = 'fade',
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
