-- 1. ¿Qué privilegios tiene 'anon' sobre la tabla items?
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'items';

-- 2. ¿Tiene RLS activado? (si tiene RLS activado sin políticas, bloquea todo aunque haya GRANT)
SELECT relname, relrowsecurity, relforcerowsecurity
FROM pg_class
WHERE relname = 'items' AND relnamespace = 'public'::regnamespace;

-- 3. Prueba directa como haría el rol anon
SET ROLE anon;
SELECT id, title, status FROM public.items LIMIT 1;
RESET ROLE;
