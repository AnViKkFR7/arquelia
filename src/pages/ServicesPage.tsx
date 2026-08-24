import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHero } from '../components/ui/PageHero'
import { SectionHeader } from '../components/ui/SectionHeader'
import { Reveal } from '../components/ui/Reveal'
import { ServiceCard } from '../components/services/ServiceCard'
import { ProcessTimeline, type ProcessStep } from '../components/services/ProcessTimeline'
import { CtaBand } from '../components/home/CtaBand'
import {
  IconIntegral,
  IconKitchen,
  IconBathroom,
  IconInterior,
  IconRehab,
  IconCommercial,
  IconOffice,
  IconFinishes,
} from '../components/icons/ServiceIcons'
import styles from './ServicesPage.module.css'

import heroImg from '../assets/pasillo_01.jpg'
import cocinaImg from '../assets/cocina_abierta.avif'
import banoImg from '../assets/baño_03.avif'
import salonImg from '../assets/salon_01.avif'

const FEATURED_IMAGES: Record<string, string> = { cocina: cocinaImg, bano: banoImg, integral: salonImg }
const CATALOG_ICONS: Record<string, () => React.JSX.Element> = {
  integral: IconIntegral,
  cocina: IconKitchen,
  bano: IconBathroom,
  interiorismo: IconInterior,
  rehabilitacion: IconRehab,
  local: IconCommercial,
  oficina: IconOffice,
  acabados: IconFinishes,
}

interface FeaturedCard {
  id: string
  label: string
  prefix: string
  suffix: string
}

interface CatalogItem {
  id: string
  title: string
  desc: string
}

export function ServicesPage() {
  const { t } = useTranslation()
  const [activeStep, setActiveStep] = useState(0)

  const featured = t('services.featured', { returnObjects: true }) as FeaturedCard[]
  const catalog = t('services.catalog.items', { returnObjects: true }) as CatalogItem[]
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
              <ServiceCard
                label={f.label}
                prefix={f.prefix}
                suffix={f.suffix}
                image={FEATURED_IMAGES[f.id]}
                offset={i as 0 | 1 | 2}
              />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Catálogo completo */}
      <section className={styles.catalog}>
        <div className="container">
          <SectionHeader
            index="01"
            eyebrow={t('services.catalog.eyebrow')}
            title={t('services.catalog.title')}
            lead={t('services.catalog.lead')}
            inverse
          />
        </div>

        <div className={`container ${styles.iconGrid}`}>
          {catalog.map(({ id, title, desc }, i) => {
            const Icon = CATALOG_ICONS[id]
            return (
              <Reveal key={id} variant="fade" delay={i * 50} className={styles.iconCard}>
                <span className={styles.iconWrap}>
                  <Icon />
                </span>
                <h3 className={styles.iconTitle}>{title}</h3>
                <p className={styles.iconDesc}>{desc}</p>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* Proceso */}
      <section className={`section ${styles.process}`}>
        <div className="container">
          <SectionHeader
            index="02"
            eyebrow={t('services.process.eyebrow')}
            title={t('services.process.title')}
            lead={t('services.process.lead')}
          />

          <div className={styles.timelineWrap}>
            <ProcessTimeline steps={processSteps} activeIndex={activeStep} onSelect={setActiveStep} />
          </div>
        </div>
      </section>

      <CtaBand title={t('services.cta.title')} text={t('services.cta.text')} />
    </>
  )
}
