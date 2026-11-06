// A deliberately small Markdown renderer for chapter text.
// Supports: # headings, paragraphs, --- scene breaks, > quotes,
// - bullet lists, **bold**, *italic*.
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
      .replace(/\*(.+?)\*/g, "<em>$1</em>");
  }

  function render(md) {
    const blocks = md.trim().split(/\n\s*\n/);
    return blocks
      .map((block) => {
        const b = block.trim();
        if (/^-{3,}$/.test(b)) return '<hr class="scene-break">';
        const h = b.match(/^(#{1,4})\s+(.*)$/);
        if (h) return `<h${h[1].length + 1}>${inline(h[2])}</h${h[1].length + 1}>`;
        if (b.startsWith(">")) {
          const text = b.replace(/^>\s?/gm, "");
          return `<blockquote><p>${inline(text)}</p></blockquote>`;
        }
        if (/^- /.test(b)) {
          const items = b.split(/\n/).map((l) => `<li>${inline(l.replace(/^- /, ""))}</li>`);
          return `<ul>${items.join("")}</ul>`;
        }
        return `<p>${inline(b.replace(/\n/g, " "))}</p>`;
      })
      .join("\n");
  }

  window.renderMarkdown = render;
})();
