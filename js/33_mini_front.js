// ============================================================================
// FRONT COUNTER MINIGAMES: cashier (POS + change) and drive-thru (headset)
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, A = CH.audio, inp = CH.input, S = CH.state, F = CH.FOOD;
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
    draw(g) {
      // counter view: customer beyond the counter, register in foreground
      gfx.vgrad(0, 0, W, 130, ['#f4ead8', '#f8f0e0']); gfx.rect(0, 0, W, 14, '#c8352b'); gfx.rect(0, 14, W, 2, '#f5c33b');
      // menu boards
      for (let i = 0; i < 3; i++) { gfx.rect(20 + i * 150, 24, 130, 40, '#2a2a34'); gfx.rect(22 + i * 150, 26, 126, 36, '#1a1a24'); const items = MENU.slice(i * 5, i * 5 + 5); items.forEach((m, k) => { gfx.text(m.name, 26 + i * 150, 28 + k * 7, '#f5c33b', { font: 'small' }); gfx.text('$' + m.price.toFixed(2), 144 + i * 150, 28 + k * 7, '#fff', { align: 'right', font: 'small' }); }); }
      // queue of other customers in the background
      if (this.served < this.total - 1) for (let i = 0; i < Math.min(3, this.total - this.served - 1); i++) CH.drawCritter(g, 300 + i * 40, 130, { species: ['bear', 'goose', 'rabbit'][i], outfit: 'casual', noShadow: true, height: 0.8, width: 0.9, topColor: ['#5a7ac8', '#c85a5a', '#5ac87a'][i] });
      // customer
      const c = this.customer;
      if (c) { c.npc.x = c.x; c.npc.y = 132; c.npc.draw(g); if (this.phase !== 'walkin') { const lines = gfx.wrap(c.text, 150, 'small'); const bw = Math.max(...lines.map((l) => gfx.textWidth(l, 'small'))) + 10, bh = lines.length * 7 + 6; const bx = c.x + 20, by = 50; gfx.rrect(bx, by, bw, bh, 3, '#fff'); gfx.tri(bx + 6, by + bh, bx + 14, by + bh, bx + 4, by + bh + 6, '#fff'); lines.forEach((l, i) => gfx.text(l, bx + 5, by + 3 + i * 7, '#222', { font: 'small' })); ui.bar(c.x - 15, 60, 30, 3, this.patience, this.patience < 0.3 ? '#c8352b' : '#4f9d3a'); } }
      // counter
      gfx.rect(0, 130, W, 12, '#c8352b'); gfx.rect(0, 142, W, H - 142, '#8a5a2b'); gfx.rect(0, 142, W, 2, '#a86f3a');
      // register (POS)
      const px = 10, py = 150, pw = 300, ph = 116;
      gfx.rrect(px, py, pw, ph, 3, '#3a3a44'); gfx.rrect(px + 3, py + 3, pw - 6, ph - 6, 2, '#1a2a3a');
      const cols = 4, rows = 4, bw = 66, bh = 20;
      MENU.forEach((m, i) => { const col = i % cols, row = Math.floor(i / cols); const r = { x: px + 8 + col * (bw + 6), y: py + 8 + row * (bh + 6), w: bw, h: bh }; const cnt = this.entered.filter((e) => e === m).length; const highlight = this.mods && c && this.phase === 'order' && c.items.includes(m) && cnt < c.items.filter((x) => x === m).length; const clicked = ui.button(g, r, m.name + (cnt ? ' x' + cnt : ''), { color: highlight ? '#4f9d3a' : cnt ? '#7b4fb0' : '#3b5a8f' }); if (clicked && this.phase === 'order') { this.entered.push(m); A.sfx('blip'); } });
      // receipt + controls
      const rx = 320, ry = 150;
      gfx.rect(rx, ry, 150, 116, '#f8f4e8'); gfx.rect(rx, ry, 150, 8, '#c8352b'); gfx.text("DONALD'S", rx + 75, ry + 1, '#fff', { align: 'center', font: 'small' });
      const sub = this.entered.reduce((a, b) => a + b.price, 0); const tot = Math.round(sub * 1.13 * 100) / 100;
      this.entered.slice(-8).forEach((e, i) => { gfx.text(e.name, rx + 4, ry + 12 + i * 7, '#333', { font: 'small' }); gfx.text('$' + e.price.toFixed(2), rx + 146, ry + 12 + i * 7, '#333', { align: 'right', font: 'small' }); });
      gfx.text('TOTAL (incl. tax)  $' + tot.toFixed(2), rx + 4, ry + 74, '#111', { font: 'small' });
      if (this.phase === 'order') {
        if (ui.button(g, { x: rx + 4, y: ry + 84, w: 60, h: 12, noScroll: true }, 'TOTAL', { color: '#4f9d3a' })) {
          if (!c) return;
          const want = c.items.map((i) => i.id).sort().join(','), got = this.entered.map((i) => i.id).sort().join(',');
          if (want === got) { this.phase = c.pay === 'card' ? 'card' : 'change'; A.sfx('good'); c.text = c.pay === 'card' ? 'Card, please.' : `Here's $${c.pay}.`; }
          else { this.mistakes++; A.sfx('error'); c.text = CH.pick(["That's not what I said.", 'No... no. Let me say it again: ' + c.items.map((it) => it.say[0]).join(', ') + '.', 'Are you new?']); this.patience -= 0.15; }
        }
        if (ui.button(g, { x: rx + 70, y: ry + 84, w: 60, h: 12, noScroll: true }, 'CLEAR', { color: '#8a3a3a' })) { this.entered = []; }
      } else if (this.phase === 'card') {
        if (ui.button(g, { x: rx + 4, y: ry + 84, w: 130, h: 12, noScroll: true }, 'TAP CARD  *beep*', { color: '#3b6fd6' })) { this.completeOrder(); }
      } else if (this.phase === 'change') {
        const due = Math.round((c.pay - c.total) * 100) / 100;
        gfx.text(`Paid $${c.pay}. Change due: $${due.toFixed(2)}`, rx + 4, ry + 84, '#c8352b', { font: 'small' });
        gfx.text(`Given: $${this.changeGiven.toFixed(2)}`, rx + 4, ry + 92, '#333', { font: 'small' });
        if (has('changecalc')) gfx.text('(auto-calc: exact)', rx + 4, ry + 100, '#4f9d3a', { font: 'small' });
        // till drawer
        DENOMS.forEach((d, i) => { const r = { x: 14 + i * 36, y: H - 26, w: 32, h: 20 }; const hv = inp.mouseIn(r); gfx.rrect(r.x, r.y, r.w, r.h, d[1] === 'coin' ? 8 : 2, hv ? gfx.shade(d[2], 30) : d[2]); gfx.text(d[0] >= 1 ? '$' + d[0] : d[0] * 100 + 'c', r.x + 16, r.y + 6, d[1] === 'coin' && d[0] < 1 ? '#333' : '#fff', { align: 'center', font: 'small' }); if (hv) ui.cursor = 'hand'; if (inp.clicked(r)) { this.changeGiven = Math.round((this.changeGiven + d[0]) * 100) / 100; A.sfx('coin'); inp.eat(); if (Math.abs(this.changeGiven - due) < 0.001) { this.completeOrder(); } } });
        if (has('changecalc') && ui.button(g, { x: rx + 60, y: ry + 100, w: 80, h: 12, noScroll: true }, 'AUTO CHANGE', { color: '#4f9d3a' })) this.completeOrder();
        gfx.text('TILL', 8, H - 34, '#fff', { font: 'small', outline: '#000' });
      }
      gfx.text(`Served ${this.served}/${this.total}`, W - 6, 18, '#fff', { align: 'right', font: 'small', outline: '#000' });
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
    draw(g) {
      // outside view through the drive-thru window
      gfx.vgrad(0, 0, W, 120, this.weather === 'snow' ? ['#8a9ab8', '#a8b8cc', '#c8d4dc'] : ['#4a6a9a', '#7a9ac8', '#b8d0e8']);
      for (let i = 0; i < 10; i++) { const tx = i * 52 + 10; for (let k = 0; k < 3; k++) gfx.tri(tx - 12 + k * 3, 120 - k * 12, tx + 12 - k * 3, 120 - k * 12, tx, 70 + (i % 3) * 8, '#2f4a3c'); }
      gfx.rect(0, 118, W, 50, '#3a3a44'); gfx.rect(0, 118, W, 2, '#c8ccd4'); for (let x = 0; x < W; x += 40) gfx.rect(x, 142, 20, 2, '#f5c33b');
      // lane sign
      gfx.rect(20, 60, 60, 30, '#c8352b'); gfx.text('DRIVE', 50, 64, '#fff', { align: 'center', font: 'small' }); gfx.text('THRU', 50, 72, '#fff', { align: 'center', font: 'small' }); gfx.text('→', 50, 80, '#f5c33b', { align: 'center', font: 'small' }); gfx.rect(48, 90, 4, 28, '#5a5a66');
      // menu board outside w/ speaker
      gfx.rect(100, 40, 70, 60, '#2a2a34'); gfx.rect(103, 43, 64, 54, '#1a1a24'); MENU.slice(0, 7).forEach((m, k) => gfx.text(m.name, 106, 46 + k * 7, '#f5c33b', { font: 'small' })); gfx.rect(126, 100, 18, 18, '#5a5a66'); for (let i = 0; i < 3; i++) gfx.hline(129, 104 + i * 4, 12, '#222');
      // car
      const c = this.car;
      if (c) {
        const cx = Math.round(c.x), cy = 160;
        gfx.rrect(cx, cy - 26, 90, 20, 4, c.color); gfx.rrect(cx + 16, cy - 40, 50, 16, 4, c.color); gfx.rect(cx + 20, cy - 37, 18, 11, '#9fdcff'); gfx.rect(cx + 42, cy - 37, 20, 11, '#9fdcff');
        gfx.circle(cx + 18, cy - 4, 8, '#111'); gfx.circle(cx + 72, cy - 4, 8, '#111'); gfx.circle(cx + 18, cy - 4, 3, '#888'); gfx.circle(cx + 72, cy - 4, 3, '#888');
        if (this.weather === 'snow') gfx.rect(cx + 14, cy - 43, 54, 3, '#fff');
        // driver
        g.save(); gfx.clip(cx + 42, cy - 37, 20, 11); CH.drawCritter(g, cx + 52, cy - 22, { species: c.npc.species, outfit: 'casual', noShadow: true, height: 0.9, topColor: c.npc.topColor, face: c.patience < 0.3 ? 'angry' : 'normal' }); gfx.unclip(); g.restore();
        gfx.px(cx + 88, cy - 20, '#f5c33b'); gfx.px(cx + 1, cy - 20, '#c8352b');
        ui.bar(cx + 30, cy - 50, 30, 3, c.patience, c.patience < 0.3 ? '#c8352b' : '#4f9d3a');
        if (this.phase === 'handout') { gfx.rect(cx + 42, cy - 37, 20, 11, 'rgba(0,0,0,0.2)'); }
      }
      // hand-out zone marker
      gfx.rect(296, 100, 40, 3, this.phase === 'handout' ? '#4f9d3a' : '#5a5a66'); gfx.rect(296, 100, 3, 20, '#5a5a66'); gfx.rect(333, 100, 3, 20, '#5a5a66'); if (this.phase === 'handout') gfx.text('CLICK when the window is here!', 316, 88, Math.sin(this.t * 8) > 0 ? '#fff' : '#f5c33b', { align: 'center', font: 'small', outline: '#000' });
      // window frame + inside
      gfx.rect(0, 168, W, H - 168, '#8a5a2b'); gfx.rect(0, 168, W, 3, '#a86f3a');
      gfx.rect(0, 0, 14, 170, '#5a5a66'); gfx.rect(W - 14, 0, 14, 170, '#5a5a66'); gfx.rect(0, 0, W, 6, '#5a5a66');
      // snow
      if (this.weather === 'snow') for (const s of this.snow) if (s[1] < 168) gfx.px(s[0], s[1], '#fff');
      // headset UI panel
      gfx.rect(10, 176, 240, 88, '#1a1a24'); gfx.rect(12, 178, 236, 84, '#0f1a10');
      gfx.text('HEADSET', 16, 181, '#4f4', { font: 'small' }); for (let i = 0; i < 12; i++) gfx.rect(70 + i * 5, 182 + (this.phase === 'order' ? Math.round(Math.abs(Math.sin(this.t * 10 + i)) * 4) : 4), 3, 5 - (this.phase === 'order' ? Math.round(Math.abs(Math.sin(this.t * 10 + i)) * 4) : 4), '#4f4');
      if (c && this.phase === 'order') { const lines = gfx.wrap('"' + c.garbled + '"', 226, 'small'); lines.forEach((l, i) => gfx.text(l, 16, 190 + i * 7, '#8f8', { font: 'small' })); }
      else if (c && this.phase !== 'order') gfx.text(this.phase === 'pullup' ? '"Pull up to the window..."' : this.phase === 'handout' ? 'Hand out the order!' : '...', 16, 190, '#8f8', { font: 'small' });
      else gfx.text('*static*', 16, 190, '#4a4', { font: 'small' });
      if (this.phase === 'order') {
        if (ui.button(g, { x: 16, y: 244, w: 110, h: 12 }, 'Can you repeat that?', { color: '#3b5a8f' })) { if (c) { this.repeats++; c.garbled = this.garble(c.text, this.noise * Math.pow(0.55, this.repeats)); c.patience -= 0.12; A.sfx('static'); } }
        if (ui.button(g, { x: 134, y: 244, w: 110, h: 12 }, 'CONFIRM ORDER', { color: '#4f9d3a' })) {
          if (c) { const want = c.items.map((i) => i.id).sort().join(','), got = this.picked.map((i) => i.id).sort().join(','); if (want === got) { this.phase = 'pullup'; A.sfx('good'); } else { this.mistakes++; A.sfx('error'); this.particles.text(130, 170, 'Wrong order!', '#ff6060'); c.patience -= 0.15; } }
        }
      }
      // menu picker
      gfx.rect(258, 176, 212, 88, '#3a3a44');
      MENU.forEach((m, i) => { const col = i % 4, row = Math.floor(i / 4); const r = { x: 262 + col * 52, y: 180 + row * 21, w: 48, h: 18 }; const cnt = this.picked.filter((e) => e === m).length; if (ui.button(g, r, m.name.replace('Nuggets', 'Nug').replace('Moose ', ''), { color: cnt ? '#7b4fb0' : '#3b5a8f' }) && this.phase === 'order') { this.picked.push(m); } });
      if (this.phase === 'order' && this.picked.length) { gfx.text('picked: ' + this.picked.map((p) => p.name).join(', ').slice(0, 44), 16, 234, '#f5c33b', { font: 'small' }); if (ui.button(g, { x: 200, y: 232, w: 44, h: 10 }, 'clear', { color: '#8a3a3a' })) this.picked = []; }
      gfx.text(`Cars ${this.served}/${this.total}`, W - 20, 18, '#fff', { align: 'right', font: 'small', outline: '#000' });
      // bag in hand when handing out
      if (this.phase === 'handout') { F.bag(g, inp.mx, inp.my + 10, false, 2); ui.cursor = 'none'; }
      this.particles.draw(g);
      this.drawHud(g);
    }
  }
  CH.DriveThruScene = DriveThruScene;

  CH.SCENES.cashier = () => { const s = new CH.Scene(); s.enter = () => CH.game.push(new CashierScene({ difficulty: 1 })); return s; };
  CH.SCENES.drivethru = () => { const s = new CH.Scene(); s.enter = () => CH.game.push(new DriveThruScene({ difficulty: 1 })); return s; };
})(window.CH);
