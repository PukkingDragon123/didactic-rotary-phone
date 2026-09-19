// ============================================================================
// TRAVEL: the walk from the cabin through the forest into Moose Hollow
//
// The whole route is lit from CH.state.hour: a nervous bright morning on the
// way to the interview, a blue exhausted dusk on the way home. Sky, parallax
// and snow are painted per frame; everything free-standing goes through
// art.blit so it carries the house ink line.
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, fx = CH.fx, A = CH.audio, inp = CH.input, S = CH.state, P = CH.PAL;
  const W = CH.W, H = CH.H;
  const art = CH.art;

  // ---- daylight ---------------------------------------------------------------------------
  // Keyframes around the clock; everything in between is mixed.
  const LIGHT = [
    { h: 0, sky: ['#070b1e', '#0b1029', '#121838', '#1a2149'], star: 1, win: 1,
      mtn: '#2b3252', mtnS: '#59628c', far: '#182140', mid: '#141d38', near: '#0f182e',
      snow: '#8b98bd', snowHi: '#a8b5d6', snowSh: '#65729a', road: '#181b29', ice: '#5a6b96',
      tint: '#2b3d7a', tintA: 0.30, lamp: 1 },
    { h: 6.2, sky: ['#1e2652', '#42436e', '#8a5f74', '#d1906c'], star: 0.25, win: 0.9,
      mtn: '#4d4d74', mtnS: '#a8a6c6', far: '#2b3652', mid: '#24324a', near: '#1c2a3e',
      snow: '#cfc3ce', snowHi: '#f4ddcc', snowSh: '#9d94b0', road: '#282a38', ice: '#8e97b8',
      tint: '#c67c6c', tintA: 0.15, lamp: 0.8 },
    { h: 8.5, sky: ['#7ba4cf', '#a4c3e2', '#cadcee', '#e6eef6'], star: 0, win: 0.5,
      mtn: '#7e8cb2', mtnS: '#f2f7fb', far: '#3f5c58', mid: '#38544c', near: '#2b4640',
      snow: '#e9f0f8', snowHi: '#ffffff', snowSh: '#c2d2e6', road: '#3a3d49', ice: '#a6cde4',
      tint: '#ffeccd', tintA: 0.06, lamp: 0.15 },
    { h: 14, sky: ['#6b9dd4', '#95bee6', '#c1d9ef', '#e2ecf5'], star: 0, win: 0.18,
      mtn: '#8390b6', mtnS: '#ffffff', far: '#3f5f56', mid: '#39584c', near: '#2d4a3e',
      snow: '#eef4fa', snowHi: '#ffffff', snowSh: '#c8d6e8', road: '#3e414d', ice: '#b0d8ee',
      tint: '#ffffff', tintA: 0.0, lamp: 0 },
    { h: 17, sky: ['#4a6aa8', '#8a85b4', '#cf8c72', '#f0b273'], star: 0.1, win: 0.72,
      mtn: '#6a6d96', mtnS: '#e8d2c4', far: '#33493f', mid: '#2d4038', near: '#24362e',
      snow: '#d8d2dc', snowHi: '#f8e0cc', snowSh: '#a8a4bc', road: '#33353f', ice: '#9aa4c0',
      tint: '#e08a58', tintA: 0.15, lamp: 0.6 },
    { h: 19, sky: ['#151d44', '#262d5c', '#4d4272', '#7d5068'], star: 0.7, win: 1,
      mtn: '#3a406a', mtnS: '#7d7ea6', far: '#1f2a44', mid: '#1a243c', near: '#151e32',
      snow: '#9fa8c8', snowHi: '#bcc4de', snowSh: '#767fa6', road: '#1e2130', ice: '#6e7ca4',
      tint: '#33407e', tintA: 0.26, lamp: 1 },
    { h: 24, sky: ['#070b1e', '#0b1029', '#121838', '#1a2149'], star: 1, win: 1,
      mtn: '#2b3252', mtnS: '#59628c', far: '#182140', mid: '#141d38', near: '#0f182e',
      snow: '#8b98bd', snowHi: '#a8b5d6', snowSh: '#65729a', road: '#181b29', ice: '#5a6b96',
      tint: '#2b3d7a', tintA: 0.30, lamp: 1 },
  ];
  const COLK = ['mtn', 'mtnS', 'far', 'mid', 'near', 'snow', 'snowHi', 'snowSh', 'road', 'ice', 'tint'];
  function palAt(h) {
    h = ((h % 24) + 24) % 24;
    let i = 0;
    while (i < LIGHT.length - 2 && LIGHT[i + 1].h <= h) i++;
    const a = LIGHT[i], b = LIGHT[i + 1];
    const k = CH.clamp((h - a.h) / (b.h - a.h), 0, 1);
    const o = { sky: a.sky.map((c, n) => gfx.mix(c, b.sky[n], k)) };
    for (const c of COLK) o[c] = gfx.mix(a[c], b[c], k);
    o.star = CH.lerp(a.star, b.star, k);
    o.win = CH.lerp(a.win, b.win, k);
    o.tintA = CH.lerp(a.tintA, b.tintA, k);
    o.lamp = CH.lerp(a.lamp, b.lamp, k);
    o.night = o.lamp > 0.45;
    return o;
  }
  // the live palette, so prop painters can read it without threading it through
  let LP = palAt(8);
  const glow = (x, y, r, col, a) => {
    const g = gfx.cur, o = g.globalAlpha;
    for (let i = 4; i >= 1; i--) { g.globalAlpha = a * (0.22 + 0.78 * Math.pow(1 - (i - 1) / 4, 2)); gfx.ellipse(x, y, (r * i) / 4, (r * 0.85 * i) / 4, col); }
    g.globalAlpha = o;
  };

  // ---- town props -------------------------------------------------------------------------
  // `inked` wraps a painter so the finished object carries one dark outline.
  // The painter draws with (ox, oy) as the prop's bottom-left footprint corner.
  const def = (n, w, h, d) => { CH.PROPS[n] = { name: n, w, h, draw: d }; };
  const inked = (n, w, h, bw, bh, ax, ay, fn) =>
    def(n, w, h, (g, x, y, t, st) => art.blit(x, y, bw, bh, ax, ay, () => fn(ax, ay, t || 0, st || {})));

  inked('pine', 30, 70, 38, 96, 4, 92, (ox, oy, t, st) => {
    const h = st.h || 60, c = st.c || '#2f6a24';
    const d = gfx.shade(c, -20), l = gfx.shade(c, 18);
    gfx.rect(ox + 12, oy - 12, 6, 12, '#452a16'); gfx.rect(ox + 12, oy - 12, 2, 12, '#5d3b20');
    const cx = ox + 15, tiers = 5, span = (h - 10) / tiers;
    for (let k = 0; k < tiers; k++) {
      const by = oy - 9 - k * span, ty = by - span - 9;
      const hw = 15 - k * 2.3;
      gfx.tri(cx - hw, by, cx + hw, by, cx, ty, k % 2 ? c : d);
      gfx.tri(cx - hw * 0.5, by - 1, cx + hw * 0.12, by - 1, cx - 1.5, ty + 3, l);
      gfx.tri(cx - hw * 0.5, by - span * 0.55, cx + hw * 0.5, by - span * 0.55, cx, ty + 1, '#e9f1f7');
      gfx.tri(cx - hw * 0.3, by - span * 0.55, cx + hw * 0.12, by - span * 0.55, cx - 1, ty + 3, '#ffffff');
    }
  });
  inked('birch', 16, 60, 26, 78, 5, 74, (ox, oy) => {
    gfx.rect(ox + 5, oy - 58, 5, 58, '#dfe2e2'); gfx.rect(ox + 5, oy - 58, 2, 58, '#f2f4f2');
    gfx.rect(ox + 9, oy - 58, 1, 58, '#b6bcbc');
    for (let i = 0; i < 7; i++) gfx.rect(ox + 5 + (i % 2) * 2, oy - 52 + i * 7, 3, 1, '#3a3630');
    for (const b of [[-40, 13, -50], [-32, 1, -41], [-52, 14, -60], [-46, 0, -54]]) {
      gfx.line(ox + 7, oy + b[0], ox + b[1], oy + b[2], '#cfd4d4');
      gfx.line(ox + b[1], oy + b[2], ox + b[1] + (b[1] > 7 ? 4 : -4), oy + b[2] - 5, '#b6bcbc');
    }
    gfx.line(ox + 7, oy - 58, ox + 12, oy - 68, '#dfe2e2'); gfx.line(ox + 7, oy - 58, ox + 2, oy - 66, '#dfe2e2');
    for (const s2 of [[13, -50], [1, -41], [14, -60], [12, -68], [2, -66]]) gfx.px(ox + s2[0], oy + s2[1] - 1, '#ffffff');
  });
  def('snowbank', 40, 10, (g, x, y) => {
    gfx.ellipse(x + 20, y - 2, 21, 6, LP.snow);
    gfx.ellipse(x + 17, y - 4, 12, 5, LP.snowHi);
    gfx.ellipse(x + 28, y - 3, 8, 3, LP.snowHi);
    gfx.ellipse(x + 20, y + 1, 22, 3, LP.snowSh);
  });
  inked('snowman', 16, 32, 34, 46, 9, 42, (ox, oy, t) => {
    const s = '#f4f8fc', sd = '#c6d4e6';
    gfx.circle(ox + 8, oy - 7, 8, sd); gfx.circle(ox + 7, oy - 8, 7, s);
    gfx.circle(ox + 8, oy - 18, 6, sd); gfx.circle(ox + 7, oy - 19, 5.2, s);
    gfx.circle(ox + 8, oy - 27, 5, sd); gfx.circle(ox + 7, oy - 28, 4.4, s);
    gfx.px(ox + 5, oy - 29, '#241c1a'); gfx.px(ox + 9, oy - 29, '#241c1a');
    gfx.rect(ox + 7, oy - 28, 4, 1, '#e8752c'); gfx.px(ox + 11, oy - 28, '#c85a18');
    for (let i = 0; i < 3; i++) gfx.px(ox + 5 + i * 2, oy - 25, '#241c1a');
    gfx.line(ox + 2, oy - 19, ox - 5, oy - 25, '#5a3721'); gfx.line(ox - 5, oy - 25, ox - 8, oy - 24, '#5a3721');
    gfx.line(ox + 13, oy - 19, ox + 20, oy - 23, '#5a3721'); gfx.line(ox + 20, oy - 23, ox + 22, oy - 26, '#5a3721');
    gfx.rect(ox + 1, oy - 24, 13, 3, '#c8352b'); gfx.rect(ox + 12, oy - 23, 3, 7, '#a82a22');
    gfx.rect(ox + 2, oy - 33, 11, 4, '#8f2419'); gfx.rect(ox + 4, oy - 37, 7, 4, '#c8352b');
    gfx.rect(ox + 4, oy - 37, 7, 1, '#e0655a'); gfx.rect(ox + 2, oy - 33, 11, 1, '#f5c33b');
  });
  inked('mailbox', 10, 28, 24, 40, 6, 36, (ox, oy) => {
    gfx.rect(ox + 3, oy - 18, 4, 18, '#5a3721'); gfx.rect(ox + 3, oy - 18, 1, 18, '#7c5230');
    gfx.rect(ox - 2, oy - 28, 15, 3, '#2a4f9e');
    gfx.rrect(ox - 2, oy - 27, 15, 10, 4, '#3b6fd6'); gfx.rrect(ox - 1, oy - 26, 13, 5, 3, '#5f90ee');
    gfx.rect(ox - 2, oy - 18, 15, 2, '#2a4f9e');
    gfx.rect(ox + 11, oy - 25, 4, 1, '#c8352b'); gfx.rect(ox + 13, oy - 29, 2, 5, '#c8352b');
    gfx.rect(ox - 3, oy - 30, 17, 2, '#eef4f8');
  });
  inked('hydrant', 8, 16, 20, 26, 6, 22, (ox, oy) => {
    gfx.rect(ox + 1, oy - 12, 7, 12, '#a82a22'); gfx.rect(ox + 2, oy - 12, 3, 12, '#d6463a');
    gfx.rect(ox - 2, oy - 9, 12, 3, '#a82a22'); gfx.rect(ox - 2, oy - 9, 12, 1, '#d6463a');
    gfx.rect(ox + 2, oy - 15, 5, 3, '#a82a22'); gfx.rect(ox + 1, oy - 16, 7, 2, '#eef4f8');
    gfx.ellipse(ox + 4, oy, 8, 3, '#e9f1f7');
  });
  inked('mooseSign', 16, 46, 26, 58, 5, 54, (ox, oy) => {
    gfx.rect(ox + 6, oy - 32, 4, 32, '#57575f'); gfx.rect(ox + 6, oy - 32, 1, 32, '#7a7a84');
    gfx.rect(ox - 2, oy - 48, 20, 18, '#f5c33b'); gfx.rect(ox - 2, oy - 48, 20, 2, '#ffe08a');
    gfx.frame(ox - 2, oy - 48, 20, 18, '#2a2420');
    gfx.ellipse(ox + 7, oy - 38, 5, 4, '#2a2420'); gfx.rect(ox + 10, oy - 41, 4, 5, '#2a2420');
    gfx.rect(ox + 4, oy - 35, 2, 4, '#2a2420'); gfx.rect(ox + 9, oy - 35, 2, 4, '#2a2420');
    gfx.line(ox + 10, oy - 42, ox + 7, oy - 46, '#2a2420'); gfx.line(ox + 12, oy - 42, ox + 15, oy - 46, '#2a2420');
    gfx.line(ox + 7, oy - 46, ox + 5, oy - 45, '#2a2420'); gfx.line(ox + 15, oy - 46, ox + 17, oy - 45, '#2a2420');
    gfx.rect(ox - 3, oy - 50, 22, 2, '#eef4f8');
  });
  inked('sled', 20, 10, 28, 18, 4, 14, (ox, oy) => {
    gfx.rect(ox, oy - 6, 20, 4, '#c8352b'); gfx.rect(ox, oy - 6, 20, 1, '#e0655a');
    gfx.rect(ox + 2, oy - 2, 17, 2, '#8a5a2b');
    gfx.rect(ox + 17, oy - 9, 3, 4, '#c8352b'); gfx.rect(ox - 1, oy - 3, 22, 1, '#9aa4b4');
  });
  inked('lamppost', 10, 62, 26, 78, 8, 74, (ox, oy, t) => {
    gfx.rect(ox + 2, oy - 4, 6, 4, '#3a3a48');
    gfx.rect(ox + 3, oy - 58, 4, 55, '#3a3a48'); gfx.rect(ox + 3, oy - 58, 1, 55, '#5a5a6a');
    gfx.rect(ox + 5, oy - 40, 4, 2, '#3a3a48');
    gfx.rect(ox - 1, oy - 63, 12, 4, '#3a3a48');
    gfx.rect(ox, oy - 60, 10, 4, LP.lamp > 0.3 ? '#fff6cc' : '#9aa0aa');
    gfx.rect(ox - 2, oy - 66, 14, 3, '#e9f1f7');
    if (LP.lamp > 0.3) { gfx.rect(ox + 1, oy - 59, 8, 2, '#ffffff'); gfx.rect(ox + 1, oy - 56, 8, 1, '#ffeba8'); }
  });
  inked('car', 50, 24, 60, 36, 4, 32, (ox, oy, t, st) => {
    const c = st.color || '#3b6fd6', d = gfx.shade(c, -32), l = gfx.shade(c, 26);
    gfx.rrect(ox + 8, oy - 24, 30, 11, 4, d); gfx.rrect(ox + 9, oy - 23, 28, 9, 3, c);
    gfx.rect(ox + 11, oy - 22, 11, 6, '#8fc4e4'); gfx.rect(ox + 24, oy - 22, 11, 6, '#8fc4e4');
    gfx.rect(ox + 11, oy - 22, 4, 6, '#b6dcf2'); gfx.rect(ox + 22, oy - 22, 2, 6, d);
    gfx.rrect(ox, oy - 15, 50, 12, 4, d); gfx.rrect(ox + 1, oy - 14, 48, 10, 3, c);
    gfx.rect(ox + 2, oy - 13, 46, 2, l);
    gfx.rect(ox + 2, oy - 8, 46, 1, gfx.shade(c, -14));
    gfx.rect(ox + 6, oy - 26, 34, 3, '#eef4f8'); gfx.rect(ox + 2, oy - 17, 46, 2, '#eef4f8');
    gfx.circle(ox + 11, oy - 3, 5, '#1d1b22'); gfx.circle(ox + 11, oy - 3, 2, '#6b6b74');
    gfx.circle(ox + 39, oy - 3, 5, '#1d1b22'); gfx.circle(ox + 39, oy - 3, 2, '#6b6b74');
    gfx.rect(ox + 47, oy - 11, 3, 3, LP.lamp > 0.3 ? '#fff0b0' : '#f5c33b');
    gfx.rect(ox, oy - 11, 3, 3, '#c8352b');
  });
  // a real shelter: glass back, bench, a timetable nobody believes
  inked('busStop', 52, 56, 64, 72, 5, 68, (ox, oy, t) => {
    gfx.rect(ox + 1, oy - 44, 5, 44, '#5c5c66'); gfx.rect(ox + 44, oy - 44, 5, 44, '#5c5c66');
    gfx.rect(ox + 1, oy - 44, 2, 44, '#7d7d88'); gfx.rect(ox + 44, oy - 44, 2, 44, '#7d7d88');
    gfx.rect(ox + 4, oy - 42, 42, 32, 'rgba(176,210,228,0.42)');
    gfx.rect(ox + 6, oy - 40, 16, 28, 'rgba(226,242,250,0.35)');
    gfx.line(ox + 6, oy - 14, ox + 22, oy - 38, 'rgba(255,255,255,0.5)');
    gfx.rect(ox + 4, oy - 11, 42, 2, '#5c5c66');
    gfx.rect(ox + 6, oy - 20, 38, 4, '#7c5230'); gfx.rect(ox + 6, oy - 20, 38, 1, '#a9703c');
    gfx.rect(ox + 8, oy - 16, 3, 16, '#5a3721'); gfx.rect(ox + 39, oy - 16, 3, 16, '#5a3721');
    gfx.rect(ox - 2, oy - 50, 54, 6, '#3b6fd6'); gfx.rect(ox - 2, oy - 50, 54, 2, '#5f90ee');
    gfx.rect(ox - 3, oy - 54, 56, 4, '#eef4f8'); gfx.rect(ox - 3, oy - 55, 56, 2, '#ffffff');
    gfx.rect(ox + 28, oy - 42, 16, 18, '#f4f0e2'); gfx.frame(ox + 28, oy - 42, 16, 18, '#2a2420');
    gfx.text('BUS 12', ox + 36, oy - 41, '#8f2419', { align: 'center', font: 'small' });
    for (let i = 0; i < 4; i++) gfx.rect(ox + 30, oy - 34 + i * 4, 12 - (i % 2) * 4, 1, '#6b6b74');
    if (LP.lamp > 0.3) { gfx.rect(ox + 20, oy - 43, 10, 2, '#fff0b0'); }
  });
  // hand-painted, lopsided, somebody's cousin did it
  inked('donaldsRoadSign', 44, 62, 62, 80, 9, 76, (ox, oy, t) => {
    gfx.rect(ox + 6, oy - 34, 5, 34, '#6b4a28'); gfx.rect(ox + 31, oy - 34, 5, 34, '#6b4a28');
    gfx.rect(ox + 6, oy - 34, 2, 34, '#8a6238'); gfx.rect(ox + 31, oy - 34, 2, 34, '#8a6238');
    gfx.rect(ox, oy - 58, 44, 26, '#e8dcc0');
    CH.drawPlanks(gfx.cur, ox, oy - 58, 44, 26, 9, '#e8dcc0', '#c9bb9a', '#f6ecd4', 7);
    gfx.frame(ox, oy - 58, 44, 26, '#8a6238');
    gfx.text("DONALD'S", ox + 22, oy - 56, '#c8352b', { align: 'center', font: 'small' });
    gfx.ellipse(ox + 10, oy - 45, 7, 3, '#c8912e'); gfx.rect(ox + 4, oy - 45, 13, 2, '#7a4a24');
    gfx.ellipse(ox + 10, oy - 42, 7, 2.4, '#e0a83c'); gfx.rect(ox + 4, oy - 44, 13, 1, '#4f9d3a');
    gfx.text('2 KM', ox + 30, oy - 47, '#2a2420', { align: 'center', font: 'small' });
    gfx.text('THAT WAY', ox + 30, oy - 40, '#2a2420', { align: 'center', font: 'small' });
    gfx.tri(ox + 36, oy - 38, ox + 36, oy - 34, ox + 41, oy - 36, '#c8352b');
    gfx.rect(ox + 22, oy - 38, 14, 1, '#c8352b');
    gfx.rect(ox - 2, oy - 61, 48, 4, '#eef4f8'); gfx.rect(ox - 2, oy - 62, 48, 2, '#ffffff');
  });
  inked('townSign', 40, 50, 58, 66, 9, 62, (ox, oy) => {
    gfx.rect(ox + 4, oy - 26, 5, 26, '#57575f'); gfx.rect(ox + 31, oy - 26, 5, 26, '#57575f');
    gfx.rect(ox, oy - 46, 40, 21, '#2f6a4a'); gfx.rect(ox, oy - 46, 40, 2, '#4a8f68');
    gfx.frame(ox, oy - 46, 40, 21, '#e9f1f7');
    gfx.text('MOOSE', ox + 20, oy - 44, '#ffffff', { align: 'center', font: 'small' });
    gfx.text('HOLLOW', ox + 20, oy - 38, '#ffffff', { align: 'center', font: 'small' });
    gfx.text('POP. 812', ox + 20, oy - 31, '#bfe6cf', { align: 'center', font: 'small' });
    gfx.rect(ox - 2, oy - 49, 44, 3, '#eef4f8');
  });
  inked('hydroPole', 14, 80, 46, 96, 16, 92, (ox, oy) => {
    gfx.rect(ox, oy - 76, 7, 76, '#5a4630'); gfx.rect(ox, oy - 76, 2, 76, '#7a6242');
    for (let i = 0; i < 6; i++) gfx.px(ox + 3 + (i % 2), oy - 66 + i * 11, '#3f3020');
    gfx.rect(ox - 12, oy - 74, 31, 4, '#5a4630'); gfx.rect(ox - 12, oy - 74, 31, 1, '#7a6242');
    gfx.rect(ox - 12, oy - 68, 31, 2, '#4a3826');
    for (const dx of [-10, -2, 6, 15]) { gfx.rect(ox + dx, oy - 78, 3, 4, '#5f8a6a'); gfx.rect(ox + dx, oy - 79, 3, 1, '#8fc0a0'); }
    gfx.rect(ox - 12, oy - 76, 31, 2, '#eef4f8');
    gfx.rect(ox - 6, oy - 58, 9, 12, '#6b6b74'); gfx.rect(ox - 6, oy - 58, 9, 2, '#8f8f9a');
    gfx.rect(ox - 4, oy - 46, 5, 2, '#4a4a54');
    gfx.rect(ox - 1, oy - 34, 8, 6, '#9a9aa4'); gfx.rect(ox - 1, oy - 34, 8, 1, '#c0c0ca');
  });
  def('storefront', 120, 96, (g, x, y, t, st) => {
    const c = st.color || '#a86f3a', name = st.name || 'STORE';
    const d = gfx.shade(c, -30), l = gfx.shade(c, 20), dd = gfx.shade(c, -52);
    const B = y - 96;
    art.blit(x, y, 140, 112, 10, 108, () => {
      const ox = 10, oy = 108;
      // body
      gfx.rect(ox, oy - 84, 120, 84, c);
      CH.drawPlanks(gfx.cur, ox, oy - 84, 120, 84, 9, c, d, l, x, false);
      gfx.rect(ox, oy - 84, 120, 2, l);
      // upper storey windows, lit from inside
      for (const wx of [ox + 14, ox + 54, ox + 94]) {
        gfx.rect(wx - 2, oy - 82, 20, 18, dd);
        gfx.rect(wx, oy - 80, 16, 14, LP.win > 0.35 ? gfx.mix('#3a4a66', '#ffd98a', LP.win) : '#2e4058');
        gfx.rect(wx, oy - 80, 16, 4, LP.win > 0.35 ? gfx.mix('#4a5a76', '#ffe8b4', LP.win) : '#3a4c66');
        gfx.rect(wx + 7, oy - 80, 2, 14, dd); gfx.rect(wx, oy - 74, 16, 1, dd);
        gfx.rect(wx - 3, oy - 66, 22, 3, l);
        gfx.rect(wx - 3, oy - 83, 22, 2, '#e9f1f7');
      }
      // shopfront
      gfx.rect(ox + 2, oy - 52, 116, 4, dd);
      gfx.rect(ox + 6, oy - 48, 46, 34, '#2a3a4e');
      gfx.rect(ox + 68, oy - 48, 44, 34, '#2a3a4e');
      for (const wx of [ox + 6, ox + 68]) {
        const ww = wx === ox + 6 ? 46 : 44;
        gfx.vgrad(wx + 2, oy - 46, ww - 4, 30, LP.win > 0.3
          ? [gfx.mix('#38506e', '#ffe6a8', LP.win), gfx.mix('#2e4460', '#f0c377', LP.win)]
          : ['#3d5a74', '#32495f']);
        gfx.rect(wx + 4, oy - 30, ww - 8, 2, 'rgba(60,40,20,0.35)');
        gfx.ellipse(wx + 12, oy - 24, 5, 7, 'rgba(50,34,20,0.45)');
        gfx.ellipse(wx + ww - 14, oy - 22, 6, 8, 'rgba(50,34,20,0.38)');
        gfx.frame(wx, oy - 48, ww, 34, dd);
        gfx.rect(wx + (ww >> 1) - 1, oy - 48, 2, 34, dd);
        const gl = gfx.cur; gl.globalAlpha = 0.22; gfx.tri(wx + 2, oy - 16, wx + 20, oy - 46, wx + 2, oy - 46, '#ffffff'); gl.globalAlpha = 1;
      }
      // door tall enough to walk through
      gfx.rect(ox + 54, oy - 50, 14, 2, dd);
      gfx.rect(ox + 54, oy - 48, 14, 48, '#4a2e18');
      gfx.rect(ox + 56, oy - 46, 10, 44, '#8a5a2b'); gfx.rect(ox + 56, oy - 46, 3, 44, '#a97438');
      gfx.rect(ox + 57, oy - 43, 8, 12, LP.win > 0.3 ? '#ffe0a0' : '#2a3a4e');
      gfx.px(ox + 64, oy - 26, '#f5c33b');
      gfx.rect(ox + 52, oy - 2, 18, 2, '#9aa4b4');
      // sign band + awning
      gfx.rect(ox - 2, oy - 62, 124, 11, '#211c26'); gfx.rect(ox - 2, oy - 62, 124, 1, '#3d3542');
      gfx.rect(ox - 2, oy - 52, 124, 2, '#14111a');
      gfx.text(name, ox + 60, oy - 60, st.textColor || '#f5c33b', { align: 'center', font: 'small' });
      if (LP.win > 0.4) { const gl = gfx.cur; gl.globalAlpha = 0.2 * LP.win; gfx.rect(ox - 4, oy - 56, 128, 14, '#ffd98a'); gl.globalAlpha = 1; }
      // roof + snow
      gfx.rect(ox - 6, oy - 92, 132, 9, gfx.shade(c, -46));
      gfx.rect(ox - 6, oy - 92, 132, 2, gfx.shade(c, -26));
      gfx.rect(ox - 7, oy - 96, 134, 4, '#e9f1f7'); gfx.rect(ox - 7, oy - 97, 134, 2, '#ffffff');
      for (let i = 0; i < 6; i++) gfx.ellipse(ox + 8 + i * 22, oy - 91, 7, 3, '#e9f1f7');
      // icicles
      for (let i = 0; i < 9; i++) gfx.tri(ox + 4 + i * 14, oy - 83, ox + 7 + i * 14, oy - 83, ox + 5 + i * 14, oy - 77 - (i % 3) * 2, 'rgba(206,234,246,0.85)');
      if (st.sign) { gfx.rect(ox + 74, oy - 42, 32, 13, '#f6f2e6'); gfx.frame(ox + 74, oy - 42, 32, 13, '#8a7a5a'); gfx.text(st.sign, ox + 90, oy - 39, '#c8352b', { align: 'center', font: 'small' }); }
    });
    if (st.windowDraw) st.windowDraw(g, x, y, t);
    // snowbank piled against the wall
    gfx.ellipse(x + 8, y, 20, 5, LP.snow); gfx.ellipse(x + 112, y, 18, 4, LP.snow);
    gfx.ellipse(x + 6, y - 2, 12, 3, LP.snowHi);
  });
  def('donaldsExterior', 200, 130, (g, x, y, t, st) => {
    art.blit(x, y, 232, 150, 16, 146, () => {
      const ox = 16, oy = 146;
      // parking lot apron
      gfx.rect(ox - 14, oy - 4, 228, 4, '#4a4d58');
      // body
      gfx.rect(ox, oy - 92, 200, 92, '#f2e7d2');
      for (let i = 0; i < 200; i += 10) gfx.rect(ox + i, oy - 86, 1, 30, '#e2d5bc');
      gfx.rect(ox, oy - 92, 200, 7, '#c8352b'); gfx.rect(ox, oy - 92, 200, 2, '#e0655a');
      gfx.rect(ox, oy - 62, 200, 5, '#c8352b'); gfx.rect(ox, oy - 62, 200, 1, '#e0655a');
      gfx.rect(ox, oy - 12, 200, 12, '#b6ab94'); gfx.rect(ox, oy - 12, 200, 1, '#d2c8b2');
      // mansard roof + snow
      gfx.rect(ox - 8, oy - 100, 216, 9, '#8f2419'); gfx.rect(ox - 8, oy - 100, 216, 2, '#b13323');
      gfx.rect(ox - 9, oy - 104, 218, 4, '#e9f1f7'); gfx.rect(ox - 9, oy - 105, 218, 2, '#ffffff');
      for (let i = 0; i < 14; i++) gfx.tri(ox - 4 + i * 16, oy - 91, ox - 1 + i * 16, oy - 91, ox - 3 + i * 16, oy - 85 - (i % 3) * 2, 'rgba(206,234,246,0.8)');
      // windows, warm, with customers
      for (const wx of [ox + 12, ox + 60, ox + 142]) {
        gfx.rect(wx - 3, oy - 60, 46, 40, '#8f2419');
        gfx.vgrad(wx, oy - 57, 40, 34, ['#fff0bc', '#f6dc9c', '#e8c078']);
        gfx.rect(wx + 3, oy - 34, 34, 3, '#c08a4a');
        gfx.ellipse(wx + 10, oy - 38, 5, 7, '#8a6038'); gfx.ellipse(wx + 10, oy - 45, 3.4, 3, '#6d4a28');
        gfx.ellipse(wx + 30, oy - 36, 6, 8, '#6d5a44'); gfx.ellipse(wx + 30, oy - 44, 3.6, 3.2, '#54422f');
        gfx.rect(wx + 19, oy - 57, 2, 34, '#8f2419'); gfx.rect(wx, oy - 42, 40, 1, '#8f2419');
        const gl = gfx.cur; gl.globalAlpha = 0.25; gfx.tri(wx, oy - 23, wx + 16, oy - 57, wx, oy - 57, '#ffffff'); gl.globalAlpha = 1;
        gfx.frame(wx, oy - 57, 40, 34, '#8f2419');
      }
      // doors, 56 tall
      gfx.rect(ox + 102, oy - 60, 34, 60, '#3a4a5a');
      gfx.rect(ox + 104, oy - 58, 30, 56, '#9fdcff');
      gfx.vgrad(ox + 104, oy - 58, 30, 56, ['#cfeeff', '#9fdcff', '#7ec2ea']);
      gfx.rect(ox + 118, oy - 58, 3, 56, '#3a4a5a');
      gfx.rect(ox + 108, oy - 32, 6, 3, '#39312a'); gfx.rect(ox + 124, oy - 32, 6, 3, '#39312a');
      gfx.rect(ox + 104, oy - 54, 30, 9, '#c8352b'); gfx.text('OPEN', ox + 119, oy - 52, '#fff', { align: 'center', font: 'small' });
      gfx.rect(ox + 100, oy - 64, 38, 4, '#8f2419');
      // NOW HIRING
      gfx.rect(ox + 8, oy - 30, 48, 14, '#f5c33b'); gfx.rect(ox + 8, oy - 30, 48, 2, '#ffe08a');
      gfx.frame(ox + 8, oy - 30, 48, 14, '#8f6a14');
      gfx.text('NOW HIRING', ox + 32, oy - 27, '#8f2419', { align: 'center', font: 'small' });
      // drive-thru
      gfx.rect(ox + 190, oy - 44, 4, 44, '#5a5a66'); gfx.rect(ox + 190, oy - 44, 1, 44, '#7c7c88');
      gfx.rect(ox + 174, oy - 58, 34, 16, '#c8352b'); gfx.rect(ox + 174, oy - 58, 34, 2, '#e0655a');
      gfx.frame(ox + 174, oy - 58, 34, 16, '#8f2419');
      gfx.text('DRIVE', ox + 191, oy - 56, '#fff', { align: 'center', font: 'small' });
      gfx.text('THRU >', ox + 191, oy - 49, '#fff', { align: 'center', font: 'small' });
      // bin & bench
      gfx.rect(ox + 148, oy - 16, 12, 16, '#5a5a66'); gfx.rect(ox + 148, oy - 16, 12, 2, '#7c7c88');
      gfx.rect(ox + 147, oy - 19, 14, 3, '#43434e');
      gfx.rect(ox + 164, oy - 12, 26, 4, '#7c5230'); gfx.rect(ox + 164, oy - 13, 26, 1, '#a9703c');
      gfx.rect(ox + 166, oy - 8, 3, 8, '#5a3721'); gfx.rect(ox + 185, oy - 8, 3, 8, '#5a3721');
      gfx.rect(ox + 163, oy - 14, 28, 2, '#e9f1f7');
    });
    // the big D on its pole, above the roof
    const sy = y - 138 + Math.round(Math.sin(t * 1.5) * 0.5);
    gfx.rect(x + 96, y - 104, 10, 30, '#55555f'); gfx.rect(x + 96, y - 104, 3, 30, '#7a7a84');
    art.blit(x + 60, sy + 40, 96, 48, 0, 44, () => {
      gfx.rrect(0, 0, 90, 40, 6, '#8f2419'); gfx.rrect(3, 3, 84, 34, 5, '#f5c33b');
      gfx.rrect(3, 3, 84, 8, 4, '#ffe08a');
      gfx.rect(8, 8, 26, 26, '#c8352b'); gfx.rect(10, 10, 22, 22, '#ffe08a');
      const dc = gfx.cur; dc.save(); dc.translate(13, 11); dc.scale(2.6, 2.6);
      gfx.text('D', 0, 0, '#c8352b', { outline: '#8f2419' }); dc.restore();
      gfx.text("DONALD'S", 62, 10, '#8f2419', { align: 'center', font: 'small' });
      gfx.text('BURGERS', 62, 18, '#8f2419', { align: 'center', font: 'small' });
      gfx.text("IT'S A D", 62, 28, '#5a3a1a', { align: 'center', font: 'small' });
    });
    for (let i = 0; i < 21; i++) gfx.px(x + 63 + i * 4, sy + 38, (Math.floor(t * 6) + i) % 4 === 0 ? '#fff' : '#f0a030');
    if (LP.lamp > 0.25) { glow(x + 105, sy + 20, 60, '#ffbb55', 0.13 * LP.lamp); }
    // vent steam
    for (let i = 0; i < 4; i++) { const k = (t * 0.45 + i * 0.25) % 1; gfx.ellipse(x + 30 + i * 6 + Math.sin(t + i) * 3, y - 108 - k * 20, 2 + k * 3, 1.5 + k * 2, `rgba(238,244,248,${(0.5 - k * 0.5).toFixed(2)})`); }
    // plowed bank at the wall
    gfx.ellipse(x + 4, y, 22, 5, LP.snow); gfx.ellipse(x + 196, y, 20, 5, LP.snow);
  });

  class TravelScene extends CH.WorldScene {
    constructor(opts = {}) {
      super({ width: 2700, floorY: 214, playerX: opts.playerX || 40 });
      this.name = 'travel'; this.dest = opts.dest || 'donalds'; this.direction = opts.direction || 1;
      this.timeScale = 1 / 30; // 1 game hour per 30 s
      // the light of the whole walk is fixed at the moment it starts
      this.mood = opts.mood || (this.dest === 'home' ? 'tired' : 'nervous');
      this.pal = palAt(opts.hour !== undefined ? opts.hour : S.hour);
      if (this.mood === 'tired') { this.pal.tintA = Math.min(0.42, this.pal.tintA + 0.1); this.pal.tint = gfx.mix(this.pal.tint, '#5c6390', 0.4); }
      LP = this.pal;
      this.prints = []; this.lastPrint = -999; this.puffs = []; this.breathT = 0.4;
      this.build();
      this.player.outfit = S.outfit; this.player.stepSfx = 'step'; this.player.speed = 82;
      this.mooseCrossed = false; this.tripped = false;
      this.snow = [];
      for (let i = 0; i < 160; i++) this.snow.push({ x: Math.random() * (W + 40) - 20, y: Math.random() * H, l: i < 70 ? 0 : i < 125 ? 1 : 2, ph: Math.random() * 6.28 });
      this.gust = 0; this.gustT = 2;
    }
    // ---------------------------------------------------------------- ground --
    drawRoom(g) {
      const w = this.width, F = this.floorY, p = this.pal;
      // snow field
      gfx.rect(0, F, w, H - F, p.snow);
      gfx.rect(0, F, w, 3, p.snowHi);
      const r1 = new CH.Rng(7);
      for (let i = 0; i < w / 3; i++) { const sx = r1.int(0, w), sy = F + r1.int(2, H - F - 4); gfx.hline(sx, sy, r1.int(3, 12), r1.chance(0.5) ? p.snowHi : p.snowSh); }
      // ridge the plough left on the far side of the road
      for (let x = 0; x < w; x += 24) { gfx.ellipse(x + 12, F + 12, 16, 5, p.snowHi); gfx.ellipse(x + 12, F + 14, 15, 3, p.snowSh); }
      // road
      gfx.rect(0, F + 14, w, 22, p.road);
      gfx.rect(0, F + 14, w, 1, gfx.shade(p.road, 26));
      gfx.rect(0, F + 35, w, 1, gfx.shade(p.road, -16));
      for (let x = 0; x < w; x += 2) { gfx.px(x, F + 19 + ((x * 7) % 2), gfx.shade(p.road, 13)); gfx.px(x + 1, F + 31 + ((x * 3) % 2), gfx.shade(p.road, 11)); }
      for (let x = 0; x < w; x += 40) { gfx.rect(x, F + 24, 20, 2, '#e8b83a'); gfx.rect(x, F + 24, 20, 1, '#fdd865'); }
      const r2 = new CH.Rng(31);
      for (let i = 0; i < w / 5; i++) { const sx = r2.int(0, w); gfx.px(sx, F + 14 + r2.int(0, 4), p.snowSh); gfx.px(sx, F + 31 + r2.int(0, 4), p.snowSh); }
      // near shoulder, in front of the road
      gfx.rect(0, F + 36, w, H - F - 36, p.snow);
      gfx.rect(0, F + 36, w, 2, p.snowHi);
      for (let x = 0; x < w; x += 28) gfx.ellipse(x + 14, F + 40, 20, 5, p.snowHi);
      // town sidewalk
      const walk = gfx.mix('#b7bbc5', p.snow, 0.42);
      gfx.rect(1500, F, w - 1500, 13, walk);
      gfx.rect(1500, F, w - 1500, 2, gfx.shade(walk, 18));
      gfx.rect(1500, F + 12, w - 1500, 2, gfx.shade(walk, -26));
      for (let x = 1500; x < w; x += 18) gfx.vline(x, F, 12, gfx.shade(walk, -18));
      for (let x = 1506; x < w; x += 36) gfx.ellipse(x, F + 2, 8, 2, p.snowHi);
      // back row of houses behind the main street
      const r3 = new CH.Rng(91);
      for (let x = 1490; x < w; x += r3.int(52, 80)) {
        const bh = r3.int(46, 70), bw = r3.int(46, 66);
        const bc = gfx.mix(['#6b5a72', '#5a6a80', '#74625a', '#5c6a5c'][r3.int(0, 3)], p.sky[3], 0.48);
        gfx.rect(x, F - 6 - bh, bw, bh, bc);
        gfx.tri(x - 6, F - 6 - bh, x + bw + 6, F - 6 - bh, x + bw / 2, F - 26 - bh, gfx.shade(bc, -22));
        gfx.tri(x - 7, F - 9 - bh, x + bw + 7, F - 9 - bh, x + bw / 2, F - 30 - bh, gfx.mix(p.snowHi, bc, 0.4));
        gfx.tri(x - 4, F - 12 - bh, x + bw / 2 - 2, F - 12 - bh, x + bw / 2 - 1, F - 27 - bh, gfx.mix(p.snowHi, bc, 0.15));
        for (let k = 0; k < 4; k++) {
          const wx = x + 7 + (k % 2) * 22, wy = F - bh + 4 + ((k / 2) | 0) * 20;
          gfx.rect(wx, wy, 10, 12, p.win > 0.35 ? gfx.mix('#38455e', '#ffd98a', p.win * (r3.chance(0.6) ? 1 : 0.15)) : '#33425a');
          gfx.rect(wx, wy + 12, 12, 2, gfx.shade(bc, 18));
        }
        gfx.rect(x + bw - 14, F - 18 - bh, 7, 12, gfx.shade(bc, -26));
        gfx.rect(x + bw - 15, F - 20 - bh, 9, 2, p.snowHi);
      }
      // hydro line: poles every 250px, wires sagging between them
      const poles = [];
      for (let x = 170; x < w - 40; x += 250) poles.push(x);
      const wire = gfx.mix('#1b1824', p.sky[1], 0.2);
      for (let i = 0; i + 1 < poles.length; i++) {
        const x1 = poles[i] + 2, x2 = poles[i + 1] + 2;
        for (const dy of [-76, -70]) {
          for (let x = x1; x <= x2; x++) {
            const u = (x - x1) / (x2 - x1);
            gfx.px(x, F + dy + Math.sin(u * Math.PI) * 10, wire);
          }
        }
      }
      for (const px0 of poles) CH.PROPS.hydroPole.draw(g, px0, F + 2, 0, {});
    }
    // ---------------------------------------------------------------- build ---
    build() {
      const F = this.floorY, say = (t, o) => () => ui.say('Chubby', t, Object.assign({ face: 'normal' }, o));
      // footprints go down first so everything else sits on top of them
      this.addCustom(() => {
        const p = this.pal, deep = gfx.shade(p.snowSh, -16);
        for (const f of this.prints) {
          const d = f.f ? -1 : 1;
          gfx.ellipse(f.x, f.y + 1, 3.6, 1.7, p.snowSh);
          gfx.rect(f.x - 2, f.y - 1, 5, 3, deep);
          gfx.rect(f.x + d * 2, f.y - 1, 2, 2, gfx.shade(deep, -8));
          gfx.rect(f.x - 2, f.y - 2, 5, 1, p.snowHi);
        }
      }, 0, F, 1, 1, { id: 'prints', anim: true });
      // cabin exterior at start
      this.addCustom((g, x, y) => {
        const p = this.pal;
        art.blit(x, y, 130, 126, 14, 122, () => {
          const ox = 14, oy = 122;
          gfx.rect(ox, oy - 62, 90, 62, P.wood1);
          CH.drawPlanks(gfx.cur, ox, oy - 62, 90, 62, 9, P.wood1, P.wood0, P.wood3, 3);
          gfx.tri(ox - 10, oy - 62, ox + 100, oy - 62, ox + 45, oy - 100, '#4a2e18');
          gfx.tri(ox - 10, oy - 65, ox + 100, oy - 65, ox + 45, oy - 103, '#e9f1f7');
          gfx.tri(ox - 6, oy - 68, ox + 40, oy - 68, ox + 45, oy - 100, '#ffffff');
          gfx.rect(ox + 58, oy - 106, 12, 30, '#57575f'); gfx.rect(ox + 58, oy - 106, 4, 30, '#75757f');
          gfx.rect(ox + 56, oy - 109, 16, 4, '#e9f1f7');
          gfx.rect(ox + 33, oy - 48, 24, 48, '#8f2419'); gfx.rect(ox + 35, oy - 46, 20, 44, '#c8352b');
          gfx.rect(ox + 35, oy - 46, 6, 44, '#e0655a'); gfx.px(ox + 53, oy - 24, '#f5c33b');
          for (const wx of [ox + 8, ox + 62]) {
            gfx.rect(wx - 2, oy - 54, 22, 20, P.wood0);
            gfx.rect(wx, oy - 52, 18, 16, p.win > 0.3 ? gfx.mix('#3a4a66', '#ffdc96', p.win) : '#33425a');
            gfx.rect(wx + 8, oy - 52, 2, 16, P.wood0); gfx.rect(wx, oy - 45, 18, 1, P.wood0);
            gfx.rect(wx - 3, oy - 34, 24, 3, P.wood3);
          }
          gfx.rect(ox - 2, oy - 8, 94, 3, '#e9f1f7');
        });
        for (let i = 0; i < 4; i++) { const k = (this.t * 0.35 + i * 0.25) % 1; gfx.ellipse(x + 63 + Math.sin(this.t + i) * 3, y - 112 - k * 22, 2 + k * 4, 1.6 + k * 3, `rgba(238,244,248,${(0.45 - k * 0.45).toFixed(2)})`); }
        gfx.ellipse(x + 4, y, 22, 5, p.snow); gfx.ellipse(x + 86, y, 20, 5, p.snow);
      }, 0, F, 90, 100, { id: 'cabinExt', anim: true, hint: 'Home', interact: say("Home. {p}I'll be back. With a job. Hopefully.") });
      this.addProp('boots', 60, F);
      // forest
      for (let x = 110; x < 1400; x += 55) { this.addProp('pine', x + (x % 3) * 7, F + 2 - (x % 5), { st: { h: 50 + (x % 4) * 10, c: ['#2f6a24', '#3a7a2c', '#25551c'][x % 3] } }); if (x % 4 === 0) this.addProp('birch', x + 30, F); }
      for (let x = 130; x < 1450; x += 130) this.addProp('snowbank', x, F + 2);
      this.addProp('mailbox', 100, F, { w: 10, h: 26, hint: 'Mailbox', interact: say("Our mailbox. Full of flyers. One says 'You may already be a winner!' {p}I may already be a loser, flyer.") });
      this.addProp('snowman', 300, F, { w: 16, h: 30, hint: 'Snowman', interact: say("A snowman. Somebody gave him a Donald's hat. {p}Everybody's hiring except the snowman.") });
      this.addProp('mooseSign', 560, F, { w: 16, h: 40, hint: 'Sign', interact: say("'MOOSE CROSSING'. {p}They mean it.") });
      this.addCustom((g, x, y, t) => { // frozen lake with ice fisher
        const p = this.pal;
        gfx.ellipse(x + 90, y - 2, 112, 12, p.snowHi);         // the drifted shore
        gfx.ellipse(x + 90, y, 104, 10, gfx.shade(p.ice, -16));
        gfx.ellipse(x + 90, y - 1, 100, 9, p.ice);
        gfx.ellipse(x + 84, y - 2, 86, 6, gfx.shade(p.ice, 16));
        gfx.ellipse(x + 62, y - 3, 38, 3, gfx.shade(p.ice, 34));
        for (let i = 0; i < 8; i++) gfx.line(x + 16 + i * 22, y - 5 + (i % 3), x + 34 + i * 22, y + 3 - (i % 2) * 3, gfx.shade(p.ice, -28));
        for (let i = 0; i < 6; i++) gfx.line(x + 30 + i * 28, y + 2, x + 40 + i * 28, y - 4, gfx.shade(p.ice, -20));
        for (let i = 0; i < 10; i++) gfx.ellipse(x + 4 + i * 20, y + 6, 13, 2.5, p.snowHi);
        gfx.ellipse(x + 82, y - 4, 7, 2.6, '#1d2634'); gfx.ellipse(x + 82, y - 5, 5, 1.8, '#0f1620');
        gfx.ellipse(x + 82, y - 6, 8, 2, p.snowHi);
        CH.drawCritter(g, x + 100, y - 2, { species: 'beaver', outfit: 'winter', pose: 'sit', noShadow: true, arm: 'hold' });
        gfx.line(x + 108, y - 12, x + 88, y - 5, '#3a3630'); gfx.rect(x + 106, y - 14, 4, 4, '#2a4f9e');
        for (let i = 0; i < 3; i++) { const k = (t * 0.4 + i * 0.33) % 1; gfx.ellipse(x + 102, y - 16 - k * 12, 1.5 + k * 2, 1 + k * 1.5, `rgba(238,244,248,${(0.4 - k * 0.4).toFixed(2)})`); }
        if (Math.sin(t * 0.7) > 0.9) gfx.text('...', x + 100, y - 40, p.night ? '#cfd8e8' : '#333', { font: 'small' });
      }, 700, F + 4, 200, 20, { id: 'lake', anim: true, hint: 'Frozen lake', interact: say("Old Bartleby, ice fishing. He's been out there since 1994. {p}He waves. I wave. That's our whole relationship."), range: 60 });
      this.addCustom((g, x, y) => { gfx.rect(x, y - 3, 14, 3, '#221f2a'); gfx.rect(x + 2, y - 4, 10, 1, '#100e16'); gfx.rect(x - 2, y - 1, 18, 1, gfx.shade(this.pal.road, 16)); }, 1000, F + 16, 14, 4, { id: 'pothole', anim: false });
      this.addProp('busStop', 1300, F, { w: 30, h: 50, hint: 'Bus stop', interact: () => this.interactBus() });
      this.addProp('donaldsRoadSign', 1400, F);
      this.addProp('townSign', 1466, F);
      // town
      this.addProp('lamppost', 1520, F); this.addProp('lamppost', 1760, F); this.addProp('lamppost', 2000, F); this.addProp('lamppost', 2240, F);
      this.addProp('storefront', 1560, F, { w: 120, h: 90, st: { color: '#8a5a2b', name: 'GENERAL STORE', sign: 'JOB BOARD' }, hint: 'General store', interact: () => this.interactStore() });
      this.addProp('storefront', 1720, F, { w: 120, h: 90, st: { color: '#a03a2a', name: 'TAM HORTONS', textColor: '#fff', sign: 'TIMBITS' }, hint: 'Tam Hortons', interact: say("Tam Hortons. The smell of coffee and doughnuts. {p}I have $" + Math.floor(S.money) + ". {p}Focus, Chubby.") });
      this.addProp('storefront', 1880, F, { w: 120, h: 90, st: { color: '#4a5a8a', name: 'MOOSE HOLLOW ARENA', textColor: '#fff', sign: 'GO MALLARDS' }, hint: 'Arena', interact: say("The arena. Dad played here. {p}Rick still hasn't fixed the Zamboni.") });
      this.addProp('hydrant', 1700, F); this.addProp('hydrant', 2060, F);
      this.addProp('car', 1640, F + 24, { st: { color: '#3b6fd6' } }); this.addProp('car', 1960, F + 24, { st: { color: '#c8a060' } });
      this.addCustom((g, x, y) => {
        art.blit(x, y, 40, 44, 5, 40, () => {
          gfx.rect(5, 6, 30, 32, '#5a5a66'); gfx.rect(5, 6, 30, 2, '#7c7c88');
          gfx.rect(7, 9, 26, 24, '#2f3340'); gfx.frame(7, 9, 26, 24, '#43434e');
          gfx.text('BUS', 20, 13, '#f5c33b', { align: 'center', font: 'small' });
          gfx.text('STOP', 20, 21, '#f5c33b', { align: 'center', font: 'small' });
          gfx.text('12', 20, 28, '#9fdcff', { align: 'center', font: 'small' });
          gfx.rect(4, 3, 32, 3, '#e9f1f7');
        });
      }, 2100, F, 30, 30, { id: 'townBus', anim: false });
      this.donalds = this.addProp('donaldsExterior', 2380, F, { hint: "Donald's Burgers", interact: () => this.interactDonalds(), range: 60, offsetX: 20 });
      this.addProp('pine', 2620, F, { st: { h: 60 } });
      // kids sledding on a hill (animated)
      this.addCustom((g, x, y, t) => {
        const p = this.pal, F = this.floorY;
        gfx.clip(x - 46, 150, 230, F + 2 - 150);
        gfx.ellipse(x + 70, F + 26, 102, 45, p.snow);
        gfx.ellipse(x + 52, F + 22, 78, 37, p.snowHi);
        gfx.ellipse(x + 120, F + 26, 46, 26, p.snowSh);
        for (let i = 0; i < 5; i++) gfx.ellipse(x + 20 + i * 26, F + 8 - (4 - i) * 2, 15, 3, p.snowHi);
        const surf = (sx) => { const u = (sx - (x + 70)) / 102; return F + 26 - 45 * Math.sqrt(Math.max(0, 1 - u * u)) - 2; };
        const k = (t * 0.25) % 1, sx = x + 24 + k * 124;
        for (let i = 1; i < 18; i++) { const px0 = x + 24 + (k - i * 0.012) * 124; if (px0 > x + 24) gfx.px(px0, surf(px0) + 1, p.snowSh); }
        CH.PROPS.sled.draw(g, sx, surf(sx) + 2);
        CH.drawCritter(g, sx + 10, surf(sx) - 3, { species: 'rabbit', outfit: 'winter', pose: 'sit', noShadow: true, height: 0.7, width: 0.8, face: 'happy' });
        gfx.unclip();
        if (k > 0.9) gfx.text('WHEEE', sx + 10, surf(sx) - 28, p.night ? '#e8ecf4' : '#333', { font: 'small', align: 'center' });
      }, 1120, F - 8, 140, 40, { id: 'hill', anim: true });
      // moose
      this.moose = new CH.NPC({ name: 'Moose', species: 'moose', outfit: 'casual', x: 620, y: F + 12, speed: 20, height: 1.6, width: 1.5, outfitOverride: { top: '#5b3d24', topD: '#3a2414', bottom: '#5b3d24' } });
      this.moose.hidden = true; this.addNPC(this.moose);
      // townsfolk
      const tf = CH.makeCustomer(1800, F + 1); tf.wanderRange = [1600, 2000]; this.addNPC(tf);
      const tf2 = CH.makeCustomer(2200, F + 1); tf2.wanderRange = [2150, 2350]; this.addNPC(tf2);
    }
    enter() {
      A.play('town', 2); fx.setFade(1);
      this.run(this.intro());
    }
    *intro() {
      this.locked = true;
      yield fx.fadeIn(1.2);
      if (this.dest === 'donalds' && !CH.flag('walkedOnce')) {
        yield ui.say('Chubby', "Okay. Outside. {p}It's minus eighteen. My suit has the insulating properties of a paper towel. {pp}Main Street is that way. Two and a half kilometres. {p}I have walked further in games.", { face: 'worried' });
        ui.setObjective("Walk into town to Donald's Burgers  →");
        CH.flag('walkedOnce', true);
      } else ui.setObjective(this.dest === 'donalds' ? "Head to Donald's Burgers  →" : this.dest === 'home' ? 'Walk home  ←' : 'Head to the hospital  →');
      this.locked = false;
    }
    *interactBus() {
      const c = yield ui.choose('Chubby', 'The bus schedule says "every 40 minutes*". The asterisk says "*or never". Fare: $3.50.', ['Wait for the bus ($3.50)', 'Keep walking']);
      if (c !== 0) return;
      if (S.money < 3.5) { yield ui.say('Chubby', "I can't afford the bus. {p}I can't afford the BUS.", { face: 'sad' }); return; }
      this.locked = true;
      yield this.walkTo(1320); this.player.flip = false;
      yield ui.say('Chubby', 'Waiting.', { auto: 1.5 }); S.hour += 0.3; yield ui.say('Chubby', 'Waiting...', { auto: 1.5 }); S.hour += 0.3;
      A.sfx('bus'); yield 1.5;
      CH.addMoney(-3.5);
      yield fx.fadeOut(0.8);
      this.player.x = 2100; this.cam.x = 1860; S.hour += 0.2;
      yield fx.fadeIn(0.8);
      yield ui.say('Chubby', "The bus driver asked if I was 'the burger guy'. {p}I said 'not yet'. {p}He nodded like that meant something.", { face: 'normal' });
      this.locked = false;
    }
    *interactStore() {
      yield ui.say('Chubby', "The job board. {p}'Snow removal - must have truck.' 'Babysitter - must like children.' 'Lumberjack - must be Gus.' {pp}One card says 'DONALD'S - JUST COME IN'. Someone has drawn a heart on it. It was Brenda.", { face: 'normal' });
    }
    *interactDonalds() {
      if (this.dest !== 'donalds') { yield ui.say('Chubby', "Donald's. {p}Not now."); return; }
      this.locked = true;
      yield this.walkTo(this.donalds.x + 119);
      this.player.flip = false;
      const late = S.hour > 10.05;
      if (!S.job) {
        yield ui.say('Chubby', late ? `It's ${CH.timeStr()}. {p}I'm late. {p}I'm late to the first interview of my life. Great. GREAT.` : `It's ${CH.timeStr()}. {p}Here we go. {pp}Deep breath. {p}Suit on. Buttons... mostly on. {p}Pulse: present.`, { face: late ? 'shock' : 'worried' });
        S.interviewLate = late;
        A.sfx('door'); yield fx.fadeOut(1);
        CH.game.set(new CH.InterviewScene());
      } else { A.sfx('door'); yield fx.fadeOut(0.8); if (CH.startShift) CH.startShift(); }
    }
    update(dt) {
      super.update(dt);
      const pl = this.player, F = this.floorY;
      // wind comes in gusts
      this.gustT -= dt;
      if (this.gustT <= 0) { this.gustT = CH.rand(2.5, 6); this.gust = CH.rand(6, 26); }
      this.gust = CH.approach(this.gust, 10, dt * 8);
      for (const s of this.snow) {
        const sp = [10, 22, 44][s.l];
        s.y += dt * sp;
        s.x += dt * (this.gust * (0.4 + s.l * 0.35)) + Math.sin(this.t * 1.6 + s.ph) * dt * 9 * (s.l + 1);
        if (s.y > H) { s.y = -3; s.x = Math.random() * (W + 40) - 20; }
        if (s.x > W + 20) s.x -= W + 40; else if (s.x < -20) s.x += W + 40;
      }
      // footprints, pressed into the snow behind him
      if (Math.abs(pl.vx) > 18 && this.py === 0) {
        if (Math.abs(pl.x - this.lastPrint) > 10) {
          this.lastPrint = pl.x;
          this.prints.push({ x: pl.x, y: F + 3 + (this.prints.length % 2 ? 3 : 0), f: pl.vx < 0 });
          if (this.prints.length > 110) this.prints.shift();
        }
      }
      // breath fog
      this.breathT -= dt;
      if (this.breathT <= 0) { this.breathT = CH.rand(1.5, 2.6); this.puffs.push({ x: pl.x + (pl.flip ? -12 : 12), y: pl.y - 29, t: 0, v: pl.flip ? -9 : 9 }); }
      for (const q of this.puffs) { q.t += dt; q.x += q.v * dt; q.y -= dt * 7; }
      if (this.puffs.length) this.puffs = this.puffs.filter((q) => q.t < 1.5);
      // moose crossing event
      if (!this.mooseCrossed && pl.x > 500 && pl.x < 560 && !this.locked) { this.mooseCrossed = true; this.run(this.mooseEvent()); }
      // pothole trip
      if (!this.tripped && Math.abs(pl.x - 1007) < 6 && this.py === 0 && Math.abs(pl.vx) > 30) { this.tripped = true; this.run(this.tripEvent()); }
    }
    *mooseEvent() {
      const pl = this.player;
      this.locked = true; pl.vx = 0;
      this.moose.hidden = false; this.moose.x = 720; this.moose.flip = true;
      A.sfx('moose'); CH.doShake(2, 0.4);
      pl.face = 'shock'; pl.doEmote('!', 2);
      const w = this.moose.walkTo(560);
      let t = 0; while (!w.done) { t += 1 / 60; if (Math.floor(t * 3) !== Math.floor((t - 1 / 60) * 3)) { A.sfx('footBig'); CH.doShake(1.5, 0.15); } yield 1 / 60; }
      this.moose.flip = false;
      yield ui.say('Chubby', '...Morning.', { face: 'worried' });
      yield 0.8;
      this.moose.say('...', 2); A.sfx('moose');
      yield 1.5;
      yield ui.say('Chubby', "He's looking at my suit. {pp}He's judging my suit. {p}A moose is judging my suit.", { face: 'worried' });
      this.moose.walkTo(-100); this.moose.onArrive = () => { this.moose.hidden = true; };
      yield 1.0;
      pl.face = 'normal';
      this.locked = false;
    }
    *tripEvent() {
      const pl = this.player;
      this.locked = true;
      A.sfx('thud'); CH.doShake(3, 0.3); pl.vx = 0;
      pl.squashY.x = 0.5; pl.squashX.x = 1.5; pl.jiggle.kick(120); pl.face = 'shock';
      this.particles.burst(pl.x, pl.y, 10, { color: ['#eef4f8', '#fff'], speed: 50, grav: 100, life: 0.5, angle: -Math.PI / 2, spread: 2.5 });
      yield 0.6;
      yield ui.say('Chubby', "Pothole. {p}Of course. {pp}I'm fine. The suit is fine. My dignity was already gone.", { face: 'worried' });
      pl.face = 'normal';
      this.locked = false;
    }
    drawForeground(g) {
      const p = this.pal, F = this.floorY;
            if (p.lamp > 0.2) for (const x of [1520, 1760, 2000, 2240]) {
        glow(x + 5, F - 58, 40, '#ffd27a', 0.34 * p.lamp);
        glow(x + 5, F - 58, 16, '#fff4cf', 0.40 * p.lamp);
        const gl = gfx.cur, o = gl.globalAlpha; gl.globalAlpha = 0.12 * p.lamp;
        gfx.tri(x - 1, F - 56, x + 11, F - 56, x + 26, F + 2, '#ffe6a8'); gfx.tri(x - 1, F - 56, x + 11, F - 56, x - 16, F + 2, '#ffe6a8');
        gl.globalAlpha = o;
        gfx.ellipse(x + 5, F + 1, 16, 4, gfx.alpha('#ffe6a8', 0.14 * p.lamp));
      }
      if (p.win > 0.35) for (const x of [1560, 1720, 1880]) { glow(x + 32, F - 30, 38, '#ffcb78', 0.10 * p.win); glow(x + 92, F - 30, 38, '#ffcb78', 0.10 * p.win); }
      if (p.win > 0.35) glow(2400, F - 40, 60, '#ffcb78', 0.10 * p.win);
    }
    draw(g) {
      const p = this.pal; LP = p;
      const cx = Math.round(this.cam.x), t = this.t;
      // ---- sky ---------------------------------------------------------------
      if (!this._skyRamp) {
        this._skyRamp = [];
        for (let i = 0; i < 16; i++) { const u = (i / 15) * 3, a = Math.min(2, Math.floor(u)); this._skyRamp.push(gfx.mix(p.sky[a], p.sky[a + 1], u - a)); }
      }
      gfx.vgrad(0, 0, W, 200, this._skyRamp);
      if (p.star > 0.03) {
        for (let i = 0; i < 64; i++) {
          const sx = CH.wrap(i * 83 - cx * 0.02, W), sy = (i * 41) % 124;
          const tw = 0.55 + 0.45 * Math.sin(t * 2.2 + i);
          gfx.px(sx, sy, `rgba(255,255,255,${(p.star * tw * 0.85).toFixed(2)})`);
        }
      }
      // sun or moon on its winter arc
      const hr = ((S.hour % 24) + 24) % 24;
      if (hr > 6.4 && hr < 17.6) {
        const u = (hr - 6.4) / 11.2, sxp = 34 + u * 410, syp = 162 - Math.sin(u * Math.PI) * 126;
        glow(sxp, syp, 30, '#ffe9a8', 0.13); glow(sxp, syp, 18, '#fff4c8', 0.18);
        gfx.circle(sxp, syp, 11, '#fff2cc'); gfx.circle(sxp, syp, 9, '#fffdf0');
      } else {
        const hh = hr < 6.4 ? hr + 24 : hr, u = (hh - 17.6) / 12.8, sxp = 34 + u * 410, syp = 150 - Math.sin(u * Math.PI) * 112;
        glow(sxp, syp, 26, '#cfe0ff', 0.12);
        gfx.circle(sxp, syp, 10, '#e6ebf4'); gfx.circle(sxp, syp, 8, '#f4f6fb');
        gfx.ellipse(sxp - 3, syp - 2, 2.2, 1.7, '#cdd4e0'); gfx.ellipse(sxp + 3, syp + 3, 1.7, 1.3, '#cdd4e0'); gfx.ellipse(sxp + 1, syp - 5, 1.4, 1.1, '#cdd4e0');
      }
      // thin cloud bars
      for (let i = 0; i < 7; i++) {
        const cw = 90 + (i % 3) * 46, x = CH.wrap(i * 150 - cx * 0.04 + t * 1.6, W + cw + 80) - cw - 40, cy0 = 26 + i * 15;
        gfx.ellipse(x + cw / 2, cy0, cw / 2, 3.2, gfx.alpha(p.mtnS, 0.16));
        gfx.ellipse(x + cw / 2 - 12, cy0 - 2, cw / 3, 2.2, gfx.alpha(p.mtnS, 0.12));
      }
      // ---- far mountains (two hazy ranges) ---------------------------------------
      const haze = (c, k) => gfx.mix(c, p.sky[3], k);
      for (let i = 0; i < 7; i++) {
        const x = CH.wrap(i * 196 - cx * 0.03, W + 400) - 200;
        const hgt = 52 + ((i * 7) % 3) * 16;
        gfx.tri(x - 96, 190, x + 96, 190, x, 190 - hgt, haze(p.mtn, 0.5));
        gfx.tri(x - 24, 190 - hgt + 22, x + 24, 190 - hgt + 22, x, 190 - hgt, haze(p.mtnS, 0.45));
      }
      for (let i = 0; i < 6; i++) {
        const x = CH.wrap(i * 212 - cx * 0.06, W + 440) - 220;
        const hgt = 70 + ((i * 11) % 3) * 20;
        gfx.tri(x - 112, 192, x + 112, 192, x, 192 - hgt, haze(p.mtn, 0.22));
        gfx.tri(x, 192, x + 112, 192, x, 192 - hgt, haze(gfx.shade(p.mtn, -16), 0.22));
        gfx.tri(x - 30, 192 - hgt + 28, x + 30, 192 - hgt + 28, x, 192 - hgt, haze(p.mtnS, 0.2));
        gfx.tri(x, 192 - hgt + 28, x + 30, 192 - hgt + 28, x, 192 - hgt, haze(gfx.shade(p.mtnS, -18), 0.2));
      }
      gfx.rect(0, 188, W, 6, haze(gfx.mix(p.mtn, p.snow, 0.5), 0.3));
      // ---- distant treeline ------------------------------------------------------
      gfx.rect(0, 190, W, 12, p.far);
      for (let i = 0; i < 70; i++) {
        const x = CH.wrap(i * 17 - cx * 0.14, W + 40) - 20, hh = 9 + ((i * 5) % 5) * 4;
        gfx.tri(x - 5, 192, x + 5, 192, x, 192 - hh, p.far);
      }
      // ---- mid treeline ----------------------------------------------------------
      gfx.rect(0, 196, W, 12, p.mid);
      for (let i = 0; i < 54; i++) {
        const x = CH.wrap(i * 23 - cx * 0.3, W + 60) - 30, hh = 15 + ((i * 11) % 4) * 7;
        gfx.tri(x - 8, 198, x + 8, 198, x, 198 - hh, p.mid);
        gfx.tri(x - 4, 198 - hh * 0.45, x + 4, 198 - hh * 0.45, x, 198 - hh, gfx.mix(p.mid, p.snowHi, 0.3));
      }
      // ---- near treeline ----------------------------------------------------------
      gfx.rect(0, 206, W, 10, p.near);
      for (let i = 0; i < 40; i++) {
        const x = CH.wrap(i * 34 - cx * 0.55, W + 80) - 40, hh = 24 + ((i * 13) % 4) * 10;
        gfx.tri(x - 12, 210, x + 12, 210, x, 210 - hh, p.near);
        gfx.tri(x - 6, 210 - hh * 0.4, x + 6, 210 - hh * 0.4, x, 210 - hh, gfx.mix(p.near, p.snowHi, 0.34));
        gfx.tri(x - 10, 210 - hh * 0.14, x + 10, 210 - hh * 0.14, x, 210 - hh * 0.5, gfx.mix(p.near, p.snowHi, 0.18));
      }
      // ---- world -------------------------------------------------------------------
      super.draw(g);
      // breath fog
      for (const q of this.puffs) {
        const k = q.t / 1.5, a = (1 - k) * 0.45;
        gfx.ellipse(q.x - cx, q.y, 2 + k * 7, 1.4 + k * 4.5, `rgba(234,243,250,${a.toFixed(2)})`);
        gfx.ellipse(q.x - cx + 3, q.y - 1, 1.4 + k * 4, 1 + k * 3, `rgba(255,255,255,${(a * 0.7).toFixed(2)})`);
      }
      // ---- snow, three depths -------------------------------------------------------
      for (const s of this.snow) {
        if (s.l === 0) gfx.px(s.x, s.y, 'rgba(226,238,250,0.45)');
        else if (s.l === 1) gfx.px(s.x, s.y, 'rgba(240,248,255,0.8)');
        else { gfx.rect(s.x, s.y, 2, 2, '#ffffff'); gfx.px(s.x + 1, s.y - 1, 'rgba(255,255,255,0.6)'); }
      }
      // ---- foreground drifts, in front of everything ---------------------------------
      const fx0 = -cx * 1.35;
      for (let i = 0; i < 9; i++) {
        const x = CH.wrap(i * 88 + fx0, W + 200) - 100;
        gfx.ellipse(x, 264 + (i % 3) * 2, 58 + (i % 4) * 13, 15, p.snow);
        gfx.ellipse(x - 14, 260 + (i % 3) * 2, 32, 9, p.snowHi);
        gfx.ellipse(x + 20, 262 + (i % 2) * 3, 22, 6, p.snowHi);
      }
      gfx.rect(0, 268, W, 2, p.snowHi);
      // ---- time of day over the whole frame --------------------------------------------
      if (p.tintA > 0.005) {
        g.save(); g.globalAlpha = p.tintA; g.globalCompositeOperation = 'multiply';
        gfx.rect(0, 0, W, H, p.tint); g.restore();
      }
      if (p.lamp > 0.5) { g.save(); g.globalAlpha = 0.05; g.globalCompositeOperation = 'lighter'; gfx.rect(0, 0, W, H, '#2a3a6a'); g.restore(); }
    }
  }
  CH.TravelScene = TravelScene;

  // ---- Interview day start -----------------------------------------------------------------------
  CH.startInterviewDay = () => {
    S.chapter = 'interview'; S.day = 3; S.hour = 7.2; S.outfit = 'suit';
    const cabin = new CH.CabinScene({ mode: 'home', momPresent: false, playerX: 60 });
    cabin.tvMode = 'off'; cabin.fire.st.lit = false; cabin.pancakes.st.eaten = true; cabin.stove.st.steam = false; cabin.stove.st.pan = false; cabin.bgDirty = true;
    cabin.player.outfit = 'suit';
    cabin.onLeave = function* () { cabin.locked = true; yield ui.say('Chubby', "Okay. {p}Interview. {p}Ten AM. {p}Let's go be a person.", { face: 'focused' }); A.sfx('door'); yield fx.fadeOut(1); CH.game.set(new TravelScene({ dest: 'donalds' })); };
    cabin.onSleep = function* () { yield ui.say('Chubby', "No. NO. Interview. Go."); };
    cabin.onFridge = function* () { A.sfx('eat'); S.hunger = 0; yield ui.say('Chubby', "Cold pancake. Breakfast of champions. {p}Well. Breakfast of janitors, hopefully."); };
    cabin.onCouch = function* () { yield ui.say('Chubby', "Not today, couch. {p}I know. I know. I'll be back."); };
    cabin.onTV = function* () { yield ui.say('Chubby', "The Blue Hedgehog is still paused mid-victory pose. {p}Hang in there, buddy."); };
    CH.game.set(cabin);
    cabin.run((function* () {
      cabin.locked = true; fx.setFade(1);
      yield 0.4;
      yield fx.showCard('DAY 3', 'Monday  -  7:12 AM  -  Interview at 10.', 3, '#e8e0c8');
      yield fx.fadeIn(1.2);
      A.sfx('alarm'); yield 0.5;
      yield ui.say('Chubby', "I'm up. I'm UP. {p}I was up at 4, and 5, and 6. {pp}Suit: on. Buttons: two of three. {p}Confidence: located somewhere in the pit of my stomach, next to the fear.", { face: 'tired' });
      ui.setObjective("Leave through the front door for the interview");
      ui.showMoney = true;
      cabin.locked = false;
    })());
  };

  CH.SCENES.travel = () => { S.outfit = 'suit'; return new TravelScene({ dest: 'donalds' }); };
})(window.CH);
