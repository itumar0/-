import sys, cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

SP = "/tmp/claude-0/-home-user--/4c614a29-289b-50b8-8695-578a8b658138/scratchpad"
SRC = "/root/.claude/uploads/4c614a29-289b-50b8-8695-578a8b658138/191da6c3-image.jpg"
OUT = sys.argv[1]
FONT = f"{SP}/fonts/CormorantGaramond%5Bwght%5D.ttf"
FONT_I = f"{SP}/fonts/CormorantGaramond-Italic%5Bwght%5D.ttf"

def font(path, size, wght):
    f = ImageFont.truetype(path, size)
    try: f.set_variation_by_axes([wght])
    except Exception: pass
    return f

# ---- 1. remove "SAMPLE" ----
img = cv2.imread(SRC)
x0, y0, x1, y1 = 430, 520, 600, 620
roi = img[y0:y1, x0:x1].astype(int)
mask = np.zeros(img.shape[:2], np.uint8)
m = ((roi[:, :, 2] - 75) + (roi[:, :, 1] - 35) > 25).astype(np.uint8) * 255
mask[y0:y1, x0:x1] = m
mask = cv2.dilate(mask, np.ones((7, 7), np.uint8), 2)
clean = cv2.inpaint(img, mask, 9, cv2.INPAINT_TELEA)
# soften inpaint area with blurred matte to keep paper texture uniform
blur = cv2.GaussianBlur(clean, (0, 0), 6)
soft = cv2.GaussianBlur(mask, (0, 0), 6).astype(float)[..., None] / 255
clean = (clean * (1 - soft) + blur * soft).astype(np.uint8)
base = Image.fromarray(cv2.cvtColor(clean, cv2.COLOR_BGR2RGB)).convert("RGBA")

# ---- 2. flat logo artwork (front panel, 1000 x 820 units) ----
W, H = 1000, 820
art = Image.new("L", (W, H), 0)
logo = Image.open(f"{SP}/logo_mask.png").convert("L")
lw = int(W * 0.62); lh = int(logo.height * lw / logo.width)
art.paste(logo.resize((lw, lh), Image.LANCZOS), ((W - lw) // 2, (H - lh) // 2 - 20))

# ---- 3. warp onto the bag's front face ----
quad = np.float32([[276, 258], [803, 400], [776, 912], [262, 700]])
flat = np.float32([[0, 0], [W, 0], [W, H], [0, H]])
Hm = cv2.getPerspectiveTransform(flat, quad)
big = 3  # supersample for clean edges
S = np.diag([big, big, 1]).astype(np.float64)
a = cv2.warpPerspective(np.array(art), S @ Hm, (base.width * big, base.height * big), flags=cv2.INTER_CUBIC)
alpha = Image.fromarray(a).resize(base.size, Image.LANCZOS)

# gold foil: diagonal gradient + slight sheen
w, h = base.size
yy, xx = np.mgrid[0:h, 0:w]
t = ((xx - 430) * 0.6 + (yy - 500)) / 220.0
t = np.clip(t, 0, 1)
c1, c2, c3 = np.array([214, 178, 112]), np.array([243, 216, 156]), np.array([176, 134, 72])
mid = 0.45
g = np.where(t[..., None] < mid,
             c1 + (c2 - c1) * (t[..., None] / mid),
             c2 + (c3 - c2) * ((t[..., None] - mid) / (1 - mid)))
gold = Image.fromarray(g.astype(np.uint8)).convert("RGBA")
gold.putalpha(alpha.point(lambda v: int(v * 0.96)))

# subtle deboss shadow under foil
sh = Image.new("RGBA", base.size, (20, 5, 15, 0))
sh.putalpha(alpha.filter(ImageFilter.GaussianBlur(1.2)).point(lambda v: int(v * 0.45)))
out = base.copy()
out.alpha_composite(sh, (1, 1))
out.alpha_composite(gold)
out.convert("RGB").save(OUT, quality=95)

# flat print layout too
fl = Image.new("RGB", (W, H), (62, 25, 48))
fl.paste(Image.new("RGB", (W, H), (222, 188, 125)), mask=art)
fl.save(OUT.replace(".jpg", "_flat.png"))
print("done")
