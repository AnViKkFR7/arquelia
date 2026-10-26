# Integraciones de Arquelia

## Configuración y despliegue

Se mantiene la arquitectura existente: leads y analítica usan las Edge Functions de Supabase. El blog se lee con la clave pública y añade una función Vercel para entregar contenido y SEO en el HTML inicial.

1. En la instancia compartida de Supabase, comprobar que están aplicadas las migraciones del panel: `CRM_CONTACTS_PIPELINE.sql`, `CRM_LEAD_ITEM_ATTRIBUTION.sql`, `CONTENT_SEO_FIELDS.sql` y las migraciones de analítica indicadas en `ANALYTICS_INTEGRATION.md`. Estos ficheros pertenecen al repositorio del panel; no se recrean ni ejecutan desde esta web.
2. Activar el módulo `crm` de Arquelia en `company_modules`. Sin configuración o con el módulo desactivado, el formulario responde 503.
3. Configurar el secreto **`ARQUELIA_COMPANY_ID`** en Supabase con el mismo UUID que `VITE_ARQUELIA_COMPANY_ID`. Las dos funciones rechazan identificadores de otra empresa. Mantener `ANALYTICS_SALT` y `RESEND_ARQUELIA_API_KEY`. La service role permanece exclusivamente en Supabase.
4. Desplegar las dos funciones:

   ```sh
   supabase functions deploy send-contact-arquelia --no-verify-jwt
   supabase functions deploy track-arquelia --no-verify-jwt
   ```

5. En Vercel configurar las variables públicas ya usadas por la web: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ARQUELIA_COMPANY_ID`, `VITE_SITE_URL=https://arquelia.es` y el contenedor real `VITE_GTM_ID`. No añadir claves de servicio al frontend.
6. Ejecutar `npm run blog:preflight` y el fichero completo `CONTENT_SEO_FIELDS_AUDIT.sql` del panel antes de publicar contenido antiguo. El script comprueba con la clave pública los slugs publicados de Arquelia; el SQL del panel permite la auditoría completa con privilegios de administración.
7. Ejecutar `npm run build`, `npm test` y desplegar la web a Vercel.

Configurar el secreto y desplegar ambas Edge Functions antes de publicar el frontend actualizado. No se han ejecutado migraciones ni desplegado funciones automáticamente.

## Comportamiento

- El formulario acepta nombre y al menos email o teléfono. El consentimiento es opcional y se conserva con fecha, origen y versión del texto cuando se marca. Al modificar el texto visible, actualizar `LEAD_PRIVACY_TEXT_VERSION` en `src/lib/leads.ts`.
- Se guarda la ruta, referrer, los cinco parámetros UTM de entrada (en memoria durante la navegación SPA) y el proyecto o artículo desde el que se abrió el formulario. El contacto lo enlaza la base de datos; el navegador no envía identificadores de contactos.
- Se conserva la entrega alternativa por email. Solo se emite `form_submit` si el servidor confirma `lead_saved: true`; los bots y las entregas exclusivas por email no cuentan como solicitudes guardadas.
- GTM se carga desde la lógica de consentimiento. «Solo necesarias» respeta el estado de medición propia y GPC. Publicidad aparece desactivada porque la web no la utiliza.
- `/blog` y `/blog/:slug` muestran solo publicaciones de Arquelia, con paginación, imágenes ordenadas y sus textos alternativos. Markdown usa `react-markdown` con HTML desactivado y su filtro de protocolos seguro.
- Vercel sirve los artículos con contenido, título SEO, descripción, canonical y Open Graph iniciales. Los artículos inexistentes o no publicados devuelven 404; los errores de carga devuelven 503, sin convertirlos en listados vacíos. El sitemap dinámico incluye solo slugs publicados válidos y se actualiza con una caché de 60 segundos.
- `vite dev` y `vite preview` permiten probar la SPA, pero no ejecutan la función Vercel. La comprobación HTTP de SEO y códigos de estado requiere `vercel dev` o un despliegue Vercel. Verificar allí que la función puede consultar Supabase: el proyecto documentaba problemas de conexiones salientes desde Vercel para integraciones anteriores. No se ha validado esa conectividad en un despliegue real.

## Validación

`npm test` prueba aislamiento por empresa/estado, paginación, medios, preflight, Markdown, SEO inicial, sitemap y 404, además de ejecutar la función de contacto con Supabase y correo simulados. No envía emails ni crea solicitudes reales. La compilación comprueba TypeScript del frontend y de la función del blog.

La lectura pública comprobada el 26 de octubre de 2026 encontró el esquema de blog disponible y cero artículos publicados para Arquelia. Las pruebas con artículos usan fixtures locales; la verificación del flujo completo con el panel queda para un entorno de pruebas con las migraciones y secretos configurados.
