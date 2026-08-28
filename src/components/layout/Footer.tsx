import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Reveal } from '../ui/Reveal'
import { reopenCookieConsent } from './CookieConsent'
import logoMark from '../../assets/brand/Transparente_blanco_logo_abajo_nombre.png'
import styles from './Footer.module.css'

export function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()
  const serviceLinks = t('footer.serviceLinks', { returnObjects: true }) as string[]

  return (
    <footer className={styles.footer}>
      <div className={styles.containerWrapper}>
        <div className={styles.container}>
          <Reveal variant="up">
            <div className={styles.top}>
              <NavLink to="/" className={styles.logo}>
                <img src={logoMark} alt="" className={styles.logoMark} />
              </NavLink>
              <p className={styles.claim}>{t('footer.claim')}</p>
            </div>
          </Reveal>
        </div>
      </div>

      <div className={styles.containerBottom}>
        <div className={styles.grid}>
          <div className={styles.col}>
            <h4 className={styles.heading}>{t('nav.services')}</h4>
            {serviceLinks.map((s) => (
              <NavLink key={s} to="/servicios" className={styles.link}>
                {s}
              </NavLink>
            ))}
          </div>

          <div className={styles.col}>
            <h4 className={styles.heading}>{t('footer.navigation')}</h4>
            <NavLink to="/proyectos" className={styles.link}>
              {t('nav.projects')}
            </NavLink>
            <NavLink to="/sobre-nosotros" className={styles.link}>
              {t('nav.about')}
            </NavLink>
            <NavLink to="/contacto" className={styles.link}>
              {t('nav.contact')}
            </NavLink>
          </div>

          <div className={styles.col}>
            <h4 className={styles.heading}>{t('nav.contact')}</h4>
            <a href="mailto:info@arquelia.es" className={styles.link}>
              info@arquelia.es
            </a>
            <a href="tel:+34600000000" className={styles.link}>
              +34 673 45 66 93
            </a>
            <span className={styles.muted}>{t('footer.location')}</span>
          </div>

          <div className={styles.col}>
            <h4 className={styles.heading}>{t('footer.legalHeading')}</h4>
            <NavLink to="/aviso-legal" className={styles.link}>
              {t('footer.legal')}
            </NavLink>
            <NavLink to="/cookies" className={styles.link}>
              {t('footer.cookies')}
            </NavLink>
            <NavLink to="/privacidad" className={styles.link}>
              {t('footer.privacy')}
            </NavLink>
            <button type="button" className={styles.linkButton} onClick={reopenCookieConsent}>
              {t('cookieBanner.manage')}
            </button>
          </div>
        </div>
      </div>

      {/* Banda a sangre completa con su propio fondo, más oscuro que el
          resto del footer — de ahí que viva fuera del `container` de
          arriba: necesita ocupar el ancho entero de la pantalla, no sólo
          el ancho de línea del contenido. */}
      <div className={styles.bottom}>
        <div className={`container ${styles.bottomInner}`}>
          <span>
            &copy; {year} Arquelia. {t('footer.rights')}
          </span>
          <span>
            <a href="https://moiraordo.es/" target="_blank" rel="noreferrer">
              {t('footer.developedBy')}
            </a>
          </span>
          <span className={styles.legalName}>P &amp; B Cornellà Construcciones, S.L.</span>
        </div>
      </div>
    </footer >
  )
}
