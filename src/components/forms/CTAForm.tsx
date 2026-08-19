import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import {
  SERVICE_OPTIONS,
  emptyCTAFormData,
  buildMessageBody,
  type CTAFormData,
  type ServiceOption,
} from '../../types/ctaForm'
import styles from './CTAForm.module.css'

const TOTAL = 4

interface CTAFormProps {
  onDone: () => void
}

export function CTAForm({ onDone }: CTAFormProps) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<CTAFormData>(emptyCTAFormData)
  const [sent, setSent] = useState(false)

  const update = <K extends keyof CTAFormData>(key: K, value: CTAFormData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }))

  const canAdvance = () => {
    if (step === 0) return data.servicio !== null
    if (step === 1)
      return data.nombre.trim() !== '' && data.email.trim() !== '' && data.telefono.trim() !== ''
    return true
  }

  const submit = () => {
    // TODO (F6): enviar a info@arquelia.es vía Supabase Edge Function + Resend.
    console.info('Solicitud de presupuesto\n', buildMessageBody(data))
    setSent(true)
  }

  if (sent) {
    return (
      <div className={styles.done}>
        <span className={styles.doneMark} aria-hidden="true">
          ✓
        </span>
        <h2 className={styles.doneTitle}>
          Gracias{data.nombre ? `, ${data.nombre.split(' ')[0]}` : ''}.
        </h2>
        <p className={styles.doneText}>
          Hemos recibido tu solicitud. Revisaremos tu proyecto y te contactaremos en menos de 24 h
          laborables.
        </p>
        <Button variant="solid" onClick={onDone}>
          Cerrar
        </Button>
      </div>
    )
  }

  return (
    <div className={styles.form}>
      <div className={styles.progress}>
        <div className={styles.bars}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <span key={i} className={`${styles.bar} ${i <= step ? styles.barOn : ''}`} />
          ))}
        </div>
        <span className={styles.counter}>
          {String(step + 1).padStart(2, '0')} / {String(TOTAL).padStart(2, '0')}
        </span>
      </div>

      {step === 0 && (
        <fieldset className={styles.step}>
          <legend className={styles.stepTitle}>¿Qué quieres reformar?</legend>
          <p className={styles.stepHint}>Elige la opción que más se acerque.</p>
          <div className={styles.services}>
            {SERVICE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`${styles.service} ${data.servicio === option ? styles.serviceOn : ''}`}
                aria-pressed={data.servicio === option}
                onClick={() => {
                  update('servicio', option as ServiceOption)
                  setStep(1)
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {step === 1 && (
        <div className={styles.step}>
          <h2 className={styles.stepTitle}>¿Cómo te contactamos?</h2>
          <div className={styles.fields}>
            <label className={styles.field}>
              <span className={styles.label}>Nombre completo *</span>
              <input
                type="text"
                autoComplete="name"
                value={data.nombre}
                onChange={(e) => update('nombre', e.target.value)}
                placeholder="Nombre y apellidos"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Población</span>
              <input
                type="text"
                autoComplete="address-level2"
                value={data.poblacion}
                onChange={(e) => update('poblacion', e.target.value)}
                placeholder="Barcelona"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Email *</span>
              <input
                type="email"
                autoComplete="email"
                value={data.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="tu@email.com"
              />
            </label>
            <label className={styles.field}>
              <span className={styles.label}>Teléfono *</span>
              <input
                type="tel"
                autoComplete="tel"
                value={data.telefono}
                onChange={(e) => update('telefono', e.target.value)}
                placeholder="+34 600 000 000"
              />
            </label>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={styles.step}>
          <h2 className={styles.stepTitle}>Cuéntanos tu proyecto</h2>
          <p className={styles.stepHint}>Opcional, pero nos ayuda a preparar mejor la visita.</p>
          <label className={styles.field}>
            <span className={styles.label}>Descripción</span>
            <textarea
              rows={5}
              value={data.descripcion}
              onChange={(e) => update('descripcion', e.target.value)}
              placeholder="Superficie aproximada, qué espacios, plazos, referencias que te gusten…"
            />
          </label>
        </div>
      )}

      {step === 3 && (
        <div className={styles.step}>
          <h2 className={styles.stepTitle}>Revisa y envía</h2>
          <dl className={styles.summary}>
            <div className={styles.summaryRow}>
              <dt className={styles.summaryKey}>Servicio</dt>
              <dd className={styles.summaryVal}>{data.servicio}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt className={styles.summaryKey}>Nombre</dt>
              <dd className={styles.summaryVal}>{data.nombre}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt className={styles.summaryKey}>Población</dt>
              <dd className={styles.summaryVal}>{data.poblacion || '—'}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt className={styles.summaryKey}>Email</dt>
              <dd className={styles.summaryVal}>{data.email}</dd>
            </div>
            <div className={styles.summaryRow}>
              <dt className={styles.summaryKey}>Teléfono</dt>
              <dd className={styles.summaryVal}>{data.telefono}</dd>
            </div>
            {data.descripcion && (
              <div className={styles.summaryRow}>
                <dt className={styles.summaryKey}>Proyecto</dt>
                <dd className={styles.summaryVal}>{data.descripcion}</dd>
              </div>
            )}
          </dl>
          <p className={styles.privacy}>
            Al enviar aceptas nuestra <Link to="/privacidad">política de privacidad</Link>. Usaremos
            tus datos únicamente para responder a esta solicitud.
          </p>
        </div>
      )}

      <div className={styles.actions}>
        {step > 0 && (
          <button type="button" className={styles.back} onClick={() => setStep((s) => s - 1)}>
            ← Atrás
          </button>
        )}

        {step < TOTAL - 1 ? (
          <Button
            variant="solid"
            className={styles.next}
            disabled={!canAdvance()}
            onClick={() => setStep((s) => Math.min(s + 1, TOTAL - 1))}
            arrow
          >
            Continuar
          </Button>
        ) : (
          <Button variant="gold" className={styles.next} onClick={submit} arrow>
            Enviar solicitud
          </Button>
        )}
      </div>
    </div>
  )
}
