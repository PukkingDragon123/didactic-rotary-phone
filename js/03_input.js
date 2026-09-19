// ============================================================================
// Input: keyboard, mouse/touch in game coordinates
// ============================================================================
(function (CH) {
  const inp = (CH.input = {
    keys: {}, pressed: {}, released: {},
    mx: -100, my: -100, mdown: false, mpressed: false, mreleased: false, mmoved: false,
    rdown: false, rpressed: false,
    wheel: 0,
    typed: '', // text typed this frame (printable)
    lastKey: null,
    anyPressed: false,
    gamepadAxes: [0, 0],
    touch: false,
  });

  const canvas = CH.canvas;
  const KEYMAP = {
    ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
    a: 'left', d: 'right', w: 'up', s: 'down', A: 'left', D: 'right', W: 'up', S: 'down',
    ' ': 'jump', z: 'jump', Z: 'jump', x: 'action', X: 'action', j: 'jump', J: 'jump', k: 'action', K: 'action',
    e: 'interact', E: 'interact', Enter: 'confirm', Escape: 'cancel', Backspace: 'back', Tab: 'tab',
    Shift: 'run', q: 'menu', Q: 'menu', p: 'pause', P: 'pause', m: 'mute', M: 'mute', i: 'phone', I: 'phone',
    '1': 'n1', '2': 'n2', '3': 'n3', '4': 'n4', '5': 'n5', '6': 'n6', '7': 'n7', '8': 'n8', '9': 'n9', '0': 'n0',
  };
  window.addEventListener('keydown', (e) => {
    const k = KEYMAP[e.key];
    inp.lastKey = e.key;
    inp.anyPressed = true;
    if (k) {
      if (!inp.keys[k]) inp.pressed[k] = true;
      inp.keys[k] = true;
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) inp.typed += e.key;
    if (e.key === 'Backspace') inp.typed += '\b';
    if (e.key === 'Enter') inp.typed += '\n';
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Tab', 'Backspace'].includes(e.key)) e.preventDefault();
    inp.rawPressed = inp.rawPressed || {};
    inp.rawPressed[e.key] = true;
    CH.audio && CH.audio.unlock();
  });
  window.addEventListener('keyup', (e) => {
    const k = KEYMAP[e.key];
    if (k) { inp.keys[k] = false; inp.released[k] = true; }
  });
  window.addEventListener('blur', () => { inp.keys = {}; inp.mdown = false; });

  function toGame(e) {
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * CH.W;
    const y = ((e.clientY - r.top) / r.height) * CH.H;
    return [x, y];
  }
  canvas.addEventListener('mousemove', (e) => { const [x, y] = toGame(e); inp.mx = x; inp.my = y; inp.mmoved = true; });
  canvas.addEventListener('mousedown', (e) => {
    const [x, y] = toGame(e); inp.mx = x; inp.my = y;
    if (e.button === 2) { inp.rdown = true; inp.rpressed = true; }
    else { inp.mdown = true; inp.mpressed = true; }
    inp.anyPressed = true;
    CH.audio && CH.audio.unlock();
    e.preventDefault();
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 2) inp.rdown = false;
    else { if (inp.mdown) inp.mreleased = true; inp.mdown = false; }
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  canvas.addEventListener('wheel', (e) => { inp.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
  // touch → mouse
  canvas.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0]; const [x, y] = toGame(t);
    inp.mx = x; inp.my = y; inp.mdown = true; inp.mpressed = true; inp.anyPressed = true; inp.touch = true;
    CH.audio && CH.audio.unlock(); e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchmove', (e) => {
    const t = e.changedTouches[0]; const [x, y] = toGame(t); inp.mx = x; inp.my = y; inp.mmoved = true; e.preventDefault();
  }, { passive: false });
  canvas.addEventListener('touchend', (e) => { inp.mdown = false; inp.mreleased = true; e.preventDefault(); }, { passive: false });

  inp.down = (k) => !!inp.keys[k];
  inp.hit = (k) => !!inp.pressed[k];
  inp.up = (k) => !!inp.released[k];
  inp.rawHit = (k) => !!(inp.rawPressed && inp.rawPressed[k]);
  inp.axisX = () => (inp.down('left') ? -1 : 0) + (inp.down('right') ? 1 : 0);
  inp.axisY = () => (inp.down('up') ? -1 : 0) + (inp.down('down') ? 1 : 0);
  inp.mouseIn = (r) => CH.pointIn(inp.mx, inp.my, r);
  inp.clicked = (r) => inp.mpressed && inp.mouseIn(r);
  // consume all input for this frame (e.g. after a UI element handled a click)
  inp.eat = () => { inp.mpressed = false; inp.mreleased = false; inp.pressed = {}; inp.typed = ''; inp.rawPressed = {}; };
  inp.endFrame = () => {
    inp.pressed = {}; inp.released = {}; inp.mpressed = false; inp.mreleased = false; inp.rpressed = false;
    inp.mmoved = false; inp.wheel = 0; inp.typed = ''; inp.anyPressed = false; inp.rawPressed = {};
  };
})(window.CH);
