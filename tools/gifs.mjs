// Renders every character in the game dancing, one looping GIF each, plus a
// party GIF with the whole cast. Drawn with the game's own renderer.
// Usage: node tools/gifs.mjs [outDir]
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { encodeGif } from './gif.mjs';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = process.argv[2] || path.join(root, 'art', 'gifs');
fs.mkdirSync(out, { recursive: true });
const exe = fs.readdirSync('/opt/pw-browsers').filter((d) => /^chromium-\d+$/.test(d)).map((d) => '/opt/pw-browsers/' + d + '/chrome-linux/chrome').find((p) => fs.existsSync(p));
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto('file://' + root + '/index.html?test=props&noshader');
await page.waitForTimeout(1500);

// ---- the cast, and a stage to dance on (all in the page) ---------------------
await page.evaluate(() => {
  const gfx = CH.gfx;
  const cast = [];
  const add = (id, label, make) => cast.push({ id, label, make });
  add('chubby', 'CHUBBY', () => { const c = new CH.Chubby(0, 0); c.outfit = 'hoodie'; return c; });
  for (const [id, label, mk] of [['mom', 'MOM', CH.makeMom], ['doctor', 'DR. HOOTEN', CH.makeDoctor], ['brenda', 'BRENDA', CH.makeBrenda], ['kevin', 'KEVIN', CH.makeKevin], ['tammy', 'TAMMY', CH.makeTammy], ['jorge', 'JORGE', CH.makeJorge], ['destiny', 'DESTINY', CH.makeDestiny]]) add(id, label, () => mk(0, 0));
  add('nurse-green', 'NURSE', () => CH.makeNurse(0, 0, 0));
  add('nurse-red', 'NURSE', () => CH.makeNurse(0, 0, 1));
  for (const sh of CH.SHOPS) add('keeper-' + sh.keeper.name.toLowerCase(), sh.keeper.name.toUpperCase(), () => new CH.NPC({ name: sh.keeper.name, species: sh.keeper.species, outfit: sh.keeper.outfit }));
  const folk = [['denny', 'DENNY', 'deer', 'hearts', 1.15], ['mrs-pell', 'MRS. PELL', 'goose', 'coat', 0.95], ['hal', 'HAL', 'bear', 'winter', 1], ['tilly', 'TILLY', 'squirrel', 'winter', 0.72], ['constable-furrow', 'CONSTABLE FURROW', 'dog', 'security', 1], ['merle', 'MERLE', 'raccoon', 'suit', 1], ['busker', 'THE BUSKER', 'fox', 'winter', 1]];
  for (const [id, label, sp, of, hgt] of folk) add(id, label, () => new CH.NPC({ name: label, species: sp, outfit: of, height: hgt }));
  add('paramedic-goose', 'PARAMEDIC', () => new CH.NPC({ species: 'goose', outfit: 'paramedic', hat: 'cap', hatColor: '#243a6a' }));
  add('paramedic-moose', 'PARAMEDIC', () => new CH.NPC({ species: 'moose', outfit: 'paramedic', hat: 'cap', hatColor: '#243a6a', height: 1.05 }));
  const OUT = ['winter', 'casual', 'sweater', 'flannel', 'coat', 'hoodie', 'vest'];
  ['beaver', 'goose', 'moose', 'raccoon', 'bear', 'rabbit', 'fox', 'deer', 'squirrel', 'owl', 'cat', 'dog', 'skunk', 'porcupine'].forEach((sp, i) => add('townsfolk-' + sp, sp.toUpperCase(), () => new CH.NPC({ species: sp, outfit: OUT[i % OUT.length], height: sp === 'moose' ? 1.1 : 1 })));
  window.__cast = cast.map((c) => ({ id: c.id, label: c.label }));
  window.__castMake = cast;

  const FLOOR = [['#ff5a8a', '#5ad0ff', '#ffd84a', '#8a5aff'], ['#ffd84a', '#8a5aff', '#ff5a8a', '#5ad0ff']];
  function stage(w, h, beat, label) {
    gfx.rect(0, 0, w, h, '#2a1a44');
    gfx.rect(0, 0, w, Math.round(h * 0.28), '#3a2258');
    // spotlight cone
    const g = gfx.cur; g.save(); g.globalAlpha = 0.18;
    gfx.tri(w / 2 - 6, 0, w / 2 + 6, 0, w / 2 + w * 0.36, h - 22, '#fff4d8');
    gfx.tri(w / 2 - 6, 0, w / 2 - w * 0.36, h - 22, w / 2 + w * 0.36, h - 22, '#fff4d8');
    g.restore();
    // disco floor, tiles change on the beat
    const fy = h - 26, tw = 12;
    for (let x = 0, i = 0; x < w; x += tw, i++) for (let r = 0; r < 2; r++) {
      gfx.rect(x, fy + r * 6, tw - 1, 5, FLOOR[r][(i + beat) % 4]);
    }
    gfx.rect(0, fy - 1, w, 1, '#ffffff');
    // sparkles
    for (let i = 0; i < 6; i++) { const on = (i + beat) % 3 === 0; if (on) { const x = (i * 37 + 11) % w, y = 8 + (i * 13) % 26; gfx.rect(x, y - 2, 1, 5, '#ffffff'); gfx.rect(x - 2, y, 5, 1, '#ffffff'); } }
    if (label) {
      const tw2 = gfx.textWidth(label, 'small') + 10;
      gfx.rrect(w / 2 - tw2 / 2, h - 12, tw2, 10, 3, '#150c24');
      gfx.text(label, w / 2, h - 10, '#fff6d0', { align: 'center', font: 'small' });
    }
  }
  function dancer(entry, x, y, t, seed) {
    const a = entry.make();
    a.x = x; a.y = y; a.dancing = true; a.danceT = t; a.danceSeed = seed;
    if (a.blinkT !== undefined) a.blink = false;
    a.draw(gfx.cur);
  }
  // one frame of one character, returned as raw RGBA at 1x
  window.__frame = (i, f, n) => {
    const W = 100, H = 110, c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
    gfx.pushTarget(ctx);
    const t = (f / n) * (4 * 60 / CH.dance.BPM), beat = Math.floor(t * CH.dance.BPM / 60);
    stage(W, H, beat, window.__castMake[i].label);
    dancer(window.__castMake[i], W / 2, H - 22, t, (i * 1.7) % 10);
    gfx.popTarget();
    return Array.from(ctx.getImageData(0, 0, W, H).data);
  };
  window.__party = (f, n) => {
    const W = 480, H = 130, c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
    gfx.pushTarget(ctx);
    const t = (f / n) * (4 * 60 / CH.dance.BPM), beat = Math.floor(t * CH.dance.BPM / 60);
    stage(W, H, beat, 'EVERYBODY DANCE  -  CHUBBY THE PORCUPINE');
    const picks = ['mom', 'brenda', 'keeper-winnie', 'denny', 'keeper-marta', 'chubby', 'tilly', 'kevin', 'keeper-rick', 'mrs-pell', 'keeper-ty'];
    picks.forEach((id, k) => { const i = window.__castMake.findIndex((c2) => c2.id === id); if (i >= 0) dancer(window.__castMake[i], 30 + k * 42, H - 22, t, k * 1.3); });
    gfx.popTarget();
    return Array.from(ctx.getImageData(0, 0, W, H).data);
  };
});

const cast = await page.evaluate(() => window.__cast);
const N = 24, SCALE = 3;
const up = (src, w, h, s) => {
  const dst = new Uint8Array(w * s * h * s * 4);
  for (let y = 0; y < h * s; y++) for (let x = 0; x < w * s; x++) {
    const si = (((y / s) | 0) * w + ((x / s) | 0)) * 4, di = (y * w * s + x) * 4;
    dst[di] = src[si]; dst[di + 1] = src[si + 1]; dst[di + 2] = src[si + 2]; dst[di + 3] = 255;
  }
  return dst;
};
let total = 0;
for (let i = 0; i < cast.length; i++) {
  const frames = [];
  for (let f = 0; f < N; f++) frames.push(up(await page.evaluate(([a, b, c]) => window.__frame(a, b, c), [i, f, N]), 100, 110, SCALE));
  const buf = encodeGif(frames, 100 * SCALE, 110 * SCALE, { delay: 8 });
  fs.writeFileSync(path.join(out, cast[i].id + '.gif'), buf);
  total += buf.length;
  console.log('wrote', cast[i].id + '.gif', Math.round(buf.length / 1024) + 'KB');
}
const pf = [];
for (let f = 0; f < N; f++) pf.push(up(await page.evaluate(([a, b]) => window.__party(a, b), [f, N]), 480, 130, 2));
const pbuf = encodeGif(pf, 960, 260, { delay: 8 });
fs.writeFileSync(path.join(out, '_party.gif'), pbuf);
console.log('wrote _party.gif', Math.round(pbuf.length / 1024) + 'KB', '| total', Math.round((total + pbuf.length) / 1024) + 'KB,', cast.length + 1, 'gifs');
await browser.close();
