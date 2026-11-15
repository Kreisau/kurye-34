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

## Game rules worth knowing
- A shift is 5 deliveries (`NDEL`). Earnings sit in the shift pot (`G.shift.earned`) and reach `G.S.money` only when the
  player banks (cash-out) or finishes all five. A failed delivery loses the pot, never progress.
- Cards live in `CARDS` (`js/config.js`): six cards, three offered when a shift starts, the pick lasts the whole shift.
- Progress is the count of successful deliveries (`G.S.pd`): `ZONE_DEL` (12) take a district, `LVL_DEL` (6) raise the level (pay, length,
  traffic). Clues come with the first five conquests, Kara waits in the last district. After the ending the player picks the district (`G.S.fz`).
- Delivery time comes from the district's reference bike (`ZREF`, `timeFor`), not from the rider's bike. Top speed may exceed `maxSpeed`
  up to `TOPCAP`; `update()` sub-steps for that. Fines and fight bonuses scale with the base fee / level.
- Traffic rule: every lane change is signalled and never starts within the rider's reach (`wantLane`, `nearRider`); keep new traffic behaviour inside it.
- Parts (engine, bag, nitro; indexes 0, 2, 4 of `G.S.upg`, 5 levels, `UPMAX`) belong to the rider, not to a bike. Indexes 1 and 3 are retired.
- Cosmetics (paint, helmet; `PAINT`/`HELM` in config, `G.S.cos`) change only the rider's sprite, never gameplay.
- Story lines spoken during rides are in `js/radio.js`, keyed by case-file progress.

- Game systems are documented in `docs/WIKI.md`. When a rule, price, stat, fine or card changes, update the wiki in the same commit.

## Run and test
```
python3 -m http.server 8765          # from the repo root
python3 tools/<test>.py http://127.0.0.1:8765 [shotdir]
```
Tests (headless Chrome via Playwright): `street_test`, `meta_test`, `rival_test`, `amb_test`, `shift_test`, `camera_test`, `joy_test`,
`play_tutorial`, `i18n_check`, `ui_scan` (add `--fonts <@fontsource/rubik dir>` for real font metrics).
Balance: `tools/ride_bot.py` (rule-based rider, run it after any balance change; `MODE=bikes`, `MODE=boss`) and `tools/econ_sim.py` (economy model).
`tools/sound_demo.py` renders sounds offline to WAV for listening checks.

## Layout
See the table in `README.md`. Shared mutable state lives in `G` (`js/g.js`); constants in `js/config.js`.
