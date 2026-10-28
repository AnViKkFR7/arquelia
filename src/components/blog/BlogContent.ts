import { createElement as h } from 'react'
import Markdown from 'react-markdown'
import type { BlogMedia, BlogPost } from '../../lib/blogRepository.js'
import { httpsImage } from '../../lib/blogRepository.js'

import { blogCopy } from '../../lib/blogCopy.js'
export function BlogContent({ posts, post, page, hasMore, language = 'es' }: {
  posts: BlogPost[]; post?: BlogPost; page: number; hasMore: boolean; language?: string
}) {
  const lang = language.startsWith('ca') ? 'ca' : language.startsWith('en') ? 'en' : 'es'
  const copy = blogCopy[lang]
  const date = (value: string | null) => value && Number.isFinite(Date.parse(value))
    ? h('time', { dateTime: value }, new Date(value).toLocaleDateString(lang, { dateStyle: 'long', timeZone: 'Europe/Madrid' })) : null
  const image = (media: BlogMedia | null, className?: string, lazy = true) => media && httpsImage(media.url_externa)
    ? h('img', { className, src: media.url_externa, alt: media.alt_text ?? media.title ?? '', loading: lazy ? 'lazy' : undefined }) : null
  if (post) return h('article', { className: 'blog-article', 'data-lead-item': `${post.title} · ${post.slug}` },
    h('a', { href: '/blog' }, `← ${copy.back}`),
    h('header', null, h('span', { className: 'eyebrow' }, 'Blog · Arquelia'), h('h1', null, post.title), date(post.published_at),
      post.heading && h('h2', null, post.heading), post.intro && h('p', { className: 'blog-intro' }, post.intro)),
    image(post.cover, 'blog-cover', false),
    h('div', { className: 'blog-body' }, h(Markdown, { skipHtml: true }, post.body ?? '')),
    h('div', { className: 'blog-gallery' }, post.media.filter((item) => item.id !== post.cover?.id && httpsImage(item.url_externa)).map((item) =>
      h('figure', { key: item.id }, image(item), item.title && h('figcaption', null, item.title)))),
  )
  return h('section', { className: 'blog-list' },
    h('header', null, h('span', { className: 'eyebrow' }, 'Blog · Arquelia'), h('h1', null, copy.title), h('p', { className: 'blog-intro' }, copy.intro)),
    !posts.length && h('p', null, copy.empty),
    h('div', { className: 'blog-grid' }, posts.map((item) => h('article', { key: item.id },
      h('a', { href: `/blog/${item.slug}` }, image(item.cover), date(item.published_at), h('h2', null, item.title),
        h('p', null, item.intro || item.heading), h('span', null, `${copy.read} →`))))),
    (page > 1 || hasMore) && h('nav', { className: 'blog-pagination', 'aria-label': 'Blog' },
      page > 1 && h('a', { href: page === 2 ? '/blog' : `/blog?page=${page - 1}` }, `← ${copy.previous}`),
      h('span', null, page), hasMore && h('a', { href: `/blog?page=${page + 1}` }, `${copy.next} →`),
    ),
  )
}
