import type { Project } from '../src/types/project'
import { ARQUELIA_ITEM_TYPE, isProjectId, validProjectSlug } from '../src/lib/projectRepository'
import { httpsImage } from '../src/lib/blogRepository'
import { projectRedirects } from '../src/lib/projectRedirects'

export interface SeoProposal {
  id: string; company_id: string; item_type: string; slug: string
  seo_title: string; seo_description: string; seo_og_image_url: string | null
}
export interface PublicItemsExport { company_id: string; item_type: string; exported_at: string; projects: Project[] }

export function auditProjects(projects: Project[]) {
  return projects.map((project) => ({ id: project.id, title: project.title, issues: [
    !project.slug?.trim() ? 'missing_slug' : !validProjectSlug(project.slug) ? 'invalid_or_uuid_slug' : null,
    !project.seoTitle?.trim() ? 'missing_seo_title' : Array.from(project.seoTitle).length > 70 ? 'seo_title_over_70' : null,
    !project.seoDescription?.trim() ? 'missing_seo_description' : Array.from(project.seoDescription).length > 160 ? 'seo_description_over_160' : null,
    project.seoOgImageUrl && (!httpsImage(project.seoOgImageUrl) || project.seoOgImageUrl.length > 2048) ? 'invalid_og_image_url' : null,
    project.slug && projects.some((other) => other.id !== project.id && other.slug?.toLowerCase() === project.slug?.toLowerCase()) ? 'duplicate_slug_in_target_type' : null,
  ].filter((issue): issue is string => Boolean(issue)) }))
}

export function prepareSeoSql(snapshot: PublicItemsExport, proposals: SeoProposal[], expectedCompany: string) {
  if (!isProjectId(expectedCompany) || snapshot.company_id !== expectedCompany || snapshot.item_type !== ARQUELIA_ITEM_TYPE) throw new Error('Export fuera de la empresa/tipo de Arquelia')
  if (!proposals.length) throw new Error('Falta el lote SEO aprobado')
  if (!Array.isArray(snapshot.projects) || snapshot.projects.some((project) => project.companyId !== expectedCompany || project.itemType !== ARQUELIA_ITEM_TYPE || project.status !== 'published')) throw new Error('El export incluye filas fuera de alcance')
  const ids = new Set<string>()
  const slugs = new Set<string>()
  const sql = (value: string | null) => value === null ? 'NULL' : `'${value.replace(/'/g, "''")}'`
  const rows = proposals.map((proposal) => {
    const original = snapshot.projects.find((project) => project.id === proposal.id)
    if (!original || !isProjectId(proposal.id) || ids.has(proposal.id) || proposal.company_id !== expectedCompany || proposal.item_type !== ARQUELIA_ITEM_TYPE) throw new Error('ID duplicado o propuesta fuera de alcance')
    if (!validProjectSlug(proposal.slug) || slugs.has(proposal.slug)) throw new Error('Slug inválido, UUID reservado o duplicado')
    if (typeof proposal.seo_title !== 'string' || !proposal.seo_title.trim() || Array.from(proposal.seo_title).length > 70
      || typeof proposal.seo_description !== 'string' || !proposal.seo_description.trim() || Array.from(proposal.seo_description).length > 160
      || (proposal.seo_og_image_url !== null && (typeof proposal.seo_og_image_url !== 'string' || !httpsImage(proposal.seo_og_image_url) || proposal.seo_og_image_url.length > 2048))) throw new Error('Metadatos SEO inválidos')
    if (original.slug && original.slug !== proposal.slug && projectRedirects[original.slug] !== original.id) throw new Error('Un cambio de slug exige una redirección aprobada en projectRedirects.ts')
    if (!Number.isFinite(Date.parse(original.updatedAt))) throw new Error('Falta updated_at verificable en el export')
    ids.add(proposal.id); slugs.add(proposal.slug)
    return `(${[proposal.id, expectedCompany, ARQUELIA_ITEM_TYPE, proposal.slug, proposal.seo_title, proposal.seo_description, proposal.seo_og_image_url, original.slug, original.updatedAt].map(sql).join(', ')})`
  })
  return `-- Lote preparado, NO ejecutado. Revisar propuesta, export y proyecto Supabase.
-- Patrón de database/templates/ITEMS_SEO_VALUES_TEMPLATE.sql del panel.
BEGIN;
CREATE TEMPORARY TABLE seo_item_proposals (
  id uuid PRIMARY KEY, company_id uuid NOT NULL, item_type text NOT NULL,
  slug text NOT NULL, seo_title text NOT NULL, seo_description text NOT NULL,
  seo_og_image_url text, expected_slug text, expected_updated_at timestamptz NOT NULL
) ON COMMIT DROP;
INSERT INTO seo_item_proposals VALUES\n${rows.join(',\n')};
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM seo_item_proposals WHERE company_id <> ${sql(expectedCompany)}::uuid OR item_type <> ${sql(ARQUELIA_ITEM_TYPE)}) THEN
    RAISE EXCEPTION 'Lote fuera del alcance de Arquelia';
  END IF;
  IF EXISTS (SELECT 1 FROM seo_item_proposals WHERE slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR char_length(slug)>120
    OR char_length(seo_title)>70 OR char_length(seo_description)>160
    OR btrim(seo_title)='' OR btrim(seo_description)=''
    OR (seo_og_image_url IS NOT NULL AND (seo_og_image_url !~ '^https://' OR char_length(seo_og_image_url)>2048))) THEN
    RAISE EXCEPTION 'Formato SEO inválido';
  END IF;
  IF EXISTS (SELECT 1 FROM seo_item_proposals GROUP BY company_id, lower(slug) HAVING count(*)>1) THEN
    RAISE EXCEPTION 'Slugs duplicados en el lote';
  END IF;
  -- Bloqueo para que la validación y actualización utilicen el mismo estado.
  PERFORM 1 FROM public.items i JOIN seo_item_proposals p ON p.id=i.id FOR UPDATE OF i;
  IF (SELECT count(*) FROM public.items i JOIN seo_item_proposals p ON p.id=i.id
    AND i.company_id=p.company_id AND i.item_type=p.item_type AND i.status='published'
    AND i.slug IS NOT DISTINCT FROM p.expected_slug AND i.updated_at=p.expected_updated_at)
    <> (SELECT count(*) FROM seo_item_proposals) THEN
    RAISE EXCEPTION 'Item no publicado, fuera de alcance o modificado desde el export';
  END IF;
  -- Todos los tipos y estados de la MISMA empresa: el índice no se limita a item_type.
  IF EXISTS (SELECT 1 FROM seo_item_proposals p JOIN public.items other
    ON other.company_id=p.company_id AND lower(other.slug)=lower(p.slug) AND other.id<>p.id) THEN
    RAISE EXCEPTION 'Colisión de slug con otro item de la empresa';
  END IF;
END $$;
UPDATE public.items i SET slug=p.slug, seo_title=p.seo_title, seo_description=p.seo_description,
  seo_og_image_url=p.seo_og_image_url, updated_at=now()
FROM seo_item_proposals p WHERE i.id=p.id AND i.company_id=p.company_id
  AND i.item_type=p.item_type AND i.status='published';
SELECT i.id,i.company_id,i.item_type,i.status,i.slug,i.seo_title,i.seo_description,i.seo_og_image_url
FROM public.items i JOIN seo_item_proposals p ON p.id=i.id AND p.company_id=i.company_id AND p.item_type=i.item_type ORDER BY i.slug;
-- Revisar el SELECT antes de confirmar, en la misma sesión/transacción:
-- COMMIT;
-- ROLLBACK;
`
}
