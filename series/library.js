// Registry of every series in the library.
// A series holds books; a book holds chapters. Series-level extras (maps,
// codexes) apply to every book in the series.
//
// To add a chapter: create series/<series>/book-N/chapter-NN.js that calls
//   registerChapter("<series>", N, { number, title, body })
// and add a <script> tag for it in index.html.
window.LIBRARY = {
  series: [
    {
      slug: "the-day-the-gods-went-silent",
      title: "The Day the Gods Went Silent",
      genre: "Fantasy Survival",
      blurb:
        "For a thousand years the gods of the Bright Court answered every prayer. " +
        "Then, one morning, they stopped. The Hollow Choir did not.",
      status: "In progress",
      extras: [
        { id: "map", label: "World Map" },
        { id: "spellcraft", label: "Spellcrafting" },
      ],
      books: [
        {
          number: 1,
          subtitle: "The Last Dawn",
          blurb: "The morning Aurem did not answer, and everything that came after.",
          status: "In progress",
          chapters: [],
        },
      ],
    },
  ],
};

window.registerChapter = function (seriesSlug, bookNumber, chapter) {
  const series = window.LIBRARY.series.find((s) => s.slug === seriesSlug);
  if (!series) throw new Error("Unknown series: " + seriesSlug);
  const book = series.books.find((b) => b.number === bookNumber);
  if (!book) throw new Error(`Unknown book ${bookNumber} in ${seriesSlug}`);
  book.chapters.push(chapter);
  book.chapters.sort((a, b) => a.number - b.number);
};
