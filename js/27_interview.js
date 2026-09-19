// ============================================================================
// INTERVIEW at Donald's Burgers: timed, awkward, choice-based
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, fx = CH.fx, A = CH.audio, inp = CH.input, S = CH.state, P = CH.PAL;
  const W = CH.W, H = CH.H;

  const QUESTIONS = [
    { q: 'So. Chubby. Tell me about yourself.', a: [["I'm a hard worker who's eager to learn.", 2, 'Mm-hm. Everybody says that. Kevin said that.'], ["I live with my mom and I'm very good at video games.", 1, "...Okay. Honest. I'll take honest."], ["My mom's in the hospital. I need this. I will mop anything you point at.", 3, "...Okay. {p}Okay. That's a real answer. I like real answers."], ["I'm round.", 0, "I can see that, hon."]] },
    { q: "Why do you want to work at Donald's?", a: [['I love burgers.', 1, 'Everybody loves burgers. Cows love burgers, probably.'], ["Your posting said 'must have a pulse.' I have one. I checked twice.", 2, "Good. You'd be surprised."], ["Because you're hiring and I'm desperate. Also, I do love burgers.", 3, "Desperate and honest. That's basically the job description."], ['Wait, is this the M one or the D one?', 0, "IT'S THE D. It has ALWAYS been the D."]] },
    { q: 'Where do you see yourself in five years?', a: [['Managing this restaurant.', 2, "Ha. Bold. I like bold. Don't do it again."], ['Alive.', 1, "Low bar. Reachable. I respect a reachable bar."], ['With my mom home and healthy. Anything after that is a bonus.', 3, "...{p}Yeah. {p}Yeah, okay."], ['Beating my 41-minute speedrun.', 0, 'I have no idea what that means and I am afraid to ask.']] },
    { q: 'Describe a time you dealt with a mess.', a: [['I once mopped up a spilled Blue Volt with a sock.', 1, "A sock. {p}We have mops here. Real ones."], ["I've never handled a mess. I've created many. I'm ready to switch sides.", 3, "Switch sides. {p}Ha! Okay. I'll remember that."], ['I organized 34 video games alphabetically.', 2, "That's... organized. Sure. That counts."], ['Which mess? There have been so many.', 0, "That's not the flex you think it is, hon."]] },
    { q: "A customer yells that their fries are cold. What do you do?", a: [['Apologize and get them fresh fries. Immediately.', 3, "Correct. That's the whole job. Fries, fast, sorry."], ['Yell back, but respectfully.', 0, "There is no respectful yelling. I've tried."], ["Explain that in Canada, fries are supposed to be cold.", 1, "...Do NOT say that to a customer."], ['Get you.', 2, "Fair. That's what I'm here for. Mostly."]] },
    { q: 'Can you work weekends?', a: [['Yes.', 3, 'Short answer. Good answer.'], ['Which days are the weekends?', 1, "Saturday and Sunday, sweetheart. The days you play games."], ["Saturday is pancake day with my mom... {p}but yes. Yes.", 2, "Pancakes. {p}You can have Saturday mornings. Sometimes. Don't tell Tammy."], ['No.', 0, "Then why are you HERE."]] },
    { q: "Last one. What's your greatest weakness?", a: [['I care too much.', 1, "That's from a website. I read the same website."], ['Stairs.', 2, "Ha! Good news: one floor."], ["I've never had a job and I'm scared I'll be bad at it. {p}But I'll show up. Every day.", 3, "...{pp}Showing up is ninety percent of it, hon. The other ten is the mop."], ['Fries. Specifically yours.', 1, "Flattery. Cheap. {p}Effective."]] },
  ];

  // ==========================================================================
  // BACK OFFICE ART
  // One window, no daylight, a fluorescent tube that never quite settles, and
  // a clock the player learns to hate. Free-standing objects go through
  // art.blit so each one gets the house ink line.
  // ==========================================================================
  const art = CH.art;
  const MCAB = art.mat('#8d94a4', { dark: -30, light: 24 });
  const MWOOD = art.mat('#8a6a40', { dark: -32, light: 26 });
  const MCARD = art.mat('#bb9459', { dark: -30, light: 22 });
  const MPOT = art.mat('#b4603c', { dark: -32, light: 24 });
  const MSTEEL = art.mat('#a7aebc', { dark: -34, light: 26 });
  const WALL = { hi: '#d3c8a2', mid: '#c7bb93', lo: '#ab9f7a', rail: '#8a6a40', base: '#6d5c3f' };

  // ---- wall-mounted ----------------------------------------------------------
  function motivationalPoster(x, y, w, h, t) {
    gfx.rect(x + 2, y + 2, w, h, 'rgba(30,24,16,0.25)');
    gfx.vgrad(x, y, w, h - 15, ['#3f6ea8', '#6c9acb', '#9dc2e2', '#c9dcec']);
    gfx.circle(x + w - 14, y + 11, 5, '#fdf3c8');
    gfx.tri(x + 4, y + h - 15, x + 38, y + h - 15, x + 21, y + 9, '#e6eef4');
    gfx.tri(x + 8, y + h - 15, x + 30, y + h - 15, x + 21, y + 14, '#f8fbfe');
    gfx.tri(x + 28, y + h - 15, x + w, y + h - 15, x + 50, y + 16, '#aec4d6');
    gfx.rect(x, y + h - 15, w, 15, '#141a24');
    gfx.text('SYNERGY', x + w / 2, y + h - 13, '#f5c33b', { align: 'center' });
    gfx.text('TRY HARDER', x + w / 2, y + h - 6, '#9fb2c4', { align: 'center', font: 'small' });
    gfx.frame(x, y, w, h, '#7b7157');
    // the corner has been curling since before Kevin
    const c = 13 + Math.sin(t * 0.7) * 1.2;
    gfx.tri(x + w - c, y + h - 1, x + w - 1, y + h - c, x + w - 1, y + h - 1, WALL.lo);
    gfx.tri(x + w - c, y + h - 1, x + w - 1, y + h - c, x + w - c + 5, y + h - c + 5, '#efe6cf');
    gfx.line(x + w - c, y + h - 1, x + w - 1, y + h - c, '#8d8368');
    gfx.line(x + w - c + 1, y + h - 2, x + w - 2, y + h - c + 1, '#cfc3a6');
    // tape at the top corners
    gfx.rect(x - 2, y - 2, 8, 4, 'rgba(240,240,230,0.55)');
    gfx.rect(x + w - 6, y - 2, 8, 4, 'rgba(240,240,230,0.55)');
  }

  function framedPhoto(g, x, y, w, h, t) {
    gfx.rect(x + 2, y + 2, w, h, 'rgba(30,24,16,0.25)');
    gfx.rect(x, y, w, h, '#c8352b');
    gfx.rect(x + 3, y + 3, w - 6, h - 6, '#f6f2e6');
    gfx.text('EMPLOYEE OF', x + w / 2, y + 6, '#c8352b', { align: 'center', font: 'small' });
    gfx.text('THE MONTH', x + w / 2, y + 13, '#c8352b', { align: 'center', font: 'small' });
    CH.drawCritter(g, x + w / 2, y + h - 6, { species: 'raccoon', outfit: 'cook', noShadow: true, height: 0.55, width: 0.65, face: 'happy' });
    gfx.line(x + 5, y + 20, x + w - 6, y + h - 5, '#c8352b');
    gfx.line(x + 5, y + h - 5, x + w - 6, y + 20, '#c8352b');
    gfx.text('KEVIN', x + w / 2, y + h - 9, '#8f2419', { align: 'center', font: 'small' });
    gfx.frame(x, y, w, h, '#7d1f16');
  }

  function safetySign(x, y, w, h) {
    gfx.rect(x + 2, y + 2, w, h, 'rgba(30,24,16,0.22)');
    gfx.rect(x, y, w, h, '#f5c33b');
    gfx.rect(x, y, w, 4, '#8f2419');
    gfx.frame(x, y, w, h, '#8f6a14');
    gfx.text('SAFETY FIRST', x + w / 2, y + 6, '#8f2419', { align: 'center', font: 'small' });
    gfx.text('DAYS SINCE', x + w / 2, y + 14, '#5a3a1a', { align: 'center', font: 'small' });
    gfx.text('FRYER FIRE', x + w / 2, y + 20, '#5a3a1a', { align: 'center', font: 'small' });
    gfx.rect(x + w / 2 - 7, y + 26, 14, 11, '#fdf8e8');
    gfx.frame(x + w / 2 - 7, y + 26, 14, 11, '#8f6a14');
    gfx.text('0', x + w / 2, y + 28, '#c8352b', { align: 'center' });
  }

  // The clock. Hands come from the game hour; when a choice timer is running it
  // reddens, jitters and the seconds sprint.
  function wallClock(cx, cy, r, hour, t, urg) {
    const jit = urg > 0 ? Math.round(Math.sin(t * 34) * urg * 1.4) : 0;
    const R = r + 5;
    art.blit(cx + jit, cy, R * 2, R * 2, R, R, () => {
      gfx.circle(R, R, r + 1, '#3b3340');
      gfx.circle(R, R, r, '#6d6470');
      gfx.circle(R, R, r - 2, '#22202a');
      gfx.circle(R, R, r - 3, urg > 0 ? gfx.mix('#f7f2e2', '#ffb8ae', urg * 0.8) : '#f7f2e2');
      gfx.ellipse(R - r * 0.32, R - r * 0.42, r * 0.36, r * 0.24, '#fffdf4');
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
        const big = i % 3 === 0;
        const r0 = r - (big ? 8 : 6), r1 = r - 4;
        gfx.line(R + Math.cos(a) * r0, R + Math.sin(a) * r0, R + Math.cos(a) * r1, R + Math.sin(a) * r1, big ? '#2a2430' : '#6b6472');
      }
      if (urg > 0) { // the minutes you have left, burning off the rim
        const n = Math.max(0, Math.round(urg * 20));
        for (let i = 0; i < n; i++) {
          const a = (i / 20) * Math.PI * 2 - Math.PI / 2;
          gfx.px(R + Math.cos(a) * (r - 2), R + Math.sin(a) * (r - 2), Math.sin(t * 18) > 0 ? '#ff4040' : '#ffa0a0');
        }
      }
      const hA = ((hour % 12) / 12) * Math.PI * 2 - Math.PI / 2;
      const mA = (hour % 1) * Math.PI * 2 - Math.PI / 2;
      gfx.line(R, R, R + Math.cos(hA) * (r - 10), R + Math.sin(hA) * (r - 10), '#2a2430');
      gfx.line(R, R, R + Math.cos(hA) * (r - 11), R + Math.sin(hA) * (r - 11) - 1, '#2a2430');
      gfx.line(R, R, R + Math.cos(mA) * (r - 6), R + Math.sin(mA) * (r - 6), '#2a2430');
      const sA = Math.floor(t * (urg > 0 ? 5 : 1)) * (Math.PI * 2 / 60) - Math.PI / 2;
      gfx.line(R, R, R + Math.cos(sA) * (r - 5), R + Math.sin(sA) * (r - 5), '#c8352b');
      gfx.circle(R, R, 2, '#2a2430'); gfx.px(R, R, '#c8352b');
    });
  }

  function calendar(x, y, t) {
    gfx.rect(x + 1, y + 1, 22, 26, 'rgba(30,24,16,0.25)');
    gfx.rect(x, y, 22, 26, '#f6f2e6');
    gfx.rect(x, y, 22, 7, '#c8352b');
    gfx.text('MAR', x + 11, y + 1, '#fff', { align: 'center', font: 'small' });
    for (let r0 = 0; r0 < 4; r0++) for (let c = 0; c < 6; c++) gfx.px(x + 4 + c * 3, y + 10 + r0 * 4, r0 === 1 && c === 2 ? '#c8352b' : '#9a9282');
    if (Math.sin(t * 2) > 0) gfx.rect(x + 3, y + 13, 3, 3, '#c8352b');
    gfx.frame(x, y, 22, 26, '#8f877a');
    gfx.px(x + 11, y - 1, '#6b6472');
  }

  // ---- free-standing ---------------------------------------------------------
  function filingCabinet(x, y) {
    const w = 38, h = 58, m = MCAB;
    art.blit(x, y, w + 4, h + 4, 2, h + 2, () => {
      const X = 2, Y = 2;
      gfx.rect(X, Y, w, h, m.base);
      gfx.rect(X, Y, w, 2, m.l);
      gfx.rect(X + w - 4, Y, 4, h, m.d);
      for (let i = 0; i < 3; i++) {
        const dy = Y + 3 + i * 18;
        gfx.rect(X + 2, dy, w - 8, 16, i === 0 ? m.l : m.base);
        gfx.rect(X + 2, dy, w - 8, 1, gfx.shade(m.l, 16));
        gfx.rect(X + 2, dy + 15, w - 8, 1, m.dd);
        gfx.rect(X + 11, dy + 7, 13, 3, m.dd); gfx.rect(X + 11, dy + 7, 13, 1, m.l);
        gfx.rect(X + 4, dy + 5, 6, 5, '#ede7d6'); gfx.hline(X + 5, dy + 7, 4, '#9a92a0');
      }
      // the top drawer never shuts: paper edges and a wedge of shadow
      gfx.rect(X + 2, Y + 1, w - 8, 3, '#1d1a24');
      for (let i = 0; i < 4; i++) gfx.rect(X + 5 + i * 7, Y - 1, 5, 3, '#efe9d8');
      gfx.rect(X + 6, Y + h - 22, 5, 4, gfx.shade(m.d, -8)); // dent
      gfx.rect(X, Y + h - 3, w, 3, m.dd);
    });
  }

  function coffeeMaker(x, y, t) {
    art.blit(x, y, 26, 24, 2, 22, () => {
      gfx.rect(2, 2, 20, 20, '#2b2a33'); gfx.rect(2, 2, 20, 2, '#4a4854');
      gfx.rect(4, 4, 14, 7, '#3b3a45');
      gfx.rect(5, 13, 14, 8, '#f0efe8');
      gfx.rect(6, 16, 12, 5, '#5a3a1a'); gfx.rect(6, 16, 12, 1, '#7c5028');
      gfx.rect(18, 14, 4, 5, '#f0efe8');
      gfx.px(20, 5, Math.sin(t * 3) > 0 ? '#ff5a4a' : '#5a1a14');
      gfx.rect(4, 21, 16, 2, '#4a4854');
    });
    if (Math.sin(t * 0.9) > 0.3) for (let i = 0; i < 2; i++) { const k = (t * 0.6 + i * 0.5) % 1; gfx.px(x + 12 + Math.round(Math.sin(t * 2 + i) * 2), y - 24 - k * 9, `rgba(255,255,255,${(0.5 - k * 0.5).toFixed(2)})`); }
  }

  function dyingPlant(x, y, t) {
    const sway = Math.sin(t * 0.6) * 1.1;
    art.blit(x, y, 36, 54, 18, 52, () => {
      const p = MPOT;
      gfx.rect(10, 36, 16, 15, p.d); gfx.rect(11, 36, 13, 14, p.base);
      gfx.rect(11, 36, 4, 14, p.l);
      gfx.rect(8, 32, 20, 5, p.l); gfx.rect(8, 32, 20, 1, gfx.shade(p.l, 18)); gfx.rect(8, 36, 20, 1, p.dd);
      gfx.rect(10, 34, 16, 2, '#4a3520');
      gfx.line(18, 34, 18, 14, '#7b7a3a');
      gfx.line(18, 22, 11 + sway, 28, '#8a7434');
      gfx.line(18, 26, 25 - sway, 31, '#8a7434');
      gfx.line(18, 18, 24, 13, '#6f8a3e');
      gfx.ellipse(10 + sway, 29, 4.5, 2.4, '#96702a');
      gfx.ellipse(26 - sway, 32, 4.5, 2.4, '#7f5f24');
      gfx.ellipse(25, 12, 4, 2.8, '#6f8a3e'); gfx.ellipse(25, 11, 3, 1.8, '#86a34c');
      gfx.ellipse(14, 17, 3.4, 2, '#8a7434');
    });
    gfx.ellipse(x + 15, y + 1, 3.2, 1.2, '#8a6a2a');
    gfx.ellipse(x - 9, y, 2.6, 1, '#7f5f24');
  }

  function boxStack(x, y) {
    art.blit(x, y, 46, 40, 2, 38, () => {
      const m = MCARD;
      gfx.rect(2, 16, 34, 22, m.base); gfx.rect(2, 16, 34, 2, m.l); gfx.rect(2, 36, 34, 2, m.d);
      gfx.rect(2, 24, 34, 1, m.d);
      gfx.text('CUPS', 19, 27, '#6d4c22', { align: 'center', font: 'small' });
      gfx.rect(6, 0, 30, 17, m.l); gfx.rect(6, 0, 30, 2, gfx.shade(m.l, 16)); gfx.rect(6, 15, 30, 2, m.base);
      gfx.rect(10, -2, 10, 4, m.d); gfx.rect(24, -2, 9, 4, m.d);
      gfx.text('NAPKIN', 21, 6, '#6d4c22', { align: 'center', font: 'small' });
    });
  }

  function waterStain(x, y, w, h) {
    gfx.ellipse(x, y, w, h, 'rgba(126,104,62,0.30)');
    gfx.ellipse(x + 3, y + 1, w * 0.7, h * 0.7, 'rgba(112,90,52,0.28)');
    gfx.ellipseOutline(x, y, w, h, 'rgba(98,78,44,0.35)');
  }

  class InterviewScene extends CH.Scene {
    constructor() {
      super(); this.name = 'interview';
      this.brenda = CH.makeBrenda(300, 190); this.brenda.pose = 'sit'; this.brenda.flip = true; this.brenda.arm = 'clipboard';
      this.chubby = new CH.Chubby(190, 194); this.chubby.outfit = 'suit'; this.chubby.sitting = true; this.chubby.face = 'worried'; this.chubby.arm = 'belly'; this.chubby.flip = false;
      this.score = 0; this.maxScore = QUESTIONS.length * 3 + 6; this.sweat = 0; this.timeouts = 0;
      this.particles = new CH.Particles();
      this.handshake = null; // {t, dir, result}
      this.mopVisible = true; this.bgStatic = null;
      this.walkie = 0;
    }
    enter() { fx.setFade(1); A.play('restaurant', 1.5); this.run(this.flow()); ui.setObjective(''); }
    // ---- flow ----
    *flow() {
      const B = (t, o = {}) => { this.brenda.talk = true; return ui.say('Brenda', t, Object.assign({ voice: 'blip2' }, o)); };
      const C = (t, o = {}) => ui.say('Chubby', t, Object.assign({ face: this.chubby.face }, o));
      this.chubby.hidden = true;
      yield fx.fadeIn(1.2);
      yield 0.6;
      yield B("You must be Chubby. {p}Sit. {p}Not there, that's Kevin's chair. Kevin quit. {p}Fine, sit there.");
      this.brenda.talk = false;
      this.chubby.hidden = false; this.chubby.x = 120; this.chubby.sitting = false; this.chubby.y = 214;
      // walk in
      while (this.chubby.x < 186) { this.chubby.vx = 60; this.chubby.x += 1; yield 1 / 60; }
      this.chubby.vx = 0;
      yield 0.3;
      // handshake QTE
      yield B("Handshake first. I judge people by handshakes. {p}Everybody does. They just don't say it.");
      this.brenda.talk = false;
      const hs = yield* this.handshakeQTE();
      this.score += hs;
      yield 0.5;
      this.chubby.sitting = true; this.chubby.y = 194; this.chubby.arm = 'belly'; A.sfx('couch');
      yield 0.5;
      yield B(S.interviewLate ? "You're late. {p}I noticed. {p}Everyone starts with a strike. You start with two." : "You're on time. {p}Kevin was never on time. {p}Point for you.");
      this.brenda.talk = false;
      if (S.interviewLate) this.score -= 1; else this.score += 1;
      yield B("Seven questions. Answer fast. I've got a lunch rush in forty minutes and a fryer that thinks it's a volcano.");
      this.brenda.talk = false;
      ui.setHint('Answer before the timer runs out!', 3);
      for (let i = 0; i < QUESTIONS.length; i++) {
        const Q = QUESTIONS[i];
        this.brenda.talk = true;
        yield ui.say('Brenda', Q.q, { voice: 'blip2', auto: 1.6 });
        this.brenda.talk = false;
        const timer = Math.max(6, 11 - i * 0.5 - this.sweat * 2);
        const c = yield ui.choose('Chubby', Q.q, Q.a.map((a) => a[0]), { timer });
        if (c < 0) {
          this.timeouts++; this.sweat = Math.min(1, this.sweat + 0.3);
          const blurt = CH.pick(["...pancakes.", "I— what? Sorry. What was— sorry.", "BLUE HEDGEHOG. {p}Sorry. Reflex.", "*silence* {p}*more silence*", "Can you repeat the— no, I heard it. I just— um."]);
          yield C(blurt, { face: 'shock' });
          yield B(CH.pick(["...Okay. Moving on.", "I'll put you down for 'undecided'.", "Take a breath, hon. You're turning a colour."]));
          this.brenda.talk = false;
        } else {
          const [txt, pts, reply] = Q.a[c];
          this.score += pts;
          if (pts >= 3) { this.chubby.setFace('happy', 2); this.particles.text(190, 150, '+' + pts, '#8bd06a'); A.sfx('good'); }
          else if (pts === 0) { this.sweat = Math.min(1, this.sweat + 0.2); this.chubby.setFace('worried', 2); this.particles.text(190, 150, '...', '#ff8080'); A.sfx('error'); }
          else { this.particles.text(190, 150, '+' + pts, '#f5c33b'); }
          yield B(reply);
          this.brenda.talk = false;
        }
        // awkward events between questions
        if (i === 1) yield* this.eventStomach();
        if (i === 3) yield* this.eventWalkie();
        if (i === 4) yield* this.eventPhone();
        if (i === 5) yield* this.eventMint();
      }
      yield 0.5;
      yield B("Okay. {p}Give me a second.");
      this.brenda.talk = false;
      this.brenda.arm = 'clipboard';
      for (let i = 0; i < 4; i++) { A.sfx('paper'); yield 0.6; }
      yield ui.say('', 'Brenda writes. Brenda underlines. Brenda circles something twice.', { color: '#cfc8e8', auto: 3 });
      yield 0.8;
      const ratio = this.score / this.maxScore;
      let tier = ratio >= 0.72 ? 'great' : ratio >= 0.42 ? 'ok' : 'poor';
      S.interviewScore = Math.round(ratio * 100); S.interviewTier = tier;
      yield B("So here's the thing, Chubby.");
      this.brenda.talk = false;
      yield 0.8;
      if (tier === 'great') { yield B("That was, honestly, one of the better interviews I've done. {p}You were weird. But you were real. Real is rare."); }
      else if (tier === 'ok') { yield B("That was... fine. {p}A few of those answers were strange. One of them was about a sock. But you showed up. You sat in Kevin's chair. You survived."); }
      else { yield B("That was one of the worst interviews I have ever conducted. {p}And I've interviewed a raccoon that turned out to be two raccoons."); }
      this.brenda.talk = false;
      yield 1.0;
      yield B("You're hired.");
      this.brenda.talk = false;
      this.chubby.setFace('shock', 3); this.chubby.doEmote('!', 2); A.sfx('fanfare');
      yield 1.2;
      yield C("I— {p}really? {p}REALLY? Wait— as what?", { face: 'shock' });
      yield 1.2;
      yield B("Janitor.");
      this.brenda.talk = false;
      yield 1.5;
      yield C("...", { face: 'normal', auto: 1.5, noSkip: true });
      yield B(tier === 'great' ? "Everybody starts as janitor. Even me. Especially me. {p}You do well, you move up. Bagging, fries, grill. There's a whole ladder. It goes surprisingly high. {p}There's a tower." : tier === 'ok' ? "Kevin quit. The floor is sticky. You were the only applicant with a pulse. {p}Do well, you move up. Bagging, fries, grill. There's a ladder." : "Kevin quit. The floor is sticky. You were the only applicant. {p}Don't talk to customers. Don't touch the grill. Don't look at the fryer. Just mop.");
      this.brenda.talk = false;
      yield B("Fifteen fifty an hour. Start tomorrow, 8 AM. Uniform's in the back, we'll find your size. {p}...We'll find something close to your size.");
      this.brenda.talk = false;
      // uniform
      A.sfx('paper');
      yield ui.say('', 'Brenda slides a red polo shirt, a visor, and a name tag across the desk. The name tag says KEVIN with KEVIN crossed out.', { color: '#cfc8e8' });
      if (tier === 'great') { CH.addMoney(25); yield B("And here. Twenty-five bucks on a Donald's gift card. Signing bonus. Don't tell corporate."); this.brenda.talk = false; S.reputation += 2; }
      else if (tier === 'ok') { CH.addMoney(10); yield B("Ten bucks on a Donald's card. Eat something. You look like you haven't since the Blue Volt."); this.brenda.talk = false; S.reputation += 1; }
      this.chubby.face = 'happy';
      yield C("Thank you. {p}Thank you, Brenda. I— {p}I won't let you down.", { face: 'happy' });
      yield B("You will. {p}Everybody does. {p}Just mop while you do it.");
      this.brenda.talk = false;
      yield 0.8;
      S.job = 'janitor'; S.jobLevel = 0; S.chapter = 'career'; S.outfit = 'hoodie'; S.hour = 11;
      CH.sendText('Mom', "How did it go?? The nurse says I can't text so I'm texting. ♥");
      CH.autosave('Autosaved');
      A.stop(1);
      yield fx.fadeOut(1.5);
      yield fx.showCard('HIRED', "Janitor  -  Donald's Burgers  -  $15.50/hr", 3.5, '#f5c33b');
      if (CH.startCareer) CH.startCareer(); else CH.game.set(new CH.TitleScene());
    }
    *handshakeQTE() {
      this.handshake = { t: 0, pos: 0, dir: 1, result: null, active: true };
      ui.setHint('Press E when the marker is in the green zone!', 4);
      this.chubby.arm = 'hold'; this.brenda.arm = 'hold';
      let t = 0, done = false, res = 0;
      while (!done) {
        t += 1 / 60; this.handshake.pos = (Math.sin(t * 3.2) + 1) / 2; // 0..1
        if (inp.hit('interact') || inp.hit('confirm') || inp.hit('jump') || inp.mpressed) {
          const p = this.handshake.pos;
          if (p > 0.4 && p < 0.6) res = 2; else if (p > 0.25 && p < 0.75) res = 1; else res = 0;
          this.handshake.result = p; done = true; inp.eat();
        }
        if (t > 8) { done = true; res = 0; this.handshake.result = -1; }
        yield 1 / 60;
      }
      this.handshake.active = false;
      A.sfx(res === 2 ? 'good' : res === 1 ? 'blip' : 'error');
      const p = this.handshake.result;
      this.chubby.squashX.x = 1.15; this.brenda.squash.x = 1.1;
      yield 0.5;
      if (p === -1) yield ui.say('Brenda', "...You just stood there. {p}For a long time. {p}Okay.", { voice: 'blip2' });
      else if (res === 2) yield ui.say('Brenda', "Firm. Dry. Two pumps. {p}Okay, Chubby. Okay.", { voice: 'blip2' });
      else if (p < 0.4) yield ui.say('Brenda', "That was like shaking a warm pancake. {p}Sit down.", { voice: 'blip2' });
      else yield ui.say('Brenda', "OW. {p}Okay. You've got a grip. You've got a GRIP, Chubby.", { voice: 'blip2' });
      this.brenda.talk = false; this.brenda.arm = 'clipboard'; this.chubby.arm = 'belly';
      this.handshake = null;
      return res;
    }
    *eventStomach() {
      yield 0.5; A.sfx('stomach'); CH.doShake(1, 0.3); this.chubby.jiggle.kick(60);
      yield 0.4;
      const c = yield ui.choose('Chubby', "Your stomach makes a sound like a moose falling down stairs.", ['"Excuse me."', '"That was the chair."', '(Say nothing. Maintain eye contact.)', '"I skipped breakfast to be here on time."'], { timer: 7 });
      const r = [['Brenda', "Sure. {p}Happens.", 1], ['Brenda', "The chair is metal, hon.", 0], ['Brenda', "...{pp}Okay.", 1], ['Brenda', "There's a Big Don in it for you if this goes well. {p}Focus.", 2]][c < 0 ? 2 : c];
      this.brenda.talk = true; yield ui.say(r[0], r[1], { voice: 'blip2' }); this.brenda.talk = false; this.score += r[2];
    }
    *eventWalkie() {
      yield 0.4; A.sfx('static'); this.walkie = 3;
      yield ui.say('Walkie', "*KSSHHT* BRENDA. FRYER TWO IS ON FIRE AGAIN. *KSSHHT*", { voice: 'blip2', color: '#ffb080' });
      yield ui.say('Brenda', "...Give me thirty seconds.", { voice: 'blip2' });
      this.brenda.talk = false; this.brenda.hidden = true; A.sfx('door');
      const c = yield ui.choose('Chubby', "Brenda leaves. Her papers are RIGHT THERE. There's a bowl of mints. The mop in the corner is looking at you.", ['Sit perfectly still.', 'Peek at her notes.', 'Take a mint. Just one.', 'Pick up the mop and mop something.'], { timer: 8 });
      if (c === 1) { yield ui.say('', "The notes say: 'Chubby - round - honest? - Kevin's chair'. There's a doodle of a burger. It's pretty good.", { color: '#cfc8e8' }); this.score += 0; }
      else if (c === 2) { A.sfx('eat'); yield ui.say('Chubby', "Mint. {p}Minty. {p}Okay. Nobody saw. {pp}I took four.", { face: 'worried' }); this.score += 0; }
      else if (c === 3) { this.chubby.sitting = false; this.chubby.y = 214; this.chubby.arm = 'mop'; this.mopVisible = false; A.sfx('mop'); yield ui.say('Chubby', "Mopping. {p}I'm mopping. This is the interview, right? This is the whole interview.", { face: 'focused' }); this.score += 2; }
      else { yield ui.say('Chubby', "Still. {p}Perfectly still. {pp}A drop of sweat falls onto Kevin's chair.", { face: 'worried' }); this.score += 1; }
      A.sfx('door'); this.brenda.hidden = false;
      if (c === 3) { yield ui.say('Brenda', "...Are you mopping?", { voice: 'blip2' }); yield ui.say('Chubby', "...Yes?", { face: 'worried' }); yield ui.say('Brenda', "Huh.", { voice: 'blip2' }); this.chubby.sitting = true; this.chubby.y = 194; this.chubby.arm = 'belly'; this.mopVisible = true; }
      else yield ui.say('Brenda', "Fire's out. It was a small fire. It's usually a small fire. {p}Where were we.", { voice: 'blip2' });
      this.brenda.talk = false;
    }
    *eventPhone() {
      yield 0.4; A.sfx('notify'); A.sfx('notify');
      this.chubby.doEmote('!', 1.5);
      const c = yield ui.choose('Chubby', "Your phone buzzes. Twice. It's Mom: 'How is it going??? Did you wear the suit???'", ['Ignore it.', "\"Sorry, it's my mom, she's in the hospital.\"", 'Answer it under the desk.', 'Silence it and say "sorry".'], { timer: 7 });
      if (c === 1) { this.brenda.talk = true; yield ui.say('Brenda', "...Go ahead. Answer her. {p}Tell her you wore the suit.", { voice: 'blip2' }); this.brenda.talk = false; CH.sendText('Mom', 'Yes. Suit. Interview going ok I think', false); yield 0.8; CH.sendText('Mom', 'Proud of you. Sit up straight. ♥'); this.score += 2; }
      else if (c === 2) { yield ui.say('Chubby', "*types under the desk* 'yes suit. cant talk. interview'", { face: 'focused' }); CH.sendText('Mom', 'yes suit. cant talk. interview', false); this.brenda.talk = true; yield ui.say('Brenda', "I can see your phone, hon. The desk is glass.", { voice: 'blip2' }); this.brenda.talk = false; this.score += 0; }
      else if (c === 3) { this.brenda.talk = true; yield ui.say('Brenda', "Appreciated.", { voice: 'blip2' }); this.brenda.talk = false; this.score += 1; }
      else { yield ui.say('Chubby', "*buzz* {p}*buzz* {p}*buzz* {pp}It's fine. It's fine.", { face: 'worried' }); this.score += 1; }
    }
    *eventMint() { yield 0.3; this.brenda.talk = true; yield ui.say('Brenda', "You want a mint? You keep looking at the mints.", { voice: 'blip2' }); this.brenda.talk = false; yield ui.say('Chubby', CH.chance(0.5) ? "...Yes please." : "I already had four. {p}I mean— one. Yes please.", { face: 'worried' }); A.sfx('eat'); }
    // ---- update/draw ----
    update(dt) {
      this.brenda.update(dt); this.chubby.update(dt);
      this.chubby.sweat = this.sweat;
      this.particles.update(dt);
      if (this.walkie > 0) this.walkie -= dt;
      if (this.sweat > 0 && CH.chance(dt * this.sweat * 3)) this.particles.add({ x: this.chubby.x - 10, y: this.chubby.y - 36, vx: 0, vy: 20, life: 0.6, color: '#9fdcff', grav: 200 });
    }
    draw(g) {
      const t = this.t;
      const FY = 214;
      // the tube is on its last legs
      const buzz = Math.sin(t * 31) > 0.955 || Math.sin(t * 7.3) > 0.992;
      const lightK = buzz ? 0.72 : 1;
      const d = ui.dialog;
      const urg = d && d.timerMax ? 1 - CH.clamp(d.timer / d.timerMax, 0, 1) : 0;
      const panic = d && d.timerMax && d.timer < 3 ? 1 - d.timer / 3 : 0;

      // ---- ceiling: drop tiles + the fixture ---------------------------------
      gfx.rect(0, 0, W, 32, '#b9bfc9');
      for (let x = 0; x < W; x += 40) { gfx.rect(x, 0, 38, 30, '#c6ccd6'); gfx.rect(x, 0, 38, 1, '#d6dbe3'); }
      for (let x = 0; x < W; x += 40) gfx.vline(x + 38, 0, 32, '#9aa1ab');
      gfx.hline(0, 30, W, '#8d939d'); gfx.hline(0, 31, W, '#767c86');
      // ---- walls --------------------------------------------------------------
      gfx.vgrad(0, 32, W, 118, [WALL.hi, WALL.hi, WALL.mid]);
      gfx.rect(0, 150, W, 56, WALL.lo);
      gfx.rect(0, 148, W, 4, WALL.rail); gfx.rect(0, 148, W, 1, gfx.shade(WALL.rail, 26)); gfx.rect(0, 151, W, 1, gfx.shade(WALL.rail, -26));
      for (let y = 36; y < 148; y += 7) gfx.hline(0, y, W, 'rgba(150,136,100,0.18)');
      for (let y = 156; y < 204; y += 7) gfx.hline(0, y, W, 'rgba(120,106,76,0.16)');
      // corners darken, the room closes in
      g.globalAlpha = 0.22; gfx.vgrad(0, 32, 46, 182, ['#4a3f28', 'rgba(74,63,40,0)']); g.globalAlpha = 1;
      g.globalAlpha = 0.18; for (let i = 0; i < 26; i++) gfx.rect(W - i * 2, 32, 2, 182, 'rgba(74,63,40,0.05)'); g.globalAlpha = 1;
      waterStain(64, 40, 22, 7); waterStain(398, 36, 16, 5);
      gfx.rect(150, 176, 11, 2, '#9b8c66'); gfx.px(161, 178, '#9b8c66'); gfx.rect(158, 182, 6, 1, '#9b8c66');  // scuffs by the chair
      gfx.rect(0, 204, W, 10, WALL.base); gfx.rect(0, 204, W, 1, '#8a7554'); gfx.rect(0, 212, W, 2, '#4d4029');

      // ---- floor ---------------------------------------------------------------
      gfx.rect(0, FY, W, H - FY, '#8d7b57');
      for (let y = FY; y < H; y += 13) for (let x = -((y / 13) & 1) * 13; x < W; x += 26) {
        gfx.rect(x, y, 13, 13, ((x / 13 + y / 13) | 0) % 2 ? '#93815c' : '#87754f');
      }
      for (let y = FY; y < H; y += 13) gfx.hline(0, y, W, '#6f5f3f');
      for (let x = 0; x < W; x += 13) gfx.vline(x, FY, H - FY, '#6f5f3f');
      g.globalAlpha = 0.14 * lightK; gfx.tri(120, FY, 350, FY, 420, H, '#fff6c8'); g.globalAlpha = 1;
      gfx.ellipse(96, FY + 22, 13, 4, 'rgba(70,52,28,0.35)');                     // old coffee ring
      gfx.ellipseOutline(96, FY + 22, 15, 5, 'rgba(60,44,22,0.35)');

      gfx.rect(112, 30, 2, 8, '#4a4f58'); gfx.rect(230, 30, 2, 8, '#4a4f58');  // hangers
      art.blit(96, 50, 156, 20, 4, 18, () => {
        gfx.rect(4, 2, 148, 6, '#98a0ab'); gfx.rect(4, 2, 148, 1, '#c6ccd6'); gfx.rect(4, 7, 148, 1, '#6d737d');
        gfx.rect(2, 8, 152, 2, '#7d848f');
        gfx.rect(5, 10, 146, 7, buzz ? '#c8cab4' : '#fffde8');
        gfx.rect(5, 10, 146, 3, buzz ? '#dedfc6' : '#ffffff');
        gfx.rect(5, 16, 146, 2, buzz ? '#94987f' : '#ded9ab');
        gfx.rect(66, 10, 24, 8, buzz ? '#5f6358' : '#a8a689');                   // the dead third
        gfx.rect(2, 16, 152, 2, '#5c626c');
      });
      // light spill
      g.globalAlpha = 0.10 * lightK; gfx.tri(102, 52, 246, 52, 460, H, '#fff6c8'); gfx.tri(102, 52, 246, 52, -110, H, '#fff6c8'); g.globalAlpha = 1;
      g.globalAlpha = 0.13 * lightK; gfx.tri(112, 52, 236, 52, 330, H, '#fff6c8'); gfx.tri(112, 52, 236, 52, 10, H, '#fff6c8'); g.globalAlpha = 1;
      g.globalAlpha = 0.18 * lightK; gfx.ellipse(174, 54, 92, 9, '#fff6c8'); g.globalAlpha = 1;

      // ---- kitchen window -------------------------------------------------------
      gfx.rect(356, 56, 108, 78, '#3d3a44');
      gfx.rect(360, 60, 100, 70, '#2a2832');
      gfx.vgrad(362, 62, 96, 66, ['#f3e7cd', '#e6d5b2', '#cdb98f']);
      gfx.rect(362, 104, 96, 24, '#8d8a94');
      gfx.rect(362, 102, 96, 3, '#adaab4');
      CH.drawCritter(g, 400, 126, { species: 'bear', outfit: 'polo', noShadow: true, arm: 'hold', height: 1.1, width: 1.1 });
      for (let i = 0; i < 5; i++) { const k = (t * 0.6 + i * 0.2) % 1; gfx.px(376 + i * 16, 100 - k * 34, `rgba(255,255,255,${(0.65 - k * 0.65).toFixed(2)})`); }
      g.globalAlpha = 0.25; gfx.rect(362, 62, 96, 10, '#ff9a3c'); g.globalAlpha = 1;   // heat lamps
      for (let i = 0; i < 6; i++) gfx.rect(364 + i * 16, 62, 12, 2, '#ffb454');
      if (this.walkie > 0) { const ph = Math.sin(this.t * 20) > 0; gfx.rect(362, 62, 96, 42, ph ? 'rgba(255,120,40,0.4)' : 'rgba(255,200,40,0.2)'); gfx.text('!!', 410, 70, '#fff', { align: 'center', outline: '#8f2419' }); }
      // frame, blinds half up
      gfx.rect(356, 50, 108, 8, '#5c5a66'); gfx.rect(356, 50, 108, 2, '#7d7b88');
      for (let i = 0; i < 4; i++) gfx.rect(360, 58 + i * 3, 100, 2, 'rgba(120,118,132,0.85)');
      gfx.frame(356, 56, 108, 78, '#5c5a66'); gfx.frame(357, 57, 106, 76, '#3d3a44');
      gfx.rect(408, 56, 3, 78, '#5c5a66');
      gfx.rect(356, 130, 108, 5, '#6b6874'); gfx.rect(356, 130, 108, 1, '#8d8a96');

      // ---- wall clutter ----------------------------------------------------------
      motivationalPoster(22, 56, 72, 56, t);
      framedPhoto(g, 106, 54, 60, 44, t);
      safetySign(180, 54, 62, 40);
      calendar(326, 96, t);
      // CCTV, bracketed off the wall
      gfx.rect(196, 136, 36, 4, '#5c5a66');
      gfx.rect(186, 102, 54, 36, '#6b6874'); gfx.rect(186, 102, 54, 2, '#8d8a96');
      gfx.rect(190, 106, 46, 24, '#15161c');
      gfx.rect(192, 108, 42, 20, '#1d3a2c');
      for (let i = 0; i < 6; i++) gfx.rect(194 + i * 7, 110 + (Math.floor(t * 2 + i) % 3) * 3, 5, 9, '#3f8a3a');
      g.globalAlpha = 0.25; gfx.rect(192, 108 + ((t * 40) % 20), 42, 2, '#8fe08a'); g.globalAlpha = 1;
      gfx.text('CAM 2', 213, 130, '#8fe08a', { align: 'center', font: 'small' });
      gfx.frame(186, 102, 54, 36, '#3d3a44');
      // the clock
      wallClock(288, 78, 21, S.hour, t, Math.max(urg * 0.8, panic));
      gfx.rect(266, 104, 44, 8, '#efe6cf'); gfx.frame(266, 104, 44, 8, '#b8ab8c'); gfx.text('DO NOT TOUCH', 288, 105, '#7d6a4a', { align: 'center', font: 'small' });

      // ---- furniture -------------------------------------------------------------
      filingCabinet(16, FY);
      coffeeMaker(20, FY - 58, t);
      dyingPlant(76, FY, t);
      boxStack(330, FY);
      if (this.mopVisible) {
        art.blit(452, FY, 24, 70, 12, 68, () => {
          gfx.rect(10, 4, 3, 54, '#c0924f'); gfx.rect(10, 4, 1, 54, '#d8b070');
          gfx.rect(5, 52, 13, 8, '#e8e0d0');
          for (let i = 0; i < 7; i++) gfx.rect(5 + i * 2, 58, 1, 9, i % 2 ? '#d8d0c0' : '#c8bfae');
        });
        art.blit(418, FY, 26, 20, 13, 18, () => {
          gfx.rect(3, 4, 20, 14, '#3f6a86'); gfx.rect(3, 4, 20, 2, '#5b8fae');
          gfx.rect(5, 7, 16, 4, '#7fb6cf'); gfx.rect(3, 16, 20, 2, '#2c4d63');
          gfx.rect(1, 3, 24, 2, '#5b8fae'); gfx.px(2, 18, '#22323f'); gfx.px(22, 18, '#22323f');
        });
        gfx.rect(430, FY - 10, 28, 10, '#f5c33b'); gfx.rect(430, FY - 10, 28, 1, '#ffe08a');
        gfx.tri(430, FY, 458, FY, 444, FY - 10, '#e0a92a');
        gfx.text('WET', 444, FY - 8, '#3a2a10', { align: 'center', font: 'small' });
        gfx.frame(430, FY - 10, 28, 10, '#8f6a14');
      }

      // ---- Kevin's chair (metal, hostile) ------------------------------------------
      art.blit(190, FY, 40, 66, 20, 64, () => {
        const m = MSTEEL;
        gfx.rect(6, 12, 27, 25, m.d);                        // backrest panel
        gfx.rect(7, 13, 25, 22, m.base); gfx.rect(7, 13, 25, 2, m.l);
        gfx.rect(7, 20, 25, 1, m.d); gfx.rect(7, 27, 25, 1, m.d);
        gfx.rect(4, 12, 3, 27, m.base); gfx.rect(32, 12, 3, 27, m.base);
        gfx.rect(3, 38, 34, 5, m.base); gfx.rect(3, 38, 34, 1, m.l); gfx.rect(3, 42, 34, 1, m.dd);
        gfx.rect(5, 43, 3, 19, m.base); gfx.rect(32, 43, 3, 19, m.d);
        gfx.rect(8, 52, 24, 2, m.d);
        gfx.rect(3, 61, 7, 2, m.dd); gfx.rect(30, 61, 7, 2, m.dd);
      });

      // ---- Brenda's chair --------------------------------------------------------------
      art.blit(304, FY, 34, 70, 17, 68, () => {
        gfx.rect(4, 62, 26, 3, '#2f333c'); gfx.rect(15, 44, 4, 20, '#4a4f58');
        gfx.rect(2, 2, 30, 34, '#3b4049'); gfx.rect(2, 2, 30, 2, '#565c67');
        gfx.rect(4, 5, 26, 28, '#4d535e'); gfx.rect(5, 6, 24, 12, '#5b616d');
        gfx.rect(2, 36, 30, 8, '#2f333c');
        gfx.px(6, 64, '#22252c'); gfx.px(28, 64, '#22252c');
      });

      // ---- characters --------------------------------------------------------------------
      this.brenda.draw(g);

      // ---- the glass desk ------------------------------------------------------------
      art.blit(212, FY, 122, 48, 4, 46, () => {
        gfx.rect(6, 34, 5, 12, '#5c626c'); gfx.rect(106, 34, 5, 12, '#5c626c');
        gfx.rect(4, 44, 9, 2, '#42474f'); gfx.rect(104, 44, 9, 2, '#42474f');
        gfx.rect(11, 30, 95, 3, 'rgba(92,98,108,0.55)');
        gfx.rect(6, 6, 106, 26, 'rgba(150,196,228,0.18)');
        gfx.rect(4, 2, 112, 5, 'rgba(198,232,255,0.72)');
        gfx.rect(4, 2, 112, 1, '#ffffff');
        gfx.rect(4, 6, 112, 1, 'rgba(120,170,210,0.7)');
        gfx.rect(20, 8, 26, 2, 'rgba(255,255,255,0.35)');
      }, { outline: null });
      gfx.rect(216, FY - 46, 114, 1, '#e8f6ff');
      // things on the glass: papers, mints, nameplate, mug
      art.blit(216, FY - 44, 30, 14, 2, 12, () => {
        gfx.rect(2, 5, 24, 7, '#f6f2e6'); gfx.rect(4, 2, 24, 7, '#fdfbf2'); gfx.rect(4, 2, 24, 1, '#ffffff');
        gfx.hline(7, 4, 15, '#8a90b0'); gfx.hline(7, 6, 10, '#8a90b0'); gfx.hline(7, 8, 13, '#8a90b0');
      });
      art.blit(316, FY - 44, 28, 14, 14, 12, () => {
        gfx.ellipse(14, 10, 11, 2.6, '#8fa0b0');
        gfx.ellipse(14, 8, 11, 3.4, 'rgba(206,230,244,0.92)');
        gfx.ellipse(14, 6, 10, 3.2, '#e2edf4');
        for (let i = 0; i < 7; i++) gfx.ellipse(6 + i * 2.7, 5 - (i % 3), 1.9, 1.4, i % 2 ? '#c8352b' : '#fdfbf2');
        gfx.ellipseOutline(14, 6, 10, 3.2, '#b3c7d6');
      });
      art.blit(248, FY - 44, 34, 12, 2, 10, () => {
        gfx.rect(2, 3, 30, 7, '#5a3721'); gfx.rect(2, 3, 30, 1, '#7d5230'); gfx.rect(2, 9, 30, 1, '#39220f');
        gfx.text('BRENDA', 17, 4, '#f5c33b', { align: 'center', font: 'small' });
      });
      art.blit(350, FY - 38, 18, 14, 9, 12, () => {
        gfx.rect(3, 4, 10, 8, '#efe9db'); gfx.rect(3, 4, 10, 2, '#fffbf0'); gfx.rect(3, 11, 10, 1, '#c3bcab');
        gfx.rect(13, 6, 3, 1, '#efe9db'); gfx.rect(15, 6, 1, 3, '#efe9db'); gfx.rect(13, 8, 3, 1, '#efe9db');
        gfx.text('D', 6, 6, '#c8352b', { font: 'small' });
        gfx.ellipse(8, 4, 5, 1.6, '#4a3520');
      });

      this.chubby.draw(g);
      this.particles.draw(g);

      // fluorescent buzz dims the whole room for a frame
      if (buzz) { g.globalAlpha = 0.18; gfx.rect(0, 0, W, H, '#1b2230'); g.globalAlpha = 1; }
      // the walls close in when the timer is nearly out
      if (panic > 0) {
        const puls = 0.65 + 0.35 * Math.sin(t * 13);
        for (let i = 0; i < 22; i++) {
          g.globalAlpha = panic * 0.55 * Math.pow(1 - i / 22, 2.2) * puls;
          gfx.frame(i, i, W - i * 2, H - i * 2, '#c8352b');
        }
        g.globalAlpha = 1;
      }

      // ---- handshake meter (unchanged geometry) --------------------------------------------
      if (this.handshake && this.handshake.active) {
        const hx = W / 2 - 60, hy = 120;
        gfx.rrect(hx - 4, hy - 20, 128, 44, 3, 'rgba(16,12,22,0.72)');
        gfx.rect(hx - 2, hy - 2, 124, 14, '#000'); gfx.rect(hx, hy, 120, 10, '#c8352b'); gfx.rect(hx + 30, hy, 60, 10, '#f5c33b'); gfx.rect(hx + 48, hy, 24, 10, '#4f9d3a');
        const mx = hx + Math.round(this.handshake.pos * 118);
        gfx.rect(mx, hy - 4, 3, 18, '#fff'); gfx.rect(mx + 1, hy - 4, 1, 18, '#000');
        gfx.text('WET PANCAKE', hx, hy + 14, '#fff', { font: 'small', outline: '#000' }); gfx.text('FIRM', hx + 60, hy + 14, '#fff', { align: 'center', font: 'small', outline: '#000' }); gfx.text('BONE CRUSHER', hx + 120, hy + 14, '#fff', { align: 'right', font: 'small', outline: '#000' });
        gfx.text('HANDSHAKE!  Press E', W / 2, hy - 16, '#fff', { align: 'center', outline: '#000' });
      }
      // ---- HUD -----------------------------------------------------------------------------
      gfx.rrect(4, 4, 96, 20, 2, 'rgba(16,12,22,0.62)');
      gfx.text('INTERVIEW', 8, 6, '#f5c33b', { outline: '#000' });
      ui.bar(8, 17, 60, 4, this.sweat, this.sweat > 0.6 ? '#7fd0ff' : '#4fa8ff', '#222'); gfx.text('SWEAT', 72, 15, '#fff', { font: 'small', outline: '#000' });
      gfx.text(CH.timeStr(), W - 8, 8, '#fff', { align: 'right', outline: '#000' });
    }
  }
  CH.InterviewScene = InterviewScene;
  CH.SCENES.interview = () => { S.outfit = 'suit'; return new InterviewScene(); };
})(window.CH);
