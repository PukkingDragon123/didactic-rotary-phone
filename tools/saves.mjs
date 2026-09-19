// Save system check: autosave, manual slots, the pause menu, and loading back.
// Usage: node tools/saves.mjs [shotsDir]
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SHOTS = process.argv[2] || '.';
const exe = fs.readdirSync('/opt/pw-browsers').filter((d) => /^chromium-\d+$/.test(d)).map((d) => '/opt/pw-browsers/' + d + '/chrome-linux/chrome').find((p) => fs.existsSync(p));
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } });
const page = await ctx.newPage();
const fails = [];
const errors = [];
page.on('pageerror', (e) => errors.push(e.message + ' :: ' + (e.stack || '').split('\n')[1]));
const check = (cond, msg) => { if (!cond) { fails.push(msg); console.log('FAIL: ' + msg); } };
const state = () => page.evaluate(() => ({
  scene: CH.game.scene && CH.game.scene.name, stack: CH.game.stack.length,
  day: CH.state.day, money: CH.state.money, job: CH.state.job, chapter: CH.state.chapter,
  slots: CH.SLOTS.map((n) => (CH.slotInfo(n) ? CH.slotInfo(n).day : null)),
}));
const log = async (l) => { const s = await state(); console.log(l, JSON.stringify(s)); return s; };

await page.goto('file://' + root + '/index.html?scene=cabinFree');
await page.waitForTimeout(1500);

// 1. autosave writes slot 0 and flashes the indicator
await page.evaluate(() => { CH.state.day = 5; CH.state.money = 321.5; CH.state.job = 'grill'; CH.autosave('Autosaved'); });
await page.waitForTimeout(300);
let s = await log('after autosave');
check(s.slots[0] === 5, 'autosave should write slot 0 with day 5');
check(await page.evaluate(() => CH.ui.savedFlash > 0), 'autosave should raise the saved indicator');

// 2. manual save to slot 2, then change state, then load it back
await page.evaluate(() => CH.saveTo(2));
await page.evaluate(() => { CH.state.day = 99; CH.state.money = 1; });
check((await state()).day === 99, 'state should have moved on before the load');
await page.evaluate(() => CH.loadFrom(2));
s = await log('after load slot 2');
check(s.day === 5 && s.money === 321.5, 'loading slot 2 should restore day 5 and the money');

// 3. newest slot picks the most recent write
await page.evaluate(() => { CH.state.day = 7; CH.saveTo(3); });
await page.waitForTimeout(50);
const newest = await page.evaluate(() => CH.newestSlot());
check(newest === 3, 'newestSlot should be the slot written last, got ' + newest);

// 4. the pause menu opens, saves through its own menu, and closes
await page.keyboard.press('p');
await page.waitForTimeout(500);
s = await log('pause open');
check(s.scene === 'pause', 'P should open the pause menu');
await page.screenshot({ path: SHOTS + '/save_pause.png' });
await page.keyboard.press('ArrowDown');
await page.keyboard.press('Enter');
await page.waitForTimeout(500);
s = await log('save menu');
check(s.scene === 'savemenu', 'pause > Save Game should open the slot list');
// slot 0 is the autosave and must refuse a manual write
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
check((await state()).scene === 'savemenu', 'saving onto the autosave slot should be refused, not crash');
// move to slot 1 and save
await page.keyboard.press('ArrowDown');
await page.keyboard.press('Enter');
await page.waitForTimeout(500);
s = await log('after slot 1 save');
check(s.slots[1] !== null, 'slot 1 should now hold a save');
await page.screenshot({ path: SHOTS + '/save_slots.png' });
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
s = await log('after closing');
check(s.scene === 'cabin', 'closing both menus should return to the game, got ' + s.scene);

// 5. overwrite confirmation appears for an occupied slot
await page.keyboard.press('p'); await page.waitForTimeout(400);
await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
check(await page.evaluate(() => !!CH.game.scene.confirm), 'overwriting an occupied slot should ask first');
await page.screenshot({ path: SHOTS + '/save_confirm.png' });
await page.keyboard.press('Escape'); await page.waitForTimeout(300);

// 6. a save survives a page reload
await page.goto('file://' + root + '/index.html');
await page.waitForTimeout(1500);
const titleSlots = await page.evaluate(() => CH.SLOTS.map((n) => (CH.slotInfo(n) ? CH.slotInfo(n).day : null)));
check(titleSlots.some((d) => d !== null), 'saves should survive a reload, got ' + JSON.stringify(titleSlots));
const cont = await page.evaluate(() => CH.game.scene.menu.items[0]);
check(cont && cont.disabled === false, 'Continue should be enabled on the title when a save exists');
await page.screenshot({ path: SHOTS + '/save_title.png' });

console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
console.log(fails.length ? fails.length + ' CHECK(S) FAILED' : 'all checks passed');
await browser.close();
process.exit(fails.length || errors.length ? 1 : 0);
