// ============================================================================
// ICE FISHING - a 3D minigame out on the frozen lake with Old Bartleby.
// A tiny software renderer draws the scene at 240x135 so every 3D pixel is a
// chunky block, with procedural textures (cracked ice, wood grain, snow glitter),
// dithered lighting, fog, a warm lantern, and 3D snowfall. The fishing hole is a
// real height-field water simulation: the lure, nibbling fish, landing snow and
// the big splash of a catch all push waves around it.
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, A = CH.audio, inp = CH.input, S = CH.state, art = CH.art;
  const W = CH.W, H = CH.H;
  const RW = 240, RH = 135;               // 3D buffer: one 3D pixel = two game pixels

  // ---- tiny maths -------------------------------------------------------------------
  const v3 = (x, y, z) => [x, y, z];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const mix = (a, b, k) => a + (b - a) * k;
  const fract = (x) => x - Math.floor(x);
  const hash2 = (x, y) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
    return mix(mix(a, b, u), mix(c, d, u), v);
  }
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  // ---- the renderer --------------------------------------------------------------------
  class R3 {
    constructor() {
      this.cv = gfx.makeCanvas(RW, RH);
      this.cx = this.cv.getContext('2d');
      this.img = this.cx.createImageData(RW, RH);
      this.px = new Uint32Array(this.img.data.buffer);
      this.z = new Float32Array(RW * RH);
      this.f = (RH / 2) / Math.tan((56 * Math.PI / 180) / 2);
      this.sun = norm([-0.55, 0.6, -0.4]);
      this.lamp = [1.9, 1.35, -0.6];
      this.lampOn = 1;
      this.fog = [168, 186, 214];
      this.waterY = -0.32;
    }
    setCamera(eye, at) {
      this.eye = eye;
      const f = norm(sub(at, eye));
      const r = norm(cross(f, [0, 1, 0]));
      const u = cross(r, f);
      this.cf = f; this.cr = r; this.cu = u;
    }
    toView(p) { const d = sub(p, this.eye); return [dot(d, this.cr), dot(d, this.cu), dot(d, this.cf)]; }
    clear(skyTop, skyBot) {
      this.z.fill(0);
      for (let y = 0; y < RH; y++) {
        const k = y / RH, r = mix(skyTop[0], skyBot[0], k) | 0, g = mix(skyTop[1], skyBot[1], k) | 0, b = mix(skyTop[2], skyBot[2], k) | 0;
        const c = (255 << 24) | (b << 16) | (g << 8) | r;
        this.px.fill(c, y * RW, y * RW + RW);
      }
    }
    // light a surface point: sun, sky fill, the lantern, and fog by distance
    light(col, wx, wy, wz, n, emissive) {
      let r = col[0], g = col[1], b = col[2];
      if (!emissive) {
        const lam = Math.max(0, dot(n, this.sun));
        const sky = 0.34 + 0.16 * n[1];
        const lx = this.lamp[0] - wx, ly = this.lamp[1] - wy, lz = this.lamp[2] - wz;
        const ld = Math.hypot(lx, ly, lz) || 1;
        const ll = this.lampOn * Math.max(0, (n[0] * lx + n[1] * ly + n[2] * lz) / ld) * 0.9 / (1 + ld * ld * 1.6);
        const k = sky + lam * 0.5;
        r = r * k + ll * 150; g = g * k + ll * 105; b = b * (k * 1.04) + ll * 50;
      }
      // under the waterline everything sinks into teal
      if (wy < this.waterY) {
        const u = clamp01((this.waterY - wy) / 6);
        const kk = 0.18 + u * 0.55;
        r = mix(r, 10, kk); g = mix(g, 52, kk); b = mix(b, 66, kk);
      } else {
        const d = Math.hypot(wx - this.eye[0], wy - this.eye[1], wz - this.eye[2]);
        const fk = 1 - Math.exp(-d * 0.021);
        r = mix(r, this.fog[0], fk); g = mix(g, this.fog[1], fk); b = mix(b, this.fog[2], fk);
      }
      return [r, g, b];
    }
    // dithered write: the ordered dither is what makes it read as pixel art
    put(i, x, y, r, g, b) {
      const d = (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * 14;
      r = Math.max(0, Math.min(255, Math.round((r + d) / 14) * 14));
      g = Math.max(0, Math.min(255, Math.round((g + d) / 14) * 14));
      b = Math.max(0, Math.min(255, Math.round((b + d) / 14) * 14));
      this.px[i] = (255 << 24) | (b << 16) | (g << 8) | r;
    }
    blend(i, x, y, r, g, b, a) {
      const c = this.px[i];
      const r0 = c & 255, g0 = (c >> 8) & 255, b0 = (c >> 16) & 255;
      this.put(i, x, y, mix(r0, r, a), mix(g0, g, a), mix(b0, b, a));
    }
    // one triangle, world space in, near-plane clipped, perspective-correct
    tri(a, b, c, mat, opts) {
      const va = this.toView(a), vb = this.toView(b), vc = this.toView(c);
      let n = opts && opts.n ? opts.n : norm(cross(sub(b, a), sub(c, a)));
      // everything is two-sided: light the face the camera is actually looking at
      if (!(opts && opts.n) && dot(n, sub(this.eye, a)) < 0) n = [-n[0], -n[1], -n[2]];
      const NEAR = 0.08;
      let poly = [[va, a], [vb, b], [vc, c]];
      if (va[2] < NEAR || vb[2] < NEAR || vc[2] < NEAR) {
        const outp = [];
        for (let i = 0; i < 3; i++) {
          const P = poly[i], Q = poly[(i + 1) % 3];
          const pin = P[0][2] >= NEAR, qin = Q[0][2] >= NEAR;
          if (pin) outp.push(P);
          if (pin !== qin) {
            const t = (NEAR - P[0][2]) / (Q[0][2] - P[0][2]);
            outp.push([[mix(P[0][0], Q[0][0], t), mix(P[0][1], Q[0][1], t), NEAR], [mix(P[1][0], Q[1][0], t), mix(P[1][1], Q[1][1], t), mix(P[1][2], Q[1][2], t)]]);
          }
        }
        if (outp.length < 3) return;
        poly = outp;
      }
      const pr = poly.map(([v, w]) => { const iw = 1 / v[2]; return { x: RW / 2 + v[0] * this.f * iw, y: RH / 2 - v[1] * this.f * iw, iw, ax: w[0] * iw, ay: w[1] * iw, az: w[2] * iw }; });
      for (let i = 1; i + 1 < pr.length; i++) this.raster(pr[0], pr[i], pr[i + 1], mat, n, opts);
    }
    raster(p0, p1, p2, mat, n, opts) {
      const area = (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
      if (Math.abs(area) < 1e-6) return;
      if (opts && opts.cull && area > 0) return;
      const minX = Math.max(0, Math.floor(Math.min(p0.x, p1.x, p2.x))), maxX = Math.min(RW - 1, Math.ceil(Math.max(p0.x, p1.x, p2.x)));
      const minY = Math.max(0, Math.floor(Math.min(p0.y, p1.y, p2.y))), maxY = Math.min(RH - 1, Math.ceil(Math.max(p0.y, p1.y, p2.y)));
      if (minX > maxX || minY > maxY) return;
      const inv = 1 / area, blendMode = opts && opts.blend;
      for (let y = minY; y <= maxY; y++) {
        const py = y + 0.5;
        for (let x = minX; x <= maxX; x++) {
          const px = x + 0.5;
          const w0 = ((p2.x - p1.x) * (py - p1.y) - (p2.y - p1.y) * (px - p1.x)) * inv;
          const w1 = ((p0.x - p2.x) * (py - p2.y) - (p0.y - p2.y) * (px - p2.x)) * inv;
          const w2 = 1 - w0 - w1;
          if (w0 < 0 || w1 < 0 || w2 < 0) continue;
          const iw = w0 * p0.iw + w1 * p1.iw + w2 * p2.iw;
          const i = y * RW + x;
          if (iw <= this.z[i]) continue;
          const wx = (w0 * p0.ax + w1 * p1.ax + w2 * p2.ax) / iw;
          const wy = (w0 * p0.ay + w1 * p1.ay + w2 * p2.ay) / iw;
          const wz = (w0 * p0.az + w1 * p1.az + w2 * p2.az) / iw;
          const c = mat(wx, wy, wz, n, x, y);
          if (!c) continue;
          if (blendMode) { this.blend(i, x, y, c[0], c[1], c[2], c[3]); if (c[4]) this.z[i] = iw; }
          else { this.z[i] = iw; this.put(i, x, y, c[0], c[1], c[2]); }
        }
      }
    }
    quad(a, b, c, d, mat, opts) { this.tri(a, b, c, mat, opts); this.tri(a, c, d, mat, opts); }
    project(p) { const v = this.toView(p); if (v[2] < 0.08) return null; const iw = 1 / v[2]; return { x: RW / 2 + v[0] * this.f * iw, y: RH / 2 - v[1] * this.f * iw, iw }; }
    blit(g) { this.cx.putImageData(this.img, 0, 0); g.drawImage(this.cv, 0, 0, W, H); }
  }

  // ---- materials -------------------------------------------------------------------
  function flat(r3, col, opts = {}) {
    return (wx, wy, wz, n) => { const c = r3.light(col, wx, wy, wz, n, opts.emissive); return c; };
  }

  // ---- the water ------------------------------------------------------------------------
  // A height field on a grid over the hole. Waves obey the discrete wave
  // equation with damping; everything outside the hole's rim is a wall.
  class Water {
    constructor(R, N) {
      this.R = R; this.N = N; this.dx = (2 * R) / N;
      this.h = new Float32Array((N + 1) * (N + 1)); this.v = new Float32Array((N + 1) * (N + 1));
      this.mask = new Uint8Array((N + 1) * (N + 1));
      for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) { const x = -R + i * this.dx, z = -R + j * this.dx; this.mask[j * (N + 1) + i] = Math.hypot(x, z) < R - this.dx * 0.5 ? 1 : 0; }
    }
    at(i, j) { return this.h[j * (this.N + 1) + i]; }
    poke(x, z, amt, rad = 0.18) {
      const N = this.N, s = N + 1;
      const ci = Math.round((x + this.R) / this.dx), cj = Math.round((z + this.R) / this.dx), r = Math.ceil(rad / this.dx) + 1;
      for (let j = cj - r; j <= cj + r; j++) for (let i = ci - r; i <= ci + r; i++) {
        if (i < 0 || j < 0 || i > N || j > N) continue;
        const k = j * s + i; if (!this.mask[k]) continue;
        const d = Math.hypot((i - ci) * this.dx, (j - cj) * this.dx);
        this.v[k] += amt * Math.exp(-(d * d) / (rad * rad));
      }
    }
    step(dt) {
      const N = this.N, s = N + 1, c2 = (1.5 * 1.5) / (this.dx * this.dx), h = this.h, v = this.v, m = this.mask;
      const sub = 3, d = dt / sub;
      for (let n = 0; n < sub; n++) {
        for (let j = 1; j < N; j++) for (let i = 1; i < N; i++) {
          const k = j * s + i; if (!m[k]) continue;
          const lap = (m[k - 1] ? h[k - 1] : 0) + (m[k + 1] ? h[k + 1] : 0) + (m[k - s] ? h[k - s] : 0) + (m[k + s] ? h[k + s] : 0) - 4 * h[k];
          v[k] = (v[k] + lap * c2 * d) * (1 - 1.6 * d);
        }
        for (let k = 0; k < h.length; k++) if (m[k]) h[k] += v[k] * d;
      }
    }
  }

  // ---- fish --------------------------------------------------------------------------
  const SPECIES = [
    { name: 'Sulking Perch', col: [196, 170, 60], stripe: [70, 80, 40], len: 0.32, depth: [0.9, 2.4], pay: 2, fight: 0.8, w: 34, joke: "It looks disappointed in you specifically." },
    { name: 'Walleye', col: [150, 150, 90], stripe: [90, 90, 60], len: 0.42, depth: [1.8, 3.4], pay: 4, fight: 1.1, w: 24, joke: "Both eyes are looking at the wall. Classic walleye." },
    { name: 'Pike With Attitude', col: [110, 150, 90], stripe: [220, 220, 150], len: 0.62, depth: [2.4, 3.8], pay: 6, fight: 1.6, w: 14, joke: "It bit the line, the lure, and then your pride." },
    { name: 'Lake Whitefish', col: [200, 206, 214], stripe: [150, 160, 170], len: 0.38, depth: [1.2, 3.0], pay: 3, fight: 0.9, w: 20, joke: "Very plain. Very polite. Would make a good accountant." },
    { name: 'A Boot', col: [70, 50, 36], stripe: [40, 30, 20], len: 0.3, depth: [3.0, 3.9], pay: 0, fight: 0.4, w: 6, boot: true, joke: "Size eleven. Left foot. Somebody in town is having a strange winter." },
    { name: 'The Golden Pickle', col: [230, 200, 60], stripe: [255, 240, 150], len: 0.28, depth: [3.2, 3.9], pay: 25, fight: 2, w: 2, joke: "Nobody believes you. Brenda will never believe you." },
  ];
  function pickSpecies(rng) {
    const tot = SPECIES.reduce((a, s) => a + s.w, 0); let r = rng() * tot;
    for (const s of SPECIES) { r -= s.w; if (r <= 0) return s; }
    return SPECIES[0];
  }

  // ---- the scene ----------------------------------------------------------------------
  class FishingScene extends CH.Scene {
    constructor(opts = {}) {
      super();
      this.name = 'fishing';
      this.opts = opts;
      this.r3 = new R3();
      this.water = new Water(1.25, 40);
      this.lure = { depth: 0, vy: 0, x: 0, z: 0, jig: 0 };
      this.state = 'idle';        // idle | biting | hooked | landing
      this.fish = [];
      for (let i = 0; i < 7; i++) this.fish.push(this.newFish());
      this.flakes = [];
      for (let i = 0; i < 170; i++) this.flakes.push(this.newFlake(true));
      this.drops = [];
      this.catches = [];
      this.tension = 0;
      this.msg = ''; this.msgT = 0;
      this.card = null;
      this.lastMY = 0; this.jigT = 0;
      this.money = 0;
      this.mx = 0;
      this.buildStatic();
    }
    newFish() {
      const sp = pickSpecies(Math.random);
      const a = Math.random() * 6.28, r = 0.6 + Math.random() * 4;
      return { sp, x: Math.cos(a) * r, z: Math.sin(a) * r, y: -(sp.depth[0] + Math.random() * (sp.depth[1] - sp.depth[0])), head: Math.random() * 6.28, speed: 0.3 + Math.random() * 0.3, t: Math.random() * 9, mode: 'wander', interest: 0, nibbles: 0, cool: 0 };
    }
    newFlake(spread) {
      return { x: (Math.random() - 0.5) * 16, y: spread ? Math.random() * 7 - 0.5 : 6 + Math.random() * 2, z: (Math.random() - 0.5) * 14 - 1, vy: 0.5 + Math.random() * 0.5, ph: Math.random() * 6 };
    }
    // everything that never moves, as a triangle list with its materials
    buildStatic() {
      const r3 = this.r3, L = (this.tris = []);
      const T = (a, b, c, m, o) => L.push([a, b, c, m, o]);
      const Q = (a, b, c, d, m, o) => { T(a, b, c, m, o); T(a, c, d, m, o); };
      const R = this.water.R;
      // cracked, glittering ice with the hole cut out per pixel
      const ice = (wx, wy, wz, n, x, y) => {
        const d = Math.hypot(wx, wz);
        if (d < R) return null;
        let base = [196, 222, 236];
        const nz = vnoise(wx * 0.6, wz * 0.6) * 0.6 + vnoise(wx * 2.2, wz * 2.2) * 0.3;
        base = [base[0] - nz * 26, base[1] - nz * 16, base[2] - nz * 6];
        if (nz > 0.62) base = [236, 244, 250];                                        // drifted snow on the ice
        const cr = Math.abs(vnoise(wx * 0.9 + 11, wz * 0.9 - 3) * 2 - 1);
        if (cr < 0.014 && d > R + 0.4) base = [128, 168, 196];                         // hairline cracks
        if (d < R + 0.34) { const k = 1 - (d - R) / 0.34; base = [mix(base[0], 150, k * 0.6), mix(base[1], 190, k * 0.6), mix(base[2], 214, k * 0.5)]; }   // wet rim
        let c = r3.light(base, wx, wy, wz, n);
        if (hash2(Math.floor(wx * 22), Math.floor(wz * 22)) > 0.993) c = [255, 255, 255];  // glitter
        return c;
      };
      const S = 26, step = 3.25;
      for (let z = -S; z < S; z += step) for (let x = -S; x < S; x += step) Q([x, 0, z], [x + step, 0, z], [x + step, 0, z + step], [x, 0, z + step], ice, { n: [0, 1, 0] });
      // the hole's wall, down through the ice
      const wall = (wx, wy, wz, n) => { const k = clamp01(-wy / 1.2); return r3.light([mix(170, 60, k), mix(210, 120, k), mix(230, 150, k)], wx, wy, wz, n); };
      const seg = 28;
      for (let i = 0; i < seg; i++) {
        const a0 = (i / seg) * 6.283, a1 = ((i + 1) / seg) * 6.283;
        const p = (a, y) => [Math.cos(a) * R, y, Math.sin(a) * R];
        const nn = [-Math.cos((a0 + a1) / 2), 0, -Math.sin((a0 + a1) / 2)];
        Q(p(a0, 0), p(a1, 0), p(a1, -1.25), p(a0, -1.25), wall, { n: nn });
      }
      // the lake bed, far down in the teal
      const bed = (wx, wy, wz, n) => r3.light([60 + vnoise(wx, wz) * 40, 70 + vnoise(wx * 2, wz) * 30, 50], wx, wy, wz, n);
      Q([-14, -4.4, -14], [14, -4.4, -14], [14, -4.4, 14], [-14, -4.4, 14], bed, { n: [0, 1, 0] });
      for (let i = 0; i < 14; i++) { const x = (hash2(i, 3) - 0.5) * 10, z = (hash2(i, 7) - 0.5) * 10; T([x - 0.3, -4.4, z], [x + 0.3, -4.4, z], [x + Math.sin(i) * 0.3, -2.6 - hash2(i, 9) * 1.2, z], flat(r3, [40, 110, 70]), { n: [0, 0, 1] }); }   // weed
      // Bartleby's shack, lit from inside
      const wood = (wx, wy, wz, n) => {
        const pl = fract(wy * 3.1);
        let c = [118, 72, 40];
        if (pl < 0.12) c = [70, 40, 22];
        c = [c[0] + (vnoise(wx * 6 + wz * 6, wy * 0.6) - 0.5) * 30, c[1] + (vnoise(wx * 6, wy) - 0.5) * 16, c[2]];
        return r3.light(c, wx, wy, wz, n);
      };
      const snow = (wx, wy, wz, n) => { let c = r3.light([236, 244, 252], wx, wy, wz, n); if (hash2(Math.floor(wx * 30), Math.floor((wy + wz) * 30)) > 0.992) c = [255, 255, 255]; return c; };
      const bx = -4.2, bz = -5.2, bw = 2.2, bd = 1.8, bh = 1.7;
      const P = (x, y, z) => [bx + x, y, bz + z];
      Q(P(0, 0, bd), P(bw, 0, bd), P(bw, bh, bd), P(0, bh, bd), wood, { n: [0, 0, 1] });           // front
      Q(P(bw, 0, bd), P(bw, 0, 0), P(bw, bh, 0), P(bw, bh, bd), wood, { n: [1, 0, 0] });           // right side
      Q(P(0, bh, bd + 0.2), P(bw / 2, bh + 0.8, bd + 0.2), P(bw / 2, bh + 0.8, -0.2), P(0, bh, -0.2), snow, {});   // roof, left
      Q(P(bw / 2, bh + 0.8, bd + 0.2), P(bw + 0.15, bh, bd + 0.2), P(bw + 0.15, bh, -0.2), P(bw / 2, bh + 0.8, -0.2), snow, {});   // roof, right
      T(P(0, bh, bd + 0.01), P(bw, bh, bd + 0.01), P(bw / 2, bh + 0.8, bd + 0.01), wood, { n: [0, 0, 1] });
      const win = (wx, wy, wz) => [255, 214, 130];
      Q(P(0.35, 0.75, bd + 0.02), P(1.0, 0.75, bd + 0.02), P(1.0, 1.25, bd + 0.02), P(0.35, 1.25, bd + 0.02), win, { n: [0, 0, 1] });
      Q(P(1.3, 0, bd + 0.02), P(1.85, 0, bd + 0.02), P(1.85, 1.2, bd + 0.02), P(1.3, 1.2, bd + 0.02), flat(r3, [70, 44, 30]), { n: [0, 0, 1] });
      // pines round the shore
      const pine = (x, z, h) => {
        const g1 = flat(r3, [40, 96, 50]), g2 = flat(r3, [30, 76, 40]), sn = snow, tr = flat(r3, [80, 50, 30]);
        const k = 6;
        for (let i = 0; i < k; i++) {
          const a0 = (i / k) * 6.283, a1 = ((i + 1) / k) * 6.283;
          for (let layer = 0; layer < 3; layer++) {
            const y0 = h * (0.2 + layer * 0.24), y1 = y0 + h * 0.42, rr = h * (0.36 - layer * 0.09);
            T([x + Math.cos(a0) * rr, y0, z + Math.sin(a0) * rr], [x + Math.cos(a1) * rr, y0, z + Math.sin(a1) * rr], [x, y1, z], i % 2 ? g1 : g2, {});
            T([x + Math.cos(a0) * rr * 0.4, y1 - h * 0.12, z + Math.sin(a0) * rr * 0.4], [x + Math.cos(a1) * rr * 0.4, y1 - h * 0.12, z + Math.sin(a1) * rr * 0.4], [x, y1, z], sn, {});
          }
          T([x + Math.cos(a0) * 0.1, 0, z + Math.sin(a0) * 0.1], [x + Math.cos(a1) * 0.1, 0, z + Math.sin(a1) * 0.1], [x, h * 0.3, z], tr, {});
        }
      };
      for (let i = 0; i < 16; i++) { const a = -2.6 + i * 0.36 + hash2(i, 1) * 0.2, r = 13 + hash2(i, 2) * 8; pine(Math.cos(a) * r, Math.sin(a) * r - 2, 2.4 + hash2(i, 5) * 2.2); }
      for (let i = 0; i < 5; i++) pine(-9 + i * 1.2 + hash2(i, 8), -7.5 - hash2(i, 4) * 2, 1.8 + hash2(i, 6));
      // far hills
      const hill = flat(r3, [178, 190, 214]);
      for (let i = 0; i < 12; i++) { const a0 = -3 + i * 0.5, a1 = a0 + 0.62, r = 46; T([Math.cos(a0) * r, 0, Math.sin(a0) * r], [Math.cos(a1) * r, 0, Math.sin(a1) * r], [Math.cos((a0 + a1) / 2) * r, 5 + hash2(i, 3) * 6, Math.sin((a0 + a1) / 2) * r], hill, { n: [0, 0.5, 1] }); }
      // snowbanks
      for (let i = 0; i < 7; i++) {
        const x = (hash2(i, 12) - 0.5) * 14, z = -2.5 - hash2(i, 13) * 6, w = 1 + hash2(i, 14), hh = 0.3 + hash2(i, 15) * 0.3;
        if (Math.hypot(x, z) < 2.6) continue;
        const top = [x, hh, z], fl = [x - w, 0, z + 0.3], fr = [x + w, 0, z + 0.3], bk = [x, 0, z - 0.6];
        T(fl, fr, top, snow, { n: norm([0, 0.8, 0.6]) }); T(fl, top, bk, snow, { n: norm([-0.5, 0.8, -0.2]) }); T(fr, bk, top, snow, { n: norm([0.5, 0.8, -0.2]) });
      }
      // the lantern on its pole, and the bucket by the hole
      const lx = this.r3.lamp[0], lz = this.r3.lamp[2], pole = flat(r3, [50, 46, 56]);
      Q([lx - 0.04, 0, lz], [lx + 0.04, 0, lz], [lx + 0.04, 1.25, lz], [lx - 0.04, 1.25, lz], pole, { n: [0, 0, 1] });
      const glow = () => [255, 226, 150];
      Q([lx - 0.12, 1.25, lz + 0.01], [lx + 0.12, 1.25, lz + 0.01], [lx + 0.12, 1.5, lz + 0.01], [lx - 0.12, 1.5, lz + 0.01], glow, { n: [0, 0, 1] });
      const bucket = flat(r3, [70, 110, 160]);
      const kx = -1.9, kz = 0.6;
      for (let i = 0; i < 8; i++) { const a0 = (i / 8) * 6.283, a1 = ((i + 1) / 8) * 6.283; Q([kx + Math.cos(a0) * 0.28, 0, kz + Math.sin(a0) * 0.28], [kx + Math.cos(a1) * 0.28, 0, kz + Math.sin(a1) * 0.28], [kx + Math.cos(a1) * 0.34, 0.5, kz + Math.sin(a1) * 0.34], [kx + Math.cos(a0) * 0.34, 0.5, kz + Math.sin(a0) * 0.34], bucket, {}); }
    }
    enter() { A.play('town', 1); CH.fx.setFade(0); ui.setObjective(''); this.say('Hold to drop the line. Wiggle to jig.', 3.5); }
    exit() {}
    say(t, d = 2.4) { this.msg = t; this.msgT = d; }
    // ---- update --------------------------------------------------------------
    update(dt) {
      const L = this.lure, W3 = this.water;
      if (this.msgT > 0) this.msgT -= dt;
      CH.wind && CH.wind.tick(dt);
      const wantDown = this.lure.depth > 0.25 || this.state !== 'idle';
      this.camK = CH.approach(this.camK || 0, wantDown ? 1 : 0, dt * (wantDown ? 0.9 : 0.6));
      const hold = inp.mdown || inp.down('jump') || inp.down('down') || inp.down('interact');
      // mouse steers the camera a touch, for depth
      this.mx = CH.lerp(this.mx, (inp.mx - W / 2) / W, Math.min(1, dt * 3));
      // jig: any quick vertical wiggle
      const my = inp.my;
      if (Math.abs(my - this.lastMY) > 3) { this.jigT = 0.6; L.jig += 0.5; }
      if (inp.hit('up')) { this.jigT = 0.6; L.jig += 1; }
      this.lastMY = my;
      if (this.jigT > 0) this.jigT -= dt;
      L.jig *= Math.pow(0.02, dt);

      if (this.card) {
        this.card.t += dt;
        if (this.card.t > 0.8 && (inp.hit('confirm') || inp.hit('interact') || inp.hit('jump') || inp.mpressed)) { inp.eat(); this.card = null; }
      } else if (this.state === 'idle' || this.state === 'biting') {
        const was = L.depth;
        if (hold && this.state === 'idle') { L.depth = Math.min(3.9, L.depth + dt * 1.1); if (Math.floor(L.depth * 8) !== Math.floor(was * 8)) A.sfx('reel'); }
        else if (inp.down('up') || inp.rdown) L.depth = Math.max(0, L.depth - dt * 1.4);
        if (was <= 0.02 && L.depth > 0.02) { W3.poke(0, 0, -1.4, 0.16); A.sfx('plop'); this.dropsBurst(0, 0, 6, 1.2); }
      } else if (this.state === 'hooked') this.fight(dt, hold);

      // fish
      const lureY = -0.32 - L.depth;
      for (const f of this.fish) this.updateFish(f, dt, lureY);

      // the bite window
      if (this.state === 'biting') {
        this.biteT -= dt;
        if (inp.mpressed || inp.hit('jump') || inp.hit('interact')) {
          inp.eat();
          this.state = 'hooked'; this.hooked = this.biter; this.biter.mode = 'hooked';
          this.tension = 0.3; A.sfx('select'); this.say('HOOKED! Hold to reel. Let go if the line screams.', 3);
          W3.poke(0, 0, -1.2, 0.2);
        } else if (this.biteT <= 0) {
          this.state = 'idle'; this.biter.mode = 'flee'; this.biter.cool = 6; this.say('Too slow. It spat the hook.', 2);
        }
      }

      // snow falls in 3D and dimples the water where it lands
      for (const s of this.flakes) {
        s.y -= s.vy * dt; s.x += ((CH.wind ? CH.wind.x : 8) * 0.03 + Math.sin(this.t * 1.3 + s.ph) * 0.2) * dt;
        const inHole = Math.hypot(s.x, s.z) < W3.R - 0.05;
        if (s.y < (inHole ? -0.32 : 0)) { if (inHole) W3.poke(s.x, s.z, -0.06, 0.08); Object.assign(s, this.newFlake(false)); }
      }
      // droplets from splashes
      for (const d of this.drops) {
        d.vy -= 9.8 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt;
        if (d.y < -0.32 && d.vy < 0) { d.dead = true; if (Math.hypot(d.x, d.z) < W3.R) W3.poke(d.x, d.z, -0.25, 0.1); }
      }
      this.drops = this.drops.filter((d) => !d.dead);
      // a breath of wind across the open water, and the line tapping the surface
      if (Math.random() < dt * 4) W3.poke((Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 0.12, 0.3);
      if (L.depth > 0 && this.jigT > 0 && Math.random() < dt * 8) W3.poke(0, 0, -0.1, 0.1);
      W3.step(dt);
      if (inp.hit('cancel') && !this.card) { inp.eat(); this.leave(); }
    }
    updateFish(f, dt, lureY) {
      const L = this.lure;
      f.t += dt;
      if (f.cool > 0) f.cool -= dt;
      const dx = L.x - f.x, dz = L.z - f.z, dy = lureY - f.y, dist = Math.hypot(dx, dz, dy);
      if (f.mode === 'wander') {
        f.head += Math.sin(f.t * 0.7 + f.x) * dt * 0.8;
        const r = Math.hypot(f.x, f.z);
        // they drift back past the hole, where the light comes through
        if (r > 4.5 || (r > 2 && Math.sin(f.t * 0.3 + f.x) > 0.6)) f.head = CH.lerp(f.head, Math.atan2(-f.z, -f.x), dt * 1.5);
        f.x += Math.cos(f.head) * f.speed * dt; f.z += Math.sin(f.head) * f.speed * dt;
        f.y = CH.lerp(f.y, -(f.sp.depth[0] + f.sp.depth[1]) / 2 + Math.sin(f.t * 0.4) * 0.4, dt * 0.3);
        // a jigging lure at about the right depth is irresistible
        if (L.depth > 0.3 && f.cool <= 0 && dist < 3.6 && Math.abs(dy) < 1.4 && this.state === 'idle') {
          f.interest += dt * (this.jigT > 0 ? 0.9 : 0.25);
          if (f.interest > 1) { f.mode = 'approach'; f.interest = 0; }
        }
      } else if (f.mode === 'approach') {
        f.head = Math.atan2(dz, dx);
        const sp = Math.min(dist, 0.6 * dt);
        if (dist > 0.001) { f.x += (dx / dist) * sp; f.z += (dz / dist) * sp; f.y += (dy / dist) * sp; }
        if (dist < 0.45) { f.mode = 'nibble'; f.nibT = 0.5; f.nibbles = 0; }
        if (this.state !== 'idle') { f.mode = 'wander'; f.cool = 3; }
      } else if (f.mode === 'nibble') {
        f.nibT -= dt;
        f.x = CH.lerp(f.x, L.x - Math.cos(f.head) * 0.4, dt * 4); f.z = CH.lerp(f.z, L.z - Math.sin(f.head) * 0.4, dt * 4); f.y = CH.lerp(f.y, lureY, dt * 4);
        if (f.nibT <= 0) {
          f.nibbles++; f.nibT = 0.4 + Math.random() * 0.5;
          this.water.poke(0, 0, -0.35, 0.1); A.sfx('blip2'); this.nibbleT = 0.25;
          if (f.nibbles >= 2 + Math.floor(Math.random() * 3) && this.state === 'idle') {
            this.state = 'biting'; this.biteT = 0.75; this.biter = f; A.sfx('bite'); this.say('BITE!  CLICK!', 0.8); this.water.poke(0, 0, -0.9, 0.16);
          }
        }
        if (this.state === 'hooked' && this.hooked !== f) { f.mode = 'flee'; f.cool = 4; }
      } else if (f.mode === 'flee') {
        f.head = Math.atan2(-dz, -dx);
        f.x += Math.cos(f.head) * 1.6 * dt; f.z += Math.sin(f.head) * 1.6 * dt;
        if (Math.hypot(f.x, f.z) > 6) { f.mode = 'wander'; }
      } else if (f.mode === 'hooked') {
        f.x = L.x + Math.sin(f.t * 7) * 0.12 * (1 - this.progress * 0.5); f.z = L.z + Math.cos(f.t * 5) * 0.12; f.y = lureY; f.head += dt * 4 * f.sp.fight;
      }
    }
    fight(dt, hold) {
      const L = this.lure, f = this.hooked, sp = f.sp;
      // the fish runs in bursts; reeling through a run is how lines snap
      f.runT = (f.runT || 0) - dt;
      if (f.runT <= 0) { f.running = !f.running; f.runT = f.running ? 0.5 + Math.random() * 0.9 * sp.fight : 0.6 + Math.random() * 1.2; if (f.running) A.sfx('whoosh'); }
      if (hold) {
        L.depth = Math.max(0, L.depth - dt * (f.running ? 0.12 : 0.55));
        this.tension += dt * (f.running ? 0.9 * sp.fight : 0.18);
        if (Math.floor(this.t * 12) !== Math.floor((this.t - dt) * 12)) A.sfx('reel');
      } else {
        this.tension -= dt * 0.7;
        if (f.running) L.depth = Math.min(3.9, L.depth + dt * 0.35 * sp.fight);
      }
      this.tension = CH.clamp(this.tension, 0, 1.2);
      this.progress = 1 - L.depth / 4;
      if (Math.random() < dt * 6) this.water.poke((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, -0.25 * (f.running ? 2 : 1), 0.12);
      if (this.tension >= 1.05) {
        this.state = 'idle'; f.mode = 'flee'; f.cool = 8; this.hooked = null; L.depth = Math.min(L.depth, 0.6);
        A.sfx('back'); this.say('SNAP. {p}The line, and a little of your spirit.', 2.6);
        return;
      }
      if (L.depth <= 0.02) this.land(f);
    }
    land(f) {
      const sp = f.sp;
      this.state = 'idle'; this.hooked = null; this.lure.depth = 0;
      const size = +(sp.len * (0.8 + Math.random() * 0.6) * 100).toFixed(0);
      this.catches.push({ name: sp.name, size });
      this.card = { sp, size, t: 0 };
      if (sp.pay) { CH.addMoney(sp.pay); this.money += sp.pay; }
      A.sfx('sploosh'); A.sfx(sp.pay >= 10 ? 'coin' : 'select');
      this.water.poke(0, 0, 2.6, 0.35);
      this.dropsBurst(0, 0, 40, 3.2);
      CH.doShake(3, 0.3);
      const i = this.fish.indexOf(f); if (i >= 0) this.fish[i] = this.newFish();
      if (!CH.flag('caughtFish')) CH.flag('caughtFish', true);
    }
    dropsBurst(x, z, n, sp) {
      for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, s = Math.random() * sp * 0.5; this.drops.push({ x, y: -0.3, z, vx: Math.cos(a) * s, vz: Math.sin(a) * s, vy: sp * (0.6 + Math.random() * 0.8) }); }
    }
    leave() {
      A.sfx('back');
      const done = this.opts.onDone;
      CH.game.runGlobal((function* () {
        yield CH.fx.fadeOut(0.4);
        if (CH.game.stack.length > 1) CH.game.pop(); else CH.game.set(CH.SCENES.travel ? CH.SCENES.travel() : new CH.CabinScene({ mode: 'home' }));
        if (done) done();
        yield CH.fx.fadeIn(0.4);
      })());
    }
    // ---- draw ----------------------------------------------------------------
    draw(g) {
      const r3 = this.r3, t = this.t, W3 = this.water;
      // camera: kneeling by the hole, breathing, leaning with the mouse
      // two framings, blended: the wide view of the lake while idle, and a look
      // straight down the hole once the line is in, so the fish can be seen
      const yaw = this.mx * 0.42 + Math.sin(t * 0.21) * 0.04, k = CH.ease.inOutCubic(this.camK || 0);
      const dist = mix(4.6, 2.2, k), hgt = mix(2.05, 3.2, k);
      const eye = [Math.sin(yaw) * dist, hgt + Math.sin(t * 0.9) * 0.03, Math.cos(yaw) * dist];
      const at = [Math.sin(yaw) * mix(-2.2, -0.15, k), mix(-0.25, -1.4, k), Math.cos(yaw) * mix(-2.2, -0.15, k)];
      r3.setCamera(eye, at);
      const hr = ((S.hour % 24) + 24) % 24, night = hr < 7 || hr > 17.5;
      r3.lampOn = night ? 1 : 0.35;
      r3.fog = night ? [40, 52, 86] : [176, 192, 218];
      r3.sun = night ? norm([0.4, 0.5, -0.3]) : norm([-0.55, 0.6, -0.4]);
      r3.clear(night ? [18, 24, 52] : [120, 150, 200], night ? [54, 64, 104] : [210, 214, 226]);
      for (const [a, b, c, m, o] of this.tris) r3.tri(a, b, c, m, o);
      // fish, and the lure they are after
      const lureY = -0.32 - this.lure.depth;
      for (const f of this.fish) this.drawFish(f);
      const lm = flat(r3, [230, 60, 50], { emissive: false });
      const s = 0.06, L = [this.lure.x, lureY + Math.sin(t * 9) * 0.02 * (this.jigT > 0 ? 3 : 1), this.lure.z];
      r3.tri([L[0] - s, L[1], L[2]], [L[0], L[1] + s * 1.6, L[2]], [L[0] + s, L[1], L[2]], lm, {});
      r3.tri([L[0] - s, L[1], L[2]], [L[0] + s, L[1], L[2]], [L[0], L[1] - s * 1.6, L[2]], flat(r3, [240, 240, 230]), {});
      // the water, blended over whatever is under it
      this.drawWater();
      // droplets and snow, with depth
      for (const d of this.drops) this.dot(d.x, d.y, d.z, [220, 240, 250], 2);
      // the line under the water, depth-tested so the ice hides it properly
      if (this.lure.depth > 0.02) for (let k = 0; k <= 24; k++) { const u = k / 24; this.dot(L[0] + Math.sin(u * 3 + t) * 0.01, mix(-0.32, L[1], u), L[2], [150, 200, 210], 1); }
      for (const f of this.flakes) this.dot(f.x, f.y, f.z, [250, 252, 255], 1);
      r3.blit(g);
      // the line, from the rod tip to the lure
      // the rod tip hangs over the near edge of the hole
      const tp = r3.project([0.3, 0.95 + Math.sin(t * 1.3) * 0.02 - (this.state === 'hooked' ? this.tension * 0.12 : 0), 0.55]);
      const tip = tp ? { x: tp.x * 2 + (this.state === 'hooked' ? Math.sin(t * 30) * 2 * this.tension : 0), y: tp.y * 2 } : { x: 330, y: 150 };
      const surf = r3.project([L[0], -0.32, L[2]]);
      if (surf) {
        gfx.line(tip.x, tip.y, surf.x * 2, surf.y * 2, 'rgba(240,240,250,0.85)');

      }
      this.drawRod(g, tip);
      CH.drawUI(g, (u) => this.drawHud(u));
    }
    dot(x, y, z, col, sz) {
      const r3 = this.r3, p = r3.project([x, y, z]);
      if (!p) return;
      const px = Math.round(p.x), py = Math.round(p.y);
      if (px < 0 || py < 0 || px >= RW || py >= RH) return;
      const big = sz > 1 && p.iw > 0.24;
      for (let oy = 0; oy < (big ? 2 : 1); oy++) for (let ox = 0; ox < (big ? 2 : 1); ox++) {
        const X = px + ox, Y = py + oy; if (X >= RW || Y >= RH) continue;
        const i = Y * RW + X; if (p.iw < r3.z[i] * 0.98) continue;
        r3.put(i, X, Y, col[0], col[1], col[2]);
      }
    }
    drawFish(f) {
      const r3 = this.r3, sp = f.sp, Ls = sp.len * 2.3 * (f.mode === 'hooked' ? 1.1 : 1);   // drawn big: the hole is drawn big too
      const ch = Math.cos(f.head), sh = Math.sin(f.head);
      const P = (a, b, c) => [f.x + ch * a - sh * c, f.y + b, f.z + sh * a + ch * c];   // a: along, b: up, c: across
      const body = flat(r3, sp.col), back = flat(r3, sp.stripe);
      const wag = Math.sin(f.t * (f.mode === 'hooked' ? 22 : 8)) * Ls * 0.35;
      const nose = P(Ls * 0.5, 0, 0), tail = P(-Ls * 0.45, 0, 0), top = P(0, Ls * 0.18, 0), bot = P(0, -Ls * 0.16, 0), l = P(0, 0, -Ls * 0.12), rr = P(0, 0, Ls * 0.12);
      if (sp.boot) {
        r3.quad(P(-Ls * 0.3, -Ls * 0.2, 0), P(Ls * 0.3, -Ls * 0.2, 0), P(Ls * 0.3, 0, 0), P(-Ls * 0.1, Ls * 0.3, 0), body, {});
        return;
      }
      r3.tri(nose, top, l, back, {}); r3.tri(nose, rr, top, back, {});
      r3.tri(nose, l, bot, body, {}); r3.tri(nose, bot, rr, body, {});
      r3.tri(tail, l, top, back, {}); r3.tri(tail, top, rr, back, {});
      r3.tri(tail, bot, l, body, {}); r3.tri(tail, rr, bot, body, {});
      const t1 = P(-Ls * 0.75, Ls * 0.16, wag), t2 = P(-Ls * 0.75, -Ls * 0.16, wag);
      r3.tri(tail, t1, t2, back, {});
      r3.tri(top, P(-Ls * 0.15, Ls * 0.32, 0), P(-Ls * 0.3, Ls * 0.1, 0), back, {});
    }
    drawWater() {
      const r3 = this.r3, W3 = this.water, N = W3.N, s = N + 1, dx = W3.dx, R = W3.R, Y = -0.32, AMP = 0.16;
      const eye = r3.eye, sun = r3.sun, lamp = r3.lamp;
      const sky = r3.fog, night = r3.lampOn > 0.5;
      const vx = (i) => -R + i * dx;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const cxw = vx(i) + dx / 2, czw = vx(j) + dx / 2;
        if (Math.hypot(cxw, czw) > R + dx * 0.6) continue;
        const h00 = W3.h[j * s + i], h10 = W3.h[j * s + i + 1], h01 = W3.h[(j + 1) * s + i], h11 = W3.h[(j + 1) * s + i + 1];
        const a = [vx(i), Y + h00 * AMP, vx(j)], b = [vx(i + 1), Y + h10 * AMP, vx(j)], c = [vx(i + 1), Y + h11 * AMP, vx(j + 1)], d = [vx(i), Y + h01 * AMP, vx(j + 1)];
        const n = norm([(h00 - h10 + h01 - h11) * AMP / (2 * dx), 1, (h00 - h01 + h10 - h11) * AMP / (2 * dx)]);
        const mat = (wx, wy, wz) => {
          const v = norm([eye[0] - wx, eye[1] - wy, eye[2] - wz]);
          const fres = 0.12 + 0.75 * Math.pow(1 - Math.max(0, dot(v, n)), 3);
          const rf = [2 * dot(n, v) * n[0] - v[0], 2 * dot(n, v) * n[1] - v[1], 2 * dot(n, v) * n[2] - v[2]];
          const spec = Math.pow(Math.max(0, dot(rf, sun)), 60) * (night ? 0.5 : 1.4);
          const ld = norm(sub(lamp, [wx, wy, wz]));
          const lspec = Math.pow(Math.max(0, dot(rf, ld)), 40) * r3.lampOn * 1.6;
          const deep = [26, 80, 92];
          const r = mix(deep[0], sky[0], fres) + spec * 255 + lspec * 255;
          const g = mix(deep[1], sky[1], fres) + spec * 250 + lspec * 200;
          const bb = mix(deep[2], sky[2], fres) + spec * 240 + lspec * 120;
          return [r, g, bb, 0.3 + fres * 0.5, 1];
        };
        r3.quad(a, b, c, d, mat, { n, blend: true });
      }
    }
    drawRod(g, tip) {
      const t = this.t, bob = Math.sin(t * 1.6) * 1.2 + (this.state === 'hooked' ? Math.sin(t * 28) * this.tension * 2 : 0);
      // Chubby's teal sleeve and paw, holding a short ice rod
      art.blit(390, 270 + bob, 110, 90, 30, 88, () => {
        const ox = 30, oy = 88;
        gfx.ellipse(ox + 52, oy - 6, 34, 26, '#1f8f84'); gfx.ellipse(ox + 50, oy - 10, 30, 22, '#2aa89a');
        gfx.ellipse(ox + 42, oy - 20, 12, 7, '#3fc0b0');
        gfx.ellipse(ox + 22, oy - 38, 14, 12, '#8a5a3a'); gfx.ellipse(ox + 20, oy - 41, 11, 9, '#a8744a');
        gfx.rect(ox + 8, oy - 48, 8, 3, '#8a5a3a');
      });
      const hx = 372, hy = 236 + bob;
      gfx.line(hx, hy, tip.x, tip.y, '#2a2230'); gfx.line(hx + 1, hy, tip.x + 1, tip.y, '#4a4050');
      const rx = CH.lerp(hx, tip.x, 0.16), ry = CH.lerp(hy, tip.y, 0.16);
      gfx.rect(rx - 6, ry - 4, 12, 9, '#3a3440'); gfx.rect(rx - 5, ry - 3, 10, 7, '#8a8f9c');
      gfx.circle(rx, ry + 1, 3, '#c8c8d0'); gfx.px(rx + Math.round(Math.cos(this.t * (this.state === 'hooked' ? 20 : 2)) * 2), ry + 1, '#3a3440');
    }
    drawHud(g) {
      const MG = CH.MG;
      gfx.rrect(4, 4, 132, 17, 4, 'rgba(12,16,28,0.7)');
      gfx.text('ICE FISHING', 10, 8, '#ffd84a');
      gfx.text(this.catches.length + ' caught', 130, 10, '#cfe6ff', { align: 'right', font: 'small' });
      // depth gauge
      const gx = W - 20, gy = 34, gh = 150;
      gfx.rrect(gx - 6, gy - 6, 18, gh + 12, 5, 'rgba(12,16,28,0.7)');
      gfx.vgrad(gx - 2, gy, 10, gh, ['#6fb4d8', '#1a5a74', '#0a2a3a']);
      for (const f of this.fish) { const k = CH.clamp((-f.y - 0.32) / 4, 0, 1); gfx.rect(gx - 1, gy + k * gh, 8, 1, 'rgba(255,220,140,0.35)'); }
      const lk = CH.clamp(this.lure.depth / 4, 0, 1);
      gfx.tri(gx - 8, gy + lk * gh - 4, gx - 8, gy + lk * gh + 4, gx - 3, gy + lk * gh, '#e0402f');
      gfx.text('DEPTH', gx + 3, gy + gh + 10, '#cfe6ff', { align: 'center', font: 'small' });
      // tension while a fish is on
      if (this.state === 'hooked') {
        const tw = 160, tx = W / 2 - tw / 2, ty = H - 34;
        gfx.rrect(tx - 3, ty - 3, tw + 6, 14, 4, 'rgba(12,16,28,0.8)');
        const k = CH.clamp(this.tension / 1.05, 0, 1);
        gfx.rect(tx, ty, Math.round(tw * k), 8, k > 0.8 ? (Math.sin(this.t * 30) > 0 ? '#ff4030' : '#c8352b') : k > 0.5 ? '#f5c33b' : '#6fd06a');
        gfx.text('LINE TENSION', W / 2, ty - 10, '#fff', { align: 'center', font: 'small', outline: '#000' });
        const pk = CH.clamp(this.progress || 0, 0, 1);
        gfx.rect(tx, ty + 12, Math.round(tw * pk), 2, '#9fdcff');
      }
      if (this.state === 'biting') {
        art.comicBurst(W / 2, 96, 'BITE!', { t: 1, r: 40 + Math.sin(this.t * 30) * 3, fill: '#ffd84a', textColor: '#c8352b', scale: 2 });
      }
      if (this.msgT > 0 && this.msg) {
        const txt = this.msg.replace(/\{[a-z]+\}/g, ' '), w = gfx.textWidth(txt) + 16;
        g.save(); g.globalAlpha = Math.min(1, this.msgT * 2);
        gfx.rrect(W / 2 - w / 2, 26, w, 17, 5, 'rgba(12,16,28,0.8)');
        gfx.text(txt, W / 2, 30, '#fff6d0', { align: 'center' });
        g.restore();
      }
      if (!this.card) gfx.text('HOLD: drop / reel    WIGGLE: jig    CLICK: strike    ESC: done', W / 2, H - 10, 'rgba(230,240,255,0.85)', { align: 'center', font: 'small', outline: '#0a1020' });
      // the catch card
      if (this.card) {
        const c = this.card, k = CH.ease.outBack(Math.min(1, c.t / 0.4));
        const cw = 220, ch = 110, cx = W / 2 - cw / 2, cy = H / 2 - ch / 2 - 10;
        g.save(); g.translate(W / 2, H / 2); g.scale(k, k); g.translate(-W / 2, -H / 2);
        gfx.rrect(cx - 3, cy - 3, cw + 6, ch + 6, 8, art.INK);
        gfx.rrect(cx, cy, cw, ch, 6, '#fbf6ea');
        gfx.rrect(cx, cy, cw, 18, 6, c.sp.pay >= 10 ? '#e8b44a' : '#2f6a8a');
        gfx.text(c.sp.boot ? 'YOU CAUGHT...' : 'CAUGHT!', W / 2, cy + 5, '#fff', { align: 'center' });
        gfx.text(c.sp.name, W / 2, cy + 26, '#241c2e', { align: 'center' });
        gfx.text(c.sp.boot ? 'size 11' : c.size + ' cm', W / 2, cy + 38, '#6a5a78', { align: 'center', font: 'small' });
        const lines = gfx.wrap(c.sp.joke, cw - 20);
        lines.slice(0, 3).forEach((ln, i) => gfx.text(ln, W / 2, cy + 50 + i * 10, '#3a3048', { align: 'center' }));
        gfx.text(c.sp.pay ? 'Tackle & Twine pays ' + CH.fmtMoney(c.sp.pay) : 'Tackle & Twine pays nothing for this', W / 2, cy + ch - 12, c.sp.pay ? '#2f7a4a' : '#9a3a3a', { align: 'center', font: 'small' });
        g.restore();
      }
    }
  }
  CH.FishingScene = FishingScene;
  CH.startFishing = (onDone) => { const s = new FishingScene({ onDone }); CH.game.push(s); return s; };
  CH.SCENES = CH.SCENES || {};
  CH.SCENES.fishing = () => new FishingScene({});
})(window.CH);
