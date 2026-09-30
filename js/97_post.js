// ============================================================================
// Post-processing, in the style of a Minecraft shader pack.
//
// Bright, saturated colour; a soft glow that comes only from things that give
// off light (lamps, lit windows, fire, neon, screens - never from snow or a
// white wall); god rays streaming from the sun between the trees and roofs,
// golden in the morning and evening; blue nights that stay readable; a gentle
// vignette. No film grain, no heavy grading.
//
// The world paints its light sources into a small emission map as it draws
// (CH.emit); the shader blurs that map into glow, casts the rays from
// CH.post.sun, and grades the frame. The 2D canvas stays in the page (it owns
// the mouse), made invisible, with the shaded copy drawn underneath it.
// No WebGL, or ?noshader in the URL, and the game simply shows the 2D canvas.
// ============================================================================
(function (CH) {
  const post = (CH.post = { on: false, strength: 1, sun: null, mood: null });
  // the emission API exists either way, so scenes can call it unconditionally
  CH.emit = () => {};
  CH.emitScreen = () => {};
  CH.emitStatic = (x, y, r, c, a) => { if (CH.emitSink) CH.emitSink.push({ x, y, r, c, a: a === undefined ? 1 : a }); };
  post.beginFrame = () => {};
  post.emitView = () => {};
  const params = new URLSearchParams(location.search);
  if (params.has('noshader')) return;

  const src = CH.canvas;
  const out = document.createElement('canvas');
  out.id = 'gamePost';
  out.setAttribute('aria-hidden', 'true');
  let gl = null;
  try { gl = out.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false }); } catch (e) { gl = null; }
  if (!gl) return;

  // ---- the emission map: a quarter-size canvas of light sources ---------------------
  const EW = CH.W >> 2, EH = Math.ceil(CH.H / 4);
  const emap = document.createElement('canvas'); emap.width = EW; emap.height = EH;
  const ectx = emap.getContext('2d');
  post._emap = emap;   // handy for debugging: the emission map as it stands
  let emitUsed = false;
  post.beginFrame = () => { ectx.setTransform(1, 0, 0, 1, 0, 0); ectx.globalAlpha = 1; ectx.clearRect(0, 0, EW, EH); emitUsed = false; };
  // a world scene sets its camera here so emitters can be given in world units
  post.emitView = (Z, cx, cy) => { ectx.setTransform(Z / 4, 0, 0, Z / 4, -cx * Z / 4, -cy * Z / 4); };
  CH.emit = (x, y, r, c, a = 1) => {
    if (!post.on || a <= 0.01) return;
    emitUsed = true;
    ectx.globalAlpha = Math.min(1, a);
    ectx.fillStyle = c;
    ectx.beginPath(); ectx.arc(x, y, Math.max(0.8, r), 0, Math.PI * 2); ectx.fill();
  };
  // screen-space emitters (overlays, minigames): x, y in the 480x270 frame
  CH.emitScreen = (x, y, r, c, a = 1) => {
    if (!post.on) return;
    ectx.save(); ectx.setTransform(0.25, 0, 0, 0.25, 0, 0); CH.emit(x, y, r, c, a); ectx.restore();
  };

  const VS = `
    attribute vec2 p;
    varying vec2 uv;
    void main() { uv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5); gl_Position = vec4(p, 0.0, 1.0); }`;
  // Pass 1, quarter size: the glow. The emission map blurred wide and soft,
  // plus a touch from the frame's own brightest *coloured* pixels (sparks,
  // neon) - never from white, so snow and walls stay crisp.
  const FS_GLOW = `
    precision mediump float;
    varying vec2 uv;
    uniform sampler2D tex;
    uniform sampler2D emap;
    uniform vec2 texel;
    uniform float spark;
    vec3 hot(vec3 c) {
      float mx = max(c.r, max(c.g, c.b)), mn = min(c.r, min(c.g, c.b));
      float sat = (mx - mn) / max(mx, 0.001);
      return c * smoothstep(0.9, 1.0, mx) * smoothstep(0.45, 0.8, sat);
    }
    void main() {
      vec3 e = texture2D(emap, uv).rgb * 0.16;
      vec3 b = hot(texture2D(tex, uv).rgb) * 0.2;
      for (int i = 0; i < 8; i++) {
        float a = float(i) * 0.7854 + 0.39;
        vec2 o = vec2(cos(a), sin(a)) * texel;
        e += texture2D(emap, uv + o).rgb * 0.06;
        e += texture2D(emap, uv + o * 2.4).rgb * 0.035;
        e += texture2D(emap, uv + o * 4.2).rgb * 0.02;
        b += hot(texture2D(tex, uv + o * 0.6).rgb) * 0.06;
      }
      gl_FragColor = vec4(e + b * spark, 1.0);
    }`;
  // Pass 2, quarter size: god rays. March from each pixel toward the sun and
  // gather the bright sky found along the way; roofs, trees and hills block it.
  const FS_RAYS = `
    precision mediump float;
    varying vec2 uv;
    uniform sampler2D tex;
    uniform vec2 sun;
    uniform float horizon;
    void main() {
      vec2 d = (sun - uv) * (0.9 / 28.0);
      vec2 q = uv;
      float ill = 1.0, acc = 0.0;
      for (int i = 0; i < 28; i++) {
        q += d;
        vec3 c = texture2D(tex, q).rgb;
        float l = dot(c, vec3(0.3, 0.59, 0.11));
        // open sky lets light through, brightest right around the sun;
        // trees, roofs and hills in the way cut it into shafts
        float near = exp(-length((q - sun) * vec2(1.78, 1.0)) * 5.0);
        float m = smoothstep(0.42, 0.9, l) * (0.35 + 2.4 * near) * (1.0 - smoothstep(horizon - 0.02, horizon + 0.04, q.y));
        acc += m * ill;
        ill *= 0.96;
      }
      // rays fade out with distance from the sun instead of hazing the whole frame
      float fall = exp(-length((uv - sun) * vec2(1.78, 1.0)) * 2.2);
      float r = acc / 11.0 * fall;
      gl_FragColor = vec4(vec3(r), 1.0);
    }`;
  // Pass 3, full size: the frame, glow and rays laid over it, then the grade:
  // vibrance, a warm or cool tint for the hour, a gentle curve, a soft vignette.
  const FS = `
    precision mediump float;
    varying vec2 uv;
    uniform sampler2D tex;
    uniform sampler2D glow;
    uniform sampler2D rays;
    uniform float k;
    uniform vec3 tint;
    uniform vec3 sunCol;
    uniform float sunK;
    uniform vec2 sun;
    uniform float vib;
    uniform float glowK;
    uniform float lift;
    void main() {
      vec3 base = texture2D(tex, uv).rgb;
      // the quarter-size passes were rendered into framebuffers, which store
      // rows bottom-up: read them flipped so they line up with the frame
      vec2 fuv = vec2(uv.x, 1.0 - uv.y);
      vec3 gl3 = texture2D(glow, fuv).rgb;
      float rr = texture2D(rays, fuv).r;
      // 1. grade the picture itself: vibrance, the tint of the hour, a gentle
      //    curve with lifted shadows - on values that stay inside 0..1
      float l = dot(base, vec3(0.299, 0.587, 0.114));
      float mx = max(base.r, max(base.g, base.b)), mn = min(base.r, min(base.g, base.b));
      vec3 c = mix(vec3(l), base, 1.0 + vib * k * (1.0 - (mx - mn) * 0.7));
      c = clamp(c * mix(vec3(1.0), tint, k), 0.0, 1.0);
      c = mix(c, c * c * (3.0 - 2.0 * c), 0.16 * k) + lift * k * (1.0 - c);
      // 2. light on top, screen-blended so it brightens without burning out:
      //    the glow of lamps and neon, a little block-light warmth on what they
      //    touch, the sun's rays and the halo round the sun itself
      float ds = length((uv - sun) * vec2(1.78, 1.0));
      // the halo round the sun only shows where the sun's light gets through
      vec3 light = gl3 * glowK + sunCol * (rr * sunK * 0.8 + sunK * 0.22 * exp(-ds * 8.0) * smoothstep(0.0, 0.45, rr));
      light = clamp(light * k, 0.0, 1.0);
      c = 1.0 - (1.0 - c) * (1.0 - light);
      c += c * gl3 * 0.18 * k;
      // 3. a soft vignette
      vec2 dv = uv - vec2(0.5, 0.5);
      float v = smoothstep(1.05, 0.35, length(dv * vec2(1.0, 1.2)));
      c *= mix(1.0, 0.84 + 0.16 * v, k);
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }`;

  function shader(type, code) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, code); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.warn('post shader', gl.getShaderInfoLog(sh)); return null; }
    return sh;
  }
  function program(fsCode) {
    const vs = shader(gl.VERTEX_SHADER, VS), fs = shader(gl.FRAGMENT_SHADER, fsCode);
    if (!vs || !fs) return null;
    const pr = gl.createProgram();
    gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { console.warn('post link', gl.getProgramInfoLog(pr)); return null; }
    return pr;
  }
  const progGlow = program(FS_GLOW), progRays = program(FS_RAYS), prog = program(FS);
  if (!progGlow || !progRays || !prog) return;

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  function bindQuad(pr) { const a = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0); }
  function makeTex(filter) {
    const tx = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tx);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tx;
  }
  // the frame is sampled 1:1 at pixel centres, so linear filtering costs no
  // sharpness there and gives the quarter-size passes a free extra blur
  const tex = makeTex(gl.LINEAR), emapTex = makeTex(gl.LINEAR);
  const glowTex = makeTex(gl.LINEAR), raysTex = makeTex(gl.LINEAR);
  const fboGlow = gl.createFramebuffer(), fboRays = gl.createFramebuffer();
  let gw = 0, gh = 0;
  function target(fb, tx, w, h) {
    gl.bindTexture(gl.TEXTURE_2D, tx);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, w, h, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tx, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  function sizeTargets(w, h) {
    gw = Math.max(1, w >> 2); gh = Math.max(1, h >> 2);
    target(fboGlow, glowTex, gw, gh); target(fboRays, raysTex, gw, gh);
  }
  const loc = (pr, names) => Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(pr, n)]));
  const UG = loc(progGlow, ['tex', 'emap', 'texel', 'spark']);
  const UR = loc(progRays, ['tex', 'sun', 'horizon']);
  const U = loc(prog, ['tex', 'glow', 'rays', 'k', 'tint', 'sunCol', 'sunK', 'sun', 'vib', 'glowK', 'lift']);

  // lay the shaded canvas exactly under the 2D one, which keeps the input
  out.style.cssText = 'position:fixed;pointer-events:none;image-rendering:pixelated;z-index:0;';
  src.style.position = src.style.position || 'relative';
  src.style.zIndex = '1';
  src.parentNode.insertBefore(out, src);
  function place() {
    const r = src.getBoundingClientRect();
    out.style.left = r.left + 'px'; out.style.top = r.top + 'px';
    out.style.width = r.width + 'px'; out.style.height = r.height + 'px';
  }
  window.addEventListener('resize', () => setTimeout(place, 0));
  post.on = true;
  src.style.opacity = '0';

  // ---- the grade for the hour -------------------------------------------------------
  // outdoors the sky decides it; indoors a warm, even room light
  const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  function gradeFor(hour, outdoor) {
    const h = ((hour % 24) + 24) % 24;
    const day = [1.03, 1.0, 0.95], gold = [1.1, 0.98, 0.84], night = [0.9, 0.96, 1.1], room = [1.04, 1.0, 0.95];
    if (!outdoor) return { tint: room, vib: 0.3, lift: 0.02, glowK: 1.1 };
    let tint;
    if (h < 5.5 || h >= 19.5) tint = night;
    else if (h < 7) tint = mix3(night, gold, (h - 5.5) / 1.5);
    else if (h < 9) tint = mix3(gold, day, (h - 7) / 2);
    else if (h < 15.5) tint = day;
    else if (h < 17.5) tint = mix3(day, gold, (h - 15.5) / 2);
    else tint = mix3(gold, night, (h - 17.5) / 2);
    const dark = h < 6 || h >= 19;
    return { tint, vib: dark ? 0.2 : 0.32, lift: dark ? 0.035 : 0.015, glowK: dark ? 1.3 : 0.9 };
  }

  // A machine that cannot keep up with the shader gets the plain 2D image
  // back after a few seconds rather than a slideshow.
  let slow = 0, frames = 0, lastT = 0;
  post.render = function () {
    if (!post.on) return;
    const now = performance.now();
    if (lastT) { const ft = now - lastT; frames++; if (frames > 30 && frames < 400) slow = slow * 0.95 + (ft > 45 ? 1 : 0) * 0.05; }
    lastT = now;
    if (slow > 0.8 && !post.forced) { post.toggle(); console.info('post: shader off, frame rate too low'); return; }
    if (out.width !== src.width || out.height !== src.height) { out.width = src.width; out.height = src.height; sizeTargets(out.width, out.height); place(); }
    const sun = post.sun, mood = post.mood || gradeFor(CH.state.hour || 9, !!sun);
    // upload the finished 2D frame and the emission map
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, emapTex);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, emap);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    // glow
    gl.useProgram(progGlow); bindQuad(progGlow);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboGlow); gl.viewport(0, 0, gw, gh);
    gl.uniform1i(UG.tex, 0); gl.uniform1i(UG.emap, 1);
    gl.uniform2f(UG.texel, 1.5 / gw, 1.5 / gh);
    gl.uniform1f(UG.spark, 0.5);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    // god rays, only when there is a sun (or moon) to cast them
    const sunK = sun ? sun.k : 0;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fboRays); gl.viewport(0, 0, gw, gh);
    if (sunK > 0.01) {
      gl.useProgram(progRays); bindQuad(progRays);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(UR.tex, 0);
      gl.uniform2f(UR.sun, sun.x, sun.y);
      gl.uniform1f(UR.horizon, sun.horizon !== undefined ? sun.horizon : 0.72);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    } else { gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); }
    // composite at full size
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, out.width, out.height);
    gl.useProgram(prog); bindQuad(prog);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, raysTex);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, glowTex);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(U.tex, 0); gl.uniform1i(U.glow, 1); gl.uniform1i(U.rays, 2);
    gl.uniform1f(U.k, post.strength);
    gl.uniform3f(U.tint, mood.tint[0], mood.tint[1], mood.tint[2]);
    const sc = sun && sun.color ? sun.color : [1, 0.9, 0.7];
    gl.uniform3f(U.sunCol, sc[0], sc[1], sc[2]);
    gl.uniform1f(U.sunK, sunK);
    gl.uniform2f(U.sun, sun ? sun.x : -2, sun ? sun.y : -2);
    gl.uniform1f(U.vib, mood.vib);
    gl.uniform1f(U.glowK, mood.glowK);
    gl.uniform1f(U.lift, mood.lift);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    // the sun is set fresh by whichever outdoor scene draws next frame
    post.sun = null; post.mood = null;
  };
  post.toggle = function () {
    post.on = !post.on;
    src.style.opacity = post.on ? '0' : '1';
    out.style.display = post.on ? 'block' : 'none';
  };
  // F8 flips the shader for comparison
  window.addEventListener('keydown', (e) => { if (e.key === 'F8') { post.forced = true; post.toggle(); } });
  place();
})(window.CH);
