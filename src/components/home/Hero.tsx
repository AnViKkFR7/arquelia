import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Marquee } from '../ui/Marquee'
import heroImage from '../../assets/livingroom_kitchen.webp'
import styles from './Hero.module.css'

/**
 * Hero de la landing.
 *
 * PROVISIONAL: hoy pinta una imagen fija con un zoom lento ligado al scroll.
 * Cuando llegue la secuencia de 80–90 frames WebP del diseñador, se sustituye
 * el <div className={styles.media}> por un <canvas> que dibuje el frame
 * correspondiente al progreso de scroll (misma técnica que modusprojects.nl).
 * El resto del layout —titular, franja inferior, indicador— no cambia.
 */
export function Hero() {
  const { t } = useTranslation()
  const [scrolled, setScrolled] = useState(0)

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        setScrolled(Math.min(window.scrollY / window.innerHeight, 1))
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <section className={styles.hero}>
      <div
        className={styles.media}
        style={{
          backgroundImage: `url(${heroImage})`,
          transform: `scale(${1 + scrolled * 0.12})`,
        }}
      />
      <div className={styles.scrim} />

      <div className={`container ${styles.inner}`}>
        <span className={`eyebrow ${styles.eyebrow}`}>P &amp; B Cornellà Construcciones</span>

        {/* El título accesible va en un único nodo; la versión animada por
            palabras se oculta a la API de accesibilidad para no leer fragmentos
            sueltos ni perder los espacios entre palabras. */}
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

      <div className={styles.strip}>
        <Marquee
          small
          text="Reformas integrales · Cocinas · Baños · Interiorismo · Rehabilitación"
          separator="◆"
          speed={70}
        />
      </div>

      <span className={styles.cue} aria-hidden="true">
        <span className={styles.cueLine} />
      </span>
    </section>
  )
}
