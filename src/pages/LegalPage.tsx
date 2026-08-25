import { useTranslation } from 'react-i18next'
import styles from './LegalPage.module.css'

interface LegalPageProps {
  slug: 'notice' | 'cookies' | 'privacy'
}

interface Section {
  heading: string
  body: string
}

export function LegalPage({ slug }: LegalPageProps) {
  const { t } = useTranslation()
  const sections = t(`legal.${slug}.sections`, { returnObjects: true }) as Section[]

  return (
    <div className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <span className="eyebrow">{t('legal.eyebrow')}</span>
        <h1 className={styles.title}>{t(`legal.${slug}.title`)}</h1>
        <p className={styles.updated}>{t('legal.updated')}</p>

        <div className={styles.sections}>
          {sections.map((s) => (
            <section key={s.heading}>
              <h2 className={styles.heading}>{s.heading}</h2>
              <p className={styles.body}>{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
