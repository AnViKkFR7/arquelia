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

**2026-08-24 — Contraste de las tarjetas de servicios en táctil**

En móvil las palabras laterales de las tarjetas de `/servicios` ("REFORMAS DE … A MEDIDA")
eran prácticamente ilegibles sobre las imágenes claras.

- **Causa**: en `(hover: none)` la frase se muestra siempre, pero el velo se quedaba en su
  valor de reposo (32%). En escritorio eso no molesta porque las palabras sólo aparecen
  en hover, y el hover aclara la imagen a la vez que las muestra; en táctil no se llega
  nunca a ese estado, así que el velo en reposo tiene que cargar él solo con todo el
  contraste. La etiqueta central nunca sufrió porque lleva fondo blanco sólido.
- **Medido** en [`ServiceCard.module.css`](src/components/services/ServiceCard.module.css)
  componiendo la imagen real con el velo y comparando contra el texto blanco:

  | tarjeta | antes | ahora |
  |---|---|---|
  | cocina_abierta | 3.84:1 | 6.53:1 |
  | baño_03 | 4.40:1 | 7.27:1 |
  | salon_01 | 5.39:1 | 8.48:1 |

  La cocina estaba por debajo del mínimo AA (4.5:1) — y eso es la media de la banda: sobre
  la encimera blanca el caso real era peor.
- **Solución**: sólo dentro de `@media (hover: none)`, velo al 52% y `text-shadow` reforzada
  (0.75 / 10px). El escritorio no se toca: velo 0.32 en reposo y 0.16 en hover, igual que antes.
- **Nota de verificación**: el dev server acumulaba 29 hojas de estilo por HMR y los
  `getComputedStyle` se contradecían entre lecturas. Se verificó contra el CSS compilado
  (`npm run build`), donde aparecen las tres reglas en el orden correcto.

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
