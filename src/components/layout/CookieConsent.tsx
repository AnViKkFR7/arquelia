import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { loadGTM, isGTMLoaded, trackEvent } from '../../lib/gtm'
import { setMeasurement } from '../../lib/analytics'
import { globalPrivacyControl, measurementAllowed, readConsent, writeConsent, type Consent } from '../../lib/consent'
import styles from './CookieConsent.module.css'

// El enlace "Configurar cookies" del footer necesita reabrir este aviso sin
// que Footer y CookieConsent compartan estado directamente (viven en el
// mismo árbol pero no hay un padre común natural para ese estado).
let reopen: (() => void) | null = null
export function reopenCookieConsent() {
  reopen?.()
}

interface Prefs {
  measurement: boolean
  analytics: boolean
}

// Quitar el consentimiento a Google Analytics no borra lo que ya instaló:
// hay que eliminar sus cookies a mano (y recargar para que el script deje de
// ejecutarse). Se intenta con el host y con el dominio padre, que es donde
// las suele poner.
function clearAnalyticsCookies() {
  const host = window.location.hostname
  const domains = [host, `.${host}`, `.${host.replace(/^www\./, '')}`]
  for (const entry of document.cookie.split(';')) {
    const name = entry.split('=')[0]?.trim()
    if (!name || !/^(_ga|_gid|_gat)/.test(name)) continue
    for (const domain of domains) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`
    }
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  }
}

export function CookieConsent() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)
  const [customizing, setCustomizing] = useState(false)
  const [prefs, setPrefs] = useState<Prefs>({ measurement: measurementAllowed(readConsent()), analytics: false })

  // Aplica una decisión ya tomada (la guardada, o la que acaba de darse)
  const apply = (consent: Consent) => {
    setMeasurement(measurementAllowed(consent))
    if (consent.analytics || consent.marketing) {
      loadGTM()
    } else if (isGTMLoaded()) {
      clearAnalyticsCookies()
      window.location.reload()
    }
  }

  useEffect(() => {
    const stored = readConsent()
    if (stored) {
      setPrefs({ measurement: measurementAllowed(stored), analytics: stored.analytics })
      apply(stored)
    } else {
      setVisible(true)
    }

    reopen = () => {
      const current = readConsent()
      if (current) setPrefs({ measurement: measurementAllowed(current), analytics: current.analytics })
      setCustomizing(true)
      setVisible(true)
    }
    return () => {
      reopen = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const decide = (choice: Prefs) => {
    // `marketing` queda siempre a false: esta web no usa cookies de publicidad
    const saved = writeConsent({ ...choice, marketing: false })
    setVisible(false)
    setCustomizing(false)
    apply(saved)
    if (saved.analytics) {
      // No se puede llamar antes: `trackEvent` no hace nada hasta que
      // `loadGTM` termina de marcar el contenedor como cargado.
      trackEvent('cookie_consent', { consent: 'granted' })
    }
  }

  if (!visible) return null

  return (
    <div className={styles.banner} role="dialog" aria-live="polite" aria-label={t('cookieBanner.policyLink')}>
      <div className={styles.main}>
        <p className={styles.text}>
          {t('cookieBanner.text')}{' '}
          <Link to="/cookies" className={styles.link}>
            {t('cookieBanner.policyLink')}
          </Link>
        </p>
        {!customizing && (
          <div className={styles.actions}>
            <button type="button" className={styles.reject} onClick={() => decide({ measurement: prefs.measurement, analytics: false })}>
              {t('cookieBanner.reject')}
            </button>
            <button type="button" className={styles.reject} onClick={() => setCustomizing(true)}>
              {t('cookieBanner.customize')}
            </button>
            <button type="button" className={styles.accept} onClick={() => decide({ measurement: prefs.measurement, analytics: true })}>
              {t('cookieBanner.accept')}
            </button>
          </div>
        )}
      </div>

      {customizing && (
        <div className={styles.panel}>
          <div className={styles.option}>
            <div>
              <p className={styles.optionTitle}>{t('cookieBanner.necessary.title')}</p>
              <p className={styles.optionDesc}>{t('cookieBanner.necessary.desc')}</p>
            </div>
            <input type="checkbox" role="switch" className={styles.switch} checked disabled aria-label={t('cookieBanner.necessary.title')} />
          </div>

          <label className={styles.option}>
            <div>
              <p className={styles.optionTitle}>{t('cookieBanner.measurement.title')}</p>
              <p className={styles.optionDesc}>{t('cookieBanner.measurement.desc')}</p>
            </div>
            <input
              type="checkbox"
              role="switch"
              className={styles.switch}
              checked={prefs.measurement}
              disabled={globalPrivacyControl()}
              onChange={(e) => setPrefs((p) => ({ ...p, measurement: e.target.checked }))}
            />
          </label>

          <label className={styles.option}>
            <div>
              <p className={styles.optionTitle}>{t('cookieBanner.analytics.title')}</p>
              <p className={styles.optionDesc}>{t('cookieBanner.analytics.desc')}</p>
            </div>
            <input
              type="checkbox"
              role="switch"
              className={styles.switch}
              checked={prefs.analytics}
              onChange={(e) => setPrefs((p) => ({ ...p, analytics: e.target.checked }))}
            />
          </label>

          <div className={styles.option}>
            <div>
              <p className={styles.optionTitle}>{t('cookieBanner.marketing.title')}</p>
              <p className={styles.optionDesc}>{t('cookieBanner.marketing.desc')}</p>
            </div>
            <input type="checkbox" role="switch" className={styles.switch} checked={false} disabled aria-label={t('cookieBanner.marketing.title')} />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.accept} onClick={() => decide(prefs)}>
              {t('cookieBanner.save')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
