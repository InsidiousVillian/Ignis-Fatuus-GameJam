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

---

## Entry 003 — 2026-03-24

**Feature Added:** Visual Polish pass — Sine wave light pulse, `Particle` class with HealOrb trail system, Hero health ghosting effect, parallax background grid, and enhanced `shadowBlur` glows on `Player` and `HealOrb`.

**Logic Explanation:**

- **Sine wave pulse (`PLAYER_LIGHT_RADIUS + sin(time × PULSE_SPEED) × PULSE_AMPLITUDE`)**: The Game class increments a master `time` counter each frame. Inside `Player.update()`, `currentLightRadius` is recalculated using `Math.sin(game.time * 0.04) * 15`, creating a smooth, periodic breathing cycle of approximately 2.5 seconds. Crucially, `globalCompositeOperation` is set to `'destination-out'` and then reset to `'source-over'` in the same lighting pass regardless of the radius value — the composite mode is never toggled conditionally, so there is zero risk of it being left in a broken state between frames (Fulton & Fulton, 2013:207).
- **`Particle` class**: Each `Particle` stores a world-space position, a random velocity vector `(vx, vy)`, a `life` float (0–1), and a `decay` rate. Each frame, `life -= decay` and `globalAlpha` is set to `life` when drawing, producing a natural fade-out without any colour string interpolation. Shrinking the arc radius proportionally to `life` makes the particle visually "consume" itself. The particle pool lives on `game.particles`, managed by the `Game` class to stay consistent with the single-source-of-truth architecture.
- **HealOrb trail emission**: Inside `HealOrb.update()`, the Euclidean distance travelled this frame (`Math.hypot(newX - prevX, newY - prevY)`) is used to conditionally emit 1–2 particles. Linking spawn count to speed means particles appear denser when the orb is moving fast (near spawn) and sparser as it decelerates near the Hero, which reinforces the lerp's easing visually.
- **Health ghosting (`ghostHp`)**: The Hero tracks two HP values — `hp` (real) and `ghostHp` (visual lag). Each frame: `ghostHp += (hp - ghostHp) * 0.025`. Because `ghostHp` approaches `hp` exponentially rather than linearly, the drain rate starts fast and slows as it closes the gap, producing a visually satisfying "rubber-band" effect. On heals, `ghostHp` is jumped directly to avoid the ghost bar appearing to show a damage flash on healing — matching standard game UI conventions (Rogers, 2010:285).
- **Parallax grid**: The grid's screen-space origin is offset by `-(hero.x * 0.04) % GRID_SIZE`. The modulo wraps the offset within one cell so the grid lines never drift off-screen — they appear to scroll infinitely as the Hero moves. The `0.04` factor keeps movement subtle (background parallax, not foreground camera tracking). Line opacity is fixed at `0.07` to remain subliminal against the `#1a1a1a` background.
- **`shadowBlur` glows**: Canvas `shadowBlur` is applied immediately before `fill()` and reset to `0` immediately after. Failing to reset `shadowBlur` would cause every subsequent draw call to inherit the blur, significantly degrading performance (MDN Web Docs, 2024).

**AI Collaboration Note:** AI (Cursor / Claude) proposed linking HealOrb particle density to per-frame travel speed rather than a fixed rate, arguing it was more physically intuitive and would reinforce the lerp easing to the player without extra code. AI also recommended jumping `ghostHp` on heal rather than ghosting upward, to avoid a confusing visual where the ghost bar appears to show "negative damage" after a heal event.

---

**References**

Fulton, S. & Fulton, J. 2013. *HTML5 Canvas*. 2nd ed. Sebastopol: O'Reilly Media.

MDN Web Docs. 2024. *CanvasRenderingContext2D: shadowBlur property*. [Online]. Available at: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/shadowBlur [Accessed 24 March 2026].

Rogers, S. 2010. *Level Up! The Guide to Great Video Game Design*. Chichester: John Wiley & Sons.
