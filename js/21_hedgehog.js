// ============================================================================
// BLUE HEDGEHOG - the game inside the game. Retro platformer + TV zoom.
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, inp = CH.input, A = CH.audio, fx = CH.fx, ui = CH.ui;
  const W = CH.W, H = CH.H, T = 16;
  const ROWS = 18, COLS = 250;
  const LVL_H = ROWS * T;

  // ---- level generation ---------------------------------------------------------
  function buildLevel() {
    const grid = [];
    for (let r = 0; r < ROWS; r++) grid.push(new Array(COLS).fill(0));
    const ground = new Array(COLS).fill(3);
    // [from, to, height] ground heights in tiles (0 = pit)
    const terrain = [[0, 22, 3], [22, 27, 4], [27, 31, 5], [31, 35, 0], [35, 52, 3], [52, 56, 5], [56, 60, 6], [60, 64, 5], [64, 68, 3], [68, 72, 0], [72, 92, 3], [92, 96, 6], [96, 100, 8], [100, 104, 6], [104, 112, 3], [112, 116, 0], [116, 130, 3], [130, 134, 4], [134, 138, 5], [138, 142, 6], [142, 146, 7], [146, 158, 3], [158, 162, 0], [162, 178, 3], [178, 182, 5], [182, 186, 3], [186, 190, 0], [190, 200, 3], [200, 250, 3]];
    for (const [a, b, h] of terrain) for (let x = a; x < b; x++) ground[x] = h;
    for (let x = 0; x < COLS; x++) for (let r = ROWS - ground[x]; r < ROWS; r++) grid[r][x] = 1;
    // floating platforms [x, rowFromBottom, len]
    const plats = [[12, 7, 4], [31, 6, 4], [40, 8, 3], [46, 10, 3], [68, 7, 4], [76, 9, 3], [84, 11, 4], [108, 8, 5], [112, 6, 4], [122, 9, 3], [128, 11, 3], [150, 8, 4], [158, 7, 5], [166, 10, 3], [172, 12, 4], [186, 7, 4], [194, 9, 3]];
    for (const [x, rb, len] of plats) for (let i = 0; i < len; i++) if (x + i < COLS) grid[ROWS - 1 - rb][x + i] = 2;
    const ents = [];
    // rings: lines along ground & arcs on platforms
    const ringLine = (x0, n, rb) => { for (let i = 0; i < n; i++) ents.push({ t: 'ring', x: (x0 + i) * T + 8, y: (ROWS - rb) * T - 8 }); };
    const ringArc = (x0, n, rb, amp) => { for (let i = 0; i < n; i++) ents.push({ t: 'ring', x: (x0 + i) * T + 8, y: (ROWS - rb) * T - 8 - Math.sin((i / (n - 1)) * Math.PI) * amp }); };
    ringLine(6, 5, 4); ringArc(13, 4, 9, 6); ringLine(24, 3, 6); ringArc(30, 5, 6, 20); ringLine(37, 4, 4); ringLine(41, 3, 10); ringLine(47, 3, 12); ringArc(53, 6, 7, 12); ringLine(62, 3, 7);
    ringArc(67, 6, 4, 22); ringLine(69, 4, 9); ringLine(77, 3, 11); ringLine(85, 4, 13); ringArc(93, 5, 8, 8); ringLine(97, 3, 10); ringArc(111, 6, 4, 24); ringLine(109, 5, 10);
    ringLine(118, 5, 4); ringLine(123, 3, 11); ringLine(129, 3, 13); ringArc(131, 8, 6, 10); ringLine(143, 3, 9); ringLine(151, 4, 10); ringArc(157, 6, 4, 22); ringLine(159, 5, 9); ringLine(167, 3, 12); ringLine(173, 4, 14); ringLine(179, 4, 7); ringArc(185, 6, 4, 22); ringLine(187, 4, 9); ringLine(195, 3, 11);
    ringLine(204, 6, 4);
    // ladybugs [tileX, rowFromBottom(ground height)]
    for (const [x, h] of [[16, 3], [38, 3], [44, 3], [58, 6], [74, 3], [86, 3], [98, 8], [108, 3], [120, 3], [126, 3], [144, 7], [152, 3], [168, 3], [176, 3], [192, 3], [196, 3], [80, 3]]) ents.push({ t: 'lady', x: x * T + 8, y: (ROWS - h) * T });
    // springs [tileX, groundH]
    for (const [x, h] of [[26, 4], [50, 3], [90, 3], [129, 4], [156, 3], [177, 3]]) ents.push({ t: 'spring', x: x * T + 8, y: (ROWS - h) * T });
    // item monitors
    for (const [x, rb] of [[14, 8], [47, 11], [86, 12], [112, 7], [173, 13]]) ents.push({ t: 'monitor', x: x * T + 8, y: (ROWS - 1 - rb) * T });
    // checkpoints
    for (const x of [64, 130, 182]) ents.push({ t: 'check', x: x * T + 8, y: (ROWS - ground[x]) * T });
    // decorations: flowers, sunflowers, totems
    const rng = new CH.Rng(42);
    for (let x = 2; x < 200; x += rng.int(3, 7)) if (ground[x] > 0) ents.push({ t: 'deco', v: rng.int(0, 3), x: x * T + rng.int(2, 12), y: (ROWS - ground[x]) * T });
    ents.push({ t: 'boss', x: 222 * T, y: (ROWS - 3) * T });
    return { grid, ground, ents };
  }

  // ---- sprite painters ----------------------------------------------------------------
  const HC = { b: '#3b6fd6', B: '#2749a3', t: '#f2c9a0', r: '#d13c3c', R: '#8f1d1d', w: '#fff', k: '#111', g: '#3ec26a' };
  function drawHedgehog(g, x, y, p) {
    // x,y = feet center; p: {flip, state:'idle'|'run'|'ball'|'hurt'|'skid'|'victory', frame, speed, squashX, squashY}
    const dir = p.flip ? -1 : 1, sx = p.sx || 1, sy = p.sy || 1;
    const X = (v) => Math.round(v * sx) * dir, Y = (v) => Math.round(v * sy);
    const ox = Math.round(x), oy = Math.round(y);
    const E = (cx, cy, rx, ry, c) => gfx.ellipse(ox + X(cx), oy + Y(cy), Math.max(0.6, rx * sx), Math.max(0.6, ry * sy), c);
    const R = (x0, y0, x1, y1, c) => { const ax = ox + X(x0), bx = ox + X(x1), ay = oy + Y(y0), by = oy + Y(y1); gfx.rect(Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax) + 1, Math.abs(by - ay) + 1, c); };
    const TRI = (ax, ay, bx, by, cx, cy, c) => gfx.tri(ox + X(ax), oy + Y(ay), ox + X(bx), oy + Y(by), ox + X(cx), oy + Y(cy), c);
    if (p.state === 'ball') {
      const rot = p.rot || 0;
      E(0, -10, 8, 8, HC.B); E(0.5, -10.5, 6.5, 6.5, HC.b);
      for (let i = 0; i < 6; i++) { const a = rot + (i / 6) * Math.PI * 2; TRI(Math.cos(a) * 6, -10 + Math.sin(a) * 6, Math.cos(a + 0.35) * 6, -10 + Math.sin(a + 0.35) * 6, Math.cos(a + 0.17) * 11, -10 + Math.sin(a + 0.17) * 11, HC.b); }
      E(1, -8, 3, 2.5, HC.t);
      R(-2, -6, 0, -4, HC.r); R(3, -13, 5, -11, HC.r); // shoes peeking
      return;
    }
    const bob = p.state === 'run' ? Math.abs(Math.sin((p.frame || 0) * Math.PI)) * 1.5 : 0;
    // quills (back)
    const qt = p.state === 'run' ? 1 : 0;
    TRI(-4, -14 - bob, -4, -9 - bob, -13 - qt * 2, -14 - bob, HC.b); TRI(-3, -18 - bob, -5, -13 - bob, -13 - qt * 2, -20 - bob, HC.b); TRI(-1, -22 - bob, -5, -18 - bob, -10 - qt * 2, -26 - bob, HC.b);
    // legs
    const legCol = HC.b;
    if (p.state === 'run') {
      const f = (p.frame || 0);
      if ((p.speed || 0) > 170) { // wheel legs
        for (let i = 0; i < 3; i++) { const a = f * Math.PI * 2 + (i / 3) * Math.PI * 2; E(Math.cos(a) * 4, -4 + Math.sin(a) * 3, 3, 2, HC.r); }
      } else {
        const l = Math.sin(f * Math.PI * 2) * 4, r = -l;
        R(-1 + l * 0.5, -6, 0 + l * 0.5, -3, legCol); R(1 + r * 0.5, -6, 2 + r * 0.5, -3, legCol);
        E(l - 1, -1.5 - Math.max(0, l) * 0.4, 3.5, 1.8, HC.r); E(r + 3, -1.5 - Math.max(0, r) * 0.4, 3.5, 1.8, HC.r);
        R(l - 3, -2, l + 1, -2, HC.w); R(r + 1, -2, r + 5, -2, HC.w);
      }
    } else if (p.state === 'skid') {
      R(-3, -6, -2, -3, legCol); R(3, -6, 4, -3, legCol); E(-3, -1.5, 3.5, 1.8, HC.r); E(4, -1.5, 3.5, 1.8, HC.r);
    } else {
      R(-2, -6, -1, -3, legCol); R(2, -6, 3, -3, legCol);
      E(-2, -1.5, 3.5, 1.8, HC.r); E(3, -1.5, 3.5, 1.8, HC.r); R(-4, -2, 0, -2, HC.w); R(1, -2, 5, -2, HC.w);
    }
    // body
    E(0, -11 - bob, 6, 6, HC.b);
    E(1, -9 - bob, 3.5, 3.5, HC.t); // belly
    // arms/gloves
    if (p.state === 'victory') { E(-6, -20 - bob, 2, 2, HC.w); E(6, -20 - bob, 2, 2, HC.w); R(-5, -17 - bob, -4, -13 - bob, HC.b); R(5, -17 - bob, 6, -13 - bob, HC.b); }
    else if (p.state === 'run') { const f = (p.frame || 0); E(4 + Math.sin(f * Math.PI * 2) * 3, -9 - bob, 2, 2, HC.w); }
    else { E(4, -8 - bob, 2, 2, HC.w); E(-5, -8 - bob, 2, 2, HC.w); }
    // head
    E(2, -19 - bob, 7, 6.5, HC.b);
    E(5, -17 - bob, 4.5, 3.5, HC.t); // muzzle
    R(9, -18 - bob, 10, -18 - bob, HC.k); // nose
    // eye (big, connected)
    E(4, -21 - bob, 3, 3, HC.w);
    if (p.state === 'hurt') { R(3, -22 - bob, 5, -20 - bob, HC.k); R(5, -18 - bob, 7, -17 - bob, HC.k); }
    else { R(5, -22 - bob, 6, -20 - bob, p.eye || HC.g); R(6, -22 - bob, 6, -21 - bob, HC.k); R(2, -23 - bob, 3, -22 - bob, HC.k); }
    // mouth
    if (p.state === 'victory') R(5, -14 - bob, 8, -14 - bob, HC.k); else if (p.state === 'hurt') R(6, -14 - bob, 7, -13 - bob, HC.k);
    // ear
    TRI(-1, -24 - bob, 2, -24 - bob, 0, -28 - bob, HC.b);
  }
  CH.drawHedgehog = drawHedgehog;

  function drawLadybug(g, x, y, p) {
    // x,y: feet center
    const dir = p.flip ? -1 : 1;
    const X = (v) => Math.round(v) * dir;
    const ox = Math.round(x), oy = Math.round(y);
    const E = (cx, cy, rx, ry, c) => gfx.ellipse(ox + X(cx), oy + cy, rx, ry, c);
    const R = (x0, y0, x1, y1, c) => { const ax = ox + X(x0), bx = ox + X(x1); gfx.rect(Math.min(ax, bx), oy + Math.min(y0, y1), Math.abs(bx - ax) + 1, Math.abs(y1 - y0) + 1, c); };
    const f = p.frame || 0;
    // legs
    for (let i = 0; i < 3; i++) { const l = Math.sin(f * Math.PI * 2 + i * 2) * 1.5; R(-4 + i * 3, -2, -4 + i * 3 + Math.round(l), 0, '#222'); }
    E(0, -5, 7, 4.5, '#8f1d1d'); E(0, -5.5, 6, 4, '#d13c3c');
    R(0, -9, 0, -2, '#111'); // wing seam
    for (const [dx, dy] of [[-4, -6], [-2, -4], [3, -7], [4, -4], [1, -8]]) R(dx, dy, dx, dy, '#111');
    E(7, -4, 2.5, 2.5, '#111'); R(8, -5, 8, -5, '#fff'); // head + eye
    R(8, -8, 9, -7, '#111'); R(6, -8, 6, -7, '#111'); // antennae
    if (p.kicked) { R(6, -5, 7, -5, '#fff'); }
  }
  function drawManEgg(g, x, y, p) {
    // x,y: center of pod
    const ox = Math.round(x), oy = Math.round(y), t = p.t || 0;
    const hurt = p.flash;
    // propeller
    const pw = Math.abs(Math.sin(t * 25)) * 16 + 2; gfx.rect(ox - pw / 2, oy - 34, pw, 2, hurt ? '#fff' : '#ccc'); gfx.rect(ox - 1, oy - 32, 2, 4, '#888');
    // pod
    gfx.ellipse(ox, oy + 10, 16, 8, hurt ? '#fff' : '#5a5a66'); gfx.ellipse(ox, oy + 8, 15, 6, hurt ? '#fff' : '#7a7a88'); gfx.rect(ox - 15, oy + 10, 30, 6, hurt ? '#fff' : '#5a5a66');
    gfx.rect(ox - 12, oy + 5, 4, 2, '#f2c94c'); gfx.rect(ox + 8, oy + 5, 4, 2, '#d13c3c'); // buttons
    // jets
    for (let i = -1; i <= 1; i += 2) { const fl = 3 + Math.sin(t * 30 + i) * 2; gfx.tri(ox + i * 9 - 3, oy + 16, ox + i * 9 + 3, oy + 16, ox + i * 9, oy + 16 + fl * 2, '#e8752c'); gfx.tri(ox + i * 9 - 1, oy + 16, ox + i * 9 + 1, oy + 16, ox + i * 9, oy + 16 + fl, '#f5c33b'); }
    // egg body
    gfx.ellipse(ox, oy - 8, 11, 15, hurt ? '#fff' : '#e8dcc0'); gfx.ellipse(ox - 3, oy - 12, 4, 6, hurt ? '#fff' : '#f4ecd8');
    // tiny arms
    gfx.rect(ox - 15, oy - 6, 5, 2, '#e8dcc0'); gfx.rect(ox + 10, oy - 6, 5, 2, '#e8dcc0'); gfx.ellipse(ox - 16, oy - 5, 2, 2, '#fff'); gfx.ellipse(ox + 16, oy - 5, 2, 2, '#fff');
    // face
    gfx.rect(ox - 6, oy - 16, 4, 3, '#fff'); gfx.rect(ox + 2, oy - 16, 4, 3, '#fff'); gfx.rect(ox - 4, oy - 15, 1, 2, '#111'); gfx.rect(ox + 3, oy - 15, 1, 2, '#111');
    gfx.rect(ox - 7, oy - 18, 5, 1, '#5a3a1a'); gfx.rect(ox + 2, oy - 18, 5, 1, '#5a3a1a'); // brows
    // glorious mustache
    gfx.rect(ox - 9, oy - 10, 18, 2, '#5a3a1a'); gfx.rect(ox - 11, oy - 11, 3, 2, '#5a3a1a'); gfx.rect(ox + 8, oy - 11, 3, 2, '#5a3a1a'); gfx.rect(ox - 1, oy - 11, 2, 1, '#5a3a1a');
    // mouth
    if (p.laugh) gfx.rect(ox - 3, oy - 7, 6, 2, '#5a1a1a'); else gfx.rect(ox - 2, oy - 7, 4, 1, '#5a1a1a');
    // little hat / goggles
    gfx.rect(ox - 8, oy - 22, 16, 2, '#333'); gfx.ellipse(ox - 4, oy - 22, 3, 2, '#3b6fd6'); gfx.ellipse(ox + 4, oy - 22, 3, 2, '#3b6fd6');
  }
  CH.drawManEgg = drawManEgg;

  // ---- tile drawing --------------------------------------------------------------------
  const TILE_IMGS = {};
  function tileImg(kind) {
    if (TILE_IMGS[kind]) return TILE_IMGS[kind];
    const c = gfx.makeCanvas(T, T), cx = c.getContext('2d');
    gfx.pushTarget(cx);
    if (kind === 'dirt') { gfx.rect(0, 0, T, T, '#a86a3a'); const rng = new CH.Rng(9); for (let i = 0; i < 10; i++) gfx.rect(rng.int(0, 15), rng.int(0, 15), 2, 1, rng.chance(0.5) ? '#8a5028' : '#c28048'); }
    else if (kind === 'grass') { gfx.rect(0, 0, T, T, '#a86a3a'); gfx.rect(0, 0, T, 5, '#3ec26a'); gfx.rect(0, 0, T, 2, '#7ee08a'); for (let i = 0; i < T; i += 2) gfx.rect(i, 4 + (i % 4 === 0 ? 1 : 0), 1, 1, '#8a5028'); gfx.rect(3, -1, 1, 2, '#7ee08a'); gfx.rect(9, -1, 1, 2, '#7ee08a'); gfx.rect(13, 0, 1, 1, '#7ee08a'); const rng = new CH.Rng(3); for (let i = 0; i < 6; i++) gfx.rect(rng.int(0, 15), rng.int(7, 15), 2, 1, '#8a5028'); }
    else if (kind === 'plat') { gfx.rect(0, 0, T, T, '#a86a3a'); gfx.rect(0, 0, T, 5, '#3ec26a'); gfx.rect(0, 0, T, 2, '#7ee08a'); gfx.rect(0, 12, T, 4, '#6a4020'); for (let i = 1; i < T; i += 4) gfx.rect(i, 13, 2, 2, '#8a5028'); }
    else if (kind === 'edgeL') { gfx.rect(0, 0, T, T, '#a86a3a'); gfx.rect(0, 0, 3, T, '#6a4020'); }
    else if (kind === 'edgeR') { gfx.rect(0, 0, T, T, '#a86a3a'); gfx.rect(13, 0, 3, T, '#6a4020'); }
    gfx.popTarget();
    TILE_IMGS[kind] = c;
    return c;
  }

  // ---- scene ---------------------------------------------------------------------------------
  class HedgehogScene extends CH.Scene {
    constructor(opts = {}) {
      super();
      this.name = 'hedgehog';
      this.opts = opts;
      const L = buildLevel();
      this.grid = L.grid; this.ground = L.ground;
      this.rings = []; this.enemies = []; this.springs = []; this.monitors = []; this.checks = []; this.decos = []; this.scattered = [];
      this.boss = null;
      for (const e of L.ents) {
        if (e.t === 'ring') this.rings.push({ x: e.x, y: e.y, got: false });
        else if (e.t === 'lady') this.enemies.push({ x: e.x, y: e.y, vx: -30, flip: true, frame: 0, alive: true, kicked: false, vy: 0, rot: 0, t: 0 });
        else if (e.t === 'spring') this.springs.push({ x: e.x, y: e.y, t: 0 });
        else if (e.t === 'monitor') this.monitors.push({ x: e.x, y: e.y, broken: false, t: 0 });
        else if (e.t === 'check') this.checks.push({ x: e.x, y: e.y, hit: false });
        else if (e.t === 'deco') this.decos.push(e);
        else if (e.t === 'boss') this.bossSpawn = e;
      }
      this.p = { x: 3 * T, y: (ROWS - 3) * T, vx: 0, vy: 0, w: 10, h: 20, grounded: false, canDouble: true, coyote: 0, buffer: 0, frame: 0, rot: 0, state: 'idle', flip: false, inv: 0, hurtT: 0, sx: 1, sy: 1, jumpHeld: false, spinT: 0 };
      this.rings_n = 0; this.score = 0; this.time = 0; this.lives = 3;
      this.cam = { x: 0, y: LVL_H - H };
      this.particles = new CH.Particles();
      this.phase = 'title'; // title | play | boss | victory | frozen
      this.titleT = 0;
      this.frozen = false;
      this.checkpoint = { x: this.p.x, y: this.p.y };
      this.deaths = 0;
      this.playT = 0;
      this.crashArmed = opts.crash !== false;
      this.crashed = false;
      this.msgT = 0; this.msg = '';
      this.bossTaunts = ['You cannot stop me, rodent!', 'My eggs are UNBEATABLE!', 'Ow! My beautiful shell!', 'Behold! EGG-CELLENCE!'];
      this.hitstopT = 0;
    }
    enter() { fx.scanlines = true; fx.vignette = 0.7; A.play('hedgehog'); if (this.opts.skipTitle) this.phase = 'play'; }
    exit() { fx.scanlines = false; fx.vignette = 0; }
    // ---- collision helpers ----------------------------------------------------------------
    solidAt(x, y) { const c = Math.floor(x / T), r = Math.floor(y / T); if (c < 0 || c >= COLS) return true; if (r < 0) return false; if (r >= ROWS) return false; return this.grid[r][c] === 1; }
    platAt(x, y) { const c = Math.floor(x / T), r = Math.floor(y / T); if (c < 0 || c >= COLS || r < 0 || r >= ROWS) return false; return this.grid[r][c] === 2; }
    // ---- update -------------------------------------------------------------------------------
    update(dt) {
      if (this.frozen) return;
      this.particles.update(dt);
      if (this.phase === 'title') {
        this.titleT += dt;
        if (this.titleT > 1.2 && (inp.hit('jump') || inp.hit('confirm') || inp.hit('interact') || inp.mpressed)) { this.phase = 'play'; A.sfx('select'); }
        if (this.titleT > 6) this.phase = 'play';
        return;
      }
      if (this.hitstopT > 0) { this.hitstopT -= dt; return; }
      this.time += dt; this.playT += dt;
      if (this.msgT > 0) this.msgT -= dt;
      if (this.phase !== 'victory') this.updatePlayer(dt);
      this.updateEnemies(dt);
      this.updateRings(dt);
      for (const s of this.springs) if (s.t > 0) s.t -= dt;
      for (const m of this.monitors) if (m.t > 0) m.t -= dt;
      if (this.boss) this.updateBoss(dt);
      else if (this.p.x > this.bossSpawn.x - 120 && this.phase === 'play') this.startBoss();
      // camera
      const p = this.p;
      const lookahead = CH.clamp(p.vx * 0.35, -60, 60);
      let tx = p.x + lookahead - W / 2, ty = p.y - H * 0.62;
      if (this.boss) tx = CH.clamp(tx, this.bossArena.x0, this.bossArena.x1 - W);
      tx = CH.clamp(tx, 0, COLS * T - W); ty = CH.clamp(ty, 0, LVL_H - H);
      this.cam.x = CH.lerp(this.cam.x, tx, Math.min(1, dt * 8)); this.cam.y = CH.lerp(this.cam.y, ty, Math.min(1, dt * 5));
      // crash trigger safety net
      if (this.crashArmed && !this.crashed && this.playT > 170) this.triggerCrash();
      if (this.opts.timeCap && this.playT > this.opts.timeCap && !this.capped) { this.capped = true; this.frozen = true; if (this.opts.onFinish) this.opts.onFinish(this); }
      if (this.opts.canQuit && inp.hit('cancel') && !this.capped) { this.capped = true; this.frozen = true; inp.eat(); if (this.opts.onFinish) this.opts.onFinish(this); }
    }
    updatePlayer(dt) {
      const p = this.p;
      const ax = inp.axisX();
      const ACC = 620, DEC = 1500, FRIC = 700, TOP = 210, AIR = 420, GRAV = 980, JUMP = -330, DJUMP = -300;
      if (p.hurtT > 0) { p.hurtT -= dt; }
      else {
        if (ax !== 0) {
          if (p.grounded) {
            if (Math.sign(p.vx) !== 0 && Math.sign(p.vx) !== ax && Math.abs(p.vx) > 60) { p.vx += ax * DEC * dt; if (!p.skidding) { p.skidding = true; A.sfx('step'); } this.particles.burst(p.x - ax * 4, p.y, 2, { color: ['#c8c8c8', '#fff'], speed: 30, grav: 100, life: 0.3, angle: -Math.PI / 2 + ax * 0.6, spread: 0.8 }); }
            else { p.vx += ax * ACC * dt; p.skidding = false; }
          } else p.vx += ax * AIR * dt;
        } else { p.skidding = false; if (p.grounded) p.vx = CH.approach(p.vx, 0, FRIC * dt); else p.vx = CH.approach(p.vx, 0, 60 * dt); }
        p.vx = CH.clamp(p.vx, -TOP, TOP);
        if (ax !== 0 && (p.grounded || Math.abs(p.vx) > 20)) p.flip = ax < 0 ? true : false;
      }
      // jumping
      if (inp.hit('jump')) p.buffer = 0.1; else p.buffer -= dt;
      if (p.grounded) { p.coyote = 0.09; p.canDouble = true; } else p.coyote -= dt;
      if (p.buffer > 0 && p.hurtT <= 0) {
        if (p.coyote > 0) { p.vy = JUMP; p.grounded = false; p.coyote = 0; p.buffer = 0; p.jumpHeld = true; p.sy = 1.25; p.sx = 0.8; A.sfx('jump'); this.particles.burst(p.x, p.y, 4, { color: ['#c8c8c8', '#fff'], speed: 30, grav: 100, life: 0.3, angle: -Math.PI / 2, spread: 2 }); }
        else if (p.canDouble && !p.grounded) { p.vy = DJUMP; p.canDouble = false; p.buffer = 0; p.jumpHeld = true; p.spinT = 0.4; A.sfx('djump'); this.particles.burst(p.x, p.y - 10, 10, { color: ['#3b6fd6', '#fff', '#9fdcff'], speed: 70, grav: 0, life: 0.35, shape: 'spark' }); this.particles.add({ x: p.x, y: p.y - 10, life: 0.3, color: '#fff', shape: 'ring', size: 4 }); }
      }
      if (!inp.down('jump') && p.jumpHeld && p.vy < -120) { p.vy = -120; p.jumpHeld = false; }
      if (!inp.down('jump')) p.jumpHeld = false;
      p.vy += GRAV * dt; if (p.vy > 420) p.vy = 420;
      // integrate X
      const hw = p.w / 2;
      p.x += p.vx * dt;
      // walls (check at several heights)
      for (const yy of [p.y - 2, p.y - p.h / 2, p.y - p.h + 2]) {
        if (p.vx > 0 && this.solidAt(p.x + hw, yy)) { p.x = Math.floor((p.x + hw) / T) * T - hw - 0.01; p.vx = 0; }
        if (p.vx < 0 && this.solidAt(p.x - hw, yy)) { p.x = Math.ceil((p.x - hw) / T) * T + hw + 0.01; p.vx = 0; }
      }
      if (this.boss) p.x = CH.clamp(p.x, this.bossArena.x0 + hw + 2, this.bossArena.x1 - hw - 2);
      // integrate Y
      const wasGrounded = p.grounded;
      const prevY = p.y;
      p.y += p.vy * dt;
      p.grounded = false;
      if (p.vy >= 0) {
        // ground & platform (platforms only from above)
        for (const xx of [p.x - hw + 1, p.x + hw - 1]) {
          if (this.solidAt(xx, p.y) || (this.platAt(xx, p.y) && prevY <= Math.floor(p.y / T) * T + 0.5)) {
            p.y = Math.floor(p.y / T) * T; p.grounded = true;
          }
        }
        if (p.grounded) { if (!wasGrounded) { A.sfx('land'); p.sy = 0.75; p.sx = 1.25; this.particles.burst(p.x, p.y, 4, { color: ['#c8c8c8'], speed: 25, grav: 100, life: 0.3, angle: -Math.PI / 2, spread: 2.5 }); } p.vy = 0; }
      } else {
        for (const xx of [p.x - hw + 1, p.x + hw - 1]) if (this.solidAt(xx, p.y - p.h)) { p.y = Math.ceil((p.y - p.h) / T) * T + p.h; p.vy = 0; }
      }
      // fall into pit
      if (p.y > LVL_H + 40) this.die();
      // springs
      for (const s of this.springs) {
        if (Math.abs(p.x - s.x) < 10 && p.y >= s.y - 10 && p.y <= s.y + 4 && p.vy >= 0) { p.vy = -560; p.grounded = false; p.canDouble = true; s.t = 0.3; A.sfx('spring'); p.sy = 1.4; p.sx = 0.7; }
      }
      // monitors (item boxes): break by hitting from below or bouncing on top
      for (const m of this.monitors) {
        if (m.broken) continue;
        if (Math.abs(p.x - m.x) < 12 && p.y - p.h < m.y + 16 && p.y > m.y - 2) {
          m.broken = true; m.t = 0.5; A.sfx('coin'); this.rings_n += 10; this.score += 100;
          this.particles.burst(m.x, m.y + 8, 12, { color: ['#f5c33b', '#fff', '#9fdcff'], speed: 90, life: 0.6 });
          this.particles.text(m.x, m.y - 4, '+10', '#f5c33b');
          if (p.vy > 0) { p.vy = -200; }
        }
      }
      // checkpoints
      for (const c of this.checks) if (!c.hit && Math.abs(p.x - c.x) < 10) { c.hit = true; this.checkpoint = { x: c.x, y: c.y }; A.sfx('ring'); this.particles.burst(c.x, c.y - 24, 8, { color: ['#3b6fd6', '#fff'], speed: 60, life: 0.5 }); }
      // animation state
      if (p.hurtT > 0) p.state = 'hurt';
      else if (!p.grounded) { p.state = 'ball'; p.rot += dt * (12 + Math.abs(p.vx) * 0.05) * (p.flip ? -1 : 1); }
      else if (p.skidding) p.state = 'skid';
      else if (Math.abs(p.vx) > 8) { p.state = 'run'; p.frame += dt * (4 + Math.abs(p.vx) * 0.045); }
      else p.state = 'idle';
      if (p.spinT > 0) p.spinT -= dt;
      p.sx = CH.approach(p.sx, 1, dt * 3); p.sy = CH.approach(p.sy, 1, dt * 3);
      if (p.inv > 0) p.inv -= dt;
      // world bounds
      if (p.x < hw) { p.x = hw; p.vx = 0; }
    }
    updateEnemies(dt) {
      const p = this.p;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        e.t += dt;
        if (e.kicked) {
          e.vy += 900 * dt; e.x += e.vx * dt; e.y += e.vy * dt; e.rot += dt * 20;
          if (e.y > LVL_H + 60 || e.t > 3) e.alive = false;
          continue;
        }
        // patrol
        e.frame += dt * 6;
        const nx = e.x + e.vx * dt;
        const ahead = e.vx < 0 ? nx - 7 : nx + 7;
        if (this.solidAt(ahead, e.y - 4) || (!this.solidAt(ahead, e.y + 2) && !this.platAt(ahead, e.y + 2))) { e.vx = -e.vx; e.flip = e.vx < 0; }
        else e.x = nx;
        // collision with player
        if (p.inv <= 0 && p.hurtT <= 0 && Math.abs(p.x - e.x) < 12 && p.y > e.y - 12 && p.y - p.h < e.y) {
          const fromAbove = p.vy > 0 && p.y - 6 < e.y - 6;
          const fast = Math.abs(p.vx) > 120;
          if (fromAbove || !p.grounded) {
            // bounce/stomp
            this.kickEnemy(e, Math.sign(p.x - e.x) || 1, false);
            p.vy = -260; p.canDouble = true;
          } else if (fast) {
            this.kickEnemy(e, Math.sign(p.vx) || (p.flip ? -1 : 1), true);
          } else this.hurt(Math.sign(p.x - e.x) || 1);
        }
      }
    }
    kickEnemy(e, dir, isKick) {
      e.kicked = true; e.t = 0; e.vx = dir * (isKick ? 260 : 120); e.vy = isKick ? -220 : -320; e.rot = 0;
      A.sfx('kick'); this.score += isKick ? 200 : 100;
      this.particles.burst(e.x, e.y - 5, 10, { color: ['#d13c3c', '#111', '#fff'], speed: 80, life: 0.5 });
      this.particles.text(e.x, e.y - 14, isKick ? 'KICK! +200' : '+100', '#fff');
      if (isKick) { this.hitstopT = 0.06; CH.doShake(2, 0.15); this.particles.add({ x: e.x, y: e.y - 6, life: 0.25, color: '#fff', shape: 'ring', size: 5 }); }
    }
    hurt(dir) {
      const p = this.p;
      if (this.rings_n <= 0) { this.die(); return; }
      A.sfx('hurt'); CH.doShake(3, 0.3);
      p.vx = dir * 140; p.vy = -220; p.grounded = false; p.hurtT = 0.5; p.inv = 1.6;
      const n = Math.min(this.rings_n, 20);
      for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i / n - 0.5) * Math.PI * 1.6; const sp = 120 + (i % 3) * 40; this.scattered.push({ x: p.x, y: p.y - 10, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: 3.5 }); }
      this.rings_n = 0;
    }
    die() {
      const p = this.p;
      this.deaths++;
      A.sfx('hurt'); A.sfx('explode');
      this.particles.burst(p.x, p.y - 10, 20, { color: ['#3b6fd6', '#fff', '#d13c3c'], speed: 100, life: 0.7 });
      p.x = this.checkpoint.x; p.y = this.checkpoint.y - 2; p.vx = 0; p.vy = 0; p.inv = 2; p.hurtT = 0; this.rings_n = Math.floor(this.rings_n / 2);
      if (this.boss) { p.x = this.bossArena.x0 + 40; }
      this.showMsg('OUCH! Try again!');
      if (this.lives > 1) this.lives--; else this.lives = 3;
    }
    updateRings(dt) {
      const p = this.p;
      for (const r of this.rings) {
        if (r.got) continue;
        if (Math.abs(p.x - r.x) < 11 && p.y - 10 > r.y - 14 && p.y - 10 < r.y + 12) this.collectRing(r);
      }
      for (let i = this.scattered.length - 1; i >= 0; i--) {
        const s = this.scattered[i];
        s.t += dt; s.vy += 500 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
        if (s.vy > 0 && (this.solidAt(s.x, s.y + 4) || this.platAt(s.x, s.y + 4))) { s.y = Math.floor((s.y + 4) / T) * T - 4; s.vy *= -0.6; s.vx *= 0.8; }
        if (s.t > s.life || s.y > LVL_H + 40) { this.scattered.splice(i, 1); continue; }
        if (s.t > 0.6 && p.inv <= 0.8 && Math.abs(p.x - s.x) < 11 && Math.abs(p.y - 10 - s.y) < 12) { this.scattered.splice(i, 1); this.rings_n++; A.sfx('ring'); this.particles.burst(s.x, s.y, 4, { color: ['#f5c33b', '#fff'], speed: 40, life: 0.3, grav: 0, shape: 'spark' }); }
      }
    }
    collectRing(r) { r.got = true; this.rings_n++; this.score += 10; CH.state.stats.ringsCollected++; A.sfx('ring'); this.particles.burst(r.x, r.y, 5, { color: ['#f5c33b', '#fff'], speed: 50, life: 0.35, grav: 0, shape: 'spark' }); }
    showMsg(m, t = 2) { this.msg = m; this.msgT = t; }
    // ---- boss --------------------------------------------------------------------------------
    startBoss() {
      this.phase = 'boss';
      this.bossArena = { x0: (this.bossSpawn.x / T - 16) * T, x1: (this.bossSpawn.x / T + 16) * T };
      this.boss = { x: this.bossSpawn.x + 60, y: (ROWS - 3) * T - 70, baseY: (ROWS - 3) * T - 70, t: 0, hp: 3, state: 'enter', st: 0, flash: 0, bombs: [], vx: 0, dir: -1, laugh: 0, taunt: 0 };
      A.play('boss', 0.3); A.sfx('boss');
      this.showMsg('MAN EGG APPROACHES!', 2.5);
      for (const e of this.enemies) if (e.x > this.bossArena.x0 && !e.kicked) e.alive = false;
    }
    updateBoss(dt) {
      const b = this.boss, p = this.p;
      b.t += dt; b.st += dt;
      if (b.flash > 0) b.flash -= dt;
      if (b.laugh > 0) b.laugh -= dt;
      if (b.taunt > 0) b.taunt -= dt;
      const hover = Math.sin(b.t * 2.2) * 6;
      if (b.state === 'enter') { b.x = CH.approach(b.x, this.bossSpawn.x, 60 * dt); b.y = b.baseY + hover; if (b.st > 2.2) { b.state = 'patrol'; b.st = 0; b.dir = -1; } }
      else if (b.state === 'patrol') {
        b.x += b.dir * 55 * dt; b.y = b.baseY + hover;
        if (b.x < this.bossArena.x0 + 60) b.dir = 1; if (b.x > this.bossArena.x1 - 60) b.dir = -1;
        if (b.st > 1.4) { b.st = 0; if (CH.chance(0.55)) { b.state = 'bomb'; b.laugh = 0.8; } else { b.state = 'swoop'; b.swoopX = p.x; } }
      } else if (b.state === 'bomb') {
        b.y = b.baseY + hover;
        if (b.st > 0.3 && !b.dropped) { b.dropped = true; b.bombs.push({ x: b.x, y: b.y + 16, vx: (p.x - b.x) * 0.5, vy: 20, t: 0 }); A.sfx('pop'); }
        if (b.st > 0.9) { b.state = 'patrol'; b.st = 0; b.dropped = false; }
      } else if (b.state === 'swoop') {
        // swoop down to ground level (hittable!) then rise
        const k = Math.min(1, b.st / 1.6);
        b.y = b.baseY + Math.sin(k * Math.PI) * 52 + hover * 0.3;
        b.x += (b.swoopX - b.x) * dt * 2;
        if (b.st > 1.6) { b.state = 'patrol'; b.st = 0; }
      } else if (b.state === 'dying') {
        b.y -= 40 * dt; b.x += Math.sin(b.t * 10) * 2; b.flash = 0.05;
        if (Math.random() < 0.3) { this.particles.burst(b.x + CH.rand(-14, 14), b.y + CH.rand(-14, 14), 6, { color: ['#f5c33b', '#e8752c', '#fff'], speed: 70, life: 0.5 }); A.sfx('bossHit'); }
        if (b.st > 2.4) { this.boss.gone = true; this.victory(); }
        return;
      }
      // bombs
      for (let i = b.bombs.length - 1; i >= 0; i--) {
        const bm = b.bombs[i];
        bm.t += dt; bm.vy += 500 * dt; bm.x += bm.vx * dt; bm.y += bm.vy * dt;
        if (this.solidAt(bm.x, bm.y + 4) || bm.t > 3) {
          b.bombs.splice(i, 1); A.sfx('explode'); CH.doShake(3, 0.25);
          this.particles.burst(bm.x, bm.y, 16, { color: ['#f5c33b', '#e8752c', '#fff', '#333'], speed: 90, life: 0.6 });
          this.particles.add({ x: bm.x, y: bm.y, life: 0.3, color: '#fff', shape: 'ring', size: 6 });
          if (p.inv <= 0 && Math.abs(p.x - bm.x) < 24 && Math.abs(p.y - 10 - bm.y) < 24) this.hurt(Math.sign(p.x - bm.x) || 1);
          continue;
        }
        if (p.inv <= 0 && Math.abs(p.x - bm.x) < 9 && Math.abs(p.y - 10 - bm.y) < 12) { b.bombs.splice(i, 1); this.hurt(Math.sign(p.x - bm.x) || 1); }
      }
      // player hits boss (must be airborne / ball)
      if (b.state !== 'dying' && b.flash <= 0 && p.hurtT <= 0 && Math.abs(p.x - b.x) < 18 && p.y - 10 > b.y - 24 && p.y - 10 < b.y + 18) {
        if (!p.grounded) {
          b.hp--; b.flash = 0.6; b.st = 0; b.state = 'patrol'; b.dir = Math.sign(b.x - p.x) || 1;
          p.vy = -260; p.vx = -Math.sign(b.x - p.x) * 120; p.canDouble = true;
          A.sfx('bossHit'); CH.doShake(4, 0.3); this.hitstopT = 0.08;
          this.particles.burst(b.x, b.y, 14, { color: ['#fff', '#e8dcc0', '#5a5a66'], speed: 100, life: 0.5 });
          this.particles.text(b.x, b.y - 30, b.hp > 0 ? 'HIT!' : 'K.O.!', '#fff');
          if (b.hp > 0) { b.taunt = 2; b.tauntText = this.bossTaunts[2]; this.score += 500; }
          else { b.state = 'dying'; b.st = 0; this.score += 2000; A.stop(0.3); }
        } else if (p.inv <= 0) this.hurt(Math.sign(p.x - b.x) || 1);
      }
      if (b.state === 'patrol' && b.taunt <= 0 && CH.chance(dt * 0.15)) { b.taunt = 2.5; b.tauntText = CH.pick([this.bossTaunts[0], this.bossTaunts[1], this.bossTaunts[3]]); }
    }
    victory() {
      this.phase = 'victory';
      this.p.state = 'victory'; this.p.vx = 0;
      A.play('victory', 0.2);
      this.showMsg('MAN EGG DEFEATED!', 3);
      this.run(this.victoryCo());
    }
    *victoryCo() {
      yield 1.2;
      this.particles.text(this.p.x, this.p.y - 30, 'ZONE CLEAR!', '#f5c33b');
      yield 1.3;
      this.showMsg('BONUS: ' + (this.rings_n * 100), 3);
      A.sfx('coin');
      yield 1.5;
      if (this.crashArmed && !this.crashed) this.triggerCrash();
      else if (this.opts.onFinish && !this.capped) { this.capped = true; this.opts.onFinish(this); }
    }
    triggerCrash() {
      this.crashed = true;
      if (this.opts.onCrash) this.opts.onCrash(this);
    }
    // ---- draw --------------------------------------------------------------------------------------
    draw(g) {
      const cx = Math.round(this.cam.x), cy = Math.round(this.cam.y);
      this.drawBackground(g, cx, cy);
      g.save(); g.translate(-cx, -cy);
      // tiles (visible range)
      const c0 = Math.max(0, Math.floor(cx / T) - 1), c1 = Math.min(COLS - 1, Math.ceil((cx + W) / T) + 1);
      const r0 = Math.max(0, Math.floor(cy / T) - 1), r1 = Math.min(ROWS - 1, Math.ceil((cy + H) / T) + 1);
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const v = this.grid[r][c];
        if (!v) continue;
        if (v === 2) { g.drawImage(tileImg('plat'), c * T, r * T); continue; }
        const above = r > 0 ? this.grid[r - 1][c] : 0;
        g.drawImage(tileImg(above === 1 ? 'dirt' : 'grass'), c * T, r * T);
        if (c > 0 && !this.grid[r][c - 1]) g.drawImage(tileImg('edgeL'), c * T, r * T);
        if (c < COLS - 1 && !this.grid[r][c + 1]) g.drawImage(tileImg('edgeR'), c * T, r * T);
      }
      // decorations
      for (const d of this.decos) { if (d.x < cx - 20 || d.x > cx + W + 20) continue; this.drawDeco(g, d); }
      // checkpoints
      for (const c of this.checks) { gfx.rect(c.x - 1, c.y - 26, 2, 26, '#888'); gfx.ellipse(c.x, c.y - 28, 4, 4, c.hit ? '#d13c3c' : '#3b6fd6'); if (c.hit) gfx.px(c.x - 1, c.y - 29, '#fff'); }
      // springs
      for (const s of this.springs) { const comp = s.t > 0 ? Math.round(s.t * 12) : 0; gfx.rect(s.x - 8, s.y - 4, 16, 4, '#8a1d1d'); gfx.rect(s.x - 7, s.y - 8 + comp, 14, 5 - comp, '#d13c3c'); gfx.rect(s.x - 5, s.y - 9 + comp, 10, 1, '#f5c33b'); gfx.rect(s.x - 6, s.y - 5, 2, 1, '#fff'); }
      // monitors
      for (const m of this.monitors) {
        if (m.broken) { if (m.t > 0) { gfx.rect(m.x - 7, m.y + 10, 14, 6, '#555'); } else gfx.rect(m.x - 7, m.y + 12, 14, 4, '#555'); continue; }
        gfx.rect(m.x - 8, m.y, 16, 16, '#4a4a58'); gfx.rect(m.x - 6, m.y + 2, 12, 9, '#222'); gfx.ellipse(m.x, m.y + 6, 3, 3, '#f5c33b'); gfx.ellipse(m.x, m.y + 6, 1.5, 1.5, '#222'); gfx.rect(m.x - 6, m.y + 13, 12, 2, '#888');
      }
      // rings
      const rt = this.t * 8;
      for (const r of this.rings) { if (r.got || r.x < cx - 16 || r.x > cx + W + 16) continue; const ph = Math.abs(Math.cos(rt + r.x * 0.05)); const rx = Math.max(1, Math.round(5 * ph)); gfx.ellipseOutline(r.x, r.y, rx, 5, '#f5c33b'); if (rx > 3) gfx.ellipseOutline(r.x, r.y, rx - 1, 4, '#fff8c0'); }
      for (const s of this.scattered) { const ph = Math.abs(Math.cos(rt * 1.5 + s.t * 10)); gfx.ellipseOutline(s.x, s.y, Math.max(1, Math.round(5 * ph)), 5, s.t > s.life - 1 && Math.sin(s.t * 30) > 0 ? '#fff' : '#f5c33b'); }
      // enemies
      for (const e of this.enemies) {
        if (!e.alive || e.x < cx - 30 || e.x > cx + W + 30) continue;
        if (e.kicked) { g.save(); g.translate(Math.round(e.x), Math.round(e.y) - 5); g.rotate(e.rot); drawLadybug(g, 0, 5, { flip: e.vx > 0, frame: 0, kicked: true }); g.restore(); }
        else drawLadybug(g, e.x, e.y, { flip: e.flip, frame: e.frame });
      }
      // boss
      if (this.boss && !this.boss.gone) {
        const b = this.boss;
        for (const bm of b.bombs) { gfx.ellipse(bm.x, bm.y, 5, 6, '#e8dcc0'); gfx.ellipse(bm.x - 1, bm.y - 2, 2, 2, '#fff'); gfx.rect(bm.x - 1, bm.y - 8, 2, 3, '#333'); if (Math.sin(bm.t * 40) > 0) gfx.px(bm.x, bm.y - 9, '#f5c33b'); }
        drawManEgg(g, b.x, b.y, { t: b.t, flash: b.flash > 0 && Math.sin(b.flash * 40) > 0, laugh: b.laugh > 0 });
        if (b.taunt > 0 && b.tauntText) { const w = gfx.textWidth(b.tauntText, 'small') + 8; gfx.rrect(b.x - w / 2, b.y - 46, w, 11, 3, '#fff'); gfx.rect(b.x - 1, b.y - 35, 3, 2, '#fff'); gfx.text(b.tauntText, b.x, b.y - 43, '#222', { align: 'center', font: 'small' }); }
        // boss HP
        for (let i = 0; i < 3; i++) gfx.rect(b.x - 10 + i * 7, b.y - 30, 6, 3, i < b.hp ? '#d13c3c' : '#333');
      }
      // player
      const p = this.p;
      if (!(p.inv > 0 && Math.floor(this.t * 20) % 2 === 0)) {
        drawHedgehog(g, p.x, p.y, { flip: p.flip, state: p.state, frame: p.frame, speed: Math.abs(p.vx), rot: p.rot, sx: p.sx, sy: p.sy });
        if (p.spinT > 0) { g.globalAlpha = p.spinT; gfx.ellipseOutline(p.x, p.y - 10, 12, 12, '#fff'); g.globalAlpha = 1; }
      }
      // speed lines
      if (Math.abs(p.vx) > 190 && p.grounded) for (let i = 0; i < 3; i++) gfx.hline(p.x - Math.sign(p.vx) * (14 + i * 6), p.y - 6 - i * 5, 5, 'rgba(255,255,255,0.5)');
      this.particles.draw(g);
      g.restore();
      // water at bottom (foreground shimmer)
      const wy = LVL_H - cy + 8;
      if (wy < H) { gfx.rect(0, wy, W, H - wy, '#2f7fd6'); for (let x = 0; x < W; x += 12) gfx.hline(x + ((Math.floor(this.t * 10) + x / 12) % 3) * 4, wy + 1, 6, '#8fd0ff'); }
      this.drawHud(g);
      if (this.phase === 'title') this.drawTitle(g);
    }
    drawDeco(g, d) {
      const x = d.x, y = d.y;
      if (d.v === 0) { gfx.rect(x, y - 8, 1, 8, '#3ec26a'); gfx.ellipse(x, y - 10, 3, 3, '#f5c33b'); gfx.ellipse(x, y - 10, 1.5, 1.5, '#8a5028'); }
      else if (d.v === 1) { gfx.rect(x, y - 6, 1, 6, '#3ec26a'); const c = ['#d13c3c', '#f0a0b0', '#9fdcff', '#fff'][x % 4]; gfx.ellipse(x, y - 7, 2, 2, c); gfx.px(x, y - 7, '#f5c33b'); }
      else if (d.v === 2) { // totem
        gfx.rect(x - 4, y - 22, 8, 22, '#8a5028'); gfx.rect(x - 4, y - 22, 8, 2, '#d13c3c'); gfx.rect(x - 3, y - 18, 2, 2, '#f5c33b'); gfx.rect(x + 1, y - 18, 2, 2, '#f5c33b'); gfx.rect(x - 2, y - 14, 4, 1, '#3b6fd6'); gfx.rect(x - 4, y - 10, 8, 2, '#3ec26a'); gfx.rect(x - 3, y - 6, 2, 2, '#fff'); gfx.rect(x + 1, y - 6, 2, 2, '#fff');
      } else { // palm tree
        gfx.rect(x - 1, y - 34, 3, 34, '#c28048'); for (let i = 0; i < 34; i += 6) gfx.hline(x - 1, y - i - 3, 3, '#8a5028');
        for (const [dx, dy] of [[-10, -4], [10, -4], [-6, -9], [6, -9], [0, -11]]) gfx.ellipse(x + dx, y - 34 + dy, 6, 3, '#3ec26a');
        gfx.ellipse(x - 2, y - 34, 2, 2, '#8a5028'); gfx.ellipse(x + 2, y - 33, 2, 2, '#8a5028');
      }
    }
    drawBackground(g, cx, cy) {
      // sky
      gfx.vgrad(0, 0, W, H, ['#2f7fd6', '#4f9ff0', '#6fb8ff', '#8fd0ff', '#b8e4ff', '#d8f0ff']);
      // sun
      gfx.ellipse(400 - cx * 0.02, 40 - cy * 0.1, 14, 14, '#fff8c0'); gfx.ellipse(400 - cx * 0.02, 40 - cy * 0.1, 11, 11, '#fff');
      // clouds
      for (let i = 0; i < 8; i++) { const x = CH.wrap(i * 160 + 40 - cx * 0.15 + this.t * 4, W + 120) - 60, y = 20 + (i % 3) * 22 - cy * 0.1; gfx.ellipse(x, y, 14, 5, '#fff'); gfx.ellipse(x - 8, y + 2, 9, 4, '#fff'); gfx.ellipse(x + 10, y + 2, 10, 4, '#fff'); }
      // far mountains
      for (let i = 0; i < 7; i++) { const x = CH.wrap(i * 150 - cx * 0.25, W + 200) - 100, y = 150 - cy * 0.25; gfx.tri(x - 70, y + 60, x + 70, y + 60, x, y, '#7a5ab0'); gfx.tri(x - 12, y + 20, x + 12, y + 20, x, y, '#fff'); }
      // checkered hills (classic)
      const hy = 190 - cy * 0.4;
      for (let i = 0; i < 6; i++) { const x = CH.wrap(i * 180 - cx * 0.4, W + 260) - 130; gfx.ellipse(x, hy + 40, 90, 44, '#2fa25a'); }
      gfx.rect(0, hy + 40, W, H, '#2fa25a');
      // checker pattern on hills
      for (let y = hy - 4; y < H; y += 8) { const off = (Math.floor((y - hy) / 8) & 1) * 8; for (let x = -16 + off - (cx * 0.4 % 16); x < W; x += 16) { if (y > hy + 40 - Math.abs(Math.sin(x * 0.01)) * 30) gfx.rect(Math.round(x), Math.round(y), 8, 8, '#25834a'); } }
      // nearer trees layer
      for (let i = 0; i < 10; i++) { const x = CH.wrap(i * 110 + 30 - cx * 0.6, W + 100) - 50, y = 236 - cy * 0.6; gfx.rect(x - 1, y - 20, 3, 20, '#8a5028'); gfx.ellipse(x, y - 24, 10, 6, '#1f7a3f'); gfx.ellipse(x - 4, y - 28, 6, 4, '#1f7a3f'); }
    }
    drawHud(g) {
      const col = '#f5c33b', sh = '#7a4a10';
      gfx.text('RINGS', 10, 8, col, { shadow: sh }); gfx.text(String(this.rings_n), 52, 8, this.rings_n === 0 && Math.sin(this.t * 8) > 0 ? '#d13c3c' : '#fff', { shadow: sh });
      gfx.text('TIME', 10, 18, col, { shadow: sh }); gfx.text(Math.floor(this.time / 60) + ':' + CH.pad2(Math.floor(this.time % 60)), 52, 18, '#fff', { shadow: sh });
      gfx.text('SCORE', 10, 28, col, { shadow: sh }); gfx.text(String(this.score), 52, 28, '#fff', { shadow: sh });
      // lives
      g.save(); g.translate(14, H - 6); g.scale(0.6, 0.6); drawHedgehog(g, 0, 0, { state: 'idle' }); g.restore();
      gfx.text('x' + this.lives, 24, H - 14, '#fff', { shadow: sh });
      if (this.msgT > 0) { const a = Math.min(1, this.msgT); g.globalAlpha = a; gfx.text(this.msg, W / 2, 60, '#fff', { align: 'center', outline: '#2749a3' }); g.globalAlpha = 1; }
      if (this.phase === 'play' && this.time < 5) { gfx.text('ARROWS: RUN   Z/SPACE: JUMP   JUMP AGAIN: DOUBLE JUMP', W / 2, H - 14, '#fff', { align: 'center', outline: '#2749a3', font: 'small' }); }
      if (this.opts.hint && this.time < 12 && this.time > 5) { gfx.text('RUN INTO LADYBUGS AT FULL SPEED TO KICK THEM!', W / 2, H - 14, '#fff', { align: 'center', outline: '#2749a3', font: 'small' }); }
    }
    drawTitle(g) {
      const t = this.titleT;
      const a = Math.min(1, t / 0.5);
      g.globalAlpha = 0.6 * a; gfx.rect(0, 0, W, H, '#123'); g.globalAlpha = 1;
      // logo: big hedgehog + text with drop shadow
      const ly = 70 + Math.round(Math.sin(t * 2) * 2);
      g.save(); g.translate(W / 2 - 100, ly + 60); g.scale(3, 3); drawHedgehog(g, 0, 0, { state: 'idle', frame: 0 }); g.restore();
      g.save(); g.translate(W / 2 + 30, ly); g.scale(3, 3);
      gfx.text('BLUE', 0, 0, '#3b6fd6', { align: 'center', outline: '#fff' }); gfx.text('HEDGEHOG', 0, 11, '#3b6fd6', { align: 'center', outline: '#fff' });
      g.restore();
      gfx.text('GREEN HILLS ZONE', W / 2 + 30, ly + 80, '#f5c33b', { align: 'center', shadow: '#7a4a10' });
      gfx.text('ACT 1', W / 2 + 30, ly + 92, '#fff', { align: 'center', shadow: '#7a4a10' });
      if (t > 1.2 && Math.sin(t * 5) > 0) gfx.text('PRESS JUMP TO START', W / 2, H - 40, '#fff', { align: 'center', shadow: '#000' });
      gfx.text('© 1991 SEGO', W / 2, H - 20, '#aaa', { align: 'center', font: 'small' });
    }
    // render to an offscreen canvas (used by TV zoom & TV preview)
    render(ctx) { gfx.pushTarget(ctx); this.draw(ctx); gfx.popTarget(); }
  }
  CH.HedgehogScene = HedgehogScene;

  // ---- TV ZOOM transition ------------------------------------------------------------------------
  class TVZoomScene extends CH.Scene {
    // dir: 1 = zoom in (cabin -> game), -1 = zoom out
    constructor(cabin, game, dir, onDone, dur = 1.5) {
      super();
      this.cabin = cabin; this.game = game; this.dir = dir; this.onDone = onDone; this.dur = dur;
      this.cabinCanvas = gfx.makeCanvas(W, H); this.gameCanvas = gfx.makeCanvas(W, H);
      this.p = 0; this.done = false;
    }
    enter() { A.sfx(this.dir > 0 ? 'tvOn' : 'tvOff'); }
    update(dt) {
      this.p += dt / this.dur;
      // keep cabin lightly animated
      this.cabin.locked = true; this.cabin.update(dt * 0.5);
      if (this.p >= 1) { this.p = 1; if (!this.done) { this.done = true; this.onDone(); } }
    }
    draw(g) {
      const k = this.dir > 0 ? CH.ease.inOutCubic(this.p) : 1 - CH.ease.inOutCubic(this.p);
      // render both
      const cc = this.cabinCanvas.getContext('2d'); cc.setTransform(1, 0, 0, 1, 0, 0);
      this.cabin.drawTo(cc);
      const gc = this.gameCanvas.getContext('2d'); gc.setTransform(1, 0, 0, 1, 0, 0);
      this.game.render(gc);
      const R0 = this.cabin.tvScreenRect(); R0.x -= Math.round(this.cabin.cam.x);
      const R = { x: CH.lerp(R0.x, 0, k), y: CH.lerp(R0.y, 0, k), w: CH.lerp(R0.w, W, k), h: CH.lerp(R0.h, H, k) };
      const s = R.w / R0.w;
      g.imageSmoothingEnabled = false;
      g.drawImage(this.cabinCanvas, R.x - R0.x * s, R.y - R0.y * s, W * s, H * s);
      g.drawImage(this.gameCanvas, R.x, R.y, R.w, R.h);
      // TV glow edge
      if (k < 1) { g.globalAlpha = (1 - k) * 0.4; gfx.frame(R.x - 1, R.y - 1, R.w + 2, R.h + 2, '#88ccff'); g.globalAlpha = 1; }
      // scanlines fade in with zoom
      g.globalAlpha = 0.15 * k; for (let y = 0; y < H; y += 2) gfx.hline(0, y, W, '#000'); g.globalAlpha = 1;
    }
  }
  CH.TVZoomScene = TVZoomScene;

  // helper on cabin: draw into an arbitrary ctx
  CH.CabinScene.prototype.drawTo = function (ctx) { gfx.pushTarget(ctx); this.draw(ctx); gfx.popTarget(); };

  // Entry: start the game-in-game from the cabin
  CH.startHedgehog = (cabin) => {
    const game = new HedgehogScene({ hint: true, onCrash: (hh) => CH.crashSequence(hh, cabin) });
    cabin.tvMode = 'game';
    CH.lastHedgehog = game;
    CH.hedgehogPreview = (g, x, y, w, h) => { const c = CH.hedgehogPreview.canvas || (CH.hedgehogPreview.canvas = gfx.makeCanvas(W, H)); if (!game.frozen || !CH.hedgehogPreview.rendered) { game.render(c.getContext('2d')); CH.hedgehogPreview.rendered = game.frozen; } g.drawImage(c, x, y, w, h); };
    CH.game.push(new TVZoomScene(cabin, game, 1, () => { CH.game.set(game); }, 1.6));
  };
  // Reverse: crash → zoom out → emergency
  CH.crashSequence = (game, cabin) => {
    game.frozen = true;
    const s = new CH.Scene();
    s.run((function* () {
      A.stop(0.1);
      yield 0.4;
      A.sfx('crash'); A.sfx('glass'); CH.doShake(10, 1.0); fx.doFlash(0.5, '#fff');
      yield 0.9;
      A.sfx('thud'); CH.doShake(5, 0.5);
      yield 0.6;
      CH.game.set(new TVZoomScene(cabin, game, -1, () => { CH.game.set(cabin); if (CH.beginEmergency) CH.beginEmergency(cabin); }, 1.3));
    })());
    s.draw = (g) => { game.render(g); };
    CH.game.set(s);
  };

  CH.SCENES.hedgehog = () => new HedgehogScene({ skipTitle: false, crash: false, hint: true });
})(window.CH);
