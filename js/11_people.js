// ============================================================================
// NPC "critters": parametric forest-animal people (mom, doctor, coworkers...)
// ============================================================================
(function (CH) {
  const gfx = CH.gfx;

  const SPECIES = {
    porcupine: { fur: '#9a6a48', furL: '#c49a72', ears: 'small', quills: true, snout: 'round' },
    beaver: { fur: '#7a4a2a', furL: '#b58356', ears: 'round', tail: 'flat', teeth: true, snout: 'round' },
    goose: { fur: '#f1f1ee', furL: '#ffffff', ears: 'none', beak: true, neck: 5, snout: 'none' },
    moose: { fur: '#5b3d24', furL: '#8a6a4a', ears: 'moose', antlers: true, snout: 'long' },
    raccoon: { fur: '#8a8a90', furL: '#c8c8cc', ears: 'point', mask: true, tail: 'ring', snout: 'point' },
    bear: { fur: '#4a3a2a', furL: '#8a6a4a', ears: 'round', snout: 'round' },
    rabbit: { fur: '#d8cfc0', furL: '#ffffff', ears: 'long', snout: 'small' },
    fox: { fur: '#d9722c', furL: '#ffffff', ears: 'point', tail: 'bushy', snout: 'point' },
    deer: { fur: '#b07a4a', furL: '#e0c8a0', ears: 'point', antlers: 'small', snout: 'long' },
    squirrel: { fur: '#a0522d', furL: '#e0b088', ears: 'point', tail: 'squirrel', snout: 'small' },
    owl: { fur: '#8a7050', furL: '#d8c8a0', ears: 'tuft', beak: true, bigEyes: true, snout: 'none' },
    cat: { fur: '#6a6a72', furL: '#c0c0c8', ears: 'point', tail: 'thin', snout: 'small' },
    dog: { fur: '#c8a060', furL: '#f0e0c0', ears: 'floppy', tail: 'thin', snout: 'round' },
    skunk: { fur: '#22222a', furL: '#ffffff', ears: 'small', tail: 'bushy', stripe: true, snout: 'small' },
    hedgehog: { fur: '#3b6fd6', furL: '#f2c9a0', ears: 'point', quills: 'blue', snout: 'point' },
  };
  CH.SPECIES = SPECIES;

  const OUTFITS = {
    dress: { top: '#c85a8a', topD: '#8f3c62', bottom: 'dress', apron: '#f4efe4' },
    labcoat: { top: '#f4f4f8', topD: '#c8c8d4', bottom: '#3a3a48', coat: true },
    scrubs: { top: '#3fa79a', topD: '#2b756c', bottom: '#3fa79a' },
    polo: { top: '#c8352b', topD: '#8f2419', bottom: '#2a2530', collar: '#f5c33b', hat: 'visor' },
    casual: { top: '#5a7ac8', topD: '#3b5390', bottom: '#3a3a48' },
    suit: { top: '#2a3350', topD: '#1b2238', bottom: '#2a3350', tie: '#c8352b', shirt: '#fff' },
    gown: { top: '#c7dbe8', topD: '#94b0c4', bottom: '#c7dbe8', pattern: true },
    paramedic: { top: '#243a6a', topD: '#16254a', bottom: '#243a6a', stripe: '#f2f21a' },
    hoodie: { top: '#6a5acd', topD: '#483a94', bottom: '#3a3a48', hood: true },
    coat: { top: '#7a4a3a', topD: '#52301f', bottom: '#3a3a48', long: true },
    cook: { top: '#f4f4f8', topD: '#c8c8d4', bottom: '#2a2530', hat: 'paper' },
    manager: { top: '#3a3a48', topD: '#22222c', bottom: '#22222c', tie: '#f5c33b', shirt: '#fff', hat: 'visor' },
    security: { top: '#1a1a24', topD: '#0a0a10', bottom: '#1a1a24' },
    winter: { top: '#c8352b', topD: '#8f2419', bottom: '#3a3a48', hat: 'toque' },
    corporate: { top: '#1a1a24', topD: '#0a0a10', bottom: '#1a1a24', tie: '#d4af37', shirt: '#fff' },
    vest: { top: '#ff8800', topD: '#b85f00', bottom: '#3a3a48', stripe: '#dddd33' },
  };
  CH.OUTFITS = OUTFITS;

  // p: {species, outfit, colors:{top,bottom,fur}, sx, sy, walk, moving, flip, face, blink, talk, arm, pose, glasses, hair, mustache, height, width, hat, accessory, sleep}
  function drawCritter(g, x, y, p = {}) {
    const sp = SPECIES[p.species || 'bear'];
    const of = Object.assign({}, OUTFITS[p.outfit || 'casual'], p.outfitOverride || {});
    if (p.topColor) { of.top = p.topColor; of.topD = gfx.shade(p.topColor, -50); }
    if (p.bottomColor) of.bottom = p.bottomColor;
    const fur = p.fur || sp.fur, furL = p.furL || sp.furL, furD = gfx.shade(fur, -40);
    const sx = p.sx || 1, sy = p.sy || 1, dir = p.flip ? -1 : 1;
    const X = (v) => Math.round(v * sx) * dir, Y = (v) => Math.round(v * sy);
    const ox = Math.round(x), oy = Math.round(y);
    const E = (cx, cy, rx, ry, c) => gfx.ellipse(ox + X(cx), oy + Y(cy), Math.max(0.6, rx * sx), Math.max(0.6, ry * sy), c);
    const R = (x0, y0, x1, y1, c) => { const ax = ox + X(x0), bx = ox + X(x1), ay = oy + Y(y0), by = oy + Y(y1); gfx.rect(Math.min(ax, bx), Math.min(ay, by), Math.abs(bx - ax) + 1, Math.abs(by - ay) + 1, c); };
    const L = (x0, y0, x1, y1, c) => gfx.line(ox + X(x0), oy + Y(y0), ox + X(x1), oy + Y(y1), c);
    const walk = p.walk || 0, moving = p.moving || 0;
    const H = p.height || 1, Wd = p.width || 1;
    const legH = 7 * H, bw = 6.5 * Wd, bh = 10 * H;
    const pose = p.pose || 'stand';
    const face = p.face || 'normal';
    const bob = Math.abs(Math.sin(walk)) * 1.0 * moving;
    const hr = (p.headSize || 5.5) * (sp.bigEyes ? 1.1 : 1);

    if (pose === 'lying') { drawLying(); return; }
    if (pose === 'inbed') { drawInBed(); return; }

    // shadow
    if (!p.noShadow) { g.globalAlpha = 0.25; gfx.ellipse(ox, oy + 1, 8 * sx, 2, '#000'); g.globalAlpha = 1; }
    const sitting = pose === 'sit';
    const bodyBottom = sitting ? -6 : -legH;
    const bcy = bodyBottom - bh + 1 - bob;
    // ---- tail
    if (sp.tail === 'flat') { E(-8, -3, 5, 2, furD); E(-8, -3, 4, 1.2, '#4a2e18'); }
    if (sp.tail === 'bushy') { E(-9, -8, 4, 5, fur); E(-9, -10, 2.5, 2.5, furL); }
    if (sp.tail === 'ring') { E(-9, -7, 3, 5, fur); R(-11, -9, -7, -9, '#333'); R(-11, -6, -7, -6, '#333'); }
    if (sp.tail === 'squirrel') { E(-9, -14, 3.5, 7, fur); E(-9, -18, 3, 3, furL); }
    if (sp.tail === 'thin') { L(-6, -8, -11, -14, fur); }
    // ---- legs
    if (!sitting) {
      const l1 = Math.sin(walk) * 3 * moving, l2 = -Math.sin(walk) * 3 * moving;
      const legCol = of.bottom === 'dress' ? fur : of.bottom;
      R(-3 + l1 * 0.5, bodyBottom, -2 + l1 * 0.5, -1 - Math.max(0, l1) * 0.4, legCol);
      R(2 + l2 * 0.5, bodyBottom, 3 + l2 * 0.5, -1 - Math.max(0, l2) * 0.4, legCol);
      const shoe = of.shoe || (p.outfit === 'scrubs' || p.outfit === 'labcoat' ? '#fff' : '#2a2030');
      E(-2 + l1 * 0.5, -1 - Math.max(0, l1) * 0.4, 2.2, 1.3, shoe); E(3 + l2 * 0.5, -1 - Math.max(0, l2) * 0.4, 2.2, 1.3, shoe);
    } else {
      // legs forward
      R(1, -6, 8, -4, of.bottom === 'dress' ? fur : of.bottom); R(7, -5, 8, -1, of.bottom === 'dress' ? fur : of.bottom);
      E(8, -1, 2.2, 1.3, '#2a2030');
    }
    // ---- body
    if (of.bottom === 'dress') {
      // skirt flares
      const skirt = of.top;
      for (let i = 0; i < 6; i++) R(-bw - i * 0.6, bcy + bh - 6 + i, bw + i * 0.6, bcy + bh - 6 + i, i % 2 ? of.topD : skirt);
    }
    E(0, bcy, bw, bh, of.topD);
    E(0.5, bcy - 0.5, bw - 0.8, bh - 0.8, of.top);
    if (of.long) R(-bw, bcy + bh - 4, bw, bcy + bh + 2, of.top);
    if (of.coat) { R(1, bcy - bh + 2, 3, bcy + bh - 2, of.topD); R(-bw + 1, bcy + bh - 5, bw - 1, bcy + bh, of.top); }
    if (of.apron) { R(-bw + 2, bcy - 3, bw - 2, bcy + bh - 3, of.apron); R(-bw + 3, bcy, bw - 3, bcy, gfx.shade(of.apron, -30)); }
    if (of.collar) { R(-2, bcy - bh + 1, 2, bcy - bh + 2, of.collar); }
    if (of.tie) { R(-1, bcy - bh + 1, 1, bcy - bh + 3, of.shirt); R(0, bcy - bh + 3, 0, bcy + 1, of.tie); R(-1, bcy - 3, 1, bcy, of.tie); }
    if (of.stripe) { R(-bw + 1, bcy, bw - 1, bcy + 1, of.stripe); }
    if (of.pattern) { for (let i = -4; i <= 4; i += 4) for (let j = -6; j <= 6; j += 4) R(i, bcy + j, i, bcy + j, '#6a8ab0'); }
    if (p.nametag) { R(-4, bcy - 4, -1, bcy - 3, '#fff'); }
    if (p.stethoscope) { L(-3, bcy - bh + 1, -3, bcy - 2, '#333'); L(3, bcy - bh + 1, 3, bcy - 2, '#333'); E(-3, bcy - 1, 1.5, 1.5, '#aab'); }
    // ---- arms
    const arm = p.arm || 'idle';
    const hand = fur;
    const shY = bcy - bh + 4;
    if (arm === 'idle') {
      const sw = Math.sin(walk + Math.PI) * 2 * moving;
      L(bw - 1, shY, bw + 1 + sw * 0.3, shY + 9, of.top); E(bw + 1 + sw * 0.3, shY + 10, 1.6, 1.6, hand);
      L(-bw + 1, shY, -bw - 1 - sw * 0.3, shY + 9, of.topD); E(-bw - 1 - sw * 0.3, shY + 10, 1.6, 1.6, furD);
    } else if (arm === 'wave') {
      const wv = Math.sin(CH.game.t * 10) * 2;
      L(bw - 1, shY, bw + 3 + wv, shY - 8, of.top); E(bw + 3 + wv, shY - 9, 1.6, 1.6, hand);
      L(-bw + 1, shY, -bw - 1, shY + 9, of.topD); E(-bw - 1, shY + 10, 1.6, 1.6, furD);
    } else if (arm === 'tray' || arm === 'hold') {
      L(bw - 1, shY, bw + 5, shY + 3, of.top); E(bw + 5, shY + 3, 1.6, 1.6, hand);
      L(-bw + 1, shY, -bw + 6, shY + 4, of.topD);
      if (arm === 'tray') { R(bw - 2, shY + 1, bw + 9, shY + 2, '#d0d0d8'); }
    } else if (arm === 'clipboard') {
      L(bw - 1, shY, bw + 3, shY + 4, of.top); E(bw + 3, shY + 4, 1.6, 1.6, hand);
      R(bw + 1, shY - 2, bw + 6, shY + 5, '#8a6a3a'); R(bw + 2, shY - 1, bw + 5, shY + 4, '#f4f4f0'); R(bw + 3, shY, bw + 4, shY, '#333'); R(bw + 3, shY + 2, bw + 4, shY + 2, '#333');
      L(-bw + 1, shY, -bw - 1, shY + 9, of.topD);
    } else if (arm === 'crossed') {
      L(bw - 1, shY, -2, shY + 5, of.top); L(-bw + 1, shY, 2, shY + 5, of.top); E(-2, shY + 5, 1.6, 1.6, hand); E(2, shY + 6, 1.6, 1.6, hand);
    } else if (arm === 'phone') {
      L(bw - 1, shY, bw, shY - 5, of.top); E(bw, shY - 6, 1.6, 1.6, hand); R(bw - 1, shY - 10, bw + 1, shY - 5, '#1a1a24');
    } else if (arm === 'mop') {
      L(bw - 1, shY, bw + 5, shY + 1, of.top); E(bw + 5, shY + 1, 1.6, 1.6, hand);
    } else if (arm === 'hips') {
      L(bw - 1, shY, bw + 3, shY + 6, of.top); L(bw + 3, shY + 6, bw - 1, shY + 8, of.top);
      L(-bw + 1, shY, -bw - 3, shY + 6, of.topD); L(-bw - 3, shY + 6, -bw + 1, shY + 8, of.topD);
    } else if (arm === 'up') {
      L(bw - 1, shY, bw + 2, shY - 10, of.top); E(bw + 2, shY - 11, 1.6, 1.6, hand);
      L(-bw + 1, shY, -bw - 2, shY - 10, of.topD); E(-bw - 2, shY - 11, 1.6, 1.6, furD);
    } else if (arm === 'pocket') { /* none */ }
    // ---- neck (goose)
    const neck = sp.neck || 0;
    if (neck) { R(0, bcy - bh - neck, 2, bcy - bh + 1, fur); }
    // ---- head
    const hx = 1, hy = bcy - bh - hr + 1 - neck + (p.headDY || 0);
    // quills (porcupine)
    if (sp.quills) {
      const qc = sp.quills === 'blue' ? '#2a4ea8' : (p.quillColor || '#c9c2b0');
      for (const [a, b, c, d] of [[hx - 3, hy - 4, hx - 6, hy - 9], [hx, hy - 5, hx - 1, hy - 10], [hx + 3, hy - 5, hx + 4, hy - 10], [hx - 5, hy - 1, hx - 9, hy - 4], [-bw + 1, bcy - bh + 3, -bw - 4, bcy - bh - 1], [-bw, bcy - 2, -bw - 5, bcy - 4]]) { L(a, b, c, d, qc); R(c, d, c, d, '#3a2a1c'); }
    }
    // ears
    if (sp.ears === 'round') { E(hx - 4, hy - hr + 1, 2.2, 2.2, fur); E(hx + 3, hy - hr + 1, 2.2, 2.2, fur); E(hx - 4, hy - hr + 1, 1, 1, furL); }
    if (sp.ears === 'small') { E(hx - 3, hy - hr + 1, 1.6, 1.6, furD); }
    if (sp.ears === 'point') { R(hx - 5, hy - hr - 3, hx - 3, hy - hr + 1, fur); R(hx - 4, hy - hr - 4, hx - 4, hy - hr - 4, fur); R(hx + 2, hy - hr - 3, hx + 4, hy - hr + 1, fur); R(hx + 3, hy - hr - 4, hx + 3, hy - hr - 4, fur); R(hx - 4, hy - hr - 2, hx - 4, hy - hr, furL); }
    if (sp.ears === 'long') { R(hx - 4, hy - hr - 9, hx - 3, hy - hr + 1, fur); R(hx + 1, hy - hr - 8, hx + 2, hy - hr + 1, fur); R(hx - 4, hy - hr - 7, hx - 4, hy - hr - 2, '#f0b0b8'); }
    if (sp.ears === 'floppy') { E(hx - 5, hy + 1, 1.6, 3.5, furD); E(hx + 5, hy + 1, 1.6, 3.5, furD); }
    if (sp.ears === 'moose') { E(hx - 5, hy - 2, 2.5, 1.5, fur); }
    if (sp.ears === 'tuft') { R(hx - 4, hy - hr - 3, hx - 4, hy - hr + 1, fur); R(hx + 3, hy - hr - 3, hx + 3, hy - hr + 1, fur); }
    if (sp.antlers) {
      const big = sp.antlers === true;
      const ac = '#c8b090';
      L(hx - 3, hy - hr, hx - 6, hy - hr - (big ? 7 : 4), ac); L(hx - 6, hy - hr - (big ? 5 : 3), hx - 9, hy - hr - (big ? 8 : 5), ac); L(hx - 5, hy - hr - 4, hx - 3, hy - hr - (big ? 8 : 5), ac);
      if (big) { R(hx - 10, hy - hr - 9, hx - 5, hy - hr - 8, ac); L(hx - 8, hy - hr - 8, hx - 8, hy - hr - 12, ac); }
      L(hx + 3, hy - hr, hx + 5, hy - hr - (big ? 6 : 3), ac); if (big) L(hx + 5, hy - hr - 5, hx + 7, hy - hr - 9, ac);
    }
    // hair / hat behind
    if (p.hair === 'bun') { E(hx - 5, hy - hr + 1, 3, 3, p.hairColor || '#d8d0c0'); }
    if (p.hair === 'long') { E(hx - 3, hy + 2, hr - 1, hr + 3, p.hairColor || '#4a2a1a'); }
    // head
    E(hx, hy, hr, hr, fur);
    if (sp.mask) { R(hx - 2, hy - 2, hx + hr, hy, '#2a2a30'); }
    if (sp.stripe) { R(hx - 1, hy - hr, hx + 1, hy + hr - 2, furL); }
    // snout
    const snout = sp.snout;
    if (snout === 'round') { E(hx + hr - 1, hy + 2, 3, 2.2, furL); R(hx + hr + 1, hy + 1, hx + hr + 2, hy + 1, '#2a1a12'); }
    if (snout === 'long') { E(hx + hr, hy + 2, 4.5, 2.5, furL); R(hx + hr + 3, hy + 1, hx + hr + 4, hy + 2, '#2a1a12'); }
    if (snout === 'point') { E(hx + hr - 1, hy + 2, 3, 1.8, furL); R(hx + hr + 1, hy + 2, hx + hr + 2, hy + 2, '#2a1a12'); }
    if (snout === 'small') { E(hx + hr - 2, hy + 2, 2.2, 1.6, furL); R(hx + hr, hy + 2, hx + hr, hy + 2, '#2a1a12'); }
    if (sp.beak) { R(hx + hr - 2, hy + 1, hx + hr + 3, hy + 2, sp.bigEyes ? '#d9a04a' : '#f0a020'); R(hx + hr - 1, hy + 3, hx + hr + 2, hy + 3, sp.bigEyes ? '#b0802a' : '#d08010'); }
    if (sp.teeth) { R(hx + hr - 1, hy + 4, hx + hr, hy + 5, '#fff'); }
    if (p.mustache) { R(hx + hr - 3, hy + 3, hx + hr + 1, hy + 3, p.mustache === true ? furD : p.mustache); }
    // eyes
    const ey = hy - 1, e1 = hx + 1, e2 = hx + (sp.bigEyes ? 5 : 4);
    const blink = p.blink || p.sleep || face === 'happy';
    const drawEye = (ex) => {
      if (sp.bigEyes) { E(ex, ey, 2.2, 2.4, '#fff'); if (!blink) R(ex, ey, ex, ey + 1, '#111'); else R(ex - 1, ey, ex + 1, ey, '#111'); return; }
      if (blink) { if (face === 'happy') { R(ex - 1, ey, ex, ey, '#111'); R(ex + 1, ey - 1, ex + 1, ey - 1, '#111'); } else R(ex - 1, ey, ex + 1, ey, '#111'); return; }
      if (face === 'shock') { E(ex, ey, 1.6, 2, '#fff'); R(ex, ey, ex, ey, '#111'); return; }
      R(ex - 1, ey - 1, ex, ey, '#fff'); R(ex, ey, ex, ey, '#111');
      if (face === 'sad' || face === 'worried' || face === 'tired') R(ex - 1, ey - 1, ex, ey - 1, fur);
      if (face === 'angry') R(ex - 1, ey - 2, ex, ey - 2, furD);
    };
    drawEye(e1); drawEye(e2);
    if (p.glasses) { R(e1 - 2, ey - 2, e1 + 1, ey + 1, 'rgba(40,40,60,0.9)'); R(e2 - 2, ey - 2, e2 + 1, ey + 1, 'rgba(40,40,60,0.9)'); R(e1 - 1, ey - 1, e1, ey, 'rgba(180,220,255,0.6)'); R(e2 - 1, ey - 1, e2, ey, 'rgba(180,220,255,0.6)'); R(e1 + 2, ey - 1, e2 - 3, ey - 1, '#333'); }
    // mouth (for non-beak)
    if (!sp.beak) {
      const my = hy + 4, mx = hx + hr - 2;
      if (p.talk && Math.sin(CH.game.t * 18) > 0) R(mx - 1, my, mx, my + 1, '#2a1a12');
      else if (face === 'happy') { R(mx - 2, my, mx, my, '#2a1a12'); R(mx - 3, my - 1, mx - 3, my - 1, '#2a1a12'); }
      else if (face === 'sad' || face === 'worried') { R(mx - 2, my, mx, my, '#2a1a12'); R(mx - 3, my + 1, mx - 3, my + 1, '#2a1a12'); }
      else if (face === 'shock') { E(mx - 1, my + 1, 1.5, 1.5, '#2a1a12'); }
      else if (face === 'angry') { R(mx - 2, my, mx + 1, my, '#2a1a12'); }
      else R(mx - 2, my, mx - 1, my, '#2a1a12');
    }
    // hat
    const hat = p.hat || of.hat;
    if (hat === 'visor') { R(hx - hr + 1, hy - hr + 1, hx + hr - 1, hy - hr + 2, '#c8352b'); R(hx + hr - 1, hy - hr + 2, hx + hr + 4, hy - hr + 2, '#c8352b'); R(hx - 1, hy - hr + 1, hx + 1, hy - hr + 1, '#f5c33b'); }
    if (hat === 'paper') { R(hx - hr + 2, hy - hr - 3, hx + hr - 2, hy - hr + 1, '#fff'); R(hx - hr + 2, hy - hr - 3, hx + hr - 2, hy - hr - 3, '#ddd'); }
    if (hat === 'nurse') { R(hx - 3, hy - hr - 2, hx + 3, hy - hr, '#fff'); R(hx, hy - hr - 2, hx, hy - hr - 1, '#d33'); R(hx - 1, hy - hr - 1, hx + 1, hy - hr - 1, '#d33'); }
    if (hat === 'toque') { E(hx, hy - hr + 1, hr, 3, '#c8352b'); R(hx - hr, hy - hr + 1, hx + hr, hy - hr + 2, '#f4f1ea'); E(hx, hy - hr - 3, 1.5, 1.5, '#f4f1ea'); }
    if (hat === 'hardhat') { E(hx, hy - hr + 1, hr, 3.5, '#f5c33b'); R(hx - hr - 1, hy - hr + 2, hx + hr + 1, hy - hr + 2, '#f5c33b'); }
    if (hat === 'cap') { E(hx, hy - hr + 1, hr, 3, p.hatColor || '#3b6fd6'); R(hx + hr - 2, hy - hr + 2, hx + hr + 4, hy - hr + 2, p.hatColor || '#3b6fd6'); }
    if (hat === 'crown') { R(hx - 4, hy - hr - 2, hx + 4, hy - hr, '#f2c94c'); R(hx - 4, hy - hr - 4, hx - 4, hy - hr - 3, '#f2c94c'); R(hx, hy - hr - 4, hx, hy - hr - 3, '#f2c94c'); R(hx + 4, hy - hr - 4, hx + 4, hy - hr - 3, '#f2c94c'); }
    if (hat === 'headset') { R(hx - hr, hy - hr + 2, hx - hr, hy + 1, '#222'); R(hx - hr - 1, hy, hx - hr + 1, hy + 2, '#222'); L(hx - hr, hy + 2, hx + hr - 2, hy + 5, '#222'); }
    if (p.sleep) {
      const tt = (CH.game.t * 0.7) % 1;
      gfx.text('z', ox + X(hx + 8), oy + Y(hy - 8 - tt * 8), 'rgba(255,255,255,' + (1 - tt) + ')');
    }
    if (p.emote) {
      const ex = ox + X(hx + 8), ey2 = oy + Y(hy - hr - 8);
      gfx.rrect(ex - 5, ey2 - 5, 11, 11, 3, '#fff'); gfx.rect(ex - 2, ey2 + 6, 2, 1, '#fff');
      gfx.text(p.emote, ex + 1, ey2 - 3, p.emote === '♥' ? '#e04060' : '#222', { align: 'center' });
    }

    function drawLying() {
      // body horizontal along floor, head to the right
      if (!p.noShadow) { g.globalAlpha = 0.25; gfx.ellipse(ox, oy + 1, 16 * sx, 2, '#000'); g.globalAlpha = 1; }
      const cy = -5;
      E(-2, cy, bh, bw * 0.8, of.topD); E(-2, cy - 0.5, bh - 1, bw * 0.8 - 0.8, of.top);
      if (of.apron) R(-8, cy - 3, 5, cy + 2, of.apron);
      // legs to the left
      R(-bh - 6, cy - 1, -bh + 1, cy + 1, of.bottom === 'dress' ? fur : of.bottom);
      E(-bh - 7, cy + 1, 1.5, 2.2, '#2a2030');
      // arm flopped
      L(-2, cy - 2, 4, cy + 4, of.top); E(5, cy + 4, 1.6, 1.6, fur);
      // head to the right
      const hx2 = bh + 3, hy2 = cy - 1;
      if (sp.quills) for (const [a, b, c, d] of [[hx2 - 2, hy2 - 5, hx2 - 3, hy2 - 10], [hx2 + 2, hy2 - 5, hx2 + 3, hy2 - 10], [hx2 - 4, hy2 - 3, hx2 - 8, hy2 - 6]]) { L(a, b, c, d, p.quillColor || '#c9c2b0'); }
      if (p.hair === 'bun') E(hx2 - 4, hy2 - 4, 3, 3, p.hairColor || '#d8d0c0');
      E(hx2, hy2, hr, hr, fur);
      E(hx2 + hr - 1, hy2 + 2, 3, 2.2, furL);
      // closed eyes
      R(hx2, hy2 - 1, hx2 + 1, hy2 - 1, '#111'); R(hx2 + 3, hy2 - 1, hx2 + 4, hy2 - 1, '#111');
      if (p.glasses) { R(hx2 + 6, hy2 + 3, hx2 + 9, hy2 + 5, 'rgba(40,40,60,0.9)'); } // glasses fallen off
      R(hx2 + hr - 1, hy2 + 4, hx2 + hr, hy2 + 4, '#2a1a12');
    }
    function drawInBed() {
      // head + shoulders above blanket (blanket drawn by scene). y = pillow baseline
      const hx2 = 0, hy2 = -6;
      if (p.hair === 'bun') E(hx2 - 5, hy2 - 1, 3, 3, p.hairColor || '#d8d0c0');
      if (sp.quills) for (const [a, b, c, d] of [[hx2 - 3, hy2 - 4, hx2 - 6, hy2 - 8], [hx2, hy2 - 5, hx2 - 1, hy2 - 10], [hx2 + 3, hy2 - 5, hx2 + 4, hy2 - 9]]) { L(a, b, c, d, p.quillColor || '#c9c2b0'); R(c, d, c, d, '#3a2a1c'); }
      R(-7, hy2 + 3, 7, hy2 + 8, of.top || '#c7dbe8');
      E(hx2, hy2, hr, hr, fur);
      E(hx2 + hr - 1, hy2 + 2, 3, 2.2, furL); R(hx2 + hr + 1, hy2 + 1, hx2 + hr + 2, hy2 + 1, '#2a1a12');
      const ey2 = hy2 - 1;
      const bl = p.blink || p.sleep;
      for (const ex of [hx2 + 1, hx2 + 4]) {
        if (bl) R(ex - 1, ey2, ex + 1, ey2, '#111');
        else { R(ex - 1, ey2 - 1, ex, ey2, '#fff'); R(ex, ey2, ex, ey2, '#111'); if (face === 'sad' || face === 'tired') R(ex - 1, ey2 - 1, ex, ey2 - 1, fur); }
      }
      if (p.glasses) { R(hx2 - 1, ey2 - 2, hx2 + 2, ey2 + 1, 'rgba(40,40,60,0.9)'); R(hx2 + 2, ey2 - 2, hx2 + 5, ey2 + 1, 'rgba(40,40,60,0.9)'); R(hx2, ey2 - 1, hx2 + 1, ey2, 'rgba(180,220,255,0.6)'); R(hx2 + 3, ey2 - 1, hx2 + 4, ey2, 'rgba(180,220,255,0.6)'); }
      const my = hy2 + 4, mx = hx2 + hr - 2;
      if (p.talk && Math.sin(CH.game.t * 18) > 0) R(mx - 1, my, mx, my + 1, '#2a1a12');
      else if (face === 'happy') { R(mx - 2, my, mx, my, '#2a1a12'); R(mx - 3, my - 1, mx - 3, my - 1, '#2a1a12'); }
      else if (face === 'sad') { R(mx - 2, my, mx, my, '#2a1a12'); R(mx - 3, my + 1, mx - 3, my + 1, '#2a1a12'); }
      else R(mx - 2, my, mx - 1, my, '#2a1a12');
      if (p.sleep) { const tt = (CH.game.t * 0.7) % 1; gfx.text('z', ox + X(hx2 + 8), oy + Y(hy2 - 8 - tt * 8), 'rgba(255,255,255,' + (1 - tt) + ')'); }
    }
  }
  CH.drawCritter = drawCritter;

  // ---- NPC actor -----------------------------------------------------------------
  class NPC {
    constructor(def) {
      Object.assign(this, { x: 0, y: 0, vx: 0, speed: 40, flip: false, walk: 0, moving: 0, face: 'normal', arm: 'idle', pose: 'stand', name: 'NPC', species: 'bear', outfit: 'casual', blinkT: CH.rand(1, 4), blink: false, talk: false, target: null, bubble: null, bubbleT: 0, emote: null, emoteT: 0, hidden: false, idleT: 0, sx: 1, sy: 1, wanderRange: null, wanderT: 0 }, def);
      this.squash = new CH.Spring(200, 12, 1);
      this.onArrive = null;
    }
    walkTo(x, cb) { this.target = x; this.onArrive = cb || null; const sig = new CH.Signal(); this._arriveSig = sig; return sig; }
    say(text, dur = 2.5) { this.bubble = text; this.bubbleT = dur; }
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
      if (sp > 1) { this.walk += dt * (7 + sp * 0.1); this.idleT = 0; } else { this.walk = CH.approach(this.walk, Math.round(this.walk / Math.PI) * Math.PI, dt * 10); this.idleT += dt; }
      this.blinkT -= dt;
      if (this.blinkT <= 0) { this.blink = !this.blink; this.blinkT = this.blink ? 0.12 : CH.rand(1.5, 5); }
      if (this.bubbleT > 0) { this.bubbleT -= dt; if (this.bubbleT <= 0) this.bubble = null; }
      if (this.emoteT > 0) { this.emoteT -= dt; if (this.emoteT <= 0) this.emote = null; }
      this.squash.update(dt);
    }
    params(extra) {
      return Object.assign({ species: this.species, outfit: this.outfit, walk: this.walk, moving: this.moving, flip: this.flip, face: this.face, blink: this.blink, talk: this.talk, arm: this.arm, pose: this.pose, glasses: this.glasses, hair: this.hair, hairColor: this.hairColor, mustache: this.mustache, height: this.height, width: this.width, hat: this.hat, hatColor: this.hatColor, topColor: this.topColor, bottomColor: this.bottomColor, fur: this.fur, furL: this.furL, nametag: this.nametag, stethoscope: this.stethoscope, sleep: this.sleep, emote: this.emote, sx: this.squash.x * this.sx, sy: (2 - this.squash.x) * this.sy, headSize: this.headSize, quillColor: this.quillColor, outfitOverride: this.outfitOverride }, extra);
    }
    draw(g, camX = 0, camY = 0, extra) {
      if (this.hidden) return;
      drawCritter(g, this.x - camX, this.y - camY, this.params(extra));
      if (this.bubble) {
        const bx = Math.round(this.x - camX), by = Math.round(this.y - camY) - (this.pose === 'sit' ? 30 : 42) * (this.height || 1);
        const w = gfx.textWidth(this.bubble, 'small') + 8;
        gfx.rrect(bx - w / 2, by - 10, w, 11, 3, '#fff'); gfx.rect(bx - 1, by + 1, 2, 1, '#fff'); gfx.rect(bx, by + 2, 1, 1, '#fff');
        gfx.text(this.bubble, bx, by - 7, '#222', { align: 'center', font: 'small' });
      }
    }
  }
  CH.NPC = NPC;

  // ---- named characters --------------------------------------------------------------
  CH.makeMom = (x, y) => new CH.NPC({ name: 'Mom', species: 'porcupine', outfit: 'dress', glasses: true, hair: 'bun', hairColor: '#d8d0c0', quillColor: '#bfb8a8', x, y, speed: 30, height: 1.05, topColor: '#b95c86' });
  CH.makeDoctor = (x, y) => new CH.NPC({ name: 'Doctor', species: 'beaver', outfit: 'labcoat', glasses: true, stethoscope: true, x, y, speed: 45, height: 1.1 });
  CH.makeNurse = (x, y, v = 0) => new CH.NPC({ name: 'Nurse', species: v ? 'rabbit' : 'goose', outfit: 'scrubs', hat: v ? undefined : 'nurse', x, y, speed: 55 });
  CH.makeBrenda = (x, y) => new CH.NPC({ name: 'Brenda', species: 'moose', outfit: 'manager', x, y, speed: 40, height: 1.2, width: 1.1, glasses: true });
  CH.makeKevin = (x, y) => new CH.NPC({ name: 'Kevin', species: 'raccoon', outfit: 'cook', x, y, speed: 50, hat: 'paper' });
  CH.makeTammy = (x, y) => new CH.NPC({ name: 'Tammy', species: 'fox', outfit: 'polo', x, y, speed: 50, hair: 'long', hairColor: '#c04020' });
  CH.makeJorge = (x, y) => new CH.NPC({ name: 'Jorge', species: 'bear', outfit: 'polo', x, y, speed: 42, height: 1.15, width: 1.15 });
  CH.makeDestiny = (x, y) => new CH.NPC({ name: 'Destiny', species: 'skunk', outfit: 'polo', x, y, speed: 55, hat: 'headset' });
  const CUSTOMER_SPECIES = ['beaver', 'goose', 'moose', 'raccoon', 'bear', 'rabbit', 'fox', 'deer', 'squirrel', 'owl', 'cat', 'dog', 'skunk'];
  const CUSTOMER_OUTFITS = ['casual', 'hoodie', 'coat', 'winter', 'suit', 'vest', 'casual', 'casual'];
  const SHIRTS = ['#5a7ac8', '#c85a5a', '#5ac87a', '#c8a85a', '#8a5ac8', '#5ac8c8', '#e08040', '#7a7a7a', '#d060a0', '#406040'];
  CH.makeCustomer = (x, y, rng) => {
    const R = rng || { pick: CH.pick, range: CH.rand, chance: CH.chance };
    return new CH.NPC({ name: 'Customer', species: R.pick(CUSTOMER_SPECIES), outfit: R.pick(CUSTOMER_OUTFITS), topColor: R.pick(SHIRTS), x, y, speed: R.range(35, 55), height: R.range(0.85, 1.2), width: R.range(0.85, 1.25), glasses: R.chance(0.2), hat: R.chance(0.15) ? R.pick(['cap', 'toque']) : undefined, hatColor: R.pick(SHIRTS) });
  };

  // portraits
  const port = (mk) => (g, x, y, d) => { const n = mk(0, 0); n.face = (d && d.opts && d.opts.face) || 'normal'; n.blink = false; const hh = n.height || 1; g.save(); g.translate(x, y + 24 + Math.round((hh - 1) * 40)); g.scale(1.7, 1.7); n.talk = d && d.shown < d.text.length; drawCritter(g, 0, 0, n.params({ noShadow: true, arm: 'pocket' })); g.restore(); };
  CH.ui.portraits.Mom = port(CH.makeMom);
  CH.ui.portraits.Doctor = port(CH.makeDoctor);
  CH.ui.portraits.Nurse = port(CH.makeNurse);
  CH.ui.portraits.Brenda = port(CH.makeBrenda);
  CH.ui.portraits.Kevin = port(CH.makeKevin);
  CH.ui.portraits.Tammy = port(CH.makeTammy);
  CH.ui.portraits.Jorge = port(CH.makeJorge);
  CH.ui.portraits.Destiny = port(CH.makeDestiny);
})(window.CH);
