// ============================================================================
// Props: procedural pixel furniture & objects. Each: {w,h,draw(g,x,y,t,st)}
// (x, y) = bottom-left corner of prop's footprint.
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, P = CH.PAL;
  const PR = (CH.PROPS = {});
  const def = (name, w, h, draw, extra = {}) => { PR[name] = Object.assign({ name, w, h, draw }, extra); };
  const rect = gfx.rect, px = gfx.px, hl = gfx.hline, vl = gfx.vline, ell = gfx.ellipse, fr = gfx.frame, ln = gfx.line;

  // wood texture helper: planks with knots
  CH.drawPlanks = (g, x, y, w, h, plankH, base, dark, light, seed = 1, vertical = false) => {
    const rng = new CH.Rng(seed);
    rect(x, y, w, h, base);
    if (!vertical) {
      for (let py = y; py < y + h; py += plankH) {
        hl(x, py, w, dark);
        // plank end seams
        let sx = x + rng.int(0, 60);
        while (sx < x + w) { vl(sx, py, plankH, dark); sx += rng.int(50, 120); }
        // grain
        for (let i = 0; i < w / 30; i++) { const gx = x + rng.int(0, w), gy = py + rng.int(1, plankH - 1); hl(gx, gy, rng.int(4, 14), rng.chance(0.5) ? light : dark); }
        if (rng.chance(0.4)) { const kx = x + rng.int(0, w), ky = py + rng.int(2, plankH - 2); ell(kx, ky, 2, 1, dark); px(kx, ky, light); }
      }
    } else {
      for (let pxx = x; pxx < x + w; pxx += plankH) {
        vl(pxx, y, h, dark);
        for (let i = 0; i < h / 30; i++) { const gy = y + rng.int(0, h), gx = pxx + rng.int(1, plankH - 1); vl(gx, gy, rng.int(4, 14), rng.chance(0.5) ? light : dark); }
      }
    }
  };

  // ---------------------------------------------------------------- CABIN ----
  def('bed', 62, 30, (g, x, y, t, st) => {
    // frame
    rect(x, y - 24, 4, 24, P.wood0); rect(x + 58, y - 18, 4, 18, P.wood0);
    rect(x + 1, y - 14, 60, 4, P.wood1); hl(x + 1, y - 14, 60, P.wood3);
    // mattress + blanket
    rect(x + 3, y - 20, 56, 7, '#e8e0d0');
    rect(x + 14, y - 21, 46, 9, st && st.made ? '#5a7ac8' : '#5a7ac8');
    // rumpled blanket folds
    for (let i = 0; i < 5; i++) hl(x + 16 + i * 8, y - 21 + (i % 2) + 2, 5, '#3b5390');
    hl(x + 14, y - 21, 46, '#7b9ae8');
    rect(x + 20, y - 24, 12, 4, '#3b5390'); // blanket kicked up
    // pillow
    rect(x + 4, y - 24, 12, 5, '#f4f1ea'); hl(x + 4, y - 24, 12, '#fff'); px(x + 9, y - 22, '#ddd');
    // legs
    rect(x + 2, y - 4, 3, 4, P.wood0); rect(x + 56, y - 4, 3, 4, P.wood0);
    // stuff under bed
    rect(x + 20, y - 3, 10, 3, '#8a4a3a'); rect(x + 34, y - 2, 6, 2, '#ccc');
  });
  def('nightstand', 18, 16, (g, x, y) => {
    rect(x, y - 16, 18, 16, P.wood1); hl(x, y - 16, 18, P.wood3); rect(x + 3, y - 12, 12, 5, P.wood0); px(x + 9, y - 10, P.amber);
    rect(x + 3, y - 5, 12, 4, P.wood0); px(x + 9, y - 3, P.amber);
  });
  def('alarmClock', 10, 8, (g, x, y, t, st) => {
    const ring = st && st.ringing;
    const sh = ring ? Math.round(Math.sin(t * 60) * 1.5) : 0;
    rect(x + sh, y - 6, 10, 6, '#c8352b'); rect(x + 1 + sh, y - 5, 8, 4, '#f4f1ea');
    px(x + 4 + sh, y - 3, '#000'); px(x + 5 + sh, y - 4, '#000');
    rect(x + 1 + sh, y - 8, 3, 2, '#c8352b'); rect(x + 6 + sh, y - 8, 3, 2, '#c8352b');
    rect(x + 4 + sh, y - 8, 2, 1, '#888');
    if (ring) { for (let i = 0; i < 3; i++) { const a = t * 20 + i; px(x - 2 + sh + Math.round(Math.cos(a) * 2), y - 9 + Math.round(Math.sin(a)), '#fff'); px(x + 11 + sh, y - 9 - i, '#fff'); } }
  });
  def('poster', 22, 28, (g, x, y, t, st) => {
    const v = (st && st.variant) || 0;
    rect(x, y - 28, 22, 28, v === 1 ? '#1b2238' : '#f5c33b'); fr(x, y - 28, 22, 28, '#eee');
    if (v === 0) { // blue hedgehog poster
      rect(x + 3, y - 24, 16, 14, '#3b6fd6'); ell(x + 11, y - 15, 6, 5, '#2a4ea8'); ell(x + 13, y - 16, 5, 4, '#3b6fd6'); ell(x + 15, y - 15, 2.5, 2, '#f2c9a0');
      px(x + 15, y - 17, '#fff'); px(x + 16, y - 17, '#000');
      gfx.text('BLUE', x + 11, y - 9, '#1b2238', { align: 'center', font: 'small' });
      gfx.text('HEDGEHOG', x + 11, y - 4, '#1b2238', { align: 'center', font: 'small' });
      // corner peeling
      gfx.tri(x + 18, y - 28, x + 22, y - 28, x + 22, y - 24, '#c8a030');
    } else if (v === 1) { // space poster
      for (let i = 0; i < 14; i++) px(x + 2 + ((i * 7) % 18), y - 26 + ((i * 5) % 22), i % 3 ? '#fff' : '#9fdcff');
      ell(x + 11, y - 15, 5, 5, '#e8752c'); ell(x + 9, y - 16, 2, 1.5, '#f5c33b');
      gfx.text('MAN EGG', x + 11, y - 6, '#fff', { align: 'center', font: 'small' });
    } else { // motivational
      rect(x + 2, y - 26, 18, 24, '#8bd06a'); gfx.text('HANG', x + 11, y - 22, '#fff', { align: 'center', font: 'small' }); gfx.text('IN', x + 11, y - 15, '#fff', { align: 'center', font: 'small' }); gfx.text('THERE', x + 11, y - 8, '#fff', { align: 'center', font: 'small' });
    }
  });
  def('gameCases', 16, 14, (g, x, y) => {
    const cols = ['#3b6fd6', '#c8352b', '#4f9d3a', '#f5c33b', '#7b4fb0', '#e8752c', '#333'];
    for (let i = 0; i < 6; i++) { rect(x + (i % 2), y - 2 - i * 2, 14, 2, cols[i]); hl(x + (i % 2) + 1, y - 2 - i * 2, 12, gfx.shade(cols[i], 30)); }
    rect(x + 3, y - 14, 12, 2, cols[6]); // one sticking out
  });
  def('console', 20, 6, (g, x, y, t, st) => {
    rect(x, y - 6, 20, 6, '#2a2a34'); hl(x, y - 6, 20, '#44444f'); rect(x + 2, y - 4, 6, 1, '#111');
    px(x + 16, y - 3, st && st.on ? (Math.sin(t * 4) > 0 ? '#4f4' : '#2a2') : '#f22');
    // controller cable
    ln(x + 3, y - 1, x - 8, y + 4, '#222');
  });
  def('controller', 12, 6, (g, x, y) => { rect(x, y - 5, 12, 4, '#3a3a48'); rect(x + 1, y - 6, 3, 1, '#3a3a48'); rect(x + 8, y - 6, 3, 1, '#3a3a48'); px(x + 2, y - 3, '#999'); px(x + 8, y - 4, '#f44'); px(x + 10, y - 3, '#4f4'); px(x + 9, y - 2, '#48f'); });
  def('tv', 64, 56, (g, x, y, t, st) => {
    // stand
    rect(x + 4, y - 14, 56, 14, P.wood0); hl(x + 4, y - 14, 56, P.wood2); rect(x + 8, y - 11, 22, 8, P.woodDark); rect(x + 34, y - 11, 22, 8, P.woodDark);
    // tv body (CRT)
    rect(x, y - 56, 64, 42, '#2a2a34'); hl(x, y - 56, 64, '#4a4a58'); vl(x, y - 56, 42, '#4a4a58');
    rect(x + 3, y - 53, 52, 31, '#111');
    // screen content (16:9 so the game can zoom in seamlessly)
    const sx = x + 5, sy = y - 51, sw = 48, sh = 27;
    if (st && st.screen) st.screen(g, sx, sy, sw, sh, t);
    else rect(sx, sy, sw, sh, '#151820');
    // reflection
    g.globalAlpha = 0.12; rect(sx + 2, sy + 2, 6, 14, '#fff'); g.globalAlpha = 1;
    // controls + speaker grille
    rect(x + 56, y - 52, 6, 28, '#3a3a48'); px(x + 58, y - 49, '#8f8'); ell(x + 58, y - 42, 2, 2, '#666'); ell(x + 58, y - 34, 2, 2, '#666'); px(x + 58, y - 27, '#f44');
    for (let i = 0; i < 6; i++) hl(x + 4, y - 20 + i, 50, i % 2 ? '#1a1a22' : '#3a3a48');
    // cables
    ln(x + 20, y - 14, x + 18, y - 6, '#222'); ln(x + 18, y - 6, x + 24, y - 2, '#222'); ln(x + 40, y - 14, x + 44, y - 4, '#333');
  });
  def('couch', 70, 30, (g, x, y, t, st) => {
    const c = '#8a5a3a', cd = '#5a3721', cl = '#a86f4a';
    rect(x, y - 26, 70, 22, cd); // back
    rect(x + 2, y - 24, 66, 10, c); hl(x + 2, y - 24, 66, cl);
    rect(x, y - 16, 8, 14, cd); rect(x + 62, y - 16, 8, 14, cd); rect(x + 1, y - 15, 6, 12, c); rect(x + 63, y - 15, 6, 12, c);
    // cushions (sagging middle)
    rect(x + 8, y - 12, 27, 9, c); rect(x + 36, y - 11, 26, 8, c); hl(x + 8, y - 12, 27, cl); hl(x + 36, y - 11, 26, cl);
    rect(x + 8, y - 4, 54, 3, cd);
    // legs
    rect(x + 2, y - 2, 3, 2, P.woodDark); rect(x + 65, y - 2, 3, 2, P.woodDark);
    // blanket draped
    rect(x + 44, y - 22, 20, 10, '#c85a5a'); for (let i = 0; i < 5; i++) hl(x + 44, y - 20 + i * 2, 20, '#e07070');
    rect(x + 58, y - 12, 8, 6, '#c85a5a');
    // chip bag + crumbs
    rect(x + 12, y - 15, 7, 4, '#f5c33b'); px(x + 14, y - 14, '#c8352b'); px(x + 22, y - 12, '#f0d080'); px(x + 26, y - 11, '#f0d080');
  });
  def('coffeeTable', 40, 14, (g, x, y) => {
    rect(x, y - 14, 40, 3, P.wood1); hl(x, y - 14, 40, P.wood3); rect(x + 2, y - 11, 3, 11, P.wood0); rect(x + 35, y - 11, 3, 11, P.wood0);
    // mug, cans, pizza box, remote
    rect(x + 4, y - 19, 5, 5, '#f4f1ea'); px(x + 9, y - 17, '#f4f1ea'); rect(x + 5, y - 18, 3, 1, '#4a2a1a');
    rect(x + 12, y - 20, 3, 6, '#3b6fd6'); rect(x + 16, y - 20, 3, 6, '#4f9d3a'); px(x + 17, y - 21, '#aaa');
    rect(x + 21, y - 17, 16, 3, '#e0c090'); hl(x + 21, y - 17, 16, '#f0d0a0'); px(x + 28, y - 16, '#c8352b');
    rect(x + 30, y - 21, 6, 2, '#222'); px(x + 31, y - 21, '#f44');
  });
  def('fireplace', 60, 70, (g, x, y, t, st) => {
    // stone
    const rng = new CH.Rng(7);
    rect(x, y - 70, 60, 70, '#6a6a72');
    for (let yy = y - 70; yy < y; yy += 6) for (let xx = x + ((yy / 6) & 1 ? 4 : 0); xx < x + 60; xx += 9) rect(xx, yy, 8, 5, rng.pick(['#7a7a84', '#8a8a94', '#6e6e78', '#82828c']));
    // mantel
    rect(x - 4, y - 46, 68, 4, P.wood0); hl(x - 4, y - 46, 68, P.wood2);
    // opening
    rect(x + 10, y - 40, 40, 36, '#1a1010'); rect(x + 12, y - 38, 36, 34, '#0d0808');
    // logs
    rect(x + 16, y - 8, 28, 4, '#4a2a1a'); rect(x + 20, y - 12, 22, 4, '#5a3a2a');
    // fire
    if (!st || st.lit !== false) {
      const fh = 18 + Math.sin(t * 9) * 2, cx = x + 30;
      for (let i = 0; i < 5; i++) {
        const fx = cx - 10 + i * 5 + Math.round(Math.sin(t * 7 + i * 2) * 1.5);
        const h = fh * (0.5 + 0.5 * Math.abs(Math.sin(t * 5 + i * 1.7)));
        gfx.tri(fx - 4, y - 12, fx + 4, y - 12, fx, y - 12 - h, '#e8752c');
        gfx.tri(fx - 2, y - 12, fx + 2, y - 12, fx, y - 12 - h * 0.6, '#f5c33b');
      }
      // embers
      for (let i = 0; i < 4; i++) { const k = (t * 0.7 + i * 0.25) % 1; px(cx - 8 + i * 5 + Math.round(Math.sin(t * 3 + i) * 2), y - 14 - k * 22, `rgba(255,${150 + i * 20},60,${1 - k})`); }
      // glow on floor
      g.globalAlpha = 0.15 + Math.sin(t * 9) * 0.04; rect(x - 10, y - 2, 80, 6, '#ffb060'); g.globalAlpha = 1;
    }
    // grate
    for (let i = 0; i < 6; i++) vl(x + 14 + i * 6, y - 14, 10, '#222');
    // hearth
    rect(x - 6, y - 2, 72, 2, '#55555e');
  });
  def('photoFrame', 12, 14, (g, x, y, t, st) => {
    const v = (st && st.variant) || 0;
    rect(x, y - 14, 12, 14, v === 2 ? '#c8a030' : P.wood0); rect(x + 1, y - 13, 10, 12, '#f4f1ea');
    rect(x + 2, y - 12, 8, 10, v === 1 ? '#87ceeb' : '#e8e0c8');
    if (v === 0) { // mom & baby chubby
      ell(x + 5, y - 6, 1.5, 1.5, '#9a6a48'); ell(x + 5, y - 4, 2, 2, '#b95c86'); ell(x + 8, y - 4, 2, 1.5, '#8a5a3b'); ell(x + 8, y - 5, 1, 1, '#8a5a3b');
    } else if (v === 1) { // cabin exterior
      rect(x + 3, y - 7, 6, 4, P.wood1); gfx.tri(x + 2, y - 7, x + 10, y - 7, x + 6, y - 10, '#c8352b'); rect(x + 2, y - 3, 8, 1, '#fff');
    } else { // dad? a porcupine with a hockey stick
      ell(x + 6, y - 7, 1.6, 1.6, '#7a5a3a'); rect(x + 5, y - 5, 3, 3, '#3b6fd6'); ln(x + 8, y - 8, x + 9, y - 3, '#8a5a2b');
    }
  });
  def('bookshelf', 36, 60, (g, x, y) => {
    rect(x, y - 60, 36, 60, P.wood0); rect(x + 2, y - 58, 32, 56, P.woodDark);
    const rng = new CH.Rng(3);
    for (let s = 0; s < 4; s++) {
      const sy = y - 44 + s * 14;
      hl(x + 2, sy, 32, P.wood1);
      let bx = x + 3;
      while (bx < x + 32) {
        const w = rng.int(2, 4), h = rng.int(8, 12);
        if (bx + w > x + 33) break;
        if (rng.chance(0.12)) { bx += w + 3; continue; }
        const c = rng.pick(['#c8352b', '#3b6fd6', '#4f9d3a', '#f5c33b', '#7b4fb0', '#e8752c', '#d8d0c0', '#5a3721']);
        rect(bx, sy - h, w, h, c); px(bx + (w >> 1), sy - h + 2, gfx.shade(c, 40));
        bx += w;
      }
    }
    // knick-knacks on top
    ell(x + 8, y - 62, 3, 2, '#4f9d3a'); rect(x + 7, y - 61, 2, 2, '#8a5a2b'); rect(x + 20, y - 64, 6, 4, '#8a8a94'); rect(x + 30, y - 63, 3, 3, '#f5c33b');
  });
  def('plant', 14, 30, (g, x, y, t, st) => {
    const v = (st && st.variant) || 0;
    rect(x + 3, y - 10, 8, 10, '#c86a3a'); hl(x + 2, y - 10, 10, '#e08a4a'); rect(x + 4, y - 8, 6, 2, '#5a3721');
    const sway = Math.sin(t * 1.5 + x) * 0.8;
    if (v === 0) {
      for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.45; const L = 14 + (i % 2) * 5; ln(x + 7, y - 10, x + 7 + Math.cos(a) * L + sway, y - 10 + Math.sin(a) * L, '#4f9d3a'); ell(x + 7 + Math.cos(a) * L + sway, y - 10 + Math.sin(a) * L, 2, 1.5, '#8bd06a'); }
    } else if (v === 1) { // cactus
      rect(x + 5, y - 26, 4, 16, '#4f9d3a'); rect(x + 2, y - 20, 3, 2, '#4f9d3a'); rect(x + 2, y - 24, 2, 5, '#4f9d3a'); rect(x + 9, y - 18, 3, 2, '#4f9d3a'); rect(x + 11, y - 22, 2, 5, '#4f9d3a'); px(x + 6, y - 27, '#f0a0b0');
      for (let i = 0; i < 6; i++) px(x + 5 + (i % 2) * 3, y - 24 + i * 2, '#c8e8a0');
    } else { // dead plant
      ln(x + 7, y - 10, x + 5, y - 20, '#8a6a3a'); ln(x + 7, y - 10, x + 10, y - 18, '#8a6a3a'); px(x + 4, y - 21, '#a08050'); px(x + 11, y - 19, '#a08050');
    }
  });
  def('window', 44, 40, (g, x, y, t, st) => {
    // frame (drawn AFTER outside view)
    const wx = x, wy = y - 40;
    if (st && st.outside) st.outside(g, wx + 3, wy + 3, 38, 34, t);
    else rect(wx + 3, wy + 3, 38, 34, '#1a2140');
    rect(wx, wy, 44, 3, P.cream); rect(wx, wy + 37, 44, 3, P.cream); rect(wx, wy, 3, 40, P.cream); rect(wx + 41, wy, 3, 40, P.cream);
    rect(wx + 21, wy, 2, 40, P.cream); rect(wx, wy + 19, 44, 2, P.cream);
    // sill
    rect(wx - 2, wy + 40, 48, 3, P.wood2); hl(wx - 2, wy + 40, 48, P.wood3);
    // frost corners
    g.globalAlpha = 0.5; px(wx + 4, wy + 4, '#fff'); px(wx + 5, wy + 4, '#fff'); px(wx + 4, wy + 5, '#fff'); px(wx + 39, wy + 35, '#fff'); px(wx + 38, wy + 35, '#fff'); g.globalAlpha = 1;
    // curtains
    rect(wx - 4, wy - 2, 6, 36, '#c85a5a'); rect(wx + 42, wy - 2, 6, 36, '#c85a5a'); for (let i = 0; i < 3; i++) { vl(wx - 3 + i * 2, wy - 2, 36, '#a04040'); vl(wx + 43 + i * 2, wy - 2, 36, '#a04040'); }
    rect(wx - 6, wy - 4, 56, 2, P.wood0);
  });
  // forest view through window (with snow)
  CH.drawForestView = (g, x, y, w, h, t, night = false) => {
    gfx.clip(x, y, w, h);
    if (night) { gfx.vgrad(x, y, w, h, ['#0d1230', '#1a2140', '#24305a']); for (let i = 0; i < 8; i++) px(x + ((i * 13 + 5) % w), y + ((i * 7) % (h / 2)), '#fff'); }
    else gfx.vgrad(x, y, w, h, ['#9fc4e8', '#b8d8f0', '#d0e8f4', '#e0eef4']);
    // far hills
    ell(x + 10, y + h - 6, 24, 10, night ? '#1a2a3a' : '#b0c8d8'); ell(x + 34, y + h - 4, 20, 8, night ? '#1a2a3a' : '#b0c8d8');
    // snow ground
    rect(x, y + h - 8, w, 8, night ? '#8a94b0' : '#eef4f8');
    // pines
    const rng = new CH.Rng(x * 7 + 3);
    for (let i = 0; i < 6; i++) {
      const tx = x + 2 + i * 7 + rng.int(0, 3), th = rng.int(12, 22), ty = y + h - 6;
      const c = night ? '#12241c' : rng.pick(['#2f6a24', '#3a7a2c', '#25551c']);
      for (let k = 0; k < 3; k++) gfx.tri(tx - 4 + k, ty - k * 5, tx + 4 - k, ty - k * 5, tx, ty - th + k * 2, c);
      hl(tx - 2, ty - 6, 4, night ? '#4a5a70' : '#fff');
    }
    // falling snow
    for (let i = 0; i < 12; i++) { const k = (t * 0.25 + i * 0.083) % 1; px(x + ((i * 11 + Math.floor(Math.sin(t + i) * 3)) % w), y + k * h, night ? 'rgba(255,255,255,0.6)' : '#fff'); }
    gfx.unclip();
  };
  def('kitchenCounter', 90, 30, (g, x, y, t, st) => {
    rect(x, y - 30, 90, 30, P.wood1); hl(x, y - 30, 90, P.wood3);
    rect(x, y - 32, 90, 3, '#8a8a94'); hl(x, y - 32, 90, '#b8b8c4'); // countertop
    // cabinet doors
    for (let i = 0; i < 4; i++) { rect(x + 2 + i * 22, y - 26, 20, 24, P.wood0); fr(x + 3 + i * 22, y - 25, 18, 22, P.wood2); px(x + 12 + i * 22, y - 14, P.amber); }
    // sink
    rect(x + 30, y - 33, 30, 3, '#6a6a74'); rect(x + 32, y - 32, 26, 2, '#3a3a44');
    rect(x + 44, y - 42, 2, 10, '#b8b8c4'); rect(x + 44, y - 42, 8, 2, '#b8b8c4'); px(x + 51, y - 40, '#b8b8c4');
    // drip
    if (t !== undefined) { const k = (t * 1.2) % 1; if (k < 0.8) px(x + 51, y - 39 + Math.floor(k * 8), '#9fdcff'); }
    // dishes pile
    rect(x + 4, y - 36, 12, 2, '#f4f1ea'); rect(x + 5, y - 38, 10, 2, '#e8e0d0'); rect(x + 6, y - 40, 8, 2, '#f4f1ea'); rect(x + 8, y - 44, 4, 4, '#3b6fd6');
    rect(x + 64, y - 36, 6, 4, '#f4f1ea'); rect(x + 72, y - 38, 10, 6, '#8a8a94'); hl(x + 72, y - 38, 10, '#b8b8c4'); // pan
    ln(x + 82, y - 37, x + 88, y - 37, '#222');
    // paper towel roll
    rect(x + 84, y - 42, 5, 9, '#f4f1ea'); rect(x + 85, y - 43, 3, 1, '#ccc');
  });
  def('fridge', 30, 58, (g, x, y, t, st) => {
    rect(x, y - 58, 30, 58, '#d8dce4'); hl(x, y - 58, 30, '#f0f4f8'); vl(x, y - 58, 58, '#f0f4f8'); rect(x + 29, y - 58, 1, 58, '#9aa0aa');
    hl(x, y - 38, 30, '#9aa0aa'); rect(x + 24, y - 52, 2, 8, '#8a8a94'); rect(x + 24, y - 32, 2, 12, '#8a8a94');
    // magnets & notes
    rect(x + 4, y - 55, 8, 6, '#f5c33b'); px(x + 6, y - 53, '#333'); px(x + 8, y - 53, '#333'); hl(x + 5, y - 51, 6, '#333');
    rect(x + 14, y - 54, 7, 9, '#fff'); for (let i = 0; i < 4; i++) hl(x + 15, y - 52 + i * 2, 5, '#88a'); px(x + 17, y - 55, '#c8352b');
    rect(x + 5, y - 30, 10, 12, '#fff'); for (let i = 0; i < 5; i++) hl(x + 6, y - 28 + i * 2, 8 - (i === 4 ? 3 : 0), '#666'); px(x + 10, y - 31, '#3b6fd6'); // shopping list
    ell(x + 20, y - 20, 2, 2, '#c8352b'); ell(x + 6, y - 14, 2, 2, '#4f9d3a'); rect(x + 17, y - 14, 8, 6, '#8bd06a'); // maple leaf magnet-ish
    px(x + 20, y - 11, '#c8352b'); px(x + 21, y - 12, '#c8352b'); px(x + 20, y - 13, '#c8352b');
    // kid drawing
    rect(x + 16, y - 34, 10, 10, '#f8f0d8'); ell(x + 21, y - 30, 3, 3, '#8a5a3b'); px(x + 20, y - 31, '#000'); px(x + 22, y - 31, '#000'); ell(x + 21, y - 26, 2, 1, '#2f8f7a');
  });
  def('stove', 30, 30, (g, x, y, t, st) => {
    rect(x, y - 30, 30, 30, '#e8e8ec'); hl(x, y - 30, 30, '#fff'); rect(x + 3, y - 22, 24, 14, '#2a2a34'); rect(x + 5, y - 20, 20, 10, '#111'); rect(x + 6, y - 19, 18, 8, '#3a2a20');
    rect(x, y - 32, 30, 2, '#2a2a34');
    for (let i = 0; i < 2; i++) { ell(x + 8 + i * 14, y - 32, 5, 1.5, '#444'); hl(x + 5 + i * 14, y - 32, 6, '#555'); }
    // pan with pancakes
    if (!st || st.pan !== false) { ell(x + 8, y - 34, 6, 2, '#333'); ell(x + 8, y - 35, 4, 1.2, '#e0a050'); ln(x + 14, y - 34, x + 20, y - 36, '#222'); if (t !== undefined && st && st.steam) for (let i = 0; i < 2; i++) { const k = (t * 0.6 + i * 0.5) % 1; px(x + 6 + i * 4, y - 37 - k * 10, `rgba(255,255,255,${0.6 - k * 0.6})`); } }
    for (let i = 0; i < 4; i++) ell(x + 6 + i * 6, y - 26, 1.5, 1.5, '#555');
    rect(x + 4, y - 5, 22, 3, '#c8c8d0');
  });
  def('table', 56, 26, (g, x, y, t, st) => {
    rect(x, y - 26, 56, 4, P.wood2); hl(x, y - 26, 56, P.wood3); rect(x + 3, y - 22, 4, 22, P.wood0); rect(x + 49, y - 22, 4, 22, P.wood0);
    // tablecloth edge
    for (let i = 0; i < 14; i++) px(x + 1 + i * 4, y - 22, '#c85a5a');
    // salt & pepper, napkins, mail
    rect(x + 40, y - 31, 3, 5, '#fff'); rect(x + 44, y - 31, 3, 5, '#333'); rect(x + 6, y - 29, 10, 3, '#f4f1ea'); hl(x + 7, y - 28, 8, '#ccc'); rect(x + 8, y - 31, 8, 2, '#f4f1ea'); px(x + 14, y - 31, '#c8352b');
    // maple syrup bottle
    rect(x + 30, y - 34, 4, 8, '#8a4a1a'); rect(x + 31, y - 36, 2, 2, '#f5c33b'); px(x + 32, y - 31, '#c8352b');
    // coffee cup
    rect(x + 20, y - 31, 5, 5, '#3b6fd6'); px(x + 25, y - 29, '#3b6fd6');
  });
  def('pancakes', 14, 8, (g, x, y, t, st) => {
    const eaten = st && st.eaten;
    ell(x + 7, y - 1, 8, 2, '#f4f1ea'); // plate
    if (!eaten) {
      for (let i = 0; i < 4; i++) { ell(x + 7, y - 3 - i * 2, 6 - i * 0.3, 1.5, i % 2 ? '#d99a4a' : '#e8b060'); }
      rect(x + 5, y - 11, 4, 2, '#f5c33b'); // butter
      // syrup drips
      px(x + 3, y - 6, '#8a4a1a'); px(x + 11, y - 5, '#8a4a1a'); px(x + 12, y - 4, '#8a4a1a');
      // steam
      if (t !== undefined) for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i * 0.33) % 1; px(x + 4 + i * 3 + Math.round(Math.sin(t * 2 + i) * 1), y - 12 - k * 10, `rgba(255,255,255,${0.7 - k * 0.7})`); }
    } else { px(x + 5, y - 2, '#8a4a1a'); px(x + 9, y - 2, '#e8b060'); px(x + 8, y - 3, '#8a4a1a'); }
  });
  def('chair', 14, 26, (g, x, y, t, st) => {
    const flip = st && st.flip;
    const bx = flip ? x + 11 : x;
    rect(bx, y - 26, 3, 26, P.wood0); rect(bx + (flip ? -1 : 1), y - 24, 2, 8, P.wood1);
    rect(x, y - 14, 14, 3, P.wood1); hl(x, y - 14, 14, P.wood3);
    rect(flip ? x : x + 11, y - 11, 3, 11, P.wood0); rect(flip ? x + 11 : x, y - 11, 3, 11, P.wood0);
  });
  def('rockingChair', 22, 32, (g, x, y, t, st) => {
    const rock = st && st.rocking ? Math.sin(t * 2) * 1 : 0;
    g.save(); g.translate(x + 11, y); g.rotate(rock * 0.06); g.translate(-(x + 11), -y);
    rect(x + 2, y - 32, 3, 22, P.wood2); rect(x + 4, y - 30, 12, 3, P.wood1); for (let i = 0; i < 4; i++) rect(x + 5 + i * 3, y - 27, 1, 14, P.wood1);
    rect(x + 3, y - 13, 16, 3, P.wood2); rect(x + 4, y - 15, 14, 3, '#c85a5a'); // cushion
    rect(x + 16, y - 10, 3, 8, P.wood2); rect(x + 4, y - 10, 3, 8, P.wood2);
    // rocker
    for (let i = 0; i < 22; i++) px(x + i, y - 2 + Math.round(Math.abs(i - 11) * 0.15), P.wood0);
    // knitting basket beside
    g.restore();
    rect(x + 22, y - 8, 12, 8, '#c8a060'); hl(x + 22, y - 8, 12, '#e0c080'); ell(x + 26, y - 9, 3, 2, '#c85a8a'); ell(x + 30, y - 10, 3, 2, '#5a7ac8'); ln(x + 31, y - 12, x + 36, y - 16, '#ccc');
  });
  def('rotaryPhone', 14, 20, (g, x, y, t, st) => {
    // wall-mounted rotary phone
    rect(x, y - 20, 14, 18, '#2a2a34'); hl(x, y - 20, 14, '#4a4a58');
    ell(x + 7, y - 11, 5, 5, '#e8e0d0'); ell(x + 7, y - 11, 3.5, 3.5, '#3a3a48');
    for (let i = 0; i < 10; i++) { const a = -Math.PI * 0.85 + i * (Math.PI * 1.5 / 9); px(x + 7 + Math.round(Math.cos(a) * 4), y - 11 + Math.round(Math.sin(a) * 4), '#fff'); }
    // handset on top
    rect(x - 2, y - 24, 18, 3, '#2a2a34'); rect(x - 3, y - 25, 4, 5, '#2a2a34'); rect(x + 13, y - 25, 4, 5, '#2a2a34');
    // cord (coiled)
    for (let i = 0; i < 8; i++) px(x + 15 + (i % 2), y - 18 + i * 2, '#2a2a34');
    if (st && st.ringing) { const k = Math.sin(t * 30) > 0; px(x - 4, y - 26, k ? '#fff' : '#000'); px(x + 18, y - 26, k ? '#000' : '#fff'); }
  });
  def('coatRack', 16, 56, (g, x, y) => {
    rect(x + 7, y - 56, 2, 56, P.wood0); rect(x + 3, y - 2, 10, 2, P.wood0);
    for (const [dx] of [[-6], [6]]) { ln(x + 8, y - 52, x + 8 + dx, y - 49, P.wood1); px(x + 8 + dx, y - 50, P.amber); }
    // hoodie (grey) hanging
    rect(x - 6, y - 48, 10, 20, '#6a6a72'); rect(x - 7, y - 50, 6, 4, '#6a6a72');
    // winter coat
    rect(x + 10, y - 48, 12, 26, '#c8352b'); rect(x + 12, y - 50, 8, 3, '#8f2419'); vl(x + 16, y - 46, 20, '#8f2419');
    // scarf
    rect(x + 12, y - 44, 4, 14, '#f5c33b'); for (let i = 0; i < 3; i++) hl(x + 12, y - 42 + i * 4, 4, '#c8352b');
  });
  def('boots', 24, 10, (g, x, y) => {
    rect(x, y - 8, 6, 8, '#5a3721'); rect(x, y - 3, 10, 3, '#5a3721'); hl(x, y - 8, 6, '#8a5a3b');
    rect(x + 13, y - 9, 6, 9, '#5a3721'); rect(x + 13, y - 3, 10, 3, '#5a3721'); hl(x + 13, y - 9, 6, '#8a5a3b');
    // salt stains
    px(x + 2, y - 2, '#ddd'); px(x + 16, y - 1, '#ddd'); px(x + 21, y - 2, '#ddd');
  });
  def('door', 30, 62, (g, x, y, t, st) => {
    rect(x - 2, y - 64, 34, 64, P.wood0);
    rect(x, y - 62, 30, 62, P.wood2); CH.drawPlanks(g, x, y - 62, 30, 62, 10, P.wood2, P.wood1, P.wood3, 5, true);
    fr(x + 3, y - 58, 24, 26, P.wood1); fr(x + 3, y - 28, 24, 24, P.wood1);
    ell(x + 25, y - 30, 2, 2, P.amber);
    // small window
    rect(x + 8, y - 54, 14, 14, '#1a2140'); if (st && st.outside) st.outside(g, x + 8, y - 54, 14, 14, t); vl(x + 15, y - 54, 14, P.cream); hl(x + 8, y - 47, 14, P.cream);
    // welcome mat
    rect(x - 2, y - 2, 34, 2, '#8a6a3a'); for (let i = 0; i < 8; i++) px(x + i * 4, y - 1, '#c8a060');
  });
  def('rug', 80, 4, (g, x, y, t, st) => {
    const c1 = (st && st.c1) || '#a04040', c2 = (st && st.c2) || '#d08060';
    rect(x, y - 4, 80, 4, c1); for (let i = 0; i < 20; i++) rect(x + i * 4 + (i % 2), y - 3, 2, 2, c2); hl(x, y - 4, 80, c2); hl(x, y - 1, 80, c2);
  });
  def('lamp', 16, 60, (g, x, y, t, st) => {
    const on = !st || st.on !== false;
    rect(x + 7, y - 50, 2, 50, '#3a3a48'); ell(x + 8, y - 1, 6, 1.5, '#3a3a48');
    gfx.tri(x, y - 50, x + 16, y - 50, x + 8, y - 60, on ? '#f5e6b0' : '#c8b890'); rect(x, y - 50, 16, 2, on ? '#e8d090' : '#a8a080');
    if (on) { g.globalAlpha = 0.12; gfx.tri(x - 14, y, x + 30, y, x + 8, y - 50, '#ffe8a0'); g.globalAlpha = 1; }
  });
  def('wallClock', 14, 14, (g, x, y, t, st) => {
    ell(x + 7, y - 7, 7, 7, P.wood0); ell(x + 7, y - 7, 5.5, 5.5, '#f4f1ea');
    for (let i = 0; i < 12; i += 3) { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; px(x + 7 + Math.round(Math.cos(a) * 4.5), y - 7 + Math.round(Math.sin(a) * 4.5), '#333'); }
    const hour = (st && st.hour !== undefined) ? st.hour : CH.state.hour;
    const ha = (hour / 12) * Math.PI * 2 - Math.PI / 2, ma = ((hour % 1)) * Math.PI * 2 - Math.PI / 2;
    ln(x + 7, y - 7, x + 7 + Math.cos(ha) * 3, y - 7 + Math.sin(ha) * 3, '#222'); ln(x + 7, y - 7, x + 7 + Math.cos(ma) * 4.5, y - 7 + Math.sin(ma) * 4.5, '#222');
    if (t !== undefined) { const sa = (t % 60) / 60 * Math.PI * 2 - Math.PI / 2; ln(x + 7, y - 7, x + 7 + Math.cos(sa) * 4.5, y - 7 + Math.sin(sa) * 4.5, '#c8352b'); }
  });
  def('moosePainting', 40, 30, (g, x, y) => {
    rect(x, y - 30, 40, 30, '#c8a030'); rect(x + 2, y - 28, 36, 26, '#4a6a8a');
    gfx.vgrad(x + 2, y - 28, 36, 26, ['#e8a060', '#d07050', '#7a4a6a', '#3a4a6a']);
    rect(x + 2, y - 8, 36, 6, '#2a4a3a'); // lake
    // moose silhouette
    rect(x + 14, y - 16, 12, 7, '#1a1a24'); rect(x + 24, y - 20, 4, 6, '#1a1a24'); rect(x + 27, y - 19, 5, 3, '#1a1a24'); for (let i = 0; i < 4; i++) { vl(x + 15 + i * 3, y - 9, 5, '#1a1a24'); }
    ln(x + 26, y - 21, x + 22, y - 26, '#1a1a24'); ln(x + 26, y - 21, x + 30, y - 26, '#1a1a24'); hl(x + 21, y - 26, 3, '#1a1a24'); hl(x + 29, y - 26, 3, '#1a1a24');
  });
  def('hockeyStick', 8, 50, (g, x, y) => { ln(x + 2, y - 50, x + 6, y - 6, '#c8a060'); rect(x, y - 6, 10, 3, '#c8a060'); hl(x, y - 5, 10, '#222'); rect(x + 3, y - 40, 2, 6, '#222'); });
  def('snowshoes', 16, 30, (g, x, y) => { for (let i = 0; i < 2; i++) { ell(x + 4 + i * 8, y - 18, 3.5, 12, '#c8a060'); ell(x + 4 + i * 8, y - 18, 2, 10, '#a86f3a'); for (let k = 0; k < 4; k++) hl(x + 2 + i * 8, y - 26 + k * 5, 5, '#e0c080'); } });
  def('flag', 28, 16, (g, x, y) => { rect(x, y - 16, 28, 16, '#fff'); rect(x, y - 16, 7, 16, '#c8352b'); rect(x + 21, y - 16, 7, 16, '#c8352b'); rect(x + 12, y - 13, 4, 8, '#c8352b'); rect(x + 10, y - 11, 8, 3, '#c8352b'); rect(x + 13, y - 5, 2, 3, '#c8352b'); px(x + 14, y - 14, '#c8352b'); });
  def('calendar', 14, 18, (g, x, y) => { rect(x, y - 18, 14, 18, '#fff'); rect(x, y - 18, 14, 5, '#c8352b'); for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) px(x + 2 + c * 2, y - 11 + r * 2, r === 2 && c === 3 ? '#c8352b' : '#888'); rect(x + 6, y - 20, 2, 2, '#888'); });
  def('logs', 26, 14, (g, x, y) => { for (let i = 0; i < 4; i++) { ell(x + 4 + i * 6, y - 3, 3, 3, '#5a3721'); ell(x + 4 + i * 6, y - 3, 1.5, 1.5, '#c8a060'); } for (let i = 0; i < 3; i++) { ell(x + 7 + i * 6, y - 8, 3, 3, '#5a3721'); ell(x + 7 + i * 6, y - 8, 1.5, 1.5, '#c8a060'); } ell(x + 13, y - 13, 3, 3, '#5a3721'); ell(x + 13, y - 13, 1.5, 1.5, '#c8a060'); });
  def('trashBin', 12, 16, (g, x, y, t, st) => { rect(x, y - 14, 12, 14, '#5a7a94'); hl(x, y - 14, 12, '#7a9ab4'); rect(x - 1, y - 16, 14, 3, '#42566b'); if (st && st.full) { rect(x + 2, y - 19, 3, 3, '#f4f1ea'); rect(x + 6, y - 20, 4, 4, '#e8b060'); } });
  def('laundry', 18, 12, (g, x, y) => { rect(x, y - 10, 18, 10, '#d8d0c0'); for (let i = 0; i < 4; i++) vl(x + 2 + i * 4, y - 9, 8, '#c0b8a8'); rect(x + 2, y - 13, 6, 4, '#3b6fd6'); rect(x + 9, y - 12, 7, 3, '#c85a5a'); px(x + 14, y - 14, '#2f8f7a'); });
  def('cereal', 12, 14, (g, x, y) => { rect(x, y - 14, 8, 14, '#f5c33b'); rect(x + 1, y - 10, 6, 6, '#c8352b'); px(x + 3, y - 8, '#fff'); rect(x + 9, y - 10, 5, 10, '#3b6fd6'); });
  def('pizzaBox', 18, 4, (g, x, y) => { rect(x, y - 4, 18, 4, '#e0c090'); hl(x, y - 4, 18, '#f0d0a0'); px(x + 5, y - 3, '#c8352b'); px(x + 9, y - 2, '#c8352b'); });
  def('cans', 12, 8, (g, x, y) => { rect(x, y - 7, 3, 7, '#4f9d3a'); rect(x + 4, y - 6, 3, 6, '#3b6fd6'); rect(x + 8, y - 8, 3, 8, '#c8352b'); px(x + 1, y - 8, '#aaa'); px(x + 9, y - 9, '#aaa'); });
  def('thermostat', 8, 8, (g, x, y) => { rect(x, y - 8, 8, 8, '#f4f1ea'); rect(x + 2, y - 6, 4, 3, '#222'); px(x + 3, y - 5, '#4f4'); });
  def('radiator', 30, 18, (g, x, y) => { for (let i = 0; i < 8; i++) rect(x + i * 4, y - 18, 3, 16, i % 2 ? '#d8d0c0' : '#c8c0b0'); rect(x, y - 2, 30, 2, '#888'); });
  def('bills', 14, 6, (g, x, y) => { rect(x, y - 2, 14, 2, '#fff'); rect(x + 1, y - 4, 12, 2, '#f4f1ea'); rect(x + 2, y - 6, 10, 2, '#fff'); px(x + 4, y - 5, '#c8352b'); px(x + 6, y - 5, '#c8352b'); hl(x + 3, y - 1, 5, '#888'); });
  def('cobweb', 10, 10, (g, x, y) => { g.globalAlpha = 0.6; for (let i = 0; i < 4; i++) ln(x, y - 10, x + 10, y - 10 + i * 3, '#ccc'); for (let i = 1; i < 4; i++) ln(x + i * 2, y - 10 + i * 2, x + i * 3, y - 10, '#ccc'); g.globalAlpha = 1; });
  def('bathroomDoor', 26, 58, (g, x, y, t, st) => { rect(x - 2, y - 60, 30, 60, P.wood0); rect(x, y - 58, 26, 58, P.wood1); fr(x + 3, y - 54, 20, 22, P.wood0); fr(x + 3, y - 28, 20, 24, P.wood0); px(x + 22, y - 30, P.amber); px(x + 23, y - 30, P.amber); if (st && st.sign) { rect(x + 8, y - 50, 10, 6, '#fff'); gfx.text(st.sign, x + 13, y - 49, '#333', { align: 'center', font: 'small' }); } });
  def('momDoor', 26, 58, (g, x, y, t, st) => { PR.bathroomDoor.draw(g, x, y, t, {}); rect(x + 6, y - 44, 14, 8, '#f0d0d8'); gfx.text('MOM', x + 13, y - 43, '#a04060', { align: 'center', font: 'small' }); px(x + 6, y - 45, '#c85a8a'); px(x + 19, y - 45, '#c85a8a'); });
  def('beanbag', 24, 14, (g, x, y) => { ell(x + 12, y - 5, 12, 5, '#7b4fb0'); ell(x + 12, y - 8, 9, 4, '#8b5fc0'); ell(x + 10, y - 9, 4, 2, '#9b6fd0'); });
  def('crumbs', 20, 2, (g, x, y) => { for (let i = 0; i < 6; i++) px(x + (i * 7) % 20, y - 1 - (i % 2), i % 2 ? '#f0d080' : '#c8a050'); });

  // ---------------------------------------------------------------- HOSPITAL --
  def('hChairs', 60, 22, (g, x, y) => {
    for (let i = 0; i < 4; i++) { const cx = x + i * 15; rect(cx, y - 22, 13, 8, '#4a7ab0'); rect(cx, y - 12, 13, 4, '#4a7ab0'); hl(cx, y - 22, 13, '#6a9ad0'); hl(cx, y - 12, 13, '#6a9ad0'); }
    rect(x, y - 8, 60, 2, '#8a8a94'); rect(x + 4, y - 6, 2, 6, '#8a8a94'); rect(x + 54, y - 6, 2, 6, '#8a8a94');
    // forgotten magazine
    rect(x + 32, y - 14, 8, 2, '#c85a5a'); px(x + 34, y - 15, '#f5c33b');
  });
  def('vending', 34, 60, (g, x, y, t, st) => {
    rect(x, y - 60, 34, 60, '#c8352b'); hl(x, y - 60, 34, '#e05040'); rect(x + 3, y - 56, 20, 40, '#1a2030');
    // items
    const cols = ['#f5c33b', '#4f9d3a', '#3b6fd6', '#e8752c', '#f0a0b0', '#8a8a94'];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { if (r === 1 && c === 2) continue; rect(x + 5 + c * 6, y - 53 + r * 10, 4, 6, cols[(r * 3 + c) % 6]); px(x + 6 + c * 6, y - 52 + r * 10, '#fff'); }
    for (let r = 0; r < 4; r++) hl(x + 3, y - 46 + r * 10, 20, '#3a4a5a');
    // glass sheen + flicker light
    g.globalAlpha = 0.15 + (Math.sin(t * 30) > 0.9 ? 0.1 : 0); rect(x + 4, y - 55, 4, 38, '#fff'); g.globalAlpha = 1;
    // keypad & slot
    rect(x + 25, y - 54, 7, 12, '#333'); for (let i = 0; i < 6; i++) px(x + 26 + (i % 2) * 3, y - 52 + Math.floor(i / 2) * 3, '#8f8');
    rect(x + 25, y - 38, 7, 3, '#111'); rect(x + 25, y - 32, 7, 2, '#555');
    rect(x + 3, y - 12, 28, 8, '#1a1a24'); hl(x + 3, y - 12, 28, '#333');
    gfx.text('SNAX', x + 17, y - 59, '#fff', { align: 'center', font: 'small' });
  });
  def('hSign', 36, 12, (g, x, y, t, st) => { rect(x, y - 12, 36, 12, '#1b3a6a'); hl(x, y - 12, 36, '#3b6fd6'); gfx.text((st && st.text) || 'ICU →', x + 18, y - 9, '#fff', { align: 'center', font: 'small' }); });
  def('hDoor', 34, 66, (g, x, y, t, st) => {
    rect(x - 2, y - 68, 38, 68, '#8a8a94'); rect(x, y - 66, 34, 66, '#d8dce4'); hl(x, y - 66, 34, '#eef'); rect(x + 6, y - 60, 22, 24, '#1a2a3a'); fr(x + 6, y - 60, 22, 24, '#8a8a94');
    if (st && st.inside) st.inside(g, x + 7, y - 59, 20, 22, t); else { g.globalAlpha = 0.3; rect(x + 7, y - 59, 20, 22, '#88a'); g.globalAlpha = 1; }
    rect(x + 27, y - 32, 4, 2, '#8a8a94'); rect(x + 2, y - 26, 30, 3, '#8a8a94'); // push bar
    if (st && st.label) { rect(x + 8, y - 30, 18, 8, '#fff'); gfx.text(st.label, x + 17, y - 28, '#333', { align: 'center', font: 'small' }); }
  });
  def('fluor', 40, 4, (g, x, y, t, st) => { const on = !st || st.on !== false; const flick = st && st.flicker && Math.sin(t * 37 + x) > 0.92; rect(x, y - 4, 40, 4, '#c8c8d0'); rect(x + 2, y - 3, 36, 2, on && !flick ? '#f4f8ff' : '#888'); if (on && !flick) { g.globalAlpha = 0.08; gfx.tri(x - 20, y + 60, x + 60, y + 60, x + 20, y, '#f4f8ff'); g.globalAlpha = 1; } });
  def('nurseDesk', 60, 30, (g, x, y, t, st) => {
    rect(x, y - 30, 60, 30, '#3f5f8f'); hl(x, y - 30, 60, '#5f7faf'); rect(x, y - 32, 60, 3, '#d8dce4'); rect(x + 4, y - 22, 52, 10, '#2f4f7f');
    // monitor, papers, phone, plant, cup
    rect(x + 8, y - 44, 14, 10, '#222'); rect(x + 9, y - 43, 12, 8, '#4a8ad0'); for (let i = 0; i < 3; i++) hl(x + 10, y - 41 + i * 2, 6 + i * 2, '#a0d0ff'); rect(x + 13, y - 34, 4, 2, '#333');
    rect(x + 26, y - 34, 10, 2, '#fff'); rect(x + 27, y - 35, 8, 1, '#eee'); rect(x + 40, y - 36, 8, 4, '#222'); rect(x + 40, y - 34, 8, 2, '#333');
    ell(x + 54, y - 36, 3, 2, '#4f9d3a'); rect(x + 52, y - 35, 4, 3, '#c86a3a');
    rect(x + 30, y - 38, 3, 5, '#f4f1ea'); px(x + 31, y - 39, '#c8352b');
  });
  def('ivStand', 10, 50, (g, x, y, t, st) => { rect(x + 4, y - 48, 2, 48, '#aab'); rect(x, y - 2, 10, 2, '#aab'); rect(x + 2, y - 50, 6, 2, '#aab'); rect(x + 2, y - 46, 5, 12, 'rgba(180,220,255,0.7)'); fr(x + 2, y - 46, 5, 12, '#ccd'); rect(x + 3, y - 40, 3, 5, '#9fdcff'); if (t !== undefined) { const k = (t * 0.8) % 1; px(x + 4, y - 34 + Math.floor(k * 12), '#9fdcff'); } ln(x + 4, y - 22, x - 6, y - 10, '#cde'); });
  def('monitor', 22, 40, (g, x, y, t, st) => {
    rect(x + 9, y - 30, 4, 30, '#8a8a94'); rect(x + 2, y - 2, 18, 2, '#8a8a94');
    rect(x, y - 40, 22, 14, '#222'); rect(x + 1, y - 39, 20, 12, '#0a1a10');
    // ekg line
    const flat = st && st.flat;
    for (let i = 0; i < 19; i++) {
      const ph = ((t * 1.4 + i * 0.05) % 1);
      let v = 0; if (!flat) { if (ph > 0.1 && ph < 0.14) v = -2; else if (ph > 0.14 && ph < 0.18) v = 5; else if (ph > 0.18 && ph < 0.22) v = -3; else if (ph > 0.3 && ph < 0.4) v = 1.5 * Math.sin((ph - 0.3) * 30); }
      px(x + 2 + i, y - 33 - Math.round(v), i > 15 ? '#8f8' : '#4f4');
    }
    gfx.text(flat ? '--' : String(58 + Math.round(Math.sin(t) * 2)), x + 19, y - 39, '#f55', { align: 'right', font: 'small' });
  });
  def('hBed', 70, 34, (g, x, y, t, st) => {
    rect(x + 2, y - 26, 4, 26, '#aab'); rect(x + 64, y - 22, 4, 22, '#aab'); rect(x, y - 30, 8, 12, '#d8dce4'); rect(x + 62, y - 26, 8, 8, '#d8dce4');
    rect(x + 4, y - 18, 62, 6, '#aab'); rect(x + 6, y - 22, 58, 5, '#f4f4f8');
    rect(x + 20, y - 24, 44, 8, '#8fb8d8'); hl(x + 20, y - 24, 44, '#a8ccec'); for (let i = 0; i < 4; i++) hl(x + 22 + i * 10, y - 20, 6, '#7aa8cc');
    rect(x + 8, y - 26, 12, 5, '#fff'); // pillow
    ell(x + 8, y - 2, 3, 2, '#666'); ell(x + 62, y - 2, 3, 2, '#666');
    // chart on foot
    rect(x + 66, y - 22, 5, 7, '#fff'); hl(x + 67, y - 20, 3, '#888'); hl(x + 67, y - 18, 3, '#888');
  });
  def('wheelchair', 20, 22, (g, x, y) => { ell(x + 6, y - 6, 6, 6, '#333'); ell(x + 6, y - 6, 4, 4, '#888'); ell(x + 16, y - 3, 3, 3, '#333'); rect(x + 4, y - 20, 3, 12, '#3b6fd6'); rect(x + 4, y - 10, 12, 3, '#3b6fd6'); rect(x + 6, y - 21, 9, 2, '#333'); });
  def('gurney', 50, 26, (g, x, y) => { rect(x + 4, y - 20, 42, 6, '#d8dce4'); rect(x + 6, y - 22, 38, 3, '#fff'); rect(x + 8, y - 14, 3, 12, '#aab'); rect(x + 39, y - 14, 3, 12, '#aab'); ell(x + 9, y - 2, 3, 2, '#333'); ell(x + 40, y - 2, 3, 2, '#333'); });
  def('extinguisher', 8, 18, (g, x, y) => { rect(x + 2, y - 16, 5, 14, '#c8352b'); rect(x + 3, y - 18, 3, 2, '#333'); px(x + 1, y - 17, '#333'); rect(x, y - 18, 9, 1, '#888'); hl(x + 2, y - 10, 5, '#fff'); });
  def('sanitizer', 8, 14, (g, x, y) => { rect(x, y - 12, 8, 10, '#fff'); rect(x + 2, y - 14, 4, 2, '#3b6fd6'); rect(x + 2, y - 9, 4, 5, '#9fdcff'); });
  def('hPoster', 20, 26, (g, x, y, t, st) => { rect(x, y - 26, 20, 26, '#fff'); fr(x, y - 26, 20, 26, '#8a8a94'); const v = (st && st.variant) || 0; if (v === 0) { ell(x + 10, y - 16, 5, 5, '#f0a0b0'); ell(x + 10, y - 16, 3, 3, '#c8352b'); gfx.text('WASH', x + 10, y - 9, '#333', { align: 'center', font: 'small' }); gfx.text('PAWS', x + 10, y - 4, '#333', { align: 'center', font: 'small' }); } else { rect(x + 3, y - 22, 14, 12, '#4f9d3a'); gfx.text('EAT', x + 10, y - 9, '#333', { align: 'center', font: 'small' }); gfx.text('VEG', x + 10, y - 4, '#333', { align: 'center', font: 'small' }); } });
  def('waterFountain', 14, 26, (g, x, y) => { rect(x, y - 26, 14, 26, '#aab'); hl(x, y - 26, 14, '#ccd'); rect(x + 2, y - 24, 10, 3, '#888'); rect(x + 6, y - 28, 2, 3, '#ccd'); px(x + 8, y - 27, '#9fdcff'); });
  def('elevator', 44, 66, (g, x, y, t, st) => { rect(x - 3, y - 70, 50, 70, '#8a8a94'); rect(x, y - 66, 44, 66, '#c8ccd4'); vl(x + 22, y - 66, 66, '#666'); rect(x + 14, y - 74, 16, 6, '#222'); gfx.text((st && st.floor) || '4', x + 22, y - 73, '#f44', { align: 'center', font: 'small' }); rect(x + 46, y - 40, 4, 8, '#333'); px(x + 47, y - 38, '#f80'); px(x + 47, y - 35, '#8f8'); });
  def('hTV', 30, 22, (g, x, y, t) => { rect(x, y - 22, 30, 20, '#222'); rect(x + 2, y - 20, 26, 16, '#3a5a8a'); rect(x + 4, y - 18, 22, 8, '#6a8aba'); for (let i = 0; i < 3; i++) hl(x + 4, y - 8 + i * 2, 10 + i * 4, '#fff'); rect(x + 12, y - 2, 6, 2, '#222'); });
  def('hClock', 12, 12, (g, x, y, t) => { ell(x + 6, y - 6, 6, 6, '#333'); ell(x + 6, y - 6, 5, 5, '#fff'); const s = ((t || 0) % 60) / 60 * Math.PI * 2 - Math.PI / 2; const h = (CH.state.hour / 12) * Math.PI * 2 - Math.PI / 2; ln(x + 6, y - 6, x + 6 + Math.cos(h) * 3, y - 6 + Math.sin(h) * 3, '#222'); ln(x + 6, y - 6, x + 6 + Math.cos(s) * 4, y - 6 + Math.sin(s) * 4, '#c8352b'); });
  def('bedsideTable', 16, 18, (g, x, y) => { rect(x, y - 18, 16, 18, '#d8dce4'); hl(x, y - 18, 16, '#eef'); rect(x + 3, y - 14, 10, 4, '#aab'); rect(x + 3, y - 8, 10, 4, '#aab'); // flowers + cup
    rect(x + 3, y - 24, 4, 6, '#9fdcff'); px(x + 4, y - 26, '#f0a0b0'); px(x + 5, y - 27, '#f5c33b'); px(x + 3, y - 26, '#c85a8a'); rect(x + 10, y - 22, 4, 4, '#fff'); });
  def('curtainRail', 60, 40, (g, x, y) => { rect(x, y - 40, 60, 2, '#aab'); for (let i = 0; i < 60; i += 4) rect(x + i, y - 38, 3, 36, i % 8 ? '#8fb8d8' : '#7aa8cc'); });

  // generic drawer: draws prop by name
  CH.drawProp = (name, g, x, y, t, st) => { const p = PR[name]; if (p) p.draw(g, x, y, t, st); };
})(window.CH);
