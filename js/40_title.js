// ============================================================================
// TITLE SCREEN + chapter routing
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, fx = CH.fx, A = CH.audio, inp = CH.input, S = CH.state;
  const W = CH.W, H = CH.H;

  class TitleScene extends CH.Scene {
    constructor() {
      super(); this.name = 'title';
      this.snow = []; for (let i = 0; i < 90; i++) this.snow.push([Math.random() * W, Math.random() * H, 0.4 + Math.random()]);
      this.sel = 0; this.items = []; this.chubby = new CH.Chubby(120, 226); this.chubby.outfit = 'hoodie'; this.chubby.sitting = true; this.chubby.arm = 'controller'; this.chubby.face = 'happy';
      this.started = false; this.showControls = false;
    }
    enter() {
      fx.setFade(1); fx.fadeIn(1.5);
      this.items = CH.hasSave() ? ['Continue', 'New Game', 'Controls'] : ['New Game', 'Controls'];
      ui.showMoney = false; ui.objective = '';
      A.play('title', 2);
    }
    update(dt) {
      for (const s of this.snow) { s[1] += dt * 25 * s[2]; s[0] += Math.sin(this.t + s[1] * 0.05) * dt * 8; if (s[1] > H) { s[1] = -2; s[0] = Math.random() * W; } }
      this.chubby.update(dt);
      if (this.t % 4 < dt) { this.chubby.face = CH.pick(['happy', 'focused', 'normal']); }
      if (this.showControls) { if (inp.hit('cancel') || inp.hit('confirm') || inp.hit('interact') || inp.mpressed) { this.showControls = false; inp.eat(); A.sfx('back'); } return; }
      if (inp.hit('up')) { this.sel = CH.wrap(this.sel - 1, this.items.length); A.sfx('blip2'); }
      if (inp.hit('down')) { this.sel = CH.wrap(this.sel + 1, this.items.length); A.sfx('blip2'); }
      // mouse
      this.items.forEach((it, i) => { const r = this.itemRect(i); if (inp.mouseIn(r)) { ui.cursor = 'hand'; if (inp.mmoved) this.sel = i; if (inp.mpressed) { this.choose(i); inp.eat(); } } });
      if (inp.hit('confirm') || inp.hit('interact') || inp.hit('jump')) this.choose(this.sel);
    }
    itemRect(i) { return { x: W / 2 + 40, y: 150 + i * 18, w: 120, h: 14 }; }
    choose(i) {
      if (this.started) return;
      const it = this.items[i];
      A.sfx('select');
      if (it === 'Controls') { this.showControls = true; return; }
      this.started = true;
      this.run((function* (self) {
        A.stop(0.8);
        yield fx.fadeOut(1);
        if (it === 'New Game') { CH.resetState(); CH.clearSave(); CH.game.set(new CH.CabinScene({ mode: 'intro' })); }
        else { CH.load(); CH.resumeChapter(); }
      })(this));
    }
    draw(g) {
      // night forest backdrop
      gfx.vgrad(0, 0, W, H, ['#0b1030', '#141c48', '#1f2a5e', '#2a3a70']);
      for (let i = 0; i < 40; i++) gfx.px((i * 67) % W, (i * 31) % 110, i % 5 ? '#8899cc' : '#fff');
      gfx.circle(400, 50, 18, '#f4f1ea'); gfx.circle(394, 46, 16, '#141c48'); // crescent moon
      // hills and trees
      gfx.ellipse(100, 230, 160, 50, '#1a2a3a'); gfx.ellipse(380, 236, 200, 50, '#1a2a3a');
      for (let i = 0; i < 26; i++) { const tx = i * 20 - 6, th = 30 + ((i * 7) % 20); for (let k = 0; k < 3; k++) gfx.tri(tx - 10 + k * 3, 216 - k * 10, tx + 10 - k * 3, 216 - k * 10, tx, 216 - th, k % 2 ? '#122a1e' : '#0f2418'); }
      gfx.rect(0, 216, W, H - 216, '#dde6ee');
      // cabin silhouette with warm windows
      gfx.rect(60, 176, 120, 40, '#2a1a10'); gfx.tri(50, 176, 190, 176, 120, 140, '#3a2418'); gfx.rect(150, 146, 10, 20, '#3a2418');
      for (let i = 0; i < 3; i++) gfx.px(155 + (i % 2) * 2, 138 - i * 5, 'rgba(200,200,200,0.5)');
      gfx.rect(76, 186, 22, 18, '#f5c33b'); gfx.rect(130, 186, 22, 18, '#f5c33b'); gfx.rect(86, 186, 2, 18, '#2a1a10'); gfx.rect(76, 194, 22, 2, '#2a1a10'); gfx.rect(140, 186, 2, 18, '#2a1a10'); gfx.rect(130, 194, 22, 2, '#2a1a10');
      gfx.rect(106, 190, 16, 26, '#c8352b');
      g.globalAlpha = 0.12; gfx.tri(76, 216, 60, 240, 130, 240, '#f5c33b'); gfx.tri(130, 216, 120, 240, 180, 240, '#f5c33b'); g.globalAlpha = 1;
      // chubby on a snowbank with a tv glow (playing a handheld)
      this.chubby.draw(g, 0, 0);
      const glow = Math.sin(this.t * 6) > 0 ? 0.25 : 0.18; g.globalAlpha = glow; gfx.ellipse(120, 214, 22, 8, '#88ccff'); g.globalAlpha = 1;
      // logo
      const ly = 60 + Math.round(Math.sin(this.t * 1.5) * 2);
      g.save(); g.translate(W / 2 + 60, ly); g.scale(3, 3);
      gfx.text('CHUBBY', 0, 0, '#f5c33b', { align: 'center', outline: '#5a3a1a' });
      g.restore();
      g.save(); g.translate(W / 2 + 60, ly + 30); g.scale(1.5, 1.5);
      gfx.text('THE PORCUPINE', 0, 0, '#fff', { align: 'center', outline: '#2a3a70' });
      g.restore();
      gfx.text('a life & job simulator', W / 2 + 60, ly + 48, '#aab8dd', { align: 'center', font: 'small' });
      // quills on logo
      for (let i = 0; i < 7; i++) { const x = W / 2 - 10 + i * 20, y = ly - 14; gfx.line(x, y + 6, x - 4 + (i % 2) * 8, y - 4, '#ead9b0'); gfx.px(x - 4 + (i % 2) * 8, y - 4, '#3a2a1c'); }
      // menu
      this.items.forEach((it, i) => {
        const r = this.itemRect(i); const sel = i === this.sel;
        if (sel) gfx.rrect(r.x - 4, r.y - 1, r.w + 8, r.h + 2, 3, 'rgba(255,255,255,0.12)');
        gfx.text((sel ? '▶ ' : '  ') + it, r.x, r.y + 3, sel ? '#fff' : '#aab8dd', { outline: sel ? '#2a3a70' : undefined });
      });
      // snow
      for (const s of this.snow) gfx.px(s[0], s[1], s[2] > 1 ? '#fff' : 'rgba(255,255,255,0.6)');
      gfx.text('M: mute   -   Arrow keys / WASD, E, Space, Enter, mouse', W / 2, H - 10, '#7a88aa', { align: 'center', font: 'small' });
      if (this.showControls) {
        g.globalAlpha = 0.85; gfx.rect(0, 0, W, H, '#000'); g.globalAlpha = 1;
        ui.drawBox(60, 30, W - 120, H - 60);
        const L = ['MOVE            Arrow keys / WASD', 'INTERACT        E  (or Enter)', 'HOP / JUMP      Space or Z', 'DOUBLE JUMP     Jump again in the air (Blue Hedgehog)', 'MINIGAMES       Mouse: click, drag, hold', 'PHONE           I  (once you have one)', 'MUTE            M', 'MENU / BACK     Esc', '', 'Everything in the cabin can be poked at. Poke everything.'];
        gfx.text('CONTROLS', W / 2, 40, '#f5c33b', { align: 'center' });
        L.forEach((l, i) => gfx.text(l, 80, 56 + i * 12, i === L.length - 1 ? '#aab8dd' : '#fff'));
        gfx.text('Press any key to return', W / 2, H - 44, '#aaa', { align: 'center', font: 'small' });
      }
    }
  }
  CH.TitleScene = TitleScene;

  // route into the right scene for the saved chapter
  CH.resumeChapter = () => {
    const ch = S.chapter;
    if (ch === 'intro') CH.game.set(new CH.CabinScene({ mode: 'intro' }));
    else if (ch === 'emergency') { const c = new CH.CabinScene({ mode: 'intro' }); c.tvMode = 'static'; CH.game.set(c); c.cos = []; CH.flag('atePancakes', true); c.pancakes.st.eaten = true; c.stove.st.steam = false; c.player.x = 880; CH.beginEmergency(c); }
    else if (ch === 'hospital') CH.game.set(new CH.AmbulanceScene());
    else if (ch === 'jobsearch' && CH.startJobSearch) CH.startJobSearch();
    else if (ch === 'interview' && CH.startInterviewDay) CH.startInterviewDay();
    else if (ch === 'career' && CH.startCareerDay) CH.startCareerDay();
    else CH.game.set(new CH.CabinScene({ mode: 'intro' }));
  };
})(window.CH);
