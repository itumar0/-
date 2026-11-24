// Генерирует печатные макеты пакета «Смотри красиво» в двух размерах.
// Запуск: node bag-design/sizes.js <папка_со_шрифтами>
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const FONTS = path.resolve(process.argv[2]);
const OUT = __dirname;
const BLEED = 3; // мм
const SIZES = [
  { w: 400, h: 300 },
  { w: 500, h: 400 },
];

const LOGO = fs.readFileSync(path.join(__dirname, 'logo.svg'), 'utf8');
const font = (f) => 'data:font/ttf;base64,' + fs.readFileSync(path.join(FONTS, f)).toString('base64');

function html({ w, h }, guides) {
  const W = w + 2 * BLEED, H = h + 2 * BLEED;
  const k = w / 400; // логотип масштабируется по ширине пакета
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:C;src:url(${font('CormorantGaramond%5Bwght%5D.ttf')});font-weight:300 700}
@font-face{font-family:C;font-style:italic;src:url(${font('CormorantGaramond-Italic%5Bwght%5D.ttf')});font-weight:300 700}
@page{size:${W}mm ${H}mm;margin:0}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${W}mm;height:${H}mm;background:#3e1930}
.sheet{position:relative;width:${W}mm;height:${H}mm;background:#3e1930;overflow:hidden}
.logo{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;color:#d9b97c;font-family:C;width:${w*0.6}mm}
.big{font-weight:500;font-size:${29.6 * k}mm;letter-spacing:${6.4 * k}mm;margin-right:-${6.4 * k}mm;line-height:1}
.it{font-style:italic;font-weight:400;font-size:${18.4 * k}mm;line-height:1;margin-top:${-1 * k}mm}
.rule{display:flex;align-items:center;justify-content:center;gap:${7 * k}mm;margin-top:${4 * k}mm}
.rule i{display:block;width:${51 * k}mm;height:${0.8 * k}mm;background:#d9b97c}
.rule b{display:block;width:${3.4 * k}mm;height:${3.4 * k}mm;background:#d9b97c;transform:rotate(45deg)}
.small{font-weight:500;font-size:${8 * k}mm;letter-spacing:${2.8 * k}mm;margin-right:-${2.8 * k}mm;margin-top:${5 * k}mm}
.trim{position:absolute;left:${BLEED}mm;top:${BLEED}mm;width:${w}mm;height:${h}mm;outline:0.3mm dashed #ff4d8d}
.lbl{position:absolute;left:${BLEED + 4}mm;top:${BLEED + 4}mm;font:600 ${6 * k}mm sans-serif;color:#ff4d8d}
.logo svg{display:block;width:100%;height:auto}
</style></head><body><div class="sheet">
<div class="logo">${LOGO}</div>
${guides ? `<div class="trim"></div><div class="lbl">${w / 10}×${h / 10} см · пунктир = линия реза, вылет ${BLEED} мм</div>` : ''}
</div></body></html>`;
}

(async () => {
  const b = await chromium.launch();
  for (const s of SIZES) {
    const name = `paket_${s.w / 10}x${s.h / 10}`;
    const p = await b.newPage();
    await p.setContent(html(s, false), { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.pdf({ path: path.join(OUT, `${name}_print.pdf`), width: `${s.w + 2 * BLEED}mm`, height: `${s.h + 2 * BLEED}mm`, printBackground: true });
    // превью с линией реза
    const pxW = Math.round(((s.w + 2 * BLEED) / 25.4) * 96), pxH = Math.round(((s.h + 2 * BLEED) / 25.4) * 96);
    const v = await b.newPage({ viewport: { width: pxW, height: pxH }, deviceScaleFactor: 1 });
    await v.setContent(html(s, true), { waitUntil: 'load' });
    await v.evaluate(() => document.fonts.ready);
    await v.screenshot({ path: path.join(OUT, `${name}_preview.png`) });
    console.log('ok', name);
  }
  await b.close();
})();
