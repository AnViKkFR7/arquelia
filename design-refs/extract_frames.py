"""Extrae fotogramas de los vídeos de referencia para consulta rápida.
Uso: python design-refs/extract_frames.py
"""
import cv2
import os

BASE = os.path.dirname(os.path.abspath(__file__))
VID_DIR = os.path.join(BASE, "videos")
OUT_DIR = os.path.join(BASE, "frames")

INTERVAL = 0.5  # segundos entre fotogramas

os.makedirs(OUT_DIR, exist_ok=True)

for fname in sorted(os.listdir(VID_DIR)):
    if not fname.endswith(".mp4"):
        continue
    slug = fname.replace(".mp4", "")
    cap = cv2.VideoCapture(os.path.join(VID_DIR, fname))
    fps = cap.get(cv2.CAP_PROP_FPS)
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration = total / fps if fps else 0
    print(f"{fname}: {fps:.0f}fps {duration:.1f}s")

    t = 0.0
    while t <= duration:
        cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
        ok, frame = cap.read()
        if ok:
            h, w = frame.shape[:2]
            scale = 900 / w
            frame = cv2.resize(frame, (900, int(h * scale)))
            cv2.imwrite(
                f"{OUT_DIR}/{slug}__{t:05.1f}s.jpg",
                frame,
                [cv2.IMWRITE_JPEG_QUALITY, 80],
            )
        t += INTERVAL
    cap.release()
print("done")
