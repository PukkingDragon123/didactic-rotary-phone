// The itch.io cover: Chubby in his Donald's uniform leaping out of a snowy
// night, food flying, the big D glowing behind him and the logo on top.
// The game draws it (tools/cover_scene.js) with its own sprites and shader;
// it is cropped at whole scales: 630x500 for itch and a 1260x1000 copy.
// Usage: node tools/cover.mjs [outDir]
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = process.argv[2] || path.join(root, 'art');
const exe = fs.readdirSync('/opt/pw-browsers').filter((d) => /^chromium-\d+$/.test(d)).map((d) => '/opt/pw-browsers/' + d + '/chrome-linux/chrome').find((p) => fs.existsSync(p));
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
for (const [k, name] of [[2, 'cover.png'], [4, 'cover-hires.png']]) {
  const page = await browser.newPage({ viewport: { width: 480 * k, height: 270 * k } });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto('file://' + root + '/index.html?touch=0');
  await page.waitForTimeout(400);
  await page.addScriptTag({ path: path.join(root, 'tools/cover_scene.js') });
  await page.evaluate(() => { if (CH.post) CH.post.forced = true; CH.game.set(new CH.CoverScene()); CH.fx.setFade(0); });
  await page.waitForTimeout(1500);
  const box = await (await page.$('#game')).boundingBox();
  await page.screenshot({ path: path.join(out, name), clip: { x: box.x + 82 * k, y: box.y + 10 * k, width: 315 * k, height: 250 * k } });
  console.log('wrote', name, `${315 * k}x${250 * k}`);
  await page.close();
}
await browser.close();
