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
    if (d.shown < raw.length) {
      if (d.pause > 0) { d.pause -= dt; }
      else if (!(d.opts.noSkip) && advanceKey() && d.shown > 2 && !d.opts.noSkipText) {
        // skip typing (but honor forced pauses for dramatic scenes)
        d.shown = raw.length; inp.eat();
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
          d.shown++;
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
  function choiceRects(d) {
    const n = d.choices.length;
    const w = 220, h = 13;
    const x0 = CH.W - 12 - w, y0 = BOX.y - n * (h + 2) - 6;
    return d.choices.map((c, i) => ({ x: x0, y: y0 + i * (h + 2), w, h }));
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
      const w = gfx.textWidth(ui.objective, 'small') + 24;
      gfx.rect(slide, 4, w, 11, 'rgba(0,0,0,0.7)');
      gfx.rect(slide, 4, 2, 11, pulse ? '#fff' : P.amber);
      gfx.text('★', slide + 5, 7, P.amber, { font: 'small' });
      gfx.text(ui.objective, slide + 13, 7, pulse ? '#fff' : '#e8e0c8', { font: 'small' });
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
    // dialogue
    const d = ui.dialog;
    if (d) drawDialog(g, d);
  };

  function drawDialog(g, d) {
    const b = BOX;
    const appear = Math.min(1, d.t / 0.15);
    const bh = Math.round(b.h * CH.ease.outBack(appear));
    const by = b.y + b.h - bh;
    ui.drawBox(b.x, by, b.w, bh, { border: d.opts.border || '#e6dcc4' });
    if (appear < 1) return;
    let tx = b.x + 8;
    // portrait
    const port = ui.portraits[d.opts.portrait || d.speaker];
    if (port) {
      gfx.rect(b.x + 6, b.y + 6, 28, 28, '#241c2c'); gfx.frame(b.x + 5, b.y + 5, 30, 30, '#5a4a66');
      g.save(); g.beginPath(); g.rect(b.x + 6, b.y + 6, 28, 28); g.clip();
      port(g, b.x + 20, b.y + 34, d);
      g.restore();
      tx = b.x + 42;
    }
    // speaker tag
    if (d.speaker) {
      const col = ui.speakerColors[d.speaker] || '#fff';
      const w = gfx.textWidth(d.speaker) + 8;
      gfx.rect(tx - 2, b.y - 6, w, 11, '#14101a'); gfx.frame(tx - 3, b.y - 7, w + 2, 13, col);
      gfx.text(d.speaker, tx + 2, b.y - 4, col);
    }
    // text (visible portion, strip tags)
    const vis = d.text.slice(0, d.shown).replace(/\{[a-z]+\}/g, '');
    const maxW = b.x + b.w - 8 - tx;
    const lines = gfx.wrap(d.text.replace(/\{[a-z]+\}/g, ''), maxW);
    // draw char-limited lines
    let remaining = vis.length;
    let ly = b.y + 10;
    for (const ln of lines) {
      if (remaining <= 0) break;
      const part = ln.slice(0, remaining);
      remaining -= ln.length + 1;
      let col = d.opts.color || '#f2ecd8';
      if (d.opts.shaky) { gfx.text(part, tx + CH.irand(-1, 1), ly + CH.irand(-1, 1), col); }
      else gfx.text(part, tx, ly, col);
      ly += 10;
    }
    // continue indicator
    if (d.waiting && !d.choices && d.opts.auto === undefined) {
      const bob = Math.sin(d.autoT * 6) > 0 ? 1 : 0;
      gfx.text('▼', b.x + b.w - 12, b.y + b.h - 11 + bob, '#e6dcc4');
    }
    // choices
    if (d.waiting && d.choices) {
      const rects = choiceRects(d);
      rects.forEach((r, i) => {
        const sel = i === d.choiceIdx;
        gfx.rect(r.x, r.y, r.w, r.h, sel ? '#f2e6c8' : 'rgba(16,12,22,0.92)');
        gfx.frame(r.x, r.y, r.w, r.h, sel ? '#fff' : '#8a8090');
        gfx.text((sel ? '▶ ' : '  ') + d.choices[i], r.x + 4, r.y + 3, sel ? '#1a1420' : '#e8e0d0');
      });
      if (d.timerMax) {
        const r0 = rects[0];
        const w = Math.round((r0.w) * CH.clamp(d.timer / d.timerMax, 0, 1));
        const col = d.timer < 3 ? (Math.sin(d.timer * 20) > 0 ? '#ff4040' : '#ffa0a0') : P.amber;
        gfx.rect(r0.x, r0.y - 6, r0.w, 4, '#222'); gfx.rect(r0.x, r0.y - 6, w, 4, col);
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
