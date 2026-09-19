// ============================================================================
// TRAVEL: the walk from the cabin through the forest into Moose Hollow
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, fx = CH.fx, A = CH.audio, inp = CH.input, S = CH.state, P = CH.PAL;
  const W = CH.W, H = CH.H;

  // ---- town props -------------------------------------------------------------------------
  const def = (n, w, h, d) => { CH.PROPS[n] = { name: n, w, h, draw: d }; };
  def('pine', 30, 70, (g, x, y, t, st) => { const h = (st && st.h) || 60, c = (st && st.c) || '#2f6a24'; gfx.rect(x + 13, y - 8, 4, 8, '#4a2e18'); for (let k = 0; k < 4; k++) gfx.tri(x + k * 3, y - 6 - k * 14, x + 30 - k * 3, y - 6 - k * 14, x + 15, y - h + k * 4, k % 2 ? c : gfx.shade(c, -14)); for (let k = 0; k < 4; k++) gfx.rect(x + 8 + k * 2, y - 8 - k * 14, 14 - k * 4, 2, '#eef4f8'); });
  def('birch', 16, 60, (g, x, y) => { gfx.rect(x + 6, y - 56, 4, 56, '#e8e8e8'); for (let i = 0; i < 6; i++) gfx.rect(x + 6 + (i % 2), y - 50 + i * 8, 2, 1, '#333'); gfx.ellipse(x + 8, y - 58, 9, 6, '#d8b060'); gfx.ellipse(x + 4, y - 62, 5, 4, '#e8c070'); });
  def('snowbank', 40, 10, (g, x, y) => { gfx.ellipse(x + 20, y - 2, 20, 6, '#eef4f8'); gfx.ellipse(x + 16, y - 4, 10, 4, '#fff'); });
  def('snowman', 16, 30, (g, x, y) => { gfx.circle(x + 8, y - 6, 7, '#fff'); gfx.circle(x + 8, y - 16, 5.5, '#fff'); gfx.circle(x + 8, y - 24, 4.5, '#fff'); gfx.px(x + 6, y - 25, '#000'); gfx.px(x + 10, y - 25, '#000'); gfx.rect(x + 8, y - 24, 3, 1, '#e8752c'); gfx.line(x + 2, y - 16, x - 4, y - 22, '#5a3721'); gfx.line(x + 14, y - 16, x + 20, y - 20, '#5a3721'); gfx.rect(x + 3, y - 30, 10, 3, '#222'); gfx.rect(x + 5, y - 33, 6, 3, '#222'); gfx.rect(x + 3, y - 20, 10, 2, '#c8352b'); });
  def('mailbox', 10, 26, (g, x, y) => { gfx.rect(x + 4, y - 18, 2, 18, '#5a3721'); gfx.rrect(x, y - 26, 12, 9, 3, '#3b6fd6'); gfx.rect(x + 10, y - 24, 3, 1, '#c8352b'); gfx.rect(x + 10, y - 27, 1, 4, '#c8352b'); });
  def('busStop', 30, 50, (g, x, y, t, st) => { gfx.rect(x + 2, y - 48, 2, 48, '#555'); gfx.rect(x, y - 50, 22, 12, '#3b6fd6'); gfx.text('BUS 12', x + 11, y - 47, '#fff', { align: 'center', font: 'small' }); gfx.text('40 MIN', x + 11, y - 41, '#fff', { align: 'center', font: 'small' }); gfx.rect(x + 6, y - 14, 24, 3, '#5a3721'); gfx.rect(x + 7, y - 11, 2, 11, '#5a3721'); gfx.rect(x + 27, y - 11, 2, 11, '#5a3721'); gfx.rect(x + 6, y - 22, 24, 2, '#5a3721'); gfx.rect(x + 8, y - 20, 2, 6, '#5a3721'); gfx.rect(x + 26, y - 20, 2, 6, '#5a3721'); });
  def('storefront', 120, 90, (g, x, y, t, st) => {
    const c = (st && st.color) || '#a86f3a', name = (st && st.name) || 'STORE';
    gfx.rect(x, y - 80, 120, 80, c); CH.drawPlanks(g, x, y - 80, 120, 80, 8, c, gfx.shade(c, -30), gfx.shade(c, 20), x, false);
    gfx.rect(x - 4, y - 90, 128, 12, gfx.shade(c, -40)); gfx.rect(x - 4, y - 92, 128, 3, '#eef4f8'); // roof w/ snow
    gfx.rect(x + 8, y - 72, 44, 30, '#1a2a3a'); gfx.rect(x + 68, y - 72, 44, 30, '#1a2a3a'); // windows
    for (const wx of [x + 8, x + 68]) { gfx.frame(wx, y - 72, 44, 30, '#f4f1ea'); gfx.rect(wx + 21, y - 72, 2, 30, '#f4f1ea'); g.globalAlpha = 0.3; gfx.rect(wx + 2, y - 70, 8, 26, '#fff'); g.globalAlpha = 1; }
    if (st && st.windowDraw) st.windowDraw(g, x, y, t);
    gfx.rect(x + 48, y - 40, 24, 40, '#5a3721'); gfx.rect(x + 50, y - 38, 20, 36, '#8a5a2b'); gfx.rect(x + 52, y - 34, 16, 14, '#1a2a3a'); gfx.px(x + 66, y - 20, '#f5c33b'); // door
    gfx.rect(x + 6, y - 88, 108, 10, '#1a1a24'); gfx.text(name, x + 60, y - 86, (st && st.textColor) || '#f5c33b', { align: 'center', font: 'small' });
    if (st && st.sign) { gfx.rect(x + 76, y - 36, 30, 12, '#fff'); gfx.text(st.sign, x + 91, y - 33, '#c8352b', { align: 'center', font: 'small' }); }
    gfx.rect(x - 2, y - 2, 124, 2, '#c8ccd4');
  });
  def('donaldsExterior', 200, 130, (g, x, y, t) => {
    // building
    gfx.rect(x, y - 90, 200, 90, '#f4ead8'); gfx.rect(x, y - 90, 200, 6, '#c8352b'); gfx.rect(x, y - 60, 200, 4, '#c8352b');
    for (let i = 0; i < 200; i += 10) gfx.rect(x + i, y - 84, 1, 24, '#e8dcc8');
    // roof w/ snow & sign pole
    gfx.rect(x - 6, y - 96, 212, 6, '#8f2419'); gfx.rect(x - 6, y - 99, 212, 3, '#eef4f8');
    // BIG D sign
    const sy = y - 132 + Math.round(Math.sin(t * 1.5) * 0.5);
    gfx.rect(x + 96, y - 96, 8, 26, '#5a5a66');
    gfx.rrect(x + 60, sy, 80, 36, 6, '#c8352b'); gfx.rrect(x + 63, sy + 3, 74, 30, 5, '#f5c33b');
    g.save(); g.translate(x + 82, sy + 6); g.scale(3, 3); gfx.text('D', 0, 0, '#c8352b', { outline: '#8f2419' }); g.restore();
    gfx.text("DONALD'S", x + 118, sy + 8, '#8f2419', { align: 'center', font: 'small' }); gfx.text('BURGERS', x + 118, sy + 16, '#8f2419', { align: 'center', font: 'small' });
    gfx.text('IT\'S A D', x + 118, sy + 26, '#5a3a1a', { align: 'center', font: 'small' });
    // marquee lights
    for (let i = 0; i < 20; i++) gfx.px(x + 62 + i * 4, sy + 34, (Math.floor(t * 6) + i) % 4 === 0 ? '#fff' : '#f0a030');
    // windows with warm glow and customers silhouettes
    for (const wx of [x + 12, x + 60, x + 140]) { gfx.rect(wx, y - 56, 40, 34, '#f5e6b0'); gfx.frame(wx, y - 56, 40, 34, '#8f2419'); gfx.rect(wx + 19, y - 56, 2, 34, '#8f2419'); gfx.ellipse(wx + 10, y - 34, 4, 6, '#c8a060'); gfx.ellipse(wx + 30, y - 32, 5, 7, '#a08060'); gfx.rect(wx + 4, y - 30, 32, 2, '#c8a060'); }
    // door
    gfx.rect(x + 104, y - 56, 30, 56, '#3a4a5a'); gfx.rect(x + 106, y - 54, 26, 52, '#9fdcff'); gfx.rect(x + 118, y - 54, 2, 52, '#3a4a5a'); gfx.rect(x + 110, y - 30, 6, 2, '#333'); gfx.rect(x + 122, y - 30, 6, 2, '#333');
    gfx.rect(x + 106, y - 50, 26, 8, '#c8352b'); gfx.text('OPEN', x + 119, y - 49, '#fff', { align: 'center', font: 'small' });
    // NOW HIRING banner
    gfx.rect(x + 8, y - 26, 44, 12, '#f5c33b'); gfx.text('NOW HIRING', x + 30, y - 23, '#c8352b', { align: 'center', font: 'small' });
    // drive-thru sign
    gfx.rect(x + 190, y - 40, 3, 40, '#5a5a66'); gfx.rect(x + 176, y - 52, 30, 14, '#c8352b'); gfx.text('DRIVE', x + 191, y - 50, '#fff', { align: 'center', font: 'small' }); gfx.text('THRU →', x + 191, y - 44, '#fff', { align: 'center', font: 'small' });
    // trash can & bench
    gfx.rect(x + 150, y - 12, 8, 12, '#5a5a66'); gfx.rect(x + 160, y - 10, 24, 3, '#5a3721'); gfx.rect(x + 162, y - 7, 2, 7, '#5a3721'); gfx.rect(x + 180, y - 7, 2, 7, '#5a3721');
    // steam from vent
    for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i * 0.33) % 1; gfx.px(x + 30 + i * 4 + Math.round(Math.sin(t + i) * 2), y - 100 - k * 14, `rgba(255,255,255,${0.7 - k * 0.7})`); }
  });
  def('car', 50, 20, (g, x, y, t, st) => { const c = (st && st.color) || '#3b6fd6'; gfx.rrect(x, y - 14, 50, 10, 3, c); gfx.rrect(x + 10, y - 20, 26, 8, 3, c); gfx.rect(x + 13, y - 18, 9, 5, '#9fdcff'); gfx.rect(x + 24, y - 18, 9, 5, '#9fdcff'); gfx.circle(x + 10, y - 3, 4, '#222'); gfx.circle(x + 40, y - 3, 4, '#222'); gfx.rect(x + 2, y - 22, 46, 2, '#eef4f8'); gfx.px(x + 48, y - 10, '#f5c33b'); });
  def('lamppost', 8, 60, (g, x, y, t) => { gfx.rect(x + 3, y - 56, 2, 56, '#3a3a48'); gfx.rect(x, y - 60, 8, 5, '#3a3a48'); gfx.rect(x + 1, y - 59, 6, 3, '#f5e6b0'); gfx.rect(x - 1, y - 62, 10, 2, '#eef4f8'); gfx.rect(x + 1, y - 2, 6, 2, '#3a3a48'); });
  def('hydrant', 8, 14, (g, x, y) => { gfx.rect(x + 2, y - 12, 5, 12, '#c8352b'); gfx.rect(x, y - 8, 9, 2, '#c8352b'); gfx.rect(x + 3, y - 14, 3, 2, '#c8352b'); gfx.rect(x + 2, y - 14, 5, 1, '#eef4f8'); });
  def('mooseSign', 16, 40, (g, x, y) => { gfx.rect(x + 7, y - 30, 2, 30, '#555'); gfx.rect(x, y - 44, 16, 16, '#f5c33b'); gfx.frame(x, y - 44, 16, 16, '#222'); gfx.rect(x + 4, y - 36, 8, 5, '#222'); gfx.rect(x + 10, y - 39, 3, 4, '#222'); gfx.rect(x + 5, y - 31, 1, 3, '#222'); gfx.rect(x + 10, y - 31, 1, 3, '#222'); gfx.line(x + 11, y - 40, x + 9, y - 43, '#222'); gfx.line(x + 12, y - 40, x + 14, y - 43, '#222'); });
  def('sled', 20, 8, (g, x, y) => { gfx.rect(x, y - 4, 20, 3, '#c8352b'); gfx.rect(x + 2, y - 1, 16, 1, '#8a5a2b'); gfx.rect(x + 18, y - 6, 2, 3, '#c8352b'); });

  class TravelScene extends CH.WorldScene {
    constructor(opts = {}) {
      super({ width: 2700, floorY: 214, playerX: opts.playerX || 40 });
      this.name = 'travel'; this.dest = opts.dest || 'donalds'; this.direction = opts.direction || 1;
      this.timeScale = 1 / 30; // 1 game hour per 30 s
      this.build();
      this.player.outfit = S.outfit; this.player.stepSfx = 'step'; this.player.speed = 82;
      this.mooseCrossed = false; this.tripped = false; this.snow = []; for (let i = 0; i < 70; i++) this.snow.push([Math.random() * W, Math.random() * H, 0.4 + Math.random()]);
    }
    drawRoom(g) {
      const w = this.width, F = this.floorY;
      // (sky & parallax are painted per-frame in draw(); the cached layer only holds the ground)
      // ground: snow + road
      gfx.rect(0, F, w, H - F, '#e6eef4'); gfx.rect(0, F + 14, w, 20, '#3a3a44'); gfx.rect(0, F + 14, w, 1, '#55555f'); for (let x = 0; x < w; x += 40) gfx.rect(x, F + 23, 20, 2, '#f5c33b');
      for (let x = 0; x < w; x += 9) gfx.px(x, F + 2 + (x % 3), '#fff');
      // town starts at ~1500: sidewalk
      gfx.rect(1500, F, w - 1500, 14, '#b8bcc4'); for (let x = 1500; x < w; x += 16) gfx.vline(x, F, 14, '#9a9ea8');
      // background painted per-frame in drawBackground (parallax) - here just distant static
    }
    build() {
      const F = this.floorY, say = (t, o) => () => ui.say('Chubby', t, Object.assign({ face: 'normal' }, o));
      // cabin exterior at start
      this.addCustom((g, x, y) => { gfx.rect(x, y - 60, 90, 60, P.wood1); CH.drawPlanks(g, x, y - 60, 90, 60, 8, P.wood1, P.wood0, P.wood3, 3); gfx.tri(x - 8, y - 60, x + 98, y - 60, x + 45, y - 96, '#5a3721'); gfx.tri(x - 8, y - 62, x + 98, y - 62, x + 45, y - 98, '#eef4f8'); gfx.rect(x + 60, y - 100, 8, 26, '#5a5a66'); for (let i = 0; i < 3; i++) gfx.px(x + 63 + (i % 2) * 2, y - 104 - i * 5, 'rgba(255,255,255,0.6)'); gfx.rect(x + 34, y - 44, 22, 44, '#c8352b'); gfx.rect(x + 10, y - 50, 18, 16, '#f5e6b0'); gfx.rect(x + 62, y - 50, 18, 16, '#f5e6b0'); gfx.rect(x + 18, y - 50, 2, 16, P.wood0); gfx.rect(x + 70, y - 50, 2, 16, P.wood0); }, 0, F, 90, 100, { id: 'cabinExt', anim: false, hint: 'Home', interact: say("Home. {p}I'll be back. With a job. Hopefully.") });
      this.addProp('boots', 60, F);
      // forest
      for (let x = 110; x < 1400; x += 55) { this.addProp('pine', x + (x % 3) * 7, F + 2 - (x % 5), { st: { h: 50 + (x % 4) * 10, c: ['#2f6a24', '#3a7a2c', '#25551c'][x % 3] } }); if (x % 4 === 0) this.addProp('birch', x + 30, F); }
      for (let x = 130; x < 1450; x += 130) this.addProp('snowbank', x, F + 2);
      this.addProp('mailbox', 100, F, { hint: 'Mailbox', interact: say("Our mailbox. Full of flyers. One says 'You may already be a winner!' {p}I may already be a loser, flyer.") });
      this.addProp('snowman', 300, F, { hint: 'Snowman', interact: say("A snowman. Somebody gave him a Donald's hat. {p}Everybody's hiring except the snowman.") });
      this.addProp('mooseSign', 560, F, { hint: 'Sign', interact: say("'MOOSE CROSSING'. {p}They mean it.") });
      this.addCustom((g, x, y, t) => { // frozen lake with ice fisher
        gfx.ellipse(x + 90, y + 6, 100, 10, '#bfe0f0'); gfx.ellipse(x + 90, y + 5, 90, 7, '#d8f0fa'); gfx.rect(x + 80, y - 2, 6, 3, '#222'); CH.drawCritter(g, x + 100, y - 2, { species: 'beaver', outfit: 'winter', pose: 'sit', noShadow: true, arm: 'hold' }); gfx.line(x + 108, y - 12, x + 122, y - 2, '#333'); gfx.rect(x + 122, y - 3, 3, 3, '#1a2a3a'); if (Math.sin(t * 0.7) > 0.9) gfx.text('...', x + 100, y - 40, '#333', { font: 'small' });
      }, 700, F + 4, 200, 20, { id: 'lake', anim: true, hint: 'Frozen lake', interact: say("Old Bartleby, ice fishing. He's been out there since 1994. {p}He waves. I wave. That's our whole relationship."), range: 60 });
      this.addCustom((g, x, y) => { gfx.rect(x, y - 3, 14, 3, '#2a2a34'); gfx.rect(x + 2, y - 4, 10, 1, '#111'); }, 1000, F + 16, 14, 4, { id: 'pothole', anim: false });
      this.addProp('busStop', 1300, F, { hint: 'Bus stop', interact: () => this.interactBus() });
      // town
      this.addProp('lamppost', 1520, F); this.addProp('lamppost', 1760, F); this.addProp('lamppost', 2000, F); this.addProp('lamppost', 2240, F);
      this.addProp('storefront', 1560, F, { st: { color: '#8a5a2b', name: 'GENERAL STORE', sign: 'JOB BOARD' }, hint: 'General store', interact: () => this.interactStore() });
      this.addProp('storefront', 1720, F, { st: { color: '#a03a2a', name: 'TAM HORTONS', textColor: '#fff', sign: 'TIMBITS' }, hint: 'Tam Hortons', interact: say("Tam Hortons. The smell of coffee and doughnuts. {p}I have $" + Math.floor(S.money) + ". {p}Focus, Chubby.") });
      this.addProp('storefront', 1880, F, { st: { color: '#4a5a8a', name: 'MOOSE HOLLOW ARENA', textColor: '#fff', sign: 'GO MALLARDS' }, hint: 'Arena', interact: say("The arena. Dad played here. {p}Rick still hasn't fixed the Zamboni.") });
      this.addProp('hydrant', 1700, F); this.addProp('hydrant', 2060, F);
      this.addProp('car', 1640, F + 22, { st: { color: '#3b6fd6' } }); this.addProp('car', 1960, F + 22, { st: { color: '#c8a060' } });
      this.addCustom((g, x, y) => { gfx.rect(x, y - 30, 30, 30, '#5a5a66'); gfx.rect(x + 2, y - 28, 26, 22, '#3a3a44'); gfx.text('BUS', x + 15, y - 24, '#f5c33b', { align: 'center', font: 'small' }); gfx.text('STOP', x + 15, y - 17, '#f5c33b', { align: 'center', font: 'small' }); }, 2100, F, 30, 30, { id: 'townBus', anim: false });
      this.donalds = this.addProp('donaldsExterior', 2380, F, { hint: "Donald's Burgers", interact: () => this.interactDonalds(), range: 60, offsetX: 20 });
      this.addProp('pine', 2620, F, { st: { h: 60 } });
      // kids sledding on a hill (animated)
      this.addCustom((g, x, y, t) => { gfx.ellipse(x + 60, y + 4, 70, 26, '#eef4f8'); const k = (t * 0.25) % 1; const sx = x + 10 + k * 100, sy = y - 20 + k * 22; CH.PROPS.sled.draw(g, sx, sy); CH.drawCritter(g, sx + 10, sy - 3, { species: 'rabbit', outfit: 'winter', pose: 'sit', noShadow: true, height: 0.7, width: 0.8, face: 'happy' }); if (k > 0.9) gfx.text('WHEEE', sx + 10, sy - 30, '#333', { font: 'small', align: 'center' }); }, 1120, F - 8, 140, 40, { id: 'hill', anim: true });
      // moose
      this.moose = new CH.NPC({ name: 'Moose', species: 'moose', outfit: 'casual', x: 620, y: F + 12, speed: 20, height: 1.6, width: 1.5, outfitOverride: { top: '#5b3d24', topD: '#3a2414', bottom: '#5b3d24' } });
      this.moose.hidden = true; this.addNPC(this.moose);
      // townsfolk
      const tf = CH.makeCustomer(1800, F + 1); tf.wanderRange = [1600, 2000]; this.addNPC(tf);
      const tf2 = CH.makeCustomer(2200, F + 1); tf2.wanderRange = [2150, 2350]; this.addNPC(tf2);
    }
    enter() {
      A.play('town', 2); fx.setFade(1);
      this.run(this.intro());
    }
    *intro() {
      this.locked = true;
      yield fx.fadeIn(1.2);
      if (this.dest === 'donalds' && !CH.flag('walkedOnce')) {
        yield ui.say('Chubby', "Okay. Outside. {p}It's minus eighteen. My suit has the insulating properties of a paper towel. {pp}Main Street is that way. Two and a half kilometres. {p}I have walked further in games.", { face: 'worried' });
        ui.setObjective("Walk into town to Donald's Burgers  →");
        CH.flag('walkedOnce', true);
      } else ui.setObjective(this.dest === 'donalds' ? "Head to Donald's Burgers  →" : this.dest === 'home' ? 'Walk home  ←' : 'Head to the hospital  →');
      this.locked = false;
    }
    *interactBus() {
      const c = yield ui.choose('Chubby', 'The bus schedule says "every 40 minutes*". The asterisk says "*or never". Fare: $3.50.', ['Wait for the bus ($3.50)', 'Keep walking']);
      if (c !== 0) return;
      if (S.money < 3.5) { yield ui.say('Chubby', "I can't afford the bus. {p}I can't afford the BUS.", { face: 'sad' }); return; }
      this.locked = true;
      yield this.walkTo(1320); this.player.flip = false;
      yield ui.say('Chubby', 'Waiting.', { auto: 1.5 }); S.hour += 0.3; yield ui.say('Chubby', 'Waiting...', { auto: 1.5 }); S.hour += 0.3;
      A.sfx('bus'); yield 1.5;
      CH.addMoney(-3.5);
      yield fx.fadeOut(0.8);
      this.player.x = 2100; this.cam.x = 1860; S.hour += 0.2;
      yield fx.fadeIn(0.8);
      yield ui.say('Chubby', "The bus driver asked if I was 'the burger guy'. {p}I said 'not yet'. {p}He nodded like that meant something.", { face: 'normal' });
      this.locked = false;
    }
    *interactStore() {
      yield ui.say('Chubby', "The job board. {p}'Snow removal - must have truck.' 'Babysitter - must like children.' 'Lumberjack - must be Gus.' {pp}One card says 'DONALD'S - JUST COME IN'. Someone has drawn a heart on it. It was Brenda.", { face: 'normal' });
    }
    *interactDonalds() {
      if (this.dest !== 'donalds') { yield ui.say('Chubby', "Donald's. {p}Not now."); return; }
      this.locked = true;
      yield this.walkTo(this.donalds.x + 119);
      this.player.flip = false;
      const late = S.hour > 10.05;
      if (!S.job) {
        yield ui.say('Chubby', late ? `It's ${CH.timeStr()}. {p}I'm late. {p}I'm late to the first interview of my life. Great. GREAT.` : `It's ${CH.timeStr()}. {p}Here we go. {pp}Deep breath. {p}Suit on. Buttons... mostly on. {p}Pulse: present.`, { face: late ? 'shock' : 'worried' });
        S.interviewLate = late;
        A.sfx('door'); yield fx.fadeOut(1);
        CH.game.set(new CH.InterviewScene());
      } else { A.sfx('door'); yield fx.fadeOut(0.8); if (CH.startShift) CH.startShift(); }
    }
    update(dt) {
      super.update(dt);
      const pl = this.player;
      for (const s of this.snow) { s[1] += dt * 30 * s[2]; s[0] += dt * 12; if (s[1] > H) { s[1] = -2; s[0] = Math.random() * W; } if (s[0] > W) s[0] -= W; }
      // moose crossing event
      if (!this.mooseCrossed && pl.x > 500 && pl.x < 560 && !this.locked) { this.mooseCrossed = true; this.run(this.mooseEvent()); }
      // pothole trip
      if (!this.tripped && Math.abs(pl.x - 1007) < 6 && this.py === 0 && Math.abs(pl.vx) > 30) { this.tripped = true; this.run(this.tripEvent()); }
    }
    *mooseEvent() {
      const pl = this.player;
      this.locked = true; pl.vx = 0;
      this.moose.hidden = false; this.moose.x = 720; this.moose.flip = true;
      A.sfx('moose'); CH.doShake(2, 0.4);
      pl.face = 'shock'; pl.doEmote('!', 2);
      const w = this.moose.walkTo(560);
      let t = 0; while (!w.done) { t += 1 / 60; if (Math.floor(t * 3) !== Math.floor((t - 1 / 60) * 3)) { A.sfx('footBig'); CH.doShake(1.5, 0.15); } yield 1 / 60; }
      this.moose.flip = false;
      yield ui.say('Chubby', '...Morning.', { face: 'worried' });
      yield 0.8;
      this.moose.say('...', 2); A.sfx('moose');
      yield 1.5;
      yield ui.say('Chubby', "He's looking at my suit. {pp}He's judging my suit. {p}A moose is judging my suit.", { face: 'worried' });
      this.moose.walkTo(-100); this.moose.onArrive = () => { this.moose.hidden = true; };
      yield 1.0;
      pl.face = 'normal';
      this.locked = false;
    }
    *tripEvent() {
      const pl = this.player;
      this.locked = true;
      A.sfx('thud'); CH.doShake(3, 0.3); pl.vx = 0;
      pl.squashY.x = 0.5; pl.squashX.x = 1.5; pl.jiggle.kick(120); pl.face = 'shock';
      this.particles.burst(pl.x, pl.y, 10, { color: ['#eef4f8', '#fff'], speed: 50, grav: 100, life: 0.5, angle: -Math.PI / 2, spread: 2.5 });
      yield 0.6;
      yield ui.say('Chubby', "Pothole. {p}Of course. {pp}I'm fine. The suit is fine. My dignity was already gone.", { face: 'worried' });
      pl.face = 'normal';
      this.locked = false;
    }
    draw(g) {
      // parallax backdrop first
      const cx = Math.round(this.cam.x);
      gfx.vgrad(0, 0, W, this.floorY, ['#9fbfe0', '#b8d4ec', '#cfe2f0', '#e0ecf4']);
      gfx.circle(380 - cx * 0.02, 44, 12, '#fff8d8');
      for (let i = 0; i < 8; i++) { const x = CH.wrap(i * 180 - cx * 0.15, W + 200) - 100; gfx.tri(x - 90, 170, x + 90, 170, x, 100 + (i % 3) * 14, '#8a9ab8'); gfx.tri(x - 20, 124 + (i % 3) * 14, x + 20, 124 + (i % 3) * 14, x, 100 + (i % 3) * 14, '#fff'); }
      gfx.rect(0, 170, W, 44, '#7a8aa8');
      for (let i = 0; i < 24; i++) { const x = CH.wrap(i * 40 - cx * 0.4, W + 60) - 30; const h = 40 + (i % 4) * 10; for (let k = 0; k < 3; k++) gfx.tri(x - 12 + k * 3, 214 - k * 12, x + 12 - k * 3, 214 - k * 12, x, 214 - h, k % 2 ? '#3a5a4a' : '#2f4a3c'); }
      // town skyline in the distance when approaching
      if (cx > 1100) { for (let i = 0; i < 6; i++) { const x = 1600 + i * 60 - cx * 0.6; gfx.rect(x, 150 + (i % 2) * 10, 40, 64 - (i % 2) * 10, '#5a6a88'); for (let k = 0; k < 4; k++) gfx.px(x + 8 + k * 8, 160 + (i % 2) * 10, '#f5e6b0'); } }
      super.draw(g);
      for (const s of this.snow) gfx.px(s[0], s[1], s[2] > 1 ? '#fff' : 'rgba(255,255,255,0.7)');
      // cold breath
      if (Math.floor(this.t) % 3 === 0 && this.t % 1 < 0.5) { const pl = this.player; g.globalAlpha = 0.4; gfx.ellipse(pl.x - cx + (pl.flip ? -14 : 14), pl.y - 26, 3 + (this.t % 1) * 4, 2, '#fff'); g.globalAlpha = 1; }
    }
  }
  CH.TravelScene = TravelScene;

  // ---- Interview day start -----------------------------------------------------------------------
  CH.startInterviewDay = () => {
    S.chapter = 'interview'; S.day = 3; S.hour = 7.2; S.outfit = 'suit';
    const cabin = new CH.CabinScene({ mode: 'home', momPresent: false, playerX: 60 });
    cabin.tvMode = 'off'; cabin.fire.st.lit = false; cabin.pancakes.st.eaten = true; cabin.stove.st.steam = false; cabin.stove.st.pan = false; cabin.bgDirty = true;
    cabin.player.outfit = 'suit';
    cabin.onLeave = function* () { cabin.locked = true; yield ui.say('Chubby', "Okay. {p}Interview. {p}Ten AM. {p}Let's go be a person.", { face: 'focused' }); A.sfx('door'); yield fx.fadeOut(1); CH.game.set(new TravelScene({ dest: 'donalds' })); };
    cabin.onSleep = function* () { yield ui.say('Chubby', "No. NO. Interview. Go."); };
    cabin.onFridge = function* () { A.sfx('eat'); S.hunger = 0; yield ui.say('Chubby', "Cold pancake. Breakfast of champions. {p}Well. Breakfast of janitors, hopefully."); };
    cabin.onCouch = function* () { yield ui.say('Chubby', "Not today, couch. {p}I know. I know. I'll be back."); };
    cabin.onTV = function* () { yield ui.say('Chubby', "The Blue Hedgehog is still paused mid-victory pose. {p}Hang in there, buddy."); };
    CH.game.set(cabin);
    cabin.run((function* () {
      cabin.locked = true; fx.setFade(1);
      yield 0.4;
      yield fx.showCard('DAY 3', 'Monday  -  7:12 AM  -  Interview at 10.', 3, '#e8e0c8');
      yield fx.fadeIn(1.2);
      A.sfx('alarm'); yield 0.5;
      yield ui.say('Chubby', "I'm up. I'm UP. {p}I was up at 4, and 5, and 6. {pp}Suit: on. Buttons: two of three. {p}Confidence: located somewhere in the pit of my stomach, next to the fear.", { face: 'tired' });
      ui.setObjective("Leave through the front door for the interview");
      ui.showMoney = true;
      cabin.locked = false;
    })());
  };

  CH.SCENES.travel = () => { S.outfit = 'suit'; return new TravelScene({ dest: 'donalds' }); };
})(window.CH);
