// Character list for The Day the Gods Went Silent.
//
// Descriptions are spoiler-free: they only say what a reader knows when the
// character is first introduced. Add new characters as they appear.
// `firstAppears` is "book.chapter". To use real artwork instead of the drawn
// portrait, add `image: "series/the-day-the-gods-went-silent/art/<file>.png"`.
(function () {
  const P = (spec) => () => window.PORTRAITS.person(spec);
  const E = (spec) => () => window.PORTRAITS.emblem(spec);

  const CHARACTERS = [
    // ── The Hearthlands ──
    {
      id: "sereth", name: "Sereth", epithet: "Eldest of the Dawnwardens", group: "Solmere",
      facts: { Race: "Human", Home: "Solmere", Power: "Blessed by Aurem the Sunfather" },
      firstAppears: "1.1",
      description: "Sereth has climbed the hundred steps of the Sunspire every morning for fifty-one years, longer than any other Dawnwarden alive. Each dawn she stands in the ring at the top with the other ten and catches Aurem's first light in her hands, so it can pour down over the city. She has done it so many times that she no longer thinks of it as a miracle.",
      portrait: P({ alt: "Sereth", age: "old", skin: "tan", hair: "bun", hairColor: "#e8e2d6", clothing: "#f2ead8", trim: "#d9a441",
        outfit: "mantle", emblem: "sun", background: ["#7a5a2a", "#1b150f"], aura: "#ffd36a", stern: true }),
    },
    {
      id: "oren-vasse", name: "Father Oren Vasse", epithet: "Priest of the Warden", group: "Solmere",
      facts: { Race: "Human", Home: "The Temple of Thalen, Solmere", Power: "Blessed by Thalen the Warden" },
      firstAppears: "1.1",
      description: "An old priest who has served Thalen for forty years, Oren conducts the Readings in the temple's windowless Reading Hall, where blessings are measured and recorded in the ledger. He believes the ladder of blessing ranks matters a great deal less than the temples think it does. He has never said so out loud.",
      portrait: P({ alt: "Father Oren Vasse", age: "old", skin: "light", hair: "fringe", hairColor: "#bdbdbd", beard: "full", beardColor: "#cfcfcf",
        clothing: "#2f4766", trim: "#9fc8ef", outfit: "robe", emblem: "shield", background: ["#2e4a66", "#11161d"], smile: true }),
    },
    {
      id: "corvel", name: "Prince Corvel", epithet: "Second son of King Haldren", group: "Solmere",
      facts: { Race: "Human", Home: "Solmere", Power: "Blessed by Thalen. Ranked E-class by the temple" },
      firstAppears: "1.1",
      description: "A thin, solemn twelve-year-old who would rather be anywhere other than standing in the middle of the Reading Hall. Like every royal child, Corvel must have his blessing read and ranked at twelve. His elder brother read brilliantly. Corvel's blessing is quiet and strange, the kind the temple ledger doesn't quite know what to do with.",
      portrait: P({ alt: "Prince Corvel", build: "child", skin: "fair", hair: "short", hairColor: "#2b211c", eyeColor: "#4a6a8a",
        clothing: "#3c4f7a", trim: "#d9b26a", outfit: "mantle", headwear: "circlet", background: ["#33456b", "#12141c"] }),
    },

    // ── The Collegium ──
    {
      id: "edda-marsh", name: "Edda Marsh", epithet: "First-year student", group: "The Collegium of Halvenreach",
      facts: { Race: "Human", Home: "The docks of Halvenreach", Power: "Magic (still learning)" },
      firstAppears: "1.1",
      description: "A fisherman's daughter from the Halvenreach docks who came to the Collegium to learn magic. For eleven weeks she sat in a quiet stone room trying to find her well, while students who arrived after her found theirs and moved on. She is stubborn, practical, and more than a little afraid she doesn't belong.",
      portrait: P({ alt: "Edda Marsh", skin: "light", hair: "braid", hairColor: "#8a4b2a", freckles: true, blush: true, eyeColor: "#3f6d6a",
        clothing: "#5a6b5a", outfit: "tunic", background: ["#2f4d55", "#10171a"] }),
    },
    {
      id: "teodric-hale", name: "Magus Teodric Hale", epithet: "Teacher at the Collegium", group: "The Collegium of Halvenreach",
      facts: { Race: "Human", Home: "Halvenreach", Power: "Magic. Fourth-ring Magus" },
      firstAppears: "1.1",
      description: "An old Magus with ink-stained fingers, a burn scar on one hand and the patience of a heron. Hale teaches first-years to find their wells and second-years their first combat spells, and he says the same words to every student who finds their well: \"Never cast without knowing again.\" He believes in learning the inherited circles exactly as they were taught.",
      portrait: P({ alt: "Magus Teodric Hale", age: "old", skin: "tan", hair: "fringe", hairColor: "#e6e1d8", beard: "full", beardColor: "#ece7de",
        clothing: "#3a3150", trim: "#8fb7d9", outfit: "robe", background: ["#3d3558", "#14121a"], stern: true }),
    },
    {
      id: "ilsabet-corrow", name: "Ilsabet Corrow", epithet: "Spellcrafter", group: "The Collegium of Halvenreach",
      facts: { Race: "Human", Home: "The east tower of the Collegium", Power: "Magic. Spellcrafter" },
      firstAppears: "1.1",
      description: "One of perhaps two hundred spellcrafters in all of Caelmar. Ilsabet has lived for nineteen years in a tower room whose door locks from the outside, which she mostly doesn't mind. She takes inherited spells apart glyph by glyph to learn how they really work. She is brilliant, scarred from her experiments, and writes everything important in a cipher only she can read.",
      portrait: P({ alt: "Ilsabet Corrow", skin: "fair", hair: "bun", hairColor: "#8d8a86", spectacles: true, eyeColor: "#5a4a3a",
        clothing: "#2d2a36", trim: "#ff9a4f", outfit: "robe", background: ["#4a2f22", "#140f0c"], aura: "#ff9a4f", stern: true }),
    },

    // ── Beyond the Hearthlands ──
    {
      id: "tyriel", name: "Tyriel", epithet: "Memory-keeper of Ithrel", group: "Beyond the Hearthlands",
      facts: { Race: "Elf", Home: "The forest of Ithrel", Power: "Blessed by Ione the Remembering" },
      firstAppears: "1.1",
      description: "An old elven memory-keeper. Like others of her calling, Tyriel can lay her palm on a stone and see the hands that shaped it a thousand years before. On sleepless nights she goes down to her city's heartstone to visit the oldest memories she knows.",
      portrait: P({ alt: "Tyriel", build: "elf", skin: "elf", hair: "long", hairColor: "#d9dde3", eyeColor: "#5a8a5a",
        clothing: "#2f5a3e", trim: "#b9c98a", outfit: "robe", headwear: "leafcirclet", emblem: "leaf", background: ["#2d4d36", "#0e1510"], aura: "#9fe0a8" }),
    },
    {
      id: "hagra-stonebrow", name: "Hagra Stonebrow", epithet: "Forge-master of the Kharn", group: "Beyond the Hearthlands",
      facts: { Race: "Dwarf", Home: "The Kharn Mountains", Power: "Craft (rune inscription)" },
      firstAppears: "1.1",
      description: "A dwarven forge-master who carves rune-circles into steel by lamplight, as her grandmother taught her and her grandmother's grandmother before that. Her axes never dull and never break. Like most dwarves, she has no patience for gods or mages, and she will throw you out of her forge if you call her work \"magic.\"",
      portrait: P({ alt: "Hagra Stonebrow", build: "dwarf", skin: "dwarf", hair: "long", hairColor: "#b5562e", beard: "braided", beardColor: "#b5562e",
        clothing: "#5a4a3a", outfit: "apron", background: ["#5a3420", "#160d08"], aura: "#ff8a3a", stern: true, scar: true }),
    },
    {
      id: "urzag", name: "Urzag", epithet: "Champion of the Red Hand", group: "Beyond the Hearthlands",
      facts: { Race: "Orc", Home: "The Ashen Steppe", Power: "Blessed by Karrog the Red Hand" },
      firstAppears: "1.1",
      description: "An orc champion who has served Karrog, god of war, for twenty years. Urzag carries his god's blessing as a constant burning heat between his shoulder blades, and it makes him tireless in battle. He is a seasoned warrior who knows his god's moods well.",
      portrait: P({ alt: "Urzag", build: "orc", skin: "orc", hair: "topknot", hairColor: "#1e1a17", warpaint: "#b8322a", stern: true,
        clothing: "#4a3a2e", outfit: "furs", emblem: "redhand", background: ["#5a2420", "#140a09"], aura: "#d9452f", scar: true }),
    },
    {
      id: "hask-morrow", name: "Sergeant Hask Morrow", epithet: "Warden of the Thornwall", group: "Greywatch",
      facts: { Race: "Human", Home: "The Thornwall", Power: "None. A soldier" },
      firstAppears: "1.1",
      description: "A sergeant who has walked the top of the Thornwall for twenty-two years, keeping watch over the Wildlands on the far side. He knows every sound the dark makes at night, and he knows the faint blue hum of the wall's circles so well that he no longer hears it.",
      portrait: P({ alt: "Sergeant Hask Morrow", skin: "brown", hair: "cropped", hairColor: "#2a221c", beard: "stubble", beardColor: "#2a221c", stern: true,
        clothing: "#2b3138", trim: "#7fd0ff", outfit: "cloak", headwear: "helm", emblem: "glyph", background: ["#22323d", "#0b0f13"] }),
    },

    // ── Greywatch ──
    {
      id: "aldric-vane", name: "Sir Aldric Vane", epithet: "Knight-Captain of Greywatch", group: "Greywatch",
      facts: { Race: "Human", Home: "Greywatch, at the foot of the Thornwall", Power: "Blessed by Aurem the Sunfather. The Shield of Dawn, ranked A-class" },
      firstAppears: "1.2",
      description: "A knight of the Order of the Dawn who has commanded the garrison at Greywatch for four years. For eighteen years, Aurem has answered him every sunrise with the Shield of Dawn, a wall of gold light that has never once failed him. He is a blacksmith's son, disciplined, proud, and not fond of mages. He once tried to have the town's hedge-witch driven out of the district.",
      portrait: P({ alt: "Sir Aldric Vane", skin: "light", hair: "short", hairColor: "#5a4632", beard: "stubble", beardColor: "#5a4632", stern: true, scar: true,
        clothing: "#e9e1cf", trim: "#d9a441", outfit: "armor", emblem: "sun", background: ["#5a4a2a", "#14100a"] }),
    },
    {
      id: "nyx-thornbriar", name: "Nyx Thornbriar", epithet: "Hedge-witch of Greywatch", group: "Greywatch",
      facts: { Race: "Half-elf", Home: "A cottage outside the Greywatch palisade", Power: "Magic. Self-taught" },
      firstAppears: "1.2",
      description: "A half-elven hedge-witch who taught herself magic from three stolen books, a great deal of trial and error, and the burn on her chin. Greywatch has never wanted her inside its walls, and she has long since stopped caring. Sharp-tongued, stubborn and very good at looking people straight in the eye, she has never had a teacher and doesn't know the proper words for anything. She knows how to make it work anyway.",
      portrait: P({ alt: "Nyx Thornbriar", build: "elf", skin: "light", hair: "short", hairColor: "#141216", eyeColor: "#3f8a4f", scar: true,
        clothing: "#5c5866", trim: "#9a93a8", outfit: "cloak", background: ["#2f3a36", "#0d110f"], aura: "#ff9a4f" }),
    },
    {
      id: "pip", name: "Pip", epithet: "A foundling of Greywatch", group: "Greywatch",
      facts: { Race: "Human", Home: "The Last Lamp inn, Greywatch", Power: "Unknown" },
      firstAppears: "1.2",
      description: "A small, quiet girl of eight or nine who arrived in Greywatch two winters ago on a trapper's sled, half-frozen, with no family and no memory of where she came from. Dagny Holt took her in at the Last Lamp, where she helps in the kitchen. She barely speaks, and the town has decided she's simple. She likes to draw in the dirt.",
      portrait: P({ alt: "Pip", build: "child", skin: "fair", hair: "long", hairColor: "#6b4f36", eyeColor: "#9aa4ad",
        clothing: "#6b5440", outfit: "tunic", background: ["#2c3550", "#0d0f17"] }),
    },
    {
      id: "dagny-holt", name: "Dagny Holt", epithet: "Keeper of the Last Lamp", group: "Greywatch",
      facts: { Race: "Human", Home: "The Last Lamp inn, Greywatch", Power: "None" },
      firstAppears: "1.2",
      description: "The broad, red-faced, flour-dusted woman who runs the Last Lamp, Greywatch's only inn. She took in an orphaned girl nobody else wanted, and she runs her kitchen the way a sergeant runs a barracks.",
      portrait: P({ alt: "Dagny Holt", skin: "fair", blush: true, hair: "bun", hairColor: "#8a4b2a", smile: true,
        clothing: "#7a5a3a", outfit: "apron", background: ["#5a3a24", "#140d08"] }),
    },

    // ── The gods ──
    {
      id: "aurem", name: "Aurem the Sunfather", epithet: "The Bright Court", group: "The Gods",
      facts: { Court: "The Bright Court", Domain: "The sun, light and warmth" },
      firstAppears: "1.1",
      description: "Aurem rides the sun. Every morning in Solmere, the Dawnwardens catch his first light and pour it down over the city, and the sick rise from their beds. To the people of the Hearthlands, his goodness is the first truth they learn.",
      portrait: E({ color: "#ffd36a", background: ["#6a4a1a", "#120e08"],
        svg: `<circle r="26" fill="#ffd36a"/>${Array.from({ length: 12 }, (_, i) => `<path d="M0,-34 L5,-50 L0,-58 L-5,-50 Z" fill="#ffd36a" transform="rotate(${i * 30})"/>`).join("")}` }),
    },
    {
      id: "lyssa", name: "Lyssa of the Long Harvest", epithet: "The Bright Court", group: "The Gods",
      facts: { Court: "The Bright Court", Domain: "Rain, harvest and healing" },
      firstAppears: "1.1",
      description: "Lyssa calls the rain and swells the grain. Her priestesses kneel in dying fields and feel her kneel beside them, and healing circles anchored with her name can close wounds no mage could touch.",
      portrait: E({ color: "#9fe07a", background: ["#2f5a2a", "#0c140a"],
        svg: `<path d="M0,50 V-50" stroke="#e8d27a" stroke-width="4"/>${[-36, -20, -4, 12].map((y) => `<path d="M0,${y} c-14,-4 -22,-14 -22,-24 c12,2 20,10 22,24 Z M0,${y} c14,-4 22,-14 22,-24 c-12,2 -20,10 -22,24 Z" fill="#e8d27a"/>`).join("")}<path d="M-40,40 q20,-14 40,0 q20,14 40,0" stroke="#9fe07a" stroke-width="3" fill="none"/>` }),
    },
    {
      id: "thalen", name: "Thalen the Warden", epithet: "The Bright Court", group: "The Gods",
      facts: { Court: "The Bright Court", Domain: "Protection, oaths and the edges of the world" },
      firstAppears: "1.1",
      description: "Thalen holds back the dark things at the edges of the map. His name-glyph is carved at the heart of every mile of the Thornwall, and his paladins feel him raise their shields alongside them. He does not forgive broken oaths.",
      portrait: E({ color: "#7fc8ff", background: ["#24405a", "#0a1018"],
        svg: `<path d="M0,-52 L42,-36 V6 C42,30 20,46 0,54 C-20,46 -42,30 -42,6 V-36 Z" fill="none" stroke="#7fc8ff" stroke-width="5"/><path d="M0,-32 V36 M-22,-6 H22" stroke="#7fc8ff" stroke-width="5"/>` }),
    },
    {
      id: "ione", name: "Ione the Remembering", epithet: "The Bright Court", group: "The Gods",
      facts: { Court: "The Bright Court", Domain: "Memory. Goddess of the elves" },
      firstAppears: "1.1",
      description: "Ione keeps the memory of every life that has ever been lived. The elves of Ithrel are hers, and her memory-keepers can read the past in stone.",
      portrait: E({ color: "#c9b8ff", background: ["#3a3060", "#0e0c18"],
        svg: `<path d="M-50,0 Q0,-40 50,0 Q0,40 -50,0 Z" fill="none" stroke="#c9b8ff" stroke-width="4"/><circle r="16" fill="none" stroke="#c9b8ff" stroke-width="4"/><circle r="6" fill="#c9b8ff"/><path d="M0,-30 V-54 M-24,-24 L-36,-42 M24,-24 L36,-42" stroke="#c9b8ff" stroke-width="3"/>` }),
    },
    {
      id: "karrog", name: "Karrog the Red Hand", epithet: "The Hollow Choir", group: "The Gods",
      facts: { Court: "The Hollow Choir", Domain: "War and slaughter" },
      firstAppears: "1.1",
      description: "Karrog is the god of war, worshipped by many of the orc clans of the Ashen Steppe and by every warlord who ever wanted something taken by force. His champions fight without tiring. He demands obedience, and the Steppe tells stories of what he does to those who disobey.",
      portrait: E({ color: "#e0453a", background: ["#5a1a16", "#120706"],
        svg: `<path d="M-24,48 V-4 L-30,-34 C-31,-42 -22,-44 -20,-36 L-14,-12 V-48 C-14,-56 -4,-56 -4,-48 V-14 V-54 C-4,-62 6,-62 6,-54 V-14 V-48 C6,-56 16,-56 16,-48 V-10 V-36 C16,-44 26,-44 26,-36 V20 C26,36 14,48 0,48 Z" fill="#c8322a"/>` }),
    },
    {
      id: "vhessane", name: "Vhessane the Pale", epithet: "The Hollow Choir", group: "The Gods",
      facts: { Court: "The Hollow Choir", Domain: "Plague, fever and rot" },
      firstAppears: "1.1",
      description: "Vhessane breathes fevers and rot into the world. Her temples are sealed caves that no sane person enters.",
      portrait: E({ color: "#c8d6b0", background: ["#2e3528", "#0b0d09"],
        svg: `<path d="M0,-52 C34,-52 42,-20 38,8 C34,36 16,52 0,54 C-16,52 -34,36 -38,8 C-42,-20 -34,-52 0,-52 Z" fill="#e6ead8" opacity=".9"/><path d="M-22,-6 q8,-8 16,0 q-8,6 -16,0 Z M6,-6 q8,-8 16,0 q-8,6 -16,0 Z" fill="#1a1d16"/><path d="M-12,26 q12,6 24,0" stroke="#1a1d16" stroke-width="3" fill="none"/><path d="M-14,4 l-4,30 M14,4 l4,30" stroke="#8a9a6a" stroke-width="2" opacity=".7"/>` }),
    },
    {
      id: "the-nameless", name: "The Nameless One", epithet: "The Hollow Choir", group: "The Gods",
      facts: { Court: "The Hollow Choir", "Also called": "The Whisperer, the Voice Beneath", Domain: "Unknown" },
      firstAppears: "1.1",
      description: "The one god with no name. Scholars call it the Whisperer, and priests call it the Voice Beneath. Ordinary people don't call it anything, and change the subject when it comes up.",
      portrait: E({ color: "#8a7bb0", background: ["#14111c", "#000000"],
        svg: `<circle r="46" fill="#000" stroke="#8a7bb0" stroke-opacity=".5" stroke-width="2"/><circle r="30" fill="none" stroke="#8a7bb0" stroke-opacity=".3" stroke-dasharray="1 7"/><path d="M-16,8 q16,10 32,0" stroke="#8a7bb0" stroke-opacity=".55" stroke-width="2" fill="none"/>` }),
    },
  ];

  // Voice-over casting. Each speaking character gets a profile; the narrator picks the
  // best match from the voices on the reader's device. Mood is their default manner.
  const VOICES = {
    sereth:          { gender: "female", age: "old",   accent: "en-GB", pitch: 0.95, mood: "stern" },
    "oren-vasse":    { gender: "male",   age: "old",   accent: "en-GB", pitch: 1.0,  mood: "warm" },
    corvel:          { gender: "male",   age: "child", accent: "en-GB", mood: "calm" },
    "edda-marsh":    { gender: "female", age: "young", accent: "en-GB", mood: "calm" },
    "teodric-hale":  { gender: "male",   age: "old",   accent: "en-GB", pitch: 0.92, mood: "dry" },
    "ilsabet-corrow":{ gender: "female", age: "adult", accent: "en-GB", pitch: 0.95, mood: "dry" },
    tyriel:          { gender: "female", age: "old",   accent: "en-GB", pitch: 1.05, rate: 0.9, mood: "calm" },
    "hagra-stonebrow": { gender: "female", age: "adult", accent: "en-GB", pitch: 0.85, mood: "stern" },
    urzag:           { gender: "male",   age: "adult", accent: "en-US", pitch: 0.7, rate: 0.9, mood: "stern" },
    "hask-morrow":   { gender: "male",   age: "adult", accent: "en-GB", pitch: 0.9, mood: "dry" },
    "aldric-vane":   { gender: "male",   age: "adult", accent: "en-GB", pitch: 0.9, mood: "stern" },
    "nyx-thornbriar":{ gender: "female", age: "adult", accent: "en-GB", pitch: 1.0, mood: "dry" },
    pip:             { gender: "female", age: "child", accent: "en-GB", rate: 0.92, mood: "calm" },
    "dagny-holt":    { gender: "female", age: "adult", accent: "en-GB", pitch: 0.95, rate: 1.08, mood: "warm" },
    // Minor speakers (not listed on the Characters page)
    toman:              { gender: "male",   age: "young", accent: "en-GB", mood: "shaken" },
    collum:             { gender: "male",   age: "old",   accent: "en-US", pitch: 0.85, mood: "stern" },
    "young-dawnwarden": { gender: "male",   age: "young", accent: "en-GB", mood: "shaken" },
    "student":          { gender: "female", age: "young", accent: "en-US", mood: "calm" },
    "queen":            { gender: "female", age: "adult", accent: "en-GB", mood: "stern" },
  };
  CHARACTERS.forEach((c) => { if (VOICES[c.id]) c.voice = VOICES[c.id]; });
  window.VOICE_PROFILES = Object.assign(window.VOICE_PROFILES || {}, VOICES);
  window.VOICE_NAMES = Object.assign(window.VOICE_NAMES || {},
    Object.fromEntries(CHARACTERS.map((c) => [c.id, c.name])),
    { "young-dawnwarden": "A young Dawnwarden", student: "A second-year student", queen: "The queen",
      toman: "Sir Toman", collum: "Collum the trapper" });

  const GROUPS = ["Solmere", "The Collegium of Halvenreach", "Greywatch", "Beyond the Hearthlands", "The Gods"];
  const SERIES = "the-day-the-gods-went-silent";
  const art = (c) => (c.image ? `<img src="${c.image}" alt="${c.name}" class="portrait">` : c.portrait());
  const appears = (ref) => { const [b, ch] = ref.split("."); return { b, ch, text: `Book ${b}, Chapter ${ch}` }; };

  function renderList(container) {
    container.innerHTML = `
      <header class="page-header">
        <h1>Characters</h1>
        <p class="subtitle">Everyone you've met so far. No spoilers, only what you learn when they first appear.</p>
      </header>
      ${GROUPS.map((g) => {
        const list = CHARACTERS.filter((c) => c.group === g);
        if (!list.length) return "";
        return `<h2 class="char-group">${g}</h2>
          <div class="char-grid">
            ${list.map((c) => `
              <a class="char-card" href="#/s/${SERIES}/characters/${c.id}">
                <div class="char-thumb">${art(c)}</div>
                <div class="char-card-text"><strong>${c.name}</strong><span>${c.epithet}</span></div>
              </a>`).join("")}
          </div>`;
      }).join("")}`;
  }

  function renderOne(container, c) {
    const a = appears(c.firstAppears);
    const i = CHARACTERS.indexOf(c);
    const prev = CHARACTERS[i - 1], next = CHARACTERS[i + 1];
    container.innerHTML = `
      <a class="crumb" href="#/s/${SERIES}/characters">← All characters</a>
      <article class="char-detail">
        <div class="char-portrait">${art(c)}</div>
        <div class="char-info">
          <span class="book-genre">${c.group}</span>
          <h1>${c.name}</h1>
          <p class="char-epithet">${c.epithet}</p>
          <dl class="char-facts">
            ${Object.entries(c.facts).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}
            <dt>First appears</dt><dd><a href="#/s/${SERIES}/book/${a.b}/chapter/${a.ch}">${a.text}</a></dd>
          </dl>
          <p class="char-desc">${c.description}</p>
        </div>
      </article>
      <nav class="chapter-pager">
        ${prev ? `<a href="#/s/${SERIES}/characters/${prev.id}">← ${prev.name}</a>` : "<span></span>"}
        ${next ? `<a href="#/s/${SERIES}/characters/${next.id}">${next.name} →</a>` : "<span></span>"}
      </nav>`;
  }

  function render(container, series, rest = []) {
    const c = rest[0] && CHARACTERS.find((x) => x.id === rest[0]);
    if (c) { document.title = `${c.name} · Characters · ${series.title}`; renderOne(container, c); }
    else renderList(container);
  }

  window.EXTRAS = window.EXTRAS || {};
  window.EXTRAS[SERIES] = Object.assign(window.EXTRAS[SERIES] || {}, { characters: render });
  window.CHARACTERS = CHARACTERS;
})();
