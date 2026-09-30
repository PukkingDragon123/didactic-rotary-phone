// ============================================================================
// STREET FRONTS - the outside of every building in Moose Hollow
//
// Each business on Main Street has its own architecture: brick blocks with
// cornices and arched windows, wooden false fronts with porches, gabled
// fronts with bay windows, fieldstone and half-timber, flat modern fronts.
// Every one has lit windows, goods in the display glass, a proper awning or
// porch, snow on the ledges and icicles under the eaves. The row of houses
// behind the street, Donald's, the cabin and every window view are painted
// here with the same kit and the hand-drawn pixel pines.
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, PX = CH.PIX, K = CH.IK, art = CH.art;
  const R = gfx.rect, P1 = gfx.px, HL = gfx.hline, VL = gfx.vline, E = gfx.ellipse, mix = gfx.mix, sh = gfx.shade;
  const rng = K.rng, withA = K.withA, draw = (n, x, y, o) => PX.draw(n, x, y, o);
  const pal = () => CH.curPal || (CH.skyAt ? CH.skyAt(CH.state.hour || 9) : null);

  // ---- snow ---------------------------------------------------------------------
  // a lumpy drift: noise along the top, a lit crest, a blue shadow underneath
  K.drift = (x, yb, w, h, p, seed = 1) => {
    const r = rng(seed), hi = p ? p.snowHi : '#ffffff', mid = p ? p.snow : '#e9f0f8', lo = p ? p.snowSh : '#c2d2e6';
    let v = 0;
    for (let i = 0; i < w; i++) {
      v += (r.next() - 0.5) * 0.9; v *= 0.9;
      const u = i / (w - 1), env = Math.sin(u * Math.PI);
      const hh = Math.max(1, Math.round(h * (0.35 + env * 0.65) + v));
      VL(x + i, yb - hh, hh, mid);
      P1(x + i, yb - hh, hi);
      if (hh > 2) P1(x + i, yb - hh + 1, mix(hi, mid, 0.5));
      if (hh > 3) P1(x + i, yb - 1, lo);
    }
  };
  K.icicles = (x, y, w, seed = 3) => {
    const r = rng(seed);
    for (let i = x + 1; i < x + w - 1; i += 2 + r.int(0, 3)) {
      const l = 1 + r.int(0, 4);
      VL(i, y, l, 'rgba(214,236,248,0.92)'); P1(i, y, '#ffffff');
      if (l > 3) P1(i, y + l, 'rgba(255,255,255,0.7)');
    }
  };
  K.ledgeSnow = (x, y, w, p) => { HL(x, y - 1, w, p ? p.snowHi : '#ffffff'); for (let i = x; i < x + w; i += 3) P1(i + 1, y - 2, p ? p.snow : '#e9f0f8'); };

  // ---- materials, at the scale of a whole building ---------------------------------
  const siding = (x, y, w, h, c, seed = 1) => {
    const m = K.ramp(c);
    R(x, y, w, h, m.m);
    for (let yy = y + 1; yy < y + h; yy += 3) { HL(x, yy, w, m.l); HL(x, yy + 2, w, m.d); }
    K.speck(x, y, w, h, m.dd, 0.4, seed, (w * h) / 40);
  };
  const stoneWall = (x, y, w, h, c, seed = 1) => {
    const r = rng(seed), mortar = mix(c, '#d8d0c0', 0.5);
    R(x, y, w, h, mortar);
    for (let yy = y; yy < y + h; yy += 5) {
      let xx = x - r.int(0, 5);
      while (xx < x + w) {
        const sw = r.int(5, 10), cc = sh(c, r.int(-18, 14));
        R(xx + 1, yy, sw - 1, 4, cc); P1(xx + 1, yy, mortar); P1(xx + sw - 1, yy + 3, mortar);
        HL(xx + 2, yy, sw - 3, sh(cc, 18)); P1(xx + 1, yy + 1, sh(cc, 10)); HL(xx + 2, yy + 3, sw - 3, sh(cc, -16));
        xx += sw;
      }
    }
  };
  const panels = (x, y, w, h, c) => {
    const m = K.ramp(c);
    R(x, y, w, h, m.m);
    for (let xx = x; xx < x + w; xx += 8) { VL(xx, y, h, m.d); VL(xx + 1, y, h, m.l); for (let yy = y + 4; yy < y + h; yy += 12) P1(xx + 4, yy, m.dd); }
  };
  const plasterTimber = (x, y, w, h, c) => {
    R(x, y, w, h, '#efe6d2'); K.speck(x, y, w, h, '#d8ccb4', 0.6, 5, (w * h) / 12);
    const m = K.ramp(c);
    R(x, y, w, 3, m.m); R(x, y + h - 3, w, 3, m.m);
    for (let xx = x; xx < x + w; xx += 20) { R(xx, y, 3, h, m.m); VL(xx, y, h, m.l); }
    for (let xx = x; xx + 20 <= x + w; xx += 20) { for (let j = 0; j < h - 6; j++) { P1(xx + 3 + Math.round(j * 17 / (h - 6)), y + 3 + j, m.d); P1(xx + 3 + Math.round(j * 17 / (h - 6)), y + 2 + j, m.m); } }
  };
  const body = (kind, x, y, w, h, c, seed) => {
    if (kind === 'brick') K.brick(x, y, w, h, c, { seed, bw: 7, bh: 3 });
    else if (kind === 'stone') stoneWall(x, y, w, h, c, seed);
    else if (kind === 'panel') panels(x, y, w, h, c);
    else if (kind === 'block') K.blocks(x, y, w, h, c);
    else if (kind === 'timber') plasterTimber(x, y, w, h, c);
    else siding(x, y, w, h, c, seed);
  };

  // ---- windows -----------------------------------------------------------------
  // an upper-storey window: frame, glass lit from inside at night, curtains, sill
  const upperWin = (x, y, w, h, o, p, r) => {
    const tm = K.ramp(o.frame || '#e8e2d6');
    const lit = p.win > 0.35 && r.chance(0.72);
    if (o.arch) { for (let j = 0; j < 4; j++) HL(x - 1 + (j < 2 ? 2 - j : 0), y - 4 + j, w + 2 - (j < 2 ? (2 - j) * 2 : 0), tm.m); P1(x + (w >> 1), y - 5, tm.h); }
    R(x - 2, y - 1, w + 4, h + 2, tm.m); HL(x - 2, y - 1, w + 4, tm.h);
    const glass = lit ? mix('#3a4a66', '#ffd98a', p.win) : mix('#2e3c52', p.sky[2], 0.3);
    R(x, y, w, h, glass);
    if (lit) { R(x, y, 2, h, mix('#c86a3a', '#ffd98a', 0.35)); R(x + w - 2, y, 2, h, mix('#c86a3a', '#ffd98a', 0.35)); if (r.chance(0.3)) { E(x + (w >> 1), y + h - 3, 2, 3, mix('#3a2a1a', '#ffd98a', 0.25)); } }
    else { P1(x + 1, y + 1, mix('#ffffff', p.sky[3], 0.4)); P1(x + 2, y + 1, mix('#ffffff', p.sky[3], 0.6)); }
    VL(x + (w >> 1), y, h, tm.m); HL(x, y + (h >> 1), w, tm.m);
    if (o.shutters) { const sm = K.ramp(o.shutters); for (const sx of [x - 5, x + w + 2]) { R(sx, y - 1, 3, h + 2, sm.m); for (let j = y + 1; j < y + h; j += 2) HL(sx, j, 3, sm.d); } }
    R(x - 3, y + h + 1, w + 6, 2, tm.l); HL(x - 3, y + h + 2, w + 6, tm.dd);
    if (o.box) { R(x - 2, y + h + 3, w + 4, 4, '#6a4424'); HL(x - 2, y + h + 3, w + 4, '#8a5a2b'); for (let i = x - 1; i < x + w + 2; i += 2) { P1(i, y + h + 2, '#2f6a24'); P1(i + 1, y + h + 1, '#3a7a2c'); } for (let i = x + 1; i < x + w; i += 4) P1(i, y + h + 1, '#d8263a'); }
    K.ledgeSnow(x - 3, y + h + 1, w + 6, p);
  };
  // a big display window with a transom, lit shop behind it and goods on show
  const displayWin = (x, y, w, h, o, p) => {
    const fm = K.ramp(o.frame || '#3a3440');
    R(x - 2, y - 7, w + 4, h + 9, fm.m); HL(x - 2, y - 7, w + 4, fm.h); VL(x - 2, y - 7, h + 9, fm.l); VL(x + w + 1, y - 7, h + 9, fm.dd);
    // transom panes
    for (let i = 0; i < w; i += 7) R(x + i, y - 5, Math.min(6, w - i), 3, p.win > 0.35 ? mix('#4a5a76', '#ffe8b4', p.win) : mix('#3d5a74', p.sky[3], 0.3));
    // the shop inside: warm light, a back wall, shelves
    const glow = p.win > 0.3 ? mix('#5a4a3a', '#ffd9a0', 0.35 + p.win * 0.45) : mix('#4a5a6a', '#d8c8a8', 0.25);
    gfx.vgrad(x, y, w, h, [sh(glow, 16), glow, sh(glow, -20)]);
    for (let yy = y + 6; yy < y + h - 4; yy += 8) HL(x, yy, w, sh(glow, -30));
    for (let yy = y + 6; yy < y + h - 4; yy += 8) for (let i = x + 2; i < x + w - 2; i += 3 + ((i * 7 + yy) % 3)) R(i, yy - 3, 2, 3, sh(glow, -24 - ((i * 13) % 20)));
    if (o.goods) o.goods(x, y, w, h);
    // reflection of the street in the glass
    withA(0.22, () => { for (let i = 0; i < h - 2; i++) { P1(x + 3 + Math.round(i * 0.5), y + h - 2 - i, '#ffffff'); P1(x + 4 + Math.round(i * 0.5), y + h - 2 - i, '#ffffff'); } });
    withA(0.12, () => R(x, y, w, 3, p.sky[3]));
    if (o.mullion !== false) { VL(x + (w >> 1), y, h, fm.m); }
    // sill and bulkhead below
    R(x - 3, y + h + 2, w + 6, 2, fm.l); K.ledgeSnow(x - 3, y + h + 2, w + 6, p);
    const bm = K.ramp(o.bulk || sh(o.frame || '#3a3440', 20));
    R(x - 2, y + h + 4, w + 4, o.bulkH || 9, bm.m);
    for (let i = x; i + 10 <= x + w; i += 12) { R(i, y + h + 6, 10, (o.bulkH || 9) - 4, bm.d); HL(i, y + h + 6, 10, bm.dd); HL(i, y + h + (o.bulkH || 9) + 1, 10, bm.l); }
  };
  // the front door, set back in its frame, with a wreath for the season
  const frontDoor = (x, yb, w, h, c, o, p) => {
    const m = K.ramp(c);
    R(x - 2, yb - h - 3, w + 4, h + 3, sh(c, -46));
    R(x, yb - h, w, h, m.m); VL(x, yb - h, h, m.l); VL(x + w - 1, yb - h, h, m.dd);
    const gl = p.win > 0.3 ? mix('#4a5a76', '#ffe0a0', p.win) : mix('#2a3a4e', p.sky[3], 0.25);
    R(x + 2, yb - h + 3, w - 4, Math.round(h * 0.45), gl); P1(x + 3, yb - h + 4, '#ffffff');
    R(x + 2, yb - h + Math.round(h * 0.55), w - 4, Math.round(h * 0.3), m.d); HL(x + 2, yb - h + Math.round(h * 0.55), w - 4, m.dd);
    P1(x + w - 3, yb - Math.round(h * 0.45), '#f5c33b'); P1(x + w - 3, yb - Math.round(h * 0.45) + 1, '#c8922f');
    if (o.wreath) { const cx = x + (w >> 1), cy = yb - h + 9; for (let a = 0; a < 12; a++) { const an = (a / 12) * Math.PI * 2; P1(Math.round(cx + Math.cos(an) * 3.5), Math.round(cy + Math.sin(an) * 3.5), a % 3 ? '#2f6a24' : '#4a8a34'); } P1(cx, cy + 4, '#d8263a'); P1(cx - 1, cy + 4, '#d8263a'); P1(cx + 1, cy + 4, '#f06a6a'); }
    if (o.sign) { R(x + 2, yb - h + 6, w - 4, 4, '#f4f0e6'); gfx.text('OPEN', x + (w >> 1), yb - h + 5, '#c8352b', { align: 'center', font: 'small' }); }
    R(x - 4, yb - 2, w + 8, 2, '#9aa4b4'); HL(x - 4, yb - 2, w + 8, '#c8ccd8');
    R(x - 1, yb - 1, w + 2, 1, '#6a4a3a');
  };
  // a fabric awning, striped, with a scalloped valance and snow on top
  const awning = (x, y, w, c1, c2, p) => {
    const a = K.ramp(c1), b = K.ramp(c2);
    R(x - 1, y - 1, w + 2, 2, '#3a3440');
    for (let j = 0; j < 7; j++) {
      for (let i = 0; i < w; i++) {
        const st = Math.floor((i + j * 0.6) / 6) % 2, m = st ? b : a;
        P1(x + i, y + 1 + j, j < 2 ? m.l : j > 5 ? m.d : m.m);
      }
    }
    for (let i = 0; i < w; i += 6) { const m = Math.floor(i / 6) % 2 ? b : a; R(x + i + 1, y + 8, 4, 1, m.m); R(x + i + 2, y + 9, 2, 1, m.d); }
    HL(x, y + 8, w, 'rgba(20,12,24,0.25)');
    for (let i = 0; i < w; i++) { if ((i * 7) % 5 !== 0) P1(x + i, y, p.snowHi); if ((i * 3) % 7 === 0) P1(x + i, y - 1, p.snow); }
    withA(0.25, () => HL(x, y + 10, w, '#140c10'));
  };
  // a carved sign board with the name, lit by two gooseneck lamps at night
  const signBand = (x, y, w, name, bg, fg, p, o = {}) => {
    const m = K.ramp(bg);
    R(x, y, w, 10, m.m); HL(x, y, w, m.h); HL(x, y + 9, w, m.dd); R(x + 2, y + 2, w - 4, 6, m.d);
    gfx.text(name, x + w / 2 + 1, y + 3, sh(bg, -50), { align: 'center', font: 'small' });
    gfx.text(name, x + w / 2, y + 2, fg, { align: 'center', font: 'small' });
    if (o.lamps !== false) for (const lx of [x + 10, x + w - 11]) {
      VL(lx, y - 5, 4, '#2a2830'); HL(lx, y - 5, 3, '#2a2830'); R(lx + 2, y - 5, 3, 2, '#3a3440');
      if (p.lamp > 0.3) { P1(lx + 3, y - 3, '#ffe8a0'); withA(0.22 * p.lamp, () => E(lx + 3, y + 2, 7, 5, '#ffd98a')); }
    }
    K.ledgeSnow(x, y, w, p);
  };
  // the bracket sign hanging off the wall, with the shop's mark on it
  const bracketSign = (x, y, spr, bg, remap) => {
    HL(x, y, 16, '#2a2830'); P1(x + 16, y + 1, '#2a2830'); VL(x + 2, y, 3, '#2a2830'); VL(x + 13, y, 3, '#2a2830');
    R(x - 1, y + 3, 18, 18, '#140c10'); R(x, y + 4, 16, 16, bg); HL(x, y + 4, 16, sh(bg, 30)); HL(x, y + 19, 16, sh(bg, -30));
    if (spr) { const d = PX.info(spr); draw(spr, x + 8, y + 12, { remap, ax: d.w >> 1, ay: d.h >> 1 }); }
  };
  const planter = (x, yb, p, seed, h = 26) => {
    const m = K.ramp('#6a4424');
    PX.pine(x + 6, yb - 7, h, { c: '#2f6a24', seed, snow: p.snowHi, snowShade: p.snowSh });
    R(x, yb - 8, 13, 8, m.m); HL(x, yb - 8, 13, m.h); VL(x, yb - 8, 8, m.l); VL(x + 12, yb - 8, 8, m.dd); HL(x + 1, yb - 5, 11, m.d);
    K.ledgeSnow(x, yb - 8, 13, p);
  };
  const bench = (x, yb, p) => {
    const m = K.ramp('#6a4424');
    R(x, yb - 9, 22, 3, m.m); HL(x, yb - 9, 22, m.h); R(x + 1, yb - 15, 20, 2, m.m); HL(x + 1, yb - 15, 20, m.h);
    for (const lx of [x + 2, x + 18]) { VL(lx, yb - 13, 13, '#2a2830'); VL(lx + 1, yb - 6, 6, '#2a2830'); }
    K.ledgeSnow(x, yb - 9, 22, p); K.ledgeSnow(x + 1, yb - 15, 20, p);
  };
  const aframe = (x, yb, lines) => {
    for (let j = 0; j < 22; j++) { P1(x + 1 + Math.round(j * 0.18), yb - 22 + j, '#6a4a2a'); P1(x + 19 - Math.round(j * 0.18), yb - 22 + j, '#6a4a2a'); }
    R(x + 2, yb - 22, 17, 15, '#140c10'); R(x + 3, yb - 21, 15, 13, '#2f2a22');
    String(lines).split('|').forEach((l, i) => gfx.text(l, x + 10.5, yb - 20 + i * 6, i ? '#f6e7b0' : '#ffd84a', { align: 'center', font: 'small' }));
    HL(x + 2, yb - 23, 17, '#ffffff');
  };
  const downspout = (x, y, yb) => { VL(x, y, yb - y, '#5a5f6a'); VL(x + 1, y, yb - y, '#8a8f9c'); R(x - 1, yb - 3, 3, 3, '#5a5f6a'); R(x - 2, y - 1, 5, 2, '#5a5f6a'); };

  // ==========================================================================
  // THE FRONTS
  // ==========================================================================
  const GOODS = {
    general: (x, y, w, h, right) => { if (right) { draw('sack', x + 8, y + h - 1); draw('flourSack', x + 22, y + h - 1); draw('jar', x + 34, y + h - 2); } else { draw('apple', x + 8, y + h - 1); draw('jar', x + 20, y + h - 2, { remap: { r: '#4a8a5a' } }); draw('bread', x + 34, y + h - 1); } },
    toys: (x, y, w, h, right) => { if (right) { draw('robot', x + 8, y + h - 1); draw('rocket', x + 18, y + h - 1); draw('blocks', x + 30, y + h - 1); } else { draw('teddy', x + 8, y + h - 1); draw('duck', x + 22, y + h - 1); draw('bunny', x + 34, y + h - 1); } },
    coffee: (x, y, w, h, right) => { if (right) { draw('sack', x + 10, y + h - 1); draw('sack', x + 26, y + h - 1, { remap: { r: '#8a3a2a' } }); } else { draw('mug', x + 10, y + h - 1, { remap: { r: '#2f5a44' } }); draw('mug', x + 24, y + h - 1, { remap: { r: '#c8352b' } }); draw('croissant', x + 36, y + h - 1); } },
    books: (x, y, w, h, right) => { K.books(x + 3, y + h - 1, w - 6, right ? 17 : 13, ['#8a2a2a', '#2f4a7a', '#3a6a4a', '#c8922f', '#6a3a7a', '#d8c8a0'], { minH: 8, maxH: 12 }); if (!right) draw('globe', x + w - 8, y + h - 1); },
    bakery: (x, y, w, h, right) => { if (right) { draw('cakeWhole', x + 12, y + h - 1); draw('pie', x + 30, y + h - 1); } else { draw('bread', x + 10, y + h - 1); draw('baguette', x + 26, y + h - 3); draw('croissant', x + 36, y + h - 1); } },
    hardware: (x, y, w, h, right) => { if (right) { draw('rope', x + 10, y + h - 1); draw('paintCan', x + 24, y + h - 1); draw('paintCan', x + 33, y + h - 1, { remap: { c: '#3a7ad8' } }); } else { draw('shovel', x + 8, y + h - 1); draw('paintCan', x + 20, y + h - 1, { remap: { c: '#f5c33b' } }); draw('tape', x + 30, y + h - 8); } },
    thrift: (x, y, w, h, right) => { if (right) { draw('hatCowboy', x + 10, y + h - 12); draw('hatFedora', x + 26, y + h - 14); draw('hatBowler', x + 36, y + h - 10); } else { for (let i = 0; i < 4; i++) { const c = ['#c8452f', '#3a6ba8', '#4a8a5a', '#e0a83a'][i]; R(x + 5 + i * 9, y + 6, 7, h - 8, c); VL(x + 5 + i * 9, y + 6, h - 8, sh(c, 24)); } HL(x + 2, y + 5, w - 4, '#c8ccd8'); } },
    records: (x, y, w, h, right) => { for (let i = 0; i < 3; i++) { const c = ['#c8352b', '#3a6ba8', '#e8b84a', '#4a8a5a', '#e05a9a', '#f4f0e6'][(i + (right ? 3 : 0)) % 6]; R(x + 4 + i * 13, y + h - 13, 11, 11, c); E(x + 9 + i * 13, y + h - 7, 3, 3, '#1a1418'); P1(x + 9 + i * 13, y + h - 7, sh(c, 30)); } },
    pharmacy: (x, y, w, h, right) => { if (right) { draw('mortar', x + 12, y + h - 1); draw('rxBox', x + 26, y + h - 1); draw('rxBox', x + 34, y + h - 1); } else { for (let i = 0; i < 5; i++) draw('pillBottle', x + 6 + i * 7, y + h - 1); } },
    bait: (x, y, w, h, right) => { if (right) { for (let i = 0; i < 4; i++) draw('lure', x + 6 + i * 9, y + 5, { remap: { a: ['#e05a4a', '#3ad6a0', '#ffd84a', '#8a5aa8'][i] } }); draw('reel', x + 18, y + h - 1); } else { E(x + w / 2, y + h - 8, 14, 5, '#4a7a4a'); E(x + w / 2 - 2, y + h - 10, 9, 2, '#7aaa6a'); P1(x + w / 2 - 11, y + h - 9, '#141018'); } },
    barber: (x, y, w, h, right) => { if (right) { for (let i = 0; i < 3; i++) { const c = ['#3ad6a0', '#e8b84a', '#9fdcff'][i]; R(x + 8 + i * 9, y + h - 12, 6, 11, c); R(x + 9 + i * 9, y + h - 15, 4, 3, '#1e1a20'); } } else { R(x + 6, y + h - 20, 12, 3, '#b8352b'); R(x + 14, y + h - 30, 4, 12, '#b8352b'); R(x + 10, y + h - 17, 3, 16, '#c8ccd8'); } },
    arcade: (x, y, w, h, right) => { for (let i = 0; i < 2; i++) { const cx0 = x + 4 + i * 20; R(cx0, y + 2, 16, h - 3, '#141020'); R(cx0 + 2, y + 5, 12, 9, ['#3ad6a0', '#e05a9a', '#9fdcff', '#ffd84a'][i + (right ? 2 : 0)]); R(cx0 + 2, y + 16, 12, 3, '#2a2238'); } },
    arena: (x, y, w, h, right) => { if (right) { R(x + 6, y + 4, 30, h - 8, '#f4f0e6'); gfx.text('GO', x + 21, y + 6, '#3a4a7a', { align: 'center', font: 'small' }); gfx.text('MALLARDS', x + 21, y + 13, '#3a4a7a', { align: 'center', font: 'small' }); } else { for (let i = 0; i < 3; i++) { gfx.line(x + 8 + i * 10, y + 4, x + 12 + i * 10, y + h - 5, '#c8844a'); HL(x + 10 + i * 10, y + h - 5, 6, '#1e1a20'); } } },
  };
  const ARCH = {
    general: { style: 'falsefront', body: 'clap', color: '#8a5a2b', h: 102, trim: '#e8d8b0', porch: true, door: '#6a3a1c', sprite: 'sack', signBg: '#3a2418' },
    toys: { style: 'gable', body: 'clap', color: '#b2452f', h: 110, trim: '#f6e7c0', door: '#3a6ba8', sprite: 'teddy', wreath: true, shutters: '#3a6ba8' },
    coffee: { style: 'cornice', body: 'brick', color: '#7a3a2a', h: 110, trim: '#e8dcbc', door: '#2f5a44', sprite: 'mug', lights: true, bench: true, arch: true },
    books: { style: 'tudor', body: 'stone', color: '#8a8478', h: 118, trim: '#e8d8b0', timber: '#4a2e1a', door: '#4a2e1a', sprite: 'globe', lanterns: true },
    bakery: { style: 'gable', body: 'clap', color: '#e8c070', h: 104, trim: '#fff2d0', door: '#c8506a', sprite: 'bread', chimney: true, wreath: true, box: true },
    hardware: { style: 'falsefront', body: 'clap', color: '#8a6a3a', h: 98, trim: '#e8d0a0', porch: true, door: '#5a3a1c', sprite: 'hammer', shovels: true },
    thrift: { style: 'cornice', body: 'brick', color: '#3a7a8a', h: 106, trim: '#dceef2', door: '#b04a6a', sprite: 'hatFedora', arch: true, box: true },
    records: { style: 'cornice', body: 'brick', color: '#2f3a6a', h: 112, trim: '#c8c0e8', door: '#241c38', sprite: null, neon: true, posters: true },
    pharmacy: { style: 'flat', body: 'panel', color: '#dfe8e4', h: 98, trim: '#3a8a6a', door: '#3a8a6a', sprite: 'rxBox', cross: true },
    bait: { style: 'shack', body: 'clap', color: '#2f6a8a', h: 94, trim: '#dff2ff', porch: true, door: '#3a2418', sprite: 'lure', fish: true },
    garage: { style: 'flat', body: 'block', color: '#8a8f9c', h: 100, trim: '#ffd84a', door: '#5a5f6a', sprite: 'wrench', bay: true },
    barber: { style: 'cornice', body: 'brick', color: '#8a3a3a', h: 104, trim: '#f6f2e6', door: '#8a2a3a', sprite: 'hatBowler', pole: true, arch: false },
    arcade: { style: 'flat', body: 'panel', color: '#4a2f7a', h: 108, trim: '#9fdcff', door: '#241c38', sprite: 'robot', marquee: true },
    arena: { style: 'quonset', body: 'panel', color: '#4a5a8a', h: 126, trim: '#dce4f4', door: '#3a4a7a', sprite: null },
  };
  CH.FRONT_ARCH = ARCH;

  function paintFront(x, y, t, st) {
    const A = ARCH[st.id] || ARCH.general, p = pal(), r = rng((st.id || 'x').length * 977 + (x | 0));
    const W0 = 120, H = A.h, name = st.name || 'STORE', c = st.color || A.color;
    const tm = K.ramp(A.trim);
    // everything that stands in front of the wall shares one ink line
    art.blit(x, y, 150, 160, 15, 156, () => {
      const ox = 15, b = 156, top = b - H;
      const gf = 54;                       // ground floor height
      // ---- walls -------------------------------------------------------------
      if (A.style === 'tudor') {
        stoneWall(ox, b - gf, W0, gf, A.color, 7);
        plasterTimber(ox, top + 22, W0, H - gf - 22, A.timber);
      } else if (A.style === 'quonset') {
        panels(ox, top + 34, W0, H - 34, c);
      } else body(A.body, ox, top, W0, H, c, x | 0);
      // ---- roof / parapet ------------------------------------------------------
      if (A.style === 'cornice') {
        const m = K.ramp(sh(c, -20));
        R(ox - 3, top - 2, W0 + 6, 7, m.m); HL(ox - 3, top - 2, W0 + 6, m.h); HL(ox - 3, top + 4, W0 + 6, m.dd);
        for (let i = ox - 2; i < ox + W0 + 2; i += 3) P1(i, top + 2, m.dd);
        K.ledgeSnow(ox - 3, top - 2, W0 + 6, p); K.icicles(ox - 2, top + 5, W0 + 4, x | 0);
        R(ox + W0 / 2 - 11, top + 5, 22, 8, tm.m); HL(ox + W0 / 2 - 11, top + 5, 22, tm.h); HL(ox + W0 / 2 - 11, top + 12, 22, tm.dd);
        gfx.text(String(1900 + (x | 0) % 40), ox + W0 / 2, top + 6, sh(c, -30), { align: 'center', font: 'small' });
      } else if (A.style === 'falsefront') {
        const m = K.ramp(sh(c, -24));
        R(ox + 8, top - 10, W0 - 16, 10, c); for (let yy = top - 9; yy < top; yy += 3) { HL(ox + 8, yy, W0 - 16, K.ramp(c).l); HL(ox + 8, yy + 2, W0 - 16, K.ramp(c).d); }
        R(ox + 20, top - 16, W0 - 40, 6, c);
        for (const [xa, wa, ya] of [[ox - 2, 12, top - 2], [ox + 6, W0 - 12, top - 12], [ox + 18, W0 - 36, top - 18], [ox + W0 - 10, 12, top - 2]]) { R(xa, ya, wa, 3, m.m); HL(xa, ya, wa, m.h); K.ledgeSnow(xa, ya, wa, p); }
        gfx.text(name.split(' ')[0], ox + W0 / 2 + 1, top - 9 + 1, sh(c, -50), { align: 'center' });
        gfx.text(name.split(' ')[0], ox + W0 / 2, top - 9, A.trim, { align: 'center' });
      } else if (A.style === 'gable' || A.style === 'tudor' || A.style === 'shack') {
        const rh = A.style === 'shack' ? 20 : A.style === 'tudor' ? 34 : 26, roof = K.ramp(A.style === 'tudor' ? '#4a3a44' : '#5a3a2a');
        for (let j = 0; j < rh; j++) {
          const half = Math.round(((j + 1) / rh) * (W0 / 2 + 2));
          const yy = top - rh + j + (A.style === 'tudor' ? 22 : 0);
          R(ox + W0 / 2 - half, yy, half * 2, 1, A.style === 'tudor' ? (j % 4 === 0 ? sh(A.timber, 20) : '#efe6d2') : (j % 3 === 2 ? K.ramp(c).d : c));
        }
        if (A.style === 'tudor') for (let j = 0; j < rh; j += 1) { P1(ox + W0 / 2, top - rh + 22 + j, A.timber); }
        const ty = A.style === 'tudor' ? top + 22 : top;
        // round attic window
        const ax = ox + W0 / 2, ay = ty - Math.round(rh * 0.5);
        E(ax, ay, 5, 5, tm.m); E(ax, ay, 4, 4, p.win > 0.35 ? mix('#3a4a66', '#ffd98a', p.win) : mix('#2e3c52', p.sky[2], 0.3)); VL(ax, ay - 4, 9, tm.m); HL(ax - 4, ay, 9, tm.m);
        // eaves with shingle edge and snow
        for (let j = -2; j <= rh; j++) {
          const half = Math.round((j / rh) * (W0 / 2 + 2)) + 3, yy = ty - rh + j;
          for (const s of [-1, 1]) { const ex = Math.round(ox + W0 / 2 + s * half); R(ex - 1, yy, 3, 3, roof.dd); P1(ex, yy - 1, p.snowHi); P1(ex + s, yy - 1, p.snowHi); P1(ex - s, yy - 2, p.snow); }
        }
        R(ox - 5, ty - 1, W0 + 10, 3, roof.d); HL(ox - 5, ty - 2, 6, p.snowHi); HL(ox + W0 - 1, ty - 2, 6, p.snowHi);
        K.icicles(ox - 4, ty + 2, W0 + 8, x | 0);
        if (A.fish) {
          // the big fish on the roof
          const fx = ox + W0 / 2, fy = ty - rh - 6;
          E(fx, fy, 20, 6, '#3a7a5a'); E(fx - 2, fy - 2, 14, 2, '#6aaa7a'); for (let j = -5; j <= 5; j++) P1(fx + 21 + Math.abs(j) % 3, fy + j, '#3a7a5a');
          P1(fx - 14, fy - 1, '#141018'); HL(fx - 20, fy + 2, 5, '#1e3a2a'); VL(fx, fy + 6, 6, '#2a2830');
          for (let i = fx - 16; i < fx + 16; i += 3) P1(i, fy - 6, p.snowHi);
        }
      } else if (A.style === 'flat') {
        const m = K.ramp(sh(c, -26));
        R(ox - 2, top - 4, W0 + 4, 5, m.m); HL(ox - 2, top - 4, W0 + 4, m.h); K.ledgeSnow(ox - 2, top - 4, W0 + 4, p);
        K.icicles(ox, top + 1, W0, x | 0);
      } else if (A.style === 'quonset') {
        const m = K.ramp(c), qt = top + 34;
        for (let j = 0; j < 40; j++) { const u = j / 40, half = Math.round(Math.sqrt(1 - (1 - u) * (1 - u)) * (W0 / 2 + 4)); HL(ox + W0 / 2 - half, qt - 40 + j, half * 2, j % 4 === 0 ? m.d : m.m); P1(ox + W0 / 2 - half, qt - 40 + j, p.snowHi); P1(ox + W0 / 2 + half - 1, qt - 40 + j, p.snowHi); }
        for (let i = -W0 / 2; i < W0 / 2; i += 8) { const u = 1 - (i / (W0 / 2 + 4)) ** 2; VL(ox + W0 / 2 + i, qt - Math.round(Math.sqrt(Math.max(0, u)) * 40), Math.round(Math.sqrt(Math.max(0, u)) * 40), m.l); }
        for (let i = -W0 / 2 + 6; i < W0 / 2 - 6; i++) { const u = 1 - (i / (W0 / 2 + 4)) ** 2; P1(ox + W0 / 2 + i, qt - Math.round(Math.sqrt(Math.max(0, u)) * 40) - 1, p.snowHi); }
        R(ox + 20, qt - 20, W0 - 40, 12, '#f4f0e6'); gfx.text('ARENA', ox + W0 / 2, qt - 18, '#3a4a7a', { align: 'center' });
      }
      // ---- upper storey windows ---------------------------------------------------
      if (A.style !== 'quonset' && A.style !== 'shack') {
        const upY = A.style === 'tudor' ? top + 34 : top + 14, upH = A.style === 'falsefront' ? 13 : 15;
        const n = A.style === 'gable' ? 2 : 3;
        for (let i = 0; i < n; i++) {
          const wx = Math.round(ox + (n === 2 ? 22 + i * 60 : 14 + i * 40)), ww = n === 2 ? 16 : 14;
          upperWin(wx, upY, ww, upH, { frame: A.trim, arch: A.arch, shutters: A.shutters, box: A.box }, p, r);
        }
      }
      // ---- sign band --------------------------------------------------------------
      const sb = b - gf - 10;
      if (A.style !== 'falsefront') signBand(ox + 4, sb, W0 - 8, name, A.signBg || sh(c, -42), st.textColor || A.trim, p, { lamps: !A.neon });
      else signBand(ox + 4, sb, W0 - 8, name, A.signBg || '#3a2418', '#f5c33b', p);
      // ---- ground floor -----------------------------------------------------------
      const dy = b - gf + 8, dh = 30;
      if (A.bay) {
        // a roll-up service door instead of windows
        const bm = K.ramp('#c8ccd8');
        R(ox + 6, b - 46, 70, 46, '#3a3a44');
        for (let yy = b - 44; yy < b - 1; yy += 6) { R(ox + 8, yy, 66, 5, bm.m); HL(ox + 8, yy, 66, bm.h); HL(ox + 8, yy + 4, 66, bm.dd); }
        for (let i = 0; i < 4; i++) R(ox + 12 + i * 16, b - 32, 10, 4, p.win > 0.3 ? mix('#3a4a66', '#ffd98a', p.win) : '#1a2a3a');
        for (let x2 = ox + 6; x2 < ox + 76; x2 += 8) { R(x2, b - 48, 4, 2, '#ffd84a'); R(x2 + 4, b - 48, 4, 2, '#1e1a20'); }
        displayWin(ox + 86, dy + 4, 26, dh - 6, { frame: '#3a3a44', mullion: false, goods: (gx, gy, gw, gh) => { R(gx + 3, gy + gh - 8, 8, 7, '#1e1a20'); R(gx + 13, gy + gh - 8, 8, 7, '#1e1a20'); } }, p);
      } else {
        const g1 = GOODS[st.id] || GOODS.general;
        displayWin(ox + 5, dy, 44, dh, { frame: A.style === 'tudor' ? A.timber : sh(c, -40), goods: (gx, gy, gw, gh) => g1(gx, gy, gw, gh, false) }, p);
        displayWin(ox + 71, dy, 44, dh, { frame: A.style === 'tudor' ? A.timber : sh(c, -40), goods: (gx, gy, gw, gh) => g1(gx, gy, gw, gh, true) }, p);
      }
      if (!A.bay) frontDoor(ox + 53, b, 14, 46, A.door, { wreath: A.wreath, sign: !A.wreath }, p);
      else frontDoor(ox + 90, b, 14, 0, A.door, {}, p);
      // ---- awning or porch --------------------------------------------------------
      if (A.porch) {
        // a porch roof under the sign, on posts, the way the old fronts did it
        const m = K.ramp('#6a4424'), pr = b - gf;
        R(ox - 4, pr, W0 + 8, 3, m.m); HL(ox - 4, pr, W0 + 8, m.h); HL(ox - 4, pr + 2, W0 + 8, m.dd); K.ledgeSnow(ox - 4, pr, W0 + 8, p);
        for (const px0 of [ox - 2, ox + 50, ox + 68, ox + W0 - 1]) { R(px0, pr + 3, 3, b - pr - 3, m.m); VL(px0, pr + 3, b - pr - 3, m.l); P1(px0 + 3, pr + 3, m.d); P1(px0 - 1, pr + 3, m.d); P1(px0 + 3, pr + 4, m.d); P1(px0 - 1, pr + 4, m.d); }
        K.icicles(ox - 3, pr + 3, W0 + 6, (x | 0) + 7);
      } else if (st.awning && A.style !== 'flat') {
        awning(ox + 3, b - gf + 1, 48, st.awning[0], st.awning[1], p); awning(ox + 69, b - gf + 1, 48, st.awning[0], st.awning[1], p);
      }
      // ---- the shop's own bits ----------------------------------------------------
      if (A.style !== 'quonset' && A.style !== 'falsefront' && A.sprite !== null && st.logoBg) bracketSign(ox + W0 - 10, b - gf - 20, A.sprite, st.logoBg);
      if (A.cross) { R(ox + W0 - 22, top + 6, 16, 16, '#141018'); R(ox + W0 - 16, top + 8, 4, 12, '#3ad6a0'); R(ox + W0 - 20, top + 12, 12, 4, '#3ad6a0'); }
      if (A.lanterns) for (const lx of [ox + 50, ox + 68]) { VL(lx + 1, b - gf - 2, 4, '#2a2830'); R(lx - 1, b - gf + 2, 5, 7, '#2a2830'); R(lx, b - gf + 3, 3, 5, p.lamp > 0.3 ? '#ffe070' : '#8a7a5a'); }
      if (A.posters) { for (let i = 0; i < 3; i++) { const c2 = ['#e8b84a', '#e05a9a', '#3ad6a0'][i]; R(ox + 2 + i * 6, dy + dh + 4 - i * 2, 5, 8, c2); } }
      if (A.chimney) { const cx0 = ox + W0 - 26; R(cx0, top - 34, 9, 30, '#8a4a3a'); VL(cx0, top - 34, 28, '#aa6a54'); VL(cx0 + 8, top - 34, 28, '#6a3428'); R(cx0 - 1, top - 36, 11, 3, '#6a3428'); K.ledgeSnow(cx0 - 1, top - 36, 11, p); }
      if (A.body === 'brick' || A.body === 'block') downspout(ox + W0 - 3, top + 2, b - 1);
      // electric meter and a house number, because every building has them
      R(ox + 1, b - 22, 4, 6, '#8a8f9c'); E(ox + 3, b - 20, 1, 1, '#e8eef4');
      R(ox + 53, b - gf + 4, 14, 5, '#f4f0e6'); gfx.text(String(100 + ((x | 0) >> 4) % 90), ox + 60, b - gf + 4, '#3a3440', { align: 'center', font: 'small' });
    });
    // ---- things standing on the sidewalk, outside the ink line ----------------------
    const p2 = pal();
    if (A.bench) bench(x + 124, y, p2);
    if (A.shovels) { for (let i = 0; i < 3; i++) draw('shovel', x + 4 + i * 5, y, { remap: { b: ['#3a7ad8', '#c8352b', '#f5c33b'][i], d: sh(['#3a7ad8', '#c8352b', '#f5c33b'][i], -40) } }); }
    if (A.style === 'gable' || A.style === 'cornice') planter(x - 2, y, p2, (x | 0) % 97 + 3);
    if (A.style === 'gable') planter(x + 109, y, p2, (x | 0) % 89 + 7);
    if (st.board) aframe(x + 122, y, st.board);
    K.drift(x - 12, y + 1, 30, 5, p2, (x | 0) + 1);
    K.drift(x + 100, y + 1, 30, 4, p2, (x | 0) + 2);
  }
  // swap in the new painter (26_travel defines the old one)
  if (CH.PROPS.storefront) {
    CH.PROPS.storefront.draw = (g, x, y, t, st) => paintFront(x, y, t || 0, st || {});
  }

  // ---- live details on the fronts: poles, neon, smoke, twinkling lights -------------
  CH.frontLive = (scene, pr) => {
    const A = ARCH[pr.st.id] || ARCH.general;
    pr.roofH = A.h + (A.style === 'falsefront' ? 18 : A.style === 'gable' ? 26 : 2);
    const x0 = pr.x, F = scene.floorY;
    const add = (fn, w = 120, h = 100) => scene.addCustom((g, x, y, t) => fn(g, x0, F, t, scene.pal), x0, F, w, h, { id: 'frontLive_' + pr.st.id, anim: true });
    if (A.pole) add((g, x, y, t) => {
      const px0 = x + 50, py = y - 50, h = 22, o = Math.floor(t * 10) % 8;
      R(px0 - 1, py - 3, 6, 3, '#c8ccd8'); R(px0 - 1, py + h, 6, 3, '#c8ccd8'); E(px0 + 2, py - 4, 2, 2, '#f4f6fa');
      gfx.clip(px0, py, 4, h); R(px0, py, 4, h, '#f4f0ea');
      for (let i = -16; i < h + 8; i += 8) for (let j = 0; j < 4; j++) { R(px0 + j, py + i + o + j - 2, 1, 3, '#c8352b'); R(px0 + j, py + i + o + j + 2, 1, 2, '#3a6ba8'); }
      gfx.unclip();
    }, 60, 60);
    if (A.neon) add((g, x, y, t, p) => {
      const on = Math.sin(t * 9) > -0.9, c = on ? '#ff6ad8' : '#7a3a6a';
      R(x + 20, y - 96, 40, 12, '#0e0c12'); gfx.text('VINYL', x + 40, y - 93, c, { align: 'center' });
      if (on) withA(0.18, () => E(x + 40, y - 90, 26, 9, '#ff6ad8'));
    });
    if (A.marquee) add((g, x, y, t) => {
      const i0 = Math.floor(t * 8);
      for (let i = 0; i < 28; i++) P1(x + 4 + i * 4, y - 108, (i + i0) % 4 === 0 ? '#ffffff' : ['#ff6ad8', '#3ad6a0', '#9fdcff', '#ffd84a'][(i >> 2) % 4]);
      R(x + 30, y - 104, 60, 14, '#0e0c12'); gfx.text('PLAY!', x + 60, y - 101, (i0 % 2) ? '#3ad6a0' : '#ff6ad8', { align: 'center' });
    });
    if (A.chimney) add((g, x, y, t) => { for (let i = 0; i < 4; i++) { const k = (t * 0.35 + i * 0.25) % 1; withA(0.5 * (1 - k), () => E(Math.round(x + 98 + Math.sin(t + i) * 3 + k * 6), Math.round(y - 140 - k * 22), 2 + k * 4, 1.5 + k * 3, '#eef4f8')); } });
    if (A.lights) add((g, x, y, t) => { for (let i = 0; i < 20; i++) { const lx = x + 2 + i * 6, ly = y - 56 + Math.round(Math.sin((i / 19) * Math.PI) * 4); P1(lx, ly, ((i + Math.floor(t * 3)) % 3) ? ['#ffd84a', '#ff6a7a', '#3ad6a0'][i % 3] : '#ffffff'); } });
    if (A.cross) add((g, x, y, t) => { withA(0.12 + Math.sin(t * 2) * 0.05, () => E(x + 106, y - 84, 12, 12, '#3ad6a0')); });
  };

  // ==========================================================================
  // THE ROW OF HOUSES BEHIND MAIN STREET
  // ==========================================================================
  CH.paintBackRow = (x0, x1, F, p) => {
    const r = rng(91);
    const cols = ['#7a5a72', '#5a6a80', '#84625a', '#5c6a5c', '#8a7a5a', '#6a5a7a', '#5a7a7a'];
    let x = x0;
    while (x < x1) {
      if (r.chance(0.3)) {
        PX.pine(x + 12, F - 4, r.int(44, 70), { c: mix(r.pick(['#2f6a24', '#3a7a2c', '#25551c']), p.sky[3], 0.35), seed: r.int(1, 900), snow: mix(p.snowHi, p.sky[3], 0.2), snowShade: mix(p.snowSh, p.sky[3], 0.3), flip: r.chance(0.5) });
        x += 22; continue;
      }
      const bw = r.int(46, 66), bh = r.int(40, 62);
      K.house(x, F - 6, bw, bh, { color: mix(r.pick(cols), p.sky[3], 0.38), roof: mix(r.pick(['#4a3a44', '#3a3a4a', '#5a3a2a']), p.sky[3], 0.3), trim: mix('#e8e2d6', p.sky[3], 0.3), gable: r.chance(0.55), seed: r.int(1, 9999), style: r.chance(0.2) ? 'brick' : 'clap' }, p);
      x += bw + r.int(6, 20);
    }
  };

  // ==========================================================================
  // WINDOW VIEWS ELSEWHERE: the cabin looks out on the forest (and the lake)
  // ==========================================================================
  CH.drawForestView = (g, x, y, w, h, t, night, o = {}) => {
    K.view('forest', g, x, y, w, h, t, { night, seed: o.seed || (((w * 7 + h * 13) | 0) % 97 + 1), lake: !!o.lake });
  };
})(window.CH);

// ============================================================================
// DONALD'S and THE CABIN
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, PX = CH.PIX, K = CH.IK, art = CH.art;
  const R = gfx.rect, P1 = gfx.px, HL = gfx.hline, VL = gfx.vline, E = gfx.ellipse, mix = gfx.mix, sh = gfx.shade;
  const rng = K.rng, withA = K.withA, draw = (n, x, y, o) => PX.draw(n, x, y, o);
  const pal = () => CH.curPal || (CH.skyAt ? CH.skyAt(CH.state.hour || 9) : null);

  // ---- Donald's: stucco and brick, a shingled mansard, a full dining room -----------
  const donalds = (g, x, y, t) => {
    const p = pal(), RED = K.ramp('#c8352b');
    art.blit(x, y, 240, 160, 20, 156, () => {
      const ox = 20, b = 156, W0 = 200;
      // parking apron with painted lines
      R(ox - 18, b - 4, W0 + 36, 4, '#4a4d58'); for (let i = ox - 14; i < ox + W0 + 16; i += 24) HL(i, b - 2, 10, '#e8e2c0');
      // body: stucco over a brick base
      R(ox, b - 92, W0, 80, '#f2e7d2'); K.speck(ox, b - 92, W0, 80, '#e2d5bc', 0.7, 3, 900); K.speck(ox, b - 92, W0, 80, '#fbf4e4', 0.6, 4, 500);
      for (let i = ox + 49; i < ox + W0; i += 50) VL(i, b - 85, 22, '#e2d5bc');
      K.brick(ox, b - 14, W0, 14, '#8a3a2a', { seed: 5, bw: 7, bh: 3 });
      R(ox, b - 15, W0, 2, '#b6ab94'); HL(ox, b - 15, W0, '#d2c8b2');
      // red bands
      R(ox, b - 92, W0, 7, RED.m); HL(ox, b - 92, W0, RED.h); HL(ox, b - 86, W0, RED.dd);
      R(ox, b - 62, W0, 5, RED.m); HL(ox, b - 62, W0, RED.l); HL(ox, b - 58, W0, RED.dd);
      // shingled mansard with snow
      const rm = K.ramp('#8f2419');
      for (let j = 0; j < 10; j++) {
        const ins = Math.round((9 - j) * 0.9), yy = b - 102 + j;
        R(ox - 8 + ins, yy, W0 + 16 - ins * 2, 1, j % 3 === 2 ? rm.dd : rm.m);
        if (j % 3 === 1) for (let i = ox - 8 + ins + (j % 2) * 3; i < ox + W0 + 8 - ins; i += 6) P1(i, yy, rm.d);
      }
      K.drift(ox - 10, b - 101, W0 + 20, 4, p, 9);
      K.icicles(ox - 6, b - 92, W0 + 12, 21);
      // three windows onto a full dining room
      for (const [wx, i] of [[ox + 12, 0], [ox + 60, 1], [ox + 142, 2]]) {
        R(wx - 3, b - 56, 46, 42, RED.dd); R(wx - 2, b - 55, 44, 40, RED.m); HL(wx - 2, b - 55, 44, RED.h);
        gfx.vgrad(wx, b - 53, 40, 34, p.win > 0.3 ? ['#fff4c8', '#f6dc9c', '#e8c078'] : ['#f6ecd0', '#e8d8b0', '#d8c090']);
        // booths, a menu strip, the lights
        R(wx, b - 53, 40, 5, '#c8352b'); for (let k = 0; k < 4; k++) { R(wx + 2 + k * 10, b - 52, 7, 3, '#f5c33b'); P1(wx + 3 + k * 10, b - 51, '#8f2419'); }
        R(wx + 2, b - 30, 12, 11, '#b8352b'); R(wx + 26, b - 30, 12, 11, '#b8352b'); HL(wx + 2, b - 30, 12, '#e0655a'); HL(wx + 26, b - 30, 12, '#e0655a');
        R(wx + 12, b - 27, 16, 3, '#e8e2d6'); HL(wx + 12, b - 27, 16, '#ffffff');
        draw('burger', wx + 16, b - 27, { remap: undefined }); if (i === 1) draw('cartonS', wx + 24, b - 27);
        VL(wx + 19, b - 53, 34, RED.m); HL(wx, b - 38, 40, RED.m);
        withA(0.25, () => { for (let k = 0; k < 30; k++) P1(wx + 2 + Math.round(k * 0.5), b - 20 - k, '#ffffff'); });
        R(wx - 3, b - 15, 46, 2, RED.dd); K.ledgeSnow(wx - 3, b - 15, 46, p);
      }
      // double glass doors
      R(ox + 102, b - 60, 34, 60, '#3a4a5a');
      gfx.vgrad(ox + 104, b - 58, 30, 56, ['#cfeeff', '#9fdcff', '#7ec2ea']);
      R(ox + 118, b - 58, 3, 56, '#3a4a5a');
      for (const dx of [ox + 108, ox + 124]) { R(dx, b - 32, 6, 2, '#c8ccd8'); HL(dx, b - 32, 6, '#f4f6fa'); }
      R(ox + 104, b - 54, 30, 9, RED.m); gfx.text('OPEN', ox + 119, b - 52, '#ffffff', { align: 'center', font: 'small' });
      gfx.text('6AM-11PM', ox + 111, b - 42, '#3a4a5a', { align: 'center', font: 'small' });
      R(ox + 100, b - 64, 38, 4, RED.dd); HL(ox + 100, b - 64, 38, RED.l);
      withA(0.35, () => { for (let k = 0; k < 40; k++) P1(ox + 106 + Math.round(k * 0.3), b - 6 - k, '#ffffff'); });
      // NOW HIRING, taped in the first window
      R(ox + 8, b - 30, 48, 14, '#f5c33b'); HL(ox + 8, b - 30, 48, '#ffe08a'); R(ox + 8, b - 17, 48, 1, '#c8961e');
      gfx.text('NOW HIRING', ox + 32, b - 27, '#8f2419', { align: 'center', font: 'small' });
      R(ox + 9, b - 31, 4, 2, 'rgba(255,255,255,0.7)'); R(ox + 51, b - 31, 4, 2, 'rgba(255,255,255,0.7)');
      // drive-thru: the menu board and the speaker
      R(ox + 190, b - 44, 4, 44, '#5a5a66'); VL(ox + 190, b - 44, 44, '#7c7c88');
      R(ox + 174, b - 58, 34, 16, RED.m); HL(ox + 174, b - 58, 34, RED.h); gfx.frame(ox + 174, b - 58, 34, 16, '#8f2419');
      gfx.text('DRIVE', ox + 191, b - 56, '#ffffff', { align: 'center', font: 'small' }); gfx.text('THRU >', ox + 191, b - 49, '#ffffff', { align: 'center', font: 'small' });
      // bin and bench by the wall
      R(ox + 148, b - 16, 12, 16, '#5a5a66'); HL(ox + 148, b - 16, 12, '#7c7c88'); R(ox + 147, b - 19, 14, 3, '#43434e'); R(ox + 150, b - 13, 8, 2, '#2a2a30');
      R(ox + 164, b - 12, 26, 4, '#7c5230'); HL(ox + 164, b - 12, 26, '#a9703c'); R(ox + 166, b - 8, 3, 8, '#5a3721'); R(ox + 185, b - 8, 3, 8, '#5a3721'); K.ledgeSnow(ox + 164, b - 12, 26, p);
    });
    // customers at the tables, seen through the glass (outside the ink line)
    const seats = [[x + 22, 'bear'], [x + 42, 'rabbit'], [x + 70, 'moose'], [x + 89, 'goose'], [x + 152, 'fox'], [x + 172, 'deer']];
    // each diner is drawn on its own little canvas, and only the part above the
    // booth back is shown through the glass
    for (const [cx, sp] of seats) {
      const off = gfx.makeCanvas(40, 48), oc = off.getContext('2d');
      gfx.pushTarget(oc);
      CH.drawCritter(oc, 20, 46, { species: sp, outfit: 'casual', topColor: ['#c8352b', '#3a6ba8', '#4a8a5a', '#e8b84a'][Math.round(cx) % 4], noShadow: true, height: 0.62, width: 0.72, face: 'happy', flip: Math.round(cx) % 2 === 0 });
      gfx.popTarget();
      const showH = 30;   // rows above the booth
      gfx.cur.drawImage(off, 0, 48 - 16 - showH, 40, showH, Math.round(cx) - 20, y - 30 - showH + 2, 40, showH);
      R(Math.round(cx) - 7, y - 30, 14, 2, '#b8352b');
    }
    // the big D on its pole, above the roof
    const sy = y - 138;
    R(x + 96, y - 104, 10, 30, '#55555f'); VL(x + 96, y - 104, 30, '#7a7a84'); VL(x + 105, y - 104, 30, '#3a3a44');
    art.blit(x + 60, sy + 40, 96, 48, 0, 44, () => {
      gfx.rrect(0, 0, 90, 40, 6, '#8f2419'); gfx.rrect(3, 3, 84, 34, 5, '#f5c33b');
      gfx.rrect(3, 3, 84, 8, 4, '#ffe08a');
      R(8, 8, 26, 26, '#c8352b'); R(10, 10, 22, 22, '#ffe08a');
      const dc = gfx.cur; dc.save(); dc.translate(12, 11); dc.scale(3, 3);
      gfx.text('D', 0, 0, '#c8352b'); dc.restore();
      gfx.text("DONALD'S", 62, 10, '#8f2419', { align: 'center', font: 'small' });
      gfx.text('BURGERS', 62, 18, '#8f2419', { align: 'center', font: 'small' });
      gfx.text("IT'S A D", 62, 28, '#5a3a1a', { align: 'center', font: 'small' });
      K.ledgeSnow(4, 1, 82, pal());
    });
    for (let i = 0; i < 21; i++) P1(x + 63 + i * 4, sy + 38, i % 4 === 0 ? '#ffffff' : '#f0a030');
    // planters with little pines either side of the doors
    for (const px0 of [x + 108, x + 158]) {
      const m = K.ramp('#8f2419');
      PX.pine(px0 + 6, y - 7, 24, { c: '#2f6a24', seed: px0 % 91 + 3, snow: pal().snowHi, snowShade: pal().snowSh });
      R(px0, y - 8, 13, 8, m.m); HL(px0, y - 8, 13, m.h); VL(px0 + 12, y - 8, 8, m.dd); K.ledgeSnow(px0, y - 8, 13, pal());
    }
    K.drift(x - 18, y + 1, 36, 5, pal(), 31); K.drift(x + 182, y + 1, 34, 5, pal(), 32);
  };
  if (CH.PROPS.donaldsExterior) CH.PROPS.donaldsExterior.draw = (g, x, y, t) => donalds(g, x, y, t || 0);

  // ---- the cabin: logs, a shingled roof under a foot of snow, a porch, a woodpile ----
  let cabinCache = null, cabinKey = null;
  CH.paintCabinExterior = (g, x, y, t, p) => {
    const key = p;
    if (!cabinCache || cabinKey !== key) {
      cabinKey = key;
      cabinCache = gfx.makeCanvas(170, 150);
      const c = cabinCache.getContext('2d');
      gfx.pushTarget(c);
      art.blit(22, 146, 150, 146, 8, 142, () => {
        const ox = 8, b = 142, W0 = 94, P = CH.PAL;
        // log walls
        CH.drawPlanks(gfx.cur, ox, b - 62, W0, 62, 9, P.wood1, P.wood0, P.wood3, 3);
        for (let yy = b - 62; yy < b; yy += 9) { E(ox, yy + 4, 3, 4, P.wood3); E(ox, yy + 4, 1.5, 2, P.wood0); E(ox + W0 - 1, yy + 4, 3, 4, P.wood3); E(ox + W0 - 1, yy + 4, 1.5, 2, P.wood0); }
        // stone foundation
        for (let i = ox; i < ox + W0; i += 7) { const cc = sh('#7d7b88', ((i * 13) % 20) - 10); R(i, b - 5, 6, 5, cc); HL(i, b - 5, 6, sh(cc, 18)); }
        // gable wall and roof
        const rh = 38;
        for (let j = 0; j < rh; j++) { const half = Math.round(((j + 1) / rh) * (W0 / 2 + 2)), yy = b - 62 - rh + j; R(ox + W0 / 2 - half, yy, half * 2, 1, j % 9 === 8 ? P.wood0 : P.wood1); }
        E(ox + W0 / 2, b - 62 - 16, 5, 5, P.wood0); E(ox + W0 / 2, b - 62 - 16, 4, 4, p.win > 0.35 ? mix('#3a4a66', '#ffd98a', p.win) : mix('#2e3c52', p.sky[2], 0.3)); VL(ox + W0 / 2, b - 82, 9, P.wood0); HL(ox + W0 / 2 - 4, b - 78, 9, P.wood0);
        for (let j = -3; j <= rh; j++) {
          const half = Math.round((j / rh) * (W0 / 2 + 2)) + 4, yy = b - 62 - rh + j;
          for (const s of [-1, 1]) { const ex = Math.round(ox + W0 / 2 + s * half); R(ex - 2, yy, 4, 3, '#4a2e18'); R(ex - 1, yy - 3, 3, 3, p.snowHi); P1(ex + s * 2, yy - 2, p.snow); }
        }
        R(ox - 8, b - 63, W0 + 16, 3, '#3a2210'); K.drift(ox - 9, b - 63, W0 + 18, 3, p, 7);
        K.icicles(ox - 6, b - 60, W0 + 12, 13);
        // stone chimney with a snow cap
        const cx0 = ox + 64;
        for (let yy = b - 108; yy < b - 70; yy += 4) for (let i = 0; i < 12; i += 4) { const cc = sh('#7d7b88', ((yy * 7 + i * 5) % 22) - 11); R(cx0 + i + ((yy >> 2) % 2 ? 2 : 0), yy, 4, 3, cc); P1(cx0 + i + ((yy >> 2) % 2 ? 2 : 0), yy, sh(cc, 20)); }
        R(cx0 - 1, b - 111, 16, 4, '#5a5864'); K.drift(cx0 - 2, b - 111, 18, 3, p, 3);
        // the red door with a wreath, under a little porch roof on two posts
        const dm = K.ramp('#c8352b');
        R(ox + 35, b - 46, 22, 46, dm.dd); R(ox + 37, b - 44, 18, 42, dm.m); VL(ox + 37, b - 44, 42, dm.l);
        for (const py of [b - 40, b - 22]) { R(ox + 39, py, 14, 14, dm.d); HL(ox + 39, py, 14, dm.dd); HL(ox + 39, py + 13, 14, dm.l); }
        P1(ox + 52, b - 22, '#f5c33b'); P1(ox + 52, b - 21, '#c8922f');
        for (let a = 0; a < 16; a++) { const an = (a / 16) * Math.PI * 2; P1(Math.round(ox + 46 + Math.cos(an) * 5), Math.round(b - 34 + Math.sin(an) * 5), a % 3 ? '#2f6a24' : '#4a8a34'); }
        P1(ox + 46, b - 28, '#d8263a'); P1(ox + 45, b - 28, '#d8263a'); P1(ox + 47, b - 29, '#f06a6a');
        const pm = K.ramp('#6a4424');
        R(ox + 28, b - 52, 36, 3, pm.m); HL(ox + 28, b - 52, 36, pm.h); K.drift(ox + 27, b - 52, 38, 3, p, 5);
        for (const px0 of [ox + 29, ox + 61]) { R(px0, b - 49, 3, 49, pm.m); VL(px0, b - 49, 49, pm.l); }
        R(ox + 26, b - 3, 40, 3, pm.m); HL(ox + 26, b - 3, 40, pm.h);
        // two windows with warm curtains and flower boxes full of snow
        for (const wx of [ox + 8, ox + 68]) {
          R(wx - 2, b - 52, 22, 20, P.wood0);
          R(wx, b - 50, 18, 16, p.win > 0.3 ? mix('#3a4a66', '#ffdc96', p.win) : mix('#2e3c52', p.sky[2], 0.3));
          if (p.win > 0.3) { R(wx, b - 50, 3, 16, '#c86a3a'); R(wx + 15, b - 50, 3, 16, '#c86a3a'); }
          VL(wx + 8, b - 50, 16, P.wood0); VL(wx + 9, b - 50, 16, P.wood0); HL(wx, b - 43, 18, P.wood0);
          R(wx - 3, b - 32, 24, 5, '#6a4424'); HL(wx - 3, b - 32, 24, '#8a5a2b'); K.drift(wx - 3, b - 32, 24, 3, p, wx);
          for (let i = wx - 2; i < wx + 20; i += 3) P1(i, b - 34, '#2f6a24');
        }
        // the woodpile against the far wall
        for (let r = 0; r < 4; r++) for (let i = 0; i < 5 - (r > 2 ? 1 : 0); i++) { const lx = ox + W0 + 4 + i * 6 + (r % 2) * 3, ly = b - 4 - r * 6; E(lx, ly, 3, 3, '#6a4424'); E(lx, ly, 2, 2, '#c8a070'); P1(lx, ly, '#8a6a3a'); }
        K.drift(ox + W0 + 1, b - 26, 30, 3, p, 17);
        // a shovel leaning by the door, and the lantern
        VL(ox + 24, b - 30, 26, '#8a5a2b'); R(ox + 21, b - 6, 7, 6, '#3a7ad8'); HL(ox + 21, b - 6, 7, '#8ac0f8');
        R(ox + 60, b - 46, 4, 6, '#2a2830'); R(ox + 61, b - 45, 2, 4, p.lamp > 0.3 ? '#ffe070' : '#8a7a5a');
      });
      gfx.popTarget();
    }
    g.drawImage(cabinCache, Math.round(x) - 22, Math.round(y) - 146);
    // the lantern's glow and the chimney smoke move
    if (p.lamp > 0.3) withA(0.2 * p.lamp, () => E(x + 49, y - 42, 12, 9, '#ffd98a'));
    for (let i = 0; i < 4; i++) { const k = (t * 0.35 + i * 0.25) % 1; withA(0.45 * (1 - k), () => E(Math.round(x + 49 + Math.sin(t + i) * 3 + k * 5), Math.round(y - 116 - k * 22), 2 + k * 4, 1.6 + k * 3, '#eef4f8')); }
    K.drift(x - 20, y + 1, 30, 5, p, 41); K.drift(x + 76, y + 1, 26, 4, p, 42);
  };
})(window.CH);
