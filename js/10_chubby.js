// ============================================================================
// CHUBBY - parametric pixel porcupine renderer with squash/stretch & jiggle
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, P = CH.PAL;

  const COL = {
    fur: '#8a5a3b', furL: '#b58356', furD: '#5a3721', furX: '#3a2314',
    quill: '#ead9b0', quillT: '#3a2a1c',
    hood: '#2f8f7a', hoodD: '#1f6656', hoodL: '#57b89f', string: '#efe1c0',
    eye: '#fff', pupil: '#1a1420', nose: '#2a1a12', blush: '#d98a7a', tongue: '#d96a7a',
    suit: '#2a3350', suitD: '#1b2238', suitL: '#3c4870', shirt: '#f4f1ea', tie: '#c8352b', gold: '#f2c94c',
    uni: '#c8352b', uniD: '#8f2419', uniY: '#f5c33b', visor: '#c8352b', pants: '#2a2530', apron: '#5f7a94', apronD: '#42566b', glove: '#f0d040', badge: '#fff',
    pj: '#6f7fbf', pjD: '#4f5c92',
  };
  CH.CHUBBY_COL = COL;

  // Draw Chubby at (x, y) = feet center. p = params
  // p: {sx, sy, jig, walk, moving, face, blink, outfit, flip, quillTilt, arm, hat, sweat, lookX, lookY, sleep, hold, tilt}
  function drawChubby(g, x, y, p = {}) {
    const sx = p.sx || 1, sy = p.sy || 1, dir = p.flip ? -1 : 1;
    const jig = p.jig || 0;
    const X = (v) => Math.round(v * sx) * dir;
    const Y = (v) => Math.round(v * sy);
    const ox = Math.round(x), oy = Math.round(y);
    // helpers in local space (x right = facing dir, y up negative)
    const E = (cx, cy, rx, ry, c) => gfx.ellipse(ox + X(cx), oy + Y(cy), Math.max(0.6, rx * sx), Math.max(0.6, ry * sy), c);
    const R = (x0, y0, x1, y1, c) => { // inclusive corners local
      const ax = ox + X(x0), bx = ox + X(x1), ay = oy + Y(y0), by = oy + Y(y1);
      gfx.rect(Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax) + 1, Math.abs(by - ay) + 1, c);
    };
    const L = (x0, y0, x1, y1, c) => gfx.line(ox + X(x0), oy + Y(y0), ox + X(x1), oy + Y(y1), c);
    const outfit = p.outfit || 'hoodie';
    const walk = p.walk || 0, moving = p.moving || 0;
    const legL = Math.sin(walk) * 2.5 * moving, legR = -Math.sin(walk) * 2.5 * moving;
    const bob = Math.abs(Math.sin(walk)) * 1.2 * moving;
    const qt = p.quillTilt || 0; // -1..1 (positive = quills swept back)
    const sleep = !!p.sleep;

    // shadow
    if (!p.noShadow) { g.globalAlpha = 0.25; gfx.ellipse(ox, oy + 1, 10 * sx, 2, '#000'); g.globalAlpha = 1; }

    // ---- feet (back foot first)
    const footCol = outfit === 'uniform' || outfit === 'janitor' ? '#1a1520' : outfit === 'suit' ? '#1a1520' : COL.furD;
    const footHi = outfit === 'uniform' || outfit === 'janitor' || outfit === 'suit' ? '#3a3545' : COL.fur;
    if (!p.sitting) {
      E(-4 + legL * 0.6, -1 - Math.max(0, legL) * 0.5, 3.2, 1.8, footCol);
      E(-4 + legL * 0.6, -1.6 - Math.max(0, legL) * 0.5, 2.4, 1, footHi);
      E(4 + legR * 0.6, -1 - Math.max(0, legR) * 0.5, 3.2, 1.8, footCol);
      E(4 + legR * 0.6, -1.6 - Math.max(0, legR) * 0.5, 2.4, 1, footHi);
    }

    const by0 = -12 - bob; // body center y
    const bx0 = jig * 0.6;
    // ---- back quills (body)
    const quillCol = p.quillColor || COL.quill;
    const drawQuills = () => {
      const qs = [
        [-9, -20, -13 - qt * 3, -25 + qt * 1.5], [-7, -22, -11 - qt * 3, -28 + qt * 2], [-10, -17, -15 - qt * 2, -20 + qt],
        [-4, -22, -6 - qt * 3, -29 + qt * 2], [-11, -13, -16 - qt, -14],
      ];
      for (const [a, b, c, d] of qs) {
        L(a + bx0, b - bob, c + bx0, d - bob, quillCol);
        R(c + bx0, d - bob, c + bx0, d - bob, COL.quillT);
      }
    };
    drawQuills();

    // ---- body (belly)
    let bodyCol = COL.hood, bodyD = COL.hoodD, bodyL = COL.hoodL;
    if (outfit === 'suit') { bodyCol = COL.suit; bodyD = COL.suitD; bodyL = COL.suitL; }
    if (outfit === 'uniform' || outfit === 'janitor') { bodyCol = COL.uni; bodyD = COL.uniD; bodyL = '#e04a3e'; }
    if (outfit === 'pajamas') { bodyCol = COL.pj; bodyD = COL.pjD; bodyL = '#8b9ad6'; }
    const brx = 11 + jig * 0.4, bry = 10 - Math.abs(jig) * 0.2;
    E(bx0, by0, brx, bry, bodyD);
    E(bx0 + 0.5, by0 - 0.8, brx - 1, bry - 1, bodyCol);
    E(bx0 + 2, by0 - 4, brx * 0.45, bry * 0.28, bodyL); // highlight
    // back arm
    const armCol = bodyCol;
    if (outfit === 'suit' || outfit === 'pajamas') {
      // trousers on lower body
      R(-9 + bx0, by0 + 3, 9 + bx0, by0 + 8, COL.pants);
      E(bx0, by0 + 6, brx - 3, 3, COL.pants);
    }
    if (outfit === 'uniform' || outfit === 'janitor') {
      R(-8 + bx0, by0 + 4, 8 + bx0, by0 + 8, COL.pants);
      E(bx0, by0 + 6.5, brx - 3.5, 2.5, COL.pants);
    }
    // outfit front details
    if (outfit === 'hoodie') {
      // kangaroo pocket
      R(-3 + bx0, by0 + 2, 7 + bx0, by0 + 5, bodyD);
      R(-3 + bx0, by0 + 2, 7 + bx0, by0 + 2, gfx.shade(bodyD, -20));
      // drawstrings
      R(3 + bx0, by0 - 7, 3 + bx0, by0 - 2, COL.string); R(5 + bx0, by0 - 7, 5 + bx0, by0 - 3, COL.string);
      R(3 + bx0, by0 - 1, 3 + bx0, by0 - 1, COL.quillT); R(5 + bx0, by0 - 2, 5 + bx0, by0 - 2, COL.quillT);
    } else if (outfit === 'suit') {
      // shirt V + straining buttons + tie
      const t0 = by0 - 8;
      R(1 + bx0, t0, 5 + bx0, by0 + 3, COL.shirt);
      R(0 + bx0, t0, 0 + bx0, by0 - 2, COL.shirt); R(6 + bx0, t0, 6 + bx0, by0 - 2, COL.shirt);
      // tie
      R(3 + bx0, t0 + 1, 3 + bx0, by0 + 1, COL.tie); R(2 + bx0, t0 + 3, 4 + bx0, by0 - 1, COL.tie);
      // jacket lapels
      L(-1 + bx0, t0, 1 + bx0, by0 + 2, bodyL); L(7 + bx0, t0, 5 + bx0, by0 + 2, bodyL);
      // buttons under strain (gap shows shirt)
      R(-1 + bx0, by0 + 2, -1 + bx0, by0 + 2, COL.gold); R(7 + bx0, by0 + 2, 7 + bx0, by0 + 2, COL.gold);
      R(0 + bx0, by0 + 3, 6 + bx0, by0 + 3, COL.shirt);
      // pocket square
      R(-6 + bx0, by0 - 5, -5 + bx0, by0 - 5, '#f0c0c8');
    } else if (outfit === 'uniform' || outfit === 'janitor') {
      // collar
      R(0 + bx0, by0 - 8, 6 + bx0, by0 - 6, COL.uniY);
      R(2 + bx0, by0 - 5, 4 + bx0, by0 - 4, COL.uniY);
      // name tag
      R(-6 + bx0, by0 - 4, -3 + bx0, by0 - 3, COL.badge);
      R(-5 + bx0, by0 - 4, -4 + bx0, by0 - 4, '#c8352b');
      if (outfit === 'janitor') {
        // apron
        R(-5 + bx0, by0 - 3, 6 + bx0, by0 + 7, COL.apron);
        R(-5 + bx0, by0 + 2, 6 + bx0, by0 + 2, COL.apronD);
        R(-3 + bx0, by0 + 3, 4 + bx0, by0 + 6, COL.apronD);
        L(-5 + bx0, by0 - 3, -8 + bx0, by0 - 7, COL.apronD); L(6 + bx0, by0 - 3, 8 + bx0, by0 - 7, COL.apronD);
      }
    } else if (outfit === 'pajamas') {
      // stripes
      for (let i = -8; i <= 8; i += 4) R(i + bx0, by0 - 8, i + bx0, by0 + 2, bodyL);
    }
    // ---- front arm
    const arm = p.arm || 'idle';
    const handCol = outfit === 'janitor' ? COL.glove : COL.fur;
    const sleeve = bodyCol;
    if (!p.sitting) {
      if (arm === 'idle') {
        L(6 + bx0, by0 - 2, 10 + bx0, by0 + 2 + Math.sin(walk + Math.PI) * 1.5 * moving, sleeve);
        E(10 + bx0, by0 + 3 + Math.sin(walk + Math.PI) * 1.5 * moving, 1.8, 1.8, handCol);
        // back arm peeking
        E(-10 + bx0, by0 + 2 - Math.sin(walk + Math.PI) * 1.5 * moving, 1.6, 1.6, handCol);
      } else if (arm === 'up') {
        L(6 + bx0, by0 - 3, 9 + bx0, by0 - 12, sleeve); E(9 + bx0, by0 - 13, 1.8, 1.8, handCol);
      } else if (arm === 'both_up') {
        L(6 + bx0, by0 - 3, 10 + bx0, by0 - 12, sleeve); E(10 + bx0, by0 - 13, 1.8, 1.8, handCol);
        L(-6 + bx0, by0 - 3, -10 + bx0, by0 - 12, sleeve); E(-10 + bx0, by0 - 13, 1.8, 1.8, handCol);
      } else if (arm === 'phone') {
        L(6 + bx0, by0 - 3, 8 + bx0, by0 - 9, sleeve); E(8 + bx0, by0 - 10, 1.8, 1.8, handCol);
        R(6 + bx0, by0 - 15, 9 + bx0, by0 - 9, '#1a1a24'); R(7 + bx0, by0 - 14, 8 + bx0, by0 - 10, '#6fb0ff');
      } else if (arm === 'hold') {
        L(6 + bx0, by0 - 2, 11 + bx0, by0 - 4, sleeve); E(11 + bx0, by0 - 4, 1.8, 1.8, handCol);
        L(-6 + bx0, by0 - 2, -10 + bx0, by0 - 4, sleeve);
      } else if (arm === 'controller') {
        E(4 + bx0, by0 + 2, 1.8, 1.8, handCol); E(-4 + bx0, by0 + 2, 1.8, 1.8, handCol);
        R(-3 + bx0, by0 + 1, 3 + bx0, by0 + 3, '#3a3a48'); R(-2 + bx0, by0 + 2, -2 + bx0, by0 + 2, '#f44'); R(2 + bx0, by0 + 2, 2 + bx0, by0 + 2, '#4f4');
      } else if (arm === 'cover') { // hands on face
        E(8 + bx0, by0 - 12, 2.2, 2.2, handCol); E(3 + bx0, by0 - 13, 2.2, 2.2, handCol);
      } else if (arm === 'mop') {
        L(6 + bx0, by0 - 3, 12 + bx0, by0 - 8, sleeve); E(12 + bx0, by0 - 8, 1.8, 1.8, handCol);
      } else if (arm === 'wave') {
        const wv = Math.sin(CH.game.t * 10) * 2;
        L(6 + bx0, by0 - 3, 10 + bx0 + wv, by0 - 14, sleeve); E(10 + bx0 + wv, by0 - 15, 1.8, 1.8, handCol);
      } else if (arm === 'pocket') {
        // hands hidden
      } else if (arm === 'belly') {
        E(6 + bx0, by0 + 1, 1.8, 1.8, handCol); E(-6 + bx0, by0 + 1, 1.8, 1.8, handCol);
      }
    } else {
      // sitting: arms on lap
      E(6 + bx0, by0 + 4, 1.8, 1.8, handCol); E(-6 + bx0, by0 + 4, 1.8, 1.8, handCol);
      if (arm === 'controller') { R(-3 + bx0, by0 + 3, 3 + bx0, by0 + 5, '#3a3a48'); R(-2 + bx0, by0 + 4, -2 + bx0, by0 + 4, '#f44'); R(2 + bx0, by0 + 4, 2 + bx0, by0 + 4, '#4f4'); }
    }

    // ---- head
    const hx = 3 + jig * 0.3 + (p.headDX || 0), hy = -26 - bob * 0.6 + (p.headDY || 0);
    const hood = outfit === 'hoodie' || outfit === 'pajamas';
    // head quills
    for (const [a, b, c, d] of [[hx - 4, hy - 5, hx - 6 - qt * 2, hy - 10 + qt], [hx - 1, hy - 6, hx - 2 - qt * 2, hy - 11 + qt], [hx + 2, hy - 6, hx + 3 - qt * 2, hy - 11 + qt], [hx - 6, hy - 3, hx - 10 - qt * 2, hy - 6 + qt]]) {
      L(a, b, c, d, quillCol); R(c, d, c, d, COL.quillT);
    }
    if (hood) {
      E(hx - 1, hy - 0.5, 9.5, 9, bodyD);
      E(hx - 1, hy - 1, 8.8, 8.3, bodyCol);
    }
    // face fur
    E(hx + (hood ? 1.5 : 0), hy + (hood ? 0.5 : 0), hood ? 7.2 : 8.5, hood ? 7.2 : 8.2, COL.fur);
    E(hx + (hood ? 3.5 : 3), hy + 2.5, hood ? 4.2 : 5, hood ? 3.4 : 4, COL.furL); // lighter muzzle area
    if (!hood) { // ear
      E(hx - 3, hy - 6, 1.6, 1.6, COL.furD); E(hx - 3, hy - 6, 0.8, 0.8, COL.blush);
    }
    // hat
    if (p.hat === 'visor' || outfit === 'uniform' || outfit === 'janitor') {
      if (p.hat !== 'none') {
        R(hx - 6, hy - 7, hx + 5, hy - 6, COL.visor);
        R(hx - 5, hy - 8, hx + 4, hy - 8, COL.visor);
        R(hx + 5, hy - 6, hx + 10, hy - 5, COL.visor); // brim
        R(hx - 1, hy - 8, hx + 1, hy - 7, COL.uniY); // D logo dot
      }
    }
    if (p.hat === 'hairnet') { E(hx - 1, hy - 5, 6, 3, 'rgba(255,255,255,0.5)'); }
    if (p.hat === 'crown') { R(hx - 5, hy - 10, hx + 5, hy - 7, COL.gold); R(hx - 5, hy - 12, hx - 5, hy - 11, COL.gold); R(hx, hy - 12, hx, hy - 11, COL.gold); R(hx + 5, hy - 12, hx + 5, hy - 11, COL.gold); }

    // ---- face
    const face = p.face || 'normal';
    const lx = CH.clamp(p.lookX || 0, -1, 1), ly = CH.clamp(p.lookY || 0, -1, 1);
    const eyeY = hy - 1;
    const e1x = hx + 1, e2x = hx + 6;
    const blink = p.blink || sleep || face === 'happy' || face === 'sleep';
    const drawEye = (ex) => {
      if (face === 'dead') { L(ex - 1, eyeY - 1, ex + 1, eyeY + 1, COL.pupil); L(ex + 1, eyeY - 1, ex - 1, eyeY + 1, COL.pupil); return; }
      if (blink) {
        if (face === 'happy') { R(ex - 1, eyeY, ex + 1, eyeY, COL.pupil); R(ex - 1, eyeY - 1, ex - 1, eyeY - 1, COL.pupil); R(ex + 1, eyeY - 1, ex + 1, eyeY - 1, COL.pupil); }
        else R(ex - 1, eyeY, ex + 1, eyeY, COL.pupil);
        return;
      }
      if (face === 'shock' || face === 'scared') {
        E(ex, eyeY, 2.2, 2.6, COL.eye); R(ex + lx, eyeY + ly, ex + lx, eyeY + ly, COL.pupil);
        return;
      }
      if (face === 'sad' || face === 'cry' || face === 'worried') {
        R(ex - 1, eyeY - 1, ex + 1, eyeY + 1, COL.eye); R(ex + lx, eyeY, ex + 1 + lx, eyeY + 1, COL.pupil);
        R(ex - 1, eyeY - 1, ex + 1, eyeY - 1, face === 'worried' ? COL.eye : COL.furD); // droop lid
        if (face === 'worried') { R(ex - 1, eyeY - 2, ex, eyeY - 2, COL.furD); } else R(ex - 1, eyeY - 2, ex, eyeY - 2, COL.furD);
        return;
      }
      if (face === 'tired') {
        R(ex - 1, eyeY - 1, ex + 1, eyeY + 1, COL.eye); R(ex - 1, eyeY - 1, ex + 1, eyeY - 1, COL.fur); R(ex + lx, eyeY, ex + 1 + lx, eyeY + 1, COL.pupil);
        R(ex - 1, eyeY + 2, ex + 1, eyeY + 2, gfx.shade(COL.fur, -25)); // bags
        return;
      }
      if (face === 'angry' || face === 'focused') {
        R(ex - 1, eyeY - 1, ex + 1, eyeY + 1, COL.eye); R(ex + lx, eyeY, ex + 1 + lx, eyeY + 1, COL.pupil);
        R(ex - 1, eyeY - 2, ex + 1, eyeY - 2, COL.furD); if (face === 'angry') R(ex - 1, eyeY - 1, ex - 1, eyeY - 1, COL.furD);
        return;
      }
      // normal
      R(ex - 1, eyeY - 1, ex + 1, eyeY + 1, COL.eye);
      R(ex + lx, eyeY + ly, ex + 1 + lx, eyeY + 1 + ly, COL.pupil);
      R(ex + 1 + lx, eyeY + ly, ex + 1 + lx, eyeY + ly, '#fff');
    };
    drawEye(e1x); drawEye(e2x);
    // nose
    R(hx + 8, hy + 1, hx + 9, hy + 1, COL.nose);
    // mouth
    const m = p.mouth || (face === 'happy' ? 'smile' : face === 'sad' || face === 'cry' ? 'frown' : face === 'shock' ? 'open' : face === 'angry' ? 'frown' : face === 'worried' ? 'wobble' : face === 'tired' ? 'flat' : face === 'sleep' ? 'open_small' : 'flat');
    const my = hy + 4;
    if (m === 'smile') { R(hx + 4, my, hx + 7, my, COL.nose); R(hx + 3, my - 1, hx + 3, my - 1, COL.nose); R(hx + 8, my - 1, hx + 8, my - 1, COL.nose); }
    else if (m === 'frown') { R(hx + 4, my - 1, hx + 7, my - 1, COL.nose); R(hx + 3, my, hx + 3, my, COL.nose); R(hx + 8, my, hx + 8, my, COL.nose); }
    else if (m === 'open') { E(hx + 5.5, my, 2, 2, COL.nose); R(hx + 5, my + 1, hx + 6, my + 1, COL.tongue); }
    else if (m === 'open_small') { R(hx + 5, my, hx + 6, my + 1, COL.nose); }
    else if (m === 'wobble') { for (let i = 0; i < 5; i++) R(hx + 3 + i, my + (i % 2), hx + 3 + i, my + (i % 2), COL.nose); }
    else if (m === 'grin') { R(hx + 3, my, hx + 8, my, COL.nose); R(hx + 4, my + 1, hx + 7, my + 1, '#fff'); }
    else if (m === 'eat') { E(hx + 5.5, my, 2, 1 + (Math.sin(CH.game.t * 20) > 0 ? 1 : 0), COL.nose); }
    else R(hx + 4, my, hx + 7, my, COL.nose);
    // blush
    R(hx - 1, hy + 2, hx - 1, hy + 2, COL.blush); R(hx + 9, hy + 3, hx + 9, hy + 3, COL.blush);
    // tears
    if (face === 'cry') { const tt = (CH.game.t * 3) % 1; R(e1x - 1, eyeY + 2 + Math.floor(tt * 4), e1x - 1, eyeY + 3 + Math.floor(tt * 4), '#8fd0ff'); R(e2x + 1, eyeY + 2 + Math.floor(((tt + 0.5) % 1) * 4), e2x + 1, eyeY + 3 + Math.floor(((tt + 0.5) % 1) * 4), '#8fd0ff'); }
    // sweat drops
    if (p.sweat > 0) {
      const n = Math.ceil(p.sweat * 3);
      for (let i = 0; i < n; i++) {
        const tt = (CH.game.t * 1.5 + i * 0.37) % 1;
        R(hx - 5 - i * 2, hy - 4 + Math.floor(tt * 6), hx - 5 - i * 2, hy - 3 + Math.floor(tt * 6), '#9fdcff');
      }
    }
    // sleep zzz
    if (sleep) {
      const tt = (CH.game.t * 0.7) % 1;
      gfx.text('z', ox + X(hx + 8), oy + Y(hy - 10 - tt * 10), 'rgba(255,255,255,' + (1 - tt) + ')');
      const t2 = (tt + 0.5) % 1;
      gfx.text('Z', ox + X(hx + 11), oy + Y(hy - 12 - t2 * 10), 'rgba(255,255,255,' + (1 - t2) + ')');
    }
    // emote bubble
    if (p.emote) {
      const ex = ox + X(hx + 9), ey = oy + Y(hy - 14);
      gfx.rrect(ex - 5, ey - 5, 11, 11, 3, '#fff'); gfx.rect(ex - 2, ey + 6, 2, 1, '#fff'); gfx.rect(ex - 3, ey + 7, 1, 1, '#fff');
      gfx.text(p.emote, ex + 1, ey - 3, p.emote === '♥' ? '#e04060' : '#222', { align: 'center' });
    }
  }
  CH.drawChubby = drawChubby;

  // ---- Actor: animation controller -----------------------------------------------
  class Chubby {
    constructor(x, y) {
      this.x = x; this.y = y; this.vx = 0; this.vy = 0;
      this.flip = false; this.walk = 0; this.moving = 0;
      this.squashX = new CH.Spring(260, 14, 1); this.squashY = new CH.Spring(260, 14, 1);
      this.jiggle = new CH.Spring(180, 6, 0);
      this.quill = new CH.Spring(120, 8, 0);
      this.face = 'normal'; this.mouth = null; this.blinkT = CH.rand(2, 4); this.blink = false;
      this.outfit = CH.state.outfit || 'hoodie'; this.arm = 'idle'; this.hat = null;
      this.sweat = 0; this.lookX = 0; this.lookY = 0; this.sleep = false; this.sitting = false; this.emote = null; this.emoteT = 0;
      this.stepT = 0; this.speed = 70; this.lastVx = 0; this.idleT = 0; this.headDX = 0; this.headDY = 0;
      this.dust = null; this.grounded = true; this.hidden = false;
    }
    setFace(f, dur) { this.face = f; this.faceT = dur || 0; }
    doEmote(e, dur = 1.5) { this.emote = e; this.emoteT = dur; CH.audio.sfx('pop'); }
    land(power = 1) { this.squashY.x = 1 - 0.3 * power; this.squashX.x = 1 + 0.3 * power; this.jiggle.kick(-40 * power); CH.audio.sfx('land'); }
    hop(power = 1) { this.squashY.x = 1 + 0.25 * power; this.squashX.x = 1 - 0.2 * power; }
    update(dt, particles) {
      // walking anim
      const sp = Math.abs(this.vx);
      const target = CH.clamp(sp / this.speed, 0, 1);
      this.moving = CH.approach(this.moving, target, dt * 6);
      if (sp > 2) {
        this.walk += dt * (8 + sp * 0.12);
        this.stepT += dt * sp;
        if (this.stepT > 26) { this.stepT = 0; CH.audio.sfx(this.stepSfx || 'stepWood'); if (particles && this.grounded) particles.burst(this.x - Math.sign(this.vx) * 4, this.y, 2, { color: ['#c9b48a', '#8b7355'], speed: 15, grav: 60, life: 0.35, angle: -Math.PI / 2, spread: 1.2 }); }
        if (this.vx > 0) this.flip = false; else if (this.vx < 0) this.flip = true;
        this.idleT = 0;
      } else { this.walk = CH.approach(this.walk, Math.round(this.walk / Math.PI) * Math.PI, dt * 10); this.idleT += dt; }
      // jiggle on acceleration changes
      const ax = (this.vx - this.lastVx);
      if (Math.abs(ax) > 20) this.jiggle.kick(-ax * 0.9 * (this.flip ? -1 : 1));
      this.lastVx = this.vx;
      this.quill.target = CH.clamp(this.vx / this.speed, -1, 1) * (this.flip ? -1 : 1);
      this.squashX.update(dt); this.squashY.update(dt); this.jiggle.update(dt); this.quill.update(dt);
      // subtle breathing when idle
      this.breath = Math.sin(CH.game.t * 2.2) * 0.012;
      // blinking
      this.blinkT -= dt;
      if (this.blinkT <= 0) { this.blink = !this.blink; this.blinkT = this.blink ? 0.12 : CH.rand(1.5, 4); }
      if (this.faceT > 0) { this.faceT -= dt; if (this.faceT <= 0) this.face = 'normal'; }
      if (this.emoteT > 0) { this.emoteT -= dt; if (this.emoteT <= 0) this.emote = null; }
    }
    params(extra = {}) {
      return Object.assign({
        sx: this.squashX.x + this.breath, sy: this.squashY.x - this.breath, jig: CH.clamp(this.jiggle.x, -4, 4), walk: this.walk, moving: this.moving,
        face: this.face, mouth: this.mouth, blink: this.blink, outfit: this.outfit, flip: this.flip, quillTilt: CH.clamp(this.quill.x, -1, 1),
        arm: this.arm, hat: this.hat, sweat: this.sweat, lookX: this.lookX, lookY: this.lookY, sleep: this.sleep, sitting: this.sitting, emote: this.emote,
        headDX: this.headDX, headDY: this.headDY,
      }, extra);
    }
    draw(g, camX = 0, camY = 0, extra) {
      if (this.hidden) return;
      drawChubby(g, this.x - camX, this.y - camY, this.params(extra));
    }
  }
  CH.Chubby = Chubby;

  // portrait (for dialogue box): head close-up
  CH.ui.portraits.Chubby = (g, x, y, d) => {
    const face = (d && d.opts && d.opts.face) || 'normal';
    g.save(); g.translate(x, y + 28); g.scale(1.6, 1.6);
    drawChubby(g, 0, 0, { face, outfit: CH.state.outfit || 'hoodie', noShadow: true, blink: false, arm: 'pocket' });
    g.restore();
  };
})(window.CH);
