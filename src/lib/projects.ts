import { supabase, ARQUELIA_COMPANY_ID, ARQUELIA_ITEM_TYPE } from './supabase'
import type { Project, ProjectMedia } from '../types/project'

type AttributeRow = {
  value_text: string | null
  value_number: number | null
  value_text_array: string[] | null
  attribute_definitions: { key: string } | null
}

type ItemRow = {
  id: string
  title: string
  summary: string | null
  status: string
  attribute_values: AttributeRow[]
  item_media: {
    id: string
    url_externa: string
    title: string | null
    alt_text: string | null
    is_cover: boolean
    sort_order: number
  }[]
}

function mapItemToProject(item: ItemRow): Project {
  const attrs: Record<string, string | number | string[] | null> = {}
  for (const av of item.attribute_values) {
    const key = av.attribute_definitions?.key
    if (!key) continue
    attrs[key] = av.value_text_array ?? av.value_number ?? av.value_text
  }

  const media: ProjectMedia[] = (item.item_media ?? [])
    .map((m) => ({
      id: m.id,
      url: m.url_externa,
      title: m.title,
      altText: m.alt_text,
      isCover: m.is_cover,
      sortOrder: m.sort_order,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const cover = media.find((m) => m.isCover) ?? media[0] ?? null

  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    status: item.status,
    description: (attrs.description as string) ?? null,
    whatWasDone: (attrs.what_was_done as string[]) ?? [],
    ubicacion: (attrs.ubicacion as string) ?? null,
    categoria: (attrs.categoria as string) ?? null,
    superficieM2: (attrs.superficie_m2 as number) ?? null,
    media,
    coverUrl: cover?.url ?? null,
  }
}

export async function getPublishedProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('items')
    .select(
      `
      id, title, summary, status,
      attribute_values ( value_text, value_number, value_text_array, attribute_definitions ( key ) ),
      item_media ( id, url_externa, title, alt_text, is_cover, sort_order )
    `
    )
    .eq('company_id', ARQUELIA_COMPANY_ID)
    .eq('item_type', ARQUELIA_ITEM_TYPE)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data as unknown as ItemRow[]).map(mapItemToProject)
}

export async function getProjectById(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('items')
    .select(
      `
      id, title, summary, status,
      attribute_values ( value_text, value_number, value_text_array, attribute_definitions ( key ) ),
      item_media ( id, url_externa, title, alt_text, is_cover, sort_order )
    `
    )
    .eq('id', id)
    .eq('company_id', ARQUELIA_COMPANY_ID)
    .eq('status', 'published')
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return mapItemToProject(data as unknown as ItemRow)
}
