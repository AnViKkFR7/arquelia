"""Genera la secuencia de fotogramas del hero a partir del vídeo fuente.

Salida: public/hero-frames/hero-0001.webp … (servidos como estáticos, NO
empaquetados por Vite) + un póster que se usa como primer pintado y como
fondo en móvil.

Uso:  python design-refs/build_hero_frames.py
"""
import os
import shutil

import cv2

BASE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BASE, "videos", "00-hero-zoom-source.mp4")
OUT = os.path.abspath(os.path.join(BASE, "..", "public", "hero-frames"))

# Ajustes elegidos midiendo peso real sobre este vídeo (mucha vegetación y
# textura ⇒ comprime peor que una escena limpia). 1440/q65 tomando 1 de cada 2
# fotogramas da ~61 imágenes y ~2,7 MB: fluido al hacer scrub y razonable de
# descargar. La secuencia va detrás de un velo oscuro con texto encima, así que
# no necesita calidad de impresión.
WIDTH = 1280          # ancho de salida; el alto se deriva del ratio original
QUALITY = 58          # calidad WebP (0-100)
STEP = 2              # toma 1 de cada N fotogramas del vídeo
POSTER_INDEX = 0      # fotograma usado como póster

if os.path.isdir(OUT):
    shutil.rmtree(OUT)
os.makedirs(OUT, exist_ok=True)

cap = cv2.VideoCapture(SRC)
fps = cap.get(cv2.CAP_PROP_FPS)
total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
src_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
src_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
height = round(WIDTH * src_h / src_w)

print(f"origen : {src_w}x{src_h}  {fps:.0f}fps  {total} fotogramas")
print(f"salida : {WIDTH}x{height}  webp q{QUALITY}")

written = 0
bytes_total = 0
read_index = 0

while True:
    ok, frame = cap.read()
    if not ok:
        break

    if read_index % STEP != 0:
        read_index += 1
        continue

    resized = cv2.resize(frame, (WIDTH, height), interpolation=cv2.INTER_AREA)
    written += 1
    path = os.path.join(OUT, f"hero-{written:04d}.webp")
    cv2.imwrite(path, resized, [cv2.IMWRITE_WEBP_QUALITY, QUALITY])
    bytes_total += os.path.getsize(path)

    if read_index == POSTER_INDEX:
        cv2.imwrite(
            os.path.join(OUT, "poster.webp"),
            resized,
            [cv2.IMWRITE_WEBP_QUALITY, 86],
        )

    read_index += 1

cap.release()

# El componente necesita saber cuántos fotogramas hay.
with open(os.path.join(OUT, "manifest.json"), "w", encoding="utf-8") as f:
    f.write(f'{{"count": {written}, "width": {WIDTH}, "height": {height}}}\n')

print(f"escritos: {written} fotogramas")
print(f"peso    : {bytes_total / 1024 / 1024:.2f} MB  ({bytes_total / written / 1024:.0f} KB/fotograma)")
print(f"ruta    : {OUT}")
