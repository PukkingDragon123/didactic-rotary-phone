// Debug/test scenes (?test=name). Not part of the game flow.
(function (CH) {
  const gfx = CH.gfx;
  CH.TESTS = CH.TESTS || {};
  CH.TESTS.chubby1 = () => {
    const s = new CH.Scene();
    let t = 0;
    // A real 1x render, magnified with nearest-neighbour: this is the only
    // honest way to judge whether the glasses hold together at actual size.
    const pane = gfx.makeCanvas(60, 60);
    const pc = pane.getContext('2d');
    // crop: [sx, sy, sw, sh] inside the 60x60 pane, feet at (30, 52)
    const trueSize = (g, x, y, k, p, crop) => {
      const c = crop || [0, 0, 60, 60];
      pc.clearRect(0, 0, 60, 60);
      gfx.pushTarget(pc);
      CH.drawChubby(pc, 30, 52, Object.assign({ noShadow: true }, p));
      gfx.popTarget();
      g.save(); g.imageSmoothingEnabled = false;
      g.drawImage(pane, c[0], c[1], c[2], c[3], x, y, c[2] * k, c[3] * k);
      g.restore();
    };
    const HEAD = [16, 8, 28, 22];
    s.update = (dt) => { t += dt; };
    s.draw = (g) => {
      gfx.rect(0, 0, CH.W, CH.H, '#6b6270');
      for (let i = 0; i < 5; i++) gfx.vline(60 + i * 90, 0, CH.H, '#7a7180');
      // left: 1x pixels blown up 4x - what the player really sees
      trueSize(g, 2, 10, 7, { face: 'normal', arm: 'pocket' }, HEAD);
      trueSize(g, 202, 10, 7, { face: 'happy', arm: 'pocket' }, HEAD);
      trueSize(g, 2, 10 + 22 * 7 + 4, 3, { face: 'angry', arm: 'pocket' });
      trueSize(g, 62, 10 + 22 * 7 + 4, 3, { face: 'shock', arm: 'pocket' });
      gfx.text('TRUE 1X, ZOOMED 7X', 4, 4, '#fff', { font: 'small' });
      // right: drawn at 4x, where the shading is judged
      g.save(); g.scale(4, 4);
      CH.drawChubby(g, 105, 57, { face: 'grin', arm: 'wave' });
      g.restore();
      // the same sprite at the size players actually see, on a strip of floor
      gfx.rect(0, 232, CH.W, 20, '#4d4657');
      const poses = [
        { face: 'normal' }, { face: 'happy' }, { face: 'shock' },
        { face: 'angry' }, { face: 'sleep', sleep: true }, { face: 'normal', glasses: false },
        { face: 'grin', outfit: 'suit' }, { face: 'normal', outfit: 'uniform' },
      ];
      poses.forEach((q, i) => CH.drawChubby(g, 24 + i * 34, 246, Object.assign({ arm: 'pocket' }, q)));
      // dialogue portrait, in a box the size the dialogue uses
      ['normal', 'happy', 'sad', 'angry'].forEach((f, i) => {
        const bx = 316 + i * 40, by = 196;
        gfx.rrect(bx - 1, by - 1, 34, 36, 4, '#2a2233');
        gfx.rrect(bx, by, 32, 34, 3, '#3d3350');
        g.save(); g.beginPath(); g.rect(bx, by, 32, 34); g.clip();
        CH.ui.portraits.Chubby(g, bx + 16, by + 32, { opts: { face: f }, text: 'x', shown: 1 });
        g.restore();
      });
      gfx.text('1X (6th: glasses:false)', 4, 238, '#fff', { font: 'small' });
      gfx.text('portrait', 316, 236, '#fff', { font: 'small' });
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
    const FACE_LIST = ['normal', 'happy', 'warm', 'grin', 'proud', 'smug', 'sly', 'sad', 'cry', 'shock', 'scared', 'worried', 'angry', 'annoyed', 'bored', 'stern', 'tired', 'exhausted', 'sick', 'focused', 'determined', 'confused', 'love', 'dead', 'sleep', 'flat'];
    const ARMS = ['idle', 'hips', 'clipboard', 'tray', 'wave', 'point', 'hold', 'headset', 'crossed', 'pocket'];
    const cast = [
      ['Mom', CH.makeMom], ['Doctor', CH.makeDoctor], ['Nurse G', (x, y) => CH.makeNurse(x, y, 0)],
      ['Nurse R', (x, y) => CH.makeNurse(x, y, 1)], ['Brenda', CH.makeBrenda], ['Kevin', CH.makeKevin],
      ['Tammy', CH.makeTammy], ['Jorge', CH.makeJorge], ['Destiny', CH.makeDestiny],
    ];
    const npcs = cast.map(([n, mk], i) => mk(28 + i * 51, 112));
    const walkers = cast.map(([n, mk], i) => { const a = mk(28 + i * 51, 244); a.flip = i % 2 === 1; return a; });
    const custs = []; for (let i = 0; i < 20; i++) custs.push(CH.makeCustomer(26 + (i % 10) * 44, i < 10 ? 116 : 250));
    const faceGuy = CH.makeTammy(0, 0);
    const armGuy = CH.makeDoctor(0, 0);
    const momLie = Object.assign(CH.makeMom(64, 150), { pose: 'lying', outfit: 'gown', topColor: null });
    const momBed = Object.assign(CH.makeMom(190, 130), { pose: 'inbed', outfit: 'gown', topColor: null, face: 'tired' });
    const momBed2 = Object.assign(CH.makeMom(300, 130), { pose: 'inbed', outfit: 'gown', topColor: null, sleep: true });
    const sitters = [Object.assign(CH.makeCustomer(370, 150), { pose: 'sit' }), Object.assign(CH.makeJorge(430, 150), { pose: 'sit', flip: true })];
    const all = [...npcs, ...walkers, ...custs, momLie, momBed, momBed2, ...sitters];
    const PAGES = 7;
    s.update = (dt) => {
      for (const n of all) n.update(dt);
      for (const n of walkers) { n.walk += dt * 7; n.moving = 1; }
      faceGuy.update(dt); armGuy.update(dt);
    };
    const label = (txt, x, y) => gfx.text(txt, x, y, '#2e3a3c', { align: 'center', font: 'small' });
    s.draw = (g) => {
      const page = Math.floor(s.t / 2.6) % PAGES;
      gfx.rect(0, 0, CH.W, CH.H, '#b9c7c9');
      for (let i = 0; i < 12; i++) gfx.vline(i * 40, 0, CH.H, '#b1c0c2');
      if (page === 0) {
        gfx.text('CAST - idle / walking', 4, 4, '#2e3a3c', { font: 'small' });
        npcs.forEach((n, i) => { n.draw(g); label(cast[i][0], n.x, n.y + 3); });
        walkers.forEach((n, i) => n.draw(g));
        gfx.text('walk cycle', 4, 248, '#2e3a3c', { font: 'small' });
      } else if (page === 1 || page === 2) {
        const set = page === 1 ? [0, 1, 4, 5] : [6, 7, 8, 2];
        gfx.text('DETAIL 2.4x', 4, 4, '#2e3a3c', { font: 'small' });
        set.forEach((k, i) => {
          const n = npcs[k];
          g.save(); g.translate(60 + i * 120, 246); g.scale(2.4, 2.4);
          CH.drawCritter(g, 0, 0, n.params({ moving: 0, walk: 0 }));
          g.restore();
          gfx.text(cast[k][0], 60 + i * 120, 252, '#2e3a3c', { align: 'center', font: 'small' });
        });
      } else if (page === 3) {
        gfx.text('EXPRESSIONS', 4, 4, '#2e3a3c', { font: 'small' });
        FACE_LIST.forEach((f, i) => {
          const col = i % 9, row = Math.floor(i / 9);
          const x = 26 + col * 52, y = 82 + row * 62;
          CH.drawCritter(g, x, y, faceGuy.params({ face: f, sleep: f === 'sleep', arm: 'pocket', moving: 0, walk: 0, blink: false }));
          label(f, x, y + 3);
        });
      } else if (page === 4) {
        gfx.text('POSES + ARMS', 4, 4, '#2e3a3c', { font: 'small' });
        ARMS.forEach((a, i) => {
          const x = 27 + i * 46, y = 96;
          CH.drawCritter(g, x, y, armGuy.params({ arm: a, moving: 0, walk: 0, face: 'normal' }));
          label(a, x, y + 3);
        });
        CH.PROPS.hBed.draw(g, 160, 152, s.t, {});
        momLie.draw(g); label('lying', 64, 158);
        momBed.draw(g); label('inbed', 190, 158);
        momBed2.draw(g); label('inbed sleep', 300, 158);
        sitters.forEach((n) => n.draw(g)); label('sit', 370, 158); label('sit', 430, 158);
        CH.drawCritter(g, 60, 246, Object.assign(npcs[4].params({ moving: 0, walk: 0 }), { talk: true, face: 'angry' }));
        label('talk/angry', 60, 252);
        CH.drawCritter(g, 140, 246, Object.assign(npcs[0].params({ moving: 0, walk: 0 }), { face: 'cry', emote: '?' }));
        label('cry/emote', 140, 252);
        CH.drawCritter(g, 220, 246, Object.assign(npcs[5].params({ moving: 0, walk: 0 }), { face: 'scared', sweat: 1 }));
        label('sweat', 220, 252);
        CH.drawCritter(g, 300, 246, Object.assign(npcs[8].params({ moving: 0, walk: 0 }), { sleep: true }));
        label('sleep', 300, 252);
        CH.drawCritter(g, 380, 246, Object.assign(npcs[6].params({ moving: 0, walk: 0 }), { face: 'love', fx: 'heart' }));
        label('love', 380, 252);
      } else if (page === 5) {
        gfx.text('RANDOM CUSTOMERS', 4, 4, '#2e3a3c', { font: 'small' });
        custs.forEach((n) => n.draw(g));
      } else {
        // dialogue portraits, in a box the same size the dialogue uses
        gfx.text('PORTRAITS (32x34 dialogue box)', 4, 4, '#2e3a3c', { font: 'small' });
        const names = ['Mom', 'Doctor', 'Nurse', 'Brenda', 'Kevin', 'Tammy', 'Jorge', 'Destiny'];
        const fakes = ['normal', 'happy', 'angry', 'sad'];
        names.forEach((nm, i) => {
          const port = CH.ui.portraits[nm];
          fakes.forEach((f, j) => {
            const bx = 18 + i * 56, by = 26 + j * 56;
            gfx.rrect(bx - 1, by - 1, 34, 36, 4, '#2a2233');
            gfx.rrect(bx, by, 32, 34, 3, '#3d3350');
            g.save(); g.beginPath(); g.rect(bx, by, 32, 34); g.clip();
            port(g, bx + 16, by + 32, { opts: { face: f }, text: 'x', shown: 1 });
            g.restore();
            if (j === 3) gfx.text(nm, bx + 16, by + 37, '#2e3a3c', { align: 'center', font: 'small' });
          });
        });
      }
      gfx.text('page ' + (page + 1) + '/' + PAGES, 476, 4, '#2e3a3c', { align: 'right', font: 'small' });
    };
    return s;
  };
  // Zoomed inspector: ?test=propzoom#couch,coffeeTable  (3x, on a cabin floor)
  CH.TESTS.propzoom = () => {
    const s = new CH.Scene();
    const names = (location.hash || '#couch').slice(1).split(',');
    s.update = () => {};
    s.draw = (g) => {
      CH.paintCabin(g, CH.W, 222);
      g.save(); g.scale(3, 3);
      gfx.pushTarget(g);
      let x = 4;
      for (const n of names) {
        const d = CH.PROPS[n]; if (!d) continue;
        d.draw(g, x, 88, s.t, {});
        x += d.w + 6;
      }
      CH.drawChubby(g, x + 14, 88, { face: 'normal' });
      gfx.popTarget();
      g.restore();
    };
    return s;
  };
  CH.TESTS.props = () => {
    const s = new CH.WorldScene({ width: 1720, floorY: 222 });
    s.drawRoom = (g) => CH.paintCabin(g, 1720, 222);
    const floorNames = ['bed', 'nightstand', 'gameCases', 'beanbag', 'tv', 'console', 'couch', 'coffeeTable', 'fireplace', 'logs', 'bookshelf', 'plant', 'kitchenCounter', 'fridge', 'stove', 'table', 'chair', 'rockingChair', 'coatRack', 'boots', 'door', 'bathroomDoor', 'lamp', 'trashBin', 'radiator', 'laundry', 'cans', 'hockeyStick', 'snowshoes'];
    const wallNames = ['poster', 'window', 'rotaryPhone', 'wallClock', 'moosePainting', 'calendar', 'flag', 'thermostat'];
    let x = 8;
    for (const n of floorNames) {
      const d = CH.PROPS[n];
      s.addProp(n, x, 222, { st: n === 'plant' ? { variant: 0 } : {} });
      x += d.w + 10;
    }
    let wx = 8;
    for (const n of wallNames) {
      const d = CH.PROPS[n];
      s.addProp(n, wx, 150, { st: n === 'poster' ? { variant: 0 } : {} });
      wx += d.w + 22;
    }
    s.player.x = 120;
    return s;
  };
})(window.CH);
