"""Genera las secuencias de fotogramas del hero a partir del vídeo fuente.

Salida en `public/hero-frames/` (estáticos, NO empaquetados por Vite):

    desktop/hero-0001.webp …   16:9, para pantallas anchas
    mobile/hero-0001.webp  …   3:4 recortado al centro, para móvil y tablet
    poster-desktop.webp
    poster-mobile.webp
    manifest.json              lo lee HeroCanvas para saber cuántos hay

El recorte vertical en móvil es necesario: la fuente es 16:9 y en una pantalla
en vertical un `cover` sobre 16:9 obligaría a ampliar ~4×, quedando borroso.
Recortando al centro (que es justo hacia donde avanza la cámara) la ampliación
baja a ~1,35× y se ve nítido.

Uso:  python design-refs/build_hero_frames.py
"""
import json
import os
import shutil

import cv2

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, "videos", "00-hero-zoom-source.mp4")
OUT = os.path.abspath(os.path.join(BASE, "..", "public", "hero-frames"))

# Ajustes elegidos midiendo peso real sobre este vídeo: tiene mucha vegetación
# y textura de piedra, así que comprime bastante peor que una escena limpia.
#
# `step=1` en las dos variantes a propósito: el vídeo fuente sólo tiene 121
# fotogramas (5,04s a 24fps), así que saltarse alguno (step=2/3, como estaba
# antes) se nota como el scrub más brusco/entrecortado. Ese consolidado a
# 121 fotogramas sin saltos es justo lo que se hizo en una sesión anterior
# — pero de paso se dejó de recortar/redimensionar por variante y ambas
# (incluido el móvil) acabaron sirviendo el mismo fotograma a 1920×1071.
# Aquí se recupera el ancho/alto por variante sin perder ningún fotograma:
# mismo número que antes, pero cada uno a su tamaño real en pantalla.
VARIANTS = {
    # nombre:   (ancho, alto, calidad, 1 de cada N fotogramas, recorte)
    "desktop": dict(width=1280, height=714, quality=58, step=1, crop=None),
    # crop = (aspecto objetivo) → recorte centrado antes de escalar
    "mobile": dict(width=880, height=1173, quality=56, step=1, crop=0.75),
}


def build(name: str, cfg: dict) -> dict:
    out_dir = os.path.join(OUT, name)
    os.makedirs(out_dir, exist_ok=True)

    cap = cv2.VideoCapture(SRC)
    src_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    src_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # Ventana de recorte centrada, si la variante lo pide
    if cfg["crop"]:
        crop_w = int(src_h * cfg["crop"])
        x0 = (src_w - crop_w) // 2
        x1 = x0 + crop_w
    else:
        x0, x1 = 0, src_w

    written = 0
    total_bytes = 0
    read_index = 0

    while True:
        ok, frame = cap.read()
        if not ok:
            break

        if read_index % cfg["step"] != 0:
            read_index += 1
            continue

        cropped = frame[:, x0:x1]
        resized = cv2.resize(
            cropped, (cfg["width"], cfg["height"]), interpolation=cv2.INTER_AREA
        )

        written += 1
        path = os.path.join(out_dir, f"hero-{written:04d}.webp")
        cv2.imwrite(path, resized, [cv2.IMWRITE_WEBP_QUALITY, cfg["quality"]])
        total_bytes += os.path.getsize(path)

        if read_index == 0:
            cv2.imwrite(
                os.path.join(OUT, f"poster-{name}.webp"),
                resized,
                [cv2.IMWRITE_WEBP_QUALITY, 80],
            )

        read_index += 1

    cap.release()

    mb = total_bytes / 1024 / 1024
    print(
        f"{name:>8}: {written:>3} fotogramas  "
        f"{cfg['width']}x{cfg['height']}  q{cfg['quality']}  "
        f"{mb:.2f} MB  ({total_bytes / written / 1024:.0f} KB/f)"
    )
    return {"count": written, "width": cfg["width"], "height": cfg["height"]}


if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT, exist_ok=True)

manifest = {name: build(name, cfg) for name, cfg in VARIANTS.items()}

with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
    json.dump(manifest, f, indent=2)
    f.write("\n")

print(f"\nruta: {OUT}")
