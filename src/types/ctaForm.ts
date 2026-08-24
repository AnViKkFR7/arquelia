/**
 * IDs estables de tipo de servicio — no cambian con el idioma.
 * La etiqueta que ve el usuario sale de `ctaForm.services.<id>` en los
 * ficheros de traducción (`src/i18n/locales/*.json`).
 */
export const SERVICE_OPTIONS = [
  'integral',
  'cocina',
  'bano',
  'interiorismo',
  'rehabilitacion',
  'local',
  'oficina',
  'otros',
] as const

export type ServiceOption = (typeof SERVICE_OPTIONS)[number]

/**
 * Etiqueta en español de cada servicio, para el cuerpo del email interno.
 * Ese correo lo lee el equipo de Arquelia (habla español), así que va
 * siempre en español — independientemente del idioma en el que el
 * visitante haya rellenado el formulario.
 */
const SERVICE_LABELS_ES: Record<ServiceOption, string> = {
  integral: 'Reforma integral',
  cocina: 'Reforma Cocina',
  bano: 'Reforma Baño',
  interiorismo: 'Interiorismo',
  rehabilitacion: 'Rehabilitación',
  local: 'Local Comercial',
  oficina: 'Oficina',
  otros: 'Otros',
}

export interface CTAFormData {
  servicio: ServiceOption | null
  nombre: string
  poblacion: string
  email: string
  telefono: string
  descripcion: string
}

export const emptyCTAFormData: CTAFormData = {
  servicio: null,
  nombre: '',
  poblacion: '',
  email: '',
  telefono: '',
  descripcion: '',
}

export function buildMessageBody(data: CTAFormData): string {
  return [
    `Nueva solicitud de presupuesto — Arquelia`,
    ``,
    `Tipo de servicio: ${data.servicio ? SERVICE_LABELS_ES[data.servicio] : '—'}`,
    `Nombre: ${data.nombre}`,
    `Población: ${data.poblacion}`,
    `Email: ${data.email}`,
    `Teléfono: ${data.telefono}`,
    ``,
    `Descripción del proyecto:`,
    data.descripcion || '(sin descripción)',
  ].join('\n')
}
