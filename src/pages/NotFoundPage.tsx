import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { trackNotFound } from '../lib/analytics'
import { Button } from '../components/ui/Button'
import styles from './NotFoundPage.module.css'

/**
 * Sin esto, cualquier URL rota o mal escrita renderizaba una página en
 * blanco con un 200 real (el rewrite de SPA en `vercel.json` sirve
 * `index.html` para cualquier ruta) — un "soft 404" que Google desaconseja
 * explícitamente: parece una página real y vacía, no un enlace roto.
 * `DocumentMeta` marca esta ruta como `noindex` (no hay forma de devolver
 * un código 404 de verdad sin servidor propio) para que al menos no se
 * indexe como contenido real.
 */
export function NotFoundPage() {
  const { t } = useTranslation()
  const tracked = useRef(false)

  // Guarda qué URL falló y desde dónde llegó: es el dato que permite pedir
  // que corrijan un enlace roto en otra web.
  useEffect(() => {
    if (tracked.current) return
    tracked.current = true
    trackNotFound()
  }, [])

  return (
    <div className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <span className={styles.code}>404</span>
        <h1 className={styles.title}>{t('notFound.title')}</h1>
        <p className={styles.text}>{t('notFound.text')}</p>
        <div className={styles.action}>
          <Button to="/" variant="solid" arrow>
            {t('notFound.cta')}
          </Button>
        </div>
      </div>
    </div>
  )
}
