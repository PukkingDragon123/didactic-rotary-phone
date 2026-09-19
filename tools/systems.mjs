// Systems test: phone application steps, tower purchases, promotion, hospital visit, evening replay, bill payoff -> ending.
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SHOTS = process.argv[2] || '.';
const exe = fs.readdirSync('/opt/pw-browsers').filter((d) => /^chromium-\d+$/.test(d)).map((d) => '/opt/pw-browsers/' + d + '/chrome-linux/chrome').find((p) => fs.existsSync(p));
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const errors = [];
const newPage = async (q) => { const page = await browser.newPage({ viewport: { width: 960, height: 540 } }); page.on('pageerror', (e) => errors.push(q + ' :: ' + e.message + ' :: ' + (e.stack || '').split('\n')[1])); await page.goto('file://' + root + '/index.html' + q); await page.waitForTimeout(700); const canvas = await page.$('#game'); const box = await canvas.boundingBox(); const k = box.width / 480; const click = async (x, y) => { await page.mouse.click(box.x + x * k, box.y + y * k); await page.waitForTimeout(250); }; const shot = (n) => canvas.screenshot({ path: `${SHOTS}/sys_${n}.png` }); const ev = (fn) => page.evaluate(fn); return { page, click, shot, ev }; };
const state = (p) => p.ev(() => ({ scene: CH.game.scene && CH.game.scene.name, stack: CH.game.stack.length, chapter: CH.state.chapter, job: CH.state.job, obj: CH.ui.objective, dlg: CH.ui.dialog ? CH.ui.dialog.speaker + ': ' + CH.ui.dialog.text.slice(0, 40) : null, choices: !!(CH.ui.dialog && CH.ui.dialog.choices), px: CH.game.scene.player ? Math.round(CH.game.scene.player.x) : null, locked: !!CH.game.scene.locked, money: CH.state.money, floor: CH.state.towerFloor, ups: Object.keys(CH.state.upgrades).length }));
const advance = async (p, n, gap = 450) => { for (let i = 0; i < n; i++) { const s = await state(p); if (!s.dlg && !s.locked) return s; await p.page.keyboard.press(s.choices ? 'Enter' : 'e'); await p.page.waitForTimeout(gap); } return state(p); };
const walkTo = async (p, x, timeout = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const s = await state(p); if (s.px === null) return; if (Math.abs(s.px - x) < 8) return; if (s.dlg) { await p.page.keyboard.press(s.choices ? 'Enter' : 'e'); await p.page.waitForTimeout(250); continue; } if (s.locked) { await p.page.waitForTimeout(200); continue; } const key = s.px < x ? 'ArrowRight' : 'ArrowLeft'; await p.page.keyboard.down(key); await p.page.waitForTimeout(Math.min(400, Math.abs(s.px - x) * 12)); await p.page.keyboard.up(key); } console.log('walkTo timeout', x); };
const untilObj = async (p, prefix, timeout = 30000) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const s = await state(p); if (s.obj && s.obj.startsWith(prefix)) return s; await p.page.keyboard.press(s.choices ? 'Enter' : 'e'); await p.page.waitForTimeout(400); } console.log('untilObj timeout', prefix); return state(p); };

// ---- A. phone application flow (real clicks + a couple of evals) ----
{
  const p = await newPage('?scene=jobsearch');
  const url = () => p.ev(() => CH.game.scene.app ? CH.game.scene.app.state.url : null);
  console.log('storage', JSON.stringify(await p.ev(() => { const ok = CH.save(); return { saved: ok, has: CH.hasSave(), proto: location.protocol }; })));
  await p.click(190, 45); // Foxfire
  await p.ev(() => { const s = CH.game.scene; s.goto(s.app.state, 'job:donalds'); });
  await p.page.waitForTimeout(300); console.log('A url', await url());
  await p.click(240, 116); // APPLY NOW (job page button at content y ~ 30+...); fallback via eval if not navigated
  if (!(await url()).startsWith('apply')) { await p.ev(() => { const s = CH.game.scene; s.goto(s.app.state, 'apply:donalds:0'); }); }
  console.log('A step0', await url()); await p.shot('a0');
  await p.click(200, 180); // autofill link
  await p.page.waitForTimeout(300);
  await p.click(240, 157); // Continue
  console.log('A step1', await url(), await p.ev(() => CH.game.scene.fields.ap_name));
  await p.click(240, 98); await p.page.waitForTimeout(200); // resume_final_FINAL2 (row at content y 62..80)
  await p.click(240, 209); // Attach & continue (content y 176..188)
  console.log('A step2', await url()); await p.shot('a2');
  // answer questions by clicking first option (its y depends on question text height) -> find via eval on layout: options start after title + question paragraph
  for (let q = 0; q < 3; q++) { const yy = await p.ev(() => { const s = CH.game.scene; const ap = s.app.state.ap.donalds; const job = CH.jobById('donalds'); const qq = job.qs[ap.answers.length]; if (!qq) return null; const lines = CH.gfx.wrap(qq.q, 138 - 12, 'main').length; return 20 + 30 + 8 + lines * 10 + 6 + 7; }); if (yy === null) break; await p.click(240, 27 + yy); }
  console.log('A answers', await p.ev(() => CH.game.scene.app.state.ap.donalds.answers));
  // checkboxes: yy = 20+30 ; 'All questions answered' at 50, +12 -> 62 label, +10 -> boxes at 72, 83, 94
  for (const y of [72, 83, 94]) await p.click(180, 27 + y + 4);
  await p.click(240, 27 + 111); // Continue at content y 105..117
  console.log('A step3', await url()); await p.shot('a3');
  // cover letter: template rows at yy=50+10+10=70, 103, 136 (h30) -> click first; then Continue at yy = 70+3*33 + 9 + 16 = 194
  await p.click(240, 27 + 84); await p.click(240, 27 + 194 + 6 - (await p.ev(() => CH.game.scene.app.scroll)));
  console.log('A step4', await url()); await p.shot('a4');
  // captcha via eval-assisted clicks: cells 36px from gx, yy=50+18=68
  const cells = await p.ev(() => { const s = CH.game.scene; const ap = s.app.state.ap.donalds; return ap && ap.captcha ? ap.captcha.map((k, i) => k === 'porcupine' ? i : -1).filter((i) => i >= 0) : []; });
  console.log('A captcha porcupines', cells);
  for (const i of cells) { const cell = 36, gx = Math.floor((138 - cell * 3 - 4) / 2); const cx = gx + (i % 3) * (cell + 2) + cell / 2, cy = 68 + Math.floor(i / 3) * (cell + 2) + cell / 2; const sc = await p.ev(() => CH.game.scene.app.scroll); await p.click(171 + cx, 27 + cy - sc); }
  { const sc = await p.ev(() => CH.game.scene.app.scroll); await p.click(240, 27 + 68 + 36 * 3 + 8 + 6 - sc); }
  console.log('A step5', await url(), await p.ev(() => CH.phoneData().applications.donalds && CH.phoneData().applications.donalds.status)); await p.shot('a5');
  await p.page.close();
}
// ---- B. tower purchases -> elevator unlock ----
{
  const p = await newPage('?scene=tower');
  await p.ev(() => { CH.state.money = 600; });
  for (let i = 0; i < 5; i++) { await p.click(116 + i * 41, 211); await p.page.waitForTimeout(200); await p.click(56, 249); await p.page.waitForTimeout(300); }
  await p.page.waitForTimeout(2000);
  console.log('B tower', JSON.stringify(await state(p))); await p.shot('b_tower');
  await p.page.close();
}
// ---- C. promotion at shift end -> next shift uses station task ----
{
  const p = await newPage('?scene=restaurant');
  await p.ev(() => { CH.state.jobShifts = { janitor: 2 }; CH.state.shiftScores = [0.8, 0.8]; CH.state.towerFloor = 2; CH.flag('firstShiftDone', true); });
  await p.page.waitForTimeout(1500); await advance(p, 6);
  await p.ev(() => { CH.state.hour = 15.98; });
  await p.page.waitForTimeout(3000);
  await untilObj(p, 'Clock out', 60000);
  console.log('C promoted?', JSON.stringify(await state(p))); await p.shot('c_promo');
  await p.page.close();
  const p2 = await newPage('?scene=restaurantGrill');
  await p2.ev(() => { CH.flag('firstShiftDone', true); });
  await p2.page.waitForTimeout(1500); await advance(p2, 6);
  await p2.ev(() => { const s = CH.game.scene; s.pendingOrders = 2; s.makeStationTask(); });
  await p2.page.waitForTimeout(500);
  const tk = await p2.ev(() => { const t = CH.game.scene.tasks[0]; return t ? { type: t.type, x: Math.round(t.x), job: CH.state.job } : null; });
  console.log('C station task', JSON.stringify(tk));
  if (tk) { await walkTo(p2, tk.x); await p2.page.keyboard.press('e'); await p2.page.waitForTimeout(1500); console.log('C in minigame', JSON.stringify(await state(p2))); await p2.shot('c_station'); await p2.ev(() => { const sc = CH.game.scene; if (sc.finish) sc.finish(0.8); }); await p2.page.waitForTimeout(2500); console.log('C back', JSON.stringify(await state(p2))); }
  await p2.page.close();
}
// ---- D. evening: replay + hospital visit + bank payoff -> ending ----
{
  const p = await newPage('?scene=evening');
  const untilScene = async (name, timeout = 30000, press = true) => { const t0 = Date.now(); while (Date.now() - t0 < timeout) { const s = await state(p); if (s.scene === name) return s; if (press) { await p.page.keyboard.press(s.choices ? 'Enter' : 'e'); } await p.page.waitForTimeout(400); } console.log('untilScene timeout', name); return state(p); };
  await p.page.waitForTimeout(1500); await advance(p, 6);
  // couch replay: choose first option, wait for hedgehog, quit with Esc
  await walkTo(p, 870); await p.page.keyboard.press('e'); await p.page.waitForTimeout(600);
  await untilScene('hedgehog', 15000);
  console.log('D replay', JSON.stringify(await state(p))); await p.shot('d_replay');
  await p.page.waitForTimeout(3000); await p.page.keyboard.press('Escape');
  await untilScene('cabin', 12000, false); await p.page.waitForTimeout(800); await advance(p, 6);
  console.log('D after replay', JSON.stringify(await state(p)));
  // hospital visit via front door
  await walkTo(p, 297); await p.page.keyboard.press('e'); await p.page.waitForTimeout(600);
  await untilScene('hospital', 20000); await p.page.waitForTimeout(1500); await advance(p, 4);
  console.log('D hospital', JSON.stringify(await state(p)));
  await walkTo(p, 487); await p.page.keyboard.press('e'); await p.page.waitForTimeout(600);
  await untilScene('momroom', 15000); await p.page.waitForTimeout(1500); await advance(p, 4);
  console.log('D momroom', JSON.stringify(await state(p))); await p.shot('d_momroom');
  await walkTo(p, 200); await p.page.keyboard.press('e'); await p.page.waitForTimeout(800);
  await untilScene('cabin', 90000); await p.page.waitForTimeout(1500); await advance(p, 6);
  console.log('D back home', JSON.stringify(await state(p))); await p.shot('d_home');
  // bank payoff -> ending
  await p.ev(() => { CH.state.money = 90000; CH.state.billPaid = CH.state.bill - 500; });
  await p.page.keyboard.press('i'); await p.page.waitForTimeout(800);
  await p.click(224, 80); // Moosebank icon (row 2, col 2)
  await p.page.waitForTimeout(400); await p.shot('d_bank');
  await p.click(276, 108); // Pay
  await p.page.waitForTimeout(800);
  console.log('D paid', JSON.stringify(await p.ev(() => ({ paid: CH.state.billPaid, bill: CH.state.bill, off: CH.state.debtPaidOff, money: CH.state.money }))));
  await p.page.keyboard.press('Escape'); await p.page.waitForTimeout(300); await p.page.keyboard.press('Escape'); await p.page.waitForTimeout(300); await p.page.keyboard.press('Escape'); await p.page.waitForTimeout(500);
  await walkTo(p, 435); await p.page.keyboard.press('e'); await p.page.waitForTimeout(2500); await advance(p, 6); // eat so we can sleep
  await walkTo(p, 45); await p.page.keyboard.press('e'); await p.page.waitForTimeout(600); await advance(p, 6);
  await untilScene('momroom', 40000); console.log('D ending?', JSON.stringify(await state(p))); await p.shot('d_ending');
  { const t0 = Date.now(); while (Date.now() - t0 < 120000) { const s = await state(p); if (s.scene === 'cabin' && s.obj && s.obj.includes('relax')) break; await p.page.keyboard.press(s.choices ? 'Enter' : 'e'); await p.page.waitForTimeout(500); } }
  console.log('D end', JSON.stringify(await state(p)), JSON.stringify(await p.ev(() => ({ momHome: CH.state.momHome })))); await p.shot('d_end');
  await p.page.close();
}
console.log(errors.length ? 'ERRORS:\n' + [...new Set(errors)].join('\n') : 'no errors');
await browser.close();
