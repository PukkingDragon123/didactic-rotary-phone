// ============================================================================
// World engine: side-view rooms with props, NPCs, player controller, camera
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, inp = CH.input, P = CH.PAL;
  const ANIMATED = new Set(['alarmClock', 'console', 'tv', 'fireplace', 'window', 'kitchenCounter', 'stove', 'pancakes', 'rockingChair', 'rotaryPhone', 'wallClock', 'lamp', 'vending', 'fluor', 'monitor', 'ivStand', 'hClock', 'plant', 'door', 'trashBin', 'hDoor']);

  class WorldScene extends CH.Scene {
    constructor(opts = {}) {
      super();
      this.width = opts.width || 960;
      this.floorY = opts.floorY || 222;
      this.props = []; this.npcs = []; this.exits = [];
      this.player = new CH.Chubby(opts.playerX || 60, this.floorY);
      this.player.speed = 78;
      this.cam = { x: opts.camX !== undefined ? opts.camX : Math.max(0, (opts.playerX || 60) - CH.W / 2), y: 0 };
      this.camFocus = null;
      this.locked = false;
      this.particles = new CH.Particles();
      this.bg = null; this.bgDirty = true;
      this.hoverProp = null;
      this.hud = true;
      this.timeScale = 0; // in-game hours per real second
      this.vy = 0; this.py = 0; // hop
      this.controlsHintT = 0;
      this.ambientT = 0;
    }
    // ---- building ---------------------------------------------------------------
    addProp(name, x, y, opts = {}) {
      const def = CH.PROPS[name];
      if (!def) { console.warn('no prop', name); return null; }
      const p = { name, def, x, y: y === undefined ? this.floorY : y, w: opts.w || def.w, h: opts.h || def.h, st: opts.st || {}, interact: opts.interact || null, hint: opts.hint || null, layer: opts.layer || 'back', anim: opts.anim !== undefined ? opts.anim : ANIMATED.has(name), range: opts.range, id: opts.id || name, hidden: false, once: opts.once, used: false, offsetX: opts.offsetX || 0, promptY: opts.promptY };
      for (const k in opts) if (!(k in p)) p[k] = opts[k];
      this.props.push(p);
      if (!p.anim && p.layer === 'back') this.bgDirty = true;
      return p;
    }
    addCustom(draw, x, y, w, h, opts = {}) {
      const p = { name: opts.id || 'custom', def: { draw, w, h }, x, y: y === undefined ? this.floorY : y, w, h, st: opts.st || {}, interact: opts.interact || null, hint: opts.hint || null, layer: opts.layer || 'back', anim: opts.anim !== undefined ? opts.anim : true, range: opts.range, id: opts.id || 'custom', hidden: false, offsetX: 0 };
      for (const k in opts) if (!(k in p)) p[k] = opts[k];
      this.props.push(p);
      if (!p.anim) this.bgDirty = true;
      return p;
    }
    prop(id) { return this.props.find((p) => p.id === id); }
    addNPC(npc) { this.npcs.push(npc); if (npc.y === 0) npc.y = this.floorY; return npc; }
    // ---- room drawing (override) ------------------------------------------------
    drawRoom(g) { gfx.rect(0, 0, this.width, CH.H, '#333'); }
    drawForeground(g) {}
    renderBg() {
      if (!this.bg || this.bg.width !== this.width) this.bg = gfx.makeCanvas(this.width, CH.H);
      const g = this.bg.getContext('2d');
      g.imageSmoothingEnabled = false;
      g.clearRect(0, 0, this.width, CH.H);
      gfx.pushTarget(g);
      this.drawRoom(g);
      for (const p of this.props) if (!p.anim && p.layer === 'back' && !p.hidden) p.def.draw(g, p.x, p.y, 0, p.st);
      gfx.popTarget();
      this.bgDirty = false;
    }
    // ---- cutscene helpers ---------------------------------------------------------
    walkTo(x, speedMul = 1) {
      const sig = new CH.Signal();
      this._walk = { x, sig, speedMul };
      return sig;
    }
    say(sp, text, opts) { return CH.ui.say(sp, text, opts); }
    choose(sp, text, options, opts) { return CH.ui.choose(sp, text, options, opts); }
    focusCam(x) { this.camFocus = x; }
    // ---- update -------------------------------------------------------------------
    update(dt) {
      const pl = this.player;
      this.ambientT += dt;
      if (this.timeScale) { CH.state.hour += dt * this.timeScale; if (CH.state.hour >= 24) CH.state.hour -= 24; }
      // movement
      let ax = 0;
      if (this._walk) {
        const d = this._walk.x - pl.x;
        if (Math.abs(d) < 3) { pl.x = this._walk.x; pl.vx = 0; this._walk.sig.resolve(); this._walk = null; }
        else ax = Math.sign(d) * this._walk.speedMul;
      } else if (!this.locked && !CH.ui.busy()) {
        ax = inp.axisX();
        if (inp.hit('jump') && this.py === 0 && this.allowHop !== false) { this.vy = -110; pl.hop(0.8); CH.audio.sfx('jump'); }
      }
      const target = ax * pl.speed * (this.locked || this._walk ? (this._walk ? this._walk.speedMul : 1) : 1);
      pl.vx = CH.approach(pl.vx, target, dt * (Math.abs(target) > Math.abs(pl.vx) ? 520 : 700));
      pl.x += pl.vx * dt;
      const minX = this.minX !== undefined ? this.minX : 14, maxX = this.maxX !== undefined ? this.maxX : this.width - 14;
      if (pl.x < minX) { pl.x = minX; if (pl.vx < -30) pl.jiggle.kick(60); pl.vx = 0; }
      if (pl.x > maxX) { pl.x = maxX; if (pl.vx > 30) pl.jiggle.kick(-60); pl.vx = 0; }
      // hop physics
      if (this.py < 0 || this.vy < 0) {
        this.vy += 520 * dt; this.py += this.vy * dt;
        if (this.py >= 0) { this.py = 0; this.vy = 0; pl.land(0.6); this.particles.burst(pl.x, this.floorY, 5, { color: ['#c9b48a', '#8b7355'], speed: 30, grav: 100, life: 0.4, angle: -Math.PI / 2, spread: 2 }); }
      }
      pl.y = this.floorY + this.py;
      pl.grounded = this.py === 0;
      pl.update(dt, this.py === 0 ? this.particles : null);
      // npcs
      for (const n of this.npcs) n.update(dt);
      this.particles.update(dt);
      // camera
      const focus = this.camFocus !== null ? this.camFocus : pl.x + pl.vx * 0.25;
      const tx = CH.clamp(focus - CH.W / 2, 0, Math.max(0, this.width - CH.W));
      this.cam.x = CH.lerp(this.cam.x, tx, Math.min(1, dt * 6));
      if (Math.abs(this.cam.x - tx) < 0.3) this.cam.x = tx;
      // interactions
      this.hoverProp = null;
      if (!this.locked && !CH.ui.busy() && !this._walk) {
        let best = null, bd = 1e9;
        for (const p of this.props) {
          if (!p.interact || p.hidden || (p.once && p.used)) continue;
          const cx = p.x + p.w / 2 + p.offsetX;
          const range = p.range || p.w / 2 + 16;
          const d = Math.abs(pl.x - cx) - (p.priority || 0) * 1000;
          if (Math.abs(pl.x - cx) < range && d < bd) { bd = d; best = p; }
        }
        this.hoverProp = best;
        if (best && inp.hit('interact')) {
          inp.eat();
          best.used = true;
          const r = best.interact(best, this);
          if (r && typeof r.next === 'function') this.run(r);
        }
      }
    }
    // ---- draw ----------------------------------------------------------------------
    draw(g) {
      if (this.bgDirty || !this.bg) this.renderBg();
      const cx = Math.round(this.cam.x);
      g.drawImage(this.bg, -cx, 0);
      g.save(); g.translate(-cx, 0);
      const t = this.t;
      for (const p of this.props) if (p.anim && p.layer === 'back' && !p.hidden) p.def.draw(g, p.x, p.y, t, p.st);
      // actors sorted by y
      const actors = [...this.npcs.filter((n) => !n.hidden).map((n) => ({ y: n.y + (n.depth || 0), d: () => n.draw(g) }))];
      if (!this.player.hidden) actors.push({ y: this.player.y + this.py * 0 + 0.5, d: () => this.player.draw(g) });
      actors.sort((a, b) => a.y - b.y);
      for (const a of actors) a.d();
      this.particles.draw(g);
      for (const p of this.props) if (p.layer === 'front' && !p.hidden) p.def.draw(g, p.x, p.y, t, p.st);
      this.drawForeground(g);
      // interaction prompt
      if (this.hoverProp) {
        const p = this.hoverProp;
        const px = Math.round(p.x + p.w / 2 + p.offsetX), py = p.promptY !== undefined ? p.promptY : p.y - p.h - 6;
        const bob = Math.round(Math.sin(this.t * 6) * 1.5);
        gfx.rrect(px - 5, py - 10 + bob, 11, 10, 2, '#fff'); gfx.rect(px - 1, py + bob, 3, 1, '#fff');
        gfx.text('E', px + 1, py - 8 + bob, '#1a1420', { align: 'center' });
        if (p.hint) { const w = gfx.textWidth(p.hint, 'small') + 6; gfx.rrect(px - w / 2, py - 20 + bob, w, 8, 2, 'rgba(0,0,0,0.75)'); gfx.text(p.hint, px, py - 18 + bob, '#fff', { align: 'center', font: 'small' }); }
      }
      g.restore();
      this.drawHud(g);
    }
    drawHud(g) {
      if (!this.hud) return;
      // time
      const s = CH.timeStr();
      gfx.rect(CH.W / 2 - 24, 4, 48, 11, 'rgba(0,0,0,0.6)');
      gfx.text(s, CH.W / 2, 7, '#e8e0c8', { align: 'center', font: 'small' });
    }
  }
  CH.WorldScene = WorldScene;

  // ---- common room painters ----------------------------------------------------------
  // Background surfaces are never outlined - they read through material texture,
  // plank seams, grout, scuffs and ambient occlusion instead of an ink line.
  const band = (g, x, y, w, h, c, a) => { g.save(); g.globalAlpha = a; gfx.rect(x, y, w, h, c); g.restore(); };
  const speck = (g, x, y, w, h, c, a, seed, n) => {
    const R = new CH.Rng(seed >>> 0 || 1);
    g.save(); g.globalAlpha = a;
    for (let i = 0; i < n; i++) gfx.px(x + R.int(0, w - 1), y + R.int(0, h - 1), c);
    g.restore();
  };

  // cozy wooden cabin interior
  CH.paintCabin = (g, width, floorY, night = false) => {
    const wallTop = 34;
    const base = night ? '#5a3a20' : P.wood2;
    const dark = night ? '#3a2412' : P.wood0;
    const light = night ? '#6a4a2a' : P.wood3;
    const deep = gfx.shade(dark, -14);
    const chink = night ? '#4a3a2c' : '#c9b48a';

    // ---- ceiling: boards running away from us, with heavy beams --------------
    gfx.rect(0, 0, width, wallTop, night ? '#241608' : '#432911');
    for (let y = 0; y < wallTop; y += 6) {
      gfx.hline(0, y, width, night ? '#1c1106' : '#35200c');
      gfx.hline(0, y + 1, width, night ? '#2e1c0b' : '#4d2f14');
    }
    speck(g, 0, 0, width, wallTop, night ? '#2e1c0b' : '#5a3a18', 0.5, 17, Math.floor(width / 6));
    for (let x = -10; x < width; x += 90) {
      gfx.rect(x, 0, 10, wallTop, night ? '#170e05' : '#2d1b0a');
      gfx.vline(x, 0, wallTop, night ? '#2a1a0c' : '#4a2e14');
      gfx.vline(x + 9, 0, wallTop, '#120b04');
      for (let y = 3; y < wallTop; y += 9) gfx.hline(x + 2, y, 6, night ? '#211406' : '#3a230d');
    }
    band(g, 0, wallTop - 6, width, 6, '#120b04', 0.3);
    gfx.hline(0, wallTop - 2, width, deep);
    gfx.hline(0, wallTop - 1, width, light);

    // ---- walls: stacked logs ---------------------------------------------------
    gfx.rect(0, wallTop, width, floorY - wallTop, base);
    const logH = 13;
    for (let y = wallTop; y < floorY - 6; y += logH) {
      const h = Math.min(logH, floorY - 6 - y);
      const R = new CH.Rng((y * 131 + 7) >>> 0);
      // log body: lit crown, mid belly, shadowed underside
      gfx.hline(0, y, width, chink);                        // chinking above the log
      gfx.rect(0, y + 1, width, h - 1, base);
      gfx.hline(0, y + 1, width, light);
      gfx.hline(0, y + 2, width, gfx.mix(base, light, 0.45));
      gfx.hline(0, y + h - 3, width, gfx.shade(base, -16));
      gfx.hline(0, y + h - 2, width, dark);
      gfx.hline(0, y + h - 1, width, deep);
      // long grain
      for (let i = 0; i < width / 16; i++) {
        const gx = R.int(0, width - 2), gy = y + R.int(2, Math.max(2, h - 3));
        gfx.hline(gx, gy, Math.min(R.int(6, 26), width - gx), R.chance(0.45) ? light : gfx.shade(base, -10));
      }
      // knots
      for (let i = 0; i < width / 110; i++) {
        const kx = R.int(6, width - 6), ky = y + R.int(3, Math.max(3, h - 4));
        gfx.ellipse(kx, ky, 3, 1.8, deep);
        gfx.ellipse(kx, ky, 1.8, 1, dark);
        gfx.px(kx, ky - 1, light);
        gfx.px(kx - 2, ky, gfx.shade(base, -8));
      }
      // checks / splits in the timber
      for (let i = 0; i < width / 200; i++) {
        const cx = R.int(4, width - 12);
        gfx.hline(cx, y + R.int(3, Math.max(3, h - 4)), R.int(10, 30), deep);
      }
    }
    // vertical corner posts, lining up with every second ceiling beam
    for (let x = -8; x < width; x += 180) {
      const ph = floorY - wallTop - 6;
      gfx.rect(x, wallTop, 8, ph, gfx.mix(base, light, 0.18));
      gfx.vline(x, wallTop, ph, light);
      gfx.vline(x + 1, wallTop, ph, gfx.mix(base, light, 0.55));
      gfx.vline(x + 6, wallTop, ph, gfx.shade(base, -14));
      gfx.vline(x + 7, wallTop, ph, dark);
      const R = new CH.Rng((x * 17 + 3) >>> 0 || 1);
      for (let i = 0; i < 12; i++) { const gy = wallTop + R.int(0, ph - 12); gfx.vline(x + R.int(2, 5), gy, R.int(6, 20), R.chance(0.5) ? light : gfx.shade(base, -12)); }
      for (let i = 0; i < 3; i++) { const ky = wallTop + R.int(10, ph - 14); gfx.ellipse(x + R.int(2, 5), ky, 1.4, 2.2, deep); }
    }
    // soft occlusion under the ceiling and above the floor
    band(g, 0, wallTop, width, 10, '#1a0f06', 0.22);
    band(g, 0, wallTop, width, 4, '#1a0f06', 0.16);
    band(g, 0, floorY - 22, width, 16, '#1a0f06', 0.13);

    // ---- skirting board --------------------------------------------------------
    gfx.rect(0, floorY - 7, width, 7, gfx.shade(base, -8));
    gfx.hline(0, floorY - 7, width, light);
    gfx.hline(0, floorY - 6, width, gfx.mix(base, light, 0.4));
    gfx.hline(0, floorY - 3, width, dark);
    gfx.hline(0, floorY - 2, width, deep);
    gfx.hline(0, floorY - 1, width, '#160f08');
    {
      const R = new CH.Rng(909);
      for (let i = 0; i < width / 40; i++) { const sx = R.int(0, width - 8); gfx.hline(sx, floorY - 5, R.int(3, 9), R.chance(0.5) ? light : dark); }
      for (let x = -8; x < width; x += 180) gfx.vline(x + 7, floorY - 7, 7, deep);
    }

    // ---- floor: planks running left-right, darker near the wall ----------------
    CH.drawPlanks(g, 0, floorY, width, CH.H - floorY, 10,
      night ? '#4a2c16' : P.floor2, night ? '#2b170a' : P.floor1, night ? '#5e3c22' : P.floor3, 11);
    // perspective seams
    for (let x = -24; x < width; x += 46) {
      gfx.vline(x + 20, floorY, CH.H - floorY, night ? '#2b170a' : gfx.shade(P.floor1, -10));
      gfx.vline(x + 21, floorY, CH.H - floorY, night ? '#5e3c22' : P.floor3);
    }
    // contact shadow where the floor meets the wall + a worn traffic path
    band(g, 0, floorY, width, 6, '#160d06', 0.34);
    band(g, 0, floorY + 5, width, 5, '#160d06', 0.16);
    gfx.hline(0, floorY, width, '#16100a');
    band(g, 0, floorY + 16, width, 14, '#e8c890', 0.06);
    speck(g, 0, floorY + 2, width, CH.H - floorY - 2, night ? '#2b170a' : '#5a3418', 0.35, 77, Math.floor(width / 3));
    speck(g, 0, floorY + 4, width, CH.H - floorY - 4, night ? '#6a482a' : '#a9744a', 0.3, 78, Math.floor(width / 5));
  };

  // modern hospital corridor
  CH.paintHospital = (g, width, floorY) => {
    // ---- ceiling: acoustic tiles with recessed light troughs -------------------
    gfx.rect(0, 0, width, 30, '#c5cad3');
    for (let x = 0; x < width; x += 60) {
      gfx.rect(x, 0, 30, 30, '#d3d8e1');
      gfx.rect(x + 30, 0, 30, 30, '#c9ced7');
    }
    for (let x = 0; x < width; x += 30) { gfx.vline(x, 0, 30, '#a9aeb8'); gfx.vline(x + 1, 0, 30, '#dfe4ec'); }
    for (let y = 0; y < 30; y += 15) { gfx.hline(0, y, width, '#a9aeb8'); gfx.hline(0, y + 1, width, '#dfe4ec'); }
    speck(g, 0, 0, width, 30, '#b0b6c0', 0.4, 31, Math.floor(width / 3));
    band(g, 0, 24, width, 6, '#3a4250', 0.14);
    gfx.hline(0, 30, width, '#8f959f');
    gfx.hline(0, 31, width, '#f2f6f8');

    // ---- wall ------------------------------------------------------------------
    gfx.rect(0, 32, width, floorY - 32, '#e6ecec');
    // very soft vertical shading so the wall is not one flat slab
    band(g, 0, 32, width, 26, '#ffffff', 0.35);
    band(g, 0, floorY - 46, width, 46, '#5f7078', 0.07);
    speck(g, 0, 32, width, floorY - 32, '#d4dcdc', 0.5, 41, Math.floor(width / 2));
    // wall-panel joints every 60
    for (let x = 0; x < width; x += 60) { gfx.vline(x, 32, floorY - 32, '#d6dede'); gfx.vline(x + 1, 32, floorY - 32, '#f2f8f8'); }
    // accent stripe
    gfx.rect(0, floorY - 62, width, 4, '#3fa79a');
    gfx.hline(0, floorY - 62, width, '#66c8ba');
    gfx.hline(0, floorY - 59, width, '#22705f');
    gfx.rect(0, floorY - 56, width, 2, '#3fa79a');
    gfx.hline(0, floorY - 56, width, '#66c8ba');
    // lower wainscot panel
    gfx.rect(0, floorY - 24, width, 16, '#cdd6d6');
    gfx.hline(0, floorY - 24, width, '#eaf1f1');
    for (let x = 0; x < width; x += 30) { gfx.vline(x, floorY - 24, 16, '#b8c2c2'); gfx.vline(x + 1, floorY - 24, 16, '#e2ebeb'); }
    // bumper rail
    gfx.rect(0, floorY - 10, width, 6, '#93aab0');
    gfx.hline(0, floorY - 10, width, '#c0d4d8');
    gfx.hline(0, floorY - 5, width, '#5d7278');
    gfx.rect(0, floorY - 4, width, 4, '#b2c4c8');
    gfx.hline(0, floorY - 1, width, '#67797e');
    // scuffs from trolleys, and marks where chairs rub
    {
      const R = new CH.Rng(1207);
      g.save(); g.globalAlpha = 0.3;
      for (let i = 0; i < width / 18; i++) gfx.hline(R.int(0, width - 10), floorY - 9 + R.int(0, 4), R.int(4, 16), '#5d7278');
      g.globalAlpha = 0.16;
      for (let i = 0; i < width / 60; i++) gfx.hline(R.int(0, width - 14), floorY - 30 + R.int(0, 6), R.int(6, 18), '#8fa0a6');
      g.restore();
    }
    band(g, 0, 32, width, 5, '#2a3a44', 0.1);

    // ---- floor: speckled vinyl tiles with a fluorescent sheen ------------------
    gfx.rect(0, floorY, width, CH.H - floorY, '#b7c5c7');
    for (let y = floorY; y < CH.H; y += 13) {
      const row = Math.floor((y - floorY) / 13);
      for (let x = -((row & 1) * 13); x < width; x += 26) {
        gfx.rect(x, y, 13, 13, '#c3cfd1');
        gfx.rect(x + 13, y, 13, 13, '#bac8ca');
      }
    }
    speck(g, 0, floorY, width, CH.H - floorY, '#8fa0a4', 0.5, 61, Math.floor((width * (CH.H - floorY)) / 34));
    speck(g, 0, floorY, width, CH.H - floorY, '#e4eef0', 0.5, 62, Math.floor((width * (CH.H - floorY)) / 42));
    for (let y = floorY; y < CH.H; y += 13) { gfx.hline(0, y, width, '#9fadaf'); gfx.hline(0, y + 1, width, '#cddadc'); }
    for (let x = 0; x < width; x += 13) { gfx.vline(x, floorY, CH.H - floorY, '#9fadaf'); gfx.vline(x + 1, floorY, CH.H - floorY, '#cddadc'); }
    // light panels reflected in the polish
    g.save();
    g.globalAlpha = 0.2;
    for (let x = 14; x < width; x += 80) gfx.rect(x, floorY + 3, 34, 7, '#fff');
    g.globalAlpha = 0.1;
    for (let x = 10; x < width; x += 80) gfx.rect(x, floorY + 12, 44, 12, '#fff');
    g.restore();
    // a mop streak and a couple of scuffs
    {
      const R = new CH.Rng(808);
      g.save(); g.globalAlpha = 0.14;
      for (let i = 0; i < width / 26; i++) gfx.hline(R.int(0, width - 20), floorY + R.int(4, CH.H - floorY - 2), R.int(10, 26), '#7d8e92');
      g.restore();
    }
    // base shadow where wall meets floor
    band(g, 0, floorY, width, 5, '#2a3a44', 0.3);
    band(g, 0, floorY + 4, width, 5, '#2a3a44', 0.13);
    gfx.hline(0, floorY, width, '#77888c');
  };
})(window.CH);
