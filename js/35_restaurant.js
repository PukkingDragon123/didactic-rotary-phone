// ============================================================================
// DONALD'S BURGERS: the living restaurant simulator + shift flow
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, fx = CH.fx, A = CH.audio, inp = CH.input, S = CH.state, P = CH.PAL;
  const W = CH.W, H = CH.H;
  const SHIFT_SECONDS = 270; // real seconds for an 8-hour shift

  // ---- restaurant props ----------------------------------------------------------------------
  const def = (n, w, h, d) => { CH.PROPS[n] = { name: n, w, h, draw: d }; };
  def('glassDoor', 30, 66, (g, x, y, t, st) => { gfx.rect(x - 2, y - 68, 34, 68, '#5a5a66'); gfx.rect(x, y - 66, 30, 66, '#9fdcff'); g.globalAlpha = 0.3; gfx.rect(x + 2, y - 64, 8, 62, '#fff'); g.globalAlpha = 1; gfx.rect(x + 14, y - 66, 2, 66, '#5a5a66'); gfx.rect(x + 4, y - 36, 8, 2, '#333'); gfx.rect(x + 18, y - 36, 8, 2, '#333'); gfx.rect(x + 2, y - 60, 26, 8, '#c8352b'); gfx.text('OPEN', x + 15, y - 59, '#fff', { align: 'center', font: 'small' }); });
  def('booth', 90, 44, (g, x, y, t, st) => {
    const dirty = st && st.dirty;
    // high-backed benches
    for (const bx of [x, x + 74]) { gfx.rect(bx, y - 44, 16, 44, '#a02a20'); gfx.rect(bx + 2, y - 42, 12, 26, '#c8352b'); gfx.rect(bx + 2, y - 30, 12, 1, '#8f2419'); gfx.rect(bx + 2, y - 16, 12, 8, '#e04a3e'); gfx.rect(bx, y - 2, 16, 2, '#5a1a10'); }
    gfx.rect(x + 16, y - 18, 10, 10, '#c8352b'); gfx.rect(x + 64, y - 18, 10, 10, '#c8352b'); // seat cushions
    // table with pedestal
    gfx.rect(x + 43, y - 22, 4, 22, '#5a5a66'); gfx.rect(x + 36, y - 2, 18, 2, '#5a5a66');
    gfx.rect(x + 24, y - 26, 42, 5, '#f5c33b'); gfx.rect(x + 24, y - 26, 42, 1, '#ffe080'); gfx.rect(x + 24, y - 21, 42, 1, '#c8a030');
    // condiments & table number
    gfx.rect(x + 28, y - 31, 3, 5, '#c8352b'); gfx.rect(x + 32, y - 30, 3, 4, '#f5c33b'); gfx.rect(x + 58, y - 32, 5, 6, '#f4f4f8'); gfx.rect(x + 59, y - 31, 3, 1, '#c8352b');
    if (dirty) { CH.FOOD.tray(g, x + 45, y - 27); gfx.rect(x + 36, y - 33, 10, 4, '#e0c090'); CH.FOOD.cup(g, x + 52, y - 28, 0.2, 'S'); gfx.px(x + 40, y - 27, '#c8352b'); gfx.px(x + 48, y - 27, '#f5c33b'); gfx.px(x + 44, y - 20, '#f0d080'); for (let i = 0; i < 3; i++) gfx.px(x + 38 + i * 6, y - 38 - Math.round(((t * 0.8 + i * 0.3) % 1) * 5), '#8a8a4a'); }
    else { gfx.rect(x + 38, y - 29, 8, 3, '#f4f4f8'); gfx.hline(x + 39, y - 28, 6, '#ddd'); }
  });
  def('counter', 190, 40, (g, x, y, t, st) => {
    gfx.rect(x, y - 40, 190, 40, '#c8352b'); gfx.rect(x, y - 42, 190, 4, '#f5c33b'); gfx.rect(x, y - 42, 190, 1, '#ffe080'); for (let i = 0; i < 190; i += 20) gfx.rect(x + i, y - 30, 10, 26, '#b02a20');
    // registers
    for (const rx of [x + 30, x + 100]) { gfx.rect(rx, y - 58, 22, 16, '#3a3a44'); gfx.rect(rx + 2, y - 56, 18, 8, '#4a8ad0'); gfx.rect(rx + 4, y - 54, 10, 1, '#fff'); gfx.rect(rx + 4, y - 51, 6, 1, '#fff'); gfx.rect(rx + 6, y - 42, 10, 2, '#222'); }
    // pickup area with heat lamp
    gfx.rect(x + 140, y - 70, 40, 4, '#5a5a66'); gfx.rect(x + 150, y - 66, 20, 6, '#c8352b'); g.globalAlpha = 0.25 + Math.sin(t * 3) * 0.05; gfx.tri(x + 140, y - 42, x + 180, y - 42, x + 160, y - 62, '#ffb060'); g.globalAlpha = 1; gfx.text('PICKUP', x + 160, y - 78, '#fff', { align: 'center', font: 'small' });
    if (st && st.bags) for (let i = 0; i < Math.min(3, st.bags); i++) CH.FOOD.bag(g, x + 150 + i * 12, y - 42, false, 1);
    // napkins/straws on counter
    gfx.rect(x + 8, y - 48, 12, 6, '#f4f4f8'); gfx.rect(x + 80, y - 46, 8, 4, '#c8352b');
  });
  def('menuBoard', 200, 44, (g, x, y) => { gfx.rect(x, y - 44, 200, 44, '#2a2a34'); gfx.rect(x + 2, y - 42, 196, 40, '#1a1a24'); const M = CH.MENU || []; M.slice(0, 12).forEach((m, i) => { const col = Math.floor(i / 6), row = i % 6; gfx.text(m.name, x + 6 + col * 100, y - 40 + row * 6, '#f5c33b', { font: 'small' }); gfx.text('$' + m.price.toFixed(2), x + 96 + col * 100, y - 40 + row * 6, '#fff', { align: 'right', font: 'small' }); }); });
  def('orderScreen', 40, 24, (g, x, y, t, st) => { gfx.rect(x, y - 24, 40, 24, '#222'); gfx.rect(x + 2, y - 22, 36, 20, '#0a2a1a'); gfx.text('NOW SERVING', x + 20, y - 21, '#4f4', { align: 'center', font: 'small' }); gfx.text(String((st && st.num) || 42), x + 20, y - 12, '#8f8', { align: 'center' }); });
  def('grillStation', 70, 60, (g, x, y, t, st) => { gfx.rect(x, y - 40, 70, 40, '#8a8a94'); gfx.rect(x + 4, y - 44, 62, 6, '#222'); gfx.rect(x + 6, y - 42, 58, 2, '#333'); g.globalAlpha = 0.2 + Math.sin(t * 5) * 0.05; gfx.rect(x + 6, y - 43, 58, 4, '#ff6030'); g.globalAlpha = 1; for (let i = 0; i < 3; i++) CH.FOOD.patty(g, x + 16 + i * 18, y - 46, 0.7); for (let i = 0; i < 3; i++) { const k = (t * 0.5 + i * 0.33) % 1; gfx.px(x + 14 + i * 20 + Math.round(Math.sin(t * 2 + i) * 2), y - 52 - k * 24, `rgba(255,255,255,${0.6 - k * 0.6})`); } gfx.rect(x, y - 60, 70, 8, '#5a5a66'); for (let i = 8; i < 70; i += 16) gfx.rect(x + i, y - 58, 10, 4, '#3a3a44'); });
  def('fryerStation', 60, 50, (g, x, y, t) => { gfx.rect(x, y - 40, 60, 40, '#8a8a94'); gfx.rect(x + 4, y - 46, 24, 10, '#5a5a66'); gfx.rect(x + 32, y - 46, 24, 10, '#5a5a66'); gfx.rect(x + 6, y - 44, 20, 6, '#e8c040'); gfx.rect(x + 34, y - 44, 20, 6, '#e8c040'); for (let i = 0; i < 4; i++) gfx.px(x + 8 + i * 5, y - 43 + Math.round(Math.sin(t * 7 + i) * 1), '#fff8c0'); gfx.rect(x + 10, y - 60, 3, 14, '#aab'); gfx.rect(x + 6, y - 62, 12, 3, '#c8352b'); gfx.rect(x + 38, y - 58, 3, 12, '#aab'); });
  def('prepStation', 70, 50, (g, x, y, t) => { gfx.rect(x, y - 40, 70, 40, '#8a8a94'); gfx.rect(x, y - 42, 70, 3, '#e8ecf0'); for (let i = 0; i < 5; i++) { gfx.rect(x + 4 + i * 13, y - 52, 11, 10, '#c8dce8'); gfx.rect(x + 5 + i * 13, y - 51, 9, 6, ['#a05040', '#f5c33b', '#5fc05a', '#d13c3c', '#e8d8f0'][i]); } CH.FOOD.bunBottom(g, x + 30, y - 44); CH.FOOD.patty(g, x + 30, y - 47, 1); });
  def('bagStation', 60, 50, (g, x, y, t) => { gfx.rect(x, y - 40, 60, 40, '#8a8a94'); gfx.rect(x, y - 42, 60, 3, '#e8ecf0'); CH.FOOD.bag(g, x + 14, y - 42, true, 0); CH.FOOD.bag(g, x + 36, y - 42, true, 0); gfx.rect(x + 4, y - 70, 52, 20, '#5a5a66'); gfx.rect(x + 6, y - 68, 48, 16, '#222'); gfx.text('ORDERS', x + 30, y - 66, '#4f4', { align: 'center', font: 'small' }); });
  def('sodaMachine', 40, 60, (g, x, y, t) => { gfx.rect(x, y - 60, 40, 60, '#c8352b'); gfx.rect(x + 2, y - 58, 36, 16, '#8a1d1d'); for (let i = 0; i < 4; i++) { gfx.rect(x + 3 + i * 9, y - 40, 7, 8, ['#3a1a08', '#f0902a', '#e8e060', '#5a2a10'][i]); gfx.rect(x + 5 + i * 9, y - 32, 3, 4, '#333'); } gfx.rect(x + 2, y - 24, 36, 4, '#8a8a94'); });
  def('dtWindow', 60, 70, (g, x, y, t, st) => { gfx.rect(x, y - 70, 60, 60, '#5a5a66'); gfx.rect(x + 4, y - 66, 52, 52, '#a8b8cc'); const car = st && st.car; if (car) { const cx = x + 4 + Math.round(car.x); gfx.clip(x + 4, y - 66, 52, 52); gfx.rrect(cx, y - 36, 50, 14, 3, car.color); gfx.rrect(cx + 10, y - 46, 28, 12, 3, car.color); gfx.rect(cx + 14, y - 44, 10, 8, '#9fdcff'); gfx.circle(cx + 10, y - 22, 5, '#111'); gfx.circle(cx + 40, y - 22, 5, '#111'); gfx.unclip(); } gfx.rect(x + 28, y - 66, 3, 52, '#5a5a66'); gfx.rect(x, y - 14, 60, 4, '#c8352b'); gfx.text('DRIVE-THRU', x + 30, y - 78, '#fff', { align: 'center', font: 'small' }); gfx.rect(x + 8, y - 10, 40, 10, '#5a5a66'); });
  def('officeDoor', 26, 58, (g, x, y) => { gfx.rect(x - 2, y - 60, 30, 60, '#5a5a66'); gfx.rect(x, y - 58, 26, 58, '#8a5a2b'); gfx.rect(x + 3, y - 52, 20, 15, '#fff'); gfx.text('OFFICE', x + 13, y - 51, '#333', { align: 'center', font: 'small' }); gfx.text('BRENDA', x + 13, y - 44, '#c8352b', { align: 'center', font: 'small' }); gfx.px(x + 22, y - 30, '#f5c33b'); });
  def('closet', 26, 58, (g, x, y, t, st) => { gfx.rect(x - 2, y - 60, 30, 60, '#5a5a66'); gfx.rect(x, y - 58, 26, 58, '#6a6a74'); for (let i = 0; i < 6; i++) gfx.rect(x + 4, y - 52 + i * 4, 18, 1, '#444'); gfx.rect(x + 6, y - 30, 14, 8, '#fff'); gfx.text('SUPPLY', x + 13, y - 28, '#333', { align: 'center', font: 'small' }); if (!(st && st.mopTaken)) { gfx.rect(x + 28, y - 50, 2, 50, '#c8a060'); gfx.rect(x + 24, y - 6, 12, 6, '#e8e0d0'); gfx.rect(x + 20, y - 12, 18, 12, '#f5c33b'); gfx.ellipse(x + 29, y - 8, 6, 3, '#6aa8ff'); } });
  def('kiosk', 30, 60, (g, x, y, t) => { gfx.rect(x, y - 60, 30, 60, '#2a3350'); gfx.rect(x + 3, y - 56, 24, 34, '#1b2238'); gfx.rect(x + 5, y - 54, 20, 30, '#3b6fd6'); for (let i = 0; i < 6; i++) gfx.rect(x + 8 + (i % 3) * 5, y - 50 + Math.floor(i / 3) * 12, 4, 8, i < 3 ? '#f5c33b' : '#6fa2ff'); gfx.text('CAREER', x + 15, y - 24, '#f5c33b', { align: 'center', font: 'small' }); gfx.text('TOWER', x + 15, y - 17, '#f5c33b', { align: 'center', font: 'small' }); if (Math.sin(t * 3) > 0) gfx.px(x + 26, y - 58, '#4f4'); });
  def('kidsCorner', 60, 50, (g, x, y, t) => { gfx.rect(x, y - 20, 60, 20, '#3b6fd6'); for (let i = 0; i < 24; i++) gfx.circle(x + 5 + (i % 12) * 5, y - 14 + Math.floor(i / 12) * 6, 2.5, ['#c8352b', '#f5c33b', '#4f9d3a', '#e8752c'][i % 4]); gfx.rect(x + 10, y - 50, 40, 30, '#f5c33b'); gfx.rect(x + 14, y - 46, 32, 22, '#fff'); CH.drawManEgg(g, x + 30, y - 32, { t }); gfx.text('PLAYPLACE', x + 30, y - 58, '#c8352b', { align: 'center', font: 'small' }); });
  def('binR', 16, 24, (g, x, y, t, st) => { const f = (st && st.fill) || 0; gfx.rect(x, y - 22, 16, 22, '#5a5a66'); gfx.rect(x - 1, y - 26, 18, 5, '#c8352b'); gfx.rect(x + 4, y - 25, 8, 3, '#222'); if (f > 0.6) { gfx.rect(x + 2, y - 30, 4, 4, '#f4f4f8'); gfx.rect(x + 8, y - 32, 5, 6, '#e0c090'); if (f > 0.9) for (let i = 0; i < 3; i++) gfx.px(x + 4 + i * 5, y - 36 - Math.round(((t + i * 0.3) % 1) * 4), '#333'); } });
  def('spill', 30, 6, (g, x, y, t, st) => { const m = (st && st.mess) || { color: '#6a3a18', color2: '#8a5028' }; gfx.ellipse(x + 15, y, 15, 4, m.color); gfx.ellipse(x + 12, y - 1, 8, 2, m.color2); if (st && st.mess && st.mess.eyes) { gfx.px(x + 10, y - 2, '#fff'); gfx.px(x + 18, y - 2, '#fff'); } });
  def('wetSign', 12, 20, (g, x, y) => { gfx.tri(x, y, x + 12, y, x + 6, y - 20, '#f5c33b'); gfx.text('!', x + 6, y - 14, '#222', { align: 'center', font: 'small' }); });

  // ---- scene -------------------------------------------------------------------------------------
  class RestaurantScene extends CH.WorldScene {
    constructor(opts = {}) {
      super({ width: 1340, floorY: 214, playerX: 30 });
      this.name = 'restaurant';
      this.job = S.job || 'janitor'; this.jobIdx = CH.JOBS.indexOf(this.job);
      this.timeScale = 8 / SHIFT_SECONDS; this.shiftT = 0; this.shiftOver = false;
      this.tasks = []; this.customers = []; this.complaints = 0; this.tasksDone = 0; this.stars = 0; this.taskResults = [];
      this.pendingOrders = 0; this.orderSpawnT = 6; this.served = 0; this.tips = 0; this.stationTask = null;
      this.spawnT = 3; this.dayNum = S.day; this.shiftScore = 0;
      this.build();
      this.player.outfit = this.job === 'janitor' ? 'janitor' : 'uniform'; this.player.stepSfx = 'step'; this.player.speed = CH.has('speed1') ? 92 : 80;
      this.player.hat = 'visor';
      this.orderNum = 41;
    }
    drawRoom(g) {
      const w = this.width, F = this.floorY;
      gfx.rect(0, 0, w, 30, '#e8e4d8'); for (let x = 0; x < w; x += 40) gfx.rect(x, 0, 38, 28, '#f0ece0'); gfx.rect(0, 28, w, 2, '#c8352b');
      // walls: cream tile top, red band, wood-look lower
      gfx.rect(0, 30, w, F - 30, '#f4ead8'); for (let y = 34; y < 100; y += 10) for (let x = -((y / 10) & 1) * 10; x < w; x += 20) gfx.rect(x, y, 19, 9, (x + y) % 7 ? '#f8f0e0' : '#efe4cc');
      gfx.rect(0, 100, w, 6, '#c8352b'); gfx.rect(0, 106, w, 2, '#f5c33b');
      gfx.rect(0, 108, w, F - 108, '#e8dcc0'); for (let y = 112; y < F; y += 8) gfx.hline(0, y, w, '#dccfb0');
      gfx.rect(0, F - 6, w, 6, '#c8352b');
      // kitchen zone: stainless wall
      gfx.rect(780, 30, 430, F - 30, '#c8ccd4'); for (let y = 30; y < F; y += 12) gfx.hline(780, y, 430, '#b8bcc4'); gfx.rect(780, 100, 430, 8, '#8a8a94');
      gfx.rect(770, 30, 10, F - 30, '#5a5a66'); gfx.rect(1210, 30, 8, F - 30, '#5a5a66'); // kitchen dividers
      gfx.text('KITCHEN - EMPLOYEES ONLY', 995, 40, '#5a5a66', { align: 'center', font: 'small' });
      // shelves with supplies along the kitchen wall
      for (const sx of [800, 1000]) { gfx.rect(sx, 60, 120, 3, '#8a8a94'); for (let i = 0; i < 6; i++) { gfx.rect(sx + 4 + i * 19, 46, 14, 14, ['#f5c33b', '#c8352b', '#e8e0d0', '#5fc05a', '#e8e0d0', '#3b6fd6'][i]); gfx.rect(sx + 6 + i * 19, 50, 10, 4, '#fff'); } }
      gfx.rect(1120, 44, 40, 20, '#222'); gfx.text('CAM 2', 1140, 50, '#4f4', { align: 'center', font: 'small' });
      // floor: red/white checker in dining, grey tile in kitchen
      gfx.rect(0, F, w, H - F, '#e8e0d0'); for (let y = F; y < H; y += 12) for (let x = -((y / 12) & 1) * 12; x < 780; x += 24) gfx.rect(x, y, 12, 12, '#c8352b');
      gfx.rect(780, F, w - 780, H - F, '#9a9aa4'); for (let y = F; y < H; y += 12) for (let x = 780 - ((y / 12) & 1) * 12; x < w; x += 24) gfx.rect(x, y, 12, 12, '#a8a8b2');
      // windows to street (dining)
      for (const wx of [60, 270]) { gfx.rect(wx, 40, 90, 56, '#a8c8e8'); gfx.rect(wx, 84, 90, 12, '#e6eef4'); for (let i = 0; i < 4; i++) gfx.tri(wx + 8 + i * 22, 86, wx + 24 + i * 22, 86, wx + 16 + i * 22, 60, '#2f6a24'); gfx.frame(wx, 40, 90, 56, '#c8352b'); gfx.rect(wx + 44, 40, 2, 56, '#c8352b'); gfx.rect(wx, 68, 90, 2, '#c8352b'); }
      // posters
      gfx.rect(180, 44, 60, 46, '#f5c33b'); gfx.rect(184, 48, 52, 38, '#c8352b'); gfx.text('MAN EGG', 210, 52, '#fff', { align: 'center', font: 'small' }); gfx.text('KIDS MEAL', 210, 60, '#fff', { align: 'center', font: 'small' }); gfx.text('TOY INSIDE', 210, 74, '#f5c33b', { align: 'center', font: 'small' }); gfx.ellipse(210, 68, 5, 6, '#e8dcc0'); gfx.rect(207, 67, 6, 1, '#5a3a1a');
      gfx.rect(400, 44, 50, 40, '#fff'); gfx.frame(400, 44, 50, 40, '#c8352b'); gfx.text('EMPLOYEE', 425, 48, '#c8352b', { align: 'center', font: 'small' }); gfx.text('OF THE', 425, 55, '#c8352b', { align: 'center', font: 'small' }); gfx.text('MONTH', 425, 62, '#c8352b', { align: 'center', font: 'small' }); gfx.text('TAMMY (x71)', 425, 74, '#333', { align: 'center', font: 'small' });
      gfx.rect(1230, 50, 60, 30, '#f5c33b'); gfx.text('DAYS SINCE', 1260, 54, '#8f2419', { align: 'center', font: 'small' }); gfx.text('FRYER FIRE', 1260, 61, '#8f2419', { align: 'center', font: 'small' }); gfx.text('0', 1260, 69, '#c8352b', { align: 'center' });
      // wall menu chalkboard above dining + clock
      gfx.rect(480, 44, 70, 46, '#2a3a2a'); gfx.frame(480, 44, 70, 46, '#8a5a2b'); gfx.text('TODAY', 515, 48, '#f5c33b', { align: 'center', font: 'small' }); gfx.text('BIG DON', 515, 58, '#fff', { align: 'center', font: 'small' }); gfx.text('+ FRIES', 515, 66, '#fff', { align: 'center', font: 'small' }); gfx.text('$9.99', 515, 76, '#8bd06a', { align: 'center', font: 'small' });
      CH.PROPS.hClock.draw(g, 560, 60, 0);
    }
    build() {
      const F = this.floorY, s = this;
      const say = (t, o) => () => ui.say('Chubby', t, Object.assign({ face: 'normal' }, o));
      this.door = this.addProp('glassDoor', 6, F, { hint: 'Exit', interact: () => this.interactExit(), range: 26 });
      this.addProp('hDoor', 44, F, { st: { label: 'WC' }, hint: 'Bathroom', interact: (p) => this.interactBathroom(p), id: 'bathroom', range: 26 });
      this.addProp('kidsCorner', 90, F, { hint: 'PlayPlace', interact: say("The PlayPlace. A ball pit with 400 balls and, historically, one raccoon.") });
      this.booths = [];
      for (let i = 0; i < 4; i++) this.booths.push(this.addProp('booth', 160 + i * 100, F, { st: { dirty: false }, hint: 'Table', interact: (p) => this.interactBooth(p), range: 50, id: 'booth' + i, seatX: 205 + i * 100, occupied: null }));
      this.bin = this.addProp('binR', 556, F, { st: { fill: 0.2 }, hint: 'Bin', interact: (p) => this.interactBin(p), id: 'bin', range: 24 });
      this.addProp('plant', 574, F, { st: { variant: 0 } });
      this.addProp('menuBoard', 590, 100);
      this.addProp('orderScreen', 798, 96, { st: { num: 41 }, id: 'orderScreen' });
      this.counter = this.addProp('counter', 590, F, { st: { bags: 0 }, hint: 'Counter', interact: () => this.interactCounter(), range: 60, id: 'counter' });
      this.addProp('sodaMachine', 790, F, { hint: 'Soda machine', interact: say('The fountain. Four flavours. One of them is just "brown".') });
      this.grill = this.addProp('grillStation', 840, F, { hint: 'Grill', interact: () => this.interactStation('grill'), range: 40, id: 'grill' });
      this.fryer = this.addProp('fryerStation', 920, F, { hint: 'Fryer', interact: () => this.interactStation('fries'), range: 34, id: 'fries' });
      this.prep = this.addProp('prepStation', 990, F, { hint: 'Assembly', interact: () => this.interactStation('assembly'), range: 40, id: 'assembly' });
      this.bagSt = this.addProp('bagStation', 1070, F, { hint: 'Bagging', interact: () => this.interactStation('bagging'), range: 34, id: 'bagging', promptY: F - 76 });
      this.dt = this.addProp('dtWindow', 1140, F - 30, { st: { car: null }, hint: 'Drive-thru', interact: () => this.interactStation('drivethru'), range: 34, id: 'drivethru', promptY: F - 110 });
      this.addProp('binR', 1200, F, { st: { fill: 0.1 } });
      this.kiosk = this.addProp('kiosk', 1224, F, { hint: 'Career Tower', interact: () => this.interactKiosk(), range: 26 });
      this.closet = this.addProp('closet', 1264, F, { st: { mopTaken: false }, hint: 'Supply closet', interact: () => this.interactCloset(), range: 26 });
      this.office = this.addProp('officeDoor', 1304, F, { hint: "Brenda's office", interact: () => this.interactOffice(), range: 26 });
      this.addProp('extinguisher', 790, 150);
      // coworkers
      this.tammy = CH.makeTammy(650, F - 4); this.tammy.flip = true; this.tammy.arm = 'hold'; this.tammy.depth = -1; this.addNPC(this.tammy);
      this.kevin = CH.makeKevin(870, F + 1); this.kevin.wanderRange = [850, 905]; this.kevin.arm = 'hold'; this.addNPC(this.kevin);
      this.jorge = CH.makeJorge(950, F + 1); this.jorge.arm = 'hold'; this.jorge.flip = true; this.addNPC(this.jorge);
      this.destiny = CH.makeDestiny(1040, F + 1); this.destiny.wanderRange = [1000, 1120]; this.destiny.arm = 'hold'; this.addNPC(this.destiny);
      this.brenda = CH.makeBrenda(1290, F + 1); this.brenda.hidden = true; this.addNPC(this.brenda);
      if (this.job !== 'janitor') { this.newKevin = new CH.NPC({ name: 'New Kevin', species: 'raccoon', outfit: 'polo', x: 700, y: F + 1, speed: 45, hat: 'visor' }); this.newKevin.arm = 'mop'; this.addNPC(this.newKevin); }
      // idle animation coroutines for coworkers
      this.run(this.coworkerLife());
      this.cars = []; this.carT = 5;
    }
    enter() {
      A.play('restaurant', 1.5); fx.setFade(1); ui.showMoney = true;
      this.run(this.shiftIntro());
    }
    // ---------------------------------------------------------------- shift flow ----
    *shiftIntro() {
      this.locked = true; S.hour = 8;
      yield fx.fadeIn(1);
      const first = !CH.flag('firstShiftDone');
      const info = CH.JOB_INFO[this.job];
      if (first) {
        this.brenda.hidden = false; this.brenda.x = 60; this.brenda.flip = false;
        yield ui.say('Brenda', "You're on time. {p}Good. That's day one done, basically. Here's your visor. Here's your name tag. Here's your mop.", { voice: 'blip2' });
        yield ui.say('Brenda', "Job's simple. See a mess? Fix the mess. Spills, tables, bins, bathrooms, supplies. Tasks pop up with a little icon and a patience bar. {p}When the bar runs out, a customer complains, and I hear about it.", { voice: 'blip2' });
        yield ui.say('Brenda', "Shift ends at four. Do good, you get tips. Do great, you get promoted. There's a whole career tower thing, corporate's obsessed with it, the kiosk's in the back. {p}Questions?", { voice: 'blip2' });
        const c = yield ui.choose('Chubby', '', ["Where's the mop?", "What if I'm bad at it?", 'No questions. Ready.']);
        if (c === 0) yield ui.say('Brenda', "Supply closet. Back right. It's the one with the bucket. {p}It's always the one with the bucket.", { voice: 'blip2' });
        else if (c === 1) yield ui.say('Brenda', "You will be. Everyone is. Then you're less bad. Then one day you're Tammy. {p}Nobody's Tammy.", { voice: 'blip2' });
        else yield ui.say('Brenda', "Ha. Okay. I like that. It's wrong, but I like it.", { voice: 'blip2' });
        this.brenda.walkTo(1290); this.brenda.onArrive = () => { this.brenda.hidden = true; };
        CH.flag('firstShiftDone', true);
        this.closet.st.mopTaken = false; this.needMop = true;
        ui.setObjective('Grab the mop from the supply closet (far right)');
      } else {
        ui.setObjective(this.job === 'janitor' ? 'Clean up messes before customers complain!' : `Work the ${info.title} station. Shift ends at 4 PM.`);
        this.closet.st.mopTaken = true;
        if (this.jobIdx >= 1 && !CH.flag('stationTut_' + this.job)) { CH.flag('stationTut_' + this.job, true); yield ui.say('Brenda', this.jobTutorial(), { voice: 'blip2' }); }
      }
      this.locked = false;
      this.run(this.shiftLoop());
    }
    jobTutorial() {
      return { bagging: "Bagging. Orders pile up on the screen behind you; when there's a batch, hit the bagging station and put the right food in the right bag. Drinks in the carrier. Fold. Chute.", fries: "Fries and drinks. Baskets in the oil, shake 'em, lift before they burn, salt, scoop. Cups under the right nozzle, don't overflow, lid. You'll get greasy. It's a good greasy.", grill: "Grill. Patties on, flip once, off before they're charcoal. Plates on the pass. Kevin will judge you. Ignore Kevin.", assembly: "Assembly. Build 'em exactly like the ticket, bottom bun first. Sauce is a squeeze, not a scream. Wrap, pass. You are an architect now.", cashier: "Register. Tap what they say, total, make change. Exact change. If they say 'the big one' they mean the Big Don. If they say 'the M one', point at the sign.", drivethru: "Drive-thru. The headset is 40 years old. Listen through the static, pick the order, then hand the bag out when the car's lined up. Miss and the fries are on the pavement.", shiftlead: "Shift Leader. You run the floor now. Put people where they're good, put out fires (real ones), and keep the demand bars down. Kevin takes breaks. Plan for Kevin.", manager: "Manager. It's my old office. Emails, schedule, inventory. Deny anything corporate sends that mentions 'pickle budget'. Water the plant. I never did.", regional: "Regional Sauce Consultant. I don't know what this is either. There's a test kitchen on floor seven. Make the sauce taste like the sauce. Apparently that's a job.", vp: "VP of Synergy. Say words in the boardroom until they nod. That's it. That's the whole job. I hate that it pays this much.", cbo: "Chief Burger Officer. They send you burgers, you say yes or no. Follow the guidelines. Reject anything with a shoe in it. There will be a shoe.", ceo: "CEO. It's you. The big D is you now. Sign things. Make a decision that matters. {p}I'm proud of you, kid. Don't tell Tammy." }[this.job] || 'Do the thing.';
    }
    *shiftLoop() {
      while (!this.shiftOver) {
        if (S.hour >= 16 && !CH.ui.busy() && !this.inMinigame) { this.shiftOver = true; break; }
        yield 0.2;
      }
      yield () => !ui.busy() && !this.inMinigame;
      this.locked = true;
      yield* this.endShift();
    }
    *endShift() {
      A.sfx('bell');
      ui.setObjective('');
      this.brenda.hidden = false; this.brenda.x = this.player.x + 60; this.brenda.flip = true;
      yield 0.5;
      const res = this.computeResults();
      yield ui.say('Brenda', res.quality >= 0.75 ? "That's four. {p}Not bad, Chubby. Not bad at all." : res.quality >= 0.45 ? "That's four. {p}You survived. The building's still here." : "That's four. {p}We need to talk about... all of it. Tomorrow.", { voice: 'blip2' });
      // pay
      CH.addMoney(res.pay);
      S.shiftsWorked++; S.shiftScores.push(res.quality); if (S.shiftScores.length > 20) S.shiftScores.shift();
      S.stats.hours += 8; S.energy = Math.max(0, S.energy - 45); S.hunger = Math.min(100, S.hunger + 40);
      S.jobShifts = S.jobShifts || {}; S.jobShifts[this.job] = (S.jobShifts[this.job] || 0) + 1;
      S.lastShift = res;
      CH.autosave('Shift saved');
      const done = new CH.Signal();
      CH.game.push(new ShiftSummaryScene(res, () => done.resolve()));
      yield done;
      // promotion check
      const promo = CH.checkPromotion();
      if (promo === 'promote') { yield* this.promotionScene(); }
      else if (promo === 'needTower') { yield ui.say('Brenda', `Corporate says you're ready for ${CH.JOB_INFO[CH.JOBS[this.jobIdx + 1]].title}, but you need to unlock floor ${CH.JOB_INFO[CH.JOBS[this.jobIdx + 1]].floor} in the Career Tower first. {p}Kiosk's in the back. Buy five upgrades on a floor to unlock the elevator.`, { voice: 'blip2' }); }
      this.brenda.walkTo(1290); this.brenda.onArrive = () => { this.brenda.hidden = true; };
      ui.setObjective('Clock out: leave through the front door (or use the Career Tower kiosk)');
      this.afterShift = true;
      this.locked = false;
    }
    computeResults() {
      const info = CH.JOB_INFO[this.job];
      const n = this.taskResults.length;
      const avg = n ? this.taskResults.reduce((a, b) => a + b.score, 0) / n : (this.job === 'janitor' ? 0.5 : 0.4);
      const quality = CH.clamp(avg - this.complaints * 0.06, 0, 1);
      const base = info.wage * 8;
      const tipMult = 1 + (CH.has('tips1') ? 0.15 : 0) + (CH.has('tips2') ? 0.2 : 0) + (CH.has('tips3') ? 0.3 : 0) + (CH.has('wetsign') && this.job === 'janitor' ? 0.1 : 0);
      const tips = Math.round(base * quality * 0.6 * tipMult * 100) / 100;
      const bonus = this.stars >= n * 2.5 && n > 2 ? Math.round(base * 0.2) : 0;
      return { job: info.title, base, tips, bonus, pay: Math.round((base + tips + bonus) * 100) / 100, tasks: n, stars: this.stars, complaints: this.complaints, quality, served: this.served, day: this.dayNum };
    }
    *promotionScene() {
      const next = CH.JOBS[this.jobIdx + 1]; const info = CH.JOB_INFO[next];
      A.play('victory', 0.5);
      yield ui.say('Brenda', "Also. {p}Corporate called. {pp}They want you as " + info.title + ". {p}Effective tomorrow. " + CH.fmtMoney(info.wage) + " an hour.", { voice: 'blip2' });
      this.player.setFace('shock', 3); this.player.doEmote('!', 2); CH.doShake(2, 0.3);
      yield ui.say('Chubby', next === 'ceo' ? "...I'm the CEO?" : "I got promoted?", { face: 'shock' });
      yield ui.say('Brenda', next === 'ceo' ? "You're the CEO. The big D is you. {p}...Can I have Fridays off?" : "You got promoted. Don't make it weird. {p}Okay, make it a little weird.", { voice: 'blip2' });
      S.job = next; S.jobLevel = this.jobIdx + 1; S.reputation += 2;
      CH.addMoney(Math.round(info.wage * 4)); ui.toast('Promotion bonus: ' + CH.fmtMoney(Math.round(info.wage * 4)), '#f5c33b', 3);
      CH.sendText('Mom', CH.pick(["PROMOTED?? My baby!! I told the nurse. I told THREE nurses.", "The nurse says I'm not allowed to be this excited. I don't care. PROMOTED!!", "I'm so proud of you, Chubby. So proud. ♥ Eat something."]));
      CH.autosave('Shift saved');
      yield fx.showCard('PROMOTED!', info.title + '  -  ' + CH.fmtMoney(info.wage) + '/hr', 3.5, '#f5c33b');
      A.play('restaurant', 1);
    }
    // ---------------------------------------------------------------- simulation ----
    update(dt) {
      if (this.inMinigame) return;
      super.update(dt);
      if (this.shiftOver && !this.afterShift) return;
      if (!this.shiftOver) this.simulate(dt);
      // cars at the drive-thru
      this.carT -= dt; if (this.carT <= 0) { this.carT = CH.rand(8, 16); this.dt.st.car = { x: -60, color: CH.pick(['#3b6fd6', '#c8352b', '#4f9d3a', '#f5c33b', '#8a8a94']) }; }
      if (this.dt.st.car) { this.dt.st.car.x += dt * 12; if (this.dt.st.car.x > 60) this.dt.st.car = null; }
      // task patience
      for (const t of this.tasks) { if (t.strikes >= 2) continue; t.patience -= dt; if (t.patience <= 0) { t.strikes = (t.strikes || 0) + 1; this.complain(t); t.patience = t.maxPatience * 1.25; } }
      this.prop('orderScreen').st.num = this.orderNum;
    }
    isRush() { return (S.hour > 11.5 && S.hour < 13.5) || (S.hour > 15 && S.hour < 16); }
    simulate(dt) {
      // customers
      this.spawnT -= dt;
      const rush = this.isRush();
      if (this.spawnT <= 0 && this.customers.length < (rush ? 9 : 5)) { this.spawnT = (rush ? 3.5 : 7) * (0.8 + Math.random() * 0.5); this.spawnCustomer(); }
      for (let i = this.customers.length - 1; i >= 0; i--) { const c = this.customers[i]; this.updateCustomer(c, dt); if (c.state === 'gone') { this.customers.splice(i, 1); this.npcs.splice(this.npcs.indexOf(c.npc), 1); } }
      // orders for station jobs
      if (this.jobIdx >= 1 && this.jobIdx <= 6) {
        this.orderSpawnT -= dt * (rush ? 1.8 : 1);
        if (this.orderSpawnT <= 0) { this.orderSpawnT = 9; this.pendingOrders++; if (!this.stationTask) this.makeStationTask(); else this.stationTask.count = this.pendingOrders; }
      } else if (this.jobIdx >= 7) { this.orderSpawnT -= dt; if (this.orderSpawnT <= 0) { this.orderSpawnT = 40; if (!this.stationTask) this.makeStationTask(); } }
      // bin fill & bathroom dirt accumulate
      this.bin.st.fill = Math.min(1, this.bin.st.fill + dt * 0.006 * (rush ? 2 : 1));
      if (this.bin.st.fill >= 1 && !this.tasks.some((t) => t.type === 'bin')) this.addTask({ type: 'bin', x: this.bin.x + 8, y: this.bin.y - 30, patience: 45, label: 'Bin overflowing!' });
      this.bathDirt = (this.bathDirt || 0) + dt * 0.004 * (rush ? 2 : 1);
      if (this.bathDirt >= 1 && !this.tasks.some((t) => t.type === 'bathroom')) { this.addTask({ type: 'bathroom', x: 61, y: this.floorY - 70, patience: 60, label: 'Bathroom needs attention' }); this.bathDirt = 0; }
      this.supplyT = (this.supplyT || 0) + dt * 0.003 * (rush ? 2 : 1);
      if (this.supplyT >= 1 && !this.tasks.some((t) => t.type === 'restock')) { this.addTask({ type: 'restock', x: 610, y: this.floorY - 66, patience: 55, label: 'Napkins out!' }); this.supplyT = 0; }
      // auto janitor (New Kevin) handles messes when player has another job
      if (this.newKevin) { const mess = this.tasks.find((t) => ['spill', 'table', 'bin', 'bathroom', 'restock'].includes(t.type)); if (mess && !this.newKevin.target && !this.newKevin.busy) { this.newKevin.walkTo(mess.x, () => { this.newKevin.busy = true; this.run((function* (self) { yield 4 + Math.random() * 3; self.removeTask(mess, true); self.newKevin.busy = false; })(this)); }); } }
    }
    spawnCustomer() {
      const npc = CH.makeCustomer(-10, this.floorY + CH.rand(0, 4)); npc.depth = 0; this.addNPC(npc);
      const c = { npc, state: 'queue', t: 0, patience: (CH.has('patience2') ? 60 : CH.has('patience1') ? 48 : 38), order: CH.pick(CH.MENU || [{ name: 'Big Don' }]), booth: null };
      this.customers.push(c);
      npc.walkTo(this.queueX(c));
      return c;
    }
    queueX(c) { const idx = this.customers.filter((k) => k.state === 'queue').indexOf(c); return 600 - Math.max(0, idx) * 22; }
    updateCustomer(c, dt) {
      const n = c.npc; c.t += dt;
      if (c.state === 'queue') {
        const qx = this.queueX(c); if (!n.target && Math.abs(n.x - qx) > 3) n.walkTo(qx);
        c.patience -= dt;
        if (c.patience < 12 && Math.random() < dt * 0.3) n.doEmote(CH.pick(['...', '?', '!']), 1);
        if (c.patience <= 0) { this.complain({ label: 'Customer left the line' }); n.face = 'angry'; c.state = 'leave'; n.walkTo(-20, () => { c.state = 'gone'; }); return; }
        // front of the queue & orders
        if (this.customers.filter((k) => k.state === 'queue').indexOf(c) === 0 && Math.abs(n.x - 600) < 4 && c.t > 2) {
          if (c.orderT === undefined) { c.orderT = 3.5; n.say(CH.pick(['One ' + c.order.name + ' please', 'Uh... ' + c.order.name + '?', c.order.name + '. And a job. Kidding.', 'Is this the D one?']), 3); this.tammy.talk = true; }
          else { c.orderT -= dt; if (c.orderT <= 0) { this.tammy.talk = false; c.state = 'wait'; c.waitT = (this.isRush() ? 14 : 8) * (CH.has('predict') ? 0.8 : 1); n.walkTo(750 + CH.rand(-14, 14)); A.sfx('cash'); this.orderNum++; } }
        }
      } else if (c.state === 'wait') {
        c.waitT -= dt; c.patience -= dt * 0.5;
        if (c.patience <= 0) { this.complain({ label: 'Order took too long' }); n.face = 'angry'; c.state = 'leave'; n.walkTo(-20, () => { c.state = 'gone'; }); return; }
        if (c.waitT <= 0) {
          this.counter.st.bags = Math.max(0, this.counter.st.bags - 1); n.arm = 'tray'; A.sfx('ding'); this.served++; S.stats.customersServed++;
          const booth = this.booths.find((b) => !b.occupied); if (booth && Math.random() < 0.8) { booth.occupied = c; c.booth = booth; c.state = 'toTable'; n.walkTo(booth.seatX, () => { c.state = 'eat'; c.eatT = 8 + Math.random() * 8; n.pose = 'sit'; n.y = this.floorY - 6; n.flip = false; }); }
          else { c.state = 'leave'; n.walkTo(-20, () => { c.state = 'gone'; }); }
        }
      } else if (c.state === 'eat') {
        c.eatT -= dt;
        if (Math.random() < dt * 0.6) this.particles.burst(n.x + 6, n.y - 18, 2, { color: ['#f0d080', '#e8b060'], speed: 15, grav: 150, life: 0.5 });
        if (Math.random() < dt * 0.05) n.say(CH.pick(['*munch*', 'mmm', '*slurp*', 'needs pickles', 'this is the D one']), 1.5);
        if (c.eatT <= 0) {
          n.pose = 'stand'; n.y = this.floorY + 1; n.arm = 'idle';
          const b = c.booth; b.occupied = null;
          if (Math.random() < 0.7 && !b.st.dirty) { b.st.dirty = true; this.addTask({ type: 'table', x: b.x + 45, y: b.y - 40, patience: 70, label: 'Dirty table', prop: b }); }
          if (Math.random() < 0.35) this.spawnSpill(n.x + CH.rand(-30, 30));
          this.bin.st.fill = Math.min(1, this.bin.st.fill + 0.15);
          if (Math.random() < 0.25) { c.state = 'bathroom'; n.walkTo(61, () => { n.hidden = true; this.bathDirt += 0.4; this.run((function* (self) { yield 3; n.hidden = false; c.state = 'leave'; n.walkTo(-20, () => { c.state = 'gone'; }); })(this)); }); }
          else { c.state = 'leave'; n.walkTo(-20, () => { c.state = 'gone'; }); }
        }
      }
    }
    spawnSpill(x) {
      x = CH.clamp(x, 110, 570);
      const kinds = Object.keys(CH.MESSES); const kind = S.day < 3 ? CH.pick(['soda', 'ketchup', 'milkshake']) : CH.pick(kinds);
      const p = this.addProp('spill', x - 15, this.floorY + 3, { st: { mess: CH.MESSES[kind] }, layer: 'back', anim: true, id: 'spill' + Math.random(), hint: CH.MESSES[kind].name, range: 24, priority: 2, interact: (pp) => this.interactSpill(pp) });
      this.addTask({ type: 'spill', x, y: this.floorY - 14, patience: 50, label: CH.MESSES[kind].name, prop: p, kind });
      A.sfx('splash');
    }
    addTask(t) { t.maxPatience = t.patience; this.tasks.push(t); if (this.job === 'janitor' || t.type === 'station') A.sfx('notify'); return t; }
    removeTask(t, silent) { const i = this.tasks.indexOf(t); if (i >= 0) this.tasks.splice(i, 1); if (t.prop && t.type === 'spill') { this.props.splice(this.props.indexOf(t.prop), 1); if (!silent) { const ws = this.addProp('wetSign', t.x - 6, this.floorY, { anim: false, layer: 'front' }); this.bgDirty = true; this.run((function* (self) { yield 20; self.props.splice(self.props.indexOf(ws), 1); })(this)); } } if (t.prop && t.type === 'table') { t.prop.st.dirty = false; this.bgDirty = true; } if (t.type === 'bin') this.bin.st.fill = 0; }
    complain(t) { this.complaints++; S.reputation = Math.max(-10, S.reputation - 1); A.sfx('angry'); ui.toast('Complaint: ' + (t.label || 'something'), '#ff8080', 3); CH.doShake(2, 0.2); this.particles.text(this.player.x, this.player.y - 40, 'COMPLAINT', '#ff6060'); }
    makeStationTask() {
      const st = this.job === 'shiftlead' ? { x: 690, y: this.floorY - 50 } : this.job === 'manager' ? { x: this.office.x + 13, y: this.floorY - 66 } : this.jobIdx >= 9 ? { x: this.kiosk.x + 15, y: this.floorY - 66 } : this.prop(this.job === 'cashier' ? 'counter' : this.job) || this.counter;
      const x = st.x + (st.w ? st.w / 2 : 0), y = st.y !== undefined && st.h ? st.y - st.h - 6 : (st.y || this.floorY - 60);
      this.stationTask = this.addTask({ type: 'station', x, y: this.job === 'cashier' ? this.floorY - 66 : y, patience: this.jobIdx >= 7 ? 120 : 40, label: this.jobIdx >= 7 ? CH.JOB_INFO[this.job].title + ' duty' : 'Orders waiting', count: this.pendingOrders });
      this.stationTask.onExpire = true;
    }
    // ---------------------------------------------------------------- interactions ----
    *interactStation(kind) {
      if (this.afterShift) { yield ui.say('Chubby', "Shift's over. The " + kind + " can wait until tomorrow."); return; }
      const mine = (kind === this.job) || (kind === 'fries' && this.job === 'fries');
      if (!mine) { const who = { grill: 'Kevin', fries: 'Jorge', assembly: 'Kevin', bagging: 'Destiny', drivethru: 'Destiny', cashier: 'Tammy' }[kind]; yield ui.say(who || 'Kevin', CH.pick(["That's my station, bud.", "You're not trained on this. Yet.", 'Touch my ' + kind + ' and I touch your mop.', "Corporate says no. I say also no."]), { portrait: who }); return; }
      if (!this.stationTask) { yield ui.say('Chubby', 'No orders right now. {p}Breathe. It won\'t last.'); return; }
      yield* this.runTask(this.stationTask);
    }
    *interactCounter() { if (this.job === 'cashier') { yield* this.interactStation('cashier'); return; } if (this.job === 'shiftlead') { if (this.stationTask) { yield* this.runTask(this.stationTask); return; } } if (this.tasks.some((t) => t.type === 'restock')) { yield* this.runTask(this.tasks.find((t) => t.type === 'restock')); return; } yield ui.say('Tammy', CH.pick(["Hey new guy. Don't lean on the counter. Corporate has a camera.", "Six years, Chubby. Six. Nobody's been here longer except the fryer.", "You're doing fine. Better than Kevin. Kevin set the mop on fire once. Don't ask."]), { portrait: 'Tammy' }); }
    *interactSpill(p) { const t = this.tasks.find((k) => k.type === 'spill' && k.prop === p); if (t) { yield* this.runTask(t); return; } const i = this.props.indexOf(p); if (i >= 0) this.props.splice(i, 1); }
    *interactBooth(p) { const t = this.tasks.find((k) => k.type === 'table' && k.prop === p); if (t) { yield* this.runTask(t); return; } yield ui.say('Chubby', p.occupied ? "Someone's eating. I'll wait. I'm very good at waiting." : 'Clean table. For now.'); }
    *interactBin(p) { const t = this.tasks.find((k) => k.type === 'bin'); if (t) { yield* this.runTask(t); return; } yield ui.say('Chubby', `The bin is ${Math.round(p.st.fill * 100)}% full. I know this now. I know bin percentages.`); }
    *interactBathroom(p) { const t = this.tasks.find((k) => k.type === 'bathroom'); if (t) { yield* this.runTask(t); return; } A.sfx('door'); yield ui.say('Chubby', CH.pick(["Clean enough. {p}'Enough' is a janitor's favourite word.", "Somebody wrote 'KEVIN WAS HERE' on the stall. Kevin has been gone for weeks. Kevin haunts us.", 'I check my visor in the mirror. It does not help.'])); }
    *interactCloset() {
      if (this.needMop) { this.needMop = false; this.closet.st.mopTaken = true; this.bgDirty = true; A.sfx('pop'); this.player.arm = 'mop'; yield ui.say('Chubby', "The mop. {p}My mop. {pp}Hello, mop. We're going to be spending a lot of time together.", { face: 'focused' }); ui.setObjective('Clean up messes before customers complain!'); this.player.arm = 'idle'; this.run(this.firstMess()); return; }
      yield ui.say('Chubby', 'Mops, buckets, 400 rolls of paper towel, and a mysterious box labelled "KEVIN - DO NOT OPEN".');
    }
    *firstMess() { yield 2; this.spawnSpill(360); ui.setHint('A spill! Walk to it and press E', 4); }
    *interactOffice() {
      A.sfx('door');
      if (this.afterShift) { yield ui.say('Brenda', "Go home, Chubby. Or hit the kiosk. {p}Or stand there. It's a free country. Mostly.", { voice: 'blip2' }); return; }
      const promo = CH.checkPromotion(true);
      const next = CH.JOBS[this.jobIdx + 1];
      if (this.job === 'manager' || this.jobIdx >= 8) { if (this.stationTask) { yield* this.runTask(this.stationTask); return; } yield ui.say('Chubby', "My office. {p}I have an office. There's a plant. It's dying. That's how I know it's mine."); return; }
      if (!next) { yield ui.say('Brenda', "You're the CEO. Why are you knocking on MY door?", { voice: 'blip2' }); return; }
      const shifts = (S.jobShifts && S.jobShifts[this.job]) || 0;
      yield ui.say('Brenda', promo === 'promote' ? "Finish today's shift and we'll talk about " + CH.JOB_INFO[next].title + ". {p}I already talked to corporate. Don't tell anyone I said that." : promo === 'needTower' ? `Corporate wants you on floor ${CH.JOB_INFO[next].floor} of the Career Tower before they'll sign off on ${CH.JOB_INFO[next].title}. Five upgrades unlocks an elevator. It's their system. I just work here. So do you.` : `Next step is ${CH.JOB_INFO[next].title}. Two solid shifts at ${CH.JOB_INFO[this.job].title} (you've done ${shifts}) plus the right Career Tower floor. {p}Now get back out there.`, { voice: 'blip2' });
    }
    *interactKiosk() {
      A.sfx('tap');
      if (this.stationTask && this.jobIdx >= 9 && !this.afterShift) { const c = yield ui.choose('Chubby', CH.JOB_INFO[this.job].title + ' duty is waiting upstairs.', ['Do the job (elevator up)', 'Open the Career Tower']); if (c === 0) { yield* this.runTask(this.stationTask); return; } if (c < 0) return; }
      if (!CH.flag('kioskTut')) { CH.flag('kioskTut', true); yield ui.say('Chubby', "The Career Tower kiosk. {p}A giant office building on a screen. Every floor is a career level. Every room is an upgrade. {p}Five upgrades per floor and the elevator goes up. {pp}Corporate made a video game out of my job. {p}...Okay. I respect that."); }
      const done = new CH.Signal(); CH.game.push(new CH.TowerScene(() => done.resolve())); yield done;
    }
    *interactExit() {
      if (!this.afterShift) { const c = yield ui.choose('Chubby', `It's ${CH.timeStr()}. Shift ends at 4 PM.`, ['Keep working', 'Leave early (Brenda will notice)']); if (c === 1) { this.complaints += 2; S.reputation -= 2; yield ui.say('Brenda', "Leaving EARLY? {p}Fine. Docked. Noted. Remembered.", { voice: 'blip2' }); S.hour = 16; this.shiftOver = true; } return; }
      this.locked = true; A.sfx('door'); yield fx.fadeOut(1);
      if (CH.afterShift) CH.afterShift(S.lastShift); else CH.game.set(new CH.TitleScene());
    }
    *runTask(t) {
      this.locked = true; this.inMinigame = true;
      const diff = 1 + Math.min(3, (S.day - 3) * 0.15 + (this.isRush() ? 0.6 : 0) + (t.count ? Math.min(1.2, t.count * 0.25) : 0)) + this.jobIdx * 0.05;
      let scene;
      if (t.type === 'spill') scene = new CH.MopScene({ kind: t.kind, difficulty: diff });
      else if (t.type === 'table') scene = new CH.TableScene({ difficulty: diff });
      else if (t.type === 'bin') scene = new CH.BinScene({ difficulty: diff });
      else if (t.type === 'bathroom') scene = new CH.BathroomScene({ difficulty: diff });
      else if (t.type === 'restock') scene = new CH.RestockScene({ difficulty: diff });
      else if (t.type === 'station') { const games = CH.JOB_GAMES[this.job]({ difficulty: diff }); scene = games[0]; }
      if (!scene) { this.locked = false; this.inMinigame = false; return; }
      A.stop(0.3);
      const r = yield CH.runMinigame(scene);
      A.play(this.isRush() ? 'rush' : 'restaurant', 0.5);
      this.inMinigame = false;
      this.taskResults.push(r); this.stars += r.stars; this.tasksDone++;
      const tipNow = Math.round(r.stars * (2 + this.jobIdx) * 100) / 100; if (tipNow) { CH.addMoney(tipNow); this.particles.text(this.player.x, this.player.y - 44, '+' + CH.fmtMoney(tipNow) + ' tip', '#8bd06a'); }
      if (t.type === 'station') { this.pendingOrders = Math.max(0, this.pendingOrders - Math.max(1, t.count || 1)); this.stationTask = null; this.counter.st.bags += 2; if (this.pendingOrders > 0) this.makeStationTask(); }
      this.removeTask(t);
      if (r.stars === 0) { this.complaints++; }
      this.locked = false;
    }
    *coworkerLife() {
      while (true) {
        yield CH.rand(4, 9);
        if (this.inMinigame) continue;
        const who = CH.pick([this.kevin, this.jorge, this.destiny, this.tammy]);
        who.say(CH.pick(['*sizzle*', 'ORDER UP', 'where is the— oh', 'Kevin no', 'fryer 2 is fine. FINE.', 'big D not M', '*whistles*', 'six years...', 'ugh, lunch rush', 'did someone say pickles', '*headset static*', 'ONE BIG DON']), 2.5);
        if (who === this.kevin) { this.kevin.squash.x = 1.06; }
        if (Math.random() < 0.3) this.particles.steam(this.grill.x + 35, this.grill.y - 50, 4);
        if (this.isRush() && A.current && A.current.name !== 'rush') A.play('rush', 0.5); else if (!this.isRush() && A.current && A.current.name === 'rush') A.play('restaurant', 0.5);
      }
    }
    // ---------------------------------------------------------------- draw ----
    draw(g) {
      super.draw(g);
      const cx = Math.round(this.cam.x);
      // task icons
      for (const t of this.tasks) {
        const x = Math.round(t.x - cx), y = Math.round(t.y) - 8 + Math.round(Math.sin(this.t * 5 + t.x) * 2);
        const p = CH.clamp(t.patience / t.maxPatience, 0, 1);
        const col = t.strikes >= 2 ? '#6a6a74' : t.type === 'station' ? '#3b6fd6' : p < 0.3 ? '#c8352b' : '#f5c33b';
        gfx.rrect(x - 8, y - 14, 16, 14, 3, col); gfx.tri(x - 3, y, x + 3, y, x, y + 4, col);
        const icon = { spill: '~', table: '■', bin: '▼', bathroom: 'WC', restock: '□', station: t.count ? String(t.count) : '!' }[t.type] || '!';
        gfx.text(icon, x, y - 11, '#fff', { align: 'center', font: 'small' });
        if (!(t.strikes >= 2)) { gfx.rect(x - 8, y - 17, 16, 2, '#222'); gfx.rect(x - 8, y - 17, Math.round(16 * p), 2, p < 0.3 ? '#ff4040' : '#8bd06a'); }
        if (Math.abs(this.player.x - t.x) < 70) gfx.text(t.label, x, y - 26, '#fff', { align: 'center', font: 'small', outline: '#000' });
      }
      // shift HUD
      const p = CH.clamp((S.hour - 8) / 8, 0, 1);
      gfx.rect(4, 18, 120, 8, 'rgba(0,0,0,0.6)'); gfx.rect(5, 19, Math.round(118 * p), 6, this.isRush() ? '#c8352b' : '#f5c33b');
      gfx.text('SHIFT ' + (this.isRush() ? '- RUSH HOUR!' : ''), 6, 27, this.isRush() && Math.sin(this.t * 8) > 0 ? '#ff8080' : '#fff', { font: 'small', outline: '#000' });
      gfx.text(`${CH.JOB_INFO[this.job].title}  -  Day ${S.day}`, 6, 36, '#f5c33b', { font: 'small', outline: '#000' });
      gfx.text(`Tasks ${this.tasksDone}  ★${this.stars}  Complaints ${this.complaints}`, 6, 44, '#fff', { font: 'small', outline: '#000' });
      if (this.job !== 'janitor' && this.jobIdx <= 6) gfx.text(`Orders waiting: ${this.pendingOrders}`, 6, 52, this.pendingOrders > 3 ? '#ff8080' : '#fff', { font: 'small', outline: '#000' });
      // rush tint
      if (this.isRush()) { g.globalAlpha = 0.06 + Math.sin(this.t * 4) * 0.02; gfx.rect(0, 0, W, H, '#ff4020'); g.globalAlpha = 1; }
    }
  }
  CH.RestaurantScene = RestaurantScene;

  // ---- promotion rule ---------------------------------------------------------------------------
  CH.checkPromotion = (peek) => {
    const idx = CH.JOBS.indexOf(S.job); const next = CH.JOBS[idx + 1]; if (!next) return null;
    const shifts = (S.jobShifts && S.jobShifts[S.job]) || 0;
    const recent = S.shiftScores.slice(-2); const avg = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
    const ready = shifts >= 2 && (avg >= 0.5 || shifts >= 4);
    if (!ready) return 'notyet';
    if (S.towerFloor < CH.JOB_INFO[next].floor) return 'needTower';
    return 'promote';
  };

  // ---- shift summary overlay --------------------------------------------------------------------
  class ShiftSummaryScene extends CH.Scene {
    constructor(res, onDone) { super(); this.overlay = true; this.res = res; this.onDone = onDone; this.t2 = 0; this.rows = []; }
    enter() { A.sfx('cash'); }
    update(dt) { this.t2 += dt; if (this.t2 > 1.5 && (inp.hit('interact') || inp.hit('confirm') || inp.hit('jump') || inp.mpressed)) { inp.eat(); CH.game.pop(); this.onDone(); } }
    draw(g) {
      g.globalAlpha = 0.7; gfx.rect(0, 0, W, H, '#000'); g.globalAlpha = 1;
      const bw = 260, bh = 170, bx = W / 2 - bw / 2, by = H / 2 - bh / 2;
      ui.drawBox(bx, by, bw, bh, { border: '#f5c33b' });
      gfx.text('SHIFT COMPLETE  -  DAY ' + this.res.day, W / 2, by + 8, '#f5c33b', { align: 'center' });
      gfx.text(this.res.job, W / 2, by + 20, '#fff', { align: 'center', font: 'small' });
      const rows = [['Tasks completed', String(this.res.tasks)], ['Stars earned', '★ ' + this.res.stars], ['Customers served', String(this.res.served)], ['Complaints', String(this.res.complaints)], ['Base pay (8h)', CH.fmtMoney(this.res.base)], ['Tips', CH.fmtMoney(this.res.tips)], ['Bonus', CH.fmtMoney(this.res.bonus)]];
      rows.forEach((r, i) => { if (this.t2 > 0.2 + i * 0.15) { gfx.text(r[0], bx + 14, by + 34 + i * 11, '#ccc', { font: 'small' }); gfx.text(r[1], bx + bw - 14, by + 34 + i * 11, r[0] === 'Complaints' && this.res.complaints ? '#ff8080' : '#fff', { align: 'right', font: 'small' }); } });
      if (this.t2 > 1.3) { gfx.hline(bx + 14, by + 114, bw - 28, '#f5c33b'); gfx.text('TOTAL PAY', bx + 14, by + 120, '#f5c33b'); g.save(); g.translate(bx + bw - 14, by + 118); g.scale(1.4, 1.4); gfx.text(CH.fmtMoney(this.res.pay), 0, 0, '#8bd06a', { align: 'right' }); g.restore(); }
      if (this.t2 > 1.5) { const q = this.res.quality; gfx.text(q >= 0.75 ? 'Brenda: "Solid."' : q >= 0.45 ? 'Brenda: "...Okay."' : 'Brenda: "We\'ll talk."', W / 2, by + 140, '#ccc', { align: 'center', font: 'small' }); if (Math.sin(this.t2 * 5) > 0) gfx.text('E - continue', W / 2, by + bh - 12, '#fff', { align: 'center', font: 'small' }); }
    }
  }
  CH.ShiftSummaryScene = ShiftSummaryScene;

  CH.startShift = () => { CH.game.set(new RestaurantScene()); };
  CH.SCENES.restaurant = () => { S.job = S.job || 'janitor'; S.chapter = 'career'; CH.flag('hasPhone', true); return new RestaurantScene(); };
  CH.SCENES.restaurantGrill = () => { S.job = 'grill'; S.chapter = 'career'; CH.flag('hasPhone', true); CH.flag('firstShiftDone', true); return new RestaurantScene(); };
  for (const j of ['bagging', 'fries', 'assembly', 'cashier', 'drivethru', 'shiftlead', 'manager', 'regional', 'vp', 'cbo', 'ceo']) CH.SCENES['restaurant_' + j] = () => { S.job = j; S.chapter = 'career'; S.towerFloor = Math.max(S.towerFloor || 1, CH.JOB_INFO[j].floor); CH.flag('hasPhone', true); CH.flag('firstShiftDone', true); return new RestaurantScene(); };
})(window.CH);
