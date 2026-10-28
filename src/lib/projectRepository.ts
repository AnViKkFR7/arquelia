import type { SupabaseClient } from '@supabase/supabase-js'
import type { Project, ProjectMedia } from '../types/project'
import { httpsImage } from './blogRepository'
import { projectRedirects } from './projectRedirects'

export const ARQUELIA_ITEM_TYPE = 'construcciones-arquelia'
export const PROJECT_PAGE_SIZE = 9
export const isProjectId = (value: string) => /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value)
export const validProjectSlug = (value: unknown): value is string => typeof value === 'string'
  && value.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && !isProjectId(value)
export const projectPath = (project: Pick<Project, 'id' | 'slug'>) => `/proyectos/${validProjectSlug(project.slug) ? project.slug : project.id}`

export interface ProjectItemRow {
  id: string; company_id: string; item_type: string; title: string; summary: string | null; status: string
  slug: string | null; seo_title: string | null; seo_description: string | null; seo_og_image_url: string | null; updated_at: string
  attribute_values: { value_text: string | null; value_number: number | null; value_text_array: string[] | null; attribute_definitions: { key: string } | null }[]
}
const columns = `id,company_id,item_type,title,summary,status,slug,seo_title,seo_description,seo_og_image_url,updated_at,
  attribute_values(value_text,value_number,value_text_array,attribute_definitions(key))`

export function projectRepository(client: SupabaseClient, companyId: string) {
  if (!isProjectId(companyId)) throw new Error('Falta un company_id válido para Arquelia')
  const scoped = (selection = columns) => client.from('items').select(selection)
    .eq('company_id', companyId).eq('item_type', ARQUELIA_ITEM_TYPE).eq('status', 'published')
  async function mapRows(rows: ProjectItemRow[]): Promise<Project[]> {
    if (!rows.length) return []
    const { data, error } = await client.from('item_media')
      .select('id,item_id,url_externa,title,alt_text,is_cover,sort_order')
      .in('item_id', rows.map((item) => item.id)).eq('file_type', 'image')
      .order('sort_order', { ascending: true }).abortSignal(AbortSignal.timeout(8000))
    if (error) throw error
    return rows.map((item) => {
      const attrs: Record<string, string | number | string[] | null> = {}
      for (const value of item.attribute_values ?? []) {
        if (value.attribute_definitions) attrs[value.attribute_definitions.key] = value.value_text_array ?? value.value_number ?? value.value_text
      }
      const media: ProjectMedia[] = (data ?? []).filter((image) => image.item_id === item.id && httpsImage(image.url_externa))
        .map((image) => ({ id: image.id, url: image.url_externa, title: image.title, altText: image.alt_text, isCover: image.is_cover, sortOrder: image.sort_order }))
      const cover = media.find((image) => image.isCover) ?? media[0]
      return {
        id: item.id, companyId: item.company_id, itemType: item.item_type, title: item.title, summary: item.summary, status: item.status,
        slug: item.slug, seoTitle: item.seo_title, seoDescription: item.seo_description, seoOgImageUrl: item.seo_og_image_url, updatedAt: item.updated_at,
        description: typeof attrs.description === 'string' ? attrs.description : null,
        whatWasDone: Array.isArray(attrs.what_was_done) ? attrs.what_was_done.filter((value): value is string => typeof value === 'string') : [],
        ubicacion: typeof attrs.ubicacion === 'string' ? attrs.ubicacion : null,
        categoria: typeof attrs.categoria === 'string' ? attrs.categoria : null,
        superficieM2: typeof attrs.superficie_m2 === 'number' ? attrs.superficie_m2 : null,
        media, coverUrl: cover?.url ?? null,
      }
    })
  }
  return {
    async list(page = 1) {
      const from = (Math.max(1, Math.floor(page)) - 1) * PROJECT_PAGE_SIZE
      const { data, error } = await scoped().order('created_at', { ascending: false }).order('id', { ascending: false })
        .range(from, from + PROJECT_PAGE_SIZE).abortSignal(AbortSignal.timeout(8000))
      if (error) throw error
      return { projects: await mapRows((data ?? []).slice(0, PROJECT_PAGE_SIZE) as unknown as ProjectItemRow[]), hasMore: (data?.length ?? 0) > PROJECT_PAGE_SIZE }
    },
    async get(key: string) {
      if (!isProjectId(key) && !validProjectSlug(key)) return null
      const { data, error } = await scoped().eq(isProjectId(key) ? 'id' : 'slug', key)
        .abortSignal(AbortSignal.timeout(8000)).maybeSingle()
      if (error) throw error
      if (data) return (await mapRows([data as unknown as ProjectItemRow]))[0]
      const previousId = projectRedirects[key]
      if (!previousId || !isProjectId(previousId)) return null
      const previous = await scoped().eq('id', previousId).abortSignal(AbortSignal.timeout(8000)).maybeSingle()
      if (previous.error) throw previous.error
      return previous.data ? (await mapRows([previous.data as unknown as ProjectItemRow]))[0] : null
    },
    async sitemap() {
      const result: { id: string; slug: string; updatedAt: string }[] = []
      for (let from = 0; ; from += 500) {
        const { data, error } = await scoped('id,slug,updated_at').order('id').range(from, from + 499).abortSignal(AbortSignal.timeout(8000))
        if (error) throw error
        for (const item of (data ?? []) as unknown as { id: string; slug: string | null; updated_at: string }[]) {
          if (validProjectSlug(item.slug)) result.push({ id: item.id, slug: item.slug, updatedAt: item.updated_at })
        }
        if (!data || data.length < 500) break
      }
      if (new Set(result.map((item) => item.slug)).size !== result.length) throw new Error('Slugs duplicados en los proyectos publicados')
      return result
    },
  }
}

export function projectMetadata(project: Project, siteUrl: string) {
  const site = new URL(siteUrl)
  if (site.protocol !== 'https:' || site.pathname !== '/' || site.search || site.hash || site.username || site.password) throw new Error('VITE_SITE_URL debe ser un origen HTTPS')
  return {
    title: project.seoTitle || project.title,
    description: project.seoDescription || project.summary || '',
    url: `${site.origin}${projectPath(project)}`,
    image: httpsImage(project.seoOgImageUrl) || httpsImage(project.coverUrl),
    indexable: validProjectSlug(project.slug),
  }
}
