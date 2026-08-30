import { useTranslation } from 'react-i18next'
import { Reveal } from '../ui/Reveal'
import { useCTAForm } from '../../context/CTAFormContext'
import ButtonSlider from '../ui/ButtonSlider'
import styles from './FinalCta.module.css'

interface Fact {
  value: string
  label: string
}

/**
 * Cierre de la landing: la pregunta + párrafo + cifras + CTA que antes
 * llevaba `IntroSection` (sección 01), trasladados aquí sobre fondo claro.
 */
export function FinalCta() {
  const { t } = useTranslation()
  const { openForm } = useCTAForm()
  const facts = t('home.finalCta.facts', { returnObjects: true }) as Fact[]

  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <div className={styles.questionContainer}>
          <Reveal variant="up" delay={60} className={styles.content}>
            <h2 className={styles.title}>{t('home.finalCta.question')}</h2>
          </Reveal>

          <Reveal variant="up" delay={120} className={styles.content}>
            <p className={`lead ${styles.text}`}>{t('home.finalCta.text')}</p>
            <div className={styles.facts}>
              {facts.map((f) => (
                <div key={f.label} className={styles.fact}>
                  <span className={styles.factValue}>{f.value}</span>
                  <span className={styles.factLabel}>{f.label}</span>
                </div>
              ))}
            </div><div className={styles.action} data-track-event="clic_form_arquelia">
              {/* ButtonSlider no reenvía props arbitrarias al <button> — el
                  atributo va en este contenedor porque la detección de
                  clics es delegada (`closest('[data-track-event]')`), así
                  que igualmente lo capta sin tocar el componente compartido. */}
              <ButtonSlider text={t('home.finalCta.requestBudget')} onClick={openForm} />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
