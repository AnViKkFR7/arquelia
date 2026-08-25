import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Reveal } from '../ui/Reveal'
import { SectionHeader } from '../ui/SectionHeader'
import styles from './ServicesGrid.module.css'

interface ServiceCardData {
  id: string
  title: string
}

const IMAGES: Record<string, string> = {
  cocina: '/mockup-images/cocina_mockup.webp',
  bano: '/mockup-images/bano_mockup.webp',
  integral: '/mockup-images/integral_mocukp.webp',
  rehabilitacion: '/mockup-images/rehabilitacion_mockup.webp',
}

/**
 * Cuatro categorías de servicio en tarjetas de imagen. Todas llevan a
 * `/servicios` — es un aperitivo del catálogo completo, no un desglose.
 */
export function ServicesGrid() {
  const { t } = useTranslation()
  const items = t('home.servicesGrid.items', { returnObjects: true }) as ServiceCardData[]

  return (
    <section className={`section ${styles.section}`}>
      <div className="container">
        <SectionHeader title={t('home.servicesGrid.title')} lead={t('home.servicesGrid.lead')} />
      </div>

      <div className={`container ${styles.grid}`}>
        {items.map((item, i) => (
          <Reveal key={item.id} variant="up" delay={i * 60} once={false}>
            <Link
              to="/servicios"
              className={styles.card}
              style={{ backgroundImage: `url(${IMAGES[item.id]})` }}
            >
              <span className={styles.veil} />
              <span className={styles.title}>{item.title}</span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
