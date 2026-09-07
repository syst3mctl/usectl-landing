# Handoff: usectl landing — machine room scene

## Overview

A single-page landing for usectl. It opens on a click-driven world map that flies into a
server room in Falkenstein, then a scroll-driven six-beat scene in which devo (the usectl
agent character) takes one machine from an empty rack bay to a live https URL. Beneath the
scene sits the informative spine: eleven written sections carrying the product argument
(CLI, what a machine is, addons, modes, audience, pricing, shipping, proof, limits, FAQ, CTA).

Two things this design exists to do:

1. Make "we run the metal" literal — you see the building, the rack, the blades.
2. Teach the managed-vs-dedicated addon distinction, which is the decision every customer
   faces on day one, by showing managed addons lighting up in a **shared** rack down the
   aisle while dedicated ones bolt into **your** rack and move the budget meter.

## About the design files

The files in this bundle are **design references created in HTML** — a working prototype of
the intended look and behaviour, not production code to lift wholesale. The task is to
**recreate this design in the target codebase** (the existing site is static HTML + CSS built
with Vite, per `syst3mctl/usectl-landing`), using its established patterns.

Specifically:

- `usectl-landing.dc.html` is authored in an internal component format. Its `<x-dc>` template
  is ordinary inline-styled HTML and can be read directly as markup. Its logic lives in the
  `<script type="text/x-dc">` block at the bottom as a class named `Component` — plain
  browser JavaScript with a React-like `state` / `setState` / `renderVals()` shape.
- `support.js` is the runtime that renders that format. It is included **only** so the
  prototype opens and runs locally. Do not ship it.
- **The canvas renderer is the part worth porting verbatim.** Everything in the scene — the
  room, the racks, devo, the laptop, the world map — is drawn as squares on one 2D canvas by
  the methods listed under "The scene renderer" below. That code is framework-agnostic and
  can be moved into a plain `.js` module with no changes beyond removing `this.props` /
  `this.state` reads.

## Fidelity

**High-fidelity.** Colours, type, spacing, timings and copy are final. Copy is verbatim from
`variants/01-swiss-ledger.html` in the repo and must not be rewritten — with one deliberate
change the client approved: the hero eyebrow reads "we run the metal" rather than "managed
kubernetes on our own metal".

## Running the prototype

```
cd design_handoff_machine_room
python3 -m http.server 8000
# open http://localhost:8000/usectl-landing.dc.html
```

A server is required (the runtime fetches sibling files). An internet connection is also
required: the map loads d3, topojson-client and Natural Earth geometry from CDNs.

## Screens / views

### 1. Lead-in — world map (stage `map`)

- **Purpose:** locate the product physically, and let the visitor choose a site.
- **Layout:** full-viewport `position: sticky` stage inside a `470vh` section. One `<canvas>`
  fills it absolutely. Overlays, in z-order: pin markers (z 1), hero copy (z 2), site list (z 4).
- **Page scroll is locked** (`documentElement.style.overflow = 'hidden'`) for the whole of
  this stage. This is deliberate: the visitor chooses by clicking, not scrolling.
- **Map:** Natural Earth `countries-110m` rasterised once into a 720×360 equirectangular land
  mask, then sampled per grid cell. Two tones:
  - ordinary land `#5f6c66`
  - countries with Hetzner locations `#e6ede8` (Germany, Finland, USA — ISO ids 276, 246, 840, 702)
  - ocean is the page background
  - **Never render any land in green.** Green means "a site we actually run", and the client
    was explicit about not implying capacity that does not exist.
- **Hero copy** (centred, with a radial scrim `rgba(7,12,9,.94)` → transparent at 60%/42%):
  - eyebrow, 11–13px mono, `#D6F7DC`: `usectl · we run the metal · falkenstein`, with `usectl` in `#fff`
  - h1, `clamp(34px,6vw,86px)`, weight 700, tracking −.035em: `one box.` / `many machines.`
    with both full stops in `#11A32A`
  - lead, `clamp(15px,1.5vw,21px)`, `#fff`, max-width 34em: `every project gets its own
    computer: an isolated namespace with its own postgres, redis, s3, domain and agent. one
    flat price. on our metal or yours.`
  - a row containing `pick a site to go inside →` (`#8fae99`) and a text button
    `or read the details ↓` which skips the scene and scrolls to `#agents`
  - The hero reserves 300px of right padding above 760px wide so it cannot lay text into the
    site-list column.
- **Site list** (bottom right, 26px inset): header row `PICK A SITE` plus a legend swatch
  `#e6ede8` labelled `hetzner locations`, then one row per site:

  | site | sub-label | state |
  | --- | --- | --- |
  | falkenstein | `fsn1 · our metal` | live — green left border `#11A32A`, `→`, clickable |
  | nuremberg | `nbg1 · planned` | `disabled`, `aria-disabled`, grey border, reads `not live` |
  | helsinki | `hel1 · planned` | `disabled`, `aria-disabled`, grey border, reads `not live` |

  Rows are `#06100a` with a 3px left border, 1px `rgba(100,116,136,.32)` elsewhere, 230px min
  width, 11–13px. **Planned sites must not be destinations** — `flyTo()` returns early for any
  site without `live: true`.

### 2. Lead-in — the flight (stage `flying`)

2100ms, timer-driven, `mp` running 0 → 1.

- **Zoom:** exponential, longitude span `max(360, 172 · GW/GH)` → `0.5`, eased smoothstep over
  the first 90%.
- **Pan:** the centre is derived from the *current span*, not from eased time —
  `k = ((span − span1)/(span0 − span1))^2.5`, `clon = target.lon · (1 − k)`. A linear pan against
  an exponential zoom throws the target off screen; this keeps the chosen site within ~17px of
  centre and dead centre from 43% onward. **Port this formula as-is.**
- **Dots thin and fade** so the frame never fills with white: grid step 2 → 3 → 5 → 8 cells as
  the span shrinks, and layer alpha decays from `mp` 0.26 to 0 by 0.80. The last fifth of the
  flight is already the room.
- Hero fades out from `mp` 0.15; markers and list fade by 0.45.
- On arrival: scroll lock released, page scrolled to the section top, stage set to `room`.

### 3. The room (stage `room`)

Scroll-driven. Room phase `p` = section scroll progress 0 → 1; `beat = min(5, floor(p · 6))`.

| beat | kicker | rack event | budget |
| --- | --- | --- | --- |
| 1 | `what you get · one namespace, one bill` | empty chassis, spec plate `2v · 4g · 10g` | 0% |
| 2 | `managed addons · down the aisle` | three slices light in the **shared instance** rack (p .19/.23/.27) | 0% |
| 3 | `dedicated addons · in your rack` | postgres, redis, nats slide into your rack (p .35/.395/.44), attach cables go live | 25% |
| 4 | `how it ships · four steps, in order` | web blade racks (p .52), build goes green (p .60) | 25% |
| 5 | `push git. get https.` | uplink climbs to the ceiling tray, TLS pip lights (p .69) | 25% |
| 6 | `known limits · we say it plainly` | dedicated bay marked amber `#FEBC2E` (p .84) | 25% |

Every rack timing sits inside the beat whose copy describes it. This mapping is the whole
point of the scene — if the beats are re-ordered, re-map the schedule too.

- **Bottom strip** (`left/right: 26px`, `bottom: 22px`, z 5, `rgba(8,10,14,.86)`, 12px radius,
  1px `rgba(100,116,136,.28)`): left column is the terminal (traffic lights, title
  `usectl cli · omnitech`, typed command lines at 11.5px mono); right column is the beat
  kicker (10px, uppercase, `.1em`), the lesson (13.5px `#fff`), the budget meter, the caption
  and six pips. Pips are 18×5px bars in 38×23px hit targets.
- **Budget meter:** label row `MACHINE BUDGET` + value, then a full-width 7px track `#131a16`
  with a fill. Values must stay arithmetically true: 0% reads `0 of 2 vcpu · 4 gb` in
  `#5d6570`; 25% reads `0.5 of 2 vcpu · 1 of 4 gb` in `#FEBC2E`.
- The horizon sits at 46% of the grid height so the floor — and everyone standing on it —
  clears the bottom strip.
- Terminal lines type in at 2 characters per 60ms per beat.

### 4. The written spine

Eleven sections, each a two-column grid `minmax(0,2fr) / minmax(0,9fr)` with 26px gap,
`max-width: 1180px`, `88px 26px 0` padding. Left column is a mono eyebrow (11px) with a bold
white first line; right column is an h2 `clamp(26px,3vw,42px)` weight 600 tracking −.03em,
then the body.

In order: `#agents`, `#machine`, `#addons`, `#modes`, `#for`, `#math`, `#ship`, `#proof`,
`#closing`, `#faq`, `#cta`, footer. Repeating patterns:

- **Ruled rows** (`#agents`, `#machine`): `2.6em / 1fr / 1.9fr` grid, 15px padding, 1px
  `rgba(100,116,136,.18)` rules, mono index `#8fae99`, 15px semibold title, 14.5px body at
  `rgba(255,255,255,.72)`.
- **Hairline grid** (`#addons` 3-up, `#modes` 2-up, `#for` 3-up): 1px gap over a
  `rgba(100,116,136,.28)` background so the gaps read as rules; cells are page-background.
- **Ledger** (`#math`): four rows, `tabular-nums`, mono right-aligned amounts, a proportional
  bar column (32% / 50% / 66% / 100%) where the usectl row's bar is `#11A32A` and its amount
  `#35E055`. The bar column hides below 900px.
- **Steps** (`#ship`): 30px numerals with a green full stop, 17px body.
- **FAQ**: `1fr / 2fr` definition rows, 15.5px terms, 14.5px answers.

All copy in these sections is verbatim from the variant. Do not paraphrase, and keep the
lower-case voice.

## Interactions & behaviour

- **Region select:** click a live site row → 2100ms flight → room. Planned rows are inert.
- **Skip:** `or read the details ↓` releases the lock, sets stage `room`, smooth-scrolls to `#agents`.
- **Scroll:** drives the room only, after arrival. Nothing else on the page is scroll-animated.
- **Pips:** jump to `top + range · ((i + 0.45) / 6)`, smooth behaviour.
- **Drag devo:** pointer-down within his projected box grabs him; he panics (arms and legs
  flail off the drag direction), and on release he topples about his hip, lands flat, crouches
  and stands up angry — a 7-step sequence at 380ms per step. Gated by the `dragEnabled` prop.
- **Idle:** if the scroll has not moved for 300ms he settles into an idle pose; otherwise the
  pose is chosen by beat.
- **Frame cadence:** sprite/LED animation ticks every 380ms; the render loop runs on a 80ms
  interval. **Do not port the loop as `requestAnimationFrame` alone** — see "Gotchas".
- **Small screens and reduced motion:** below 760px, or with `prefers-reduced-motion: reduce`,
  the entire lead-in is skipped and the page opens in the room, unlocked. The bottom strip
  stacks to a column. Hidden overlays use `visibility: hidden` **and** `pointer-events: none`,
  not opacity alone, so nothing invisible stays clickable or tabbable.

## State

| state | values | drives |
| --- | --- | --- |
| `stage` | `map` / `flying` / `room` | scroll lock, which overlays are live, whether the map paints |
| `mapT` | 0–1, stepped to 1/20 | hero and overlay opacity during the flight |
| `beat` | 0–5 | kicker, lesson, caption, terminal lines, budget, pip highlight |
| `typed` | character count | terminal typing |
| `tick` | integer | LED blink, idle blink, sprite cadence |

Instance fields (not React state): `_p` room phase, `_mp` flight phase, `_pin` chosen site,
`_drag`, `_seq` topple sequence, `_mask` / `_hz` land masks, `_cell` px per grid cell.

Tweakable props: `shotPod`, `shotAddons`, `shotDomain` (image URLs for the laptop screen),
`dyingLight`, `neighbourRacks` (0–3), `dragEnabled`, `cableHold`.

## The scene renderer

One canvas, one grid. `GW = 420` columns; rows and focal length derive from the viewport box
(`cell = boxWidth / GW`, `GH = round(boxHeight / cell)`, `HZ = 0.46 · GH`, `F = 36 · GH / 88`).
**Use a fractional cell** — flooring it makes the backing store narrower than the element and
stretches the x axis.

- `proj(x, y, z)` — pinhole projection, world (x right, y up from floor, z into the room) → grid cells.
- `quad`, `seg`, `R`, `plate` — filled polygon, Bresenham line, rectangle, and a dark label plate.
- `drawMap(mp)` — dot field, two tones, thinned and faded by zoom.
- `mapView(mp)` — the single source of truth for the camera; DOM markers and canvas dots both read it.
- `devoParts(pose)` — devo as a list of boxes in local space, joint-rotated (`rotX`, `rotY`, `rotZ`).
- `drawDevo` — culls back faces by normal, shades each face by orientation
  (top/front/side/back/bottom), painter-sorts **all** faces from **all** parts together so he
  self-occludes, then projects.
- `devoPose()` — beat → joint angles (yaw, lean, per-arm pitch/roll, leg pitch, crouch, hop).
- `handPos()` — where a hand lands after its rotations; **the laptop is positioned from this**,
  so the hold cannot drift away from the hands.
- `drawScreen` — maps the laptop screen with an affine transform so it stays glued to the lid.
  The laptop is yawed 180° so you see the **back** of the lid and devo reads as looking into it.

## Design tokens

**Colour**

| token | value | role |
| --- | --- | --- |
| page | `rgb(30,29,29)` | body background |
| scene | `#0b0d0c` | canvas/room background |
| brand | `#11A32A` | accent, live state, primary button |
| brand bright | `#35E055` | LEDs, live ink, eyes |
| ink | `#fff` | primary text |
| ink 80 | `rgba(255,255,255,.8)` | section leads |
| ink 72 | `rgba(255,255,255,.72)` | row bodies |
| ink 2 | `#8fae99` | secondary text — 6.95:1 on page. **Use this for type, never `#5d6570`.** |
| steel | `#8a93a0` / `#5d6570` / `#3b4247` | rack chassis fills — canvas only, not type |
| panel | `rgba(8,10,14,.86)` | bottom strip |
| chip | `#06100a` | site rows, label plates |
| warn | `#FEBC2E` | budget in use, known-limits marking, building state |
| land | `#5f6c66` | map land |
| land hot | `#e6ede8` | Hetzner countries |
| rule | `rgba(100,116,136,.18–.35)` | hairlines |

**Type** — Space Grotesk 400/500/600/700 for prose; JetBrains Mono 400/500 for anything
machine-spoken (eyebrows, terminal, labels, numbers). Both from Google Fonts.

Scale: h1 `clamp(34px,6vw,86px)`/.94/−.035em · h2 `clamp(26px,3vw,42px)`/1/−.03em ·
h3 26px · lead 17–21px/1.45 · body 14.5–15.5px/1.5 · mono body 13px/1.75 · mono label
10–11px/`.04–.12em`/uppercase. **Canvas text floor is 13px** — earlier 9px labels were
illegible at typical cell sizes.

**Spacing** — section rhythm 88px top; grid gap 26px; row padding 13–20px; page max-width
1180px (scene is full-bleed). Radii: 12px panel, 0 elsewhere. No shadows except text shadows
over the map.

**Breakpoints** — 900px: two-column sections stack, grids drop to 2-up, ledger bar column
hides, FAQ and CTA stack. 760px: map lead-in skipped entirely, bottom strip becomes a column,
`.uc-grid.two` goes 1-up. 560px: all grids 1-up.

## Assets

- `assets/logo.svg` — from `public/img/logo.svg` in the repo. Currently unused by the design
  (the footer is text) — included in case you want the mark back.
- Map geometry: `world-atlas@2.0.2/countries-110m.json` (Natural Earth, public domain), fetched
  at runtime. Note Singapore is absent at 110m resolution; use the 50m file if it must appear.
- No raster images. Every visual in the scene is drawn.
- The laptop screen has three empty image slots for real `manager.usectl.com` screenshots. Until
  they are supplied it draws a placeholder wireframe of the pods panel. When URLs are given the
  screen cycles through them every 2.6s.

## Gotchas that cost real time

1. **`requestAnimationFrame` may never fire** in an embedded preview, and short `setInterval`
   is throttled. The prototype drives the scene from a redundant set — scroll listeners on
   `window`, on `document` in capture phase (scroll does not bubble), on scrolling ancestors,
   plus an 80ms interval and rAF where available — and rebuilds them on every boot rather than
   guarding with a cached flag. In a normal page you can simplify to rAF plus a scroll
   listener, but keep the "re-acquire the canvas and section from the DOM each tick" habit.
2. **Never cache a viewport-breakpoint decision** at start-up. The prototype did and silently
   skipped the whole lead-in on desktop, because the frame was still narrow when it ran.
3. **Clip anything that slides.** Rack modules start a full rack-width outside the chassis;
   without a clip to the chassis interior they fly across the room.
4. **`opacity: 0` does not remove hit-testing or focusability.** Hidden overlays need
   `visibility`/`pointer-events` too.
5. **Canvas pixel counts cannot see DOM occlusion.** A canvas element can be fully painted and
   still be covered by a panel above it — check element rects, not just ink.

## Files

- `usectl-landing.dc.html` — the whole design: template, logic class, props.
- `support.js` — prototype runtime only, do not ship.
- `assets/logo.svg` — brand mark.

Source of truth for copy: `syst3mctl/usectl-landing` → `variants/01-swiss-ledger.html`.
Repo association and screen map: `github.md` at the project root.
