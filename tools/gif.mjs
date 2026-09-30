// A small, dependency-free GIF89a encoder: global palette, LZW, looping.
// encodeGif(frames, w, h, { delay }) where each frame is RGBA bytes (Uint8Array).
export function encodeGif(frames, w, h, opts = {}) {
  const delay = opts.delay || 8;   // hundredths of a second
  // ---- palette: exact if it fits, otherwise the 256 busiest 15-bit buckets
  const counts = new Map();
  for (const f of frames) for (let i = 0; i < f.length; i += 4) {
    const k = (f[i] << 16) | (f[i + 1] << 8) | f[i + 2];
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  let palette;
  if (counts.size <= 256) palette = [...counts.keys()];
  else {
    const buckets = new Map();
    for (const [k, n] of counts) {
      const r = k >> 16, g = (k >> 8) & 255, b = k & 255, bk = ((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3);
      const e = buckets.get(bk) || { n: 0, r: 0, g: 0, b: 0 };
      e.n += n; e.r += r * n; e.g += g * n; e.b += b * n; buckets.set(bk, e);
    }
    palette = [...buckets.values()].sort((a, b) => b.n - a.n).slice(0, 256).map((e) => ((Math.round(e.r / e.n) << 16) | (Math.round(e.g / e.n) << 8) | Math.round(e.b / e.n)));
  }
  while (palette.length < 256) palette.push(0);
  const lookup = new Map();
  const nearest = (k) => {
    let c = lookup.get(k);
    if (c !== undefined) return c;
    const r = k >> 16, g = (k >> 8) & 255, b = k & 255;
    let best = 0, bd = Infinity;
    for (let i = 0; i < 256; i++) { const p = palette[i]; const dr = r - (p >> 16), dg = g - ((p >> 8) & 255), db = b - (p & 255); const d = dr * dr * 3 + dg * dg * 4 + db * db * 2; if (d < bd) { bd = d; best = i; } }
    lookup.set(k, best); return best;
  };
  const out = [];
  const b8 = (v) => out.push(v & 255);
  const b16 = (v) => { out.push(v & 255, (v >> 8) & 255); };
  const str = (s) => { for (const ch of s) out.push(ch.charCodeAt(0)); };
  str('GIF89a'); b16(w); b16(h); b8(0xf7); b8(0); b8(0);
  for (const p of palette) out.push(p >> 16, (p >> 8) & 255, p & 255);
  out.push(0x21, 0xff, 0x0b); str('NETSCAPE2.0'); out.push(0x03, 0x01, 0x00, 0x00, 0x00);
  for (const f of frames) {
    out.push(0x21, 0xf9, 0x04, 0x04); b16(delay); out.push(0x00, 0x00);
    out.push(0x2c); b16(0); b16(0); b16(w); b16(h); b8(0);
    const idx = new Uint8Array(w * h);
    for (let i = 0, j = 0; i < f.length; i += 4, j++) idx[j] = nearest((f[i] << 16) | (f[i + 1] << 8) | f[i + 2]);
    const data = lzw(idx, 8);
    b8(8);
    for (let i = 0; i < data.length; i += 255) { const n = Math.min(255, data.length - i); b8(n); for (let k = 0; k < n; k++) out.push(data[i + k]); }
    b8(0);
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
