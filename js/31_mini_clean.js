// ============================================================================
// JANITOR MINIGAMES: mop spills, clean tables, empty bins, bathrooms, restock
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, A = CH.audio, inp = CH.input, S = CH.state, F = CH.FOOD;
  const W = CH.W, H = CH.H;
  const has = (k) => CH.has(k);

  const MESSES = {
    soda: { name: 'Soda spill', color: '#6a3a18', color2: '#8a5028', size: 1, blobs: 4 },
    ketchup: { name: 'Ketchup incident', color: '#b02020', color2: '#d04040', size: 1.1, blobs: 6, splatter: true },
    milkshake: { name: 'Milkshake meltdown', color: '#f0a0b8', color2: '#f8c8d8', size: 1.2, blobs: 3 },
    fries: { name: '4,000 fries', color: '#e8c060', color2: '#f5d080', size: 1.3, blobs: 5, fries: true },
    goo: { name: 'Mystery goo', color: '#5ab04a', color2: '#8ad07a', size: 1.2, blobs: 5, eyes: true },
    cake: { name: 'An entire cake', color: '#8a5030', color2: '#f0a0b8', size: 1.4, blobs: 3, candles: true },
    coffee: { name: 'Coffee tsunami', color: '#4a2a10', color2: '#6a4020', size: 1.6, blobs: 7 },
    glitter: { name: "Kids' party glitter", color: '#c0a0f0', color2: '#f0d0ff', size: 1.5, blobs: 8, sparkle: true },
  };
  CH.MESSES = MESSES;

  // ---------------------------------------------------------------- MOP -----
  class MopScene extends CH.MinigameScene {
    constructor(opts = {}) {
      super({ title: 'MOP THE SPILL', hint: 'Hold the mouse and drag the mop. Dunk it in the bucket when it gets gross!', difficulty: opts.difficulty || 1 });
      this.mess = MESSES[opts.kind || 'soda']; this.subtitle = this.mess.name;
      this.timeLimit = 0;
      const diff = this.difficulty;
      this.radius = has('mop3') ? 16 : has('mop2') ? 12 : 9;
      this.capacity = has('bucket2') ? 2.8 : 1.7; this.dirt = 0; this.dunks = 0; this.water = 0; this.maxWater = has('bucket2') ? 6 : 4;
      this.mopX = W / 2; this.mopY = H / 2; this.lastMX = null; this.lastMY = null; this.mopping = false;
      this.wet = gfx.makeCanvas(W, H); this.wetCtx = this.wet.getContext('2d'); this.wetFade = 0;
      this.mask = new CH.ScrubMask(0, 30, W, H - 30, (c, w, h) => this.paintMess(c, w, h, diff));
      this.fries = []; if (this.mess.fries) for (let i = 0; i < 24 + diff * 8; i++) this.fries.push({ x: W / 2 + CH.rand(-120, 120) * this.mess.size, y: H / 2 + 10 + CH.rand(-60, 60), a: CH.rand(0, Math.PI), got: false });
      this.bucket = { x: W - 44, y: H - 40, w: 40, h: 44 };
      this.sign = false; this.gross = false;
    }
    paintMess(c, w, h, diff) {
      const m = this.mess; const rng = new CH.Rng(Date.now() & 0xffff);
      const cx = w / 2, cy = h / 2 + 10; const sz = m.size * (0.9 + diff * 0.25);
      for (let i = 0; i < m.blobs; i++) { const bx = cx + rng.range(-70, 70) * sz, by = cy + rng.range(-40, 40) * sz; gfx.ellipse(bx, by, rng.range(25, 55) * sz, rng.range(15, 30) * sz, m.color); }
      for (let i = 0; i < m.blobs; i++) { const bx = cx + rng.range(-60, 60) * sz, by = cy + rng.range(-30, 30) * sz; gfx.ellipse(bx, by, rng.range(12, 30) * sz, rng.range(8, 16) * sz, m.color2); }
      if (m.splatter) for (let i = 0; i < 40 * sz; i++) { const a = rng.range(0, Math.PI * 2), d = rng.range(50, 150) * sz; gfx.ellipse(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.6, rng.range(1, 4), rng.range(1, 3), m.color); }
      if (m.splatter) { // handprint
        const hx = cx + 90 * sz, hy = cy - 20; gfx.ellipse(hx, hy, 8, 10, m.color); for (let i = 0; i < 4; i++) gfx.ellipse(hx - 6 + i * 4, hy - 14 + (i === 1 || i === 2 ? -2 : 0), 2, 6, m.color); gfx.ellipse(hx - 10, hy + 2, 2, 5, m.color);
      }
      if (m.candles) { for (let i = 0; i < 5; i++) { gfx.rect(cx - 30 + i * 15, cy - 30, 3, 10, '#4fa8ff'); gfx.px(cx - 29 + i * 15, cy - 32, '#f5c33b'); } }
      if (m.eyes) { for (let i = 0; i < 3; i++) { const ex = cx - 40 + i * 40, ey = cy + rng.range(-10, 10); gfx.ellipse(ex, ey, 5, 5, '#fff'); gfx.ellipse(ex + 1, ey, 2, 2, '#111'); } }
      if (m.sparkle) for (let i = 0; i < 120 * sz; i++) gfx.px(cx + rng.range(-160, 160) * sz, cy + rng.range(-70, 70) * sz, rng.pick(['#fff', '#f5c33b', '#9fdcff', '#f0a0f0']));
    }
    progress() { const fr = this.fries.length ? this.fries.filter((f) => f.got).length / this.fries.length : 1; return CH.clamp((1 - this.mask.fraction()) * 0.8 + fr * 0.2, 0, 1); }
    step(dt) {
      this.mask.update(dt);
      const mx = inp.mx, my = inp.my;
      // bucket dunk
      if (inp.mdown && inp.mouseIn(this.bucket)) {
        if (!this.inBucket) { this.inBucket = true; if (this.water >= this.maxWater && !has('wringer')) { ui.setHint('The water is soup. Click the drain to change it!', 2.5); A.sfx('error'); } else { A.sfx('splash'); this.dirt = 0; this.dunks++; this.water += has('wringer') ? 0.3 : 1; this.gross = false; this.particles.burst(this.bucket.x + 20, this.bucket.y + 10, 14, { color: ['#9fdcff', '#fff', '#6a8aa8'], speed: 60, life: 0.5, grav: 250 }); } }
        this.mopX = this.bucket.x + 20; this.mopY = this.bucket.y + 8;
      } else this.inBucket = false;
      // drain
      const drain = { x: this.bucket.x - 30, y: H - 20, w: 24, h: 16 };
      if (inp.mouseIn(drain)) ui.cursor = 'hand';
      if (inp.clicked(drain) && this.water > 0) { this.water = 0; A.sfx('flush'); ui.toast('Fresh water!', '#9fdcff', 1.5); this.particles.burst(drain.x + 12, drain.y, 10, { color: ['#6a4a2a', '#9fdcff'], speed: 40, life: 0.5 }); }
      // mopping
      if (inp.mdown && !inp.mouseIn(this.bucket) && my > 30) {
        this.mopping = true;
        this.mopX = CH.lerp(this.mopX, mx, Math.min(1, dt * 18)); this.mopY = CH.lerp(this.mopY, my, Math.min(1, dt * 18));
        const strength = this.gross ? 0.12 : CH.lerp(1, 0.4, CH.clamp(this.dirt / this.capacity, 0, 1)) * (this.water >= this.maxWater ? 0.5 : 1);
        if (this.lastMX !== null) {
          const d = CH.dist(this.lastMX, this.lastMY, this.mopX, this.mopY);
          const steps = Math.max(1, Math.ceil(d / 3));
          for (let i = 0; i <= steps; i++) { const px = CH.lerp(this.lastMX, this.mopX, i / steps), py = CH.lerp(this.lastMY, this.mopY, i / steps); this.mask.erase(px, py, this.radius, strength); this.wetTrail(px, py); }
          const before = this.mask.left;
          this.dirt += d * 0.0022 * (has('wringer') ? 0.5 : 1);
          if (this.dirt > this.capacity && !this.gross) { this.gross = true; ui.setHint('The mop is GROSS. Dunk it in the bucket!', 2.5); A.sfx('squirt'); }
          if (d > 2 && Math.random() < 0.3) { this.particles.add({ x: this.mopX + CH.rand(-8, 8), y: this.mopY + CH.rand(-4, 4), vx: CH.rand(-20, 20), vy: CH.rand(-30, -10), life: 0.4, color: this.gross ? this.mess.color : '#9fdcff', grav: 200 }); }
          if (d > 1 && this.t % 0.25 < dt) A.sfx('mop');
          // fries sweep
          for (const f of this.fries) if (!f.got && CH.dist(f.x, f.y, this.mopX, this.mopY) < this.radius + 4) { f.got = true; A.sfx('paper'); this.particles.burst(f.x, f.y, 3, { color: ['#f5c33b', '#e8a840'], speed: 30, life: 0.3 }); }
        }
        this.lastMX = this.mopX; this.lastMY = this.mopY;
      } else { this.mopping = false; this.lastMX = null; this.lastMY = null; if (!inp.mdown) { this.mopX = CH.lerp(this.mopX, mx, Math.min(1, dt * 10)); this.mopY = CH.lerp(this.mopY, my, Math.min(1, dt * 10)); } }
      // wet trail fade
      this.wetFade += dt; if (this.wetFade > 0.12) { this.wetFade = 0; const c = this.wetCtx; c.save(); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = 0.06; c.fillRect(0, 0, W, H); c.restore(); }
      if (this.progress() >= 0.97 && !this.finished) { this.sign = true; const timeScore = CH.clamp(1.4 - this.t / (30 + this.difficulty * 10), 0.3, 1); const dunkPen = this.gross ? 0.1 : 0; S.stats.spillsMopped++; this.finish(timeScore - dunkPen, { label: this.t < 15 ? 'Lightning mop!' : undefined }); }
    }
    wetTrail(px, py) { const c = this.wetCtx; c.fillStyle = 'rgba(140,190,255,0.22)'; const r = this.radius; for (let yy = -r; yy <= r; yy += 1) { const hw = Math.floor(Math.sqrt(r * r - yy * yy)); c.fillRect(Math.round(px) - hw, Math.round(py + yy), hw * 2 + 1, 1); } }
    draw(g) {
      // floor tiles (top-down)
      gfx.rect(0, 0, W, H, '#b9a68a');
      for (let y = 0; y < H; y += 24) for (let x = -((y / 24) & 1) * 24; x < W; x += 48) gfx.rect(x, y, 24, 24, '#c9b69a');
      for (let y = 0; y < H; y += 24) gfx.hline(0, y, W, '#9a876a'); for (let x = 0; x < W; x += 24) gfx.vline(x, 0, H, '#9a876a');
      // old scuffs
      for (let i = 0; i < 30; i++) gfx.px((i * 73) % W, (i * 41) % H, '#a89578');
      g.drawImage(this.wet, 0, 0);
      this.mask.draw(g);
      for (const f of this.fries) if (!f.got) { g.save(); g.translate(f.x, f.y); g.rotate(f.a); gfx.rect(-6, -1, 12, 2, '#f5c33b'); gfx.rect(-5, -1, 10, 1, '#f8d880'); g.restore(); }
      // bucket
      const b = this.bucket; const wc = gfx.mix('#6aa8ff', '#5a3a18', CH.clamp(this.water / this.maxWater, 0, 1));
      gfx.rect(b.x, b.y, b.w, b.h, '#e8b020'); gfx.rect(b.x + 2, b.y + 2, b.w - 4, b.h - 4, '#f5c33b'); gfx.ellipse(b.x + b.w / 2, b.y + 14, b.w / 2 - 3, 8, wc); for (let i = 0; i < 3; i++) gfx.px(b.x + 8 + i * 10, b.y + 12 + Math.round(Math.sin(this.t * 3 + i) * 2), '#fff');
      gfx.text('BUCKET', b.x + b.w / 2, b.y + b.h - 10, '#8a5a00', { align: 'center', font: 'small' }); gfx.rect(b.x + 4, b.y - 3, 2, 4, '#555'); gfx.rect(b.x + b.w - 6, b.y - 3, 2, 4, '#555'); gfx.rect(b.x + 4, b.y - 4, b.w - 8, 1, '#555');
      if (this.water >= this.maxWater) gfx.text('SOUP', b.x + b.w / 2, b.y + 4, '#fff', { align: 'center', font: 'small', outline: '#000' });
      // drain
      gfx.circle(b.x - 18, H - 12, 9, '#444'); gfx.circle(b.x - 18, H - 12, 6, '#222'); for (let i = 0; i < 3; i++) gfx.rect(b.x - 22 + i * 4, H - 14, 2, 4, '#555'); gfx.text('DRAIN', b.x - 18, H - 30, '#444', { align: 'center', font: 'small' });
      // mop: handle from bottom center to head
      const hx = W / 2 + (this.mopX - W / 2) * 0.3, hy = H + 10;
      gfx.line(hx, hy, this.mopX, this.mopY, '#c8a060'); gfx.line(hx + 1, hy, this.mopX + 1, this.mopY, '#8a6a3a');
      const r = this.radius; const dirtyCol = gfx.mix('#f0ece0', this.mess.color, CH.clamp(this.dirt / this.capacity, 0, 1));
      gfx.ellipse(this.mopX, this.mopY, r, r * 0.6, dirtyCol);
      for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2 + this.t * (this.mopping ? 4 : 0.5); gfx.line(this.mopX, this.mopY, this.mopX + Math.cos(a) * r * 1.2, this.mopY + Math.sin(a) * r * 0.8, i % 2 ? dirtyCol : gfx.shade(dirtyCol, -20)); }
      gfx.rect(this.mopX - 3, this.mopY - 3, 6, 4, '#c8352b');
      if (this.gross) { for (let i = 0; i < 3; i++) gfx.px(this.mopX - 8 + i * 8, this.mopY - 12 - Math.round(((this.t * 2 + i * 0.3) % 1) * 6), '#8a8a4a'); }
      this.particles.draw(g);
      // dirt meter
      gfx.text('MOP', 6, 20, '#fff', { font: 'small', outline: '#000' }); ui.bar(24, 21, 50, 4, this.dirt / this.capacity, this.gross ? '#c8352b' : '#a86a3a');
      gfx.text('WATER', 84, 20, '#fff', { font: 'small', outline: '#000' }); ui.bar(112, 21, 40, 4, this.water / this.maxWater, '#6a8aa8');
      if (this.sign) { gfx.rect(W / 2 - 14, H / 2 - 30, 28, 24, '#f5c33b'); gfx.text('WET', W / 2, H / 2 - 27, '#222', { align: 'center', font: 'small' }); gfx.text('FLOOR', W / 2, H / 2 - 19, '#222', { align: 'center', font: 'small' }); gfx.rect(W / 2 - 14, H / 2 - 6, 28, 2, '#e8a020'); }
      this.drawHud(g);
      ui.cursor = 'none';
    }
  }
  CH.MopScene = MopScene;

  // ---------------------------------------------------------------- TABLE -----
  class TableScene extends CH.MinigameScene {
    constructor(opts = {}) {
      super({ title: 'CLEAN THE TABLE', hint: 'Drag trash to the bin, trays to the rack. Then wipe the smears!', difficulty: opts.difficulty || 1 });
      this.ds = new CH.DragSystem(this);
      const n = 5 + Math.round(this.difficulty * 2);
      const kinds = ['wrapper', 'cup', 'fries', 'napkin', 'straw', 'halfburger', 'toy', 'wrapper', 'cup', 'nuggetbox', 'pie'];
      for (let i = 0; i < n; i++) { const k = kinds[i % kinds.length]; this.ds.add({ kind: k, x: 120 + CH.rand(0, 240), y: 70 + CH.rand(0, 120), w: 22, h: 16, draw: (g, x, y, it) => this.drawItem(g, x, y, it) }); }
      for (let i = 0; i < 1 + Math.floor(this.difficulty / 2); i++) this.ds.add({ kind: 'tray', x: 160 + i * 120, y: 130 + CH.rand(-20, 20), w: 44, h: 10, draw: (g, x, y) => F.tray(g, x, y) });
      this.bin = this.ds.addTarget({ x: 34, y: 150, w: 44, h: 60, kind: 'bin', accepts: (it) => it.kind !== 'tray', onDrop: (it) => { this.ds.remove(it); A.sfx('trash'); this.particles.burst(34, 120, 6, { color: ['#aaa', '#f5c33b'], speed: 30, life: 0.4 }); this.addCombo(); return true; }, draw: (g, t, hov) => { gfx.rect(t.x - 22, t.y - 30, 44, 60, hov ? '#7a9ab4' : '#5a7a94'); gfx.rect(t.x - 24, t.y - 34, 48, 6, '#42566b'); gfx.rect(t.x - 12, t.y - 33, 24, 4, '#222'); gfx.text('TRASH', t.x, t.y, '#fff', { align: 'center', font: 'small' }); } });
      this.rack = this.ds.addTarget({ x: W - 36, y: 150, w: 50, h: 60, kind: 'rack', accepts: (it) => it.kind === 'tray', onDrop: (it) => { this.ds.remove(it); A.sfx('snap'); this.traysDone++; this.addCombo(); return true; }, draw: (g, t, hov) => { gfx.rect(t.x - 24, t.y - 30, 48, 60, hov ? '#a8a8b8' : '#8a8a94'); for (let i = 0; i < 4; i++) gfx.rect(t.x - 20, t.y - 22 + i * 12, 40, 2, '#5a5a66'); for (let i = 0; i < this.traysDone; i++) gfx.rect(t.x - 18, t.y - 26 + i * 12, 36, 3, '#a83a3a'); gfx.text('TRAYS', t.x, t.y + 20, '#fff', { align: 'center', font: 'small' }); } });
      this.traysDone = 0;
      this.mask = new CH.ScrubMask(90, 50, 300, 150, (c, w, h) => { const rng = new CH.Rng(7 + Date.now() % 1000); for (let i = 0; i < 4 + this.difficulty * 2; i++) gfx.ellipse(rng.range(20, w - 20), rng.range(20, h - 20), rng.range(8, 20), rng.range(5, 12), rng.pick(['rgba(180,40,40,0.9)', 'rgba(230,200,80,0.9)', 'rgba(120,80,40,0.8)'])); for (let i = 0; i < 40; i++) gfx.px(rng.range(0, w), rng.range(0, h), '#f0e8d0'); });
      this.radius = has('rag2') ? 14 : 10; this.lastM = null; this.phase = 1;
    }
    drawItem(g, x, y, it) {
      switch (it.kind) {
        case 'wrapper': gfx.rect(x - 10, y - 6, 20, 12, '#f5c33b'); for (let i = 0; i < 5; i++) gfx.rect(x - 9 + i * 4, y - 5, 2, 10, '#e8a020'); gfx.px(x + 3, y + 1, '#c8352b'); break;
        case 'cup': F.cup(g, x, y + 8, 0.2, 'M', '#5a2a10', true); break;
        case 'fries': F.friesBox(g, x, y + 8, 0.15, 'M'); break;
        case 'napkin': gfx.rect(x - 8, y - 5, 16, 10, '#f4f4f0'); gfx.rect(x - 6, y - 3, 6, 2, '#c8352b'); break;
        case 'straw': gfx.rect(x - 1, y - 9, 3, 18, '#fff'); for (let i = 0; i < 4; i++) gfx.rect(x - 1, y - 8 + i * 5, 3, 2, '#c8352b'); break;
        case 'halfburger': F.bunBottom(g, x, y + 2); F.patty(g, x, y - 1, 1); gfx.rect(x + 2, y - 8, 10, 10, 'rgba(0,0,0,0)'); F.bunTop(g, x - 3, y - 5); break;
        case 'toy': gfx.ellipse(x, y, 6, 8, '#e8dcc0'); gfx.rect(x - 4, y - 1, 8, 1, '#5a3a1a'); gfx.px(x - 2, y - 4, '#111'); gfx.px(x + 2, y - 4, '#111'); gfx.rect(x - 1, y + 2, 2, 1, '#5a1a1a'); break;
        case 'nuggetbox': gfx.rect(x - 9, y - 5, 18, 10, '#c8352b'); gfx.rect(x - 8, y - 6, 16, 2, '#e04a3e'); F.nugget(g, x - 3, y); break;
        case 'pie': F.pie(g, x, y); break;
        default: gfx.rect(x - 6, y - 6, 12, 12, '#888');
      }
    }
    progress() { const itemsLeft = this.ds.items.length; const total = this.totalItems || (this.totalItems = itemsLeft); return CH.clamp((1 - itemsLeft / total) * 0.6 + (1 - this.mask.fraction()) * 0.4, 0, 1); }
    step(dt) {
      this.ds.update(dt); this.mask.update(dt);
      if (this.ds.items.length === 0 && this.phase === 1) { this.phase = 2; ui.setHint('Now wipe the smears with the rag!', 2.5); }
      if (this.phase === 2 && inp.mdown && this.mask.contains(inp.mx, inp.my)) {
        if (this.lastM) { const d = CH.dist(this.lastM[0], this.lastM[1], inp.mx, inp.my); const steps = Math.max(1, Math.ceil(d / 3)); for (let i = 0; i <= steps; i++) this.mask.erase(CH.lerp(this.lastM[0], inp.mx, i / steps), CH.lerp(this.lastM[1], inp.my, i / steps), this.radius, 0.9); if (d > 2 && this.t % 0.2 < dt) A.sfx('scrub'); if (d > 3 && Math.random() < 0.4) this.particles.add({ x: inp.mx + CH.rand(-6, 6), y: inp.my + CH.rand(-4, 4), vx: CH.rand(-15, 15), vy: -20, life: 0.3, color: '#fff', grav: 100 }); }
        this.lastM = [inp.mx, inp.my];
      } else this.lastM = null;
      if (this.phase === 2 && this.mask.fraction() < 0.04 && !this.finished) { this.finish(CH.clamp(1.3 - this.t / (25 + this.difficulty * 8), 0.3, 1) - this.mistakes * 0.05); }
    }
    draw(g) {
      gfx.rect(0, 0, W, H, '#6a5a4a');
      // table top (laminate) with edge
      gfx.rect(80, 40, 320, 170, '#3a2a1a'); gfx.rect(86, 46, 308, 158, '#e8c890'); for (let i = 0; i < 20; i++) gfx.hline(90, 52 + i * 8, 300, '#e0bc80');
      gfx.rect(86, 46, 308, 2, '#f8e0b0');
      this.mask.draw(g);
      // floor around
      this.ds.draw(g);
      this.particles.draw(g);
      if (this.phase === 2) { const x = inp.mx, y = inp.my; gfx.rect(x - 10, y - 6, 20, 12, '#4fa8ff'); for (let i = 0; i < 4; i++) gfx.rect(x - 8, y - 4 + i * 3, 16, 1, '#7fc8ff'); ui.cursor = 'none'; }
      else if (this.ds.held) this.drawPaw(g, true);
      this.drawHud(g);
    }
  }
  CH.TableScene = TableScene;

  // ---------------------------------------------------------------- BIN -------
  class BinScene extends CH.MinigameScene {
    constructor(opts = {}) {
      super({ title: 'EMPTY THE BIN', hint: 'Hold on the bag to tie it. Then carry it to the dumpster... gently.', difficulty: opts.difficulty || 1 });
      this.phase = 'tie'; this.hold = new CH.HoldMeter({ x: 90, y: 90, w: 80, h: 90 }, has('quicktie') ? 0.6 : 1.4, { decay: 1.5, sfx: 'paper', color: '#f5c33b' });
      this.bag = { x: 130, y: 150, w: 70, h: 90, held: false, strain: 0, ripped: false, vx: 0, lastX: 130, lastY: 150 };
      this.maxStrain = has('bag3') ? 3.5 : has('bag2') ? 2.2 : 1.2; this.speedLimit = has('bag2') ? 420 : 300;
      this.flies = []; for (let i = 0; i < 5; i++) this.flies.push({ a: Math.random() * 7, r: 20 + Math.random() * 20, s: 2 + Math.random() * 3 });
      this.trash = []; this.newBag = { x: 60, y: 230, placed: false, held: false };
      this.dumpster = { x: W - 90, y: 80, w: 90, h: 110 };
    }
    progress() { return this.phase === 'tie' ? this.hold.p * 0.3 : this.phase === 'carry' ? 0.3 + CH.clamp((this.bag.x - 130) / (W - 220), 0, 1) * 0.4 : this.phase === 'cleanup' ? 0.6 : this.phase === 'newbag' ? 0.85 : 1; }
    step(dt) {
      const b = this.bag;
      if (this.phase === 'tie') { this.hold.update(dt); if (this.hold.done) { this.phase = 'carry'; A.sfx('snap'); ui.setHint('Drag the bag to the dumpster. Too fast and it RIPS.', 3); } }
      else if (this.phase === 'carry') {
        const r = { x: b.x - b.w / 2, y: b.y - b.h, w: b.w, h: b.h };
        if (inp.mpressed && inp.mouseIn(r)) { b.held = true; A.sfx('pop'); }
        if (!inp.mdown) b.held = false;
        if (b.held) {
          const nx = inp.mx, ny = inp.my + 30; const sp = CH.dist(b.x, b.y, nx, ny) / Math.max(dt, 0.001);
          b.x = nx; b.y = Math.min(H - 10, ny);
          if (sp > this.speedLimit) { b.strain += dt * (sp / this.speedLimit) * 2; if (Math.random() < 0.5) this.particles.add({ x: b.x + CH.rand(-20, 20), y: b.y - 20, vx: 0, vy: 40, life: 0.5, color: '#6a5a2a', grav: 200 }); } else b.strain = Math.max(0, b.strain - dt * 0.6);
          if (b.strain > this.maxStrain * 0.7 && this.t % 0.3 < dt) A.sfx('paper');
          if (b.strain > this.maxStrain) { this.rip(); }
          if (inp.mouseIn(this.dumpster) || (b.x > this.dumpster.x && b.y < this.dumpster.y + 60)) { this.phase = 'newbag'; b.held = false; A.sfx('trash'); CH.doShake(3, 0.2); this.particles.burst(this.dumpster.x + 45, this.dumpster.y + 20, 12, { color: ['#6a5a2a', '#aaa', '#f5c33b'], speed: 60, life: 0.5 }); ui.setHint('Put a fresh bag in the bin!', 2.5); S.stats.binsEmptied++; }
        }
      } else if (this.phase === 'cleanup') {
        for (const t of this.trash) { if (!t.got && inp.mpressed && CH.dist(inp.mx, inp.my, t.x, t.y) < 10) { t.got = true; A.sfx('paper'); this.particles.burst(t.x, t.y, 4, { color: ['#aaa', '#f5c33b'], speed: 30, life: 0.3 }); } }
        if (this.trash.every((t) => t.got)) { this.phase = 'newbag'; ui.setHint('Put a fresh bag in the bin!', 2.5); }
      } else if (this.phase === 'newbag') {
        const nb = this.newBag; const r = { x: nb.x - 14, y: nb.y - 10, w: 28, h: 20 };
        if (inp.mpressed && inp.mouseIn(r)) nb.held = true; if (!inp.mdown) nb.held = false;
        if (nb.held) { nb.x = inp.mx; nb.y = inp.my; if (Math.abs(nb.x - 130) < 40 && Math.abs(nb.y - 110) < 60) { nb.placed = true; this.phase = 'done'; A.sfx('snap'); this.finish(CH.clamp(1.3 - this.t / (20 + this.difficulty * 5), 0.3, 1) - (this.bag.ripped ? 0.3 : 0), { label: this.bag.ripped ? 'It ripped. Brenda sighed.' : undefined }); } }
      }
      for (const f of this.flies) f.a += dt * f.s;
    }
    rip() {
      const b = this.bag; b.ripped = true; b.held = false; this.phase = 'cleanup'; A.sfx('explode'); CH.doShake(4, 0.3);
      this.particles.burst(b.x, b.y - 40, 30, { color: ['#6a5a2a', '#aaa', '#f5c33b', '#c8352b'], speed: 120, life: 0.8 });
      for (let i = 0; i < 8 + this.difficulty * 2; i++) this.trash.push({ x: CH.clamp(b.x + CH.rand(-90, 90), 20, W - 20), y: CH.clamp(b.y + CH.rand(-40, 60), 60, H - 20), k: i % 4, got: false });
      ui.setHint('IT RIPPED. Click every piece of trash!', 3); this.mistakes++;
    }
    draw(g) {
      // back alley / back room
      gfx.rect(0, 0, W, H, '#5a5a66'); for (let y = 0; y < 150; y += 10) for (let x = -((y / 10) & 1) * 10; x < W; x += 20) gfx.rect(x, y, 19, 9, (x + y) % 7 ? '#6a6a76' : '#62626e');
      gfx.rect(0, 150, W, H - 150, '#4a4a54'); for (let x = 0; x < W; x += 30) gfx.vline(x, 150, H - 150, '#3a3a44');
      // dumpster
      const d = this.dumpster; gfx.rect(d.x, d.y, d.w, d.h, '#2f6a3a'); gfx.rect(d.x - 4, d.y - 8, d.w + 8, 10, '#25552e'); gfx.rect(d.x + 4, d.y + 8, d.w - 8, 40, '#3a7a48'); gfx.text('DUMPSTER', d.x + d.w / 2, d.y + 20, '#fff', { align: 'center', font: 'small' }); gfx.text('DONALD\'S', d.x + d.w / 2, d.y + 28, '#f5c33b', { align: 'center', font: 'small' }); gfx.rect(d.x + 10, d.y + d.h, 10, 6, '#222'); gfx.rect(d.x + d.w - 20, d.y + d.h, 10, 6, '#222');
      // bin
      gfx.rect(90, 100, 80, 90, '#5a7a94'); gfx.rect(94, 104, 72, 82, '#6a8aa4'); gfx.rect(86, 94, 88, 8, '#42566b');
      // bag
      const b = this.bag;
      if (this.phase !== 'cleanup' || true) {
        if (!b.ripped || this.phase === 'cleanup') {
          const sq = this.phase === 'tie' ? 1 + this.hold.p * 0.1 : 1;
          if (!b.ripped) {
            gfx.ellipse(b.x, b.y - b.h / 2, (b.w / 2) * sq, (b.h / 2) * (2 - sq), '#1a1a24'); gfx.ellipse(b.x - 8, b.y - b.h / 2 - 10, 14, 10, '#2a2a38');
            if (this.phase === 'tie') { const p = this.hold.p; gfx.rect(b.x - 20 + p * 14, b.y - b.h - 8, 6, 12, '#c8352b'); gfx.rect(b.x + 14 - p * 14, b.y - b.h - 8, 6, 12, '#c8352b'); if (p > 0.95) gfx.circle(b.x, b.y - b.h - 4, 5, '#c8352b'); }
            else { gfx.circle(b.x, b.y - b.h + 2, 6, '#c8352b'); gfx.rect(b.x - 8, b.y - b.h + 2, 16, 3, '#c8352b'); }
            // overflowing trash peeking
            if (this.phase === 'tie') { gfx.rect(b.x - 24, b.y - b.h + 6, 8, 6, '#f5c33b'); F.cup(g, b.x + 20, b.y - b.h + 14, 0, 'S'); gfx.rect(b.x - 4, b.y - b.h + 2, 10, 4, '#fff'); }
            // strain cracks
            if (b.strain > this.maxStrain * 0.5) { for (let i = 0; i < 3; i++) gfx.line(b.x - 10 + i * 10, b.y - 40, b.x - 6 + i * 10, b.y - 25, '#6a5a2a'); }
          }
        }
      }
      for (const t of this.trash) if (!t.got) { if (t.k === 0) gfx.rect(t.x - 5, t.y - 3, 10, 6, '#f5c33b'); else if (t.k === 1) F.cup(g, t.x, t.y + 4, 0.1, 'S'); else if (t.k === 2) gfx.ellipse(t.x, t.y, 6, 3, '#8a4a1a'); else gfx.rect(t.x - 4, t.y - 4, 8, 8, '#f4f4f0'); }
      // flies
      for (const f of this.flies) { const fx = b.x + Math.cos(f.a) * f.r, fy = b.y - b.h / 2 + Math.sin(f.a * 1.3) * f.r * 0.5; gfx.px(fx, fy, '#111'); gfx.px(fx + (Math.sin(this.t * 40) > 0 ? 1 : -1), fy - 1, '#888'); }
      // new bag box
      gfx.rect(30, 226, 60, 30, '#c8a060'); gfx.text('BAGS', 60, 236, '#5a3a1a', { align: 'center', font: 'small' });
      if (this.phase === 'newbag' || this.phase === 'done') { const nb = this.newBag; if (!nb.placed) { gfx.rect(nb.x - 14, nb.y - 10, 28, 20, '#1a1a24'); gfx.rect(nb.x - 10, nb.y - 12, 20, 3, '#c8352b'); } else { gfx.rect(94, 104, 72, 20, '#1a1a24'); } }
      if (this.phase === 'tie') this.hold.draw(g, 'HOLD to tie');
      if (this.phase === 'carry') { ui.bar(b.x - 20, b.y - b.h - 16, 40, 4, b.strain / this.maxStrain, b.strain / this.maxStrain > 0.7 ? '#c8352b' : '#f5c33b'); gfx.text('STRAIN', b.x, b.y - b.h - 24, '#fff', { align: 'center', font: 'small', outline: '#000' }); }
      this.particles.draw(g);
      if (b.held || this.newBag.held) this.drawPaw(g, true);
      this.drawHud(g);
    }
  }
  CH.BinScene = BinScene;

  // ---------------------------------------------------------------- BATHROOM ----
  class BathroomScene extends CH.MinigameScene {
    constructor(opts = {}) {
      super({ title: 'CLEAN THE BATHROOM', hint: 'Scrub, restock, and... deal with the toilet.', difficulty: opts.difficulty || 1 });
      const d = this.difficulty;
      this.tasks = { scrub: false, tp: false, soap: false, plunge: d < 1.5 && Math.random() < 0.4 ? true : false, mirror: false, weird: false };
      if (d >= 2 || Math.random() < 0.4) this.tasks.plunge = false; // plunge false = needs doing
      this.needPlunge = !this.tasks.plunge; this.tasks.plunge = !this.needPlunge;
      this.weirdItem = d >= 1.5 || Math.random() < 0.5 ? CH.pick([['a visor', (g, x, y) => { gfx.rect(x - 8, y - 2, 16, 3, '#c8352b'); gfx.rect(x - 6, y - 4, 12, 2, '#c8352b'); gfx.px(x, y - 4, '#f5c33b'); }], ['a whole tray', (g, x, y) => F.tray(g, x, y)], ['a rubber duck', (g, x, y) => { gfx.ellipse(x, y, 6, 4, '#f5c33b'); gfx.circle(x + 5, y - 4, 3, '#f5c33b'); gfx.px(x + 7, y - 4, '#e8752c'); gfx.px(x + 5, y - 5, '#111'); }], ['a Blue Hedgehog cartridge', (g, x, y) => { gfx.rect(x - 7, y - 5, 14, 10, '#333'); gfx.rect(x - 5, y - 3, 10, 5, '#3b6fd6'); }]]) : null;
      this.tasks.weird = !this.weirdItem;
      this.ds = new CH.DragSystem(this);
      // scrub masks: toilet + sink
      this.grime = new CH.ScrubMask(60, 110, 120, 90, (c, w, h) => { const rng = new CH.Rng(99 + Date.now() % 999); for (let i = 0; i < 6 + d * 3; i++) gfx.ellipse(rng.range(10, w - 10), rng.range(10, h - 10), rng.range(6, 14), rng.range(4, 9), rng.pick(['rgba(120,100,60,0.85)', 'rgba(90,80,50,0.85)', 'rgba(160,140,90,0.8)'])); });
      this.sinkGrime = new CH.ScrubMask(300, 120, 110, 50, (c, w, h) => { const rng = new CH.Rng(5 + Date.now() % 777); for (let i = 0; i < 4 + d * 2; i++) gfx.ellipse(rng.range(10, w - 10), rng.range(8, h - 8), rng.range(6, 12), rng.range(3, 6), 'rgba(100,140,120,0.8)'); });
      this.mirrorGrime = new CH.ScrubMask(300, 40, 110, 60, (c, w, h) => { const rng = new CH.Rng(3 + Date.now() % 555); for (let i = 0; i < 5; i++) gfx.ellipse(rng.range(10, w - 10), rng.range(8, h - 8), rng.range(5, 10), rng.range(4, 8), 'rgba(200,200,220,0.7)'); gfx.text('WASH ME', w / 2, h / 2 - 3, 'rgba(80,80,100,0.8)', { align: 'center', font: 'small' }); });
      this.radius = has('brush2') ? 13 : 9; this.lastM = null;
      // TP roll item + holder target
      this.ds.add({ kind: 'tp', x: 440, y: 190, w: 16, h: 14, draw: (g, x, y) => { gfx.ellipse(x, y, 8, 7, '#fff'); gfx.ellipse(x, y, 3, 2.5, '#c8a060'); gfx.rect(x + 4, y - 2, 6, 4, '#fff'); } });
      this.ds.addTarget({ x: 30, y: 140, w: 24, h: 24, snap: 6, accepts: (it) => it.kind === 'tp', onDrop: (it) => { this.tasks.tp = true; it.locked = true; A.sfx('snap'); this.addCombo(); return true; }, draw: (g, t, hov) => { gfx.rect(t.x - 10, t.y - 12, 20, 3, '#8a8a94'); gfx.rect(t.x - 10, t.y - 12, 3, 8, '#8a8a94'); gfx.rect(t.x + 7, t.y - 12, 3, 8, '#8a8a94'); if (hov) gfx.ellipseOutline(t.x, t.y, 10, 9, '#f5c33b'); if (!this.tasks.tp) gfx.rect(t.x - 4, t.y - 2, 8, 3, '#c8a060'); } });
      if (this.weirdItem) { this.ds.add({ kind: 'weird', x: 120, y: 150, w: 20, h: 12, draw: (g, x, y) => this.weirdItem[1](g, x, y) }); }
      this.ds.addTarget({ x: 240, y: 200, w: 40, h: 40, snap: 8, accepts: (it) => it.kind === 'weird', onDrop: (it) => { this.ds.remove(it); this.tasks.weird = true; A.sfx('trash'); this.addCombo(); return true; }, draw: (g, t, hov) => { gfx.rect(t.x - 14, t.y - 20, 28, 40, hov ? '#7a9ab4' : '#5a7a94'); gfx.rect(t.x - 16, t.y - 24, 32, 5, '#42566b'); gfx.text('BIN', t.x, t.y, '#fff', { align: 'center', font: 'small' }); } });
      this.soapHold = new CH.HoldMeter({ x: 348, y: 76, w: 24, h: 30 }, has('cart') ? 1.0 : 1.8, { decay: 0.5, sfx: 'fill', color: '#9fdcff', onDone: () => { this.tasks.soap = true; A.sfx('good'); this.addCombo(); } });
      this.plunge = { pos: 0, hits: 0, dir: 1, active: false, needed: 3 + Math.floor(d) };
      this.flushT = 0;
    }
    progress() { const t = this.tasks; const n = Object.values(t).filter(Boolean).length; return n / Object.keys(t).length; }
    step(dt) {
      this.ds.update(dt); this.grime.update(dt); this.sinkGrime.update(dt); this.mirrorGrime.update(dt); this.soapHold.update(dt);
      // scrubbing (requires movement)
      if (inp.mdown && !this.ds.held) {
        if (this.lastM) {
          const d = CH.dist(this.lastM[0], this.lastM[1], inp.mx, inp.my);
          if (d > 1.5) { const steps = Math.max(1, Math.ceil(d / 3)); for (let i = 0; i <= steps; i++) { const px = CH.lerp(this.lastM[0], inp.mx, i / steps), py = CH.lerp(this.lastM[1], inp.my, i / steps); for (const m of [this.grime, this.sinkGrime, this.mirrorGrime]) if (m.contains(px, py)) m.erase(px, py, this.radius, 0.8); } if (this.t % 0.2 < dt) A.sfx('scrub'); if (Math.random() < 0.3) this.particles.add({ x: inp.mx + CH.rand(-6, 6), y: inp.my + CH.rand(-6, 6), vx: CH.rand(-15, 15), vy: -20, life: 0.3, color: '#fff', grav: 100 }); }
        }
        this.lastM = [inp.mx, inp.my];
      } else this.lastM = null;
      if (this.grime.fraction() < 0.05 && this.sinkGrime.fraction() < 0.05 && !this.tasks.scrub) { this.tasks.scrub = true; A.sfx('good'); this.addCombo(); }
      if (this.mirrorGrime.fraction() < 0.05 && !this.tasks.mirror) { this.tasks.mirror = true; A.sfx('good'); this.addCombo(); }
      // plunging
      if (this.needPlunge && !this.tasks.plunge) {
        const pr = { x: 90, y: 120, w: 60, h: 70 };
        if (inp.mouseIn(pr) && !this.ds.held) ui.cursor = 'hand';
        if (inp.clicked(pr)) {
          if (!this.plunge.active) { this.plunge.active = true; ui.setHint('Click when the marker is in the green zone!', 2.5); }
          else { const p = this.plunge.pos; if (p > 0.38 && p < 0.62) { this.plunge.hits++; A.sfx('splash'); CH.doShake(2, 0.15); this.particles.burst(120, 130, 8, { color: ['#9fdcff', '#6a8a6a'], speed: 50, life: 0.4 }); if (this.plunge.hits >= this.plunge.needed) { this.tasks.plunge = true; A.sfx('flush'); this.flushT = 1.5; this.addCombo(); } } else { A.sfx('error'); this.plunge.hits = Math.max(0, this.plunge.hits - 1); this.particles.burst(120, 130, 6, { color: ['#6a8a6a'], speed: 60, life: 0.4 }); this.mistakes++; } }
        }
        if (this.plunge.active) { this.plunge.pos += this.plunge.dir * dt * (1.4 + this.difficulty * 0.3); if (this.plunge.pos > 1) { this.plunge.pos = 1; this.plunge.dir = -1; } if (this.plunge.pos < 0) { this.plunge.pos = 0; this.plunge.dir = 1; } }
      }
      if (this.flushT > 0) this.flushT -= dt;
      if (this.progress() >= 1 && !this.finished) this.finish(CH.clamp(1.3 - this.t / (40 + this.difficulty * 10), 0.3, 1) - this.mistakes * 0.04);
    }
    draw(g) {
      // tiled bathroom
      gfx.rect(0, 0, W, H, '#cfe0e0'); for (let y = 0; y < 150; y += 12) for (let x = -((y / 12) & 1) * 12; x < W; x += 24) gfx.rect(x, y, 23, 11, (x * 3 + y) % 11 ? '#dbeaea' : '#c8dcdc');
      gfx.rect(0, 150, W, H - 150, '#8a9a9c'); for (let y = 150; y < H; y += 16) for (let x = 0; x < W; x += 16) gfx.rect(x + 1, y + 1, 14, 14, ((x + y) / 16) % 2 ? '#9aaaac' : '#a8b8ba');
      // stall walls
      gfx.rect(0, 30, 6, 160, '#5a7a94'); gfx.rect(180, 30, 6, 160, '#5a7a94'); gfx.rect(0, 30, 186, 4, '#5a7a94');
      // toilet
      gfx.rect(80, 100, 60, 30, '#f4f4f8'); gfx.rect(84, 104, 52, 22, '#e8e8ee'); gfx.ellipse(110, 150, 34, 18, '#f4f4f8'); gfx.ellipse(110, 148, 26, 12, this.needPlunge && !this.tasks.plunge ? '#6a8a6a' : '#9fdcff'); gfx.rect(90, 160, 40, 30, '#f4f4f8');
      if (this.needPlunge && !this.tasks.plunge) { for (let i = 0; i < 3; i++) gfx.px(100 + i * 10, 140 + Math.round(Math.sin(this.t * 3 + i) * 2), '#8ab08a'); gfx.text('CLOGGED', 110, 118, '#c8352b', { align: 'center', font: 'small' }); }
      if (this.flushT > 0) { for (let i = 0; i < 8; i++) gfx.px(90 + i * 5, 145 + Math.round(Math.sin(this.t * 20 + i) * 4), '#fff'); }
      if (this.needPlunge && !this.tasks.plunge) { gfx.rect(60, 140, 3, 40, '#c8a060'); gfx.ellipse(61, 182, 8, 5, '#c8352b'); if (this.plunge.active) { const px = 70, py = 90; gfx.rect(px, py, 80, 8, '#333'); gfx.rect(px + 30, py, 20, 8, '#4f9d3a'); gfx.rect(px + Math.round(this.plunge.pos * 78), py - 2, 3, 12, '#fff'); gfx.text(`PLUNGE ${this.plunge.hits}/${this.plunge.needed}`, 110, 78, '#fff', { align: 'center', font: 'small', outline: '#000' }); } }
      this.grime.draw(g);
      // sink + mirror
      gfx.rect(296, 36, 118, 68, '#8a8a94'); gfx.rect(300, 40, 110, 60, '#c8dce8'); gfx.rect(302, 42, 20, 56, 'rgba(255,255,255,0.4)');
      // reflection of chubby in mirror
      CH.drawChubby(g, 356, 100, { outfit: 'janitor', noShadow: true, face: 'focused', arm: 'up', sx: 0.9, sy: 0.9 });
      this.mirrorGrime.draw(g);
      gfx.rect(296, 118, 118, 30, '#f4f4f8'); gfx.ellipse(355, 134, 50, 12, '#e0e8ee'); gfx.rect(350, 100, 10, 18, '#aab'); gfx.rect(340, 100, 30, 4, '#aab');
      this.sinkGrime.draw(g);
      // soap dispenser
      gfx.rect(348, 76, 24, 30, '#e8e8f0'); gfx.rect(352, 80, 16, 18, this.tasks.soap ? '#f0a0b8' : '#fff'); gfx.rect(354, 106, 12, 4, '#8a8a94'); gfx.text('SOAP', 360, 68, '#333', { align: 'center', font: 'small' });
      if (!this.tasks.soap) { this.soapHold.draw(g, 'HOLD to refill'); }
      // supply shelf
      gfx.rect(420, 170, 56, 4, '#8a5a2b'); gfx.rect(420, 200, 56, 4, '#8a5a2b'); gfx.text('SUPPLIES', 448, 160, '#333', { align: 'center', font: 'small' });
      gfx.rect(424, 178, 14, 18, '#f0a0b8'); gfx.text('SOAP', 431, 184, '#fff', { align: 'center', font: 'small' });
      this.ds.draw(g);
      this.particles.draw(g);
      // checklist
      const tasks = [['Scrub toilet & sink', this.tasks.scrub], ['Wipe mirror', this.tasks.mirror], ['Replace toilet paper', this.tasks.tp], ['Refill soap', this.tasks.soap]];
      if (this.needPlunge) tasks.push(['Unclog toilet', this.tasks.plunge]);
      if (this.weirdItem) tasks.push(['Remove ' + this.weirdItem[0], this.tasks.weird]);
      const cy0 = H - 14 - tasks.length * 8;
      gfx.rect(W - 130, cy0 - 4, 126, 8 + tasks.length * 8, 'rgba(0,0,0,0.7)');
      tasks.forEach(([n, done], i) => gfx.text((done ? '✓ ' : '□ ') + n, W - 126, cy0 + i * 8, done ? '#8bd06a' : '#fff', { font: 'small' }));
      if (this.ds.held) this.drawPaw(g, true); else if (inp.mdown && this.lastM) { gfx.ellipse(inp.mx, inp.my, 7, 4, '#c8a060'); for (let i = 0; i < 5; i++) gfx.rect(inp.mx - 5 + i * 2, inp.my + 2, 1, 4, '#f4f4f0'); ui.cursor = 'none'; }
      this.drawHud(g);
    }
  }
  CH.BathroomScene = BathroomScene;

  // ---------------------------------------------------------------- RESTOCK -----
  class RestockScene extends CH.MinigameScene {
    constructor(opts = {}) {
      super({ title: 'RESTOCK SUPPLIES', hint: 'Drag each item into its matching dispenser.', difficulty: opts.difficulty || 1, timeLimit: 40 - Math.min(15, opts.difficulty * 3) });
      this.ds = new CH.DragSystem(this);
      const kinds = [['napkins', '#f4f4f0', 'NAPKINS'], ['straws', '#fff', 'STRAWS'], ['lidsS', '#e8e8f0', 'LIDS S'], ['lidsL', '#d8d8e8', 'LIDS L'], ['ketchup', '#c8352b', 'KETCHUP'], ['salt', '#fff', 'SALT'], ['forks', '#ddd', 'FORKS'], ['cups', '#f4f4f8', 'CUPS']];
      const n = Math.min(kinds.length, 4 + Math.floor(this.difficulty * 1.5));
      const use = CH.shuffle(kinds.slice()).slice(0, n);
      this.slots = [];
      use.forEach((k, i) => {
        const sx = 60 + i * ((W - 120) / Math.max(1, n - 1)), sy = 70;
        this.slots.push(this.ds.addTarget({ x: sx, y: sy, w: 34, h: 40, snap: 6, kind: k[0], filled: 0, need: 1 + (this.difficulty >= 2 ? 1 : 0), accepts: (it) => it.kind === k[0], onDrop: (it, t) => { this.ds.remove(it); t.filled++; this.addCombo(); return true; }, draw: (g, t, hov) => { gfx.rect(t.x - 17, t.y - 20, 34, 40, hov ? '#8a8a94' : '#6a6a74'); gfx.rect(t.x - 14, t.y - 17, 28, 20, t.filled >= t.need ? k[1] : '#333'); gfx.text(k[2], t.x, t.y + 8, '#fff', { align: 'center', font: 'small' }); if (t.filled < t.need) gfx.text('EMPTY', t.x, t.y - 10, '#c8352b', { align: 'center', font: 'small' }); if (has('cart') && this.ds.held && this.ds.held.kind === k[0]) gfx.frame(t.x - 18, t.y - 21, 36, 42, '#f5c33b'); } }));
      });
      // items in the box (shuffled)
      const items = []; for (const sl of this.slots) for (let i = 0; i < sl.need; i++) items.push(sl.kind);
      CH.shuffle(items);
      items.forEach((k, i) => { this.ds.add({ kind: k, x: 90 + (i % 6) * 60 + CH.rand(-6, 6), y: 180 + Math.floor(i / 6) * 34 + CH.rand(-4, 4), w: 26, h: 18, draw: (g, x, y, it) => this.drawItem(g, x, y, it) }); });
      // wrong drops
      for (const t of this.slots) { const od = t.onDrop; t.onDrop = od; }
      this.ds.targetAt = ((orig) => (x, y, item) => { const t = orig(x, y, item); if (!t) { const any = this.slots.find((s) => Math.abs(x - s.x) < 20 && Math.abs(y - s.y) < 24); if (any && any.kind !== item.kind) { this.mistakes++; A.sfx('error'); ui.toast('Wrong dispenser!', '#ff8080', 1); } } return t; })(this.ds.targetAt.bind(this.ds));
    }
    drawItem(g, x, y, it) {
      const k = it.kind;
      if (k === 'napkins') { gfx.rect(x - 12, y - 8, 24, 16, '#f4f4f0'); for (let i = 0; i < 4; i++) gfx.hline(x - 10, y - 5 + i * 4, 20, '#ddd'); gfx.text('D', x, y - 3, '#c8352b', { align: 'center', font: 'small' }); }
      else if (k === 'straws') { for (let i = 0; i < 5; i++) gfx.rect(x - 8 + i * 4, y - 8, 2, 16, i % 2 ? '#c8352b' : '#fff'); }
      else if (k === 'lidsS') { gfx.ellipse(x, y, 8, 3, '#e8e8f0'); gfx.ellipse(x, y - 2, 8, 3, '#f4f4f8'); gfx.text('S', x, y - 8, '#333', { align: 'center', font: 'small' }); }
      else if (k === 'lidsL') { gfx.ellipse(x, y, 12, 4, '#d8d8e8'); gfx.ellipse(x, y - 2, 12, 4, '#e8e8f0'); gfx.text('L', x, y - 10, '#333', { align: 'center', font: 'small' }); }
      else if (k === 'ketchup') { for (let i = 0; i < 3; i++) gfx.rect(x - 10 + i * 7, y - 5 + (i % 2) * 2, 6, 10, '#c8352b'); gfx.text('K', x, y - 3, '#fff', { align: 'center', font: 'small' }); }
      else if (k === 'salt') { gfx.rect(x - 5, y - 8, 10, 16, '#fff'); gfx.rect(x - 5, y - 10, 10, 3, '#8a8a94'); gfx.text('S', x, y - 3, '#333', { align: 'center', font: 'small' }); }
      else if (k === 'forks') { for (let i = 0; i < 3; i++) { gfx.rect(x - 6 + i * 5, y - 8, 1, 16, '#ddd'); gfx.rect(x - 7 + i * 5, y - 8, 3, 3, '#ddd'); } }
      else if (k === 'cups') { F.cup(g, x, y + 6, 0, 'M'); F.cup(g, x + 4, y + 4, 0, 'M'); }
    }
    progress() { const need = this.slots.reduce((a, s) => a + s.need, 0), got = this.slots.reduce((a, s) => a + s.filled, 0); return need ? got / need : 1; }
    step(dt) { this.ds.update(dt); if (this.progress() >= 1 && !this.finished) this.finish(CH.clamp(1.2 - this.t / this.timeLimit, 0.3, 1) - this.mistakes * 0.08); }
    draw(g) {
      gfx.rect(0, 0, W, H, '#c8b890'); for (let y = 0; y < 140; y += 12) for (let x = -((y / 12) & 1) * 12; x < W; x += 24) gfx.rect(x, y, 23, 11, (x + y) % 7 ? '#d8c8a0' : '#c8b890');
      gfx.rect(0, 140, W, H - 140, '#8a7a5a');
      // condiment counter
      gfx.rect(20, 92, W - 40, 8, '#5a5a66'); gfx.rect(20, 100, W - 40, 30, '#8a8a94'); gfx.text('CONDIMENT STATION', W / 2, 110, '#fff', { align: 'center', font: 'small' });
      // supply box
      gfx.rect(60, 160, W - 120, 90, '#c8a060'); gfx.rect(64, 164, W - 128, 82, '#e0c080'); gfx.text('SUPPLIES - HANDLE WITH CARE (or not)', W / 2, 168, '#8a5a1a', { align: 'center', font: 'small' });
      this.ds.draw(g);
      this.particles.draw(g);
      if (this.ds.held) this.drawPaw(g, true);
      this.drawHud(g);
    }
  }
  CH.RestockScene = RestockScene;

  CH.SCENES.mop = () => { const s = new CH.Scene(); s.enter = () => CH.game.push(new MopScene({ kind: 'ketchup', difficulty: 1 })); return s; };
  CH.SCENES.table = () => { const s = new CH.Scene(); s.enter = () => CH.game.push(new TableScene({ difficulty: 1 })); return s; };
  CH.SCENES.bin = () => { const s = new CH.Scene(); s.enter = () => CH.game.push(new BinScene({ difficulty: 1 })); return s; };
  CH.SCENES.bathroom = () => { const s = new CH.Scene(); s.enter = () => CH.game.push(new BathroomScene({ difficulty: 1 })); return s; };
  CH.SCENES.restock = () => { const s = new CH.Scene(); s.enter = () => CH.game.push(new RestockScene({ difficulty: 1 })); return s; };
})(window.CH);
