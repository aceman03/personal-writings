// Soundscape: scene ambience and one-shot sound effects, synthesized live with
// the Web Audio API (no audio files). Chapters choose sounds with markup:
//   {{ambience: temple}}   on its own line: the ambient bed from here on
//   {{sfx: bells}}         inline: a sound effect at that point in the text
window.Soundscape = (function () {
  let ctx = null, master = null, reverb = null, reverbSend = null;
  let current = null; // { name, out, timers, sources }
  let enabled = false;
  let volume = 0.7;

  // ───────────── engine ─────────────
  function init() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    reverb = ctx.createConvolver();
    reverb.buffer = impulse(3.2, 2.6);
    reverbSend = ctx.createGain();
    reverbSend.gain.value = 0.9;
    reverbSend.connect(reverb).connect(master);
    return true;
  }

  function impulse(seconds, decay) {
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  const noiseCache = {};
  function noise(type = "white", seconds = 4) {
    const key = type + seconds;
    if (noiseCache[key]) return noiseCache[key];
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (type === "brown") { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
      else if (type === "pink") { b0 = 0.997 * b0 + 0.029 * w; b1 = 0.985 * b1 + 0.032 * w; b2 = 0.95 * b2 + 0.048 * w; d[i] = (b0 + b1 + b2 + w * 0.05) * 1.6; }
      else d[i] = w;
    }
    return (noiseCache[key] = buf);
  }

  const now = () => ctx.currentTime;
  const rand = (a, b) => a + Math.random() * (b - a);

  function src(buf, loop = true) {
    const s = ctx.createBufferSource();
    s.buffer = buf; s.loop = loop;
    if (loop) s.loopStart = rand(0, 1);
    return s;
  }
  function filter(type, freq, q = 0.7) {
    const f = ctx.createBiquadFilter();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    return f;
  }
  function gain(v) { const g = ctx.createGain(); g.gain.value = v; return g; }
  function pan(v) {
    if (!ctx.createStereoPanner) return gain(1);
    const p = ctx.createStereoPanner(); p.pan.value = v; return p;
  }
  function osc(type, freq) { const o = ctx.createOscillator(); o.type = type; o.frequency.value = freq; return o; }
  function env(g, t, attack, peak, release) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + release);
  }

  // ───────────── bed layers ─────────────
  // Each layer adds sources to a bed and returns nothing; beds clean themselves up.
  const L = {
    wind(bed, { level = 0.25, cutoff = 500, gusty = 0.5 } = {}) {
      const s = src(noise("brown", 6)), f = filter("lowpass", cutoff, 0.9), g = gain(level);
      s.connect(f).connect(g).connect(bed.out); s.start(); bed.sources.push(s);
      const lfo = osc("sine", rand(0.05, 0.1)), lg = gain(cutoff * 0.5);
      lfo.connect(lg).connect(f.frequency); lfo.start(); bed.sources.push(lfo);
      bed.every(2500, () => g.gain.setTargetAtTime(level * (1 - gusty / 2 + Math.random() * gusty), now(), 1.2));
    },
    roomTone(bed, level = 0.12) {
      const s = src(noise("brown", 5)), f = filter("lowpass", 180), g = gain(level);
      s.connect(f).connect(g).connect(bed.out); s.start(); bed.sources.push(s);
    },
    pad(bed, freqs, level = 0.05, wobble = 0.15) {
      freqs.forEach((fr, i) => {
        const o = osc("sine", fr), g = gain(level / freqs.length), t = osc("sine", 0.05 + i * 0.03), tg = gain(level / freqs.length * wobble);
        o.connect(g).connect(bed.out); t.connect(tg).connect(g.gain);
        o.start(); t.start(); bed.sources.push(o, t);
      });
    },
    birds(bed, every = 2600, level = 0.05) {
      bed.every(every, () => {
        if (Math.random() < 0.4) return;
        const t = now() + rand(0, 0.8), base = rand(2600, 4200), n = Math.floor(rand(2, 6));
        const p = pan(rand(-0.8, 0.8)); p.connect(bed.out);
        for (let i = 0; i < n; i++) {
          const o = osc("sine", base), g = gain(0.0001), at = t + i * rand(0.09, 0.16);
          o.frequency.setValueAtTime(base, at);
          o.frequency.exponentialRampToValueAtTime(base * rand(1.2, 1.6), at + 0.06);
          env(g, at, 0.01, level, 0.08);
          o.connect(g).connect(p); o.start(at); o.stop(at + 0.15);
        }
      });
    },
    crackle(bed, rate = 6, level = 0.12) {
      bed.every(1000 / rate, () => {
        if (Math.random() < 0.35) return;
        const t = now() + rand(0, 0.1), s = src(noise("white", 1), false), f = filter("highpass", rand(1500, 4000)), g = gain(0.0001), p = pan(rand(-0.4, 0.4));
        env(g, t, 0.002, level * rand(0.3, 1), 0.03);
        s.connect(f).connect(g).connect(p).connect(bed.out); s.start(t, rand(0, 0.8), 0.06);
      });
    },
    fire(bed, level = 0.2) {
      const s = src(noise("brown", 6)), f = filter("lowpass", 520), g = gain(level);
      s.connect(f).connect(g).connect(bed.out); s.start(); bed.sources.push(s);
      L.crackle(bed, 9, 0.1);
    },
    river(bed, level = 0.12, cutoff = 1400) {
      const s = src(noise("pink", 6)), bp = filter("bandpass", 700, 0.6), lp = filter("lowpass", cutoff), g = gain(level);
      s.connect(bp).connect(lp).connect(g).connect(bed.out); s.start(); bed.sources.push(s);
      bed.every(180, () => bp.frequency.setTargetAtTime(rand(450, 1100), now(), 0.08));
    },
    crickets(bed, level = 0.025) {
      [-0.6, 0.5].forEach((pv) => {
        const o = osc("sine", rand(4300, 4700)), g = gain(0), p = pan(pv), out = gain(level);
        const gate = osc("square", rand(26, 32)), gg = gain(0.5);
        gate.connect(gg).connect(g.gain);
        o.connect(g).connect(out).connect(p).connect(bed.out);
        o.start(); gate.start(); bed.sources.push(o, gate);
        bed.every(rand(900, 1400), () => out.gain.setTargetAtTime(Math.random() < 0.6 ? level : 0, now(), 0.02));
      });
    },
    owl(bed, every = 9000, level = 0.05) {
      bed.every(every, () => {
        if (Math.random() < 0.5) return;
        const t = now() + 0.2, p = pan(rand(-0.7, 0.7)); p.connect(bed.out); p.connect(reverbSend);
        [0, 0.55, 0.85].forEach((d, i) => {
          const o = osc("sine", i === 1 ? 360 : 400), g = gain(0.0001), at = t + d;
          o.frequency.setValueAtTime(o.frequency.value, at); o.frequency.linearRampToValueAtTime(o.frequency.value * 0.93, at + 0.3);
          env(g, at, 0.05, level, 0.3); o.connect(g).connect(p); o.start(at); o.stop(at + 0.4);
        });
      });
    },
    howls(bed, every = 7000, level = 0.05) {
      bed.every(every, () => {
        if (Math.random() < 0.45) return;
        const t = now() + 0.1, dur = rand(2.5, 4.5), base = rand(260, 380);
        const o = osc("triangle", base), v = osc("sine", 5), vg = gain(8), lp = filter("lowpass", 1100), g = gain(0.0001), p = pan(rand(-0.9, 0.9));
        o.frequency.setValueAtTime(base, t);
        o.frequency.linearRampToValueAtTime(base * 1.7, t + dur * 0.35);
        o.frequency.linearRampToValueAtTime(base * 1.25, t + dur);
        v.connect(vg).connect(o.frequency);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(level, t + dur * 0.3);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(lp).connect(g).connect(p); p.connect(bed.out); p.connect(reverbSend);
        o.start(t); v.start(t); o.stop(t + dur + 0.1); v.stop(t + dur + 0.1);
      });
    },
    hammer(bed, every = 4200, level = 0.06) {
      bed.every(every, () => { if (Math.random() < 0.7) clang(now() + rand(0, 0.5), level, rand(-0.5, 0.5), bed.out); });
    },
    crows(bed, every = 6000, level = 0.05) {
      bed.every(every, () => {
        if (Math.random() < 0.5) return;
        const t = now() + 0.1, n = Math.floor(rand(1, 4)), p = pan(rand(-0.8, 0.8)); p.connect(bed.out); p.connect(reverbSend);
        for (let i = 0; i < n; i++) {
          const at = t + i * rand(0.35, 0.5), o = osc("sawtooth", rand(520, 640)), bp = filter("bandpass", 1300, 3), g = gain(0.0001);
          o.frequency.setValueAtTime(o.frequency.value, at); o.frequency.exponentialRampToValueAtTime(o.frequency.value * 0.8, at + 0.25);
          env(g, at, 0.02, level, 0.22); o.connect(bp).connect(g).connect(p); o.start(at); o.stop(at + 0.3);
        }
      });
    },
    hooves(bed, level = 0.05) {
      // Wagons and hooves on a hard road: soft irregular thuds and creaks.
      bed.every(260, () => {
        if (Math.random() < 0.45) return;
        burst(now() + rand(0, 0.2), { type: "brown", f1: "lowpass", freq: rand(250, 450), attack: 0.004, peak: level * rand(0.5, 1.2), release: 0.08, p: rand(-0.6, 0.6), dest: bed.out });
      });
      bed.every(3200, () => {
        if (Math.random() < 0.5) return;
        const t = now() + 0.1, o = osc("sawtooth", rand(140, 220)), bp = filter("bandpass", 600, 6), g = gain(0.0001);
        o.frequency.linearRampToValueAtTime(o.frequency.value * 1.3, t + 0.4);
        env(g, t, 0.1, level * 0.35, 0.35); o.connect(bp).connect(g).connect(bed.out); o.start(t); o.stop(t + 0.6);
      });
    },
    rumbleBed(bed, level = 0.25) {
      const s = src(noise("brown", 8)), f = filter("lowpass", 90), g = gain(level);
      s.connect(f).connect(g).connect(bed.out); s.start(); bed.sources.push(s);
      const lfo = osc("sine", 0.06), lg = gain(level * 0.6);
      lfo.connect(lg).connect(g.gain); lfo.start(); bed.sources.push(lfo);
    },
  };

  // ───────────── beds ─────────────
  const BEDS = {
    "dawn-city": (b) => { L.wind(b, { level: 0.12, cutoff: 700 }); L.birds(b); L.pad(b, [110, 165, 220, 277], 0.035); },
    lore: (b) => { L.pad(b, [98, 147, 196], 0.04); L.wind(b, { level: 0.05, cutoff: 400 }); },
    dread: (b) => { L.pad(b, [55, 58.3, 82.4], 0.08, 0.3); L.wind(b, { level: 0.08, cutoff: 300 }); },
    temple: (b) => { L.roomTone(b, 0.1); L.pad(b, [73.4, 110, 146.8], 0.035); L.crackle(b, 1.5, 0.04); },
    "quiet-room": (b) => { L.roomTone(b, 0.08); L.river(b, 0.035, 700); },
    "lecture-hall": (b) => { L.roomTone(b, 0.1); L.river(b, 0.02, 600); },
    "tower-night": (b) => { L.wind(b, { level: 0.14, cutoff: 650, gusty: 0.9 }); L.crackle(b, 2.5, 0.05); L.roomTone(b, 0.05); },
    "forest-night": (b) => { L.crickets(b); L.owl(b); L.wind(b, { level: 0.06, cutoff: 1200, gusty: 0.6 }); },
    forge: (b) => { L.fire(b, 0.22); L.hammer(b); },
    "steppe-fire": (b) => { L.fire(b, 0.14); L.wind(b, { level: 0.14, cutoff: 900, gusty: 0.8 }); },
    "wall-night": (b) => { L.wind(b, { level: 0.22, cutoff: 600, gusty: 0.9 }); L.howls(b); },
    "wall-silent": (b) => { L.wind(b, { level: 0.13, cutoff: 380, gusty: 0.3 }); L.pad(b, [61.7, 65.4], 0.03, 0.4); },
    hollow: (b) => { L.wind(b, { level: 0.1, cutoff: 420, gusty: 0.4 }); },
    abyss: (b) => { L.rumbleBed(b, 0.22); L.pad(b, [36.7, 38.9, 55], 0.09, 0.5); },
    "frontier-dawn": (b) => { L.wind(b, { level: 0.17, cutoff: 520, gusty: 0.7 }); L.crows(b); },
    evacuation: (b) => { L.wind(b, { level: 0.1, cutoff: 600 }); L.hooves(b, 0.05); L.crows(b, 9000, 0.03); },
    "birch-wood": (b) => { L.wind(b, { level: 0.08, cutoff: 1400, gusty: 0.8 }); L.crows(b, 11000, 0.025); },
    "road-dusk": (b) => { L.wind(b, { level: 0.14, cutoff: 480, gusty: 0.6 }); L.hooves(b, 0.035); },
    "lantern-house": (b) => { L.wind(b, { level: 0.12, cutoff: 420, gusty: 0.5 }); L.pad(b, [110, 164.8], 0.025, 0.2); },
    "night-march": (b) => { L.wind(b, { level: 0.09, cutoff: 380, gusty: 0.4 }); L.hooves(b, 0.02); L.river(b, 0.015, 500); },
    "night-watch": (b) => { L.wind(b, { level: 0.1, cutoff: 360, gusty: 0.3 }); L.pad(b, [55, 58.3], 0.05, 0.4); },
    silence: () => {},
  };

  function makeBed(name) {
    const out = gain(0.0001);
    out.connect(master);
    const bed = { name, out, sources: [], timers: [],
      every(ms, fn) { fn(); this.timers.push(setInterval(fn, ms)); } };
    (BEDS[name] || BEDS.silence)(bed);
    return bed;
  }

  function setBed(name) {
    if (!enabled || !ctx) return;
    name = name || "silence";
    if (current && current.name === name) return;
    const old = current;
    if (old) {
      old.out.gain.cancelScheduledValues(now());
      old.out.gain.setTargetAtTime(0.0001, now(), 1.2);
      old.timers.forEach(clearInterval);
      setTimeout(() => { old.sources.forEach((s) => { try { s.stop(); } catch (e) {} }); old.out.disconnect(); }, 6000);
    }
    current = makeBed(name);
    current.out.gain.setTargetAtTime(1, now(), 1.5);
  }

  // ───────────── sound effects ─────────────
  function clang(t, level, p = 0, dest = master) {
    const pn = pan(p), lp = filter("lowpass", 2600); pn.connect(lp).connect(dest); lp.connect(reverbSend);
    [[1, 1], [2.76, 0.5], [5.4, 0.3], [8.9, 0.15]].forEach(([r, a]) => {
      const o = osc("sine", 520 * r), g = gain(0.0001);
      env(g, t, 0.003, level * a, 0.9 / r + 0.2); o.connect(g).connect(pn); o.start(t); o.stop(t + 1.5);
    });
  }

  function bell(t, freq, level, p = 0) {
    const pn = pan(p); pn.connect(master); pn.connect(reverbSend);
    [[0.5, 0.6, 6], [1, 1, 4.5], [1.19, 0.5, 3], [1.5, 0.35, 2.5], [2, 0.4, 2], [2.52, 0.2, 1.4], [3.0, 0.15, 1.1], [4.2, 0.08, 0.8]]
      .forEach(([r, a, d]) => {
        const o = osc("sine", freq * r), g = gain(0.0001);
        env(g, t, 0.004, level * a, d); o.connect(g).connect(pn); o.start(t); o.stop(t + d + 0.2);
      });
  }

  function burst(t, { type = "white", f1 = "bandpass", freq = 3000, q = 1, attack = 0.005, peak = 0.2, release = 0.05, p = 0, wet = 0, dest = null }) {
    const s = src(noise(type, 2), false), f = filter(f1, freq, q), g = gain(0.0001), pn = pan(p);
    env(g, t, attack, peak, release);
    s.connect(f).connect(g).connect(pn).connect(dest || master);
    if (wet) { const w = gain(wet); pn.connect(w).connect(reverbSend); }
    s.start(t, rand(0, 1), attack + release + 0.1);
  }

  const SFX = {
    "light-swell"() {
      const t = now();
      [220, 277.2, 329.6, 440, 554.4, 880].forEach((fr, i) => {
        const o = osc(i > 3 ? "sine" : "triangle", fr), g = gain(0.0001), lp = filter("lowpass", 1800);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06 / (1 + i * 0.3), t + 2.5 + i * 0.2);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 8);
        o.connect(lp).connect(g).connect(master); g.connect(reverbSend); o.start(t); o.stop(t + 8.2);
      });
    },
    "spell-hum"() {
      const t = now();
      [196, 293.7, 392].forEach((fr, i) => {
        const o = osc("sawtooth", fr * 0.75), lp = filter("lowpass", 300, 4), g = gain(0.0001), tr = osc("sine", 6 + i), tg = gain(4);
        o.frequency.exponentialRampToValueAtTime(fr, t + 1.6);
        lp.frequency.exponentialRampToValueAtTime(2200, t + 1.4); lp.frequency.exponentialRampToValueAtTime(400, t + 3.2);
        tr.connect(tg).connect(o.frequency);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 1.2); g.gain.exponentialRampToValueAtTime(0.0001, t + 3.4);
        o.connect(lp).connect(g).connect(master); g.connect(reverbSend); o.start(t); tr.start(t); o.stop(t + 3.6); tr.stop(t + 3.6);
      });
    },
    chalk() {
      let t = now() + 0.05;
      for (let i = 0; i < 9; i++) {
        burst(t, { freq: rand(2500, 4500), q: 2, attack: 0.004, peak: 0.35, release: rand(0.05, 0.15), p: 0.2 });
        t += rand(0.12, 0.32);
      }
      burst(t + 0.1, { freq: 1800, q: 3, attack: 0.002, peak: 0.45, release: 0.03 }); // the final tap
    },
    pen() {
      let t = now() + 0.05;
      for (let i = 0; i < 5; i++) { burst(t, { freq: 5200, q: 1.5, attack: 0.03, peak: 0.22, release: rand(0.12, 0.25), p: -0.2 }); t += rand(0.15, 0.28); }
    },
    "door-lock"() {
      const t = now() + 0.05;
      burst(t, { type: "brown", f1: "lowpass", freq: 300, attack: 0.005, peak: 0.5, release: 0.25, wet: 0.4 });
      clang(t + 0.35, 0.04, 0.3); clang(t + 0.48, 0.05, 0.3);
    },
    "candle-out"() {
      burst(now() + 0.05, { type: "pink", f1: "lowpass", freq: 900, attack: 0.04, peak: 0.35, release: 0.45 });
    },
    ripple() {
      const t = now();
      [0, 0.45, 0.9].forEach((d, i) => {
        const o = osc("sine", 1300), g = gain(0.0001), at = t + d;
        o.frequency.setValueAtTime(1300, at); o.frequency.exponentialRampToValueAtTime(380, at + 0.12);
        env(g, at, 0.005, 0.12 / (i + 1), 0.25); o.connect(g).connect(master); g.connect(reverbSend); o.start(at); o.stop(at + 0.4);
      });
      const d = osc("sine", 82), dg = gain(0.0001); env(dg, t, 0.8, 0.08, 3); d.connect(dg).connect(master); d.start(t); d.stop(t + 4);
    },
    bell() { bell(now() + 0.05, 330, 0.12); },
    bells() {
      const notes = [196, 220, 247, 262, 294, 330, 392, 440, 523];
      let t = now() + 0.05, gap = 0.9;
      for (let i = 0; i < 34; i++) {
        bell(t, notes[Math.floor(Math.random() * notes.length)] * (Math.random() < 0.3 ? 0.5 : 1), rand(0.04, 0.09) * Math.min(1, 0.3 + i / 8), rand(-0.9, 0.9));
        t += gap * rand(0.4, 1.2); gap = Math.max(0.18, gap * 0.9);
      }
    },
    "glow-fade"() {
      const t = now();
      [440, 554, 659].forEach((fr) => {
        const o = osc("sine", fr), g = gain(0.0001), lp = filter("lowpass", 3000);
        o.frequency.setValueAtTime(fr, t); o.frequency.exponentialRampToValueAtTime(fr / 3.5, t + 5);
        lp.frequency.exponentialRampToValueAtTime(200, t + 5);
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.03, t + 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t + 5.5);
        o.connect(lp).connect(g).connect(master); g.connect(reverbSend); o.start(t); o.stop(t + 5.6);
      });
    },
    rumble() {
      const t = now(), s = src(noise("brown", 8), false), f = filter("lowpass", 110), g = gain(0.0001), o = osc("sine", 38), og = gain(0.0001);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9, t + 3); g.gain.setValueAtTime(0.9, t + 5); g.gain.exponentialRampToValueAtTime(0.0001, t + 9);
      og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.15, t + 3); og.gain.exponentialRampToValueAtTime(0.0001, t + 9);
      s.connect(f).connect(g).connect(master); o.connect(og).connect(master);
      s.start(t); o.start(t); s.stop(t + 9.2); o.stop(t + 9.2);
    },
    horn() {
      const t = now() + 0.05;
      [0, 1.6].forEach((d) => {
        const o = osc("sawtooth", 196), o2 = osc("sawtooth", 196.8), lp = filter("lowpass", 900, 1.5), g = gain(0.0001), at = t + d;
        o.frequency.setValueAtTime(175, at); o.frequency.linearRampToValueAtTime(196, at + 0.25);
        g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(0.07, at + 0.2);
        g.gain.setValueAtTime(0.07, at + 1.1); g.gain.exponentialRampToValueAtTime(0.0001, at + 1.5);
        o.connect(lp); o2.connect(lp); lp.connect(g).connect(master); g.connect(reverbSend);
        o.start(at); o2.start(at); o.stop(at + 1.6); o2.stop(at + 1.6);
      });
    },
    chitter() {
      // Dry, rapid clicking from several directions, like a nail drawn along a comb.
      for (let k = 0; k < 4; k++) {
        let t = now() + rand(0, 1.2); const p = rand(-0.9, 0.9), n = Math.floor(rand(10, 22));
        for (let i = 0; i < n; i++) { burst(t, { freq: rand(2200, 3600), q: 3, attack: 0.001, peak: 1.2, release: 0.018, p, wet: 0.3 }); t += rand(0.018, 0.035); }
      }
    },
    fireball() {
      const t = now();
      burst(t, { type: "pink", f1: "bandpass", freq: 900, q: 0.8, attack: 0.25, peak: 0.35, release: 0.3 });
      const s = src(noise("brown", 2), false), f = filter("lowpass", 160), g = gain(0.0001);
      env(g, t + 0.45, 0.01, 0.9, 0.9); s.connect(f).connect(g).connect(master); g.connect(reverbSend); s.start(t + 0.45, 0, 1.2);
      SFX.crackleBurst(t + 0.5);
    },
    crackleBurst(t0) {
      for (let i = 0; i < 18; i++) burst((t0 || now()) + rand(0, 1.2), { freq: rand(1800, 4500), q: 1, attack: 0.002, peak: rand(0.05, 0.15), release: 0.02, p: rand(-0.5, 0.5) });
    },
    clash() {
      const t = now() + 0.02;
      clang(t, 0.09, rand(-0.3, 0.3));
      burst(t, { freq: 4000, q: 0.7, attack: 0.002, peak: 0.25, release: 0.08 });
      clang(t + rand(0.35, 0.6), 0.06, rand(-0.3, 0.3));
    },
    heartbeat() {
      let t = now() + 0.05;
      for (let i = 0; i < 5; i++) {
        [0, 0.22].forEach((d, k) => {
          const o = osc("sine", 55), g = gain(0.0001);
          o.frequency.setValueAtTime(70, t + d); o.frequency.exponentialRampToValueAtTime(40, t + d + 0.12);
          env(g, t + d, 0.01, k ? 0.2 : 0.3, 0.18); o.connect(g).connect(master); o.start(t + d); o.stop(t + d + 0.3);
        });
        t += 0.75 + i * 0.12; // stumbling, slowing
      }
    },
    "gold-circle"() {
      SFX["light-swell"]();
      const t = now();
      [880, 1108.7, 1318.5, 1760].forEach((fr, i) => {
        const o = osc("sine", fr), g = gain(0.0001), at = t + 0.3 + i * 0.25;
        env(g, at, 0.01, 0.04, 3.5); o.connect(g).connect(master); g.connect(reverbSend); o.start(at); o.stop(at + 3.6);
      });
    },
    quake() {
      const t = now(), s = src(noise("brown", 4), false), f = filter("lowpass", 70), g = gain(0.0001), o = osc("sine", 32), og = gain(0.0001);
      env(g, t, 0.02, 0.7, 2.2); env(og, t, 0.02, 0.22, 2.5);
      s.connect(f).connect(g).connect(master); o.connect(og).connect(master); g.connect(reverbSend);
      s.start(t, 0, 2.6); o.start(t); o.stop(t + 2.8);
    },
    laugh() {
      // A low, breathy, far-off "heh... heh... heh" drenched in reverb.
      let t = now() + 0.3, gap = 0.62;
      for (let i = 0; i < 6; i++) {
        [380, 760].forEach((fq, k) => burst(t, { type: "pink", freq: fq * (1 - i * 0.03), q: 5, attack: 0.04, peak: k ? 0.12 : 0.3, release: 0.22, wet: 2.2 }));
        t += gap; gap *= 0.86;
      }
      const o = osc("sine", 41), g = gain(0.0001), n = now();
      g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(0.18, n + 2); g.gain.exponentialRampToValueAtTime(0.0001, n + 8);
      o.connect(g).connect(master); o.start(n); o.stop(n + 8.2);
    },
  };

  function sfx(name) {
    if (!enabled || !ctx || !SFX[name]) return;
    try { SFX[name](); } catch (e) { /* ignore a failed effect */ }
  }

  // ───────────── control ─────────────
  function start() {
    if (!init()) return false;
    enabled = true;
    ctx.resume();
    master.gain.cancelScheduledValues(now());
    master.gain.setTargetAtTime(volume, now(), 0.8);
    return true;
  }

  function stop() {
    enabled = false;
    if (!ctx) return;
    master.gain.cancelScheduledValues(now());
    master.gain.setTargetAtTime(0, now(), 0.4);
    const old = current; current = null;
    if (old) {
      old.timers.forEach(clearInterval);
      setTimeout(() => { old.sources.forEach((s) => { try { s.stop(); } catch (e) {} }); old.out.disconnect(); }, 2500);
    }
  }

  function setVolume(v) {
    volume = v;
    if (ctx && enabled) master.gain.setTargetAtTime(volume, now(), 0.2);
  }

  return { start, stop, setBed, sfx, setVolume, get enabled() { return enabled; },
    beds: Object.keys(BEDS), effects: Object.keys(SFX) };
})();
