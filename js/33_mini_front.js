// ============================================================================
// FRONT COUNTER MINIGAMES: cashier (POS + change) and drive-thru (headset)
//
// The room behind the counter is flat background; the register, the till money,
// the car and the bag in your hand are ink-outlined objects.
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, A = CH.audio, inp = CH.input, S = CH.state, F = CH.FOOD;
  const MG = CH.MG, art = CH.art;
  const W = CH.W, H = CH.H;
  const has = (k) => CH.has(k);

  const MENU = [
    { id: 'bigdon', name: 'Big Don', price: 6.99, say: ['a Big Don', 'the big one', 'one Big Don'] },
    { id: 'dbl', name: 'Double Don', price: 8.49, say: ['a Double Don', 'the double', 'two-patty thing'] },
    { id: 'chz', name: 'Cheese Don', price: 5.49, say: ['a Cheese Don', 'cheeseburger', 'the cheesy one'] },
    { id: 'chk', name: 'Chicken Don', price: 6.49, say: ['a Chicken Don', 'the chicken one', 'chicken sandwich'] },
    { id: 'nug6', name: 'Nuggets 6', price: 4.99, say: ['six nuggets', 'a 6-piece', 'nuggets, the small box'] },
    { id: 'nug10', name: 'Nuggets 10', price: 7.49, say: ['ten nuggets', 'a 10-piece', 'the big nuggets'] },
    { id: 'friesS', name: 'Fries S', price: 2.29, say: ['small fries', 'a small fry', 'fries, small'] },
    { id: 'friesM', name: 'Fries M', price: 2.99, say: ['medium fries', 'fries, medium', 'a medium fry'] },
    { id: 'friesL', name: 'Fries L', price: 3.29, say: ['large fries', 'a large fry', 'big fries'] },
    { id: 'drinkS', name: 'Drink S', price: 1.99, say: ['a small drink', 'small pop', 'a small cola'] },
    { id: 'drinkM', name: 'Drink M', price: 2.49, say: ['a medium drink', 'medium pop', 'a medium cola'] },
    { id: 'drinkL', name: 'Drink L', price: 2.99, say: ['a large drink', 'large pop', 'a large cola'] },
    { id: 'shake', name: 'Moose Shake', price: 4.99, say: ['a Moose Shake', 'a shake', 'the milkshake'] },
    { id: 'pie', name: 'Apple Pie', price: 1.99, say: ['an apple pie', 'a pie', 'the pie thing'] },
    { id: 'kids', name: 'Kids Meal', price: 5.99, say: ['a Kids Meal', 'the kids thing with the egg toy', 'a happy meal, sorry, Kids Meal'] },
    { id: 'coffee', name: 'Coffee', price: 1.79, say: ['a coffee', 'black coffee', 'coffee. please.'] },
  ];
  CH.MENU = MENU;
  const DENOMS = [[20, 'bill', '#4f9d3a'], [10, 'bill', '#7b4fb0'], [5, 'bill', '#3b6fd6'], [2, 'coin', '#c8a060'], [1, 'coin', '#f5c33b'], [0.25, 'coin', '#c8c8d0'], [0.1, 'coin', '#c8c8d0'], [0.05, 'coin', '#c8c8d0']];

  class CashierScene extends CH.MinigameScene {
    constructor(opts = {}) {
      super({ title: 'CASHIER', hint: 'Tap the items the customer says. TOTAL, then make exact change (or tap CARD).', difficulty: opts.difficulty || 1 });
      const d = this.difficulty;
      this.total = 5 + Math.round(d * 2); this.served = 0; this.customer = null; this.phase = 'idle'; this.spawnT = 0.5;
      this.entered = []; this.changeGiven = 0; this.patience = 1; this.patienceMax = Math.max(18, 32 - d * 3);
      this.mods = has('pos2');
    }
    progress() { return this.served / this.total; }
    newCustomer() {
      const d = this.difficulty; const n = 1 + Math.floor(Math.random() * (1 + Math.min(3, d)));
      const items = []; for (let i = 0; i < n; i++) items.push(CH.pick(MENU));
      const price = items.reduce((a, b) => a + b.price, 0) * 1.13;
      const pay = Math.random() < 0.45 ? 'card' : CH.pick([20, 20, 10, 5].filter((b) => b >= price)).concat ? 20 : 20;
      let cash = 0; if (pay !== 'card') { const bills = [5, 10, 20, 50].filter((b) => b >= price); cash = bills.length ? bills[0] : 50; if (Math.random() < 0.3 && cash < 50) cash = cash === 5 ? 10 : cash === 10 ? 20 : 50; }
      const vague = d >= 2 && Math.random() < 0.5;
      let text = items.map((it) => CH.pick(it.say)).join(vague ? ', uh, and ' : ', and ');
      if (vague) text = CH.pick(['Hi, um, can I get ', 'Yeah lemme get ', 'Okay so... ']) + text + CH.pick(['. Wait. Yeah. That.', "... actually that's it.", '. Thanks. Sorry. Thanks.']);
      else text = CH.pick(['Hi! ', 'Hello, ', 'Yeah, ']) + text + '.';
      this.customer = { npc: CH.makeCustomer(0, 0), items, text, pay: pay === 'card' ? 'card' : cash, total: Math.round(price * 100) / 100, x: -40 };
      this.customer.npc.face = 'normal'; this.customer.npc.arm = 'pocket';
      this.entered = []; this.changeGiven = 0; this.patience = 1; this.phase = 'walkin';
    }
    step(dt) {
      if (this.phase === 'idle') { this.spawnT -= dt; if (this.spawnT <= 0) { if (this.served >= this.total) { this.finish(CH.clamp(this.score / this.total - this.mistakes * 0.03, 0, 1)); return; } this.newCustomer(); } return; }
      const c = this.customer;
      if (this.phase === 'walkin') { c.x += dt * 90; c.npc.walk += dt * 8; c.npc.moving = 1; if (c.x >= 120) { c.x = 120; this.phase = 'order'; c.npc.moving = 0; A.sfx('talk'); } return; }
      c.npc.update(dt);
      this.patience -= dt / this.patienceMax;
      if (this.patience <= 0) { this.fail("Customer left! 'This is why I go to the M one.'"); return; }
      if (this.phase === 'change' && this.changeGiven > c.pay - c.total + 0.001) { this.mistakes++; A.sfx('error'); this.particles.text(W / 2, 100, 'TOO MUCH CHANGE!', '#ff6060'); this.changeGiven = 0; }
    }
    fail(msg) { A.sfx('angry'); this.mistakes++; this.particles.text(W / 2, 100, msg, '#ff6060'); this.served++; this.phase = 'idle'; this.spawnT = 1.2; this.customer = null; }
    completeOrder() { const q = CH.clamp(this.patience, 0, 1); this.score += 0.5 + 0.5 * q; this.served++; S.stats.customersServed++; A.sfx('cash'); this.addCombo(); this.customer.npc.face = 'happy'; this.particles.text(W / 2, 100, CH.pick(['"Thanks!"', '"Have a good one."', '"Finally."', '"You\'re new, eh?"']), '#8bd06a'); this.phase = 'idle'; this.spawnT = 1.4; const cust = this.customer; this.run((function* (self) { yield 1.2; if (self.customer === cust) self.customer = null; })(this)); }
    drawMoney(g, x, y, d, hover) {
      const coin = d[1] === 'coin';
      MG.ink(x, y, coin ? 26 : 38, coin ? 26 : 24, (cx, cy) => {
        const m = MG.m(d[2], { dark: -30, light: 28 });
        if (coin) {
          gfx.circle(cx, cy + 1, 9, m.d);
          gfx.circle(cx, cy, 9, hover ? m.l : m.base);
          gfx.circle(cx, cy, 7, gfx.mix(m.base, '#fff', 0.18));
          gfx.ellipse(cx - 3, cy - 4, 3.4, 1.6, gfx.mix(m.l, '#fff', 0.5));
          for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; gfx.px(cx + Math.cos(a) * 8.5, cy + Math.sin(a) * 8.5, m.d); }
        } else {
          gfx.rect(cx - 15, cy - 8, 30, 17, m.d);
          gfx.rect(cx - 15, cy - 8, 30, 15, hover ? m.l : m.base);
          gfx.hline(cx - 15, cy - 8, 30, gfx.mix(m.l, '#fff', 0.4));
          gfx.frame(cx - 12, cy - 6, 24, 12, gfx.mix(m.base, '#fff', 0.3));
          gfx.ellipse(cx, cy, 4, 4.4, gfx.mix(m.base, '#fff', 0.22));
        }
      });
      gfx.text(d[0] >= 1 ? '$' + d[0] : d[0] * 100 + 'c', x, y - 3, coin && d[0] < 1 ? '#3a3346' : '#fff6e4', { align: 'center', font: 'small', outline: coin && d[0] < 1 ? null : '#2a1f33' });
    }
    draw(g) {
      // ---- room behind the counter --------------------------------------------
      gfx.vgrad(0, 0, W, 130, ['#efe3cf', '#f5ecdc', '#f8f2e4']);
      for (let y = 18; y < 130; y += 14) gfx.hline(0, y, W, 'rgba(198,180,150,0.25)');
      gfx.rect(0, 0, W, 13, '#b62f27');
      gfx.hline(0, 0, W, '#d9534a');
      gfx.rect(0, 13, W, 2, '#f5c33b');
      gfx.hline(0, 15, W, '#a4801f');
      // menu boards: dark backlit panels in metal frames
      for (let i = 0; i < 3; i++) {
        const bx = 20 + i * 150;
        gfx.rect(bx - 2, 22, 134, 44, '#3d3346');
        gfx.rect(bx, 24, 130, 40, '#211a2c');
        gfx.rect(bx + 2, 26, 126, 36, '#171223');
        g.globalAlpha = 0.12; gfx.rect(bx + 2, 26, 126, 12, '#8fb4ff'); g.globalAlpha = 1;
        const items = MENU.slice(i * 5, i * 5 + 5);
        items.forEach((m, k) => {
          gfx.text(m.name, bx + 6, 28 + k * 7, '#f5c33b', { font: 'small' });
          gfx.text('$' + m.price.toFixed(2), bx + 124, 28 + k * 7, '#f0ece2', { align: 'right', font: 'small' });
        });
        gfx.hline(bx + 2, 63, 126, '#4a4055');
      }
      // queue of other customers in the background
      if (this.served < this.total - 1) for (let i = 0; i < Math.min(3, this.total - this.served - 1); i++) CH.drawCritter(g, 300 + i * 40, 130, { species: ['bear', 'goose', 'rabbit'][i], outfit: 'casual', noShadow: true, height: 0.8, width: 0.9, topColor: ['#5a7ac8', '#c85a5a', '#5ac87a'][i] });
      // customer
      const c = this.customer;
      if (c) {
        c.npc.x = c.x; c.npc.y = 132; c.npc.draw(g);
        if (this.phase !== 'walkin') {
          const lines = gfx.wrap(c.text, 150, 'small');
          const bw = Math.max(...lines.map((l) => gfx.textWidth(l, 'small'))) + 12, bh = lines.length * 7 + 8;
          const bx = c.x + 20, by = 46;
          art.bubble(bx, by, bw, bh, c.x + 6, 120, { kind: 'say' });
          lines.forEach((l, i) => gfx.text(l, bx + 6, by + 4 + i * 7, '#2c2419', { font: 'small' }));
          MG.meter(c.x - 15, 62, 30, 4, this.patience, this.patience < 0.3 ? '#c8352b' : '#4f9d3a');
        }
      }
      // ---- counter -------------------------------------------------------------
      gfx.rect(0, 128, W, 4, '#8a1f19');
      gfx.rect(0, 130, W, 12, '#c8352b');
      gfx.hline(0, 130, W, '#e0655a');
      gfx.hline(0, 141, W, '#7d1a15');
      gfx.rect(0, 142, W, H - 142, '#8a5a2b');
      gfx.rect(0, 142, W, 3, '#a86f3a');
      for (let y = 148; y < H; y += 7) gfx.hline(0, y, W, 'rgba(90,56,22,0.35)');
      for (let i = 0; i < 30; i++) gfx.px((i * 91) % W, 150 + ((i * 47) % (H - 152)), 'rgba(160,110,58,0.5)');
      // ---- register ------------------------------------------------------------
      const px = 10, py = 150, pw = 300, ph = 116;
      MG.shadow(px + pw / 2, py + ph + 2, pw / 2 - 20, 0.25);
      gfx.rrect(px - 2, py - 2, pw + 4, ph + 4, 4, MG.INK);
      gfx.rrect(px, py, pw, ph, 3, '#4a4e58');
      gfx.rrect(px + 1, py + 1, pw - 2, 2, 2, '#787d87');
      gfx.rrect(px + 3, py + 3, pw - 6, ph - 6, 2, '#1a2a3a');
      gfx.rrect(px + 3, py + 3, pw - 6, 1, 1, '#2e4356');
      const cols = 4, rows = 4, bw = 66, bh = 20;
      MENU.forEach((m, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const r = { x: px + 8 + col * (bw + 6), y: py + 8 + row * (bh + 6), w: bw, h: bh };
        const cnt = this.entered.filter((e) => e === m).length;
        const highlight = this.mods && c && this.phase === 'order' && c.items.includes(m) && cnt < c.items.filter((x) => x === m).length;
        const clicked = MG.button(g, r, m.name + (cnt ? ' x' + cnt : ''), { color: highlight ? '#4f9d3a' : cnt ? '#7b4fb0' : '#3b5a8f', font: 'small', ink: highlight ? MG.GOLD : undefined });
        if (clicked && this.phase === 'order') { this.entered.push(m); A.sfx('blip'); }
      });
      // ---- receipt + controls --------------------------------------------------
      const rx = 320, ry = 150;
      gfx.rect(rx - 1, ry - 1, 152, 118, MG.INK);
      gfx.rect(rx, ry, 150, 116, '#fdf8ea');
      gfx.rect(rx, ry, 150, 8, '#c8352b');
      gfx.hline(rx, ry, 150, '#e0655a');
      gfx.text("DONALD'S", rx + 75, ry + 1, '#fff6e4', { align: 'center', font: 'small' });
      for (let i = 2; i < 148; i += 3) gfx.px(rx + i, ry + 114, '#ded2b8');
      const sub = this.entered.reduce((a, b) => a + b.price, 0); const tot = Math.round(sub * 1.13 * 100) / 100;
      this.entered.slice(-8).forEach((e, i) => { gfx.text(e.name, rx + 4, ry + 12 + i * 7, '#3a2f22', { font: 'small' }); gfx.text('$' + e.price.toFixed(2), rx + 146, ry + 12 + i * 7, '#3a2f22', { align: 'right', font: 'small' }); });
      gfx.hline(rx + 4, ry + 70, 142, '#ccc0a6');
      gfx.text('TOTAL (incl. tax)  $' + tot.toFixed(2), rx + 4, ry + 74, '#1d1726', { font: 'small' });
      if (this.phase === 'order') {
        if (MG.button(g, { x: rx + 4, y: ry + 84, w: 60, h: 12, noScroll: true }, 'TOTAL', { color: '#4f9d3a', font: 'small' })) {
          if (!c) return;
          const want = c.items.map((i) => i.id).sort().join(','), got = this.entered.map((i) => i.id).sort().join(',');
          if (want === got) { this.phase = c.pay === 'card' ? 'card' : 'change'; A.sfx('good'); c.text = c.pay === 'card' ? 'Card, please.' : `Here's $${c.pay}.`; }
          else { this.mistakes++; A.sfx('error'); c.text = CH.pick(["That's not what I said.", 'No... no. Let me say it again: ' + c.items.map((it) => it.say[0]).join(', ') + '.', 'Are you new?']); this.patience -= 0.15; }
        }
        if (MG.button(g, { x: rx + 70, y: ry + 84, w: 60, h: 12, noScroll: true }, 'CLEAR', { color: '#8a3a3a', font: 'small' })) { this.entered = []; }
      } else if (this.phase === 'card') {
        if (MG.button(g, { x: rx + 4, y: ry + 84, w: 130, h: 12, noScroll: true }, 'TAP CARD  *beep*', { color: '#3b6fd6', font: 'small' })) { this.completeOrder(); }
      } else if (this.phase === 'change') {
        const due = Math.round((c.pay - c.total) * 100) / 100;
        gfx.text(`Paid $${c.pay}. Change due: $${due.toFixed(2)}`, rx + 4, ry + 84, '#a82a22', { font: 'small' });
        gfx.text(`Given: $${this.changeGiven.toFixed(2)}`, rx + 4, ry + 92, '#3a2f22', { font: 'small' });
        if (has('changecalc')) gfx.text('(auto-calc: exact)', rx + 4, ry + 100, '#3f8f3a', { font: 'small' });
        // till drawer, slid out over the register
        g.globalAlpha = 0.35; gfx.rect(4, H - 39, W - 8, 5, '#0f0a16'); g.globalAlpha = 1;
        gfx.rect(6, H - 34, W - 12, 32, '#6d4a22');
        gfx.rect(8, H - 32, W - 16, 28, '#8a5a2b');
        gfx.hline(8, H - 32, W - 16, '#b07a42');
        for (let i = 0; i < 8; i++) gfx.vline(10 + i * 36, H - 30, 24, '#6d4a22');
        DENOMS.forEach((d, i) => {
          const r = { x: 14 + i * 36, y: H - 26, w: 32, h: 20 };
          const hv = inp.mouseIn(r);
          this.drawMoney(g, r.x + 16, r.y + 10, d, hv);
          if (hv) ui.cursor = 'hand';
          if (inp.clicked(r)) { this.changeGiven = Math.round((this.changeGiven + d[0]) * 100) / 100; A.sfx('coin'); inp.eat(); if (Math.abs(this.changeGiven - due) < 0.001) { this.completeOrder(); } }
        });
        if (has('changecalc') && MG.button(g, { x: rx + 60, y: ry + 100, w: 80, h: 12, noScroll: true }, 'AUTO CHANGE', { color: '#4f9d3a', font: 'small' })) this.completeOrder();
        MG.tag('TILL', 8, H - 44);
      }
      MG.tag(`Served ${this.served}/${this.total}`, W - 6 - gfx.textWidth(`Served ${this.served}/${this.total}`, 'small') - 7, 18);
      this.particles.draw(g);
      this.drawHud(g);
    }
  }
  CH.CashierScene = CashierScene;

  // ---------------------------------------------------------------- DRIVE-THRU -----
  class DriveThruScene extends CH.MinigameScene {
    constructor(opts = {}) {
      super({ title: 'DRIVE-THRU', hint: 'Decode the static. Pick the items. Then hand the bag out when the car window lines up!', difficulty: opts.difficulty || 1 });
      const d = this.difficulty;
      this.total = 4 + Math.round(d * 2); this.served = 0; this.phase = 'idle'; this.spawnT = 0.5; this.car = null; this.noise = Math.min(0.55, 0.2 + d * 0.1) * (has('headset2') ? 0.5 : 1);
      this.picked = []; this.repeats = 0; this.weather = Math.random() < 0.4 ? 'snow' : 'clear'; this.snow = []; for (let i = 0; i < 60; i++) this.snow.push([Math.random() * W, Math.random() * H]);
    }
    progress() { return this.served / this.total; }
    garble(text, noise) { let out = ''; for (const ch of text) { if (ch === ' ' || ch === ',' || ch === '.') out += ch; else out += Math.random() < noise ? CH.pick(['#', '*', '~', '%']) : ch; } return out; }
    newCar() {
      const d = this.difficulty; const n = 1 + Math.floor(Math.random() * (1 + Math.min(2, d)));
      const items = []; for (let i = 0; i < n; i++) items.push(CH.pick(MENU));
      const text = items.map((it) => CH.pick(it.say)).join(', and ') + ', please.';
      this.car = { items, text, garbled: this.garble(text, this.noise), color: CH.pick(['#3b6fd6', '#c8352b', '#4f9d3a', '#f5c33b', '#8a8a94', '#7b4fb0']), x: -80, npc: CH.makeCustomer(0, 0), patience: 1 };
      this.picked = []; this.repeats = 0; this.phase = 'order'; A.sfx('static');
      this.patienceMax = Math.max(20, 34 - d * 3);
    }
    step(dt) {
      for (const s of this.snow) { s[1] += dt * 60; s[0] -= dt * 30; if (s[1] > H) { s[1] = 0; s[0] = Math.random() * W; } if (s[0] < 0) s[0] += W; }
      if (this.phase === 'idle') { this.spawnT -= dt; if (this.spawnT <= 0) { if (this.served >= this.total) { this.finish(CH.clamp(this.score / this.total - this.mistakes * 0.04, 0, 1)); return; } this.newCar(); } return; }
      const c = this.car;
      c.patience -= dt / this.patienceMax;
      if (c.patience <= 0) { this.fail('They drove off. Honking.'); return; }
      if (this.phase === 'order') { c.x = CH.lerp(c.x, 40, dt * 3); }
      if (this.phase === 'pullup') { c.x += dt * 70; if (c.x > 200) { this.phase = 'handout'; c.handT = 0; } }
      if (this.phase === 'handout') {
        c.x += dt * (18 + this.difficulty * 6); c.handT += dt;
        const winX = c.x + 40; // car window position; hand-out zone: 300..330
        if (inp.mpressed) { if (winX > 296 && winX < 336) { this.completeOrder(); } else { this.mistakes++; A.sfx('thud'); this.particles.burst(316, 150, 12, { color: ['#f5c33b', '#e8b030', '#fff'], speed: 60, life: 0.6, grav: 300 }); this.particles.text(316, 120, winX < 296 ? 'TOO EARLY! fries on the pavement' : 'TOO LATE!', '#ff6060'); if (winX >= 336) { this.fail('They left without their food.'); } else c.patience -= 0.2; } }
        if (c.x > 420) this.fail('They left without their food.');
      }
    }
    fail(msg) { A.sfx('honk'); this.mistakes++; this.particles.text(W / 2, 100, msg, '#ff6060'); this.served++; this.phase = 'idle'; this.spawnT = 1.2; this.car = null; }
    completeOrder() { const q = CH.clamp(this.car.patience, 0, 1) * (this.repeats ? 0.85 : 1); this.score += 0.5 + 0.5 * q; this.served++; S.stats.customersServed++; A.sfx('cash'); this.addCombo(); this.particles.text(316, 120, CH.pick(['"Thanks, bud."', '"Keep the change." (there is no change)', '"Is this the D one?" "Yes." "Nice."']), '#8bd06a'); const car = this.car; this.phase = 'leaving'; this.run((function* (self) { while (car.x < W + 80) { car.x += 200 / 60; yield 1 / 60; } if (self.car === car) { self.car = null; self.phase = 'idle'; self.spawnT = 1; } })(this)); }
    drawCar(g, c) {
      const cx = Math.round(c.x), cy = 160;
      const m = MG.m(c.color, { dark: -32, darker: -52, light: 26 });
      MG.shadow(cx + 45, cy + 4, 44, 0.3);
      MG.ink(cx + 45, cy - 20, 104, 60, (bx, by) => {
        const x0 = bx - 45, y0 = by + 20;   // back to the original (cx, cy) frame
        // body
        gfx.rrect(x0, y0 - 26, 90, 20, 4, m.base);
        gfx.rrect(x0, y0 - 26, 90, 6, 4, m.l);
        gfx.rrect(x0, y0 - 12, 90, 6, 3, m.d);
        // cabin
        gfx.rrect(x0 + 16, y0 - 40, 50, 16, 4, m.d);
        gfx.rrect(x0 + 16, y0 - 40, 50, 13, 4, m.base);
        gfx.rrect(x0 + 17, y0 - 40, 48, 2, 2, m.l);
        // glass with a sky reflection
        gfx.rect(x0 + 20, y0 - 37, 18, 11, '#6ba7d8');
        gfx.rect(x0 + 20, y0 - 37, 18, 5, '#a9d6f2');
        gfx.rect(x0 + 42, y0 - 37, 20, 11, '#6ba7d8');
        gfx.rect(x0 + 42, y0 - 37, 20, 5, '#a9d6f2');
        gfx.vline(x0 + 39, y0 - 40, 14, m.d);
        // wheels + arches
        gfx.ellipse(x0 + 18, y0 - 6, 10, 4, m.dd);
        gfx.ellipse(x0 + 72, y0 - 6, 10, 4, m.dd);
        gfx.circle(x0 + 18, y0 - 4, 8, '#16131c');
        gfx.circle(x0 + 72, y0 - 4, 8, '#16131c');
        gfx.circle(x0 + 18, y0 - 4, 4, '#8e939d');
        gfx.circle(x0 + 72, y0 - 4, 4, '#8e939d');
        gfx.px(x0 + 17, y0 - 6, '#d2d6de'); gfx.px(x0 + 71, y0 - 6, '#d2d6de');
        // lights and trim
        gfx.rect(x0 + 86, y0 - 22, 4, 4, '#f5c33b');
        gfx.rect(x0 - 1, y0 - 22, 4, 4, '#c8352b');
        gfx.hline(x0 + 2, y0 - 16, 86, m.dd);
        if (this.weather === 'snow') { gfx.rect(x0 + 14, y0 - 43, 54, 3, '#f4f8ff'); gfx.hline(x0 + 14, y0 - 44, 54, '#ffffff'); }
      });
      // driver, clipped into the side window
      g.save(); gfx.clip(cx + 42, cy - 37, 20, 11);
      CH.drawCritter(g, cx + 52, cy - 22, { species: c.npc.species, outfit: 'casual', noShadow: true, height: 0.9, topColor: c.npc.topColor, face: c.patience < 0.3 ? 'angry' : 'normal' });
      gfx.unclip(); g.restore();
      MG.meter(cx + 30, cy - 50, 30, 4, c.patience, c.patience < 0.3 ? '#c8352b' : '#4f9d3a');
      if (this.phase === 'handout') gfx.rect(cx + 42, cy - 37, 20, 11, 'rgba(20,14,26,0.22)');
    }
    draw(g) {
      // ---- outside ------------------------------------------------------------
      gfx.vgrad(0, 0, W, 120, this.weather === 'snow' ? ['#8a9ab8', '#a0b0c8', '#b8c8d8', '#cfdae2'] : ['#3f5f92', '#6a8cbe', '#98b8dc', '#c2d8ec']);
      if (this.weather !== 'snow') for (let i = 0; i < 3; i++) { const cxx = 60 + i * 150 + Math.sin(this.t * 0.1 + i) * 6; gfx.ellipse(cxx, 30 + i * 6, 22, 7, 'rgba(255,255,255,0.5)'); gfx.ellipse(cxx + 12, 28 + i * 6, 14, 6, 'rgba(255,255,255,0.4)'); }
      // pines
      for (let i = 0; i < 10; i++) {
        const tx = i * 52 + 10;
        gfx.rect(tx - 2, 108, 4, 12, '#3a2a1a');
        for (let k = 0; k < 3; k++) {
          gfx.tri(tx - 13 + k * 3, 120 - k * 12, tx + 13 - k * 3, 120 - k * 12, tx, 68 + (i % 3) * 8, '#20362c');
          gfx.tri(tx - 12 + k * 3, 119 - k * 12, tx + 8 - k * 3, 119 - k * 12, tx, 70 + (i % 3) * 8, '#2f4a3c');
          gfx.tri(tx - 10 + k * 3, 118 - k * 12, tx - 1, 118 - k * 12, tx - 1, 74 + (i % 3) * 8, '#3c5c48');
        }
        if (this.weather === 'snow') for (let k = 0; k < 3; k++) gfx.hline(tx - 11 + k * 3, 120 - k * 12, 22 - k * 6, 'rgba(255,255,255,0.55)');
      }
      // asphalt lane
      gfx.rect(0, 118, W, 50, '#3a3a44');
      gfx.rect(0, 118, W, 2, '#c8ccd4');
      gfx.rect(0, 120, W, 2, '#4e4e5a');
      for (let i = 0; i < 60; i++) gfx.px((i * 83) % W, 122 + ((i * 29) % 44), i % 3 ? '#43434e' : '#32323c');
      for (let x = 0; x < W; x += 40) { gfx.rect(x, 142, 20, 2, '#f5c33b'); gfx.hline(x, 142, 20, '#ffe08a'); }
      // lane sign
      MG.ink(50, 76, 68, 38, (cx, cy) => {
        gfx.rect(cx - 30, cy - 16, 60, 30, '#8f231c');
        gfx.rect(cx - 30, cy - 16, 60, 27, MG.RED);
        gfx.hline(cx - 30, cy - 16, 60, '#e0655a');
        gfx.text('DRIVE', cx, cy - 12, '#fff6e4', { align: 'center', font: 'small' });
        gfx.text('THRU', cx, cy - 4, '#fff6e4', { align: 'center', font: 'small' });
        gfx.text('→', cx, cy + 4, '#f5c33b', { align: 'center', font: 'small' });
      });
      gfx.rect(48, 92, 4, 26, '#4c505a'); gfx.vline(48, 92, 26, '#787d87');
      // menu board + speaker
      gfx.rect(98, 38, 74, 64, '#3d3346');
      gfx.rect(100, 40, 70, 60, '#211a2c');
      gfx.rect(103, 43, 64, 54, '#171223');
      g.globalAlpha = 0.12; gfx.rect(103, 43, 64, 16, '#8fb4ff'); g.globalAlpha = 1;
      MENU.slice(0, 7).forEach((m, k) => gfx.text(m.name, 106, 46 + k * 7, '#f5c33b', { font: 'small' }));
      MG.ink(135, 109, 24, 24, (cx, cy) => {
        gfx.rect(cx - 9, cy - 9, 18, 18, '#4c505a');
        gfx.rect(cx - 9, cy - 9, 18, 16, '#5c616c');
        gfx.hline(cx - 9, cy - 9, 18, '#949aa4');
        for (let i = 0; i < 3; i++) gfx.hline(cx - 6, cy - 5 + i * 4, 12, '#211a2c');
        gfx.px(cx + 6, cy + 5, this.phase === 'order' ? '#6fd06f' : '#3a3346');
      });
      // car
      const c = this.car;
      if (c) this.drawCar(g, c);
      // hand-out zone: a box painted on the asphalt right under the window
      const live = this.phase === 'handout';
      const zc = live ? '#6fd06f' : '#9a9aa6';
      gfx.rect(294, 122, 44, 2, zc);
      gfx.rect(294, 162, 44, 2, zc);
      gfx.rect(294, 122, 2, 42, zc);
      gfx.rect(336, 122, 2, 42, zc);
      for (let i = 0; i < 4; i++) gfx.tri(300 + i * 10, 128, 308 + i * 10, 128, 304 + i * 10, 134, live ? 'rgba(140,220,140,0.55)' : 'rgba(150,150,165,0.35)');
      if (live) { g.globalAlpha = 0.12 + Math.sin(this.t * 8) * 0.05; gfx.rect(296, 124, 40, 38, '#8bd06a'); g.globalAlpha = 1; }
      if (live) MG.tag('CLICK when the window is here!', 316, 104, { align: 'center', face: Math.sin(this.t * 8) > 0 ? MG.GOLD : MG.CREAM });
      // window frame + inside
      gfx.rect(0, 168, W, H - 168, '#8a5a2b');
      gfx.rect(0, 168, W, 3, '#a86f3a');
      for (let y = 174; y < H; y += 7) gfx.hline(0, y, W, 'rgba(90,56,22,0.3)');
      gfx.rect(0, 0, 14, 170, '#4c505a'); gfx.vline(12, 0, 170, '#787d87'); gfx.vline(0, 0, 170, '#2f333b');
      gfx.rect(W - 14, 0, 14, 170, '#4c505a'); gfx.vline(W - 14, 0, 170, '#787d87');
      gfx.rect(0, 0, W, 6, '#4c505a'); gfx.hline(0, 5, W, '#2f333b');
      // snow in front of the glass
      if (this.weather === 'snow') for (const s of this.snow) if (s[1] < 168) gfx.px(s[0], s[1], '#fff');
      // ---- headset panel -------------------------------------------------------
      gfx.rrect(8, 174, 244, 92, 4, MG.INK);
      gfx.rrect(10, 176, 240, 88, 3, '#2b2436');
      gfx.rrect(12, 178, 236, 84, 2, '#0f1a10');
      gfx.rrect(12, 178, 236, 2, 1, '#1c3220');
      for (let y = 180; y < 260; y += 3) gfx.hline(14, y, 232, 'rgba(80,255,120,0.04)');
      gfx.text('HEADSET', 16, 181, '#4f4', { font: 'small' });
      for (let i = 0; i < 12; i++) { const lvl = this.phase === 'order' ? Math.round(Math.abs(Math.sin(this.t * 10 + i)) * 4) : 0; gfx.rect(70 + i * 5, 186 - lvl, 3, 1 + lvl, '#4f4'); gfx.px(70 + i * 5, 186 - lvl, '#bfffbf'); }
      if (c && this.phase === 'order') { const lines = gfx.wrap('"' + c.garbled + '"', 226, 'small'); lines.forEach((l, i) => gfx.text(l, 16, 192 + i * 7, '#8f8', { font: 'small' })); }
      else if (c && this.phase !== 'order') gfx.text(this.phase === 'pullup' ? '"Pull up to the window..."' : this.phase === 'handout' ? 'Hand out the order!' : '...', 16, 192, '#8f8', { font: 'small' });
      else gfx.text('*static*', 16, 192, '#4a4', { font: 'small' });
      if (this.phase === 'order') {
        if (MG.button(g, { x: 16, y: 244, w: 110, h: 12 }, 'Can you repeat that?', { color: '#3b5a8f', font: 'small' })) { if (c) { this.repeats++; c.garbled = this.garble(c.text, this.noise * Math.pow(0.55, this.repeats)); c.patience -= 0.12; A.sfx('static'); } }
        if (MG.button(g, { x: 134, y: 244, w: 110, h: 12 }, 'CONFIRM ORDER', { color: '#4f9d3a', font: 'small' })) {
          if (c) { const want = c.items.map((i) => i.id).sort().join(','), got = this.picked.map((i) => i.id).sort().join(','); if (want === got) { this.phase = 'pullup'; A.sfx('good'); } else { this.mistakes++; A.sfx('error'); this.particles.text(130, 170, 'Wrong order!', '#ff6060'); c.patience -= 0.15; } }
        }
      }
      // ---- menu picker ---------------------------------------------------------
      gfx.rrect(256, 174, 216, 92, 4, MG.INK);
      gfx.rrect(258, 176, 212, 88, 3, '#4a4e58');
      gfx.rrect(259, 177, 210, 2, 1, '#787d87');
      MENU.forEach((m, i) => {
        const col = i % 4, row = Math.floor(i / 4);
        const r = { x: 262 + col * 52, y: 180 + row * 21, w: 48, h: 18 };
        const cnt = this.picked.filter((e) => e === m).length;
        if (MG.button(g, r, m.name.replace('Nuggets', 'Nug').replace('Moose ', '').toUpperCase(), { color: cnt ? '#7b4fb0' : '#3b5a8f', font: 'small', badge: cnt ? String(cnt) : null }) && this.phase === 'order') { this.picked.push(m); }
      });
      if (this.phase === 'order' && this.picked.length) {
        gfx.text('picked: ' + this.picked.map((p) => p.name).join(', ').slice(0, 40), 16, 234, '#f5c33b', { font: 'small' });
        if (MG.button(g, { x: 196, y: 231, w: 48, h: 11 }, 'clear', { color: '#8a3a3a', font: 'small' })) this.picked = [];
      }
      const st = `Cars ${this.served}/${this.total}`;
      MG.tag(st, W - 22 - gfx.textWidth(st, 'small'), 18);
      // bag in hand when handing out
      if (this.phase === 'handout') { F.bag(g, inp.mx, inp.my + 12, false, 2); ui.cursor = 'none'; }
      this.particles.draw(g);
      this.drawHud(g);
    }
  }
  CH.DriveThruScene = DriveThruScene;

  CH.SCENES.cashier = () => { const s = new CH.Scene(); s.enter = () => CH.game.push(new CashierScene({ difficulty: 1 })); return s; };
  CH.SCENES.drivethru = () => { const s = new CH.Scene(); s.enter = () => CH.game.push(new DriveThruScene({ difficulty: 1 })); return s; };
})(window.CH);
