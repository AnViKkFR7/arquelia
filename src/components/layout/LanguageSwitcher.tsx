import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './LanguageSwitcher.module.css'

const LANGUAGES = ['es', 'en', 'ca'] as const

const NAMES: Record<(typeof LANGUAGES)[number], string> = {
  es: 'Español',
  en: 'English',
  ca: 'Català',
}

interface LanguageSwitcherProps {
  /** El panel móvil recorta con `overflow: hidden` (lo necesita para la
   * animación de alto); si el menú se abriera hacia abajo ahí, quedaría
   * cortado por el borde del panel. */
  menuPosition?: 'down' | 'up'
}

/**
 * Desplegable "ES ▾" — con tres idiomas (se añadió el catalán) ya no cabían
 * como dos botones en línea, así que pasa a un único control que abre un
 * menú, en vez de una hilera de opciones.
 */
export function LanguageSwitcher({ menuPosition = 'down' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation()
  const current = LANGUAGES.find((l) => i18n.language.startsWith(l)) ?? 'es'
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    const onPointer = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const select = (lng: (typeof LANGUAGES)[number]) => {
    i18n.changeLanguage(lng)
    setOpen(false)
  }

  return (
    <div className={styles.switcher} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {current.toUpperCase()}
        <svg
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          viewBox="0 0 12 8"
          width="10"
          height="7"
          aria-hidden="true"
        >
          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        </svg>
      </button>

      <ul
        className={`${styles.menu} ${menuPosition === 'up' ? styles.menuUp : ''} ${open ? styles.menuOpen : ''}`}
        role="listbox"
      >
        {LANGUAGES.map((lng) => (
          <li key={lng}>
            <button
              type="button"
              role="option"
              aria-selected={current === lng}
              className={`${styles.option} ${current === lng ? styles.active : ''}`}
              onClick={() => select(lng)}
            >
              <span className={styles.optionCode}>{lng.toUpperCase()}</span>
              <span className={styles.optionName}>{NAMES[lng]}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
