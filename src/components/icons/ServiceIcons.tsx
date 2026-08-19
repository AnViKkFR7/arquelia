import type { SVGProps } from 'react'

const base: SVGProps<SVGSVGElement> = {
  width: 28,
  height: 28,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function IconIntegral() {
  return (
    <svg {...base}>
      <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" />
    </svg>
  )
}

export function IconKitchen() {
  return (
    <svg {...base}>
      <rect x="3" y="4" width="18" height="16" rx="0" />
      <path d="M3 10h18M8 4v6M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01M16 17h.01" />
    </svg>
  )
}

export function IconBathroom() {
  return (
    <svg {...base}>
      <path d="M4 12h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3Z" />
      <path d="M6 12V6a2 2 0 0 1 3.5-1.3M9 8h1" />
    </svg>
  )
}

export function IconInterior() {
  return (
    <svg {...base}>
      <path d="M4 21V9l8-6 8 6v12" />
      <path d="M9 21v-7h6v7" />
      <path d="M4 21h16" />
    </svg>
  )
}

export function IconRehab() {
  return (
    <svg {...base}>
      <path d="M14.5 3.5 20.5 9.5 9.5 20.5 3.5 14.5Z" />
      <path d="M13 5 19 11" />
    </svg>
  )
}

export function IconCommercial() {
  return (
    <svg {...base}>
      <path d="M3 21V8l9-5 9 5v13" />
      <path d="M3 21h18M9 21v-6h6v6M9 12h.01M15 12h.01M9 8h.01M15 8h.01" />
    </svg>
  )
}

export function IconOffice() {
  return (
    <svg {...base}>
      <rect x="4" y="3" width="16" height="18" rx="0" />
      <path d="M9 21v-4h6v4M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01" />
    </svg>
  )
}

export function IconFinishes() {
  return (
    <svg {...base}>
      <path d="M12 2 2 8l10 6 10-6-10-6Z" />
      <path d="M2 16l10 6 10-6M2 12l10 6 10-6" />
    </svg>
  )
}
