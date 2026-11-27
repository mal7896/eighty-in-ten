# Eighty in Ten

A study site for TMSCA and UIL Number Sense, middle school and high school: lessons for each shortcut, drills, sprints, full 80-problem tests with shareable test codes, a Memorize section, and progress tracking.

**Use it:** open the site from GitHub Pages (see below). Everything runs in the browser; progress is saved in each student's own browser. To move progress to another device or browser, use **Progress → Use another device**.

## Layout

| Path | What it is |
| --- | --- |
| `src/` | Source: `core.js` (exact fractions, rendering), `gens_*.js` (problem generators), `tricks.js` (lessons), `engine.js` (tests, codes, progress), `memo.js` (Memorize), `app.js` (interface), `style.css` |
| `build.py` | Bundles `src/` into one HTML page |
| `docs/index.html` | The built site that GitHub Pages serves |
| `dist/` | Other build outputs (artifact page and a local preview) |
| `test/` | Checks: every generator against independent answers, KaTeX rendering, Memorize, progress transfer, and a browser run-through |

## Build

```sh
python3 build.py          # writes docs/index.html and dist/
```

## Tests

The tests need KaTeX installed locally:

```sh
cd vendor && npm install && cd ..
node test/verify.js       # checks thousands of generated problems against independent answers
node test/latex.js        # every prompt, step and lesson renders
node test/memo.js
node test/transfer.js
python3 test/e2e.py       # browser run-through (needs Playwright + Chrome)
```

## Publishing

GitHub Pages is set to serve the `docs/` folder on the `main` branch. After changing anything in `src/`, run `python3 build.py`, commit, and push; the site updates within a minute or two.
