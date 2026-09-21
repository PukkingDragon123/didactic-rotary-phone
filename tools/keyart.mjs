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
await browser.close();
