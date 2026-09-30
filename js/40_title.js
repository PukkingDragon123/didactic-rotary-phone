// ============================================================================
// TITLE SCREEN - a night shot, framed like the opening of a film.
//
// Chubby's cabin on the hill above Moose Hollow, the town asleep across the
// frozen lake, the moon and the northern lights over the hills - and through
// the big front window, Chubby, fast asleep. Everything is painted once into
// parallax layers; the camera sways slowly across them while the snow falls,
// the chimneys smoke and the town's lights go out one by one. The shader
// lights every window and casts the moonlight. The logo and the menu sit on
// the UI layer, crisp and untouched by any of it.
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, fx = CH.fx, art = CH.art, A = CH.audio, inp = CH.input, S = CH.state;
  const W = CH.W, H = CH.H;
  const PX = CH.PIX, mix = gfx.mix;

  // ==========================================================================
  // THE NIGHT SHOT
  // Painted once into parallax layers (sky, hills, town and lake, near bank,
  // cabin, foreground). Positions below are in layer coordinates: a layer is
  // PAD wider than the screen on each side, so screen x = layer x - PAD while
  // the camera sits in the middle of its sway.
  // ==========================================================================
  const PAD = 18;
  const DRIFT = 10;
  const PAR = { mtn: 0.18, town: 0.4, near: 0.75, cabin: 1, front: 1.35 };
  const LW = W + PAD * 2;
  const MOON = { x: 206, y: 40, r: 13 };
  const LAKE = { top: 170, bot: 198 };
  const GROUND = 168;                        // the town's street, across the lake
  const CAB = { x0: 24, x1: 196, top: 166, base: 236, peak: 112, eave: 172 };
  const WIN = { x: 62, y: 178, w: 64, h: 48 };
  const CHIMNEY = { x: 150, top: 110 };
  const LOGO_CX = 368;

  const hexRGB = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const withA = (a, fn) => { const g = gfx.cur; const o = g.globalAlpha; g.globalAlpha = o * a; fn(); g.globalAlpha = o; };
  const R = (x, y, w, h, c) => gfx.rect(x, y, w, h, c);
  const P1 = (x, y, c) => gfx.px(x, y, c);
  const E = (x, y, rx, ry, c) => gfx.ellipse(x, y, rx, ry, c);
  const layer = (w, h, fn) => { const c = gfx.makeCanvas(w, h); gfx.pushTarget(c.getContext('2d')); try { fn(c.getContext('2d')); } finally { gfx.popTarget(); } return c; };

  // ---- sky: a dithered gradient, the moon's cool glow, the town's warm one,
  //      the Milky Way and the faint stars, all baked into one image -----------
  function paintSky(c, stars) {
    const g = c.getContext('2d'), w = c.width, h = c.height;
    const img = g.createImageData(w, h), d = img.data;
    const stops = [[0, '#04071a'], [0.28, '#090e2c'], [0.52, '#121843'], [0.72, '#221e53'], [0.88, '#3c2d5e'], [1, '#5c3c66']].map(([t, col]) => [t, hexRGB(col)]);
    const cool = hexRGB('#34488c'), warm = hexRGB('#86585c'), milky = hexRGB('#2a3470'), core = hexRGB('#4a4e8a');
    const HB = 178;
    // the Milky Way runs from low on the left to high on the right
    const mx0 = -60, my0 = 150, mx1 = 540, my1 = -20, ml = Math.hypot(mx1 - mx0, my1 - my0);
    const nx = (my0 - my1) / ml, ny = (mx1 - mx0) / ml;
    const rng = new CH.Rng(77);
    const noise = new Float32Array(w * h);
    for (let i = 0; i < noise.length; i++) noise[i] = rng.next();
    for (let y = 0; y < h; y++) {
      const t = Math.min(1, y / HB);
      let i = 0; while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
      const [t0, c0] = stops[i], [t1, c1] = stops[i + 1];
      const u = (t - t0) / (t1 - t0);
      for (let x = 0; x < w; x++) {
        let r = c0[0] + (c1[0] - c0[0]) * u, gg = c0[1] + (c1[1] - c0[1]) * u, b = c0[2] + (c1[2] - c0[2]) * u;
        const dm = Math.hypot(x - MOON.x, (y - MOON.y) * 1.1), km = Math.max(0, 1 - dm / 95);
        const kc = km * km * 0.55;
        r += (cool[0] - r) * kc; gg += (cool[1] - gg) * kc; b += (cool[2] - b) * kc;
        const dt = Math.hypot((x - 330) * 0.55, (y - 176) * 1.6), kt = Math.max(0, 1 - dt / 120) * 0.34;
        r += (warm[0] - r) * kt; gg += (warm[1] - gg) * kt; b += (warm[2] - b) * kt;
        const dl = Math.abs((x - mx0) * nx + (y - my0) * ny);
        const kmw = Math.exp(-(dl * dl) / (2 * 20 * 20)) * (0.5 + 0.5 * noise[y * w + x]) * 0.3 * Math.max(0, 1 - y / 165);
        const mc = dl < 7 ? core : milky;
        r += (mc[0] - r) * kmw; gg += (mc[1] - gg) * kmw; b += (mc[2] - b) * kmw;
        // quantised in steps of 4 with an ordered dither between them
        const bay = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
        const q = (v) => Math.min(255, Math.floor(v / 4 + bay) * 4);
        const k = (y * w + x) * 4;
        d[k] = q(r); d[k + 1] = q(gg); d[k + 2] = q(b); d[k + 3] = 255;
      }
    }
    // faint stars, denser along the Milky Way; the bright ones twinkle live
    for (const s of stars) {
      if (s.live) continue;
      const k = (s.y * w + s.x) * 4;
      const col = hexRGB(s.c);
      for (let j = 0; j < 3; j++) d[k + j] = Math.round(d[k + j] + (col[j] - d[k + j]) * s.b);
    }
    g.putImageData(img, 0, 0);
  }
  function makeStars() {
    const rng = new CH.Rng(31), stars = [];
    for (let i = 0; i < 360; i++) {
      const x = rng.int(0, W - 1), y = Math.floor(Math.pow(rng.next(), 1.5) * 168);
      const b = 0.25 + Math.pow(rng.next(), 2.2) * 0.75;
      const c = rng.pick(['#ffffff', '#ffffff', '#dfe8ff', '#bcd4ff', '#fff2d0']);
      stars.push({ x, y, b, c, live: b > 0.58, ph: rng.next() * 6.28, sp: 0.8 + rng.next() * 2.4, big: b > 0.86 });
    }
    return stars;
  }

  // ---- hills: two rolling Canadian Shield ridges, moonlit on the crests ----------
  function paintHills() {
    return layer(LW, 180, () => {
      const far = (x) => 124 - 13 * Math.sin(x * 0.012 + 0.4) - 8 * Math.sin(x * 0.027 + 2.2) - 3 * Math.sin(x * 0.071 + 1.1) - 10 * Math.exp(-Math.pow((x - 330) / 38, 2));
      const near = (x) => 146 - 8 * Math.sin(x * 0.018 + 1.7) - 5 * Math.sin(x * 0.043 + 0.3) - 2 * Math.sin(x * 0.11);
      for (let x = 0; x < LW; x++) {
        const y0 = Math.round(far(x));
        R(x, y0, 1, 180 - y0, '#191f4c');
        // snow on the upper slopes, lit on the side that faces the moon
        const slope = far(x + 1) - far(x - 1), lit = (x - PAD < MOON.x) === (slope > 0);
        for (let j = 0; j < 9; j++) if ((x * 7 + j * 3) % (j < 3 ? 1 : j < 6 ? 2 : 3) === 0) P1(x, y0 + j, lit ? (j < 2 ? '#6a7ac0' : '#3e4c8c') : (j < 2 ? '#3a4682' : '#27306a'));
      }
      for (let x = 0; x < LW; x++) {
        const y0 = Math.round(near(x));
        R(x, y0, 1, 180 - y0, '#10153a');
        P1(x, y0, '#2a3470');
        if (x % 2 === 0) P1(x, y0 + 1, '#1c2458');
      }
      // a ragged treeline along the near ridge
      const rng = new CH.Rng(12);
      for (let x = -4; x < LW + 6; x += 3 + rng.int(0, 3)) {
        PX.draw('farPine', x, Math.round(near(x)) + 5 + rng.int(0, 3), { remap: { a: '#0c1030', b: '#27326a' }, flip: rng.chance(0.5) });
      }
    });
  }

  // ---- the town and the frozen lake ------------------------------------------------
  // Windows are left dark in the painting and recorded, so they can be lit and
  // put out one by one as the town goes to bed.
  function paintTown(T) {
    const rng = new CH.Rng(2024);
    const wins = (T.wins = []), lamps = (T.lamps = []), smokes = (T.smokes = []);
    const SNOW = '#8a9ad4', SNOW_S = '#5a68a2';
    const win = (x, y, w, h, o = {}) => {
      R(x, y, w, h, '#161a34');
      wins.push({ x, y, w, h, on: o.on !== undefined ? o.on : rng.chance(0.72), a: 0, col: o.col || rng.pick(['#ffd27a', '#ffc664', '#ffe39c', '#ffcf86']), tv: !!o.tv, low: y > GROUND - 12, ph: rng.next() * 9 });
    };
    const winGrid = (x, y, w, h, cols, rows, ww = 2, wh = 3, o = {}) => {
      const gx = (w - cols * ww) / (cols + 1), gy = (h - rows * wh) / (rows + 1);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) win(Math.round(x + gx + c * (ww + gx)), Math.round(y + gy + r * (wh + gy)), ww, wh, o);
    };
    const roofSnow = (x, y, w) => { R(x, y, w, 2, SNOW); for (let i = 0; i < w; i += 2) P1(x + i, y + 2, SNOW_S); P1(x - 1, y + 1, SNOW); P1(x + w, y + 1, SNOW); };
    const chimney = (x, y, h) => { R(x, y - h, 3, h, '#2a2230'); R(x - 1, y - h - 1, 5, 1, SNOW); smokes.push({ x: x + 1, y: y - h - 2 }); };
    const gable = (x, w, h, col, base = GROUND, o = {}) => {
      const top = base - h, rh = Math.round(w * 0.42);
      R(x, top, w, h, col);
      for (let yy = top + 2; yy < base; yy += 3) gfx.hline(x, yy, w, gfx.shade(col, -10));
      for (let j = 0; j < rh; j++) { const half = Math.round(((j + 1) / rh) * (w / 2 + 2)); R(Math.round(x + w / 2 - half), top - rh + j, half * 2, 1, j < 2 ? SNOW : j < 4 ? '#6a78b0' : '#2a2438'); }
      R(x - 2, top - 1, w + 4, 2, SNOW_S); R(x - 2, top - 2, 3, 1, SNOW); R(x + w - 1, top - 2, 3, 1, SNOW);
      if (o.chimney !== false && rng.chance(0.7)) chimney(Math.round(x + w * 0.7), top - Math.round(rh * 0.3), 5);
      winGrid(x, top + 2, w, h - 5, Math.max(1, Math.round(w / 9)), h > 16 ? 2 : 1, 2, 3, o);
      if (o.door !== false) R(Math.round(x + w * 0.2), base - 5, 3, 5, '#1a1426');
    };
    const flat = (x, w, h, col, base = GROUND, o = {}) => {
      const top = base - h;
      R(x, top, w, h, col);
      if (o.brick) for (let yy = top + 1; yy < base; yy += 2) for (let xx = x + ((yy >> 1) % 2) * 2; xx < x + w; xx += 4) P1(xx, yy, gfx.shade(col, -12));
      R(x - 1, top - 2, w + 2, 2, gfx.shade(col, -22)); roofSnow(x - 1, top - 3, w + 2);
      if (o.front) { R(x + 3, top - 7, w - 6, 5, col); roofSnow(x + 3, top - 8, w - 6); }
      winGrid(x, top + 3, w, h - 5, Math.max(1, Math.round(w / 7)), Math.max(1, Math.round((h - 4) / 8)), 2, 3, o);
    };

    return layer(LW, 214, () => {
      // far shore and the street along it
      R(0, 152, LW, 62, '#232c5c');
      for (let x = 0; x < LW; x++) { const y = 150 + Math.round(2 * Math.sin(x * 0.07) + Math.sin(x * 0.19)); R(x, y, 1, 3, '#34407a'); P1(x, y, '#4c5a98'); }
      // the woods to the left of town
      for (let i = 0; i < 16; i++) PX.pine(rng.int(-4, 150), GROUND + 1 + rng.int(-2, 1), rng.int(24, 40), { c: '#14261e', seed: rng.int(1, 900), snow: '#7a8ac4', snowShade: '#3e4a82', flip: rng.chance(0.5) });
      // the back row: small houses on the rise behind Main Street
      for (let x = 146; x < LW; x += 18 + rng.int(0, 8)) {
        if (rng.chance(0.25)) { PX.pine(x + 6, 163, rng.int(24, 30), { c: '#12221c', seed: rng.int(1, 900), snow: '#6a7ab8', snowShade: '#343f76' }); continue; }
        gable(x, rng.int(14, 20), rng.int(9, 13), rng.pick(['#2c2a46', '#262e48', '#302a40', '#2a3242']), 162, { door: false, chimney: rng.chance(0.5) });
      }
      // the radio mast on the hill, and its red light
      for (let y = 88; y < 162; y += 1) P1(444 + ((y >> 2) % 2), y, '#2a2e4a');
      for (let y = 92; y < 160; y += 6) { gfx.line(443, y, 446, y + 6, '#23284a'); gfx.line(446, y, 443, y + 6, '#23284a'); }
      T.mast = { x: 444, y: 87 };
      // Main Street
      gable(146, 22, 16, '#463c58');
      PX.pine(176, GROUND + 1, 30, { c: '#16281e', seed: 41, snow: '#8a9ad4', snowShade: '#46528a' });
      gable(184, 24, 18, '#3c4a5e');
      // the town hall and its clock tower
      flat(214, 36, 22, '#58404a', GROUND, { brick: true });
      R(226, 124, 12, 22, '#4e3842'); R(225, 122, 14, 2, SNOW); E(232, 121, 6, 4, '#3a2c38'); E(232, 119, 5, 3, SNOW); R(231, 113, 2, 4, '#3a2c38'); E(232, 112, 1.5, 1.5, '#e8c060');
      T.clock = { x: 232, y: 131, r: 4 };
      R(228, 140, 8, 5, '#161a34');
      // the general store with its false front
      flat(254, 28, 20, '#5a3c32', GROUND, { front: true });
      // the Moose Inn, three storeys of brick and a sign on the roof
      flat(286, 34, 38, '#54303a', GROUND, { brick: true });
      R(292, 118, 22, 7, '#1a1424'); R(294, 125, 1, 3, '#1a1424'); R(311, 125, 1, 3, '#1a1424'); T.inn = { x: 303, y: 120 };
      // Donald's, low and wide, and the big D on its pole
      flat(324, 40, 15, '#6a5040', GROUND, { });
      R(357, 124, 2, GROUND - 124 - 15, '#3a3444');
      T.dsign = { x: 351, y: 110, w: 14, h: 14 };
      gable(368, 24, 18, '#445260');
      PX.pine(398, GROUND + 1, 34, { c: '#16281e', seed: 88, snow: '#8a9ad4', snowShade: '#46528a' });
      PX.pine(410, GROUND + 1, 26, { c: '#14241c', seed: 17, snow: '#8a9ad4', snowShade: '#46528a', flip: true });
      // the arena, its barrel roof under a blanket of snow
      R(418, GROUND - 16, 48, 16, '#3a4a66');
      for (let i = 0; i < 48; i++) { const hh = Math.round(6 * Math.sin((i / 47) * Math.PI)); R(418 + i, GROUND - 16 - hh, 1, hh, '#2e3a58'); P1(418 + i, GROUND - 17 - hh, SNOW); P1(418 + i, GROUND - 18 - hh, i % 3 ? SNOW : SNOW_S); }
      winGrid(418, GROUND - 14, 48, 8, 5, 1, 3, 2);
      // the water tower with the town's name on it
      for (const lx of [474, 478, 486, 490]) R(lx, 136, 1, GROUND - 136, '#2a2c46');
      gfx.line(474, 150, 490, 160, '#2a2c46'); gfx.line(490, 150, 474, 160, '#2a2c46');
      R(470, 118, 24, 18, '#4a5a7a'); E(482, 118, 12, 4, '#4a5a7a'); E(482, 116, 12, 3, SNOW); E(482, 136, 12, 2, '#3a4866');
      gfx.text('MOOSE', 482, 121, '#c8d4ee', { align: 'center', font: 'tiny' });
      gfx.text('HOLLOW', 482, 128, '#c8d4ee', { align: 'center', font: 'tiny' });
      gable(500, 22, 16, '#3e3a56');
      // street lamps along the shore road
      for (let x = 150; x < LW; x += 30) { R(x, GROUND - 9, 1, 9, '#1e1a2a'); R(x - 1, GROUND - 10, 3, 1, '#2a2638'); lamps.push({ x, y: GROUND - 10 }); }
      // the shore road and its snowbank
      R(0, GROUND, LW, 3, '#2a3466'); for (let x = 0; x < LW; x += 3) P1(x, GROUND, '#4a5896');
      // the frozen lake: ice, drifted snow, a cleared rink and an ice hut
      for (let y = LAKE.top; y < LAKE.bot + 16; y++) R(0, y, LW, 1, mix('#34427e', '#222c62', Math.min(1, (y - LAKE.top) / 30)));
      // the moon's path across the ice, soft and wide
      for (let y = LAKE.top; y < LAKE.bot + 12; y++) { const u = (y - LAKE.top) / 40, half = 10 + u * 34; withA(0.22 * (1 - u * 0.7), () => R(Math.round(MOON.x + PAD - half), y, Math.round(half * 2), 1, '#5a6cb0')); withA(0.18 * (1 - u), () => R(Math.round(MOON.x + PAD - half * 0.4), y, Math.round(half * 0.8), 1, '#7a8ccc')); }
      R(0, LAKE.top, LW, 1, '#4a5a98');
      for (let i = 0; i < 26; i++) { const x = rng.int(0, LW), y = rng.int(LAKE.top + 2, LAKE.bot + 8), w = rng.int(8, 30); E(x, y, w, 1 + rng.int(0, 1), '#2e3a72'); }
      for (let i = 0; i < 9; i++) { let x = rng.int(0, LW), y = rng.int(LAKE.top + 3, LAKE.bot + 6); for (let k = 0; k < 14; k++) { P1(x, y, '#3a4884'); x += rng.int(1, 2); y += rng.int(-1, 1); } }
      // a rink somebody shovelled, right in the moonlight, and an ice-fishing hut
      R(234, 181, 44, 11, '#46569a'); gfx.frame(234, 181, 44, 11, '#9aaade'); R(256, 182, 1, 9, '#b04a62'); E(256, 186, 3, 2, '#9aaade'); P1(235, 186, '#c8354a'); P1(276, 186, '#c8354a');
      for (let i = 0; i < 44; i += 3) P1(234 + i, 180, '#e8f0ff');
      T.hut = { x: 300, y: 184 };
      R(294, 181, 13, 9, '#5a3228'); R(293, 179, 15, 2, SNOW); R(294, 181, 13, 1, '#3a1e18'); R(304, 174, 1, 5, '#2a2430'); smokes.push({ x: 304, y: 173, hut: true });
      R(297, 184, 3, 2, '#161a34'); wins.push({ x: 297, y: 184, w: 3, h: 2, on: true, a: 1, col: '#ffcf7a', hut: true, ph: 1 });
      // somebody is up late with the television on
      const tv = wins.find((w) => !w.hut && w.x > 360 && w.y > GROUND - 14);
      if (tv) { tv.tv = true; tv.on = true; }
    });
  }

  // ---- the near bank, between the lake and the cabin's hill ----------------------------
  function paintNear() {
    return layer(LW, H, () => {
      const top = (x) => 197 + Math.round(3 * Math.sin(x * 0.05 + 1) + 2 * Math.sin(x * 0.13));
      for (let x = 0; x < LW; x++) {
        const y = top(x);
        R(x, y, 1, H - y, '#2a3464');
        P1(x, y, '#5a6aa8'); P1(x, y + 1, '#44528e'); if (x % 3 === 0) P1(x, y + 2, '#38447e');
        P1(x, y - 1, '#1a2046');
      }
      const rng = new CH.Rng(5);
      for (let i = 0; i < 40; i++) { const x = rng.int(0, LW), y = rng.int(206, H); E(x, y, rng.int(6, 18), 1, rng.chance(0.5) ? '#323e74' : '#26305c'); }
      // a split-rail fence along the shore
      for (let x = 236; x < LW; x += 22) { R(x, 197, 2, 10, '#1e1620'); P1(x, 196, '#8a9ad4'); P1(x + 1, 196, '#8a9ad4'); }
      for (const y of [199, 203]) { R(236, y, LW - 236, 1, '#261c22'); for (let x = 236; x < LW; x += 3) P1(x, y - 1, '#6a7ab8'); }
      // rocks with snow caps
      for (const [x, y, r] of [[284, 214, 7], [430, 222, 9], [352, 238, 6]]) { E(x, y, r, r * 0.6, '#1e2448'); E(x - 1, y - r * 0.35, r * 0.8, r * 0.3, '#7a8ac4'); }
      // pines on the bank (the right-hand ones stand behind the menu)
      for (const [x, y, h, s] of [[452, 234, 76, 11], [486, 226, 58, 19], [512, 236, 44, 23], [340, 224, 30, 7]]) PX.pine(x, y, h, { c: '#122a1e', seed: s, snow: '#8ea0d8', snowShade: '#4a5890', flip: s % 2 === 0 });
      PX.draw('birch', 380, 228, { remap: { w: '#c8d0e8', W: '#9aa6c8', g: '#7a86a8', s: '#e8f0ff', S: '#8a9ad4' } });
    });
  }

  // ---- the cabin on its hill -------------------------------------------------------------
  function paintCabin() {
    return layer(LW, H, () => {
      const { x0, x1, top, base, peak, eave } = CAB, cx = (x0 + x1) / 2;
      // the knoll
      for (let x = 0; x < 300; x++) {
        const y = Math.round(x < 212 ? base - 2 + Math.max(0, (x - 190) * 0.25) : base + 3 + (x - 212) * 0.28 + Math.sin(x * 0.09) * 1.5);
        R(x, y, 1, H - y, '#34427c'); P1(x, y, '#7a8cc8'); P1(x, y + 1, '#5a6aa8'); if (x % 2) P1(x, y + 2, '#48568e');
      }
      // warm light from the window lying on the snow
      withA(0.2, () => { for (let j = 0; j < 30; j++) { const w = WIN.w + j * 1.6; R(Math.round(WIN.x + WIN.w / 2 - w / 2), base + j, Math.round(w), 1, '#ffcf80'); } });
      // footprints from the door, down the hill
      for (let i = 0; i < 12; i++) { const fx = 158 + i * 5 + Math.round(Math.sin(i * 0.9) * 3), fy = base + 4 + i * 3; E(fx + (i % 2) * 3, fy, 1.6, 0.8, '#26306a'); }
      // log walls: rounded courses lit from above by the moon, chinked between
      for (let y = top, n = 0; y < base; y += 7, n++) {
        R(x0, y, x1 - x0, 7, '#4a2e1c');
        gfx.hline(x0, y, x1 - x0, '#8a6444'); gfx.hline(x0, y + 1, x1 - x0, '#6a4a30');
        gfx.hline(x0, y + 5, x1 - x0, '#34200f'); gfx.hline(x0, y + 6, x1 - x0, '#5e5444');
        for (let x = x0 + ((n * 17) % 23); x < x1; x += 23 + ((x * 7) % 11)) { E(x, y + 3, 1.5, 1, '#34200f'); P1(x - 1, y + 2, '#6a4a30'); }
        // log ends at both corners
        for (const ex of [x0 - 3, x1 + 3]) { E(ex, y + 3, 4, 3.4, '#6a4a30'); E(ex, y + 3, 2.6, 2.2, '#8a6a4a'); E(ex, y + 3, 1.2, 1, '#5a3a22'); P1(ex - 1, y + 1, '#a8845c'); }
      }
      // shadow under the gable's overhang
      withA(0.4, () => R(x0, top, x1 - x0, 5, '#140a06'));
      // chimney of river stones, rising from behind the roof
      R(CHIMNEY.x, CHIMNEY.top, 14, 44, '#5a5a6a');
      for (let y = CHIMNEY.top + 1; y < CHIMNEY.top + 44; y += 4) for (let x = CHIMNEY.x + ((y >> 2) % 2) * 3; x < CHIMNEY.x + 14; x += 6) { E(x + 2, y + 1, 2.4, 1.6, '#6e6e80'); P1(x + 1, y, '#8a8aa0'); }
      R(CHIMNEY.x - 2, CHIMNEY.top - 2, 18, 3, '#44444f'); E(CHIMNEY.x + 7, CHIMNEY.top - 3, 9, 2.5, '#d8e2ff'); E(CHIMNEY.x + 7, CHIMNEY.top - 4, 7, 1.6, '#f4f8ff');
      // the gable end: boards, and a round attic window
      const slopeHalf = (y) => ((y - peak) / (eave - peak)) * ((x1 - x0) / 2 + 12);
      for (let y = peak + 3; y < top; y++) {
        const half = Math.round(slopeHalf(y)) - 7;
        if (half <= 0) continue;
        R(Math.round(cx - half), y, half * 2, 1, '#3c2416');
        for (let x = Math.round(cx - half); x < cx + half; x += 6) P1(x, y, '#2a180c');
      }
      E(cx, 146, 7, 7, '#2a180c'); E(cx, 146, 5.5, 5.5, '#b8783e'); CAB.attic = { x: cx, y: 146 };
      R(cx - 1, 140, 2, 12, '#3c2416'); R(cx - 6, 145, 12, 2, '#3c2416');
      // the roof edges: a deep, soft blanket of snow along both slopes, with
      // rounded lumps along its underside (no icicles - nothing sharp up here)
      for (let y = peak - 3; y <= eave; y++) {
        const half = Math.max(0, slopeHalf(y)), band = 10;
        const xa = Math.round(cx - half - 2), xb = Math.round(cx + half + 2);
        if (xb - xa <= band * 2) { R(xa, y, xb - xa, 1, y - peak < 1 ? '#ffffff' : '#dfe8ff'); continue; }
        R(xa, y, band, 1, '#c8d4f4'); R(xb - band, y, band, 1, '#a8b8e4');
        R(xa, y, 3, 1, '#f4f8ff'); R(xb - band, y, 3, 1, '#c8d4f4');
        P1(xa + band, y, '#7a8ac0'); P1(xb - band - 1, y, '#6a7ab0');
      }
      for (let y = peak + 6; y <= eave; y += 4) {
        const half = slopeHalf(y), lump = 1.6 + Math.sin(y * 0.7) * 0.8;
        E(Math.round(cx - half + 9), y + 1, 2.4, lump, '#b8c6ee'); E(Math.round(cx + half - 9), y + 1, 2.4, lump, '#98a8d8');
      }
      E(cx - 98 - 1, eave + 1, 5, 3, '#dfe8ff'); E(cx + 98 + 1, eave + 1, 5, 3, '#b8c6ee');
      // the front window: warm-lit frame, shutters with heart cut-outs, a snowy sill
      const wx = WIN.x, wy = WIN.y, ww = WIN.w, wh = WIN.h;
      R(wx - 4, wy - 4, ww + 8, wh + 8, '#2a180c'); R(wx - 3, wy - 3, ww + 6, wh + 6, '#b07a48'); R(wx - 2, wy - 2, ww + 4, wh + 4, '#8a5a34');
      for (const sx of [wx - 17, wx + ww + 5]) {
        R(sx, wy - 2, 12, wh + 4, '#1c3a34'); R(sx + 1, wy - 1, 10, wh + 2, '#2c5a4c');
        for (let y = wy + 2; y < wy + wh; y += 5) gfx.hline(sx + 2, y, 8, '#244a40');
        const hy = wy + 10;
        R(sx + 4, hy, 2, 2, '#ffcf80'); R(sx + 7, hy, 2, 2, '#ffcf80'); R(sx + 4, hy + 2, 5, 1, '#ffcf80'); R(sx + 5, hy + 3, 3, 1, '#ffcf80'); P1(sx + 6, hy + 4, '#ffcf80');
      }
      R(wx - 7, wy + wh + 3, ww + 14, 4, '#6a4428'); R(wx - 7, wy + wh + 2, ww + 14, 2, '#dfe8ff');
      for (let x = wx - 6; x < wx + ww + 7; x += 3) P1(x, wy + wh + 1, '#f4f8ff');
      // the door, a sign over it and the porch lantern
      R(144, 196, 26, 40, '#2a180c'); R(146, 198, 22, 38, '#5a3620');
      for (let x = 149; x < 168; x += 5) R(x, 198, 1, 38, '#44281a');
      R(150, 204, 14, 10, '#6a4228'); R(150, 220, 14, 10, '#6a4228'); E(164, 218, 1.4, 1.4, '#d8b060');
      R(146, 186, 22, 8, '#6a4a2e'); R(147, 187, 20, 6, '#8a6440');
      gfx.text('HOME', 157, 188, '#f4e2b8', { align: 'center', font: 'tiny' });
      R(173, 196, 1, 4, '#2a2230'); R(171, 200, 5, 7, '#2a2230'); R(172, 201, 3, 5, '#ffd98a'); CAB.lantern = { x: 173, y: 203 };
      // firewood under a little snow roof
      R(198, 214, 26, 22, '#2a1a10');
      for (let y = 216; y < 236; y += 4) for (let x = 200 + ((y >> 2) % 2) * 2; x < 222; x += 5) { E(x + 2, y + 2, 2.2, 1.8, '#8a6a48'); P1(x + 2, y + 2, '#5a3a22'); }
      R(196, 211, 30, 3, '#3a2616'); R(195, 209, 32, 2, '#dfe8ff');
      // a snowman in a toque and scarf, and a sled
      const sx = 238;
      E(sx, 250, 11, 9, '#d0dcf8'); E(sx - 3, 247, 7, 5, '#e8f0ff');
      E(sx, 234, 8, 7, '#d8e2fa'); E(sx - 2, 232, 5, 4, '#eef4ff');
      E(sx, 222, 6, 5.5, '#e0e8fc'); E(sx - 2, 220, 3.5, 3, '#f4f8ff');
      P1(sx - 2, 221, '#141018'); P1(sx + 2, 221, '#141018'); R(sx, 223, 4, 1, '#e8752c'); P1(sx + 4, 223, '#c85a1c');
      for (let i = -2; i <= 2; i++) P1(sx + i * 1.5, 226 - Math.abs(i) * 0.4, '#141018');
      R(sx - 6, 227, 12, 3, '#c8352b'); R(sx + 3, 229, 3, 6, '#a82a22');
      E(sx, 217, 6, 3, '#c8352b'); R(sx - 6, 217, 12, 2, '#f4f0e6'); E(sx, 212, 2, 2, '#f4f0e6');
      P1(sx, 233, '#141018'); P1(sx, 237, '#141018');
      gfx.line(sx - 8, 232, sx - 16, 226, '#3a2616'); gfx.line(sx - 13, 228, sx - 15, 224, '#3a2616');
      gfx.line(sx + 8, 232, sx + 15, 228, '#3a2616'); gfx.line(sx + 12, 230, sx + 14, 227, '#3a2616');
      R(250, 256, 22, 3, '#a82a22'); R(250, 259, 22, 1, '#6a1a14'); R(271, 252, 2, 5, '#a82a22'); gfx.line(252, 256, 256, 252, '#6a1a14');
    });
  }

  // ---- the foreground: a dark pine framing the left edge, a drift along the bottom -------
  function paintFront() {
    return layer(LW, H, () => {
      PX.pine(14, H + 6, 110, { c: '#0c1c14', seed: 5, snow: '#6a7ab8', snowShade: '#2c365e' });
      for (let x = 0; x < LW; x++) {
        const y = 260 + Math.round(3 * Math.sin(x * 0.045) + 2 * Math.sin(x * 0.11 + 1));
        R(x, y, 1, H - y, '#222b56'); P1(x, y, '#4a5a98'); if (x % 2) P1(x, y + 1, '#34407a');
      }
    });
  }

  // ---- the room behind the window: Chubby asleep in bed ---------------------------------
  function paintRoom() {
    return layer(WIN.w, WIN.h, () => {
      R(0, 0, WIN.w, WIN.h, '#5a3820');
      for (let y = 0; y < WIN.h; y += 6) { gfx.hline(0, y, WIN.w, '#7a5232'); gfx.hline(0, y + 5, WIN.w, '#3e2614'); }
      // the Blue Hedgehog poster, of course
      R(44, 5, 15, 19, '#e8b030'); R(45, 6, 13, 12, '#2f5fc0'); E(51, 12, 4, 4, '#3b6fd6'); E(53, 12, 1.5, 1.2, '#f2c9a0');
      gfx.text('BH', 51, 19, '#3a2408', { align: 'center', font: 'tiny' });
      // the bedside lamp's light, off to the left
      withA(0.28, () => { E(4, 22, 34, 26, '#ffc870'); });
      withA(0.22, () => { E(2, 24, 18, 16, '#ffe0a0'); });
    });
  }

  // ---- the logo: chunky letters, smoothed, extruded and capped with snow -----------------
  function glyphMask(ch) {
    const f = CH.FONTS.main, rows = f.glyphs[ch] || f.glyphs[f.fallback];
    const w = Math.max(...rows.map((r) => r.length)) + 2, h = rows.length + 2;
    const d = new Uint8Array(w * h);
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === '#') d[(y + 1) * w + x + 1] = 1; });
    return { w, h, d };
  }
  // Scale2x (EPX): doubles a mask and rounds its stair-steps into diagonals
  function epx(m) {
    const w2 = m.w * 2, h2 = m.h * 2, d = new Uint8Array(w2 * h2);
    const at = (x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h ? 0 : m.d[y * m.w + x]);
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
      const p = at(x, y), a = at(x, y - 1), b = at(x + 1, y), c = at(x - 1, y), dd = at(x, y + 1);
      d[2 * y * w2 + 2 * x] = c === a && c !== dd && a !== b ? a : p;
      d[2 * y * w2 + 2 * x + 1] = a === b && a !== c && b !== dd ? b : p;
      d[(2 * y + 1) * w2 + 2 * x] = dd === c && dd !== b && c !== a ? c : p;
      d[(2 * y + 1) * w2 + 2 * x + 1] = b === dd && b !== a && dd !== c ? dd : p;
    }
    return { w: w2, h: h2, d };
  }
  // plain nearest-neighbour growth, for letters made of bigger pixels
  function grow(m, k) {
    const w = m.w * k, h = m.h * k, d = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) d[y * w + x] = m.d[((y / k) | 0) * m.w + ((x / k) | 0)];
    return { w, h, d };
  }
  function trim(m) {
    let x0 = m.w, y0 = m.h, x1 = -1, y1 = -1;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.d[y * m.w + x]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    const w = x1 - x0 + 1, h = y1 - y0 + 1, d = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) d[y * w + x] = m.d[(y + y0) * m.w + x + x0];
    return { w, h, d, top: y0 };
  }
  // Build one letter as a canvas: ink outline, extruded side, gradient face,
  // rim light and (optionally) soft snow on every upward-facing ledge.
  function buildLetter(ch, o) {
    let m = glyphMask(ch);
    for (let i = 0; i < o.passes; i++) m = epx(m);
    if (o.grow > 1) m = grow(m, o.grow);
    const lift = m.h;
    m = trim(m);
    const OUT = o.out, DEP = o.depth, SN = o.snow ? 6 : 0;
    const cw = m.w + OUT * 2 + 2, chh = m.h + OUT * 2 + DEP + SN + 1;
    const ox = OUT + 1, oy = OUT + SN;
    const face = new Uint8Array(cw * chh), body = new Uint8Array(cw * chh), snow = new Uint8Array(cw * chh);
    const F = (x, y) => (x >= 0 && y >= 0 && x < cw && y < chh ? face[y * cw + x] : 0);
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.d[y * m.w + x]) face[(y + oy) * cw + x + ox] = 1;
    for (let i = 0; i < face.length; i++) if (face[i]) for (let k = 0; k <= DEP; k++) { const j = i + k * cw; if (j < body.length) body[j] = 1; }
    if (o.snow) {
      // snow settles on the top of each stroke - the highest face pixel in each
      // column - in soft rounded caps that spill a pixel over the edges
      const colTop = new Int16Array(cw).fill(-1);
      for (let x = 0; x < cw; x++) for (let y = 0; y < chh; y++) if (F(x, y)) { colTop[x] = y; break; }
      let x = 0;
      while (x < cw) {
        if (colTop[x] < 0) { x++; continue; }
        let x2 = x; while (x2 + 1 < cw && colTop[x2 + 1] >= 0 && Math.abs(colTop[x2 + 1] - colTop[x2]) <= 1) x2++;
        const n = x2 - x + 1;
        // only the tops of the letters, not a crossbar halfway down
        const high = Math.min(...Array.from({ length: n }, (_, k) => colTop[x + k])) <= oy + m.h * 0.3;
        if (n >= 3 && high) for (let k = -2; k <= n + 1; k++) {
          const xx = x + k; if (xx < 0 || xx >= cw) continue;
          const u = (k + 0.5) / n, yt = colTop[CH.clamp(xx, x, x2)];
          // a soft pillow that spills over both edges: flat on top, rounded at the
          // shoulders - never a point
          const inset = Math.min(k + 2, n + 1 - k);
          const th = inset <= 0 ? 2 : 3 + (n >= 12 && u > 0.3 && u < 0.7 ? 1 : 0);
          for (let j = 0; j < th; j++) { const yy = yt - 1 - j; if (yy >= 0) snow[yy * cw + xx] = 1; }
          if (k >= 0 && k < n) { snow[yt * cw + xx] = 1; if (k > 0 && k < n - 1 && yt + 1 < chh && F(xx, yt + 1)) snow[(yt + 1) * cw + xx] = 1; }
        }
        x = x2 + 1;
      }
      for (let i = 0; i < snow.length; i++) if (snow[i]) body[i] = 1;
    }
    const c = gfx.makeCanvas(cw, chh), g = c.getContext('2d');
    const put = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
    // outline: the body dilated by OUT, a rounded brush
    const ink = new Uint8Array(cw * chh);
    for (let y = 0; y < chh; y++) for (let x = 0; x < cw; x++) if (body[y * cw + x]) {
      for (let dy = -OUT; dy <= OUT; dy++) for (let dx = -OUT; dx <= OUT; dx++) {
        if (dx * dx + dy * dy > OUT * OUT + 1) continue;
        const xx = x + dx, yy = y + dy; if (xx >= 0 && yy >= 0 && xx < cw && yy < chh) ink[yy * cw + xx] = 1;
      }
    }
    for (let i = 0; i < ink.length; i++) if (ink[i]) put(i % cw, (i / cw) | 0, o.ink);
    // extruded side, darker the deeper it goes
    for (let i = 0; i < body.length; i++) if (body[i] && !face[i] && !snow[i]) {
      const x = i % cw, y = (i / cw) | 0;
      let k = 0; while (k <= DEP && !F(x, y - k)) k++;
      put(x, y, mix(o.side[0], o.side[1], Math.min(1, k / Math.max(1, DEP))));
    }
    // the face: a vertical gradient, a lit top rim and a darker lower edge
    const fy0 = oy, fy1 = oy + m.h;
    for (let y = 0; y < chh; y++) for (let x = 0; x < cw; x++) {
      if (!F(x, y) || snow[y * cw + x]) continue;
      const u = (y - fy0) / Math.max(1, fy1 - fy0);
      let col = o.face[Math.min(o.face.length - 1, Math.floor(u * o.face.length))];
      if (!F(x, y - 1) || !F(x, y - 2)) col = o.rim;
      else if (!F(x - 1, y) && o.passes > 1) col = mix(col, o.rim, 0.45);
      else if (!F(x, y + 1)) col = o.lower;
      put(x, y, col);
    }
    // snow: bright on top, blue in the creases
    for (let y = 0; y < chh; y++) for (let x = 0; x < cw; x++) {
      if (!snow[y * cw + x]) continue;
      const above = y > 0 && snow[(y - 1) * cw + x], below = y + 1 < chh && snow[(y + 1) * cw + x];
      put(x, y, !above ? '#ffffff' : !below ? '#b4c4ec' : '#e6eeff');
    }
    // the bare face as a mask, for the shine that sweeps across the logo
    const fm = gfx.makeCanvas(cw, chh), fmg = fm.getContext('2d');
    fmg.fillStyle = '#ffffff';
    for (let i = 0; i < face.length; i++) if (face[i] && !snow[i]) fmg.fillRect(i % cw, (i / cw) | 0, 1, 1);
    return { c, fm, w: cw, h: chh, base: oy + m.h, adv: m.w + (o.gap || 0), lift };
  }
  function buildWord(text, o) {
    const letters = [...text].map((ch) => (ch === ' ' ? { space: true, adv: o.space } : buildLetter(ch, o)));
    let x = 0;
    for (const L of letters) { L.x = x; x += L.adv; }
    return { letters, w: x - (o.gap || 0) };
  }
  let LOGO = null;
  function logoArt() {
    if (LOGO) return LOGO;
    LOGO = {
      // one smoothing pass then doubled: round shoulders on every stroke, no points
      main: buildWord('CHUBBY', { passes: 1, grow: 2, out: 2, depth: 6, snow: true, gap: 3, space: 12, ink: '#2a120c',
        face: ['#fff4b0', '#ffe46a', '#ffd23e', '#ffbe34', '#ffa62c', '#f58a24'], rim: '#fffbe6', lower: '#e0731c', side: ['#d0601e', '#8a2e12'] }),
      sub: buildWord('THE PORCUPINE', { passes: 1, out: 1, depth: 3, snow: false, gap: 1, space: 8, ink: '#150f1c',
        face: ['#fff8ea', '#fff0d4', '#ffe4bc'], rim: '#ffffff', lower: '#e8cda0', side: ['#2f9d86', '#1a5a4a'] }),
    };
    return LOGO;
  }

  // ---- the scene ----------------------------------------------------------------------------
  let ART = null;
  function sceneArt() {
    if (ART) return ART;
    const stars = makeStars();
    const sky = gfx.makeCanvas(W, H); paintSky(sky, stars);
    const T = {};
    ART = { stars, sky, hills: paintHills(), town: paintTown(T), T, near: paintNear(), cabin: paintCabin(), front: paintFront(), room: paintRoom() };
    // an aurora curtain: one column, soft at the top and bright at the hem
    ART.curtain = layer(1, 64, (g) => {
      for (let y = 0; y < 64; y++) { const u = y / 63; g.globalAlpha = Math.pow(u, 2.2) * (u > 0.94 ? 1 : 0.85); g.fillStyle = u > 0.95 ? '#d8ffe8' : u > 0.8 ? '#6affc0' : '#2ad0a0'; g.fillRect(0, y, 1, 1); }
    });
    ART.curtain2 = layer(1, 64, (g) => {
      for (let y = 0; y < 64; y++) { const u = y / 63; g.globalAlpha = Math.pow(u, 1.8) * 0.8; g.fillStyle = u > 0.9 ? '#c8a8ff' : u > 0.6 ? '#8a6aff' : '#5a3ad0'; g.fillRect(0, y, 1, 1); }
    });
    // three long, thin clouds
    ART.clouds = [0, 1, 2].map((i) => layer(150, 16, () => {
      const rng = new CH.Rng(90 + i);
      for (let k = 0; k < 11; k++) { const x = 12 + k * 12 + rng.int(-4, 4), y = 9 + rng.int(-2, 2), rx = rng.int(10, 20), ry = rng.int(2, 4); E(x, y, rx, ry, '#161c42'); }
      for (let k = 0; k < 11; k++) { const x = 12 + k * 12 + rng.int(-4, 4), y = 6 + rng.int(-1, 1), rx = rng.int(6, 14); E(x, y, rx, 1.4, '#3a4a8a'); }
    }));
    return ART;
  }

  class TitleScene extends CH.Scene {
    constructor() {
      super(); this.name = 'title';
      this.started = false;
      this.time = 0;
      this.menu = null;
      this.push = 0; this.pushing = false;
      this.snow = [];
      const rng = new CH.Rng(8);
      for (let i = 0; i < 170; i++) {
        const z = i < 80 ? 0 : i < 135 ? 1 : 2;
        this.snow.push({ x: rng.next() * (W + 40) - 20, y: rng.next() * H, z, sp: [11, 20, 34][z] * (0.8 + rng.next() * 0.4), ph: rng.next() * 6.28, sw: [2, 4, 7][z] * (0.6 + rng.next() * 0.8) });
      }
      this.smoke = [];
      this.zs = [];
      this.meteor = null; this.nextMeteor = 4 + Math.random() * 5;
      this.car = null; this.nextCar = 6;
      this.lightT = 2;
      this.letters = null;
    }
    enter() {
      sceneArt(); logoArt();
      fx.setFade(1); fx.fadeIn(1.6);
      ui.showMoney = false; ui.objective = ''; ui.objectiveShown = true;
      A.play('title', 2);
      this.buildMenu();
      // the letters drop in one after another and bounce
      this.letters = LOGO.main.letters.map((L, i) => ({ y: -90 - i * 14, vy: 0, delay: 0.5 + i * 0.09, sq: 0, landed: false }));
      this.subT = 0;
    }
    buildMenu() {
      const newest = CH.newestSlot();
      const info = newest === null ? null : CH.slotInfo(newest);
      const items = [];
      items.push({
        label: 'Continue',
        hint: info ? 'Day ' + info.day : null,
        disabled: !info,
        action: () => this.start(() => { CH.loadFrom(newest); CH.resumeChapter(); }),
      });
      items.push({ label: 'New Game', action: () => this.newGame() });
      items.push({
        label: 'Load Game',
        disabled: !CH.anySave(),
        action: () => CH.game.push(new CH.SaveMenuScene('load', () => this.buildMenu())),
      });
      items.push({ label: 'Controls', action: () => CH.game.push(new CH.ControlsScene()) });
      const w = 124;
      this.menu = new CH.MenuList(items, { x: Math.round(LOGO_CX - w / 2), y: 156, w, h: 20, gap: 6, sel: info ? 0 : 1 });
      this.lastSel = this.menu.sel;
    }
    newGame() {
      const begin = () => {
        CH.resetState();
        CH.game.set(new CH.CabinScene({ mode: 'intro' }));
      };
      if (CH.anySave()) { CH.game.push(new ConfirmNewGame(() => this.start(begin))); return; }
      this.start(begin);
    }
    // the camera pushes in through Chubby's window as the picture fades
    start(fn) {
      if (this.started) return;
      this.started = true;
      this.pushing = true;
      this.run((function* () {
        A.stop(0.8);
        yield 0.25;
        yield fx.fadeOut(0.95);
        fn();
        yield fx.fadeIn(0.9);
      })());
    }
    cam() { return Math.sin(this.time * 0.085) * DRIFT; }
    // light for the shader, in screen space - carried through the push-in zoom
    // so the glows stay on their windows as the camera closes in
    emit(x, y, r, c, a) {
      const z = this.zt;
      if (z) { x = z.bx + (x - z.ax) * z.k; y = z.by + (y - z.ay) * z.k; r *= z.k; }
      CH.emitScreen(x, y, r, c, a);
    }
    update(dt) {
      this.time += dt;
      const t = this.time;
      if (this.pushing) this.push = Math.min(1, this.push + dt / 1.2);
      // logo letters falling into place
      if (this.letters) this.letters.forEach((L) => {
        if (t < L.delay) return;
        if (!L.landed || Math.abs(L.vy) > 1 || L.y < 0) {
          L.vy += 1100 * dt; L.y += L.vy * dt;
          if (L.y >= 0) { L.y = 0; if (Math.abs(L.vy) > 60) { L.sq = Math.min(1, Math.abs(L.vy) / 500); L.vy = -L.vy * 0.32; if (!L.landed) A.sfx('thud'); L.landed = true; } else { L.vy = 0; L.landed = true; } }
        }
        L.sq = Math.max(0, L.sq - dt * 5);
      });
      if (t > 1.3) this.subT = Math.min(1, this.subT + dt * 3);
      if (!this.started && this.menu) {
        this.menu.update(dt);
        // a little shiver runs through the letters when the choice changes
        if (this.menu.sel !== this.lastSel && this.letters) { this.lastSel = this.menu.sel; this.letters.forEach((L, i) => { if (L.landed) { L.vy -= 90 + i * 12; L.landed = true; } }); }
      }
      // snowfall in three depths, pushed about by a slow wind
      const wind = 6 + Math.sin(t * 0.3) * 5;
      for (const s of this.snow) {
        s.y += s.sp * dt; s.x += (wind * [0.4, 0.8, 1.3][s.z] + Math.sin(t * 0.9 + s.ph) * s.sw) * dt;
        if (s.y > H + 3) { s.y = -3; s.x = Math.random() * (W + 40) - 20; }
        if (s.x > W + 20) s.x -= W + 40;
      }
      // chimney smoke from the cabin
      if (Math.random() < dt * 5) this.smoke.push({ x: CHIMNEY.x + 7 + (Math.random() - 0.5) * 4, y: CHIMNEY.top - 4, vx: 3 + Math.random() * 3, vy: -9 - Math.random() * 4, r: 2 + Math.random(), life: 0, max: 5 + Math.random() * 2 });
      for (const p of this.smoke) { p.life += dt; p.x += (p.vx + wind * 0.5) * dt; p.y += p.vy * dt; p.vy *= 1 - dt * 0.12; p.r += dt * 1.6; }
      this.smoke = this.smoke.filter((p) => p.life < p.max);
      // Zs drifting out of the window
      if (Math.random() < dt * 0.8 && this.zs.length < 4) this.zs.push({ life: 0, ph: Math.random() * 6.28, s: Math.random() < 0.3 ? 'z' : 'Z' });
      for (const z of this.zs) z.life += dt;
      this.zs = this.zs.filter((z) => z.life < 4.2);
      // a shooting star now and then
      this.nextMeteor -= dt;
      if (this.nextMeteor <= 0) { this.nextMeteor = 8 + Math.random() * 9; const dir = Math.random() < 0.5 ? -1 : 1; this.meteor = { x: 120 + Math.random() * 260, y: 14 + Math.random() * 40, vx: dir * (170 + Math.random() * 80), vy: 60 + Math.random() * 40, life: 0 }; }
      if (this.meteor) { const m = this.meteor; m.life += dt; m.x += m.vx * dt; m.y += m.vy * dt; if (m.life > 0.7) this.meteor = null; }
      // a car along the shore road, headlights on
      this.nextCar -= dt;
      if (this.nextCar <= 0 && !this.car) { this.nextCar = 16 + Math.random() * 14; const dir = Math.random() < 0.6 ? 1 : -1; this.car = { x: dir > 0 ? 120 : LW + 10, dir, col: ['#8a3a3a', '#3a5a8a', '#c8c0a8', '#4a6a4a'][Math.floor(Math.random() * 4)] }; }
      if (this.car) { this.car.x += this.car.dir * 20 * dt; if (this.car.x < 110 || this.car.x > LW + 20) this.car = null; }
      // the town going to bed, one window at a time (and the odd one coming back on)
      this.lightT -= dt;
      if (this.lightT <= 0) {
        this.lightT = 0.8 + Math.random() * 1.6;
        const W2 = ART.T.wins.filter((w) => !w.hut);
        const onN = W2.filter((w) => w.on).length;
        const pick = W2[Math.floor(Math.random() * W2.length)];
        if (pick) { if (pick.on && onN > W2.length * 0.45) pick.on = false; else if (!pick.on && Math.random() < 0.55) pick.on = true; }
      }
      for (const w of ART.T.wins) w.a += ((w.on ? 1 : 0) - w.a) * Math.min(1, dt * (w.on ? 3 : 1.5));
    }

    // ---- world layer (lit by the shader) ---------------------------------------------------
    draw(g) {
      const A2 = sceneArt(), T = A2.T, t = this.time, cam = this.cam();
      const off = (f) => -PAD - cam * f;
      // the push-in through the window
      const wcx = WIN.x + WIN.w / 2 + off(PAR.cabin), wcy = WIN.y + WIN.h / 2;
      const zk = this.push > 0 ? 1 + Math.pow(this.push, 2.2) * 3.4 : 1;
      g.save();
      // and the window glides to the middle of the frame as it comes closer
      this.zt = null;
      if (zk > 1) {
        const e = CH.ease.inOutCubic(this.push), bx = wcx + (W / 2 - wcx) * e, by = wcy + (H / 2 - wcy) * e;
        this.zt = { k: zk, ax: wcx, ay: wcy, bx, by };
        g.translate(bx, by); g.scale(zk, zk); g.translate(-wcx, -wcy);
      }

      // sky, stars, aurora, moon, clouds
      g.drawImage(A2.sky, 0, 0);
      for (const s of A2.stars) {
        if (!s.live) continue;
        const a = s.b * (0.62 + 0.38 * Math.sin(t * s.sp + s.ph));
        withA(a, () => { P1(s.x, s.y, s.c); if (s.big) { withA(0.45, () => { P1(s.x - 1, s.y, s.c); P1(s.x + 1, s.y, s.c); P1(s.x, s.y - 1, s.c); P1(s.x, s.y + 1, s.c); }); } });
      }
      this.drawAurora(g, t);
      this.drawMoon(g, t);
      if (this.meteor) {
        const m = this.meteor, k = 1 - m.life / 0.7;
        for (let i = 0; i < 14; i++) withA(k * (1 - i / 14), () => P1(Math.round(m.x - m.vx * i * 0.006), Math.round(m.y - m.vy * i * 0.006), i < 2 ? '#ffffff' : '#bcd4ff'));
        this.emit(m.x, m.y, 4, '#dfe8ff', 0.5 * k);
      }
      A2.clouds.forEach((c, i) => {
        const x = ((i * 190 + t * (2 + i * 0.7)) % (W + 170)) - 160, y = [22, 58, 84][i];
        withA(0.78, () => g.drawImage(c, Math.round(x), y));
      });

      // the hills
      g.drawImage(A2.hills, off(PAR.mtn), 0);

      // the town across the lake
      g.save(); g.translate(off(PAR.town), 0);
      g.drawImage(A2.town, 0, 0);
      this.drawTown(g, t, off(PAR.town));
      g.restore();
      this.drawFlakes(g, 0, cam);

      // the near bank
      g.drawImage(A2.near, off(PAR.near), 0);
      this.drawFlakes(g, 1, cam);

      // the cabin, with Chubby asleep behind the window
      g.save(); g.translate(off(PAR.cabin), 0);
      g.drawImage(A2.cabin, 0, 0);
      this.drawCabin(g, t, off(PAR.cabin));
      g.restore();

      g.drawImage(A2.front, off(PAR.front), 0);
      this.drawFlakes(g, 2, cam);
      g.restore();

      // moonlight for the shader: rays from the moon, and a cool night grade
      if (CH.post) {
        const z = this.zt, mx = z ? z.bx + (MOON.x - z.ax) * z.k : MOON.x, my = z ? z.by + (MOON.y - z.ay) * z.k : MOON.y;
        CH.post.sun = { x: mx / W, y: my / H, horizon: 0.6, k: 0.55 * (1 - this.push), color: [0.72, 0.84, 1.0] };
        CH.post.mood = { tint: [0.92, 0.96, 1.1], vib: 0.3, lift: 0.03, glowK: 1.5 };
      }
      CH.drawUI(g, (u) => this.drawTitleUI(u));
    }
    drawAurora(g, t) {
      const A2 = sceneArt();
      for (let x = 0; x < W; x += 2) {
        const base = 84 + 9 * Math.sin(x * 0.012 + t * 0.12) + 5 * Math.sin(x * 0.037 - t * 0.21);
        const hh = 30 + 12 * Math.sin(x * 0.021 + t * 0.17) + 6 * Math.sin(x * 0.07 + t * 0.4);
        let k = 0.34 + 0.24 * Math.sin(x * 0.018 - t * 0.25) + 0.12 * Math.sin(x * 0.061 + t * 0.6);
        k *= 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(x * 0.53 + t * 1.1)) * (0.6 + 0.4 * Math.sin(x * 0.19 - t * 0.7));
        if (k > 0.04) { g.globalAlpha = Math.min(0.75, k); g.drawImage(A2.curtain, 0, 0, 1, 64, x, Math.round(base - hh), 2, Math.round(hh)); }
        const b2 = 56 + 7 * Math.sin(x * 0.016 - t * 0.1 + 2), h2 = 22 + 8 * Math.sin(x * 0.03 + t * 0.2);
        let k2 = 0.22 + 0.2 * Math.sin(x * 0.024 + t * 0.19 + 1);
        if (x > 150 && k2 > 0.05) { g.globalAlpha = Math.min(0.5, k2); g.drawImage(A2.curtain2, 0, 0, 1, 64, x, Math.round(b2 - h2), 2, Math.round(h2)); }
      }
      g.globalAlpha = 1;
      for (let i = 0; i < 7; i++) { const x = 40 + i * 66; this.emit(x, 80 + 8 * Math.sin(x * 0.012 + t * 0.12), 16, '#3affb0', 0.1); }
    }
    drawMoon(g, t) {
      const { x, y, r } = MOON;
      withA(0.06, () => E(x, y, r + 22, r + 22, '#b8c8ff'));
      withA(0.1, () => E(x, y, r + 11, r + 11, '#b8c8ff'));
      withA(0.22, () => E(x, y, r + 4, r + 4, '#d8e2ff'));
      E(x, y, r, r, '#f6f2de');
      E(x + 3, y + 3, r - 3, r - 3, '#ebe5cc');
      E(x - 4, y - 3, 3, 2.5, '#dcd4b8'); E(x + 4, y + 4, 4, 3, '#d8d0b2'); E(x + 5, y - 5, 2, 2, '#ddd6ba'); E(x - 5, y + 6, 2, 1.5, '#dad2b6'); P1(x - 1, y + 1, '#d6ceb0');
      E(x - 4, y - 5, 5, 3, '#fffbee');
      this.emit(x, y, 22, '#d0e0ff', 0.5);
      this.emit(x, y, 9, '#ffffff', 0.5);
    }
    drawTown(g, t, ox) {
      const T = sceneArt().T;
      // lit windows (and one TV, flickering blue)
      for (const w of T.wins) {
        if (w.a < 0.03) continue;
        let col = w.col, a = w.a;
        if (w.tv) { col = Math.sin(t * 7 + w.ph) > 0.3 ? '#9fdcff' : '#6a9adc'; }
        else a *= 0.9 + 0.1 * Math.sin(t * 1.3 + w.ph);
        withA(a, () => R(w.x, w.y, w.w, w.h, col));
        if (a > 0.3) this.emit(w.x + w.w / 2 + ox, w.y + w.h / 2, w.hut ? 5 : 3.2, col, 0.5 * a);
      }
      // street lamps: a warm pool on the snow and a glow for the shader
      for (const L of T.lamps) {
        withA(0.9, () => R(L.x - 1, L.y, 3, 1, '#ffe6a0'));
        withA(0.14, () => E(L.x, GROUND + 1, 6, 1.5, '#ffd98a'));
        this.emit(L.x + ox, L.y, 4, '#ffcf7a', 0.55);
      }
      // the clock on the town hall - a quarter to three, the town asleep
      const C = T.clock;
      E(C.x, C.y, C.r, C.r, '#2a2030'); E(C.x, C.y, C.r - 1, C.r - 1, '#f4e8c0');
      gfx.line(C.x, C.y, C.x, C.y - 2, '#3a2a20'); gfx.line(C.x, C.y, C.x + 2, C.y + 1, '#3a2a20');
      this.emit(C.x + ox, C.y, 6, '#ffe8b0', 0.45);
      // the Moose Inn's neon
      const inn = T.inn, buzz = Math.sin(t * 13) > -0.92 ? 1 : 0.3;
      withA(buzz, () => gfx.text('INN', inn.x, inn.y, '#ff5a7a', { align: 'center', font: 'tiny' }));
      this.emit(inn.x + ox, inn.y + 1, 8, '#ff4a6a', 0.45 * buzz);
      // the big D, glowing over Donald's
      const D = T.dsign;
      gfx.rrect(D.x - 1, D.y - 1, D.w + 2, D.h + 2, 3, '#4a1010');
      gfx.rrect(D.x, D.y, D.w, D.h, 3, '#d83a2a');
      gfx.text('D', D.x + D.w / 2, D.y + 3, '#ffd84a', { align: 'center' });
      this.emit(D.x + D.w / 2 + ox, D.y + D.h / 2, 11, '#ff5a2a', 0.6);
      this.emit(D.x + D.w / 2 + ox, D.y + D.h / 2, 5, '#ffd84a', 0.5);
      // the radio mast's red light, slow and steady
      const blink = (t % 1.6) < 0.5;
      if (blink) { R(T.mast.x - 1, T.mast.y, 2, 2, '#ff3a3a'); this.emit(T.mast.x + ox, T.mast.y + 1, 4, '#ff2a2a', 0.8); }
      else R(T.mast.x - 1, T.mast.y, 2, 2, '#5a1a1a');
      // town chimneys
      for (let i = 0; i < T.smokes.length; i += 1) {
        const s = T.smokes[i];
        for (let k = 0; k < 4; k++) { const u = ((t * 0.18 + k * 0.25 + i * 0.37) % 1); withA(0.28 * (1 - u), () => E(s.x + u * 9 + Math.sin(u * 5 + i) * 1.5, s.y - u * 14, 1 + u * 2.4, 1 + u * 1.8, '#6a74a0')); }
      }
      // a car on the shore road
      if (this.car) {
        const c = this.car, x = Math.round(c.x), y = GROUND - 2, d = c.dir;
        R(x - 4, y - 2, 9, 3, c.col); R(x - 2, y - 4, 5, 2, c.col); R(x - 1, y - 3, 3, 1, '#1a2040');
        R(d > 0 ? x + 5 : x - 5, y - 1, 1, 1, '#fff6d0'); R(d > 0 ? x - 5 : x + 5, y - 1, 1, 1, '#ff3a3a');
        withA(0.18, () => { for (let k = 1; k < 16; k++) R(d > 0 ? x + 5 + k : x - 5 - k, y - 1 - Math.floor(k / 6), 1, 1 + Math.floor(k / 5), '#fff2c0'); });
        this.emit(x + (d > 0 ? 7 : -7) + ox, y - 1, 5, '#fff2c0', 0.55);
      }
      // reflections in the ice: the moon's broken column, and the lights along the shore
      const mx = MOON.x - ox;
      for (let y = LAKE.top + 2; y < LAKE.bot + 10; y += 2) {
        const u = (y - LAKE.top) / (LAKE.bot - LAKE.top), w = Math.round(3 + u * 7 + Math.sin(t * 2 + y) * 1.5);
        withA(0.3 * (1 - u * 0.6), () => R(Math.round(mx - w / 2 + Math.sin(t * 1.4 + y * 0.7) * 1.5), y, w, 1, '#c8d6ff'));
      }
      for (const L of T.lamps) for (let k = 0; k < 5; k++) withA(0.22 * (1 - k / 5), () => R(L.x, LAKE.top + 3 + k * 3 + (Math.sin(t * 2 + k + L.x) > 0 ? 1 : 0), 1, 2, '#ffd98a'));
      for (let k = 0; k < 6; k++) withA(0.3 * (1 - k / 6), () => R(D.x + D.w / 2 - 1, LAKE.top + 3 + k * 3, 2, 2, k % 2 ? '#ffd84a' : '#ff5a3a'));
    }
    drawCabin(g, t, ox) {
      const A2 = sceneArt();
      // the room: wall, then the bed and Chubby, asleep and breathing
      const rc = this.roomCanvas || (this.roomCanvas = gfx.makeCanvas(WIN.w, WIN.h));
      const rg = rc.getContext('2d');
      rg.clearRect(0, 0, WIN.w, WIN.h);
      rg.drawImage(A2.room, 0, 0);
      gfx.pushTarget(rg);
      try {
        if (CH.PROPS && CH.PROPS.bed) CH.PROPS.bed.draw(rg, -10, 62, t, {});
        const br = Math.sin(t * 1.7);
        CH.drawChubby(rg, 27, 42, { sitting: true, sleep: true, face: 'sleep', outfit: 'hoodie', noShadow: true, arm: 'pocket', headDX: -2, headDY: 3 + Math.round(br * 0.6), blink: false, sy: 1 + br * 0.018, sx: 1 - br * 0.01 });
        // the lamp's warm light over everything in the room
        rg.save(); rg.globalCompositeOperation = 'soft-light'; rg.globalAlpha = 0.2; gfx.ellipse(6, 24, 40, 30, '#ffb050'); rg.restore();
      } finally { gfx.popTarget(); }
      g.drawImage(rc, WIN.x, WIN.y);
      // the window's glass and frame over the room
      const { x, y, w, h } = WIN;
      withA(0.12, () => { for (let i = 0; i < 22; i++) { P1(x + 6 + i * 0.7, y + h - 4 - i, '#ffffff'); P1(x + 7 + i * 0.7, y + h - 4 - i, '#ffffff'); } });
      withA(0.5, () => { for (const [fx0, fy0, sx, sy] of [[x, y, 1, 1], [x + w - 1, y, -1, 1], [x, y + h - 1, 1, -1], [x + w - 1, y + h - 1, -1, -1]]) for (let i = 0; i < 6; i++) for (let j = 0; j < 6 - i; j++) if ((i * 7 + j * 3) % 4 !== 1) P1(fx0 + sx * i, fy0 + sy * j, '#e8f0ff'); });
      R(x + w / 2 - 1, y, 2, h, '#8a5a34'); gfx.vline(x + w / 2 - 1, y, h, '#b07a48');
      R(x, y + h / 2 - 1, w, 2, '#8a5a34'); gfx.hline(x, y + h / 2 - 1, w, '#b07a48');
      // the glow spills round the frame rather than washing over the glass
      this.emit(x + w / 2 + ox, y + h / 2, 34, '#ffb060', 0.16);
      this.emit(x + w / 2 + ox, y + h + 6, 18, '#ffc070', 0.2);
      // the attic window, dimly lit, and the lantern by the door
      withA(0.85, () => E(CAB.attic.x, CAB.attic.y, 4.5, 4.5, '#e8a860'));
      this.emit(CAB.attic.x + ox, CAB.attic.y, 6, '#ffb060', 0.3);
      const fl = 0.85 + Math.sin(t * 9) * 0.08 + Math.sin(t * 23) * 0.05;
      withA(fl, () => R(CAB.lantern.x - 1, CAB.lantern.y - 2, 3, 5, '#ffe6a0'));
      this.emit(CAB.lantern.x + ox, CAB.lantern.y, 9, '#ffc870', 0.6 * fl);
      // smoke from the chimney, lit by the moon
      for (const p of this.smoke) {
        const u = p.life / p.max, a = 0.34 * Math.min(1, p.life * 2) * (1 - u);
        withA(a, () => E(p.x, p.y, p.r, p.r * 0.8, '#8a94c0'));
        withA(a * 0.7, () => E(p.x - p.r * 0.3, p.y - p.r * 0.35, p.r * 0.5, p.r * 0.35, '#c8d2f0'));
      }
      // Zs drifting up out of the window into the night
      for (const z of this.zs) {
        const u = z.life / 4.2, zx = x + w - 10 + u * 70 + Math.sin(z.life * 2 + z.ph) * 3, zy = y + 2 - u * 64;
        withA(Math.min(1, z.life * 2) * (1 - u) * 0.9, () => gfx.text(z.s, Math.round(zx), Math.round(zy), '#f4f0ff', { outline: '#2a2450' }));
      }
    }
    drawFlakes(g, z, cam) {
      const f = [0.3, 0.8, 1.4][z];
      for (const s of this.snow) {
        if (s.z !== z) continue;
        const x = Math.round(s.x - cam * f), y = Math.round(s.y);
        if (z === 0) withA(0.55, () => P1(x, y, '#dfe8ff'));
        else if (z === 1) { withA(0.85, () => R(x, y, 1 + (s.ph > 3 ? 1 : 0), 1 + (s.ph > 3 ? 1 : 0), '#f0f4ff')); }
        else { withA(0.9, () => R(x, y, 2, 2, '#ffffff')); withA(0.35, () => { R(x - 1, y, 1, 2, '#ffffff'); R(x + 2, y, 1, 2, '#ffffff'); R(x, y - 1, 2, 1, '#ffffff'); R(x, y + 2, 2, 1, '#ffffff'); }); }
      }
    }

    // ---- UI layer: letterbox, logo, menu ------------------------------------------------------
    drawTitleUI(g) {
      const t = this.time, fade = 1 - Math.min(1, this.push * 3);
      // the letterbox closes in as the film starts
      const bar = Math.round(10 * Math.min(1, t / 1.2));
      R(0, 0, W, bar, '#000000'); R(0, H - bar, W, bar, '#000000');
      if (fade <= 0) return;
      g.save(); g.globalAlpha = fade;
      this.drawLogo(g, t);
      this.drawMenu(g, t);
      if (t > 2 && CH.game.scene === this) withA(Math.min(1, (t - 2) * 2), () => gfx.text('↑↓ choose    Enter pick    M mute', W / 2, H - 8, '#8a84a8', { align: 'center', font: 'small' }));
      g.restore();
    }
    drawLogo(g, t) {
      const L = logoArt(), top = 20;
      const x0 = Math.round(LOGO_CX - L.main.w / 2);
      L.main.letters.forEach((ch, i) => {
        const st = this.letters && this.letters[i];
        if (!st || t < st.delay) return;
        const bob = st.landed ? Math.round(Math.sin(t * 2.1 - i * 0.6) * 1.5) : 0;
        const x = x0 + ch.x - 3, y = Math.round(top + st.y + bob);
        if (st.sq > 0.01) {
          // squash on landing, anchored at the letter's feet
          const sx = 1 + st.sq * 0.18, sy = 1 - st.sq * 0.16, fy = y + ch.base;
          g.save(); g.translate(x + ch.w / 2, fy); g.scale(sx, sy); g.drawImage(ch.c, -ch.w / 2, -ch.base); g.restore();
        } else {
          g.drawImage(ch.c, x, y);
          // every few seconds a shine runs across the letters
          const sw = (t - 3.2) % 6.5;
          if (t > 3.2 && sw < 0.9) {
            const sx = -30 + (sw / 0.9) * (L.main.w + 60) - ch.x;
            const sc = ch.sc || (ch.sc = gfx.makeCanvas(ch.w, ch.h)), sg = sc.getContext('2d');
            sg.globalCompositeOperation = 'source-over'; sg.clearRect(0, 0, ch.w, ch.h); sg.fillStyle = '#ffffff';
            for (let yy = 0; yy < ch.h; yy++) { const bx = Math.round(sx + yy * 0.45); sg.fillRect(bx, yy, 5, 1); sg.fillRect(bx + 8, yy, 2, 1); }
            sg.globalCompositeOperation = 'destination-in'; sg.drawImage(ch.fm, 0, 0);
            sg.globalCompositeOperation = 'source-over';
            withA(0.75, () => g.drawImage(sc, x, y));
          }
        }
      });
      // THE PORCUPINE pops in underneath, with the tagline
      if (this.subT > 0) {
        const k = CH.ease.outBack(this.subT), sw = L.sub.w, sx0 = Math.round(LOGO_CX - sw / 2), sy = top + 44;
        g.save(); g.translate(LOGO_CX, sy + 10); g.scale(k, k); g.translate(-LOGO_CX, -(sy + 10));
        for (const ch of L.sub.letters) if (!ch.space) g.drawImage(ch.c, sx0 + ch.x - 1, sy + 9);
        g.restore();
        withA(this.subT, () => gfx.text('a life & job simulator', LOGO_CX, sy + 33, '#dce6ff', { align: 'center', outline: '#150f1c' }));
      }
    }
    drawMenu(g, t) {
      const m = this.menu;
      if (!m) return;
      m.items.forEach((it, i) => {
        const r = m.rect(i);
        const inT = CH.clamp((t - 1.5 - i * 0.08) / 0.35, 0, 1);
        if (inT <= 0) return;
        const slide = Math.round((1 - CH.ease.outBack(inT)) * 90);
        const sel = i === m.sel && !it.disabled;
        const lift = sel ? 2 + Math.round(Math.sin(t * 5) * 0.8) : 0;
        const x = r.x + slide, y = r.y - lift, w = r.w, h = r.h;
        if (it.disabled) {
          // nothing to continue or load yet: a quiet pane of frosted glass
          withA(0.4, () => gfx.rrect(x - 1, y - 1, w + 2, h + 2, 9, '#8a9ad4'));
          withA(0.72, () => gfx.rrect(x, y, w, h, 8, '#0e1230'));
          withA(0.25, () => gfx.rrect(x + 5, y + 2, w - 10, 1, 1, '#c8d6ff'));
          gfx.text(it.label, x + w / 2, y + 5, '#5e6a9e', { align: 'center' });
          return;
        }
        withA(0.45, () => gfx.rrect(x + 2, r.y + 3, w, h, 8, '#06040e'));
        gfx.rrect(x - 1, y - 1, w + 2, h + 2, 9, '#150f1c');
        gfx.rrect(x, y, w, h, 8, sel ? '#d8922a' : '#c8bda6');
        gfx.rrect(x, y, w, h - 3, 8, sel ? '#ffd84a' : '#f6f0e2');
        withA(sel ? 0.8 : 0.6, () => gfx.rrect(x + 5, y + 2, w - 10, 2, 1, sel ? '#fff4b0' : '#ffffff'));
        // fresh snow settles on the chosen one, in soft round lumps
        if (sel) {
          gfx.rrect(x + 3, y - 2, w - 6, 4, 2, '#ffffff');
          for (let k = 0; k <= w - 18; k += 7) E(x + 9 + k, y - 2, 3.5, 2 + Math.sin(k * 0.9 + i) * 0.6, '#ffffff');
          gfx.hline(x + 5, y + 2, w - 10, '#d4e0fa');
        }
        const tc = sel ? '#2a1a0c' : '#4a4256';
        gfx.text(it.label, x + w / 2 - (it.hint ? 10 : 0), y + 5, tc, { align: 'center' });
        if (it.hint) gfx.text(it.hint, x + w - 8, y + 8, sel ? '#7a4a10' : '#8a8090', { align: 'right', font: 'small' });
        if (sel) gfx.text('▶', x + 9 + Math.round(Math.sin(t * 8) * 1.5), y + 5, '#2a1a0c');
      });
    }
  }
  CH.TitleScene = TitleScene;
  CH.SCENES = CH.SCENES || {};
  CH.SCENES.title = () => new TitleScene();

  // ---- "start over?" confirmation -------------------------------------------
  class ConfirmNewGame extends CH.Scene {
    constructor(onYes) {
      super(); this.name = 'confirm'; this.overlay = true;
      this.onYes = onYes; this.yes = false;
    }
    rects() {
      return [{ x: W / 2 - 74, y: 150, w: 68, h: 16 }, { x: W / 2 + 6, y: 150, w: 68, h: 16 }];
    }
    update() {
      const [yr, nr] = this.rects();
      if (inp.hit('left') || inp.hit('right')) { this.yes = !this.yes; A.sfx('blip2'); }
      if (inp.mouseIn(yr)) { ui.cursor = 'hand'; if (inp.mmoved) this.yes = true; if (inp.mpressed) { inp.eat(); this.pick(true); return; } }
      if (inp.mouseIn(nr)) { ui.cursor = 'hand'; if (inp.mmoved) this.yes = false; if (inp.mpressed) { inp.eat(); this.pick(false); return; } }
      if (inp.hit('confirm') || inp.hit('interact')) { inp.eat(); this.pick(this.yes); return; }
      if (inp.hit('cancel')) { inp.eat(); this.pick(false); }
    }
    pick(yes) {
      A.sfx(yes ? 'select' : 'back');
      CH.game.pop();
      if (yes) this.onYes();
    }
    draw(g) {
      CH.menuDim(0.66);
      CH.menuPanel(W / 2 - 116, 102, 232, 80, 'NEW GAME');
      gfx.text('Start a new game?', W / 2, 120, '#f2ecd8', { align: 'center' });
      gfx.text('Your saved slots are kept.', W / 2, 134, '#b0a6c0', { align: 'center', font: 'small' });
      const [yr, nr] = this.rects();
      for (const [r, lab, on] of [[yr, 'Start', this.yes], [nr, 'Back', !this.yes]]) {
        gfx.rrect(r.x - 1, r.y - 1, r.w + 2, r.h + 2, 5, '#150f1c');
        gfx.rrect(r.x, r.y, r.w, r.h, 4, on ? '#f5d76b' : '#f3eee2');
        gfx.text(lab, r.x + r.w / 2, r.y + 4, on ? '#221a2c' : '#5a5266', { align: 'center' });
      }
    }
  }

  // route into the right scene for the saved chapter
  CH.resumeChapter = () => {
    const ch = S.chapter;
    if (ch === 'intro') CH.game.set(new CH.CabinScene({ mode: 'intro' }));
    else if (ch === 'emergency') { const c = new CH.CabinScene({ mode: 'intro' }); c.tvMode = 'static'; CH.game.set(c); c.cos = []; CH.flag('atePancakes', true); c.pancakes.st.eaten = true; c.stove.st.steam = false; c.player.x = 880; CH.beginEmergency(c); }
    else if (ch === 'hospital') CH.game.set(new CH.HospitalScene());
    else if (ch === 'jobsearch' && CH.startJobSearch) CH.startJobSearch();
    else if (ch === 'interview' && CH.startInterviewDay) CH.startInterviewDay();
    else if (ch === 'career' && CH.startCareerDay) CH.startCareerDay();
    else CH.game.set(new CH.CabinScene({ mode: 'intro' }));
  };
})(window.CH);
