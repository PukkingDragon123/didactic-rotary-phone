// ============================================================================
// PEOPLE - the NPC cast: mom, doctor, nurses, the crew, and the endless queue.
//
// Every critter is assembled part by part into an offscreen buffer (08_art.js)
// so the whole silhouette gets one clean ink line. Inside that buffer the local
// axis is the same as Chubby's: origin at the feet, up the screen is negative
// y, and +x is always "facing right" - mirroring is the blit's job, so no pose
// is ever written twice. Species, outfit and accessory are authored part lists,
// not palette swaps: each named character has its own silhouette.
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, art = CH.art;

  // ---- shared colours --------------------------------------------------------
  const C = {
    eyeW: '#fdfaf2', pupil: '#221a2c', glint: '#ffffff',
    nose: '#2a1a22', tongue: '#e0708a', teeth: '#fff8ee',
    blush: '#e08a7e', tear: '#8fd0ff',
    white: '#f6f3ea', steel: '#aeb6c4', dark: '#23202c',
    gold: '#f2c94c', red: '#c8352b', glass: 'rgba(176,220,255,0.42)',
    metal: '#c9cedb', paper: '#f4f1e6', grey: '#cfc9bd',
  };
  CH.CRITTER_COL = C;

  // Materials are a pure function of their hex, so build each exactly once.
  const matCache = new Map();
  const RAMP = {
    fur: { dark: -38, darker: -66, light: 26 },
    cloth: { dark: -30, darker: -56, light: 24 },
    hard: { dark: -26, darker: -50, light: 30 },
  };
  function M(hex, kind) {
    const key = hex + '|' + (kind || 'cloth');
    let m = matCache.get(key);
    if (!m) { m = art.mat(hex, RAMP[kind] || RAMP.cloth); matCache.set(key, m); }
    return m;
  }

  // ============================================================================
  // SPECIES - silhouette data. ears / snout / tail are authored keywords, and
  // build decides the proportions so a moose is not a tall raccoon.
  // ============================================================================
  const SPECIES = {
    porcupine: { fur: '#a9784f', furL: '#dcb789', ears: 'nub', snout: 'round', quills: true, head: 1.0, build: 'soft' },
    beaver: { fur: '#7d4e2c', furL: '#c08a54', ears: 'round', snout: 'wide', teeth: true, tail: 'paddle', head: 1.0, build: 'tall' },
    goose: { fur: '#f3f0e7', furL: '#ffffff', ears: 'none', beak: 'goose', neck: 7, head: 0.95, build: 'slim', feet: 'web' },
    moose: { fur: '#6a4a30', furL: '#9b7854', ears: 'moose', snout: 'long', antlers: 'palm', head: 0.98, build: 'huge' },
    raccoon: { fur: '#8d8d97', furL: '#cdcdd6', ears: 'point', snout: 'point', mask: true, tail: 'ring', head: 1.0, build: 'scrawny' },
    bear: { fur: '#5b4531', furL: '#977553', ears: 'round', snout: 'round', head: 1.1, build: 'huge' },
    rabbit: { fur: '#ddd3c2', furL: '#fffdf6', ears: 'long', snout: 'bunny', tail: 'puff', head: 0.96, build: 'slim' },
    fox: { fur: '#d9722c', furL: '#f8f1e2', ears: 'tall', snout: 'point', tail: 'bushy', head: 0.98, build: 'slim' },
    deer: { fur: '#b07a4a', furL: '#e6cfa8', ears: 'leaf', snout: 'long', antlers: 'twig', head: 0.98, build: 'tall' },
    squirrel: { fur: '#a0522d', furL: '#e3b58c', ears: 'tuftpoint', snout: 'bunny', tail: 'squirrel', head: 0.95, build: 'slim' },
    owl: { fur: '#8a7050', furL: '#ded0aa', ears: 'tuft', beak: 'hook', bigEyes: true, head: 1.08, build: 'round' },
    cat: { fur: '#6d6d77', furL: '#c4c4cc', ears: 'point', snout: 'cat', tail: 'thin', head: 0.95, build: 'slim' },
    dog: { fur: '#c8a060', furL: '#f2e3c4', ears: 'floppy', snout: 'dog', tail: 'thin', head: 1.0, build: 'normal' },
    skunk: { fur: '#33333e', furL: '#f4f2ea', ears: 'nub', snout: 'small', tail: 'skunk', stripe: true, head: 0.96, build: 'slim' },
    hedgehog: { fur: '#3b6fd6', furL: '#f2c9a0', ears: 'nub', snout: 'point', quills: 'blue', head: 1.0, build: 'soft' },
  };
  CH.SPECIES = SPECIES;

  // ============================================================================
  // OUTFITS - kind drives the tailoring, the colours are just cloth.
  // ============================================================================
  const OUTFITS = {
    dress: { kind: 'cardigan', top: '#c05a86', topD: '#8b3a5f', bottom: '#6b4a63', skirt: '#6b5170', apron: '#e9dcbe', blouse: '#e7d2b4' },
    labcoat: { kind: 'labcoat', top: '#f3f4f7', topD: '#c3c6d2', bottom: '#39404f', shirt: '#8fb8d8', tie: '#3d5a86' },
    scrubs: { kind: 'scrubs', top: '#3fa79a', topD: '#26695f', bottom: '#348f84' },
    polo: { kind: 'polo', top: '#c8352b', topD: '#8b2118', bottom: '#2c2733', collar: '#f5c33b', hat: 'visor' },
    casual: { kind: 'tee', top: '#5a7ac8', topD: '#36508f', bottom: '#3a3a48' },
    suit: { kind: 'suit', top: '#2a3350', topD: '#171d33', bottom: '#242c46', tie: '#c8352b', shirt: '#f6f3ea' },
    gown: { kind: 'gown', top: '#c7dbe8', topD: '#93aec2', bottom: '#c7dbe8' },
    paramedic: { kind: 'utility', top: '#243a6a', topD: '#16254a', bottom: '#1e3058', stripe: '#f2f21a' },
    hoodie: { kind: 'hoodie', top: '#6a5acd', topD: '#483a94', bottom: '#3a3a48' },
    coat: { kind: 'coat', top: '#7a4a3a', topD: '#52301f', bottom: '#3a3a48' },
    cook: { kind: 'cook', top: '#f2f2f6', topD: '#c6c6d0', bottom: '#2a2530', apron: '#cfc0a0', hat: 'paper' },
    manager: { kind: 'manager', top: '#3a3a48', topD: '#22222c', bottom: '#22222c', tie: '#f5c33b', shirt: '#f6f3ea', hat: 'visor' },
    security: { kind: 'security', top: '#1e1e28', topD: '#0e0e16', bottom: '#1a1a24' },
    winter: { kind: 'winter', top: '#c8352b', topD: '#8f2419', bottom: '#3a3a48', hat: 'toque', scarf: '#e8d7a8' },
    corporate: { kind: 'suit', top: '#1c1c26', topD: '#0c0c14', bottom: '#181820', tie: '#d4af37', shirt: '#f6f3ea' },
    vest: { kind: 'vest', top: '#ff8800', topD: '#b85f00', bottom: '#3a3a48', stripe: '#e8e8b0', shirt: '#5a6270' },
    flannel: { kind: 'flannel', top: '#a8412f', topD: '#6e2418', bottom: '#3d4a5c' },
    sweater: { kind: 'sweater', top: '#4f7a5a', topD: '#2f5239', bottom: '#4a4256' },
    // somebody in town has, once again, left the house without his trousers
    hearts: { kind: 'hearts', top: '#f7f4ec', topD: '#d3cec0', bottom: '#f7f4ec', bareLegs: true, undies: '#eaf2ff', undiesD: '#c3d2ea', heart: '#e8496e' },
    overalls: { kind: 'overalls', top: '#4a6fa8', topD: '#2d4a78', bottom: '#4a6fa8', shirt: '#e2d6c0' },
    tracksuit: { kind: 'track', top: '#2f3a52', topD: '#1a2234', bottom: '#2f3a52', stripe: '#e8e8f0' },
    apronDress: { kind: 'cardigan', top: '#7a6ea8', topD: '#514a78', bottom: '#4a4256', apron: '#efe6d2', blouse: '#f3e6d8' },
  };
  CH.OUTFITS = OUTFITS;

  // ============================================================================
  // FACES - brow carries the expression at this size, so every face names one.
  // brow: [innerY, outerY, thickness]   (negative = raised)
  // ============================================================================
  const FACES = {
    normal: { brow: [-1, -1, 1], eye: 'open', mouth: 'flat' },
    happy: { brow: [-2, -2, 1], eye: 'arch', mouth: 'smile' },
    warm: { brow: [-2, -1, 1], eye: 'arch', mouth: 'smile' },
    grin: { brow: [-2, -3, 1], eye: 'open', mouth: 'grin' },
    proud: { brow: [-2, -2, 1], eye: 'arch', mouth: 'grin' },
    smug: { brow: [-3, 0, 1], eye: 'half', mouth: 'smirk' },
    sly: { brow: [-2, 1, 1], eye: 'half', mouth: 'smirk' },
    sad: { brow: [-3, 1, 1], eye: 'droop', mouth: 'frown' },
    cry: { brow: [-4, 2, 2], eye: 'squint', mouth: 'wail' },
    shock: { brow: [-4, -4, 1], eye: 'wide', mouth: 'gape' },
    scared: { brow: [-4, 0, 1], eye: 'wide', mouth: 'wobble' },
    worried: { brow: [-3, 1, 1], eye: 'open', mouth: 'wobble' },
    angry: { brow: [1, -3, 2], eye: 'glare', mouth: 'snarl' },
    annoyed: { brow: [0, -2, 1], eye: 'half', mouth: 'flat' },
    bored: { brow: [0, 1, 1], eye: 'half', mouth: 'flat' },
    stern: { brow: [1, -2, 2], eye: 'narrow', mouth: 'set' },
    tired: { brow: [-1, 2, 1], eye: 'bags', mouth: 'flat' },
    exhausted: { brow: [-1, 3, 1], eye: 'bags', mouth: 'gasp' },
    sick: { brow: [-2, 2, 1], eye: 'bags', mouth: 'wobble' },
    focused: { brow: [1, -2, 1], eye: 'narrow', mouth: 'set' },
    determined: { brow: [2, -2, 2], eye: 'narrow', mouth: 'set' },
    confused: { brow: [-3, 0, 1], eye: 'open', mouth: 'squiggle' },
    love: { brow: [-2, -2, 1], eye: 'heart', mouth: 'smile' },
    dead: { brow: [0, 0, 1], eye: 'cross', mouth: 'flat' },
    sleep: { brow: [-1, 0, 1], eye: 'shut', mouth: 'snore' },
    flat: { brow: [0, 0, 1], eye: 'half', mouth: 'flat' },
  };
  CH.CRITTER_FACES = FACES;

  // Authored quill fans. [baseX, baseY, tipX, tipY, baseWidth]
  const HEAD_QUILLS = [
    [-5.4, -4.2, -11.5, -9.5, 3.2],
    [-3.4, -6.4, -8.0, -14.5, 3.0],
    [-0.4, -7.6, -2.6, -15.5, 2.8],
    [2.6, -7.2, 1.6, -14.0, 2.4],
    [-7.0, -1.6, -13.5, -5.5, 2.8],
  ];
  const BODY_QUILLS = [
    [-5.0, -5.5, -11.5, -12.5, 3.6],
    [-6.6, -1.5, -14.0, -5.5, 3.2],
    [-7.0, 2.0, -13.0, -2.5, 2.8],
  ];

  // ---- one buffer for everybody: big enough for antlers, tails and beaks -----
  const BW = 98, BH = 90, AX = 49, AY = 80;

  // Drawing helpers bound to a local origin + squash, exactly as Chubby does.
  function ops(ax, ay, sx, sy) {
    const X = (v) => ax + v * sx, Y = (v) => ay + v * sy;
    return {
      X, Y,
      E: (cx, cy, rx, ry, c) => gfx.ellipse(X(cx), Y(cy), Math.max(0.6, rx * sx), Math.max(0.6, ry * sy), c),
      R: (x0, y0, x1, y1, c) => {
        const a = X(x0), b = X(x1), u = Y(y0), v = Y(y1);
        gfx.rect(Math.min(a, b), Math.min(u, v), Math.abs(b - a) + 1, Math.abs(v - u) + 1, c);
      },
      L: (x0, y0, x1, y1, c) => gfx.line(X(x0), Y(y0), X(x1), Y(y1), c),
      T: (x0, y0, x1, y1, x2, y2, c) => gfx.tri(X(x0), Y(y0), X(x1), Y(y1), X(x2), Y(y2), c),
      P: (px, py, c) => gfx.px(X(px), Y(py), c),
      O: (cx, cy, rx, ry, c) => gfx.ellipseOutline(X(cx), Y(cy), rx * sx, ry * sy, c),
    };
  }

  // ---- proportions -----------------------------------------------------------
  function metrics(p) {
    const sp = SPECIES[p.species || 'bear'] || SPECIES.bear;
    const H = p.height || 1, Wd = p.width || 1;
    const build = sp.build || 'normal';
    const legH = (build === 'slim' ? 13 : build === 'huge' ? 10.5 : build === 'scrawny' ? 12 : build === 'round' ? 9.5 : build === 'tall' ? 12.5 : 11.5) * H;
    const th = (build === 'huge' ? 20 : build === 'scrawny' ? 16.5 : build === 'slim' ? 17 : build === 'round' ? 18 : build === 'tall' ? 18.5 : 18) * H;
    const bw = (build === 'huge' ? 9.6 : build === 'scrawny' ? 6.0 : build === 'slim' ? 6.6 : build === 'round' ? 8.6 : build === 'tall' ? 7.0 : 7.4) * Wd;
    const hr = 8.8 * H * (sp.head || 1) * (p.headSize ? p.headSize / 5.5 : 1);
    const sitting = p.pose === 'sit';
    const hipY = sitting ? -(9.5 * H) : -legH;
    const shY = hipY - th;
    const neck = (sp.neck || 2) * H;
    return {
      sp, H, Wd, build, legH, th, bw, hr, neck, sitting,
      hipY, shY, bcy: hipY - th * 0.5,
      hx: 1.2 + (p.headDX || 0),
      hy: shY - neck - hr * 0.72 + (p.headDY || 0),
    };
  }
  CH.critterMetrics = metrics;

  // ============================================================================
  // THE RENDERER
  // ============================================================================
  function drawCritter(g, x, y, p = {}) {
    const t = (CH.game && CH.game.t) || 0;
    const sp = SPECIES[p.species || 'bear'] || SPECIES.bear;
    const of = Object.assign({}, OUTFITS[p.outfit || 'casual'] || OUTFITS.casual, p.outfitOverride || {});
    if (p.topColor) { of.top = p.topColor; of.topD = gfx.shade(p.topColor, -42); }
    if (p.bottomColor) of.bottom = p.bottomColor;
    const kind = of.kind || 'tee';

    const F = M(p.fur || sp.fur, 'fur');
    const FL = M(p.furL || sp.furL, 'fur');
    const TOP = M(of.top, 'cloth');
    const skirted = kind === 'cardigan' || kind === 'gown' || of.bottom === 'dress';
    const BOT = M(of.bottom === 'dress' ? of.top : (of.bottom || '#3a3a48'), 'cloth');
    const SHOE = M(of.shoe || (kind === 'labcoat' || kind === 'scrubs' || kind === 'cook' ? '#e8e6de' : '#2a2434'), 'cloth');
    const lum = (() => { const c = gfx.hex2rgb(p.fur || sp.fur); return (c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11) / 255; })();
    const BROW = lum < 0.34 ? gfx.shade(p.fur || sp.fur, 58) : gfx.mix(F.dd, '#241c2e', 0.55);
    const BARE_ARMS = { polo: 1, scrubs: 1, tee: 1, gown: 1, vest: 1, overalls: 1, track: 1, security: 1 };
    const bare = !!BARE_ARMS[kind];
    const gloves = kind === 'labcoat';
    const PAW = gloves ? M('#f0eee6', 'cloth') : F;

    const m = metrics(p);
    const sx = p.sx || 1, sy = p.sy || 1;
    const H = m.H, Wd = m.Wd, hr = m.hr, q = hr / 8.8;
    const walk = p.walk || 0, moving = p.moving || 0;
    const pose = p.pose || 'stand';
    const arm = p.arm || 'idle';
    const sleep = !!p.sleep;
    const faceKey = FACES[p.face] ? p.face : (sleep ? 'sleep' : 'normal');
    const fk = FACES[faceKey];

    // ---- contact shadow, always outside the ink line --------------------------
    if (!p.noShadow && pose !== 'inbed') {
      const rx = pose === 'lying' ? 19 * Wd : (m.sitting ? 9 : 8) * Wd * H;
      art.shadow(Math.round(x), Math.round(y) + 1, rx * sx, p.shadowAlpha !== undefined ? p.shadowAlpha : 0.28);
    }

    const blitOpts = { flip: p.flip, alpha: p.alpha, outline: p.outline === null ? null : (p.outline || art.INK) };

    // ========================================================================
    // FACE - shared by every pose so the character reads the same lying down.
    // ========================================================================
    function drawFace(o, hx, hy, opt = {}) {
      const { E, R, L, T, P } = o;
      const scale = opt.scale || 1;
      const rr = hr * scale, u = rr / 8.8;
      const ey = hy - rr * 0.16;
      const eB = hx - rr * 0.20, eF = hx + rr * 0.50;
      const big = sp.bigEyes;
      const erx = (big ? 3.0 : 2.35) * u, ery = (big ? 3.2 : 2.65) * u;
      const shut = sleep || opt.shut;
      const blinking = p.blink && !shut;
      const shape = shut ? 'shut' : blinking ? 'shut' : fk.eye;
      const lx = CH.clamp(p.lookX || 0, -1, 1), ly = CH.clamp(p.lookY || 0, -1, 1);

      function eye(cx) {
        switch (shape) {
          case 'shut':
            L(cx - erx, ey, cx + erx, ey, C.pupil);
            P(cx - erx, ey - 1, C.pupil);
            return;
          case 'arch':
            L(cx - erx, ey + 0.9 * u, cx - 0.6 * u, ey - 1.5 * u, C.pupil);
            L(cx - 0.6 * u, ey - 1.5 * u, cx + 0.6 * u, ey - 1.5 * u, C.pupil);
            L(cx + 0.6 * u, ey - 1.5 * u, cx + erx, ey + 0.9 * u, C.pupil);
            return;
          case 'cross':
            L(cx - erx, ey - ery * 0.8, cx + erx, ey + ery * 0.8, C.pupil);
            L(cx + erx, ey - ery * 0.8, cx - erx, ey + ery * 0.8, C.pupil);
            return;
          case 'heart':
            E(cx - 1.1 * u, ey - 0.6 * u, 1.4 * u, 1.3 * u, '#e8496e');
            E(cx + 1.1 * u, ey - 0.6 * u, 1.4 * u, 1.3 * u, '#e8496e');
            T(cx - 2.3 * u, ey - 0.1 * u, cx + 2.3 * u, ey - 0.1 * u, cx, ey + 2.6 * u, '#e8496e');
            P(cx - 1.2 * u, ey - 1.3 * u, '#ffd0dc');
            return;
          default: {
            const wide = shape === 'wide';
            const narrow = shape === 'narrow' || shape === 'glare';
            const half = shape === 'half' || shape === 'bags' || shape === 'droop' || shape === 'squint';
            const rx = wide ? erx * 1.12 : narrow ? erx * 0.98 : erx;
            const ry = wide ? ery * 1.25 : narrow ? ery * 0.6 : half ? ery * 0.74 : ery;
            E(cx, ey, rx, ry, C.eyeW);
            E(cx, ey - ry * 0.5, rx * 0.88, ry * 0.34, gfx.mix(C.eyeW, '#9a8fae', 0.4));
            const pr = (wide ? 1.15 : 1.5) * u;
            const px2 = cx + lx * 1.1 * u, py2 = ey + ly * 1.0 * u + (shape === 'droop' ? 0.6 * u : 0);
            E(px2, py2, pr, pr + 0.3 * u, C.pupil);
            P(px2 + pr * 0.8, py2 - pr * 0.9, C.glint);
            P(px2 + pr * 0.8 + 1, py2 - pr * 0.9, C.glint);
            if (narrow) R(cx - rx, ey - ry - 1, cx + rx, ey - ry * 0.25, opt.lid || F.base);
            if (half) R(cx - rx, ey - ry - 1, cx + rx, ey - ry * 0.55, opt.lid || F.base);
            if (shape === 'bags') {
              L(cx - rx * 0.8, ey + ry + 0.8, cx + rx * 0.8, ey + ry + 0.8, F.dd);
              L(cx - rx * 0.5, ey + ry + 1.9, cx + rx * 0.5, ey + ry + 1.9, F.d);
            }
            if (shape === 'squint') L(cx - rx, ey + 0.4, cx + rx, ey + 0.4, F.d);
            return;
          }
        }
      }
      eye(eB); eye(eF);

      // ---- EYEBROWS: the expression lives here ------------------------------
      if (shape !== 'heart') {
        const [bi, bo, bt] = fk.brow;
        const raise = (p.browRaise || 0);
        const bc = p.browColor || BROW;
        const bw2 = erx * 1.15;
        for (const [cx, inner] of [[eB, 1], [eF, -1]]) {
          const y0 = ey - ery - 2.1 * u + (inner > 0 ? bo : bi) * 0.8 * u - raise;
          const y1 = ey - ery - 2.1 * u + (inner > 0 ? bi : bo) * 0.8 * u - raise;
          for (let k = 0; k < bt; k++) L(cx - bw2, y0 + k, cx + bw2, y1 + k, bc);
        }
      }

      // ---- muzzle / beak ------------------------------------------------------
      const snout = sp.snout;
      const mzx = hx + rr * 0.52, mzy = hy + rr * 0.40;
      let mx = mzx + 0.4 * u, my = mzy + 1.9 * u;
      if (sp.beak) {
        const bl = sp.beak === 'goose' ? 4.6 * u : 3.4 * u;
        const bkx = hx + rr * 0.62;
        const open = (p.talk && Math.sin(t * 16) > 0) || fk.mouth === 'gape' ? 1.4 * u : 0;
        const BK = M(sp.beak === 'goose' ? '#f0a020' : '#d9a04a', 'hard');
        T(bkx - 2.2 * u, mzy - 2.2 * u, bkx + bl, mzy - 0.2 * u - open * 0.4, bkx - 2.2 * u, mzy + 0.8 * u, BK.base);
        T(bkx - 2.0 * u, mzy - 1.8 * u, bkx + bl * 0.8, mzy - 0.5 * u, bkx - 2.0 * u, mzy - 0.2 * u, BK.l);
        T(bkx - 2.1 * u, mzy + 1.0 * u + open, bkx + bl * 0.86, mzy + 0.4 * u + open, bkx - 2.1 * u, mzy + 2.6 * u + open, BK.d);
        if (open) T(bkx - 1.4 * u, mzy + 0.3 * u, bkx + bl * 0.7, mzy + 0.2 * u, bkx - 1.4 * u, mzy + 0.9 * u + open, '#7a3a34');
        P(bkx - 0.6 * u, mzy - 1.4 * u, BK.d);
        my = mzy; mx = bkx;
      } else if (snout) {
        const sw = snout === 'long' ? 5.2 : snout === 'wide' ? 5.0 : snout === 'round' ? 4.3 : snout === 'dog' ? 4.4 : 3.5;
        const sh = snout === 'long' ? 2.8 : snout === 'wide' ? 3.0 : snout === 'round' ? 3.3 : 2.5;
        const fwd = snout === 'long' ? 1.9 : snout === 'point' ? 1.2 : 0.6;
        const cxm = mzx + fwd * u;
        E(cxm, mzy + 0.5 * u, sw * u, sh * u, F.dd);
        E(cxm, mzy, sw * u * 0.96, sh * u * 0.94, FL.base);
        E(cxm - 0.6 * u, mzy - sh * 0.45 * u, sw * 0.6 * u, sh * 0.34 * u, FL.l);
        E(cxm, mzy + sh * 0.6 * u, sw * 0.7 * u, sh * 0.3 * u, FL.d);
        // nose
        const nx = cxm + sw * u * 0.62, ny = mzy - sh * u * 0.28;
        if (snout === 'point' || snout === 'cat') {
          T(nx - 1.4 * u, ny - 0.8 * u, nx + 1.2 * u, ny - 0.8 * u, nx - 0.1 * u, ny + 1.1 * u, C.nose);
        } else {
          E(nx, ny, 1.7 * u, 1.3 * u, C.nose);
          E(nx - 0.3 * u, ny - 0.5 * u, 0.8 * u, 0.5 * u, '#a28a98');
        }
        mx = cxm + sw * u * 0.1; my = mzy + sh * u * 0.62;
        if (sp.teeth) {
          R(nx - 1.4 * u, my + 0.3 * u, nx - 0.3 * u, my + 2.6 * u, C.teeth);
          R(nx + 0.1 * u, my + 0.3 * u, nx + 1.2 * u, my + 2.6 * u, C.teeth);
          L(nx - 0.3 * u, my + 0.3 * u, nx - 0.3 * u, my + 2.6 * u, '#cfc6b4');
        }
        if (p.mustache) {
          const mc = p.mustache === true ? F.dd : p.mustache;
          E(cxm - 0.4 * u, my + 0.3 * u, sw * 0.9 * u, 0.9 * u, mc);
        } else if (p.whiskers) {
          for (const d2 of [-1, 0.6]) L(cxm + 1.5 * u, mzy + d2 * u, cxm + sw * 1.6 * u, mzy + d2 * u - 1.2 * u, FL.d);
        }
      }

      // ---- mouth ---------------------------------------------------------------
      if (!sp.beak) {
        const mo = p.talk && Math.sin(t * 16) > 0 ? 'talk' : (p.mouth || fk.mouth);
        const ink = C.nose;
        const s2 = u;
        if (mo === 'talk') { E(mx, my + 0.8 * s2, 1.7 * s2, 1.6 * s2, ink); E(mx, my + 1.4 * s2, 1.0 * s2, 0.8 * s2, C.tongue); }
        else if (mo === 'smile') { L(mx - 2.2 * s2, my - 0.6 * s2, mx, my + 0.8 * s2, ink); L(mx, my + 0.8 * s2, mx + 2.2 * s2, my - 0.6 * s2, ink); }
        else if (mo === 'grin') { T(mx - 2.6 * s2, my - 0.6 * s2, mx + 2.6 * s2, my - 0.6 * s2, mx, my + 2.2 * s2, ink); R(mx - 2.0 * s2, my - 0.5 * s2, mx + 2.0 * s2, my + 0.1 * s2, C.teeth); }
        else if (mo === 'smirk') { L(mx - 1.6 * s2, my + 0.2 * s2, mx + 2.0 * s2, my - 1.1 * s2, ink); P(mx + 2.4 * s2, my - 1.6 * s2, ink); }
        else if (mo === 'frown') { L(mx - 2.2 * s2, my + 0.8 * s2, mx, my - 0.6 * s2, ink); L(mx, my - 0.6 * s2, mx + 2.2 * s2, my + 0.8 * s2, ink); }
        else if (mo === 'wail') { E(mx, my + 1.0 * s2, 2.4 * s2, 2.1 * s2, ink); E(mx, my + 1.6 * s2, 1.5 * s2, 1.2 * s2, C.tongue); }
        else if (mo === 'gape') { E(mx, my + 0.8 * s2, 2.1 * s2, 2.4 * s2, ink); E(mx, my + 1.6 * s2, 1.2 * s2, 1.1 * s2, C.tongue); }
        else if (mo === 'gasp') { E(mx, my + 0.6 * s2, 1.8 * s2, 1.5 * s2, ink); }
        else if (mo === 'snarl') {
          L(mx - 2.5 * s2, my + 0.9 * s2, mx + 2.5 * s2, my - 0.5 * s2, ink);
          for (let i = 0; i < 3; i++) T(mx - 1.8 * s2 + i * 1.7 * s2, my + 0.6 * s2 - i * 0.3 * s2, mx - 0.9 * s2 + i * 1.7 * s2, my + 0.6 * s2 - i * 0.3 * s2, mx - 1.35 * s2 + i * 1.7 * s2, my - 0.7 * s2 - i * 0.3 * s2, C.teeth);
        } else if (mo === 'wobble') { for (let i = 0; i < 6; i++) P(mx - 2.4 * s2 + i, my + (i % 2 ? 0.8 : -0.3) * s2, ink); }
        else if (mo === 'squiggle') { for (let i = 0; i < 6; i++) P(mx - 2.4 * s2 + i, my + Math.sin(i * 1.5) * 0.9 * s2, ink); }
        else if (mo === 'set') { R(mx - 2.2 * s2, my, mx + 2.2 * s2, my + 0.5 * s2, ink); }
        else if (mo === 'snore') { E(mx + 0.4 * s2, my + 0.5 * s2, 1.5 * s2, 1.2 * s2, ink); }
        else if (mo === 'o') { E(mx, my + 0.5 * s2, 1.4 * s2, 1.6 * s2, ink); }
        else { R(mx - 2.0 * s2, my, mx + 2.0 * s2, my + 0.6 * s2, ink); }
      }

      // ---- blush + tears -------------------------------------------------------
      if (p.blush !== false && !sp.beak && (faceKey === 'happy' || faceKey === 'warm' || faceKey === 'love' || p.blush)) {
        E(hx - rr * 0.55, hy + rr * 0.32, 1.9 * u, 1.1 * u, gfx.alpha(C.blush, 0.5));
        E(hx + rr * 0.82, hy + rr * 0.30, 1.6 * u, 1.0 * u, gfx.alpha(C.blush, 0.5));
      }
      if (faceKey === 'cry') {
        for (const [cx, ph] of [[eB, 0], [eF, 0.5]]) {
          const k = (t * 1.6 + ph) % 1;
          E(cx + 0.6 * u, ey + 2.6 * u + k * 5 * u, 0.9 * u, 1.4 * u, C.tear);
        }
      }

      // ---- eyewear ------------------------------------------------------------
      if (p.glasses) {
        const reading = p.glasses === 'reading';
        const frame = p.glassFrame || (reading ? '#6a5a44' : '#3f3a4c');
        const gy = reading ? ey + ery * 0.95 : ey;
        const rx2 = erx * (reading ? 1.18 : 1.24), ry2 = ery * (reading ? 0.62 : 0.96);
        for (const cx of [eB, eF]) {
          E(cx, gy, rx2, ry2, C.glass);
          o.O(cx, gy, rx2, ry2, frame);
        }
        L(eB + rx2 * 0.9, gy - ry2 * 0.4, eF - rx2 * 0.9, gy - ry2 * 0.4, frame);
        L(eB - rx2, gy - ry2 * 0.3, hx - rr * 0.8, gy - ry2 * 1.1, frame);
        P(eF - rx2 * 0.4, gy - ry2 * 0.4, '#ffffff');
        if (reading && p.chain !== false) {
          // beaded chain swinging down from both temples
          for (const [sgn, cx] of [[-1, eB - rx2], [1, eF + rx2]]) {
            for (let i = 1; i <= 5; i++) {
              const k = i / 5;
              P(cx + sgn * k * 1.6 * u, gy + k * k * 5.0 * u + k * 1.2 * u, '#c9b271');
            }
          }
        }
      }
    }

    // ========================================================================
    // HEAD ASSEMBLY
    // ========================================================================
    function drawEars(o, hx, hy, front) {
      const { E, R, L, T, P } = o;
      const u = hr / 8.8;
      const dk = front ? F.base : F.d, lt = front ? F.l : F.d;
      const inner = M(p.innerEar || '#d98f9a', 'fur');
      const bx = front ? hx + hr * 0.46 : hx - hr * 0.60;
      const by = hy - hr * 0.74;
      switch (sp.ears) {
        case 'round':
          E(bx, by, hr * 0.34, hr * 0.34, dk);
          if (front) E(bx + 0.4 * u, by + 0.3 * u, hr * 0.18, hr * 0.18, inner.d);
          break;
        case 'nub':
          E(bx, by + hr * 0.1, hr * 0.22, hr * 0.2, dk);
          break;
        case 'point':
          T(bx - 2.2 * u, by + 2.4 * u, bx + 2.2 * u, by + 1.6 * u, bx + 0.4 * u, by - 4.4 * u, dk);
          if (front) T(bx - 1.0 * u, by + 1.8 * u, bx + 1.2 * u, by + 1.4 * u, bx + 0.3 * u, by - 2.6 * u, inner.d);
          break;
        case 'tall':
          T(bx - 2.2 * u, by + 2.6 * u, bx + 2.4 * u, by + 1.4 * u, bx + 0.2 * u, by - 6.6 * u, dk);
          if (front) {
            T(bx - 0.9 * u, by + 1.8 * u, bx + 1.3 * u, by + 1.2 * u, bx + 0.2 * u, by - 3.6 * u, inner.d);
            T(bx - 1.6 * u, by - 3.2 * u, bx + 1.4 * u, by - 3.8 * u, bx + 0.2 * u, by - 6.6 * u, '#2f2630');
          }
          break;
        case 'tuftpoint':
          T(bx - 2.0 * u, by + 2.2 * u, bx + 2.0 * u, by + 1.6 * u, bx + 0.2 * u, by - 3.8 * u, dk);
          for (let i = -1; i <= 1; i++) L(bx + i * 1.2 * u, by - 2.0 * u, bx + i * 1.9 * u, by - 5.4 * u, lt);
          break;
        case 'long':
          E(bx, by - hr * 0.62, hr * 0.24, hr * 0.92, dk);
          if (front) E(bx + 0.2 * u, by - hr * 0.62, hr * 0.11, hr * 0.62, inner.base);
          break;
        case 'leaf':
          E(bx + (front ? 1.4 : -1.4) * u, by - hr * 0.2, hr * 0.32, hr * 0.42, dk);
          if (front) E(bx + 1.4 * u, by - hr * 0.2, hr * 0.15, hr * 0.24, inner.d);
          break;
        case 'moose':
          E(bx + (front ? 1.2 : -1.6) * u, by + hr * 0.16, hr * 0.42, hr * 0.24, dk);
          break;
        case 'floppy':
          E(bx + (front ? 1.2 : -1.2) * u, by + hr * 0.75, hr * 0.28, hr * 0.62, dk);
          break;
        case 'tuft':
          for (let i = 0; i < 2; i++) T(bx - 1.4 * u + i * 1.0 * u, by + 1.6 * u, bx + 0.8 * u + i * 1.0 * u, by + 1.6 * u, bx - 0.2 * u + i * 1.6 * u, by - 2.8 * u, dk);
          break;
        default: break;
      }
    }

    function spike(o, ox0, oy0, tx0, ty0, w0, cx, cy, qm) {
      const { E, T } = o;
      const bx0 = cx + ox0, by0 = cy + oy0;
      const dx0 = tx0 - ox0, dy0 = ty0 - oy0;
      const tx1 = bx0 + dx0, ty1 = by0 + dy0;
      const len = Math.hypot(dx0, dy0) || 1;
      const nx = (-dy0 / len) * w0 * 0.5, ny = (dx0 / len) * w0 * 0.5;
      T(bx0 - nx, by0 - ny, bx0 + nx, by0 + ny, tx1, ty1, qm.d);
      T(bx0 - nx * 0.9, by0 - ny * 0.9, bx0 + nx * 0.05, by0 + ny * 0.05, bx0 + dx0 * 0.82, by0 + dy0 * 0.82, qm.base);
      T(bx0 - nx * 0.5, by0 - ny * 0.5, bx0 - nx * 0.05, by0 - ny * 0.05, bx0 + dx0 * 0.6, by0 + dy0 * 0.6, qm.l);
      E(bx0 + dx0 * 0.93, by0 + dy0 * 0.93, w0 * 0.22, w0 * 0.22, qm.dd);
    }

    const quillM = M(p.quillColor || (sp.quills === 'blue' ? '#3f63c8' : '#d8cbae'), 'hard');
    const greyM = M('#cfcabe', 'hard');

    function drawHair(o, hx, hy, behind) {
      const { E, R, L, T, P } = o;
      const u = hr / 8.8;
      const hc = M(p.hairColor || '#4a2a1a', 'fur');
      if (p.hair === 'bun' && behind) {
        // grey-streaked quills gathered into a bun
        const bx = hx - hr * 0.72, by = hy - hr * 0.78;
        for (let i = 0; i < 3; i++) {
          const a = -2.5 + i * 0.45;
          spike(o, Math.cos(a) * hr * 0.55, Math.sin(a) * hr * 0.55, Math.cos(a) * hr * 1.25, Math.sin(a) * hr * 1.25, 2.4 * u, hx, hy, i === 1 ? greyM : quillM);
        }
        E(bx, by, hr * 0.52, hr * 0.5, quillM.d);
        E(bx, by - 0.5 * u, hr * 0.46, hr * 0.44, quillM.base);
        E(bx - 1.0 * u, by - 1.4 * u, hr * 0.22, hr * 0.14, greyM.l);
        for (let i = 0; i < 3; i++) L(bx - 2.0 * u + i * 2 * u, by + 2.2 * u, bx - 3.0 * u + i * 2.6 * u, by - 2.6 * u, quillM.dd);
      } else if (p.hair === 'long' && behind) {
        E(hx - hr * 0.35, hy + hr * 0.30, hr * 1.02, hr * 1.16, hc.d);
        E(hx - hr * 0.42, hy + hr * 0.24, hr * 0.92, hr * 1.06, hc.base);
        E(hx - hr * 0.72, hy - hr * 0.30, hr * 0.34, hr * 0.42, hc.l);
      } else if (p.hair === 'long' && !behind) {
        // fringe: a swept cap across the crown, clear of the eyes
        E(hx - hr * 0.04, hy - hr * 1.00, hr * 0.92, hr * 0.30, hc.base);
        E(hx - hr * 0.30, hy - hr * 1.10, hr * 0.46, hr * 0.16, hc.l);
        T(hx + hr * 0.60, hy - hr * 1.16, hx + hr * 0.98, hy - hr * 0.48, hx + hr * 0.34, hy - hr * 0.80, hc.d);
        for (let i = 0; i < 3; i++) L(hx - hr * 0.45 + i * hr * 0.4, hy - hr * 1.18, hx - hr * 0.26 + i * hr * 0.4, hy - hr * 0.80, hc.d);
      } else if (p.hair === 'bun' && !behind) {
        for (let i = 0; i < 3; i++) L(hx - hr * 0.5 + i * hr * 0.32, hy - hr * 0.94, hx - hr * 0.3 + i * hr * 0.32, hy - hr * 0.55, i === 1 ? greyM.base : quillM.d);
      }
    }

    function drawHat(o, hx, hy) {
      const { E, R, L, T, P } = o;
      const u = hr / 8.8;
      const hat = p.hat || of.hat;
      const top = hy - hr * 0.96 - (p.hair === 'long' ? hr * 0.18 : 0);
      if (hat === 'visor') {
        const VM = M(p.hatColor || of.visor || '#c8352b', 'cloth');
        const hs = p.hatScale || 1;
        R(hx - hr * 0.78 * hs, top + 0.6 * u, hx + hr * 0.78 * hs, top + 2.4 * u, VM.base);
        E(hx, top + 0.6 * u, hr * 0.80 * hs, 1.6 * u, VM.base);
        E(hx - hr * 0.2 * hs, top - 0.2 * u, hr * 0.4 * hs, 0.8 * u, VM.l);
        T(hx + hr * 0.5 * hs, top + 1.0 * u, hx + hr * (0.5 * hs + 0.85), top + 2.2 * u, hx + hr * 0.5 * hs, top + 3.0 * u, VM.d);
        R(hx - 1.2 * u, top + 0.8 * u, hx + 1.2 * u, top + 2.0 * u, C.gold);
      } else if (hat === 'paper') {
        const PM = M('#f6f4ee', 'cloth');
        R(hx - hr * 0.72, top - 3.4 * u, hx + hr * 0.72, top + 1.8 * u, PM.base);
        R(hx - hr * 0.72, top - 3.4 * u, hx + hr * 0.72, top - 2.6 * u, PM.d);
        for (let i = -2; i <= 2; i++) L(hx + i * 2.0 * u, top - 3.2 * u, hx + i * 2.0 * u, top + 1.4 * u, PM.d);
        E(hx, top + 1.6 * u, hr * 0.74, 1.0 * u, PM.l);
      } else if (hat === 'nurse') {
        const NM = M('#fbfaf6', 'cloth');
        T(hx - hr * 0.62, top + 1.6 * u, hx + hr * 0.62, top + 1.6 * u, hx - hr * 0.2, top - 3.4 * u, NM.base);
        R(hx - hr * 0.62, top + 0.6 * u, hx + hr * 0.62, top + 2.0 * u, NM.base);
        R(hx - hr * 0.62, top + 1.8 * u, hx + hr * 0.62, top + 2.2 * u, NM.d);
        R(hx - 0.6 * u, top - 1.4 * u, hx + 0.6 * u, top + 0.8 * u, C.red);
        R(hx - 1.6 * u, top - 0.6 * u, hx + 1.6 * u, top + 0.0 * u, C.red);
      } else if (hat === 'toque') {
        const TM = M(p.hatColor || '#c8352b', 'cloth');
        E(hx, top + 0.4 * u, hr * 0.92, hr * 0.5, TM.base);
        E(hx - hr * 0.3, top - 1.2 * u, hr * 0.34, hr * 0.16, TM.l);
        R(hx - hr * 0.94, top + 1.2 * u, hx + hr * 0.94, top + 3.2 * u, C.white);
        E(hx - hr * 0.1, top - 3.4 * u, 1.8 * u, 1.8 * u, C.white);
      } else if (hat === 'cap') {
        const CM = M(p.hatColor || '#3b6fd6', 'cloth');
        E(hx, top + 0.8 * u, hr * 0.88, hr * 0.52, CM.base);
        E(hx - hr * 0.3, top - 0.8 * u, hr * 0.36, hr * 0.18, CM.l);
        T(hx + hr * 0.4, top + 1.0 * u, hx + hr * 1.6, top + 2.4 * u, hx + hr * 0.4, top + 3.0 * u, CM.d);
        P(hx, top - 2.2 * u, CM.d);
      } else if (hat === 'hardhat') {
        const YM = M('#f5c33b', 'hard');
        E(hx, top + 1.0 * u, hr * 0.9, hr * 0.62, YM.base);
        E(hx - hr * 0.3, top - 1.0 * u, hr * 0.34, hr * 0.2, YM.l);
        R(hx - hr * 1.15, top + 1.6 * u, hx + hr * 1.3, top + 2.6 * u, YM.base);
        R(hx - hr * 0.1, top - 2.6 * u, hx + hr * 0.1, top + 1.2 * u, YM.d);
      } else if (hat === 'crown') {
        R(hx - hr * 0.6, top - 1.4 * u, hx + hr * 0.6, top + 1.0 * u, C.gold);
        for (const dx0 of [-hr * 0.55, 0, hr * 0.55]) T(hx + dx0 - 1.4 * u, top - 1.4 * u, hx + dx0 + 1.4 * u, top - 1.4 * u, hx + dx0, top - 4.6 * u, C.gold);
        P(hx - 2 * u, top - 0.2 * u, C.red); P(hx + 2 * u, top - 0.2 * u, C.red);
      } else if (hat === 'scrubcap') {
        const SM = M(p.hatColor || '#5b7fc4', 'cloth');
        E(hx, top + 1.0 * u, hr * 0.92, hr * 0.52, SM.base);
        E(hx - hr * 0.28, top - 0.6 * u, hr * 0.38, hr * 0.18, SM.l);
        R(hx - hr * 0.94, top + 1.4 * u, hx + hr * 0.94, top + 2.6 * u, SM.d);
        for (let i = -2; i <= 2; i++) P(hx + i * 2.4 * u, top + 0.2 * u, SM.l);
      } else if (hat === 'hairnet') {
        o.O(hx, hy - hr * 0.62, hr * 0.92, hr * 0.52, 'rgba(250,250,250,0.75)');
      }
      // headset is separate so it can ride on top of any hat
      if (p.headset || p.hat === 'headset' || arm === 'headset') {
        const band = '#26262e';
        for (let i = 0; i <= 8; i++) {
          const a = Math.PI * (0.06 + i / 8 * 0.88);
          P(hx - Math.cos(a) * hr * 0.98, hy - hr * 0.98 - Math.sin(a) * hr * 0.26 + hr * 0.12, band);
        }
        E(hx - hr * 0.88, hy - hr * 0.08, 1.9 * u, 2.4 * u, band);
        E(hx - hr * 0.88, hy - hr * 0.08, 1.0 * u, 1.4 * u, '#4a4a58');
        for (let i = 0; i <= 6; i++) {
          const k = i / 6;
          P(hx - hr * 0.8 + k * hr * 1.35, hy + hr * 0.02 + k * k * hr * 0.55, band);
        }
        E(hx + hr * 0.6, hy + hr * 0.62, 1.4 * u, 1.1 * u, '#33333d');
        P(hx + hr * 0.6, hy + hr * 0.62, '#7ad0a0');
      }
    }

    function drawHead(o, hx, hy, opt = {}) {
      const { E, R, L, T, P } = o;
      const u = hr / 8.8;
      // quills behind the head
      if (sp.quills && p.hair !== 'bun') for (const qq of HEAD_QUILLS) spike(o, qq[0] * u, qq[1] * u, qq[2] * u, qq[3] * u, qq[4] * u, hx, hy, quillM);
      drawHair(o, hx, hy, true);
      drawEars(o, hx, hy, false);
      // skull
      E(hx, hy + 0.8 * u, hr * 0.98, hr * 0.94, F.d);
      E(hx, hy, hr * 0.96, hr * 0.9, F.base);
      E(hx - hr * 0.22, hy - hr * 0.52, hr * 0.5, hr * 0.26, F.l);
      if (sp.mask) {
        // raccoon bandit mask across the eyes
        E(hx + hr * 0.12, hy - hr * 0.12, hr * 0.88, hr * 0.38, '#2d2c36');
        E(hx + hr * 0.1, hy - hr * 0.42, hr * 0.7, hr * 0.14, '#3d3c48');
        E(hx + hr * 0.46, hy - hr * 0.62, hr * 0.44, hr * 0.2, FL.base);
      }
      if (sp.stripe) {
        // white blaze from the crown down the back of the skull
        T(hx - hr * 0.44, hy - hr * 1.0, hx - hr * 0.02, hy - hr * 0.98, hx - hr * 0.94, hy + hr * 0.2, FL.base);
        T(hx - hr * 0.34, hy - hr * 0.96, hx - hr * 0.08, hy - hr * 0.94, hx - hr * 0.74, hy, FL.l);
        E(hx + hr * 0.62, hy + hr * 0.5, hr * 0.24, hr * 0.2, FL.base);
      }
      if (sp.bigEyes) {
        // owl facial disc
        E(hx + hr * 0.16, hy - hr * 0.04, hr * 0.86, hr * 0.74, FL.base);
        E(hx + hr * 0.16, hy - hr * 0.3, hr * 0.7, hr * 0.3, FL.l);
      }
      if (sp.antlers) drawAntlers(o, hx, hy);
      drawEars(o, hx, hy, true);
      drawFace(o, hx, hy, opt);
      drawHair(o, hx, hy, false);
      drawHat(o, hx, hy);
    }

    function drawAntlers(o, hx, hy) {
      const { E, R, L, T, P } = o;
      const u = hr / 8.8;
      const A = M('#cbb794', 'hard');
      const top = hy - hr * 0.82;
      if (sp.antlers === 'palm') {
        // moose: broad palmate paddles with finger tines
        for (const s of [-1, 1]) {
          const bx = hx + s * hr * 0.52, far = s < 0 ? 1 : 1;
          L(bx, top, bx + s * 4 * u, top - 4 * u, A.d);
          L(bx + 1 * s * u, top, bx + s * 5 * u, top - 4 * u, A.base);
          const px2 = bx + s * 6.5 * u, py2 = top - 6.5 * u;
          E(px2, py2, 4.6 * u, 3.0 * u, A.d);
          E(px2, py2 - 0.6 * u, 4.2 * u, 2.6 * u, A.base);
          E(px2 - s * 1.2 * u, py2 - 1.4 * u, 2.4 * u, 1.1 * u, A.l);
          for (let i = 0; i < 4; i++) {
            const ax = px2 + s * (0.6 + i * 1.5) * u, ay = py2 - 2.4 * u - i * 0.5 * u;
            T(ax - 1.0 * u, ay + 0.6 * u, ax + 1.0 * u, ay + 0.6 * u, ax + s * 0.4 * u, ay - (2.6 + i * 0.5) * u, A.base);
            T(ax - 0.6 * u, ay + 0.4 * u, ax + 0.2 * u, ay + 0.4 * u, ax + s * 0.2 * u, ay - (2.0 + i * 0.4) * u, A.l);
          }
        }
      } else {
        for (const s of [-1, 1]) {
          const bx = hx + s * hr * 0.44;
          L(bx, top, bx + s * 2.6 * u, top - 7 * u, A.base);
          L(bx + s * 1.6 * u, top - 4 * u, bx + s * 5.2 * u, top - 6.4 * u, A.base);
          L(bx + s * 2.6 * u, top - 7 * u, bx + s * 4.4 * u, top - 9.6 * u, A.base);
          P(bx + s * 2.6 * u, top - 7 * u, A.l);
        }
      }
    }

    // ========================================================================
    // POSE: LYING (gurney / floor)
    // ========================================================================
    if (pose === 'lying') {
      art.blit(x, y, BW, BH, AX, AY, () => {
        const o = ops(AX, AY, sx, sy);
        const { E, R, L, T, P } = o;
        const u = hr / 8.8;
        const cy = -5.5 * H;
        const W2 = Wd, sc = 0.95;
        // legs stretched out to the left, knees slightly up, feet flopping outward
        E(-11 * W2, cy + 1.6, 6.4 * W2, 3.6 * H, BOT.dd);
        E(-11 * W2, cy + 0.6, 5.9 * W2, 3.2 * H, BOT.d);
        E(-12 * W2, cy - 1.8, 4.2 * W2, 1.4, BOT.base);
        E(-20 * W2, cy + 1.2, 6.2 * W2, 2.9 * H, BOT.dd);
        E(-20 * W2, cy + 0.3, 5.7 * W2, 2.5 * H, BOT.d);
        L(-6 * W2, cy - 2.6, -6 * W2, cy + 4, BOT.line);
        E(-25.6 * W2, cy - 1.0, 2.0, 2.6, SHOE.d);
        E(-25.0 * W2, cy + 2.2, 2.2, 2.4, SHOE.base);
        // hips and torso
        E(-3 * W2, cy + 1, 10.5 * W2, 5.4 * H, TOP.d);
        E(-3 * W2, cy - 0.2, 10.0 * W2, 5.0 * H, TOP.base);
        E(5 * W2, cy - 0.6, 6.4 * W2, 4.6 * H, TOP.d);
        E(5 * W2, cy - 1.6, 6.0 * W2, 4.2 * H, TOP.base);
        E(-4 * W2, cy - 3.6, 7.0 * W2, 1.6, TOP.l);
        if (kind === 'gown' || kind === 'cardigan') {
          for (let i = -3; i <= 2; i++) P(-4 * W2 + i * 3.4, cy + 1.6, TOP.d);
          for (let i = -3; i <= 1; i++) P(-6 * W2 + i * 3.4, cy - 1.8, TOP.d);
        }
        // the near arm laid across the belly
        E(0 * W2, cy + 2.6, 5.4, 2.3, TOP.dd);
        E(0 * W2, cy + 2.0, 5.0, 1.9, TOP.d);
        E(-3.6 * W2, cy + 3.4, 2.1, 1.8, PAW.d);
        E(-3.8 * W2, cy + 2.9, 1.6, 1.4, PAW.base);
        // head on the pillow
        const hx2 = 11.5 * W2 + hr * 0.5, hy2 = cy - 4.0 * H;
        drawHead(o, hx2, hy2, { shut: !p.eyesOpen, scale: sc });
      }, blitOpts);
      drawOverlays(x, y, -5.5 * H - 4 * H - hr);
      return;
    }

    // ========================================================================
    // POSE: IN BED (head and shoulders above a blanket the scene draws)
    // ========================================================================
    if (pose === 'inbed') {
      art.blit(x, y, BW, BH, AX, AY, () => {
        const o = ops(AX, AY, sx, sy);
        const { E, R, L, T, P } = o;
        const u = hr / 8.8;
        // shoulders and gown collar above the blanket line
        E(-0.5, 5, 11.5 * Wd, 6.0, TOP.d);
        E(-0.5, 3.6, 11.0 * Wd, 5.4, TOP.base);
        E(-4.0, 0.8, 6.0 * Wd, 2.2, TOP.l);
        E(7.5 * Wd, 2.4, 3.2 * Wd, 3.4, TOP.d);
        E(-7.5 * Wd, 2.4, 3.0 * Wd, 3.2, TOP.dd);
        if (kind === 'gown') { for (let i = -2; i <= 2; i++) { P(i * 3.6, 2.5, TOP.d); P(i * 3.6 + 1.8, 5.5, TOP.d); } }
        T(-3.0, -0.6, 3.4, -0.6, 0.2, 3.6, TOP.dd);
        R(-2.0, -2.0, 2.4, 0.6, FL.d);
        const hx2 = 0.8, hy2 = -2.4 - hr * 0.94;
        drawHead(o, hx2, hy2, { scale: 0.96 });
      }, blitOpts);
      drawOverlays(x, y, -2.4 - hr * 1.94);
      return;
    }

    // ========================================================================
    // POSE: STANDING / SITTING
    // ========================================================================
    const bob = Math.abs(Math.sin(walk)) * 1.2 * moving;
    const lean = moving * 0.8;
    const hipY = m.hipY, shY = m.shY - bob, bcy = m.bcy - bob * 0.6;
    const bw = m.bw;
    const hx = m.hx + lean * 0.6, hy = m.hy - bob;
    const step = Math.sin(walk), step2 = Math.sin(walk + Math.PI);

    art.blit(x, y, BW, BH, AX, AY, () => {
      const o = ops(AX, AY, sx, sy);
      const { E, R, L, T, P } = o;
      const u = hr / 8.8;

      // A limb is a tapered quad plus a round joint. Sleeves in the same cloth
      // as the torso would vanish into it, so the inner edge gets an ink line.
      function limb(x0, y0, x1, y1, w0, mt, noEdge) {
        const dx0 = x1 - x0, dy0 = y1 - y0, len = Math.hypot(dx0, dy0) || 1;
        const nx = (-dy0 / len) * w0 * 0.5, ny = (dx0 / len) * w0 * 0.5;
        T(x0 - nx, y0 - ny, x0 + nx, y0 + ny, x1 + nx, y1 + ny, mt.base);
        T(x0 - nx, y0 - ny, x1 - nx, y1 - ny, x1 + nx, y1 + ny, mt.base);
        T(x0 - nx, y0 - ny, x1 - nx, y1 - ny, x1 + nx * 0.1, y1 + ny * 0.1, mt.d);
        E((x0 + x1) / 2, (y0 + y1) / 2, w0 * 0.5, w0 * 0.5, mt.base);
        if (!noEdge) {
          const sgn = (x0 + x1) >= 0 ? 1 : -1;
          L(x0 - sgn * w0 * 0.46, y0 + 1, x1 - sgn * w0 * 0.46, y1 - 0.5, art.INK_SOFT);
        }
      }
      function hand(hx2, hy2, r, mt) {
        mt = mt || PAW; r = r || 2.3 * Wd;
        if (!bare) E(hx2, hy2 - r * 0.9, r * 0.95, r * 0.6, TOP.dd);
        E(hx2, hy2, r, r, mt.d);
        E(hx2 - 0.3, hy2 - 0.5, r - 0.7, r - 0.7, mt.base);
        E(hx2 - 0.5, hy2 - r * 0.5, r * 0.45, r * 0.3, mt.l || mt.base);
      }

      // ---- TAIL (behind everything) -----------------------------------------
      const tcy = bcy + m.th * 0.22;
      if (sp.tail === 'paddle') {
        const PT = M('#4a3320', 'hard');
        E(-bw - 5.5, tcy + 3, 7.5, 3.4, PT.d);
        E(-bw - 5.5, tcy + 2.4, 7.0, 3.0, PT.base);
        for (let i = -2; i <= 2; i++) L(-bw - 5.5 + i * 2.6, tcy - 0.2, -bw - 5.5 + i * 2.6, tcy + 5.2, PT.dd);
        for (let j = -1; j <= 1; j++) L(-bw - 12, tcy + 2.4 + j * 2, -bw + 1, tcy + 2.4 + j * 2, PT.dd);
      } else if (sp.tail === 'bushy') {
        const sw2 = Math.sin(t * 2.2 + walk) * 1.6;
        E(-bw - 4, tcy - 1 + sw2, 5.4, 7.2, F.d);
        E(-bw - 4.4, tcy - 2 + sw2, 4.8, 6.4, F.base);
        E(-bw - 5.6, tcy - 4.5 + sw2, 2.6, 2.6, F.l);
        E(-bw - 5.0, tcy - 8.4 + sw2, 3.2, 3.0, FL.base);
      } else if (sp.tail === 'skunk') {
        const sw2 = Math.sin(t * 2.0) * 1.2;
        E(-bw - 4, tcy - 5 + sw2, 4.6, 9.0, F.d);
        E(-bw - 4.4, tcy - 6 + sw2, 4.0, 8.4, F.base);
        E(-bw - 5.4, tcy - 8 + sw2, 2.0, 5.4, FL.base);
        E(-bw - 4.6, tcy - 14 + sw2, 3.0, 2.6, FL.base);
      } else if (sp.tail === 'ring') {
        const sw2 = Math.sin(t * 2.6) * 1.6;
        const DK = M('#3a3a46', 'fur');
        for (let i = 6; i >= 0; i--) {
          const k = i / 6;
          const px2 = -bw - 2.5 - Math.sin(k * 1.5) * 6.5, py2 = tcy + 3 - k * 13 + sw2 * k;
          const band = i % 2 ? DK : FL;
          E(px2, py2, 3.6 - k * 0.7, 3.0 - k * 0.5, band.d);
          E(px2 - 0.4, py2 - 0.5, 3.1 - k * 0.7, 2.5 - k * 0.5, band.base);
        }
      } else if (sp.tail === 'squirrel') {
        const sw2 = Math.sin(t * 2.4) * 1.5;
        E(-bw - 4, tcy - 6 + sw2, 4.2, 8.6, F.d);
        E(-bw - 4.5, tcy - 7 + sw2, 3.6, 8.0, F.base);
        E(-bw - 3.5, tcy - 14 + sw2, 3.4, 3.2, FL.base);
      } else if (sp.tail === 'puff') {
        E(-bw - 1.5, tcy + 3, 2.8, 2.6, FL.d);
        E(-bw - 1.8, tcy + 2.4, 2.3, 2.1, FL.base);
      } else if (sp.tail === 'thin') {
        const sw2 = Math.sin(t * 2.5) * 2;
        for (let i = 0; i <= 6; i++) {
          const k = i / 6;
          E(-bw - 1 - k * 5, tcy - k * 8 + Math.sin(k * 3 + t * 2.5) * sw2 * k, 1.3 - k * 0.5, 1.3 - k * 0.5, F.d);
        }
      }
      // porcupine back quills
      if (sp.quills && p.hair !== 'bun') for (const qq of BODY_QUILLS) spike(o, qq[0] * Wd, qq[1] * H, qq[2] * Wd, qq[3] * H, qq[4], 0, bcy, quillM);

      // ---- BACK ARM ---------------------------------------------------------
      const shYa = shY + 3.4 * H;
      const sxo = bw * 0.86;
      const reach = bw * (kind === 'labcoat' || kind === 'coat' ? 1.42 : kind === 'cook' || kind === 'winter' ? 1.3 : 1.2);
      const swing = step * 2.6 * moving, bswing = step2 * 2.6 * moving;
      const aw = 3.5 * Wd * H;
      const SC = of.sleeveColor ? M(of.sleeveColor, 'cloth') : TOP;
      const SLV = bare ? F : { base: SC.d, d: SC.dd, l: SC.base };
      const SLVB = bare ? { base: F.d, d: F.dd, l: F.base } : { base: SC.dd, d: SC.line, l: SC.d };
      const backHand = gloves ? PAW : { base: PAW.d, d: PAW.dd };
      if (arm === 'hips') {
        limb(-sxo, shYa, -reach - 3.2, shYa + 6 * H, aw, SLVB);
        limb(-reach - 3.2, shYa + 6 * H, -bw * 0.55, hipY + 1.5, aw * 0.9, SLVB);
        hand(-bw * 0.55, hipY + 1.5, 2.1 * Wd, backHand);
      } else if (arm === 'crossed') {
        limb(-sxo, shYa, 1.5, shYa + 5 * H, aw, SLVB, true);
        hand(2.5, shYa + 5.4 * H, 2.2 * Wd, backHand);
      } else if (arm === 'up' || arm === 'cheer') {
        limb(-sxo, shYa, -reach - 2, shY - 8 * H, aw, SLVB);
        hand(-reach - 2.5, shY - 9.5 * H, 2.2 * Wd, backHand);
      } else if (arm === 'hold' || arm === 'tray' || arm === 'carry') {
        limb(-sxo, shYa, -bw * 0.45, shYa + 7 * H, aw, SLVB);
        hand(-bw * 0.3, shYa + 8 * H, 2.2 * Wd, backHand);
      } else if (arm === 'pocket') {
        limb(-sxo, shYa, -reach * 0.94, hipY + 2, aw, SLVB);
      } else {
        limb(-sxo, shYa, -reach + bswing * 0.6, hipY + 2.5 + bswing, aw, SLVB);
        hand(-reach - 0.4 + bswing * 0.6, hipY + 4 + bswing, 2.1 * Wd, backHand);
      }
      if (!bare) E(-sxo - 0.6, shY + 4.6 * H, 2.7 * Wd, 3.8 * H, TOP.dd);
      else E(-sxo - 0.4, shY + 4.2 * H, 2.6 * Wd, 3.2 * H, TOP.dd);

      // ---- LEGS --------------------------------------------------------------
      const legM = (skirted || of.bareLegs) ? F : BOT;
      const legW = 3.4 * Wd * H;
      if (!m.sitting) {
        const draw1 = (sgn, sw, front) => {
          const hipX = sgn * bw * 0.38;
          const lift = Math.max(0, sw) * 2.0 * moving;
          const fx = hipX + sw * 3.0 * moving;
          const mt = front ? legM : { base: legM.d, d: legM.dd };
          limb(hipX, hipY + 1, fx, -2 - lift, legW, mt);
          const sm = front ? SHOE : { base: SHOE.d, d: SHOE.dd, l: SHOE.d };
          if (sp.feet === 'web') {
            const WB = M('#e89430', 'hard');
            T(fx - 1.5, -3 - lift, fx + 3.8, -0.4 - lift, fx - 1.5, -0.4 - lift, front ? WB.base : WB.d);
            E(fx, -1 - lift, 2.6 * Wd, 1.2, front ? WB.base : WB.d);
          } else {
            E(fx + 0.5, -1 - lift, 2.9 * Wd, 1.7, sm.d);
            E(fx + 0.3, -2 - lift, 2.4 * Wd, 1.2, sm.base);
            if (front) E(fx - 0.3, -2.6 - lift, 1.4 * Wd, 0.7, SHOE.l);
          }
        };
        draw1(-1, step2, false);
        draw1(1, step, true);
      } else {
        // seated: thighs forward from the hip, shins straight down to the floor
        const kneeX = 9.5 * Wd, footY = -1;
        limb(-bw * 0.25, hipY + 1.5, kneeX - 1, hipY + 0.5, legW * 1.1, { base: legM.d, d: legM.dd });
        limb(kneeX - 1.5, hipY + 0.5, kneeX - 0.5, footY - 1.5, legW * 0.95, { base: legM.d, d: legM.dd });
        E(kneeX + 0.5, footY - 0.5, 2.8 * Wd, 1.7, SHOE.d);
        limb(-bw * 0.15, hipY + 3, kneeX, hipY + 2.5, legW * 1.1, legM);
        limb(kneeX - 0.5, hipY + 2.5, kneeX + 1.5, footY - 1, legW * 0.95, legM);
        E(kneeX + 2.5, footY + 0.5, 2.9 * Wd, 1.8, SHOE.base);
        E(kneeX + 2.2, footY - 0.6, 2.3 * Wd, 1.0, SHOE.l);
      }

      // ---- SKIRT (before torso so the torso sits on top of the waist) ---------
      if (skirted) {
        const SK = of.skirt ? M(of.skirt, 'cloth') : TOP;
        const sy0 = hipY - 1, sy1 = hipY + (kind === 'gown' ? 3.5 : 4.5) * H;
        const fl = bw * 1.26;
        T(-bw * 0.96, sy0 - 4, bw * 0.96, sy0 - 4, 0, sy1, SK.d);
        T(-fl, sy1, fl, sy1, 0, sy0 - 5, SK.d);
        T(-fl * 0.94, sy1 - 1, fl * 0.9, sy1 - 1, 0.4, sy0 - 4, SK.base);
        for (let i = -2; i <= 2; i++) L(i * fl * 0.35, sy1 - 1, i * fl * 0.16, sy0 - 2, SK.d);
        R(-fl, sy1 - 1, fl, sy1, SK.dd);
        E(-fl * 0.4, sy1 - 4, fl * 0.35, 2.2, SK.l);
      }

      // ---- TORSO -------------------------------------------------------------
      const thh = m.th * 0.5 + bob * 0.4;
      E(0, bcy + 1, bw, thh, TOP.d);
      E(0.4, bcy, bw - 0.6, thh - 0.8, TOP.base);
      E(0.4, shY + thh * 0.42, bw * 0.84, thh * 0.42, TOP.base);
      E(1.8, bcy - thh * 0.32, bw * 0.48, thh * 0.26, TOP.l);
      E(0, hipY - 1.6, bw * 0.86, thh * 0.24, TOP.d);

      drawOutfit(o, { bw, bcy, shY, hipY, thh, limb, hand, u });

      // ---- NECK (goose stands on a long one) ---------------------------------
      if (m.neck > 3) {
        const nw = 3.4 * Wd;
        for (let i = 0; i <= 8; i++) {
          const k = i / 8;
          const nx = k * k * 2.2, ny = shY - k * (m.neck + hr * 0.5);
          E(nx, ny, nw - k * 0.6, nw * 0.62, F.d);
          E(nx + 0.3, ny, nw - 0.8 - k * 0.6, nw * 0.56, F.base);
        }
      } else if (m.neck > 0.5) {
        E(hx - 0.4, shY - 0.5, 3.0 * Wd, 2.4 * H, F.d);
      }

      // ---- HEAD ---------------------------------------------------------------
      drawHead(o, hx, hy);

      // ---- FRONT ARM + PROP ----------------------------------------------------
      const wv = Math.sin(t * 11) * 3;
      if (arm === 'hips') {
        limb(sxo, shYa, reach + 3.6, shYa + 6 * H, aw, SLV);
        limb(reach + 3.6, shYa + 6 * H, bw * 0.55, hipY + 1.5, aw * 0.9, SLV);
        hand(bw * 0.55, hipY + 1.5, 2.3 * Wd);
      } else if (arm === 'crossed') {
        limb(sxo, shYa + 1, -1.5, shYa + 6.4 * H, aw, SLV, true);
        hand(-2.5, shYa + 6.8 * H, 2.4 * Wd);
      } else if (arm === 'wave') {
        limb(sxo, shYa, reach + 4 + wv, shY - 7 * H, aw, SLV);
        hand(reach + 4.6 + wv, shY - 8.8 * H, 2.4 * Wd);
      } else if (arm === 'up' || arm === 'cheer') {
        limb(sxo, shYa, reach + 2.5, shY - 8 * H, aw, SLV);
        hand(reach + 3, shY - 9.5 * H, 2.4 * Wd);
      } else if (arm === 'point') {
        limb(sxo, shYa, reach + 6, shYa - 3 * H, aw, SLV);
        hand(reach + 7, shYa - 3.6 * H, 2.2 * Wd);
        R(reach + 8, shYa - 4.4 * H, reach + 11, shYa - 3.6 * H, PAW.base);
      } else if (arm === 'clipboard') {
        limb(sxo, shYa, reach + 1.5, shYa + 5 * H, aw, SLV);
        const cx = reach + 3, cy2 = shYa + 3.5 * H;
        R(cx - 3, cy2 - 5, cx + 4, cy2 + 5, M('#8a6a3a', 'hard').d);
        R(cx - 2.4, cy2 - 4.4, cx + 3.4, cy2 + 4.4, C.paper);
        R(cx - 2, cy2 - 5.4, cx + 2, cy2 - 4.2, C.steel);
        for (let i = 0; i < 4; i++) L(cx - 1.8, cy2 - 2.6 + i * 2, cx + 2.4, cy2 - 2.6 + i * 2, '#9aa2b4');
        hand(cx - 2.6, cy2 + 3.4, 2.1 * Wd);
      } else if (arm === 'tray') {
        limb(sxo, shYa, reach + 4, shYa + 2.5 * H, aw, SLV);
        hand(reach + 4.6, shYa + 3 * H, 2.2 * Wd);
        const tx = reach + 4.5, ty = shYa + 0.6 * H;
        R(tx - 6, ty - 1, tx + 7, ty + 0.4, M('#8f96a4', 'hard').d);
        R(tx - 6, ty - 2, tx + 7, ty - 1.2, M('#aab2c0', 'hard').base);
        R(tx - 3.5, ty - 6, tx - 0.5, ty - 2, M('#d8452f', 'cloth').base);
        R(tx - 3.5, ty - 6, tx - 0.5, ty - 5, C.white);
        E(tx + 3.5, ty - 4, 2.0, 2.4, C.white);
        R(tx + 2.6, ty - 6.4, tx + 4.4, ty - 5.6, '#d8452f');
      } else if (arm === 'hold' || arm === 'carry') {
        limb(sxo, shYa, reach + 4, shYa + 4 * H, aw, SLV);
        hand(reach + 4.5, shYa + 5 * H, 2.3 * Wd);
      } else if (arm === 'phone') {
        limb(sxo, shYa, reach, shYa - 4 * H, aw, SLV);
        hand(reach + 0.5, shYa - 5 * H, 2.2 * Wd);
        R(reach - 0.7, shYa - 10 * H, reach + 1.9, shYa - 5 * H, '#1a1a24');
        R(reach - 0.3, shYa - 9.4 * H, reach + 1.5, shYa - 5.8 * H, '#6fb0ff');
      } else if (arm === 'mop') {
        limb(sxo, shYa, reach + 3.5, shYa + 1.5 * H, aw, SLV);
        hand(reach + 4.1, shYa + 2 * H, 2.2 * Wd);
        L(reach + 5.5, shYa - 8, reach + 1.5, hipY + 3, M('#c8a060', 'hard').base);
      } else if (arm === 'headset') {
        limb(sxo, shYa, reach * 0.9, shYa + 4.5 * H, aw, SLV);
        hand(reach * 0.92, shYa + 5.6 * H, 2.2 * Wd);
      } else if (arm === 'pocket') {
        limb(sxo, shYa, reach * 0.96, hipY + 2, aw, SLV);
        hand(reach * 0.98, hipY + 3, 2.2 * Wd);
      } else {
        limb(sxo, shYa, reach + swing * 0.6, hipY + 2.5 + swing, aw, SLV);
        hand(reach + 0.5 + swing * 0.6, hipY + 4.2 + swing, 2.3 * Wd);
      }

      // sleeve cap over the shoulder joint so the arm reads as clothed
      if (!bare) {
        E(sxo + 0.6, shY + 4.6 * H, 2.9 * Wd, 4.0 * H, TOP.d);
        E(sxo + 0.2, shY + 3.4 * H, 2.1 * Wd, 1.8 * H, TOP.l);
      } else {
        E(sxo + 0.4, shY + 4.0 * H, 2.8 * Wd, 3.4 * H, TOP.d);
        E(sxo + 0.2, shY + 3.0 * H, 2.0 * Wd, 1.6 * H, TOP.base);
      }

      // ---- carried accessory -------------------------------------------------
      if (p.accessory) drawAccessory(o, reach + 1.5, hipY + 5, { u });

      // ---- stethoscope rides on top of the coat ------------------------------
      if (p.stethoscope) {
        const ST = M('#3a3f4c', 'hard');
        for (let i = 0; i <= 7; i++) {
          const k = i / 7;
          P(-3.2 - k * 1.2, shY + 1 + k * k * 8 * H, ST.base);
          P(3.4 + k * 0.8, shY + 1 + k * k * 9 * H, ST.base);
        }
        E(4.2, shY + 10 * H, 2.0, 1.8, C.steel);
        E(4.2, shY + 10 * H, 1.1, 1.0, '#7e8696');
        E(-3.8, shY + 1, 1.0, 1.0, ST.base);
      }
      if (p.nametag) {
        R(-bw * 0.72, bcy - 3.5, -bw * 0.72 + 5, bcy - 0.5, C.white);
        L(-bw * 0.72 + 0.6, bcy - 2.6, -bw * 0.72 + 4.2, bcy - 2.6, '#8a90a0');
        L(-bw * 0.72 + 0.6, bcy - 1.4, -bw * 0.72 + 3.2, bcy - 1.4, '#8a90a0');
      }
    }, blitOpts);

    drawOverlays(x, y, hy - hr);

    // ========================================================================
    // OUTFIT TAILORING
    // ========================================================================
    function drawOutfit(o, gm) {
      const { E, R, L, T, P } = o;
      const { bw, bcy, shY, hipY, thh } = gm;
      const SH = M(of.shirt || '#f2efe6', 'cloth');
      const neckY = shY + 1.5;
      switch (kind) {
        case 'polo': {
          const CL = M(of.collar || '#f5c33b', 'cloth');
          // short sleeves
          E(bw * 0.78, shY + 4 * H, 2.8 * Wd, 3.2 * H, TOP.d);
          E(-bw * 0.78, shY + 4 * H, 2.6 * Wd, 3.0 * H, TOP.dd);
          // collar wings + placket
          T(-1.5, neckY - 1, 3.2, neckY - 1, 0.6, neckY + 3.4, CL.base);
          T(-3.6, neckY - 1.4, 1.2, neckY - 0.6, -1.6, neckY + 3.0, CL.d);
          R(0.2, neckY + 1, 1.6, bcy + 1, TOP.d);
          P(0.8, neckY + 2.4, C.white); P(0.8, neckY + 5, C.white);
          R(-bw + 1.4, hipY - 1.2, bw - 1.4, hipY - 0.4, TOP.dd);
          break;
        }
        case 'labcoat': {
          // coat skirt past the hip, open front over shirt and tie
          T(-bw * 0.98, bcy, bw * 0.98, bcy, bw * 1.18, hipY + 6 * H, TOP.d);
          R(-bw * 1.04, bcy, bw * 1.04, hipY + 6 * H, TOP.d);
          R(-bw * 0.98, bcy - 1, bw * 0.98, hipY + 5 * H, TOP.base);
          R(-1.2, neckY, 2.2, hipY + 5 * H, TOP.dd);
          // shirt + tie in the V
          T(-3.2, neckY - 1, 3.6, neckY - 1, 0.4, neckY + 6, SH.base);
          if (of.tie) { R(-0.6, neckY, 1.4, neckY + 2, M(of.tie, 'cloth').base); T(-1.2, neckY + 2, 2.0, neckY + 2, 0.4, neckY + 8, M(of.tie, 'cloth').base); }
          // lapels
          T(-4.6, neckY - 1.6, 0.4, neckY - 0.2, -2.4, neckY + 6.5, TOP.l);
          T(5.0, neckY - 1.6, 0.6, neckY - 0.2, 3.0, neckY + 6.5, TOP.l);
          // pockets
          R(bw * 0.24, bcy + 3, bw * 0.78, bcy + 7, TOP.d);
          R(bw * 0.24, bcy + 3, bw * 0.78, bcy + 3.6, TOP.dd);
          R(-bw * 0.8, bcy + 3, -bw * 0.3, bcy + 7, TOP.d);
          // pens
          R(bw * 0.36, bcy + 1.4, bw * 0.46, bcy + 3.4, '#3b6fd6');
          R(bw * 0.56, bcy + 1.4, bw * 0.66, bcy + 3.4, '#c8352b');
          E(bw * 0.86, shY + 4.5 * H, 2.4 * Wd, 3.4 * H, TOP.d);
          break;
        }
        case 'scrubs': {
          // V-neck, chest pocket, drawstring
          T(-3.4, neckY - 1.4, 4.0, neckY - 1.4, 0.4, neckY + 5.0, TOP.dd);
          T(-2.4, neckY - 1.2, 3.0, neckY - 1.2, 0.4, neckY + 3.6, F.d);
          E(bw * 0.8, shY + 4.2 * H, 2.7 * Wd, 3.2 * H, TOP.d);
          E(-bw * 0.8, shY + 4.2 * H, 2.5 * Wd, 3.0 * H, TOP.dd);
          R(bw * 0.18, bcy + 2, bw * 0.76, bcy + 6, TOP.d);
          R(-bw + 1.4, hipY - 1.6, bw - 1.4, hipY - 0.6, TOP.dd);
          L(-1.6, hipY - 1.2, -2.6, hipY + 1.6, TOP.l);
          L(1.6, hipY - 1.2, 2.6, hipY + 1.6, TOP.l);
          break;
        }
        case 'cardigan': {
          // cream blouse down the middle, cardigan open over it, apron on top
          const BL = M(of.blouse || '#f3e6d8', 'cloth');
          R(-3.0, neckY - 1, 3.6, hipY + 1, BL.base);
          E(0.4, neckY + 1.0, 3.0, 1.6, BL.l);
          R(-bw * 1.02, neckY - 0.5, -2.2, hipY + 2, TOP.d);
          R(2.8, neckY - 0.5, bw * 1.02, hipY + 2, TOP.base);
          E(-bw * 0.62, bcy, bw * 0.42, m.th * 0.42, TOP.d);
          E(bw * 0.62, bcy, bw * 0.42, m.th * 0.42, TOP.base);
          T(-bw * 0.9, neckY - 2.2, -1.6, neckY - 0.2, -bw * 0.52, bcy - 1, TOP.dd);
          T(bw * 0.9, neckY - 2.2, 2.2, neckY - 0.2, bw * 0.58, bcy - 1, TOP.l);
          E(0.4, neckY - 0.6, 3.6, 1.6, TOP.dd);
          for (let i = 0; i < 3; i++) E(3.4, neckY + 3 + i * 4.5, 0.9, 0.9, C.gold);
          for (let i = -3; i <= 3; i++) L(i * 2.2, hipY, i * 2.2, hipY + 2, TOP.dd);
          for (let i = 0; i < 3; i++) { L(-bw * 0.94 + i * 1.6, neckY + 3, -bw * 0.94 + i * 1.6, hipY, TOP.dd); L(bw * 0.94 - i * 1.6, neckY + 3, bw * 0.94 - i * 1.6, hipY, TOP.l); }
          if (of.apron) {
            const AP = M(of.apron, 'cloth');
            const aw2 = bw * 0.42;
            R(-aw2, bcy - 2, aw2, hipY + 3.2 * H, AP.base);
            R(-aw2, hipY + 2.4 * H, aw2, hipY + 3.2 * H, AP.d);
            T(-aw2 * 0.9, bcy - 2, aw2 * 0.9, bcy - 2, 0.2, bcy - 6.5, AP.base);
            L(-aw2 * 0.62, bcy - 5.6, -1.8, neckY + 1.5, AP.d);
            L(aw2 * 0.62, bcy - 5.6, 2.4, neckY + 1.5, AP.d);
            R(-aw2, bcy - 2.6, aw2, bcy - 1.8, AP.d);
            // pocket
            R(-aw2 * 0.7, bcy + 2.5, aw2 * 0.7, bcy + 5.5, AP.d);
            R(-aw2 * 0.6, bcy + 3, aw2 * 0.6, bcy + 5, AP.base);
            E(-aw2 * 0.4, bcy - 4, aw2 * 0.4, 1.4, AP.l);
            // apron strings tying round the back
            L(-aw2, bcy - 2, -bw * 0.98, bcy - 1, AP.d);
            L(aw2, bcy - 2, bw * 0.98, bcy - 1, AP.d);
          }
          break;
        }
        case 'gown': {
          for (let i = -2; i <= 2; i++) for (let j = 0; j < 4; j++) P(i * 4 + (j & 1) * 2, shY + 4 + j * 5, TOP.d);
          T(-3.0, neckY - 1.4, 3.6, neckY - 1.4, 0.4, neckY + 4.4, TOP.dd);
          E(bw * 0.8, shY + 4.5 * H, 2.6 * Wd, 3.4 * H, TOP.d);
          E(-bw * 0.8, shY + 4.5 * H, 2.4 * Wd, 3.2 * H, TOP.dd);
          break;
        }
        case 'suit': {
          T(-1.0, neckY - 1.2, 3.4, neckY - 1.2, 1.0, neckY + 6.5, SH.base);
          R(-0.2, neckY + 6, 2.2, hipY + 1, SH.base);
          T(-5.0, neckY - 2, 0.8, neckY - 0.4, -2.2, bcy + 2, TOP.l);
          T(5.6, neckY - 2, 1.4, neckY - 0.4, 3.4, bcy + 2, TOP.l);
          const TI = M(of.tie || '#c8352b', 'cloth');
          R(0.4, neckY - 0.4, 2.0, neckY + 1.6, TI.base);
          T(-0.4, neckY + 1.6, 2.8, neckY + 1.6, 1.4, bcy + 4, TI.base);
          L(0.6, neckY + 2.6, 0.6, bcy + 2, TI.l);
          E(bw * 0.86, shY + 5 * H, 2.6 * Wd, 4.2 * H, TOP.d);
          E(3.2, bcy + 5, 0.9, 0.9, C.gold);
          R(bw * 0.26, bcy + 4.5, bw * 0.8, bcy + 5.2, TOP.dd);
          break;
        }
        case 'manager': {
          T(-1.2, neckY - 1.2, 3.4, neckY - 1.2, 1.0, neckY + 6, SH.base);
          const TI = M(of.tie || '#f5c33b', 'cloth');
          R(0.2, neckY - 0.4, 1.8, neckY + 1.4, TI.base);
          T(-0.6, neckY + 1.4, 2.6, neckY + 1.4, 1.0, bcy + 3, TI.base);
          T(-4.4, neckY - 1.8, 0.6, neckY - 0.4, -2.0, bcy + 1, TOP.l);
          T(5.0, neckY - 1.8, 1.2, neckY - 0.4, 3.0, bcy + 1, TOP.l);
          E(bw * 0.86, shY + 5 * H, 2.8 * Wd, 4.4 * H, TOP.d);
          E(-bw * 0.86, shY + 5 * H, 2.6 * Wd, 4.2 * H, TOP.dd);
          R(-bw * 0.8, bcy - 3, -bw * 0.8 + 5, bcy, C.white);
          break;
        }
        case 'cook': {
          // double breasted, then apron
          R(-bw * 0.9, neckY, bw * 0.9, hipY + 1, TOP.base);
          R(-1.2, neckY, 2.0, hipY + 1, TOP.d);
          for (let i = 0; i < 4; i++) { E(-2.6, neckY + 2 + i * 4, 0.8, 0.8, TOP.dd); E(3.4, neckY + 2 + i * 4, 0.8, 0.8, TOP.dd); }
          R(-2.8, neckY - 1.2, 3.6, neckY + 0.4, TOP.d);
          E(bw * 0.8, shY + 4.5 * H, 2.6 * Wd, 3.6 * H, TOP.d);
          if (of.apron) {
            const AP = M(of.apron, 'cloth');
            R(-bw * 0.6, bcy, bw * 0.6, hipY + 5 * H, AP.base);
            R(-bw * 0.6, hipY + 4 * H, bw * 0.6, hipY + 5 * H, AP.d);
            R(-bw * 0.6, bcy - 0.4, bw * 0.6, bcy + 0.4, AP.d);
            L(-bw * 0.4, bcy, -1.2, neckY + 1, AP.d);
            L(bw * 0.4, bcy, 1.6, neckY + 1, AP.d);
            R(0.6, bcy + 4, bw * 0.46, bcy + 8, AP.d);
          }
          break;
        }
        case 'hoodie': {
          E(hx - hr * 0.5, hy + hr * 0.62, hr * 0.98, hr * 0.62, TOP.d);
          R(-bw + 1.4, hipY - 2.6, bw - 1.4, hipY - 0.4, TOP.d);
          E(1.5, bcy + 4, bw * 0.62, 3.2, TOP.d);
          E(1.5, bcy + 3.2, bw * 0.56, 2.6, TOP.base);
          for (const dx0 of [-1.4, 2.2]) { L(dx0, neckY + 1, dx0 - 0.4, neckY + 7, '#efe1c0'); E(dx0 - 0.5, neckY + 7.6, 0.8, 1.0, '#8a7a55'); }
          E(bw * 0.86, shY + 5 * H, 2.8 * Wd, 4.2 * H, TOP.d);
          break;
        }
        case 'coat': {
          R(-bw * 1.02, bcy, bw * 1.02, hipY + 7 * H, TOP.d);
          R(-bw * 0.96, bcy - 1, bw * 0.96, hipY + 6 * H, TOP.base);
          R(-0.8, neckY, 1.6, hipY + 6 * H, TOP.dd);
          for (let i = 0; i < 4; i++) E(2.4, neckY + 3 + i * 4.5, 0.9, 0.9, TOP.dd);
          T(-4.6, neckY - 2, 0.6, neckY - 0.4, -2.4, neckY + 5, TOP.l);
          T(5.2, neckY - 2, 1.2, neckY - 0.4, 3.2, neckY + 5, TOP.l);
          E(bw * 0.9, shY + 5 * H, 2.8 * Wd, 4.4 * H, TOP.d);
          break;
        }
        case 'winter': {
          for (let j = 0; j < 4; j++) { L(-bw * 0.92, shY + 4 + j * 5, bw * 0.92, shY + 4 + j * 5, TOP.d); }
          E(bw * 0.9, shY + 5 * H, 3.0 * Wd, 4.4 * H, TOP.d);
          E(-bw * 0.9, shY + 5 * H, 2.8 * Wd, 4.2 * H, TOP.dd);
          R(-0.6, neckY, 1.4, hipY, TOP.dd);
          if (of.scarf) {
            const SC = M(of.scarf, 'cloth');
            E(0.4, neckY - 0.5, bw * 0.66, 2.2, SC.base);
            R(2.0, neckY, 4.4, neckY + 7, SC.base);
            R(2.0, neckY + 6, 4.4, neckY + 7, SC.d);
          }
          break;
        }
        case 'vest': {
          R(-bw * 0.96, neckY, bw * 0.96, hipY + 1, SH.base);
          E(bw * 0.86, shY + 4.6 * H, 2.6 * Wd, 3.6 * H, SH.d);
          R(-bw * 0.9, neckY + 1.5, -1.2, hipY - 0.5, TOP.base);
          R(2.0, neckY + 1.5, bw * 0.9, hipY - 0.5, TOP.base);
          const SR = M(of.stripe || '#e8e8b0', 'hard');
          R(-bw * 0.9, bcy - 1.5, bw * 0.9, bcy - 0.5, SR.base);
          R(-bw * 0.9, bcy + 1.5, bw * 0.9, bcy + 2.5, SR.base);
          R(-1.2, neckY + 1.5, 2.0, hipY - 0.5, SH.d);
          break;
        }
        case 'utility': {
          E(bw * 0.86, shY + 4.8 * H, 2.7 * Wd, 3.8 * H, TOP.d);
          E(-bw * 0.86, shY + 4.8 * H, 2.5 * Wd, 3.6 * H, TOP.dd);
          R(-bw * 0.94, bcy - 1, bw * 0.94, bcy + 0.4, M(of.stripe || '#f2f21a', 'hard').base);
          R(-0.8, neckY, 1.6, hipY, TOP.dd);
          R(bw * 0.2, bcy + 3, bw * 0.78, bcy + 6.5, TOP.d);
          R(-bw * 0.78, neckY + 1.5, -bw * 0.3, neckY + 4, TOP.l);
          break;
        }
        case 'flannel': {
          R(-bw * 0.96, neckY, bw * 0.96, hipY + 1, TOP.base);
          for (let i = -3; i <= 3; i++) L(i * 3, shY + 2, i * 3, hipY, TOP.d);
          for (let j = 0; j < 5; j++) L(-bw * 0.94, shY + 3 + j * 4, bw * 0.94, shY + 3 + j * 4, TOP.d);
          R(-1.0, neckY, 1.8, hipY, TOP.dd);
          T(-4.2, neckY - 1.6, 0.4, neckY - 0.2, -2.2, neckY + 4.5, TOP.l);
          T(4.8, neckY - 1.6, 1.2, neckY - 0.2, 2.8, neckY + 4.5, TOP.l);
          E(bw * 0.88, shY + 5 * H, 2.7 * Wd, 4.2 * H, TOP.d);
          break;
        }
        case 'sweater': {
          for (let j = 0; j < 6; j++) for (let i = -3; i <= 3; i++) P(i * 2.4 + (j & 1) * 1.2, shY + 4 + j * 3, TOP.d);
          R(-bw + 1.2, hipY - 2.4, bw - 1.2, hipY - 0.6, TOP.d);
          E(0.4, neckY + 0.2, 3.4, 1.8, TOP.d);
          E(bw * 0.86, shY + 5 * H, 2.8 * Wd, 4.2 * H, TOP.d);
          break;
        }
        case 'overalls': {
          R(-bw * 0.96, neckY - 1, bw * 0.96, bcy + 2, SH.base);
          E(bw * 0.84, shY + 4.4 * H, 2.6 * Wd, 3.4 * H, SH.d);
          R(-bw * 0.9, bcy - 1, bw * 0.9, hipY + 1, TOP.base);
          R(-3.6, neckY - 1.5, -2.0, bcy - 1, TOP.base);
          R(2.4, neckY - 1.5, 4.0, bcy - 1, TOP.base);
          E(-2.8, neckY - 1, 0.9, 0.9, C.gold); E(3.2, neckY - 1, 0.9, 0.9, C.gold);
          R(-2.4, bcy + 1.5, 3.0, bcy + 5, TOP.d);
          break;
        }
        case 'track': {
          R(-0.8, neckY, 1.6, hipY, TOP.dd);
          const SR = M(of.stripe || '#e8e8f0', 'cloth');
          L(-bw * 0.72, shY + 3, -bw * 0.86, hipY, SR.base);
          L(bw * 0.72, shY + 3, bw * 0.86, hipY, SR.base);
          E(0.4, neckY + 0.4, 3.2, 1.6, TOP.d);
          E(bw * 0.86, shY + 5 * H, 2.7 * Wd, 4.2 * H, TOP.d);
          break;
        }
        case 'security': {
          E(bw * 0.86, shY + 5 * H, 2.8 * Wd, 4.2 * H, TOP.d);
          R(-0.8, neckY, 1.6, hipY, TOP.dd);
          R(-bw * 0.74, bcy - 3.5, -bw * 0.74 + 4, bcy - 0.5, C.gold);
          R(-bw + 1.4, hipY - 1.4, bw - 1.4, hipY - 0.2, TOP.dd);
          break;
        }
        case 'hearts': {
          // a plain undershirt, and underwear covered in little hearts
          const UN = M(of.undies || '#eaf2ff', 'cloth');
          E(bw * 0.8, shY + 4.2 * H, 2.5 * Wd, 3.2 * H, TOP.d);
          E(-bw * 0.8, shY + 4.2 * H, 2.4 * Wd, 3.0 * H, TOP.dd);
          E(0.4, neckY + 0.2, 3.0, 1.5, TOP.d);
          E(0.4, neckY - 0.2, 2.4, 1.1, F.d);
          R(-bw + 1.4, hipY - 5.5, bw - 1.4, hipY - 4.2, TOP.dd);   // hem of the shirt
          R(-bw * 0.94, hipY - 4.6, bw * 0.94, hipY + 1.6, UN.base); // the shorts
          R(-bw * 0.94, hipY - 4.6, bw * 0.94, hipY - 3.2, UN.d);    // waistband
          R(-bw * 0.94, hipY + 0.6, bw * 0.94, hipY + 1.6, UN.d);    // leg openings
          for (let i = -1; i <= 1; i++) {                            // the hearts
            const hx = i * 3.6, hy = hipY - 1.6 + (i & 1 ? 0.9 : 0);
            E(hx - 0.9, hy - 0.5, 1.0, 0.9, of.heart || '#e8496e');
            E(hx + 0.9, hy - 0.5, 1.0, 0.9, of.heart || '#e8496e');
            T(hx - 1.8, hy - 0.1, hx + 1.8, hy - 0.1, hx, hy + 1.8, of.heart || '#e8496e');
          }
          break;
        }
        default: {
          // plain tee
          E(bw * 0.82, shY + 4.4 * H, 2.7 * Wd, 3.4 * H, TOP.d);
          E(-bw * 0.82, shY + 4.4 * H, 2.5 * Wd, 3.2 * H, TOP.dd);
          E(0.4, neckY + 0.2, 3.2, 1.6, TOP.d);
          E(0.4, neckY - 0.2, 2.6, 1.2, F.d);
          R(-bw + 1.4, hipY - 1.4, bw - 1.4, hipY - 0.4, TOP.dd);
          if (p.logo) { R(-2.4, bcy - 1, 2.4, bcy + 2, TOP.l); }
          break;
        }
      }
    }

    function drawAccessory(o, ax, ay, gm) {
      const { E, R, L, T, P } = o;
      const a = p.accessory;
      if (a === 'bag') {
        const BG = M(p.accColor || '#c8a45a', 'cloth');
        R(ax - 3, ay - 1, ax + 4, ay + 7, BG.base);
        R(ax - 3, ay + 5, ax + 4, ay + 7, BG.d);
        R(ax - 3, ay - 1, ax + 4, ay, BG.d);
        for (let i = 0; i <= 6; i++) P(ax - 1.6 + i * 0.7, ay - 1.5 - Math.sin(i / 6 * Math.PI) * 3.2, BG.dd);
      } else if (a === 'coffee') {
        R(ax - 2, ay - 4, ax + 2, ay + 2, C.white);
        R(ax - 2.4, ay - 5, ax + 2.4, ay - 4, '#c8352b');
        R(ax - 2, ay - 1.6, ax + 2, ay - 0.6, '#c8352b');
      } else if (a === 'phone') {
        R(ax - 1.4, ay - 5, ax + 1.4, ay - 0.5, '#1a1a24');
        R(ax - 1.0, ay - 4.4, ax + 1.0, ay - 1.2, '#6fb0ff');
      } else if (a === 'purse') {
        const BG = M(p.accColor || '#8a4a6a', 'cloth');
        E(ax + 1, ay + 3, 3.4, 2.8, BG.base);
        for (let i = 0; i <= 6; i++) P(ax + 1 - 3 + i, ay - 1 - Math.sin(i / 6 * Math.PI) * 3, BG.dd);
      } else if (a === 'cane') {
        L(ax + 2, ay + 6, ax + 2, ay - 6, M('#8a5a2b', 'hard').base);
        for (let i = 0; i <= 4; i++) P(ax + 2 - i * 0.7, ay - 6 - Math.sin(i / 4 * Math.PI) * 1.6, M('#8a5a2b', 'hard').d);
      } else if (a === 'balloon') {
        L(ax + 2, ay, ax + 4, ay - 14, '#dcdce4');
        E(ax + 4.5, ay - 18, 3.4, 3.8, M(p.accColor || '#d8452f', 'cloth').base);
        E(ax + 3.4, ay - 19.4, 1.2, 1.2, '#ffffff');
      } else if (a === 'backpack') {
        const BG = M(p.accColor || '#3f6a4a', 'cloth');
        E(-gm.u * 0 - 9, gm.u * 0 + ay - 10, 4.0, 5.4, BG.base);
      }
    }

    // ========================================================================
    // Effects outside the ink line
    // ========================================================================
    function drawOverlays(ox0, oy0, headTopLocal) {
      const ox = Math.round(ox0), oy = Math.round(oy0);
      const dir = p.flip ? -1 : 1;
      const hxs = ox + dir * Math.round((m.hx + 2) * sx);
      const hys = oy + Math.round(headTopLocal * sy);
      if (p.sweat > 0) art.effect('sweat', hxs + dir * 9, hys + 4, t, 0.9);
      if (sleep) art.effect('zzz', hxs + dir * 9, hys + 2, t, 0.9);
      if (p.fx) art.effect(p.fx, hxs + dir * 8, hys - 6, t, 0.9);
      if (p.emote) {
        const bx = hxs + dir * 12, by = hys - 12;
        art.bubble(bx - 9, by - 10, 19, 16, bx - 2, by + 8, { kind: 'think' });
        gfx.text(p.emote, bx + 0.5, by - 5, p.emote === '♥' ? '#e8496e' : '#2a1f33', { align: 'center' });
      }
    }
  }
  CH.drawCritter = drawCritter;

  // ============================================================================
  // NPC actor
  // ============================================================================
  class NPC {
    constructor(def) {
      Object.assign(this, {
        x: 0, y: 0, vx: 0, speed: 40, flip: false, walk: 0, moving: 0,
        face: 'normal', arm: 'idle', pose: 'stand', name: 'NPC',
        species: 'bear', outfit: 'casual', blinkT: CH.rand(1, 4), blink: false,
        talk: false, target: null, bubble: null, bubbleT: 0, emote: null, emoteT: 0,
        hidden: false, idleT: 0, sx: 1, sy: 1, wanderRange: null, wanderT: 0,
      }, def);
      this.squash = new CH.Spring(200, 12, 1);
      this.onArrive = null;
    }
    walkTo(x, cb) { this.target = x; this.onArrive = cb || null; const sig = new CH.Signal(); this._arriveSig = sig; return sig; }
    say(text, dur = 2.5, kind = 'say') { this.bubble = text; this.bubbleT = dur; this.bubbleKind = kind; this.bubbleAge = 0; }
    doEmote(e, dur = 1.5) { this.emote = e; this.emoteT = dur; }
    update(dt) {
      if (this.target !== null) {
        const d = this.target - this.x;
        if (Math.abs(d) < 2) { this.x = this.target; this.target = null; this.vx = 0; if (this.onArrive) this.onArrive(); if (this._arriveSig) this._arriveSig.resolve(); }
        else { this.vx = Math.sign(d) * this.speed; this.x += this.vx * dt; this.flip = d < 0; }
      } else if (this.wanderRange) {
        this.wanderT -= dt;
        if (this.wanderT <= 0) { this.wanderT = CH.rand(2, 6); if (CH.chance(0.6)) this.walkTo(CH.rand(this.wanderRange[0], this.wanderRange[1])); }
        this.vx = 0;
      } else this.vx = 0;
      const sp = Math.abs(this.vx);
      this.moving = CH.approach(this.moving, sp > 1 ? 1 : 0, dt * 6);
      if (sp > 1) { this.walk += dt * (7 + sp * 0.1); this.idleT = 0; }
      else { this.walk = CH.approach(this.walk, Math.round(this.walk / Math.PI) * Math.PI, dt * 10); this.idleT += dt; }
      this.blinkT -= dt;
      if (this.blinkT <= 0) { this.blink = !this.blink; this.blinkT = this.blink ? 0.12 : CH.rand(1.5, 5); }
      if (this.bubbleT > 0) { this.bubbleT -= dt; this.bubbleAge = (this.bubbleAge || 0) + dt; if (this.bubbleT <= 0) this.bubble = null; }
      if (this.emoteT > 0) { this.emoteT -= dt; if (this.emoteT <= 0) this.emote = null; }
      this.squash.update(dt);
    }
    params(extra) {
      return Object.assign({
        species: this.species, outfit: this.outfit, walk: this.walk, moving: this.moving,
        flip: this.flip, face: this.face, mouth: this.mouth, blink: this.blink, talk: this.talk,
        arm: this.arm, pose: this.pose, glasses: this.glasses, hair: this.hair, hairColor: this.hairColor,
        mustache: this.mustache, whiskers: this.whiskers, height: this.height, width: this.width,
        hat: this.hat, hatColor: this.hatColor, hatScale: this.hatScale, headset: this.headset,
        topColor: this.topColor, bottomColor: this.bottomColor, fur: this.fur, furL: this.furL,
        nametag: this.nametag, stethoscope: this.stethoscope, sleep: this.sleep, emote: this.emote,
        fx: this.fx, sweat: this.sweat, blush: this.blush, lookX: this.lookX, lookY: this.lookY,
        headSize: this.headSize, quillColor: this.quillColor, outfitOverride: this.outfitOverride,
        accessory: this.accessory, accColor: this.accColor, innerEar: this.innerEar, logo: this.logo,
        sx: this.squash.x * this.sx, sy: (2 - this.squash.x) * this.sy,
      }, extra);
    }
    draw(g, camX = 0, camY = 0, extra) {
      if (this.hidden) return;
      drawCritter(g, this.x - camX, this.y - camY, this.params(extra));
      if (this.bubble) {
        const mm = metrics(this.params());
        const hxs = Math.round(this.x - camX);
        const hys = Math.round(this.y - camY) + Math.round((mm.hy - mm.hr) * (this.sy || 1)) - 3;
        const lines = gfx.wrap(this.bubble, 104, 'small');
        const w = Math.max(...lines.map((l) => gfx.textWidth(l, 'small'))) + 11;
        const h = lines.length * 7 + 7;
        // clamp so a character at the edge of the room keeps its bubble on screen
        const bx = Math.round(CH.clamp(hxs - w / 2, 3, CH.W - w - 3));
        const by = Math.round(CH.clamp(hys - h - 6, 3, CH.H - h - 3));
        const k = CH.ease.outBack(CH.clamp((this.bubbleAge || 0) / 0.16, 0, 1));
        g.save();
        g.translate(hxs, hys); g.scale(k, k); g.translate(-hxs, -hys);
        art.bubble(bx, by, w, h, hxs, hys, { kind: this.bubbleKind || 'say' });
        lines.forEach((l, i) => gfx.text(l, bx + w / 2, by + 4 + i * 7, '#2a1f33', { align: 'center', font: 'small' }));
        g.restore();
      }
    }
  }
  CH.NPC = NPC;

  // ============================================================================
  // The named cast
  // ============================================================================
  // Mom: soft porcupine, grey-streaked quills gathered in a bun, reading glasses
  // on a beaded chain, cardigan over a blouse, kitchen apron.
  CH.makeMom = (x, y) => new CH.NPC({
    name: 'Mom', species: 'porcupine', outfit: 'dress', x, y, speed: 30,
    glasses: 'reading', hair: 'bun', hairColor: '#cfc8b6', quillColor: '#c8bda2',
    height: 0.97, width: 1.08, fur: '#b08258', furL: '#e3c093', face: 'warm',
    topColor: '#bb5e8a', blush: true, headSize: 5.85,
  });
  // Doctor: tall beaver, lab coat past the hip, stethoscope, clipboard, buck teeth.
  CH.makeDoctor = (x, y) => new CH.NPC({
    name: 'Doctor', species: 'beaver', outfit: 'labcoat', x, y, speed: 45,
    glasses: true, stethoscope: true, height: 1.1, width: 0.98,
    arm: 'clipboard', face: 'stern', nametag: true,
  });
  // Nurses: 0 = goose (long neck + beak + cap), 1 = rabbit (long ears).
  CH.makeNurse = (x, y, v = 0) => new CH.NPC({
    name: 'Nurse', species: v ? 'rabbit' : 'goose', outfit: 'scrubs', x, y, speed: 55,
    hat: v ? 'scrubcap' : 'nurse', hatColor: v ? '#3f5f9e' : undefined,
    height: v ? 0.98 : 1.02, face: v ? 'happy' : 'normal',
    hair: v ? undefined : undefined, nametag: true,
    outfitOverride: v ? { top: '#5b7fc4', topD: '#38538f', bottom: '#4a6bab' } : undefined,
  });
  // Brenda: moose manager. Big, palmate antlers, visor, headset, hands on hips.
  CH.makeBrenda = (x, y) => new CH.NPC({
    name: 'Brenda', species: 'moose', outfit: 'manager', x, y, speed: 40,
    height: 1.18, width: 1.14, arm: 'hips', face: 'annoyed', headset: true,
    hat: 'visor', hatColor: '#b52c22', nametag: true, glasses: true,
  });
  // Kevin: scrawny raccoon cook. Paper hat, apron, ringed tail, shifty eyes.
  CH.makeKevin = (x, y) => new CH.NPC({
    name: 'Kevin', species: 'raccoon', outfit: 'cook', x, y, speed: 50,
    hat: 'paper', height: 0.9, width: 0.8, face: 'sly', lookX: 0.7,
  });
  // Tammy: friendly fox. Long red hair, polo and visor, bushy tail.
  CH.makeTammy = (x, y) => new CH.NPC({
    name: 'Tammy', species: 'fox', outfit: 'polo', x, y, speed: 50,
    hair: 'long', hairColor: '#93300f', height: 1.0, width: 0.95,
    face: 'happy', hat: 'visor', nametag: true,
  });
  // Jorge: huge, slow, gentle bear. Tiny visor on a very big head.
  CH.makeJorge = (x, y) => new CH.NPC({
    name: 'Jorge', species: 'bear', outfit: 'polo', x, y, speed: 42,
    height: 1.08, width: 1.32, face: 'warm', hat: 'visor', hatScale: 0.72,
    outfitOverride: { top: '#c8352b', topD: '#8b2118' },
  });
  // Destiny: skunk on drive-thru. White stripe, headset, bored teenager slouch.
  CH.makeDestiny = (x, y) => new CH.NPC({
    name: 'Destiny', species: 'skunk', outfit: 'polo', x, y, speed: 55,
    headset: true, height: 1.06, width: 0.84, face: 'bored', arm: 'pocket',
    hair: undefined, accessory: null,
  });

  // ---- random customers --------------------------------------------------------
  const CUSTOMER_SPECIES = ['beaver', 'goose', 'moose', 'raccoon', 'bear', 'rabbit', 'fox', 'deer', 'squirrel', 'owl', 'cat', 'dog', 'skunk', 'porcupine'];
  const CUSTOMER_OUTFITS = ['casual', 'hoodie', 'coat', 'winter', 'suit', 'vest', 'flannel', 'sweater', 'overalls', 'tracksuit', 'casual', 'flannel'];
  const SHIRTS = ['#5a7ac8', '#c85a5a', '#5ac87a', '#c8a85a', '#8a5ac8', '#5ac8c8', '#e08040', '#7a7a7a', '#d060a0', '#406040', '#b0492f', '#3f6a8a'];
  const ACCESSORIES = [null, null, null, 'bag', 'coffee', 'phone', 'purse', 'balloon', 'cane'];
  const HATS = [null, null, null, null, 'cap', 'toque', 'hardhat'];
  const FACES_IDLE = ['normal', 'normal', 'normal', 'happy', 'bored', 'annoyed', 'tired', 'worried'];
  CH.makeCustomer = (x, y, rng) => {
    const R = rng || { pick: CH.pick, range: CH.rand, chance: CH.chance };
    const species = R.pick(CUSTOMER_SPECIES);
    const hat = R.pick(HATS);
    return new CH.NPC({
      name: 'Customer', species, outfit: R.pick(CUSTOMER_OUTFITS), topColor: R.pick(SHIRTS),
      x, y, speed: R.range(35, 55),
      height: R.range(0.82, 1.2), width: R.range(0.82, 1.26),
      glasses: R.chance(0.22), hat: hat || undefined, hatColor: R.pick(SHIRTS),
      face: R.pick(FACES_IDLE), accessory: R.pick(ACCESSORIES), accColor: R.pick(SHIRTS),
      mustache: R.chance(0.12), hair: R.chance(0.14) ? 'long' : undefined,
      hairColor: R.pick(['#4a2a1a', '#2a2028', '#b4381c', '#c8bda2']),
      bottomColor: R.pick(['#3a3a48', '#2c2733', '#3d4a5c', '#4a4256', '#5a4a3a']),
    });
  };

  // ============================================================================
  // Dialogue portraits. The box is 28x28 and clipped, so frame on the head:
  // scale so every skull is about the same size, then park it in the middle.
  // ============================================================================
  function portraitOf(mk, defFace) {
    return (g, x, y, d) => {
      const n = mk(0, 0);
      n.face = (d && d.opts && d.opts.face) || defFace || n.face || 'normal';
      n.blink = false;
      n.talk = !!(d && d.text && d.shown < d.text.length);
      n.pose = 'stand'; n.moving = 0; n.walk = 0;
      const pr = n.params({ noShadow: true, arm: n.arm === 'hips' ? 'hips' : 'pocket' });
      const mm = metrics(pr);
      const s = CH.clamp(10.2 / mm.hr, 0.8, 2.0);
      g.save();
      g.translate(Math.round(x - mm.hx * s), Math.round(y - 14 - mm.hy * s));
      g.scale(s, s);
      drawCritter(g, 0, 0, pr);
      g.restore();
    };
  }
  CH.ui.portraits.Mom = portraitOf(CH.makeMom, 'warm');
  CH.ui.portraits.Doctor = portraitOf(CH.makeDoctor, 'stern');
  CH.ui.portraits.Nurse = portraitOf(CH.makeNurse, 'normal');
  CH.ui.portraits.Brenda = portraitOf(CH.makeBrenda, 'annoyed');
  CH.ui.portraits.Kevin = portraitOf(CH.makeKevin, 'sly');
  CH.ui.portraits.Tammy = portraitOf(CH.makeTammy, 'happy');
  CH.ui.portraits.Jorge = portraitOf(CH.makeJorge, 'warm');
  CH.ui.portraits.Destiny = portraitOf(CH.makeDestiny, 'bored');
})(window.CH);
