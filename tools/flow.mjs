// Scripted end-to-end run of the opening chapter: alarm -> pancakes -> couch -> Blue Hedgehog -> crash -> 911.
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
await page.goto('file://' + root + '/index.html');
await page.waitForTimeout(500);
const canvas = await page.$('#game');
const shot = (n) => canvas.screenshot({ path: `${SHOTS}/flow_${n}.png` });
const state = () => page.evaluate(() => ({ scene: CH.game.scene && CH.game.scene.name, chapter: CH.state.chapter, obj: CH.ui.objective, dlg: CH.ui.dialog ? CH.ui.dialog.speaker + ': ' + CH.ui.dialog.text.slice(0, 50) : null, px: CH.game.scene.player ? Math.round(CH.game.scene.player.x) : null, locked: CH.game.scene.locked }));
const pressE = async (n, gap = 300) => { for (let i = 0; i < n; i++) { await page.keyboard.press('e'); await page.waitForTimeout(gap); } };
const walkTo = async (x, timeout = 25000) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const s = await state(); if (s.px === null) break; if (Math.abs(s.px - x) < 8) break; if (s.dlg) { await page.keyboard.press('e'); await page.waitForTimeout(250); continue; } if (s.locked) { await page.waitForTimeout(200); continue; } const key = s.px < x ? 'ArrowRight' : 'ArrowLeft'; await page.keyboard.down(key); await page.waitForTimeout(Math.min(400, Math.abs(s.px - x) * 12)); await page.keyboard.up(key); } };
// title -> new game. A new game opens in the dream chapter; that one has its
// own end-to-end script (tools/dream.mjs), so this run cuts straight to the
// cabin intro the dream would hand off to.
await page.keyboard.press('Enter'); await page.waitForTimeout(3000);
await page.evaluate(() => { const s = CH.game.scene; if (s && s.name === 'dream') CH.game.set(new CH.CabinScene({ mode: 'intro' })); });
await page.waitForTimeout(1200);
console.log('after title', await state());
// intro: wait for alarm then stop it
await page.waitForTimeout(9000); await pressE(3, 800);
await page.waitForTimeout(2000); await pressE(6, 600);
console.log('after alarm', await state()); await shot('1_awake');
// walk to kitchen table (pancakes at ~633)
await walkTo(636); await pressE(1); await page.waitForTimeout(800);
console.log('at table', await state()); await shot('2_kitchen');
// breakfast dialogue: press E repeatedly, answer a choice with Enter
for (let i = 0; i < 40; i++) { const s = await state(); if (!s.dlg && !s.locked) break; await page.keyboard.press('e'); await page.waitForTimeout(400); if (i % 5 === 4) { await page.keyboard.press('Enter'); } }
console.log('after breakfast', await state()); await shot('3_breakfast');
// walk to couch (880) and sit
await walkTo(870); await pressE(1); await page.waitForTimeout(1500);
for (let i = 0; i < 12; i++) { const s = await state(); if (s.scene !== 'cabin') break; await page.keyboard.press('e'); await page.waitForTimeout(600); }
await page.waitForTimeout(2500); console.log('after couch', await state()); await shot('4_zoom');
// hedgehog: start and play a little, then trigger the crash
await page.waitForTimeout(2000); await page.keyboard.press('z'); await page.waitForTimeout(1000);
await page.keyboard.down('ArrowRight'); await page.waitForTimeout(1500); await page.keyboard.press('z'); await page.waitForTimeout(200); await page.keyboard.press('z'); await page.waitForTimeout(1200); await page.keyboard.up('ArrowRight');
console.log('playing', await state()); await shot('5_hedgehog');
await page.evaluate(() => { const s = CH.game.scene; if (s && s.triggerCrash) s.triggerCrash(); });
await page.waitForTimeout(5000); console.log('after crash', await state()); await shot('6_crash');
// emergency: advance dialogue, walk to kitchen, to phone
for (let i = 0; i < 12; i++) { const s = await state(); if (!s.dlg && !s.locked) break; await page.keyboard.press('e'); await page.waitForTimeout(500); }
console.log('emergency start', await state());
await walkTo(600); await page.waitForTimeout(800);
for (let i = 0; i < 16; i++) { const s = await state(); if (!s.dlg && !s.locked) break; await page.keyboard.press('e'); await page.waitForTimeout(500); }
console.log('found mom', await state()); await shot('7_mom');
await walkTo(395); await pressE(1); await page.waitForTimeout(1200);
console.log('phone', await state()); await shot('8_dial');
// dial 911 via keys
for (const d of ['9', '1', '1']) { await page.keyboard.press(d); await page.waitForTimeout(2600); }
await page.waitForTimeout(2500); console.log('dialed', await state()); await shot('9_dialed');
for (let i = 0; i < 30; i++) { const s = await state(); if (s.scene !== 'cabin') break; await page.keyboard.press('e'); await page.waitForTimeout(700); if (i % 4 === 3) await page.keyboard.press('Enter'); }
await page.waitForTimeout(6000); console.log('end', await state()); await shot('10_end');
console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].join('\n') : 'no errors');
await browser.close();
