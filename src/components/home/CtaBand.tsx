import { useTranslation } from 'react-i18next'
import { useCTAForm } from '../../context/CTAFormContext'
import { Reveal } from '../ui/Reveal'
import { Button } from '../ui/Button'
import bg from '../../assets/salon_01.webp'
import styles from './CtaBand.module.css'

interface CtaBandProps {
  title?: string
  text?: string
  /** Sin imagen de fondo: sólo negro sólido. */
  plain?: boolean
}

export function CtaBand({ title, text, plain }: CtaBandProps) {
  const { t } = useTranslation()
  const { openForm } = useCTAForm()

  return (
    <section
      className={`${styles.band} ${plain ? styles.plain : ''}`}
      style={!plain ? { backgroundImage: `url(${bg})` } : undefined}
    >
      {!plain && <span className={styles.scrim} />}

      <div className={`container-narrow ${styles.inner}`}>
        <Reveal variant="up">
          <h2 className={styles.title}>{title ?? t('home.cta.title').toUpperCase()}</h2>
        </Reveal>

        <Reveal variant="up" delay={80}>
          <p className={styles.text}>{text ?? t('home.cta.text')}</p>
        </Reveal>

        <Reveal variant="up" delay={160}>
          <div className={styles.actions}>
            <Button
              variant="gold"
              size="lg"
              onClick={openForm}
              arrow
              data-track-event="clic_form_arquelia"
            >
              {t('home.cta.request')}
            </Button>
            <a href="tel:+34600000000" className={styles.phone}>
              {t('home.cta.callUs')}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
