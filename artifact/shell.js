// Cabinet shell for the published build: iframe focus, touch controls, pause on hide.
(function () {
  var KEYS = { pad_left: 'ArrowLeft', pad_right: 'ArrowRight', pad_up: 'ArrowUp', pad_down: 'ArrowDown', btn_jump: ' ', btn_use: 'e' };
  function send(type, key) { window.dispatchEvent(new KeyboardEvent(type, { key: key, bubbles: true })); }

  // Keyboard events only reach a focused frame, so take focus on any pointer down.
  window.addEventListener('pointerdown', function () { try { window.focus(); } catch (e) {} }, true);
  try { window.focus(); } catch (e) {}

  var touch = matchMedia('(hover: none) and (pointer: coarse)').matches;
  var pad = document.getElementById('pad');
  if (!touch) { pad.remove(); return; }
  document.body.classList.add('is-touch');

  Object.keys(KEYS).forEach(function (id) {
    var el = document.getElementById(id);
    var held = false;
    function down(e) { e.preventDefault(); if (held) return; held = true; el.classList.add('on'); send('keydown', KEYS[id]); }
    function up(e) { if (!held) return; if (e) e.preventDefault(); held = false; el.classList.remove('on'); send('keyup', KEYS[id]); }
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
    window.addEventListener('blur', function () { up(null); });
  });
})();
