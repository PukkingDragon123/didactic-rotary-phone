// ============================================================================
// Props: procedural pixel furniture & objects. Each: {w,h,draw(g,x,y,t,st)}
// (x, y) = bottom-left corner of prop's footprint.
//
// House style (see 08_art.js / 10_chubby.js): every FREE-STANDING object is
// assembled in a scratch buffer and blitted with one dilated ink outline, sits
// on a soft cast shadow, and is shaded with a lit top/front face plus a shade
// side. Walls, floors and other large background surfaces are NEVER outlined -
// they get material texture instead.
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, art = CH.art, P = CH.PAL;
  const PR = (CH.PROPS = {});
  const def = (name, w, h, draw, extra = {}) => { PR[name] = Object.assign({ name, w, h, draw }, extra); };
  const rect = gfx.rect, px = gfx.px, hl = gfx.hline, vl = gfx.vline, ell = gfx.ellipse, fr = gfx.frame, ln = gfx.line;
  const tri = gfx.tri, rr = gfx.rrect, txt = gfx.text, mix = gfx.mix, shade = gfx.shade;
  const INK = art.INK;

  // ---- materials -------------------------------------------------------------
  const mat = (b, o) => art.mat(b, o);
  const M = {
    pine: mat('#c9924f', { dark: -38, darker: -66, light: 22 }),
    oak: mat('#a46c39', { dark: -34, darker: -60, light: 30 }),
    walnut: mat('#74492a', { dark: -26, darker: -46, light: 34 }),
    ebony: mat('#3f2d21', { dark: -16, darker: -26, light: 30 }),
    birch: mat('#ddc08a', { dark: -40, darker: -68, light: 18 }),
    cream: mat('#efe1c0', { dark: -34, darker: -58, light: 14 }),
    linen: mat('#e9e2d2', { dark: -32, darker: -56, light: 12 }),
    quilt: mat('#4f6bbf', { dark: -30, darker: -52, light: 34 }),
    wool: mat('#b8443f', { dark: -30, darker: -52, light: 32 }),
    moss: mat('#5c9a42', { dark: -28, darker: -48, light: 34 }),
    stone: mat('#7d7b88', { dark: -26, darker: -44, light: 26 }),
    steel: mat('#8e96a4', { dark: -28, darker: -48, light: 30 }),
    chrome: mat('#bcc4d2', { dark: -42, darker: -72, light: 22 }),
    enamel: mat('#dde3e9', { dark: -30, darker: -56, light: 12 }),
    plastic: mat('#2e2e3b', { dark: -12, darker: -20, light: 28 }),
    brass: mat('#c8922f', { dark: -34, darker: -58, light: 30 }),
    leather: mat('#8b5a39', { dark: -30, darker: -52, light: 30 }),
    teal: mat('#2f8f7a', { dark: -28, darker: -48, light: 32 }),
    clinical: mat('#d3dae2', { dark: -26, darker: -48, light: 14 }),
    scrub: mat('#4a7ab0', { dark: -28, darker: -50, light: 30 }),
    card: mat('#d9b97e', { dark: -32, darker: -56, light: 20 }),
  };
  CH.PROP_MAT = M;

  // ---- shared drawing helpers -------------------------------------------------
  // Free-standing object: wrap drawFn in ONE ink outline. drawFn(bx, by, ctx)
  // gets the footprint's bottom-left corner in buffer space.
  const ink = (g, x, y, w, h, fn, o = {}) => {
    const l = o.l === undefined ? 6 : o.l, r = o.r === undefined ? 6 : o.r;
    const tp = o.t === undefined ? 8 : o.t, b = o.b === undefined ? 5 : o.b;
    art.blit(x, y, w + l + r, h + tp + b, l, h + tp,
      (ctx) => fn(l, h + tp, ctx),
      { ctx: g, outline: o.outline, alpha: o.alpha });
  };

  // Soft contact shadow for something standing on the floor.
  const floorShadow = (g, x, w, y, a = 0.3) => {
    g.save();
    g.globalAlpha = a * 0.45;
    ell(x + w / 2, y + 1, w / 2 + 5, 4, '#160f1a');
    g.globalAlpha = a;
    ell(x + w / 2, y + 1, w / 2 + 1, 2.2, '#160f1a');
    g.restore();
  };
  // Drop shadow for something hanging on a wall. (x,y) = top-left.
  const wallShadow = (g, x, y, w, h, a = 0.2, d = 2) => {
    g.save(); g.globalAlpha = a;
    rect(x + d, y + d, w, h, '#160f1a');
    g.restore();
  };

  // A shaded slab: lit top edge, lit left rim, shaded right + bottom.
  const box = (x, y, w, h, m, o = {}) => {
    rect(x, y, w, h, m.base);
    if (o.top !== false) hl(x, y, w, o.topC || m.l);
    if (o.left !== false) vl(x, y, h, mix(m.base, m.l, 0.55));
    if (o.right !== false) vl(x + w - 1, y, h, m.d);
    if (o.bottom !== false) hl(x, y + h - 1, w, m.dd);
  };
  // A horizontal surface seen edge-on: the lit top band plus a dark under-lip.
  const surf = (x, y, w, th, m) => {
    rect(x, y, w, th, m.base);
    hl(x, y, w, m.l);
    if (th > 1) hl(x, y + th - 1, w, m.dd);
  };
  // Random wood grain streaks + occasional knot.
  const grain = (x, y, w, h, seed, m, density = 1) => {
    const R = new CH.Rng(seed >>> 0 || 1);
    const n = Math.max(1, Math.round((w * h) / 70 * density));
    for (let i = 0; i < n; i++) {
      const gx = x + R.int(0, w - 2), gy = y + R.int(0, h - 1);
      hl(gx, gy, Math.min(R.int(3, 11), x + w - gx), R.chance(0.45) ? m.l : m.d);
    }
    if (h > 5 && R.chance(0.7)) {
      const kx = x + R.int(3, w - 4), ky = y + R.int(2, h - 3);
      ell(kx, ky, 2, 1.3, m.dd); ell(kx, ky, 1, 0.6, m.d); px(kx, ky - 1, m.l);
    }
  };
  // Soft ambient-occlusion band under an overhang.
  const ao = (x, y, w, h, c = '#160f1a', a = 0.22) => {
    const g = gfx.cur; g.save(); g.globalAlpha = a; rect(x, y, w, h, c); g.restore();
  };
  const dith = (x, y, w, h, c, a, phase = 0) => {
    const g = gfx.cur; g.save(); g.globalAlpha = a; gfx.dither(x, y, w, h, c, g, phase); g.restore();
  };
  const screw = (x, y, m) => { px(x, y, m.dd); px(x, y - 1, m.l); };
  // small ceramic mug seen from the side
  const mug = (x, y, c, o = {}) => {
    const m = mat(c);
    rect(x, y - 5, 5, 5, m.base); hl(x, y - 5, 5, m.l); vl(x + 4, y - 5, 5, m.d);
    px(x + 5, y - 4, m.base); px(x + 5, y - 3, m.d);
    if (o.full !== false) hl(x + 1, y - 4, 3, o.drink || '#4a2a16');
  };

  // wood texture helper: planks with knots, seams and worn highlights
  CH.drawPlanks = (g, x, y, w, h, plankH, base, dark, light, seed = 1, vertical = false) => {
    const R = new CH.Rng(seed >>> 0 || 1);
    rect(x, y, w, h, base);
    const mid = mix(base, dark, 0.4), warm = mix(base, light, 0.5);
    if (!vertical) {
      for (let py = y; py < y + h; py += plankH) {
        const ph = Math.min(plankH, y + h - py);
        // plank body: slightly lit at the top, sinking to shadow at the seam
        hl(x, py, w, warm);
        if (ph > 2) hl(x, py + ph - 2, w, mid);
        if (ph > 1) hl(x, py + ph - 1, w, dark);
        // plank end seams
        let sx = x + R.int(0, 60);
        while (sx < x + w) {
          vl(sx, py, ph, dark); vl(sx + 1, py, ph, warm);
          sx += R.int(48, 120);
        }
        // grain
        for (let i = 0; i < w / 22; i++) {
          const gx = x + R.int(0, w - 2), gy = py + R.int(1, Math.max(1, ph - 2));
          hl(gx, gy, Math.min(R.int(4, 16), x + w - gx), R.chance(0.5) ? warm : mid);
        }
        // knots
        if (R.chance(0.55) && ph > 4) {
          const kx = x + R.int(4, w - 5), ky = py + R.int(2, Math.max(2, ph - 3));
          ell(kx, ky, 2.4, 1.3, dark); ell(kx, ky, 1.2, 0.6, mid); px(kx, ky - 1, warm);
        }
        // nail heads
        if (R.chance(0.5)) { const nx = x + R.int(6, w - 6); px(nx, py + 2, dark); px(nx, py + 1, warm); }
      }
    } else {
      for (let pxx = x; pxx < x + w; pxx += plankH) {
        const pw = Math.min(plankH, x + w - pxx);
        vl(pxx, y, h, dark); if (pw > 1) vl(pxx + 1, y, h, warm);
        if (pw > 2) vl(pxx + pw - 1, y, h, mid);
        for (let i = 0; i < h / 20; i++) {
          const gy = y + R.int(0, h - 2), gx = pxx + R.int(1, Math.max(1, pw - 2));
          vl(gx, gy, Math.min(R.int(4, 16), y + h - gy), R.chance(0.5) ? warm : mid);
        }
        if (R.chance(0.5) && pw > 3) {
          const kx = pxx + R.int(1, pw - 2), ky = y + R.int(4, h - 4);
          ell(kx, ky, 1.6, 2.2, dark); ell(kx, ky, 0.8, 1, mid);
        }
      }
    }
  };

  // ---------------------------------------------------------------- CABIN ----
  def('bed', 100, 36, (g, x, y, t, st) => {
    const made = !!(st && st.made);
    floorShadow(g, x + 2, 96, y, 0.34);
    ink(g, x, y, 100, 36, (bx, by) => {
      const W = M.walnut, L = M.linen, Q = M.quilt;
      // legs
      for (const lx of [1, 92]) { rect(bx + lx, by - 9, 7, 9, W.d); vl(bx + lx, by - 9, 9, W.base); hl(bx + lx, by - 1, 7, W.dd); }
      // headboard (left) - planks with a rounded cap
      rect(bx, by - 34, 8, 27, W.base); grain(bx + 1, by - 33, 6, 25, 11, W, 0.7);
      hl(bx, by - 34, 8, W.l); vl(bx, by - 34, 27, mix(W.base, W.l, 0.6)); vl(bx + 7, by - 33, 26, W.dd);
      rect(bx + 1, by - 36, 6, 2, W.base); hl(bx + 1, by - 36, 6, W.l);
      // footboard (right)
      rect(bx + 91, by - 24, 8, 17, W.base); grain(bx + 92, by - 23, 6, 15, 13, W, 0.7);
      hl(bx + 91, by - 24, 8, W.l); vl(bx + 91, by - 24, 17, mix(W.base, W.l, 0.6)); vl(bx + 98, by - 23, 16, W.dd);
      // side rail
      rect(bx + 6, by - 15, 88, 6, W.d); hl(bx + 6, by - 15, 88, W.base); hl(bx + 6, by - 10, 88, W.dd);
      grain(bx + 8, by - 14, 84, 4, 17, W, 0.5);
      // mattress
      rect(bx + 6, by - 22, 88, 8, L.base); hl(bx + 6, by - 22, 88, L.l); hl(bx + 6, by - 15, 88, L.dd);
      for (let i = 0; i < 8; i++) px(bx + 12 + i * 11, by - 18, L.d);
      ao(bx + 6, by - 16, 88, 2, '#160f1a', 0.16);
      // quilt over the lower two thirds
      const qx = made ? bx + 20 : bx + 26, qw = bx + 94 - qx;
      rect(qx, by - 25, qw, 12, Q.base);
      hl(qx, by - 25, qw, Q.l);
      for (let i = 0; i < 7; i++) {
        const fx = qx + 3 + i * 9;
        if (fx > bx + 90) break;
        vl(fx, by - 24, 10, made ? Q.d : Q.dd);
        px(fx + 1, by - 24 + (i % 2), Q.l);
      }
      hl(qx, by - 14, qw, Q.dd); hl(qx, by - 13, qw, shade(Q.dd, -10));
      // rounded top plane of the duvet
      hl(qx + 1, by - 25, qw - 2, mix(Q.base, Q.l, 0.7));
      hl(qx + 2, by - 24, qw - 4, mix(Q.base, Q.l, 0.35));
      // stitched hem along the bottom edge
      for (let i = 1; i < qw - 1; i += 3) px(qx + i, by - 15, mix(Q.l, '#fff', 0.4));
      if (!made) {
        // kicked-up corner + a rumpled ridge
        rect(bx + 32, by - 29, 16, 5, Q.base); hl(bx + 32, by - 29, 16, Q.l); hl(bx + 32, by - 25, 16, Q.d);
        tri(bx + 48, by - 29, bx + 48, by - 24, bx + 54, by - 24, Q.d);
        ell(bx + 62, by - 26, 7, 2, Q.l);
      }
      // pillow
      rect(bx + 10, by - 30, 20, 8, L.base); hl(bx + 10, by - 30, 20, L.l);
      rr(bx + 10, by - 30, 20, 8, 2, L.base); hl(bx + 11, by - 30, 18, L.l);
      hl(bx + 11, by - 23, 18, L.d); ell(bx + 20, by - 27, 4, 1.4, L.d);
      vl(bx + 29, by - 29, 7, L.dd);
      // under the bed: a book, a stray sock, dust
      rect(bx + 40, by - 4, 13, 4, '#7a3f34'); hl(bx + 40, by - 4, 13, '#9a5a48'); hl(bx + 41, by - 2, 11, '#d8cfb8');
      rect(bx + 58, by - 3, 9, 3, '#cfd6e0'); px(bx + 58, by - 4, '#cfd6e0'); hl(bx + 59, by - 3, 6, '#9fa8b8');
      ell(bx + 76, by - 2, 4, 1.4, '#6b6070');
      ao(bx + 8, by - 8, 84, 8, '#160f1a', 0.26);
    }, { l: 5, r: 5, t: 6, b: 4 });
  });

  def('nightstand', 22, 16, (g, x, y, t, st) => {
    floorShadow(g, x, 22, y, 0.3);
    ink(g, x, y, 22, 16, (bx, by) => {
      const W = M.oak;
      rect(bx + 1, by - 13, 20, 13, W.base); grain(bx + 2, by - 12, 18, 11, 23, W, 0.6);
      vl(bx + 1, by - 13, 13, mix(W.base, W.l, 0.6)); vl(bx + 20, by - 13, 13, W.dd);
      surf(bx, by - 16, 22, 3, M.pine);
      // two drawers with brass pulls
      for (let i = 0; i < 2; i++) {
        const dy = by - 12 + i * 6;
        rect(bx + 3, dy, 16, 5, W.d); hl(bx + 3, dy, 16, mix(W.base, W.l, 0.4)); hl(bx + 3, dy + 4, 16, W.dd);
        rect(bx + 9, dy + 2, 4, 1, M.brass.base); px(bx + 9, dy + 3, M.brass.dd); px(bx + 12, dy + 1, M.brass.l);
      }
      // legs
      rect(bx + 1, by - 3, 3, 3, W.dd); rect(bx + 18, by - 3, 3, 3, W.dd);
      ao(bx + 2, by - 4, 18, 4, '#160f1a', 0.22);
      // ring stain + a glass of water
      ell(bx + 6, by - 16, 3, 1, mix(M.pine.base, '#6a4a28', 0.5));
      rect(bx + 15, by - 21, 4, 5, 'rgba(190,225,245,0.85)'); hl(bx + 15, by - 21, 4, '#eaf6ff'); hl(bx + 15, by - 19, 4, '#9fd0e8');
    }, { t: 8 });
  });

  def('alarmClock', 12, 10, (g, x, y, t, st) => {
    const ring = st && st.ringing;
    const sh = ring ? Math.round(Math.sin(t * 60) * 1.5) : 0;
    ink(g, x + sh, y, 12, 10, (bx, by) => {
      const R = mat('#c8352b');
      // bells
      for (const bxx of [0, 8]) { ell(bx + bxx + 2, by - 9, 2.5, 2.5, R.base); ell(bx + bxx + 2, by - 10, 1.6, 1.2, R.l); }
      rect(bx + 4, by - 9, 4, 2, M.chrome.d); px(bx + 5, by - 9, M.chrome.l);
      // body
      rr(bx, by - 8, 12, 8, 2, R.base); hl(bx + 1, by - 8, 10, R.l); hl(bx + 1, by - 1, 10, R.dd);
      rr(bx + 1, by - 7, 10, 6, 1, M.linen.base); hl(bx + 2, by - 7, 8, '#fff');
      // hands
      px(bx + 5, by - 4, '#221a2c'); px(bx + 5, by - 5, '#221a2c'); px(bx + 6, by - 4, '#221a2c'); px(bx + 7, by - 4, '#221a2c');
      px(bx + 2, by - 4, '#8a8496'); px(bx + 9, by - 4, '#8a8496');
      // feet
      px(bx + 2, by, R.dd); px(bx + 9, by, R.dd);
    }, { l: 5, r: 5, t: 5, b: 3 });
    if (ring) for (let i = 0; i < 3; i++) {
      const a = t * 20 + i;
      px(x - 3 + sh + Math.round(Math.cos(a) * 2), y - 11 + Math.round(Math.sin(a)), '#fff8ee');
      px(x + 14 + sh, y - 11 - i, '#fff8ee');
    }
  });

  def('poster', 36, 44, (g, x, y, t, st) => {
    const v = (st && st.variant) || 0;
    wallShadow(g, x, y - 44, 36, 44, 0.18);
    ink(g, x, y, 36, 44, (bx, by) => {
      const top = by - 44;
      if (v === 0) {
        rect(bx, top, 36, 44, '#f0bb33'); hl(bx, top, 36, '#ffe08a'); vl(bx, top, 44, '#ffd76a');
        hl(bx, top + 43, 36, '#c08c18'); vl(bx + 35, top, 44, '#c89a20');
        rect(bx + 3, top + 4, 30, 24, '#2f5fc0'); hl(bx + 3, top + 4, 30, '#5f8fe8');
        for (let i = 0; i < 14; i++) px(bx + 4 + ((i * 11) % 28), top + 5 + ((i * 7) % 22), '#4f7fd8');
        ell(bx + 16, top + 20, 9, 8, '#26499a'); ell(bx + 18, top + 18, 8, 7, '#3b6fd6');
        for (let i = 0; i < 5; i++) tri(bx + 13 - i, top + 17 - i, bx + 17 - i, top + 11 - i * 2, bx + 8 - i, top + 12 - i, '#26499a');
        ell(bx + 23, top + 19, 4, 3, '#f2c9a0');
        px(bx + 23, top + 16, '#fff'); px(bx + 24, top + 16, '#221a2c'); px(bx + 26, top + 21, '#c8352b');
        ell(bx + 18, top + 27, 3, 1.6, '#c8352b');
        txt('BLUE', bx + 18, top + 31, '#3a2408', { align: 'center', font: 'small' });
        txt('HEDGEHOG', bx + 18, top + 38, '#3a2408', { align: 'center', font: 'small' });
        tri(bx + 28, top, bx + 36, top, bx + 36, top + 8, '#a87a20');
        tri(bx + 29, top, bx + 36, top, bx + 36, top + 7, '#d8b860');
      } else if (v === 1) {
        rect(bx, top, 36, 44, '#151a30'); hl(bx, top, 36, '#2a3358');
        const R = new CH.Rng(9);
        for (let i = 0; i < 40; i++) px(bx + R.int(1, 34), top + R.int(1, 40), R.chance(0.3) ? '#9fdcff' : '#fff');
        ell(bx + 18, top + 20, 9, 9, '#c25a18'); ell(bx + 17, top + 19, 8, 8, '#e8752c');
        ell(bx + 14, top + 16, 4, 2.6, '#f5c33b'); ell(bx + 21, top + 24, 2.6, 1.8, '#9a3f10');
        ell(bx + 18, top + 20, 14, 3, 'rgba(240,200,120,0.4)');
        ell(bx + 18, top + 20, 12, 2, 'rgba(255,230,170,0.5)');
        txt('MAN EGG', bx + 18, top + 36, '#fff', { align: 'center', font: 'small' });
      } else {
        rect(bx, top, 36, 44, '#f4f1ea'); rect(bx + 2, top + 2, 32, 40, '#5aa83c'); hl(bx + 2, top + 2, 32, '#8bd06a');
        ell(bx + 18, top + 14, 10, 8, '#2f6a24'); ell(bx + 16, top + 12, 5, 3, '#8bd06a');
        txt('HANG', bx + 18, top + 24, '#fff', { align: 'center', font: 'small' });
        txt('IN', bx + 18, top + 31, '#fff', { align: 'center', font: 'small' });
        txt('THERE', bx + 18, top + 38, '#fff', { align: 'center', font: 'small' });
      }
      ao(bx, by - 4, 36, 4, '#160f1a', 0.14);
    }, { l: 4, r: 4, t: 4, b: 4 });
  });
  def('gameCases', 20, 18, (g, x, y) => {
    floorShadow(g, x, 20, y, 0.28);
    ink(g, x, y, 20, 18, (bx, by) => {
      const cols = ['#3b6fd6', '#c8352b', '#4f9d3a', '#f5c33b', '#7b4fb0', '#e8752c'];
      for (let i = 0; i < 6; i++) {
        const o = (i % 3) - 1, yy = by - 3 - i * 3;
        rect(bx + 1 + o, yy, 18, 3, cols[i]);
        hl(bx + 1 + o, yy, 18, shade(cols[i], 34));
        hl(bx + 1 + o, yy + 2, 18, shade(cols[i], -40));
        vl(bx + 2 + o, yy, 3, shade(cols[i], 50));
      }
      // one case open, disc showing
      rect(bx + 3, by - 18, 15, 3, '#2a2a34'); hl(bx + 3, by - 18, 15, '#50505f');
      ell(bx + 10, by - 17, 2.4, 1.2, '#b8c6d8'); px(bx + 10, by - 17, '#4a4a58');
    }, { l: 5, r: 5, t: 5 });
  });

  def('console', 26, 8, (g, x, y, t, st) => {
    ink(g, x, y, 26, 8, (bx, by) => {
      const C = M.plastic;
      rect(bx, by - 7, 26, 7, C.base); hl(bx, by - 7, 26, C.l); hl(bx, by - 1, 26, C.dd);
      vl(bx, by - 7, 7, mix(C.base, C.l, 0.5)); vl(bx + 25, by - 7, 7, C.dd);
      rect(bx + 2, by - 5, 9, 2, '#14141c'); hl(bx + 2, by - 5, 9, '#3a3a48');
      for (let i = 0; i < 5; i++) vl(bx + 15 + i * 2, by - 5, 3, '#1a1a24');
      px(bx + 22, by - 4, st && st.on ? (Math.sin(t * 4) > 0 ? '#6cf06c' : '#2a8a2a') : '#f24a4a');
      px(bx + 22, by - 5, st && st.on ? '#c8ffc8' : '#7a2020');
    }, { l: 10, r: 6, t: 4, b: 6 });
    // controller cable snaking off the shelf
    ln(x + 4, y - 1, x - 5, y + 5, '#1a1a22'); ln(x - 5, y + 5, x - 9, y + 3, '#1a1a22');
  });

  def('controller', 16, 8, (g, x, y) => {
    floorShadow(g, x, 16, y, 0.22);
    ink(g, x, y, 16, 8, (bx, by) => {
      const C = mat('#3d3d4d', { dark: -14, darker: -24, light: 26 });
      rr(bx, by - 6, 16, 6, 2, C.base); hl(bx + 1, by - 6, 14, C.l); hl(bx + 1, by - 1, 14, C.dd);
      rect(bx + 2, by - 7, 3, 1, C.base); rect(bx + 11, by - 7, 3, 1, C.base);
      px(bx + 3, by - 4, '#b8bcc8'); px(bx + 3, by - 3, '#8a8e9a');
      px(bx + 11, by - 5, '#f04a4a'); px(bx + 13, by - 4, '#5cf05c'); px(bx + 12, by - 3, '#5a9cf0');
      ln(bx + 8, by - 7, bx + 8, by - 9, '#1a1a22');
    }, { l: 4, r: 4, t: 5, b: 3 });
  });

  // TV. The screen rect (x+5, y-51, 48x27) is FIXED: 21_hedgehog.js zooms the
  // camera into exactly that rectangle, so the screen is painted in world space
  // after the outlined cabinet, never inside the sprite buffer.
  def('tv', 70, 64, (g, x, y, t, st) => {
    floorShadow(g, x + 1, 68, y, 0.34);
    ink(g, x, y, 70, 64, (bx, by) => {
      const W = M.walnut, C = M.plastic;
      // media stand
      rect(bx + 3, by - 14, 64, 14, W.base); grain(bx + 4, by - 13, 62, 12, 31, W, 0.5);
      surf(bx, by - 16, 70, 3, M.pine);
      vl(bx + 3, by - 14, 14, mix(W.base, W.l, 0.5)); vl(bx + 66, by - 14, 14, W.dd);
      rect(bx + 6, by - 12, 26, 10, W.dd); fr(bx + 6, by - 12, 26, 10, W.d);
      rect(bx + 38, by - 12, 26, 10, W.dd); fr(bx + 38, by - 12, 26, 10, W.d);
      for (let i = 0; i < 5; i++) hl(bx + 40, by - 10 + i * 2, 22, W.d);
      rect(bx + 4, by - 3, 4, 3, M.ebony.base); rect(bx + 62, by - 3, 4, 3, M.ebony.base);
      ao(bx + 4, by - 4, 62, 4, '#160f1a', 0.25);
      // CRT cabinet
      rect(bx, by - 62, 70, 48, C.base);
      hl(bx, by - 62, 70, C.l); hl(bx + 1, by - 61, 68, mix(C.base, C.l, 0.5));
      vl(bx, by - 62, 48, mix(C.base, C.l, 0.5)); vl(bx + 69, by - 62, 48, C.dd);
      hl(bx, by - 15, 70, C.dd);
      // bezel recess around the fixed screen rect
      rect(bx + 2, by - 54, 54, 33, C.d);
      fr(bx + 2, by - 54, 54, 33, C.dd);
      rect(bx + 5, by - 51, 48, 27, '#0a0a12');
      // speaker + controls column on the right
      rect(bx + 56, by - 52, 12, 29, C.d); fr(bx + 56, by - 52, 12, 29, C.dd);
      for (let i = 0; i < 9; i++) hl(bx + 58, by - 50 + i * 3, 8, i % 2 ? '#14141c' : C.base);
      rect(bx + 56, by - 21, 12, 5, C.d);
      ell(bx + 59, by - 19, 2, 2, M.chrome.d); px(bx + 59, by - 20, M.chrome.l);
      ell(bx + 65, by - 19, 2, 2, M.chrome.d); px(bx + 65, by - 20, M.chrome.l);
      px(bx + 4, by - 18, '#6cf06c'); px(bx + 4, by - 17, '#2a6a2a');
      txt('SEGO', bx + 29, by - 20, '#6a6a7a', { align: 'center', font: 'small' });
      // dust on top
      dith(bx + 5, by - 63, 58, 1, '#d8cfb8', 0.35);
    }, { l: 6, r: 6, t: 6, b: 4 });
    // ---- the screen, in world space, exactly where the zoom expects it ----
    const sx = x + 5, sy = y - 51, sw = 48, sh = 27;
    if (st && st.screen) st.screen(g, sx, sy, sw, sh, t);
    else { rect(sx, sy, sw, sh, '#151820'); dith(sx, sy, sw, sh, '#0a0a10', 0.4); }
    g.save(); g.globalAlpha = 0.1;
    tri(sx + 2, sy + 2, sx + 12, sy + 2, sx + 2, sy + 18, '#fff');
    g.restore();
    // cables behind the stand
    ln(x + 22, y - 14, x + 18, y - 5, '#1a1a22'); ln(x + 18, y - 5, x + 26, y - 1, '#1a1a22');
    ln(x + 44, y - 14, x + 50, y - 3, '#242430');
  });

  def('couch', 96, 44, (g, x, y, t, st) => {
    floorShadow(g, x + 2, 92, y, 0.34);
    ink(g, x, y, 96, 44, (bx, by) => {
      const C = M.leather, R = M.wool;
      const cush = mix(C.base, C.l, 0.55), cushL = C.l, cushD = C.d;
      // back slab (darkest - it is in shadow behind the cushions)
      rect(bx + 4, by - 44, 88, 27, C.dd);
      hl(bx + 4, by - 44, 88, C.d);
      // back cushions
      for (let i = 0; i < 3; i++) {
        const px0 = bx + 8 + i * 27;
        rr(px0, by - 42, 25, 20, 3, C.base);
        hl(px0 + 2, by - 42, 21, C.l);
        hl(px0 + 1, by - 41, 23, mix(C.base, C.l, 0.5));
        hl(px0 + 1, by - 24, 23, C.d);
        hl(px0 + 1, by - 23, 23, C.dd);
        vl(px0, by - 40, 17, mix(C.base, C.l, 0.4));
        vl(px0 + 24, by - 40, 17, C.d);
        px(px0 + 12, by - 33, C.d);
      }
      // shadow cast by the back onto the seat
      ao(bx + 8, by - 23, 80, 4, '#160f1a', 0.3);
      // seat cushions - the lightest plane, top around 22px off the floor
      for (let i = 0; i < 2; i++) {
        const cx0 = bx + 13 + i * 36, sag = i;
        rr(cx0, by - 22 + sag, 35, 13, 3, cush);
        hl(cx0 + 2, by - 22 + sag, 31, cushL);
        hl(cx0 + 1, by - 21 + sag, 33, mix(cush, cushL, 0.6));
        hl(cx0 + 1, by - 12 + sag, 33, cushD);
        hl(cx0 + 1, by - 11 + sag, 33, C.dd);
        vl(cx0, by - 20 + sag, 10, mix(cush, cushL, 0.5));
        vl(cx0 + 34, by - 20 + sag, 10, cushD);
        for (let k = 0; k < 4; k++) { px(cx0 + 7 + k * 8, by - 20 + sag, cushD); px(cx0 + 7 + k * 8, by - 19 + sag, C.d); }
      }
      // crease between the two cushions
      vl(bx + 48, by - 22, 12, C.dd);
      // arms (rolled, lighter on top)
      for (const ax of [0, 84]) {
        rr(bx + ax, by - 33, 12, 31, 3, C.d);
        rr(bx + ax + 1, by - 32, 10, 29, 3, C.base);
        hl(bx + ax + 2, by - 32, 8, C.l);
        hl(bx + ax + 3, by - 31, 6, C.rim);
        vl(bx + ax + 1, by - 30, 26, mix(C.base, C.l, 0.5));
        vl(bx + ax + 10, by - 30, 26, C.dd);
        hl(bx + ax + 2, by - 4, 8, C.dd);
      }
      // apron + feet
      rect(bx + 12, by - 10, 72, 7, C.dd); hl(bx + 12, by - 10, 72, C.d);
      rect(bx + 9, by - 6, 5, 6, M.ebony.base); hl(bx + 9, by - 6, 5, M.ebony.l);
      rect(bx + 82, by - 6, 5, 6, M.ebony.base); hl(bx + 82, by - 6, 5, M.ebony.l);
      ao(bx + 12, by - 5, 72, 5, '#160f1a', 0.3);
      // knitted blanket folded over the right arm
      rect(bx + 66, by - 35, 20, 17, R.base); hl(bx + 66, by - 35, 20, R.l);
      for (let i = 0; i < 6; i++) hl(bx + 66, by - 33 + i * 3, 20, i % 2 ? R.d : R.rim);
      rect(bx + 80, by - 19, 10, 13, R.base); hl(bx + 80, by - 19, 10, R.l); hl(bx + 80, by - 7, 10, R.dd);
      for (let i = 0; i < 4; i++) px(bx + 81 + i * 3, by - 6, R.d);
      // chip bag, crumbs, remote lost in the cushions
      rect(bx + 20, by - 28, 11, 7, '#f5c33b'); hl(bx + 20, by - 28, 11, '#ffe27a'); vl(bx + 30, by - 28, 7, '#c89a20');
      rect(bx + 22, by - 26, 6, 3, '#c8352b');
      tri(bx + 20, by - 21, bx + 31, by - 21, bx + 26, by - 18, '#d8a62a');
      px(bx + 35, by - 23, '#f0d080'); px(bx + 39, by - 22, '#c8a050'); px(bx + 45, by - 23, '#f0d080');
      rect(bx + 52, by - 25, 8, 3, '#22222c'); hl(bx + 52, by - 25, 8, '#3a3a48'); px(bx + 53, by - 24, '#f04a4a');
    }, { l: 5, r: 5, t: 6, b: 4 });
  });
  def('coffeeTable', 52, 20, (g, x, y) => {
    floorShadow(g, x, 52, y, 0.3);
    ink(g, x, y, 52, 20, (bx, by) => {
      const W = M.oak;
      surf(bx, by - 20, 52, 4, M.pine); grain(bx + 1, by - 19, 50, 2, 41, M.pine, 0.6);
      ao(bx + 1, by - 16, 50, 2, '#160f1a', 0.2);
      // legs + lower shelf
      rect(bx + 3, by - 16, 4, 16, W.base); vl(bx + 3, by - 16, 16, W.l); vl(bx + 6, by - 16, 16, W.dd);
      rect(bx + 45, by - 16, 4, 16, W.base); vl(bx + 45, by - 16, 16, W.l); vl(bx + 48, by - 16, 16, W.dd);
      rect(bx + 6, by - 7, 40, 2, W.d); hl(bx + 6, by - 7, 40, W.base);
      // magazines on the lower shelf
      rect(bx + 10, by - 10, 14, 3, '#c85a5a'); hl(bx + 10, by - 10, 14, '#e07878');
      rect(bx + 12, by - 12, 13, 2, '#5a7ac8'); hl(bx + 12, by - 12, 13, '#88a4e0');
      // pizza box, cans, mug, remote on top
      rect(bx + 24, by - 25, 20, 5, M.card.base); hl(bx + 24, by - 25, 20, M.card.l); hl(bx + 24, by - 21, 20, M.card.dd);
      px(bx + 30, by - 23, '#c8352b'); px(bx + 36, by - 23, '#a8291f');
      for (let i = 0; i < 2; i++) {
        const cx0 = bx + 12 + i * 6, c = i ? '#4f9d3a' : '#3b6fd6';
        rect(cx0, by - 28, 4, 8, c); vl(cx0, by - 28, 8, shade(c, 40)); vl(cx0 + 3, by - 28, 8, shade(c, -34));
        hl(cx0, by - 28, 4, '#b8bcc8'); px(cx0 + 2, by - 29, '#8a8e9a');
      }
      mug(bx + 3, by - 20, '#e8e2d2');
      rect(bx + 40, by - 27, 8, 2, '#22222c'); px(bx + 41, by - 27, '#f04a4a'); px(bx + 45, by - 26, '#5cf05c');
    }, { l: 5, r: 5, t: 10, b: 5 });
  });

  def('fireplace', 70, 86, (g, x, y, t, st) => {
    const lit = !st || st.lit !== false;
    ink(g, x, y, 70, 86, (bx, by) => {
      const S = M.stone, W = M.walnut;
      const R = new CH.Rng(7);
      // chimney breast: coursed stone
      rect(bx, by - 86, 70, 86, S.dd);
      for (let yy = by - 86; yy < by - 2; yy += 7) {
        const off = ((by - yy) / 7 & 1) ? 5 : 0;
        for (let xx = bx - off; xx < bx + 70; xx += 11) {
          const w = Math.min(10, bx + 70 - Math.max(bx, xx)), sx0 = Math.max(bx, xx);
          if (w < 2) continue;
          const c = R.pick([S.base, S.l, S.d, mix(S.base, S.l, 0.5), mix(S.base, S.d, 0.4)]);
          rect(sx0, yy, w, 6, c); hl(sx0, yy, w, shade(c, 16)); hl(sx0, yy + 5, w, shade(c, -22));
          if (R.chance(0.25)) px(sx0 + R.int(1, w - 1), yy + R.int(1, 4), shade(c, -30));
        }
      }
      // firebox opening
      rect(bx + 12, by - 50, 46, 46, '#1a1214');
      rect(bx + 14, by - 48, 42, 44, '#0c0809');
      // sooty arch
      for (let i = 0; i < 42; i++) px(bx + 14 + i, by - 48 + Math.round(Math.abs(i - 21) * 0.14), '#241a1c');
      dith(bx + 14, by - 48, 42, 10, '#3a2a26', 0.4);
      // back wall brick, faintly
      for (let yy = by - 40; yy < by - 6; yy += 6) for (let xx = bx + 16; xx < bx + 54; xx += 10) px(xx + ((yy / 6 & 1) ? 4 : 0), yy, '#241a1c');
      // logs
      ell(bx + 26, by - 10, 12, 3.5, '#4a2c1c'); ell(bx + 26, by - 11, 11, 2.4, '#5e3a24');
      ell(bx + 40, by - 12, 9, 3, '#432618'); ell(bx + 32, by - 15, 10, 3, '#583522');
      ell(bx + 22, by - 10, 2.2, 2, '#b98a4a'); ell(bx + 47, by - 12, 2, 1.8, '#b98a4a');
      if (lit) {
        const fh = 22 + Math.sin(t * 9) * 2.5, cx = bx + 35;
        // ember bed
        ell(cx, by - 8, 15, 3, '#7a2a10');
        for (let i = 0; i < 7; i++) px(cx - 12 + i * 4, by - 8 - (i % 2), R.chance(0.5) ? '#ff8030' : '#ffb050');
        for (let i = 0; i < 5; i++) {
          const fx = cx - 11 + i * 5.5 + Math.round(Math.sin(t * 7 + i * 2) * 1.5);
          const h = fh * (0.5 + 0.5 * Math.abs(Math.sin(t * 5 + i * 1.7)));
          tri(fx - 5, by - 10, fx + 5, by - 10, fx, by - 10 - h, '#d8481a');
          tri(fx - 4, by - 10, fx + 4, by - 10, fx, by - 10 - h * 0.85, '#e8752c');
          tri(fx - 2, by - 10, fx + 2, by - 10, fx, by - 10 - h * 0.55, '#f5c33b');
          tri(fx - 1, by - 10, fx + 1, by - 10, fx, by - 10 - h * 0.3, '#fff2b0');
        }
        for (let i = 0; i < 5; i++) {
          const k = (t * 0.7 + i * 0.2) % 1;
          px(cx - 9 + i * 5 + Math.round(Math.sin(t * 3 + i) * 2), by - 14 - k * 30, 'rgba(255,' + (150 + i * 18) + ',60,' + (1 - k).toFixed(2) + ')');
        }
        // firelight bouncing on the stone
        const gg = gfx.cur; gg.save(); gg.globalAlpha = 0.13 + Math.sin(t * 9) * 0.03;
        rect(bx + 12, by - 22, 46, 18, '#ffb060'); gg.restore();
      }
      // grate
      for (let i = 0; i < 7; i++) { vl(bx + 18 + i * 6, by - 17, 13, '#1a1a20'); px(bx + 18 + i * 6, by - 17, '#4a4a54'); }
      hl(bx + 17, by - 17, 38, '#2a2a32');
      // mantel - its top face MUST stay at y-46 (photo frames stand on it)
      rect(bx - 4, by - 50, 78, 4, W.d);
      surf(bx - 5, by - 53, 80, 3, M.pine); grain(bx - 4, by - 52, 78, 1, 51, M.pine, 0.5);
      hl(bx - 4, by - 50, 78, W.base);
      ao(bx - 3, by - 49, 76, 3, '#160f1a', 0.25);
      // hearth stone
      rect(bx - 6, by - 4, 82, 4, S.d); hl(bx - 6, by - 4, 82, S.l); hl(bx - 6, by - 1, 82, S.dd);
      for (let i = 0; i < 5; i++) vl(bx - 4 + i * 17, by - 4, 4, S.dd);
      dith(bx + 10, by - 4, 50, 2, '#2a2020', 0.5);
      // a poker and a brush leaning on the left
      ln(bx - 3, by - 4, bx + 1, by - 40, '#3a3a44'); px(bx + 1, by - 41, '#8a8a94');
      ln(bx + 2, by - 4, bx + 5, by - 36, '#3a3a44'); rect(bx + 4, by - 40, 3, 5, '#6a4a2a');
    }, { l: 8, r: 8, t: 6, b: 4 });
    // firelight pooling on the floor (never outlined)
    if (lit) {
      g.save(); g.globalAlpha = 0.14 + Math.sin(t * 9) * 0.04;
      ell(x + 35, y + 1, 52, 7, '#ffb060');
      g.globalAlpha = 0.08 + Math.sin(t * 9) * 0.02;
      ell(x + 35, y + 2, 74, 11, '#ff9040');
      g.restore();
    }
  });

  def('photoFrame', 16, 18, (g, x, y, t, st) => {
    const v = (st && st.variant) || 0;
    const tilt = v === 2 ? 1 : 0;
    ink(g, x, y, 16, 18, (bx, by) => {
      const F = v === 2 ? M.brass : M.walnut;
      const top = by - 18 + tilt;
      rect(bx, top, 16, 18, F.base); hl(bx, top, 16, F.l); vl(bx, top, 18, mix(F.base, F.l, 0.5));
      vl(bx + 15, top, 18, F.dd); hl(bx, top + 17, 16, F.dd);
      rect(bx + 2, top + 2, 12, 14, M.linen.base);
      rect(bx + 3, top + 3, 10, 12, v === 1 ? '#a8d4ee' : '#e6dcc0');
      if (v === 0) {
        ell(bx + 6, top + 9, 2, 2.4, '#9a6a48'); ell(bx + 6, top + 12, 2.6, 2.6, '#b95c86');
        ell(bx + 10, top + 12, 2.4, 2, '#8a5a3b'); ell(bx + 10, top + 10, 1.4, 1.4, '#8a5a3b');
        px(bx + 5, top + 8, '#221a2c'); px(bx + 7, top + 8, '#221a2c');
      } else if (v === 1) {
        rect(bx + 4, top + 8, 8, 6, M.oak.base); tri(bx + 3, top + 8, bx + 13, top + 8, bx + 8, top + 4, '#b8443f');
        rect(bx + 6, top + 10, 3, 4, M.walnut.dd); hl(bx + 3, top + 13, 10, '#fff');
        for (let i = 0; i < 4; i++) px(bx + 4 + i * 3, top + 4 + (i % 2), '#fff');
      } else {
        ell(bx + 8, top + 7, 2, 2, '#7a5a3a'); rect(bx + 6, top + 9, 5, 5, '#3b6fd6');
        ln(bx + 11, top + 6, bx + 12, top + 13, '#c8a060');
        px(bx + 7, top + 6, '#221a2c'); px(bx + 9, top + 6, '#221a2c');
      }
      // glass glint
      const gg = gfx.cur; gg.save(); gg.globalAlpha = 0.25;
      tri(bx + 3, top + 3, bx + 8, top + 3, bx + 3, top + 9, '#fff'); gg.restore();
      // little easel foot
      rect(bx + 6, by - 1, 4, 1, F.dd);
    }, { l: 4, r: 4, t: 4, b: 3 });
  });

  def('bookshelf', 44, 78, (g, x, y) => {
    floorShadow(g, x, 44, y, 0.32);
    ink(g, x, y, 44, 78, (bx, by) => {
      const W = M.walnut;
      rect(bx, by - 78, 44, 78, W.base);
      grain(bx + 1, by - 77, 42, 76, 61, W, 0.35);
      vl(bx, by - 78, 78, mix(W.base, W.l, 0.6)); vl(bx + 43, by - 78, 78, W.dd);
      hl(bx, by - 78, 44, W.l);
      rect(bx + 3, by - 74, 38, 70, W.dd);
      const R = new CH.Rng(3);
      const cols = ['#c8352b', '#3b6fd6', '#4f9d3a', '#f5c33b', '#7b4fb0', '#e8752c', '#d8d0c0', '#5a3721', '#2f8f7a'];
      for (let s = 0; s < 4; s++) {
        const sy = by - 6 - s * 17;
        // shelf board with lit top + shadow underneath
        rect(bx + 3, sy, 38, 2, W.base); hl(bx + 3, sy, 38, W.l);
        ao(bx + 3, sy + 2, 38, 3, '#160f1a', 0.3);
        let bxx = bx + 4;
        while (bxx < bx + 40) {
          const w = R.int(3, 6), h = R.int(10, 15);
          if (bxx + w > bx + 40) break;
          if (R.chance(0.1)) { bxx += w + 3; continue; }
          const c = R.pick(cols);
          const lean = R.chance(0.1);
          rect(bxx, sy - h, w, h, c);
          vl(bxx, sy - h, h, shade(c, 34)); vl(bxx + w - 1, sy - h, h, shade(c, -38));
          hl(bxx, sy - h, w, shade(c, 22));
          if (w > 3) { hl(bxx + 1, sy - h + 3, w - 2, shade(c, 46)); hl(bxx + 1, sy - h + 5, w - 2, shade(c, 46)); }
          if (lean) px(bxx + w - 1, sy - h - 1, shade(c, -20));
          bxx += w;
        }
        // one shelf has books stacked flat
        if (s === 1) { rect(bx + 30, sy - 3, 10, 3, '#8a5a3b'); rect(bx + 31, sy - 6, 9, 3, '#c8a030'); hl(bx + 31, sy - 6, 9, '#e8c860'); }
      }
      // knick-knacks on top
      ell(bx + 10, by - 81, 4, 2.4, '#5c9a42'); ell(bx + 9, by - 82, 2, 1.4, '#8bd06a');
      rect(bx + 8, by - 80, 4, 3, '#c86a3a'); hl(bx + 8, by - 80, 4, '#e08a4a');
      rect(bx + 22, by - 83, 8, 5, M.stone.base); hl(bx + 22, by - 83, 8, M.stone.l); px(bx + 25, by - 81, M.stone.dd);
      rect(bx + 34, by - 82, 4, 4, '#f5c33b'); hl(bx + 34, by - 82, 4, '#ffe27a');
      // dusty cobweb in the top corner
      const gg = gfx.cur; gg.save(); gg.globalAlpha = 0.35;
      ln(bx + 36, by - 74, bx + 41, by - 70, '#cfc8bc'); ln(bx + 36, by - 74, bx + 41, by - 74, '#cfc8bc');
      gg.restore();
      // plinth
      rect(bx + 1, by - 4, 42, 4, W.d); hl(bx + 1, by - 4, 42, W.base);
      ao(bx + 2, by - 2, 40, 2, '#160f1a', 0.25);
    }, { l: 5, r: 5, t: 8, b: 4 });
  });

  def('plant', 18, 40, (g, x, y, t, st) => {
    const v = (st && st.variant) || 0;
    floorShadow(g, x + 2, 14, y, 0.3);
    ink(g, x, y, 18, 40, (bx, by) => {
      const T = mat('#c86a3a');
      // terracotta pot with a rim
      rect(bx + 3, by - 12, 12, 12, T.base);
      vl(bx + 3, by - 12, 12, mix(T.base, T.l, 0.6)); vl(bx + 14, by - 12, 12, T.dd);
      hl(bx + 3, by - 1, 12, T.dd);
      rect(bx + 2, by - 14, 14, 3, T.base); hl(bx + 2, by - 14, 14, T.l); hl(bx + 2, by - 12, 14, T.d);
      rect(bx + 4, by - 11, 10, 2, '#4a2f1c'); dith(bx + 4, by - 11, 10, 2, '#2a1a10', 0.5);
      if (v !== 1) { px(bx + 6, by - 8, T.l); px(bx + 12, by - 5, T.dd); }
      const sway = Math.sin(t * 1.5 + x * 0.1) * 0.9;
      if (v === 0) {
        const G = M.moss;
        for (let i = 0; i < 9; i++) {
          const a = -Math.PI / 2 + (i - 4) * 0.34;
          const L = 17 + (i % 3) * 5;
          const ex = bx + 9 + Math.cos(a) * L + sway, ey = by - 13 + Math.sin(a) * L;
          ln(bx + 9, by - 12, ex, ey, i % 2 ? G.d : G.dd);
          ell(ex, ey, 3, 2, i % 2 ? G.base : G.l);
          ell(ex - Math.cos(a) * 3, ey - Math.sin(a) * 3, 2.4, 1.6, G.base);
          px(ex, ey - 1, G.l);
        }
      } else if (v === 1) {
        const G = mat('#4f9d3a');
        rect(bx + 6, by - 34, 6, 22, G.base); vl(bx + 6, by - 34, 22, G.l); vl(bx + 11, by - 34, 22, G.dd);
        hl(bx + 6, by - 34, 6, G.l);
        rect(bx + 2, by - 26, 4, 3, G.base); rect(bx + 2, by - 31, 3, 6, G.base); px(bx + 2, by - 31, G.l);
        rect(bx + 12, by - 23, 4, 3, G.base); rect(bx + 13, by - 29, 3, 7, G.base); px(bx + 13, by - 29, G.l);
        for (let i = 0; i < 8; i++) px(bx + 6 + (i % 3) * 2, by - 33 + i * 3, '#d8f0b0');
        ell(bx + 8, by - 36, 2, 1.6, '#f0a0b0'); px(bx + 8, by - 37, '#ffd0d8');
      } else {
        const D = mat('#8a6a3a');
        ln(bx + 9, by - 12, bx + 6 + sway, by - 26, D.base);
        ln(bx + 9, by - 12, bx + 13 + sway, by - 23, D.base);
        ln(bx + 9, by - 18, bx + 4, by - 20, D.d);
        px(bx + 5, by - 27, D.l); px(bx + 14, by - 24, D.l);
        // fallen leaves
        ell(bx + 2, by - 1, 2, 1, '#9a7a3a'); ell(bx + 15, by - 1, 2, 1, '#7a5a2a');
      }
    }, { l: 8, r: 8, t: 6, b: 4 });
  });

  def('window', 56, 50, (g, x, y, t, st) => {
    ink(g, x, y, 56, 50, (bx, by) => {
      const F = M.cream, W = M.pine;
      const wx = bx, wy = by - 50;
      // glass / view
      if (st && st.outside) st.outside(gfx.cur, wx + 4, wy + 4, 48, 42, t);
      else rect(wx + 4, wy + 4, 48, 42, '#1a2140');
      // reflection sheen across the glass
      const gg = gfx.cur; gg.save(); gg.globalAlpha = 0.1;
      tri(wx + 8, wy + 44, wx + 26, wy + 4, wx + 36, wy + 4, '#fff');
      gg.restore();
      // frame
      rect(wx, wy, 56, 4, F.base); hl(wx, wy, 56, F.l); hl(wx, wy + 3, 56, F.d);
      rect(wx, wy + 46, 56, 4, F.base); hl(wx, wy + 46, 56, F.l); hl(wx, wy + 49, 56, F.dd);
      rect(wx, wy, 4, 50, F.base); vl(wx, wy, 50, F.l); vl(wx + 3, wy, 50, F.d);
      rect(wx + 52, wy, 4, 50, F.base); vl(wx + 52, wy, 50, F.l); vl(wx + 55, wy, 50, F.dd);
      rect(wx + 26, wy, 3, 50, F.base); vl(wx + 26, wy, 50, F.l); vl(wx + 28, wy, 50, F.d);
      rect(wx, wy + 23, 56, 3, F.base); hl(wx, wy + 23, 56, F.l); hl(wx, wy + 25, 56, F.d);
      // inner shadow where the glass meets the frame
      ao(wx + 4, wy + 4, 48, 2, '#101828', 0.3); ao(wx + 4, wy + 4, 2, 42, '#101828', 0.22);
      // sill
      rect(wx - 3, wy + 50, 62, 4, W.base); hl(wx - 3, wy + 50, 62, W.l); hl(wx - 3, wy + 53, 62, W.dd);
      grain(wx - 2, wy + 51, 60, 2, 71, W, 0.5);
      // frost in the corners
      gg.save(); gg.globalAlpha = 0.55;
      for (const [fx, fy] of [[5, 5], [6, 5], [5, 6], [7, 5], [49, 6], [48, 5], [50, 5], [5, 43], [6, 44], [49, 43]]) px(wx + fx, wy + fy, '#fff');
      gg.restore();
      // curtains
      const C = M.wool;
      for (const cx of [-5, 51]) {
        rect(wx + cx, wy - 3, 10, 46, C.base);
        for (let i = 0; i < 5; i++) vl(wx + cx + 1 + i * 2, wy - 3, 46, i % 2 ? C.d : C.l);
        hl(wx + cx, wy - 3, 10, C.l);
        for (let i = 0; i < 5; i++) px(wx + cx + i * 2, wy + 43 + (i % 2), C.dd);
      }
      // rail + rings
      rect(wx - 8, wy - 6, 72, 3, M.walnut.base); hl(wx - 8, wy - 6, 72, M.walnut.l);
      for (let i = 0; i < 4; i++) { px(wx - 4 + i * 4, wy - 3, M.brass.base); px(wx + 52 + i * 4, wy - 3, M.brass.base); }
      px(wx - 9, wy - 5, M.brass.base); px(wx + 64, wy - 5, M.brass.base);
    }, { l: 10, r: 10, t: 8, b: 6 });
  });

  // forest view through window (with snow)
  CH.drawForestView = (g, x, y, w, h, t, night = false) => {
    gfx.clip(x, y, w, h);
    if (night) {
      gfx.vgrad(x, y, w, h, ['#0b1030', '#151c3e', '#202a54', '#2b3768']);
      const R = new CH.Rng(5);
      for (let i = 0; i < 14; i++) px(x + R.int(0, w - 1), y + R.int(0, Math.floor(h * 0.55)), R.chance(0.3) ? '#9fdcff' : '#fff');
      ell(x + w - 10, y + 8, 4, 4, '#e8e8d0'); ell(x + w - 12, y + 7, 3, 3, '#1a2140');
    } else {
      gfx.vgrad(x, y, w, h, ['#8fb8e0', '#a8cdec', '#c4e0f2', '#dcecf6', '#ecf4f8']);
      const gg = gfx.cur; gg.save(); gg.globalAlpha = 0.5;
      ell(x + w * 0.3, y + h * 0.22, 9, 3, '#fff'); ell(x + w * 0.42, y + h * 0.2, 6, 2.4, '#fff');
      ell(x + w * 0.75, y + h * 0.3, 7, 2.4, '#fff');
      gg.restore();
    }
    // far hills
    ell(x + 10, y + h - 7, 26, 11, night ? '#18263a' : '#adc6da');
    ell(x + 36, y + h - 5, 22, 9, night ? '#14202f' : '#bcd2e2');
    // snow ground with a drift lip
    rect(x, y + h - 9, w, 9, night ? '#7e88a6' : '#eef4f8');
    hl(x, y + h - 9, w, night ? '#98a2bc' : '#fff');
    for (let i = 0; i < w; i += 7) ell(x + i, y + h - 9, 4, 1.6, night ? '#8a94b0' : '#fbfdff');
    // pines
    const R = new CH.Rng((x * 7 + 3) >>> 0 || 1);
    for (let i = 0; i < 8; i++) {
      const tx = x + 1 + i * (w / 8) + R.int(0, 3), th = R.int(14, 26), ty = y + h - 7;
      const c = night ? '#10201a' : R.pick(['#2f6a24', '#3a7a2c', '#25551c', '#356e28']);
      rect(tx - 1, ty - 3, 2, 4, night ? '#0d1a14' : '#4a2e18');
      for (let k = 0; k < 4; k++) {
        const ly = ty - 2 - k * (th / 5);
        tri(tx - 5 + k, ly, tx + 5 - k, ly, tx, ly - th / 3.4, c);
        tri(tx - 4 + k, ly, tx + 2 - k, ly, tx - 1, ly - th / 4.4, shade(c, 14));
      }
      hl(tx - 3, ty - 5 - (th / 5), 5, night ? '#465470' : '#fff');
      hl(tx - 2, ty - 6 - (th / 2.5), 4, night ? '#465470' : '#eef4f8');
    }
    // falling snow, two depths
    for (let i = 0; i < 16; i++) {
      const k = (t * (i % 3 ? 0.25 : 0.14) + i * 0.0625) % 1;
      px(x + ((i * 11 + Math.floor(Math.sin(t + i) * 3)) % w), y + k * h, i % 3 ? (night ? 'rgba(255,255,255,0.75)' : '#fff') : 'rgba(255,255,255,0.45)');
    }
    gfx.unclip();
  };

  def('kitchenCounter', 104, 30, (g, x, y, t, st) => {
    ink(g, x, y, 104, 30, (bx, by) => {
      const W = M.oak, S = M.steel;
      // carcass + kick plate
      rect(bx, by - 28, 104, 28, W.base); grain(bx + 1, by - 27, 102, 26, 81, W, 0.3);
      rect(bx, by - 5, 104, 5, W.dd); hl(bx, by - 5, 104, W.d);
      ao(bx, by - 4, 104, 4, '#160f1a', 0.3);
      // doors
      for (let i = 0; i < 4; i++) {
        const dx = bx + 2 + i * 25;
        rect(dx, by - 26, 23, 20, W.d);
        fr(dx + 1, by - 25, 21, 18, mix(W.base, W.l, 0.45));
        rect(dx + 3, by - 23, 17, 14, W.base); grain(dx + 4, by - 22, 15, 12, 91 + i, W, 0.5);
        hl(dx + 1, by - 25, 21, W.l); hl(dx + 1, by - 8, 21, W.dd);
        rect(dx + 9, by - 14, 5, 1, M.brass.base); px(dx + 9, by - 13, M.brass.dd); px(dx + 13, by - 15, M.brass.l);
      }
      // countertop - top face stays at y-32
      rect(bx, by - 32, 104, 4, S.d); hl(bx, by - 32, 104, S.l); hl(bx, by - 31, 104, mix(S.base, S.l, 0.6));
      hl(bx, by - 29, 104, S.dd);
      dith(bx, by - 31, 104, 2, '#e8ecf2', 0.25);
      // sink basin
      rect(bx + 34, by - 33, 34, 2, M.chrome.base); hl(bx + 34, by - 33, 34, M.chrome.l);
      rect(bx + 36, by - 32, 30, 3, '#4a4a54'); hl(bx + 36, by - 32, 30, '#6a6a76');
      dith(bx + 38, by - 31, 26, 2, '#8fb8d8', 0.3);
      // tap
      rect(bx + 50, by - 45, 3, 13, M.chrome.base); vl(bx + 50, by - 45, 13, M.chrome.l); vl(bx + 52, by - 45, 13, M.chrome.dd);
      rect(bx + 50, by - 46, 10, 3, M.chrome.base); hl(bx + 50, by - 46, 10, M.chrome.l);
      px(bx + 59, by - 43, M.chrome.d); rect(bx + 47, by - 44, 3, 2, M.chrome.d);
      if (t !== undefined) { const k = (t * 1.2) % 1; if (k < 0.8) { px(bx + 59, by - 42 + Math.floor(k * 9), '#9fdcff'); px(bx + 59, by - 41 + Math.floor(k * 9), '#cdeaff'); } }
      // dish pile
      for (let i = 0; i < 4; i++) { const dw = 14 - i * 2; ell(bx + 12, by - 34 - i * 2, dw / 2, 1.4, i % 2 ? M.linen.base : '#e2dccc'); hl(bx + 12 - dw / 2, by - 35 - i * 2, dw, '#fff'); }
      rect(bx + 9, by - 47, 6, 5, '#3b6fd6'); hl(bx + 9, by - 47, 6, '#6fa2ff'); px(bx + 15, by - 45, '#3b6fd6');
      // frying pan hung to dry + a kettle
      ell(bx + 80, by - 35, 7, 2.4, S.d); ell(bx + 80, by - 36, 6, 1.8, S.base); hl(bx + 75, by - 37, 10, S.l);
      ln(bx + 87, by - 36, bx + 95, by - 38, '#22222c');
      rect(bx + 70, by - 38, 7, 6, M.enamel.base); hl(bx + 70, by - 38, 7, M.enamel.l); vl(bx + 76, by - 38, 6, M.enamel.dd);
      tri(bx + 77, by - 37, bx + 80, by - 36, bx + 77, by - 35, M.enamel.d);
      // paper towel roll + a mug
      rect(bx + 96, by - 44, 6, 11, M.linen.base); vl(bx + 96, by - 44, 11, '#fff'); vl(bx + 101, by - 44, 11, M.linen.d);
      rect(bx + 97, by - 45, 4, 1, '#c8c0b0');
      mug(bx + 26, by - 32, '#4f9d3a');
      // crumbs + a wet ring
      px(bx + 44, by - 33, '#d8b060'); px(bx + 48, by - 33, '#c8a050');
      const gg = gfx.cur; gg.save(); gg.globalAlpha = 0.25; ell(bx + 27, by - 32, 4, 1, '#8fb8d8'); gg.restore();
    }, { l: 6, r: 6, t: 20, b: 4 });
  });

  def('fridge', 36, 72, (g, x, y, t, st) => {
    floorShadow(g, x, 36, y, 0.32);
    ink(g, x, y, 36, 72, (bx, by) => {
      const E = M.enamel;
      rect(bx, by - 72, 36, 72, E.base);
      vl(bx, by - 72, 72, E.l); vl(bx + 1, by - 72, 72, mix(E.base, E.l, 0.5));
      vl(bx + 34, by - 72, 72, E.d); vl(bx + 35, by - 72, 72, E.dd);
      hl(bx, by - 72, 36, E.l); hl(bx, by - 1, 36, E.dd);
      // freezer / fridge split
      rect(bx, by - 48, 36, 2, E.dd); hl(bx, by - 46, 36, E.l);
      // handles
      rect(bx + 28, by - 66, 3, 12, M.chrome.d); vl(bx + 28, by - 66, 12, M.chrome.l);
      rect(bx + 28, by - 42, 3, 18, M.chrome.d); vl(bx + 28, by - 42, 18, M.chrome.l);
      // gentle cylindrical shading
      dith(bx + 2, by - 71, 6, 70, '#ffffff', 0.18);
      dith(bx + 26, by - 71, 8, 70, '#4a5a6a', 0.14);
      // feet
      rect(bx + 1, by - 2, 4, 2, M.plastic.base); rect(bx + 31, by - 2, 4, 2, M.plastic.base);
      ao(bx + 2, by - 3, 32, 3, '#160f1a', 0.25);
      // magnets, notes, a kid's drawing
      rect(bx + 4, by - 68, 10, 7, '#f5c33b'); hl(bx + 4, by - 68, 10, '#ffe27a'); hl(bx + 5, by - 66, 8, '#5a4a20'); hl(bx + 5, by - 64, 6, '#5a4a20');
      rect(bx + 17, by - 67, 9, 11, '#fff'); hl(bx + 17, by - 67, 9, '#fff');
      for (let i = 0; i < 4; i++) hl(bx + 18, by - 65 + i * 2, 7, '#8a94b8');
      px(bx + 21, by - 68, '#c8352b'); px(bx + 22, by - 68, '#e05040');
      rect(bx + 6, by - 38, 12, 14, '#fdfaf0'); hl(bx + 6, by - 38, 12, '#fff');
      for (let i = 0; i < 5; i++) hl(bx + 7, by - 36 + i * 2, 10 - (i === 4 ? 4 : 0), '#6a6a74');
      px(bx + 12, by - 39, '#3b6fd6'); px(bx + 13, by - 39, '#5f8fe8');
      rect(bx + 20, by - 40, 12, 12, '#f8f0d8'); hl(bx + 20, by - 40, 12, '#fff');
      ell(bx + 26, by - 35, 3.4, 3.4, '#8a5a3b'); px(bx + 25, by - 36, '#221a2c'); px(bx + 27, by - 36, '#221a2c');
      ell(bx + 26, by - 31, 2.4, 1.2, '#2f8f7a'); ln(bx + 22, by - 30, bx + 30, by - 30, '#5c9a42');
      px(bx + 20, by - 41, '#c8352b'); px(bx + 31, by - 41, '#4f9d3a');
      ell(bx + 8, by - 20, 2.4, 2.4, '#c8352b'); ell(bx + 26, by - 18, 2.4, 2.4, '#4f9d3a');
      rect(bx + 14, by - 20, 9, 7, '#8bd06a'); hl(bx + 14, by - 20, 9, '#b8e89a');
      px(bx + 18, by - 16, '#c8352b'); px(bx + 19, by - 17, '#c8352b'); px(bx + 18, by - 18, '#c8352b');
      // grubby fingerprints near the handle
      dith(bx + 24, by - 36, 4, 8, '#7a6a5a', 0.2);
    }, { l: 5, r: 5, t: 5, b: 4 });
  });

  def('stove', 36, 32, (g, x, y, t, st) => {
    floorShadow(g, x, 36, y, 0.3);
    ink(g, x, y, 36, 32, (bx, by) => {
      const E = M.enamel, D = M.plastic;
      rect(bx, by - 32, 36, 32, E.base);
      vl(bx, by - 32, 32, E.l); vl(bx + 35, by - 32, 32, E.dd);
      hl(bx, by - 1, 36, E.dd);
      // control panel
      rect(bx, by - 32, 36, 6, E.d); hl(bx, by - 32, 36, E.l); hl(bx, by - 27, 36, E.dd);
      for (let i = 0; i < 4; i++) { ell(bx + 5 + i * 8, by - 29, 2, 2, D.base); px(bx + 5 + i * 8, by - 30, M.chrome.l); px(bx + 5 + i * 8, by - 28, D.dd); }
      // oven door + window
      rect(bx + 2, by - 25, 32, 18, D.base); hl(bx + 2, by - 25, 32, D.l); hl(bx + 2, by - 8, 32, D.dd);
      rect(bx + 5, by - 22, 26, 12, '#10101a');
      dith(bx + 5, by - 22, 26, 12, '#4a3020', 0.35);
      const gg = gfx.cur; gg.save(); gg.globalAlpha = 0.18; tri(bx + 6, by - 12, bx + 16, by - 21, bx + 22, by - 21, '#fff'); gg.restore();
      fr(bx + 5, by - 22, 26, 12, D.dd);
      // handle
      rect(bx + 4, by - 27, 28, 2, M.chrome.d); hl(bx + 4, by - 27, 28, M.chrome.l);
      rect(bx + 4, by - 6, 28, 3, E.d); hl(bx + 4, by - 6, 28, E.base);
      ao(bx + 2, by - 3, 32, 3, '#160f1a', 0.22);
      // hob top + burners
      rect(bx, by - 35, 36, 3, D.d); hl(bx, by - 35, 36, mix(D.base, D.l, 0.7)); hl(bx, by - 33, 36, D.dd);
      for (let i = 0; i < 2; i++) { ell(bx + 10 + i * 16, by - 35, 6, 2, D.dd); ell(bx + 10 + i * 16, by - 35, 4.4, 1.4, '#4a4a54'); hl(bx + 6 + i * 16, by - 36, 9, '#6a6a76'); }
      // pan of pancakes
      if (!st || st.pan !== false) {
        ell(bx + 10, by - 38, 8, 2.6, M.steel.dd); ell(bx + 10, by - 39, 7, 2, M.steel.d); hl(bx + 4, by - 40, 12, M.steel.l);
        ell(bx + 10, by - 40, 5, 1.4, '#e0a050'); ell(bx + 9, by - 40, 3, 1, '#f0bc70');
        ln(bx + 18, by - 39, bx + 26, by - 41, '#22222c'); ln(bx + 18, by - 38, bx + 26, by - 40, '#3a3a48');
        if (t !== undefined && st && st.steam) for (let i = 0; i < 3; i++) {
          const k = (t * 0.6 + i * 0.33) % 1;
          px(bx + 7 + i * 3 + Math.round(Math.sin(t * 2 + i) * 1), by - 42 - k * 12, 'rgba(255,255,255,' + (0.6 - k * 0.6).toFixed(2) + ')');
        }
      }
      // grease splashes
      px(bx + 22, by - 36, '#c8a050'); px(bx + 26, by - 37, '#a88030');
    }, { l: 6, r: 8, t: 18, b: 4 });
  });

  def('table', 64, 26, (g, x, y, t, st) => {
    floorShadow(g, x, 64, y, 0.3);
    ink(g, x, y, 64, 26, (bx, by) => {
      const W = M.pine, L = M.oak;
      // legs + stretcher
      rect(bx + 4, by - 22, 5, 22, L.base); vl(bx + 4, by - 22, 22, L.l); vl(bx + 8, by - 22, 22, L.dd);
      rect(bx + 55, by - 22, 5, 22, L.base); vl(bx + 55, by - 22, 22, L.l); vl(bx + 59, by - 22, 22, L.dd);
      rect(bx + 8, by - 9, 48, 2, L.d); hl(bx + 8, by - 9, 48, L.base);
      // apron + top (top face fixed at y-26 so table dressing lands on it)
      rect(bx + 1, by - 23, 62, 3, W.d); hl(bx + 1, by - 23, 62, mix(W.base, W.d, 0.4));
      surf(bx, by - 26, 64, 3, W); grain(bx + 1, by - 25, 62, 2, 101, W, 0.6);
      ao(bx + 1, by - 23, 62, 2, '#160f1a', 0.18);
      // runner cloth over the middle
      rect(bx + 18, by - 27, 30, 2, M.wool.base); hl(bx + 18, by - 27, 30, M.wool.l);
      for (let i = 0; i < 30; i += 3) px(bx + 18 + i, by - 25, M.wool.dd);
      rect(bx + 18, by - 25, 3, 5, M.wool.base); hl(bx + 18, by - 25, 3, M.wool.d);
      rect(bx + 45, by - 25, 3, 4, M.wool.base);
      // salt + pepper
      rect(bx + 50, by - 33, 4, 6, '#f4f1ea'); hl(bx + 50, by - 33, 4, '#fff'); px(bx + 51, by - 34, '#b8b0a0'); px(bx + 52, by - 34, '#b8b0a0');
      rect(bx + 55, by - 33, 4, 6, '#3a3a44'); hl(bx + 55, by - 33, 4, '#6a6a76'); px(bx + 56, by - 34, '#b8b0a0');
      // syrup jug
      rect(bx + 33, by - 37, 6, 10, '#8a4a1a'); vl(bx + 33, by - 37, 10, '#b06a2a'); vl(bx + 38, by - 37, 10, '#5a2e0e');
      rect(bx + 34, by - 39, 4, 2, '#f5c33b'); hl(bx + 34, by - 39, 4, '#ffe27a');
      rect(bx + 34, by - 34, 4, 3, '#e8b060'); px(bx + 35, by - 33, '#c8352b');
      // coffee mug + a folded newspaper
      mug(bx + 24, by - 26, '#3b6fd6');
      rect(bx + 6, by - 29, 13, 3, '#e4ded0'); hl(bx + 6, by - 29, 13, '#f4f1ea');
      for (let i = 0; i < 3; i++) hl(bx + 7, by - 28 + i, 10 - i * 2, '#9a94a0');
      rect(bx + 8, by - 31, 10, 2, '#efe9dc'); px(bx + 16, by - 31, '#c8352b');
    }, { l: 6, r: 6, t: 16, b: 4 });
  });

  def('pancakes', 18, 10, (g, x, y, t, st) => {
    const eaten = st && st.eaten;
    ink(g, x, y, 18, 10, (bx, by) => {
      // plate
      ell(bx + 9, by - 1, 9, 2.4, M.linen.d); ell(bx + 9, by - 2, 9, 2.4, M.linen.base);
      hl(bx + 2, by - 3, 14, '#fff');
      if (!eaten) {
        for (let i = 0; i < 4; i++) {
          const ry = by - 4 - i * 2.4;
          ell(bx + 9, ry, 7 - i * 0.3, 1.9, i % 2 ? '#c98d3e' : '#e0a557');
          ell(bx + 9, ry - 0.6, 6.4 - i * 0.3, 1.3, i % 2 ? '#e0a557' : '#f0bd70');
        }
        rect(bx + 7, by - 15, 5, 3, '#f5c33b'); hl(bx + 7, by - 15, 5, '#ffe89a'); px(bx + 11, by - 13, '#d8a62a');
        // syrup running down the stack
        px(bx + 3, by - 8, '#8a4a1a'); px(bx + 3, by - 7, '#8a4a1a'); px(bx + 4, by - 6, '#a05a20');
        px(bx + 14, by - 7, '#8a4a1a'); px(bx + 15, by - 6, '#8a4a1a'); px(bx + 15, by - 5, '#a05a20');
        ell(bx + 9, by - 3, 6, 1, '#a05a20');
        if (t !== undefined) for (let i = 0; i < 3; i++) {
          const k = (t * 0.5 + i * 0.33) % 1;
          px(bx + 5 + i * 4 + Math.round(Math.sin(t * 2 + i) * 1), by - 17 - k * 11, 'rgba(255,255,255,' + (0.7 - k * 0.7).toFixed(2) + ')');
        }
      } else {
        px(bx + 6, by - 3, '#8a4a1a'); px(bx + 10, by - 3, '#e0a557'); px(bx + 9, by - 4, '#8a4a1a');
        ell(bx + 9, by - 3, 4, 1, '#c08a4a');
        // fork left on the plate
        ln(bx + 4, by - 3, bx + 13, by - 5, M.chrome.d); px(bx + 3, by - 3, M.chrome.base);
      }
    }, { l: 5, r: 5, t: 12, b: 3 });
  });

  def('chair', 18, 32, (g, x, y, t, st) => {
    const flip = st && st.flip;
    floorShadow(g, x, 18, y, 0.28);
    ink(g, x, y, 18, 32, (bx, by) => {
      const W = M.oak;
      const px0 = flip ? bx + 14 : bx + 1;
      // back post + slats
      rect(px0, by - 32, 4, 32, W.base); vl(px0, by - 32, 32, W.l); vl(px0 + 3, by - 32, 32, W.dd);
      hl(px0, by - 32, 4, W.l);
      for (let i = 0; i < 2; i++) {
        const sx0 = flip ? bx + 8 : bx + 6;
        rect(sx0, by - 29 + i * 6, 7, 3, W.d); hl(sx0, by - 29 + i * 6, 7, W.base);
      }
      // seat
      rect(bx, by - 17, 18, 4, W.base); hl(bx, by - 17, 18, W.l); hl(bx, by - 14, 18, W.dd);
      grain(bx + 1, by - 16, 16, 2, 111, W, 0.6);
      ao(bx + 1, by - 13, 16, 2, '#160f1a', 0.2);
      // front + rear legs with a stretcher
      const fx = flip ? bx + 1 : bx + 14;
      rect(fx, by - 13, 3, 13, W.d); vl(fx, by - 13, 13, W.base);
      rect(px0, by - 13, 4, 13, W.d); vl(px0, by - 13, 13, W.base);
      rect(bx + 2, by - 6, 14, 2, W.dd);
      ao(bx + 1, by - 2, 16, 2, '#160f1a', 0.22);
    }, { l: 5, r: 5, t: 5, b: 3 });
  });

  def('rockingChair', 28, 46, (g, x, y, t, st) => {
    const rock = st && st.rocking ? Math.sin(t * 2) : 0;
    floorShadow(g, x, 28, y, 0.28);
    g.save(); g.translate(x + 14, y); g.rotate(rock * 0.05); g.translate(-(x + 14), -y);
    ink(g, x, y, 28, 46, (bx, by) => {
      const W = M.oak, C = M.wool;
      // back frame + spindles
      rect(bx + 2, by - 46, 4, 32, W.base); vl(bx + 2, by - 46, 32, W.l); vl(bx + 5, by - 46, 32, W.dd);
      rect(bx + 19, by - 44, 4, 26, W.base); vl(bx + 19, by - 44, 26, W.l); vl(bx + 22, by - 44, 26, W.dd);
      rect(bx + 3, by - 46, 20, 4, W.base); hl(bx + 3, by - 46, 20, W.l); hl(bx + 3, by - 43, 20, W.dd);
      rect(bx + 4, by - 39, 18, 3, W.d); hl(bx + 4, by - 39, 18, W.base);
      for (let i = 0; i < 4; i++) { rect(bx + 7 + i * 4, by - 42, 2, 20, W.d); vl(bx + 7 + i * 4, by - 42, 20, W.base); }
      // seat + cushion
      rect(bx + 3, by - 22, 21, 4, W.base); hl(bx + 3, by - 22, 21, W.l); hl(bx + 3, by - 19, 21, W.dd);
      rr(bx + 4, by - 27, 19, 6, 2, C.base); hl(bx + 5, by - 27, 17, C.l); hl(bx + 5, by - 22, 17, C.dd);
      for (let i = 0; i < 4; i++) px(bx + 8 + i * 4, by - 25, C.d);
      ao(bx + 4, by - 18, 19, 2, '#160f1a', 0.22);
      // arm rests
      rect(bx + 4, by - 31, 19, 3, W.base); hl(bx + 4, by - 31, 19, W.l); hl(bx + 4, by - 29, 19, W.dd);
      rect(bx + 20, by - 30, 3, 9, W.d); vl(bx + 20, by - 30, 9, W.base);
      // legs
      rect(bx + 4, by - 18, 3, 14, W.d); rect(bx + 20, by - 18, 3, 14, W.d);
      vl(bx + 4, by - 18, 14, W.base); vl(bx + 20, by - 18, 14, W.base);
      rect(bx + 6, by - 10, 15, 2, W.dd);
      // rockers
      for (let i = 0; i < 27; i++) {
        const yy = by - 4 + Math.round(Math.abs(i - 13) * 0.17);
        px(bx + i, yy, W.l); px(bx + i, yy + 1, W.base); px(bx + i, yy + 2, W.dd);
      }
      // knitting basket beside it
      rect(bx + 28, by - 12, 14, 12, M.card.base);
      for (let i = 0; i < 4; i++) hl(bx + 28, by - 11 + i * 3, 14, i % 2 ? M.card.l : M.card.d);
      for (let i = 0; i < 5; i++) vl(bx + 29 + i * 3, by - 12, 12, M.card.d);
      rect(bx + 27, by - 14, 16, 3, M.card.base); hl(bx + 27, by - 14, 16, M.card.l); hl(bx + 27, by - 12, 16, M.card.dd);
      hl(bx + 28, by - 1, 14, M.card.dd);
      ell(bx + 32, by - 16, 3.4, 2.4, '#c85a8a'); ell(bx + 31, by - 17, 2, 1.2, '#e07aa8');
      ell(bx + 37, by - 17, 3.4, 2.4, '#5a7ac8'); ell(bx + 36, by - 18, 2, 1.2, '#7b9ae8');
      ln(bx + 38, by - 19, bx + 43, by - 24, '#d8d0c0'); px(bx + 43, by - 25, M.chrome.l); px(bx + 44, by - 26, M.chrome.base);
      rect(bx + 28, by - 6, 6, 7, '#c85a8a'); for (let i = 0; i < 3; i++) hl(bx + 28, by - 5 + i * 2, 6, '#e07aa8');
    }, { l: 6, r: 20, t: 8, b: 4 });
    g.restore();
  });
  def('rotaryPhone', 18, 26, (g, x, y, t, st) => {
    const ring = st && st.ringing;
    const sh = ring ? Math.round(Math.sin(t * 34) * 1) : 0;
    wallShadow(g, x + 1, y - 24, 16, 22, 0.2);
    ink(g, x + sh, y, 18, 26, (bx, by) => {
      const C = M.plastic, D = M.cream;
      // body
      rr(bx, by - 24, 18, 22, 2, C.base);
      hl(bx + 1, by - 24, 16, C.l); vl(bx, by - 22, 18, mix(C.base, C.l, 0.5)); vl(bx + 17, by - 22, 18, C.dd);
      hl(bx + 1, by - 3, 16, C.dd);
      // dial
      ell(bx + 9, by - 13, 6.5, 6.5, C.dd); ell(bx + 9, by - 13, 5.5, 5.5, D.base); ell(bx + 9, by - 14, 5, 4.4, D.l);
      ell(bx + 9, by - 13, 2.6, 2.6, C.d); ell(bx + 9, by - 13, 1.6, 1.6, C.base);
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI * 0.86 + i * (Math.PI * 1.55 / 9);
        px(bx + 9 + Math.round(Math.cos(a) * 4.2), by - 13 + Math.round(Math.sin(a) * 4.2), C.dd);
      }
      // handset cradled on top
      rect(bx - 2, by - 30, 22, 4, C.base); hl(bx - 2, by - 30, 22, C.l); hl(bx - 2, by - 27, 22, C.dd);
      rect(bx - 4, by - 32, 5, 6, C.base); hl(bx - 4, by - 32, 5, C.l); vl(bx - 4, by - 32, 6, mix(C.base, C.l, 0.5));
      rect(bx + 17, by - 32, 5, 6, C.base); hl(bx + 17, by - 32, 5, C.l); vl(bx + 21, by - 32, 6, C.dd);
      px(bx - 2, by - 30, C.dd); px(bx + 19, by - 30, C.dd);
      // coiled cord
      for (let i = 0; i < 10; i++) { px(bx + 20 + (i % 2), by - 22 + i * 2, C.d); px(bx + 20 + (i % 2), by - 21 + i * 2, C.dd); }
      // maker's plate
      rect(bx + 3, by - 6, 12, 2, C.d); px(bx + 5, by - 6, D.d); px(bx + 8, by - 6, D.d); px(bx + 11, by - 6, D.d);
    }, { l: 8, r: 8, t: 10, b: 4 });
    if (ring) {
      const k = Math.sin(t * 30) > 0;
      for (let i = 0; i < 3; i++) {
        px(x - 5 - i, y - 30 - i, k ? '#fff8ee' : 'rgba(0,0,0,0)');
        px(x + 22 + i, y - 30 - i, k ? 'rgba(0,0,0,0)' : '#fff8ee');
      }
    }
  });

  def('coatRack', 20, 70, (g, x, y) => {
    floorShadow(g, x - 2, 24, y, 0.28);
    ink(g, x, y, 20, 70, (bx, by) => {
      const W = M.walnut;
      // post + tripod foot
      rect(bx + 8, by - 70, 4, 68, W.base); vl(bx + 8, by - 70, 68, W.l); vl(bx + 11, by - 70, 68, W.dd);
      ell(bx + 10, by - 70, 2.4, 1.6, W.l);
      rect(bx + 3, by - 3, 14, 3, W.d); hl(bx + 3, by - 3, 14, W.base);
      ln(bx + 9, by - 8, bx + 2, by - 2, W.d); ln(bx + 11, by - 8, bx + 18, by - 2, W.d);
      ao(bx + 2, by - 2, 16, 2, '#160f1a', 0.22);
      // pegs
      for (const dx of [-7, 7]) {
        ln(bx + 10, by - 64, bx + 10 + dx, by - 60, W.base);
        ln(bx + 10, by - 63, bx + 10 + dx, by - 59, W.d);
        ell(bx + 10 + dx, by - 61, 1.6, 1.6, M.brass.base); px(bx + 10 + dx, by - 62, M.brass.l);
      }
      // grey hoodie on the left peg: hood, shoulders, sleeve
      const H = mat('#6c6c78');
      ell(bx - 3, by - 58, 5, 4, H.d); ell(bx - 3, by - 59, 4, 3, H.base);
      tri(bx - 10, by - 48, bx + 4, by - 48, bx - 3, by - 56, H.base);
      rect(bx - 9, by - 48, 13, 22, H.base);
      hl(bx - 9, by - 48, 13, H.l); vl(bx - 9, by - 48, 22, mix(H.base, H.l, 0.5)); vl(bx + 3, by - 48, 22, H.dd);
      rect(bx - 11, by - 46, 4, 15, H.d); hl(bx - 11, by - 46, 4, H.base);
      rect(bx + 2, by - 46, 3, 13, H.dd);
      vl(bx - 3, by - 44, 18, H.d);
      ln(bx - 6, by - 49, bx - 6, by - 43, H.l); ln(bx - 1, by - 49, bx - 1, by - 43, H.l);
      rect(bx - 7, by - 36, 9, 4, H.d);
      for (let i = 0; i < 3; i++) hl(bx - 9, by - 28 + i, 13, H.dd);
      // red parka on the right peg: collar, shoulders, sleeve, hem
      const R = M.wool;
      rect(bx + 13, by - 60, 9, 4, R.d); hl(bx + 13, by - 60, 9, R.base);
      tri(bx + 10, by - 50, bx + 25, by - 50, bx + 17, by - 57, R.base);
      rect(bx + 11, by - 50, 14, 26, R.base);
      hl(bx + 11, by - 50, 14, R.l); vl(bx + 11, by - 50, 26, mix(R.base, R.l, 0.5)); vl(bx + 24, by - 50, 26, R.dd);
      rect(bx + 24, by - 48, 4, 17, R.d); hl(bx + 24, by - 48, 4, R.base);
      rect(bx + 9, by - 48, 3, 15, R.dd);
      vl(bx + 18, by - 49, 24, R.dd); vl(bx + 17, by - 49, 24, R.rim);
      for (let i = 0; i < 5; i++) px(bx + 18, by - 46 + i * 5, M.chrome.l);
      rect(bx + 12, by - 34, 5, 4, R.d); rect(bx + 19, by - 34, 5, 4, R.d);
      rect(bx + 11, by - 26, 14, 3, R.dd); hl(bx + 11, by - 26, 14, R.d);
      // yellow scarf slung over the peg beside the parka
      rect(bx + 20, by - 62, 3, 6, '#f5c33b'); hl(bx + 20, by - 62, 3, '#ffe27a');
      rect(bx + 22, by - 58, 3, 24, '#f5c33b'); hl(bx + 22, by - 58, 3, '#ffe27a'); vl(bx + 24, by - 58, 24, '#c89a20');
      for (let i = 0; i < 5; i++) hl(bx + 22, by - 55 + i * 5, 3, '#c8352b');
      rect(bx + 22, by - 34, 3, 2, '#e8b62a'); for (let i = 0; i < 3; i++) px(bx + 22 + i, by - 32, '#f5c33b');
    }, { l: 14, r: 10, t: 6, b: 4 });
  });
  def('boots', 26, 12, (g, x, y) => {
    floorShadow(g, x, 26, y, 0.26);
    ink(g, x, y, 26, 12, (bx, by) => {
      const L = M.leather;
      for (let i = 0; i < 2; i++) {
        const ox = i * 14, lean = i;
        rect(bx + ox, by - 10 + lean, 7, 8, L.base);
        hl(bx + ox, by - 10 + lean, 7, L.l); vl(bx + ox, by - 10 + lean, 8, mix(L.base, L.l, 0.5)); vl(bx + ox + 6, by - 10 + lean, 8, L.dd);
        rect(bx + ox, by - 3, 11, 3, L.dd); hl(bx + ox, by - 3, 11, L.d);
        hl(bx + ox, by - 1, 11, '#2a1d14');
        // laces
        for (let k = 0; k < 3; k++) { px(bx + ox + 2, by - 9 + lean + k * 2, '#e4dcc8'); px(bx + ox + 4, by - 9 + lean + k * 2, '#e4dcc8'); }
        ln(bx + ox + 2, by - 10 + lean, bx + ox + 5, by - 8 + lean, '#e4dcc8');
      }
      // salt stains + a puddle of melt
      px(bx + 2, by - 4, '#ddd6c8'); px(bx + 3, by - 5, '#ddd6c8'); px(bx + 17, by - 4, '#ddd6c8'); px(bx + 22, by - 5, '#ddd6c8');
      const gg = gfx.cur; gg.save(); gg.globalAlpha = 0.28; ell(bx + 13, by, 13, 2, '#8fb8d8'); gg.restore();
    }, { l: 5, r: 5, t: 5, b: 3 });
  });

  def('door', 36, 74, (g, x, y, t, st) => {
    ink(g, x, y, 36, 74, (bx, by) => {
      const W = M.oak, F = M.walnut;
      // casing
      rect(bx - 3, by - 77, 42, 77, F.base);
      grain(bx - 2, by - 76, 40, 3, 121, F, 0.5);
      hl(bx - 3, by - 77, 42, F.l); vl(bx - 3, by - 77, 77, F.l); vl(bx + 38, by - 77, 77, F.dd);
      // leaf
      CH.drawPlanks(gfx.cur, bx, by - 74, 36, 74, 9, W.base, W.dd, W.l, 5, true);
      ao(bx, by - 74, 3, 74, '#160f1a', 0.25);
      // rails and panels
      rect(bx + 3, by - 70, 30, 32, W.d); fr(bx + 3, by - 70, 30, 32, W.dd); fr(bx + 4, by - 69, 28, 30, W.l);
      rect(bx + 5, by - 68, 26, 28, W.base); grain(bx + 6, by - 67, 24, 26, 131, W, 0.4);
      rect(bx + 3, by - 32, 30, 26, W.d); fr(bx + 3, by - 32, 30, 26, W.dd); fr(bx + 4, by - 31, 28, 24, W.l);
      rect(bx + 5, by - 30, 26, 22, W.base); grain(bx + 6, by - 29, 24, 20, 141, W, 0.4);
      // small window with the forest behind it
      rect(bx + 9, by - 66, 18, 22, '#101828');
      if (st && st.outside) st.outside(gfx.cur, bx + 9, by - 66, 18, 22, t);
      rect(bx + 8, by - 67, 20, 2, M.cream.base); rect(bx + 8, by - 45, 20, 2, M.cream.base);
      rect(bx + 8, by - 67, 2, 24, M.cream.base); rect(bx + 26, by - 67, 2, 24, M.cream.base);
      vl(bx + 17, by - 66, 22, M.cream.base); hl(bx + 9, by - 56, 18, M.cream.base);
      hl(bx + 8, by - 67, 20, M.cream.l); hl(bx + 8, by - 44, 20, M.cream.dd);
      // handle + deadbolt + hinges
      ell(bx + 30, by - 34, 2.6, 2.6, M.brass.base); ell(bx + 30, by - 35, 1.6, 1.2, M.brass.l); px(bx + 31, by - 33, M.brass.dd);
      rect(bx + 29, by - 40, 5, 3, M.chrome.d); hl(bx + 29, by - 40, 5, M.chrome.l);
      for (const hy of [-64, -36, -10]) { rect(bx, by + hy, 3, 6, M.chrome.d); hl(bx, by + hy, 3, M.chrome.l); px(bx + 1, by + hy + 3, M.chrome.dd); }
      // draught strip + welcome mat
      rect(bx, by - 3, 36, 3, F.dd);
      rect(bx - 4, by - 2, 44, 2, '#8a6a3a'); hl(bx - 4, by - 2, 44, '#a8854a');
      for (let i = 0; i < 11; i++) px(bx - 3 + i * 4, by - 1, '#c8a060');
      ao(bx - 4, by - 1, 44, 1, '#160f1a', 0.2);
    }, { l: 8, r: 8, t: 8, b: 4 });
  });

  def('rug', 104, 5, (g, x, y, t, st) => {
    const c1 = (st && st.c1) || '#a04040', c2 = (st && st.c2) || '#d08060';
    const gg = gfx.cur; gg.save(); gg.globalAlpha = 0.18; rect(x + 1, y - 3, 104, 4, '#160f1a'); gg.restore();
    rect(x, y - 5, 104, 5, c1);
    hl(x, y - 5, 104, shade(c1, -26));
    hl(x, y - 4, 104, shade(c2, 16));
    for (let i = 0; i < 26; i++) rect(x + i * 4 + (i % 2), y - 3, 2, 2, c2);
    for (let i = 0; i < 52; i++) px(x + i * 2, y - 2, i % 3 ? shade(c1, -14) : c2);
    hl(x, y - 1, 104, shade(c1, -34));
    // fringe
    for (let i = 0; i < 104; i += 3) { px(x + i, y, shade(c2, 24)); }
    px(x + 4, y - 4, shade(c1, 30)); px(x + 90, y - 3, shade(c1, -34));
  }, {});

  def('lamp', 20, 76, (g, x, y, t, st) => {
    const on = !st || st.on !== false;
    floorShadow(g, x + 2, 16, y, 0.26);
    ink(g, x, y, 20, 76, (bx, by) => {
      const S = M.brass;
      // base + stem
      ell(bx + 10, by - 2, 8, 2.4, S.d); ell(bx + 10, by - 3, 7, 2, S.base); hl(bx + 5, by - 4, 10, S.l);
      rect(bx + 9, by - 62, 3, 59, S.base); vl(bx + 9, by - 62, 59, S.l); vl(bx + 11, by - 62, 59, S.dd);
      rect(bx + 8, by - 42, 5, 3, S.d); hl(bx + 8, by - 42, 5, S.l);
      // shade
      const sc = on ? mat('#f6e4ae', { dark: -26, light: 14 }) : mat('#cbbf97', { dark: -26, light: 14 });
      tri(bx, by - 62, bx + 20, by - 62, bx + 16, by - 76, sc.base);
      tri(bx, by - 62, bx + 12, by - 76, bx + 4, by - 76, sc.l);
      tri(bx + 16, by - 62, bx + 20, by - 62, bx + 16, by - 76, sc.d);
      rect(bx + 4, by - 76, 12, 2, sc.d); hl(bx + 4, by - 76, 12, sc.base);
      rect(bx, by - 63, 20, 3, sc.d); hl(bx, by - 63, 20, sc.base); hl(bx, by - 61, 20, sc.dd);
      for (let i = 0; i < 4; i++) vl(bx + 3 + i * 5, by - 74, 11, sc.d);
      if (on) { rect(bx + 2, by - 61, 16, 1, '#fff6d0'); px(bx + 10, by - 60, '#fff'); }
      // little pull chain
      for (let i = 0; i < 4; i++) px(bx + 17, by - 59 + i * 2, S.d);
      px(bx + 17, by - 51, S.base);
    }, { l: 6, r: 6, t: 6, b: 4 });
    if (on) {
      g.save(); g.globalAlpha = 0.1;
      tri(x - 18, y, x + 38, y, x + 10, y - 62, '#ffe8a0');
      g.globalAlpha = 0.07;
      tri(x - 28, y, x + 48, y, x + 10, y - 62, '#ffd880');
      g.restore();
    }
  });

  def('wallClock', 18, 18, (g, x, y, t, st) => {
    wallShadow(g, x, y - 18, 18, 18, 0.2);
    ink(g, x, y, 18, 18, (bx, by) => {
      const W = M.walnut;
      ell(bx + 9, by - 9, 9, 9, W.base); ell(bx + 9, by - 10, 8.4, 8, W.l);
      ell(bx + 9, by - 9, 7.6, 7.6, W.dd); ell(bx + 9, by - 9, 7, 7, M.linen.base);
      ell(bx + 9, by - 10, 6, 5, '#fff');
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const c = i % 3 === 0 ? '#221a2c' : '#8a8496';
        px(bx + 9 + Math.round(Math.cos(a) * 5.6), by - 9 + Math.round(Math.sin(a) * 5.6), c);
        if (i % 3 === 0) px(bx + 9 + Math.round(Math.cos(a) * 4.8), by - 9 + Math.round(Math.sin(a) * 4.8), c);
      }
      const hour = (st && st.hour !== undefined) ? st.hour : CH.state.hour;
      const ha = (hour / 12) * Math.PI * 2 - Math.PI / 2, ma = (hour % 1) * Math.PI * 2 - Math.PI / 2;
      ln(bx + 9, by - 9, bx + 9 + Math.cos(ha) * 3.4, by - 9 + Math.sin(ha) * 3.4, '#221a2c');
      ln(bx + 9, by - 9, bx + 9 + Math.cos(ma) * 5.2, by - 9 + Math.sin(ma) * 5.2, '#221a2c');
      if (t !== undefined) { const sa = ((t % 60) / 60) * Math.PI * 2 - Math.PI / 2; ln(bx + 9, by - 9, bx + 9 + Math.cos(sa) * 5, by - 9 + Math.sin(sa) * 5, '#c8352b'); }
      px(bx + 9, by - 9, '#3a3a44');
      const gg = gfx.cur; gg.save(); gg.globalAlpha = 0.2; tri(bx + 4, by - 13, bx + 11, by - 13, bx + 4, by - 7, '#fff'); gg.restore();
      // pendulum nub
      rect(bx + 8, by - 1, 2, 1, W.dd);
    }, { l: 4, r: 4, t: 4, b: 3 });
  });

  def('moosePainting', 52, 40, (g, x, y) => {
    wallShadow(g, x, y - 40, 52, 40, 0.22, 3);
    ink(g, x, y, 52, 40, (bx, by) => {
      const F = M.brass, top = by - 40;
      // ornate frame
      rect(bx, top, 52, 40, F.base);
      hl(bx, top, 52, F.l); vl(bx, top, 40, F.l); vl(bx + 51, top, 40, F.dd); hl(bx, top + 39, 52, F.dd);
      fr(bx + 2, top + 2, 48, 36, shade(F.base, -40));
      for (let i = 0; i < 52; i += 4) { px(bx + i, top + 1, F.l); px(bx + i + 2, top + 1, F.d); }
      // canvas: sunset lake
      gfx.vgrad(bx + 4, top + 4, 44, 32, ['#f0b060', '#e08a58', '#c06a62', '#8a5578', '#4a4a72']);
      ell(bx + 34, top + 13, 5, 5, '#ffdc80'); ell(bx + 34, top + 13, 3.4, 3.4, '#fff4c0');
      // far shore
      for (let i = 0; i < 9; i++) tri(bx + 5 + i * 5, top + 22, bx + 11 + i * 5, top + 22, bx + 8 + i * 5, top + 15 - (i % 3) * 2, '#3a4a4a');
      rect(bx + 4, top + 22, 44, 14, '#2b4a46');
      for (let i = 0; i < 5; i++) hl(bx + 6 + (i % 2) * 6, top + 25 + i * 2, 16, '#3f6660');
      hl(bx + 30, top + 24, 10, '#c88a58'); hl(bx + 32, top + 26, 7, '#e0a060');
      // moose silhouette
      const K = '#171420';
      rect(bx + 16, top + 16, 14, 8, K); rect(bx + 27, top + 11, 5, 7, K); rect(bx + 31, top + 12, 6, 4, K);
      for (let i = 0; i < 4; i++) vl(bx + 18 + i * 3, top + 24, 6, K);
      ln(bx + 29, top + 10, bx + 25, top + 5, K); ln(bx + 30, top + 10, bx + 34, top + 5, K);
      hl(bx + 23, top + 5, 4, K); hl(bx + 33, top + 5, 4, K); px(bx + 24, top + 4, K); px(bx + 36, top + 4, K);
      rect(bx + 14, top + 18, 3, 4, K);
      // varnish glare
      const gg = gfx.cur; gg.save(); gg.globalAlpha = 0.12; tri(bx + 6, top + 34, bx + 22, top + 4, bx + 32, top + 4, '#fff'); gg.restore();
    }, { l: 5, r: 5, t: 5, b: 4 });
  });

  def('hockeyStick', 10, 64, (g, x, y) => {
    floorShadow(g, x, 14, y, 0.22);
    ink(g, x, y, 10, 64, (bx, by) => {
      const W = M.birch;
      for (let i = 0; i < 58; i++) {
        const xx = bx + 2 + Math.round(i * 0.09), yy = by - 64 + i;
        rect(xx, yy, 3, 1, W.base); px(xx, yy, W.l); px(xx + 2, yy, W.dd);
      }
      rect(bx, by - 7, 12, 4, W.base); hl(bx, by - 7, 12, W.l); hl(bx, by - 4, 12, W.dd);
      rect(bx, by - 4, 12, 2, '#22222c'); hl(bx, by - 4, 12, '#3a3a48');
      for (let i = 0; i < 6; i++) hl(bx + 2, by - 52 + i * 2, 4, i % 2 ? '#22222c' : '#3a3a48');
      px(bx + 3, by - 30, '#c8352b');
    }, { l: 5, r: 6, t: 5, b: 3 });
  });

  def('snowshoes', 20, 38, (g, x, y) => {
    floorShadow(g, x, 20, y, 0.24);
    ink(g, x, y, 20, 38, (bx, by) => {
      for (let i = 0; i < 2; i++) {
        const cx = bx + 5 + i * 9, cy = by - 22 - i;
        ell(cx, cy, 4.4, 15, M.birch.d);
        ell(cx, cy, 3.4, 14, mix(M.birch.base, '#c9a97a', 0.5));
        ell(cx, cy, 2.6, 13, '#d8c49a');
        for (let k = 0; k < 6; k++) hl(cx - 3, cy - 12 + k * 5, 6, M.birch.dd);
        for (let k = 0; k < 3; k++) vl(cx - 2 + k * 2, cy - 12, 24, M.birch.d);
        ell(cx, cy, 4.4, 15, 'rgba(0,0,0,0)');
        rect(cx - 3, cy - 2, 7, 3, M.leather.base); hl(cx - 3, cy - 2, 7, M.leather.l);
        ell(cx, cy - 14, 3, 1.6, M.birch.l);
      }
    }, { l: 5, r: 5, t: 5, b: 3 });
  });

  def('flag', 36, 20, (g, x, y) => {
    wallShadow(g, x, y - 20, 36, 20, 0.16);
    ink(g, x, y, 36, 20, (bx, by) => {
      const top = by - 20;
      rect(bx, top, 36, 20, '#f4f1ea');
      rect(bx, top, 9, 20, '#c8352b'); rect(bx + 27, top, 9, 20, '#c8352b');
      // maple leaf
      rect(bx + 16, top + 5, 4, 9, '#c8352b'); rect(bx + 13, top + 7, 10, 4, '#c8352b');
      tri(bx + 14, top + 7, bx + 22, top + 7, bx + 18, top + 2, '#c8352b');
      tri(bx + 12, top + 11, bx + 17, top + 9, bx + 13, top + 13, '#c8352b');
      tri(bx + 24, top + 11, bx + 19, top + 9, bx + 23, top + 13, '#c8352b');
      rect(bx + 17, top + 13, 2, 5, '#c8352b');
      // cloth ripple
      for (let i = 0; i < 20; i += 3) { px(bx + 2, top + i, shade('#c8352b', -20)); px(bx + 33, top + i, shade('#c8352b', -20)); }
      hl(bx, top, 36, '#fff'); hl(bx, top + 19, 36, '#b8b0a0');
      // pins
      px(bx + 1, top + 1, M.chrome.base); px(bx + 34, top + 1, M.chrome.base);
    }, { l: 4, r: 4, t: 4, b: 4 });
  });

  def('calendar', 18, 24, (g, x, y) => {
    wallShadow(g, x, y - 24, 18, 24, 0.18);
    ink(g, x, y, 18, 24, (bx, by) => {
      const top = by - 24;
      rect(bx, top, 18, 24, '#f8f5ee'); hl(bx, top, 18, '#fff'); vl(bx + 17, top, 24, '#cfc8bc');
      rect(bx, top, 18, 7, '#c8352b'); hl(bx, top, 18, '#e05a50'); hl(bx, top + 6, 18, '#8f2419');
      txt('FEB', bx + 9, top + 1, '#fff', { align: 'center', font: 'small' });
      for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) {
        const on = r === 2 && c === 3;
        px(bx + 3 + c * 2, top + 10 + r * 3, on ? '#c8352b' : '#8a8496');
        if (on) { px(bx + 2 + c * 2, top + 9 + r * 3, '#e05a50'); px(bx + 4 + c * 2, top + 11 + r * 3, '#e05a50'); }
      }
      rect(bx + 7, top - 2, 4, 2, M.chrome.d); px(bx + 8, top - 3, M.chrome.l);
      ao(bx, by - 3, 18, 3, '#160f1a', 0.12);
    }, { l: 4, r: 4, t: 5, b: 3 });
  });

  def('logs', 28, 16, (g, x, y) => {
    floorShadow(g, x, 28, y, 0.26);
    ink(g, x, y, 28, 16, (bx, by) => {
      const bark = '#5e3a24', barkL = '#7a4e30', barkD = '#3c2416';
      const rows = [[0, 4, 5], [1, 9, 4], [2, 14, 3]];
      for (const [ri, ry, n] of rows) {
        for (let i = 0; i < n; i++) {
          const cx = bx + 4 + i * 6 + ri * 3, cy = by - ry;
          ell(cx, cy, 3.4, 3.4, barkD);
          ell(cx, cy - 0.4, 3, 3, bark);
          ell(cx, cy - 0.6, 2.4, 2.4, '#d8b070');
          ell(cx, cy - 0.4, 1.8, 1.8, '#c09048');
          px(cx, cy - 1, '#e8cc98');
          px(cx - 1, cy + 1, '#a87838');
          px(cx + 2, cy - 2, barkL);
        }
      }
      px(bx + 1, by - 1, bark); px(bx + 25, by - 2, barkL); px(bx + 20, by - 1, barkD);
    }, { l: 5, r: 5, t: 5, b: 3 });
  });
  def('trashBin', 16, 22, (g, x, y, t, st) => {
    floorShadow(g, x, 16, y, 0.28);
    ink(g, x, y, 16, 22, (bx, by) => {
      const B = mat('#5a7a94');
      // tapered bin
      for (let i = 0; i < 19; i++) {
        const inset = Math.round((18 - i) * 0.09);
        rect(bx + inset, by - 19 + i, 16 - inset * 2, 1, B.base);
        px(bx + inset, by - 19 + i, mix(B.base, B.l, 0.6));
        px(bx + 15 - inset, by - 19 + i, B.dd);
      }
      for (let i = 0; i < 3; i++) hl(bx + 2, by - 15 + i * 5, 12, B.d);
      rect(bx - 1, by - 22, 18, 3, B.d); hl(bx - 1, by - 22, 18, B.l); hl(bx - 1, by - 20, 18, B.dd);
      ao(bx + 1, by - 2, 14, 2, '#160f1a', 0.2);
      if (st && st.full) {
        rect(bx + 2, by - 26, 5, 5, M.linen.base); hl(bx + 2, by - 26, 5, '#fff');
        rect(bx + 8, by - 28, 6, 6, M.card.base); hl(bx + 8, by - 28, 6, M.card.l);
        tri(bx + 4, by - 27, bx + 9, by - 29, bx + 6, by - 24, '#e8e2d2');
        px(bx + 13, by - 29, '#c8352b');
      }
    }, { l: 5, r: 5, t: 10, b: 3 });
  });

  def('laundry', 24, 16, (g, x, y) => {
    floorShadow(g, x, 24, y, 0.26);
    ink(g, x, y, 24, 16, (bx, by) => {
      const B = mat('#d8d0c0');
      rect(bx, by - 13, 24, 13, B.base); hl(bx, by - 13, 24, B.l); hl(bx, by - 1, 24, B.dd);
      for (let i = 0; i < 6; i++) vl(bx + 2 + i * 4, by - 12, 11, B.d);
      for (let i = 0; i < 3; i++) hl(bx + 1, by - 11 + i * 4, 22, B.d);
      rect(bx - 1, by - 14, 26, 2, B.d); hl(bx - 1, by - 14, 26, B.l);
      // clothes spilling out
      rect(bx + 2, by - 18, 8, 5, '#3b6fd6'); hl(bx + 2, by - 18, 8, '#6fa2ff'); tri(bx + 1, by - 14, bx + 6, by - 17, bx + 2, by - 12, '#2a4ea8');
      rect(bx + 11, by - 17, 9, 4, '#c85a5a'); hl(bx + 11, by - 17, 9, '#e07878');
      px(bx + 19, by - 19, '#2f8f7a'); px(bx + 20, by - 18, '#2f8f7a'); px(bx + 18, by - 18, '#3fa79a');
      rect(bx + 16, by - 20, 4, 3, '#f5c33b');
    }, { l: 5, r: 5, t: 8, b: 3 });
  });

  def('cereal', 16, 18, (g, x, y) => {
    ink(g, x, y, 16, 18, (bx, by) => {
      rect(bx, by - 18, 11, 18, '#f0b52a'); hl(bx, by - 18, 11, '#ffdc7a'); vl(bx, by - 18, 18, '#ffcf5a'); vl(bx + 10, by - 18, 18, '#c08810');
      rect(bx + 1, by - 13, 9, 8, '#c8352b'); hl(bx + 1, by - 13, 9, '#e05a50');
      ell(bx + 5, by - 9, 2.4, 2, '#8a5a3b'); px(bx + 4, by - 10, '#fff'); px(bx + 6, by - 10, '#fff');
      for (let i = 0; i < 4; i++) px(bx + 2 + i * 2, by - 15, '#7a4a10');
      txt('Q', bx + 5, by - 4, '#7a4a10', { align: 'center', font: 'small' });
      rect(bx + 11, by - 12, 5, 12, '#3b6fd6'); hl(bx + 11, by - 12, 5, '#6fa2ff'); vl(bx + 15, by - 12, 12, '#24478f');
      px(bx + 13, by - 8, '#fff');
    }, { l: 4, r: 4, t: 4, b: 3 });
  });

  def('pizzaBox', 24, 6, (g, x, y) => {
    ink(g, x, y, 24, 6, (bx, by) => {
      const C = M.card;
      rect(bx, by - 6, 24, 6, C.base); hl(bx, by - 6, 24, C.l); hl(bx, by - 1, 24, C.dd);
      vl(bx, by - 6, 6, mix(C.base, C.l, 0.5)); vl(bx + 23, by - 6, 6, C.d);
      ell(bx + 8, by - 6, 4, 1.2, C.d); px(bx + 6, by - 5, '#c8352b'); px(bx + 12, by - 4, '#c8352b');
      txt('PIZZA', bx + 12, by - 5, '#a8542a', { align: 'center', font: 'small' });
    }, { l: 4, r: 4, t: 4, b: 3 });
  });

  def('cans', 16, 11, (g, x, y) => {
    floorShadow(g, x, 16, y, 0.2);
    ink(g, x, y, 16, 11, (bx, by) => {
      const cans = [[0, 9, '#4f9d3a'], [5, 8, '#3b6fd6'], [10, 11, '#c8352b']];
      for (const [ox, h, c] of cans) {
        rect(bx + ox, by - h, 5, h, c);
        vl(bx + ox, by - h, h, shade(c, 40)); vl(bx + ox + 4, by - h, h, shade(c, -36));
        ell(bx + ox + 2, by - h, 2.4, 1, M.chrome.base); hl(bx + ox + 1, by - h - 1, 3, M.chrome.l);
        hl(bx + ox + 1, by - h + 3, 3, shade(c, 50));
        hl(bx + ox, by - 1, 5, shade(c, -46));
      }
      px(bx + 7, by - 12, M.chrome.d);
    }, { l: 4, r: 4, t: 5, b: 3 });
  });

  def('thermostat', 10, 10, (g, x, y) => {
    wallShadow(g, x, y - 10, 10, 10, 0.18);
    ink(g, x, y, 10, 10, (bx, by) => {
      rr(bx, by - 10, 10, 10, 2, M.linen.base); hl(bx + 1, by - 10, 8, '#fff'); hl(bx + 1, by - 1, 8, M.linen.dd);
      rect(bx + 2, by - 8, 6, 4, '#1a1a24'); hl(bx + 2, by - 8, 6, '#3a3a48');
      px(bx + 3, by - 7, '#6cf06c'); px(bx + 5, by - 7, '#6cf06c'); px(bx + 6, by - 6, '#6cf06c');
      px(bx + 4, by - 3, '#8a8496'); px(bx + 6, by - 3, '#8a8496');
    }, { l: 4, r: 4, t: 4, b: 3 });
  });

  def('radiator', 34, 24, (g, x, y) => {
    floorShadow(g, x, 34, y, 0.24);
    ink(g, x, y, 34, 24, (bx, by) => {
      const R = mat('#d2cabb');
      for (let i = 0; i < 8; i++) {
        const fx = bx + 1 + i * 4;
        rect(fx, by - 22, 3, 20, i % 2 ? R.base : R.d);
        vl(fx, by - 22, 20, R.l); vl(fx + 2, by - 22, 20, R.dd);
      }
      rect(bx, by - 24, 34, 2, R.base); hl(bx, by - 24, 34, R.l);
      rect(bx, by - 4, 34, 2, R.d); hl(bx, by - 4, 34, R.base);
      rect(bx + 2, by - 2, 4, 2, M.steel.dd); rect(bx + 28, by - 2, 4, 2, M.steel.dd);
      // valve + a drying sock
      ell(bx + 32, by - 8, 2.4, 2.4, M.brass.base); px(bx + 32, by - 9, M.brass.l);
      rect(bx + 6, by - 28, 6, 6, '#cfd6e0'); hl(bx + 6, by - 28, 6, '#eef2f8'); rect(bx + 6, by - 24, 8, 2, '#cfd6e0');
      dith(bx + 2, by - 6, 30, 3, '#8a7a6a', 0.2);
    }, { l: 5, r: 5, t: 8, b: 3 });
  });

  def('bills', 18, 8, (g, x, y) => {
    ink(g, x, y, 18, 8, (bx, by) => {
      for (let i = 0; i < 3; i++) {
        const o = i, w = 18 - i * 2;
        rect(bx + o, by - 2 - i * 2, w, 2, i % 2 ? '#f4f1ea' : '#fdfaf2');
        hl(bx + o, by - 2 - i * 2, w, '#fff'); hl(bx + o, by - 1 - i * 2, w, '#c8c0b0');
      }
      px(bx + 5, by - 5, '#c8352b'); px(bx + 7, by - 5, '#c8352b'); px(bx + 9, by - 5, '#c8352b');
      hl(bx + 4, by - 3, 6, '#8a8496'); hl(bx + 12, by - 3, 4, '#8a8496');
      rect(bx + 13, by - 7, 4, 3, '#f0d0d8'); px(bx + 14, by - 6, '#c8352b');
    }, { l: 4, r: 4, t: 4, b: 3 });
  });

  def('cobweb', 12, 12, (g, x, y) => {
    const gg = gfx.cur; gg.save(); gg.globalAlpha = 0.45;
    for (let i = 0; i < 5; i++) ln(x, y - 12, x + 12, y - 12 + i * 3, '#cfc8bc');
    for (let i = 1; i < 5; i++) ln(x + i * 2, y - 12 + i * 2, x + i * 3, y - 12, '#cfc8bc');
    gg.globalAlpha = 0.25;
    for (let i = 1; i < 4; i++) ln(x + i * 3, y - 12 + i * 3, x + i * 4, y - 12, '#e8e2d8');
    gg.restore();
  });

  const doorLeaf = (bx, by, w, h, sign, signCol) => {
    const W = M.oak, F = M.walnut;
    rect(bx - 3, by - h - 3, w + 6, h + 3, F.base);
    hl(bx - 3, by - h - 3, w + 6, F.l); vl(bx - 3, by - h - 3, h + 3, F.l); vl(bx + w + 2, by - h - 3, h + 3, F.dd);
    rect(bx, by - h, w, h, W.base); grain(bx + 1, by - h + 1, w - 2, h - 2, 151, W, 0.3);
    ao(bx, by - h, 3, h, '#160f1a', 0.22);
    rect(bx + 3, by - h + 5, w - 6, Math.round(h * 0.38), W.d);
    fr(bx + 3, by - h + 5, w - 6, Math.round(h * 0.38), W.dd); fr(bx + 4, by - h + 6, w - 8, Math.round(h * 0.38) - 2, W.l);
    rect(bx + 3, by - Math.round(h * 0.47), w - 6, Math.round(h * 0.36), W.d);
    fr(bx + 3, by - Math.round(h * 0.47), w - 6, Math.round(h * 0.36), W.dd); fr(bx + 4, by - Math.round(h * 0.47) + 1, w - 8, Math.round(h * 0.36) - 2, W.l);
    ell(bx + w - 5, by - Math.round(h * 0.5), 2.4, 2.4, M.brass.base); px(bx + w - 5, by - Math.round(h * 0.5) - 1, M.brass.l);
    for (const hy of [-Math.round(h * 0.86), -Math.round(h * 0.5), -Math.round(h * 0.14)]) { rect(bx, by + hy, 3, 5, M.chrome.d); hl(bx, by + hy, 3, M.chrome.l); }
    if (sign) {
      rect(bx + Math.round(w / 2) - 8, by - Math.round(h * 0.78), 16, 8, '#f8f5ee');
      fr(bx + Math.round(w / 2) - 8, by - Math.round(h * 0.78), 16, 8, M.chrome.d);
      txt(sign, bx + Math.round(w / 2), by - Math.round(h * 0.78) + 2, signCol || '#3a3a44', { align: 'center', font: 'small' });
    }
    rect(bx, by - 2, w, 2, F.dd);
  };

  def('bathroomDoor', 32, 70, (g, x, y, t, st) => {
    ink(g, x, y, 32, 70, (bx, by) => { doorLeaf(bx, by, 32, 70, (st && st.sign) || null); }, { l: 8, r: 8, t: 8, b: 4 });
  });

  def('momDoor', 32, 70, (g, x, y, t, st) => {
    ink(g, x, y, 32, 70, (bx, by) => {
      doorLeaf(bx, by, 32, 70, null);
      rect(bx + 7, by - 52, 18, 10, '#f4d6de'); fr(bx + 7, by - 52, 18, 10, '#d8a8b8');
      txt('MOM', bx + 16, by - 49, '#a04060', { align: 'center', font: 'small' });
      px(bx + 7, by - 53, '#c85a8a'); px(bx + 24, by - 53, '#c85a8a');
      ell(bx + 16, by - 56, 2.4, 1.6, '#e8a0b8'); px(bx + 16, by - 57, '#f0c0d0');
    }, { l: 8, r: 8, t: 8, b: 4 });
  });

  def('beanbag', 32, 20, (g, x, y) => {
    floorShadow(g, x, 32, y, 0.28);
    ink(g, x, y, 32, 20, (bx, by) => {
      const B = mat('#7b4fb0');
      ell(bx + 16, by - 6, 16, 6.5, B.d);
      ell(bx + 16, by - 9, 14.5, 7, B.base);
      ell(bx + 15, by - 12, 10, 5, mix(B.base, B.l, 0.6));
      ell(bx + 13, by - 13, 5, 2.4, B.l);
      for (let i = 0; i < 5; i++) px(bx + 6 + i * 5, by - 5 + (i % 2), B.dd);
      ln(bx + 4, by - 8, bx + 28, by - 8, B.d);
      // permanent dent
      ell(bx + 18, by - 13, 6, 2, B.d);
      px(bx + 2, by - 6, B.dd); px(bx + 29, by - 6, B.dd);
    }, { l: 5, r: 5, t: 6, b: 3 });
  });

  def('crumbs', 22, 3, (g, x, y) => {
    for (let i = 0; i < 9; i++) {
      const cx = x + ((i * 7 + (i % 3) * 3) % 22), cy = y - 1 - (i % 2);
      px(cx, cy, i % 3 ? '#e0c078' : '#b8904a');
      if (i % 4 === 0) px(cx + 1, cy, '#f0d898');
    }
    const gg = gfx.cur; gg.save(); gg.globalAlpha = 0.12; ell(x + 11, y, 12, 2, '#160f1a'); gg.restore();
  });

  // ---------------------------------------------------------------- HOSPITAL --
  def('hChairs', 76, 30, (g, x, y) => {
    floorShadow(g, x, 76, y, 0.26);
    ink(g, x, y, 76, 30, (bx, by) => {
      const S = M.scrub, F = M.chrome;
      // rail
      rect(bx + 2, by - 12, 72, 3, F.d); hl(bx + 2, by - 12, 72, F.l);
      for (const lx of [5, 66]) { rect(bx + lx, by - 10, 4, 10, F.d); vl(bx + lx, by - 10, 10, F.base); rect(bx + lx - 2, by - 2, 8, 2, F.dd); }
      for (let i = 0; i < 4; i++) {
        const cx = bx + 2 + i * 18;
        // back
        rr(cx, by - 30, 16, 12, 2, S.base);
        hl(cx + 1, by - 30, 14, S.l); hl(cx + 1, by - 19, 14, S.dd); vl(cx + 15, by - 28, 10, S.d);
        vl(cx + 1, by - 28, 9, mix(S.base, S.l, 0.5));
        // seat
        rr(cx, by - 17, 16, 6, 2, S.base);
        hl(cx + 1, by - 17, 14, S.l); hl(cx + 1, by - 12, 14, S.dd);
        // gap shadow under the seat
        ao(cx + 1, by - 11, 14, 2, '#101820', 0.3);
        px(cx + 8, by - 24, S.d);
      }
      ao(bx + 4, by - 2, 68, 2, '#101820', 0.22);
      // a forgotten magazine + a paper cup under the seats
      rect(bx + 38, by - 20, 10, 2, '#c85a5a'); hl(bx + 38, by - 20, 10, '#e07878'); px(bx + 41, by - 21, '#f5c33b');
      rect(bx + 24, by - 4, 4, 4, M.linen.base); hl(bx + 24, by - 4, 4, '#fff'); hl(bx + 24, by - 1, 4, M.linen.dd);
    }, { l: 5, r: 5, t: 6, b: 3 });
  });

  def('vending', 40, 78, (g, x, y, t, st) => {
    floorShadow(g, x, 40, y, 0.32);
    ink(g, x, y, 40, 78, (bx, by) => {
      const R = mat('#c8352b');
      rect(bx, by - 78, 40, 78, R.base);
      vl(bx, by - 78, 78, R.l); vl(bx + 1, by - 78, 78, mix(R.base, R.l, 0.5));
      vl(bx + 38, by - 78, 78, R.d); vl(bx + 39, by - 78, 78, R.dd);
      hl(bx, by - 78, 40, R.l); hl(bx, by - 1, 40, R.dd);
      // header
      rect(bx + 2, by - 76, 36, 8, '#8f2419'); hl(bx + 2, by - 76, 36, '#e05040');
      txt('SNAX', bx + 20, by - 74, '#ffe27a', { align: 'center', font: 'small' });
      // glass window
      rect(bx + 3, by - 66, 24, 50, '#141a26'); fr(bx + 3, by - 66, 24, 50, '#0c1018');
      const cols = ['#f5c33b', '#4f9d3a', '#3b6fd6', '#e8752c', '#f0a0b0', '#8a8a94'];
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 3; c++) {
          if (r === 1 && c === 2) continue;
          const ix = bx + 5 + c * 7, iy = by - 63 + r * 10;
          rect(ix, iy, 5, 7, cols[(r * 3 + c) % 6]);
          hl(ix, iy, 5, shade(cols[(r * 3 + c) % 6], 34));
          px(ix + 1, iy + 2, '#fff'); px(ix + 3, iy + 4, shade(cols[(r * 3 + c) % 6], -30));
        }
        // coil shelf
        hl(bx + 4, by - 55 + r * 10, 22, '#3a4a5a');
        for (let i = 0; i < 11; i++) px(bx + 4 + i * 2, by - 56 + r * 10, '#54647a');
      }
      // one item stuck, mid-fall
      rect(bx + 19, by - 34, 5, 7, '#e8752c'); hl(bx + 19, by - 34, 5, '#ffa060');
      // glass sheen + flicker
      const gg = gfx.cur; gg.save();
      gg.globalAlpha = 0.14 + (Math.sin(t * 30) > 0.9 ? 0.12 : 0);
      tri(bx + 5, by - 18, bx + 18, by - 64, bx + 25, by - 64, '#fff');
      gg.restore();
      // keypad, coin slot, return
      rect(bx + 29, by - 66, 9, 16, '#2a2a34'); fr(bx + 29, by - 66, 9, 16, '#14141c');
      for (let i = 0; i < 8; i++) { px(bx + 31 + (i % 2) * 4, by - 63 + Math.floor(i / 2) * 4, '#8fef8f'); px(bx + 32 + (i % 2) * 4, by - 63 + Math.floor(i / 2) * 4, '#4faf4f'); }
      rect(bx + 30, by - 46, 7, 2, '#10101a'); hl(bx + 30, by - 47, 7, M.chrome.d);
      rect(bx + 30, by - 40, 7, 3, '#3a3a44'); hl(bx + 30, by - 40, 7, M.chrome.d);
      // collection flap
      rect(bx + 3, by - 14, 34, 10, '#1a1a24'); hl(bx + 3, by - 14, 34, '#3a3a48'); hl(bx + 3, by - 5, 34, '#0c0c14');
      rect(bx + 8, by - 12, 24, 6, '#0c0c14');
      // scuffs + a stuck sticker
      dith(bx + 2, by - 20, 36, 6, '#6a2018', 0.35);
      rect(bx + 30, by - 30, 6, 5, '#f8f5ee'); px(bx + 32, by - 28, '#c8352b');
      ao(bx + 2, by - 3, 36, 3, '#101820', 0.25);
    }, { l: 5, r: 5, t: 5, b: 4 });
  });

  def('hSign', 44, 14, (g, x, y, t, st) => {
    ink(g, x, y, 44, 14, (bx, by) => {
      const B = mat('#1b3a6a');
      rr(bx, by - 14, 44, 14, 2, B.base);
      hl(bx + 1, by - 14, 42, '#5f8fe8'); hl(bx + 1, by - 1, 42, B.dd);
      vl(bx, by - 12, 10, mix(B.base, B.l, 0.5)); vl(bx + 43, by - 12, 10, B.dd);
      txt((st && st.text) || 'ICU', bx + 22, by - 10, '#eaf2ff', { align: 'center', font: 'small' });
      // ceiling hangers
      px(bx + 8, by - 15, M.chrome.base); px(bx + 8, by - 16, M.chrome.d);
      px(bx + 35, by - 15, M.chrome.base); px(bx + 35, by - 16, M.chrome.d);
    }, { l: 4, r: 4, t: 6, b: 3 });
  });

  def('hDoor', 42, 70, (g, x, y, t, st) => {
    ink(g, x, y, 42, 70, (bx, by) => {
      const E = M.clinical, F = M.steel;
      rect(bx - 3, by - 73, 48, 73, F.base); hl(bx - 3, by - 73, 48, F.l); vl(bx + 44, by - 73, 73, F.dd);
      rect(bx, by - 70, 42, 70, E.base);
      vl(bx, by - 70, 70, E.l); vl(bx + 41, by - 70, 70, E.dd); hl(bx, by - 70, 42, E.l);
      vl(bx + 20, by - 70, 70, E.d); vl(bx + 21, by - 70, 70, E.l);
      // vision panel
      rect(bx + 7, by - 64, 28, 26, '#16202c');
      if (st && st.inside) st.inside(gfx.cur, bx + 8, by - 63, 26, 24, t);
      else { const gg = gfx.cur; gg.save(); gg.globalAlpha = 0.35; rect(bx + 8, by - 63, 26, 24, '#8a9ab8'); gg.restore(); }
      fr(bx + 7, by - 64, 28, 26, F.d); fr(bx + 6, by - 65, 30, 28, F.base);
      const gg2 = gfx.cur; gg2.save(); gg2.globalAlpha = 0.16;
      tri(bx + 9, by - 40, bx + 22, by - 63, bx + 30, by - 63, '#fff'); gg2.restore();
      // push bars + kick plates
      rect(bx + 2, by - 32, 38, 3, F.base); hl(bx + 2, by - 32, 38, F.l); hl(bx + 2, by - 30, 38, F.dd);
      rect(bx + 4, by - 29, 3, 4, F.d); rect(bx + 35, by - 29, 3, 4, F.d);
      rect(bx + 2, by - 14, 38, 12, F.d); hl(bx + 2, by - 14, 38, F.base);
      dith(bx + 3, by - 12, 36, 9, '#6a7482', 0.3);
      if (st && st.label) {
        rect(bx + 12, by - 26, 18, 9, '#f8f5ee'); fr(bx + 12, by - 26, 18, 9, F.d);
        txt(st.label, bx + 21, by - 24, '#2a3a4a', { align: 'center', font: 'small' });
      }
      ao(bx, by - 70, 2, 70, '#101820', 0.2);
    }, { l: 8, r: 8, t: 6, b: 4 });
  });

  def('fluor', 48, 5, (g, x, y, t, st) => {
    const on = !st || st.on !== false;
    const flick = st && st.flicker && Math.sin(t * 37 + x) > 0.92;
    const lit = on && !flick;
    ink(g, x, y, 48, 5, (bx, by) => {
      const H = M.clinical;
      rect(bx, by - 5, 48, 5, H.d); hl(bx, by - 5, 48, H.l);
      rect(bx + 2, by - 4, 44, 3, lit ? '#f8fbff' : '#8a8f98');
      if (lit) { hl(bx + 2, by - 4, 44, '#fff'); hl(bx + 3, by - 2, 42, '#d8ecff'); }
      else dith(bx + 2, by - 4, 44, 3, '#5a5f68', 0.5);
      px(bx + 1, by - 3, H.dd); px(bx + 46, by - 3, H.dd);
      // ceiling stems
      px(bx + 8, by - 6, H.dd); px(bx + 39, by - 6, H.dd);
    }, { l: 4, r: 4, t: 4, b: 3 });
    if (lit) {
      g.save(); g.globalAlpha = 0.07;
      tri(x - 26, y + 72, x + 74, y + 72, x + 24, y, '#f4f8ff');
      g.globalAlpha = 0.05;
      tri(x - 44, y + 110, x + 92, y + 110, x + 24, y, '#eaf2ff');
      g.restore();
    }
  });

  def('nurseDesk', 80, 40, (g, x, y, t, st) => {
    floorShadow(g, x, 80, y, 0.3);
    ink(g, x, y, 80, 40, (bx, by) => {
      const D = mat('#3f5f8f'), E = M.clinical;
      rect(bx, by - 36, 80, 36, D.base);
      vl(bx, by - 36, 36, D.l); vl(bx + 79, by - 36, 36, D.dd); hl(bx, by - 1, 80, D.dd);
      rect(bx + 3, by - 30, 74, 16, D.d); fr(bx + 3, by - 30, 74, 16, D.dd); hl(bx + 3, by - 30, 74, mix(D.base, D.l, 0.4));
      for (let i = 0; i < 3; i++) vl(bx + 22 + i * 18, by - 30, 16, D.dd);
      rect(bx + 3, by - 12, 74, 9, D.d); hl(bx + 3, by - 12, 74, D.base);
      ao(bx + 2, by - 4, 76, 4, '#101820', 0.26);
      // worktop + transaction shelf
      surf(bx - 2, by - 40, 84, 4, E);
      ao(bx - 1, by - 36, 82, 2, '#101820', 0.2);
      // monitor
      rect(bx + 10, by - 40, 5, 4, M.steel.d);
      rect(bx + 5, by - 58, 20, 15, M.plastic.base); hl(bx + 5, by - 58, 20, M.plastic.l);
      rect(bx + 6, by - 57, 18, 12, '#1a3a5a'); rect(bx + 7, by - 56, 16, 10, '#3f7fc0');
      for (let i = 0; i < 4; i++) hl(bx + 8, by - 55 + i * 2, 5 + i * 3, '#bfe0ff');
      px(bx + 22, by - 47, '#8fef8f');
      // keyboard, papers, phone, a plant, a coffee
      rect(bx + 6, by - 42, 16, 2, E.d); for (let i = 0; i < 7; i++) px(bx + 7 + i * 2, by - 42, E.l);
      rect(bx + 30, by - 42, 13, 2, '#fdfaf2'); rect(bx + 31, by - 43, 11, 1, '#f0ece2'); px(bx + 34, by - 43, '#c8352b');
      rect(bx + 48, by - 45, 10, 5, M.plastic.base); hl(bx + 48, by - 45, 10, M.plastic.l);
      rect(bx + 48, by - 43, 10, 3, M.plastic.d); rect(bx + 50, by - 47, 6, 2, M.plastic.base);
      for (let i = 0; i < 3; i++) px(bx + 60 + i, by - 44 - i, M.plastic.d);
      rect(bx + 66, by - 44, 5, 4, '#c86a3a'); hl(bx + 66, by - 44, 5, '#e08a4a');
      ell(bx + 68, by - 46, 4, 2.4, '#4f9d3a'); ell(bx + 67, by - 47, 2, 1.2, '#8bd06a');
      mug(bx + 74, by - 40, '#f4f1ea');
      // a sticky note on the front
      rect(bx + 40, by - 26, 8, 7, '#f5e06a'); px(bx + 42, by - 24, '#5a5030'); px(bx + 44, by - 24, '#5a5030'); hl(bx + 41, by - 22, 5, '#5a5030');
    }, { l: 6, r: 6, t: 22, b: 4 });
  });

  def('ivStand', 12, 62, (g, x, y, t, st) => {
    floorShadow(g, x, 12, y, 0.22);
    ink(g, x, y, 12, 62, (bx, by) => {
      const C = M.chrome;
      rect(bx + 5, by - 58, 3, 56, C.base); vl(bx + 5, by - 58, 56, C.l); vl(bx + 7, by - 58, 56, C.dd);
      rect(bx + 2, by - 62, 9, 3, C.base); hl(bx + 2, by - 62, 9, C.l);
      px(bx + 2, by - 59, C.d); px(bx + 10, by - 59, C.d);
      // base + castors
      rect(bx + 1, by - 3, 11, 2, C.d); hl(bx + 1, by - 3, 11, C.base);
      ell(bx + 2, by - 1, 1.6, 1, M.plastic.base); ell(bx + 10, by - 1, 1.6, 1, M.plastic.base);
      // bag
      rr(bx + 1, by - 58, 8, 16, 2, 'rgba(198,230,250,0.85)');
      fr(bx + 1, by - 58, 8, 16, '#b8cfe0'); hl(bx + 2, by - 57, 6, '#eaf7ff');
      rect(bx + 2, by - 50, 6, 7, '#9fdcff'); hl(bx + 2, by - 50, 6, '#cdeaff');
      for (let i = 0; i < 3; i++) hl(bx + 2, by - 55 + i * 2, 3, '#7fb8d8');
      // drip chamber + line
      rect(bx + 4, by - 42, 3, 5, 'rgba(210,240,255,0.8)'); fr(bx + 4, by - 42, 3, 5, '#a8c8dc');
      if (t !== undefined) { const k = (t * 0.8) % 1; px(bx + 5, by - 40 + Math.floor(k * 4), '#9fdcff'); }
      ln(bx + 5, by - 37, bx + 2, by - 26, '#cdeaff'); ln(bx + 2, by - 26, bx - 6, by - 16, '#cdeaff');
      ln(bx + 5, by - 37, bx + 3, by - 26, '#a8c8dc');
    }, { l: 10, r: 6, t: 6, b: 3 });
  });

  def('monitor', 28, 50, (g, x, y, t, st) => {
    floorShadow(g, x, 24, y, 0.22);
    ink(g, x, y, 28, 50, (bx, by) => {
      const C = M.steel;
      rect(bx + 12, by - 36, 4, 36, C.base); vl(bx + 12, by - 36, 36, C.l); vl(bx + 15, by - 36, 36, C.dd);
      rect(bx + 3, by - 3, 22, 3, C.d); hl(bx + 3, by - 3, 22, C.base);
      ell(bx + 5, by - 1, 1.6, 1, M.plastic.base); ell(bx + 23, by - 1, 1.6, 1, M.plastic.base);
      rect(bx, by - 50, 28, 20, M.plastic.base); hl(bx, by - 50, 28, M.plastic.l);
      vl(bx, by - 50, 20, mix(M.plastic.base, M.plastic.l, 0.5)); vl(bx + 27, by - 50, 20, M.plastic.dd);
      rect(bx + 2, by - 48, 24, 15, '#08140e'); fr(bx + 2, by - 48, 24, 15, '#04100a');
      // grid
      for (let i = 0; i < 24; i += 4) vl(bx + 2 + i, by - 48, 15, '#0f2418');
      for (let i = 0; i < 15; i += 4) hl(bx + 2, by - 48 + i, 24, '#0f2418');
      const flat = st && st.flat;
      for (let i = 0; i < 23; i++) {
        const ph = (t * 1.4 + i * 0.045) % 1;
        let v = 0;
        if (!flat) {
          if (ph > 0.1 && ph < 0.14) v = -2;
          else if (ph > 0.14 && ph < 0.18) v = 6;
          else if (ph > 0.18 && ph < 0.22) v = -3;
          else if (ph > 0.3 && ph < 0.4) v = 1.8 * Math.sin((ph - 0.3) * 30);
        }
        px(bx + 3 + i, by - 40 - Math.round(v), i > 19 ? '#c8ffc8' : '#5cf05c');
        if (Math.abs(v) > 2) px(bx + 3 + i, by - 39 - Math.round(v), '#2a8a2a');
      }
      txt(flat ? '--' : String(58 + Math.round(Math.sin(t) * 2)), bx + 24, by - 47, '#ff6a6a', { align: 'right', font: 'small' });
      txt('98', bx + 24, by - 38, '#8fdcff', { align: 'right', font: 'small' });
      const gg = gfx.cur; gg.save(); gg.globalAlpha = 0.12; tri(bx + 3, by - 34, bx + 12, by - 47, bx + 18, by - 47, '#fff'); gg.restore();
      px(bx + 3, by - 31, '#6cf06c');
      // cable to the patient
      ln(bx + 4, by - 30, bx - 4, by - 18, '#4a5a6a');
    }, { l: 8, r: 6, t: 6, b: 3 });
  });

  def('hBed', 92, 40, (g, x, y, t, st) => {
    floorShadow(g, x + 2, 88, y, 0.3);
    ink(g, x, y, 92, 40, (bx, by) => {
      const C = M.chrome, E = M.clinical, S = mat('#8fb8d8');
      // head + foot rails
      rect(bx + 2, by - 34, 4, 32, C.base); vl(bx + 2, by - 34, 32, C.l); vl(bx + 5, by - 34, 32, C.dd);
      rect(bx + 86, by - 28, 4, 26, C.base); vl(bx + 86, by - 28, 26, C.l); vl(bx + 89, by - 28, 26, C.dd);
      rect(bx - 1, by - 38, 12, 14, E.base); hl(bx - 1, by - 38, 12, E.l); fr(bx + 1, by - 36, 8, 10, E.d);
      rect(bx + 82, by - 34, 12, 10, E.base); hl(bx + 82, by - 34, 12, E.l); fr(bx + 84, by - 32, 8, 6, E.d);
      // under-frame + castors
      rect(bx + 6, by - 20, 80, 5, C.d); hl(bx + 6, by - 20, 80, C.base);
      rect(bx + 10, by - 15, 4, 12, C.d); rect(bx + 78, by - 15, 4, 12, C.d);
      ell(bx + 12, by - 2, 3, 2, M.plastic.base); ell(bx + 80, by - 2, 3, 2, M.plastic.base);
      ao(bx + 8, by - 15, 76, 6, '#101820', 0.24);
      // mattress + sheet (surface stays near y-24 so Mom lies on it)
      rect(bx + 6, by - 26, 80, 7, M.linen.base); hl(bx + 6, by - 26, 80, '#fff'); hl(bx + 6, by - 20, 80, M.linen.dd);
      // side rails
      for (const rx of [20, 56]) {
        rect(bx + rx, by - 34, 2, 10, C.base); rect(bx + rx + 22, by - 34, 2, 10, C.base);
        rect(bx + rx, by - 34, 24, 2, C.base); hl(bx + rx, by - 34, 24, C.l);
        for (let i = 0; i < 4; i++) vl(bx + rx + 4 + i * 5, by - 32, 8, C.d);
      }
      // blanket
      rect(bx + 26, by - 29, 58, 9, S.base); hl(bx + 26, by - 29, 58, S.l);
      for (let i = 0; i < 6; i++) hl(bx + 28 + i * 9, by - 26, 7, S.d);
      hl(bx + 26, by - 21, 58, S.dd);
      rect(bx + 26, by - 30, 58, 2, M.linen.base); hl(bx + 26, by - 30, 58, '#fff');
      // pillow
      rr(bx + 10, by - 32, 18, 7, 2, M.linen.base); hl(bx + 11, by - 32, 16, '#fff'); hl(bx + 11, by - 26, 16, M.linen.d);
      // chart on the footboard
      rect(bx + 86, by - 24, 7, 9, '#fdfaf2'); fr(bx + 86, by - 24, 7, 9, C.d);
      hl(bx + 87, by - 22, 5, '#8a8496'); hl(bx + 87, by - 20, 5, '#8a8496'); px(bx + 87, by - 18, '#c8352b');
      // call button on a cord
      ln(bx + 8, by - 24, bx + 4, by - 14, '#c8ccd4'); rect(bx + 2, by - 14, 4, 3, '#e8352b');
    }, { l: 6, r: 6, t: 8, b: 4 });
  });

  def('wheelchair', 26, 30, (g, x, y) => {
    floorShadow(g, x, 26, y, 0.24);
    ink(g, x, y, 26, 30, (bx, by) => {
      const C = M.chrome, S = M.scrub;
      // big wheel
      ell(bx + 8, by - 8, 8, 8, M.plastic.base); ell(bx + 8, by - 8, 6.6, 6.6, M.plastic.dd);
      ell(bx + 8, by - 8, 5.6, 5.6, '#6a7280'); ell(bx + 8, by - 8, 4.6, 4.6, M.plastic.dd);
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; ln(bx + 8, by - 8, bx + 8 + Math.cos(a) * 4.4, by - 8 + Math.sin(a) * 4.4, C.d); }
      ell(bx + 8, by - 8, 1.6, 1.6, C.base);
      // small wheel
      ell(bx + 21, by - 4, 3.4, 3.4, M.plastic.base); ell(bx + 21, by - 4, 1.6, 1.6, C.d);
      rect(bx + 20, by - 10, 3, 6, C.base);
      // seat + back
      rect(bx + 5, by - 26, 4, 15, C.base); vl(bx + 5, by - 26, 15, C.l);
      rr(bx + 6, by - 26, 5, 14, 1, S.base); hl(bx + 7, by - 26, 3, S.l);
      rect(bx + 6, by - 13, 16, 4, S.base); hl(bx + 6, by - 13, 16, S.l); hl(bx + 6, by - 10, 16, S.dd);
      rect(bx + 6, by - 28, 8, 2, C.d); hl(bx + 6, by - 28, 8, C.l);
      // armrest + footplate
      rect(bx + 10, by - 18, 11, 2, C.base); rect(bx + 20, by - 18, 2, 6, C.d);
      rect(bx + 21, by - 9, 5, 2, C.base); hl(bx + 21, by - 9, 5, C.l);
    }, { l: 5, r: 5, t: 6, b: 3 });
  });

  def('gurney', 64, 34, (g, x, y) => {
    floorShadow(g, x + 2, 60, y, 0.28);
    ink(g, x, y, 64, 34, (bx, by) => {
      const C = M.chrome, L = M.linen;
      rect(bx + 4, by - 24, 56, 5, C.base); hl(bx + 4, by - 24, 56, C.l); hl(bx + 4, by - 20, 56, C.dd);
      rect(bx + 6, by - 28, 52, 5, L.base); hl(bx + 6, by - 28, 52, '#fff'); hl(bx + 6, by - 24, 52, L.dd);
      for (let i = 0; i < 5; i++) hl(bx + 9 + i * 10, by - 26, 6, L.d);
      // crumpled sheet at the head
      rr(bx + 8, by - 31, 14, 4, 1, L.base); hl(bx + 9, by - 31, 12, '#fff');
      // frame + castors
      rect(bx + 9, by - 19, 4, 16, C.d); rect(bx + 51, by - 19, 4, 16, C.d);
      vl(bx + 9, by - 19, 16, C.base); vl(bx + 51, by - 19, 16, C.base);
      rect(bx + 10, by - 11, 44, 2, C.d);
      ell(bx + 11, by - 2, 3, 2.4, M.plastic.base); ell(bx + 53, by - 2, 3, 2.4, M.plastic.base);
      px(bx + 11, by - 3, C.l); px(bx + 53, by - 3, C.l);
      // side rail, dropped
      rect(bx + 20, by - 21, 24, 2, C.base); hl(bx + 20, by - 21, 24, C.l);
      for (let i = 0; i < 4; i++) vl(bx + 23 + i * 6, by - 21, 5, C.d);
      ao(bx + 8, by - 19, 48, 5, '#101820', 0.2);
    }, { l: 6, r: 6, t: 8, b: 3 });
  });

  def('extinguisher', 10, 24, (g, x, y) => {
    wallShadow(g, x + 1, y - 22, 8, 22, 0.2);
    ink(g, x, y, 10, 24, (bx, by) => {
      const R = mat('#c8352b');
      rr(bx + 2, by - 20, 7, 20, 2, R.base);
      vl(bx + 2, by - 18, 16, mix(R.base, R.l, 0.6)); vl(bx + 8, by - 18, 16, R.dd);
      hl(bx + 3, by - 20, 5, R.l);
      rect(bx + 4, by - 23, 3, 3, M.plastic.base); hl(bx + 4, by - 23, 3, M.plastic.l);
      px(bx + 2, by - 22, M.plastic.dd); rect(bx + 1, by - 23, 2, 1, M.plastic.base);
      ln(bx + 1, by - 22, bx, by - 16, '#1a1a24');
      rect(bx, by - 15, 10, 2, M.steel.base); hl(bx, by - 15, 10, M.steel.l);
      rect(bx + 3, by - 13, 5, 6, '#f8f5ee'); px(bx + 5, by - 11, '#c8352b'); hl(bx + 4, by - 9, 3, '#8a8496');
    }, { l: 4, r: 4, t: 5, b: 3 });
  });

  def('sanitizer', 10, 18, (g, x, y) => {
    wallShadow(g, x, y - 18, 10, 18, 0.18);
    ink(g, x, y, 10, 18, (bx, by) => {
      const E = M.clinical;
      rect(bx, by - 18, 10, 13, E.base); hl(bx, by - 18, 10, E.l); vl(bx, by - 18, 13, E.l); vl(bx + 9, by - 18, 13, E.dd);
      rect(bx + 2, by - 16, 6, 8, 'rgba(160,215,245,0.8)'); hl(bx + 2, by - 16, 6, '#dff2ff');
      rect(bx + 2, by - 11, 6, 3, '#9fdcff');
      rect(bx + 3, by - 5, 4, 3, E.d); hl(bx + 3, by - 5, 4, E.base);
      rect(bx + 4, by - 2, 2, 2, M.plastic.base);
      px(bx + 5, by - 20, '#8fdcff');
    }, { l: 4, r: 4, t: 5, b: 3 });
  });

  def('hPoster', 20, 30, (g, x, y, t, st) => {
    wallShadow(g, x, y - 30, 20, 30, 0.16);
    ink(g, x, y, 20, 30, (bx, by) => {
      const top = by - 30, v = (st && st.variant) || 0;
      rect(bx, top, 20, 30, '#fdfaf2'); hl(bx, top, 20, '#fff'); hl(bx, top + 29, 20, '#c8c0b0');
      fr(bx, top, 20, 30, M.steel.d);
      if (v === 0) {
        ell(bx + 10, top + 10, 6, 6, '#f0a0b0'); ell(bx + 10, top + 10, 4, 4, '#c8352b');
        for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; px(bx + 10 + Math.round(Math.cos(a) * 7), top + 10 + Math.round(Math.sin(a) * 7), '#9fdcff'); }
        txt('WASH', bx + 10, top + 18, '#2a3a4a', { align: 'center', font: 'small' });
        txt('PAWS', bx + 10, top + 24, '#2a3a4a', { align: 'center', font: 'small' });
      } else {
        rect(bx + 2, top + 3, 16, 13, '#4f9d3a'); hl(bx + 2, top + 3, 16, '#8bd06a');
        ell(bx + 7, top + 10, 3.4, 3.4, '#c8352b'); ell(bx + 13, top + 11, 2.6, 2.6, '#e8752c'); ell(bx + 10, top + 7, 2.6, 1.8, '#f5c33b');
        txt('EAT', bx + 10, top + 18, '#2a3a4a', { align: 'center', font: 'small' });
        txt('VEG', bx + 10, top + 24, '#2a3a4a', { align: 'center', font: 'small' });
      }
      // curling bottom corner
      tri(bx + 15, top + 29, bx + 20, top + 29, bx + 20, top + 24, '#d8d2c6');
    }, { l: 4, r: 4, t: 4, b: 4 });
  });

  def('waterFountain', 18, 34, (g, x, y) => {
    floorShadow(g, x, 18, y, 0.22);
    ink(g, x, y, 18, 34, (bx, by) => {
      const C = M.chrome;
      rect(bx + 3, by - 22, 12, 22, C.d); vl(bx + 3, by - 22, 22, C.base);
      rect(bx, by - 30, 18, 9, C.base); hl(bx, by - 30, 18, C.l); vl(bx + 17, by - 30, 9, C.dd);
      rect(bx + 2, by - 28, 14, 5, C.d); dith(bx + 3, by - 27, 12, 3, '#8fb8d8', 0.35);
      rect(bx + 7, by - 34, 3, 5, C.base); rect(bx + 7, by - 34, 5, 2, C.base); hl(bx + 7, by - 34, 5, C.l);
      px(bx + 12, by - 32, '#9fdcff'); px(bx + 12, by - 31, '#cdeaff');
      rect(bx + 13, by - 26, 3, 2, C.l);
      ao(bx + 4, by - 2, 10, 2, '#101820', 0.2);
      // a drip and limescale
      px(bx + 9, by - 23, '#9fdcff'); dith(bx + 5, by - 24, 8, 2, '#c8d8e0', 0.4);
    }, { l: 5, r: 5, t: 6, b: 3 });
  });

  def('elevator', 56, 78, (g, x, y, t, st) => {
    ink(g, x, y, 56, 78, (bx, by) => {
      const S = M.steel, C = M.chrome;
      rect(bx - 4, by - 82, 64, 82, S.base); hl(bx - 4, by - 82, 64, S.l); vl(bx + 59, by - 82, 82, S.dd);
      rect(bx, by - 78, 56, 78, C.base);
      // brushed steel doors
      for (let i = 0; i < 56; i += 2) vl(bx + i, by - 78, 78, i % 4 ? mix(C.base, C.l, 0.4) : C.d);
      vl(bx + 27, by - 78, 78, C.dd); vl(bx + 28, by - 78, 78, C.l);
      hl(bx, by - 78, 56, C.l); hl(bx, by - 1, 56, C.dd);
      const gg = gfx.cur; gg.save(); gg.globalAlpha = 0.14;
      tri(bx + 4, by - 10, bx + 24, by - 74, bx + 36, by - 74, '#fff'); gg.restore();
      // floor indicator
      rect(bx + 18, by - 88, 20, 8, M.plastic.base); hl(bx + 18, by - 88, 20, M.plastic.l);
      rect(bx + 20, by - 86, 16, 5, '#14141c');
      txt(String((st && st.floor) || '4'), bx + 28, by - 86, '#ff6a4a', { align: 'center', font: 'small' });
      for (let i = 0; i < 3; i++) px(bx + 21 + i, by - 84, '#7a2a1a');
      // call panel
      rect(bx + 58, by - 48, 6, 12, M.plastic.base); hl(bx + 58, by - 48, 6, M.plastic.l);
      px(bx + 60, by - 45, '#ff9a4a'); px(bx + 61, by - 45, '#ff9a4a');
      px(bx + 60, by - 41, '#8fef8f'); px(bx + 61, by - 41, '#8fef8f');
      // threshold
      rect(bx, by - 2, 56, 2, S.d); hl(bx, by - 2, 56, S.l);
      dith(bx + 2, by - 6, 52, 4, '#6a7482', 0.25);
    }, { l: 8, r: 10, t: 12, b: 3 });
  });

  def('hTV', 38, 28, (g, x, y, t) => {
    wallShadow(g, x, y - 28, 38, 26, 0.2, 3);
    ink(g, x, y, 38, 28, (bx, by) => {
      const C = M.plastic;
      // wall bracket
      rect(bx + 15, by - 4, 8, 4, M.steel.d); rect(bx + 13, by - 2, 12, 2, M.steel.base);
      rect(bx, by - 28, 38, 24, C.base); hl(bx, by - 28, 38, C.l);
      vl(bx, by - 28, 24, mix(C.base, C.l, 0.5)); vl(bx + 37, by - 28, 24, C.dd);
      rect(bx + 2, by - 26, 34, 19, '#0d1420');
      // muted news picture
      rect(bx + 3, by - 25, 32, 17, '#3a5a8a');
      rect(bx + 3, by - 25, 32, 9, '#5f86bc');
      ell(bx + 12, by - 14, 4, 5, '#8a5a3b'); ell(bx + 12, by - 18, 3, 3, '#a87a52');
      rect(bx + 22, by - 20, 11, 7, '#2a4a6a'); hl(bx + 23, by - 19, 9, '#6a9ad0');
      rect(bx + 3, by - 12, 32, 4, '#c8352b'); hl(bx + 3, by - 12, 32, '#e05040');
      for (let i = 0; i < 3; i++) hl(bx + 5, by - 11 + i, 12 + i * 5, '#fff');
      const gg = gfx.cur; gg.save(); gg.globalAlpha = 0.1;
      for (let j = 0; j < 17; j += 2) hl(bx + 3, by - 25 + j, 32, '#000');
      gg.restore();
      gg.save(); gg.globalAlpha = 0.12; tri(bx + 4, by - 9, bx + 14, by - 24, bx + 22, by - 24, '#fff'); gg.restore();
      px(bx + 34, by - 6, '#6cf06c');
    }, { l: 5, r: 5, t: 5, b: 3 });
  });

  def('hClock', 16, 16, (g, x, y, t) => {
    wallShadow(g, x, y - 16, 16, 16, 0.2);
    ink(g, x, y, 16, 16, (bx, by) => {
      ell(bx + 8, by - 8, 8, 8, M.plastic.base); ell(bx + 8, by - 9, 7.4, 7, M.plastic.l);
      ell(bx + 8, by - 8, 6.6, 6.6, '#fdfaf2'); ell(bx + 8, by - 9, 5.6, 4.6, '#fff');
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        px(bx + 8 + Math.round(Math.cos(a) * 5.2), by - 8 + Math.round(Math.sin(a) * 5.2), i % 3 === 0 ? '#22222c' : '#9a94a0');
      }
      const s = ((t || 0) % 60) / 60 * Math.PI * 2 - Math.PI / 2;
      const h = (CH.state.hour / 12) * Math.PI * 2 - Math.PI / 2;
      const mn = (CH.state.hour % 1) * Math.PI * 2 - Math.PI / 2;
      ln(bx + 8, by - 8, bx + 8 + Math.cos(h) * 3, by - 8 + Math.sin(h) * 3, '#22222c');
      ln(bx + 8, by - 8, bx + 8 + Math.cos(mn) * 4.6, by - 8 + Math.sin(mn) * 4.6, '#22222c');
      ln(bx + 8, by - 8, bx + 8 + Math.cos(s) * 4.6, by - 8 + Math.sin(s) * 4.6, '#c8352b');
      px(bx + 8, by - 8, '#3a3a44');
      const gg = gfx.cur; gg.save(); gg.globalAlpha = 0.2; tri(bx + 4, by - 12, bx + 10, by - 12, bx + 4, by - 6, '#fff'); gg.restore();
    }, { l: 4, r: 4, t: 4, b: 3 });
  });

  def('bedsideTable', 20, 22, (g, x, y) => {
    floorShadow(g, x, 20, y, 0.26);
    ink(g, x, y, 20, 22, (bx, by) => {
      const E = M.clinical;
      rect(bx + 1, by - 19, 18, 19, E.base); hl(bx + 1, by - 19, 18, E.l);
      vl(bx + 1, by - 19, 19, E.l); vl(bx + 18, by - 19, 19, E.dd);
      surf(bx, by - 22, 20, 3, M.steel);
      for (let i = 0; i < 2; i++) {
        const dy = by - 17 + i * 7;
        rect(bx + 3, dy, 14, 6, E.d); hl(bx + 3, dy, 14, E.base); hl(bx + 3, dy + 5, 14, E.dd);
        rect(bx + 8, dy + 2, 5, 1, M.steel.base);
      }
      rect(bx + 2, by - 3, 3, 3, M.plastic.base); rect(bx + 15, by - 3, 3, 3, M.plastic.base);
      ao(bx + 2, by - 4, 16, 4, '#101820', 0.2);
      // flowers, a cup, folded glasses
      rect(bx + 3, by - 29, 5, 7, 'rgba(190,225,245,0.85)'); fr(bx + 3, by - 29, 5, 7, '#b8cfe0');
      ln(bx + 5, by - 29, bx + 4, by - 34, '#5c9a42'); ln(bx + 6, by - 29, bx + 8, by - 33, '#5c9a42');
      ell(bx + 4, by - 35, 1.6, 1.4, '#f0a0b0'); ell(bx + 8, by - 34, 1.6, 1.4, '#f5c33b'); px(bx + 6, by - 36, '#c85a8a');
      mug(bx + 12, by - 22, '#f4f1ea', { full: false });
      ln(bx + 10, by - 23, bx + 15, by - 23, '#3a3a44'); px(bx + 12, by - 24, '#6a6a76');
    }, { l: 5, r: 5, t: 18, b: 3 });
  });

  def('curtainRail', 76, 50, (g, x, y) => {
    ink(g, x, y, 76, 50, (bx, by) => {
      const C = mat('#8fb8d8');
      rect(bx, by - 50, 76, 2, M.chrome.base); hl(bx, by - 50, 76, M.chrome.l);
      for (let i = 0; i < 19; i++) px(bx + 2 + i * 4, by - 48, M.chrome.d);
      for (let i = 0; i < 76; i += 5) {
        const w = Math.min(5, 76 - i);
        rect(bx + i, by - 47, w, 47, i % 10 ? C.base : C.d);
        vl(bx + i, by - 47, 47, C.l); vl(bx + i + w - 1, by - 47, 47, C.dd);
      }
      hl(bx, by - 47, 76, C.l);
      // hem
      hl(bx, by - 2, 76, C.dd); hl(bx, by - 1, 76, shade(C.dd, -12));
      for (let i = 0; i < 76; i += 5) px(bx + i + 2, by, C.d);
      // a printed pattern
      for (let r = 0; r < 4; r++) for (let i = 2; i < 76; i += 10) px(bx + i + (r % 2) * 5, by - 38 + r * 10, C.l);
    }, { l: 5, r: 5, t: 5, b: 3 });
  });

  // generic drawer: draws prop by name
  CH.drawProp = (name, g, x, y, t, st) => { const p = PR[name]; if (p) p.draw(g, x, y, t, st); };
})(window.CH);
