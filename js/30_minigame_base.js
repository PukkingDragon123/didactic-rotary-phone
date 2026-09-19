// ============================================================================
// Minigame framework: base scene, scrub masks, drag & drop, hold meters, results
//
// Art contract for every minigame in 31..34:
//   * anything the player can GRAB is drawn through MG.ink(), which routes the
//     drawing through art.blit() so it comes back with one heavy ink line around
//     its whole silhouette - that is what makes it read as a liftable object.
//   * backgrounds (counters, tiles, walls, fryer bodies) stay un-outlined and
//     lower contrast, so the scene does not turn into soup.
//   * the shared UI furniture (timer, progress, combo, results) uses the game's
//     panel language: rounded, ink-outlined, cream face, gold highlight.
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, fx = CH.fx, A = CH.audio, inp = CH.input, S = CH.state, art = CH.art;
  const W = CH.W, H = CH.H;

  // ============================================================================
  // MG - the minigame art kit
  // ============================================================================
  const MG = (CH.MG = {});
  MG.INK = art.INK;
  MG.INK_SOFT = art.INK_SOFT;
  MG.CREAM = '#f3eee2';
  MG.GOLD = '#f5d76b';
  MG.RED = '#c8352b';
  MG.GREEN = '#4f9d3a';
  MG.SHADOW = 'rgba(16,10,22,0.30)';

  // Draw fn(cx, cy) into an offscreen buffer and blit it back with an ink
  // outline, so that (cx, cy) inside the buffer lands exactly on (x, y).
  // opts.ax / opts.ay move the anchor for tall or lopsided props.
  MG.ink = function (x, y, w, h, fn, opts) {
    opts = opts || {};
    const ax = opts.ax !== undefined ? opts.ax : Math.ceil(w / 2);
    const ay = opts.ay !== undefined ? opts.ay : Math.ceil(h / 2);
    art.blit(x, y, w, h, ax, ay, () => fn(ax, ay), opts);
  };

  MG.mat = art.mat;
  const mats = new Map();
  // cached material so the per-frame painters do not re-parse hex strings
  MG.m = function (hex, opts) {
    const key = hex + (opts ? JSON.stringify(opts) : '');
    let m = mats.get(key);
    if (!m) { m = art.mat(hex, opts || {}); mats.set(key, m); }
    return m;
  };

  // ---- panels & readouts -----------------------------------------------------
  MG.panel = function (x, y, w, h, opts = {}) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const r = opts.r !== undefined ? opts.r : 4;
    const face = opts.face || MG.CREAM;
    const ink = opts.ink || MG.INK;
    if (opts.shadow !== false) gfx.rrect(x - 1, y + 2, w + 2, h + 1, r + 1, 'rgba(12,8,18,0.35)');
    gfx.rrect(x - 1, y - 1, w + 2, h + 2, r + 1, ink);
    gfx.rrect(x, y, w, h, r, gfx.shade(face, -16));
    gfx.rrect(x, y, w, h - 2, r, face);
    gfx.rrect(x + 1, y + 1, w - 2, Math.max(1, Math.round(h * 0.22)), Math.max(1, r - 1), gfx.mix(face, '#ffffff', 0.4));
    if (opts.accent) gfx.rrect(x + 2, y + 2, w - 4, 2, 1, opts.accent);
  };

  // chunky ink-framed meter: dark track, lit fill, bright top row
  MG.meter = function (x, y, w, h, p, col, opts = {}) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    gfx.rrect(x - 1, y - 1, w + 2, h + 2, 2, opts.ink || MG.INK);
    gfx.rect(x, y, w, h, opts.track || '#2b2336');
    gfx.hline(x, y, w, '#1d1727');
    const fw = Math.round(w * CH.clamp(p, 0, 1));
    if (fw > 0) {
      gfx.rect(x, y, fw, h, col);
      gfx.hline(x, y, fw, gfx.mix(col, '#fffbe8', 0.5));
      gfx.hline(x, y + h - 1, fw, gfx.shade(col, -34));
      if (fw > 2) gfx.vline(x + fw - 1, y, h, gfx.mix(col, '#fffbe8', 0.3));
    }
    if (opts.ticks) for (let i = 1; i < opts.ticks; i++) gfx.vline(x + Math.round((w * i) / opts.ticks), y, h, 'rgba(0,0,0,0.30)');
  };

  // small cream pill with dark text - used for MOP / WATER / SALT style labels
  MG.tag = function (text, x, y, opts = {}) {
    const font = opts.font || 'small';
    const tw = gfx.textWidth(text, font);
    const w = tw + 7, h = font === 'small' ? 10 : 12;
    const ax = opts.align === 'center' ? Math.round(x - w / 2) : Math.round(x);
    MG.panel(ax, Math.round(y), w, h, { r: 3, face: opts.face || MG.CREAM, shadow: opts.shadow });
    gfx.text(text, ax + Math.round(w / 2), Math.round(y) + (h === 10 ? 2 : 3), opts.color || '#241c30', { align: 'center', font });
    return w;
  };

  // Chunky ink-outlined button. Same click semantics as ui.button (hover cursor,
  // tap sfx, input eaten) but in the minigame panel language.
  MG.button = function (g, r, label, opts = {}) {
    const hover = inp.mouseIn(r);
    const col = opts.color || '#3b5a8f';
    const m = MG.m(col, { dark: -32, light: 30 });
    gfx.rrect(r.x - 1, r.y - 1, r.w + 2, r.h + 2, 3, opts.ink || MG.INK);
    gfx.rrect(r.x, r.y, r.w, r.h, 2, m.d);
    gfx.rrect(r.x, r.y, r.w, r.h - 2, 2, hover ? m.l : m.base);
    gfx.rrect(r.x + 1, r.y + 1, r.w - 2, 1, 1, gfx.mix(m.l, '#ffffff', 0.45));
    gfx.text(label, r.x + r.w / 2, r.y + Math.floor((r.h - 7) / 2), opts.textColor || '#fff6e4', { align: 'center', font: opts.font || 'main', shadow: '#1d1424' });
    if (opts.badge) { gfx.rrect(r.x + r.w - 9, r.y - 2, 10, 8, 2, MG.GOLD); gfx.text(opts.badge, r.x + r.w - 4, r.y - 1, '#3a2a08', { align: 'center', font: 'small' }); }
    if (hover) ui.cursor = 'hand';
    const clicked = inp.clicked(r);
    if (clicked) { A.sfx(opts.sfx || 'tap'); inp.eat(); }
    return clicked;
  };

  MG.star = function (cx, cy, r, col, opts = {}) {
    if (r < 1.2) return;
    const w = Math.ceil(r * 2) + 3;
    MG.ink(cx, cy, w, w, (bx, by) => {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
        const rr = i % 2 ? r * 0.44 : r;
        pts.push([bx + Math.cos(a) * rr, by + Math.sin(a) * rr]);
      }
      for (let i = 0; i < 10; i++) gfx.tri(bx, by, pts[i][0], pts[i][1], pts[(i + 1) % 10][0], pts[(i + 1) % 10][1], col);
      gfx.tri(bx, by, pts[9][0], pts[9][1], pts[0][0], pts[0][1], gfx.mix(col, '#fffdf0', 0.55));
      gfx.tri(bx, by, pts[4][0], pts[4][1], pts[5][0], pts[5][1], gfx.shade(col, -30));
    }, { outline: opts.ink || MG.INK });
  };

  // ---- juice ------------------------------------------------------------------
  // Rising, widening, fading puffs. Cheap and drawn straight into the scene.
  MG.steam = function (x, y, t, opts = {}) {
    const n = opts.n || 3, sp = opts.speed || 0.45, rise = opts.rise || 20;
    const wob = opts.wob !== undefined ? opts.wob : 3, base = opts.w || 2.2;
    const col = opts.color || '255,252,246', a0 = opts.alpha !== undefined ? opts.alpha : 0.45;
    const seed = opts.seed || 0;
    for (let i = 0; i < n; i++) {
      const k = ((t * sp + (i + seed * 0.37) / n) % 1);
      const a = (1 - k) * a0 * Math.min(1, k * 5);
      if (a <= 0.02) continue;
      const rx = base * (0.6 + k * 1.7);
      gfx.ellipse(x + Math.sin(k * 5 + i * 2 + seed) * wob, y - k * rise, rx, rx * 0.85, 'rgba(' + col + ',' + a.toFixed(2) + ')');
    }
  };

  // Hot-oil / hot-plate sizzle flecks. Deterministic on t so it never strobes.
  MG.sizzle = function (x, y, t, n = 4, opts = {}) {
    const spread = opts.spread || 10, col = opts.color || '#ffe08a';
    for (let i = 0; i < n; i++) {
      const k = ((t * 2.2 + i * 0.41) % 1);
      const px = x + Math.sin(i * 12.9898 + Math.floor(t * 2.2 + i * 0.41) * 7.233) * spread;
      const py = y - k * (opts.rise || 7);
      gfx.px(px, py, k < 0.5 ? '#fff6d0' : col);
    }
  };

  // Specular gloss: a short bright arc along the top-left of a round thing.
  MG.gloss = function (cx, cy, rx, ry, col = 'rgba(255,255,255,0.55)') {
    gfx.ellipse(cx - rx * 0.28, cy - ry * 0.42, rx * 0.4, ry * 0.3, col);
  };

  // Scattered crumbs / grit on a surface (seeded, so it holds still).
  MG.crumbs = function (x, y, w, h, n, cols, seed = 1) {
    for (let i = 0; i < n; i++) {
      const a = Math.sin((i + seed) * 12.9898) * 43758.5453;
      const b = Math.sin((i + seed) * 78.233) * 43758.5453;
      const px = x + (a - Math.floor(a)) * w, py = y + (b - Math.floor(b)) * h;
      gfx.px(px, py, cols[i % cols.length]);
    }
  };

  MG.shadow = function (x, y, rx, alpha = 0.28) { art.shadow(x, y, rx, alpha); };

  // ============================================================================
  class MinigameScene extends CH.Scene {
    constructor(opts = {}) {
      super();
      this.name = 'minigame'; this.title = opts.title || 'TASK'; this.subtitle = opts.subtitle || '';
      this.timeLimit = opts.timeLimit || 0; this.timeLeft = this.timeLimit;
      this.onDone = opts.onDone; this.result = null; this.finished = false;
      this.particles = new CH.Particles();
      this.quality = 1; this.mistakes = 0; this.startDelay = 0.6; this.intro = true;
      this.hint = opts.hint || ''; this.hintT = 4;
      this.drag = null; // {item}
      this.difficulty = opts.difficulty || 1;
      this.combo = 0; this.comboT = 0; this.score = 0;
      this.paused = false;
    }
    enter() { A.sfx('swipe'); ui.cursorVisible = true; }
    finish(score, extra = {}) {
      if (this.finished) return;
      this.finished = true;
      const sc = CH.clamp(score, 0, 1);
      this.result = Object.assign({ score: sc, time: this.t, stars: sc >= 0.85 ? 3 : sc >= 0.55 ? 2 : sc > 0.15 ? 1 : 0 }, extra);
      A.sfx(this.result.stars >= 3 ? 'fanfare' : this.result.stars >= 2 ? 'good' : this.result.stars >= 1 ? 'blip' : 'error');
      this.run((function* (self) { self.resultT = 0; yield 1.6; CH.game.pop(); if (self.onDone) self.onDone(self.result); })(this));
    }
    addCombo() { this.combo++; this.comboT = 2.5; if (this.combo >= 3) { this.particles.text(W / 2, 40, this.combo + 'x COMBO!', '#f5c33b'); if (this.combo % 3 === 0) A.sfx('coin'); } }
    update(dt) {
      if (this.finished) { this.resultT = (this.resultT || 0) + dt; this.particles.update(dt); return; }
      if (this.intro) { this.startDelay -= dt; if (this.startDelay <= 0) this.intro = false; return; }
      if (this.hintT > 0) this.hintT -= dt;
      if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) this.combo = 0; }
      if (this.timeLimit) { this.timeLeft -= dt; if (this.timeLeft <= 0) { this.timeLeft = 0; this.onTimeout(); } }
      this.particles.update(dt);
      this.step(dt);
      if (inp.hit('cancel')) { this.onCancel(); }
    }
    onTimeout() { this.finish(this.progress ? this.progress() : 0, { timeout: true }); }
    onCancel() { ui.toast("Can't quit a task halfway. Brenda is watching.", '#fff', 2); }
    step(dt) {}
    drawHud(g) {
      // ---- top bar: ink band with a gold rule under it ------------------------
      gfx.rect(0, 0, W, 13, '#1b1526');
      gfx.hline(0, 0, W, '#2e2440');
      gfx.hline(0, 13, W, MG.GOLD);
      gfx.hline(0, 14, W, '#8a6a22');
      gfx.text(this.title, 6, 3, MG.GOLD, { shadow: '#0d0912' });
      if (this.subtitle) gfx.text(this.subtitle, 6 + gfx.textWidth(this.title) + 8, 4, '#cfc4b2', { font: 'small' });
      if (this.timeLimit) {
        const p = this.timeLeft / this.timeLimit;
        const low = p < 0.25;
        MG.meter(W - 92, 4, 66, 6, p, low ? (Math.sin(this.t * 20) > 0 ? '#ff4a4a' : '#ff9a9a') : '#6fd06f');
        gfx.text(Math.ceil(this.timeLeft) + 's', W - 20, 3, low ? '#ff9a9a' : '#f6f1e6', { align: 'right' });
      }
      if (this.progress) {
        const p = this.progress();
        MG.meter(W / 2 - 40, 4, 80, 6, p, '#4fa8ff');
        gfx.text(Math.round(p * 100) + '%', W / 2 + 46, 4, '#f6f1e6', { font: 'small' });
      }
      if (this.hintT > 0 && this.hint && !this.finished) {
        g.globalAlpha = Math.min(1, this.hintT);
        const tw = gfx.textWidth(this.hint, 'small');
        MG.panel(W / 2 - tw / 2 - 5, H - 15, tw + 10, 12, { r: 4, face: '#231b30', shadow: false });
        gfx.text(this.hint, W / 2, H - 12, '#f3eee2', { align: 'center', font: 'small' });
        g.globalAlpha = 1;
      }
      if (this.combo >= 2 && this.comboT > 0) {
        const pop = 1 + Math.max(0, this.comboT - 2.3) * 2;
        const txt = this.combo + 'x';
        const tw = gfx.textWidth(txt) + 10;
        const by = 18 - Math.round((pop - 1) * 3);
        MG.panel(W - 8 - tw, by, tw, 12, { r: 4, face: MG.GOLD });
        gfx.text(txt, W - 8 - tw / 2, by + 3, '#3a2a08', { align: 'center' });
      }
      if (this.intro) {
        const k = Math.min(1, this.startDelay / 0.3);
        g.globalAlpha = 0.85 * k;
        gfx.rect(0, H / 2 - 22, W, 44, '#160f20');
        g.globalAlpha = 1;
        gfx.hline(0, H / 2 - 22, W, MG.GOLD); gfx.hline(0, H / 2 + 21, W, MG.GOLD);
        g.save(); g.translate(W / 2, H / 2 - 10); g.scale(2, 2);
        gfx.text(this.title, 0, 0, MG.GOLD, { align: 'center', shadow: '#0d0912' });
        g.restore();
        if (this.hint) gfx.text(this.hint, W / 2, H / 2 + 11, '#e8e0d0', { align: 'center', font: 'small' });
      }
      if (this.finished && this.result) {
        const k = Math.min(1, (this.resultT || 0) / 0.3);
        g.globalAlpha = 0.62 * k; gfx.rect(0, 0, W, H, '#0c0812'); g.globalAlpha = 1;
        const bw = 210, bh = 84, bx = Math.round(W / 2 - bw / 2);
        const by = Math.round(H / 2 - bh / 2 - (1 - CH.ease.outBack(k)) * 40);
        MG.panel(bx, by, bw, bh, { r: 5 });
        const head = this.result.timeout ? 'TIME UP' : 'TASK COMPLETE';
        gfx.rrect(bx + 4, by + 4, bw - 8, 13, 3, this.result.timeout ? MG.RED : '#2f9d86');
        gfx.rrect(bx + 5, by + 5, bw - 10, 1, 1, this.result.timeout ? '#e0655a' : '#5ec5ac');
        gfx.text(head, W / 2, by + 7, '#fff6e4', { align: 'center', shadow: '#1d1424' });
        for (let i = 0; i < 3; i++) {
          const on = i < this.result.stars;
          const at = 0.4 + i * 0.25;
          const pop = on ? CH.clamp(((this.resultT || 0) - at) / 0.22, 0, 1) : 1;
          if (on && pop <= 0) continue;
          const r = on ? 9 * CH.ease.outBack(pop) : 8;
          MG.star(W / 2 - 26 + i * 26, by + 38, r, on ? MG.GOLD : '#b9ad99', { ink: on ? '#5a3f08' : '#8a8073' });
          if (on && pop > 0 && pop < 0.35) for (let s = 0; s < 4; s++) gfx.px(W / 2 - 26 + i * 26 + Math.cos(s * 1.6) * 13, by + 38 + Math.sin(s * 1.6) * 13, '#fff6d0');
        }
        const labels = ['Brenda saw that.', 'Passable.', 'Solid work!', 'SPOTLESS!'];
        gfx.text(this.result.label || labels[this.result.stars], W / 2, by + 56, '#3a2f22', { align: 'center', font: 'small' });
        gfx.hline(bx + 14, by + 65, bw - 28, '#cdc2ac');
        gfx.text('Score ' + Math.round(this.result.score * 100) + '%  -  ' + this.t.toFixed(1) + 's', W / 2, by + 70, '#6b5f4e', { align: 'center', font: 'small' });
      }
    }
    // Chubby's paw following the cursor (first-person hands)
    drawPaw(g, holding) {
      const x = Math.round(inp.mx), y = Math.round(inp.my);
      const janitor = S.job === 'janitor';
      const m = MG.m(janitor ? '#f0cb45' : '#b87c50', { dark: -34, light: 26 });
      const cuff = MG.m(janitor ? '#5f7a94' : '#c8352b', { dark: -32, light: 28 });
      MG.ink(x + 6, y + 8, 26, 30, (cx, cy) => {
        // fingers first so the palm overlaps their roots
        const fing = [[-4, -4, 3.0], [1, -5, 3.1], [6, -3, 2.9], [9, 1, 2.4]];
        for (const [fx, fy, fr] of fing) {
          gfx.ellipse(cx + fx, cy + fy + 1, fr, fr * 0.92, m.d);
          gfx.ellipse(cx + fx, cy + fy, fr * 0.9, fr * 0.82, m.base);
          gfx.px(cx + fx - 1, cy + fy - 1, m.l);
        }
        gfx.ellipse(cx + 1, cy + 3, 7.4, 5.2, m.d);
        gfx.ellipse(cx + 1, cy + 2, 7, 4.7, m.base);
        gfx.ellipse(cx - 1, cy, 3.6, 2.2, m.l);
        // cuff
        gfx.rrect(cx - 7, cy + 7, 15, 7, 2, cuff.d);
        gfx.rrect(cx - 7, cy + 6, 15, 6, 2, cuff.base);
        gfx.hline(cx - 6, cy + 7, 13, cuff.l);
      });
      if (holding) ui.cursor = 'grab'; else ui.cursor = 'hand';
    }
  }
  CH.MinigameScene = MinigameScene;

  CH.runMinigame = (scene) => { const sig = new CH.Signal(); const shown = CH.ui.objectiveShown; CH.ui.objectiveShown = false; scene.onDone = (r) => { CH.ui.objectiveShown = shown; sig.resolve(r); }; CH.game.push(scene); return sig; };

  // ---- Scrub mask: dirt that gets erased by a tool -------------------------------------------------
  class ScrubMask {
    constructor(x, y, w, h, paint) {
      this.x = x; this.y = y; this.w = w; this.h = h;
      this.c = gfx.makeCanvas(w, h); this.ctx = this.c.getContext('2d');
      gfx.pushTarget(this.ctx); paint(this.ctx, w, h); gfx.popTarget();
      this.total = this.count(); this.left = this.total; this.sampleT = 0;
      this.rebuildShadow();
    }
    count() { const d = this.ctx.getImageData(0, 0, this.w, this.h).data; let n = 0; for (let i = 3; i < d.length; i += 4) n += d[i]; return n; }
    // A dark silhouette copy, blitted one pixel down-right under the mess so a
    // spill sits ON the floor instead of being painted into it.
    rebuildShadow() {
      if (!this._sh) { this._sh = gfx.makeCanvas(this.w, this.h); this._shc = this._sh.getContext('2d'); }
      const c = this._shc;
      c.clearRect(0, 0, this.w, this.h);
      c.drawImage(this.c, 0, 0);
      c.globalCompositeOperation = 'source-in';
      c.fillStyle = 'rgba(24,14,30,0.42)';
      c.fillRect(0, 0, this.w, this.h);
      c.globalCompositeOperation = 'source-over';
    }
    erase(px, py, r, strength = 1) {
      const c = this.ctx; c.save(); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = strength;
      // pixel circle for crisp edge
      c.fillStyle = '#000';
      const cx = Math.round(px - this.x), cy = Math.round(py - this.y);
      for (let yy = -r; yy <= r; yy++) { const hw = Math.floor(Math.sqrt(r * r - yy * yy)); c.fillRect(cx - hw, cy + yy, hw * 2 + 1, 1); }
      c.restore(); this.dirty = true;
    }
    update(dt) { this.sampleT -= dt; if (this.sampleT <= 0 && this.dirty) { this.sampleT = 0.25; this.left = this.count(); this.rebuildShadow(); this.dirty = false; } }
    fraction() { return this.total ? this.left / this.total : 0; }
    draw(g) {
      if (this._sh) g.drawImage(this._sh, this.x + 1, this.y + 1);
      g.drawImage(this.c, this.x, this.y);
    }
    contains(px, py) { return px >= this.x && py >= this.y && px < this.x + this.w && py < this.y + this.h; }
  }
  CH.ScrubMask = ScrubMask;

  // ---- Drag & drop system ------------------------------------------------------------------------------
  class DragSystem {
    constructor(owner) { this.items = []; this.targets = []; this.held = null; this.owner = owner; this.offX = 0; this.offY = 0; }
    add(item) { item.home = item.home || { x: item.x, y: item.y }; item.w = item.w || 16; item.h = item.h || 16; item.vx = 0; item.vy = 0; this.items.push(item); return item; }
    remove(item) { const i = this.items.indexOf(item); if (i >= 0) this.items.splice(i, 1); if (this.held === item) this.held = null; }
    addTarget(t) { this.targets.push(t); return t; }
    itemAt(x, y) { for (let i = this.items.length - 1; i >= 0; i--) { const it = this.items[i]; if (it.locked) continue; if (x >= it.x - it.w / 2 && x <= it.x + it.w / 2 && y >= it.y - it.h / 2 && y <= it.y + it.h / 2) return it; } return null; }
    targetAt(x, y, item) { let best = null, bd = 1e9; for (const t of this.targets) { if (t.disabled) continue; const inside = x >= t.x - t.w / 2 - (t.snap || 0) && x <= t.x + t.w / 2 + (t.snap || 0) && y >= t.y - t.h / 2 - (t.snap || 0) && y <= t.y + t.h / 2 + (t.snap || 0); if (!inside) continue; if (t.accepts && !t.accepts(item)) continue; const d = CH.dist(x, y, t.x, t.y); if (d < bd) { bd = d; best = t; } } return best; }
    update(dt) {
      const mx = inp.mx, my = inp.my;
      if (!this.held && inp.mpressed) { const it = this.itemAt(mx, my); if (it) { this.held = it; this.offX = it.x - mx; this.offY = it.y - my; it.grabbed = true; it.wobble = 1; A.sfx('pop'); if (it.onGrab) it.onGrab(it); this.items.splice(this.items.indexOf(it), 1); this.items.push(it); } }
      if (this.held) {
        const it = this.held;
        const tx = mx + this.offX, ty = my + this.offY;
        it.vx = (tx - it.x) / Math.max(dt, 0.001); it.x = tx; it.y = ty;
        this.hoverTarget = this.targetAt(mx, my, it);
        if (!inp.mdown) {
          const t = this.hoverTarget;
          it.grabbed = false; this.held = null; this.hoverTarget = null;
          // the scene tests the drop position after this update, so the item
          // must not be pulled toward home before that happens
          it.justReleased = true; it.dropX = it.x; it.dropY = it.y;
          if (t) { A.sfx('snap'); const res = t.onDrop ? t.onDrop(it, t) : true; if (res !== false) { if (t.snapTo !== false) { it.x = t.x + (t.offX || 0); it.y = t.y + (t.offY || 0); } it.squash = 1; return; } }
          if (it.onDropFail) it.onDropFail(it); else this.springBack(it);
        }
      } else this.hoverTarget = null;
      // spring back animation
      for (const it of this.items) {
        if (it.justReleased) { it.justReleased = false; }
        else if (it.returning) { it.x = CH.lerp(it.x, it.home.x, Math.min(1, dt * 12)); it.y = CH.lerp(it.y, it.home.y, Math.min(1, dt * 12)); if (CH.dist(it.x, it.y, it.home.x, it.home.y) < 1) { it.x = it.home.x; it.y = it.home.y; it.returning = false; } }
        if (it.squash) { it.squash = Math.max(0, it.squash - dt * 4); }
        if (it.wobble) it.wobble = Math.max(0, it.wobble - dt * 3);
      }
    }
    springBack(it) { it.returning = true; A.sfx('back'); }
    draw(g) {
      for (const t of this.targets) if (t.draw) t.draw(g, t, this.hoverTarget === t);
      for (const it of this.items) {
        // a snapped item squashes on impact and bounces once on the way out
        const sq = it.squash ? Math.sin(it.squash * Math.PI) * 0.25 : 0;
        const bounce = it.squash ? -Math.sin(Math.max(0, it.squash - 0.45) * Math.PI * 2.2) * 3 : 0;
        const sx = 1 + sq, sy = 1 - sq;
        if (!it.noShadow) {
          const lift = it.grabbed ? 5 : 2;
          g.save(); g.globalAlpha = it.grabbed ? 0.3 : 0.18;
          gfx.ellipse(Math.round(it.x) + (it.grabbed ? 2 : 0), Math.round(it.y) + it.h / 2 + lift, it.w / 2.2, Math.max(1.5, it.h / 7), '#140d1c');
          g.restore();
        }
        g.save(); g.translate(Math.round(it.x), Math.round(it.y) + Math.round(bounce));
        if (it.grabbed) { g.translate(0, -3); if (it.wobble) g.rotate(Math.sin(this.owner.t * 30) * 0.08 * it.wobble); }
        g.scale(sx, sy);
        it.draw(g, 0, 0, it);
        g.restore();
      }
    }
  }
  CH.DragSystem = DragSystem;

  // ---- Hold meter: hold mouse on an area ----------------------------------------------------------------
  class HoldMeter {
    constructor(rect, dur, opts = {}) { this.r = rect; this.dur = dur; this.p = 0; this.done = false; this.opts = opts; this.holding = false; }
    update(dt) {
      this.holding = inp.mdown && inp.mouseIn(this.r) && !this.done;
      if (this.holding) { this.p += dt / this.dur; if (this.opts.sfx && Math.floor(this.p * 10) !== Math.floor((this.p - dt / this.dur) * 10)) A.sfx(this.opts.sfx); if (this.p >= 1) { this.p = 1; this.done = true; if (this.opts.onDone) this.opts.onDone(); } }
      else if (!this.done && this.opts.decay) this.p = Math.max(0, this.p - dt * this.opts.decay);
      if (inp.mouseIn(this.r)) ui.cursor = 'hand';
    }
    draw(g, label) {
      const r = this.r;
      const col = this.opts.color || '#6fd06f';
      MG.meter(r.x, r.y - 7, r.w, 5, this.p, col);
      if (this.holding) {
        const kx = r.x + Math.round(r.w * this.p);
        gfx.vline(kx, r.y - 9, 9, '#fffbe8');
        for (let i = 0; i < 3; i++) gfx.px(kx + CH.rand(-3, 3), r.y - 10 - CH.rand(0, 4), col);
      }
      if (label) {
        const pulse = this.holding ? 0 : Math.sin((CH.game && CH.game.t || 0) * 6) > 0 ? 1 : 0;
        MG.tag(label, r.x + r.w / 2, r.y - 20 - pulse, { align: 'center', face: this.holding ? MG.GOLD : MG.CREAM });
      }
    }
  }
  CH.HoldMeter = HoldMeter;

  // ---- common first-person kitchen backdrop ---------------------------------------------------------------
  CH.drawKitchenBackdrop = (g, t, opts = {}) => {
    // ---- tiled wall: warm cream tiles, grey grout, grime settling at the base
    gfx.vgrad(0, 0, W, 120, ['#efe9da', '#eae3d2', '#e2dac8', '#d9d0bc']);
    for (let y = 16; y < 120; y += 12) {
      const off = ((y / 12) & 1) * 12;
      for (let x = -off; x < W; x += 24) {
        const k = (x * 7 + y * 13) % 11;
        gfx.rect(x + 1, y + 1, 22, 10, k === 0 ? '#e4dcca' : k === 3 ? '#f4efe2' : '#ece5d5');
        gfx.hline(x + 2, y + 1, 20, '#f7f2e6');
        gfx.hline(x + 1, y + 10, 22, '#d6cdb9');
      }
    }
    // grime in the grout near the counter
    for (let x = 0; x < W; x += 3) gfx.px(x, 116 + ((x * 5) % 3), 'rgba(120,104,80,0.35)');
    // brand band
    gfx.rect(0, 0, W, 13, '#b62f27');
    gfx.hline(0, 0, W, '#d9534a');
    gfx.rect(0, 13, W, 2, '#f5c33b');
    gfx.hline(0, 15, W, '#a4801f');
    // extractor hood: brushed steel with dark vents and rivets
    gfx.rect(18, 16, W - 36, 11, '#8e929c');
    gfx.hline(18, 16, W - 36, '#c2c6cf');
    gfx.hline(18, 26, W - 36, '#5b5f68');
    for (let x = 28; x < W - 28; x += 24) { gfx.rect(x, 18, 16, 6, '#42464f'); gfx.hline(x, 18, 16, '#2e323a'); gfx.hline(x + 1, 23, 14, '#676c77'); }
    for (let x = 22; x < W - 20; x += 40) gfx.px(x, 21, '#c8ccd4');
    // stainless counter
    gfx.rect(0, 120, W, H - 120, '#b2b7c0');
    gfx.rect(0, 120, W, 2, '#eef2f6');
    gfx.hline(0, 122, W, '#cbd0d7');
    gfx.rect(0, 123, W, 2, '#82868f');
    for (let y = 126; y < H; y += 2) gfx.hline(0, y, W, y % 4 ? '#abb0b9' : '#b8bdc6');
    // brushed streaks + a soft bounce of the wall light
    for (let i = 0; i < 40; i++) { const x = (i * 71) % W; gfx.vline(x, 126, H - 126, i % 3 ? 'rgba(255,255,255,0.05)' : 'rgba(40,44,52,0.05)'); }
    g.globalAlpha = 0.12; gfx.rect(0, 125, W, 10, '#ffffff'); g.globalAlpha = 1;
    // ticket rail
    gfx.rect(0, 27, W, 3, '#4c505a');
    gfx.hline(0, 27, W, '#787d87');
    if (opts.steam) for (let i = 0; i < 4; i++) MG.steam(70 + i * 105, 70, t, { n: 3, speed: 0.35, rise: 34, alpha: 0.3, seed: i, w: 2.6 });
  };

  // order tickets (shared by kitchen games)
  CH.drawTicket = (g, x, y, lines, opts = {}) => {
    x = Math.round(x); y = Math.round(y);
    const w = opts.w || 64, h = 14 + lines.length * 8;
    const col = opts.color || '#c8352b';
    gfx.rect(x + 2, y + 2, w, h, 'rgba(14,9,20,0.30)');
    gfx.frame(x, y, w, h, MG.INK);
    gfx.rect(x + 1, y + 1, w - 2, h - 2, '#fdf8ea');
    gfx.rect(x + 1, y + 1, w - 2, 5, col);
    gfx.hline(x + 1, y + 1, w - 2, gfx.mix(col, '#fff', 0.35));
    gfx.hline(x + 1, y + 6, w - 2, gfx.shade(col, -28));
    // perforation above the torn edge
    for (let i = 2; i < w - 2; i += 3) gfx.px(x + i, y + h - 4, '#d7cbb0');
    gfx.hline(x + 1, y + h - 2, w - 2, '#e6dcc4');
    gfx.text(opts.title || '#' + (opts.num || 1), x + 3, y + 7, '#3a2f22', { font: 'small' });
    if (opts.timer !== undefined) {
      const p = CH.clamp(opts.timer, 0, 1);
      MG.meter(x + w - 22, y + 8, 19, 3, p, p < 0.3 ? (Math.sin((CH.game && CH.game.t || 0) * 14) > 0 ? '#ff5a4a' : '#c8352b') : '#4f9d3a', { track: '#ddd3bd' });
    }
    lines.forEach((l, i) => gfx.text(l, x + 3, y + 14 + i * 8, l.done ? '#3a9a5a' : '#2c2419', { font: 'small' }));
    return h;
  };

  // ============================================================================
  // FOOD - shared painters. Every one of these is a thing you can pick up, so
  // every one of them gets an ink line and a real shading ramp.
  // ============================================================================
  const F = (CH.FOOD = {});

  // ---- burger parts ----------------------------------------------------------
  F.patty = (g, x, y, cook = 1) => {
    const raw = '#bd4f5c', seared = '#8a4b2a', done = '#57301a', char = '#241712';
    const base = cook < 0.35 ? gfx.mix(raw, seared, cook / 0.35)
      : cook < 1 ? gfx.mix(seared, done, (cook - 0.35) / 0.65)
        : gfx.mix(done, char, Math.min(1, (cook - 1) / 0.55));
    const m = MG.m(base, { dark: -24, darker: -44, light: 22 });
    MG.ink(x, y, 28, 18, (cx, cy) => {
      cy -= 1;
      // the slab has real thickness: a dark under-edge, a body, a lit top face
      gfx.ellipse(cx, cy + 2, 11.4, 4.4, m.dd);
      gfx.ellipse(cx, cy + 1, 11.4, 4.4, m.d);
      gfx.ellipse(cx, cy - 1, 11.2, 4.2, m.base);
      // torn, hand-pressed rim
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + 0.5;
        gfx.ellipse(cx + Math.cos(a) * 9.4, cy - 1 + Math.sin(a) * 3.2, 2.3, 1.5, i % 2 ? m.base : m.d);
      }
      gfx.ellipse(cx, cy - 2, 9.6, 3.1, cook < 0.35 ? gfx.shade(m.base, 10) : m.base);
      if (cook < 0.4) {
        // raw: wet, marbled, heavy
        gfx.ellipse(cx - 2, cy - 3, 4.6, 1.7, m.l);
        for (const [fx, fy] of [[-6, -2], [-1, -3], [4, -2], [6, 0], [-4, 0], [1, 0]]) gfx.px(cx + fx, cy + fy, gfx.mix(m.l, '#ffe9e2', 0.5));
        MG.gloss(cx, cy - 2, 7, 2.6, 'rgba(255,230,230,0.35)');
      } else {
        // seared: grill bars burned across the face, crusty edge
        const bar = cook > 1 ? '#150e0c' : gfx.shade(m.dd, -8);
        for (let i = -1; i <= 1; i++) {
          const yy = cy - 2 + i * 2;
          gfx.rect(cx - 7 + i, yy, 14, 1, bar);
          gfx.px(cx - 8 + i, yy, bar); gfx.px(cx + 7 + i, yy, bar);
        }
        gfx.ellipse(cx - 3, cy - 3, 3.4, 1.1, gfx.mix(m.l, '#ffd9a0', 0.4));
      }
      if (cook > 1.1) {
        // charred: black blisters and a couple of live embers at the rim
        for (const [bx2, by2] of [[-6, -2], [2, -3], [6, 0], [-2, 1]]) gfx.ellipse(cx + bx2, cy + by2, 2, 1.2, '#120b0e');
        gfx.px(cx - 9, cy, '#e8752c'); gfx.px(cx + 9, cy - 1, '#f5a13b');
      }
    });
  };

  F.bunBottom = (g, x, y) => {
    const m = MG.m('#d09343', { dark: -32, darker: -54, light: 24 });
    MG.ink(x, y, 30, 18, (cx, cy) => {
      gfx.ellipse(cx, cy, 12, 4, m.d);
      gfx.rect(cx - 12, cy - 4, 25, 5, m.base);
      gfx.ellipse(cx, cy - 4, 12, 2.6, m.l);          // cut face
      gfx.ellipse(cx, cy - 4, 9.5, 1.7, gfx.mix(m.l, '#fff3d8', 0.45));
      gfx.hline(cx - 12, cy + 1, 25, m.dd);           // resting shadow line
      for (let i = -10; i <= 10; i += 5) gfx.px(cx + i, cy - 2, m.d);   // crumb
      gfx.px(cx - 6, cy - 5, '#fff3d8'); gfx.px(cx + 5, cy - 5, '#fff3d8');
    });
  };

  F.bunTop = (g, x, y) => {
    const m = MG.m('#dfa24c', { dark: -34, darker: -56, light: 22 });
    MG.ink(x, y, 30, 20, (cx, cy) => {
      gfx.ellipse(cx, cy + 1, 12, 5.6, m.d);
      gfx.ellipse(cx, cy - 1, 12, 5.4, m.base);
      gfx.ellipse(cx, cy - 2.6, 9.6, 3.8, m.l);
      MG.gloss(cx + 1, cy - 2, 9, 4, gfx.mix(m.rim, '#fff', 0.3));
      gfx.hline(cx - 11, cy + 5, 23, m.dd);
      for (const [sx, sy] of [[-7, -3], [-2, -5], [3, -4], [7, -1], [-4, 0], [1, -1], [6, -5]]) {
        gfx.rect(cx + sx, cy + sy, 2, 1, '#fff5de');
        gfx.px(cx + sx, cy + sy + 1, m.d);
      }
    });
  };

  F.cheese = (g, x, y) => {
    const m = MG.m('#f2b933', { dark: -30, darker: -50, light: 26 });
    MG.ink(x, y, 32, 14, (cx, cy) => {
      gfx.rect(cx - 12, cy - 2, 25, 4, m.base);
      gfx.hline(cx - 12, cy - 2, 25, m.l);
      gfx.hline(cx - 12, cy + 1, 25, m.d);
      // melted corners drooping over the patty
      gfx.tri(cx - 13, cy - 2, cx - 13, cy + 4, cx - 8, cy + 1, m.base);
      gfx.tri(cx + 12, cy - 2, cx + 13, cy + 3, cx + 8, cy + 1, m.base);
      gfx.px(cx - 13, cy + 3, m.d); gfx.px(cx + 12, cy + 2, m.d);
      gfx.rect(cx - 8, cy - 2, 6, 1, gfx.mix(m.l, '#fff', 0.5));
    });
  };

  F.lettuce = (g, x, y) => {
    const m = MG.m('#69bf50', { dark: -30, light: 26 });
    MG.ink(x, y, 28, 14, (cx, cy) => {
      for (let i = -10; i <= 10; i += 4) {
        const yy = cy - (Math.abs(i) % 3) - 1;
        gfx.ellipse(cx + i, yy + 1, 3, 2, m.d);
        gfx.ellipse(cx + i, yy, 2.8, 1.8, i % 8 === 0 ? m.base : m.l);
        gfx.px(cx + i - 1, yy - 1, gfx.mix(m.l, '#f2ffdf', 0.5));
      }
    });
  };

  F.tomato = (g, x, y) => {
    const m = MG.m('#d13c3c', { dark: -28, light: 28 });
    MG.ink(x, y, 28, 12, (cx, cy) => {
      for (const sx of [-5, 5]) {
        gfx.ellipse(cx + sx, cy + 1, 6, 2.6, m.d);
        gfx.ellipse(cx + sx, cy, 6, 2.4, m.base);
        gfx.ellipse(cx + sx, cy - 0.4, 4, 1.4, m.l);        // pulp
        gfx.px(cx + sx - 2, cy - 1, '#ffd9c8'); gfx.px(cx + sx + 2, cy, '#ffd9c8');
      }
    });
  };

  F.pickle = (g, x, y) => {
    const m = MG.m('#5a8a2a', { dark: -28, light: 32 });
    MG.ink(x, y, 24, 12, (cx, cy) => {
      for (const sx of [-5, 5]) {
        gfx.ellipse(cx + sx, cy + 1, 4.4, 2.2, m.d);
        gfx.ellipse(cx + sx, cy, 4.2, 2, m.base);
        gfx.ellipse(cx + sx, cy - 0.4, 2.6, 1.1, m.l);
        gfx.px(cx + sx - 1, cy, '#d8e8a0'); gfx.px(cx + sx + 1, cy - 1, '#d8e8a0');
        for (let i = 0; i < 4; i++) gfx.px(cx + sx - 3 + i * 2, cy + (i % 2 ? 1 : -1), m.d);  // bumpy skin
      }
    });
  };

  F.onion = (g, x, y) => {
    MG.ink(x, y, 26, 12, (cx, cy) => {
      for (const sx of [-4, 4]) {
        gfx.ellipseOutline(cx + sx, cy + 1, 5, 2.2, '#c9b3d8');
        gfx.ellipseOutline(cx + sx, cy, 5, 2.2, '#f2e7f8');
        gfx.ellipseOutline(cx + sx, cy, 2.6, 1.2, '#e4d4ee');
      }
    });
  };

  F.bacon = (g, x, y) => {
    MG.ink(x, y, 26, 12, (cx, cy) => {
      for (let i = 0; i < 2; i++) {
        const bx = cx - 9 + i * 10;
        for (let k = 0; k < 9; k++) {
          const wave = Math.round(Math.sin(k * 1.1 + i) * 1.2);
          gfx.rect(bx + k, cy - 1 + wave, 1, 3, '#9d3324');
          gfx.px(bx + k, cy - 1 + wave, k % 3 ? '#c4553c' : '#f0b49c');
          if (k % 3 === 1) gfx.px(bx + k, cy + 1 + wave, '#f0b49c');
        }
      }
    });
  };

  F.sauce = (g, x, y, c = '#d13c3c') => {
    const m = MG.m(c, { dark: -30, light: 34 });
    MG.ink(x, y, 26, 10, (cx, cy) => {
      gfx.ellipse(cx, cy + 0.5, 9, 1.8, m.d);
      gfx.ellipse(cx, cy - 0.3, 8.6, 1.5, m.base);
      gfx.px(cx - 4, cy - 1, m.l); gfx.px(cx + 3, cy - 1, m.l); gfx.px(cx - 1, cy - 1, m.l);
      gfx.px(cx - 10, cy + 1, m.base); gfx.px(cx + 10, cy, m.base);   // drips
    });
  };

  // ---- packaging --------------------------------------------------------------
  F.wrapper = (g, x, y, open = true) => {
    const m = MG.m('#f2c13b', { dark: -30, light: 22 });
    MG.ink(x, y, 32, 16, (cx, cy) => {
      gfx.rect(cx - 14, cy - 6, 28, 12, m.base);
      for (let i = 0; i < 7; i++) gfx.vline(cx - 13 + i * 4, cy - 5, 10, i % 2 ? m.d : gfx.mix(m.base, '#fff', 0.25));
      gfx.hline(cx - 14, cy - 6, 28, m.l);
      gfx.hline(cx - 14, cy + 5, 28, m.d);
      gfx.text('D', cx, cy - 4, MG.RED, { align: 'center' });
    });
  };

  F.wrapped = (g, x, y) => {
    const m = MG.m('#f2c13b', { dark: -32, light: 20 });
    MG.ink(x, y, 32, 20, (cx, cy) => {
      gfx.ellipse(cx, cy + 1, 13, 7, m.d);
      gfx.ellipse(cx, cy - 1, 12.6, 6.4, m.base);
      gfx.ellipse(cx - 3, cy - 3, 6, 2.4, m.l);
      // pinched paper folds
      for (const fx of [-10, -5, 0, 5, 10]) gfx.line(cx + fx, cy - 5, cx + fx * 0.6, cy + 4, m.d);
      gfx.rect(cx - 5, cy + 3, 10, 3, MG.RED);          // seal tape
      gfx.hline(cx - 5, cy + 3, 10, '#e0655a');
      gfx.text('D', cx, cy - 5, MG.RED, { align: 'center' });
    });
  };

  F.friesBox = (g, x, y, fill = 1, size = 'M') => {
    const w = size === 'L' ? 14 : size === 'S' ? 9 : 11;
    const m = MG.m('#c8352b', { dark: -28, light: 28 });
    const fr = MG.m('#f2c342', { dark: -28, light: 24 });
    MG.ink(x, y, 26, 40, (cx, cy) => {
      if (fill > 0) {
        const n = Math.round(fill * 7);
        for (let i = 0; i < n; i++) {
          const fx = cx - w / 2 + 1 + i * (w / 7), fy = cy - 14 - (i % 3) * 2;
          gfx.rect(fx, fy, 2, 13, i % 2 ? fr.d : gfx.shade(fr.base, -10));
          gfx.vline(fx, fy, 12, i % 2 ? fr.base : fr.l);
          gfx.px(fx, fy, gfx.mix(fr.l, '#fff6d0', 0.5));
        }
      }
      // carton: tapered, with the chevron front panel
      gfx.rect(cx - w / 2, cy - 8, w, 10, m.d);
      gfx.rect(cx - w / 2 + 1, cy - 8, w - 2, 9, m.base);
      gfx.rect(cx - w / 2 - 1, cy - 9, w + 2, 2, m.l);
      gfx.hline(cx - w / 2 - 1, cy - 10, w + 2, gfx.mix(m.l, '#fff', 0.4));
      gfx.vline(cx - w / 2 + 1, cy - 7, 8, gfx.mix(m.base, '#fff', 0.2));
      gfx.text('D', cx, cy - 6, '#f5c33b', { align: 'center', font: 'small' });
    }, { ax: 13, ay: 32 });
  };

  F.cup = (g, x, y, fill = 0, size = 'M', color = '#5a2a10', lid = false) => {
    const h = size === 'L' ? 20 : size === 'S' ? 13 : 16, w = size === 'L' ? 14 : size === 'S' ? 10 : 12;
    MG.ink(x, y, 24, 40, (cx, cy) => {
      // tapered paper cup
      for (let i = 0; i < h; i++) {
        const k = i / h, ww = Math.round(w - k * 2);
        gfx.rect(cx - ww / 2, cy - h + i, ww, 1, '#f2f2f6');
      }
      gfx.rect(cx - w / 2 + 1, cy - h + 1, 2, h - 2, '#ffffff');
      gfx.vline(cx + w / 2 - 2, cy - h + 1, h - 2, '#d6d6e0');
      gfx.ellipse(cx, cy - h, w / 2, 1.6, '#fafaff');
      if (fill > 0) {
        const fh = Math.round((h - 3) * Math.min(1, fill));
        gfx.rect(cx - w / 2 + 2, cy - 2 - fh, w - 4, fh, color);
        gfx.hline(cx - w / 2 + 2, cy - 2 - fh, w - 4, gfx.mix(color, '#fff', 0.35));
        gfx.vline(cx - w / 2 + 2, cy - 2 - fh, fh, gfx.mix(color, '#fff', 0.18));
      }
      gfx.rect(cx - w / 2 + 1, cy - h + 4, w - 2, 3, MG.RED);
      gfx.hline(cx - w / 2 + 1, cy - h + 4, w - 2, '#e0655a');
      gfx.hline(cx - w / 2 + 2, cy - 1, w - 4, '#c9c9d4');
      if (lid) {
        gfx.rect(cx - w / 2 - 1, cy - h - 3, w + 2, 4, '#e6e6f0');
        gfx.hline(cx - w / 2 - 1, cy - h - 3, w + 2, '#fbfbff');
        gfx.hline(cx - w / 2 - 1, cy - h, w + 2, '#bcbcc8');
        gfx.rect(cx + 1, cy - h - 11, 2, 9, MG.RED);
        gfx.px(cx + 1, cy - h - 11, '#f0847a');
      }
    }, { ax: 12, ay: 34 });
  };

  F.bag = (g, x, y, open = true, items = 0) => {
    const m = MG.m('#d9ae74', { dark: -30, darker: -50, light: 18 });
    MG.ink(x, y, 36, 36, (cx, cy) => {
      gfx.rect(cx - 14, cy - 22, 28, 22, m.base);
      gfx.rect(cx - 14, cy - 22, 6, 22, m.l);           // lit side panel
      gfx.rect(cx + 9, cy - 22, 5, 22, m.d);            // shaded side panel
      for (let i = 0; i < 4; i++) gfx.vline(cx - 9 + i * 6, cy - 21, 20, 'rgba(140,100,58,0.25)');   // paper creases
      gfx.hline(cx - 14, cy - 1, 28, m.dd);
      if (open) {
        gfx.rect(cx - 15, cy - 26, 30, 5, gfx.mix(m.base, '#fff', 0.25));
        gfx.rect(cx - 12, cy - 24, 24, 2, '#6d4f26');   // the dark mouth
        gfx.hline(cx - 15, cy - 26, 30, m.rim);
      } else {
        gfx.rect(cx - 12, cy - 26, 24, 4, m.d);
        gfx.rect(cx - 10, cy - 28, 20, 3, m.base);
        gfx.hline(cx - 10, cy - 28, 20, m.l);
        for (let i = 0; i < 3; i++) gfx.px(cx - 6 + i * 6, cy - 25, '#6d4f26');   // staples
      }
      gfx.text('D', cx, cy - 15, MG.RED, { align: 'center' });
      for (let i = 0; i < Math.min(3, items); i++) { gfx.rect(cx - 8 + i * 6, cy - 21, 4, 3, '#f2c342'); gfx.px(cx - 8 + i * 6, cy - 21, '#fff0c0'); }
    }, { ax: 18, ay: 32 });
  };

  F.tray = (g, x, y) => {
    const m = MG.m('#a33a3a', { dark: -34, darker: -54, light: 24 });
    MG.ink(x, y, 50, 14, (cx, cy) => {
      gfx.rect(cx - 22, cy - 4, 44, 6, m.d);
      gfx.rect(cx - 20, cy - 5, 40, 5, m.base);
      gfx.hline(cx - 20, cy - 5, 40, m.l);
      for (let i = 0; i < 5; i++) gfx.vline(cx - 14 + i * 7, cy - 3, 3, m.d);   // drain ribs
      gfx.hline(cx - 22, cy + 2, 44, m.dd);
    });
  };

  F.nugget = (g, x, y) => {
    const m = MG.m('#daa244', { dark: -28, light: 26 });
    MG.ink(x, y, 12, 10, (cx, cy) => {
      gfx.ellipse(cx, cy + 0.5, 4.2, 3.2, m.d);
      gfx.ellipse(cx, cy, 4, 3, m.base);
      gfx.ellipse(cx - 1, cy - 1, 2, 1.2, m.l);
      gfx.px(cx + 2, cy + 1, m.d); gfx.px(cx - 2, cy + 1, m.d);
    });
  };

  F.pie = (g, x, y) => {
    const m = MG.m('#d59a48', { dark: -30, light: 24 });
    MG.ink(x, y, 20, 12, (cx, cy) => {
      gfx.rect(cx - 8, cy - 3, 16, 6, m.d);
      gfx.rect(cx - 8, cy - 3, 16, 5, m.base);
      gfx.hline(cx - 8, cy - 3, 16, m.l);
      for (let i = 0; i < 3; i++) gfx.rect(cx - 4 + i * 4, cy - 2, 2, 1, '#8a3020');   // vents
      gfx.px(cx - 6, cy + 1, m.d); gfx.px(cx + 5, cy + 1, m.d);
    });
  };
})(window.CH);
