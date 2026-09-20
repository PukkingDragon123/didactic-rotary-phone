// ============================================================================
// TITLE SCREEN - the cabin living room at night, Chubby on the couch with
// Blue Hedgehog on the TV. The menu sits beside him like a pause overlay in
// the middle of the life he is about to lose.
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, fx = CH.fx, art = CH.art, A = CH.audio, inp = CH.input, S = CH.state;
  const W = CH.W, H = CH.H;

  // ---- attract-mode Blue Hedgehog, drawn inside the TV screen ---------------
  // Same shapes the real platformer uses, just on a loop that never dies.
  function attractScreen(g, sx, sy, sw, sh, t) {
    const scroll = (t * 26) % sw;
    // everything here is drawn on a scrolling loop that runs past the edges,
    // so it has to be clipped to the tube or it spills onto the living room
    gfx.clip(sx, sy, sw, sh);
    gfx.rect(sx, sy, sw, sh, '#2a6fd0');
    // parallax hills
    for (let L = 0; L < 2; L++) {
      const sp = L ? 0.55 : 0.28, col = L ? '#1f7a4a' : '#186040';
      const off = (t * 26 * sp) % 24;
      for (let i = -1; i < sw / 24 + 2; i++) {
        gfx.ellipse(sx + i * 24 - off + 12, sy + sh - 6 + L * 2, 14 - L * 3, 7 - L, col);
      }
    }
    // clouds
    for (let i = 0; i < 3; i++) {
      const cx = sx + ((i * 21 + sw - (t * 7) % (sw + 20)) % (sw + 20)) - 10;
      gfx.ellipse(cx, sy + 5 + (i % 2) * 4, 5, 2, '#bfe0ff');
      gfx.ellipse(cx + 3, sy + 4 + (i % 2) * 4, 3, 2, '#dff0ff');
    }
    // ground
    gfx.rect(sx, sy + sh - 5, sw, 5, '#c8903c');
    gfx.rect(sx, sy + sh - 5, sw, 1, '#f0c070');
    for (let i = 0; i < sw / 6 + 2; i++) gfx.px(sx + ((i * 6 - scroll) % sw + sw) % sw, sy + sh - 3, '#a06c28');
    // rings
    for (let i = 0; i < 4; i++) {
      const rx = sx + ((i * 15 + 40 - (t * 26) % (sw + 30)) % (sw + 30)) - 8;
      if (rx < sx - 4 || rx > sx + sw) continue;
      const w = 2 + Math.abs(Math.sin(t * 5 + i)) * 2;
      gfx.ellipseOutline(rx, sy + sh - 14, w, 3, '#ffd84a');
    }
    // ladybug
    const lx = sx + ((sw + 20) - (t * 26 + 30) % (sw + 44));
    if (lx > sx - 6 && lx < sx + sw + 4) {
      gfx.ellipse(lx, sy + sh - 8, 3, 2.4, '#d03434');
      gfx.px(lx - 1, sy + sh - 9, '#1a1420'); gfx.px(lx + 1, sy + sh - 8, '#1a1420');
    }
    // the hedgehog: run, jump, run
    const cyc = t % 3.2;
    const jump = cyc > 1.5 && cyc < 2.4;
    const jp = jump ? Math.sin(((cyc - 1.5) / 0.9) * Math.PI) : 0;
    const hx = sx + 14, hy = sy + sh - 8 - jp * 11;
    const sq = jump ? 1 - jp * 0.12 : 1 + Math.abs(Math.sin(t * 14)) * 0.06;
    gfx.ellipse(hx, sy + sh - 6, 4 - jp * 1.5, 1.2, 'rgba(0,0,0,0.3)');
    // spiky back
    for (let i = 0; i < 4; i++) {
      gfx.tri(hx - 1, hy - 1 - i, hx - 1, hy + 1 - i, hx - 6 - i * 0.6, hy - 3 - i * 1.4, '#1b4fb0');
    }
    gfx.ellipse(hx, hy, 4 * sq, 4 / sq, '#2a6ae0');
    gfx.ellipse(hx + 1.5, hy + 0.5, 2.4, 2.2, '#f2c9a0');
    gfx.px(hx + 1, hy - 1, '#fff'); gfx.px(hx + 2, hy - 1, '#1a1420');
    if (!jump) {
      const sp = Math.sin(t * 22) * 2;
      gfx.ellipse(hx - 1 + sp, hy + 4, 1.6, 1, '#d84a2a');
      gfx.ellipse(hx + 1 - sp, hy + 4, 1.6, 1, '#d84a2a');
    } else {
      gfx.ellipse(hx, hy + 3.5, 2.4, 1.2, '#d84a2a');
    }
    // Man Egg drifting at the far side
    const ex = sx + sw - 12 + Math.sin(t * 0.9) * 4, ey = sy + 9 + Math.cos(t * 1.3) * 2;
    gfx.ellipse(ex, ey, 5, 6, '#e8e0d0');
    gfx.ellipse(ex, ey - 2, 4.4, 2.6, '#d84a4a');
    gfx.px(ex - 1, ey - 1, '#1a1420'); gfx.px(ex + 1, ey - 1, '#1a1420');
    gfx.rect(ex - 2, ey + 1, 4, 1, '#8a6a4a');
    gfx.ellipse(ex, ey + 7, 4, 1.5, '#8a8a94');
    // scanlines + tube curvature
    g.save(); g.globalAlpha = 0.16;
    for (let y = 0; y < sh; y += 2) gfx.rect(sx, sy + y, sw, 1, '#000');
    g.restore();
    g.save(); g.globalAlpha = 0.1; gfx.rect(sx + 1, sy + 1, 5, sh - 2, '#fff'); g.restore();
    // HUD
    gfx.text('RINGS ' + (Math.floor(t * 3) % 40), sx + 2, sy + 2, '#fff', { font: 'small' });
    gfx.unclip();
  }
  CH.attractScreen = attractScreen;

  class TitleScene extends CH.Scene {
    constructor() {
      super(); this.name = 'title';
      const couchH = (CH.PROPS && CH.PROPS.couch && CH.PROPS.couch.h) || 30;
      this.chubby = new CH.Chubby(206, 214 - Math.round(couchH * 0.4));
      this.chubby.outfit = 'hoodie';
      this.chubby.sitting = true;
      this.chubby.arm = 'controller';
      this.chubby.face = 'happy';
      this.started = false;
      this.snow = [];
      for (let i = 0; i < 40; i++) this.snow.push([Math.random() * 120, Math.random() * 90, 0.4 + Math.random()]);
      this.menu = null;
      this.logoT = 0;
    }
    enter() {
      fx.setFade(1); fx.fadeIn(1.4);
      ui.showMoney = false; ui.objective = ''; ui.objectiveShown = true;
      A.play('title', 2);
      this.buildMenu();
    }
    buildMenu() {
      const newest = CH.newestSlot();
      const info = newest === null ? null : CH.slotInfo(newest);
      const items = [];
      items.push({
        label: 'Continue',
        hint: info ? 'Day ' + info.day : null,
        disabled: !info,
        action: () => this.start(() => { CH.loadFrom(newest); CH.resumeChapter(); }),
      });
      items.push({ label: 'New Game', action: () => this.newGame() });
      items.push({
        label: 'Load Game',
        disabled: !CH.anySave(),
        action: () => CH.game.push(new CH.SaveMenuScene('load', () => this.buildMenu())),
      });
      items.push({ label: 'Controls', action: () => CH.game.push(new CH.ControlsScene()) });
      this.menu = new CH.MenuList(items, { x: 300, y: 128, w: 150, h: 18, gap: 5, sel: info ? 0 : 1 });
    }
    newGame() {
      const begin = () => {
        CH.resetState();
        CH.game.set(new CH.CabinScene({ mode: 'intro' }));
      };
      if (CH.anySave()) { CH.game.push(new ConfirmNewGame(() => this.start(begin))); return; }
      this.start(begin);
    }
    start(fn) {
      if (this.started) return;
      this.started = true;
      this.run((function* () {
        A.stop(0.8);
        yield fx.fadeOut(0.9);
        fn();
        yield fx.fadeIn(0.9);
      })());
    }
    update(dt) {
      this.logoT += dt;
      this.chubby.update(dt);
      // he reacts to his own game
      const beat = this.t % 3.2;
      if (beat < 0.05) this.chubby.face = CH.pick(['happy', 'grin', 'focused']);
      if (beat > 1.5 && beat < 1.6) { this.chubby.face = 'focused'; this.chubby.jiggle.kick(10); }
      if (beat > 2.4 && beat < 2.5) { this.chubby.face = 'grin'; this.chubby.jiggle.kick(-14); }
      for (const s of this.snow) {
        s[1] += dt * 16 * s[2];
        s[0] += Math.sin(this.t + s[1] * 0.06) * dt * 5;
        if (s[1] > 92) { s[1] = 4; s[0] = Math.random() * 120; }
      }
      if (!this.started && this.menu) this.menu.update(dt);
    }
    draw(g) {
      // ---- the living room ---------------------------------------------------
      const floorY = 214;
      if (CH.paintCabin) CH.paintCabin(g, W, floorY, true);
      else { gfx.rect(0, 0, W, floorY, '#3a2418'); gfx.rect(0, floorY, W, H - floorY, '#6e4523'); }

      // window with falling snow, top left
      gfx.rect(22, 44, 96, 62, '#2a1a10');
      gfx.rect(25, 47, 90, 56, '#101a34');
      for (const s of this.snow) {
        if (s[0] < 2 || s[0] > 88) continue;
        gfx.px(25 + s[0], 47 + (s[1] % 56), s[2] > 1 ? '#fff' : 'rgba(255,255,255,0.55)');
      }
      for (let i = 0; i < 5; i++) {
        const tx = 30 + i * 20;
        for (let k = 0; k < 3; k++) gfx.tri(tx - 7 + k * 2, 96 - k * 7, tx + 7 - k * 2, 96 - k * 7, tx, 96 - 16 - k * 7, '#0e2a1c');
      }
      gfx.rect(25, 73, 90, 2, '#2a1a10'); gfx.rect(68, 47, 2, 56, '#2a1a10');
      gfx.rect(20, 104, 100, 4, '#5a3a20');

      // props: the couch set. Drawn from the shared prop registry so the title
      // always matches the room the player is about to walk into.
      // family photos on the wall: the reason any of this matters
      for (let i = 0; i < 3; i++) {
        const px0 = 150 + i * 44, py0 = 120 + (i === 1 ? -6 : 0);
        const tilt = i === 2 ? 1 : 0;
        gfx.rect(px0 - 1, py0 - 1 + tilt, 34, 30, '#241a12');
        gfx.rect(px0, py0 + tilt, 32, 28, '#c8a060');
        gfx.rect(px0 + 2, py0 + 2 + tilt, 28, 24, '#2d3a52');
        if (i === 0) { // Mom and a small Chubby
          gfx.ellipse(px0 + 11, py0 + 16 + tilt, 5, 7, '#a06a9a');
          gfx.ellipse(px0 + 11, py0 + 9 + tilt, 4, 4, '#b87c50');
          gfx.ellipse(px0 + 21, py0 + 19 + tilt, 4, 5, '#2f9d86');
          gfx.ellipse(px0 + 21, py0 + 14 + tilt, 3, 3, '#b87c50');
        } else if (i === 1) { // the cabin in summer
          gfx.rect(px0 + 4, py0 + 16 + tilt, 24, 10, '#6a4428');
          gfx.tri(px0 + 2, py0 + 16 + tilt, px0 + 30, py0 + 16 + tilt, px0 + 16, py0 + 7 + tilt, '#8a5a34');
          gfx.rect(px0 + 13, py0 + 20 + tilt, 6, 6, '#3a2a1a');
          gfx.rect(px0 + 2, py0 + 24 + tilt, 28, 2, '#4f8a3a');
        } else { // Chubby's first fish, held up like a trophy
          gfx.rect(px0 + 2, py0 + 20 + tilt, 28, 6, '#2f6a8a');
          gfx.ellipse(px0 + 12, py0 + 15 + tilt, 5, 6, '#2f9d86');
          gfx.ellipse(px0 + 12, py0 + 9 + tilt, 3.5, 3.5, '#b87c50');
          for (let q = 0; q < 3; q++) gfx.tri(px0 + 9 + q * 2.5, py0 + 7 + tilt, px0 + 11 + q * 2.5, py0 + 7 + tilt, px0 + 8 + q * 2.5, py0 + 3 + tilt, '#e8d3a4');
          gfx.ellipse(px0 + 21, py0 + 14 + tilt, 5, 2.6, '#8fb8d8');
          gfx.tri(px0 + 25, py0 + 12 + tilt, px0 + 25, py0 + 16 + tilt, px0 + 28, py0 + 14 + tilt, '#8fb8d8');
          gfx.px(px0 + 18, py0 + 13 + tilt, '#1a1420');
        }
        gfx.rect(px0, py0 + tilt, 32, 1, '#e0c090');
      }

      // braided rug the furniture stands on
      for (let i = 0; i < 4; i++) {
        const c = ['#6e3232', '#9a5040', '#7e4234', '#a86450'][i];
        gfx.ellipse(160, floorY + 9, 168 - i * 14, 15 - i * 1.8, c);
      }

      const P = CH.PROPS;
      const tvSt = { screen: attractScreen, on: true };
      const couchW = (P && P.couch && P.couch.w) || 70;
      if (P) {
        if (P.tv) P.tv.draw(g, 44, floorY, this.t, tvSt);
        if (P.coffeeTable) P.coffeeTable.draw(g, 130, floorY, this.t, {});
        if (P.couch) P.couch.draw(g, 200 - Math.round(couchW / 2), floorY, this.t, {});
        if (P.lamp) P.lamp.draw(g, 268, floorY, this.t, { on: true });
      }

      // TV light blooming into the room, pulsing with the attract loop
      const flick = 0.1 + Math.abs(Math.sin(this.t * 5.5)) * 0.05;
      g.save();
      g.globalCompositeOperation = 'lighter';
      // keep the bloom inside the room so it does not smear across the wall
      g.beginPath(); g.rect(28, floorY - 62, 240, 74); g.clip();
      g.globalAlpha = flick * 0.55;
      gfx.ellipse(96, floorY - 36, 86, 34, '#1e3350');
      g.globalAlpha = flick;
      gfx.ellipse(88, floorY - 30, 44, 20, '#1a2c46');
      g.restore();

      // ---- Chubby ------------------------------------------------------------
      this.chubby.draw(g, 0, 0);
      // controller cable running back to the TV
      gfx.line(186, 200, 150, 208, '#2a2530');
      gfx.line(150, 208, 118, 202, '#2a2530');

      // ---- logo --------------------------------------------------------------
      const ly = 40 + Math.round(Math.sin(this.logoT * 1.4) * 2);
      const lx = 300;
      // quill crest peeking out from behind the wordmark
      for (let i = 0; i < 11; i++) {
        const qx = lx - 78 + i * 15.6, dir = i % 2 ? 1 : -1;
        const len = 11 + (i % 3) * 3;
        gfx.tri(qx - 4, ly + 4, qx + 4, ly + 4, qx + dir * 4, ly + 4 - len, '#3a2a18');
        gfx.tri(qx - 3, ly + 4, qx + 3, ly + 4, qx + dir * 3.4, ly + 5 - len, '#e8d3a4');
        gfx.tri(qx - 1.4, ly + 4, qx + 0.6, ly + 4, qx + dir * 2.4, ly + 7 - len, '#f6ecd0');
      }
      g.save(); g.translate(lx, ly); g.scale(3, 3);
      gfx.text('CHUBBY', 0, 0, '#f5c33b', { align: 'center', outline: '#3a1f12' });
      g.restore();
      g.save(); g.translate(lx, ly + 28); g.scale(1.4, 1.4);
      gfx.text('THE PORCUPINE', 0, 0, '#fbf6ea', { align: 'center', outline: '#3a1f12' });
      g.restore();
      gfx.text('a life & job simulator', lx, ly + 46, '#c9b8a0', { align: 'center', font: 'small' });

      // ---- menu --------------------------------------------------------------
      if (this.menu) this.menu.draw();
      gfx.text('Arrows to choose, Enter to pick, M to mute', W / 2, H - 11, '#9a8f84', { align: 'center', font: 'small' });
    }
  }
  CH.TitleScene = TitleScene;

  // ---- "start over?" confirmation -------------------------------------------
  class ConfirmNewGame extends CH.Scene {
    constructor(onYes) {
      super(); this.name = 'confirm'; this.overlay = true;
      this.onYes = onYes; this.yes = false;
    }
    rects() {
      return [{ x: W / 2 - 74, y: 150, w: 68, h: 16 }, { x: W / 2 + 6, y: 150, w: 68, h: 16 }];
    }
    update() {
      const [yr, nr] = this.rects();
      if (inp.hit('left') || inp.hit('right')) { this.yes = !this.yes; A.sfx('blip2'); }
      if (inp.mouseIn(yr)) { ui.cursor = 'hand'; if (inp.mmoved) this.yes = true; if (inp.mpressed) { inp.eat(); this.pick(true); return; } }
      if (inp.mouseIn(nr)) { ui.cursor = 'hand'; if (inp.mmoved) this.yes = false; if (inp.mpressed) { inp.eat(); this.pick(false); return; } }
      if (inp.hit('confirm') || inp.hit('interact')) { inp.eat(); this.pick(this.yes); return; }
      if (inp.hit('cancel')) { inp.eat(); this.pick(false); }
    }
    pick(yes) {
      A.sfx(yes ? 'select' : 'back');
      CH.game.pop();
      if (yes) this.onYes();
    }
    draw(g) {
      CH.menuDim(0.66);
      CH.menuPanel(W / 2 - 116, 102, 232, 80, 'NEW GAME');
      gfx.text('Start a new game?', W / 2, 120, '#f2ecd8', { align: 'center' });
      gfx.text('Your saved slots are kept.', W / 2, 134, '#b0a6c0', { align: 'center', font: 'small' });
      const [yr, nr] = this.rects();
      for (const [r, lab, on] of [[yr, 'Start', this.yes], [nr, 'Back', !this.yes]]) {
        gfx.rrect(r.x - 1, r.y - 1, r.w + 2, r.h + 2, 5, '#150f1c');
        gfx.rrect(r.x, r.y, r.w, r.h, 4, on ? '#f5d76b' : '#f3eee2');
        gfx.text(lab, r.x + r.w / 2, r.y + 4, on ? '#221a2c' : '#5a5266', { align: 'center' });
      }
    }
  }

  // route into the right scene for the saved chapter
  CH.resumeChapter = () => {
    const ch = S.chapter;
    if (ch === 'intro') CH.game.set(new CH.CabinScene({ mode: 'intro' }));
    else if (ch === 'emergency') { const c = new CH.CabinScene({ mode: 'intro' }); c.tvMode = 'static'; CH.game.set(c); c.cos = []; CH.flag('atePancakes', true); c.pancakes.st.eaten = true; c.stove.st.steam = false; c.player.x = 880; CH.beginEmergency(c); }
    else if (ch === 'hospital') CH.game.set(new CH.HospitalScene());
    else if (ch === 'jobsearch' && CH.startJobSearch) CH.startJobSearch();
    else if (ch === 'interview' && CH.startInterviewDay) CH.startInterviewDay();
    else if (ch === 'career' && CH.startCareerDay) CH.startCareerDay();
    else CH.game.set(new CH.CabinScene({ mode: 'intro' }));
  };
})(window.CH);
