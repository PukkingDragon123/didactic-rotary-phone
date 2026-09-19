# CHUBBY THE PORCUPINE

A handcrafted pixel-art life & job simulator. You are Chubby: an extremely round
porcupine who lives with his mom in a cozy Canadian cabin and plays video games
all day, until an awful morning forces him to get a job at **Donald's Burgers**
(it's a D, not an M) and climb the corporate Career Tower to pay her hospital bill.

Everything is drawn in code (crisp 480x270 pixels, integer-scaled), all sound is
synthesized with the Web Audio API, and the whole thing runs from a single
`index.html` with no build step and no dependencies.

## Play

Open `index.html` in a modern browser (Chrome, Edge, Firefox, Safari), or serve
the folder with any static server:

```
python3 -m http.server 8000
# then visit http://localhost:8000
```

Progress auto-saves to localStorage at every chapter and after every shift.

## Controls

| Action | Keys |
| --- | --- |
| Move | Arrow keys / WASD |
| Interact / advance dialogue | E (or Enter, Space) |
| Hop / jump (Blue Hedgehog: jump twice for a double jump) | Space or Z |
| Smartphone | I (once Chubby has it) |
| Minigames | Mouse: click, drag, hold, wiggle |
| Mute | M |
| Back / menu | Esc |

## What's inside

- **The cabin**: a single-floor log cabin with 50+ pokeable things: alarm clock,
  pancakes, fireplace, family photos, the rotary phone, Mom's rocking chair, the
  forest through frosted windows.
- **Blue Hedgehog**: a real playable retro platformer inside the TV, entered
  through a seamless zoom. Momentum movement, jump + double jump, kickable
  ladybugs, rings, springs, item monitors, checkpoints and a boss fight against
  **Man Egg**, until a crash from the kitchen pulls you back out.
- **The emergency and the hospital**: dial 9-1-1 on an actual rotary dial, ride
  the ambulance, wait anxiously in a fluorescent corridor, talk to Mom with
  dialogue choices, and receive an itemized bill for $84,230.17.
- **The smartphone**: home screen, Foxfire browser with the Goggle search engine,
  three job sites with a dozen believable listings, multi-step applications
  (résumé upload, screening questions, cover letters, a porcupine CAPTCHA),
  Mail, Messages, Files, Moosebank, Maps, Photos, Settings and the Amazoon shop.
- **The interview**: a timed, choice-based interview with Brenda the moose,
  including a handshake meter, stomach growls, a fryer fire and a buzzing phone.
- **Donald's Burgers**: a living restaurant with queues, coworkers, eating
  customers, accumulating mess and rush hours, plus hands-on minigames for every
  position: mopping, tables, bins, bathrooms, restocking, grill, burger
  assembly, fries & drinks, bagging, cashier, drive-thru, shift leader, store
  manager, Regional Sauce Consultant, VP of Synergy, Chief Burger Officer, CEO.
- **The Career Tower**: a 10-floor corporate skill tree. Buy five upgrades on a
  floor to unlock the elevator; upgrades visibly change how the work plays.
- **The life loop**: go home, eat, unwind with the Hedgehog, text Mom, visit her,
  buy things for the cabin and for her, pay down the bill, and bring her home.

## Published build

`artifact/` holds the pages used for the hosted build: `index.html` (the full
game) and `arcade.html` (Blue Hedgehog on its own, booted through the
`window.CH_BOOT` scene hook). Both pull in the same `js/` sources and add
`artifact/shell.js`, which takes keyboard focus inside an iframe and mounts an
on-screen d-pad on touch devices.

## Development

`js/` loads as plain scripts in dependency order (see `index.html`). Test
scenes can be opened directly, e.g. `index.html?scene=hedgehog`,
`?scene=restaurant`, `?scene=tower`, `?scene=grill`, `?test=chubby`.
Every position has a shift route: `?scene=restaurant_grill`,
`?scene=restaurant_shiftlead`, `?scene=restaurant_manager`,
`?scene=restaurant_ceo`, and so on for each job id in `CH.JOBS`.

`tools/shot.mjs` and `tools/smoke.mjs` drive the game headlessly with
Playwright for screenshots and error checks (`cd tools && npm install`).
`tools/flow.mjs`, `tools/chain.mjs`, `tools/systems.mjs` and `tools/spill.mjs`
are scripted playthroughs of the opening, the job hunt and first shift, the
phone/tower/promotion/ending systems, and the janitor mop loop.
