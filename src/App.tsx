import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CTAFormProvider } from './context/CTAFormContext'
import { Layout } from './components/layout/Layout'
import { CookieConsent } from './components/layout/CookieConsent'
import { HomePage } from './pages/HomePage'
import { ServicesPage } from './pages/ServicesPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { LegalPage } from './pages/LegalPage'
// `/next` es el punto de entrada específico de Next.js: internamente
// importa de `next/navigation`, un paquete que no existe aquí (este
// proyecto es un SPA con Vite, no Next.js) — por eso el build fallaba con
// "Missing export" al intentar resolverlo. `/react` es el genérico para
// cualquier app de React que no sea Next. Mismo criterio para Speed Insights.
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'


function App() {
  return (
    <BrowserRouter>
      <CTAFormProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="servicios" element={<ServicesPage />} />
            <Route path="proyectos" element={<ProjectsPage />} />
            <Route path="proyectos/:id" element={<ProjectDetailPage />} />
            <Route path="sobre-nosotros" element={<AboutPage />} />
            <Route path="contacto" element={<ContactPage />} />
            <Route path="aviso-legal" element={<LegalPage slug="notice" />} />
            <Route path="cookies" element={<LegalPage slug="cookies" />} />
            <Route path="privacidad" element={<LegalPage slug="privacy" />} />
          </Route>
        </Routes>
        <Analytics />
        <SpeedInsights />
        <CookieConsent />
      </CTAFormProvider>
    </BrowserRouter>

  )
}

export default App
