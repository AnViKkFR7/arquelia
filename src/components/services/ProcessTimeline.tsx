import { useInView } from '../../hooks/useInView'
import styles from './ProcessTimeline.module.css'

export interface ProcessStep {
  n: string
  title: string
  desc: string
}

interface ProcessTimelineProps {
  steps: ProcessStep[]
  activeIndex: number
  onSelect: (index: number) => void
}

function Row({
  step,
  isActive,
  onSelect,
}: {
  step: ProcessStep
  isActive: boolean
  onSelect: () => void
}) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.35 })

  return (
    <div
      ref={ref}
      className={`${styles.row} ${inView ? styles.in : ''} ${isActive ? styles.active : ''}`}
    >
      <span className={styles.marker} aria-hidden="true">
        <span className={styles.markerLine} />
      </span>

      <button
        type="button"
        className={styles.button}
        onClick={onSelect}
        onMouseEnter={onSelect}
        aria-expanded={isActive}
      >
        <span className={styles.n}>{step.n}</span>
        <span className={styles.titleWrap}>
          <span className={styles.title}>{step.title}</span>
          <span className={styles.desc}>
            <span className={styles.descInner}>{step.desc}</span>
          </span>
        </span>
      </button>
    </div>
  )
}

/**
 * Lista de proceso numerada, alineada a la izquierda, con descripción
 * desplegable. Antes cada fila entraba con más sangría que la anterior
 * ("escalera") — se quitó, pedido explícito.
 * Referencia: vídeo 03, tramo 1.5–8s.
 */
export function ProcessTimeline({ steps, activeIndex, onSelect }: ProcessTimelineProps) {
  return (
    <div className={styles.timeline}>
      {steps.map((step, i) => (
        <Row key={step.n} step={step} isActive={i === activeIndex} onSelect={() => onSelect(i)} />
      ))}
    </div>
  )
}
