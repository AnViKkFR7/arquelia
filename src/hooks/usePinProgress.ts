import { useEffect, useRef, useState } from 'react'

/**
 * Progreso 0→1 de un recorrido "anclado": el patrón es un contenedor alto
 * (más que una pantalla) cuyo interior es `position: sticky`. Mientras el
 * contenedor recorre su exceso de altura, el interior se queda fijo en el
 * viewport y `progress` avanza de 0 a 1; al salir de ese tramo, el sticky
 * se suelta y la página sigue el scroll normal.
 *
 * Es puramente una función de la posición de scroll (se recalcula en cada
 * evento), así que es reversible gratis: si el usuario sube, `progress`
 * baja solo, sin lógica aparte. Misma técnica que usa el hero para el
 * zoom del canvas.
 */
export function usePinProgress<T extends HTMLElement>(
  /** Se re-mide al cambiar (p. ej. si el alto del recorrido varía por breakpoint). */
  deps: unknown[] = []
) {
  const ref = useRef<T | null>(null)
  const [progress, setProgress] = useState(0)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const el = ref.current
    if (!el) return

    let frame = 0
    const update = () => {
      frame = 0
      const rect = el.getBoundingClientRect()
      const distance = rect.height - window.innerHeight
      const p = distance > 0 ? -rect.top / distance : 0
      setProgress(Math.min(Math.max(p, 0), 1))
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, deps)

  return { ref, progress }
}
