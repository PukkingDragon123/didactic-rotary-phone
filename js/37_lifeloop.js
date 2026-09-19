// ============================================================================
// LIFE LOOP: days, home evenings, commuting, hospital visits, shop, ending
// ============================================================================
(function (CH) {
  const gfx = CH.gfx, ui = CH.ui, fx = CH.fx, A = CH.audio, inp = CH.input, S = CH.state;
  const W = CH.W, H = CH.H;

  // ---- after being hired ---------------------------------------------------------------------------
  CH.startCareer = () => {
    S.chapter = 'career'; S.hour = 11.5; S.groceries = 2;
    CH.save();
    const tr = new CH.TravelScene({ dest: 'home', direction: -1, playerX: 2480 });
    tr.enter = function () { A.play('town', 2); fx.setFade(1); this.run((function* () { tr.locked = true; yield fx.fadeIn(1.2); tr.player.flip = true; yield ui.say('Chubby', "I have a job. {p}I have a JOB. {pp}A janitor job at a burger place that starts at 8 AM. {p}I have never been awake at 8 AM on purpose.", { face: 'happy' }); yield ui.say('Chubby', "Okay. Home. Text Mom. Sleep. {p}Tomorrow I mop.", { face: 'focused' }); ui.setObjective('Walk home  ←'); tr.locked = false; })()); };
    tr.props.find((p) => p.id === 'cabinExt').interact = function* () { tr.locked = true; A.sfx('door'); yield fx.fadeOut(1); CH.homeEvening(); };
    tr.props.find((p) => p.id === 'cabinExt').range = 60;
    CH.game.set(tr);
  };

  // ---- evening at home ---------------------------------------------------------------------------
  CH.homeEvening = (opts = {}) => {
    const night = S.hour >= 18 || S.hour < 6;
    const cabin = new CH.CabinScene({ mode: 'home', momPresent: !!S.momHome, playerX: 300, night });
    cabin.tvMode = 'off'; cabin.fire.st.lit = night; cabin.pancakes.st.eaten = true; cabin.stove.st.steam = false; cabin.stove.st.pan = false; cabin.bgDirty = true;
    cabin.player.outfit = 'hoodie'; S.outfit = 'hoodie';
    setupHomeHooks(cabin);
    if (S.momHome) { cabin.mom.x = 1090; cabin.mom.pose = 'sit'; cabin.mom.y = cabin.floorY - 8; cabin.mom.face = 'happy'; cabin.prop('rockingChair').st.rocking = true; }
    CH.game.set(cabin);
    cabin.run((function* () {
      cabin.locked = true; fx.setFade(1); yield fx.fadeIn(1);
      if (opts.msg) yield ui.say('Chubby', opts.msg, { face: opts.face || 'tired' });
      ui.setObjective(S.momHome ? 'Evening: relax, eat, then sleep' : 'Evening: eat, check your phone, then sleep (bed)');
      ui.showMoney = true;
      cabin.locked = false;
      if (!CH.flag('eveningTut')) { CH.flag('eveningTut', true); ui.setHint('Fridge: eat  -  TV: unwind  -  Phone (I): shop, bank, texts  -  Bed: sleep', 7); }
    })());
  };

  function setupHomeHooks(cabin) {
    cabin.onSleep = function* () {
      if (S.hunger > 70) { yield ui.say('Chubby', "I'm too hungry to sleep. Fridge first.", { face: 'tired' }); return; }
      cabin.locked = true;
      const lines = ["Alarm set. {p}Real alarm. For a real job.", "Tomorrow: mop. {p}Tonight: dream about mopping, probably.", "Goodnight, Mom. {p}Wherever you are in that hospital, goodnight.", "My legs hurt. My arms hurt. {p}My heart is... okay, actually.", "Day " + S.day + ". {p}Still standing. Mostly."];
      yield ui.say('Chubby', S.momHome ? "Goodnight, Mom." : CH.pick(lines), { face: 'tired' });
      if (S.momHome) yield ui.say('Mom', "Goodnight, sweetheart. {p}Don't stay up gaming.", { face: 'happy' });
      A.stop(1); yield fx.fadeOut(1.5);
      CH.nextDay();
    };
    cabin.onFridge = function* () {
      if ((S.groceries || 0) <= 0) { yield ui.say('Chubby', "Empty. A single pickle. {p}I eat the pickle. {p}I need groceries. Amazoon, or the general store on the way home.", { face: 'sad' }); S.hunger = Math.max(0, S.hunger - 10); return; }
      cabin.locked = true; A.sfx('door'); yield 0.4; S.groceries--; const meal = CH.pick(['leftover pancakes, microwaved', 'a Big Don I brought home (employee discount)', 'cereal. Choco Quills. Dinner of adults.', 'soup from a can Mom labelled "FOR EMERGENCIES"', 'toast. Four pieces. With butter and shame.']);
      for (let i = 0; i < 4; i++) { cabin.player.mouth = 'eat'; A.sfx('eat'); cabin.particles.burst(cabin.player.x, cabin.player.y - 20, 3, { color: ['#e8b060', '#f5c33b'], speed: 30, life: 0.5, grav: 250 }); yield 0.3; }
      cabin.player.mouth = null; S.hunger = Math.max(0, S.hunger - 60); S.energy = Math.min(100, S.energy + 10); A.sfx('yum');
      yield ui.say('Chubby', 'Dinner: ' + meal + ` {p}Groceries left: ${S.groceries}.`, { face: 'happy' });
      cabin.locked = false;
    };
    cabin.onCouch = function* () {
      const c = yield ui.choose('Chubby', 'The couch. The TV. The game is still paused.', ['Play Blue Hedgehog for a bit (+energy)', 'Just sit for a minute', 'Not now']);
      if (c === 2 || c < 0) return;
      cabin.locked = true; yield cabin.walkTo(880); cabin.player.sitting = true; cabin.player.y = cabin.floorY - 9; cabin.couchSeat = true; A.sfx('couch');
      if (c === 1) { yield ui.say('Chubby', "Just sitting. {pp}The fire's going. {p}It's quiet. {pp}Okay. Okay.", { face: 'normal' }); S.energy = Math.min(100, S.energy + 8); }
      else { cabin.tvMode = 'attract'; A.sfx('tvOn'); yield 1; yield ui.say('Chubby', "Twenty minutes. Just twenty.", { face: 'happy' }); const hh = new CH.HedgehogScene({ skipTitle: true, crash: false, onFinish: () => {} }); hh.opts.onCrash = null; const done = new CH.Signal(); hh.opts.onFinish = () => done.resolve(); hh.playCap = 60; CH.game.push(new CH.TVZoomScene(cabin, hh, 1, () => { CH.game.pop(); CH.game.push(hh); }, 1.2)); const start = performance.now(); while (!done.done && performance.now() - start < 75000) yield 0.5; if (!done.done) { hh.frozen = true; } CH.game.set(new CH.TVZoomScene(cabin, hh, -1, () => { CH.game.set(cabin); }, 1.0)); yield 1.2; S.energy = Math.min(100, S.energy + 20); yield ui.say('Chubby', done.done ? "Beat Man Egg. Again. {p}He never learns. {pp}Okay. Bed." : "Okay. That's enough. {p}Twenty minutes. Forty. Whatever.", { face: 'happy' }); cabin.tvMode = 'off'; }
      cabin.couchSeat = false; cabin.player.sitting = false; cabin.player.y = cabin.floorY; cabin.locked = false;
    };
    cabin.onTV = cabin.onCouch;
    cabin.onLeave = function* () {
      if (S.hour >= 6 && S.hour < 11 && !S.workedToday) { yield* leaveForWork(cabin); return; }
      if (S.hour < 21 && !S.visitedToday && !S.momHome) { const c = yield ui.choose('Chubby', `It's ${CH.timeStr()}. Visit Mom at the hospital?`, ['Yes, visit Mom', 'Stay home']); if (c === 0) { cabin.locked = true; A.sfx('door'); yield fx.fadeOut(1); CH.goToHospital(); } return; }
      yield ui.say('Chubby', S.momHome ? "Mom's home. I'm not going anywhere tonight." : "Too late to go anywhere. {p}Sleep.");
    };
    cabin.onMomDoor = function* () { A.sfx('door'); yield 0.5; if (S.momHome) { yield ui.say('Chubby', "Mom's room. She's in her chair in the living room. {p}Where she belongs."); return; } yield ui.say('Chubby', CH.pick(["Her slippers. Still lined up.", "I made her bed today. Badly. She'd fix it in four seconds.", "Lavender and cough drops. {p}I miss the cough drops."]), { face: 'sad' }); };
    cabin.onPhone = function* () { yield ui.say('Chubby', "The rotary phone. {p}I dialled 911 on this. {p}Slowly."); };
  }

  function* leaveForWork(cabin) {
    if (S.hunger > 60) { const c = yield ui.choose('Chubby', "Stomach's growling. Eat first?", ['Eat first', 'Skip breakfast (-energy)']); if (c === 0) return; S.energy -= 10; }
    cabin.locked = true; S.workedToday = true;
    yield ui.say('Chubby', CH.pick(["Off to work. {p}'Off to work.' Listen to me.", "Visor: on. Name tag: KEVIN, crossed out. {p}Let's go.", "Day " + S.day + ". Mop, here I come."]), { face: 'focused' });
    A.sfx('door'); yield fx.fadeOut(1);
    if (CH.has('car') || CH.has('parking')) { S.hour = 7.9; yield fx.showCard(CH.has('car') ? 'COMPANY CAR' : 'RESERVED PARKING', 'Heated seats. 6 minutes.', 2, '#e8e0c8'); CH.startShift(); }
    else { const tr = new CH.TravelScene({ dest: 'donalds' }); CH.game.set(tr); }
  }

  // ---- next day ----------------------------------------------------------------------------------------
  CH.nextDay = () => {
    S.day++; S.hour = 7; S.workedToday = false; S.visitedToday = false;
    S.energy = Math.min(100, S.energy + (CH.has('coffee') ? 70 : 55) + (S.homeItems.pillow ? 10 : 0));
    S.hunger = Math.min(100, S.hunger + 30);
    if (CH.has('pension')) CH.addMoney(Math.round(S.money * 0.01 * 100) / 100, true);
    if (CH.has('statue') || CH.has('airmiles')) S.momMood = Math.min(100, S.momMood + 3);
    S.momHealth = Math.min(100, S.momHealth + 0.5 + (S.homeItems.physio ? 1 : 0));
    // occasional texts
    if (Math.random() < 0.5) CH.sendText('Mom', CH.pick(["Good morning sweetheart. Did you sleep? Don't lie.", "The nurse says I'm 'stable'. I said I've never been stable. She laughed.", "Bring me a Big Don. Kidding. Half kidding.", "Proud of you. That's all. ♥", "Someone's mom in the next bed has a son who is a DENTIST. I told her mine mops floors and I'm prouder.", "How's the couch doing without you", "Eat vegetables. A pickle counts. Barely."]));
    if (S.day % 4 === 0) CH.sendMail({ from: 'billing@stmoosephs.ca', subject: 'Statement reminder', text: `Dear Guarantor,\n\nAmount owing: ${CH.fmtMoney(S.bill - S.billPaid)}.\n\nPayment plans available! :)\n\n- Billing` });
    CH.save();
    CH.startCareerDay();
  };
  CH.startCareerDay = () => {
    S.chapter = 'career';
    const cabin = new CH.CabinScene({ mode: 'home', momPresent: !!S.momHome, playerX: 60 });
    cabin.tvMode = 'off'; cabin.fire.st.lit = false; cabin.pancakes.st.eaten = !S.momHome; cabin.stove.st.steam = !!S.momHome; cabin.stove.st.pan = !!S.momHome; cabin.bgDirty = true;
    cabin.player.outfit = 'hoodie'; S.outfit = 'hoodie';
    setupHomeHooks(cabin);
    if (S.momHome) { cabin.mom.x = 470; cabin.mom.wanderRange = [440, 520]; cabin.mom.face = 'happy'; cabin.pancakes.st.eaten = false; cabin.pancakes.interact = function* () { yield* cabin.eatPancakes(); yield ui.say('Mom', CH.pick(["Extra syrup. Don't tell your doctor.", "Eat. You have a company to run.", "My CEO. Eating pancakes in a hoodie."]), { face: 'happy' }); }; }
    CH.game.set(cabin);
    cabin.run((function* () {
      cabin.locked = true; fx.setFade(1);
      yield 0.3;
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      yield fx.showCard('DAY ' + S.day, dayNames[S.day % 7] + '  -  7:00 AM  -  ' + CH.JOB_INFO[S.job].title, 2.5, '#e8e0c8');
      yield fx.fadeIn(1);
      A.sfx('alarm'); cabin.alarm.st.ringing = true; yield 0.8; cabin.alarm.st.ringing = false;
      const low = S.energy < 40;
      yield ui.say('Chubby', low ? "Ugh. {p}Everything hurts. I should sleep more. Or eat. Or both. {p}Work first." : CH.pick(["Morning. {p}I'm up before the alarm. What is happening to me.", "Okay. Shift at 8. Eat, then go.", "Day " + S.day + ". Mom's bill: " + CH.fmtMoney(S.bill - S.billPaid) + " to go. {p}One mop at a time."]), { face: low ? 'tired' : 'normal' });
      ui.setObjective('Eat (fridge), then leave for work (front door)');
      ui.showMoney = true;
      cabin.locked = false;
    })());
  };

  // ---- after a shift ---------------------------------------------------------------------------------------
  CH.afterShift = (res) => {
    S.hour = 16.2;
    const bonus = CH.shiftBonusMoney(); if (bonus) { CH.addMoney(bonus); ui.toast('Corporate bonus: ' + CH.fmtMoney(bonus), '#f5c33b', 3); }
    const s = new CH.Scene();
    s.draw = (g) => gfx.rect(0, 0, W, H, '#000');
    s.enter = () => s.run((function* () {
      yield 0.3;
      const opts = ['Go home'];
      if (!S.momHome) opts.push('Visit Mom at the hospital');
      if (S.energy >= 45) opts.push('Work an overtime shift (+pay, -energy)');
      const c = yield ui.choose('Chubby', `Shift's over. It's ${CH.timeStr()}. Energy: ${Math.round(S.energy)}%`, opts);
      const pick = opts[c < 0 ? 0 : c];
      if (pick === 'Go home') { S.hour = 17.2; CH.homeEvening({ msg: CH.pick(["Home. {p}My feet are two throbbing pancakes.", "I smell like fries. {p}It's not the worst thing I've smelled like.", "Home. Couch. No— fridge. Then phone. Then couch. I have a SYSTEM now."]) }); }
      else if (pick.startsWith('Visit')) { CH.goToHospital(); }
      else { S.energy -= 25; S.hour = 16.5; yield fx.showCard('OVERTIME', 'Double shift. Brenda approves. Your feet do not.', 2.5, '#f5c33b'); const r = new CH.RestaurantScene(); r.timeScale = 8 / 200; CH.game.set(r); }
    })());
    CH.game.set(s);
  };

  // ---- hospital visits ---------------------------------------------------------------------------------
  CH.goToHospital = () => {
    S.visitedToday = true;
    if (!CH.has('map') && !CH.has('car')) S.hour += 0.8;
    const h = new CH.HospitalScene({ mode: 'visit', playerX: 60 });
    h.onExit = function* () { h.locked = true; A.sfx('door'); yield fx.fadeOut(1); S.hour = Math.max(S.hour + 0.8, 19); CH.homeEvening({ msg: 'Home. {p}She looked better today. {p}I think. I hope.' }); };
    const roomDoor = h.roomDoor; roomDoor.interact = function* () { h.locked = true; A.sfx('door'); yield fx.fadeOut(0.8); const room = new CH.MomRoomScene({ mode: 'visit', hospital: h }); room.onLeave = function* () { room.locked = true; yield fx.fadeOut(0.8); S.hour = Math.max(S.hour + 0.8, 19); CH.homeEvening({ msg: CH.pick(['Home. {p}She laughed today. Twice.', 'Home. {p}She asked about Brenda. I said Brenda is a moose. She said "I know, dear."', "Home. {p}Her hands were warmer today."]) }); }; CH.game.set(room); };
    CH.game.set(h);
    S.momVisits++; S.momMood = Math.min(100, S.momMood + 8); S.momHealth = Math.min(100, S.momHealth + 2);
  };
  CH.momVisitDialogue = function* (room) {
    room.locked = true;
    const pl = room.player; pl.face = 'normal';
    const M = (t, o = {}) => { room.momTalk = true; return ui.say('Mom', t, Object.assign({ face: room.momFace }, o)); };
    room.momAwake = true; room.momFace = S.momHealth > 60 ? 'happy' : 'tired';
    const paid = S.billPaid / S.bill;
    const v = S.momVisits;
    yield M(CH.pick(["There he is. {p}My working man.", "Chubby! {p}You smell like fries.", "Sweetheart. {p}Sit. Tell me everything.", "You came. {p}You always come."])); room.momTalk = false;
    const topics = ['Tell her about work', 'Ask how she feels', 'Talk about the bill', "Say nothing. Just sit."];
    const c = yield ui.choose('Chubby', '', topics);
    if (c === 0) {
      const job = CH.JOB_INFO[S.job].title;
      yield ui.say('Chubby', S.job === 'janitor' ? "I mopped up an entire cake today. A whole cake. {p}Someone dropped it and just... left." : `I'm ${job} now, Mom. {p}${S.job === 'ceo' ? 'I am the big D.' : 'It comes with a hat.'}`, { face: 'happy' });
      yield M(S.job === 'janitor' ? "A whole cake! {p}Did you save any? {pp}I'm kidding. {p}Mostly." : `${job}! {p}I told the nurse. I told the nurse's supervisor. I'm going to tell the vending machine.`, { face: 'happy' }); room.momTalk = false;
    } else if (c === 1) {
      yield ui.say('Chubby', 'How are you feeling? Honestly.');
      yield M(S.momHealth > 70 ? "Honestly? {p}Better. They say the surgery went well. {p}I walked to the window today. By myself. {p}It took nine minutes. I'm counting it." : S.momHealth > 40 ? "Some days good, some days... {p}the ceiling has forty-two tiles. {p}But the good days are winning." : "Tired, sweetheart. {pp}But I'm here. {p}And you're here. So that's two of us."); room.momTalk = false;
      if (S.momHealth <= 40) { yield ui.say('Chubby', "I'm here. {p}Every day I can.", { face: 'sad' }); }
    } else if (c === 2) {
      yield ui.say('Chubby', `It's ${CH.fmtMoney(S.bill - S.billPaid)} left. {p}I've paid ${Math.round(paid * 100)}%.`, { face: 'focused' });
      yield M(paid < 0.1 ? "Chubby. {pp}You don't have to— {p}I can talk to the bank, I can—" : paid < 0.5 ? "That's... {pp}that's a lot of mopping, sweetheart." : "You're really doing it. {pp}I don't know what to say. {p}I say a lot of things. I don't know what to say."); room.momTalk = false;
      yield ui.say('Chubby', paid < 0.1 ? "No. {p}I've got this. {p}I've never had anything. I've got this." : "One shift at a time.", { face: 'focused' });
    } else {
      pl.arm = 'hold'; yield 3; yield M("...", { auto: 2, noSkip: true }); room.momTalk = false; yield M("Your hands are warm today."); room.momTalk = false; yield ui.say('Chubby', "Fryer.", { face: 'happy' }); yield M("Fryer.", { face: 'happy' }); room.momTalk = false; pl.arm = 'idle';
    }
    // gifts
    const gifts = Object.keys(S.homeItems).filter((k) => k.startsWith('gift_') && !S.homeItems[k].given);
    for (const gk of gifts) { S.homeItems[gk].given = true; const name = S.homeItems[gk].name; yield ui.say('Chubby', `Oh— I brought you something. ${name}.`, { face: 'happy' }); yield M(CH.pick(["Oh, Chubby. {p}You didn't have to.", "Look at that. {p}Look at THAT.", "The nurses are going to be so jealous."]), { face: 'happy' }); room.momTalk = false; S.momMood = Math.min(100, S.momMood + 10); S.momHealth = Math.min(100, S.momHealth + 3); }
    yield M(CH.pick(["Go home, sweetheart. Sleep. {p}You have work.", "Visiting hours. That nurse is giving me the look. {p}Go. I love you.", "Go on. {p}Eat something green on the way."])); room.momTalk = false;
    yield ui.say('Chubby', "Love you, Mom.", { face: 'happy' });
    room.momAwake = false;
    if (room.onLeave) yield* room.onLeave();
    room.locked = false;
  };

  // ---- SHOP app (Amazoon) -----------------------------------------------------------------------------------
  CH.SHOP_ITEMS = [
    { id: 'groceries', name: 'Groceries (3 meals)', price: 24, desc: 'Food for the fridge. Pickles included.', repeat: true, apply: () => { S.groceries = (S.groceries || 0) + 3; } },
    { id: 'bluevolt', name: 'Blue Volt case (12)', price: 18, desc: '+15 energy now. Regret later.', repeat: true, apply: () => { S.energy = Math.min(100, S.energy + 15); } },
    { id: 'pillow', name: 'Memory Foam Pillow', price: 45, desc: 'Wake up with more energy every day.', apply: () => { S.homeItems.pillow = true; } },
    { id: 'gift_flowers', name: "Flowers for Mom", price: 15, desc: 'Bring them on your next visit (+mood).', repeat: true, apply: () => { S.homeItems['gift_flowers' + Date.now()] = { name: 'flowers', given: false }; } },
    { id: 'gift_blanket', name: "Cozy Blanket for Mom", price: 48, desc: 'Hospital blankets are sad. This one is not.', apply: () => { S.homeItems['gift_blanket'] = { name: 'a cozy blanket', given: false }; } },
    { id: 'gift_photos', name: 'Framed family photo', price: 30, desc: 'For her bedside table.', apply: () => { S.homeItems['gift_photos'] = { name: 'a framed photo of us', given: false }; } },
    { id: 'meds', name: "Mom's medication copay", price: 120, desc: 'Covers a week of the good pills. +health.', repeat: true, apply: () => { S.momHealth = Math.min(100, S.momHealth + 6); } },
    { id: 'physio', name: 'Physiotherapy sessions', price: 320, desc: 'Weekly physio. Mom recovers faster every day.', apply: () => { S.homeItems.physio = true; S.momHealth = Math.min(100, S.momHealth + 8); } },
    { id: 'ramp', name: 'Cabin wheelchair ramp', price: 650, desc: 'Needed before Mom can come home.', apply: () => { S.homeItems.ramp = true; } },
    { id: 'tv', name: 'New 55" TV', price: 420, desc: 'Blue Hedgehog has never looked so blue.', apply: () => { S.homeItems.tv = true; } },
    { id: 'couch', name: 'New Couch', price: 380, desc: 'Does not sag. Yet.', apply: () => { S.homeItems.couch = true; } },
    { id: 'heater', name: 'Space Heater', price: 90, desc: '21 degrees, Mom. TWENTY-ONE.', apply: () => { S.homeItems.heater = true; } },
  ];
  CH.drawShopApp = (ph, g, cw, ch, st, a) => {
    ph.header('Amazoon', '#f0a030', 'Prime Moose');
    let yy = 18;
    if (st.msg) { gfx.rrect(6, yy, cw - 12, 12, 2, '#e8f8e8'); gfx.text(st.msg, cw / 2, yy + 3, '#3a9a5a', { align: 'center', font: 'small' }); yy += 16; }
    for (const it of CH.SHOP_ITEMS) {
      const owned = !it.repeat && (S.homeItems[it.id] || (it.id.startsWith('gift_') && S.homeItems[it.id]));
      ph.row(yy, 30, () => { gfx.rect(6, yy + 4, 22, 22, '#fff8e8'); gfx.frame(6, yy + 4, 22, 22, '#e8d8c0'); gfx.text(it.name[0], 17, yy + 11, '#f0a030', { align: 'center' }); gfx.text(it.name.length > 24 ? it.name.slice(0, 24) + '…' : it.name, 32, yy + 4, '#1a1a2a', { font: 'small' }); gfx.text(it.desc.slice(0, 30), 32, yy + 12, '#666', { font: 'small' }); gfx.text(owned ? 'OWNED' : CH.fmtMoney(it.price), cw - 8, yy + 20, owned ? '#3a9a5a' : S.money >= it.price ? '#c8352b' : '#aaa', { align: 'right', font: 'small' }); }, owned ? null : () => { if (S.money >= it.price) { CH.addMoney(-it.price); it.apply(); CH.phoneData().bankTx.unshift(['Amazoon: ' + it.name, -it.price]); A.sfx('buy'); st.msg = 'Ordered: ' + it.name + ' (delivered instantly by moose)'; CH.save(); } else { A.sfx('error'); st.msg = 'Not enough money.'; } });
      yy += 30;
    }
    a.contentH = yy + 10;
  };
  CH.drawDonaldsApp = (ph, g, cw, ch, st, a) => {
    ph.header("Donald's Crew", '#c8352b', CH.JOB_INFO[S.job].title);
    let yy = 20;
    gfx.rrect(6, yy, cw - 12, 40, 3, '#fff0f0'); gfx.frame(6, yy, cw - 12, 40, '#c8352b');
    gfx.text('Employee: Chubby Q.', 10, yy + 4, '#333', { font: 'small' }); gfx.text('Role: ' + CH.JOB_INFO[S.job].title, 10, yy + 12, '#c8352b', { font: 'small' }); gfx.text('Wage: ' + CH.fmtMoney(CH.JOB_INFO[S.job].wage) + '/hr', 10, yy + 20, '#333', { font: 'small' }); gfx.text('Shifts: ' + S.shiftsWorked + '  Rep: ' + S.reputation, 10, yy + 28, '#333', { font: 'small' });
    yy += 46;
    gfx.text('Career Tower: Floor ' + S.towerFloor, 8, yy, '#1a1a2a', { font: 'small' }); yy += 10;
    const idx = CH.JOBS.indexOf(S.job), next = CH.JOBS[idx + 1];
    if (next) { const shifts = (S.jobShifts && S.jobShifts[S.job]) || 0; gfx.text('Next: ' + CH.JOB_INFO[next].title, 8, yy, '#333', { font: 'small' }); yy += 8; gfx.text(`- shifts at current role: ${shifts}/2`, 10, yy, shifts >= 2 ? '#3a9a5a' : '#c8352b', { font: 'small' }); yy += 8; gfx.text(`- tower floor ${CH.JOB_INFO[next].floor}: ${S.towerFloor >= CH.JOB_INFO[next].floor ? 'OK' : 'locked'}`, 10, yy, S.towerFloor >= CH.JOB_INFO[next].floor ? '#3a9a5a' : '#c8352b', { font: 'small' }); yy += 12; }
    gfx.text('Stats', 8, yy, '#1a1a2a', { font: 'small' }); yy += 9;
    const st2 = S.stats; for (const [k, v] of [['Burgers made', st2.burgers], ['Spills mopped', st2.spillsMopped], ['Bins emptied', st2.binsEmptied], ['Customers served', st2.customersServed], ['Hours worked', st2.hours], ['Total earned', CH.fmtMoney(st2.earned)]]) { gfx.text(k, 10, yy, '#555', { font: 'small' }); gfx.text(String(v), cw - 8, yy, '#333', { align: 'right', font: 'small' }); yy += 8; }
    a.contentH = yy + 10;
  };

  // ---- ENDING: the bill is paid ----------------------------------------------------------------------------------------
  CH.onDebtPaid = () => { if (S.debtPaidOff) return; S.debtPaidOff = true; CH.flag('debtPaid', true); CH.save(); ui.toast("THE BILL IS PAID. Mom can come home!", '#f5c33b', 5); A.sfx('fanfare'); CH.sendText('Mom', "The nurse just told me. {p}Chubby. {p}Chubby, what did you DO. Come get me. Come get me right now. ♥♥♥"); CH.pendingEnding = true; };
  // hook: when the player next goes home or visits, run the ending
  const origHome = CH.homeEvening;
  CH.homeEvening = (opts) => { if (CH.pendingEnding && !S.momHome) { CH.pendingEnding = false; CH.endingSequence(); return; } origHome(opts); };
  const origHosp = CH.goToHospital;
  CH.goToHospital = () => { if (CH.pendingEnding && !S.momHome) { CH.pendingEnding = false; CH.endingSequence(); return; } origHosp(); };
  CH.endingSequence = () => {
    const s = new CH.Scene(); s.draw = (g) => gfx.rect(0, 0, W, H, '#000');
    s.enter = () => s.run((function* () {
      A.stop(0.5); fx.setFade(1);
      yield fx.showCard('SOME WEEKS LATER', '', 2.5, '#e8e0c8');
      // hospital room: discharge
      const room = new CH.MomRoomScene({ mode: 'visit' }); room.enter = function () { fx.setFade(1); A.play('victory', 1); };
      CH.game.set(room); room.locked = true; room.momAwake = true; room.momFace = 'happy'; room.player.x = 120; room.player.face = 'happy'; room.player.outfit = S.outfit === 'suit' ? 'suit' : 'hoodie';
      yield fx.fadeIn(1.5);
      const doc = CH.makeDoctor(60, room.floorY + 1); doc.arm = 'clipboard'; room.addNPC(doc);
      yield ui.say('Doctor', "Mrs. Quillsworth, your discharge papers. {p}Balance: zero. {pp}I've been doing this twenty years. I don't see zero very often.");
      yield ui.say('Mom', "My son did that.", { face: 'happy' });
      yield ui.say('Doctor', "I heard. {p}The whole ward heard. {p}The vending machine heard.");
      yield ui.say('Chubby', "Let's go home, Mom.", { face: 'happy' });
      yield ui.say('Mom', "...Yes. {pp}Yes. Let's.", { face: 'happy' });
      yield fx.fadeOut(1.5);
      // cabin: mom home
      S.momHome = true; S.chapter = 'career'; S.hour = 8; CH.save();
      const cabin = new CH.CabinScene({ mode: 'home', momPresent: true, playerX: 600 });
      cabin.tvMode = 'off'; cabin.fire.st.lit = true; cabin.pancakes.st.eaten = false; cabin.stove.st.steam = true; cabin.bgDirty = true;
      cabin.mom.x = 640; cabin.mom.flip = true; cabin.mom.face = 'happy';
      cabin.player.outfit = 'hoodie'; cabin.player.arm = 'hold';
      CH.game.set(cabin); cabin.locked = true;
      yield fx.fadeIn(1.5); A.play('cabin', 2);
      yield ui.say('', 'Saturday. 8 AM. The cabin smells like pancakes. {pp}For the first time, Chubby made them.', { color: '#cfc8e8', slow: true });
      yield ui.say('Mom', "They're... {pp}Chubby, these are terrible.", { face: 'happy' });
      yield ui.say('Chubby', "I know.", { face: 'happy' });
      yield ui.say('Mom', "They're the best pancakes I've ever had.", { face: 'happy' });
      yield ui.say('Chubby', "I know.", { face: 'happy' });
      yield 1.0;
      yield ui.say('Mom', "So. {p}What now? You've got a career. A tower. A visor. {p}Do you keep going?", { face: 'happy' });
      yield ui.say('Chubby', "I don't know. {pp}Maybe. {p}There's a rumour about a floor eleven. {pp}But first: Blue Hedgehog. Two-player. You're Man Egg.", { face: 'happy' });
      yield ui.say('Mom', "I'm ALWAYS Man Egg.", { face: 'happy' });
      yield fx.fadeOut(2);
      yield fx.showCard('CHUBBY THE PORCUPINE', 'Thanks for playing. The tower is still there, if you want it.', 5, '#f5c33b', { sub2: `Days: ${S.day}  -  Shifts: ${S.shiftsWorked}  -  Earned: ${CH.fmtMoney(S.stats.earned)}  -  Pancakes: ${S.stats.pancakes}` });
      S.hour = 9; CH.save();
      CH.homeEvening({ msg: "Mom's home. {p}The bill is paid. {pp}I'm still going to work tomorrow. {p}Turns out I like it. Don't tell Brenda." });
    })());
    CH.game.set(s);
  };

  CH.SCENES.career = () => { CH.load(); S.chapter = 'career'; S.job = S.job || 'janitor'; CH.flag('hasPhone', true); S.money = Math.max(S.money, 200); const s = new CH.Scene(); s.enter = () => CH.startCareerDay(); return s; };
  CH.SCENES.evening = () => { S.chapter = 'career'; S.job = 'janitor'; CH.flag('hasPhone', true); S.hour = 19; S.groceries = 3; const s = new CH.Scene(); s.enter = () => CH.homeEvening({ msg: 'Test evening.' }); return s; };
  CH.SCENES.ending = () => { S.chapter = 'career'; S.job = 'ceo'; const s = new CH.Scene(); s.enter = () => CH.endingSequence(); return s; };
})(window.CH);
