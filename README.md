# Personal Writings

Books written chapter by chapter, published as a small static website.

**Read it online:** https://aceman03.github.io/personal-writings/ (once GitHub Pages is turned on).
You can also download the repo and open `index.html` in a browser; there is no build step.

## Pages

- **Home**: every book in the library.
- **Book**: its chapter list, plus any extra sections the book defines.
- **The Day the Gods Went Silent** extras:
  - **World Map**: an interactive map of Caelmar. Click a place to read about it, and
    toggle "after the Silence" to watch the Thornwall go dark.
  - **Spellcrafting**: the Spellcrafter's Codex. It covers the two parts of magic,
    the anatomy of a circle, the Vaelic glyph lexicon, how conduits behave (curves
    against angles, angle sharpness, thickness, tapering, glyph size, flow direction,
    the Seal), fireball variants, and an interactive circle workshop.

## Adding a chapter

1. Create `books/<slug>/chapter-NN.js` that calls
   `registerChapter("<slug>", { number, title, body })`, where `body` is Markdown.
2. Add a `<script>` tag for it in `index.html`.

## Adding a book

Add an entry to `books/books.js`. Extra pages are optional: list them in `extras`
and register a render function on `window.EXTRAS[slug][id]`.
