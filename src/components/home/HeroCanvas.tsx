import { useEffect, useRef, useState } from 'react'

const FRAME_COUNT = 61
const FRAME_PATH = (i: number) => `/hero-frames/hero-${String(i).padStart(4, '0')}.webp`
const POSTER = '/hero-frames/poster.webp'
/** Cuántos fotogramas se cargan antes de considerar la secuencia utilizable. */
const EAGER = 8

interface HeroCanvasProps {
  /** Progreso de scroll 0→1 que controla qué fotograma se pinta. */
  progress: number
  className?: string
}

/**
 * Secuencia de fotogramas pintada en <canvas> y controlada por el scroll.
 * Misma técnica que modusprojects.nl (verificado: usan canvas, no <video>),
 * porque hacer scrub de un <video> con `currentTime` va a tirones en Safari/iOS.
 *
 * Estrategia de carga:
 *   1. Se pinta el póster en cuanto está (una sola imagen, ~40 KB).
 *   2. Se cargan los primeros EAGER fotogramas para que el efecto arranque ya.
 *   3. El resto entra en segundo plano mientras el usuario lee el titular.
 *
 * En móvil y con `prefers-reduced-motion` no se descarga la secuencia: se
 * queda el póster como fondo estático.
 */
export function HeroCanvas({ progress, className }: HeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const framesRef = useRef<(HTMLImageElement | undefined)[]>([])
  const posterRef = useRef<HTMLImageElement | null>(null)
  const rafRef = useRef(0)
  const lastDrawn = useRef(-1)
  const [enabled, setEnabled] = useState(false)

  // ¿Cargamos la secuencia completa o nos quedamos con el póster?
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // `saveData` no está en el tipado estándar de Navigator.
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    setEnabled(wide && !reduce && !conn?.saveData)
  }, [])

  // Dibuja una imagen cubriendo el canvas (equivalente a object-fit: cover).
  const paint = (img: HTMLImageElement) => {
    const canvas = canvasRef.current
    if (!canvas || !img.complete || img.naturalWidth === 0) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cw = canvas.width
    const ch = canvas.height
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
    const w = img.naturalWidth * scale
    const h = img.naturalHeight * scale
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h)
  }

  // Ajusta el tamaño real del canvas al del elemento (con densidad de pantalla).
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      lastDrawn.current = -1
      const current = framesRef.current[0] ?? posterRef.current
      if (current) paint(current)
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Póster: primer pintado.
  useEffect(() => {
    const img = new Image()
    img.src = POSTER
    img.decoding = 'async'
    img.onload = () => {
      posterRef.current = img
      if (lastDrawn.current === -1) paint(img)
    }
  }, [])

  // Carga de la secuencia.
  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    const load = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image()
        img.src = FRAME_PATH(i + 1)
        img.decoding = 'async'
        img.onload = () => {
          if (!cancelled) framesRef.current[i] = img
          resolve()
        }
        img.onerror = () => resolve()
      })

    const run = async () => {
      // Primeros fotogramas en paralelo: el efecto arranca cuanto antes.
      await Promise.all(Array.from({ length: EAGER }, (_, i) => load(i)))
      if (cancelled) return
      // El resto, de uno en uno, para no saturar la conexión.
      for (let i = EAGER; i < FRAME_COUNT; i++) {
        if (cancelled) return
        await load(i)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [enabled])

  // Pinta el fotograma que toca según el progreso.
  useEffect(() => {
    if (!enabled) return

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const clamped = Math.min(Math.max(progress, 0), 1)
      const target = Math.round(clamped * (FRAME_COUNT - 1))
      if (target === lastDrawn.current) return

      // Si el fotograma exacto aún no está, usa el más cercano ya cargado.
      let img = framesRef.current[target]
      if (!img) {
        for (let d = 1; d < FRAME_COUNT; d++) {
          img = framesRef.current[target - d] ?? framesRef.current[target + d]
          if (img) break
        }
      }
      if (!img) return

      paint(img)
      lastDrawn.current = target
    })

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [progress, enabled])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
