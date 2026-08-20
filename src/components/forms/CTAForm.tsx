import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../ui/Button'
import {
  SERVICE_OPTIONS,
  emptyCTAFormData,
  buildMessageBody,
  type CTAFormData,
  type ServiceOption,
} from '../../types/ctaForm'
import {
  IconIntegral,
  IconKitchen,
  IconBathroom,
  IconInterior,
  IconRehab,
  IconCommercial,
  IconOffice,
  IconFinishes,
} from '../icons/ServiceIcons'
import styles from './CTAForm.module.css'

const TOTAL = 4

const STEP_META = [
  { label: 'Proyecto', title: '¿Qué quieres reformar?', hint: 'Elige la opción que más se acerque.' },
  { label: 'Contacto', title: '¿Cómo te contactamos?', hint: 'Solo lo imprescindible para poder responderte.' },
  { label: 'Detalles', title: 'Cuéntanos tu proyecto', hint: 'Opcional, pero nos ayuda a preparar mejor la visita.' },
  { label: 'Resumen', title: 'Revisa y envía', hint: 'Comprueba que todo esté correcto.' },
]

const SERVICE_ICONS: Record<string, () => React.JSX.Element> = {
  'Reforma integral': IconIntegral,
  'Reforma Cocina': IconKitchen,
  'Reforma Baño': IconBathroom,
  Interiorismo: IconInterior,
  Rehabilitación: IconRehab,
  'Local Comercial': IconCommercial,
  Oficina: IconOffice,
  Otros: IconFinishes,
}

interface CTAFormProps {
  onDone: () => void
}

export function CTAForm({ onDone }: CTAFormProps) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<CTAFormData>(emptyCTAFormData)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [sent, setSent] = useState(false)
  const firstFieldRef = useRef<HTMLInputElement | null>(null)

  const update = <K extends keyof CTAFormData>(key: K, value: CTAFormData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }))

  // Al llegar al paso de datos, el foco va al primer campo.
  useEffect(() => {
    if (step === 1) firstFieldRef.current?.focus()
  }, [step])

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.email.trim())
  const phoneValid = data.telefono.replace(/\D/g, '').length >= 9

  const errors = {
    nombre: touched.nombre && data.nombre.trim() === '' ? 'Dinos cómo te llamas.' : null,
    email:
      touched.email && !emailValid
        ? data.email.trim() === ''
          ? 'Necesitamos un email para responderte.'
          : 'Ese email no parece válido.'
        : null,
    telefono:
      touched.telefono && !phoneValid
        ? data.telefono.trim() === ''
          ? 'Necesitamos un teléfono de contacto.'
          : 'Ese teléfono no parece válido.'
        : null,
  }

  const canAdvance = () => {
    if (step === 0) return data.servicio !== null
    if (step === 1) return data.nombre.trim() !== '' && emailValid && phoneValid
    return true
  }

  const goNext = () => {
    if (step === 1 && !canAdvance()) {
      setTouched({ nombre: true, email: true, telefono: true })
      return
    }
    setStep((s) => Math.min(s + 1, TOTAL - 1))
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
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12.5l5.5 5.5L20 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <p className={styles.doneEyebrow}>Solicitud enviada</p>
        <h2 className={styles.doneTitle}>
          Gracias{data.nombre ? `, ${data.nombre.split(' ')[0]}` : ''}.
        </h2>
        <p className={styles.doneText}>
          Hemos recibido tu solicitud de <strong>{data.servicio?.toLowerCase()}</strong>. Revisaremos
          el proyecto y te contactaremos en menos de 24 h laborables.
        </p>
        <div className={styles.doneActions}>
          <Button variant="solid" onClick={onDone}>
            Cerrar
          </Button>
          <Button to="/proyectos" variant="outline" arrow onClick={onDone}>
            Ver proyectos
          </Button>
        </div>
      </div>
    )
  }

  const meta = STEP_META[step]

  return (
    <div className={styles.form}>
      {/* ── Cabecera de progreso ── */}
      <header className={styles.head}>
        <ol className={styles.steps}>
          {STEP_META.map((s, i) => (
            <li
              key={s.label}
              className={`${styles.stepChip} ${i === step ? styles.chipOn : ''} ${
                i < step ? styles.chipDone : ''
              }`}
            >
              <span className={styles.chipNum}>
                {i < step ? (
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M4 12.5l5.5 5.5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className={styles.chipLabel}>{s.label}</span>
            </li>
          ))}
        </ol>

        <div className={styles.track} aria-hidden="true">
          <span className={styles.trackFill} style={{ transform: `scaleX(${(step + 1) / TOTAL})` }} />
        </div>
      </header>

      {/* ── Cuerpo ── */}
      <div key={step} className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.title}>{meta.title}</h2>
          <p className={styles.hint}>{meta.hint}</p>
        </div>

        {step === 0 && (
          <div className={styles.services} role="radiogroup" aria-label="Tipo de proyecto">
            {SERVICE_OPTIONS.map((option, i) => {
              const Icon = SERVICE_ICONS[option] ?? IconFinishes
              const active = data.servicio === option
              return (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`${styles.service} ${active ? styles.serviceOn : ''}`}
                  style={{ animationDelay: `${i * 35}ms` }}
                  onClick={() => {
                    update('servicio', option as ServiceOption)
                    setStep(1)
                  }}
                >
                  <span className={styles.serviceIcon}>
                    <Icon />
                  </span>
                  <span className={styles.serviceLabel}>{option}</span>
                  <span className={styles.serviceTick} aria-hidden="true" />
                </button>
              )
            })}
          </div>
        )}

        {step === 1 && (
          <div className={styles.fields}>
            <Field
              ref={firstFieldRef}
              label="Nombre completo"
              required
              type="text"
              autoComplete="name"
              placeholder="Nombre y apellidos"
              value={data.nombre}
              error={errors.nombre}
              onChange={(v) => update('nombre', v)}
              onBlur={() => setTouched((t) => ({ ...t, nombre: true }))}
            />
            <div className={styles.fieldRow}>
              <Field
                label="Email"
                required
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={data.email}
                error={errors.email}
                onChange={(v) => update('email', v)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              />
              <Field
                label="Teléfono"
                required
                type="tel"
                autoComplete="tel"
                placeholder="+34 600 000 000"
                value={data.telefono}
                error={errors.telefono}
                onChange={(v) => update('telefono', v)}
                onBlur={() => setTouched((t) => ({ ...t, telefono: true }))}
              />
            </div>
            <Field
              label="Población"
              type="text"
              autoComplete="address-level2"
              placeholder="Barcelona"
              value={data.poblacion}
              onChange={(v) => update('poblacion', v)}
            />
          </div>
        )}

        {step === 2 && (
          <div className={styles.fields}>
            <label className={styles.field}>
              <span className={styles.label}>Descripción</span>
              <textarea
                className={styles.textarea}
                rows={6}
                maxLength={800}
                value={data.descripcion}
                onChange={(e) => update('descripcion', e.target.value)}
                placeholder="Superficie aproximada, qué espacios, plazos, referencias que te gusten…"
              />
              <span className={styles.counterSmall}>{data.descripcion.length} / 800</span>
            </label>
          </div>
        )}

        {step === 3 && (
          <>
            <dl className={styles.summary}>
              <SummaryRow label="Proyecto" value={data.servicio} onEdit={() => setStep(0)} />
              <SummaryRow label="Nombre" value={data.nombre} onEdit={() => setStep(1)} />
              <SummaryRow label="Email" value={data.email} onEdit={() => setStep(1)} />
              <SummaryRow label="Teléfono" value={data.telefono} onEdit={() => setStep(1)} />
              <SummaryRow label="Población" value={data.poblacion || '—'} onEdit={() => setStep(1)} />
              {data.descripcion && (
                <SummaryRow label="Detalles" value={data.descripcion} onEdit={() => setStep(2)} />
              )}
            </dl>
            <p className={styles.privacy}>
              Al enviar aceptas la <Link to="/privacidad">política de privacidad</Link>. Usaremos tus
              datos únicamente para responder a esta solicitud.
            </p>
          </>
        )}
      </div>

      {/* ── Acciones ── */}
      <footer className={styles.actions}>
        {step > 0 ? (
          <button type="button" className={styles.back} onClick={() => setStep((s) => s - 1)}>
            <span aria-hidden="true">←</span> Atrás
          </button>
        ) : (
          <span className={styles.backSpacer} />
        )}

        {step < TOTAL - 1 ? (
          <Button variant="solid" disabled={step === 0 && !canAdvance()} onClick={goNext} arrow>
            Continuar
          </Button>
        ) : (
          <Button variant="gold" onClick={submit} arrow>
            Enviar solicitud
          </Button>
        )}
      </footer>
    </div>
  )
}

/* ─── Subcomponentes ─────────────────────────────────── */

interface FieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  type?: string
  placeholder?: string
  autoComplete?: string
  required?: boolean
  error?: string | null
  ref?: React.Ref<HTMLInputElement>
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  type = 'text',
  placeholder,
  autoComplete,
  required,
  error,
  ref,
}: FieldProps) {
  return (
    <label className={`${styles.field} ${error ? styles.fieldError : ''}`}>
      <span className={styles.label}>
        {label}
        {required && <span className={styles.req} aria-hidden="true">*</span>}
      </span>
      <input
        ref={ref}
        className={styles.input}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
      <span className={styles.underline} aria-hidden="true" />
      {error && <span className={styles.error}>{error}</span>}
    </label>
  )
}

function SummaryRow({
  label,
  value,
  onEdit,
}: {
  label: string
  value: string | null
  onEdit: () => void
}) {
  return (
    <div className={styles.summaryRow}>
      <dt className={styles.summaryKey}>{label}</dt>
      <dd className={styles.summaryVal}>{value}</dd>
      <button type="button" className={styles.summaryEdit} onClick={onEdit}>
        Editar
      </button>
    </div>
  )
}
