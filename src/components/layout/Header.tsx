import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCTAForm } from '../../context/CTAFormContext'
import { LanguageSwitcher } from './LanguageSwitcher'
import styles from './Header.module.css'

const links = [
  { to: '/', key: 'home' },
  { to: '/servicios', key: 'services' },
  { to: '/proyectos', key: 'projects' },
  { to: '/sobre-nosotros', key: 'about' },
  { to: '/contacto', key: 'contact' },
] as const

export function Header() {
  const { t } = useTranslation()
  const { openForm } = useCTAForm()
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  // Cierra el menú al navegar
  useEffect(() => setMenuOpen(false), [pathname])

  // Bloquea el scroll del body con el menú abierto
  useEffect(() => {
    if (!menuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [menuOpen])

  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <NavLink to="/" className={styles.logo} aria-label={t('nav.homeAria')}>
          <span className={styles.logoMark} aria-hidden="true" />
          ARQUELIA
        </NavLink>

        <nav className={styles.nav} aria-label={t('nav.mainAria')}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
            >
              {t(`nav.${link.key}`)}
            </NavLink>
          ))}
        </nav>

        <div className={styles.actions}>
          <span className={styles.langDesktop}>
            <LanguageSwitcher />
          </span>
          <button type="button" className={styles.cta} onClick={openForm}>
            {t('nav.cta')}
          </button>
          <button
            type="button"
            className={`${styles.burger} ${menuOpen ? styles.burgerOpen : ''}`}
            aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      <div className={`${styles.panel} ${menuOpen ? styles.panelOpen : ''}`}>
        <nav className={styles.panelNav} aria-label={t('nav.mobileAria')}>
          {links.map((link, i) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={styles.panelLink}
              style={{ transitionDelay: menuOpen ? `${80 + i * 45}ms` : '0ms' }}
            >
              <span className={styles.panelIndex}>0{i + 1}</span>
              {t(`nav.${link.key}`)}
            </NavLink>
          ))}
        </nav>

        <div className={styles.panelFooter}>
          <button
            type="button"
            className={styles.panelCta}
            onClick={() => {
              setMenuOpen(false)
              openForm()
            }}
          >
            {t('nav.cta')}
          </button>
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  )
}
