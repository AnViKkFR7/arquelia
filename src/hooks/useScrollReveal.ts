import { useLayoutEffect, useRef } from 'react'

/* ── Ajustes del movimiento ──────────────────────────────
   Calcados en espíritu de la referencia (siteassist.com), que usa GSAP
   ScrollTrigger con `scrub: 0.8` + `ease: power1.out` + stagger real.
   Los tres ingredientes que dan la sensación de "vivo" son, por orden de
   importancia: el suavizado (LERP), la curva de salida (easeOut) y el
   escalonado entre hermanos (STAGGER). El desplazamiento en sí es lo de
   menos — de hecho la referencia mueve el 100% del alto de cada tarjeta,
   pero no se percibe brusco porque llega y frena, en vez de arrastrarse. */

/** Progreso 0 cuando el borde superior del elemento está a esta altura (en pantallas). */
const START_VH = 1
/**
 * Progreso 1 cuando llega a esta altura. La diferencia con START_VH es el
 * recorrido útil: con 0.25 el movimiento sigue siendo perceptible hasta
 * media pantalla. Con valores altos (0.45) se agota en la quinta parte
 * inferior — el elemento ya está quieto cuando el ojo llega a él, que era
 * exactamente la sensación de "esto no se mueve".
 */
const END_VH = 0.25
/**
 * Suavizado: cada fotograma el valor aplicado se acerca un 14% al que
 * pide el scroll, en vez de pegarse a él 1:1. Es el equivalente al
 * `scrub: 0.8` de la referencia — sin esto el movimiento va clavado a la
 * rueda del ratón y se siente mecánico, por muy grande que sea.
 */
const LERP = 0.14

/** Desplazamiento = este % del alto del elemento, acotado entre MIN y MAX px. */
const OFFSET_RATIO = 0.45
const OFFSET_MIN = 28
const OFFSET_MAX = 110

/** Un `delay` de estos ms equivale a retrasar el recorrido entero del elemento. */
const STAGGER_MS_FULL = 700
/** Tope, para que el último hermano de una serie no se quede sin recorrido. */
const STAGGER_MAX = 0.4

/** La opacidad va algo por delante del movimiento: el texto se lee antes de asentarse. */
const OPACITY_BOOST = 1.25

interface Entry {
  el: HTMLElement
  stagger: number
  current: number
  target: number
  offset: number
  active: boolean
}

/* ── Ticker compartido ───────────────────────────────────
   Un solo rAF y un solo IntersectionObserver para todos los <Reveal> de la
   página (hay ~40): con un bucle por componente el coste se multiplicaría
   por cuarenta para hacer exactamente el mismo trabajo. Además se escribe
   el estilo directamente en el nodo, sin pasar por el estado de React, para
   no provocar 40 re-renders por fotograma. */

const entries = new Map<HTMLElement, Entry>()
let observer: IntersectionObserver | null = null
let frame = 0
let scrolled = true

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
/** power1.out, la misma curva que la referencia: arranca rápido y frena al llegar. */
const easeOut = (p: number) => 1 - Math.pow(1 - p, 2)

function measure(e: Entry, vh: number) {
  const rect = e.el.getBoundingClientRect()
  e.offset = Math.min(Math.max(rect.height * OFFSET_RATIO, OFFSET_MIN), OFFSET_MAX)
  const raw = clamp01((START_VH * vh - rect.top) / ((START_VH - END_VH) * vh))
  e.target = clamp01((raw - e.stagger) / (1 - e.stagger))
}

function apply(e: Entry) {
  const p = easeOut(e.current)
  e.el.style.transform = `translate3d(0, ${((1 - p) * e.offset).toFixed(2)}px, 0)`
  e.el.style.opacity = String(Math.min(p * OPACITY_BOOST, 1))
}

function tick() {
  const vh = window.innerHeight
  const live: Entry[] = []
  for (const e of entries.values()) if (e.active) live.push(e)

  // Primero se mide todo y después se escribe todo: intercalar lecturas de
  // getBoundingClientRect() con escrituras de estilo obliga al navegador a
  // recalcular el layout en cada vuelta del bucle.
  for (const e of live) measure(e, vh)

  let moving = false
  for (const e of live) {
    const d = e.target - e.current
    if (Math.abs(d) < 0.0005) {
      e.current = e.target
    } else {
      e.current += d * LERP
      moving = true
    }
    apply(e)
  }

  // Se para el bucle cuando ya no queda nada por asentar y el usuario no
  // está scrolleando; cualquier scroll o resize lo vuelve a arrancar.
  if (!moving && !scrolled) {
    frame = 0
    return
  }
  scrolled = false
  frame = requestAnimationFrame(tick)
}

function wake() {
  scrolled = true
  if (!frame) frame = requestAnimationFrame(tick)
}

function ensureObserver() {
  if (observer) return observer
  observer = new IntersectionObserver(
    (records) => {
      for (const r of records) {
        const e = entries.get(r.target as HTMLElement)
        if (e) e.active = r.isIntersecting
      }
      wake()
    },
    // Margen generoso: el elemento tiene que estar "vivo" bastante antes de
    // asomar, porque su recorrido empieza justo al borde inferior.
    { rootMargin: '60% 0px 60% 0px' }
  )
  window.addEventListener('scroll', wake, { passive: true })
  window.addEventListener('resize', wake, { passive: true })
  return observer
}

function register(el: HTMLElement, delay: number) {
  const e: Entry = {
    el,
    stagger: Math.min(delay / STAGGER_MS_FULL, STAGGER_MAX),
    current: 0,
    target: 0,
    offset: OFFSET_MIN,
    active: true,
  }
  entries.set(el, e)

  // Estado inicial ya en este fotograma (useLayoutEffect corre antes de
  // pintar), y si el elemento ya está pasado — p. ej. al volver a una ruta
  // con el scroll a media página — se coloca revelado sin animar.
  measure(e, window.innerHeight)
  if (e.target >= 1) e.current = 1
  apply(e)

  ensureObserver().observe(el)
  wake()
}

function unregister(el: HTMLElement) {
  entries.delete(el)
  observer?.unobserve(el)
}

/**
 * Revelado ligado al scroll: el desplazamiento y la opacidad son función de
 * la posición real del elemento, suavizada, así que es reversible sin lógica
 * aparte (al subir, el movimiento se deshace solo).
 *
 * Escribe el estilo directamente en el nodo — el componente que lo usa no
 * debe pasarle `style` por React o se pisarían mutuamente.
 */
export function useScrollReveal<T extends HTMLElement>(delay = 0) {
  const ref = useRef<T | null>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    if (
      typeof IntersectionObserver === 'undefined' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      el.style.opacity = '1'
      el.style.transform = 'none'
      return
    }

    register(el, delay)
    return () => unregister(el)
  }, [delay])

  return ref
}
