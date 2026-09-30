// ============================================================================
// PIXEL ART - hand-drawn sprites
//
// Every sprite here is drawn pixel by pixel as a little text grid: one letter
// per pixel, looked up in the sprite's palette ('.' is empty). Outlines are
// placed by hand in a dark shade of the thing itself, never plain black, the
// way a sprite sheet is inked. Grids are baked once into a canvas and drawn
// with drawImage, so they cost nothing per frame.
// ============================================================================
(function (CH) {
  const gfx = CH.gfx;
  const PX = (CH.PIX = {});
  const defs = Object.create(null);
  const cache = new Map();

  // PX.def(name, palette, rows, {ax, ay}) - (ax, ay) is the anchor inside the grid
  PX.def = (name, pal, rows, o = {}) => {
    const w = Math.max(...rows.map((r) => r.length)), h = rows.length;
    defs[name] = { pal, rows, w, h, ax: o.ax !== undefined ? o.ax : w >> 1, ay: o.ay !== undefined ? o.ay : h };
    return defs[name];
  };
  PX.has = (n) => !!defs[n];
  PX.info = (n) => defs[n];
  PX.names = () => Object.keys(defs);

  const rgba = (c) => {
    if (!c) return null;
    if (c[0] === '#') {
      const v = c.length === 4 ? c.slice(1).split('').map((q) => q + q).join('') : c.slice(1);
      return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16), 255];
    }
    return null;
  };
  function bake(d, remap) {
    const c = gfx.makeCanvas(d.w, d.h), x = c.getContext('2d');
    const img = x.createImageData(d.w, d.h), data = img.data;
    const pal = remap ? Object.assign({}, d.pal, remap) : d.pal;
    const col = {};
    for (const k in pal) col[k] = rgba(pal[k]);
    for (let j = 0; j < d.h; j++) {
      const row = d.rows[j];
      for (let i = 0; i < row.length; i++) {
        const q = col[row[i]];
        if (!q) continue;
        const o = (j * d.w + i) * 4;
        data[o] = q[0]; data[o + 1] = q[1]; data[o + 2] = q[2]; data[o + 3] = q[3];
      }
    }
    x.putImageData(img, 0, 0);
    return c;
  }
  PX.canvas = (name, remap) => {
    const d = defs[name];
    if (!d) return null;
    const key = remap ? name + '|' + Object.keys(remap).map((k) => k + remap[k]).join() : name;
    let c = cache.get(key);
    if (!c) {
      if (cache.size > 600) cache.clear();
      c = bake(d, remap); cache.set(key, c);
    }
    return c;
  };
  // PX.draw(name, x, y, {remap, flip, scale, sx, sy, alpha, ax, ay, ctx})
  PX.draw = (name, x, y, o = {}) => {
    const d = defs[name];
    if (!d) return;
    const c = PX.canvas(name, o.remap);
    const ctx = o.ctx || gfx.cur;
    const ax = o.ax !== undefined ? o.ax : d.ax, ay = o.ay !== undefined ? o.ay : d.ay;
    const px = Math.round(x), py = Math.round(y);
    const sx = (o.sx || o.scale || 1) * (o.flip ? -1 : 1), sy = o.sy || o.scale || 1;
    if (sx === 1 && sy === 1 && o.alpha === undefined) { ctx.drawImage(c, px - ax, py - ay); return; }
    ctx.save();
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    ctx.translate(px, py); ctx.scale(sx, sy);
    ctx.drawImage(c, -ax, -ay);
    ctx.restore();
  };

  // a palette made from one base colour: outline, dark, mid, light, highlight
  PX.ramp = (base, o = {}) => ({
    k: gfx.shade(base, o.k !== undefined ? o.k : -70),
    d: gfx.shade(base, o.d !== undefined ? o.d : -32),
    m: base,
    l: gfx.shade(base, o.l !== undefined ? o.l : 22),
    h: gfx.shade(base, o.h !== undefined ? o.h : 48),
  });

  // ==========================================================================
  // BURGER PARTS - drawn at the size the kitchen stacks them
  // ==========================================================================
  const BREAD = { k: '#5a2a16', d: '#b4561f', m: '#df7e2c', l: '#f4a446', h: '#ffd68a', s: '#fff4d8', c: '#f8dba4', b: '#e5b573' };

  PX.def('bunTop', BREAD, [
    '.........kkkkkkkk.........',
    '......kkkllllllllkkk......',
    '....kklllhhhhlllllllkk....',
    '...kllhhhslllllllslllmk...',
    '..klhhshlllllsllllllmmmk..',
    '.kllhhllllsllllllslllmmdk.',
    '.klslllllllllllslllllmmdk.',
    'kmllllllslllllllllllmmmddk',
    'kmmllllllllllllslllmmmdddk',
    'kdmmmmmmmmmmmmmmmmmmmmdddk',
    '.kddddddddddddddddddddddk.',
    '..kkkkkkkkkkkkkkkkkkkkkk..',
  ], { ax: 13, ay: 8 });

  PX.def('bunBottom', BREAD, [
    '.kkkkkkkkkkkkkkkkkkkkkkkk.',
    'kccccbcccccccccccbcccbccck',
    'klccccccccbcccccccccccccmk',
    'kmlllllllllllllllllllmmmdk',
    'kdmmmmmmmmmmmmmmmmmmmmmddk',
    '.kddddddddddddddddddddddk.',
    '..kkkkkkkkkkkkkkkkkkkkkk..',
  ], { ax: 13, ay: 4 });

  // the patty's colours come from how cooked it is (see FOOD.patty)
  PX.def('patty', { k: '#3a1a10', d: '#57301a', m: '#7a4424', l: '#9a5a32', h: '#c08050', g: '#2a140c', f: '#e8c0a8' }, [
    '...kkkk.kkkkkkkk.kkkkkk...',
    '..kllllkllhhllllkllllmmk..',
    '.kllhllllllllggglllllmmmk.',
    'kmllgggglllllllllgggglmmdk',
    'kmmllllllggggglllllllmmddk',
    'kdmmmmmmmmmmmmmmmmmmmmdddk',
    '.kdddddddddddddddddddddddk',
    '..kkkkkkkkkkkkkkkkkkkkkkk.',
  ], { ax: 13, ay: 5 });
  PX.def('pattyRaw', { k: '#6a1e28', d: '#a23a48', m: '#c4505e', l: '#dc7480', h: '#f4a8b0', f: '#ffe0e4' }, [
    '...kkkk.kkkkkkkk.kkkkkk...',
    '..kllllkllhhllfllkllllmk..',
    '.kllhlfllmlllllflllmllmmk.',
    'kmlfllllllmlfllllllflmmmdk',
    'kmmllmllfllllllmlllfmmmddk',
    'kdmmmmmmmmmmmmmmmmmmmmdddk',
    '.kdddddddddddddddddddddddk',
    '..kkkkkkkkkkkkkkkkkkkkkkk.',
  ], { ax: 13, ay: 5 });

  PX.def('cheese', { k: '#8a4a12', o: '#e0932a', y: '#f7c531', h: '#ffe98a' }, [
    '.kkkkkkkkkkkkkkkkkkkkkkkkkk.',
    'kyhhhhhyyyyyyyyyhhhyyyyyyyok',
    'kyyyyyyyyyyyyyyyyyyyyyyyyook',
    'kooyyyyyooooyyyyyyooooyyoook',
    '.kkooyokkkkkkoyyokkkkkkoookk',
    '...kook.....kyyk.....kook...',
    '....kk.......kk.......kk....',
  ], { ax: 14, ay: 2 });

  PX.def('lettuce', { k: '#1f4d1c', d: '#3f8f2c', g: '#6cc044', l: '#a6e464', w: '#e0f8b0' }, [
    '.kk..kkk..kkk..kkk..kkk..kk.',
    'kllkklllkklllkklllkklllkkllk',
    'klwllwlllwlllwllwllllwlllwlk',
    'kgglllgggllggglllggglllgggdk',
    '.kdggdkdgggdkdggdkdggdkdddk.',
    '..kk.k..kkk..kk.k..kkk..kk..',
  ], { ax: 14, ay: 3 });

  PX.def('tomato', { k: '#5a1414', R: '#a82820', r: '#e0402f', p: '#ff8a6a', s: '#ffe4a8', h: '#ffc4b0' }, [
    '.kkkkkkkkkkkkkkkkkkkkkkkk.',
    'krhrrrrrrrRkkrhrrrrrrrrRRk',
    'krpsprpsprRkkrpsprpsprpRRk',
    'krppsrppsprRkrppsrppsprpRk',
    'kRrrrrrrrrRRkRrrrrrrrrrRRk',
    '.kkkkkkkkkkk.kkkkkkkkkkkk.',
  ], { ax: 13, ay: 3 });

  PX.def('pickle', { k: '#1c3a12', d: '#3e6e22', g: '#6aa03a', l: '#a8d86a', w: '#e4f5b0' }, [
    '.kkkkkkkkk...kkkkkkkkk.',
    'kglwllwllgk.kglwllwlgdk',
    'kglwglwglgdkkgwlgwlglgk',
    'kdgggggggddkkdgggggggdk',
    '.kkkkkkkkkk...kkkkkkkk.',
  ], { ax: 11, ay: 3 });

  PX.def('onion', { k: '#7a5a8a', p: '#d6bfe6', w: '#f7eefc' }, [
    '.kkkkkkkkk...kkkkkkkkk.',
    'kwwwwpwwwwk.kwwwpwwwwwk',
    'kwpk...kpwkkkwpk...kpwk',
    'kwwwwwwwwpk.kwwwwwwwwpk',
    '.kkkkkkkkk...kkkkkkkkk.',
  ], { ax: 11, ay: 3 });

  PX.def('bacon', { k: '#4a140e', d: '#7a2418', r: '#b8402c', f: '#f4c0a4' }, [
    '..kkkkkk.....kkkkkkk....',
    '.krrfrrrkkk.krrfrrrrkkk.',
    'krfffrrrrrfkkrfffrrrrrfk',
    'krrrrfffrrrkrrrrfffrrrdk',
    '.kkdrrrrrddkkkdrrrrrddk.',
    '....kkkkkkk....kkkkkkk..',
  ], { ax: 12, ay: 3 });

  PX.def('sauce', { k: '#5a1010', c: '#d13c3c', h: '#ff8a7a' }, [
    '.kkk..kkkk..kkkk..kkk.',
    'kchckkcchckkchcckkchck',
    '.kccccccck.kccccccck..',
    '..kkkkkkk...kkkkkkk...',
  ], { ax: 11, ay: 2 });

  // ==========================================================================
  // WHOLE FOODS - 16x16 icons in the style of a food sprite sheet
  // ==========================================================================
  PX.def('burger', {
    k: '#4a2210', d: '#b4561f', m: '#df7e2c', l: '#f4a446', h: '#ffd68a', s: '#fff4d8',
    g: '#3f9a2c', G: '#86d44e', y: '#f7c531', Y: '#ffe98a', p: '#5a2e18', P: '#7c4424', c: '#f8dba4', r: '#e0402f',
  }, [
    '.....kkkkkkk......',
    '...kklllhhllkk....',
    '..klhhslllslllk...',
    '.klhslllllllslmk..',
    '.kllllllsllllmmk..',
    'kmllslllllllmmmdk.',
    'kdmmmmmmmmmmmmddk.',
    'kGgGGgGGgGGgGGgGk.',
    'kyYyyyyyyyyyYyyyk.',
    '.kykrrrkyyyrrrkyk.',
    'kPPPpPPPPpPPPPpPk.',
    'kppPppppppppPpppk.',
    'kpppppppppppppppk.',
    'kccccccccccccccck.',
    'kmllllllllllllmdk.',
    '.kddddddddddddddk.',
    '..kkkkkkkkkkkkkk..',
  ], { ax: 8, ay: 16 });

  // the one left on a tray, with a bite out of it
  PX.def('burgerBitten', PX.info('burger').pal, [
    '.....kkkkk........',
    '...kklllhhk.......',
    '..klhhslllk.......',
    '.klhslllllkk......',
    '.klllllllsllkkk...',
    'kmllslllllllmmdk..',
    'kdmmmmmmmmmmmmddk.',
    'kGgGGgGGgGGgGGgGk.',
    'kyYyyyyyyyyyYyyyk.',
    '.kykrrrkyyyrrrkyk.',
    'kPPPpPPPPpPPPPpPk.',
    'kppPppppppppPpppk.',
    'kpppppppppppppppk.',
    'kccccccccccccccck.',
    'kmllllllllllllmdk.',
    '.kddddddddddddddk.',
    '..kkkkkkkkkkkkkk..',
  ], { ax: 8, ay: 16 });

  PX.def('fry', { k: '#8a4a12', y: '#f7c531', h: '#fff0a0', o: '#e0932a' }, [
    '.k.',
    'khk',
    'kyk',
    'kyk',
    'kyk',
    'kyk',
    'kyk',
    'kok',
    'kyk',
    'kyk',
    'kok',
    'kok',
    'kok',
  ], { ax: 1, ay: 0 });
  PX.def('fryShort', { k: '#8a4a12', y: '#f7c531', h: '#fff0a0', o: '#e0932a' }, [
    '.k.', 'khk', 'kyk', 'kyk', 'kyk', 'kok', 'kyk', 'kok', 'kok', '.k.',
  ], { ax: 1, ay: 0 });
  // fry colours by state: frozen, raw, golden, burnt
  PX.fryPal = (cook, burnt) => {
    if (burnt) return { k: '#1a0e08', y: '#3a2010', h: '#5a3418', o: '#2a160a' };
    if (cook === 'frozen') return { k: '#8a8a78', y: '#e8e2c0', h: '#ffffff', o: '#cfc8a4' };
    const c = gfx.mix('#f0e0a0', '#f2b02a', Math.min(1, cook));
    return { k: gfx.shade(c, -110), y: c, h: gfx.mix(c, '#fff8d8', 0.6), o: gfx.shade(c, -34) };
  };
  const CARTON = { k: '#5a1010', d: '#8f2419', m: '#c8352b', l: '#e8604a', h: '#ff9a80', y: '#f5c33b', Y: '#ffe890' };
  PX.def('cartonS', CARTON, [
    'khhhhhhhhhhk',
    'kllllllllldk',
    '.kmmyymmmdk.',
    '.kmyYYymmdk.',
    '.kmmyymmmdk.',
    '.kmmmmmmmdk.',
    '.kmmmmmmddk.',
    '.kddddddddk.',
    '..kkkkkkkk..',
  ], { ax: 6, ay: 8 });
  PX.def('cartonM', CARTON, [
    'khhhhhhhhhhhhhk',
    'klllllllllllldk',
    '.kmmmyyyymmmdk.',
    '.kmmyYYYymmmdk.',
    '.kmmmyyyymmmdk.',
    '.kmmmmmmmmmmdk.',
    '.kmmmmmmmmmddk.',
    '.kmmmmmmmmmddk.',
    '.kdddddddddddk.',
    '..kkkkkkkkkkk..',
  ], { ax: 7, ay: 9 });
  PX.def('cartonL', CARTON, [
    'khhhhhhhhhhhhhhhhk',
    'kllllllllllllllldk',
    '.kmmmmyyyyymmmmdk.',
    '.kmmmyYYYYYymmmdk.',
    '.kmmmmyyyyymmmmdk.',
    '.kmmmmmmmmmmmmmdk.',
    '.kmmmmmmmmmmmmddk.',
    '.kmmmmmmmmmmmmddk.',
    '.kmmmmmmmmmmmmddk.',
    '.kddddddddddddddk.',
    '..kkkkkkkkkkkkkk..',
  ], { ax: 8, ay: 10 });

  PX.def('nugget', { k: '#6a3410', d: '#b06a24', m: '#daa244', l: '#f2c870', h: '#fff0b8' }, [
    '..kkkkk...',
    '.kllhllkk.',
    'klhlllllmk',
    'kllmlllmdk',
    'kmlllmlmdk',
    '.kddmmdddk',
    '..kkkkkkk.',
  ], { ax: 5, ay: 4 });

  PX.def('pie', { k: '#5a2a10', d: '#a8642a', m: '#d59a48', l: '#f0c070', h: '#fff0c0', r: '#8a2418', R: '#c8402c' }, [
    '.kkkkkkkkkkkkkkkk.',
    'klhhllllllllllllmk',
    'klllrRlllrRlllrRmk',
    'kmlllllllllllllmdk',
    'kmmlmmmlmmmlmmmmdk',
    'kddddddddddddddddk',
    '.kkkkkkkkkkkkkkkk.',
  ], { ax: 9, ay: 4 });

  PX.def('wrapped', { k: '#6a3a08', d: '#c08a1c', m: '#f2c13b', l: '#ffe070', h: '#fff6c0', r: '#c8352b', R: '#e8604a' }, [
    '......kkkkkkkkkkkk......',
    '...kkklhhllllllllmkkk...',
    '..klhhlldlllldllllmmmk..',
    '.klhllldllllldlllllmmdk.',
    '.kllllldlllllldllllmmdk.',
    'kmllllldllrrrrdlllllmmdk',
    'kmmlllldllrRRrrdllllmddk',
    'kmmmmmmdmmrrrrrdmmmmmddk',
    '.kdmmmdmmmmmmmmmdmmmddk.',
    '..kkddddddddddddddddkk..',
    '....kkkkkkkkkkkkkkkk....',
  ], { ax: 12, ay: 6 });

  // ---- a bakery, a coffee shop and a kitchen's worth of icons ----------------
  const DOUGH = { k: '#5a2a16', d: '#a8521c', m: '#d8782a', l: '#f0a044', h: '#ffd68a', s: '#fff4d8' };
  PX.def('croissant', DOUGH, [
    '......kkkkk.......',
    '....kklhhllkk.....',
    '..kkldklllldlkk...',
    '.kllmdkllhldmllk..',
    'kllmmdklllldmmllk.',
    'kmmdkkdlllldkkdmmk',
    '.kkk..kmmmmk..kkk.',
    '.......kkkk.......',
  ], { ax: 9, ay: 8 });
  PX.def('bread', DOUGH, [
    '....kkkkkkkkkk....',
    '..kklhhllllllmkk..',
    '.klhhkllkllkllmmk.',
    'klhllkllkllklllmdk',
    'kllllllllllllllmdk',
    'kmllllllllllllmmdk',
    'kdmmmmmmmmmmmmmddk',
    '.kddddddddddddddk.',
    '..kkkkkkkkkkkkkk..',
  ], { ax: 9, ay: 9 });
  PX.def('cinnamon', Object.assign({}, DOUGH, { c: '#fff8ec', w: '#f0e4d0' }), [
    '....kkkkkkkk....',
    '..kkccwccccckk..',
    '.kcclllllllccck.',
    'kcllmmmmmmlllcck',
    'kclmllllllmllmck',
    'kclmlmmmmlmlmdck',
    'kclmlmhlmlmlmdck',
    'kclmlmmmmlmlmdck',
    'kcllmllllmmlmdkk',
    '.kdlmmmmmmmmddk.',
    '..kkddddddddkk..',
    '....kkkkkkkk....',
  ], { ax: 8, ay: 12 });
  PX.def('muffin', { k: '#3a1c10', d: '#6a3420', m: '#8a4a2c', l: '#b0683a', h: '#d8905a', b: '#3a2a6a', B: '#6a58b0', p: '#f0e4d0', q: '#c8b89a' }, [
    '...kkkkkkkk...',
    '.kkllhlllBlkk.',
    'klhlBllllllmmk',
    'kllllllBllmmdk',
    'kmlBlllllmmddk',
    'kkkkkkkkkkkkkk',
    '.kpqpqpqpqpqk.',
    '.kpqpqpqpqpqk.',
    '..kpqpqpqpqk..',
    '..kkkkkkkkkk..',
  ], { ax: 7, ay: 10 });
  PX.def('donut', { k: '#5a2a16', d: '#b0602a', m: '#d88a44', p: '#f07aa8', P: '#ffb4d0', D: '#c04a7a', s: '#fff4d8', y: '#ffd84a', b: '#5ac8e8' }, [
    '....kkkkkkkk....',
    '..kkPPpppppDkk..',
    '.kPPpspyppbpDDk.',
    'kPpbpppkkppppDDk',
    'kppppDk..kpypDdk',
    'kmpyppDkkDpppDdk',
    'kmmppbpDDppsDddk',
    '.kmmDDppppDDddk.',
    '..kkmmddddddkk..',
    '....kkkkkkkk....',
  ], { ax: 8, ay: 10 });
  PX.def('pretzel', DOUGH, [
    '..kkkk....kkkk..',
    '.klhllk..kllmmk.',
    'klk..kmkkmk..kmk',
    'kmk...kllk...kdk',
    'kmmk.kmkkdk.kddk',
    '.kmmkmk..kdkddk.',
    '..kkmmkkkkddkk..',
    '...kmkdmmdkdk...',
    '...kkk.kk.kkk...',
  ], { ax: 8, ay: 9 });
  PX.def('mug', { k: '#3a2a3a', w: '#f4eee4', W: '#d8ccbc', s: '#a89880', c: '#5a2a10', C: '#8a4a24', f: '#e8c8a0', r: '#c8352b' }, [
    '.kkkkkkkkkk...',
    'kCcfffcccCck..',
    'kwkkkkkkkkwk..',
    'kwwwwwwwwwWkkk',
    'kwwrrrwwwwWk.k',
    'kwwrwrwwwwWk.k',
    'kwwrrrwwwwWkkk',
    'kwwwwwwwwWWk..',
    '.kWWWWWWWWk...',
    '..kkkkkkkk....',
  ], { ax: 6, ay: 10 });
  PX.def('coffeeCup', { k: '#2a2230', w: '#f4f0ea', W: '#cfc8c0', b: '#7a4a2a', B: '#a8683a', l: '#e8e4dc', L: '#b8b0a8' }, [
    '..kkkkkkkkk..',
    '.kllllllllLk.',
    'kkkkkkkkkkkkk',
    '.kwwwwwwwwWk.',
    '.kbbbbbbbbBk.',
    '.kBBbBBBbBBk.',
    '.kbbbbbbbbBk.',
    '..kwwwwwwWk..',
    '..kwwwwwwWk..',
    '..kkkkkkkkk..',
  ], { ax: 6, ay: 10 });
  PX.def('pancakes', { k: '#5a2a16', d: '#b4601f', m: '#e0923a', l: '#f6c070', h: '#fff0c0', y: '#ffe060', Y: '#fff8b0', s: '#9a3a10', S: '#c86a20', p: '#e8eef4', P: '#b8c4d0' }, [
    '.......kkkk.......',
    '......kYyyYk......',
    '...kkkksyyskkkk...',
    '..kllhllsslllmmk..',
    '.kdmmmsmmmmmsmddk.',
    '.kllhllllsllllmmk.',
    '.kdmmmmmmmmmmsmdk.',
    '.kllhlllllllllmmk.',
    '.kddmmmmmmmmmmddk.',
    'kPpppppppppppppPPk',
    '.kkPPPPPPPPPPPPkk.',
    '...kkkkkkkkkkkk...',
  ], { ax: 9, ay: 12 });
  PX.def('apple', { k: '#4a1010', d: '#9a1c22', m: '#d8323a', l: '#f06a5a', h: '#ffd0c0', s: '#5a3016', g: '#4a9a2c', G: '#8ad04e' }, [
    '......ks.kk...',
    '.....ksskGGk..',
    '..kkkkskgGk...',
    '.kllhlkllmmk..',
    'klhhlllllmmdk.',
    'klhllllllmmdk.',
    'kllllllllmmdk.',
    'kmllllllmmddk.',
    '.kmmmmmmmddk..',
    '..kdkkkkddk...',
    '...k....kk....',
  ], { ax: 7, ay: 11 });
  PX.def('eggFried', { k: '#8a8478', w: '#fbfaf4', W: '#e0dccc', y: '#f7b531', Y: '#ffe07a', o: '#d88a1a' }, [
    '...kkkkkk.....',
    '.kkwwwwwwkkk..',
    'kwwwwkkkwwwwk.',
    'kwwwkYyyokwwWk',
    'kwwwkyyyokwWWk',
    '.kwwwkookwwWk.',
    '.kwwwwkkwwWWk.',
    '..kkWWWWWWkk..',
    '....kkkkkk....',
  ], { ax: 7, ay: 9 });
  PX.def('cake', { k: '#4a1a22', w: '#fff4f0', W: '#f0d4d0', p: '#f07a9a', P: '#ffb4c4', s: '#f4d49a', S: '#d8a860', r: '#d8263a', g: '#4a9a2c' }, [
    '........kk....',
    '.......krk....',
    '.....kkrrkk...',
    '...kkwwwwwwk..',
    '.kkwwwwwwwWWk.',
    'kWWwwwwwwWWWk.',
    'kppPpppPppppk.',
    'kssssssssssSk.',
    'kpPppppPppppk.',
    'ksssssssssSSk.',
    'kWWWWWWWWWWWk.',
    '.kkkkkkkkkkk..',
  ], { ax: 7, ay: 12 });
  PX.def('cookie', { k: '#5a2a16', d: '#b0682a', m: '#d8903e', l: '#f0b860', c: '#3a1c10' }, [
    '...kkkkkk...',
    '.kkllllllkk.',
    'kllclllcllmk',
    'kllllllllcmk',
    'kmlcllmlllmk',
    'kmllllcllmdk',
    '.kmmcmmmmdk.',
    '..kkkkkkkk..',
  ], { ax: 6, ay: 8 });
  PX.def('drumstick', { k: '#4a1e0e', d: '#9a4a1a', m: '#c8702a', l: '#e8984a', h: '#ffd08a', b: '#f4eee4', B: '#c8c0b4' }, [
    '..kkkkkk......',
    '.kllhlllkk....',
    'klhlllllmmk...',
    'kllllllmmmk...',
    'kmllllmmmdk...',
    '.kmmmmmddk....',
    '..kkdddkbk....',
    '....kkkbBk.kk.',
    '.......kbkkbk.',
    '.......kbbbBk.',
    '........kkkk..',
  ], { ax: 7, ay: 11 });
  PX.def('carrot', { k: '#5a2408', o: '#e8752c', O: '#ffa458', d: '#b04a14', g: '#3f8a2c', G: '#86d44e' }, [
    '........kGk.k.',
    '......k.kGkGk.',
    '.......kGgGk..',
    '.....kkkkgk...',
    '....kOoooodk..',
    '...kOoodoodk..',
    '...kooooddk...',
    '..kOodoodk....',
    '..koooodk.....',
    '.kooddk.......',
    '.kodk.........',
    '.kk...........',
  ], { ax: 7, ay: 12 });
  PX.def('beans', { k: '#1e1008', d: '#4a2a14', m: '#7a4a24', l: '#a8703a' }, [
    '.kkk..kkk.',
    'kldmkkmldk',
    'kmdmkkmdmk',
    '.kkk..kkk.',
  ], { ax: 5, ay: 4 });
  PX.def('jar', { k: '#2a2030', g: '#c8dce8', G: '#e8f4fa', r: '#b83040', R: '#e86070', l: '#f5c33b', L: '#ffe890', w: '#f4eee4' }, [
    '..kkkkkkkk..',
    '..kLllllLk..',
    '..kkkkkkkk..',
    '.kGgggggggk.',
    'kGrrrrrrrrRk',
    'kGrwwwwwwrRk',
    'kGrwrRrRwrRk',
    'kGrwwwwwwrRk',
    'kGrrrrrrrrRk',
    'kgRrrrrrrRRk',
    '.kkkkkkkkkk.',
  ], { ax: 6, ay: 11 });

  // ==========================================================================
  // TREES
  //
  // A pine is built the way a pixel artist builds one: from hand-drawn bough
  // clumps - a snowy top, green needles, dark underside and drooping tips -
  // laid in tiers, widest at the bottom, each tier overlapping the snow of the
  // one below. The finished tree is baked once per size and colour.
  // ==========================================================================
  const CLUMP = [
    '....kkkk....',
    '..kkSSssk...',
    '.kSssssSSk..',
    'kSsgSsgssSk.',
    'kgglhlgSgdk.',
    'kgllggggddk.',
    '.kgkgddkdk..',
    '..k.kkk.k...',
  ];
  const CLUMP_B = [
    '...kkkkk....',
    '.kkSsssSk...',
    'kSssSSssSk..',
    'kgsgSgssSSk.',
    'kglhlgggdddk',
    '.kglggddddk.',
    '..kgdkgdkk..',
    '...k..k.....',
  ];
  const TOP = [
    '...k...',
    '..kSk..',
    '..kSk..',
    '.kSsSk.',
    '.kssSk.',
    'kSsgsSk',
    'kglgddk',
    '.kgkdk.',
    '..k.k..',
  ];

  // the side away from the light is one step darker
  const SHADE = { h: 'l', l: 'g', g: 'd', s: 'S' };
  // Stamp a grid into an RGBA buffer, letter by letter, through a palette.
  function stamp(buf, W, H, rows, x0, y0, pal, flip) {
    for (let j = 0; j < rows.length; j++) {
      const r = rows[j];
      for (let i = 0; i < r.length; i++) {
        const ch = r[flip ? r.length - 1 - i : i];
        if (ch === '.') continue;
        const x = x0 + i, y = y0 + j;
        if (x < 0 || y < 0 || x >= W || y >= H) continue;
        // an outline pixel never paints over colour already laid down
        if (ch === 'k' && buf[y * W + x] && buf[y * W + x] !== 'k') continue;
        buf[y * W + x] = flip ? (SHADE[ch] || ch) : ch;
      }
    }
  }
  function toCanvas(buf, W, H, pal) {
    const rows = [];
    for (let y = 0; y < H; y++) { let s = ''; for (let x = 0; x < W; x++) s += buf[y * W + x] || '.'; rows.push(s); }
    return rows;
  }
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

  // build a pine of height h (roughly 30..90 px) as a grid; seed varies it
  function pineRows(h, seed) {
    const R = rng(seed * 7919 + h);
    const W = Math.round(h * 0.46) + 12, H = h + 4;
    const buf = new Array(W * H);
    const cx = W >> 1, base = H - 1;
    // trunk
    const tw = h > 60 ? 5 : 4, trunkH = Math.max(6, Math.round(h * 0.12));
    for (let y = base - trunkH; y <= base; y++) for (let x = cx - (tw >> 1); x < cx - (tw >> 1) + tw; x++) {
      const i = x - (cx - (tw >> 1));
      buf[y * W + x] = i === 0 || i === tw - 1 ? 'k' : i === 1 ? 'b' : (y + x) % 5 === 0 ? 'T' : 't';
    }
    for (let x = cx - (tw >> 1) - 1; x <= cx - (tw >> 1) + tw; x++) buf[base * W + x] = 'k';
    // tiers, bottom first; each tier is a sloped bough - clumps laid from the
    // tips inward, the tips lower, so the tier reads as a drooping triangle
    const top = 7, bottom = base - trunkH + 2;
    const tiers = Math.max(3, Math.round(h / 9));
    for (let t = 0; t < tiers; t++) {
      const k = t / (tiers - 1 || 1);                    // 0 bottom .. 1 top
      const y = Math.round(bottom - 8 - k * (bottom - 8 - top - 3));
      const half = Math.round((W / 2 - 7) * Math.pow(1 - k, 0.9) * 0.92) + 3;
      const step = 4;
      const offs = [];
      for (let d = half; d >= 0; d -= step) offs.push(d);
      for (const d of offs) {
        const droop = Math.round((d / Math.max(1, half)) * 4);
        const j = () => Math.round(R() * 2 - 1);
        stamp(buf, W, H, R() < 0.5 ? CLUMP : CLUMP_B, cx - d - 7 + j(), y - 6 + droop + j(), null, false);
        stamp(buf, W, H, R() < 0.5 ? CLUMP : CLUMP_B, cx + d - 4 + j(), y - 6 + droop + j(), null, true);
      }
    }
    stamp(buf, W, H, TOP, cx - 3, top - 5, null, false);
    return { rows: toCanvas(buf, W, H), W, H, cx, base };
  }
  const pineBuilt = new Map();
  PX.pinePal = (c = '#2f6a24', snow = '#eef4fa', snowShade = '#b8c8dc') => ({
    k: gfx.shade(c, -62), d: gfx.shade(c, -26), g: c, l: gfx.shade(c, 20), h: gfx.shade(c, 44),
    s: snow, S: snowShade, t: '#6a4222', T: '#4a2c16', b: '#8a5a30',
  });
  // PX.pine(x, y, h, {c, seed, snow, snowShade, flip}) - (x, y) is the foot of the trunk
  PX.pine = (x, y, h, o = {}) => {
    h = Math.max(24, Math.min(110, Math.round(h / 2) * 2));
    const seed = o.seed || 1, key = 'pine' + h + '_' + seed;
    if (!pineBuilt.has(key)) {
      const p = pineRows(h, seed);
      PX.def(key, PX.pinePal(), p.rows, { ax: p.cx, ay: p.base });
      pineBuilt.set(key, true);
    }
    PX.draw(key, x, y, { remap: o.pal || PX.pinePal(o.c, o.snow, o.snowShade), flip: o.flip, sx: o.sx, alpha: o.alpha });
  };

  // winter birch: white bark with black marks, bare twigs, snow on the branches
  PX.def('birch', { k: '#2a2a30', w: '#f4f4ee', W: '#d4d6d0', g: '#a8aca8', m: '#2a2620', s: '#ffffff', S: '#c8d4e4', t: '#8a8a88' }, [
    '....k........k.....k',
    '....kk......kk....kt',
    '.....tk....kt....kt.',
    '..k...tk..kt...kkt..',
    '..kt...kkkt...ktt...',
    '...kt...kwk..kt.....',
    '....kkk.kwkkkt......',
    'kk....kkkwWk........',
    '.tkk....kwWk...kkk..',
    '..ttkk..kwWk.kktt...',
    '....ttkkkwWkkt......',
    '......kSswWk........',
    '........kmmk........',
    '........kwWk........',
    '.......kwwWWk.......',
    '.......kwwWWk.......',
    '.......kmmwWk..kk...',
    '.kk....kwwWWk.kSsk..',
    '.kskk..kwwWWkkttk...',
    '..kttkkkwwmmktk.....',
    '....kttSswWWk.......',
    '.......kwwWWk.......',
    '.......kwwWWk.......',
    '.......kmmmWk.......',
    '.......kwwWWk.......',
    '.......kwwWgk.......',
    '.......kwwWgk.kkk...',
    '.......kwmmgkkSsk...',
    '.......kwwWgkttk....',
    '.....kkkwwWgkk......',
    '....kSsSwwWgk.......',
    '....kttkwwWgk.......',
    '.......kmmmgk.......',
    '.......kwwWgk.......',
    '.......kwwWgk.......',
    '.......kwwWgk.......',
    '......kwwwmWgk......',
    '......kwwwWWgk......',
    '......kmmwWWgk......',
    '......kwwwWmmk......',
    '......kwwwWWgk......',
    '......kwwwWWgk......',
    '......kwmmWWgk......',
    '......kwwwWWgk......',
    '......kwwwWmmk......',
    '......kwwwWWgk......',
    '.....kwwwwWWggk.....',
    '.....kwmmwWWggk.....',
    '....kwwwwwWWWggk....',
    '..kkSSSSSSSSSSSSkk..',
    '.kSsssssssssssssSSk.',
    '..kkkkkkkkkkkkkkkk..',
  ], { ax: 10, ay: 50 });

  // background forest silhouettes: two tones remapped to the time of day
  PX.def('farPine', { a: '#000', b: '#000' }, [
    '....a....',
    '....a....',
    '...aba...',
    '...aba...',
    '..aabaa..',
    '...aaa...',
    '..abbba..',
    '.aaabaaa.',
    '..aaaaa..',
    '.aabbbaa.',
    'aaaaaaaaa',
    '....a....',
  ], { ax: 4, ay: 12 });
  PX.def('midPine', { a: '#000', b: '#000' }, [
    '.......a.......',
    '.......a.......',
    '......aba......',
    '......aba......',
    '.....abbba.....',
    '....aaabaaa....',
    '.....aaaaa.....',
    '....abbbbba....',
    '...aaaabaaaa...',
    '..a.aaaaaaa.a..',
    '....abbbbba....',
    '...abbbbbbba...',
    '..aaaaabaaaaa..',
    '.a.aaaaaaaaa.a.',
    '...aabbbbbaa...',
    '..abbbbbbbbba..',
    '.aaaaaaaaaaaaa.',
    'a.a.aaaaaaa.a.a',
    '......aaa......',
  ], { ax: 7, ay: 19 });
  PX.def('nearPine', { a: '#000', b: '#000', c: '#000' }, [
    '..........a..........',
    '..........a..........',
    '.........aba.........',
    '.........aba.........',
    '........abbba........',
    '.......aaabaaa.......',
    '........aaaaa........',
    '.......abbbbba.......',
    '......abbbbbbba......',
    '.....aaaaabaaaaa.....',
    '....a.aacaaacaa.a....',
    '.......abbbbba.......',
    '......abbbbbbba......',
    '.....abbbbbbbbba.....',
    '....aaaaaabaaaaaa....',
    '...a.aaacaaacaaa.a...',
    '......abbbbbbbba.....',
    '.....abbbbbbbbbba....',
    '....abbbbbbbbbbbba...',
    '...aaaaaaabaaaaaaaa..',
    '..a.aaacaaaacaaaca.a.',
    '.....abbbbbbbbbbba...',
    '....abbbbbbbbbbbbba..',
    '...abbbbbbbbbbbbbbba.',
    '..aaaaaaaaabaaaaaaaaa',
    '.a.aacaaaacaaacaaaa.a',
    'a...aaaaaaaaaaaaaa...',
    '.........aaa.........',
    '.........aaa.........',
  ], { ax: 10, ay: 29 });
  // the little pines seen through the cabin windows
  PX.def('tinyPine', { k: '#0e2414', g: '#2f6a24', l: '#4a8a34', s: '#ffffff', S: '#c8d8e8', t: '#4a2e18' }, [
    '....k....',
    '...ksk...',
    '...kSk...',
    '..ksSsk..',
    '..kglgk..',
    '.kssSssk.',
    '.kglgggk.',
    'ksSsssSsk',
    'kgglgggdk',
    '.kkgkgkk.',
    '....t....',
  ], { ax: 4, ay: 11 });
})(window.CH);
