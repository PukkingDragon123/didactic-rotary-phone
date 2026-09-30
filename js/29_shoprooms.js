// ============================================================================
// SHOP ROOMS - the inside of every business on Main Street
//
// Each room is a full, lived-in space: its own walls, floor and ceiling, its
// own fixtures stocked with hand-drawn goods, lamps and daylight, a window
// onto the snowy street, small moving details, and a customer or two who is
// there for their own reasons. Built on the interior kit (29_interiors.js).
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, PX = CH.PIX, K = CH.IK, ui = CH.ui, S = CH.state;
  const R = gfx.rect, P1 = gfx.px, HL = gfx.hline, VL = gfx.vline, E = gfx.ellipse, mix = gfx.mix, sh = gfx.shade;
  const F = 214, W = 524;
  const ROOMS = (CH.SHOP_ROOMS = {});
  const rng = K.rng, withA = K.withA;
  const draw = (n, x, y, o) => PX.draw(n, x, y, o);

  // ==========================================================================
  // SHARED SPRITES
  // ==========================================================================
  PX.def('register', { k: '#3a2410', d: '#8a5a1c', m: '#c8922f', l: '#e8b84a', h: '#fff0a0', g: '#3ad6a0' }, [
    '...kkkkkkkk.....',
    '...kgggggggk....',
    '...kkkkkkkkk....',
    '..kmmmmmmmmmk...',
    '.kmlhkhkhkhlmk..',
    '.kmlkhkhkhklmk..',
    'kmmmmmmmmmmmmmk.',
    'kdddddddddddddk.',
    'kmmmmmkkkmmmmmk.',
    'kdddddddddddddk.',
    '.kkkkkkkkkkkkk..',
  ], { ax: 7, ay: 11 });
  PX.def('deskBell', { k: '#3a3440', d: '#8a8f9c', m: '#c8ccd8', l: '#f4f6fa' }, [
    '...k...', '..kmk..', '.kmllk.', 'kmmmmdk', 'kkkkkkk',
  ], { ax: 3, ay: 5 });
  PX.def('tipJar', { k: '#2a3440', g: '#c8dce8', G: '#f0f8fc', y: '#f5c33b', c: '#6aa05a' }, [
    '.kkkkk.', 'kGgggGk', 'kgcyggk', 'kgyycgk', 'kgcyygk', '.kkkkk.',
  ], { ax: 3, ay: 6 });

  // ---- toys -------------------------------------------------------------------
  PX.def('teddy', { k: '#3a2010', d: '#8a5424', m: '#b87a3a', l: '#d8a060', h: '#f0c890', n: '#2a1a10', e: '#1a1010', r: '#d8263a' }, [
    '.kk......kk.',
    'kdmk....kmdk',
    'kmmkkkkkkmmk',
    '.kmllllllmk.',
    'kmlelllleldk',
    'kmllhhhhlldk',
    '.kmlhnnhldk.',
    '..kkmllmkk..',
    '.kmrrrrrrmk.',
    'kmmllhhllmmk',
    'kdmlhhhhlmdk',
    'kdmllhhllmdk',
    '.kdmmkkmmdk.',
    '.khhk..khhk.',
    '..kk....kk..',
  ], { ax: 6, ay: 15 });
  PX.def('bunny', { k: '#3a2a30', d: '#b8a8b0', m: '#e8dce4', l: '#f8f2f6', h: '#ffffff', p: '#f0a0b8', n: '#d86a8a', e: '#1a1010', r: '#6aa0d8' }, [
    '..kk....kk..',
    '.kmk....kmk.',
    '.kpk....kpk.',
    '.kmk....kmk.',
    '.kmmkkkkmmk.',
    '.kmllllllmk.',
    'kmlelllleldk',
    'kmllhhhhlldk',
    '.kmlhnnhldk.',
    '..kkmllmkk..',
    '.kmrrrrrrmk.',
    'kmmllhhllmmk',
    'kdmlhhhhlmdk',
    '.kdmmkkmmdk.',
    '.khhk..khhk.',
    '..kk....kk..',
  ], { ax: 6, ay: 16 });
  PX.def('robot', { k: '#1e2230', d: '#5a6a8a', m: '#8aa0c0', l: '#b8c8e0', h: '#e8f0fa', y: '#ffe060', r: '#e05a4a', b: '#4ac8e8' }, [
    '......k.....',
    '.....krk....',
    '......k.....',
    '...kkkkkkk..',
    '...khlllmk..',
    '...klylymk..',
    '...kldkdmk..',
    '..kkkkkkkkk.',
    '.kmkhlllmkmk',
    '.kmklrbrmkmk',
    '.kkkllllmkkk',
    '...kmmmmmk..',
    '...kdk.kdk..',
    '..kkkk.kkkk.',
  ], { ax: 6, ay: 14 });
  PX.def('duck', { k: '#5a3a08', y: '#ffd83a', h: '#fff4a0', d: '#e0a020', e: '#1a1010', o: '#f07a2a', O: '#c8501a' }, [
    '...kkk....',
    '..kyyyk...',
    '..kyeykoo.',
    '..kyyykOk.',
    'k.kkyyyk..',
    'kykyyyyyk.',
    'kyyyyhyyyk',
    'kdyyyyyydk',
    '.kddddddk.',
    '..kkkkkk..',
  ], { ax: 5, ay: 10 });
  PX.def('frog', { k: '#1a3a12', g: '#4aa03a', l: '#8ad05a', d: '#2a6a24', y: '#f0e070', e: '#1a1010' }, [
    '..kk...kk..',
    '.kgek.kegk.',
    '.kgggkgggk.',
    'kgllllllggk',
    'kgyyyyyyggk',
    'kdgyyyyygdk',
    'kkdgkkkgdkk',
    'k.kk...kk.k',
  ], { ax: 5, ay: 8 });
  PX.def('top', { k: '#3a1a20', r: '#e05a4a', h: '#ff9a80', b: '#4a8ad8', y: '#ffd84a' }, [
    '....k....',
    '...krk...',
    '.kkrrrkk.',
    'krrhrrrrk',
    'kbbbbbbbk',
    '.kyyyyyk.',
    '..kyyyk..',
    '...kyk...',
    '....k....',
  ], { ax: 4, ay: 9 });
  PX.def('drum', { k: '#3a1a10', w: '#f4eee4', h: '#ffffff', r: '#d8263a', y: '#ffd84a', d: '#8a1a1a' }, [
    '.kkkkkkkk.',
    'kwwwwhwwwk',
    'kkkkkkkkkk',
    'kryrrrryrk',
    'krryrryrrk',
    'krrryyrrrk',
    'kddddddddk',
    '.kkkkkkkk.',
  ], { ax: 5, ay: 8 });
  PX.def('rocket', { k: '#2a2030', w: '#f4f0ea', b: '#4ac8e8', r: '#e05a4a', o: '#ffb43a' }, [
    '...k...',
    '..kwk..',
    '..kwk..',
    '.kwwwk.',
    '.kwbwk.',
    '.kwwwk.',
    '.kwrwk.',
    '.kwwwk.',
    'kkwwwkk',
    'krkwkrk',
    'krkkkrk',
    'kk.o.kk',
    '...o...',
  ], { ax: 3, ay: 13 });
  PX.def('blocks', { k: '#2a2030', y: '#ffd84a', h: '#fff4a0', r: '#e05a4a', b: '#4a8ad8', d: '#8a3a2a' }, [
    '...kkkkkkk...',
    '...kyyhyyk...',
    '...kyykyyk...',
    '...kykykyk...',
    '...kykkkyk...',
    '...kykykyk...',
    'kkkkkkkkkkkkk',
    'krrhrrkbbhbbk',
    'krkkrrkbkkkbk',
    'krkrkrkbkbbbk',
    'krkkrrkbkkkbk',
    'kdrrrdkdbbbdk',
    'kkkkkkkkkkkkk',
  ], { ax: 6, ay: 13 });
  PX.def('kite', { k: '#2a2030', r: '#e05a4a', y: '#ffd84a' }, [
    '.....k.....',
    '....krk....',
    '...krrrk...',
    '..krrkrrk..',
    '.krrrkrrrk.',
    'kyyyykyyyyk',
    '.kyyykyyyk.',
    '..kyykyyk..',
    '...kykyk...',
    '....kkk....',
    '.....k.....',
  ], { ax: 5, ay: 0 });
  PX.def('trainEngine', { k: '#1e1418', d: '#3a3440', r: '#d8263a', l: '#f06a5a', y: '#ffd84a', w: '#3a3440', m: '#c8ccd8' }, [
    '..........kkk.....',
    '..........kdk.....',
    '.kkkkkkk..kdk.....',
    '.krrrrrk.kkkkkk...',
    '.kryyyrk.krrrrrk..',
    '.krrrrrkkrrlrrrrk.',
    '.krrrrrrrrrrrrrrk.',
    'kkkkkkkkkkkkkkkkkk',
    'kyyyyyyyyyyyyyyyyk',
    '..kkk...kkk..kkk..',
    '.kwmwk.kwmwk.kwmwk',
    '..kkk...kkk...kkk.',
  ], { ax: 9, ay: 12 });
  PX.def('trainCar', { k: '#1e1418', b: '#4a8ad8', g: '#4aa03a', c: '#ffd84a', h: '#fff4a0', d: '#c8961e', w: '#3a3440', m: '#c8ccd8' }, [
    '..kkkk..kkk...',
    '.kbbbbk.kggk..',
    'kkkkkkkkkkkkkk',
    'kcccccccccccdk',
    'kchccccccccddk',
    'kkkkkkkkkkkkkk',
    '..kkk....kkk..',
    '.kwmwk..kwmwk.',
    '..kkk....kkk..',
  ], { ax: 7, ay: 9 });
  PX.def('gumball', { k: '#2a1a20', g: '#d8ecf4', G: '#ffffff', r: '#d8263a', R: '#f06a5a', d: '#8a1a1a', y: '#ffd84a', b: '#4a8ad8', p: '#e05a9a', n: '#4aa03a' }, [
    '....kkkk....',
    '..kkrRRrkk..',
    '.kGgrygbgGk.',
    'kGgpgrgnybgk',
    'kgybgpgrggyk',
    'kgrgnybgpgbk',
    '.kgybgrgygk.',
    '..kkkkkkkk..',
    '...krRRrk...',
    '...krrrrk...',
    '...krkkrk...',
    '...krrrrk...',
    '...kdyydk...',
    '...krrrrk...',
    '...krrrrk...',
    '..kkrrrrkk..',
    '..krrrrrrk..',
    '..kddddddk..',
    '..kkkkkkkk..',
  ], { ax: 6, ay: 19 });
  PX.def('plane', { k: '#5a5a6a', w: '#ffffff', s: '#d8dce8' }, [
    'k.......', 'kwk.....', 'kswwwk..', '.kkswwwk', '...kkkk.',
  ], { ax: 4, ay: 0 });

  // ==========================================================================
  // SHARED ROOM PARTS
  // ==========================================================================
  // paint once into a canvas, then draw it every frame for free
  const cached = (w, h, ax, ay, fn) => {
    let c = null;
    return (g, x, y) => {
      if (!c) {
        c = gfx.makeCanvas(w, h);
        const cc = c.getContext('2d');
        gfx.pushTarget(cc); cc.translate(ax, ay); fn(); gfx.popTarget();
      }
      g.drawImage(c, Math.round(x) - ax, Math.round(y) - ay);
    };
  };
  K.cached = cached;
  // product boxes on a shelf: coloured cartons with labels
  K.boxes = (x, y, w, seed, cols, o = {}) => {
    const r = rng(seed);
    let xx = x;
    while (xx < x + w - 4) {
      const bw = Math.min(r.int(o.minW || 5, o.maxW || 9), x + w - xx), bh = r.int(o.minH || 6, o.maxH || 10), c = r.pick(cols), m = K.ramp(c);
      R(xx, y - bh, bw, bh, m.m); VL(xx, y - bh, bh, m.l); VL(xx + bw - 1, y - bh, bh, m.d); HL(xx, y - bh, bw, m.h);
      R(xx + 1, y - bh + 2, bw - 2, 2, o.label || '#f6f2e6'); P1(xx + 1, y - bh + 2, m.d);
      if (bh > 7) HL(xx + 1, y - 3, bw - 2, m.d);
      VL(xx + bw, y - bh, bh, '#140c10');
      xx += bw + 1;
    }
  };
  // a row of book spines, with the odd one lying flat or leaning
  K.books = (x, y, w, seed, cols, o = {}) => {
    const r = rng(seed);
    let xx = x;
    while (xx < x + w - 2) {
      if (r.chance(0.08) && xx < x + w - 12) {
        // a little pile lying flat
        const n = r.int(2, 4);
        for (let i = 0; i < n; i++) { const c = r.pick(cols), bw = r.int(9, 12); R(xx + r.int(0, 1), y - 3 * (i + 1), bw, 3, c); HL(xx, y - 3 * (i + 1), bw, sh(c, 24)); HL(xx + 1, y - 3 * (i + 1) + 1, bw - 3, '#f4ecd8'); }
        xx += 13; continue;
      }
      const bw = r.int(2, 4), bh = r.int(o.minH || 9, o.maxH || 14), c = r.pick(cols);
      const lean = r.chance(0.06) && xx > x + 3;
      if (lean) { for (let j = 0; j < bh; j++) HL(xx + Math.round((bh - j) * 0.3), y - j - 1, bw, j === bh - 1 ? sh(c, 24) : c); xx += bw + 4; continue; }
      R(xx, y - bh, bw, bh, c);
      VL(xx, y - bh, bh, sh(c, 22));
      if (bw > 2) VL(xx + bw - 1, y - bh, bh, sh(c, -20));
      HL(xx, y - bh + 2, bw, r.chance(0.5) ? '#f5c33b' : sh(c, 40));
      if (bh > 10) HL(xx, y - 4, bw, sh(c, 40));
      if (r.chance(0.3)) P1(xx + (bw >> 1), y - bh + 5, '#f4ecd8');
      xx += bw;
    }
  };

  // the way out: a panelled door with glass onto the street and a shop bell
  const doorArt = (wood, glass) => cached(40, 70, 4, 66, () => {
    const m = K.ramp(wood);
    R(-3, -62, 36, 62, m.dd); HL(-3, -62, 36, m.d);
    R(0, -58, 30, 58, m.m); VL(0, -58, 58, m.l); VL(29, -58, 58, m.d);
    // glass with the street behind it
    R(3, -54, 24, 24, '#140c10');
    gfx.cur.drawImage(K.viewCanvas('street', 22, 22, { seed: 21 }), 4, -53);
    K.windowFrame(4, -53, 22, 22, { frame: wood, cols: 1, rows: 1, thick: 2, sill: false });
    // panels
    for (const py of [-26, -14]) { R(4, py, 22, 10, m.d); HL(4, py, 22, m.dd); HL(4, py + 9, 22, m.l); R(6, py + 2, 18, 6, m.m); }
    // push plate, kick plate, handle
    R(24, -34, 3, 7, '#c8ccd8'); VL(24, -34, 7, '#f4f6fa'); P1(26, -28, '#8a8f9c');
    R(1, -5, 28, 4, '#b8922f'); HL(1, -5, 28, '#e8c05a');
    // the bell that rings when you come in
    VL(15, -62, 3, '#3a3440'); E(15, -57, 3, 2, '#e8b84a'); HL(13, -56, 5, '#fff0a0'); P1(15, -55, '#8a5a1c');
    // an OPEN sign hanging on the glass, seen from behind
    R(8, -47, 14, 6, '#f6f2e6'); gfx.text('NEPO', 15, -46, '#c8352b', { align: 'center', font: 'tiny' }); VL(10, -52, 5, '#3a3440'); VL(19, -52, 5, '#3a3440');
    K.band(-3, -1, 36, 2, '#140c10', 0.3);
  });

  // the board over the counter with the shop's name on it
  const nameBoard = (cx, y, sh0, o = {}) => {
    const name = sh0.name, w = gfx.textWidth(name, 'small') + 18, x = Math.round(cx - w / 2);
    const bg = o.bg || sh(sh0.accent, -34), m = K.ramp(bg);
    VL(x + 5, y - 10, 10, '#3a3440'); VL(x + w - 6, y - 10, 10, '#3a3440');
    R(x - 1, y - 1, w + 2, 18, '#140c10');
    R(x, y, w, 16, m.m); HL(x, y, w, m.h); HL(x, y + 1, w, m.l); HL(x, y + 15, w, m.dd);
    R(x + 2, y + 3, w - 4, 10, m.d); R(x + 3, y + 4, w - 6, 8, m.m);
    gfx.text(name, cx + 1, y + 5, sh(bg, -40), { align: 'center', font: 'small' });
    gfx.text(name, cx, y + 4, o.ink || '#ffe9a8', { align: 'center', font: 'small' });
    P1(x + 3, y + 3, '#ffe9a8'); P1(x + w - 4, y + 3, '#ffe9a8');
  };
  K.nameBoard = nameBoard;

  // ==========================================================================
  // THE ROOM PAINTER + BUILDER (used by ShopScene)
  // ==========================================================================
  CH.paintShopRoom = (scene, room) => {
    const sh0 = scene.shop;
    K.ceiling(W, 46, room.ceil[0], room.ceil[1]);
    room.walls(sh0, scene);
    K.crown(0, 44, W, room.crown || '#8a5a2b');
    room.floor(sh0, scene);
    // the exit
    (room._door || (room._door = doorArt(room.doorWood || '#8a5a2b')))(gfx.cur, 14, F);
    room.paint(sh0, scene);
    if (room.board !== false) nameBoard(room.boardX || 416, room.boardY || 72, sh0, room.boardStyle || {});
  };
  CH.buildShopRoom = (scene, room) => {
    const sh0 = scene.shop;
    // the window onto the street, drawn live so the snow falls past it
    const wo = Object.assign({ kind: 'street', x: 52, y: 104, w: 80, h: 60, seed: 3, cols: 2, rows: 2 }, room.window || {});
    let over = null;
    const MX = 26, MT = 20, MB = 40;
    scene.addCustom((g, x, y, t) => {
      K.view(wo.kind, g, wo.x, wo.y, wo.w, wo.h, t, { seed: wo.seed, lake: wo.lake });
      if (!over) {
        over = gfx.makeCanvas(wo.w + MX * 2, wo.h + MT + MB);
        const c = over.getContext('2d');
        gfx.pushTarget(c); c.translate(MX - wo.x, MT - wo.y);
        K.windowFrame(wo.x, wo.y, wo.w, wo.h, wo);
        if (wo.deco) wo.deco(wo.x, wo.y, wo.w, wo.h);
        gfx.popTarget();
      }
      g.drawImage(over, wo.x - MX, wo.y - MT);
      if (wo.live) wo.live(g, t, scene);
    }, wo.x, wo.y + wo.h, wo.w, wo.h, { id: 'window', anim: true, hint: 'Window', range: 26, interact: () => ui.say('Chubby', room.windowLine || "Main Street, going about its business. {p}Snow on everything.", { face: 'normal' }) });
    // the counter, in front so the keeper stands behind it
    const co = Object.assign({ wood: '#6b4630', top: '#8a5a3a', x: 356, w: 120, h: 30 }, room.counter || {});
    const counterArt = cached(co.w + 12, co.h + 40, 6, co.h + 34, () => {
      const top = K.counter(0, 0, co.w, co.h, co.wood, { top: co.top, stripe: co.stripe });
      if (co.front) co.front(0, 0, co.w, co.h);
      if (co.register !== false) draw('register', co.w - 22, top);
      draw('deskBell', 18, top);
      if (co.items) co.items(0, top, co.w);
    });
    scene.addCustom((g, x, y) => counterArt(g, x, y), co.x, F, co.w, co.h + 4, { id: 'counter', layer: 'front', anim: false });
    // the keeper
    const kp = sh0.keeper;
    scene.keeper = new CH.NPC(Object.assign({ name: kp.name, species: kp.species, outfit: kp.outfit, x: co.x + 60, y: F - 12, speed: 10 }, room.keeperLook || {}));
    scene.keeper.wanderRange = [co.x + 26, co.x + co.w - 24];
    scene.addNPC(scene.keeper);
    scene.addCustom(() => {}, co.x + 10, F, co.w - 20, 40, { id: 'keeperZone', anim: false, hint: kp.name, range: 60, promptY: F - 58, interact: () => scene.talkToKeeper() });
    // the way out
    scene.addCustom(() => {}, 14, F, 30, 56, { id: 'door', anim: false, hint: 'Back to the street', range: 24, interact: () => scene.leave() });
    // moving details
    for (const L of room.live || []) scene.addCustom((g, x, y, t) => L.draw(g, t, scene), L.x || 0, L.y || F, L.w || 10, L.h || 10, { id: L.id || 'live', anim: true, layer: L.layer || 'back' });
    // things worth a look
    for (const ex of room.extras || []) {
      const st = { i: 0 };
      scene.addCustom(() => {}, ex.x, F, ex.w || 30, 40, { id: 'ex_' + ex.hint, anim: false, hint: ex.hint, range: ex.range || 22, promptY: ex.promptY || F - 64, interact: () => { const l = ex.lines[st.i % ex.lines.length]; st.i++; return ui.say('Chubby', l, { face: ex.face || 'normal' }); } });
    }
    // customers: who is in today is seeded on the day
    const cr = rng(S.day * 131 + sh0.id.length * 17 + sh0.id.charCodeAt(0));
    const pool = (room.customers || []).slice();
    const n = Math.min(pool.length, room.crowd || 2);
    for (let i = 0; i < n; i++) {
      const c = pool.splice(cr.int(0, pool.length - 1), 1)[0];
      const npc = new CH.NPC(Object.assign({ name: c.name, species: c.species, outfit: c.outfit, x: c.x, y: F + (c.dy || 0), speed: c.speed || 9, height: c.height || 1 }, c.look || {}));
      if (c.range) npc.wanderRange = [c.x - c.range, c.x + c.range];
      if (c.pose) npc.pose = c.pose;
      if (c.arm) npc.arm = c.arm;
      npc.flip = !!c.flip;
      if (c.seat) { const base = CH.NPC.prototype.draw; npc.draw = function (g) { base.call(this, g, 0, 0, { noShadow: true }); }; npc.noDance = true; }
      scene.addNPC(npc);
      const st = { i: 0 };
      scene.addCustom(() => {}, c.x - 14, F, 28, 40, {
        id: 'cust_' + c.name, anim: false, hint: c.name, range: 20, promptY: F - 50 + (c.dy || 0),
        interact: () => (function* () {
          npc.face = 'happy';
          yield ui.say(c.name, c.lines[st.i % c.lines.length], { voice: 'blip' });
          st.i++; npc.face = c.look && c.look.face || 'normal';
        })(),
      });
    }
    // light: an ambient tint, lamp pools, and daylight through the glass
    scene.ambient = room.ambient || { color: '#6a5a8a', alpha: 0.12 };
    for (const L of room.lights || []) scene.addLight(Object.assign({}, L, { alpha: (L.alpha || 0.1) * 0.75 }));
    const p = CH.skyAt ? CH.skyAt(S.hour || 9) : null;
    if (p && !p.night) {
      // daylight streams through the glass and lands on the floor
      const h = S.hour || 9, warm = h < 9 || h > 15.5;
      scene.addLight({ x: wo.x + wo.w / 2, y: wo.y + 6, shaft: [wo.w * 0.7, F - wo.y + 4, h < 12 ? 44 : 26], color: warm ? '#ffc870' : '#ffe0a0', alpha: warm ? 0.24 : 0.2 });
      scene.addLight({ x: wo.x + wo.w / 2 + (h < 12 ? 44 : 26), y: F + 6, rx: wo.w * 0.5, ry: 8, color: warm ? '#ffe2b0' : '#fff6e0', alpha: 0.08 });
    }
    // the room is indoors: no wind, but things can still be kicked
    scene.windScale = 0;
    (room.loose || []).forEach(([k, c, x], i) => scene.addBody(k, x || 150 + i * 46, { color: c }));
    scene.minX = 34; scene.maxX = 496;
  };

  // ==========================================================================
  // 1. PINECONE TOYS
  // ==========================================================================
  ROOMS.toys = {
    ceil: ['tin', '#e8d4b0'], crown: '#9a5a2b', doorWood: '#9a4a2a',
    walls() {
      K.wallpaper(0, 51, W, F - 51, '#f2dcb0', 'star', { a: '#d8704a', b: '#78a860', sx: 18, sy: 16 });
      K.beadboard(0, F - 52, W, 52, '#b8452f');
      K.baseboard(0, F, W, '#7a3a20');
    },
    floor() { K.floorPlanks(F, W, CH.H - F, '#b07a44', 21); K.rug(250, F + 6, 96, 12, '#4a7ab0', '#ffd84a'); },
    paint() {
      // bunting right across the room, and paper planes on threads
      K.garland(0, 180, 58, 7, 'flags', ['#e05a4a', '#ffd84a', '#4a8ad8', '#6aa05a']);
      K.garland(180, 360, 58, 7, 'flags', ['#4a8ad8', '#6aa05a', '#e05a4a', '#ffd84a']);
      K.garland(360, 524, 58, 7, 'flags', ['#ffd84a', '#e05a4a', '#6aa05a', '#4a8ad8']);
      for (const [px, py] of [[170, 80], [226, 74], [318, 86]]) { VL(px, 52, py - 52, '#8a8f9c'); draw('plane', px, py); }
      // kites pinned up the wall, tails trailing
      [[256, 70, '#e05a4a', '#ffd84a'], [290, 78, '#4a8ad8', '#f4f0ea'], [322, 68, '#6aa05a', '#ffd84a']].forEach(([kx, ky, c1, c2], i) => {
        draw('kite', kx, ky, { remap: { r: c1, y: c2 } });
        for (let j = 0; j < 14; j++) { const tx = kx + Math.round(Math.sin(j * 0.7 + i) * 2), ty = ky + 11 + j; P1(tx, ty, '#3a3440'); if (j % 4 === 2) { P1(tx - 1, ty, c1); P1(tx + 1, ty, c2); } }
      });
      // the big toy shelf
      const ys = K.shelves(142, F, 96, 124, '#9a5a2b', 4, { back: '#6a3a1c' });
      const rowA = ['teddy', 'robot', 'bunny', 'duck', 'teddy', 'robot'];
      rowA.forEach((n, i) => draw(n, 152 + i * 15, ys[0], { flip: i % 2 === 1, remap: n === 'teddy' && i > 2 ? { m: '#d8a060', l: '#f0c890', d: '#a8743a', r: '#4a8ad8' } : undefined }));
      ['drum', 'top', 'blocks', 'frog', 'rocket', 'top', 'frog'].forEach((n, i) => draw(n, 151 + i * 13, ys[1], { flip: i % 2 === 0, remap: n === 'top' && i > 3 ? { r: '#6aa05a', b: '#e05a9a' } : n === 'frog' && i > 4 ? { g: '#4a8ad8', l: '#8ac0f0', d: '#2a5a9a' } : undefined }));
      K.boxes(147, ys[2], 86, 44, ['#e05a4a', '#4a8ad8', '#ffd84a', '#6aa05a', '#e05a9a'], { minW: 9, maxW: 14, minH: 11, maxH: 16 });
      draw('trainEngine', 162, ys[3]); draw('trainCar', 179, ys[3]); draw('duck', 200, ys[3]); draw('bunny', 216, ys[3], { flip: true, remap: { m: '#f0d8a0', l: '#fff0c8', d: '#c8a060' } }); draw('robot', 229, ys[3], { remap: { m: '#e05a4a', l: '#ff9a80', d: '#8a2a1a' } });
      // price tags hanging off the shelf lips
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const tx = 150 + j * 30 + (i % 2) * 12, ty = ys[i] + 3; R(tx, ty, 5, 3, '#f6f2e6'); P1(tx + 1, ty + 1, '#c8352b'); P1(tx + 3, ty + 1, '#c8352b'); }
      K.hangSign(190, 76, 'WIND-UPS', '#c8452f', '#fff3d8');
      // the high shelf the train runs along
      K.wallShelf(244, 118, 106, '#9a5a2b');
      for (let x = 246; x < 348; x += 3) P1(x, 117, '#5a5462');
      HL(246, 116, 102, '#8a8f9c');
      // the bin of mystery
      const bm = K.ramp('#b2452f');
      R(254, F - 36, 48, 36, bm.m); R(256, F - 34, 44, 34, bm.l); for (let x = 258; x < 300; x += 7) VL(x, F - 32, 30, bm.d);
      R(252, F - 40, 52, 5, bm.d); HL(252, F - 40, 52, bm.h);
      draw('teddy', 262, F - 38, { remap: { m: '#e05a9a', l: '#f8a0c8', d: '#a8306a' } }); draw('duck', 280, F - 37); draw('frog', 294, F - 36, { flip: true });
      E(272, F - 40, 4, 4, '#4a8ad8'); P1(271, F - 42, '#b8e0ff'); E(288, F - 41, 3, 3, '#6aa05a');
      R(258, F - 27, 40, 15, '#fff3d8'); gfx.text('BIN OF', 278, F - 26, '#b2452f', { align: 'center', font: 'small' }); gfx.text('MYSTERY', 278, F - 19, '#b2452f', { align: 'center', font: 'small' });
      // blocks and a truck on the play rug
      draw('blocks', 318, F + 6);
      // a gumball machine by the counter
      draw('gumball', 342, F);
      // behind the counter: games, jars of marbles, the shop's oldest bear
      const bys = K.shelves(366, F - 34, 100, 88, '#9a5a2b', 3, { back: '#6a3a1c' });
      K.boxes(371, bys[0], 90, 91, ['#e05a4a', '#4a8ad8', '#ffd84a', '#6aa05a', '#8a5aa8'], { minW: 12, maxW: 18, minH: 10, maxH: 14 });
      for (let i = 0; i < 5; i++) draw('jar', 377 + i * 18, bys[1], { remap: { r: ['#e05a4a', '#4a8ad8', '#6aa05a', '#ffd84a', '#e05a9a'][i], R: '#ffffff', w: '#d8ecf4' } });
      draw('teddy', 386, bys[2], { remap: { m: '#8a6a4a', l: '#a8886a', d: '#5a4030', r: '#6aa05a' } }); draw('bunny', 404, bys[2]); draw('rocket', 420, bys[2]); draw('drum', 436, bys[2]); draw('robot', 452, bys[2]);
      // a photo of the shop in 1974, and the clock
      K.picture(478, 96, 28, 22, '#6b4630', 'photo', { cols: ['#b8b0a8', '#8a6a4a', '#c8a882'] });
      K.clock(492, 134, 7, '#9a4a2a');
      K.plant(506, F, 'bigPlant');
    },
    window: {
      frame: '#9a4a2a', seed: 4,
      deco(x, y, w, h) {
        // a painted toy chest under the glass, toys lined up on the sill
        const m = K.ramp('#3a6ba8'), cy = F - 26;
        R(x + 6, cy, w - 12, 26, m.m); HL(x + 6, cy, w - 12, m.h); VL(x + 6, cy, 26, m.l); VL(x + w - 7, cy, 26, m.d);
        R(x + 4, cy - 4, w - 8, 5, sh('#3a6ba8', -20)); HL(x + 4, cy - 4, w - 8, m.l);
        for (let i = 0; i < 5; i++) { const sx = x + 14 + i * 12; draw('kite', sx, cy + 6, { remap: { r: ['#ffd84a', '#e05a4a', '#f4f0ea', '#6aa05a', '#e05a9a'][i], y: '#f4f0ea' } }); }
        R(x + w / 2 - 4, cy + 2, 8, 3, '#e8b84a'); P1(x + w / 2, cy + 3, '#8a5a1c');
        draw('frog', x + 14, y + h + 3); draw('blocks', x + 62, y + h + 3); draw('teddy', x + 36, y + h + 3, { flip: true });
        R(x + 12, y + h - 19, 56, 9, '#fff3d8'); gfx.text('WIND-UP SALE', x + 40, y + h - 18, '#c8452f', { align: 'center', font: 'small', fit: 54 });
        VL(x + 24, y + 2, h - 20, '#3a3440'); VL(x + 55, y + 2, h - 20, '#3a3440');
      },
    },
    live: [
      // the train going round and round the high shelf
      { id: 'train', draw(g, t) {
        const k = (t * 0.08) % 2, u = k < 1 ? k : 2 - k, x = 262 + Math.round(u * 70), f = k >= 1;
        draw('trainEngine', x + (f ? -8 : 8), 117, { flip: f }); draw('trainCar', x + (f ? 10 : -10), 117, { flip: f });
        for (let i = 0; i < 3; i++) { const q = (t * 1.3 + i * 0.33) % 1; withA(0.6 * (1 - q), () => E(x + (f ? -10 : 10) - (f ? -1 : 1) * q * 8, 104 - q * 10, 1 + q * 2, 1 + q * 1.5, '#ffffff')); }
      } },
      // a wind-up robot marching along the window display
      { id: 'windup', draw(g, t) { const k = (t * 0.12) % 2, u = k < 1 ? k : 2 - k; draw('robot', 70 + Math.round(u * 40), 167 + (Math.floor(t * 8) % 2), { flip: k >= 1 }); } },
      // a top that never quite falls over
      { id: 'top', draw(g, t) { const wob = Math.sin(t * 3) * 1.2; draw('top', 300 + Math.round(wob), F + 14, { flip: Math.floor(t * 12) % 2 === 0 }); } },
      { id: 'clock', draw() { K.clockHands(492, 134, 7); } },
    ],
    counter: { wood: '#9a5a2b', top: '#c8945a', stripe: '#c8452f', items(x, top) { draw('tipJar', 60, top); draw('duck', 80, top); } },
    lights: [
      { x: 190, y: 90, rx: 90, ry: 70, color: '#ffd9a0', alpha: 0.09 },
      { x: 300, y: 100, rx: 90, ry: 70, color: '#ffd9a0', alpha: 0.08 },
      { x: 420, y: 110, rx: 90, ry: 70, color: '#ffd9a0', alpha: 0.08 },
    ],
    ambient: { color: '#7a5a6a', alpha: 0.1 },
    customers: [
      { name: 'Pip', species: 'squirrel', outfit: 'winter', x: 300, height: 0.7, lines: ["The train goes ALL the way to the end! {p}And then it comes BACK!", "I'm saving up for the robot. {p}I have forty cents. {p}It's a long-term plan."] },
      { name: 'Grandpa Oak', species: 'beaver', outfit: 'cardigan', x: 196, range: 10, look: { glasses: true }, lines: ["Looking for something for my grandson. {p}He wants a phone. {p}He's getting a wooden duck.", "They don't make them like this anymore. {p}Winnie makes them like this. Same thing."] },
      { name: 'Joanne', species: 'goose', outfit: 'coat', x: 250, lines: ["Six nieces. {p}Six. {p}I have a spreadsheet.", "Is the mystery bin really a mystery? {p}...I'll take two."] },
    ],
    extras: [
      { x: 244, w: 106, hint: 'Train set', promptY: 104, lines: ["A little train, going round the top shelf. {p}Winnie's had it running since I was small. {p}It has never once derailed. Unlike me."] },
      { x: 330, w: 24, hint: 'Gumballs', lines: ["A gumball machine. Twenty-five cents. {p}I have the quarter. I do not have the self-control. {p}...Walk away, Chubby."] },
    ],
    loose: [['ball', '#e05a7a', 170], ['ball', '#4a9ac8', 226], ['ball', '#e8b44a', 318]],
  };

  // ==========================================================================
  // GOODS for the coffee shop, bookshop, bakery and hardware store
  // ==========================================================================
  PX.def('sack', { k: '#3a2410', d: '#8a6a3a', m: '#b8945a', l: '#d8b878', b: '#4a2a14', B: '#6a3a1c', w: '#f4ecd8', r: '#2f5a44' }, [
    '..kkkkkkkkk...',
    '.kbbbbbbbbbk..',
    '.kkBbBbBbBkk..',
    'kmllllllllllk.',
    'kmdmmmmmmmdmk.',
    'kmmmmmmmmmmmk.',
    'kmwwwwwwwwwmk.',
    'kmwrrrrrrrwmk.',
    'kmwwwwwwwwwmk.',
    'kmmmmmmmmmmmk.',
    'kdmmmmmmmmmdk.',
    '.kdddddddddk..',
    '..kkkkkkkkk...',
  ], { ax: 6, ay: 13 });
  PX.def('grinder', { k: '#1e1a20', g: '#c8dce8', G: '#f0f8fc', b: '#4a2a14', m: '#c8352b', l: '#e8604a', h: '#ff9a80', r: '#f5c33b', d: '#8a1a14' }, [
    '..kkkk..',
    '.kGggGk.',
    '.kgbbgk.',
    '.kbbbbk.',
    '..kbbk..',
    '..kkkk..',
    '.kmmmmk.',
    'kmlhhlmk',
    'kmlrrlmk',
    'kmmmmmmk',
    'kmkkkkmk',
    'kmk..kmk',
    'kmkbbkmk',
    'kmmmmmmk',
    'kddddddk',
    '.kkkkkk.',
  ], { ax: 4, ay: 16 });
  PX.def('laptop', { k: '#1e1a24', b: '#3a4a6a', w: '#9fdcff', m: '#b8bcc8' }, [
    '..kkkkkkk.',
    '..kbbbbbk.',
    '..kbwbbbk.',
    '..kbbbbbk.',
    '..kkkkkkk.',
    'kkmmmmmmmk',
    '.kkkkkkkk.',
  ], { ax: 5, ay: 7 });
  PX.def('globe', { k: '#1e2230', b: '#3a7ab0', g: '#5aa04a', m: '#c8922f' }, [
    '....kk....',
    '..kkbbkk..',
    '.kbggbbbk.',
    'kbgggbbgbk',
    'kbbggbbggk',
    'kbbbgbbbbk',
    'kbggbbbgbk',
    '.kbbbbggk.',
    '..kkbbkk..',
    '....kk....',
    '....kk....',
    '...kmmk...',
    '..kmmmmk..',
    '..kkkkkk..',
  ], { ax: 5, ay: 14 });
  PX.def('typewriter', { k: '#141a16', m: '#2f5a44', l: '#4a8a6a', h: '#e8e2d2', w: '#fbf8f0' }, [
    '....kkkkkk....',
    '....kwwwwk....',
    '....kwwwwk....',
    '.kkkkkkkkkkkk.',
    'kmllllllllllmk',
    'kmmmmmmmmmmmmk',
    'kmhkhkhkhkhkmk',
    'kmkhkhkhkhkhmk',
    '.kkkkkkkkkkkk.',
  ], { ax: 7, ay: 9 });
  PX.def('catSleep', { k: '#3a1a08', o: '#e8903a', d: '#b8601a' }, [
    '..k.k..........',
    '.kokok.kkkkk...',
    '.kooooooooooook',
    'kookoooodoooook',
    'koooooodooodook',
    'kdooooooooooodk',
    '.kkkkkkkkkkkkk.',
  ], { ax: 7, ay: 7 });
  PX.def('lantern', { k: '#5a1a10', r: '#e05a3a', h: '#ffb08a', d: '#b8351b', y: '#f5c33b' }, [
    '...kk...', '.kkkkkk.', 'krhrrrrk', 'krrrrrdk', 'kkkkkkkk', 'krhrrrrk', 'krrrrrdk', '.kkkkkk.', '...kk...', '...yy...',
  ], { ax: 4, ay: 0 });
  PX.def('baguette', { k: '#5a2a16', d: '#a8521c', m: '#d8782a', l: '#f0a044', h: '#ffd68a' }, [
    '...kkkkkkkkkkkk...',
    '.kkllhlklhllklhkk.',
    'kmmmmmmmmmmmmmmmmk',
    '.kddmmmmmmmmmmddk.',
    '..kkkkkkkkkkkkkk..',
  ], { ax: 9, ay: 5 });
  PX.def('cakeWhole', { k: '#4a1a22', r: '#d8263a', w: '#fff4f0', W: '#f0d4d0', h: '#ffffff', p: '#f07a9a', P: '#c8506a', s: '#fff0d8', c: '#e8eef4' }, [
    '....kk....kk....',
    '...krrk..krrk...',
    '.kkkkkkkkkkkkkk.',
    'kwwhwwwwwwwwwwwk',
    'kwwwwwwwwwwwwwWk',
    'kpwpwwpwwpwwpwWk',
    'kpppppppppppppPk',
    'kssssssssssssssk',
    'kpppppppppppppPk',
    'kPPPPPPPPPPPPPPk',
    '.kkkkkkkkkkkkkk.',
    'kcccccccccccccck',
    '.kkkkkkkkkkkkkk.',
  ], { ax: 8, ay: 13 });
  PX.def('flourSack', { k: '#6a5a48', w: '#f4ecdc', W: '#d8ccb4', b: '#4a7ab0' }, [
    '...kk..kk...',
    '...kwkkwk...',
    '....kwwk....',
    '...kkkkkk...',
    '..kwwwwwwk..',
    '.kwwwwwwwwk.',
    'kwwwwwwwwwwk',
    'kwbbbbbbbbwk',
    'kwbwbwbbwbwk',
    'kwbbbbbbbbwk',
    'kwwwwwwwwwWk',
    'kwwwwwwwwWWk',
    'kWwwwwwwwWWk',
    '.kWWWWWWWWk.',
    '..kkkkkkkk..',
  ], { ax: 6, ay: 15 });
  PX.def('copperPan', { k: '#4a2210', o: '#c86a3a', h: '#ffb080', d: '#8a3a1a' }, [
    '...kk....', '...kok...', '...kok...', '...kok...', '...kok...', '.kkkkkkk.', 'kohoooodk', 'koooooodk', 'kdooooodk', '.kdddddk.', '..kkkkk..',
  ], { ax: 4, ay: 0 });
  PX.def('hammer', { k: '#1e1a20', m: '#8a8f9c', l: '#c8ccd8', w: '#b8844a' }, [
    'kkkkkk', 'kmlllk', 'kkkkkk', '..kwk.', '..kwk.', '..kwk.', '..kwk.', '..kwk.', '..kwk.', '..kwk.', '..kwk.', '..kkk.',
  ], { ax: 3, ay: 0 });
  PX.def('saw', { k: '#1e1a20', w: '#b8844a', m: '#a8aeb8', l: '#dce0e8', v: '#8a8f9c' }, [
    'kkkk............',
    'kwwkkkkkkkkkkkkk',
    'kwkkmlllllllllmk',
    'kwwkmmmmmmmmmmk.',
    'kkkkmmmmmmmmk...',
    '....kvkvkvkvk...',
  ], { ax: 1, ay: 0 });
  PX.def('wrench', { k: '#1e1a20', m: '#b8bcc8' }, [
    'k...k', 'kmkmk', 'kmmmk', '.kmk.', '.kmk.', '.kmk.', '.kmk.', '.kmk.', '.kmk.', '.kmk.', 'kmmmk', 'kmkmk', 'kk.kk',
  ], { ax: 2, ay: 0 });
  PX.def('screwdriver', { k: '#1e1a20', y: '#e05a4a', h: '#ff9a80', m: '#c8ccd8' }, [
    '.k.', 'khk', 'kyk', 'kyk', 'kyk', 'kkk', '.m.', '.m.', '.m.', '.m.', '.k.',
  ], { ax: 1, ay: 0 });
  PX.def('pliers', { k: '#1e1a20', m: '#b8bcc8', b: '#3a7ad8' }, [
    '.k...k.', '.kk.kk.', '..kkk..', '..kmk..', '.kmkmk.', 'kmk.kmk', 'kbk.kbk', 'kbk.kbk', 'kbk.kbk', 'kbk.kbk', 'kk...kk',
  ], { ax: 3, ay: 0 });
  PX.def('tape', { k: '#1e1a20', y: '#ffd83a', h: '#fff4a0', m: '#c8ccd8' }, [
    '.kkkkkk.', 'kyyhyyyk', 'kyykkyyk', 'kykmmkyk', 'kyykkyyk', 'kyyyyyyk', '.kkkkkkm',
  ], { ax: 4, ay: 0 });
  PX.def('paintCan', { k: '#1e1a20', m: '#b8bcc8', d: '#8a8f9c', w: '#f4f0e6', c: '#c8352b', h: '#ff8a7a' }, [
    '.kkkkkkk.', 'kcchcccck', 'kkkkkkkkk', 'kmmmmmmdk', 'kwwwwwwdk', 'kwccccwdk', 'kwwwwwwdk', 'kmmmmmmdk', 'kmcmmmmdk', '.kkkkkkk.',
  ], { ax: 4, ay: 10 });
  PX.def('rope', { k: '#4a3010', y: '#d8b878', l: '#b8945a', d: '#8a6a3a' }, [
    '..kkkkkkkk..', '.kylylylylk.', 'kdkkkkkkkkdk', 'kylylylylylk', 'kdkkkkkkkkdk', 'kylylylylylk', 'kdkkkkkkkkdk', '.kylylylylk.', '..kkkkkkkk..',
  ], { ax: 6, ay: 9 });
  PX.def('shovel', { k: '#1e1a20', w: '#c8844a', b: '#3a7ad8', h: '#8ac0f8', d: '#2a5aa8' }, [
    '..kkkk..', '.kk..kk.', '.kkkkkk.', '...kwk..', '...kwk..', '...kwk..', '...kwk..', '...kwk..', '...kwk..', '...kwk..', '...kwk..', '...kwk..', '...kwk..', '...kwk..',
    '..kkkkk.', 'kkkkkkkk', 'kbhbbbbk', 'kbbbbbbk', 'kbbbbbbk', 'kbbbbbbk', 'kbbbbbdk', 'kddddddk', 'kkkkkkkk',
  ], { ax: 4, ay: 23 });

  // ---- furniture painters -----------------------------------------------------
  const cafeTable = (cx, yb, wood = '#6a4424') => {
    const m = K.ramp(wood);
    R(cx - 13, yb - 20, 26, 3, m.m); HL(cx - 13, yb - 20, 26, m.h); HL(cx - 13, yb - 18, 26, m.dd);
    R(cx - 1, yb - 17, 3, 15, '#2a2228'); VL(cx - 1, yb - 17, 15, '#4a4250');
    R(cx - 7, yb - 2, 15, 2, '#2a2228'); HL(cx - 7, yb - 2, 15, '#4a4250');
    K.band(cx - 12, yb - 1, 24, 2, '#140c10', 0.3);
    return yb - 20;
  };
  const bentChair = (cx, yb, flip, wood = '#3a2418') => {
    const m = K.ramp(wood), s = flip ? -1 : 1;
    R(cx - 6, yb - 13, 13, 3, m.m); HL(cx - 6, yb - 13, 13, m.h);
    VL(cx - 5, yb - 10, 10, m.d); VL(cx + 5, yb - 10, 10, m.d); VL(cx - 3, yb - 10, 9, m.dd); VL(cx + 3, yb - 10, 9, m.dd);
    HL(cx - 5, yb - 5, 11, m.d);
    const bx = cx - s * 6;
    VL(bx, yb - 28, 16, m.m); VL(bx + s, yb - 28, 16, m.l);
    for (let i = 0; i < 5; i++) P1(bx + s * (1 + i), yb - 29 - (i < 3 ? 1 : 0) + (i > 3 ? 1 : 0), m.m);
    VL(bx + s * 5, yb - 27, 6, m.m); HL(bx, yb - 20, s > 0 ? 5 : 1, m.d);
    K.band(cx - 7, yb - 1, 14, 2, '#140c10', 0.25);
  };
  const armchair = (x, yb, c = '#2f5a44', flip) => {
    const m = K.ramp(c);
    R(x, yb - 26, 30, 22, m.m);
    R(x + 3, yb - 30, 24, 10, m.m); HL(x + 3, yb - 30, 24, m.l); P1(x + 4, yb - 29, m.h);
    for (let i = x + 7; i < x + 26; i += 6) P1(i, yb - 25, m.dd);
    R(x - 2, yb - 20, 7, 16, m.l); HL(x - 2, yb - 20, 7, m.h); R(x + 25, yb - 20, 7, 16, m.d); HL(x + 25, yb - 20, 7, m.m);
    R(x + 5, yb - 13, 20, 5, m.l); HL(x + 5, yb - 13, 20, m.h);
    R(x, yb - 6, 30, 3, m.dd);
    R(x + 1, yb - 3, 2, 3, '#2a1a10'); R(x + 27, yb - 3, 2, 3, '#2a1a10');
    K.band(x - 2, yb - 1, 34, 2, '#140c10', 0.3);
  };
  const floorLamp = (x, yb, shade = '#e8c890') => {
    const m = K.ramp(shade);
    R(x - 4, yb - 2, 9, 2, '#2a2228'); VL(x, yb - 44, 42, '#3a3440'); VL(x + 1, yb - 44, 42, '#5a5462');
    for (let j = 0; j < 9; j++) HL(x - 4 - (j >> 1), yb - 52 + j, 10 + (j >> 1) * 2, j < 2 ? m.l : m.m);
    HL(x - 8, yb - 43, 18, m.d); R(x - 2, yb - 42, 5, 1, '#fff4c8');
  };
  const pastryCase = (x, yb, w, items) => {
    const m = K.ramp('#6b4630');
    R(x, yb - 5, w, 5, m.m); HL(x, yb - 5, w, m.h);
    R(x + 1, yb - 30, w - 2, 25, '#cfe4ee');
    withA(0.5, () => R(x + 2, yb - 29, w - 4, 23, '#f4fafc'));
    HL(x + 1, yb - 17, w - 2, '#e8eef4'); HL(x + 1, yb - 16, w - 2, '#a8b8c4');
    items.forEach((n, i) => { const row = i < items.length / 2 ? 0 : 1, col = row ? i - Math.ceil(items.length / 2) : i, per = Math.ceil(items.length / 2); draw(n, x + 4 + (col + 0.5) * ((w - 8) / per), row ? yb - 6 : yb - 17); });
    withA(0.35, () => { for (let i = 0; i < 18; i++) P1(x + 4 + i, yb - 29 + i, '#ffffff'); });
    R(x, yb - 31, w, 2, '#c8ccd8'); HL(x, yb - 31, w, '#f4f6fa');
    VL(x, yb - 30, 25, '#a8b0bc'); VL(x + w - 1, yb - 30, 25, '#8a92a0');
  };
  const espresso = (x, yb) => {
    const c = K.ramp('#c8ccd8'), red = K.ramp('#b8352b');
    for (let i = 0; i < 4; i++) { R(x + 4 + i * 8, yb - 29, 5, 4, '#f4f0ea'); P1(x + 9 + i * 8, yb - 28, '#f4f0ea'); HL(x + 4 + i * 8, yb - 29, 5, '#ffffff'); }
    R(x + 1, yb - 25, 34, 2, c.d); HL(x + 1, yb - 25, 34, c.l);
    R(x, yb - 23, 36, 20, c.m); HL(x, yb - 23, 36, c.h); VL(x, yb - 23, 20, c.l); VL(x + 35, yb - 23, 20, c.d);
    R(x + 2, yb - 21, 32, 7, red.m); HL(x + 2, yb - 21, 32, red.l); HL(x + 2, yb - 15, 32, red.dd);
    gfx.text('PINE', x + 18, yb - 20, '#ffe9a8', { align: 'center', font: 'small' });
    E(x + 31, yb - 9, 3, 3, '#140c10'); E(x + 31, yb - 9, 2, 2, '#f4f0ea'); P1(x + 32, yb - 10, '#c8352b');
    for (const gx of [x + 6, x + 18]) { R(gx, yb - 13, 7, 3, c.d); R(gx + 1, yb - 10, 5, 2, '#3a3440'); R(gx + 6, yb - 10, 5, 1, '#2a2020'); R(gx + 1, yb - 6, 4, 3, '#f4f0ea'); P1(gx + 5, yb - 5, '#f4f0ea'); }
    R(x + 2, yb - 3, 32, 3, c.dd); HL(x + 2, yb - 3, 32, c.m);
    VL(x - 2, yb - 16, 11, c.d); P1(x - 1, yb - 16, c.d); P1(x - 2, yb - 5, c.dd);
  };
  const bookcase = (x, yb, w, h, n, seed, cols, wood = '#4a2e1a') => {
    const ys = K.shelves(x, yb, w, h, wood, n, { back: sh(wood, -24) });
    ys.forEach((sy, i) => K.books(x + 4, sy, w - 8, seed + i * 7, cols, { minH: 8, maxH: Math.min(15, Math.round((h - 6) / n) - 3) }));
    return ys;
  };
  const plaque = (cx, y, text, bg = '#3a2418', fg = '#f5c33b') => {
    const w = gfx.textWidth(text, 'small') + 6, x = Math.round(cx - w / 2);
    R(x - 1, y - 1, w + 2, 11, '#140c10'); R(x, y, w, 9, bg); HL(x, y, w, sh(bg, 24));
    gfx.text(text, cx, y + 2, fg, { align: 'center', font: 'small' });
  };
  const steamAt = (x, y, t, n = 3, a = 0.5) => {
    for (let i = 0; i < n; i++) { const k = (t * 0.55 + i / n) % 1; withA(a * (1 - k), () => E(Math.round(x + Math.sin(t * 2 + i * 2) * 2), Math.round(y - k * 12), 1 + k * 1.6, 1 + k, '#ffffff')); }
  };
  K.steamAt = steamAt;

  // ==========================================================================
  // 2. THE DRIPPING PINE
  // ==========================================================================
  ROOMS.coffee = {
    ceil: ['beams', '#4a3020'], crown: '#3a2414', doorWood: '#2f5a44', board: false,
    walls() {
      K.brick(0, 51, W, F - 111, '#8a4a3a', { seed: 12 });
      K.wainscot(0, F - 60, W, 60, '#2f5a44', { pw: 26 });
      K.baseboard(0, F, W, '#1f3a2c');
    },
    floor() { K.floorPlanks(F, W, CH.H - F, '#6a4424', 31); K.rug(146, F + 5, 110, 13, '#8a3a2a', '#e8c070'); },
    paint() {
      // edison bulbs on long cords
      for (const [bx, len] of [[160, 34], [196, 28], [232, 36], [284, 30], [318, 26]]) K.pendant(bx, 51, len, 'edison');
      // the community board and a couple of pictures
      K.corkboard(150, 76, 50, 34, 7);
      R(151, 79, 26, 14, '#fff0a0'); gfx.text('LOST', 164, 80, '#8a2a1a', { align: 'center', font: 'tiny' }); gfx.text('MITTEN', 164, 87, '#8a2a1a', { align: 'center', font: 'tiny' });
      K.picture(212, 78, 30, 24, '#3a2414', 'lake');
      K.picture(250, 82, 22, 18, '#3a2414', 'abstract', { c1: '#c8352b', c2: '#2f5a44', c3: '#e8c070' });
      // seating: two tables, bentwood chairs, mugs left mid-conversation
      for (const tx of [176, 236]) {
        bentChair(tx - 14, F, false); bentChair(tx + 14, F, true);
        const top = cafeTable(tx, F);
        draw('mug', tx - 5, top, { remap: { r: '#2f5a44' } });
      }
      R(228, F - 23, 10, 3, '#f4f0e6'); HL(229, F - 22, 8, '#8a8f9c');
      // the good armchair, the lamp, and the board-game shelf
      armchair(262, F, '#8a3a2a'); floorLamp(298, F, '#e8c890');
      const ys = K.shelves(310, F, 38, 116, '#3a2414', 4, { back: '#2a1a10' });
      K.boxes(314, ys[0], 30, 61, ['#c8352b', '#3a6ba8', '#e8b84a', '#4a8a5a'], { minW: 8, maxW: 12, minH: 9, maxH: 12 });
      K.books(314, ys[1], 30, 62, ['#8a3a2a', '#2f5a44', '#e8c070', '#3a4a6a']);
      for (let i = 0; i < 2; i++) draw('mug', 320 + i * 12, ys[2], { remap: { r: ['#c8352b', '#e8b84a'][i] } });
      draw('pothos', 329, ys[3] - 11);
      K.plant(344, F, 'bigPlant');
      // behind the counter: the menu, the mug shelf, sacks of beans
      K.chalkboard(362, 72, 108, 44, [
        { t: 'THE DRIPPING PINE', c: '#f5c33b' }, '', { t: 'DRIP', x: 8 }, { t: 'DARK ROAST', x: 8 }, { t: 'CAMPFIRE*', x: 8 },
      ]);
      gfx.text('$2', 452, 93, '#ece6d6', { font: 'small' }); gfx.text('$3', 452, 101, '#ece6d6', { font: 'small' }); gfx.text('$3', 452, 109, '#ece6d6', { font: 'small' });
      gfx.text('*NOT ON PURPOSE', 416, 118, '#9aa88a', { align: 'center', font: 'small' });
      K.wallShelf(364, 128, 104, '#3a2414');
      for (let i = 0; i < 7; i++) draw('mug', 372 + i * 14, 128, { remap: { r: ['#c8352b', '#3a6ba8', '#2f5a44', '#e8b84a', '#8a5aa8', '#c8352b', '#4a8a5a'][i] } });
      for (let i = 0; i < 3; i++) draw('sack', 494 + (i % 2) * 12, F - (i >> 1) * 12, { remap: { r: ['#2f5a44', '#8a3a2a', '#3a4a6a'][i] } });
      K.plant(510, F - 26, 'snakePlant');
      K.clock(496, 92, 7, '#3a2414');
    },
    window: {
      frame: '#2f5a44', seed: 7,
      deco(x, y, w, h) {
        // a bar ledge to sit at, and a neon OPEN sign in the glass
        const m = K.ramp('#6a4424');
        R(x - 4, y + h + 4, w + 8, 4, m.m); HL(x - 4, y + h + 4, w + 8, m.h); HL(x - 4, y + h + 7, w + 8, m.dd);
        for (const bx of [x + 4, x + w - 6]) { R(bx, y + h + 8, 3, F - y - h - 8, '#3a2418'); }
        draw('mug', x + 18, y + h + 4, { remap: { r: '#e8b84a' } }); draw('cactus', x + w - 14, y + h + 4);
        R(x + 26, y + 10, 30, 11, '#1a0a10');
        gfx.text('OPEN', x + 41, y + 13, '#ff6a7a', { align: 'center', font: 'small' });
        for (const [sx, sy] of [[x + 26, y + 10], [x + 55, y + 10]]) VL(sx + 2, y + 2, 8, '#3a3440');
      },
      live(g, t) { if (Math.sin(t * 9) > -0.95) { withA(0.18, () => R(78, 115, 30, 11, '#ff4a6a')); CH.emit(93, 119, 6, '#ff5a7a', 0.9); } },
    },
    live: [
      { id: 'steam', draw(g, t) { steamAt(172, F - 30, t); steamAt(232, F - 30, t + 0.5); steamAt(405, F - 60, t, 3, 0.4); steamAt(417, F - 60, t + 0.3, 3, 0.4); } },
      { id: 'clock', draw() { K.clockHands(496, 92, 7); } },
    ],
    counter: {
      wood: '#3a2414', top: '#6a4424', stripe: '#2f5a44', register: false,
      items(x, top) { pastryCase(4, top, 38, ['muffin', 'croissant', 'cinnamon', 'cookie']); draw('tipJar', 48, top); espresso(58, top); draw('grinder', 100, top); draw('register', 112, top); },
    },
    lights: [
      { x: 160, y: 96, rx: 60, ry: 54, color: '#ffc870', alpha: 0.1 }, { x: 232, y: 100, rx: 60, ry: 54, color: '#ffc870', alpha: 0.1 },
      { x: 300, y: 150, rx: 40, ry: 40, color: '#ffd9a0', alpha: 0.12 }, { x: 416, y: 110, rx: 90, ry: 60, color: '#ffc870', alpha: 0.08 },
    ],
    ambient: { color: '#5a3a3a', alpha: 0.14 },
    customers: [
      { name: 'Hank', species: 'moose', outfit: 'flannel', x: 190, dy: -3, pose: 'sit', seat: true, flip: true, look: { face: 'bored' }, lines: ["Mm. {p}Paper says the mill might reopen. {p}Paper's said that since 1998.", "Marta makes it strong. {p}Strong enough to argue with."] },
      { name: 'Iris', species: 'owl', outfit: 'sweater', x: 222, dy: -3, pose: 'sit', seat: true, look: { glasses: true }, lines: ["I'm writing a novel. {p}It's about a coffee shop. {p}I'm doing research.", "Chapter four. The barista has a secret. {p}The secret is she's a goose."] },
      { name: 'Wes', species: 'fox', outfit: 'winter', x: 336, lines: ["Just waiting on a dark roast. {p}Third today. {p}Don't tell my doctor, she drinks here too.", "Campfire flavour? {p}I tried it once. {p}I could taste the marshmallows. And the forest fire."] },
    ],
    extras: [
      { x: 146, w: 56, hint: 'Notice board', promptY: F - 110, lines: ["LOST: RED MITTEN. ANSWERS TO 'MITTEN'. {p}SNOWBLOWER FOR SALE, ONLY BLOWS A LITTLE. {p}KNITTING CIRCLE THURSDAYS. BRING YOUR OWN DRAMA."] },
      { x: 258, w: 34, hint: 'Armchair', lines: ["The good chair. {p}Somebody is always just about to sit in it. {p}Today it's me. {p}...No, I have things to do."] },
    ],
    loose: [['cup', null, 206]],
  };

  // ==========================================================================
  // 3. DOG-EARED BOOKS
  // ==========================================================================
  const BOOKC = ['#8a2a2a', '#2f4a7a', '#3a6a4a', '#c8922f', '#6a3a7a', '#a8603a', '#2a5a6a', '#d8c8a0', '#5a3a2a'];
  ROOMS.books = {
    ceil: ['beams', '#3a2418'], crown: '#4a2e1a', doorWood: '#4a2e1a',
    walls() {
      K.wallpaper(0, 51, W, F - 51, '#4a3456', 'fleur', { a: '#8a6a3a', b: '#c8a060', sx: 16, sy: 16 });
      K.wainscot(0, F - 40, W, 40, '#4a2e1a', { pw: 24 });
      K.baseboard(0, F, W, '#2a1a10');
    },
    floor() { K.floorPlanks(F, W, CH.H - F, '#5a3a22', 41); K.rug(140, F + 4, 190, 15, '#7a2a2a', '#d8a84a'); },
    paint() {
      for (const [lx, ly] of [[150, 70], [210, 64], [276, 72], [334, 66]]) { VL(lx + 4, 51, ly - 51, '#3a3440'); draw('lantern', lx + 4, ly, { remap: lx > 250 ? { r: '#e8b84a', h: '#fff0a0', d: '#b8861a' } : undefined }); }
      bookcase(138, F, 92, 134, 6, 5, BOOKC);
      bookcase(232, F, 92, 134, 6, 55, BOOKC);
      plaque(184, 71, 'MYSTERY'); plaque(278, 71, 'SAD', '#2a2a4a', '#9fb4f0');
      plaque(184, F - 50, 'POETRY', '#3a2418', '#e8d8b0'); plaque(278, F - 50, 'CAREERS (LIES)', '#3a2418', '#e8d8b0');
      // the rolling ladder on its rail
      HL(136, 82, 190, '#8a8f9c'); HL(136, 83, 190, '#5a5f6a');
      const lm = K.ramp('#8a5a2b');
      for (let j = 0; j < 132; j++) { const u = j / 132, lx = Math.round(206 + u * 24); P1(lx, 82 + j, lm.m); P1(lx + 12, 82 + j, lm.m); if (j % 12 === 6) HL(lx, 82 + j, 13, lm.l); }
      // piles on the floor, a globe, a sleeping cat
      for (const [px0, n] of [[328, 6], [340, 4]]) for (let i = 0; i < n; i++) { const c = BOOKC[(i * 3 + px0) % BOOKC.length]; R(px0 - (i % 2), F - 3 * (i + 1), 11, 3, c); HL(px0 - (i % 2), F - 3 * (i + 1), 11, sh(c, 24)); HL(px0 + 1, F - 3 * (i + 1) + 1, 8, '#f4ecd8'); }
      draw('globe', 350, F);
      // behind the counter
      const ys = bookcase(364, F - 34, 100, 96, 3, 77, BOOKC);
      plaque(414, ys[0] - 30, 'STAFF PICKS', '#3a2418', '#f5c33b');
      K.picture(476, 84, 30, 36, '#c8922f', 'text', { lines: ['OSGOOD', 'EST.', '1971'], bg: '#e8d8b0' });
      K.clock(492, 136, 7, '#4a2e1a');
      bookcase(484, F, 40, 64, 2, 91, BOOKC);
    },
    window: {
      frame: '#4a2e1a', seed: 11,
      deco(x, y, w, h) {
        // a window seat with cushions, where the shop cat lives
        const m = K.ramp('#4a2e1a'), c = K.ramp('#8a3a4a');
        R(x - 6, F - 30, w + 12, 30, m.m); HL(x - 6, F - 30, w + 12, m.h);
        for (let i = x - 2; i < x + w + 2; i += 16) { R(i, F - 24, 12, 18, m.d); R(i + 1, F - 23, 10, 16, m.m); }
        R(x - 4, F - 36, w + 8, 6, c.m); HL(x - 4, F - 36, w + 8, c.h); HL(x - 4, F - 31, w + 8, c.dd);
        R(x + 2, F - 44, 14, 9, c.l); HL(x + 2, F - 44, 14, c.h); R(x + w - 18, F - 43, 14, 8, '#c8922f'); HL(x + w - 18, F - 43, 14, '#e8b84a');
        for (let i = 0; i < 3; i++) { const bc = BOOKC[i * 2]; R(x + w - 42 + i, F - 39 - i * 3, 12, 3, bc); HL(x + w - 42 + i, F - 39 - i * 3, 12, sh(bc, 24)); }
        R(x + 4, y + 4, w - 8, 6, '#6a3a4a'); for (let i = x + 4; i < x + w - 4; i += 4) VL(i, y + 10, 2 + ((i >> 2) % 2), '#6a3a4a');
      },
    },
    live: [
      { id: 'cat', draw(g, t) {
        draw('catSleep', 86, F - 36);
        const k = Math.sin(t * 1.4), tx = 94 + Math.round(k * 1.5);
        P1(tx, F - 37, '#e8903a'); P1(tx + 1, F - 38, '#e8903a'); P1(tx + 2, F - 38 + (k > 0.3 ? -1 : 0), '#b8601a');
        if (Math.sin(t * 0.7) > 0.6) gfx.text('z', 80, F - 50 - Math.round((t * 4) % 6), '#e8e0f0', { font: 'small' });
      } },
      { id: 'clock', draw() { K.clockHands(492, 136, 7); } },
    ],
    counter: { wood: '#4a2e1a', top: '#6a4424', items(x, top) { draw('typewriter', 60, top); for (let i = 0; i < 3; i++) { const c = BOOKC[i + 3]; R(30 + i, top - 3 * (i + 1), 12, 3, c); HL(30 + i, top - 3 * (i + 1), 12, sh(c, 24)); } R(82, top - 14, 2, 14, '#8a6a2a'); for (let j = 0; j < 5; j++) HL(78 - j, top - 18 + j, 10 + j * 2, j < 2 ? '#4a8a5a' : '#2f5a44'); R(80, top - 13, 6, 1, '#fff4c8'); } },
    lights: [
      { x: 150, y: 80, rx: 50, ry: 50, color: '#ffb070', alpha: 0.1 }, { x: 210, y: 76, rx: 50, ry: 50, color: '#ffb070', alpha: 0.1 },
      { x: 280, y: 84, rx: 50, ry: 50, color: '#ffd070', alpha: 0.1 }, { x: 338, y: 80, rx: 50, ry: 50, color: '#ffd070', alpha: 0.09 },
      { x: 438, y: 150, rx: 50, ry: 40, color: '#b8ffc8', alpha: 0.06 },
    ],
    ambient: { color: '#4a2a5a', alpha: 0.16 },
    customers: [
      { name: 'Dorothy', species: 'deer', outfit: 'coat', x: 196, range: 10, lines: ["I'm looking for a book I read in 1986. {p}It was blue. {p}Osgood says that narrows it down to 'most of them'.", "Have you read the SAD shelf? {p}Start at the left. Work up to it."] },
      { name: 'Walt', species: 'goose', outfit: 'cardigan', x: 280, look: { glasses: true, face: 'sad' }, lines: ["I've read the whole SAD shelf. {p}Twice. {p}I'm doing wonderfully, thank you.", "This one's about a lighthouse keeper. {p}Nothing happens. {p}It's perfect."] },
      { name: 'Juniper', species: 'rabbit', outfit: 'sweater', x: 330, height: 0.9, lines: ["Careers section. {p}'Follow Your Passion.' {p}My passion is napping. {p}There's no section for that.", "Osgood let me read the new one before it's shelved. {p}Don't tell."] },
    ],
    extras: [
      { x: 232, w: 92, hint: 'The SAD shelf', promptY: F - 140, lines: ["The SAD shelf. It goes all the way up. {p}There's a ladder specifically for it. {p}Osgood says it's the best-selling section in town."] },
      { x: 60, w: 70, hint: 'Window seat', lines: ["The shop cat, asleep on the window seat. {p}His name's Chapter. {p}He's been on page one of this nap for six years."] },
    ],
  };

  // ==========================================================================
  // 4. FROST & FLOUR
  // ==========================================================================
  const brickOven = (x, yb, w, h) => {
    K.brick(x, yb - h, w, h, '#9a5a3a', { seed: 44, bw: 8, bh: 4, soot: true });
    // arched mouth
    const cx = x + w / 2, my = yb - 34;
    for (let j = 0; j < 22; j++) { const hw = Math.round(Math.sqrt(Math.max(0, 1 - ((j - 22) / 22) ** 2)) * 20); HL(cx - hw, my - 22 + j + 22, hw * 2, '#1a0a08'); }
    for (let j = 0; j < 10; j++) { const hw = Math.round(Math.sqrt(Math.max(0, 1 - (j / 10) ** 2)) * 20); HL(cx - hw, my - j, hw * 2, '#1a0a08'); }
    for (let a = 0; a <= 20; a++) { const ang = Math.PI + (a / 20) * Math.PI, rx = Math.round(cx + Math.cos(ang) * 23), ry = Math.round(my + Math.sin(ang) * 12); R(rx - 1, ry - 1, 3, 3, a % 2 ? '#7a3a28' : '#b86a4a'); }
    // hearth ledge, wood stacked below
    R(x - 4, my + 22, w + 8, 4, '#6a6a70'); HL(x - 4, my + 22, w + 8, '#9a9aa4');
    for (let i = 0; i < 8; i++) { const lx = x + 8 + (i % 4) * 20, ly = yb - 4 - Math.floor(i / 4) * 5; E(lx, ly, 9, 2.4, '#6a4424'); E(lx - 8, ly, 2, 2, '#c8a070'); P1(lx - 8, ly, '#8a6a3a'); }
    // the flue up to the ceiling
    R(cx - 8, 46, 16, yb - h - 46, '#4a4a52'); VL(cx - 8, 46, yb - h - 46, '#6a6a74'); VL(cx + 7, 46, yb - h - 46, '#2a2a30');
    for (let yy = 56; yy < yb - h; yy += 16) HL(cx - 9, yy, 18, '#2a2a30');
  };
  const breadRack = (x, yb, w, h) => {
    const m = K.ramp('#8a5a2b');
    R(x, yb - h, 3, h, m.m); R(x + w - 3, yb - h, 3, h, m.m); VL(x, yb - h, h, m.l); VL(x + w - 1, yb - h, h, m.dd);
    const rows = 4, gap = (h - 10) / rows;
    for (let i = 0; i < rows; i++) {
      const by = Math.round(yb - h + 10 + gap * (i + 1));
      // slanted wicker basket
      const bm = K.ramp('#c89a5a');
      R(x + 3, by - 8, w - 6, 8, bm.m);
      for (let j = x + 4; j < x + w - 4; j += 3) { VL(j, by - 8, 8, bm.d); P1(j + 1, by - 6, bm.l); P1(j + 1, by - 3, bm.l); }
      HL(x + 3, by - 8, w - 6, bm.h); HL(x + 3, by - 1, w - 6, bm.dd);
      R(x + 2, by, w - 4, 2, m.m); HL(x + 2, by, w - 4, m.h);
    }
    return Array.from({ length: rows }, (_, i) => Math.round(yb - h + 10 + gap * (i + 1)) - 7);
  };
  const tieredCake = (cx, yb) => {
    const tiers = [[20, 8], [15, 7], [10, 6]];
    let y = yb - 3;
    R(cx - 13, yb - 3, 26, 3, '#c8ccd8'); HL(cx - 13, yb - 3, 26, '#f4f6fa'); R(cx - 2, yb - 1, 4, 1, '#8a8f9c');
    for (const [hw, th] of tiers) {
      R(cx - hw / 2, y - th, hw, th, '#fff8f4'); HL(cx - hw / 2, y - th, hw, '#ffffff'); VL(cx + hw / 2 - 1, y - th, th, '#e8d8d4');
      for (let i = cx - hw / 2 + 1; i < cx + hw / 2 - 1; i += 3) P1(i, y - th + 2, '#f07a9a');
      HL(cx - hw / 2, y - 1, hw, '#e8d8d4');
      y -= th;
    }
    P1(cx, y - 1, '#d8263a'); P1(cx - 1, y - 1, '#f07a9a'); P1(cx + 1, y - 2, '#4a9a4a');
  };
  ROOMS.bakery = {
    ceil: ['tin', '#f4ecdc'], crown: '#c8a878', doorWood: '#c8a878',
    walls() {
      K.tiles(0, 51, W, F - 107, '#f6f2ea', { tw: 9, th: 4 });
      R(0, F - 60, W, 4, '#f07a9a'); HL(0, F - 60, W, '#f8a8c0'); HL(0, F - 57, W, '#c8506a');
      K.beadboard(0, F - 52, W, 52, '#e8c8b0');
      K.baseboard(0, F, W, '#a8886a');
    },
    floor() { K.floorChecker(F, W, CH.H - F, '#8a5a3a', '#efe4d0'); },
    paint() {
      // copper pans on a rail
      HL(146, 66, 84, '#5a5462'); HL(146, 67, 84, '#3a3440');
      for (let i = 0; i < 6; i++) draw('copperPan', 154 + i * 14, 67);
      K.chalkboard(152, 90, 72, 30, [{ t: 'BREAD AT SIX', c: '#f5c33b' }, 'BUTTER TARTS $2', 'DAY-OLD HALF OFF']);
      // the bread rack
      const bys = breadRack(144, F, 88, 88);
      const rowsN = [['baguette', 'baguette'], ['bread', 'bread', 'bread'], ['croissant', 'croissant', 'croissant'], ['cinnamon', 'pretzel', 'cinnamon', 'pretzel']];
      rowsN.forEach((row, i) => row.forEach((n, j) => draw(n, 152 + (j + 0.5) * (74 / row.length), bys[i] + (n === 'baguette' ? 1 : 0), { flip: j % 2 === 1 })));
      // the oven, lit since 1961
      brickOven(240, F, 92, 104);
      R(236, F - 18, 3, 18, '#8a5a2b'); R(234, F - 72, 7, 54, '#c8945a'); for (let j = 0; j < 6; j++) HL(233, F - 72 + j, 9, j < 2 ? '#e8b878' : '#c8945a');
      // flour sacks against the wall
      draw('flourSack', 340, F); draw('flourSack', 348, F, { flip: true }); draw('flourSack', 344, F - 14);
      // behind the counter: cake boxes, sprinkles, the mixer
      K.wallShelf(364, 106, 104, '#c8a878'); K.wallShelf(364, 140, 104, '#c8a878');
      for (let i = 0; i < 4; i++) { const bx = 368 + i * 25; R(bx, 106 - 14, 20, 14, '#f8c8d8'); HL(bx, 92, 20, '#ffe0ea'); VL(bx + 10, 92, 14, '#d8263a'); HL(bx, 98, 20, '#d8263a'); P1(bx + 9, 91, '#d8263a'); P1(bx + 11, 91, '#d8263a'); VL(bx + 19, 92, 14, '#e0a8b8'); }
      for (let i = 0; i < 5; i++) draw('jar', 374 + i * 20, 140, { remap: { r: ['#f07a9a', '#4ac8e8', '#ffd84a', '#8ad05a', '#c8a0f0'][i], R: '#ffffff', w: '#fff8f0' } });
      draw('cakeWhole', 486, F - 58); R(478, F - 58, 18, 3, '#c8a878');
      K.clock(492, 88, 7, '#c8a878');
      K.plant(506, F, 'fern');
    },
    window: {
      frame: '#c8a878', seed: 15,
      deco(x, y, w, h) {
        // lace valance, the wedding cake on its stand, cupcakes on the sill
        for (let i = x + 2; i < x + w - 2; i += 2) { VL(i, y + 3, 4 + ((i >> 1) % 3 === 0 ? 2 : 0), '#fff8f0'); }
        HL(x + 2, y + 3, w - 4, '#ffffff');
        tieredCake(x + w / 2, y + h + 1);
        draw('muffin', x + 14, y + h + 2); draw('muffin', x + w - 14, y + h + 2, { remap: { b: '#d8263a', B: '#f07a9a' } });
        R(x + 4, y + h - 16, 26, 9, '#fff6e0'); gfx.text('FRESH', x + 17, y + h - 14, '#c8506a', { align: 'center', font: 'small' });
        const m = K.ramp('#e8c8b0');
        R(x - 4, y + h + 4, w + 8, F - (y + h + 4), m.m); HL(x - 4, y + h + 4, w + 8, m.h); VL(x - 4, y + h + 4, F - y - h - 4, m.l);
        for (let i = x; i < x + w; i += 20) { R(i + 2, y + h + 10, 16, F - y - h - 16, m.d); R(i + 3, y + h + 11, 14, F - y - h - 18, m.m); }
      },
    },
    live: [
      { id: 'fire', draw(g, t) {
        const cx = 286, my = F - 34;
        for (let i = 0; i < 9; i++) { const fx = cx - 14 + i * 3.4, fl = 5 + Math.sin(t * 9 + i * 1.7) * 2.4 + Math.sin(t * 5.3 + i) * 1.5, c = i % 3 === 0 ? '#ffe070' : i % 3 === 1 ? '#ff9a3c' : '#e8502a'; R(Math.round(fx), Math.round(my + 20 - fl), 3, Math.round(fl), c); }
        withA(0.22 + Math.sin(t * 7) * 0.05, () => E(cx, my + 14, 22, 9, '#ff9a3c'));
        CH.emit(cx, my + 14, 13, '#ff8a2a', 0.85 + Math.sin(t * 7) * 0.15);
        for (let i = 0; i < 3; i++) { const k = (t * 0.9 + i / 3) % 1; P1(cx - 8 + i * 8 + Math.round(Math.sin(t * 3 + i) * 2), Math.round(my + 10 - k * 18), k < 0.5 ? '#ffe070' : '#ff9a3c'); }
      } },
      { id: 'steam', draw(g, t) { steamAt(170, 138, t, 2, 0.35); steamAt(196, 138, t + 0.4, 2, 0.35); } },
      { id: 'flour', draw(g, t) { for (let i = 0; i < 10; i++) { const k = (t * 0.05 + i * 0.1) % 1; withA(0.5, () => P1(150 + ((i * 53) % 190) + Math.round(Math.sin(t * 0.7 + i) * 6), 70 + Math.round(k * 130), '#fffaf0')); } } },
      { id: 'clock', draw() { K.clockHands(492, 88, 7); } },
    ],
    counter: { wood: '#c8a878', top: '#f4ecdc', stripe: '#f07a9a', items(x, top) { pastryCase(4, top, 50, ['cakeWhole', 'donut', 'muffin', 'cookie', 'donut', 'cake']); draw('tipJar', 60, top); draw('pie', 80, top); } },
    lights: [
      { x: 188, y: 100, rx: 80, ry: 60, color: '#ffe0b0', alpha: 0.08 }, { x: 286, y: 190, rx: 60, ry: 30, color: '#ff9a3c', alpha: 0.16, flicker: 6 },
      { x: 416, y: 120, rx: 90, ry: 60, color: '#ffe0b0', alpha: 0.08 },
    ],
    ambient: { color: '#7a5a4a', alpha: 0.08 },
    customers: [
      { name: 'Lottie', species: 'rabbit', outfit: 'winter', x: 344, height: 0.72, lines: ["That cake has STRAWBERRIES. {p}Mum says I can look. {p}I'm looking VERY hard.", "Bernice gave me a broken cookie. {p}It's the best kind. It has two edges."] },
      { name: 'Mr. Birch', species: 'dog', outfit: 'coat', x: 196, lines: ["A rye and two butter tarts. {p}Same order for thirty years. {p}Bernice starts wrapping it when I open the door.", "The raisin bun? {p}Found the raisin once. 1994. {p}Didn't tell anybody. You're the first."] },
      { name: 'Nell', species: 'deer', outfit: 'sweater', x: 150, lines: ["I came in for bread. {p}I have bread, three muffins and a cake. {p}This happens every time.", "Smell that? {p}That's why nobody in this town moves away."] },
    ],
    extras: [
      { x: 240, w: 92, hint: 'Brick oven', promptY: F - 110, lines: ["The oven's been lit since 1961. {p}Bernice says if it ever goes out, the whole town goes with it. {p}She's only half joking."] },
    ],
  };

  // ==========================================================================
  // 5. BUCKSAW HARDWARE
  // ==========================================================================
  const drawerCabinet = (x, yb, w, h, cols, rows) => {
    const m = K.ramp('#6a6a60');
    R(x, yb - h, w, h, m.m); HL(x, yb - h, w, m.h); VL(x, yb - h, h, m.l); VL(x + w - 1, yb - h, h, m.dd);
    const dw = (w - 4) / cols, dh = (h - 4) / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const dx = Math.round(x + 2 + c * dw), dy = Math.round(yb - h + 2 + r * dh), ww = Math.round(dw) - 1, hh = Math.round(dh) - 1;
      R(dx, dy, ww, hh, m.d); HL(dx, dy, ww, m.l); R(dx + 1, dy + 1, ww - 2, 2, '#f4f0e6'); HL(dx + 2, dy + 1, ww - 5, '#8a8f9c');
      R(dx + (ww >> 1) - 1, dy + hh - 2, 3, 1, '#c8ccd8');
    }
  };
  const saltBag = (x, yb, c = '#3a6a8a') => {
    const m = K.ramp(c);
    R(x, yb - 12, 18, 12, m.m); HL(x, yb - 12, 18, m.h); VL(x, yb - 12, 12, m.l); VL(x + 17, yb - 12, 12, m.dd); HL(x, yb - 1, 18, m.dd);
    R(x + 1, yb - 13, 16, 2, m.d); for (let i = x + 2; i < x + 17; i += 3) P1(i, yb - 13, m.l);
    gfx.text('SALT', x + 9, yb - 9, '#f4f8fc', { align: 'center', font: 'tiny' });
  };
  ROOMS.hardware = {
    ceil: ['drop', '#d8d4c8'], crown: '#6a5a42', doorWood: '#6a5a42',
    walls() {
      R(0, 51, W, F - 51, '#8a7a5a'); K.speck(0, 51, W, F - 51, '#9a8a6a', 0.6, 5, 2000); K.speck(0, 51, W, F - 51, '#7a6a4a', 0.6, 6, 2000);
      K.band(0, 51, W, 10, '#1a1020', 0.14);
      K.blocks(0, F - 52, W, 52, '#6a6a62');
      R(0, F - 54, W, 3, '#c88a2a'); HL(0, F - 54, W, '#e8aa4a');
      K.baseboard(0, F, W, '#3a3a34');
    },
    floor() { K.floorConcrete(F, W, CH.H - F, '#8a8478', { stains: 2 }); K.speck(0, F + 2, W, 30, '#c8a060', 0.6, 9, 200); },
    paint() {
      for (const lx of [180, 300, 420]) K.pendant(lx, 46, 6, 'tube');
      // the pegboard of tools
      K.pegboard(140, 84, 112, 62);
      const T = [['hammer', 148, 88], ['hammer', 160, 88], ['saw', 172, 90], ['wrench', 194, 88], ['wrench', 202, 88], ['wrench', 210, 88], ['pliers', 220, 88], ['pliers', 230, 88], ['screwdriver', 242, 88],
        ['screwdriver', 148, 118], ['screwdriver', 154, 118], ['screwdriver', 160, 118], ['tape', 170, 118], ['tape', 180, 118], ['saw', 190, 116], ['hammer', 212, 116], ['pliers', 224, 116], ['wrench', 236, 116], ['wrench', 244, 118]];
      for (const [n, tx, ty] of T) { P1(tx, ty - 2, '#3a3440'); draw(n, tx, ty, { remap: n === 'screwdriver' && tx % 3 === 0 ? { y: '#ffd83a', h: '#fff4a0' } : undefined }); }
      plaque(196, 74, 'HAND TOOLS', '#3a3440', '#ffd84a');
      drawerCabinet(140, F, 112, 60, 6, 6);
      // the paint aisle
      const ys = K.shelves(258, F, 88, 120, '#8a8f9c', 4, { back: '#5a5a54' });
      const PC = ['#c8352b', '#3a7ad8', '#4a9a4a', '#f5c33b', '#f4f0e6', '#8a5aa8', '#e8864a'];
      for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) draw('paintCan', 267 + i * 10, ys[r], { remap: { c: PC[(i + r * 3) % PC.length], h: sh(PC[(i + r * 3) % PC.length], 40) } });
      for (let i = 0; i < 4; i++) draw('rope', 272 + i * 18, ys[2], { remap: i % 2 ? { y: '#e8e2d2', l: '#c8c0b0', d: '#9a9284' } : undefined });
      K.boxes(262, ys[3], 80, 88, ['#c8922f', '#8a5a2b', '#6a8a9a', '#c8352b'], { minW: 10, maxW: 16, minH: 10, maxH: 14, label: '#f4ecd8' });
      plaque(302, 82, 'AISLE 2', '#3a3440', '#ffd84a');
      // shovels in a barrel by the counter
      const bm = K.ramp('#6a4424');
      for (let i = 0; i < 4; i++) draw('shovel', 336 + i * 5, F - 6 - (i % 2) * 2, { remap: { b: ['#3a7ad8', '#c8352b', '#f5c33b', '#4a9a4a'][i], h: '#ffffff', d: sh(['#3a7ad8', '#c8352b', '#f5c33b', '#4a9a4a'][i], -40) } });
      R(334, F - 18, 26, 18, bm.m); for (let j = F - 16; j < F; j += 5) HL(334, j, 26, bm.dd); VL(334, F - 18, 18, bm.l); HL(333, F - 18, 28, '#8a8f9c');
      // behind the counter: the key wall and the cutting machine
      R(366, 78, 96, 52, '#5a4a38'); R(368, 80, 92, 48, '#7a6448');
      for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) { const kx = 372 + c * 7, ky = 84 + r * 11; P1(kx + 1, ky, '#3a3440'); R(kx, ky + 1, 3, 3, r % 2 ? '#c8ccd8' : '#e8b84a'); R(kx + 1, ky + 4, 1, 4, r % 2 ? '#a8aeb8' : '#c8922f'); P1(kx + 2, ky + 6, r % 2 ? '#a8aeb8' : '#c8922f'); }
      plaque(414, 69, 'KEYS CUT', '#3a3440', '#ffd84a');
      K.wallShelf(366, 146, 96, '#8a8f9c');
      for (let i = 0; i < 5; i++) draw('paintCan', 372 + i * 18, 146, { remap: { c: PC[i], h: sh(PC[i], 40) } });
      // a ladder, a propane cage, a calendar
      const lm = K.ramp('#c8922f');
      for (let j = 0; j < 110; j++) { const lx = Math.round(484 + (j / 110) * 10); P1(lx, F - 110 + j, lm.m); P1(lx + 12, F - 110 + j, lm.m); if (j % 14 === 7) HL(lx, F - 110 + j, 13, lm.l); }
      K.picture(476, 84, 26, 30, '#3a3440', 'text', { lines: ['JAN', 'SALT', 'SALT', 'SALT'], bg: '#f4f0e6', ink: '#c8352b' });
      R(500, F - 30, 22, 30, 'rgba(0,0,0,0)');
      for (let i = 0; i < 2; i++) { const tx = 504 + i * 9; R(tx, F - 18, 7, 16, '#f4f0e6'); HL(tx, F - 18, 7, '#ffffff'); VL(tx + 6, F - 18, 16, '#c8c4bc'); R(tx + 2, F - 21, 3, 3, '#8a8f9c'); R(tx, F - 10, 7, 2, '#c8352b'); }
      for (let x = 500; x < 522; x += 3) VL(x, F - 28, 28, '#8a8f9c'); HL(500, F - 28, 22, '#c8ccd8');
    },
    window: {
      frame: '#6a5a42', seed: 19,
      deco(x, y, w, h) {
        for (let i = 0; i < 3; i++) saltBag(x + 4 + i * 20, F, ['#3a6a8a', '#3a6a8a', '#4a7a9a'][i]);
        for (let i = 0; i < 2; i++) saltBag(x + 14 + i * 20, F - 12, '#3a6a8a');
        saltBag(x + 24, F - 24, '#4a7a9a');
        R(x + w - 38, y + h - 20, 36, 12, '#ffd84a'); gfx.text('SALT $4', x + w - 20, y + h - 17, '#8a2a1a', { align: 'center', font: 'small', fit: 34 });
        HL(x + w - 26, y + h - 20, 24, '#fff4a0');
      },
    },
    live: [
      { id: 'tubes', draw(g, t) { if (Math.sin(t * 13) > 0.97) withA(0.12, () => R(270, 52, 60, 4, '#ffffff')); } },
      { id: 'glint', draw(g, t) { const k = Math.floor(t * 1.5) % 48; P1(372 + (k % 12) * 7, 85 + Math.floor(k / 12) * 11, '#ffffff'); } },
    ],
    counter: { wood: '#6a5a42', top: '#8a8f9c', stripe: '#c88a2a', items(x, top) {
      R(58, top - 12, 18, 12, '#5a6a7a'); HL(58, top - 12, 18, '#8a9aaa'); R(62, top - 18, 10, 6, '#3a4a5a'); R(66, top - 22, 2, 4, '#c8ccd8'); P1(70, top - 14, '#e8b84a');
      draw('tape', 30, top - 6); draw('rope', 88, top);
    } },
    lights: [{ x: 180, y: 90, rx: 90, ry: 70, color: '#e8f4ff', alpha: 0.08 }, { x: 300, y: 90, rx: 90, ry: 70, color: '#e8f4ff', alpha: 0.08 }, { x: 420, y: 90, rx: 90, ry: 70, color: '#e8f4ff', alpha: 0.08 }],
    ambient: { color: '#5a5a4a', alpha: 0.1 },
    customers: [
      { name: 'Doug', species: 'moose', outfit: 'flannel', x: 300, range: 12, lines: ["Snowblower belt. {p}Third one this winter. {p}I think the snowblower's doing it on purpose.", "Gordie says aisle two fixes aisle three. {p}I've been in aisle three for an hour."] },
      { name: 'Kip', species: 'raccoon', outfit: 'overalls', x: 190, lines: ["I'm building a birdhouse. {p}For me. {p}It's a big birdhouse.", "Those little drawers have everything. {p}I found a screw from 1962. It still works."] },
    ],
    extras: [
      { x: 140, w: 112, hint: 'Pegboard', promptY: F - 134, lines: ["Every tool hung on its own little outline. {p}If one's missing, you can see exactly what shape of trouble somebody's in."] },
      { x: 52, w: 80, hint: 'Road salt', lines: ["ROAD SALT. The bag says 'now with 20% more salt'. {p}It is entirely salt. It was always entirely salt."] },
    ],
    loose: [['can', null, 200]],
  };


  // ==========================================================================
  // GOODS for the thrift shop, record store, pharmacy and bait shop
  // ==========================================================================
  PX.def('hatBowler', { k: '#140c10', m: '#3a3440', l: '#5a5462', r: '#8a2a2a' }, ['..kkkk..', '.kmllmk.', '.kmmmmk.', '.krrrrk.', 'kkmmmmkk', 'kkkkkkkk'], { ax: 4, ay: 6 });
  PX.def('hatBeanie', { k: '#2a1018', m: '#c8352b', l: '#e8604a', w: '#f4f0e6' }, ['...w...', '..kwk..', '.kmlmk.', 'kmlmlmk', 'kwwwwwk', 'kkkkkkk'], { ax: 3, ay: 6 });
  PX.def('hatFedora', { k: '#1a1410', m: '#8a6a4a', l: '#a8886a', b: '#3a2a1a' }, ['...kkk...', '..kmlmk..', '..kmkmk..', '..kbbbk..', 'kkmmmmmkk', '.kkkkkkk.'], { ax: 4, ay: 6 });
  PX.def('hatCowboy', { k: '#2a1a0c', m: '#b8844a', l: '#d8a868', b: '#6a3a1a' }, ['...kkkkk...', '..kmlkmmk..', '..kmmmmmk..', 'k.kbbbbbk.k', 'kmkmmmmmkmk', '.kkkkkkkkk.'], { ax: 5, ay: 6 });
  PX.def('guitar', { k: '#1e1210', w: '#c8844a', l: '#e8a868', d: '#8a4a1a', b: '#2a1a10', s: '#c8ccd8', h: '#3a2418' }, [
    '....kk....', '...khhk...', '...khhk...', '....kk....', '....ks....', '....ks....', '....ks....', '....ks....', '....ks....', '....ks....',
    '..kkkkkk..', '.kwllllwk.', 'kwlllllwwk', 'kwllkklwwk', 'kwlkbbklwk', '.kwkbbkwk.', '.kwlkklwk.', 'kwlllllwwk', 'kwwllllwdk', 'kdwwwwwwdk', '.kddddddk.', '..kkkkkk..',
  ], { ax: 5, ay: 0 });
  PX.def('speaker', { k: '#0e0c12', m: '#2a2630', l: '#4a4454', c: '#141218', s: '#6a6474' }, [
    'kkkkkkkkkkkk', 'kllllllllllk', 'kmmmkkkkmmmk', 'kmmkcsskkmmk', 'kmmkssckkmmk', 'kmmmkkkkmmmk', 'kmmmmmmmmmmk', 'kmmkkkkkkmmk', 'kmkccccccckk', 'kmkcsccsscmk', 'kmkccsccccmk', 'kmkcccsccckk', 'kmmkkkkkkmmk', 'kmmmmmmmmmmk', 'kkkkkkkkkkkk',
  ], { ax: 6, ay: 15 });
  PX.def('pillBottle', { k: '#3a1a08', a: '#d8862a', h: '#f0b050', w: '#f4f0ea', W: '#ffffff' }, ['.kkk.', 'kWwWk', 'kkkkk', 'kawak', 'kawhk', 'kaaak', '.kkk.'], { ax: 2, ay: 7 });
  PX.def('rxBox', { k: '#2a3a34', w: '#f4f8f6', W: '#d8e4e0', g: '#3a8a6a' }, ['kkkkkkk', 'kwwgwwk', 'kwgggwk', 'kwwgwWk', 'kwwwwWk', 'kkkkkkk'], { ax: 3, ay: 6 });
  PX.def('mortar', { k: '#2a2a30', w: '#e8e8ee', W: '#b8b8c4', p: '#c8a070' }, ['......kp..', '.....kp...', 'kkkkkpkkkk', 'kwwwwwwwWk', '.kwwwwwWk.', '..kwwwWk..', '..kkkkkk..', '.kWWWWWWk.', '.kkkkkkkk.'], { ax: 5, ay: 9 });
  PX.def('lure', { k: '#1a1418', a: '#e05a4a', b: '#ffd84a', e: '#ffffff', h: '#8a8f9c' }, ['.kkkk.', 'keaabk', 'kaabbk', '.kkkk.', '..h.h.', '.hh.hh'], { ax: 3, ay: 0 });
  PX.def('reel', { k: '#1a1418', m: '#8a8f9c', l: '#c8ccd8', g: '#c8922f' }, ['.kkk.', 'kmlmk', 'kmgmk', 'kmmmk', '.kkk.'], { ax: 2, ay: 5 });
  PX.def('spool', { k: '#1a1418', w: '#8a6a4a', c: '#3ad6a0' }, ['kkkkk', 'kwwwk', '.kck.', '.kck.', 'kwwwk', 'kkkkk'], { ax: 2, ay: 6 });

  const garment = (x, yr, kind, c, o = {}) => {
    const m = K.ramp(c), r = rng(x * 3 + (o.seed || 1));
    P1(x + 3, yr - 1, '#8a8f9c'); P1(x + 3, yr, '#8a8f9c'); HL(x, yr + 1, 7, '#8a8f9c');
    const len = kind === 'coat' ? 40 : kind === 'dress' ? 36 : kind === 'shirt' ? 24 : 22, w = kind === 'coat' ? 11 : 9;
    const x0 = x + 3 - (w >> 1);
    R(x0, yr + 2, w, len, m.m);
    VL(x0, yr + 2, len, m.l); VL(x0 + w - 1, yr + 2, len, m.d);
    HL(x0, yr + 2, w, m.h);
    if (o.pattern === 'plaid') { for (let j = yr + 4; j < yr + 2 + len; j += 4) HL(x0 + 1, j, w - 2, m.dd); for (let i = x0 + 2; i < x0 + w - 1; i += 4) VL(i, yr + 3, len - 2, m.d); }
    if (o.pattern === 'stripe') for (let j = yr + 5; j < yr + 2 + len; j += 3) HL(x0 + 1, j, w - 2, o.c2 || '#f4f0e6');
    // collar and buttons
    P1(x0 + (w >> 1) - 1, yr + 3, m.dd); P1(x0 + (w >> 1) + 1, yr + 3, m.dd); P1(x0 + (w >> 1), yr + 4, m.dd);
    if (kind === 'coat' || kind === 'shirt') for (let j = yr + 7; j < yr + len - 2; j += 5) P1(x0 + (w >> 1), j, kind === 'coat' ? '#e8c05a' : '#f4f0e6');
    if (kind === 'dress') { R(x0 - 1, yr + 2 + len - 12, w + 2, 12, m.m); VL(x0 - 1, yr + len - 10, 12, m.l); VL(x0 + w, yr + len - 10, 12, m.d); }
    HL(x0, yr + 1 + len, w + (kind === 'dress' ? 1 : 0), m.dd);
    VL(x0 + w, yr + 2, len, '#140c10');
  };
  const foldedStack = (x, yb, cols, n = 4) => { for (let i = 0; i < n; i++) { const c = cols[i % cols.length], m = K.ramp(c); R(x - (i % 2), yb - 3 * (i + 1), 16, 3, m.m); HL(x - (i % 2), yb - 3 * (i + 1), 16, m.h); P1(x + 15 - (i % 2), yb - 3 * (i + 1) + 1, m.d); } };
  const dressForm = (cx, yb) => {
    R(cx - 5, yb - 2, 11, 2, '#3a3440'); VL(cx, yb - 20, 18, '#5a5462'); VL(cx + 1, yb - 20, 18, '#3a3440');
    const s = K.ramp('#6a4a2a');
    R(cx - 8, yb - 50, 17, 30, s.m); VL(cx - 8, yb - 50, 30, s.l); VL(cx + 8, yb - 50, 30, s.d); HL(cx - 8, yb - 50, 17, s.h);
    R(cx - 2, yb - 49, 5, 12, '#f4f0e6'); R(cx, yb - 48, 1, 12, '#8a2a2a'); P1(cx, yb - 36, '#8a2a2a');
    P1(cx - 3, yb - 46, s.dd); P1(cx + 3, yb - 46, s.dd); P1(cx - 4, yb - 42, s.dd); P1(cx + 4, yb - 42, s.dd);
    for (let j = yb - 34; j < yb - 22; j += 4) P1(cx - 1, j, '#e8c05a');
    E(cx, yb - 53, 4, 3, '#d8c8b0'); VL(cx, yb - 56, 3, '#8a8f9c');
  };
  const recordBin = (x, yb, w, seed, label) => {
    const m = K.ramp('#6a4a2a'), r = rng(seed);
    R(x + 2, yb - 12, 2, 12, '#3a2418'); R(x + w - 4, yb - 12, 2, 12, '#3a2418');
    // sleeves standing in the crate, tops showing
    for (let i = x + 3; i < x + w - 3; i += 2) {
      const c = r.pick(['#c8352b', '#3a6ba8', '#e8b84a', '#4a8a5a', '#8a5aa8', '#e05a9a', '#f4f0e6', '#2a2a30', '#e8864a']);
      const hh = 8 + r.int(0, 3), lean = r.chance(0.2) ? 1 : 0;
      R(i + lean, yb - 26 - hh, 2, hh + 4, c); P1(i + lean, yb - 26 - hh, sh(c, 36)); P1(i + 1 + lean, yb - 25 - hh, sh(c, -30));
    }
    R(x, yb - 26, w, 14, m.m); HL(x, yb - 26, w, m.h); VL(x, yb - 26, 14, m.l); VL(x + w - 1, yb - 26, 14, m.dd);
    for (let i = x + 3; i < x + w - 3; i += 8) VL(i, yb - 24, 10, m.d);
    const tw = gfx.textWidth(label, 'small') + 4;
    R(x + 6, yb - 47, tw, 9, '#f4f0e6'); gfx.text(label, x + 8, yb - 45, '#2a2440', { font: 'small' });
  };
  const albumCover = (x, y, s, seed) => {
    const r = rng(seed), bg = r.pick(['#c8352b', '#3a6ba8', '#e8b84a', '#4a8a5a', '#8a5aa8', '#f4f0e6', '#2a2a30', '#e8864a', '#2a5a6a']);
    R(x - 1, y - 1, s + 2, s + 2, '#0e0c12'); R(x, y, s, s, bg);
    const k = r.int(0, 3), fg = r.pick(['#ffffff', '#1a1418', '#ffd84a', '#e05a9a', '#3ad6a0']);
    if (k === 0) { E(x + s / 2, y + s / 2, s * 0.3, s * 0.3, fg); }
    else if (k === 1) { for (let i = 0; i < s; i += 3) HL(x, y + i, s, fg); }
    else if (k === 2) { R(x + 2, y + s - 5, s - 4, 3, fg); E(x + s / 2, y + s * 0.4, s * 0.18, s * 0.18, sh(bg, 50)); }
    else { for (let i = 0; i < 4; i++) P1(x + r.int(1, s - 2), y + r.int(1, s - 2), fg); HL(x + 1, y + 2, s - 2, fg); }
    P1(x, y, sh(bg, 40));
  };
  // a little quaver, drawn: the font has no glyph for it
  const note = (x, y, c) => { x = Math.round(x); y = Math.round(y); R(x, y + 4, 2, 2, c); VL(x + 1, y, 5, c); HL(x + 2, y, 2, c); P1(x + 3, y + 1, c); };
  const poster = (x, y, w, h, bg, lines, fg = '#1a1418') => {
    R(x + 1, y + 1, w, h, 'rgba(10,6,16,0.35)');
    R(x, y, w, h, bg); HL(x, y, w, sh(bg, 30)); P1(x + 2, y + 1, '#d8d8e0'); P1(x + w - 3, y + 1, '#d8d8e0');
    lines.forEach((l, i) => gfx.text(l, x + w / 2, y + 3 + i * 7, i ? fg : sh(fg, 0), { align: 'center', font: 'small', fit: w - 2 }));
  };
  const aquarium = (x, yb, w, h) => {
    R(x - 2, yb - 14, w + 4, 14, '#3a2418'); HL(x - 2, yb - 14, w + 4, '#6a4424'); for (let i = x + 2; i < x + w; i += 12) R(i, yb - 11, 8, 9, '#2a1a10');
    const ty = yb - 14 - h;
    R(x - 1, ty - 1, w + 2, h + 2, '#141820');
    gfx.vgrad(x, ty, w, h, ['#5ab0c8', '#3a8aa8', '#2a6a88']);
    R(x, ty + h - 5, w, 5, '#a88a5a'); for (let i = 0; i < w; i += 2) P1(x + i, ty + h - 5 + (i * 7) % 4, ['#c8a870', '#8a6a4a', '#e8d0a0'][i % 3]);
    for (let i = 0; i < 4; i++) { const wx = x + 5 + i * (w / 4); for (let j = 0; j < 12 + (i % 2) * 5; j++) P1(Math.round(wx + Math.sin(j * 0.7 + i) * 1.5), ty + h - 6 - j, j % 3 ? '#3a8a3a' : '#5ab04a'); }
    R(x - 1, ty - 3, w + 2, 3, '#2a2a30'); HL(x - 1, ty - 3, w + 2, '#4a4a54');
    withA(0.25, () => { VL(x + 2, ty + 2, h - 10, '#ffffff'); VL(x + 3, ty + 2, h - 14, '#ffffff'); });
  };
  const woodStove = (x, yb) => {
    R(x, yb - 22, 22, 20, '#2a2a30'); HL(x, yb - 22, 22, '#4a4a54'); VL(x, yb - 22, 20, '#3a3a44'); VL(x + 21, yb - 22, 20, '#141418');
    R(x + 4, yb - 17, 14, 10, '#141418'); R(x + 5, yb - 16, 12, 8, '#3a1a10');
    R(x + 2, yb - 2, 3, 2, '#2a2a30'); R(x + 17, yb - 2, 3, 2, '#2a2a30');
    R(x + 8, 46, 6, yb - 22 - 46, '#3a3a44'); VL(x + 8, 46, yb - 68, '#5a5a64'); for (let yy = 60; yy < yb - 22; yy += 18) HL(x + 7, yy, 8, '#1a1a20');
  };

  // ==========================================================================
  // 6. SECOND WIND
  // ==========================================================================
  const CLOTH = ['#c8452f', '#3a6ba8', '#4a8a5a', '#e0a83a', '#8a5aa8', '#3a7a8a', '#6a4a2a', '#d8c8b0', '#2a3a5a', '#b04a6a'];
  ROOMS.thrift = {
    ceil: ['tin', '#dceef2'], crown: '#2f6a7a', doorWood: '#2f6a7a',
    walls() {
      K.wallpaper(0, 51, W, F - 51, '#4a7280', 'flower', { a: '#e8b8c8', b: '#f4f0e6', c: '#3a6270', sx: 16, sy: 16 });
      K.beadboard(0, F - 50, W, 50, '#e8e2d6');
      K.baseboard(0, F, W, '#8a8478');
    },
    floor() {
      K.floorPlanks(F, W, CH.H - F, '#7a5a42', 51);
      for (let i = 0; i < 5; i++) E(290, F + 14, 44 - i * 8, 8 - i * 1.5, ['#b04a6a', '#e0a83a', '#3a7a8a', '#d8c8b0', '#b04a6a'][i]);
    },
    paint() {
      // a shelf of hats along the top of the wall
      K.wallShelf(142, 90, 96, '#8a6a4a');
      ['hatBowler', 'hatCowboy', 'hatFedora', 'hatBeanie', 'hatFedora', 'hatBowler', 'hatCowboy', 'hatBeanie'].forEach((n, i) => draw(n, 150 + i * 12, 90, { remap: n === 'hatBeanie' && i > 4 ? { m: '#3a6ba8', l: '#6a9ad8' } : n === 'hatFedora' && i > 3 ? { m: '#3a3440', l: '#5a5462' } : undefined }));
      K.hangSign(190, 76, 'ALL $5', '#f4f0e6', '#b04a6a', { chain: 6 });
      // the long coat rack
      R(142, 104, 98, 2, '#c8ccd8'); HL(142, 104, 98, '#f4f6fa');
      for (const px0 of [142, 238]) { R(px0, 104, 2, F - 104, '#8a8f9c'); VL(px0, 104, F - 104, '#c8ccd8'); R(px0 - 5, F - 2, 12, 2, '#5a5462'); }
      const r1 = rng(61);
      for (let i = 0; i < 12; i++) { const k = r1.pick(['coat', 'coat', 'dress', 'coat']); garment(146 + i * 8, 104, k, CLOTH[r1.int(0, CLOTH.length - 1)], { pattern: r1.chance(0.3) ? 'plaid' : r1.chance(0.3) ? 'stripe' : null, seed: i }); }
      // the short rack of shirts and sweaters, shoes lined up beneath
      R(248, 144, 70, 2, '#c8ccd8'); HL(248, 144, 70, '#f4f6fa');
      for (const px0 of [248, 316]) { R(px0, 144, 2, F - 144, '#8a8f9c'); R(px0 - 4, F - 2, 10, 2, '#5a5462'); }
      for (let i = 0; i < 8; i++) garment(252 + i * 8, 144, r1.chance(0.5) ? 'shirt' : 'sweater', CLOTH[r1.int(0, CLOTH.length - 1)], { pattern: r1.chance(0.35) ? 'stripe' : null, seed: i + 20 });
      for (let i = 0; i < 6; i++) { const c = ['#3a2418', '#8a2a2a', '#2a2a30', '#6a4a2a', '#c8a070', '#2a3a5a'][i]; R(252 + i * 11, F - 5, 8, 4, c); R(252 + i * 11, F - 8, 4, 3, c); HL(252 + i * 11, F - 8, 4, sh(c, 30)); HL(252 + i * 11, F - 1, 9, '#140c10'); }
      // suitcases stacked on the rack, a mirror, the suit on its form
      for (let i = 0; i < 3; i++) { const c = ['#8a4a2a', '#3a5a4a', '#c8a070'][i], m = K.ramp(c); R(254 + i * 2, 131 - i * 9, 44 - i * 8, 9, m.m); HL(254 + i * 2, 131 - i * 9, 44 - i * 8, m.h); VL(254 + i * 2, 131 - i * 9, 9, m.l); R(272 + i * 2 - i * 4, 129 - i * 9, 6, 2, '#3a2418'); for (let j = 0; j < 2; j++) VL(258 + i * 2 + j * (36 - i * 8), 131 - i * 9, 9, '#e8c05a'); }
      R(324, 78, 22, 72, '#c8922f'); R(326, 80, 18, 68, '#e8b84a'); R(328, 82, 14, 64, '#b8d0dc');
      withA(0.4, () => { for (let i = 0; i < 12; i++) P1(330 + i, 90 + i * 2, '#ffffff'); });
      withA(0.35, () => { R(328, 128, 14, 18, '#7a5a42'); R(328, 100, 14, 28, '#4a7280'); R(334, 110, 6, 16, '#c8452f'); });
      dressForm(346, F);
      plaque(346, F - 64, 'THE SUIT', '#6a4a2a', '#f4f0e6');
      // behind the counter: folded sweaters, handbags on hooks, a radio
      K.wallShelf(364, 104, 104, '#8a6a4a'); K.wallShelf(364, 138, 104, '#8a6a4a');
      for (let i = 0; i < 5; i++) foldedStack(368 + i * 20, 104, [CLOTH[i], CLOTH[i + 3], CLOTH[i + 1], CLOTH[i + 5]]);
      for (let i = 0; i < 5; i++) { const c = ['#8a2a2a', '#c8a070', '#2a2a30', '#b04a6a', '#3a6ba8'][i], m = K.ramp(c), bx = 372 + i * 19; R(bx, 138 - 12, 12, 10, m.m); HL(bx, 126, 12, m.h); VL(bx, 126, 10, m.l); for (let j = 0; j < 5; j++) P1(bx + 3 + j + (j > 2 ? 0 : 0), 124 - (j === 0 || j === 4 ? 0 : 1), '#3a2418'); P1(bx + 6, 129, '#e8c05a'); }
      // the fitting room
      const cm = K.ramp('#b04a6a');
      R(484, 84, 40, F - 84, '#3a3440'); HL(482, 84, 42, '#c8ccd8');
      for (let i = 486; i < 522; i += 3) { R(i, 86, 3, F - 90, i % 2 ? cm.m : cm.l); VL(i + 2, 86, F - 90, cm.d); }
      plaque(503, 72, 'TRY ME', '#2f6a7a', '#f4f0e6');
    },
    window: {
      frame: '#2f6a7a', seed: 23,
      deco(x, y, w, h) {
        dressForm(x + 20, F);
        garment(x + 52, y + 16, 'dress', '#b04a6a', { seed: 3 }); garment(x + 62, y + 16, 'coat', '#3a6ba8', { seed: 4 }); HL(x + 46, y + 16, 28, '#c8ccd8');
        draw('hatCowboy', x + 20, F - 57);
        R(x + 31, y + h - 14, 30, 9, '#f4f0e6'); gfx.text('ALL $5', x + 46, y + h - 12, '#b04a6a', { align: 'center', font: 'small' });
        const m = K.ramp('#e8e2d6');
        R(x - 4, y + h + 4, w + 8, 4, m.m); HL(x - 4, y + h + 4, w + 8, m.h);
      },
    },
    live: [
      { id: 'curtain', draw(g, t) { const k = Math.round(Math.sin(t * 0.8) * 1.5); for (let j = 0; j < 8; j++) P1(486 + k + (j % 3), F - 6 - j, '#8a2a4a'); } },
      { id: 'motes', draw(g, t) { for (let i = 0; i < 8; i++) { const k = (t * 0.04 + i * 0.125) % 1; withA(0.45, () => P1(60 + ((i * 37) % 80) + Math.round(Math.sin(t + i) * 4), 110 + Math.round(k * 90), '#ffffff')); } } },
    ],
    counter: { wood: '#6a4a3a', top: '#8a6a4a', stripe: '#b04a6a', items(x, top) {
      R(4, top - 16, 40, 16, '#b8d0dc'); withA(0.4, () => R(5, top - 15, 38, 14, '#ffffff')); for (let i = 0; i < 6; i++) { P1(10 + i * 6, top - 6, ['#e8c05a', '#c8ccd8', '#d8263a', '#4ac8e8'][i % 4]); P1(11 + i * 6, top - 6, '#ffffff'); } HL(4, top - 16, 40, '#e8eef4');
      R(60, top - 8, 12, 8, '#8a4a2a'); HL(60, top - 8, 12, '#c8844a'); R(62, top - 6, 5, 4, '#e8dcc0'); P1(69, top - 5, '#e8c05a'); VL(70, top - 14, 6, '#3a3440');
    } },
    lights: [{ x: 190, y: 90, rx: 80, ry: 60, color: '#ffe0c0', alpha: 0.09 }, { x: 300, y: 100, rx: 80, ry: 60, color: '#ffe0c0', alpha: 0.08 }, { x: 420, y: 100, rx: 80, ry: 60, color: '#ffe0c0', alpha: 0.08 }],
    ambient: { color: '#3a5a6a', alpha: 0.12 },
    customers: [
      { name: 'Bea', species: 'fox', outfit: 'sweater', x: 290, look: { hat: 'bowler' }, lines: ["Does this hat say 'mysterious'? {p}Pearl says it says 'uncle'.", "I only came in for mittens. {p}I'm leaving with a hat, a lamp, and a very old waffle iron."] },
      { name: 'Old Moe', species: 'goose', outfit: 'coat', x: 196, range: 10, look: { glasses: true }, lines: ["This was my coat. {p}I gave it away in 1987. {p}I'm buying it back. It still fits. Mostly.", "Everything comes back round in Moose Hollow. {p}Coats. Hats. People."] },
      { name: 'Rosa', species: 'deer', outfit: 'casual', x: 250, lines: ["Look at this sweater. {p}It has a moose on it. {p}The moose has a sweater on. {p}I need it.", "Pearl pressed my graduation dress in here. {p}Fifteen years ago. {p}She remembers the colour."] },
    ],
    extras: [
      { x: 334, w: 26, hint: 'The suit', lines: ["The brown suit. Merle wore it. Merle got the job. {p}Pearl keeps it on the form in between. {p}She calls it 'the lucky one'."] },
      { x: 484, w: 40, hint: 'Fitting room', lines: ["The fitting room. The curtain doesn't quite close. {p}It never has. {p}Everybody in town has seen everybody in town's socks."] },
    ],
    loose: [['mitten', null, 214]],
  };

  // ==========================================================================
  // 7. LOON & GROOVE
  // ==========================================================================
  ROOMS.records = {
    ceil: ['dark', '#1a1a2a'], crown: '#2a2440', doorWood: '#3a3458', boardStyle: { bg: '#241c38', ink: '#9fdcff' },
    walls() {
      R(0, 51, W, F - 51, '#2a3058'); K.speck(0, 51, W, F - 51, '#343a66', 0.6, 71, 3000); K.speck(0, 51, W, F - 51, '#222850', 0.6, 72, 3000);
      K.band(0, 51, W, 14, '#000000', 0.2);
      K.wainscot(0, F - 44, W, 44, '#241c38', { pw: 22 });
      K.baseboard(0, F, W, '#141020');
    },
    floor() { K.floorChecker(F, W, CH.H - F, '#2a2238', '#4a3f62'); },
    paint() {
      K.garland(0, 260, 56, 6, 'lights', ['#ff6a7a', '#ffd84a', '#3ad6a0', '#9fdcff']);
      K.garland(260, 524, 56, 6, 'lights', ['#ffd84a', '#3ad6a0', '#9fdcff', '#ff6a7a']);
      // gig posters, wheat-pasted
      poster(144, 72, 26, 34, '#e8b84a', ['LOON', 'LAKE', 'FRI'], '#2a1a30');
      poster(174, 78, 24, 30, '#e05a9a', ['SAD', 'GUITAR', 'NITE'], '#ffffff');
      poster(202, 70, 28, 36, '#3ad6a0', ['THE', 'MOOSE', 'TONES'], '#1a2a24');
      poster(234, 80, 22, 26, '#f4f0e6', ['JAZZ', 'SUN'], '#c8352b');
      // a guitar on the wall, the neon, and the album wall
      VL(274, 70, 4, '#8a8f9c'); draw('guitar', 274, 72);
      for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) albumCover(292 + c * 18, 78 + r * 18, 14, r * 3 + c + 5);
      // the crates
      recordBin(140, F, 62, 81, 'ROCK'); recordBin(206, F, 62, 82, 'CANADIAN'); recordBin(272, F, 44, 83, 'JAZZ');
      // the listening station
      const sm = K.ramp('#3a3050');
      R(322, F - 26, 26, 3, sm.l); HL(322, F - 26, 26, sm.h); R(324, F - 23, 2, 23, sm.d); R(344, F - 23, 2, 23, sm.d);
      R(326, F - 30, 18, 4, '#2a2630'); HL(326, F - 30, 18, '#4a4454'); E(333, F - 30, 5, 1, '#0e0c12');
      E(338, F - 32, 2, 2, '#8a8f9c'); plaque(334, F - 42, 'LISTEN', '#e05a9a', '#ffffff');
      // behind the counter: records faced out
      for (let r = 0; r < 3; r++) { K.wallShelf(366, 104 + r * 22, 100, '#3a3050'); for (let c = 0; c < 6; c++) albumCover(370 + c * 16, 90 + r * 22, 13, r * 7 + c + 31); }
      // the big speakers in the corner
      draw('speaker', 494, F); draw('speaker', 510, F); draw('speaker', 502, F - 15);
    },
    window: {
      frame: '#3a3458', seed: 27,
      deco(x, y, w, h) {
        for (let i = 0; i < 4; i++) { const rx = x + 12 + i * 18, ry = y + 16 + (i % 2) * 8; VL(rx, y + 3, ry - y - 3, '#8a8f9c'); E(rx, ry + 6, 6, 6, '#0e0c12'); E(rx, ry + 6, 5, 5, '#1e1a24'); E(rx, ry + 6, 2, 2, ['#e05a9a', '#3ad6a0', '#ffd84a', '#9fdcff'][i]); P1(rx - 3, ry + 3, '#4a4454'); }
        R(x + 14, y + h - 14, 52, 9, '#0e0c12'); gfx.text('USED VINYL', x + 40, y + h - 12, '#9fdcff', { align: 'center', font: 'small' });
        const m = K.ramp('#241c38'); R(x - 4, y + h + 4, w + 8, 4, m.m); HL(x - 4, y + h + 4, w + 8, m.h);
      },
    },
    live: [
      { id: 'neon', draw(g, t) {
        const on = Math.sin(t * 11) > -0.92, c = on ? '#ff6ad8' : '#8a3a7a';
        R(282, 124, 50, 14, '#0e0c12'); gfx.text('VINYL', 307, 128, c, { align: 'center' });
        if (on) { withA(0.12, () => E(307, 131, 30, 10, '#ff6ad8')); CH.emit(307, 131, 10, '#ff5ad0', 0.9); }
      } },
      { id: 'spin', draw(g, t) {
        const cx = 333, cy = F - 30, a = t * 5;
        E(cx, cy, 6, 1.4, '#141218'); P1(Math.round(cx + Math.cos(a) * 4), cy, '#6a6474'); P1(cx, cy, '#e05a9a');
        if (Math.floor(t * 2) % 2) { const k = (t * 0.7) % 1; withA(1 - k, () => note(340 + k * 6, F - 50 - k * 12, '#9fdcff')); }
      } },
      { id: 'lava', draw(g, t) {
        const x = 462, yb = F - 34;
        R(x - 3, yb - 2, 8, 2, '#8a8f9c'); R(x - 2, yb - 20, 6, 18, '#3a1a4a'); R(x - 3, yb - 22, 8, 2, '#8a8f9c');
        for (let i = 0; i < 3; i++) { const k = (Math.sin(t * 0.5 + i * 2.1) + 1) / 2; E(x + 1, Math.round(yb - 4 - k * 14), 2, 2, '#ff6ad8'); }
        CH.emit(x + 1, yb - 11, 4, '#ff6ad8', 0.7);
      }, layer: 'front' },
      { id: 'notes', draw(g, t) { for (let i = 0; i < 2; i++) { const k = (t * 0.4 + i * 0.5) % 1; withA(1 - k, () => note(500 + i * 10 + Math.round(Math.sin(t * 2 + i) * 3), F - 44 - k * 20, '#ffd84a')); } } },
    ],
    counter: { wood: '#2a2440', top: '#4a3f62', stripe: '#6a5ad8', items(x, top) {
      R(40, top - 5, 24, 5, '#2a2630'); HL(40, top - 5, 24, '#4a4454'); E(52, top - 5, 8, 1.6, '#0e0c12'); R(60, top - 8, 1, 4, '#c8ccd8');
      for (let i = 0; i < 4; i++) albumCover(70 + i * 3, top - 14 + i, 12, 90 + i);
    } },
    lights: [{ x: 200, y: 90, rx: 80, ry: 60, color: '#b8a0ff', alpha: 0.08 }, { x: 307, y: 131, rx: 40, ry: 30, color: '#ff6ad8', alpha: 0.12, flicker: 11 }, { x: 420, y: 110, rx: 80, ry: 60, color: '#ffd09a', alpha: 0.08 }],
    ambient: { color: '#2a2050', alpha: 0.2 },
    customers: [
      { name: 'Moss', species: 'skunk', outfit: 'hoodie', x: 334, look: { face: 'happy' }, lines: ["Listening station's the best seat in town. {p}Free. Warm. {p}Dex only kicks you out after three albums.", "This one skips on track four. {p}It's better with the skip. {p}The skip is my favourite part."] },
      { name: 'Lee', species: 'raccoon', outfit: 'casual', x: 222, range: 10, lines: ["The Canadian bin is enormous. {p}We're a nation of sad guitars and one very happy fiddle.", "I've been flipping through this crate since noon. {p}Yesterday."] },
      { name: 'Gord', species: 'bear', outfit: 'vest', x: 170, lines: ["Found my own band in here. {p}Fifty cents. {p}That's about right.", "Vinyl sounds warmer. {p}Everything sounds warmer. It's minus eighteen outside."] },
    ],
    extras: [{ x: 206, w: 62, hint: 'CANADIAN bin', promptY: F - 50, lines: ["The Canadian bin. It's the biggest one. {p}Loons on half the covers. Snow on the other half. {p}One album is just a man and a canoe."] }],
    loose: [['can', null, 250]],
  };

  // ==========================================================================
  // 8. ANTLER PHARMACY
  // ==========================================================================
  ROOMS.pharmacy = {
    ceil: ['drop', '#eef2f4'], crown: '#3a8a6a', doorWood: '#3a8a6a',
    walls() {
      R(0, 51, W, F - 107, '#dfeee6'); K.speck(0, 51, W, F - 107, '#d0e4da', 0.5, 81, 2000);
      R(0, F - 60, W, 4, '#3a8a6a'); HL(0, F - 60, W, '#5aaa8a'); HL(0, F - 57, W, '#2a6a4a');
      K.tiles(0, F - 56, W, 56, '#f4f8f6', { tw: 7, th: 6, stagger: false, alt: '#d8ece2' });
      K.baseboard(0, F, W, '#2a6a4a');
    },
    floor() { K.floorVinyl(F, W, CH.H - F, '#d8e4e0'); },
    paint() {
      for (const lx of [180, 300, 420]) K.pendant(lx, 46, 6, 'tube');
      const aisle = (x, seed, label) => {
        const ys = K.shelves(x, F, 96, 124, '#e8eef0', 4, { back: '#c8d6d0' });
        K.boxes(x + 4, ys[0], 88, seed, ['#f4f8f6', '#e8f4ff', '#fff4e0', '#f4e8f8'], { minW: 6, maxW: 9, minH: 8, maxH: 11, label: '#3a8a6a' });
        for (let i = 0; i < 12; i++) draw(i % 3 ? 'pillBottle' : 'rxBox', x + 9 + i * 7, ys[1]);
        K.boxes(x + 4, ys[2], 88, seed + 1, ['#c8352b', '#3a6ba8', '#e8b84a', '#4a8a5a'], { minW: 7, maxW: 10, minH: 8, maxH: 12 });
        for (let i = 0; i < 9; i++) { const c = ['#f4f0ea', '#9fdcff', '#f8c8d8'][i % 3]; R(x + 7 + i * 10, ys[3] - 10, 7, 10, c); HL(x + 7 + i * 10, ys[3] - 10, 7, '#ffffff'); R(x + 8 + i * 10, ys[3] - 12, 5, 2, '#3a8a6a'); R(x + 8 + i * 10, ys[3] - 7, 5, 3, '#3a8a6a'); }
        K.hangSign(x + 48, 76, label, '#3a8a6a', '#e8fff4', { chain: 8 });
      };
      aisle(140, 101, 'COLD & FLU'); aisle(240, 111, 'VITAMINS');
      poster(342, 78, 12, 40, '#fff4e0', ['F', 'L', 'U'], '#c8352b');
      // prescriptions: shelves of amber bottles behind the pharmacist
      R(364, 92, 104, 9, '#3a8a6a'); HL(364, 92, 104, '#5aaa8a'); gfx.text('PRESCRIPTIONS', 416, 94, '#e8fff4', { align: 'center', font: 'small' });
      for (let r = 0; r < 3; r++) { K.wallShelf(366, 116 + r * 18, 100, '#e8eef0'); for (let i = 0; i < 13; i++) draw('pillBottle', 371 + i * 7.5, 116 + r * 18); }
      draw('mortar', 476, F - 60); K.wallShelf(468, F - 60, 20, '#e8eef0');
      // the blood-pressure machine
      const bm = K.ramp('#e8eef0');
      R(490, F - 50, 26, 30, bm.m); HL(490, F - 50, 26, bm.h); VL(490, F - 50, 30, bm.l); VL(515, F - 50, 30, bm.d);
      R(494, F - 46, 18, 8, '#1a2a24'); gfx.text('120', 503, F - 45, '#3ad6a0', { align: 'center', font: 'small' });
      R(492, F - 20, 22, 4, '#3a8a6a'); R(498, F - 16, 3, 16, '#8a8f9c'); R(506, F - 16, 3, 16, '#8a8f9c'); E(509, F - 30, 4, 3, '#3a6ba8');
      K.plant(478, F, 'fern');
    },
    window: {
      frame: '#3a8a6a', seed: 31,
      deco(x, y, w, h) {
        R(x + 4, y + 6, 46, 10, '#fff4e0'); gfx.text('FLU SHOTS', x + 27, y + 8, '#c8352b', { align: 'center', font: 'small' });
        draw('mortar', x + w - 20, y + h + 3); draw('rxBox', x + 20, y + h + 3); draw('rxBox', x + 29, y + h + 3); draw('pillBottle', x + 38, y + h + 3);
        const m = K.ramp('#e8eef0'); R(x - 4, y + h + 4, w + 8, 4, m.m); HL(x - 4, y + h + 4, w + 8, m.h);
        R(x + 36, y + h - 18, 30, 12, '#3a8a6a'); R(x + 49, y + h - 16, 4, 8, '#ffffff'); R(x + 47, y + h - 14, 8, 4, '#ffffff');
      },
    },
    live: [
      { id: 'tubes', draw(g, t) { if (Math.sin(t * 17) > 0.985) withA(0.14, () => R(390, 52, 60, 4, '#ffffff')); } },
      { id: 'bp', draw(g, t) { if (Math.floor(t * 2) % 2) P1(511, F - 40, '#c8352b'); CH.emit(503, F - 43, 4, '#3ad6a0', 0.5); } },
    ],
    counter: { wood: '#e8eef0', top: '#3a8a6a', stripe: '#3a8a6a', items(x, top) {
      for (let i = 0; i < 3; i++) R(20 + i * 8, top - 8, 6, 8, ['#f8c8d8', '#ffe8a0', '#c8f0d8'][i]);
      R(18, top - 10, 26, 2, '#8a8f9c'); gfx.text('CANDY', 31, top - 16, '#3a8a6a', { align: 'center', font: 'small' });
      R(58, top - 6, 16, 6, '#f4f8f6'); HL(58, top - 6, 16, '#ffffff'); VL(62, top - 12, 6, '#8a8f9c'); R(60, top - 13, 10, 2, '#c8ccd8');
    } },
    lights: [{ x: 180, y: 90, rx: 90, ry: 70, color: '#f0fff8', alpha: 0.09 }, { x: 300, y: 90, rx: 90, ry: 70, color: '#f0fff8', alpha: 0.09 }, { x: 420, y: 90, rx: 90, ry: 70, color: '#f0fff8', alpha: 0.09 }],
    ambient: { color: '#4a6a5a', alpha: 0.06 },
    customers: [
      { name: 'Agnes', species: 'goose', outfit: 'coat', x: 502, dy: -8, pose: 'sit', seat: true, flip: true, look: { glasses: true }, lines: ["One-twenty over eighty. {p}Same as my mother. {p}She lived to a hundred and two out of spite.", "I come in every Tuesday for the machine. {p}And the gossip. Mostly the gossip."] },
      { name: 'Big Lou', species: 'moose', outfit: 'winter', x: 196, lines: ["Cough drops. The honey ones. {p}Nadia hides them. {p}She says it's so they last the winter.", "I asked for something for my back. {p}She gave me a chair. {p}It worked."] },
      { name: 'Mia', species: 'cat', outfit: 'hoodie', x: 290, lines: ["Vitamin C, vitamin D, vitamin 'please let me sleep'.", "Whole town gets the flu in February. {p}It's like a festival nobody signs up for."] },
    ],
    extras: [{ x: 486, w: 34, hint: 'BP machine', lines: ["The blood pressure machine. {p}I sit down. It squeezes. It says 'please remain calm'. {p}That's what raises it."] }],
  };

  // ==========================================================================
  // 9. TACKLE & TWINE
  // ==========================================================================
  ROOMS.bait = {
    ceil: ['beams', '#4a3020'], crown: '#5a3a20', doorWood: '#5a3a20',
    walls() {
      K.knotty(0, 51, W, F - 51, '#c8924f', 7);
      K.baseboard(0, F, W, '#5a3a20');
    },
    floor() { K.floorPlanks(F, W, CH.H - F, '#6a4a2a', 61); K.rug(300, F + 6, 60, 12, '#3a6a8a', '#e8e2d2'); },
    paint() {
      // nets hung from the beams, with floats
      for (let i = 0; i < 18; i++) { const x0 = 140 + i * 6; gfx.line(x0, 52, x0 + 6 + Math.round(Math.sin(i) * 2), 62 + (i % 3), '#5a4a3a'); }
      for (let i = 0; i < 5; i++) E(146 + i * 22, 62 + (i % 2) * 2, 3, 2, i % 2 ? '#e05a4a' : '#f4f0e6');
      // the rod rack
      const rm = K.ramp('#6a4424');
      R(140, F - 20, 56, 6, rm.m); HL(140, F - 20, 56, rm.h); R(140, 118, 56, 4, rm.m); HL(140, 118, 56, rm.h);
      for (let i = 0; i < 8; i++) {
        const rx = 144 + i * 7, top = 76 + (i % 3) * 6;
        VL(rx, top, F - 14 - top, i % 2 ? '#2a2a30' : '#5a3a2a');
        for (let j = top + 10; j < F - 40; j += 16) P1(rx + 1, j, '#c8ccd8');
        R(rx - 1, F - 36, 3, 14, '#c89a5a'); HL(rx - 1, F - 30, 3, '#8a6a3a');
        draw('reel', rx + 1, F - 30 + (i % 2) * 2);
      }
      plaque(168, 108, 'RODS', '#3a2418', '#f5c33b');
      // the lure wall
      K.pegboard(202, 84, 80, 60, '#a8784a');
      const LC = [['#e05a4a', '#ffd84a'], ['#3ad6a0', '#1a1418'], ['#f4f0e6', '#e05a4a'], ['#ffd84a', '#3a6ba8'], ['#8a5aa8', '#f4f0e6'], ['#e8864a', '#4a8a5a']];
      for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) { const [a, b] = LC[(r * 3 + c) % LC.length], lx = 208 + c * 9, ly = 88 + r * 14; P1(lx, ly - 1, '#3a3440'); draw('lure', lx, ly, { remap: { a, b } }); }
      plaque(242, 76, 'LURES', '#3a2418', '#f5c33b');
      // minnow tank, with the trophy that didn't get away above it
      aquarium(290, F, 54, 34);
      R(292, F - 12, 50, 8, '#f4f0e6'); gfx.text('MINNOWS $3', 317, F - 11, '#2f6a8a', { align: 'center', font: 'small' });
      const pm = K.ramp('#6a4424');
      R(286, 80, 64, 30, pm.m); HL(286, 80, 64, pm.h); VL(286, 80, 30, pm.l); VL(349, 80, 30, pm.dd);
      E(318, 94, 24, 7, '#4a7a4a'); E(316, 92, 18, 4, '#7aaa6a'); E(300, 94, 3, 3, '#e8e2c0'); P1(300, 93, '#141018');
      for (let i = 0; i < 6; i++) VL(342 + (i % 3), 90 + i, 3, '#4a7a4a');
      for (let i = 0; i < 6; i++) P1(306 + i * 5, 96, '#2a4a2a');
      R(300, 104, 36, 5, '#c8922f'); gfx.text('1994', 318, 104, '#3a2418', { align: 'center', font: 'tiny' });
      // behind the counter: reels, spools of line, boxes of hooks, the lake map
      K.wallShelf(364, 104, 100, '#6a4424'); K.wallShelf(364, 136, 100, '#6a4424');
      for (let i = 0; i < 10; i++) draw('reel', 370 + i * 10, 104);
      for (let i = 0; i < 12; i++) draw('spool', 369 + i * 8, 136, { remap: { c: ['#3ad6a0', '#e05a4a', '#ffd84a', '#9fdcff'][i % 4] } });
      K.picture(372, 72, 40, 26, '#3a2418', 'map');
      K.picture(420, 74, 26, 22, '#3a2418', 'fish');
      // crossed snowshoes, an auger, the stove
      for (const s of [-1, 1]) { for (let j = 0; j < 30; j++) { const sx = 470 + s * (j - 15) * 0.4, sy = 78 + j; P1(Math.round(sx - 3), sy, '#8a5a2b'); P1(Math.round(sx + 3), sy, '#8a5a2b'); if (j % 4 === 2) HL(Math.round(sx - 2), sy, 5, '#c8a070'); } }
      R(478, F - 64, 2, 60, '#8a8f9c'); for (let j = 0; j < 14; j += 2) HL(475, F - 18 + j, 8, '#c8ccd8'); R(476, F - 66, 6, 3, '#c8352b');
      woodStove(494, F);
    },
    window: {
      frame: '#5a3a20', seed: 35, lake: false,
      deco(x, y, w, h) {
        // the worm cooler and ice-fishing tip-ups
        const cm = K.ramp('#3a7ad8');
        R(x + 6, F - 22, 36, 22, cm.m); HL(x + 6, F - 22, 36, cm.h); R(x + 6, F - 26, 36, 5, '#f4f0e6'); HL(x + 6, F - 26, 36, '#ffffff'); R(x + 20, F - 28, 8, 2, '#c8ccd8');
        gfx.text('WORMS', x + 24, F - 17, '#f4f0e6', { align: 'center', font: 'small' });
        for (let i = 0; i < 3; i++) { const tx = x + 52 + i * 9; VL(tx, F - 30, 30, '#8a5a2b'); R(tx + 1, F - 30, 5, 4, '#e05a4a'); }
        R(x + 16, y + 8, 48, 10, '#f5c33b'); gfx.text('LIVE BAIT', x + 40, y + 10, '#3a2418', { align: 'center', font: 'small' });
        const m = K.ramp('#6a4424'); R(x - 4, y + h + 4, w + 8, 4, m.m); HL(x - 4, y + h + 4, w + 8, m.h);
      },
    },
    live: [
      { id: 'tank', draw(g, t) {
        for (let i = 0; i < 5; i++) { const k = (t * (0.12 + i * 0.02) + i * 0.2) % 2, u = k < 1 ? k : 2 - k, fx = Math.round(294 + u * 44), fy = F - 40 + i * 4 + Math.round(Math.sin(t * 2 + i) * 1.5); R(fx, fy, 3, 1, '#c8ccd8'); P1(k < 1 ? fx - 1 : fx + 3, fy, '#8a8f9c'); }
        for (let i = 0; i < 4; i++) { const k = (t * 0.6 + i * 0.25) % 1; P1(334 + (i % 2), Math.round(F - 20 - k * 28), '#e8f8ff'); }
      } },
      { id: 'stove', draw(g, t) { for (let i = 0; i < 4; i++) R(499 + i * 3, F - 10 - Math.round(2 + Math.sin(t * 8 + i) * 1.5), 2, 3, i % 2 ? '#ff9a3c' : '#ffe070'); CH.emit(505, F - 12, 5, '#ff8a2a', 0.8 + Math.sin(t * 8) * 0.15); } },
    ],
    counter: { wood: '#6a4424', top: '#8a5a2b', stripe: '#2f6a8a', items(x, top) {
      R(24, top - 10, 16, 10, '#c8352b'); HL(24, top - 10, 16, '#e8604a'); for (let i = 0; i < 3; i++) R(26 + i * 5, top - 8, 3, 6, '#f4f0e6');
      R(60, top - 12, 14, 12, '#3a3440'); HL(60, top - 12, 14, '#5a5462'); R(62, top - 10, 5, 5, '#8a8f9c'); VL(72, top - 18, 6, '#c8ccd8');
    } },
    lights: [{ x: 168, y: 100, rx: 70, ry: 60, color: '#ffd09a', alpha: 0.08 }, { x: 318, y: 190, rx: 40, ry: 30, color: '#9fdcff', alpha: 0.1 }, { x: 505, y: 200, rx: 36, ry: 24, color: '#ff9a3c', alpha: 0.14, flicker: 7 }, { x: 416, y: 110, rx: 80, ry: 60, color: '#ffd09a', alpha: 0.08 }],
    ambient: { color: '#5a3a2a', alpha: 0.12 },
    customers: [
      { name: 'Captain Pike', species: 'dog', outfit: 'coat', x: 240, look: { mustache: true }, lines: ["Eleven inches on the lake. {p}I've driven on nine. {p}I don't recommend nine.", "See that pike on the wall? {p}Bartleby says it's the one that didn't get away. {p}I say it's the one that gave up."] },
      { name: 'Moe', species: 'moose', outfit: 'flannel', x: 318, lines: ["Just watching the minnows. {p}They're doing laps. {p}Good for them.", "Bought a jig in 1979. {p}Still haven't used it. {p}Saving it for the right fish."] },
    ],
    extras: [
      { x: 286, w: 64, hint: 'The trophy', promptY: F - 140, lines: ["A pike, mounted over the tank. The plaque says 1994. {p}The fish's expression says 'I would like to speak to a manager'."] },
      { x: 290, w: 54, hint: 'Minnow tank', lines: ["The minnow tank. {p}They look happy. {p}I'm not going to think about what they're for."] },
    ],
    loose: [['puck', null, 230]],
  };


  // ==========================================================================
  // GOODS for the garage, barber shop and arcade
  // ==========================================================================
  const tireStack = (x, yb, n) => {
    for (let i = 0; i < n; i++) {
      const y = yb - 7 * (i + 1) + 1, dx = (i % 2) ? 1 : 0;
      R(x + dx, y, 24, 7, '#1e1a20'); HL(x + dx, y, 24, '#3a3440'); HL(x + dx, y + 6, 24, '#0e0c10');
      for (let j = 2; j < 22; j += 3) { P1(x + dx + j, y + 2, '#3a3440'); P1(x + dx + j + 1, y + 4, '#3a3440'); }
      VL(x + dx, y + 1, 5, '#2a2630'); VL(x + dx + 23, y + 1, 5, '#141218');
    }
  };
  const toolChest = (x, yb, w, h, c = '#c8352b') => {
    const m = K.ramp(c);
    R(x, yb - h, w, h - 3, m.m); HL(x, yb - h, w, m.h); VL(x, yb - h, h - 3, m.l); VL(x + w - 1, yb - h, h - 3, m.dd);
    for (let yy = yb - h + 4; yy < yb - 8; yy += 5) { HL(x + 2, yy, w - 4, m.dd); R(x + 4, yy + 2, w - 8, 1, '#c8ccd8'); }
    R(x + 1, yb - 3, 4, 3, '#1e1a20'); R(x + w - 5, yb - 3, 4, 3, '#1e1a20');
    draw('wrench', x + 5, yb - h - 12); draw('pliers', x + 12, yb - h - 11);
  };
  const carSide = (x, yb, w, col) => {
    const m = K.ramp(col), gl = '#9fc8e0';
    R(x + 3, yb - 17, w - 6, 11, m.m); HL(x + 3, yb - 17, w - 6, m.h); HL(x + 3, yb - 7, w - 6, m.dd);
    VL(x + 3, yb - 17, 11, m.l); R(x, yb - 13, 4, 6, m.m); R(x + w - 4, yb - 13, 4, 6, m.m);
    const cx0 = Math.round(x + w * 0.24), cw = Math.round(w * 0.5);
    for (let j = 0; j < 9; j++) { const ins = Math.max(0, 4 - Math.floor(j / 2)); R(cx0 + ins, yb - 26 + j, cw - ins * 2, 1, m.m); }
    R(cx0 + 4, yb - 24, (cw >> 1) - 5, 6, gl); R(cx0 + (cw >> 1) + 1, yb - 24, (cw >> 1) - 5, 6, gl); P1(cx0 + 5, yb - 23, '#ffffff');
    HL(cx0 + 3, yb - 26, cw - 6, m.h);
    R(x + w - 5, yb - 14, 3, 2, '#fff4c0'); R(x + 1, yb - 14, 2, 2, '#e05a4a');
    for (const wx of [x + 12, x + w - 13]) { E(wx, yb - 5, 6, 6, '#141018'); E(wx, yb - 5, 3, 3, '#8a8f9c'); P1(wx - 1, yb - 6, '#c8ccd8'); }
    HL(x + 20, yb - 12, w - 40, m.d);
  };
  const vending = (x, yb) => {
    const m = K.ramp('#c8352b');
    R(x, yb - 52, 30, 52, m.m); HL(x, yb - 52, 30, m.h); VL(x, yb - 52, 52, m.l); VL(x + 29, yb - 52, 52, m.dd);
    R(x + 3, yb - 48, 17, 36, '#1a2a3a');
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const cc = ['#c8352b', '#3a6ba8', '#4a9a4a', '#f5c33b'][(r + c) % 4]; R(x + 5 + c * 4, yb - 45 + r * 9, 3, 6, cc); P1(x + 5 + c * 4, yb - 45 + r * 9, '#ffffff'); }
    R(x + 22, yb - 46, 5, 10, '#f4f0e6'); R(x + 23, yb - 32, 3, 5, '#1e1a20');
    R(x + 3, yb - 9, 24, 5, '#1e1a20'); gfx.text('SODA', x + 15, yb - 60, '#f4f0e6', { align: 'center', font: 'small' });
  };
  const plates = (x, y) => {
    const P = [['#f4f0e6', '#2f5a9a', 'ONT'], ['#ffd84a', '#1e1a20', 'MOOSE'], ['#f4f0e6', '#c8352b', 'QC'], ['#9fdcff', '#1e1a20', 'NB'], ['#f4f0e6', '#4a9a4a', 'BC'], ['#ffd84a', '#3a3440', 'YUK']];
    P.forEach(([bg, fg, t], i) => { const px0 = x + (i % 3) * 22, py = y + Math.floor(i / 3) * 12; R(px0 - 1, py - 1, 20, 11, '#1e1a20'); R(px0, py, 18, 9, bg); gfx.text(t, px0 + 9, py + 2, fg, { align: 'center', font: 'tiny' }); P1(px0 + 1, py + 1, '#8a8f9c'); P1(px0 + 16, py + 1, '#8a8f9c'); });
  };
  const barberChair = (cx, yb, c = '#b8352b') => {
    const m = K.ramp(c), ch = K.ramp('#c8ccd8');
    R(cx - 8, yb - 3, 17, 3, ch.m); HL(cx - 8, yb - 3, 17, ch.h);
    R(cx - 2, yb - 12, 5, 9, ch.d); VL(cx - 2, yb - 12, 9, ch.l);
    R(cx - 9, yb - 16, 19, 5, m.m); HL(cx - 9, yb - 16, 19, m.h); HL(cx - 9, yb - 12, 19, m.dd);
    R(cx + 6, yb - 34, 5, 20, m.m); VL(cx + 6, yb - 34, 20, m.l); VL(cx + 10, yb - 34, 20, m.dd);
    R(cx + 5, yb - 40, 6, 5, m.l); HL(cx + 5, yb - 40, 6, m.h);
    R(cx - 10, yb - 21, 13, 3, ch.m); HL(cx - 10, yb - 21, 13, ch.h); VL(cx - 8, yb - 18, 3, ch.d);
    R(cx - 14, yb - 8, 8, 2, ch.m); VL(cx - 7, yb - 12, 5, ch.d);
  };
  const ornateMirror = (x, y, w, h) => {
    const g = K.ramp('#c8922f');
    R(x - 1, y - 1, w + 2, h + 2, '#3a2410');
    R(x, y, w, h, g.m); HL(x, y, w, g.h); VL(x, y, h, g.l); HL(x, y + h - 1, w, g.dd); VL(x + w - 1, y, h, g.d);
    for (let i = x + 3; i < x + w - 3; i += 4) { P1(i, y + 1, g.h); P1(i, y + h - 2, g.d); }
    R(x + w / 2 - 4, y - 4, 8, 4, g.m); HL(x + w / 2 - 4, y - 4, 8, g.h); P1(x + w / 2, y - 5, g.h);
    gfx.vgrad(x + 3, y + 3, w - 6, h - 6, ['#c8dce8', '#a8c0d0', '#98b0c4']);
    withA(0.5, () => { for (let i = 0; i < Math.min(w, h) - 8; i++) { P1(x + 5 + i, y + h - 6 - i, '#ffffff'); P1(x + 9 + i, y + h - 6 - i, '#ffffff'); } });
    withA(0.25, () => R(x + 3, y + h - 16, w - 6, 10, '#8a6a5a'));
  };
  const barbicide = (x, yb) => { R(x, yb - 12, 7, 12, '#4ac8e8'); withA(0.6, () => R(x + 1, yb - 11, 2, 10, '#c8f4ff')); HL(x, yb - 12, 7, '#e8fbff'); R(x - 1, yb - 13, 9, 2, '#1e1a20'); for (let i = 0; i < 3; i++) VL(x + 1 + i * 2, yb - 17, 6, ['#1e1a20', '#c8352b', '#1e1a20'][i]); };
  const cabinet = (x, yb, w, c, title) => {
    const m = K.ramp(c);
    R(x, yb - 74, w, 74, '#141020'); R(x + 2, yb - 72, w - 4, 70, m.dd);
    for (let j = 0; j < 20; j++) P1(x + 2 + (j % 3), yb - 60 + j * 3, m.m);
    R(x + 2, yb - 80, w - 4, 10, m.m); HL(x + 2, yb - 80, w - 4, m.h); R(x + 4, yb - 78, w - 8, 6, '#0e0c14');
    gfx.text(title, x + w / 2, yb - 77, m.h, { align: 'center', font: 'tiny' });
    R(x + 4, yb - 68, w - 8, 28, '#0e0c14');
    R(x + 2, yb - 38, w - 4, 10, '#2a2238'); HL(x + 2, yb - 38, w - 4, '#4a4260');
    R(x + 8, yb - 36, 2, 4, '#8a8f9c'); E(x + 9, yb - 37, 2, 2, '#e05a4a');
    for (let i = 0; i < 3; i++) E(x + 17 + i * 5, yb - 33, 1.5, 1.5, ['#ffd84a', '#3ad6a0', '#e05a9a'][i]);
    R(x + w / 2 - 5, yb - 22, 10, 8, '#1e1a28'); R(x + w / 2 - 1, yb - 20, 2, 4, '#e8b84a');
    K.band(x, yb - 1, w, 2, '#000000', 0.4);
  };
  const clawMachine = (x, yb, w) => {
    const m = K.ramp('#e05a9a');
    R(x, yb - 30, w, 30, m.m); HL(x, yb - 30, w, m.h); VL(x, yb - 30, 30, m.l); VL(x + w - 1, yb - 30, 30, m.dd);
    R(x + 4, yb - 24, 10, 8, '#1e1a28'); E(x + 9, yb - 21, 2, 2, '#e05a4a'); R(x + w - 12, yb - 22, 8, 6, '#1e1a28');
    R(x, yb - 82, w, 52, '#1e1a28'); R(x + 2, yb - 80, w - 4, 48, '#6a8ab0');
    withA(0.35, () => R(x + 3, yb - 79, w - 6, 46, '#dfeaff'));
    const toys = ['teddy', 'bunny', 'duck', 'teddy', 'robot', 'bunny', 'frog'];
    toys.forEach((n, i) => draw(n, x + 7 + (i % 4) * ((w - 12) / 4) + (i > 3 ? 4 : 0), yb - 32 - (i > 3 ? 8 : 0), { flip: i % 2 === 1, remap: n === 'teddy' && i === 3 ? { m: '#e05a9a', l: '#f8a0c8', d: '#a8306a' } : undefined }));
    R(x, yb - 90, w, 10, m.m); HL(x, yb - 90, w, m.h); gfx.text('CLAW', x + w / 2, yb - 88, '#fff4a0', { align: 'center', font: 'small' });
    HL(x + 3, yb - 78, w - 6, '#8a8f9c');
    withA(0.4, () => { for (let i = 0; i < 20; i++) P1(x + 4 + i, yb - 36 - i * 2, '#ffffff'); });
  };
  const hiScores = (x, y) => {
    R(x - 1, y - 1, 70, 40, '#9fdcff'); R(x, y, 68, 38, '#0e0c14');
    gfx.text('HIGH SCORES', x + 34, y + 3, '#ffd84a', { align: 'center', font: 'small' });
    [['1 CHB', '999990', '#3ad6a0'], ['2 TY', '412000', '#f4f0e6'], ['3 ???', '001200', '#e05a9a']].forEach(([a, b, c], i) => { gfx.text(a, x + 5, y + 12 + i * 8, c, { font: 'small' }); gfx.text(b, x + 63, y + 12 + i * 8, c, { align: 'right', font: 'small' }); });
  };
  const rocketRide = (cx, yb) => {
    const m = K.ramp('#e05a4a');
    R(cx - 12, yb - 5, 25, 5, '#3a3440'); HL(cx - 12, yb - 5, 25, '#5a5462');
    R(cx - 3, yb - 12, 7, 7, '#8a8f9c');
    R(cx - 16, yb - 24, 30, 12, '#f4f0e6'); HL(cx - 16, yb - 24, 30, '#ffffff'); HL(cx - 16, yb - 13, 30, '#c8c4bc');
    for (let j = 0; j < 12; j++) HL(cx + 14, yb - 24 + j, Math.max(0, 7 - Math.abs(j - 6)), m.m);
    R(cx - 20, yb - 22, 5, 8, m.m); R(cx - 20, yb - 28, 7, 5, m.m); R(cx - 20, yb - 13, 7, 4, m.m);
    E(cx + 2, yb - 19, 4, 3, '#4ac8e8'); P1(cx + 1, yb - 20, '#ffffff');
    gfx.text('25c', cx - 6, yb - 23, '#c8352b', { font: 'small' });
  };

  // ==========================================================================
  // 10. SPARKPLUG GARAGE
  // ==========================================================================
  ROOMS.garage = {
    ceil: ['dark', '#2a2a30'], crown: '#3a3a44', doorWood: '#5a5f6a', boardStyle: { bg: '#3a3a44', ink: '#ffd84a' },
    walls() {
      K.blocks(0, 51, W, F - 51, '#8a8f9c');
      for (let x = 0; x < W; x += 12) { R(x, F - 40, 6, 5, '#ffd84a'); R(x + 6, F - 40, 6, 5, '#1e1a20'); }
      HL(0, F - 41, W, '#5a5f6a'); HL(0, F - 35, W, '#5a5f6a');
      K.baseboard(0, F, W, '#3a3a44');
    },
    floor() {
      K.floorConcrete(F, W, CH.H - F, '#6a6a70', { stains: 5, seed: 99 });
      for (let x = 150; x < 320; x += 1) if ((x >> 2) % 2) P1(x, F + 12, '#ffd84a');
      R(228, F + 20, 18, 5, '#2a2a30'); for (let i = 229; i < 245; i += 2) VL(i, F + 21, 3, '#141418');
    },
    paint() {
      for (const lx of [200, 300, 420]) K.pendant(lx, 46, 14, 'cone', '#3a3a44');
      // the service bay door behind the lift
      const dm = K.ramp('#c8ccd8');
      R(146, 72, 170, F - 72, '#5a5f6a');
      for (let yy = 76; yy < F - 4; yy += 11) { R(148, yy, 166, 10, dm.m); HL(148, yy, 166, dm.h); HL(148, yy + 9, 166, dm.dd); }
      for (let i = 0; i < 5; i++) { R(160 + i * 30, 99, 20, 8, '#1a2a3a'); withA(0.4, () => R(161 + i * 30, 100, 8, 3, '#9fc8e0')); }
      R(146, 70, 170, 3, '#3a3a44');
      // the lift, and a car up on it
      for (const px0 of [160, 296]) { R(px0, F - 88, 8, 88, '#ffd84a'); VL(px0, F - 88, 88, '#fff08a'); VL(px0 + 7, F - 88, 88, '#c8a020'); R(px0 - 2, F - 90, 12, 3, '#3a3a44'); for (let j = F - 80; j < F - 4; j += 10) HL(px0 + 1, j, 6, '#c8a020'); }
      R(168, F - 58, 26, 3, '#3a3a44'); R(270, F - 58, 26, 3, '#3a3a44');
      carSide(176, F - 58, 112, '#4a7ab0');
      // under the car: drain pan, creeper, a work light
      R(214, F - 5, 28, 4, '#3a3a44'); HL(214, F - 5, 28, '#5a5462'); withA(0.6, () => R(216, F - 4, 24, 2, '#141418'));
      R(250, F - 6, 30, 3, '#c8352b'); E(254, F - 2, 2, 2, '#1e1a20'); E(276, F - 2, 2, 2, '#1e1a20');
      // tyres and the tool chest
      tireStack(320, F, 5);
      toolChest(346, F, 20, 38);
      // a plastic chair to wait in
      R(116, F - 14, 16, 3, '#e8864a'); HL(116, F - 14, 16, '#ffa868'); R(128, F - 30, 3, 16, '#e8864a'); VL(128, F - 30, 16, '#ffa868'); VL(118, F - 11, 11, '#5a5462'); VL(129, F - 11, 11, '#5a5462');
      // license plates from everywhere Rick's ever towed from, and the calendar
      plates(150, 54 + 26);
      K.picture(224, 74, 30, 34, '#3a3a44', 'text', { lines: ['JAN', 'ZAMBONI', 'OF THE', 'MONTH'], bg: '#f4f0e6', ink: '#3a3a44' });
      // behind the counter: oil, plugs, a coffee pot
      K.wallShelf(364, 106, 100, '#8a8f9c'); K.wallShelf(364, 136, 100, '#8a8f9c');
      for (let i = 0; i < 9; i++) draw('paintCan', 370 + i * 11, 106, { remap: { c: ['#4a9a4a', '#ffd84a', '#3a3440'][i % 3], h: '#ffffff', w: ['#ffd84a', '#1e1a20', '#c8352b'][i % 3] } });
      R(372, 116, 40, 18, '#1e1a20'); gfx.text('PLUGS', 392, 118, '#ffd84a', { align: 'center', font: 'small' }); for (let i = 0; i < 6; i++) { R(375 + i * 6, 126, 2, 5, '#f4f0e6'); P1(375 + i * 6, 125, '#c8ccd8'); }
      R(426, 122, 12, 14, '#1e1a20'); R(427, 126, 10, 8, '#6a3a1c'); HL(427, 126, 10, '#8a5a2c'); R(424, 134, 16, 2, '#3a3a44');
      vending(488, F);
    },
    window: {
      frame: '#5a5f6a', seed: 39,
      deco(x, y, w, h) {
        R(x + 8, y + 8, 50, 10, '#ffd84a'); gfx.text('BOOST $20', x + 33, y + 10, '#1e1a20', { align: 'center', font: 'small' });
        tireStack(x + 4, F, 3);
        for (let i = 0; i < 2; i++) { const jx = x + 40 + i * 14; R(jx, F - 16, 11, 16, '#c8352b'); HL(jx, F - 16, 11, '#e8604a'); R(jx + 2, F - 19, 4, 3, '#1e1a20'); R(jx + 3, F - 12, 5, 6, '#a82a22'); }
        const m = K.ramp('#5a5f6a'); R(x - 4, y + h + 4, w + 8, 4, m.m); HL(x - 4, y + h + 4, w + 8, m.h);
      },
    },
    live: [
      { id: 'lamps', draw(g, t) { const s = Math.round(Math.sin(t * 0.9) * 1); P1(300 + s, 70, '#fff4c0'); } },
      { id: 'sparks', draw(g, t) { const k = t % 4; if (k < 0.6) CH.emit(232, F - 26, 5, '#ffc040', 1 - k); if (k < 0.6) for (let i = 0; i < 6; i++) { const a = i * 1.1 + t * 9, rr = k * 30; P1(Math.round(232 + Math.cos(a) * rr * 0.6), Math.round(F - 30 + Math.sin(a) * rr * 0.3 + k * 20), i % 2 ? '#ffe070' : '#ff9a3c'); } } },
      { id: 'drip', draw(g, t) { const k = (t * 0.8) % 1; P1(228, Math.round(F - 34 + k * 30), '#1e1a20'); } },
      { id: 'vend', draw(g, t) { withA(0.3 + Math.sin(t * 3) * 0.1, () => R(491, F - 48, 17, 36, '#9fdcff')); CH.emit(499, F - 30, 8, '#8fd0ff', 0.45); } },
    ],
    counter: { wood: '#5a5f6a', top: '#8a8f9c', stripe: '#ffd84a', items(x, top) {
      R(22, top - 3, 18, 3, '#f4f0e6'); for (let i = 0; i < 3; i++) HL(23, top - 3 + i, 16, i % 2 ? '#8a8f9c' : '#f4f0e6');
      R(60, top - 10, 14, 10, '#3a3a44'); HL(60, top - 10, 14, '#5a5462'); R(62, top - 8, 6, 4, '#9fdcff'); VL(72, top - 16, 6, '#c8ccd8');
    } },
    lights: [{ x: 200, y: 110, rx: 60, ry: 60, color: '#fff0c0', alpha: 0.1, cone: [8, 70, 110] }, { x: 300, y: 110, rx: 60, ry: 60, color: '#fff0c0', alpha: 0.1, cone: [8, 70, 110] }, { x: 420, y: 110, rx: 60, ry: 60, color: '#fff0c0', alpha: 0.08 }, { x: 500, y: 190, rx: 30, ry: 40, color: '#9fdcff', alpha: 0.1 }],
    ambient: { color: '#3a3a4a', alpha: 0.16 },
    customers: [
      { name: 'Dale', species: 'beaver', outfit: 'vest', x: 124, dy: -3, pose: 'sit', seat: true, lines: ["Rick says an hour. {p}Rick said an hour at nine. {p}It's the same hour. It's just very long.", "I read this magazine already. {p}It's from 2006. {p}The cars in it are very excited about the future."] },
      { name: 'Trish', species: 'fox', outfit: 'coat', x: 230, lines: ["That's my car on the lift. {p}Rick says the noise is 'probably nothing'. {p}Rick charges by the probably.", "The Zamboni calendar is the only calendar in this town. {p}February's the good one."] },
    ],
    extras: [
      { x: 170, w: 120, hint: 'Car on the lift', promptY: F - 96, lines: ["A car up on the lift, getting looked at. {p}It looks embarrassed, the way you do at the doctor's."] },
      { x: 146, w: 70, hint: 'License plates', promptY: F - 130, lines: ["Plates from every province Rick's ever towed from. {p}One just says MOOSE. {p}He won't say where it came from."] },
    ],
    loose: [['can', null, 200], ['can', null, 262]],
  };

  // ==========================================================================
  // 11. THE CLIPPED WHISKER
  // ==========================================================================
  ROOMS.barber = {
    ceil: ['tin', '#f4f0ea'], crown: '#8a2a3a', doorWood: '#8a2a3a',
    walls() {
      K.wallpaper(0, 51, W, F - 51, '#efe4d4', 'dot', { a: '#d8c8b0', b: '#f8f0e4', stripe: 10, stripeC: '#e0a8a8', stripeL: '#f8e8e0', stripeW: 1, sx: 10, sy: 10 });
      K.wainscot(0, F - 52, W, 52, '#8a2a3a', { pw: 24 });
      K.baseboard(0, F, W, '#4a1a22');
    },
    floor() { K.floorChecker(F, W, CH.H - F, '#1e1a20', '#f4f0ea'); },
    paint() {
      // mirrors over a long shelf of jars and tools
      ornateMirror(158, 80, 56, 64); ornateMirror(254, 80, 56, 64);
      const sm = K.ramp('#f4f0ea');
      R(146, F - 58, 180, 5, sm.m); HL(146, F - 58, 180, sm.h); HL(146, F - 54, 180, sm.dd);
      for (const bx of [150, 318]) R(bx, F - 53, 3, 6, '#c8ccd8');
      barbicide(164, F - 58); barbicide(270, F - 58);
      for (let i = 0; i < 3; i++) { const c = ['#e8b84a', '#9fdcff', '#f07a9a'][i]; R(178 + i * 9, F - 68, 6, 10, c); R(179 + i * 9, F - 71, 4, 3, '#1e1a20'); HL(178 + i * 9, F - 68, 6, '#ffffff'); }
      R(210, F - 62, 14, 4, '#1e1a20'); HL(210, F - 62, 14, '#4a4454'); VL(224, F - 60, 6, '#1e1a20');
      for (let i = 0; i < 4; i++) { R(232 + i * 2, F - 58 - (i + 1) * 3, 16, 3, ['#f4f0ea', '#9fdcff', '#f4f0ea', '#f07a9a'][i]); }
      R(286, F - 66, 3, 8, '#8a5a2b'); E(287, F - 67, 3, 2, '#e8dcc0');
      R(296, F - 62, 10, 4, '#c8ccd8'); HL(296, F - 62, 10, '#f4f6fa');
      barberChair(192, F); barberChair(290, F);
      // hairstyle posters
      poster(330, 80, 22, 30, '#f4f0e6', ['THE', 'QUILL'], '#8a2a3a');
      poster(330, 116, 22, 26, '#f4f0e6', ['THE', 'MOOSE'], '#3a3440');
      // behind the counter: tonics, tins of pomade, the radio, Sal's licence
      K.wallShelf(364, 108, 100, '#8a2a3a'); K.wallShelf(364, 138, 100, '#8a2a3a');
      for (let i = 0; i < 10; i++) { const c = ['#3ad6a0', '#e8b84a', '#9fdcff', '#c8352b', '#f4f0e6'][i % 5]; R(368 + i * 10, 108 - 12, 5, 12, c); HL(368 + i * 10, 96, 5, '#ffffff'); R(369 + i * 10, 93, 3, 3, '#1e1a20'); R(368 + i * 10, 101, 5, 3, '#f4f0e6'); }
      for (let i = 0; i < 8; i++) { const c = ['#c8352b', '#3a6ba8', '#1e1a20', '#e8b84a'][i % 4]; R(369 + i * 12, 138 - 5, 9, 5, c); HL(369 + i * 12, 133, 9, '#f4f0e6'); }
      K.picture(476, 84, 30, 24, '#c8922f', 'text', { lines: ['LICENCE', 'NO. 12', 'SAL'], bg: '#f4f0e6', ink: '#3a3440' });
      // the coat rack by the door to the back
      const cr = K.ramp('#4a2e1a');
      R(498, F - 70, 3, 70, cr.m); R(492, F - 2, 15, 2, cr.d); HL(490, F - 70, 19, cr.l);
      garment(488, F - 70, 'coat', '#3a3440', { seed: 2 }); garment(500, F - 70, 'coat', '#8a4a2a', { seed: 3 });
      draw('hatFedora', 498, F - 72);
      K.plant(516, F, 'snakePlant');
    },
    window: {
      frame: '#8a2a3a', seed: 43,
      deco(x, y, w, h) {
        // the waiting bench and a stack of very old magazines
        const m = K.ramp('#6a4a2a');
        R(x - 2, F - 16, w + 4, 4, m.m); HL(x - 2, F - 16, w + 4, m.h); for (const lx of [x + 2, x + w - 4]) R(lx, F - 12, 3, 12, m.d);
        R(x, F - 32, w, 3, m.m); HL(x, F - 32, w, m.h); for (let i = x + 4; i < x + w; i += 12) VL(i, F - 29, 13, m.d);
        for (let i = 0; i < 4; i++) { const c = ['#e05a4a', '#3a6ba8', '#ffd84a', '#f4f0e6'][i]; R(x + w - 18 + (i % 2), F - 17 - i * 2, 14, 2, c); }
        R(x + 18, y + 8, 44, 10, '#f4f0e6'); gfx.text('WALK-INS', x + 40, y + 10, '#8a2a3a', { align: 'center', font: 'small' });
      },
    },
    live: [
      { id: 'pole', draw(g, t) {
        const x = 138, y = 110, h = 34, o = Math.floor(t * 10) % 8;
        R(x - 1, y - 4, 8, 4, '#c8ccd8'); R(x - 1, y + h, 8, 4, '#c8ccd8'); E(x + 3, y - 5, 3, 2, '#f4f6fa');
        gfx.clip(x, y, 6, h);
        R(x, y, 6, h, '#f4f0ea');
        for (let i = -16; i < h + 8; i += 8) for (let j = 0; j < 6; j++) { R(x + j, y + i + o + j - 2, 1, 3, '#c8352b'); R(x + j, y + i + o + j + 2, 1, 2, '#3a6ba8'); }
        gfx.unclip();
        withA(0.3, () => VL(x + 1, y, h, '#ffffff'));
      } },
    ],
    counter: { wood: '#8a2a3a', top: '#f4f0ea', stripe: '#c8922f', items(x, top) {
      R(24, top - 10, 14, 10, '#6a4a2a'); HL(24, top - 10, 14, '#8a6a4a'); R(26, top - 8, 5, 5, '#e8dcc0'); P1(34, top - 6, '#c8922f');
      barbicide(64, top); R(78, top - 3, 12, 3, '#f4f0ea');
    } },
    lights: [{ x: 186, y: 100, rx: 70, ry: 60, color: '#fff4e0', alpha: 0.09 }, { x: 282, y: 100, rx: 70, ry: 60, color: '#fff4e0', alpha: 0.09 }, { x: 420, y: 110, rx: 80, ry: 60, color: '#ffe0c0', alpha: 0.08 }],
    ambient: { color: '#6a4a4a', alpha: 0.08 },
    customers: [
      { name: 'Hector', species: 'bear', outfit: 'casual', x: 190, dy: -4, pose: 'sit', seat: true, flip: true, lines: ["Just a trim. {p}Sal says that every time too. {p}We both know it's not just a trim.", "Twelve dollars since 2009. {p}I tip twelve. {p}We don't talk about it."] },
      { name: 'Nils', species: 'dog', outfit: 'sweater', x: 86, dy: -3, pose: 'sit', seat: true, lines: ["Waiting. {p}This magazine says the Leafs are going all the way. {p}It's from 1993.", "Sal's the only one who can do ears. {p}You'd be surprised how few people can do ears."] },
      { name: 'Pat', species: 'moose', outfit: 'coat', x: 250, lines: ["Antler trim. {p}Don't laugh. {p}It's a very specialised service.", "My daughter's getting married Saturday. {p}I have to look like somebody's dad in photos forever."] },
    ],
    extras: [{ x: 158, w: 152, hint: 'Mirrors', promptY: F - 140, lines: ["Two big mirrors in gold frames. {p}From this angle there are about forty of me. {p}None of us have had a haircut."] }],
  };

  // ==========================================================================
  // 12. PIXEL PALACE
  // ==========================================================================
  const NEON = ['#ff6ad8', '#3ad6a0', '#9fdcff', '#ffd84a'];
  ROOMS.arcade = {
    ceil: ['dark', '#120e1a'], crown: '#1e1830', doorWood: '#3a2f52', boardStyle: { bg: '#1e1830', ink: '#9fdcff' },
    walls() {
      R(0, 51, W, F - 51, '#1e1830');
      const r = rng(505);
      for (let i = 0; i < 160; i++) P1(r.int(0, W - 1), r.int(54, F - 50), r.pick(['#ffffff', '#9fdcff', '#8a7ab0', '#ff6ad8']));
      for (const [px0, py, rr, c] of [[250, 76, 7, '#e8864a'], [120, 70, 4, '#3ad6a0'], [470, 64, 5, '#ff6ad8']]) { E(px0, py, rr, rr, c); E(px0 - 1, py - 1, rr - 2, rr - 2, sh(c, 30)); HL(px0 - rr - 3, py + 1, rr * 2 + 6, sh(c, -30)); }
      K.wainscot(0, F - 40, W, 40, '#2a2238', { pw: 20 });
      K.baseboard(0, F, W, '#0e0a14');
    },
    floor() { K.carpet(F, W, CH.H - F, '#1a1430', NEON); },
    paint() {
      hiScores(150, 72);
      const titles = [['#3ad6a0', 'HOP'], ['#e05a4a', 'ZAP'], ['#3a6ba8', 'BLUE'], ['#ffd84a', 'PEW'], ['#8a5aa8', 'DIG']];
      titles.forEach(([c, t], i) => cabinet(140 + i * 42, F, 38, c, t));
      // the prize wall behind the counter
      R(364, 72, 104, 12, '#0e0c14'); gfx.text('PRIZES', 416, 75, '#ffd84a', { align: 'center', font: 'small' });
      for (let r = 0; r < 3; r++) K.wallShelf(366, 108 + r * 22, 100, '#3a2f52');
      ['teddy', 'bunny', 'robot', 'duck', 'rocket', 'teddy', 'frog'].forEach((n, i) => draw(n, 374 + i * 14, 108, { remap: n === 'teddy' && i > 3 ? { m: '#8a5aa8', l: '#b88ad8', d: '#5a3a7a' } : undefined }));
      ['top', 'drum', 'blocks', 'top', 'kite'].forEach((n, i) => draw(n, 378 + i * 19, 130));
      for (let i = 0; i < 5; i++) draw('jar', 376 + i * 20, 152, { remap: { r: NEON[i % 4], R: '#ffffff', w: '#1e1830' } });
      clawMachine(482, F, 40);
    },
    window: {
      frame: '#3a2f52', seed: 47,
      deco(x, y, w, h) {
        rocketRide(x + 40, F);
        R(x + 10, y + 8, 56, 10, '#0e0c14'); gfx.text('TOKENS 4/$1', x + 38, y + 10, '#ffd84a', { align: 'center', font: 'small' });
        const m = K.ramp('#2a2238'); R(x - 4, y + h + 4, w + 8, 4, m.m); HL(x - 4, y + h + 4, w + 8, m.h);
      },
    },
    live: [
      { id: 'screens', draw(g, t) {
        for (let i = 0; i < 5; i++) {
          const x = 144 + i * 42, y = F - 68, w = 30, h = 28, k = t + i * 1.3;
          gfx.clip(x, y, w, h);
          R(x, y, w, h, ['#0a2a1a', '#2a0a10', '#0a1a3a', '#2a200a', '#1a0a2a'][i]);
          if (i === 0) { for (let j = 0; j < 4; j++) R(x + ((j * 9 + Math.floor(k * 20)) % (w + 6)) - 3, y + 20 - (j % 2) * 8, 5, 2, '#3ad6a0'); R(x + 6, y + 14 - Math.abs(Math.round(Math.sin(k * 5) * 6)), 4, 5, '#ffd84a'); }
          else if (i === 1) { for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) R(x + 3 + c * 5 + Math.round(Math.sin(k * 2) * 2), y + 3 + r * 5, 3, 2, ['#e05a4a', '#ffd84a', '#3ad6a0'][r]); R(x + 12 + Math.round(Math.sin(k * 3) * 9), y + 23, 5, 2, '#9fdcff'); P1(x + 14, y + 22 - Math.floor((k * 30) % 20), '#ffffff'); }
          else if (i === 2) { const hx = x + ((Math.floor(k * 24)) % (w + 10)) - 5; R(x, y + 22, w, 6, '#4a9a4a'); R(hx, y + 15, 6, 7, '#3a7ad8'); P1(hx + 4, y + 16, '#ffffff'); for (let j = 0; j < 3; j++) { const rx = x + ((j * 12 + 4 - Math.floor(k * 10)) % w + w) % w; E(rx, y + 10, 1.5, 1.5, '#ffd84a'); } }
          else if (i === 3) { for (let j = 0; j < 8; j++) { const sx = x + ((j * 7 + 3) % w), sy = y + ((j * 11 + Math.floor(k * 30)) % h); P1(sx, sy, '#ffffff'); } R(x + 12, y + 20, 6, 4, '#ffd84a'); P1(x + 14, y + 19, '#ffd84a'); }
          else { for (let yy = 0; yy < h; yy += 4) HL(x, y + yy, w, '#2a1a3a'); R(x + 4 + Math.round((Math.sin(k) + 1) * 10), y + 8 + Math.round((Math.cos(k * 1.3) + 1) * 6), 4, 4, '#e05a9a'); }
          if (Math.floor(k * 1.5) % 4 === 0) gfx.text('INSERT', x + w / 2, y + 2, '#ffffff', { align: 'center', font: 'small', fit: w - 2 });
          gfx.unclip();
          withA(0.15, () => R(x + 2, y + 2, 5, h - 4, '#ffffff'));
          CH.emit(x + w / 2, y + h / 2, 9, ['#3ad6a0', '#e05a4a', '#4a8ad8', '#ffd84a', '#b86ae8'][i], 0.6);
        }
      } },
      { id: 'neon', draw(g, t) {
        for (let x = 0; x < W; x += 4) { const c = NEON[(Math.floor(x / 20) + Math.floor(t * 4)) % 4]; R(x, 52, 3, 2, c); if (x < 136 || x > 352) R(x, F - 42, 3, 1, c); if (x % 24 === 0) CH.emit(x + 1, 53, 3, c, 0.6); }
        CH.emit(502, F - 56, 12, '#ff9ad8', 0.35);
      } },
      { id: 'claw', draw(g, t) {
        const k = (t * 0.25) % 1, cx = 488 + Math.round((Math.sin(t * 0.6) + 1) * 14), drop = k > 0.7 ? Math.round(Math.sin((k - 0.7) / 0.3 * Math.PI) * 26) : 0;
        VL(cx, 137, 4 + drop, '#c8ccd8'); R(cx - 3, 141 + drop, 7, 2, '#c8ccd8'); P1(cx - 3, 143 + drop, '#c8ccd8'); P1(cx + 3, 143 + drop, '#c8ccd8');
      } },
      { id: 'marquee', draw(g, t) { const i = Math.floor(t * 8) % 12; for (let j = 0; j < 12; j++) P1(366 + j * 9, 70, j === i ? '#ffffff' : '#ffd84a'); } },
    ],
    counter: { wood: '#2a2238', top: '#4a3f62', stripe: '#9fdcff', items(x, top) {
      R(20, top - 18, 14, 18, '#3a2f52'); HL(20, top - 18, 14, '#6a5a8a'); R(22, top - 15, 10, 6, '#0e0c14'); gfx.text('TKN', 27, top - 14, '#ffd84a', { align: 'center', font: 'tiny' }); R(25, top - 6, 4, 2, '#e8b84a');
      for (let i = 0; i < 5; i++) R(56 + i * 3, top - 2 - i, 8, 2, '#f07a9a');
    } },
    lights: [{ x: 244, y: 170, rx: 110, ry: 50, color: '#8a6aff', alpha: 0.12 }, { x: 420, y: 110, rx: 80, ry: 60, color: '#ff9ad8', alpha: 0.07 }, { x: 502, y: 170, rx: 30, ry: 50, color: '#ff6ad8', alpha: 0.1 }],
    ambient: { color: '#1a1040', alpha: 0.28 },
    customers: [
      { name: 'Zip', species: 'rabbit', outfit: 'hoodie', x: 162, height: 0.75, flip: false, lines: ["I'm on level four. {p}Nobody's ever been on level four. {p}Ty says that's not true but I don't believe him.", "Is CHB you? {p}You're like... a LEGEND. {p}Why are you so old?"] },
      { name: 'Nova', species: 'squirrel', outfit: 'track', x: 248, height: 0.85, lines: ["Blue Hedgehog machine's joystick is loose. {p}You have to lean into it. {p}Like life.", "I've got nine hundred tickets. {p}I'm going for the big purple bear. {p}I need four thousand."] },
      { name: 'Grandma June', species: 'goose', outfit: 'cardigan', x: 470, look: { glasses: true }, lines: ["Forty-two tries on the claw. {p}It's rigged. {p}I'm going to win anyway.", "My grandson thinks I come here for him. {p}I come here for the claw."] },
    ],
    extras: [
      { x: 146, w: 70, hint: 'High scores', promptY: F - 146, lines: ["HIGH SCORES. {p}1. CHB - 999,990. {p}That's me. From when I was nine. {p}Eleven years and nobody has beaten it. I peaked in grade four."] },
      { x: 482, w: 40, hint: 'Claw machine', lines: ["The claw machine. {p}The claw has the grip strength of a wet noodle. {p}Grandma June has been at it for an hour. She's winning."] },
    ],
    loose: [['ball', '#3ad6a0', 220]],
  };

})(window.CH);
