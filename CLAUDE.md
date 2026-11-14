# Kurye 34: working notes for Claude

Browser game, plain ES modules, no build step. Live on GitHub Pages from `main`; the repo is public, so nothing
personal goes into it (no names, contact details or anything about the owner beyond the code).

## Rules
- Never use real car brands or model names anywhere, plates included. Vehicles only resemble stereotypes visually.
- The game text is Turkish. Every new on-screen string needs its English in `js/i18n.js`
  (`tools/i18n_check.py` lists anything missing). Place names, restaurant names and shop signs stay Turkish.
- Mobile first: check iPhone portrait, small phones (320 px wide), iPad and landscape.
- No overlapping UI: run `tools/ui_scan.py` after any HUD, menu or CSS change.
- After changing files, bump `VERSION` in `sw.js` (and add new files to its list) and the version label in `index.html`.

## Run and test
```
python3 -m http.server 8765          # from the repo root
python3 tools/<test>.py http://127.0.0.1:8765 [shotdir]
```
Tests (headless Chrome via Playwright): `street_test`, `meta_test`, `rival_test`, `amb_test`, `camera_test`, `joy_test`,
`play_tutorial`, `i18n_check`, `ui_scan` (add `--fonts <@fontsource/rubik dir>` for real font metrics).
`tools/sound_demo.py` renders sounds offline to WAV for listening checks.

## Layout
See the table in `README.md`. Shared mutable state lives in `G` (`js/g.js`); constants in `js/config.js`.
