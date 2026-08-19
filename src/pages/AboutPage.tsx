import { PageHero } from '../components/ui/PageHero'
import { SectionHeader } from '../components/ui/SectionHeader'
import { Reveal } from '../components/ui/Reveal'
import { Marquee } from '../components/ui/Marquee'
import { CtaBand } from '../components/home/CtaBand'
import styles from './AboutPage.module.css'

import heroImg from '../assets/livingroom_kitchen.webp'
import portraitImg from '../assets/cocina_01.jpg'

/** Las "tres M" — adaptación del patrón de modusprojects.nl. */
const pillars = [
  {
    n: '01',
    title: 'Maestría',
    desc: 'Años de oficio aplicados a cada detalle, sin margen para la improvisación. Cada trabajo, en manos de quien lo domina: no repartimos la obra entre subcontratas descoordinadas.',
  },
  {
    n: '02',
    title: 'Materiales',
    desc: 'Seleccionamos materiales nobles y proveedores de confianza. La relación directa con fabricante nos permite acceder a primera calidad a un precio que tiene sentido.',
  },
  {
    n: '03',
    title: 'Método',
    desc: 'Un único interlocutor y un proceso claro, de la primera visita a la entrega de llaves. Presupuesto cerrado, calendario realista y comunicación semanal.',
  },
]

const numbers = [
  { value: '15+', label: 'Años de experiencia' },
  { value: '120+', label: 'Proyectos entregados' },
  { value: '100%', label: 'Presupuestos cerrados' },
  { value: '2 años', label: 'Garantía post-obra' },
]

export function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Sobre nosotros"
        title={
          <>
            Construimos con la dedicación
            <br />
            que pondríamos en nuestra casa
          </>
        }
        image={heroImg}
        tall
      />

      {/* Texto de empresa */}
      <section className={`section ${styles.intro}`}>
        <div className={`container ${styles.introGrid}`}>
          <Reveal variant="up">
            <p className={styles.introLead}>
              Arquelia nace de la voluntad de hacer las cosas bien, sin atajos.
            </p>
          </Reveal>

          <Reveal variant="up" delay={100}>
            <div className={styles.introText}>
              <p>
                Detrás de cada proyecto hay un equipo que entiende la construcción como un oficio de
                precisión, donde el trato con el cliente pesa tanto como el último acabado de obra.
                Reformamos hogares, locales y oficinas en toda Cataluña bajo la razón social{' '}
                <strong>P &amp; B Cornellà Construcciones, S.L.</strong>
              </p>
              <p>
                No trabajamos por volumen. Aceptamos los proyectos que podemos atender de verdad, con
                el equipo propio y el tiempo que cada obra merece. Eso significa menos obras a la vez
                y más atención en cada una.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Franja de marquesina */}
      <div className={styles.band}>
        <Marquee text="Precisión · Materiales nobles · Palabra dada" separator="◆" speed={62} />
      </div>

      {/* Tres pilares */}
      <section className={`section ${styles.pillars}`}>
        <div className="container">
          <SectionHeader
            index="01"
            eyebrow="Tres pilares"
            title="Una forma de trabajar"
            lead="No es un eslogan: es lo que revisamos en cada obra antes de dar una fase por cerrada."
          />

          <div className={styles.pillarsGrid}>
            {pillars.map((p, i) => (
              <Reveal key={p.n} variant="up" delay={i * 110} className={styles.pillar}>
                <span className={styles.pillarNumber}>{p.n}</span>
                <h3 className={styles.pillarTitle}>{p.title}</h3>
                <p className={styles.pillarDesc}>{p.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Cifras + imagen */}
      <section className={styles.numbers}>
        <div className={`container ${styles.numbersGrid}`}>
          <Reveal variant="clip" className={styles.numbersImage}>
            <img src={portraitImg} alt="Detalle de una reforma de Arquelia" loading="lazy" />
          </Reveal>

          <div className={styles.numbersList}>
            <Reveal variant="fade">
              <span className={`eyebrow ${styles.numbersEyebrow}`}>En cifras</span>
            </Reveal>
            {numbers.map((n, i) => (
              <Reveal key={n.label} variant="up" delay={i * 80} className={styles.number}>
                <span className={styles.numberValue}>{n.value}</span>
                <span className={styles.numberLabel}>{n.label}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  )
}
