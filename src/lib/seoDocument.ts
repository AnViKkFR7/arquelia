export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)

export interface PageSeo {
  title: string; description: string; canonical?: string; image?: string; indexable: boolean
}

export function renderSeoDocument(template: string, meta: PageSeo, body: string) {
  const cleaned = template.replace(/<title>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*(?:name=["'](?:description|robots|twitter:[^"']+)["']|property=["']og:[^"']+["'])[^>]*>/gi, '')
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, '')
  const tags = `<title>${escapeHtml(meta.title)}</title>
    <meta name="description" content="${escapeHtml(meta.description)}">
    <meta name="robots" content="${meta.indexable ? 'index, follow' : 'noindex, follow'}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(meta.title)}">
    <meta property="og:description" content="${escapeHtml(meta.description)}">
    ${meta.canonical ? `<link rel="canonical" href="${escapeHtml(meta.canonical)}"><meta property="og:url" content="${escapeHtml(meta.canonical)}">` : ''}
    ${meta.image ? `<meta property="og:image" content="${escapeHtml(meta.image)}">` : ''}
    <meta name="twitter:card" content="${meta.image ? 'summary_large_image' : 'summary'}">
    <meta name="twitter:title" content="${escapeHtml(meta.title)}">
    <meta name="twitter:description" content="${escapeHtml(meta.description)}">
    ${meta.image ? `<meta name="twitter:image" content="${escapeHtml(meta.image)}">` : ''}`
  return cleaned.replace('</head>', () => `${tags}</head>`)
    .replace('<div id="root"></div>', () => `<div id="root"><main class="project-initial container">${body}</main></div>`)
}
