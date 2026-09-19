// ============================================================================
// Main loop + boot
// ============================================================================
(function (CH) {
  const g = CH.g, gfx = CH.gfx;
  let last = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);
    let dt = (now - last) / 1000; last = now;
    if (dt > 1 / 30) dt = 1 / 30; // one clamped step per frame; input flags live through draw
    if (dt < 0.001) dt = 0.001;
    // pause: P anywhere, Esc only in the walk-around world (other scenes use
    // Esc for their own back action)
    const inp2 = CH.input;
    if (!CH.ui.busy() && CH.openPause) {
      const sc = CH.game.scene;
      const inWorld = CH.WorldScene && sc instanceof CH.WorldScene && !sc.locked;
      if (inp2.hit('pause') || (inWorld && inp2.hit('cancel'))) { inp2.eat(); CH.openPause(); }
    }
    CH.game.update(dt);
    // draw
    g.setTransform(1, 0, 0, 1, 0, 0);
    gfx.rect(0, 0, CH.W, CH.H, '#000');
    g.save();
    g.translate(CH.shake.x, CH.shake.y);
    CH.ui.cursor = 'arrow';
    CH.game.draw(g);
    g.restore();
    CH.ui.drawCursor(g);
    CH.input.endFrame();
    if (CH.DEBUG) gfx.text('fps ' + Math.round(1 / Math.max(dt, 0.001)), 2, CH.H - 8, '#0f0', { font: 'small' });
  }

  // test scenes via ?test=
  const params = new URLSearchParams(location.search);
  const test = params.get('test');
  if (test && CH.TESTS && CH.TESTS[test]) CH.game.set(CH.TESTS[test]());
  else if (params.get('scene') && CH.SCENES && CH.SCENES[params.get('scene')]) {
    CH.audio.unlock = () => {};
    if (params.get('load')) CH.load();
    CH.game.set(CH.SCENES[params.get('scene')]());
  } else if (window.CH_BOOT && CH.SCENES && CH.SCENES[window.CH_BOOT]) {
    CH.game.set(CH.SCENES[window.CH_BOOT]());
  } else if (CH.TitleScene) CH.game.set(new CH.TitleScene());
  requestAnimationFrame(frame);
})(window.CH);
