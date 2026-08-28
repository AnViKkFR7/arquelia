import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { loadGTM, trackEvent } from '../../lib/gtm'
import styles from './CookieConsent.module.css'

const STORAGE_KEY = 'arquelia-consent'
type Choice = 'granted' | 'denied'

// El enlace "Configurar cookies" del footer necesita reabrir este aviso sin
// que Footer y CookieConsent compartan estado directamente (viven en el
// mismo árbol pero no hay un padre común natural para ese estado).
let reopen: (() => void) | null = null
export function reopenCookieConsent() {
  reopen?.()
}

export function CookieConsent() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Choice | null
    if (stored === 'granted') {
      loadGTM()
    } else if (stored !== 'denied') {
      setVisible(true)
    }

    reopen = () => setVisible(true)
    return () => {
      reopen = null
    }
  }, [])

  const choose = (choice: Choice) => {
    localStorage.setItem(STORAGE_KEY, choice)
    setVisible(false)
    if (choice === 'granted') {
      loadGTM()
      // No se puede llamar antes: `trackEvent` no hace nada hasta que
      // `loadGTM` termina de marcar el contenedor como cargado.
      trackEvent('cookie_consent', { consent: 'granted' })
    }
  }

  if (!visible) return null

  return (
    <div className={styles.banner} role="dialog" aria-live="polite" aria-label={t('cookieBanner.policyLink')}>
      <p className={styles.text}>
        {t('cookieBanner.text')}{' '}
        <Link to="/cookies" className={styles.link}>
          {t('cookieBanner.policyLink')}
        </Link>
      </p>
      <div className={styles.actions}>
        <button type="button" className={styles.reject} onClick={() => choose('denied')}>
          {t('cookieBanner.reject')}
        </button>
        <button type="button" className={styles.accept} onClick={() => choose('granted')}>
          {t('cookieBanner.accept')}
        </button>
      </div>
    </div>
  )
}
