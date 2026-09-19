// ============================================================================
// CHUBBY - the porcupine. Outlined, heavily shaded, and animated joint by joint.
//
// The sprite is assembled every frame into an offscreen buffer (see 08_art.js)
// so the whole silhouette gets one clean ink line. Inside that buffer the body
// is built from ellipses on a local axis: origin at the feet, +y up the screen
// is negative, and +x is always "facing right" - mirroring is done by the blit,
// so no pose has to be written twice.
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
    [-8, -6.5, -17, -13, 4.6],
    [-5.5, -9.5, -12, -20, 4.4],
    [-1, -11.5, -4.5, -23, 4.2],
    [3.5, -11, 1.5, -21.5, 3.6],
    [-10.5, -3, -19.5, -9, 4.0],
  ];
  const BODY_QUILLS = [
    [-7, -8.5, -16, -18, 5.0],
    [-10, -3, -21, -9, 4.6],
    [-10.5, 1.5, -19, -6, 4.0],
    [-3, -11, -7, -20, 4.2],
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

    if (!p.noShadow) {
      const sh = sitting ? 12 : 11 - Math.abs(jig) * 0.2;
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

      // ---- rhythm ------------------------------------------------------------
      const step = Math.sin(walk), step2 = Math.sin(walk + Math.PI);
      const bob = Math.abs(Math.sin(walk)) * 1.6 * moving;
      const lean = moving * 1.2;
      const bodyY = (sitting ? -12 : -15.5) - bob;
      const bodyX = jig * 0.55 + lean * 0.4;
      const headY = bodyY - 16.5 - (sitting ? -1 : 0) + (p.headDY || 0) - bob * 0.35;
      const headX = bodyX + 2.2 + (p.headDX || 0) + lean * 0.5;
      const brx = 12.6 + jig * 0.45, bry = 11.4 - Math.abs(jig) * 0.22;
      const hr = 12.8;
      const hood = outfit === 'hoodie' || outfit === 'pajamas';

      // ---- quills ------------------------------------------------------------
      // Drawn first so the body and head sit in front of their own spikes.
      const qm = M.quill;
      function spike(ox0, oy0, tx0, ty0, w0, cx, cy, sweep) {
        const bx0 = cx + ox0, by0 = cy + oy0;
        // quills trail the body: sweeping back when moving forward
        const dx0 = tx0 - ox0 - sweep * 4.5, dy0 = ty0 - oy0 + Math.abs(sweep) * 1.6;
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
        const lift = (sv) => Math.max(0, sv) * 2.6 * moving;
        for (const [sgn, sw] of [[-1, step], [1, step2]]) {
          const fx = sgn * 5 + sw * 3.4 * moving;
          const fyy = -1 - lift(sw);
          E(fx, fyy, 4.4, 2.6, M.shoe.d);
          E(fx + 0.4, fyy - 1, 3.8, 1.8, bootie ? M.fur.d : M.shoe.base);
          E(fx, fyy - 1.8, 2.4, 1, bootie ? M.fur.base : M.shoe.l);
        }
      } else if (sitting) {
        E(6, -5, 4.6, 2.8, M.pants.base); E(6, -6.2, 3.8, 1.9, M.pants.l);
        E(-2.5, -4, 4.4, 2.6, M.pants.d);
        E(10.5, -3.2, 3.8, 2.3, M.shoe.base); E(2, -2.4, 3.6, 2.1, M.shoe.d);
      }

      // ---- back arm ----------------------------------------------------------
      const paw = outfit === 'janitor' ? M.apron : M.fur;
      const backSwing = step2 * 2.8 * moving;
      function limb(x0, y0, x1, y1, w0, matr) {
        const dx0 = x1 - x0, dy0 = y1 - y0, len = Math.hypot(dx0, dy0) || 1;
        const nx = (-dy0 / len) * w0 * 0.5, ny = (dx0 / len) * w0 * 0.5;
        T(x0 - nx, y0 - ny, x0 + nx, y0 + ny, x1 + nx, y1 + ny, matr.base);
        T(x0 - nx, y0 - ny, x1 - nx, y1 - ny, x1 + nx, y1 + ny, matr.base);
        T(x0 - nx, y0 - ny, x1 - nx, y1 - ny, x1 + nx * 0.1, y1 + ny * 0.1, matr.d);
        E((x0 + x1) / 2, (y0 + y1) / 2, w0 * 0.5, w0 * 0.5, matr.base);
      }
      function hand(hx2, hy2, r = 2.9) {
        E(hx2, hy2, r, r, paw.d);
        E(hx2 - 0.4, hy2 - 0.7, r - 0.8, r - 0.8, paw.base);
        E(hx2 - 0.9, hy2 + r * 0.55, r * 0.55, r * 0.4, paw.dd);
      }
      if (!sitting) {
        limb(bodyX - 9, bodyY - 5, bodyX - 13.5, bodyY + 3 + backSwing, 4.8, { base: mat.d, d: mat.dd });
        hand(bodyX - 14, bodyY + 5 + backSwing, 2.7);
      }

      // ---- body --------------------------------------------------------------
      // shoulders taper in so the silhouette is a pear, not an egg
      E(bodyX, bodyY + 1, brx, bry, mat.d);
      E(bodyX, bodyY, brx - 0.4, bry - 0.5, mat.base);
      E(bodyX - 0.5, bodyY - bry * 0.62, brx * 0.72, bry * 0.42, mat.base);
      // belly mass
      E(bodyX + 3, bodyY + 3.2, brx * 0.66, bry * 0.58, mat.l);
      E(bodyX + 3, bodyY + 4.2, brx * 0.6, bry * 0.5, mat.base);
      // top light and bottom core shadow
      E(bodyX - 3, bodyY - 6, brx * 0.46, bry * 0.24, mat.l);
      E(bodyX, bodyY + bry * 0.72, brx * 0.82, bry * 0.26, mat.d);

      // ---- outfit detail -----------------------------------------------------
      if (hood) {
        R(bodyX - brx + 3.5, bodyY + bry - 3.5, bodyX + brx - 3.5, bodyY + bry - 1, mat.d);
        for (let i = -3; i <= 3; i++) R(bodyX + i * 2.6, bodyY + bry - 3.5, bodyX + i * 2.6, bodyY + bry - 1, mat.dd);
      }
      if (outfit === 'hoodie') {
        E(bodyX + 2.5, bodyY + 4.2, 8, 4.4, mat.d);
        E(bodyX + 2.5, bodyY + 3.4, 7.4, 3.8, mat.base);
        L(bodyX - 4.6, bodyY + 1, bodyX - 3.4, bodyY + 5.5, mat.dd);
        L(bodyX + 9.6, bodyY + 1, bodyX + 8.4, bodyY + 5.5, mat.dd);
        const sway = Math.sin(walk * 0.5) * moving * 1.2 + jig * 0.15;
        for (const [dx0, len] of [[1.5, 8], [4.5, 6]]) {
          L(bodyX + dx0, bodyY - 8, bodyX + dx0 + sway, bodyY - 8 + len, C.cream);
          E(bodyX + dx0 + sway, bodyY - 7.5 + len, 0.9, 1.1, '#8a7a55');
        }
      } else if (outfit === 'suit') {
        const t0 = bodyY - 9;
        T(bodyX + 0.5, t0, bodyX + 7, t0, bodyX + 4, bodyY + 1.5, C.white);
        R(bodyX + 1.5, bodyY - 1, bodyX + 6.5, bodyY + 6, C.white);
        T(bodyX - 2, t0 - 1, bodyX + 3.5, t0 + 1, bodyX + 1, bodyY + 3.5, mat.l);
        T(bodyX + 9.5, t0 - 1, bodyX + 4.5, t0 + 1, bodyX + 7, bodyY + 3.5, mat.l);
        R(bodyX + 3, t0 + 1, bodyX + 5, t0 + 3, C.red);
        T(bodyX + 2.5, t0 + 3, bodyX + 5.5, t0 + 3, bodyX + 4.5, bodyY + 5, C.red);
        R(bodyX + 3.6, t0 + 4, bodyX + 4.1, bodyY + 3, gfx.shade(C.red, 26));
        E(bodyX + 4, bodyY + 5.5, 1.2, 1.2, C.gold);
        L(bodyX + 1.5, bodyY + 7, bodyX + 6.5, bodyY + 7, mat.dd);
      } else if (outfit === 'uniform' || outfit === 'janitor') {
        T(bodyX - 1, bodyY - 9.5, bodyX + 8, bodyY - 9.5, bodyX + 3.5, bodyY - 4, '#f5c33b');
        R(bodyX + 2.5, bodyY - 8.5, bodyX + 4.5, bodyY - 5, mat.d);
        R(bodyX - 8, bodyY - 4.5, bodyX - 3.5, bodyY - 2, C.white);
        R(bodyX - 7, bodyY - 4, bodyX - 4.5, bodyY - 4, C.red);
        if (outfit === 'janitor') {
          E(bodyX + 1, bodyY + 3.5, 9.6, 7.6, M.apron.base);
          E(bodyX + 1, bodyY + 5, 9, 6.2, M.apron.d);
          R(bodyX - 8, bodyY + 0.5, bodyX + 10, bodyY + 1.2, M.apron.l);
          L(bodyX - 5.5, bodyY - 3.5, bodyX - 8, bodyY - 8.5, M.apron.d);
          L(bodyX + 7.5, bodyY - 3.5, bodyX + 9.5, bodyY - 8.5, M.apron.d);
          R(bodyX + 2, bodyY + 4, bodyX + 8, bodyY + 8, M.apron.dd);
          R(bodyX + 3, bodyY + 3, bodyX + 6, bodyY + 4, '#d8d2c0');
        }
      } else if (outfit === 'pajamas') {
        for (let i = -4; i <= 4; i++) R(bodyX + i * 3, bodyY - 8.5, bodyX + i * 3, bodyY + 7, mat.l);
      }

      // ---- head --------------------------------------------------------------
      if (hood) {
        // hood shell: sits behind and above, opening toward the face
        E(headX - 2.5, headY + 1, hr + 2.4, hr + 1.8, mat.dd);
        E(headX - 3, headY, hr + 1.6, hr + 0.9, mat.base);
        E(headX - 4.5, headY - 5, hr * 0.6, hr * 0.28, mat.l);
        // the opening, a shade darker than the shell
        E(headX + 1.2, headY + 0.6, hr * 1.02, hr * 0.99, mat.dd);
      }
      // face ball
      E(headX + 1, headY + 1, hr * 0.94, hr * 0.92, M.fur.d);
      E(headX + 1, headY, hr * 0.92, hr * 0.88, M.fur.base);
      E(headX - 1.5, headY - 6, hr * 0.5, hr * 0.26, M.fur.l);
      // muzzle: a distinct lighter mass, not a wash over the whole face
      E(headX + 5, headY + 5.2, 7.4, 5.2, M.fur.dd);
      E(headX + 5, headY + 4.6, 7, 4.8, M.muzzle.base);
      E(headX + 4.4, headY + 3.4, 5.2, 2.4, M.muzzle.l);
      E(headX + 5, headY + 6.6, 5.6, 2.2, M.muzzle.d);
      if (hood) E(headX + 0.8, headY - 8, hr * 0.62, 1.8, M.fur.d);
      if (!hood) {
        E(headX - 6.5, headY - 8.5, 3, 3.2, M.fur.d);
        E(headX - 6.5, headY - 8.5, 1.7, 1.8, C.blush);
      }

      // ---- headwear ----------------------------------------------------------
      const hat = p.hat || ((outfit === 'uniform' || outfit === 'janitor') ? 'visor' : null);
      if (hat === 'visor') {
        R(headX - 9, headY - 10, headX + 8, headY - 8, C.red);
        E(headX - 0.5, headY - 11, 8.6, 2.8, C.red);
        E(headX - 2, headY - 12, 4, 1.1, gfx.shade(C.red, 30));
        R(headX + 7, headY - 9.5, headX + 15, headY - 7.5, gfx.shade(C.red, -22));
        R(headX - 1, headY - 11.5, headX + 1.5, headY - 9, '#f5c33b');
      } else if (hat === 'hairnet') {
        gfx.ellipseOutline(X(headX), Y(headY - 7), 8.6 * sx, 4.4 * sy, 'rgba(255,255,255,0.75)');
        for (let i = -6; i <= 6; i += 3) gfx.px(X(headX + i), Y(headY - 9 + Math.abs(i) * 0.25), 'rgba(255,255,255,0.6)');
      } else if (hat === 'crown') {
        R(headX - 6.5, headY - 13, headX + 6.5, headY - 10, C.gold);
        for (const dx0 of [-6, 0, 6]) T(headX + dx0 - 1.8, headY - 13, headX + dx0 + 1.8, headY - 13, headX + dx0, headY - 17.5, C.gold);
        for (const dx0 of [-3, 3]) gfx.px(X(headX + dx0), Y(headY - 11.5), C.red);
      } else if (hat === 'toque') {
        E(headX - 0.5, headY - 9, 9, 4.6, '#c8352b');
        R(headX - 8.5, headY - 8, headX + 7.5, headY - 5.5, C.white);
        E(headX - 0.5, headY - 13, 2.4, 2.4, C.white);
      }

      // ---- face: brows, eyes, nose, mouth -----------------------------------
      const fk = FACES[p.face] || FACES.normal;
      const blink = p.blink && fk.eye !== 'shut' && fk.eye !== 'cross';
      const eyeShape = sleep ? 'shut' : blink ? 'shut' : fk.eye;
      const lx = CH.clamp(p.lookX || 0, -1, 1), ly = CH.clamp(p.lookY || 0, -1, 1);
      const ey = headY - 2;
      const eL = headX - 2.2, eR = headX + 6.4;

      function eye(cx) {
        const look = lx * 1.3, lookY = ly * 1.2;
        switch (eyeShape) {
          case 'shut':
            L(cx - 2.6, ey, cx + 2.6, ey, C.pupil);
            L(cx - 2.6, ey, cx - 1.6, ey - 0.9, C.pupil);
            break;
          case 'arch':
            L(cx - 2.8, ey + 0.8, cx - 1, ey - 1.6, C.pupil);
            L(cx - 1, ey - 1.6, cx + 1, ey - 1.6, C.pupil);
            L(cx + 1, ey - 1.6, cx + 2.8, ey + 0.8, C.pupil);
            break;
          case 'cross':
            L(cx - 2.2, ey - 2.2, cx + 2.2, ey + 2.2, C.pupil);
            L(cx + 2.2, ey - 2.2, cx - 2.2, ey + 2.2, C.pupil);
            break;
          case 'heart':
            E(cx - 1.4, ey - 0.8, 1.6, 1.5, '#e8496e');
            E(cx + 1.4, ey - 0.8, 1.6, 1.5, '#e8496e');
            T(cx - 2.9, ey - 0.2, cx + 2.9, ey - 0.2, cx, ey + 3.2, '#e8496e');
            gfx.px(X(cx - 1.6), Y(ey - 1.5), '#ffd0dc');
            break;
          default: {
            const wide = eyeShape === 'wide';
            const narrow = eyeShape === 'narrow' || eyeShape === 'glare';
            const half = eyeShape === 'half' || eyeShape === 'bags' || eyeShape === 'droop' || eyeShape === 'squint';
            const rx = wide ? 3.4 : narrow ? 3 : 3.05;
            const ry = wide ? 4.2 : narrow ? 2 : half ? 2.5 : 3.5;
            E(cx, ey, rx, ry, C.eyeW);
            E(cx, ey - ry * 0.55, rx * 0.9, ry * 0.34, gfx.mix(C.eyeW, '#9a8fae', 0.45));
            const pr = wide ? 1.5 : 1.9;
            const pcx = cx + look, pcy = ey + lookY + (eyeShape === 'droop' ? 0.7 : 0);
            E(pcx, pcy, pr, pr + 0.4, C.pupil);
            gfx.px(X(pcx + pr * 0.75), Y(pcy - pr * 0.85), C.glint);
            gfx.px(X(pcx + pr * 0.75 + 1), Y(pcy - pr * 0.85), C.glint);
            if (narrow) R(cx - rx, ey - ry - 1, cx + rx, ey - 0.7, M.fur.base);
            if (half) R(cx - rx, ey - ry - 1, cx + rx, ey - 1.2, M.fur.base);
            if (eyeShape === 'bags') {
              L(cx - 2.2, ey + ry + 0.7, cx + 2.2, ey + ry + 0.7, M.fur.dd);
              L(cx - 1.6, ey + ry + 1.8, cx + 1.6, ey + ry + 1.8, M.fur.d);
            }
            if (eyeShape === 'squint') L(cx - rx, ey + 0.5, cx + rx, ey + 0.5, M.fur.d);
            break;
          }
        }
      }
      eye(eL); eye(eR);

      if (eyeShape !== 'heart') {
        const [bi, bo, bt] = fk.brow;
        const raise = p.browRaise || 0;
        for (const [cx, inner] of [[eL, 1], [eR, -1]]) {
          const y0 = ey - 5.6 + (inner > 0 ? bo : bi) * 0.95 - raise;
          const y1 = ey - 5.6 + (inner > 0 ? bi : bo) * 0.95 - raise;
          for (let k = 0; k < bt; k++) L(cx - 3, y0 + k, cx + 3, y1 + k, M.fur.dd);
        }
      }

      E(headX + 9.4, headY + 3.4, 2.4, 1.9, C.nose);
      E(headX + 9, headY + 2.7, 1.2, 0.8, '#a28a98');
      for (const dy0 of [0, 1.8]) gfx.px(X(headX + 11), Y(headY + 4.6 + dy0), M.muzzle.d);

      const m = p.mouth || fk.mouth;
      const my = headY + 6.8, mx = headX + 4.6;
      const ink = C.nose;
      if (m === 'smile') { L(mx - 2.8, my - 0.8, mx, my + 0.9, ink); L(mx, my + 0.9, mx + 2.8, my - 0.8, ink); }
      else if (m === 'grin') {
        T(mx - 3.4, my - 0.8, mx + 3.4, my - 0.8, mx, my + 2.8, ink);
        R(mx - 2.6, my - 0.6, mx + 2.6, my, C.teeth);
      } else if (m === 'smirk') { L(mx - 1.8, my + 0.2, mx + 2.6, my - 1.2, ink); gfx.px(X(mx + 3), Y(my - 1.8), ink); }
      else if (m === 'frown') { L(mx - 2.8, my + 0.9, mx, my - 0.7, ink); L(mx, my - 0.7, mx + 2.8, my + 0.9, ink); }
      else if (m === 'wail') {
        E(mx, my + 1.2, 3.2, 2.8, ink); E(mx, my + 2, 2.1, 1.7, C.tongue);
        L(mx - 3.2, my - 1.6, mx, my - 0.3, ink); L(mx, my - 0.3, mx + 3.2, my - 1.6, ink);
      } else if (m === 'gape') { E(mx, my + 0.9, 2.8, 3.2, ink); E(mx, my + 2, 1.7, 1.5, C.tongue); }
      else if (m === 'gasp') { E(mx, my + 0.7, 2.4, 2, ink); }
      else if (m === 'snarl') {
        L(mx - 3.2, my + 1.1, mx + 3.2, my - 0.5, ink);
        for (let i = 0; i < 3; i++) T(mx - 2.2 + i * 2.1, my + 0.7 - i * 0.35, mx - 1.2 + i * 2.1, my + 0.7 - i * 0.35, mx - 1.7 + i * 2.1, my - 0.9 - i * 0.35, C.teeth);
      } else if (m === 'wobble') { for (let i = 0; i < 7; i++) gfx.px(X(mx - 3 + i), Y(my + (i % 2 ? 0.9 : -0.3)), ink); }
      else if (m === 'squiggle') { for (let i = 0; i < 7; i++) gfx.px(X(mx - 3 + i), Y(my + Math.sin(i * 1.5) * 1.1), ink); }
      else if (m === 'set') { R(mx - 2.8, my, mx + 2.8, my + 0.6, ink); }
      else if (m === 'snore') { E(mx + 0.6, my + 0.7, 2, 1.5, ink); }
      else if (m === 'eat') { const o = (Math.sin(t * 18) + 1) * 0.5; E(mx, my + 0.7, 2.6, 1.1 + o * 1.9, ink); }
      else if (m === 'o') { E(mx, my + 0.7, 1.8, 2, ink); }
      else { R(mx - 2.6, my, mx + 2.6, my + 0.8, ink); gfx.px(X(mx - 3.2), Y(my - 0.6), ink); gfx.px(X(mx + 3.2), Y(my - 0.6), ink); }

      if (p.blush !== false) {
        for (const bx0 of [headX - 7.5, headX + 11]) E(bx0, headY + 3.4, 2.2, 1.3, gfx.alpha(C.blush, 0.6));
      }
      if (p.face === 'cry') {
        for (const [cx, ph] of [[eL, 0], [eR, 0.5]]) {
          const k = (t * 1.6 + ph) % 1;
          E(cx + 1, ey + 3.4 + k * 6, 1.1, 1.7, C.tear);
        }
      }

      // ---- front arm ---------------------------------------------------------
      const sleeve = mat;
      const swing = step * 2.8 * moving;
      if (sitting) {
        limb(bodyX + 7, bodyY - 2, bodyX + 11.5, bodyY + 4, 4.8, sleeve);
        hand(bodyX + 12, bodyY + 5.5);
        hand(bodyX + 1, bodyY + 6);
        if (arm === 'controller') {
          const mash = Math.sin(t * 14) * 0.6;
          R(bodyX + 1, bodyY + 4.5, bodyX + 10.5, bodyY + 7, '#3a3a48');
          E(bodyX + 2, bodyY + 5.8, 1.7, 1.7, '#4a4a5c'); E(bodyX + 9.5, bodyY + 5.8, 1.7, 1.7, '#4a4a5c');
          gfx.px(X(bodyX + 8.8 + mash), Y(bodyY + 5.2), '#f05a4a');
          gfx.px(X(bodyX + 10), Y(bodyY + 6 + mash), '#5ad07a');
          L(bodyX + 5.5, bodyY + 5, bodyX + 5.5, bodyY + 6.6, '#20202c');
        }
      } else if (arm === 'up' || arm === 'reach') {
        limb(bodyX + 8, bodyY - 5, bodyX + 13, bodyY - 15, 4.6, sleeve); hand(bodyX + 13.5, bodyY - 16.5);
      } else if (arm === 'both_up' || arm === 'cheer') {
        limb(bodyX + 8, bodyY - 5, bodyX + 14, bodyY - 15, 4.6, sleeve); hand(bodyX + 14.5, bodyY - 16.5);
        limb(bodyX - 8, bodyY - 5, bodyX - 14, bodyY - 15, 4.6, sleeve); hand(bodyX - 14.5, bodyY - 16.5);
      } else if (arm === 'phone') {
        limb(bodyX + 7, bodyY - 4, bodyX + 11, bodyY - 11, 4.6, sleeve); hand(bodyX + 11.5, bodyY - 12);
        R(bodyX + 9.5, bodyY - 19, bodyX + 14, bodyY - 11, '#1a1a24');
        R(bodyX + 10, bodyY - 18, bodyX + 13.5, bodyY - 12, '#6fb0ff');
        gfx.px(X(bodyX + 11.8), Y(bodyY - 19.5), '#3a3a48');
      } else if (arm === 'hold' || arm === 'carry') {
        limb(bodyX + 8, bodyY - 3, bodyX + 14, bodyY - 6, 4.6, sleeve); hand(bodyX + 14.5, bodyY - 6.5);
        limb(bodyX - 8, bodyY - 3, bodyX - 13, bodyY - 6, 4.4, sleeve); hand(bodyX - 13.5, bodyY - 6.5, 2.6);
      } else if (arm === 'controller') {
        limb(bodyX + 8, bodyY - 3, bodyX + 7, bodyY + 3, 4.6, sleeve);
        hand(bodyX + 6.5, bodyY + 4); hand(bodyX - 5.5, bodyY + 4);
        R(bodyX - 4.5, bodyY + 2.4, bodyX + 5.5, bodyY + 5, '#3a3a48');
      } else if (arm === 'cover') {
        limb(bodyX + 8, bodyY - 5, bodyX + 10, bodyY - 13, 4.6, sleeve);
        hand(headX + 8.5, headY + 2.5, 3.2); hand(headX - 1, headY + 3.5, 3.2);
      } else if (arm === 'mop') {
        limb(bodyX + 8, bodyY - 5, bodyX + 15, bodyY - 10, 4.6, sleeve); hand(bodyX + 15.5, bodyY - 11);
      } else if (arm === 'wave') {
        const wv = Math.sin(t * 11) * 3;
        limb(bodyX + 9, bodyY - 5, bodyX + 17 + wv, bodyY - 14, 4.6, sleeve); hand(bodyX + 18 + wv, bodyY - 15.5);
      } else if (arm === 'belly') {
        limb(bodyX + 8, bodyY - 3, bodyX + 8, bodyY + 2, 4.6, sleeve);
        hand(bodyX + 8, bodyY + 3); hand(bodyX - 7, bodyY + 3);
      } else if (arm === 'pocket') {
        limb(bodyX + 8, bodyY - 4, bodyX + 9.5, bodyY + 3, 4.6, sleeve);
      } else {
        limb(bodyX + 9, bodyY - 5, bodyX + 13.5, bodyY + 3 + swing, 5, sleeve);
        hand(bodyX + 14, bodyY + 5 + swing);
      }
    }, { flip: p.flip, outline: p.outline === null ? null : (p.outline || art.INK), alpha: p.alpha });

    // ---- effects outside the ink line ----------------------------------------
    const ox = Math.round(x), oy = Math.round(y);
    const dir = p.flip ? -1 : 1;
    const hx = ox + dir * Math.round((2.2 + (p.headDX || 0)) * sx);
    const hy = oy + Math.round((-32 + (p.headDY || 0)) * sy);
    if (p.sweat > 0) art.effect('sweat', hx + dir * 11, hy - 7, t, 1);
    if (sleep) art.effect('zzz', hx + dir * 11, hy - 7, t, 1);
    if (p.fx) art.effect(p.fx, hx + dir * 9, hy - 12, t, 1);
    if (p.emote) {
      const bx = hx + dir * 13, by = hy - 18;
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
      if (this.emoteT > 0) { this.emoteT -= dt; if (this.emoteT <= 0) this.emote = null; }
      if (this.fxT > 0) { this.fxT -= dt; if (this.fxT <= 0) this.fx = null; }
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
  CH.ui.portraits.Chubby = (g, x, y, d) => {
    const face = (d && d.opts && d.opts.face) || 'normal';
    g.save();
    g.translate(x, y + 34);
    g.scale(1.15, 1.15);
    drawChubby(g, 0, 0, {
      face, outfit: CH.state.outfit || 'hoodie', noShadow: true, blink: false,
      arm: 'pocket', blush: true,
    });
    g.restore();
  };
})(window.CH);
