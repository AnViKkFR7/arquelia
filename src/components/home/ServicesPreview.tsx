import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Reveal } from '../ui/Reveal'
import styles from './ServicesPreview.module.css'

import cocina from '../../assets/cocina_abierta.avif'
import bano from '../../assets/baño_03.avif'
import salon from '../../assets/salon_01.avif'
import pasillo from '../../assets/pasillo_02.jpg'
import aseo from '../../assets/aseo_02.jpg'
import ButtonSlider from '../ui/ButtonSlider'

const images = [salon, cocina, bano, pasillo, aseo]

interface ServiceItem {
  title: string
  note: string
}

/**
 * Listado de servicios con previsualización.
 * En desktop, la imagen sigue al puntero sobre la fila activa; en móvil
 * no se muestra (no hay hover) y las filas quedan como lista limpia.
 */
export function ServicesPreview() {
  const { t } = useTranslation()
  const items = t('home.services.items', { returnObjects: true }) as ServiceItem[]
  const [active, setActive] = useState<number | null>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })

  return (
    <section
      className={`section ${styles.section}`}
      onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
    >
      <div className={`container ${styles.head}`}>
        <Reveal variant="fade">
          <span className="eyebrow">
            <span className={styles.index}>03</span> {t('home.services.eyebrow')}
          </span>
        </Reveal>
        <Reveal variant="up" delay={60}>
          <h2 className={styles.title}>{t('home.services.title')}</h2>
        </Reveal>
      </div>

      <div className={`container ${styles.list}`} onMouseLeave={() => setActive(null)}>
        {items.map((item, i) => (
          <Reveal key={item.title} variant="up" delay={i * 60}>
            <Link
              to="/servicios"
              className={`${styles.row} ${active === i ? styles.rowActive : ''} ${
                active !== null && active !== i ? styles.rowDim : ''
              }`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
            >
              <span className={styles.rowIndex}>0{i + 1}</span>
              <span className={styles.rowTitle}>{item.title}</span>
              <span className={styles.rowNote}>{item.note}</span>
              <span className={styles.rowArrow} aria-hidden="true">
                →
              </span>
            </Link>
          </Reveal>
        ))}
      </div>

      <div className={`container ${styles.footer}`}>
        <Reveal variant="fade">
          <ButtonSlider to="/servicios" text={t('home.services.seeAll')} />
        </Reveal>
      </div>

      
    </section>
  )
}
