import { useEffect, useRef, useState } from 'react'

type Variant = 'desktop' | 'mobile'

interface VariantInfo {
  count: number
  width: number
  height: number
}

const MANIFEST_URL = '/hero-frames/manifest.json'
// Una única secuencia sirve a las dos variantes: el recorte a 16:9 o 3:4 lo
// resuelve `paint()` vía cover, no hace falta un set de fotogramas por aparte.
const framePath = (i: number) =>
  `/hero-frames/final-frames/ARQUELIA Home Effect${String(i).padStart(3, '0')}.webp`
const posterPath = (variant: Variant) => `/hero-frames/poster-${variant}.webp`

/** Cuántos fotogramas se cargan en paralelo antes de seguir con el resto. */
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
 * Hay dos secuencias: `desktop` (16:9) y `mobile` (3:4 recortado al centro).
 * El número de fotogramas se lee de `manifest.json`, así que regenerar las
 * imágenes no obliga a tocar este archivo.
 *
 * Carga: póster → primeros EAGER fotogramas en paralelo → el resto en segundo
 * plano. Con `prefers-reduced-motion` o ahorro de datos activo se queda el
 * póster estático y no se descarga nada más.
 */
export function HeroCanvas({ progress, className }: HeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const framesRef = useRef<(HTMLImageElement | undefined)[]>([])
  const posterRef = useRef<HTMLImageElement | null>(null)
  const rafRef = useRef(0)
  const lastDrawn = useRef(-1)

  const [variant, setVariant] = useState<Variant | null>(null)
  const [info, setInfo] = useState<VariantInfo | null>(null)
  const [allowSequence, setAllowSequence] = useState(false)

  // Qué variante toca, y si procede cargar la secuencia completa.
  useEffect(() => {
    const pick = () => (window.matchMedia('(min-width: 1024px)').matches ? 'desktop' : 'mobile')
    setVariant(pick())

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    setAllowSequence(!reduce && !conn?.saveData)

    // Si se cruza el umbral (girar tablet, redimensionar) se cambia de set.
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => {
      framesRef.current = []
      lastDrawn.current = -1
      setVariant(pick())
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Manifiesto: cuántos fotogramas tiene la variante activa.
  useEffect(() => {
    if (!variant) return
    let cancelled = false

    fetch(MANIFEST_URL)
      .then((r) => r.json())
      .then((data: Record<Variant, VariantInfo>) => {
        if (!cancelled) setInfo(data[variant] ?? null)
      })
      .catch(() => {
        /* sin manifiesto se queda el póster: degradación aceptable */
      })

    return () => {
      cancelled = true
    }
  }, [variant])

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

  // Tamaño real del canvas según el elemento y la densidad de pantalla.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const { width, height } = canvas.getBoundingClientRect()
      if (!width || !height) return
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      lastDrawn.current = -1
      const current = framesRef.current[0] ?? posterRef.current
      if (current) paint(current)
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [variant])

  // Póster: primer pintado.
  useEffect(() => {
    if (!variant) return
    const img = new Image()
    img.src = posterPath(variant)
    img.decoding = 'async'
    img.onload = () => {
      posterRef.current = img
      if (lastDrawn.current === -1) paint(img)
    }
  }, [variant])

  // Carga de la secuencia.
  useEffect(() => {
    if (!variant || !info || !allowSequence) return
    let cancelled = false

    const load = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image()
        img.src = framePath(i + 1)
        img.decoding = 'async'
        img.onload = () => {
          if (!cancelled) framesRef.current[i] = img
          resolve()
        }
        img.onerror = () => resolve()
      })

    const run = async () => {
      const eager = Math.min(EAGER, info.count)
      await Promise.all(Array.from({ length: eager }, (_, i) => load(i)))
      if (cancelled) return
      for (let i = eager; i < info.count; i++) {
        if (cancelled) return
        await load(i)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [variant, info, allowSequence])

  // Pinta el fotograma correspondiente al progreso.
  useEffect(() => {
    if (!info || !allowSequence) return

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const clamped = Math.min(Math.max(progress, 0), 1)
      const target = Math.round(clamped * (info.count - 1))
      if (target === lastDrawn.current) return

      // Si el fotograma exacto aún no está, usa el más cercano ya cargado.
      let img = framesRef.current[target]
      if (!img) {
        for (let d = 1; d < info.count; d++) {
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
  }, [progress, info, allowSequence])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={variant ? { backgroundImage: `url(${posterPath(variant)})` } : undefined}
      aria-hidden="true"
    />
  )
}
