import type { SupabaseClient } from '@supabase/supabase-js'

export const BLOG_PAGE_SIZE = 9
export const validBlogSlug = (slug: unknown): slug is string =>
  typeof slug === 'string' && slug.length <= 120 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)

export interface BlogMedia {
  id: string
  post_id: string
  url_externa: string
  title: string | null
  alt_text: string | null
  sort_order: number
  is_cover_image: boolean
}
export interface BlogPost {
  id: string
  company_id: string
  title: string
  heading: string | null
  intro: string | null
  body: string | null
  slug: string
  seo_title: string | null
  seo_description: string | null
  seo_og_image_url: string | null
  published_at: string | null
  updated_at: string
  media: BlogMedia[]
  cover: BlogMedia | null
}
const columns = 'id,company_id,title,heading,intro,body,slug,seo_title,seo_description,seo_og_image_url,published_at,updated_at'

export function blogRepository(client: SupabaseClient, companyId: string) {
  if (!companyId) throw new Error('Falta la empresa del blog')
  const published = () => client.from('blog_posts').select(columns)
    .eq('company_id', companyId).eq('status', 'published')

  async function withMedia(rows: Omit<BlogPost, 'media' | 'cover'>[]): Promise<BlogPost[]> {
    if (!rows.length) return []
    const { data, error } = await client.from('blog_media')
      .select('id,post_id,url_externa,title,alt_text,sort_order,is_cover_image')
      .in('post_id', rows.map((post) => post.id)).eq('file_type', 'image')
      .order('sort_order', { ascending: true }).abortSignal(AbortSignal.timeout(8000))
    if (error) throw error
    return rows.map((post) => {
      const media = (data ?? []).filter((item) => item.post_id === post.id) as BlogMedia[]
      return { ...post, media, cover: media.find((item) => item.is_cover_image) ?? null }
    })
  }

  return {
    async list(page = 1) {
      const offset = (Math.max(1, page) - 1) * BLOG_PAGE_SIZE
      const { data, error } = await published().not('slug', 'is', null)
        .order('published_at', { ascending: false }).order('id', { ascending: false })
        .range(offset, offset + BLOG_PAGE_SIZE).abortSignal(AbortSignal.timeout(8000))
      if (error) throw error
      const rows = data ?? []
      if (rows.some((post) => !validBlogSlug(post.slug))) throw new Error('Blog con slugs inválidos: ejecutar preflight')
      return { posts: await withMedia(rows.slice(0, BLOG_PAGE_SIZE)), hasMore: rows.length > BLOG_PAGE_SIZE }
    },
    async get(slug: string) {
      if (!validBlogSlug(slug)) return null
      const { data, error } = await published().eq('slug', slug)
        .abortSignal(AbortSignal.timeout(8000)).maybeSingle()
      if (error) throw error
      return data ? (await withMedia([data]))[0] : null
    },
    async auditAndSitemap() {
      const posts: { slug: string; updated_at: string }[] = []
      for (let offset = 0; ; offset += 500) {
        const { data, error } = await client.from('blog_posts').select('slug,updated_at')
          .eq('company_id', companyId).eq('status', 'published').order('id')
          .range(offset, offset + 499).abortSignal(AbortSignal.timeout(8000))
        if (error) throw error
        if ((data ?? []).some((post) => !validBlogSlug(post.slug))) throw new Error('Posts publicados sin slug válido: ejecutar CONTENT_SEO_FIELDS_AUDIT.sql')
        posts.push(...(data ?? []))
        if (!data || data.length < 500) break
      }
      if (new Set(posts.map((post) => post.slug.toLowerCase())).size !== posts.length) throw new Error('Slugs duplicados en el blog')
      return posts
    },
  }
}

export function httpsImage(value: string | null | undefined): string | undefined {
  try { return value && new URL(value).protocol === 'https:' ? value : undefined } catch { return undefined }
}

export function blogMetadata(post: BlogPost | null, siteUrl: string, page = 1) {
  const path = post ? `/blog/${post.slug}` : '/blog'
  return {
    title: post?.seo_title || post?.title || 'Blog · Arquelia',
    description: post?.seo_description || post?.intro || post?.heading || 'Ideas y consejos sobre reformas, construcción e interiorismo de Arquelia.',
    url: `${siteUrl.replace(/\/$/, '')}${path}${!post && page > 1 ? `?page=${page}` : ''}`,
    image: httpsImage(post?.seo_og_image_url) || httpsImage(post?.cover?.url_externa),
  }
}
