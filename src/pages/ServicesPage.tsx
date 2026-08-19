import { useState } from 'react'
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

const featured = [
  { label: 'Cocinas', prefix: 'Reformas de', suffix: 'a medida', image: cocinaImg, offset: 0 },
  { label: 'Baños', prefix: 'Reformas de', suffix: 'de autor', image: banoImg, offset: 1 },
  { label: 'Integral', prefix: 'Reforma', suffix: 'llave en mano', image: salonImg, offset: 2 },
] as const

const services = [
  { title: 'Reforma integral', desc: 'Transformación completa de la vivienda, de la estructura a los últimos acabados.', Icon: IconIntegral },
  { title: 'Reforma de cocina', desc: 'Diseño funcional y materiales de alta gama para el corazón de la casa.', Icon: IconKitchen },
  { title: 'Reforma de baño', desc: 'Espacios de bienestar con acabados exclusivos y grifería de diseño.', Icon: IconBathroom },
  { title: 'Interiorismo', desc: 'Del concepto a la última pieza de mobiliario, con dirección de proyecto.', Icon: IconInterior },
  { title: 'Rehabilitación', desc: 'Recuperación integral de edificios y viviendas respetando su carácter.', Icon: IconRehab },
  { title: 'Local comercial', desc: 'Espacios que combinan identidad de marca, normativa y funcionalidad.', Icon: IconCommercial },
  { title: 'Oficinas', desc: 'Entornos de trabajo eficientes, luminosos y con acabados de nivel premium.', Icon: IconOffice },
  { title: 'Acabados y calidades', desc: 'Selección de materiales nobles y ejecución al milímetro en cada detalle.', Icon: IconFinishes },
]

const processSteps: ProcessStep[] = [
  { n: '01', title: 'Primera visita', desc: 'Visitamos el espacio, escuchamos qué necesitas y valoramos el alcance real del proyecto. Sin coste ni compromiso.' },
  { n: '02', title: 'Proyecto y presupuesto', desc: 'Elaboramos la propuesta de diseño y un presupuesto cerrado y detallado por partidas: sabes exactamente qué incluye cada euro.' },
  { n: '03', title: 'Materiales', desc: 'Te acompañamos en la elección de acabados con proveedores de confianza y relación directa de fabricante, para acceder a primera calidad al precio justo.' },
  { n: '04', title: 'Planificación', desc: 'Definimos un calendario realista por fases y asignamos un único interlocutor que te acompaña durante toda la obra.' },
  { n: '05', title: 'Ejecución', desc: 'Nuestro equipo ejecuta con control de calidad en cada fase y te mantiene informado del avance semana a semana.' },
  { n: '06', title: 'Entrega de llaves', desc: 'Revisión final al milímetro, repaso conjunto contigo y entrega de un espacio listo para vivir, con garantía post-obra.' },
]

export function ServicesPage() {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <>
      <PageHero
        eyebrow="Servicios"
        title="Cada reforma, un oficio de precisión"
        lead="Desde una intervención puntual hasta una rehabilitación completa: mismo nivel de exigencia en diseño, materiales y ejecución."
        image={heroImg}
      />

      {/* Tarjetas destacadas con revelado al hover */}
      <section className={`section ${styles.featured}`}>
        <div className={`container ${styles.featuredGrid}`}>
          {featured.map((f, i) => (
            <Reveal key={f.label} variant="up" delay={i * 100}>
              <ServiceCard {...f} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Catálogo completo */}
      <section className={styles.catalog}>
        <div className="container">
          <SectionHeader
            index="01"
            eyebrow="Catálogo"
            title="Todo lo que cubrimos"
            lead="Un único equipo para todo el proyecto: sin subcontratas descoordinadas ni responsabilidades diluidas."
            inverse
          />
        </div>

        <div className={`container ${styles.iconGrid}`}>
          {services.map(({ title, desc, Icon }, i) => (
            <Reveal key={title} variant="fade" delay={i * 50} className={styles.iconCard}>
              <span className={styles.iconWrap}>
                <Icon />
              </span>
              <h3 className={styles.iconTitle}>{title}</h3>
              <p className={styles.iconDesc}>{desc}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Proceso */}
      <section className={`section ${styles.process}`}>
        <div className="container">
          <SectionHeader
            index="02"
            eyebrow="Nuestro proceso"
            title="Seis pasos, cero sorpresas"
            lead="Un método probado que mantiene el proyecto dentro de plazo y presupuesto."
          />

          <div className={styles.timelineWrap}>
            <ProcessTimeline steps={processSteps} activeIndex={activeStep} onSelect={setActiveStep} />
          </div>
        </div>
      </section>

      <CtaBand
        title="¿Listo para transformar tu espacio?"
        text="Cuéntanos qué tienes en mente. La primera visita y el presupuesto son gratuitos."
      />
    </>
  )
}
