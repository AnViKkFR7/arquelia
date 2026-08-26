import { useEffect, useRef, useState } from 'react'

type Variant = 'desktop' | 'mobile'

interface VariantInfo {
  count: number
  width: number
  height: number
}

const MANIFEST_URL = '/hero-frames/manifest.json'
// Una carpeta por variante, cada una a su tamaño real en pantalla — no un
// único set a resolución de escritorio que el móvil también tuviera que
// descargar. Ver `design-refs/build_hero_frames.py`: mismo número de
// fotogramas en las dos (121, ninguno saltado, para no perder fluidez),
// pero el móvil pesa un 70% menos porque nunca fue pensado para llenar una
// pantalla de escritorio.
const framePath = (variant: Variant, i: number) =>
  `/hero-frames/${variant}/hero-${String(i).padStart(4, '0')}.webp`
const posterPath = (variant: Variant) => `/hero-frames/poster-${variant}.webp`

/** Cuántas descargas de fotogramas corren en paralelo a la vez. */
const CONCURRENCY = 6

/**
 * Orden de carga por subdivisión binaria: 0, el último, el del medio, los
 * dos cuartos, los cuatro octavos... — no 0,1,2,3,4,5,6,7,8,9...
 *
 * Es el mismo orden que usa modusprojects.nl (comprobado inspeccionando sus
 * peticiones de red en vivo: 0, 120, 60, 30, 90, 15, 45, 75, 105, 7...,
 * exactamente esta subdivisión). La diferencia frente a cargar en orden es
 * enorme: con sólo 10-15 fotogramas descargados ya hay cobertura repartida
 * por todo el recorrido de scroll, así que aunque la red vaya lenta o el
 * usuario haga scroll rápido antes de que termine de cargar todo, siempre
 * hay un fotograma razonablemente cercano lo bastante pronto. Cargando en
 * orden 0,1,2,3..., con esa misma cantidad de fotogramas sólo se cubre el
 * primer 10-15% del recorrido — el resto se queda clavado en el último
 * fotograma cargado hasta que le toca, que es justo el síntoma reportado:
 * "hace zoom unos pocos fotogramas y se baja a la siguiente sección".
 */
function binaryLoadOrder(count: number): number[] {
  if (count <= 0) return []
  if (count === 1) return [0]

  const order = [0, count - 1]
  const queue: [number, number][] = [[0, count - 1]]
  while (queue.length) {
    const [a, b] = queue.shift()!
    if (b - a <= 1) continue
    const mid = Math.floor((a + b) / 2)
    order.push(mid)
    queue.push([a, mid], [mid, b])
  }
  return order
}

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
 * Carga: póster → secuencia completa en segundo plano, por subdivisión
 * binaria (ver `binaryLoadOrder`) con varias descargas en paralelo. Con
 * `prefers-reduced-motion` o ahorro de datos activo se queda el póster
 * estático y no se descarga nada más.
 */
export function HeroCanvas({ progress, className }: HeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const framesRef = useRef<(HTMLImageElement | undefined)[]>([])
  const posterRef = useRef<HTMLImageElement | null>(null)
  const rafRef = useRef(0)
  const lastDrawn = useRef(-1)
  // El progreso "de verdad" para el repintado que dispara la carga de fondo:
  // ese efecto se monta una sola vez por variante, así que no puede leer
  // `progress` de un cierre — necesita la versión más reciente en cada
  // fotograma que termina de cargar, no la que había en el momento del montaje.
  const progressRef = useRef(progress)
  progressRef.current = progress

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

  // Busca el fotograma cargado más cercano a `target` y lo pinta si mejora
  // lo que ya había — se usa tanto al cambiar `progress` como cada vez que
  // termina de llegar un fotograma nuevo (para corregir el resultado sin
  // esperar a que el usuario vuelva a mover el scroll).
  const paintNearest = (count: number, target: number) => {
    const frames = framesRef.current
    if (frames[target]) {
      if (target !== lastDrawn.current) {
        paint(frames[target]!)
        lastDrawn.current = target
      }
      return
    }

    let best: number | null = null
    for (let d = 1; d < count; d++) {
      if (frames[target - d]) {
        best = target - d
        break
      }
      if (frames[target + d]) {
        best = target + d
        break
      }
    }
    if (best === null) return

    // Sólo repinta si el candidato queda más cerca del objetivo que el
    // fotograma que ya está dibujado — si no, no tiene sentido sustituir
    // uno bueno por otro igual de aproximado.
    const currentDistance = Math.abs(lastDrawn.current - target)
    const bestDistance = Math.abs(best - target)
    if (lastDrawn.current !== -1 && bestDistance >= currentDistance) return

    paint(frames[best]!)
    lastDrawn.current = best
  }

  // Tamaño real del canvas según el elemento y la densidad de pantalla.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let raf = 0
    const resize = () => {
      // Se programa al frame siguiente, no se calcula en el propio evento:
      // en móvil, ocultar/mostrar la barra de direcciones del navegador
      // dispara `resize` en pleno scroll, en el mismo instante en que el
      // alto de `.sticky` (100svh) también se está recalculando. Leer
      // `getBoundingClientRect()` de forma síncrona ahí a veces devolvía un
      // alto a medio actualizar, y el canvas se quedaba dibujado más
      // pequeño que su caja real — el hueco se veía como una franja negra
      // (el `background-color` de reserva del propio `<canvas>`) debajo de
      // la imagen. Esperar un frame deja que el layout se asiente primero.
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        raf = 0
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const { width, height } = canvas.getBoundingClientRect()
        if (!width || !height) return
        canvas.width = Math.round(width * dpr)
        canvas.height = Math.round(height * dpr)
        // Repinta el mismo fotograma que tocaba, no vuelve siempre al
        // primero: forzarlo se veía como un salto brusco hacia atrás cada
        // vez que el redimensionado llegaba a media secuencia.
        const target = lastDrawn.current
        const current = (target >= 0 ? framesRef.current[target] : undefined) ?? posterRef.current
        if (current) paint(current)
      })
    }

    resize()
    window.addEventListener('resize', resize)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
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

  // Carga de la secuencia, por subdivisión binaria y en paralelo.
  useEffect(() => {
    if (!variant || !info || !allowSequence) return
    let cancelled = false

    const load = (i: number) =>
      new Promise<void>((resolve) => {
        const img = new Image()
        img.src = framePath(variant, i + 1)
        img.decoding = 'async'
        img.onload = () => {
          if (!cancelled) {
            framesRef.current[i] = img
            // Puede que el fotograma recién llegado sea justo el que hace
            // falta para el punto de scroll actual (o uno mejor que el que
            // había): se reintenta el pintado sin esperar a un nuevo scroll.
            const clamped = Math.min(Math.max(progressRef.current, 0), 1)
            const target = Math.round(clamped * (info.count - 1))
            paintNearest(info.count, target)
          }
          resolve()
        }
        img.onerror = () => resolve()
      })

    const order = binaryLoadOrder(info.count)

    const run = async () => {
      let next = 0
      const worker = async () => {
        while (!cancelled) {
          const i = order[next++]
          if (i === undefined) return
          await load(i)
        }
      }
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, order.length) }, worker))
    }

    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant, info, allowSequence])

  // Pinta el fotograma correspondiente al progreso.
  useEffect(() => {
    if (!info || !allowSequence) return

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const clamped = Math.min(Math.max(progress, 0), 1)
      const target = Math.round(clamped * (info.count - 1))
      // A diferencia de `paintNearest`, aquí sí hay que pintar aunque el
      // candidato no "mejore" nada: el usuario se ha movido a un punto de
      // scroll distinto y quiere ver lo más cercano a ESE punto, no seguir
      // viendo el fotograma de antes sólo porque estaba más cerca del suyo.
      lastDrawn.current = -1
      paintNearest(info.count, target)
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
