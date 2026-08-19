# Material de referencia — Arquelia

Todo el material visual de referencia está aquí para consulta rápida.
Para regenerar los fotogramas: `python design-refs/extract_frames.py`

## Vídeos (`design-refs/videos/`)

### `01-mosaic-gallery-architecture.mp4` (7s)
Recorrido de scroll con tres momentos:
- **0.0–1.5s** — Mapa de ubicación + lista de tiempos de desplazamiento (no aplicable a Arquelia).
- **1.5–3.5s** — **Galería mosaico**: imágenes de distintos tamaños en columnas desalineadas,
  se van revelando al hacer scroll. Una imagen central destaca sobre las demás.
- **4.5–7.0s** — **Sección oscura**: imagen a pantalla completa + marquesina gigante
  "ARCHITECTURE ▮ ARCHITECTURE" superpuesta + 4 tarjetas de datos flotando sobre la imagen
  en cuadrícula 2×2 escalonada (11 BUILDINGS / 6.4 ACRES / 5 ACRES / 672 RESIDENCES).
  Cada tarjeta: valor grande, subtítulo en color de acento, descripción corta.
  → **Aplicación**: sección de datos en detalle de proyecto (m², ubicación, categoría).

### `02-cards-hover-reveal.mp4` (4s)
Tres tarjetas de imagen (Residential / Commercial / Marine) con etiqueta centrada en píldora
blanca. Al hacer **hover**, aparece texto alrededor de la etiqueta formando una frase:
"FOR ⟨MARINE⟩ LIVING". Las tarjetas están a distintas alturas (escalonadas).
→ **Aplicación**: tarjetas de categoría en Servicios.

### `03-icons-process-list.mp4` (11s)
- **0–1s** — Cuadrícula de 15 tarjetas oscuras con **icono de línea + etiqueta**
  (Furniture, Kitchen, Bathroom, Lighting, Outdoor…). Bordes rectos, separadas por 1px.
- **1.5–8s** — **Lista de proceso numerada** (1–8): filas grandes en serif, la activa en blanco
  y el resto atenuadas, con **sangría creciente** (cada fila más a la derecha que la anterior).
  A la derecha aparece la descripción del paso activo, precedida de una línea de puntos.
→ **Aplicación**: grid de servicios + "Nuestro proceso".

### `04-extra.mp4` (21s)
Test responsive de reformasllobregat.com — página de **"¡Gracias! Hemos recibido tu solicitud"**
tras enviar el formulario, con botones "Volver al inicio" / "Ver proyectos".
→ **Aplicación**: pantalla de confirmación del formulario de contacto.

## Imágenes de referencia (adjuntas en conversación)

| Referencia | Contenido | Aplicación |
|---|---|---|
| LOCATION | Imagen a pantalla completa + marquesina de texto superpuesta | Hero de detalle de proyecto |
| Belgrade Arbor | Fondo verde sólido, titular serif grande, imágenes flotantes recortadas, botón píldora, paginación | Sobre Nosotros / CTA |
| Private Courtyard | Layout partido 50/50: texto sobre fondo sólido + imagen con flechas de carrusel y botón "View Gallery". Patrón de cuadros sutil de fondo | Filas de Proyectos |
| Sphera&Live | Secciones numeradas (01/ About us, 02/ Catalog, 03/ Steps), hero oscuro, tarjetas de proyecto, chips de pasos | Estructura general de la landing |

## Webs de referencia

- **https://www.siteassist.com/** — Header flotante. Barra `position: fixed`, ~21px del borde,
  centrada, ancho máx ~78%, fondo `rgba(0,0,0,0.5)`, `blur(17px)`, radio ~7px (rectángulo
  redondeado, NO cápsula), sombra `0 1px 4px rgba(0,0,0,0.08)`. **No cambia con el scroll.**
- **https://www.modusprojects.nl/** — Efecto hero zoom-scroll con `<canvas>` (confirmado por
  inspección del DOM: no usa `<video>`). Sección "Drie M's" (Meerwaarde / Momentum / Maximale
  zekerheid) → adaptado a "Maestría / Materiales / Método".
- **https://www.kronoshomes.com/es/** — Estética general.

## HTML de ejemplo

`src/assets/web_ejemplo.html` (4.2 MB, export de Tilda). Clases relevantes:
- `.btn-plus.js-sbs-anim-trigger_hover` — botón circular "+" que **rota 45°** al hover
  (`data-animate-sbs-opts` → `'ro':45, 'ti':300, 'ea':'easeInOut'`).
- `.tn-atom__sbs-anim-wrapper` — envoltorio de la animación paso a paso.

## Assets de imagen del proyecto (`src/assets/`)

| Archivo | Dimensiones | Ratio | Uso sugerido |
|---|---|---|---|
| `livingroom_kitchen.webp` | 2752×1536 | 1.79 | Hero landing / secciones panorámicas |
| `salon_01.avif` | 2070×1380 | 1.5 | Sección ancha |
| `cocina_abierta.avif` | 2070×1380 | 1.5 | Servicio cocina |
| `baño_03.avif` | 2070×1380 | 1.5 | Servicio baño |
| `cocina_01.jpg` | 1024×1536 | 0.67 | Tarjeta vertical |
| `pasillo_01.jpg` | 1200×1600 | 0.75 | Tarjeta vertical |
| `pasillo_02.jpg` | 1024×1536 | 0.67 | Tarjeta vertical |
| `aseo_01.jpg` | 1084×1451 | 0.75 | Tarjeta vertical |
| `aseo_02.jpg` | 736×1104 | 0.67 | Tarjeta vertical |
| `photo-1587527901949…avif` | 687×1031 | 0.67 | Tarjeta vertical |
| `livingroom_01.jpg` | 450×390 | 1.15 | Baja resolución — solo miniatura |

## Paleta

`#000814` `#001d3d` `#003566` `#d0ad00` `#f5cc00` → **descartados los azules**.
Paleta final: negros (`#060606`–`#171717`), grises neutros, blanco, dorado
(`#b8952e` / `#d4af37`).
