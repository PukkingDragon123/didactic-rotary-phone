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
      // sky
      gfx.vgrad(0, 0, W, H, ['#0b1030', '#141c48', '#1f2a5e']); for (const s of this.stars) gfx.px(s[0], s[1], '#fff');
      gfx.rect(0, H - 8, W, 8, '#0a0a10');
      // tower body
      const tx = 90, tw = 300;
      for (let f = 1; f <= 10; f++) {
        const fy = this.floorY(f); const F = CH.TOWER[f - 1];
        const unlocked = f <= S.towerFloor; const bought = CH.floorBought(f);
        gfx.rect(tx, fy - 40, tw, 42, unlocked ? '#2a3350' : '#1a1f30'); gfx.rect(tx, fy - 40, tw, 2, unlocked ? '#4a5a80' : '#2a3040'); gfx.rect(tx, fy, tw, 2, '#0f1420');
        // floor label
        gfx.rect(tx - 40, fy - 30, 38, 20, unlocked ? F.color : '#333'); gfx.text('F' + f, tx - 21, fy - 28, '#fff', { align: 'center' }); gfx.text(F.name.slice(0, 9), tx - 21, fy - 17, '#fff', { align: 'center', font: 'small' });
        // rooms (windows)
        F.rooms.forEach((r, i) => {
          const rx = tx + 8 + i * 41, ry = fy - 34, rw = 36, rh = 30; const owned = !!S.upgrades[r.id];
          const hov = inp.mouseIn({ x: rx, y: ry, w: rw, h: rh }) && f === this.viewFloor;
          gfx.rect(rx, ry, rw, rh, owned ? '#f5e6b0' : unlocked ? (hov ? '#5a6a9a' : '#3a4a7a') : '#222834');
          gfx.frame(rx, ry, rw, rh, owned ? '#f5c33b' : '#0f1420');
          if (owned) { // lit office with a tiny worker
            gfx.rect(rx + 4, ry + 18, 28, 8, '#c8a060'); CH.drawChubby(g, rx + 18, ry + 26, { outfit: 'uniform', noShadow: true, sx: 0.5, sy: 0.5, face: 'happy', arm: 'pocket' }); gfx.rect(rx + 24, ry + 6, 8, 8, '#4f9d3a');
          } else if (unlocked) { gfx.rect(rx + 6, ry + 6, 24, 16, '#26304a'); gfx.text('$' + r.cost, rx + rw / 2, ry + 10, hov ? '#fff' : '#9fdcff', { align: 'center', font: 'small' }); gfx.text(r.name.slice(0, 8), rx + rw / 2, ry + 18, '#aab', { align: 'center', font: 'small' }); }
          else { gfx.text('?', rx + rw / 2, ry + 11, '#334', { align: 'center' }); }
          if (hov && unlocked) { ui.cursor = 'hand'; if (inp.mpressed) { this.sel = r; A.sfx('tap'); inp.eat(); } }
          if (this.sel === r) gfx.frame(rx - 1, ry - 1, rw + 2, rh + 2, Math.sin(this.t * 8) > 0 ? '#fff' : '#f5c33b');
        });
        // progress pips
        for (let i = 0; i < 5; i++) gfx.rect(tx + tw - 30 + i * 5, fy - 6, 3, 3, i < bought ? '#8bd06a' : '#333');
        if (unlocked && bought < 5 && f === S.towerFloor && f < 10) gfx.text(`${5 - bought} more to unlock elevator`, tx + tw - 8, fy - 38, '#f5c33b', { align: 'right', font: 'small' });
      }
      // elevator shaft
      const ex = tx + tw + 6; gfx.rect(ex, this.floorY(10) - 40, 24, this.floorY(1) - this.floorY(10) + 42, '#0f1420'); for (let f = 1; f <= 10; f++) gfx.rect(ex, this.floorY(f), 24, 1, '#334');
      const carF = this.elevating ? CH.lerp(S.towerFloor - 1, S.towerFloor, Math.min(1, this.elevT / 1.2)) : Math.min(this.viewFloor, S.towerFloor);
      const cy = this.floorY(carF); gfx.rect(ex + 2, cy - 38, 20, 36, '#8a8a94'); gfx.rect(ex + 4, cy - 36, 16, 32, '#c8ccd4'); gfx.rect(ex + 11, cy - 36, 2, 32, '#666');
      CH.drawChubby(g, ex + 12, cy - 4, { outfit: S.job === 'janitor' ? 'janitor' : 'uniform', noShadow: true, sx: 0.6, sy: 0.6, face: this.elevating ? 'happy' : 'normal', arm: 'pocket' });
      gfx.text('ELEVATOR', ex + 12, this.floorY(Math.min(10, S.towerFloor + 0.9)) - 52, '#aab', { align: 'center', font: 'small' });
      // roof
      const ty = this.floorY(10) - 40; gfx.rect(tx - 10, ty - 10, tw + 44, 10, '#3a4a7a'); gfx.rect(tx + 130, ty - 40, 6, 30, '#8a8a94'); gfx.px(tx + 133, ty - 42 + (Math.sin(this.t * 4) > 0 ? 0 : 1), '#f44');
      g.save(); g.translate(tx + 150, ty - 30); g.scale(2, 2); gfx.text('D', 0, 0, '#f5c33b', { outline: '#c8352b' }); g.restore();
      gfx.text("DONALD'S CORPORATE  -  CAREER TOWER", tx + tw / 2, ty - 38, '#fff', { align: 'center', font: 'small' });
      // panel
      gfx.rect(0, 0, W, 16, 'rgba(0,0,0,0.7)'); gfx.text('CAREER TOWER', 6, 4, '#f5c33b'); gfx.text(`Floor ${S.towerFloor} unlocked  -  scroll / ↑↓ to view  -  click a room`, 100, 5, '#ccc', { font: 'small' });
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
      if (next) gfx.text(`Next role: ${CH.JOB_INFO[next].title} needs Floor ${CH.JOB_INFO[next].floor}`, W - 6, 20, '#9fdcff', { align: 'right', font: 'small' });
      CH.fxParticles.draw(g);
    }
  }
  CH.TowerScene = TowerScene;
  CH.SCENES.tower = () => { const s = new CH.Scene(); S.money = 500; s.enter = () => CH.game.push(new TowerScene(() => {})); s.draw = (g) => gfx.rect(0, 0, W, H, '#222'); return s; };
})(window.CH);
