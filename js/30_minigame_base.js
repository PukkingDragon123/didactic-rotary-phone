// ============================================================================
// Minigame framework: base scene, scrub masks, drag & drop, hold meters, results
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, fx = CH.fx, A = CH.audio, inp = CH.input, S = CH.state;
  const W = CH.W, H = CH.H;

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
      // top bar
      gfx.rect(0, 0, W, 14, 'rgba(0,0,0,0.75)');
      gfx.text(this.title, 6, 3, '#f5c33b'); if (this.subtitle) gfx.text(this.subtitle, 6 + gfx.textWidth(this.title) + 8, 4, '#ccc', { font: 'small' });
      if (this.timeLimit) { const p = this.timeLeft / this.timeLimit; ui.bar(W - 90, 4, 70, 6, p, p < 0.25 ? (Math.sin(this.t * 20) > 0 ? '#ff4040' : '#ff8080') : '#6fd06f'); gfx.text(Math.ceil(this.timeLeft) + 's', W - 16, 3, '#fff'); }
      if (this.progress) { const p = this.progress(); ui.bar(W / 2 - 40, 4, 80, 6, p, '#4fa8ff'); gfx.text(Math.round(p * 100) + '%', W / 2 + 46, 3, '#fff', { font: 'small' }); }
      if (this.hintT > 0 && this.hint && !this.finished) { g.globalAlpha = Math.min(1, this.hintT); gfx.text(this.hint, W / 2, H - 12, '#fff', { align: 'center', outline: '#000', font: 'small' }); g.globalAlpha = 1; }
      if (this.combo >= 2 && this.comboT > 0) { gfx.text(this.combo + 'x', W - 16, 18, '#f5c33b', { align: 'right', outline: '#000' }); }
      if (this.intro) { g.globalAlpha = 0.7 * Math.min(1, this.startDelay / 0.3); gfx.rect(0, H / 2 - 20, W, 40, '#000'); g.globalAlpha = 1; g.save(); g.translate(W / 2, H / 2 - 8); g.scale(2, 2); gfx.text(this.title, 0, 0, '#f5c33b', { align: 'center', shadow: '#000' }); g.restore(); if (this.hint) gfx.text(this.hint, W / 2, H / 2 + 10, '#fff', { align: 'center', font: 'small' }); }
      if (this.finished && this.result) {
        const k = Math.min(1, (this.resultT || 0) / 0.3);
        g.globalAlpha = 0.6 * k; gfx.rect(0, 0, W, H, '#000'); g.globalAlpha = 1;
        const bw = 200, bh = 70, bx = W / 2 - bw / 2, by = H / 2 - bh / 2 - Math.round((1 - CH.ease.outBack(k)) * 40);
        ui.drawBox(bx, by, bw, bh, { border: '#f5c33b' });
        gfx.text(this.result.timeout ? 'TIME UP' : 'TASK COMPLETE', W / 2, by + 8, '#fff', { align: 'center' });
        for (let i = 0; i < 3; i++) { const on = i < this.result.stars && this.resultT > 0.4 + i * 0.25; g.save(); g.translate(W / 2 - 24 + i * 24, by + 24); g.scale(2, 2); gfx.text('★', 0, 0, on ? '#f5c33b' : '#444', { align: 'center' }); g.restore(); }
        const labels = ['Brenda saw that.', 'Passable.', 'Solid work!', 'SPOTLESS!'];
        gfx.text(this.result.label || labels[this.result.stars], W / 2, by + 48, '#ccc', { align: 'center', font: 'small' });
        gfx.text('Score ' + Math.round(this.result.score * 100) + '%  -  ' + this.t.toFixed(1) + 's', W / 2, by + 57, '#aaa', { align: 'center', font: 'small' });
      }
    }
    // Chubby's paw following the cursor (first-person hands)
    drawPaw(g, holding) {
      const x = Math.round(inp.mx), y = Math.round(inp.my);
      const glove = S.job === 'janitor' ? '#f0d040' : '#8a5a3b';
      gfx.ellipse(x + 6, y + 10, 7, 5, glove); gfx.ellipse(x + 2, y + 6, 3, 3, glove); gfx.ellipse(x + 7, y + 5, 3, 3, glove); gfx.ellipse(x + 12, y + 7, 3, 3, glove);
      gfx.rect(x + 1, y + 13, 11, 6, S.job === 'janitor' ? '#5f7a94' : '#c8352b');
      if (holding) ui.cursor = 'grab'; else ui.cursor = 'hand';
    }
  }
  CH.MinigameScene = MinigameScene;

  CH.runMinigame = (scene) => { const sig = new CH.Signal(); scene.onDone = (r) => sig.resolve(r); CH.game.push(scene); return sig; };

  // ---- Scrub mask: dirt that gets erased by a tool -------------------------------------------------
  class ScrubMask {
    constructor(x, y, w, h, paint) {
      this.x = x; this.y = y; this.w = w; this.h = h;
      this.c = gfx.makeCanvas(w, h); this.ctx = this.c.getContext('2d');
      gfx.pushTarget(this.ctx); paint(this.ctx, w, h); gfx.popTarget();
      this.total = this.count(); this.left = this.total; this.sampleT = 0;
    }
    count() { const d = this.ctx.getImageData(0, 0, this.w, this.h).data; let n = 0; for (let i = 3; i < d.length; i += 4) n += d[i]; return n; }
    erase(px, py, r, strength = 1) {
      const c = this.ctx; c.save(); c.globalCompositeOperation = 'destination-out'; c.globalAlpha = strength;
      // pixel circle for crisp edge
      c.fillStyle = '#000';
      const cx = Math.round(px - this.x), cy = Math.round(py - this.y);
      for (let yy = -r; yy <= r; yy++) { const hw = Math.floor(Math.sqrt(r * r - yy * yy)); c.fillRect(cx - hw, cy + yy, hw * 2 + 1, 1); }
      c.restore(); this.dirty = true;
    }
    update(dt) { this.sampleT -= dt; if (this.sampleT <= 0 && this.dirty) { this.sampleT = 0.25; this.left = this.count(); this.dirty = false; } }
    fraction() { return this.total ? this.left / this.total : 0; }
    draw(g) { g.drawImage(this.c, this.x, this.y); }
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
          if (t) { A.sfx('snap'); const res = t.onDrop ? t.onDrop(it, t) : true; if (res !== false) { if (t.snapTo !== false) { it.x = t.x + (t.offX || 0); it.y = t.y + (t.offY || 0); } it.squash = 1; return; } }
          if (it.onDropFail) it.onDropFail(it); else this.springBack(it);
        }
      } else this.hoverTarget = null;
      // spring back animation
      for (const it of this.items) {
        if (it.returning) { it.x = CH.lerp(it.x, it.home.x, Math.min(1, dt * 12)); it.y = CH.lerp(it.y, it.home.y, Math.min(1, dt * 12)); if (CH.dist(it.x, it.y, it.home.x, it.home.y) < 1) { it.x = it.home.x; it.y = it.home.y; it.returning = false; } }
        if (it.squash) { it.squash = Math.max(0, it.squash - dt * 4); }
        if (it.wobble) it.wobble = Math.max(0, it.wobble - dt * 3);
      }
    }
    springBack(it) { it.returning = true; A.sfx('back'); }
    draw(g) {
      for (const t of this.targets) if (t.draw) t.draw(g, t, this.hoverTarget === t);
      for (const it of this.items) {
        const sq = it.squash ? Math.sin(it.squash * Math.PI) * 0.25 : 0;
        const sx = 1 + sq, sy = 1 - sq;
        g.save(); g.translate(Math.round(it.x), Math.round(it.y));
        if (it.grabbed) { g.translate(0, -2); if (it.wobble) g.rotate(Math.sin(this.owner.t * 30) * 0.08 * it.wobble); }
        g.scale(sx, sy);
        if (it.grabbed) { g.globalAlpha = 0.3; gfx.ellipse(0, it.h / 2 + 4, it.w / 2, 3, '#000'); g.globalAlpha = 1; }
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
    draw(g, label) { const r = this.r; ui.bar(r.x, r.y - 6, r.w, 4, this.p, this.opts.color || '#6fd06f'); if (label) gfx.text(label, r.x + r.w / 2, r.y - 14, '#fff', { align: 'center', font: 'small', outline: '#000' }); }
  }
  CH.HoldMeter = HoldMeter;

  // ---- common first-person kitchen backdrop ---------------------------------------------------------------
  CH.drawKitchenBackdrop = (g, t, opts = {}) => {
    // tiled wall
    gfx.rect(0, 0, W, 120, '#e8e4d8');
    for (let y = 14; y < 120; y += 12) for (let x = -((y / 12) & 1) * 12; x < W; x += 24) gfx.rect(x, y, 23, 11, (x + y) % 5 === 0 ? '#dcd8cc' : '#efebe0');
    gfx.rect(0, 0, W, 14, '#c8352b'); gfx.rect(0, 14, W, 2, '#f5c33b');
    // hood / vents
    gfx.rect(20, 16, W - 40, 10, '#8a8a94'); for (let x = 30; x < W - 30; x += 24) gfx.rect(x, 18, 16, 6, '#5a5a66');
    // stainless counter (perspective)
    gfx.rect(0, 120, W, H - 120, '#b8bcc4'); gfx.rect(0, 120, W, 3, '#e8ecf0'); gfx.rect(0, 123, W, 2, '#8a8e96');
    for (let y = 126; y < H; y += 2) gfx.hline(0, y, W, y % 4 ? '#b0b4bc' : '#bcc0c8');
    // ticket rail
    gfx.rect(0, 26, W, 3, '#5a5a66');
    if (opts.steam) for (let i = 0; i < 4; i++) { const k = (t * 0.4 + i * 0.25) % 1; gfx.px(80 + i * 100 + Math.round(Math.sin(t + i) * 3), 60 - k * 40, `rgba(255,255,255,${0.5 - k * 0.5})`); }
  };

  // order tickets (shared by kitchen games)
  CH.drawTicket = (g, x, y, lines, opts = {}) => {
    const w = opts.w || 64, h = 14 + lines.length * 8;
    gfx.rect(x + 1, y + 1, w, h, 'rgba(0,0,0,0.3)'); gfx.rect(x, y, w, h, '#fff8e8'); gfx.rect(x, y, w, 4, opts.color || '#c8352b');
    for (let i = 0; i < w; i += 4) gfx.rect(x + i, y + h - 1, 2, 1, '#e8dcc0');
    gfx.text(opts.title || '#' + (opts.num || 1), x + 3, y + 5, '#333', { font: 'small' });
    if (opts.timer !== undefined) { const p = CH.clamp(opts.timer, 0, 1); gfx.rect(x + w - 22, y + 6, 20, 3, '#ddd'); gfx.rect(x + w - 22, y + 6, Math.round(20 * p), 3, p < 0.3 ? '#c8352b' : '#4f9d3a'); }
    lines.forEach((l, i) => gfx.text(l, x + 3, y + 12 + i * 8, l.done ? '#3a9a5a' : '#222', { font: 'small' }));
    return h;
  };

  // food item painters (shared)
  const F = (CH.FOOD = {});
  F.patty = (g, x, y, cook = 1) => { const c = cook < 0.35 ? gfx.mix('#e07080', '#a05040', cook / 0.35) : cook < 1.3 ? gfx.mix('#a05040', '#5a3018', (cook - 0.35) / 0.95) : gfx.mix('#5a3018', '#1a1008', Math.min(1, (cook - 1.3) / 0.5)); gfx.ellipse(x, y, 11, 5, gfx.shade(c, -25)); gfx.ellipse(x, y - 1, 11, 4.5, c); for (let i = 0; i < 5; i++) gfx.px(x - 6 + i * 3, y - 2 + (i % 2), cook > 0.6 ? '#3a2010' : gfx.shade(c, -20)); };
  F.bunBottom = (g, x, y) => { gfx.ellipse(x, y, 12, 4, '#c8903a'); gfx.rect(x - 12, y - 4, 25, 4, '#e0a850'); gfx.ellipse(x, y - 4, 12, 2, '#e0a850'); };
  F.bunTop = (g, x, y) => { gfx.ellipse(x, y, 12, 6, '#d8963a'); gfx.ellipse(x, y - 1, 12, 5, '#e8a850'); gfx.ellipse(x - 2, y - 3, 6, 2, '#f0c078'); for (let i = 0; i < 5; i++) gfx.px(x - 7 + i * 3, y - 3 + (i % 2), '#fff8e0'); };
  F.cheese = (g, x, y) => { gfx.rect(x - 12, y - 2, 25, 3, '#f5c33b'); gfx.rect(x - 13, y - 1, 2, 4, '#f5c33b'); gfx.rect(x + 11, y - 1, 2, 4, '#f5c33b'); gfx.rect(x - 12, y - 2, 25, 1, '#ffe080'); };
  F.lettuce = (g, x, y) => { for (let i = -10; i <= 10; i += 4) gfx.ellipse(x + i, y - (Math.abs(i) % 3), 3, 2, i % 8 === 0 ? '#5fc05a' : '#8be07a'); };
  F.tomato = (g, x, y) => { gfx.ellipse(x - 5, y, 6, 2.5, '#d13c3c'); gfx.ellipse(x + 5, y, 6, 2.5, '#d13c3c'); gfx.px(x - 5, y - 1, '#f08080'); gfx.px(x + 5, y - 1, '#f08080'); };
  F.pickle = (g, x, y) => { gfx.ellipse(x - 5, y, 4, 2, '#5a8a2a'); gfx.ellipse(x + 5, y, 4, 2, '#5a8a2a'); gfx.px(x - 5, y, '#8ab84a'); gfx.px(x + 5, y, '#8ab84a'); };
  F.onion = (g, x, y) => { gfx.ellipseOutline(x - 4, y, 5, 2, '#e8d8f0'); gfx.ellipseOutline(x + 4, y, 5, 2, '#e8d8f0'); };
  F.bacon = (g, x, y) => { for (let i = 0; i < 2; i++) { const bx = x - 8 + i * 10; for (let k = 0; k < 8; k++) gfx.rect(bx + k, y - 1 + (k % 2), 1, 2, k % 3 ? '#a03a2a' : '#e8a080'); } };
  F.sauce = (g, x, y, c = '#d13c3c') => { gfx.ellipse(x, y, 9, 1.5, c); gfx.px(x - 10, y + 1, c); gfx.px(x + 10, y, c); };
  F.wrapper = (g, x, y, open = true) => { gfx.rect(x - 14, y - 6, 28, 12, '#f5c33b'); for (let i = 0; i < 7; i++) gfx.rect(x - 13 + i * 4, y - 5, 2, 10, '#e8a020'); gfx.text('D', x, y - 3, '#c8352b', { align: 'center' }); };
  F.wrapped = (g, x, y) => { gfx.ellipse(x, y, 13, 7, '#e8b030'); gfx.ellipse(x, y - 1, 12, 6, '#f5c33b'); gfx.text('D', x, y - 4, '#c8352b', { align: 'center' }); gfx.rect(x - 4, y + 3, 8, 2, '#c8352b'); };
  F.friesBox = (g, x, y, fill = 1, size = 'M') => { const w = size === 'L' ? 14 : size === 'S' ? 9 : 11; if (fill > 0) for (let i = 0; i < Math.round(fill * 7); i++) gfx.rect(x - w / 2 + 1 + i * (w / 7), y - 14 - (i % 3) * 2, 2, 12, i % 2 ? '#f5c33b' : '#e8a840'); gfx.rect(x - w / 2, y - 8, w, 10, '#c8352b'); gfx.rect(x - w / 2 - 1, y - 9, w + 2, 2, '#e04a3e'); gfx.text('D', x, y - 6, '#f5c33b', { align: 'center', font: 'small' }); };
  F.cup = (g, x, y, fill = 0, size = 'M', color = '#5a2a10', lid = false) => { const h = size === 'L' ? 20 : size === 'S' ? 13 : 16, w = size === 'L' ? 14 : size === 'S' ? 10 : 12; gfx.rect(x - w / 2, y - h, w, h, '#f4f4f8'); gfx.rect(x - w / 2 + 1, y - h + 1, w - 2, h - 2, '#fff'); if (fill > 0) gfx.rect(x - w / 2 + 1, y - 1 - Math.round((h - 2) * Math.min(1, fill)), w - 2, Math.round((h - 2) * Math.min(1, fill)), color); gfx.rect(x - w / 2 + 2, y - h + 4, w - 4, 3, '#c8352b'); if (lid) { gfx.rect(x - w / 2 - 1, y - h - 2, w + 2, 3, '#e8e8f0'); gfx.rect(x + 1, y - h - 10, 2, 9, '#c8352b'); } };
  F.bag = (g, x, y, open = true, items = 0) => { gfx.rect(x - 14, y - 22, 28, 22, '#e0c090'); gfx.rect(x - 14, y - 22, 28, 2, '#c8a060'); if (open) { gfx.rect(x - 15, y - 26, 30, 5, '#f0d0a0'); gfx.rect(x - 12, y - 24, 24, 2, '#8a6a3a'); } else { gfx.rect(x - 12, y - 26, 24, 4, '#c8a060'); gfx.rect(x - 10, y - 27, 20, 2, '#c8a060'); } gfx.text('D', x, y - 15, '#c8352b', { align: 'center' }); for (let i = 0; i < Math.min(3, items); i++) gfx.rect(x - 8 + i * 6, y - 20, 4, 3, '#f5c33b'); };
  F.tray = (g, x, y) => { gfx.rect(x - 22, y - 4, 44, 6, '#8a2a2a'); gfx.rect(x - 20, y - 5, 40, 2, '#a83a3a'); gfx.rect(x - 22, y + 2, 44, 1, '#5a1a1a'); };
  F.nugget = (g, x, y) => { gfx.ellipse(x, y, 4, 3, '#d8a040'); gfx.px(x - 1, y - 1, '#f0c060'); };
  F.pie = (g, x, y) => { gfx.rect(x - 8, y - 3, 16, 6, '#c8903a'); gfx.rect(x - 7, y - 2, 14, 4, '#e0a850'); gfx.px(x - 4, y, '#8a3020'); gfx.px(x + 3, y - 1, '#8a3020'); };
})(window.CH);
