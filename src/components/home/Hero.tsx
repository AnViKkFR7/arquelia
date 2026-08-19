import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Marquee } from '../ui/Marquee'
import { HeroCanvas } from './HeroCanvas'
import styles from './Hero.module.css'

/** Alto del recorrido, en múltiplos de pantalla, durante el que se ancla el hero. */
const SCROLL_SPAN = 3

export function Hero() {
  const { t } = useTranslation()
  const wrapRef = useRef<HTMLElement | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    let frame = 0
    const update = () => {
      frame = 0
      const rect = el.getBoundingClientRect()
      // Recorrido útil: desde que el bloque toca arriba hasta que termina.
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
  }, [])

  // El titular se retira durante el primer tramo del recorrido.
  const titleOut = Math.min(progress / 0.32, 1)

  return (
    <section ref={wrapRef} className={styles.wrap} style={{ height: `${SCROLL_SPAN * 100}svh` }}>
      <div className={styles.sticky}>
        <HeroCanvas progress={progress} className={styles.canvas} />
        <div className={styles.scrim} />

        <div
          className={`container ${styles.inner}`}
          style={{
            opacity: 1 - titleOut,
            transform: `translateY(${titleOut * -24}px)`,
            pointerEvents: titleOut > 0.8 ? 'none' : undefined,
          }}
        >
          <span className={`eyebrow ${styles.eyebrow}`}>P &amp; B Cornellà Construcciones</span>

          {/* Título accesible completo; la versión animada por palabras se
              oculta a la API de accesibilidad para no leer fragmentos sueltos. */}
          <h1 className={styles.title}>
            <span className="visually-hidden">{t('home.heroTitle')}</span>
            <span aria-hidden="true">
              {t('home.heroTitle')
                .split(' ')
                .map((word, i) => (
                  <span key={`${word}-${i}`} className={styles.word}>
                    <span style={{ animationDelay: `${140 + i * 90}ms` }}>{word}</span>
                  </span>
                ))}
            </span>
          </h1>

          <p className={styles.subtitle}>{t('home.heroSubtitle')}</p>
        </div>

        <div className={styles.strip} style={{ opacity: 1 - titleOut * 0.85 }}>
          <Marquee
            small
            text="Reformas integrales · Cocinas · Baños · Interiorismo · Rehabilitación"
            separator="◆"
            speed={70}
          />
        </div>

        <span className={styles.cue} style={{ opacity: 1 - titleOut }} aria-hidden="true">
          <span className={styles.cueLine} />
        </span>
      </div>
    </section>
  )
}
