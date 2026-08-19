# ROADMAP — Web Arquelia

> Estado: **F0–F6 completadas · F7 pendiente**
> Última actualización: 2026-08-19
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
- [x] Hero — imagen + titular, preparado para sustituir por canvas de frames (zoom-scroll)
- [x] `01 / Sobre nosotros` — texto + enlace
- [x] Galería mosaico con revelado escalonado y escala por scroll (ref. vídeo 01)
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
| Secuencia de 80–90 frames WebP 1600×900 para el zoom-scroll del hero | Diseñador | Hero definitivo de la landing |
| Logo de Arquelia | Cliente | Header y footer (ahora es texto) |
| Fotos reales de obra | Cliente | Sustituir imágenes de stock |
| Datos reales: teléfono, dirección, CIF, horario | Cliente | Contacto y páginas legales |
| Cifras reales (años, nº de proyectos) | Cliente | Franja de datos de la landing |

## Registro de trabajo

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
- **Efecto zoom-scroll**: se implementará con `<canvas>` + secuencia de frames, igual que
  modusprojects.nl (verificado por inspección de su DOM). El componente `HeroCanvas` ya deja
  el hueco preparado: hoy pinta una imagen fija, mañana la secuencia.
- **Limitación de verificación**: el panel de vista previa no composita fotogramas, así que
  las animaciones basadas en `IntersectionObserver`/`requestAnimationFrame` no se pueden
  comprobar visualmente desde aquí — se verifica el DOM/estilos y se prueba en navegador real.
