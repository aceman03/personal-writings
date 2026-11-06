// Registry of every book in the library.
// To add a book: add an entry here, then create books/<slug>/chapter-NN.js
// files that call registerChapter(slug, {...}) and list them in index.html.
window.LIBRARY = {
  books: [
    {
      slug: "the-day-the-gods-went-silent",
      title: "The Day the Gods Went Silent",
      genre: "Fantasy Survival",
      blurb:
        "For a thousand years the gods of the Bright Court answered every prayer. " +
        "Then, one morning, they stopped. The Hollow Choir did not.",
      status: "In progress",
      // Extra sections shown on this book's page, beyond the chapter list.
      extras: [
        { id: "map", label: "World Map" },
        { id: "spellcraft", label: "Spellcrafting" },
      ],
      chapters: [],
    },
  ],
};

window.registerChapter = function (slug, chapter) {
  const book = window.LIBRARY.books.find((b) => b.slug === slug);
  if (!book) throw new Error("Unknown book: " + slug);
  book.chapters.push(chapter);
  book.chapters.sort((a, b) => a.number - b.number);
};
