// ============================================================================
// Post-processing: the finished 2D frame goes through one WebGL shader pass on
// its way to the screen - bloom off the lights and snow, split-tone grading,
// a lens vignette, a little film grain. The 2D canvas stays in the page (it
// owns the mouse), made invisible, with the shaded copy drawn underneath it.
// No WebGL, or ?noshader in the URL, and the game simply shows the 2D canvas.
// ============================================================================
(function (CH) {
  const post = (CH.post = { on: false, strength: 1 });
  const params = new URLSearchParams(location.search);
  if (params.has('noshader')) return;

  const src = CH.canvas;
  const out = document.createElement('canvas');
  out.id = 'gamePost';
  out.setAttribute('aria-hidden', 'true');
  let gl = null;
  try { gl = out.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false }); } catch (e) { gl = null; }
  if (!gl) return;

  const VS = `
    attribute vec2 p;
    varying vec2 uv;
    void main() { uv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5); gl_Position = vec4(p, 0.0, 1.0); }`;
  // Pass 1, at a quarter of the resolution: keep only what is brighter than
  // the threshold and blur it. Lamps, windows, snow glare and sparks survive;
  // wood and shadow do not.
  const FS_BLOOM = `
    precision mediump float;
    varying vec2 uv;
    uniform sampler2D tex;
    uniform vec2 texel;
    vec3 bright(vec3 c) { float l = dot(c, vec3(0.299, 0.587, 0.114)); return c * smoothstep(0.74, 1.0, l); }
    void main() {
      vec3 b = bright(texture2D(tex, uv).rgb) * 0.2;
      for (int i = 0; i < 8; i++) {
        float a = float(i) * 0.7854;
        vec2 o = vec2(cos(a), sin(a)) * texel;
        b += bright(texture2D(tex, uv + o).rgb) * 0.07;
        b += bright(texture2D(tex, uv + o * 2.2).rgb) * 0.03;
      }
      gl_FragColor = vec4(b, 1.0);
    }`;
  // Pass 2, full resolution: the frame itself, the bloom laid back over it,
  // then split-tone grading, a lens vignette and a little film grain.
  const FS = `
    precision mediump float;
    varying vec2 uv;
    uniform sampler2D tex;
    uniform sampler2D glow;
    uniform float t;
    uniform float k;
    uniform vec3 warm;
    uniform vec3 cool;
    float hash(vec2 q) { return fract(sin(dot(q, vec2(12.9898, 78.233)) + t * 7.13) * 43758.5453); }
    void main() {
      vec3 base = texture2D(tex, uv).rgb;
      vec3 c = base + texture2D(glow, uv).rgb * 0.9 * k;
      float lum = dot(c, vec3(0.299, 0.587, 0.114));
      c = mix(c, c * cool, (1.0 - smoothstep(0.0, 0.55, lum)) * 0.14 * k);
      c = mix(c, c * warm, smoothstep(0.45, 1.0, lum) * 0.12 * k);
      c = mix(c, c * c * (3.0 - 2.0 * c), 0.28 * k);
      float g2 = dot(c, vec3(0.299, 0.587, 0.114));
      c = mix(vec3(g2), c, 1.0 + 0.1 * k);
      vec2 d = uv - vec2(0.5, 0.46);
      float v = smoothstep(0.95, 0.28, length(d * vec2(1.0, 1.25)));
      c *= mix(1.0, 0.66 + 0.34 * v, k);
      c += vec3(0.035, 0.03, 0.02) * (1.0 - uv.y) * k;
      c += (hash(uv * 900.0) - 0.5) * 0.028 * k;
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
  const progBloom = program(FS_BLOOM), prog = program(FS);
  if (!progBloom || !prog) return;

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
  // sharpness there and gives the quarter-size pass a free extra blur
  const tex = makeTex(gl.LINEAR);
  const glowTex = makeTex(gl.LINEAR);
  const fbo = gl.createFramebuffer();
  let gw = 0, gh = 0;
  function sizeGlow(w, h) {
    gw = Math.max(1, w >> 2); gh = Math.max(1, h >> 2);
    gl.bindTexture(gl.TEXTURE_2D, glowTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gw, gh, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, glowTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  const UB = { tex: gl.getUniformLocation(progBloom, 'tex'), texel: gl.getUniformLocation(progBloom, 'texel') };
  const U = {
    tex: gl.getUniformLocation(prog, 'tex'), glow: gl.getUniformLocation(prog, 'glow'),
    t: gl.getUniformLocation(prog, 't'), k: gl.getUniformLocation(prog, 'k'),
    warm: gl.getUniformLocation(prog, 'warm'), cool: gl.getUniformLocation(prog, 'cool'),
  };

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

  // A machine that cannot keep up with the shader gets the plain 2D image
  // back after a few seconds rather than a slideshow.
  let slow = 0, frames = 0, lastT = 0;
  post.render = function () {
    if (!post.on) return;
    const now = performance.now();
    if (lastT) { const ft = now - lastT; frames++; if (frames > 30 && frames < 400) slow = slow * 0.95 + (ft > 45 ? 1 : 0) * 0.05; }
    lastT = now;
    if (slow > 0.8 && !post.forced) { post.toggle(); console.info('post: shader off, frame rate too low'); return; }
    if (out.width !== src.width || out.height !== src.height) { out.width = src.width; out.height = src.height; sizeGlow(out.width, out.height); place(); }
    // upload the finished 2D frame
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
    // bright pass + blur into the quarter-size target
    gl.useProgram(progBloom); bindQuad(progBloom);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, gw, gh);
    gl.uniform1i(UB.tex, 0);
    gl.uniform2f(UB.texel, 1.6 / gw, 1.6 / gh);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    // composite at full size
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, out.width, out.height);
    gl.useProgram(prog); bindQuad(prog);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, glowTex);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(U.tex, 0); gl.uniform1i(U.glow, 1);
    gl.uniform1f(U.t, (CH.game && CH.game.t) || 0);
    gl.uniform1f(U.k, post.strength);
    gl.uniform3f(U.warm, 1.08, 1.0, 0.9);
    gl.uniform3f(U.cool, 0.9, 0.96, 1.1);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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
