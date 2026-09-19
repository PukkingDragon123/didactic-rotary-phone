// ============================================================================
// CHUBBY THE PORCUPINE - core utilities, math, coroutines, scene manager
// ============================================================================
window.CH = window.CH || {};
(function (CH) {
  CH.W = 480;
  CH.H = 270;
  CH.DEBUG = false;

  // ---- math -----------------------------------------------------------------
  CH.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  CH.lerp = (a, b, t) => a + (b - a) * t;
  CH.remap = (v, a0, a1, b0, b1) => b0 + ((v - a0) / (a1 - a0)) * (b1 - b0);
  CH.rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
  CH.irand = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  CH.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  CH.chance = (p) => Math.random() < p;
  CH.dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  CH.sign = (v) => (v < 0 ? -1 : v > 0 ? 1 : 0);
  CH.approach = (v, t, s) => (v < t ? Math.min(v + s, t) : Math.max(v - s, t));
  CH.wrap = (v, n) => ((v % n) + n) % n;
  CH.fmtMoney = (n) => {
    const neg = n < 0;
    n = Math.abs(n);
    const s = Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const c = Math.round((n - Math.floor(n)) * 100);
    return (neg ? '-' : '') + '$' + s + (c ? '.' + (c < 10 ? '0' : '') + c : '');
  };
  CH.pad2 = (n) => (n < 10 ? '0' : '') + n;
  CH.shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  CH.rectsOverlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  CH.pointIn = (px, py, r) => px >= r.x && py >= r.y && px < r.x + r.w && py < r.y + r.h;

  CH.ease = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => t * (2 - t),
    inOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    inCubic: (t) => t * t * t,
    outCubic: (t) => --t * t * t + 1,
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
    outBack: (t) => {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    },
    outElastic: (t) => {
      const c4 = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    outBounce: (t) => {
      const n1 = 7.5625, d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
    inExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
    outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  };

  // seeded RNG (mulberry32)
  CH.Rng = class {
    constructor(seed) { this.s = seed >>> 0 || 1; }
    next() {
      let t = (this.s += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    range(a, b) { return a + this.next() * (b - a); }
    int(a, b) { return Math.floor(a + this.next() * (b - a + 1)); }
    pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
    chance(p) { return this.next() < p; }
  };

  // ---- spring (for jiggle) ---------------------------------------------------
  CH.Spring = class {
    constructor(stiff = 200, damp = 12, value = 0) {
      this.k = stiff; this.d = damp; this.v = 0; this.x = value; this.target = value;
    }
    update(dt) {
      const a = -this.k * (this.x - this.target) - this.d * this.v;
      this.v += a * dt;
      this.x += this.v * dt;
      return this.x;
    }
    kick(v) { this.v += v; }
    set(v) { this.x = v; this.target = v; this.v = 0; }
  };

  // ---- coroutine --------------------------------------------------------------
  // yield <number>       : wait seconds
  // yield <function>     : wait until fn() returns truthy
  // yield <obj with done>: wait until obj.done; obj.value is passed back
  CH.Co = class {
    constructor(gen) {
      this.gen = gen; this.wait = 0; this.cond = null; this.current = null;
      this.done = false; this.lastValue = undefined;
    }
    update(dt) {
      if (this.done) return;
      let guard = 0;
      while (!this.done && guard++ < 200) {
        if (this.wait > 0) { this.wait -= dt; dt = 0; if (this.wait > 0) return; }
        if (this.cond) { if (!this.cond()) return; this.cond = null; }
        if (this.current) {
          if (!this.current.done) return;
          this.lastValue = this.current.value; this.current = null;
        }
        let r;
        try { r = this.gen.next(this.lastValue); }
        catch (e) { console.error('Coroutine error', e); this.done = true; return; }
        this.lastValue = undefined;
        if (r.done) { this.done = true; return; }
        const v = r.value;
        if (typeof v === 'number') { this.wait = v; continue; }
        if (typeof v === 'function') { this.cond = v; continue; }
        if (v && typeof v === 'object') { this.current = v; continue; }
      }
    }
    cancel() { this.done = true; }
  };
  // a manually-completed yieldable
  CH.Signal = class { constructor() { this.done = false; this.value = undefined; } resolve(v) { this.value = v; this.done = true; } };
  // run several coroutines in parallel; done when all are done
  CH.all = (...gens) => {
    const cos = gens.map((g) => new CH.Co(g));
    return { get done() { return cos.every((c) => c.done); }, update(dt) { cos.forEach((c) => c.update(dt)); }, value: undefined, _cos: cos };
  };

  // ---- timers -----------------------------------------------------------------
  CH.Timer = class {
    constructor(dur, loop = false) { this.dur = dur; this.t = 0; this.loop = loop; this.fired = false; }
    update(dt) {
      this.t += dt;
      if (this.t >= this.dur) {
        if (this.loop) { this.t -= this.dur; return true; }
        if (!this.fired) { this.fired = true; return true; }
      }
      return false;
    }
    get p() { return CH.clamp(this.t / this.dur, 0, 1); }
    reset() { this.t = 0; this.fired = false; }
  };

  // ---- scene base -------------------------------------------------------------
  CH.Scene = class {
    constructor() { this.cos = []; this.t = 0; this.name = 'scene'; this.overlay = false; }
    enter() {}
    exit() {}
    update(dt) {}
    draw(g) {}
    run(gen) { const co = new CH.Co(gen); this.cos.push(co); return co; }
    updateCos(dt) {
      for (const c of this.cos) c.update(dt);
      if (this.cos.length) this.cos = this.cos.filter((c) => !c.done);
    }
    // parallel helper: all(...) yieldable needs updating; scene drives it
    par(...gens) { const a = CH.all(...gens); a._cos.forEach((c) => this.cos.push(c)); return a; }
  };

  // ---- game / scene manager ----------------------------------------------------
  CH.game = {
    stack: [],
    t: 0,
    frame: 0,
    slow: 1,
    hitstop: 0,
    get scene() { return this.stack[this.stack.length - 1]; },
    set(scene) {
      while (this.stack.length) this.stack.pop().exit();
      this.stack.push(scene); scene.enter();
    },
    push(scene) { const cur = this.scene; if (cur && cur.pause) cur.pause(); this.stack.push(scene); scene.enter(); },
    pop() {
      const s = this.stack.pop(); if (s) s.exit();
      const cur = this.scene; if (cur && cur.resume) cur.resume();
      return s;
    },
    replace(scene) { const s = this.stack.pop(); if (s) s.exit(); this.stack.push(scene); scene.enter(); },
    update(dt) {
      if (this.hitstop > 0) { this.hitstop -= dt; return; }
      dt *= this.slow;
      this.t += dt; this.frame++;
      // update top scene; overlay scenes let the one beneath keep drawing but not updating
      const s = this.scene;
      if (s) { s.t += dt; s.update(dt); s.updateCos(dt); }
      CH.fx.update(dt);
      CH.ui.update(dt);
    },
    draw(g) {
      // draw from the lowest non-overlay scene up
      let i = this.stack.length - 1;
      while (i > 0 && this.stack[i].overlay) i--;
      for (; i < this.stack.length; i++) this.stack[i].draw(g);
      CH.ui.draw(g);
      CH.fx.draw(g);
    },
  };

  // ---- screen shake / camera helpers ----------------------------------------
  CH.shake = { x: 0, y: 0, amt: 0, t: 0 };
  CH.doShake = (amt, dur = 0.3) => { CH.shake.amt = Math.max(CH.shake.amt, amt); CH.shake.t = Math.max(CH.shake.t, dur); };
  CH.hitstop = (d) => { CH.game.hitstop = Math.max(CH.game.hitstop, d); };

  // ---- text helpers ---------------------------------------------------------
  CH.wrapText = (str, maxChars) => {
    const out = [];
    for (const para of String(str).split('\n')) {
      const words = para.split(' ');
      let line = '';
      for (const w of words) {
        if ((line + (line ? ' ' : '') + w).length > maxChars && line) { out.push(line); line = w; }
        else line = line ? line + ' ' + w : w;
      }
      out.push(line);
    }
    return out;
  };
})(window.CH);
