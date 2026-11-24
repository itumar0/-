// Чертежи пакета «Смотри красиво» в стиле образца (контур, ручка, размеры).
// Запуск: node bag-design/drawings.js <папка_со_шрифтами>
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const FONTS = path.resolve(process.argv[2]);
const font = (f) => 'data:font/ttf;base64,' + fs.readFileSync(path.join(FONTS, f)).toString('base64');
const SIZES = [{ w: 40, h: 30 }, { w: 50, h: 40 }];
const BAG_W = 900; // ширина пакета на чертеже, px

const IG = `<svg viewBox="0 0 24 24" fill="none" stroke="#111" stroke-width="2"><rect x="2.5" y="2.5" width="19" height="19" rx="5.5"/><circle cx="12" cy="12" r="4.3"/><circle cx="17.6" cy="6.4" r="1.1" fill="#111" stroke="none"/></svg>`;

function html({ w, h }) {
  const s = BAG_W / w, bw = BAG_W, bh = Math.round(h * s);
  const k = 1; // логотип одинаковый относительно ширины
  const PADX = 175, TOP = 230, BOTTOM = 190;
  const W = bw + PADX * 2, H = bh + TOP + BOTTOM;
  const hx = W / 2, hw = 220, hh = 170; // ручка
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:C;src:url(${font('CormorantGaramond%5Bwght%5D.ttf')});font-weight:300 700}
@font-face{font-family:C;font-style:italic;src:url(${font('CormorantGaramond-Italic%5Bwght%5D.ttf')});font-weight:300 700}
*{margin:0;padding:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;background:#fff;position:relative;font-family:"Liberation Sans",Arial,sans-serif;color:#111}
svg.lines{position:absolute;inset:0}
.bag{position:absolute;left:${PADX}px;top:${TOP}px;width:${bw}px;height:${bh}px}
.logo{position:absolute;left:0;right:0;top:44%;transform:translateY(-50%);text-align:center;font-family:C;color:#111}
.big{font-weight:700;font-size:${104 * k}px;letter-spacing:${26 * k}px;margin-right:-${26 * k}px;line-height:1}
.it{font-style:italic;font-weight:500;font-size:${62 * k}px;line-height:1;margin-top:4px}
.rule{display:flex;align-items:center;justify-content:center;gap:22px;margin-top:18px}
.rule i{display:block;width:150px;height:2px;background:#111}
.rule b{display:block;width:10px;height:10px;background:#111;transform:rotate(45deg)}
.contacts{position:absolute;left:0;right:0;bottom:${Math.round(bh * 0.08)}px;display:flex;justify-content:center;align-items:center;gap:12px;font-size:27px;letter-spacing:.5px}
.contacts svg{width:38px;height:38px}
.dim{position:absolute;font-size:96px;line-height:1}
.dw{left:0;right:0;top:${TOP + bh + 30}px;text-align:center}
.dh{left:${PADX - 40}px;top:${TOP + bh / 2}px;transform:translate(-50%,-50%) rotate(-90deg);white-space:nowrap}
</style></head><body>
<svg class="lines" width="${W}" height="${H}">
  <path d="M ${hx - hw / 2} ${TOP + 2} C ${hx - hw / 2} ${TOP - hh * 1.25}, ${hx + hw / 2} ${TOP - hh * 1.25}, ${hx + hw / 2} ${TOP + 2}" fill="none" stroke="#111" stroke-width="15"/>
  <path d="M ${hx - hw / 2} ${TOP + 2} C ${hx - hw / 2} ${TOP - hh * 1.25}, ${hx + hw / 2} ${TOP - hh * 1.25}, ${hx + hw / 2} ${TOP + 2}" fill="none" stroke="#fff" stroke-width="10"/>
  <rect x="${PADX}" y="${TOP}" width="${bw}" height="${bh}" fill="#fff" stroke="#111" stroke-width="3"/>
</svg>
<div class="bag">
  <div class="logo"><div class="big">СМОТРИ</div><div class="it">красиво</div><div class="rule"><i></i><b></b><i></i></div></div>
  <div class="contacts">${IG}<span>smotrii.krasivo</span></div>
</div>
<div class="dim dw">${w}cm</div>
<div class="dim dh">${h}cm</div>
</body></html>`;
}

(async () => {
  const b = await chromium.launch();
  for (const s of SIZES) {
    const p = await b.newPage({ viewport: { width: 1250, height: 1250 }, deviceScaleFactor: 2 });
    await p.setContent(html(s), { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    const dim = await p.evaluate(() => [document.body.scrollWidth, document.body.scrollHeight]);
    await p.setViewportSize({ width: dim[0], height: dim[1] });
    const name = `chertezh_${s.w}x${s.h}`;
    await p.screenshot({ path: path.join(__dirname, `${name}.png`) });
    await p.pdf({ path: path.join(__dirname, `${name}.pdf`), width: `${dim[0]}px`, height: `${dim[1]}px`, printBackground: true });
    console.log('ok', name, dim);
  }
  await b.close();
})();
