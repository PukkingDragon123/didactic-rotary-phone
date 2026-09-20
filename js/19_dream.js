// ============================================================================
// THE DREAM - the game opens inside Chubby's head, where he is fast.
//
// Three acts: a flat-out run through a dream world of ladybugs and egg
// minions, a long fall down a shaft when the floor gives way, and a boss
// fight in the scientist's lab against MAN EGG, who cannot be hurt by
// anything except his own head hitting a wall.
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, fx = CH.fx, art = CH.art, A = CH.audio, inp = CH.input;
  const W = CH.W, H = CH.H;

  const GROUND = 206;          // floor of the title card
  // the lab act runs on the arcade game's numbers so the controls never change
  const ACC = 620, DEC = 1500, FRIC = 700, TOP = 210, AIR = 420;
  const GRAV = 980;
  const JUMP = -330;
  const DJUMP = -300;
  const HEARTS = 5;            // he is dreaming; the dream is on his side
  const TRAP_X = 104 * 16;     // where the arcade floor gives way

  // ---- dream palette ---------------------------------------------------------
  const P = {
    sky0: '#2a1550', sky1: '#5a1f6e', sky2: '#a8336b', sky3: '#e86a5a', sky4: '#f6b45c',
    hill0: '#3c1a5c', hill1: '#571f74', hill2: '#7a2a84',
    ground0: '#2a1040', ground1: '#4a1a60', grass0: '#39d6a0', grass1: '#1f9d78', grass2: '#14705a',
    lab0: '#0d1020', lab1: '#161b31', lab2: '#232a46', labLit: '#3a4670',
    yolk: '#f7b32b', yolkL: '#ffd766', white: '#f6f1e2', shell: '#ece1c6', shellD: '#bda981',
  };

  const M = {
    steel: art.mat('#7d8497', { dark: -34, light: 30 }),
    pipe: art.mat('#4a5170', { dark: -26, light: 34 }),
    minion: art.mat('#e8dcc0', { dark: -32, light: 18 }),
    arm: art.mat('#8d94a8', { dark: -36, light: 32 }),
  };

  // ---- egg minion ------------------------------------------------------------
  function drawMinion(g, x, y, t, hurt) {
    art.shadow(Math.round(x), Math.round(y) + 1, 7, 0.3);
    art.blit(x, y, 34, 38, 17, 32, () => {
      const X = (v) => 17 + v, Y = (v) => 32 + v;
      const E = (cx, cy, rx, ry, c) => gfx.ellipse(X(cx), Y(cy), rx, ry, c);
      const R = (x0, y0, x1, y1, c) => gfx.rect(X(Math.min(x0, x1)), Y(Math.min(y0, y1)), Math.abs(x1 - x0) + 1, Math.abs(y1 - y0) + 1, c);
      const f = (c) => (hurt ? '#fff' : c);
      const step = Math.sin(t * 12) * 2;
      // legs
      R(-5 + step, -4, -3 + step, 0, f('#4a4a58'));
      R(3 - step, -4, 5 - step, 0, f('#4a4a58'));
      E(-4 + step, 0, 2.6, 1.4, f('#2f2f3c'));
      E(4 - step, 0, 2.6, 1.4, f('#2f2f3c'));
      // egg shell body
      E(0, -12, 9, 12, f(M.minion.d));
      E(0, -12.6, 8.4, 11.4, f(M.minion.base));
      E(-3, -17, 3.4, 4, f(M.minion.l));
      // riveted band
      R(-8, -9, 8, -7, f('#9aa0b4'));
      for (let i = -3; i <= 3; i++) gfx.px(X(i * 2.5), Y(-8), f('#6a7088'));
      // single angry eye
      E(1, -15, 4.2, 4, f('#f4f4f8'));
      E(2.2, -15, 2, 2.2, '#c8352b');
      E(2.4, -15, 1, 1.2, '#2a1018');
      gfx.px(X(1.4), Y(-16.4), '#fff');
      gfx.line(X(-3), Y(-19.6), X(5.5), Y(-18), '#4a4050');
      gfx.line(X(-3), Y(-18.6), X(5.5), Y(-17), '#4a4050');
      // little antenna
      R(-1, -25, 0, -22, f('#6a7088'));
      E(-0.5, -26, 1.6, 1.6, Math.sin(t * 9) > 0 ? '#ff5a4a' : '#8a2a22');
    });
  }

  // ---- run-act scenery -------------------------------------------------------
  CH.drawEggMinion = drawMinion;

  // canvas filters give a real gaussian; if this browser has none we fall back
  // to a downscale-and-stretch, which is the same trick at lower quality
  const CAN_BLUR = (() => {
    try { const c = document.createElement('canvas').getContext('2d'); c.filter = 'blur(2px)'; return c.filter === 'blur(2px)'; } catch (e) { return false; }
  })();

  function paintDreamSky(g, camX, t) {
    gfx.vgrad(0, 0, W, H, [P.sky0, P.sky0, P.sky1, P.sky2, P.sky3, P.sky4]);
    // stars fading toward the horizon
    for (let i = 0; i < 70; i++) {
      const sx = ((i * 97) - camX * 0.04) % (W + 40);
      const sy = (i * 37) % 120;
      const a = 0.25 + ((i * 13) % 7) / 10;
      gfx.px(sx < 0 ? sx + W + 40 : sx, sy, 'rgba(255,255,255,' + a.toFixed(2) + ')');
    }
    // impossible ringed planet
    const px0 = W - 96 - camX * 0.03;
    gfx.circle(px0, 54, 22, '#f2c18a');
    gfx.circle(px0 - 7, 48, 16, '#f6d6ad');
    gfx.ellipseOutline(px0, 56, 34, 8, '#e0a070');
    gfx.ellipseOutline(px0, 56, 30, 6, '#f0c090');
    // fat dream clouds
    for (let i = 0; i < 7; i++) {
      const cx = CH.wrap(i * 150 - camX * 0.16, W + 200) - 100;
      const cy = 40 + (i % 3) * 26;
      const a = 0.5 - (i % 3) * 0.1;
      const c = 'rgba(255,190,220,' + a.toFixed(2) + ')';
      gfx.ellipse(cx, cy, 30, 10, c);
      gfx.ellipse(cx - 14, cy + 3, 18, 7, c);
      gfx.ellipse(cx + 16, cy + 4, 20, 8, c);
    }
    // looping track silhouettes, the dream's idea of a race course
    for (let i = 0; i < 4; i++) {
      const lx = CH.wrap(i * 420 - camX * 0.34, W + 500) - 220;
      gfx.ellipseOutline(lx, 150, 62, 54, P.hill0);
      gfx.ellipseOutline(lx, 150, 58, 50, P.hill0);
    }
    // rolling hills
    for (let L = 0; L < 2; L++) {
      const sp = L ? 0.5 : 0.28;
      const col = L ? P.hill2 : P.hill1;
      const base = 190 + L * 8;
      for (let i = -1; i < 7; i++) {
        const hx = CH.wrap(i * 120 - camX * sp, W + 260) - 130;
        gfx.ellipse(hx, base, 78 - L * 14, 40 - L * 8, col);
      }
    }
  }

  function paintDreamGround(g, camX) {
    // checkerboard turf the way a dream remembers a green hill
    gfx.rect(0, GROUND, W, H - GROUND, P.ground1);
    gfx.rect(0, GROUND, W, 7, P.grass1);
    gfx.rect(0, GROUND, W, 3, P.grass0);
    const off = Math.floor(camX) % 32;
    for (let x = -off - 32; x < W + 32; x += 32) {
      const cell = Math.floor((x + camX) / 16) & 1;
      gfx.rect(x, GROUND + 7, 16, 10, cell ? P.grass2 : P.grass1);
      gfx.rect(x + 16, GROUND + 7, 16, 10, cell ? P.grass1 : P.grass2);
    }
    gfx.rect(0, GROUND + 17, W, H - GROUND - 17, P.ground0);
    for (let x = -off; x < W + 32; x += 32) {
      gfx.rect(x + 4, GROUND + 22, 10, 3, '#3a1550');
      gfx.rect(x + 20, GROUND + 32, 7, 3, '#3a1550');
    }
  }

  // ---- the lab ---------------------------------------------------------------
  const LAB_FLOOR = 214;
  const LAB_L = 26, LAB_R = W - 26;   // the walls he can be rammed into

  function paintLab(g, t, shake) {
    gfx.rect(0, 0, W, H, P.lab0);
    // back wall panels
    for (let x = 0; x < W; x += 60) {
      gfx.rect(x + 2, 22, 56, LAB_FLOOR - 26, P.lab1);
      gfx.rect(x + 2, 22, 56, 2, P.lab2);
      gfx.rect(x + 2, LAB_FLOOR - 6, 56, 2, '#0a0c18');
      for (let i = 0; i < 3; i++) gfx.px(x + 6, 30 + i * 5, '#39406a');
    }
    // pipes running along the top
    for (let i = 0; i < 3; i++) {
      const py = 30 + i * 11;
      gfx.rect(0, py, W, 5, M.pipe.d);
      gfx.rect(0, py, W, 2, M.pipe.base);
      for (let x = 14; x < W; x += 74) { gfx.rect(x, py - 2, 7, 9, M.pipe.l); gfx.rect(x + 1, py - 1, 5, 7, M.pipe.base); }
    }
    // monitor bank showing egg diagrams
    for (let i = 0; i < 3; i++) {
      const mx = 58 + i * 128, my = 74;
      gfx.rect(mx - 2, my - 2, 68, 46, '#0a0c16');
      gfx.rect(mx, my, 64, 42, i === 1 ? '#0e2a1c' : '#0c1830');
      const on = Math.sin(t * 3 + i) > -0.7;
      if (on) {
        gfx.ellipse(mx + 32, my + 20, 12, 16, i === 1 ? '#1f7a4a' : '#1d3f78');
        gfx.ellipse(mx + 28, my + 14, 5, 6, i === 1 ? '#2ea868' : '#2a5aa8');
        for (let k = 0; k < 4; k++) gfx.rect(mx + 5, my + 6 + k * 5, 10 + ((k * 7 + i) % 9), 2, '#3ecf6a');
        gfx.text(['EGG', 'YOLK', 'SHELL'][i], mx + 52, my + 4, '#3ecf6a', { align: 'right', font: 'small' });
      }
      g.save(); g.globalAlpha = 0.14;
      for (let yy = 0; yy < 42; yy += 2) gfx.rect(mx, my + yy, 64, 1, '#000');
      g.restore();
    }
    // yolk vats bubbling either side
    for (const vx of [18, W - 46]) {
      gfx.rect(vx, 128, 28, 62, P.lab2);
      gfx.rect(vx + 2, 130, 24, 58, '#1a1430');
      const lvl = 150 + Math.sin(t * 1.4 + vx) * 2;
      gfx.rect(vx + 3, lvl, 22, 188 - lvl, P.yolk);
      gfx.rect(vx + 3, lvl, 22, 2, P.yolkL);
      for (let i = 0; i < 3; i++) {
        const k = (t * 0.5 + i * 0.33 + vx * 0.01) % 1;
        gfx.circle(vx + 8 + i * 6, 186 - k * (186 - lvl), 1.5, 'rgba(255,240,180,0.6)');
      }
      gfx.rect(vx - 2, 124, 32, 5, M.steel.d);
      gfx.rect(vx - 2, 124, 32, 2, M.steel.base);
    }
    // warning strobes
    const strobe = Math.sin(t * 7) > 0;
    for (const lx of [W / 2 - 96, W / 2 + 88]) {
      gfx.rect(lx - 5, 20, 10, 6, '#2a2030');
      gfx.ellipse(lx, 24, 4, 3, strobe ? '#ff4a3a' : '#6a221c');
      if (strobe) art.lightPool(lx, 30, 30, 22, '#ff3020', 0.2);
    }
    // floor: grated steel with a hazard stripe
    gfx.rect(0, LAB_FLOOR, W, H - LAB_FLOOR, '#1c2136');
    gfx.rect(0, LAB_FLOOR, W, 3, '#2d3550');
    for (let x = 0; x < W; x += 10) gfx.rect(x, LAB_FLOOR + 5, 6, H - LAB_FLOOR - 5, '#161a2c');
    for (let x = -10; x < W; x += 14) gfx.tri(x, H - 8, x + 8, H - 8, x + 4, H - 2, '#3a3250');
    // the two walls he rams
    for (const [wx, dir] of [[LAB_L, -1], [LAB_R, 1]]) {
      gfx.rect(wx + (dir < 0 ? -26 : 0), 20, 26, LAB_FLOOR - 20, P.lab2);
      gfx.rect(wx + (dir < 0 ? -26 : 0), 20, 26, 3, P.labLit);
      for (let y = 30; y < LAB_FLOOR - 6; y += 16) {
        gfx.rect(wx + (dir < 0 ? -22 : 4), y, 18, 12, P.lab1);
        gfx.rect(wx + (dir < 0 ? -22 : 4), y, 18, 2, '#2c3352');
      }
    }
    // the light of the place: two cold ceiling cones and a warm one on the vats
    art.lightCone(W / 2 - 96, 26, 16, 120, LAB_FLOOR - 26, '#4a6aa8', 0.1);
    art.lightCone(W / 2 + 88, 26, 16, 120, LAB_FLOOR - 26, '#4a6aa8', 0.1);
    art.lightPool(32, 150, 46, 40, '#c08a20', 0.12);
    art.lightPool(W - 32, 150, 46, 40, '#c08a20', 0.12);
  }

  // ---- MAN EGG with the robotic arm -----------------------------------------
  // cracks: 0..3, and at 3 he is finished.
  function drawBoss(g, b, t) {
    const hurt = b.flash > 0 && Math.sin(b.flash * 50) > 0;
    const x = Math.round(b.x), y = Math.round(b.y);
    const f = (c) => (hurt ? '#fff' : c);

    // the robotic arm, drawn behind the pod so it reads as mounted on the back
    const ax = x + b.armSide * 16, ay = y - 6;
    const ex = b.armX, ey = b.armY;
    // elbow: the joint lifts above the straight line so it bends like a limb
    const mx = (ax + ex) / 2 + b.armSide * 6;
    const my = (ay + ey) / 2 - 22 - Math.abs(ex - ax) * 0.08;
    const bez = (k) => {
      const u = 1 - k;
      return [u * u * ax + 2 * u * k * mx + k * k * ex, u * u * ay + 2 * u * k * my + k * k * ey];
    };
    const segs = 5;
    for (let i = 0; i < segs; i++) {
      const k0 = i / segs, k1 = (i + 1) / segs;
      const [x0, y0] = bez(k0);
      const [x1, y1] = bez(k1);
      const w0 = 10 - i * 1.3;
      const dx0 = x1 - x0, dy0 = y1 - y0, len = Math.hypot(dx0, dy0) || 1;
      const nx = (-dy0 / len) * w0 * 0.5, ny = (dx0 / len) * w0 * 0.5;
      gfx.tri(x0 - nx, y0 - ny, x0 + nx, y0 + ny, x1 + nx, y1 + ny, f(M.arm.d));
      gfx.tri(x0 - nx, y0 - ny, x1 - nx, y1 - ny, x1 + nx, y1 + ny, f(M.arm.d));
      gfx.tri(x0 - nx * 0.6, y0 - ny * 0.6, x1 - nx * 0.6, y1 - ny * 0.6, x1 + nx * 0.1, y1 + ny * 0.1, f(M.arm.base));
      gfx.ellipse(x1, y1, w0 * 0.62, w0 * 0.62, f(M.arm.d));
      gfx.ellipse(x1 - 0.5, y1 - 0.8, w0 * 0.42, w0 * 0.42, f(M.arm.l));
    }
    // claw
    const cs = b.armOpen;
    for (const s of [-1, 1]) {
      gfx.tri(ex + s * 2, ey - 3, ex + s * 2, ey + 3, ex + s * (7 + cs * 5), ey + (cs > 0.5 ? -9 : 7), f(M.arm.base));
      gfx.tri(ex + s * 3, ey - 2, ex + s * 3, ey + 2, ex + s * (6 + cs * 5), ey + (cs > 0.5 ? -7 : 5), f(M.arm.l));
    }
    gfx.ellipse(ex, ey, 4.5, 4.5, f(M.arm.d));
    gfx.ellipse(ex - 0.6, ey - 0.8, 3, 3, f(M.arm.base));
    gfx.px(ex + 1, ey - 1, '#ff5a4a');

    // hover pod
    const bob = Math.sin(t * 2.2) * 1.5;
    art.blit(x, y + 26 + bob, 84, 96, 42, 92, () => {
      const X = (v) => 42 + v, Y = (v) => 92 + v;
      const E = (cx, cy, rx, ry, c) => gfx.ellipse(X(cx), Y(cy), rx, ry, c);
      const R = (x0, y0, x1, y1, c) => gfx.rect(X(Math.min(x0, x1)), Y(Math.min(y0, y1)), Math.abs(x1 - x0) + 1, Math.abs(y1 - y0) + 1, c);
      // pod
      E(0, -6, 26, 12, f('#4e5573'));
      E(0, -8, 24, 10, f('#6a7290'));
      E(-8, -12, 10, 4, f('#868fad'));
      R(-24, -6, 24, 0, f('#3f4560'));
      E(-14, -9, 3.4, 2, '#f5c33b');
      E(14, -9, 3.4, 2, '#c8352b');
      // the egg himself
      const eggY = -34;
      E(0, eggY, 17, 23, f(P.shellD));
      E(0, eggY - 1, 16, 22, f(P.shell));
      E(-6, eggY - 9, 6, 8, f('#f8f2e2'));
      // cracks earned by ramming walls
      const cracks = [
        [[-8, -14], [-3, -8], [-7, -2], [-1, 3]],
        [[9, -16], [4, -9], [10, -4], [5, 2]],
        [[-2, -22], [2, -14], [-3, -7], [3, 0], [-2, 7]],
      ];
      for (let c = 0; c < b.cracks; c++) {
        const pts = cracks[c];
        for (let i = 0; i < pts.length - 1; i++) {
          gfx.line(X(pts[i][0]), Y(eggY + pts[i][1]), X(pts[i + 1][0]), Y(eggY + pts[i + 1][1]), '#6a5a40');
          gfx.line(X(pts[i][0]), Y(eggY + pts[i][1] + 1), X(pts[i + 1][0]), Y(eggY + pts[i + 1][1] + 1), '#a8977a');
        }
      }
      // goggles shoved up on the dome
      R(-13, eggY - 17, 13, eggY - 13, f('#2f2c3c'));
      E(-6, eggY - 15, 4.6, 3.4, f('#4a86e8'));
      E(6, eggY - 15, 4.6, 3.4, f('#4a86e8'));
      gfx.px(X(-7.4), Y(eggY - 16.4), '#bfe0ff');
      // eyes
      const angry = b.state === 'charge' || b.state === 'wind';
      E(-5.5, eggY - 7, 4.4, angry ? 3 : 3.8, f('#fdfaf2'));
      E(5.5, eggY - 7, 4.4, angry ? 3 : 3.8, f('#fdfaf2'));
      const lk = CH.clamp((b.lookAt - b.x) / 60, -1, 1) * 1.4;
      E(-5.5 + lk, eggY - 6.6, 1.8, 2, '#1a1420');
      E(5.5 + lk, eggY - 6.6, 1.8, 2, '#1a1420');
      gfx.px(X(-4.4 + lk), Y(eggY - 7.6), '#fff');
      gfx.px(X(6.6 + lk), Y(eggY - 7.6), '#fff');
      // furious brows
      for (const s of [-1, 1]) {
        gfx.line(X(s * 11), Y(eggY - 11 - (angry ? 0 : 1)), X(s * 2), Y(eggY - 8.5), '#5a3a1a');
        gfx.line(X(s * 11), Y(eggY - 10 - (angry ? 0 : 1)), X(s * 2), Y(eggY - 7.5), '#5a3a1a');
      }
      // the mustache
      E(0, eggY - 1, 14, 3.4, '#6a4420');
      E(-8, eggY - 1.8, 7, 3.2, '#5a3a1a');
      E(8, eggY - 1.8, 7, 3.2, '#5a3a1a');
      E(-15, eggY - 3.4, 3.4, 2, '#5a3a1a');
      E(15, eggY - 3.4, 3.4, 2, '#5a3a1a');
      // mouth
      if (b.state === 'stun') { E(0, eggY + 5, 4, 3.4, '#5a1a1a'); E(0, eggY + 6, 2.6, 1.8, '#c85a6a'); }
      else if (angry) { gfx.tri(X(-5), Y(eggY + 7), X(5), Y(eggY + 7), X(0), Y(eggY + 3), '#5a1a1a'); }
      else R(-3.5, eggY + 4, 3.5, eggY + 5, '#5a1a1a');
      // little arms
      R(-22, eggY + 6, -16, eggY + 9, f(P.shell));
      E(-23, eggY + 8, 2.8, 2.8, f('#f4f4f8'));
    }, { flip: false });

    // jets under the pod
    for (let i = -1; i <= 1; i += 2) {
      const fl = 4 + Math.sin(t * 30 + i) * 2 + (b.state === 'charge' ? 6 : 0);
      gfx.tri(x + i * 12 - 4, y + 26 + bob, x + i * 12 + 4, y + 26 + bob, x + i * 12, y + 26 + bob + fl * 2, '#e8752c');
      gfx.tri(x + i * 12 - 2, y + 26 + bob, x + i * 12 + 2, y + 26 + bob, x + i * 12, y + 26 + bob + fl, '#ffe27a');
    }
    art.lightPool(x, y + 40 + bob, 34, 12, '#ff8a30', 0.22);
  }

  // ============================================================================
  // The scene
  // ============================================================================
  class DreamScene extends CH.Scene {
    constructor(opts = {}) {
      super();
      this.name = 'dream';
      this.opts = opts;
      this.phase = 'title';     // title | run | fall | land | boss | win | wake
      this.pt = 0;              // time in phase
      this.particles = new CH.Particles();
      this.camX = 0;
      this.shake = 0;
      this.hitstop = 0;
      this.msg = ''; this.msgT = 0;
      this.rings = 0;
      this.burst = null;        // {x, y, text, t, life}
      this.flashT = 0;

      // the runner: the lab act moves on the same numbers as the arcade game
      this.p = { x: 60, y: GROUND, vx: 0, vy: 0, grounded: true, canDouble: true, inv: 0, hurt: 0, roll: 0, coyote: 0, buffer: 0, jumpHeld: false, flip: false };

      // act 1 is the arcade game itself, hosted inside the dream
      this.hh = null;

      // boss
      this.boss = null;
      this.hearts = HEARTS;
    }

    enter() {
      fx.scanlines = false;
      fx.vignette = 0.5;
      fx.letterboxTarget = 1;   // cinematic bars, lifted for the playable acts
      A.play('hedgehog');
    }
    exit() {
      if (this.hh) { this.hh.exit(); this.hh = null; }
      fx.scanlines = false; fx.vignette = 0; fx.letterboxTarget = 0;
    }

    say(text, dur = 2) { this.msg = String(text).replace(/\{[a-z]+\}/g, ' '); this.msgT = dur; }
    pop(x, y, text, opts = {}) {
      x = CH.clamp(x, 60, W - 60); y = CH.clamp(y, 40, H - 50);
      this.burst = { x, y, text, t: 0, life: opts.life || 0.8, r: opts.r || 40, fill: opts.fill || '#ffd84a', textColor: opts.textColor || '#c8352b', scale: opts.scale || 2 };
      this.hitstop = opts.stop === undefined ? 0.08 : opts.stop;
      this.shake = Math.max(this.shake, opts.shake || 4);
    }

    // ---- update -------------------------------------------------------------
    update(dt) {
      if (this.hitstop > 0) { this.hitstop -= dt; this.particles.update(dt * 0.2); return; }
      this.particles.update(dt);
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 22);
      if (this.msgT > 0) this.msgT -= dt;
      if (this.flashT > 0) this.flashT -= dt;
      if (this.burst) { this.burst.t += dt; if (this.burst.t > this.burst.life) this.burst = null; }
      this.pt += dt;
      const f = this['update_' + this.phase];
      if (f) f.call(this, dt);
    }
    go(phase) {
      this.phase = phase; this.pt = 0;
      // bars for the cutscene beats, none while the player is in control
      fx.letterboxTarget = (phase === 'run' || phase === 'boss') ? 0 : 1;
      if (phase !== 'run' && this.hh) { this.hh.exit(); this.hh = null; fx.scanlines = false; fx.vignette = 0.55; }
    }

    // ---- act 0: the title card ---------------------------------------------
    update_title(dt) {
      if (this.pt > 2.4 || inp.hit('jump') || inp.hit('confirm') || inp.hit('interact') || inp.mpressed) {
        inp.eat();
        this.startRun();
      }
    }

    // ---- act 1: he dreams he is inside his own favourite game ---------------
    // Same level, same physics, same controls as the arcade cabinet: this IS
    // the Blue Hedgehog scene, running inside the dream with the floor rigged.
    startRun() {
      this.go('run');
      const self = this;
      this.hh = new CH.HedgehogScene({
        skipTitle: true,
        crash: false,
        noBoss: true,
        hint: false,
        trapAt: TRAP_X,
        onTrapStart() {
          self.pop(W / 2, 96, 'A TRAP!', { r: 40, scale: 1.8, fill: '#ff8a4a', shake: 8, stop: 0.12 });
          fx.letterboxTarget = 1;
        },
        onTrap(hh) {
          self.rings = hh.rings_n;
          self.go('fall');
          self.fallV = 40; self.fallY = 0;
          A.sfx('whoosh');
        },
      });
      // his dream remembers the ladybugs; it adds the egg's little helpers
      for (const tx of [30, 56, 74, 89, 101]) this.hh.addFoe(tx, 'minion');
      this.hh.enter();
      // a dream is not a CRT: the arcade's scanlines come off and the haze goes on
      fx.scanlines = false;
      fx.vignette = 0.55;
      this.say('RUN. {p}JUMP ON THINGS.', 2.6);
    }

    // the hosted scene is not on the scene stack, so the dream drives its clock
    update_run(dt) {
      const hh = this.hh;
      if (!hh) return;
      hh.t += dt;
      hh.update(dt);
      hh.updateCos(dt);
      // a step up is a wall until you jump it, so say so if he stalls on one
      if (Math.abs(hh.p.x - (this.lastX || 0)) > 6) { this.lastX = hh.p.x; this.stuckT = 0; }
      else {
        this.stuckT = (this.stuckT || 0) + dt;
        if (this.stuckT > 2.5 && this.msgT <= 0) { this.say('HOLD JUMP TO GET OVER IT.', 2.4); this.stuckT = 0; }
      }
    }

    // ---- act 2: the fall -----------------------------------------------------
    update_fall(dt) {
      this.fallV = Math.min(900, this.fallV + 900 * dt);
      this.fallY = (this.fallY || 0) + this.fallV * dt;
      this.p.roll += dt * 9;
      if (this.pt > 2.6) {
        this.go('land');
        A.sfx('thud'); A.sfx('crash');
        this.shake = 9;
        fx.doFlash(0.6, '#fff');
        this.particles.burst(W / 2, LAB_FLOOR, 26, { color: ['#7d8497', '#cfd6e8'], speed: 130, life: 0.8 });
        this.pop(W / 2, LAB_FLOOR - 30, 'THUD!', { r: 44, scale: 2, shake: 9, stop: 0.16 });
      }
    }

    // ---- act 2b: the landing beat -------------------------------------------
    update_land(dt) {
      if (this.pt > 1.9) {
        this.startBoss();
      }
    }

    startBoss() {
      this.go('boss');
      this.p.x = W / 2; this.p.y = LAB_FLOOR; this.p.vx = 0; this.p.vy = 0; this.p.inv = 1;
      this.hearts = HEARTS;
      this.boss = {
        x: W / 2, y: 92, vx: 0, cracks: 0, state: 'idle', t: 0, flash: 0,
        armX: W / 2 + 26, armY: 96, armSide: 1, armOpen: 0, lookAt: W / 2,
        dir: 1, chargeSpeed: 0, stunT: 0, rage: 0, deadT: 0, shock: null,
      };
      A.play('boss');
      this.say('He charges. {p}He never looks where he is going.', 3.4);
      fx.showCard('MAN EGG', 'the doctor will see you now', 2.2, '#f7b32b');
    }

    // ---- act 3: the boss -----------------------------------------------------
    update_boss(dt) {
      const p = this.p, b = this.boss;
      this.movePlayer(dt);

      if (b.state === 'dead') { this.updateBossDeath(dt); return; }

      b.t += dt;
      b.flash = Math.max(0, b.flash - dt);
      b.lookAt = p.x;
      const rage = b.cracks;            // 0..2 while alive: he gets faster
      // arm follows the pod unless an attack is driving it
      if (b.state !== 'arm' && b.state !== 'slam') {
        b.armSide = p.x > b.x ? 1 : -1;
        b.armX = CH.approach(b.armX, b.x + b.armSide * 34, dt * 90);
        b.armY = CH.approach(b.armY, 86 + Math.sin(b.t * 2) * 4, dt * 70);
        b.armOpen = CH.approach(b.armOpen, 0.2, dt * 2);
      }

      switch (b.state) {
        case 'idle': {
          // drift over the player, then pick an attack. He mostly charges,
          // because charging is the thing that ends badly for him.
          b.x = CH.approach(b.x, CH.clamp(p.x, LAB_L + 40, LAB_R - 40), dt * 30);
          if (b.t > Math.max(1, 1.7 - rage * 0.2)) {
            b.t = 0;
            if (Math.random() < 0.76) { b.state = 'wind'; b.dir = p.x > b.x ? 1 : -1; A.sfx('boss'); }
            else { b.state = 'arm'; b.armOpen = 1; A.sfx('beep'); }
          }
          break;
        }
        case 'wind': {
          // telegraph: he pulls back away from the direction he will charge,
          // long enough to read and walk out of
          b.x -= b.dir * dt * 40;
          b.target = p.x;
          if (b.t > Math.max(0.8, 1.15 - rage * 0.12)) {
            b.t = 0; b.state = 'charge';
            b.chargeSpeed = 230 + rage * 40;
            A.sfx('whoosh');
          }
          break;
        }
        case 'charge': {
          b.x += b.dir * b.chargeSpeed * dt;
          this.particles.add({ x: b.x - b.dir * 18, y: b.y + CH.rand(-14, 20), vx: -b.dir * 60, vy: CH.rand(-10, 10), life: 0.3, color: 'rgba(255,255,255,0.5)', size: 1, grav: 0, drag: 0.95 });
          // the pod rides high, so only a jump into it catches you
          if (p.inv <= 0 && Math.abs(b.x - p.x) < 24 && p.y - 26 < b.y + 28 && p.y - 12 > b.y - 40) {
            this.hitPlayer();
            b.state = 'idle'; b.t = 0;
            break;
          }
          // he never pulls up: every charge ends in the wall
          if ((b.dir > 0 && b.x > LAB_R - 30) || (b.dir < 0 && b.x < LAB_L + 30)) {
            b.x = b.dir > 0 ? LAB_R - 30 : LAB_L + 30;
            this.bonk();
          }
          break;
        }
        case 'stun': {
          b.stunT -= dt;
          b.y = CH.approach(b.y, 108, dt * 40);
          if (Math.random() < dt * 8) this.particles.steam(b.x + CH.rand(-10, 10), b.y - 46, 1, 'rgba(255,255,255,0.4)');
          if (b.stunT <= 0) { b.state = 'idle'; b.t = 0; b.y = 92; b.armY = 86; }
          break;
        }
        case 'arm': {
          // the claw rises, then hammers down where the player is standing
          b.armOpen = CH.approach(b.armOpen, 1, dt * 4);
          b.armX = CH.approach(b.armX, p.x, dt * 150);
          b.armY = CH.approach(b.armY, 56, dt * 160);
          if (b.t > 1.2) { b.t = 0; b.state = 'slam'; b.slamX = b.armX; A.sfx('boss'); }
          break;
        }
        case 'slam': {
          b.armOpen = CH.approach(b.armOpen, 0, dt * 8);
          b.armY += dt * 620;
          b.armX = CH.approach(b.armX, b.slamX, dt * 120);
          if (b.armY >= LAB_FLOOR - 6) {
            b.armY = LAB_FLOOR - 6;
            A.sfx('explode');
            this.pop(b.armX, LAB_FLOOR - 26, 'SLAM!', { r: 34, scale: 1.5, shake: 7, fill: '#ff8a4a' });
            this.particles.burst(b.armX, LAB_FLOOR, 18, { color: ['#7d8497', '#ffd0a0'], speed: 120, life: 0.6, angle: -Math.PI / 2, spread: 2.4 });
            b.shock = { x: b.armX, r: 6, life: 0.9 };
            b.state = 'idle'; b.t = 0;
          }
          break;
        }
      }

      // the shockwave rolls outward along the floor
      if (b.shock) {
        b.shock.r += dt * 150;
        b.shock.life -= dt;
        if (p.inv <= 0 && p.grounded && Math.abs(Math.abs(p.x - b.shock.x) - b.shock.r) < 8) this.hitPlayer();
        if (b.shock.life <= 0) b.shock = null;
      }
      b.x = CH.clamp(b.x, LAB_L + 30, LAB_R - 30);
    }

    // exactly the arcade game's feel: run-up, skid, variable jump, double jump
    movePlayer(dt) {
      const p = this.p;
      const ax = inp.axisX();
      if (ax !== 0) {
        if (p.grounded) {
          if (Math.sign(p.vx) !== 0 && Math.sign(p.vx) !== ax && Math.abs(p.vx) > 60) p.vx += ax * DEC * dt;
          else p.vx += ax * ACC * dt;
        } else p.vx += ax * AIR * dt;
        p.flip = ax < 0;
      } else if (p.grounded) p.vx = CH.approach(p.vx, 0, FRIC * dt);
      else p.vx = CH.approach(p.vx, 0, 60 * dt);
      p.vx = CH.clamp(p.vx, -TOP, TOP);

      if (inp.hit('jump') || inp.hit('up')) p.buffer = 0.1; else p.buffer -= dt;
      if (p.grounded) { p.coyote = 0.09; p.canDouble = true; } else p.coyote -= dt;
      if (p.buffer > 0) {
        if (p.coyote > 0) { p.vy = JUMP; p.grounded = false; p.coyote = 0; p.buffer = 0; p.jumpHeld = true; A.sfx('jump'); }
        else if (p.canDouble) {
          p.vy = DJUMP; p.canDouble = false; p.buffer = 0; p.jumpHeld = true; A.sfx('djump');
          this.particles.burst(p.x, p.y - 12, 8, { color: ['#3b6fd6', '#fff', '#9fdcff'], speed: 70, life: 0.35, shape: 'spark' });
        }
      }
      if (!inp.down('jump') && p.jumpHeld && p.vy < -120) { p.vy = -120; p.jumpHeld = false; }
      if (!inp.down('jump')) p.jumpHeld = false;

      p.vy += GRAV * dt; if (p.vy > 420) p.vy = 420;
      p.x = CH.clamp(p.x + p.vx * dt, LAB_L + 8, LAB_R - 8);
      if (p.x <= LAB_L + 8 || p.x >= LAB_R - 8) p.vx = 0;
      p.y += p.vy * dt;
      if (p.y >= LAB_FLOOR) {
        if (!p.grounded && p.vy > 200) this.particles.burst(p.x, LAB_FLOOR, 5, { color: ['#cfd6e8'], speed: 45, grav: 300, life: 0.3, angle: -Math.PI / 2, spread: 2.2 });
        p.y = LAB_FLOOR; p.vy = 0; p.grounded = true; p.canDouble = true;
      }
      if (p.inv > 0) p.inv -= dt;
      if (p.hurt > 0) p.hurt -= dt;
    }

    hitPlayer() {
      const p = this.p;
      p.inv = 2;
      this.hearts--;
      A.sfx('hurt');
      this.pop(p.x, p.y - 30, 'OW!', { r: 28, scale: 1.3, fill: '#ff8a7a', shake: 6 });
      p.vy = -190; p.vx = (p.x < this.boss.x ? -1 : 1) * 150;
      if (this.hearts <= 0) {
        // dream logic: you never lose, you just get your breath back. The
        // cracks you already put in him stay cracked.
        this.hearts = HEARTS;
        this.boss.state = 'stun'; this.boss.stunT = 2; this.boss.t = 0;
        p.x = W / 2;
        this.say('Get up. {p}He is still dizzy.', 2.4);
        fx.doFlash(0.5, '#ffd0d0');
        A.sfx('sad');
      }
    }

    bonk() {
      const b = this.boss;
      b.cracks++;
      b.flash = 0.5;
      b.state = 'stun';
      b.stunT = 2.6;
      A.sfx('crash'); A.sfx('bossHit'); A.sfx('glass');
      this.pop(b.x, b.y - 46, b.cracks >= 3 ? 'CRRRACK!' : 'BONK!', { r: 52, scale: 2.2, shake: 10, stop: 0.22, fill: '#fff0a0' });
      fx.doFlash(0.5, '#fff');
      this.particles.burst(b.x + (b.dir > 0 ? 20 : -20), b.y - 34, 22, { color: [P.shell, P.shellD, '#fff'], speed: 130, life: 0.8 });
      this.particles.burst(b.x, b.y - 30, 10, { color: ['#7d8497'], speed: 80, life: 0.5 });
      if (b.cracks >= 3) {
        b.state = 'dead'; b.deadT = 0;
        A.play(null);
      } else {
        this.say(b.cracks === 1 ? 'MY SHELL! {p}Two more like that.' : 'HOW DARE YOU. AGAIN?!', 2);
      }
    }

    // ---- the egg loses ------------------------------------------------------
    updateBossDeath(dt) {
      const b = this.boss;
      b.deadT += dt;
      b.y = CH.approach(b.y, 120, dt * 26);
      b.x += Math.sin(b.deadT * 22) * 1.4;
      if (Math.random() < dt * 14) {
        this.particles.burst(b.x + CH.rand(-14, 14), b.y - 34 + CH.rand(-16, 16), 2, { color: [P.shell, '#fff'], speed: 50, life: 0.5 });
      }
      if (b.deadT > 1.5 && !b.exploded) {
        b.exploded = true;
        A.sfx('explode'); A.sfx('splash'); A.sfx('crash');
        this.hitstop = 0.3;
        this.shake = 14;
        fx.doFlash(1, '#fff6d0');
        this.pop(b.x, b.y - 40, 'SPLAT!', { r: 70, scale: 3, shake: 14, stop: 0.3, fill: '#ffe06a', textColor: '#c8352b' });
        // raw egg: yolk, white and shell everywhere
        this.particles.burst(b.x, b.y - 30, 60, { color: [P.yolk, P.yolkL, '#ffe9a8'], speed: 200, life: 1.6, size: 2, shape: 'circle' });
        this.particles.burst(b.x, b.y - 30, 40, { color: ['#fdf8ea', '#eee6d2'], speed: 150, life: 1.4, size: 2, shape: 'circle' });
        this.particles.burst(b.x, b.y - 30, 34, { color: [P.shell, P.shellD, '#8a7a58'], speed: 240, life: 1.8, size: 1 });
        this.splats = [];
        for (let i = 0; i < 16; i++) {
          this.splats.push({ x: CH.rand(20, W - 20), y: CH.rand(40, H - 20), r: CH.rand(5, 16), t: 0, yolk: Math.random() < 0.45 });
        }
      }
      if (this.splats) for (const s of this.splats) s.t = Math.min(1, s.t + dt * 3);
      if (b.deadT > 4.2) this.go('win');
    }

    update_win(dt) {
      if (this.pt > 2.6) {
        this.go('wake');
        A.stop(0.4);
        A.sfx('alarm');
      }
    }

    update_wake(dt) {
      if (this.pt > 2.2 && !this.left) {
        this.left = true;
        const done = this.opts.onDone;
        CH.game.runGlobal((function* () {
          yield fx.fadeOut(0.7, '#fff');
          if (done) done();
          else CH.game.set(new CH.CabinScene({ mode: 'intro' }));
          yield fx.fadeIn(0.9);
        })());
      }
    }

    // ---- draw ---------------------------------------------------------------
    // The whole dream is painted into a buffer first so the haze can be laid
    // over the finished frame instead of over each piece of it.
    draw(g) {
      const buf = this._buf || (this._buf = gfx.makeCanvas(W, H));
      const bc = buf.getContext('2d');
      bc.setTransform(1, 0, 0, 1, 0, 0);
      bc.clearRect(0, 0, W, H);
      gfx.pushTarget(bc);
      const sh = this.shake;
      bc.save();
      if (sh > 0) bc.translate(Math.round(CH.rand(-sh, sh)), Math.round(CH.rand(-sh, sh)));
      const f = this['draw_' + this.phase];
      if (f) f.call(this, bc);
      bc.restore();
      this.drawOverlay(bc);
      gfx.popTarget();
      this.dreamHaze(g, buf);
    }

    // how soft the frame gets: playable acts stay readable, cutscenes swim
    hazeAmt() {
      return (this.phase === 'run' || this.phase === 'boss') ? 0.2 : 0.3;
    }

    dreamHaze(g, buf) {
      const soft = this._soft || (this._soft = gfx.makeCanvas(W, H));
      const sc = soft.getContext('2d');
      sc.setTransform(1, 0, 0, 1, 0, 0);
      sc.clearRect(0, 0, W, H);
      if (CAN_BLUR) {
        sc.save(); sc.filter = 'blur(3px)'; sc.drawImage(buf, 0, 0); sc.restore();
      } else {
        const sm = this._small || (this._small = gfx.makeCanvas(W >> 2, H >> 2));
        const mc = sm.getContext('2d');
        mc.imageSmoothingEnabled = true;
        mc.clearRect(0, 0, sm.width, sm.height);
        mc.drawImage(buf, 0, 0, sm.width, sm.height);
        sc.imageSmoothingEnabled = true;
        sc.drawImage(sm, 0, 0, W, H);
      }
      const breathe = 0.5 + Math.sin(this.t * 0.9) * 0.5;
      const amt = this.hazeAmt();
      g.save();
      g.imageSmoothingEnabled = true;
      g.drawImage(buf, 0, 0);
      // the sharp frame, seen through a blurred copy of itself
      g.globalAlpha = amt + breathe * 0.06;
      g.drawImage(soft, 0, 0);
      // a slow drift on the soft copy gives the edges a swimming fringe
      g.globalAlpha = 0.07;
      g.drawImage(soft, Math.sin(this.t * 0.7) * 2, Math.cos(this.t * 0.5) * 2);
      g.drawImage(soft, -Math.sin(this.t * 0.7) * 2, -Math.cos(this.t * 0.5) * 2);
      // only a whisper of bloom: enough for highlights to breathe, not to blow out
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.07 + breathe * 0.04;
      g.drawImage(soft, 0, 0);
      // a wash that rolls between lilac and warm pink. The lab keeps most of
      // its darkness: a washed-out dungeon just looks like fog.
      const wash = (this.phase === 'run' || this.phase === 'title') ? 1 : 0.45;
      g.globalCompositeOperation = 'source-over';
      g.globalAlpha = (0.07 + breathe * 0.03) * wash;
      gfx.rect(0, 0, W, H, '#6a3f9a', g);
      g.globalAlpha = (0.05 + (1 - breathe) * 0.03) * wash;
      gfx.rect(0, 0, W, H, '#ff9ad0', g);
      // clouds of haze drifting across, never in the same place twice
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 3; i++) {
        const x = ((this.t * (7 + i * 4) + i * 190) % (W + 200)) - 100;
        const y = 54 + Math.sin(this.t * 0.4 + i * 2) * 46 + i * 24;
        const r = 72 + i * 26;
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, 'rgba(255,214,245,0.07)');
        gr.addColorStop(1, 'rgba(255,214,245,0)');
        g.globalAlpha = 1;
        g.fillStyle = gr;
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      }
      g.restore();
    }

    drawRunner(g, x, y, opts = {}) {
      const p = this.p;
      // never hide the player outright: flicker him translucent instead, so he
      // is always findable on screen
      const blink = p.inv > 0 && Math.sin(p.inv * 40) > 0;
      if (blink) g.save(), (g.globalAlpha = 0.35);
      const spin = opts.spin;
      if (spin) {
        // tucked and rolling, the way a dream remembers running fast
        g.save();
        g.translate(Math.round(x), Math.round(y - 16));
        g.rotate(p.roll);
        CH.drawChubby(g, 0, 16, { face: 'determined', arm: 'belly', noShadow: true, sx: 0.92, sy: 0.92 });
        g.restore();
        if (blink) g.restore();
        return;
      }
      CH.drawChubby(g, x, y, Object.assign({
        walk: this.t * 26, moving: 1, face: p.hurt > 0 ? 'shock' : 'determined',
        quillTilt: 1, arm: 'idle', sx: 1 + (opts.stretch || 0), sy: 1 - (opts.stretch || 0),
      }, opts.p || {}));
      if (blink) g.restore();
    }

    draw_title(g) {
      paintDreamSky(g, 0, this.t);
      paintDreamGround(g, 0);
      const k = CH.ease.outCubic(Math.min(1, this.pt / 0.7));
      g.save();
      g.globalAlpha = k;
      gfx.text('A DREAM', W / 2, 96, '#fff6d0', { align: 'center', outline: '#5a1f6e' });
      g.restore();
      g.save(); g.translate(W / 2, 128); g.scale(2, 2);
      gfx.text('CHUBBY IS FAST', 0, 0, '#ffd84a', { align: 'center', outline: '#5a1f6e' });
      g.restore();
      CH.drawChubby(g, W / 2, 200, { face: 'happy', walk: this.t * 20, moving: 1, quillTilt: 1 });
      if (this.pt > 1.2) gfx.text('press JUMP', W / 2, 232, '#ffd0f0', { align: 'center', font: 'small' });
    }

    draw_run(g) {
      if (this.hh) this.hh.draw(g);
    }

    draw_fall(g) {
      // a shaft rushing upward past him
      gfx.rect(0, 0, W, H, '#0b0a16');
      const sc = this.fallY || 0;
      for (let L = 0; L < 3; L++) {
        const sp = 0.4 + L * 0.5;
        const col = ['#171430', '#221d44', '#2e2758'][L];
        const step = 54 + L * 16;
        for (let i = -1; i < H / step + 2; i++) {
          const y = CH.wrap(i * step - sc * sp, H + step * 2) - step;
          gfx.rect(10 + L * 30, y, 40 - L * 6, step * 0.5, col);
          gfx.rect(W - 50 - L * 30 + L * 6, y + step * 0.3, 40 - L * 6, step * 0.5, col);
        }
      }
      // cables and pipes whipping past
      for (let i = 0; i < 8; i++) {
        const y = CH.wrap(i * 74 - sc * 1.25, H + 80) - 40;
        gfx.rect(0, y, W, 3, '#3a3468');
        gfx.rect(0, y, W, 1, '#564e90');
        gfx.rect(60 + (i % 4) * 90, y - 5, 10, 12, '#4a4278');
      }
      art.speedLines(W / 2, 0, 0, 0);
      for (let i = 0; i < 16; i++) {
        const x = (i * 53) % W;
        const y = CH.wrap(i * 40 - sc * 2.2, H + 60) - 30;
        gfx.rect(x, y, 1, 22, 'rgba(255,255,255,0.35)');
      }
      // him, tumbling. He falls in as the hedgehog and lands as himself:
      // the dream cannot keep the costume on once the ground goes.
      const k = Math.min(1, this.pt / 0.4);
      const y = 70 + Math.sin(this.pt * 2) * 12;
      const MORPH = 1.1;
      g.save();
      g.translate(W / 2, y);
      g.rotate(this.pt * 7);
      if (this.pt < MORPH) CH.drawHedgehog(g, 0, 16, { state: 'ball', frame: this.pt * 20, noShadow: true });
      else CH.drawChubby(g, 0, 16, { face: 'scared', arm: 'both_up', noShadow: true });
      g.restore();
      if (this.pt >= MORPH && !this.morphed) {
        this.morphed = true;
        A.sfx('djump');
        this.particles.burst(W / 2, y + 8, 22, { color: ['#fff', '#9fdcff', '#ffd0f0'], speed: 110, life: 0.6, shape: 'spark' });
        this.particles.add({ x: W / 2, y: y + 8, life: 0.4, color: '#fff', shape: 'ring', size: 6 });
      }
      this.particles.draw(g);
      if (this.pt > MORPH + 0.2) {
        const bx = W / 2 + 46, by = y - 16;
        art.bubble(bx - 22, by - 16, 50, 15, bx - 14, by + 2, { kind: 'shout' });
        gfx.text('AAAAAA', bx + 2, by - 12, '#c8352b', { align: 'center' });
      }
      g.save(); g.globalAlpha = 0.25 * k; gfx.rect(0, 0, W, H, '#000'); g.restore();
    }

    draw_land(g) {
      paintLab(g, this.t, this.shake);
      // dust still settling
      CH.drawChubby(g, W / 2, LAB_FLOOR, { face: this.pt > 1 ? 'shock' : 'dead', arm: 'pocket', sx: this.pt < 0.4 ? 1.3 : 1, sy: this.pt < 0.4 ? 0.7 : 1 });
      this.particles.draw(g);
      if (this.pt > 0.9) {
        gfx.text('...where.', W / 2, 60, '#cfd6e8', { align: 'center' });
      }
    }

    draw_boss(g) {
      paintLab(g, this.t, this.shake);
      const b = this.boss;
      // the shockwave along the floor
      if (b && b.shock) {
        for (const s of [-1, 1]) {
          const x = b.shock.x + s * b.shock.r;
          const a = CH.clamp(b.shock.life, 0, 1);
          g.save(); g.globalAlpha = a;
          gfx.tri(x - 6 * s, LAB_FLOOR, x + 6 * s, LAB_FLOOR, x, LAB_FLOOR - 16, '#ffd0a0');
          gfx.tri(x - 3 * s, LAB_FLOOR, x + 3 * s, LAB_FLOOR, x, LAB_FLOOR - 10, '#fff6d0');
          g.restore();
        }
      }
      if (b && !b.exploded) drawBoss(g, b, this.t);
      else if (b) this.drawWreck(g, b);
      // the charge telegraph: a line on the floor showing where he is coming
      if (b && b.state === 'wind') {
        const a = 0.35 + Math.sin(this.t * 30) * 0.2;
        g.save(); g.globalAlpha = a;
        const stop = b.dir > 0 ? LAB_R : LAB_L;
        const x0 = Math.min(b.x, stop), x1 = Math.max(b.x, stop);
        gfx.rect(x0, b.y + 4, x1 - x0, 2, '#ff4a3a');
        gfx.rect(stop - 1, b.y - 6, 3, 14, '#ff4a3a');
        g.restore();
        // the wall he is about to introduce himself to
        g.save(); g.globalAlpha = 0.35 + Math.sin(this.t * 26) * 0.25;
        gfx.rect(b.dir > 0 ? stop : stop - 26, 22, 26, LAB_FLOOR - 24, '#ff4a3a');
        g.restore();
        art.impactLines(b.x, b.y - 30, 6, 26, 34, { color: '#ff4a3a', thick: 1, rot: this.t * 3 });
      }
      this.drawRunner(g, this.p.x, this.p.y, { spin: false, p: { face: this.hearts <= 1 ? 'scared' : 'determined', moving: Math.abs(this.p.vx) > 20 ? 1 : 0, walk: this.t * 18, arm: 'idle' } });
      this.particles.draw(g);
      // splats from the finish
      if (this.splats) this.drawSplats(g);
      // boss health as cracks, plus the player's hearts
      this.drawBossHud(g);
    }

    // nothing left but the pod, trailing smoke on its way down
    drawWreck(g, b) {
      const k = Math.min(1, (b.deadT - 1.5) * 0.7);
      const wy = b.y + 26 + k * 90;
      const wx = b.x + Math.sin(k * 7) * 10;
      g.save();
      g.translate(Math.round(wx), Math.round(wy));
      g.rotate(k * 2.4);
      gfx.ellipse(0, -6, 26, 12, '#3a3f58');
      gfx.ellipse(0, -8, 24, 10, '#565e7c');
      gfx.rect(-24, -6, 48, 6, '#2f3448');
      gfx.ellipse(-14, -9, 3.4, 2, '#8a6a20');
      gfx.ellipse(14, -9, 3.4, 2, '#7a2018');
      // torn arm stub
      gfx.rect(10, -14, 16, 6, '#6a7288');
      gfx.tri(26, -14, 26, -8, 34, -12, '#565e7c');
      g.restore();
      if (Math.random() < 0.5) this.particles.steam(wx + CH.rand(-8, 8), wy - 10, 1, 'rgba(90,90,110,0.5)');
      if (Math.random() < 0.3) this.particles.burst(wx, wy - 8, 1, { color: ['#e8752c', '#ffd84a'], speed: 30, life: 0.4 });
    }

    drawSplats(g) {
      for (const s of this.splats) {
        const r = s.r * CH.ease.outBack(s.t);
        const c = s.yolk ? P.yolk : '#fdf8ea';
        gfx.ellipse(s.x, s.y, r, r * 0.78, c);
        gfx.ellipse(s.x - r * 0.3, s.y - r * 0.3, r * 0.4, r * 0.3, s.yolk ? P.yolkL : '#fff');
        for (let i = 0; i < 3; i++) {
          const a = i * 2.1 + s.x;
          gfx.ellipse(s.x + Math.cos(a) * r * 1.3, s.y + Math.sin(a) * r * 1.1, r * 0.22, r * 0.2, c);
        }
      }
    }

    drawBossHud(g) {
      const b = this.boss;
      if (!b) return;
      // hearts
      for (let i = 0; i < HEARTS; i++) {
        const x = 12 + i * 13, y = 8;
        const on = i < this.hearts;
        gfx.ellipse(x - 2, y, 2.6, 2.4, on ? '#e8496e' : '#3a3450');
        gfx.ellipse(x + 2, y, 2.6, 2.4, on ? '#e8496e' : '#3a3450');
        gfx.tri(x - 4.6, y + 1, x + 4.6, y + 1, x, y + 6, on ? '#e8496e' : '#3a3450');
        if (on) gfx.px(x - 2, y - 1, '#ff9ab4');
      }
      // his shell integrity
      const bw = 96, bx = W - bw - 10, by = 8;
      gfx.rrect(bx - 1, by - 1, bw + 2, 10, 3, art.INK);
      gfx.rrect(bx, by, bw, 8, 2, '#2a2438');
      const left = (3 - b.cracks) / 3;
      gfx.rrect(bx, by, Math.round(bw * left), 8, 2, b.cracks >= 2 ? '#e8584c' : '#f5c33b');
      gfx.text('SHELL', bx + bw / 2, by + 1, '#2a1f33', { align: 'center', font: 'small' });
    }

    draw_win(g) {
      paintLab(g, this.t, this.shake);
      this.particles.draw(g);
      if (this.splats) this.drawSplats(g);
      CH.drawChubby(g, W / 2, LAB_FLOOR, { face: 'proud', arm: 'both_up', walk: 0, moving: 0 });
      const k = CH.ease.outBack(Math.min(1, this.pt / 0.6));
      g.save(); g.translate(W / 2, 70); g.scale(2 * k, 2 * k);
      gfx.text('EGG DEFEATED', 0, 0, '#ffd84a', { align: 'center', outline: '#5a1f6e' });
      g.restore();
      if (this.pt > 1) gfx.text('rings: ' + this.rings, W / 2, 96, '#cfd6e8', { align: 'center', font: 'small' });
    }

    draw_wake(g) {
      // the dream whites out and the bedroom bleeds in as noise
      gfx.rect(0, 0, W, H, '#0b0a16');
      const k = Math.min(1, this.pt / 1.6);
      g.save(); g.globalAlpha = k; gfx.rect(0, 0, W, H, '#f6f1e2'); g.restore();
      // the alarm clock bleeds through the dream as one growing noise
      const rock = Math.sin(this.t * 40) * (1 + k * 3);
      if (this.pt > 0.25) {
        art.comicBurst(W / 2 + rock, 138, 'BRRRING!', {
          t: Math.min(1, (this.pt - 0.25) / 0.4), r: 44 + k * 34,
          fill: '#ffd84a', scale: 1.6 + k * 0.8, rot: Math.sin(this.t * 6) * 0.1,
        });
      }
      if (this.pt > 1.1) gfx.text('wake up', W / 2, 196, '#7a6a58', { align: 'center', font: 'small' });
    }

    // ---- overlay ------------------------------------------------------------
    drawOverlay(g) {
      if (this.msgT > 0 && this.msg) {
        const a = Math.min(1, this.msgT * 2);
        const w = gfx.textWidth(this.msg) + 18;
        g.save(); g.globalAlpha = a;
        gfx.rrect((W - w) / 2, H - 42, w, 15, 5, 'rgba(12,8,22,0.8)');
        gfx.text(this.msg, W / 2, H - 38, '#fff6d0', { align: 'center' });
        g.restore();
      }
      if (this.burst) {
        const b = this.burst;
        art.comicBurst(b.x, b.y, b.text, { t: b.t / b.life, r: b.r, fill: b.fill, textColor: b.textColor, scale: b.scale, rot: b.t * 2 });
      }
    }
  }
  CH.DreamScene = DreamScene;

  // ---- entry points ----------------------------------------------------------
  CH.startDream = (onDone) => { CH.game.set(new DreamScene({ onDone })); };
  CH.SCENES = CH.SCENES || {};
  CH.SCENES.dream = () => new DreamScene({});
  CH.SCENES.dreamBoss = () => { const s = new DreamScene({}); s.enter = function () { DreamScene.prototype.enter.call(this); this.startBoss(); }; return s; };
})(window.CH);
