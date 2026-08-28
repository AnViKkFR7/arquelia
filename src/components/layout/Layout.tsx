import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { DocumentMeta } from './DocumentMeta'
import { usePageviewTracking } from '../../hooks/usePageviewTracking'
import styles from './Layout.module.css'

export function Layout() {
  const { pathname } = useLocation()
  usePageviewTracking()

  // Cada ruta arranca arriba, sin animar el salto.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  return (
    <>
      <DocumentMeta />
      <Header />
      {/* key fuerza el remontaje → transición de entrada en cada ruta */}
      <main key={pathname} className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
