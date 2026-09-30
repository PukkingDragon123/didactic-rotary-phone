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
| Dance (anyone nearby joins in) | Hold Down / S |
| Smartphone | I (once Chubby has it) |
| Shader on / off | F8 |
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

### Fonts

All text is set in two goofy pixel fonts by Nathan Scott (Caffinate), both
free on itch.io:

- **Fibberish** ([caffinate.itch.io/fibberish](https://caffinate.itch.io/fibberish)),
  a fun n' fat 7x9 font, for dialogue, menus, buttons and titles.
- **Quaver** ([caffinate.itch.io/quaver](https://caffinate.itch.io/quaver)),
  a quirky 5x6 font, set in capitals for labels, the HUD and the phone.

Their itch.io pages list them as CC0 and the readme that ships with them says
CC BY 3.0, so they are credited here either way. The TTFs were converted into
the row-string glyph tables in `js/01_font.js`, with the arrows, hearts, stars
and other symbols the fonts lack drawn to match. The game's original 5x7 and
3x5 fonts are kept as `plain` and `tiny` for price tags and signs too small
for the new ones, and `gfx.text(..., { fit })` steps a label down a size
rather than let it spill out of its sign.

## What's inside

- **A title shot like the opening of a film**: Chubby's cabin on the hill
  above Moose Hollow at night, the town asleep across the frozen lake, the
  moon and the northern lights over the hills, and through the big front
  window Chubby himself, fast asleep. The picture is painted once into six
  parallax layers that the camera sways slowly across; snow falls in three
  depths, the chimneys smoke, a car crawls along the shore road, the odd
  shooting star crosses the sky and the town's lights go out one window at a
  time. The shader lights every window, lamp and neon sign and casts the
  moonlight. The logo is built from the Fibberish letters, smoothed, extruded
  and capped with soft snow - nothing spiky - and drops in letter by letter.
  Starting a game pushes the camera in through Chubby's window and fades to
  the morning he wakes up in.
- **A closer, richer picture**: the canvas renders at the screen's real
  resolution and the world camera sits about 1.5x closer, rounded so one game
  pixel is always a whole number of screen pixels - closer and still crisp.
  The finished frame then goes through a WebGL shader in the style of a
  Minecraft shader pack (`js/97_post.js`): bright, saturated colour; a soft
  glow that comes only from things that give off light - lamps, lit windows,
  fire, neon, screens - never from snow or a white wall; god rays streaming
  from the sun between the trees and roofs, golden in the morning and evening;
  shafts of daylight through windows with dust hanging in them; blue nights
  that stay readable; a gentle vignette. Scenes paint their light sources into
  a small emission map (`CH.emit`) as they draw, and the shader turns that
  into glow. Slow machines drop back to the plain image on their own; F8 flips
  it, `?noshader` turns it off. The interface - clock and money, dialogue,
  speech bubbles, button prompts, minigame HUDs, menus, fades and the cursor -
  is drawn on its own layer above the world, so the lighting never touches it
  and it stays sharp and readable.
- **Wind, snow and things to kick**: one shared wind with gusts leans the
  trees, blows powder off the roofs and carries loose things down the street.
  Ground snow is a live height field - flakes land and pile up, feet plough
  trenches through it, gusts lift it and blow it along. Snowballs, pinecones,
  cans, cups, a hockey puck, bouncy balls in the toy shop and one small red
  mitten can all be kicked, and snowballs burst if you hop on them. Hand the
  mitten back to Tilly for her best rock and two dollars.
- **Ice fishing, in 3D**: out on the frozen lake Bartleby lends you a rod. A
  small software renderer draws the scene as chunky 3D pixel art - cracked,
  glittering ice, his lit shack, pines along the shore, a lantern, snow
  falling in 3D - with dithered lighting and fog. The fishing hole is a real
  height-field water simulation: the lure going in, fish nibbling, snowflakes
  landing and the splash of a catch all send rings across it. Hold to drop the
  line, wiggle to jig, click on the bite, reel when the line is slack and let
  go when it screams. Six things to catch, one of which is a boot.
- **Everybody dances**: hold Down and Chubby dances; anyone standing near him
  catches it a beat later. The busker in town gets a crowd going on his own.

- **Main Street**: fourteen shopfronts in a row, twelve of them businesses you
  can walk into - Pinecone Toys, The Dripping Pine, Dog-Eared Books, Frost &
  Flour, Bucksaw Hardware, Second Wind, Loon & Groove, Antler Pharmacy, Tackle
  & Twine, Sparkplug Garage, The Clipped Whisker and Pixel Palace. Every
  building has its own architecture (`js/29_streetfronts.js`): brick blocks
  with cornices and arched windows, wooden false fronts with porches, gabled
  fronts with bay windows, fieldstone and half-timber, flat modern fronts, a
  quonset arena. They have lit windows at night, goods in the display glass,
  pixel awnings, planters with little pines, snow on every ledge, icicles, and
  a barber pole, neon and chimney smoke that move. Behind the street is a row
  of detailed houses, and Donald's has diners eating in the windows.
- **Shops worth walking into**: every room behind those doors is fully
  furnished (`js/29_shoprooms.js`, built on the interior kit in
  `js/29_interiors.js`): its own walls, floor and ceiling (exposed brick,
  beadboard, glazed tile, pressed tin, pegboard, knotty pine, arcade carpet),
  shelves stocked with hand-drawn goods, lamps and daylight, a window onto the
  snowy street, things that move (a toy train on the high shelf, the bakery's
  oven fire, a turntable, fish in the minnow tank, attract-mode arcade screens,
  a claw machine, a sleeping shop cat), a customer or two with their own lines,
  and odd things worth a look.
- **A street that is different every day**: who is standing where, which cars
  and bikes go past, and which bit of street theatre is playing (a busker, a
  snowball fight, geese crossing, a stuck car, a window cleaner in February,
  a poutine cart) is all seeded on the in-game day. Six named villagers with
  their own lines and their own small favours rotate through the doorways -
  including Denny, who has once again come out in his heart-print shorts.
- **The cabin**: a single-floor log cabin with 50+ pokeable things: alarm clock,
  pancakes, fireplace, family photos, the rotary phone, Mom's rocking chair, the
  forest through frosted windows. Every window in the game looks out on a view
  painted for the hour: sky, a jagged ridge, far treelines, the hand-drawn
  pines, houses across the street, falling snow and the odd car going by.
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

## Key art

`art/gifs/` holds a looping GIF of every character in the game dancing on a
disco floor, plus `_party.gif` with the cast in a row; `node tools/gifs.mjs`
re-renders them (the encoder in `tools/gif.mjs` has no dependencies and stores
only the pixels that change from one frame to the next).

`art/thumbnail.png`, the animated `art/thumbnail.gif` (Chubby on the late shift
at Donald's, mopping the checker floor in a two-stroke loop, no text) and
`art/banner.png` are rendered by `tools/keyart.mjs`,
which paints them with the game's own primitives and characters - the same
pixels the game draws, composed for a store page. Re-render with
`node tools/keyart.mjs art`.

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
