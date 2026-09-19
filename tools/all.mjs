// Open every registered scene and test screen in one browser, report errors.
// Usage: node tools/all.mjs [secondsPerScene] [shotsDir]
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SECS = Number(process.argv[2] || 4);
const SHOTS = process.argv[3] || '';
const exe = fs.readdirSync('/opt/pw-browsers').filter((d) => /^chromium-\d+$/.test(d)).map((d) => '/opt/pw-browsers/' + d + '/chrome-linux/chrome').find((p) => fs.existsSync(p));
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });

// discover what exists
const probe = await ctx.newPage();
await probe.goto('file://' + root + '/index.html');
await probe.waitForTimeout(1200);
const names = await probe.evaluate(() => ({
  scenes: Object.keys(CH.SCENES || {}),
  tests: Object.keys(CH.TESTS || {}),
}));
await probe.close();
console.log('scenes: ' + names.scenes.length + ', tests: ' + names.tests.length);

const bad = [];
async function run(query, label) {
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message.split('\n')[0] + ' :: ' + (e.stack || '').split('\n')[1]));
  page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('ERR_FILE_NOT_FOUND')) errs.push('[console] ' + m.text().slice(0, 160)); });
  await page.goto('file://' + root + '/index.html' + query);
  await page.waitForTimeout(SECS * 1000);
  // poke it so update paths run
  for (const k of ['e', 'ArrowRight', 'Enter']) { await page.keyboard.press(k); await page.waitForTimeout(220); }
  await page.mouse.move(480, 270); await page.mouse.down(); await page.mouse.move(520, 300, { steps: 4 }); await page.mouse.up();
  await page.waitForTimeout(400);
  if (SHOTS) { const c = await page.$('#game'); if (c) await c.screenshot({ path: SHOTS + '/all_' + label + '.png' }); }
  const uniq = [...new Set(errs)];
  if (uniq.length) { bad.push(label + '\n    ' + uniq.slice(0, 3).join('\n    ')); console.log('ERR  ' + label); }
  else console.log('ok   ' + label);
  await page.close();
}

for (const n of names.scenes) await run('?scene=' + n, n);
for (const n of names.tests) await run('?test=' + n, 'test_' + n);
await run('', 'title');

console.log('');
if (bad.length) { console.log(bad.length + ' SCENE(S) WITH ERRORS:\n' + bad.join('\n')); }
else console.log('all scenes clean');
await browser.close();
process.exit(bad.length ? 1 : 0);
