# Vice Coast Cover Studio

[![Built with make.fun](https://img.shields.io/badge/built%20with-make.fun-ff4d8d)](https://make.fun)
[![Bounty: GTA 6 Cover Art](https://img.shields.io/badge/bounty-gta6--cover--art--01-7c3aed)](https://make.fun/bounty/gta6-cover-art-01)
[![Entry: Vice Coast Cover Studio](https://img.shields.io/badge/entry-vice--coast--cover--studio-2dd4bf)](https://make.fun/bounty/gta6-cover-art-01)

An entry for the [GTA 6 Cover Art bounty](https://make.fun/bounty/gta6-cover-art-01) on make.fun.

Vice Coast Cover Studio turns your photos and a caption into GTA-style
multi-panel cover art — one big hero panel plus four smaller ones, bold
Anton lettering across the foot, and a Vice City sunset or neon grade —
then exports it as a PNG to share. It runs entirely offline in the browser:
your photos are read on your own machine and never uploaded.

## What it does

- **Any photo** — pick files from your machine, or drag and drop them
  anywhere onto the page. Two built-in samples ("neon driver" and
  "sunset pier") are included so you can try it with no photos at hand.
- **Five panels** — click a photo to drop it into the selected panel, or
  fill every panel with one photo. Click a panel in the preview to select
  it, drag it to reposition the photo, scroll to zoom.
- **Frame the panel** — sliders for Zoom, Shift across and Shift up-down,
  plus Reset framing.
- **Caption** — editable Title and Tagline, and three colour grades:
  Neon Nights, Sunset Gold and Pastel Vice.
- **Export** — one click saves a PNG at 1080 × 1080, 1080 × 1350 or
  1920 × 1080.

Four numbered steps take you from a photo to a poster: **1 Photos,
2 Frame the panel, 3 Caption, 4 Export**. The live preview and the
exported PNG are painted by the same code (`drawCover` in
`app/src/render.js`), so what you see is exactly what you save — the
preview only adds the dashed ring around the selected panel.

## Try it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. No build step, no
network requests — every script, font and image is a file under `app/`.

## Screenshots

The fixed scenes are listed in `shots.json` and rendered by `?shot=`:

| Shot | Scene |
| --- | --- |
| `1-cover.jpg` | `?shot=cover` — the NEON COAST landscape cover |
| `2-editor.jpg` | `?shot=editor` — the editor on the SUNSET KING cover |
| `3-cover.jpg` | `?shot=cover-portrait` — the SUNSET KING portrait cover |
| `4-editor.jpg` | `?shot=editor-neon` — the editor on the NEON COAST cover |

## Layout

- `main.ts` — hands the app in: copies `app/` and `screenshots/` to the
  output directory and writes `dossier.json` (run with
  `MAKEFUN_OUTPUT_DIR=out node main.ts`).
- `serve.ts` — a tiny static server for local testing.
- `app/index.html`, `app/style.css` — the editor page and its look.
- `app/src/main.js` — wires the editor: photos, framing, caption, export.
- `app/src/panels.js` — the five-panel layout and framing math.
- `app/src/render.js` — paints the cover (panels, grade, caption).
- `app/src/grades.js` — the three colour grades.
- `app/src/photos.js` — the photo tray and the built-in samples.
- `app/src/shots.js` — the deterministic `?shot=` scenes.
- `app/fonts/Anton-Regular.ttf` — the Anton typeface (SIL Open Font
  License 1.1, see `app/fonts/OFL.txt`).
- `app/samples/` — the two sample photos.

## Originality

Everything in this entry is original or freely licensed. There are no
Rockstar Games logos, artwork, characters or fonts anywhere in the app:
the only typeface is Anton, shipped under the SIL Open Font License, and
the sample photos were made with an image model for make.fun and are free
to use.

## License

MIT — see [LICENSE](LICENSE).
