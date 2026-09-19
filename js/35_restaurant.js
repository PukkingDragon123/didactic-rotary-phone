// ============================================================================
// DONALD'S BURGERS: the living restaurant simulator + shift flow
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, fx = CH.fx, A = CH.audio, inp = CH.input, S = CH.state, P = CH.PAL;
  const W = CH.W, H = CH.H;
  const SHIFT_SECONDS = 270; // real seconds for an 8-hour shift

  // ---- restaurant props ----------------------------------------------------------------------
  const def = (n, w, h, d) => { CH.PROPS[n] = { name: n, w, h, draw: d }; };
  const art = CH.art, M = {
    red: art.mat('#c8352b', { dark: -36, light: 32 }),
    gold: art.mat('#f5c33b', { dark: -34, light: 26 }),
    steel: art.mat('#9aa0ae', { dark: -34, light: 28 }),
    dark: art.mat('#3c3a48', { dark: -22, light: 34 }),
    wood: art.mat('#8a5a2b', { dark: -34, light: 28 }),
    plastic: art.mat('#3b6fd6', { dark: -34, light: 30 }),
  };
  // Free-standing objects get the ink line; the counter run and wall fittings
  // are architecture and stay flat so the room does not turn into soup.
  const outlined = (x, y, w, h, ax, ay, fn) => art.blit(x, y, w, h, ax, ay, fn);

  def('glassDoor', 34, 74, (g, x, y, t, st) => {
    gfx.rect(x - 3, y - 76, 40, 76, M.steel.d);
    gfx.rect(x - 1, y - 74, 36, 74, M.steel.base);
    gfx.rect(x + 1, y - 72, 32, 70, '#9fdcff');
    g.globalAlpha = 0.35; gfx.rect(x + 3, y - 70, 9, 66, '#fff'); gfx.rect(x + 20, y - 58, 4, 40, '#fff'); g.globalAlpha = 1;
    gfx.rect(x + 16, y - 74, 2, 74, M.steel.d);
    gfx.rect(x + 5, y - 40, 8, 3, M.dark.base); gfx.rect(x + 21, y - 40, 8, 3, M.dark.base);
    gfx.rrect(x + 2, y - 68, 30, 10, 2, M.red.base);
    gfx.rrect(x + 2, y - 68, 30, 3, 1, M.red.l);
    gfx.text('OPEN', x + 17, y - 66, '#fff', { align: 'center', font: 'small' });
    // frost creeping up the glass from outside
    for (let i = 0; i < 14; i++) gfx.px(x + 2 + (i * 7) % 30, y - 6 - (i % 4) * 2, 'rgba(255,255,255,0.5)');
  });

  def('booth', 96, 52, (g, x, y, t, st) => {
    const dirty = st && st.dirty;
    for (const bx of [x, x + 78]) {
      outlined(bx + 9, y, 24, 56, 12, 54, () => {
        gfx.rrect(2, 2, 20, 52, 4, M.red.dd);
        gfx.rrect(2, 0, 20, 50, 4, M.red.base);
        gfx.rrect(4, 2, 16, 28, 3, M.red.l);
        gfx.rect(4, 16, 16, 1, M.red.d);
        gfx.rect(4, 30, 16, 10, M.red.d);
        gfx.rect(2, 50, 20, 4, M.dark.base);
      });
    }
    // seat cushions between the backs
    gfx.rrect(x + 18, y - 26, 14, 10, 2, M.red.d);
    gfx.rrect(x + 18, y - 27, 14, 9, 2, M.red.base);
    gfx.rrect(x + 66, y - 26, 14, 10, 2, M.red.d);
    gfx.rrect(x + 66, y - 27, 14, 9, 2, M.red.base);
    // pedestal table
    outlined(x + 48, y, 56, 40, 28, 38, () => {
      gfx.rect(24, 12, 8, 26, M.steel.d);
      gfx.rect(25, 12, 3, 26, M.steel.base);
      gfx.rrect(18, 34, 20, 4, 2, M.steel.d);
      gfx.rrect(3, 6, 50, 7, 2, M.gold.d);
      gfx.rrect(3, 5, 50, 6, 2, M.gold.base);
      gfx.rrect(4, 5, 48, 2, 1, M.gold.l);
    });
    // condiments and a number card
    gfx.rrect(x + 30, y - 36, 4, 7, 1, '#c8352b'); gfx.px(x + 31, y - 37, '#8f2419');
    gfx.rrect(x + 35, y - 35, 4, 6, 1, '#f5c33b');
    gfx.rrect(x + 60, y - 37, 6, 8, 1, '#f4f4f8'); gfx.rect(x + 61, y - 36, 4, 2, '#c8352b');
    if (dirty) {
      CH.FOOD.tray(g, x + 47, y - 31);
      gfx.rrect(x + 38, y - 38, 11, 5, 1, '#e0c090');
      CH.FOOD.cup(g, x + 54, y - 32, 0.2, 'S');
      gfx.px(x + 42, y - 31, '#c8352b'); gfx.px(x + 50, y - 31, '#f5c33b'); gfx.px(x + 46, y - 24, '#f0d080');
      for (let i = 0; i < 4; i++) gfx.px(x + 39 + i * 5, y - 24 + (i % 2), '#caa070');
      for (let i = 0; i < 3; i++) art.effect('stink', x + 40 + i * 8, y - 40, t + i, 0.6);
    } else {
      gfx.rrect(x + 40, y - 34, 9, 4, 1, '#f4f4f8');
      gfx.hline(x + 41, y - 33, 7, '#dcd6c8');
    }
  });

  def('counter', 190, 48, (g, x, y, t, st) => {
    // base run
    gfx.rect(x, y - 48, 190, 48, M.red.d);
    gfx.rect(x, y - 46, 190, 44, M.red.base);
    for (let i = 0; i < 190; i += 22) { gfx.rect(x + i + 2, y - 40, 12, 34, M.red.dd); gfx.rect(x + i + 2, y - 40, 12, 2, M.red.d); }
    gfx.rect(x, y - 6, 190, 6, M.dark.base);
    // worktop
    gfx.rect(x - 2, y - 52, 194, 5, '#3a3038');
    gfx.rect(x - 2, y - 52, 194, 2, M.gold.base);
    gfx.rect(x - 2, y - 52, 194, 1, M.gold.l);
    // registers
    for (const rx of [x + 28, x + 100]) {
      outlined(rx + 12, y - 52, 30, 26, 15, 24, () => {
        gfx.rrect(1, 8, 28, 16, 2, M.dark.d);
        gfx.rrect(1, 6, 28, 16, 2, M.dark.base);
        gfx.rrect(4, 8, 22, 9, 1, '#2a4a70');
        gfx.rect(6, 10, 12, 1, '#7fd0ff'); gfx.rect(6, 13, 8, 1, '#7fd0ff');
        gfx.rrect(5, 19, 20, 3, 1, '#22202c');
        for (let i = 0; i < 4; i++) gfx.px(7 + i * 4, 20, '#6a6a7c');
      });
    }
    // pickup shelf with a heat lamp
    gfx.rect(x + 138, y - 76, 44, 5, M.steel.d);
    gfx.rect(x + 138, y - 76, 44, 2, M.steel.base);
    gfx.rrect(x + 150, y - 71, 22, 7, 2, M.red.d);
    gfx.rrect(x + 150, y - 71, 22, 4, 2, M.red.base);
    g.globalAlpha = 0.22 + Math.sin(t * 3) * 0.05;
    gfx.tri(x + 140, y - 52, x + 182, y - 52, x + 161, y - 66, '#ffc070');
    g.globalAlpha = 1;
    gfx.text('PICKUP', x + 160, y - 84, '#f2ecd8', { align: 'center', font: 'small', outline: '#2a1f33' });
    if (st && st.bags) for (let i = 0; i < Math.min(3, st.bags); i++) CH.FOOD.bag(g, x + 148 + i * 13, y - 52, false, 1);
    gfx.rrect(x + 8, y - 58, 13, 7, 1, '#f4f4f8');
    gfx.rrect(x + 80, y - 56, 9, 5, 1, '#c8352b');
  });

  def('menuBoard', 200, 46, (g, x, y) => {
    gfx.rect(x - 2, y - 48, 204, 50, '#231f2c');
    gfx.rect(x, y - 46, 200, 46, '#15131c');
    gfx.rect(x, y - 46, 200, 1, '#3a3448');
    const MN = CH.MENU || [];
    MN.slice(0, 12).forEach((m, i) => {
      const col = Math.floor(i / 6), row = i % 6;
      gfx.text(m.name, x + 6 + col * 100, y - 42 + row * 7, '#f5c33b', { font: 'small' });
      gfx.text('$' + m.price.toFixed(2), x + 96 + col * 100, y - 42 + row * 7, '#efe6d2', { align: 'right', font: 'small' });
    });
    gfx.rect(x + 99, y - 44, 1, 42, '#2e2a3a');
  });

  def('orderScreen', 44, 26, (g, x, y, t, st) => {
    gfx.rect(x - 1, y - 27, 46, 28, '#231f2c');
    gfx.rect(x + 1, y - 25, 42, 24, '#07200f');
    gfx.text('NOW SERVING', x + 22, y - 22, '#3ecf6a', { align: 'center', font: 'small' });
    gfx.text(String((st && st.num) || 42), x + 22, y - 13, '#9cf0b0', { align: 'center' });
    g.globalAlpha = 0.12;
    for (let yy = -25; yy < 0; yy += 2) gfx.rect(x + 1, y + yy, 42, 1, '#000');
    g.globalAlpha = 1;
  });

  def('grillStation', 76, 64, (g, x, y, t, st) => {
    gfx.rect(x, y - 44, 76, 44, M.steel.d);
    gfx.rect(x + 1, y - 43, 74, 42, M.steel.base);
    for (let i = 0; i < 3; i++) gfx.rect(x + 4, y - 36 + i * 12, 68, 1, M.steel.d);
    gfx.rect(x, y - 6, 76, 6, M.dark.base);
    // hotplate
    gfx.rect(x + 3, y - 49, 70, 7, '#241f28');
    gfx.rect(x + 5, y - 47, 66, 3, '#3a3038');
    g.globalAlpha = 0.24 + Math.sin(t * 5) * 0.06;
    gfx.rect(x + 5, y - 48, 66, 5, '#ff6030');
    g.globalAlpha = 1;
    for (let i = 0; i < 3; i++) CH.FOOD.patty(g, x + 18 + i * 19, y - 51, 0.7);
    for (let i = 0; i < 4; i++) {
      const k = (t * 0.5 + i * 0.25) % 1;
      gfx.px(x + 14 + i * 16 + Math.round(Math.sin(t * 2 + i) * 2), y - 56 - k * 26, 'rgba(255,255,255,' + (0.55 - k * 0.55).toFixed(2) + ')');
    }
    // extractor hood
    gfx.rect(x - 2, y - 66, 80, 10, M.steel.dd);
    gfx.rect(x - 2, y - 66, 80, 3, M.steel.d);
    for (let i = 8; i < 76; i += 14) gfx.rect(x + i, y - 62, 10, 4, '#2c2a36');
  });

  def('fryerStation', 62, 54, (g, x, y, t) => {
    gfx.rect(x, y - 44, 62, 44, M.steel.d);
    gfx.rect(x + 1, y - 43, 60, 42, M.steel.base);
    gfx.rect(x, y - 6, 62, 6, M.dark.base);
    for (const bx of [x + 4, x + 33]) {
      gfx.rect(bx, y - 50, 25, 11, M.steel.dd);
      gfx.rect(bx + 2, y - 48, 21, 7, '#e8c040');
      gfx.rect(bx + 2, y - 48, 21, 1, '#fff0a8');
      for (let i = 0; i < 5; i++) gfx.px(bx + 4 + i * 4, y - 47 + Math.round(Math.sin(t * 7 + i) * 1), '#fff8c0');
    }
    // basket handles
    gfx.rect(x + 11, y - 66, 3, 16, '#aab0bc'); gfx.rrect(x + 6, y - 69, 13, 4, 2, M.red.base);
    gfx.rect(x + 40, y - 62, 3, 13, '#aab0bc'); gfx.rrect(x + 36, y - 65, 12, 4, 2, M.red.d);
    // grease sheen
    g.globalAlpha = 0.15; gfx.rect(x + 2, y - 40, 58, 3, '#fff'); g.globalAlpha = 1;
  });

  def('prepStation', 74, 54, (g, x, y, t) => {
    gfx.rect(x, y - 44, 74, 44, M.steel.d);
    gfx.rect(x + 1, y - 43, 72, 42, M.steel.base);
    gfx.rect(x, y - 46, 74, 4, '#e8ecf0');
    gfx.rect(x, y - 46, 74, 1, '#fbfdff');
    gfx.rect(x, y - 6, 74, 6, M.dark.base);
    const fills = ['#a05040', '#f5c33b', '#5fc05a', '#d13c3c', '#e8d8f0'];
    for (let i = 0; i < 5; i++) {
      gfx.rrect(x + 4 + i * 14, y - 58, 12, 12, 2, '#9fb6c6');
      gfx.rrect(x + 5 + i * 14, y - 57, 10, 8, 1, fills[i]);
      gfx.rect(x + 5 + i * 14, y - 57, 10, 1, gfx.shade(fills[i], 30));
    }
    CH.FOOD.bunBottom(g, x + 32, y - 47);
    CH.FOOD.patty(g, x + 32, y - 50, 1);
  });

  def('bagStation', 62, 54, (g, x, y, t) => {
    gfx.rect(x, y - 44, 62, 44, M.steel.d);
    gfx.rect(x + 1, y - 43, 60, 42, M.steel.base);
    gfx.rect(x, y - 46, 62, 4, '#e8ecf0');
    gfx.rect(x, y - 6, 62, 6, M.dark.base);
    CH.FOOD.bag(g, x + 15, y - 46, true, 0);
    CH.FOOD.bag(g, x + 38, y - 46, true, 0);
    gfx.rect(x + 2, y - 76, 58, 22, '#231f2c');
    gfx.rect(x + 4, y - 74, 54, 18, '#07200f');
    gfx.text('ORDERS', x + 31, y - 72, '#3ecf6a', { align: 'center', font: 'small' });
    for (let i = 0; i < 3; i++) gfx.rect(x + 8 + i * 17, y - 64, 13, 5, i === 0 ? '#2a5a3a' : '#123a22');
  });

  def('sodaMachine', 44, 66, (g, x, y, t) => {
    outlined(x + 22, y, 52, 72, 26, 68, () => {
      gfx.rrect(2, 2, 48, 68, 3, M.red.dd);
      gfx.rrect(3, 0, 46, 68, 3, M.red.base);
      gfx.rrect(5, 2, 42, 18, 2, '#7a1a14');
      gfx.text('DRINKS', 26, 8, '#f5c33b', { align: 'center', font: 'small' });
      for (let i = 0; i < 4; i++) {
        gfx.rrect(5 + i * 11, 24, 9, 11, 1, ['#3a1a08', '#f0902a', '#e8e060', '#5a2a10'][i]);
        gfx.rect(7 + i * 11, 36, 4, 5, '#2c2a36');
      }
      gfx.rect(4, 46, 44, 5, M.steel.base);
      gfx.rect(4, 46, 44, 1, M.steel.l);
      gfx.rect(10, 51, 30, 12, '#2c2a36');
      for (let i = 0; i < 5; i++) gfx.rect(12 + i * 6, 52, 2, 10, '#4a4858');
    });
  });

  def('dtWindow', 66, 76, (g, x, y, t, st) => {
    gfx.rect(x - 2, y - 78, 70, 66, M.steel.d);
    gfx.rect(x, y - 76, 66, 62, M.steel.base);
    gfx.rect(x + 4, y - 72, 58, 54, '#8fa8c4');
    const car = st && st.car;
    if (car) {
      const cx = x + 4 + Math.round(car.x);
      gfx.clip(x + 4, y - 72, 58, 54);
      gfx.rrect(cx, y - 40, 52, 15, 4, gfx.shade(car.color, -30));
      gfx.rrect(cx, y - 41, 52, 14, 4, car.color);
      gfx.rrect(cx + 10, y - 52, 30, 13, 3, gfx.shade(car.color, -18));
      gfx.rrect(cx + 13, y - 50, 12, 9, 2, '#bfe0ff');
      gfx.rrect(cx + 27, y - 50, 10, 9, 2, '#9fc8e8');
      gfx.circle(cx + 11, y - 25, 6, '#1a1620'); gfx.circle(cx + 11, y - 25, 3, '#5a5666');
      gfx.circle(cx + 41, y - 25, 6, '#1a1620'); gfx.circle(cx + 41, y - 25, 3, '#5a5666');
      gfx.px(cx + 50, y - 36, '#ffd84a');
      gfx.unclip();
    }
    gfx.rect(x + 31, y - 72, 3, 54, M.steel.d);
    g.globalAlpha = 0.25; gfx.rect(x + 6, y - 70, 8, 50, '#fff'); g.globalAlpha = 1;
    gfx.rect(x - 2, y - 16, 70, 5, M.red.base);
    gfx.rect(x - 2, y - 16, 70, 2, M.red.l);
    gfx.text('DRIVE-THRU', x + 33, y - 86, '#f2ecd8', { align: 'center', font: 'small', outline: '#2a1f33' });
    gfx.rect(x + 8, y - 11, 46, 11, M.steel.d);
  });

  def('officeDoor', 30, 66, (g, x, y) => {
    gfx.rect(x - 3, y - 68, 36, 68, '#4a4654');
    gfx.rect(x, y - 66, 30, 66, M.wood.d);
    gfx.rect(x + 2, y - 64, 26, 62, M.wood.base);
    gfx.rect(x + 4, y - 60, 22, 26, M.wood.d);
    gfx.rect(x + 4, y - 30, 22, 24, M.wood.d);
    gfx.rrect(x + 4, y - 58, 22, 17, 1, '#f4f1ea');
    gfx.text('OFFICE', x + 15, y - 56, '#3a3040', { align: 'center', font: 'small' });
    gfx.text('BRENDA', x + 15, y - 48, '#c8352b', { align: 'center', font: 'small' });
    gfx.ellipse(x + 25, y - 33, 2, 2, M.gold.base);
  });

  def('closet', 30, 66, (g, x, y, t, st) => {
    gfx.rect(x - 3, y - 68, 36, 68, '#4a4654');
    gfx.rect(x, y - 66, 30, 66, '#6e6e7c');
    gfx.rect(x + 2, y - 64, 26, 62, '#7d7d8c');
    for (let i = 0; i < 7; i++) { gfx.rect(x + 5, y - 60 + i * 5, 20, 2, '#5c5c68'); gfx.rect(x + 5, y - 60 + i * 5, 20, 1, '#8e8e9e'); }
    gfx.rrect(x + 7, y - 34, 16, 9, 1, '#f4f1ea');
    gfx.text('SUPPLY', x + 15, y - 32, '#3a3040', { align: 'center', font: 'small' });
    gfx.ellipse(x + 25, y - 33, 2, 2, '#c8c8d4');
    if (!(st && st.mopTaken)) {
      outlined(x + 36, y, 26, 62, 13, 60, () => {
        gfx.rect(11, 4, 3, 46, '#c8a060');
        gfx.rect(11, 4, 1, 46, '#e8c890');
        gfx.rrect(7, 48, 11, 7, 1, '#ded6c4');
        for (let i = 0; i < 5; i++) gfx.rect(8 + i * 2, 53, 1, 5, '#bdb3a0');
        gfx.rrect(3, 50, 20, 12, 2, M.gold.d);
        gfx.rrect(3, 49, 20, 11, 2, M.gold.base);
        gfx.ellipse(13, 52, 7, 3, '#6aa8ff');
        gfx.ellipse(13, 51, 5, 2, '#9fd0ff');
      });
    }
  });

  def('kiosk', 34, 66, (g, x, y, t) => {
    outlined(x + 17, y, 42, 72, 21, 70, () => {
      gfx.rrect(2, 4, 38, 66, 3, '#232a44');
      gfx.rrect(3, 2, 36, 66, 3, '#2a3350');
      gfx.rrect(6, 6, 30, 38, 2, '#151b2e');
      gfx.rrect(8, 8, 26, 34, 1, '#2f5fc0');
      for (let i = 0; i < 6; i++) gfx.rrect(10 + (i % 3) * 8, 11 + Math.floor(i / 3) * 14, 6, 10, 1, i < 3 ? '#f5c33b' : '#6fa2ff');
      gfx.text('CAREER', 21, 46, '#f5c33b', { align: 'center', font: 'small' });
      gfx.text('TOWER', 21, 53, '#f5c33b', { align: 'center', font: 'small' });
      gfx.rect(8, 61, 26, 3, '#1b2238');
      if (Math.sin(t * 3) > 0) gfx.px(35, 5, '#5af06a');
    });
  });

  def('kidsCorner', 64, 56, (g, x, y, t) => {
    gfx.rrect(x, y - 22, 64, 22, 3, '#2a55a8');
    gfx.rrect(x + 1, y - 23, 62, 21, 3, M.plastic.base);
    for (let i = 0; i < 26; i++) {
      const bx = x + 5 + (i % 13) * 4.6, by = y - 16 + Math.floor(i / 13) * 7;
      gfx.circle(bx, by, 2.8, ['#a02a20', '#c89a20', '#3a7a2a', '#b85a1c'][i % 4]);
      gfx.circle(bx - 0.6, by - 0.8, 1.6, ['#e8584c', '#ffd84a', '#6ad04a', '#f09040'][i % 4]);
    }
    gfx.rrect(x + 10, y - 56, 44, 34, 3, M.gold.d);
    gfx.rrect(x + 11, y - 57, 42, 33, 3, M.gold.base);
    gfx.rrect(x + 15, y - 52, 34, 24, 2, '#f8f4ea');
    CH.drawManEgg(g, x + 32, y - 36, { t });
    gfx.text('PLAYPLACE', x + 32, y - 64, '#c8352b', { align: 'center', font: 'small', outline: '#fbf6ea' });
  });

  def('binR', 20, 30, (g, x, y, t, st) => {
    const f = (st && st.fill) || 0;
    outlined(x + 10, y, 30, 40, 15, 38, () => {
      gfx.rrect(3, 8, 24, 30, 2, '#4a4a58');
      gfx.rrect(4, 7, 22, 30, 2, '#5c5c6a');
      gfx.rect(6, 12, 18, 1, '#6e6e7c');
      gfx.rrect(1, 2, 28, 7, 2, M.red.d);
      gfx.rrect(1, 1, 28, 6, 2, M.red.base);
      gfx.rrect(9, 2, 12, 4, 1, '#2a2430');
      gfx.text('THANKS', 15, 10, '#f5c33b', { align: 'center', font: 'small' });
    });
    if (f > 0.6) {
      gfx.rrect(x + 2, y - 36, 6, 5, 1, '#f4f1ea');
      gfx.rrect(x + 9, y - 39, 7, 8, 1, '#e0c090');
      gfx.px(x + 6, y - 40, '#c8352b');
      if (f > 0.9) for (let i = 0; i < 3; i++) art.effect('stink', x + 5 + i * 5, y - 40, t + i * 0.4, 0.7);
    }
  });

  def('spill', 34, 8, (g, x, y, t, st) => {
    const m = (st && st.mess) || { color: '#6a3a18', color2: '#8a5028' };
    const dk = gfx.shade(m.color, -30);
    gfx.ellipse(x + 17, y, 17, 4.6, dk);
    gfx.ellipse(x + 17, y - 0.6, 16, 4, m.color);
    gfx.ellipse(x + 13, y - 1.4, 8, 2.2, m.color2);
    // splash droplets and a wet highlight
    for (let i = 0; i < 4; i++) gfx.ellipse(x + 3 + i * 9, y + 2, 2 - (i % 2) * 0.6, 1, m.color);
    g.globalAlpha = 0.35; gfx.ellipse(x + 11, y - 2, 4, 1, '#fff'); g.globalAlpha = 1;
    if (st && st.mess && st.mess.eyes) {
      gfx.ellipse(x + 11, y - 2.5, 2, 2, '#fff'); gfx.ellipse(x + 20, y - 2.5, 2, 2, '#fff');
      gfx.px(x + 11, y - 2, '#1a1420'); gfx.px(x + 20, y - 2, '#1a1420');
    }
  });

  def('wetSign', 14, 24, (g, x, y) => {
    outlined(x + 7, y, 22, 30, 11, 28, () => {
      gfx.tri(3, 28, 19, 28, 11, 3, M.gold.d);
      gfx.tri(5, 28, 17, 28, 11, 6, M.gold.base);
      gfx.text('!', 11, 12, '#3a3040', { align: 'center', font: 'small' });
      gfx.rect(4, 26, 14, 2, M.gold.dd);
    });
  });

  // ---- scene -------------------------------------------------------------------------------------
  class RestaurantScene extends CH.WorldScene {
    constructor(opts = {}) {
      super({ width: 1380, floorY: 214, playerX: 30 });
      this.name = 'restaurant';
      this.job = S.job || 'janitor'; this.jobIdx = CH.JOBS.indexOf(this.job);
      this.timeScale = 8 / SHIFT_SECONDS; this.shiftT = 0; this.shiftOver = false;
      this.tasks = []; this.customers = []; this.complaints = 0; this.tasksDone = 0; this.stars = 0; this.taskResults = [];
      this.pendingOrders = 0; this.orderSpawnT = 6; this.served = 0; this.tips = 0; this.stationTask = null;
      this.spawnT = 3; this.dayNum = S.day; this.shiftScore = 0;
      this.build();
      this.player.outfit = this.job === 'janitor' ? 'janitor' : 'uniform'; this.player.stepSfx = 'step'; this.player.speed = CH.has('speed1') ? 92 : 80;
      this.player.hat = 'visor';
      this.orderNum = 41;
    }
    drawRoom(g) {
      const w = this.width, F = this.floorY;
      gfx.rect(0, 0, w, 30, '#e8e4d8'); for (let x = 0; x < w; x += 40) gfx.rect(x, 0, 38, 28, '#f0ece0'); gfx.rect(0, 28, w, 2, '#c8352b');
      // walls: cream tile top, red band, wood-look lower
      gfx.rect(0, 30, w, F - 30, '#f4ead8'); for (let y = 34; y < 100; y += 10) for (let x = -((y / 10) & 1) * 10; x < w; x += 20) gfx.rect(x, y, 19, 9, (x + y) % 7 ? '#f8f0e0' : '#efe4cc');
      gfx.rect(0, 100, w, 6, '#c8352b'); gfx.rect(0, 106, w, 2, '#f5c33b');
      gfx.rect(0, 108, w, F - 108, '#e8dcc0'); for (let y = 112; y < F; y += 8) gfx.hline(0, y, w, '#dccfb0');
      gfx.rect(0, F - 6, w, 6, '#c8352b');
      // kitchen zone: stainless wall
      gfx.rect(780, 30, 430, F - 30, '#c8ccd4'); for (let y = 30; y < F; y += 12) gfx.hline(780, y, 430, '#b8bcc4'); gfx.rect(780, 100, 430, 8, '#8a8a94');
      gfx.rect(770, 30, 10, F - 30, '#5a5a66'); gfx.rect(1210, 30, 8, F - 30, '#5a5a66'); // kitchen dividers
      gfx.text('KITCHEN - EMPLOYEES ONLY', 995, 40, '#5a5a66', { align: 'center', font: 'small' });
      // shelves with supplies along the kitchen wall
      for (const sx of [800, 1000]) { gfx.rect(sx, 60, 120, 3, '#8a8a94'); for (let i = 0; i < 6; i++) { gfx.rect(sx + 4 + i * 19, 46, 14, 14, ['#f5c33b', '#c8352b', '#e8e0d0', '#5fc05a', '#e8e0d0', '#3b6fd6'][i]); gfx.rect(sx + 6 + i * 19, 50, 10, 4, '#fff'); } }
      gfx.rect(1120, 44, 40, 20, '#222'); gfx.text('CAM 2', 1140, 50, '#4f4', { align: 'center', font: 'small' });
      // floor: red/white checker in dining, grey tile in kitchen
      gfx.rect(0, F, w, H - F, '#e8e0d0'); for (let y = F; y < H; y += 12) for (let x = -((y / 12) & 1) * 12; x < 780; x += 24) gfx.rect(x, y, 12, 12, '#c8352b');
      gfx.rect(780, F, w - 780, H - F, '#9a9aa4'); for (let y = F; y < H; y += 12) for (let x = 780 - ((y / 12) & 1) * 12; x < w; x += 24) gfx.rect(x, y, 12, 12, '#a8a8b2');
      // windows to street (dining)
      for (const wx of [60, 270]) { gfx.rect(wx, 40, 90, 56, '#a8c8e8'); gfx.rect(wx, 84, 90, 12, '#e6eef4'); for (let i = 0; i < 4; i++) gfx.tri(wx + 8 + i * 22, 86, wx + 24 + i * 22, 86, wx + 16 + i * 22, 60, '#2f6a24'); gfx.frame(wx, 40, 90, 56, '#c8352b'); gfx.rect(wx + 44, 40, 2, 56, '#c8352b'); gfx.rect(wx, 68, 90, 2, '#c8352b'); }
      // posters
      gfx.rect(180, 44, 60, 46, '#f5c33b'); gfx.rect(184, 48, 52, 38, '#c8352b'); gfx.text('MAN EGG', 210, 52, '#fff', { align: 'center', font: 'small' }); gfx.text('KIDS MEAL', 210, 60, '#fff', { align: 'center', font: 'small' }); gfx.text('TOY INSIDE', 210, 74, '#f5c33b', { align: 'center', font: 'small' }); gfx.ellipse(210, 68, 5, 6, '#e8dcc0'); gfx.rect(207, 67, 6, 1, '#5a3a1a');
      gfx.rect(400, 44, 50, 40, '#fff'); gfx.frame(400, 44, 50, 40, '#c8352b'); gfx.text('EMPLOYEE', 425, 48, '#c8352b', { align: 'center', font: 'small' }); gfx.text('OF THE', 425, 55, '#c8352b', { align: 'center', font: 'small' }); gfx.text('MONTH', 425, 62, '#c8352b', { align: 'center', font: 'small' }); gfx.text('TAMMY (x71)', 425, 74, '#333', { align: 'center', font: 'small' });
      gfx.rect(1230, 50, 60, 30, '#f5c33b'); gfx.text('DAYS SINCE', 1260, 54, '#8f2419', { align: 'center', font: 'small' }); gfx.text('FRYER FIRE', 1260, 61, '#8f2419', { align: 'center', font: 'small' }); gfx.text('0', 1260, 69, '#c8352b', { align: 'center' });
      // wall menu chalkboard above dining + clock
      gfx.rect(480, 44, 70, 46, '#2a3a2a'); gfx.frame(480, 44, 70, 46, '#8a5a2b'); gfx.text('TODAY', 515, 48, '#f5c33b', { align: 'center', font: 'small' }); gfx.text('BIG DON', 515, 58, '#fff', { align: 'center', font: 'small' }); gfx.text('+ FRIES', 515, 66, '#fff', { align: 'center', font: 'small' }); gfx.text('$9.99', 515, 76, '#8bd06a', { align: 'center', font: 'small' });
      CH.PROPS.hClock.draw(g, 560, 60, 0);
    }
    build() {
      const F = this.floorY, s = this;
      const say = (t, o) => () => ui.say('Chubby', t, Object.assign({ face: 'normal' }, o));
      this.door = this.addProp('glassDoor', 6, F, { hint: 'Exit', interact: () => this.interactExit(), range: 26 });
      this.addProp('hDoor', 44, F, { st: { label: 'WC' }, hint: 'Bathroom', interact: (p) => this.interactBathroom(p), id: 'bathroom', range: 26 });
      this.addProp('kidsCorner', 90, F, { hint: 'PlayPlace', interact: say("The PlayPlace. A ball pit with 400 balls and, historically, one raccoon.") });
      this.booths = [];
      for (let i = 0; i < 4; i++) this.booths.push(this.addProp('booth', 160 + i * 100, F, { st: { dirty: false }, hint: 'Table', interact: (p) => this.interactBooth(p), range: 50, id: 'booth' + i, seatX: 208 + i * 100, occupied: null }));
      this.bin = this.addProp('binR', 556, F, { st: { fill: 0.2 }, hint: 'Bin', interact: (p) => this.interactBin(p), id: 'bin', range: 24 });
      this.addProp('plant', 574, F, { st: { variant: 0 } });
      this.addProp('menuBoard', 590, 100);
      this.addProp('orderScreen', 798, 96, { st: { num: 41 }, id: 'orderScreen' });
      this.counter = this.addProp('counter', 590, F, { st: { bags: 0 }, hint: 'Counter', interact: () => this.interactCounter(), range: 60, id: 'counter' });
      this.addProp('sodaMachine', 790, F, { hint: 'Soda machine', interact: say('The fountain. Four flavours. One of them is just "brown".') });
      this.grill = this.addProp('grillStation', 840, F, { hint: 'Grill', interact: () => this.interactStation('grill'), range: 40, id: 'grill' });
      this.fryer = this.addProp('fryerStation', 924, F, { hint: 'Fryer', interact: () => this.interactStation('fries'), range: 34, id: 'fries' });
      this.prep = this.addProp('prepStation', 994, F, { hint: 'Assembly', interact: () => this.interactStation('assembly'), range: 40, id: 'assembly' });
      this.bagSt = this.addProp('bagStation', 1076, F, { hint: 'Bagging', interact: () => this.interactStation('bagging'), range: 34, id: 'bagging', promptY: F - 76 });
      this.dt = this.addProp('dtWindow', 1146, F - 30, { st: { car: null }, hint: 'Drive-thru', interact: () => this.interactStation('drivethru'), range: 34, id: 'drivethru', promptY: F - 110 });
      this.addProp('binR', 1216, F, { st: { fill: 0.1 } });
      this.kiosk = this.addProp('kiosk', 1244, F, { hint: 'Career Tower', interact: () => this.interactKiosk(), range: 26 });
      this.closet = this.addProp('closet', 1286, F, { st: { mopTaken: false }, hint: 'Supply closet', interact: () => this.interactCloset(), range: 26 });
      this.office = this.addProp('officeDoor', 1340, F, { hint: "Brenda's office", interact: () => this.interactOffice(), range: 26 });
      this.addProp('extinguisher', 790, 150);
      // coworkers
      this.tammy = CH.makeTammy(650, F - 4); this.tammy.flip = true; this.tammy.arm = 'hold'; this.tammy.depth = -1; this.addNPC(this.tammy);
      this.kevin = CH.makeKevin(870, F + 1); this.kevin.wanderRange = [850, 905]; this.kevin.arm = 'hold'; this.addNPC(this.kevin);
      this.jorge = CH.makeJorge(950, F + 1); this.jorge.arm = 'hold'; this.jorge.flip = true; this.addNPC(this.jorge);
      this.destiny = CH.makeDestiny(1040, F + 1); this.destiny.wanderRange = [1000, 1120]; this.destiny.arm = 'hold'; this.addNPC(this.destiny);
      this.brenda = CH.makeBrenda(1290, F + 1); this.brenda.hidden = true; this.addNPC(this.brenda);
      if (this.job !== 'janitor') { this.newKevin = new CH.NPC({ name: 'New Kevin', species: 'raccoon', outfit: 'polo', x: 700, y: F + 1, speed: 45, hat: 'visor' }); this.newKevin.arm = 'mop'; this.addNPC(this.newKevin); }
      // idle animation coroutines for coworkers
      this.run(this.coworkerLife());
      this.cars = []; this.carT = 5;
    }
    enter() {
      A.play('restaurant', 1.5); fx.setFade(1); ui.showMoney = true;
      this.run(this.shiftIntro());
    }
    // ---------------------------------------------------------------- shift flow ----
    *shiftIntro() {
      this.locked = true; S.hour = 8;
      yield fx.fadeIn(1);
      const first = !CH.flag('firstShiftDone');
      const info = CH.JOB_INFO[this.job];
      if (first) {
        this.brenda.hidden = false; this.brenda.x = 60; this.brenda.flip = false;
        yield ui.say('Brenda', "You're on time. {p}Good. That's day one done, basically. Here's your visor. Here's your name tag. Here's your mop.", { voice: 'blip2' });
        yield ui.say('Brenda', "Job's simple. See a mess? Fix the mess. Spills, tables, bins, bathrooms, supplies. Tasks pop up with a little icon and a patience bar. {p}When the bar runs out, a customer complains, and I hear about it.", { voice: 'blip2' });
        yield ui.say('Brenda', "Shift ends at four. Do good, you get tips. Do great, you get promoted. There's a whole career tower thing, corporate's obsessed with it, the kiosk's in the back. {p}Questions?", { voice: 'blip2' });
        const c = yield ui.choose('Chubby', '', ["Where's the mop?", "What if I'm bad at it?", 'No questions. Ready.']);
        if (c === 0) yield ui.say('Brenda', "Supply closet. Back right. It's the one with the bucket. {p}It's always the one with the bucket.", { voice: 'blip2' });
        else if (c === 1) yield ui.say('Brenda', "You will be. Everyone is. Then you're less bad. Then one day you're Tammy. {p}Nobody's Tammy.", { voice: 'blip2' });
        else yield ui.say('Brenda', "Ha. Okay. I like that. It's wrong, but I like it.", { voice: 'blip2' });
        this.brenda.walkTo(1290); this.brenda.onArrive = () => { this.brenda.hidden = true; };
        CH.flag('firstShiftDone', true);
        this.closet.st.mopTaken = false; this.needMop = true;
        ui.setObjective('Grab the mop from the supply closet (far right)');
      } else {
        ui.setObjective(this.job === 'janitor' ? 'Clean up messes before customers complain!' : `Work the ${info.title} station. Shift ends at 4 PM.`);
        this.closet.st.mopTaken = true;
        if (this.jobIdx >= 1 && !CH.flag('stationTut_' + this.job)) { CH.flag('stationTut_' + this.job, true); yield ui.say('Brenda', this.jobTutorial(), { voice: 'blip2' }); }
      }
      this.locked = false;
      this.run(this.shiftLoop());
    }
    jobTutorial() {
      return { bagging: "Bagging. Orders pile up on the screen behind you; when there's a batch, hit the bagging station and put the right food in the right bag. Drinks in the carrier. Fold. Chute.", fries: "Fries and drinks. Baskets in the oil, shake 'em, lift before they burn, salt, scoop. Cups under the right nozzle, don't overflow, lid. You'll get greasy. It's a good greasy.", grill: "Grill. Patties on, flip once, off before they're charcoal. Plates on the pass. Kevin will judge you. Ignore Kevin.", assembly: "Assembly. Build 'em exactly like the ticket, bottom bun first. Sauce is a squeeze, not a scream. Wrap, pass. You are an architect now.", cashier: "Register. Tap what they say, total, make change. Exact change. If they say 'the big one' they mean the Big Don. If they say 'the M one', point at the sign.", drivethru: "Drive-thru. The headset is 40 years old. Listen through the static, pick the order, then hand the bag out when the car's lined up. Miss and the fries are on the pavement.", shiftlead: "Shift Leader. You run the floor now. Put people where they're good, put out fires (real ones), and keep the demand bars down. Kevin takes breaks. Plan for Kevin.", manager: "Manager. It's my old office. Emails, schedule, inventory. Deny anything corporate sends that mentions 'pickle budget'. Water the plant. I never did.", regional: "Regional Sauce Consultant. I don't know what this is either. There's a test kitchen on floor seven. Make the sauce taste like the sauce. Apparently that's a job.", vp: "VP of Synergy. Say words in the boardroom until they nod. That's it. That's the whole job. I hate that it pays this much.", cbo: "Chief Burger Officer. They send you burgers, you say yes or no. Follow the guidelines. Reject anything with a shoe in it. There will be a shoe.", ceo: "CEO. It's you. The big D is you now. Sign things. Make a decision that matters. {p}I'm proud of you, kid. Don't tell Tammy." }[this.job] || 'Do the thing.';
    }
    *shiftLoop() {
      while (!this.shiftOver) {
        if (S.hour >= 16 && !CH.ui.busy() && !this.inMinigame) { this.shiftOver = true; break; }
        yield 0.2;
      }
      yield () => !ui.busy() && !this.inMinigame;
      this.locked = true;
      yield* this.endShift();
    }
    *endShift() {
      A.sfx('bell');
      ui.setObjective('');
      this.brenda.hidden = false; this.brenda.x = this.player.x + 60; this.brenda.flip = true;
      yield 0.5;
      const res = this.computeResults();
      yield ui.say('Brenda', res.quality >= 0.75 ? "That's four. {p}Not bad, Chubby. Not bad at all." : res.quality >= 0.45 ? "That's four. {p}You survived. The building's still here." : "That's four. {p}We need to talk about... all of it. Tomorrow.", { voice: 'blip2' });
      // pay
      CH.addMoney(res.pay);
      S.shiftsWorked++; S.shiftScores.push(res.quality); if (S.shiftScores.length > 20) S.shiftScores.shift();
      S.stats.hours += 8; S.energy = Math.max(0, S.energy - 45); S.hunger = Math.min(100, S.hunger + 40);
      S.jobShifts = S.jobShifts || {}; S.jobShifts[this.job] = (S.jobShifts[this.job] || 0) + 1;
      S.lastShift = res;
      CH.autosave('Shift saved');
      const done = new CH.Signal();
      CH.game.push(new ShiftSummaryScene(res, () => done.resolve()));
      yield done;
      // promotion check
      const promo = CH.checkPromotion();
      if (promo === 'promote') { yield* this.promotionScene(); }
      else if (promo === 'needTower') { yield ui.say('Brenda', `Corporate says you're ready for ${CH.JOB_INFO[CH.JOBS[this.jobIdx + 1]].title}, but you need to unlock floor ${CH.JOB_INFO[CH.JOBS[this.jobIdx + 1]].floor} in the Career Tower first. {p}Kiosk's in the back. Buy five upgrades on a floor to unlock the elevator.`, { voice: 'blip2' }); }
      this.brenda.walkTo(1290); this.brenda.onArrive = () => { this.brenda.hidden = true; };
      ui.setObjective('Clock out: leave through the front door (or use the Career Tower kiosk)');
      this.afterShift = true;
      this.locked = false;
    }
    computeResults() {
      const info = CH.JOB_INFO[this.job];
      const n = this.taskResults.length;
      const avg = n ? this.taskResults.reduce((a, b) => a + b.score, 0) / n : (this.job === 'janitor' ? 0.5 : 0.4);
      const quality = CH.clamp(avg - this.complaints * 0.06, 0, 1);
      const base = info.wage * 8;
      const tipMult = 1 + (CH.has('tips1') ? 0.15 : 0) + (CH.has('tips2') ? 0.2 : 0) + (CH.has('tips3') ? 0.3 : 0) + (CH.has('wetsign') && this.job === 'janitor' ? 0.1 : 0);
      const tips = Math.round(base * quality * 0.6 * tipMult * 100) / 100;
      const bonus = this.stars >= n * 2.5 && n > 2 ? Math.round(base * 0.2) : 0;
      return { job: info.title, base, tips, bonus, pay: Math.round((base + tips + bonus) * 100) / 100, tasks: n, stars: this.stars, complaints: this.complaints, quality, served: this.served, day: this.dayNum };
    }
    *promotionScene() {
      const next = CH.JOBS[this.jobIdx + 1]; const info = CH.JOB_INFO[next];
      A.play('victory', 0.5);
      yield ui.say('Brenda', "Also. {p}Corporate called. {pp}They want you as " + info.title + ". {p}Effective tomorrow. " + CH.fmtMoney(info.wage) + " an hour.", { voice: 'blip2' });
      this.player.setFace('shock', 3); this.player.doEmote('!', 2); CH.doShake(2, 0.3);
      yield ui.say('Chubby', next === 'ceo' ? "...I'm the CEO?" : "I got promoted?", { face: 'shock' });
      yield ui.say('Brenda', next === 'ceo' ? "You're the CEO. The big D is you. {p}...Can I have Fridays off?" : "You got promoted. Don't make it weird. {p}Okay, make it a little weird.", { voice: 'blip2' });
      S.job = next; S.jobLevel = this.jobIdx + 1; S.reputation += 2;
      CH.addMoney(Math.round(info.wage * 4)); ui.toast('Promotion bonus: ' + CH.fmtMoney(Math.round(info.wage * 4)), '#f5c33b', 3);
      CH.sendText('Mom', CH.pick(["PROMOTED?? My baby!! I told the nurse. I told THREE nurses.", "The nurse says I'm not allowed to be this excited. I don't care. PROMOTED!!", "I'm so proud of you, Chubby. So proud. ♥ Eat something."]));
      CH.autosave('Shift saved');
      yield fx.showCard('PROMOTED!', info.title + '  -  ' + CH.fmtMoney(info.wage) + '/hr', 3.5, '#f5c33b');
      A.play('restaurant', 1);
    }
    // ---------------------------------------------------------------- simulation ----
    update(dt) {
      if (this.inMinigame) return;
      super.update(dt);
      if (this.shiftOver && !this.afterShift) return;
      if (!this.shiftOver) this.simulate(dt);
      // cars at the drive-thru
      this.carT -= dt; if (this.carT <= 0) { this.carT = CH.rand(8, 16); this.dt.st.car = { x: -60, color: CH.pick(['#3b6fd6', '#c8352b', '#4f9d3a', '#f5c33b', '#8a8a94']) }; }
      if (this.dt.st.car) { this.dt.st.car.x += dt * 12; if (this.dt.st.car.x > 60) this.dt.st.car = null; }
      // task patience
      for (const t of this.tasks) { if (t.strikes >= 2) continue; t.patience -= dt; if (t.patience <= 0) { t.strikes = (t.strikes || 0) + 1; this.complain(t); t.patience = t.maxPatience * 1.25; } }
      this.prop('orderScreen').st.num = this.orderNum;
    }
    isRush() { return (S.hour > 11.5 && S.hour < 13.5) || (S.hour > 15 && S.hour < 16); }
    simulate(dt) {
      // customers
      this.spawnT -= dt;
      const rush = this.isRush();
      if (this.spawnT <= 0 && this.customers.length < (rush ? 9 : 5)) { this.spawnT = (rush ? 3.5 : 7) * (0.8 + Math.random() * 0.5); this.spawnCustomer(); }
      for (let i = this.customers.length - 1; i >= 0; i--) { const c = this.customers[i]; this.updateCustomer(c, dt); if (c.state === 'gone') { this.customers.splice(i, 1); this.npcs.splice(this.npcs.indexOf(c.npc), 1); } }
      // orders for station jobs
      if (this.jobIdx >= 1 && this.jobIdx <= 6) {
        this.orderSpawnT -= dt * (rush ? 1.8 : 1);
        if (this.orderSpawnT <= 0) { this.orderSpawnT = 9; this.pendingOrders++; if (!this.stationTask) this.makeStationTask(); else this.stationTask.count = this.pendingOrders; }
      } else if (this.jobIdx >= 7) { this.orderSpawnT -= dt; if (this.orderSpawnT <= 0) { this.orderSpawnT = 40; if (!this.stationTask) this.makeStationTask(); } }
      // bin fill & bathroom dirt accumulate
      this.bin.st.fill = Math.min(1, this.bin.st.fill + dt * 0.006 * (rush ? 2 : 1));
      if (this.bin.st.fill >= 1 && !this.tasks.some((t) => t.type === 'bin')) this.addTask({ type: 'bin', x: this.bin.x + 8, y: this.bin.y - 30, patience: 45, label: 'Bin overflowing!' });
      this.bathDirt = (this.bathDirt || 0) + dt * 0.004 * (rush ? 2 : 1);
      if (this.bathDirt >= 1 && !this.tasks.some((t) => t.type === 'bathroom')) { this.addTask({ type: 'bathroom', x: 61, y: this.floorY - 70, patience: 60, label: 'Bathroom needs attention' }); this.bathDirt = 0; }
      this.supplyT = (this.supplyT || 0) + dt * 0.003 * (rush ? 2 : 1);
      if (this.supplyT >= 1 && !this.tasks.some((t) => t.type === 'restock')) { this.addTask({ type: 'restock', x: 610, y: this.floorY - 66, patience: 55, label: 'Napkins out!' }); this.supplyT = 0; }
      // auto janitor (New Kevin) handles messes when player has another job
      if (this.newKevin) { const mess = this.tasks.find((t) => ['spill', 'table', 'bin', 'bathroom', 'restock'].includes(t.type)); if (mess && !this.newKevin.target && !this.newKevin.busy) { this.newKevin.walkTo(mess.x, () => { this.newKevin.busy = true; this.run((function* (self) { yield 4 + Math.random() * 3; self.removeTask(mess, true); self.newKevin.busy = false; })(this)); }); } }
    }
    spawnCustomer() {
      const npc = CH.makeCustomer(-10, this.floorY + CH.rand(0, 4)); npc.depth = 0; this.addNPC(npc);
      const c = { npc, state: 'queue', t: 0, patience: (CH.has('patience2') ? 60 : CH.has('patience1') ? 48 : 38), order: CH.pick(CH.MENU || [{ name: 'Big Don' }]), booth: null };
      this.customers.push(c);
      npc.walkTo(this.queueX(c));
      return c;
    }
    queueX(c) { const idx = this.customers.filter((k) => k.state === 'queue').indexOf(c); return 600 - Math.max(0, idx) * 22; }
    updateCustomer(c, dt) {
      const n = c.npc; c.t += dt;
      if (c.state === 'queue') {
        const qx = this.queueX(c); if (!n.target && Math.abs(n.x - qx) > 3) n.walkTo(qx);
        c.patience -= dt;
        if (c.patience < 12 && Math.random() < dt * 0.3) n.doEmote(CH.pick(['...', '?', '!']), 1);
        if (c.patience <= 0) { this.complain({ label: 'Customer left the line' }); n.face = 'angry'; c.state = 'leave'; n.walkTo(-20, () => { c.state = 'gone'; }); return; }
        // front of the queue & orders
        if (this.customers.filter((k) => k.state === 'queue').indexOf(c) === 0 && Math.abs(n.x - 600) < 4 && c.t > 2) {
          if (c.orderT === undefined) { c.orderT = 3.5; n.say(CH.pick(['One ' + c.order.name + ' please', 'Uh... ' + c.order.name + '?', c.order.name + '. And a job. Kidding.', 'Is this the D one?']), 3); this.tammy.talk = true; }
          else { c.orderT -= dt; if (c.orderT <= 0) { this.tammy.talk = false; c.state = 'wait'; c.waitT = (this.isRush() ? 14 : 8) * (CH.has('predict') ? 0.8 : 1); n.walkTo(750 + CH.rand(-14, 14)); A.sfx('cash'); this.orderNum++; } }
        }
      } else if (c.state === 'wait') {
        c.waitT -= dt; c.patience -= dt * 0.5;
        if (c.patience <= 0) { this.complain({ label: 'Order took too long' }); n.face = 'angry'; c.state = 'leave'; n.walkTo(-20, () => { c.state = 'gone'; }); return; }
        if (c.waitT <= 0) {
          this.counter.st.bags = Math.max(0, this.counter.st.bags - 1); n.arm = 'tray'; A.sfx('ding'); this.served++; S.stats.customersServed++;
          const booth = this.booths.find((b) => !b.occupied); if (booth && Math.random() < 0.8) { booth.occupied = c; c.booth = booth; c.state = 'toTable'; n.walkTo(booth.seatX, () => { c.state = 'eat'; c.eatT = 8 + Math.random() * 8; n.pose = 'sit'; n.y = this.floorY - 6; n.flip = false; }); }
          else { c.state = 'leave'; n.walkTo(-20, () => { c.state = 'gone'; }); }
        }
      } else if (c.state === 'eat') {
        c.eatT -= dt;
        if (Math.random() < dt * 0.6) this.particles.burst(n.x + 6, n.y - 18, 2, { color: ['#f0d080', '#e8b060'], speed: 15, grav: 150, life: 0.5 });
        if (Math.random() < dt * 0.05) n.say(CH.pick(['*munch*', 'mmm', '*slurp*', 'needs pickles', 'this is the D one']), 1.5);
        if (c.eatT <= 0) {
          n.pose = 'stand'; n.y = this.floorY + 1; n.arm = 'idle';
          const b = c.booth; b.occupied = null;
          if (Math.random() < 0.7 && !b.st.dirty) { b.st.dirty = true; this.addTask({ type: 'table', x: b.x + 45, y: b.y - 40, patience: 70, label: 'Dirty table', prop: b }); }
          if (Math.random() < 0.35) this.spawnSpill(n.x + CH.rand(-30, 30));
          this.bin.st.fill = Math.min(1, this.bin.st.fill + 0.15);
          if (Math.random() < 0.25) { c.state = 'bathroom'; n.walkTo(61, () => { n.hidden = true; this.bathDirt += 0.4; this.run((function* (self) { yield 3; n.hidden = false; c.state = 'leave'; n.walkTo(-20, () => { c.state = 'gone'; }); })(this)); }); }
          else { c.state = 'leave'; n.walkTo(-20, () => { c.state = 'gone'; }); }
        }
      }
    }
    spawnSpill(x) {
      x = CH.clamp(x, 110, 570);
      const kinds = Object.keys(CH.MESSES); const kind = S.day < 3 ? CH.pick(['soda', 'ketchup', 'milkshake']) : CH.pick(kinds);
      const p = this.addProp('spill', x - 15, this.floorY + 3, { st: { mess: CH.MESSES[kind] }, layer: 'back', anim: true, id: 'spill' + Math.random(), hint: CH.MESSES[kind].name, range: 24, priority: 2, interact: (pp) => this.interactSpill(pp) });
      this.addTask({ type: 'spill', x, y: this.floorY - 14, patience: 50, label: CH.MESSES[kind].name, prop: p, kind });
      A.sfx('splash');
    }
    addTask(t) { t.maxPatience = t.patience; this.tasks.push(t); if (this.job === 'janitor' || t.type === 'station') A.sfx('notify'); return t; }
    removeTask(t, silent) { const i = this.tasks.indexOf(t); if (i >= 0) this.tasks.splice(i, 1); if (t.prop && t.type === 'spill') { this.props.splice(this.props.indexOf(t.prop), 1); if (!silent) { const ws = this.addProp('wetSign', t.x - 6, this.floorY, { anim: false, layer: 'front' }); this.bgDirty = true; this.run((function* (self) { yield 20; self.props.splice(self.props.indexOf(ws), 1); })(this)); } } if (t.prop && t.type === 'table') { t.prop.st.dirty = false; this.bgDirty = true; } if (t.type === 'bin') this.bin.st.fill = 0; }
    complain(t) { this.complaints++; S.reputation = Math.max(-10, S.reputation - 1); A.sfx('angry'); ui.toast('Complaint: ' + (t.label || 'something'), '#ff8080', 3); CH.doShake(2, 0.2); this.particles.text(this.player.x, this.player.y - 40, 'COMPLAINT', '#ff6060'); }
    makeStationTask() {
      const st = this.job === 'shiftlead' ? { x: 690, y: this.floorY - 50 } : this.job === 'manager' ? { x: this.office.x + 13, y: this.floorY - 66 } : this.jobIdx >= 9 ? { x: this.kiosk.x + 15, y: this.floorY - 66 } : this.prop(this.job === 'cashier' ? 'counter' : this.job) || this.counter;
      const x = st.x + (st.w ? st.w / 2 : 0), y = st.y !== undefined && st.h ? st.y - st.h - 6 : (st.y || this.floorY - 60);
      this.stationTask = this.addTask({ type: 'station', x, y: this.job === 'cashier' ? this.floorY - 66 : y, patience: this.jobIdx >= 7 ? 120 : 40, label: this.jobIdx >= 7 ? CH.JOB_INFO[this.job].title + ' duty' : 'Orders waiting', count: this.pendingOrders });
      this.stationTask.onExpire = true;
    }
    // ---------------------------------------------------------------- interactions ----
    *interactStation(kind) {
      if (this.afterShift) { yield ui.say('Chubby', "Shift's over. The " + kind + " can wait until tomorrow."); return; }
      const mine = (kind === this.job) || (kind === 'fries' && this.job === 'fries');
      if (!mine) { const who = { grill: 'Kevin', fries: 'Jorge', assembly: 'Kevin', bagging: 'Destiny', drivethru: 'Destiny', cashier: 'Tammy' }[kind]; yield ui.say(who || 'Kevin', CH.pick(["That's my station, bud.", "You're not trained on this. Yet.", 'Touch my ' + kind + ' and I touch your mop.', "Corporate says no. I say also no."]), { portrait: who }); return; }
      if (!this.stationTask) { yield ui.say('Chubby', 'No orders right now. {p}Breathe. It won\'t last.'); return; }
      yield* this.runTask(this.stationTask);
    }
    *interactCounter() { if (this.job === 'cashier') { yield* this.interactStation('cashier'); return; } if (this.job === 'shiftlead') { if (this.stationTask) { yield* this.runTask(this.stationTask); return; } } if (this.tasks.some((t) => t.type === 'restock')) { yield* this.runTask(this.tasks.find((t) => t.type === 'restock')); return; } yield ui.say('Tammy', CH.pick(["Hey new guy. Don't lean on the counter. Corporate has a camera.", "Six years, Chubby. Six. Nobody's been here longer except the fryer.", "You're doing fine. Better than Kevin. Kevin set the mop on fire once. Don't ask."]), { portrait: 'Tammy' }); }
    *interactSpill(p) { const t = this.tasks.find((k) => k.type === 'spill' && k.prop === p); if (t) { yield* this.runTask(t); return; } const i = this.props.indexOf(p); if (i >= 0) this.props.splice(i, 1); }
    *interactBooth(p) { const t = this.tasks.find((k) => k.type === 'table' && k.prop === p); if (t) { yield* this.runTask(t); return; } yield ui.say('Chubby', p.occupied ? "Someone's eating. I'll wait. I'm very good at waiting." : 'Clean table. For now.'); }
    *interactBin(p) { const t = this.tasks.find((k) => k.type === 'bin'); if (t) { yield* this.runTask(t); return; } yield ui.say('Chubby', `The bin is ${Math.round(p.st.fill * 100)}% full. I know this now. I know bin percentages.`); }
    *interactBathroom(p) { const t = this.tasks.find((k) => k.type === 'bathroom'); if (t) { yield* this.runTask(t); return; } A.sfx('door'); yield ui.say('Chubby', CH.pick(["Clean enough. {p}'Enough' is a janitor's favourite word.", "Somebody wrote 'KEVIN WAS HERE' on the stall. Kevin has been gone for weeks. Kevin haunts us.", 'I check my visor in the mirror. It does not help.'])); }
    *interactCloset() {
      if (this.needMop) { this.needMop = false; this.closet.st.mopTaken = true; this.bgDirty = true; A.sfx('pop'); this.player.arm = 'mop'; yield ui.say('Chubby', "The mop. {p}My mop. {pp}Hello, mop. We're going to be spending a lot of time together.", { face: 'focused' }); ui.setObjective('Clean up messes before customers complain!'); this.player.arm = 'idle'; this.run(this.firstMess()); return; }
      yield ui.say('Chubby', 'Mops, buckets, 400 rolls of paper towel, and a mysterious box labelled "KEVIN - DO NOT OPEN".');
    }
    *firstMess() { yield 2; this.spawnSpill(360); ui.setHint('A spill! Walk to it and press E', 4); }
    *interactOffice() {
      A.sfx('door');
      if (this.afterShift) { yield ui.say('Brenda', "Go home, Chubby. Or hit the kiosk. {p}Or stand there. It's a free country. Mostly.", { voice: 'blip2' }); return; }
      const promo = CH.checkPromotion(true);
      const next = CH.JOBS[this.jobIdx + 1];
      if (this.job === 'manager' || this.jobIdx >= 8) { if (this.stationTask) { yield* this.runTask(this.stationTask); return; } yield ui.say('Chubby', "My office. {p}I have an office. There's a plant. It's dying. That's how I know it's mine."); return; }
      if (!next) { yield ui.say('Brenda', "You're the CEO. Why are you knocking on MY door?", { voice: 'blip2' }); return; }
      const shifts = (S.jobShifts && S.jobShifts[this.job]) || 0;
      yield ui.say('Brenda', promo === 'promote' ? "Finish today's shift and we'll talk about " + CH.JOB_INFO[next].title + ". {p}I already talked to corporate. Don't tell anyone I said that." : promo === 'needTower' ? `Corporate wants you on floor ${CH.JOB_INFO[next].floor} of the Career Tower before they'll sign off on ${CH.JOB_INFO[next].title}. Five upgrades unlocks an elevator. It's their system. I just work here. So do you.` : `Next step is ${CH.JOB_INFO[next].title}. Two solid shifts at ${CH.JOB_INFO[this.job].title} (you've done ${shifts}) plus the right Career Tower floor. {p}Now get back out there.`, { voice: 'blip2' });
    }
    *interactKiosk() {
      A.sfx('tap');
      if (this.stationTask && this.jobIdx >= 9 && !this.afterShift) { const c = yield ui.choose('Chubby', CH.JOB_INFO[this.job].title + ' duty is waiting upstairs.', ['Do the job (elevator up)', 'Open the Career Tower']); if (c === 0) { yield* this.runTask(this.stationTask); return; } if (c < 0) return; }
      if (!CH.flag('kioskTut')) { CH.flag('kioskTut', true); yield ui.say('Chubby', "The Career Tower kiosk. {p}A giant office building on a screen. Every floor is a career level. Every room is an upgrade. {p}Five upgrades per floor and the elevator goes up. {pp}Corporate made a video game out of my job. {p}...Okay. I respect that."); }
      const done = new CH.Signal(); CH.game.push(new CH.TowerScene(() => done.resolve())); yield done;
    }
    *interactExit() {
      if (!this.afterShift) { const c = yield ui.choose('Chubby', `It's ${CH.timeStr()}. Shift ends at 4 PM.`, ['Keep working', 'Leave early (Brenda will notice)']); if (c === 1) { this.complaints += 2; S.reputation -= 2; yield ui.say('Brenda', "Leaving EARLY? {p}Fine. Docked. Noted. Remembered.", { voice: 'blip2' }); S.hour = 16; this.shiftOver = true; } return; }
      this.locked = true; A.sfx('door'); yield fx.fadeOut(1);
      if (CH.afterShift) CH.afterShift(S.lastShift); else CH.game.set(new CH.TitleScene());
    }
    *runTask(t) {
      this.locked = true; this.inMinigame = true;
      const diff = 1 + Math.min(3, (S.day - 3) * 0.15 + (this.isRush() ? 0.6 : 0) + (t.count ? Math.min(1.2, t.count * 0.25) : 0)) + this.jobIdx * 0.05;
      let scene;
      if (t.type === 'spill') scene = new CH.MopScene({ kind: t.kind, difficulty: diff });
      else if (t.type === 'table') scene = new CH.TableScene({ difficulty: diff });
      else if (t.type === 'bin') scene = new CH.BinScene({ difficulty: diff });
      else if (t.type === 'bathroom') scene = new CH.BathroomScene({ difficulty: diff });
      else if (t.type === 'restock') scene = new CH.RestockScene({ difficulty: diff });
      else if (t.type === 'station') { const games = CH.JOB_GAMES[this.job]({ difficulty: diff }); scene = games[0]; }
      if (!scene) { this.locked = false; this.inMinigame = false; return; }
      A.stop(0.3);
      const r = yield CH.runMinigame(scene);
      A.play(this.isRush() ? 'rush' : 'restaurant', 0.5);
      this.inMinigame = false;
      this.taskResults.push(r); this.stars += r.stars; this.tasksDone++;
      const tipNow = Math.round(r.stars * (2 + this.jobIdx) * 100) / 100; if (tipNow) { CH.addMoney(tipNow); this.particles.text(this.player.x, this.player.y - 44, '+' + CH.fmtMoney(tipNow) + ' tip', '#8bd06a'); }
      if (t.type === 'station') { this.pendingOrders = Math.max(0, this.pendingOrders - Math.max(1, t.count || 1)); this.stationTask = null; this.counter.st.bags += 2; if (this.pendingOrders > 0) this.makeStationTask(); }
      this.removeTask(t);
      if (r.stars === 0) { this.complaints++; }
      this.locked = false;
    }
    *coworkerLife() {
      while (true) {
        yield CH.rand(4, 9);
        if (this.inMinigame) continue;
        const who = CH.pick([this.kevin, this.jorge, this.destiny, this.tammy]);
        who.say(CH.pick(['*sizzle*', 'ORDER UP', 'where is the— oh', 'Kevin no', 'fryer 2 is fine. FINE.', 'big D not M', '*whistles*', 'six years...', 'ugh, lunch rush', 'did someone say pickles', '*headset static*', 'ONE BIG DON']), 2.5);
        if (who === this.kevin) { this.kevin.squash.x = 1.06; }
        if (Math.random() < 0.3) this.particles.steam(this.grill.x + 35, this.grill.y - 50, 4);
        if (this.isRush() && A.current && A.current.name !== 'rush') A.play('rush', 0.5); else if (!this.isRush() && A.current && A.current.name === 'rush') A.play('restaurant', 0.5);
      }
    }
    // ---------------------------------------------------------------- draw ----
    draw(g) {
      super.draw(g);
      const cx = Math.round(this.cam.x);
      // task icons
      for (const t of this.tasks) {
        const x = Math.round(t.x - cx), y = Math.round(t.y) - 8 + Math.round(Math.sin(this.t * 5 + t.x) * 2);
        const p = CH.clamp(t.patience / t.maxPatience, 0, 1);
        const col = t.strikes >= 2 ? '#6a6a74' : t.type === 'station' ? '#3b6fd6' : p < 0.3 ? '#c8352b' : '#f5c33b';
        gfx.rrect(x - 8, y - 14, 16, 14, 3, col); gfx.tri(x - 3, y, x + 3, y, x, y + 4, col);
        const icon = { spill: '~', table: '■', bin: '▼', bathroom: 'WC', restock: '□', station: t.count ? String(t.count) : '!' }[t.type] || '!';
        gfx.text(icon, x, y - 11, '#fff', { align: 'center', font: 'small' });
        if (!(t.strikes >= 2)) { gfx.rect(x - 8, y - 17, 16, 2, '#222'); gfx.rect(x - 8, y - 17, Math.round(16 * p), 2, p < 0.3 ? '#ff4040' : '#8bd06a'); }
        if (Math.abs(this.player.x - t.x) < 70) gfx.text(t.label, x, y - 26, '#fff', { align: 'center', font: 'small', outline: '#000' });
      }
      // shift HUD
      const p = CH.clamp((S.hour - 8) / 8, 0, 1);
      gfx.rect(4, 18, 120, 8, 'rgba(0,0,0,0.6)'); gfx.rect(5, 19, Math.round(118 * p), 6, this.isRush() ? '#c8352b' : '#f5c33b');
      gfx.text('SHIFT ' + (this.isRush() ? '- RUSH HOUR!' : ''), 6, 27, this.isRush() && Math.sin(this.t * 8) > 0 ? '#ff8080' : '#fff', { font: 'small', outline: '#000' });
      gfx.text(`${CH.JOB_INFO[this.job].title}  -  Day ${S.day}`, 6, 36, '#f5c33b', { font: 'small', outline: '#000' });
      gfx.text(`Tasks ${this.tasksDone}  ★${this.stars}  Complaints ${this.complaints}`, 6, 44, '#fff', { font: 'small', outline: '#000' });
      if (this.job !== 'janitor' && this.jobIdx <= 6) gfx.text(`Orders waiting: ${this.pendingOrders}`, 6, 52, this.pendingOrders > 3 ? '#ff8080' : '#fff', { font: 'small', outline: '#000' });
      // rush tint
      if (this.isRush()) { g.globalAlpha = 0.06 + Math.sin(this.t * 4) * 0.02; gfx.rect(0, 0, W, H, '#ff4020'); g.globalAlpha = 1; }
    }
  }
  CH.RestaurantScene = RestaurantScene;

  // ---- promotion rule ---------------------------------------------------------------------------
  CH.checkPromotion = (peek) => {
    const idx = CH.JOBS.indexOf(S.job); const next = CH.JOBS[idx + 1]; if (!next) return null;
    const shifts = (S.jobShifts && S.jobShifts[S.job]) || 0;
    const recent = S.shiftScores.slice(-2); const avg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
    const ready = shifts >= 2 && (avg >= 0.5 || shifts >= 4);
    if (!ready) return 'notyet';
    if (S.towerFloor < CH.JOB_INFO[next].floor) return 'needTower';
    return 'promote';
  };

  // ---- shift summary overlay --------------------------------------------------------------------
  class ShiftSummaryScene extends CH.Scene {
    constructor(res, onDone) { super(); this.overlay = true; this.res = res; this.onDone = onDone; this.t2 = 0; this.rows = []; }
    enter() { A.sfx('cash'); }
    update(dt) { this.t2 += dt; if (this.t2 > 1.5 && (inp.hit('interact') || inp.hit('confirm') || inp.hit('jump') || inp.mpressed)) { inp.eat(); CH.game.pop(); this.onDone(); } }
    draw(g) {
      g.globalAlpha = 0.7; gfx.rect(0, 0, W, H, '#000'); g.globalAlpha = 1;
      const bw = 260, bh = 170, bx = W / 2 - bw / 2, by = H / 2 - bh / 2;
      ui.drawBox(bx, by, bw, bh, { border: '#f5c33b' });
      gfx.text('SHIFT COMPLETE  -  DAY ' + this.res.day, W / 2, by + 8, '#f5c33b', { align: 'center' });
      gfx.text(this.res.job, W / 2, by + 20, '#fff', { align: 'center', font: 'small' });
      const rows = [['Tasks completed', String(this.res.tasks)], ['Stars earned', '★ ' + this.res.stars], ['Customers served', String(this.res.served)], ['Complaints', String(this.res.complaints)], ['Base pay (8h)', CH.fmtMoney(this.res.base)], ['Tips', CH.fmtMoney(this.res.tips)], ['Bonus', CH.fmtMoney(this.res.bonus)]];
      rows.forEach((r, i) => { if (this.t2 > 0.2 + i * 0.15) { gfx.text(r[0], bx + 14, by + 34 + i * 11, '#ccc', { font: 'small' }); gfx.text(r[1], bx + bw - 14, by + 34 + i * 11, r[0] === 'Complaints' && this.res.complaints ? '#ff8080' : '#fff', { align: 'right', font: 'small' }); } });
      if (this.t2 > 1.3) { gfx.hline(bx + 14, by + 114, bw - 28, '#f5c33b'); gfx.text('TOTAL PAY', bx + 14, by + 120, '#f5c33b'); g.save(); g.translate(bx + bw - 14, by + 118); g.scale(1.4, 1.4); gfx.text(CH.fmtMoney(this.res.pay), 0, 0, '#8bd06a', { align: 'right' }); g.restore(); }
      if (this.t2 > 1.5) { const q = this.res.quality; gfx.text(q >= 0.75 ? 'Brenda: "Solid."' : q >= 0.45 ? 'Brenda: "...Okay."' : 'Brenda: "We\'ll talk."', W / 2, by + 140, '#ccc', { align: 'center', font: 'small' }); if (Math.sin(this.t2 * 5) > 0) gfx.text('E - continue', W / 2, by + bh - 12, '#fff', { align: 'center', font: 'small' }); }
    }
  }
  CH.ShiftSummaryScene = ShiftSummaryScene;

  CH.startShift = () => { CH.game.set(new RestaurantScene()); };
  CH.SCENES.restaurant = () => { S.job = S.job || 'janitor'; S.chapter = 'career'; CH.flag('hasPhone', true); return new RestaurantScene(); };
  CH.SCENES.restaurantGrill = () => { S.job = 'grill'; S.chapter = 'career'; CH.flag('hasPhone', true); CH.flag('firstShiftDone', true); return new RestaurantScene(); };
  for (const j of ['bagging', 'fries', 'assembly', 'cashier', 'drivethru', 'shiftlead', 'manager', 'regional', 'vp', 'cbo', 'ceo']) CH.SCENES['restaurant_' + j] = () => { S.job = j; S.chapter = 'career'; S.towerFloor = Math.max(S.towerFloor || 1, CH.JOB_INFO[j].floor); CH.flag('hasPhone', true); CH.flag('firstShiftDone', true); return new RestaurantScene(); };
})(window.CH);
