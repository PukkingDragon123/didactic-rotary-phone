// ============================================================================
// Touch controls: a floating stick and chunky pixel buttons for phones and
// tablets. They float in a layer over the game and only show what the screen
// underneath can use: walking gets the stick, E and JUMP, menus get nothing
// but taps. Every control just holds a key down by name, so the game never
// knows a thumb from a keyboard.
//   ?touch=1 forces them on (handy on a desktop), ?touch=0 turns them off.
// ============================================================================
(function (CH) {
  const inp = CH.input, gfx = CH.gfx, ui = CH.ui;
  const force = new URLSearchParams(location.search).get('touch');
  CH.touchMode = false;
  if (force === '0') return;

  // ---- words: on a phone, "Press E" becomes "Tap E" -----------------------------
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const RULES = [
    ['Arrow keys / WASD to move  -  E to interact  -  Space to hop', 'Stick to move  -  E to interact  -  JUMP to hop'],
    ['ARROWS: RUN   Z/SPACE: JUMP   JUMP AGAIN: DOUBLE JUMP', 'STICK: RUN    JUMP: JUMP    AGAIN: DOUBLE JUMP'],
    ['PRESS JUMP TO START', 'TAP JUMP TO START'],
    ['Press any direction to stand up', 'Push the stick to stand up'],
    ['Press E when the marker is in the green zone!', 'Tap when the marker is in the green zone!'],
    ['HANDSHAKE!  Press E', 'HANDSHAKE!  TAP!'],
    ['Press I any time to use the phone', 'Tap the phone button any time'],
    ['(press I)', '(phone button)'],
    ['or press I / Esc', ''],
    ['Phone (I)', 'Phone'],
    ['Click a number  -  or type it', 'Tap a number'],
    ['Hold the mouse and drag', 'Touch and drag'],
    ['HOLD: drop / reel    WIGGLE: jig    CLICK: strike    ESC: done', 'HOLD: drop / reel    ▲: raise    TAP: strike    ✗: done'],
    ['BITE!  CLICK!', 'BITE!  TAP!'],
    ['scroll / ↑↓ to view  -  click a room', '▲▼ to view  -  tap a room'],
    ['LEAVE (Esc)', 'LEAVE'],
    ['(Esc to stop playing)', '(✗ to stop playing)'],
    ['↑↓ choose    Enter pick    M mute', 'Tap to choose'],
    ['Enter: save    Esc: back', 'Tap a slot to save'],
    ['Enter: load    Esc: back', 'Tap a slot to load'],
    ['Any key to go back', 'Tap to go back'],
    ['Esc: resume', 'Tap Resume'],
    ['Sound muted (M)', 'Sound muted'],
    [/\bPress E\b/g, 'Tap E'],
    [/\bpress E\b/g, 'tap E'],
    [/\bCLICK\b/g, 'TAP'],
    [/\bClick\b/g, 'Tap'],
    [/\bclick\b/g, 'tap'],
  ].map(([a, b]) => [typeof a === 'string' ? new RegExp(esc(a), 'g') : a, b]);
  const QUICK = new RegExp(RULES.map(([r]) => r.source).join('|'));
  const memo = new Map();
  const swap = (s) => {
    if (!CH.touchMode || typeof s !== 'string' || !QUICK.test(s)) return s;
    let r = memo.get(s);
    if (r === undefined) {
      r = s;
      for (const [rx, b] of RULES) r = r.replace(rx, b);
      if (memo.size > 400) memo.clear();
      memo.set(s, r);
    }
    return r;
  };
  CH.touchText = swap;
  // everything that measures or draws words sees the touch wording
  for (const name of ['text', 'textWidth', 'wrap', 'ellipsize', 'fitFont']) {
    const f = gfx[name];
    gfx[name] = (s, ...rest) => f(swap(s), ...rest);
  }
  for (const name of ['toast', 'setHint', 'setObjective']) {
    const f = ui[name];
    ui[name] = (s, ...rest) => f(swap(s), ...rest);
  }
  const say0 = ui.say, choose0 = ui.choose;
  ui.say = (sp, text, opts) => say0(sp, swap(String(text)), opts);
  ui.choose = (sp, text, options, opts) => choose0(sp, swap(String(text)), (options || []).map(swap), opts);

  // ---- the layer -------------------------------------------------------------------
  const css = document.createElement('style');
  css.textContent = `
#touchUI { position: fixed; inset: 0; z-index: 6; pointer-events: none; display: none;
  -webkit-user-select: none; user-select: none; -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent; touch-action: none; }
#touchUI.on { display: block; }
#touchUI canvas { position: absolute; left: 0; top: 0; image-rendering: pixelated; image-rendering: crisp-edges; pointer-events: none; }
#touchUI .tb { pointer-events: auto; opacity: 0.84; }
#touchUI .tb.down { opacity: 1; }
#touchUI .tb.ready { animation: tbBob 0.7s infinite; }
@keyframes tbBob { 0%, 49% { translate: 0 0; } 50%, 100% { translate: 0 -4px; } }
#touchUI .tzone { position: absolute; pointer-events: auto; }
#touchUI .tbase { opacity: 0.5; }
#touchUI .tknob { opacity: 0.88; }
#touchUI.held .tbase { opacity: 0.72; }
#touchUI.held .tknob { opacity: 1; }
#touchUI .tnote { opacity: 0.85; }
body.tportrait #wrap { align-items: flex-start; box-sizing: border-box; padding-top: calc(env(safe-area-inset-top, 0px) + 8px); }
`;
  document.head.appendChild(css);
  const root = document.createElement('div');
  root.id = 'touchUI';
  root.setAttribute('aria-hidden', 'true');
  document.body.appendChild(root);
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;' +
    'padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px);';
  document.body.appendChild(probe);

  // ---- pixel painting --------------------------------------------------------------
  // Each control is a little canvas drawn on the game's own pixel grid with the
  // game's own primitives, then blown up by a whole number of device pixels.
  let P = 2, dpr = 1, unit = 2;
  function paint(el, w, h, draw) {
    if (el.width !== w * P || el.height !== h * P) { el.width = w * P; el.height = h * P; }
    const x = el.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0);
    x.clearRect(0, 0, el.width, el.height);
    x.imageSmoothingEnabled = false;
    x.setTransform(P, 0, 0, P, 0, 0);
    gfx.pushTarget(x);
    try { draw(x); } finally { gfx.popTarget(); }
    el._w = (w * P) / dpr; el._h = (h * P) / dpr;
    el.style.width = el._w + 'px'; el.style.height = el._h + 'px';
  }
  const INK = '#0b0a0f', BONE = '#f2ecd8';
  const SKIN = {
    e: { face: '#4f9d3a', hi: '#9ad97a', lo: '#2b5f22', ink: '#f4ffe8' },
    jump: { face: '#c8352b', hi: '#f08a76', lo: '#7d1f17', ink: '#fff2e8' },
    dance: { face: '#7b4fb0', hi: '#b892e6', lo: '#472a6c', ink: BONE },
    phone: { face: '#3b6fd6', hi: '#8db3f3', lo: '#22438a', ink: BONE },
    plain: { face: '#4a3c5e', hi: '#85739e', lo: '#2a2036', ink: BONE },
    back: { face: '#8a3a3a', hi: '#cf7a68', lo: '#521f1f', ink: BONE },
  };
  // a round arcade button seen from above: a dark well, and a coloured cap
  // whose side shows until it is pushed in
  function drawButton(size, skin, down, icon) {
    const c = (size - 1) / 2, cr = Math.round(c * 0.76);
    gfx.circle(c, c, c, INK);
    gfx.circle(c, c, c - 1, '#211b2c');
    gfx.circle(c, c + 1, cr + 1, INK);
    const top = down ? c + 1 : c - 1;
    if (!down) gfx.circle(c, c + 1, cr, skin.lo);
    gfx.circle(c, top, cr, skin.face);
    gfx.ellipse(c - cr * 0.34, top - cr * 0.52, cr * 0.36, cr * 0.2, skin.hi);
    icon(c, top, skin);
  }
  function label(t, cx, cy, font, k, col, shadow) {
    const g = gfx.cur;
    g.save(); g.translate(Math.round(cx), Math.round(cy)); g.scale(k, k);
    gfx.text(t, 0, -Math.ceil(gfx.fontH(font) / 2), col, { align: 'center', font, shadow });
    g.restore();
  }
  const R = (x, y, w, h, c) => gfx.rect(Math.round(x), Math.round(y), w, h, c);
  const ICON = {
    e: (cx, cy, s) => label('E', cx + 1, cy, 'main', 2, s.ink, s.lo),
    jump: (cx, cy, s) => {
      for (let i = 0; i < 4; i++) R(cx - i, cy - 7 + i, i * 2 + 1, 1, s.ink); // the arrow
      R(cx - 1, cy - 3, 3, 2, s.ink);
      label('JUMP', cx + 1, cy + 4, 'small', 1, s.ink, s.lo);
    },
    pause: (cx, cy, s) => { R(cx - 3, cy - 4, 2, 8, s.ink); R(cx + 2, cy - 4, 2, 8, s.ink); },
    phone: (cx, cy, s) => {
      gfx.rrect(Math.round(cx - 3), Math.round(cy - 5), 7, 11, 1, s.ink);
      R(cx - 2, cy - 3, 5, 6, s.lo); R(cx, cy + 4, 1, 1, s.lo);
    },
    dance: (cx, cy, s) => { // two beamed quavers
      gfx.ellipse(cx - 3, cy + 3, 2, 1.5, s.ink); gfx.ellipse(cx + 3, cy + 2, 2, 1.5, s.ink);
      R(cx - 2, cy - 4, 1, 7, s.ink); R(cx + 4, cy - 5, 1, 7, s.ink);
      R(cx - 2, cy - 5, 7, 2, s.ink);
    },
    back: (cx, cy, s) => {
      for (let i = -3; i <= 3; i++) { R(cx + i - 1, cy + i, 3, 1, s.ink); R(cx - i - 1, cy + i, 3, 1, s.ink); }
    },
    up: (cx, cy, s) => { for (let i = 0; i < 4; i++) R(cx - i, cy - 2 + i, i * 2 + 1, 1, s.ink); },
    down: (cx, cy, s) => { for (let i = 0; i < 4; i++) R(cx - i, cy + 2 - i, i * 2 + 1, 1, s.ink); },
    fs: (cx, cy, s) => {
      // four corners pointing out to grow; turned inside out to shrink back
      const inward = isFS();
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        const x = cx + sx * (inward ? 2 : 4), y = cy + sy * (inward ? 2 : 4), o = inward ? -1 : 1;
        R(sx * o < 0 ? x : x - 2, y, 3, 1, s.ink);
        R(x, sy * o < 0 ? y : y - 2, 1, 3, s.ink);
      }
    },
    mute: (cx, cy, s) => {
      R(cx - 5, cy - 2, 2, 4, s.ink); R(cx - 3, cy - 3, 1, 6, s.ink); R(cx - 2, cy - 4, 1, 8, s.ink);
      if (CH.audio.muted) { for (let i = -2; i <= 2; i++) { R(cx + 2 + i, cy + i, 1, 1, '#ff8a7a'); R(cx + 2 - i, cy + i, 1, 1, '#ff8a7a'); } }
      else { R(cx + 1, cy - 1, 1, 2, s.ink); R(cx + 3, cy - 3, 1, 6, s.ink); }
    },
  };
  const BIG = 35, SMALL = 23, BASE = 61, KNOB = 27;
  function drawBase() {
    const c = 30;
    gfx.circle(c, c, 30, INK);
    gfx.circle(c, c, 29, '#2c2438');
    gfx.circle(c, c, 26, '#161220');
    gfx.ellipseOutline(c, c, 17, 17, '#241d30');
    const k = '#7b6f92';
    for (let i = 0; i < 3; i++) {
      R(c - i, 6 + i, i * 2 + 1, 1, k); R(c - i, 54 - i, i * 2 + 1, 1, k);
      R(6 + i, c - i, 1, i * 2 + 1, k); R(54 - i, c - i, 1, i * 2 + 1, k);
    }
  }
  function drawKnob() { // a fat golden button with a paw print on it
    const c = 13;
    gfx.circle(c, c, 13, INK);
    gfx.circle(c, c + 1, 11, '#a2740f');
    gfx.circle(c, c - 1, 11, '#f5c33b');
    gfx.ellipse(c - 4, c - 6, 3, 1.6, '#fff1a8');
    const p = '#c48e17';
    gfx.ellipse(c, c + 2, 3.6, 2.6, p);
    gfx.circle(c - 4, c - 2, 1.4, p); gfx.circle(c, c - 4, 1.4, p); gfx.circle(c + 4, c - 2, 1.4, p);
  }

  // ---- keys, shared between controls --------------------------------------------------
  const count = {};
  const hold = (k) => { count[k] = (count[k] || 0) + 1; if (count[k] === 1) inp.press(k); };
  const drop = (k) => { if (!count[k]) return; count[k]--; if (!count[k]) inp.release(k); };
  const buzz = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* no motor */ } };
  const unlock = () => { if (CH.audio && CH.audio.unlock) CH.audio.unlock(); };

  // ---- buttons ---------------------------------------------------------------------------
  const isFS = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const canFS = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
  function toggleFS() {
    try {
      if (isFS()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
      const d = document.documentElement, req = d.requestFullscreen || d.webkitRequestFullscreen;
      const p = req && req.call(d, { navigationUI: 'hide' });
      if (p && p.then) p.then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (e) { /* not on this phone */ } }).catch(() => {});
    } catch (e) { /* the browser said no */ }
  }
  const btn = {};
  function button(id, size, skin, key, opts = {}) {
    const el = document.createElement('canvas');
    el.className = 'tb';
    el.dataset.k = id;
    el.style.display = 'none';
    root.appendChild(el);
    const b = { id, el, size, skin: SKIN[skin], key, pid: null, down: false, on: false, opts };
    b.paint = () => paint(el, size, size, () => drawButton(size, b.skin, b.down, ICON[id]));
    const up = (e) => {
      if (e.pointerId !== b.pid) return;
      b.pid = null; b.down = false; el.classList.remove('down'); b.paint();
      if (b.key) drop(b.key);
      if (opts.onUp && e.type === 'pointerup') opts.onUp();
    };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (b.pid !== null) return;
      unlock();
      b.pid = e.pointerId;
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* already gone */ }
      b.down = true; el.classList.add('down'); b.paint(); buzz(9);
      if (b.key) hold(b.key);
    });
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('lostpointercapture', up);
    el.addEventListener('contextmenu', (e) => e.preventDefault());
    b.release = () => { if (b.pid === null) return; b.pid = null; b.down = false; el.classList.remove('down'); b.paint(); if (b.key) drop(b.key); };
    btn[id] = b;
    return b;
  }
  button('e', BIG, 'e', 'interact');
  button('jump', BIG, 'jump', 'jump');
  button('pause', SMALL, 'plain', 'pause');
  button('phone', SMALL, 'phone', 'phone');
  button('dance', SMALL, 'dance', 'down');
  button('back', SMALL, 'back', 'cancel');
  button('up', SMALL, 'plain', 'up');
  button('down', SMALL, 'plain', 'down');
  button('mute', SMALL, 'plain', 'mute');
  button('fs', SMALL, 'plain', null, { onUp: toggleFS });

  // ---- the stick -----------------------------------------------------------------------------
  // It sits faded at rest in the corner; put a thumb down anywhere on the left
  // and it jumps under it, then follows the thumb if it wanders off the rim.
  const zone = document.createElement('div');
  zone.className = 'tzone';
  zone.style.display = 'none';
  root.appendChild(zone);
  const baseEl = document.createElement('canvas'); baseEl.className = 'tbase'; baseEl.style.display = 'none'; root.appendChild(baseEl);
  const knobEl = document.createElement('canvas'); knobEl.className = 'tknob'; knobEl.style.display = 'none'; root.appendChild(knobEl);
  const stick = { pid: null, ox: 0, oy: 0, x: 0, y: 0, on: false, rest: { x: 0, y: 0 }, box: { x: 0, y: 0, w: 0, h: 0 } };
  const dir = { left: false, right: false, up: false, down: false };
  function setDir(k, on) { if (dir[k] !== on) { dir[k] = on; if (on) hold(k); else drop(k); } }
  function stickKeys() {
    const x = stick.x, y = stick.y, ax = Math.abs(x);
    setDir('right', dir.right ? x > 0.2 : x > 0.32);
    setDir('left', dir.left ? x < -0.2 : x < -0.32);
    setDir('up', dir.up ? y < -0.45 : y < -0.62);
    // straight down (and only straight down) is the dance
    setDir('down', dir.down ? y > 0.45 && ax < 0.7 : y > 0.62 && ax < 0.55);
  }
  function placeStick() {
    const ox = stick.pid !== null ? stick.ox : stick.rest.x, oy = stick.pid !== null ? stick.oy : stick.rest.y;
    const reach = baseEl._w * 0.34;
    baseEl.style.left = Math.round(ox - baseEl._w / 2) + 'px'; baseEl.style.top = Math.round(oy - baseEl._h / 2) + 'px';
    knobEl.style.left = Math.round(ox + stick.x * reach - knobEl._w / 2) + 'px';
    knobEl.style.top = Math.round(oy + stick.y * reach - knobEl._h / 2) + 'px';
  }
  function moveStick(px, py) {
    const reach = baseEl._w * 0.34, slack = reach * 1.3;
    let dx = px - stick.ox, dy = py - stick.oy, d = Math.hypot(dx, dy);
    if (d > slack) { const k = (d - slack) / d; stick.ox += dx * k; stick.oy += dy * k; dx = px - stick.ox; dy = py - stick.oy; d = slack; }
    const m = Math.min(1, d / reach);
    stick.x = d ? (dx / d) * m : 0; stick.y = d ? (dy / d) * m : 0;
    inp.stick.x = stick.x; inp.stick.y = stick.y; inp.stick.active = true;
    stickKeys(); placeStick();
  }
  function endStick() {
    stick.pid = null; stick.x = stick.y = 0;
    inp.stick.x = inp.stick.y = 0; inp.stick.active = false;
    for (const k of Object.keys(dir)) setDir(k, false);
    root.classList.remove('held');
    placeStick();
  }
  zone.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (stick.pid !== null) return;
    unlock();
    stick.pid = e.pointerId;
    try { zone.setPointerCapture(e.pointerId); } catch (err) { /* already gone */ }
    const r = baseEl._w / 2;
    stick.ox = CH.clamp(e.clientX, ins.l + r * 0.75, innerWidth - r);
    stick.oy = CH.clamp(e.clientY, r, innerHeight - ins.b - r * 0.75);
    root.classList.add('held');
    moveStick(e.clientX, e.clientY);
  });
  zone.addEventListener('pointermove', (e) => { if (e.pointerId === stick.pid) { e.preventDefault(); moveStick(e.clientX, e.clientY); } });
  for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) zone.addEventListener(t, (e) => { if (e.pointerId === stick.pid) endStick(); });
  zone.addEventListener('contextmenu', (e) => e.preventDefault());

  // ---- "turn sideways" note for portrait ------------------------------------------------------
  const note = document.createElement('canvas'); note.className = 'tnote'; note.style.display = 'none'; root.appendChild(note);
  const NOTE = '↻  TURN SIDEWAYS FOR A BIGGER SCREEN';

  // ---- what the screen underneath can use ---------------------------------------------------------
  function wanted() {
    const sc = CH.game.scene, w = {};
    if (!sc) return w;
    const name = sc.name || '', busy = ui.busy();
    const world = CH.WorldScene && sc instanceof CH.WorldScene;
    if (world && !sc.locked && !busy && !sc._walk) {
      w.stick = w.e = true;
      if (sc.allowHop !== false) w.jump = true;
      if (sc.allowDance !== false) w.dance = true;
      if (CH.flag('hasPhone') && sc.allowPhone !== false) w.phone = true;
    }
    if (world && sc.touchStick) w.stick = true;
    if (name === 'hedgehog' && (sc.phase === 'title' || sc.phase === 'play' || sc.phase === 'boss')) {
      w.stick = w.jump = true;
      if (sc.opts && sc.opts.canQuit && !sc.capped) w.back = true;
    }
    if (name === 'fishing' && !sc.card) w.up = w.down = w.back = true;
    if (name === 'tower') w.up = w.down = true;
    if (name === 'title' || name === 'pause' || name === 'savemenu' || name === 'controls' || name === 'confirm') {
      w.mute = true;
      if (canFS) w.fs = true;
    } else if (!busy) w.pause = true;
    return w;
  }
  let shown = {}, ctxName = '';
  function show(el, on) { el.style.display = on ? '' : 'none'; }
  function apply(w) {
    let changed = false;
    for (const id in btn) {
      const b = btn[id], on = !!w[id];
      if (b.on !== on) { b.on = on; show(b.el, on); if (!on) b.release(); changed = true; }
    }
    if (stick.on !== !!w.stick) {
      stick.on = !!w.stick;
      show(zone, stick.on); show(baseEl, stick.on); show(knobEl, stick.on);
      if (!stick.on && stick.pid !== null) endStick();
      changed = true;
    }
    shown = w;
    return changed;
  }

  // ---- layout ------------------------------------------------------------------------------------
  let ins = { t: 0, r: 0, b: 0, l: 0 }, portrait = false, paintedAt = '';
  function readInsets() {
    const s = getComputedStyle(probe);
    ins = { t: parseFloat(s.paddingTop) || 0, r: parseFloat(s.paddingRight) || 0, b: parseFloat(s.paddingBottom) || 0, l: parseFloat(s.paddingLeft) || 0 };
  }
  function put(el, cx, cy) { el.style.left = Math.round(cx - el._w / 2) + 'px'; el.style.top = Math.round(cy - el._h / 2) + 'px'; }
  function repaint() {
    for (const id in btn) btn[id].paint();
    paint(baseEl, BASE, BASE, drawBase);
    paint(knobEl, KNOB, KNOB, drawKnob);
    const nw = gfx.textWidth(NOTE, 'small') + 2;
    paint(note, nw, 8, () => gfx.text(NOTE, 1, 1, '#8a84a8', { font: 'small' }));
  }
  function layout() {
    if (!CH.touchMode) { document.body.classList.remove('tportrait'); return; }
    const vw = innerWidth, vh = innerHeight;
    dpr = window.devicePixelRatio || 1;
    const cssPx = Math.min(vw, vh) >= 600 ? 3 : 2;
    P = Math.max(1, Math.round(cssPx * dpr));
    unit = P / dpr;
    if (paintedAt !== P + '/' + dpr) { paintedAt = P + '/' + dpr; repaint(); }
    const tall = vh > vw;
    if (tall !== portrait || document.body.classList.contains('tportrait') !== tall) {
      portrait = tall;
      document.body.classList.toggle('tportrait', tall);
      // the game fits itself to the window again, now pinned to the top
      window.dispatchEvent(new Event('resize'));
      return;
    }
    readInsets();
    const big = btn.e.el._w, sm = btn.pause.el._w, gap = Math.round(4 * unit), edge = Math.round(6 * unit);
    const order = ['fs', 'mute', 'pause', 'phone', 'dance'];
    if (!portrait) {
      // right thumb: JUMP in the corner, E up and to its left
      const jx = vw - ins.r - edge - big / 2, jy = vh - ins.b - edge - big / 2;
      put(btn.jump.el, jx, jy);
      put(btn.e.el, jx - big * 1.12, jy - big * 0.5);
      // the small ones stack down the right edge
      let y = ins.t + edge + sm / 2;
      for (const id of order) if (btn[id].on) { put(btn[id].el, vw - ins.r - edge - sm / 2, y); y += sm + gap; }
      put(btn.back.el, ins.l + edge + sm / 2, ins.t + edge + sm / 2);
      if (ctxName === 'tower') {
        put(btn.up.el, vw - ins.r - edge - sm / 2, vh / 2 - sm / 2 - gap);
        put(btn.down.el, vw - ins.r - edge - sm / 2, vh / 2 + sm / 2 + gap);
      } else {
        put(btn.down.el, ins.l + edge * 2 + sm / 2, vh - ins.b - edge - sm / 2);
        put(btn.up.el, ins.l + edge * 2 + sm / 2, vh - ins.b - edge - sm * 1.5 - gap);
      }
      stick.rest = { x: ins.l + edge * 2 + baseEl._w / 2, y: vh - ins.b - edge - baseEl._h / 2 };
      stick.box = { x: 0, y: vh * 0.28, w: vw * 0.46, h: vh * 0.72 };
      show(note, false);
    } else {
      // a handheld: the game on top, the controls in the space below it
      const cr = CH.canvas.getBoundingClientRect();
      const rowY = cr.bottom + edge + sm / 2;
      let x = vw - ins.r - edge - sm / 2;
      for (const id of order) if (btn[id].on) { put(btn[id].el, x, rowY); x -= sm + gap; }
      put(btn.back.el, ins.l + edge + sm / 2, rowY);
      const top = rowY + sm / 2 + edge, avail = vh - ins.b - top;
      put(note, vw / 2, top + note._h / 2 + edge);
      show(note, avail > big * 2.6);
      const midY = top + Math.max(big, avail * 0.56);
      const jx = vw - ins.r - edge * 2 - big / 2;
      put(btn.jump.el, jx, midY + big * 0.32);
      put(btn.e.el, jx - big * 1.12, midY - big * 0.3);
      if (ctxName === 'tower') {
        put(btn.up.el, jx, midY - sm / 2 - gap);
        put(btn.down.el, jx, midY + sm / 2 + gap);
      } else {
        put(btn.up.el, ins.l + edge * 3 + sm / 2, midY - sm / 2 - gap);
        put(btn.down.el, ins.l + edge * 3 + sm / 2, midY + sm / 2 + gap);
      }
      stick.rest = { x: Math.max(ins.l + edge * 2 + baseEl._w / 2, vw * 0.27), y: midY };
      stick.box = { x: 0, y: top, w: vw * 0.55, h: vh - top };
    }
    const z = stick.box;
    zone.style.left = z.x + 'px'; zone.style.top = z.y + 'px'; zone.style.width = z.w + 'px'; zone.style.height = z.h + 'px';
    placeStick();
  }

  // ---- on, off, and every frame ---------------------------------------------------------------------
  let enabled = force === '1' || matchMedia('(pointer: coarse)').matches, keyboard = false;
  function releaseAll() {
    for (const id in btn) btn[id].release();
    if (stick.pid !== null) endStick();
    for (const k in count) { if (count[k]) { count[k] = 0; inp.release(k); } }
  }
  function setMode() {
    const on = enabled && !keyboard;
    if (on === CH.touchMode) return;
    CH.touchMode = on;
    memo.clear();
    root.classList.toggle('on', on);
    if (on) inp.touch = true;
    else releaseAll();
    layout();
    if (!on) window.dispatchEvent(new Event('resize'));
  }
  // a first touch turns them on; a real keyboard puts them away until the next touch
  window.addEventListener('touchstart', () => { enabled = true; keyboard = false; setMode(); }, { capture: true, passive: true });
  window.addEventListener('keydown', (e) => { if (force !== '1' && CH.touchMode && e.isTrusted) { keyboard = true; setMode(); } }, true);
  window.addEventListener('blur', releaseAll);
  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', () => setTimeout(layout, 120));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', layout);
  document.addEventListener('fullscreenchange', () => { btn.fs.paint(); layout(); });
  document.addEventListener('webkitfullscreenchange', () => { btn.fs.paint(); layout(); });
  // switching apps pauses the game, the way phone games do
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    releaseAll();
    if (CH.touchMode && CH.openPause && !ui.busy()) CH.openPause();
  });

  let muted = null;
  function frame() {
    requestAnimationFrame(frame);
    if (!CH.touchMode) return;
    const w = wanted(), sc = CH.game.scene;
    const name = sc ? sc.name || '' : '';
    let relayout = apply(w);
    if (name !== ctxName) { ctxName = name; relayout = true; }
    if (relayout) layout();
    // E bobs when there is something to use right here
    const ready = !!(w.e && sc && sc.hoverProp);
    if (ready !== btn.e.ready) { btn.e.ready = ready; btn.e.el.classList.toggle('ready', ready); }
    if (CH.audio.muted !== muted) { muted = CH.audio.muted; btn.mute.paint(); }
  }
  setMode();
  requestAnimationFrame(frame);
})(window.CH);
