// ============================================================================
// INTERIORS - the kit every room in Moose Hollow is built from
//
// Walls, floors, ceilings, shelving, lamps, plants, frames and rugs, painted
// pixel by pixel with real material texture (brick with mortar, beadboard,
// glazed tile, pressed tin, pegboard, worn planks), plus the views through the
// glass: a snowy street or the forest, drawn with the hand-drawn pixel pines
// and lit by the same hour as the world outside.
//
// Everything static is painted once into the room's background canvas; only
// the snow past the glass, the odd car and the little animated details are
// drawn each frame.
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, PX = CH.PIX;
  const K = (CH.IK = {});
  const R = gfx.rect, P1 = gfx.px, HL = gfx.hline, VL = gfx.vline, E = gfx.ellipse;
  const mix = gfx.mix, sh = gfx.shade;
  const rng = (s) => new CH.Rng((s >>> 0) || 1);
  K.rng = rng;

  // ---- small helpers ----------------------------------------------------------
  const withA = (a, fn) => { const g = gfx.cur, o = g.globalAlpha; g.globalAlpha = o * a; fn(); g.globalAlpha = o; };
  K.withA = withA;
  K.band = (x, y, w, h, c, a) => withA(a, () => R(x, y, w, h, c));
  K.speck = (x, y, w, h, c, a, seed, n) => { const r = rng(seed); withA(a, () => { for (let i = 0; i < n; i++) P1(x + r.int(0, w - 1), y + r.int(0, h - 1), c); }); };
  // five-step ramp from one colour
  K.ramp = (c) => ({ k: sh(c, -72), dd: sh(c, -46), d: sh(c, -26), m: c, l: sh(c, 18), h: sh(c, 36) });
  // stamp a little text grid (one letter per pixel) through a colour map
  K.stamp = (x, y, rows, map) => {
    for (let j = 0; j < rows.length; j++) {
      const r = rows[j];
      for (let i = 0; i < r.length; i++) { const c = map[r[i]]; if (c) P1(x + i, y + j, c); }
    }
  };

  // ============================================================================
  // WALLS
  // ============================================================================
  const MOTIF = {
    diamond: ['..a..', '.aba.', 'ab.ba', '.aba.', '..a..'],
    flower: ['.a.a.', 'aacaa', '.cbc.', 'aacaa', '.a.a.'],
    fleur: ['...a...', '..aba..', '.a.b.a.', 'aabbbaa', '...b...', '..aba..'],
    sprig: ['..c..', '.cac.', '..a..', '.a.b.', 'a....'],
    star: ['..a..', 'aabaa', '..a..'],
    dot: ['ab'],
    leaf: ['.aa..', 'abba.', '.aab.', '...c.'],
  };
  K.wallpaper = (x, y, w, h, base, motif = 'diamond', o = {}) => {
    gfx.clip(x, y, w, h);
    R(x, y, w, h, base);
    const a = o.a || sh(base, -16), b = o.b || sh(base, 14), c = o.c || sh(base, -28);
    if (o.stripe) {
      for (let i = x; i < x + w; i += o.stripe) {
        R(i, y, o.stripeW || 2, h, o.stripeC || sh(base, -7));
        VL(i + (o.stripeW || 2), y, h, o.stripeL || sh(base, 6));
      }
    }
    const m = MOTIF[motif] || MOTIF.diamond, mw = m[0].length, mh = m.length;
    const sx = o.sx || 16, sy = o.sy || 14;
    for (let yy = y + (o.oy || 4), row = 0; yy < y + h; yy += sy, row++) {
      for (let xx = x + (row & 1 ? sx >> 1 : 0) + (o.ox || 2); xx < x + w; xx += sx) {
        for (let j = 0; j < mh; j++) for (let i = 0; i < mw; i++) {
          const ch = m[j][i];
          if (ch !== '.') P1(xx + i, yy + j, ch === 'a' ? a : ch === 'b' ? b : c);
        }
      }
    }
    // paper is never perfectly even: a faint top light and a darker foot
    K.band(x, y, w, 10, '#ffffff', 0.06);
    K.band(x, y + h - 16, w, 16, '#1a1020', 0.08);
    gfx.unclip();
  };
  K.brick = (x, y, w, h, base, o = {}) => {
    const mortar = o.mortar || mix(base, '#d8ccb8', 0.55), r = rng(o.seed || 7);
    const bw = o.bw || 12, bh = o.bh || 5;
    gfx.clip(x, y, w, h);
    R(x, y, w, h, mortar);
    for (let yy = y, row = 0; yy < y + h; yy += bh + 1, row++) {
      for (let xx = x - (row & 1 ? (bw + 1) >> 1 : 0); xx < x + w; xx += bw + 1) {
        const c = sh(base, r.int(-16, 10));
        R(xx, yy, bw, bh, c);
        HL(xx, yy, bw, sh(c, 14));
        HL(xx, yy + bh - 1, bw, sh(c, -18));
        VL(xx + bw - 1, yy + 1, bh - 2, sh(c, -9));
        if (r.chance(0.16)) P1(xx + r.int(1, bw - 2), yy + r.int(1, bh - 2), sh(c, -26));
        if (r.chance(0.07)) R(xx + r.int(0, bw - 4), yy + 1, 3, 2, sh(c, 20));
        if (o.soot && r.chance(0.25)) withA(0.3, () => R(xx, yy, bw, bh, '#1a1210'));
      }
    }
    gfx.unclip();
    K.band(x, y, w, 6, '#1a1020', 0.14);
  };
  K.beadboard = (x, y, w, h, base, o = {}) => {
    const m = K.ramp(base), bw = o.bw || 6;
    R(x, y, w, h, m.m);
    for (let xx = x; xx < x + w; xx += bw) { VL(xx, y, h, m.dd); VL(xx + 1, y, h, m.l); VL(xx + bw - 2, y, h, sh(base, -8)); }
    const r = rng(o.seed || 11);
    for (let i = 0; i < w / 10; i++) VL(x + r.int(0, w - 1), y + r.int(0, h - 8), r.int(3, 8), sh(base, r.chance(0.5) ? -10 : 8));
    // cap rail and the shadow it throws
    R(x, y - 4, w, 4, m.l); HL(x, y - 4, w, m.h); HL(x, y - 2, w, m.m); HL(x, y - 1, w, m.dd);
    K.band(x, y, w, 3, '#1a1020', 0.22);
  };
  K.wainscot = (x, y, w, h, base, o = {}) => {
    const m = K.ramp(base), pw = o.pw || 30;
    R(x, y, w, h, m.m);
    for (let xx = x + 3; xx + pw <= x + w + pw - 6; xx += pw + 5) {
      const px0 = xx, py0 = y + 4, ww = Math.min(pw, x + w - 3 - xx), hh = h - 12;
      if (ww < 8) break;
      R(px0, py0, ww, hh, m.d);
      HL(px0, py0, ww, m.dd); VL(px0, py0, hh, m.dd);
      HL(px0, py0 + hh - 1, ww, m.h); VL(px0 + ww - 1, py0, hh, m.l);
      R(px0 + 3, py0 + 3, ww - 6, hh - 6, m.l);
      HL(px0 + 3, py0 + 3, ww - 6, m.h); VL(px0 + 3, py0 + 3, hh - 6, m.h);
      HL(px0 + 3, py0 + hh - 4, ww - 6, m.d); VL(px0 + ww - 4, py0 + 3, hh - 6, m.d);
    }
    // chair rail
    R(x, y - 4, w, 5, m.l); HL(x, y - 4, w, m.h); HL(x, y - 2, w, m.d); HL(x, y, w, m.dd);
    K.band(x, y + 1, w, 3, '#1a1020', 0.2);
  };
  K.tiles = (x, y, w, h, base, o = {}) => {
    const tw = o.tw || 8, th = o.th || 4, grout = o.grout || sh(base, -34), r = rng(o.seed || 3);
    gfx.clip(x, y, w, h);
    R(x, y, w, h, grout);
    for (let yy = y, row = 0; yy < y + h; yy += th + 1, row++) {
      const off = o.stagger === false ? 0 : (row & 1 ? (tw + 1) >> 1 : 0);
      for (let xx = x - off, col = 0; xx < x + w; xx += tw + 1, col++) {
        let c = sh(base, r.int(-4, 3));
        if (o.alt && ((row + col) & 1)) c = o.alt;
        R(xx, yy, tw, th, c);
        HL(xx, yy, tw, sh(c, 14)); P1(xx, yy, sh(c, 30)); P1(xx + 1, yy, sh(c, 22));
        HL(xx, yy + th - 1, tw, sh(c, -12));
      }
    }
    gfx.unclip();
  };
  K.pegboard = (x, y, w, h, base = '#a8784a') => {
    const m = K.ramp(base);
    R(x, y, w, h, m.m);
    K.speck(x, y, w, h, m.l, 0.5, 51, (w * h) / 14);
    for (let yy = y + 2; yy < y + h - 1; yy += 4) for (let xx = x + 2; xx < x + w - 1; xx += 4) { P1(xx, yy, m.k); P1(xx, yy + 1, m.l); }
    R(x - 2, y - 2, w + 4, 2, '#6a4a2a'); R(x - 2, y + h, w + 4, 2, '#6a4a2a');
    VL(x - 2, y, h, '#6a4a2a'); VL(x + w + 1, y, h, '#4a3218');
  };
  K.blocks = (x, y, w, h, base) => {
    const r = rng(77);
    gfx.clip(x, y, w, h);
    R(x, y, w, h, sh(base, -22));
    for (let yy = y, row = 0; yy < y + h; yy += 9, row++) {
      for (let xx = x - (row & 1 ? 9 : 0); xx < x + w; xx += 18) {
        const c = sh(base, r.int(-6, 5));
        R(xx, yy, 17, 8, c); HL(xx, yy, 17, sh(c, 12)); HL(xx, yy + 7, 17, sh(c, -12));
        for (let i = 0; i < 5; i++) P1(xx + r.int(1, 15), yy + r.int(1, 6), sh(c, r.chance(0.5) ? -10 : 8));
      }
    }
    gfx.unclip();
  };
  K.knotty = (x, y, w, h, base = '#c8924f', seed = 5) => {
    CH.drawPlanks(gfx.cur, x, y, w, h, 8, base, sh(base, -40), sh(base, 22), seed, true);
    K.band(x, y, w, 8, '#1a1020', 0.16);
  };
  K.crown = (x, y, w, base) => {
    const m = K.ramp(base);
    R(x, y, w, 7, m.m);
    HL(x, y, w, m.dd); HL(x, y + 1, w, m.h); HL(x, y + 2, w, m.l);
    for (let i = x; i < x + w; i += 4) { P1(i, y + 3, m.d); P1(i + 1, y + 3, m.d); }
    HL(x, y + 4, w, m.l); HL(x, y + 5, w, m.d); HL(x, y + 6, w, m.dd);
    K.band(x, y + 7, w, 4, '#1a1020', 0.2);
  };
  K.baseboard = (x, y, w, base) => {
    const m = K.ramp(base);
    R(x, y - 7, w, 7, m.m); HL(x, y - 7, w, m.h); HL(x, y - 6, w, m.l); HL(x, y - 3, w, m.d); HL(x, y - 1, w, m.k);
    K.band(x, y - 12, w, 5, '#1a1020', 0.1);
  };

  // ---- ceilings ---------------------------------------------------------------
  K.ceiling = (w, y1, style, base) => {
    const m = K.ramp(base);
    if (style === 'tin') {
      R(0, 0, w, y1, m.m);
      for (let yy = 0; yy < y1; yy += 12) for (let xx = 0; xx < w; xx += 12) {
        HL(xx, yy, 12, m.d); VL(xx, yy, 12, m.d); HL(xx + 1, yy + 1, 10, m.l); VL(xx + 1, yy + 1, 10, m.l);
        K.stamp(xx + 3, yy + 3, ['..a..', '.aba.', 'abcba', '.aba.', '..a..'], { a: m.l, b: m.h, c: m.d });
      }
      K.band(0, y1 - 8, w, 8, '#1a1020', 0.2);
    } else if (style === 'drop') {
      R(0, 0, w, y1, m.m);
      K.speck(0, 0, w, y1, m.d, 0.5, 91, (w * y1) / 10);
      for (let xx = 0; xx < w; xx += 24) { VL(xx, 0, y1, m.dd); VL(xx + 1, 0, y1, m.h); }
      for (let yy = 0; yy < y1; yy += 12) { HL(0, yy, w, m.dd); HL(0, yy + 1, w, m.h); }
      K.band(0, y1 - 6, w, 6, '#1a1020', 0.18);
    } else if (style === 'beams') {
      R(0, 0, w, y1, m.d);
      for (let yy = 0; yy < y1; yy += 5) { HL(0, yy, w, m.dd); HL(0, yy + 1, w, m.m); }
      for (let xx = 18; xx < w; xx += 70) { R(xx, 0, 10, y1, m.k); VL(xx, 0, y1, m.d); VL(xx + 1, 0, y1, m.m); VL(xx + 9, 0, y1, '#0a0608'); }
      K.band(0, y1 - 8, w, 8, '#0a0608', 0.3);
    } else {
      R(0, 0, w, y1, m.dd);
      K.band(0, y1 - 8, w, 8, '#000000', 0.3);
    }
  };

  // ============================================================================
  // FLOORS
  // ============================================================================
  K.floorPlanks = (y, w, h, base, seed = 13) => {
    const m = K.ramp(base);
    CH.drawPlanks(gfx.cur, 0, y, w, h, 6, m.m, m.dd, m.l, seed);
    for (let x = -30; x < w; x += 52) { VL(x + 26, y, h, m.dd); VL(x + 27, y, h, m.l); }
    K.band(0, y, w, 5, '#140c10', 0.34); K.band(0, y + 5, w, 5, '#140c10', 0.14);
    HL(0, y, w, '#140c10');
    K.speck(0, y + 3, w, h - 3, m.d, 0.35, seed + 1, w / 3);
  };
  K.floorChecker = (y, w, h, c1, c2, o = {}) => {
    const rows = [3, 4, 4, 5, 6, 6, 7, 8, 9, 10, 11];
    const tw = o.tw || 12;
    let yy = y, row = 0;
    while (yy < y + h) {
      const rh = rows[Math.min(row, rows.length - 1)];
      for (let x = 0, col = 0; x < w; x += tw, col++) {
        const c = (row + col) & 1 ? c1 : c2;
        R(x, yy, tw, rh, c);
        HL(x, yy, tw, sh(c, 12));
      }
      yy += rh; row++;
    }
    K.band(0, y, w, 6, '#140c10', 0.3);
    HL(0, y, w, '#140c10');
    // the polish catches the lamps
    K.band(0, y + 10, w, 2, '#ffffff', 0.08);
  };
  K.floorVinyl = (y, w, h, base) => {
    const m = K.ramp(base);
    R(0, y, w, h, m.m);
    for (let yy = y, row = 0; yy < y + h; yy += 11, row++) for (let x = -(row & 1) * 11; x < w; x += 22) R(x, yy, 11, 11, m.l);
    K.speck(0, y, w, h, m.d, 0.55, 61, (w * h) / 26);
    K.speck(0, y, w, h, m.h, 0.5, 62, (w * h) / 32);
    for (let yy = y; yy < y + h; yy += 11) HL(0, yy, w, m.d);
    for (let x = 0; x < w; x += 11) VL(x, y, h, m.d);
    K.band(0, y, w, 5, '#140c10', 0.25); HL(0, y, w, '#140c10');
  };
  K.floorConcrete = (y, w, h, base, o = {}) => {
    const m = K.ramp(base), r = rng(o.seed || 33);
    R(0, y, w, h, m.m);
    K.speck(0, y, w, h, m.d, 0.6, 71, (w * h) / 8);
    K.speck(0, y, w, h, m.l, 0.5, 72, (w * h) / 12);
    for (let i = 0; i < w / 60; i++) {
      let cx = r.int(0, w), cy = y + r.int(2, h - 2);
      for (let k = 0; k < 16; k++) { P1(cx, cy, m.dd); cx += r.int(1, 2); cy += r.int(-1, 1); if (cy < y + 1 || cy > y + h - 1) break; }
    }
    for (let i = 0; i < (o.stains || 3); i++) {
      const sx = r.int(20, w - 20), sy = y + r.int(6, h - 6);
      withA(0.45, () => { E(sx, sy, r.int(8, 16), 2 + r.int(0, 2), '#1a1a20'); });
      withA(0.3, () => { E(sx - 2, sy, r.int(4, 8), 1, '#3a3a4a'); });
    }
    for (let x = 0; x < w; x += 80) VL(x, y, h, m.d);
    K.band(0, y, w, 5, '#140c10', 0.3); HL(0, y, w, '#140c10');
  };
  // arcade carpet: dark, with neon squiggles, planets and stars - the one every arcade had
  K.carpet = (y, w, h, base, cols) => {
    const r = rng(404);
    R(0, y, w, h, base);
    K.speck(0, y, w, h, sh(base, 12), 0.5, 405, (w * h) / 9);
    for (let i = 0; i < w / 7; i++) {
      const x = r.int(0, w), yy = y + r.int(1, h - 2), c = r.pick(cols), k = r.int(0, 3);
      if (k === 0) { P1(x, yy, c); P1(x + 1, yy - 1, c); P1(x + 2, yy, c); P1(x + 3, yy + 1, c); P1(x + 4, yy, c); }
      else if (k === 1) { E(x, yy, 2, 1, c); HL(x - 3, yy, 7, sh(c, -40)); }
      else if (k === 2) { P1(x, yy, '#ffffff'); P1(x - 1, yy, c); P1(x + 1, yy, c); }
      else { R(x, yy, 2, 1, c); P1(x + 2, yy + 1, c); }
    }
    K.band(0, y, w, 6, '#000000', 0.35);
  };
  K.floorHexTile = (y, w, h, base, grout) => {
    R(0, y, w, h, grout);
    for (let yy = y, row = 0; yy < y + h; yy += 4, row++) for (let x = (row & 1) * 4; x < w; x += 8) { R(x, yy, 6, 3, base); P1(x, yy, sh(base, 14)); }
    K.band(0, y, w, 5, '#140c10', 0.3); HL(0, y, w, '#140c10');
  };

  // a rug lying on the floor, seen at a low angle
  K.rug = (x, y, w, h, c1, c2, o = {}) => {
    const m = K.ramp(c1);
    R(x, y, w, h, m.m);
    R(x + 2, y + 1, w - 4, h - 2, m.d);
    R(x + 3, y + 1, w - 6, h - 2, m.m);
    for (let i = x + 6; i < x + w - 6; i += 8) { P1(i, y + (h >> 1), c2); P1(i + 1, y + (h >> 1) - 1, c2); P1(i + 1, y + (h >> 1) + 1, c2); P1(i + 2, y + (h >> 1), c2); }
    HL(x + 3, y + 1, w - 6, c2); HL(x + 3, y + h - 2, w - 6, c2);
    HL(x, y, w, m.l);
    for (let i = x; i < x + w; i += 2) { P1(i, y + h, o.fringe || '#e8dcc0'); }
    withA(0.25, () => HL(x, y + h + 1, w, '#140c10'));
  };

  // ============================================================================
  // FIXTURES
  // ============================================================================
  // A tall shelving unit: back panel, sides, cornice and shelves. Returns the
  // y of each shelf top so the caller can stock it.
  K.shelves = (x, yb, w, h, wood, n, o = {}) => {
    const m = K.ramp(wood), back = o.back || sh(wood, -40);
    const top = yb - h;
    R(x, top, w, h, back);
    K.speck(x + 3, top + 4, w - 6, h - 6, sh(back, -10), 0.5, x + 3, (w * h) / 30);
    // cornice
    R(x - 2, top - 5, w + 4, 5, m.m); HL(x - 2, top - 5, w + 4, m.h); HL(x - 2, top - 4, w + 4, m.l); HL(x - 2, top - 1, w + 4, m.dd);
    // sides
    R(x, top, 3, h, m.m); VL(x, top, h, m.l); VL(x + 2, top, h, m.d);
    R(x + w - 3, top, 3, h, m.m); VL(x + w - 3, top, h, m.l); VL(x + w - 1, top, h, m.dd);
    const ys = [];
    const gap = (h - 6) / n;
    for (let i = 1; i <= n; i++) {
      const sy = Math.round(top + 2 + gap * i);
      R(x + 3, sy, w - 6, 3, m.m); HL(x + 3, sy, w - 6, m.h); HL(x + 3, sy + 2, w - 6, m.dd);
      K.band(x + 3, sy + 3, w - 6, 3, '#140c10', 0.25);
      K.band(x + 3, sy - Math.round(gap) + 3, w - 6, 4, '#140c10', 0.18);
      ys.push(sy);
    }
    // kick plate
    R(x, yb - 4, w, 4, m.d); HL(x, yb - 4, w, m.m);
    return ys;
  };
  // a floating wall shelf on two brackets
  K.wallShelf = (x, y, w, wood) => {
    const m = K.ramp(wood);
    R(x, y, w, 3, m.m); HL(x, y, w, m.h); HL(x, y + 2, w, m.dd);
    for (const bx of [x + 3, x + w - 6]) { R(bx, y + 3, 3, 4, '#3a3440'); P1(bx, y + 3, '#5a5462'); P1(bx + 2, y + 6, '#3a3440'); }
    K.band(x, y + 3, w, 3, '#140c10', 0.22);
  };
  // shop counter: panelled front, a slab top, a kick plate
  K.counter = (x, yb, w, h, wood, o = {}) => {
    const m = K.ramp(wood), top = o.top || sh(wood, 14);
    const tm = K.ramp(top);
    R(x, yb - h, w, h, m.m);
    for (let px0 = x + 4; px0 + 18 <= x + w - 2; px0 += 22) {
      R(px0, yb - h + 6, 18, h - 13, m.d);
      HL(px0, yb - h + 6, 18, m.dd); VL(px0, yb - h + 6, h - 13, m.dd);
      HL(px0, yb - 8, 18, m.l); VL(px0 + 17, yb - h + 6, h - 13, m.l);
      R(px0 + 2, yb - h + 8, 14, h - 17, m.m);
    }
    if (o.stripe) { R(x, yb - h + 3, w, 2, o.stripe); HL(x, yb - h + 3, w, sh(o.stripe, 20)); }
    R(x, yb - 5, w, 5, m.dd); HL(x, yb - 5, w, m.d);
    R(x - 3, yb - h - 4, w + 6, 4, tm.m); HL(x - 3, yb - h - 4, w + 6, tm.h); HL(x - 3, yb - h - 1, w + 6, tm.dd);
    K.band(x, yb - h, w, 3, '#140c10', 0.3);
    return yb - h - 4;
  };

  // hanging lamps: cord + shade + lit bulb; the glow itself is a scene light
  K.pendant = (x, y0, len, style = 'dome', c = '#2f5a44') => {
    const m = K.ramp(c);
    VL(x, y0, len, '#241f2a');
    const y = y0 + len;
    // the bulb glows (see the shader in 97_post.js)
    if (style === 'tube') { CH.emitStatic(x - 8, y + 5, 3, '#eaf4ff', 0.8); CH.emitStatic(x + 8, y + 5, 3, '#eaf4ff', 0.8); }
    else CH.emitStatic(x, y + (style === 'edison' ? 6 : 9), style === 'edison' ? 3 : 4, style === 'edison' ? '#ffc870' : '#ffe6a0', 0.9);
    if (style === 'dome') {
      R(x - 1, y, 3, 2, '#3a3440');
      E(x, y + 5, 8, 4, m.m); R(x - 8, y + 5, 17, 3, m.m);
      HL(x - 7, y + 2, 15, m.l); P1(x - 5, y + 3, m.h); P1(x - 4, y + 3, m.h);
      HL(x - 8, y + 7, 17, m.dd);
      R(x - 3, y + 8, 7, 2, '#fff4c8'); HL(x - 2, y + 10, 5, '#ffe08a');
    } else if (style === 'cone') {
      for (let j = 0; j < 7; j++) HL(x - 1 - j, y + j, 3 + j * 2, j < 2 ? m.l : m.m);
      HL(x - 7, y + 7, 15, m.dd); P1(x - 3, y + 3, m.h);
      R(x - 2, y + 8, 5, 2, '#fff4c8');
    } else if (style === 'edison') {
      R(x - 1, y, 3, 3, '#6a5030'); HL(x - 1, y, 3, '#8a6a40');
      E(x, y + 6, 3, 4, '#ffe8a0'); E(x, y + 6, 2, 3, '#fff8d8');
      P1(x, y + 5, '#ff9a3c'); P1(x, y + 7, '#ff9a3c'); P1(x - 1, y + 6, '#ffb454'); P1(x + 1, y + 6, '#ffb454');
    } else if (style === 'tube') {
      R(x - 14, y, 28, 4, '#d8dce4'); HL(x - 14, y, 28, '#f4f6fa'); R(x - 12, y + 4, 24, 2, '#fdfdf0'); HL(x - 14, y + 3, 28, '#8a8f9c');
      VL(x - 10, y0, len, '#241f2a'); VL(x + 10, y0, len, '#241f2a');
    } else if (style === 'drum') {
      R(x - 7, y, 15, 8, m.m); HL(x - 7, y, 15, m.l); VL(x - 7, y, 8, m.l); VL(x + 7, y, 8, m.d); HL(x - 7, y + 7, 15, m.dd);
      for (let i = x - 5; i < x + 6; i += 3) VL(i, y + 1, 6, sh(c, 8));
      R(x - 4, y + 8, 9, 1, '#fff4c8');
    }
  };
  // Christmas-y string lights / bunting / pine garland, sagging between two points
  K.garland = (x0, x1, y, sag, kind = 'lights', cols) => {
    const n = Math.max(2, Math.round((x1 - x0) / 5));
    let prev = null;
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = Math.round(x0 + (x1 - x0) * u), yy = Math.round(y + Math.sin(u * Math.PI) * sag);
      if (kind === 'pine') {
        E(x, yy, 3, 2, '#1f4a1c'); P1(x - 2, yy - 1, '#3a7a2c'); P1(x + 1, yy - 1, '#4a8a34'); P1(x, yy + 1, '#2a5a22'); P1(x + 2, yy, '#3a7a2c');
        if (i % 4 === 2) { P1(x, yy, '#d8263a'); P1(x + 1, yy, '#f06a6a'); }
        if (i % 7 === 5) { P1(x - 1, yy + 1, '#f5c33b'); }
      } else {
        if (prev) gfx.line(prev[0], prev[1], x, yy, '#241f2a');
        if (kind === 'lights' && i % 2 === 0) { const c = cols[(i >> 1) % cols.length]; P1(x, yy + 1, c); P1(x, yy + 2, c); P1(x + 1, yy + 1, sh(c, 30)); }
        if (kind === 'flags' && i % 2 === 0 && i < n) { const c = cols[(i >> 1) % cols.length]; for (let j = 0; j < 4; j++) HL(x + j - 0, yy + 1 + j, Math.max(1, 5 - j * 2 + (j === 0 ? 1 : 0)), j === 0 ? sh(c, 20) : c); }
      }
      prev = [x, yy];
    }
  };
  // a framed picture; `kind` chooses what is in it
  K.picture = (x, y, w, h, frame = '#6b4630', kind = 'lake', o = {}) => {
    const m = K.ramp(frame);
    R(x - 1, y - 1, w + 2, h + 2, '#140c10');
    R(x, y, w, h, m.m); HL(x, y, w, m.h); VL(x, y, h, m.l); HL(x, y + h - 1, w, m.dd); VL(x + w - 1, y, h, m.d);
    const ix = x + 3, iy = y + 3, iw = w - 6, ih = h - 6;
    gfx.clip(ix, iy, iw, ih);
    if (kind === 'lake') {
      gfx.vgrad(ix, iy, iw, ih, ['#8fb4d8', '#b8d4ea', '#d8e8f2']);
      const hz = iy + Math.round(ih * 0.55);
      R(ix, hz, iw, ih, '#e9f1f7');
      R(ix, hz + 2, iw, 3, '#9fc0dc'); HL(ix + 2, hz + 3, iw - 8, '#c8e0f0');
      for (let i = 0; i < iw; i += 5) PX.draw('farPine', ix + i, hz + 1, { remap: { a: '#3a5a4a', b: '#6a8a78' } });
      if (iw > 22) PX.draw('tinyPine', ix + iw - 7, iy + ih - 1);
    } else if (kind === 'moose') {
      R(ix, iy, iw, ih, '#d8c8a0');
      E(ix + iw / 2, iy + ih * 0.6, iw * 0.3, ih * 0.22, '#5a3a22');
      R(ix + iw * 0.35, iy + ih * 0.3, iw * 0.3, ih * 0.3, '#5a3a22');
      HL(ix + 2, iy + 4, iw * 0.4, '#5a3a22'); HL(ix + iw * 0.6, iy + 4, iw * 0.4 - 2, '#5a3a22');
      VL(ix + 3, iy + 2, 4, '#5a3a22'); VL(ix + iw - 4, iy + 2, 4, '#5a3a22');
    } else if (kind === 'photo') {
      R(ix, iy, iw, ih, '#e8d8b8');
      const cols = o.cols || ['#8a5a3a', '#c8a882', '#6a4a3a'];
      for (let i = 0; i < 3; i++) { const cx = ix + 4 + i * ((iw - 8) / 2); E(cx, iy + ih - 4, 3, 4, cols[i]); E(cx, iy + ih - 9, 2.4, 2.4, sh(cols[i], 20)); }
      K.band(ix, iy, iw, ih, '#8a6a3a', 0.2);
    } else if (kind === 'text') {
      R(ix, iy, iw, ih, o.bg || '#f4ecd8');
      (o.lines || []).forEach((l, i) => gfx.text(l, ix + iw / 2, iy + 1 + i * 7, o.ink || '#3a2a1a', { align: 'center', font: 'small' }));
    } else if (kind === 'abstract') {
      R(ix, iy, iw, ih, o.bg || '#f4ecd8');
      E(ix + iw * 0.35, iy + ih * 0.45, iw * 0.22, ih * 0.22, o.c1 || '#e05a4a');
      R(ix + iw * 0.5, iy + ih * 0.2, iw * 0.3, ih * 0.5, o.c2 || '#3a6ba8');
      HL(ix + 2, iy + ih - 4, iw - 4, o.c3 || '#f5c33b');
    } else if (kind === 'fish') {
      R(ix, iy, iw, ih, '#cfe4ee');
      E(ix + iw * 0.45, iy + ih * 0.5, iw * 0.3, ih * 0.22, '#5a8a6a'); E(ix + iw * 0.4, iy + ih * 0.46, iw * 0.2, ih * 0.1, '#8ac09a');
      P1(ix + iw * 0.25, iy + ih * 0.46, '#141018');
      for (let j = -2; j <= 2; j++) P1(ix + iw * 0.78, iy + ih * 0.5 + j, '#5a8a6a');
    } else if (kind === 'map') {
      R(ix, iy, iw, ih, '#e8dcb8');
      E(ix + iw * 0.5, iy + ih * 0.55, iw * 0.3, ih * 0.25, '#9fc0dc');
      for (let i = 0; i < 6; i++) P1(ix + 2 + i * 4, iy + 3 + (i % 2) * 2, '#4a8a5a');
      P1(ix + iw * 0.55, iy + ih * 0.5, '#d8263a'); P1(ix + iw * 0.55 + 1, iy + ih * 0.5, '#d8263a');
    }
    gfx.unclip();
    // glass glint
    withA(0.25, () => { P1(ix + 1, iy + 1, '#ffffff'); P1(ix + 2, iy + 1, '#ffffff'); P1(ix + 1, iy + 2, '#ffffff'); });
    K.band(x + 1, y + h + 1, w, 2, '#140c10', 0.2);
  };
  K.chalkboard = (x, y, w, h, lines, o = {}) => {
    R(x - 1, y - 1, w + 2, h + 2, '#140c10');
    R(x, y, w, h, o.frame || '#8a5a2b'); HL(x, y, w, '#b07a40'); HL(x, y + h - 1, w, '#5a3a18');
    R(x + 3, y + 3, w - 6, h - 6, o.board || '#24302a');
    K.speck(x + 3, y + 3, w - 6, h - 6, '#3a4a40', 0.6, x, (w * h) / 16);
    withA(0.18, () => { gfx.line(x + 5, y + h - 8, x + w - 12, y + 6, '#e8e8e0'); });
    lines.forEach((l, i) => {
      const L = typeof l === 'string' ? { t: l } : l;
      gfx.text(L.t, L.x !== undefined ? x + L.x : x + w / 2, y + 5 + i * 8, L.c || '#ece6d6', { align: L.x !== undefined ? 'left' : 'center', font: 'small' });
    });
    // chalk tray + a stub of chalk
    R(x + 2, y + h, w - 4, 2, '#6a4520'); R(x + w - 12, y + h - 1, 4, 1, '#f4f0e6');
  };
  K.corkboard = (x, y, w, h, seed = 1) => {
    const r = rng(seed);
    R(x - 1, y - 1, w + 2, h + 2, '#140c10');
    R(x, y, w, h, '#8a5a2b'); R(x + 2, y + 2, w - 4, h - 4, '#c8945a');
    K.speck(x + 2, y + 2, w - 4, h - 4, '#a87440', 0.8, seed, (w * h) / 6);
    for (let i = 0; i < Math.floor((w * h) / 120); i++) {
      const nw = r.int(7, 11), nh = r.int(6, 9), nx = x + 3 + r.int(0, w - nw - 6), ny = y + 3 + r.int(0, h - nh - 6);
      const c = r.pick(['#f6f2e6', '#fff0a0', '#ffd0d8', '#cfe8ff', '#e8f4d8']);
      R(nx + 1, ny + 1, nw, nh, 'rgba(20,12,16,0.25)');
      R(nx, ny, nw, nh, c);
      for (let k = 2; k < nh - 1; k += 2) HL(nx + 1, ny + k, r.int(3, nw - 2), sh(c, -60));
      P1(nx + (nw >> 1), ny, r.pick(['#d8263a', '#3a6ba8', '#4a9a4a']));
    }
  };
  // a wall clock with a static face; hands are drawn live by K.clockHands
  K.clock = (x, y, r = 6, rim = '#3a3440', face = '#f6f2e6') => {
    E(x, y, r + 1, r + 1, '#140c10'); E(x, y, r, r, rim); E(x, y, r - 1, r - 1, face);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; P1(Math.round(x + Math.cos(a) * (r - 2)), Math.round(y + Math.sin(a) * (r - 2)), i % 3 ? sh(face, -40) : '#3a3440'); }
    P1(x - r + 2, y - r + 3, '#ffffff');
  };
  K.clockHands = (x, y, r = 6) => {
    const h = CH.state.hour || 0, mn = (h % 1) * 60;
    const a1 = ((h % 12) / 12) * Math.PI * 2 - Math.PI / 2, a2 = (mn / 60) * Math.PI * 2 - Math.PI / 2;
    gfx.line(x, y, Math.round(x + Math.cos(a1) * (r - 3)), Math.round(y + Math.sin(a1) * (r - 3)), '#241f2a');
    gfx.line(x, y, Math.round(x + Math.cos(a2) * (r - 2)), Math.round(y + Math.sin(a2) * (r - 2)), '#3a3440');
    P1(x, y, '#c8352b');
  };
  // a hanging sign board on two chains
  K.hangSign = (x, y, text, bg, fg, o = {}) => {
    const w = gfx.textWidth(text, 'small') + 10, h = 11;
    const x0 = Math.round(x - w / 2);
    VL(x0 + 3, y - (o.chain || 8), o.chain || 8, '#5a5462'); VL(x0 + w - 4, y - (o.chain || 8), o.chain || 8, '#5a5462');
    R(x0 - 1, y - 1, w + 2, h + 2, '#140c10');
    R(x0, y, w, h, bg); HL(x0, y, w, sh(bg, 30)); HL(x0, y + h - 1, w, sh(bg, -30));
    gfx.text(text, x, y + 2, fg, { align: 'center', font: 'small' });
    return w;
  };

  // ---- plants: hand-drawn --------------------------------------------------------
  PX.def('fern', { k: '#1a3a16', d: '#2f6a24', g: '#4a9a34', l: '#7ac44e', p: '#a8522c', P: '#d0703a', q: '#7a3a1c' }, [
    '....k....k.....',
    '..kgk.k.klk.k..',
    '.kglk.klgk.kgk.',
    'kgllkkglgkklgk.',
    'kdglgkglllkgldk',
    '.kdgglgllggldk.',
    'kgkdglllllgdkgk',
    '.kgkdglglgdkgk.',
    '..kkkkkkkkkkk..',
    '...kPPPPPPPk...',
    '...kpPpppppk...',
    '....kpppppk....',
    '....kqqqqqk....',
    '.....kkkkk.....',
  ], { ax: 7, ay: 14 });
  PX.def('snakePlant', { k: '#1a3016', d: '#2f5a24', g: '#4a8a3a', l: '#8ac45a', y: '#d8d86a', p: '#e8e2d2', P: '#b8b0a0' }, [
    '..k....k..',
    '.kgk..kgk.',
    '.kgk.klgk.',
    '.klgkkgyk.',
    'kgyk.kgk.k',
    'kgkkkgykkg',
    'kgkgkglkgk',
    'kykgkgkgyk',
    'kgkgygkgkk',
    'kkkkkkkkkk',
    '.kpppppPk.',
    '.kpppppPk.',
    '..kPPPPk..',
    '..kkkkkk..',
  ], { ax: 5, ay: 14 });
  PX.def('pothos', { k: '#1a3a16', d: '#2f6a24', g: '#4a9a34', l: '#8ad05a', p: '#e8e2d2', P: '#b8b0a0' }, [
    '.kkkkkkkk.',
    'kpppppppPk',
    '.kpppppPk.',
    'kgkkkkkkgk',
    'kllk..kgdk',
    '.kgk..kgk.',
    '..kk..kgk.',
    '.kgk...k..',
    'klgk..kgk.',
    '.kk...kldk',
    '.......kk.',
  ], { ax: 5, ay: 0 });
  PX.def('cactus', { k: '#1a3016', g: '#4a8a3a', l: '#7ab85a', w: '#f4f0e0', p: '#c86a3a', P: '#e8904a', r: '#e05a7a' }, [
    '...kk...',
    '..krrk..',
    '..kglk..',
    'kkkglk..',
    'kgkwlkkk',
    'kglglkgk',
    'kkkglkgk',
    '..kglwlk',
    '..kglkkk',
    '.kkkkkk.',
    '.kPpppk.',
    '..kppk..',
    '..kkkk..',
  ], { ax: 4, ay: 13 });
  PX.def('bigPlant', { k: '#12301a', d: '#2a5a2a', g: '#3f8a3a', l: '#6ab84e', h: '#9ad86a', p: '#5a4a6a', P: '#7a6a8a', q: '#3a2e48' }, [
    '.......kk.........',
    '...kk.klgk..kk....',
    '..kglkkglgkkglk...',
    '.kglhlkglhlkgllk..',
    '.klhllkdglkklhlgk.',
    'kglllgkdgkkglllgdk',
    'kdgllgdkgkdgllgdk.',
    '.kdgggdkgkdgggdk..',
    'kglkddgkgkgddkglk.',
    'kllgkkdkgkdkkglldk',
    '.kdglgkdgdkglgdk..',
    '..kkdgkdgdkgdkk...',
    '....kkkdgdkkk.....',
    '......kdgdk.......',
    '...kkkkkkkkkkkk...',
    '...kPPPPPPPPPpk...',
    '....kpPpppppppk...',
    '....kpppppppppk...',
    '.....kqqqqqqqk....',
    '.....kkkkkkkkk....',
  ], { ax: 9, ay: 20 });
  K.plant = (x, yb, kind = 'fern', flip) => PX.draw(kind, x, yb, { flip });

  // ============================================================================
  // HOUSES - for the streets seen through glass and the row behind Main Street
  // ============================================================================
  // (x, yb) is the bottom-left corner. o: {color, roof, trim, style, storeys,
  // gable, chimney, door, seed}; p is the sky palette of the hour.
  K.house = (x, yb, w, h, o, p) => {
    const r = rng(o.seed || 1), body = o.color || '#8a5a4a', trim = o.trim || '#e8e2d6';
    const bm = K.ramp(body), tm = K.ramp(trim), roof = K.ramp(o.roof || '#4a3a44');
    const snow = p ? p.snowHi : '#f4f8fc', snowS = p ? p.snowSh : '#c8d4e4';
    const lit = p ? p.win : 0.3, gable = o.gable !== false;
    const top = yb - h;
    // body with clapboard siding
    R(x, top, w, h, bm.m);
    if (o.style === 'brick') K.brick(x, top, w, h, body, { seed: o.seed, bw: 6, bh: 2 });
    else for (let yy = top + 2; yy < yb; yy += 3) { HL(x, yy, w, bm.d); HL(x, yy + 1, w, bm.l); }
    VL(x, top, h, tm.m); VL(x + 1, top, h, tm.d); VL(x + w - 1, top, h, tm.d); VL(x + w - 2, top, h, tm.m);
    // roof
    if (gable) {
      // gable end facing the street: triangle wall, then thick sloped eaves with snow
      const rh = Math.round(w * 0.45);
      for (let j = 0; j < rh; j++) {
        const half = Math.round(((j + 1) / rh) * (w / 2));
        const yy = top - rh + j;
        R(x + w / 2 - half, yy, half * 2, 1, j % 3 === 2 ? bm.d : bm.m);
      }
      // attic window
      if (w > 22) { const ax = Math.round(x + w / 2 - 3), ay = top - Math.round(rh * 0.55); R(ax - 1, ay - 1, 8, 7, tm.m); R(ax, ay, 6, 5, lit > 0.35 ? mix('#3a4a66', '#ffd98a', lit * 0.8) : '#2e3c52'); VL(ax + 3, ay, 5, tm.m); }
      // eaves: shingle edge, snow on top
      for (let j = -2; j <= rh; j++) {
        const u = j / rh, half = Math.round(u * (w / 2)) + 2;
        const yy = top - rh + j;
        for (const s of [-1, 1]) {
          const ex = Math.round(x + w / 2 + s * half);
          R(ex - (s < 0 ? 1 : 1), yy, 3, 2, roof.dd);
          P1(ex, yy - 1, snow); P1(ex + s, yy - 1, snow); P1(ex - s, yy - 2, snowS);
        }
      }
      R(x - 3, top - 1, w + 6, 2, roof.d);
      HL(x - 3, top - 2, 4, snow); HL(x + w - 1, top - 2, 4, snow);
      // icicles
      for (let i = x + 2; i < x + w - 2; i += 5 + r.int(0, 3)) { VL(i, top + 1, 1 + r.int(1, 3), 'rgba(214,236,248,0.9)'); }
    } else {
      // long side facing the street: a snow-covered roof slab
      const rh = Math.round(h * 0.45);
      for (let j = 0; j < rh; j++) {
        const inset = Math.round((rh - j) * 0.9);
        const yy = top - rh + j;
        const c = j < rh * 0.55 ? (j % 2 ? snow : mix(snow, snowS, 0.4)) : (j % 3 === 0 ? roof.dd : roof.m);
        R(x - 3 + inset, yy, w + 6 - inset * 2, 1, c);
        if (j >= rh * 0.55 && j % 3 === 1) for (let i = x + inset; i < x + w - inset; i += 4) P1(i + (j % 2) * 2, yy, roof.d);
      }
      R(x - 4, top - 1, w + 8, 2, roof.dd);
      for (let i = x - 3; i < x + w + 3; i += 3) P1(i, top - 1 - r.int(0, 1), snow);
      for (let i = x + 2; i < x + w - 2; i += 4 + r.int(0, 3)) VL(i, top + 1, 1 + r.int(1, 3), 'rgba(214,236,248,0.9)');
    }
    // chimney
    if (o.chimney !== false) {
      const cx = Math.round(x + w * (gable ? 0.72 : 0.78)), ch = gable ? Math.round(w * 0.45) + 4 : Math.round(h * 0.45) + 5;
      R(cx, top - ch, 5, ch - (gable ? Math.round(w * 0.2) : 4), '#7a4a3a'); VL(cx, top - ch, ch - 6, '#9a6a54'); VL(cx + 4, top - ch, ch - 6, '#5a3428');
      R(cx - 1, top - ch - 1, 7, 2, '#5a3428'); HL(cx - 1, top - ch - 2, 7, snow);
    }
    // windows: two storeys if tall enough
    const storeys = o.storeys || (h > 30 ? 2 : 1);
    const cols = Math.max(1, Math.floor((w - 6) / 12));
    for (let s = 0; s < storeys; s++) {
      for (let c = 0; c < cols; c++) {
        if (s === 0 && o.door !== false && c === (cols >> 1) && cols > 1) continue;
        const ww = 7, wh = 8;
        const wx = Math.round(x + 4 + c * ((w - 8 - ww) / Math.max(1, cols - 1 || 1)) + (cols === 1 ? (w - 8 - ww) / 2 : 0));
        const wy = Math.round(top + 4 + s * (h / storeys));
        const on = lit > 0.35 && r.chance(0.7);
        if (on && lit > 0.55) CH.emitStatic(Math.round(x + 4 + c * ((w - 8 - 7) / Math.max(1, cols - 1 || 1)) + (cols === 1 ? (w - 8 - 7) / 2 : 0)) + 3, Math.round(top + 4 + s * (h / storeys)) + 4, 2, '#ffc070', 0.7 * (lit - 0.45));
        R(wx - 1, wy - 1, ww + 2, wh + 2, tm.m);
        R(wx, wy, ww, wh, on ? mix('#3a4a66', '#ffd98a', lit) : mix('#2e3c52', p ? p.sky[2] : '#8fb4d8', 0.25));
        if (on) { R(wx, wy, 2, wh, mix('#c86a3a', '#ffd98a', 0.4)); R(wx + ww - 2, wy, 2, wh, mix('#c86a3a', '#ffd98a', 0.4)); }
        else P1(wx + 1, wy + 1, mix('#ffffff', p ? p.sky[3] : '#fff', 0.5));
        VL(wx + (ww >> 1), wy, wh, tm.m); HL(wx, wy + (wh >> 1), ww, tm.m);
        HL(wx - 1, wy + wh + 1, ww + 2, snow);
      }
    }
    // front door with a little snowy hood
    if (o.door !== false && cols > 1) {
      const dx = Math.round(x + w / 2 - 3), dh = Math.min(11, Math.round(h / storeys) - 2);
      R(dx - 1, yb - dh - 1, 8, dh + 1, tm.m);
      R(dx, yb - dh, 6, dh, o.doorColor || sh(body, -40)); VL(dx + 1, yb - dh, dh, sh(o.doorColor || sh(body, -40), 16));
      P1(dx + 4, yb - (dh >> 1), '#f5c33b');
      R(dx - 2, yb - dh - 3, 10, 2, roof.dd); HL(dx - 2, yb - dh - 4, 10, snow);
      if (lit > 0.35) withA(0.35, () => E(dx + 3, yb - dh - 1, 3, 1, '#ffd98a'));
    }
    // snow drifted against the wall
    E(x + w * 0.3, yb, w * 0.35, 2, snow); E(x + w * 0.8, yb, w * 0.25, 2, snowS);
  };

  // ============================================================================
  // VIEWS THROUGH GLASS
  // ============================================================================
  const viewCache = new Map();
  const palFor = (o) => {
    const h = o.night ? 23 : (o.hour !== undefined ? o.hour : (CH.state.hour || 9));
    if (CH.skyAt) return CH.skyAt(h);
    return { sky: ['#7ba4cf', '#a4c3e2', '#cadcee', '#e6eef6'], star: 0, win: 0.2, far: '#3f5c58', mid: '#38544c', near: '#2b4640', snow: '#e9f0f8', snowHi: '#ffffff', snowSh: '#c2d2e6', road: '#3a3d49', ice: '#a6cde4', mtn: '#7e8cb2', mtnS: '#f2f7fb', lamp: 0.1, night: false };
  };
  // a jagged mountain ridge: noise, not a triangle
  const ridge = (w, y0, amp, seed, c, cs) => {
    const r = rng(seed);
    let hgt = amp * 0.5, v = 0;
    for (let x = 0; x < w; x++) {
      v += (r.next() - 0.5) * 1.6; v *= 0.86; hgt = CH.clamp(hgt + v, 2, amp);
      const top = Math.round(y0 - hgt);
      VL(x, top, y0 - top + 1, c);
      if (hgt > amp * 0.55) { P1(x, top, cs); if (r.chance(0.6)) P1(x, top + 1, cs); }
    }
  };
  function paintStreet(w, h, p, seed, o) {
    const r = rng(seed);
    gfx.vgrad(0, 0, w, h, p.sky);
    if (p.star > 0.3) {
      for (let i = 0; i < (w * h) / 70; i++) P1(r.int(0, w - 1), r.int(0, Math.floor(h * 0.45)), r.chance(0.3) ? '#9fdcff' : '#ffffff');
      E(Math.round(w * 0.8), Math.round(h * 0.14), 3, 3, '#f4f0dc'); E(Math.round(w * 0.8) + 1, Math.round(h * 0.14) - 1, 2, 2, p.sky[0]);
    } else {
      withA(0.7, () => { E(Math.round(w * 0.25), Math.round(h * 0.16), 7, 2, '#ffffff'); E(Math.round(w * 0.3), Math.round(h * 0.14), 4, 2, '#ffffff'); E(Math.round(w * 0.7), Math.round(h * 0.24), 5, 1.5, '#ffffff'); });
    }
    const hz = Math.round(h * 0.5);
    ridge(w, hz - 2, Math.round(h * 0.16), seed + 3, mix(p.mtn, p.sky[3], 0.45), mix(p.mtnS, p.sky[3], 0.3));
    R(0, hz, w, h - hz, p.far);
    for (let x = -4; x < w + 6; x += 5 + r.int(0, 4)) PX.draw('farPine', x, hz + 3 + r.int(0, 2), { remap: { a: p.far, b: mix(p.far, p.snowHi, 0.22) }, flip: r.chance(0.5) });
    // houses across the street, with pines between them
    const ground = Math.round(h * 0.84);
    R(0, ground - 6, w, h - ground + 6, p.mid);
    const houseCols = ['#8a4a3a', '#4a6a8a', '#6a7a5a', '#8a7a5a', '#6a5a7a', '#9a6a3a', '#5a7a7a'];
    let x = -r.int(2, 12);
    while (x < w) {
      if (r.chance(0.34)) {
        PX.pine(x + 8, ground + 1, r.int(26, 40), { c: r.pick(['#2f6a24', '#3a7a2c', '#25551c']), seed: r.int(1, 900), snow: p.snowHi, snowShade: p.snowSh, flip: r.chance(0.5) });
        x += 16 + r.int(0, 6);
        continue;
      }
      const bw = r.int(26, 36), bh = r.int(16, 24);
      K.house(x, ground, bw, bh, { color: mix(r.pick(houseCols), p.sky[2], 0.12), roof: r.pick(['#4a3a44', '#3a3a4a', '#5a3a2a']), gable: r.chance(0.6), seed: r.int(1, 9999), storeys: 1, door: r.chance(0.7) }, p);
      x += bw + r.int(5, 12);
    }
    // street lamp on the near kerb
    if (o.lamp !== false) {
      const lx = Math.round(w * (0.2 + r.next() * 0.6));
      R(lx, ground - 26, 2, 30, '#2a2830'); VL(lx, ground - 26, 30, '#4a4852');
      R(lx - 3, ground - 29, 8, 3, '#2a2830'); HL(lx - 2, ground - 26, 6, p.lamp > 0.3 ? '#ffe8a0' : '#d8dce4');
      if (p.lamp > 0.3) withA(0.3 * p.lamp, () => E(lx + 1, ground - 20, 9, 7, '#ffd98a'));
      HL(lx - 3, ground - 30, 8, p.snowHi);
    }
    // snowbank, road with tyre tracks, the near sidewalk
    R(0, ground, w, h - ground, p.snow);
    for (let i = 0; i < w; i += 6) E(i + 3, ground, 4, 1.5, p.snowHi);
    const ry = ground + 3;
    R(0, ry, w, Math.max(3, h - ry - 2), p.road);
    for (let i = 0; i < w; i += 8) { HL(i, ry + 1, 4, sh(p.road, 12)); }
    for (let i = 0; i < w; i += 14) HL(i, ry + Math.max(1, (h - ry) >> 1), 7, '#e8b83a');
    R(0, h - 2, w, 2, mix('#b7bbc5', p.snow, 0.5));
  }
  function paintForest(w, h, p, seed, o) {
    const r = rng(seed);
    gfx.vgrad(0, 0, w, h, p.sky);
    if (p.star > 0.3) {
      for (let i = 0; i < (w * h) / 60; i++) P1(r.int(0, w - 1), r.int(0, Math.floor(h * 0.5)), r.chance(0.3) ? '#9fdcff' : '#ffffff');
      E(Math.round(w * 0.78), Math.round(h * 0.18), 3, 3, '#f4f0dc'); E(Math.round(w * 0.78) - 1, Math.round(h * 0.18) - 1, 2.4, 2.4, p.sky[0]);
    } else {
      withA(0.6, () => { E(Math.round(w * 0.3), Math.round(h * 0.2), 8, 2, '#ffffff'); E(Math.round(w * 0.36), Math.round(h * 0.17), 4, 2, '#ffffff'); });
    }
    const hz = Math.round(h * 0.58);
    ridge(w, hz, Math.round(h * 0.22), seed + 5, mix(p.mtn, p.sky[3], 0.35), mix(p.mtnS, p.sky[3], 0.2));
    ridge(w, hz + 3, Math.round(h * 0.12), seed + 6, mix(p.far, p.sky[3], 0.25), mix(p.snowHi, p.sky[3], 0.4));
    R(0, hz + 3, w, h, p.far);
    for (let x = -4; x < w + 6; x += 4 + r.int(0, 3)) PX.draw('farPine', x, hz + 6 + r.int(0, 2), { remap: { a: p.far, b: mix(p.far, p.snowHi, 0.25) }, flip: r.chance(0.5) });
    const ground = Math.round(h * 0.86);
    if (o.lake) {
      R(0, ground - 5, w, 6, p.ice); HL(0, ground - 5, w, sh(p.ice, 18));
      for (let i = 0; i < 5; i++) HL(r.int(0, w - 8), ground - 4 + r.int(0, 3), r.int(4, 10), sh(p.ice, 30));
    }
    for (let x = -6; x < w + 8; x += 4 + r.int(0, 4)) PX.draw('midPine', x, ground - 2 + r.int(0, 2), { remap: { a: p.mid, b: mix(p.mid, p.snowHi, 0.32) }, flip: r.chance(0.5) });
    // the near trees: the real hand-drawn pines, framing the view from the sides
    const n = Math.max(1, Math.round(w / 34));
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : 0;
      const tx = Math.round(side ? w - 4 - r.int(0, 6) - (i >> 1) * 14 : 4 + r.int(0, 6) + (i >> 1) * 14);
      PX.pine(tx, h + 1, Math.max(24, Math.round(h * (0.55 + r.next() * 0.25))), { c: r.pick(['#2f6a24', '#3a7a2c', '#25551c', '#356e28']), seed: r.int(1, 900), snow: p.snowHi, snowShade: p.snowSh, flip: r.chance(0.5) });
    }
    R(0, h - 3, w, 3, p.snow); for (let i = 0; i < w; i += 5) E(i + 2, h - 3, 3, 1.4, p.snowHi);
  }
  // Paint (and cache) the still part of a view; returns a canvas w x h.
  K.viewCanvas = (kind, w, h, o = {}) => {
    const p = palFor(o), hb = o.night ? 'n' : Math.round((o.hour !== undefined ? o.hour : (CH.state.hour || 9)) * 2);
    const key = kind + '|' + w + 'x' + h + '|' + (o.seed || 1) + '|' + hb + '|' + (o.lake ? 1 : 0);
    let c = viewCache.get(key);
    if (!c) {
      if (viewCache.size > 60) viewCache.clear();
      c = gfx.makeCanvas(w, h);
      const g = c.getContext('2d');
      const sink = CH.emitSink; CH.emitSink = null;
      gfx.pushTarget(g);
      (kind === 'forest' ? paintForest : paintStreet)(w, h, p, o.seed || 1, o);
      gfx.popTarget();
      CH.emitSink = sink;
      viewCache.set(key, c);
    }
    return c;
  };
  // the moving part: snow in two depths, and on the street the odd car going by
  K.viewLive = (kind, x, y, w, h, t, o = {}) => {
    const p = palFor(o), seed = o.seed || 1;
    gfx.clip(x, y, w, h);
    if (kind === 'street' && o.cars !== false) {
      const period = 9 + (seed % 5), k = ((t + seed * 1.7) % period) / period;
      if (k < 0.55) {
        const dir = seed % 2 ? 1 : -1, u = k / 0.55;
        const cx = Math.round(dir > 0 ? x - 22 + u * (w + 44) : x + w + 22 - u * (w + 44)), cy = y + Math.round(h * 0.84) + 4;
        const col = ['#c8352b', '#3b6fd6', '#e8e2d2', '#4a8a5a', '#c8a060'][seed % 5];
        const m = K.ramp(col);
        R(cx - 9, cy - 5, 19, 4, m.m); HL(cx - 9, cy - 5, 19, m.l); R(cx - 5, cy - 8, 11, 3, m.m); R(cx - 4, cy - 7, 9, 2, mix(p.sky[2], '#1a2030', 0.4));
        R(cx - 7, cy - 1, 3, 2, '#141018'); R(cx + 4, cy - 1, 3, 2, '#141018'); HL(cx - 9, cy - 2, 19, m.dd);
        if (p.lamp > 0.3) { P1(dir > 0 ? cx + 10 : cx - 10, cy - 4, '#fff4c0'); withA(0.25, () => E(dir > 0 ? cx + 16 : cx - 16, cy - 3, 6, 2, '#fff4c0')); }
      }
    }
    for (let i = 0; i < Math.round((w * h) / 110); i++) {
      const far = i % 3 !== 0, sp = far ? 9 : 17;
      const fx = x + ((i * 37 + seed * 11 + Math.round(Math.sin(t * 0.8 + i) * (far ? 2 : 4))) % w + w) % w;
      const fy = y + ((i * 23 + t * sp) % (h + 4)) - 2;
      if (far) P1(fx, fy, 'rgba(255,255,255,0.65)'); else { R(fx, fy, 2, 2, '#ffffff'); }
    }
    gfx.unclip();
  };
  // the whole view: cached still + live snow
  K.view = (kind, g, x, y, w, h, t, o = {}) => {
    g.drawImage(K.viewCanvas(kind, w, h, o), Math.round(x), Math.round(y));
    if (t !== undefined && o.live !== false) K.viewLive(kind, Math.round(x), Math.round(y), w, h, t, o);
  };
  CH.drawStreetView = (g, x, y, w, h, t, o = {}) => K.view('street', g, x, y, w, h, t, o);

  // A window frame drawn over a view: frame, mullions, sill, frost, sheen.
  K.windowFrame = (x, y, w, h, o = {}) => {
    const m = K.ramp(o.frame || '#e8e2d6'), t = o.thick || 3;
    const cols = o.cols || 2, rows = o.rows || 2;
    // frost creeping in from the corners
    withA(0.55, () => {
      for (const [fx, fy, sx, sy] of [[x + t, y + t, 1, 1], [x + w - t - 1, y + t, -1, 1], [x + t, y + h - t - 1, 1, -1], [x + w - t - 1, y + h - t - 1, -1, -1]]) {
        for (let i = 0; i < 6; i++) for (let j = 0; j < 6 - i; j++) if ((i * 7 + j * 3) % 4 !== 1) P1(fx + sx * i, fy + sy * j, '#ffffff');
      }
    });
    // sheen across the glass
    withA(0.1, () => { for (let i = 0; i < Math.min(w, h) * 0.8; i++) { P1(x + t + 4 + i * 0.6, y + h - t - 3 - i, '#ffffff'); P1(x + t + 5 + i * 0.6, y + h - t - 3 - i, '#ffffff'); } });
    // mullions
    for (let c = 1; c < cols; c++) { const mx = Math.round(x + (w * c) / cols) - 1; R(mx, y, 2, h, m.m); VL(mx, y, h, m.l); VL(mx + 1, y, h, m.d); }
    for (let r = 1; r < rows; r++) { const my = Math.round(y + (h * r) / rows) - 1; R(x, my, w, 2, m.m); HL(x, my, w, m.l); HL(x, my + 1, w, m.d); }
    // frame
    R(x, y, w, t, m.m); HL(x, y, w, m.h); HL(x, y + t - 1, w, m.d);
    R(x, y + h - t, w, t, m.m); HL(x, y + h - t, w, m.l); HL(x, y + h - 1, w, m.dd);
    R(x, y, t, h, m.m); VL(x, y, h, m.h); VL(x + t - 1, y, h, m.d);
    R(x + w - t, y, t, h, m.m); VL(x + w - t, y, h, m.l); VL(x + w - 1, y, h, m.dd);
    K.band(x + t, y + t, w - t * 2, 2, '#0a1020', 0.25);
    // sill
    if (o.sill !== false) {
      const sm = K.ramp(o.sillC || o.frame || '#e8e2d6');
      R(x - 3, y + h, w + 6, 3, sm.m); HL(x - 3, y + h, w + 6, sm.h); HL(x - 3, y + h + 2, w + 6, sm.dd);
      K.band(x - 2, y + h + 3, w + 4, 3, '#140c10', 0.22);
    }
  };
})(window.CH);
