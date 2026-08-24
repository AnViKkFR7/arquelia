import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Reveal } from '../ui/Reveal'
import styles from './Footer.module.css'

export function Footer() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()
  const serviceLinks = t('footer.serviceLinks', { returnObjects: true }) as string[]

  return (
    <footer className={styles.footer}>
      <div className="container">
        <Reveal variant="up">
          <div className={styles.top}>
            <NavLink to="/" className={styles.logo}>
              <span className={styles.logoMark} aria-hidden="true" />
              ARQUELIA
            </NavLink>
            <p className={styles.claim}>{t('footer.claim')}</p>
          </div>
        </Reveal>

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
              +34 600 000 000
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
          </div>
        </div>

        <div className={styles.bottom}>
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
    </footer>
  )
}
