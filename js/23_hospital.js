// ============================================================================
// HOSPITAL: ambulance ride, anxious waiting, the doctor, Mom's room, the bill
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, fx = CH.fx, A = CH.audio, inp = CH.input, S = CH.state, P = CH.PAL;
  const W = CH.W, H = CH.H;

  // ---- Ambulance cinematic -----------------------------------------------------------------
  class AmbulanceScene extends CH.Scene {
    constructor() { super(); this.name = 'ambulance'; this.x = 0; this.snow = []; for (let i = 0; i < 80; i++) this.snow.push([Math.random() * W, Math.random() * H, 0.5 + Math.random()]); }
    enter() { fx.setFade(1); fx.letterboxTarget = 1; this.run(this.co()); }
    *co() {
      yield fx.fadeIn(1.2);
      for (let i = 0; i < 5; i++) { A.sfx('siren'); yield 1.0; }
      yield fx.showCard("ST. MOOSEPH'S GENERAL", 'Emergency Department  -  9:47 PM', 3, '#d8e6e6');
      yield fx.fadeOut(1.0);
      fx.letterboxTarget = 0;
      CH.game.set(new HospitalScene());
    }
    update(dt) { this.x += dt * 160; for (const s of this.snow) { s[1] += dt * 40 * s[2]; s[0] -= dt * 60 * s[2]; if (s[1] > H) { s[1] = -2; s[0] = Math.random() * W; } if (s[0] < 0) s[0] += W; } }
    draw(g) {
      gfx.vgrad(0, 0, W, H, ['#070a18', '#0d1230', '#161c40', '#202a55']);
      // stars
      for (let i = 0; i < 30; i++) gfx.px((i * 53) % W, (i * 29) % 100, i % 4 ? '#8899bb' : '#fff');
      // far treeline
      for (let i = 0; i < 40; i++) { const tx = CH.wrap(i * 40 - this.x * 0.2, W + 60) - 30; const th = 40 + (i % 3) * 12; gfx.tri(tx - 12, 190, tx + 12, 190, tx, 190 - th, '#0b1424'); }
      gfx.rect(0, 190, W, 20, '#0b1424');
      // near trees
      for (let i = 0; i < 20; i++) { const tx = CH.wrap(i * 90 - this.x * 0.6, W + 100) - 50; const th = 70 + (i % 4) * 15; for (let k = 0; k < 3; k++) gfx.tri(tx - 18 + k * 3, 205 - k * 18, tx + 18 - k * 3, 205 - k * 18, tx, 205 - th, k % 2 ? '#122a1e' : '#0f2418'); gfx.rect(tx - 2, 200, 4, 10, '#0a0806'); }
      // snowy ground + road
      gfx.rect(0, 206, W, H - 206, '#c8d4dc'); gfx.rect(0, 218, W, 40, '#2a2a34'); gfx.rect(0, 218, W, 1, '#4a4a58');
      for (let i = 0; i < 12; i++) { const dx = CH.wrap(i * 50 - this.x * 1.0, W + 50) - 25; gfx.rect(dx, 237, 24, 2, '#f5c33b'); }
      gfx.rect(0, 258, W, 12, '#c8d4dc');
      // ambulance
      const bx = 180, by = 236 + Math.round(Math.sin(this.t * 14) * 1);
      gfx.rrect(bx, by - 44, 80, 34, 3, '#e8eef2'); gfx.rrect(bx + 80, by - 34, 28, 24, 3, '#e8eef2'); gfx.rect(bx + 84, by - 30, 18, 12, '#8fb8d8');
      gfx.rect(bx, by - 26, 108, 6, '#c8352b'); gfx.rect(bx + 6, by - 40, 30, 10, '#8fb8d8'); gfx.rect(bx + 42, by - 40, 30, 10, '#8fb8d8');
      gfx.text('AMBULANCE', bx + 40, by - 19, '#c8352b', { align: 'center', font: 'small' });
      // wheels
      for (const wx of [bx + 16, bx + 90]) { gfx.circle(wx, by - 6, 7, '#111'); gfx.circle(wx, by - 6, 3, '#888'); const a = this.t * 20; gfx.px(wx + Math.round(Math.cos(a) * 2), by - 6 + Math.round(Math.sin(a) * 2), '#fff'); }
      // lights
      const ph = Math.sin(this.t * 12) > 0;
      gfx.rect(bx + 20, by - 48, 10, 4, ph ? '#ff4040' : '#801010'); gfx.rect(bx + 50, by - 48, 10, 4, ph ? '#2040ff' : '#101080');
      g.globalAlpha = 0.25; gfx.rect(0, 0, W, H, ph ? '#ff3030' : '#3060ff'); g.globalAlpha = 1;
      // light cone ahead
      g.globalAlpha = 0.15; gfx.tri(bx + 108, by - 30, W, by - 80, W, by + 10, '#fff8c0'); g.globalAlpha = 1;
      // snow
      for (const s of this.snow) gfx.px(s[0], s[1], s[2] > 1 ? '#fff' : '#aab');
      // inside: Chubby's silhouette in the back window? small
      gfx.rect(bx + 44, by - 39, 26, 8, '#3a5a7a'); CH.drawChubby(g, bx + 62, by - 30, { outfit: 'hoodie', face: 'worried', noShadow: true, sx: 0.5, sy: 0.5, arm: 'pocket' });
    }
  }
  CH.AmbulanceScene = AmbulanceScene;

  // ---- Hospital corridor -----------------------------------------------------------------------
  class HospitalScene extends CH.WorldScene {
    constructor(opts = {}) {
      super({ width: 980, floorY: 214, playerX: opts.playerX || 530 });
      this.name = 'hospital'; this.mode = opts.mode || 'wait'; // wait | visit
      this.waitT = 0; this.interacted = 0; this.sat = false; this.sitting = false; this.paT = 8; this.beepT = 2; this.doctorOut = false;
      this.build();
    }
    drawRoom(g) {
      CH.paintHospital(g, this.width, this.floorY);
      // room numbers / floor line
      for (let x = 60; x < this.width; x += 240) { gfx.rect(x, this.floorY - 58, 2, 60, '#3fa79a'); }
      gfx.text('WARD 4  -  CARDIOLOGY', 700, 44, '#3fa79a', { font: 'small' });
      gfx.text('← ELEVATORS', 80, 44, '#5a6a7a', { font: 'small' }); gfx.text('EXIT →', 930, 44, '#c8352b', { font: 'small' });
      // baseboard shadows under things
      g.globalAlpha = 0.5; for (let x = 0; x < this.width; x += 7) gfx.px(x, this.floorY + 1, '#8a9a9c'); g.globalAlpha = 1;
    }
    build() {
      const F = this.floorY;
      const say = (t, o) => () => ui.say('Chubby', t, Object.assign({ face: 'worried' }, o));
      // lights
      for (let x = 30; x < this.width; x += 80) this.addProp('fluor', x, 34, { st: { flicker: x === 350 || x === 750 } });
      this.addProp('elevator', 16, F, { hint: 'Elevator', interact: () => this.interactElevator() });
      this.addProp('nurseDesk', 96, F, { layer: 'front', hint: 'Nurse desk', interact: () => this.interactDesk(), promptY: F - 50 });
      this.addProp('hChairs', 180, F, { hint: 'Chairs', interact: () => this.interactChairs(200), range: 40 });
      this.addProp('hChairs', 250, F, { hint: 'Chairs', interact: () => this.interactChairs(270), range: 40 });
      this.addProp('hPoster', 190, 140, { st: { variant: 0 }, hint: 'Poster', interact: say("'WASH YOUR PAWS'. A cartoon otter is winking at me. I don't trust it.") });
      this.addProp('vending', 330, F, { hint: 'Vending machine', interact: () => this.interactVending() });
      this.addProp('waterFountain', 372, F, { hint: 'Fountain', interact: () => this.interactFountain() });
      this.addProp('extinguisher', 400, 170, { hint: 'Extinguisher', interact: say("In case of fire. {p}I feel like I'm the fire.") });
      this.addProp('sanitizer', 420, 160, { hint: 'Sanitizer', interact: () => this.interactSanitizer() });
      this.addProp('hSign', 456, 128, { st: { text: 'ROOM 4' } });
      this.roomDoor = this.addProp('hDoor', 470, F, { hint: "Mom's room", st: { label: '4', open: false }, interact: () => this.interactRoomDoor(), range: 30 });
      this.addProp('hClock', 520, 110, { hint: 'Clock', interact: () => this.interactClock() });
      this.addProp('hTV', 560, 130, { hint: 'TV', interact: say("Muted news. The Mallards lost again. A weather moose says more snow. {p}Nothing about my mom. Why would there be. Why did I think that.") });
      this.addProp('hPoster', 620, 140, { st: { variant: 1 }, hint: 'Poster', interact: say("'EAT YOUR VEGETABLES'. {p}I had a pancake with syrup for breakfast. Syrup comes from a tree. That's a plant. That's a vegetable.") });
      this.addProp('hDoor', 650, F, { st: { label: '5' }, hint: 'Room 5', interact: say("Someone else's room. Someone else's family.") });
      this.addProp('hSign', 640, 128, { st: { text: 'ROOM 5' } });
      this.addProp('gurney', 710, F, { hint: 'Gurney', interact: say('An empty gurney. The sheet is still warm somehow. I hate this.') });
      this.addProp('plant', 780, F, { st: { variant: 2 }, hint: 'Plant', interact: say("A dead plant. In a hospital. {p}Nobody watered it. I get it, plant. Nobody is watering me either.") });
      this.addProp('hChairs', 800, F, { hint: 'Chairs', interact: () => this.interactChairs(820), range: 40 });
      this.addProp('trashBin', 870, F, { hint: 'Bin', interact: say('Coffee cups. Tissue. A single glove.') });
      this.addProp('hDoor', 900, F, { st: { label: 'EXIT' }, hint: 'Exit', interact: () => this.interactExit() });
      this.addProp('hSign', 890, 128, { st: { text: 'EXIT →' } });
      this.addProp('ivStand', 760, F, { hint: 'IV stand', interact: say("Drip. Drip. Drip. It's counting something I can't see.") });
      // NPCs
      this.nurse1 = CH.makeNurse(140, F + 2, 0); this.nurse1.wanderRange = [120, 380]; this.addNPC(this.nurse1);
      this.nurse2 = CH.makeNurse(700, F + 2, 1); this.nurse2.wanderRange = [560, 900]; this.nurse2.arm = 'clipboard'; this.addNPC(this.nurse2);
      this.patient = new CH.NPC({ name: 'Patient', species: 'owl', outfit: 'gown', x: 745, y: F + 3, pose: 'sit', height: 0.95 }); this.addNPC(this.patient);
      this.wheelchair = this.addCustom((g, x, y) => CH.PROPS.wheelchair.draw(g, x, y), 735, F + 4, 20, 22, { id: 'wheelchair', layer: 'back', anim: true });
      this.oldGoat = new CH.NPC({ name: 'Patient', species: 'deer', outfit: 'gown', x: 600, y: F + 1, speed: 14, height: 1.1 }); this.oldGoat.wanderRange = [560, 690]; this.addNPC(this.oldGoat);
      this.ivFollow = this.addCustom((g, x, y) => CH.PROPS.ivStand.draw(g, x, y, this.t), 610, F + 1, 10, 50, { id: 'ivFollow', layer: 'back', anim: true });
      this.doctor = CH.makeDoctor(490, F + 1); this.doctor.hidden = true; this.doctor.arm = 'clipboard'; this.addNPC(this.doctor);
      this.player.face = 'worried'; this.player.sweat = 0.4;
      this.player.stepSfx = 'step';
    }
    enter() {
      A.play('hospital', 2);
      fx.setFade(1);
      this.run(this.mode === 'wait' ? this.waitFlow() : this.visitFlow());
    }
    // ---- flows -----------------------------------------------------------------------------------
    *waitFlow() {
      this.locked = true; this.hud = true; S.hour = 21.8;
      yield fx.fadeIn(1.5);
      yield 0.6;
      yield ui.say('Chubby', 'They took her in there an hour ago. {pp}Nobody has come out.', { face: 'worried', slow: true });
      yield ui.say('Chubby', "I should— I don't know what I should do. {p}Wait. I should wait.", { face: 'worried' });
      ui.setObjective('Wait for news about Mom');
      ui.setHint('Explore, sit down, or just wait. E to interact.', 5);
      this.locked = false;
      // wait until conditions met
      while (!this.doctorOut) {
        this.waitT += 0.1;
        const ready = this.waitT > 40 || (this.sat && this.interacted >= 2 && this.waitT > 22) || (this.interacted >= 4 && this.waitT > 18);
        if (ready && !ui.busy() && !this.sitting) { this.doctorOut = true; break; }
        yield 0.1;
      }
      yield* this.doctorScene();
    }
    *doctorScene() {
      const pl = this.player;
      this.locked = true; pl.vx = 0;
      ui.setObjective('');
      // door opens
      this.roomDoor.st.open = true; A.sfx('door');
      this.doctor.hidden = false; this.doctor.x = 487; this.doctor.flip = pl.x < 487;
      yield 0.8;
      pl.flip = pl.x > this.doctor.x; pl.face = 'worried';
      yield this.doctor.walkTo(pl.x + (pl.x > this.doctor.x ? -26 : 26));
      this.doctor.flip = this.doctor.x > pl.x;
      pl.flip = pl.x > this.doctor.x;
      yield 0.6;
      yield ui.say('Doctor', "Are you... Chubby? {p}Mrs. Quillsworth's son?", { slow: true });
      yield ui.say('Chubby', 'Yes. {p}Yes. Is she— {p}is she okay?', { face: 'worried' });
      yield 1.2;
      yield ui.say('Doctor', "I'm Dr. Beaverton. {pp}Let's... {p}sit down for a second.", { slow: true });
      yield ui.say('Chubby', "I'd rather stand. {p}Please. Just tell me.", { face: 'worried' });
      yield 1.5;
      A.stop(1.5);
      yield ui.say('Doctor', "Your mother had a heart attack. {pp}A significant one.", { slow: true });
      // freeze: desaturate, muffle, slow
      fx.tint = { color: '#6a7a90', alpha: 0.55 };
      A.setMuffle(true);
      pl.face = 'shock'; pl.sweat = 0;
      CH.hitstop(0.3);
      for (let i = 0; i < 3; i++) { A.sfx('heartbeat'); yield 1.4; }
      yield ui.say('Doctor', "She's stable. {pp}For now. {ppp}But the damage to her heart is... {p}considerable. She's going to need surgery, and after that... {p}a long recovery.", { slow: true, color: '#c8d0dc' });
      A.sfx('heartbeat'); yield 1.4;
      yield ui.say('Chubby', '...', { face: 'shock', slow: true, noSkip: true, auto: 3 });
      A.sfx('heartbeat'); yield 1.4;
      yield ui.say('Doctor', "Chubby? {pp}Are you with me?", { slow: true, color: '#c8d0dc' });
      yield 2.0;
      yield ui.say('Chubby', "...{p}She made pancakes this morning.", { face: 'sad', slow: true });
      yield 1.5;
      yield ui.say('Doctor', "{pp}...I'm sure they were very good.", { slow: true, color: '#c8d0dc' });
      yield 1.0;
      fx.tint = null; A.setMuffle(false);
      A.play('sad', 3);
      yield ui.say('Doctor', "She's awake. She's been asking for you. {p}You can go in, but keep it calm. {p}She needs rest.", {});
      yield ui.say('Doctor', "I'll come find you in a bit. {p}There are... {p}some things we'll need to go over.", {});
      this.doctor.walkTo(120);
      this.doctor.onArrive = () => { this.doctor.hidden = true; };
      pl.face = 'sad';
      ui.setObjective("Go into Room 4 and see Mom");
      this.canEnter = true;
      this.locked = false;
    }
    *visitFlow() {
      // returning visits (life sim)
      this.locked = true;
      yield fx.fadeIn(1);
      this.canEnter = true;
      ui.setObjective("Visit Mom in Room 4");
      this.locked = false;
    }
    // ---- interactions ------------------------------------------------------------------------------
    *interactChairs(x) {
      const pl = this.player;
      this.interacted++;
      this.locked = true;
      yield this.walkTo(x);
      pl.sitting = true; pl.y = this.floorY - 8; pl.arm = 'belly'; this.sitting = true; this.sat = true;
      A.sfx('couch');
      const thoughts = ["She was fine. She was FINE. She was singing.", "The chair is bolted down. Everything here is bolted down.", "Someone left a magazine from 2019. 'Ten Ways To Relax'. Ha.", "My hoodie still smells like the fireplace.", "Tap tap tap tap tap tap.", "I should have gone for that walk with her.", "Is that... is that the doctor? No. Nurse. Okay. Okay."];
      ui.setHint('Press any direction to stand up', 3);
      let tt = 0, nextThought = 1.5;
      while (true) {
        tt += 1 / 30;
        // nervous idle: foot tapping + look around + sweat
        pl.lookX = Math.sin(tt * 1.3) > 0.6 ? 1 : Math.sin(tt * 1.3) < -0.6 ? -1 : 0;
        if (Math.floor(tt * 6) % 2 === 0) pl.squashY.x = 1.02; else pl.squashY.x = 0.99;
        if (Math.floor(tt * 6) % 6 === 0 && tt % 1 < 0.05) A.sfx('tick');
        pl.arm = Math.sin(tt * 0.5) > 0.7 ? 'cover' : 'belly';
        if (tt > nextThought && !ui.busy()) { nextThought = tt + 5; ui.say('', CH.pick(thoughts), { color: '#cfc8e8', auto: 3.5 }); }
        if (inp.axisX() !== 0 || inp.hit('jump')) break;
        if (this.doctorOut || (this.waitT > 18 && this.sat && tt > 9)) { break; }
        this.waitT += 1 / 30 * 1.8; S.hour += (1 / 30) * 0.02;
        yield 1 / 30;
      }
      ui.clearDialog();
      pl.sitting = false; pl.y = this.floorY; pl.arm = 'idle'; pl.lookX = 0; this.sitting = false;
      this.locked = false;
    }
    *interactVending() {
      this.interacted++;
      if (S.money < 2) { yield ui.say('Chubby', 'I have ' + CH.fmtMoney(S.money) + '. The chips are $2.00. {p}Of course they are.', { face: 'sad' }); return; }
      const c = yield ui.choose('Chubby', 'The machine hums. Chips $2.00, Chocolate $2.50, Water $3.00.', ['Buy chips ($2.00)', 'Buy chocolate ($2.50)', 'Buy water ($3.00)', 'Walk away']);
      if (c === 3 || c < 0) return;
      const cost = [2, 2.5, 3][c];
      if (S.money < cost) { yield ui.say('Chubby', "Can't afford it.", { face: 'sad' }); return; }
      CH.addMoney(-cost); ui.showMoney = true;
      this.locked = true;
      A.sfx('vending'); yield 1.0;
      this.player.arm = 'hold';
      const names = ['a bag of chips', 'a chocolate bar', 'a bottle of water'];
      yield ui.say('Chubby', 'I bought ' + names[c] + '. {p}I do not want ' + names[c] + '.', { face: 'worried' });
      for (let i = 0; i < 3; i++) { this.player.mouth = 'eat'; A.sfx('eat'); yield 0.3; }
      this.player.mouth = null; this.player.arm = 'idle';
      yield ui.say('Chubby', c === 0 ? 'It tastes like cardboard and anxiety.' : c === 1 ? 'Sugar. Good. My paws stop shaking for a second.' : 'Water. Mom always says I never drink enough water.', { face: 'worried' });
      S.hunger = Math.max(0, S.hunger - 15);
      this.locked = false;
    }
    *interactFountain() { this.interacted++; this.locked = true; this.player.arm = 'hold'; A.sfx('fill'); yield 0.8; this.player.arm = 'idle'; yield ui.say('Chubby', 'Lukewarm. Tastes like pennies. {p}I drink four gulps because I have nothing else to do with my body.', { face: 'worried' }); this.locked = false; }
    *interactSanitizer() { this.interacted++; A.sfx('squirt'); this.particles.burst(430, 165, 6, { color: ['#9fdcff', '#fff'], speed: 25, life: 0.4 }); yield 0.4; yield ui.say('Chubby', 'Cold. Smells like a hospital. {p}Because it is a hospital.', { face: 'worried' }); }
    *interactClock() { this.interacted++; yield ui.say('Chubby', `${CH.timeStr()}. {p}It's been ${Math.floor(this.waitT / 3) + 5} minutes. {p}It feels like ${Math.floor(this.waitT / 3) + 5} years.`, { face: 'worried' }); }
    *interactDesk() {
      this.interacted++;
      const lines = ["The doctor is still with her, hon. As soon as we know something, you'll know.", "You can sit down, you know. Standing there won't make it go faster.", "Do you want a blanket? You look cold. {p}You're shaking, hon.", "Room 4. Dr. Beaverton is very good. She's in good hands."];
      const n = Math.min(this.deskTalks || 0, lines.length - 1);
      this.deskTalks = (this.deskTalks || 0) + 1;
      yield ui.say('Nurse', lines[n], { portrait: 'Nurse' });
      if (n === 2) { yield ui.say('Chubby', "I'm okay. {p}I'm okay.", { face: 'worried' }); }
    }
    *interactElevator() { this.interacted++; yield ui.say('Chubby', "The elevator. {p}I could leave. Go home. Pretend today didn't happen. {pp}...No.", { face: 'sad' }); }
    *interactExit() { if (this.onExit) { yield* this.onExit(); return; } yield ui.say('Chubby', "I'm not leaving.", { face: 'sad' }); }
    *interactRoomDoor() {
      if (!this.canEnter) { yield ui.say('Chubby', "The door's closed. A nurse told me to wait. {p}So I'm waiting.", { face: 'worried' }); return; }
      this.locked = true;
      A.sfx('door'); yield fx.fadeOut(0.8);
      CH.game.set(new MomRoomScene({ mode: this.mode === 'wait' ? 'first' : 'visit', hospital: this }));
    }
    update(dt) {
      super.update(dt);
      this.ivFollow.x = this.oldGoat.x - 12;
      // ambience
      this.beepT -= dt; if (this.beepT <= 0) { this.beepT = CH.rand(2, 5); if (CH.chance(0.7)) A.sfx('beep'); }
      this.paT -= dt;
      if (this.paT <= 0) { this.paT = CH.rand(12, 22); ui.toast(CH.pick(['PA: Dr. Beaverton to ward 4, Dr. Beaverton.', 'PA: Visiting hours end at 11 PM.', 'PA: Will the owner of a blue snowmobile...', 'PA: Code brown, cafeteria. Code brown.', 'PA: Nurse Gosling to the front desk.', 'PA: The gift shop is now closed.']), '#aab', 4); }
      // random nurse chatter
      if (CH.chance(dt * 0.05)) this.nurse1.say(CH.pick(['Room 12 needs a blanket.', '*sigh*', 'Coffee. Need coffee.']), 2.5);
      if (this.roomDoor.st.open && this.t % 1 < dt) { /* keep open a while */ }
    }
    drawHud(g) { super.drawHud(g); }
  }
  CH.HospitalScene = HospitalScene;

  // door open state drawing hook
  const hDoorDraw = CH.PROPS.hDoor.draw;
  CH.PROPS.hDoor.draw = (g, x, y, t, st) => {
    if (st && st.open) {
      gfx.rect(x - 2, y - 68, 38, 68, '#8a8a94'); gfx.rect(x, y - 66, 34, 66, '#3a4a5a');
      // room interior glimpse
      gfx.rect(x + 2, y - 64, 30, 62, '#e8f0f0'); gfx.rect(x + 4, y - 30, 26, 10, '#8fb8d8'); gfx.rect(x + 6, y - 40, 6, 8, '#222'); gfx.px(x + 8, y - 37, '#4f4');
      // door swung open (thin)
      gfx.rect(x + 30, y - 66, 5, 66, '#d8dce4'); gfx.rect(x + 35, y - 66, 1, 66, '#8a8a94');
      return;
    }
    hDoorDraw(g, x, y, t, st);
  };

  // ---- Mom's room ------------------------------------------------------------------------------------
  class MomRoomScene extends CH.WorldScene {
    constructor(opts = {}) {
      super({ width: 480, floorY: 214, playerX: 30 });
      this.name = 'momroom'; this.mode = opts.mode || 'first'; this.hospital = opts.hospital;
      this.build();
    }
    drawRoom(g) {
      gfx.rect(0, 0, W, 30, '#c8ccd4'); for (let x = 0; x < W; x += 30) gfx.vline(x, 0, 30, '#b0b4bc'); gfx.hline(0, 30, W, '#9aa0aa');
      gfx.rect(0, 31, W, this.floorY - 31, '#e2ece8'); gfx.rect(0, this.floorY - 60, W, 3, '#8fb8d8');
      gfx.rect(0, this.floorY - 8, W, 8, '#9db4b8');
      gfx.rect(0, this.floorY, W, H - this.floorY, '#b9c7c9');
      for (let y = this.floorY; y < H; y += 12) for (let x = -((y / 12) & 1) * 12; x < W; x += 24) gfx.rect(x, y, 12, 12, '#c4d0d2');
      for (let y = this.floorY; y < H; y += 12) gfx.hline(0, y, W, '#a6b4b6'); for (let x = 0; x < W; x += 12) gfx.vline(x, this.floorY, H - this.floorY, '#a6b4b6');
      // window with night city
      const wx = 330, wy = 70; gfx.rect(wx, wy, 90, 60, '#1a2140');
      for (let i = 0; i < 14; i++) { const bx = wx + 4 + i * 6, bh = 10 + ((i * 7) % 25); gfx.rect(bx, wy + 60 - bh - 6, 5, bh + 6, '#2a3a5a'); for (let k = 0; k < bh / 4; k++) if ((i + k) % 3) gfx.px(bx + 1 + (k % 2) * 2, wy + 60 - bh - 4 + k * 4, '#f5e6b0'); }
      gfx.rect(wx, wy + 54, 90, 6, '#3a4a6a');
      for (let i = 0; i < 20; i++) gfx.px(wx + (i * 37) % 90, wy + (i * 13) % 30, i % 3 ? '#fff' : '#9fdcff');
      gfx.rect(wx - 2, wy - 2, 94, 2, '#fff'); gfx.rect(wx - 2, wy + 60, 94, 3, '#fff'); gfx.rect(wx - 2, wy, 2, 60, '#fff'); gfx.rect(wx + 90, wy, 2, 60, '#fff'); gfx.rect(wx + 44, wy, 2, 60, '#fff');
      // whiteboard
      gfx.rect(40, 70, 60, 40, '#fff'); gfx.frame(40, 70, 60, 40, '#8a8a94'); gfx.text('RN: GOSLING', 44, 74, '#3b6fd6', { font: 'small' }); gfx.text('DR: BEAVERTON', 44, 82, '#3b6fd6', { font: 'small' }); gfx.text('GOAL: REST', 44, 90, '#c8352b', { font: 'small' }); gfx.text('PAIN: 3/10', 44, 98, '#333', { font: 'small' });
      // get-well card drawn by... nobody yet
    }
    build() {
      const F = this.floorY;
      this.addProp('fluor', 60, 34); this.addProp('fluor', 200, 34); this.addProp('fluor', 380, 34, { st: { flicker: true } });
      this.addProp('curtainRail', 110, F - 30, { layer: 'back' });
      this.addProp('monitor', 150, F, { hint: 'Monitor', interact: () => ui.say('Chubby', "Beep. {p}Beep. {p}Beep. {pp}Every beep is a good beep. I keep telling myself that.", { face: 'sad' }) });
      this.bed = this.addProp('hBed', 190, F, { hint: 'Mom', interact: () => this.interactMom(), range: 50 });
      this.addProp('ivStand', 266, F, { hint: 'IV drip' });
      this.addProp('bedsideTable', 276, F, { hint: 'Table', interact: () => ui.say('Chubby', "Flowers from the nurses' station. A cup of water she hasn't touched. {p}Her glasses, folded.", { face: 'sad' }) });
      this.addProp('chair', 120, F, { hint: 'Chair', interact: () => this.interactChair() });
      this.addProp('hClock', 440, 110, { hint: 'Clock', interact: () => ui.say('Chubby', CH.timeStr() + '. {p}The clock in here is louder.', { face: 'sad' }) });
      this.addProp('sanitizer', 20, 160);
      this.addProp('trashBin', 440, F);
      // mom in bed (custom drawn over the bed)
      this.momAwake = true; this.momTalk = false; this.momFace = 'tired';
      // let dialogue bubbles find Mom even though she is drawn as scenery
      this.speakerAt = (n) => (n === 'Mom' ? { x: 212, y: this.floorY - 48 } : null);
      this.momDraw = this.addCustom((g, x, y) => {
        CH.drawCritter(g, x, y, { species: 'porcupine', outfit: 'gown', pose: 'inbed', glasses: false, hair: 'bun', hairColor: '#d8d0c0', face: this.momFace, sleep: !this.momAwake, blink: !this.momAwake, talk: this.momTalk, noShadow: true, fur: '#9a6a48' });
        // blanket over her
        gfx.rect(x - 4, y + 2, 60, 6, '#8fb8d8'); gfx.hline(x - 4, y + 2, 60, '#a8ccec');
      }, 206, F - 26, 20, 20, { id: 'mom', layer: 'back', anim: true });
      this.player.face = 'sad'; this.player.stepSfx = 'step';
    }
    enter() {
      if (this.mode === 'first') A.play('sad', 2); else A.play('hospital', 2);
      fx.setFade(1);
      this.run(this.mode === 'first' ? this.firstVisit() : this.laterVisit());
    }
    *interactChair() { const pl = this.player; this.locked = true; yield this.walkTo(128); pl.sitting = true; pl.y = this.floorY - 10; pl.flip = false; yield ui.say('Chubby', "I sit. {p}I watch her breathe. {pp}In. {p}Out.", { face: 'sad', slow: true }); pl.sitting = false; pl.y = this.floorY; this.locked = false; }
    *interactMom() {
      if (this.mode === 'first') { yield* this.talkFirst(); return; }
      yield* this.talkVisit();
    }
    *firstVisit() {
      const pl = this.player;
      this.locked = true;
      yield fx.fadeIn(1.5);
      yield 0.8;
      yield this.walkTo(170);
      pl.flip = false;
      yield 1.0;
      yield* this.talkFirst();
    }
    *talkFirst() {
      const pl = this.player;
      this.locked = true; pl.face = 'sad';
      const M = (t, o = {}) => { this.momTalk = true; return ui.say('Mom', t, Object.assign({ slow: true, face: this.momFace }, o)); };
      const C = (t, o = {}) => ui.say('Chubby', t, Object.assign({ face: 'sad' }, o));
      yield M("...Hey, sweetheart."); this.momTalk = false;
      yield 1.0;
      const c1 = yield ui.choose('Chubby', "She looks so small in that bed.", ["Mom... I'm so sorry.", 'Are you okay? Are you in pain?', '(Hold her hand and say nothing)']);
      if (c1 === 0) {
        yield M("Sorry? {pp}For what? {pp}You called for help. You did everything right."); this.momTalk = false;
        yield C("I was playing a game. You were on the floor and I was— {p}I didn't even hear you fall.");
        yield 1.2;
        yield M("Chubby. {pp}Look at me. {ppp}This is not your fault."); this.momTalk = false;
        yield 1.5;
      } else if (c1 === 1) {
        yield M("I'm okay. {p}They gave me the good drugs. {pp}The ceiling has a lot of tiles. I've been counting."); this.momTalk = false;
        yield C("...How many?");
        yield M("Forty-two. {pp}Then I fell asleep."); this.momTalk = false;
        pl.setFace('happy', 1.5); yield 1.5;
      } else {
        pl.arm = 'hold';
        yield 3.5;
        yield M("...Your hands are cold."); this.momTalk = false;
        yield 1.0;
        yield C("...Yours are warm.");
        yield M("That's the drugs.", { face: 'happy' }); this.momTalk = false;
        yield 1.5;
        pl.arm = 'idle';
      }
      yield M("The doctor talked to you."); this.momTalk = false;
      yield 1.5;
      yield C("...Yeah.");
      yield 1.0;
      yield M("So you know I'm going to need... {pp}some help. {p}For a while."); this.momTalk = false;
      const c2 = yield ui.choose('Chubby', '', ["We'll figure it out.", "I'll take care of everything. I promise.", "How long is 'a while'?"]);
      if (c2 === 0) { yield M("We. {pp}I like 'we'.", { face: 'happy' }); this.momTalk = false; }
      else if (c2 === 1) { yield M("Chubby... {pp}You don't have to promise me anything."); this.momTalk = false; yield C("I know. {pp}I'm doing it anyway."); yield 1.5; }
      else { yield M("They don't know. {pp}The surgery, and then... {p}they'll see."); this.momTalk = false; yield C("...", { auto: 2.5, noSkip: true }); yield 1; }
      yield 1.0;
      yield M("Did you eat?"); this.momTalk = false;
      yield C("Mom.");
      yield M("There's a vending machine. I saw it when they wheeled me in. Get something."); this.momTalk = false;
      if (S.money < 12.5) { yield C("I did. {p}It was terrible."); yield M("Good. {p}Then you're okay.", { face: 'happy' }); this.momTalk = false; }
      else { yield C("I will. {p}Later."); yield M("Mm-hm. {p}I know that 'later'.", { face: 'happy' }); this.momTalk = false; }
      yield 1.5;
      A.sfx('yawn');
      yield M("I'm going to close my eyes for a bit. {ppp}Don't go home yet. {pp}Just... {p}sit with me a while."); this.momTalk = false;
      yield C("I'm not going anywhere.");
      yield 1.0;
      this.momAwake = false; this.momFace = 'sleep';
      // sit in chair
      yield this.walkTo(128); pl.flip = false; pl.sitting = true; pl.y = this.floorY - 10; pl.arm = 'belly';
      // long quiet
      for (let i = 0; i < 6; i++) { A.sfx('beep'); yield 1.1; }
      yield ui.say('', "The monitor beeps. {pp}Snow taps the window. {ppp}Somewhere down the hall, someone laughs, and it sounds impossible.", { color: '#cfc8e8', slow: true });
      for (let i = 0; i < 3; i++) { A.sfx('beep'); yield 1.1; }
      // doctor enters with bill
      A.sfx('door');
      const doc = CH.makeDoctor(-20, this.floorY + 1); doc.arm = 'clipboard'; this.addNPC(doc);
      yield doc.walkTo(90);
      pl.sitting = false; pl.y = this.floorY; pl.arm = 'idle'; pl.flip = true;
      yield ui.say('Doctor', "Sorry to interrupt. {pp}The front desk asked me to give you this. {p}It's... {p}the preliminary estimate.", { slow: true });
      yield ui.say('Chubby', 'Estimate of what?', { face: 'worried' });
      yield 0.8;
      A.sfx('paper');
      const done = new CH.Signal();
      CH.game.push(new BillScene(() => done.resolve()));
      yield done;
      yield 0.5;
      yield ui.say('Chubby', "...{pp}How much?", { face: 'dead', slow: true });
      yield ui.say('Doctor', "I know. {pp}The provincial plan covers the basics, but the procedure she needs isn't... {p}Talk to the desk about payment plans. Most families... {p}find a way.", { slow: true });
      yield 1.5;
      yield ui.say('Chubby', "...Find a way.", { face: 'dead', slow: true });
      yield 1.0;
      doc.walkTo(-30);
      yield 1.5;
      pl.flip = false; pl.face = 'sad';
      yield ui.say('Chubby', "Eighty-four thousand dollars. {pp}I have twelve dollars and fifty cents. {pp}And a game about a hedgehog.", { face: 'sad', slow: true });
      yield 1.5;
      pl.face = 'focused';
      yield ui.say('Chubby', "...Okay. {pp}Okay.", { face: 'focused', slow: true });
      A.stop(1);
      yield fx.fadeOut(2);
      yield 0.5;
      A.sfx('notify');
      yield fx.showCard('NEW OBJECTIVE', 'GET A JOB.', 3.5, '#f5c33b');
      S.chapter = 'jobsearch'; S.day = 2; S.hour = 8; S.money = Math.round((S.money) * 100) / 100; S.momHealth = 20;
      CH.autosave('Autosaved');
      if (CH.startJobSearch) CH.startJobSearch(); else CH.game.set(new CH.CabinScene({ mode: 'home', momPresent: false, playerX: 60 }));
    }
    *laterVisit() {
      this.locked = true; yield fx.fadeIn(1); this.locked = false;
      ui.setObjective('Talk to Mom');
    }
    *talkVisit() {
      if (CH.momVisitDialogue) { yield* CH.momVisitDialogue(this); return; }
      yield ui.say('Mom', 'Hi sweetheart.');
    }
    update(dt) { super.update(dt); }
  }
  CH.MomRoomScene = MomRoomScene;

  // ---- The Bill ---------------------------------------------------------------------------------------------
  class BillScene extends CH.Scene {
    constructor(onDone) {
      super(); this.overlay = true; this.onDone = onDone;
      this.items = [
        ['Ambulance transport (rural, 42 km)', 240.0], ['Emergency assessment', 0.0, '(covered)'], ['Cardiac imaging (out-of-province unit)', 2150.0], ['Specialist consult - Dr. Beaverton', 980.0],
        ['Advanced cardiac procedure', 61500.0, '(NOT covered by provincial plan)'], ['Private room (only room available) x3', 3600.0], ['Medications (brand-name only)', 4320.17, '(no generics available up north)'],
        ['Long-term rehabilitation (est. 12 weeks)', 9600.0], ['Cardiac monitor rental', 1400.0], ['Hospital pillow', 28.0], ['Parking validation', 12.0], ['Get-well balloon (complimentary)', 0.0], ['Administrative fee for calculating fees', 400.0],
      ];
      this.total = this.items.reduce((a, b) => a + b[1], 0);
      this.scroll = 0; this.target = 0; this.phase = 'unroll'; this.t2 = 0; this.shown = 0;
    }
    update(dt) {
      this.t2 += dt;
      const lineH = 12, headH = 40, paperH = headH + this.items.length * lineH + 70;
      if (this.phase === 'unroll') {
        this.shown = Math.min(paperH, this.shown + dt * 140);
        if (this.shown % 12 < 3 && Math.random() < 0.3) A.sfx('paper');
        this.scroll = Math.max(0, this.shown - (H - 40));
        if (this.shown >= paperH) { this.phase = 'total'; A.sfx('thud'); CH.doShake(4, 0.4); this.t2 = 0; }
      } else if (this.phase === 'total') {
        if (this.t2 > 1.2 && (inp.hit('interact') || inp.hit('confirm') || inp.hit('jump') || inp.mpressed)) { inp.eat(); this.phase = 'done'; CH.game.pop(); this.onDone(); }
      }
    }
    draw(g) {
      g.globalAlpha = 0.6; gfx.rect(0, 0, W, H, '#000'); g.globalAlpha = 1;
      const px = W / 2 - 110, pw = 220;
      const lineH = 12, headH = 40;
      const top = 20 - this.scroll;
      const shownH = Math.round(this.shown);
      gfx.clip(0, 0, W, H);
      // paper
      gfx.rect(px, top, pw, shownH, '#f8f4e8'); gfx.rect(px + 1, top, pw - 2, 1, '#fff');
      // torn edge at bottom
      for (let x = 0; x < pw; x += 4) gfx.rect(px + x, top + shownH - ((x / 4) & 1) * 2, 4, 2, '#f8f4e8');
      gfx.clip(px, top, pw, shownH);
      gfx.text("ST. MOOSEPH'S GENERAL HOSPITAL", px + pw / 2, top + 6, '#222', { align: 'center', font: 'small' });
      gfx.text('STATEMENT OF ESTIMATED CHARGES', px + pw / 2, top + 14, '#222', { align: 'center', font: 'small' });
      gfx.text('PATIENT: QUILLSWORTH, MARGARET', px + 8, top + 24, '#555', { font: 'small' });
      gfx.text('GUARANTOR: QUILLSWORTH, CHUBBY', px + 8, top + 31, '#c8352b', { font: 'small' });
      gfx.hline(px + 6, top + headH - 2, pw - 12, '#888');
      this.items.forEach((it, i) => {
        const y = top + headH + i * lineH;
        gfx.text(it[0], px + 8, y, '#222', { font: 'small' });
        if (it[2]) gfx.text(it[2], px + 8, y + 6, it[1] === 0 ? '#3a9a5a' : '#c8352b', { font: 'small' });
        gfx.text(CH.fmtMoney(it[1]), px + pw - 8, y, it[1] > 10000 ? '#c8352b' : '#222', { align: 'right', font: 'small' });
      });
      const ty = top + headH + this.items.length * lineH + 6;
      gfx.hline(px + 6, ty, pw - 12, '#222'); gfx.hline(px + 6, ty + 2, pw - 12, '#222');
      if (this.phase !== 'unroll') {
        const big = this.t2 < 0.3 ? 1.5 : 1;
        g.save(); g.translate(px + pw - 8, ty + 8); g.scale(big, big);
        gfx.text('TOTAL DUE:', -gfx.textWidth(CH.fmtMoney(this.total)) - 10, 0, '#222', { align: 'right' });
        gfx.text(CH.fmtMoney(this.total), 0, 0, '#c8352b', { align: 'right' });
        g.restore();
        gfx.text('PAYMENT DUE WITHIN 90 DAYS', px + pw - 8, ty + 24, '#c8352b', { align: 'right', font: 'small' });
        gfx.text('Payment plans available! :)', px + pw - 8, ty + 32, '#555', { align: 'right', font: 'small' });
        // stamp
        g.save(); g.translate(px + 46, ty + 32); g.rotate(-0.25);
        gfx.frame(-40, -8, 80, 16, '#c8352b'); gfx.text('ESTIMATE', 0, -4, '#c8352b', { align: 'center' });
        g.restore();
        if (this.t2 > 1.2 && Math.sin(this.t2 * 5) > 0) gfx.text('E  -  continue', W / 2, H - 14, '#fff', { align: 'center', font: 'small' });
      }
      gfx.unclip(); gfx.unclip();
      // chubby's paws holding the paper
      gfx.ellipse(px - 4, H - 30, 8, 6, '#8a5a3b'); gfx.ellipse(px + pw + 4, H - 30, 8, 6, '#8a5a3b');
      if (this.phase !== 'unroll') { g.save(); g.translate(W - 60, H - 40); g.scale(1.6, 1.6); CH.drawChubby(g, 0, 0, { face: 'dead', mouth: 'open', outfit: 'hoodie', noShadow: true, arm: 'pocket', sweat: 1 }); g.restore(); }
    }
  }
  CH.BillScene = BillScene;

  CH.SCENES.ambulance = () => new AmbulanceScene();
  CH.SCENES.hospital = () => new HospitalScene();
  CH.SCENES.momroom = () => new MomRoomScene({ mode: 'first' });
  CH.SCENES.bill = () => { const s = new CH.Scene(); s.enter = () => CH.game.push(new BillScene(() => {})); s.draw = (g) => gfx.rect(0, 0, W, H, '#333'); return s; };
})(window.CH);
