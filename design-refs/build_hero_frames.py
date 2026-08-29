"""Genera las secuencias de fotogramas del hero a partir de la secuencia
fuente ya renderizada (no un vídeo): 217 fotogramas a 24fps (~9s) entregados
como imágenes sueltas, más granular que el vídeo de origen anterior
(00-hero-zoom-source.mp4, 121 fotogramas / 5,04s) y por eso con un scrub
notablemente más suave a la misma velocidad de scroll — mismo recorrido de
cámara, casi el doble de fotogramas intermedios.

El primer y el último fotograma llegan como PNG sin comprimir a resolución
nativa (3852×2148), muy por encima del resto de la secuencia (webp a
2560×1428) — el cliente los sustituyó aparte para que esos dos, que son los
que más tiempo se ven fijos, salieran más nítidos. El resto de fotogramas
NO tiene por qué compartir esa resolución, así que la ventana de recorte se
calcula por fotograma (ver `crop_window`), no una sola vez al principio.

Salida en `public/hero-frames/` (estáticos, NO empaquetados por Vite):

    desktop/hero-0001.webp …   16:9, para pantallas anchas
    mobile/hero-0001.webp  …   3:4 recortado al centro, para móvil y tablet
    poster-desktop.webp
    poster-mobile.webp
    manifest.json              lo lee HeroCanvas para saber cuántos hay

El recorte vertical en móvil es necesario: la fuente es ~16:9 y en una
pantalla en vertical un `cover` sobre 16:9 obligaría a ampliar ~4×, quedando
borroso. Recortando al centro (que es justo hacia donde avanza la cámara) la
ampliación baja a ~1,35× y se ve nítido.

Uso:  python design-refs/build_hero_frames.py
"""
import json
import os
import shutil

import cv2

BASE = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(BASE, "frames", "09-hero-zoom-9s")
OUT = os.path.abspath(os.path.join(BASE, "..", "public", "hero-frames"))

# Ajustes elegidos midiendo peso real sobre esta secuencia: tiene mucha
# vegetación y textura de piedra, así que comprime bastante peor que una
# escena limpia.
#
# `step=1` en las dos variantes a propósito: saltarse algún fotograma
# (step=2/3) se nota como scrub más brusco/entrecortado, que es justo la
# queja que motivó pasar a esta secuencia de 217 fotogramas en primer lugar.
#
# `boost_scale`: cuánto más grande, como múltiplo del tamaño normal de la
# variante, puede salir un fotograma "boosteado" (ver BOOST_FRAMES) — nunca
# se aplica de verdad si el fotograma de origen no da para tanto sin
# ampliar (ver `resolve_boost_size`), así que es un techo, no un tamaño fijo.
VARIANTS = {
    # nombre:   (ancho, alto, calidad, 1 de cada N fotogramas, recorte, techo boost)
    "desktop": dict(width=1280, height=714, quality=58, step=1, crop=None, boost_scale=2),
    # crop = (aspecto objetivo) → recorte centrado antes de escalar
    "mobile": dict(width=880, height=1173, quality=56, step=1, crop=0.75, boost_scale=2),
}

# El primero y el último fotograma se ven fijos más tiempo que el resto: el
# primero mientras el usuario todavía no ha hecho scroll (y además sustituye
# al póster, que va a q80 — sin este boost, el remate era una foto más nítida
# reemplazada por otra peor en cuanto arranca la secuencia) y el último
# cuando el zoom termina y el pin se suelta, justo antes de la siguiente
# sección. Con sólo estos dos de 217 el coste en peso total es insignificante
# incluso a mayor resolución.
BOOST_QUALITY = 90
BOOST_FRAMES = {1, "last"}


def source_files() -> list[str]:
    names = sorted(
        f for f in os.listdir(SRC_DIR) if f.lower().endswith((".webp", ".png", ".jpg", ".jpeg"))
    )
    if not names:
        raise SystemExit(f"No hay fotogramas en {SRC_DIR}")
    return [os.path.join(SRC_DIR, n) for n in names]


def crop_window(frame_w: int, frame_h: int, crop_aspect: float | None) -> tuple[int, int]:
    if not crop_aspect:
        return 0, frame_w
    crop_w = int(frame_h * crop_aspect)
    x0 = (frame_w - crop_w) // 2
    return x0, x0 + crop_w


def resolve_size(cfg: dict, cropped_w: int, cropped_h: int, boosted: bool) -> tuple[int, int]:
    """Tamaño de salida normal, o el mayor posible hasta `boost_scale` veces
    ese tamaño sin llegar nunca a ampliar (interpolar) el fotograma de origen."""
    if not boosted:
        return cfg["width"], cfg["height"]
    cap = min(cropped_w / cfg["width"], cropped_h / cfg["height"], cfg["boost_scale"])
    return round(cfg["width"] * cap), round(cfg["height"] * cap)


def process(src_path: str, cfg: dict, boosted: bool):
    frame = cv2.imread(src_path)
    fh, fw = frame.shape[:2]
    x0, x1 = crop_window(fw, fh, cfg["crop"])
    cropped = frame[:, x0:x1]
    w, h = resolve_size(cfg, x1 - x0, fh, boosted)
    return cv2.resize(cropped, (w, h), interpolation=cv2.INTER_AREA)


def build(name: str, cfg: dict, files: list[str]) -> dict:
    out_dir = os.path.join(OUT, name)
    os.makedirs(out_dir, exist_ok=True)

    written = 0
    total_bytes = 0
    last_path = None

    for read_index, src_path in enumerate(files):
        if read_index % cfg["step"] != 0:
            continue

        written += 1
        is_boost = written in BOOST_FRAMES
        resized = process(src_path, cfg, is_boost)

        path = os.path.join(out_dir, f"hero-{written:04d}.webp")
        quality = BOOST_QUALITY if is_boost else cfg["quality"]
        cv2.imwrite(path, resized, [cv2.IMWRITE_WEBP_QUALITY, quality])
        total_bytes += os.path.getsize(path)
        last_path = (path, src_path)

        if read_index == 0:
            # El póster es lo primero que se pinta, antes de que llegue nada
            # de la secuencia (bloquea el primer renderizado del hero) — a
            # propósito NO hereda el tamaño boosteado del fotograma 1 aunque
            # venga del mismo archivo de origen: eso dejaría el activo más
            # crítico de toda la página más pesado que antes, justo lo
            # contrario de lo que se pidió al preguntar por la velocidad de
            # la primera visita.
            poster = process(src_path, cfg, boosted=False)
            cv2.imwrite(
                os.path.join(OUT, f"poster-{name}.webp"),
                poster,
                [cv2.IMWRITE_WEBP_QUALITY, 80],
            )

    # El último fotograma no se sabe cuál es hasta acabar la lista: si tocaba
    # boost, se reprocesa desde su original (no desde el ya reducido) para
    # que también aproveche la resolución mayor, no sólo la mejor calidad.
    if "last" in BOOST_FRAMES and last_path is not None:
        path, src_path = last_path
        total_bytes -= os.path.getsize(path)
        resized = process(src_path, cfg, boosted=True)
        cv2.imwrite(path, resized, [cv2.IMWRITE_WEBP_QUALITY, BOOST_QUALITY])
        total_bytes += os.path.getsize(path)

    mb = total_bytes / 1024 / 1024
    print(
        f"{name:>8}: {written:>3} fotogramas  "
        f"{cfg['width']}x{cfg['height']} (boost hasta x{cfg['boost_scale']})  q{cfg['quality']}  "
        f"{mb:.2f} MB  ({total_bytes / written / 1024:.0f} KB/f)"
    )
    return {"count": written, "width": cfg["width"], "height": cfg["height"]}


files = source_files()

if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT, exist_ok=True)

manifest = {name: build(name, cfg, files) for name, cfg in VARIANTS.items()}

with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)
    f.write("\n")

print(f"\nruta: {OUT}")
