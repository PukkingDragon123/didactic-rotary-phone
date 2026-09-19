// ============================================================================
// MENUS - pause, save slots, load, controls. Shared by the title and the game.
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, art = CH.art, A = CH.audio, inp = CH.input;
  const W = CH.W, H = CH.H;

  const INK = '#150f1c';
  const PAPER = '#f3eee2';
  const PAPER_HI = '#f5d76b';

  // ---- a keyboard + mouse menu column ---------------------------------------
  class MenuList {
    constructor(items, opts = {}) {
      this.items = items;          // [{label, hint, disabled, action}]
      this.sel = opts.sel || 0;
      this.x = opts.x || 0; this.y = opts.y || 0;
      this.w = opts.w || 150; this.h = opts.h || 16; this.gap = opts.gap || 4;
      this.align = opts.align || 'left';
      this.onPick = opts.onPick || null;
      this.t = 0;
      this.skipDisabled(1);
    }
    skipDisabled(dir) {
      let guard = 0;
      while (this.items[this.sel] && this.items[this.sel].disabled && guard++ < this.items.length) {
        this.sel = CH.wrap(this.sel + dir, this.items.length);
      }
    }
    rect(i) { return { x: this.x, y: this.y + i * (this.h + this.gap), w: this.w, h: this.h }; }
    move(dir) {
      this.sel = CH.wrap(this.sel + dir, this.items.length);
      this.skipDisabled(dir);
      A.sfx('blip2');
    }
    update(dt) {
      this.t += dt;
      if (inp.hit('up')) this.move(-1);
      if (inp.hit('down')) this.move(1);
      this.items.forEach((it, i) => {
        if (it.disabled) return;
        const r = this.rect(i);
        if (inp.mouseIn(r)) {
          ui.cursor = 'hand';
          if (inp.mmoved && this.sel !== i) { this.sel = i; A.sfx('blip2'); }
          if (inp.mpressed) { inp.eat(); this.pick(); }
        }
      });
      if (inp.hit('confirm') || inp.hit('interact') || inp.hit('jump')) { inp.eat(); this.pick(); }
    }
    pick() {
      const it = this.items[this.sel];
      if (!it || it.disabled) { A.sfx('error'); return; }
      A.sfx('select');
      if (it.action) it.action();
      if (this.onPick) this.onPick(this.sel, it);
    }
    draw() {
      this.items.forEach((it, i) => {
        const r = this.rect(i);
        const sel = i === this.sel && !it.disabled;
        const nudge = sel ? Math.round(Math.sin(this.t * 6) * 0.5 + 1) : 0;
        gfx.rrect(r.x - 1 + nudge, r.y - 1, r.w + 2, r.h + 2, 5, INK);
        gfx.rrect(r.x + nudge, r.y, r.w, r.h, 4, it.disabled ? '#b9b2ad' : sel ? PAPER_HI : PAPER);
        if (sel) gfx.rrect(r.x + nudge, r.y, r.w, 3, 2, '#fbeaa8');
        const tc = it.disabled ? '#7c766f' : sel ? '#221a2c' : '#4a4256';
        gfx.text(it.label, r.x + 12 + nudge, r.y + 4, tc);
        if (it.hint) gfx.text(it.hint, r.x + r.w - 6 + nudge, r.y + 5, it.disabled ? '#8a847c' : '#7a7080', { align: 'right', font: 'small' });
        if (sel) {
          const bob = Math.sin(this.t * 9) > 0 ? 1 : 0;
          gfx.tri(r.x + 4 + bob + nudge, r.y + 4, r.x + 4 + bob + nudge, r.y + r.h - 4, r.x + 8 + bob + nudge, r.y + r.h / 2, '#221a2c');
        }
      });
    }
  }
  CH.MenuList = MenuList;

  // ---- shared chrome ----------------------------------------------------------
  function dim(alpha = 0.62) {
    const g = CH.g;
    g.save(); g.globalAlpha = alpha; gfx.rect(0, 0, W, H, '#0a0710'); g.restore();
  }
  function panel(x, y, w, h, title) {
    gfx.rrect(x - 2, y - 2, w + 4, h + 4, 8, INK);
    gfx.rrect(x, y, w, h, 6, '#2b2336');
    gfx.rrect(x + 2, y + 2, w - 4, h - 4, 5, '#372c46');
    gfx.rrect(x + 2, y + 2, w - 4, 2, 1, '#4b3d5e');
    if (title) {
      const tw = gfx.textWidth(title) + 16;
      const tx = Math.round(x + (w - tw) / 2);
      gfx.rrect(tx - 1, y - 8, tw + 2, 15, 5, INK);
      gfx.rrect(tx, y - 7, tw, 13, 4, PAPER_HI);
      gfx.text(title, tx + 8, y - 4, '#221a2c');
    }
  }
  CH.menuPanel = panel;
  CH.menuDim = dim;

  // A pill behind the hint so it never collides with whatever the scene
  // underneath is printing in the same spot.
  function footer(text) {
    const w = gfx.textWidth(text, 'small') + 16;
    const x = Math.round((W - w) / 2);
    gfx.rrect(x, H - 15, w, 12, 4, 'rgba(12,8,18,0.9)');
    gfx.text(text, W / 2, H - 11, '#b9b0c4', { align: 'center', font: 'small' });
  }

  // ---- save slot card ---------------------------------------------------------
  function timeAgo(ms) {
    if (!ms) return '';
    const s = Math.max(0, (Date.now() - ms) / 1000);
    if (s < 90) return 'just now';
    if (s < 3600) return Math.round(s / 60) + ' min ago';
    if (s < 86400) return Math.round(s / 3600) + ' hr ago';
    const d = Math.round(s / 86400);
    return d + (d === 1 ? ' day ago' : ' days ago');
  }
  CH.timeAgo = timeAgo;

  const CHAPTER_NAME = {
    intro: 'Morning at the cabin', game: 'At home', emergency: 'The emergency',
    hospital: 'At the hospital', jobsearch: 'Looking for work',
    interview: 'Interview day', career: 'Working at Donald’s',
  };

  function drawSlotCard(n, x, y, w, h, sel, info) {
    gfx.rrect(x - 1, y - 1, w + 2, h + 2, 6, INK);
    gfx.rrect(x, y, w, h, 5, sel ? '#4a3c5e' : '#312840');
    if (sel) gfx.rrect(x, y, w, 2, 1, PAPER_HI);
    const label = n === 0 ? 'AUTOSAVE' : 'SLOT ' + n;
    gfx.text(label, x + 6, y + 5, sel ? PAPER_HI : '#9a90ac', { font: 'small' });
    if (!info) {
      gfx.text('- empty -', x + 6, y + 16, '#6f6880');
      return;
    }
    // a thumbnail of Chubby in the outfit he was wearing
    const g = CH.g;
    g.save();
    g.beginPath(); g.rect(x + w - 34, y + 2, 32, h - 4); g.clip();
    g.translate(x + w - 18, y + h - 3);
    g.scale(0.62, 0.62);
    CH.drawChubby(g, 0, 0, { outfit: info.outfit, face: info.momHome ? 'happy' : 'normal', noShadow: true, arm: 'pocket' });
    g.restore();
    gfx.text('Day ' + info.day + '  ' + CH.timeStr(info.hour), x + 6, y + 15, '#f2ecd8');
    gfx.text(info.job, x + 6, y + 26, '#c9bfd8', { font: 'small' });
    gfx.text(CH.fmtMoney(info.money), x + 6, y + 34, '#8bd06a', { font: 'small' });
    const ch = CHAPTER_NAME[info.chapter] || info.chapter;
    gfx.text(ch, x + 64, y + 26, '#9a90ac', { font: 'small' });
    gfx.text(timeAgo(info.savedAt), x + 64, y + 34, '#7a7288', { font: 'small' });
  }

  // ---- save / load menu -------------------------------------------------------
  class SaveMenuScene extends CH.Scene {
    constructor(mode, onDone) {
      super();
      this.name = 'savemenu'; this.overlay = true;
      this.mode = mode; // 'save' | 'load'
      this.onDone = onDone || (() => {});
      this.sel = 0;
      this.confirm = null;
      this.flash = 0;
      this.refresh();
    }
    refresh() { this.infos = CH.SLOTS.map((n) => CH.slotInfo(n)); }
    rect(i) { return { x: 62, y: 52 + i * 42, w: 356, h: 38 }; }
    update(dt) {
      if (this.flash > 0) this.flash -= dt;
      if (this.confirm) {
        if (inp.hit('left') || inp.hit('right')) { this.confirm.yes = !this.confirm.yes; A.sfx('blip2'); }
        const yr = { x: W / 2 - 74, y: 156, w: 68, h: 16 }, nr = { x: W / 2 + 6, y: 156, w: 68, h: 16 };
        if (inp.mouseIn(yr)) { ui.cursor = 'hand'; if (inp.mmoved) this.confirm.yes = true; if (inp.mpressed) { inp.eat(); this.resolveConfirm(true); return; } }
        if (inp.mouseIn(nr)) { ui.cursor = 'hand'; if (inp.mmoved) this.confirm.yes = false; if (inp.mpressed) { inp.eat(); this.resolveConfirm(false); return; } }
        if (inp.hit('confirm') || inp.hit('interact')) { inp.eat(); this.resolveConfirm(this.confirm.yes); return; }
        if (inp.hit('cancel')) { inp.eat(); A.sfx('back'); this.confirm = null; }
        return;
      }
      if (inp.hit('up')) { this.sel = CH.wrap(this.sel - 1, 4); A.sfx('blip2'); }
      if (inp.hit('down')) { this.sel = CH.wrap(this.sel + 1, 4); A.sfx('blip2'); }
      for (let i = 0; i < 4; i++) {
        if (inp.mouseIn(this.rect(i))) {
          ui.cursor = 'hand';
          if (inp.mmoved && this.sel !== i) { this.sel = i; A.sfx('blip2'); }
          if (inp.mpressed) { inp.eat(); this.activate(); return; }
        }
      }
      if (inp.hit('confirm') || inp.hit('interact') || inp.hit('jump')) { inp.eat(); this.activate(); return; }
      if (inp.hit('cancel')) { inp.eat(); A.sfx('back'); this.close(); }
    }
    close() { CH.game.pop(); this.onDone(); }
    activate() {
      const n = this.sel;
      if (this.mode === 'save') {
        if (n === 0) { A.sfx('error'); ui.toast('Slot 0 is the autosave', '#ffb0a0', 2); return; }
        if (this.infos[n]) { this.confirm = { kind: 'overwrite', slot: n, yes: false }; A.sfx('blip'); return; }
        this.doSave(n);
      } else {
        if (!this.infos[n]) { A.sfx('error'); return; }
        this.confirm = { kind: 'load', slot: n, yes: true }; A.sfx('blip');
      }
    }
    resolveConfirm(yes) {
      const c = this.confirm;
      this.confirm = null;
      if (!yes) { A.sfx('back'); return; }
      if (c.kind === 'overwrite') this.doSave(c.slot);
      else this.doLoad(c.slot);
    }
    doSave(n) {
      if (CH.saveTo(n)) { A.sfx('cash'); this.flash = 1; this.refresh(); ui.toast('Saved to slot ' + n, '#8bd06a', 2); }
      else { A.sfx('error'); ui.toast('Could not save (storage blocked)', '#ff8080', 3); }
    }
    doLoad(n) {
      if (!CH.loadFrom(n)) { A.sfx('error'); return; }
      A.sfx('cash');
      // unwind every scene, including whatever pushed this menu
      CH.ui.clearDialog();
      CH.game.runGlobal((function* () {
        yield CH.fx.fadeOut(0.5);
        CH.resumeChapter();
        yield CH.fx.fadeIn(0.6);
      })());
    }
    draw(g) {
      dim(0.7);
      panel(48, 26, 384, 214, this.mode === 'save' ? 'SAVE GAME' : 'LOAD GAME');
      for (let i = 0; i < 4; i++) {
        const r = this.rect(i);
        drawSlotCard(i, r.x, r.y, r.w, r.h, i === this.sel && !this.confirm, this.infos[i]);
      }
      if (this.flash > 0) {
        const a = CH.clamp(this.flash, 0, 1);
        g.save(); g.globalAlpha = a * 0.5; gfx.rect(0, 0, W, H, '#f5d76b'); g.restore();
      }
      footer(this.mode === 'save' ? 'Enter: save    Esc: back' : 'Enter: load    Esc: back');
      if (this.confirm) {
        dim(0.5);
        const c = this.confirm;
        panel(W / 2 - 110, 108, 220, 78);
        const msg = c.kind === 'overwrite'
          ? 'Overwrite slot ' + c.slot + '?'
          : 'Load slot ' + (c.slot === 0 ? 'autosave' : c.slot) + '?';
        gfx.text(msg, W / 2, 124, '#f2ecd8', { align: 'center' });
        gfx.text(c.kind === 'load' ? 'Unsaved progress will be lost.' : 'The old save will be replaced.', W / 2, 138, '#b0a6c0', { align: 'center', font: 'small' });
        const yr = { x: W / 2 - 74, y: 156, w: 68, h: 16 }, nr = { x: W / 2 + 6, y: 156, w: 68, h: 16 };
        for (const [r, lab, on] of [[yr, 'Yes', c.yes], [nr, 'No', !c.yes]]) {
          gfx.rrect(r.x - 1, r.y - 1, r.w + 2, r.h + 2, 5, INK);
          gfx.rrect(r.x, r.y, r.w, r.h, 4, on ? PAPER_HI : PAPER);
          gfx.text(lab, r.x + r.w / 2, r.y + 4, on ? '#221a2c' : '#5a5266', { align: 'center' });
        }
      }
    }
  }
  CH.SaveMenuScene = SaveMenuScene;

  // ---- controls ---------------------------------------------------------------
  const CONTROL_ROWS = [
    ['Move', 'Arrow keys  /  A D'],
    ['Jump', 'Space  /  Z'],
    ['Interact, talk, advance', 'E  /  Enter'],
    ['Open phone', 'I'],
    ['Pause menu', 'Esc  /  P'],
    ['Mute sound', 'M'],
    ['Minigames', 'Mouse - click and drag'],
  ];
  class ControlsScene extends CH.Scene {
    constructor(onDone) { super(); this.name = 'controls'; this.overlay = true; this.onDone = onDone || (() => {}); }
    update() {
      if (inp.hit('cancel') || inp.hit('confirm') || inp.hit('interact') || inp.hit('jump') || inp.mpressed) {
        inp.eat(); A.sfx('back'); CH.game.pop(); this.onDone();
      }
    }
    draw(g) {
      dim(0.72);
      panel(60, 34, 360, 196, 'CONTROLS');
      CONTROL_ROWS.forEach((row, i) => {
        const y = 58 + i * 21;
        gfx.rrect(74, y - 3, 332, 18, 4, i % 2 ? '#352b44' : '#3d3250');
        gfx.text(row[0], 84, y + 2, '#f2ecd8');
        gfx.text(row[1], 396, y + 2, PAPER_HI, { align: 'right' });
      });
      gfx.text('The game autosaves when you wake up and after every shift.', W / 2, 210, '#b0a6c0', { align: 'center', font: 'small' });
      footer('Any key to go back');
    }
  }
  CH.ControlsScene = ControlsScene;

  // ---- pause ------------------------------------------------------------------
  class PauseScene extends CH.Scene {
    constructor() {
      super(); this.name = 'pause'; this.overlay = true;
      const S = CH.state;
      this.menu = new MenuList([
        { label: 'Resume', action: () => this.close() },
        { label: 'Save Game', action: () => CH.game.push(new SaveMenuScene('save')) },
        { label: 'Load Game', disabled: !CH.anySave(), action: () => CH.game.push(new SaveMenuScene('load')) },
        { label: 'Controls', action: () => CH.game.push(new ControlsScene()) },
        { label: 'Quit to Title', action: () => this.quit() },
      ], { x: W / 2 - 78, y: 92, w: 156, h: 18, gap: 5 });
      this.snapshot = { day: S.day, hour: S.hour, money: S.money, job: S.job };
    }
    enter() { CH.audio.duck && CH.audio.duck(0.4); }
    exit() { CH.audio.duck && CH.audio.duck(1); }
    update(dt) {
      this.menu.update(dt);
      if (inp.hit('cancel') || inp.hit('pause')) { inp.eat(); A.sfx('back'); this.close(); }
    }
    close() { if (CH.game.scene === this) CH.game.pop(); }
    quit() {
      CH.autosave('Saved');
      CH.ui.clearDialog();
      CH.game.runGlobal((function* () {
        yield CH.fx.fadeOut(0.6);
        CH.game.set(new CH.TitleScene());
        yield CH.fx.fadeIn(0.8);
      })());
    }
    draw(g) {
      dim(0.6);
      panel(W / 2 - 100, 48, 200, 148, 'PAUSED');
      const S = CH.state;
      gfx.text('Day ' + S.day + '  -  ' + CH.timeStr(S.hour), W / 2, 66, '#c9bfd8', { align: 'center', font: 'small' });
      const job = S.job && CH.JOB_INFO[S.job] ? CH.JOB_INFO[S.job].title : 'Unemployed';
      gfx.text(job + '   ' + CH.fmtMoney(S.money), W / 2, 76, '#8bd06a', { align: 'center', font: 'small' });
      this.menu.draw();
      footer('Esc: resume');
    }
  }
  CH.PauseScene = PauseScene;

  CH.openPause = () => {
    if (!CH.TitleScene) return;
    const sc = CH.game.scene;
    if (!sc || sc.name === 'pause' || sc.name === 'savemenu' || sc.name === 'controls' || sc.name === 'title') return;
    A.sfx('blip');
    CH.game.push(new PauseScene());
  };
})(window.CH);
