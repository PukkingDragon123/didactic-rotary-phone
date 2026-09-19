// Chapter chain: real job-search flow -> interview mail -> sleep -> interview day -> travel -> interview -> hired -> home -> sleep -> work day -> shift -> summary.
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
await page.waitForTimeout(600);
const canvas = await page.$('#game');
const shot = (n) => canvas.screenshot({ path: `${SHOTS}/chain_${n}.png` });
const state = () => page.evaluate(() => ({ scene: CH.game.scene && CH.game.scene.name, stack: CH.game.stack.length, chapter: CH.state.chapter, job: CH.state.job, day: CH.state.day, hour: Math.round(CH.state.hour * 10) / 10, obj: CH.ui.objective, dlg: CH.ui.dialog ? CH.ui.dialog.speaker + ': ' + CH.ui.dialog.text.slice(0, 50) : null, choices: !!(CH.ui.dialog && CH.ui.dialog.choices), px: CH.game.scene.player ? Math.round(CH.game.scene.player.x) : null, locked: !!CH.game.scene.locked, money: CH.state.money, outfit: CH.state.outfit }));
const log = async (label) => { const s = await state(); console.log(label, JSON.stringify(s)); return s; };
const advance = async (n, gap = 450) => { for (let i = 0; i < n; i++) { const s = await state(); if (!s.dlg && !s.locked) return s; await page.keyboard.press(s.choices ? 'Enter' : 'e'); await page.waitForTimeout(gap); } return state(); };
const walkTo = async (x, timeout = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const s = await state(); if (s.px === null) return; if (Math.abs(s.px - x) < 8) return; if (s.dlg) { await page.keyboard.press(s.choices ? 'Enter' : 'e'); await page.waitForTimeout(250); continue; } if (s.locked) { await page.waitForTimeout(200); continue; } const key = s.px < x ? 'ArrowRight' : 'ArrowLeft'; await page.keyboard.down(key); await page.waitForTimeout(Math.min(400, Math.abs(s.px - x) * 12)); await page.keyboard.up(key); } console.log('walkTo timeout at', x); };
const untilScene = async (name, timeout = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const s = await state(); if (s.scene === name) return s; await page.keyboard.press(s.choices ? 'Enter' : 'e'); await page.waitForTimeout(400); } console.log('untilScene timeout', name); return state(); };
const untilObj = async (prefix, timeout = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const s = await state(); if (s.obj && s.obj.startsWith(prefix)) return s; await page.keyboard.press(s.choices ? 'Enter' : 'e'); await page.waitForTimeout(400); } console.log('untilObj timeout', prefix); return state(); };

// 1. real job-search chapter
await page.evaluate(() => { CH.startJobSearch(); });
await page.waitForTimeout(4000);
await untilObj('Change into', 20000); await log('jobsearch start');
await walkTo(254); await page.keyboard.press('e'); await page.waitForTimeout(600);
await untilObj('Grab your smartphone', 25000); await log('suited'); await shot('1_suit');
await walkTo(96); await page.keyboard.press('e'); await page.waitForTimeout(600);
await untilScene('phone', 20000); await log('phone open'); await shot('2_phone');
await page.evaluate(() => { const d = CH.phoneData(); d.applications.donalds = { status: 'pending', timer: 0.5, score: 5 }; CH.state.applied.donalds = 'pending'; });
await page.waitForTimeout(1500); await page.keyboard.press('Escape'); await page.waitForTimeout(800);
await untilObj('Go to bed', 30000); await log('interview mail'); await shot('3_mail');
// 2. sleep -> interview day
await walkTo(45); await page.keyboard.press('e'); await page.waitForTimeout(600);
await untilObj('Leave through the front door', 40000); await log('interview day'); await shot('4_interviewday');
// 3. leave -> travel -> Donald's -> interview
await walkTo(297); await page.keyboard.press('e'); await page.waitForTimeout(600);
await untilScene('travel', 20000); await page.waitForTimeout(2000); await advance(6);
await page.evaluate(() => { const sc = CH.game.scene; sc.player.x = 2480; sc.cam.x = 2200; });
await page.waitForTimeout(600); await page.keyboard.press('e'); await page.waitForTimeout(500);
await untilScene('interview', 20000); await log('interview'); await shot('5_interview');
{ const t0 = Date.now(); while (Date.now() - t0 < 180000) { const st = await state(); if (st.scene !== 'interview') break; await page.keyboard.press(st.choices ? 'Enter' : 'e'); await page.waitForTimeout(450); } }
await log('after interview'); await shot('6_hired');
// 4. travel home -> cabin -> evening
await untilScene('travel', 25000); await page.waitForTimeout(2000); await advance(6);
await page.evaluate(() => { const sc = CH.game.scene; sc.player.x = 60; sc.cam.x = 0; });
await page.waitForTimeout(500); await page.keyboard.press('e'); await page.waitForTimeout(500);
await untilScene('cabin', 20000); await untilObj('Evening', 20000); await log('home evening'); await shot('7_evening');
await walkTo(435); await page.keyboard.press('e'); await page.waitForTimeout(2500); await advance(6);
await walkTo(45); await page.keyboard.press('e'); await page.waitForTimeout(600);
await untilObj('Eat (fridge)', 40000); await log('work day morning'); await shot('8_morning');
// 5. eat & leave for work
await walkTo(435); await page.keyboard.press('e'); await page.waitForTimeout(2500); await advance(6);
await walkTo(297); await page.keyboard.press('e'); await page.waitForTimeout(800);
await untilScene('travel', 20000); await page.waitForTimeout(2000); await advance(6);
await page.evaluate(() => { const sc = CH.game.scene; if (sc.player) { sc.player.x = 2480; sc.cam.x = 2200; } });
await page.waitForTimeout(600); await page.keyboard.press('e'); await page.waitForTimeout(600);
await untilScene('restaurant', 20000); await untilObj('Grab the mop', 30000); await log('restaurant'); await shot('9_restaurant');
await walkTo(1003); await page.keyboard.press('e'); await page.waitForTimeout(800); await advance(6); await log('mop');
await page.waitForTimeout(3500);
const task = await page.evaluate(() => { const t = CH.game.scene.tasks && CH.game.scene.tasks[0]; return t ? { type: t.type, x: Math.round(t.x) } : null; });
console.log('task', JSON.stringify(task));
if (task) { await walkTo(task.x); await page.keyboard.press('e'); await page.waitForTimeout(1500); await log('in minigame'); await shot('10_minigame'); await page.evaluate(() => { const sc = CH.game.scene; if (sc.finish) sc.finish(0.9); }); await page.waitForTimeout(2500); await log('after minigame'); }
await page.evaluate(() => { CH.state.hour = 15.98; });
await page.waitForTimeout(3000); await advance(10, 600); await log('shift end'); await shot('11_summary');
await untilObj('Clock out', 40000); await log('after summary'); await shot('12_aftershift');
await walkTo(21); await page.keyboard.press('e'); await page.waitForTimeout(1500); await advance(4); await page.waitForTimeout(3000);
await log('after leave'); await shot('13_home');
console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].join('\n') : 'no errors');
await browser.close();
