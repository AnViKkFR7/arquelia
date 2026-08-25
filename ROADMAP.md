# ROADMAP — Web Arquelia

> Estado: **F0–F6 completadas · i18n ES/EN completo · F7 pendiente**
> Última actualización: 2026-08-20
> Material de referencia: [`design-refs/REFS.md`](design-refs/REFS.md)

## Principios de diseño

1. **Premium sin ruido** — mucho aire, tipografía grande, poco elemento decorativo.
   Cada animación tiene un motivo; si no aporta, fuera.
2. **Bordes rectos** en todo (radio 0–2px). Excepción deliberada: botones-píldora,
   el círculo "+" y la barra flotante del header (14px, como siteassist).
3. **Movimiento sutil y coherente** — una sola curva de easing (`cubic-bezier(.16,1,.3,1)`),
   duraciones de la misma escala, todo respeta `prefers-reduced-motion`.
4. **Paleta**: negro `#060606`–`#171717`, grises neutros, blanco, dorado `#b8952e`/`#d4af37`.
   El dorado es **acento**, nunca superficie grande.
5. **Mobile-first** siempre; el desktop añade, no rehace.

## Estado por fases

### F0 · Fundamentos ✅
- [x] Fuentes reales cargadas (antes caían a Georgia/system — el `--font-display` no existía)
- [x] Tokens refinados: escala tipográfica fluida, espaciado, capas z, sombras
- [x] Sistema de movimiento unificado (`<Reveal>`, `useScrollProgress`, `useInViewOnce`)
- [x] Utilidades de layout (`.container`, `.section`, `.eyebrow`)
- [x] Componentes base: `Button`, `SectionHeader`, `Marquee`

### F1 · Chrome (header, footer, navegación) ✅
- [x] Header flotante estilo siteassist (fijo, blur, no cambia con scroll)
- [x] Menú móvil
- [x] Selector de idioma ES/EN
- [x] Footer 4 columnas + línea dorada
- [x] Scroll-to-top al cambiar de ruta
- [x] Transición de entrada entre páginas

### F2 · Landing ✅
- [x] Hero — **canvas + secuencia de 61 fotogramas controlada por scroll** (zoom exterior→interior)
- [x] `01 / Sobre nosotros` — texto + enlace
- [x] Galería mosaico con revelado escalonado (`Reveal variant="up"`)
- [x] Franja de datos con marquesina (ref. vídeo 01, tramo 4.5–7s)
- [x] `02 / Proyectos destacados` — tarjetas con círculo "+"
- [x] CTA final

### F3 · Servicios ✅
- [x] Cabecera + intro
- [x] Grid de servicios con iconos de línea (ref. vídeo 03)
- [x] Tarjetas de categoría con hover-reveal (ref. vídeo 02)
- [x] "Nuestro proceso" — lista numerada con sangría creciente (ref. vídeo 03)
- [x] CTA final

### F4 · Proyectos ✅
- [x] Listado: filas alternas imagen/texto (ref. Private Courtyard), una por proyecto
- [x] Detalle: hero + marquesina + tarjetas de datos (ref. vídeo 01)
- [x] Galería de imágenes del proyecto
- [x] Navegación al siguiente proyecto

### F5 · Sobre nosotros ✅
- [x] Hero oscuro con titular grande (ref. Belgrade Arbor)
- [x] Texto de empresa
- [x] Tres pilares: Maestría / Materiales / Método (ref. modusprojects "Drie M's")
- [x] Cifras / trayectoria
- [x] CTA final

### F6 · Contacto ✅ (salvo envío real)
- [x] Layout dos columnas: formulario + datos de empresa (columna derecha *sticky*)
- [x] Formulario por fases, reutilizable en toda la web vía modal y embebido en Contacto
- [x] Pantalla de confirmación "¡Gracias!" (ref. vídeo 04)
- [ ] **Envío real de email a `info@arquelia.es`** (Supabase Edge Function + Resend).
      Hoy `buildMessageBody()` genera el cuerpo y lo escribe en consola — falta el transporte.

### F7 · Cierre ⬜
- [ ] Páginas legales (aviso legal, cookies, privacidad)
- [ ] SEO: meta tags, Open Graph, `sitemap.xml`, `robots.txt`
- [ ] Rendimiento: `srcset`, lazy-loading, code-splitting por ruta, auditoría Lighthouse
- [ ] Accesibilidad: foco visible, contraste, navegación por teclado
- [ ] Traducción EN completa
- [ ] Deploy en Vercel

## Pendiente de terceros

| Qué | Quién | Bloquea |
|---|---|---|
| Logo de Arquelia | Cliente | Header y footer (ahora es texto) |
| Fotos reales de obra | Cliente | Sustituir imágenes de stock |
| Datos reales: teléfono, dirección, CIF, horario | Cliente | Contacto y páginas legales |
| Cifras reales (años, nº de proyectos) | Cliente | Franja de datos de la landing |

## Registro de trabajo

**2026-08-25 — Peso tipográfico exacto por elemento; `@vercel/analytics` con el import equivocado**

- **Corrección importante sobre la pasada anterior**: revisando el mockup elemento a
  elemento, el titular del hero y todos los `h2` de sección van en **Medium (500)**, no en
  Bold — el único "TOSH A BOLD" de toda la imagen es el wordmark de marca (una imagen, no
  texto). La base (`h1`/`h2` en `index.css`, `.title` del hero en `Hero.module.css`) pasa
  de 700 a 500.
  - Nav del header → Light (300, ya lo era por herencia del `body`, sin cambios).
  - Botones (CTA del header, panel móvil, `ButtonSlider`) → Regular (400, antes 600).
  - Título de las tarjetas de `ServicesGrid` ("Cocina", "Baños"...) → Regular (400, antes 600).
  - Título del escenario de `ProjectsShowcase` y las etiquetas de los índices → Medium
    (500, antes 700 y sin peso explícito respectivamente).
  - Número de orden del escenario (`stageIndex`) → 300, no 200: Tosh A no tiene un peso
    200, así que el navegador habría aproximado al más cercano disponible de todos modos.
  - Firma del footer ("Tu hogar llevado a otro nivel") → Medium (500, antes 700); el texto
    en inglés se sincroniza con el título del hero para que diga lo mismo en los dos idiomas.
  - Corregido además un error de transcripción del hex de la muesca dorada:
    `--gold-notch` era `#c6a15b`, la imagen dice `#c6a158`.
- **`@vercel/analytics` con el subpath equivocado, dos veces**. `src/App.tsx` importaba
  `Analytics` de `@vercel/analytics/next` — el punto de entrada específico de Next.js, que
  internamente importa de `next/navigation`, un paquete que no existe en este proyecto
  (SPA con Vite, no Next.js). En `tsc` sólo daba un aviso de import sin usar (nunca se
  llegó a montar `<Analytics />`); en el build de Vite ya no compila en absoluto, con un
  "Missing export" al no poder resolver `next/navigation`. Cambiado a `@vercel/analytics/react`,
  el genérico para cualquier app de React que no sea Next, y montado dentro de
  `<CTAFormProvider>`. Esto se corrigió dos veces en la misma sesión porque una edición
  manual intermedia volvió a dejar `/next` — si se toca este import otra vez, que quede
  claro por qué: con Next.js no instalado, `/next` no puede funcionar aquí bajo ninguna
  circunstancia, no es una cuestión de preferencia.
- **Verificado**: `tsc -p tsconfig.app.json --noEmit` y `npm run build` limpios; en el
  navegador, pesos computados confirmados uno a uno (`h1`/`h2`: 500, nav: 300, botones:
  400, tarjetas de servicios: 400, escenario de proyectos: 500/300, firma del footer:
  500) sin errores de consola.
- **Nota sobre el error de Vercel pegado en el chat**: correspondía al commit `f804424`
  (anterior al arreglo de `SectionHeader` de la entrada de abajo). El commit con el
  arreglo (`9ba04ec`) ya estaba en `origin/main` en el momento de revisarlo — el log
  pegado era de un despliegue viejo, no reflejaba el estado real del repo.

**2026-08-25 — Tosh A real vía Adobe Fonts; limpieza tras ediciones manuales**

- **Tosh A ya no es una sustitución — es la fuente real, con licencia.** El cliente añadió
  un kit de Adobe Fonts (Typekit) a `index.html`
  (`https://use.typekit.net/zol5arr.css`) con acceso a la tipografía real. Verificado con
  `curl` contra el propio kit: registra la familia `"tosh-a"` (así, en minúsculas — cosa de
  Typekit) en 4 pesos exactos, 300/400/500/700 — ni más ni menos, no hay un 600. `tokens.css`
  pasa a `--font-display`/`--font-sans: 'tosh-a', 'Manrope', ...`, con Manrope de reserva
  por si el kit no cargara. Corregido `index.css`: `h3`/`h4` de 600 a 500, porque ese 600
  "Tosh A Medium" que puse en la pasada iteración no existe en la fuente real — con Tosh A
  cargado, el navegador habría buscado el peso más cercano disponible (probablemente 700)
  en vez del 500 que tocaba.
- **Quitado el enlace a "TRY Tosh A" de `db.onlinewebfonts.com`** que también había en
  `index.html`. Ya no hace falta (el kit de Typekit da la fuente real) y además era
  arriesgado: ese mirror redistribuye tipografías de pago afirmando una licencia
  "CC BY 4.0" que no le corresponde — es una señal clara de fuente pirateada, y usarla en
  la web de un cliente es un riesgo legal real que no vale la pena correr habiendo ya una
  vía legítima.
- **`SectionHeader` — limpieza tras una edición manual.** El cliente simplificó el
  componente compartido quitando el bloque que pintaba el índice/eyebrow ("01 / Servicios"),
  pero dejó las props `index`/`eyebrow` declaradas sin usar, lo que rompía `tsc -b` (y por
  tanto el build de Vercel) en los 6 archivos que aún se las pasaban. Quitadas del tipo y
  de las llamadas en `ServicesPage`, `AboutPage`, `ServicesGrid`, `ProjectsShowcase` y
  `ProjectDetailPage`. En `ProjectDetailPage` había dos casos que pasaban *sólo* `eyebrow`
  sin `title` — con el bloque de renderizado ya quitado, esas dos cabeceras se habían
  quedado completamente vacías; sustituidas por un simple `<span className="eyebrow">`
  para no perder el texto.
- **Borrado `src/pages/HomePage.module.css`**: archivo huérfano que `HomePage.tsx` no
  importa, con tokens que ni siquiera existen en este proyecto (`--color-black-900`,
  `--space-8`...) — resto de un scaffold que nunca se conectó.
- **Verificado**: `tsc -p tsconfig.app.json --noEmit` y `npm run build` limpios; en el
  navegador, `document.fonts` confirma `tosh-a` cargado y en uso (`status: "loaded"`), el
  CSS compilado tiene `h3{font-weight:500}`, y las páginas tocadas (`/`, `/servicios`,
  `/sobre-nosotros`, `/proyectos`, `/proyectos/:id`) cargan sin errores de consola.

**2026-08-25 — Rediseño de la landing según mockup del cliente**

Cambio grande a partir de un mockup enviado por el cliente: tipografía, estructura de la
landing, navbar, footer y contenido legal.

- **Tipografía sitewide**: el mockup pide "Tosh A" en 4 pesos (Light/Regular/Medium/Bold)
  para todo el texto. **Tosh A es de pago** (Black[Foundry], vía Adobe Fonts), no está en
  Google Fonts y no hay licencia para sus archivos. Sustituida por **Manrope**: geométrica
  como Tosh A, gratuita, cubre los mismos 4 pesos. Cambio centralizado en
  [`tokens.css`](src/styles/tokens.css) (`--font-display`/`--font-sans` → Manrope) e
  [`index.html`](index.html) — si algún día se consigue la licencia de Tosh A, ese es el
  único sitio que hay que tocar. En [`index.css`](src/index.css): `h1`/`h2` a peso 700
  (antes 400 — con Fraunces un peso medio ya tenía presencia propia; en Manrope se veía
  plano), `h3`/`h4` a 600, `body` a 300. Quitado `font-variation-settings` (ejes de
  variable font específicos de Fraunces, sin efecto en Manrope). El hero (`Hero.module.css`)
  tenía su titular a 300 a propósito (look editorial fino); ahora a 700 para seguir el mockup.
- **Landing reestructurada** — orden nuevo: Hero → Diseño y calidad → Servicios (grid) →
  Proyectos (story) → CTA final. Sustituye al orden anterior (Hero, Sobre nosotros,
  Mosaico, Destacados, Servicios en lista, CTA con imagen).
  - **`IntroSection`** simplificada a título + párrafo centrados, sin cifras ni CTA
    (antes las llevaba). Copy nuevo: "Diseño y calidad en cada proyecto."
  - **`ServicesGrid`** (nuevo): 4 tarjetas de imagen (Cocina/Baños/Reforma
    Integral/Rehabilitación, imágenes de `public/mockup-images/`), `Reveal variant="up"
    once={false}` como pidió el cliente, todas enlazan a `/servicios`.
  - **`ProjectsShowcase`** (nuevo) — la pieza más compleja: formato "story", imagen grande
    que rota entre 4 proyectos cada 5s, con 4 índices clicables debajo (llevan a
    `/proyectos`) que al pasar el ratón adelantan la vista sin tocar la rotación de fondo
    (`hovered` es un estado de visualización aparte de `active`; al quitar el ratón se ve
    lo que le tocara en ese momento — confirmado en vivo: el índice había avanzado solo
    durante la verificación). Cada índice lleva su propia barra de progreso de 5s
    (`key={active}` para reiniciar la animación CSS al remontar).
    **Móvil**: sin hover y sin sitio para 4 índices con etiqueta, así que pasa a ser un
    **carrusel deslizable** (`scroll-snap`, mismo patrón que la cabecera de proyecto en
    móvil) — decisión propia ante la petición explícita de ideas del cliente; alternativas
    no implementadas que se le plantean: una barra de progreso apilada arriba de la imagen
    (más fiel al patrón real de Instagram) o autoplay con vídeos cortos en vez de fotos.
  - **`FinalCta`** (nuevo): recoge el contenido que antes vivía en `IntroSection`
    (pregunta + párrafo + cifras 15+/120+/1 + `ButtonSlider`), ahora sobre fondo claro al
    cierre de la landing — es justo lo que pedía el cliente ("ya está muy similar al
    actual punto 01"). Reutiliza `SectionHeader` para el título+párrafo a dos columnas.
  - **Eliminados** `MosaicGallery`, `FeaturedProjectsShowcase` y `ServicesPreview`
    (`.tsx`+`.module.css` de los tres): quedaban huérfanos tras el nuevo orden, sin otro
    sitio en el código que los usara.
- **Navbar**: el logo pasa a estar realmente centrado en desktop, no sólo "en el hueco que
  sobra" — `.bar` cambia de `flex` a una rejilla `1fr auto auto 1fr` sólo a partir de
  1024px (por debajo, sigue el `flex` de siempre: nav oculto, logo izq., hamburguesa der.).
  El orden en el DOM cambia a nav→logo→acciones porque CSS Grid coloca por orden de
  marcado, no hay `order` en juego. Verificado con `getBoundingClientRect()`: el centro
  del logo cae a 1px del centro de la barra. El selector de idioma se mantiene (no salía
  en el mockup, pero el cliente pidió explícitamente conservarlo).
- **Footer**: ya tenía la barra inferior con © año / desarrollado por / razón social que
  pedía el cliente — no hizo falta ningún cambio, sólo se verificó que el texto coincide
  exactamente.
- **Páginas legales reescritas** ([`LegalPage.tsx`](src/pages/LegalPage.tsx)): antes eran
  un único párrafo placeholder ("Texto legal pendiente de completar..."). Ahora Aviso
  Legal (LSSI-CE), Política de Privacidad (RGPD/LOPDGDD) y Política de Cookies con
  estructura real por secciones (7/7/4 secciones respectivamente), en ES y EN. Usa los
  datos ya conocidos (razón social "P & B Cornellà Construcciones, S.L.", "Arquelia",
  Cornellà de Llobregat, info@arquelia.es) y dejan como placeholder explícito lo que no se
  conoce (CIF, domicilio exacto, datos de Registro Mercantil) — pendiente de que el
  cliente los facilite para sustituir esos corchetes.
- **Verificado**: `tsc` y `npm run build` limpios. En el navegador (pestaña nueva, para
  evitar histórico de errores de HMR acumulado): las 8 rutas cargan, el grid de servicios
  muestra las 4 imágenes correctas, el story de proyectos rota de verdad (el índice había
  avanzado al comprobarlo), el carrusel móvil tiene `overflow-x:auto` con 4 slides, el
  logo del header está centrado a 1px, y el pie de página coincide con el texto pedido.

**2026-08-25 — Build roto en Vercel, y logo/favicon reales**

- **Errores de TypeScript que bloqueaban `npm run build` en Vercel** (`tsc -b` es
  estricto con variables sin usar; en local con el dev server no se nota).
  - [`HeroCanvas.tsx`](src/components/home/HeroCanvas.tsx): `framePath(variant, i)` ya no
    usaba `variant` — quedó así tras consolidar las secuencias `desktop`/`mobile` en una
    sola carpeta `final-frames` (commits "final frames"). El recorte a cada aspect ratio
    ya lo resuelve `paint()` vía cover, así que un único set de fotogramas sirve a las dos
    variantes; se quita el parámetro muerto.
  - [`ServicesPreview.tsx`](src/components/home/ServicesPreview.tsx): `images` y `pos`
    sin usar. No era código muerto para borrar — `git log -p` muestra que el bloque que
    los usaba (la previsualización flotante que sigue al cursor) se borró por accidente en
    un commit posterior, y el CSS correspondiente (`.preview`/`.previewImg`, con su gating
    `@media (hover: hover) and (pointer: fine)` y su `prefers-reduced-motion`) seguía
    intacto y sin usar. Restaurado el bloque, adaptado a `images[i]` en vez de
    `item.image` porque ahora los textos de las filas vienen de i18n (sin URL de imagen
    propia) y ya existía un array `images` en paralelo para esto.
- **Logo y favicon reales**, sustituyendo el placeholder violeta de Vite
  (`public/favicon.svg`, sin relación con la marca) y el rombo dorado dibujado en CSS que
  hacía de marca en el header y el footer.
  - **Movidos los archivos de logo** de `public/hero-frames/logos/` a `public/brand/logos/`
    antes de tocar nada más: `design-refs/build_hero_frames.py:98` hace
    `shutil.rmtree()` sobre toda `public/hero-frames/` al regenerar la secuencia del hero.
    Si el logo se hubiera quedado ahí dentro, la próxima regeneración lo habría borrado
    sin avisar.
  - **Favicon**: `Favicon_transparente.png` (el "A" dorado, con más margen que el resto de
    variantes — se ve mejor a tamaño de pestaña). Sustituye a `favicon.svg`, que se borra.
  - **Header y footer**: el rombo CSS de 9-11px que usaba `var(--accent-bright)` pasa a
    ser el icono real (`Transparente_solo_logo.png`, el "A" con el degradado dorado de
    marca — se copia a `src/assets/brand/mark-gold.png` para que Vite lo optimice y
    hashee, igual que el resto de imágenes del proyecto). Se eligió la versión dorada y no
    una de las planas (blanco/negro/antracita) porque es la que continúa el lenguaje que
    ya tenía el rombo que sustituye: un acento de marca en el dorado de acento, no un
    icono neutro. El giro brusco de 45°→135° al hover no tenía sentido sobre una forma
    triangular asimétrica (se veía roto), así que el hover pasa a un `scale(1.15)` sutil.
  - Quedan sin usar en `public/brand/logos/`: las variantes `Iso_*` (planas, para fondos
    donde el degradado no lea bien) y `Transparente_*_logo_abajo_nombre.png` /
    `..._solo_nombre.png` (un lockup completo con el nombre tipografiado). No se ha
    encontrado un sitio en la web actual donde encajen mejor que el texto "ARQUELIA" ya
    maquetado con la tipografía de display del sitio — quedan disponibles si se necesitan.
- **Verificado**: `tsc -p tsconfig.app.json --noEmit` y `npm run build` limpios; en el
  navegador, el `<img>` del header y el del footer cargan (`naturalWidth > 0`) y el
  `<link rel="icon">` apunta al archivo correcto; sin errores de consola.

**2026-08-24 — El visor de galería no mostraba la imagen: `position: fixed` roto por `<main>`**

Síntoma: al abrir una imagen aparecía el fondo negro a pantalla completa pero **sin
imagen**, y en móvil el navbar tapaba el botón de cerrar. Las dos cosas tenían la misma
causa.

- **Causa**: `<main>` lleva la animación de entrada de página con
  `animation-fill-mode: both`. Ese relleno deja aplicado el `transform` del fotograma
  inicial de forma permanente, y un ancestro con `transform`:
  1. pasa a ser el bloque contenedor de cualquier `position: fixed` descendiente — el
     visor dejaba de medir el viewport y pasaba a medir **toda la página** (3839px), con
     lo que la imagen, centrada verticalmente, caía en `y=1836`, **fuera de pantalla**;
  2. crea un contexto de apilamiento, así que el `z-index: 200` del visor quedaba
     encerrado dentro de `<main>` y no podía superar al header (`z-index: 100`).

  La imagen siempre se había cargado bien (`naturalWidth: 1920`, `complete: true`): sólo
  estaba colocada donde no se veía.
- **Solución**: el visor se renderiza con `createPortal` a `<body>`, fuera de `<main>`.
  Es la solución robusta — no depende de qué haga la animación de página.
- **Corregido además**: `animation-fill-mode` de `.main` pasa de `both` a `backwards`.
  El fotograma final ya era idéntico a los estilos base, así que rellenar hacia delante no
  aportaba nada visualmente pero dejaba a `<main>` con `transform` y contexto de
  apilamiento para siempre — una trampa latente para cualquier `position: fixed` futuro.
- **Verificado**: el visor cuelga de `BODY`, cero ancestros con `transform`, su alto pasa
  de 3839px a coincidir con el viewport, y `elementFromPoint` sobre el centro del botón de
  cerrar devuelve el propio botón y no el navbar (44×44px, tamaño táctil correcto).

**2026-08-24 — Cabecera de proyecto en móvil: sin revelado y con aviso de deslizar**

- Las tarjetas de datos ya no llevan `Reveal` por debajo de 560px: la tira se recorre en
  **horizontal** y el revelado va ligado al scroll **vertical**, así que quedaban tarjetas
  a medio aparecer que nunca terminaban de resolverse. Se decide en JS (`matchMedia`) y no
  sólo en CSS, porque el ticker escribe estilos en línea y no se puede anular desde la hoja.
- Añadido un aviso "Desliza para ver más" con una flecha que se mueve, visible sólo en
  móvil y sólo si hay más de una tarjeta. Sin él, con una tarjeta y media a la vista, no
  quedaba claro que hubiera más al lado.
- **Verificado** a 375px: 4 tarjetas, ninguna con estilo de revelado, aviso visible y la
  tira con `overflow-x: auto` + `scroll-snap-type: x mandatory`.

**2026-08-24 — Catálogo de servicios, cabecera móvil de proyecto y galería con visor**

- **Catálogo de `/servicios` rehecho**. Era un bloque negro a pantalla completa con
  iconos de línea en cajas de 1px — repetía el lenguaje del grid oscuro de la referencia
  `03-icons-process-list` y chocaba con el resto de la página, que es clara. Ahora es una
  **rejilla editorial sobre `--bg-alt`**: sin iconos y sin cajas, sólo un filete superior
  por ficha, índice en dorado, título en la serif de display y descripción. El único
  movimiento es una barra dorada que recorre el filete al pasar por encima. Se eligió a
  propósito un patrón que no estuviese ya en la web (no es mosaico de imágenes, ni lista
  numerada con sangría, ni tarjeta con revelado al hover).
- **Cabecera de `/proyectos/:id` en móvil**. Las cuatro tarjetas de datos se apilaban
  (~560px), lo que tapaba casi toda la foto y empujaba la marquesina del título hasta la
  franja del header flotante, que la ocultaba. Pasan a ser una **tira deslizable de una
  sola fila** con `scroll-snap`, sangrada hasta los bordes de pantalla. La cabecera vuelve
  a medir lo razonable: se ve la imagen y el título queda muy por debajo del navbar.
  Sólo aplica por debajo de 560px; escritorio intacto.
- **Galería con visor ampliable** ([`ProjectGallery`](src/components/projects/ProjectGallery.tsx)).
  Mosaico donde cada imagen abre un visor a pantalla completa, con flechas, teclado
  (`←` `→` `Esc`), contador y cierre por fondo. Ahora entran **todas** las imágenes,
  incluida la portada, para que ninguna quede sin poder verse.
  - **Bug corregido**: la galería anterior ponía `height: 100%` en la `<img>` dentro de un
    contenedor que se dimensiona por su contenido. La referencia es circular y el navegador
    la resuelve a 0, así que la sección se quedaba plana. El alto definido vive ahora en el
    botón (`aspect-ratio`), no en la imagen.
  - **Bug corregido antes de publicar**: el visor usaba un token `--z-modal` inexistente
    con reserva 60, por debajo de `--z-header: 100` — el navbar se habría dibujado encima.
    Cambiado a `--z-overlay`.
  - El scroll se bloquea en `<html>`, no en `<body>`: como `overflow-x: hidden` vive en
    `<html>`, es `<html>` quien scrollea y bloquear `<body>` no habría hecho nada.
  - Los `title`/`alt` de media vienen del CMS y suelen ser el nombre del archivo
    ("Blog1-imagen1_894df…webp"); se descartan y se cae al título del proyecto.
- **Hueco vacío tras "Trabajos realizados"**. El banner de "siguiente proyecto" ocupaba
  media pantalla para enlazar a un único sitio. Sustituido por una sección **"Otros
  proyectos"** con tarjetas (`ProjectCard`, reutilizado) a todos los demás.
- **Verificado**: `tsc` y `npm run build` limpios; visor comprobado en el navegador
  (abre con `z-index: 200`, avanza con `→` de 01/02 a 02/02, `Esc` cierra, el bloqueo de
  scroll se aplica y se restaura); catálogo con 8 fichas sobre fondo claro y cero iconos.
  **No verificado visualmente**: el panel de previsualización no compone fotogramas y
  reporta `innerWidth: 0`, así que las media queries evalúan como móvil y no se puede
  juzgar ni el aspecto ni el layout de escritorio. Pendiente de revisión en local,
  especialmente la tira deslizable en un móvil real.

**2026-08-24 — Tarjetas de servicios: revelado por toque y contraste del estado activo**

En móvil la frase completa ("REFORMAS DE … A MEDIDA") aparecía siempre y encima
ilegible sobre las imágenes claras. Eran dos problemas distintos encadenados.

- **Problema 1 — se mostraba cuando no debía**. Había un bloque `@media (hover: none)`
  que forzaba `opacity: 1` en las palabras laterales "porque en táctil no hay hover".
  Pero el diseño quiere lo contrario: en reposo sólo la etiqueta en blanco, y al
  activarla la etiqueta pasa a dorado y aparece la frase. Sustituido por un interruptor
  real: [`ServiceCard`](src/components/services/ServiceCard.tsx) lleva estado `isActive`
  que se alterna al tocar, y las reglas que lo pintan viven dentro de
  `@media (hover: none)` — así en escritorio la clase puede activarse pero no pinta nada
  y sigue mandando el `:hover`, sin tocar el comportamiento existente.
- **Problema 2 — el estado revelado era el menos legible de los dos**. Al hacer hover el
  velo se *aclaraba* del 32% al 16%, justo cuando aparece el texto blanco. Componiendo las
  imágenes reales con el velo y midiendo contra blanco:

  | velo | cocina | baño | salón |
  |---|---|---|---|
  | 0.16 (estado revelado, antes) | **2.64:1** | 3.07:1 | 3.85:1 |
  | 0.32 (reposo) | 3.84:1 | 4.40:1 | 5.39:1 |
  | 0.44 (estado revelado, ahora) | 5.24:1 | 5.91:1 | 7.05:1 |

  Hacía falta ≥0.40 para pasar el mínimo AA de 4.5:1. Ahora el velo **se oscurece** al
  revelar en vez de aclararse; la sensación de que la imagen "despierta" la siguen dando
  el zoom y la saturación, que no dependen del velo. Añadida además una `text-shadow` de
  dos capas (halo corto + difuso ancho) para las zonas más claras de cada foto.
  Esto afectaba también al hover de escritorio, no sólo a móvil.
- **Corregido de paso en [`ContactPage.tsx`](src/pages/ContactPage.tsx)**: quedaba un
  import de `Reveal` sin usar y un `.map()` que devolvía un fragmento corto `<>` sin `key`
  (emite dos hermanos `dt`+`dd` por vuelta, así que necesita `<Fragment key>`). Los dos
  `TS6133` bloqueaban la compilación.
- **Nota de verificación**: el dev server acumulaba 29 hojas de estilo por HMR y los
  `getComputedStyle` se contradecían entre lecturas — inservible para comprobar cascada.
  Verificado contra el CSS compilado (`npm run build`).

**2026-08-24 — Mosaico sin zoom+scroll; Reveal "up" más intenso**

Quitado el efecto de anclar-y-crecer (`usePinProgress`) de `MosaicGallery` (sección
`02 / Proyectos` de la landing): tras verlo en funcionamiento, se decidió que no encajaba
y que las animaciones de entrada básicas ya bastan.

- **`MosaicGallery.tsx` simplificado**: fuera `usePinProgress`, el estado `pinEnabled`
  (media query ≥900px), la medición de `targetScale` y el cálculo de `scale`/`growProgress`.
  Ya no hay dos ramas de render (`pinSection`/`stage` vs. sección normal) — siempre es la
  sección estática, con las mismas animaciones `Reveal variant="up"` y `once={false}`
  (reversibles al hacer scroll hacia arriba) que ya tenía cada tarjeta.
- **`MosaicGallery.module.css` limpiado**: eliminadas `.pinSection`/`.stage` (ya sin uso),
  el `z-index: 4` de `.featuredWrap` (existía solo para que la tarjeta creciendo tapara las
  columnas laterales) y el `transition: none` de `.featured` (existía para que el escalado
  por JS no fuera a remolque de una transición CSS).
- **`usePinProgress.ts` se mantiene** — lo sigue usando `Hero.tsx` para el zoom del canvas
  con la secuencia de fotogramas; ese efecto no se ha tocado.
- **`Reveal` variant `up` más intenso**: `translateY(28px)` → `translateY(38px)` (~36% más
  desplazamiento) en `Reveal.module.css`, a petición explícita — afecta a todo el sitio, no
  solo al mosaico.
- **Verificado**: sin `.pinSection`/`.stage` en el DOM a ningún ancho, sin errores de
  consola, `getComputedStyle` confirma `translateY(38px)` en el estado inicial de `.up`,
  `tsc -p tsconfig.app.json --noEmit` limpio.

**2026-08-24 — Reveal "up" ligado al scroll, calcado de la referencia**

La variante `up` deja de ser una transición CSS de duración fija disparada por
`IntersectionObserver` y pasa a ir ligada al scroll de forma continua y suavizada.
El punto de partida fue que la landing "no daba sensación de estar viva" pese a tener
`Reveal` en casi todo. Se analizó [siteassist.com](https://www.siteassist.com/) (la
referencia) inspeccionando sus instancias de GSAP ScrollTrigger en vivo.

**Lo que hace la referencia** (rejilla `industry-grid`, 8 tarjetas, valores literales):

```
startAt: { opacity: 0, y: "100%" }  ->  { opacity: 1, y: "0%" }
ease: "power1.out"   stagger: { amount: 0.2 }   duration: 0.5
ScrollTrigger: start "clamp(top bottom)", end "clamp(bottom bottom)", scrub: 0.8
```

Es decir: **mueve el 100% del alto de cada tarjeta** — mucho más que nosotros — y aun así
no se percibe brusco. Lo que lo hace legible no es la distancia, son otras tres cosas:

| | Referencia | Nuestro (antes) |
|---|---|---|
| Suavizado | `scrub: 0.8` (persigue con retardo) | 1:1 con la rueda |
| Curva | `power1.out` (frena al llegar) | lineal |
| Recorrido | toda la altura del grupo (~2 pantallas) | 0.45 pantallas |
| Escalonado | 0.2s repartidos entre 8 hermanos | `delay`×0.55px ≈ nada |

La conclusión es que el problema nunca fue el tamaño del desplazamiento (bajarlo al 22%
sólo lo mató del todo), sino que **iba clavado a la rueda, en línea recta y se agotaba en
la quinta parte inferior de la pantalla** — terminaba antes de que el ojo llegase a mirar.

- **`useScrollReveal` reescrito** ([`src/hooks/useScrollReveal.ts`](src/hooks/useScrollReveal.ts))
  como **ticker compartido**: un solo `requestAnimationFrame` y un solo
  `IntersectionObserver` para los ~40 `Reveal` de la página, en vez de uno por componente.
  Escribe el `transform`/`opacity` directamente en el nodo, sin pasar por estado de React
  — si no, serían 40 re-renders por fotograma. Lee todos los rects primero y escribe
  después, para no forzar un recálculo de layout por elemento. El bucle se detiene solo
  cuando no queda nada por asentar y el usuario no está scrolleando.
- **Suavizado (`LERP = 0.14`)**: cada fotograma el valor aplicado se acerca un 14% al que
  pide el scroll. Equivale al `scrub: 0.8` de la referencia — llega al 90% del objetivo en
  ~267ms y al 99% en ~517ms. Es el cambio que más aporta a la sensación de "vivo".
- **Curva `power1.out`** y **recorrido de 0.75 pantallas** (`END_VH = 0.25`): el movimiento
  sigue siendo perceptible hasta media pantalla en vez de terminar abajo del todo.
- **Desplazamiento proporcional y acotado**: 45% del alto del elemento, entre 28 y 110px.
  Un porcentaje puro (como el 100% de la referencia) es inconsistente con nuestro contenido
  mixto — movería un titular de una línea 30px y un bloque de 600px medio viewport. Así un
  texto corto se desplaza ~32px y una tarjeta grande 110px.
- **`delay` pasa a ser escalonado real**: se traduce en recorrido de scroll (700ms = el
  recorrido entero, tope 40%), no en `transition-delay`. Con los delays que ya usaba el
  mosaico (0/80/120/140/180ms) los hermanos llegan a separarse **48px entre sí** a mitad de
  entrada — que es justo lo que hace que una rejilla "entre en escena" en vez de aparecer
  en bloque.
- **Bug corregido de paso en `Reveal.tsx`**: la versión anterior hacía `return` de la rama
  `up` *antes* de llamar a `useInView`, dejando un hook en una rama condicional (viola las
  reglas de hooks). Ahora `Reveal` es un despachador sin hooks propios y cada rama es un
  componente aparte (`ScrollUpReveal` / `TransitionReveal`).
- **Limitación de verificación, no resuelta aquí**: el panel de previsualización de este
  entorno reporta `document.visibilityState === "hidden"` y **0 callbacks de `rAF` en
  600ms**, así que la animación no se puede ver ni capturar desde aquí (misma limitación ya
  documentada para el zoom del hero). Verificado en su lugar: `tsc` limpio, sin errores de
  consola, los 23 elementos `upScroll` de la landing registrados con su offset correcto y
  escalado por altura (h=71→32px, h=392→110px tope), sin conflicto entre el estilo que
  escribe el ticker y el que gestiona React, y la matemática de curva/escalonado/suavizado
  comprobada aparte en Node. **Pendiente de confirmación visual en local.**

**2026-08-20 — i18n ES/EN completo**

Auditoría de los 33 archivos `.tsx` del proyecto y traducción de todo el texto estático
a `src/i18n/locales/{es,en}.json`. Antes solo estaban en el sistema el menú, el pie y dos
frases del hero — el resto (formulario, las 6 páginas, los 20 componentes) estaba en
español fijo en el código.

- **`SERVICE_OPTIONS` rehecho como IDs estables** (`integral`, `cocina`, `bano`…) en vez de
  las etiquetas en español. Antes el texto mostrado, la clave del diccionario de iconos y
  el valor guardado en `CTAFormData.servicio` eran la misma cadena — traducir la etiqueta
  habría roto la selección. Ahora el ID es estable y la etiqueta sale de
  `ctaForm.services.<id>`.
- **El email interno siempre en español** (`buildMessageBody` en `types/ctaForm.ts`): lo
  lee el equipo de Arquelia, así que no depende del idioma en que el visitante rellenó el
  formulario — con una tabla `SERVICE_LABELS_ES` aparte de las etiquetas que ve el usuario.
- **`<title>`, meta description y Open Graph ahora cambian con el idioma** — no existía
  antes. Nuevo componente `DocumentMeta` (en `Layout`) que sincroniza `document.title`,
  las meta de descripción/OG y el `lang` del `<html>` cada vez que cambia `i18n.language`.
- **Bug corregido de paso**: dos `aria-label` en `ProjectCard`/`ProjectRow` estaban puestos
  en un `<span aria-hidden="true">` — contradictorio y sin efecto, porque `aria-hidden`
  hace que un lector de pantalla ignore todo el subárbol. Eliminados.
- **Bug corregido durante la verificación**: en la pantalla de confirmación del formulario,
  el español necesita un punto entre el servicio en negrita y la frase siguiente
  ("de cocina**. **Revisaremos…") pero el inglés no ("kitchen renovation** request.**",
  sin punto en medio). Tenía la puntuación fija en el JSX, igual para los dos idiomas, y
  en inglés salía "kitchen renovation. request." con un punto de más. Solución: la
  puntuación vive en el propio JSON de cada idioma (`textPost` empieza por ". " en
  español y por " request." en inglés), no en el componente.
- **Limitación conocida, no resuelta aquí**: los títulos, descripciones, ubicaciones y
  categorías de los proyectos vienen de Supabase (contenido del cliente) y se quedan en
  el idioma en que se escribieron en la base de datos — traducirlos requeriría guardar
  campos por idioma en el CMS, que es un cambio de esquema, no de i18n de interfaz.
- **Verificado**: cambio de idioma probado en las 8 rutas (incluidas las 3 legales) sin
  errores de consola; formulario completado de principio a fin en ambos idiomas con el
  cuerpo del email y el texto de confirmación correctos; `tsc` y `npm run build` limpios.

**2026-08-19 — Pasada responsive + formulario**

- **Zoom del hero también en móvil.** Se generan dos secuencias: `desktop` (16:9,
  61 fotogramas, 3,2 MB) y `mobile` (3:4 recortado al centro, 41 fotogramas, 1,6 MB).
  El recorte vertical es necesario: con la fuente 16:9 en pantalla vertical, un `cover`
  obligaba a ampliar ~4× y quedaba borroso; recortando al centro —justo hacia donde
  avanza la cámara— la ampliación baja a ~1,35×. El recorrido anclado se acorta a
  2,2 pantallas en móvil (el dedo avanza mucho menos que la rueda del ratón).
  `HeroCanvas` ahora lee `manifest.json`, así que regenerar imágenes no obliga a tocar código.
- **Formulario rehecho.** Pasos con chips numerados y marca de completado, barra de
  progreso, tarjetas de servicio con icono y avance automático al elegir, validación real
  de email y teléfono con mensajes y `aria-invalid`, resumen con botón "Editar" por campo,
  contador de caracteres, y confirmación con acciones. Los `input` van a 16px para evitar
  el zoom automático de iOS al enfocar.
- **Modal por plataforma**: pantalla completa en móvil, hoja centrada en tablet, panel
  lateral en escritorio. Con captura de foco (Tab circula dentro), cierre con Escape,
  bloqueo de scroll de fondo compensando la barra de desplazamiento, y `safe-area-inset`.
- **Bug corregido**: en tablet (768px) las tarjetas de Servicios desbordaban hasta 991px.
  Los elementos de grid no bajan de su ancho de contenido y la frase con `nowrap` los
  ensanchaba. Solución: `min-width: 0`, frase que puede fluir a varias líneas, y tres
  columnas sólo a partir de 900px.
- **Bug corregido**: la regla de tablet del mosaico no se aplicaba porque estaba escrita
  antes de la regla base. Una media query no añade especificidad: gana la última. Movida al
  final del archivo, con el porqué anotado.
- **Áreas táctiles**: selector de idioma y enlace de teléfono estaban en 26–27px de alto.
  Ampliados al mínimo cómodo de 44px sin alterar su aspecto.
- **Verificado**: sin desbordamiento horizontal en las 5 rutas a 375px y 768px; formulario
  probado entero en móvil incluyendo el caso de datos inválidos.

**2026-08-19 — Rediseño completo (F0→F6)**

Reconstrucción del diseño sobre una base nueva. Lo relevante:

- **Bug corregido**: las fuentes nunca llegaron a cargarse. `--font-display: 'Fraunces'`
  estaba declarado en los tokens, pero `index.html` no tenía ningún `<link>` a Google Fonts,
  así que toda la web caía a Georgia/system. Ahora carga Fraunces (display) + Inter (texto).
- **Bug corregido**: el titular del hero se animaba palabra a palabra dentro de `<span>`
  sin espacios reales, así que el DOM decía `Arquitecturaquesevive` — mal para lectores de
  pantalla, selección de texto y SEO. Ahora hay un título accesible completo y la versión
  animada va marcada `aria-hidden`.
- **Tokens rehechos**: nomenclatura coherente (`--sp-*`, `--fs-*`, `--t-*`), escala
  tipográfica fluida con `clamp()`, ritmo vertical de sección único (`--section-y`).
  Los estilos que aún usaban los nombres antiguos (formulario, modal) se reescribieron:
  estaban apuntando a variables inexistentes y renderizaban con valores por defecto.
- **Sistema de movimiento**: `<Reveal>` (5 variantes), `useInView`, `useScrollProgress`.
  Una sola curva de easing en todo el sitio y respeto a `prefers-reduced-motion`.
- **Componentes nuevos**: `Button`, `SectionHeader`, `PageHero`, `Marquee` (con variante
  compacta), `ServiceCard` (hover-reveal), `ProcessTimeline` (sangría creciente),
  `MosaicGallery`, `ServicesPreview` (previsualización que sigue al puntero), `CtaBand`.
- **Verificado**: `npm run build` sin errores; las 6 rutas cargan sin errores de consola;
  formulario probado de principio a fin (4 pasos → confirmación → cuerpo del email correcto);
  móvil 375px sin desbordamiento horizontal y menú funcionando.

## Notas técnicas

- **Supabase**: los servicios de datos (`src/lib/projects.ts`) están **cerrados y funcionando**.
  No se tocan. `company_id` y `item_type='construcciones-arquelia'` vía variables de entorno.
- **Efecto zoom-scroll del hero** — implementado en `HeroCanvas.tsx`:
  - Fuente: `design-refs/videos/00-hero-zoom-source.mp4` (3852×2148, 24 fps, 5,04 s, 121 fotogramas).
  - Regenerar la secuencia: `python design-refs/build_hero_frames.py`
    → `public/hero-frames/` (61 WebP de 1280×714 + `poster.webp` + `manifest.json`, ~3,2 MB).
  - Ajustes elegidos midiendo peso real: 1600/q82 daba 13,4 MB y 1440/q65 daba 4 MB;
    1280/q58 tomando 1 de cada 2 fotogramas baja a 3,2 MB sin pérdida visible tras el velo.
  - Carga: póster primero, luego 8 fotogramas en paralelo, el resto en segundo plano.
  - En móvil (<1024px), con `prefers-reduced-motion` o con ahorro de datos activo **no se
    descarga la secuencia**: se queda el póster como fondo estático.
  - El bloque mide 300svh y el interior es `sticky`, así que el hero queda anclado mientras
    la secuencia avanza; el titular se retira durante el primer 32 % del recorrido.
  - Si se cambia el número de fotogramas, actualizar `FRAME_COUNT` en `HeroCanvas.tsx`
    (el `manifest.json` está escrito pero aún no se lee: es la mejora pendiente obvia).
- **Limitación de verificación**: el panel de vista previa no composita fotogramas, así que
  las animaciones basadas en `IntersectionObserver`/`requestAnimationFrame` no se pueden
  comprobar visualmente desde aquí — se verifica el DOM/estilos y se prueba en navegador real.
