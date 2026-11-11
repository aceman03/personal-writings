// Chapter voice-over using the browser's built-in speech synthesis.
//
// - Play / pause, skip by sentence, seek with the progress bar.
// - While narrating, click any word in the chapter to jump there.
// - Highlights the sentence being read, and the current word where the
//   voice reports word boundaries.
// - Prefers the most natural-sounding voice on the device (the "Natural",
//   "Neural", "Enhanced" and "Premium" voices), and keeps their delivery close
//   to how they were recorded: gentle mood shifts, light dialogue tags,
//   breathing room between sentences that varies a little, like a person's.
// - Pausing pauses everything: the voice, the ambience and any sound effect.
// - Connects to the device's media controls (Windows media overlay, keyboard
//   media keys, phone lock screen and notification), so listening carries on
//   while you use other apps, and you can pause or skip from there.
// - Remembers where you stopped in each chapter.
(function () {
  const synth = window.speechSynthesis;
  const supported = !!(synth && window.SpeechSynthesisUtterance);

  const PACE = { rate: 0.92, pitch: 0.96, dialoguePitch: 1.0 };
  const GAP = { comma: 110, sentence: 340, tag: 90, paragraph: 750, scene: 1600, title: 1100 };

  // How each mood bends the voice: multipliers on rate and pitch, absolute volume,
  // and a stretch on the pause that follows. These are the full-strength values;
  // natural voices get a softened version (see voiceFor).
  const MOODS = {
    calm:     { rate: 1.0,  pitch: 1.0,  volume: 1.0,  gap: 1.0 },
    warm:     { rate: 0.97, pitch: 1.03, volume: 1.0,  gap: 1.0 },
    awe:      { rate: 0.9,  pitch: 1.04, volume: 0.95, gap: 1.3 },
    hushed:   { rate: 0.9,  pitch: 0.97, volume: 0.7,  gap: 1.2 },
    whisper:  { rate: 0.86, pitch: 0.96, volume: 0.55, gap: 1.25 },
    shaken:   { rate: 0.95, pitch: 1.05, volume: 0.85, gap: 1.15 },
    tense:    { rate: 1.06, pitch: 1.0,  volume: 1.0,  gap: 0.85 },
    urgent:   { rate: 1.14, pitch: 1.05, volume: 1.0,  gap: 0.65 },
    dread:    { rate: 0.88, pitch: 0.94, volume: 0.88, gap: 1.4 },
    grief:    { rate: 0.86, pitch: 0.94, volume: 0.8,  gap: 1.5 },
    stern:    { rate: 0.96, pitch: 0.96, volume: 1.0,  gap: 1.0 },
    menacing: { rate: 0.82, pitch: 0.88, volume: 0.9,  gap: 1.6 },
    wonder:   { rate: 0.92, pitch: 1.05, volume: 0.95, gap: 1.2 },
    dry:      { rate: 1.02, pitch: 0.98, volume: 1.0,  gap: 0.9 },
  };
  const moodOf = (name) => MOODS[name] || MOODS.calm;

  // ───────────── voices ─────────────
  // Natural (neural) voices sound human, but fall apart when their pitch is pushed
  // around. Older voices are already robotic, and need the help to sound varied.
  const NATURAL = /natural|neural|online|premium|enhanced|wavenet|studio|siri/i;
  const isNatural = (v) => !!v && NATURAL.test(v.name);

  const FEMALE = /Samantha|Karen|Moira|Tessa|Serena|Fiona|Victoria|Kate|Susan|Martha|Allison|Ava|Zira|Hazel|Libby|Sonia|Jenny|Aria|Emma|Michelle|Natasha|Clara|Ana\b|Joanna|Salli|Kimberly|Nicky|Veena|Female|Woman|Zoe|Amy|Olivia|Maisie|Abbi|Bella|Hollie|Mia|Neerja|Leah|Emily|Sara|Molly|Jane/i;
  const MALE = /Daniel|Arthur|Oliver|Alex\b|Fred|Tom\b|Aaron|Rishi|Gordon|Lee\b|George|Ryan|Thomas|Guy|Christopher|Eric|Davis|Andrew|Brian|Roger|Steffan|David|Mark|James|Male|Man\b|Liam|William|Noah|Ethan|Alfie|Elliot|Connor|Mitchell|Prabhat|Tony|Jason/i;
  const AGE = { child: { pitch: 1.18, rate: 1.03 }, young: { pitch: 1.06, rate: 1.02 }, adult: { pitch: 1, rate: 1 }, old: { pitch: 0.93, rate: 0.93 } };
  const genderOf = (v) => (FEMALE.test(v.name) ? "female" : MALE.test(v.name) ? "male" : "unknown");

  // Narrator preference: natural voices first, then British, then a storyteller's register.
  const STORYTELLERS = /Ryan|Thomas|Arthur|Daniel|George|Oliver|Brian|Guy|Christopher|Andrew|Davis|Eric|Roger|Steffan|Alfie|Elliot|Google UK English Male/i;
  function narratorScore(v) {
    return (isNatural(v) ? 100 : 0) + (/^en-GB/i.test(v.lang) ? 20 : 0) +
      (/^Google/i.test(v.name) ? 12 : 0) + (STORYTELLERS.test(v.name) ? 10 : 0) +
      (genderOf(v) === "male" ? 4 : 0) + (v.localService === false ? 2 : 0);
  }

  function castVoices(narratorVoice) {
    const profiles = window.VOICE_PROFILES || {};
    const cast = {};
    const used = new Map(); // voice name -> times assigned
    Object.entries(profiles).forEach(([id, p]) => {
      let pool = voices.filter((v) => genderOf(v) === p.gender);
      if (!pool.length) pool = voices.filter((v) => genderOf(v) === "unknown");
      if (!pool.length) pool = voices.slice();
      const score = (v) =>
        (v === narratorVoice ? 6 : 0) + (used.get(v.name) || 0) * 3 +
        (p.accent && !v.lang.toLowerCase().startsWith(p.accent.toLowerCase()) ? 1 : 0) -
        (isNatural(v) ? 4 : 0);
      const pick = pool.slice().sort((a, b) => score(a) - score(b))[0] || narratorVoice;
      if (pick) used.set(pick.name, (used.get(pick.name) || 0) + 1);
      const age = AGE[p.age || "adult"];
      // Same voice as someone else? Nudge the pitch so they still sound distinct.
      const nudge = pick ? 1 + ((used.get(pick.name) - 1) % 3) * 0.05 * (p.gender === "male" ? -1 : 1) : 1;
      cast[id] = {
        voice: pick, mood: p.mood,
        pitch: age.pitch * (p.pitch || 1) * nudge,
        rate: age.rate * (p.rate || 1),
      };
    });
    return cast;
  }

  let state = null;
  let voices = [];

  function loadVoices() {
    voices = supported ? synth.getVoices().filter((v) => /^en/i.test(v.lang)) : [];
    voices.sort((a, b) => narratorScore(b) - narratorScore(a));
    if (state) fillVoiceSelect();
  }
  if (supported) {
    loadVoices();
    synth.addEventListener?.("voiceschanged", loadVoices);
  }

  function bestVoice() {
    const saved = localStorage.getItem("narrator.voice");
    const found = voices.find((v) => v.name === saved);
    if (found) return found;
    return voices[0] || null; // already sorted best first
  }

  // ───────────── text preparation ─────────────

  // Wrap every word inside the prose in <span class="w" data-i="n">.
  function wrapWords(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);
    const words = [];
    nodes.forEach((node) => {
      const frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach((tok) => {
        if (!tok) return;
        if (/^\s+$/.test(tok)) { frag.appendChild(document.createTextNode(tok)); return; }
        const s = document.createElement("span");
        s.className = "w";
        s.textContent = tok;
        s.dataset.i = words.length;
        words.push(s);
        frag.appendChild(s);
      });
      node.parentNode.replaceChild(frag, node);
    });
    return words;
  }

  const endsSentence = (t) => /[.!?…]["'’”)\]]*$/.test(t);
  const endsClause = (t) => /[,;:—–]["'’”)\]]*$/.test(t);
  const opensQuote = (t) => /^["“]/.test(t);
  const closesQuote = (t) => /["”][.,!?;:]*$/.test(t) && !/^["“][^"”]*$/.test(t);
  const TAG_VERB = /^(said|says|asked|whispered|breathed|called|shouted|cried|murmured|answered|replied|added|told|began|went|agreed|snapped|muttered|roared|said,)$/i;

  // Text as the voice should hear it. Same length as the source, character for
  // character, so word positions still line up: dashes become commas (a breath, not
  // "em dash"), and smart quotes become plain ones.
  const speakable = (t) => t.replace(/[—–]/g, ",").replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  // Group words into speakable chunks: sentences, split again wherever the speaker
  // changes. Each chunk knows its speaker (null = narrator) and mood.
  function buildChunks(prose, words, title) {
    const chunks = [];
    const push = (ws, gap, info) => {
      if (!ws.length) return;
      // Very long sentences: break at a comma near the middle. Shorter utterances
      // sound more natural, and some voices cut off long ones.
      if (ws.length > 42) {
        const mid = ws.length / 2;
        let best = -1;
        ws.forEach((w, k) => { if (k > 8 && k < ws.length - 8 && endsClause(w.textContent) && (best < 0 || Math.abs(k - mid) < Math.abs(best - mid))) best = k; });
        if (best > 0) { push(ws.slice(0, best + 1), GAP.comma, info); push(ws.slice(best + 1), gap, info); return; }
      }
      const offsets = [];
      let text = "";
      ws.forEach((w, k) => {
        // Punctuation split off by italics (*word*.) joins the word before it, with no
        // space, or some voices read the stray mark aloud ("dot").
        const sep = k && !/^[.,!?;:…'"”’)\]]/.test(w.textContent) ? " " : "";
        offsets.push(text.length + sep.length);
        text += sep + w.textContent;
      });
      const m = moodOf(info.mood);
      chunks.push({ start: Number(ws[0].dataset.i), words: ws, text: speakable(text), offsets, gap: Math.round(gap * m.gap), ...info });
    };
    if (title) chunks.push({ start: 0, words: [], text: title, offsets: [], gap: GAP.title, dialogue: false, isTitle: true });

    [...prose.children].forEach((block) => {
      if (block.tagName === "HR") { if (chunks.length) chunks[chunks.length - 1].gap = GAP.scene; return; }
      const blockMood = block.dataset.mood || "";
      const ws = [...block.querySelectorAll(".w")];
      let cur = [], curKey = null, inQuote = false;
      // Who is speaking this word? Marked dialogue wins; unmarked quotes are "someone".
      const infoFor = (w) => {
        const say = w.closest(".say");
        if (say) return { key: "say:" + say.dataset.speaker + ":" + (say.dataset.mood || ""), dialogue: true,
          speaker: say.dataset.speaker, mood: say.dataset.mood || blockMood };
        if (inQuote) return { key: "quote", dialogue: true, speaker: null, mood: blockMood };
        return { key: "narration", dialogue: false, speaker: null, mood: blockMood };
      };
      let curInfo = null;
      ws.forEach((w, k) => {
        const t = w.textContent;
        if (!w.closest(".say") && opensQuote(t)) inQuote = true;
        const info = infoFor(w);
        if (cur.length && info.key !== curKey) {
          // Dialogue running straight into its tag ("...," she said) barely pauses.
          push(cur, !endsSentence(cur[cur.length - 1].textContent) ? GAP.tag : GAP.sentence, curInfo);
          cur = [];
        }
        cur.push(w); curKey = info.key; curInfo = info;
        const last = k === ws.length - 1;
        if (!w.closest(".say") && inQuote && closesQuote(t)) { push(cur, last ? GAP.paragraph : GAP.sentence, curInfo); cur = []; inQuote = false; return; }
        if (endsSentence(t) || last) { push(cur, last ? GAP.paragraph : GAP.sentence, curInfo); cur = []; }
      });
    });

    // Mark dialogue tags: short narration right after a line of dialogue, such as
    // "she said." A person reads those lightly and quickly.
    chunks.forEach((c, i) => {
      const prev = chunks[i - 1];
      if (!c.dialogue && !c.isTitle && prev && prev.dialogue && c.words.length <= 8 &&
          c.words.slice(0, 4).some((w) => TAG_VERB.test(w.textContent.replace(/[^A-Za-z,]/g, "")))) {
        c.tag = true;
        if (prev.gap > GAP.tag && !endsSentence(prev.words[prev.words.length - 1].textContent)) prev.gap = GAP.tag;
      }
    });
    return chunks;
  }

  // Voice, rate, pitch and volume for a chunk: who is speaking, then how they feel.
  // Natural voices get a softened version of every shift, so they stay human.
  function voiceFor(chunk) {
    let voice = state.voice, rate = state.rate, pitch = chunk.dialogue ? PACE.dialoguePitch : PACE.pitch;
    let mood = moodOf(chunk.mood), charPitch = 1, charRate = 1;
    if (chunk.dialogue && state.characterVoices) {
      const c = chunk.speaker && state.cast[chunk.speaker];
      if (c) {
        voice = c.voice || state.voice; charPitch = c.pitch; charRate = c.rate;
        if (!chunk.mood) mood = moodOf(c.mood);
      }
    }
    const soft = isNatural(voice) ? 0.4 : 0.85; // how much of each shift to apply
    const bend = (x) => 1 + (x - 1) * soft;
    if (isNatural(voice)) pitch = 1; // never pitch-shift a natural voice's base register
    pitch *= bend(charPitch) * bend(mood.pitch);
    rate *= bend(charRate) * bend(mood.rate);
    let volume = mood.volume;
    if (chunk.tag) { rate *= 1.06; volume *= 0.92; }
    return { voice, rate, pitch, volume };
  }

  // A little unevenness in the pauses, as in a person's reading.
  const breathe = (ms) => Math.round(ms * (0.88 + Math.random() * 0.24));

  // ───────────── soundscape ─────────────
  // Ambience beds and sound effects come from window.Soundscape. They play while
  // the narration plays and pause when it pauses. Optionally (a setting), they can
  // also follow the scroll position while you read without narration.
  const Sound = window.Soundscape;

  // Attach each {{sfx}} marker to the word that follows it.
  function linkEffects(prose) {
    let pending = [];
    prose.querySelectorAll(".w, .sfx").forEach((n) => {
      if (n.classList.contains("sfx")) pending.push(n.dataset.sfx);
      else if (pending.length) { n.dataset.sfx = pending.join(" "); pending = []; }
    });
  }

  const ambienceOf = (el) => (el && el.closest("[data-ambience]") ? el.closest("[data-ambience]").dataset.ambience : "silence");

  function fireWord(w) {
    if (!w || !w.dataset.sfx || state.fired.has(w.dataset.i)) return;
    state.fired.add(w.dataset.i);
    w.dataset.sfx.split(" ").forEach((name) => Sound.sfx(name));
  }

  function startSound() {
    if (!Sound || !state || !state.soundOn) return;
    if (!Sound.start()) return;
    Sound.setVolume(state.soundVolume);
    if (state.playing) Sound.setBed(state.chunks[state.ci].ambience);
    else followScroll(true);
  }

  // Reading without narration (only when the setting is on): the paragraph under
  // the reading line sets the ambience, and effects fire as their words scroll past it.
  function followScroll(initial) {
    if (!state || !state.soundOn || !state.readAlong || state.playing || !Sound || !Sound.enabled) return;
    if (Sound.paused) Sound.resume();
    const line = window.innerHeight * 0.45;
    const blocks = [...state.prose.children].filter((b) => b.dataset.ambience);
    const here = blocks.find((b) => b.getBoundingClientRect().bottom > line) || blocks[blocks.length - 1];
    if (here) Sound.setBed(here.dataset.ambience);
    // At the very bottom of the page the last lines can't reach the reading line,
    // so anything still visible fires there.
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
    state.sfxWords.forEach((w) => {
      const top = w.getBoundingClientRect().top;
      const prev = state.prevTops.get(w);
      state.prevTops.set(w, top);
      if (initial) return;
      if (prev !== undefined && prev >= line && top < line) fireWord(w);
      else if (atBottom && top < window.innerHeight && top >= line) fireWord(w);
    });
  }

  // Waits between sentences run on the audio clock when it's available, so they
  // keep time when the page is in the background (browsers throttle setTimeout there).
  function wait(ms, fn) {
    if (Sound && Sound.after) return Sound.after(ms / 1000, fn);
    const t = setTimeout(fn, ms);
    return () => clearTimeout(t);
  }
  function cancelWait() { if (state && state.cancelWait) { state.cancelWait(); state.cancelWait = null; } }

  // ───────────── device media controls ─────────────
  // Speech synthesis on its own doesn't count as "media" to the operating system.
  // A quiet looping audio track does: while it plays, the page shows up in the
  // Windows media overlay, answers keyboard media keys, and gets lock-screen and
  // notification controls on phones. It also tells the browser the page is
  // playing audio, which keeps it running when you switch to another app.
  const Media = (function () {
    const ms = "mediaSession" in navigator ? navigator.mediaSession : null;
    let el = null, art = null;

    // Ten seconds of near-silence (a faint dither, below hearing), as a WAV file.
    function silentTrack() {
      const rate = 8000, n = rate * 10, buf = new ArrayBuffer(44 + n * 2), v = new DataView(buf);
      const str = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
      str(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); str(8, "WAVE"); str(12, "fmt ");
      v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
      v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
      str(36, "data"); v.setUint32(40, n * 2, true);
      for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, (Math.random() * 3 | 0) - 1, true);
      return URL.createObjectURL(new Blob([buf], { type: "audio/wav" }));
    }

    // Cover art for the media controls, drawn here so there's no image file to host.
    function cover(title, sub) {
      if (art) return art;
      try {
        const c = document.createElement("canvas"); c.width = c.height = 512;
        const g = c.getContext("2d");
        const bg = g.createRadialGradient(256, 300, 20, 256, 300, 380);
        bg.addColorStop(0, "#3a2c14"); bg.addColorStop(1, "#0b0907");
        g.fillStyle = bg; g.fillRect(0, 0, 512, 512);
        g.strokeStyle = "#d9a441"; g.lineWidth = 3;
        for (let r = 60; r <= 150; r += 30) { g.globalAlpha = 1 - (r - 60) / 140; g.beginPath(); g.arc(256, 210, r, 0, Math.PI * 2); g.stroke(); }
        g.globalAlpha = 1; g.fillStyle = "#d9a441"; g.beginPath(); g.arc(256, 210, 34, 0, Math.PI * 2); g.fill();
        g.textAlign = "center"; g.fillStyle = "#efe6d2"; g.font = "600 34px Georgia, serif";
        g.fillText(title, 256, 420);
        g.fillStyle = "#b9a98a"; g.font = "24px Georgia, serif"; g.fillText(sub, 256, 462);
        art = c.toDataURL("image/png");
      } catch (e) { art = null; }
      return art;
    }

    function setup(meta, handlers) {
      if (!el) {
        el = new Audio(silentTrack());
        el.loop = true;
        el.preload = "auto";
        el.setAttribute("aria-hidden", "true");
      }
      if (!ms) return;
      const artwork = cover(meta.series || "", meta.album || "");
      ms.metadata = new MediaMetadata({
        title: meta.title, artist: meta.series, album: meta.album,
        artwork: artwork ? [{ src: artwork, sizes: "512x512", type: "image/png" }] : [],
      });
      const set = (action, fn) => { try { ms.setActionHandler(action, fn); } catch (e) { /* unsupported action */ } };
      set("play", handlers.play);
      set("pause", handlers.pause);
      set("stop", handlers.pause);
      set("previoustrack", handlers.back);
      set("nexttrack", handlers.fwd);
      set("seekbackward", handlers.back);
      set("seekforward", handlers.fwd);
      set("seekto", (d) => handlers.seek(d.seekTime));
    }

    function playing(on) {
      if (el) { if (on) el.play().catch(() => {}); else el.pause(); }
      if (ms) ms.playbackState = on ? "playing" : "paused";
    }

    function position(pos, dur, rate) {
      if (!ms || !ms.setPositionState || !(dur > 0)) return;
      try { ms.setPositionState({ duration: dur, position: Math.min(dur, Math.max(0, pos)), playbackRate: 1 }); } catch (e) {}
    }

    function teardown() {
      if (el) { el.pause(); }
      if (!ms) return;
      ["play", "pause", "stop", "previoustrack", "nexttrack", "seekbackward", "seekforward", "seekto"].forEach((a) => { try { ms.setActionHandler(a, null); } catch (e) {} });
      ms.metadata = null;
      ms.playbackState = "none";
    }

    return { setup, playing, position, teardown };
  })();

  // Rough timings for the media controls' progress bar: about 150 words a minute
  // at the storyteller pace.
  const secondsPerWord = () => 60 / (150 * state.rate / PACE.rate);
  function syncPosition() {
    if (!state) return;
    Media.position(state.current * secondsPerWord(), state.words.length * secondsPerWord());
  }

  // ───────────── playback ─────────────

  function chunkIndexFor(wordIndex) {
    const cs = state.chunks;
    for (let i = cs.length - 1; i >= 0; i--) if (!cs[i].isTitle && cs[i].start <= wordIndex) return i;
    return 0;
  }

  function clearHighlight() {
    state.prose.querySelectorAll(".w.reading, .w.reading-word").forEach((w) => w.classList.remove("reading", "reading-word"));
  }

  function highlight(chunk, wordInChunk) {
    clearHighlight();
    chunk.words.forEach((w) => w.classList.add("reading"));
    const w = chunk.words[wordInChunk];
    if (w) {
      w.classList.add("reading-word");
      setCurrent(Number(w.dataset.i));
      const r = w.getBoundingClientRect();
      if (state.follow && !document.hidden && (r.top < 90 || r.bottom > window.innerHeight - 130))
        w.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }

  function setCurrent(i) {
    state.current = i;
    state.ui.progress.value = i;
    state.ui.time.textContent = remaining();
    localStorage.setItem("narrator.pos." + state.key, String(i));
  }

  function remaining() {
    const left = state.words.length - state.current;
    const mins = Math.max(1, Math.round(left / (150 * state.rate / PACE.rate)));
    return `${mins} min left`;
  }

  function speakChunk(ci, fromWord) {
    const gen = ++state.gen;
    const chunk = state.chunks[ci];
    if (!chunk) return stop(true);
    state.ci = ci;
    const k = chunk.isTitle ? 0 : Math.max(0, fromWord - chunk.start);
    const base = chunk.isTitle ? 0 : chunk.offsets[k];
    const text = chunk.text.slice(base);
    const u = new SpeechSynthesisUtterance(text);
    const v = chunk.isTitle ? { voice: state.voice, rate: state.rate * 0.95, pitch: isNatural(state.voice) ? 1 : PACE.pitch, volume: 1 } : voiceFor(chunk);
    u.voice = v.voice; u.lang = v.voice ? v.voice.lang : "en-GB";
    u.rate = Math.max(0.5, Math.min(2, v.rate));
    u.pitch = Math.max(0.1, Math.min(2, v.pitch));
    u.volume = Math.max(0, Math.min(1, v.volume));
    if (!chunk.isTitle) highlight(chunk, k);
    syncPosition();
    if (state.soundOn && Sound) {
      Sound.setBed(chunk.ambience);
      if (!chunk.isTitle) {
        fireWord(chunk.words[k]);
        // Without word timing from the voice, play the chunk's effects as it begins.
        if (!state.boundaryOK) chunk.words.slice(k).forEach(fireWord);
      }
    }
    u.onboundary = (e) => {
      if (gen !== state.gen || chunk.isTitle || (e.name && e.name !== "word")) return;
      const abs = base + e.charIndex;
      let j = 0;
      while (j + 1 < chunk.offsets.length && chunk.offsets[j + 1] <= abs) j++;
      state.boundaryOK = true;
      highlight(chunk, j);
      fireWord(chunk.words[j]);
    };
    u.onend = () => {
      if (gen !== state.gen || !state.playing) return;
      state.cancelWait = wait(breathe(chunk.gap), () => {
        if (!state || gen !== state.gen || !state.playing) return;
        const next = state.chunks[ci + 1];
        if (next) speakChunk(ci + 1, next.start); else stop(true);
      });
    };
    u.onerror = (e) => { if (gen === state.gen && e.error !== "interrupted" && e.error !== "canceled") stop(false); };
    state.utterance = u; // keep a reference so the browser doesn't drop the callbacks
    synth.speak(u);
  }

  function playFrom(wordIndex, withTitle) {
    if (!state.voice) state.voice = bestVoice();
    state.cast = castVoices(state.voice);
    renderCastList();
    cancelWait();
    synth.cancel();
    state.playing = true;
    state.prose.classList.add("narrating");
    state.ui.root.classList.add("active");
    setPlayIcon();
    state.fired = new Set();
    if (Sound) { Sound.wake(); Sound.resume(); }
    if (state.soundOn) startSound();
    Media.playing(true);
    if (withTitle && state.chunks[0].isTitle) speakChunk(0, 0);
    else { const ci = chunkIndexFor(wordIndex); speakChunk(ci, Math.max(wordIndex, state.chunks[ci].start)); }
  }

  function pause() {
    if (!state.playing) return;
    state.playing = false;
    state.gen++;
    cancelWait();
    synth.cancel(); // cancel + resume-from-word is more reliable across browsers than synth.pause()
    setPlayIcon();
    Media.playing(false);
    syncPosition();
    if (Sound) Sound.pause(); // the ambience and any effect mid-sound stop with the voice
    state.prevTops = new Map();
  }

  function stop(finished) {
    pause();
    if (finished) {
      clearHighlight();
      localStorage.removeItem("narrator.pos." + state.key);
      state.current = 0;
      state.ui.progress.value = 0;
      state.ui.time.textContent = "Finished";
      syncPosition();
    }
  }

  function toggle() {
    if (state.playing) return pause();
    const atStart = state.current === 0;
    playFrom(state.current, atStart);
  }

  function skip(dir) {
    const ci = Math.max(0, Math.min(state.chunks.length - 1, chunkIndexFor(state.current) + dir));
    const target = state.chunks[ci].isTitle ? 0 : state.chunks[ci].start;
    if (state.playing) playFrom(target); else { setCurrent(target); highlight(state.chunks[chunkIndexFor(target)], 0); syncPosition(); }
  }

  function seekSeconds(sec) {
    const i = Math.max(0, Math.min(state.words.length - 1, Math.round(sec / secondsPerWord())));
    if (state.playing) playFrom(i); else { setCurrent(i); syncPosition(); }
  }

  function setSoundIcon() {
    const b = state.ui.sound;
    if (!Sound) { b.style.display = "none"; return; }
    b.innerHTML = state.soundOn
      ? `<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`
      : `<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
    b.classList.toggle("off", !state.soundOn);
    b.setAttribute("aria-pressed", state.soundOn);
  }

  function setPlayIcon() {
    const b = state.ui.play;
    b.innerHTML = state.playing
      ? `<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>`
      : `<svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z"/></svg>`;
    b.setAttribute("aria-label", state.playing ? "Pause narration" : "Play narration");
    state.ui.root.classList.toggle("playing", state.playing);
  }

  const shortName = (v) => (v ? v.name.replace(/^(Microsoft|Google)\s+/, "").replace(/\s+Online.*$/, "").replace(/\s+-\s+English.*$/, "") : "Default");

  // Lists the characters who speak in this chapter and the voice cast for each.
  function renderCastList() {
    const names = window.VOICE_NAMES || {};
    const speakers = [...new Set([...state.prose.querySelectorAll(".say")].map((s) => s.dataset.speaker))];
    state.ui.castList.innerHTML =
      `<li><strong>Narrator</strong>: ${shortName(state.voice)}</li>` +
      speakers.map((id) => {
        const c = state.cast[id];
        return `<li><strong>${names[id] || id}</strong>: ${c ? shortName(c.voice) : shortName(state.voice)}</li>`;
      }).join("");
  }

  function fillVoiceSelect() {
    const sel = state.ui.voice;
    if (!voices.length) { sel.innerHTML = `<option>Default voice</option>`; return; }
    const chosen = state.voice || bestVoice();
    state.voice = chosen;
    sel.innerHTML = voices.map((v) => `<option value="${v.name}" ${chosen && v.name === chosen.name ? "selected" : ""}>${isNatural(v) ? "★ " : ""}${v.name.replace(/^(Microsoft|Google)\s+/, "")} (${v.lang})</option>`).join("");
    state.ui.voiceTip.hidden = voices.some(isNatural);
  }

  // ───────────── UI ─────────────

  function buildUI() {
    const root = document.createElement("div");
    root.className = "narrator";
    root.innerHTML = `
      <div class="nar-inner">
        <button class="nar-btn nar-back" aria-label="Previous sentence" title="Previous sentence">
          <svg viewBox="0 0 24 24"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg></button>
        <button class="nar-play" aria-label="Play narration"></button>
        <button class="nar-btn nar-fwd" aria-label="Next sentence" title="Next sentence">
          <svg viewBox="0 0 24 24"><path d="M16 5h2v14h-2zM4 5v14l11-7z"/></svg></button>
        <div class="nar-track">
          <div class="nar-label"><span class="nar-title">Listen to this chapter</span><span class="nar-time"></span></div>
          <input class="nar-progress" type="range" min="0" value="0" aria-label="Narration position">
        </div>
        <button class="nar-btn nar-sound" aria-label="Soundscape" title="Soundscape: ambience and sound effects"></button>
        <details class="nar-settings">
          <summary aria-label="Narration settings" title="Settings">
            <svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg></summary>
          <div class="nar-panel">
            <label>Voice <select class="nar-voice"></select></label>
            <p class="muted small nar-voicetip" hidden>No natural-sounding voices on this device. For a far more human narrator, open the site in Microsoft Edge (its "Natural" voices are free), or on a Mac or iPhone download an "Enhanced" or "Premium" voice in Settings, under Accessibility, Spoken Content.</p>
            <label>Pace
              <select class="nar-rate">
                <option value="0.82">Slow</option><option value="0.92" selected>Storyteller</option>
                <option value="1">Normal</option><option value="1.12">Brisk</option><option value="1.25">Fast</option>
              </select></label>
            <label class="inline"><input type="checkbox" class="nar-cast"> Character voices for dialogue</label>
            <details class="nar-castlist"><summary>Who's voicing whom</summary><ul></ul></details>
            <label>Soundscape volume <input type="range" class="nar-svol" min="0" max="1" step="0.05"></label>
            <label class="inline"><input type="checkbox" class="nar-readalong"> Soundscape while reading without narration</label>
            <label class="inline"><input type="checkbox" class="nar-follow" checked> Scroll with the narration</label>
            <p class="muted small">Voices marked ★ sound the most natural. While narration is on, click any word to jump there. You can switch to other apps and keep listening; pause or skip from your device's media controls, media keys or lock screen.</p>
          </div>
        </details>
      </div>`;
    const q = (s) => root.querySelector(s);
    return { root, play: q(".nar-play"), back: q(".nar-back"), fwd: q(".nar-fwd"), progress: q(".nar-progress"),
      time: q(".nar-time"), voice: q(".nar-voice"), voiceTip: q(".nar-voicetip"), rate: q(".nar-rate"), svol: q(".nar-svol"),
      sound: q(".nar-sound"), follow: q(".nar-follow"), readAlong: q(".nar-readalong"),
      castToggle: q(".nar-cast"), castList: q(".nar-castlist ul") };
  }

  function attach(article, opts) {
    detach();
    const prose = article.querySelector(".prose");
    if (!supported) {
      prose.insertAdjacentHTML("beforebegin", `<p class="muted small nar-unsupported">Voice-over isn't available in this browser.</p>`);
      return;
    }
    const words = wrapWords(prose);
    linkEffects(prose);
    const ui = buildUI();
    // The saved pace from before this update was on a different scale; map it across.
    const oldRate = { "0.8": "0.82", "0.9": "0.92", "1.15": "1.12", "1.3": "1.25" };
    const savedRate = localStorage.getItem("narrator.rate");
    state = {
      article, prose, words, ui, key: opts.key,
      chunks: buildChunks(prose, words, opts.title).map((c) => ({ ...c, ambience: ambienceOf(c.words[0] || prose.firstElementChild) })),
      current: 0, ci: 0, gen: 0, playing: false, cancelWait: null, utterance: null,
      voice: null,
      rate: Number(oldRate[savedRate] || savedRate || PACE.rate),
      soundOn: !!window.Soundscape && localStorage.getItem("narrator.sound") !== "0",
      soundVolume: Number(localStorage.getItem("narrator.soundVolume") || 0.7),
      readAlong: localStorage.getItem("narrator.readAlong") === "1",
      fired: new Set(), prevTops: new Map(), sfxWords: [], boundaryOK: false,
      characterVoices: localStorage.getItem("narrator.cast") !== "0",
      cast: {},
      follow: true,
    };
    ui.progress.max = Math.max(0, words.length - 1);
    state.sfxWords = words.filter((w) => w.dataset.sfx);
    ui.rate.value = String(state.rate);
    ui.svol.value = String(state.soundVolume);
    ui.readAlong.checked = state.readAlong;
    setSoundIcon();
    ui.castToggle.checked = state.characterVoices;
    fillVoiceSelect();
    setPlayIcon();

    Media.setup(
      { title: opts.mediaTitle || opts.title || "Chapter", series: opts.series || document.title, album: opts.album || "" },
      { play: () => state && !state.playing && toggle(), pause: () => state && pause(),
        back: () => state && skip(-1), fwd: () => state && skip(1), seek: (s) => state && seekSeconds(s) });

    const saved = Number(localStorage.getItem("narrator.pos." + opts.key) || 0);
    if (saved > 0 && saved < words.length) {
      setCurrent(saved);
      ui.root.querySelector(".nar-title").textContent = "Resume where you left off";
    } else ui.time.textContent = remaining();

    ui.play.addEventListener("click", toggle);
    ui.back.addEventListener("click", () => skip(-1));
    ui.fwd.addEventListener("click", () => skip(1));
    ui.progress.addEventListener("input", () => { const i = Number(ui.progress.value); state.playing ? playFrom(i) : (setCurrent(i), syncPosition()); });
    ui.voice.addEventListener("change", () => {
      state.voice = voices.find((v) => v.name === ui.voice.value) || null;
      localStorage.setItem("narrator.voice", ui.voice.value);
      if (state.playing) playFrom(state.current);
    });
    ui.rate.addEventListener("change", () => {
      state.rate = Number(ui.rate.value);
      localStorage.setItem("narrator.rate", ui.rate.value);
      if (state.playing) playFrom(state.current);
    });
    ui.sound.addEventListener("click", () => {
      state.soundOn = !state.soundOn;
      localStorage.setItem("narrator.sound", state.soundOn ? "1" : "0");
      setSoundIcon();
      if (state.soundOn) { if (state.playing || state.readAlong) startSound(); } else Sound && Sound.stop();
    });
    ui.svol.addEventListener("input", () => {
      state.soundVolume = Number(ui.svol.value);
      localStorage.setItem("narrator.soundVolume", ui.svol.value);
      if (Sound) Sound.setVolume(state.soundVolume);
    });
    ui.readAlong.addEventListener("change", () => {
      state.readAlong = ui.readAlong.checked;
      localStorage.setItem("narrator.readAlong", state.readAlong ? "1" : "0");
      if (state.playing) return;
      if (state.readAlong) { if (Sound) Sound.resume(); startSound(); } else if (Sound) Sound.pause();
    });
    // Browsers only allow audio after a click or key press. With the read-along
    // soundscape on, start it on the first one.
    state.unlock = () => { if (state && state.soundOn && state.readAlong && Sound && !Sound.enabled) startSound(); };
    document.addEventListener("pointerdown", state.unlock, { once: true });
    document.addEventListener("keydown", state.unlock, { once: true });
    state.onScroll = () => {
      if (state.scrollQueued) return;
      state.scrollQueued = true;
      requestAnimationFrame(() => { if (state) { state.scrollQueued = false; followScroll(false); } });
    };
    window.addEventListener("scroll", state.onScroll, { passive: true });
    ui.follow.addEventListener("change", () => (state.follow = ui.follow.checked));
    ui.castToggle.addEventListener("change", () => {
      state.characterVoices = ui.castToggle.checked;
      localStorage.setItem("narrator.cast", state.characterVoices ? "1" : "0");
      if (state.playing) playFrom(state.current);
    });
    ui.root.querySelector(".nar-settings").addEventListener("toggle", () => {
      if (!state.voice) state.voice = bestVoice();
      state.cast = castVoices(state.voice);
      renderCastList();
    });

    // Click a word to jump there, once narration has been started.
    prose.addEventListener("click", (e) => {
      const w = e.target.closest(".w");
      if (!w || !prose.classList.contains("narrating")) return;
      if (window.getSelection && String(window.getSelection()).length) return; // don't hijack text selection
      ui.root.querySelector(".nar-title").textContent = "Listen to this chapter";
      playFrom(Number(w.dataset.i));
    });

    document.addEventListener("keydown", onKey);
    document.body.appendChild(ui.root);
    document.body.classList.add("has-narrator");
  }

  function onKey(e) {
    if (!state || e.target.closest("input, select, textarea")) return;
    if (e.code === "Space" && !e.repeat && state.prose.classList.contains("narrating")) { e.preventDefault(); toggle(); }
  }

  function detach() {
    if (!state) return;
    pause();
    clearHighlight();
    if (Sound) { Sound.stop(); Sound.resume(); } // leave the engine unfrozen for the next page
    Media.teardown();
    window.removeEventListener("scroll", state.onScroll);
    document.removeEventListener("pointerdown", state.unlock);
    document.removeEventListener("keydown", state.unlock);
    state.ui.root.remove();
    document.removeEventListener("keydown", onKey);
    document.body.classList.remove("has-narrator");
    state = null;
  }

  window.Narrator = { attach, detach, supported };
})();
