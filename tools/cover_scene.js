// The itch.io cover as a scene the game draws itself, with its own sprites,
// fonts, logo and shader. Loaded by tools/cover.mjs; not part of the game.
// The cover is the 315x250 frame (FX, FY) inside the 480x270 screen.
(function (CH) {
  const gfx = CH.gfx, PX = CH.PIX, W = CH.W, H = CH.H;
  const FX = 82, FY = 10, FW = 315, FH = 250;
  const HORIZON = 176; // where the snow starts, in frame pixels
  const CX = 150;      // Chubby, dead centre
  const withA = (a, fn) => { const g = gfx.cur; const o = g.globalAlpha; g.globalAlpha = o * a; fn(); g.globalAlpha = o; };
  const layer = (w, h, fn) => {
    const c = gfx.makeCanvas(w, h), x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    gfx.pushTarget(x);
    try { fn(x); } finally { gfx.popTarget(); }
    return c;
  };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const dith = (x, y) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
  const emit = (x, y, r, c, a) => CH.emit(FX + x, FY + y, r, c, a);

  // ---- the sky: night, warming to a glow over the town ----------------------------
  const SKY = ['#0a0820', '#0e0b2a', '#130e36', '#191243', '#20164f', '#2a1b5a', '#372063', '#4a2768', '#62306b', '#7d3a6a', '#9a4666', '#b8565e'];
  function paintSky() {
    return layer(FW, HORIZON + 4, (g) => {
      for (let y = 0; y < HORIZON + 4; y++) {
        const u = Math.pow(y / HORIZON, 1.15) * (SKY.length - 1);
        const i = Math.floor(u), f = u - i;
        for (let x = 0; x < FW; x++) {
          const c = SKY[Math.min(SKY.length - 1, f > dith(x, y) ? i + 1 : i)];
          g.fillStyle = c; g.fillRect(x, y, 1, 1);
        }
      }
      // a soft burst of light behind Chubby, in wedges like a comic cover
      const cx = CX + 6, cy = 140;
      for (let y = 0; y < HORIZON + 4; y++) for (let x = 0; x < FW; x++) {
        const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
        if (d > 175) continue;
        const a = Math.atan2(dy, dx), wedge = ((a / (Math.PI * 2)) * 22 + 22) % 1 < 0.5;
        if (!wedge) continue;
        const k = Math.pow(1 - d / 175, 1.4) * 0.34;
        if (k > dith(x, y) * 0.5) { g.globalAlpha = k; g.fillStyle = '#ffb36a'; g.fillRect(x, y, 1, 1); g.globalAlpha = 1; }
      }
      // stars, thinning out toward the warm horizon
      const rng = new CH.Rng(11);
      for (let i = 0; i < 120; i++) {
        const x = rng.int(0, FW - 1), y = rng.int(0, 120);
        if (rng.next() > 1 - y / 150) continue;
        const c = rng.pick(['#ffffff', '#cfe0ff', '#fff2c0', '#b8c8ff']);
        g.globalAlpha = 0.5 + rng.next() * 0.5; g.fillStyle = c; g.fillRect(x, y, 1, 1);
        if (rng.next() < 0.08) { g.globalAlpha = 0.5; g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); }
      }
      g.globalAlpha = 1;
    });
  }
  // two aurora curtains across the top, behind the logo
  function paintAurora() {
    return layer(FW, 120, (g) => {
      const band = (base, amp, len, cols, alpha, seed) => {
        for (let x = 0; x < FW; x++) {
          const hem = base + Math.sin(x * 0.028 + seed) * amp + Math.sin(x * 0.067 + seed * 2.1) * amp * 0.45;
          const fold = 0.55 + 0.45 * Math.sin(x * 0.21 + seed * 3) * Math.sin(x * 0.043 + seed);
          for (let y = Math.max(0, Math.floor(hem - len)); y <= hem + 1; y++) {
            const u = (y - (hem - len)) / len;
            const a = Math.pow(CH.clamp(u, 0, 1), 2.3) * alpha * fold;
            if (a < 0.02) continue;
            g.globalAlpha = a;
            g.fillStyle = u > 0.96 ? cols[2] : u > 0.75 ? cols[1] : cols[0];
            g.fillRect(x, y, 1, 1);
          }
        }
        g.globalAlpha = 1;
      };
      band(40, 9, 44, ['#5a3ad0', '#9a7aff', '#e0d0ff'], 0.55, 4.2);
      band(70, 12, 52, ['#1aa88a', '#4aeab0', '#d8ffe8'], 0.7, 1.3);
    });
  }

  // ---- the town across the street ------------------------------------------------
  function paintTown() {
    const lights = [];
    const c = layer(FW, 80, (g) => {
      const base = 64; // street level inside this layer
      const rng = new CH.Rng(23);
      // far hills
      for (let x = 0; x < FW; x++) {
        const h = 18 + Math.sin(x * 0.02 + 1) * 6 + Math.sin(x * 0.07) * 3;
        gfx.rect(x, base - h - 10, 1, h + 10, '#251a48');
        gfx.rect(x, base - h - 10, 1, 1, '#4a4486');
      }
      const house = (x, w, h, col, roof) => {
        const top = base - h;
        gfx.rect(x, top, w, h, col);
        gfx.rect(x, top, 1, h, gfx.shade(col, 12));
        if (roof === 'peak') {
          const rh = Math.round(w * 0.45);
          for (let i = 0; i < rh; i++) { const ww = Math.max(1, Math.round(w + 2 - (i / rh) * (w + 2))); gfx.rect(x - 1 + Math.round((w + 2 - ww) / 2), top - i - 1, ww, 1, '#1a1230'); }
          for (let i = 0; i < rh; i++) { const ww = Math.max(1, Math.round(w + 2 - (i / rh) * (w + 2))); gfx.rect(x - 1 + Math.round((w + 2 - ww) / 2), top - i - 2, ww, 1, i > rh * 0.25 ? '#dfe8ff' : '#aab8e8'); }
        } else {
          gfx.rect(x - 1, top - 2, w + 2, 2, '#dfe8ff');
          gfx.rect(x - 1, top, w + 2, 1, '#8c9ad0');
        }
        for (let wy = top + 4; wy < base - 6; wy += 7) for (let wx = x + 3; wx < x + w - 3; wx += 5) {
          if (rng.next() < 0.45) { gfx.rect(wx, wy, 2, 3, '#140e26'); continue; }
          const col2 = rng.pick(['#ffd27a', '#ffc25a', '#ffe6a8', '#ffb04a']);
          gfx.rect(wx, wy, 2, 3, col2);
          lights.push({ x: wx + 1, y: wy + 1, c: col2 });
        }
      };
      let x = -4;
      while (x < FW) {
        const w = rng.int(16, 30), h = rng.int(22, 46);
        if (x > 226 && x < 300) { x += 4; continue; } // room for Donald's
        house(x, w, h, rng.pick(['#1d1636', '#221a40', '#191230', '#26203f']), rng.next() < 0.5 ? 'peak' : 'flat');
        x += w + rng.int(1, 4);
      }
      // the town hall clock tower
      gfx.rect(36, base - 66, 14, 66, '#211a3e'); gfx.rect(36, base - 66, 1, 66, '#2e2654');
      for (let i = 0; i < 9; i++) gfx.rect(35 + Math.round(i * 0.8), base - 67 - i, 16 - Math.round(i * 1.6), 1, i > 2 ? '#dfe8ff' : '#aab8e8');
      gfx.circle(43, base - 54, 4, '#2a2030'); gfx.circle(43, base - 54, 3, '#f4e8c0');
      gfx.line(43, base - 54, 43, base - 56, '#3a2a20'); gfx.line(43, base - 54, 45, base - 53, '#3a2a20');
      lights.push({ x: 43, y: base - 54, c: '#ffe8b0', r: 6 });
      // Donald's: a low red diner with big warm windows
      const dx = 240, dw = 52, dh = 26;
      gfx.rect(dx, base - dh, dw, dh, '#7a1f1a'); gfx.rect(dx, base - dh, dw, 2, '#c8352b');
      gfx.rect(dx - 2, base - dh - 3, dw + 4, 3, '#dfe8ff');
      for (let i = 0; i < 5; i++) { gfx.rect(dx + 3 + i * 10, base - dh + 7, 8, 11, '#ffd88a'); gfx.rect(dx + 3 + i * 10, base - dh + 7, 8, 2, '#fff2c8'); }
      gfx.rect(dx + 2, base - dh + 4, dw - 4, 2, '#f5c33b');
      lights.push({ x: dx + dw / 2, y: base - dh + 11, c: '#ffcf7a', r: 14, a: 0.5 });
      // the pole for the big D
      gfx.rect(dx + 31, base - dh - 40, 3, 40, '#3a2a38');
      // snowbank along the far kerb
      for (let x2 = 0; x2 < FW; x2++) {
        const h2 = 2 + Math.round(Math.sin(x2 * 0.15) * 1.2 + Math.sin(x2 * 0.05) * 1.5);
        gfx.rect(x2, base - h2, 1, h2, '#c9d6f2');
        gfx.rect(x2, base - h2, 1, 1, '#f2f6ff');
      }
    });
    return { c, lights, oy: HORIZON - 64 };
  }

  // ---- the street, snow, lamps ---------------------------------------------------------
  function paintGround() {
    return layer(FW, FH - HORIZON, (g) => {
      const h = FH - HORIZON;
      for (let y = 0; y < h; y++) {
        const u = y / h;
        for (let x = 0; x < FW; x++) {
          const c = u < 0.18 ? (dith(x, y) < 0.5 ? '#8e9cc8' : '#9aa8d4') : u < 0.3 ? '#b6c4e8' : (dith(x, y) < u * 0.6 ? '#e6eeff' : '#d2dcf6');
          g.fillStyle = c; g.fillRect(x, y, 1, 1);
        }
      }
      // tyre ruts in the street
      for (let x = 0; x < FW; x += 1) { gfx.rect(x, 4 + Math.round(Math.sin(x * 0.05) * 0.6), 1, 1, '#7c88b6'); gfx.rect(x, 9 + Math.round(Math.sin(x * 0.04 + 2) * 0.6), 1, 1, '#7c88b6'); }
      // glints in the snow
      const rng = new CH.Rng(31);
      for (let i = 0; i < 60; i++) { const x = rng.int(0, FW - 1), y = rng.int(18, h - 1); g.fillStyle = rng.next() < 0.5 ? '#ffffff' : '#bfe8ff'; g.fillRect(x, y, 1, 1); }
      // a soft drift along the front edge
      for (let x = 0; x < FW; x++) { const d = Math.round(3 + Math.sin(x * 0.045) * 2 + Math.sin(x * 0.13) * 1); g.fillStyle = '#f4f8ff'; g.fillRect(x, h - d, 1, d); g.fillStyle = '#c4d2f0'; g.fillRect(x, h - d - 1, 1, 1); }
      // footprints leading to Chubby
      for (let i = 0; i < 9; i++) { const x = 4 + i * 11, y = 34 + (i % 2) * 4; gfx.ellipse(x, y, 2, 1, '#aebde4'); }
    });
  }
  function lamp(x, yBase, t) {
    gfx.rect(x, yBase - 46, 2, 46, '#1a1426');
    gfx.rect(x - 4, yBase - 48, 10, 2, '#1a1426');
    gfx.rect(x - 3, yBase - 46, 8, 3, '#ffe2a0');
    gfx.rect(x - 4, yBase - 50, 10, 2, '#eef4ff');
    emit(x + 1, yBase - 44, 18, '#ffcf7a', 0.65);
  }

  // ---- the big D sign ------------------------------------------------------------------
  function drawSign(x, y) {
    const w = 30, h = 30;
    gfx.rrect(x - 2, y - 2, w + 4, h + 4, 7, '#2a0c0a');
    gfx.rrect(x, y, w, h, 6, '#d83a2a');
    gfx.rrect(x + 2, y + 2, w - 4, 3, 2, '#f0705a');
    const g = gfx.cur;
    g.save(); g.translate(x + w / 2, y + 5); g.scale(2, 2);
    gfx.text('D', 0, 0, '#ffd84a', { align: 'center', shadow: '#8a1a10' });
    g.restore();
    gfx.rect(x - 3, y - 4, w + 6, 2, '#eef4ff'); // snow on top
    emit(x + w / 2, y + h / 2, 34, '#ff5a2a', 0.85);
    emit(x + w / 2, y + h / 2, 14, '#ffd84a', 0.7);
  }

  // ---- Chubby, three times life size ------------------------------------------------------
  function chubbyArt() {
    return layer(90, 90, () => {
      CH.drawChubby(gfx.cur, 45, 80, { outfit: 'hoodie', hat: 'visor', face: 'grin', arm: 'cheer', noShadow: true, sx: 0.97, sy: 1.05, quillTilt: -0.2, lookY: -0.3 });
    });
  }
  const sprite = (name) => PX.canvas(name);
  function coin(g, x, y, s, phase) {
    // a spinning gold coin: wide, then edge-on
    const w = Math.max(1, Math.round(4 * Math.abs(Math.cos(phase)))) ;
    const c = layer(11, 11, () => {
      gfx.ellipse(5, 5, w + 1, 5, '#7a5208');
      gfx.ellipse(5, 5, w, 4, '#f5c33b');
      if (w > 2) { gfx.rect(5, 3, 1, 5, '#c48e17'); gfx.rect(4, 3, 3, 1, '#c48e17'); gfx.rect(4, 7, 3, 1, '#c48e17'); }
      gfx.px(5 - Math.max(0, w - 2), 2, '#fff6c8');
    });
    g.drawImage(c, Math.round(x - 5.5 * s), Math.round(y - 5.5 * s), 11 * s, 11 * s);
  }
  function flying(g, name, x, y, s, vx, vy, flip) {
    const c = typeof name === 'string' ? sprite(name) : name;
    const w = c.width * s, h = c.height * s;
    // a short smear of motion behind it
    for (let k = 3; k >= 1; k--) withA(0.12 * (4 - k) / 3, () => {
      g.save(); g.translate(Math.round(x - vx * k * 3), Math.round(y - vy * k * 3)); if (flip) g.scale(-1, 1);
      g.drawImage(c, Math.round(-w / 2), Math.round(-h / 2), w, h); g.restore();
    });
    g.save(); g.translate(Math.round(x), Math.round(y)); if (flip) g.scale(-1, 1);
    g.drawImage(c, Math.round(-w / 2), Math.round(-h / 2), w, h); g.restore();
  }
  function sparkle(x, y, c) {
    gfx.rect(x - 2, y, 5, 1, c); gfx.rect(x, y - 2, 1, 5, c); gfx.px(x, y, '#ffffff');
  }

  class CoverScene extends CH.Scene {
    constructor(opts = {}) {
      super(); this.name = 'cover'; this.opts = opts;
      this.sky = paintSky(); this.aurora = paintAurora(); this.town = paintTown(); this.ground = paintGround();
      this.chubby = chubbyArt();
      // a cream silhouette of him, for a sticker outline that lifts him off the night
      this.halo = layer(90, 90, (g) => { g.drawImage(this.chubby, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#fff1cc'; g.fillRect(0, 0, 90, 90); g.globalCompositeOperation = 'source-over'; });
      // the kitchen's own fries box and soda, straight from the minigames
      this.fries = layer(24, 34, (g) => CH.FOOD.friesBox(g, 12, 31, 1, 'L'));
      this.soda = layer(30, 44, (g) => CH.FOOD.cup(g, 15, 38, 1, 'L', '#5a2a10', true));
      const rng = new CH.Rng(5);
      this.flakes = Array.from({ length: 80 }, () => ({ x: rng.int(0, FW), y: rng.int(0, FH), s: rng.next() < 0.3 ? 2 : 1, a: 0.5 + rng.next() * 0.5 }));
    }
    update() {}
    draw(g) {
      const t = 3.0;
      gfx.rect(0, 0, W, H, '#0a0820');
      g.save(); g.translate(FX, FY);
      g.drawImage(this.sky, 0, 0);
      g.drawImage(this.aurora, 0, 0);
      const T = this.town;
      g.drawImage(T.c, 0, T.oy);
      for (const L of T.lights) emit(L.x, T.oy + L.y, L.r || 3, L.c, L.a || 0.45);
      drawSign(258, 96);
      g.drawImage(this.ground, 0, HORIZON);
      lamp(36, HORIZON + 20, t); lamp(284, HORIZON + 20, t);
      // Chubby leaps; his shadow stays on the snow
      const cx = CX, feet = 224;
      withA(0.35, () => gfx.ellipse(cx + 4, 240, 30, 5, '#2a2050'));
      for (const [ox, oy] of [[-3, 0], [3, 0], [0, -3], [0, 3], [-2, -2], [2, -2], [-2, 2], [2, 2]]) g.drawImage(this.halo, cx - 45 * 3 + ox, feet - 80 * 3 + oy, 90 * 3, 90 * 3);
      g.drawImage(this.chubby, cx - 45 * 3, feet - 80 * 3, 90 * 3, 90 * 3);
      // cheer marks by both paws
      for (const [px, py, d] of [[cx + 52, 128, 1], [cx - 30, 128, -1]]) {
        for (const [a, l] of [[-0.9, 9], [-0.35, 11], [0.25, 8]]) {
          const ang = (d > 0 ? 0 : Math.PI) + a * d;
          const x0 = px + Math.cos(ang) * 8, y0 = py + Math.sin(ang) * 8 - 10;
          for (let k = 0; k < l; k += 1) gfx.rect(Math.round(x0 + Math.cos(ang) * k), Math.round(y0 + Math.sin(ang) * k), 2, 2, '#fff6d8');
        }
      }
      // food everywhere, as if he just threw it all in the air
      flying(g, 'burger', 236, 108, 3, 1.2, -1, false);
      flying(g, this.fries, 56, 132, 2, -1.1, -1, true);
      flying(g, 'donut', 70, 88, 2, -0.8, -1.2, false);
      flying(g, 'pancakes', 34, 196, 2, -1.2, 0.3, false);
      flying(g, 'nugget', 238, 214, 2, 1.1, 0.4, true); flying(g, 'nugget', 254, 204, 2, 1.1, 0.4, false);
      flying(g, this.soda, 274, 176, 2, 1.3, -0.5, false);
      coin(g, 214, 150, 2, 0.3); coin(g, 92, 150, 2, 1.2); coin(g, 296, 132, 2, 0.6); coin(g, 22, 150, 2, 1.45); coin(g, 108, 196, 2, 0.1); coin(g, 206, 196, 2, 0.9);
      sparkle(222, 92, '#fff2a0'); sparkle(46, 108, '#fff2a0'); sparkle(288, 152, '#ffffff'); sparkle(118, 92, '#ffffff'); sparkle(184, 178, '#fff2a0');
      // pines frame the shot at both edges
      PX.pine(4, 252, 110, { seed: 3 }); PX.pine(312, 252, 96, { seed: 7, flip: true });
      // falling snow, in front of everything
      for (const f of this.flakes) withA(f.a, () => gfx.rect(f.x, f.y, f.s, f.s, '#ffffff'));
      g.restore();
      // a soft vignette pulls the eye to the middle
      const vg = g.createRadialGradient(FX + FW / 2, FY + FH * 0.55, FH * 0.35, FX + FW / 2, FY + FH * 0.55, FH * 0.95);
      vg.addColorStop(0, 'rgba(8,4,24,0)'); vg.addColorStop(1, 'rgba(8,4,24,0.55)');
      g.fillStyle = vg; g.fillRect(FX, FY, FW, FH);
      // the logo sits on the interface layer, out of the shader's grade
      CH.drawUI(g, () => {
        const L = CH.titleLogo(), cx = FX + FW / 2, top = FY + 6;
        const x0 = Math.round(cx - L.main.w / 2);
        for (const ch of L.main.letters) if (!ch.space) gfx.cur.drawImage(ch.c, x0 + ch.x - 3, top);
        const sx0 = Math.round(cx - L.sub.w / 2);
        for (const ch of L.sub.letters) if (!ch.space) gfx.cur.drawImage(ch.c, sx0 + ch.x - 1, top + 44);
      });
      CH.post.mood = { tint: [1.02, 0.99, 1.04], vib: 0.4, lift: 0.025, glowK: 1.5 };
    }
  }
  CH.CoverScene = CoverScene;
})(window.CH);
