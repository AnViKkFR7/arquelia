import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Marquee } from '../ui/Marquee'
import { HeroCanvas } from './HeroCanvas'
import { usePinProgress } from '../../hooks/usePinProgress'
import styles from './Hero.module.css'

/**
 * Alto del recorrido en múltiplos de pantalla mientras el hero está anclado.
 * En móvil se acorta: el gesto de scroll con el dedo avanza mucho menos que
 * la rueda del ratón, y 3 pantallas se hacen eternas.
 */
const SPAN_DESKTOP = 3
const SPAN_MOBILE = 2.2

export function Hero() {
  const { t } = useTranslation()
  const [span, setSpan] = useState(SPAN_DESKTOP)
  // `span` cambia el alto del bloque anclado: hay que recalcular el progreso.
  const { ref: wrapRef, progress } = usePinProgress<HTMLElement>([span])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const apply = () => setSpan(mq.matches ? SPAN_DESKTOP : SPAN_MOBILE)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  // El titular se retira durante el primer tramo del recorrido.
  const titleOut = Math.min(progress / 0.32, 1)

  return (
    <section ref={wrapRef} className={styles.wrap} style={{ height: `${span * 100}svh` }}>
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
          <span className={`eyebrow ${styles.eyebrow}`}>{t('home.heroBrand')}</span>

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
          <Marquee small text={t('home.heroStrip')} separator="◆" speed={70} />
        </div>

        <span className={styles.cue} style={{ opacity: 1 - titleOut }} aria-hidden="true">
          <span className={styles.cueLine} />
        </span>
      </div>
    </section>
  )
}
