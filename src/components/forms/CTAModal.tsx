import { useEffect, useRef, type ReactNode } from 'react'
import styles from './CTAModal.module.css'

interface CTAModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

export function CTAModal({ isOpen, onClose, children }: CTAModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    restoreFocus.current = document.activeElement as HTMLElement

    // Bloquea el scroll de fondo sin que la página dé un salto lateral
    // al desaparecer la barra de desplazamiento.
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    const prevOverflow = document.body.style.overflow
    const prevPadding = document.body.style.paddingRight
    document.body.style.overflow = 'hidden'
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }

      // Mantiene el foco dentro del diálogo mientras está abierto.
      if (e.key !== 'Tab') return
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
      )
      if (!focusables || focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prevOverflow
      document.body.style.paddingRight = prevPadding
      restoreFocus.current?.focus?.()
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className={styles.overlay}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cta-modal-title"
      >
        <header className={styles.bar}>
          <span className={styles.brand} id="cta-modal-title">
            <span className={styles.brandMark} aria-hidden="true" />
            Solicitar presupuesto
          </span>

          <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className={styles.content}>{children}</div>
      </div>
    </div>
  )
}
