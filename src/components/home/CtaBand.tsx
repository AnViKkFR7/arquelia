import { useCTAForm } from '../../context/CTAFormContext'
import { Reveal } from '../ui/Reveal'
import { Button } from '../ui/Button'
import bg from '../../assets/salon_01.avif'
import styles from './CtaBand.module.css'

interface CtaBandProps {
  title?: string
  text?: string
  /** Sin imagen de fondo: sólo negro sólido. */
  plain?: boolean
}

export function CtaBand({
  title = '¿Tienes un proyecto en mente?',
  text = 'Cuéntanos qué quieres transformar. Te visitamos, lo estudiamos y te damos un presupuesto cerrado, sin compromiso.',
  plain,
}: CtaBandProps) {
  const { openForm } = useCTAForm()

  return (
    <section
      className={`${styles.band} ${plain ? styles.plain : ''}`}
      style={!plain ? { backgroundImage: `url(${bg})` } : undefined}
    >
      {!plain && <span className={styles.scrim} />}

      <div className={`container-narrow ${styles.inner}`}>
        <Reveal variant="up">
          <h2 className={styles.title}>{title}</h2>
        </Reveal>

        <Reveal variant="up" delay={80}>
          <p className={styles.text}>{text}</p>
        </Reveal>

        <Reveal variant="up" delay={160}>
          <div className={styles.actions}>
            <Button variant="gold" size="lg" onClick={openForm} arrow>
              Solicitar presupuesto
            </Button>
            <a href="tel:+34600000000" className={styles.phone}>
              o llámanos: +34 600 000 000
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
