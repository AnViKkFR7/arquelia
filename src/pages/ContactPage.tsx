import { PageHero } from '../components/ui/PageHero'
import { Reveal } from '../components/ui/Reveal'
import { CTAForm } from '../components/forms/CTAForm'
import styles from './ContactPage.module.css'

const details = [
  { label: 'Email', value: 'info@arquelia.es', href: 'mailto:info@arquelia.es' },
  { label: 'Teléfono', value: '+34 600 000 000', href: 'tel:+34600000000' },
  { label: 'Oficina', value: 'Cornellà de Llobregat, Barcelona' },
  { label: 'Horario', value: 'Lunes a viernes, 9:00 – 18:00' },
]

export function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contacto"
        title="Empecemos por una conversación"
        lead="Cuéntanos qué tienes en mente. La primera visita y el presupuesto son gratuitos y sin compromiso."
      />

      <section className={`section ${styles.section}`}>
        <div className={`container ${styles.grid}`}>
          {/* Formulario */}
          <Reveal variant="up" className={styles.formCard}>
            <span className={`eyebrow ${styles.formEyebrow}`}>Solicitud de presupuesto</span>
            <CTAForm onDone={() => undefined} />
          </Reveal>

          {/* Datos */}
          <div className={styles.info}>
            <Reveal variant="up" delay={100}>
              <h2 className={styles.infoTitle}>Hablemos</h2>
              <p className={styles.infoText}>
                Si prefieres el trato directo, escríbenos o llámanos. Respondemos en menos de 24 h
                laborables.
              </p>
            </Reveal>

            <dl className={styles.details}>
              {details.map((d, i) => (
                <Reveal key={d.label} variant="up" delay={160 + i * 60} className={styles.detail}>
                  <dt className={styles.detailLabel}>{d.label}</dt>
                  <dd className={styles.detailValue}>
                    {d.href ? (
                      <a href={d.href} className={styles.detailLink}>
                        {d.value}
                      </a>
                    ) : (
                      d.value
                    )}
                  </dd>
                </Reveal>
              ))}
            </dl>

            <Reveal variant="up" delay={420}>
              <div className={styles.note}>
                <span className={styles.noteLabel}>Zona de trabajo</span>
                <p>
                  Barcelona ciudad y área metropolitana: Cornellà, Sant Just, Esplugues, Sant Cugat,
                  Sitges y alrededores.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}
