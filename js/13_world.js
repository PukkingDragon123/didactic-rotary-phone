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
          const d = Math.abs(pl.x - cx);
          if (d < range && d < bd) { bd = d; best = p; }
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
  // cozy wooden cabin interior
  CH.paintCabin = (g, width, floorY, night = false) => {
    const wallTop = 34;
    // ceiling
    gfx.rect(0, 0, width, wallTop, night ? '#2a1a10' : '#4a2e18');
    for (let x = 0; x < width; x += 90) gfx.rect(x, 0, 8, wallTop, night ? '#1d1209' : '#3a2210'); // beams
    gfx.hline(0, wallTop - 2, width, night ? '#1d1209' : '#3a2210'); gfx.hline(0, wallTop - 1, width, night ? '#3a2a18' : '#5e3a1b');
    // walls (horizontal logs)
    const base = night ? '#5a3a20' : P.wood2, dark = night ? '#3a2412' : P.wood0, light = night ? '#6a4a2a' : P.wood3;
    gfx.rect(0, wallTop, width, floorY - wallTop, base);
    for (let y = wallTop; y < floorY; y += 12) {
      gfx.hline(0, y, width, dark); gfx.hline(0, y + 1, width, light); gfx.hline(0, y + 10, width, gfx.shade(base, -12));
      // log ends / knots
      const rng = new CH.Rng(y * 31);
      for (let i = 0; i < width / 70; i++) { const kx = rng.int(0, width); gfx.ellipse(kx, y + 6, 2, 1.2, dark); gfx.px(kx, y + 6, light); }
      for (let i = 0; i < width / 20; i++) { const gx = rng.int(0, width); gfx.hline(gx, y + rng.int(3, 8), rng.int(6, 20), rng.chance(0.5) ? light : gfx.shade(base, -8)); }
    }
    // baseboard
    gfx.rect(0, floorY - 4, width, 4, dark); gfx.hline(0, floorY - 4, width, light);
    // floor planks (perspective: darker toward bottom)
    CH.drawPlanks(g, 0, floorY, width, CH.H - floorY, 8, night ? '#4a2c16' : P.floor2, night ? '#2e1a0c' : P.floor1, night ? '#5a3a20' : P.floor3, 11);
    gfx.rect(0, floorY, width, 1, gfx.shade(P.floor1, -20));
    // vertical plank seams in floor for perspective
    for (let x = 0; x < width; x += 48) gfx.vline(x + 20, floorY, CH.H - floorY, night ? '#2e1a0c' : P.floor1);
  };

  // modern hospital corridor
  CH.paintHospital = (g, width, floorY) => {
    gfx.rect(0, 0, width, 30, '#c8ccd4'); // ceiling
    for (let x = 0; x < width; x += 60) gfx.rect(x, 0, 30, 30, '#d4d8e0'); // ceiling tiles
    for (let x = 0; x < width; x += 30) gfx.vline(x, 0, 30, '#b0b4bc');
    gfx.hline(0, 30, width, '#9aa0aa');
    // wall
    gfx.rect(0, 31, width, floorY - 31, '#e6ecec');
    gfx.rect(0, floorY - 60, width, 3, '#3fa79a'); // colored stripe
    gfx.rect(0, floorY - 56, width, 1, '#3fa79a');
    gfx.rect(0, floorY - 22, width, 14, '#d0d8d8'); // lower wall panel
    gfx.rect(0, floorY - 8, width, 8, '#9db4b8'); // bumper rail
    gfx.rect(0, floorY - 4, width, 4, '#b8c8cc');
    // floor tiles (linoleum with sheen)
    gfx.rect(0, floorY, width, CH.H - floorY, '#b9c7c9');
    for (let y = floorY; y < CH.H; y += 12) for (let x = -((y / 12) & 1) * 12; x < width; x += 24) { gfx.rect(x, y, 12, 12, '#c4d0d2'); }
    for (let y = floorY; y < CH.H; y += 12) gfx.hline(0, y, width, '#a6b4b6');
    for (let x = 0; x < width; x += 12) gfx.vline(x, floorY, CH.H - floorY, '#a6b4b6');
    // light reflections on floor
    g.globalAlpha = 0.18; for (let x = 20; x < width; x += 120) gfx.rect(x, floorY + 2, 40, 6, '#fff'); g.globalAlpha = 1;
    gfx.hline(0, floorY, width, '#8a9a9c');
  };
})(window.CH);
