"""Genera las secuencias de fotogramas del hero a partir de la secuencia
fuente ya renderizada (no un vídeo): 217 fotogramas a 24fps (~9s) entregados
como .webp sueltos, más granular que el vídeo de origen anterior
(00-hero-zoom-source.mp4, 121 fotogramas / 5,04s) y por eso con un scrub
notablemente más suave a la misma velocidad de scroll — mismo recorrido de
cámara, casi el doble de fotogramas intermedios.

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
VARIANTS = {
    # nombre:   (ancho, alto, calidad, 1 de cada N fotogramas, recorte)
    "desktop": dict(width=1280, height=714, quality=58, step=1, crop=None),
    # crop = (aspecto objetivo) → recorte centrado antes de escalar
    "mobile": dict(width=880, height=1173, quality=56, step=1, crop=0.75),
}

# El primero y el último fotograma se ven fijos más tiempo que el resto: el
# primero mientras el usuario todavía no ha hecho scroll (y además sustituye
# al póster, que va a q80 — sin este boost, el remate era una foto más nítida
# reemplazada por otra peor en cuanto arranca la secuencia) y el último
# cuando el zoom termina y el pin se suelta, justo antes de la siguiente
# sección. Con sólo estos dos de 217 el coste en peso total es insignificante.
BOOST_QUALITY = 88
BOOST_FRAMES = {1, "last"}


def source_files() -> list[str]:
    names = sorted(
        f for f in os.listdir(SRC_DIR) if f.lower().endswith((".webp", ".png", ".jpg", ".jpeg"))
    )
    if not names:
        raise SystemExit(f"No hay fotogramas en {SRC_DIR}")
    return [os.path.join(SRC_DIR, n) for n in names]


def build(name: str, cfg: dict, files: list[str]) -> dict:
    out_dir = os.path.join(OUT, name)
    os.makedirs(out_dir, exist_ok=True)

    first = cv2.imread(files[0])
    src_h, src_w = first.shape[:2]

    # Ventana de recorte centrada, si la variante lo pide
    if cfg["crop"]:
        crop_w = int(src_h * cfg["crop"])
        x0 = (src_w - crop_w) // 2
        x1 = x0 + crop_w
    else:
        x0, x1 = 0, src_w

    written = 0
    total_bytes = 0
    last_path, last_resized = None, None

    for read_index, src_path in enumerate(files):
        if read_index % cfg["step"] != 0:
            continue

        frame = cv2.imread(src_path)
        cropped = frame[:, x0:x1]
        resized = cv2.resize(
            cropped, (cfg["width"], cfg["height"]), interpolation=cv2.INTER_AREA
        )

        written += 1
        path = os.path.join(out_dir, f"hero-{written:04d}.webp")
        # El último no se sabe hasta el final de la lista, así que aquí se
        # escribe con la calidad normal y se re-escribe al final si tocaba.
        quality = BOOST_QUALITY if written in BOOST_FRAMES else cfg["quality"]
        cv2.imwrite(path, resized, [cv2.IMWRITE_WEBP_QUALITY, quality])
        total_bytes += os.path.getsize(path)
        last_path, last_resized = path, resized

        if read_index == 0:
            cv2.imwrite(
                os.path.join(OUT, f"poster-{name}.webp"),
                resized,
                [cv2.IMWRITE_WEBP_QUALITY, 80],
            )

    if "last" in BOOST_FRAMES and last_path is not None:
        total_bytes -= os.path.getsize(last_path)
        cv2.imwrite(last_path, last_resized, [cv2.IMWRITE_WEBP_QUALITY, BOOST_QUALITY])
        total_bytes += os.path.getsize(last_path)

    mb = total_bytes / 1024 / 1024
    print(
        f"{name:>8}: {written:>3} fotogramas  "
        f"{cfg['width']}x{cfg['height']}  q{cfg['quality']}  "
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
