// ============================================================================
// CHUBBY - the porcupine. Outlined, heavily shaded, and animated joint by joint.
//
// The sprite is assembled every frame into an offscreen buffer (see 08_art.js)
// so the whole silhouette gets one clean ink line. Inside that buffer the body
// is built from ellipses on a local axis: origin at the feet, +y up the screen
// is negative, and +x is always "facing right" - mirroring is done by the blit,
// so no pose has to be written twice.
//
// Proportions: ~41px from sole to the top of the head (quills go higher), with
// a head about a fifth of that. He is a ball with small limbs and a head that
// is small enough to read as a teenager rather than a toddler - and the whole
// face is built around the glasses, which are the character.
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, art = CH.art;

  // ---- materials -------------------------------------------------------------
  const M = {
    fur: art.mat('#b87c50', { dark: -42, darker: -72, light: 30 }),
    muzzle: art.mat('#e0b083', { dark: -36, light: 20 }),
    quill: art.mat('#e8d3a4', { dark: -46, light: 20 }),
    hoodie: art.mat('#2f9d86', { dark: -38, light: 30 }),
    suit: art.mat('#39406b', { dark: -34, light: 30 }),
    uniform: art.mat('#c8352b', { dark: -36, light: 34 }),
    pajamas: art.mat('#6f7fbf', { dark: -34, light: 28 }),
    apron: art.mat('#7d94ad', { dark: -34, light: 26 }),
    pants: art.mat('#332c40', { dark: -22, light: 30 }),
    shoe: art.mat('#241d2e', { dark: -14, light: 34 }),
  };
  const C = {
    ink: art.INK,
    eyeW: '#fdfaf2', pupil: '#221a2c', glint: '#ffffff',
    nose: '#2a1a22', tongue: '#e0708a', teeth: '#fff8ee',
    blush: '#e08a7e', tear: '#8fd0ff', cream: '#efe1c0',
    gold: '#f2c94c', white: '#f4f1ea', red: '#c8352b',
    frame: '#1f1826',                    // the nerd frames - darker than the ink
    lens: '#cfe3e4',                     // glass, cool against the warm fur
    lensLo: '#a9c4ca',                   // glass in the lower half of the lens
    tape: '#ece2c6', tapeLo: '#c9bb9a',  // the repair on the bridge
    toothLo: '#ddcdb4',
    brow: '#4a2a12',                     // reads over the fur at actual size
  };
  CH.CHUBBY_COL = C;

  const OUTFIT_MAT = { hoodie: M.hoodie, suit: M.suit, uniform: M.uniform, janitor: M.uniform, pajamas: M.pajamas };

  // ---- expression table ------------------------------------------------------
  // brow: [innerY, outerY, thickness]  (negative Y = raised)
  // eye:  shape keyword   mouth: default mouth for the face
  const FACES = {
    normal:      { brow: [-1, -1, 1], eye: 'open',   mouth: 'flat' },
    happy:       { brow: [-2, -2, 1], eye: 'arch',   mouth: 'smile' },
    grin:        { brow: [-2, -3, 1], eye: 'open',   mouth: 'grin' },
    smug:        { brow: [-3, 0, 1],  eye: 'half',   mouth: 'smirk' },
    sad:         { brow: [-3, 1, 1],  eye: 'droop',  mouth: 'frown' },
    cry:         { brow: [-4, 2, 2],  eye: 'squint', mouth: 'wail' },
    shock:       { brow: [-4, -4, 1], eye: 'wide',   mouth: 'gape' },
    scared:      { brow: [-4, 0, 1],  eye: 'wide',   mouth: 'wobble' },
    worried:     { brow: [-3, 1, 1],  eye: 'open',   mouth: 'wobble' },
    angry:       { brow: [1, -3, 2],  eye: 'glare',  mouth: 'snarl' },
    annoyed:     { brow: [0, -2, 1],  eye: 'half',   mouth: 'flat' },
    tired:       { brow: [-1, 2, 1],  eye: 'bags',   mouth: 'flat' },
    exhausted:   { brow: [-1, 3, 1],  eye: 'bags',   mouth: 'gasp' },
    focused:     { brow: [1, -2, 1],  eye: 'narrow', mouth: 'set' },
    determined:  { brow: [2, -2, 2],  eye: 'narrow', mouth: 'set' },
    confused:    { brow: [-3, 0, 1],  eye: 'open',   mouth: 'squiggle' },
    love:        { brow: [-2, -2, 1], eye: 'heart',  mouth: 'smile' },
    dead:        { brow: [0, 0, 1],   eye: 'cross',  mouth: 'flat' },
    sleep:       { brow: [-1, 0, 1],  eye: 'shut',   mouth: 'snore' },
    proud:       { brow: [-2, -2, 1], eye: 'arch',   mouth: 'grin' },
    flat:        { brow: [0, 0, 1],   eye: 'half',   mouth: 'flat' },
  };
  CH.FACES = FACES;

  // ============================================================================
  // The renderer
  // ============================================================================
  const BW = 72, BH = 74, AX = 36, AY = 64;

  // Spike lists are authored, not generated: the silhouette is the character,
  // and a radial fan puts quills where a porcupine does not have them.
  // [baseX, baseY, tipX, tipY, baseWidth] relative to the head / body centre.
  const HEAD_QUILLS = [
    [-6.2, -5.0, -12.8, -9.8, 3.6],
    [-4.3, -7.3, -9.2, -15.2, 3.4],
    [-0.8, -8.8, -3.4, -17.4, 3.2],
    [2.7, -8.4, 1.1, -16.2, 2.8],
    [-8.1, -2.3, -14.8, -6.9, 3.1],
  ];
  const BODY_QUILLS = [
    [-6.4, -7.8, -14.6, -16.4, 4.6],
    [-9.1, -2.7, -19.1, -8.2, 4.2],
    [-9.6, 1.4, -17.3, -5.5, 3.7],
    [-2.7, -10.0, -6.4, -18.2, 3.9],
  ];

  function drawChubby(g, x, y, p = {}) {
    const t = (CH.game && CH.game.t) || 0;
    const sx = p.sx || 1, sy = p.sy || 1;
    const jig = CH.clamp(p.jig || 0, -5, 5);
    const walk = p.walk || 0, moving = p.moving || 0;
    const outfit = p.outfit || 'hoodie';
    const mat = OUTFIT_MAT[outfit] || M.hoodie;
    const sleep = !!p.sleep, sitting = !!p.sitting;
    const qt = p.quillTilt || 0;
    const arm = p.arm || 'idle';
    const specs = p.glasses !== false;

    if (!p.noShadow) {
      const sh = sitting ? 11 : 10 - Math.abs(jig) * 0.2;
      art.shadow(Math.round(x), Math.round(y) + 1, sh * sx, p.shadowAlpha !== undefined ? p.shadowAlpha : 0.3);
    }

    art.blit(x, y, BW, BH, AX, AY, () => {
      const X = (v) => AX + v * sx;
      const Y = (v) => AY + v * sy;
      const E = (cx, cy, rx, ry, c) => gfx.ellipse(X(cx), Y(cy), Math.max(0.6, rx * sx), Math.max(0.6, ry * sy), c);
      const R = (x0, y0, x1, y1, c) => {
        const ax = X(x0), bx = X(x1), ay = Y(y0), by = Y(y1);
        gfx.rect(Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax) + 1, Math.abs(by - ay) + 1, c);
      };
      const L = (x0, y0, x1, y1, c) => gfx.line(X(x0), Y(y0), X(x1), Y(y1), c);
      const T = (x0, y0, x1, y1, x2, y2, c) => gfx.tri(X(x0), Y(y0), X(x1), Y(y1), X(x2), Y(y2), c);
      const P = (x0, y0, c) => gfx.px(X(x0), Y(y0), c);

      // ---- rhythm ------------------------------------------------------------
      const step = Math.sin(walk), step2 = Math.sin(walk + Math.PI);
      const bob = Math.abs(Math.sin(walk)) * 1.5 * moving;
      const lean = moving * 1.2;
      const bodyY = (sitting ? -11 : -14) - bob;
      const bodyX = jig * 0.55 + lean * 0.4;
      const headY = bodyY - 15 - (sitting ? -1 : 0) + (p.headDY || 0) - bob * 0.35;
      const headX = bodyX + 2 + (p.headDX || 0) + lean * 0.5;
      const brx = 11.8 + jig * 0.45, bry = 10.8 - Math.abs(jig) * 0.22;
      const hr = 9.7;
      const hood = outfit === 'hoodie' || outfit === 'pajamas';

      // ---- quills ------------------------------------------------------------
      // Drawn first so the body and head sit in front of their own spikes.
      const qm = M.quill;
      function spike(ox0, oy0, tx0, ty0, w0, cx, cy, sweep) {
        const bx0 = cx + ox0, by0 = cy + oy0;
        // quills trail the body: sweeping back when moving forward
        const dx0 = tx0 - ox0 - sweep * 4.2, dy0 = ty0 - oy0 + Math.abs(sweep) * 1.5;
        const tx1 = bx0 + dx0, ty1 = by0 + dy0;
        const len = Math.hypot(dx0, dy0) || 1;
        const nx = (-dy0 / len) * w0 * 0.5, ny = (dx0 / len) * w0 * 0.5;
        T(bx0 - nx, by0 - ny, bx0 + nx, by0 + ny, tx1, ty1, qm.d);
        // lit face of the blade along its upper edge
        T(bx0 - nx * 0.9, by0 - ny * 0.9, bx0 + nx * 0.05, by0 + ny * 0.05,
          bx0 + dx0 * 0.82, by0 + dy0 * 0.82, qm.base);
        T(bx0 - nx * 0.5, by0 - ny * 0.5, bx0 - nx * 0.05, by0 - ny * 0.05,
          bx0 + dx0 * 0.6, by0 + dy0 * 0.6, qm.l);
        // dark tip
        E(bx0 + dx0 * 0.93, by0 + dy0 * 0.93, w0 * 0.2, w0 * 0.2, qm.dd);
      }
      for (const q of BODY_QUILLS) spike(q[0], q[1], q[2], q[3], q[4], bodyX, bodyY, qt);
      for (const q of HEAD_QUILLS) spike(q[0], q[1], q[2], q[3], q[4], headX, headY, qt * 0.8);

      // ---- feet --------------------------------------------------------------
      const bootie = outfit === 'hoodie' || outfit === 'pajamas';
      if (!sitting && !sleep) {
        const lift = (sv) => Math.max(0, sv) * 2.4 * moving;
        for (const [sgn, sw] of [[-1, step], [1, step2]]) {
          const fx = sgn * 4.4 + sw * 3.2 * moving;
          const fyy = -1 - lift(sw);
          E(fx, fyy, 4.1, 2.5, M.shoe.d);
          E(fx + 0.4, fyy - 1, 3.5, 1.7, bootie ? M.fur.d : M.shoe.base);
          E(fx, fyy - 1.8, 2.2, 1, bootie ? M.fur.base : M.shoe.l);
        }
      } else if (sitting) {
        E(5.6, -4.6, 4.3, 2.7, M.pants.base); E(5.6, -5.8, 3.6, 1.8, M.pants.l);
        E(-2.4, -3.8, 4.1, 2.5, M.pants.d);
        E(9.8, -3, 3.6, 2.2, M.shoe.base); E(1.8, -2.3, 3.4, 2, M.shoe.d);
      }

      // ---- back arm ----------------------------------------------------------
      const paw = outfit === 'janitor' ? M.apron : M.fur;
      const backSwing = step2 * 2.6 * moving;
      function limb(x0, y0, x1, y1, w0, matr) {
        const dx0 = x1 - x0, dy0 = y1 - y0, len = Math.hypot(dx0, dy0) || 1;
        const nx = (-dy0 / len) * w0 * 0.5, ny = (dx0 / len) * w0 * 0.5;
        T(x0 - nx, y0 - ny, x0 + nx, y0 + ny, x1 + nx, y1 + ny, matr.base);
        T(x0 - nx, y0 - ny, x1 - nx, y1 - ny, x1 + nx, y1 + ny, matr.base);
        T(x0 - nx, y0 - ny, x1 - nx, y1 - ny, x1 + nx * 0.1, y1 + ny * 0.1, matr.d);
        E((x0 + x1) / 2, (y0 + y1) / 2, w0 * 0.5, w0 * 0.5, matr.base);
      }
      function hand(hx2, hy2, r = 2.7) {
        E(hx2, hy2, r, r, paw.d);
        E(hx2 - 0.4, hy2 - 0.7, r - 0.8, r - 0.8, paw.base);
        E(hx2 - 0.9, hy2 + r * 0.55, r * 0.55, r * 0.4, paw.dd);
      }
      if (!sitting) {
        limb(bodyX - 8.5, bodyY - 4.6, bodyX - 12.6, bodyY + 3 + backSwing, 4.5, { base: mat.d, d: mat.dd });
        hand(bodyX - 13, bodyY + 4.8 + backSwing, 2.5);
      }

      // ---- body --------------------------------------------------------------
      // shoulders taper in so the silhouette is a pear, not an egg
      E(bodyX, bodyY + 1, brx, bry, mat.d);
      E(bodyX, bodyY, brx - 0.4, bry - 0.5, mat.base);
      E(bodyX - 0.5, bodyY - bry * 0.62, brx * 0.72, bry * 0.42, mat.base);
      // belly mass
      E(bodyX + 3, bodyY + 3, brx * 0.66, bry * 0.58, mat.l);
      E(bodyX + 3, bodyY + 4, brx * 0.6, bry * 0.5, mat.base);
      // top light and bottom core shadow
      E(bodyX - 3, bodyY - 5.6, brx * 0.46, bry * 0.24, mat.l);
      E(bodyX, bodyY + bry * 0.72, brx * 0.82, bry * 0.26, mat.d);

      // ---- outfit detail -----------------------------------------------------
      if (hood) {
        R(bodyX - brx + 3.5, bodyY + bry - 3.5, bodyX + brx - 3.5, bodyY + bry - 1, mat.d);
        for (let i = -3; i <= 3; i++) R(bodyX + i * 2.5, bodyY + bry - 3.5, bodyX + i * 2.5, bodyY + bry - 1, mat.dd);
      }
      if (outfit === 'hoodie') {
        E(bodyX + 2.5, bodyY + 4, 7.6, 4.2, mat.d);
        E(bodyX + 2.5, bodyY + 3.2, 7, 3.6, mat.base);
        L(bodyX - 4.4, bodyY + 1, bodyX - 3.2, bodyY + 5.2, mat.dd);
        L(bodyX + 9.2, bodyY + 1, bodyX + 8, bodyY + 5.2, mat.dd);
        const sway = Math.sin(walk * 0.5) * moving * 1.2 + jig * 0.15;
        for (const [dx0, len] of [[1.5, 7.5], [4.4, 5.6]]) {
          L(bodyX + dx0, bodyY - 7.6, bodyX + dx0 + sway, bodyY - 7.6 + len, C.cream);
          E(bodyX + dx0 + sway, bodyY - 7.1 + len, 0.9, 1.1, '#8a7a55');
        }
      } else if (outfit === 'suit') {
        const t0 = bodyY - 8.6;
        T(bodyX + 0.5, t0, bodyX + 6.6, t0, bodyX + 3.8, bodyY + 1.5, C.white);
        R(bodyX + 1.5, bodyY - 1, bodyX + 6.2, bodyY + 5.6, C.white);
        T(bodyX - 2, t0 - 1, bodyX + 3.4, t0 + 1, bodyX + 1, bodyY + 3.4, mat.l);
        T(bodyX + 9, t0 - 1, bodyX + 4.4, t0 + 1, bodyX + 6.6, bodyY + 3.4, mat.l);
        R(bodyX + 2.9, t0 + 1, bodyX + 4.8, t0 + 3, C.red);
        T(bodyX + 2.4, t0 + 3, bodyX + 5.3, t0 + 3, bodyX + 4.3, bodyY + 4.8, C.red);
        R(bodyX + 3.5, t0 + 4, bodyX + 4, bodyY + 3, gfx.shade(C.red, 26));
        E(bodyX + 3.9, bodyY + 5.2, 1.2, 1.2, C.gold);
        L(bodyX + 1.5, bodyY + 6.6, bodyX + 6.2, bodyY + 6.6, mat.dd);
      } else if (outfit === 'uniform' || outfit === 'janitor') {
        T(bodyX - 1, bodyY - 9, bodyX + 7.6, bodyY - 9, bodyX + 3.3, bodyY - 3.8, '#f5c33b');
        R(bodyX + 2.4, bodyY - 8, bodyX + 4.3, bodyY - 4.8, mat.d);
        R(bodyX - 7.6, bodyY - 4.2, bodyX - 3.3, bodyY - 1.9, C.white);
        R(bodyX - 6.6, bodyY - 3.8, bodyX - 4.2, bodyY - 3.8, C.red);
        if (outfit === 'janitor') {
          E(bodyX + 1, bodyY + 3.2, 9.2, 7.2, M.apron.base);
          E(bodyX + 1, bodyY + 4.6, 8.6, 5.9, M.apron.d);
          R(bodyX - 7.6, bodyY + 0.5, bodyX + 9.5, bodyY + 1.2, M.apron.l);
          L(bodyX - 5.2, bodyY - 3.3, bodyX - 7.6, bodyY - 8, M.apron.d);
          L(bodyX + 7.1, bodyY - 3.3, bodyX + 9, bodyY - 8, M.apron.d);
          R(bodyX + 2, bodyY + 3.8, bodyX + 7.6, bodyY + 7.6, M.apron.dd);
          R(bodyX + 3, bodyY + 2.8, bodyX + 5.8, bodyY + 3.8, '#d8d2c0');
        }
      } else if (outfit === 'pajamas') {
        for (let i = -4; i <= 4; i++) R(bodyX + i * 2.9, bodyY - 8, bodyX + i * 2.9, bodyY + 6.6, mat.l);
      }

      // ---- head --------------------------------------------------------------
      if (hood) {
        // hood shell: sits behind and above, opening toward the face
        E(headX - 2.2, headY + 0.9, hr + 2.3, hr + 1.7, mat.dd);
        E(headX - 2.6, headY, hr + 1.5, hr + 0.9, mat.base);
        E(headX - 3.8, headY - 4, hr * 0.6, hr * 0.28, mat.l);
        // the opening, a shade darker than the shell
        E(headX + 1, headY + 0.5, hr * 1.02, hr * 0.99, mat.dd);
      }
      // face ball
      E(headX + 0.8, headY + 0.9, hr * 0.96, hr * 0.94, M.fur.d);
      E(headX + 0.8, headY, hr * 0.94, hr * 0.9, M.fur.base);
      E(headX - 1.4, headY - 4.6, hr * 0.5, hr * 0.26, M.fur.l);
      // muzzle: a distinct lighter mass, not a wash over the whole face
      E(headX + 5, headY + 4.7, 5.5, 3.8, M.fur.dd);
      E(headX + 5, headY + 4.2, 5, 3.4, M.muzzle.base);
      E(headX + 4.4, headY + 3.2, 3.6, 1.6, M.muzzle.l);
      E(headX + 5, headY + 5.8, 4, 1.4, M.muzzle.d);
      if (!hood) {
        E(headX - 5.2, headY - 6.6, 2.5, 2.6, M.fur.d);
        E(headX - 5.2, headY - 6.6, 1.4, 1.5, C.blush);
      }

      // ---- headwear ----------------------------------------------------------
      const hat = p.hat || ((outfit === 'uniform' || outfit === 'janitor') ? 'visor' : null);
      if (hat === 'visor') {
        R(headX - 7, headY - 8.4, headX + 6.4, headY - 6.8, C.red);
        E(headX - 0.4, headY - 9.2, 7, 2.3, C.red);
        E(headX - 1.6, headY - 10, 3.2, 0.9, gfx.shade(C.red, 30));
        R(headX + 5.6, headY - 8, headX + 12, headY - 6.4, gfx.shade(C.red, -22));
        R(headX - 0.8, headY - 9.6, headX + 1.2, headY - 7.6, '#f5c33b');
      } else if (hat === 'hairnet') {
        gfx.ellipseOutline(X(headX), Y(headY - 5.6), 7 * sx, 3.6 * sy, 'rgba(255,255,255,0.75)');
        for (let i = -5; i <= 5; i += 2.5) gfx.px(X(headX + i), Y(headY - 7.2 + Math.abs(i) * 0.25), 'rgba(255,255,255,0.6)');
      } else if (hat === 'crown') {
        R(headX - 5.2, headY - 10.6, headX + 5.2, headY - 8.2, C.gold);
        for (const dx0 of [-4.8, 0, 4.8]) T(headX + dx0 - 1.5, headY - 10.6, headX + dx0 + 1.5, headY - 10.6, headX + dx0, headY - 14.2, C.gold);
        for (const dx0 of [-2.4, 2.4]) gfx.px(X(headX + dx0), Y(headY - 9.4), C.red);
      } else if (hat === 'toque') {
        E(headX - 0.4, headY - 7.4, 7.4, 3.8, '#c8352b');
        R(headX - 7, headY - 6.6, headX + 6.2, headY - 4.6, C.white);
        E(headX - 0.4, headY - 10.6, 2, 2, C.white);
      }

      // ---- face: brows, eyes, glasses, nose, mouth, teeth --------------------
      const fk = FACES[p.face] || FACES.normal;
      const blink = p.blink && fk.eye !== 'shut' && fk.eye !== 'cross';
      const eyeShape = sleep ? 'shut' : blink ? 'shut' : fk.eye;
      const lx = CH.clamp(p.lookX || 0, -1, 1), ly = CH.clamp(p.lookY || 0, -1, 1);
      const ey = headY - 1.6;
      const eL = headX - 2.4, eR = headX + 6;      // lens / eye centres
      const LRX = 4.3, LRY = 3.85;                 // frame outer
      const GRX = 2.95, GRY = 2.6;                 // glass inside the frame

      // brows ride above the frames
      if (eyeShape !== 'heart') {
        const [bi, bo, bt] = fk.brow;
        const raise = p.browRaise || 0;
        for (const [cx, inner] of [[eL, 1], [eR, -1]]) {
          const y0 = ey - 4.6 + (inner > 0 ? bo : bi) * 0.7 - raise;
          const y1 = ey - 4.6 + (inner > 0 ? bi : bo) * 0.7 - raise;
          for (let k = 0; k < bt; k++) L(cx - 2.2, y0 + k, cx + 2, y1 + k, C.brow);
        }
      }

      // glasses, part one: frames and glass, under the eyes
      if (specs) {
        // temple arms, behind the lenses, running back to the head
        L(eL - 3.4, ey - 0.6, headX - 8, ey - 2.8, C.frame);
        L(eL - 3.4, ey + 0.4, headX - 8, ey - 1.8, C.frame);
        L(eR + 3.2, ey - 0.8, eR + 4.6, ey - 2.2, C.frame);
        // frame discs, then the glass inside them
        E(eL, ey, LRX, LRY, C.frame);
        E(eR, ey, LRX, LRY, C.frame);
        E(eL, ey, GRX, GRY, C.lens);
        E(eL, ey + 1.4, GRX * 0.92, GRY * 0.5, C.lensLo);
        E(eR, ey, GRX, GRY, C.lens);
        E(eR, ey + 1.4, GRX * 0.92, GRY * 0.5, C.lensLo);
      }

      function eye(cx) {
        const look = lx * 1.1, lookY = ly * 1;
        switch (eyeShape) {
          case 'shut':
            L(cx - 2.4, ey, cx + 2.4, ey, C.pupil);
            L(cx - 2.4, ey, cx - 1.5, ey - 0.9, C.pupil);
            break;
          case 'arch':
            L(cx - 2.6, ey + 1, cx - 0.9, ey - 1.4, C.pupil);
            L(cx - 0.9, ey - 1.4, cx + 0.9, ey - 1.4, C.pupil);
            L(cx + 0.9, ey - 1.4, cx + 2.6, ey + 1, C.pupil);
            break;
          case 'cross':
            L(cx - 2.2, ey - 2, cx + 2.2, ey + 2, C.pupil);
            L(cx + 2.2, ey - 2, cx - 2.2, ey + 2, C.pupil);
            break;
          case 'heart':
            E(cx - 1.2, ey - 0.8, 1.5, 1.4, '#e8496e');
            E(cx + 1.2, ey - 0.8, 1.5, 1.4, '#e8496e');
            T(cx - 2.6, ey - 0.2, cx + 2.6, ey - 0.2, cx, ey + 2.8, '#e8496e');
            P(cx - 1.4, ey - 1.5, '#ffd0dc');
            break;
          default: {
            const wide = eyeShape === 'wide';
            const narrow = eyeShape === 'narrow' || eyeShape === 'glare';
            const half = eyeShape === 'half' || eyeShape === 'bags' || eyeShape === 'droop' || eyeShape === 'squint';
            // magnified by the lenses: the eye nearly fills the glass
            const rx = wide ? 2.5 : narrow ? 2.6 : 2.4;
            const ry = wide ? 2.45 : narrow ? 1.4 : half ? 1.8 : 2.2;
            E(cx, ey, rx, ry, C.eyeW);
            E(cx, ey - ry * 0.5, rx * 0.88, ry * 0.32, gfx.mix(C.eyeW, '#9a8fae', 0.4));
            const pr = wide ? 1.35 : 1.55;
            const pcx = cx + look, pcy = ey + lookY + (eyeShape === 'droop' ? 0.6 : 0);
            E(pcx, pcy, pr, pr + 0.3, C.pupil);
            P(pcx + pr * 0.8, pcy - pr * 0.8, C.glint);
            P(pcx + pr * 0.8 + 1, pcy - pr * 0.8, C.glint);
            if (narrow) R(cx - rx, ey - ry - 1, cx + rx, ey - 0.6, specs ? C.lens : M.fur.base);
            if (half) R(cx - rx, ey - ry - 1, cx + rx, ey - 1, specs ? C.lens : M.fur.base);
            if (eyeShape === 'bags') {
              L(cx - 2, ey + ry + 0.6, cx + 2, ey + ry + 0.6, specs ? C.lensLo : M.fur.dd);
              L(cx - 1.5, ey + ry + 1.6, cx + 1.5, ey + ry + 1.6, specs ? C.lensLo : M.fur.d);
            }
            if (eyeShape === 'squint') L(cx - rx, ey + 0.4, cx + rx, ey + 0.4, specs ? C.lensLo : M.fur.d);
            break;
          }
        }
      }
      eye(eL); eye(eR);

      // glasses, part two: the bridge, the tape and the glint, over the eyes
      if (specs) {
        // bridge over the muzzle
        R(eL + 3, ey - 1.6, eR - 3, ey - 0.4, C.frame);
        L(eL + 3.2, ey - 2, eR - 3.2, ey - 2, C.frame);
        // tape, because they have been sat on at least once
        R(headX + 1, ey - 2.6, headX + 2.3, ey + 0.8, C.tape);
        R(headX + 1, ey + 0.2, headX + 2.3, ey + 0.8, C.tapeLo);
        P(headX + 1, ey - 2.6, C.tapeLo);
        // lens glint: a hard diagonal sweep across the upper-left of the glass
        for (const cx of [eL, eR]) {
          L(cx - 2.4, ey + 1, cx - 0.4, ey - 2.1, C.glint);
          L(cx - 1.6, ey + 1.1, cx - 0.2, ey - 1.1, C.glint);
          L(cx - 2.3, ey + 2.2, cx - 1.5, ey + 1.5, C.glint);
        }
      }

      // nose
      E(headX + 5.7, headY + 3.2, 1.8, 1.4, C.nose);
      E(headX + 5.3, headY + 2.6, 1, 0.6, '#a28a98');
      for (const dy0 of [0, 1.6]) P(headX + 8.6, headY + 4.2 + dy0, M.muzzle.d);

      const m = p.mouth || fk.mouth;
      const my = headY + 6.6, mx = headX + 3.6;
      const ink = C.nose;
      if (m === 'smile') { L(mx - 2.6, my - 0.8, mx, my + 0.8, ink); L(mx, my + 0.8, mx + 2.6, my - 0.8, ink); }
      else if (m === 'grin') {
        T(mx - 3.1, my - 0.8, mx + 3.1, my - 0.8, mx, my + 2.5, ink);
        R(mx - 2.4, my - 0.6, mx + 2.4, my, C.teeth);
      } else if (m === 'smirk') { L(mx - 1.7, my + 0.2, mx + 2.4, my - 1.1, ink); P(mx + 2.8, my - 1.7, ink); }
      else if (m === 'frown') { L(mx - 2.6, my + 0.9, mx, my - 0.7, ink); L(mx, my - 0.7, mx + 2.6, my + 0.9, ink); }
      else if (m === 'wail') {
        E(mx, my + 1.3, 3, 2.6, ink); E(mx, my + 2.1, 2, 1.5, C.tongue);
        L(mx - 3, my - 1.5, mx, my - 0.3, ink); L(mx, my - 0.3, mx + 3, my - 1.5, ink);
      } else if (m === 'gape') { E(mx, my + 1.1, 2.6, 2.9, ink); E(mx, my + 2.1, 1.6, 1.4, C.tongue); }
      else if (m === 'gasp') { E(mx, my + 0.9, 2.2, 1.9, ink); }
      else if (m === 'snarl') {
        L(mx - 3, my + 1.1, mx + 3, my - 0.5, ink);
        for (let i = 0; i < 3; i++) T(mx - 2 + i * 2, my + 0.7 - i * 0.35, mx - 1.1 + i * 2, my + 0.7 - i * 0.35, mx - 1.6 + i * 2, my - 0.9 - i * 0.35, C.teeth);
      } else if (m === 'wobble') { for (let i = 0; i < 7; i++) P(mx - 3 + i, my + (i % 2 ? 0.9 : -0.3), ink); }
      else if (m === 'squiggle') { for (let i = 0; i < 7; i++) P(mx - 3 + i, my + Math.sin(i * 1.5) * 1.1, ink); }
      else if (m === 'set') { R(mx - 2.6, my, mx + 2.6, my + 0.6, ink); }
      else if (m === 'snore') { E(mx + 0.6, my + 0.8, 1.9, 1.4, ink); }
      else if (m === 'eat') { const o = (Math.sin(t * 18) + 1) * 0.5; E(mx, my + 0.8, 2.4, 1 + o * 1.7, ink); }
      else if (m === 'o') { E(mx, my + 0.8, 1.7, 1.9, ink); }
      else { R(mx - 2.4, my, mx + 2.4, my + 0.7, ink); P(mx - 3, my - 0.6, ink); P(mx + 3, my - 0.6, ink); }

      // rabbit teeth: they hang over the lip whatever the mouth is doing
      if (p.teeth !== false) {
        const tx = mx + 0.3, ty = my - 1.3;
        R(tx - 2.3, ty - 0.4, tx + 2.3, ty + 3.4, ink);
        R(tx - 1.95, ty, tx - 0.5, ty + 3, C.teeth);
        R(tx + 0.5, ty, tx + 1.95, ty + 3, C.teeth);
        R(tx - 1.95, ty + 2.5, tx - 0.5, ty + 3, C.toothLo);
        R(tx + 0.5, ty + 2.5, tx + 1.95, ty + 3, C.toothLo);
      }

      if (p.blush !== false) {
        E(headX - 5.8, headY + 3.4, 1.7, 1.1, gfx.alpha(C.blush, 0.5));
        E(headX + 9.6, headY + 5.6, 1.4, 1, gfx.alpha(C.blush, 0.5));
      }
      if (p.face === 'cry') {
        for (const [cx, ph] of [[eL, 0], [eR, 0.5]]) {
          const k = (t * 1.6 + ph) % 1;
          E(cx + 1, ey + 4.4 + k * 5, 1.1, 1.6, C.tear);
        }
      }

      // ---- front arm ---------------------------------------------------------
      const sleeve = mat;
      const swing = step * 2.6 * moving;
      if (sitting) {
        limb(bodyX + 6.6, bodyY - 2, bodyX + 10.8, bodyY + 3.8, 4.5, sleeve);
        hand(bodyX + 11.2, bodyY + 5.2);
        hand(bodyX + 1, bodyY + 5.6);
        if (arm === 'controller') {
          const mash = Math.sin(t * 14) * 0.6;
          R(bodyX + 1, bodyY + 4.2, bodyX + 10, bodyY + 6.6, '#3a3a48');
          E(bodyX + 2, bodyY + 5.4, 1.6, 1.6, '#4a4a5c'); E(bodyX + 9, bodyY + 5.4, 1.6, 1.6, '#4a4a5c');
          gfx.px(X(bodyX + 8.4 + mash), Y(bodyY + 4.8), '#f05a4a');
          gfx.px(X(bodyX + 9.6), Y(bodyY + 5.6 + mash), '#5ad07a');
          L(bodyX + 5.2, bodyY + 4.6, bodyX + 5.2, bodyY + 6.2, '#20202c');
        }
      } else if (arm === 'up' || arm === 'reach') {
        limb(bodyX + 7.6, bodyY - 4.6, bodyX + 12.4, bodyY - 14, 4.4, sleeve); hand(bodyX + 12.8, bodyY - 15.4);
      } else if (arm === 'both_up' || arm === 'cheer') {
        limb(bodyX + 7.6, bodyY - 4.6, bodyX + 13.2, bodyY - 14, 4.4, sleeve); hand(bodyX + 13.6, bodyY - 15.4);
        limb(bodyX - 7.6, bodyY - 4.6, bodyX - 13.2, bodyY - 14, 4.4, sleeve); hand(bodyX - 13.6, bodyY - 15.4);
      } else if (arm === 'phone') {
        limb(bodyX + 6.6, bodyY - 3.8, bodyX + 10.4, bodyY - 10.4, 4.4, sleeve); hand(bodyX + 10.8, bodyY - 11.4);
        R(bodyX + 9, bodyY - 18, bodyX + 13.2, bodyY - 10.4, '#1a1a24');
        R(bodyX + 9.5, bodyY - 17, bodyX + 12.7, bodyY - 11.4, '#6fb0ff');
        gfx.px(X(bodyX + 11.1), Y(bodyY - 18.5), '#3a3a48');
      } else if (arm === 'hold' || arm === 'carry') {
        limb(bodyX + 7.6, bodyY - 2.8, bodyX + 13.2, bodyY - 5.6, 4.4, sleeve); hand(bodyX + 13.6, bodyY - 6.1);
        limb(bodyX - 7.6, bodyY - 2.8, bodyX - 12.2, bodyY - 5.6, 4.2, sleeve); hand(bodyX - 12.6, bodyY - 6.1, 2.4);
      } else if (arm === 'controller') {
        limb(bodyX + 7.6, bodyY - 2.8, bodyX + 6.6, bodyY + 2.8, 4.4, sleeve);
        hand(bodyX + 6.2, bodyY + 3.8); hand(bodyX - 5.2, bodyY + 3.8);
        R(bodyX - 4.2, bodyY + 2.2, bodyX + 5.2, bodyY + 4.7, '#3a3a48');
      } else if (arm === 'cover') {
        limb(bodyX + 7.6, bodyY - 4.6, bodyX + 9.4, bodyY - 12, 4.4, sleeve);
        hand(headX + 8, headY + 2.6, 2.9); hand(headX - 2.2, headY + 3.2, 2.9);
      } else if (arm === 'mop') {
        limb(bodyX + 7.6, bodyY - 4.6, bodyX + 14, bodyY - 9.4, 4.4, sleeve); hand(bodyX + 14.4, bodyY - 10.4);
      } else if (arm === 'wave') {
        const wv = Math.sin(t * 11) * 3;
        limb(bodyX + 8.5, bodyY - 4.6, bodyX + 16 + wv, bodyY - 13, 4.4, sleeve); hand(bodyX + 17 + wv, bodyY - 14.4);
      } else if (arm === 'belly') {
        limb(bodyX + 7.6, bodyY - 2.8, bodyX + 7.6, bodyY + 1.8, 4.4, sleeve);
        hand(bodyX + 7.6, bodyY + 2.8); hand(bodyX - 6.6, bodyY + 2.8);
      } else if (arm === 'pocket') {
        limb(bodyX + 7.6, bodyY - 3.8, bodyX + 9, bodyY + 2.8, 4.4, sleeve);
      } else {
        limb(bodyX + 8.5, bodyY - 4.6, bodyX + 12.6, bodyY + 2.8 + swing, 4.7, sleeve);
        hand(bodyX + 13, bodyY + 4.8 + swing);
      }
    }, { flip: p.flip, outline: p.outline === null ? null : (p.outline || art.INK), alpha: p.alpha });

    // ---- effects outside the ink line ----------------------------------------
    const ox = Math.round(x), oy = Math.round(y);
    const dir = p.flip ? -1 : 1;
    const hx = ox + dir * Math.round((2 + (p.headDX || 0)) * sx);
    const hy = oy + Math.round((-29 + (p.headDY || 0)) * sy);
    if (p.sweat > 0) art.effect('sweat', hx + dir * 9, hy - 6, t, 1);
    if (sleep) art.effect('zzz', hx + dir * 9, hy - 6, t, 1);
    if (p.fx) art.effect(p.fx, hx + dir * 8, hy - 11, t, 1);
    if (p.emote) {
      const bx = hx + dir * 12, by = hy - 16;
      art.bubble(bx - 9, by - 10, 19, 16, bx - 2, by + 8, { kind: 'think' });
      gfx.text(p.emote, bx + 0.5, by - 5, p.emote === '♥' ? '#e8496e' : '#2a1f33', { align: 'center' });
    }
  }
  CH.drawChubby = drawChubby;

  // ============================================================================
  // Actor - drives the renderer with springs so motion overshoots and settles
  // ============================================================================
  class Chubby {
    constructor(x, y) {
      this.x = x; this.y = y; this.vx = 0; this.vy = 0;
      this.flip = false; this.walk = 0; this.moving = 0;
      this.squashX = new CH.Spring(260, 14, 1);
      this.squashY = new CH.Spring(260, 14, 1);
      this.jiggle = new CH.Spring(150, 5.5, 0);   // belly
      this.quill = new CH.Spring(110, 7, 0);      // quill sweep
      this.headSpring = new CH.Spring(200, 9, 0); // head lag
      this.face = 'normal'; this.mouth = null;
      this.blinkT = CH.rand(1.5, 4); this.blink = false;
      this.outfit = CH.state.outfit || 'hoodie';
      this.arm = 'idle'; this.hat = null; this.fx = null; this.fxT = 0;
      this.sweat = 0; this.lookX = 0; this.lookY = 0;
      this.sleep = false; this.sitting = false; this.emote = null; this.emoteT = 0;
      this.stepT = 0; this.speed = 70; this.lastVx = 0; this.idleT = 0;
      this.headDX = 0; this.headDY = 0; this.browRaise = 0;
      this.grounded = true; this.hidden = false; this.breath = 0;
      this.bounce = 0;
    }
    setFace(f, dur) { this.face = f; this.faceT = dur || 0; }
    doEmote(e, dur = 1.5) { this.emote = e; this.emoteT = dur; CH.audio.sfx('pop'); }
    doFx(name, dur = 1.2) { this.fx = name; this.fxT = dur; }
    land(power = 1) {
      this.squashY.x = 1 - 0.34 * power; this.squashX.x = 1 + 0.32 * power;
      this.jiggle.kick(-46 * power); this.headSpring.kick(34 * power);
      CH.audio.sfx('land');
    }
    hop(power = 1) {
      this.squashY.x = 1 + 0.28 * power; this.squashX.x = 1 - 0.22 * power;
      this.headSpring.kick(-20 * power);
    }
    update(dt, particles) {
      const sp = Math.abs(this.vx);
      const target = CH.clamp(sp / this.speed, 0, 1);
      this.moving = CH.approach(this.moving, target, dt * 6);
      if (sp > 2) {
        this.walk += dt * (7.5 + sp * 0.12);
        this.stepT += dt * sp;
        if (this.stepT > 26) {
          this.stepT = 0;
          CH.audio.sfx(this.stepSfx || 'stepWood');
          this.jiggle.kick(7 * (this.flip ? -1 : 1));
          if (particles && this.grounded) {
            particles.burst(this.x - Math.sign(this.vx) * 5, this.y, 2, { color: ['#c9b48a', '#8b7355'], speed: 16, grav: 60, life: 0.35, angle: -Math.PI / 2, spread: 1.2 });
          }
        }
        if (this.vx > 0) this.flip = false; else if (this.vx < 0) this.flip = true;
        this.idleT = 0;
      } else {
        this.walk = CH.approach(this.walk, Math.round(this.walk / Math.PI) * Math.PI, dt * 10);
        this.idleT += dt;
      }
      const ax = this.vx - this.lastVx;
      if (Math.abs(ax) > 20) { this.jiggle.kick(-ax * 0.95 * (this.flip ? -1 : 1)); this.headSpring.kick(ax * 0.35); }
      this.lastVx = this.vx;
      this.quill.target = CH.clamp(this.vx / this.speed, -1, 1) * (this.flip ? -1 : 1);
      this.squashX.update(dt); this.squashY.update(dt);
      this.jiggle.update(dt); this.quill.update(dt); this.headSpring.update(dt);
      // idle breathing, plus a slow whole-body bob so he is never a still image
      const br = this.sleep ? 1.8 : 2.4;
      this.breath = Math.sin(CH.game.t * br) * (this.sleep ? 0.03 : 0.014);
      this.bounce = Math.sin(CH.game.t * 2.1) * (this.moving > 0.2 ? 0 : 0.5);
      this.blinkT -= dt;
      if (this.blinkT <= 0) { this.blink = !this.blink; this.blinkT = this.blink ? 0.11 : CH.rand(1.4, 4.5); }
      if (this.faceT > 0) { this.faceT -= dt; if (this.faceT <= 0) this.face = 'normal'; }
      this.updateIdle(dt);
      if (this.emoteT > 0) { this.emoteT -= dt; if (this.emoteT <= 0) this.emote = null; }
      if (this.fxT > 0) { this.fxT -= dt; if (this.fxT <= 0) this.fx = null; }
    }
    // Standing still is not the same as being a still image. After a few quiet
    // seconds he does something small - a look around, a yawn, a shuffle -
    // then goes back to neutral.
    updateIdle(dt) {
      if (this.idleAnim) {
        this.idleT2 -= dt;
        const a = this.idleAnim;
        if (a === 'look') {
          this.lookX = Math.sin((1.6 - this.idleT2) * 2.4) * 0.9;
        } else if (a === 'yawn') {
          const k = 1 - this.idleT2 / 1.8;
          this.face = k < 0.75 ? 'tired' : 'normal';
          this.mouth = k < 0.7 && k > 0.15 ? 'gape' : null;
          this.browRaise = k < 0.7 && k > 0.15 ? 1 : 0;
        } else if (a === 'shuffle') {
          if (this.idleT2 > 0.9) this.flip = this._idleFlip;
          else this.flip = !this._idleFlip;
        } else if (a === 'scratch') {
          this.arm = 'cover';
          this.headDX = Math.sin((1.2 - this.idleT2) * 22) * 0.6;
        } else if (a === 'bounce') {
          const k = 1 - this.idleT2 / 0.9;
          this.squashY.x = 1 + Math.sin(k * Math.PI * 2) * 0.1;
        }
        if (this.idleT2 <= 0) {
          this.idleAnim = null;
          this.lookX = 0; this.mouth = null; this.browRaise = 0; this.headDX = 0;
          if (a === 'scratch') this.arm = this._idleArm || 'idle';
          if (a === 'yawn') this.face = 'normal';
        }
        return;
      }
      if (this.moving > 0.15 || this.sleep || this.sitting || CH.ui.busy() || this.noIdleAnim) { this.nextIdle = null; return; }
      if (this.nextIdle === null || this.nextIdle === undefined) { this.nextIdle = CH.rand(4, 9); return; }
      this.nextIdle -= dt;
      if (this.nextIdle > 0) return;
      this.nextIdle = CH.rand(5, 11);
      if (this.arm !== 'idle' && this.arm !== 'pocket') return;
      const pick = CH.pick(['look', 'yawn', 'shuffle', 'scratch', 'bounce', 'look']);
      this.idleAnim = pick;
      this._idleFlip = this.flip;
      this._idleArm = this.arm;
      this.idleT2 = pick === 'yawn' ? 1.8 : pick === 'look' ? 1.6 : pick === 'scratch' ? 1.2 : pick === 'bounce' ? 0.9 : 1.6;
      if (pick === 'bounce') this.jiggle.kick(-18);
    }
    params(extra = {}) {
      return Object.assign({
        sx: this.squashX.x + this.breath, sy: this.squashY.x - this.breath,
        jig: CH.clamp(this.jiggle.x, -5, 5), walk: this.walk, moving: this.moving,
        face: this.face, mouth: this.mouth, blink: this.blink, outfit: this.outfit,
        flip: this.flip, quillTilt: CH.clamp(this.quill.x, -1, 1),
        arm: this.arm, hat: this.hat, sweat: this.sweat, fx: this.fx,
        lookX: this.lookX, lookY: this.lookY, sleep: this.sleep, sitting: this.sitting,
        emote: this.emote, browRaise: this.browRaise,
        headDX: this.headDX + CH.clamp(this.headSpring.x * 0.03, -1.5, 1.5),
        headDY: this.headDY - this.bounce,
      }, extra);
    }
    draw(g, camX = 0, camY = 0, extra) {
      if (this.hidden) return;
      drawChubby(g, this.x - camX, this.y - camY, this.params(extra));
    }
  }
  CH.Chubby = Chubby;

  // ---- dialogue portrait -------------------------------------------------------
  // The box is 32x34 and the face is what matters, so he is scaled up until the
  // glasses fill it.
  CH.ui.portraits.Chubby = (g, x, y, d) => {
    const face = (d && d.opts && d.opts.face) || 'normal';
    g.save();
    g.translate(x, y + 27);
    g.scale(1.45, 1.45);
    drawChubby(g, 0, 0, {
      face, outfit: CH.state.outfit || 'hoodie', noShadow: true, blink: false,
      arm: 'pocket', blush: true,
    });
    g.restore();
  };
})(window.CH);
