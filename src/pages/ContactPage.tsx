import { useTranslation } from 'react-i18next'
import { PageHero } from '../components/ui/PageHero'
import { Reveal } from '../components/ui/Reveal'
import { CTAForm } from '../components/forms/CTAForm'
import styles from './ContactPage.module.css'

interface Detail {
  label: string
  value: string
}

const HREFS: Record<string, string> = {
  Email: 'mailto:info@arquelia.es',
  Phone: 'tel:+34600000000',
  Teléfono: 'tel:+34600000000',
}

export function ContactPage() {
  const { t } = useTranslation()
  const details = t('contact.details', { returnObjects: true }) as Detail[]

  return (
    <>
      <PageHero
        eyebrow={t('contact.hero.eyebrow')}
        title={t('contact.hero.title')}
        lead={t('contact.hero.lead')}
      />

      <section className={`section ${styles.section}`}>
        <div className={`container ${styles.grid}`}>
          {/* Formulario */}
          <Reveal variant="up" className={styles.formCard}>
            <span className={`eyebrow ${styles.formEyebrow}`}>{t('contact.formEyebrow')}</span>
            <CTAForm onDone={() => undefined} />
          </Reveal>

          {/* Datos */}
          <div className={styles.info}>
            <Reveal variant="up" delay={100}>
              <h2 className={styles.infoTitle}>{t('contact.talk')}</h2>
              <p className={styles.infoText}>{t('contact.talkText')}</p>
            </Reveal>

            <dl className={styles.details}>
              {details.map((d, i) => {
                const href = HREFS[d.label]
                return (
                  <Reveal key={d.label} variant="up" delay={160 + i * 60} className={styles.detail}>
                    <dt className={styles.detailLabel}>{d.label}</dt>
                    <dd className={styles.detailValue}>
                      {href ? (
                        <a href={href} className={styles.detailLink}>
                          {d.value}
                        </a>
                      ) : (
                        d.value
                      )}
                    </dd>
                  </Reveal>
                )
              })}
            </dl>

            <Reveal variant="up" delay={420}>
              <div className={styles.note}>
                <span className={styles.noteLabel}>{t('contact.zone.label')}</span>
                <p>{t('contact.zone.text')}</p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}
