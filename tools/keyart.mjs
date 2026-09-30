// Renders the store art (thumbnail + banner) out of the game's own painters,
// so the key art is made of exactly the same pixels the game is.
// Usage: node tools/keyart.mjs [outDir]
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = process.argv[2] || path.join(root, 'art');
fs.mkdirSync(out, { recursive: true });
const exe = fs.readdirSync('/opt/pw-browsers').filter((d) => /^chromium-\d+$/.test(d)).map((d) => '/opt/pw-browsers/' + d + '/chrome-linux/chrome').find((p) => fs.existsSync(p));
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('file://' + root + '/index.html?scene=title');
await page.waitForTimeout(2500);

const render = (name, w, h, scale, fnName) => page.evaluate(({ w, h, scale, fnName }) => {
  const gfx = CH.gfx;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  gfx.pushTarget(ctx);
  try { window[fnName](ctx, w, h); } finally { gfx.popTarget(); }
  const big = document.createElement('canvas');
  big.width = w * scale; big.height = h * scale;
  const bc = big.getContext('2d');
  bc.imageSmoothingEnabled = false;
  bc.drawImage(c, 0, 0, big.width, big.height);
  return big.toDataURL('image/png');
}, { w, h, scale, fnName }).then((url) => {
  fs.writeFileSync(path.join(out, name), Buffer.from(url.split(',')[1], 'base64'));
  console.log('wrote', name, `${w * scale}x${h * scale}`);
});

await page.addScriptTag({ path: path.join(root, 'tools', 'keyart_paint.js') });
await render('thumbnail.png', 480, 480, 2, 'paintThumbnail');
await render('banner.png', 960, 300, 2, 'paintBanner');
// the animated thumbnail: one four-beat dance loop
{
  const { encodeGif } = await import('./gif.mjs');
  const N = 32, SW = 480, SC = 2, frames = [];
  for (let f = 0; f < N; f++) {
    const px = await page.evaluate(({ f, N, SW }) => {
      const c = document.createElement('canvas'); c.width = SW; c.height = SW;
      const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
      CH.gfx.pushTarget(ctx); try { window.paintThumbnail(ctx, SW, SW, f / N); } finally { CH.gfx.popTarget(); }
      return Array.from(ctx.getImageData(0, 0, SW, SW).data);
    }, { f, N, SW });
    const up = new Uint8Array(SW * SC * SW * SC * 4);
    for (let y = 0; y < SW * SC; y++) for (let x = 0; x < SW * SC; x++) { const si = (((y / SC) | 0) * SW + ((x / SC) | 0)) * 4, di = (y * SW * SC + x) * 4; up[di] = px[si]; up[di + 1] = px[si + 1]; up[di + 2] = px[si + 2]; up[di + 3] = 255; }
    frames.push(up);
  }
  const loop = 4 * 60 / 124;   // four beats at the dance tempo
  const buf = encodeGif(frames, SW * SC, SW * SC, { delay: Math.round((loop / N) * 100) });
  fs.writeFileSync(path.join(out, 'thumbnail.gif'), buf);
  console.log('wrote thumbnail.gif', `${SW * SC}x${SW * SC}`, Math.round(buf.length / 1024) + 'KB');
}
await browser.close();
