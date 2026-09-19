// ============================================================================
// ART - outlined sprite compositing, shading ramps, cartoon effects, bubbles
//
// Everything a character or prop draws goes through art.sprite(): the drawing
// lands on a scratch buffer, the buffer's silhouette is dilated into a dark
// outline, and the result is blitted in one piece. That is what gives every
// actor the heavy ink line of a hand-drawn sprite sheet without hand-placing
// a single outline pixel.
// ============================================================================
(function (CH) {
  const gfx = CH.gfx;
  const art = (CH.art = {});

  art.INK = '#150f1c';      // universal outline
  art.INK_SOFT = '#2a1f33'; // interior separation lines

  // ---- scratch buffers -------------------------------------------------------
  const scratch = new Map();
  function buf(w, h) {
    const key = w + 'x' + h;
    let b = scratch.get(key);
    if (!b) {
      b = { a: gfx.makeCanvas(w, h), b: gfx.makeCanvas(w + 2, h + 2) };
      b.ac = b.a.getContext('2d'); b.bc = b.b.getContext('2d');
      scratch.set(key, b);
    }
    b.ac.clearRect(0, 0, w, h);
    b.bc.clearRect(0, 0, w + 2, h + 2);
    return b;
  }

  // Dilate the silhouette by one pixel on all 8 sides, tint it, put the art back
  // on top. Cardinal-only dilation would leave the diagonals bare.
  const OFFS = [[0, 1], [2, 1], [1, 0], [1, 2], [0, 0], [2, 0], [0, 2], [2, 2]];

  // art.sprite(w, h, drawFn, opts) -> {canvas, ox, oy}
  // drawFn runs with the current gfx target set to the scratch buffer; it draws
  // in buffer coordinates, so callers offset by (ox, oy) themselves.
  art.sprite = function (w, h, drawFn, opts = {}) {
    w = Math.max(1, Math.ceil(w)); h = Math.max(1, Math.ceil(h));
    const s = buf(w, h);
    gfx.pushTarget(s.ac);
    drawFn(s.ac);
    gfx.popTarget();
    const ink = opts.outline === null ? null : opts.outline || art.INK;
    if (!ink) return { canvas: s.a, pad: 0 };
    for (const [dx, dy] of OFFS) s.bc.drawImage(s.a, dx, dy);
    s.bc.globalCompositeOperation = 'source-in';
    s.bc.fillStyle = ink;
    s.bc.fillRect(0, 0, w + 2, h + 2);
    s.bc.globalCompositeOperation = 'source-over';
    s.bc.drawImage(s.a, 1, 1);
    return { canvas: s.b, pad: 1 };
  };

  // Draw an outlined sprite anchored at (x, y) in the target, where (ax, ay) is
  // the anchor's position inside the w*h buffer.
  art.blit = function (x, y, w, h, ax, ay, drawFn, opts = {}) {
    const r = art.sprite(w, h, drawFn, opts);
    const ctx = opts.ctx || gfx.cur;
    const flip = opts.flip;
    const sc = opts.scale || 1;
    const px = Math.round(x), py = Math.round(y);
    if (!flip && sc === 1) {
      if (opts.alpha !== undefined) { ctx.save(); ctx.globalAlpha = opts.alpha; }
      ctx.drawImage(r.canvas, px - ax - r.pad, py - ay - r.pad);
      if (opts.alpha !== undefined) ctx.restore();
      return;
    }
    ctx.save();
    if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
    ctx.translate(px, py);
    ctx.scale(flip ? -sc : sc, sc);
    ctx.drawImage(r.canvas, -ax - r.pad, -ay - r.pad);
    ctx.restore();
  };

  // ---- colour ramps ----------------------------------------------------------
  // A material is a base plus its shadow, core shadow, highlight and rim.
  art.mat = function (base, opts = {}) {
    const dk = opts.dark !== undefined ? opts.dark : -34;
    const dr = opts.darker !== undefined ? opts.darker : -62;
    const lt = opts.light !== undefined ? opts.light : 26;
    return {
      base: base,
      d: gfx.shade(base, dk),
      dd: gfx.shade(base, dr),
      l: gfx.shade(base, lt),
      rim: opts.rim || gfx.mix(base, '#fff6e0', 0.45),
      line: gfx.shade(base, -78),
    };
  };

  // ---- cartoon reaction effects ----------------------------------------------
  // Drawn in world space above a head. t is scene time; each returns nothing.
  const FX = {
    sweat: (x, y, t, s) => {
      for (let i = 0; i < 2; i++) {
        const k = (t * 1.6 + i * 0.5) % 1;
        const dy = k * 7 * s, a = 1 - k;
        const c = 'rgba(150,220,255,' + a.toFixed(2) + ')';
        gfx.ellipse(x - 2 - i * 4 * s, y + dy, 1.4 * s, 2 * s, c);
        gfx.px(x - 2 - i * 4 * s, y + dy - 2 * s, c);
      }
    },
    exclaim: (x, y, t, s) => {
      const p = 1 + Math.sin(t * 16) * 0.12;
      gfx.rect(x - 1, y - 9 * s * p, 2, 6 * s * p, '#ffd84a');
      gfx.rect(x - 1, y - 1.5 * s, 2, 2, '#ffd84a');
    },
    question: (x, y, t, s) => {
      const b = Math.sin(t * 5) * 1.2;
      gfx.text('?', x, y - 8 * s + b, '#ffd84a', { align: 'center' });
    },
    anger: (x, y, t, s) => {
      const p = 1 + Math.sin(t * 14) * 0.15;
      const r = 4 * s * p, c = '#ff4d4d';
      gfx.rect(x - r, y - 1, r * 2, 2, c);
      gfx.rect(x - 1, y - r, 2, r * 2, c);
      gfx.px(x - r - 1, y - r - 1, c); gfx.px(x + r, y + r, c);
    },
    heart: (x, y, t, s) => {
      const k = (t * 0.9) % 1;
      const yy = y - k * 12 * s, a = 1 - k;
      const c = 'rgba(232,74,110,' + a.toFixed(2) + ')';
      gfx.ellipse(x - 1.5 * s, yy, 1.6 * s, 1.5 * s, c);
      gfx.ellipse(x + 1.5 * s, yy, 1.6 * s, 1.5 * s, c);
      gfx.tri(x - 3 * s, yy + 1, x + 3 * s, yy + 1, x, yy + 4 * s, c);
    },
    spark: (x, y, t, s) => {
      for (let i = 0; i < 3; i++) {
        const a = t * 3 + i * 2.1;
        const r = 5 * s + Math.sin(a) * 2;
        const px = x + Math.cos(a) * r, py = y + Math.sin(a * 0.7) * r * 0.5;
        gfx.px(px, py, '#ffe98a'); gfx.px(px + 1, py, '#fff'); gfx.px(px, py + 1, '#ffd84a');
      }
    },
    note: (x, y, t, s) => {
      const k = (t * 0.8) % 1;
      const c = 'rgba(255,255,255,' + (1 - k).toFixed(2) + ')';
      const yy = y - k * 12 * s;
      gfx.ellipse(x, yy, 1.6 * s, 1.2 * s, c);
      gfx.rect(x + 1, yy - 5 * s, 1, 5 * s, c);
      gfx.rect(x + 1, yy - 5 * s, 3, 1, c);
    },
    zzz: (x, y, t, s) => {
      for (let i = 0; i < 2; i++) {
        const k = (t * 0.6 + i * 0.5) % 1;
        const a = (1 - k).toFixed(2);
        gfx.text(i ? 'z' : 'Z', x + k * 6 * s, y - k * 12 * s, 'rgba(240,240,255,' + a + ')');
      }
    },
    stink: (x, y, t, s) => {
      for (let i = 0; i < 3; i++) {
        const k = (t * 0.7 + i * 0.33) % 1;
        const a = ((1 - k) * 0.55).toFixed(2);
        gfx.ellipseOutline(x + Math.sin(k * 6 + i) * 3 * s, y - k * 12 * s, 2.5 * s, 1.8 * s, 'rgba(150,200,120,' + a + ')');
      }
    },
  };
  art.fx = FX;
  art.effect = function (name, x, y, t, s = 1) { const f = FX[name]; if (f) f(x, y, t, s); };

  // ---- comic speech bubble ----------------------------------------------------
  // Drawn in screen space, tail pointing down at (tailX, tailY).
  art.bubble = function (x, y, w, h, tailX, tailY, opts = {}) {
    const fill = opts.fill || '#fbf6ea';
    const ink = opts.ink || art.INK;
    const r = opts.radius !== undefined ? opts.radius : 5;
    const kind = opts.kind || 'say';
    if (kind === 'think') {
      gfx.rrect(x - 1, y - 1, w + 2, h + 2, r + 1, ink);
      gfx.rrect(x, y, w, h, r, fill);
      let cx = tailX, cy = y + h;
      for (let i = 0; i < 3; i++) {
        const rr = 3 - i;
        cy += rr + 2;
        gfx.circle(cx, cy, rr + 1, ink); gfx.circle(cx, cy, rr, fill);
        cx += (tailX < x + w / 2 ? -2 : 2);
      }
      return;
    }
    // spiky shout bubble
    if (kind === 'shout') {
      const spikes = Math.max(10, Math.round((w + h) / 6));
      const cx = x + w / 2, cy = y + h / 2;
      for (let pass = 0; pass < 2; pass++) {
        const col = pass === 0 ? ink : fill;
        const grow = pass === 0 ? 1.5 : 0;
        for (let i = 0; i < spikes; i++) {
          const a0 = (i / spikes) * Math.PI * 2, a1 = ((i + 1) / spikes) * Math.PI * 2, am = (a0 + a1) / 2;
          const rx = w / 2 + grow, ry = h / 2 + grow;
          const sp = 1 + (i % 2 ? 0.3 : 0.1);
          gfx.tri(
            cx + Math.cos(a0) * rx, cy + Math.sin(a0) * ry,
            cx + Math.cos(a1) * rx, cy + Math.sin(a1) * ry,
            cx + Math.cos(am) * rx * sp, cy + Math.sin(am) * ry * sp, col);
        }
        gfx.ellipse(cx, cy, rx0(w, grow), rx0(h, grow), col);
      }
      return;
    }
    gfx.rrect(x - 1, y - 1, w + 2, h + 2, r + 1, ink);
    gfx.rrect(x, y, w, h, r, fill);
    // tail: a triangle from the bubble's bottom edge to the speaker
    const bx = CH.clamp(tailX, x + 5, x + w - 9);
    const by = y + h;
    gfx.tri(bx - 1, by - 2, bx + 6, by - 2, tailX, tailY + 1, ink);
    gfx.tri(bx, by - 3, bx + 4, by - 3, tailX, tailY - 1, fill);
  };
  function rx0(v, g) { return v / 2 + g; }

  // ---- shared shapes ----------------------------------------------------------
  // Soft contact shadow under an actor.
  art.shadow = function (x, y, rx, alpha = 0.3) {
    const ctx = gfx.cur;
    ctx.save(); ctx.globalAlpha = alpha;
    gfx.ellipse(x, y, rx, Math.max(1.5, rx * 0.3), '#120c18');
    ctx.restore();
  };

  // Rounded blob body: base fill, lower shadow, top highlight, rim light.
  art.blob = function (cx, cy, rx, ry, m, opts = {}) {
    gfx.ellipse(cx, cy, rx, ry, m.d);
    gfx.ellipse(cx, cy - ry * 0.12, rx * 0.97, ry * 0.9, m.base);
    if (opts.hi !== false) gfx.ellipse(cx - rx * 0.25, cy - ry * 0.45, rx * 0.45, ry * 0.3, m.l);
    if (opts.rim) {
      for (let i = -2; i <= 2; i++) gfx.px(cx + rx * 0.82 + i * 0.2, cy - ry * 0.3 + i, m.rim);
    }
  };
})(window.CH);
