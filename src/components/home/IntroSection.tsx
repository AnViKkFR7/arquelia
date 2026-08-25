import { useTranslation } from 'react-i18next'
import { Reveal } from '../ui/Reveal'
import styles from './IntroSection.module.css'

/**
 * Bloque de presentación centrado, sin cifras ni CTA — sólo un titular y un
 * párrafo. Las cifras y el llamado a la acción que llevaba esta sección se
 * trasladaron a `FinalCta`, al final de la landing.
 */
export function IntroSection() {
  const { t } = useTranslation()

  return (
    <section className={`section ${styles.section}`}>
      <div className={`container ${styles.inner}`}>
        <Reveal variant="up">
          <h2 className={styles.title}>{t('home.intro.title')}</h2>
        </Reveal>

        <Reveal variant="up" delay={100}>
          <p className={`lead ${styles.text}`}>{t('home.intro.text')}</p>
        </Reveal>
      </div>
    </section>
  )
}
