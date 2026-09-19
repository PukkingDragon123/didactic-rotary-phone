// ============================================================================
// MANAGEMENT & CORPORATE MINIGAMES: shift lead, manager, sauce, synergy, CBO, CEO
//
// These are desk jobs, so the art leans on the UI language: rounded ink-outlined
// panels, a cream face, a gold highlight on whatever is live. The few physical
// things (the sauce bowl, the burger on the pedestal, the pen) get ink lines.
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, A = CH.audio, inp = CH.input, S = CH.state, F = CH.FOOD;
  const MG = CH.MG, art = CH.art;
  const W = CH.W, H = CH.H;
  const has = (k) => CH.has(k);

  // ---------------------------------------------------------------- SHIFT LEAD -----
  class ShiftLeadScene extends CH.MinigameScene {
    constructor(opts = {}) {
      super({ title: 'SHIFT LEADER', hint: 'Drag crew onto stations to keep demand bars low. Handle incidents fast!', difficulty: opts.difficulty || 1, timeLimit: 70 });
      const d = this.difficulty;
      this.stations = [{ id: 'register', name: 'REGISTER', x: 60, y: 110, demand: 0.2, rate: 0.05 }, { id: 'grill', name: 'GRILL', x: 150, y: 110, demand: 0.3, rate: 0.06 }, { id: 'fries', name: 'FRIES', x: 240, y: 110, demand: 0.2, rate: 0.055 }, { id: 'assembly', name: 'ASSEMBLY', x: 330, y: 110, demand: 0.3, rate: 0.06 }, { id: 'bagging', name: 'BAGGING', x: 420, y: 110, demand: 0.1, rate: 0.045 }];
      for (const s of this.stations) s.rate *= 0.8 + d * 0.25;
      this.crew = [
        { name: 'Kevin', mk: CH.makeKevin, skills: { grill: 3, fries: 2, assembly: 2, register: 1, bagging: 1 }, station: null, x: 60, y: 240, away: 0 },
        { name: 'Tammy', mk: CH.makeTammy, skills: { register: 3, bagging: 2, assembly: 1, grill: 1, fries: 1 }, station: null, x: 140, y: 240, away: 0 },
        { name: 'Jorge', mk: CH.makeJorge, skills: { fries: 3, grill: 2, bagging: 2, register: 1, assembly: 1 }, station: null, x: 220, y: 240, away: 0 },
        { name: 'Destiny', mk: CH.makeDestiny, skills: { bagging: 3, register: 2, assembly: 2, grill: 1, fries: 1 }, station: null, x: 300, y: 240, away: 0 },
      ];
      if (has('crew2')) this.crew.push({ name: 'New Kevin', mk: CH.makeKevin, skills: { grill: 2, fries: 2, assembly: 2, register: 2, bagging: 2 }, station: null, x: 380, y: 240, away: 0 });
      for (const c of this.crew) { c.npc = c.mk(0, 0); c.home = { x: c.x, y: c.y }; }
      this.held = null; this.incidents = []; this.incT = 8; this.complaints = 0; this.good = 0;
    }
    progress() { return 1 - this.timeLeft / this.timeLimit; }
    step(dt) {
      // demand dynamics
      for (const s of this.stations) {
        const workers = this.crew.filter((c) => c.station === s && c.away <= 0);
        const skill = workers.reduce((a, c) => a + c.skills[s.id], 0);
        s.demand += dt * (s.rate - skill * 0.03);
        if (s.demand < 0) s.demand = 0;
        if (s.demand >= 1) { s.demand = 0.6; this.complaints++; A.sfx('angry'); this.particles.text(s.x, s.y - 40, s.name + ' BACKED UP!', '#ff6060'); CH.doShake(2, 0.2); }
        if (s.demand < 0.3) this.good += dt;
      }
      // drag crew
      if (!this.held && inp.mpressed) { for (const c of this.crew) if (c.away <= 0 && Math.abs(inp.mx - c.x) < 14 && Math.abs(inp.my - c.y) < 24) { this.held = c; A.sfx('pop'); } }
      if (this.held) { this.held.x = inp.mx; this.held.y = inp.my + 16; if (!inp.mdown) { const c = this.held; this.held = null; const st = this.stations.find((s) => Math.abs(c.x - s.x) < 40 && Math.abs(c.y - (s.y + 30)) < 40); if (st) { c.station = st; c.x = st.x + (this.crew.filter((k) => k.station === st).length - 1) * 14 - 6; c.y = st.y + 44; A.sfx('snap'); } else { c.station = null; c.x = c.home.x; c.y = c.home.y; } } }
      // incidents
      this.incT -= dt;
      if (this.incT <= 0) { this.incT = Math.max(6, 14 - this.difficulty * 2); const kind = CH.pick(['fire', 'angry', 'spill', 'break']); if (kind === 'break') { const c = CH.pick(this.crew.filter((k) => k.away <= 0)); if (c) { c.away = 12; c.station = null; c.x = c.home.x; c.y = c.home.y; this.particles.text(c.x, c.y - 40, c.name + ' is on break', '#f5c33b'); } } else { this.incidents.push({ kind, x: kind === 'fire' ? 240 : kind === 'angry' ? 60 : CH.rand(80, 400), y: kind === 'spill' ? 190 : 80, t: 10 }); A.sfx(kind === 'fire' ? 'burn' : kind === 'angry' ? 'angry' : 'splash'); } }
      for (let i = this.incidents.length - 1; i >= 0; i--) { const inc = this.incidents[i]; inc.t -= dt; if (inc.t <= 0) { this.incidents.splice(i, 1); this.complaints++; this.particles.text(inc.x, inc.y - 20, 'UNHANDLED!', '#ff6060'); A.sfx('angry'); continue; } if (inp.clicked({ x: inc.x - 16, y: inc.y - 16, w: 32, h: 32 })) { this.incidents.splice(i, 1); A.sfx(inc.kind === 'fire' ? 'squirt' : inc.kind === 'angry' ? 'good' : 'mop'); this.particles.burst(inc.x, inc.y, 10, { color: inc.kind === 'fire' ? ['#fff', '#9fdcff'] : ['#8bd06a', '#fff'], speed: 60, life: 0.5 }); this.addCombo(); inp.eat(); } }
      for (const c of this.crew) { if (c.away > 0) c.away -= dt; c.npc.update(dt); }
      if (this.timeLeft <= 0.01) {}
    }
    onTimeout() { const avg = this.good / (this.timeLimit * this.stations.length); this.finish(CH.clamp(avg * 1.2 - this.complaints * 0.08, 0, 1), { label: this.complaints ? this.complaints + ' complaints' : 'A smooth shift!' }); }
    drawStationIcon(g, s) {
      const x = s.x, y = s.y + 27;
      if (s.id === 'grill') MG.ink(x, y, 48, 20, (cx, cy) => {
        gfx.rect(cx - 20, cy - 7, 40, 14, '#3a3e47');
        gfx.rect(cx - 19, cy - 6, 38, 12, '#241d21');
        for (let i = 0; i < 3; i++) gfx.hline(cx - 18, cy - 4 + i * 4, 36, '#4a3a34');
        g.globalAlpha = 0.4; gfx.ellipse(cx, cy, 16, 5, '#ff7a30'); g.globalAlpha = 1;
      });
      else if (s.id === 'fries') MG.ink(x, y, 48, 20, (cx, cy) => {
        gfx.rect(cx - 20, cy - 7, 40, 14, '#6e737e');
        gfx.rect(cx - 18, cy - 5, 36, 11, '#d8a220');
        gfx.hline(cx - 18, cy - 5, 36, '#f6da78');
        for (let i = 0; i < 4; i++) gfx.px(cx - 12 + i * 8, cy - 2 + Math.round(Math.sin(this.t * 5 + i) * 2), '#fff8c0');
      });
      else if (s.id === 'register') MG.ink(x, y, 40, 20, (cx, cy) => {
        gfx.rect(cx - 16, cy - 7, 32, 14, '#4a4e58');
        gfx.rect(cx - 14, cy - 5, 28, 7, '#1a2a3a');
        gfx.hline(cx - 14, cy - 5, 28, '#31536e');
        for (let i = 0; i < 4; i++) gfx.rect(cx - 12 + i * 7, cy + 3, 5, 3, '#8f959f');
      });
      else if (s.id === 'assembly') MG.ink(x, y, 40, 20, (cx, cy) => {
        gfx.rect(cx - 16, cy - 7, 32, 14, '#c8a060');
        gfx.rect(cx - 15, cy - 6, 30, 12, '#e0bc80');
        gfx.ellipse(cx, cy + 1, 9, 3, '#d09343');
        gfx.ellipse(cx, cy - 2, 9, 3.4, '#e0a850');
      });
      else MG.ink(x, y, 34, 20, (cx, cy) => {
        gfx.rect(cx - 9, cy - 8, 18, 15, '#c8a060');
        gfx.rect(cx - 9, cy - 8, 6, 15, '#dcb87e');
        gfx.rect(cx - 7, cy - 10, 14, 3, '#b8935e');
        gfx.text('D', cx, cy - 4, '#c8352b', { align: 'center', font: 'small' });
      });
    }
    draw(g) {
      // top-down floor
      gfx.rect(0, 0, W, H, '#d8c8a0');
      for (let y = 0; y < H; y += 24) for (let x = -((y / 24) & 1) * 24; x < W; x += 48) gfx.rect(x, y, 24, 24, '#cfbf95');
      for (let y = 0; y < H; y += 24) { gfx.hline(0, y, W, '#bfae83'); gfx.hline(0, y + 1, W, '#ded0aa'); }
      for (let x = 0; x < W; x += 24) { gfx.vline(x, 0, H, '#bfae83'); gfx.vline(x + 1, 0, H, '#ded0aa'); }
      MG.crumbs(0, 0, W, H, 50, ['#c6b68d', '#e0d2ae'], 6);
      MG.tag('THE FLOOR (top-down)', W / 2, 18, { align: 'center' });
      for (const s of this.stations) {
        const hot = s.demand > 0.8;
        const m = MG.m(hot ? '#c86a5a' : '#b8bcc4', { dark: -28, darker: -46, light: 22 });
        MG.shadow(s.x, s.y + 52, 34, 0.22);
        MG.ink(s.x, s.y + 15, 88, 78, (cx, cy) => {
          cy -= 15;
          gfx.rect(cx - 40, cy - 20, 80, 70, '#7e828c');
          gfx.rect(cx - 36, cy - 16, 72, 62, m.base);
          gfx.rect(cx - 36, cy - 16, 72, 3, gfx.mix(m.l, '#fff', 0.3));
          gfx.rect(cx - 36, cy + 43, 72, 3, m.d);
          gfx.rect(cx - 33, cy - 13, 66, 11, '#f3eee2');
          gfx.text(s.name, cx, cy - 12, '#241c30', { align: 'center', font: 'small' });
        }, { outline: hot ? '#8a2a1e' : undefined });
        MG.meter(s.x - 30, s.y, 60, 6, s.demand, s.demand > 0.7 ? '#c8352b' : s.demand > 0.4 ? '#f5c33b' : '#4f9d3a');
        gfx.text('DEMAND', s.x, s.y + 8, '#3f3a33', { align: 'center', font: 'small' });
        this.drawStationIcon(g, s);
        if (hot) art.effect('anger', s.x + 30, s.y - 14, this.t, 0.8);
      }
      // crew pool
      gfx.rect(0, 186, W, H - 186, '#a89878');
      gfx.rect(0, 186, W, 2, '#c0b193');
      for (let y = 192; y < H; y += 8) gfx.hline(0, y, W, 'rgba(140,124,96,0.25)');
      gfx.text('CREW (drag onto a station)  -  ★ = skill', 8, 190, '#3a2a1a', { font: 'small' });
      for (const c of this.crew) {
        if (c.away > 0) { g.globalAlpha = 0.4; }
        c.npc.x = c.x; c.npc.y = c.y; c.npc.draw(g);
        MG.tag(c.name, c.x, c.y + 1, { align: 'center', face: c.station ? '#cfe6c7' : MG.CREAM, shadow: false });
        if (c.away > 0) { g.globalAlpha = 1; MG.tag('BREAK ' + Math.ceil(c.away), c.x, c.y - 44, { align: 'center', face: MG.RED, color: '#fff2e6' }); }
        if (this.held === c) { const st = this.stations.find((s) => Math.abs(c.x - s.x) < 40 && Math.abs(c.y - (s.y + 30)) < 40); if (st) gfx.text('★'.repeat(c.skills[st.id]), c.x, c.y - 46, MG.GOLD, { align: 'center', outline: '#2a1f33' }); }
        else if (!c.station && c.away <= 0) { const best = Object.entries(c.skills).sort((a, b) => b[1] - a[1])[0]; gfx.text(best[0] + ' ★' + best[1], c.x, c.y + 12, '#5a3a1a', { align: 'center', font: 'small' }); }
      }
      for (const inc of this.incidents) {
        const pulse = Math.sin(this.t * 12) > 0;
        if (inc.kind === 'fire') {
          MG.ink(inc.x, inc.y, 30, 32, (cx, cy) => {
            const h = 12 + (pulse ? 3 : 0);
            gfx.tri(cx - 10, cy + 10, cx + 10, cy + 10, cx, cy - h, '#e8752c');
            gfx.tri(cx - 7, cy + 10, cx + 7, cy + 10, cx + 1, cy - h * 0.7, '#f5a13b');
            gfx.tri(cx - 4, cy + 10, cx + 4, cy + 10, cx - 1, cy - h * 0.35, '#f7e07a');
            gfx.ellipse(cx, cy + 9, 9, 2.4, '#8a2a1e');
          });
          MG.tag('FIRE! click', inc.x, inc.y - 26, { align: 'center', face: pulse ? MG.GOLD : MG.RED, color: pulse ? '#3a2a08' : '#fff2e6' });
        } else if (inc.kind === 'angry') {
          art.bubble(inc.x - 14, inc.y - 12, 28, 20, inc.x, inc.y + 14, { kind: 'shout', fill: '#fff6ea' });
          gfx.text('>:(', inc.x, inc.y - 5, MG.RED, { align: 'center' });
          MG.tag('ANGRY! click', inc.x, inc.y - 28, { align: 'center', face: pulse ? MG.GOLD : MG.RED, color: pulse ? '#3a2a08' : '#fff2e6' });
        } else {
          gfx.ellipse(inc.x, inc.y + 1, 17, 8, 'rgba(24,14,30,0.35)');
          gfx.ellipse(inc.x, inc.y, 16, 7, '#5b3114');
          gfx.ellipse(inc.x, inc.y, 12, 5, '#6a3a18');
          gfx.ellipse(inc.x - 5, inc.y - 2, 4, 1.6, 'rgba(255,255,255,0.3)');
          MG.tag('SPILL! click', inc.x, inc.y - 22, { align: 'center', face: pulse ? MG.GOLD : MG.RED, color: pulse ? '#3a2a08' : '#fff2e6' });
        }
        MG.meter(inc.x - 12, inc.y + 14, 24, 4, inc.t / 10, MG.GOLD);
      }
      const ct = 'Complaints: ' + this.complaints;
      MG.tag(ct, W - 8 - gfx.textWidth(ct, 'small') - 7, 18, { face: this.complaints ? '#f0b8b0' : MG.CREAM });
      this.particles.draw(g);
      if (this.held) this.drawPaw(g, true);
      this.drawHud(g);
    }
  }
  CH.ShiftLeadScene = ShiftLeadScene;

  // ---------------------------------------------------------------- MANAGER --------
  class ManagerScene extends CH.MinigameScene {
    constructor(opts = {}) {
      super({ title: 'STORE MANAGER', hint: 'Triage emails, fill the schedule, and order inventory before the day ends.', difficulty: opts.difficulty || 1, timeLimit: 80 });
      const d = this.difficulty;
      this.tab = 'email';
      this.emails = CH.shuffle([
        { from: 'Corporate', subj: 'Cut pickle budget 40%?', good: 1, opts: ['Approve', 'Deny'], why: 'Customers riot without pickles.' },
        { from: 'Kevin', subj: 'Can I have Friday off (concert)', good: 0, opts: ['Approve', 'Deny'], why: 'Happy Kevin = working Kevin.' },
        { from: 'Health Inspector', subj: 'Surprise inspection tomorrow', good: 0, opts: ['Deep clean tonight', 'Hide the fryer'], why: 'Never hide the fryer.' },
        { from: 'Corporate', subj: 'Replace all patties with "patty-shaped product"', good: 1, opts: ['Approve', 'Deny'], why: 'No.' },
        { from: 'Tammy', subj: 'Raise? I have been here 6 years', good: 0, opts: ['Approve $1/hr', 'Deny'], why: "Tammy runs this place. Everyone knows." },
        { from: 'Man Egg Fan Club', subj: 'Host our meetup in the PlayPlace?', good: 0, opts: ['Approve', 'Deny'], why: '40 adults buying shakes. Yes.' },
        { from: 'Corporate', subj: 'Mandatory 6 AM synergy call', good: 1, opts: ['Attend', 'Decline politely'], why: 'Nothing good happens at 6 AM.' },
        { from: 'Brenda (retired)', subj: 'How is my mop', good: 0, opts: ['"Thriving."', 'Ignore'], why: 'Always reply to Brenda.' },
        { from: 'Supplier', subj: 'Buns delayed 3 days', good: 0, opts: ['Order from backup bakery', 'Serve bunless burgers'], why: 'Bunless is a cry for help.' },
        { from: 'A Customer', subj: 'Your D sign fell on my car', good: 0, opts: ['Apologize + coupons', 'Deny it is our D'], why: 'It is very clearly our D.' },
      ]).slice(0, 5 + Math.round(d));
      this.emailIdx = 0; this.emailScore = 0;
      // schedule: 5 days x 2 shifts; constraints
      this.days = ['MON', 'TUE', 'WED', 'THU', 'FRI']; this.shifts = ['AM', 'PM'];
      this.chips = [{ n: 'Kevin', no: ['AM'], c: '#8a8a90' }, { n: 'Tammy', noDay: ['MON'], c: '#d9722c' }, { n: 'Jorge', c: '#4a3a2a' }, { n: 'Destiny', noDay: ['FRI'], c: '#22222a' }];
      this.grid = {}; this.heldChip = null;
      // inventory
      this.inv = [{ n: 'Patties', need: 400 + Math.round(Math.random() * 200), v: 300 }, { n: 'Buns', need: 400 + Math.round(Math.random() * 200), v: 400 }, { n: 'Fries (kg)', need: 60 + Math.round(Math.random() * 40), v: 50 }, { n: 'Pickles (jars)', need: 12 + Math.round(Math.random() * 10), v: 10 }, { n: 'Sad egg toys', need: 30 + Math.round(Math.random() * 30), v: 0 }];
    }
    progress() { const e = this.emailIdx / this.emails.length; const filled = Object.keys(this.grid).length / 10; const inv = this.inv.filter((i) => Math.abs(i.v - i.need) / i.need <= 0.1).length / this.inv.length; return (e + filled + inv) / 3; }
    step(dt) { if (this.progress() >= 0.999 && !this.finished) this.onTimeout(); }
    onTimeout() { const e = this.emailScore / this.emails.length; let sched = 0; for (const k in this.grid) { const [day, sh] = k.split('-'); const chip = this.grid[k]; const bad = (chip.no && chip.no.includes(sh)) || (chip.noDay && chip.noDay.includes(day)); sched += bad ? 0 : 1; } sched /= 10; const inv = this.inv.filter((i) => Math.abs(i.v - i.need) / i.need <= 0.1).length / this.inv.length; this.finish(CH.clamp((e + sched + inv) / 3, 0, 1)); }
    draw(g) {
      // office: wood-panelled wall, desk, a CRT with a bezel
      gfx.rect(0, 0, W, H, '#d8c8a0');
      for (let y = 30; y < H; y += 6) gfx.hline(0, y, W, '#cfbf95');
      for (let x = 0; x < W; x += 60) gfx.vline(x, 16, H - 16, 'rgba(160,140,100,0.35)');
      gfx.rrect(16, 16, W - 32, H - 42, 5, MG.INK);
      gfx.rrect(18, 18, W - 36, H - 46, 4, '#4a4e58');
      gfx.rrect(20, 20, W - 40, 3, 2, '#787d87');
      gfx.rrect(24, 24, W - 48, H - 58, 3, '#dfe6ee');
      gfx.rrect(26, 26, W - 52, H - 62, 2, '#e8eef4');
      g.globalAlpha = 0.07; for (let y = 28; y < H - 40; y += 3) gfx.hline(26, y, W - 52, '#3b6fd6'); g.globalAlpha = 1;
      // tabs
      ['email', 'schedule', 'inventory'].forEach((t, i) => {
        const r = { x: 30 + i * 90, y: 30, w: 86, h: 12 };
        const badge = t === 'email' ? this.emails.length - this.emailIdx : t === 'schedule' ? 10 - Object.keys(this.grid).length : this.inv.filter((it) => Math.abs(it.v - it.need) / it.need > 0.1).length;
        if (MG.button(g, r, t.toUpperCase() + (badge ? ` (${badge})` : ' ✓'), { color: this.tab === t ? '#3b6fd6' : '#8899aa', font: 'small', ink: this.tab === t ? MG.GOLD : undefined })) this.tab = t;
      });
      const y0 = 50;
      if (this.tab === 'email') {
        const e = this.emails[this.emailIdx];
        if (!e) gfx.text('Inbox zero. A miracle.', W / 2, 120, '#3a9a5a', { align: 'center' });
        else {
          MG.panel(34, y0, W - 68, 60, { r: 3, face: '#fdfbf6' });
          gfx.rect(34, y0 + 14, W - 68, 1, '#d8d2c4');
          gfx.text('From: ' + e.from, 40, y0 + 5, '#3b6fd6', { font: 'small' });
          gfx.text(e.subj, 40, y0 + 18, '#221c2c');
          gfx.text(`Email ${this.emailIdx + 1} of ${this.emails.length}`, W - 40, y0 + 5, '#8a8276', { align: 'right', font: 'small' });
          e.opts.forEach((o, i) => { if (MG.button(g, { x: 40 + i * 150, y: y0 + 38, w: 140, h: 14 }, o, { color: i === 0 ? '#4f9d3a' : '#c8352b', font: 'main' })) { const ok = i === e.good; if (ok) { this.emailScore++; this.addCombo(); this.particles.text(W / 2, y0 + 80, 'Good call. ' + e.why, '#3a9a5a'); } else { this.particles.text(W / 2, y0 + 80, 'Hmm. ' + e.why, '#c8352b'); A.sfx('error'); } this.emailIdx++; } });
        }
      } else if (this.tab === 'schedule') {
        const gx = 60, gy = y0 + 12, cw = 64, chh = 26;
        this.days.forEach((d, i) => gfx.text(d, gx + i * cw + cw / 2, gy - 9, '#221c2c', { align: 'center', font: 'small' }));
        this.shifts.forEach((s, j) => gfx.text(s, gx - 12, gy + j * chh + 10, '#221c2c', { align: 'center', font: 'small' }));
        for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) {
          const k = this.days[i] + '-' + this.shifts[j];
          const r = { x: gx + i * cw, y: gy + j * chh, w: cw - 2, h: chh - 2 };
          const chip = this.grid[k];
          const bad = chip && ((chip.no && chip.no.includes(this.shifts[j])) || (chip.noDay && chip.noDay.includes(this.days[i])));
          const hov = this.heldChip && inp.mouseIn(r);
          MG.panel(r.x, r.y, r.w, r.h, { r: 2, face: chip ? (bad ? '#f2c3c3' : '#cfe8cc') : (hov ? '#fdf3cf' : '#ffffff'), shadow: false, ink: hov ? MG.GOLD : MG.INK });
          if (chip) {
            MG.ink(r.x + 9, r.y + 11, 14, 14, (cx, cy) => { gfx.rect(cx - 5, cy - 5, 10, 10, chip.c); gfx.rect(cx - 5, cy - 5, 10, 3, gfx.shade(chip.c, 30)); });
            gfx.text(chip.n, r.x + 18, r.y + 8, '#221c2c', { font: 'small' });
            if (bad) gfx.text('✗', r.x + r.w - 10, r.y + 8, '#c8352b', { font: 'small' });
          }
          if (this.heldChip && inp.mouseIn(r) && !inp.mdown) { this.grid[k] = this.heldChip; this.heldChip = null; A.sfx('snap'); }
          else if (!this.heldChip && chip && inp.clicked(r)) { delete this.grid[k]; A.sfx('back'); inp.eat(); }
        }
        gfx.text('Crew (drag into slots; repeatable). Constraints:', 34, gy + 60, '#332c22', { font: 'small' });
        this.chips.forEach((c, i) => {
          const r = { x: 40 + i * 100, y: gy + 72, w: 90, h: 16 };
          MG.panel(r.x, r.y, r.w, r.h, { r: 3, face: '#ffffff' });
          MG.ink(r.x + 8, r.y + 8, 14, 14, (cx, cy) => { gfx.rect(cx - 5, cy - 5, 10, 10, c.c); gfx.rect(cx - 5, cy - 5, 10, 3, gfx.shade(c.c, 30)); });
          gfx.text(c.n, r.x + 17, r.y + 5, '#221c2c', { font: 'small' });
          const cons = c.no ? 'no ' + c.no.join('/') : c.noDay ? 'no ' + c.noDay.join('/') : 'any';
          gfx.text(cons, r.x + 48, r.y + 5, '#c8352b', { font: 'small' });
          if (inp.mouseIn(r)) ui.cursor = 'hand';
          if (inp.mpressed && inp.mouseIn(r)) { this.heldChip = c; A.sfx('pop'); }
        });
        if (this.heldChip) {
          if (!inp.mdown) { this.heldChip = null; }
          else {
            MG.ink(inp.mx, inp.my, 18, 18, (cx, cy) => { gfx.rect(cx - 6, cy - 6, 12, 12, this.heldChip.c); gfx.rect(cx - 6, cy - 6, 12, 3, gfx.shade(this.heldChip.c, 30)); });
            MG.tag(this.heldChip.n, inp.mx + 9, inp.my - 5, { face: MG.GOLD });
          }
        }
      } else {
        gfx.text('Order for next week. Match projected demand within 10%.', 34, y0, '#332c22', { font: 'small' });
        this.inv.forEach((it, i) => {
          const y = y0 + 14 + i * 22;
          const ok = Math.abs(it.v - it.need) / it.need <= 0.1;
          MG.panel(34, y - 3, W - 68, 19, { r: 3, face: ok ? '#e4f0df' : '#fbf6ea', shadow: false });
          gfx.text(it.n, 40, y + 3, '#221c2c', { font: 'small' });
          gfx.text('projected: ' + it.need, 130, y + 3, '#7a7266', { font: 'small' });
          if (MG.button(g, { x: 230, y, w: 16, h: 12 }, '-', { color: '#8a3a3a' })) it.v = Math.max(0, it.v - Math.max(1, Math.round(it.need * 0.05)));
          if (MG.button(g, { x: 300, y, w: 16, h: 12 }, '+', { color: '#4f9d3a' })) it.v += Math.max(1, Math.round(it.need * 0.05));
          gfx.text(String(it.v), 273, y + 3, ok ? '#3a9a5a' : '#c8352b', { align: 'center' });
          gfx.text(ok ? '✓' : it.v < it.need ? 'short' : 'too many', 330, y + 3, ok ? '#3a9a5a' : '#c8352b', { font: 'small' });
        });
      }
      // desk items: a cold coffee, going colder
      MG.ink(W - 40, H - 18, 46, 30, (cx, cy) => {
        gfx.rect(cx - 20, cy - 10, 40, 20, '#3a3e47');
        gfx.rect(cx - 18, cy - 8, 36, 16, '#4a4e58');
        gfx.hline(cx - 18, cy - 8, 36, '#787d87');
        gfx.rect(cx - 16, cy - 6, 32, 10, '#5a3a1a');
        gfx.hline(cx - 16, cy - 6, 32, '#7a5330');
        gfx.ellipse(cx - 8, cy - 5, 5, 1.4, 'rgba(255,255,255,0.18)');
      });
      MG.tag('coffee', W - 40, H - 34, { align: 'center' });
      this.particles.draw(g);
      this.drawHud(g);
    }
  }
  CH.ManagerScene = ManagerScene;

  // ---------------------------------------------------------------- SAUCE CONSULTANT ----
  class SauceScene extends CH.MinigameScene {
    constructor(opts = {}) {
      super({ title: 'REGIONAL SAUCE CONSULTANT', hint: 'Adjust the sliders, TASTE, read the notes, repeat. Ship when it is close.', difficulty: opts.difficulty || 1 });
      this.names = ['Ketchup', 'Mayo', 'Mustard', 'Secret']; this.target = this.names.map(() => 0.15 + Math.random() * 0.7); this.v = [0.5, 0.5, 0.5, 0.5]; this.tastes = 0; this.maxTastes = 8 - Math.min(3, Math.round(this.difficulty)); this.notes = ['The board awaits your first taste test.']; this.held = -1;
    }
    progress() { return this.tastes / this.maxTastes; }
    closeness() { let e = 0; for (let i = 0; i < 4; i++) e += Math.abs(this.v[i] - this.target[i]); return 1 - e / 2; }
    step(dt) {
      for (let i = 0; i < 4; i++) { const r = { x: 50 + i * 72 - 14, y: 54, w: 28, h: 132 }; if (inp.mpressed && inp.mouseIn(r)) this.held = i; }
      if (this.held >= 0) { this.v[this.held] = CH.clamp(1 - (inp.my - 60) / 120, 0, 1); if (!inp.mdown) this.held = -1; }
    }
    taste() {
      this.tastes++; A.sfx('eat'); const fuzz = 0.06 * this.difficulty;
      const n = this.names.map((nm, i) => { const d = this.target[i] - this.v[i] + (Math.random() - 0.5) * fuzz; return Math.abs(d) < 0.06 ? nm + ' ✓' : d > 0 ? nm + ' ↑ needs more' : nm + ' ↓ too much'; });
      this.notes = [CH.pick(['Board member Gary: ', 'Focus group (moose): ', 'Your own tongue: ', 'Intern: ']) + CH.pick(['"Hmm."', '"Tangy?"', '"It tastes like a decision."', '"My mouth is confused."', '"Close."']), ...n];
      const c = this.closeness(); if (c > 0.92) { this.particles.text(W / 2, 40, 'THAT\'S THE SAUCE!', '#8bd06a'); }
      if (this.tastes >= this.maxTastes) this.ship();
    }
    ship() { const c = this.closeness(); this.finish(CH.clamp((c - 0.5) * 2, 0, 1), { label: c > 0.9 ? 'Shipped to 40 stores!' : c > 0.75 ? 'Shipped. Some complaints.' : 'Shipped. Recalled.' }); }
    draw(g) {
      // corporate test kitchen: dark lab with a lit bench
      gfx.rect(0, 0, W, H, '#2a2a34');
      gfx.rect(0, 14, W, H - 14, '#3a3a48');
      for (let x = 0; x < W; x += 40) gfx.vline(x, 14, H, '#44445a');
      g.globalAlpha = 0.12; gfx.rect(0, 40, W, 120, '#8fb4ff'); g.globalAlpha = 1;
      gfx.rect(0, 210, W, H - 210, '#4a4a5c');
      gfx.rect(0, 210, W, 3, '#6a6a80');
      gfx.text('CORPORATE TEST KITCHEN  -  FLOOR 7', W / 2, 20, '#f5c33b', { align: 'center', font: 'small' });
      for (let i = 0; i < 4; i++) {
        const x = 50 + i * 72;
        const col = ['#d13c3c', '#f4f1ea', '#f5c33b', '#7b4fb0'][i];
        // the tube
        gfx.rect(x - 5, 58, 10, 124, '#1a1620');
        gfx.rect(x - 4, 60, 8, 120, '#0f0c14');
        gfx.vline(x - 4, 60, 120, '#2c2738');
        const ky = 60 + Math.round((1 - this.v[i]) * 120);
        gfx.rect(x - 4, ky, 8, 180 - ky, gfx.shade(col, -26));
        gfx.rect(x - 4, ky, 5, 180 - ky, col);
        gfx.hline(x - 4, ky, 8, gfx.mix(col, '#fff', 0.45));
        // the knob
        MG.ink(x, ky, 32, 16, (cx, cy) => {
          const m = MG.m(this.held === i ? '#f5d76b' : '#d8d8e2', { dark: -28, light: 22 });
          gfx.rrect(cx - 14, cy - 6, 28, 12, 3, m.d);
          gfx.rrect(cx - 14, cy - 6, 28, 10, 3, m.base);
          gfx.rrect(cx - 13, cy - 5, 26, 1, 1, gfx.mix(m.l, '#fff', 0.5));
          for (let k = 0; k < 3; k++) gfx.vline(cx - 3 + k * 3, cy - 3, 5, m.d);
        });
        gfx.text(this.names[i], x, 190, '#f0ece2', { align: 'center', font: 'small' });
        gfx.text(Math.round(this.v[i] * 100) + '%', x, 198, col, { align: 'center', font: 'small' });
        if (inp.mouseIn({ x: x - 14, y: 54, w: 28, h: 132 })) ui.cursor = 'hand';
      }
      // the bowl
      const mix = gfx.mix(gfx.mix('#d13c3c', '#f4f1ea', this.v[1] / (this.v[0] + this.v[1] + 0.01)), '#f5c33b', this.v[2] * 0.5);
      const sauce = gfx.mix(mix, '#7b4fb0', this.v[3] * 0.3);
      MG.shadow(W / 2, 246, 58, 0.3);
      MG.ink(W / 2, 234, 132, 40, (cx, cy) => {
        gfx.ellipse(cx, cy + 4, 60, 14, '#8f959f');
        gfx.ellipse(cx, cy + 2, 60, 13, '#c6ccd6');
        gfx.ellipse(cx, cy, 54, 11, '#8f959f');
        gfx.ellipse(cx, cy - 1, 52, 10, gfx.shade(sauce, -24));
        gfx.ellipse(cx, cy - 2, 50, 9, sauce);
        gfx.ellipse(cx - 16, cy - 4, 12, 3, gfx.mix(sauce, '#fff', 0.35));
        for (let i = 0; i < 3; i++) gfx.px(cx + 10 + i * 8, cy - 3 + (i % 2), gfx.mix(sauce, '#fff', 0.5));
      });
      // notes panel
      MG.panel(316, 40, 156, 150, { r: 3, face: '#fdf8ea' });
      gfx.rect(318, 42, 152, 8, MG.RED);
      gfx.hline(318, 42, 152, '#e0655a');
      gfx.text('TASTING NOTES', 394, 42, '#fff6e4', { align: 'center', font: 'small' });
      this.notes.forEach((n, i) => { const lines = gfx.wrap(n, 146, 'small'); lines.forEach((l, k) => gfx.text(l, 320, 54 + i * 16 + k * 7, i === 0 ? '#6a6154' : n.includes('✓') ? '#3a9a5a' : '#2c2419', { font: 'small' })); });
      gfx.text(`Taste tests left: ${this.maxTastes - this.tastes}`, 320, 176, '#8a8276', { font: 'small' });
      if (MG.button(g, { x: 320, y: 200, w: 70, h: 16 }, 'TASTE', { color: '#3b6fd6', font: 'main' })) this.taste();
      if (MG.button(g, { x: 398, y: 200, w: 70, h: 16 }, 'SHIP IT', { color: '#4f9d3a', font: 'main' })) this.ship();
      this.particles.draw(g);
      this.drawHud(g);
    }
  }
  CH.SauceScene = SauceScene;

  // ---------------------------------------------------------------- VP OF SYNERGY ----
  const BUZZ = [['leverage', 3], ['synergize', 3], ['pivot', 2], ['circle back', 2], ['paradigm', 3], ['disrupt', 2], ['optimize', 2], ['deliverables', 2], ['bandwidth', 2], ['low-hanging fruit', 3], ['burgers', 1], ['pancakes', -2], ['my mom', -1], ['the mop', -1], ['Blue Hedgehog', -3], ['stakeholders', 2], ['ecosystem', 2], ['north star', 3], ['quick win', 2], ['pickles', 0]];
  const TEMPLATES = ['We need to ___ our ___ before Q4.', 'Let\'s ___ the ___ and ___ the ___.', 'Going forward, the ___ will ___ our ___.', 'Circle back? No. We ___ the ___ now.'];
  class SynergyScene extends CH.MinigameScene {
    constructor(opts = {}) {
      super({ title: 'VP OF SYNERGY', hint: 'Fill the blanks with buzzwords. Watch the board nod. Do NOT say pancakes. (You will.)', difficulty: opts.difficulty || 1, timeLimit: 60 });
      this.sentences = 4; this.done = 0; this.newSentence(); this.meter = 0.3; this.nod = 0;
    }
    newSentence() { this.template = CH.pick(TEMPLATES); this.blanks = this.template.split('___').length - 1; this.filled = []; this.tiles = CH.shuffle(BUZZ.slice()).slice(0, 9); }
    progress() { return this.done / this.sentences; }
    step(dt) { this.meter = Math.max(0, this.meter - dt * 0.01); if (this.nod > 0) this.nod -= dt; }
    onTimeout() { this.finish(CH.clamp(this.meter * 0.5 + (this.done / this.sentences) * 0.5, 0, 1)); }
    draw(g) {
      gfx.rect(0, 0, W, H, '#1a2030');
      // window skyline at dusk
      gfx.vgrad(0, 14, W, 104, ['#1c2740', '#243250', '#32405f']);
      for (let i = 0; i < 12; i++) {
        const bx = i * 40, bh = 30 + ((i * 17) % 50);
        gfx.rect(bx, 118 - bh, 34, bh, '#2a3450');
        gfx.vline(bx, 118 - bh, bh, '#3a4666');
        for (let k = 0; k < bh / 8; k++) gfx.rect(bx + 6 + (k % 3) * 8, 118 - bh + 4 + k * 8, 3, 3, (i + k) % 4 ? '#f5e6b0' : '#6a7490');
      }
      // mullions
      for (let x = 0; x < W; x += 80) gfx.rect(x, 14, 4, 104, '#141a28');
      gfx.rect(0, 114, W, 4, '#141a28');
      gfx.rect(0, 120, W, H - 120, '#3a2a1a');
      gfx.rect(0, 118, W, 4, '#5a4a2a');
      for (let y = 126; y < H; y += 8) gfx.hline(0, y, W, 'rgba(90,64,36,0.4)');
      // board members around the table
      const execs = ['moose', 'owl', 'bear', 'fox', 'goose'];
      execs.forEach((sp, i) => { const x = 70 + i * 85; CH.drawCritter(g, x, 150 + (this.nod > 0 ? Math.round(Math.sin(this.t * 20) * 2) : 0), { species: sp, outfit: 'corporate', noShadow: true, height: 1.05, face: this.meter > 0.6 ? 'happy' : this.meter < 0.25 ? 'angry' : 'normal', glasses: i % 2 === 0 }); });
      // the table
      MG.shadow(W / 2, 194, 200, 0.3);
      gfx.rrect(18, 148, W - 36, 44, 6, '#3a2510');
      gfx.rrect(20, 150, W - 40, 40, 5, '#7a5a3a');
      gfx.rrect(22, 152, W - 44, 34, 4, '#8f6c46');
      gfx.rrect(24, 153, W - 48, 3, 2, '#b08a5e');
      for (let i = 0; i < 6; i++) gfx.hline(30 + i * 8, 160 + i * 4, W - 80 - i * 10, 'rgba(90,64,36,0.3)');
      MG.tag('BOARDROOM  -  FLOOR 8', W / 2, 18, { align: 'center' });
      // synergy meter
      MG.tag('SYNERGY', 8, 27);
      MG.meter(54, 29, 116, 6, this.meter, this.meter > 0.6 ? '#4f9d3a' : this.meter > 0.3 ? '#f5c33b' : '#c8352b');
      // sentence
      const parts = this.template.split('___'); let sx = 30, sy = 60; let txt = '';
      for (let i = 0; i < parts.length; i++) { txt += parts[i]; if (i < this.blanks) txt += this.filled[i] ? '[' + this.filled[i][0] + ']' : '[____]'; }
      const lines = gfx.wrap(txt, W - 72);
      MG.panel(24, 52, W - 48, 10 + lines.length * 10, { r: 4, face: '#231b30' });
      lines.forEach((l, i) => gfx.text(l, sx, sy + i * 10, '#f6f1e6', { shadow: '#0f0b16' }));
      const sc = `Sentence ${this.done + 1}/${this.sentences}`;
      MG.tag(sc, W - 8 - gfx.textWidth(sc, 'small') - 7, 27);
      // tiles
      this.tiles.forEach((tl, i) => {
        const r = { x: 24 + (i % 5) * 88, y: 196 + Math.floor(i / 5) * 22, w: 84, h: 18 };
        if (this.filled.includes(tl)) return;
        if (MG.button(g, r, tl[0], { color: tl[1] < 0 ? '#7a5a3a' : tl[1] >= 3 ? '#4a6fa8' : '#3b5a8f', font: 'small' })) {
          this.filled.push(tl); A.sfx(tl[1] > 0 ? 'blip' : 'error');
          this.meter = CH.clamp(this.meter + tl[1] * 0.08, 0, 1);
          if (tl[1] >= 2) { this.nod = 0.6; this.particles.text(W / 2, 100, CH.pick(['*nodding*', '"Mm. Yes."', '"Say more."', '*writes it down*']), '#8bd06a'); }
          else if (tl[1] < 0) { this.particles.text(W / 2, 100, CH.pick(['*silence*', '"...pancakes?"', '"Who let him in."', '*a pen drops*']), '#ff8080'); }
          if (this.filled.length >= this.blanks) { this.done++; this.addCombo(); if (this.done >= this.sentences) this.finish(CH.clamp(this.meter, 0, 1), { label: this.meter > 0.7 ? 'Promoted to more meetings.' : 'The board is confused but nodding.' }); else this.newSentence(); }
        }
      });
      this.particles.draw(g);
      this.drawHud(g);
    }
  }
  CH.SynergyScene = SynergyScene;

  // ---------------------------------------------------------------- CHIEF BURGER OFFICER ----
  class CBOScene extends CH.MinigameScene {
    constructor(opts = {}) {
      super({ title: 'CHIEF BURGER OFFICER', hint: 'APPROVE burgers that follow Brand Guidelines. REJECT abominations.', difficulty: opts.difficulty || 1, timeLimit: 60 });
      this.total = 8 + Math.round(this.difficulty * 2); this.idx = 0; this.correct = 0; this.gen(); this.slide = 1;
    }
    gen() {
      const layers = ['bunBottom']; const n = 1 + Math.floor(Math.random() * 4); const pool = ['patty', 'cheese', 'lettuce', 'tomato', 'pickle', 'onion', 'bacon', 'patty', 'patty'];
      for (let i = 0; i < n; i++) layers.push(CH.pick(pool));
      const flaws = [];
      if (Math.random() < 0.25) { layers.push('shoe'); flaws.push('non-food item'); }
      if (Math.random() < 0.2) { layers.push('patty', 'patty', 'patty', 'patty'); flaws.push('more than 4 patties'); }
      if (Math.random() < 0.2) { flaws.push('missing top bun'); } else layers.push('bunTop');
      if (Math.random() < 0.15) { layers.push('bunTop'); flaws.push('two top buns'); }
      if (!layers.includes('patty') && !flaws.length && Math.random() < 0.5) flaws.push('no patty');
      const patties = layers.filter((l) => l === 'patty').length; if (patties > 4 && !flaws.includes('more than 4 patties')) flaws.push('more than 4 patties');
      if (!layers.includes('patty')) { if (!flaws.includes('no patty')) flaws.push('no patty'); }
      this.burger = { layers, flaws, name: CH.pick(['The Executive', 'Don Supreme', 'Moose Deluxe', 'Kevin\'s Revenge', 'The Compliance', 'Q4 Melt', 'Big Don XL', 'Sad Egg Special']) };
      this.slide = 0;
    }
    progress() { return this.idx / this.total; }
    step(dt) { this.slide = Math.min(1, this.slide + dt * 3); }
    decide(approve) { const ok = approve === (this.burger.flaws.length === 0); if (ok) { this.correct++; this.addCombo(); A.sfx('good'); this.particles.text(W / 2, 60, approve ? 'APPROVED ✓' : 'REJECTED ✓', '#8bd06a'); } else { this.mistakes++; A.sfx('error'); this.particles.text(W / 2, 60, approve ? 'You approved: ' + this.burger.flaws.join(', ') : 'That burger was fine!', '#ff6060'); } this.idx++; if (this.idx >= this.total) this.finish(this.correct / this.total); else this.gen(); }
    onTimeout() { this.finish(this.correct / this.total); }
    draw(g) {
      // executive tasting suite: dark room, one spotlight on the pedestal
      gfx.rect(0, 0, W, H, '#1a1a24');
      gfx.rect(0, 14, W, H - 14, '#26263a');
      for (let x = 0; x < W; x += 48) gfx.vline(x, 14, H, '#2c2c44');
      gfx.rect(0, 214, W, H - 214, '#1f1f30');
      gfx.rect(0, 214, W, 2, '#3a3a56');
      gfx.text('EXECUTIVE TASTING SUITE  -  FLOOR 9', W / 2, 20, '#f5c33b', { align: 'center', font: 'small' });
      const bx = W / 2 + 40 + Math.round((1 - CH.ease.outBack(this.slide)) * 200), by = 200;
      // the spotlight cone
      g.globalAlpha = 0.05;
      gfx.tri(bx - 14, 28, bx + 14, 28, bx - 74, by + 14, '#ffe6a8');
      gfx.tri(bx + 14, 28, bx + 74, by + 14, bx - 74, by + 14, '#ffe6a8');
      g.globalAlpha = 0.05;
      gfx.tri(bx - 9, 28, bx + 9, 28, bx - 48, by + 14, '#fff0c8');
      gfx.tri(bx + 9, 28, bx + 48, by + 14, bx - 48, by + 14, '#fff0c8');
      g.globalAlpha = 1;
      gfx.ellipse(bx, by + 12, 48, 9, 'rgba(255,230,168,0.07)');
      // guidelines card
      MG.panel(10, 34, 140, 110, { r: 3, face: '#fdf8ea' });
      gfx.rect(12, 36, 136, 8, MG.RED);
      gfx.hline(12, 36, 136, '#e0655a');
      gfx.text('BRAND GUIDELINES', 80, 36, '#fff6e4', { align: 'center', font: 'small' });
      ['1. Exactly one top bun', '2. At least one patty', '3. Max 4 patties', '4. No non-food items', '5. Must look like joy'].forEach((l, i) => gfx.text(l, 14, 48 + i * 9, '#2c2419', { font: 'small' }));
      gfx.hline(14, 96, 132, '#d8ccb2');
      gfx.text(`Burger ${this.idx + 1} of ${this.total}`, 14, 102, '#7a7266', { font: 'small' });
      gfx.text(`Correct: ${this.correct}`, 14, 112, '#3a9a5a', { font: 'small' });
      // pedestal
      MG.shadow(bx, by + 36, 42, 0.35);
      MG.ink(bx, by + 20, 96, 44, (cx, cy) => {
        gfx.rect(cx - 40, cy - 16, 80, 30, '#4a4e58');
        gfx.rect(cx - 40, cy - 16, 10, 30, '#666b76');
        gfx.rect(cx + 30, cy - 16, 10, 30, '#3a3e47');
        gfx.rect(cx - 44, cy - 20, 88, 6, '#8f959f');
        gfx.hline(cx - 44, cy - 20, 88, '#c6ccd6');
        gfx.hline(cx - 44, cy - 15, 88, '#5c616c');
      });
      this.burger.layers.forEach((l, i) => {
        const y = by - 4 - i * 5;
        if (l === 'shoe') {
          MG.ink(bx, y - 2, 30, 16, (cx, cy) => {
            gfx.rect(cx - 12, cy - 2, 24, 6, '#3f2717');
            gfx.rect(cx - 12, cy - 4, 11, 4, '#5a3721');
            gfx.hline(cx - 12, cy - 4, 11, '#8a5a3b');
            gfx.rect(cx - 12, cy + 3, 24, 2, '#241610');
            gfx.px(cx - 4, cy - 1, '#c8b08a');
          });
        } else if (F[l]) F[l](g, bx, y, 1);
      });
      gfx.text(this.burger.name, bx, by + 12, '#f5c33b', { align: 'center', shadow: '#0f0b16' });
      const npatty = this.burger.layers.filter((l) => l === 'patty').length;
      gfx.text(`${this.burger.layers.length} layers, ${npatty} patt${npatty === 1 ? 'y' : 'ies'}`, bx, by + 22, '#b8b2c4', { align: 'center', font: 'small' });
      if (MG.button(g, { x: 170, y: 236, w: 100, h: 20 }, 'REJECT ✗', { color: '#c8352b', font: 'main' })) this.decide(false);
      if (MG.button(g, { x: 350, y: 236, w: 100, h: 20 }, 'APPROVE ✓', { color: '#4f9d3a', font: 'main' })) this.decide(true);
      this.particles.draw(g);
      this.drawHud(g);
    }
  }
  CH.CBOScene = CBOScene;

  // ---------------------------------------------------------------- CEO -------------
  class CEOScene extends CH.MinigameScene {
    constructor(opts = {}) {
      super({ title: 'CEO', hint: 'Sign documents by dragging across the line. Then make The Decision.', difficulty: opts.difficulty || 1, timeLimit: 70 });
      this.docs = 8; this.signed = 0; this.sigPts = []; this.stock = 100; this.phase = 'sign'; this.decision = null;
      this.titles = ['Merger with Tam Hortons', 'Quarterly Pickle Report', 'Man Egg Kids Meal license', 'Expense: 400 mops', 'Rename M competitor "the other one"', 'Sad Egg toy recall (eyes fall off)', 'Employee wellness: pancake Fridays', 'Buy a moose'];
    }
    progress() { return this.phase === 'done' ? 1 : this.signed / this.docs * 0.8; }
    step(dt) {
      if (this.phase === 'sign') {
        const line = { x: 150, y: 190, w: 200, h: 30 };
        if (inp.mdown && inp.mouseIn(line)) { this.sigPts.push([inp.mx, inp.my]); if (this.t % 0.15 < dt) A.sfx('paper'); }
        if (!inp.mdown && this.sigPts.length) { const xs = this.sigPts.map((p) => p[0]); const span = Math.max(...xs) - Math.min(...xs); if (span > 120) { this.signed++; this.stock += 3 + Math.random() * 5; A.sfx('good'); this.addCombo(); this.particles.text(W / 2, 150, 'SIGNED', '#8bd06a'); if (this.signed >= this.docs) { this.phase = 'decision'; } } else { this.particles.text(W / 2, 150, 'sign the WHOLE line', '#f5c33b'); } this.sigPts = []; }
        this.stock -= dt * 0.8;
      }
    }
    onTimeout() { this.finish(CH.clamp(this.signed / this.docs, 0, 1)); }
    draw(g) {
      // penthouse at night
      gfx.rect(0, 0, W, H, '#0f0f1a');
      gfx.vgrad(0, 14, W, 100, ['#0f1424', '#141830', '#1b2140']);
      for (let i = 0; i < 20; i++) {
        const bx = i * 24, bh = 20 + ((i * 13) % 60);
        gfx.rect(bx, 114 - bh, 20, bh, '#1a2040');
        gfx.vline(bx, 114 - bh, bh, '#242c54');
        for (let k = 0; k < bh / 6; k++) if ((i + k) % 3) gfx.rect(bx + 4 + (k % 3) * 6, 114 - bh + 3 + k * 6, 2, 2, (i * k) % 5 ? '#f5e6b0' : '#8fb4ff');
      }
      for (let x = 0; x < W; x += 96) gfx.rect(x, 14, 4, 100, '#0a0a14');
      gfx.text('PENTHOUSE  -  FLOOR 10  -  THE BIG D', W / 2, 20, '#f5c33b', { align: 'center', font: 'small' });
      // stock ticker
      gfx.rect(0, 30, W, 10, '#07070d');
      gfx.hline(0, 30, W, '#23233a');
      gfx.hline(0, 39, W, '#23233a');
      const tk = `DNLD ${this.stock.toFixed(2)} ${this.stock >= 100 ? '▲' : '▼'}   TAMH 42.10 ▼   SEGO 8.00 ▲   MOOSE 1.00 ▲   `;
      gfx.text(tk + tk, W - ((this.t * 30) % (gfx.textWidth(tk, 'small'))), 32, this.stock >= 100 ? '#4f4' : '#f44', { font: 'small' });
      // desk
      gfx.rect(0, 114, W, H - 114, '#2a1a10');
      gfx.rect(0, 114, W, 4, '#4a2a18');
      gfx.hline(0, 113, W, '#6a4228');
      for (let y = 122; y < H; y += 9) gfx.hline(0, y, W, 'rgba(70,40,22,0.5)');
      for (let i = 0; i < 24; i++) gfx.px((i * 79) % W, 120 + ((i * 41) % (H - 122)), 'rgba(120,76,44,0.5)');
      if (this.phase === 'sign') {
        MG.shadow(250, 244, 130, 0.3);
        gfx.rect(118, 128, 264, 114, MG.INK);
        gfx.rect(120, 130, 260, 110, '#fdf8ea');
        gfx.rect(120, 130, 260, 10, MG.RED);
        gfx.hline(120, 130, 260, '#e0655a');
        gfx.text('DOCUMENT ' + (this.signed + 1) + ' OF ' + this.docs, 250, 132, '#fff6e4', { align: 'center', font: 'small' });
        gfx.text(this.titles[this.signed % this.titles.length], 250, 146, '#221c2c', { align: 'center' });
        for (let i = 0; i < 4; i++) gfx.rect(130, 160 + i * 6, 180 - (i % 2) * 40, 2, '#d5cbb4');
        for (let i = 0; i < 3; i++) gfx.rect(130, 184 + i * 5, 120 - i * 20, 1, '#e0d8c4');
        gfx.rect(150, 214, 200, 1, '#221c2c');
        gfx.text('X', 140, 208, '#221c2c', { font: 'small' });
        gfx.text('sign here (drag across the line)', 250, 222, '#8a8276', { align: 'center', font: 'small' });
        // an embossed corporate seal
        gfx.circle(340, 196, 13, '#efe4cd');
        gfx.circle(340, 196, 11, '#f7efdd');
        gfx.ellipseOutline(340, 196, 9, 9, '#d8c9a8');
        gfx.text('D', 340, 192, '#c8a060', { align: 'center' });
        for (let i = 1; i < this.sigPts.length; i++) { gfx.line(this.sigPts[i - 1][0], this.sigPts[i - 1][1], this.sigPts[i][0], this.sigPts[i][1], '#1a1a8a'); gfx.line(this.sigPts[i - 1][0], this.sigPts[i - 1][1] + 1, this.sigPts[i][0], this.sigPts[i][1] + 1, '#3a3ab0'); }
        // fancy pen
        MG.ink(inp.mx + 1, inp.my - 9, 12, 24, (cx, cy) => {
          gfx.rect(cx - 1, cy - 10, 4, 16, '#c8a028');
          gfx.rect(cx - 1, cy - 10, 2, 16, '#f5c33b');
          gfx.rect(cx - 1, cy - 12, 4, 3, '#2b2436');
          gfx.tri(cx - 1, cy + 6, cx + 3, cy + 6, cx + 1, cy + 11, '#3a3346');
          gfx.px(cx + 1, cy + 10, '#1a1a8a');
        });
        ui.cursor = 'none';
      } else if (this.phase === 'decision') {
        MG.panel(40, 118, W - 80, 134, { r: 5, face: '#fdf8ea' });
        gfx.rrect(44, 122, W - 88, 13, 3, MG.RED);
        gfx.text('THE DECISION', W / 2, 125, '#fff6e4', { align: 'center' });
        const lines = gfx.wrap("Corporate wants to cut employee health benefits to boost the stock 12%. Somewhere, a janitor's mom is in a hospital bed. You remember the bill. You remember the pancakes.", W - 104);
        lines.forEach((l, i) => gfx.text(l, 52, 144 + i * 10, '#2c2419'));
        if (MG.button(g, { x: 60, y: 212, w: 160, h: 18 }, 'Cut benefits (+12%)', { color: '#8a3a3a', font: 'main' })) { this.decision = 'cut'; this.stock *= 1.12; this.finish(0.6, { label: 'Stock up. Something else down.' }); }
        if (MG.button(g, { x: 260, y: 212, w: 160, h: 18 }, "Fund everyone's moms", { color: '#4f9d3a', font: 'main' })) { this.decision = 'moms'; this.stock *= 0.95; CH.flag('ceoMoms', true); this.finish(1, { label: 'Stock down 5%. Worth it.' }); }
      }
      this.particles.draw(g);
      this.drawHud(g);
    }
  }
  CH.CEOScene = CEOScene;

  // map jobs → minigame classes (the restaurant picks from these)
  CH.JOB_GAMES = {
    janitor: (o) => [new CH.MopScene(o), new CH.TableScene(o), new CH.BinScene(o), new CH.BathroomScene(o), new CH.RestockScene(o)],
    bagging: (o) => [new CH.BaggingScene(o)],
    fries: (o) => [new CH.FriesScene(o)],
    grill: (o) => [new CH.GrillScene(o)],
    assembly: (o) => [new CH.AssemblyScene(o)],
    cashier: (o) => [new CH.CashierScene(o)],
    drivethru: (o) => [new CH.DriveThruScene(o)],
    shiftlead: (o) => [new CH.ShiftLeadScene(o)],
    manager: (o) => [new CH.ManagerScene(o)],
    regional: (o) => [new CH.SauceScene(o)],
    vp: (o) => [new CH.SynergyScene(o)],
    cbo: (o) => [new CH.CBOScene(o)],
    ceo: (o) => [new CH.CEOScene(o)],
  };
  CH.SCENES.shiftlead = () => { const s = new CH.Scene(); s.enter = () => CH.game.push(new ShiftLeadScene({ difficulty: 1 })); return s; };
  CH.SCENES.manager = () => { const s = new CH.Scene(); s.enter = () => CH.game.push(new ManagerScene({ difficulty: 1 })); return s; };
  CH.SCENES.sauce = () => { const s = new CH.Scene(); s.enter = () => CH.game.push(new SauceScene({ difficulty: 1 })); return s; };
  CH.SCENES.synergy = () => { const s = new CH.Scene(); s.enter = () => CH.game.push(new SynergyScene({ difficulty: 1 })); return s; };
  CH.SCENES.cbo = () => { const s = new CH.Scene(); s.enter = () => CH.game.push(new CBOScene({ difficulty: 1 })); return s; };
  CH.SCENES.ceo = () => { const s = new CH.Scene(); s.enter = () => CH.game.push(new CEOScene({ difficulty: 1 })); return s; };
})(window.CH);
