import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import styles from './Layout.module.css'

export function Layout() {
  const { pathname } = useLocation()

  // Cada ruta arranca arriba, sin animar el salto.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])

  return (
    <>
      <Header />
      {/* key fuerza el remontaje → transición de entrada en cada ruta */}
      <main key={pathname} className={styles.main}>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
