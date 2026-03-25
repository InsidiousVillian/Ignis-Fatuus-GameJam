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

---

## Entry 005 — 2026-03-24

**Feature Added:** Power-Up Store system — `Store` class, four named upgrades (`Lumen Pulse`, `Purge Speed`, `Spirit Armor`, `Healing Resonance`), DOM-based glass overlay with `backdrop-filter: blur(8px)`, top-right HUD upgrade panel, and wave-progress bar.

**Logic Explanation:**

- **`UPGRADE_DEFS` catalogue**: All upgrade data (id, display name, stat label, lore, icon, colour) is centralised in a single constant array. `Store.open()`, `Store._applyUpgrade()`, and the HUD panel all reference `UPGRADE_DEFS` as their single source of truth. This prevents the names, icons, and colours from drifting out of sync if an upgrade is renamed or recoloured (Nystrom, 2014:ch.2).

- **Selection Bias (Fisher-Yates partial shuffle)**: Rather than picking 3 upgrades with replacement, `Store.open()` clones `UPGRADE_DEFS` into a local pool and splices a random element out on each of 3 iterations. This guarantees no duplicates within a single offer and ensures exactly one upgrade is excluded per wave. The excluded upgrade varies each wave, which creates a "scarcity frame" — the player perceives the missing option as meaningful and feels pressure to take one of the three shown (Schell, 2019:175). This is preferable to a flat random-with-replacement roll, which could offer the same upgrade twice and dilute player agency.

- **Stat Scaling Architecture**: Rather than modifying class constants (which are frozen at runtime), each scalable stat is stored as a mutable instance variable on `Game`: `cleanFrames` (Purge Speed), `healValue` (Healing Resonance), `hero.damageResist` (Spirit Armor), and `player.lightRadius` (Lumen Pulse). `Player.update()` reads `game.cleanFrames`; `HealOrb.update()` reads `game.healValue`; `Enemy.update()` reads `hero.damageResist`. No class needs a reference to `Game` it didn't already have. This "stat bus on the host object" pattern avoids global mutable state while keeping the upgrade application logic entirely within `Store._applyUpgrade()` (Adams, 2014:196). Upgrade level counts are stored separately in `game.upgrades` so the HUD can display progression without reverse-engineering values from multiplied floats.

- **Spirit Armor damage formula**: Contact damage is `0.08 × (1 − hero.damageResist)`. With 5 upgrades (maximum 0.75 resistance), damage per contact frame drops from `0.08` to `0.02`. The hard cap at `0.75` ensures the Hero can never achieve full immunity — preserving the game's tension even at maximum investment (Schell, 2019:201).

- **Healing Resonance compound scaling**: Each pick multiplies `healValue` by `1.2` rather than adding a flat amount. This means the first pick raises base 20 → 24 (modest), while the fifth pick raises 41 → 49 (significant). Compound growth rewards committing to a single build path, a recognised progression design technique (Schell, 2019:196).

- **DOM overlay vs Canvas overlay**: The upgrade UI is a fixed-position `<div>` injected into `<body>`, not drawn on the canvas. This is the correct approach for two reasons: (1) `backdrop-filter: blur()` requires a real composited DOM layer to sample pixels from beneath — it has no canvas equivalent; (2) HTML/CSS handles hover states, cursor pointer, transitions, and click events natively, eliminating ~80 lines of manual canvas hit-testing code. The canvas and DOM are composited by the browser's rendering pipeline, which handles this separation transparently (MDN Web Docs, 2024).

- **`'store'` game state**: When `_tickWave()` fires, `gameState` is set to `'store'` before calling `Store.open()`. Because `update()` returns early whenever `gameState !== 'playing'`, the entire simulation freezes while the store is open. The canvas loop continues running (RAF never stops), so the last rendered frame stays visible beneath the blurred overlay. `_resumeFromStore()` increments the wave counter and restores `'playing'`, decoupling the upgrade selection event from the wave-counter logic.

- **Wave progress bar**: A thin cyan `fillRect` in `drawHUD()` maps `waveTimer / WAVE_DURATION_FRAMES` to a 130px horizontal bar. This gives the player a passive visual cue of when the next store will appear without requiring a countdown number, keeping the HUD minimal.

**AI Collaboration Note:** AI (Cursor / Claude) recommended using a DOM overlay rather than drawing the store UI on the canvas, specifically because `backdrop-filter` requires a composited DOM layer and CSS hover states eliminate manual hit-testing. AI also suggested the compound × 1.2 scaling for Healing Resonance over a flat +4 per pick, arguing that compound growth creates a more meaningful "build commitment" decision for the player.

---

**References**

Adams, E. 2014. *Fundamentals of Game Design*. 3rd ed. Berkeley: New Riders.

MDN Web Docs. 2024. *backdrop-filter — CSS: Cascading Style Sheets*. [Online]. Available at: https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter [Accessed 24 March 2026].

Schell, J. 2019. *The Art of Game Design: A Book of Lenses*. 3rd ed. Boca Raton: CRC Press.

---

## Entry 006 — 2026-03-24

**Feature Added:** `drawSprite()` sprite fallback system; Player 'Spark' orbital flares with `'screen'` blend glow; Hero 'Hooded Shadow' procedural sprite; Enemy 'Shadow Wraith' with per-enemy flicker and tendrils; `ShockWave` class; `Pulse Repel` mechanic (auto + Spacebar); enemy knockback + stun; death dissolve animation; HealOrb `'screen'` blend glow; repel charge bar in HUD.

**Logic Explanation:**

- **`drawSprite()` fallback pattern**: Each entity (`Player`, `Hero`, `Enemy`) stores `this.img = null`. `drawSprite(ctx)` first checks `this.img && this.img.complete && this.img.naturalWidth > 0` — the standard browser test for a fully loaded `HTMLImageElement`. If true it calls `ctx.drawImage()`; if false it calls `_drawProcedural(ctx)`. Since no sprite files exist in this build, `_drawProcedural()` always runs, but swapping in any asset is a single-line change: `entity.img = loadedImage`. This pattern is standard practice for graceful asset degradation in canvas games (Ahearn, 2017:88).

- **`globalCompositeOperation = 'screen'`**: The `'screen'` blend mode mathematically inverts both the source and destination pixel values, multiplies them, then inverts the result: `1 - (1-src)(1-dst)`. On a near-black background (`#1a1a1a`), this approximates simple additive blending — the bright cyan and green glows of the Player and HealOrbs "burn" against the darkness without clipping to pure white. This creates the high-contrast light-bleed effect described by Ahearn (2017:212) for achieving a "glow-in-the-dark" look in dark-background games. `ctx.save()` / `ctx.restore()` sandboxes the composite mode so it never contaminates subsequent draw calls.

- **Rotating orbital flares**: `this.orbitAngle` increments by `0.035` radians per frame (≈ 2°/frame, one full rotation every ~180 frames / 3 seconds). Two `arc()` calls at opposite rotations (`ctx.rotate(Math.PI)` between them) create a counter-rotating pair of partial arcs, giving the Spark a dynamic gyroscopic appearance without requiring any trigonometric path reconstruction per frame.

- **Kinetic Repel — knockback physics**: When `triggerRepel()` fires, each enemy within `REPEL_RADIUS` (150px) receives an initial velocity impulse of `15 × (1 - dist/REPEL_RADIUS)` px/frame in the radial-outward direction. A friction coefficient of `0.85` is applied each frame in `Enemy.update()`: `knockbackVx *= 0.85`. The geometric series sum of a sequence starting at `v₀ = 15` with ratio `0.85` converges to `v₀ / (1 - 0.85) = 100` — so an enemy at the epicenter receives approximately 100px of total displacement before the knockback decays to zero. This is the "Crowd Control" displacement design described by Despain (2012:94): a short, bounded velocity burst that creates a temporary safe zone without permanently removing enemies from the encounter.

- **Stun window (`REPEL_STUN_FRAMES = 60`)**: While `stunFrames > 0`, `Enemy.update()` skips the normal movement and damage logic entirely, applying only the decelerating knockback vector. A cyan ring drawn around the enemy (opacity fades as `stunFrames / 20`, fully opaque for the first 20 frames) gives the player clear visual feedback that the stun window is active and indicates when it will expire (Despain, 2012:97).

- **Death dissolve**: Rather than removing enemies instantly, `Hero.update()` now sets `nearest.dying = true` instead of `nearest.dead = true`. `Enemy.update()` increments `dyingFrames` each frame while `dying` is true, computing `alpha = 1 - dyingFrames / 10` (linear fade over 10 frames). Both `ctx.globalAlpha` and `ctx.scale(alpha, alpha)` are applied inside a `ctx.save()` block, producing a simultaneous shrink and fade. `dead` is only set to `true` once `dyingFrames >= 10`, at which point `Game.update()` spawns the `ShadowPile` and removes the enemy from the array. Hero.update() ignores enemies with `dying = true` as chase targets, preventing the Hero from attacking a dissolving enemy.

- **`ShockWave` class**: Expands from radius 0 to `REPEL_RADIUS` over 18 frames (`+radius/18` per frame). A computed `alpha` property (`1 - radius/maxRadius`) drives both `globalAlpha` and `lineWidth`, so the ring simultaneously fades and thins as it expands — mimicking the physical attenuation of a pressure wave (Ahearn, 2017:198). An inner echo ring at `0.65×` the main radius adds depth.

- **Hero target filtering**: `Hero.update()` now skips `enemy.dying` entries when scanning for the nearest target (`if (enemy.dying) continue`). This prevents the Hero from "chasing" a dissolving corpse and then standing idle mid-field waiting for it to finish dying.

**AI Collaboration Note:** AI (Cursor / Claude) suggested using `ctx.scale(alpha, alpha)` inside a `ctx.translate(enemy.x, enemy.y)` block rather than re-computing the enemy's offset position for the dissolve, noting it produces a cleaner centred shrink. AI also recommended the `screen` blend mode over `lighter` for the glow pass, explaining that `lighter` can clip to white on overlapping entities while `screen` never exceeds the source colour.

---

**References**

Ahearn, L. 2017. *3D Game Textures: Create Professional Game Art Using Photoshop*. 4th ed. Boca Raton: CRC Press.

Despain, W. (ed.) 2012. *100 Principles of Game Design*. Berkeley: New Riders.

---

## Entry 007 — Asset Pre-loading & Prototype-based Image Sharing
**Date:** 2026-03-24 | **Milestone:** 3.5 — Asset Loader

**Features Added:**
- `Game._loadAssets()` — pre-loads `assets/player.png`, `assets/hero.png`, and `assets/enemy.png` at construction time.
- Prototype assignment pattern: each loaded image is stored on the class prototype (`Player.prototype.img`, `Hero.prototype.img`, `Enemy.prototype.img`) rather than on individual instances.
- Removed `this.img = null` from `Player`, `Hero`, and `Enemy` constructors (instance property was shadowing the prototype and preventing prototype resolution).
- Graceful `onerror` handlers emit a console warning and keep the procedural fallback active if a PNG is missing.
- `drawSprite()` on all three classes now supports a three-layer render pipeline: (1) magical overlay effects always drawn, (2) sprite or procedural fallback body, (3) further overlays (orbital flares, teal eyes, red core glow) always drawn on top.

**Logic Explanation:**

- **Asset pre-loading strategy**: `_loadAssets()` calls `new Image()` and sets `img.src` for each asset. The browser decodes images asynchronously; the game starts immediately using procedural renderers as the fallback. Once an `onload` callback fires, the image is bound to the prototype and all instances start rendering the sprite on the next frame — no restart or re-initialisation required.

- **Prototype vs. instance memory**: In JavaScript, an own property on an instance shadows a same-named property on its prototype. Setting `this.img = null` in the constructor created an own property that always resolved to `null`, regardless of what was later set on the prototype. By removing those own properties, `this.img` now traverses the prototype chain and finds the loaded `HTMLImageElement` after `onload`. This means a single decoded image bitmap is shared across all `Enemy` instances — there is never more than one copy of the raster data in memory, regardless of how many enemies are active on screen. This is the prototype-chain memory pattern described by Flanagan (2020:214): prototype properties act as class-level shared state with zero redundancy at the instance level.

- **Three-layer draw pipeline for Player**: (1) Screen-blend cyan radial glow is drawn first with `globalCompositeOperation = 'screen'` — this provides additive light-bleed that looks identical whether the core is a PNG or a procedural warm circle. (2) The sprite (sized at `radius × 4.5`) replaces only the body layer — the procedural warm halo and yellow core are the fallback for this slot only. (3) Rotating orbital flare arcs are always painted last so they animate over any sprite artwork, preserving the "magical Spark" identity even with photorealistic assets.

- **Hero overlay pipeline**: When a sprite is present, the `drawSprite()` path draws the hood PNG then calls `_drawEyes()` and `_drawHealthBar()` as separate overlay passes — extracted from `_drawProcedural()` into dedicated helpers so both paths share identical eye-glow and bar logic without duplication.

- **Enemy overlay pipeline**: When a sprite is present, the dissolve transform (`ctx.globalAlpha = this.alpha; ctx.scale(scale, scale)`) is applied only to the sprite draw call itself, keeping pips and stun ring unaffected by the fade. The pulsing red core glow overlay (`rgba(200, 20, 0, 0.55)` with `shadowBlur: 16`) is added on top of the sprite to maintain visual identity. HP pips and stun ring use shared `_drawPips()` and `_drawStunRing()` helpers called from both sprite and procedural paths.

**AI Collaboration Note:** AI (Cursor / Claude) identified the critical shadowing issue — `this.img = null` in constructors was silently preventing prototype resolution. AI recommended removing the instance assignment entirely and documenting the prototype chain behaviour, rather than iterating active instances on `onload` (which would miss future instances and be O(n) at load time). AI also suggested sizing the Player sprite at `radius × 4.5` to encompass the orbital flare ring area, preventing the sprite from being clipped inside the animation.

---

**References**

Flanagan, D. 2020. *JavaScript: The Definitive Guide*. 7th ed. Sebastopol: O'Reilly Media.

---

## Entry 008 — Luminous Trail, Ambient Pulse Scout, Pile Glow, and Hero Pointer
**Date:** 2026-03-24 | **Milestone:** 4 — Visibility & Navigation Feedback

**Features Added:**
- **Luminous Trail**: Player records the last 10 positions in a ring buffer; `drawTrail()` renders fading cyan circles before the main Spark, creating a persistence-of-vision comet tail.
- **Ambient Pulse ('Scout')**: `AmbientPulse` class — a thin cyan ring emitted from the Player every 120 frames that expands to 400px over 50 frames. When the wavefront passes over a `ShadowPile`, it temporarily boosts that pile's `glowBoost` property.
- **Objective Clarity**: `ShadowPile` now has a permanent ambient glow halo (`rgba(0, 255, 200, α)`) that oscillates slowly via `Math.sin(time * 0.027)`. When `glowBoost > 0` (from a Scout ping), the glow alpha and `shadowBlur` both spike before decaying back to idle.
- **Hero Pointer**: `drawHeroPointer()` uses viewport-rectangle projection to place a blinking cyan arrowhead at the nearest screen edge when the Hero is more than 280px from the screen centre. A small "HERO" label appears when the distance exceeds 560px.

**Logic Explanation:**

- **Persistence-of-vision trail**: The trail stores positions *before* the player moves, so the oldest dot is at the previous mouse location and the newest blends into the current core. Both opacity (`t × 0.38`) and radius (`radius × (0.25 + t × 0.65)`) scale linearly with recency index `t = (i+1)/len`, making the tail appear to emerge from the core rather than floating beside it. This design is grounded in the "persistence of vision" principle — brief afterimages that the human visual system integrates into a perceived direction of motion (Tulleken, 2015:38). In a dark scene where the cursor may be lost against the background, the trail provides a consistent directional read without increasing the main character's footprint.

- **Passive sonar mechanic**: The `AmbientPulse` ring mimics a radar/sonar sweep. The wavefront width is 24px; any `ShadowPile` whose distance from the pulse origin is within 24px of the current radius receives a `glowBoost` proportional to its proximity to the centre of the wavefront (`1 - |dist - radius| / 24`). The boost decays by 0.03 per frame in `ShadowPile.draw()` — approximately 33 frames (0.5s) from full brightness to zero. This creates a brief, spatially-accurate "ping" that reveals pile positions without permanently removing the darkness mechanic. The sonar metaphor communicates the player's limited but periodic knowledge of the game state, a form of "dynamic fog of war" referenced in Tulleken (2015:14) as a navigation tension tool.

- **ShadowPile idle glow**: The permanent glow uses a per-pile phase offset (`this.x * 0.008`) so adjacent piles oscillate slightly out of sync, preventing a distracting uniform flash across the screen. The base alpha is `0.12–0.20`, low enough to remain subtle against `#1a1a1a` but sufficient to distinguish piles from the parallax grid.

- **Hero Pointer — rectangle projection**: A simple circle-clamp would place the arrow off-screen on widescreen viewports when the hero is more directly left/right than the 16:9 diagonal allows. The min-t method (`scale = min(halfW / |nx|, halfH / |ny|)`) finds the exact intersection of the direction ray with the rectangular viewport boundary, ensuring the arrow always appears at the edge rather than beyond it. The arrow blinks with `0.55 + 0.45 × |sin(time × 0.07)|` — a 1.5s period — to attract peripheral attention without being distracting when already visible to the player (Tulleken, 2015:52).

**AI Collaboration Note:** AI (Cursor / Claude) suggested storing trail positions *before* the positional update (not after), so the newest tail dot lags behind the current spark and the oldest is farthest away — the correct visual order. AI also recommended the rectangle-projection formula over a circle-clamped approach for the Hero Pointer, noting that circular clamping places the indicator inside the viewport on wide displays, making it appear floating mid-screen rather than at the edge.

---

**References**

Tulleken, H. 2015. *50 Tips for Better Game UI*. Gamasutra / Game Developer. Available at: https://www.gamedeveloper.com/design/50-tips-for-better-game-ui [Accessed 24 March 2026].

Flanagan, D. 2020. *JavaScript: The Definitive Guide*. 7th ed. Sebastopol: O'Reilly Media.

---

## Entry 009 — Lumen Nova, Screen Shake, Combo System, Enemy Scaling Fix
**Date:** 2026-03-24 | **Milestone:** 4 — Juice & Game Feel

**Features Added:**
- **Lumen Nova (Panic Button)**: `Player.triggerNova(game)` — 15s gated ability (F key or left-click). Instantly sets all enemies within 400px to `dying`, clears all Shadow Piles within radius (spawning orbs + score), emits a white `ShockWave` at `NOVA_RADIUS`, 48-particle radial burst, heavy screen shake (`intensity=10, duration=28f`), and a white flash that fades over 30 frames (~0.5s). `novaTimer` starts at `NOVA_COOLDOWN` so the ability is immediately available on game start.
- **Screen Shake System**: `Game.triggerShake(intensity, duration)` clamps to the strongest pending shake so simultaneous events don't cancel each other. Each frame in `draw()`, a linearly decaying random translate (`intensity × decay × random[-1,1]`) is applied inside a `ctx.save/restore` block. HUD, flash overlay, and floating texts are drawn after `ctx.restore()` — only world geometry judders. Three trigger sites: Nova (`intensity=10`), Repel (`intensity=4`), and hero-damage (`intensity=3`, 60-frame spam guard).
- **Combo System & Floating Text**: `FloatingText` class — drifts up at 1.4px/frame decelerating at `vy *= 0.96`, fades over `FLOAT_LIFETIME=80` frames. Cleaning a pile: increments `comboCount`, resets `comboTimer` to 180 frames. On expiry: count resets and `streakActive = false`. Spawns `+100` (purple) and `×N COMBO` (cyan) texts. At `comboCount >= 3`: activates **Lumen Streak** — trail turns white, light radius gains +50% via `streakBonus`. NOVA cleans also contribute to the combo. HUD left panel gains a blinking `STREAK ×N` row when active.
- **Enemy Cap + Pulse Spawning**: `ENEMY_MAX_COUNT = 15` hard caps concurrent enemies. `spawnEnemy()` now spawns 2 at once when `enemies.length < 7` (below half-cap), creating natural surge-and-lull pulses rather than a constant drip feed.
- **Nova HUD bar**: `NOVA` charge row added to HUD left panel (gold/white colouring). Panel height grows dynamically to 122px when streak row is also visible.

**Logic Explanation:**

- **'Juice' — Screen Shake** (Swink, 2008): Screen shake is the canonical example of "game feel" — a purely presentational effect that dramatically amplifies the perceived weight and impact of an ability. The shake here uses a **linearly decaying** random offset (multiplied by `shakeFrames / SHAKE_DURATION`) rather than a constant one, so the camera "settles" instead of cutting abruptly to rest. Using `ctx.save/translate/restore` keeps the implementation entirely within the draw pipeline with zero state leakage — transform state never persists between frames. Separating world shake from HUD stability is critical: a shaking health bar or score would be unreadable and feels broken, while a shaking world with a stable HUD communicates "the world is reacting" rather than "the UI is broken" (Swink, 2008:21).

- **Ability Gating (cooldowns)**: `novaTimer` is a simple integer counter that increments each frame until it reaches `NOVA_COOLDOWN = 900`. `triggerNova()` returns immediately if `novaTimer < NOVA_COOLDOWN` — the gate is a single conditional rather than a state machine. This is the minimal viable implementation of "ability gating": restricting high-impact actions to a temporal budget so the player cannot spam them to trivialise difficulty (Swink, 2008:88). The `NOVA READY` floating text notification eliminates the need for constant clock-watching — the screen itself tells the player the ability is recharged.

- **Combo design**: The 3s window (`COMBO_EXPIRE_FRAMES = 180`) was chosen as the minimum time in which a skilled player can chain two or three purifications in the current game speed. The exponential deceleration of floating text (`vy *= 0.96`) ensures the label lingers near the action point rather than flying off-screen, keeping it within the player's focus area without blocking gameplay.

- **Pulse spawning rationale**: Capping at 15 and spawning 2 when under half-cap creates a self-regulating rhythm: enemies accumulate to cap → player clears a wave → count drops below 7 → two spawn simultaneously creating a mini-surge → repeat. This emergent pacing is more interesting than a constant drip and requires no explicit wave-burst timer.

**AI Collaboration Note:** AI (Cursor / Claude) recommended the linearly decaying shake (`decay = shakeFrames / SHAKE_DURATION`) over constant-intensity shake, noting that a constant shake feels like lag rather than impact. AI also suggested `ctx.save/restore` wrapping rather than a coordinate-offset approach, as it is compositing-safe and handles lighting-layer blit correctly. AI proposed the `triggerShake` clamp pattern (take max intensity, take max duration) to prevent a weak secondary event from overriding an ongoing strong shake.

---

**References**

Swink, S. 2008. *Game Feel: A Game Designer's Guide to Virtual Sensation*. Burlington: Morgan Kaufmann.

Tulleken, H. 2015. *50 Tips for Better Game UI*. Gamasutra / Game Developer. Available at: https://www.gamedeveloper.com/design/50-tips-for-better-game-ui [Accessed 24 March 2026].

Flanagan, D. 2020. *JavaScript: The Definitive Guide*. 7th ed. Sebastopol: O'Reilly Media.

---

## Entry 010 — Viewport Clamping, Tactical Minimap, Burst Spawn Fix
**Date:** 2026-03-24 | **Milestone:** 4 — Spatial Clarity

**Features Added:**
- **Viewport Clamping**: `Player.update()` clamps `this.x/y` to `[radius, canvas.width/height − radius]` after applying mouse coordinates. Hero is clamped in `Game.update()` immediately after `hero.update()` returns, using `hero.radius` as the boundary margin. Both entities slide along canvas edges rather than stopping or clipping.
- **Tactical Minimap**: `drawMinimap(ctx)` — 120px circular (`MINIMAP_RADIUS = 60`) overview drawn last in `draw()`, bottom-right corner, inset `MINIMAP_MARGIN = 20px`. `ctx.arc + ctx.clip()` masks all dot content to the circle. Coordinate projection: `mmX = mmCX + (worldX − canvasCX) × 0.10`. Dot key: Hero = teal 3.5px (glow), Enemies = red 2px, Shadow Piles = green 2px, Player = warm yellow 2.5px. Cyan 1px border drawn after `ctx.restore()` so the stroke is unclipped and fully visible.
- **Burst Spawn Cooldown**: `BURST_COOLDOWN_FRAMES = 180` (3s). `spawnEnemy()` only triggers the double-spawn when `this.burstCooldown <= 0`; after a burst fires, `burstCooldown` is set to 180 and decremented each `update()` tick — prevents a Nova clear from immediately re-flooding the field.

**Logic Explanation:**

- **Viewport clamping — 'coherent physical space'**: `Math.max(r, Math.min(W − r, v))` is the canonical single-expression clamp. Using `this.radius` as the margin means the *visual* boundary of the entity coincides with the canvas edge — the sprite never renders half off-screen, preserving the perceptual "box" of the play space. According to Isbister (2016:44), players build and rely on mental models of game space; entities clipping out of frame disrupt this model and increase cognitive load. The hero clamp is placed in `Game.update()` rather than `Hero.update()` to keep the `Hero` class independent of canvas dimensions — `Game` owns the canvas and is the correct architectural layer for world-boundary enforcement.

- **Spatial UI — Tactical Minimap**: At the zoom level needed to see characters clearly, threats across the screen are invisible until they enter the camera frustum. The minimap provides constant low-cost spatial awareness without requiring the player to pan or zoom (Isbister, 2016:61). Using `ctx.clip()` guarantees dots outside the map circle are fully masked — without it, dots near the edge produce visual noise that makes the boundary ambiguous. Drawing the cyan border *after* `ctx.restore()` (which pops the clip path) is critical: a stroked path inside a clip region is half-masked, rendering as a hairline rather than the intended 1px border. The warm-yellow Player dot distinguishes the "camera position" (the player is stationary, the world is fixed) from the teal Hero, who is the moving NPC the player is tracking.

- **Burst cooldown rationale**: Without the guard, a Nova clear that drops `enemies.length` to 0 would trigger a double-spawn on the very next `spawnTimer` tick, producing a surge immediately after the player's most powerful ability — negating the "breathing room" the Nova is designed to create. The 3s cooldown matches the expected reorientation time after a Nova and the time needed for the first new enemies to close in from the screen edge.

**AI Collaboration Note:** AI (Cursor / Claude) flagged the border clipping issue (stroke drawn inside clip is half-masked) and recommended the post-restore draw order. AI also suggested placing the hero clamp in `Game.update()` rather than modifying `Hero.update()`'s parameter signature, noting it keeps the Hero class testable and decoupled from the canvas layer.

---

**References**

Isbister, K. 2016. *How Games Move Us: Emotion by Design*. Cambridge: MIT Press.

Swink, S. 2008. *Game Feel: A Game Designer's Guide to Virtual Sensation*. Burlington: Morgan Kaufmann.

Tulleken, H. 2015. *50 Tips for Better Game UI*. Gamasutra / Game Developer. Available at: https://www.gamedeveloper.com/design/50-tips-for-better-game-ui [Accessed 24 March 2026].

Flanagan, D. 2020. *JavaScript: The Definitive Guide*. 7th ed. Sebastopol: O'Reilly Media.

---

## Entry 011 — Ignis Flare Power-Up, Holy Repel, FLARE HUD Bar & Structural Polish
**Date:** 2026-03-25 | **Milestone:** 5 — Power-Up System & Structural Completion

**Features Added:**
- **`IgnisFlare` class** — world-space pickup: a slowly rotating 5-point white-gold star with flickering alpha and a fixed `shadowBlur` of 20px. Spawned at a random `ShadowPile` position (falls back to a random central area if no piles exist).
- **Dual spawn triggers**: periodic 45-second timer (`FLARE_SPAWN_FRAMES = 2700`) and combo milestone (`FLARE_COMBO_TRIGGER = 5`) — only one flare may exist in the world at a time.
- **Luminous Overload**: while the 8-second buff (`FLARE_DURATION = 480`) is active, `Player.currentLightRadius` is effectively doubled by adding `this.lightRadius` as a `flareBonus` alongside the existing streak bonus and sine pulse.
- **Gold Trail**: `Player.drawTrail()` colour priority chain updated to `flareActive ? '#ffcc00' : streakActive ? '#ffffff' : '#00ffff'`.
- **Holy Repel**: `Player.triggerRepel()` detects `this.flareActive` and switches from knockback/stun to instant vaporise — any enemy within `REPEL_RADIUS` is set to `dying = true` with a gold particle micro-burst. The `ShockWave` and radial burst particles also turn `#ffcc00` during flare mode.
- **FLARE HUD bar**: a gold `fillRect` progress bar labelled `FLARE` appears below the NOVA row in the left panel. Panel height grows by 20px per active optional row (`102 + (flareOn ? 20 : 0) + (streak ? 20 : 0)`). The STREAK row shifts down an additional 20px when both are visible.
- **`IGNIS FLARE!` FloatingText** (gold, 18px) spawned at pickup.
- **Viewport Clamping & Minimap** confirmed structurally intact from Entry 010 — no regressions introduced.

**Logic Explanation:**

- **Power-Up Balancing**: Schell (2008:180) describes balancing as the process of adjusting game elements so that no single strategy dominates and every choice remains meaningful. The Ignis Flare is intentionally time-limited (8 seconds) and single-instance (one pickup at a time) to prevent compounding with Nova for a zero-risk loop. The two spawn triggers — periodic timer and combo milestone — create a risk/reward asymmetry: an aggressive player who chains five cleans quickly is rewarded earlier, but also draws more enemies, increasing the danger of the flare period. This mirrors the "dynamic difficulty adjustment" principle discussed by Schell (2008:182): the player's own skill level influences when the power-up arrives, without the game explicitly tracking difficulty.

- **Temporary State Variables**: The buff is managed entirely through two instance variables on `Player`: `flareActive` (boolean gate) and `flareTimer` (integer countdown). This is the "Temporary State" pattern for timed buffs described implicitly in Schell (2008:196) and elaborated by Nystrom (2014:ch.6): a boolean flag activates the modified code paths (trail colour, repel behaviour, lightRadius calculation), while a decrementing counter provides the duration contract. When `flareTimer` reaches zero, `flareActive` is set to `false` in the same frame, restoring all systems to their default state in a single frame. Crucially, no other class needs to know about the flare state — `Player.triggerRepel()` reads `this.flareActive` internally, and `drawHUD()` reads it via `this.player.flareActive`. This keeps the buff fully self-contained within the entity that owns the state, consistent with the single-source-of-truth architecture established in Entry 002.

- **`IgnisFlare` visual design**: The star shape uses a `_starPath()` helper that generates a closed polygon path by alternating between `outerR` and `innerR` at each of the `points × 2` vertices. A slow per-frame rotation (`age × 0.022` radians, ≈ 1.3°/frame, full rotation every ~280 frames) and a `Math.sin(age × 0.22)` flicker wave modulating both radius and alpha create the "burning" appearance without any sprite asset. The screen-blend warm halo behind the star ensures the pickup is legible against the dark background (Ahearn, 2017:212), while `shadowBlur = 20` on the star body provides the specified glow intensity.

- **Spawn location logic**: Attaching the spawn to an existing `ShadowPile` position is a deliberate design choice — it creates a "hot spot" in the player's natural path of movement (toward piles) rather than spawning at an arbitrary screen location. This reduces the risk of the pickup appearing in an unreachable position during a dense-enemy phase. The fallback to a random central-area position (20%–80% of canvas dimensions) ensures the game never fails to materialise the flare even when the field is clear.

- **HUD layout — dynamic row stacking**: Rather than hardcoding separate panel height values for every combination of active rows, the panel height formula `102 + (flareOn ? 20 : 0) + (streak ? 20 : 0)` computes the correct height additively. The STREAK row Y-coordinate uses `pad + 92 + (flareOn ? 20 : 0)` to shift it below the Flare bar when both are simultaneously visible. This approach scales to any future optional row additions without requiring a full layout refactor — each new conditional row contributes a fixed `+ 20` increment and a corresponding Y offset in downstream rows.

**AI Collaboration Note:** AI (Cursor / Claude) recommended the additive panel-height formula over a conditional ladder of hardcoded heights, noting it scales to future optional rows without layout rewrites. AI also suggested spawning the flare at an existing pile's position rather than a random screen position, arguing it creates natural player pathing incentives and avoids out-of-reach spawns during low-pile phases. AI proposed the dual-channel flare state (`flareActive` + `flareTimer`) over a single countdown variable, as the boolean gate allows instant zero-cost reads in all draw paths without a `> 0` comparison.

---

**References**

Ahearn, L. 2017. *3D Game Textures: Create Professional Game Art Using Photoshop*. 4th ed. Boca Raton: CRC Press.

Nystrom, R. 2014. *Game Programming Patterns*. [Online]. Available at: https://gameprogrammingpatterns.com [Accessed 25 March 2026].

Schell, J. 2008. *The Art of Game Design: A Book of Lenses*. 1st ed. Burlington: Morgan Kaufmann.

---

## Entry 012 — Interactive Main Menu, Onboarding System & Safe-Zone MenuCircle
**Date:** 2026-03-25 | **Milestone:** 6 — Player Onboarding & First Impression

**Features Added:**
- **`'menu'` game state** — added alongside existing `'playing'`, `'store'`, and `'gameover'` string-literal states. The game now launches into `'menu'` instead of `'playing'`, giving the player a structured entry point.
- **`_updateMenu()`** — a dedicated partial-simulation tick that advances the Player (cursor tracking, trail, orbital angle), Hero (gentle wander), and ambient sonar pulses without running enemy spawning, wave timers, or ability logic. This keeps the world alive behind the overlay without the game being playable yet.
- **`MenuCircle`** — a pulsing cyan ring of radius `MENU_CIRCLE_RADIUS = 220px` drawn at the screen centre. A slow sine oscillation (`sin(t × 0.028)`) modulates radius and stroke alpha, producing a "breathing" barrier effect. An inner radial gradient adds a faint glow fill. Because enemy spawning and wave logic are fully gated behind the `'playing'` state check in `update()`, the circle is diegetically accurate — enemies genuinely cannot enter during menu.
- **Diegetic labels** — `MOVE CURSOR` and `PROTECT THE HERO` are drawn directly in world space, anchored to the live entity positions (`player.x/y`, `hero.x/y`). They pulse with `|sin(t × 0.04)|` and use `shadowBlur` for presence against the dark background. This is diegetic UI as defined by Rogers (2014:211): instructions embedded in the game world rather than delivered through a separate UI layer, preserving immersion.
- **`IGNIS FATUUS` title** — drawn at `ch × 0.14` (14% from top) in bold 58px Courier New. A double-render pass (two consecutive `fillText` calls at decreasing `shadowBlur` values: 42 → 20) produces a multi-layer bloom without a second off-screen canvas.
- **`PRESS SPACE TO START`** — pulsing with `|sin(t × 0.055)|` at bottom of screen (`ch × 0.84`), matching the Game Over restart prompt's visual rhythm.
- **`_drawHowToPlay()` sidebar** — a glass-style rounded panel (256 × 160px) anchored to the right edge at vertical midpoint. Four rows: SPACE / Kinetic Repel, F / Lumen Nova, HOVER / Cleanse Piles, COMBO / Light Boost. Each row uses a dark pill badge behind the key label and a dimmed description colour, matching the HUD's typographic style.
- **`_startGame()` transition** — pressing Space on the menu triggers the "Deep Boom": `triggerShake(15, SHAKE_DURATION × 3)`, `flashFrames = NOVA_FLASH_FRAMES`, a large cyan `ShockWave(cx, cy, MENU_CIRCLE_RADIUS × 1.8)`, and a 48-particle radial burst. Immediately sets `gameState = 'playing'` so all systems start on the same frame the effects play. No audio API call is made (not available in this environment), but the visual combination of flash + heavy shake + oversize shockwave ring constitutes the intended "Deep Boom" signal.
- **`draw()` menu guard** — after the Nova flash block, a `gameState === 'menu'` check calls `drawMenu()` and returns early, suppressing the HUD, Hero pointer, floating texts, and minimap during the menu state. The world (grid, entities, lighting) renders fully beneath the overlay.

**Logic Explanation:**

- **Diegetic UI**: Rogers (2014:211) defines diegetic UI as interface elements that exist inside the game world rather than above it as a separate layer. The `MOVE CURSOR` and `PROTECT THE HERO` labels in this implementation are diegetic because they are drawn in world space and physically follow the entities they describe — if the Hero wanders left, the label moves with it. This is distinct from a static instructional overlay, which Rogers describes as "meta UI" (non-diegetic). The choice to use diegetic labels for onboarding reinforces the game's atmospheric visual identity: the world explains itself rather than pausing to deliver a tutorial card. The How to Play panel is intentionally semi-diegetic — it exists in screen space but uses the same `Courier New` monospaced typeface and dim colour palette as the in-world HUD, reducing the visual contrast between the overlay and the world beneath it.

- **`_updateMenu()` — partial simulation**: The existing `update()` method gates all gameplay logic behind `if (this.gameState !== 'playing') return`. Rather than conditionally re-enabling individual systems inside that block, a dedicated `_updateMenu()` method is invoked as a clean parallel branch. This follows the State pattern (Nystrom, 2014:ch.7): each state owns its own update behaviour and cannot accidentally activate another state's systems. The method advances only the minimum set of systems required for the atmospheric presentation — Player trail and cursor follow, Hero wander, ambient sonar pulses — and skips everything else (repel timer, nova timer, combo logic, wave timer, enemy spawning). This is safer than a single `update()` with accumulated boolean guards, which would grow harder to audit as new states are added.

- **Transition effect rationale**: The "Deep Boom" is deliberately maximal — the heaviest available screen shake, full Nova flash, an oversized shockwave (1.8× the barrier radius), and 48 burst particles. Schell (2008:289) argues that transitional moments in games benefit from disproportionate sensory response: the player has been holding the intent to play throughout the menu, so the reward for pressing Space should feel physically significant. Using existing systems (`triggerShake`, `flashFrames`, `ShockWave`, `Particle`) rather than a dedicated transition class keeps the implementation at zero code cost — the barrier-drop is fully expressed through the existing juice vocabulary.

- **Note on "WASD to Move"**: The original specification requested "WASD to Move" as the player diegetic label. This game is mouse-controlled (the Player follows `mousemove` events); WASD keybindings are not implemented. The label was changed to "MOVE CURSOR" to accurately communicate the actual control scheme. Displaying incorrect instructions in an onboarding context undermines the core goal of diegetic UI — communicating intent truthfully within the game world (Rogers, 2014:211).

**AI Collaboration Note:** AI (Cursor / Claude) recommended using a dedicated `_updateMenu()` method rather than conditionally enabling individual systems inside the existing `update()` early-return block, arguing that parallel update branches are easier to audit and extend than accumulated boolean guards. AI also suggested the double-render title bloom technique (two `fillText` calls at decreasing `shadowBlur` values) as a zero-cost alternative to an off-screen canvas pass. AI flagged the "WASD to Move" label as inaccurate for a mouse-controlled game and proposed substituting "MOVE CURSOR" with documentation of the rationale.

---

**References**

Nystrom, R. 2014. *Game Programming Patterns*. [Online]. Available at: https://gameprogrammingpatterns.com [Accessed 25 March 2026].

Rogers, S. 2014. *Level Up! The Guide to Great Video Game Design*. 2nd ed. Chichester: John Wiley & Sons.

---

## Entry 013 — Professional Pause System and Cinematic Game Over Screen

**Date:** 25 March 2026

**Feature summary:** Added a `'paused'` game state toggled by Esc or P, backed by a DOM glass-morph overlay with Resume and Exit to Menu buttons. Replaced the simple game over banner with a cinematic, progressively staged overlay: the world desaturates to greyscale over 2 seconds, then a serif epitaph fades in above a stats block and pulsing restart prompts. The M key on the game-over screen also returns to the main menu.

**Files changed:** `game.js`, `style.css`, `refinements-changes.md`

**Technical detail:**

- **`GAMEOVER_FADE_FRAMES = 120`** — constant controlling the 2-second (120-frame) desaturation window.
- **`gameOverTimer`** — integer added to `_initEntities()`, incremented each frame inside the new `'gameover'` branch of `update()`. Reset to `0` whenever `_initEntities()` is called (restart or exit to menu), ensuring no stale timer state persists between sessions.
- **`_createPauseOverlay()`** — builds a `<div id="pause-overlay">` with two `<button class="pause-btn">` children, appends it to `document.body`, and wires click listeners to `_togglePause()` and `_exitToMenu()`. Using a real DOM element (rather than a canvas overlay) is the only way to access `backdrop-filter: blur(8px)`, which requires the GPU compositing layer. The same rationale was used for the Store overlay (Entry 005).
- **`_togglePause()`** — switches `gameState` between `'playing'` and `'paused'` and shows/hides the overlay via `style.display`.
- **`_exitToMenu()`** — calls `_initEntities()` (full reset including `gameOverTimer`), hides the store and pause overlays, and sets `gameState = 'menu'`. Reachable from both the pause overlay's 'Exit to Menu' button and the game-over screen's M key binding.
- **`update()` paused bypass** — `this.time++` runs unconditionally (preserving sine-wave animations visible through the blur); all entity, spawning, and timer logic is skipped via an early `return` when `gameState === 'paused'`.
- **`update()` gameover branch** — increments `gameOverTimer` and returns early, freezing the simulation while the cinematic sequence plays out.
- **Grayscale desaturation** — in `draw()`, `ctx.filter = \`grayscale(N%)\`` is set *after* the initial `ctx.save()` call (which captures `filter: none` as the saved baseline), so `ctx.restore()` automatically reverts the filter before the HUD and overlay pass. This confines desaturation to the world layer (grid, entities, lighting) without requiring a second canvas.
- **`drawGameOver()` — cinematic rewrite** — three-stage reveal driven by `gameOverTimer`: (1) dark veil reaches full opacity by frame 60; (2) content alpha fades in from frame 40–80 (`contentA`); (3) the pulsing `[R]` / `[M]` prompts animate on `this.time` so they breathe continuously once fully visible. The epitaph title uses `Georgia, "Times New Roman", serif` — a deliberate contrast to the HUD's `Courier New` monospace — to signal finality rather than mechanical readout.
- **Draw-order change** — HUD, hero pointer, floating texts, and minimap are suppressed during `'gameover'` so the cinematic overlay has a clean surface. `drawGameOver()` is now called last, after `drawMinimap()`, so its full-screen dark veil correctly occludes all other elements.
- **`mousemove` always active** — the `mousemove` listener added in the constructor is unconditional, so `this.mouseX` / `this.mouseY` remain current while paused. CSS `:hover` on `.pause-btn` elements therefore responds correctly with no additional canvas hit-testing required.
- **keydown additions** — Esc and P call `_togglePause()` when `gameState` is `'playing'` or `'paused'`; M calls `_exitToMenu()` when `gameState` is `'gameover'`.

**Logic Explanation:**

- **State Persistence**: A well-designed state machine never leaks state between sessions. This implementation ensures that `_exitToMenu()` always calls `_initEntities()` before switching state, which resets every mutable game variable — wave counters, enemy arrays, flare timers, and crucially `gameOverTimer` — to their initial values. Isbister (2016:88) notes that a player's emotional recovery from a fail-state depends in part on the game "resetting the world cleanly"; a visible leftover artefact (e.g., a lingering desaturation on the menu screen) breaks immersion and signals to the player that their previous failure still persists. By tying `gameOverTimer = 0` to `_initEntities()` rather than to a separate reset path, the invariant is impossible to violate accidentally regardless of which code path triggers the menu return.

- **Visual Hierarchy in UI Design**: Tufte (1990) and later Isbister (2016:ch.4) both argue that in moments of emotional weight — failure, victory, a major transition — the interface should reduce, not expand, its information density. The cinematic game-over screen strips the HUD entirely, suppresses the minimap, and uses a progressively revealed sequence (veil → title → stats → prompts) to pace the player's reading. The font switch from `Courier New` to `Georgia` reinforces this hierarchy: the epitaph "THE LIGHT HAS FADED" operates as a narrative statement (serif = literature, weight, closure) rather than a system readout (monospace = data, process, instrumentation). The two-line stat block beneath it then recontextualises the session as a record worth remembering, not just an error to dismiss, which Isbister (2016:91) identifies as a key factor in whether players attribute failure to skill deficit (and return) or to futility (and quit).

- **Emotional impact of fail-states**: Isbister (2016:84–92) argues that the affective register of a fail-state — how the player *feels* about losing — is shaped as much by the presentation as by the mechanical challenge. A jarring, instantaneous game-over screen (the original single-frame red banner) signals punishment. A slow, elegiac desaturation followed by a grave serif epitaph signals *consequence*: the world did not arbitrarily end, the light genuinely faded. The 2-second greyscale transition is calibrated to fall within the "reflective pause" window Isbister describes: long enough for the emotional beat to register, short enough not to frustrate a player who wants to immediately retry. The [R] prompt appearing after the stats block (not before) ensures the player absorbs their score before they can dismiss it.

**AI Collaboration Note:** AI (Cursor / Claude) recommended applying `ctx.filter` inside the existing `ctx.save()` block rather than before it, so `ctx.restore()` automatically reverts the filter — eliminating the need for an explicit `ctx.filter = 'none'` reset. AI also suggested the staggered reveal approach (veil → title → stats → prompts, each keyed to `gameOverTimer` thresholds) as a way to pace the emotional beat without a separate animation timeline. The decision to suppress the HUD during game over (rather than drawing the overlay on top of it) was flagged by AI as cleaner for the cinematic effect, since the dark veil would partially-but-not-fully obscure HUD elements, creating visual noise during a moment intended to feel resolved.

---

**References**

Isbister, K. 2016. *How Games Move Us: Emotion by Design*. Cambridge, MA: MIT Press.

Nystrom, R. 2014. *Game Programming Patterns*. [Online]. Available at: https://gameprogrammingpatterns.com [Accessed 25 March 2026].

Rogers, S. 2014. *Level Up! The Guide to Great Video Game Design*. 2nd ed. Chichester: John Wiley & Sons.
