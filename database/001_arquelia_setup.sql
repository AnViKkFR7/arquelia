-- =====================================================================
-- ARQUELIA — Alta de empresa, item_type y datos de ejemplo
-- Instancia Supabase compartida (multi-tenant) con Navagli y otras.
-- =====================================================================
--
-- ANTES DE EJECUTAR:
-- 1) Sustituye '<ADMIN_USER_UUID>' por el UUID real de la cuenta que va
--    a administrar Arquelia en el panel admin. Se encuentra en:
--    Supabase Dashboard > Authentication > Users > (columna UID).
--    Puede ser la misma cuenta que ya administra Navagli si el mismo
--    equipo/cliente gestionará ambas empresas, o una cuenta nueva que
--    hayas creado antes para Arquelia.
-- 2) Ejecuta este script completo en el SQL Editor de Supabase.
-- 3) Al final, guarda en un sitio seguro el "company_id" que se
--    imprime — lo necesitará el frontend (variable de entorno) para
--    filtrar los items de Arquelia.
-- =====================================================================

DO $$
DECLARE
  v_admin_user   uuid := '<ADMIN_USER_UUID>'; -- <-- SUSTITUIR
  v_company_id   uuid;
  v_item_type    text := 'construcciones-arquelia';

  attr_titulo         uuid;
  attr_description     uuid;
  attr_what_was_done  uuid;
  attr_ubicacion      uuid;
  attr_categoria      uuid;
  attr_superficie     uuid;

  item1 uuid;
  item2 uuid;
  item3 uuid;
BEGIN
  -- ---------------------------------------------------------------
  -- 1. Alta de la empresa
  -- ---------------------------------------------------------------
  INSERT INTO public.companies (
    name, description, contact_email, contact_phone, website_url, created_by
  )
  VALUES (
    'Arquelia',
    'P & B CORNELLA CONSTRUCCIONES, SOCIEDAD LIMITADA — Construcciones y reformas premium en Cataluña.',
    'info@arquelia.es',
    '+34 600 000 000', -- TODO: sustituir por teléfono real
    'https://arquelia.es',
    v_admin_user
  )
  RETURNING id INTO v_company_id;

  RAISE NOTICE 'company_id generado para Arquelia: %', v_company_id;

  -- ---------------------------------------------------------------
  -- 2. Definición de atributos para item_type = 'construcciones-arquelia'
  --    (mismo patrón que proyecto-reforma-navagli, + ubicación,
  --    categoría y superficie para poder listar/filtrar proyectos)
  -- ---------------------------------------------------------------
  INSERT INTO public.attribute_definitions (company_id, item_type, key, label, data_type, is_filterable, is_required, created_by)
  VALUES (v_company_id, v_item_type, 'titulo', 'Título del Proyecto', 'longtext', false, true, v_admin_user)
  RETURNING id INTO attr_titulo;

  INSERT INTO public.attribute_definitions (company_id, item_type, key, label, data_type, is_filterable, is_required, created_by)
  VALUES (v_company_id, v_item_type, 'description', 'Descripción del Proyecto', 'longtext', false, true, v_admin_user)
  RETURNING id INTO attr_description;

  INSERT INTO public.attribute_definitions (company_id, item_type, key, label, data_type, is_filterable, is_required, created_by)
  VALUES (v_company_id, v_item_type, 'what_was_done', 'Trabajos Realizados', 'text_array', false, false, v_admin_user)
  RETURNING id INTO attr_what_was_done;

  INSERT INTO public.attribute_definitions (company_id, item_type, key, label, data_type, is_filterable, is_required, created_by)
  VALUES (v_company_id, v_item_type, 'ubicacion', 'Ubicación', 'text', true, false, v_admin_user)
  RETURNING id INTO attr_ubicacion;

  INSERT INTO public.attribute_definitions (company_id, item_type, key, label, data_type, is_filterable, is_required, created_by)
  VALUES (v_company_id, v_item_type, 'categoria', 'Categoría / Tipo de servicio', 'text', true, true, v_admin_user)
  RETURNING id INTO attr_categoria;

  INSERT INTO public.attribute_definitions (company_id, item_type, key, label, data_type, is_filterable, is_required, created_by)
  VALUES (v_company_id, v_item_type, 'superficie_m2', 'Superficie (m²)', 'number', true, false, v_admin_user)
  RETURNING id INTO attr_superficie;

  -- ---------------------------------------------------------------
  -- 3. Items de ejemplo (contenido tipo lorem ipsum premium,
  --    para poder maquetar Landing / Proyectos sin esperar datos reales)
  -- ---------------------------------------------------------------
  INSERT INTO public.items (company_id, title, summary, item_type, status, created_by)
  VALUES (v_company_id, 'Reforma Integral Ático Passeig de Gràcia', 'Reforma integral premium de ático de 145 m² en pleno centro de Barcelona.', v_item_type, 'published', v_admin_user)
  RETURNING id INTO item1;

  INSERT INTO public.items (company_id, title, summary, item_type, status, created_by)
  VALUES (v_company_id, 'Reforma de Cocina y Baño Sarrià', 'Renovación completa de cocina y baño principal con acabados de alta gama.', v_item_type, 'published', v_admin_user)
  RETURNING id INTO item2;

  INSERT INTO public.items (company_id, title, summary, item_type, status, created_by)
  VALUES (v_company_id, 'Rehabilitación Casa Unifamiliar Sitges', 'Rehabilitación integral de vivienda unifamiliar con ampliación y diseño de interiorismo.', v_item_type, 'published', v_admin_user)
  RETURNING id INTO item3;

  -- Item 1 — atributos
  INSERT INTO public.attribute_values (item_id, attribute_id, value_text, created_by) VALUES
    (item1, attr_titulo, 'Reforma Integral Ático Passeig de Gràcia', v_admin_user),
    (item1, attr_description, 'Proyecto de reforma integral premium en un ático emblemático del Passeig de Gràcia. Se han cuidado hasta el último milímetro los acabados: suelos de piedra natural, carpintería a medida y sistemas domóticos integrados, logrando un equilibrio entre arquitectura clásica y confort contemporáneo.', v_admin_user),
    (item1, attr_ubicacion, 'Barcelona', v_admin_user),
    (item1, attr_categoria, 'Reforma integral', v_admin_user);
  INSERT INTO public.attribute_values (item_id, attribute_id, value_number, created_by) VALUES
    (item1, attr_superficie, 145, v_admin_user);
  INSERT INTO public.attribute_values (item_id, attribute_id, value_text_array, created_by) VALUES
    (item1, attr_what_was_done, ARRAY['Demolición y redistribución completa','Instalaciones eléctricas y fontanería','Suelos de piedra natural','Carpintería interior a medida','Domótica integrada','Iluminación arquitectónica'], v_admin_user);

  -- Item 2 — atributos
  INSERT INTO public.attribute_values (item_id, attribute_id, value_text, created_by) VALUES
    (item2, attr_titulo, 'Reforma de Cocina y Baño en Sarrià', v_admin_user),
    (item2, attr_description, 'Renovación de cocina y baño principal de una vivienda familiar en Sarrià. Diseño minimalista con materiales de primera calidad: encimeras de piedra sinterizada, grifería de diseño y mobiliario a medida, pensado para un uso diario funcional sin renunciar a la estética premium.', v_admin_user),
    (item2, attr_ubicacion, 'Barcelona', v_admin_user),
    (item2, attr_categoria, 'Reforma Cocina', v_admin_user);
  INSERT INTO public.attribute_values (item_id, attribute_id, value_number, created_by) VALUES
    (item2, attr_superficie, 32, v_admin_user);
  INSERT INTO public.attribute_values (item_id, attribute_id, value_text_array, created_by) VALUES
    (item2, attr_what_was_done, ARRAY['Diseño e interiorismo','Mobiliario de cocina a medida','Encimera de piedra sinterizada','Renovación de baño completo','Grifería y sanitarios de diseño'], v_admin_user);

  -- Item 3 — atributos
  INSERT INTO public.attribute_values (item_id, attribute_id, value_text, created_by) VALUES
    (item3, attr_titulo, 'Rehabilitación Casa Unifamiliar en Sitges', v_admin_user),
    (item3, attr_description, 'Rehabilitación integral de una casa unifamiliar en Sitges, incluyendo ampliación de superficie habitable y un proyecto de interiorismo completo. El resultado combina líneas rectas, materiales nobles y una paleta neutra que dialoga con la luz mediterránea.', v_admin_user),
    (item3, attr_ubicacion, 'Sitges', v_admin_user),
    (item3, attr_categoria, 'Rehabilitación', v_admin_user);
  INSERT INTO public.attribute_values (item_id, attribute_id, value_number, created_by) VALUES
    (item3, attr_superficie, 210, v_admin_user);
  INSERT INTO public.attribute_values (item_id, attribute_id, value_text_array, created_by) VALUES
    (item3, attr_what_was_done, ARRAY['Ampliación de superficie','Refuerzo estructural','Proyecto de interiorismo','Climatización integral','Piscina y exteriores'], v_admin_user);

  RAISE NOTICE '=== RESUMEN ===';
  RAISE NOTICE 'company_id: %', v_company_id;
  RAISE NOTICE 'item_type: %', v_item_type;
  RAISE NOTICE 'items creados: %, %, %', item1, item2, item3;
END $$;
