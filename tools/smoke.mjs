// Smoke test: load a scene, auto-advance dialogue with E, wander, collect JS errors.
// Usage: node smoke.mjs <scene> <seconds> [out.png] [extraActionsJson]
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const [scene = 'cabin', secs = '20', out = '', extra = '[]'] = process.argv.slice(2);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const exe = fs.readdirSync('/opt/pw-browsers').filter((d) => /^chromium-\d+$/.test(d)).map((d) => '/opt/pw-browsers/' + d + '/chrome-linux/chrome').find((p) => fs.existsSync(p));
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message + '\n' + (e.stack || '').split('\n').slice(0, 3).join('\n')));
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('ERR_FILE')) errors.push('[console] ' + m.text()); });
await page.goto('file://' + root + '/index.html?scene=' + scene);
await page.waitForTimeout(400);
const canvas = await page.$('#game');
const box = await canvas.boundingBox();
const k = box.width / 480;
const toPage = (x, y) => [box.x + x * k, box.y + y * k];
const actions = JSON.parse(extra);
for (const a of actions) {
  if (a.wait) await page.waitForTimeout(a.wait);
  if (a.key) await page.keyboard.press(a.key);
  if (a.eval) console.log('[eval]', JSON.stringify(await page.evaluate(a.eval)));
  if (a.click) { const [x, y] = toPage(a.click[0], a.click[1]); await page.mouse.click(x, y); }
}
const start = Date.now();
let i = 0;
while (Date.now() - start < +secs * 1000) {
  await page.keyboard.press('e');
  await page.waitForTimeout(350);
  if (i % 6 === 3) { await page.keyboard.down('ArrowRight'); await page.waitForTimeout(500); await page.keyboard.up('ArrowRight'); }
  if (i % 6 === 5) { await page.keyboard.press('Enter'); }
  i++;
}
const info = await page.evaluate(() => ({ scene: CH.game.scene && CH.game.scene.name, stack: CH.game.stack.length, chapter: CH.state.chapter, hour: Math.round(CH.state.hour * 10) / 10, obj: CH.ui.objective, dialog: CH.ui.dialog ? CH.ui.dialog.speaker + ': ' + CH.ui.dialog.text.slice(0, 60) : null }));
console.log(JSON.stringify(info));
if (out) await canvas.screenshot({ path: out });
console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].join('\n---\n') : 'no errors');
await browser.close();
