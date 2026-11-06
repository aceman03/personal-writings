// Draws stylized character portraits as SVG from a small description object.
// Any character can instead use a real image by setting `image` in characters.js.
window.PORTRAITS = (function () {
  let uid = 0;

  const SKIN = { fair: "#f1d3b8", light: "#e2b996", tan: "#c99367", brown: "#9a6845", deep: "#6e4a32",
    elf: "#eedfcf", orc: "#7f9468", dwarf: "#d9a782" };

  function head(p) {
    // Head proportions by build.
    const b = { human: [38, 46], child: [34, 40], elf: [34, 49], dwarf: [43, 42], orc: [45, 46] }[p.build || "human"];
    const cy = p.build === "child" ? 112 : 104;
    return { rx: b[0], ry: b[1], cx: 100, cy };
  }

  function ears(p, h, skin) {
    const y = h.cy + 4, l = h.cx - h.rx, r = h.cx + h.rx;
    if (p.build === "elf")
      return `<path d="M${l + 4},${y + 6} L${l - 20},${y - 30} L${l + 2},${y - 10} Z" fill="${skin}" stroke="#0003"/>
              <path d="M${r - 4},${y + 6} L${r + 20},${y - 30} L${r - 2},${y - 10} Z" fill="${skin}" stroke="#0003"/>`;
    if (p.build === "orc")
      return `<path d="M${l + 4},${y + 8} L${l - 12},${y - 14} L${l + 3},${y - 8} Z" fill="${skin}" stroke="#0003"/>
              <path d="M${r - 4},${y + 8} L${r + 12},${y - 14} L${r - 3},${y - 8} Z" fill="${skin}" stroke="#0003"/>`;
    return `<ellipse cx="${l + 1}" cy="${y}" rx="7" ry="11" fill="${skin}" stroke="#0002"/>
            <ellipse cx="${r - 1}" cy="${y}" rx="7" ry="11" fill="${skin}" stroke="#0002"/>`;
  }

  function hairBack(p, h) {
    const c = p.hairColor || "#3b2a20";
    const { cx, cy, rx, ry } = h;
    switch (p.hair) {
      case "long":
        return `<path d="M${cx - rx - 6},${cy - 10} C${cx - rx - 14},${cy + 60} ${cx - rx - 4},${cy + 95} ${cx - rx + 6},${cy + 110}
                 L${cx + rx - 6},${cy + 110} C${cx + rx + 4},${cy + 95} ${cx + rx + 14},${cy + 60} ${cx + rx + 6},${cy - 10} Z" fill="${c}"/>`;
      case "braid":
        return `<path d="M${cx + rx - 8},${cy + 10} q22,30 6,60 q-8,14 4,30" stroke="${c}" stroke-width="14" fill="none" stroke-linecap="round"/>`;
      case "bun":
        return `<circle cx="${cx}" cy="${cy - ry - 6}" r="17" fill="${c}"/>`;
      case "topknot":
        return `<path d="M${cx - 6},${cy - ry + 2} q-4,-26 8,-34 q10,10 2,34 Z" fill="${c}"/>`;
      default:
        return "";
    }
  }

  function hairFront(p, h) {
    const c = p.hairColor || "#3b2a20";
    const { cx, cy, rx, ry } = h;
    const top = cy - ry;
    switch (p.hair) {
      case "bald":
        return "";
      case "fringe": // bald on top with a fringe around the sides
        return `<path d="M${cx - rx},${cy + 4} C${cx - rx},${cy - 20} ${cx - rx + 6},${cy - 26} ${cx - rx + 10},${cy - 24}
                 L${cx - rx + 8},${cy + 12} Z" fill="${c}"/>
                <path d="M${cx + rx},${cy + 4} C${cx + rx},${cy - 20} ${cx + rx - 6},${cy - 26} ${cx + rx - 10},${cy - 24}
                 L${cx + rx - 8},${cy + 12} Z" fill="${c}"/>`;
      case "short":
      case "cropped":
        return `<path d="M${cx - rx - 2},${cy - 4} C${cx - rx - 4},${top - 10} ${cx + rx + 4},${top - 10} ${cx + rx + 2},${cy - 4}
                 C${cx + rx - 6},${top + 18} ${cx - rx + 6},${top + 18} ${cx - rx - 2},${cy - 4} Z" fill="${c}"/>`;
      case "topknot":
        return `<path d="M${cx - rx + 4},${cy - 14} C${cx - rx + 4},${top - 2} ${cx + rx - 4},${top - 2} ${cx + rx - 4},${cy - 14}
                 C${cx + 10},${top + 12} ${cx - 10},${top + 12} ${cx - rx + 4},${cy - 14} Z" fill="${c}" opacity=".9"/>`;
      default: // long, braid, bun: parted hair across the top of the head
        return `<path d="M${cx - rx - 4},${cy + 8} C${cx - rx - 8},${top - 14} ${cx + rx + 8},${top - 14} ${cx + rx + 4},${cy + 8}
                 C${cx + rx - 2},${top + 26} ${cx + 4},${top + 14} ${cx},${top + 10}
                 C${cx - 4},${top + 14} ${cx - rx + 2},${top + 26} ${cx - rx - 4},${cy + 8} Z" fill="${c}"/>`;
    }
  }

  function face(p, h, skin) {
    const { cx, cy, rx } = h;
    const ey = cy + 2, dx = rx * 0.42;
    const eye = p.eyeColor || "#3a2a20";
    const old = p.age === "old";
    let s = "";
    // Brows
    const bc = p.browColor || p.hairColor || "#3b2a20";
    s += `<path d="M${cx - dx - 9},${ey - 11} q9,-${p.stern ? 2 : 5} 18,0 M${cx + dx - 9},${ey - 11} q9,-${p.stern ? 2 : 5} 18,0"
            stroke="${bc}" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
    // Eyes
    [cx - dx, cx + dx].forEach((x) => {
      s += `<path d="M${x - 8},${ey} q8,-7 16,0 q-8,6 -16,0 Z" fill="#f6efe6"/>
            <circle cx="${x}" cy="${ey - 0.5}" r="3.6" fill="${p.glowEyes || eye}"/>
            <circle cx="${x + 1}" cy="${ey - 1.5}" r="1" fill="#fff"/>`;
      if (old) s += `<path d="M${x - 9},${ey + 6} q9,4 18,0" stroke="#0003" stroke-width="1.4" fill="none"/>`;
    });
    // Nose
    s += `<path d="M${cx},${ey + 4} q-5,13 -1,16 q3,1 6,-1" stroke="#0004" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    // Mouth
    const my = cy + (p.build === "orc" ? 30 : 27);
    s += p.smile
      ? `<path d="M${cx - 10},${my} q10,7 20,0" stroke="#7a3b30" stroke-width="2.6" fill="none" stroke-linecap="round"/>`
      : `<path d="M${cx - 9},${my + 1} q9,${p.stern ? -1 : 2} 18,0" stroke="#7a3b30" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    if (p.build === "orc")
      s += `<path d="M${cx - 13},${my + 2} l-2,-12 l5,10 Z M${cx + 13},${my + 2} l2,-12 l-5,10 Z" fill="#f4ecd8" stroke="#0004"/>`;
    if (old) s += `<path d="M${cx - 20},${cy + 18} q-3,8 2,14 M${cx + 20},${cy + 18} q3,8 -2,14" stroke="#0002" stroke-width="1.6" fill="none"/>`;
    if (p.freckles)
      for (let i = 0; i < 9; i++) {
        const x = cx + (i % 2 ? 1 : -1) * (12 + (i * 7) % 14), y = cy + 12 + (i * 5) % 8;
        s += `<circle cx="${x}" cy="${y}" r="1.2" fill="#9a5b3a" opacity=".6"/>`;
      }
    if (p.blush) s += `<ellipse cx="${cx - dx}" cy="${cy + 16}" rx="7" ry="4" fill="#e07a6a" opacity=".25"/><ellipse cx="${cx + dx}" cy="${cy + 16}" rx="7" ry="4" fill="#e07a6a" opacity=".25"/>`;
    if (p.scar) s += `<path d="M${cx + dx + 4},${ey + 4} l8,18" stroke="#8a4a3a" stroke-width="2" opacity=".7"/>`;
    if (p.warpaint) s += `<path d="M${cx - dx - 14},${ey - 4} l10,22 l6,-2 l-4,-20 Z M${cx - dx - 4},${ey - 8} l6,26" fill="${p.warpaint}" stroke="${p.warpaint}" stroke-width="3" opacity=".85"/>`;
    if (p.spectacles)
      s += `<g stroke="#c9a85a" stroke-width="2" fill="#ffffff10"><circle cx="${cx - dx}" cy="${ey}" r="11"/><circle cx="${cx + dx}" cy="${ey}" r="11"/>
            <path d="M${cx - dx + 11},${ey} h${2 * dx - 22}" /></g>`;
    return s;
  }

  function beard(p, h) {
    if (!p.beard) return "";
    const c = p.beardColor || p.hairColor || "#3b2a20";
    const { cx, cy, rx } = h;
    if (p.beard === "stubble")
      return `<path d="M${cx - rx + 6},${cy + 10} C${cx - rx + 10},${cy + 44} ${cx + rx - 10},${cy + 44} ${cx + rx - 6},${cy + 10}
               C${cx + 18},${cy + 34} ${cx - 18},${cy + 34} ${cx - rx + 6},${cy + 10} Z" fill="${c}" opacity=".35"/>`;
    if (p.beard === "braided")
      return `<path d="M${cx - rx + 2},${cy + 6} C${cx - rx},${cy + 50} ${cx - 20},${cy + 70} ${cx},${cy + 96}
               C${cx + 20},${cy + 70} ${cx + rx},${cy + 50} ${cx + rx - 2},${cy + 6}
               C${cx + 20},${cy + 38} ${cx - 20},${cy + 38} ${cx - rx + 2},${cy + 6} Z" fill="${c}"/>
              <path d="M${cx},${cy + 50} v44 M${cx - 6},${cy + 60} l6,6 l6,-6 M${cx - 6},${cy + 74} l6,6 l6,-6" stroke="#0004" stroke-width="2" fill="none"/>
              <circle cx="${cx}" cy="${cy + 96}" r="4" fill="#c9a85a"/>`;
    // full
    return `<path d="M${cx - rx + 2},${cy + 4} C${cx - rx},${cy + 44} ${cx - 16},${cy + 62} ${cx},${cy + 66}
             C${cx + 16},${cy + 62} ${cx + rx},${cy + 44} ${cx + rx - 2},${cy + 4}
             C${cx + 22},${cy + 36} ${cx - 22},${cy + 36} ${cx - rx + 2},${cy + 4} Z" fill="${c}"/>
            <path d="M${cx - 12},${cy + 25} q12,-5 24,0" stroke="${c}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  }

  function body(p) {
    const c = p.clothing || "#4a3b5c";
    const trim = p.trim || "#c9a85a";
    let s = `<path d="M14,240 C22,192 62,174 100,174 C138,174 178,192 186,240 Z" fill="${c}"/>`;
    switch (p.outfit) {
      case "mantle":
        s += `<path d="M30,240 C40,198 70,184 100,184 C130,184 160,198 170,240" stroke="${trim}" stroke-width="7" fill="none"/>
              <path d="M70,182 L100,214 L130,182" stroke="${trim}" stroke-width="5" fill="none"/>`;
        break;
      case "robe":
        s += `<path d="M78,176 L100,240 L122,176" fill="#0002"/><path d="M78,176 L100,240 L122,176" stroke="${trim}" stroke-width="3" fill="none"/>`;
        break;
      case "armor":
        s += `<path d="M24,226 C30,196 52,184 74,182 L80,206 C60,206 40,214 30,232 Z" fill="#8b8f99" stroke="#0005"/>
              <path d="M176,226 C170,196 148,184 126,182 L120,206 C140,206 160,214 170,232 Z" fill="#8b8f99" stroke="#0005"/>
              <rect x="80" y="190" width="40" height="50" fill="#6d717b" stroke="#0004"/>`;
        break;
      case "apron":
        s += `<rect x="66" y="188" width="68" height="60" rx="6" fill="#6b4a2e" stroke="#0004"/>
              <path d="M70,190 L58,176 M130,190 L142,176" stroke="#6b4a2e" stroke-width="6"/>`;
        break;
      case "furs":
        s += `<path d="M14,240 C22,196 58,180 100,182 C142,180 178,196 186,240" stroke="#5a4636" stroke-width="18" fill="none"/>
              <path d="M30,212 l8,-8 l4,10 l8,-10 l4,10 l8,-9 M170,212 l-8,-8 l-4,10 l-8,-10 l-4,10 l-8,-9" stroke="#3e3026" stroke-width="2" fill="none"/>`;
        break;
      case "cloak":
        s += `<path d="M14,240 C24,190 60,176 84,176 L100,204 L116,176 C140,176 176,190 186,240" fill="#0003"/>
              <circle cx="100" cy="204" r="6" fill="${trim}"/>`;
        break;
      case "tunic":
        s += `<path d="M86,176 L100,196 L114,176" stroke="#0003" stroke-width="3" fill="none"/>`;
        break;
    }
    if (p.emblem === "sun") s += `<circle cx="100" cy="222" r="9" fill="${trim}"/><circle cx="100" cy="222" r="14" fill="none" stroke="${trim}" stroke-width="2" stroke-dasharray="3 3"/>`;
    if (p.emblem === "shield") s += `<path d="M100,206 l12,5 v10 c0,8 -6,13 -12,16 c-6,-3 -12,-8 -12,-16 v-10 Z" fill="#7fc8ff" stroke="#0005"/>`;
    if (p.emblem === "leaf") s += `<path d="M100,230 c-14,-6 -14,-22 0,-26 c14,4 14,20 0,26 Z" fill="#6fdc7a" stroke="#0004"/>`;
    if (p.emblem === "glyph") s += `<circle cx="100" cy="222" r="11" fill="none" stroke="#7fd0ff" stroke-width="2"/><path d="M100,213 v18 M92,222 h16" stroke="#7fd0ff" stroke-width="2"/>`;
    if (p.emblem === "redhand") s += `<path d="M92,232 v-14 l3,-6 l2,8 l2,-10 l2,10 l2,-9 l2,9 l2,-5 v17 Z" fill="#b8322a"/>`;
    return s;
  }

  function headwear(p, h) {
    const { cx, cy, rx, ry } = h;
    const top = cy - ry;
    switch (p.headwear) {
      case "circlet":
        return `<path d="M${cx - rx + 2},${top + 22} q${rx - 2},-10 ${2 * rx - 4},0" stroke="#d9b26a" stroke-width="4" fill="none"/>
                <circle cx="${cx}" cy="${top + 15}" r="4" fill="#7fc8ff" stroke="#d9b26a" stroke-width="1.5"/>`;
      case "leafcirclet":
        return `<path d="M${cx - rx + 2},${top + 22} q${rx - 2},-10 ${2 * rx - 4},0" stroke="#b9c98a" stroke-width="3" fill="none"/>
                <path d="M${cx - 6},${top + 16} c-8,-8 -4,-16 6,-18 c6,6 4,14 -6,18 Z M${cx + 8},${top + 16} c8,-8 4,-16 -6,-18" fill="#6fdc7a" stroke="#0003"/>`;
      case "helm":
        return `<path d="M${cx - rx - 6},${cy - 4} C${cx - rx - 6},${top - 16} ${cx + rx + 6},${top - 16} ${cx + rx + 6},${cy - 4} Z" fill="#7d828c" stroke="#0005" stroke-width="2"/>
                <path d="M${cx - rx - 8},${cy - 4} h${2 * rx + 16}" stroke="#5b5f68" stroke-width="6"/>
                <path d="M${cx},${top - 12} v${ry - 4}" stroke="#5b5f68" stroke-width="4"/>`;
      case "hood":
        return `<path d="M${cx - rx - 16},${cy + 60} C${cx - rx - 20},${top - 30} ${cx + rx + 20},${top - 30} ${cx + rx + 16},${cy + 60}
                 L${cx + rx - 2},${cy + 40} C${cx + rx + 2},${top + 2} ${cx - rx - 2},${top + 2} ${cx - rx + 2},${cy + 40} Z" fill="${p.hoodColor || "#3a3046"}"/>`;
      default:
        return "";
    }
  }

  function person(p) {
    const id = "pt" + uid++;
    const h = head(p);
    const skin = SKIN[p.skin] || p.skin || SKIN.light;
    const bg = p.background || ["#3a3046", "#15131a"];
    return `
    <svg viewBox="0 0 200 240" class="portrait" role="img" aria-label="${p.alt || "Character portrait"}">
      <defs>
        <radialGradient id="${id}bg" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></radialGradient>
        <radialGradient id="${id}sh" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></radialGradient>
      </defs>
      <rect width="200" height="240" fill="url(#${id}bg)"/>
      ${p.aura ? `<circle cx="100" cy="${h.cy}" r="78" fill="${p.aura}" opacity=".18"/>` : ""}
      ${hairBack(p, h)}
      ${body(p)}
      <rect x="${100 - 13}" y="${h.cy + h.ry - 14}" width="26" height="34" fill="${skin}"/>
      <rect x="${100 - 13}" y="${h.cy + h.ry - 14}" width="26" height="34" fill="#0002"/>
      ${ears(p, h, skin)}
      <ellipse cx="${h.cx}" cy="${h.cy}" rx="${h.rx}" ry="${h.ry}" fill="${skin}"/>
      <ellipse cx="${h.cx}" cy="${h.cy}" rx="${h.rx}" ry="${h.ry}" fill="url(#${id}sh)"/>
      ${face(p, h, skin)}
      ${beard(p, h)}
      ${hairFront(p, h)}
      ${headwear(p, h)}
      <rect x="3" y="3" width="194" height="234" fill="none" stroke="#d9b26a" stroke-opacity=".5" stroke-width="2"/>
    </svg>`;
  }

  // Gods are drawn as emblems rather than faces: no mortal has seen them.
  function emblem(e) {
    const id = "em" + uid++;
    const bg = e.background || ["#2a2533", "#0f0d13"];
    return `
    <svg viewBox="0 0 200 240" class="portrait" role="img" aria-label="${e.alt || "Divine emblem"}">
      <defs><radialGradient id="${id}" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></radialGradient>
        <filter id="${id}g" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <rect width="200" height="240" fill="url(#${id})"/>
      <circle cx="100" cy="112" r="74" fill="none" stroke="${e.color}" stroke-opacity=".35" stroke-width="2"/>
      <circle cx="100" cy="112" r="64" fill="none" stroke="${e.color}" stroke-opacity=".2" stroke-width="1" stroke-dasharray="2 6"/>
      <g filter="url(#${id}g)" transform="translate(100,112)">${e.svg}</g>
      <rect x="3" y="3" width="194" height="234" fill="none" stroke="${e.color}" stroke-opacity=".5" stroke-width="2"/>
    </svg>`;
  }

  return { person, emblem };
})();
