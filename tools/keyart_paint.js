// Compositions for tools/keyart.mjs. Everything here is painted with the
// game's own primitives and characters - no imported art.
(function () {
  const gfx = CH.gfx, art = CH.art;
  const SKY = ['#20264a', '#2f3560', '#4a4270', '#7a5a86', '#c08a8a', '#e8b48a'];

  function snowGround(y, w, h) {
    gfx.vgrad(0, y, w, h - y, ['#eef4fa', '#dfe8f4', '#cfdcec']);
    for (let i = 0; i < 40; i++) gfx.ellipse((i * 137) % w, y + 6 + (i * 53) % (h - y - 6), 18 + (i % 5) * 9, 4 + (i % 3) * 2, i % 2 ? '#ffffff' : '#e6eef8');
  }
  function skyline(w, y) {
    for (let i = 0; i < 7; i++) {
      const x = -40 + i * (w / 5.5), pk = 70 + (i % 3) * 26;
      gfx.tri(x - 90, y, x + 90, y, x, y - pk, '#6a6a96');
      gfx.tri(x - 34, y - pk + 40, x + 34, y - pk + 40, x, y - pk, '#e9f1f7');
    }
  }
  function pine(x, y, h, c) {
    gfx.rect(x - 3, y - 12, 6, 12, '#452a16');
    for (let i = 0; i < 4; i++) {
      const k = i / 4, wdt = (h * 0.46) * (1 - k * 0.62), top = y - 10 - h * (k + 0.34);
      gfx.tri(x - wdt, y - 6 - h * k * 0.82, x + wdt, y - 6 - h * k * 0.82, x, top, c);
      gfx.tri(x - wdt * 0.8, y - 9 - h * k * 0.82, x + wdt * 0.8, y - 9 - h * k * 0.82, x, top + 4, '#e9f1f7');
    }
  }
  function flakes(w, h, n, seed) {
    const rng = new CH.Rng(seed);
    for (let i = 0; i < n; i++) {
      const x = rng.range(0, w), y = rng.range(0, h), r = rng.range(0.8, 2.4);
      gfx.ellipse(x, y, r, r, 'rgba(255,255,255,' + rng.range(0.35, 0.95).toFixed(2) + ')');
    }
  }
  // a chunky outlined word, drawn at any size
  function bigWord(text, cx, y, scale, fill, ink) {
    const ctx = gfx.cur;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      ctx.save(); ctx.translate(cx + dx * scale, y + dy * scale); ctx.scale(scale, scale);
      gfx.text(text, 0, 0, ink, { align: 'center' });
      ctx.restore();
    }
    ctx.save(); ctx.translate(cx, y); ctx.scale(scale, scale);
    gfx.text(text, 0, 0, fill, { align: 'center' });
    ctx.restore();
  }

  function sparkle(x, y, s, col) { gfx.rect(x - s, y, s * 2 + 1, 1, col); gfx.rect(x, y - s, 1, s * 2 + 1, col); gfx.rect(x - 1, y - 1, 3, 3, col); }

  // the store thumbnail: just the name, and him, delighted about it
  // The store thumbnail: Chubby on shift, mopping the floor at Donald's.
  // No words anywhere - the wet-floor sign is a pictogram. u is the loop phase
  // 0..1 for the animated version; undefined gives the still.
  window.paintThumbnail = function (ctx, w, h, u) {
    const anim = u !== undefined, k = anim ? u : 0.19, TAU = Math.PI * 2;
    const ph = k * TAU * 2;                        // two mop strokes per loop
    const sw = Math.sin(ph);                       // -1 back .. +1 pushed out
    const FLOOR = 332;
    // ---- the wall: cream tile, the red-and-gold band, a window, a picture ----
    gfx.rect(0, 0, w, FLOOR, '#f4e7c8');
    for (let y = 8; y < FLOOR; y += 22) gfx.rect(0, y, w, 1, '#e3d2ae');
    for (let y = 8, r = 0; y < FLOOR; y += 22, r++) for (let x = (r % 2) * 16; x < w; x += 32) gfx.rect(x, y, 1, 22, '#e3d2ae');
    gfx.rect(0, 246, w, 20, '#c8352b'); gfx.rect(0, 246, w, 3, '#e0584c'); gfx.rect(0, 266, w, 5, '#f5c33b'); gfx.rect(0, 271, w, 2, '#b8901c');
    gfx.rect(0, 273, w, FLOOR - 273, '#e8d6b0');
    // window on the winter outside
    gfx.rect(24, 56, 132, 132, '#8a5a2b'); gfx.rect(30, 62, 120, 120, '#2a3552');
    gfx.vgrad(30, 62, 120, 120, ['#6a88b8', '#a8c0e0', '#dfe8f4']);
    gfx.rect(30, 150, 120, 32, '#f2f6fb');
    for (let i = 0; i < 4; i++) { const x = 42 + i * 30, hh = 34 + (i % 2) * 12; gfx.tri(x - 13, 152, x + 13, 152, x, 152 - hh, '#2f6a24'); gfx.tri(x - 8, 152 - hh * 0.45, x + 8, 152 - hh * 0.45, x, 152 - hh, '#e9f1f7'); }
    const flakeR = new CH.Rng(9);
    for (let i = 0; i < 18; i++) { const x = 32 + flakeR.range(0, 116), y0 = flakeR.range(0, 120), y = 62 + ((y0 + k * 120) % 120); gfx.rect(Math.round(x + Math.sin(k * TAU + i) * 2), Math.round(y), 2, 2, '#ffffff'); }
    gfx.rect(88, 62, 4, 120, '#8a5a2b'); gfx.rect(30, 120, 120, 4, '#8a5a2b');
    gfx.rect(18, 186, 144, 8, '#6b4422'); gfx.rect(18, 186, 144, 2, '#a8723a');
    // a framed burger, because this is that kind of restaurant
    gfx.rect(318, 64, 128, 104, '#3a2418'); gfx.rect(324, 70, 116, 92, '#ffe9a8');
    gfx.ellipse(382, 104, 34, 14, '#d8943a'); gfx.ellipse(382, 100, 34, 12, '#eab25a');
    for (let i = 0; i < 5; i++) gfx.ellipse(366 + i * 8, 96, 1.5, 1, '#fff3c8');
    gfx.rect(348, 112, 68, 6, '#4f9a3a'); gfx.rect(346, 118, 72, 9, '#7a3f22'); gfx.rect(350, 127, 64, 5, '#f5c33b');
    gfx.ellipse(382, 136, 34, 8, '#d8943a');
    // pendant lamps and the warm light they throw
    for (const lx of [214, 440]) {
      gfx.rect(lx - 1, 0, 2, 34, '#3a3440');
      gfx.tri(lx - 20, 50, lx + 20, 50, lx, 32, '#c8352b'); gfx.rect(lx - 20, 48, 40, 3, '#8f2419');
      gfx.ellipse(lx, 52, 8, 4, '#fff6d0');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.07;
      gfx.tri(lx - 16, 52, lx + 16, 52, lx + 118, FLOOR + 60, '#ffd98a'); gfx.tri(lx - 16, 52, lx - 118, FLOOR + 60, lx + 118, FLOOR + 60, '#ffd98a');
      ctx.restore();
    }
    // ---- the floor: red and white check running away to the back wall ------
    const vx = w / 2, vy = FLOOR - 160;               // vanishing point above the counter
    const rows = [0, 14, 31, 52, 78, 110, 150];
    const col = (i) => ((i % 2) ? '#c8352b' : '#fbf5ea');
    for (let r = 0; r < rows.length - 1; r++) {
      const y0 = FLOOR + rows[r], y1 = FLOOR + rows[r + 1];
      const t0 = (y0 - vy) / (FLOOR - vy), t1 = (y1 - vy) / (FLOOR - vy);
      for (let c = -8; c < 9; c++) {
        const xa = vx + (c * 36) * t0, xb = vx + ((c + 1) * 36) * t0, xc = vx + ((c + 1) * 36) * t1, xd = vx + (c * 36) * t1;
        const cc = col(c + r + 20);
        gfx.tri(xa, y0, xb, y0, xc, y1, cc); gfx.tri(xa, y0, xc, y1, xd, y1, cc);
      }
    }
    gfx.rect(0, FLOOR, w, 3, '#8f2419');
    // the wet, clean shine he has already mopped, and it sparkles
    ctx.save(); ctx.globalAlpha = 0.34; gfx.ellipse(300, FLOOR + 78, 130, 26, '#ffffff'); ctx.globalAlpha = 0.22; gfx.ellipse(230, FLOOR + 86, 170, 34, '#dff4ff'); ctx.restore();
    [[196, 410, 6, 0], [262, 398, 4, 1.4], [356, 424, 7, 2.6], [410, 402, 4, 3.8], [148, 430, 5, 5]].forEach(([x, y, s2, ph2]) => {
      const a = anim ? Math.sin(k * TAU * 2 + ph2) : 0.8;
      if (a > -0.1) sparkle(x, y, Math.max(1, Math.round(s2 * (0.5 + 0.5 * a))), '#ffffff');
    });
    // a ketchup splat still waiting, and the scuff of the one before it
    gfx.ellipse(430, 452, 26, 9, '#a8241c'); gfx.ellipse(426, 450, 20, 6, '#c8352b'); gfx.ellipse(420, 448, 5, 2, '#f07a6a');
    // ---- the mop bucket, suds brimming --------------------------------------
    const bx = 70, by = 438;
    gfx.ellipse(bx, by + 6, 52, 9, 'rgba(40,20,20,0.25)');
    gfx.rect(bx - 44, by - 58, 88, 60, art.INK); gfx.rect(bx - 41, by - 55, 82, 55, '#f5c33b'); gfx.rect(bx - 41, by - 55, 12, 55, '#ffe07a'); gfx.rect(bx + 26, by - 55, 15, 55, '#c8a020');
    gfx.rect(bx - 48, by - 64, 96, 8, art.INK); gfx.rect(bx - 45, by - 62, 90, 5, '#e8b020');
    gfx.rect(bx + 10, by - 86, 26, 24, '#8a8f9c'); gfx.rect(bx + 12, by - 84, 22, 20, '#b8bcc8'); gfx.rect(bx + 22, by - 100, 4, 16, '#6a6f7c');
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; gfx.circle(bx - 20 + Math.cos(a) * 16, by - 66 + Math.sin(a) * 4, 7 + (i % 3), '#ffffff'); }
    gfx.circle(bx - 26, by - 70, 6, '#eaf6ff'); gfx.circle(bx - 10, by - 72, 5, '#eaf6ff');
    gfx.circle(bx - 36, by + 2, 5, '#3a3440'); gfx.circle(bx + 36, by + 2, 5, '#3a3440');
    // ---- the wet-floor sign: a pictogram, no words --------------------------
    const sx = 432, sy = 400;
    gfx.tri(sx - 30, sy, sx - 4, sy - 96, sx + 4, sy - 96, art.INK); gfx.tri(sx + 30, sy, sx - 4, sy - 96, sx + 4, sy - 96, art.INK);
    gfx.tri(sx - 26, sy - 2, sx - 2, sy - 92, sx + 2, sy - 92, '#f5c33b'); gfx.tri(sx + 26, sy - 2, sx - 2, sy - 92, sx + 2, sy - 92, '#e8b020');
    gfx.tri(sx - 14, sy - 34, sx + 14, sy - 34, sx, sy - 66, art.INK); gfx.tri(sx - 11, sy - 36, sx + 11, sy - 36, sx, sy - 62, '#f5c33b');
    gfx.circle(sx - 1, sy - 55, 2.4, art.INK); gfx.line(sx - 1, sy - 52, sx + 2, sy - 44, art.INK); gfx.line(sx + 2, sy - 44, sx + 7, sy - 40, art.INK); gfx.line(sx + 2, sy - 44, sx - 5, sy - 39, art.INK); gfx.line(sx, sy - 49, sx - 6, sy - 51, art.INK);
    gfx.ellipse(sx, sy - 37, 8, 1.5, art.INK);
    // ---- Chubby on shift -----------------------------------------------------
    const S = 5.6, fx0 = 170, fy0 = 406;
    const lean = sw * 0.05, bob = Math.abs(sw) * 1.2;
    ctx.save(); ctx.globalAlpha = 0.25; gfx.ellipse(fx0 + 6, fy0 + 4, 64, 12, '#2a1420'); ctx.restore();
    // the mop, hung from his front paw, head sweeping the floor in front of him
    const hand = { x: fx0 + (14.4 * Math.cos(lean) + 24.4 * Math.sin(lean)) * S, y: fy0 + (-24.4 + bob * 0.5) * S };
    const head = { x: fx0 + (27 + sw * 9) * S, y: fy0 + 10 };
    const dir = Math.cos(ph) > 0 ? 1 : -1;          // which way the head is travelling
    const thick = (x0, y0, x1, y1, wd, c) => {       // a line with real width
      const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L * wd / 2, ny = dx / L * wd / 2;
      gfx.tri(x0 + nx, y0 + ny, x1 + nx, y1 + ny, x1 - nx, y1 - ny, c); gfx.tri(x0 + nx, y0 + ny, x1 - nx, y1 - ny, x0 - nx, y0 - ny, c);
    };
    // the handle runs from above his paw down to the clamp
    const top = { x: hand.x - (head.x - hand.x) * 0.25, y: hand.y - (head.y - 18 - hand.y) * 0.25 };
    thick(top.x, top.y, head.x, head.y - 22, 9, art.INK);
    thick(top.x, top.y, head.x, head.y - 22, 6, '#b87a3a');
    thick(top.x - 1, top.y - 1, head.x - 1, head.y - 23, 2, '#e0a860');
    // clamp and a big fluffy head of strands, trailing behind the stroke
    gfx.rect(head.x - 19, head.y - 30, 38, 13, art.INK); gfx.rect(head.x - 17, head.y - 28, 34, 9, '#8a8f9c'); gfx.rect(head.x - 17, head.y - 28, 34, 3, '#b8bcc8');
    ctx.save(); ctx.globalAlpha = 0.3; gfx.ellipse(head.x - dir * 10, head.y + 6, 50, 9, '#2a1420'); ctx.restore();
    for (let i = 0; i < 17; i++) {
      const s0 = head.x - 18 + i * 2.25;
      const trail = -dir * (8 + (i % 4) * 4) * Math.abs(Math.cos(ph)) + Math.sin(i * 1.7 + ph) * 3;
      const ex = s0 + trail * 1.3 + (i - 8) * 1.9, ey = head.y + 4 + (i % 3);
      thick(s0, head.y - 18, ex, ey, 5, art.INK);
      thick(s0, head.y - 18, ex, ey, 3, i % 3 ? '#efe9d2' : '#d8d2b8');
    }
    // soapy wash where the head is
    ctx.save(); ctx.globalAlpha = 0.6; gfx.ellipse(head.x - dir * 22, head.y + 8, 56, 10, '#ffffff'); ctx.restore();
    for (let i = 0; i < 7; i++) gfx.circle(head.x - dir * (26 + i * 9) + Math.sin(i * 2 + ph) * 3, head.y + 6 + (i % 2) * 3, 3 + (i % 3), '#ffffff');
    // Chubby himself, leaning into it
    ctx.save(); ctx.translate(fx0, fy0); ctx.rotate(lean); ctx.scale(S * (1 + Math.abs(sw) * 0.02), S * (1 - Math.abs(sw) * 0.02));
    CH.drawChubby(ctx, 0, -bob, { face: sw > 0.55 ? 'determined' : 'happy', arm: 'mop', outfit: 'janitor', noShadow: true, walk: anim ? ph * 0.5 : 0, moving: 0.3 });
    ctx.restore();
    // ---- bubbles rising off the suds, sweat flying off him --------------------
    const br = new CH.Rng(31);
    for (let i = 0; i < 16; i++) {
      const fromBucket = i < 6;
      const x0 = fromBucket ? bx - 30 + br.range(0, 50) : head.x - 40 + br.range(0, 80);
      const life = (br.range(0, 1) + k * (fromBucket ? 1 : 2)) % 1;
      const y = (fromBucket ? by - 70 : head.y) - life * (fromBucket ? 170 : 210);
      const x = x0 + Math.sin(life * TAU * 1.5 + i) * 10;
      const r = br.range(3, 8) * (0.7 + life * 0.5);
      if (life > 0.93) continue;                       // pop
      gfx.circle(x, y, r + 1, 'rgba(120,170,210,0.55)'); gfx.circle(x, y, r, 'rgba(235,248,255,0.5)');
      gfx.circle(x - r * 0.35, y - r * 0.35, Math.max(1, r * 0.28), '#ffffff');
    }
    const sweatK = (k * 2) % 1;                         // one drop per stroke
    if (sweatK < 0.45) {
      const t2 = sweatK / 0.45, dx = fx0 + (8 + t2 * 22) * S * 0.9, dy = fy0 - 38 * S + t2 * t2 * 90 - t2 * 40;
      gfx.ellipse(dx, dy, 4, 6, art.INK); gfx.ellipse(dx, dy + 1, 3, 4.6, '#8fd0ff'); gfx.px(dx - 1, dy - 1, '#ffffff');
    }
    // motion arcs by the mop head at the ends of the stroke
    if (Math.abs(Math.cos(ph)) > 0.55) for (let i = 0; i < 3; i++) gfx.line(head.x - dir * (30 + i * 9), head.y - 18 - i * 7, head.x - dir * (46 + i * 9), head.y - 14 - i * 7, 'rgba(255,255,255,0.8)');
    // a soft warm grade and a vignette so it reads as one picture
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.18;
    const vg = ctx.createRadialGradient(w / 2, h * 0.55, w * 0.2, w / 2, h * 0.55, w * 0.75);
    vg.addColorStop(0, '#ffffff'); vg.addColorStop(1, '#6a3a4a');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h); ctx.restore();
  };




  window.paintBanner = function (ctx, w, h) {
    gfx.vgrad(0, 0, w, h * 0.58, SKY);
    flakes(w, h * 0.55, 70, 23);
    gfx.ellipse(w - 150, 44, 20, 20, '#fffbe8');
    skyline(w, h * 0.58);
    snowGround(h * 0.58, w, h);
    // main street: real shopfronts, straight out of the game
    const F = h - 58;
    const shops = (CH.SHOPS || []).slice(0, 5);
    shops.forEach((sh, i) => {
      CH.PROPS.storefront.draw(ctx, 330 + i * 132, F, 1.2, {
        color: sh.color, name: sh.name, textColor: sh.text, sign: sh.sign,
        awning: sh.awning, logo: sh.logo, logoBg: sh.logoBg, display: sh.display,
      });
    });
    for (const x of [300, 460, 620, 780, 940]) CH.PROPS.lamppost.draw(ctx, x, F, 1.2, {});
    // road along the bottom
    gfx.rect(0, F + 16, w, h - F - 16, '#3a3f48');
    gfx.rect(0, F + 16, w, 3, '#e9f1f7');
    for (let x = 10; x < w; x += 46) gfx.rect(x, F + 30, 22, 3, '#ffd84a');
    CH.PROPS.car.draw(ctx, 690, F + 40, 0, { color: '#3b6fd6' });
    // Chubby, walking in, big
    art.shadow(190, F + 2, 30, 0.3);
    ctx.save(); ctx.translate(190, F); ctx.scale(2.2, 2.2);
    CH.drawChubby(ctx, 0, 0, { face: 'determined', arm: 'idle', walk: 1.2, moving: 1, outfit: 'suit', noShadow: true });
    ctx.restore();
    for (const [x, sp] of [[92, 'goose'], [268, 'rabbit']]) {
      ctx.save(); ctx.translate(x, F); ctx.scale(1.5, 1.5);
      CH.drawCritter(ctx, 0, 0, { species: sp, outfit: 'winter', face: 'happy', noShadow: true });
      ctx.restore();
    }
    // title block in the sky
    bigWord('CHUBBY', 186, 34, 4.4, '#ffd84a', '#2a1420');
    bigWord('THE PORCUPINE', 186, 74, 1.9, '#fff3d8', '#2a1420');
    gfx.rrect(64, 100, 244, 22, 6, '#2a1420');
    gfx.rrect(66, 102, 240, 18, 5, '#c8352b');
    gfx.text('MOOSE HOLLOW IS HIRING', 186, 107, '#fff3d8', { align: 'center' });
    flakes(w, h, 50, 7);
  };
})();
