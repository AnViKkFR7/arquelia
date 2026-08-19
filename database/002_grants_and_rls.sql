-- =====================================================================
-- ARQUELIA — Permisos de lectura pública para el rol 'anon'
-- =====================================================================
-- Causa del error "Could not find the table 'public.items' in the
-- schema cache": las tablas de DB_SCHEMA.sql se crearon con SQL puro,
-- sin GRANT explícito al rol 'anon' (el que usa la anon key del
-- frontend). PostgREST excluye de su caché las tablas sobre las que
-- ese rol no tiene ningún privilegio.
--
-- Este script:
-- 1) Da acceso de lectura (SELECT) al rol anon sobre las tablas que
--    la web pública necesita leer.
-- 2) Activa Row Level Security y añade una política que solo permite
--    leer items con status = 'published' (nunca borradores), y sus
--    atributos/imágenes asociadas.
-- 3) Recarga el schema cache al final.
--
-- Ejecuta esto completo en el SQL Editor de Supabase.
-- =====================================================================

-- 1. Permisos base de lectura para anon
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON public.companies TO anon, authenticated;
GRANT SELECT ON public.items TO anon, authenticated;
GRANT SELECT ON public.attribute_definitions TO anon, authenticated;
GRANT SELECT ON public.attribute_values TO anon, authenticated;
GRANT SELECT ON public.item_media TO anon, authenticated;
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT SELECT ON public.blog_media TO anon, authenticated;

-- 2. Row Level Security: solo se puede leer contenido publicado

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read published items" ON public.items;
CREATE POLICY "Public can read published items"
  ON public.items FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

ALTER TABLE public.attribute_values ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read attribute values of published items" ON public.attribute_values;
CREATE POLICY "Public can read attribute values of published items"
  ON public.attribute_values FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = attribute_values.item_id AND i.status = 'published'
    )
  );

ALTER TABLE public.item_media ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read media of published items" ON public.item_media;
CREATE POLICY "Public can read media of published items"
  ON public.item_media FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.items i
      WHERE i.id = item_media.item_id AND i.status = 'published'
    )
  );

-- attribute_definitions y companies no son sensibles (son metadatos de
-- catálogo / info pública de la empresa): lectura abierta sin filtro.
ALTER TABLE public.attribute_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read attribute definitions" ON public.attribute_definitions;
CREATE POLICY "Public can read attribute definitions"
  ON public.attribute_definitions FOR SELECT
  TO anon, authenticated
  USING (true);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read companies" ON public.companies;
CREATE POLICY "Public can read companies"
  ON public.companies FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. Forzar recarga del schema cache
NOTIFY pgrst, 'reload schema';
