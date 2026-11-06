// The Spellcrafter's Codex: how Vaelic circles are built, plus an interactive workshop.
(function () {
  const V = window.VAELIC;
  const SOURCE_COLOR = Object.fromEntries(V.glyphs.filter((g) => g.color).map((g) => [g.word, g.color]));

  // ───────────────────────── geometry helpers ─────────────────────────
  const polar = (r, deg) => [r * Math.cos((deg * Math.PI) / 180), r * Math.sin((deg * Math.PI) / 180)];
  const f = (n) => n.toFixed(1);

  // Returns a sampler t∈[0,1] → point, plus an SVG path for the conduit between A and B.
  function conduitGeometry(A, B, style, angle, bendSign) {
    const [ax, ay] = A, [bx, by] = B;
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1;
    const px = -dy / L, py = dx / L; // unit perpendicular
    const mx = (ax + bx) / 2, my = (ay + by) / 2;
    if (style === "curved") {
      const h = 0.28 * L * bendSign;
      const cx = mx + px * h, cy = my + py * h;
      return {
        d: `M${f(ax)},${f(ay)} Q${f(cx)},${f(cy)} ${f(bx)},${f(by)}`,
        at: (t) => [
          (1 - t) ** 2 * ax + 2 * (1 - t) * t * cx + t * t * bx,
          (1 - t) ** 2 * ay + 2 * (1 - t) * t * cy + t * t * by,
        ],
      };
    }
    // Angled: bends whose interior angle is roughly `angle` degrees. Sharp angles
    // become a zigzag of several smaller teeth so the line stays inside the circle.
    const theta = Math.max(8, Math.min(176, angle));
    const ratio = 1 / (2 * Math.tan((theta * Math.PI) / 360)); // bend height per unit tooth length
    const teeth = Math.max(1, Math.ceil(ratio / 0.3));
    const s = L / teeth, h = s * ratio;
    const pts = [[ax, ay]];
    for (let i = 0; i < teeth; i++) {
      const t = (i + 0.5) / teeth, sign = (i % 2 ? -1 : 1) * bendSign;
      pts.push([ax + dx * t + px * h * sign, ay + dy * t + py * h * sign]);
    }
    pts.push([bx, by]);
    const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
    const total = segs.reduce((a, b) => a + b, 0);
    return {
      d: "M" + pts.map((p) => `${f(p[0])},${f(p[1])}`).join(" L"),
      at: (t) => {
        let d = t * total;
        for (let i = 0; i < segs.length; i++) {
          if (d <= segs[i] || i === segs.length - 1) {
            const u = Math.min(1, d / segs[i]);
            return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u];
          }
          d -= segs[i];
        }
      },
    };
  }

  // Draws a conduit, tapering it by drawing short segments of varying width.
  function conduitSVG(A, B, o) {
    const g = conduitGeometry(A, B, o.style, o.angle, o.bendSign || 1);
    const base = o.width;
    let body = "";
    if (o.taper === "none") {
      body = `<path d="${g.d}" class="conduit" stroke-width="${f(base)}"/>`;
    } else {
      const N = 14;
      for (let i = 0; i < N; i++) {
        const t0 = i / N, t1 = (i + 1) / N;
        const k = o.taper === "narrow" ? 1.7 - 1.3 * ((t0 + t1) / 2) : 0.4 + 1.3 * ((t0 + t1) / 2);
        const [x0, y0] = g.at(t0), [x1, y1] = g.at(t1);
        body += `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" class="conduit" stroke-width="${f(base * k)}"/>`;
      }
    }
    const flow = o.animate === false ? "" :
      `<path d="${g.d}" class="flow ${o.reverse ? "reverse" : ""}" stroke-width="${f(Math.max(1, base * 0.35))}"/>`;
    return body + flow;
  }

  // ───────────────────────── circle renderer ─────────────────────────
  function circleSVG(cfg, opts = {}) {
    const color = SOURCE_COLOR[cfg.source] || "#e8e8f0";
    const mods = cfg.mods || [];
    const hasRing3 = mods.length > 0 && !cfg.weave;
    const R1 = 92, R2 = 152, R3 = 208;
    const RS = (hasRing3 ? R3 : R2) + 46;
    const pad = 24, vb = RS + pad;
    const width = 1 + (cfg.thickness - 1) * 0.9;
    const reverse = cfg.flow === "ccw";
    const bend = reverse ? -1 : 1;
    const co = { style: cfg.conduit, angle: cfg.angle, taper: cfg.taper, width, reverse, bendSign: bend,
      animate: opts.animate !== false };

    const a1 = [-90, 30, 150], a2 = [-30, 90, 210];
    const p1 = a1.map((a) => polar(R1, a));
    const p2 = a2.map((a) => polar(R2, a));
    const modList = mods.length ? [0, 1, 2].map((i) => mods[i % mods.length]) : [];
    // Woven modifiers sit between the commands on ring 2; otherwise on their own ring 3.
    const pm = modList.length ? a1.map((a) => polar(hasRing3 ? R3 : R2, a)) : [];

    let conduits = "";
    // Source → each Shape glyph
    p1.forEach((p) => (conduits += conduitSVG([0, 0], p, co)));
    // Shape → the two neighbouring Commands
    p1.forEach((p, i) => {
      conduits += conduitSVG(p, p2[i], co);
      conduits += conduitSVG(p, p2[(i + 2) % 3], co);
    });
    // Commands → modifiers (if any) → Seal
    if (pm.length) {
      pm.forEach((p, i) => {
        conduits += conduitSVG(p2[i], p, co);
        conduits += conduitSVG(p2[(i + 2) % 3], p, co);
        conduits += conduitSVG(p, polar(RS, a1[i]), co);
      });
    }
    p2.forEach((p, i) => (conduits += conduitSVG(p, polar(RS, a2[i]), co)));

    const guides = [R1, R2, hasRing3 ? R3 : null]
      .filter(Boolean)
      .map((r) => `<circle r="${r}" class="ring-guide"/>`)
      .join("");

    const glyphStroke = "#f3ead8";
    const srcScale = 0.5 * cfg.sourceSize;
    const modScale = 0.3 * (cfg.modSize || 1);
    let glyphs = `<circle r="${f(44 * cfg.sourceSize)}" class="glyph-bg"/>` +
      V.glyphSVG(cfg.source, 0, 0, srcScale, color, 3.2);
    p1.forEach(([x, y]) => (glyphs += `<circle cx="${f(x)}" cy="${f(y)}" r="22" class="glyph-bg"/>` + V.glyphSVG(cfg.shape, x, y, 0.32, glyphStroke, 2.4)));
    p2.forEach(([x, y]) => (glyphs += `<circle cx="${f(x)}" cy="${f(y)}" r="22" class="glyph-bg"/>` + V.glyphSVG(cfg.command, x, y, 0.32, glyphStroke, 2.4)));
    pm.forEach(([x, y], i) => (glyphs += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(26 * (cfg.modSize || 1))}" class="glyph-bg"/>` + V.glyphSVG(modList[i], x, y, modScale, "#ffd38a", 2.4)));

    let seal;
    if (cfg.sealed) {
      seal = `<circle r="${RS}" class="seal-rim" stroke="${color}"/>` +
        [45, 135, 225, 315].map((a) => { const [x, y] = polar(RS, a); return `<circle cx="${f(x)}" cy="${f(y)}" r="16" class="glyph-bg"/>` + V.glyphSVG("Vos", x, y, 0.36, color, 2.2); }).join("");
    } else {
      const C = 2 * Math.PI * RS;
      seal = `<circle r="${RS}" class="seal-rim unsealed" stroke-dasharray="${f(C * 0.09)} ${f(C * 0.035)}"/>`;
    }

    const s = opts.size || 420;
    return `
      <svg viewBox="${-vb} ${-vb} ${vb * 2} ${vb * 2}" width="${s}" height="${s}" class="spell-circle ${cfg.sealed ? "" : "wild"}" style="--src:${color}">
        <defs><filter id="cglow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
        ${guides}
        <g filter="url(#cglow)">${conduits}</g>
        ${seal}
        ${glyphs}
      </svg>`;
  }

  // ───────────────────────── analysis ─────────────────────────
  function analyze(cfg) {
    const mods = cfg.mods || [];
    const has = (w) => mods.includes(w);
    const rings = 2 + (mods.length && !cfg.weave ? 1 : 0);
    const flowAmt = cfg.thickness / 4;
    const angled = cfg.conduit === "angled";
    const sharp = angled ? (180 - cfg.angle) / 180 : 0; // 0 = straight, ~0.9 = knife bend
    const notes = [];

    let cost = { 1: 0.5, 2: 1, 3: 1.7 }[rings] * flowAmt * (0.6 + 0.4 * cfg.sourceSize);
    cost *= 1 + 0.12 * mods.filter((m) => m !== "Lisse").length;
    cost *= has("Lisse") ? 0.4 : 1;
    cost *= angled ? 1 + 0.35 * sharp : 0.92;
    cost *= has("Brann") ? 1.3 : 1;

    let power = Math.pow(flowAmt, 0.8) * cfg.sourceSize;
    power *= angled ? 1 + 0.6 * sharp : 0.9;
    power *= (has("Ardh") ? 1.6 : 1) * (has("Brann") ? 1.25 : 1) * (cfg.command === "Ruun" ? 1.3 : 1);
    power *= (rings === 3 ? 1.15 : 1) * (cfg.sealed ? 1 : 1.6) * (has("Teyr") ? 0.55 : 1);

    let speed = angled ? 1 + 0.8 * sharp : 0.85;
    speed *= { none: 1, narrow: 1.4, widen: 0.7 }[cfg.taper];
    speed *= (has("Quel") ? 1.8 : 1) * (has("Brann") ? 0.55 : 1);
    speed *= { Tol: 0.7, Sil: 1.3 }[cfg.source] || 1;

    let duration = (angled ? 0.9 : 1.2) * (has("Esk") ? 4 : 1) * (cfg.command === "Keth" ? 2 : 1) * (cfg.taper === "widen" ? 1.2 : 1);

    let stab = 100;
    if (!angled) stab += 5;
    if (angled && cfg.angle < 90) stab -= (90 - cfg.angle) * 0.9;
    if (angled && cfg.angle < 25) { stab -= 25; notes.push("Knife bend: a conduit this sharp is likely to fracture under load. The Collegium forbids anything under about twenty-five degrees."); }
    else if (angled && cfg.angle < 60) notes.push("Acute bends compress the flow into a piercing burst, but every corner strains the line.");
    if (mods.length) {
      const imb = Math.abs(cfg.sourceSize - (cfg.modSize || 1));
      stab -= imb * 25;
      if (imb > 0.5) notes.push("The Source and modifier glyphs are badly mismatched in size. The heavier glyph is pulling the circle off balance.");
    }
    if (cfg.sourceSize > 1.4) { stab -= 10; notes.push("An oversized Source glyph floods the inner ring."); }
    if (cfg.weave && mods.length) {
      stab -= 8 * mods.length;
      notes.push(`Modifiers are woven into the Command ring, so the circle stays ${["", "First", "Second", "Third"][rings]}-Class. Crowding the ring costs some stability.`);
    }
    if (cfg.thickness > 7) { stab -= (cfg.thickness - 7) * 7; notes.push("Very thick conduits push more mana than most wells can hold steady."); }
    if (cfg.thickness < 2) { stab -= (2 - cfg.thickness) * 15; notes.push("Hair-thin conduits risk burning out under even a modest flow."); }
    if (cfg.command === "Sae" && cfg.flow === "ccw") { stab -= 20; notes.push("Sae wants to push outward, but counter-clockwise flow draws inward. The circle is fighting itself."); }
    if (cfg.command === "Keth" && cfg.flow === "cw") { stab -= 20; notes.push("Keth wants to hold, but clockwise flow drives outward. The circle is fighting itself."); }
    if (cfg.command === "Lo" && angled && cfg.angle < 90) { stab -= 15; notes.push("Mending spells resist sharp corners. Life energy does not like to be bent hard."); }
    if (has("Teyr")) stab -= 8;
    if (has("Wyn")) stab -= 5;
    if (!cfg.sealed) { stab -= 45; notes.push("Unsealed. Without Vos the spell is wild. It will hit harder, and it may twist, burst early or turn back on the caster."); }
    if (has("Lisse")) notes.push("Lisse smooths the flow through every conduit. This is the classic spellcrafter's economy.");
    stab = Math.max(0, Math.min(100, stab));

    return { rings, cost, power, speed, duration, stab, notes, description: describe(cfg, speed, stab) };
  }

  function describe(cfg, speed, stab) {
    const mods = cfg.mods || [];
    const has = (w) => mods.includes(w);
    const shape = { Dun: "a bolt", Ora: "a sphere", Vell: "a wall", Tash: "a blade", Rinn: "a ring" }[cfg.shape];
    const src = { Ignar: "fire", Vaesh: "water", Tol: "stone", Sil: "wind", Ithra: "light", Mor: "shadow", Ael: "living energy", Kesh: "raw force", Thalen: "the Warden's power" }[cfg.source];
    const size = has("Brann") ? "vast " : cfg.sourceSize < 0.8 ? "small, dense " : "";
    let colorWord = "";
    if (cfg.source === "Ignar") colorWord = has("Ardh") ? "white-blue " : "orange-red ";
    if (has("Shai")) colorWord = "unnaturally green ";
    if (has("Hesh")) colorWord = "silent, lightless ";
    const lead = size + colorWord;
    let s = lead ? `${/^[aeiou]/i.test(lead) ? "An" : "A"} ${lead}${shape.replace(/^a /, "")} of ${src}` : `${cap(shape)} of ${src}`;
    const cmd = {
      Sae: () => {
        const sp = speed < 0.55 ? "drifting slowly forward" : speed < 1.0 ? "flying at the speed of a thrown stone" :
          speed < 1.6 ? "streaking out faster than an arrow" : "crossing the field faster than the eye can follow";
        return ` launched from the hand, ${sp}`;
      },
      Keth: () => " that holds fast where it is placed",
      Ruun: () => " that grows stronger the longer it is fed",
      Nai: () => " that unmakes whatever magic it touches",
      Lo: () => " that mends what it touches",
    }[cfg.command]();
    s += cmd;
    const extras = [];
    if (has("Ardh")) extras.push("burns hot enough to melt iron plate");
    if (has("Esk")) extras.push("clings and keeps burning long after it lands");
    if (has("Teyr")) extras.push("splits into several smaller copies mid-flight");
    if (has("Wyn")) extras.push("waits in the air until something passes near it");
    if (has("Quel") && cfg.command !== "Sae") extras.push("forms almost instantly");
    if (extras.length) s += ". It " + extras.join(", and ");
    s += ".";
    if (stab < 15) s += " This circle will not hold. Casting it is a death wish.";
    else if (stab < 40) s += " It is dangerously unstable.";
    return s;
  }

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  function costLabel(c) {
    if (c < 0.45) return "A sip";
    if (c < 0.8) return "A light draw";
    if (c < 1.25) return "A steady draw";
    if (c < 1.8) return "A deep pull";
    if (c < 2.6) return "A heavy pull";
    return "Tearing: it would drain a Magus";
  }
  const scaleLabel = (v, words) => words[Math.min(words.length - 1, Math.floor(v))];

  // ───────────────────────── presets ─────────────────────────
  const BASE = { source: "Ignar", shape: "Ora", command: "Sae", mods: [], weave: true, conduit: "angled", angle: 90,
    thickness: 4, taper: "none", sourceSize: 1, modSize: 1, flow: "cw", sealed: true };
  const PRESETS = [
    { name: "Common Fireball", kind: "Inherited", note: "The version every second-year student learns. Right-angled conduits, uniform glyphs, nothing wasted and nothing refined.", cfg: {} },
    { name: "Crafter's Economy", kind: "Spellcrafted", note: "The same fireball for roughly a third of the mana. Curved conduits plus a woven Lisse glyph.", cfg: { conduit: "curved", mods: ["Lisse"] } },
    { name: "White-Blue Flame", kind: "Spellcrafted", note: "A woven Ardh glyph pushes the heat until the flame burns white-blue.", cfg: { mods: ["Ardh"] } },
    { name: "Burning Needle", kind: "Spellcrafted", note: "Small Source, acute bends and narrowing conduits. It's tiny and terribly fast.", cfg: { mods: ["Quel"], angle: 45, taper: "narrow", sourceSize: 0.7, modSize: 0.7, thickness: 3 } },
    { name: "Second Sun", kind: "Spellcrafted", note: "A third ring of Brann and Esk, widening conduits and a heavy Source. Vast, slow and lingering.", cfg: { mods: ["Brann", "Esk"], weave: false, conduit: "curved", taper: "widen", sourceSize: 1.3, modSize: 1.3, thickness: 6 } },
    { name: "Seven Fires", kind: "Spellcrafted", note: "A Teyr glyph splits the sphere mid-flight.", cfg: { mods: ["Teyr"] } },
    { name: "The Varn Breach", kind: "Forbidden", note: "A Common Fireball with the Seal left off on purpose, as in the Siege of Varn.", cfg: { sealed: false, thickness: 6 } },
    { name: "Stonewall of the Nine Masons", kind: "Inherited", note: "Tol, Vell and Keth, drawn counter-clockwise so the flow holds inward.", cfg: { source: "Tol", shape: "Vell", command: "Keth", flow: "ccw", conduit: "curved" } },
    { name: "Mending Circle", kind: "Inherited", note: "Ael, Ora and Lo. Healing circles are always drawn with curves.", cfg: { source: "Ael", shape: "Ora", command: "Lo", conduit: "curved", thickness: 3 } },
  ].map((p) => ({ ...p, cfg: { ...BASE, ...p.cfg } }));

  // ───────────────────────── page sections ─────────────────────────
  function lexiconHTML() {
    return V.categories
      .map((cat) => {
        const cards = V.glyphs
          .filter((g) => g.category === cat)
          .map((g) => `
            <div class="glyph-card">
              <svg viewBox="-50 -50 100 100" class="glyph-icon" style="color:${g.color || "#f3ead8"}">${V.glyphSVG(g.word, 0, 0, 1, "currentColor", 4)}</svg>
              <div><strong>${g.word}</strong> <span class="muted">${g.meaning}</span><p>${g.note}</p></div>
            </div>`)
          .join("");
        return `<h3>${cat}${cat === "Modifier" ? "s" : cat === "Seal" ? "" : "s"}</h3><div class="glyph-grid">${cards}</div>`;
      })
      .join("");
  }

  function demo(A, B, o, label) {
    const svg = `<svg viewBox="0 0 200 110" class="demo">
      ${conduitSVG(A, B, { style: "angled", angle: 90, taper: "none", width: 4, bendSign: 1, ...o })}
      <circle cx="${A[0]}" cy="${A[1]}" r="9" class="node"/><circle cx="${B[0]}" cy="${B[1]}" r="9" class="node"/>
    </svg>`;
    return `<figure>${svg}<figcaption>${label}</figcaption></figure>`;
  }

  function principlesHTML() {
    const A = [25, 55], B = [175, 55];
    const P = (title, body, demos) => `
      <div class="principle">
        <h3>${title}</h3>
        <div class="principle-body">${body}</div>
        ${demos ? `<div class="demo-row">${demos}</div>` : ""}
      </div>`;
    return [
      P("Flow: center to rim",
        `<p>Mana enters a circle at the <strong>Source</strong> in the center. It travels outward along the <strong>conduits</strong>, the lines joining glyph to glyph, through the Shape ring, then the Command ring, then any modifiers, and it is locked in place at the <strong>Seal</strong> on the rim. Every glyph only acts on the mana that reaches it, so <em>how</em> the lines carry the flow matters as much as which glyphs sit on them.</p>`),
      P("Curves versus angles",
        `<p><strong>Curved conduits</strong> carry mana smoothly, losing very little along the way. They suit spells that should be steady, lasting or gentle: wards, mending, barriers. They are cheaper and more stable, but they deliver force softly.</p>
         <p><strong>Angled conduits</strong> redirect the flow abruptly. At each corner the mana piles up and compresses, then leaves the bend harder and faster than it arrived. Angles give spells their punch and speed, but each corner wastes some mana and strains the line.</p>
         <p>Inherited combat spells almost all use right angles. Inherited healing spells almost all use curves. Few inherited mages know why.</p>`,
        demo(A, B, { style: "curved" }, "Curved: smooth, efficient, stable") + demo(A, B, { angle: 90 }, "Angled: compressed, forceful")),
      P("Sharpness of the angle",
        `<p>The tighter the bend, the more the flow compresses.</p>
         <ul>
          <li><strong>Obtuse (120° and wider):</strong> A gentle redirect with little loss and little gain.</li>
          <li><strong>Right angle (90°):</strong> The inherited standard. A balanced trade of force for stability.</li>
          <li><strong>Acute (under 60°):</strong> Piercing. The mana shoots out of the corner like water from a pinched hose. This is how needles and lances are made. The line is under heavy strain.</li>
          <li><strong>Knife bend (under about 25°):</strong> The conduit is likely to <em>fracture</em>: the line cracks, mana sprays out of the break and the spell misfires. The Collegium forbids it. Some spellcrafters use it anyway, for exactly one cast.</li>
         </ul>`,
        demo(A, B, { angle: 150 }, "150°: gentle") + demo(A, B, { angle: 90 }, "90°: standard") + demo(A, B, { angle: 40 }, "40°: piercing") + demo(A, B, { angle: 18 }, "18°: knife bend")),
      P("Thickness of the line",
        `<p>Thickness is <strong>throughput</strong>. A thick conduit carries more mana at once, which gives more power at a higher draw from the well. A thin conduit carries less, which makes it efficient and precise but limits how hard the spell can hit.</p>
         <p>There are limits on both ends. A conduit too thick for the caster's well floods and wobbles. A hair-thin conduit under heavy flow <em>burns out</em> like an overloaded wick. Inscribers carving permanent wards favor thin, even lines, because the spell has to last for years, not seconds.</p>`,
        demo(A, B, { width: 1.5 }, "Thin: precise, efficient") + demo(A, B, { width: 4 }, "Standard") + demo(A, B, { width: 9 }, "Thick: powerful, costly")),
      P("Tapering",
        `<p>A conduit doesn't have to stay the same width. <strong>Narrowing</strong> a line as it moves outward works like a nozzle: the flow speeds up and the spell leaves the circle faster and more focused. <strong>Widening</strong> a line slows the flow and spreads it, for bigger, slower and longer-lasting effects. Tapering is almost unknown in inherited spells. It is one of the first things a spellcrafter learns.</p>`,
        demo(A, B, { taper: "narrow", width: 5 }, "Narrowing: faster, focused") + demo(A, B, { taper: "widen", width: 5 }, "Widening: slower, broader")),
      P("Glyph size and weight",
        `<p>A glyph's size relative to the others in the circle sets its <strong>weight</strong>: how much of the spell it governs. Enlarge the Source and the spell carries more substance, so a fireball has more fire in it. Enlarge a modifier and its effect dominates. Shrink the Source and you get a smaller, denser effect.</p>
         <p>Inherited circles keep every glyph the same size, which is safe and balanced. A spellcrafter who changes the proportions has to keep the circle in <em>balance</em>. If one glyph is far heavier than its neighbors, it drags the flow toward itself and the circle wobbles.</p>`),
      P("Ring spacing",
        `<p>The gap between rings is the distance mana has to travel between steps. Tight rings make a spell form fast and act close to the caster. Wide rings take longer to fill but throw the effect farther. Battle mages draw tight circles. Siege inscribers draw them wide.</p>`),
      P("Direction of flow",
        `<p>Circles are drawn with a direction. <strong>Clockwise</strong> flow drives mana <em>outward</em>, which is right for anything projected or launched. <strong>Counter-clockwise</strong> flow draws it <em>inward</em>, which is right for holding, binding, shielding and walls. A Command that fights its flow, such as a <em>Sae</em> drawn counter-clockwise, makes a circle that pulls against itself.</p>`),
      P("Junctions, loops and breaks",
        `<p>Where a conduit <strong>splits</strong>, the flow divides. That is how a spell is made to branch, and why splitting spells hit softer per piece. A conduit that <strong>loops</strong> back on itself stores mana in the loop, so delayed and triggered spells are full of small loops. A <strong>break</strong> in a line, even a hairline gap, leaks mana and starves everything beyond it. Most failed spells are broken lines.</p>`),
      P("The Seal",
        `<p>The rim of every circle is the Seal, <em>Vos</em>, drawn as an unbroken ring. It locks the spell into stable form. An <strong>unsealed</strong> circle still works, but the mana has nowhere to stop. The spell hits harder and travels farther, and it may twist, burst early or come back on the caster.</p>`),
      P("Why class isn't power",
        `<p>The Collegium ranks spells by how many rings they have. Spellcrafters learned to <strong>weave</strong> modifiers into an existing ring, tucked between the Commands, instead of adding a new one. A woven circle keeps its class. A Second-Class fireball with a woven Ardh and a woven Lisse is still, on paper, a Second-Class fireball. In practice it burns hotter and costs less than anything a Fourth-Class Magus can throw. Weaving crowds the ring, though, and every woven glyph costs a little stability.</p>`),
    ].join("");
  }

  function presetGalleryHTML() {
    return PRESETS.slice(0, 7)
      .map((p, i) => {
        const a = analyze(p.cfg);
        return `
        <div class="preset-card" data-preset="${i}">
          ${circleSVG(p.cfg, { size: 210, animate: false })}
          <div>
            <span class="tag tag-${p.kind.toLowerCase()}">${p.kind}</span>
            <h4>${p.name}</h4>
            <p>${p.note}</p>
            <p class="muted small">${["", "First", "Second", "Third"][a.rings]}-Class · ${costLabel(a.cost)}</p>
            <button class="load-preset" data-preset="${i}">Open in workshop</button>
          </div>
        </div>`;
      })
      .join("");
  }

  const opt = (cat, sel) =>
    V.glyphs.filter((g) => cat.includes(g.category)).map((g) =>
      `<option value="${g.word}" ${g.word === sel ? "selected" : ""}>${g.word}: ${g.meaning}</option>`).join("");

  function workshopHTML() {
    const modBoxes = V.glyphs.filter((g) => g.category === "Modifier")
      .map((g) => `<label class="chip"><input type="checkbox" name="mod" value="${g.word}"> ${g.word} <span class="muted">${g.meaning}</span></label>`).join("");
    return `
      <div class="workshop">
        <div class="workshop-stage">
          <div class="circle-holder"></div>
          <p class="incantation"></p>
        </div>
        <form class="workshop-controls" autocomplete="off">
          <label>Preset
            <select name="preset">
              <option value="">Custom</option>
              ${PRESETS.map((p, i) => `<option value="${i}">${p.name} (${p.kind})</option>`).join("")}
            </select>
          </label>
          <fieldset><legend>Words</legend>
            <label>Source <select name="source">${opt(["Source", "Anchor"], "Ignar")}</select></label>
            <label>Shape <select name="shape">${opt(["Shape"], "Ora")}</select></label>
            <label>Command <select name="command">${opt(["Command"], "Sae")}</select></label>
            <div class="mods"><span class="field-label">Modifiers (up to 3)</span>${modBoxes}</div>
            <label class="inline"><input type="checkbox" name="weave" checked> Weave modifiers into the Command ring (keeps the class)</label>
          </fieldset>
          <fieldset><legend>Conduits</legend>
            <div class="seg">
              <label><input type="radio" name="conduit" value="curved"> Curved</label>
              <label><input type="radio" name="conduit" value="angled" checked> Angled</label>
            </div>
            <label class="angle-row">Bend angle <output name="angleOut">90°</output>
              <input type="range" name="angle" min="12" max="170" step="1" value="90"></label>
            <label>Line thickness <output name="thickOut">4</output>
              <input type="range" name="thickness" min="1" max="10" step="0.5" value="4"></label>
            <label>Taper
              <select name="taper"><option value="none">Even width</option><option value="narrow">Narrowing outward (nozzle)</option><option value="widen">Widening outward (spread)</option></select></label>
            <div class="seg">
              <label><input type="radio" name="flow" value="cw" checked> Clockwise (outward)</label>
              <label><input type="radio" name="flow" value="ccw"> Counter-clockwise (inward)</label>
            </div>
          </fieldset>
          <fieldset><legend>Glyph weight</legend>
            <label>Source glyph size <output name="srcOut">1.00×</output>
              <input type="range" name="sourceSize" min="0.5" max="1.8" step="0.05" value="1"></label>
            <label>Modifier glyph size <output name="modOut">1.00×</output>
              <input type="range" name="modSize" min="0.5" max="1.8" step="0.05" value="1"></label>
          </fieldset>
          <fieldset><legend>Seal</legend>
            <label class="inline"><input type="checkbox" name="sealed" checked> Close the circle with <em>Vos</em></label>
          </fieldset>
        </form>
        <div class="readout"></div>
      </div>`;
  }

  function bar(label, value, max, word, cls = "") {
    const pct = Math.max(3, Math.min(100, (value / max) * 100));
    return `<div class="meter ${cls}"><div class="meter-head"><span>${label}</span><span>${word}</span></div>
      <div class="meter-track"><div class="meter-fill" style="width:${pct.toFixed(0)}%"></div></div></div>`;
  }

  function bindWorkshop(root) {
    const form = root.querySelector(".workshop-controls");
    const holder = root.querySelector(".circle-holder");
    const readout = root.querySelector(".readout");
    const incant = root.querySelector(".incantation");

    function read() {
      const fd = new FormData(form);
      return {
        source: fd.get("source"), shape: fd.get("shape"), command: fd.get("command"),
        mods: fd.getAll("mod"), weave: fd.get("weave") === "on",
        conduit: fd.get("conduit"), angle: Number(fd.get("angle")), thickness: Number(fd.get("thickness")),
        taper: fd.get("taper"), flow: fd.get("flow"),
        sourceSize: Number(fd.get("sourceSize")), modSize: Number(fd.get("modSize")),
        sealed: fd.get("sealed") === "on",
      };
    }

    function write(cfg) {
      const set = (n, v) => (form.elements[n].value = v);
      set("source", cfg.source); set("shape", cfg.shape); set("command", cfg.command);
      form.querySelectorAll('input[name="mod"]').forEach((b) => (b.checked = cfg.mods.includes(b.value)));
      form.elements.weave.checked = cfg.weave;
      form.querySelector(`input[name="conduit"][value="${cfg.conduit}"]`).checked = true;
      form.querySelector(`input[name="flow"][value="${cfg.flow}"]`).checked = true;
      set("angle", cfg.angle); set("thickness", cfg.thickness); set("taper", cfg.taper);
      set("sourceSize", cfg.sourceSize); set("modSize", cfg.modSize);
      form.elements.sealed.checked = cfg.sealed;
    }

    function update() {
      // Cap modifiers at three.
      const checked = [...form.querySelectorAll('input[name="mod"]:checked')];
      form.querySelectorAll('input[name="mod"]').forEach((b) => (b.disabled = !b.checked && checked.length >= 3));

      const cfg = read();
      form.querySelector(".angle-row").classList.toggle("disabled", cfg.conduit !== "angled");
      form.elements.angleOut.value = cfg.angle + "°";
      form.elements.thickOut.value = cfg.thickness;
      form.elements.srcOut.value = cfg.sourceSize.toFixed(2) + "×";
      form.elements.modOut.value = cfg.modSize.toFixed(2) + "×";

      holder.innerHTML = circleSVG(cfg, { size: 440 });
      const words = [cfg.source, cfg.shape, cfg.command, ...cfg.mods].map((w) => w.toLowerCase());
      words[0] = cap(words[0]);
      incant.innerHTML = `<em>"${words.join(" ")}${cfg.sealed ? ", vos" : "..."}"</em>`;

      const a = analyze(cfg);
      const cls = ["", "First", "Second", "Third"][a.rings];
      readout.innerHTML = `
        <h3>${cls}-Class circle <span class="muted">(${a.rings} ring${a.rings > 1 ? "s" : ""}, by the Collegium's measure)</span></h3>
        <p class="spell-desc">${a.description}</p>
        ${bar("Mana draw", a.cost, 3, costLabel(a.cost), "cost")}
        ${bar("Force", a.power, 3.5, scaleLabel(a.power * 1.6, ["Feeble", "Modest", "Solid", "Heavy", "Devastating", "Catastrophic"]))}
        ${cfg.command === "Sae" ? bar("Speed", a.speed, 3, scaleLabel(a.speed * 1.8, ["Drifting", "Thrown stone", "Arrow-fast", "Blurring", "Unseeable"])) : ""}
        ${bar("Duration", a.duration, 6, scaleLabel(a.duration * 1.2, ["Instant", "Brief", "Lingering", "Long-lasting", "Hours", "Hours", "Until dispelled", "Until dispelled"]))}
        ${bar("Stability", a.stab, 100, a.stab >= 80 ? "Steady" : a.stab >= 60 ? "Holds" : a.stab >= 40 ? "Wavering" : a.stab >= 15 ? "Volatile" : "Will not hold", a.stab < 40 ? "danger" : "")}
        ${a.notes.length ? `<ul class="notes">${a.notes.map((n) => `<li>${n}</li>`).join("")}</ul>` : ""}
        <p class="muted small">These are rough Collegium-style estimates. Casters don't see numbers. They feel the draw on their well.</p>`;
    }

    form.addEventListener("input", (e) => {
      if (e.target.name === "preset") {
        if (e.target.value !== "") write(PRESETS[Number(e.target.value)].cfg);
      } else {
        form.elements.preset.value = "";
      }
      update();
    });

    root.addEventListener("click", (e) => {
      const b = e.target.closest(".load-preset");
      if (!b) return;
      write(PRESETS[Number(b.dataset.preset)].cfg);
      form.elements.preset.value = b.dataset.preset;
      update();
      root.querySelector("#workshop").scrollIntoView({ behavior: "smooth" });
    });

    write(PRESETS[0].cfg);
    form.elements.preset.value = "0";
    update();
  }

  function render(container) {
    container.innerHTML = `
      <header class="page-header">
        <h1>The Spellcrafter's Codex</h1>
        <p class="subtitle">How a Vaelic circle actually works, down to the angle of a line.</p>
      </header>
      <nav class="toc">
        <a href="#sc-two-parts">The two parts</a><a href="#sc-anatomy">Anatomy</a><a href="#sc-lexicon">Glyph lexicon</a>
        <a href="#sc-conduits">Conduits</a><a href="#sc-variants">One spell, many versions</a><a href="#workshop">Workshop</a>
      </nav>

      <section id="sc-two-parts" class="codex-section">
        <h2>The two parts of magic</h2>
        <div class="two-col">
          <div class="card"><h3>1. The Well</h3>
            <p>Everyone is born with a reservoir of mana. Some are born with a deep one, and anyone can deepen theirs through training. <strong>Feeling</strong> the well is a separate, learned skill. Without it, a mage casts blind: they can't sense a spell's cost and they don't notice the warning signs before they collapse.</p>
            <p class="muted small">Running dry brings exhaustion. Only weapon training keeps a drained mage in the fight. Bloodcasting, forcing a spell from one's own life after the well is empty, rarely works and is forbidden.</p></div>
          <div class="card"><h3>2. The Circle</h3>
            <p>A spell is a circle of Vaelic glyphs joined by conduits. Most mages learn <strong>inherited</strong> circles, copied exactly and never understood. <strong>Spellcrafters</strong> take circles apart, learn what every glyph and every line does, and build their own.</p>
            <p class="muted small">The world treats every spell the same. The class system, ranked by ring count, is a mortal invention.</p></div>
        </div>
      </section>

      <section id="sc-anatomy" class="codex-section">
        <h2>Anatomy of a circle</h2>
        <div class="anatomy">
          <div class="anatomy-figure">${circleSVG(PRESETS[0].cfg, { size: 380 })}</div>
          <ol class="anatomy-key">
            <li><strong>Source</strong> (center): what the spell is made of. Here it is <em>Ignar</em>, fire.</li>
            <li><strong>First ring, Shape</strong>: the form it takes. <em>Ora</em>, a sphere.</li>
            <li><strong>Second ring, Command</strong>: what it does. <em>Sae</em>, launch.</li>
            <li><strong>Outer rings, Modifiers</strong>: optional refinements for heat, size, speed, duration and more.</li>
            <li><strong>Conduits</strong>: the lines joining glyph to glyph. Mana flows along them from the center outward.</li>
            <li><strong>Seal</strong> (rim): <em>Vos</em>, which locks the spell into stable form.</li>
          </ol>
        </div>
        <p class="muted">Spoken aloud, this circle is <em>"Ignar ora sae, vos"</em>: the Common Fireball.</p>
      </section>

      <section id="sc-lexicon" class="codex-section">
        <h2>Glyph lexicon</h2>
        <p>Every Vaelic word is also a glyph. Speaking it, tracing it in the air or carving it in stone shapes mana the same way. This is the working vocabulary of the Collegium. Spellcrafters know hundreds more.</p>
        ${lexiconHTML()}
      </section>

      <section id="sc-conduits" class="codex-section">
        <h2>Conduits: how the lines matter</h2>
        <p>Inherited mages think of a circle as a set of words. Spellcrafters know it is also a set of <strong>pipes</strong>. The same glyphs joined by different lines make a different spell.</p>
        ${principlesHTML()}
      </section>

      <section id="sc-variants" class="codex-section">
        <h2>One spell, many versions</h2>
        <p>Every circle below is a fireball. Most are still Second-Class. Only the lines, the proportions and a woven glyph or two have changed.</p>
        <div class="preset-grid">${presetGalleryHTML()}</div>
      </section>

      <section id="workshop" class="codex-section">
        <h2>Spellcrafter's workshop</h2>
        <p>Build a circle and see how the Collegium would judge it. Pick a preset, or change any part yourself.</p>
        ${workshopHTML()}
      </section>`;

    // In-page anchor links shouldn't fight the hash router.
    container.querySelectorAll(".toc a").forEach((a) =>
      a.addEventListener("click", (e) => {
        e.preventDefault();
        container.querySelector(a.getAttribute("href")).scrollIntoView({ behavior: "smooth" });
      }));
    bindWorkshop(container);
  }

  window.EXTRAS = window.EXTRAS || {};
  window.EXTRAS["the-day-the-gods-went-silent"] = Object.assign(
    window.EXTRAS["the-day-the-gods-went-silent"] || {}, { spellcraft: render });

  // Exposed for tests and future chapters.
  window.SPELLCRAFT = { circleSVG, analyze, PRESETS };
})();
