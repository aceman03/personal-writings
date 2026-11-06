// Chapter voice-over using the browser's built-in speech synthesis.
//
// - Play / pause, skip by sentence, seek with the progress bar.
// - While narrating, click any word in the chapter to jump there.
// - Highlights the sentence being read, and the current word where the
//   voice reports word boundaries.
// - Picks a deep, measured storyteller voice and paces it for the book:
//   slower rate, lower pitch, longer pauses at paragraph and scene breaks,
//   a slight shift for dialogue, and an optional low ambient drone.
// - Remembers where you stopped in each chapter.
(function () {
  const synth = window.speechSynthesis;
  const supported = !!(synth && window.SpeechSynthesisUtterance);

  // Narrator voices to prefer, best first: deep, unhurried, British-leaning storytellers.
  const PREFERRED = [
    /Daniel/i, /Arthur/i, /Microsoft (Ryan|Thomas|George|Oliver)/i, /Google UK English Male/i,
    /Microsoft (Christopher|Guy|Davis|Andrew|Brian|Eric|Roger|Steffan)/i, /Oliver/i, /Rishi/i, /Aaron/i,
    /Alex\b/i, /Fred/i, /male/i,
  ];
  const PACE = { rate: 0.9, pitch: 0.82, dialoguePitch: 0.95 };
  const GAP = { sentence: 120, paragraph: 650, scene: 1600, title: 1100 };

  // How each mood bends the voice. Multipliers on rate and pitch; volume is absolute.
  // `gap` stretches the pauses after a sentence in that mood.
  const MOODS = {
    calm:     { rate: 1.0,  pitch: 1.0,  volume: 1.0,  gap: 1.0 },
    warm:     { rate: 0.96, pitch: 1.04, volume: 1.0,  gap: 1.0 },
    awe:      { rate: 0.86, pitch: 1.05, volume: 0.95, gap: 1.35 },
    hushed:   { rate: 0.86, pitch: 0.96, volume: 0.6,  gap: 1.25 },
    whisper:  { rate: 0.82, pitch: 0.94, volume: 0.42, gap: 1.3 },
    shaken:   { rate: 0.92, pitch: 1.08, volume: 0.8,  gap: 1.2 },
    tense:    { rate: 1.08, pitch: 1.0,  volume: 1.0,  gap: 0.8 },
    urgent:   { rate: 1.18, pitch: 1.08, volume: 1.0,  gap: 0.6 },
    dread:    { rate: 0.84, pitch: 0.9,  volume: 0.85, gap: 1.5 },
    grief:    { rate: 0.8,  pitch: 0.9,  volume: 0.75, gap: 1.6 },
    stern:    { rate: 0.94, pitch: 0.94, volume: 1.0,  gap: 1.0 },
    menacing: { rate: 0.74, pitch: 0.78, volume: 0.9,  gap: 1.8 },
    wonder:   { rate: 0.9,  pitch: 1.08, volume: 0.95, gap: 1.2 },
    dry:      { rate: 1.02, pitch: 0.97, volume: 1.0,  gap: 0.9 },
  };
  const moodOf = (name) => MOODS[name] || MOODS.calm;

  // ───────────── character voice casting ─────────────
  // Character voice profiles come from window.VOICE_PROFILES (set by each series):
  //   { gender: "female" | "male", age: "child" | "young" | "adult" | "old",
  //     accent: "en-GB" | "en-US" | ..., pitch: 1.0, rate: 1.0, mood: "warm" }
  const FEMALE = /Samantha|Karen|Moira|Tessa|Serena|Fiona|Victoria|Kate|Susan|Martha|Allison|Ava|Zira|Hazel|Libby|Sonia|Jenny|Aria|Emma|Michelle|Natasha|Clara|Ana\b|Joanna|Salli|Kimberly|Nicky|Veena|Female|Woman|Zoe|Amy|Olivia|Maisie|Abbi|Bella|Hollie/i;
  const MALE = /Daniel|Arthur|Oliver|Alex\b|Fred|Tom\b|Aaron|Rishi|Gordon|Lee\b|George|Ryan|Thomas|Guy|Christopher|Eric|Davis|Andrew|Brian|Roger|Steffan|David|Mark|James|Male|Man\b|Liam|William|Noah|Ethan|Alfie|Elliot/i;
  const AGE = { child: { pitch: 1.35, rate: 1.04 }, young: { pitch: 1.1, rate: 1.02 }, adult: { pitch: 1, rate: 1 }, old: { pitch: 0.88, rate: 0.9 } };
  const genderOf = (v) => (FEMALE.test(v.name) ? "female" : MALE.test(v.name) ? "male" : "unknown");

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
        (/natural|neural|online|premium|enhanced/i.test(v.name) ? 1 : 0);
      const pick = pool.slice().sort((a, b) => score(a) - score(b))[0] || narratorVoice;
      if (pick) used.set(pick.name, (used.get(pick.name) || 0) + 1);
      const age = AGE[p.age || "adult"];
      // Same voice as someone else? Nudge the pitch so they still sound distinct.
      const nudge = pick ? 1 + ((used.get(pick.name) - 1) % 3) * 0.06 * (p.gender === "male" ? -1 : 1) : 1;
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
    for (const re of PREFERRED) {
      const v = voices.find((x) => re.test(x.name) && /en-GB/i.test(x.lang)) || voices.find((x) => re.test(x.name));
      if (v) return v;
    }
    return voices.find((v) => /en-GB/i.test(v.lang)) || voices[0] || null;
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

  const endsSentence = (t) => /[.!?]["')\]]*$/.test(t);
  const opensQuote = (t) => /^["“]/.test(t);
  const closesQuote = (t) => /["”][.,!?;:]*$/.test(t) && !/^["“][^"”]*$/.test(t);

  // Group words into speakable chunks: sentences, split again wherever the speaker
  // changes. Each chunk knows its speaker (null = narrator) and mood.
  function buildChunks(prose, words, title) {
    const chunks = [];
    const push = (ws, gap, info) => {
      if (!ws.length) return;
      const offsets = [];
      let text = "";
      ws.forEach((w, k) => { offsets.push(text.length); text += (k ? " " : "") + w.textContent; offsets[k] += k ? 1 : 0; });
      const m = moodOf(info.mood);
      chunks.push({ start: Number(ws[0].dataset.i), words: ws, text, offsets, gap: Math.round(gap * m.gap), ...info });
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
        if (cur.length && info.key !== curKey) { push(cur, GAP.sentence, curInfo); cur = []; }
        cur.push(w); curKey = info.key; curInfo = info;
        const last = k === ws.length - 1;
        if (!w.closest(".say") && inQuote && closesQuote(t)) { push(cur, last ? GAP.paragraph : GAP.sentence, curInfo); cur = []; inQuote = false; return; }
        if (endsSentence(t) || last) { push(cur, last ? GAP.paragraph : GAP.sentence, curInfo); cur = []; }
      });
    });
    return chunks;
  }

  // Voice, rate, pitch and volume for a chunk: who is speaking, then how they feel.
  function voiceFor(chunk) {
    const mood = moodOf(chunk.mood);
    if (chunk.dialogue && state.characterVoices) {
      const c = chunk.speaker && state.cast[chunk.speaker];
      if (c) {
        const m = chunk.mood ? mood : moodOf(c.mood);
        return { voice: c.voice || state.voice, rate: state.rate * c.rate * m.rate, pitch: Math.min(2, c.pitch * m.pitch), volume: m.volume };
      }
      return { voice: state.voice, rate: state.rate * mood.rate, pitch: PACE.dialoguePitch * mood.pitch, volume: mood.volume };
    }
    return { voice: state.voice, rate: state.rate * mood.rate, pitch: (chunk.dialogue ? PACE.dialoguePitch : PACE.pitch) * mood.pitch, volume: mood.volume };
  }

  // ───────────── ambience ─────────────
  // A low, slowly breathing drone with a hint of wind, built with Web Audio.
  const Ambience = {
    ctx: null, master: null,
    start() {
      try {
        if (!this.ctx) this.build();
        this.ctx.resume();
        this.master.gain.cancelScheduledValues(this.ctx.currentTime);
        this.master.gain.setTargetAtTime(0.06, this.ctx.currentTime, 1.5);
      } catch (e) { /* audio unavailable */ }
    },
    stop() {
      if (!this.ctx) return;
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.6);
    },
    build() {
      const ctx = (this.ctx = new (window.AudioContext || window.webkitAudioContext)());
      const master = (this.master = ctx.createGain());
      master.gain.value = 0;
      master.connect(ctx.destination);
      // Drone: a low fifth, slightly detuned.
      [[55, 0.5], [82.4, 0.32], [110.3, 0.12]].forEach(([f, g]) => {
        const o = ctx.createOscillator(), gn = ctx.createGain();
        o.type = "sine"; o.frequency.value = f; gn.gain.value = g;
        o.connect(gn).connect(master); o.start();
      });
      // Wind: brown noise through a slowly sweeping low-pass filter.
      const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      let last = 0;
      for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
      const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 420; lp.Q.value = 0.7;
      const ng = ctx.createGain(); ng.gain.value = 0.9;
      const lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
      lfo.frequency.value = 0.07; lfoGain.gain.value = 220;
      lfo.connect(lfoGain).connect(lp.frequency); lfo.start();
      noise.connect(lp).connect(ng).connect(master); noise.start();
    },
  };

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
      if (state.follow && (r.top < 90 || r.bottom > window.innerHeight - 130))
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
    const mins = Math.max(1, Math.round(left / (150 * state.rate)));
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
    const v = chunk.isTitle ? { voice: state.voice, rate: state.rate, pitch: PACE.pitch, volume: 1 } : voiceFor(chunk);
    u.voice = v.voice; u.lang = v.voice ? v.voice.lang : "en-GB";
    u.rate = Math.max(0.5, Math.min(2, v.rate));
    u.pitch = Math.max(0.1, Math.min(2, v.pitch));
    u.volume = v.volume;
    if (!chunk.isTitle) highlight(chunk, k);
    u.onboundary = (e) => {
      if (gen !== state.gen || chunk.isTitle || (e.name && e.name !== "word")) return;
      const abs = base + e.charIndex;
      let j = 0;
      while (j + 1 < chunk.offsets.length && chunk.offsets[j + 1] <= abs) j++;
      highlight(chunk, j);
    };
    u.onend = () => {
      if (gen !== state.gen || !state.playing) return;
      state.timer = setTimeout(() => {
        if (gen !== state.gen || !state.playing) return;
        const next = state.chunks[ci + 1];
        if (next) speakChunk(ci + 1, next.start); else stop(true);
      }, chunk.gap);
    };
    u.onerror = (e) => { if (gen === state.gen && e.error !== "interrupted" && e.error !== "canceled") stop(false); };
    state.utterance = u; // keep a reference so the browser doesn't drop the callbacks
    synth.speak(u);
  }

  function playFrom(wordIndex, withTitle) {
    if (!state.voice) state.voice = bestVoice();
    state.cast = castVoices(state.voice);
    renderCastList();
    clearTimeout(state.timer);
    synth.cancel();
    state.playing = true;
    state.prose.classList.add("narrating");
    state.ui.root.classList.add("active");
    setPlayIcon();
    if (state.ambience) Ambience.start();
    if (withTitle && state.chunks[0].isTitle) speakChunk(0, 0);
    else { const ci = chunkIndexFor(wordIndex); speakChunk(ci, Math.max(wordIndex, state.chunks[ci].start)); }
  }

  function pause() {
    if (!state.playing) return;
    state.playing = false;
    state.gen++;
    clearTimeout(state.timer);
    synth.cancel(); // cancel + resume-from-word is more reliable across browsers than synth.pause()
    Ambience.stop();
    setPlayIcon();
  }

  function stop(finished) {
    pause();
    if (finished) {
      clearHighlight();
      localStorage.removeItem("narrator.pos." + state.key);
      state.current = 0;
      state.ui.progress.value = 0;
      state.ui.time.textContent = "Finished";
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
    if (state.playing) playFrom(target); else { setCurrent(target); highlight(state.chunks[chunkIndexFor(target)], 0); }
  }

  function setPlayIcon() {
    const b = state.ui.play;
    b.innerHTML = state.playing
      ? `<svg viewBox="0 0 24 24"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>`
      : `<svg viewBox="0 0 24 24"><path d="M7 4.5v15l13-7.5z"/></svg>`;
    b.setAttribute("aria-label", state.playing ? "Pause narration" : "Play narration");
    state.ui.root.classList.toggle("playing", state.playing);
  }

  // Lists the characters who speak in this chapter and the voice cast for each.
  function renderCastList() {
    const names = window.VOICE_NAMES || {};
    const speakers = [...new Set([...state.prose.querySelectorAll(".say")].map((s) => s.dataset.speaker))];
    const short = (v) => (v ? v.name.replace(/^(Microsoft|Google)\s+/, "").replace(/\s+Online.*$/, "") : "Default");
    state.ui.castList.innerHTML =
      `<li><strong>Narrator</strong>: ${short(state.voice)}</li>` +
      speakers.map((id) => {
        const c = state.cast[id];
        return `<li><strong>${names[id] || id}</strong>: ${c ? short(c.voice) : short(state.voice)}</li>`;
      }).join("");
  }

  function fillVoiceSelect() {
    const sel = state.ui.voice;
    if (!voices.length) { sel.innerHTML = `<option>Default voice</option>`; return; }
    const chosen = state.voice || bestVoice();
    state.voice = chosen;
    sel.innerHTML = voices.map((v) => `<option value="${v.name}" ${chosen && v.name === chosen.name ? "selected" : ""}>${v.name.replace(/^(Microsoft|Google)\s+/, "")} (${v.lang})</option>`).join("");
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
        <details class="nar-settings">
          <summary aria-label="Narration settings" title="Settings">
            <svg viewBox="0 0 24 24"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg></summary>
          <div class="nar-panel">
            <label>Voice <select class="nar-voice"></select></label>
            <label>Pace
              <select class="nar-rate">
                <option value="0.8">Slow</option><option value="0.9" selected>Storyteller</option>
                <option value="1">Normal</option><option value="1.15">Brisk</option><option value="1.3">Fast</option>
              </select></label>
            <label class="inline"><input type="checkbox" class="nar-cast"> Character voices for dialogue</label>
            <details class="nar-castlist"><summary>Who's voicing whom</summary><ul></ul></details>
            <label class="inline"><input type="checkbox" class="nar-amb"> Ambient drone</label>
            <label class="inline"><input type="checkbox" class="nar-follow" checked> Scroll with the narration</label>
            <p class="muted small">While narration is on, click any word to jump there. The voice depends on your device. Narrator voices like Daniel or Ryan sound best.</p>
          </div>
        </details>
      </div>`;
    const q = (s) => root.querySelector(s);
    return { root, play: q(".nar-play"), back: q(".nar-back"), fwd: q(".nar-fwd"), progress: q(".nar-progress"),
      time: q(".nar-time"), voice: q(".nar-voice"), rate: q(".nar-rate"), amb: q(".nar-amb"), follow: q(".nar-follow"),
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
    const ui = buildUI();
    state = {
      article, prose, words, ui, key: opts.key,
      chunks: buildChunks(prose, words, opts.title),
      current: 0, ci: 0, gen: 0, playing: false, timer: null, utterance: null,
      voice: null,
      rate: Number(localStorage.getItem("narrator.rate") || PACE.rate),
      ambience: localStorage.getItem("narrator.ambience") !== "0",
      characterVoices: localStorage.getItem("narrator.cast") !== "0",
      cast: {},
      follow: true,
    };
    ui.progress.max = Math.max(0, words.length - 1);
    ui.rate.value = String(state.rate);
    ui.amb.checked = state.ambience;
    ui.castToggle.checked = state.characterVoices;
    fillVoiceSelect();
    setPlayIcon();

    const saved = Number(localStorage.getItem("narrator.pos." + opts.key) || 0);
    if (saved > 0 && saved < words.length) {
      setCurrent(saved);
      ui.root.querySelector(".nar-title").textContent = "Resume where you left off";
    } else ui.time.textContent = remaining();

    ui.play.addEventListener("click", toggle);
    ui.back.addEventListener("click", () => skip(-1));
    ui.fwd.addEventListener("click", () => skip(1));
    ui.progress.addEventListener("input", () => { const i = Number(ui.progress.value); state.playing ? playFrom(i) : setCurrent(i); });
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
    ui.amb.addEventListener("change", () => {
      state.ambience = ui.amb.checked;
      localStorage.setItem("narrator.ambience", state.ambience ? "1" : "0");
      state.ambience && state.playing ? Ambience.start() : Ambience.stop();
    });
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
    state.ui.root.remove();
    document.removeEventListener("keydown", onKey);
    document.body.classList.remove("has-narrator");
    state = null;
  }

  window.Narrator = { attach, detach, supported };
})();
