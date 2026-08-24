import { useTranslation } from 'react-i18next'
import { Reveal } from '../ui/Reveal'
import { Button } from '../ui/Button'
import { useCTAForm } from '../../context/CTAFormContext'
import styles from './IntroSection.module.css'
import ButtonSlider from '../ui/ButtonSlider'

interface Fact {
  value: string
  label: string
}

export function IntroSection() {
  const { t } = useTranslation()
  const { openForm } = useCTAForm()
  const facts = t('home.intro.facts', { returnObjects: true }) as Fact[]

  return (
    <section className={`section ${styles.section}`}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.left}>
          <Reveal variant="fade">
            <span className="eyebrow">
              <span className={styles.index}>01</span> {t('home.intro.eyebrow')}
            </span>
          </Reveal>

          <Reveal variant="up" delay={60} once={false}>
            <h2 className={styles.title}>
              {t('home.intro.titlePre')} <em>{t('home.intro.titleEm')}</em> {t('home.intro.titlePost')}
            </h2>
          </Reveal>
        </div>

        <div className={styles.right}>
          <Reveal variant="up" delay={120}>
            <p className={`lead ${styles.text}`}>{t('home.aboutTeaser')}</p>
          </Reveal>

          <Reveal variant="up" delay={180}>
            <div className={styles.facts}>
              {facts.map((f) => (
                <div key={f.label} className={styles.fact}>
                  <span className={styles.factValue}>{f.value}</span>
                  <span className={styles.factLabel}>{f.label}</span>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal variant="up" delay={215} once={false}>
            <div className={styles.btn_arrow_wrapper}>
              <ButtonSlider text={t('home.intro.requestBudget')} onClick={openForm} />
            </div>
          </Reveal>

          <Reveal variant="up" delay={240} once={false}>
            <Button to="/sobre-nosotros" variant="link" arrow className={styles.cta}>
              {t('home.intro.knowUs')}
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
