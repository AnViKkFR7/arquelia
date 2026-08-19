import { useEffect, useState } from 'react'
import { getPublishedProjects } from '../lib/projects'
import { Hero } from '../components/home/Hero'
import { IntroSection } from '../components/home/IntroSection'
import { MosaicGallery } from '../components/home/MosaicGallery'
import { ServicesPreview } from '../components/home/ServicesPreview'
import { CtaBand } from '../components/home/CtaBand'
import { FeaturedProjectsShowcase } from '../components/projects/FeaturedProjectsShowcase'
import type { Project } from '../types/project'

export function HomePage() {
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    getPublishedProjects()
      .then((data) => setProjects(data.slice(0, 6)))
      .catch((err) => console.error('Error loading projects', err))
  }, [])

  return (
    <>
      <Hero />
      <IntroSection />
      <MosaicGallery projects={projects} />
      <FeaturedProjectsShowcase projects={projects.slice(0, 3)} />
      <ServicesPreview />
      <CtaBand />
    </>
  )
}
