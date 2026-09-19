// ============================================================================
// Game state + save/load
// ============================================================================
(function (CH) {
  const SAVE_KEY = 'chubby_porcupine_save_v1';
  const defaults = () => ({
    version: 1,
    chapter: 'intro', // intro | game | emergency | hospital | jobsearch | interview | career
    day: 1,
    hour: 7, // in-game hour (float)
    money: 12.5,
    bill: 84230.17,
    billPaid: 0,
    debtPaidOff: false,
    job: null, // 'janitor' | 'bagging' | ...
    jobLevel: 0,
    shiftsWorked: 0,
    shiftScores: [],
    reputation: 0,
    upgrades: {},
    towerFloor: 1,
    outfit: 'hoodie',
    flags: {},
    inventory: {},
    momHealth: 20, // 0..100
    momMood: 50,
    momVisits: 0,
    momHome: false,
    energy: 100,
    hunger: 40,
    applied: {}, // jobId -> status
    messages: [], // phone messages
    notifications: [],
    stats: { burgers: 0, spillsMopped: 0, binsEmptied: 0, ringsCollected: 0, customersServed: 0, pancakes: 0, hours: 0, earned: 0 },
    homeItems: {}, // purchased home stuff
    tutorialSeen: {},
    interviewScore: 0,
    time: 0,
  });
  const S = (CH.state = defaults());
  CH.resetState = () => { Object.assign(S, defaults()); };

  // ---- save slots ------------------------------------------------------------
  // Slot 0 is the autosave the game writes on its own; 1-3 are the player's.
  // Every read is wrapped: private windows and blocked site data throw here.
  CH.SLOTS = [0, 1, 2, 3];
  CH.slotKey = (n) => (n ? SAVE_KEY + '_s' + n : SAVE_KEY);
  const readSlot = (n) => {
    try {
      const raw = localStorage.getItem(CH.slotKey(n));
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  };
  CH.saveTo = (n) => {
    try {
      const snap = Object.assign({}, S, { savedAt: Date.now(), slot: n });
      localStorage.setItem(CH.slotKey(n), JSON.stringify(snap));
      CH.lastSaveT = (CH.game && CH.game.t) || 0;
      return true;
    } catch (e) { return false; }
  };
  CH.loadFrom = (n) => {
    const d = readSlot(n);
    if (!d) return false;
    Object.assign(S, defaults(), d);
    S.stats = Object.assign(defaults().stats, d.stats || {});
    return true;
  };
  CH.clearSlot = (n) => { try { localStorage.removeItem(CH.slotKey(n)); } catch (e) {} };
  // Summary for the save/load menu: null when the slot is empty.
  CH.slotInfo = (n) => {
    const d = readSlot(n);
    if (!d) return null;
    const job = d.job ? (CH.JOB_INFO && CH.JOB_INFO[d.job] ? CH.JOB_INFO[d.job].title : d.job) : 'Unemployed';
    return {
      slot: n, day: d.day || 1, hour: d.hour || 7, money: d.money || 0,
      job, chapter: d.chapter || 'intro', outfit: d.outfit || 'hoodie',
      billLeft: Math.max(0, (d.bill || 0) - (d.billPaid || 0)),
      momHome: !!d.momHome, savedAt: d.savedAt || 0,
    };
  };
  CH.anySave = () => CH.SLOTS.some((n) => !!readSlot(n));
  // Most recent slot, for Continue on the title screen.
  CH.newestSlot = () => {
    let best = null, bt = -1;
    for (const n of CH.SLOTS) {
      const d = readSlot(n);
      if (d && (d.savedAt || 0) > bt) { bt = d.savedAt || 0; best = n; }
    }
    return best;
  };

  // Autosave: called at natural breakpoints (waking, arriving, shift end).
  CH.autosave = (reason) => {
    if (S.noAutosave) return false;
    const ok = CH.saveTo(0);
    if (ok && CH.ui) { CH.ui.savedFlash = 1.6; CH.ui.savedLabel = reason || 'Autosaved'; }
    return ok;
  };

  // Back-compat: the rest of the game still calls save/load/hasSave/clearSave.
  CH.save = () => CH.saveTo(0);
  CH.hasSave = () => CH.anySave();
  CH.load = () => { const n = CH.newestSlot(); return n === null ? false : CH.loadFrom(n); };
  CH.clearSave = () => { CH.clearSlot(0); };
  CH.flag = (k, v) => { if (v === undefined) return !!S.flags[k]; S.flags[k] = v; return v; };
  CH.has = (up) => !!S.upgrades[up];
  CH.addMoney = (n, silent) => {
    S.money = Math.round((S.money + n) * 100) / 100;
    if (n > 0) S.stats.earned += n;
    if (!silent) CH.ui.moneyFlash = 0.8;
  };
  CH.timeStr = (h) => {
    h = h === undefined ? S.hour : h;
    const hh = Math.floor(h) % 24, mm = Math.floor((h % 1) * 60);
    const ap = hh >= 12 ? 'PM' : 'AM';
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    return `${h12}:${CH.pad2(mm)} ${ap}`;
  };
  CH.JOBS = ['janitor', 'bagging', 'fries', 'grill', 'assembly', 'cashier', 'drivethru', 'shiftlead', 'manager', 'regional', 'vp', 'cbo', 'ceo'];
  CH.JOB_INFO = {
    janitor: { title: 'Janitor', wage: 15.5, floor: 1, desc: 'Mop. Wipe. Empty bins. Survive the bathrooms.' },
    bagging: { title: 'Bagging Specialist', wage: 16.25, floor: 2, desc: 'Put the right food in the right bag. Fast.' },
    fries: { title: 'Fries & Drinks', wage: 17, floor: 2, desc: 'Fryer baskets, salt, cups. Do not overflow.' },
    grill: { title: 'Grill Cook', wage: 18.5, floor: 3, desc: 'Patties. Flip them. Do not burn them.' },
    assembly: { title: 'Burger Architect', wage: 19.5, floor: 3, desc: 'Build burgers exactly to order.' },
    cashier: { title: 'Cashier', wage: 20, floor: 4, desc: 'Take orders at the register. Smile.' },
    drivethru: { title: 'Drive-Thru Operator', wage: 21, floor: 4, desc: 'Decode what the speaker is saying.' },
    shiftlead: { title: 'Shift Leader', wage: 24, floor: 5, desc: 'Manage the crew. Put out fires (literal).' },
    manager: { title: 'Store Manager', wage: 29, floor: 6, desc: 'Schedules, inventory, angry emails.' },
    regional: { title: 'Regional Sauce Consultant', wage: 41, floor: 7, desc: 'Calibrate sauce ratios across the province.' },
    vp: { title: 'VP of Synergy', wage: 68, floor: 8, desc: 'Say words in meetings. Many words.' },
    cbo: { title: 'Chief Burger Officer', wage: 120, floor: 9, desc: 'Approve burgers. Reject burgers.' },
    ceo: { title: 'CEO of Donald\'s', wage: 400, floor: 10, desc: 'The big D itself.' },
  };
  CH.jobIndex = () => CH.JOBS.indexOf(S.job);
})(window.CH);
