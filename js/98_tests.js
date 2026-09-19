// Debug/test scenes (?test=name). Not part of the game flow.
(function (CH) {
  const gfx = CH.gfx;
  CH.TESTS = CH.TESTS || {};
  CH.TESTS.chubby = () => {
    const s = new CH.Scene();
    const actors = [];
    const faces = ['normal', 'happy', 'sad', 'shock', 'tired', 'angry', 'worried', 'cry', 'sleep', 'dead'];
    const outfits = ['hoodie', 'suit', 'uniform', 'janitor', 'pajamas'];
    s.draw = (g) => {
      gfx.rect(0, 0, CH.W, CH.H, '#6e4523');
      g.save(); g.scale(2, 2);
      faces.forEach((f, i) => CH.drawChubby(g, 20 + i * 24, 40, { face: f, sleep: f === 'sleep' }));
      outfits.forEach((o, i) => CH.drawChubby(g, 20 + i * 28, 80, { outfit: o, arm: i === 1 ? 'phone' : i === 3 ? 'mop' : 'idle' }));
      // squash/stretch & walk
      for (let i = 0; i < 6; i++) CH.drawChubby(g, 20 + i * 26, 120, { walk: (i / 6) * Math.PI * 2, moving: 1, quillTilt: 0.8, jig: Math.sin(i) * 3 });
      CH.drawChubby(g, 190, 120, { sx: 1.3, sy: 0.7 }); CH.drawChubby(g, 215, 120, { sx: 0.8, sy: 1.25 });
      CH.drawChubby(g, 190, 80, { flip: true, outfit: 'suit', emote: '!' }); CH.drawChubby(g, 215, 80, { sitting: true, arm: 'controller', face: 'focused' });
      g.restore();
      gfx.text('Hello, I am Chubby! Quick brown fox jumps over the lazy dog. 0123456789 $12.50 ♥★→…', 4, 250, '#fff');
      gfx.text('SMALL FONT: ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 $.,!?:', 4, 260, '#fff', { font: 'small' });
    };
    return s;
  };
})(window.CH);
(function (CH) {
  const gfx = CH.gfx;
  CH.TESTS.critters = () => {
    const s = new CH.Scene();
    const makers = [CH.makeMom, CH.makeDoctor, (x, y) => CH.makeNurse(x, y, 0), (x, y) => CH.makeNurse(x, y, 1), CH.makeBrenda, CH.makeKevin, CH.makeTammy, CH.makeJorge, CH.makeDestiny];
    const npcs = makers.map((m, i) => m(30 + i * 40, 60));
    const custs = []; for (let i = 0; i < 12; i++) custs.push(CH.makeCustomer(20 + i * 38, 120));
    const poses = [Object.assign(CH.makeMom(30, 180), { pose: 'lying' }), Object.assign(CH.makeMom(120, 180), { pose: 'inbed' }), Object.assign(CH.makeDoctor(180, 180), { arm: 'clipboard' }), Object.assign(CH.makeBrenda(240, 180), { arm: 'hips', face: 'angry' }), Object.assign(CH.makeCustomer(300, 180), { pose: 'sit' }), Object.assign(CH.makeKevin(360, 180), { arm: 'tray', face: 'happy' }), Object.assign(CH.makeNurse(420, 180), { arm: 'wave', talk: true })];
    s.update = (dt) => { for (const n of [...npcs, ...custs, ...poses]) { n.walk += dt * 6; n.moving = 1; n.update(dt); } };
    s.draw = (g) => {
      gfx.rect(0, 0, CH.W, CH.H, '#b9c7c9');
      for (const n of [...npcs, ...custs, ...poses]) n.draw(g);
      CH.PROPS.hBed.draw(g, 90, 182, s.t, {});
    };
    return s;
  };
  CH.TESTS.props = () => {
    const s = new CH.WorldScene({ width: 480, floorY: 222 });
    s.drawRoom = (g) => CH.paintCabin(g, 480, 222);
    const names = ['bed', 'nightstand', 'poster', 'gameCases', 'tv', 'couch', 'coffeeTable', 'fireplace', 'bookshelf', 'plant', 'window', 'kitchenCounter', 'fridge', 'stove', 'table', 'chair', 'rockingChair', 'rotaryPhone', 'coatRack', 'boots', 'door', 'lamp', 'wallClock', 'moosePainting'];
    let x = 4;
    for (const n of names) { const d = CH.PROPS[n]; if (x + d.w > 476) break; s.addProp(n, x, n === 'poster' || n === 'wallClock' || n === 'moosePainting' || n === 'window' || n === 'rotaryPhone' ? 150 : 222); x += d.w + 4; }
    s.player.x = 240;
    return s;
  };
})(window.CH);
