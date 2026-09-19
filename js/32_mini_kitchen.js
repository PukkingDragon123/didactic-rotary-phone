// ============================================================================
// KITCHEN MINIGAMES (first-person): grill, assembly, fries & drinks, bagging
//
// The equipment (grill body, fryer, fountain, belt) is flat background metal;
// the food, baskets, cups, boxes and bags are ink-outlined props. Heat is sold
// with glow + shimmer + sizzle flecks rather than with colour alone.
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, A = CH.audio, inp = CH.input, S = CH.state, F = CH.FOOD;
  const MG = CH.MG, art = CH.art;
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

  // shared: the little "Orders x/y" strip at the bottom of every kitchen game
  function ordersStrip(g, q) {
    const txt = `Orders ${q.done}/${q.total}`;
    const bad = q.failed ? `  Failed ${q.failed}` : '';
    const wdt = gfx.textWidth(txt + bad, 'small') + 10;
    MG.panel(4, H - 13, wdt, 11, { r: 3, face: '#231b30', shadow: false });
    gfx.text(txt, 9, H - 10, '#f3eee2', { font: 'small' });
    if (bad) gfx.text(bad, 9 + gfx.textWidth(txt, 'small'), H - 10, '#ff8a7a', { font: 'small' });
  }

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
      // the burnt bin sits fully on screen so its ink line is not clipped
      this.trash = { x: 396, y: 206, w: 74, h: 52 };
      this.patties = [];
      this.sizzleT = 0;
    }
    progress() { return this.q.progress(); }
    makePatty(x, y) {
      const p = {
        x, y, cook: 0, flipped: false, burnt: false, onGrill: null, w: 24, h: 12, kind: 'patty',
        draw: (g, gx, gy, it) => {
          F.patty(g, gx, gy, it.cook);
          if (it.burnt) { MG.steam(gx, gy - 8, this.t, { n: 3, speed: 0.6, rise: 14, alpha: 0.55, color: '60,56,58', w: 2 }); }
          if (it.onGrill && !it.burnt) {
            const p2 = CH.clamp(it.cook / 1, 0, 1.3);
            MG.meter(gx - 12, gy - 16, 24, 4, Math.min(1, p2), it.cook < 0.45 ? '#e07080' : it.cook < 1 ? '#f5c33b' : it.cook < this.burnAt ? '#4f9d3a' : '#c8352b');
            if (!it.flipped && it.cook >= 0.45 && it.cook < 1) MG.tag('FLIP!', gx, gy - 30, { align: 'center', face: Math.sin(this.t * 10) > 0 ? MG.GOLD : MG.CREAM });
            if (it.flipped && it.cook >= 1 && it.cook < this.burnAt) MG.tag('DONE', gx, gy - 30, { align: 'center', face: '#8bd06a' });
          }
        },
        onGrab: (it) => { if (it.onGrill) { it.onGrill.patty = null; it.onGrill = null; } },
      };
      this.ds.add(p); this.patties.push(p); return p;
    }
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
        if (slot && !p.burnt) { slot.patty = p; p.onGrill = slot; p.x = slot.x; p.y = slot.y; p.returning = false; A.sfx('sizzle'); this.particles.burst(p.x, p.y, 8, { color: ['#fff', '#f5c33b'], speed: 40, life: 0.4, grav: -50 }); }
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
      // ---- grill: a heavy steel body around a glowing flat-top -----------------
      gfx.rect(78, 54, 174, 104, '#4a4e58');
      gfx.rect(80, 56, 170, 100, '#3a3e47');
      gfx.hline(80, 56, 170, '#6e737e');
      gfx.rect(84, 60, 162, 92, '#241d21');
      // radiant heat rising out of the plate
      const heat = 0.16 + Math.sin(this.t * 3) * 0.04;
      g.globalAlpha = heat; gfx.rect(84, 60, 162, 92, '#ff5c22'); g.globalAlpha = 1;
      g.globalAlpha = heat * 0.7; gfx.ellipse(165, 106, 74, 42, '#ff9a3c'); g.globalAlpha = 1;
      // grill bars + the greasy sheen between them
      for (let y = 64; y < 152; y += 6) { gfx.hline(86, y, 158, '#4a3a34'); gfx.hline(86, y + 1, 158, '#191316'); }
      for (let y = 64; y < 152; y += 6) gfx.hline(86, y, 158 - ((y * 7) % 40), 'rgba(255,190,120,0.16)');
      for (let x = 92; x < 246; x += 20) gfx.vline(x, 62, 88, 'rgba(255,140,60,0.10)');
      // char stains and old grease
      MG.crumbs(88, 64, 154, 84, 46, ['#120d10', '#2e2119', '#4a3320'], 11);
      // hot glow under whatever is cooking, plus shimmer above the plate
      for (const s of this.slots) if (s.patty) { g.globalAlpha = 0.35 + Math.sin(this.t * 9 + s.x) * 0.1; gfx.ellipse(s.x, s.y + 2, 14, 6, '#ff7a30'); g.globalAlpha = 1; }
      for (let i = 0; i < 3; i++) MG.steam(110 + i * 46, 62, this.t, { n: 2, speed: 0.5, rise: 22, alpha: 0.18, color: '255,214,170', seed: i, w: 3 });
      // splash guard + knobs
      gfx.rect(80, 156, 170, 6, '#5a5f6a');
      gfx.hline(80, 156, 170, '#878d99');
      for (let i = 0; i < 4; i++) {
        MG.ink(100 + i * 44, 168, 14, 14, (cx, cy) => {
          gfx.circle(cx, cy + 1, 5, '#8f231c');
          gfx.circle(cx, cy, 4.6, MG.RED);
          gfx.ellipse(cx - 1, cy - 2, 2.2, 1.2, '#e0655a');
          gfx.rect(cx - 1, cy - 4, 2, 4, '#f5c33b');
        });
      }
      MG.tag('GRILL', 165, 44, { align: 'center' });
      // slot hints
      for (const s of this.slots) if (!s.patty) gfx.ellipseOutline(s.x, s.y, 12, 5, this.ds.held ? 'rgba(255,220,170,0.5)' : 'rgba(255,190,140,0.16)');
      // ---- raw patty tray: a cold steel pan ------------------------------------
      gfx.rect(14, 78, 52, 94, '#6e737e');
      gfx.rect(16, 80, 48, 90, '#9aa0aa');
      gfx.rect(20, 84, 40, 82, '#c3d4e0');
      gfx.rect(20, 84, 40, 3, '#e4eef6');
      gfx.vline(20, 84, 82, '#dfeaf2');
      g.globalAlpha = 0.25; gfx.rect(20, 84, 12, 82, '#ffffff'); g.globalAlpha = 1;
      for (let i = 0; i < 6; i++) F.patty(g, 40, 160 - i * 6, 0);
      MG.tag('RAW', 40, 68, { align: 'center' });
      // ---- pass shelf ----------------------------------------------------------
      gfx.rect(308, 54, 164, 114, '#4a4e58');
      gfx.rect(310, 56, 160, 110, '#5c616c');
      gfx.rect(314, 60, 152, 102, '#8f959f');
      gfx.rect(314, 60, 152, 3, '#c0c6d0');
      for (let y = 64; y < 162; y += 4) gfx.hline(314, y, 152, 'rgba(255,255,255,0.04)');
      MG.tag('PASS', 390, 44, { align: 'center' });
      for (const pl of this.plates) {
        MG.shadow(pl.x, pl.y + 12, 22, 0.22);
        MG.ink(pl.x, pl.y + 5, 52, 22, (cx, cy) => {
          gfx.ellipse(cx, cy + 1, 24, 9, '#b6b6c6');
          gfx.ellipse(cx, cy, 24, 8.4, '#dcdce8');
          gfx.ellipse(cx, cy - 1, 21, 7, '#f4f4fb');
          gfx.ellipse(cx, cy - 1, 16, 5, '#e2e2ee');   // the well of the plate
          gfx.ellipse(cx, cy - 2, 15, 4.4, '#fbfbff');
          gfx.ellipse(cx - 7, cy - 3, 6, 1.8, '#ffffff');
        });
        if (pl.ticket) { const t = pl.ticket; CH.drawTicket(g, pl.x - 24, pl.y - 34, [`${t.patties}x patty (${t.got}/${t.patties})`], { num: t.num, timer: t.time / t.maxTime, w: 50 }); for (let i = 0; i < pl.patties.length; i++) F.patty(g, pl.x - 6 + i * 6, pl.y + 2 - i * 2, 1); }
      }
      // ---- burnt bin -----------------------------------------------------------
      const tr = this.trash;
      MG.shadow(tr.x + tr.w / 2, tr.y + tr.h, tr.w / 2 - 4, 0.28);
      MG.ink(tr.x + tr.w / 2, tr.y + tr.h / 2, tr.w + 10, tr.h + 16, (cx, cy) => {
        const m = MG.m('#5a7a94', { dark: -30, darker: -48, light: 24 });
        gfx.rect(cx - tr.w / 2, cy - tr.h / 2, tr.w, tr.h, m.base);
        gfx.rect(cx - tr.w / 2, cy - tr.h / 2, 8, tr.h, m.l);
        gfx.rect(cx + tr.w / 2 - 7, cy - tr.h / 2, 7, tr.h, m.d);
        gfx.hline(cx - tr.w / 2 + 1, cy, tr.w - 2, m.d);
        gfx.rect(cx - tr.w / 2 - 3, cy - tr.h / 2 - 5, tr.w + 6, 6, m.dd);
        gfx.hline(cx - tr.w / 2 - 3, cy - tr.h / 2 - 5, tr.w + 6, gfx.mix(m.l, '#fff', 0.2));
        gfx.rect(cx - 14, cy - tr.h / 2 - 4, 28, 4, '#181320');
        gfx.text('BURNT', cx, cy - 8, '#f3eee2', { align: 'center', font: 'small' });
        gfx.text('BIN', cx, cy + 2, '#f3eee2', { align: 'center', font: 'small' });
      });
      // spatula resting against the grill
      MG.ink(272, 168, 28, 60, (cx, cy) => {
        gfx.rect(cx - 1, cy - 12, 3, 30, '#b98a4e');
        gfx.vline(cx - 1, cy - 12, 30, '#dcae6c');
        gfx.rect(cx - 10, cy - 26, 20, 13, '#9aa0aa');
        gfx.rect(cx - 10, cy - 26, 20, 10, '#c3c8d2');
        gfx.hline(cx - 9, cy - 26, 18, '#e2e6ee');
        for (let i = 0; i < 3; i++) gfx.vline(cx - 5 + i * 5, cy - 24, 8, '#9aa0aa');
        gfx.px(cx - 6, cy - 20, '#6e4a2a');
      });
      this.ds.draw(g);
      this.particles.draw(g);
      ordersStrip(g, this.q);
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
    drawBottle(g, x, y, kind, squeeze) {
      const m = MG.m(kind === 'ketchup' ? '#c8352b' : '#e8b62c', { dark: -30, light: 26 });
      MG.ink(x, y, 20, 36, (cx, cy) => {
        const sq = squeeze || 0;
        gfx.rect(cx - 5 + sq, cy - 10, 10 - sq * 2, 24, m.base);
        gfx.rect(cx - 5 + sq, cy - 10, 3, 24, m.l);
        gfx.rect(cx + 2, cy - 10, 2, 24, m.d);
        gfx.rect(cx - 4, cy - 12, 8, 3, gfx.shade(m.base, -12));
        gfx.rect(cx - 2, cy - 17, 4, 6, '#3a3346');
        gfx.px(cx - 2, cy - 17, '#6a6480');
        gfx.rect(cx - 4, cy - 2, 8, 6, gfx.mix(m.base, '#fff', 0.14));
      });
    }
    draw(g) {
      CH.drawKitchenBackdrop(g, this.t);
      // ---- chilled ingredient rail --------------------------------------------
      gfx.rect(0, 46, W, 56, '#8f959f');
      gfx.rect(0, 46, W, 3, '#c0c6d0');
      gfx.rect(0, 99, W, 3, '#5c616c');
      for (const b of this.bins) {
        const hv = Math.abs(inp.mx - b.x) < 19 && Math.abs(inp.my - b.y) < 22;
        // steel insert pan sunk into the rail
        gfx.rect(b.x - 19, b.y - 22, 38, 44, '#6e737e');
        gfx.rect(b.x - 17, b.y - 20, 34, 40, '#a8aeb8');
        gfx.rect(b.x - 16, b.y - 19, 32, 38, '#c3d4e0');
        gfx.rect(b.x - 16, b.y - 19, 32, 2, '#e4eef6');
        g.globalAlpha = 0.22; gfx.rect(b.x - 16, b.y - 19, 9, 38, '#ffffff'); g.globalAlpha = 1;
        if (hv) { gfx.frame(b.x - 19, b.y - 22, 38, 44, MG.GOLD); gfx.frame(b.x - 20, b.y - 23, 40, 46, '#8a6a20'); ui.cursor = 'hand'; }
        if (b.kind === 'ketchup' || b.kind === 'mustard') this.drawBottle(g, b.x, b.y - 1, b.kind, 0);
        else for (let i = 0; i < 3; i++) this.drawIng(g, b.x, b.y + 5 - i * 5, b.kind);
        // name plate clipped into the pan so nothing outside can cover it
        gfx.rect(b.x - 16, b.y + 12, 32, 7, '#3a3346');
        gfx.hline(b.x - 16, b.y + 12, 32, '#565070');
        gfx.text(ING_LABEL[b.kind].split(' ')[0].toUpperCase().slice(0, 6), b.x, b.y + 13, '#f3eee2', { align: 'center', font: 'small' });
      }
      // ---- ticket(s) -----------------------------------------------------------
      const cur = this.current();
      if (cur) {
        const lines = cur.layers.map((l, i) => Object.assign(new String((i < this.stack.length ? '✓ ' : (i === this.stack.length ? '▶ ' : '  ')) + ING_LABEL[l]), { done: i < this.stack.length }));
        CH.drawTicket(g, 20, 120, lines, { title: '#' + cur.num + ' ' + cur.name, num: cur.num, timer: cur.time / cur.maxTime, w: 100 });
        if (this.q.active[1]) CH.drawTicket(g, 128, 120, [this.q.active[1].name], { title: 'NEXT', w: 60, color: '#8899aa' });
      }
      // ---- assembly board ------------------------------------------------------
      const bm = MG.m('#c8a060', { dark: -28, darker: -46, light: 20 });
      MG.shadow(240, 232, 62, 0.22);
      gfx.rect(178, 168, 124, 64, bm.dd);
      gfx.rect(180, 170, 120, 60, bm.d);
      gfx.rect(184, 172, 112, 54, bm.base);
      for (let i = 0; i < 7; i++) gfx.hline(186, 176 + i * 7, 108, gfx.shade(bm.base, -8));
      for (let i = 0; i < 5; i++) gfx.hline(190 + (i % 3) * 8, 180 + i * 10, 80 - i * 6, 'rgba(120,84,40,0.35)');
      gfx.hline(184, 172, 112, bm.l);
      MG.crumbs(186, 174, 108, 50, 18, ['#b58a4e', '#e8d0a0'], 5);
      // ---- stack ---------------------------------------------------------------
      const sq = this.stackSquash ? Math.sin(this.stackSquash * Math.PI) * 2 : 0; if (this.stackSquash) this.stackSquash = Math.max(0, this.stackSquash - 0.05);
      if (this.stack.length && !this.wrapped) MG.shadow(this.stackX, this.stackY + 6, 14, 0.25);
      if (!this.wrapped) this.stack.forEach((k, i) => this.drawIng(g, this.stackX, this.stackY - i * 4 + (i === this.stack.length - 1 ? sq : 0), k));
      if (cur && !this.wrapped && this.stack.length < cur.layers.length) { const ty = this.stackY - this.stack.length * 4; g.globalAlpha = 0.3 + Math.sin(this.t * 6) * 0.15; this.drawIng(g, this.stackX, ty, cur.layers[this.stack.length]); g.globalAlpha = 1; }
      // ---- wrapper supply ------------------------------------------------------
      F.wrapper(g, this.wrapperHome.x, this.wrapperHome.y + 3);
      F.wrapper(g, this.wrapperHome.x + 1, this.wrapperHome.y);
      MG.tag('WRAP', this.wrapperHome.x, this.wrapperHome.y + 12, { align: 'center' });
      // ---- pass window ---------------------------------------------------------
      gfx.rect(328, 94, 134, 80, '#4a4e58');
      gfx.rect(330, 96, 130, 76, '#5c616c');
      gfx.rect(334, 100, 122, 68, '#e8e0d0');
      gfx.rect(334, 100, 122, 8, '#b62f27');
      gfx.hline(334, 100, 122, '#d9534a');
      gfx.hline(334, 107, 122, '#8a1f19');
      gfx.text('→ PASS →', 395, 101, '#fff2e6', { align: 'center', font: 'small' });
      // heat lamp wash over the shelf
      g.globalAlpha = 0.18; gfx.rect(336, 110, 118, 56, '#ffb24a'); g.globalAlpha = 1;
      for (let i = 0; i < 3; i++) { gfx.rect(340 + i * 40, 154, 30, 3, '#9aa0aa'); gfx.hline(340 + i * 40, 154, 30, '#c6ccd6'); }
      if (this.wrapped) MG.tag('drag to pass!', 395, 130, { align: 'center', face: MG.GOLD });
      // ---- sauce bottle in hand ------------------------------------------------
      if (this.holdKind) {
        const squeeze = this.holdT > 0 ? Math.min(1.5, this.holdT * 3) : 0;
        this.drawBottle(g, inp.mx, inp.my, this.holdKind, squeeze);
        MG.meter(inp.mx - 10, inp.my - 22, 20, 4, this.holdT / 0.55, this.holdKind === 'ketchup' ? '#e0655a' : MG.GOLD);
        ui.cursor = 'grab';
      }
      this.ds.draw(g);
      this.particles.draw(g);
      ordersStrip(g, this.q);
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
      this.scoop = this.ds.add({
        kind: 'scoop', x: 250, y: 190, w: 22, h: 14,
        draw: (g, x, y, it) => MG.ink(x, y, 34, 26, (cx, cy) => {
          if (it.load) for (let i = 0; i < 5; i++) { gfx.rect(cx - 8 + i * 3, cy - 11, 2, 8, i % 2 ? '#d9a62c' : '#f2c342'); gfx.px(cx - 8 + i * 3, cy - 11, '#fbe08a'); }
          gfx.rect(cx - 10, cy - 4, 16, 8, '#8f959f');
          gfx.rect(cx - 10, cy - 4, 16, 6, '#b6bcc6');
          gfx.hline(cx - 9, cy - 4, 14, '#e2e6ee');
          gfx.rect(cx + 6, cy - 2, 10, 3, '#a82a22');
          gfx.hline(cx + 6, cy - 2, 10, '#e0655a');
        }),
      });
      this.boxes = []; this.cups = [];
      this.nozzles = Object.keys(FLAVORS).map((f, i) => ({ flavor: f, x: 320 + i * 36, y: 80 }));
      this.pass = { x: 400, y: 200, w: 70, h: 50 };
      this.q = new TicketQueue(this, 5 + Math.round(d * 2), Math.max(6, 12 - d), Math.max(25, 45 - d * 3), (i) => ({ fries: CH.pick(['S', 'M', 'L']), drink: Math.random() < 0.8 ? { size: CH.pick(['S', 'M', 'L']), flavor: CH.pick(Object.keys(FLAVORS)) } : null, gotFries: false, gotDrink: false }));
      this.q.maxActive = 3;
      this.spill = 0; this.holdFill = null;
    }
    progress() { return this.q.progress(); }
    drawBasket(g, x, y, it) {
      const burnt = it.cook > this.burnAt;
      MG.ink(x, y - 8, 32, 34, (cx, cy) => {
        cy += 8;
        // wire mesh basket
        gfx.rect(cx - 12, cy - 7, 24, 13, '#6e737e');
        gfx.rect(cx - 11, cy - 7, 22, 12, '#3a3e47');
        for (let i = 0; i < 6; i++) gfx.vline(cx - 10 + i * 4, cy - 6, 11, '#9aa0aa');
        for (let i = 0; i < 3; i++) gfx.hline(cx - 11, cy - 6 + i * 4, 22, '#9aa0aa');
        gfx.rect(cx - 12, cy - 9, 24, 3, '#b6bcc6');
        gfx.hline(cx - 12, cy - 9, 24, '#e2e6ee');
        // handle
        gfx.rect(cx - 2, cy - 22, 3, 14, '#9aa0aa');
        gfx.vline(cx - 2, cy - 22, 14, '#d2d6de');
        gfx.rect(cx - 5, cy - 25, 9, 4, '#a82a22');
        gfx.rect(cx - 5, cy - 25, 9, 3, MG.RED);
        gfx.hline(cx - 4, cy - 25, 7, '#e0655a');
        if (it.state !== 'empty') {
          const c = it.state === 'raw' ? '#f0e8c0' : burnt ? '#3a2010' : gfx.mix('#f0e0a0', '#e8a030', Math.min(1, it.cook));
          const cl = gfx.mix(c, '#fff8d8', 0.4), cd = gfx.shade(c, -26);
          for (let i = 0; i < 7; i++) {
            const fx = cx - 10 + i * 3, fy = cy - 6 + (i % 2);
            gfx.rect(fx, fy, 2, 9, cd);
            gfx.vline(fx, fy, 8, i % 2 ? c : cl);
          }
        }
      });
      if (it.inVat) {
        const p = it.cook;
        MG.meter(x - 12, y - 30, 24, 4, Math.min(1, p), p < 1 ? '#f5c33b' : p < this.burnAt ? '#4f9d3a' : '#c8352b');
        if (p > 0.45 && !it.shook && p < 1) MG.tag('SHAKE!', x, y - 42, { align: 'center', face: Math.sin(this.t * 10) > 0 ? MG.GOLD : MG.CREAM });
        if (p >= 1 && p < this.burnAt) MG.tag('LIFT!', x, y - 42, { align: 'center', face: '#8bd06a' });
      }
    }
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
      if (inp.mpressed && inp.mouseIn(lidStack) && !this.ds.held) { const l = this.ds.add({ kind: 'lid', x: inp.mx, y: inp.my, w: 16, h: 6, draw: (g, x, y) => MG.ink(x, y, 22, 18, (cx, cy) => { gfx.ellipse(cx, cy + 1, 8, 3, '#d3d3dd'); gfx.ellipse(cx, cy, 8, 3, '#f0f0f8'); gfx.ellipse(cx - 2, cy - 1, 3, 1.2, '#ffffff'); gfx.rect(cx - 1, cy - 7, 2, 7, MG.RED); gfx.px(cx - 1, cy - 7, '#f0847a'); }) }); this.ds.held = l; l.grabbed = true; this.ds.offX = 0; this.ds.offY = 0; A.sfx('pop'); inp.eat(); }
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
        if (vat && it.state === 'raw') { vat.basket = it; it.inVat = true; it.returning = false; it.x = vat.x; it.y = vat.y; it.cook = 0; it.shook = false; it.state = 'cooking'; A.sfx('sizzle'); this.particles.burst(it.x, it.y, 10, { color: ['#f5c33b', '#fff'], speed: 60, life: 0.5 }); return; }
        if (vat && it.inVat) { it.returning = false; it.x = vat.x; it.y = vat.y; return; }
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
      // ---- frozen fries bin ----------------------------------------------------
      gfx.rect(18, 38, 64, 44, '#6e737e');
      gfx.rect(20, 40, 60, 40, '#9aa0aa');
      gfx.rect(24, 44, 52, 32, '#c3d4e0');
      gfx.rect(24, 44, 52, 2, '#e8f2fa');
      g.globalAlpha = 0.3; gfx.rect(24, 44, 14, 32, '#ffffff'); g.globalAlpha = 1;
      for (let i = 0; i < 14; i++) { const fx = 27 + (i % 7) * 7, fy = 50 + Math.floor(i / 7) * 11 + (i % 3); gfx.rect(fx, fy, 2, 10, '#ded6ac'); gfx.vline(fx, fy, 9, '#f4eecd'); }
      for (let i = 0; i < 12; i++) gfx.px(26 + (i * 13) % 48, 46 + (i * 7) % 28, 'rgba(255,255,255,0.8)');   // frost
      MG.tag('FROZEN FRIES', 50, 28, { align: 'center' });
      // ---- fryer ---------------------------------------------------------------
      const fw = this.vats.length * 50 + 10;
      gfx.rect(28, 84, fw + 4, 64, '#6e737e');
      gfx.rect(30, 86, fw, 60, '#9aa0aa');
      gfx.hline(30, 86, fw, '#c6ccd6');
      for (const v of this.vats) {
        gfx.rect(v.x - 22, v.y - 20, 44, 44, '#4a4e58');
        gfx.rect(v.x - 21, v.y - 19, 42, 42, '#2f333b');
        // hot oil: deep amber that darkens with depth, a bright moving surface,
        // and bubbles that actually travel up through it
        for (let i = 0; i < 38; i++) {
          const k = i / 38;
          gfx.hline(v.x - 20, v.y - 16 + i, 40, gfx.mix('#e8b52a', '#7a5406', k));
        }
        const surf = v.y - 16 + Math.round(Math.sin(this.t * 2) * 0.5);
        gfx.rect(v.x - 20, surf, 40, 2, '#f6da78');
        gfx.hline(v.x - 20, surf - 1, 40, '#fdf0bc');
        for (let i = 0; i < 5; i++) { const sx = v.x - 16 + i * 8 + Math.round(Math.sin(this.t * 2.2 + i) * 3); gfx.rect(sx, surf, 4, 1, '#fffae0'); }
        g.globalAlpha = 0.16; gfx.rect(v.x - 20, v.y - 16, 11, 38, '#fff6c0'); g.globalAlpha = 1;
        for (let i = 0; i < 8; i++) {
          const k = ((this.t * (0.5 + (i % 3) * 0.2) + i * 0.13) % 1);
          const bx = v.x - 17 + ((i * 11) % 34) + Math.round(Math.sin(this.t * 3 + i) * 1.5);
          const by = v.y + 20 - k * 36;
          if (by < surf) continue;
          const r = 1 + (i % 2);
          gfx.ellipse(bx, by, r, r, 'rgba(255,250,214,' + (0.75 - k * 0.45).toFixed(2) + ')');
        }
        MG.sizzle(v.x, surf - 2, this.t + v.x, 3, { spread: 14, rise: 8 });
        MG.steam(v.x, v.y - 20, this.t, { n: 2, speed: 0.4, rise: 26, alpha: 0.22, color: '255,240,210', seed: v.x, w: 3 });
        if (!v.basket) gfx.text('OIL', v.x, v.y + 4, 'rgba(70,46,0,0.35)', { align: 'center', font: 'small' });
      }
      MG.tag('FRYER', 30 + fw / 2, 146, { align: 'center' });
      // ---- hot tray under the lamp ---------------------------------------------
      const tr = this.hotTray;
      // lamp housing + its warm cone falling on the tray
      gfx.rect(tr.x - 31, tr.y - 60, 3, 44, '#4a4e58');
      gfx.rect(tr.x + 28, tr.y - 60, 3, 44, '#4a4e58');
      gfx.vline(tr.x - 31, tr.y - 60, 44, '#787d87');
      gfx.vline(tr.x + 28, tr.y - 60, 44, '#787d87');
      // hood: a trapezoid shade with the lamp tube glowing under its lip
      gfx.tri(tr.x - 20, tr.y - 66, tr.x + 20, tr.y - 66, tr.x - 30, tr.y - 56, '#5c616c');
      gfx.tri(tr.x + 20, tr.y - 66, tr.x + 30, tr.y - 56, tr.x - 30, tr.y - 56, '#5c616c');
      gfx.rect(tr.x - 20, tr.y - 66, 40, 3, '#787d87');
      gfx.hline(tr.x - 20, tr.y - 67, 40, '#a9aeb8');
      gfx.rect(tr.x - 30, tr.y - 56, 60, 3, '#3f434b');
      gfx.rect(tr.x - 26, tr.y - 54, 52, 3, '#ffb24a');
      gfx.hline(tr.x - 26, tr.y - 54, 52, '#ffe6a8');
      gfx.hline(tr.x - 26, tr.y - 51, 52, '#c8781f');
      g.globalAlpha = 0.10 + Math.sin(this.t * 2) * 0.015;
      gfx.tri(tr.x - 22, tr.y - 51, tr.x + 22, tr.y - 51, tr.x - 34, tr.y - 16, '#ffca6a');
      gfx.tri(tr.x + 22, tr.y - 51, tr.x + 34, tr.y - 16, tr.x - 34, tr.y - 16, '#ffca6a');
      g.globalAlpha = 1;
      gfx.rect(tr.x - 34, tr.y - 20, 68, 40, '#6e737e');
      gfx.rect(tr.x - 32, tr.y - 18, 64, 36, '#9aa0aa');
      gfx.rect(tr.x - 30, tr.y - 16, 60, 32, '#a82a22');
      gfx.rect(tr.x - 30, tr.y - 16, 60, 28, '#c8352b');
      gfx.rect(tr.x - 30, tr.y - 25, 60, 5, '#d9a62c');
      gfx.rect(tr.x - 30, tr.y - 25, 60, 3, '#f2c342');
      gfx.hline(tr.x - 30, tr.y - 26, 60, '#fbe08a');
      g.globalAlpha = 0.3; gfx.rect(tr.x - 30, tr.y - 16, 60, 32, '#ffe080'); g.globalAlpha = 1;
      if (tr.amount > 0) {
        const n = Math.round(tr.amount * 12);
        for (let i = 0; i < n; i++) { const fx = tr.x - 24 + (i % 8) * 6, fy = tr.y - 4 - Math.floor(i / 8) * 4 + (i % 2); gfx.rect(fx, fy, 2, 10, i % 2 ? '#d9a62c' : '#c88a20'); gfx.vline(fx, fy, 9, i % 2 ? '#f2c342' : '#e8a030'); gfx.px(fx, fy, '#fbe08a'); }
        if (tr.salt > 0) for (let i = 0; i < 8; i++) gfx.px(tr.x - 22 + i * 6, tr.y - 8 + (i % 3) * 2, '#ffffff');
        MG.steam(tr.x, tr.y - 10, this.t, { n: 3, speed: 0.4, rise: 18, alpha: 0.3, seed: 2 });
      }
      MG.tag('HOT TRAY', tr.x, tr.y + 20, { align: 'center' });
      // salt shaker
      MG.ink(186, 106, 22, 34, (cx, cy) => {
        gfx.rect(cx - 8, cy - 10, 16, 20, '#e2e0d8');
        gfx.rect(cx - 8, cy - 10, 6, 20, '#ffffff');
        gfx.rect(cx - 8, cy - 14, 16, 5, '#7e828c');
        gfx.hline(cx - 8, cy - 14, 16, '#b6bac4');
        for (let i = 0; i < 3; i++) gfx.px(cx - 4 + i * 4, cy - 13, '#3a3e47');
        gfx.text('S', cx, cy - 3, '#3a3346', { align: 'center', font: 'small' });
      });
      // ---- drink fountain ------------------------------------------------------
      gfx.rect(298, 38, 160, 74, '#8f231c');
      gfx.rect(300, 40, 156, 70, '#c8352b');
      gfx.hline(300, 40, 156, '#e0655a');
      gfx.rect(304, 44, 148, 30, '#7d1a15');
      gfx.rect(304, 44, 148, 28, '#8a1d1d');
      gfx.hline(304, 44, 148, '#a63028');
      gfx.text("DONALD'S FOUNTAIN", 378, 46, '#f5c33b', { align: 'center', font: 'small' });
      gfx.text('fill to the line', 378, 54, '#e0a8a0', { align: 'center', font: 'small' });
      for (const n of this.nozzles) {
        const held = this.ds.held;
        const active = held && held.kind === 'cup' && Math.abs(held.x - n.x) < 12 && Math.abs(held.y - (n.y + 30)) < 16;
        gfx.rect(n.x - 12, n.y - 20, 24, 20, '#4a4e58');
        gfx.rect(n.x - 11, n.y - 19, 22, 18, '#5c616c');
        gfx.rect(n.x - 10, n.y - 18, 20, 12, FLAVORS[n.flavor]);
        gfx.hline(n.x - 10, n.y - 18, 20, gfx.mix(FLAVORS[n.flavor], '#fff', 0.35));
        gfx.text(n.flavor.toUpperCase().slice(0, 5), n.x, n.y - 14, '#fff', { align: 'center', font: 'small' });
        gfx.rect(n.x - 3, n.y, 6, 8, '#2f333b');
        gfx.vline(n.x - 3, n.y, 8, '#5c616c');
        gfx.rect(n.x - 1, n.y + 8, 2, 4, '#4a4e58');
        if (active) for (let i = 0; i < 4; i++) { const k = ((this.t * 3 + i * 0.25) % 1); gfx.rect(n.x - 1, n.y + 11 + k * 18, 2, 5, FLAVORS[n.flavor]); }
      }
      gfx.rect(300, 110, 156, 8, '#8f959f');
      gfx.rect(300, 110, 156, 2, '#c0c6d0');
      for (let x = 304; x < 452; x += 6) gfx.vline(x, 112, 5, '#6e737e');
      gfx.rect(300, 118, 156, 2, '#5c616c');
      // ---- box / cup / lid stacks ----------------------------------------------
      gfx.rect(250, 220, 40, 36, '#8f959f');
      gfx.rect(250, 220, 40, 3, '#c0c6d0');
      F.friesBox(g, 270, 250, 0, 'L'); F.friesBox(g, 261, 246, 0, 'M');
      MG.tag('BOXES', 270, 210, { align: 'center' });
      gfx.rect(300, 190, 40, 40, '#8f959f');
      gfx.rect(300, 190, 40, 3, '#c0c6d0');
      F.cup(g, 312, 226, 0, 'L'); F.cup(g, 326, 224, 0, 'M');
      MG.tag('CUPS', 320, 178, { align: 'center' });
      gfx.rect(440, 120, 30, 30, '#8f959f');
      gfx.rect(440, 120, 30, 3, '#c0c6d0');
      MG.ink(455, 138, 26, 24, (cx, cy) => {
        for (let i = 0; i < 4; i++) { gfx.ellipse(cx, cy + 4 - i * 3, 9, 3, '#d3d3dd'); gfx.ellipse(cx, cy + 3 - i * 3, 9, 2.6, '#eeeef6'); }
      });
      MG.tag('LIDS', 455, 152, { align: 'center' });
      // ---- pass ---------------------------------------------------------------
      gfx.rect(this.pass.x, this.pass.y, this.pass.w, this.pass.h, '#4a4e58');
      gfx.rect(this.pass.x + 2, this.pass.y + 2, this.pass.w - 4, this.pass.h - 4, '#5c616c');
      gfx.rect(this.pass.x + 4, this.pass.y + 4, this.pass.w - 8, this.pass.h - 8, '#e8e0d0');
      g.globalAlpha = 0.2; gfx.rect(this.pass.x + 4, this.pass.y + 4, this.pass.w - 8, this.pass.h - 8, '#ffb24a'); g.globalAlpha = 1;
      gfx.text('→ PASS', this.pass.x + this.pass.w / 2, this.pass.y + 20, '#a82a22', { align: 'center', font: 'small' });
      // tickets
      this.q.active.forEach((t, i) => { const lines = [Object.assign(new String((t.gotFries ? '✓ ' : '□ ') + t.fries + ' fries'), { done: t.gotFries })]; if (t.drink) lines.push(Object.assign(new String((t.gotDrink ? '✓ ' : '□ ') + t.drink.size + ' ' + t.drink.flavor), { done: t.gotDrink })); CH.drawTicket(g, 6 + i * 70, 158, lines, { num: t.num, timer: t.time / t.maxTime, w: 66 }); });
      if (this.spill > 0) { g.globalAlpha = Math.min(1, this.spill); gfx.ellipse(378, 117, 40, 4, '#2a1206'); gfx.ellipse(378, 116, 36, 3, '#3a1a08'); gfx.ellipse(370, 115, 8, 1, 'rgba(255,255,255,0.3)'); g.globalAlpha = 1; }
      this.ds.draw(g);
      this.particles.draw(g);
      ordersStrip(g, this.q);
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
    drawItem(g, x, y, kind) {
      if (kind === 'burger') F.wrapped(g, x, y);
      else if (kind === 'fries') F.friesBox(g, x, y + 8, 1, 'M');
      else if (kind === 'drink') F.cup(g, x, y + 8, 0.9, 'M', '#3a1a08', true);
      else if (kind === 'nuggets') MG.ink(x, y, 26, 20, (cx, cy) => {
        const m = MG.m('#c8352b', { dark: -28, light: 28 });
        gfx.rect(cx - 10, cy - 6, 20, 12, m.base);
        gfx.rect(cx - 10, cy - 6, 5, 12, m.l);
        gfx.rect(cx + 7, cy - 6, 3, 12, m.d);
        gfx.rect(cx - 9, cy - 9, 18, 4, m.l);
        gfx.hline(cx - 9, cy - 9, 18, gfx.mix(m.l, '#fff', 0.4));
        for (const [ox, oy] of [[-3, -1], [4, -2]]) { gfx.ellipse(cx + ox, cy + oy + 1, 4, 3, '#c08430'); gfx.ellipse(cx + ox, cy + oy, 3.8, 2.8, '#daa244'); gfx.px(cx + ox - 1, cy + oy - 1, '#f2c973'); }
      });
      else if (kind === 'pie') F.pie(g, x, y);
    }
    draw(g) {
      CH.drawKitchenBackdrop(g, this.t);
      // ---- conveyor ------------------------------------------------------------
      gfx.rect(0, 116, 350, 4, '#3a3e47');
      gfx.rect(0, 118, 350, 12, '#4a4e58');
      for (let i = 0; i < 350; i += 12) { const bx = i + ((this.t * 22) % 12); gfx.rect(bx, 119, 7, 9, '#8f959f'); gfx.hline(bx, 119, 7, '#c0c6d0'); gfx.vline(bx + 6, 119, 9, '#5c616c'); }
      gfx.rect(0, 129, 350, 4, '#2f333b');
      gfx.rect(0, 133, 350, 2, '#1f2228');
      for (let i = 0; i < 6; i++) { gfx.circle(20 + i * 60, 134, 4, '#4a4e58'); gfx.circle(20 + i * 60, 134, 2, '#8f959f'); }
      // heat lamp rack over the belt, so the wall is not a blank field
      gfx.rect(20, 60, 300, 6, '#5c616c');
      gfx.hline(20, 60, 300, '#949aa4');
      for (let x = 40; x < 310; x += 60) { gfx.rect(x, 66, 3, 10, '#4a4e58'); gfx.rect(x - 14, 76, 32, 5, '#3a3e47'); gfx.rect(x - 12, 79, 28, 3, '#ffb24a'); gfx.hline(x - 12, 79, 28, '#ffe6a8'); }
      g.globalAlpha = 0.08; gfx.rect(20, 82, 300, 32, '#ffca6a'); g.globalAlpha = 1;
      // a clipboard of orders nobody reads
      MG.ink(356, 96, 30, 40, (cx, cy) => {
        gfx.rect(cx - 11, cy - 15, 22, 30, '#b98a4e');
        gfx.rect(cx - 9, cy - 13, 18, 26, '#fdf8ea');
        for (let i = 0; i < 5; i++) gfx.hline(cx - 7, cy - 9 + i * 5, 14 - (i % 2) * 5, '#c9bfa6');
        gfx.rect(cx - 5, cy - 17, 10, 4, '#8f959f');
        gfx.hline(cx - 5, cy - 17, 10, '#c6ccd6');
      });
      MG.tag('← FROM KITCHEN', 6, 104);
      // ---- pickup chute --------------------------------------------------------
      gfx.rect(this.chute.x - 2, this.chute.y - 2, this.chute.w + 4, this.chute.h + 4, '#3a3e47');
      gfx.rect(this.chute.x, this.chute.y, this.chute.w, this.chute.h, '#5c616c');
      gfx.hline(this.chute.x, this.chute.y, this.chute.w, '#949aa4');
      gfx.rect(this.chute.x + 4, this.chute.y + 4, this.chute.w - 8, this.chute.h - 8, '#1a1620');
      gfx.rect(this.chute.x + 4, this.chute.y + 4, this.chute.w - 8, 3, '#0e0b14');
      gfx.text('PICKUP', this.chute.x + 35, this.chute.y + 10, '#f5c33b', { align: 'center', font: 'small' });
      gfx.text('CHUTE ↓', this.chute.x + 35, this.chute.y + 18, '#f5c33b', { align: 'center', font: 'small' });
      gfx.text(String(this.q.done), this.chute.x + 35, this.chute.y + 34, '#8bd06a', { align: 'center' });
      // ---- trash ---------------------------------------------------------------
      MG.ink(458, 170, 46, 48, (cx, cy) => {
        const m = MG.m('#5a7a94', { dark: -30, darker: -48, light: 24 });
        gfx.rect(cx - 20, cy - 20, 40, 40, m.base);
        gfx.rect(cx - 20, cy - 20, 6, 40, m.l);
        gfx.rect(cx + 15, cy - 20, 5, 40, m.d);
        gfx.rect(cx - 22, cy - 24, 44, 5, m.dd);
        gfx.rect(cx - 10, cy - 23, 20, 3, '#181320');
        gfx.text('TRASH', cx, cy - 4, '#f3eee2', { align: 'center', font: 'small' });
      });
      // ---- bags ----------------------------------------------------------------
      for (const b of this.bags) {
        const t = b.ticket;
        const bx = b.dragging ? b.dx : b.x, by = b.dragging ? b.dy + 12 : b.y;
        if (t) {
          const sq = b.squash ? Math.sin(b.squash * Math.PI) * 0.15 : 0; if (b.squash) b.squash = Math.max(0, b.squash - 0.05);
          MG.shadow(bx, by + 2, 14, b.dragging ? 0.18 : 0.28);
          g.save(); g.translate(Math.round(bx), Math.round(by)); g.scale(1 + sq, 1 - sq); F.bag(g, 0, 0, t.folded < 2, t.got.filter(Boolean).length); g.restore();
          if (t.folded === 1) { gfx.rect(bx - 12, by - 27, 24, 3, '#b8935e'); gfx.hline(bx - 12, by - 27, 24, '#dcb87e'); }
          if (t.drinks) {
            // drink carrier
            MG.ink(bx + 41, by - 8, 32, 26, (cx, cy) => {
              // moulded pulp drink carrier, two wells, seen from the front
              gfx.rect(cx - 11, cy - 8, 22, 16, '#a9926c');
              gfx.rect(cx - 11, cy - 8, 22, 13, '#c8ae82');
              gfx.hline(cx - 11, cy - 8, 22, '#ddc59a');
              gfx.ellipse(cx - 5, cy - 6, 4.4, 2.2, '#7d6849');
              gfx.ellipse(cx + 5, cy - 6, 4.4, 2.2, '#7d6849');
              gfx.ellipse(cx - 5, cy - 7, 4, 1.8, '#5f4e35');
              gfx.ellipse(cx + 5, cy - 7, 4, 1.8, '#5f4e35');
              gfx.hline(cx - 10, cy + 3, 20, '#9b8462');
            });
            for (let i = 0; i < t.drinks; i++) { const gotD = t.items.filter((k, j) => k === 'drink' && t.got[j]).length; if (i < gotD) F.cup(g, bx + 36 + i * 10, by - 14, 0.9, 'S', '#3a1a08', true); else gfx.ellipseOutline(bx + 36 + i * 10, by - 8, 4, 2, '#7e828c'); }
          }
          const lines = t.items.map((k, i) => Object.assign(new String((t.got[i] ? '✓ ' : '□ ') + k), { done: t.got[i] }));
          CH.drawTicket(g, b.x - 36, 140, lines, { num: t.num, timer: t.time / t.maxTime, w: 72 });
          if (t.got.every(Boolean) && t.folded < 2) MG.tag('click to fold', b.x, by + 2, { align: 'center', face: MG.GOLD });
        } else {
          gfx.rect(b.x - 14, b.y - 22, 28, 22, 'rgba(20,14,26,0.14)');
          for (let i = 0; i < 4; i++) gfx.hline(b.x - 14, b.y - 22 + i * 7, 28, 'rgba(20,14,26,0.08)');
          gfx.text('(empty)', b.x, b.y - 12, '#7d6a58', { align: 'center', font: 'small' });
        }
      }
      this.ds.draw(g);
      this.particles.draw(g);
      ordersStrip(g, this.q);
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
