// Usage: node tools/shot.mjs "<query>" out.png [actions-json] [width] [height]
// actions: [{"key":"e"},{"wait":500},{"click":[x,y]},{"keydown":"ArrowRight","ms":800},{"shot":"name.png"}, {"eval":"js"}]
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const [query = '', out = 'shot.png', actionsJson = '[]', W = '960', H = '540'] = process.argv.slice(2);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const exe = fs.readdirSync('/opt/pw-browsers').filter(d => /^chromium-\d+$/.test(d)).map(d => '/opt/pw-browsers/' + d + '/chrome-linux/chrome').find(p => fs.existsSync(p));
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: +W, height: +H } });
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto('file://' + root + '/index.html' + query);
await page.waitForTimeout(300);
const actions = JSON.parse(actionsJson);
const canvas = await page.$('#game');
const box = await canvas.boundingBox();
const k = box.width / 480;
const toPage = (x, y) => [box.x + x * k, box.y + y * k];
for (const a of actions) {
  if (a.wait) await page.waitForTimeout(a.wait);
  if (a.key) await page.keyboard.press(a.key);
  if (a.type) await page.keyboard.type(a.type, { delay: 30 });
  if (a.keydown) { await page.keyboard.down(a.keydown); await page.waitForTimeout(a.ms || 500); await page.keyboard.up(a.keydown); }
  if (a.click) { const [x, y] = toPage(a.click[0], a.click[1]); await page.mouse.click(x, y); }
  if (a.move) { const [x, y] = toPage(a.move[0], a.move[1]); await page.mouse.move(x, y); }
  if (a.down) { const [x, y] = toPage(a.down[0], a.down[1]); await page.mouse.move(x, y); await page.mouse.down(); }
  if (a.drag) { for (const [x, y] of a.drag) { const [px, py] = toPage(x, y); await page.mouse.move(px, py, { steps: 4 }); await page.waitForTimeout(a.ms || 30); } }
  if (a.up) await page.mouse.up();
  if (a.eval) logs.push('[eval] ' + JSON.stringify(await page.evaluate(a.eval)));
  if (a.shot) await canvas.screenshot({ path: a.shot });
}
await canvas.screenshot({ path: out });
fs.writeFileSync(out + '.log', logs.join('\n'));
console.log(logs.filter((l) => (l.includes('error') || l.includes('eval')) && !l.includes('ERR_FILE_NOT_FOUND')).filter((l, i, a) => l.includes('eval') || a.indexOf(l) === i).join('\n'));
await browser.close();
