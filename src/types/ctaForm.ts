export const SERVICE_OPTIONS = [
  'Reforma integral',
  'Reforma Cocina',
  'Reforma Baño',
  'Interiorismo',
  'Rehabilitación',
  'Local Comercial',
  'Oficina',
  'Otros',
] as const

export type ServiceOption = (typeof SERVICE_OPTIONS)[number]

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
    `Tipo de servicio: ${data.servicio ?? '—'}`,
    `Nombre: ${data.nombre}`,
    `Población: ${data.poblacion}`,
    `Email: ${data.email}`,
    `Teléfono: ${data.telefono}`,
    ``,
    `Descripción del proyecto:`,
    data.descripcion || '(sin descripción)',
  ].join('\n')
}
