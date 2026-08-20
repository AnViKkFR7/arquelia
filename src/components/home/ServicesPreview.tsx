import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Reveal } from '../ui/Reveal'
import { Button } from '../ui/Button'
import styles from './ServicesPreview.module.css'

import cocina from '../../assets/cocina_abierta.avif'
import bano from '../../assets/baño_03.avif'
import salon from '../../assets/salon_01.avif'
import pasillo from '../../assets/pasillo_02.jpg'
import aseo from '../../assets/aseo_02.jpg'
import ButtonSlider from '../ui/ButtonSlider'

const items = [
  { title: 'Reformas integrales', note: 'De la estructura al último acabado', image: salon },
  { title: 'Cocinas', note: 'Diseño, mobiliario y encimeras a medida', image: cocina },
  { title: 'Baños', note: 'Materiales nobles y grifería de diseño', image: bano },
  { title: 'Interiorismo', note: 'Proyecto completo, llave en mano', image: pasillo },
  { title: 'Rehabilitación', note: 'Recuperar sin perder el carácter', image: aseo },
]

/**
 * Listado de servicios con previsualización.
 * En desktop, la imagen sigue al puntero sobre la fila activa; en móvil
 * no se muestra (no hay hover) y las filas quedan como lista limpia.
 */
export function ServicesPreview() {
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
            <span className={styles.index}>03</span> Servicios
          </span>
        </Reveal>
        <Reveal variant="up" delay={60}>
          <h2 className={styles.title}>Lo que hacemos</h2>
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
          <ButtonSlider to='/servicios' text="Todos los servicios" />
        </Reveal>
      </div>

      {/* Previsualización flotante */}
      <div
        className={`${styles.preview} ${active !== null ? styles.previewOn : ''}`}
        style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
        aria-hidden="true"
      >
        {items.map((item, i) => (
          <span
            key={item.title}
            className={`${styles.previewImg} ${active === i ? styles.previewImgOn : ''}`}
            style={{ backgroundImage: `url(${item.image})` }}
          />
        ))}
      </div>
    </section>
  )
}
