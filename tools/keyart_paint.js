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

  window.paintThumbnail = function (ctx, w, h) {
    gfx.vgrad(0, 0, w, h * 0.62, SKY);
    // moon and stars
    gfx.ellipse(w - 76, 144, 26, 26, '#f6f2d8'); gfx.ellipse(w - 70, 140, 22, 22, '#fffbe8');
    flakes(w, h * 0.6, 60, 11);
    skyline(w, h * 0.62);
    snowGround(h * 0.62, w, h);
    for (const [x, ph, c] of [[46, 96, '#2f6a24'], [96, 68, '#25551c'], [w - 54, 104, '#2f6a24'], [w - 108, 72, '#3a7a2c']]) pine(x, h * 0.62 + 26, ph, c);
    // the cabin, small, far left
    gfx.rect(150, h * 0.62 - 26, 54, 28, '#7a4a28');
    gfx.tri(142, h * 0.62 - 26, 212, h * 0.62 - 26, 177, h * 0.62 - 54, '#4a2e18');
    gfx.tri(142, h * 0.62 - 29, 212, h * 0.62 - 29, 177, h * 0.62 - 57, '#e9f1f7');
    gfx.rect(170, h * 0.62 - 16, 14, 18, '#c8352b');
    gfx.rect(156, h * 0.62 - 20, 10, 9, '#ffd98a'); gfx.rect(190, h * 0.62 - 20, 10, 9, '#ffd98a');
    // the man himself, front and centre
    const cy = h - 92;
    art.shadow(w / 2, cy + 2, 46, 0.3);
    ctx.save(); ctx.translate(w / 2, cy); ctx.scale(3.4, 3.4);
    CH.drawChubby(ctx, 0, 0, { face: 'happy', arm: 'idle', outfit: 'hoodie', noShadow: true });
    ctx.restore();
    // a mop, propped against the snow beside him
    ctx.save(); ctx.translate(w / 2 + 96, cy); ctx.rotate(0.16);
    gfx.rect(-3, -132, 6, 124, '#a8722f'); gfx.rect(-3, -132, 2, 124, '#c8934a');
    gfx.rect(-4, -134, 8, 4, '#8a5a22');
    gfx.ellipse(0, -4, 20, 10, '#c8c2a8'); gfx.ellipse(0, -6, 20, 10, '#e2dcc4');
    for (let i = 0; i < 11; i++) gfx.rect(-18 + i * 3.4, -16, 2, 14, i % 2 ? '#efe9d2' : '#cec8b0');
    ctx.restore();
    // title
    bigWord('CHUBBY', w / 2, 40, 6, '#ffd84a', '#2a1420');
    bigWord('THE PORCUPINE', w / 2, 96, 2.6, '#fff3d8', '#2a1420');
    // ribbon
    gfx.rrect(w / 2 - 150, h - 54, 300, 30, 8, '#2a1420');
    gfx.rrect(w / 2 - 147, h - 51, 294, 24, 6, '#c8352b');
    gfx.text('A JOB-HUNTING WINTER', w / 2, h - 43, '#fff3d8', { align: 'center' });
    // a HELP WANTED card nailed to a post, because that is the whole story
    gfx.rect(70, h - 150, 5, 80, '#7a4a22');
    gfx.rect(44, h - 186, 62, 40, '#2a1420');
    gfx.rect(46, h - 184, 58, 36, '#f6f2e6');
    gfx.text('HELP', 75, h - 178, '#c8352b', { align: 'center' });
    gfx.text('WANTED', 75, h - 166, '#c8352b', { align: 'center' });
    gfx.text('APPLY WITHIN', 75, h - 156, '#7a6a58', { align: 'center', font: 'small' });
    gfx.rect(42, h - 190, 66, 4, '#e9f1f7');
    flakes(w, h, 40, 5);
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
