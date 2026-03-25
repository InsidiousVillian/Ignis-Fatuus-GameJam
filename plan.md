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

## Milestone 2: Visual Polish

| Task | Status |
|---|---|
| Pulse effect on Player light radius (Sine wave) | Pending |
| Particle trail system for HealOrbs | Pending |
| Background grid pattern to imply movement | Pending |
| Sprite/asset replacement (AI-generated) | Pending |

---

## Milestone 3: Audio

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
