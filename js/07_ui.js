// ============================================================================
// UI: dialogue, choices, HUD, toasts, cursor.  FX: fades, iris, letterbox, cards
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, P = CH.PAL;

  // ---------------------------------------------------------------- FX --------
  const fx = (CH.fx = {
    fade: 0, fadeColor: '#000', fadeTarget: 0, fadeSpeed: 0, fadeSig: null,
    flash: 0, flashColor: '#fff',
    letterbox: 0, letterboxTarget: 0,
    tint: null, // {color, alpha}
    iris: null, // {x,y,r, target, speed, sig}
    card: null, // title card {big, small, t, dur, sig, color}
    vignette: 0,
    desat: 0,
    scanlines: false,
  });
  fx.fadeOut = (dur = 0.6, color = '#000') => {
    fx.fadeColor = color; fx.fadeTarget = 1; fx.fadeSpeed = 1 / Math.max(0.01, dur); fx.fadeSig = new CH.Signal(); return fx.fadeSig;
  };
  fx.fadeIn = (dur = 0.6) => { fx.fadeTarget = 0; fx.fadeSpeed = 1 / Math.max(0.01, dur); fx.fadeSig = new CH.Signal(); return fx.fadeSig; };
  fx.setFade = (v, color) => { fx.fade = v; fx.fadeTarget = v; if (color) fx.fadeColor = color; };
  fx.doFlash = (a = 1, color = '#fff') => { fx.flash = a; fx.flashColor = color; };
  fx.irisOut = (x, y, dur = 0.8) => { fx.iris = { x, y, r: 400, target: 0, speed: 400 / dur, sig: new CH.Signal() }; return fx.iris.sig; };
  fx.irisIn = (x, y, dur = 0.8) => { fx.iris = { x, y, r: 0, target: 400, speed: 400 / dur, sig: new CH.Signal() }; return fx.iris.sig; };
  fx.showCard = (big, small = '', dur = 2.5, color = '#fff', opts = {}) => {
    fx.card = { big, small, t: 0, dur, sig: new CH.Signal(), color, bg: opts.bg, sub2: opts.sub2 };
    return fx.card.sig;
  };
  fx.update = (dt) => {
    if (fx.fade !== fx.fadeTarget) {
      fx.fade = CH.approach(fx.fade, fx.fadeTarget, fx.fadeSpeed * dt);
      if (fx.fade === fx.fadeTarget && fx.fadeSig) { fx.fadeSig.resolve(); fx.fadeSig = null; }
    }
    if (fx.flash > 0) fx.flash = Math.max(0, fx.flash - dt * 3);
    fx.letterbox = CH.approach(fx.letterbox, fx.letterboxTarget, dt * 3);
    if (fx.iris) {
      const ir = fx.iris;
      ir.r = CH.approach(ir.r, ir.target, ir.speed * dt);
      if (ir.r === ir.target) { ir.sig.resolve(); if (ir.target > 0) fx.iris = null; }
    }
    if (fx.card) { fx.card.t += dt; if (fx.card.t > fx.card.dur) { fx.card.sig.resolve(); fx.card = null; } }
    if (CH.shake.t > 0) {
      CH.shake.t -= dt;
      const a = CH.shake.amt * Math.min(1, CH.shake.t * 4);
      CH.shake.x = Math.round((Math.random() - 0.5) * 2 * a); CH.shake.y = Math.round((Math.random() - 0.5) * 2 * a);
      if (CH.shake.t <= 0) { CH.shake.amt = 0; CH.shake.x = CH.shake.y = 0; }
    }
    CH.fxParticles.update(dt);
  };
  fx.draw = (g) => {
    CH.fxParticles.draw(g);
    if (fx.tint) { g.globalAlpha = fx.tint.alpha; gfx.rect(0, 0, CH.W, CH.H, fx.tint.color); g.globalAlpha = 1; }
    if (fx.vignette > 0) {
      if (!fx._vig) {
        fx._vig = gfx.makeCanvas(CH.W, CH.H);
        const vc = fx._vig.getContext('2d'); vc.fillStyle = '#000';
        const bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
        for (let y = 0; y < CH.H; y++) for (let x = 0; x < CH.W; x++) {
          const dx = (x - CH.W / 2) / (CH.W / 2), dy = (y - CH.H / 2) / (CH.H / 2);
          const d = Math.sqrt(dx * dx + dy * dy);
          const a = CH.clamp((d - 0.92) / 0.5, 0, 1) * 0.85;
          if (a * 16 > bayer[y & 3][x & 3]) vc.fillRect(x, y, 1, 1);
        }
      }
      g.globalAlpha = fx.vignette; g.drawImage(fx._vig, 0, 0); g.globalAlpha = 1;
    }
    if (fx.letterbox > 0) {
      const h = Math.round(28 * fx.letterbox);
      gfx.rect(0, 0, CH.W, h, '#000'); gfx.rect(0, CH.H - h, CH.W, h, '#000');
    }
    if (fx.iris) {
      const ir = fx.iris;
      g.save(); g.beginPath(); g.rect(0, 0, CH.W, CH.H); g.arc(ir.x, ir.y, Math.max(0.1, ir.r), 0, Math.PI * 2, true); g.closePath(); g.fillStyle = '#000'; g.fill('evenodd'); g.restore();
    }
    if (fx.flash > 0) { g.globalAlpha = Math.min(1, fx.flash); gfx.rect(0, 0, CH.W, CH.H, fx.flashColor); g.globalAlpha = 1; }
    if (fx.fade > 0) { g.globalAlpha = fx.fade; gfx.rect(0, 0, CH.W, CH.H, fx.fadeColor); g.globalAlpha = 1; }
    if (fx.card) {
      const c = fx.card;
      const a = c.t < 0.4 ? c.t / 0.4 : c.t > c.dur - 0.5 ? Math.max(0, (c.dur - c.t) / 0.5) : 1;
      g.globalAlpha = a;
      if (c.bg) gfx.rect(0, 0, CH.W, CH.H, c.bg);
      const y = CH.H / 2 - 12;
      gfx.rect(0, y - 14, CH.W, 40 + (c.sub2 ? 10 : 0), 'rgba(0,0,0,0.75)');
      gfx.hline(0, y - 14, CH.W, c.color); gfx.hline(0, y + 25 + (c.sub2 ? 10 : 0), CH.W, c.color);
      // big text: letter-spaced by drawing twice size via scale
      g.save(); g.translate(CH.W / 2, y - 6); g.scale(2, 2);
      gfx.text(c.big, 0, 0, c.color, { align: 'center', shadow: '#000' });
      g.restore();
      if (c.small) gfx.text(c.small, CH.W / 2, y + 13, '#ddd', { align: 'center' });
      if (c.sub2) gfx.text(c.sub2, CH.W / 2, y + 23, '#aaa', { align: 'center', font: 'small' });
      g.globalAlpha = 1;
    }
    if (fx.scanlines) { g.globalAlpha = 0.12; for (let y = 0; y < CH.H; y += 2) gfx.hline(0, y, CH.W, '#000'); g.globalAlpha = 1; }
  };

  // ---------------------------------------------------------------- UI --------
  const ui = (CH.ui = {
    dialog: null, // active dialogue
    queue: [],
    toasts: [],
    objective: '', objectiveT: 0, objectiveShown: true,
    savedFlash: 0, savedLabel: '',
    cursor: 'arrow', cursorVisible: true,
    moneyFlash: 0, showMoney: false,
    hint: '', hintT: 0,
    speed: 45,
    muteFlashT: 0,
  });

  // portraits registry: name -> fn(g, x, y) draws 24x24 portrait at x,y
  ui.portraits = {};
  ui.speakerColors = { Chubby: '#7fd8c0', Mom: '#f2b0c8', Doctor: '#9fd0ff', Nurse: '#d0f0a0', Brenda: '#f7c96b', Kevin: '#c0c0c0', Dispatcher: '#ffb080', Customer: '#e0e0e0', TV: '#88ccff', 'Man Egg': '#ffd8a0', Hedgehog: '#6fa2ff' };

  // say(speaker, text, opts{auto, portrait, color, slow, shakeText, choices}) -> yieldable
  ui.say = (speaker, text, opts = {}) => {
    const sig = new CH.Signal();
    const d = { speaker, text: String(text), opts, sig, shown: 0, t: 0, done: false, pause: 0, waiting: false, choices: null, choiceIdx: 0, choiceHover: -1, autoT: 0 };
    ui.queue.push(d);
    return sig;
  };
  // choose(prompt, options[], opts{speaker}) -> yieldable value: index
  ui.choose = (speaker, text, options, opts = {}) => {
    const sig = new CH.Signal();
    const d = { speaker, text: String(text), opts, sig, shown: 0, t: 0, done: false, pause: 0, waiting: false, choices: options, choiceIdx: 0, choiceHover: -1, timer: opts.timer || 0, timerMax: opts.timer || 0 };
    ui.queue.push(d);
    return sig;
  };
  ui.busy = () => !!ui.dialog || ui.queue.length > 0;
  ui.clearDialog = () => { if (ui.dialog) ui.dialog.sig.resolve(-1); ui.dialog = null; ui.queue.forEach((d) => d.sig.resolve(-1)); ui.queue.length = 0; };
  ui.toast = (text, color = '#fff', dur = 2.5, icon) => { ui.toasts.push({ text, color, t: 0, dur, icon }); if (ui.toasts.length > 4) ui.toasts.shift(); };
  ui.setObjective = (text) => { if (ui.objective !== text) { ui.objective = text; ui.objectiveT = 0; if (text) CH.audio.sfx('notify'); } };
  ui.setHint = (text, t = 3) => { ui.hint = text; ui.hintT = t; };

  const inp = CH.input;
  function advanceKey() { return inp.hit('interact') || inp.hit('confirm') || inp.hit('jump') || inp.mpressed; }

  ui.update = (dt) => {
    if (ui.moneyFlash > 0) ui.moneyFlash -= dt;
    ui.objectiveT += dt;
    if (ui.hintT > 0) ui.hintT -= dt;
    if (ui.savedFlash > 0) ui.savedFlash -= dt;
    if (ui.muteFlashT > 0) ui.muteFlashT -= dt;
    for (const t of ui.toasts) t.t += dt;
    ui.toasts = ui.toasts.filter((t) => t.t < t.dur);
    if (inp.hit('mute') && !inp.captureText) { const m = CH.audio.toggleMute(); ui.toast(m ? 'Sound muted (M)' : 'Sound on', '#aaa', 1.5); }

    if (!ui.dialog && ui.queue.length) { ui.dialog = ui.queue.shift(); CH.audio.sfx('blip2'); }
    const d = ui.dialog;
    if (!d) return;
    d.t += dt;
    // typewriter
    const raw = d.text;
    if (d.clean === undefined) { d.clean = raw.replace(/\{[a-z]+\}/g, ''); d.cshown = 0; d.page = 0; }
    // a long line is paged rather than grown into a screen-filling bubble
    const pageEndChar = dialogPageEnd(d);
    if (d.cshown >= pageEndChar && d.cshown < d.clean.length) {
      d.waiting = true; d.autoT += dt;
      // an auto-advancing line must turn its own pages or the scene would stall
      const auto = d.opts.auto !== undefined && d.autoT >= Math.max(0.6, d.opts.auto);
      if (auto || advanceKey()) {
        d.page++; d.waiting = false; d.autoT = 0;
        if (!auto) { inp.eat(); CH.audio.sfx('blip2'); }
      }
      return;
    }
    if (d.shown < raw.length) {
      if (d.pause > 0) { d.pause -= dt; }
      else if (!(d.opts.noSkip) && advanceKey() && d.shown > 2 && !d.opts.noSkipText) {
        // skip to the end of this page, not past it
        while (d.shown < raw.length && d.cshown < pageEndChar) {
          if (raw[d.shown] === '{') { d.shown = raw.indexOf('}', d.shown) + 1; continue; }
          d.shown++; d.cshown++;
        }
        d.pause = 0;
        inp.eat();
      } else {
        const spd = (d.opts.slow ? 18 : ui.speed) * dt;
        d.acc = (d.acc || 0) + spd;
        while (d.acc >= 1 && d.shown < raw.length) {
          d.acc -= 1;
          // pause markers
          if (raw[d.shown] === '{') {
            const end = raw.indexOf('}', d.shown);
            const tag = raw.slice(d.shown + 1, end);
            d.shown = end + 1;
            if (tag === 'p') d.pause = 0.5; else if (tag === 'pp') d.pause = 1.2; else if (tag === 'ppp') d.pause = 2.5; else if (tag === 'pppp') d.pause = 4;
            break;
          }
          const ch = raw[d.shown];
          d.shown++; d.cshown++;
          if (d.cshown >= pageEndChar) { d.pause = 0; break; }
          if (ch === '.' || ch === ',' || ch === '?' || ch === '!' || ch === '…') d.pause = ch === ',' ? 0.12 : 0.28;
          if (ch !== ' ' && d.shown % 2 === 0 && d.speaker !== 'TV' && !d.opts.silent) CH.audio.sfx(d.opts.voice || 'talk');
        }
      }
      if (d.shown >= raw.length) { d.waiting = true; d.autoT = 0; }
      return;
    }
    d.waiting = true;
    d.autoT += dt;
    if (d.choices) {
      // choices navigation
      if (d.timerMax) { d.timer -= dt; if (d.timer <= 0) { finish(d, -1); return; } }
      if (inp.hit('up')) { d.choiceIdx = CH.wrap(d.choiceIdx - 1, d.choices.length); CH.audio.sfx('blip2'); }
      if (inp.hit('down')) { d.choiceIdx = CH.wrap(d.choiceIdx + 1, d.choices.length); CH.audio.sfx('blip2'); }
      // mouse hover
      const rects = choiceRects(d);
      d.choiceHover = -1;
      rects.forEach((r, i) => { if (inp.mouseIn(r)) { d.choiceHover = i; if (inp.mmoved) d.choiceIdx = i; } });
      if (inp.hit('confirm') || inp.hit('interact') || inp.hit('jump') || (inp.mpressed && d.choiceHover >= 0)) {
        finish(d, d.choiceIdx); CH.audio.sfx('select'); inp.eat();
      }
    } else {
      if (d.opts.auto !== undefined) { if (d.autoT >= d.opts.auto) finish(d, 0); }
      else if (advanceKey()) { finish(d, 0); inp.eat(); }
    }
  };
  function finish(d, v) { d.done = true; ui.dialog = null; d.sig.resolve(v); }

  const BOX = { x: 12, y: CH.H - 78, w: CH.W - 24, h: 66 };
  ui.box = BOX;
  // ---- dialogue layout -------------------------------------------------------
  // Where the speaker is standing on screen, so the bubble can point at them.
  // Read-only probing of the live scene: no scene has to opt in.
  function speakerAnchor(d) {
    if (d.opts.at) return { x: d.opts.at[0], y: d.opts.at[1] };
    if (d.opts.noAnchor) return null;
    const sc = CH.game && CH.game.scene;
    if (!sc) return null;
    const cx = (sc.cam && sc.cam.x) || 0, cy = (sc.cam && sc.cam.y) || 0;
    const name = d.speaker;
    if ((name === 'Chubby' || d.opts.player) && sc.player && !sc.player.hidden) {
      return { x: sc.player.x - cx, y: sc.player.y - cy - (sc.player.sitting ? 40 : 48) };
    }
    if (sc.speakerAt && name) {
      const at = sc.speakerAt(name);
      if (at) return { x: at.x - (at.world === false ? 0 : cx), y: at.y - (at.world === false ? 0 : cy) };
    }
    if (sc.npcs && name) {
      for (const n of sc.npcs) {
        if (n.name === name && !n.hidden) {
          const lift = n.pose === 'lying' || n.pose === 'inbed' ? 26 : 42 * (n.height || 1);
          return { x: n.x - cx, y: n.y - cy - lift };
        }
      }
    }
    return null;
  }

  // Slice wrapped lines into a page, and report how many characters of the
  // whole string are consumed by the end of it.
  function pageSlice(all, page, perPage) {
    const total = Math.max(1, Math.ceil(all.length / perPage));
    const p = CH.clamp(page, 0, total - 1);
    const from = p * perPage;
    const lines = all.slice(from, from + perPage);
    let skip = 0;
    for (let i = 0; i < from; i++) skip += all[i].length + 1;
    let end = skip;
    for (const ln of lines) end += ln.length + 1;
    return { lines, skip, end: Math.min(end, allLen(all)), more: p < total - 1, page: p, total };
  }
  function allLen(all) { let n = 0; for (const ln of all) n += ln.length + 1; return Math.max(0, n - 1); }

  // One layout used by both hit-testing and drawing, so a click always lands
  // on the option the player can see.
  function dialogLayout(d) {
    const clean = d.text.replace(/\{[a-z]+\}/g, '');
    const anchor = speakerAnchor(d);
    const L = { anchor, clean };
    if (anchor) {
      const maxW = 176;
      const all = gfx.wrap(clean, maxW);
      const page = pageSlice(all, d.page || 0, 3);
      let tw = 0;
      for (const ln of page.lines) tw = Math.max(tw, gfx.textWidth(ln));
      L.mode = 'bubble';
      L.w = CH.clamp(tw + 13, 44, maxW + 13);
      L.h = page.lines.length * 10 + 9;
      L.x = CH.clamp(Math.round(anchor.x - L.w / 2), 6, CH.W - L.w - 6);
      // keep clear of the objective banner at the top and the choice column below
      L.y = CH.clamp(Math.round(anchor.y - L.h - 9), ui.objective && ui.objectiveShown ? 23 : 14, CH.H - L.h - 44);
      L.lines = page.lines;
      L.skip = page.skip;
      L.pageEndChar = page.end;
      L.more = page.more;
      L.tx = L.x + 6;
      L.ty = L.y + 5;
      L.portrait = false;
    } else {
      const b = BOX;
      L.mode = 'panel';
      L.portrait = !!ui.portraits[d.opts.portrait || d.speaker];
      const padL = L.portrait ? 46 : 10;
      const maxTextW = b.w - padL - 10;
      const all = gfx.wrap(clean, maxTextW);
      const page = pageSlice(all, d.page || 0, 4);
      L.lines = page.lines;
      L.skip = page.skip;
      L.pageEndChar = page.end;
      L.more = page.more;
      let tw = 0;
      for (const ln of L.lines) tw = Math.max(tw, gfx.textWidth(ln));
      // grow to the text, but never shorter than the portrait needs
      L.w = CH.clamp(padL + tw + 12, L.portrait ? 150 : 90, b.w);
      L.h = Math.max(L.portrait ? 46 : 24, L.lines.length * 10 + 14);
      L.x = b.x;
      L.y = b.y + b.h - L.h;
      L.tx = L.x + padL;
      L.ty = L.y + 8;
    }
    if (d.choices) {
      const n = d.choices.length;
      const h = 14, gap = 3;
      let w = 120;
      for (const c of d.choices) w = Math.max(w, gfx.textWidth(c) + 26);
      w = Math.min(w, CH.W - 24);
      const x0 = Math.round((CH.W - w) / 2);
      const y0 = CH.H - 10 - n * (h + gap);
      L.choices = d.choices.map((c, i) => ({ x: x0, y: y0 + i * (h + gap), w, h }));
    }
    return L;
  }
  function choiceRects(d) { return dialogLayout(d).choices || []; }

  // Number of tag-stripped characters revealed by the end of the current page.
  function dialogPageEnd(d) {
    const L = dialogLayout(d);
    return L.pageEndChar;
  }

  ui.drawBox = (x, y, w, h, opts = {}) => {
    gfx.rect(x + 1, y + 1, w - 2, h - 2, opts.bg || 'rgba(16,12,22,0.92)');
    gfx.frame(x, y, w, h, opts.border || '#e6dcc4');
    gfx.frame(x + 1, y + 1, w - 2, h - 2, opts.inner || '#3a3140');
    // corner nubs
    const c = opts.border || '#e6dcc4';
    gfx.rect(x - 1, y, 1, 2, c); gfx.rect(x + w, y, 1, 2, c); gfx.rect(x - 1, y + h - 2, 1, 2, c); gfx.rect(x + w, y + h - 2, 1, 2, c);
  };

  ui.draw = (g) => {
    // toasts
    ui.toasts.forEach((t, i) => {
      const a = t.t < 0.2 ? t.t / 0.2 : t.t > t.dur - 0.4 ? (t.dur - t.t) / 0.4 : 1;
      g.globalAlpha = Math.max(0, a);
      const w = gfx.textWidth(t.text) + 12;
      const y = 30 + i * 14 - (t.t < 0.2 ? Math.round((1 - t.t / 0.2) * 6) : 0);
      gfx.rrect(CH.W / 2 - w / 2, y, w, 12, 3, 'rgba(0,0,0,0.8)');
      gfx.text(t.text, CH.W / 2, y + 3, t.color, { align: 'center' });
      g.globalAlpha = 1;
    });
    // objective
    if (ui.objective && ui.objectiveShown) {
      const slide = ui.objectiveT < 0.5 ? Math.round((1 - CH.ease.outCubic(ui.objectiveT / 0.5)) * -80) : 0;
      const pulse = ui.objectiveT < 2 ? Math.sin(ui.objectiveT * 12) > 0 : false;
      const w = gfx.textWidth(ui.objective, 'small') + 28;
      const bob = pulse ? Math.round(Math.sin(ui.objectiveT * 12)) : 0;
      gfx.rrect(slide - 5, 3, w + 5, 15, 5, CH.art.INK);
      gfx.rrect(slide - 4, 4, w + 4, 13, 4, '#2f2740');
      gfx.rrect(slide - 4, 4, w + 4, 3, 2, '#453a5e');
      gfx.rrect(slide + 1, 6, 9, 9, 3, pulse ? '#fff' : P.amber);
      gfx.text('!', slide + 5, 7 + bob, '#2a1f33', { align: 'center', font: 'small' });
      gfx.text(ui.objective, slide + 14, 7, pulse ? '#fff' : '#efe6d2', { font: 'small' });
    }
    // money
    if (ui.showMoney) {
      const s = CH.fmtMoney(CH.state.money);
      const w = gfx.textWidth(s) + 10;
      const col = ui.moneyFlash > 0 ? (Math.sin(ui.moneyFlash * 30) > 0 ? '#fff' : P.yellow) : '#b6f0a0';
      gfx.rect(CH.W - w - 4, 4, w, 12, 'rgba(0,0,0,0.7)');
      gfx.text(s, CH.W - 9, 6, col, { align: 'right' });
    }
    // hint
    if (ui.hintT > 0 && ui.hint) {
      g.globalAlpha = Math.min(1, ui.hintT);
      gfx.text(ui.hint, CH.W / 2, CH.H - 96, '#ddd', { align: 'center', outline: '#000' });
      g.globalAlpha = 1;
    }
    // autosave indicator
    if (ui.savedFlash > 0) {
      const a = CH.clamp(ui.savedFlash / 0.4, 0, 1);
      const label = ui.savedLabel || 'Saved';
      const w = gfx.textWidth(label, 'small') + 20;
      g.save(); g.globalAlpha = a;
      gfx.rrect(CH.W - w - 8, CH.H - 20, w, 13, 4, CH.art.INK);
      gfx.rrect(CH.W - w - 7, CH.H - 19, w - 2, 11, 3, '#2f9d86');
      const spin = Math.sin(CH.game.t * 6) > 0 ? 1 : 0;
      gfx.rect(CH.W - w - 1, CH.H - 16, 5, 5, '#fbf6ea');
      gfx.rect(CH.W - w, CH.H - 15 + spin, 3, 2, '#2f9d86');
      gfx.text(label, CH.W - w + 8, CH.H - 16, '#fbf6ea', { font: 'small' });
      g.restore();
    }

    // dialogue
    const d = ui.dialog;
    if (d) drawDialog(g, d);
  };

  function drawDialog(g, d) {
    const art = CH.art;
    const L = dialogLayout(d);
    const appear = CH.clamp(d.t / 0.14, 0, 1);
    const pop = CH.ease.outBack(appear);
    const revealed = (d.cshown === undefined ? d.shown : d.cshown) - (L.skip || 0);
    const col = d.opts.color || '#241c2e';

    if (L.mode === 'bubble') {
      const w = Math.max(10, Math.round(L.w * pop));
      const h = Math.max(6, Math.round(L.h * pop));
      const x = Math.round(L.x + (L.w - w) / 2);
      const y = Math.round(L.y + (L.h - h));
      const kind = d.opts.kind || (d.opts.shaky ? 'shout' : 'say');
      art.bubble(x, y, w, h, Math.round(L.anchor.x), Math.round(L.anchor.y), {
        kind, fill: d.opts.bubbleFill || '#fbf6ea',
      });
      if (appear < 0.85) return;
      // speaker tag rides the bubble's shoulder
      if (d.speaker && d.opts.tag !== false) {
        const sc = ui.speakerColors[d.speaker] || '#3a3040';
        const tw = gfx.textWidth(d.speaker, 'small') + 7;
        const tx = CH.clamp(L.x + 3, 4, CH.W - tw - 4);
        gfx.rrect(tx, L.y - 9, tw, 10, 3, art.INK);
        gfx.rrect(tx + 1, L.y - 8, tw - 2, 8, 2, sc);
        gfx.text(d.speaker, tx + 4, L.y - 6, '#fbf6ea', { font: 'small' });
      }
      let remaining = revealed, ly = L.ty;
      for (const ln of L.lines) {
        if (remaining <= 0) break;
        const part = ln.slice(0, remaining);
        remaining -= ln.length + 1;
        if (d.opts.shaky) gfx.text(part, L.tx + CH.irand(-1, 1), ly + CH.irand(-1, 1), col);
        else gfx.text(part, L.tx, ly, col);
        ly += 10;
      }
      if (d.waiting && !d.choices && d.opts.auto === undefined) {
        const bob = Math.sin(d.autoT * 6) > 0 ? 1 : 0;
        const c = L.more ? '#c8352b' : '#9a8fae';
        gfx.tri(L.x + L.w - 11, L.y + L.h - 7 + bob, L.x + L.w - 5, L.y + L.h - 7 + bob, L.x + L.w - 8, L.y + L.h - 3 + bob, c);
      }
    } else {
      const bh = Math.round(L.h * pop);
      const by = L.y + L.h - bh;
      art.bubble(L.x, by, L.w, bh, -100, -100, { fill: d.opts.bubbleFill || '#fbf6ea' });
      if (appear < 0.85) return;
      if (L.portrait) {
        const port = ui.portraits[d.opts.portrait || d.speaker];
        gfx.rrect(L.x + 5, L.y + 5, 34, L.h - 10, 4, '#2a2233');
        gfx.rrect(L.x + 6, L.y + 6, 32, L.h - 12, 3, '#3d3350');
        g.save(); g.beginPath(); g.rect(L.x + 6, L.y + 6, 32, L.h - 12); g.clip();
        port(g, L.x + 22, L.y + L.h - 12, d);
        g.restore();
      }
      if (d.speaker) {
        const sc = ui.speakerColors[d.speaker] || '#3a3040';
        const tw = gfx.textWidth(d.speaker, 'small') + 7;
        gfx.rrect(L.tx - 3, L.y - 8, tw, 11, 3, CH.art.INK);
        gfx.rrect(L.tx - 2, L.y - 7, tw - 2, 9, 2, sc);
        gfx.text(d.speaker, L.tx + 1, L.y - 5, '#fbf6ea', { font: 'small' });
      }
      let remaining = revealed, ly = L.ty;
      for (const ln of L.lines) {
        if (remaining <= 0) break;
        const part = ln.slice(0, remaining);
        remaining -= ln.length + 1;
        if (d.opts.shaky) gfx.text(part, L.tx + CH.irand(-1, 1), ly + CH.irand(-1, 1), col);
        else gfx.text(part, L.tx, ly, col);
        ly += 10;
      }
      if (d.waiting && !d.choices && d.opts.auto === undefined) {
        const bob = Math.sin(d.autoT * 6) > 0 ? 1 : 0;
        const c = L.more ? '#c8352b' : '#9a8fae';
        gfx.tri(L.x + L.w - 14, L.y + L.h - 10 + bob, L.x + L.w - 8, L.y + L.h - 10 + bob, L.x + L.w - 11, L.y + L.h - 6 + bob, c);
      }
    }

    // choices: always a column at the foot of the screen, wherever the bubble is
    if (d.waiting && d.choices && L.choices) {
      L.choices.forEach((r, i) => {
        const sel = i === d.choiceIdx;
        const slide = sel ? 2 : 0;
        gfx.rrect(r.x - 1, r.y - 1, r.w + 2, r.h + 2, 5, CH.art.INK);
        gfx.rrect(r.x, r.y, r.w, r.h, 4, sel ? '#f5d76b' : '#f3eee2');
        if (sel) gfx.rrect(r.x, r.y, r.w, 3, 2, '#fbeaa8');
        gfx.text(d.choices[i], r.x + 9 + slide, r.y + 3, sel ? '#221a2c' : '#4a4256');
        if (sel) {
          const bob = Math.sin(CH.game.t * 9) > 0 ? 1 : 0;
          gfx.tri(r.x + 3 + bob, r.y + 4, r.x + 3 + bob, r.y + 10, r.x + 7 + bob, r.y + 7, '#221a2c');
        }
      });
      if (d.timerMax) {
        const r0 = L.choices[0];
        const w = Math.round(r0.w * CH.clamp(d.timer / d.timerMax, 0, 1));
        const c = d.timer < 3 ? (Math.sin(d.timer * 20) > 0 ? '#ff4040' : '#ffa0a0') : P.amber;
        gfx.rrect(r0.x, r0.y - 8, r0.w, 5, 2, '#2a2233');
        gfx.rrect(r0.x, r0.y - 8, w, 5, 2, c);
      }
    }
  }

  // ---- cursor ---------------------------------------------------------------
  const CURSORS = {
    arrow: ['#....', '##...', '###..', '####.', '#####', '###..', '#.##.', '..##.'],
    hand: ['..##...', '..##...', '..####.', '..#####', '#.#####', '######.', '.#####.', '..###..'],
    grab: ['.......', '.#.#.#.', '#######', '#######', '.#####.', '.#####.', '..###..', '.......'],
    cross: ['..#..', '..#..', '#####', '..#..', '..#..'],
    none: [],
  };
  ui.drawCursor = (g) => {
    if (!ui.cursorVisible || inp.touch) return;
    const rows = CURSORS[ui.cursor] || CURSORS.arrow;
    if (!rows.length) return;
    const img = gfx.sprite('cursor_' + ui.cursor, rows, { '#': '#fff' });
    const outline = gfx.sprite('cursor_o_' + ui.cursor, rows, { '#': '#000' });
    const x = Math.round(inp.mx), y = Math.round(inp.my);
    const ox = ui.cursor === 'cross' ? -2 : ui.cursor === 'arrow' ? 0 : -3, oy = ui.cursor === 'cross' ? -2 : 0;
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.drawImage(outline, x + ox + dx, y + oy + dy);
    g.drawImage(img, x + ox, y + oy);
  };

  // ---- generic button helper used by minigames/phone ---------------------------
  ui.button = (g, r, label, opts = {}) => {
    const hover = inp.mouseIn(r);
    const col = opts.color || '#3b5a8f';
    gfx.rrect(r.x, r.y + 1, r.w, r.h, 2, '#000');
    gfx.rrect(r.x, r.y, r.w, r.h, 2, hover ? gfx.shade(col, 30) : col);
    gfx.rrect(r.x + 1, r.y + 1, r.w - 2, 1, 1, gfx.shade(col, 60));
    gfx.text(label, r.x + r.w / 2, r.y + Math.floor((r.h - 7) / 2), opts.textColor || '#fff', { align: 'center', font: opts.font || 'main' });
    if (hover) ui.cursor = 'hand';
    const clicked = inp.clicked(r);
    if (clicked) { CH.audio.sfx(opts.sfx || 'tap'); inp.eat(); }
    return clicked;
  };
  // progress bar
  ui.bar = (x, y, w, h, p, col = '#6fd06f', bg = '#222', border = '#000') => {
    gfx.rect(x - 1, y - 1, w + 2, h + 2, border);
    gfx.rect(x, y, w, h, bg);
    gfx.rect(x, y, Math.round(w * CH.clamp(p, 0, 1)), h, col);
  };
})(window.CH);
