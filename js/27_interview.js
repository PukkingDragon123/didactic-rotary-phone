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
      // back office
      gfx.rect(0, 0, W, 30, '#c8ccd4'); for (let x = 0; x < W; x += 30) gfx.vline(x, 0, 30, '#b0b4bc');
      gfx.rect(0, 30, W, 184, '#d8c8a0'); for (let y = 34; y < 214; y += 6) gfx.hline(0, y, W, '#cfbf95');
      gfx.rect(0, 214, W, H - 214, '#8a7a5a'); for (let x = 0; x < W; x += 24) for (let y = 214; y < H; y += 12) gfx.rect(x + ((y / 12) & 1) * 12, y, 12, 12, '#948462');
      gfx.rect(0, 206, W, 8, '#6a5a3a');
      // window into kitchen with steam & a cook
      gfx.rect(360, 60, 100, 70, '#3a3a44'); gfx.rect(364, 64, 92, 62, '#e8e0d0'); gfx.rect(364, 100, 92, 26, '#8a8a94');
      CH.drawCritter(g, 400, 126, { species: 'bear', outfit: 'polo', noShadow: true, arm: 'hold', height: 1.1, width: 1.1 });
      for (let i = 0; i < 4; i++) { const k = (this.t * 0.6 + i * 0.25) % 1; gfx.px(380 + i * 18, 96 - k * 26, `rgba(255,255,255,${0.7 - k * 0.7})`); }
      if (this.walkie > 0) { const ph = Math.sin(this.t * 20) > 0; gfx.rect(364, 64, 92, 36, ph ? 'rgba(255,120,40,0.35)' : 'rgba(255,200,40,0.2)'); gfx.text('!!', 410, 70, '#fff', { align: 'center' }); }
      gfx.frame(360, 60, 100, 70, '#5a5a66'); gfx.rect(409, 60, 2, 70, '#5a5a66');
      // posters and stuff
      gfx.rect(40, 50, 60, 40, '#fff'); gfx.frame(40, 50, 60, 40, '#c8352b'); gfx.text('EMPLOYEE OF', 70, 54, '#c8352b', { align: 'center', font: 'small' }); gfx.text('THE MONTH', 70, 61, '#c8352b', { align: 'center', font: 'small' });
      CH.drawCritter(g, 70, 88, { species: 'raccoon', outfit: 'cook', noShadow: true, height: 0.6, width: 0.7, face: 'happy' }); gfx.line(44, 70, 96, 86, '#c8352b'); gfx.line(44, 86, 96, 70, '#c8352b');
      gfx.rect(120, 44, 60, 30, '#f5c33b'); gfx.text('SAFETY FIRST', 150, 48, '#8f2419', { align: 'center', font: 'small' }); gfx.text('DAYS SINCE', 150, 56, '#8f2419', { align: 'center', font: 'small' }); gfx.text('FRYER FIRE: 0', 150, 64, '#8f2419', { align: 'center', font: 'small' });
      gfx.rect(200, 40, 50, 60, '#8a8a94'); gfx.rect(204, 44, 42, 20, '#111'); gfx.rect(206, 46, 38, 16, '#2a4a3a'); for (let i = 0; i < 5; i++) gfx.rect(208 + i * 7, 50 + (Math.floor(this.t * 2 + i) % 3) * 2, 4, 6, '#4f9d3a'); gfx.text('CAM 2', 225, 66, '#8f8', { align: 'center', font: 'small' }); // cctv
      gfx.rect(204, 72, 42, 24, '#5a5a66'); for (let i = 0; i < 3; i++) gfx.hline(206, 76 + i * 6, 38, '#777'); // filing cabinet
      // mop in corner
      if (this.mopVisible) { gfx.rect(452, 150, 2, 64, '#c8a060'); gfx.rect(446, 200, 14, 8, '#e8e0d0'); for (let i = 0; i < 6; i++) gfx.rect(446 + i * 2, 206, 1, 8, '#d8d0c0'); gfx.rect(440, 206, 26, 6, '#f5c33b'); gfx.text('WET', 453, 207, '#222', { align: 'center', font: 'small' }); }
      // coffee maker + calendar
      gfx.rect(300, 112, 16, 18, '#222'); gfx.rect(302, 120, 12, 6, '#5a3a1a'); gfx.px(314, 114, '#f44'); gfx.rect(330, 90, 14, 18, '#fff'); gfx.rect(330, 90, 14, 5, '#c8352b'); for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) gfx.px(332 + c * 2, 97 + r * 2, r === 1 && c === 2 ? '#c8352b' : '#888');
      // desk (glass!)
      gfx.rect(230, 176, 90, 4, 'rgba(180,220,255,0.6)'); gfx.rect(230, 176, 90, 1, '#fff'); gfx.rect(234, 180, 4, 34, '#5a5a66'); gfx.rect(312, 180, 4, 34, '#5a5a66');
      // things on desk: papers, mint bowl, nameplate
      gfx.rect(250, 170, 20, 6, '#fff'); gfx.rect(252, 168, 18, 6, '#f4f4f0'); gfx.hline(254, 170, 12, '#88a'); gfx.hline(254, 172, 8, '#88a');
      gfx.ellipse(290, 173, 8, 3, '#8a8a94'); gfx.ellipse(290, 172, 6, 2, '#e8e0d0'); for (let i = 0; i < 5; i++) gfx.px(286 + i * 2, 171 - (i % 2), i % 2 ? '#c8352b' : '#fff');
      gfx.rect(240, 168, 30, 6, '#5a3721'); gfx.text('BRENDA', 255, 169, '#f5c33b', { align: 'center', font: 'small' });
      // Brenda's chair
      gfx.rect(292, 160, 22, 50, '#3a3a44'); gfx.rect(294, 162, 18, 30, '#5a5a66');
      // Chubby's chair (metal)
      gfx.rect(176, 184, 28, 3, '#8a8a94'); gfx.rect(178, 187, 2, 27, '#8a8a94'); gfx.rect(200, 187, 2, 27, '#8a8a94'); gfx.rect(176, 160, 3, 26, '#8a8a94'); gfx.rect(176, 160, 28, 3, '#8a8a94');
      // characters
      this.brenda.draw(g);
      this.chubby.draw(g);
      this.particles.draw(g);
      // handshake meter
      if (this.handshake && this.handshake.active) {
        const hx = W / 2 - 60, hy = 120;
        gfx.rect(hx - 2, hy - 2, 124, 14, '#000'); gfx.rect(hx, hy, 120, 10, '#c8352b'); gfx.rect(hx + 30, hy, 60, 10, '#f5c33b'); gfx.rect(hx + 48, hy, 24, 10, '#4f9d3a');
        const mx = hx + Math.round(this.handshake.pos * 118);
        gfx.rect(mx, hy - 4, 3, 18, '#fff'); gfx.rect(mx + 1, hy - 4, 1, 18, '#000');
        gfx.text('WET PANCAKE', hx, hy + 14, '#fff', { font: 'small', outline: '#000' }); gfx.text('FIRM', hx + 60, hy + 14, '#fff', { align: 'center', font: 'small', outline: '#000' }); gfx.text('BONE CRUSHER', hx + 120, hy + 14, '#fff', { align: 'right', font: 'small', outline: '#000' });
        gfx.text('HANDSHAKE!  Press E', W / 2, hy - 16, '#fff', { align: 'center', outline: '#000' });
      }
      // score/sweat HUD
      gfx.text('INTERVIEW', 8, 8, '#f5c33b', { outline: '#000' });
      ui.bar(8, 18, 60, 4, this.sweat, '#4fa8ff', '#222'); gfx.text('SWEAT', 72, 16, '#fff', { font: 'small', outline: '#000' });
      gfx.text(CH.timeStr(), W - 8, 8, '#fff', { align: 'right', outline: '#000' });
    }
  }
  CH.InterviewScene = InterviewScene;
  CH.SCENES.interview = () => { S.outfit = 'suit'; return new InterviewScene(); };
})(window.CH);
