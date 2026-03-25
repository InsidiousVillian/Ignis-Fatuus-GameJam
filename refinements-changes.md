# Refinements & Changes Log

---

## Entry 001 — 2026-03-24

**Feature Added:** Project environment initialised. Empty file structure created (`index.html`, `style.css`, `game.js`, `plan.md`, `readme.md`, `requirements.txt`, `refinements-changes.md`).

**Logic Explanation:** No game logic has been written at this stage. This entry marks the verified start of the project scaffold so that all subsequent entries have a clean baseline to reference. Files are intentionally empty to confirm file-system connection before any code is committed.

**AI Collaboration Note:** AI (Cursor) confirmed the `.cursorrules` are active and will govern all future documentation, log entries, and code structure (ES6 Classes: `Player`, `Hero`, `Enemy`, `GameEngine`). Harvard-style IIE referencing will be applied to any external logic or tool citations going forward.

---

## Entry 002 — 2026-03-24

**Feature Added:** Full ES6-based game engine implemented across `index.html`, `style.css`, and `game.js`. Classes introduced: `Player`, `Hero`, `Enemy`, `ShadowPile`, `HealOrb`, and `Game`.

**Logic Explanation:**

- **Dual-canvas lighting**: A secondary off-screen `<canvas>` is filled with near-opaque black each frame. `globalCompositeOperation = 'destination-out'` is then used to erase a radial gradient centered on the Player, punching a soft light circle through the darkness without requiring a secondary render of every entity. This is more performant than re-drawing entities twice (Fulton & Fulton, 2013:214).
- **Cleaner mechanic (frame counting)**: Rather than using `Date.now()` deltas, the hover timer increments a `hoverFrames` integer against the constant `SHADOW_CLEAN_FRAMES = 90`. At a stable 60fps this equals 1.5 seconds. Frame counting is deterministic and avoids floating-point drift across variable refresh rates.
- **Hero AI (nearest-enemy state machine)**: Each frame, the Hero iterates the `enemies` array maintained by `Game`, calculates Euclidean distance via `Math.hypot`, and moves toward the closest target. Within `HERO_ATTACK_RANGE`, it decrements the enemy's `hp` on a `HERO_ATTACK_FRAMES` interval (60 frames). This keeps the AI readable and easy to extend.
- **HealOrb lerp**: The orb applies `this.x += (hero.x - this.x) * 0.05` each frame — a standard linear interpolation (lerp) that produces smooth, easing movement without a physics library (Shiffman, 2012:ch.1).
- **`Game` as single source of truth**: All entity arrays (`enemies`, `shadowPiles`, `healOrbs`) are owned by `Game`. Other classes receive references to these arrays rather than maintaining their own, preventing desync between systems.

**AI Collaboration Note:** AI (Cursor / Claude) suggested using the off-screen canvas `destination-out` approach for the lighting layer over a full redraw method, citing the performance advantage of a single `drawImage` blit over re-rendering every entity a second time. AI also advised frame-counting over timestamp deltas for the Cleaner mechanic to ensure deterministic behaviour.

---

**References**

Fulton, S. & Fulton, J. 2013. *HTML5 Canvas*. 2nd ed. Sebastopol: O'Reilly Media.

Shiffman, D. 2012. *The Nature of Code*. [Online]. Available at: https://natureofcode.com [Accessed 24 March 2026].
