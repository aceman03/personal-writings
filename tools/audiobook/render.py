"""Render a chapter's reading plan to a recorded audiobook track with Kokoro,
a free, open-source neural text-to-speech model (Apache 2.0).

    python3 tools/audiobook/render.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin \
        --plans <dir from export-plan.js> [--chapters 1 2 3] [--narrator bm_george]

For each chapter it writes, under audio/<series>/book-<n>/:
    chapter-NN.mp3   the recording
    chapter-NN.js    the timing map: when each sentence of the plan starts and
                     ends, so the site can highlight, seek and cue sound effects.

The model files come from https://github.com/thewh1teagle/kokoro-onnx/releases
(model-files-v1.0). They are not kept in this repository.
"""
import argparse, json, os, random, subprocess, sys, tempfile, time
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SR = 24000

# Kokoro's English voices: b = British, a = American; f = female, m = male.
BRIT_M = ["bm_george", "bm_fable", "bm_lewis", "bm_daniel"]
BRIT_F = ["bf_emma", "bf_isabella", "bf_alice", "bf_lily"]
US_M = ["am_michael", "am_fenrir", "am_onyx", "am_eric", "am_adam", "am_liam", "am_echo", "am_puck"]
US_F = ["af_heart", "af_bella", "af_kore", "af_nova", "af_sarah", "af_aoede", "af_jessica", "af_sky", "af_river", "af_nicole"]

# The cast. Characters who share a scene get different voices; the orcs of the
# Steppe and the dwarves get American voices, to set them apart from the
# Hearthlanders. Anyone not listed is cast from their voice profile.
CAST = {
    "aldric-vane": "bm_daniel", "nyx-thornbriar": "bf_emma", "hask-morrow": "bm_lewis", "pip": "bf_lily",
    "dagny-holt": "bf_isabella", "toman": "am_liam", "sir-bram": "am_liam", "brother-fen": "am_echo",
    "collum": "am_adam", "meg-ashby": "af_sky",
    "kell": "bf_alice", "pell": "am_eric", "venn": "am_puck", "ansel": "am_michael", "tamsin": "af_bella",
    "brokk": "am_fenrir", "hagra-stonebrow": "af_river",
    "vessa": "af_kore", "urzag": "am_onyx", "marrak": "am_eric", "ryssa": "af_sky", "ulla": "af_sarah", "edric": "am_adam",
    "oren-vasse": "bm_daniel", "corvel": "am_puck", "queen": "af_nicole", "king-haldren": "am_echo",
    "greaves": "am_michael", "wrenna": "af_heart", "penn": "bf_isabella", "quill": "am_eric", "maudrin": "am_onyx",
    "steward": "am_liam", "nurse": "bf_isabella", "market-mother": "af_jessica",
    "edda-marsh": "bf_alice", "teodric-hale": "bm_daniel", "ilsabet-corrow": "af_aoede", "archmagus": "af_sarah",
    "lark": "af_nova", "student": "af_jessica", "tam-marsh": "am_adam",
    "sereth": "bf_alice", "tyriel": "af_heart", "young-dawnwarden": "am_liam",
    "soldier": "am_echo", "camp-woman": "af_jessica", "camp-man": "am_fenrir",
}

# Moods bend the pace and loudness of a line. Neural voices sound best with
# gentle changes, so these are half the strength of the device-voice settings.
MOOD = {
    "calm": (1.0, 1.0), "warm": (0.98, 1.0), "awe": (0.95, 0.97), "hushed": (0.95, 0.82), "whisper": (0.93, 0.7),
    "shaken": (0.98, 0.92), "tense": (1.03, 1.0), "urgent": (1.07, 1.0), "dread": (0.94, 0.93), "grief": (0.93, 0.88),
    "stern": (0.98, 1.0), "menacing": (0.91, 0.95), "wonder": (0.96, 0.97), "dry": (1.01, 1.0),
}


def cast_for(speaker, profile, narrator_voices):
    v = CAST.get(speaker)
    if not v:
        p = profile or {}
        brit = (p.get("accent") or "en-GB").lower().startswith("en-gb")
        pool = (BRIT_F if brit else US_F) if p.get("gender") == "female" else (BRIT_M if brit else US_M)
        v = pool[sum(map(ord, speaker or "x")) % len(pool)]
    if v in narrator_voices:  # never let a character share the narrator's voice
        for alt in (BRIT_M + US_M) if v[1] == "m" else (BRIT_F + US_F):
            if alt not in narrator_voices:
                return alt
    return v


def lang_of(voice):
    return "en-gb" if voice.startswith("b") else "en-us"


def narrator_style(kokoro, spec):
    """A voice name, or a blend such as "bm_george:0.6+bm_lewis:0.4".
    Returns the style and the list of voices in it."""
    if "+" not in spec and ":" not in spec:
        return spec, [spec]
    style, names = 0, []
    for part in spec.split("+"):
        name, _, w = part.partition(":")
        style = style + float(w or 1) * kokoro.get_voice_style(name.strip())
        names.append(name.strip())
    return style, names


def shift_pitch(audio, semitones):
    """Lower or raise pitch without changing speed, keeping the voice's formants
    (so it sounds deeper, not slowed down or cartoonish)."""
    if not semitones or not len(audio):
        return audio
    with tempfile.TemporaryDirectory() as d:
        a, b = os.path.join(d, "in.wav"), os.path.join(d, "out.wav")
        sf.write(a, audio, SR)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", a, "-af",
                        f"rubberband=pitch={2 ** (semitones / 12)}:formant=preserved:pitchq=quality", b], check=True)
        out, _ = sf.read(b, dtype="float32")
    return out


def render_chapter(kokoro, plan_file, narrator, pace, narrator_pitch=0.0):
    narrator_voice, narrator_names = narrator_style(kokoro, narrator)
    narrator_name = narrator_names[0]
    data = json.load(open(plan_file))
    plan, profiles = data["plan"], data["profiles"]
    rng = random.Random(data["chapter"])  # the same pauses every time it's rebuilt
    pieces, times, t = [], [], 0.0
    for c in plan:
        text = c["text"].strip()
        if c["dialogue"] and c["speaker"]:
            voice = cast_for(c["speaker"], profiles.get(c["speaker"]), narrator_names)
            prof = profiles.get(c["speaker"]) or {}
            mood = c["mood"] or prof.get("mood") or "calm"
            rate = 1 + ((prof.get("rate") or 1) - 1) * 0.5
        else:
            voice, mood, rate = narrator_voice, c["mood"] or "calm", 1.0
        speed, gain = MOOD.get(mood, (1.0, 1.0))
        speed *= pace * rate
        if c["isTitle"]:
            speed *= 0.94
        if c["tag"]:
            speed *= 1.05; gain *= 0.95
        audio = np.zeros(0, dtype=np.float32)
        if any(ch.isalnum() for ch in text):
            is_narrator = voice is narrator_voice
            lang = lang_of(narrator_name if is_narrator else voice)
            audio, _ = kokoro.create(text, voice=voice, speed=float(max(0.6, min(1.6, speed))), lang=lang)
            audio = audio.astype(np.float32)
            if is_narrator:
                audio = shift_pitch(audio, narrator_pitch)
            audio = audio * gain
        times.append([round(t, 3), round(t + len(audio) / SR, 3)])
        t += len(audio) / SR
        gap = c["gap"] / 1000 * (0.9 + rng.random() * 0.2)
        pieces += [audio, np.zeros(int(gap * SR), dtype=np.float32)]
        t += gap
    track = np.concatenate(pieces)
    peak = float(np.max(np.abs(track))) or 1.0
    track = track / peak * 0.89  # normalize to just under full scale
    return data, track, times


def write_index():
    """audio/index.js: which chapters have a recording, so the site never asks for one that doesn't exist."""
    keys = {}
    base = os.path.join(ROOT, "audio")
    for series in sorted(os.listdir(base)):
        sdir = os.path.join(base, series)
        if not os.path.isdir(sdir):
            continue
        for book in sorted(os.listdir(sdir)):
            for f in sorted(os.listdir(os.path.join(sdir, book))):
                if f.startswith("chapter-") and f.endswith(".js") and os.path.exists(os.path.join(sdir, book, f[:-3] + ".mp3")):
                    keys[f"{series}/{book[5:]}/{int(f[8:10])}"] = True
    with open(os.path.join(base, "index.js"), "w") as fh:
        fh.write("// Generated by tools/audiobook/render.py: the chapters that have recorded narration.\n")
        fh.write(f"window.AUDIOBOOK_INDEX = {json.dumps(keys)};\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True)
    ap.add_argument("--voices", required=True)
    ap.add_argument("--plans", required=True)
    ap.add_argument("--chapters", nargs="*", type=int)
    ap.add_argument("--narrator", default="bm_george:0.5+bm_fable:0.5")
    ap.add_argument("--narrator-pitch", type=float, default=-2.0, help="semitones, e.g. -1.5 for a deeper narrator")
    ap.add_argument("--pace", type=float, default=0.97)
    ap.add_argument("--bitrate", default="48k")
    args = ap.parse_args()
    kokoro = Kokoro(args.model, args.voices)
    files = sorted(f for f in os.listdir(args.plans) if f.endswith(".json"))
    if args.chapters:
        files = [f for f in files if int(f[8:10]) in args.chapters]
    for f in files:
        start = time.time()
        data, track, times = render_chapter(kokoro, os.path.join(args.plans, f), args.narrator, args.pace, args.narrator_pitch)
        out_dir = os.path.join(ROOT, "audio", data["series"], f"book-{data['book']}")
        os.makedirs(out_dir, exist_ok=True)
        base = os.path.join(out_dir, f[:-5])
        with tempfile.NamedTemporaryFile(suffix=".wav") as tmp:
            sf.write(tmp.name, track, SR)
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp.name, "-ac", "1", "-ar", str(SR),
                            "-c:a", "libmp3lame", "-b:a", args.bitrate,
                            "-metadata", f"title=Chapter {data['chapter']}", "-metadata", "artist=The Day the Gods Went Silent",
                            base + ".mp3"], check=True)
        key = f"{data['series']}/{data['book']}/{data['chapter']}"
        manifest = {
            "src": os.path.relpath(base + ".mp3", ROOT).replace(os.sep, "/"),
            "narrator": args.narrator, "duration": round(len(track) / SR, 2),
            "chunks": len(data["plan"]), "starts": [c["start"] for c in data["plan"]], "times": times,
        }
        with open(base + ".js", "w") as fh:
            fh.write("// Generated by tools/audiobook/render.py. Timing map for the recorded narration.\n")
            fh.write(f"(window.AUDIOBOOKS = window.AUDIOBOOKS || {{}})[{json.dumps(key)}] = {json.dumps(manifest, separators=(',', ':'))};\n")
        write_index()
        mins = len(track) / SR / 60
        print(f"{f}: {mins:.1f} min of audio in {(time.time() - start) / 60:.1f} min", flush=True)


if __name__ == "__main__":
    sys.exit(main())
