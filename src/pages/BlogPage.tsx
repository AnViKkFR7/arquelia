import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase, ARQUELIA_COMPANY_ID } from '../lib/supabase'
import { blogMetadata, blogRepository, type BlogPost } from '../lib/blogRepository'
import { BlogContent } from '../components/blog/BlogContent'
import { blogCopy } from '../lib/blogCopy'
import { NotFoundPage } from './NotFoundPage'
import './BlogPage.css'

export function BlogPage() {
  const { slug } = useParams()
  const [params] = useSearchParams()
  const page = Math.max(1, Math.min(10000, Number(params.get('page')) || 1)) | 0
  const { i18n } = useTranslation()
  const copy = blogCopy[i18n.language.startsWith('ca') ? 'ca' : i18n.language.startsWith('en') ? 'en' : 'es']
  const [retry, setRetry] = useState(0)
  const requestKey = `${slug ?? ''}:${page}:${retry}`
  const [loaded, setLoaded] = useState<{ key: string; error?: boolean; data?: { posts: BlogPost[]; post?: BlogPost; hasMore: boolean; missing?: boolean } }>()
  const state = loaded?.key === requestKey ? loaded.data : undefined
  const error = loaded?.key === requestKey && loaded.error
  useEffect(() => {
    let active = true
    const repository = blogRepository(supabase, ARQUELIA_COMPANY_ID)
    const request = slug ? repository.get(slug).then((post) => ({ posts: [], post: post ?? undefined, hasMore: false, missing: !post })) : repository.list(page)
    request.then((data) => { if (active) setLoaded({ key: requestKey, data }) }).catch(() => { if (active) setLoaded({ key: requestKey, error: true }) })
    return () => { active = false }
  }, [slug, page, requestKey])

  useEffect(() => {
    const meta = blogMetadata(state?.post ?? null, import.meta.env.VITE_SITE_URL || 'https://arquelia.es', page)
    document.title = state?.missing ? '404 · Arquelia' : meta.title
    const update = (selector: string, attr: string, value?: string) => {
      const node = document.head.querySelector(selector)
      if (value) node?.setAttribute(attr, value)
      else node?.removeAttribute(attr)
    }
    update('meta[name="description"]', 'content', meta.description)
    update('meta[name="robots"]', 'content', state?.missing || error || !state ? 'noindex, follow' : 'index, follow')
    update('meta[property="og:title"]', 'content', meta.title)
    update('meta[property="og:type"]', 'content', state?.post ? 'article' : 'website')
    update('meta[property="og:description"]', 'content', meta.description)
    update('meta[property="og:image"]', 'content', meta.image)
    update('meta[property="og:url"]', 'content', meta.url)
    update('link[rel="canonical"]', 'href', meta.url)
  }, [state, error, page])

  if (state?.missing) return <NotFoundPage />
  return <div className="blog-page container">
    {error ? <div role="alert"><p>{copy.error}</p><button onClick={() => setRetry((value) => value + 1)}>{copy.retry}</button></div>
      : !state ? <p role="status">{copy.loading}</p>
      : <BlogContent {...state} page={page} language={i18n.language} />}
  </div>
}
