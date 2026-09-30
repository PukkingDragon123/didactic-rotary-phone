// ============================================================================
// Dancing. One beat clock, a handful of cartoon moves, and a pose function
// that turns "time + who you are" into bounce, lean, squash, arms and face.
// Chubby dances while you hold DOWN; anyone standing near him catches it.
// ============================================================================
(function (CH) {
  const inp = CH.input;
  const BPM = 124;
  const CRIT_ARMS = [['up', 'idle', 'up', 'wave'], ['hips', 'up', 'hips', 'cheer'], ['wave', 'point', 'wave', 'up'], ['cheer', 'idle', 'cheer', 'hips']];
  const CHUB_ARMS = [['both_up', 'cheer', 'both_up', 'belly'], ['cheer', 'idle', 'cheer', 'both_up']];
  const FACES = ['happy', 'grin', 'proud', 'happy', 'love', 'grin'];

  // t in seconds, seed picks a personal style so a crowd is never in unison
  function pose(t, seed = 0, who = 'critter') {
    const style = Math.abs(Math.floor(seed * 7.13)) % 4;
    const beats = t * (BPM / 60) + (seed % 1) * 0.37;
    const ph = beats * Math.PI;               // one half-cycle per beat
    const bi = Math.floor(beats);
    const bounce = Math.abs(Math.sin(ph));
    const d = { dy: 0, rot: 0, sx: 1, sy: 1, arm: 'idle', flip: false, walk: 0, moving: 0, face: FACES[(bi + style) % FACES.length] };
    if (style === 0) {                        // the bounce
      d.dy = bounce * 5; d.sy = 1 - (1 - bounce) * 0.12; d.sx = 1 + (1 - bounce) * 0.09; d.rot = Math.sin(ph * 0.5) * 0.06;
    } else if (style === 1) {                 // the sway, side to side, turning on the fourth beat
      d.dy = bounce * 2.5; d.rot = Math.sin(ph * 0.5) * 0.18; d.flip = Math.floor(beats / 4) % 2 === 1; d.walk = beats * 2; d.moving = 0.5;
    } else if (style === 2) {                 // the hop, big squash on landing
      const hop = Math.max(0, Math.sin(ph));
      d.dy = hop * hop * 9; d.sy = hop < 0.2 ? 0.86 : 1.06; d.sx = hop < 0.2 ? 1.12 : 0.96; d.flip = bi % 4 >= 2;
    } else {                                  // the twist, feet going, hips going
      d.dy = bounce * 3; d.rot = Math.sin(ph) * 0.1; d.walk = beats * 3; d.moving = 1; d.flip = bi % 2 === 1; d.sx = 1 + Math.sin(ph) * 0.05;
    }
    const arms = who === 'chubby' ? CHUB_ARMS[style % 2] : CRIT_ARMS[style];
    d.arm = arms[bi % arms.length];
    return d;
  }
  CH.dance = { pose, BPM };

  // draw anything standing at (x, y) as if it were dancing
  CH.drawDancing = (g, x, y, t, seed, who, paint) => {
    const d = pose(t, seed, who);
    g.save();
    g.translate(Math.round(x), Math.round(y));
    g.rotate(d.rot);
    paint(0, -Math.round(d.dy), d);
    g.restore();
    return d;
  };

  // ---- NPCs ------------------------------------------------------------------
  const NP = CH.NPC.prototype;
  const npcUpdate = NP.update;
  NP.update = function (dt) {
    // a dancer stays put, but keeps wherever it was going for afterwards
    if (this.dancing) { this.danceT = (this.danceT || 0) + dt; this.vx = 0; this.moving = 0; return; }
    npcUpdate.call(this, dt);
  };
  const npcDraw = NP.draw;
  NP.draw = function (g, camX = 0, camY = 0, extra) {
    if (!this.dancing || this.hidden || this.pose === 'sit' || this.pose === 'lying' || this.pose === 'inbed') return npcDraw.call(this, g, camX, camY, extra);
    const seed = this.danceSeed || (this.danceSeed = Math.random() * 10);
    CH.drawDancing(g, this.x - camX, this.y - camY, this.danceT || 0, seed, 'critter', (x, y, d) => {
      const p = this.params(extra);
      CH.drawCritter(g, x, y, Object.assign(p, { arm: d.arm, face: d.face, flip: d.flip !== p.flip ? !p.flip : p.flip, sx: (p.sx || 1) * d.sx, sy: (p.sy || 1) * d.sy, walk: d.walk || p.walk, moving: d.moving || p.moving }));
    });
  };

  // ---- Chubby ----------------------------------------------------------------
  const CP = CH.Chubby.prototype;
  const chubDraw = CP.draw;
  CP.draw = function (g, camX = 0, camY = 0, extra) {
    if (!this.dancing || this.hidden || this.sitting) return chubDraw.call(this, g, camX, camY, extra);
    CH.drawDancing(g, this.x - camX, this.y - camY, this.danceT || 0, 3.1, 'chubby', (x, y, d) => {
      const p = this.params(extra);
      CH.drawChubby(g, x, y, Object.assign(p, { arm: d.arm, face: d.face, flip: d.flip, sx: (p.sx || 1) * d.sx, sy: (p.sy || 1) * d.sy, walk: d.walk, moving: d.moving }));
    });
  };

  // ---- in the world: hold DOWN to dance, and the room joins in ---------------
  const WS = CH.WorldScene.prototype;
  const wsUpdate = WS.update;
  WS.update = function (dt) {
    wsUpdate.call(this, dt);
    const pl = this.player;
    if (!pl) return;
    const can = !this.locked && !CH.ui.busy() && !this._walk && this.allowDance !== false && Math.abs(pl.vx) < 8;
    const want = can && inp.down('down');
    if (want && !pl.dancing) { pl.dancing = true; pl.danceT = 0; this.danceHeld = 0; }
    if (!want && pl.dancing) pl.dancing = false;
    if (pl.dancing) {
      pl.danceT += dt; this.danceHeld = (this.danceHeld || 0) + dt;
      // a beat of music, and the occasional note in the air
      if (Math.floor(pl.danceT * CH.dance.BPM / 60) !== Math.floor((pl.danceT - dt) * CH.dance.BPM / 60)) {
        if (CH.audio && CH.audio.sfx) CH.audio.sfx(Math.floor(pl.danceT * 2) % 2 ? 'blip' : 'blip2');
        this.particles.add({ x: pl.x + CH.rand(-12, 12), y: pl.y - 50, vx: CH.rand(-8, 8), vy: -22, life: 1.1, color: CH.pick(['#ffd84a', '#ff9ad0', '#9fdcff']), shape: 'note', double: CH.chance(0.4), grav: 0, fade: true });
      }
    }
    // neighbours catch it after a moment, and stop a moment after he does
    for (const n of this.npcs) {
      if (n.hidden || n.pose === 'sit' || n.pose === 'lying' || n.pose === 'inbed' || n.noDance) continue;
      const near = Math.abs(n.x - pl.x) < 150;
      n.danceLag = n.danceLag === undefined ? CH.rand(0.3, 1.1) : n.danceLag;
      if (pl.dancing && near && this.danceHeld > n.danceLag) { if (!n.dancing) { n.dancing = true; n.danceT = 0; } }
      else if (n.dancing && !n.forceDance && (!pl.dancing || !near)) n.dancing = false;
    }
  };
})(window.CH);
