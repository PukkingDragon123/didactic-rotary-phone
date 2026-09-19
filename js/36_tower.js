// ============================================================================
// CORPORATE CAREER TOWER: skill tree as a building. 5 upgrades unlock the elevator.
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, fx = CH.fx, A = CH.audio, inp = CH.input, S = CH.state;
  const W = CH.W, H = CH.H;

  const U = (id, name, cost, desc) => ({ id, name, cost, desc });
  CH.TOWER = [
    { floor: 1, name: 'Janitorial', color: '#5f7a94', rooms: [U('mop2', 'Wide Mop', 40, 'Bigger mop head. Mops more per swipe.'), U('bucket2', 'Big Bucket', 35, 'Mop stays clean longer, water lasts longer.'), U('bag2', 'Heavy-Duty Bags', 30, 'Trash bags rip far less often.'), U('rag2', 'Microfibre Rag', 30, 'Wipes tables in bigger strokes.'), U('quicktie', 'Quick-Tie Knots', 25, 'Tie garbage bags in half the time.'), U('wetsign', 'Wet Floor Sign', 20, 'Customers tip a janitor who looks official (+10% tips).'), U('brush2', 'Turbo Brush', 30, 'Scrubs bathroom grime in bigger circles.')] },
    { floor: 2, name: 'Bagging & Fries', color: '#e8752c', rooms: [U('fryer2', 'Hot Fryer', 80, 'Fries cook 30% faster.'), U('basket3', 'Third Basket', 90, 'One more basket at the fryer.'), U('autofill', 'Auto-Fill Nozzles', 120, 'Drinks stop filling at the line by themselves.'), U('autolid', 'Lid Robot', 70, 'Drinks no longer need a lid to pass.'), U('bag3', 'Reinforced Bags', 60, 'Bags basically never rip.'), U('cart', 'Supply Cart', 50, 'Restock slots highlight; soap refills faster.'), U('tips1', 'Tip Jar', 60, '+15% tips on every shift.')] },
    { floor: 3, name: 'Grill & Assembly', color: '#c8352b', rooms: [U('grill2', 'Hotter Grill', 150, 'Patties cook faster.'), U('longburn', 'Forgiving Grill', 120, 'Patties & fries take much longer to burn.'), U('autoflip', 'Auto-Flipper', 200, 'Patties flip themselves at the perfect moment.'), U('snap2', 'Ingredient Magnets', 100, 'Ingredients snap onto the burger from further away.'), U('predict', 'Order Prediction', 140, 'See the next ticket early; kitchen runs faster.'), U('prep2', 'Extra Prep Space', 160, 'Assembly patience is longer (more room to work).'), U('speed1', 'Non-Slip Shoes', 90, 'Chubby walks faster around the restaurant.')] },
    { floor: 4, name: 'Front Counter', color: '#3b6fd6', rooms: [U('pos2', 'Smart Register', 220, 'The register highlights items the customer said.'), U('changecalc', 'Change Calculator', 260, 'One button gives exact change.'), U('headset2', 'New Headset', 240, 'Drive-thru static is halved.'), U('patience1', 'Comfy Queue Mats', 200, 'Customers wait longer before complaining.'), U('tips2', 'Charming Visor', 180, '+20% tips.'), U('mop3', 'Industrial Mop', 120, 'The widest mop in Moose Hollow.'), U('uniform2', 'Tailored Uniform', 150, 'It fits. It actually fits. (+reputation)')] },
    { floor: 5, name: 'Shift Leadership', color: '#7b4fb0', rooms: [U('crew2', 'Hire New Kevin', 320, 'An extra crew member to assign on the floor.'), U('grill3', 'Legendary Grill', 280, 'Patties cook very fast.'), U('wringer', 'Mop Wringer', 240, 'Mop dirt builds half as fast; water never becomes soup.'), U('patience2', 'Free Coffee Station', 255, 'Customers wait much longer.'), U('morale', 'Break Room Couch', 225, 'Coworkers chat less, work more.'), U('incidents', 'Fire Blanket', 240, 'Incidents resolve with one click.'), U('coffee', 'Espresso Machine', 200, 'Chubby loses less energy per shift.')] },
    { floor: 6, name: 'Management', color: '#2f7a4a', rooms: [U('chair', 'Ergonomic Chair', 420, 'Manager tasks get more time.'), U('spreadsheet', 'Spreadsheet Wizardry', 385, 'Inventory targets shown with +/-5% hints.'), U('hr', 'HR Department', 455, 'Schedule constraints are highlighted.'), U('inventoryai', 'Inventory AI', 490, 'Inventory auto-fills to projected demand.'), U('franchise', 'Franchise Handbook', 560, 'Promotions need one fewer shift.'), U('parking', 'Reserved Parking', 350, 'Commute is instant (no walk to work).'), U('tips3', 'Legendary Service', 420, '+30% tips.')] },
    { floor: 7, name: 'Regional', color: '#c8a030', rooms: [U('car', 'Company Car', 900, 'Travel anywhere instantly. Heated seats.'), U('tastebuds', 'Trained Palate', 720, 'Sauce notes are exact, never fuzzy.'), U('saucelab', 'Sauce Lab', 840, 'Two extra taste tests.'), U('regionalbonus', 'Regional Bonus', 780, 'Every shift pays an extra $200.'), U('map', 'Provincial Map', 600, 'Hospital visits take no time.'), U('airmiles', 'Air Miles', 660, 'Mom gets a nicer room (+mood).'), U('pension', 'Pension Plan', 960, 'Interest: +1% of savings each day.')] },
    { floor: 8, name: 'Vice Presidency', color: '#1b3a6a', rooms: [U('thesaurus', 'Buzzword Thesaurus', 1500, 'Extra buzzword tiles in every meeting.'), U('standing', 'Standing Desk', 1250, 'Synergy decays slower.'), U('golf', 'Golf Membership', 1400, 'The board starts every meeting nodding.'), U('synergy', 'Synergy Itself', 1600, 'Pancakes no longer crash the meter.'), U('options', 'Stock Options', 2000, 'Every shift pays +$600.'), U('assistant', 'Executive Assistant', 1750, 'Emails and phone are handled; +energy.'), U('jet', 'Corporate Jet', 2250, 'Purely decorative. Brenda is furious.')] },
    { floor: 9, name: 'C-Suite', color: '#1a1a24', rooms: [U('authority', 'Taste Authority', 3200, 'Burger flaws are underlined for you.'), U('patent', 'Burger Patent', 3600, 'Every shift pays +$1500.'), U('museum', 'Burger Museum', 3000, 'A moose statue of you. +reputation.'), U('veto', 'Executive Veto', 3400, 'Reject a burger for any reason with no penalty.'), U('spatula', 'Golden Spatula', 4000, 'All kitchen games: extra combo bonus.'), U('pickles', 'Pickle Empire', 3800, 'Every shift pays +$1000.'), U('statue', 'Moose Statue Fund', 2800, 'Mom gets flowers every day (+mood).')] },
    { floor: 10, name: 'Penthouse', color: '#f5c33b', rooms: [U('healthplan', 'Health Plan For All', 15000, "Pays $20,000 toward Mom's bill immediately."), U('buym', 'Buy Back The M', 13500, 'The M restaurant is now also a D. Every shift pays +$3000.'), U('brenda', 'Retire Brenda With Honours', 6750, 'Brenda gets Fridays off. She cries. Once.'), U('chubbyday', 'Chubby Day', 5400, 'A provincial holiday. +reputation forever.'), U('rename', "Rename to Chubby's", 40000, 'The big D becomes a big C. Every shift pays +$5000.'), U('hedgehog', 'Blue Hedgehog Sponsorship', 9000, 'Man Egg appears on all cups. +tips.'), U('pancakes', 'Pancake Fridays', 4500, 'Every Friday, pancakes for the crew. +energy.')] },
  ];
  CH.upgradeById = (id) => { for (const f of CH.TOWER) for (const r of f.rooms) if (r.id === id) return r; return null; };
  CH.floorBought = (floor) => CH.TOWER[floor - 1].rooms.filter((r) => S.upgrades[r.id]).length;
  CH.applyUpgradeEffect = (id) => {
    if (id === 'healthplan') { S.billPaid = Math.min(S.bill, S.billPaid + 20000); ui.toast("$20,000 paid toward Mom's bill!", '#8bd06a', 4); if (S.bill - S.billPaid <= 0.5 && CH.onDebtPaid) CH.onDebtPaid(); }
    if (id === 'uniform2' || id === 'museum') S.reputation += 3;
    if (id === 'chubbyday') S.reputation += 10;
  };
  CH.shiftBonusMoney = () => { let b = 0; if (CH.has('regionalbonus')) b += 200; if (CH.has('options')) b += 600; if (CH.has('patent')) b += 1500; if (CH.has('pickles')) b += 1000; if (CH.has('buym')) b += 3000; if (CH.has('rename')) b += 5000; return b; };

  // ==========================================================================
  // FACADE ART
  // The tower is drawn as a cutaway: concrete slabs and piers in front, each
  // upgrade a lit window with a little room behind the glass. Hit rectangles
  // are unchanged - every room still lives at (tx + 8 + i*41, fy - 34, 36, 30).
  // ==========================================================================
  const art = CH.art;
  const CONC = art.mat('#5d6684', { dark: -26, darker: -44, light: 24 });
  const WINH = 23;          // glazed part of a room cell; the rest is its plaque

  const STATE_COL = {
    owned: { frame: '#f5c33b', plaque: '#6b5418', text: '#ffe9a8', tag: '#3f7d34', tagText: '#c7f3ae' },
    afford: { frame: '#3f6ea8', plaque: '#22314f', text: '#cfe2ff', tag: '#2f7a3e', tagText: '#b6f2a8' },
    poor: { frame: '#232c46', plaque: '#1a2238', text: '#7d88a6', tag: '#5a2530', tagText: '#ff9a96' },
    locked: { frame: '#1a2033', plaque: '#151b2c', text: '#3d4762', tag: '#1a2033', tagText: '#3d4762' },
  };

  // --- a little room behind every pane of glass ------------------------------
  // (x, y, w, h) is the interior of the pane. Furniture stands on `fl`.
  function worker(x, b, c) { gfx.ellipse(x, b - 4, 3.2, 4, c); gfx.circle(x, b - 9, 2.6, c); gfx.px(x + 2, b - 10, c); }

  function vignette(f, x, y, w, h, lit) {
    const R = gfx.rect, E = gfx.ellipse, L = gfx.line, T = gfx.text;
    const fl = y + h - 6;                                  // floor line
    const wood = lit ? '#8a5a30' : '#4a5c95';
    const woodD = lit ? '#5a3719' : '#2f3d6d';
    const woodL = lit ? '#bb8546' : '#6d82bf';
    const mtl = lit ? '#cfd4dc' : '#8a99c0';
    const mtlD = lit ? '#8f97a8' : '#51629a';
    const acc = lit ? '#c8352b' : '#9c6180';
    const gls = lit ? '#9fdcff' : '#62a0c8';
    const gold = lit ? '#f5c33b' : '#a8a2ca';
    const sil = lit ? '#6b4620' : '#1b2340';
    const dk = lit ? '#4a2c12' : '#232c55';
    // floor & skirting
    R(x, fl, w, h - (fl - y), lit ? '#c39352' : '#2d3a6c');
    R(x, fl, w, 1, lit ? '#e0b371' : '#42538e');
    R(x, fl - 1, w, 1, dk);
    switch (f) {
      case 1: // janitorial: shelf of bottles, wheeled bucket, mop
        R(x + 1, y + 5, 14, 2, woodD); R(x + 1, y + 4, 14, 1, woodL);
        for (let i = 0; i < 4; i++) { R(x + 2 + i * 3, y + 1, 2, 3, i % 2 ? acc : gls); R(x + 2 + i * 3, y, 2, 1, mtl); }
        R(x + 3, fl - 6, 10, 6, mtlD); R(x + 3, fl - 7, 10, 2, mtl); R(x + 4, fl - 5, 8, 3, gls);
        E(x + 5, fl, 1.4, 1, dk); E(x + 11, fl, 1.4, 1, dk);
        L(x + 22, fl - 1, x + 26, fl - 14, woodL); R(x + 20, fl - 3, 7, 3, lit ? '#e8e0d0' : '#5d6ea8');
        if (lit) worker(x + 30, fl, sil);
        break;
      case 2: // fries: fryer with two baskets, drinks tower
        R(x + 2, fl - 8, 17, 8, mtlD); R(x + 2, fl - 9, 17, 2, mtl);
        R(x + 4, fl - 7, 6, 5, lit ? '#3a2a14' : '#26315c'); R(x + 12, fl - 7, 6, 5, lit ? '#3a2a14' : '#26315c');
        for (let i = 0; i < 3; i++) { R(x + 5 + i * 2, fl - 10, 1, 4, gold); R(x + 13 + i * 2, fl - 10, 1, 4, gold); }
        L(x + 6, fl - 10, x + 5, fl - 14, mtl); L(x + 14, fl - 10, x + 15, fl - 14, mtl);
        R(x + 23, fl - 14, 10, 14, mtlD); R(x + 23, fl - 14, 10, 2, mtl);
        for (let i = 0; i < 3; i++) R(x + 24, fl - 11 + i * 4, 8, 3, i === 1 ? acc : gls);
        if (lit) { for (let i = 0; i < 3; i++) gfx.px(x + 7 + i * 4, fl - 13 - (i & 1), 'rgba(255,255,255,0.5)'); }
        break;
      case 3: // grill: extractor hood, griddle, patties
        R(x + 2, y, 22, 4, mtl); R(x + 2, y + 4, 22, 2, mtlD); R(x + 10, y + 6, 6, 2, mtlD);
        R(x + 3, fl - 7, 20, 7, mtlD); R(x + 3, fl - 8, 20, 2, mtl); R(x + 4, fl - 9, 18, 1, lit ? '#6a6f7c' : '#4a5a8a');
        for (let i = 0; i < 3; i++) { E(x + 8 + i * 6, fl - 10, 2.4, 1.2, lit ? '#6a3f18' : '#2c3763'); E(x + 8 + i * 6, fl - 11, 2, 0.9, lit ? '#8a5a28' : '#37447a'); }
        L(x + 28, y + 2, x + 28, y + 10, mtl); R(x + 26, y + 10, 5, 2, mtl);
        if (lit) worker(x + 28, fl, sil);
        break;
      case 4: // front counter: menu board, till, counter
        R(x + 1, y, 17, 9, dk); R(x + 1, y, 17, 1, mtlD);
        for (let i = 0; i < 3; i++) R(x + 3, y + 2 + i * 2, 13 - i * 4, 1, gold);
        R(x + 2, fl - 8, 22, 8, wood); R(x + 2, fl - 9, 22, 2, woodL); R(x + 2, fl - 2, 22, 2, woodD);
        R(x + 13, fl - 13, 8, 5, mtlD); R(x + 14, fl - 12, 6, 3, gls); R(x + 14, fl - 8, 6, 1, mtl);
        R(x + 27, fl - 11, 6, 11, acc); R(x + 27, fl - 11, 6, 2, gold);
        if (lit) worker(x + 8, fl, sil);
        break;
      case 5: // shift leadership: rota board, coffee urn on a table
        R(x + 1, y, 18, 12, lit ? '#efe9d8' : '#2f3c6c'); gfx.frame(x + 1, y, 18, 12, mtlD);
        for (let i = 0; i < 4; i++) R(x + 3, y + 2 + i * 2, 14 - (i % 2) * 5, 1, i === 1 ? acc : (lit ? '#7a86a0' : '#46558c'));
        R(x + 21, fl - 4, 12, 3, wood); R(x + 22, fl - 1, 2, 1, woodD); R(x + 30, fl - 1, 2, 1, woodD);
        R(x + 23, fl - 12, 8, 8, mtl); R(x + 24, fl - 11, 6, 3, mtlD); R(x + 25, fl - 6, 4, 2, gold);
        R(x + 22, fl - 13, 10, 2, mtlD);
        if (lit) worker(x + 12, fl, sil);
        break;
      case 6: // management: desk, monitor, chair, cabinet
        R(x + 1, y + 1, 7, 9, acc);
        R(x + 6, fl - 6, 18, 3, wood); R(x + 6, fl - 7, 18, 1, woodL); R(x + 7, fl - 3, 2, 3, woodD); R(x + 21, fl - 3, 2, 3, woodD);
        R(x + 11, fl - 14, 10, 7, mtlD); R(x + 12, fl - 13, 8, 5, gls); R(x + 15, fl - 7, 2, 1, mtlD);
        R(x + 26, fl - 12, 7, 12, mtlD); for (let i = 0; i < 3; i++) R(x + 27, fl - 11 + i * 4, 5, 1, mtl);
        if (lit) { R(x + 2, fl - 9, 5, 9, wood); worker(x + 4, fl, sil); }
        break;
      case 7: // regional: wall map, desk, globe
        R(x + 1, y, 16, 12, lit ? '#8fb6c4' : '#2c3c6e'); gfx.frame(x + 1, y, 16, 12, woodD);
        for (let i = 0; i < 5; i++) E(x + 4 + i * 3, y + 3 + (i % 3) * 3, 1.8, 1.4, lit ? '#5e8a4a' : '#3b4c82');
        R(x + 3, y + 7, 12, 1, acc);
        R(x + 19, fl - 6, 14, 3, wood); R(x + 20, fl - 3, 2, 3, woodD); R(x + 30, fl - 3, 2, 3, woodD);
        E(x + 24, fl - 9, 3, 3, lit ? '#4f8fc8' : '#3f5f96'); E(x + 23, fl - 10, 1.4, 1, lit ? '#6ab04a' : '#4d6fa6'); R(x + 23, fl - 6, 3, 1, mtlD);
        if (lit) worker(x + 29, fl, sil);
        break;
      case 8: // VP: projector screen, boardroom table, chairs
        R(x + 1, y, 14, 11, lit ? '#f0ece0' : '#2e3c70'); gfx.frame(x + 1, y, 14, 11, mtlD);
        L(x + 3, y + 8, x + 6, y + 3, acc); L(x + 6, y + 3, x + 9, y + 6, acc); L(x + 9, y + 6, x + 13, y + 1, acc);
        E(x + 19, fl - 4, 13, 2.6, wood); E(x + 19, fl - 5, 13, 2, woodL);
        for (const cx of [x + 10, x + 19, x + 28]) { R(cx - 2, fl - 11, 4, 7, mtlD); E(cx, fl - 12, 2, 2, lit ? '#d8ab7c' : '#46558c'); }
        break;
      case 9: // C-suite: executive desk, trophy, golden spatula
        L(x + 2, y + 1, x + 9, y + 8, gold); R(x + 1, y, 5, 3, gold);
        R(x + 4, fl - 7, 24, 4, wood); R(x + 4, fl - 8, 24, 2, woodL); R(x + 5, fl - 3, 3, 3, woodD); R(x + 24, fl - 3, 3, 3, woodD);
        R(x + 14, fl - 12, 5, 4, gold); R(x + 13, fl - 8, 7, 1, gold); R(x + 16, fl - 13, 1, 1, gold);
        R(x + 29, fl - 10, 4, 10, acc);
        if (lit) worker(x + 9, fl, sil);
        break;
      case 10: // penthouse: chandelier, palm, sofa, skyline view
        R(x + 15, y, 2, 3, gold); E(x + 16, y + 4, 6, 2.4, lit ? '#fff0b0' : '#4a5690');
        for (let i = 0; i < 5; i++) gfx.px(x + 13 + i * 2, y + 6, gold);
        R(x + 2, fl - 6, 3, 6, woodD); E(x + 3, fl - 10, 5, 4, lit ? '#3d7a38' : '#2f4a72'); E(x + 5, fl - 13, 4, 3, lit ? '#4f9d3a' : '#3b5a82');
        R(x + 19, fl - 7, 14, 7, acc); R(x + 19, fl - 10, 14, 3, lit ? '#e05a4e' : '#8a5a72'); R(x + 19, fl - 1, 14, 1, dk);
        if (lit) worker(x + 26, fl - 4, sil);
        break;
    }
  }

  // one upgrade room: reveal, glass, furniture, price sticker, name plaque
  function drawCell(g, rx, ry, rw, rh, floorNo, r, state, hov, t) {
    const C = STATE_COL[state];
    gfx.rect(rx - 1, ry - 1, rw + 2, rh + 2, '#0b1020');                  // window reveal
    if (state === 'locked') {
      gfx.rect(rx, ry, rw, WINH, '#121829');
      vignette(floorNo, rx + 1, ry + 1, rw - 2, WINH - 2, false);
      g.globalAlpha = 0.74; gfx.rect(rx, ry, rw, WINH, '#0b1020'); g.globalAlpha = 1;
      gfx.rect(rx + 2, ry + 4, rw - 4, 3, '#33301f'); gfx.rect(rx + 2, ry + 14, rw - 4, 3, '#33301f');
      gfx.rect(rx + 2, ry + 4, rw - 4, 1, '#463f28'); gfx.rect(rx + 2, ry + 14, rw - 4, 1, '#463f28');
      gfx.line(rx + 3, ry + WINH - 3, rx + rw - 4, ry + 3, '#3c3726');
      const px0 = rx + (rw >> 1) - 3, py0 = ry + 9;
      gfx.rect(px0 + 1, py0 - 3, 4, 4, '#5a6280'); gfx.rect(px0 + 2, py0 - 2, 2, 3, '#121829');
      gfx.rect(px0, py0, 6, 5, '#7d87a8'); gfx.px(px0 + 3, py0 + 2, '#2a3148');
    } else {
      const lit = state === 'owned';
      gfx.vgrad(rx, ry, rw, WINH, lit
        ? ['#fff1cc', '#f7dc9e', '#ecc47e', '#dcae64']
        : hov ? ['#3a4c88', '#34457c', '#2e3d70', '#293665'] : ['#242e58', '#202951', '#1c2449', '#191f40']);
      vignette(floorNo, rx + 1, ry + 1, rw - 2, WINH - 2, lit);
      g.globalAlpha = lit ? 0.20 : 0.09;
      gfx.tri(rx, ry + WINH, rx + 15, ry, rx, ry, lit ? '#fffbe8' : '#b8d8ff');
      g.globalAlpha = 1;
    }
    gfx.rect(rx, ry + WINH - 2, rw, 2, '#2a3148');                        // sill
    gfx.frame(rx, ry, rw, WINH, C.frame);
    if (state === 'owned') {
      gfx.rect(rx + 1, ry, rw - 2, 1, '#ffe9a8');
      gfx.line(rx + rw - 8, ry + 4, rx + rw - 6, ry + 6, '#241f0c'); gfx.line(rx + rw - 6, ry + 6, rx + rw - 3, ry + 2, '#241f0c');
      gfx.line(rx + rw - 8, ry + 3, rx + rw - 6, ry + 5, '#fff0b8'); gfx.line(rx + rw - 6, ry + 5, rx + rw - 3, ry + 1, '#fff0b8');
    } else if (state !== 'locked') {
      const lbl = '$' + r.cost, lw = gfx.textWidth(lbl, 'small') + 4;
      gfx.rect(rx + 1, ry + 1, lw, 7, C.tag);
      gfx.rect(rx + 1, ry + 1, lw, 1, gfx.shade(C.tag, 26));
      gfx.text(lbl, rx + 1 + lw / 2, ry + 2, C.tagText, { align: 'center', font: 'small' });
    }
    gfx.rect(rx, ry + WINH, rw, rh - WINH, C.plaque);
    gfx.rect(rx, ry + WINH, rw, 1, gfx.shade(C.plaque, 24));
    gfx.rect(rx, ry + rh - 1, rw, 1, '#0b1020');
    gfx.text(r.name.length > 9 ? r.name.slice(0, 8) + '.' : r.name, rx + rw / 2, ry + WINH + 1, C.text, { align: 'center', font: 'small' });
    if (hov) gfx.frame(rx - 1, ry - 1, rw + 2, rh + 2, '#fff');
  }

  // a concrete floor slab with a lit top edge and a shadowed soffit
  function slab(x, y, w) {
    gfx.rect(x, y, w, 4, CONC.d);
    gfx.rect(x, y, w, 1, CONC.l);
    gfx.rect(x, y + 1, w, 1, CONC.base);
    gfx.rect(x, y + 3, w, 1, CONC.line);
    gfx.rect(x, y + 4, w, 2, 'rgba(6,8,18,0.5)');
  }

  // the corporate jet: parked on the roof, purely decorative, Brenda is furious
  function jet(x, y) {
    art.blit(x, y, 52, 24, 26, 22, () => {
      const F = '#eef2f8', D = '#c3cad8', R = '#c8352b', G = '#9fdcff';
      gfx.ellipse(26, 14, 20, 4.5, D);
      gfx.ellipse(26, 13, 19, 4, F);
      gfx.tri(6, 10, 15, 10, 3, 15, F);
      gfx.tri(36, 12, 47, 1, 45, 12, F);
      gfx.rect(37, 9, 8, 2, R);
      gfx.tri(20, 16, 34, 16, 13, 21, D);
      for (let i = 0; i < 5; i++) gfx.px(13 + i * 3, 12, G);
      gfx.ellipse(33, 15, 3.4, 2, D);
      gfx.rect(20, 18, 1, 3, '#4a5372'); gfx.rect(31, 18, 1, 3, '#4a5372');
      gfx.text('D', 23, 10, R, { font: 'small' });
    });
  }

  // a solid gold burger the size of a small car
  function burgerStatue(x, y, t) {
    art.blit(x, y, 44, 42, 22, 40, () => {
      const G = '#f5c33b', GD = '#b0821c', GL = '#ffe9a8';
      gfx.rect(6, 32, 32, 8, '#4a5372'); gfx.rect(6, 32, 32, 1, '#727c9c'); gfx.rect(6, 39, 32, 1, '#2b3350');
      gfx.rect(10, 27, 24, 5, '#5d6684'); gfx.rect(10, 27, 24, 1, '#7a849f');
      gfx.ellipse(22, 25, 15, 3.6, GD); gfx.ellipse(22, 24, 14, 3, G);
      gfx.rect(8, 19, 28, 5, GD); gfx.ellipse(22, 19, 15, 2.6, '#d59b26');
      gfx.ellipse(22, 12, 16, 8, GD); gfx.ellipse(22, 11, 15, 7, G);
      gfx.ellipse(17, 8, 7, 3, GL);
      for (const p of [[12, 9], [20, 5], [28, 9], [25, 13]]) gfx.px(p[0], p[1], GL);
    });
    art.effect('spark', x + 6, y - 32, t, 0.8);
  }

  class TowerScene extends CH.Scene {
    constructor(onDone) {
      super(); this.overlay = true; this.onDone = onDone;
      this.floor = S.towerFloor; this.viewFloor = this.floor; this.scrollY = 0; this.sel = null; this.elevT = 0; this.elevating = false;
      this.stars = []; for (let i = 0; i < 40; i++) this.stars.push([Math.random() * W, Math.random() * 120]);
      this.confirm = null;
    }
    enter() { A.play('tower', 1); ui.showMoney = true; }
    exit() { }
    floorY(f) { return H - 40 - (f - 1) * 44 + this.scrollY; }
    update(dt) {
      // scroll target so the view floor is centered-ish
      const target = Math.max(0, (this.viewFloor - 3) * 44);
      this.scrollY = CH.lerp(this.scrollY, target, Math.min(1, dt * 6));
      if (inp.wheel) { this.viewFloor = CH.clamp(this.viewFloor - inp.wheel, 1, 10); A.sfx('blip2'); }
      if (inp.hit('up')) { this.viewFloor = CH.clamp(this.viewFloor + 1, 1, 10); A.sfx('blip2'); }
      if (inp.hit('down')) { this.viewFloor = CH.clamp(this.viewFloor - 1, 1, 10); A.sfx('blip2'); }
      if (inp.hit('cancel') || inp.hit('phone')) { if (this.sel) this.sel = null; else this.close(); inp.eat(); }
      if (this.elevating) { this.elevT += dt; if (this.elevT > 1.6) { this.elevating = false; } }
    }
    close() { A.sfx('back'); CH.game.pop(); if (this.onDone) this.onDone(); }
    tryBuy(r) {
      if (S.upgrades[r.id]) return;
      if (S.money < r.cost) { A.sfx('error'); ui.toast("Can't afford that yet.", '#ff8080', 2); return; }
      CH.addMoney(-r.cost); S.upgrades[r.id] = true; A.sfx('buy'); CH.applyUpgradeEffect(r.id);
      CH.fxParticles.burst(W / 2, H / 2, 20, { color: ['#f5c33b', '#fff', '#8bd06a'], speed: 90, life: 0.7 });
      ui.toast('Purchased: ' + r.name, '#f5c33b', 2.5);
      const f = this.viewFloor;
      if (CH.floorBought(f) >= 5 && S.towerFloor === f && f < 10) { S.towerFloor = f + 1; this.elevating = true; this.elevT = 0; A.sfx('unlock'); A.sfx('elevator'); ui.toast(`Elevator unlocked: Floor ${f + 1} - ${CH.TOWER[f].name}!`, '#8bd06a', 4); this.run((function* (self) { yield 1.2; self.viewFloor = f + 1; })(this)); }
      CH.autosave('Progress saved');
      this.sel = null;
    }
    draw(g) {
      const t = this.t;
      const tx = 90, tw = 300;
      const baseY = this.floorY(1);          // top of the lobby / street datum
      const topY = this.floorY(10) - 40;     // roof deck line
      // ---- night sky --------------------------------------------------------
      gfx.vgrad(0, 0, W, H, ['#070c22', '#0c1234', '#131b46', '#1d2859', '#2a386c']);
      for (const s of this.stars) gfx.px(s[0], s[1], Math.sin(t * 2.1 + s[0] * 0.7) > 0.4 ? '#ffffff' : '#93a6dc');
      gfx.circle(447, 48, 12, '#1a2040'); gfx.circle(445, 46, 11, '#f0ead6');
      gfx.ellipse(441, 43, 2.4, 1.8, '#ddd5bd'); gfx.ellipse(449, 50, 1.8, 1.4, '#ddd5bd'); gfx.ellipse(443, 52, 1.4, 1.1, '#ddd5bd');
      g.globalAlpha = 0.10; gfx.circle(445, 46, 18, '#cfd8ff'); g.globalAlpha = 1;
      for (let i = 0; i < 5; i++) { const cy0 = 22 + i * 13, cw = 70 + i * 24, cx0 = CH.wrap(i * 120 + t * (2 + i), W + cw + 60) - cw - 30; gfx.rect(cx0, cy0, cw, 2, 'rgba(120,140,200,0.10)'); gfx.rect(cx0 + 12, cy0 + 2, cw - 30, 1, 'rgba(120,140,200,0.07)'); }
      // ---- distant city at the horizon ---------------------------------------
      const horiz = baseY + 40;
      if (horiz > 0 && horiz < H + 60) {
        for (let i = 0; i < 16; i++) {
          const bw = 18 + ((i * 7) % 4) * 9, bh = 16 + ((i * 13) % 6) * 10, bx = i * 32 - 12;
          gfx.rect(bx, horiz - bh, bw, bh, '#0e1530');
          gfx.rect(bx, horiz - bh, bw, 1, '#182044');
          for (let k = 0; k < 10; k++) { if ((i * 17 + k * 11) % 4) continue; gfx.px(bx + 3 + (k % 3) * 6, horiz - bh + 4 + ((k * 5) % 5) * 5, '#e8c878'); }
        }
        gfx.rect(0, horiz, W, Math.max(0, H - horiz), '#0a0f22');
      }
      // slow snow over the whole city
      for (let i = 0; i < 28; i++) {
        const fx0 = CH.wrap(i * 41 + Math.sin(t * 0.4 + i) * 16, W);
        const fy0 = CH.wrap(i * 13 + t * (7 + (i % 4) * 6), H);
        gfx.px(fx0, fy0, i % 3 ? 'rgba(210,225,255,0.45)' : 'rgba(255,255,255,0.8)');
      }
      // ---- tower shell -------------------------------------------------------
      const shTop = Math.max(-8, topY), shBot = Math.min(H, baseY + 8);
      if (shBot > shTop) {
        gfx.rect(tx - 8, shTop, tw + 16, shBot - shTop, '#141a2e');
        gfx.rect(tx - 8, shTop, 3, shBot - shTop, '#0c1122');
        gfx.rect(tx + tw + 5, shTop, 3, shBot - shTop, '#0a0f1e');
      }
      // ---- floors -------------------------------------------------------------
      for (let f = 1; f <= 10; f++) {
        const fy = this.floorY(f);
        if (fy < -56 || fy > H + 72) continue;
        const F = CH.TOWER[f - 1];
        const unlocked = f <= S.towerFloor, bought = CH.floorBought(f);
        // interior volume + ceiling strip with its strip lights
        gfx.rect(tx, fy - 40, tw, 40, unlocked ? '#242e4c' : '#161c2c');
        gfx.rect(tx, fy - 40, tw, 6, unlocked ? '#2d385a' : '#1a202f');
        if (unlocked) for (let i = 0; i < 7; i++) gfx.rect(tx + 15 + i * 41, fy - 38, 22, 2, '#65739c');
        gfx.rect(tx, fy - 6, tw, 6, unlocked ? '#1e2740' : '#141926');
        // rooms
        F.rooms.forEach((r, i) => {
          const rx = tx + 8 + i * 41, ry = fy - 34, rw = 36, rh = 30;
          const owned = !!S.upgrades[r.id];
          const hov = inp.mouseIn({ x: rx, y: ry, w: rw, h: rh }) && f === this.viewFloor;
          const state = !unlocked ? 'locked' : owned ? 'owned' : S.money >= r.cost ? 'afford' : 'poor';
          drawCell(g, rx, ry, rw, rh, f, r, state, hov && unlocked, t);
          if (owned) { g.globalAlpha = 0.16; gfx.rect(rx - 2, ry + 26, rw + 4, 10, '#ffd88a'); g.globalAlpha = 1; }
          if (hov && unlocked) { ui.cursor = 'hand'; if (inp.mpressed) { this.sel = r; A.sfx('tap'); inp.eat(); } }
          if (this.sel === r) gfx.frame(rx - 2, ry - 2, rw + 4, rh + 4, Math.sin(this.t * 8) > 0 ? '#fff' : '#f5c33b');
        });
        // concrete piers between the windows
        const piers = [[tx, 8]];
        for (let i = 0; i < 6; i++) piers.push([tx + 44 + i * 41, 5]);
        piers.push([tx + 290, 10]);
        for (const [px0, pw] of piers) {
          gfx.rect(px0, fy - 40, pw, 40, CONC.base);
          gfx.rect(px0, fy - 40, 1, 40, CONC.l);
          gfx.rect(px0 + pw - 1, fy - 40, 1, 40, CONC.dd);
          if (pw > 6) gfx.rect(px0 + 2, fy - 36, pw - 4, 32, CONC.d);
        }
        // slab under this floor
        slab(tx - 5, fy, tw + 10);
        // floor tab on the left
        const lx = tx - 46, ly2 = fy - 34, lw = 42, lh = 27;
        gfx.rect(lx + 2, ly2 + 2, lw, lh, 'rgba(4,6,14,0.55)');
        gfx.rect(lx, ly2, lw, lh, unlocked ? gfx.shade(F.color, -34) : '#1b2132');
        gfx.rect(lx, ly2, lw, 3, unlocked ? F.color : '#262d40');
        gfx.rect(lx, ly2 + lh - 1, lw, 1, '#0b0f1c');
        gfx.rect(lx + lw, ly2 + 9, 4, 3, unlocked ? F.color : '#262d40');
        gfx.text('F' + f, lx + lw / 2, ly2 + 5, unlocked ? '#fff' : '#4e5876', { align: 'center' });
        gfx.text(F.name.slice(0, 10), lx + lw / 2, ly2 + 14, unlocked ? gfx.mix(F.color, '#ffffff', 0.55) : '#454e69', { align: 'center', font: 'small' });
        for (let i = 0; i < 5; i++) gfx.rect(lx + 8 + i * 6, ly2 + 21, 4, 3, i < bought ? '#8bd06a' : unlocked ? '#39415c' : '#242b3d');
        if (unlocked && bought < 5 && f === S.towerFloor && f < 10) {
          const msg = `${5 - bought} more to unlock elevator`;
          const mw = gfx.textWidth(msg, 'small') + 6;
          gfx.rect(tx + tw - 4 - mw, fy - 40, mw, 6, 'rgba(10,8,4,0.75)');
          gfx.text(msg, tx + tw - 6, fy - 39, '#f5c33b', { align: 'right', font: 'small' });
        }
      }
      // ---- elevator shaft ------------------------------------------------------
      const ex = tx + tw + 6;
      const eTop = Math.max(-8, topY), eBot = Math.min(H, baseY + 4);
      if (eBot > eTop) {
        gfx.rect(ex - 3, eTop, 30, eBot - eTop, CONC.dd);
        gfx.rect(ex, eTop, 24, eBot - eTop, '#0a0f1f');
        gfx.rect(ex + 3, eTop, 1, eBot - eTop, '#232c48');
        gfx.rect(ex + 20, eTop, 1, eBot - eTop, '#232c48');
      }
      for (let f = 1; f <= 10; f++) {
        const fy = this.floorY(f);
        if (fy < -44 || fy > H + 48) continue;
        const open = f <= S.towerFloor;
        gfx.rect(ex + 2, fy - 34, 20, 30, open ? '#454f7a' : '#1c2235');
        gfx.rect(ex + 2, fy - 34, 20, 1, open ? '#68749e' : '#242b40');
        gfx.rect(ex + 11, fy - 34, 2, 30, '#10162a');
        gfx.rect(ex + 2, fy - 38, 20, 3, '#1a2135');
        gfx.px(ex + 6, fy - 37, open ? '#8bd06a' : '#3a2020');
        gfx.text('' + f, ex + 16, fy - 38, open ? '#c9d4f0' : '#39415c', { align: 'center', font: 'small' });
      }
      const carF = this.elevating ? CH.lerp(S.towerFloor - 1, S.towerFloor, Math.min(1, this.elevT / 1.2)) : Math.min(this.viewFloor, S.towerFloor);
      const cy = this.floorY(carF);
      if (eBot > eTop) { gfx.rect(ex + 11, eTop, 1, Math.max(0, cy - 40 - eTop), '#5c6890'); gfx.rect(ex + 13, eTop, 1, Math.max(0, cy - 40 - eTop), '#3b456a'); }
      if (cy > -50 && cy < H + 50) {
        gfx.rect(ex + 2, cy - 40, 20, 3, '#6a7492');
        gfx.rect(ex + 2, cy - 38, 20, 36, '#2b3350');
        gfx.vgrad(ex + 3, cy - 37, 18, 34, ['#f2f5fb', '#dbe1ee', '#c2cadc', '#aab3c8']);
        gfx.rect(ex + 7, cy - 37, 10, 2, '#fff7d2');
        g.globalAlpha = 0.3; gfx.tri(ex + 3, cy - 35, ex + 21, cy - 35, ex + 12, cy - 12, '#fff7d2'); g.globalAlpha = 1;
        CH.drawChubby(g, ex + 12, cy - 5, { outfit: S.job === 'janitor' ? 'janitor' : 'uniform', noShadow: true, sx: 0.55, sy: 0.55, face: this.elevating ? 'happy' : 'normal', arm: 'pocket' });
        gfx.rect(ex + 11, cy - 37, 1, 34, '#8c95ab');
        gfx.frame(ex + 2, cy - 38, 20, 36, '#8a93ad');
        gfx.rect(ex + 2, cy - 4, 20, 2, '#4b5474');
      }
      // ---- roof: the absurd part ------------------------------------------------
      const ty = topY;
      if (ty > -80) {
        const deck = ty - 10;                       // the surface things stand on
        gfx.rect(tx - 16, deck, tw + 54, 14, CONC.d);
        gfx.rect(tx - 16, deck, tw + 54, 2, CONC.base);
        gfx.rect(tx - 16, deck, tw + 54, 1, CONC.l);
        gfx.rect(tx - 16, ty + 1, tw + 54, 1, CONC.line);
        gfx.rect(tx - 18, deck - 5, 6, 7, CONC.base); gfx.rect(tx - 18, deck - 5, 6, 1, CONC.l);
        gfx.rect(tx + tw + 34, deck - 5, 6, 7, CONC.base); gfx.rect(tx + tw + 34, deck - 5, 6, 1, CONC.l);
        // helipad + the purely decorative corporate jet
        gfx.ellipse(tx + 72, deck + 3, 40, 4, '#3a4467'); gfx.ellipseOutline(tx + 72, deck + 3, 36, 3.6, '#dcd6c0');
        gfx.text('H', tx + 100, deck, '#dcd6c0', { align: 'center' });
        jet(tx + 66, deck + 2);
        // golden burger monument
        burgerStatue(tx + 232, deck + 2, t);
        // rooftop garden tub, because there is a budget for it
        gfx.rect(tx + 188, deck - 6, 16, 8, '#7d4f28'); gfx.rect(tx + 188, deck - 7, 16, 2, '#a9703c');
        gfx.ellipse(tx + 196, deck - 11, 9, 6, '#2f6a3a'); gfx.ellipse(tx + 193, deck - 14, 5, 4, '#4f9d3a');
        // antenna with its aircraft warning light
        gfx.rect(tx + 276, deck - 30, 3, 32, '#8a93ad'); gfx.rect(tx + 273, deck - 17, 9, 2, '#6a7492'); gfx.rect(tx + 274, deck - 24, 7, 2, '#6a7492');
        const blink = Math.sin(t * 4) > 0;
        gfx.px(tx + 277, deck - 32, blink ? '#ff5050' : '#6a2030');
        if (blink) { g.globalAlpha = 0.35; gfx.circle(tx + 277, deck - 32, 4, '#ff5050'); g.globalAlpha = 1; }
        // elevator machine room
        gfx.rect(ex - 4, deck - 12, 32, 14, CONC.d); gfx.rect(ex - 4, deck - 12, 32, 2, CONC.base); gfx.rect(ex - 4, deck - 12, 32, 1, CONC.l);
        gfx.circle(ex + 12, deck - 5, 4, '#6a7492'); gfx.circle(ex + 12, deck - 5, 1, '#2b3350');
        // the big D, lit, on its pylon
        const sy0 = deck - 44 + Math.round(Math.sin(t * 1.4) * 0.5);
        gfx.rect(tx + 148, sy0 + 24, 5, 22, '#4a5372'); gfx.rect(tx + 148, sy0 + 24, 1, 22, '#6a7492');
        g.globalAlpha = 0.07; gfx.ellipse(tx + 151, sy0 + 13, 46, 17, '#ffcc77'); g.globalAlpha = 1;
        gfx.rrect(tx + 116, sy0, 70, 26, 4, '#8f2419'); gfx.rrect(tx + 118, sy0 + 2, 66, 22, 3, '#c8352b');
        g.save(); g.translate(tx + 124, sy0 + 5); g.scale(2, 2); gfx.text('D', 0, 0, '#f5c33b', { outline: '#8f2419' }); g.restore();
        gfx.text("DONALD'S", tx + 156, sy0 + 6, '#f5c33b', { align: 'center', font: 'small' });
        gfx.text('CORPORATE', tx + 156, sy0 + 14, '#f5c33b', { align: 'center', font: 'small' });
        for (let i = 0; i < 15; i++) gfx.px(tx + 118 + i * 4.5, sy0 + 25, (Math.floor(t * 6) + i) % 4 === 0 ? '#fff' : '#f0a030');
        gfx.text('CAREER TOWER', tx + tw / 2, sy0 - 10, '#9fb6e8', { align: 'center', font: 'small' });
      }
      // ---- lobby & street --------------------------------------------------------
      if (baseY < H + 4 && baseY > -40) {
        const ly = baseY + 6, lh = 34;
        gfx.rect(tx - 8, ly, tw + 16, lh, '#1b2337');
        gfx.rect(tx - 4, ly + 2, tw + 8, lh - 8, '#2a3350');
        // glazed frontage, warm
        for (let i = 0; i < 8; i++) {
          const gx0 = tx - 2 + i * 38;
          gfx.vgrad(gx0, ly + 3, 34, lh - 9, ['#f6e2ae', '#ecce8c', '#dcb570']);
          gfx.rect(gx0 + 33, ly + 3, 2, lh - 9, '#1b2337');
        }
        // reception desk, plants, a waiting bench
        gfx.rect(tx + 96, ly + 15, 46, 10, '#7d4f28'); gfx.rect(tx + 96, ly + 14, 46, 2, '#a9703c');
        CH.drawChubby(g, tx + 120, ly + 15, { outfit: 'uniform', noShadow: true, sx: 0.42, sy: 0.42, face: 'normal', arm: 'pocket' });
        for (const px0 of [tx + 24, tx + 250]) { gfx.rect(px0, ly + 20, 7, 5, '#8a4a2a'); gfx.ellipse(px0 + 3, ly + 16, 6, 5, '#3d7a38'); gfx.ellipse(px0 + 3, ly + 13, 4, 3, '#4f9d3a'); }
        gfx.rect(tx + 176, ly + 20, 26, 3, '#4a5372'); gfx.rect(tx + 178, ly + 23, 2, 3, '#4a5372'); gfx.rect(tx + 198, ly + 23, 2, 3, '#4a5372');
        // revolving door
        gfx.rect(tx + 150, ly + 4, 22, 21, '#20283f'); gfx.rect(tx + 152, ly + 6, 18, 19, '#cfe6f2');
        gfx.rect(tx + 160, ly + 6, 2, 19, '#20283f'); gfx.line(tx + 152, ly + 8, tx + 170, ly + 22, '#9ab6c8');
        gfx.rect(tx + 148, ly + 1, 26, 4, '#8f2419'); gfx.text("DONALD'S", tx + 161, ly + 1, '#f5c33b', { align: 'center', font: 'small' });
        // awning band + sidewalk
        gfx.rect(tx - 8, ly + lh - 6, tw + 16, 6, '#38415f');
        gfx.rect(0, ly + lh, W, Math.max(0, H - ly - lh), '#0d1226');
        gfx.rect(0, ly + lh, W, 2, '#28304a');
        g.globalAlpha = 0.14; gfx.ellipse(tx + 150, ly + lh + 3, 130, 5, '#ffd08a'); g.globalAlpha = 1;
      }
      // ---- HUD (unchanged geometry) ------------------------------------------------
      gfx.rect(0, 0, W, 17, '#0e1220'); gfx.rect(0, 17, W, 1, '#2a3450');
      gfx.text('CAREER TOWER', 6, 4, '#f5c33b'); gfx.text(`Floor ${S.towerFloor} unlocked  -  scroll / ↑↓ to view  -  click a room`, 100, 5, '#ccc', { font: 'small' });
      gfx.text(CH.fmtMoney(S.money), W - 6, 4, '#8bd06a', { align: 'right' });
      // detail card
      if (this.sel) {
        const r = this.sel; const owned = !!S.upgrades[r.id];
        const bx = 8, by = H - 92, bw = 200, bh = 84;
        ui.drawBox(bx, by, bw, bh, { border: '#f5c33b' });
        gfx.text(r.name, bx + 8, by + 8, '#f5c33b');
        gfx.textBlock(r.desc, bx + 8, by + 20, bw - 16, '#fff', { font: 'small' });
        gfx.text(owned ? 'OWNED' : 'Cost: ' + CH.fmtMoney(r.cost), bx + 8, by + 50, owned ? '#8bd06a' : S.money >= r.cost ? '#fff' : '#ff8080');
        if (!owned && ui.button(g, { x: bx + 8, y: by + 64, w: 80, h: 14 }, 'BUY', { color: S.money >= r.cost ? '#4f9d3a' : '#555', sfx: 'tap' })) this.tryBuy(r);
        if (ui.button(g, { x: bx + 100, y: by + 64, w: 80, h: 14 }, 'CLOSE', { color: '#8a3a3a' })) this.sel = null;
      } else {
        gfx.rect(8, H - 40, 200, 32, 'rgba(0,0,0,0.6)'); gfx.text('Buy 5 upgrades on a floor to unlock', 12, H - 36, '#ccc', { font: 'small' }); gfx.text('the elevator to the next floor.', 12, H - 28, '#ccc', { font: 'small' }); gfx.text('Upgrades make the work itself easier.', 12, H - 20, '#f5c33b', { font: 'small' });
      }
      if (ui.button(g, { x: W - 70, y: H - 22, w: 62, h: 14 }, 'LEAVE (Esc)', { color: '#3b5a8f' })) this.close();
      // next job requirement
      const idx = CH.JOBS.indexOf(S.job), next = CH.JOBS[idx + 1];
      if (next) {
        const msg = `Next role: ${CH.JOB_INFO[next].title} needs Floor ${CH.JOB_INFO[next].floor}`;
        const mw = gfx.textWidth(msg, 'small') + 12;
        gfx.rrect(W - mw - 4, 20, mw, 12, 4, '#0e1220');
        gfx.rrect(W - mw - 3, 21, mw - 2, 10, 3, '#1c2740');
        gfx.text(msg, W - 10, 23, '#9fdcff', { align: 'right', font: 'small' });
      }
      CH.fxParticles.draw(g);
    }
  }
  CH.TowerScene = TowerScene;
  CH.SCENES.tower = () => { const s = new CH.Scene(); S.money = 500; s.enter = () => CH.game.push(new TowerScene(() => {})); s.draw = (g) => gfx.rect(0, 0, W, H, '#222'); return s; };
})(window.CH);
