import { Hero } from '../components/home/Hero'
import { IntroSection } from '../components/home/IntroSection'
import { ServicesGrid } from '../components/home/ServicesGrid'
import { ProjectsShowcase } from '../components/home/ProjectsShowcase'
import { FinalCta } from '../components/home/FinalCta'

export function HomePage() {
  return (
    <>
      <Hero />
      <IntroSection />
      <ServicesGrid />
      <ProjectsShowcase />
      <FinalCta />
    </>
  )
}
