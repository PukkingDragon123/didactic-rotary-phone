// Mid-game drive: job hunt -> interview -> hired -> first shift -> home.
// Objective-driven rather than step-scripted, so it survives pacing changes.
// Usage: node tools/chain.mjs [shotsDir]
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SHOTS = process.argv[2] || '.';
const exe = fs.readdirSync('/opt/pw-browsers').filter((d) => /^chromium-\d+$/.test(d)).map((d) => '/opt/pw-browsers/' + d + '/chrome-linux/chrome').find((p) => fs.existsSync(p));
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message + ' :: ' + (e.stack || '').split('\n')[1]));
await page.goto('file://' + root + '/index.html?scene=cabinFree');
await page.waitForTimeout(800);
const canvas = await page.$('#game');
const shot = (n) => canvas.screenshot({ path: `${SHOTS}/chain_${n}.png` });

const state = () => page.evaluate(() => {
  const sc = CH.game.scene;
  return {
    scene: sc && sc.name, stack: CH.game.stack.length, chapter: CH.state.chapter,
    job: CH.state.job, day: CH.state.day, hour: Math.round(CH.state.hour * 10) / 10,
    obj: CH.ui.objective || '', money: CH.state.money, outfit: CH.state.outfit,
    dlg: !!CH.ui.dialog, choices: !!(CH.ui.dialog && CH.ui.dialog.choices),
    px: sc && sc.player ? Math.round(sc.player.x) : null,
    locked: !!(sc && sc.locked), mini: !!(sc && sc.finish && sc.name === 'minigame'),
  };
});

// Where each objective wants the player to stand. Read from the live scene so
// a prop that moves does not break the test.
const propX = (hint) => page.evaluate((h) => {
  const sc = CH.game.scene;
  if (!sc || !sc.props) return null;
  const p = sc.props.find((q) => q.hint === h && !q.hidden);
  return p ? Math.round(p.x + p.w / 2) : null;
}, hint);

// Order matters: the clock-out objective also contains the words "front door",
// and the restaurant has no prop by that name.
const GOALS = [
  [/Clock out/i, 'Exit'],
  [/Change into/i, 'Wardrobe'],
  [/smartphone|phone from/i, 'Smartphone'],
  [/Go to bed|sleep \(bed\)|then sleep/i, 'Bed'],
  [/Eat \(fridge\)|eat, then leave/i, ['Fridge', 'Front door']],
  [/front door|Leave through/i, 'Front door'],
  [/Grab the mop/i, 'Supply closet'],
  [/Walk into town|Donald's Burgers/i, "Donald's Burgers"],
  [/Walk home/i, 'Home'],
];

let lastNote = '';
let lastObj = '';
let tries = 0;
const note = (s, label) => {
  const line = label + ' ' + JSON.stringify(s);
  if (line !== lastNote) { console.log(line); lastNote = line; }
};

async function step() {
  const s = await state();
  if (s.dlg) { await page.keyboard.press(s.choices ? 'Enter' : 'e'); await page.waitForTimeout(180); return s; }
  if (s.mini) {
    await page.evaluate(() => { const sc = CH.game.scene; if (sc.finish) sc.finish(0.85); });
    await page.waitForTimeout(1200); return s;
  }
  if (s.px === null) {
    // a screen with no walking character - a summary or a story card - just
    // wants a keypress to move on
    await page.keyboard.press('e'); await page.waitForTimeout(300); return s;
  }
  if (s.locked) { await page.waitForTimeout(250); return s; }
  // pick a destination from the objective
  let target = null;
  for (const [re, hint] of GOALS) {
    if (!re.test(s.obj)) continue;
    // an objective naming two places ("eat, then leave") needs both tried in turn
    const list = Array.isArray(hint) ? hint : [hint];
    tries = s.obj === lastObj ? tries + 1 : 0;
    lastObj = s.obj;
    target = await propX(list[Math.floor(tries / 6) % list.length]);
    break;
  }
  if (target === null) {
    // nothing named in this scene: drift away from whichever wall we are on,
    // pressing to interact, rather than grinding against it
    const w = await page.evaluate(() => (CH.game.scene && CH.game.scene.width) || 480);
    const key = s.px > w - 60 ? 'ArrowLeft' : 'ArrowRight';
    await page.keyboard.down(key); await page.waitForTimeout(300); await page.keyboard.up(key);
    await page.keyboard.press('e'); await page.waitForTimeout(180);
    return s;
  }
  const d = target - s.px;
  if (Math.abs(d) < 10) { await page.keyboard.press('e'); await page.waitForTimeout(400); return s; }
  const key = d > 0 ? 'ArrowRight' : 'ArrowLeft';
  await page.keyboard.down(key);
  // long crossings (the restaurant is 1380 wide) need long bursts, or the
  // round trip per step eats the whole budget
  await page.waitForTimeout(Math.min(Math.abs(d) > 200 ? 1100 : 450, Math.abs(d) * 11));
  await page.keyboard.up(key);
  return s;
}

async function driveUntil(pred, label, maxMs, shotName) {
  const t0 = Date.now();
  let s = await state();
  while (Date.now() - t0 < maxMs) {
    if (pred(s)) { note(s, 'reached ' + label); if (shotName) await shot(shotName); return s; }
    s = await step();
  }
  console.log('TIMEOUT waiting for ' + label + ' :: ' + JSON.stringify(s));
  fails.push(label);
  return s;
}
const fails = [];

// 1. job hunt
await page.evaluate(() => CH.startJobSearch());
await page.waitForTimeout(3000);
await driveUntil((s) => s.outfit === 'suit', 'the suit', 90000, '1_suit');
await driveUntil((s) => s.scene === 'phone', 'the phone', 90000, '2_phone');
// apply through the phone the quick way: the UI flow has its own test
await page.evaluate(() => { CH.applyToJob ? CH.applyToJob('donalds') : CH.flag('gotInterview', true); });
await page.keyboard.press('Escape'); await page.waitForTimeout(600);
await page.evaluate(() => { CH.flag('gotInterview', true); CH.state.chapter = 'interview'; });
await page.waitForTimeout(400);

// 2. sleep into interview day, then get to Donald's
await driveUntil((s) => s.day > 1 || /front door/i.test(s.obj), 'interview morning', 120000, '3_interviewday');
await driveUntil((s) => s.scene === 'travel' || s.scene === 'interview', 'the trip to town', 120000, '4_travel');
if ((await state()).scene === 'travel') {
  // skip the long walk, but stop short of the door so the driver still uses it
  await page.evaluate(() => {
    const sc = CH.game.scene;
    const d = sc.props.find((p) => p.hint === "Donald's Burgers");
    if (sc.player && d) sc.player.x = d.x - 30;
  });
  await page.waitForTimeout(700);
}
await driveUntil((s) => s.scene === 'interview', 'the interview', 120000, '5_interview');
await driveUntil((s) => s.job === 'janitor', 'being hired', 180000, '6_hired');

// 3. first shift
await driveUntil((s) => s.scene === 'restaurant', 'the restaurant', 180000, '7_restaurant');
await driveUntil((s) => /Clean up messes|Clock out/i.test(s.obj), 'the mop', 120000, '8_mop');
await driveUntil((s) => /Clock out/i.test(s.obj) || s.scene !== 'restaurant', 'the end of the shift', 300000, '9_shiftend');
await driveUntil((s) => s.scene === 'cabin' || s.scene === 'travel', 'the way home', 300000, '10_home');
if ((await state()).scene === 'travel') {
  await page.evaluate(() => {
    const sc = CH.game.scene;
    const h = sc.props.find((p) => p.hint === 'Home');
    if (sc.player && h) sc.player.x = h.x + 30;
  });
  await page.waitForTimeout(700);
  await driveUntil((s) => s.scene === 'cabin', 'the cabin', 120000, '11_cabin');
}

const end = await state();
note(end, 'final');
console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].join('\n') : 'no errors');
console.log(fails.length ? fails.length + ' STAGE(S) TIMED OUT: ' + fails.join(', ') : 'all stages reached');
await browser.close();
process.exit(fails.length || errors.length ? 1 : 0);
