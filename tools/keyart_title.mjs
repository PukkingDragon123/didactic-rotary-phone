// Store art from the title screen itself: the night shot, rendered by the game
// with the shader on, a still camera and no menu, cropped at a whole 4x scale.
// Usage: node tools/keyart_title.mjs [outDir]
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = process.argv[2] || path.join(root, 'art');
const exe = fs.readdirSync('/opt/pw-browsers').filter((d) => /^chromium-\d+$/.test(d)).map((d) => '/opt/pw-browsers/' + d + '/chrome-linux/chrome').find((p) => fs.existsSync(p));
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('file://' + root + '/index.html');
await page.waitForTimeout(500);
await page.evaluate(() => { if (CH.post) CH.post.forced = true; });
await page.waitForTimeout(4000);
const shot = async (name, still, x, y, w, h) => {
  await page.evaluate((st) => { const s = CH.game.scene; s.still = st; s.time = 12; }, still);
  await page.waitForTimeout(400);
  const box = await (await page.$('#game')).boundingBox();
  const k = box.width / 480;
  await page.screenshot({ path: path.join(out, name), clip: { x: box.x + x * k, y: box.y + y * k, width: w * k, height: h * k } });
  console.log('wrote', name, `${w * k}x${h * k}`);
};
// square thumbnail: Chubby asleep in his window under the moon and the aurora
await shot('thumbnail.png', { cam: 4, logo: false }, 0, 15, 240, 240);
// the same with the logo over the sky
await shot('thumbnail-logo.png', { cam: 4, logo: true, logoX: 122, logoY: 22 }, 0, 15, 240, 240);
// wide banner: the cabin, the town across the lake, the logo over the hills
await shot('banner.png', { cam: 0, logo: true, logoX: 352, logoY: 70 }, 0, 66, 480, 150);
await browser.close();
