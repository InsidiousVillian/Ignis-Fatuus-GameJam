# Ignis Fatuus — Development Plan

---

## Milestone 1: Core Engine & Gameplay Loop

| Task | Status |
|---|---|
| Project scaffold & file structure | Complete |
| Full-screen Canvas setup (`index.html`, `style.css`) | Complete |
| `Game` class — canvas init, resize, master entity arrays | Complete |
| `requestAnimationFrame` game loop (update → draw) | Complete |
| Off-screen canvas lighting layer (`destination-out` radial gradient) | Complete |
| `Player` class — mouse-follow 'Spark' entity | Complete |
| `Player` Cleaner mechanic — 1.5s hover over ShadowPile triggers removal | Complete |
| `Hero` class — state machine (idle / chasing), moves to nearest Enemy | Complete |
| `Hero` health bar (floating, rendered above sprite) | Complete |
| `Enemy` class — spawns at random screen edges, moves toward Hero | Complete |
| `Enemy` death → spawns `ShadowPile` at last position | Complete |
| `ShadowPile` class — inert entity with hover-progress ring | Complete |
| `HealOrb` class — lerps to Hero on spawn, heals on contact | Complete |
| Enemy spawn interval (`ENEMY_SPAWN_INTERVAL` constant) | Complete |

---

## Milestone 1.5: Game Loop & Progression

| Task | Status |
|---|---|
| Wave counter — increments every 30 seconds | Complete |
| Scaling difficulty — enemy speed & spawn rate increase per wave | Complete |
| `score` variable — +100 per Shadow Pile purified | Complete |
| HUD overlay — Wave and Score displayed at top-left | Complete |
| Hero `wandering` state — drifts to center when no enemies exist | Complete |
| Game Over state — triggers when Hero HP reaches 0 | Complete |
| Game Over overlay — score, wave reached, 'R to Restart' prompt | Complete |
| `restart()` method — full entity reset, preserves canvas & loop | Complete |

---

## Milestone 2: Visual Polish

| Task | Status |
|---|---|
| Pulse effect on Player light radius (Sine wave) | Complete |
| Particle trail system for HealOrbs | Complete |
| `Health Ghosting` effect on Hero HP bar | Complete |
| Background grid pattern to imply movement (parallax) | Complete |
| Dynamic `shadowBlur` glow on Player Spark & HealOrbs | Complete |
| Sprite/asset replacement (AI-generated) | Pending |

---

## Milestone 2.5: Power-Up Store

| Task | Status |
|---|---|
| `UPGRADE_DEFS` catalogue — 4 named upgrades with stat descriptors | Complete |
| `Store` class — builds DOM overlay once, `open()` / `hide()` lifecycle | Complete |
| Fisher-Yates selection — 3 random upgrades from 4 shown per wave | Complete |
| `backdrop-filter: blur(8px)` glass overlay with cyan card UI | Complete |
| Card hover highlight via CSS `--card-color` custom property | Complete |
| Stat application — `cleanFrames`, `healValue`, `damageResist`, `lightRadius` | Complete |
| Game state `'store'` — simulation frozen while overlay is open | Complete |
| `_resumeFromStore()` — increments wave, resets timers, restores `'playing'` | Complete |
| Wave progress bar in HUD (shows time until next store appears) | Complete |
| Top-right upgrade indicator panel in HUD (icon + level per stat) | Complete |

---

## Milestone 3: High-Fidelity Assets & Kinetic Mechanics

| Task | Status |
|---|---|
| `drawSprite()` pattern on `Player`, `Hero`, `Enemy` — image load + procedural fallback | Complete |
| Player 'Spark' — rotating cyan orbital flares + `'screen'` blend glow pass | Complete |
| Hero 'Hooded Shadow' — dark cloak body, triangular hood peak, glowing teal eyes | Complete |
| Enemy 'Shadow Wraith' — per-enemy flicker phase, wispy tendrils, red core | Complete |
| `ShockWave` class — expanding cyan ring with inner echo, 18-frame lifetime | Complete |
| `Pulse Repel` — auto-fires every 5s; Spacebar triggers when charged | Complete |
| Enemy knockback — 15 px/frame impulse with 0.85 friction, ~100px displacement | Complete |
| Enemy stun — 60-frame immobility window after knockback | Complete |
| Stun ring indicator on enemies (cyan arc, fades as stun expires) | Complete |
| Death dissolve — `dying` flag, 10-frame shrink+fade before ShadowPile spawn | Complete |
| HealOrb `'screen'` blend glow pass for additive light-bleed | Complete |
| Repel cooldown bar in left HUD panel | Complete |

---

## Milestone 4: Audio

| Task | Status |
|---|---|
| `AudioManager` class | Pending |
| Ambient dungeon loop | Pending |
| SFX triggers (enemy death, orb collect, cleaner activate) | Pending |

---

## Milestone 4: Submission Polish

| Task | Status |
|---|---|
| Final `readme.md` — AI Ethics Statement, Overview, IIE references | Pending |
| Final `refinements-changes.md` review | Pending |
| Playtesting & bug fixes | Pending |
