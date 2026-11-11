// Hash router and page rendering for the Story Library.
// Routes:
//   #/                                   home: every series
//   #/s/<series>                         series page: its books + extras tabs
//   #/s/<series>/book/<n>                a book: its chapters
//   #/s/<series>/book/<n>/chapter/<m>    a chapter
//   #/s/<series>/<extraId>[/...]         a series extra (characters, map, ...); extra path parts are passed through
(function () {
  const app = document.getElementById("app");
  // Series extras register themselves here: EXTRAS[seriesSlug][id] = fn(container, series)
  window.EXTRAS = window.EXTRAS || {};

  const WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
    "Twenty", "Twenty-One", "Twenty-Two", "Twenty-Three", "Twenty-Four", "Twenty-Five", "Twenty-Six",
    "Twenty-Seven", "Twenty-Eight", "Twenty-Nine", "Thirty"];
  const word = (n) => WORDS[n] || String(n);
  const chapterLabel = (n) => "Chapter " + word(n);
  const bookLabel = (n) => "Book " + word(n);
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : "s"}`;

  // Approximate printed pages: ~275 words per page in a typical trade paperback.
  const pages = (text) => Math.max(1, Math.round(text.replace(/\{\{[^}]*\}\}/g, " ").trim().split(/\s+/).length / 275));

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content;
  }

  const findSeries = (slug) => window.LIBRARY.series.find((s) => s.slug === slug);
  const seriesHref = (s) => `#/s/${s.slug}`;
  const bookHref = (s, b) => `${seriesHref(s)}/book/${b.number}`;
  const chapterHref = (s, b, c) => `${bookHref(s, b)}/chapter/${c.number}`;

  function setTitle(parts) {
    document.title = [...parts, "Story Library"].join(" · ");
  }

  function seriesNav(series, active) {
    const tabs = [{ id: "", label: "Books" }, ...series.extras];
    return `
      <nav class="book-tabs">
        ${tabs.map((t) => `<a href="${seriesHref(series)}${t.id ? "/" + t.id : ""}"
            class="${active === t.id ? "active" : ""}">${t.label}</a>`).join("")}
      </nav>`;
  }

  function renderHome() {
    setTitle([]);
    const cards = window.LIBRARY.series.map((s) => {
      const chapters = s.books.reduce((n, b) => n + b.chapters.length, 0);
      return `
        <a class="book-card" href="${seriesHref(s)}">
          <div class="book-spine"></div>
          <div class="book-card-body">
            <span class="book-genre">${s.genre} · Series</span>
            <h2>${s.title}</h2>
            <p>${s.blurb}</p>
            <span class="book-meta">${plural(s.books.length, "book")} · ${plural(chapters, "chapter")} · ${s.status}</span>
          </div>
        </a>`;
    }).join("");
    app.replaceChildren(el(`
      <section class="home">
        <header class="page-header">
          <h1>The Library</h1>
          <p class="subtitle">Stories written one chapter at a time.</p>
        </header>
        <div class="book-grid">${cards}</div>
      </section>`));
  }

  function renderSeries(series) {
    setTitle([series.title]);
    const books = series.books.map((b) => `
      <a class="volume" href="${bookHref(series, b)}">
        <span class="ch-num">${bookLabel(b.number)}</span>
        <h2>${b.subtitle}</h2>
        <p>${b.blurb}</p>
        <span class="book-meta">${plural(b.chapters.length, "chapter")} · ${b.status}</span>
      </a>`).join("");
    app.replaceChildren(el(`
      <section class="series">
        <a class="crumb" href="#/">← Library</a>
        <header class="page-header">
          <span class="book-genre">${series.genre} · Series</span>
          <h1>${series.title}</h1>
          <p class="subtitle">${series.blurb}</p>
        </header>
        ${seriesNav(series, "")}
        <div class="volume-list">${books}</div>
      </section>`));
  }

  function renderBook(series, book) {
    setTitle([book.subtitle, series.title]);
    const list = book.chapters.map((c) => `
      <li>
        <a href="${chapterHref(series, book, c)}">
          <span class="ch-num">${chapterLabel(c.number)}</span>
          <span class="ch-title">${c.title}</span>
          <span class="ch-pages">~${pages(c.body)} pages</span>
        </a>
      </li>`).join("");
    app.replaceChildren(el(`
      <section class="book">
        <a class="crumb" href="${seriesHref(series)}">← ${series.title}</a>
        <header class="page-header">
          <span class="book-genre">${series.title}</span>
          <h1><span class="book-number">${bookLabel(book.number)}</span>${book.subtitle}</h1>
          <p class="subtitle">${book.blurb}</p>
        </header>
        ${seriesNav(series, "")}
        <ol class="chapter-list">${list || "<li class='empty'>No chapters yet.</li>"}</ol>
      </section>`));
  }

  function renderChapter(series, book, n) {
    const idx = book.chapters.findIndex((c) => c.number === n);
    if (idx < 0) return renderNotFound();
    const c = book.chapters[idx];
    const prev = book.chapters[idx - 1];
    const next = book.chapters[idx + 1];
    setTitle([chapterLabel(c.number), book.subtitle, series.title]);
    app.replaceChildren(el(`
      <article class="chapter">
        <a class="crumb" href="${bookHref(series, book)}">← ${bookLabel(book.number)}: ${book.subtitle}</a>
        ${seriesNav(series, "")}
        <header class="chapter-header">
          <span class="book-genre">${series.title} · ${bookLabel(book.number)}: ${book.subtitle}</span>
          <span class="ch-num">${chapterLabel(c.number)}</span>
          <h1>${c.title}</h1>
        </header>
        <div class="prose">${window.renderMarkdown(c.body)}</div>
        <p class="chapter-end">End of ${chapterLabel(c.number)}</p>
        <nav class="chapter-pager">
          ${prev ? `<a href="${chapterHref(series, book, prev)}">← ${chapterLabel(prev.number)}</a>` : "<span></span>"}
          ${next ? `<a href="${chapterHref(series, book, next)}">${chapterLabel(next.number)} →</a>` : `<span class="muted">Next chapter coming soon</span>`}
        </nav>
      </article>`));
    if (window.Narrator) {
      window.Narrator.attach(app.querySelector(".chapter"), {
        title: `${chapterLabel(c.number)}. ${c.title}.`,
        mediaTitle: `${chapterLabel(c.number)}: ${c.title}`,
        series: series.title,
        album: `${bookLabel(book.number)}: ${book.subtitle}`,
        key: `${series.slug}/${book.number}/${c.number}`,
      });
    }
  }

  function renderExtra(series, id, rest) {
    const extra = series.extras.find((e) => e.id === id);
    const fn = window.EXTRAS[series.slug] && window.EXTRAS[series.slug][id];
    if (!extra || !fn) return renderNotFound();
    setTitle([extra.label, series.title]);
    app.replaceChildren(el(`
      <section class="extra extra-${id}">
        <a class="crumb" href="${seriesHref(series)}">← ${series.title}</a>
        ${seriesNav(series, id)}
        <div class="extra-body"></div>
      </section>`));
    fn(app.querySelector(".extra-body"), series, rest);
  }

  function renderNotFound() {
    setTitle(["Not found"]);
    app.replaceChildren(el(`<section class="home"><h1>Page not found</h1><p><a href="#/">Back to the library</a></p></section>`));
  }

  function route() {
    if (window.Narrator) window.Narrator.detach();
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    window.scrollTo(0, 0);
    if (parts.length === 0) return renderHome();
    if (parts[0] !== "s") return renderNotFound();
    const series = findSeries(parts[1]);
    if (!series) return renderNotFound();
    if (parts.length === 2) return renderSeries(series);
    if (parts[2] === "book") {
      const book = series.books.find((b) => b.number === Number(parts[3]));
      if (!book) return renderNotFound();
      if (parts.length === 4) return renderBook(series, book);
      if (parts[4] === "chapter") return renderChapter(series, book, Number(parts[5]));
      return renderNotFound();
    }
    return renderExtra(series, parts[2], parts.slice(3));
  }

  window.addEventListener("hashchange", route);
  route();
})();
