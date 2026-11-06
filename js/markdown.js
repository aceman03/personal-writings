// A deliberately small Markdown renderer for chapter text.
// Supports: # headings, paragraphs, --- scene breaks, > quotes,
// - bullet lists, **bold**, *italic*.
//
// Narration markup (invisible to readers, used by the voice-over):
//   {{mood: dread}}                 on its own line: sets the narrator's mood for the
//                                   following paragraphs until the next mood line.
//   {{corvel}}"Is it a bad one?"{{/}}          marks who speaks a line of dialogue.
//   {{corvel, hushed}}"Is it a bad one?"{{/}}  ...and how they say it.
//   {{ambience: temple}}            on its own line: the ambient soundscape from here on.
//   {{sfx: bells}}                  inline: a sound effect at that point in the text.
(function () {
  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function inline(s) {
    return escapeHtml(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\{\{\s*sfx:\s*([\w-]+)\s*\}\}\s*/g, '<span class="sfx" data-sfx="$1"></span>')
      .replace(/\{\{([\w-]+)(?:,\s*([\w-]+))?\}\}(.*?)\{\{\/\}\}/g, (m, who, mood, text) =>
        `<span class="say" data-speaker="${who}"${mood ? ` data-mood="${mood}"` : ""}>${text}</span>`);
  }

  function render(md) {
    const blocks = md.trim().split(/\n\s*\n/);
    let mood = "", ambience = "";
    const out = [];
    blocks.forEach((block) => {
      const b = block.trim();
      const m = b.match(/^\{\{\s*(mood|ambience):\s*([\w-]+)\s*\}\}$/);
      if (m) { if (m[1] === "mood") mood = m[2]; else ambience = m[2]; return; }
      const attr = (mood ? ` data-mood="${mood}"` : "") + (ambience ? ` data-ambience="${ambience}"` : "");
      if (/^-{3,}$/.test(b)) return out.push('<hr class="scene-break">');
      const h = b.match(/^(#{1,4})\s+(.*)$/);
      if (h) return out.push(`<h${h[1].length + 1}${attr}>${inline(h[2])}</h${h[1].length + 1}>`);
      if (b.startsWith(">")) {
        const text = b.replace(/^>\s?/gm, "");
        return out.push(`<blockquote${attr}><p>${inline(text)}</p></blockquote>`);
      }
      if (/^- /.test(b)) {
        const items = b.split(/\n/).map((l) => `<li>${inline(l.replace(/^- /, ""))}</li>`);
        return out.push(`<ul${attr}>${items.join("")}</ul>`);
      }
      out.push(`<p${attr}>${inline(b.replace(/\n/g, " "))}</p>`);
    });
    return out.join("\n");
  }

  window.renderMarkdown = render;
})();
