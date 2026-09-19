// ============================================================================
// JANITOR MINIGAMES: mop spills, clean tables, empty bins, bathrooms, restock
//
// Art rules here: the floor, walls and fixtures are flat background; the mop
// head, the bag, every piece of trash and every supply is an ink-outlined prop
// with a shading ramp, so it reads as something you can physically grab.
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, A = CH.audio, inp = CH.input, S = CH.state, F = CH.FOOD;
  const MG = CH.MG, art = CH.art;
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
      const edge = gfx.shade(m.color, -34);
      const pool = [];
      for (let i = 0; i < m.blobs; i++) pool.push([cx + rng.range(-70, 70) * sz, cy + rng.range(-40, 40) * sz, rng.range(25, 55) * sz, rng.range(15, 30) * sz]);
      // a darker, thicker edge first so the puddle has a meniscus
      for (const [bx, by, rx, ry] of pool) gfx.ellipse(bx, by, rx + 2, ry + 2, edge);
      for (const [bx, by, rx, ry] of pool) gfx.ellipse(bx, by, rx, ry, m.color);
      // tendrils creeping out of the puddle
      for (const [bx, by, rx, ry] of pool) {
        for (let k = 0; k < 4; k++) { const a = rng.range(0, Math.PI * 2), d = rng.range(0.9, 1.35); gfx.ellipse(bx + Math.cos(a) * rx * d, by + Math.sin(a) * ry * d, rng.range(3, 8), rng.range(2, 5), m.color); }
      }
      for (let i = 0; i < m.blobs; i++) { const bx = cx + rng.range(-60, 60) * sz, by = cy + rng.range(-30, 30) * sz; gfx.ellipse(bx, by, rng.range(12, 30) * sz, rng.range(8, 16) * sz, m.color2); }
      // sticky shine: the highlight sells "wet" more than any amount of colour
      for (const [bx, by, rx, ry] of pool) {
        gfx.ellipse(bx - rx * 0.3, by - ry * 0.45, rx * 0.3, ry * 0.2, 'rgba(255,255,255,0.22)');
        gfx.ellipse(bx + rx * 0.35, by + ry * 0.2, rx * 0.12, ry * 0.1, 'rgba(255,255,255,0.14)');
      }
      if (m.splatter) for (let i = 0; i < 40 * sz; i++) { const a = rng.range(0, Math.PI * 2), d = rng.range(50, 150) * sz; const px = cx + Math.cos(a) * d, py = cy + Math.sin(a) * d * 0.6; gfx.ellipse(px, py, rng.range(1, 4), rng.range(1, 3), m.color); gfx.px(px, py - 1, m.color2); }
      if (m.splatter) { // handprint
        const hx = cx + 90 * sz, hy = cy - 20; gfx.ellipse(hx, hy, 8, 10, m.color); for (let i = 0; i < 4; i++) gfx.ellipse(hx - 6 + i * 4, hy - 14 + (i === 1 || i === 2 ? -2 : 0), 2, 6, m.color); gfx.ellipse(hx - 10, hy + 2, 2, 5, m.color);
      }
      if (m.candles) { for (let i = 0; i < 5; i++) { gfx.rect(cx - 30 + i * 15, cy - 30, 3, 10, '#4fa8ff'); gfx.rect(cx - 30 + i * 15, cy - 30, 1, 10, '#9fdcff'); gfx.px(cx - 29 + i * 15, cy - 32, '#f5c33b'); gfx.px(cx - 29 + i * 15, cy - 33, '#fff0a0'); } }
      if (m.eyes) { for (let i = 0; i < 3; i++) { const ex = cx - 40 + i * 40, ey = cy + rng.range(-10, 10); gfx.ellipse(ex, ey, 5.5, 5.5, '#2a3a20'); gfx.ellipse(ex, ey, 4.6, 4.6, '#fff'); gfx.ellipse(ex + 1, ey, 2, 2, '#111'); gfx.px(ex, ey - 1, '#fff'); } }
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
    // A wet smear: a damp body with a brighter leading streak, so a swipe of the
    // mop leaves a visible arc on the tiles instead of a flat wash.
    wetTrail(px, py) {
      const c = this.wetCtx; const r = this.radius;
      c.fillStyle = 'rgba(126,178,236,0.14)';
      for (let yy = -r; yy <= r; yy += 1) { const hw = Math.floor(Math.sqrt(r * r - yy * yy)); c.fillRect(Math.round(px) - hw, Math.round(py + yy), hw * 2 + 1, 1); }
      c.fillStyle = 'rgba(214,238,255,0.16)';
      for (let i = -2; i <= 2; i++) c.fillRect(Math.round(px) - r + 1 + i, Math.round(py) - Math.round(r * 0.45), 2, 1);
      c.fillStyle = 'rgba(70,104,150,0.14)';
      c.fillRect(Math.round(px) - r, Math.round(py) + Math.round(r * 0.5), r * 2, 1);
    }
    drawFloor(g) {
      gfx.rect(0, 0, W, H, '#b9a68a');
      for (let y = 0; y < H; y += 24) for (let x = -((y / 24) & 1) * 24; x < W; x += 48) gfx.rect(x, y, 24, 24, '#c9b69a');
      // grout + a worn sheen so the tiles read as hard and polished
      for (let y = 0; y < H; y += 24) { gfx.hline(0, y, W, '#9a876a'); gfx.hline(0, y + 1, W, '#c3b192'); }
      for (let x = 0; x < W; x += 24) { gfx.vline(x, 0, H, '#9a876a'); gfx.vline(x + 1, 0, H, '#c3b192'); }
      for (let y = 0; y < H; y += 24) for (let x = 0; x < W; x += 24) if ((x * 3 + y * 5) % 7 === 0) gfx.rect(x + 2, y + 2, 20, 20, '#c2af93');
      MG.crumbs(0, 0, W, H, 70, ['#a89578', '#ae9c80', '#b5a288'], 3);
      // old drag scuffs, left by every janitor before Chubby
      for (let i = 0; i < 6; i++) { const sy = 40 + i * 36; gfx.line(20 + i * 17, sy, 120 + i * 23, sy + 14, 'rgba(120,102,76,0.25)'); }
    }
    drawBucket(g) {
      const b = this.bucket;
      const soup = this.water >= this.maxWater;
      const wc = gfx.mix('#5fa0ef', this.mess.color, CH.clamp(this.water / this.maxWater, 0, 1));
      const m = MG.m('#eab52c', { dark: -34, darker: -56, light: 26 });
      MG.shadow(b.x + b.w / 2, b.y + b.h, b.w / 2 - 2, 0.32);
      MG.ink(b.x + b.w / 2, b.y + b.h / 2, b.w + 8, b.h + 16, (cx, cy) => {
        const x0 = cx - b.w / 2, y0 = cy - b.h / 2;
        // handle behind the pail
        gfx.line(x0 + 4, y0 - 2, cx, y0 - 8, '#6a6a74'); gfx.line(x0 + b.w - 4, y0 - 2, cx, y0 - 8, '#6a6a74');
        gfx.line(x0 + 4, y0 - 3, cx, y0 - 9, '#a8acb6'); gfx.line(x0 + b.w - 4, y0 - 3, cx, y0 - 9, '#a8acb6');
        // tapered pail
        for (let i = 0; i < b.h; i++) { const k = i / b.h, ww = Math.round(b.w - k * 8); gfx.rect(cx - ww / 2, y0 + i, ww, 1, m.base); }
        gfx.rect(cx - b.w / 2 + 1, y0 + 2, 4, b.h - 4, m.l);
        gfx.rect(cx + b.w / 2 - 6, y0 + 2, 4, b.h - 6, m.d);
        for (const ry of [0.45, 0.72]) { const i = Math.round(b.h * ry), ww = Math.round(b.w - (i / b.h) * 8); gfx.rect(cx - ww / 2, y0 + i, ww, 1, m.d); gfx.rect(cx - ww / 2, y0 + i + 1, ww, 1, m.l); }
        // rim + water
        gfx.ellipse(cx, y0 + 2, b.w / 2, 4, m.d);
        gfx.ellipse(cx, y0 + 2, b.w / 2 - 1, 3.2, m.l);
        gfx.ellipse(cx, y0 + 4, b.w / 2 - 3, 6, gfx.shade(wc, -28));
        gfx.ellipse(cx, y0 + 3, b.w / 2 - 4, 5, wc);
        for (let i = 0; i < 3; i++) gfx.ellipse(cx - 10 + i * 10, y0 + 2 + Math.round(Math.sin(this.t * 3 + i) * 2), 3, 1.2, gfx.mix(wc, '#fff', soup ? 0.2 : 0.5));
        if (soup) for (let i = 0; i < 4; i++) gfx.ellipseOutline(cx - 12 + i * 8, y0 + 2 + Math.round(Math.sin(this.t * 2 + i * 2) * 2), 2, 1.2, 'rgba(210,230,200,0.7)');
        gfx.text('BUCKET', cx, y0 + b.h - 12, '#8a5a00', { align: 'center', font: 'small' });
      });
      if (soup) { MG.tag('SOUP', b.x + b.w / 2, b.y - 12, { align: 'center', face: MG.RED, color: '#fff2e6' }); art.effect('stink', b.x + b.w / 2 + 16, b.y - 4, this.t, 0.9); }
    }
    drawMop(g) {
      const r = this.radius;
      const dirtK = CH.clamp(this.dirt / this.capacity, 0, 1);
      const dirtyCol = gfx.mix('#f0ece0', this.mess.color, dirtK);
      const m = MG.m(dirtyCol, { dark: -26, darker: -46, light: 18 });
      const hx = W / 2 + (this.mopX - W / 2) * 0.3, hy = H + 10;
      // handle: four parallel lines make a rounded wooden pole at any angle
      gfx.line(hx - 2, hy, this.mopX - 2, this.mopY, art.INK);
      gfx.line(hx - 1, hy, this.mopX - 1, this.mopY, '#8a6236');
      gfx.line(hx, hy, this.mopX, this.mopY, '#cc9c54');
      gfx.line(hx + 1, hy, this.mopX + 1, this.mopY, '#e0b878');
      gfx.line(hx + 2, hy, this.mopX + 2, this.mopY, '#7a5528');
      gfx.line(hx + 3, hy, this.mopX + 3, this.mopY, art.INK);
      // head: rings of soft yarn seen from above, rounded tips, steel ferrule
      const drag = this.mopping && this.lastMX !== null ? Math.atan2(this.mopY - this.lastMY, this.mopX - this.lastMX) : null;
      MG.ink(this.mopX, this.mopY, r * 3 + 12, r * 3 + 12, (cx, cy) => {
        const spin = this.t * (this.mopping ? 3 : 0.4);
        const rings = [[1.34, m.dd, 2.7], [1.08, m.base, 2.5], [0.8, m.rim, 2.1]];
        for (const [f, col, wdt] of rings) {
          for (let i = 0; i < 16; i++) {
            const a = (i / 16) * Math.PI * 2 + spin * f;
            let len = r * f * (0.88 + ((i * 5) % 4) * 0.06);
            // strands trail behind the stroke, which is what makes a smear read
            if (drag !== null) { const d = Math.cos(a - drag); len *= 1 - d * 0.22; }
            const ex = cx + Math.cos(a) * len, ey = cy + Math.sin(a) * len * 0.95;
            gfx.tri(cx - Math.sin(a) * wdt, cy + Math.cos(a) * wdt, cx + Math.sin(a) * wdt, cy - Math.cos(a) * wdt, ex, ey, col);
            gfx.ellipse(ex, ey, wdt * 0.52, wdt * 0.52, col);
          }
        }
        gfx.ellipse(cx, cy + 1, r * 0.52, r * 0.46, m.dd);
        gfx.ellipse(cx, cy, r * 0.5, r * 0.44, m.d);
        gfx.ellipse(cx - r * 0.14, cy - r * 0.14, r * 0.3, r * 0.24, m.base);
        gfx.circle(cx, cy, 3, '#5f636d');
        gfx.circle(cx, cy, 2, '#9aa0aa');
        gfx.px(cx - 1, cy - 1, '#cfd4dc');
      });
      // it drips
      if (dirtK > 0.25 || this.water > 0) {
        for (let i = 0; i < 2; i++) { const k = ((this.t * 1.5 + i * 0.5) % 1); gfx.px(this.mopX - 5 + i * 9, this.mopY + r * 0.5 + k * 6, gfx.alpha(dirtK > 0.4 ? this.mess.color : '#7eb2ec', 1 - k)); }
      }
      if (this.gross) art.effect('stink', this.mopX, this.mopY - r, this.t, 1);
    }
    draw(g) {
      this.drawFloor(g);
      g.drawImage(this.wet, 0, 0);
      this.mask.draw(g);
      for (const f of this.fries) if (!f.got) {
        g.save(); g.translate(Math.round(f.x), Math.round(f.y)); g.rotate(f.a);
        MG.ink(0, 0, 18, 10, (cx, cy) => {
          gfx.rect(cx - 6, cy - 1, 12, 3, '#d9a62c');
          gfx.rect(cx - 6, cy - 1, 12, 2, '#f2c342');
          gfx.hline(cx - 5, cy - 1, 10, '#fbe08a');
        });
        g.restore();
      }
      this.drawBucket(g);
      // drain: a sunk metal grate in the tile
      const b = this.bucket;
      MG.ink(b.x - 18, H - 12, 24, 24, (cx, cy) => {
        gfx.circle(cx, cy, 10, '#6b6f78');
        gfx.circle(cx, cy, 9, '#4a4e57');
        gfx.circle(cx, cy, 6, '#23262c');
        for (let i = 0; i < 3; i++) { gfx.rect(cx - 5 + i * 4, cy - 6, 2, 12, '#5e626b'); gfx.vline(cx - 5 + i * 4, cy - 6, 12, '#8a8f99'); }
        gfx.ellipse(cx - 3, cy - 6, 4, 1.4, '#9aa0aa');
      });
      MG.tag('DRAIN', b.x - 18, H - 32, { align: 'center' });
      this.drawMop(g);
      this.particles.draw(g);
      // dirt / water readouts
      MG.tag('MOP', 6, 19);
      MG.meter(30, 21, 50, 5, this.dirt / this.capacity, this.gross ? MG.RED : '#a86a3a');
      MG.tag('WATER', 88, 19);
      MG.meter(122, 21, 40, 5, this.water / this.maxWater, this.water >= this.maxWater ? '#7a6a3a' : '#6fa8dc');
      if (this.sign) {
        // the little A-frame sign, planted the moment the floor is clean
        MG.shadow(W / 2, H / 2 - 4, 16, 0.3);
        MG.ink(W / 2, H / 2 - 18, 40, 34, (cx, cy) => {
          gfx.tri(cx - 13, cy + 14, cx - 3, cy + 14, cx - 1, cy - 14, '#c99a17');
          gfx.tri(cx + 3, cy + 14, cx + 13, cy + 14, cx + 1, cy - 14, '#c99a17');
          gfx.tri(cx - 14, cy + 14, cx + 12, cy + 14, cx - 1, cy - 14, '#f2c342');
          gfx.tri(cx - 11, cy + 12, cx + 2, cy + 12, cx - 1, cy - 10, '#fbdd7e');
          gfx.text('WET', cx - 2, cy - 6, '#3a2a08', { align: 'center', font: 'small' });
          gfx.text('FLOOR', cx - 2, cy + 2, '#3a2a08', { align: 'center', font: 'small' });
          gfx.rect(cx - 8, cy + 8, 14, 2, '#8a6a12');
        });
      }
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
      this.bin = this.ds.addTarget({
        x: 34, y: 150, w: 44, h: 60, kind: 'bin', accepts: (it) => it.kind !== 'tray',
        onDrop: (it) => { this.ds.remove(it); A.sfx('trash'); this.particles.burst(34, 120, 6, { color: ['#aaa', '#f5c33b'], speed: 30, life: 0.4 }); this.addCombo(); return true; },
        draw: (g, t, hov) => {
          const m = MG.m(hov ? '#7a9ab4' : '#5a7a94', { dark: -30, darker: -50, light: 26 });
          MG.shadow(t.x, t.y + 31, 22, 0.3);
          MG.ink(t.x, t.y, 54, 76, (cx, cy) => {
            gfx.rect(cx - 22, cy - 30, 44, 60, m.base);
            gfx.rect(cx - 22, cy - 30, 7, 60, m.l);
            gfx.rect(cx + 16, cy - 30, 6, 60, m.d);
            for (let i = 0; i < 3; i++) gfx.hline(cx - 21, cy - 14 + i * 16, 42, m.d);
            gfx.rect(cx - 24, cy - 34, 48, 6, m.dd);
            gfx.hline(cx - 24, cy - 34, 48, gfx.mix(m.l, '#fff', 0.2));
            gfx.rect(cx - 12, cy - 33, 24, 4, '#181320');       // the mouth
            gfx.rect(cx - 11, cy - 32, 22, 2, '#2a2436');
            gfx.text('TRASH', cx, cy, '#f3eee2', { align: 'center', font: 'small' });
          }, { outline: hov ? MG.GOLD : undefined });
        },
      });
      this.rack = this.ds.addTarget({
        x: W - 36, y: 150, w: 50, h: 60, kind: 'rack', accepts: (it) => it.kind === 'tray',
        onDrop: (it) => { this.ds.remove(it); A.sfx('snap'); this.traysDone++; this.addCombo(); return true; },
        draw: (g, t, hov) => {
          const m = MG.m(hov ? '#a8a8b8' : '#8a8a94', { dark: -30, darker: -48, light: 24 });
          MG.shadow(t.x, t.y + 31, 24, 0.3);
          MG.ink(t.x, t.y + 2, 58, 76, (cx, cy) => {
            cy -= 2;
            gfx.rect(cx - 24, cy - 30, 48, 60, m.d);
            gfx.rect(cx - 22, cy - 30, 44, 58, m.base);
            gfx.vline(cx - 22, cy - 30, 58, m.l);
            for (let i = 0; i < 4; i++) { gfx.rect(cx - 20, cy - 22 + i * 12, 40, 2, m.dd); gfx.hline(cx - 20, cy - 23 + i * 12, 40, m.l); }
            for (let i = 0; i < this.traysDone; i++) { gfx.rect(cx - 18, cy - 26 + i * 12, 36, 3, '#8f3333'); gfx.hline(cx - 18, cy - 26 + i * 12, 36, '#c05050'); }
            gfx.text('TRAYS', cx, cy + 20, '#f3eee2', { align: 'center', font: 'small' });
          }, { outline: hov ? MG.GOLD : undefined });
        },
      });
      this.traysDone = 0;
      this.mask = new CH.ScrubMask(90, 50, 300, 150, (c, w, h) => {
        const rng = new CH.Rng(7 + Date.now() % 1000);
        for (let i = 0; i < 4 + this.difficulty * 2; i++) {
          const sx = rng.range(20, w - 20), sy = rng.range(20, h - 20), rx = rng.range(8, 20), ry = rng.range(5, 12);
          const col = rng.pick(['rgba(180,40,40,0.9)', 'rgba(230,200,80,0.9)', 'rgba(120,80,40,0.8)']);
          gfx.ellipse(sx, sy, rx + 1, ry + 1, 'rgba(60,30,20,0.45)');
          gfx.ellipse(sx, sy, rx, ry, col);
          gfx.ellipse(sx - rx * 0.3, sy - ry * 0.4, rx * 0.3, ry * 0.25, 'rgba(255,255,255,0.28)');
          for (let k = 0; k < 3; k++) gfx.ellipse(sx + rng.range(-rx * 1.5, rx * 1.5), sy + rng.range(-ry * 1.6, ry * 1.6), rng.range(1, 3), rng.range(1, 2), col);
        }
        for (let i = 0; i < 40; i++) gfx.px(rng.range(0, w), rng.range(0, h), '#f0e8d0');
      });
      this.radius = has('rag2') ? 14 : 10; this.lastM = null; this.phase = 1;
    }
    drawItem(g, x, y, it) {
      switch (it.kind) {
        case 'wrapper':
          MG.ink(x, y, 24, 16, (cx, cy) => {
            const m = MG.m('#f2c342', { dark: -30, light: 22 });
            gfx.rect(cx - 10, cy - 6, 20, 12, m.base);
            for (let i = 0; i < 5; i++) gfx.vline(cx - 9 + i * 4, cy - 5, 10, i % 2 ? m.d : gfx.mix(m.base, '#fff', 0.3));
            gfx.hline(cx - 10, cy - 6, 20, m.l);
            gfx.px(cx + 3, cy + 1, MG.RED); gfx.px(cx - 4, cy - 2, '#c86a2a');
          });
          break;
        case 'cup': F.cup(g, x, y + 8, 0.2, 'M', '#5a2a10', true); break;
        case 'fries': F.friesBox(g, x, y + 8, 0.15, 'M'); break;
        case 'napkin':
          MG.ink(x, y, 20, 14, (cx, cy) => {
            gfx.rect(cx - 8, cy - 5, 16, 10, '#e6e4dc');
            gfx.rect(cx - 8, cy - 5, 16, 8, '#f6f4ee');
            gfx.hline(cx - 7, cy - 4, 14, '#ffffff');
            gfx.rect(cx - 6, cy - 3, 6, 2, '#c8352b');
            gfx.px(cx - 3, cy + 1, '#d9a62c');
          });
          break;
        case 'straw':
          MG.ink(x, y, 10, 22, (cx, cy) => {
            gfx.rect(cx - 1, cy - 9, 3, 18, '#f4f4f8');
            gfx.vline(cx - 1, cy - 9, 18, '#ffffff');
            for (let i = 0; i < 4; i++) gfx.rect(cx - 1, cy - 8 + i * 5, 3, 2, '#c8352b');
          });
          break;
        case 'halfburger':
          MG.ink(x, y, 30, 22, (cx, cy) => {
            const bm = MG.m('#d09343', { dark: -32, light: 24 });
            const pm = MG.m('#57301a', { dark: -24, light: 22 });
            gfx.ellipse(cx, cy + 5, 12, 3.6, bm.d);
            gfx.rect(cx - 12, cy + 1, 25, 4, bm.base);
            gfx.ellipse(cx, cy + 1, 12, 2.4, bm.l);
            gfx.ellipse(cx, cy - 1, 11, 3.4, pm.d);
            gfx.ellipse(cx, cy - 2, 11, 3.2, pm.base);
            // a bite taken out of the top bun
            gfx.ellipse(cx - 3, cy - 6, 10, 4.6, bm.d);
            gfx.ellipse(cx - 3, cy - 7, 10, 4.4, bm.base);
            gfx.ellipse(cx - 5, cy - 8, 5, 2, bm.l);
            gfx.ellipse(cx + 7, cy - 6, 4, 3.4, bm.dd);
            for (const [sx, sy] of [[-7, -9], [-2, -10], [2, -9]]) { gfx.rect(cx + sx, cy + sy, 2, 1, '#fff5de'); }
          });
          break;
        case 'toy':
          MG.ink(x, y, 18, 22, (cx, cy) => {
            const m = MG.m('#e8dcc0', { dark: -26, light: 18 });
            gfx.ellipse(cx, cy + 1, 6, 8, m.d);
            gfx.ellipse(cx, cy, 5.8, 7.6, m.base);
            gfx.ellipse(cx - 2, cy - 3, 2.6, 3, m.l);
            gfx.rect(cx - 4, cy - 1, 8, 1, '#5a3a1a');
            gfx.px(cx - 2, cy - 4, '#111'); gfx.px(cx + 2, cy - 4, '#111');
            gfx.px(cx - 2, cy - 5, '#fff'); gfx.px(cx + 2, cy - 5, '#fff');
            gfx.rect(cx - 1, cy + 2, 2, 1, '#8a3a2a');
          });
          break;
        case 'nuggetbox':
          MG.ink(x, y, 22, 16, (cx, cy) => {
            const m = MG.m('#c8352b', { dark: -28, light: 28 });
            gfx.rect(cx - 9, cy - 5, 18, 10, m.base);
            gfx.rect(cx - 9, cy - 5, 4, 10, m.l);
            gfx.rect(cx + 6, cy - 5, 3, 10, m.d);
            gfx.rect(cx - 8, cy - 7, 16, 3, m.l);
            gfx.hline(cx - 8, cy - 7, 16, gfx.mix(m.l, '#fff', 0.4));
            gfx.ellipse(cx - 2, cy - 1, 4, 3, '#c98f38');
            gfx.ellipse(cx - 2, cy - 2, 3.6, 2.6, '#daa244');
            gfx.px(cx - 3, cy - 3, '#f2c973');
          });
          break;
        case 'pie': F.pie(g, x, y); break;
        default: MG.ink(x, y, 16, 16, (cx, cy) => gfx.rect(cx - 6, cy - 6, 12, 12, '#888'));
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
      // dining room floor
      gfx.rect(0, 0, W, H, '#6a5a4a');
      for (let y = 0; y < H; y += 20) for (let x = -((y / 20) & 1) * 20; x < W; x += 40) gfx.rect(x, y, 20, 20, '#735f4d');
      for (let y = 0; y < H; y += 20) gfx.hline(0, y, W, '#5c4d3f');
      for (let x = 0; x < W; x += 20) gfx.vline(x, 0, H, '#5c4d3f');
      MG.crumbs(0, 0, W, H, 40, ['#7d6a56', '#5f5044'], 9);
      // table: dark rim, laminate top, chrome edge highlight
      gfx.rect(78, 38, 324, 176, '#241a10');
      gfx.rect(80, 40, 320, 170, '#3a2a1a');
      gfx.rect(86, 46, 308, 158, '#e8c890');
      for (let i = 0; i < 20; i++) gfx.hline(90, 52 + i * 8, 300, '#e0bc80');
      for (let i = 0; i < 26; i++) gfx.hline(88 + (i % 3), 50 + i * 6, 290 - (i % 4) * 20, 'rgba(198,158,104,0.35)');
      gfx.rect(86, 46, 308, 2, '#f8e0b0');
      gfx.rect(86, 202, 308, 2, '#cfa66c');
      gfx.vline(86, 46, 158, '#f4dba8'); gfx.vline(393, 46, 158, '#cfa66c');
      MG.crumbs(92, 52, 296, 146, 26, ['#c9a26a', '#f4e6c8'], 4);
      this.mask.draw(g);
      this.ds.draw(g);
      this.particles.draw(g);
      if (this.phase === 2) {
        const x = inp.mx, y = inp.my;
        const wiping = inp.mdown && this.lastM;
        MG.ink(x, y, 26, 18, (cx, cy) => {
          const m = MG.m('#4b96e0', { dark: -30, light: 26 });
          gfx.rect(cx - 10, cy - 6, 20, 12, m.d);
          gfx.rect(cx - 10, cy - 6, 20, 10, m.base);
          for (let i = 0; i < 4; i++) gfx.hline(cx - 8, cy - 4 + i * 3, 16, i % 2 ? m.l : m.d);
          gfx.rect(cx - 10, cy - 6, 20, 1, gfx.mix(m.l, '#fff', 0.4));
          gfx.tri(cx + 8, cy - 6, cx + 12, cy - 2, cx + 8, cy + 2, m.base);   // folded corner
        });
        if (wiping) for (let i = 0; i < 3; i++) gfx.px(x + CH.rand(-12, 12), y + CH.rand(-8, 8), 'rgba(255,255,255,0.7)');
        ui.cursor = 'none';
      } else if (this.ds.held) this.drawPaw(g, true);
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
    drawBag(g) {
      const b = this.bag;
      const sq = this.phase === 'tie' ? 1 + this.hold.p * 0.1 : 1;
      const strainK = CH.clamp(b.strain / this.maxStrain, 0, 1);
      MG.shadow(b.x, b.y + 1, b.w / 2 - 4, 0.3);
      MG.ink(b.x, b.y - b.h / 2, b.w + 22, b.h + 34, (cx, cy) => {
        const rx = (b.w / 2) * sq, ry = (b.h / 2) * (2 - sq);
        // heavy plastic sack: base, lit shoulder, a couple of lumpy contents
        gfx.ellipse(cx, cy + 2, rx, ry, '#1a1826');
        gfx.ellipse(cx, cy, rx - 1, ry - 1, '#2e2b3e');
        gfx.ellipse(cx - rx * 0.35, cy - ry * 0.3, rx * 0.5, ry * 0.42, '#413d57');
        gfx.ellipse(cx - rx * 0.4, cy - ry * 0.45, rx * 0.26, ry * 0.16, '#5d5878');   // plastic sheen
        gfx.ellipse(cx - rx * 0.42, cy - ry * 0.5, rx * 0.12, ry * 0.07, '#8d86ac');
        gfx.ellipse(cx + rx * 0.45, cy + ry * 0.25, rx * 0.3, ry * 0.25, '#221f2e');
        gfx.ellipse(cx - 8, cy - ry + 4, 13, 9, '#383349');   // lumps pressing out
        gfx.ellipse(cx + 12, cy + 6, 10, 8, '#272435');
        // rim light down the lit edge so the sack pops off the dark bin
        for (let i = -3; i <= 3; i++) gfx.px(cx - rx * 0.92 + Math.abs(i) * 0.35, cy - ry * 0.15 + i * 3, '#6b6588');
        const topY = cy - ry - 2;
        if (this.phase === 'tie') {
          const p = this.hold.p;
          gfx.rect(cx - 20 + p * 14, topY - 4, 6, 12, '#22202e');
          gfx.rect(cx + 14 - p * 14, topY - 4, 6, 12, '#22202e');
          gfx.rect(cx - 19 + p * 14, topY - 4, 2, 12, '#3d3a50');
          if (p > 0.95) { gfx.circle(cx, topY + 2, 5, '#a82a22'); gfx.circle(cx, topY + 1, 4, MG.RED); gfx.px(cx - 1, topY - 1, '#f08a7a'); }
          // overflowing trash peeking out of the mouth
          gfx.rect(cx - 24, topY + 8, 8, 6, '#f2c342'); gfx.hline(cx - 24, topY + 8, 8, '#fbe08a');
          gfx.rect(cx - 4, topY + 4, 10, 4, '#f2f0e6');
          gfx.rect(cx + 14, topY + 6, 8, 10, '#e8e8f0'); gfx.rect(cx + 15, topY + 7, 6, 4, MG.RED);
        } else {
          gfx.circle(cx, topY + 4, 6, '#8f231c');
          gfx.circle(cx, topY + 3, 5, MG.RED);
          gfx.rect(cx - 8, topY + 4, 16, 3, MG.RED);
          gfx.hline(cx - 8, topY + 4, 16, '#e0655a');
          gfx.px(cx - 2, topY, '#f0a090');
        }
        if (strainK > 0.5) {
          for (let i = 0; i < 3; i++) {
            gfx.line(cx - 10 + i * 10, cy + 4, cx - 6 + i * 10, cy + 18, '#6a5a2a');
            if (strainK > 0.8) gfx.line(cx - 9 + i * 10, cy + 5, cx - 5 + i * 10, cy + 16, '#a89040');
          }
        }
      });
    }
    draw(g) {
      // back alley: brick wall over wet asphalt
      gfx.rect(0, 0, W, H, '#5a5a66');
      for (let y = 0; y < 150; y += 10) for (let x = -((y / 10) & 1) * 10; x < W; x += 20) {
        const k = (x * 3 + y * 7) % 9;
        gfx.rect(x, y, 19, 9, k === 0 ? '#5f5f6b' : k === 4 ? '#6f6f7b' : '#696975');
        gfx.hline(x, y, 19, '#787885');
        gfx.hline(x, y + 8, 19, '#4e4e59');
      }
      for (let i = 0; i < 26; i++) gfx.px((i * 97) % W, (i * 53) % 150, 'rgba(30,30,40,0.5)');
      gfx.rect(0, 150, W, H - 150, '#4a4a54');
      gfx.hline(0, 150, W, '#6a6a76');
      for (let x = 0; x < W; x += 30) gfx.vline(x, 150, H - 150, '#3f3f49');
      for (let i = 0; i < 40; i++) gfx.px((i * 61) % W, 152 + ((i * 37) % (H - 154)), i % 3 ? '#44444e' : '#55555f');
      // a damp patch under the dumpster
      g.globalAlpha = 0.25; gfx.ellipse(W - 45, 196, 52, 8, '#2a2a36'); g.globalAlpha = 1;
      // alley dressing: a drain pipe, a wall lamp with a cone, old graffiti
      gfx.rect(212, 0, 7, 150, '#4a4a56');
      gfx.rect(213, 0, 3, 150, '#6a6a78');
      for (let y = 20; y < 150; y += 44) { gfx.rect(210, y, 11, 5, '#3f3f4a'); gfx.hline(210, y, 11, '#7a7a88'); }
      gfx.rect(330, 20, 22, 5, '#3a3a44');
      gfx.rect(334, 25, 14, 7, '#2b2b34');
      gfx.rect(335, 30, 12, 3, '#ffe9a8');
      g.globalAlpha = 0.07;
      gfx.tri(334, 33, 348, 33, 300, 150, '#ffe08a');
      gfx.tri(348, 33, 384, 150, 300, 150, '#ffe08a');
      g.globalAlpha = 1;
      gfx.text('D', 268, 60, 'rgba(210,80,70,0.35)', { align: 'center' });
      gfx.text('WAS HERE', 268, 72, 'rgba(210,80,70,0.25)', { align: 'center', font: 'small' });
      // a flattened box nobody took to the dumpster
      MG.ink(350, 176, 54, 24, (cx, cy) => {
        gfx.rect(cx - 24, cy - 7, 48, 14, '#a9824c');
        gfx.rect(cx - 24, cy - 7, 48, 3, '#c8a060');
        gfx.hline(cx - 24, cy - 8, 48, '#dcb87e');
        for (let i = 0; i < 3; i++) gfx.vline(cx - 12 + i * 12, cy - 6, 12, '#8a6a3a');
      });
      // dumpster
      const d = this.dumpster;
      const dm = MG.m('#2f6a3a', { dark: -30, darker: -50, light: 28 });
      MG.shadow(d.x + d.w / 2, d.y + d.h + 5, d.w / 2, 0.35);
      MG.ink(d.x + d.w / 2, d.y + d.h / 2, d.w + 16, d.h + 34, (cx, cy) => {
        const x0 = cx - d.w / 2, y0 = cy - d.h / 2;
        gfx.rect(x0, y0, d.w, d.h, dm.base);
        gfx.rect(x0, y0, 8, d.h, dm.l);
        gfx.rect(x0 + d.w - 9, y0, 9, d.h, dm.d);
        for (let i = 0; i < 4; i++) gfx.vline(x0 + 18 + i * 18, y0 + 6, d.h - 12, dm.d);
        gfx.rect(x0 + 4, y0 + 8, d.w - 8, 40, dm.dd);       // the recessed panel
        gfx.rect(x0 + 5, y0 + 9, d.w - 10, 38, gfx.shade(dm.base, -12));
        gfx.text('DUMPSTER', cx, y0 + 20, '#eef6ee', { align: 'center', font: 'small' });
        gfx.text("DONALD'S", cx, y0 + 28, '#f5c33b', { align: 'center', font: 'small' });
        // lid, flung open toward the wall
        gfx.rect(x0 - 4, y0 - 8, d.w + 8, 10, gfx.shade(dm.d, -6));
        gfx.rect(x0 - 4, y0 - 8, d.w + 8, 3, dm.base);
        gfx.hline(x0 - 4, y0 - 8, d.w + 8, dm.l);
        gfx.rect(x0 + 10, y0 + d.h, 10, 6, '#1d1d26');
        gfx.rect(x0 + d.w - 20, y0 + d.h, 10, 6, '#1d1d26');
        gfx.circle(x0 + 15, y0 + d.h + 5, 3, '#2b2b36');
        gfx.circle(x0 + d.w - 15, y0 + d.h + 5, 3, '#2b2b36');
      });
      // bin
      const bm = MG.m('#5a7a94', { dark: -28, darker: -48, light: 26 });
      MG.shadow(130, 192, 42, 0.3);
      MG.ink(130, 142, 100, 110, (cx, cy) => {
        gfx.rect(cx - 40, cy - 42, 80, 90, bm.base);
        gfx.rect(cx - 40, cy - 42, 10, 90, bm.l);
        gfx.rect(cx + 28, cy - 42, 12, 90, bm.d);
        for (let i = 0; i < 3; i++) gfx.hline(cx - 39, cy - 20 + i * 22, 78, bm.d);
        gfx.rect(cx - 44, cy - 48, 88, 8, bm.dd);
        gfx.hline(cx - 44, cy - 48, 88, gfx.mix(bm.l, '#fff', 0.2));
        gfx.rect(cx - 30, cy - 46, 60, 5, '#181320');
        gfx.text('SWING TOP', cx, cy + 32, '#dfe6ee', { align: 'center', font: 'small' });
      });
      // bag
      const b = this.bag;
      if (!b.ripped) this.drawBag(g);
      for (const t of this.trash) if (!t.got) {
        MG.ink(t.x, t.y, 18, 16, (cx, cy) => {
          if (t.k === 0) { gfx.rect(cx - 5, cy - 3, 10, 6, '#d9a62c'); gfx.rect(cx - 5, cy - 3, 10, 4, '#f2c342'); gfx.hline(cx - 4, cy - 3, 8, '#fbe08a'); }
          else if (t.k === 1) { gfx.rect(cx - 4, cy - 5, 8, 10, '#e4e4ec'); gfx.rect(cx - 3, cy - 5, 6, 10, '#f6f6fb'); gfx.rect(cx - 3, cy - 3, 6, 2, MG.RED); }
          else if (t.k === 2) { gfx.ellipse(cx, cy + 1, 6, 3, '#6d3a14'); gfx.ellipse(cx, cy, 5.6, 2.6, '#8a4a1a'); gfx.px(cx - 2, cy - 1, '#b06a2a'); }
          else { gfx.rect(cx - 4, cy - 4, 8, 8, '#e2e0d8'); gfx.rect(cx - 4, cy - 4, 8, 6, '#f4f4f0'); gfx.px(cx + 1, cy + 1, '#c8a060'); }
        });
      }
      // flies
      for (const f of this.flies) { const fx = b.x + Math.cos(f.a) * f.r, fy = b.y - b.h / 2 + Math.sin(f.a * 1.3) * f.r * 0.5; gfx.px(fx, fy, '#111'); gfx.px(fx + (Math.sin(this.t * 40) > 0 ? 1 : -1), fy - 1, '#888'); }
      if (this.phase === 'tie' || this.phase === 'carry') art.effect('stink', b.x + 26, b.y - b.h + 6, this.t, 1);
      // fresh bag box
      MG.ink(60, 241, 68, 38, (cx, cy) => {
        const m = MG.m('#c8a060', { dark: -30, light: 22 });
        gfx.rect(cx - 30, cy - 15, 60, 30, m.base);
        gfx.rect(cx - 30, cy - 15, 60, 4, m.l);
        gfx.rect(cx - 30, cy + 11, 60, 4, m.d);
        gfx.rect(cx - 12, cy - 15, 24, 30, gfx.shade(m.base, -8));
        gfx.text('BAGS', cx, cy - 5, '#5a3a1a', { align: 'center', font: 'small' });
        gfx.rect(cx - 8, cy + 2, 16, 5, '#22202e');
      });
      if (this.phase === 'newbag' || this.phase === 'done') {
        const nb = this.newBag;
        if (!nb.placed) {
          MG.ink(nb.x, nb.y, 34, 26, (cx, cy) => {
            gfx.rect(cx - 14, cy - 10, 28, 20, '#1a1a24');
            gfx.rect(cx - 13, cy - 9, 12, 18, '#2c2a3c');
            gfx.rect(cx - 10, cy - 12, 20, 3, MG.RED);
            gfx.hline(cx - 10, cy - 12, 20, '#e0655a');
          });
        } else { gfx.rect(94, 104, 72, 20, '#1a1a24'); gfx.rect(96, 104, 20, 18, '#2c2a3c'); }
      }
      if (this.phase === 'tie') this.hold.draw(g, 'HOLD to tie');
      if (this.phase === 'carry') {
        const k = b.strain / this.maxStrain;
        MG.meter(b.x - 20, b.y - b.h - 16, 40, 5, k, k > 0.7 ? MG.RED : '#f5c33b');
        MG.tag('STRAIN', b.x, b.y - b.h - 29, { align: 'center', face: k > 0.7 ? MG.RED : MG.CREAM, color: k > 0.7 ? '#fff2e6' : '#241c30' });
      }
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
      this.weirdItem = d >= 1.5 || Math.random() < 0.5 ? CH.pick([
        ['a visor', (g, x, y) => MG.ink(x, y, 22, 12, (cx, cy) => { gfx.rect(cx - 8, cy - 2, 16, 3, '#a82a22'); gfx.rect(cx - 8, cy - 2, 16, 2, MG.RED); gfx.rect(cx - 6, cy - 4, 12, 2, '#e0655a'); gfx.px(cx, cy - 4, '#f5c33b'); })],
        ['a whole tray', (g, x, y) => F.tray(g, x, y)],
        ['a rubber duck', (g, x, y) => MG.ink(x, y, 22, 16, (cx, cy) => { const m = MG.m('#f2c342', { dark: -28, light: 24 }); gfx.ellipse(cx, cy + 1, 6, 4, m.d); gfx.ellipse(cx, cy, 5.8, 3.8, m.base); gfx.circle(cx + 5, cy - 4, 3.2, m.d); gfx.circle(cx + 5, cy - 4, 2.8, m.base); gfx.px(cx + 4, cy - 5, m.l); gfx.rect(cx + 7, cy - 4, 3, 2, '#e8752c'); gfx.px(cx + 5, cy - 5, '#111'); })],
        ['a Blue Hedgehog cartridge', (g, x, y) => MG.ink(x, y, 20, 14, (cx, cy) => { gfx.rect(cx - 7, cy - 5, 14, 10, '#2e2e36'); gfx.rect(cx - 7, cy - 5, 14, 2, '#4a4a56'); gfx.rect(cx - 5, cy - 3, 10, 5, '#3b6fd6'); gfx.hline(cx - 5, cy - 3, 10, '#6fa2ff'); gfx.rect(cx - 5, cy + 3, 10, 2, '#22222a'); })],
      ]) : null;
      this.tasks.weird = !this.weirdItem;
      this.ds = new CH.DragSystem(this);
      // scrub masks: toilet + sink
      this.grime = new CH.ScrubMask(60, 110, 120, 90, (c, w, h) => { const rng = new CH.Rng(99 + Date.now() % 999); for (let i = 0; i < 6 + d * 3; i++) { const sx = rng.range(10, w - 10), sy = rng.range(10, h - 10), rx = rng.range(6, 14), ry = rng.range(4, 9); gfx.ellipse(sx, sy, rx + 1, ry + 1, 'rgba(60,48,26,0.6)'); gfx.ellipse(sx, sy, rx, ry, rng.pick(['rgba(120,100,60,0.85)', 'rgba(90,80,50,0.85)', 'rgba(160,140,90,0.8)'])); gfx.ellipse(sx - rx * 0.3, sy - ry * 0.4, rx * 0.25, ry * 0.2, 'rgba(255,240,190,0.25)'); } });
      this.sinkGrime = new CH.ScrubMask(300, 120, 110, 50, (c, w, h) => { const rng = new CH.Rng(5 + Date.now() % 777); for (let i = 0; i < 4 + d * 2; i++) { const sx = rng.range(10, w - 10), sy = rng.range(8, h - 8); gfx.ellipse(sx, sy, rng.range(6, 12), rng.range(3, 6), 'rgba(100,140,120,0.8)'); gfx.px(sx, sy - 2, 'rgba(220,255,240,0.4)'); } });
      this.mirrorGrime = new CH.ScrubMask(300, 40, 110, 60, (c, w, h) => { const rng = new CH.Rng(3 + Date.now() % 555); for (let i = 0; i < 5; i++) gfx.ellipse(rng.range(10, w - 10), rng.range(8, h - 8), rng.range(5, 10), rng.range(4, 8), 'rgba(200,200,220,0.7)'); gfx.text('WASH ME', w / 2, h / 2 - 3, 'rgba(80,80,100,0.8)', { align: 'center', font: 'small' }); });
      this.radius = has('brush2') ? 13 : 9; this.lastM = null;
      // TP roll item + holder target
      this.ds.add({
        kind: 'tp', x: 440, y: 190, w: 16, h: 14,
        draw: (g, x, y) => MG.ink(x, y, 26, 20, (cx, cy) => {
          gfx.ellipse(cx, cy + 1, 8, 7, '#dedbd2');
          gfx.ellipse(cx, cy, 8, 6.8, '#f8f6f0');
          gfx.ellipse(cx - 2, cy - 2, 3.4, 2.4, '#ffffff');
          gfx.ellipse(cx, cy, 3, 2.6, '#c8a060');
          gfx.ellipse(cx, cy, 2.2, 1.8, '#8a6a3a');
          gfx.rect(cx + 4, cy - 2, 7, 4, '#f2f0e8');
          gfx.hline(cx + 4, cy - 2, 7, '#ffffff');
        }),
      });
      this.ds.addTarget({
        x: 30, y: 140, w: 24, h: 24, snap: 6, accepts: (it) => it.kind === 'tp',
        onDrop: (it) => { this.tasks.tp = true; it.locked = true; A.sfx('snap'); this.addCombo(); return true; },
        draw: (g, t, hov) => {
          MG.ink(t.x, t.y - 6, 30, 26, (cx, cy) => {
            gfx.rect(cx - 10, cy - 6, 20, 3, '#7e828c');
            gfx.hline(cx - 10, cy - 6, 20, '#b6bac4');
            gfx.rect(cx - 10, cy - 6, 3, 8, '#7e828c');
            gfx.rect(cx + 7, cy - 6, 3, 8, '#6a6e78');
          });
          if (hov) gfx.ellipseOutline(t.x, t.y, 11, 10, MG.GOLD);
          if (!this.tasks.tp) { gfx.rect(t.x - 4, t.y - 2, 8, 3, '#c8a060'); gfx.hline(t.x - 4, t.y - 2, 8, '#e0bc80'); }
        },
      });
      if (this.weirdItem) { this.ds.add({ kind: 'weird', x: 120, y: 150, w: 20, h: 12, draw: (g, x, y) => this.weirdItem[1](g, x, y) }); }
      this.ds.addTarget({
        x: 240, y: 200, w: 40, h: 40, snap: 8, accepts: (it) => it.kind === 'weird',
        onDrop: (it) => { this.ds.remove(it); this.tasks.weird = true; A.sfx('trash'); this.addCombo(); return true; },
        draw: (g, t, hov) => {
          const m = MG.m(hov ? '#7a9ab4' : '#5a7a94', { dark: -30, darker: -48, light: 26 });
          MG.shadow(t.x, t.y + 21, 15, 0.28);
          MG.ink(t.x, t.y - 2, 38, 54, (cx, cy) => {
            cy += 2;
            gfx.rect(cx - 14, cy - 20, 28, 40, m.base);
            gfx.rect(cx - 14, cy - 20, 5, 40, m.l);
            gfx.rect(cx + 10, cy - 20, 4, 40, m.d);
            gfx.rect(cx - 16, cy - 24, 32, 5, m.dd);
            gfx.hline(cx - 16, cy - 24, 32, gfx.mix(m.l, '#fff', 0.2));
            gfx.rect(cx - 8, cy - 23, 16, 3, '#181320');
            gfx.text('BIN', cx, cy, '#f3eee2', { align: 'center', font: 'small' });
          }, { outline: hov ? MG.GOLD : undefined });
        },
      });
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
      gfx.rect(0, 0, W, H, '#cfe0e0');
      for (let y = 0; y < 150; y += 12) for (let x = -((y / 12) & 1) * 12; x < W; x += 24) {
        const k = (x * 3 + y) % 11;
        gfx.rect(x, y, 23, 11, k ? '#dbeaea' : '#c8dcdc');
        gfx.hline(x, y, 23, '#e9f4f4');
        gfx.hline(x, y + 10, 23, '#bfd2d2');
      }
      gfx.rect(0, 150, W, H - 150, '#8a9a9c');
      for (let y = 150; y < H; y += 16) for (let x = 0; x < W; x += 16) { gfx.rect(x + 1, y + 1, 14, 14, ((x + y) / 16) % 2 ? '#9aaaac' : '#a8b8ba'); gfx.hline(x + 1, y + 1, 14, 'rgba(255,255,255,0.18)'); }
      // stall walls
      gfx.rect(0, 30, 6, 160, '#4e6c85'); gfx.rect(1, 30, 4, 160, '#5a7a94');
      gfx.rect(180, 30, 6, 160, '#4e6c85'); gfx.rect(181, 30, 4, 160, '#5a7a94');
      gfx.rect(0, 30, 186, 4, '#5a7a94'); gfx.hline(0, 30, 186, '#7799b4');
      // toilet: porcelain, outlined so it reads as an object in the stall
      const clog = this.needPlunge && !this.tasks.plunge;
      MG.shadow(110, 190, 26, 0.25);
      MG.ink(110, 145, 84, 106, (cx, cy) => {
        cy += 2;
        // cistern
        gfx.rect(cx - 30, cy - 45, 60, 30, '#dedee6');
        gfx.rect(cx - 30, cy - 45, 60, 26, '#f2f2f8');
        gfx.rect(cx - 26, cy - 41, 52, 20, '#e4e4ee');
        gfx.hline(cx - 30, cy - 45, 60, '#ffffff');
        gfx.rect(cx + 16, cy - 43, 8, 4, '#b8bcc4');       // flush lever
        gfx.hline(cx + 16, cy - 43, 8, '#e2e6ee');
        // bowl
        gfx.ellipse(cx, cy + 5, 34, 18, '#d4d4de');
        gfx.ellipse(cx, cy + 3, 34, 17, '#f2f2f8');
        gfx.ellipse(cx, cy + 3, 26, 12, '#c2c2cf');
        gfx.ellipse(cx, cy + 3, 25, 11, clog ? '#6a8a6a' : '#8fc9ef');
        gfx.ellipse(cx - 6, cy + 1, 9, 3.4, clog ? '#7c9c78' : '#c6e6ff');
        gfx.ellipse(cx - 12, cy - 4, 10, 4, '#ffffff');    // rim highlight
        gfx.rect(cx - 20, cy + 15, 40, 30, '#dcdce6');
        gfx.rect(cx - 18, cy + 15, 34, 28, '#eeeef6');
        gfx.vline(cx - 18, cy + 15, 28, '#ffffff');
      });
      if (clog) {
        for (let i = 0; i < 3; i++) gfx.px(100 + i * 10, 140 + Math.round(Math.sin(this.t * 3 + i) * 2), '#8ab08a');
        art.effect('stink', 132, 138, this.t, 1);
        MG.tag('CLOGGED', 110, 112, { align: 'center', face: MG.RED, color: '#fff2e6' });
      }
      if (this.flushT > 0) { for (let i = 0; i < 8; i++) gfx.px(90 + i * 5, 145 + Math.round(Math.sin(this.t * 20 + i) * 4), '#fff'); }
      if (clog) {
        // plunger leaning on the stall wall
        MG.ink(61, 162, 16, 52, (cx, cy) => {
          gfx.rect(cx - 1, cy - 22, 3, 32, '#b98a4e');
          gfx.vline(cx - 1, cy - 22, 32, '#dcae6c');
          gfx.ellipse(cx, cy + 18, 8, 5.4, '#8f231c');
          gfx.ellipse(cx, cy + 17, 7.6, 5, MG.RED);
          gfx.ellipse(cx - 2, cy + 15, 3, 1.6, '#e0655a');
        });
        if (this.plunge.active) {
          const px = 70, py = 90;
          MG.panel(px - 2, py - 2, 84, 12, { r: 3, face: '#241c30', shadow: false });
          gfx.rect(px, py, 80, 8, '#3a3346');
          gfx.rect(px + 30, py, 20, 8, '#3f7f32');
          gfx.hline(px + 30, py, 20, '#78c060');
          gfx.rect(px + Math.round(this.plunge.pos * 78), py - 2, 3, 12, '#fff6e4');
          gfx.rect(px + Math.round(this.plunge.pos * 78), py - 2, 1, 12, MG.GOLD);
          MG.tag(`PLUNGE ${this.plunge.hits}/${this.plunge.needed}`, 110, 74, { align: 'center' });
        }
      }
      this.grime.draw(g);
      // mirror + sink
      gfx.rect(294, 34, 122, 72, '#6d717b');
      gfx.rect(296, 36, 118, 68, '#8a8a94');
      gfx.hline(296, 36, 118, '#b6bac4');
      gfx.rect(300, 40, 110, 60, '#c8dce8');
      gfx.rect(302, 42, 20, 56, 'rgba(255,255,255,0.4)');
      // reflection of chubby in mirror
      CH.drawChubby(g, 356, 100, { outfit: 'janitor', noShadow: true, face: 'focused', arm: 'up', sx: 0.9, sy: 0.9 });
      g.globalAlpha = 0.18; gfx.rect(300, 40, 110, 60, '#dff0ff'); g.globalAlpha = 1;
      gfx.rect(300, 40, 110, 2, '#eaf6ff');
      this.mirrorGrime.draw(g);
      // sink basin
      MG.shadow(355, 150, 44, 0.2);
      gfx.rect(296, 118, 118, 30, '#dfe2e8');
      gfx.rect(296, 118, 118, 26, '#f4f4f8');
      gfx.hline(296, 118, 118, '#ffffff');
      gfx.ellipse(355, 134, 50, 12, '#c8d2da');
      gfx.ellipse(355, 133, 48, 11, '#e0e8ee');
      gfx.ellipse(355, 136, 6, 2.4, '#9aa4ae');
      gfx.rect(350, 100, 10, 18, '#98a0ab'); gfx.rect(351, 100, 6, 18, '#c2cad4');
      gfx.rect(340, 100, 30, 4, '#98a0ab'); gfx.hline(340, 100, 30, '#d2dae4');
      this.sinkGrime.draw(g);
      // soap dispenser
      MG.ink(360, 91, 32, 40, (cx, cy) => {
        gfx.rect(cx - 12, cy - 15, 24, 30, '#dcdce6');
        gfx.rect(cx - 12, cy - 15, 9, 30, '#f2f2f8');
        gfx.rect(cx - 8, cy - 11, 16, 18, this.tasks.soap ? '#f0a0b8' : '#ffffff');
        gfx.hline(cx - 8, cy - 11, 16, this.tasks.soap ? '#ffc8d8' : '#ffffff');
        gfx.rect(cx - 6, cy + 15, 12, 4, '#7e828c');
        gfx.hline(cx - 6, cy + 15, 12, '#b6bac4');
      });
      MG.tag('SOAP', 360, 62, { align: 'center' });
      if (!this.tasks.soap) { this.soapHold.draw(g, 'HOLD to refill'); }
      // supply shelf
      gfx.rect(418, 170, 58, 5, '#6d4a22'); gfx.rect(418, 170, 58, 3, '#8a5a2b'); gfx.hline(418, 170, 58, '#a97440');
      gfx.rect(418, 200, 58, 5, '#6d4a22'); gfx.rect(418, 200, 58, 3, '#8a5a2b'); gfx.hline(418, 200, 58, '#a97440');
      MG.tag('SUPPLIES', 448, 156, { align: 'center' });
      MG.ink(431, 187, 20, 24, (cx, cy) => {
        gfx.rect(cx - 7, cy - 9, 14, 18, '#d98aa4');
        gfx.rect(cx - 7, cy - 9, 5, 18, '#f0a0b8');
        gfx.rect(cx - 5, cy - 11, 10, 3, '#b8748a');
        gfx.text('S', cx, cy - 4, '#fff', { align: 'center', font: 'small' });
      });
      this.ds.draw(g);
      this.particles.draw(g);
      // checklist
      const tasks = [['Scrub toilet & sink', this.tasks.scrub], ['Wipe mirror', this.tasks.mirror], ['Replace toilet paper', this.tasks.tp], ['Refill soap', this.tasks.soap]];
      if (this.needPlunge) tasks.push(['Unclog toilet', this.tasks.plunge]);
      if (this.weirdItem) tasks.push(['Remove ' + this.weirdItem[0], this.tasks.weird]);
      const cy0 = H - 14 - tasks.length * 8;
      MG.panel(W - 132, cy0 - 7, 128, 11 + tasks.length * 8, { r: 4 });
      tasks.forEach(([n, done], i) => {
        const y = cy0 + i * 8;
        if (done) { gfx.text('✓', W - 128, y, '#3f8f3a', { font: 'small' }); gfx.text(n, W - 120, y, '#7a8d76', { font: 'small' }); gfx.hline(W - 120, y + 3, gfx.textWidth(n, 'small'), '#a9b8a4'); }
        else { gfx.text('□', W - 128, y, '#7a6f5e', { font: 'small' }); gfx.text(n, W - 120, y, '#33291e', { font: 'small' }); }
      });
      if (this.ds.held) this.drawPaw(g, true);
      else if (inp.mdown && this.lastM) {
        // scrub brush
        MG.ink(inp.mx, inp.my, 22, 20, (cx, cy) => {
          gfx.ellipse(cx, cy - 1, 7, 4, '#b98a4e');
          gfx.ellipse(cx, cy - 2, 6.6, 3.4, '#d7a463');
          gfx.ellipse(cx - 2, cy - 3, 2.6, 1.2, '#e8c08a');
          for (let i = 0; i < 6; i++) gfx.rect(cx - 6 + i * 2, cy + 2, 1, 5, i % 2 ? '#f4f4f0' : '#d8d8d2');
        });
        ui.cursor = 'none';
      }
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
        this.slots.push(this.ds.addTarget({
          x: sx, y: sy, w: 34, h: 40, snap: 6, kind: k[0], filled: 0, need: 1 + (this.difficulty >= 2 ? 1 : 0),
          accepts: (it) => it.kind === k[0],
          onDrop: (it, t) => { this.ds.remove(it); t.filled++; this.addCombo(); return true; },
          draw: (g, t, hov) => {
            const full = t.filled >= t.need;
            const m = MG.m(hov ? '#8a8a94' : '#6a6a74', { dark: -28, darker: -46, light: 28 });
            MG.shadow(t.x, t.y + 21, 15, 0.25);
            MG.ink(t.x, t.y, 42, 50, (cx, cy) => {
              gfx.rect(cx - 17, cy - 20, 34, 40, m.base);
              gfx.rect(cx - 17, cy - 20, 5, 40, m.l);
              gfx.rect(cx + 13, cy - 20, 4, 40, m.d);
              gfx.rect(cx - 14, cy - 17, 28, 20, full ? gfx.shade(k[1], -14) : '#2b2436');
              gfx.rect(cx - 14, cy - 17, 28, 18, full ? k[1] : '#332b40');
              if (full) gfx.hline(cx - 13, cy - 17, 26, gfx.mix(k[1], '#fff', 0.4));
              else for (let i = 0; i < 3; i++) gfx.hline(cx - 12, cy - 13 + i * 5, 24, '#3d3450');
              gfx.rect(cx - 14, cy + 4, 28, 2, m.dd);
              gfx.text(k[2], cx, cy + 8, '#f3eee2', { align: 'center', font: 'small' });
            }, { outline: hov ? MG.GOLD : undefined });
            if (!full) MG.tag('EMPTY', t.x, t.y - 26, { align: 'center', face: MG.RED, color: '#fff2e6' });
            if (has('cart') && this.ds.held && this.ds.held.kind === k[0]) gfx.frame(t.x - 19, t.y - 22, 38, 44, MG.GOLD);
          },
        }));
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
      if (k === 'napkins') MG.ink(x, y, 28, 20, (cx, cy) => {
        gfx.rect(cx - 12, cy - 8, 24, 16, '#dedbd2');
        gfx.rect(cx - 12, cy - 8, 24, 14, '#f6f4ee');
        for (let i = 0; i < 4; i++) gfx.hline(cx - 10, cy - 5 + i * 4, 20, '#d5d2c8');
        gfx.hline(cx - 12, cy - 8, 24, '#ffffff');
        gfx.text('D', cx, cy - 3, MG.RED, { align: 'center', font: 'small' });
      });
      else if (k === 'straws') MG.ink(x, y, 24, 22, (cx, cy) => {
        for (let i = 0; i < 5; i++) { gfx.rect(cx - 8 + i * 4, cy - 8, 2, 16, i % 2 ? '#a82a22' : '#dedbd2'); gfx.vline(cx - 8 + i * 4, cy - 8, 16, i % 2 ? MG.RED : '#ffffff'); }
      });
      else if (k === 'lidsS') MG.ink(x, y, 22, 22, (cx, cy) => {
        gfx.ellipse(cx, cy + 1, 8, 3, '#d3d3dd');
        gfx.ellipse(cx, cy - 1, 8, 3, '#e8e8f0');
        gfx.ellipse(cx, cy - 3, 8, 3, '#f6f6fb');
        gfx.ellipse(cx - 2, cy - 4, 3.4, 1.2, '#ffffff');
        gfx.text('S', cx, cy - 10, '#3a3346', { align: 'center', font: 'small' });
      });
      else if (k === 'lidsL') MG.ink(x, y, 30, 24, (cx, cy) => {
        gfx.ellipse(cx, cy + 1, 12, 4, '#c6c6d2');
        gfx.ellipse(cx, cy - 1, 12, 4, '#dcdce8');
        gfx.ellipse(cx, cy - 3, 12, 4, '#eeeef6');
        gfx.ellipse(cx - 3, cy - 4, 5, 1.4, '#ffffff');
        gfx.text('L', cx, cy - 11, '#3a3346', { align: 'center', font: 'small' });
      });
      else if (k === 'ketchup') MG.ink(x, y, 26, 20, (cx, cy) => {
        for (let i = 0; i < 3; i++) {
          const bx = cx - 10 + i * 7, by = cy - 5 + (i % 2) * 2;
          gfx.rect(bx, by, 6, 10, '#a82a22');
          gfx.rect(bx, by, 3, 10, MG.RED);
          gfx.hline(bx, by, 6, '#e0655a');
        }
        gfx.text('K', cx, cy - 3, '#fff', { align: 'center', font: 'small' });
      });
      else if (k === 'salt') MG.ink(x, y, 18, 24, (cx, cy) => {
        gfx.rect(cx - 5, cy - 8, 10, 16, '#e2e0d8');
        gfx.rect(cx - 5, cy - 8, 4, 16, '#ffffff');
        gfx.rect(cx - 5, cy - 11, 10, 3, '#7e828c');
        gfx.hline(cx - 5, cy - 11, 10, '#b6bac4');
        gfx.text('S', cx, cy - 3, '#3a3346', { align: 'center', font: 'small' });
      });
      else if (k === 'forks') MG.ink(x, y, 24, 22, (cx, cy) => {
        for (let i = 0; i < 3; i++) {
          const fx = cx - 6 + i * 5;
          gfx.rect(fx, cy - 8, 1, 16, '#c6c6d2');
          gfx.rect(fx - 1, cy - 8, 3, 3, '#dedee8');
          gfx.px(fx, cy - 8, '#ffffff');
        }
      });
      else if (k === 'cups') MG.ink(x, y, 30, 28, (cx, cy) => {
        for (const [ox, oy] of [[-4, 2], [2, 0]]) {
          for (let i = 0; i < 14; i++) { const ww = Math.round(11 - (i / 14) * 2); gfx.rect(cx + ox - ww / 2, cy + oy - 12 + i, ww, 1, '#f2f2f6'); }
          gfx.vline(cx + ox - 4, cy + oy - 11, 12, '#ffffff');
          gfx.rect(cx + ox - 4, cy + oy - 8, 8, 2, MG.RED);
          gfx.ellipse(cx + ox, cy + oy - 12, 5, 1.6, '#fafaff');
        }
      });
    }
    progress() { const need = this.slots.reduce((a, s) => a + s.need, 0), got = this.slots.reduce((a, s) => a + s.filled, 0); return need ? got / need : 1; }
    step(dt) { this.ds.update(dt); if (this.progress() >= 1 && !this.finished) this.finish(CH.clamp(1.2 - this.t / this.timeLimit, 0.3, 1) - this.mistakes * 0.08); }
    draw(g) {
      // lobby wall + floor
      gfx.rect(0, 0, W, H, '#c8b890');
      for (let y = 0; y < 140; y += 12) for (let x = -((y / 12) & 1) * 12; x < W; x += 24) {
        const k = (x + y) % 7;
        gfx.rect(x, y, 23, 11, k ? '#d8c8a0' : '#c8b890');
        gfx.hline(x, y, 23, '#e6d8b4');
        gfx.hline(x, y + 10, 23, '#bcac86');
      }
      gfx.rect(0, 140, W, H - 140, '#8a7a5a');
      gfx.hline(0, 140, W, '#a4926e');
      for (let y = 144; y < H; y += 12) gfx.hline(0, y, W, '#82724f');
      // condiment counter
      gfx.rect(20, 90, W - 40, 10, '#4c505a');
      gfx.hline(20, 90, W - 40, '#7d818b');
      gfx.rect(20, 100, W - 40, 30, '#8a8a94');
      gfx.rect(20, 100, W - 40, 3, '#b6bac4');
      for (let x = 24; x < W - 24; x += 6) gfx.vline(x, 104, 24, 'rgba(255,255,255,0.05)');
      gfx.rect(20, 127, W - 40, 3, '#5c616c');
      gfx.hline(20, 130, W - 40, '#3f434b');
      gfx.text('CONDIMENT STATION', W / 2, 108, '#e8eaee', { align: 'center', font: 'small' });
      // the counter nobody wipes
      MG.crumbs(26, 118, W - 52, 9, 34, ['#d9c9a0', '#c8352b', '#8a7a5a'], 12);
      g.globalAlpha = 0.35; gfx.ellipse(120, 122, 9, 2.4, '#6a3a18'); gfx.ellipse(330, 121, 7, 2, '#b02020'); g.globalAlpha = 1;
      for (const sx of [70, 200, 410]) { gfx.rect(sx, 118, 5, 2, '#f4f4f0'); gfx.px(sx + 5, 119, '#d8d8d0'); }
      // supply crate: an open cardboard box, flaps folded back over the rim
      const cm = MG.m('#c8a060', { dark: -30, darker: -50, light: 22 });
      MG.shadow(W / 2, 252, 160, 0.25);
      gfx.rect(60, 160, W - 120, 90, cm.dd);
      gfx.rect(62, 162, W - 124, 86, cm.d);
      gfx.rect(64, 166, W - 128, 80, cm.base);
      // inside shadow at the back and sides of the box, so items sit IN it
      g.globalAlpha = 0.34; gfx.rect(64, 166, W - 128, 14, '#4a2f0c'); g.globalAlpha = 1;
      g.globalAlpha = 0.22; gfx.rect(64, 166, 10, 80, '#4a2f0c'); gfx.rect(W - 74, 166, 10, 80, '#4a2f0c'); g.globalAlpha = 1;
      gfx.hline(64, 180, W - 128, 'rgba(90,58,18,0.35)');
      for (let x = 88; x < W - 80; x += 44) gfx.vline(x, 180, 66, 'rgba(120,84,40,0.22)');
      // a torn-open corner and a shipping label
      gfx.rect(80, 190, 34, 22, gfx.shade(cm.base, -6));
      gfx.frame(80, 190, 34, 22, 'rgba(120,84,40,0.5)');
      gfx.hline(84, 196, 26, 'rgba(120,84,40,0.5)');
      gfx.hline(84, 200, 20, 'rgba(120,84,40,0.5)');
      // folded flaps
      gfx.rect(60, 156, 84, 10, cm.l); gfx.hline(60, 156, 84, gfx.mix(cm.l, '#fff', 0.3)); gfx.hline(60, 165, 84, cm.dd);
      gfx.rect(W - 144, 156, 84, 10, cm.l); gfx.hline(W - 144, 156, 84, gfx.mix(cm.l, '#fff', 0.3)); gfx.hline(W - 144, 165, 84, cm.dd);
      gfx.rect(144, 158, W - 288, 7, gfx.shade(cm.base, 6)); gfx.hline(144, 158, W - 288, cm.l);
      // packing tape
      gfx.rect(W / 2 - 22, 156, 44, 9, 'rgba(236,222,190,0.55)');
      gfx.rect(60, 246, W - 120, 4, cm.dd);
      gfx.text('SUPPLIES - HANDLE WITH CARE (or not)', W / 2, 240, '#7a4f16', { align: 'center', font: 'small' });
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
