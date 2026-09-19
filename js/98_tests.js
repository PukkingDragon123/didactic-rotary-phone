// Debug/test scenes (?test=name). Not part of the game flow.
(function (CH) {
  const gfx = CH.gfx;
  CH.TESTS = CH.TESTS || {};
  CH.TESTS.chubby1 = () => {
    const s = new CH.Scene();
    let t = 0;
    s.update = (dt) => { t += dt; };
    s.draw = (g) => {
      gfx.rect(0, 0, CH.W, CH.H, '#6b6270');
      for (let i = 0; i < 5; i++) gfx.vline(60 + i * 90, 0, CH.H, '#7a7180');
      g.save(); g.scale(4, 4);
      CH.drawChubby(g, 30, 62, { face: 'normal', arm: 'idle' });
      CH.drawChubby(g, 90, 62, { face: 'grin', arm: 'wave', flip: true });
      g.restore();
      gfx.text('ONE SPRITE AT 4X', 4, 8, '#fff', { font: 'small' });
    };
    return s;
  };
  CH.TESTS.chubby = () => {
    const s = new CH.Scene();
    const faces = ['normal', 'happy', 'grin', 'smug', 'sad', 'cry', 'shock', 'scared', 'worried', 'angry', 'annoyed', 'tired', 'exhausted', 'focused', 'determined', 'confused', 'love', 'sleep', 'proud', 'dead'];
    const outfits = ['hoodie', 'suit', 'uniform', 'janitor', 'pajamas'];
    s.draw = (g) => {
      gfx.rect(0, 0, CH.W, CH.H, '#6b6270');
      // expression grid
      faces.forEach((f, i) => {
        const x = 26 + (i % 10) * 47, y = 58 + Math.floor(i / 10) * 62;
        CH.drawChubby(g, x, y, { face: f, sleep: f === 'sleep', arm: 'pocket' });
        gfx.text(f, x, y + 5, '#e8e0c8', { align: 'center', font: 'small' });
      });
      // outfits
      outfits.forEach((o, i) => {
        const x = 30 + i * 46;
        CH.drawChubby(g, x, 200, { outfit: o, arm: i === 1 ? 'phone' : i === 3 ? 'mop' : 'idle', face: 'normal' });
        gfx.text(o, x, 205, '#e8e0c8', { align: 'center', font: 'small' });
      });
      // walk cycle + squash/stretch + poses
      for (let i = 0; i < 4; i++) CH.drawChubby(g, 250 + i * 40, 200, { walk: (i / 4) * Math.PI * 2, moving: 1, quillTilt: 0.8, jig: Math.sin(i) * 3 });
      CH.drawChubby(g, 410, 200, { sx: 1.3, sy: 0.72, face: 'shock' });
      CH.drawChubby(g, 450, 200, { sx: 0.82, sy: 1.22, face: 'determined', arm: 'both_up' });
      gfx.text('walk cycle / squash / stretch', 250, 205, '#e8e0c8', { font: 'small' });
      gfx.text('Hello, I am Chubby! 0123456789 $12.50', 4, 252, '#fff');
      gfx.text('SMALL: ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789', 4, 263, '#fff', { font: 'small' });
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
