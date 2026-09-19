// ============================================================================
// SMARTPHONE: a full interactive pixel phone (browser, jobs, mail, texts...)
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, fx = CH.fx, A = CH.audio, inp = CH.input, S = CH.state;
  const W = CH.W, H = CH.H;
  const PW = 152, PH = 262, PX = Math.round(W / 2 - PW / 2), PY = 4; // phone body
  const SX = PX + 7, SY = PY + 14, SW = PW - 14, SH = PH - 28; // screen
  const STATUS_H = 9, NAV_H = 10;

  // ---- phone data (persisted in state) --------------------------------------------------------
  const PD = () => { if (!S.phone) S.phone = { mail: [], texts: {}, notifs: [], history: [], drafts: {}, resumeFixed: false, applications: {}, scam: false, unreadMail: 0, unreadTexts: 0, bankTx: [['Blue Volt Energy x12', -38.88], ['Pancake mix (for Mom)', -4.99], ['Blue Hedgehog Kart DLC', -7.99], ['Moose Hollow Hydro', -84.2], ['Birthday money from Mom', 20]] }; return S.phone; };
  CH.phoneData = PD;
  CH.sendMail = (m) => { const d = PD(); m.t = 0; m.read = false; m.id = Math.random().toString(36).slice(2); d.mail.unshift(m); d.unreadMail++; CH.phoneNotify('Mail', m.subject, m.from); return m; };
  CH.sendText = (who, text, fromThem = true) => { const d = PD(); if (!d.texts[who]) d.texts[who] = []; d.texts[who].push({ text, them: fromThem, read: !fromThem }); if (fromThem) { d.unreadTexts++; CH.phoneNotify('Messages', text, who); } };
  CH.phoneNotify = (app, text, from) => { const d = PD(); d.notifs.unshift({ app, text, from, t: 0 }); if (d.notifs.length > 8) d.notifs.pop(); A.sfx('notify'); if (CH.game.scene && CH.game.scene.name !== 'phone') ui.toast(`${from}: ${text.slice(0, 40)}${text.length > 40 ? '…' : ''}`, app === 'Mail' ? '#9fdcff' : '#8bd06a', 3.5); CH.phonePending = true; };

  // ---- scheduled job responses (processed by any world scene via CH.tickPhone) -----------------
  CH.tickPhone = (dt) => {
    const d = PD();
    for (const id in d.applications) {
      const ap = d.applications[id];
      if (ap.status === 'pending') {
        ap.timer -= dt;
        if (ap.timer <= 0) {
          const job = CH.jobById(id);
          ap.status = job.response.type;
          const r = job.response;
          let text = r.text;
          if (ap.wrongFile) text = text.replace(/\n\n- /, `\n\nAlso, you attached "${ap.wrongFile}" as your resume.\n\n- `);
          CH.sendMail({ from: r.from, subject: r.subject, text, job: id, kind: r.type });
          if (r.type === 'interview') { CH.flag('gotInterview', true); }
          S.applied[id] = r.type;
        }
      }
    }
    // nudge toward Donald's
    const rejected = Object.values(d.applications).filter((a) => a.status === 'reject').length;
    if (rejected >= 2 && !d.applications.donalds && !CH.flag('brendaNudge')) {
      CH.flag('brendaNudge', true);
      CH.sendText('Unknown Number', "hi this is Brenda from Donald's Burgers on Main. saw ur profile on Indeedly. we are HIRING. like right now. apply pls. the floor is sticky. - B");
    }
    if (rejected >= 4 && !d.applications.donalds && !CH.flag('brendaNudge2')) {
      CH.flag('brendaNudge2', true);
      CH.sendText('Unknown Number', "it's Brenda again. Kevin quit. I'm holding a mop right now. i am the manager. APPLY. Donald's Burgers. Indeedly. big D not M.");
    }
  };

  // ---- Phone scene ----------------------------------------------------------------------------------
  class PhoneScene extends CH.Scene {
    constructor(opts = {}) {
      super(); this.overlay = true; this.name = 'phone';
      this.app = null; this.appStack = [];
      this.slide = 0; // open animation
      this.focus = null; this.fields = {};
      this.scroll = {}; this.dragging = null;
      this.banner = null; this.bannerT = 0;
      this.mode = opts.mode || 'free';
      this.closing = false;
      this.keyboardShown = false;
      this.local = { x: 0, y: 0 };
      this.captcha = null;
    }
    enter() { A.sfx('swipe'); this.slide = 0; ui.cursorVisible = true; if (S.chapter === 'jobsearch') A.play('phone', 1); CH.phonePending = false; }
    exit() { inp.captureText = false; }
    // ---- navigation ----
    open(app, state = {}) { if (this.app) this.appStack.push(this.app); this.app = { name: app, state, scroll: 0 }; this.focus = null; this.keyboardShown = false; A.sfx('tap'); }
    back() { if (this.appStack.length) { this.app = this.appStack.pop(); this.focus = null; this.keyboardShown = false; A.sfx('back'); } else this.home(); }
    home() { this.app = null; this.appStack = []; this.focus = null; this.keyboardShown = false; A.sfx('back'); }
    close() { if (this.closing) return; this.closing = true; A.sfx('swipe'); this.run((function* (self) { yield 0.15; CH.game.pop(); if (self.onClose) self.onClose(); })(this)); }
    // ---- update ----
    update(dt) {
      this.slide = Math.min(1, this.slide + dt * 5);
      this.local.x = inp.mx - SX; this.local.y = inp.my - SY - STATUS_H;
      this.hovering = inp.mouseIn({ x: SX, y: SY, w: SW, h: SH });
      const d = PD();
      for (const n of d.notifs) n.t += dt;
      if (this.banner) { this.bannerT += dt; if (this.bannerT > 3.5) this.banner = null; }
      // new notif → banner
      if (d.notifs.length && d.notifs[0].t < dt * 2 && !this.banner) { this.banner = d.notifs[0]; this.bannerT = 0; }
      // physical typing into focused field
      if (this.focus && inp.typed) {
        for (const ch of inp.typed) {
          if (ch === '\b') this.fields[this.focus] = (this.fields[this.focus] || '').slice(0, -1);
          else if (ch === '\n') { this.enterPressed = true; }
          else if ((this.fields[this.focus] || '').length < 60) this.fields[this.focus] = (this.fields[this.focus] || '') + ch;
          A.sfx('key');
        }
        inp.typed = '';
      }
      inp.captureText = !!this.focus;
      if (inp.hit('cancel') || (inp.hit('phone') && !this.focus)) { if (this.app || this.focus) { if (this.focus) { this.focus = null; this.keyboardShown = false; } else this.back(); } else this.close(); inp.eat(); }
      // wheel scroll
      if (this.hovering && inp.wheel && this.app) { this.app.scroll = Math.max(0, this.app.scroll + inp.wheel * 14); A.sfx('swipe'); }
      // drag scroll
      if (this.hovering && inp.mpressed && this.app && !this.keyboardShown) { this.dragging = { y: inp.my, s: this.app.scroll, moved: false }; }
      if (this.dragging) {
        if (inp.mdown) { const dy = this.dragging.y - inp.my; if (Math.abs(dy) > 4) this.dragging.moved = true; if (this.dragging.moved) this.app.scroll = Math.max(0, this.dragging.s + dy); }
        else this.dragging = null;
      }
      if (this.app) this.app.scroll = Math.max(0, Math.min(this.app.scroll, Math.max(0, (this.app.contentH || 0) - (SH - STATUS_H - NAV_H) + 4)));
      CH.tickPhone(dt);
      this.t2 = (this.t2 || 0) + dt;
    }
    // did the user click (not drag) at local coords rect?
    clicked(r) { return inp.mpressed && this.hovering && CH.pointIn(this.local.x, this.local.y + (this.app ? this.app.scroll : 0) - (r.noScroll ? (this.app ? this.app.scroll : 0) : 0), r) && !(this.dragging && this.dragging.moved); }
    hover(r) { return this.hovering && CH.pointIn(this.local.x, this.local.y + (this.app ? this.app.scroll : 0) - (r.noScroll ? (this.app ? this.app.scroll : 0) : 0), r); }
    // ---- draw ----
    draw(g) {
      const k = CH.ease.outBack(this.slide);
      const oy = Math.round((1 - k) * 200);
      g.globalAlpha = 0.5 * this.slide; gfx.rect(0, 0, W, H, '#000'); g.globalAlpha = 1;
      g.save(); g.translate(0, oy);
      // Chubby's paws holding the phone
      gfx.ellipse(PX - 6, PY + PH - 30, 14, 10, '#8a5a3b'); gfx.ellipse(PX + PW + 6, PY + PH - 30, 14, 10, '#8a5a3b');
      gfx.ellipse(PX - 2, PY + PH - 44, 5, 8, '#8a5a3b'); gfx.ellipse(PX + PW + 2, PY + PH - 44, 5, 8, '#8a5a3b');
      // body
      gfx.rrect(PX - 1, PY - 1, PW + 2, PH + 2, 10, '#0a0a10'); gfx.rrect(PX, PY, PW, PH, 9, '#1c1c26'); gfx.rrect(PX + 1, PY + 1, PW - 2, 1, 1, '#3a3a4a');
      gfx.rect(PX + PW, PY + 60, 1, 22, '#3a3a4a'); gfx.rect(PX - 1, PY + 50, 1, 12, '#3a3a4a'); gfx.rect(PX - 1, PY + 66, 1, 12, '#3a3a4a'); // buttons
      gfx.rect(PX + PW / 2 - 12, PY + 6, 24, 4, '#0a0a10'); gfx.px(PX + PW / 2 + 6, PY + 8, '#223'); // notch + camera
      // screen
      gfx.rrect(SX, SY, SW, SH, 4, '#000');
      gfx.clip(SX, SY, SW, SH);
      this.drawScreen(g);
      gfx.unclip();
      // screen glass reflection
      g.globalAlpha = 0.06; gfx.rect(SX + 4, SY + 6, 10, SH - 12, '#fff'); g.globalAlpha = 1;
      g.restore();
      if (this.mode !== 'locked') gfx.text('I / Esc: put phone away', W / 2, H - 6, '#777', { align: 'center', font: 'small' });
    }
    drawScreen(g) {
      const d = PD();
      // wallpaper
      const home = !this.app;
      if (home) {
        gfx.vgrad(SX, SY, SW, SH, ['#1a3a6a', '#24508a', '#2f6aa8', '#3a86c8']);
        // wallpaper: pixel forest + hedgehog
        for (let i = 0; i < 9; i++) { const tx = SX + 6 + i * 16, th = 24 + ((i * 7) % 16); gfx.tri(tx - 7, SY + SH - 40, tx + 7, SY + SH - 40, tx, SY + SH - 40 - th, '#1a4a5a'); }
        gfx.rect(SX, SY + SH - 40, SW, 40, '#153a4a');
        g.save(); g.translate(SX + SW / 2, SY + SH - 44); g.scale(1.2, 1.2); CH.drawHedgehog(g, 0, 0, { state: 'idle' }); g.restore();
      } else gfx.rect(SX, SY, SW, SH, '#f2f4f8');
      // status bar
      gfx.rect(SX, SY, SW, STATUS_H, home ? 'rgba(0,0,0,0.25)' : '#e6e9f0');
      const sc = home ? '#fff' : '#333';
      gfx.text(CH.timeStr(), SX + 4, SY + 2, sc, { font: 'small' });
      for (let i = 0; i < 4; i++) gfx.rect(SX + SW - 40 + i * 3, SY + 6 - i, 2, 1 + i, i < 3 ? sc : home ? 'rgba(255,255,255,0.4)' : '#bbb');
      gfx.rect(SX + SW - 22, SY + 2, 16, 5, sc); gfx.rect(SX + SW - 21, SY + 3, Math.round(14 * (0.4 + 0.5 * Math.sin(this.t * 0.01 + 1) * 0.5 + 0.25)), 3, home ? '#4f4' : '#3a9a5a'); gfx.rect(SX + SW - 6, SY + 3, 1, 3, sc);
      // content region
      const cx = SX, cy = SY + STATUS_H, cw = SW, ch = SH - STATUS_H - NAV_H;
      gfx.clip(cx, cy, cw, ch);
      g.save(); g.translate(cx, cy);
      if (home) this.drawHome(g, cw, ch);
      else {
        g.save(); g.translate(0, -this.app.scroll);
        this.drawApp(g, cw, ch);
        g.restore();
        // scrollbar
        if ((this.app.contentH || 0) > ch) { const sbH = Math.max(8, ch * ch / this.app.contentH); const sbY = (this.app.scroll / (this.app.contentH - ch)) * (ch - sbH); gfx.rect(cw - 2, sbY, 2, sbH, 'rgba(0,0,0,0.3)'); }
      }
      g.restore();
      gfx.unclip();
      // keyboard
      if (this.keyboardShown && this.focus) this.drawKeyboard(g);
      // nav bar
      const ny = SY + SH - NAV_H;
      gfx.rect(SX, ny, SW, NAV_H, home ? 'rgba(0,0,0,0.25)' : '#e6e9f0');
      const navc = home ? '#fff' : '#555';
      // back, home, apps
      const rb = { x: SX + 20, y: ny + 1, w: 16, h: 8 }, rh = { x: SX + SW / 2 - 8, y: ny + 1, w: 16, h: 8 }, rc = { x: SX + SW - 36, y: ny + 1, w: 16, h: 8 };
      gfx.text('◀', rb.x + 5, ny + 2, navc, { font: 'small' }); gfx.rect(rh.x + 4, ny + 3, 8, 4, navc); gfx.text('▼', rc.x + 5, ny + 2, navc, { font: 'small' });
      if (inp.mouseIn(rb) || inp.mouseIn(rh) || inp.mouseIn(rc)) ui.cursor = 'hand';
      if (inp.clicked(rb)) { this.back(); inp.eat(); }
      if (inp.clicked(rh)) { this.home(); inp.eat(); }
      if (inp.clicked(rc)) { this.close(); inp.eat(); }
      // notification banner
      if (this.banner) {
        const b = this.banner; const a = this.bannerT < 0.3 ? this.bannerT / 0.3 : this.bannerT > 3 ? Math.max(0, (3.5 - this.bannerT) / 0.5) : 1;
        const by = SY + 2 - Math.round((1 - a) * 20);
        gfx.rrect(SX + 3, by, SW - 6, 20, 3, 'rgba(20,20,30,0.95)');
        gfx.rect(SX + 6, by + 3, 8, 8, b.app === 'Mail' ? '#3b6fd6' : '#4f9d3a'); gfx.text(b.app === 'Mail' ? '✉' : '☺', SX + 10, by + 4, '#fff', { align: 'center', font: 'small' });
        gfx.text(b.from.slice(0, 22), SX + 17, by + 3, '#fff', { font: 'small' });
        gfx.text(b.text.slice(0, 26) + (b.text.length > 26 ? '…' : ''), SX + 17, by + 11, '#bbb', { font: 'small' });
        const r = { x: SX + 3, y: by, w: SW - 6, h: 20 };
        if (inp.mouseIn(r)) ui.cursor = 'hand';
        if (inp.clicked(r)) { this.banner = null; this.appStack = []; this.app = null; this.open(b.app === 'Mail' ? 'mail' : 'messages'); inp.eat(); }
      }
    }
    // ---- HOME -------------------------------------------------------------------------------------
    drawHome(g, cw, ch) {
      const d = PD();
      const apps = [
        ['browser', 'Foxfire', '#e8752c', (x, y) => { gfx.circle(x + 11, y + 11, 7, '#f5c33b'); gfx.tri(x + 4, y + 9, x + 10, y + 4, x + 6, y + 14, '#e8752c'); gfx.circle(x + 12, y + 12, 5, '#e8752c'); gfx.px(x + 13, y + 10, '#fff'); }],
        ['messages', 'Messages', '#4f9d3a', (x, y) => { gfx.rrect(x + 4, y + 5, 14, 10, 3, '#fff'); gfx.tri(x + 7, y + 14, x + 11, y + 14, x + 6, y + 18, '#fff'); gfx.rect(x + 7, y + 8, 8, 1, '#4f9d3a'); gfx.rect(x + 7, y + 11, 5, 1, '#4f9d3a'); }, d.unreadTexts],
        ['mail', 'Mail', '#3b6fd6', (x, y) => { gfx.rect(x + 4, y + 6, 14, 10, '#fff'); gfx.line(x + 4, y + 6, x + 11, y + 12, '#3b6fd6'); gfx.line(x + 18, y + 6, x + 11, y + 12, '#3b6fd6'); }, d.unreadMail],
        ['jobs', 'LinkedOut', '#1b3a6a', (x, y) => { gfx.text('in', x + 11, y + 8, '#fff', { align: 'center' }); }],
        ['files', 'Files', '#f5c33b', (x, y) => { gfx.rect(x + 4, y + 7, 14, 10, '#fff8d0'); gfx.rect(x + 4, y + 5, 6, 3, '#fff8d0'); gfx.rect(x + 5, y + 10, 12, 6, '#f0d060'); }],
        ['bank', 'Moosebank', '#2f7a4a', (x, y) => { gfx.text('$', x + 11, y + 8, '#fff', { align: 'center' }); gfx.rect(x + 5, y + 16, 12, 1, '#fff'); }],
        ['camera', 'Camera', '#555', (x, y) => { gfx.rrect(x + 4, y + 7, 14, 10, 2, '#ddd'); gfx.circle(x + 11, y + 12, 3, '#333'); gfx.px(x + 12, y + 11, '#8cf'); gfx.rect(x + 7, y + 5, 4, 2, '#ddd'); }],
        ['photos', 'Photos', '#c85a8a', (x, y) => { gfx.rect(x + 4, y + 5, 7, 6, '#f5c33b'); gfx.rect(x + 11, y + 5, 7, 6, '#4f9d3a'); gfx.rect(x + 4, y + 11, 7, 6, '#3b6fd6'); gfx.rect(x + 11, y + 11, 7, 6, '#e8752c'); }],
        ['hedgehog', 'Hedgehog', '#3b6fd6', (x, y) => { g.save(); g.translate(x + 11, y + 19); g.scale(0.65, 0.65); CH.drawHedgehog(g, 0, 0, { state: 'idle' }); g.restore(); }],
        ['maps', 'Maps', '#8bd06a', (x, y) => { gfx.rect(x + 4, y + 5, 14, 12, '#d8e8c0'); gfx.rect(x + 4, y + 10, 14, 2, '#f5c33b'); gfx.rect(x + 10, y + 5, 2, 12, '#fff'); gfx.circle(x + 14, y + 8, 2, '#c8352b'); }],
        ['settings', 'Settings', '#777', (x, y) => { gfx.circle(x + 11, y + 11, 6, '#ddd'); gfx.circle(x + 11, y + 11, 2, '#777'); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; gfx.rect(x + 11 + Math.round(Math.cos(a) * 7) - 1, y + 11 + Math.round(Math.sin(a) * 7) - 1, 2, 2, '#ddd'); } }],
        ['shop', 'Amazoon', '#f0a030', (x, y) => { gfx.rect(x + 5, y + 6, 12, 10, '#fff'); gfx.rect(x + 6, y + 13, 10, 1, '#f0a030'); gfx.text('a', x + 11, y + 6, '#f0a030', { align: 'center' }); }],
      ];
      if (S.job) apps.push(['donalds', "Donald's", '#c8352b', (x, y) => { gfx.text('D', x + 11, y + 7, '#f5c33b', { align: 'center' }); }]);
      const cols = 4, iw = 22, gapX = Math.floor((cw - cols * iw) / (cols + 1));
      apps.forEach((ap, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        const x = gapX + col * (iw + gapX), y = 8 + row * 34;
        const r = { x, y, w: iw, h: iw, noScroll: true };
        const hv = this.hover(r);
        gfx.rrect(x, y + 1, iw, iw, 5, 'rgba(0,0,0,0.35)');
        gfx.rrect(x, y, iw, iw, 5, hv ? gfx.shade(ap[2], 25) : ap[2]);
        ap[3](x, y);
        if (ap[4]) { gfx.circle(x + iw - 1, y + 1, 4, '#e83030'); gfx.text(String(ap[4]), x + iw - 1, y - 2, '#fff', { align: 'center', font: 'small' }); }
        gfx.text(ap[1], x + iw / 2, y + iw + 2, '#fff', { align: 'center', font: 'small' });
        if (hv) ui.cursor = 'hand';
        if (this.clicked(r)) { this.openApp(ap[0]); inp.eat(); }
      });
      // objective hint on home
      if (S.chapter === 'jobsearch' && !CH.flag('gotInterview')) { gfx.rrect(6, ch - 52, cw - 12, 12, 3, 'rgba(0,0,0,0.5)'); gfx.text('TIP: open Foxfire and search for jobs', cw / 2, ch - 49, '#fff', { align: 'center', font: 'small' }); }
    }
    openApp(name) {
      if (name === 'camera') { A.sfx('camera'); fx.doFlash(0.8); ui.toast('You took a photo of your own face. It is 4 AM tired.', '#fff', 3); return; }
      if (name === 'hedgehog') { ui.toast('Blue Hedgehog Mobile: "Not now, Chubby." - the game, somehow', '#9fdcff', 3.5); A.sfx('error'); return; }
      if (name === 'photos') { this.open('photos'); return; }
      if (name === 'maps') { this.open('maps'); return; }
      if (name === 'settings') { this.open('settings'); return; }
      if (name === 'jobs') { this.open('browser', { url: 'linkedout.ca' }); return; }
      if (name === 'browser') { this.open('browser', { url: 'goggle.ca' }); return; }
      if (name === 'shop') { this.open('shop'); return; }
      if (name === 'donalds') { this.open('donalds'); return; }
      this.open(name);
    }
    // ---- APP ROUTER -----------------------------------------------------------------------------------
    drawApp(g, cw, ch) {
      const a = this.app;
      const fn = this['app_' + a.name];
      if (fn) fn.call(this, g, cw, ch, a.state, a);
      else { this.header('Unknown app'); }
      this.enterPressed = false;
    }
    // ---- widgets (local coords, drawn under scroll translate) ---
    header(title, color = '#3b6fd6', sub) {
      gfx.rect(0, this.app.scroll, SW, 14, color); gfx.text(title, 6, this.app.scroll + 3, '#fff', { font: 'small' });
      if (sub) gfx.text(sub, SW - 4, this.app.scroll + 3, '#fff', { align: 'right', font: 'small' });
      return 16;
    }
    button(x, y, w, h, label, opts = {}) {
      const r = { x, y, w, h }; const hv = this.hover(r);
      const col = opts.color || '#3b6fd6';
      gfx.rrect(x, y + 1, w, h, 2, 'rgba(0,0,0,0.3)'); gfx.rrect(x, y, w, h, 2, opts.disabled ? '#aaa' : hv ? gfx.shade(col, 30) : col);
      gfx.text(label, x + w / 2, y + Math.floor((h - (opts.font === 'main' ? 7 : 5)) / 2), opts.textColor || '#fff', { align: 'center', font: opts.font || 'small' });
      if (hv && !opts.disabled) ui.cursor = 'hand';
      const c = !opts.disabled && this.clicked(r);
      if (c) { A.sfx(opts.sfx || 'tap'); inp.eat(); }
      return c;
    }
    field(id, x, y, w, h, placeholder, opts = {}) {
      const r = { x, y, w, h }; const hv = this.hover(r); const focused = this.focus === id;
      gfx.rrect(x, y, w, h, 2, '#fff'); gfx.frame(x, y, w, h, focused ? '#3b6fd6' : '#bbb');
      const v = this.fields[id] || '';
      const shown = v.length * 4 > w - 8 ? v.slice(-(Math.floor((w - 8) / 4))) : v;
      if (v) gfx.text(opts.password ? '*'.repeat(v.length) : shown, x + 3, y + Math.floor((h - 5) / 2), '#222', { font: 'small' });
      else gfx.text(placeholder, x + 3, y + Math.floor((h - 5) / 2), '#aaa', { font: 'small' });
      if (focused && Math.floor(this.t2 * 2) % 2 === 0) gfx.rect(x + 4 + gfx.textWidth(opts.password ? '*'.repeat(v.length) : shown, 'small'), y + 2, 1, h - 4, '#222');
      if (hv) ui.cursor = 'hand';
      if (this.clicked(r)) { this.focus = id; this.keyboardShown = true; A.sfx('tap'); inp.eat(); }
      return v;
    }
    row(y, h, drawFn, onClick) {
      const r = { x: 0, y, w: SW, h }; const hv = this.hover(r);
      if (hv && onClick) { gfx.rect(0, y, SW, h, '#e8ecf4'); ui.cursor = 'hand'; }
      drawFn(hv);
      gfx.hline(4, y + h - 1, SW - 8, '#dde');
      if (onClick && this.clicked(r)) { onClick(); inp.eat(); }
    }
    para(text, x, y, w, color = '#333', font = 'small') { const lines = gfx.wrap(text, w, font); lines.forEach((l, i) => gfx.text(l, x, y + i * (font === 'small' ? 7 : 10), color, { font })); return lines.length * (font === 'small' ? 7 : 10); }
    drawKeyboard(g) {
      const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
      const kh = 56, ky = SY + SH - NAV_H - kh;
      gfx.rect(SX, ky, SW, kh, '#cfd4dc');
      const kw = 12, gap = 1;
      const shift = this.shift;
      rows.forEach((row, ri) => {
        const rw = row.length * (kw + gap); const x0 = SX + Math.floor((SW - rw) / 2) + (ri === 2 ? 0 : 0);
        for (let i = 0; i < row.length; i++) {
          const x = x0 + i * (kw + gap), y = ky + 3 + ri * 13;
          const r = { x, y, w: kw, h: 11 }; const hv = inp.mouseIn(r);
          gfx.rrect(x, y, kw, 11, 2, hv ? '#fff' : '#f4f6fa'); gfx.rect(x, y + 11, kw, 1, '#99a');
          const chh = shift ? row[i].toUpperCase() : row[i];
          gfx.text(chh, x + kw / 2, y + 3, '#222', { align: 'center', font: 'small' });
          if (hv) ui.cursor = 'hand';
          if (inp.clicked(r)) { this.typeChar(chh); inp.eat(); }
        }
      });
      // bottom row: shift, 123, space, backspace, done
      const by = ky + 3 + 39;
      const keys = [['⇧', 16, () => { this.shift = !this.shift; }], ['123', 18, () => { this.numMode = !this.numMode; }], ['space', 48, () => this.typeChar(' ')], ['←', 16, () => { this.fields[this.focus] = (this.fields[this.focus] || '').slice(0, -1); }], ['OK', 20, () => { this.enterPressed = true; this.keyboardShown = false; this.focus = null; }]];
      let x = SX + 3;
      for (const [lab, w, fn] of keys) {
        const r = { x, y: by, w, h: 11 }; const hv = inp.mouseIn(r);
        gfx.rrect(x, by, w, 11, 2, lab === 'OK' ? (hv ? '#5a8fe6' : '#3b6fd6') : hv ? '#fff' : '#e4e8ee'); gfx.rect(x, by + 11, w, 1, '#99a');
        gfx.text(lab, x + w / 2, by + 3, lab === 'OK' ? '#fff' : '#222', { align: 'center', font: 'small' });
        if (hv) ui.cursor = 'hand';
        if (inp.clicked(r)) { fn(); A.sfx('key'); inp.eat(); }
        x += w + 2;
      }
      if (this.numMode) { // number strip replaces first row
        gfx.rect(SX, ky + 3, SW, 11, '#cfd4dc');
        const digits = '1234567890@.';
        const x0 = SX + Math.floor((SW - digits.length * (kw + gap)) / 2);
        for (let i = 0; i < digits.length; i++) { const x = x0 + i * (kw + gap), y = ky + 3; const r = { x, y, w: kw, h: 11 }; const hv = inp.mouseIn(r); gfx.rrect(x, y, kw, 11, 2, hv ? '#fff' : '#f4f6fa'); gfx.text(digits[i], x + kw / 2, y + 3, '#222', { align: 'center', font: 'small' }); if (hv) ui.cursor = 'hand'; if (inp.clicked(r)) { this.typeChar(digits[i]); inp.eat(); } }
      }
    }
    typeChar(c) { if (!this.focus) return; const v = this.fields[this.focus] || ''; if (v.length < 60) this.fields[this.focus] = v + c; A.sfx('key'); if (this.shift) this.shift = false; }

    // ================================ APPS =================================================
    app_browser(g, cw, ch, st, a) {
      // url bar
      const url = st.url || 'goggle.ca';
      gfx.rect(0, a.scroll, cw, 16, '#e6e9f0');
      const ub = { x: 14, y: a.scroll + 3, w: cw - 30, h: 10 };
      gfx.rrect(ub.x, ub.y, ub.w, ub.h, 3, '#fff'); gfx.frame(ub.x, ub.y, ub.w, ub.h, this.focus === 'url' ? '#3b6fd6' : '#ccc');
      const typed = this.fields.url;
      gfx.text(this.focus === 'url' ? (typed || '') + (Math.floor(this.t2 * 2) % 2 ? '|' : '') : (url.length > 24 ? url.slice(0, 24) + '…' : url), ub.x + 4, ub.y + 3, '#333', { font: 'small' });
      if (this.hover({ x: ub.x, y: ub.y, w: ub.w, h: ub.h })) ui.cursor = 'hand';
      if (this.clicked({ x: ub.x, y: ub.y, w: ub.w, h: ub.h })) { this.focus = 'url'; this.fields.url = ''; this.keyboardShown = true; inp.eat(); }
      // back arrow
      if (this.button(2, a.scroll + 3, 10, 10, '◀', { color: '#8899aa' })) { if (st.hist && st.hist.length) { st.url = st.hist.pop(); a.scroll = 0; } else this.back(); }
      if (this.button(cw - 14, a.scroll + 3, 12, 10, '↻', { color: '#8899aa' })) { A.sfx('swipe'); }
      if (this.enterPressed && this.focus === 'url') { this.enterPressed = false; this.navigate(st, this.fields.url || ''); this.focus = null; this.keyboardShown = false; }
      let y = 20;
      const page = this.pageFor(url);
      const h = page.call(this, g, cw, y, st, a);
      a.contentH = y + h;
    }
    navigate(st, input) {
      st.hist = st.hist || []; st.hist.push(st.url || 'goggle.ca'); if (st.hist.length > 10) st.hist.shift();
      let u = input.trim().toLowerCase();
      if (!u) u = 'goggle.ca';
      const known = ['goggle.ca', 'indeedly.ca', 'kijujube.ca', 'linkedout.ca', 'donaldsburgers.ca', 'donalds.ca', 'moosepedia.org', 'mooseweather.ca', 'hedgehogfans.net', 'stmoosephs.ca'];
      const hit = known.find((k) => u.includes(k.split('.')[0]));
      if (hit) st.url = hit === 'donalds.ca' ? 'donaldsburgers.ca' : hit;
      else if (u.includes('.')) st.url = 'error:' + u;
      else st.url = 'goggle.ca/search?q=' + encodeURIComponent(u);
      this.app.scroll = 0; A.sfx('swipe');
      PD().history.push(st.url);
    }
    pageFor(url) {
      if (url.startsWith('goggle.ca/search')) return this.page_search;
      if (url.startsWith('goggle')) return this.page_goggle;
      if (url.startsWith('indeedly')) return this.page_indeedly;
      if (url.startsWith('kijujube')) return this.page_kijujube;
      if (url.startsWith('linkedout')) return this.page_linkedout;
      if (url.startsWith('donaldsburgers')) return this.page_donalds;
      if (url.startsWith('moosepedia')) return this.page_moosepedia;
      if (url.startsWith('mooseweather')) return this.page_weather;
      if (url.startsWith('hedgehogfans')) return this.page_fans;
      if (url.startsWith('stmoosephs')) return this.page_stmoosephs;
      if (url.startsWith('job:')) return this.page_job;
      if (url.startsWith('apply:')) return this.page_apply;
      return this.page_error;
    }
    link(x, y, text, onClick, color = '#1a55cc') {
      const w = gfx.textWidth(text, 'small'); const r = { x, y: y - 1, w, h: 7 };
      gfx.text(text, x, y, this.hover(r) ? '#c8352b' : color, { font: 'small' }); gfx.hline(x, y + 6, w, this.hover(r) ? '#c8352b' : color);
      if (this.hover(r)) ui.cursor = 'hand';
      if (this.clicked(r)) { onClick(); inp.eat(); }
    }
    goto(st, url) { st.hist = st.hist || []; st.hist.push(st.url); st.url = url; this.app.scroll = 0; A.sfx('swipe'); }
    page_goggle(g, cw, y, st) {
      gfx.rect(0, y, cw, 200, '#fff');
      // logo
      const cols = ['#3b6fd6', '#c8352b', '#f5c33b', '#3b6fd6', '#4f9d3a', '#c8352b'];
      'Goggle'.split('').forEach((c, i) => { g.save(); g.translate(cw / 2 - 30 + i * 11, y + 30); g.scale(1.6, 1.6); gfx.text(c, 0, 0, cols[i]); g.restore(); });
      const v = this.field('gsearch', 10, y + 56, cw - 20, 12, 'Search or type URL');
      if (this.enterPressed && this.focus === 'gsearch') { this.enterPressed = false; this.navigate(st, v); this.fields.gsearch = ''; this.focus = null; this.keyboardShown = false; }
      if (this.button(cw / 2 - 40, y + 74, 36, 12, 'Search')) { this.navigate(st, v); this.fields.gsearch = ''; }
      if (this.button(cw / 2 + 4, y + 74, 40, 12, "I'm Lazy", { color: '#8899aa' })) { this.navigate(st, 'blue hedgehog cheats'); }
      this.para('Trending: "jobs near me", "how to adult", "is 84000 a lot", "Donald\'s Burgers hiring", "can you eat a button"', 10, y + 96, cw - 20, '#888');
      this.link(10, y + 130, 'Goggle Jobs →', () => this.navigate(st, 'jobs'));
      this.link(10, y + 140, 'Moosepedia', () => this.goto(st, 'moosepedia.org'));
      this.link(10, y + 150, 'Moose Weather', () => this.goto(st, 'mooseweather.ca'));
      return 170;
    }
    page_search(g, cw, y, st) {
      const q = decodeURIComponent((st.url.split('q=')[1] || '')).toLowerCase();
      gfx.rect(0, y, cw, 400, '#fff');
      gfx.text('Goggle', 6, y + 4, '#3b6fd6'); gfx.rrect(50, y + 3, cw - 56, 10, 3, '#eef'); gfx.text(q.slice(0, 22), 54, y + 6, '#333', { font: 'small' });
      let yy = y + 20;
      const results = [];
      const jobby = /job|work|hiring|career|employ|money|apply|donald/.test(q);
      if (jobby) {
        results.push(['Indeedly - Jobs in Moose Hollow, ON', 'indeedly.ca', '1,203 jobs near you. Apply in minutes. Get rejected in hours.']);
        results.push(['LinkedOut: Professional Networking', 'linkedout.ca', 'Connect with 6 people you went to high school with. They all have jobs.']);
        results.push(['Kijujube Classifieds - Moose Hollow', 'kijujube.ca', 'Jobs, used snowmobiles, a "haunted" canoe, free kittens.']);
        results.push(["Donald's Burgers - NOW HIRING", 'donaldsburgers.ca', "The big D. Not the M. Apply today. Kevin quit."]);
      }
      if (/hedgehog|blue|man egg|cheat|speedrun/.test(q)) results.push(['HedgehogFans.net - Forums', 'hedgehogfans.net', 'Thread: "Man Egg is a misunderstood genius" (4,201 replies)']);
      if (/84|bill|hospital|heart|mom|surgery|payment/.test(q)) results.push(["St. Mooseph's General - Billing FAQ", 'stmoosephs.ca', 'Payment plans available! Most families find a way :)']);
      if (/weather|snow|cold/.test(q)) results.push(['Moose Weather - Moose Hollow forecast', 'mooseweather.ca', '-18°C. Snow. More snow. Snow tomorrow.']);
      if (/porcupine|quill|chubby/.test(q)) results.push(['Porcupine - Moosepedia', 'moosepedia.org', 'A large rodent with a coat of sharp spines. Known for napping.']);
      if (!results.length) results.push(['Did you mean: get a job', 'goggle.ca/search?q=jobs', 'Showing results for "jobs near me" instead.'], ['Moosepedia - ' + q.slice(0, 12), 'moosepedia.org', 'The free encyclopedia that anyone can edit (mostly Kevin).']);
      gfx.text(`About ${(q.length * 1337 + 42).toLocaleString()} results (0.${q.length}1 seconds)`, 6, yy, '#888', { font: 'small' }); yy += 10;
      for (const [title, url, snip] of results) {
        this.link(6, yy, title.length > 32 ? title.slice(0, 32) + '…' : title, () => { if (url.startsWith('goggle')) this.navigate(st, 'jobs'); else this.goto(st, url); });
        gfx.text(url, 6, yy + 8, '#3a9a5a', { font: 'small' });
        yy += 16; yy += this.para(snip, 6, yy, cw - 12, '#555') + 6;
      }
      if (jobby) { gfx.rrect(6, yy, cw - 12, 24, 3, '#fff8d0'); gfx.text('Sponsored: "Earn $5000/wk from your', 10, yy + 4, '#886', { font: 'small' }); gfx.text('COUCH!" - GlobalMoney Solutionz', 10, yy + 11, '#886', { font: 'small' }); this.link(10, yy + 18, 'kijujube.ca/dataentry', () => this.goto(st, 'kijujube.ca')); yy += 30; }
      return yy - y + 10;
    }
    jobList(g, cw, y, st, site, color, name, tagline) {
      gfx.rect(0, y, cw, 600, '#fff');
      gfx.rect(0, y, cw, 18, color); gfx.text(name, 6, y + 3, '#fff'); gfx.text(tagline, 6, y + 11, 'rgba(255,255,255,0.8)', { font: 'small' });
      let yy = y + 22;
      const v = this.field(site + '_q', 6, yy, cw - 46, 11, 'Search jobs...'); if (this.button(cw - 38, yy, 32, 11, 'Find')) { A.sfx('swipe'); }
      yy += 16;
      let jobs = CH.JOB_LISTINGS.filter((j) => j.site === site);
      if (v) jobs = jobs.filter((j) => (j.title + j.company + j.desc).toLowerCase().includes(v.toLowerCase()));
      gfx.text(`${jobs.length} jobs in Moose Hollow, ON`, 6, yy, '#666', { font: 'small' }); yy += 10;
      for (const j of jobs) {
        const st2 = S.applied[j.id] || (PD().applications[j.id] ? PD().applications[j.id].status : null);
        const rowH = 34;
        this.row(yy, rowH, (hv) => {
          gfx.rect(4, yy + 3, 22, 22, hv ? '#eef' : '#f0f2f6'); gfx.frame(4, yy + 3, 22, 22, '#dde'); gfx.text(j.company[0], 15, yy + 10, color, { align: 'center' });
          gfx.text(j.title.length > 26 ? j.title.slice(0, 26) + '…' : j.title, 30, yy + 4, '#1a1a2a', { font: 'small' });
          gfx.text(j.company.slice(0, 26), 30, yy + 12, '#555', { font: 'small' });
          gfx.text(j.pay + '  -  ' + j.type, 30, yy + 20, '#3a9a5a', { font: 'small' });
          gfx.text(j.posted, cw - 6, yy + 4, j.hot ? '#c8352b' : '#999', { align: 'right', font: 'small' });
          if (j.hot) { gfx.rrect(cw - 30, yy + 12, 24, 8, 2, '#c8352b'); gfx.text('URGENT', cw - 18, yy + 13, '#fff', { align: 'center', font: 'small' }); }
          if (st2) { gfx.rrect(cw - 40, yy + 22, 36, 8, 2, st2 === 'pending' ? '#f0a030' : st2 === 'interview' ? '#3a9a5a' : '#999'); gfx.text(st2 === 'pending' ? 'APPLIED' : st2 === 'interview' ? 'INTERVIEW' : 'REJECTED', cw - 22, yy + 23, '#fff', { align: 'center', font: 'small' }); }
        }, () => this.goto(st, 'job:' + j.id));
        yy += rowH;
      }
      return yy - y + 10;
    }
    page_indeedly(g, cw, y, st) { return this.jobList(g, cw, y, st, 'indeedly', '#2557a7', 'indeedly', 'find your next disappointment'); }
    page_kijujube(g, cw, y, st) { return this.jobList(g, cw, y, st, 'kijujube', '#37a850', 'Kijujube', 'buy. sell. probably a scam.'); }
    page_linkedout(g, cw, y, st) {
      gfx.rect(0, y, cw, 300, '#f3f2ef');
      gfx.rect(0, y, cw, 16, '#0a66c2'); gfx.text('Linked', 6, y + 4, '#fff'); gfx.rrect(44, y + 3, 18, 10, 2, '#fff'); gfx.text('out', 53, y + 5, '#0a66c2', { align: 'center', font: 'small' });
      let yy = y + 20;
      gfx.rrect(6, yy, cw - 12, 40, 3, '#fff'); gfx.frame(6, yy, cw - 12, 40, '#ddd');
      g.save(); g.translate(22, yy + 36); g.scale(0.9, 0.9); CH.drawChubby(g, 0, 0, { outfit: S.outfit, noShadow: true, face: 'normal', arm: 'pocket' }); g.restore();
      gfx.text('Chubby Quillsworth', 42, yy + 5, '#1a1a2a', { font: 'small' }); gfx.text('Couch Manager at Self', 42, yy + 13, '#555', { font: 'small' }); gfx.text('Moose Hollow, ON - 2 connections', 42, yy + 21, '#888', { font: 'small' }); gfx.text('(Mom, and a bot)', 42, yy + 29, '#888', { font: 'small' });
      yy += 46;
      gfx.text('Jobs for you', 6, yy, '#1a1a2a'); yy += 10;
      for (const j of CH.JOB_LISTINGS.filter((j) => j.site === 'linkedout')) {
        const st2 = PD().applications[j.id] ? PD().applications[j.id].status : null;
        this.row(yy, 30, (hv) => { gfx.text(j.title, 8, yy + 4, '#0a66c2', { font: 'small' }); gfx.text(j.company + ' - ' + j.loc, 8, yy + 12, '#555', { font: 'small' }); gfx.text(st2 ? 'Status: ' + st2.toUpperCase() : '4,311 applicants', 8, yy + 20, st2 ? '#c8352b' : '#888', { font: 'small' }); }, () => this.goto(st, 'job:' + j.id));
        yy += 30;
      }
      yy += 6;
      gfx.text('Feed', 6, yy, '#1a1a2a'); yy += 10;
      const posts = [['Tammy F.', 'Thrilled to announce I am now a SENIOR CASHIER at Donald\'s Burgers!! #blessed #grind'], ['Gary from high school', 'Just closed my 3rd house. Hustle never sleeps. (I sleep 4 hrs)'], ['Kevin R.', 'I QUIT. Never mopping again. Brenda if you see this: the fryer WAS on fire.'], ['Moose Hollow Mall', 'Now hiring Santa. Not a bear this time. Please.']];
      for (const [who, txt] of posts) { gfx.rrect(6, yy, cw - 12, 30, 3, '#fff'); gfx.frame(6, yy, cw - 12, 30, '#ddd'); gfx.circle(14, yy + 8, 5, '#0a66c2'); gfx.text(who, 22, yy + 4, '#1a1a2a', { font: 'small' }); this.para(txt, 10, yy + 12, cw - 20, '#444'); yy += 34; }
      return yy - y + 10;
    }
    page_donalds(g, cw, y, st) {
      gfx.rect(0, y, cw, 260, '#fff8e8');
      gfx.rect(0, y, cw, 30, '#c8352b');
      // big D logo
      g.save(); g.translate(14, y + 4); g.scale(2, 2); gfx.text('D', 0, 0, '#f5c33b', { outline: '#8f2419' }); g.restore();
      gfx.text("Donald's Burgers", 34, y + 6, '#fff'); gfx.text('"It\'s a D. Not an M."', 34, y + 17, '#f5c33b', { font: 'small' });
      let yy = y + 36;
      yy += this.para("Home of the Big Don, the Quarter Pounder-ish, and the McFlurry-adjacent Donald Swirl. Serving Moose Hollow since 1987.", 6, yy, cw - 12, '#5a3a1a') + 6;
      gfx.rrect(6, yy, cw - 12, 40, 3, '#f5c33b'); gfx.text('WE ARE HIRING', cw / 2, yy + 4, '#8f2419', { align: 'center' });
      gfx.text('Janitor / Crew Member. Immediately.', cw / 2, yy + 15, '#5a3a1a', { align: 'center', font: 'small' });
      gfx.text('Kevin quit.', cw / 2, yy + 23, '#5a3a1a', { align: 'center', font: 'small' });
      if (this.button(cw / 2 - 30, yy + 30, 60, 9, 'View posting', { color: '#c8352b' })) this.goto(st, 'job:donalds');
      yy += 48;
      gfx.text('Menu highlights', 6, yy, '#5a3a1a'); yy += 10;
      for (const [n, p] of [['Big Don', '$6.99'], ['Double Don w/ cheese', '$8.49'], ['Donald Fries (L)', '$3.29'], ['Moose Shake', '$4.99'], ['Kids Meal (toy: sad egg)', '$5.99']]) { gfx.text(n, 8, yy, '#333', { font: 'small' }); gfx.text(p, cw - 8, yy, '#c8352b', { align: 'right', font: 'small' }); yy += 8; }
      yy += 6; gfx.text('123 Main St, Moose Hollow  -  Open 6AM-11PM', 6, yy, '#888', { font: 'small' }); yy += 8;
      return yy - y + 10;
    }
    page_job(g, cw, y, st) {
      const j = CH.jobById(st.url.split(':')[1]);
      gfx.rect(0, y, cw, 600, '#fff');
      let yy = y + 4;
      yy += this.para(j.title, 6, yy, cw - 12, '#1a1a2a', 'main') + 2;
      gfx.text(j.company + ' - ' + j.loc, 6, yy, '#555', { font: 'small' }); yy += 8;
      gfx.text(j.pay + '  -  ' + j.type + '  -  ' + j.posted, 6, yy, '#3a9a5a', { font: 'small' }); yy += 12;
      const ap = PD().applications[j.id];
      if (ap) { gfx.rrect(6, yy, cw - 12, 12, 2, ap.status === 'pending' ? '#f0a030' : ap.status === 'interview' ? '#3a9a5a' : '#999'); gfx.text(ap.status === 'pending' ? 'APPLIED - awaiting response' : ap.status === 'interview' ? 'INTERVIEW OFFERED! Check Mail.' : 'REJECTED - check Mail for details', cw / 2, yy + 3, '#fff', { align: 'center', font: 'small' }); yy += 16; }
      else { if (this.button(6, yy, cw - 12, 14, 'APPLY NOW', { color: j.hot ? '#c8352b' : '#2557a7', font: 'main', sfx: 'select' })) { this.fields = Object.assign(this.fields, { ap_name: this.fields.ap_name || '', ap_email: this.fields.ap_email || '' }); this.goto(st, 'apply:' + j.id + ':0'); } yy += 18; }
      gfx.text('Description', 6, yy, '#1a1a2a'); yy += 10;
      yy += this.para(j.desc, 6, yy, cw - 12, '#333') + 6;
      gfx.text('Requirements', 6, yy, '#1a1a2a'); yy += 10;
      for (const r of j.reqs) { gfx.text('- ' + r, 8, yy, '#333', { font: 'small' }); yy += 8; }
      yy += 6;
      gfx.text('Similar jobs', 6, yy, '#1a1a2a'); yy += 10;
      for (const o of CH.JOB_LISTINGS.filter((o) => o.id !== j.id).slice(0, 3)) { this.link(8, yy, o.title.slice(0, 30), () => this.goto(st, 'job:' + o.id)); yy += 9; }
      return yy - y + 10;
    }
    // ---- APPLICATION FLOW ----------------------------------------------------------------------------------
    page_apply(g, cw, y, st) {
      const [, id, stepS] = st.url.split(':');
      const j = CH.jobById(id); const step = parseInt(stepS);
      const d = PD();
      st.ap = st.ap || {}; const ap = st.ap[id] || (st.ap[id] = { answers: [], letter: -1, file: null, captchaSel: [], score: 0 });
      gfx.rect(0, y, cw, 700, '#fff');
      // progress
      const steps = ['Info', 'Resume', 'Questions', 'Letter', 'Human?', 'Done'];
      steps.forEach((s, i) => { const x = 6 + i * ((cw - 12) / steps.length); gfx.rect(x, y + 4, (cw - 12) / steps.length - 2, 3, i <= step ? '#2557a7' : '#ddd'); });
      gfx.text(`Step ${step + 1}/${steps.length}: ${steps[step]}`, 6, y + 10, '#555', { font: 'small' });
      gfx.text(j.title.slice(0, 28), 6, y + 18, '#1a1a2a', { font: 'small' });
      let yy = y + 30;
      const next = () => { this.goto(st, `apply:${id}:${step + 1}`); this.focus = null; this.keyboardShown = false; };
      if (step === 0) {
        gfx.text('Full name', 6, yy, '#333', { font: 'small' }); yy += 8; const nm = this.field('ap_name', 6, yy, cw - 12, 12, 'e.g. Chubby Quillsworth'); yy += 16;
        gfx.text('Email', 6, yy, '#333', { font: 'small' }); yy += 8; const em = this.field('ap_email', 6, yy, cw - 12, 12, 'you@example.ca'); yy += 16;
        gfx.text('Phone', 6, yy, '#333', { font: 'small' }); yy += 8; const ph = this.field('ap_phone', 6, yy, cw - 12, 12, '(705) 555-'); yy += 18;
        if (this.enterPressed) { this.enterPressed = false; this.focus = null; this.keyboardShown = false; }
        const ok = nm.trim().length >= 3 && em.includes('@') && ph.length >= 3;
        if (!ok) { gfx.text('Fill in all fields (email needs an @)', 6, yy, '#c8352b', { font: 'small' }); yy += 10; }
        if (nm && !/chubby/i.test(nm)) { gfx.text('(That is not your name. Bold.)', 6, yy, '#888', { font: 'small' }); yy += 10; }
        if (this.button(6, yy, cw - 12, 12, 'Continue', { disabled: !ok })) { ap.name = nm; ap.score += /chubby/i.test(nm) ? 1 : 0; next(); }
        yy += 16;
        this.link(6, yy, 'Autofill from LinkedOut', () => { this.fields.ap_name = 'Chubby Quillsworth'; this.fields.ap_email = 'chubby_gamer_420@hotmoose.ca'; this.fields.ap_phone = '(705) 555-0142'; A.sfx('good'); }); yy += 10;
      } else if (step === 1) {
        gfx.text('Attach your resume', 6, yy, '#333'); yy += 12;
        const files = [['resume_final_FINAL2.pdf', 'PDF - 84 KB', true], ['resume_final.pdf', 'PDF - 81 KB (old, has typo)', 'old'], ['blue_hedgehog_speedrun_41min.mp4', 'Video - 1.2 GB', false], ['IMG_2019_pancakes.jpg', 'Image - 2.1 MB', false], ['pancake_mix_coupon.pdf', 'PDF - 12 KB', false], ['taxes_2022_DO_NOT_OPEN.zip', 'Archive - 9 KB', false]];
        for (const [name, meta, good] of files) {
          const sel = ap.file === name;
          this.row(yy, 18, (hv) => { gfx.rect(6, yy + 3, 12, 12, sel ? '#2557a7' : '#eee'); gfx.text(name.split('.').pop().toUpperCase().slice(0, 3), 12, yy + 7, sel ? '#fff' : '#555', { align: 'center', font: 'small' }); gfx.text(name.length > 26 ? name.slice(0, 26) + '…' : name, 22, yy + 3, '#1a1a2a', { font: 'small' }); gfx.text(meta, 22, yy + 11, '#888', { font: 'small' }); if (sel) gfx.text('✓', cw - 10, yy + 6, '#3a9a5a'); }, () => { ap.file = name; ap.good = good; A.sfx('tap'); });
          yy += 18;
        }
        yy += 6;
        if (ap.file && ap.good !== true) { gfx.text(ap.good === 'old' ? 'Hmm. This one says "Couch Manger".' : 'Are you sure? That is not a resume.', 6, yy, '#c8352b', { font: 'small' }); yy += 10; }
        if (this.button(6, yy, cw - 12, 12, 'Attach & continue', { disabled: !ap.file })) { ap.score += ap.good === true ? 2 : ap.good === 'old' ? 1 : 0; if (ap.good !== true) ap.wrongFile = ap.file; next(); }
        yy += 16;
      } else if (step === 2) {
        const qi = ap.answers.length;
        if (qi < j.qs.length) {
          const q = j.qs[qi];
          gfx.text(`Question ${qi + 1} of ${j.qs.length}`, 6, yy, '#888', { font: 'small' }); yy += 8;
          yy += this.para(q.q, 6, yy, cw - 12, '#1a1a2a', 'main') + 6;
          q.a.forEach((opt, i) => {
            const r = { x: 6, y: yy, w: cw - 12, h: 14 }; const hv = this.hover(r);
            gfx.rrect(6, yy, cw - 12, 14, 2, hv ? '#e8f0ff' : '#f4f6fa'); gfx.frame(6, yy, cw - 12, 14, hv ? '#2557a7' : '#ccd');
            gfx.circle(13, yy + 7, 3, '#fff'); gfx.ellipseOutline(13, yy + 7, 3, 3, '#888');
            gfx.text(opt.length > 30 ? opt.slice(0, 30) + '…' : opt, 20, yy + 4, '#333', { font: 'small' });
            if (hv) ui.cursor = 'hand';
            if (this.clicked(r)) { ap.answers.push(i); ap.score += i === q.good ? 2 : i === 3 ? 0 : 1; A.sfx('tap'); inp.eat(); }
            yy += 17;
          });
        } else {
          gfx.text('All questions answered.', 6, yy, '#3a9a5a'); yy += 12;
          gfx.text('Also please confirm:', 6, yy, '#333', { font: 'small' }); yy += 10;
          ap.checks = ap.checks || [false, false, false];
          ['I am legally allowed to work in Canada', 'I am not a robot (see next step)', 'I consent to being emailed forever'].forEach((c, i) => {
            const r = { x: 6, y: yy, w: cw - 12, h: 10 }; gfx.rect(6, yy, 8, 8, '#fff'); gfx.frame(6, yy, 8, 8, '#888'); if (ap.checks[i]) gfx.text('✓', 10, yy + 1, '#2557a7', { align: 'center', font: 'small' });
            gfx.text(c, 17, yy + 1, '#333', { font: 'small' }); if (this.hover(r)) ui.cursor = 'hand'; if (this.clicked(r)) { ap.checks[i] = !ap.checks[i]; A.sfx('tap'); inp.eat(); } yy += 11;
          });
          yy += 4;
          if (this.button(6, yy, cw - 12, 12, 'Continue', { disabled: !ap.checks.every(Boolean) })) next();
          yy += 16;
        }
      } else if (step === 3) {
        gfx.text('Cover letter', 6, yy, '#333'); yy += 10;
        gfx.text('Pick a template or write your own:', 6, yy, '#555', { font: 'small' }); yy += 10;
        CH.COVER_LETTERS.forEach((cl, i) => {
          const sel = ap.letter === i; const r = { x: 6, y: yy, w: cw - 12, h: 30 };
          gfx.rrect(6, yy, cw - 12, 30, 2, sel ? '#e8f0ff' : '#f8f9fb'); gfx.frame(6, yy, cw - 12, 30, sel ? '#2557a7' : '#ccd');
          gfx.text(cl.title, 10, yy + 3, '#1a1a2a', { font: 'small' }); this.para(cl.text.slice(0, 70) + '…', 10, yy + 11, cw - 20, '#666');
          if (this.hover(r)) ui.cursor = 'hand'; if (this.clicked(r)) { ap.letter = i; A.sfx('tap'); inp.eat(); }
          yy += 33;
        });
        gfx.text('Or type your own (20+ chars):', 6, yy, '#555', { font: 'small' }); yy += 9;
        const custom = this.field('ap_letter_' + id, 6, yy, cw - 12, 12, 'Dear Hiring Manager...'); yy += 16;
        if (this.enterPressed) { this.enterPressed = false; this.focus = null; this.keyboardShown = false; }
        const ok = ap.letter >= 0 || custom.trim().length >= 20;
        if (custom.trim().length >= 20) ap.letter = -2;
        if (this.button(6, yy, cw - 12, 12, 'Continue', { disabled: !ok })) { ap.letterText = ap.letter >= 0 ? CH.COVER_LETTERS[ap.letter].text : custom; ap.score += ap.letter >= 0 ? CH.COVER_LETTERS[ap.letter].score : (/hedgehog/i.test(custom) ? 1 : 3); next(); }
        yy += 16;
      } else if (step === 4) {
        // CAPTCHA: select all porcupines
        if (!ap.captcha) { const kinds = ['porcupine', 'hedgehog', 'pinecone', 'cactus', 'porcupine', 'brush', 'porcupine', 'hedgehog', 'pineapple']; ap.captcha = CH.shuffle(kinds.slice()); ap.captchaSel = ap.captcha.map(() => false); ap.captchaFails = 0; }
        gfx.rrect(6, yy, cw - 12, 14, 2, '#4a8ad0'); gfx.text('Select all images with a', 10, yy + 2, '#fff', { font: 'small' }); gfx.text('PORCUPINE', 10, yy + 8, '#fff', { font: 'small' }); yy += 18;
        const cell = 36, gx = Math.floor((cw - cell * 3 - 4) / 2);
        for (let i = 0; i < 9; i++) {
          const cx = gx + (i % 3) * (cell + 2), cy = yy + Math.floor(i / 3) * (cell + 2);
          const r = { x: cx, y: cy, w: cell, h: cell }; const hv = this.hover(r);
          gfx.rect(cx, cy, cell, cell, '#dfe8d0');
          this.drawCaptchaIcon(g, ap.captcha[i], cx + cell / 2, cy + cell - 6, i);
          if (ap.captchaSel[i]) { gfx.frame(cx, cy, cell, cell, '#2557a7'); gfx.frame(cx + 1, cy + 1, cell - 2, cell - 2, '#2557a7'); gfx.circle(cx + 6, cy + 6, 4, '#2557a7'); gfx.text('✓', cx + 6, cy + 3, '#fff', { align: 'center', font: 'small' }); }
          if (hv) ui.cursor = 'hand';
          if (this.clicked(r)) { ap.captchaSel[i] = !ap.captchaSel[i]; A.sfx('tap'); inp.eat(); }
        }
        yy += cell * 3 + 8;
        if (ap.captchaMsg) { gfx.text(ap.captchaMsg, 6, yy, '#c8352b', { font: 'small' }); yy += 10; }
        if (this.button(6, yy, cw - 12, 12, 'VERIFY', { color: '#4a8ad0' })) {
          const ok = ap.captcha.every((k, i) => (k === 'porcupine') === ap.captchaSel[i]);
          if (ok) { A.sfx('good'); next(); }
          else { ap.captchaFails++; ap.captchaMsg = CH.pick(['Please try again.', "That's a hedgehog. You of all people.", 'Incorrect. Are you a robot?', 'Pinecones are not porcupines.']); A.sfx('error'); CH.doShake(2, 0.2); ap.captcha = CH.shuffle(ap.captcha.slice()); ap.captchaSel = ap.captcha.map(() => false); }
        }
        yy += 16;
      } else {
        // submit
        if (!d.applications[id]) {
          d.applications[id] = { status: 'pending', timer: j.delay + Math.random() * 4, score: ap.score, wrongFile: ap.wrongFile };
          S.applied[id] = 'pending'; A.sfx('good'); CH.state.stats.applications = (CH.state.stats.applications || 0) + 1;
          if (id === 'donalds') CH.flag('appliedDonalds', true);
        }
        gfx.circle(cw / 2, yy + 16, 14, '#3a9a5a'); gfx.text('✓', cw / 2, yy + 11, '#fff', { align: 'center' }); yy += 36;
        gfx.text('Application submitted!', cw / 2, yy, '#1a1a2a', { align: 'center' }); yy += 12;
        yy += this.para(`${j.company} will review your application and respond by email. Typical response time: ${j.delay} minutes.`, 6, yy, cw - 12, '#555') + 8;
        yy += this.para(CH.pick(['You feel a strange mix of hope and nausea.', 'Your paws are sweaty.', 'You refresh your inbox. Nothing. You refresh again.', 'Somewhere, a hiring manager sighs.']), 6, yy, cw - 12, '#888') + 8;
        if (this.button(6, yy, cw - 12, 12, 'Back to listings')) { st.hist = []; this.goto(st, j.site + '.ca'); }
        yy += 16;
      }
      return yy - y + 10;
    }
    drawCaptchaIcon(g, kind, x, y, seed) {
      // tiny pixel icons, similar-looking on purpose
      if (kind === 'porcupine') { gfx.ellipse(x, y - 6, 9, 6, '#8a5a3b'); gfx.ellipse(x + 6, y - 7, 4, 3.5, '#8a5a3b'); for (let i = 0; i < 7; i++) gfx.line(x - 6 + i * 2, y - 10, x - 8 + i * 2 - (i % 2), y - 16 - (i % 3), '#ead9b0'); gfx.px(x + 8, y - 8, '#000'); gfx.rect(x - 4, y - 1, 3, 2, '#5a3721'); gfx.rect(x + 3, y - 1, 3, 2, '#5a3721'); }
      else if (kind === 'hedgehog') { gfx.ellipse(x, y - 6, 9, 6, '#5a4a3a'); gfx.ellipse(x + 6, y - 6, 4, 3, '#d8b090'); for (let i = 0; i < 9; i++) gfx.line(x - 7 + i * 1.6, y - 9, x - 8 + i * 1.6, y - 13 - (i % 2), '#3a2a1a'); gfx.px(x + 8, y - 7, '#000'); gfx.px(x + 10, y - 5, '#000'); }
      else if (kind === 'pinecone') { for (let r = 0; r < 4; r++) for (let i = 0; i < 3 + r; i++) gfx.ellipse(x - (3 + r) * 1.5 + i * 3 + 1.5, y - 14 + r * 4, 1.8, 1.4, r % 2 ? '#8a5a2b' : '#6a4a1b'); gfx.rect(x, y - 16, 1, 3, '#3a5a2a'); }
      else if (kind === 'cactus') { gfx.rect(x - 3, y - 14, 6, 14, '#4f9d3a'); gfx.rect(x - 8, y - 10, 4, 2, '#4f9d3a'); gfx.rect(x - 8, y - 12, 2, 4, '#4f9d3a'); gfx.rect(x + 3, y - 8, 4, 2, '#4f9d3a'); gfx.rect(x + 6, y - 11, 2, 5, '#4f9d3a'); for (let i = 0; i < 5; i++) gfx.px(x - 2 + (i % 2) * 3, y - 12 + i * 2, '#c8e8a0'); gfx.rect(x - 5, y - 1, 10, 3, '#c86a3a'); }
      else if (kind === 'brush') { gfx.rect(x - 8, y - 5, 16, 4, '#c8a060'); for (let i = 0; i < 8; i++) gfx.rect(x - 7 + i * 2, y - 13, 1, 8, '#ead9b0'); gfx.rect(x - 1, y - 1, 3, 3, '#8a5a2b'); }
      else if (kind === 'pineapple') { gfx.ellipse(x, y - 5, 6, 6, '#f5c33b'); for (let i = 0; i < 6; i++) gfx.px(x - 4 + (i % 3) * 3, y - 8 + Math.floor(i / 3) * 4, '#c8a030'); for (let i = 0; i < 5; i++) gfx.line(x - 4 + i * 2, y - 11, x - 6 + i * 3, y - 17, '#4f9d3a'); }
    }
    // ---- MAIL --------------------------------------------------------------------------------------------
    app_mail(g, cw, ch, st, a) {
      const d = PD();
      if (st.open) {
        const m = st.open;
        this.header('Mail', '#3b6fd6', '◀ Inbox'); if (this.clicked({ x: cw - 40, y: 0, w: 40, h: 14 })) { st.open = null; inp.eat(); return; }
        let yy = 18;
        yy += this.para(m.subject, 6, yy, cw - 12, '#1a1a2a', 'main') + 2;
        gfx.text('From: ' + m.from, 6, yy, '#3b6fd6', { font: 'small' }); yy += 8; gfx.hline(6, yy, cw - 12, '#ddd'); yy += 6;
        yy += this.para(m.text, 6, yy, cw - 12, '#333') + 10;
        if (m.kind === 'interview') { gfx.rrect(6, yy, cw - 12, 22, 3, '#e8f8e8'); gfx.text('INTERVIEW: Tomorrow 10 AM', cw / 2, yy + 3, '#3a9a5a', { align: 'center', font: 'small' }); gfx.text("Donald's Burgers, 123 Main St", cw / 2, yy + 11, '#3a9a5a', { align: 'center', font: 'small' }); yy += 28; }
        if (this.button(6, yy, cw - 12, 12, 'Reply', { color: '#8899aa' })) { ui.toast('You type "thank you" and delete it four times.', '#fff', 3); } yy += 16;
        a.contentH = yy;
        return;
      }
      this.header('Mail', '#3b6fd6', d.unreadMail ? d.unreadMail + ' unread' : 'Inbox');
      let yy = 16;
      if (!d.mail.length) { gfx.text('Inbox empty.', cw / 2, yy + 20, '#888', { align: 'center', font: 'small' }); gfx.text('(Nobody wants you yet.)', cw / 2, yy + 30, '#aaa', { align: 'center', font: 'small' }); a.contentH = 60; return; }
      for (const m of d.mail) {
        this.row(yy, 26, (hv) => {
          if (!m.read) gfx.circle(6, yy + 13, 2, '#3b6fd6');
          gfx.text(m.from.length > 26 ? m.from.slice(0, 26) + '…' : m.from, 12, yy + 3, m.read ? '#555' : '#1a1a2a', { font: 'small' });
          gfx.text(m.subject.length > 30 ? m.subject.slice(0, 30) + '…' : m.subject, 12, yy + 11, m.kind === 'interview' ? '#3a9a5a' : m.kind === 'reject' ? '#c8352b' : '#333', { font: 'small' });
          gfx.text(m.text.replace(/\n/g, ' ').slice(0, 32) + '…', 12, yy + 19, '#888', { font: 'small' });
        }, () => { if (!m.read) { m.read = true; d.unreadMail = Math.max(0, d.unreadMail - 1); } st.open = m; a.scroll = 0; });
        yy += 26;
      }
      a.contentH = yy + 10;
    }
    // ---- MESSAGES -------------------------------------------------------------------------------------------
    app_messages(g, cw, ch, st, a) {
      const d = PD();
      if (!d.texts['Mom']) d.texts['Mom'] = [{ text: 'Did you eat? ♥', them: true, read: true }, { text: 'yes mom', them: false }, { text: 'what did you eat', them: true, read: true }, { text: '...pancakes', them: false }, { text: 'Good boy. Love you. Turn the game off at some point.', them: true, read: true }];
      if (st.thread) {
        const who = st.thread; const msgs = d.texts[who];
        this.header(who, '#4f9d3a', '◀'); if (this.clicked({ x: cw - 30, y: 0, w: 30, h: 14 })) { st.thread = null; inp.eat(); return; }
        let yy = 20;
        for (const m of msgs) {
          const lines = gfx.wrap(m.text, 80, 'small'); const bh = lines.length * 7 + 6; const bw = Math.min(90, Math.max(...lines.map((l) => gfx.textWidth(l, 'small'))) + 8);
          const bx = m.them ? 6 : cw - 6 - bw;
          gfx.rrect(bx, yy, bw, bh, 4, m.them ? '#e5e5ea' : '#4f9d3a');
          lines.forEach((l, i) => gfx.text(l, bx + 4, yy + 3 + i * 7, m.them ? '#222' : '#fff', { font: 'small' }));
          yy += bh + 4;
          if (!m.read && m.them) { m.read = true; d.unreadTexts = Math.max(0, d.unreadTexts - 1); }
        }
        yy += 4;
        // quick replies
        const replies = who === 'Mom' ? ["I'm okay ♥", 'Yes I ate', 'Working on it', 'Love you'] : ["Who is this?", 'Ok', '...', 'Applying now'];
        gfx.text('Quick reply:', 6, yy, '#888', { font: 'small' }); yy += 9;
        replies.forEach((r, i) => { if (this.button(6 + (i % 2) * 68, yy + Math.floor(i / 2) * 13, 64, 11, r, { color: '#8899aa' })) { CH.sendText(who, r, false); A.sfx('pop'); this.run(this.autoReply(who, r)); } });
        yy += 30;
        a.contentH = yy;
        return;
      }
      this.header('Messages', '#4f9d3a', d.unreadTexts ? d.unreadTexts + ' new' : '');
      let yy = 16;
      const threads = Object.keys(d.texts);
      for (const who of threads) {
        const msgs = d.texts[who]; const last = msgs[msgs.length - 1]; const unread = msgs.filter((m) => m.them && !m.read).length;
        this.row(yy, 24, (hv) => { gfx.circle(14, yy + 12, 8, who === 'Mom' ? '#c85a8a' : '#8899aa'); gfx.text(who[0], 14, yy + 9, '#fff', { align: 'center' }); gfx.text(who, 28, yy + 4, '#1a1a2a', { font: 'small' }); gfx.text(last.text.slice(0, 26) + (last.text.length > 26 ? '…' : ''), 28, yy + 13, '#666', { font: 'small' }); if (unread) { gfx.circle(cw - 10, yy + 12, 4, '#e83030'); gfx.text(String(unread), cw - 10, yy + 9, '#fff', { align: 'center', font: 'small' }); } }, () => { st.thread = who; a.scroll = 0; });
        yy += 24;
      }
      a.contentH = yy + 10;
    }
    *autoReply(who, r) {
      yield 2 + Math.random() * 2;
      if (who === 'Mom') {
        const rep = { "I'm okay ♥": "Good. Eat something green. Not a Blue Volt.", 'Yes I ate': 'What did you eat', 'Working on it': "I know you are, sweetheart. I'm proud of you. Even if it's just a job at that burger place. Especially if.", 'Love you': 'Love you more. Nurse says I have to sleep now. ♥' }[r] || 'ok ♥';
        CH.sendText('Mom', rep);
      } else CH.sendText(who, CH.pick(['brenda. donalds burgers. main street. big D.', 'ok.', 'k', 'the floor. is. sticky.']));
    }
    // ---- FILES ----------------------------------------------------------------------------------------------------
    app_files(g, cw, ch, st, a) {
      const d = PD();
      if (st.open === 'resume') {
        this.header('resume_final_FINAL2.pdf', '#f0a030', '◀'); if (this.clicked({ x: cw - 30, y: 0, w: 30, h: 14 })) { st.open = null; inp.eat(); return; }
        let yy = 18; gfx.rect(4, yy, cw - 8, 400, '#fff'); gfx.frame(4, yy, cw - 8, 400, '#ccc'); yy += 6;
        const R = CH.RESUME;
        gfx.text(R.name, cw / 2, yy, '#1a1a2a', { align: 'center' }); yy += 10; gfx.text(R.title, cw / 2, yy, '#555', { align: 'center', font: 'small' }); yy += 8; gfx.text(R.contact.slice(0, 34), cw / 2, yy, '#888', { align: 'center', font: 'small' }); yy += 12;
        for (const [sec, lines] of R.sections) { gfx.text(sec, 10, yy, '#3b6fd6', { font: 'small' }); gfx.hline(10, yy + 6, cw - 20, '#3b6fd6'); yy += 9; for (let l of lines) { if (l.includes('Couch Manager') && !d.resumeFixed) l = l.replace('Couch Manager', 'Couch Manger'); yy += this.para(l, 12, yy, cw - 24, '#333'); } yy += 5; }
        if (!d.resumeFixed) { gfx.text('Typo detected: "Manger"', 10, yy, '#c8352b', { font: 'small' }); yy += 8; if (this.button(10, yy, cw - 20, 11, 'Fix typo', { color: '#3a9a5a' })) { d.resumeFixed = true; A.sfx('good'); ui.toast('Fixed. Somewhere, a hiring manager relaxes.', '#8bd06a', 3); } yy += 14; }
        a.contentH = yy + 10; return;
      }
      this.header('Files', '#f0a030', 'Downloads');
      let yy = 16;
      const files = [['resume_final_FINAL2.pdf', '84 KB', 'resume'], ['resume_final.pdf', '81 KB', 'msg:An older version. It says "Couch Manger". Twice.'], ['cover_letter_template.doc', '22 KB', 'msg:"Dear [COMPANY], I am [ADJECTIVE] to apply..."'], ['blue_hedgehog_speedrun_41min.mp4', '1.2 GB', 'msg:Your personal best. Nobody has watched it. Except Gus.'], ['IMG_2019_pancakes.jpg', '2.1 MB', 'msg:A very good stack. Mom is blurry in the background, laughing.'], ['pancake_mix_coupon.pdf', '12 KB', 'msg:Save $1.00 on Maple Moose Pancake Mix. Expired.'], ['taxes_2022_DO_NOT_OPEN.zip', '9 KB', 'msg:You do not open it.'], ['ManEgg_wallpaper.png', '340 KB', 'msg:He looks so smug.']];
      for (const [name, size, act] of files) {
        this.row(yy, 16, (hv) => { const ext = name.split('.').pop(); gfx.rect(6, yy + 3, 10, 10, ext === 'pdf' ? '#c8352b' : ext === 'mp4' ? '#7b4fb0' : ext === 'jpg' || ext === 'png' ? '#3b6fd6' : '#8899aa'); gfx.text(name.length > 28 ? name.slice(0, 28) + '…' : name, 20, yy + 2, '#1a1a2a', { font: 'small' }); gfx.text(size, 20, yy + 9, '#888', { font: 'small' }); }, () => { if (act === 'resume') { st.open = 'resume'; a.scroll = 0; } else ui.toast(act.slice(4), '#fff', 3.5); });
        yy += 16;
      }
      a.contentH = yy + 10;
    }
    // ---- BANK -----------------------------------------------------------------------------------------------------
    app_bank(g, cw, ch, st, a) {
      const d = PD();
      this.header('Moosebank', '#2f7a4a', 'Chequing');
      let yy = 20;
      gfx.rrect(6, yy, cw - 12, 34, 3, '#2f7a4a'); gfx.text('Balance', 12, yy + 4, '#bfe8c8', { font: 'small' }); g.save(); g.translate(12, yy + 12); g.scale(1.5, 1.5); gfx.text(CH.fmtMoney(S.money), 0, 0, '#fff'); g.restore(); gfx.text('Quillsworth, C.  ****0142', 12, yy + 26, '#bfe8c8', { font: 'small' }); yy += 40;
      if (S.bill - S.billPaid > 0) {
        gfx.rrect(6, yy, cw - 12, 30, 3, '#fff0f0'); gfx.frame(6, yy, cw - 12, 30, '#c8352b');
        gfx.text("St. Mooseph's - amount owing", 10, yy + 3, '#c8352b', { font: 'small' }); gfx.text(CH.fmtMoney(S.bill - S.billPaid), 10, yy + 11, '#c8352b');
        const pay = Math.min(S.money, S.bill - S.billPaid);
        const canPay = pay >= 1 && S.chapter === 'career';
        if (this.button(cw - 60, yy + 16, 54, 11, canPay ? 'Pay ' + CH.fmtMoney(Math.floor(pay)) : S.chapter !== 'career' ? 'Pay (later)' : 'Pay', { color: '#c8352b', disabled: !canPay })) { const amt = Math.floor(pay); CH.addMoney(-amt); S.billPaid += amt; d.bankTx.unshift(["St. Mooseph's payment", -amt]); A.sfx('cash'); ui.toast('Paid ' + CH.fmtMoney(amt) + ' toward the bill', '#8bd06a', 3); if (S.bill - S.billPaid <= 0.5 && CH.onDebtPaid) CH.onDebtPaid(); }
        yy += 36;
      } else if (S.bill) { gfx.rrect(6, yy, cw - 12, 14, 3, '#e8f8e8'); gfx.text('Hospital bill: PAID IN FULL ♥', cw / 2, yy + 4, '#3a9a5a', { align: 'center', font: 'small' }); yy += 20; }
      gfx.text('Recent transactions', 6, yy, '#333', { font: 'small' }); yy += 9;
      for (const [name, amt] of d.bankTx.slice(0, 12)) { gfx.text(name.slice(0, 26), 8, yy, '#333', { font: 'small' }); gfx.text((amt > 0 ? '+' : '') + CH.fmtMoney(amt), cw - 8, yy, amt > 0 ? '#3a9a5a' : '#c8352b', { align: 'right', font: 'small' }); yy += 8; }
      a.contentH = yy + 10;
    }
    // ---- misc apps -----------------------------------------------------------------------------------------------------
    app_photos(g, cw, ch, st, a) {
      this.header('Photos', '#c85a8a', '3 items'); let yy = 18;
      const pics = [(x, y, w, h) => { gfx.rect(x, y, w, h, '#f8f0d8'); CH.PROPS.pancakes.draw(g, x + w / 2 - 7, y + h - 4, undefined, {}); gfx.text('pancakes', x + w / 2, y + 3, '#886', { align: 'center', font: 'small' }); },
        (x, y, w, h) => { gfx.rect(x, y, w, h, '#87ceeb'); gfx.rect(x, y + h - 8, w, 8, '#fff'); CH.drawCritter(g, x + w / 2 - 8, y + h - 6, { species: 'porcupine', outfit: 'winter', glasses: true, hair: 'bun', face: 'happy', noShadow: true, height: 0.8 }); CH.drawChubby(g, x + w / 2 + 10, y + h - 6, { outfit: 'hoodie', face: 'happy', noShadow: true, sx: 0.8, sy: 0.8 }); },
        (x, y, w, h) => { gfx.rect(x, y, w, h, '#000'); gfx.rect(x + 4, y + 4, w - 8, h - 8, '#3b6fd6'); gfx.text('99,999', x + w / 2, y + h / 2 - 3, '#f5c33b', { align: 'center', font: 'small' }); gfx.text('HI-SCORE', x + w / 2, y + 6, '#fff', { align: 'center', font: 'small' }); }];
      const caps = ['Saturday pancakes (every Saturday)', 'Winter Fair with Mom, 2 years ago', 'Screenshot: Blue Hedgehog 2 high score'];
      pics.forEach((p, i) => { p(6, yy, cw - 12, 50); gfx.text(caps[i], 6, yy + 52, '#555', { font: 'small' }); yy += 64; });
      a.contentH = yy;
    }
    app_maps(g, cw, ch, st, a) {
      this.header('Maps', '#3a9a5a', 'Moose Hollow'); let yy = 16;
      gfx.rect(0, yy, cw, 150, '#dfe8d0');
      // roads
      gfx.rect(0, yy + 70, cw, 8, '#fff'); gfx.rect(60, yy, 8, 150, '#fff'); gfx.rect(0, yy + 30, 60, 5, '#f5e6b0');
      // lake
      gfx.ellipse(30, yy + 120, 26, 16, '#9fdcff');
      for (let i = 0; i < 20; i++) gfx.tri((i * 23) % cw, yy + 10 + (i * 17) % 40, (i * 23) % cw + 6, yy + 10 + (i * 17) % 40, (i * 23) % cw + 3, yy + 2 + (i * 17) % 40, '#3a7a2c');
      gfx.circle(20, yy + 30, 4, '#c8352b'); gfx.text('Home', 20, yy + 18, '#333', { align: 'center', font: 'small' });
      gfx.circle(100, yy + 66, 4, '#c8352b'); gfx.text("Donald's", 100, yy + 54, '#333', { align: 'center', font: 'small' });
      gfx.circle(120, yy + 120, 4, '#3b6fd6'); gfx.text('Hospital', 120, yy + 108, '#333', { align: 'center', font: 'small' });
      gfx.text('Home → Donald\'s: 2.4 km, 31 min walk', 4, yy + 140, '#333', { font: 'small' });
      yy += 156; gfx.text('"Bus 12 runs every 40 min. Or never."', 6, yy, '#888', { font: 'small' }); yy += 10;
      a.contentH = yy;
    }
    app_settings(g, cw, ch, st, a) {
      this.header('Settings', '#777'); let yy = 18;
      const rows = [['Sound', CH.audio.muted ? 'Off' : 'On', () => { CH.audio.toggleMute(); }], ['Wallpaper', 'Blue Hedgehog', () => ui.toast('It stays.', '#fff', 2)], ['Storage', '127.9 GB of 128 GB used', () => ui.toast('It is all speedruns.', '#fff', 2)], ['Screen time', '14h 22m today', () => ui.toast('...', '#fff', 2)], ['About', 'MoosePhone 12 mini', () => {}], ['Save game', 'Tap to save', () => { CH.save(); A.sfx('good'); ui.toast('Game saved.', '#8bd06a', 2); }]];
      for (const [k, v, fn] of rows) { this.row(yy, 16, () => { gfx.text(k, 8, yy + 2, '#1a1a2a', { font: 'small' }); gfx.text(v, cw - 8, yy + 2, '#666', { align: 'right', font: 'small' }); }, fn); yy += 16; }
      a.contentH = yy;
    }
    app_shop(g, cw, ch, st, a) { if (CH.drawShopApp) CH.drawShopApp(this, g, cw, ch, st, a); else { this.header('Amazoon', '#f0a030'); gfx.text('Shop unlocks once you have income.', cw / 2, 40, '#888', { align: 'center', font: 'small' }); a.contentH = 60; } }
    app_donalds(g, cw, ch, st, a) { if (CH.drawDonaldsApp) CH.drawDonaldsApp(this, g, cw, ch, st, a); else { this.header("Donald's Crew", '#c8352b'); a.contentH = 40; } }
    page_moosepedia(g, cw, y, st) { gfx.rect(0, y, cw, 300, '#fff'); let yy = y + 4; gfx.text('Moosepedia', 6, yy, '#333'); yy += 12; gfx.text('Porcupine', 6, yy, '#1a1a2a', { font: 'main' }); yy += 12; yy += this.para('The North American porcupine (Erethizon dorsatum) is a large rodent with approximately 30,000 quills. Porcupines are nocturnal, solitary, and spend most of their time eating, sleeping, and being round. They cannot shoot their quills, despite what your uncle says.', 6, yy, cw - 12, '#333') + 6; yy += this.para('Notable porcupines: Chubby Quillsworth (Couch Manager, disputed).', 6, yy, cw - 12, '#888') + 6; this.link(6, yy, '[edit] (last edited by Kevin)', () => ui.toast('You add "and very handsome". It is reverted instantly.', '#fff', 3)); yy += 10; return yy - y + 10; }
    page_weather(g, cw, y, st) { gfx.rect(0, y, cw, 200, '#e8f0f8'); let yy = y + 6; gfx.text('Moose Hollow, ON', cw / 2, yy, '#333', { align: 'center' }); yy += 14; g.save(); g.translate(cw / 2, yy); g.scale(2, 2); gfx.text('-18°', 0, 0, '#1a55cc', { align: 'center' }); g.restore(); yy += 20; gfx.text('Snow. Feels like -26.', cw / 2, yy, '#555', { align: 'center', font: 'small' }); yy += 12; for (const d of ['MON  -16  snow', 'TUE  -19  snow', 'WED  -14  snow?', 'THU  -22  yes snow', 'FRI  -12  a bird']) { gfx.text(d, 10, yy, '#333', { font: 'small' }); yy += 9; } return yy - y + 10; }
    page_fans(g, cw, y, st) { gfx.rect(0, y, cw, 300, '#1a1a2a'); let yy = y + 4; gfx.text('HedgehogFans.net', 6, yy, '#3b6fd6'); yy += 12; for (const [t, r] of [['Man Egg is a misunderstood genius', 4201], ['Speedrun: 41 min (unverified, "Chubby_420")', 12], ['Kart DLC ruined my life', 890], ['Is the hedgehog blue or is the world orange', 233], ['Anyone else\'s mom in hospital? (support thread)', 56]]) { this.link(6, yy, t.slice(0, 32), () => ui.toast(t.includes('mom') ? 'You read every reply. Twice. It helps a little.' : 'You have read this thread 40 times.', '#fff', 3), '#9fdcff'); gfx.text(r + ' replies', cw - 6, yy, '#888', { align: 'right', font: 'small' }); yy += 12; } return yy - y + 10; }
    page_stmoosephs(g, cw, y, st) { gfx.rect(0, y, cw, 200, '#fff'); let yy = y + 4; gfx.text("St. Mooseph's General", 6, yy, '#3fa79a'); yy += 12; gfx.text('Billing FAQ', 6, yy, '#1a1a2a'); yy += 10; yy += this.para('Q: Why is my bill so high?\nA: Great question!\n\nQ: Are payment plans available?\nA: Yes! Most families find a way :)\n\nQ: What if I cannot find a way?\nA: :)', 6, yy, cw - 12, '#333') + 6; return yy - y + 10; }
    page_error(g, cw, y, st) { gfx.rect(0, y, cw, 120, '#fff'); gfx.text(':(', cw / 2, y + 20, '#555', { align: 'center' }); gfx.text("This site can't be reached", cw / 2, y + 36, '#333', { align: 'center', font: 'small' }); gfx.text(st.url.replace('error:', '').slice(0, 30), cw / 2, y + 46, '#888', { align: 'center', font: 'small' }); if (this.button(cw / 2 - 30, y + 60, 60, 11, 'Go to Goggle')) this.goto(st, 'goggle.ca'); return 90; }
  }
  CH.PhoneScene = PhoneScene;
  CH.openPhone = (opts) => { if (CH.game.scene && CH.game.scene.name === 'phone') return null; const p = new PhoneScene(opts); CH.game.push(p); return p; };

  // hotkey: open phone from any world scene once Chubby owns one
  const wsUpdate = CH.WorldScene.prototype.update;
  CH.WorldScene.prototype.update = function (dt) {
    wsUpdate.call(this, dt);
    CH.tickPhone(dt);
    if (CH.flag('hasPhone') && !this.locked && !ui.busy() && inp.hit('phone') && this.allowPhone !== false) { inp.eat(); CH.openPhone(); }
  };

  // ================================ JOB SEARCH CHAPTER =============================================
  CH.startJobSearch = () => {
    const cabin = new CH.CabinScene({ mode: 'home', momPresent: false, playerX: 60 });
    cabin.tvMode = 'off'; cabin.fire.st.lit = false; cabin.bgDirty = true;
    cabin.pancakes.st.eaten = true; cabin.stove.st.steam = false; cabin.stove.st.pan = false;
    S.hour = 8; S.chapter = 'jobsearch';
    // wardrobe in the bedroom
    cabin.wardrobe = cabin.addCustom((g, x, y, t, st) => {
      gfx.rect(x, y - 60, 36, 60, CH.PAL.wood0); gfx.rect(x + 2, y - 58, 15, 56, CH.PAL.wood1); gfx.rect(x + 19, y - 58, 15, 56, CH.PAL.wood1);
      gfx.frame(x + 4, y - 54, 11, 48, CH.PAL.wood0); gfx.frame(x + 21, y - 54, 11, 48, CH.PAL.wood0); gfx.px(x + 16, y - 30, CH.PAL.amber); gfx.px(x + 19, y - 30, CH.PAL.amber);
      if (st.open) { gfx.rect(x + 2, y - 58, 32, 56, '#2a1a10'); gfx.rect(x + 6, y - 50, 6, 20, '#2a3350'); gfx.rect(x + 14, y - 50, 6, 20, '#2f8f7a'); gfx.rect(x + 22, y - 50, 6, 20, '#2f8f7a'); gfx.rect(x + 4, y - 54, 28, 1, '#888'); }
    }, 236, cabin.floorY, 36, 60, { id: 'wardrobe', hint: 'Wardrobe', anim: true, st: { open: false }, interact: () => wardrobeCo(cabin) });
    // smartphone on nightstand
    cabin.smartphone = cabin.addCustom((g, x, y, t) => { gfx.rect(x, y - 3, 8, 3, '#1a1a24'); gfx.rect(x + 1, y - 3, 6, 1, '#6fb0ff'); if (Math.sin(t * 3) > 0.5) gfx.px(x + 7, y - 4, '#4f4'); }, 92, cabin.floorY - 16, 8, 4, { id: 'smartphone', hint: 'Smartphone', anim: true, interact: () => pickUpPhone(cabin), range: 30 });
    cabin.onSleep = function* () { yield* sleepCo(cabin); };
    cabin.onLeave = function* () { yield ui.say('Chubby', CH.flag('gotInterview') ? "The interview is tomorrow. I should sleep first. {p}Sleep. What a concept." : "Go outside? To do what, hand out resumes? {p}I have a phone. Phones were invented so I wouldn't have to do that."); };
    cabin.onFridge = function* () { if (S.hunger > 30) { A.sfx('eat'); S.hunger = Math.max(0, S.hunger - 40); yield ui.say('Chubby', "Cold leftover pancakes. {p}They taste like Saturday. {pp}I eat them standing up, like a raccoon."); } else yield ui.say('Chubby', "Not hungry. {p}That has literally never happened before."); };
    cabin.onCouch = function* () { yield ui.say('Chubby', "The couch. {pp}...Not today. I have a job to find. {p}Wow. Who said that. Was that me?"); };
    cabin.onTV = function* () { yield ui.say('Chubby', "The game is still paused where I left it. {pp}It can wait. {p}It'll have to."); };
    cabin.onMomDoor = function* () { A.sfx('door'); yield 0.5; yield ui.say('Chubby', "Her bed is made. Her slippers are lined up. {pp}The room is exactly how she left it, and it's so quiet I can hear the fridge from here.", { face: 'sad' }); };
    CH.game.set(cabin);
    cabin.run(jobSearchIntro(cabin));
  };

  function* jobSearchIntro(cabin) {
    const pl = cabin.player;
    cabin.locked = true; ui.objectiveShown = false; fx.setFade(1);
    pl.x = 50; pl.face = 'tired'; pl.outfit = 'hoodie'; S.outfit = 'hoodie';
    yield 0.5;
    yield fx.showCard('DAY 2', 'Sunday  -  8:00 AM  -  The cabin is very quiet.', 3, '#e8e0c8');
    yield fx.fadeIn(1.5);
    yield ui.say('Chubby', "I didn't sleep. {p}I lay there doing math. {pp}Eighty-four thousand divided by twelve fifty is... a lot of vending machine chips.", { face: 'tired' });
    yield ui.say('Chubby', "Okay. Step one. Mom always says: 'Dress for the job you want.' {p}I want a job. Any job. So I'll dress like... {p}a job.", { face: 'focused' });
    ui.objectiveShown = true; ui.setObjective('Change into something professional (wardrobe)');
    ui.showMoney = true;
    cabin.locked = false;
  }
  function* wardrobeCo(cabin) {
    const pl = cabin.player;
    if (S.outfit === 'suit') { yield ui.say('Chubby', "I'm already wearing the suit. {p}It hasn't gotten any less tight in the last five minutes."); return; }
    cabin.locked = true; cabin.wardrobe.st.open = true; A.sfx('door');
    yield 0.6;
    yield ui.say('Chubby', "My graduation suit. {p}From... {p}a while ago. {pp}Here goes.", { face: 'worried' });
    // change animation: poof
    pl.hidden = true;
    for (let i = 0; i < 12; i++) { cabin.particles.burst(pl.x, pl.y - 15, 6, { color: ['#2f8f7a', '#2a3350', '#f4f1ea', '#c8352b'], speed: 70, life: 0.6, grav: 60 }); A.sfx('paper'); yield 0.12; }
    CH.doShake(2, 0.2); A.sfx('pop');
    pl.outfit = 'suit'; S.outfit = 'suit'; pl.hidden = false; pl.squashX.x = 1.35; pl.squashY.x = 0.7; pl.jiggle.kick(80);
    yield 0.2; A.sfx('snap'); // a button pops
    cabin.particles.add({ x: pl.x + 4, y: pl.y - 12, vx: 90, vy: -120, life: 1.2, color: '#f2c94c', size: 2, grav: 400, floorY: pl.y });
    yield 1.0;
    yield ui.say('Chubby', "...", { face: 'worried', auto: 1.5, noSkip: true });
    yield ui.say('Chubby', "It doesn't make me look less chubby. {p}It makes me look like a chubby lawyer. {pp}A button just left. It's gone. I heard it hit the wall.", { face: 'worried' });
    yield ui.say('Chubby', "Whatever. Nobody sees you on the phone. {p}Step two: the phone. It's on the nightstand, if the nightstand hasn't been repossessed yet.", { face: 'focused' });
    ui.setObjective('Grab your smartphone from the nightstand');
    cabin.wardrobe.st.open = false;
    cabin.locked = false;
  }
  function* pickUpPhone(cabin) {
    const pl = cabin.player;
    if (S.outfit !== 'suit') { yield ui.say('Chubby', "My phone. 12% battery, 400 unread forum notifications. {p}Suit first. Mom's rules."); cabin.smartphone.used = false; return; }
    cabin.locked = true; pl.arm = 'phone'; A.sfx('pop');
    cabin.smartphone.hidden = true;
    CH.flag('hasPhone', true);
    yield ui.say('Chubby', "Okay. Phone. Browser. 'Jobs near me'. {p}How hard can it be. People do this every day. {pp}People I've never met, sure. But people.", { face: 'focused' });
    ui.setObjective('Search for jobs on your phone (press I) and apply');
    ui.setHint('Press I any time to use the phone', 5);
    pl.arm = 'idle';
    cabin.locked = false;
    const ph = CH.openPhone();
    // watch for interview mail
    cabin.run(jobSearchWatch(cabin));
  }
  function* jobSearchWatch(cabin) {
    while (!CH.flag('gotInterview')) {
      // time passes while job hunting
      yield 1;
    }
    yield () => CH.game.scene === cabin && !ui.busy();
    yield 0.5;
    const pl = cabin.player;
    cabin.locked = true;
    pl.face = 'shock'; pl.doEmote('!', 2); A.sfx('good');
    yield ui.say('Chubby', "Wait. WAIT. {p}'INTERVIEW - Donald's Burgers - TOMORROW 10 AM'.", { face: 'shock' });
    yield ui.say('Chubby', "Somebody wants to talk to me. {p}In person. {p}About a job. {pp}...I need to sleep. I need to sleep so much. I need to be a person by 10 AM.", { face: 'worried' });
    ui.setObjective('Go to bed. Interview tomorrow at 10 AM!');
    S.chapter = 'interview'; CH.save();
    cabin.locked = false;
  }
  function* sleepCo(cabin) {
    const pl = cabin.player;
    if (!CH.flag('gotInterview')) { yield ui.say('Chubby', "Can't sleep yet. {p}Not until somebody, anybody, says yes. {pp}Or until the phone dies. Whichever's first."); return; }
    cabin.locked = true;
    yield ui.say('Chubby', "Alarm set for 7. {p}And 7:05. {p}And 7:10. {p}And 7:11, just in case.", { face: 'tired' });
    A.stop(1);
    yield fx.fadeOut(2);
    yield 0.8;
    if (CH.startInterviewDay) CH.startInterviewDay();
  }

  CH.SCENES.jobsearch = () => { CH.flag('hasPhone', true); S.outfit = 'suit'; S.chapter = 'jobsearch'; const c = new CH.CabinScene({ mode: 'home', momPresent: false, playerX: 300 }); c.enter = function () { CH.audio.play('cabin'); CH.openPhone(); }; return c; };
})(window.CH);
