import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CTAFormProvider } from './context/CTAFormContext'
import { Layout } from './components/layout/Layout'
import { HomePage } from './pages/HomePage'
import { ServicesPage } from './pages/ServicesPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { LegalPage } from './pages/LegalPage'

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
      </CTAFormProvider>
    </BrowserRouter>
  )
}

export default App
