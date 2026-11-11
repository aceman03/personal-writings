# Recorded narration

The site reads chapters aloud with recorded audio when a chapter has it, and
with the reader's device voice when it doesn't. The recordings are made here,
for free, with [Kokoro](https://github.com/hexgrad/kokoro), an open-source
neural text-to-speech model (Apache 2.0), through
[kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx).

Recordings live in `audio/<series>/book-<n>/`:

- `chapter-NN.mp3`: the narration, with the cast voicing their own dialogue.
- `chapter-NN.js`: the timing map, the start and end of every sentence in the
  recording. The site uses it to highlight the words being read, to jump to a
  clicked word, and to cue the ambience and sound effects.

A recording is only used if it was made from the chapter's current text. If a
chapter changes, render it again, or the site falls back to the device voice.

## Making a recording

```sh
pip install kokoro-onnx soundfile        # and ffmpeg on the PATH
# model files, once (not kept in the repo):
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin

# 1. Export how the site splits each chapter into sentences, speakers and moods
#    (needs Playwright with Chromium).
node tools/audiobook/export-plan.js /tmp/plans 16       # chapter numbers, or none for all

# 2. Record.
python3 tools/audiobook/render.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin \
    --plans /tmp/plans --chapters 16 --narrator bm_george
```

## Voices

The narrator is set with `--narrator`, either one voice (`bm_george`) or a blend
(`bm_george:0.6+bm_lewis:0.4`). `--narrator-pitch -1.5` lowers the narrator by
that many semitones, keeping the voice's natural character; the cast is not
affected. The cast is in `CAST` at the top of
`render.py`; anyone not listed is cast from their voice profile in the series'
`characters.js`. Moods from the chapter markup set the pace and loudness of
each line, and the pauses come from the same plan the device voice uses.
