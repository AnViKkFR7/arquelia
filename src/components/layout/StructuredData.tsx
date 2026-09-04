import { useEffect } from 'react'

// Los mismos datos que ya se muestran en la página de contacto (dirección,
// teléfono, horario, zona de trabajo) — no se inventan aquí, se repiten en
// el formato que Google espera para tarjetas de negocio local y resultados
// enriquecidos. Estático, no depende de la ruta ni del idioma: la identidad
// del negocio no cambia entre páginas.
const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'HomeAndConstructionBusiness',
  name: 'Arquelia',
  legalName: 'P & B Cornellà Construcciones, S.L.',
  url: 'https://arquelia.es',
  image: 'https://arquelia.es/og-image.jpg',
  telephone: '+34673456693',
  email: 'info@arquelia.es',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'C/ Rubio i Ors, 130',
    addressLocality: 'Cornellà de Llobregat',
    postalCode: '08940',
    addressRegion: 'Barcelona',
    addressCountry: 'ES',
  },
  areaServed: [
    'Barcelona',
    'Cornellà de Llobregat',
    'Sant Just Desvern',
    'Esplugues de Llobregat',
    'Sant Cugat del Vallès',
    'Sitges',
  ],
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '09:00',
    closes: '18:00',
  },
  // Mismos servicios que ya se listan en `services.catalog.items` (página
  // de Servicios) — para que búsquedas de un tipo de reforma concreto
  // ("reforma de baño Barcelona") tengan algo más específico que agarrar
  // que sólo el nombre de la empresa.
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Servicios de reforma',
    itemListElement: [
      { name: 'Reforma integral', description: 'Transformación completa de la vivienda, de la estructura a los últimos acabados.' },
      { name: 'Reforma de cocina', description: 'Diseño funcional y materiales de alta gama para el corazón de la casa.' },
      { name: 'Reforma de baño', description: 'Espacios de bienestar con acabados exclusivos y grifería de diseño.' },
      { name: 'Interiorismo', description: 'Del concepto a la última pieza de mobiliario, con dirección de proyecto.' },
      { name: 'Rehabilitación', description: 'Recuperación integral de edificios y viviendas respetando su carácter.' },
      { name: 'Local comercial', description: 'Espacios que combinan identidad de marca, normativa y funcionalidad.' },
      { name: 'Oficinas', description: 'Entornos de trabajo eficientes, luminosos y con acabados de nivel premium.' },
    ].map((service) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', ...service },
    })),
  },
}

/**
 * Datos estructurados (JSON-LD) para que Google entienda que Arquelia es un
 * negocio local de construcción/reformas — dirección, zona de trabajo y
 * horario, para resultados de búsqueda local enriquecidos. No renderiza
 * nada visible; vive una vez en `Layout`, por encima de todas las rutas.
 */
export function StructuredData() {
  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(STRUCTURED_DATA)
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [])

  return null
}
