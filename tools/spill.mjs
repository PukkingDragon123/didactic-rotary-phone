// Janitor loop check: grab the mop, clean the first spill in the mop minigame, then make sure an expired mess complains but stays cleanable.
// Usage: node tools/spill.mjs [shotsDir]
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
await page.goto('file://' + root + '/index.html?scene=restaurant');
await page.waitForTimeout(800);
const canvas = await page.$('#game');
const state = () => page.evaluate(() => ({ scene: CH.game.scene && CH.game.scene.name, stack: CH.game.stack.length, obj: CH.ui.objective, dlg: CH.ui.dialog ? CH.ui.dialog.speaker + ': ' + CH.ui.dialog.text.slice(0, 40) : null, choices: !!(CH.ui.dialog && CH.ui.dialog.choices), px: CH.game.scene.player ? Math.round(CH.game.scene.player.x) : null, locked: !!CH.game.scene.locked, hover: CH.game.scene.hoverProp ? CH.game.scene.hoverProp.hint : null, tasks: (CH.game.scene.tasks || []).map((t) => t.type + '@' + Math.round(t.x) + (t.strikes ? '!' + t.strikes : '')), complaints: CH.game.scene.complaints, money: CH.state.money }));
const log = async (l) => { const s = await state(); console.log(l, JSON.stringify(s)); return s; };
const dismiss = async () => { const s = await state(); if (s.dlg) { await page.keyboard.press(s.choices ? 'Enter' : 'e'); await page.waitForTimeout(250); return true; } return false; };
const walkTo = async (x, timeout = 20000) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const s = await state(); if (s.px === null || Math.abs(s.px - x) < 6) return; if (await dismiss()) continue; if (s.locked) { await page.waitForTimeout(200); continue; } const key = s.px < x ? 'ArrowRight' : 'ArrowLeft'; await page.keyboard.down(key); await page.waitForTimeout(Math.min(400, Math.abs(s.px - x) * 12)); await page.keyboard.up(key); } console.log('walkTo timeout', x); };
const untilObj = async (prefix, timeout = 20000) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const s = await state(); if (s.obj && s.obj.startsWith(prefix)) return s; if (!(await dismiss())) await page.waitForTimeout(200); } console.log('untilObj timeout', prefix); return state(); };

await untilObj('Grab the mop'); await log('start');
await walkTo(1277); await page.keyboard.press('e'); await page.waitForTimeout(500);
for (let i = 0; i < 40; i++) { const s = await state(); if (s.tasks.length) break; if (!(await dismiss())) await page.waitForTimeout(300); }
const s1 = await log('mop taken');
if (!s1.tasks.length) console.log('FAIL: no spill task spawned');
const tx = +s1.tasks[0].split('@')[1];
await walkTo(tx); await page.waitForTimeout(300);
const s2 = await log('at spill');
if (!s2.hover || !/spill|puddle|mess|shake|ketchup|soda/i.test(s2.hover)) console.log('FAIL: prompt is not the spill:', s2.hover);
await page.keyboard.press('e'); await page.waitForTimeout(1500);
const s3 = await log('after E');
if (s3.scene !== 'minigame') console.log('FAIL: mop minigame did not open');
await canvas.screenshot({ path: SHOTS + '/spill_minigame.png' });
await page.evaluate(() => { const sc = CH.game.scene; if (sc.finish) sc.finish(0.9); });
await page.waitForTimeout(2500);
for (let i = 0; i < 10; i++) if (!(await dismiss())) break;
const s4 = await log('after clean');
const props = await page.evaluate(() => CH.game.scene.props.filter((p) => p.name === 'spill' || p.name === 'wetSign').map((p) => p.name + '@' + Math.round(p.x)));
console.log('floor props', JSON.stringify(props));
if (s4.tasks.some((t) => t.startsWith('spill'))) console.log('FAIL: spill task still present');
if (!props.some((p) => p.startsWith('wetSign'))) console.log('FAIL: no wet floor sign after cleaning');
// expiry: the mess must survive its timer, complain once, and stay interactable
await page.evaluate(() => { const sc = CH.game.scene; sc.spawnSpill(200); const t = sc.tasks.find((k) => k.type === 'spill'); t.patience = 0.2; });
await page.waitForTimeout(1200);
const s5 = await log('after expiry');
const spillTasks = s5.tasks.filter((t) => t.startsWith('spill'));
if (!spillTasks.length) console.log('FAIL: expired spill vanished'); else if (!spillTasks[0].endsWith('!1')) console.log('FAIL: strike not recorded', spillTasks[0]);
if (!(s5.complaints >= 1)) console.log('FAIL: no complaint on expiry');
await walkTo(200); await page.waitForTimeout(300); const s6 = await log('at expired spill');
await page.keyboard.press('e'); await page.waitForTimeout(1200); const s7 = await log('E on expired spill');
if (s7.scene !== 'minigame') console.log('FAIL: expired spill not cleanable');
await canvas.screenshot({ path: SHOTS + '/spill_expired.png' });
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no errors');
await browser.close();
