import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { Reveal } from '../ui/Reveal'
import type { ProjectMedia } from '../../types/project'
import styles from './ProjectGallery.module.css'

/**
 * El `title` de cada media lo rellena el CMS y muy a menudo es el nombre del
 * archivo subido ("Blog1-imagen1_894df…webp"), que no sirve como pie de foto.
 */
const looksLikeFilename = (s: string) => /\.(webp|jpe?g|png|avif|gif)$/i.test(s.trim())

/** Devuelve el texto sólo si es utilizable; si no, el de reserva. */
const usable = (value: string | null, fallback: string) =>
  value && value.trim() && !looksLikeFilename(value) ? value : fallback

interface ProjectGalleryProps {
  media: ProjectMedia[]
  /** Título del proyecto, para los textos alternativos y de accesibilidad. */
  title: string
}

/**
 * Mosaico de imágenes del proyecto con visor ampliable.
 * El visor se recorre con las flechas del teclado y se cierra con Escape.
 */
export function ProjectGallery({ media, title }: ProjectGalleryProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState<number | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)

  const close = useCallback(() => setOpen(null), [])
  const step = useCallback(
    (delta: number) =>
      setOpen((i) => (i === null ? null : (i + delta + media.length) % media.length)),
    [media.length]
  )

  useEffect(() => {
    if (open === null) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') step(1)
      else if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)

    // El scroll se bloquea en <html>, no en <body>: `overflow-x: hidden` vive
    // en <html>, así que es <html> quien scrollea. Bloquear <body> no haría nada.
    const root = document.documentElement
    const prev = root.style.overflow
    root.style.overflow = 'hidden'
    closeRef.current?.focus()

    return () => {
      window.removeEventListener('keydown', onKey)
      root.style.overflow = prev
    }
  }, [open, close, step])

  if (media.length === 0) return null

  const current = open === null ? null : media[open]

  return (
    <>
      <div className={`container ${styles.grid}`}>
        {media.map((m, i) => (
          <Reveal
            key={m.id}
            variant="up"
            delay={i * 15}
            className={`${styles.cell} ${i % 5 === 0 ? styles.cellWide : ''}`}
          >
            <button
              type="button"
              className={styles.shot}
              onClick={() => setOpen(i)}
              aria-label={t('projectDetail.gallery.openAria', { n: i + 1, total: media.length })}
            >
              <img src={m.url} alt={usable(m.altText, title)} loading="lazy" />
              <span className={styles.plus} aria-hidden="true">
                <span className={styles.plusBar} />
                <span className={`${styles.plusBar} ${styles.plusBarV}`} />
              </span>
            </button>
          </Reveal>
        ))}
      </div>

      {/* Va por portal a <body> a propósito. Dentro del árbol normal el visor
          cuelga de <main>, que lleva la animación de entrada de página: su
          `transform` convierte el `position: fixed` en relativo a <main> (el
          visor pasaba a medir toda la página y la imagen quedaba centrada
          fuera de pantalla) y crea un contexto de apilamiento que encerraba
          el z-index por debajo del header. */}
      {current &&
        createPortal(
          <div
            className={styles.lightbox}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={close}
          >
            <button
              ref={closeRef}
              type="button"
              className={styles.close}
              onClick={close}
              aria-label={t('projectDetail.gallery.close')}
            >
              <span className={styles.closeBar} />
              <span className={`${styles.closeBar} ${styles.closeBarAlt}`} />
            </button>

            {media.length > 1 && (
              <button
                type="button"
                className={`${styles.nav} ${styles.navPrev}`}
                onClick={(e) => {
                  e.stopPropagation()
                  step(-1)
                }}
                aria-label={t('projectDetail.gallery.prev')}
              >
                <span className={styles.arrow} aria-hidden="true" />
              </button>
            )}

            {/* Frena la propagación: pulsar la propia imagen no debe cerrar. */}
            <figure className={styles.stage} onClick={(e) => e.stopPropagation()}>
              <img src={current.url} alt={usable(current.altText, title)} />
              <figcaption className={styles.caption}>
                <span>{usable(current.title, title)}</span>
                <span className={styles.counter}>
                  {String((open ?? 0) + 1).padStart(2, '0')} /{' '}
                  {String(media.length).padStart(2, '0')}
                </span>
              </figcaption>
            </figure>

            {media.length > 1 && (
              <button
                type="button"
                className={`${styles.nav} ${styles.navNext}`}
                onClick={(e) => {
                  e.stopPropagation()
                  step(1)
                }}
                aria-label={t('projectDetail.gallery.next')}
              >
                <span className={styles.arrow} aria-hidden="true" />
              </button>
            )}
          </div>,
          document.body
        )}
    </>
  )
}
