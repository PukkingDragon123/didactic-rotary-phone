// A small, dependency-free GIF89a encoder: global palette, LZW, looping.
// encodeGif(frames, w, h, { delay }) where each frame is RGBA bytes (Uint8Array).
// After the first frame, each frame stores only the pixels that changed since
// the one before, cropped to their bounding box, with everything else left
// transparent - so a still background is paid for once, not once per frame.
export function encodeGif(frames, w, h, opts = {}) {
  const delay = opts.delay || 8;   // hundredths of a second
  const TI = 255;                  // palette slot kept free for "unchanged"
  // ---- palette: exact if it fits in 255, otherwise the 255 busiest 15-bit buckets
  const counts = new Map();
  for (const f of frames) for (let i = 0; i < f.length; i += 4) {
    const k = (f[i] << 16) | (f[i + 1] << 8) | f[i + 2];
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  let palette;
  if (counts.size <= TI) palette = [...counts.keys()];
  else {
    const buckets = new Map();
    for (const [k, n] of counts) {
      const r = k >> 16, g = (k >> 8) & 255, b = k & 255, bk = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      const e = buckets.get(bk) || { n: 0, r: 0, g: 0, b: 0 };
      e.n += n; e.r += r * n; e.g += g * n; e.b += b * n; buckets.set(bk, e);
    }
    palette = [...buckets.values()].sort((a, b) => b.n - a.n).slice(0, TI).map((e) => ((Math.round(e.r / e.n) << 16) | (Math.round(e.g / e.n) << 8) | Math.round(e.b / e.n)));
  }
  const used = palette.length;
  while (palette.length < 256) palette.push(0);
  const lookup = new Map();
  const nearest = (k) => {
    let c = lookup.get(k);
    if (c !== undefined) return c;
    const r = k >> 16, g = (k >> 8) & 255, b = k & 255;
    let best = 0, bd = Infinity;
    for (let i = 0; i < used; i++) { const p = palette[i]; const dr = r - (p >> 16), dg = g - ((p >> 8) & 255), db = b - (p & 255); const d = dr * dr * 3 + dg * dg * 4 + db * db * 2; if (d < bd) { bd = d; best = i; } }
    lookup.set(k, best); return best;
  };
  const out = [];
  const b8 = (v) => out.push(v & 255);
  const b16 = (v) => { out.push(v & 255, (v >> 8) & 255); };
  const str = (s) => { for (const ch of s) out.push(ch.charCodeAt(0)); };
  str('GIF89a'); b16(w); b16(h); b8(0xf7); b8(0); b8(0);
  for (const p of palette) out.push(p >> 16, (p >> 8) & 255, p & 255);
  out.push(0x21, 0xff, 0x0b); str('NETSCAPE2.0'); out.push(0x03, 0x01, 0x00, 0x00, 0x00);
  let prev = null;
  for (const f of frames) {
    const idx = new Uint8Array(w * h);
    for (let i = 0, j = 0; i < f.length; i += 4, j++) idx[j] = nearest((f[i] << 16) | (f[i + 1] << 8) | f[i + 2]);
    let x0 = 0, y0 = 0, x1 = w - 1, y1 = h - 1, sub = idx;
    if (prev) {
      // bounding box of what changed
      x0 = w; y0 = h; x1 = -1; y1 = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const j = y * w + x;
        if (idx[j] !== prev[j]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      }
      if (x1 < 0) { x0 = y0 = x1 = y1 = 0; }               // nothing moved: one clear pixel
      const sw = x1 - x0 + 1, sh = y1 - y0 + 1;
      sub = new Uint8Array(sw * sh);
      for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
        const j = (y + y0) * w + (x + x0);
        sub[y * sw + x] = idx[j] === prev[j] ? TI : idx[j];
      }
    }
    // graphic control: leave the last frame in place; later frames see through TI
    out.push(0x21, 0xf9, 0x04, prev ? 0x05 : 0x04); b16(delay); out.push(prev ? TI : 0x00, 0x00);
    out.push(0x2c); b16(x0); b16(y0); b16(x1 - x0 + 1); b16(y1 - y0 + 1); b8(0);
    const data = lzw(sub, 8);
    b8(8);
    for (let i = 0; i < data.length; i += 255) { const n = Math.min(255, data.length - i); b8(n); for (let k = 0; k < n; k++) out.push(data[i + k]); }
    b8(0);
    prev = idx;
  }
  b8(0x3b);
  return Buffer.from(out);
}

function lzw(ix, min) {
  const clear = 1 << min, eoi = clear + 1;
  let size = min + 1, next = eoi + 1;
  let dict = new Map();
  const out = []; let cur = 0, bits = 0;
  const emit = (c) => { cur |= c << bits; bits += size; while (bits >= 8) { out.push(cur & 255); cur >>>= 8; bits -= 8; } };
  emit(clear);
  let prefix = ix[0];
  for (let i = 1; i < ix.length; i++) {
    const k = ix[i], key = prefix * 256 + k, c = dict.get(key);
    if (c !== undefined) { prefix = c; continue; }
    emit(prefix);
    if (next === 4096) { emit(clear); dict = new Map(); size = min + 1; next = eoi + 1; }
    else { if (next >= (1 << size)) size++; dict.set(key, next++); }
    prefix = k;
  }
  emit(prefix); emit(eoi);
  if (bits > 0) out.push(cur & 255);
  return out;
}
