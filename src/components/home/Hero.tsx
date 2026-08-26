import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { HeroCanvas } from './HeroCanvas'
import { usePinProgress } from '../../hooks/usePinProgress'
import styles from './Hero.module.css'

/**
 * Alto del recorrido en múltiplos de pantalla mientras el hero está anclado.
 * En móvil se acorta un poco respecto al de escritorio: el gesto de scroll
 * con el dedo avanza distinto que la rueda del ratón. Subido de 3.5/3 a
 * 6/5.25 (~×1,75): el cliente lo comparó con modusprojects.nl, que necesita
 * 6-8 gestos de scroll para completar la animación, frente a los ~4 que
 * hacían falta aquí — la sensación de "carrete largo" es a propósito en la
 * referencia, no un efecto de una conexión más lenta.
 */
const SPAN_DESKTOP = 6
const SPAN_MOBILE = 5.25

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
    <section ref={wrapRef} className={styles.wrap} style={{ height: `${span * 100}dvh` }}>
      <div className={styles.sticky}>
        <div className={styles.stage}>
          <HeroCanvas progress={progress} className={styles.canvas} />
          <div className={styles.scrim} />

          <div
            className={styles.inner}
            style={{
              opacity: 1 - titleOut,
              transform: `translateY(${titleOut * -24}px)`,
              pointerEvents: titleOut > 0.8 ? 'none' : undefined,
            }}
          >
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

          <span className={styles.cue} style={{ opacity: 1 - titleOut }} aria-hidden="true">
            <span className={styles.cueLine} />
          </span>
        </div>
      </div>
    </section>
  )
}
