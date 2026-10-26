import * as React from 'react'
import Markdown from 'react-markdown'
import type { BlogPost } from '../../lib/blogRepository'
import { httpsImage } from '../../lib/blogRepository'

import { blogCopy } from '../../lib/blogCopy'


export function BlogContent({ posts, post, page, hasMore, language = 'es' }: {
  posts: BlogPost[]; post?: BlogPost; page: number; hasMore: boolean; language?: string
}) {
  const lang = language.startsWith('ca') ? 'ca' : language.startsWith('en') ? 'en' : 'es'
  const copy = blogCopy[lang]
  const date = (value: string | null) => value && Number.isFinite(Date.parse(value))
    ? React.createElement('time', { dateTime: value }, new Date(value).toLocaleDateString(lang, { dateStyle: 'long', timeZone: 'Europe/Madrid' })) : null
  if (post) return <article className="blog-article" data-lead-item={`${post.title} · ${post.slug}`}>
    <a href="/blog">← {copy.back}</a>
    <header><span className="eyebrow">Blog · Arquelia</span><h1>{post.title}</h1>{date(post.published_at)}
      {post.heading && <h2>{post.heading}</h2>}{post.intro && <p className="blog-intro">{post.intro}</p>}</header>
    {post.cover && httpsImage(post.cover.url_externa) && <img className="blog-cover" src={post.cover.url_externa} alt={post.cover.alt_text ?? post.cover.title ?? ''} />}
    <div className="blog-body"><Markdown skipHtml>{post.body ?? ''}</Markdown></div>
    <div className="blog-gallery">{post.media.filter((item) => item.id !== post.cover?.id && httpsImage(item.url_externa)).map((item) =>
      <figure key={item.id}><img src={item.url_externa} alt={item.alt_text ?? item.title ?? ''} loading="lazy" />{item.title && <figcaption>{item.title}</figcaption>}</figure>)}</div>
  </article>
  return <section className="blog-list">
    <header><span className="eyebrow">Blog · Arquelia</span><h1>{copy.title}</h1><p className="blog-intro">{copy.intro}</p></header>
    {!posts.length && <p>{copy.empty}</p>}
    <div className="blog-grid">{posts.map((item) => <article key={item.id}>
      <a href={`/blog/${item.slug}`}>
        {item.cover && httpsImage(item.cover.url_externa) && <img src={item.cover.url_externa} alt={item.cover.alt_text ?? item.cover.title ?? ''} loading="lazy" />}
        {date(item.published_at)}<h2>{item.title}</h2><p>{item.intro || item.heading}</p><span>{copy.read} →</span>
      </a></article>)}</div>
    {(page > 1 || hasMore) && <nav className="blog-pagination" aria-label="Blog">
      {page > 1 && <a href={page === 2 ? '/blog' : `/blog?page=${page - 1}`}>← {copy.previous}</a>}
      <span>{page}</span>{hasMore && <a href={`/blog?page=${page + 1}`}>{copy.next} →</a>}
    </nav>}
  </section>
}
