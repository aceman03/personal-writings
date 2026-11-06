# Personal Writings

Books written chapter by chapter, published as a small static website.

**Read it online:** https://aceman03.github.io/personal-writings/ (once GitHub Pages is turned on).
You can also download the repo and open `index.html` in a browser; there is no build step.

## Structure

- **Home**: every series in the library.
- **Series**: its books, plus series-wide extras.
- **Book**: its chapters, with an approximate printed page count for each.

### The Day the Gods Went Silent

- **Book One: The Last Dawn**
- **Characters**: everyone introduced so far, each with a portrait and a spoiler-free
  description. Characters live in `characters.js`. Portraits are drawn in code by
  `portraits.js`, and any character can use real artwork by setting `image`.
- **World Map**: an interactive map of Caelmar. Click a place to read about it, and
  toggle "after the Silence" to watch the Thornwall go dark.
- **Spellcrafting**: the Spellcrafter's Codex. It covers the two parts of magic, the
  anatomy of a circle, the Vaelic glyph lexicon, how conduits behave, fireball
  variants, and an interactive circle workshop.

## Voice-over

Every chapter has a narration player along the bottom of the page (`js/narrator.js`).
It uses the browser's built-in speech voices, so it's free and needs no setup:

- Play and pause, skip a sentence back or forward, or drag the progress bar.
- Once narration has started, click any word to jump there. Space toggles play.
- It prefers a deep, unhurried storyteller voice (Daniel, Ryan, George, Google UK
  English Male and similar), reads a little slower and lower than normal, pauses
  longer at paragraph and scene breaks, and shifts slightly for dialogue.
- Dialogue is read in a voice cast for each character (gender, age, accent and pitch
  from the character's voice profile in `characters.js`), chosen from the voices on
  the reader's device. Settings shows who's voicing whom.
- Scenes and lines carry a mood that bends the speed, pitch, volume and pauses:
  calm, warm, awe, wonder, hushed, whisper, shaken, tense, urgent, dread, grief,
  stern, dry and menacing.
- An optional low ambient drone plays under the narration.
- It remembers where you stopped in each chapter.

How it sounds depends on the voices your device has installed.

### Narration markup in chapter text

Readers never see these tags. They only steer the voice-over.

```
{{mood: dread}}                              on its own line: narrator mood from here on
{{corvel}}"Is it a bad one?"{{/}}            who says a line (a voice profile id)
{{corvel, hushed}}"Is it a bad one?"{{/}}    ...and how they say it
```

## Files

```
series/library.js                         registry of series and books
series/<series>/book-N/chapter-NN.js      chapter text (Markdown)
series/<series>/map.js, spellcraft.js...  series-wide extras
```

## Adding a chapter

1. Create `series/<series>/book-N/chapter-NN.js` that calls
   `registerChapter("<series>", N, { number, title, body })`, where `body` is Markdown.
2. Add a `<script>` tag for it in `index.html`.

## Adding a book or series

Add a book to a series' `books` list in `series/library.js`, or add a new series
entry. Series extras are optional: list them in `extras` and register a render
function on `window.EXTRAS[seriesSlug][id]`.
