// The Vaelic glyph lexicon. Each glyph is drawn as stroked SVG paths in a
// 100 x 100 box centred on (0, 0), so it can be scaled and placed anywhere.
window.VAELIC = (function () {
  const circle = (r, cx = 0, cy = 0) =>
    `M${cx - r},${cy} A${r},${r} 0 1,0 ${cx + r},${cy} A${r},${r} 0 1,0 ${cx - r},${cy}`;

  const glyphs = [
    // ── Sources: what the spell is made of ──
    { word: "Ignar", meaning: "Fire", category: "Source", color: "#ff7a2f",
      note: "Heat, flame and combustion. The most commonly inherited Source.",
      paths: ["M0,-40 C22,-15 26,10 0,40 C-26,10 -22,-15 0,-40 Z", "M0,-4 C9,8 9,20 0,28 C-9,20 -9,8 0,-4"] },
    { word: "Vaesh", meaning: "Water", category: "Source", color: "#3fa7ff",
      note: "Water, tide and cold. Flows best through curved conduits.",
      paths: ["M-38,-15 Q-25,-28 -12,-15 T14,-15 T38,-15", "M-38,2 Q-25,-11 -12,2 T14,2 T38,2", "M-38,19 Q-25,6 -12,19 T14,19 T38,19"] },
    { word: "Tol", meaning: "Stone", category: "Source", color: "#b49a74",
      note: "Earth, stone and weight. Slow to move, very hard to break.",
      paths: ["M-30,-30 H30 V30 H-30 Z", "M-30,0 H30", "M0,0 V30", "M-15,-30 V0"] },
    { word: "Sil", meaning: "Wind", category: "Source", color: "#b6f0e4",
      note: "Air, breath and pressure. Light and fast, holds little force.",
      paths: ["M0,0 m-5,0 a5,5 0 1,1 10,0 a12,12 0 1,1 -24,0 a20,20 0 1,1 40,0 a28,28 0 1,1 -56,0"] },
    { word: "Ithra", meaning: "Light", category: "Source", color: "#ffe680",
      note: "Light and clarity. Illumination, revealing and blinding.",
      paths: [circle(11), "M0,-22 V-40", "M0,22 V40", "M-22,0 H-40", "M22,0 H40",
        "M15,-15 L28,-28", "M-15,-15 L-28,-28", "M15,15 L28,28", "M-15,15 L-28,28"] },
    { word: "Mor", meaning: "Shadow", category: "Source", color: "#9a7bd8",
      note: "Darkness, concealment and absence. Distrusted by the temples.",
      paths: ["M10,-36 A36,36 0 1,0 10,36 A26,36 0 1,1 10,-36 Z"] },
    { word: "Ael", meaning: "Life", category: "Source", color: "#6fdc7a",
      note: "Living energy. The root of all healing and growth spells.",
      paths: ["M0,40 V-8", "M0,-8 C-24,-18 -24,-40 0,-40 C24,-40 24,-18 0,-8", "M0,18 C-12,10 -28,14 -32,4", "M0,18 C12,10 28,14 32,4"] },
    { word: "Kesh", meaning: "Force", category: "Source", color: "#e8e8f0",
      note: "Raw kinetic force with no element. Shields, blades, pushes.",
      paths: ["M-30,8 L0,-24 L30,8", "M-30,32 L0,0 L30,32"] },

    // ── Shapes: what form it takes ──
    { word: "Dun", meaning: "Line / bolt", category: "Shape",
      note: "A straight path from caster to target.",
      paths: ["M-38,0 H38", "M-38,-12 V12", "M38,-12 V12", "M-12,-7 V7", "M12,-7 V7"] },
    { word: "Ora", meaning: "Sphere", category: "Shape",
      note: "A contained ball. The Shape of the Common Fireball.",
      paths: [circle(28), circle(5)] },
    { word: "Vell", meaning: "Wall", category: "Shape",
      note: "A flat barrier. Anchors well to inscribed surfaces.",
      paths: ["M-36,-30 H36", "M-30,-30 V32", "M-10,-30 V32", "M10,-30 V32", "M30,-30 V32"] },
    { word: "Tash", meaning: "Blade / edge", category: "Shape",
      note: "A thin cutting edge. Loves acute angles.",
      paths: ["M-34,30 L28,-32 L34,-26 L-28,34 Z", "M-30,8 L-8,30"] },
    { word: "Rinn", meaning: "Ring / surround", category: "Shape",
      note: "Encircles the caster or a target. Wards and cages.",
      paths: ["M-25,-25 A35,35 0 1,0 25,-25", "M0,-42 V-22", "M-8,-30 H8"] },

    // ── Commands: what it does ──
    { word: "Sae", meaning: "Go / launch", category: "Command",
      note: "Projects the spell away from the caster. Wants clockwise flow.",
      paths: ["M-36,0 H30", "M14,-16 L34,0 L14,16"] },
    { word: "Keth", meaning: "Hold / bind", category: "Command",
      note: "Keeps the spell in place. Wants counter-clockwise flow.",
      paths: ["M-6,-26 A16,16 0 1,0 -6,6 V30", "M6,26 A16,16 0 1,0 6,-6 V-30"] },
    { word: "Ruun", meaning: "Grow / amplify", category: "Command",
      note: "The spell strengthens the longer it is fed.",
      paths: ["M-38,26 H38", "M-10,26 A10,10 0 0,1 10,26", "M-22,26 A22,22 0 0,1 22,26", "M-34,26 A34,34 0 0,1 34,26"] },
    { word: "Nai", meaning: "Stop / negate", category: "Command",
      note: "Unmakes or halts. The basis of counter-spells.",
      paths: [circle(30), "M-21,21 L21,-21"] },
    { word: "Lo", meaning: "Mend", category: "Command",
      note: "Restores what was broken. Fails through sharp angles.",
      paths: ["M-36,0 C-20,-26 20,-26 36,0", "M-36,0 C-20,26 20,26 36,0", "M-12,-19 V19", "M12,-19 V19"] },

    // ── Modifiers: outer-ring refinements ──
    { word: "Ardh", meaning: "Heat", category: "Modifier",
      note: "Raises temperature. Enough of it turns fire white-blue.",
      paths: ["M0,-36 L32,26 H-32 Z", "M-15,10 Q-7,0 0,10 T15,10"] },
    { word: "Esk", meaning: "Duration", category: "Modifier",
      note: "Makes an effect linger after it lands.",
      paths: ["M-22,-32 H22 L-22,32 H22 Z"] },
    { word: "Quel", meaning: "Speed", category: "Modifier",
      note: "Hastens a spell's travel. Pairs with narrowing conduits.",
      paths: ["M-36,-12 H4", "M-36,12 H4", "M4,-28 L34,0 L4,28"] },
    { word: "Brann", meaning: "Size", category: "Modifier",
      note: "Enlarges the effect. Slows it in proportion.",
      paths: ["M-14,-14 H14 V14 H-14 Z", "M-36,-36 L-21,-21", "M36,-36 L21,-21", "M36,36 L21,21", "M-36,36 L-21,21"] },
    { word: "Lisse", meaning: "Refinement", category: "Modifier",
      note: "Smooths the flow and cuts waste. A spellcrafter's favourite.",
      paths: ["M-36,0 Q0,-30 36,0 Q0,30 -36,0", "M-36,0 H36"] },
    { word: "Shai", meaning: "Hue", category: "Modifier",
      note: "Shifts the colour of the effect. Cosmetic, or a disguise.",
      paths: [circle(14, -12, -8), circle(14, 12, -8), circle(14, 0, 13)] },
    { word: "Teyr", meaning: "Split", category: "Modifier",
      note: "Divides the spell mid-flight into several smaller copies.",
      paths: ["M0,36 V0", "M0,0 L-28,-30", "M0,0 L28,-30", "M0,0 V-38"] },
    { word: "Wyn", meaning: "Wait / delay", category: "Modifier",
      note: "Holds the spell until a trigger is met.",
      paths: ["M-30,24 C-30,-32 30,-32 30,0 C30,24 0,24 0,0 C0,-10 12,-10 12,0"] },
    { word: "Hesh", meaning: "Silence", category: "Modifier",
      note: "Removes sound, and with more glyphs, light.",
      paths: ["M-32,-12 H32", "M-32,12 H32", circle(5, 0, -26), circle(5, 0, 26)] },

    // ── Seal and anchors ──
    { word: "Vos", meaning: "Seal", category: "Seal",
      note: "Closes the circle. Without it the spell is wild and unstable.",
      paths: [circle(32), circle(20), "M0,-32 V-20", "M0,32 V20", "M-32,0 H-20", "M32,0 H20"] },
    { word: "Thalen", meaning: "Name-glyph of the Warden", category: "Anchor", color: "#7fc8ff",
      note: "A god's name placed where a Source would sit. The god powers the circle. Dark since the Silence.",
      paths: ["M0,-38 L30,-26 V4 C30,22 14,34 0,40 C-14,34 -30,22 -30,4 V-26 Z", "M0,-24 V26", "M-16,-6 H16"] },
  ];

  const byWord = Object.fromEntries(glyphs.map((g) => [g.word, g]));

  // Render a glyph as an SVG <g> string at (x, y) with a given scale.
  function glyphSVG(word, x = 0, y = 0, scale = 1, stroke = "currentColor", width = 4) {
    const g = byWord[word];
    if (!g) return "";
    return `<g transform="translate(${x},${y}) scale(${scale})" fill="none" stroke="${stroke}"
              stroke-width="${width / scale}" stroke-linecap="round" stroke-linejoin="round">
              ${g.paths.map((d) => `<path d="${d}"/>`).join("")}
            </g>`;
  }

  return { glyphs, byWord, glyphSVG,
    categories: ["Source", "Shape", "Command", "Modifier", "Seal", "Anchor"] };
})();
