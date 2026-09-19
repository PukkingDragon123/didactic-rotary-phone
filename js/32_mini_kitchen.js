// ============================================================================
// KITCHEN MINIGAMES (first-person): grill, assembly, fries & drinks, bagging
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, A = CH.audio, inp = CH.input, S = CH.state, F = CH.FOOD;
  const W = CH.W, H = CH.H;
  const has = (k) => CH.has(k);

  // ---- shared ticket machinery -------------------------------------------------------------------
  class TicketQueue {
    constructor(owner, total, interval, patience, gen) { this.owner = owner; this.total = total; this.interval = interval; this.patience = patience; this.gen = gen; this.spawned = 0; this.active = []; this.done = 0; this.failed = 0; this.timer = 0.5; this.maxActive = 3; }
    update(dt) {
      this.timer -= dt;
      if (this.timer <= 0 && this.spawned < this.total && this.active.length < this.maxActive) { this.timer = this.interval; const t = this.gen(this.spawned); t.num = this.spawned + 1; t.time = this.patience; t.maxTime = this.patience; this.active.push(t); this.spawned++; A.sfx('ding'); }
      for (let i = this.active.length - 1; i >= 0; i--) { const t = this.active[i]; t.time -= dt; if (t.time <= 0) { this.active.splice(i, 1); this.failed++; this.owner.onTicketFail && this.owner.onTicketFail(t); A.sfx('angry'); this.owner.particles.text(W / 2, 60, 'ORDER #' + t.num + ' EXPIRED', '#ff6060'); } }
    }
    complete(t) { const i = this.active.indexOf(t); if (i >= 0) this.active.splice(i, 1); this.done++; const q = CH.clamp(t.time / t.maxTime, 0, 1); this.owner.score += 0.5 + 0.5 * q; A.sfx('ding'); this.owner.addCombo(); this.owner.particles.text(W / 2, 60, 'ORDER #' + t.num + ' UP!', '#8bd06a'); }
    finished() { return this.spawned >= this.total && this.active.length === 0; }
    progress() { return (this.done + this.failed) / this.total; }
    result() { return this.total ? (this.owner.score / this.total) : 0; }
  }
  CH.TicketQueue = TicketQueue;

  // ---------------------------------------------------------------- GRILL -------
  class GrillScene extends CH.MinigameScene {
    constructor(opts = {}) {
      super({ title: 'GRILL', hint: 'Drag patties onto the grill. Click to flip. Drag to plates before they burn!', difficulty: opts.difficulty || 1 });
      const d = this.difficulty;
      this.cookTime = has('grill3') ? 5 : has('grill2') ? 6.5 : 8; this.burnAt = has('longburn') ? 1.75 : 1.35; this.autoflip = has('autoflip');
      this.slots = []; const cols = 3, rows = 2;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) this.slots.push({ x: 110 + c * 46, y: 84 + r * 34, patty: null });
      this.plates = []; for (let i = 0; i < 3; i++) this.plates.push({ x: 350 + (i % 2) * 60, y: 90 + Math.floor(i / 2) * 50, ticket: null, patties: [] });
      this.plates.push({ x: 410, y: 140, ticket: null, patties: [] });
      this.ds = new CH.DragSystem(this);
      this.q = new TicketQueue(this, 6 + Math.round(d * 2), Math.max(4, 9 - d), Math.max(18, 30 - d * 2), (i) => ({ patties: 1 + (Math.random() < 0.3 + d * 0.1 ? 1 : 0) + (Math.random() < d * 0.08 ? 1 : 0), got: 0 }));
      this.q.maxActive = 4;
      this.tray = { x: 40, y: 120 }; this.trayStack = 8;
      this.trash = { x: 440, y: 230, w: 60, h: 40 };
      this.patties = [];
      this.sizzleT = 0;
    }
    progress() { return this.q.progress(); }
    makePatty(x, y) { const p = { x, y, cook: 0, flipped: false, burnt: false, onGrill: null, w: 24, h: 12, kind: 'patty', draw: (g, gx, gy, it) => { F.patty(g, gx, gy, it.cook); if (it.burnt) { for (let i = 0; i < 2; i++) gfx.px(gx - 4 + i * 8, gy - 10 - Math.round(((this.t * 2 + i * 0.4) % 1) * 8), 'rgba(60,60,60,0.8)'); } if (it.onGrill && !it.burnt) { const p = CH.clamp(it.cook / 1, 0, 1.3); gfx.rect(gx - 12, gy - 12, 24, 3, '#222'); gfx.rect(gx - 12, gy - 12, Math.round(24 * Math.min(1, p)), 3, it.cook < 0.45 ? '#e07080' : it.cook < 1 ? '#f5c33b' : it.cook < this.burnAt ? '#4f9d3a' : '#c8352b'); if (!it.flipped && it.cook >= 0.45 && it.cook < 1) gfx.text('FLIP!', gx, gy - 22, Math.sin(this.t * 10) > 0 ? '#fff' : '#f5c33b', { align: 'center', font: 'small', outline: '#000' }); if (it.flipped && it.cook >= 1 && it.cook < this.burnAt) gfx.text('DONE', gx, gy - 22, '#8bd06a', { align: 'center', font: 'small', outline: '#000' }); } }, onGrab: (it) => { if (it.onGrill) { it.onGrill.patty = null; it.onGrill = null; } } }; this.ds.add(p); this.patties.push(p); return p; }
    step(dt) {
      this.q.update(dt);
      // assign tickets to free plates
      for (const t of this.q.active) if (!this.plates.some((p) => p.ticket === t)) { const free = this.plates.find((p) => !p.ticket); if (free) { free.ticket = t; free.patties = []; } }
      // tray click: spawn a patty and start dragging
      const trayR = { x: this.tray.x - 22, y: this.tray.y - 40, w: 44, h: 60 };
      if (inp.mouseIn(trayR)) ui.cursor = 'hand';
      if (inp.mpressed && inp.mouseIn(trayR) && !this.ds.held) { const p = this.makePatty(inp.mx, inp.my); this.ds.held = p; this.ds.offX = 0; this.ds.offY = 0; p.grabbed = true; A.sfx('pop'); inp.eat(); }
      this.ds.update(dt);
      // drop handling
      if (!this.ds.held && this.lastHeld) {
        const p = this.lastHeld;
        // where did it land?
        let slot = this.slots.find((s) => !s.patty && CH.dist(p.x, p.y, s.x, s.y) < 20);
        const plate = this.plates.find((pl) => CH.dist(p.x, p.y, pl.x, pl.y) < 26);
        if (slot && !p.burnt) { slot.patty = p; p.onGrill = slot; p.x = slot.x; p.y = slot.y; A.sfx('sizzle'); this.particles.burst(p.x, p.y, 8, { color: ['#fff', '#f5c33b'], speed: 40, life: 0.4, grav: -50 }); }
        else if (plate && plate.ticket) {
          if (p.burnt || p.cook < 0.95) { A.sfx('error'); this.mistakes++; this.particles.text(plate.x, plate.y - 30, p.burnt ? 'BURNT!' : 'RAW!', '#ff6060'); this.ds.remove(p); this.patties.splice(this.patties.indexOf(p), 1); plate.ticket.time -= 4; }
          else { this.ds.remove(p); this.patties.splice(this.patties.indexOf(p), 1); plate.patties.push({ q: p.flipped ? 1 : 0.6 }); plate.ticket.got++; A.sfx('snap'); if (plate.ticket.got >= plate.ticket.patties) { const q = plate.patties.reduce((a, b) => a + b.q, 0) / plate.patties.length; plate.ticket.time *= q; this.q.complete(plate.ticket); S.stats.burgers++; plate.ticket = null; plate.patties = []; } }
        }
        else if (CH.pointIn(p.x, p.y, this.trash)) { this.ds.remove(p); this.patties.splice(this.patties.indexOf(p), 1); A.sfx('trash'); if (!p.burnt) this.mistakes++; }
        else if (p.onGrill === null) { // dropped on floor/counter: return to tray (lose it)
          this.ds.remove(p); this.patties.splice(this.patties.indexOf(p), 1); A.sfx('back');
        }
        this.lastHeld = null;
      }
      if (this.ds.held) this.lastHeld = this.ds.held;
      // flip by click (not drag): detect quick press+release without movement
      if (inp.mpressed) { this.pressAt = [inp.mx, inp.my, this.t]; }
      if (inp.mreleased && this.pressAt && this.t - this.pressAt[2] < 0.25 && CH.dist(this.pressAt[0], this.pressAt[1], inp.mx, inp.my) < 4) {
        for (const p of this.patties) if (p.onGrill && CH.dist(inp.mx, inp.my, p.x, p.y) < 14) { if (!p.flipped && p.cook >= 0.3) { p.flipped = true; p.squash = 1; A.sfx('flip'); this.particles.burst(p.x, p.y - 4, 10, { color: ['#f5c33b', '#fff', '#e8752c'], speed: 60, life: 0.4, grav: 300 }); if (p.cook > 0.9) { this.particles.text(p.x, p.y - 30, 'LATE FLIP', '#f5c33b'); } else this.addCombo(); } else if (p.flipped) { this.particles.text(p.x, p.y - 30, 'already flipped', '#ccc'); } else { this.particles.text(p.x, p.y - 30, 'too soon!', '#ff8080'); } }
      }
      // cooking
      this.sizzleT -= dt; if (this.sizzleT <= 0) { this.sizzleT = 0.5; if (this.patties.some((p) => p.onGrill)) A.sfx('sizzle'); }
      for (const p of this.patties) {
        if (p.onGrill && !p.grabbed) {
          p.cook += dt / this.cookTime * (p.flipped ? 1 : 0.85);
          if (this.autoflip && !p.flipped && p.cook >= 0.5) { p.flipped = true; p.squash = 1; A.sfx('flip'); }
          if (Math.random() < 0.15) this.particles.add({ x: p.x + CH.rand(-10, 10), y: p.y - 3, vx: CH.rand(-10, 10), vy: CH.rand(-30, -15), life: 0.6, color: 'rgba(255,255,255,0.5)', grav: -10, shape: 'circle', size: 1, grow: 2 });
          if (Math.random() < 0.05) this.particles.add({ x: p.x + CH.rand(-10, 10), y: p.y, vx: CH.rand(-40, 40), vy: CH.rand(-80, -40), life: 0.4, color: '#f5c33b', grav: 300, shape: 'spark' });
          if (p.cook > this.burnAt && !p.burnt) { p.burnt = true; A.sfx('burn'); this.particles.text(p.x, p.y - 30, 'BURNT!', '#ff6060'); this.mistakes++; }
        }
      }
      if (this.q.finished() && !this.finished) this.finish(CH.clamp(this.q.result() - this.mistakes * 0.04, 0, 1));
    }
    draw(g) {
      CH.drawKitchenBackdrop(g, this.t, { steam: true });
      // grill body
      gfx.rect(80, 56, 170, 100, '#3a3a44'); gfx.rect(84, 60, 162, 92, '#222'); for (let y = 66; y < 150; y += 6) gfx.hline(86, y, 158, '#444'); for (let x = 92; x < 246; x += 20) gfx.vline(x, 62, 88, '#555');
      g.globalAlpha = 0.15 + Math.sin(this.t * 6) * 0.05; gfx.rect(84, 60, 162, 92, '#ff6030'); g.globalAlpha = 1;
      gfx.rect(80, 156, 170, 6, '#5a5a66'); for (let i = 0; i < 4; i++) { gfx.circle(100 + i * 44, 168, 4, '#c8352b'); gfx.rect(99 + i * 44, 164, 2, 3, '#f5c33b'); }
      gfx.text('GRILL', 165, 48, '#fff', { align: 'center', font: 'small' });
      // slots hint
      for (const s of this.slots) if (!s.patty) gfx.ellipseOutline(s.x, s.y, 12, 5, this.ds.held ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)');
      // patty tray
      gfx.rect(16, 80, 48, 90, '#8a8a94'); gfx.rect(20, 84, 40, 82, '#c8dce8'); for (let i = 0; i < 6; i++) F.patty(g, 40, 160 - i * 6, 0); gfx.text('RAW', 40, 72, '#fff', { align: 'center', font: 'small' });
      // plates (pass)
      gfx.rect(310, 56, 160, 110, '#5a5a66'); gfx.rect(314, 60, 152, 102, '#8a8a94'); gfx.text('PASS', 390, 48, '#fff', { align: 'center', font: 'small' });
      for (const pl of this.plates) {
        gfx.ellipse(pl.x, pl.y + 6, 24, 9, '#e8e8f0'); gfx.ellipse(pl.x, pl.y + 5, 20, 7, '#fff');
        if (pl.ticket) { const t = pl.ticket; CH.drawTicket(g, pl.x - 24, pl.y - 34, [`${t.patties}x patty (${t.got}/${t.patties})`], { num: t.num, timer: t.time / t.maxTime, w: 50 }); for (let i = 0; i < pl.patties.length; i++) F.patty(g, pl.x - 6 + i * 6, pl.y + 2 - i * 2, 1); }
        else gfx.text('-', pl.x, pl.y, '#555', { align: 'center', font: 'small' });
      }
      // trash
      gfx.rect(this.trash.x, this.trash.y, this.trash.w, this.trash.h, '#5a7a94'); gfx.rect(this.trash.x - 2, this.trash.y - 4, this.trash.w + 4, 6, '#42566b'); gfx.text('BURNT BIN', this.trash.x + 30, this.trash.y + 14, '#fff', { align: 'center', font: 'small' });
      // spatula
      gfx.rect(270, 150, 3, 40, '#c8a060'); gfx.rect(262, 140, 20, 12, '#aab');
      this.ds.draw(g);
      this.particles.draw(g);
      // orders summary
      gfx.text(`Orders: ${this.q.done}/${this.q.total}  Failed: ${this.q.failed}`, 6, H - 10, '#fff', { font: 'small', outline: '#000' });
      if (this.ds.held) this.drawPaw(g, true);
      this.drawHud(g);
    }
  }
  CH.GrillScene = GrillScene;

  // ---------------------------------------------------------------- ASSEMBLY -----
  const INGREDIENTS = ['bunBottom', 'patty', 'cheese', 'lettuce', 'tomato', 'pickle', 'onion', 'bacon', 'ketchup', 'mustard', 'bunTop'];
  const ING_LABEL = { bunBottom: 'bottom bun', patty: 'patty', cheese: 'cheese', lettuce: 'lettuce', tomato: 'tomato', pickle: 'pickles', onion: 'onion', bacon: 'bacon', ketchup: 'ketchup', mustard: 'mustard', bunTop: 'top bun' };
  const BURGERS = {
    'Big Don': ['bunBottom', 'patty', 'cheese', 'pickle', 'onion', 'ketchup', 'bunTop'],
    'Double Don': ['bunBottom', 'patty', 'cheese', 'patty', 'cheese', 'ketchup', 'bunTop'],
    'Garden Don': ['bunBottom', 'patty', 'lettuce', 'tomato', 'onion', 'mustard', 'bunTop'],
    'Bacon Don': ['bunBottom', 'patty', 'bacon', 'cheese', 'ketchup', 'bunTop'],
    'Plain Don': ['bunBottom', 'patty', 'bunTop'],
    'Kevin Special': ['bunBottom', 'patty', 'pickle', 'pickle', 'pickle', 'mustard', 'bunTop'],
    'Triple Trouble': ['bunBottom', 'patty', 'cheese', 'patty', 'cheese', 'patty', 'bacon', 'ketchup', 'bunTop'],
    'The Moose': ['bunBottom', 'patty', 'patty', 'bacon', 'bacon', 'cheese', 'lettuce', 'tomato', 'onion', 'ketchup', 'mustard', 'bunTop'],
  };
  CH.BURGERS = BURGERS;
  class AssemblyScene extends CH.MinigameScene {
    constructor(opts = {}) {
      super({ title: 'BURGER ASSEMBLY', hint: 'Build the burger in ticket order. Hold sauce bottles to squirt. Wrap it, then send it!', difficulty: opts.difficulty || 1 });
      const d = this.difficulty;
      this.ds = new CH.DragSystem(this);
      this.snap = has('snap2') ? 18 : 10;
      this.stack = []; this.stackX = 240; this.stackY = 200; this.wrapped = false;
      const names = Object.keys(BURGERS);
      const pool = d < 1.5 ? names.slice(0, 5) : d < 2.5 ? names.slice(0, 7) : names;
      this.q = new TicketQueue(this, 5 + Math.round(d * 2), 1, Math.max(20, 40 - d * 3), (i) => { const n = CH.pick(pool); return { name: n, layers: BURGERS[n].slice() }; });
      this.q.maxActive = has('predict') ? 2 : 1;
      // bins along the top
      this.bins = INGREDIENTS.map((k, i) => ({ kind: k, x: 26 + i * 42, y: 74 }));
      this.holdT = 0; this.holdKind = null;
      this.wrapperHome = { x: 430, y: 200 };
    }
    progress() { return this.q.progress(); }
    current() { return this.q.active[0]; }
    step(dt) {
      this.q.update(dt);
      const cur = this.current();
      // grab from bins: spawn item & hold it
      if (!this.ds.held && inp.mpressed) {
        for (const b of this.bins) if (Math.abs(inp.mx - b.x) < 19 && Math.abs(inp.my - b.y) < 22) {
          if (b.kind === 'ketchup' || b.kind === 'mustard') { this.holdKind = b.kind; this.holdT = 0; }
          else { const it = this.ds.add({ kind: b.kind, x: inp.mx, y: inp.my, w: 26, h: 12, draw: (g, x, y, it) => this.drawIng(g, x, y, it.kind) }); this.ds.held = it; this.ds.offX = 0; this.ds.offY = 0; it.grabbed = true; A.sfx('pop'); }
          inp.eat();
        }
        if (Math.abs(inp.mx - this.wrapperHome.x) < 20 && Math.abs(inp.my - this.wrapperHome.y) < 12 && !this.wrapped && this.stack.length) { const it = this.ds.add({ kind: 'wrapper', x: inp.mx, y: inp.my, w: 30, h: 14, draw: (g, x, y) => F.wrapper(g, x, y) }); this.ds.held = it; this.ds.offX = 0; this.ds.offY = 0; it.grabbed = true; A.sfx('paper'); }
      }
      // sauce hold: drag bottle over stack and hold
      if (this.holdKind) {
        if (!inp.mdown) { this.holdKind = null; this.holdT = 0; }
        else {
          const overStack = Math.abs(inp.mx - this.stackX) < 30 && inp.my > this.stackY - 60 && inp.my < this.stackY + 10;
          if (overStack) { this.holdT += dt; if (this.holdT > 0.08 && Math.random() < 0.6) this.particles.add({ x: inp.mx + CH.rand(-3, 3), y: inp.my + 14, vx: CH.rand(-10, 10), vy: 60, life: 0.35, color: this.holdKind === 'ketchup' ? '#d13c3c' : '#f5c33b', grav: 300 }); if (this.t % 0.2 < dt) A.sfx('squirt'); if (this.holdT >= 0.55) { this.place(this.holdKind); this.holdKind = null; this.holdT = 0; } }
        }
      }
      this.ds.update(dt);
      if (!this.ds.held && this.lastHeld) {
        const it = this.lastHeld; this.lastHeld = null;
        const topY = this.stackY - this.stack.length * 4;
        if (it.kind === 'wrapper') { if (Math.abs(it.x - this.stackX) < 26 && Math.abs(it.y - topY) < 30) { this.wrapBurger(); } this.ds.remove(it); }
        else if (it.kind === 'wrapped') {
          if (it.x > 330 && it.y > 90 && it.y < 170) { this.deliver(); this.ds.remove(it); }
          else { it.x = this.stackX; it.y = this.stackY - 6; }
        }
        else { if (Math.abs(it.x - this.stackX) < 20 + this.snap && Math.abs(it.y - topY) < 16 + this.snap) { this.place(it.kind); } else { A.sfx('back'); } this.ds.remove(it); }
      }
      if (this.ds.held) this.lastHeld = this.ds.held;
      if (this.q.finished() && !this.finished) this.finish(CH.clamp(this.q.result() - this.mistakes * 0.03, 0, 1));
    }
    place(kind) {
      const cur = this.current(); if (!cur) { A.sfx('error'); return; }
      const want = cur.layers[this.stack.length];
      if (this.wrapped) { A.sfx('error'); return; }
      if (kind === want) { this.stack.push(kind); A.sfx('snap'); this.particles.burst(this.stackX, this.stackY - this.stack.length * 4, 5, { color: ['#fff', '#f5c33b'], speed: 30, life: 0.3, grav: 0, shape: 'spark' }); this.addCombo(); this.stackSquash = 1; }
      else { this.mistakes++; A.sfx('error'); CH.doShake(2, 0.15); this.particles.text(this.stackX, this.stackY - 60, `wrong! needs ${ING_LABEL[want] || '?'}`, '#ff6060'); cur.time -= 2; }
    }
    wrapBurger() { const cur = this.current(); if (!cur || this.stack.length < cur.layers.length) { A.sfx('error'); this.particles.text(this.stackX, this.stackY - 60, 'not finished!', '#ff6060'); return; } this.wrapped = true; A.sfx('paper'); this.particles.burst(this.stackX, this.stackY - 20, 10, { color: ['#f5c33b', '#fff'], speed: 50, life: 0.4 }); const it = this.ds.add({ kind: 'wrapped', x: this.stackX, y: this.stackY - 6, w: 28, h: 16, draw: (g, x, y) => F.wrapped(g, x, y) }); }
    deliver() { const cur = this.current(); if (cur) { this.q.complete(cur); S.stats.burgers++; } this.stack = []; this.wrapped = false; }
    drawIng(g, x, y, kind) { if (kind === 'ketchup') F.sauce(g, x, y, '#d13c3c'); else if (kind === 'mustard') F.sauce(g, x, y, '#f5c33b'); else if (F[kind]) F[kind](g, x, y, 1); }
    draw(g) {
      CH.drawKitchenBackdrop(g, this.t);
      // bins
      for (const b of this.bins) { gfx.rect(b.x - 19, b.y - 22, 38, 44, '#8a8a94'); gfx.rect(b.x - 16, b.y - 19, 32, 38, '#c8dce8'); const hv = Math.abs(inp.mx - b.x) < 19 && Math.abs(inp.my - b.y) < 22; if (hv) { gfx.frame(b.x - 19, b.y - 22, 38, 44, '#f5c33b'); ui.cursor = 'hand'; } for (let i = 0; i < 3; i++) this.drawIng(g, b.x, b.y + 8 - i * 5, b.kind); if (b.kind === 'ketchup' || b.kind === 'mustard') { gfx.rect(b.x - 5, b.y - 14, 10, 24, b.kind === 'ketchup' ? '#d13c3c' : '#f5c33b'); gfx.rect(b.x - 2, b.y - 18, 4, 5, '#333'); } gfx.text(ING_LABEL[b.kind].split(' ')[0].toUpperCase().slice(0, 6), b.x, b.y + 26, '#333', { align: 'center', font: 'small' }); }
      // ticket(s)
      const cur = this.current();
      if (cur) {
        const lines = cur.layers.map((l, i) => Object.assign(new String((i < this.stack.length ? '✓ ' : (i === this.stack.length ? '▶ ' : '  ')) + ING_LABEL[l]), { done: i < this.stack.length }));
        CH.drawTicket(g, 20, 120, lines, { title: '#' + cur.num + ' ' + cur.name, num: cur.num, timer: cur.time / cur.maxTime, w: 100 });
        if (this.q.active[1]) CH.drawTicket(g, 128, 120, [this.q.active[1].name], { title: 'NEXT', w: 60, color: '#8899aa' });
      }
      // assembly board
      gfx.rect(180, 170, 120, 60, '#c8a060'); gfx.rect(184, 174, 112, 52, '#e0c080'); for (let i = 0; i < 6; i++) gfx.hline(186, 180 + i * 8, 108, '#d0b070');
      // stack
      const sq = this.stackSquash ? Math.sin(this.stackSquash * Math.PI) * 2 : 0; if (this.stackSquash) this.stackSquash = Math.max(0, this.stackSquash - 0.05);
      if (!this.wrapped) this.stack.forEach((k, i) => this.drawIng(g, this.stackX, this.stackY - i * 4 + (i === this.stack.length - 1 ? sq : 0), k));
      if (cur && !this.wrapped && this.stack.length < cur.layers.length) { const ty = this.stackY - this.stack.length * 4; g.globalAlpha = 0.3 + Math.sin(this.t * 6) * 0.15; this.drawIng(g, this.stackX, ty, cur.layers[this.stack.length]); g.globalAlpha = 1; }
      // wrapper supply
      F.wrapper(g, this.wrapperHome.x, this.wrapperHome.y); F.wrapper(g, this.wrapperHome.x + 2, this.wrapperHome.y - 3); gfx.text('WRAP', this.wrapperHome.x, this.wrapperHome.y + 10, '#333', { align: 'center', font: 'small' });
      // pass window
      gfx.rect(330, 90, 130, 80, '#5a5a66'); gfx.rect(334, 94, 122, 72, '#e8e0d0'); gfx.rect(334, 94, 122, 8, '#c8352b'); gfx.text('→ PASS →', 395, 95, '#fff', { align: 'center', font: 'small' }); for (let i = 0; i < 3; i++) gfx.rect(340 + i * 40, 150, 30, 3, '#8a8a94');
      if (this.wrapped) gfx.text('drag to pass!', 395, 130, '#333', { align: 'center', font: 'small' });
      // sauce bottle in hand
      if (this.holdKind) { gfx.rect(inp.mx - 5, inp.my - 10, 10, 24, this.holdKind === 'ketchup' ? '#d13c3c' : '#f5c33b'); gfx.rect(inp.mx - 2, inp.my + 12, 4, 5, '#333'); ui.bar(inp.mx - 10, inp.my - 18, 20, 3, this.holdT / 0.55, '#fff'); ui.cursor = 'grab'; }
      this.ds.draw(g);
      this.particles.draw(g);
      gfx.text(`Orders: ${this.q.done}/${this.q.total}  Failed: ${this.q.failed}`, 6, H - 10, '#fff', { font: 'small', outline: '#000' });
      if (this.ds.held) this.drawPaw(g, true);
      this.drawHud(g);
    }
  }
  CH.AssemblyScene = AssemblyScene;

  // ---------------------------------------------------------------- FRIES & DRINKS -----
  const FLAVORS = { cola: '#3a1a08', orange: '#f0902a', lemon: '#e8e060', rootbeer: '#5a2a10' };
  class FriesScene extends CH.MinigameScene {
    constructor(opts = {}) {
      super({ title: 'FRIES & DRINKS', hint: 'Fry: bin→basket→oil, shake, lift, salt, scoop. Drinks: cup under nozzle, hold to fill, lid it.', difficulty: opts.difficulty || 1 });
      const d = this.difficulty;
      this.ds = new CH.DragSystem(this);
      this.autofill = has('autofill'); this.autolid = has('autolid'); this.fryTime = has('fryer2') ? 5 : 7; this.burnAt = has('longburn') ? 1.7 : 1.4;
      this.baskets = []; const nb = has('basket3') ? 3 : 2;
      for (let i = 0; i < nb; i++) this.baskets.push(this.ds.add({ kind: 'basket', x: 40 + i * 30, y: 190, w: 26, h: 20, state: 'empty', cook: 0, shook: false, draw: (g, x, y, it) => this.drawBasket(g, x, y, it) }));
      this.vats = [{ x: 60, y: 110, basket: null }, { x: 110, y: 110, basket: null }]; if (nb === 3) this.vats.push({ x: 160, y: 110, basket: null });
      this.hotTray = { x: 210, y: 130, amount: 0, salt: 0 };
      this.scoop = this.ds.add({ kind: 'scoop', x: 250, y: 190, w: 22, h: 14, draw: (g, x, y, it) => { gfx.rect(x - 10, y - 4, 16, 8, '#aab'); gfx.rect(x + 6, y - 2, 10, 3, '#c8352b'); if (it.load) for (let i = 0; i < 4; i++) gfx.rect(x - 8 + i * 3, y - 10, 2, 7, '#f5c33b'); } });
      this.boxes = []; this.cups = [];
      this.nozzles = Object.keys(FLAVORS).map((f, i) => ({ flavor: f, x: 320 + i * 36, y: 80 }));
      this.pass = { x: 400, y: 200, w: 70, h: 50 };
      this.q = new TicketQueue(this, 5 + Math.round(d * 2), Math.max(6, 12 - d), Math.max(25, 45 - d * 3), (i) => ({ fries: CH.pick(['S', 'M', 'L']), drink: Math.random() < 0.8 ? { size: CH.pick(['S', 'M', 'L']), flavor: CH.pick(Object.keys(FLAVORS)) } : null, gotFries: false, gotDrink: false }));
      this.q.maxActive = 3;
      this.spill = 0; this.holdFill = null;
    }
    progress() { return this.q.progress(); }
    drawBasket(g, x, y, it) { gfx.rect(x - 12, y - 8, 24, 14, 'rgba(0,0,0,0)'); for (let i = 0; i < 5; i++) gfx.vline(x - 10 + i * 5, y - 6, 12, '#8a8a94'); for (let i = 0; i < 3; i++) gfx.hline(x - 10, y - 6 + i * 5, 20, '#8a8a94'); gfx.rect(x - 12, y - 8, 24, 2, '#aab'); gfx.rect(x - 2, y - 22, 3, 14, '#aab'); gfx.rect(x - 4, y - 24, 8, 3, '#c8352b'); if (it.state !== 'empty') { const c = it.state === 'raw' ? '#f0e8c0' : it.cook > this.burnAt ? '#3a2010' : gfx.mix('#f0e0a0', '#e8a030', Math.min(1, it.cook)); for (let i = 0; i < 6; i++) gfx.rect(x - 9 + i * 3, y - 6 + (i % 2), 2, 8, c); } if (it.inVat) { const p = it.cook; gfx.rect(x - 12, y - 30, 24, 3, '#222'); gfx.rect(x - 12, y - 30, Math.round(24 * Math.min(1, p / 1)), 3, p < 1 ? '#f5c33b' : p < this.burnAt ? '#4f9d3a' : '#c8352b'); if (p > 0.45 && !it.shook && p < 1) gfx.text('SHAKE!', x, y - 40, Math.sin(this.t * 10) > 0 ? '#fff' : '#f5c33b', { align: 'center', font: 'small', outline: '#000' }); if (p >= 1 && p < this.burnAt) gfx.text('LIFT!', x, y - 40, '#8bd06a', { align: 'center', font: 'small', outline: '#000' }); } }
    step(dt) {
      this.q.update(dt);
      // cooking
      for (const b of this.baskets) if (b.inVat && !b.grabbed) { b.cook += dt / this.fryTime; if (Math.random() < 0.3) this.particles.add({ x: b.x + CH.rand(-10, 10), y: b.y - 2, vx: 0, vy: -20, life: 0.4, color: 'rgba(255,255,255,0.6)', grav: -20, shape: 'circle', size: 1 }); if (b.cook > this.burnAt && b.state !== 'burnt') { b.state = 'burnt'; A.sfx('burn'); this.mistakes++; this.particles.text(b.x, b.y - 50, 'BURNT!', '#ff6060'); } }
      // shake detection: mouse wiggle over basket in vat while not dragging
      for (const b of this.baskets) if (b.inVat && !b.shook && b.cook > 0.45 && !this.ds.held) { if (Math.abs(inp.mx - b.x) < 16 && Math.abs(inp.my - b.y) < 20) { this.wiggle = (this.wiggle || 0) + Math.abs(inp.mx - (this.lastMx || inp.mx)); if (inp.mpressed) this.wiggle += 20; if (this.wiggle > 60) { b.shook = true; this.wiggle = 0; A.sfx('paper'); b.squash = 1; this.particles.burst(b.x, b.y - 8, 8, { color: ['#f5c33b', '#fff'], speed: 40, life: 0.3 }); this.addCombo(); } } }
      this.lastMx = inp.mx;
      // cups: spawn from stack
      const cupStack = { x: 300, y: 190, w: 40, h: 40 };
      if (inp.mouseIn(cupStack)) ui.cursor = 'hand';
      if (inp.mpressed && inp.mouseIn(cupStack) && !this.ds.held) { const sz = this.pickNeededSize('drink'); const c = this.ds.add({ kind: 'cup', x: inp.mx, y: inp.my, w: 14, h: 20, size: sz, fill: 0, flavor: null, lid: false, draw: (g, x, y, it) => F.cup(g, x, y + 8, it.fill, it.size, it.flavor ? FLAVORS[it.flavor] : '#000', it.lid) }); this.cups.push(c); this.ds.held = c; c.grabbed = true; this.ds.offX = 0; this.ds.offY = 0; A.sfx('pop'); inp.eat(); }
      // boxes: spawn from stack
      const boxStack = { x: 250, y: 220, w: 40, h: 36 };
      if (inp.mouseIn(boxStack)) ui.cursor = 'hand';
      if (inp.mpressed && inp.mouseIn(boxStack) && !this.ds.held) { const sz = this.pickNeededSize('fries'); const bx = this.ds.add({ kind: 'box', x: inp.mx, y: inp.my, w: 16, h: 22, size: sz, fill: 0, draw: (g, x, y, it) => F.friesBox(g, x, y + 8, it.fill, it.size) }); this.boxes.push(bx); this.ds.held = bx; bx.grabbed = true; this.ds.offX = 0; this.ds.offY = 0; A.sfx('pop'); inp.eat(); }
      // lids
      const lidStack = { x: 440, y: 120, w: 30, h: 30 };
      if (inp.mouseIn(lidStack)) ui.cursor = 'hand';
      if (inp.mpressed && inp.mouseIn(lidStack) && !this.ds.held) { const l = this.ds.add({ kind: 'lid', x: inp.mx, y: inp.my, w: 16, h: 6, draw: (g, x, y) => { gfx.ellipse(x, y, 8, 3, '#e8e8f0'); gfx.rect(x - 1, y - 6, 2, 6, '#c8352b'); } }); this.ds.held = l; l.grabbed = true; this.ds.offX = 0; this.ds.offY = 0; A.sfx('pop'); inp.eat(); }
      // salt shaker click over tray
      const saltR = { x: 176, y: 90, w: 20, h: 30 };
      if (inp.mouseIn(saltR)) ui.cursor = 'hand';
      if (inp.clicked(saltR) && !this.ds.held) { if (this.hotTray.amount > 0) { this.hotTray.salt++; A.sfx('paper'); this.particles.burst(this.hotTray.x, this.hotTray.y - 10, 12, { color: ['#fff'], speed: 30, life: 0.5, grav: 200 }); if (this.hotTray.salt > 2) { this.particles.text(this.hotTray.x, this.hotTray.y - 30, 'TOO SALTY', '#ff8080'); this.mistakes++; } } }
      // hold-to-fill drinks under nozzle
      if (this.ds.held && this.ds.held.kind === 'cup') {
        const c = this.ds.held; const nz = this.nozzles.find((n) => Math.abs(c.x - n.x) < 12 && Math.abs(c.y - (n.y + 30)) < 16);
        if (nz && !c.lid) {
          c.flavor = c.flavor || nz.flavor; if (c.flavor !== nz.flavor) { c.flavor = 'mixed'; }
          const rate = 0.35; if (this.autofill && c.fill >= 0.92) { /* stop */ } else { c.fill += dt * rate; if (this.t % 0.15 < dt) A.sfx('fill'); }
          if (c.fill > 1.02) { c.fill = 0.5; this.spill = 1; this.mistakes++; A.sfx('splash'); this.particles.burst(c.x, c.y + 10, 12, { color: [FLAVORS[nz.flavor] || '#000', '#fff'], speed: 50, life: 0.5 }); this.particles.text(c.x, c.y - 30, 'OVERFLOW!', '#ff6060'); }
        }
      }
      this.ds.update(dt);
      if (this.spill > 0) this.spill -= dt * 0.5;
      // drops
      if (!this.ds.held && this.lastHeld) { this.handleDrop(this.lastHeld); this.lastHeld = null; }
      if (this.ds.held) this.lastHeld = this.ds.held;
      if (this.q.finished() && !this.finished) this.finish(CH.clamp(this.q.result() - this.mistakes * 0.03, 0, 1));
    }
    pickNeededSize(kind) { for (const t of this.q.active) { if (kind === 'fries' && !t.gotFries && !this.boxes.some((b) => b.size === t.fries && !b.delivered)) return t.fries; if (kind === 'drink' && t.drink && !t.gotDrink && !this.cups.some((c) => c.size === t.drink.size && !c.delivered)) return t.drink.size; } return 'M'; }
    handleDrop(it) {
      if (it.kind === 'basket') {
        const rawBin = { x: 20, y: 40, w: 60, h: 40 };
        if (CH.pointIn(it.x, it.y, rawBin) && it.state === 'empty') { it.state = 'raw'; A.sfx('paper'); it.x = it.home.x; it.y = it.home.y; it.returning = true; return; }
        const vat = this.vats.find((v) => CH.dist(it.x, it.y, v.x, v.y) < 22 && (!v.basket || v.basket === it));
        if (vat && it.state === 'raw') { vat.basket = it; it.inVat = true; it.x = vat.x; it.y = vat.y; it.cook = 0; it.shook = false; it.state = 'cooking'; A.sfx('sizzle'); this.particles.burst(it.x, it.y, 10, { color: ['#f5c33b', '#fff'], speed: 60, life: 0.5 }); return; }
        if (vat && it.inVat) { it.x = vat.x; it.y = vat.y; return; }
        const tray = this.hotTray;
        if (Math.abs(it.x - tray.x) < 34 && Math.abs(it.y - tray.y) < 30 && (it.state === 'cooking' || it.state === 'burnt')) {
          if (it.state === 'burnt') { A.sfx('trash'); this.particles.text(tray.x, tray.y - 30, 'trashed burnt fries', '#ff8080'); }
          else if (it.cook < 0.9) { A.sfx('error'); this.mistakes++; this.particles.text(tray.x, tray.y - 30, 'UNDERCOOKED', '#ff8080'); }
          else { tray.amount = Math.min(3, tray.amount + (it.shook ? 1 : 0.7)); tray.salt = 0; A.sfx('snap'); this.particles.burst(tray.x, tray.y - 10, 14, { color: ['#f5c33b', '#e8a030'], speed: 50, life: 0.5 }); this.addCombo(); }
          for (const v of this.vats) if (v.basket === it) v.basket = null;
          it.inVat = false; it.state = 'empty'; it.cook = 0; it.returning = true; return;
        }
        for (const v of this.vats) if (v.basket === it && !it.inVat) v.basket = null;
        if (!it.inVat) it.returning = true;
        return;
      }
      if (it.kind === 'scoop') {
        const tray = this.hotTray;
        if (!it.load && Math.abs(it.x - tray.x) < 34 && Math.abs(it.y - tray.y) < 30 && tray.amount > 0) { if (tray.salt === 0) { this.particles.text(tray.x, tray.y - 30, 'salt first!', '#f5c33b'); } it.load = true; tray.amount -= 0.34; if (tray.amount < 0.01) tray.amount = 0; A.sfx('paper'); it.returning = false; return; }
        const box = this.boxes.find((b) => !b.delivered && CH.dist(it.x, it.y, b.x, b.y) < 18);
        if (it.load && box) { const need = box.size === 'S' ? 1 : box.size === 'M' ? 2 : 3; box.fill = Math.min(1.2, box.fill + 1 / need); it.load = false; A.sfx('snap'); if (box.fill > 1.05) { this.particles.burst(box.x, box.y, 8, { color: ['#f5c33b'], speed: 40, life: 0.5, grav: 300 }); this.particles.text(box.x, box.y - 30, 'overfilled', '#f5c33b'); box.fill = 1; } else this.addCombo(); it.returning = true; return; }
        it.returning = true; return;
      }
      if (it.kind === 'box') { if (CH.pointIn(it.x, it.y, this.pass)) { this.deliverItem(it, 'fries'); } return; }
      if (it.kind === 'cup') { if (CH.pointIn(it.x, it.y, this.pass)) { this.deliverItem(it, 'drink'); } return; }
      if (it.kind === 'lid') { const cup = this.cups.find((c) => !c.delivered && !c.lid && CH.dist(it.x, it.y, c.x, c.y - 8) < 14); if (cup) { cup.lid = true; A.sfx('snap'); this.addCombo(); } else A.sfx('back'); this.ds.remove(it); return; }
    }
    deliverItem(it, kind) {
      const t = this.q.active.find((t) => kind === 'fries' ? (!t.gotFries && t.fries === it.size) : (t.drink && !t.gotDrink && t.drink.size === it.size));
      if (!t) { A.sfx('error'); this.particles.text(it.x, it.y - 30, 'nobody ordered that', '#ff8080'); this.mistakes++; it.returning = true; return; }
      let ok = true;
      if (kind === 'fries') { if (it.fill < 0.9) { ok = false; this.particles.text(it.x, it.y - 30, 'not full!', '#ff8080'); } else t.gotFries = true; }
      else { if (it.fill < 0.8) { ok = false; this.particles.text(it.x, it.y - 30, 'not full!', '#ff8080'); } else if (!it.lid && !this.autolid) { ok = false; this.particles.text(it.x, it.y - 30, 'needs a lid!', '#ff8080'); } else if (it.flavor !== t.drink.flavor) { this.mistakes++; this.particles.text(it.x, it.y - 30, 'wrong flavour...', '#f5c33b'); t.gotDrink = true; t.time -= 5; } else t.gotDrink = true; }
      if (!ok) { A.sfx('error'); it.returning = true; return; }
      it.delivered = true; this.ds.remove(it); A.sfx('snap');
      if (t.gotFries && (!t.drink || t.gotDrink)) this.q.complete(t);
    }
    draw(g) {
      CH.drawKitchenBackdrop(g, this.t, { steam: true });
      // raw fries bin
      gfx.rect(20, 40, 60, 40, '#5a5a66'); gfx.rect(24, 44, 52, 32, '#c8dce8'); for (let i = 0; i < 12; i++) gfx.rect(28 + (i % 6) * 8, 50 + Math.floor(i / 6) * 10 + (i % 3), 2, 10, '#f0e8c0'); gfx.text('FROZEN FRIES', 50, 32, '#fff', { align: 'center', font: 'small' });
      // fryer
      gfx.rect(30, 86, this.vats.length * 50 + 10, 60, '#8a8a94'); for (const v of this.vats) { gfx.rect(v.x - 22, v.y - 20, 44, 44, '#5a5a66'); gfx.rect(v.x - 20, v.y - 16, 40, 38, '#e8c040'); for (let i = 0; i < 5; i++) gfx.px(v.x - 16 + i * 8, v.y - 10 + Math.round(Math.sin(this.t * 6 + i * 1.3) * 3), '#fff8c0'); if (!v.basket) gfx.text('OIL', v.x, v.y + 4, 'rgba(0,0,0,0.3)', { align: 'center', font: 'small' }); }
      gfx.text('FRYER', 30 + (this.vats.length * 50) / 2, 150, '#fff', { align: 'center', font: 'small' });
      // hot tray
      const tr = this.hotTray; gfx.rect(tr.x - 34, tr.y - 20, 68, 40, '#8a8a94'); gfx.rect(tr.x - 30, tr.y - 16, 60, 32, '#c8352b'); gfx.rect(tr.x - 30, tr.y - 24, 60, 4, '#f5c33b'); g.globalAlpha = 0.3; gfx.rect(tr.x - 30, tr.y - 16, 60, 32, '#ffe080'); g.globalAlpha = 1;
      if (tr.amount > 0) { const n = Math.round(tr.amount * 12); for (let i = 0; i < n; i++) gfx.rect(tr.x - 24 + (i % 8) * 6, tr.y - 4 - Math.floor(i / 8) * 4 + (i % 2), 2, 10, i % 2 ? '#f5c33b' : '#e8a030'); if (tr.salt > 0) for (let i = 0; i < 6; i++) gfx.px(tr.x - 20 + i * 7, tr.y - 8 + (i % 3), '#fff'); }
      gfx.text('HOT TRAY', tr.x, tr.y + 22, '#fff', { align: 'center', font: 'small' });
      // salt shaker
      gfx.rect(178, 96, 16, 24, '#fff'); gfx.rect(178, 92, 16, 5, '#8a8a94'); gfx.text('SALT', 186, 104, '#333', { align: 'center', font: 'small' });
      // fry box stack & cup stack & lids
      gfx.rect(250, 220, 40, 36, '#8a8a94'); F.friesBox(g, 270, 250, 0, 'L'); F.friesBox(g, 262, 246, 0, 'M'); gfx.text('BOXES', 270, 214, '#fff', { align: 'center', font: 'small' });
      gfx.rect(300, 190, 40, 40, '#8a8a94'); F.cup(g, 312, 226, 0, 'L'); F.cup(g, 326, 224, 0, 'M'); gfx.text('CUPS', 320, 182, '#fff', { align: 'center', font: 'small' });
      gfx.rect(440, 120, 30, 30, '#8a8a94'); for (let i = 0; i < 4; i++) gfx.ellipse(455, 142 - i * 3, 9, 3, '#e8e8f0'); gfx.text('LIDS', 455, 112, '#fff', { align: 'center', font: 'small' });
      // drink machine
      gfx.rect(300, 40, 156, 70, '#c8352b'); gfx.rect(304, 44, 148, 30, '#8a1d1d'); gfx.text("DONALD'S FOUNTAIN", 378, 46, '#f5c33b', { align: 'center', font: 'small' });
      for (const n of this.nozzles) { gfx.rect(n.x - 12, n.y - 20, 24, 20, '#5a5a66'); gfx.rect(n.x - 10, n.y - 18, 20, 12, FLAVORS[n.flavor]); gfx.text(n.flavor.toUpperCase().slice(0, 5), n.x, n.y - 14, '#fff', { align: 'center', font: 'small' }); gfx.rect(n.x - 3, n.y, 6, 8, '#333'); gfx.rect(n.x - 1, n.y + 8, 2, 4, '#555'); const held = this.ds.held; if (held && held.kind === 'cup' && Math.abs(held.x - n.x) < 12 && Math.abs(held.y - (n.y + 30)) < 16) { for (let i = 0; i < 3; i++) gfx.rect(n.x - 1, n.y + 12 + i * 6, 2, 4, FLAVORS[n.flavor]); } }
      gfx.rect(300, 110, 156, 8, '#8a8a94'); gfx.rect(300, 118, 156, 2, '#5a5a66'); // drip tray
      gfx.text('fill to the line ▬', 378, 125, '#333', { align: 'center', font: 'small' });
      // pass
      gfx.rect(this.pass.x, this.pass.y, this.pass.w, this.pass.h, '#5a5a66'); gfx.rect(this.pass.x + 4, this.pass.y + 4, this.pass.w - 8, this.pass.h - 8, '#e8e0d0'); gfx.text('→ PASS', this.pass.x + this.pass.w / 2, this.pass.y + 20, '#c8352b', { align: 'center', font: 'small' });
      // tickets
      this.q.active.forEach((t, i) => { const lines = [Object.assign(new String((t.gotFries ? '✓ ' : '□ ') + t.fries + ' fries'), { done: t.gotFries })]; if (t.drink) lines.push(Object.assign(new String((t.gotDrink ? '✓ ' : '□ ') + t.drink.size + ' ' + t.drink.flavor), { done: t.gotDrink })); CH.drawTicket(g, 6 + i * 70, 158, lines, { num: t.num, timer: t.time / t.maxTime, w: 66 }); });
      if (this.spill > 0) { g.globalAlpha = Math.min(1, this.spill); gfx.ellipse(378, 116, 40, 4, '#3a1a08'); g.globalAlpha = 1; }
      this.ds.draw(g);
      this.particles.draw(g);
      gfx.text(`Orders: ${this.q.done}/${this.q.total}  Failed: ${this.q.failed}`, 6, H - 10, '#fff', { font: 'small', outline: '#000' });
      if (this.ds.held) this.drawPaw(g, true);
      this.drawHud(g);
    }
  }
  CH.FriesScene = FriesScene;

  // ---------------------------------------------------------------- BAGGING ------
  const ITEM_KINDS = ['burger', 'fries', 'drink', 'nuggets', 'pie'];
  class BaggingScene extends CH.MinigameScene {
    constructor(opts = {}) {
      super({ title: 'BAGGING', hint: 'Drag items from the pass into the right bag. Drinks go in the carrier. Fold, then send!', difficulty: opts.difficulty || 1 });
      const d = this.difficulty;
      this.ds = new CH.DragSystem(this);
      this.bagCap = has('bag2') ? 6 : 4;
      this.q = new TicketQueue(this, 5 + Math.round(d * 2), Math.max(5, 10 - d), Math.max(25, 40 - d * 3), (i) => { const n = 2 + Math.floor(Math.random() * (2 + d)); const items = []; for (let k = 0; k < n; k++) items.push(CH.pick(ITEM_KINDS)); return { items, got: items.map(() => false), folded: 0, drinks: items.filter((x) => x === 'drink').length }; });
      this.q.maxActive = 3;
      this.bags = [{ x: 90, y: 230, ticket: null }, { x: 240, y: 230, ticket: null }, { x: 390, y: 230, ticket: null }];
      this.conveyor = []; this.spawnT = 1; this.chute = { x: 400, y: 60, w: 70, h: 60 };
    }
    progress() { return this.q.progress(); }
    step(dt) {
      this.q.update(dt);
      for (const t of this.q.active) if (!this.bags.some((b) => b.ticket === t)) { const free = this.bags.find((b) => !b.ticket); if (free) { free.ticket = t; free.items = 0; } }
      // conveyor spawns items needed by active tickets (plus decoys)
      this.spawnT -= dt;
      if (this.spawnT <= 0 && this.conveyor.length < 7) {
        this.spawnT = 1.6;
        const needed = []; for (const t of this.q.active) t.items.forEach((k, i) => { if (!t.got[i] && !this.conveyor.some((c) => c.kind === k && !c.grabbed)) needed.push(k); });
        const kind = needed.length && Math.random() < 0.85 ? CH.pick(needed) : CH.pick(ITEM_KINDS);
        const it = this.ds.add({ kind, x: -20, y: 110, w: 26, h: 22, onBelt: true, draw: (g, x, y, it) => this.drawItem(g, x, y, it.kind) });
        this.conveyor.push(it);
      }
      for (const c of this.conveyor) if (c.onBelt && !c.grabbed) { c.x += dt * 22; if (c.x > 330) { c.x = 330; } }
      this.ds.update(dt);
      if (!this.ds.held && this.lastHeld) { this.handleDrop(this.lastHeld); this.lastHeld = null; }
      if (this.ds.held) { this.lastHeld = this.ds.held; this.ds.held.onBelt = false; }
      // fold clicks
      if (inp.mpressed && !this.ds.held) for (const b of this.bags) { if (b.ticket && CH.dist(inp.mx, inp.my, b.x, b.y - 12) < 20) { const t = b.ticket; if (t.got.every(Boolean)) { t.folded++; A.sfx('paper'); b.squash = 1; if (t.folded >= 2) { this.particles.text(b.x, b.y - 40, 'drag to chute!', '#8bd06a'); } } else { this.particles.text(b.x, b.y - 40, 'not complete', '#ff8080'); } } }
      // drag folded bag to chute
      if (inp.mpressed && !this.ds.held) for (const b of this.bags) if (b.ticket && b.ticket.folded >= 2 && CH.dist(inp.mx, inp.my, b.x, b.y - 12) < 22) { b.dragging = true; }
      for (const b of this.bags) { if (b.dragging) { b.dx = inp.mx; b.dy = inp.my; if (!inp.mdown) { b.dragging = false; if (CH.pointIn(inp.mx, inp.my, this.chute)) { this.q.complete(b.ticket); S.stats.customersServed++; b.ticket = null; } } } }
      if (this.q.finished() && !this.finished) this.finish(CH.clamp(this.q.result() - this.mistakes * 0.04, 0, 1));
    }
    handleDrop(it) {
      const bag = this.bags.find((b) => b.ticket && Math.abs(it.x - b.x) < 24 && it.y > b.y - 50 && it.y < b.y + 10);
      if (bag) { const t = bag.ticket; const idx = t.items.findIndex((k, i) => k === it.kind && !t.got[i]); if (idx >= 0 && it.kind !== 'drink') { t.got[idx] = true; this.ds.remove(it); this.conveyor.splice(this.conveyor.indexOf(it), 1); A.sfx('snap'); bag.squash = 1; this.addCombo(); return; } if (it.kind === 'drink') { this.particles.text(bag.x, bag.y - 40, 'drinks go in the carrier!', '#f5c33b'); } else { this.particles.text(bag.x, bag.y - 40, 'not in this order', '#ff8080'); this.mistakes++; A.sfx('error'); } it.onBelt = true; it.y = 110; return; }
      const carrier = this.bags.find((b) => b.ticket && Math.abs(it.x - (b.x + 40)) < 16 && it.y > b.y - 40 && it.y < b.y + 10);
      if (carrier && it.kind === 'drink') { const t = carrier.ticket; const idx = t.items.findIndex((k, i) => k === 'drink' && !t.got[i]); if (idx >= 0) { t.got[idx] = true; this.ds.remove(it); this.conveyor.splice(this.conveyor.indexOf(it), 1); A.sfx('snap'); this.addCombo(); return; } }
      const trash = { x: 440, y: 150, w: 40, h: 40 };
      if (CH.pointIn(it.x, it.y, trash)) { this.ds.remove(it); this.conveyor.splice(this.conveyor.indexOf(it), 1); A.sfx('trash'); return; }
      it.onBelt = true; it.y = 110; A.sfx('back');
    }
    drawItem(g, x, y, kind) { if (kind === 'burger') F.wrapped(g, x, y); else if (kind === 'fries') F.friesBox(g, x, y + 8, 1, 'M'); else if (kind === 'drink') F.cup(g, x, y + 8, 0.9, 'M', '#3a1a08', true); else if (kind === 'nuggets') { gfx.rect(x - 10, y - 6, 20, 12, '#c8352b'); gfx.rect(x - 9, y - 8, 18, 3, '#e04a3e'); F.nugget(g, x - 3, y); F.nugget(g, x + 4, y - 1); } else if (kind === 'pie') F.pie(g, x, y); }
    draw(g) {
      CH.drawKitchenBackdrop(g, this.t);
      // conveyor / pass shelf
      gfx.rect(0, 118, 350, 12, '#5a5a66'); for (let i = 0; i < 350; i += 12) gfx.rect(i + ((this.t * 22) % 12), 120, 6, 8, '#8a8a94'); gfx.rect(0, 130, 350, 4, '#3a3a44');
      gfx.text('← FROM KITCHEN', 8, 108, '#fff', { font: 'small' });
      // chute
      gfx.rect(this.chute.x, this.chute.y, this.chute.w, this.chute.h, '#5a5a66'); gfx.rect(this.chute.x + 4, this.chute.y + 4, this.chute.w - 8, this.chute.h - 8, '#222'); gfx.text('PICKUP', this.chute.x + 35, this.chute.y + 10, '#f5c33b', { align: 'center', font: 'small' }); gfx.text('CHUTE ↓', this.chute.x + 35, this.chute.y + 18, '#f5c33b', { align: 'center', font: 'small' }); gfx.text(String(this.q.done), this.chute.x + 35, this.chute.y + 36, '#8bd06a', { align: 'center' });
      // trash
      gfx.rect(440, 150, 40, 40, '#5a7a94'); gfx.text('TRASH', 460, 166, '#fff', { align: 'center', font: 'small' });
      // bags with tickets
      for (const b of this.bags) {
        const t = b.ticket;
        const bx = b.dragging ? b.dx : b.x, by = b.dragging ? b.dy + 12 : b.y;
        if (t) {
          const sq = b.squash ? Math.sin(b.squash * Math.PI) * 0.15 : 0; if (b.squash) b.squash = Math.max(0, b.squash - 0.05);
          g.save(); g.translate(bx, by); g.scale(1 + sq, 1 - sq); F.bag(g, 0, 0, t.folded < 2, t.got.filter(Boolean).length); g.restore();
          if (t.folded === 1) gfx.rect(bx - 12, by - 27, 24, 3, '#c8a060');
          if (t.drinks) { gfx.rect(bx + 30, by - 16, 22, 16, '#c8c8c8'); for (let i = 0; i < t.drinks; i++) { const gotD = t.items.filter((k, j) => k === 'drink' && t.got[j]).length; if (i < gotD) F.cup(g, bx + 36 + i * 10, by - 14, 0.9, 'S', '#3a1a08', true); else gfx.ellipseOutline(bx + 36 + i * 10, by - 8, 4, 2, '#888'); } }
          const lines = t.items.map((k, i) => Object.assign(new String((t.got[i] ? '✓ ' : '□ ') + k), { done: t.got[i] }));
          CH.drawTicket(g, b.x - 36, 140, lines, { num: t.num, timer: t.time / t.maxTime, w: 72 });
          if (t.got.every(Boolean) && t.folded < 2) gfx.text('click to fold', b.x, by + 4, '#f5c33b', { align: 'center', font: 'small', outline: '#000' });
        } else { gfx.rect(b.x - 14, b.y - 22, 28, 22, 'rgba(0,0,0,0.15)'); gfx.text('(empty)', b.x, b.y - 12, '#888', { align: 'center', font: 'small' }); }
      }
      this.ds.draw(g);
      this.particles.draw(g);
      gfx.text(`Orders: ${this.q.done}/${this.q.total}  Failed: ${this.q.failed}`, 6, H - 10, '#fff', { font: 'small', outline: '#000' });
      if (this.ds.held || this.bags.some((b) => b.dragging)) this.drawPaw(g, true);
      this.drawHud(g);
    }
  }
  CH.BaggingScene = BaggingScene;

  CH.SCENES.grill = () => { const s = new CH.Scene(); s.enter = () => CH.game.push(new GrillScene({ difficulty: 1 })); return s; };
  CH.SCENES.assembly = () => { const s = new CH.Scene(); s.enter = () => CH.game.push(new AssemblyScene({ difficulty: 1 })); return s; };
  CH.SCENES.fries = () => { const s = new CH.Scene(); s.enter = () => CH.game.push(new FriesScene({ difficulty: 1 })); return s; };
  CH.SCENES.bagging = () => { const s = new CH.Scene(); s.enter = () => CH.game.push(new BaggingScene({ difficulty: 1 })); return s; };
})(window.CH);
