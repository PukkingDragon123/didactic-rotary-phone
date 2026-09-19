// ============================================================================
// Audio: synthesized SFX + tiny music sequencer (Web Audio, no assets)
// ============================================================================
(function (CH) {
  const A = (CH.audio = { ctx: null, master: null, sfxGain: null, musGain: null, muted: false, unlocked: false, current: null, volume: 0.8 });

  A.unlock = () => {
    if (A.unlocked) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      A.ctx = new Ctx();
      A.master = A.ctx.createGain(); A.master.gain.value = A.volume; A.master.connect(A.ctx.destination);
      A.sfxGain = A.ctx.createGain(); A.sfxGain.gain.value = 0.9; A.sfxGain.connect(A.master);
      A.musGain = A.ctx.createGain(); A.musGain.gain.value = 0.55; A.musGain.connect(A.master);
      // ambient bus with lowpass
      A.ambGain = A.ctx.createGain(); A.ambGain.gain.value = 0.5; A.ambGain.connect(A.master);
      A.unlocked = true;
      if (A._pendingSong) { A.play(A._pendingSong); A._pendingSong = null; }
    } catch (e) { console.warn('audio unavailable', e); }
  };
  A.toggleMute = () => { A.muted = !A.muted; if (A.master) A.master.gain.value = A.muted ? 0 : A.volume; return A.muted; };
  A.setMuffle = (on) => { // hospital shock effect
    if (!A.ctx) return;
    A.musGain.gain.setTargetAtTime(on ? 0.12 : 0.55, A.ctx.currentTime, 0.4);
  };

  const now = () => (A.ctx ? A.ctx.currentTime : 0);

  // ---- low-level tone --------------------------------------------------------
  function tone({ f = 440, f2, type = 'square', dur = 0.1, vol = 0.3, attack = 0.005, decay, dest, when = 0, slide, detune = 0, filter }) {
    if (!A.ctx) return;
    const t0 = now() + when;
    const o = A.ctx.createOscillator();
    o.type = type; o.frequency.setValueAtTime(f, t0);
    if (detune) o.detune.value = detune;
    if (f2 !== undefined) o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t0 + dur);
    else if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(1, f * slide), t0 + dur);
    const gn = A.ctx.createGain();
    gn.gain.setValueAtTime(0, t0);
    gn.gain.linearRampToValueAtTime(vol, t0 + attack);
    const d = decay !== undefined ? decay : dur;
    gn.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(attack + 0.005, d));
    let node = o;
    if (filter) { const fl = A.ctx.createBiquadFilter(); fl.type = filter.type || 'lowpass'; fl.frequency.value = filter.f || 1200; fl.Q.value = filter.q || 1; o.connect(fl); node = fl; }
    node.connect(gn); gn.connect(dest || A.sfxGain);
    o.start(t0); o.stop(t0 + Math.max(d, dur) + 0.05);
    return o;
  }
  A.tone = tone;
  let noiseBuf = null;
  function noise({ dur = 0.2, vol = 0.3, when = 0, filter, dest, decay }) {
    if (!A.ctx) return;
    if (!noiseBuf) {
      noiseBuf = A.ctx.createBuffer(1, A.ctx.sampleRate * 2, A.ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const t0 = now() + when;
    const src = A.ctx.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
    const gn = A.ctx.createGain();
    gn.gain.setValueAtTime(vol, t0);
    gn.gain.exponentialRampToValueAtTime(0.0001, t0 + (decay || dur));
    let node = src;
    if (filter) { const fl = A.ctx.createBiquadFilter(); fl.type = filter.type || 'lowpass'; fl.frequency.value = filter.f || 1000; fl.Q.value = filter.q || 0.7; src.connect(fl); node = fl; }
    node.connect(gn); gn.connect(dest || A.sfxGain);
    src.start(t0); src.stop(t0 + dur + 0.05);
    return src;
  }
  A.noise = noise;

  // ---- SFX library -------------------------------------------------------------
  const SFX = {
    blip: () => tone({ f: 880, type: 'square', dur: 0.05, vol: 0.15 }),
    blip2: () => tone({ f: 660, type: 'square', dur: 0.04, vol: 0.12 }),
    select: () => { tone({ f: 520, type: 'square', dur: 0.06, vol: 0.15 }); tone({ f: 780, type: 'square', dur: 0.08, vol: 0.15, when: 0.06 }); },
    back: () => tone({ f: 400, f2: 200, type: 'square', dur: 0.1, vol: 0.12 }),
    talk: () => tone({ f: 300 + Math.random() * 200, type: 'triangle', dur: 0.03, vol: 0.08 }),
    step: () => noise({ dur: 0.05, vol: 0.06, filter: { f: 600 } }),
    stepWood: () => { noise({ dur: 0.05, vol: 0.05, filter: { f: 500 } }); tone({ f: 120, f2: 60, type: 'sine', dur: 0.05, vol: 0.08 }); },
    jump: () => tone({ f: 300, f2: 700, type: 'square', dur: 0.15, vol: 0.18 }),
    djump: () => { tone({ f: 500, f2: 1100, type: 'square', dur: 0.14, vol: 0.18 }); tone({ f: 700, f2: 1400, type: 'square', dur: 0.12, vol: 0.1, when: 0.05 }); },
    land: () => { noise({ dur: 0.08, vol: 0.12, filter: { f: 400 } }); tone({ f: 150, f2: 70, type: 'sine', dur: 0.08, vol: 0.2 }); },
    ring: () => { tone({ f: 1320, type: 'square', dur: 0.08, vol: 0.12 }); tone({ f: 1760, type: 'square', dur: 0.14, vol: 0.12, when: 0.06 }); },
    kick: () => { noise({ dur: 0.12, vol: 0.2, filter: { f: 900 } }); tone({ f: 200, f2: 60, type: 'square', dur: 0.12, vol: 0.2 }); },
    hurt: () => { tone({ f: 400, f2: 100, type: 'sawtooth', dur: 0.3, vol: 0.2 }); noise({ dur: 0.2, vol: 0.15 }); },
    spring: () => tone({ f: 200, f2: 1200, type: 'square', dur: 0.25, vol: 0.18 }),
    boss: () => { tone({ f: 80, f2: 40, type: 'sawtooth', dur: 0.4, vol: 0.25 }); noise({ dur: 0.3, vol: 0.2, filter: { f: 300 } }); },
    bossHit: () => { tone({ f: 600, f2: 100, type: 'square', dur: 0.2, vol: 0.2 }); noise({ dur: 0.15, vol: 0.2, filter: { f: 2000 } }); },
    explode: () => { noise({ dur: 0.5, vol: 0.35, filter: { f: 700 } }); tone({ f: 120, f2: 30, type: 'sawtooth', dur: 0.5, vol: 0.3 }); },
    alarm: () => { for (let i = 0; i < 6; i++) tone({ f: i % 2 ? 1800 : 1500, type: 'square', dur: 0.05, vol: 0.18, when: i * 0.055 }); },
    crash: () => {
      noise({ dur: 1.2, vol: 0.6, filter: { f: 900 } });
      tone({ f: 90, f2: 25, type: 'sawtooth', dur: 1.0, vol: 0.5 });
      for (let i = 0; i < 8; i++) tone({ f: 1500 + Math.random() * 3000, f2: 200, type: 'square', dur: 0.15, vol: 0.12, when: 0.1 + i * 0.07 });
    },
    glass: () => { for (let i = 0; i < 5; i++) tone({ f: 2500 + Math.random() * 2500, f2: 1000, type: 'triangle', dur: 0.1, vol: 0.1, when: i * 0.04 }); },
    thud: () => { noise({ dur: 0.15, vol: 0.3, filter: { f: 300 } }); tone({ f: 100, f2: 40, type: 'sine', dur: 0.2, vol: 0.4 }); },
    tvOn: () => { tone({ f: 60, f2: 4000, type: 'sine', dur: 0.3, vol: 0.15 }); noise({ dur: 0.4, vol: 0.12, filter: { f: 4000, type: 'highpass' } }); },
    tvOff: () => tone({ f: 3000, f2: 40, type: 'sine', dur: 0.4, vol: 0.2 }),
    static: () => noise({ dur: 0.6, vol: 0.15, filter: { f: 3000, type: 'highpass' } }),
    eat: () => { for (let i = 0; i < 3; i++) noise({ dur: 0.08, vol: 0.12, when: i * 0.13, filter: { f: 800 } }); },
    yum: () => { tone({ f: 500, f2: 700, type: 'triangle', dur: 0.12, vol: 0.15 }); tone({ f: 700, f2: 900, type: 'triangle', dur: 0.15, vol: 0.15, when: 0.12 }); },
    door: () => { tone({ f: 150, f2: 90, type: 'triangle', dur: 0.15, vol: 0.2 }); noise({ dur: 0.1, vol: 0.06, when: 0.1 }); },
    couch: () => { noise({ dur: 0.25, vol: 0.2, filter: { f: 250 } }); tone({ f: 90, f2: 50, type: 'sine', dur: 0.25, vol: 0.25 }); },
    phoneRing: () => { for (let i = 0; i < 10; i++) tone({ f: i % 2 ? 1100 : 900, type: 'sine', dur: 0.06, vol: 0.15, when: i * 0.06 }); },
    dial: () => { tone({ f: 350, type: 'sine', dur: 0.3, vol: 0.1 }); tone({ f: 440, type: 'sine', dur: 0.3, vol: 0.1 }); },
    rotary: () => noise({ dur: 0.35, vol: 0.08, filter: { f: 3000, type: 'bandpass', q: 2 } }),
    rotaryClick: () => tone({ f: 2000, type: 'square', dur: 0.015, vol: 0.06 }),
    siren: () => { tone({ f: 600, f2: 900, type: 'square', dur: 0.5, vol: 0.12 }); tone({ f: 900, f2: 600, type: 'square', dur: 0.5, vol: 0.12, when: 0.5 }); },
    beep: () => tone({ f: 1000, type: 'sine', dur: 0.08, vol: 0.12 }),
    heartbeat: () => { tone({ f: 60, f2: 40, type: 'sine', dur: 0.15, vol: 0.35 }); tone({ f: 55, f2: 35, type: 'sine', dur: 0.12, vol: 0.25, when: 0.22 }); },
    vending: () => { tone({ f: 200, f2: 150, type: 'square', dur: 0.2, vol: 0.12 }); noise({ dur: 0.3, vol: 0.15, when: 0.3, filter: { f: 500 } }); tone({ f: 120, f2: 60, type: 'sine', dur: 0.2, vol: 0.2, when: 0.6 }); },
    coin: () => { tone({ f: 988, type: 'square', dur: 0.08, vol: 0.15 }); tone({ f: 1319, type: 'square', dur: 0.25, vol: 0.15, when: 0.08 }); },
    cash: () => { tone({ f: 1200, type: 'square', dur: 0.05, vol: 0.12 }); tone({ f: 1600, type: 'square', dur: 0.05, vol: 0.12, when: 0.06 }); tone({ f: 2000, type: 'square', dur: 0.2, vol: 0.14, when: 0.12 }); },
    error: () => { tone({ f: 200, type: 'square', dur: 0.12, vol: 0.15 }); tone({ f: 150, type: 'square', dur: 0.2, vol: 0.15, when: 0.13 }); },
    good: () => { tone({ f: 523, type: 'square', dur: 0.08, vol: 0.13 }); tone({ f: 659, type: 'square', dur: 0.08, vol: 0.13, when: 0.08 }); tone({ f: 784, type: 'square', dur: 0.2, vol: 0.13, when: 0.16 }); },
    fanfare: () => { const n = [523, 523, 523, 659, 784, 659, 784]; const d = [0.1, 0.1, 0.1, 0.25, 0.15, 0.15, 0.5]; let t = 0; n.forEach((f, i) => { tone({ f, type: 'square', dur: d[i], vol: 0.15, when: t }); tone({ f: f / 2, type: 'triangle', dur: d[i], vol: 0.1, when: t }); t += d[i]; }); },
    sad: () => { const n = [392, 370, 349, 330]; n.forEach((f, i) => tone({ f, type: 'triangle', dur: 0.5, vol: 0.14, when: i * 0.45 })); },
    notify: () => { tone({ f: 1200, type: 'sine', dur: 0.08, vol: 0.14 }); tone({ f: 1600, type: 'sine', dur: 0.15, vol: 0.14, when: 0.1 }); },
    tap: () => tone({ f: 1500, type: 'sine', dur: 0.03, vol: 0.1 }),
    key: () => tone({ f: 900 + Math.random() * 300, type: 'sine', dur: 0.03, vol: 0.09 }),
    swipe: () => noise({ dur: 0.12, vol: 0.06, filter: { f: 2500, type: 'highpass' } }),
    whoosh: () => noise({ dur: 0.3, vol: 0.15, filter: { f: 1500, type: 'bandpass', q: 0.5 } }),
    pop: () => tone({ f: 600, f2: 1200, type: 'sine', dur: 0.06, vol: 0.15 }),
    mop: () => noise({ dur: 0.2, vol: 0.1, filter: { f: 800, type: 'bandpass', q: 0.8 } }),
    splash: () => { noise({ dur: 0.3, vol: 0.15, filter: { f: 1200 } }); tone({ f: 400, f2: 150, type: 'sine', dur: 0.15, vol: 0.1 }); },
    sizzle: () => noise({ dur: 0.5, vol: 0.08, filter: { f: 5000, type: 'highpass' } }),
    flip: () => { noise({ dur: 0.08, vol: 0.1, filter: { f: 1500 } }); tone({ f: 500, f2: 900, type: 'sine', dur: 0.08, vol: 0.1 }); },
    snap: () => { tone({ f: 800, f2: 1600, type: 'square', dur: 0.05, vol: 0.12 }); noise({ dur: 0.05, vol: 0.08 }); },
    ding: () => { tone({ f: 1760, type: 'sine', dur: 0.5, vol: 0.15 }); tone({ f: 2637, type: 'sine', dur: 0.4, vol: 0.06 }); },
    bell: () => { tone({ f: 2200, type: 'sine', dur: 0.6, vol: 0.12 }); tone({ f: 2200 * 1.5, type: 'sine', dur: 0.3, vol: 0.05 }); },
    squirt: () => noise({ dur: 0.15, vol: 0.12, filter: { f: 700, type: 'bandpass', q: 1.5 } }),
    fill: () => noise({ dur: 0.1, vol: 0.06, filter: { f: 1800, type: 'bandpass', q: 1 } }),
    paper: () => noise({ dur: 0.12, vol: 0.1, filter: { f: 3500, type: 'highpass' } }),
    trash: () => { noise({ dur: 0.2, vol: 0.15, filter: { f: 600 } }); tone({ f: 200, f2: 80, type: 'square', dur: 0.15, vol: 0.1 }); },
    scrub: () => noise({ dur: 0.1, vol: 0.08, filter: { f: 1200, type: 'bandpass', q: 1 } }),
    flush: () => { noise({ dur: 1.2, vol: 0.15, filter: { f: 500 } }); tone({ f: 200, f2: 60, type: 'sine', dur: 1.0, vol: 0.1 }); },
    burn: () => { noise({ dur: 0.4, vol: 0.15, filter: { f: 2000, type: 'highpass' } }); tone({ f: 300, f2: 100, type: 'sawtooth', dur: 0.3, vol: 0.1 }); },
    angry: () => { tone({ f: 200, f2: 150, type: 'sawtooth', dur: 0.2, vol: 0.12 }); tone({ f: 180, f2: 120, type: 'sawtooth', dur: 0.2, vol: 0.12, when: 0.2 }); },
    tick: () => tone({ f: 2000, type: 'square', dur: 0.015, vol: 0.08 }),
    tock: () => tone({ f: 1500, type: 'square', dur: 0.015, vol: 0.08 }),
    elevator: () => { tone({ f: 100, f2: 130, type: 'sine', dur: 1.5, vol: 0.12 }); },
    buy: () => { tone({ f: 660, type: 'square', dur: 0.07, vol: 0.13 }); tone({ f: 880, type: 'square', dur: 0.07, vol: 0.13, when: 0.07 }); tone({ f: 1320, type: 'square', dur: 0.18, vol: 0.13, when: 0.14 }); },
    unlock: () => { [523, 659, 784, 1047].forEach((f, i) => tone({ f, type: 'triangle', dur: 0.3, vol: 0.14, when: i * 0.09 })); },
    snore: () => tone({ f: 90, f2: 70, type: 'sawtooth', dur: 0.6, vol: 0.06, filter: { f: 400 } }),
    yawn: () => tone({ f: 300, f2: 200, type: 'triangle', dur: 0.6, vol: 0.1 }),
    stomach: () => tone({ f: 70, f2: 50, type: 'sawtooth', dur: 0.6, vol: 0.15, filter: { f: 300 } }),
    gasp: () => noise({ dur: 0.25, vol: 0.12, filter: { f: 2000, type: 'highpass' } }),
    footBig: () => { noise({ dur: 0.1, vol: 0.15, filter: { f: 300 } }); tone({ f: 80, f2: 40, type: 'sine', dur: 0.15, vol: 0.3 }); },
    bus: () => { tone({ f: 60, f2: 50, type: 'sawtooth', dur: 1.5, vol: 0.15, filter: { f: 200 } }); noise({ dur: 1.5, vol: 0.1, filter: { f: 300 } }); },
    moose: () => tone({ f: 150, f2: 110, type: 'sawtooth', dur: 0.8, vol: 0.15, filter: { f: 600 } }),
    honk: () => { tone({ f: 350, type: 'sawtooth', dur: 0.3, vol: 0.15 }); tone({ f: 440, type: 'sawtooth', dur: 0.3, vol: 0.15 }); },
    camera: () => { noise({ dur: 0.05, vol: 0.15, filter: { f: 3000, type: 'highpass' } }); tone({ f: 3000, type: 'square', dur: 0.03, vol: 0.1, when: 0.05 }); },
  };
  A.sfx = (name) => { if (!A.ctx || A.muted) return; const f = SFX[name]; if (f) f(); else console.warn('no sfx', name); };

  // ---- music sequencer ------------------------------------------------------------
  // song: {bpm, loop:true, tracks:[{type, vol, notes:"C4 E4 . G4 ...", step:0.25 (beats)}]}
  // note tokens: 'C4', 'C#4', '.', '-' (hold)
  const NOTE_IDX = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
  A.noteFreq = (tok) => {
    const m = /^([A-G][#b]?)(\d)$/.exec(tok);
    if (!m) return 0;
    const n = NOTE_IDX[m[1]] + 12 * (parseInt(m[2]) + 1);
    return 440 * Math.pow(2, (n - 69) / 12);
  };
  A.SONGS = {};
  A.play = (name, fadeIn = 0.5) => {
    if (!A.ctx) { A._pendingSong = name; return; }
    if (A.current && A.current.name === name) return;
    A.stop(0.4);
    const song = A.SONGS[name];
    if (!song) return;
    const gain = A.ctx.createGain(); gain.gain.setValueAtTime(0, now()); gain.gain.linearRampToValueAtTime(1, now() + fadeIn); gain.connect(A.musGain);
    const st = { name, song, gain, pos: 0, nextTime: now() + 0.05, alive: true, tracks: song.tracks.map((t) => ({ ...t, seq: t.notes.trim().split(/\s+/), i: 0 })) };
    A.current = st;
    st.timer = setInterval(() => scheduleAhead(st), 60);
    scheduleAhead(st);
  };
  A.stop = (fade = 0.5) => {
    const st = A.current;
    if (!st) return;
    st.alive = false; clearInterval(st.timer);
    try { st.gain.gain.setTargetAtTime(0, now(), fade / 3); } catch (e) {}
    setTimeout(() => { try { st.gain.disconnect(); } catch (e) {} }, fade * 1000 + 200);
    A.current = null;
  };
  function scheduleAhead(st) {
    if (!st.alive || !A.ctx) return;
    const beat = 60 / st.song.bpm;
    const lookahead = 0.25;
    while (st.nextTime < now() + lookahead) {
      const stepDur = beat * (st.song.step || 0.25);
      // schedule each track's current token
      for (const tr of st.tracks) {
        const tok = tr.seq[tr.i % tr.seq.length];
        if (tok !== '.' && tok !== '-') {
          // note length: count following '-' holds
          let len = 1;
          for (let k = 1; k < 64; k++) { if (tr.seq[(tr.i + k) % tr.seq.length] === '-') len++; else break; }
          const f = A.noteFreq(tok);
          if (f) {
            const d = stepDur * len * (tr.gate || 0.9);
            tone({ f, type: tr.type || 'square', dur: d, decay: d, vol: tr.vol || 0.1, attack: tr.attack || 0.01, dest: st.gain, when: st.nextTime - now(), detune: tr.detune || 0, filter: tr.filter });
            if (tr.echo) tone({ f, type: tr.type || 'square', dur: d, decay: d, vol: (tr.vol || 0.1) * 0.4, attack: 0.01, dest: st.gain, when: st.nextTime - now() + stepDur * tr.echo, filter: tr.filter });
          }
        } else if (tok === '.' && tr.drum) {
          // nothing
        }
        if (tr.drum) {
          const dtok = tr.drums.trim().split(/\s+/)[tr.i % tr.drums.trim().split(/\s+/).length];
          const w = st.nextTime - now();
          if (dtok === 'k') tone({ f: 120, f2: 40, type: 'sine', dur: 0.12, vol: 0.35, dest: st.gain, when: w });
          if (dtok === 's') noise({ dur: 0.1, vol: 0.18, dest: st.gain, when: w, filter: { f: 1800, type: 'highpass' } });
          if (dtok === 'h') noise({ dur: 0.04, vol: 0.08, dest: st.gain, when: w, filter: { f: 6000, type: 'highpass' } });
        }
        tr.i++;
      }
      st.nextTime += stepDur;
    }
  }

  // ---- songs -------------------------------------------------------------------------
  A.SONGS.cabin = {
    bpm: 84, step: 0.25,
    tracks: [
      { type: 'triangle', vol: 0.12, gate: 0.8, notes: 'C4 - E4 - G4 - E4 - A3 - C4 - E4 - C4 - F3 - A3 - C4 - A3 - G3 - B3 - D4 - B3 - C4 - E4 - G4 - E4 - A3 - C4 - E4 - G4 - F3 - A3 - C4 - E4 - G3 - B3 - D4 - G4 -' },
      { type: 'sine', vol: 0.16, gate: 0.95, notes: 'C3 - - - - - - - A2 - - - - - - - F2 - - - - - - - G2 - - - - - - - C3 - - - - - - - A2 - - - - - - - F2 - - - - - - - G2 - - - - - - -' },
      { type: 'square', vol: 0.035, gate: 0.5, filter: { f: 1800 }, notes: '. . . . G5 . . . . . . . E5 . . . . . . . A5 . . . . . . . C5 . . . . . . . D5 . . . . . . . B4 . . . . . . . G5 . . . . . . . E5 . . . . . . . C5 . . . . . . . A5 . . . . . . . F5 . . . . . . . G5 . . .' },
    ],
  };
  A.SONGS.hedgehog = {
    bpm: 150, step: 0.25,
    tracks: [
      { type: 'square', vol: 0.09, gate: 0.7, notes: 'E5 . E5 . . E5 . . C5 . E5 . G5 - - - . . . . G4 - - - . . . . C5 - . G4 - . . E4 - . . A4 - B4 - Bb4 A4 - . G4 E5 . G5 A5 . F5 G5 . E5 . C5 D5 B4 . .' },
      { type: 'square', vol: 0.07, gate: 0.8, detune: -8, notes: 'C4 . C4 . . C4 . . C4 . C4 . E4 - - - . . . . E3 - - - . . . . C4 - . E3 - . . C3 - . . F3 - G3 - F#3 F3 - . E3 C4 . E4 F4 . D4 E4 . C4 . A3 B3 G3 . .' },
      { type: 'triangle', vol: 0.18, gate: 0.9, notes: 'C3 . . . G2 . . . C3 . . . G2 . . . E3 . . . B2 . . . E3 . . . B2 . . . A2 . . . E2 . . . A2 . . . E2 . . . F2 . . . C3 . . . G2 . . . G2 . . .' },
      { type: 'square', vol: 0, notes: '.', drum: true, drums: 'k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s h k h s h k k s h' },
    ],
  };
  A.SONGS.boss = {
    bpm: 160, step: 0.25,
    tracks: [
      { type: 'sawtooth', vol: 0.07, gate: 0.6, filter: { f: 2500 }, notes: 'E4 E4 . E4 G4 . E4 . D4 D4 . D4 F4 . D4 . C4 C4 . C4 Eb4 . C4 . B3 . C4 . D4 . Eb4 .' },
      { type: 'square', vol: 0.12, gate: 0.9, notes: 'E2 . E2 . E2 . E2 . D2 . D2 . D2 . D2 . C2 . C2 . C2 . C2 . B1 . B1 . D2 . Eb2 .' },
      { type: 'square', vol: 0, notes: '.', drum: true, drums: 'k h k s k h k s k h k s k h k s k h k s k h k s k h k s k s s s' },
    ],
  };
  A.SONGS.hospital = {
    bpm: 60, step: 0.5,
    tracks: [
      { type: 'sine', vol: 0.1, gate: 1, attack: 0.3, notes: 'A3 - - - - - - - F3 - - - - - - - G3 - - - - - - - E3 - - - - - - -' },
      { type: 'triangle', vol: 0.05, gate: 1, attack: 0.4, notes: 'C4 - - - - - - - A3 - - - - - - - B3 - - - - - - - G3 - - - - - - -' },
      { type: 'sine', vol: 0.04, gate: 0.9, attack: 0.2, notes: '. . . . E5 - - - . . . . C5 - - - . . . . D5 - - - . . . . B4 - - -' },
    ],
  };
  A.SONGS.sad = {
    bpm: 66, step: 0.5,
    tracks: [
      { type: 'triangle', vol: 0.12, gate: 0.95, attack: 0.05, notes: 'E4 - G4 - B4 - G4 - D4 - F4 - A4 - F4 - C4 - E4 - G4 - E4 - B3 - D4 - G4 - F#4 -' },
      { type: 'sine', vol: 0.15, gate: 1, attack: 0.1, notes: 'E3 - - - - - - - D3 - - - - - - - C3 - - - - - - - B2 - - - - - - -' },
    ],
  };
  A.SONGS.phone = {
    bpm: 92, step: 0.25,
    tracks: [
      { type: 'triangle', vol: 0.1, gate: 0.6, filter: { f: 1500 }, notes: 'D4 . F4 . A4 . F4 . C4 . E4 . G4 . E4 . Bb3 . D4 . F4 . D4 . A3 . C4 . E4 . C4 .' },
      { type: 'sine', vol: 0.16, gate: 0.9, notes: 'D2 . . . D2 . . D2 C2 . . . C2 . . C2 Bb1 . . . Bb1 . . Bb1 A1 . . . A1 . . A1' },
      { type: 'square', vol: 0, notes: '.', drum: true, drums: 'k . h . s . h . k . h . s . h h k . h . s . h . k . h k s . h .' },
    ],
  };
  A.SONGS.town = {
    bpm: 112, step: 0.25,
    tracks: [
      { type: 'square', vol: 0.07, gate: 0.7, filter: { f: 2200 }, notes: 'G4 . A4 . B4 . D5 - . . B4 . A4 . G4 . E4 . G4 . A4 . B4 - . . A4 . G4 . E4 . D4 . E4 . G4 . A4 - . . G4 . E4 . D4 . C4 . E4 . G4 . B4 - - - . . . .' },
      { type: 'triangle', vol: 0.16, gate: 0.9, notes: 'G2 . . . D3 . . . G2 . . . D3 . . . E2 . . . B2 . . . E2 . . . B2 . . . C2 . . . G2 . . . C2 . . . G2 . . . D2 . . . A2 . . . D2 . . . A2 . . .' },
      { type: 'square', vol: 0, notes: '.', drum: true, drums: 'k . h . s . h . k . h . s . h . k . h . s . h . k . h . s . h .' },
    ],
  };
  A.SONGS.restaurant = {
    bpm: 128, step: 0.25,
    tracks: [
      { type: 'square', vol: 0.06, gate: 0.6, filter: { f: 2500 }, notes: 'C5 . E5 . G5 . E5 . A4 . C5 . E5 . C5 . F4 . A4 . C5 . A4 . G4 . B4 . D5 . B4 . C5 . E5 . G5 . E5 . A4 . C5 . E5 . G5 . F4 . A4 . C5 . E5 . G4 . B4 . D5 . F5 .' },
      { type: 'triangle', vol: 0.15, gate: 0.85, notes: 'C3 . C3 . G2 . G2 . A2 . A2 . E2 . E2 . F2 . F2 . C2 . C2 . G2 . G2 . D2 . D2 . C3 . C3 . G2 . G2 . A2 . A2 . E2 . E2 . F2 . F2 . C2 . C2 . G2 . G2 . G2 . G2 .' },
      { type: 'square', vol: 0, notes: '.', drum: true, drums: 'k . h h s . h . k . h h s . h h k . h h s . h . k . h h s . h h' },
    ],
  };
  A.SONGS.rush = {
    bpm: 168, step: 0.25,
    tracks: [
      { type: 'square', vol: 0.07, gate: 0.6, notes: 'C5 C5 . C5 Eb5 . C5 . Bb4 Bb4 . Bb4 D5 . Bb4 . Ab4 Ab4 . Ab4 C5 . Ab4 . G4 . Ab4 . Bb4 . B4 .' },
      { type: 'sawtooth', vol: 0.09, gate: 0.8, filter: { f: 900 }, notes: 'C2 . C2 . C2 . C2 . Bb1 . Bb1 . Bb1 . Bb1 . Ab1 . Ab1 . Ab1 . Ab1 . G1 . G1 . Bb1 . B1 .' },
      { type: 'square', vol: 0, notes: '.', drum: true, drums: 'k h s h k h s h k h s h k h s h k h s h k h s h k h s h k s s s' },
    ],
  };
  A.SONGS.tower = {
    bpm: 100, step: 0.25,
    tracks: [
      { type: 'triangle', vol: 0.1, gate: 0.7, notes: 'C4 . E4 . G4 . B4 . A4 . . . G4 . . . D4 . F4 . A4 . C5 . B4 . . . A4 . . . F4 . A4 . C5 . E5 . D5 . . . C5 . . . G4 . B4 . D5 . F5 . E5 . . . D5 . . .' },
      { type: 'sine', vol: 0.16, gate: 0.95, notes: 'C2 . . . . . . . C2 . . . . . . . D2 . . . . . . . D2 . . . . . . . F2 . . . . . . . F2 . . . . . . . G2 . . . . . . . G2 . . . . . . .' },
      { type: 'square', vol: 0, notes: '.', drum: true, drums: 'k . . . h . . . s . . . h . . . k . . . h . . . s . . . h . h .' },
    ],
  };
  A.SONGS.night = {
    bpm: 70, step: 0.5,
    tracks: [
      { type: 'sine', vol: 0.12, gate: 1, attack: 0.2, notes: 'C4 - E4 - G4 - E4 - A3 - C4 - E4 - C4 - F3 - A3 - C4 - A3 - G3 - B3 - D4 - B3 -' },
      { type: 'sine', vol: 0.14, gate: 1, attack: 0.2, notes: 'C2 - - - - - - - A1 - - - - - - - F1 - - - - - - - G1 - - - - - - -' },
    ],
  };
  A.SONGS.title = {
    bpm: 96, step: 0.25,
    tracks: [
      { type: 'square', vol: 0.08, gate: 0.7, filter: { f: 2000 }, notes: 'G4 . . . C5 . . . E5 - - - D5 . C5 . D5 - - - . . . . G4 . . . C5 . . . E5 - - - G5 . E5 . D5 - - - - - - - . . . .' },
      { type: 'triangle', vol: 0.16, gate: 0.9, notes: 'C3 . . . G2 . . . C3 . . . G2 . . . F2 . . . C3 . . . F2 . . . C3 . . . C3 . . . G2 . . . C3 . . . G2 . . . G2 . . . G2 . . . G2 . . . G2 . . .' },
      { type: 'square', vol: 0, notes: '.', drum: true, drums: 'k . h . s . h . k . h . s . h . k . h . s . h . k . h . s . h . k . h . s . h . k . h . s . h . k . h . s . h . k . h . s . h .' },
    ],
  };
  A.SONGS.victory = {
    bpm: 120, step: 0.25,
    tracks: [
      { type: 'square', vol: 0.09, gate: 0.8, notes: 'C5 E5 G5 C6 - - G5 - A5 - - - G5 - - - F5 A5 C6 F6 - - C6 - D6 - - - C6 - - -' },
      { type: 'triangle', vol: 0.16, gate: 0.9, notes: 'C3 . G2 . C3 . G2 . F2 . C3 . F2 . C3 . F2 . C3 . F2 . C3 . G2 . D3 . G2 . D3 .' },
    ],
  };
})(window.CH);
