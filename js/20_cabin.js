// ============================================================================
// CABIN: Chubby & Mom's cozy Canadian cabin. Opening sequence + home base.
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, P = CH.PAL, S = CH.state, ui = CH.ui, fx = CH.fx, A = CH.audio;
  const W = CH.W, H = CH.H;

  // TV screen renderers
  const TVS = (CH.tvScreens = {
    off: (g, x, y, w, h) => { gfx.rect(x, y, w, h, '#151820'); },
    static: (g, x, y, w, h, t) => { const rng = new CH.Rng(Math.floor(t * 30)); for (let j = 0; j < h; j++) for (let i = 0; i < w; i += 2) gfx.rect(x + i, y + j, 2, 1, rng.chance(0.5) ? '#ddd' : '#333'); },
    attract: (g, x, y, w, h, t) => {
      gfx.vgrad(x, y, w, h, ['#4fa8ff', '#78c0ff', '#a8dcff']);
      gfx.rect(x, y + h - 6, w, 6, '#4f9d3a'); for (let i = 0; i < w; i += 4) gfx.rect(x + i + ((Math.floor(t * 20) + i) % 8 < 4 ? 0 : 2), y + h - 5, 2, 1, '#8bd06a');
      gfx.rect(x, y + h - 2, w, 2, '#8a5a2b');
      const hx = x + w / 2 + Math.sin(t * 2) * 6, hy = y + h - 9 + Math.abs(Math.sin(t * 6)) * -3;
      gfx.ellipse(hx, hy, 3, 3, '#3b6fd6'); gfx.ellipse(hx + 2, hy + 1, 1.5, 1.2, '#f2c9a0'); gfx.px(hx + 2, hy - 1, '#fff');
      for (let i = 0; i < 3; i++) gfx.px(x + 6 + ((i * 15 + Math.floor(t * 10)) % (w - 8)), y + 6 + i * 4, '#f5c33b');
      gfx.text('PRESS START', x + w / 2, y + 3, Math.sin(t * 4) > 0 ? '#fff' : '#a8dcff', { align: 'center', font: 'small' });
    },
    news: (g, x, y, w, h, t) => { gfx.rect(x, y, w, h, '#2a3a6a'); gfx.rect(x, y + h - 7, w, 7, '#c8352b'); gfx.rect(x + 2, y + h - 6, w - 4, 1, '#fff'); gfx.rect(x + 2, y + h - 4, ((t * 20) % (w * 2)) < w ? (t * 20) % w : w - ((t * 20) % w), 1, '#fff'); gfx.ellipse(x + 12, y + 10, 4, 4, '#8a5a3b'); gfx.rect(x + 8, y + 13, 8, 7, '#333'); gfx.rect(x + 22, y + 4, 22, 12, '#4a8ad0'); },
  });

  class CabinScene extends CH.WorldScene {
    constructor(opts = {}) {
      super({ width: 1180, floorY: 222, playerX: opts.playerX !== undefined ? opts.playerX : 60 });
      this.name = 'cabin';
      this.mode = opts.mode || 'intro'; // intro | emergency | home
      this.night = !!opts.night;
      this.tvMode = 'off';
      this.momPresent = opts.momPresent !== undefined ? opts.momPresent : true;
      this.build();
    }
    drawRoom(g) {
      CH.paintCabin(g, this.width, this.floorY, this.night);
      // doorway frames between rooms
      for (const dx of [262, 412, 708]) {
        gfx.rect(dx - 3, 34, 6, this.floorY - 34, P.wood0); gfx.rect(dx - 1, 34, 2, this.floorY - 34, P.wood3);
        gfx.rect(dx - 20, 34, 40, 6, P.wood0); gfx.rect(dx - 20, 40, 40, 1, P.wood3);
      }
      // ceiling lamp cords + bulbs
      for (const lx of [130, 560, 900]) { gfx.rect(lx, 34, 1, 14, '#222'); gfx.ellipse(lx, 52, 5, 3, '#8a6a3a'); gfx.rect(lx - 2, 52, 5, 2, this.night ? '#553' : '#f5e6b0'); }
      // wall outlet with cable snake
      gfx.rect(940, 210, 6, 6, '#e8e0d0'); gfx.px(942, 212, '#333'); gfx.px(944, 212, '#333');
      // dust motes / cobwebs in corners
      CH.PROPS.cobweb.draw(g, 2, 44); CH.PROPS.cobweb.draw(g, this.width - 12, 44);
    }
    build() {
      const F = this.floorY, s = this;
      const say = (t, o) => () => ui.say('Chubby', t, Object.assign({ face: 'normal' }, o));
      const think = (t) => () => ui.say('', t, { color: '#cfc8e8' });
      // ---------------- bedroom ----------------
      this.addProp('bed', 14, F, { hint: 'Bed', interact: () => this.interactBed() });
      this.addProp('nightstand', 124, F);
      this.alarm = this.addProp('alarmClock', 128, F - 16, { hint: 'Alarm clock', st: { ringing: false }, interact: () => this.interactAlarm(), range: 30, priority: 1 });
      this.addProp('poster', 24, 154, { st: { variant: 0 }, hint: 'Poster', interact: say('Blue Hedgehog 2. The greatest game ever made. I have it on three consoles.') });
      this.addProp('poster', 130, 150, { st: { variant: 1 }, hint: 'Poster', interact: say("Man Egg. The villain. Honestly kind of a fashion icon.") });
      this.addProp('gameCases', 150, F, { hint: 'Game pile', interact: say('Blue Hedgehog 1, 2, 3, Blue Hedgehog Kart, Blue Hedgehog Fishing... Blue Hedgehog Fishing was a mistake.') });
      this.addProp('beanbag', 196, F, { hint: 'Beanbag', interact: say('It has permanently taken my shape. We are one.') });
      this.addProp('laundry', 232, F, { hint: 'Laundry', interact: say("Clean or dirty? Both. It's a Schrodinger pile.") });
      this.addProp('cans', 120, F, { hint: 'Empty cans', interact: say('Blue Volt energy drinks. Zero sugar, infinite regret.') });
      this.addProp('pizzaBox', 68, F - 24, { hint: 'Pizza box', interact: say('One slice left. From... Tuesday? It is Saturday.') });
      this.addProp('calendar', 224, 130, { hint: 'Calendar', interact: say("Every day says 'GAME'. Mom wrote 'go outside?' on the 14th. With a question mark. She knows.") });
      this.addProp('crumbs', 30, F);
      // ---------------- hallway ----------------
      this.addProp('door', 282, F, { hint: 'Front door', st: { outside: (g, x, y, w, h, t) => CH.drawForestView(g, x, y, w, h, t, this.night) }, interact: () => this.interactFrontDoor() });
      this.addProp('boots', 318, F, { hint: 'Boots', interact: say("Winter boots. Haven't touched them since... a while.") });
      this.addProp('coatRack', 338, F, { hint: 'Coat rack', interact: say("Mom's red parka. My spare hoodie. Same hoodie, different smell.") });
      this.addProp('bathroomDoor', 360, F, { st: { sign: 'WC' }, hint: 'Bathroom', interact: () => this.interactBathroom() });
      this.phone = this.addProp('rotaryPhone', 392, 160, { hint: 'Rotary phone', interact: () => this.interactPhone(), range: 30, priority: 1 });
      this.addProp('wallClock', 300, 120, { hint: 'Clock', interact: () => ui.say('Chubby', `It's ${CH.timeStr()}. The clock ticks louder than it needs to.`) });
      this.addProp('flag', 340, 110, { hint: 'Flag', interact: say('Oh Canada. Our home and native land. Pancakes are also native land.') });
      this.addProp('thermostat', 300, 140, { hint: 'Thermostat', interact: say("21 degrees. Mom says 20 is 'plenty'. Mom is wrong.") });
      this.addProp('snowshoes', 396, F, { hint: 'Snowshoes', interact: say('Snowshoes. For people who go into the snow. Willingly.') });
      // ---------------- kitchen ----------------
      this.addProp('fridge', 420, F, { hint: 'Fridge', interact: () => this.interactFridge() });
      this.stove = this.addProp('stove', 456, F, { hint: 'Stove', st: { pan: true, steam: true }, interact: say('The pancake pan. Still warm. Still perfect.') });
      this.addProp('kitchenCounter', 492, F, { hint: 'Counter', interact: say('Dishes from last night. Mom did most of them. I did... one. A spoon.') });
      this.addProp('window', 522, 150, { hint: 'Window', st: { outside: (g, x, y, w, h, t) => CH.drawForestView(g, x, y, w, h, t, this.night) }, interact: say("Snow. Trees. A very smug squirrel. Nature is out there and I respect its decision to stay there.") });
      this.addProp('cereal', 578, F - 32, { hint: 'Cereal', interact: say("Choco Quills. The mascot is a porcupine. Representation matters.") });
      this.addProp('table', 606, F, { hint: 'Table' });
      this.pancakes = this.addProp('pancakes', 626, F - 26, { hint: 'Pancakes', st: { eaten: false }, interact: () => this.interactPancakes(), range: 40, priority: 2 });
      this.addProp('bills', 648, F - 26, { hint: 'Mail', interact: () => this.interactMail() });
      this.addProp('chair', 590, F, { st: { flip: true } });
      this.addProp('chair', 664, F);
      this.addProp('trashBin', 690, F, { hint: 'Bin', st: { full: true }, interact: say("It's full. I'll take it out. Eventually. Possibly.") });
      this.addProp('calendar', 470, 120, { hint: 'Calendar', interact: say("Mom's calendar: 'Dr. Beaverton - Tuesday' circled twice. Huh.") });
      this.addProp('radiator', 660, F, { hint: 'Radiator', interact: say('Clank. Clank. Hisss. The radiator speaks a language of its own.') });
      // ---------------- living room ----------------
      this.fire = this.addProp('fireplace', 720, F, { hint: 'Fireplace', st: { lit: true }, interact: say("Mom lit the fire before I even woke up. She always does.") });
      this.addProp('photoFrame', 724, F - 46, { st: { variant: 0 }, hint: 'Photo', interact: () => this.interactPhoto(0) });
      this.addProp('photoFrame', 742, F - 46, { st: { variant: 1 }, hint: 'Photo', interact: () => this.interactPhoto(1) });
      this.addProp('photoFrame', 760, F - 46, { st: { variant: 2 }, hint: 'Photo', interact: () => this.interactPhoto(2) });
      this.addProp('moosePainting', 730, 116, { hint: 'Painting', interact: say('A moose at sunset. Grandpa painted it. The moose looks disappointed in me.') });
      this.addProp('bookshelf', 790, F, { hint: 'Bookshelf', interact: say("'Knitting for Joy', 'Cabin Recipes', 'Job Hunting for Dummies'... that last one is mine. Unopened.") });
      this.addProp('hockeyStick', 828, F, { hint: 'Hockey stick', interact: say("Dad's old stick. I still can't skate.") });
      this.addProp('rug', 860, F, { layer: 'back' });
      this.couch = this.addProp('couch', 846, F, { hint: 'Couch', interact: () => this.interactCouch(), range: 40, priority: 1 });
      this.addProp('window', 858, 146, { hint: 'Window', st: { outside: (g, x, y, w, h, t) => CH.drawForestView(g, x, y, w, h, t, this.night) }, interact: say("The lake is frozen. Somewhere out there a beaver is having a better day than me.") });
      this.addProp('coffeeTable', 900, F + 6, { layer: 'front', hint: 'Coffee table', interact: say("Pizza, energy drinks, a remote with no batteries. My workstation."), promptY: F - 26 });
      this.addProp('controller', 920, F + 6, { layer: 'front' });
      this.tv = this.addProp('tv', 958, F, { hint: 'TV', st: { screen: (g, x, y, w, h, t) => this.drawTV(g, x, y, w, h, t) }, interact: () => this.interactTV(), range: 44 });
      this.console = this.addProp('console', 980, F - 14, { st: { on: false } });
      this.addProp('lamp', 1032, F, { hint: 'Lamp', interact: say('A lamp. It is the second brightest thing in this room after the TV.') });
      this.addProp('plant', 1052, F, { st: { variant: 0 }, hint: 'Plant', interact: say("Mom's fern. It is thriving. It has a better routine than I do.") });
      this.addProp('rockingChair', 1078, F, { hint: 'Rocking chair', st: { rocking: false }, interact: say("Mom's chair. There's a half-finished scarf in the basket. It's for me. It's always for me.") });
      this.addProp('plant', 1120, F, { st: { variant: 1 }, hint: 'Cactus', interact: say("A cactus. The only plant I have ever kept alive. It asks for nothing.") });
      this.addProp('momDoor', 1146, F, { hint: "Mom's room", interact: () => this.interactMomDoor() });
      this.addProp('logs', 700, F, { hint: 'Firewood', interact: say("Firewood. Mom chops it. Mom is 61.") });
      this.addProp('photoFrame', 1000, 150, { st: { variant: 0 }, hint: 'Photo', interact: () => this.interactPhoto(3) });
      this.addProp('flag', 1100, 110);
      // mom
      this.mom = CH.makeMom(480, F + 2);
      this.mom.hidden = !this.momPresent;
      this.addNPC(this.mom);
    }
    // ---- TV -----------------------------------------------------------------------
    drawTV(g, x, y, w, h, t) {
      const m = this.tvMode;
      if (m === 'off') TVS.off(g, x, y, w, h, t);
      else if (m === 'static') TVS.static(g, x, y, w, h, t);
      else if (m === 'attract') TVS.attract(g, x, y, w, h, t);
      else if (m === 'news') TVS.news(g, x, y, w, h, t);
      else if (m === 'game' && CH.hedgehogPreview) CH.hedgehogPreview(g, x, y, w, h, t);
      else TVS.off(g, x, y, w, h, t);
      if (m !== 'off') { g.globalAlpha = 0.15; for (let j = 0; j < h; j += 2) gfx.hline(x, y + j, w, '#000'); g.globalAlpha = 1; }
    }
    tvScreenRect() { return { x: this.tv.x + 5, y: this.tv.y - 51, w: 48, h: 27 }; }
    // ---- interactions --------------------------------------------------------------
    *interactBed() {
      if (this.mode === 'intro') { yield ui.say('Chubby', 'Tempting. But pancakes.'); return; }
      if (this.mode === 'home' && this.onSleep) { yield* this.onSleep(); return; }
      yield ui.say('Chubby', 'My bed. My throne. My best friend.');
    }
    *interactAlarm() {
      if (this.alarm.st.ringing) { yield* this.smashAlarm(); return; }
      yield ui.say('Chubby', 'The alarm. Set for 7:00 so I can start gaming at 7:05.');
    }
    *interactFrontDoor() {
      if (this.mode === 'intro') { yield ui.say('Chubby', "Outside? In this economy? It's minus eighteen."); return; }
      if (this.onLeave) { yield* this.onLeave(); return; }
      yield ui.say('Chubby', 'Not right now.');
    }
    *interactBathroom() {
      A.sfx('door'); yield 0.3;
      const lines = ['Brushed teeth. Avoided mirror. Success.', "The mirror and I have an agreement: we don't look at each other.", 'Flushed. The pipes made a sound like a moose. Normal.'];
      yield ui.say('Chubby', CH.pick(lines));
    }
    *interactPhone() {
      if (this.onPhone) { yield* this.onPhone(); return; }
      yield ui.say('Chubby', "The rotary phone. Mom refuses to get rid of it. 'It works, Chubby.' It does. Slowly.");
    }
    *interactFridge() {
      A.sfx('door'); yield 0.4;
      if (this.mode === 'home') { if (this.onFridge) { yield* this.onFridge(); return; } }
      yield ui.say('Chubby', 'Leftover pancakes, maple syrup, milk, a shopping list in Mom\'s handwriting: "eggs, flour, MORE syrup (Chubby)". Accurate.');
    }
    *interactMail() {
      yield ui.say('Chubby', "Hydro bill, a flyer for Donald's Burgers, and a letter from the clinic addressed to Mom. Marked 'URGENT'. She probably just needs new glasses.");
    }
    *interactPhoto(i) {
      const lines = [
        "Me as a baby. Already round. Mom's holding me like a prize pumpkin.",
        "The cabin the year they built it. Dad's truck is in the driveway.",
        "Dad. He played left wing for the Moosejaw Mallards for one season. Mom says he'd be proud of me. Of what, specifically, is unclear.",
        "Mom and me at the Winter Fair. I'm eating a beaver tail. The pastry, not the animal. This is important.",
      ];
      yield ui.say('Chubby', lines[i] || lines[0]);
    }
    *interactMomDoor() {
      if (this.mode === 'intro') { yield ui.say('Chubby', "Mom's room. Smells like lavender and cough drops. I don't go in there."); return; }
      if (this.onMomDoor) { yield* this.onMomDoor(); return; }
      yield ui.say('Chubby', "Mom's room.");
    }
    *interactPancakes() {
      if (this.pancakes.st.eaten) { yield ui.say('Chubby', 'Just a plate now. A sad, syrupy plate.'); return; }
      if (this.mode !== 'intro') { yield* this.eatPancakes(); return; }
      yield* this.breakfastScene();
    }
    *interactCouch() {
      if (this.mode === 'intro' && !CH.flag('atePancakes')) { yield ui.say('Chubby', "Couch... Blue Hedgehog... no. Pancakes first. Mom made them. Priorities."); return; }
      if (this.mode === 'intro') { yield* this.couchAndTV(); return; }
      if (this.onCouch) { yield* this.onCouch(); return; }
      yield ui.say('Chubby', 'The couch. My spine has forgotten what a chair is.');
    }
    *interactTV() {
      if (this.mode === 'intro') { yield* this.interactCouch(); return; }
      if (this.onTV) { yield* this.onTV(); return; }
      yield ui.say('Chubby', 'The TV. 32 inches of pure joy.');
    }
    // ---- helpers ---------------------------------------------------------------------
    *smashAlarm() {
      const pl = this.player;
      this.locked = true;
      pl.arm = 'up'; pl.face = 'angry';
      yield 0.2;
      A.sfx('thud'); CH.doShake(3, 0.2);
      this.alarm.st.ringing = false;
      // alarm flies off
      const a = this.alarm; let vx = 60, vy = -120, t = 0;
      this.particles.burst(a.x + 5, a.y - 4, 8, { color: ['#fff', '#c8352b', '#aaa'], speed: 60, life: 0.5 });
      while (t < 0.6) { const dt = 1 / 60; t += dt; vy += 500 * dt; a.x += vx * dt; a.y += vy * dt; if (a.y > this.floorY) { a.y = this.floorY; vy *= -0.3; vx *= 0.5; A.sfx('thud'); } yield dt; }
      a.y = this.floorY; a.interact = () => ui.say('Chubby', "It's fine. It's a very durable alarm. Unfortunately.");
      pl.arm = 'idle'; pl.face = 'tired';
      this.locked = false;
    }
    *eatPancakes() {
      const pl = this.player;
      this.locked = true;
      yield this.walkTo(650);
      pl.flip = true; pl.arm = 'belly';
      for (let i = 0; i < 5; i++) { pl.mouth = 'eat'; A.sfx('eat'); this.particles.burst(pl.x - 6, pl.y - 20, 4, { color: ['#e8b060', '#8a4a1a', '#f5c33b'], speed: 30, life: 0.5, grav: 250 }); pl.jiggle.kick(30 * (i % 2 ? 1 : -1)); yield 0.35; }
      pl.mouth = null; pl.arm = 'idle';
      this.pancakes.st.eaten = true; this.stove.st.steam = false;
      S.stats.pancakes++;
      S.hunger = Math.max(0, S.hunger - 60); S.energy = Math.min(100, S.energy + 10);
      A.sfx('yum'); pl.setFace('happy', 1.5); pl.doEmote('♥');
      yield 0.6;
      this.locked = false;
    }
    // ---- INTRO SEQUENCE -----------------------------------------------------------------
    *intro() {
      const pl = this.player;
      this.locked = true; this.hud = false;
      ui.objectiveShown = false;
      pl.hidden = true;
      fx.setFade(1);
      A.play('night', 2);
      S.hour = 7;
      // Chubby asleep sitting in bed
      const bedX = 50, bedY = this.floorY - 20;
      const sleeper = this.addCustom((g, x, y, t) => {
        CH.drawChubby(g, x, y, { sitting: true, sleep: this.sleeping, face: this.sleeping ? 'sleep' : 'tired', outfit: 'hoodie', noShadow: true, flip: false, arm: this.sleeping ? 'pocket' : 'belly', headDX: this.sleeping ? -2 : 0, headDY: this.sleeping ? 3 : 0, blink: false });
        // blanket over lap
        gfx.rect(x - 14, y - 12, 34, 10, '#5a7ac8'); gfx.hline(x - 14, y - 12, 34, '#7b9ae8'); for (let i = 0; i < 4; i++) gfx.hline(x - 10 + i * 8, y - 9 + (i % 2), 5, '#3b5390');
      }, bedX, bedY, 30, 30, { id: 'sleeper', layer: 'back' });
      this.sleeping = true;
      this.cam.x = 0;
      yield 0.8;
      yield fx.showCard('SATURDAY', '7:00 AM  -  Somewhere in northern Ontario', 2.8, '#e8e0c8');
      yield fx.fadeIn(1.5);
      yield 0.8;
      // snoring
      for (let i = 0; i < 2; i++) { A.sfx('snore'); yield 1.2; }
      // ALARM
      this.alarm.st.ringing = true;
      ui.setHint('Press E to stop the alarm', 6);
      let ringT = 0;
      while (this.alarm.st.ringing) {
        if (ringT % 0.7 < 0.02) A.sfx('alarm');
        ringT += 1 / 60;
        if (ringT > 0.4 && this.sleeping) { this.sleeping = false; }
        // sleepy chubby twitches
        if (ringT > 1.5 && (CH.input.hit('interact') || CH.input.hit('confirm') || CH.input.hit('jump') || CH.input.mpressed)) break;
        if (ringT > 12) break;
        yield 1 / 60;
      }
      // slap alarm
      A.sfx('thud'); CH.doShake(3, 0.25);
      this.alarm.st.ringing = false;
      const a = this.alarm; let vx = 90, vy = -140, t = 0;
      this.particles.burst(a.x + 5, a.y - 4, 10, { color: ['#fff', '#c8352b', '#aaa'], speed: 70, life: 0.6 });
      while (t < 0.9) { const dt = 1 / 60; t += dt; vy += 500 * dt; a.x += vx * dt; a.y += vy * dt; if (a.y > this.floorY) { a.y = this.floorY; vy *= -0.35; vx *= 0.5; A.sfx('thud'); } yield dt; }
      a.y = this.floorY; a.interact = () => ui.say('Chubby', "It's fine. It's a very durable alarm. Unfortunately.");
      yield 0.5;
      yield ui.say('Chubby', 'Mmnnnh. Five more... hours.', { face: 'tired' });
      A.sfx('yawn'); yield 0.6;
      // get out of bed: swap custom for player
      sleeper.hidden = true;
      pl.hidden = false; pl.x = bedX + 22; pl.y = this.floorY; pl.face = 'tired'; pl.flip = false;
      pl.land(1); this.particles.burst(pl.x, pl.y, 8, { color: ['#c9b48a', '#8b7355'], speed: 40, grav: 100, life: 0.5, angle: -Math.PI / 2, spread: 2 });
      yield 0.5;
      A.play('cabin', 2);
      // Mom calls from kitchen
      this.mom.x = 470; this.mom.flip = false; this.mom.arm = 'hold';
      yield 0.4;
      this.mom.say('Chubby! Pancakes!', 3);
      A.sfx('notify');
      yield ui.say('Mom', "Chubby! Pancakes are ready! They're getting cold!", { face: 'happy' });
      yield ui.say('Chubby', 'Pancakes. Okay. Pancakes are a reason to exist.', { face: 'tired' });
      ui.objectiveShown = true;
      ui.setObjective('Eat breakfast in the kitchen');
      ui.setHint('Arrow keys / WASD to move  -  E to interact  -  Space to hop', 6);
      this.hud = true;
      this.locked = false;
      // mom idles in kitchen
      this.mom.wanderRange = [440, 520];
      // ambient: mom comments once when player gets close
      let greeted = false;
      while (!CH.flag('atePancakes')) {
        if (!greeted && Math.abs(pl.x - this.mom.x) < 60) { greeted = true; this.mom.say('Sit, sit!', 2.5); this.mom.face = 'happy'; }
        yield 0.2;
      }
    }
    *breakfastScene() {
      const pl = this.player;
      this.locked = true;
      this.mom.wanderRange = null; this.mom.target = null;
      yield this.mom.walkTo(590);
      this.mom.flip = false; this.mom.arm = 'hold';
      yield this.walkTo(650);
      pl.flip = true;
      yield ui.say('Mom', 'There he is. My favourite son.', { face: 'happy' });
      yield ui.say('Chubby', "I'm your only son.");
      yield ui.say('Mom', "And still my favourite. Eat. I put extra syrup on. Don't tell your doctor.", { face: 'happy' });
      yield ui.say('Chubby', "I don't have a doctor.");
      yield ui.say('Mom', "...We'll talk about that. Eat.", { face: 'normal' });
      // eat
      pl.arm = 'belly';
      for (let i = 0; i < 6; i++) { pl.mouth = 'eat'; A.sfx('eat'); this.particles.burst(pl.x - 6, pl.y - 20, 4, { color: ['#e8b060', '#8a4a1a', '#f5c33b'], speed: 30, life: 0.5, grav: 250 }); pl.jiggle.kick(30 * (i % 2 ? 1 : -1)); this.player.squashX.x = 1.06; yield 0.35; }
      pl.mouth = null; pl.arm = 'idle';
      this.pancakes.st.eaten = true; this.stove.st.steam = false;
      S.stats.pancakes++; S.hunger = 0;
      A.sfx('yum'); pl.setFace('happy', 2); pl.doEmote('♥');
      yield 0.8;
      yield ui.say('Chubby', 'Mom. These are... these are the best ones yet.', { face: 'happy' });
      yield ui.say('Mom', "You say that every Saturday.", { face: 'happy' });
      yield ui.say('Chubby', "Every Saturday it's true.", { face: 'happy' });
      yield 0.4;
      this.mom.face = 'normal';
      yield ui.say('Mom', "Chubby... {p}I was thinking. It's such a nice day. Maybe you could go for a walk? Get some air? Maybe... {p}look at the job board at the general store?");
      const c = yield ui.choose('Chubby', 'Mom looks at you hopefully.', ["Maybe later, Mom.", "I have a very important game to finish.", "...Are you okay? You look tired."]);
      if (c === 0) { yield ui.say('Mom', "Later. {p}Okay. Later is fine.", { face: 'sad' }); }
      else if (c === 1) { yield ui.say('Mom', "Of course you do.", { face: 'sad' }); yield ui.say('Mom', "...Is it the one with the blue hedgehog?", { face: 'normal' }); yield ui.say('Chubby', "It's ALWAYS the one with the blue hedgehog.", { face: 'happy' }); }
      else { this.mom.face = 'happy'; yield ui.say('Mom', "Me? I'm fine, sweetheart. Just didn't sleep well. {p}Old bones. Go on, go play your game.", { face: 'happy' }); CH.flag('askedMom', true); }
      yield ui.say('Mom', "I'll do the dishes. Go on.", { face: 'happy' });
      CH.flag('atePancakes', true);
      ui.setObjective('Play Blue Hedgehog on the couch');
      this.locked = false;
      // mom to sink
      yield this.mom.walkTo(536);
      this.mom.flip = false; this.mom.arm = 'hold';
      this.run(this.momDishes());
    }
    *momDishes() {
      while (this.mode === 'intro') {
        // little dish-washing motions
        this.mom.squash.x = 1.02; yield 0.4; this.mom.squash.x = 0.98; yield 0.4;
        if (CH.chance(0.05)) this.particles.burst(this.mom.x + 8, this.mom.y - 30, 2, { color: ['#9fdcff', '#fff'], speed: 15, life: 0.4, grav: 200 });
        if (CH.chance(0.02)) this.mom.say(CH.pick(['~hmm hm hmm~', '*cough*', 'Where did I put...', '~la la la~']), 2);
      }
    }
    *couchAndTV() {
      const pl = this.player;
      this.locked = true;
      ui.setObjective('');
      yield this.walkTo(880);
      // FLOP onto couch
      pl.flip = false;
      A.sfx('whoosh');
      // little jump
      this.vy = -150; yield 0.25;
      this.vy = 0; this.py = 0;
      pl.sitting = true; pl.y = this.floorY - 9; pl.x = 880; pl.arm = 'controller'; pl.face = 'happy';
      pl.squashY.x = 0.6; pl.squashX.x = 1.4; pl.jiggle.kick(-80);
      A.sfx('couch'); CH.doShake(3, 0.3);
      this.particles.burst(pl.x, pl.y - 4, 14, { color: ['#c9b48a', '#8a5a3a', '#e8e0d0'], speed: 45, grav: 60, life: 0.6, angle: -Math.PI / 2, spread: 3 });
      this.couchSeat = true;
      yield 0.8;
      yield ui.say('Chubby', 'Ahhh. Okay. Okay okay okay. Blue Hedgehog time.', { face: 'happy' });
      // TV on
      A.sfx('tvOn'); this.tvMode = 'static'; this.console.st.on = true;
      yield 0.7; A.sfx('static');
      this.tvMode = 'attract';
      A.stop(0.5);
      yield 1.6;
      yield ui.say('Chubby', 'PRESS START. The two most beautiful words in the English language.', { face: 'focused' });
      // zoom into TV
      CH.flag('startedGame', true);
      if (CH.startHedgehog) CH.startHedgehog(this);
    }
    // player seated draw override: we keep player at couch pos
    update(dt) {
      super.update(dt);
      if (this.couchSeat) { this.player.x = 880; this.player.y = this.floorY - 9; this.player.sitting = true; }
    }
    draw(g) {
      super.draw(g);
      if (this.night) { g.globalAlpha = 0.35; gfx.rect(0, 0, W, H, '#101a40'); g.globalAlpha = 1; }
    }
    enter() {
      if (this.mode !== 'emergency') A.play(this.night ? 'night' : 'cabin');
      if (this.mode === 'intro' && !this.introStarted) { this.introStarted = true; this.run(this.intro()); }
    }
  }
  CH.CabinScene = CabinScene;
  CH.SCENES = CH.SCENES || {};
  CH.SCENES.cabin = () => new CabinScene({ mode: 'intro' });
  CH.SCENES.cabinFree = () => { const s = new CabinScene({ mode: 'home', playerX: 300 }); s.tvMode = 'off'; return s; };
})(window.CH);
