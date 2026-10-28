# SEO de proyectos de Arquelia

## Inventario previo (28/10/2026)

| Elemento | Alcance encontrado en el código/configuración local |
|---|---|
| Empresa | `4fa302e4-e210-4b9c-bd03-71b23684b284`, tomada de `VITE_ARQUELIA_COMPANY_ID` local; confirmar que coincide con el entorno de despliegue |
| Tabla y tipo | `public.items`, `construcciones-arquelia` |
| Estado público | Exclusivamente `published` |
| Atributos interpretados | `description`, `what_was_done`, `ubicacion`, `categoria`, `superficie_m2` |
| Medios | `item_media`, solo imágenes de IDs públicos resueltos; portada `is_cover`, texto `alt_text` |
| Framework | React + Vite SPA, Vercel |
| Rutas anteriores | `/proyectos/:uuid`; tarjetas y filas navegaban mediante botones |
| Riesgos encontrados | Detalle sin filtro `item_type`, metadatos genéricos, soft 404, errores confundidos con vacíos y sitemap sin proyectos |

Este es un inventario técnico, pendiente de aprobación editorial. Tras indicar el usuario esta carpeta como ubicación del export, se comprobó que solo contenía plantillas y se generó una copia pública de solo lectura de Arquelia. El preflight confirma las columnas SEO y **3 proyectos publicados**, todos sin slug, título SEO ni descripción SEO. Se prepararon propuestas y SQL para revisión; **no se han ejecutado migraciones, escrito en Supabase ni desplegado**. El export generado y la redacción aún necesitan aprobación humana. No se ha consultado ningún otro tenant ni tipo. Ver `REVIEW-2026-10-28.md`.

## Implementación preparada

- Listado, detalle, export, medios y sitemap fijan la empresa configurada, el tipo de Arquelia y el estado público. La búsqueda UUID también filtra por tipo.
- `/proyectos/:slug` sirve HTML inicial con contenido público equivalente al detalle, metadatos por item, canonical y tarjetas OG/Twitter. Se conserva la vista React y el diseño actual.
- Los UUID públicos con slug válido responden **308** al slug. Los UUID pendientes de slug conservan el acceso **200/noindex**, sin canonical, y no entran en el sitemap. No se genera un slug a partir del título al navegar.
- Por compatibilidad, el formato UUID queda reservado para las URLs antiguas. El preflight detecta un slug con ese formato como no utilizable: requiere revisión humana.
- Slug inexistente, item de otro tenant/tipo, draft o archived: **404/noindex**. Error Supabase o configuración inválida: **503/noindex**. No hay datos de ejemplo como fallback.
- Las tarjetas y filas son enlaces reales; listados paginados con orden estable. Los errores ofrecen reintento y no se muestran como listas vacías.
- Sitemap solo añade slugs válidos publicados. No se usa `updated_at` como `lastmod`: no hay evidencia de que todos sus cambios sean editoriales. Se puede añadir cuando el panel garantice esa semántica.
- HTML de proyectos, redirects y sitemap usan `Cache-Control: no-store`: editar/archivar/publicar se refleja en la siguiente petición. Esto prioriza coherencia sobre caché. El blog conserva sus rutas y no se vuelve a añadir al navbar.
- Para cambiar un slug que ya existía, registrar primero `slug-anterior: UUID-del-item` en `src/lib/projectRedirects.ts`. Se consulta de nuevo ese UUID bajo los mismos filtros públicos antes de redirigir; no se guarda una copia del contenido. El generador SQL rechaza cambios de slug sin esa entrada aprobada.

## Export, revisión y SQL

1. Revisar y aprobar el inventario anterior y el alcance de los datos públicos. Si ya existe un export aprobado, usarlo; no consultar otros tenants.
2. Con autorización para auditar los publicados de Arquelia, ejecutar:

   ```sh
   npm run items-seo:preflight -- --export seo/items/public-items.export.json
   ```

   El comando solo lee con la clave pública. Comprueba que las columnas SEO están disponibles, recorre todas las páginas y exporta únicamente los campos públicos interpretados, metadatos y medios. No usa ni necesita service-role. Sale con código 1 si encuentra problemas; puede crear el export igualmente. No sobrescribe archivos. Revisar el export antes de compartirlo.

3. Ejecutar por separado el preflight SQL del panel para comprobar colisiones con **todos** los tipos/estados de la misma empresa. Se incluye su copia ajustada al UUID local en `ITEMS_SEO_PREFLIGHT.sql.example`; es texto SQL de solo lectura. La auditoría pública no puede garantizar ausencia de colisiones con borradores ocultos por RLS.
4. Preparar y revisar una propuesta por fila usando el export público. No cambiar títulos/resúmenes funcionales ni inventar ubicaciones, servicios o imágenes. Conservar slugs existentes. Formato de `seo/items/proposals.reviewed.json`:

   ```json
   [
     {
       "id": "UUID-REAL-DEL-EXPORT",
       "company_id": "4fa302e4-e210-4b9c-bd03-71b23684b284",
       "item_type": "construcciones-arquelia",
       "slug": "slug-revisado",
       "seo_title": "Título revisado de hasta 70 caracteres",
       "seo_description": "Descripción revisada de hasta 160 caracteres.",
       "seo_og_image_url": null
     }
   ]
   ```

   Si se elige una imagen, comprobar su acceso público por HTTPS sin cookies. `null` es válido si no hay una imagen verificada.

5. Generar un lote **sin conectarse a Supabase**:

   ```sh
   npm run items-seo:prepare -- --export seo/items/public-items.export.json --proposals seo/items/proposals.reviewed.json --output seo/items/proposals.reviewed.sql
   ```

   El generador sigue `ITEMS_SEO_VALUES_TEMPLATE.sql` del panel. Fija empresa/tipo/IDs, valida límites, comprueba duplicados y colisiones con otros tipos de la empresa al ejecutar el SQL, bloquea las filas y rechaza un `updated_at`/slug distinto del export. Solo actualiza `slug`, `seo_title`, `seo_description`, `seo_og_image_url` y `updated_at`. Incluye `SELECT` de comprobación y deja `COMMIT` comentado. No ejecuta SQL. Se incluye también la plantilla original ajustada como `ITEMS_SEO_VALUES_TEMPLATE.sql.example`.
6. Una persona revisa redacción y lote, ejecuta el SQL en el proyecto correcto y confirma la transacción únicamente después de revisar el resultado. Guardar copia del export, lote y comprobación en el registro de despliegue. La regla `*.sql` existente en `.gitignore` se ha respetado; decidir expresamente si se versiona un lote real.

## Comprobación y publicación

`npm run build`, después `npm test` y `npm run lint`. Las pruebas usan fixtures locales y un servidor HTTP local; no llaman al CRM ni crean datos reales.

Antes de desplegar, comprobar en preview Vercel una ficha con SEO completo, otra con fallback, UUID→308, slug inexistente/draft→404, error→503, aislamiento y sitemap. Verificar escritorio, tablet y móvil con proyectos reales aprobados. `vite dev`/`vite preview` ejecutan la SPA, pero no los handlers Vercel. Revisar también la conectividad saliente Vercel→Supabase, que este proyecto había documentado como problemática en integraciones anteriores.

Una vez aprobada la preview y aplicados los datos revisados, desplegar y repetir preflight y comprobación HTTP sin JavaScript. Un cambio de slug necesita el mapa anterior→UUID en ese mismo despliegue; una despublicación debe quitar la URL del sitemap y devolver 404 tanto por slug como por UUID.
