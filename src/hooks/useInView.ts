import { useEffect, useRef, useState } from 'react'

interface Options {
  /** Fracción visible necesaria para disparar. */
  threshold?: number
  /** Margen del root; negativo retrasa el disparo hasta que entra más. */
  rootMargin?: string
  /** Si es false, el estado vuelve a `false` al salir del viewport. */
  once?: boolean
}

/** Detecta cuándo un elemento entra en el viewport. */
export function useInView<T extends HTMLElement>({
  threshold = 0.15,
  rootMargin = '0px 0px -10% 0px',
  once = true,
}: Options = {}) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          if (once) observer.disconnect()
        } else if (!once) {
          setInView(false)
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin, once])

  return { ref, inView }
}
