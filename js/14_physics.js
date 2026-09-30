// ============================================================================
// Physics for the walk-around world: one shared wind, loose objects you can
// kick, and a snow layer that falls, drifts, settles and gets ploughed.
// Scenes opt in with this.addBody(...) and this.enableSnow(...).
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, A = CH.audio;

  // ---- wind -------------------------------------------------------------------
  // A steady breeze with gusts layered on top. `x` is px/s at ground level;
  // `gust` is 0..1 for effects that only show up when it really blows.
  const wind = (CH.wind = { x: 8, base: 8, gust: 0, _t: 0, _next: 3, _target: 0, _frame: -1 });
  wind.tick = function (dt) {
    const f = CH.game ? CH.game.frame : 0;
    if (f === wind._frame) return;          // once per frame, however many scenes ask
    wind._frame = f;
    wind._t += dt;
    wind._next -= dt;
    if (wind._next <= 0) { wind._next = CH.rand(3, 8); wind._target = CH.chance(0.55) ? CH.rand(0.4, 1) : 0; }
    wind.gust = CH.approach(wind.gust, wind._target, dt * (wind._target > wind.gust ? 0.9 : 0.35));
    if (wind.gust > 0.95) wind._target = 0;
    wind.x = wind.base + Math.sin(wind._t * 0.37) * 4 + wind.gust * 46;
  };
  // how far a thing of a given height leans at world x right now
  wind.lean = (x, stiff = 1) => (Math.sin(wind._t * 1.7 + x * 0.013) * 0.35 + 0.65) * (wind.x / 60) * 0.07 / stiff;

  // ---- loose objects ----------------------------------------------------------------
  const KINDS = {
    snowball: { r: 5, rest: 0.25, fric: 3.5, windK: 0, burst: 190, draw: (b) => { gfx.ellipse(0, 0, b.r, b.r, '#dfe8f4'); gfx.ellipse(-1, -1, b.r - 1, b.r - 1, '#ffffff'); gfx.px(-2, -2, '#ffffff'); gfx.ellipse(1.5, 1.5, b.r * 0.4, b.r * 0.3, '#c8d6e8'); } },
    pinecone: { r: 3, rest: 0.4, fric: 2.4, windK: 0.4, draw: (b) => { gfx.ellipse(0, 0, 3, 3.6, '#6b3d1c'); gfx.ellipse(0, -0.5, 2.4, 3, '#8a5a2b'); for (let i = -1; i <= 1; i++) gfx.px(i, i, '#5a3216'); } },
    can: { r: 3.5, rest: 0.35, fric: 1.4, windK: 0.6, draw: (b) => { gfx.rect(-3, -3.5, 6, 7, '#c8452f'); gfx.rect(-3, -3.5, 2, 7, '#e0674a'); gfx.rect(-3, -3.5, 6, 1, '#b8bcc8'); gfx.rect(-3, 2.5, 6, 1, '#b8bcc8'); } },
    puck: { r: 3, rest: 0.1, fric: 0.25, windK: 0, flat: true, draw: () => { gfx.rect(-4, -1.5, 8, 3, '#1a1a22'); gfx.rect(-4, -1.5, 8, 1, '#3a3a48'); } },
    ball: { r: 5, rest: 0.78, fric: 0.9, windK: 0.2, draw: (b) => { gfx.ellipse(0, 0, 5, 5, b.color || '#e05a7a'); gfx.ellipse(-1.5, -1.5, 2, 2, '#ffffff'); gfx.rect(-5, -0.5, 10, 1, 'rgba(255,255,255,0.5)'); } },
    cup: { r: 3.5, rest: 0.3, fric: 2, windK: 0.9, draw: () => { gfx.tri(-3, -4, 3, -4, 2, 4, '#f2ece0'); gfx.tri(-3, -4, 2, 4, -2, 4, '#f2ece0'); gfx.rect(-3, -1, 6, 2, '#2f5a44'); gfx.rect(-3.5, -5, 7, 1.5, '#d8cfbd'); } },
    mitten: { r: 4, rest: 0.15, fric: 4, windK: 1.4, draw: () => { gfx.ellipse(0, 0.5, 3.5, 4, '#c8352b'); gfx.ellipse(-3, -1, 1.6, 2.2, '#c8352b'); gfx.rect(-3.5, 3, 7, 2, '#f2ece0'); gfx.px(-1, -1, '#e0674a'); } },
    leaf: { r: 2.5, rest: 0.1, fric: 5, windK: 2.4, draw: () => { gfx.ellipse(0, 0, 3, 1.6, '#a8722f'); gfx.px(0, 0, '#7a4a22'); } },
  };
  CH.PHYS_KINDS = KINDS;

  class Body {
    constructor(kind, x, y, opts = {}) {
      Object.assign(this, KINDS[kind] || KINDS.snowball);
      Object.assign(this, { kind, x, y, vx: 0, vy: 0, rot: 0, depth: 0, alive: true }, opts);
      this.y = y - this.r;
    }
  }

  class Physics {
    constructor(scene) { this.scene = scene; this.bodies = []; this.lastPY = 0; this.snow = null; }
    add(kind, x, opts = {}) { const b = new Body(kind, x, (opts.y !== undefined ? opts.y : this.scene.floorY) + (opts.depth || 0), opts); this.bodies.push(b); return b; }
    floorAt(b) {
      const f = this.scene.floorY + b.depth;
      return this.snow && b.depth <= 2 ? f - this.snow.heightAt(b.x) * 0.6 : f;
    }
    update(dt, sc) {
      const pl = sc.player, G = 620;
      const minX = sc.minX !== undefined ? sc.minX : 8, maxX = sc.maxX !== undefined ? sc.maxX : sc.width - 8;
      const landing = sc.py === 0 && this.lastPY < -4;          // Chubby just came down from a hop
      this.lastPY = sc.py || 0;
      for (const b of this.bodies) {
        if (!b.alive) continue;
        const floor = this.floorAt(b);
        const onGround = b.y + b.r >= floor - 0.5;
        const wx = wind.x * (sc.windScale === undefined ? 1 : sc.windScale);
        b.vx += (wx - b.vx * 0.2) * b.windK * dt * (onGround ? 0.5 : 1);
        b.vy += G * dt;
        b.x += b.vx * dt; b.y += b.vy * dt;
        if (!b.flat) b.rot += (b.vx / Math.max(1, b.r)) * dt;
        if (b.y + b.r > floor) {
          b.y = floor - b.r;
          if (b.vy > 70) {
            const hit = b.vy;
            b.vy = -b.vy * b.rest;
            if (b.burst && hit > b.burst) { this.shatter(b, sc); continue; }
            if (hit > 120) { A.sfx(b.kind === 'ball' ? 'boing' : 'land'); sc.particles.burst(b.x, floor, 3, { color: ['#eef4fa', '#ffffff'], speed: 26, grav: 200, life: 0.3, angle: -Math.PI / 2, spread: 2 }); }
          } else b.vy = 0;
          b.vx *= Math.max(0, 1 - b.fric * dt);
          if (this.snow && Math.abs(b.vx) > 20 && b.kind === 'snowball') { b.r = Math.min(10, b.r + Math.abs(b.vx) * dt * 0.012); this.snow.dig(b.x, 0.05); }
        }
        if (b.x < minX) { b.x = minX; b.vx = Math.abs(b.vx) * b.rest; }
        if (b.x > maxX) { b.x = maxX; b.vx = -Math.abs(b.vx) * b.rest; }
        // Chubby's feet
        if (pl && !pl.hidden && Math.abs(b.depth) < 8) {
          const dx = b.x - pl.x;
          const near = Math.abs(dx) < b.r + 7 && b.y + b.r > pl.y - 16;
          if (near && landing) {
            if (b.burst) { this.shatter(b, sc); continue; }
            b.vy = -260; b.vx = (dx >= 0 ? 1 : -1) * 60; A.sfx('boing');
          } else if (near && Math.abs(pl.vx) > 12 && Math.sign(pl.vx) === Math.sign(dx || pl.vx)) {
            const sp = Math.abs(pl.vx);
            b.vx = pl.vx * 1.7 + Math.sign(pl.vx) * 30;
            b.vy = -(60 + sp * 0.9) * (b.kind === 'puck' ? 0.1 : 1);
            b.x = pl.x + Math.sign(pl.vx) * (b.r + 7.5);
            if (!b._kickT || sc.t - b._kickT > 0.25) { A.sfx('kick'); b._kickT = sc.t; }
            if (b.burst && sp > 70 && CH.chance(0.35)) { this.shatter(b, sc); continue; }
          }
        }
      }
      // bodies nudge one another
      const L = this.bodies;
      for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
        const a = L[i], c = L[j];
        if (!a.alive || !c.alive || Math.abs(a.depth - c.depth) > 4) continue;
        const d = c.x - a.x, min = a.r + c.r;
        if (Math.abs(d) < min && Math.abs(a.y - c.y) < min) {
          const push = (min - Math.abs(d)) / 2 * Math.sign(d || 1);
          a.x -= push; c.x += push;
          const va = a.vx; a.vx = c.vx * 0.8; c.vx = va * 0.8;
        }
      }
      this.bodies = L.filter((b) => b.alive);
      if (this.snow) this.snow.update(dt, sc);
    }
    shatter(b, sc) {
      b.alive = false;
      A.sfx('crunch');
      sc.particles.burst(b.x, b.y, 14 + b.r * 2, { color: ['#ffffff', '#eef4fa', '#dfe8f4'], speed: 70 + b.r * 6, grav: 300, life: 0.7, size: 1 });
      if (this.snow) this.snow.deposit(b.x, b.r * 0.9, 10);
    }
    drawables() {
      return this.bodies.map((b) => ({ y: this.scene.floorY + b.depth + 0.2, d: () => {
        const g = gfx.cur;
        gfx.ellipse(b.x, this.floorAt(b) + 1, b.r * 0.9, 1.4, 'rgba(20,24,40,0.22)');
        g.save(); g.translate(Math.round(b.x), Math.round(b.y)); if (b.rot) g.rotate(Math.round(b.rot * 4) / 4);
        b.draw(b); g.restore();
      } }));
    }
  }
  CH.Physics = Physics;

  // ---- the snow layer -----------------------------------------------------------------
  // A height per 2px column along the floor. Flakes fall through the wind and
  // pile up; feet plough it aside; gusts lift loose snow off the top and carry it.
  class SnowField {
    constructor(scene, opts = {}) {
      this.scene = scene;
      this.step = 2;
      this.n = Math.ceil(scene.width / this.step) + 2;
      this.h = new Float32Array(this.n);
      const rng = new CH.Rng(opts.seed || 5);
      const base = opts.depth !== undefined ? opts.depth : 3.5;
      for (let i = 0; i < this.n; i++) this.h[i] = Math.max(0, base + Math.sin(i * 0.07) * 1.2 + Math.sin(i * 0.23 + 1) * 0.6 + rng.range(-0.4, 0.4));
      this.max = opts.max || 9;
      this.rate = opts.rate === undefined ? 50 : opts.rate;   // world flakes per second across the view
      this.flakes = [];
      this.spawnT = 0;
      this.color = opts.color || '#f4f8fc';
      this.shade = opts.shade || '#d6e2ee';
      this.skip = opts.skip || null;   // [[x0,x1], ...] stretches with no ground snow (the lake)
    }
    idx(x) { return CH.clamp(Math.round(x / this.step), 0, this.n - 1); }
    heightAt(x) { return this.h[this.idx(x)]; }
    deposit(x, amt, spread = 3) {
      const c = this.idx(x);
      for (let k = -spread; k <= spread; k++) { const i = c + k; if (i < 0 || i >= this.n) continue; this.h[i] = Math.min(this.max, this.h[i] + amt * (1 - Math.abs(k) / (spread + 1)) / spread); }
    }
    dig(x, amt) { const i = this.idx(x); this.h[i] = Math.max(0, this.h[i] - amt); }
    update(dt, sc) {
      const pl = sc.player, cam = sc.cam, vw = sc.viewW || CH.W;
      // feet plough a trench and bank it to either side
      if (pl && !pl.hidden && sc.py === 0 && Math.abs(pl.vx) > 6) {
        const c = this.idx(pl.x), dir = Math.sign(pl.vx);
        for (let k = -3; k <= 3; k++) {
          const i = c + k; if (i < 1 || i >= this.n - 1) continue;
          const take = Math.min(this.h[i] - 0.6, dt * Math.abs(pl.vx) * 0.09);
          if (take > 0) { this.h[i] -= take; const j = CH.clamp(i + (k >= 0 ? 4 : -4) * (k === 0 ? dir : 1), 0, this.n - 1); this.h[j] = Math.min(this.max, this.h[j] + take * 0.85); }
        }
        if (CH.chance(dt * 30)) sc.particles.add({ x: pl.x - dir * 6, y: sc.floorY - this.heightAt(pl.x), vx: -dir * CH.rand(20, 50) + wind.x * 0.4, vy: -CH.rand(20, 60), life: 0.45, color: '#ffffff', size: 1, grav: 260, drag: 0.97 });
      }
      // falling flakes that actually land
      this.spawnT += dt * this.rate;
      while (this.spawnT >= 1) {
        this.spawnT -= 1;
        this.flakes.push({ x: cam.x + CH.rand(-60, vw + 60) - wind.x * 1.2, y: (cam.y || 0) - 4, vy: CH.rand(18, 34), ph: CH.rand(0, 6.28), r: CH.chance(0.25) ? 2 : 1 });
      }
      const F = sc.floorY;
      for (const f of this.flakes) {
        f.x += (wind.x * 0.9 + Math.sin(sc.t * 2 + f.ph) * 6) * dt;
        f.y += f.vy * dt;
        const top = F - this.heightAt(f.x);
        if (f.y >= top) { f.dead = true; if (!this.skipped(f.x)) this.deposit(f.x, 0.05 * f.r, 1); }
      }
      this.flakes = this.flakes.filter((f) => !f.dead && f.y < CH.H + 10);
      // a real gust lifts powder off the top and carries it downwind
      if (wind.gust > 0.45) {
        const n = Math.floor(dt * 90 * wind.gust);
        for (let i = 0; i < n; i++) {
          const x = cam.x + CH.rand(0, vw), hh = this.heightAt(x);
          if (hh < 1.2 || this.skipped(x)) continue;
          this.dig(x, 0.03);
          sc.particles.add({ x, y: F - hh, vx: wind.x * CH.rand(0.8, 1.6), vy: -CH.rand(6, 26), life: CH.rand(0.5, 1.1), color: 'rgba(255,255,255,0.8)', size: 1, grav: 30, drag: 0.99 });
        }
      }
      // settle: a gentle smoothing so trenches soften and piles slump
      const k = Math.min(1, dt * 0.6);
      for (let i = 1; i < this.n - 1; i++) {
        const avg = (this.h[i - 1] + this.h[i + 1]) * 0.5;
        if (Math.abs(this.h[i] - avg) > 1.4) this.h[i] += (avg - this.h[i]) * k;
      }
    }
    skipped(x) { if (!this.skip) return false; for (const [a, b] of this.skip) if (x >= a && x <= b) return true; return false; }
    draw(g, sc) {
      const F = sc.floorY, x0 = Math.max(0, this.idx(sc.cam.x) - 2), x1 = Math.min(this.n - 1, this.idx(sc.cam.x + (sc.viewW || CH.W)) + 2);
      for (let i = x0; i <= x1; i++) {
        const x = i * this.step;
        if (this.skipped(x)) continue;
        const hh = this.h[i];
        if (hh < 0.3) continue;
        const top = Math.round(F - hh);
        gfx.rect(x, top, this.step, F + 2 - top, this.color);
        gfx.rect(x, top, this.step, 1, '#ffffff');
        if (hh > 2 && this.h[Math.max(0, i - 1)] - hh > 1) gfx.rect(x, top, 1, 2, this.shade);   // the edge of a footprint
      }
      for (const f of this.flakes) {
        if (f.r > 1) gfx.rect(f.x, f.y, 2, 2, '#ffffff'); else gfx.px(f.x, f.y, 'rgba(255,255,255,0.9)');
      }
    }
  }
  CH.SnowField = SnowField;

  // ---- hooks on the world scene -------------------------------------------------------
  const WS = CH.WorldScene.prototype;
  WS.addBody = function (kind, x, opts) { if (!this.phys) this.phys = new Physics(this); return this.phys.add(kind, x, opts); };
  WS.enableSnow = function (opts) { if (!this.phys) this.phys = new Physics(this); this.phys.snow = new SnowField(this, opts); return this.phys.snow; };
  const baseUpdate = WS.update;
  WS.update = function (dt) { wind.tick(dt); baseUpdate.call(this, dt); if (this.phys) this.phys.update(dt, this); };
})(window.CH);
