// ============================================================================
// Pixel graphics: canvas setup, primitives, sprites from strings, text
// ============================================================================
(function (CH) {
  const canvas = document.getElementById('game');
  const g = canvas.getContext('2d', { alpha: false });
  g.imageSmoothingEnabled = false;
  CH.canvas = canvas;
  CH.g = g;
  CH.scale = 1;

  function resize() {
    const ww = window.innerWidth, wh = window.innerHeight;
    const fit = Math.min(ww / CH.W, wh / CH.H);
    // Crisp integer pixels whenever the window is big enough for 2x or more;
    // below that, fill the window rather than stranding a tiny 1x image in it.
    let k = fit >= 2 ? Math.floor(fit) : fit;
    CH.scale = k;
    canvas.style.width = Math.floor(CH.W * k) + 'px';
    canvas.style.height = Math.floor(CH.H * k) + 'px';
  }
  window.addEventListener('resize', resize);
  resize();

  const gfx = (CH.gfx = {});
  gfx.cur = g; // current target context (switch with gfx.target / pushTarget)
  gfx._targets = [];
  gfx.target = (ctx) => { gfx.cur = ctx || g; };
  gfx.pushTarget = (ctx) => { gfx._targets.push(gfx.cur); gfx.cur = ctx || g; };
  gfx.popTarget = () => { gfx.cur = gfx._targets.length ? gfx._targets.pop() : g; };

  gfx.makeCanvas = (w, h) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;
    return c;
  };

  // ---- primitives on any ctx (default main) ---------------------------------
  gfx.rect = (x, y, w, h, c, ctx = gfx.cur) => { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); };
  gfx.px = (x, y, c, ctx = gfx.cur) => { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, 1, 1); };
  gfx.hline = (x, y, w, c, ctx = gfx.cur) => gfx.rect(x, y, w, 1, c, ctx);
  gfx.vline = (x, y, h, c, ctx = gfx.cur) => gfx.rect(x, y, 1, h, c, ctx);
  gfx.frame = (x, y, w, h, c, ctx = gfx.cur) => {
    gfx.hline(x, y, w, c, ctx); gfx.hline(x, y + h - 1, w, c, ctx);
    gfx.vline(x, y, h, c, ctx); gfx.vline(x + w - 1, y, h, c, ctx);
  };
  gfx.line = (x0, y0, x1, y1, c, ctx = gfx.cur) => {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    ctx.fillStyle = c;
    for (let i = 0; i < 4000; i++) {
      ctx.fillRect(x0, y0, 1, 1);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  };
  // filled pixel ellipse (rx, ry can be fractional)
  gfx.ellipse = (cx, cy, rx, ry, c, ctx = gfx.cur) => {
    ctx.fillStyle = c;
    cx = Math.round(cx); cy = Math.round(cy);
    if (rx < 0.5 || ry < 0.5) return;
    const iry = Math.max(0, Math.round(ry - 0.5));
    for (let y = -iry; y <= iry; y++) {
      const f = 1 - (y * y) / (ry * ry);
      if (f <= 0) continue;
      const hw = Math.max(0, Math.round(rx * Math.sqrt(f) - 0.5));
      ctx.fillRect(cx - hw, cy + y, hw * 2 + 1, 1);
    }
  };
  gfx.circle = (cx, cy, r, c, ctx = gfx.cur) => gfx.ellipse(cx, cy, r, r, c, ctx);
  gfx.ellipseOutline = (cx, cy, rx, ry, c, ctx = gfx.cur) => {
    ctx.fillStyle = c;
    cx = Math.round(cx); cy = Math.round(cy);
    const n = Math.max(12, Math.floor((rx + ry) * 2));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      ctx.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1);
    }
  };
  // rounded rectangle (pixel)
  gfx.rrect = (x, y, w, h, r, c, ctx = gfx.cur) => {
    x |= 0; y |= 0; w |= 0; h |= 0; r = Math.min(r | 0, (w / 2) | 0, (h / 2) | 0);
    ctx.fillStyle = c;
    ctx.fillRect(x + r, y, w - 2 * r, h);
    for (let i = 0; i < r; i++) {
      // corner rows shrink
      const inset = r - Math.round(Math.sqrt(r * r - (r - i - 0.5) * (r - i - 0.5)));
      ctx.fillRect(x + inset, y + i, w - 2 * inset, 1);
      ctx.fillRect(x + inset, y + h - 1 - i, w - 2 * inset, 1);
    }
    ctx.fillRect(x, y + r, r, h - 2 * r);
    ctx.fillRect(x + w - r, y + r, r, h - 2 * r);
  };
  // checker dither fill
  gfx.dither = (x, y, w, h, c, ctx = g, phase = 0) => {
    ctx.fillStyle = c;
    for (let j = 0; j < h; j++) for (let i = (j + phase) & 1; i < w; i += 2) ctx.fillRect(x + i, y + j, 1, 1);
  };
  // vertical gradient in bands
  gfx.vgrad = (x, y, w, h, colors, ctx = gfx.cur) => {
    const n = colors.length;
    for (let i = 0; i < n; i++) {
      const y0 = y + Math.floor((h * i) / n), y1 = y + Math.floor((h * (i + 1)) / n);
      gfx.rect(x, y0, w, y1 - y0, colors[i], ctx);
    }
  };
  gfx.tri = (x0, y0, x1, y1, x2, y2, c, ctx = gfx.cur) => {
    // scanline fill
    const pts = [[x0, y0], [x1, y1], [x2, y2]].sort((a, b) => a[1] - b[1]);
    const [ax, ay] = pts[0], [bx, by] = pts[1], [cx, cy] = pts[2];
    ctx.fillStyle = c;
    for (let y = Math.round(ay); y <= Math.round(cy); y++) {
      let xa, xb;
      if (cy === ay) { xa = Math.min(ax, bx, cx); xb = Math.max(ax, bx, cx); }
      else {
        xa = ax + ((cx - ax) * (y - ay)) / (cy - ay);
        if (y < by) xb = by === ay ? bx : ax + ((bx - ax) * (y - ay)) / (by - ay);
        else xb = cy === by ? cx : bx + ((cx - bx) * (y - by)) / (cy - by);
      }
      const l = Math.round(Math.min(xa, xb)), r = Math.round(Math.max(xa, xb));
      ctx.fillRect(l, y, r - l + 1, 1);
    }
  };

  // ---- color helpers ---------------------------------------------------------
  gfx.hex2rgb = (h) => {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  gfx.rgb2hex = (r, g2, b) => '#' + [r, g2, b].map((v) => CH.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  gfx.shade = (hex, amt) => { const [r, g2, b] = gfx.hex2rgb(hex); return gfx.rgb2hex(r + amt, g2 + amt, b + amt); };
  gfx.mix = (a, b, t) => {
    const A = gfx.hex2rgb(a), B = gfx.hex2rgb(b);
    return gfx.rgb2hex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
  };
  gfx.alpha = (hex, a) => { const [r, g2, b] = gfx.hex2rgb(hex); return `rgba(${r},${g2},${b},${a})`; };

  // ---- sprites from strings --------------------------------------------------
  // rows: array of strings; pal: {char: color}; '.' or ' ' transparent
  const spriteCache = new Map();
  gfx.sprite = (key, rows, pal) => {
    if (key && spriteCache.has(key)) return spriteCache.get(key);
    const h = rows.length, w = Math.max(...rows.map((r) => r.length));
    const c = gfx.makeCanvas(w, h);
    const cx = c.getContext('2d');
    for (let y = 0; y < h; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ') continue;
        const col = pal[ch];
        if (!col) continue;
        cx.fillStyle = col; cx.fillRect(x, y, 1, 1);
      }
    }
    if (key) spriteCache.set(key, c);
    return c;
  };
  gfx.flipped = (img) => {
    const key = img.__flipKey;
    if (key && spriteCache.has(key)) return spriteCache.get(key);
    const c = gfx.makeCanvas(img.width, img.height);
    const cx = c.getContext('2d');
    cx.translate(img.width, 0); cx.scale(-1, 1); cx.drawImage(img, 0, 0);
    img.__flipKey = img.__flipKey || 'flip_' + Math.random();
    spriteCache.set(img.__flipKey, c);
    return c;
  };
  gfx.draw = (img, x, y, flip = false, ctx = gfx.cur) => {
    if (flip) img = gfx.flipped(img);
    ctx.drawImage(img, Math.round(x), Math.round(y));
  };
  gfx.drawScaled = (img, x, y, sx, sy, flip = false, ctx = gfx.cur) => {
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(flip ? -sx : sx, sy);
    ctx.drawImage(img, flip ? -img.width : 0, 0);
    ctx.restore();
  };
  // tint a sprite (returns new canvas) - used for silhouettes / flashes
  gfx.tinted = (img, color) => {
    const c = gfx.makeCanvas(img.width, img.height);
    const cx = c.getContext('2d');
    cx.drawImage(img, 0, 0);
    cx.globalCompositeOperation = 'source-in';
    cx.fillStyle = color; cx.fillRect(0, 0, c.width, c.height);
    return c;
  };
  // cache arbitrary drawn image by key, drawn via callback(ctx, w, h)
  gfx.cached = (key, w, h, fn) => {
    if (spriteCache.has(key)) return spriteCache.get(key);
    const c = gfx.makeCanvas(w, h);
    fn(c.getContext('2d'), w, h);
    spriteCache.set(key, c);
    return c;
  };
  gfx.uncache = (key) => spriteCache.delete(key);

  // ---- text -------------------------------------------------------------------
  const glyphCache = new Map();
  function glyph(font, ch, color) {
    const f = CH.FONTS[font];
    if (f.upper) ch = ch.toUpperCase();
    let rows = f.glyphs[ch];
    if (!rows) rows = f.glyphs[f.fallback];
    const key = font + '|' + ch + '|' + color;
    let img = glyphCache.get(key);
    if (!img) {
      const w = Math.max(...rows.map((r) => r.length));
      const h = rows.length;
      img = gfx.makeCanvas(w, Math.max(h, f.height));
      const cx = img.getContext('2d');
      cx.fillStyle = color;
      for (let y = 0; y < h; y++) for (let x = 0; x < rows[y].length; x++) if (rows[y][x] === '#') cx.fillRect(x, y, 1, 1);
      glyphCache.set(key, img);
    }
    return img;
  }
  gfx.textWidth = (str, font = 'main') => {
    const f = CH.FONTS[font];
    let w = 0;
    for (const ch of String(str)) {
      let c = f.upper ? ch.toUpperCase() : ch;
      const rows = f.glyphs[c] || f.glyphs[f.fallback];
      w += Math.max(...rows.map((r) => r.length)) + f.space;
    }
    return Math.max(0, w - f.space);
  };
  // trim a string to fit maxW, ending in an ellipsis when it had to be cut
  gfx.ellipsize = (str, maxW, font = 'main') => {
    str = String(str);
    if (maxW <= 0) return '';
    if (gfx.textWidth(str, font) <= maxW) return str;
    let out = str;
    while (out.length && gfx.textWidth(out + '\u2026', font) > maxW) out = out.slice(0, -1);
    return out ? out + '\u2026' : '';
  };
  // opts: {font, align:'left'|'center'|'right', shadow:color, outline:color, ctx}
  gfx.text = (str, x, y, color = '#fff', opts = {}) => {
    const font = opts.font || 'main';
    const f = CH.FONTS[font];
    const ctx = opts.ctx || gfx.cur;
    str = String(str);
    const w = gfx.textWidth(str, font);
    x = Math.round(x); y = Math.round(y);
    if (opts.align === 'center') x -= Math.floor(w / 2);
    else if (opts.align === 'right') x -= w;
    const drawRun = (dx, dy, col) => {
      let cx = x + dx;
      for (const ch of str) {
        const im = glyph(font, ch, col);
        ctx.drawImage(im, cx, y + dy);
        cx += im.width + f.space;
      }
    };
    if (opts.outline) {
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) drawRun(dx, dy, opts.outline);
    }
    if (opts.shadow) drawRun(1, 1, opts.shadow);
    drawRun(0, 0, color);
    return w;
  };
  // wrapped text; returns number of lines drawn
  gfx.textBlock = (str, x, y, maxW, color, opts = {}) => {
    const font = opts.font || 'main';
    const f = CH.FONTS[font];
    const lines = gfx.wrap(str, maxW, font);
    const lh = opts.lineHeight || f.lineHeight;
    lines.forEach((ln, i) => gfx.text(ln, x, y + i * lh, color, opts));
    return lines.length;
  };
  gfx.wrap = (str, maxW, font = 'main') => {
    const out = [];
    for (const para of String(str).split('\n')) {
      const words = para.split(' ');
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (gfx.textWidth(test, font) > maxW && line) { out.push(line); line = w; }
        else line = test;
      }
      out.push(line);
    }
    return out;
  };

  // ---- clip helpers ------------------------------------------------------------
  gfx.clip = (x, y, w, h, ctx = gfx.cur) => { ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); };
  gfx.unclip = (ctx = gfx.cur) => ctx.restore();

  // ---- common palette -----------------------------------------------------------
  CH.PAL = {
    black: '#0d0b12', white: '#f4f1ea', ink: '#1e1a24',
    wood1: '#8b5a2b', wood2: '#a86f3a', wood3: '#c48a4a', wood0: '#5e3a1b', woodDark: '#3f2612',
    floor1: '#6e4523', floor2: '#7e5230', floor3: '#8f6038',
    cream: '#efe1c0', amber: '#f2b544', orange: '#e8752c', red: '#d13c3c', darkred: '#7f1d1d',
    teal: '#2f8f7a', tealD: '#1f6656', tealL: '#57b89f',
    blue: '#3b6fd6', blueD: '#24478f', blueL: '#6fa2ff', sky: '#87ceeb', night: '#1a2140',
    green: '#4f9d3a', greenD: '#2f6a24', greenL: '#8bd06a', grass: '#5da83e',
    gray1: '#3a3a44', gray2: '#5c5c68', gray3: '#8c8c98', gray4: '#bcbcc8', gray5: '#dcdce4',
    fur: '#8a5a3b', furL: '#b58356', furD: '#5a3721', quill: '#ead9b0', quillT: '#3a2a1c',
    pink: '#f0a0b0', yellow: '#f7d94c', purple: '#7b4fb0',
    skin: '#f2c9a0', hospital: '#d8e6e6', hospitalD: '#9db4b8',
  };
})(window.CH);
