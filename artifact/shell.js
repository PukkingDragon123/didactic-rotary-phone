// Cabinet shell for the published build: keep keyboard focus on the game frame.
// (The touch controls live in the game itself now: js/42_touch.js.)
(function () {
  // Keyboard events only reach a focused frame, so take focus on any pointer down.
  window.addEventListener('pointerdown', function () { try { window.focus(); } catch (e) {} }, true);
  try { window.focus(); } catch (e) {}
})();
