# Переводит логотип «Смотри.Красиво» с фото в вектор (logo.svg).
# Запуск: python3 bag-design/trace_logo.py <logo.jpg>
import sys, os
import numpy as np
import potrace
from PIL import Image, ImageFilter

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logo.svg")
UP = 4

im = Image.open(SRC).convert("L")
x0, y0, x1, y1 = 133, 398, 1129, 846  # область логотипа с полями
im = im.crop((x0, y0, x1, y1))
im = im.resize((im.width * UP, im.height * UP), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.6))
ink = np.array(im) < 105

bmp = potrace.Bitmap(~ink)  # potracer трассирует False-пиксели
path = bmp.trace(turdsize=40, turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY, alphamax=1.0, opticurve=True, opttolerance=0.2)

def f(v): return f"{v:.1f}"
d = []
for curve in path:
    s = curve.start_point
    d.append(f"M{f(s.x)} {f(s.y)}")
    for seg in curve.segments:
        if seg.is_corner:
            d.append(f"L{f(seg.c.x)} {f(seg.c.y)}L{f(seg.end_point.x)} {f(seg.end_point.y)}")
        else:
            d.append(f"C{f(seg.c1.x)} {f(seg.c1.y)} {f(seg.c2.x)} {f(seg.c2.y)} {f(seg.end_point.x)} {f(seg.end_point.y)}")
    d.append("Z")

w, h = ink.shape[1], ink.shape[0]
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><path fill="currentColor" fill-rule="evenodd" d="{"".join(d)}"/></svg>'
open(OUT, "w").write(svg)
print("ok", OUT, w, h, len(svg) // 1024, "KB")
