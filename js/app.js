// Hash router and page rendering for the Story Library.
// Routes:
//   #/                          home: list of books
//   #/book/<slug>               book page: chapters + extras
//   #/book/<slug>/chapter/<n>   a chapter
//   #/book/<slug>/<extraId>     a book-specific extra (map, spellcraft, ...)
(function () {
  const app = document.getElementById("app");
  // Book-specific extra pages register themselves here: EXTRAS[slug][id] = fn(container, book)
  window.EXTRAS = window.EXTRAS || {};

  const NUMBER_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
    "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen",
    "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty"];
  const chapterLabel = (n) => "Chapter " + (NUMBER_WORDS[n] || n);

  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content;
  }

  function findBook(slug) {
    return window.LIBRARY.books.find((b) => b.slug === slug);
  }

  function setTitle(parts) {
    document.title = [...parts, "Story Library"].join(" · ");
  }

  function bookNav(book, active) {
    const tabs = [{ id: "", label: "Chapters" }, ...book.extras];
    return `
      <nav class="book-tabs">
        ${tabs
          .map(
            (t) => `<a href="#/book/${book.slug}${t.id ? "/" + t.id : ""}"
                       class="${active === t.id ? "active" : ""}">${t.label}</a>`
          )
          .join("")}
      </nav>`;
  }

  function renderHome() {
    setTitle([]);
    const cards = window.LIBRARY.books
      .map(
        (b) => `
        <a class="book-card" href="#/book/${b.slug}">
          <div class="book-spine"></div>
          <div class="book-card-body">
            <span class="book-genre">${b.genre}</span>
            <h2>${b.title}</h2>
            <p>${b.blurb}</p>
            <span class="book-meta">${b.chapters.length} chapter${b.chapters.length === 1 ? "" : "s"} · ${b.status}</span>
          </div>
        </a>`
      )
      .join("");
    app.replaceChildren(
      el(`
      <section class="home">
        <header class="page-header">
          <h1>The Library</h1>
          <p class="subtitle">Books written one chapter at a time.</p>
        </header>
        <div class="book-grid">${cards}</div>
      </section>`)
    );
  }

  function renderBook(book) {
    setTitle([book.title]);
    const list = book.chapters
      .map(
        (c) => `
        <li>
          <a href="#/book/${book.slug}/chapter/${c.number}">
            <span class="ch-num">${chapterLabel(c.number)}</span>
            <span class="ch-title">${c.title}</span>
          </a>
        </li>`
      )
      .join("");
    app.replaceChildren(
      el(`
      <section class="book">
        <a class="crumb" href="#/">← Library</a>
        <header class="page-header">
          <span class="book-genre">${book.genre}</span>
          <h1>${book.title}</h1>
          <p class="subtitle">${book.blurb}</p>
        </header>
        ${bookNav(book, "")}
        <ol class="chapter-list">${list || "<li class='empty'>No chapters yet.</li>"}</ol>
      </section>`)
    );
  }

  function renderChapter(book, n) {
    const idx = book.chapters.findIndex((c) => c.number === n);
    if (idx < 0) return renderNotFound();
    const c = book.chapters[idx];
    const prev = book.chapters[idx - 1];
    const next = book.chapters[idx + 1];
    setTitle([chapterLabel(c.number), book.title]);
    app.replaceChildren(
      el(`
      <article class="chapter">
        <a class="crumb" href="#/book/${book.slug}">← ${book.title}</a>
        ${bookNav(book, "")}
        <header class="chapter-header">
          <span class="ch-num">${chapterLabel(c.number)}</span>
          <h1>${c.title}</h1>
        </header>
        <div class="prose">${window.renderMarkdown(c.body)}</div>
        <p class="chapter-end">End of ${chapterLabel(c.number)}</p>
        <nav class="chapter-pager">
          ${prev ? `<a href="#/book/${book.slug}/chapter/${prev.number}">← ${chapterLabel(prev.number)}</a>` : "<span></span>"}
          ${next ? `<a href="#/book/${book.slug}/chapter/${next.number}">${chapterLabel(next.number)} →</a>` : `<span class="muted">Next chapter coming soon</span>`}
        </nav>
      </article>`)
    );
  }

  function renderExtra(book, id) {
    const extra = book.extras.find((e) => e.id === id);
    const fn = window.EXTRAS[book.slug] && window.EXTRAS[book.slug][id];
    if (!extra || !fn) return renderNotFound();
    setTitle([extra.label, book.title]);
    app.replaceChildren(
      el(`
      <section class="extra extra-${id}">
        <a class="crumb" href="#/book/${book.slug}">← ${book.title}</a>
        ${bookNav(book, id)}
        <div class="extra-body"></div>
      </section>`)
    );
    fn(app.querySelector(".extra-body"), book);
  }

  function renderNotFound() {
    setTitle(["Not found"]);
    app.replaceChildren(el(`<section class="home"><h1>Page not found</h1><p><a href="#/">Back to the library</a></p></section>`));
  }

  function route() {
    const parts = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    window.scrollTo(0, 0);
    if (parts.length === 0) return renderHome();
    if (parts[0] !== "book") return renderNotFound();
    const book = findBook(parts[1]);
    if (!book) return renderNotFound();
    if (parts.length === 2) return renderBook(book);
    if (parts[2] === "chapter") return renderChapter(book, Number(parts[3]));
    return renderExtra(book, parts[2]);
  }

  window.addEventListener("hashchange", route);
  route();
})();
