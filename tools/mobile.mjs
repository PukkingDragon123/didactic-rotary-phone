// Plays the game as a phone would: touch only, a coarse pointer, real device pixels.
// Usage: node tools/mobile.mjs "<query>" out.png [actions-json] [width] [height] [dpr]
// Actions (x, y in CSS px of the page; "game" variants use 480x270 game pixels):
//   {"tap":[x,y]}  {"tapGame":[x,y]}  {"btn":"e"}  (tap an on-screen button by name)
//   {"hold":"jump","ms":400}          (hold an on-screen button)
//   {"stick":[dx,dy],"ms":800}        (thumb on the stick, pushed by dx,dy CSS px)
//   {"swipe":[[x,y],[x,y],...],"ms":30}  {"wait":ms}  {"shot":"file.png"}  {"eval":"js"}
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const [query = '', out = 'mobile.png', actionsJson = '[]', W = '844', H = '390', DPR = '3'] = process.argv.slice(2);
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const exe = fs.readdirSync('/opt/pw-browsers').filter(d => /^chromium-\d+$/.test(d)).map(d => '/opt/pw-browsers/' + d + '/chrome-linux/chrome').find(p => fs.existsSync(p));
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const context = await browser.newContext({ viewport: { width: +W, height: +H }, deviceScaleFactor: +DPR, isMobile: true, hasTouch: true });
const page = await context.newPage();
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto('file://' + root + '/index.html' + query);
await page.waitForTimeout(400);
const cdp = await context.newCDPSession(page);
const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], i) => ({ x, y, id: i + 1 })) });
const gameXY = async (x, y) => {
  const b = await page.$eval('#game', (c) => { const r = c.getBoundingClientRect(); return [r.left, r.top, r.width]; });
  return [b[0] + x * b[2] / 480, b[1] + y * b[2] / 480];
};
const btnXY = async (k) => page.$eval(`#touchUI [data-k="${k}"]`, (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, getComputedStyle(el).display]; });
const actions = JSON.parse(actionsJson);
for (const a of actions) {
  if (a.wait) await page.waitForTimeout(a.wait);
  if (a.tap) { await touch('touchStart', [a.tap]); await page.waitForTimeout(40); await touch('touchEnd', []); }
  if (a.tapGame) { const p = await gameXY(...a.tapGame); await touch('touchStart', [p]); await page.waitForTimeout(40); await touch('touchEnd', []); }
  if (a.btn) { const [x, y, d] = await btnXY(a.btn); if (d === 'none') logs.push('[error] button hidden: ' + a.btn); await touch('touchStart', [[x, y]]); await page.waitForTimeout(60); await touch('touchEnd', []); }
  if (a.hold) { const [x, y] = await btnXY(a.hold); await touch('touchStart', [[x, y]]); await page.waitForTimeout(a.ms || 400); await touch('touchEnd', []); }
  if (a.stick) {
    const sx = 110, sy = +H - 90; // somewhere in the left thumb zone
    await touch('touchStart', [[sx, sy]]);
    for (let i = 1; i <= 4; i++) { await touch('touchMove', [[sx + a.stick[0] * i / 4, sy + a.stick[1] * i / 4]]); await page.waitForTimeout(16); }
    if (a.shotHeld) await page.screenshot({ path: a.shotHeld });
    await page.waitForTimeout(a.ms || 600);
    await touch('touchEnd', []);
  }
  if (a.swipe) { await touch('touchStart', [a.swipe[0]]); for (const p of a.swipe.slice(1)) { await touch('touchMove', [p]); await page.waitForTimeout(a.ms || 30); } await touch('touchEnd', []); }
  if (a.eval) logs.push('[eval] ' + JSON.stringify(await page.evaluate(a.eval)));
  if (a.shot) await page.screenshot({ path: a.shot });
}
await page.screenshot({ path: out });
fs.writeFileSync(out + '.log', logs.join('\n'));
console.log(logs.filter((l) => (l.includes('error') || l.includes('eval')) && !l.includes('ERR_FILE_NOT_FOUND')).filter((l, i, a) => l.includes('eval') || a.indexOf(l) === i).join('\n'));
await browser.close();
