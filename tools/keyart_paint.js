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

  // a wobbly cartoon word: every letter its own size, tilt and bounce,
  // with a fat ink outline, a drop shadow and a shine stripe
  function cartoonWord(text, cx, y, scale, fill, ink, seed, u) {
    const ctx = gfx.cur;
    const widths = [...text].map((ch) => (ch === ' ' ? 4 : gfx.textWidth(ch)) + 1);
    const total = widths.reduce((a, b) => a + b, 0) * scale;
    let x = cx - total / 2;
    [...text].forEach((ch, i) => {
      const wch = widths[i] * scale;
      if (ch !== ' ') {
        const wave = u === undefined ? 0 : Math.sin(u * Math.PI * 4 - i * 0.7);
        const rot = Math.sin(i * 1.9 + seed) * 0.12 + wave * 0.05, dy = Math.sin(i * 2.3 + seed) * scale * 1.2 - Math.max(0, wave) * scale * 1.6, sc = scale * (1 + Math.sin(i * 3.1 + seed) * 0.06 + Math.max(0, wave) * 0.05);
        const px = x + wch / 2, py = y + dy;
        const draw = (dx, dy2, col) => { ctx.save(); ctx.translate(px + dx, py + dy2); ctx.rotate(rot); ctx.scale(sc, sc); gfx.text(ch, 0, 0, col, { align: 'center' }); ctx.restore(); };
        draw(scale * 0.9, scale * 1.4, '#2a1420');                                            // shadow
        for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [-2, 0], [2, 0], [0, 2]]) draw(ox * scale * 0.55, oy * scale * 0.55, ink);
        draw(-scale * 0.22, -scale * 0.22, '#fffbe0');   // a lighter top edge, like a lit bubble
        draw(scale * 0.06, scale * 0.06, fill);
      }
      x += wch;
    });
  }
  function sunburst(cx, cy, r, n, a, b, rot) {
    gfx.circle(cx, cy, r, a);
    for (let i = 0; i < n; i++) {
      if (i % 2) continue;
      const a0 = rot + (i / n) * Math.PI * 2, a1 = rot + ((i + 1) / n) * Math.PI * 2;
      gfx.tri(cx, cy, cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, b);
    }
  }
  function sparkle(x, y, s, col) { gfx.rect(x - s, y, s * 2 + 1, 1, col); gfx.rect(x, y - s, 1, s * 2 + 1, col); gfx.rect(x - 1, y - 1, 3, 3, col); }
  function heart(x, y, r, col, ink) {
    for (const [c, g] of [[ink, 1.2], [col, 0]]) { gfx.circle(x - r * 0.5, y - r * 0.2, r * 0.6 + g, c); gfx.circle(x + r * 0.5, y - r * 0.2, r * 0.6 + g, c); gfx.tri(x - r - g, y, x + r + g, y, x, y + r * 1.15 + g, c); }
  }

  // the store thumbnail: just the name, and him, delighted about it
  // u: loop phase 0..1 for the animated version (undefined = the still)
  window.paintThumbnail = function (ctx, w, h, u) {
    const anim = u !== undefined, k = anim ? u : 0, TAU = Math.PI * 2;
    // the rays turn exactly two stripes per loop, so the loop is seamless
    sunburst(w / 2, h * 0.62, w * 0.95, 28, '#ffcf4a', '#ffb23a', 0.1 + k * (TAU / 28) * 2);
    const pulse = anim ? Math.sin(k * TAU * 4) * 0.5 + 0.5 : 0.5;
    ctx.save(); ctx.globalAlpha = 0.3 + pulse * 0.1; gfx.circle(w / 2, h * 0.64, 146 + pulse * 8, '#fff3c0'); ctx.globalAlpha = 0.25; gfx.circle(w / 2, h * 0.64, 190, '#fff3c0'); ctx.restore();
    gfx.ellipse(w / 2, h + 40, w * 0.75, 120, '#dfe8f4'); gfx.ellipse(w / 2, h + 44, w * 0.72, 112, '#ffffff');
    for (let i = 0; i < 9; i++) gfx.ellipse(40 + i * 52, h - 44 + (i % 3) * 5, 30, 10, i % 2 ? '#eef4fa' : '#ffffff');
    // Chubby dances through the loop (four beats), still one cheering pose otherwise
    const cy = h - 36, S = 5.4;
    if (anim) {
      const d = CH.dance.pose(k * 4 * 60 / CH.dance.BPM, 3.1, 'chubby');
      ctx.save(); ctx.translate(w / 2 + 6, cy); ctx.rotate(-0.04 + d.rot * 0.7); ctx.scale(S * d.sx, S * d.sy);
      CH.drawChubby(ctx, 0, -d.dy, { face: 'grin', arm: d.arm === 'belly' ? 'cheer' : d.arm, outfit: 'hoodie', noShadow: true, flip: d.flip, walk: d.walk, moving: d.moving });
      ctx.restore();
    } else {
      ctx.save(); ctx.translate(w / 2 + 6, cy); ctx.rotate(-0.06); ctx.scale(S, S);
      CH.drawChubby(ctx, 0, 0, { face: 'grin', arm: 'cheer', outfit: 'hoodie', noShadow: true });
      ctx.restore();
    }
    // hearts float and throb, sparkles twinkle in turn
    const hb = (ph) => (anim ? Math.sin(k * TAU * 2 + ph) : 0);
    heart(88, 250 + hb(0) * 8, 14 * (1 + Math.max(0, Math.sin(k * TAU * 4)) * 0.15), '#ff6a8a', '#2a1420');
    heart(398, 214 + hb(2) * 8, 11 * (1 + Math.max(0, Math.sin(k * TAU * 4 + 1)) * 0.15), '#ff6a8a', '#2a1420');
    heart(420, 318 + hb(4) * 6, 8, '#ff9ab4', '#2a1420');
    [[60, 180, 5], [424, 150, 6], [70, 330, 4], [384, 268, 4], [120, 140, 3], [360, 120, 3]].forEach(([x, y, sz], i) => {
      const on = !anim || Math.sin(k * TAU * 2 + i * 1.3) > -0.2;
      if (on) sparkle(x, y, anim ? Math.max(1, Math.round(sz * (0.6 + 0.6 * Math.sin(k * TAU * 2 + i * 1.3)))) : sz, '#ffffff');
    });
    cartoonWord('CHUBBY', w / 2, 22, 8.2, '#ffe95a', '#2a1420', 0.4, anim ? k : undefined);
    cartoonWord('THE PORCUPINE', w / 2, 102, 3.7, '#7ae0d4', '#2a1420', 2.2, anim ? (k + 0.25) % 1 : undefined);
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
