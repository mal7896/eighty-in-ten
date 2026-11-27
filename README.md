# Eighty in Ten

A study site for TMSCA and UIL Number Sense, middle school and high school: lessons for each shortcut, practice rounds (Normal, No Enter, Hardcore or Test answering; 10 to 80 problems), sprints, an arithmetic warm-up, an estimation drill, full 80-problem tests with shareable test codes, printable tests in the UIL layout with an answer key, a Memorize section (with harder sets: squares to 125, cubes to 50), progress tracking, and Display and reading settings (text size, high contrast, a low-vision font, reduced motion, an always-on number pad).

**Use it:** Open the website directly linked here: https://mal7896.github.io/eighty-in-ten/. Or, open the site from GitHub Pages (see below). Everything runs in the browser; progress is saved in each student's own browser. To move progress to another device or browser, use **Progress → Use another device**.

## Layout

| Path | What it is |
| --- | --- |
| `src/` | Source: `core.js` (exact fractions, rendering), `gens_*.js` (problem generators; `gens_new.js` has the newest types), `tricks.js` (lessons), `engine.js` (tests, codes, progress), `memo.js` (Memorize), `app.js` (interface), `style.css` |
| `build.py` | Bundles `src/` into one HTML page, then runs `tools/site.js` |
| `docs/` | The built site that GitHub Pages serves: the app (`index.html`), a page for every trick (`tricks/`), the practice-test page with printable PDFs (`practice-tests/`), `sitemap.xml` and the icons |
| `tools/` | `site.js` writes the trick and practice-test pages and the sitemap; `pdfs.py` prints the tests in `tests.json` to PDF |
| `src/icons/`, `src/public/` | Icons, and files that must sit at the site root (the Google Search Console check file); copied into `docs/` |
| `dist/` | Other build outputs (artifact page and a local preview) |
| `test/` | Checks: every generator against independent answers, KaTeX rendering, Memorize, progress transfer, and a browser run-through |

## Build

```sh
python3 build.py          # writes docs/ and dist/
python3 tools/pdfs.py     # only when generators change or tests.json does: reprints the PDF practice tests
```

The printable tests are fixed test codes (`tools/tests.json`), so a PDF and the same code entered in the app give the same test. If a generator changes, run `tools/pdfs.py` and then `build.py` again so the two still match.

## Tests

The tests need KaTeX installed locally:

```sh
cd vendor && npm install && cd ..
node test/verify.js       # checks thousands of generated problems against independent answers
node test/latex.js        # every prompt, step and lesson renders
node test/memo.js
node test/transfer.js
node test/difficulty.js   # difficulty levels: ordering, variety, and match to real tests (test/real_profile.json)
python3 test/e2e.py       # browser run-through (needs Playwright + Chrome)
python3 test/e2e_difficulty.py
python3 test/e2e_features.py   # answering modes, round length, warm-up, estimation, picker, printing
python3 test/e2e_display.py    # Display and reading: text size, contrast, font, motion, number pad
```

## Publishing

GitHub Pages is set to serve the `docs/` folder on the `main` branch. After changing anything in `src/`, run `python3 build.py`, commit, and push; the site updates within a minute or two.

The site address is set once, as `SITE_URL` in `build.py`; it goes into the canonical links and the sitemap. If the site moves to its own domain, change it there and rebuild. Search engines find the pages through `https://mal7896.github.io/eighty-in-ten/sitemap.xml`, submitted in Google Search Console and Bing Webmaster Tools.
