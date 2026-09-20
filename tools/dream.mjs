// Drives the dream chapter end to end with a dumb bot and reports timings.
// Usage: node tools/dream.mjs [shotDir]
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const shotDir = process.argv[2] || '';
const exe = fs.readdirSync('/opt/pw-browsers').filter((d) => /^chromium-\d+$/.test(d)).map((d) => '/opt/pw-browsers/' + d + '/chrome-linux/chrome').find((p) => fs.existsSync(p));
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errs = [];
page.on('pageerror', (e) => errs.push('[pageerror] ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errs.push('[console] ' + m.text()); });
await page.goto('file://' + root + '/index.html?scene=dream');
await page.waitForTimeout(1200);
const canvas = await page.$('#game');
const state = () => page.evaluate(() => {
  const s = CH.game.scene;
  return { phase: s.phase, hh: s.hh ? { x: Math.round(s.hh.p.x), rings: s.hh.rings_n, deaths: s.hh.deaths, trapped: !!s.hh.trapped } : null, cracks: s.boss ? s.boss.cracks : -1, hearts: s.hearts };
});
const shot = async (n) => { if (shotDir) await canvas.screenshot({ path: path.join(shotDir, n) }); };
const t0 = Date.now();
const marks = {};
const mark = (p) => { if (!marks[p]) marks[p] = ((Date.now() - t0) / 1000).toFixed(1); };
// past the title card
await page.keyboard.press('Space');
let last = '';
let held = false;
for (let i = 0; i < 900; i++) {
  const st = await state();
  mark(st.phase);
  if (st.phase !== last) { console.log(`${((Date.now() - t0) / 1000).toFixed(1)}s -> ${st.phase} ${JSON.stringify(st.hh || {})}`); await shot(`dream_${st.phase}.png`); last = st.phase; }
  if (st.phase === 'run') {
    if (!held) { await page.keyboard.down('ArrowRight'); held = true; }
    // jumps must be HELD: a tap is cut short by the variable-height jump
    await page.keyboard.down('Space'); await page.waitForTimeout(90); await page.keyboard.up('Space');
  } else if (held) { await page.keyboard.up('ArrowRight'); held = false; }
  if (st.phase === 'boss') {
    // the naive player: wanders, hops now and then, works nothing out
    const k = i % 8 < 4 ? 'ArrowLeft' : 'ArrowRight';
    await page.keyboard.down(k); await page.waitForTimeout(150); await page.keyboard.up(k);
    if (i % 5 === 0) { await page.keyboard.down('Space'); await page.waitForTimeout(80); await page.keyboard.up('Space'); }
  }
  if (st.phase === 'win' || st.phase === 'wake') { console.log('cracks', st.cracks, 'hearts', st.hearts); break; }
  await page.waitForTimeout(120);
}
const st = await state();
console.log('final', JSON.stringify(st));
console.log('marks', JSON.stringify(marks));
console.log(errs.length ? errs.slice(0, 8).join('\n') : 'no errors');
await browser.close();
