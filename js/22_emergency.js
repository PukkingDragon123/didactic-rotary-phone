// ============================================================================
// EMERGENCY: the crash, Mom collapsed, the rotary phone, 911, paramedics
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, fx = CH.fx, A = CH.audio, inp = CH.input, S = CH.state;
  const W = CH.W, H = CH.H;

  // ---- Rotary dial minigame (overlay) ---------------------------------------------------
  class RotaryDialScene extends CH.Scene {
    constructor(target, onDone) {
      super();
      this.overlay = true;
      this.target = target; // e.g. '911'
      this.dialed = '';
      this.angle = 0; // current dial rotation (rad)
      this.state = 'idle'; // idle | forward | back
      this.digit = null; this.t = 0;
      this.onDone = onDone;
      this.shake = 0; this.wrongT = 0;
      this.cx = W / 2; this.cy = H / 2 + 8; this.r = 58;
      this.hover = -1;
      this.msgT = 0; this.msg = '';
      this.clicks = 0;
    }
    // rotary layout: digits 1..9,0 clockwise starting at ~ -60deg (upper right) ; finger stop at ~ +50deg
    digitAngle(i) { return -Math.PI * 0.42 + i * (Math.PI * 1.32 / 9); } // i=0 -> '1', i=9 -> '0'
    digitChar(i) { return i === 9 ? '0' : String(i + 1); }
    update(dt) {
      this.t += dt;
      if (this.msgT > 0) this.msgT -= dt;
      if (this.wrongT > 0) this.wrongT -= dt;
      this.shake = Math.sin(this.t * 40) * 0.6; // nervous hand tremor
      const stopA = Math.PI * 0.62;
      if (this.state === 'idle') {
        // hover detection
        this.hover = -1;
        for (let i = 0; i < 10; i++) {
          const a = this.digitAngle(i);
          const hx = this.cx + Math.cos(a) * (this.r - 12), hy = this.cy + Math.sin(a) * (this.r - 12);
          if (CH.dist(inp.mx, inp.my, hx, hy) < 8) { this.hover = i; ui.cursor = 'hand'; }
        }
        let chosen = -1;
        if (inp.mpressed && this.hover >= 0) chosen = this.hover;
        for (let d = 0; d <= 9; d++) if (inp.hit('n' + d)) chosen = d === 0 ? 9 : d - 1;
        if (chosen >= 0) { this.digit = chosen; this.state = 'forward'; this.prog = 0; this.dialSpan = stopA - this.digitAngle(chosen); A.sfx('tap'); inp.eat(); }
      } else if (this.state === 'forward') {
        this.prog += dt * 2.2;
        this.angle = Math.min(1, this.prog) * this.dialSpan;
        if (this.prog >= 1) { this.state = 'back'; this.prog = 0; A.sfx('rotary'); this.clicks = 0; }
      } else if (this.state === 'back') {
        this.prog += dt * (1.1 + 0.15 * (9 - this.digit) * 0.1);
        const k = 1 - Math.min(1, this.prog);
        const prev = this.angle;
        this.angle = k * this.dialSpan;
        // clicking pulses
        const step = this.dialSpan / (this.digit + 1);
        if (Math.floor(prev / step) !== Math.floor(this.angle / step)) A.sfx('rotaryClick');
        if (this.prog >= 1) {
          this.angle = 0; this.state = 'idle';
          const ch = this.digitChar(this.digit);
          if (ch === this.target[this.dialed.length]) { this.dialed += ch; A.sfx('blip'); if (this.dialed === this.target) { this.state = 'done'; this.run(this.finish()); } }
          else { this.wrongT = 0.8; this.dialed = ''; this.msg = CH.pick(['No no no— wrong— again!', 'Come ON!', 'Stupid— stupid old phone!']); this.msgT = 1.5; A.sfx('error'); CH.doShake(2, 0.2); }
        }
      }
      if (inp.hit('cancel') && this.state !== 'done') { /* can't cancel: emergency */ ui.setHint("There's no time!", 1.5); }
    }
    *finish() { yield 0.5; A.sfx('dial'); yield 0.8; CH.game.pop(); if (this.onDone) this.onDone(); }
    draw(g) {
      // a heartbeat vignette: the room falls away, the dial is all there is
      const pulse = 0.84 + Math.sin(this.t * 4.4) * 0.04;
      g.globalAlpha = pulse; gfx.rect(0, 0, W, H, '#07040c'); g.globalAlpha = 1;
      const cx = this.cx + Math.round(this.shake), cy = this.cy;
      // phone body, bakelite: dark shell, lit top edge, shadow underneath
      gfx.rrect(cx - 92, cy - 102, 184, 194, 9, '#0d0b14');
      gfx.rrect(cx - 90, cy - 100, 180, 190, 8, '#22202c');
      gfx.rrect(cx - 88, cy - 98, 176, 184, 8, '#332f3e');
      gfx.rrect(cx - 84, cy - 94, 168, 7, 3, '#453f54');
      gfx.rrect(cx - 84, cy - 94, 168, 2, 1, '#57506a');
      g.globalAlpha = 0.18; gfx.rrect(cx - 80, cy - 90, 40, 150, 6, '#fff'); g.globalAlpha = 1;
      // handset off the hook (lifted) at top
      gfx.rrect(cx - 70, cy - 122, 140, 14, 6, '#1a1a22'); gfx.rrect(cx - 78, cy - 126, 26, 22, 6, '#1a1a22'); gfx.rrect(cx + 52, cy - 126, 26, 22, 6, '#1a1a22');
      // coiled cord
      for (let i = 0; i < 14; i++) gfx.px(cx + 82 + (i % 2) * 2, cy - 110 + i * 5, '#2a2a34');
      // dial plate
      gfx.circle(cx, cy, this.r + 8, '#111'); gfx.circle(cx, cy, this.r + 6, '#e8e0d0');
      // numbers (fixed plate under the dial)
      for (let i = 0; i < 10; i++) {
        const a = this.digitAngle(i);
        const nx = cx + Math.cos(a) * (this.r - 12), ny = cy + Math.sin(a) * (this.r - 12);
        gfx.text(this.digitChar(i), nx, ny - 3, this.hover === i && this.state === 'idle' ? '#c8352b' : '#222', { align: 'center' });
      }
      // rotating finger wheel with holes
      const rot = this.angle;
      gfx.circle(cx, cy, this.r + 2, 'rgba(58,58,72,0.0)');
      for (let i = 0; i < 10; i++) {
        const a = this.digitAngle(i) + rot;
        const hx = cx + Math.cos(a) * (this.r - 12), hy = cy + Math.sin(a) * (this.r - 12);
        gfx.circle(hx, hy, 8, '#3a3a48'); gfx.circle(hx, hy, 7, rot > 0.01 ? '#4a4a58' : 'rgba(74,74,88,0.55)');
        if (rot < 0.01) gfx.text(this.digitChar(i), hx, hy - 3, this.hover === i && this.state === 'idle' ? '#fff' : '#ddd', { align: 'center' });
      }
      // wheel rim ring
      gfx.ellipseOutline(cx, cy, this.r + 1, this.r + 1, '#5a5a68');
      // center label
      gfx.circle(cx, cy, 22, '#3a3a48'); gfx.circle(cx, cy, 20, '#f4f1ea');
      gfx.text('BELL', cx, cy - 8, '#333', { align: 'center', font: 'small' }); gfx.text('NORTHERN', cx, cy - 1, '#333', { align: 'center', font: 'small' }); gfx.text('TEL. CO.', cx, cy + 6, '#333', { align: 'center', font: 'small' });
      // finger stop
      const sa = Math.PI * 0.62;
      const sx = cx + Math.cos(sa) * (this.r + 4), sy = cy + Math.sin(sa) * (this.r + 4);
      gfx.rrect(sx - 4, sy - 3, 9, 14, 2, '#c8c8d0'); gfx.rrect(sx - 3, sy - 2, 7, 12, 2, '#eee');
      // instruction & dialed digits
      {
        const lbl = 'DIAL 9-1-1';
        const lw = gfx.textWidth(lbl) + 16;
        gfx.rrect(cx - lw / 2, cy - 146, lw, 15, 5, '#0d0b14');
        gfx.rrect(cx - lw / 2 + 1, cy - 145, lw - 2, 13, 4, this.wrongT > 0 ? '#c8352b' : '#2f2740');
        gfx.text(lbl, cx, cy - 142, this.wrongT > 0 ? '#fff' : '#f5d76b', { align: 'center' });
      }
      const shown = this.dialed.padEnd(3, '_').split('');
      shown.forEach((ch, i) => {
        const dx = cx - 30 + i * 30;
        const filled = ch !== '_';
        gfx.rrect(dx - 11, cy + 68, 22, 20, 3, '#0d0b14');
        gfx.rrect(dx - 10, cy + 69, 20, 18, 2, filled ? '#2a3d2a' : '#1a1a24');
        gfx.text(filled ? ch : '-', dx, cy + 74, filled ? '#8bf08b' : '#4a4a58', { align: 'center' });
      });
      if (this.msgT > 0) gfx.text(this.msg, cx, cy + 100, '#ff8080', { align: 'center', outline: '#000' });
      gfx.text('Click a number  -  or type it', W / 2, H - 12, '#aaa', { align: 'center', font: 'small' });
      // Chubby's paw, shaking too hard to be precise
      const px = inp.mx, py = inp.my;
      if (this.state === 'idle') {
        const tr = Math.sin(this.t * 22) * 0.8;
        gfx.ellipse(px + 6 + tr, py + 9, 4.4, 3.4, '#6b4227');
        gfx.ellipse(px + 5.6 + tr, py + 8.2, 3.4, 2.6, '#b87c50');
        gfx.ellipse(px + 4 + tr, py + 11, 2, 1.4, '#5a3721');
      }
    }
  }
  CH.RotaryDialScene = RotaryDialScene;

  // ---- emergency sequence in the cabin ------------------------------------------------------
  CH.beginEmergency = (cabin) => {
    cabin.mode = 'emergency';
    S.chapter = 'emergency'; CH.autosave('Chapter saved');
    cabin.run(emergencyCo(cabin));
  };

  function* emergencyCo(cabin) {
    const pl = cabin.player, mom = cabin.mom;
    cabin.locked = true; ui.objectiveShown = false;
    A.stop(0.2);
    // mom is now collapsed in the kitchen
    mom.hidden = false; mom.pose = 'lying'; mom.x = 575; mom.y = cabin.floorY + 3; mom.flip = false; mom.wanderRange = null; mom.target = null; mom.face = 'sleep'; mom.blink = true;
    cabin.cos = cabin.cos.filter((c) => c.gen !== undefined); // keep
    // broken dishes on floor & tipped chair
    cabin.addCustom((g, x, y) => {
      for (const [dx, dy, c] of [[0, -1, '#f4f1ea'], [6, -2, '#e8e0d0'], [12, -1, '#f4f1ea'], [-8, -1, '#3b6fd6'], [18, -1, '#e8e0d0'], [22, -2, '#f4f1ea'], [-14, -1, '#fff'], [30, -1, '#3b6fd6']]) { gfx.rect(x + dx, y + dy, 3, 2, c); gfx.px(x + dx + 1, y + dy - 1, c); }
      // spilled syrup / pancake batter
      gfx.ellipse(x + 26, y, 9, 2, '#8a4a1a'); gfx.ellipse(x - 4, y, 6, 1.5, '#e8e0d0');
    }, 540, cabin.floorY, 60, 6, { id: 'shards', layer: 'back', anim: false });
    cabin.addCustom((g, x, y) => { // fallen chair
      gfx.rect(x, y - 3, 26, 3, CH.PAL.wood1); gfx.rect(x + 2, y - 14, 3, 11, CH.PAL.wood0); gfx.rect(x + 22, y - 10, 3, 7, CH.PAL.wood0); gfx.rect(x - 8, y - 3, 8, 3, CH.PAL.wood0);
    }, 610, cabin.floorY, 30, 14, { id: 'fallenChair', layer: 'back', anim: false });
    cabin.bgDirty = true;
    // the sink tap now running
    cabin.prop('kitchenCounter').st.running = true;
    // Chubby on couch, shocked
    pl.face = 'shock'; pl.arm = 'controller'; pl.sitting = true;
    cabin.couchSeat = true;
    cabin.camFocus = 900;
    yield 0.8;
    pl.doEmote('!', 2); A.sfx('gasp');
    yield ui.say('Chubby', '...What was that?!', { face: 'shock' });
    yield 0.4;
    yield ui.say('Chubby', 'Mom?', { face: 'worried' });
    yield 1.0;
    yield ui.say('Chubby', '...Mom??', { face: 'worried' });
    yield 0.8;
    // get up
    cabin.couchSeat = false; pl.sitting = false; pl.y = cabin.floorY; pl.arm = 'idle'; pl.face = 'worried';
    cabin.tvMode = 'game'; // frozen game still on TV
    A.sfx('couch'); cabin.particles.burst(pl.x, pl.y, 8, { color: ['#c9b48a', '#8a5a3a'], speed: 40, grav: 80, life: 0.5, angle: -Math.PI / 2, spread: 3 });
    cabin.camFocus = null;
    ui.objectiveShown = true;
    ui.setObjective('Find out what that crash was');
    pl.speed = 95; pl.sweat = 0.5;
    cabin.locked = false;
    // wait for Chubby to reach the kitchen
    while (pl.x > 690) yield 0.05;
    cabin.locked = true; pl.vx = 0;
    pl.face = 'shock'; pl.doEmote('!', 1.5); A.sfx('gasp');
    CH.hitstop(0.15);
    yield 0.6;
    yield ui.say('Chubby', 'MOM!', { face: 'shock' });
    // run to her (fast)
    yield cabin.walkTo(600, 1.6);
    pl.flip = true; pl.sitting = true; pl.y = cabin.floorY - 4; pl.arm = 'cover'; pl.face = 'cry';
    yield 0.4;
    // shake her
    for (let i = 0; i < 3; i++) { mom.x += 1; yield 0.1; mom.x -= 1; yield 0.1; }
    yield ui.say('Chubby', 'Mom! Mom, wake up! MOM!', { face: 'cry' });
    yield 0.8;
    yield ui.say('Mom', '...{p}mm...{pp}chub...', { face: 'sleep', slow: true, portrait: 'Mom' });
    yield 0.5;
    yield ui.say('Chubby', "Okay. Okay okay okay. She's breathing. She's— {p}Phone. PHONE. Where's the— the phone. The phone is in the hall. Okay.", { face: 'worried' });
    pl.sitting = false; pl.y = cabin.floorY; pl.arm = 'idle';
    ui.setObjective('Rush to the rotary phone and call 911');
    ui.setHint('The rotary phone is in the hallway  ←', 4);
    pl.speed = 110; pl.sweat = 1; pl.face = 'worried';
    cabin.onPhone = function* () { yield* callSequence(cabin); };
    cabin.locked = false;
    // prevent re-triggering
    cabin.emergencyStarted = true;
  }

  function* callSequence(cabin) {
    const pl = cabin.player;
    cabin.locked = true; pl.vx = 0; pl.flip = false; pl.arm = 'phone';
    A.sfx('rotaryClick');
    const done = new CH.Signal();
    CH.game.push(new RotaryDialScene('911', () => done.resolve()));
    yield done;
    yield 0.3;
    A.sfx('phoneRing'); yield 1.2;
    yield ui.say('Dispatcher', '911, what is your emergency?', { voice: 'blip2' });
    const c1 = yield ui.choose('Chubby', 'Your heart is pounding.', ["MY MOM— she— there was a crash and she's on the floor and—", "My mom collapsed. She's breathing but she won't wake up.", "I— I don't know what to do."]);
    if (c1 === 0) { yield ui.say('Dispatcher', "Okay. I need you to take a breath for me. Is she breathing?", { voice: 'blip2' }); yield ui.say('Chubby', "Yes. Yes, she's breathing. She mumbled something.", { face: 'worried' }); }
    else if (c1 === 1) { yield ui.say('Dispatcher', "Good. You're doing great. How old is she?", { voice: 'blip2' }); yield ui.say('Chubby', "Sixty-one. She— she's been tired lately. I should have—", { face: 'sad' }); yield ui.say('Dispatcher', "You're helping her right now. That's what matters.", { voice: 'blip2' }); }
    else { yield ui.say('Dispatcher', "That's okay. I'm here. You're not alone. Is she breathing?", { voice: 'blip2' }); yield ui.say('Chubby', "...Yes.", { face: 'sad' }); }
    yield ui.say('Dispatcher', "What's your address?", { voice: 'blip2' });
    const c2 = yield ui.choose('Chubby', '', ["42 Tamarack Road. The cabin past the frozen lake.", "The... the cabin! With the red door! By the— the trees!", "I don't— we get mail at the general store—"]);
    if (c2 === 0) yield ui.say('Dispatcher', "42 Tamarack. Got it. Ambulance is on its way, about eight minutes.", { voice: 'blip2' });
    else if (c2 === 1) { yield ui.say('Dispatcher', "There are a lot of cabins with red doors, hon. Do you know the road?", { voice: 'blip2' }); yield ui.say('Chubby', "Tamarack! 42 Tamarack Road!", { face: 'worried' }); yield ui.say('Dispatcher', "Perfect. Ambulance is on its way.", { voice: 'blip2' }); }
    else { yield ui.say('Dispatcher', "Okay. I've got your location from the line. Tamarack Road. Ambulance is on its way.", { voice: 'blip2' }); }
    yield ui.say('Dispatcher', "Stay with her. Keep her warm. Talk to her. Can you do that?", { voice: 'blip2' });
    yield ui.say('Chubby', "Yes. {p}Yes. I can do that.", { face: 'worried' });
    pl.arm = 'idle';
    ui.setObjective('Stay with Mom until help arrives');
    // auto walk back to mom
    yield cabin.walkTo(600, 1.4);
    pl.flip = true; pl.sitting = true; pl.y = cabin.floorY - 4; pl.arm = 'cover'; pl.face = 'sad';
    // pull the blanket from the couch? -> he covers her with his hoodie? Keep simple: hold hand
    yield 0.8;
    yield ui.say('Chubby', "Help is coming, Mom. {pp}I'm right here. {pp}I'm right here.", { face: 'cry', slow: true });
    // sirens approach with flashing lights
    cabin.sirenLights = 0;
    for (let i = 0; i < 4; i++) { A.sfx('siren'); cabin.sirenLights = 0.3 + i * 0.2; yield 1.0; }
    // paramedics enter
    A.sfx('door');
    const p1 = new CH.NPC({ name: 'Paramedic', species: 'moose', outfit: 'paramedic', x: 270, y: cabin.floorY + 1, speed: 90, height: 1.15, hat: 'cap', hatColor: '#243a6a' });
    const p2 = new CH.NPC({ name: 'Paramedic', species: 'goose', outfit: 'paramedic', x: 250, y: cabin.floorY + 1, speed: 90, hat: 'cap', hatColor: '#243a6a' });
    cabin.addNPC(p1); cabin.addNPC(p2);
    const gurney = cabin.addCustom((g, x, y) => CH.PROPS.gurney.draw(g, x, y), 230, cabin.floorY + 2, 50, 26, { id: 'gurney', layer: 'back', anim: true });
    p1.say("Paramedics! Where is she?", 2.5);
    const a1 = p1.walkTo(545), a2 = p2.walkTo(520);
    // gurney follows p2
    const startT = cabin.t;
    while (!a1.done || !a2.done) { gurney.x = p2.x - 60; yield 1 / 60; }
    gurney.x = 470;
    pl.sitting = false; pl.y = cabin.floorY; pl.arm = 'idle';
    yield cabin.walkTo(640);
    pl.flip = true;
    p1.arm = 'hold'; p2.arm = 'clipboard';
    yield ui.say('Paramedic', "We've got her. Ma'am? Ma'am, can you hear me? {p}Pulse is weak. Let's move.", { voice: 'blip2' });
    yield 0.6;
    // load mom onto gurney
    mom_to_gurney: {
      const mom = cabin.mom;
      mom.hidden = true;
      gurney.def.draw = (g, x, y) => { CH.PROPS.gurney.draw(g, x, y); CH.drawCritter(g, x + 26, y - 20, { species: 'porcupine', outfit: 'dress', pose: 'lying', glasses: true, hair: 'bun', hairColor: '#d8d0c0', noShadow: true, topColor: '#b95c86', fur: '#9a6a48' }); gfx.rect(x + 8, y - 24, 30, 5, '#c85a5a'); };
    }
    yield 0.5;
    yield ui.say('Paramedic', "You her son? {p}You can ride with us. Grab your coat.", { voice: 'blip2' });
    yield ui.say('Chubby', "...", { face: 'sad' });
    // exit through the door
    p1.walkTo(290); p2.walkTo(310);
    const ex = cabin.walkTo(330, 1.0);
    while (!ex.done) { gurney.x = p2.x - 40; yield 1 / 60; }
    yield 0.4;
    A.sfx('door');
    // smash cut: doors bang shut, black, title card, waiting room. No ride.
    A.sfx('thud'); CH.doShake(4, 0.25);
    yield fx.fadeOut(0.35);
    S.chapter = 'hospital'; CH.autosave('Chapter saved');
    cabin.sirenLights = 0;
    if (CH.cutToHospital) yield* CH.cutToHospital();
    else CH.game.set(new CH.AmbulanceScene());
  }

  // ---- THE CRASH ------------------------------------------------------------------------
  // Overrides the plain sound-and-cut version from 21_hedgehog.js (same name, same
  // signature, same hand-off). The bang is played as a cartoon: freeze-frame, a
  // starburst slammed over the TV picture, the kitchen throwing its dishes at the
  // screen — and then nothing at all, which is the part that is not funny.
  const CRASH = { x: 352, y: 92 };  // up and to the right: the kitchen, past the edge of the TV

  function crashParticles(parts) {
    const china = ['#f4f1ea', '#e8e0d0', '#fff', '#3b6fd6'];
    const steel = ['#c8c8d0', '#9aa0ac', '#eef2f6'];
    // plates and cups, tumbling out of the kitchen toward the camera
    for (let i = 0; i < 26; i++) {
      const a = Math.PI * (0.55 + Math.random() * 0.75);      // left-and-down fan
      const sp = CH.rand(90, 230);
      parts.add({
        x: CRASH.x + CH.rand(-10, 10), y: CRASH.y + CH.rand(-8, 8),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - CH.rand(20, 90),
        life: CH.rand(1.4, 2.4), grav: 250, drag: 0.995, floorY: H - CH.rand(4, 26),
        shape: 'rect', w: CH.irand(3, 7), h: CH.irand(2, 4), color: CH.pick(china),
      });
    }
    // cutlery: thin bright slivers that spin further
    for (let i = 0; i < 12; i++) {
      const a = Math.PI * (0.5 + Math.random() * 0.9);
      const sp = CH.rand(140, 300);
      parts.add({
        x: CRASH.x, y: CRASH.y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - CH.rand(40, 140),
        life: CH.rand(1.2, 2.2), grav: 230, drag: 0.996, floorY: H - CH.rand(2, 20),
        shape: 'rect', w: CH.irand(4, 9), h: 1, color: CH.pick(steel),
      });
    }
    // dust and crumbs of the impact itself
    parts.burst(CRASH.x, CRASH.y, 30, { color: ['#fff', '#d8d0c0', '#8a5a3a'], speed: 190, life: 0.6, grav: 260, size: 1, fade: true });
  }

  CH.crashSequence = (game, cabin) => {
    game.frozen = true;
    const parts = new CH.Particles();
    const s = new CH.Scene();
    s.name = 'crash';
    s.bang = -1;    // seconds since the bang, -1 = not yet
    s.update = (dt) => { if (s.bang >= 0) s.bang += dt; parts.update(dt); };
    s.draw = (g) => {
      game.render(g);
      const e = s.bang;
      if (e < 0) return;
      // radiating impact lines, wide at first then gone
      if (e < 0.5) {
        const k = e / 0.5;
        g.save(); g.globalAlpha = (1 - k) * 0.9;
        CH.art.impactLines(CRASH.x, CRASH.y, 14, 34 + k * 130, 92 + k * 300, { thick: 5 - k * 3, rot: 0.2, color: '#150f1c' });
        g.restore();
      }
      // shock ring punching outward
      if (e < 0.45) CH.art.shockRing(CRASH.x, CRASH.y, 24 + e * 380, { alpha: (1 - e / 0.45) * 0.7 });
      if (e < 0.2) CH.art.speedLines(CRASH.x - 30, CRASH.y, 9, 180, { spread: 90, jitter: true, thick: 2, color: 'rgba(255,255,255,0.5)' });
      parts.draw(g);
      // the word itself: pops in on outBack, holds, then drops off the frame
      const LIFE = 1.15;
      if (e < LIFE) {
        const k = e / LIFE;
        const fall = k > 0.76 ? (k - 0.76) / 0.24 : 0;
        const jit = e < 0.22 ? (1 - e / 0.22) * 3 : 0;
        CH.art.comicBurst(
          CRASH.x - 66 + CH.rand(-jit, jit), CRASH.y + 34 + CH.rand(-jit, jit) + fall * fall * 150,
          'KRASH!',
          { t: Math.min(1, e / 0.36), r: 92, spikes: 17, rot: 0.12, scale: 2.6, fill: '#ffd84a', textColor: '#c8352b', outline: '#fff', alpha: 1 - fall * 0.9 }
        );
      }
    };
    s.run((function* () {
      A.stop(0.1);
      yield 0.35;                       // the last quiet second of the old life
      // BANG: everything at once, then the frame stops dead
      A.sfx('crash'); A.sfx('explode'); A.sfx('thud'); A.sfx('boss'); A.sfx('glass');
      s.bang = 0;
      crashParticles(parts);
      fx.doFlash(0.85, '#fff');
      CH.doShake(16, 0.9);
      CH.hitstop(0.22);                 // freeze-frame on the starburst
      yield 0.06;
      A.sfx('glass'); A.sfx('kick'); CH.doShake(8, 0.4);
      yield 0.14;
      A.sfx('glass'); A.sfx('snap');
      yield 0.22;
      A.sfx('thud'); CH.doShake(6, 0.35);   // something heavier than a plate lands
      parts.burst(CRASH.x - 12, CRASH.y + 20, 14, { color: ['#f4f1ea', '#e8e0d0', '#c8c8d0'], speed: 120, life: 1.2, grav: 240, size: 2 });
      yield 0.40;
      A.sfx('glass'); A.sfx('tick');        // one last bowl, spinning down on the tiles
      yield 0.55;
      A.sfx('tick');
      // ...and then nothing. Hold the silence; let it get uncomfortable.
      yield 1.25;
      CH.game.set(new CH.TVZoomScene(cabin, game, -1, () => { cabin.mode = 'emergency'; CH.game.set(cabin); if (CH.beginEmergency) CH.beginEmergency(cabin); }, 1.3));
    })());
    CH.game.set(s);
  };

  // siren light overlay on the cabin
  const origDraw = CH.CabinScene.prototype.draw;
  CH.CabinScene.prototype.draw = function (g) {
    origDraw.call(this, g);
    if (this.sirenLights > 0) {
      const ph = Math.sin(this.t * 10);
      g.globalAlpha = this.sirenLights * 0.25;
      gfx.rect(0, 0, W, H, ph > 0 ? '#ff3030' : '#3060ff');
      g.globalAlpha = 1;
    }
  };
})(window.CH);
