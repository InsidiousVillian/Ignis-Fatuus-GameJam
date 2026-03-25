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

---

## Entry 004 — 2026-03-24

**Feature Added:** Core game loop progression — Wave system with scaling difficulty, Score counter, HUD overlay (Wave + Score), Hero wandering state, Game Over state machine, and an animated restart overlay.

**Logic Explanation:**

- **Scaling Difficulty (`_tickWave`)**: A `waveTimer` counter increments every frame. When it reaches `WAVE_DURATION_FRAMES = 1800` (30 seconds at 60fps), `wave` increments, `currentSpawnFrames` decreases by 15 (floored at `SPAWN_FRAMES_MIN = 60`), and `currentEnemySpeed` increases by `SPEED_PER_WAVE = 0.08`. Both difficulty values live on the `Game` object and are passed into `spawnEnemy()`, so newly spawned enemies automatically reflect the current wave's stats without any Enemy needing to read global state (Adams, 2014:312). Existing enemies are unaffected — they were already spawned at their initial speed, which creates a natural "wave memory" effect where older, slower enemies linger alongside faster, newer ones.

- **Game State Machine (`gameState`)**: The game recognises two states: `'playing'` and `'gameover'`. The `update()` method returns immediately after incrementing `this.time` if the state is not `'playing'`, freezing the entire simulation. `this.time` continues to tick in both states so the light pulse and the Game Over prompt's blink animation remain live. Transitioning to `'gameover'` is a one-line check at the end of `update()`: `if (this.hero.hp <= 0) this.gameState = 'gameover'`. The separation of state from render logic means `draw()` remains stateless — it simply reads `gameState` and calls the appropriate overlay method, which prevents conditional branching from contaminating the render pipeline (Nystrom, 2014:ch.7).

- **Restart (`_initEntities` + `restart`)**: Entity initialisation was extracted into `_initEntities()` so both the constructor and `restart()` call the same method. This eliminates the risk of the constructor and restart paths diverging over time (DRY principle). `this.time` is intentionally *not* reset — restarting the game does not reset the light pulse phase, which avoids a jarring visual "snap" on restart.

- **Score (`SCORE_PER_PILE`)**: Score is incremented inside `Player.update()` at the moment a pile is cleansed (`game.score += SCORE_PER_PILE`). This keeps the scoring logic co-located with the Cleaner mechanic that produces it. `game` is already passed into `Player.update()` from the previous architecture, so no new coupling was introduced.

- **HUD (`drawHUD`)**: The HUD is drawn *after* `drawLighting()`, placing it above the darkness overlay so it is always readable regardless of player position. A semi-transparent rounded backing rectangle prevents contrast issues against any background. `ctx.save()` / `ctx.restore()` sandboxes the font and fill state to prevent any HUD style from leaking into the next frame's game-world draw calls.

- **Hero Wander State (`_wander`)**: When `enemies` is empty, the Hero enters `'wandering'` state and navigates toward a randomly selected point within ±80px of the canvas centre, refreshing the target every 180 frames or when it arrives. Movement is capped at 30% of `HERO_SPEED` to produce a relaxed patrol rather than erratic teleportation. The attack timer is not reset on wander entry — if an enemy spawns mid-wander, the Hero transitions to `'chasing'` on the next frame without losing its attack cooldown state.

- **Game Over Overlay (`drawGameOver`)**: The blinking "PRESS R TO RESTART" prompt uses `Math.abs(Math.sin(this.time * 0.04))` — the same `time` counter that drives the light pulse. This avoids a second timer and ensures the blink rate is consistent with the overall game tempo. The `'R'` key listener checks `gameState === 'gameover'` before calling `restart()`, so accidental keypresses during gameplay have no effect.

**AI Collaboration Note:** AI (Cursor / Claude) recommended extracting `_initEntities()` into a dedicated method rather than duplicating the constructor setup in `restart()`, noting that constructor/restart divergence is a common source of subtle bugs in game jam projects. AI also suggested preserving `this.time` across restarts specifically for the light-pulse continuity reason — a detail that would otherwise be easy to overlook.

---

**References**

Adams, E. 2014. *Fundamentals of Game Design*. 3rd ed. Berkeley: New Riders.

Nystrom, R. 2014. *Game Programming Patterns*. [Online]. Available at: https://gameprogrammingpatterns.com [Accessed 24 March 2026].
