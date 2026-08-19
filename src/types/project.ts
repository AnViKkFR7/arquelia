export interface ProjectMedia {
  id: string
  url: string
  title: string | null
  altText: string | null
  isCover: boolean
  sortOrder: number
}

export interface Project {
  id: string
  title: string
  summary: string | null
  status: string
  description: string | null
  whatWasDone: string[]
  ubicacion: string | null
  categoria: string | null
  superficieM2: number | null
  media: ProjectMedia[]
  coverUrl: string | null
}
