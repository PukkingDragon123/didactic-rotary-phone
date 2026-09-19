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

Progress autosaves to localStorage at every chapter and after every shift, into
its own slot. Three more slots are yours: open the pause menu with **Esc** or
**P** and pick Save Game. The title screen's Continue picks up whichever slot
was written last.

## Controls

| Action | Keys |
| --- | --- |
| Move | Arrow keys / WASD |
| Interact / advance dialogue | E (or Enter, Space) |
| Hop / jump (Blue Hedgehog: jump twice for a double jump) | Space or Z |
| Smartphone | I (once Chubby has it) |
| Minigames | Mouse: click, drag, hold, wiggle |
| Mute | M |
| Pause, save, load, quit | Esc or P |
| Back / close | Esc |

## Art

Every sprite is assembled at run time. A drawing is composed on an offscreen
buffer, its silhouette is dilated into a single dark ink line, and the result is
blitted in one piece, which is what gives the cast the heavy outline of a
hand-drawn sprite sheet without a single outline pixel being placed by hand.
On top of that each material carries a shading ramp, and characters are built
from parts on a local axis so one pose serves both facings.

Chubby's face is assembled from a brow, an eye shape and a mouth shape, which is
how twenty expressions come out of one head. Springs drive his belly jiggle,
head lag and quill sweep, so landing, turning and stopping all overshoot and
settle instead of snapping. Standing still for a few seconds gets you a look
around, a yawn, a shuffle or a scratch.

Dialogue is a comic speech bubble anchored over whoever is talking, with a tail
that points at them, and pages itself when a line runs long.

## What's inside

- **The dream**: the game opens inside Chubby's head, where he is fast. A
  flat-out run through a dream world of ladybugs and egg minions, a fall down a
  shaft when the floor gives way, and a boss fight against **Man Egg** in his
  laboratory. Man Egg cannot be hurt. He has a robotic arm that hammers the
  floor and scythes at head height, and he charges - but he only commits as far
  as the spot you were standing in, so the only way to crack his shell is to
  lurk beside a wall, let him commit, and step aside. Three bonks and the egg
  bursts. Then the alarm goes off.

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
