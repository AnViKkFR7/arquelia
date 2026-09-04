import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHero } from '../components/ui/PageHero'
import { SectionHeader } from '../components/ui/SectionHeader'
import { Reveal } from '../components/ui/Reveal'
import { FeaturedServiceCard } from '../components/services/FeaturedServiceCard'
import { ProcessTimeline, type ProcessStep } from '../components/services/ProcessTimeline'
import { CtaBand } from '../components/home/CtaBand'
import styles from './ServicesPage.module.css'

import heroImg from '../assets/servicios_header_2.webp'
import cocinaImg from '../assets/cocina_abierta.webp'
import banoImg from '../assets/baño_03.webp'
import salonImg from '../assets/salon_01.webp'
import fachadaImg from '../assets/fachada.webp'

// Mismo id que usa `services.catalog.items` — las tarjetas destacadas son
// un subconjunto de ese catálogo (título y descripción incluidos), no un
// contenido aparte que haya que mantener sincronizado a mano.
const FEATURED_IDS = ['cocina', 'bano', 'integral', 'rehabilitacion']
const FEATURED_IMAGES: Record<string, string> = {
  cocina: cocinaImg,
  bano: banoImg,
  integral: salonImg,
  rehabilitacion: fachadaImg,
}

interface CatalogItem {
  id: string
  title: string
  desc: string
}

export function ServicesPage() {
  const { t } = useTranslation()
  const [activeStep, setActiveStep] = useState(0)

  const catalog = t('services.catalog.items', { returnObjects: true }) as CatalogItem[]
  const featured = FEATURED_IDS.map((id) => catalog.find((c) => c.id === id)).filter(
    (c): c is CatalogItem => c != null
  )
  const processSteps = t('services.process.steps', { returnObjects: true }) as ProcessStep[]

  return (
    <>
      <PageHero
        eyebrow={t('services.hero.eyebrow')}
        title={t('services.hero.title')}
        lead={t('services.hero.lead')}
        image={heroImg}
      />

      {/* Tarjetas destacadas con revelado al hover */}
      <section className={`section ${styles.featured}`}>
        <div className={`container ${styles.featuredGrid}`}>
          {featured.map((f, i) => (
            <Reveal key={f.id} variant="up" delay={i * 100}>
              <FeaturedServiceCard title={f.title} desc={f.desc} image={FEATURED_IMAGES[f.id]} hasArrow={false} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Catálogo completo */}
      <section className={`section ${styles.catalog}`}>
        <div className="container">
          <SectionHeader title={t('services.catalog.title')} lead={t('services.catalog.lead')} />
        </div>

        <div className={`container ${styles.catalogGrid}`}>
          {catalog.map(({ id, title, desc }, i) => (
            <Reveal key={id} variant="up" delay={i * 60} className={styles.catalogItem}>
              <span className={styles.catalogIndex}>{String(i + 1).padStart(2, '0')}</span>
              <h3 className={styles.catalogTitle}>{title}</h3>
              <p className={styles.catalogDesc}>{desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Proceso */}
      <section className={`section ${styles.process}`}>
        <div className="container">
          <SectionHeader title={t('services.process.title')} lead={t('services.process.lead')} />

          <div className={styles.timelineWrap}>
            <ProcessTimeline steps={processSteps} activeIndex={activeStep} onSelect={setActiveStep} />
          </div>
        </div>
      </section>

      <CtaBand title={t('services.cta.title')} text={t('services.cta.text')} />
    </>
  )
}
