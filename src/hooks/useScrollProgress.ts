import { useEffect, useRef, useState } from 'react'

/**
 * Progreso (0→1) del recorrido de un elemento por el viewport.
 * 0 = el elemento acaba de entrar por abajo; 1 = acaba de salir por arriba.
 * Actualiza con rAF para no bloquear el hilo de scroll.
 */
export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setProgress(0.5)
      return
    }

    let frame = 0

    const update = () => {
      frame = 0
      const rect = el.getBoundingClientRect()
      const vh = window.innerHeight
      const total = vh + rect.height
      const travelled = vh - rect.top
      const next = Math.min(Math.max(travelled / total, 0), 1)
      setProgress(next)
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
  }, [])

  return { ref, progress }
}
