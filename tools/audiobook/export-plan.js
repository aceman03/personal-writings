// Export the reading plan of each chapter: the sentences, speakers, moods and
// pauses exactly as the site's narrator splits them, so the recorded audio lines
// up with the words on the page.
//
//   node tools/audiobook/export-plan.js <out-dir> [chapter numbers...]
//
// Needs Playwright (and its Chromium). Writes <out-dir>/chapter-NN.json.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const SERIES = "the-day-the-gods-went-silent";
const BOOK = 1;
const root = path.resolve(__dirname, "../..");
const out = path.resolve(process.argv[2] || "audiobook-plans");
let chapters = process.argv.slice(3).map(Number);

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  // A silent stand-in for speech synthesis, so the narrator attaches headless.
  await page.addInitScript(() => {
    Object.defineProperty(window, "speechSynthesis", { configurable: true,
      value: { getVoices: () => [], addEventListener() {}, speak() {}, cancel() {}, pause() {}, resume() {} } });
    window.SpeechSynthesisUtterance = function (t) { this.text = t; };
  });
  await page.goto("file://" + path.join(root, "index.html"));
  await page.waitForTimeout(300);
  if (!chapters.length) {
    chapters = await page.evaluate(({ s, b }) =>
      window.LIBRARY.series.find((x) => x.slug === s).books.find((x) => x.number === b).chapters.map((c) => c.number), { s: SERIES, b: BOOK });
  }
  for (const n of chapters) {
    await page.goto("file://" + path.join(root, "index.html") + `#/s/${SERIES}/book/${BOOK}/chapter/${n}`);
    await page.waitForTimeout(400);
    const data = await page.evaluate(() => ({ plan: window.Narrator.plan(), profiles: window.VOICE_PROFILES || {} }));
    if (!data.plan) throw new Error("No narration plan for chapter " + n);
    const file = path.join(out, `chapter-${String(n).padStart(2, "0")}.json`);
    fs.writeFileSync(file, JSON.stringify({ series: SERIES, book: BOOK, chapter: n, ...data }));
    console.log(file, data.plan.length, "chunks");
  }
  await browser.close();
})();
