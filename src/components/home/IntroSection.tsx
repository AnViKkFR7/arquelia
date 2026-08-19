import { useTranslation } from 'react-i18next'
import { Reveal } from '../ui/Reveal'
import { Button } from '../ui/Button'
import styles from './IntroSection.module.css'

const facts = [
  { value: '15+', label: 'Años de oficio' },
  { value: '120+', label: 'Proyectos entregados' },
  { value: '1', label: 'Interlocutor por obra' },
]

export function IntroSection() {
  const { t } = useTranslation()

  return (
    <section className={`section ${styles.section}`}>
      <div className={`container ${styles.grid}`}>
        <div className={styles.left}>
          <Reveal variant="fade">
            <span className="eyebrow">
              <span className={styles.index}>01</span> Sobre nosotros
            </span>
          </Reveal>

          <Reveal variant="up" delay={60}>
            <h2 className={styles.title}>
              Donde la arquitectura <em>se convierte</em> en hogar
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

          <Reveal variant="up" delay={240}>
            <Button to="/sobre-nosotros" variant="link" arrow className={styles.cta}>
              Conoce Arquelia
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
