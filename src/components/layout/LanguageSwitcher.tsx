import { useTranslation } from 'react-i18next'
import styles from './LanguageSwitcher.module.css'

const LANGUAGES = ['es', 'en'] as const

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language.startsWith('en') ? 'en' : 'es'

  return (
    <div className={styles.switcher}>
      {LANGUAGES.map((lng) => (
        <button
          key={lng}
          type="button"
          className={`${styles.option} ${current === lng ? styles.active : ''}`}
          onClick={() => i18n.changeLanguage(lng)}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
