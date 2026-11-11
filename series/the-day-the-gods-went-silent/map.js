// Interactive world map of Caelmar.
(function () {
  const W = 1000, H = 720;

  // Deterministic pseudo-random so the map draws the same every time.
  function rng(seed) {
    return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  }

  const LOCATIONS = [
    { id: "solmere", name: "Solmere", kind: "city", x: 470, y: 360,
      region: "The Hearthlands",
      text: "The white capital of the Hearthlands, home of the Sunspire. Every morning the eleven Dawnwardens caught Aurem's first light here, until the morning nothing answered.",
      chapters: ["1.1"] },
    { id: "sunspire", name: "The Sunspire", kind: "landmark", x: 488, y: 340, hidden: true,
      text: "A hundred steps to the top." },
    { id: "halvenreach", name: "Halvenreach", kind: "city", x: 520, y: 500,
      region: "The Hearthlands",
      text: "A river-city three days' ride south of Solmere. The Collegium of Halvenreach stands on an island in the current, its walls carved with glyphs that glow faint blue at night. Students learn to find their well before they learn a single spell.",
      chapters: ["1.1"] },
    { id: "thornwall", name: "The Thornwall", kind: "wall", x: 520, y: 132,
      region: "The northern edge of the known world",
      text: "A hundred and forty miles of black stone carved with circles too old for any living mage to read, with Thalen's name-glyph at the heart of every mile. It held back the Wildlands for a thousand years. Its glow went out, mile by mile, east to west, on the morning of the Silence.",
      chapters: ["1.1"] },
    { id: "greywatch", name: "Greywatch", kind: "city", x: 395, y: 178,
      region: "At the foot of the Thornwall",
      text: "A frontier fort-town a quarter mile behind the Thornwall, at the northern end of the Pale Road: a stone keep, a timber palisade, a chapel to Aurem and about three hundred people who have all been somewhere better. Built, as the saying goes, to be left.",
      chapters: ["1.2"] },
    { id: "lantern-house", name: "The Lantern House", kind: "landmark", x: 372, y: 238,
      region: "The Pale Road",
      text: "An abandoned coaching inn three hours' walk south of Greywatch on the Pale Road, four broken stone walls around a courtyard, ringed by six old wardstones.",
      chapters: ["1.2"] },
    { id: "fort-harrow", name: "Fort Harrow", kind: "city", x: 392, y: 296,
      region: "The Pale Road",
      text: "A long, squat fortress of gray stone built four hundred years ago astride the river Grey on seven great arches: the only bridge for forty miles. Whoever holds it holds the road south. Its Lord-Commander once held it for nine days against a Steppe army.",
      chapters: ["1.2", "1.6", "1.7", "1.8", "1.9"] },
    { id: "thornwall-towns", name: "The Thornwall Towns", kind: "region", x: 560, y: 165,
      region: "Along the Thornwall, east and west of Greywatch",
      text: "Coldwater, Rook's Ford, Thane's Cross, Oldmere: small frontier settlements strung along the foot of the wall for fifty miles either side of Greywatch. On the night of the Silence, the skirls came over the wall without warning.",
      chapters: ["1.6"] },
    { id: "kingsway", name: "The Kingsway", kind: "landmark", x: 640, y: 300,
      region: "Solmere to the eastern wall towns",
      text: "The great royal road out of Solmere, curving east and then north toward the eastern settlements along the Thornwall. Crown Prince Rhoan and the royal army rode out along it on the second day of the Silence.",
      chapters: ["1.4", "1.6"] },
    { id: "kharn-ostra", name: "Kharn-Ostra", kind: "city", x: 700, y: 330,
      region: "Under the Kharn Mountains",
      text: "The great dwarven hold under the Kharn, home of the Stonebrow and Ironmantle forge-halls. Beneath its oldest halls lie the Root Halls, abandoned a thousand years ago, whose walls are carved with the oldest writing in the world.",
      chapters: ["1.7"] },
    { id: "the-anvil", name: "The Anvil", kind: "landmark", x: 880, y: 600,
      region: "The eastern Ashen Steppe",
      text: "A long, low hill on the eastern Steppe where the Red Hand has held its gatherings for generations. In the first days of the Silence, the Red Fire burned there, and Karrog gave his blessing to anyone who reached into it.",
      chapters: ["1.8"] },
    { id: "gorse-end", name: "Gorse End", kind: "landmark", x: 640, y: 520,
      region: "The Hearthlands' Steppe border",
      text: "A hamlet in a fold of the border hills: six farmhouses, a mill on a stream and a shrine to Lyssa.",
      chapters: ["1.8"] },
    { id: "wildlands", name: "The Wildlands", kind: "region", x: 470, y: 60,
      text: "Whatever lies beyond the Thornwall. No maps survive of it, only stories.",
      chapters: ["1.1"] },
    { id: "basins", name: "The Empty Basins", kind: "scar", x: 790, y: 70,
      region: "The far north, beyond the Thornwall",
      text: "Great hollows where the elves say cities once stood, before the gods made war directly upon the world. Even Ione's memory of them has grown faint.",
      chapters: ["1.1"] },
    { id: "ithrel", name: "Ithrel", kind: "region", x: 175, y: 330,
      region: "West of the Hearthlands",
      text: "A thousand miles of forested hills. The elves live beneath its canopy in cities grown rather than built. Ione the Remembering is their goddess, and their memory-keepers can touch a stone and see the hands that shaped it.",
      chapters: ["1.1"] },
    { id: "kharn", name: "The Kharn Mountains", kind: "region", x: 735, y: 255,
      region: "East and north",
      text: "Broken teeth along the north and east of the Hearthlands, and home of the dwarves. Their western foothills stand between Solmere and the Thornwall, and the Pale Road winds through them. Few dwarves are blessed and fewer are mages, but their forge-masters carve rune-circles into steel. They call it craft, not magic.",
      chapters: ["1.1"] },
    { id: "steppe", name: "The Ashen Steppe", kind: "region", x: 805, y: 560,
      region: "South of the mountains",
      text: "Endless grassland gone gray with the ash of old wars. The orc clans ride here, and many bend the knee to Karrog the Red Hand. Every few decades a warlord rises and rides north.",
      chapters: ["1.1"] },
    { id: "bleeding", name: "The Bleeding Hills", kind: "scar", x: 655, y: 455,
      region: "A scar of the gods' war",
      text: "Red earth that stains the rivers rust-colored for a hundred miles downstream. A wound left from when the two courts fought directly upon the world.",
      chapters: ["1.1"] },
    { id: "shattered", name: "The Shattered Coast", kind: "scar", x: 150, y: 600,
      region: "A scar of the gods' war",
      text: "Where the sea still steams over a cracked and glassy shore.",
      chapters: ["1.1"] },
    { id: "marsh", name: "The Marsh-Warrens", kind: "region", x: 360, y: 610,
      region: "South of the Hearthlands",
      text: "Deep, wet country where the goblins dig their warrens.",
      chapters: ["1.1"] },
    { id: "valleys", name: "The River Valleys", kind: "region", x: 590, y: 600,
      region: "Along the Halven",
      text: "Gentle farmland along the lower river, home of the halflings.",
      chapters: ["1.1"] },
    { id: "desert", name: "The Southern Deserts", kind: "region", x: 560, y: 695,
      region: "Off the southern edge of the map",
      text: "The wandering scaled folk travel the dunes beyond the river valleys.",
      chapters: ["1.1"] },
  ];

  function coastline() {
    // Main continent outline (sea to the west and south-west).
    return "M250,0 L1000,0 L1000,720 L430,720 C400,690 330,680 300,650 C260,620 230,650 180,640 " +
      "C130,630 90,600 70,560 C50,520 60,470 40,430 C20,390 30,330 50,290 C70,250 60,200 90,160 " +
      "C120,120 170,110 200,70 C220,40 230,20 250,0 Z";
  }

  function forest(r) {
    let s = "";
    for (let i = 0; i < 170; i++) {
      const x = 90 + r() * 240, y = 170 + r() * 330;
      if ((x - 200) ** 2 / 130 ** 2 + (y - 335) ** 2 / 175 ** 2 > 1) continue;
      const rr = 6 + r() * 6;
      s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(1)}"/>`;
    }
    return s;
  }

  function mountains(r) {
    // A ridge that arcs from north of Solmere east and down toward the Steppe.
    let s = "";
    for (let i = 0; i < 46; i++) {
      const t = i / 45;
      const x = 560 + t * 300 + (r() - 0.5) * 50;
      const y = 200 + Math.sin(t * Math.PI * 0.9) * 40 + t * 190 + (r() - 0.5) * 50;
      const w = 14 + r() * 14, h = 18 + r() * 22;
      s += `<path d="M${(x - w).toFixed(1)},${y.toFixed(1)} L${x.toFixed(1)},${(y - h).toFixed(1)} L${(x + w).toFixed(1)},${y.toFixed(1)}"/>`;
      s += `<path class="snow" d="M${(x - w * 0.3).toFixed(1)},${(y - h * 0.7).toFixed(1)} L${x.toFixed(1)},${(y - h).toFixed(1)} L${(x + w * 0.3).toFixed(1)},${(y - h * 0.7).toFixed(1)}"/>`;
    }
    return s;
  }

  // The western foothills of the Kharn, between Solmere and the Thornwall.
  function foothills(r) {
    let s = "";
    for (let i = 0; i < 26; i++) {
      const x = 410 + r() * 150, y = 205 + r() * 70;
      const w = 9 + r() * 8, h = 10 + r() * 12;
      s += `<path d="M${(x - w).toFixed(1)},${y.toFixed(1)} L${x.toFixed(1)},${(y - h).toFixed(1)} L${(x + w).toFixed(1)},${y.toFixed(1)}"/>`;
    }
    return s;
  }

  function steppe(r) {
    let s = "";
    for (let i = 0; i < 90; i++) {
      const x = 690 + r() * 290, y = 470 + r() * 200;
      s += `<path d="M${x.toFixed(1)},${y.toFixed(1)} l3,-7 l3,7"/>`;
    }
    return s;
  }

  function marsh(r) {
    let s = "";
    for (let i = 0; i < 40; i++) {
      const x = 300 + r() * 130, y = 580 + r() * 60;
      s += `<path d="M${x.toFixed(1)},${y.toFixed(1)} h12 M${(x + 3).toFixed(1)},${(y + 5).toFixed(1)} h8"/>`;
    }
    return s;
  }

  function dunes(r) {
    let s = "";
    for (let i = 0; i < 18; i++) {
      const x = 450 + r() * 260, y = 670 + r() * 40;
      s += `<path d="M${x.toFixed(1)},${y.toFixed(1)} q10,-8 20,0"/>`;
    }
    return s;
  }

  function wildlands(r) {
    let s = "";
    for (let i = 0; i < 70; i++) {
      const x = 260 + r() * 720, y = 15 + r() * 95;
      s += `<path d="M${x.toFixed(1)},${y.toFixed(1)} l4,-10 l4,10 M${(x + 4).toFixed(1)},${(y - 3).toFixed(1)} v6"/>`;
    }
    return s;
  }

  function buildSVG() {
    const r = rng(42);
    const markers = LOCATIONS.filter((l) => !l.hidden)
      .map((l) => {
        const icon =
          l.kind === "city"
            ? `<circle r="7" class="city-dot"/><circle r="12" class="city-ring"/>`
            : l.kind === "scar"
            ? `<path d="M-7,-7 L7,7 M7,-7 L-7,7" class="scar-x"/>`
            : l.kind === "landmark"
            ? `<rect x="-5" y="-5" width="10" height="10" class="landmark-dot"/>`
            : l.kind === "wall"
            ? `<rect x="-6" y="-6" width="12" height="12" class="wall-dot" transform="rotate(45)"/>`
            : `<circle r="5" class="region-dot"/>`;
        const labelY = l.kind === "city" ? 26 : 22;
        return `
          <g class="marker marker-${l.kind}" data-id="${l.id}" transform="translate(${l.x},${l.y})" tabindex="0" role="button" aria-label="${l.name}">
            <circle r="22" class="hit"/>
            ${icon}
            <text y="${labelY}" class="label">${l.name}</text>
          </g>`;
      })
      .join("");

    return `
    <svg viewBox="0 0 ${W} ${H}" class="world-map" role="img" aria-label="Map of Caelmar">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <pattern id="waves" width="40" height="20" patternUnits="userSpaceOnUse">
          <path d="M0,10 q10,-6 20,0 t20,0" fill="none" stroke="#7e9aa6" stroke-width="1" opacity=".35"/>
        </pattern>
      </defs>
      <rect width="${W}" height="${H}" class="sea"/>
      <rect width="${W}" height="${H}" fill="url(#waves)"/>
      <path d="${coastline()}" class="land"/>
      <path d="M250,0 L1000,0 L1000,135 C800,150 600,120 300,140 C280,100 260,40 250,0 Z" class="wild-tint"/>
      <g class="wild-trees">${wildlands(r)}</g>
      <g class="forest">${forest(r)}</g>
      <g class="mountains">${mountains(r)}</g>
      <g class="mountains foothills">${foothills(r)}</g>
      <g class="steppe-marks">${steppe(r)}</g>
      <g class="marsh-marks">${marsh(r)}</g>
      <g class="dune-marks">${dunes(r)}</g>
      <ellipse cx="655" cy="455" rx="55" ry="30" class="bleeding"/>
      <path d="M90,560 L120,590 L100,610 L150,630 L130,650 M180,600 L160,630" class="shatter"/>
      <path d="M640,250 C600,300 560,330 540,380 C525,420 535,460 520,500 C505,545 560,580 590,620 C610,650 600,690 610,720" class="river"/>
      <path d="M655,455 C620,470 590,480 560,470" class="river rust"/>
      <path d="M470,360 C540,350 600,330 640,300 C690,262 740,200 800,150" class="road"/>
      <path d="M300,300 C340,290 370,300 392,296 C420,291 450,300 480,318" class="river small"/>
      <path d="M395,148 L395,178 C388,200 375,220 372,238 C370,260 385,280 392,296 C400,320 440,340 470,360" class="road"/>
      <path d="M300,142 C400,118 520,148 620,124 C720,104 820,138 960,118" class="thornwall-base"/>
      <path d="M300,142 C400,118 520,148 620,124 C720,104 820,138 960,118" class="thornwall-glow" filter="url(#glow)"/>
      <text x="400" y="440" class="region-label">THE HEARTHLANDS</text>
      <text x="30" y="700" class="sea-label">The Western Sea</text>
      <g class="compass" transform="translate(920,640)">
        <circle r="30"/><path d="M0,-38 L7,0 L0,38 L-7,0 Z"/><text y="-44">N</text>
      </g>
      ${markers}
    </svg>`;
  }

  function render(container) {
    container.innerHTML = `
      <header class="page-header">
        <h1>The World of Caelmar</h1>
        <p class="subtitle">Select a place to read about it.</p>
      </header>
      <div class="map-controls">
        <button class="toggle-silence" aria-pressed="false">Show after the Silence</button>
      </div>
      <div class="map-layout">
        <div class="map-frame">${buildSVG()}</div>
        <aside class="map-panel">
          <p class="muted">Pick a city, region or landmark on the map.</p>
        </aside>
      </div>`;

    const panel = container.querySelector(".map-panel");
    const svg = container.querySelector("svg");

    function select(id) {
      const loc = LOCATIONS.find((l) => l.id === id);
      svg.querySelectorAll(".marker").forEach((m) => m.classList.toggle("selected", m.dataset.id === id));
      panel.innerHTML = `
        <h2>${loc.name}</h2>
        ${loc.region ? `<p class="panel-region">${loc.region}</p>` : ""}
        <p>${loc.text}</p>
        ${loc.chapters ? `<p class="panel-chapters">Appears in: ${loc.chapters
          .map((ref) => { const [b, c] = ref.split(".");
            return `<a href="#/s/the-day-the-gods-went-silent/book/${b}/chapter/${c}">Book ${b}, Chapter ${c}</a>`; })
          .join(", ")}</p>` : ""}`;
    }

    svg.querySelectorAll(".marker").forEach((m) => {
      m.addEventListener("click", () => select(m.dataset.id));
      m.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(m.dataset.id); }
      });
    });

    const btn = container.querySelector(".toggle-silence");
    btn.addEventListener("click", () => {
      const on = svg.classList.toggle("after-silence");
      btn.setAttribute("aria-pressed", on);
      btn.textContent = on ? "Show before the Silence" : "Show after the Silence";
    });
  }

  window.EXTRAS = window.EXTRAS || {};
  window.EXTRAS["the-day-the-gods-went-silent"] = Object.assign(
    window.EXTRAS["the-day-the-gods-went-silent"] || {}, { map: render });
})();
