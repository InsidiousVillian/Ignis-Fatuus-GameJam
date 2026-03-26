// ─── Constants ────────────────────────────────────────────────────────────────

const PLAYER_RADIUS       = 8;
const PLAYER_LIGHT_RADIUS = 130;
const PULSE_AMPLITUDE     = 15;
const PULSE_SPEED         = 0.04;

const HERO_SPEED          = 1.8;
const HERO_ATTACK_RANGE   = 35;
const HERO_ATTACK_FRAMES  = 60;
const HERO_MAX_HP         = 100;
const GHOST_DRAIN_SPEED   = 0.025;

const ENEMY_BASE_SPEED      = 0.9;
const ENEMY_MAX_HP          = 3;
const ENEMY_SPAWN_FRAMES    = 180;
const SPAWN_FRAMES_MIN      = 60;
const SPEED_PER_WAVE        = 0.08;
const ENEMY_DISSOLVE_FRAMES = 10;   // shrink+fade frames before ShadowPile spawns

const REPEL_COOLDOWN    = 300;      // 5s auto-fire interval at 60fps
const REPEL_RADIUS      = 150;      // px shockwave reach
const REPEL_STUN_FRAMES = 60;       // 1s stun window

const SHADOW_CLEAN_FRAMES  = 90;
const HEAL_ORB_LERP        = 0.05;
const HEAL_ORB_VALUE       = 20;
const SCORE_PER_PILE       = 100;

const WAVE_DURATION_FRAMES = 1800;

const GRID_SIZE      = 60;
const GRID_PARALLAX  = 0.04;
const GRID_OPACITY   = 0.07;

const TRAIL_LENGTH       = 10;    // number of past positions kept for the luminous tail
const SCOUT_INTERVAL     = 120;   // frames between passive sonar pulses (2s at 60fps)
const SCOUT_MAX_RADIUS   = 400;   // px — maximum expansion of the ambient pulse ring
const SCOUT_FRAMES       = 50;    // frames to reach SCOUT_MAX_RADIUS
const HERO_POINTER_DIST  = 280;   // px from centre — beyond this the edge arrow appears

const NOVA_COOLDOWN      = 900;   // 15s at 60fps
const NOVA_RADIUS        = 400;   // px — instant-vaporise blast radius
const NOVA_SHAKE_INT     = 10;    // screen shake intensity units
const NOVA_FLASH_FRAMES  = 30;    // white flash fades over this many frames (~0.5s)
const REPEL_SHAKE_INT    = 4;     // screen shake intensity for Pulse Repel
const SHAKE_DURATION     = 14;    // default shake duration in frames

const COMBO_EXPIRE_FRAMES = 180;  // 3s window before combo resets
const COMBO_STREAK_MIN    = 3;    // minimum cleans to trigger Lumen Streak
const COMBO_STREAK_BONUS  = 0.5;  // fraction of lightRadius added during streak (+50%)

const ENEMY_MAX_COUNT       = 15;   // maximum concurrent enemies on screen
const FLOAT_LIFETIME        = 80;   // frames a FloatingText lives
const BURST_COOLDOWN_FRAMES = 180;  // 3s guard between double-spawn bursts

const FLARE_SPAWN_FRAMES  = 2700;  // 45s at 60fps — periodic Ignis Flare spawn interval
const FLARE_COMBO_TRIGGER = 5;     // combo count milestone that forces an early spawn
const FLARE_DURATION      = 480;   // 8s active buff at 60fps

const GAMEOVER_FADE_FRAMES = 120;  // 2s grayscale desaturation at 60fps

const MINIMAP_RADIUS = 60;    // px — half-width of the circular minimap
const MINIMAP_SCALE  = 0.10;  // world-to-minimap coordinate multiplier
const MINIMAP_MARGIN = 20;    // px inset from canvas corner

const MENU_CIRCLE_RADIUS = 220;  // px — safe-zone barrier ring radius in MENU state

// ─── Wraith Prime Boss Constants ──────────────────────────────────────────────

// ─── Lumen Dash Constants ─────────────────────────────────────────────────────

const DASH_COOLDOWN   = 180;   // 3s at 60fps
const DASH_DISTANCE   = 120;   // px total travel per dash
const DASH_FRAMES     = 4;     // animation frames for the dash
const DASH_GHOST_LIFE = 12;    // frames a ghost copy persists (~200ms)

// ─── Wraith Prime Boss Constants ──────────────────────────────────────────────

const WRAITH_HP               = 40;    // boss health pool
const WRAITH_RADIUS_MULT      = 3;     // 3× hitbox relative to base enemy radius (36px)
const WRAITH_SPEED            = 0.50;  // slow, weighty advance
const WRAITH_GRAVITY_INTERVAL = 240;   // 4s at 60fps between Gravity Well pulses
const WRAITH_GRAVITY_PULL     = 0.12;  // lerp fraction applied each well-fire
const WRAITH_TRAIL_INTERVAL   = 10;    // frames between Void Trail deposits
const WRAITH_DISSOLVE_FRAMES  = 90;    // 1.5s boss death dissolve
const BOSS_FADE_FRAMES        = 60;    // UI fade-in / fade-out duration in frames
const BOSS_WAVES              = [5, 10]; // which waves trigger a boss encounter

const CORRUPTION_LIFETIME     = 480;   // 8s — how long a corruption pool persists
const CORRUPTION_DRAIN_ZONE   = 20;    // px — player proximity that activates drain
const CORRUPTION_DRAIN_RATE   = 2.0;   // px of lightRadius penalty added per frame near corruption
const CORRUPTION_RECOVERY     = 0.5;   // px recovered per frame when clear
const CORRUPTION_MAX_DRAIN    = 70;    // px ceiling on corruption penalty

// ─── Upgrade Definitions ──────────────────────────────────────────────────────

const UPGRADE_DEFS = [
    { id: 'lumen',   name: 'LUMEN PULSE',        stat: '+20%  Light Radius',    lore: 'Illuminate more of the abyss.',          icon: '◉', color: '#00ffff' },
    { id: 'purge',   name: 'PURGE SPEED',         stat: '−0.3s  Purification',   lore: 'Cleanse Shadow Piles faster.',           icon: '⊕', color: '#b44fff' },
    { id: 'armor',   name: 'SPIRIT ARMOR',        stat: '+15%  Damage Resist',   lore: 'The Hero endures the darkness.',         icon: '⬡', color: '#7ecfff' },
    { id: 'healing', name: 'HEALING RESONANCE',   stat: '+20%  Orb Potency',     lore: 'Orbs resonate with greater force.',      icon: '❋', color: '#4cff91' },
];

// ─── FloatingText ─────────────────────────────────────────────────────────────
// Short-lived diegetic label that drifts upward and fades — used for score
// popups, combo notifications, and ability announcements.

class FloatingText {
    constructor(x, y, text, color = '#00ffff', size = 14) {
        this.x    = x;
        this.y    = y;
        this.text = text;
        this.color = color;
        this.size  = size;
        this.vy   = -1.4;
        this.life = 0;
        this.dead = false;
    }

    update() {
        this.y  += this.vy;
        this.vy *= 0.96;   // decelerate — float slows to a hover before vanishing
        this.life++;
        if (this.life >= FLOAT_LIFETIME) this.dead = true;
    }

    draw(ctx) {
        const alpha = Math.max(0, 1 - this.life / FLOAT_LIFETIME);
        ctx.save();
        ctx.globalAlpha  = alpha;
        ctx.font         = `bold ${this.size}px "Courier New", monospace`;
        ctx.fillStyle    = this.color;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor  = this.color;
        ctx.shadowBlur   = 10;
        ctx.fillText(this.text, this.x, this.y);
        ctx.shadowBlur   = 0;
        ctx.restore();
    }
}

// ─── Particle ─────────────────────────────────────────────────────────────────

class Particle {
    constructor(x, y, color) {
        this.x     = x;
        this.y     = y;
        this.color = color;
        this.vx    = (Math.random() - 0.5) * 1.6;
        this.vy    = (Math.random() - 0.5) * 1.6;
        this.life  = 0.7 + Math.random() * 0.3;
        this.decay = 0.035 + Math.random() * 0.03;
        this.r     = 1.5 + Math.random() * 2;
    }

    update() {
        this.x    += this.vx;
        this.y    += this.vy;
        this.life -= this.decay;
    }

    get dead() { return this.life <= 0; }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r * this.life, 0, Math.PI * 2);
        ctx.fillStyle   = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur  = 8;
        ctx.fill();
        ctx.restore();
    }
}

// ─── ShockWave ────────────────────────────────────────────────────────────────
// Expanding ring visual spawned by Pulse Repel. Lifetime: ~18 frames.

class ShockWave {
    // maxRadius and color are optional — defaults produce the standard Repel ring.
    // Nova passes NOVA_RADIUS and '#ffffff' to get a larger white-hot blast ring.
    constructor(x, y, maxRadius = REPEL_RADIUS, color = '#00ffff') {
        this.x         = x;
        this.y         = y;
        this.radius    = 0;
        this.maxRadius = maxRadius;
        this.color     = color;
        this.done      = false;
    }

    update() {
        this.radius += this.maxRadius / 18;
        if (this.radius >= this.maxRadius) this.done = true;
    }

    get alpha() { return Math.max(0, 1 - this.radius / this.maxRadius); }

    draw(ctx) {
        const a = this.alpha;
        ctx.save();

        // Outer ring
        ctx.globalAlpha = a * 0.9;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth   = Math.max(0.5, 3.5 * a);
        ctx.shadowColor = this.color;
        ctx.shadowBlur  = 24;
        ctx.stroke();

        // Inner echo ring
        ctx.globalAlpha = a * 0.4;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.65, 0, Math.PI * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth   = 1;
        ctx.shadowBlur  = 0;
        ctx.stroke();

        ctx.restore();
    }
}

// ─── AmbientPulse ─────────────────────────────────────────────────────────────
// Passive 'sonar' ring that expands from the Player position every SCOUT_INTERVAL
// frames. When the wavefront passes over a ShadowPile it temporarily boosts that
// pile's glowBoost, creating a brief 'ping' of illumination.

class AmbientPulse {
    constructor(x, y) {
        this.x      = x;
        this.y      = y;
        this.radius = 0;
        this.done   = false;
    }

    update(shadowPiles) {
        this.radius += SCOUT_MAX_RADIUS / SCOUT_FRAMES;

        // Wavefront width ≈ 24px — boost any pile the ring is passing over
        for (const pile of shadowPiles) {
            const dist = Math.hypot(this.x - pile.x, this.y - pile.y);
            const proximity = 1 - Math.abs(dist - this.radius) / 24;
            if (proximity > 0) pile.glowBoost = Math.max(pile.glowBoost, proximity);
        }

        if (this.radius >= SCOUT_MAX_RADIUS) this.done = true;
    }

    draw(ctx) {
        const t = this.radius / SCOUT_MAX_RADIUS; // 0→1
        if (t >= 1) return;

        ctx.save();
        ctx.globalAlpha = (1 - t) * 0.45;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth   = 1;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur  = 10;
        ctx.stroke();
        ctx.shadowBlur  = 0;
        ctx.restore();
    }
}

// ─── Player ───────────────────────────────────────────────────────────────────
// 'The Spark' — a cyan high-intensity core with a rotating orbital flare.

class Player {
    constructor(canvas) {
        this.x = canvas.width  / 2;
        this.y = canvas.height / 2;
        this.radius             = PLAYER_RADIUS;
        this.lightRadius        = PLAYER_LIGHT_RADIUS;
        this.currentLightRadius = PLAYER_LIGHT_RADIUS;
        this.orbitAngle   = 0;
        this.repelTimer   = 0;             // starts uncharged; auto-fires after first 5s
        this.novaTimer    = NOVA_COOLDOWN; // starts ready on first game frame
        this.trail        = [];            // ring buffer of last TRAIL_LENGTH {x,y} positions
        this.comboCount   = 0;
        this.comboTimer   = 0;
        this.streakActive = false;
        this.streakBonus  = 0;             // computed each frame from streak state
        this.flareActive     = false;      // true while Ignis Flare buff is running
        this.flareTimer      = 0;         // counts down from FLARE_DURATION to 0
        this.corruptionDrain = 0;         // accumulated light-radius penalty from boss corruption

        // ── Lumen Dash ─────────────────────────────────────────────────────────
        this.dashTimer  = DASH_COOLDOWN;  // starts ready
        this.dashActive = false;          // true during the 4-frame movement phase
        this.dashFrames = 0;              // countdown within the dash
        this.dashVx     = 0;             // per-frame velocity during dash
        this.dashVy     = 0;
        this.dashGhosts = [];             // [{x, y, life}] fading ghost copies
        // this.img is intentionally absent — resolved via Player.prototype.img after asset load
    }

    update(mouseX, mouseY, shadowPiles, game) {
        // ── Ghost copy aging — tick every frame regardless of dash state ──────
        for (let i = this.dashGhosts.length - 1; i >= 0; i--) {
            this.dashGhosts[i].life--;
            if (this.dashGhosts[i].life <= 0) this.dashGhosts.splice(i, 1);
        }

        // ── Position update: dash overrides mouse follow ──────────────────────
        if (this.dashActive) {
            // Capture pre-move position as next ghost copy
            this.dashGhosts.push({ x: this.x, y: this.y, life: DASH_GHOST_LIFE });
            this.dashFrames--;
            this.x += this.dashVx;
            this.y += this.dashVy;
            this.x = Math.max(this.radius, Math.min(game.canvas.width  - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(game.canvas.height - this.radius, this.y));
            if (this.dashFrames <= 0) this.dashActive = false;
        } else {
            // Record previous position for the persistence-of-vision trail
            this.trail.push({ x: this.x, y: this.y });
            if (this.trail.length > TRAIL_LENGTH) this.trail.shift();
            this.x = mouseX;
            this.y = mouseY;
            this.x = Math.max(this.radius, Math.min(game.canvas.width  - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(game.canvas.height - this.radius, this.y));
        }

        this.orbitAngle += 0.035;

        // ── Dash cooldown charge ──────────────────────────────────────────────
        if (this.dashTimer < DASH_COOLDOWN) {
            this.dashTimer++;
            if (this.dashTimer === DASH_COOLDOWN) {
                game.floatingTexts.push(new FloatingText(
                    this.x, this.y - 40, 'DASH  READY', '#00ffff', 11
                ));
            }
        }

        // Combo window countdown — resets count and streak when expired
        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer === 0) {
                this.comboCount   = 0;
                this.streakActive = false;
            }
        }

        // Ignis Flare buff countdown
        if (this.flareTimer > 0) {
            this.flareTimer--;
            if (this.flareTimer === 0) this.flareActive = false;
        }

        // Streak bonus: +50% light radius when combo streak is active
        // Flare bonus: Luminous Overload — doubles effective light radius
        // Corruption drain: recovered only while NOT dashing (dash grants immunity).
        // Accumulation via proximity check in Game.update() is also suppressed during dash.
        if (!this.dashActive && this.corruptionDrain > 0) {
            this.corruptionDrain = Math.max(0, this.corruptionDrain - CORRUPTION_RECOVERY);
        }
        this.streakBonus = this.streakActive ? this.lightRadius * COMBO_STREAK_BONUS : 0;
        const flareBonus = this.flareActive   ? this.lightRadius                      : 0;
        this.currentLightRadius = Math.max(
            20,
            this.lightRadius + this.streakBonus + flareBonus
            - this.corruptionDrain
            + Math.sin(game.time * PULSE_SPEED) * PULSE_AMPLITUDE
        );

        // Repel charge & auto-fire
        if (this.repelTimer < REPEL_COOLDOWN) this.repelTimer++;
        if (this.repelTimer >= REPEL_COOLDOWN) this.triggerRepel(game);

        // Nova charge (no auto-fire — manual only)
        if (this.novaTimer < NOVA_COOLDOWN) {
            this.novaTimer++;
            if (this.novaTimer === NOVA_COOLDOWN) {
                game.floatingTexts.push(new FloatingText(
                    this.x, this.y - 50, 'NOVA READY', '#ffffff', 13
                ));
            }
        }

        for (let i = shadowPiles.length - 1; i >= 0; i--) {
            const pile = shadowPiles[i];
            const dist = Math.hypot(this.x - pile.x, this.y - pile.y);

            if (dist < pile.radius + this.radius + 10) {
                pile.hoverFrames++;
                if (pile.hoverFrames >= game.cleanFrames) {
                    game.healOrbs.push(new HealOrb(pile.x, pile.y));
                    game.score += SCORE_PER_PILE;
                    shadowPiles.splice(i, 1);

                    // ── Combo logic ──────────────────────────────────────────
                    this.comboCount++;
                    this.comboTimer = COMBO_EXPIRE_FRAMES;

                    game.floatingTexts.push(new FloatingText(
                        pile.x, pile.y - 24, `+${SCORE_PER_PILE}`, '#b44fff'
                    ));

                    if (this.comboCount >= COMBO_STREAK_MIN) {
                        if (!this.streakActive) {
                            this.streakActive = true;
                            game.floatingTexts.push(new FloatingText(
                                this.x, this.y - 55, 'LUMEN STREAK!', '#ffffff', 16
                            ));
                        }
                        game.floatingTexts.push(new FloatingText(
                            pile.x, pile.y - 42, `×${this.comboCount} COMBO`, '#00ffff', 12
                        ));
                    }

                    // Combo milestone: spawn Ignis Flare at count 5 if none is present
                    if (this.comboCount === FLARE_COMBO_TRIGGER && game.ignisFlares.length === 0) {
                        game._spawnFlare();
                        game.flareSpawnTimer = 0;
                    }

                    // ── Procedural audio feedback ─────────────────────────────
                    game.audio.playSoundEffect('corpse_collect');
                    if (this.comboCount >= COMBO_STREAK_MIN) {
                        game.audio.playSoundEffect('combo_ping', { combo: this.comboCount });
                    }
                }
            } else {
                pile.hoverFrames = 0;
            }
        }
    }

    // Emit shockwave, knock back + stun all enemies within REPEL_RADIUS.
    // Initial knockback velocity of 15px/frame with 0.85 friction gives ~100px
    // total displacement over the stun window (geometric series: 15/(1-0.85) = 100).
    // Emit shockwave, knock back + stun all enemies within REPEL_RADIUS.
    // When Ignis Flare is active ('Holy Repel' mode), the shockwave turns gold
    // and any enemy within range is instantly vaporised instead of stunned.
    triggerRepel(game) {
        this.repelTimer = 0;
        game.triggerShake(REPEL_SHAKE_INT, SHAKE_DURATION);

        const repelColor = this.flareActive ? '#ffcc00' : '#00ffff';
        game.shockWaves.push(new ShockWave(this.x, this.y, REPEL_RADIUS, repelColor));

        // Radial particle burst — gold during Flare
        for (let i = 0; i < 28; i++) {
            const angle = (i / 28) * Math.PI * 2;
            const p = new Particle(this.x, this.y, repelColor);
            p.vx = Math.cos(angle) * (3 + Math.random() * 2.5);
            p.vy = Math.sin(angle) * (3 + Math.random() * 2.5);
            game.particles.push(p);
        }

        for (const enemy of game.enemies) {
            if (enemy.dying) continue;
            const dist = Math.hypot(this.x - enemy.x, this.y - enemy.y);
            if (dist < REPEL_RADIUS && dist > 0) {
                const isBoss = enemy instanceof WraithPrime;
                if (this.flareActive) {
                    // Holy Repel — boss: heavy damage; standard enemies: vaporize
                    for (let j = 0; j < 8; j++) {
                        const p = new Particle(enemy.x, enemy.y, '#ffcc00');
                        p.vx = (Math.random() - 0.5) * 5;
                        p.vy = (Math.random() - 0.5) * 5;
                        game.particles.push(p);
                    }
                    if (isBoss) {
                        enemy.hp = Math.max(0, enemy.hp - 5);
                        if (enemy.hp <= 0) enemy.dying = true;
                    } else {
                        enemy.dying = true;
                    }
                } else {
                    const angle  = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                    const factor = 1 - dist / REPEL_RADIUS;
                    enemy.knockbackVx = Math.cos(angle) * 15 * factor;
                    enemy.knockbackVy = Math.sin(angle) * 15 * factor;
                    enemy.stunFrames  = REPEL_STUN_FRAMES;
                    // Repel also chips boss HP
                    if (isBoss) {
                        enemy.hp = Math.max(0, enemy.hp - 2);
                        if (enemy.hp <= 0) enemy.dying = true;
                    }
                }
            }
        }
    }

    // Lumen Nova — instant 400px vaporise blast.  15s gated ability (F or click).
    // White-hot shockwave + heavy screen shake + white flash communicates "panic button".
    triggerNova(game) {
        if (this.novaTimer < NOVA_COOLDOWN) return;
        this.novaTimer = 0;

        game.audio.playSoundEffect('nova_blast');
        game.triggerShake(NOVA_SHAKE_INT, SHAKE_DURATION * 2);
        game.flashFrames = NOVA_FLASH_FRAMES;

        // Massive white shockwave ring
        game.shockWaves.push(new ShockWave(this.x, this.y, NOVA_RADIUS, '#ffffff'));

        // Radial white particle burst
        for (let i = 0; i < 48; i++) {
            const angle = (i / 48) * Math.PI * 2;
            const p = new Particle(this.x, this.y, '#ffffff');
            p.vx = Math.cos(angle) * (5 + Math.random() * 3);
            p.vy = Math.sin(angle) * (5 + Math.random() * 3);
            game.particles.push(p);
        }

        // Vaporise all non-dissolving enemies within NOVA_RADIUS.
        // WraithPrime resists instant kill — Nova deals 20 HP damage instead.
        for (const enemy of game.enemies) {
            if (enemy.dying) continue;
            if (Math.hypot(this.x - enemy.x, this.y - enemy.y) < NOVA_RADIUS) {
                for (let j = 0; j < 8; j++) {
                    const p = new Particle(enemy.x, enemy.y, '#ffaa00');
                    p.vx = (Math.random() - 0.5) * 5;
                    p.vy = (Math.random() - 0.5) * 5;
                    game.particles.push(p);
                }
                if (enemy instanceof WraithPrime) {
                    enemy.hp = Math.max(0, enemy.hp - 20);
                    if (enemy.hp <= 0) enemy.dying = true;
                } else {
                    enemy.dying = true;
                }
            }
        }

        // Clean all shadow piles within NOVA_RADIUS (spawn orbs + score + combo)
        for (let i = game.shadowPiles.length - 1; i >= 0; i--) {
            const pile = game.shadowPiles[i];
            if (Math.hypot(this.x - pile.x, this.y - pile.y) < NOVA_RADIUS) {
                game.healOrbs.push(new HealOrb(pile.x, pile.y));
                game.score += SCORE_PER_PILE;
                game.floatingTexts.push(new FloatingText(pile.x, pile.y - 24, `+${SCORE_PER_PILE}`, '#ffffff'));

                this.comboCount++;
                this.comboTimer = COMBO_EXPIRE_FRAMES;
                if (this.comboCount >= COMBO_STREAK_MIN && !this.streakActive) {
                    this.streakActive = true;
                }
                game.shadowPiles.splice(i, 1);
            }
        }

        game.floatingTexts.push(new FloatingText(this.x, this.y - 65, 'LUMEN NOVA!', '#ffffff', 18));
    }

    // Lumen Dash — blink 120 px toward the cursor in 4 frames.
    // Invulnerable to corruption drain during the dash.
    // Cooldown: 3s (DASH_COOLDOWN frames), visualised as a charging arc.
    triggerDash(game) {
        if (this.dashTimer < DASH_COOLDOWN) return;

        const dx  = game.mouseX - this.x;
        const dy  = game.mouseY - this.y;
        const len = Math.hypot(dx, dy);
        if (len < 1) return;   // cursor on top of player — no direction

        this.dashTimer  = 0;
        const nx        = dx / len;
        const ny        = dy / len;
        this.dashVx     = nx * (DASH_DISTANCE / DASH_FRAMES);
        this.dashVy     = ny * (DASH_DISTANCE / DASH_FRAMES);
        this.dashFrames = DASH_FRAMES;
        this.dashActive = true;

        // Seed ghost at origin before the movement begins
        this.dashGhosts.push({ x: this.x, y: this.y, life: DASH_GHOST_LIFE });

        game.audio.playSoundEffect('dash_zip');
    }

    // Draws fading cyan circles for the last TRAIL_LENGTH positions.
    // Opacity and radius both scale linearly with recency so the oldest dot is
    // almost invisible and the newest blends seamlessly into the core.
    drawTrail(ctx) {
        // Trail colour priority: Flare (gold) > Streak (white) > default (cyan).
        const col = this.flareActive ? '#ffcc00' : this.streakActive ? '#ffffff' : '#00ffff';
        const len = this.trail.length;
        for (let i = 0; i < len; i++) {
            const t     = (i + 1) / len;          // 0→1: oldest→newest
            const alpha = t * 0.38;
            const r     = this.radius * (0.25 + t * 0.65);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(this.trail[i].x, this.trail[i].y, r, 0, Math.PI * 2);
            ctx.fillStyle   = col;
            ctx.shadowColor = col;
            ctx.shadowBlur  = 6;
            ctx.fill();
            ctx.shadowBlur  = 0;
            ctx.restore();
        }
    }

    // drawSprite: the three-layer render pipeline.
    // Layer 1 (screen glow) and Layer 3 (orbital flares) are ALWAYS drawn —
    // they act as the "magical aura" overlay whether a PNG sprite is present or not.
    // Layer 2 switches between the loaded sprite and the procedural fallback body.
    drawSprite(ctx) {
        // ── Layer 1: Screen-blend outer glow — always on ─────────────────────
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const glowGrad = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius * 5
        );
        glowGrad.addColorStop(0,    'rgba(0, 200, 255, 0.55)');
        glowGrad.addColorStop(0.35, 'rgba(0, 80,  220, 0.18)');
        glowGrad.addColorStop(1,    'rgba(0, 0,   0,   0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // ── Layer 2: Sprite body OR procedural fallback ──────────────────────
        if (this.img && this.img.complete && this.img.naturalWidth > 0) {
            // PNG sprite — sized to encompass the orbital ring area
            const s = this.radius * 4.5;
            ctx.drawImage(this.img, this.x - s / 2, this.y - s / 2, s, s);
        } else {
            this._drawProcedural(ctx);
        }

        // ── Layer 3: Rotating orbital flares — always on top ─────────────────
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.orbitAngle);

        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 2.3, 0.3, Math.PI * 1.7);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth   = 1.5;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur  = 14;
        ctx.stroke();

        ctx.rotate(Math.PI);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 2.3, 0.6, Math.PI * 1.4);
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
        ctx.lineWidth   = 1;
        ctx.shadowBlur  = 0;
        ctx.stroke();

        ctx.restore();

        // ── Layer 4: Dash cooldown arc — charges clockwise from 12 o'clock ───
        const dashFrac  = Math.min(1, this.dashTimer / DASH_COOLDOWN);
        const dashReady = dashFrac >= 1;
        const arcR      = this.radius * 3.2;

        ctx.save();
        ctx.translate(this.x, this.y);

        // Dim track ring
        ctx.beginPath();
        ctx.arc(0, 0, arcR, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 60, 70, 0.35)';
        ctx.lineWidth   = 1.5;
        ctx.stroke();

        // Fill arc
        if (dashFrac > 0) {
            const start = -Math.PI / 2;
            const end   = start + Math.PI * 2 * dashFrac;
            ctx.beginPath();
            ctx.arc(0, 0, arcR, start, end);
            if (dashReady) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth   = 2;
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur  = 14;
            } else {
                ctx.strokeStyle = '#00cccc';
                ctx.lineWidth   = 1.5;
                ctx.shadowColor = '#00ffff';
                ctx.shadowBlur  = 5;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }

    draw(ctx) {
        // ── Ghost trail — semi-transparent copies fading along the dash path ──
        for (const ghost of this.dashGhosts) {
            const t = ghost.life / DASH_GHOST_LIFE;  // 1 (new) → 0 (faded)
            ctx.save();
            ctx.globalAlpha = t * 0.48;
            // Outer soft halo
            ctx.globalCompositeOperation = 'screen';
            const glowR = this.radius * 4;
            const glow  = ctx.createRadialGradient(ghost.x, ghost.y, 0, ghost.x, ghost.y, glowR);
            glow.addColorStop(0,   'rgba(0, 220, 255, 0.55)');
            glow.addColorStop(0.4, 'rgba(0, 100, 200, 0.15)');
            glow.addColorStop(1,   'rgba(0, 0, 0, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(ghost.x, ghost.y, glowR, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
            // Core disc
            ctx.beginPath();
            ctx.arc(ghost.x, ghost.y, this.radius * (0.5 + t * 0.7), 0, Math.PI * 2);
            ctx.fillStyle   = '#00ffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur  = 18 * t;
            ctx.fill();
            ctx.shadowBlur  = 0;
            ctx.restore();
        }
        this.drawSprite(ctx);
    }

    // Fallback body only — no glow, no flares (those live in drawSprite now)
    _drawProcedural(ctx) {
        // Soft warm halo
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
        const halo = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius * 2.5
        );
        halo.addColorStop(0, 'rgba(255, 247, 161, 0.3)');
        halo.addColorStop(1, 'rgba(255, 247, 161, 0)');
        ctx.fillStyle = halo;
        ctx.fill();

        // Core spark
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle   = '#fff7a1';
        ctx.shadowColor = '#ffe566';
        ctx.shadowBlur  = 24;
        ctx.fill();
        ctx.shadowBlur  = 0;
    }
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
// 'The Hooded Shadow' — dark cloak, hood peak, glowing teal eyes.

class Hero {
    constructor(x, y) {
        this.x            = x;
        this.y            = y;
        this.radius       = 14;
        this.speed        = HERO_SPEED;
        this.hp           = HERO_MAX_HP;
        this.maxHp        = HERO_MAX_HP;
        this.ghostHp      = HERO_MAX_HP;
        this.damageResist = 0;
        this.attackTimer  = 0;
        this.state        = 'idle';
        this.wanderX      = x;
        this.wanderY      = y;
        this.wanderTimer  = 0;
        // this.img resolved via Hero.prototype.img after asset load
    }

    update(enemies, centerX, centerY) {
        this.ghostHp += (this.hp - this.ghostHp) * GHOST_DRAIN_SPEED;

        let nearest     = null;
        let nearestDist = Infinity;

        for (const enemy of enemies) {
            if (enemy.dying) continue; // ignore dissolving enemies as targets
            const dist = Math.hypot(this.x - enemy.x, this.y - enemy.y);
            if (dist < nearestDist) { nearestDist = dist; nearest = enemy; }
        }

        if (!nearest) {
            this.state = 'wandering';
            this._wander(centerX, centerY);
            return;
        }

        this.state = 'chasing';

        if (nearestDist > HERO_ATTACK_RANGE) {
            const angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;
        } else {
            this.attackTimer++;
            if (this.attackTimer >= HERO_ATTACK_FRAMES) {
                this.attackTimer = 0;
                nearest.hp--;
                // Triggers death dissolve instead of instant removal
                if (nearest.hp <= 0) nearest.dying = true;
            }
        }
    }

    _wander(cx, cy) {
        this.wanderTimer++;
        if (this.wanderTimer >= 180 || Math.hypot(this.x - this.wanderX, this.y - this.wanderY) < 5) {
            this.wanderTimer = 0;
            this.wanderX = cx + (Math.random() - 0.5) * 160;
            this.wanderY = cy + (Math.random() - 0.5) * 160;
        }
        const angle = Math.atan2(this.wanderY - this.y, this.wanderX - this.x);
        if (Math.hypot(this.wanderX - this.x, this.wanderY - this.y) > 4) {
            this.x += Math.cos(angle) * this.speed * 0.3;
            this.y += Math.sin(angle) * this.speed * 0.3;
        }
    }

    heal(amount) {
        this.hp      = Math.min(this.maxHp, this.hp + amount);
        this.ghostHp = Math.min(this.maxHp, this.ghostHp + amount);
    }

    // drawSprite: sprite body OR procedural cloak, then eye-glow and health bar always on top.
    drawSprite(ctx) {
        const r = this.radius;

        if (this.img && this.img.complete && this.img.naturalWidth > 0) {
            // Wandering ring behind the sprite
            if (this.state === 'wandering') {
                ctx.beginPath();
                ctx.arc(this.x, this.y, r + 5, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(0, 200, 200, 0.18)';
                ctx.lineWidth   = 2;
                ctx.stroke();
            }
            // PNG sprite centered, sized to match the hood silhouette
            const s = r * 3.2;
            ctx.drawImage(this.img, this.x - s / 2, this.y - s / 2, s, s);
        } else {
            this._drawProcedural(ctx);
            return; // _drawProcedural already draws eyes + bar; skip duplicate call
        }

        // ── Magical overlay: glowing teal eyes — always on top of sprite ──────
        this._drawEyes(ctx);

        // ── Health bar always above the sprite ───────────────────────────────
        this._drawHealthBar(ctx);
    }

    draw(ctx) { this.drawSprite(ctx); }

    _drawEyes(ctx) {
        for (const ex of [-4.5, 4.5]) {
            ctx.beginPath();
            ctx.arc(this.x + ex, this.y - 3, 2.5, 0, Math.PI * 2);
            ctx.fillStyle   = '#00ffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur  = 16;
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }

    _drawHealthBar(ctx) {
        const r    = this.radius;
        const barW = 40;
        const barH = 6;
        const bx   = this.x - barW / 2;
        const by   = this.y - r - 20;

        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);

        const ghostRatio = Math.max(0, this.ghostHp / this.maxHp);
        ctx.fillStyle = 'rgba(220, 80, 80, 0.65)';
        ctx.fillRect(bx, by, barW * ghostRatio, barH);

        const ratio = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = ratio > 0.5 ? '#4cff91' : ratio > 0.25 ? '#f5a623' : '#e74c3c';
        ctx.fillRect(bx, by, barW * ratio, barH);

        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(bx, by, barW * ratio, 1);
    }

    _drawProcedural(ctx) {
        const r = this.radius;

        if (this.state === 'wandering') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, r + 5, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 200, 200, 0.18)';
            ctx.lineWidth   = 2;
            ctx.stroke();
        }

        // Cloak body
        ctx.beginPath();
        ctx.arc(this.x, this.y + 2, r, 0, Math.PI * 2);
        ctx.fillStyle = '#100520';
        ctx.fill();
        ctx.strokeStyle = '#2a0d50';
        ctx.lineWidth   = 2;
        ctx.stroke();

        // Hood peak
        ctx.beginPath();
        ctx.moveTo(this.x - r * 0.65, this.y - r * 0.35);
        ctx.lineTo(this.x,             this.y - r - 7);
        ctx.lineTo(this.x + r * 0.65, this.y - r * 0.35);
        ctx.closePath();
        ctx.fillStyle = '#100520';
        ctx.fill();
        ctx.strokeStyle = '#2a0d50';
        ctx.lineWidth   = 1.5;
        ctx.stroke();

        this._drawEyes(ctx);
        this._drawHealthBar(ctx);
    }
}

// ─── Enemy ────────────────────────────────────────────────────────────────────
// 'Shadow Wraith' — flickering tendrils, dark form, red pulsing core.

class Enemy {
    constructor(x, y, speed = ENEMY_BASE_SPEED) {
        this.x            = x;
        this.y            = y;
        this.radius       = 12;
        this.speed        = speed;
        this.hp           = ENEMY_MAX_HP;
        this.dead         = false;
        this.dying        = false;         // true = dissolve animation running
        this.dyingFrames  = 0;
        this.alpha        = 1;
        this.age          = 0;             // frame counter for flicker animation
        this.flickerPhase = Math.random() * Math.PI * 2; // per-enemy random phase
        this.stunFrames   = 0;             // > 0 = stunned after Repel
        this.knockbackVx  = 0;
        this.knockbackVy  = 0;
        // this.img resolved via Enemy.prototype.img after asset load
    }

    update(hero) {
        this.age++;

        // ── Death dissolve (shrink + fade over ENEMY_DISSOLVE_FRAMES) ─────────
        if (this.dying) {
            this.dyingFrames++;
            this.alpha = 1 - this.dyingFrames / ENEMY_DISSOLVE_FRAMES;
            if (this.dyingFrames >= ENEMY_DISSOLVE_FRAMES) this.dead = true;
            return;
        }

        // ── Knockback / stun ─────────────────────────────────────────────────
        if (this.stunFrames > 0) {
            this.stunFrames--;
            this.x += this.knockbackVx;
            this.y += this.knockbackVy;
            this.knockbackVx *= 0.85;  // friction deceleration
            this.knockbackVy *= 0.85;
            return;
        }

        // ── Normal movement toward Hero ───────────────────────────────────────
        const angle = Math.atan2(hero.y - this.y, hero.x - this.x);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;

        if (Math.hypot(this.x - hero.x, this.y - hero.y) < this.radius + hero.radius) {
            hero.hp -= 0.08 * (1 - hero.damageResist);
        }
    }

    // drawSprite: sprite with dissolve alpha/scale OR full procedural wraith.
    // Red core glow, HP pips, and stun ring are painted as overlays in both paths.
    drawSprite(ctx) {
        const scale = this.dying ? this.alpha : 1;

        if (this.img && this.img.complete && this.img.naturalWidth > 0) {
            // ── Sprite body with dissolve transform ───────────────────────────
            ctx.save();
            ctx.globalAlpha = this.alpha;
            ctx.translate(this.x, this.y);
            ctx.scale(scale, scale);
            const s = this.radius * 3;
            ctx.drawImage(this.img, -s / 2, -s / 2, s, s);
            ctx.restore();

            // ── Magical overlay: pulsing red core glow on top of sprite ───────
            if (!this.dying) {
                const f     = Math.sin(this.age * 0.12 + this.flickerPhase);
                const coreR = this.radius * (0.38 + Math.abs(f) * 0.1);
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.beginPath();
                ctx.arc(this.x, this.y, coreR, 0, Math.PI * 2);
                ctx.fillStyle   = 'rgba(200, 20, 0, 0.55)';
                ctx.shadowColor = '#ff3010';
                ctx.shadowBlur  = 16;
                ctx.fill();
                ctx.shadowBlur  = 0;
                ctx.restore();
            }

            // HP pips and stun ring (same helpers as procedural path)
            this._drawPips(ctx);
            this._drawStunRing(ctx);
        } else {
            this._drawProcedural(ctx);
        }
    }

    draw(ctx) { this.drawSprite(ctx); }

    _drawProcedural(ctx) {
        const f     = Math.sin(this.age * 0.12 + this.flickerPhase);
        const scale = this.dying ? this.alpha : 1; // shrink during dissolve

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.scale(scale, scale);

        // Wispy tendrils — 6 small dark lobes orbiting the body
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2 + f * 0.25;
            const r = this.radius * (0.85 + f * 0.18);
            ctx.beginPath();
            ctx.arc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, 3.5 + Math.abs(f) * 1.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(35, 0, 50, 0.7)';
            ctx.fill();
        }

        // Main dark body
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle   = '#160018';
        ctx.fill();
        ctx.strokeStyle = `rgba(70, 0, 90, 0.8)`;
        ctx.lineWidth   = 1.5;
        ctx.stroke();

        // Red pulsing core
        const coreR = this.radius * (0.38 + Math.abs(f) * 0.1);
        ctx.beginPath();
        ctx.arc(0, 0, coreR, 0, Math.PI * 2);
        ctx.fillStyle   = '#cc1a00';
        ctx.shadowColor = '#ff3010';
        ctx.shadowBlur  = 18;
        ctx.fill();
        ctx.shadowBlur  = 0;

        ctx.restore(); // alpha + scale

        this._drawPips(ctx);
        this._drawStunRing(ctx);
    }

    _drawPips(ctx) {
        if (this.dying || this.hp <= 0) return;
        for (let i = 0; i < this.hp; i++) {
            ctx.beginPath();
            ctx.arc(
                this.x - (this.hp - 1) * 5 + i * 10,
                this.y - this.radius - 9,
                3, 0, Math.PI * 2
            );
            ctx.fillStyle = '#ff6b6b';
            ctx.fill();
        }
    }

    _drawStunRing(ctx) {
        if (this.stunFrames <= 0) return;
        const stunAlpha = Math.min(1, this.stunFrames / 20);
        ctx.save();
        ctx.globalAlpha = stunAlpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth   = 2;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur  = 10;
        ctx.stroke();
        ctx.shadowBlur  = 0;
        ctx.restore();
    }
}

// ─── ShadowPile ───────────────────────────────────────────────────────────────

class ShadowPile {
    constructor(x, y) {
        this.x           = x;
        this.y           = y;
        this.radius      = 18;
        this.hoverFrames = 0;
        this.glowBoost   = 0;   // 0→1, temporarily raised when an AmbientPulse passes over
    }

    // time is game.time — drives the slow idle sine oscillation
    draw(ctx, cleanFrames, time) {
        const progress = this.hoverFrames / cleanFrames;

        // Decay glowBoost toward zero each frame
        if (this.glowBoost > 0) this.glowBoost = Math.max(0, this.glowBoost - 0.03);

        // ── Permanent ambient glow halo behind the pile ───────────────────────
        // Slow sine oscillation (period ≈ 7s) + brief boost from scout ping
        const idlePulse   = 0.12 + Math.abs(Math.sin(time * 0.027 + this.x * 0.008)) * 0.08;
        const totalAlpha  = idlePulse + this.glowBoost * 0.40;
        const totalBlur   = 8 + this.glowBoost * 18;

        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 7, 0, Math.PI * 2);
        ctx.fillStyle   = `rgba(0, 255, 200, ${totalAlpha})`;
        ctx.shadowColor = 'rgba(0, 255, 200, 0.7)';
        ctx.shadowBlur  = totalBlur;
        ctx.fill();
        ctx.shadowBlur  = 0;
        ctx.restore();

        // ── Dark body ─────────────────────────────────────────────────────────
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(20, 5, 30, 0.88)';
        ctx.fill();
        ctx.strokeStyle = `rgba(160, 60, 220, ${0.25 + progress * 0.75})`;
        ctx.lineWidth   = 1.5;
        ctx.stroke();

        // ── Purification progress arc ─────────────────────────────────────────
        if (progress > 0) {
            ctx.beginPath();
            ctx.arc(
                this.x, this.y,
                this.radius + 5,
                -Math.PI / 2,
                -Math.PI / 2 + Math.PI * 2 * progress
            );
            ctx.strokeStyle = '#b44fff';
            ctx.lineWidth   = 3;
            ctx.stroke();
        }
    }
}

// ─── HealOrb ──────────────────────────────────────────────────────────────────

class HealOrb {
    constructor(x, y) {
        this.x         = x;
        this.y         = y;
        this.radius    = 7;
        this.collected = false;
    }

    update(hero, game) {
        const prevX = this.x;
        const prevY = this.y;

        this.x += (hero.x - this.x) * HEAL_ORB_LERP;
        this.y += (hero.y - this.y) * HEAL_ORB_LERP;

        const speed = Math.hypot(this.x - prevX, this.y - prevY);
        if (speed > 0.4) {
            const count = speed > 2 ? 2 : 1;
            for (let i = 0; i < count; i++) {
                game.particles.push(new Particle(this.x, this.y, '#4cff91'));
            }
        }

        if (Math.hypot(this.x - hero.x, this.y - hero.y) < hero.radius + this.radius) {
            hero.heal(game.healValue);
            this.collected = true;
        }
    }

    draw(ctx) {
        // ── Screen-blend glow (additive light against darkness) ──────────────
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const glowGrad = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius * 3.5
        );
        glowGrad.addColorStop(0,   'rgba(60, 255, 140, 0.5)');
        glowGrad.addColorStop(0.5, 'rgba(0,  200, 80,  0.15)');
        glowGrad.addColorStop(1,   'rgba(0,  0,   0,   0)');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Orb body
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle   = '#4cff91';
        ctx.shadowColor = '#4cff91';
        ctx.shadowBlur  = 20;
        ctx.fill();

        // White core highlight
        ctx.beginPath();
        ctx.arc(this.x - 1.5, this.y - 1.5, this.radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();

        ctx.shadowBlur = 0;
    }
}

// ─── IgnisFlare ───────────────────────────────────────────────────────────────
// World-space pickup that grants the Ignis Flare buff for FLARE_DURATION frames.
// Visual: a slowly rotating 5-point white-gold star with flickering alpha and a
// shadowBlur of 20px, matching the "burning light" theme of the power-up.

class IgnisFlare {
    constructor(x, y) {
        this.x         = x;
        this.y         = y;
        this.radius    = 12;
        this.age       = 0;
        this.collected = false;
    }

    update(player, game) {
        this.age++;
        if (Math.hypot(this.x - player.x, this.y - player.y) < this.radius + player.radius + 6) {
            player.flareActive = true;
            player.flareTimer  = FLARE_DURATION;
            this.collected     = true;
            game.floatingTexts.push(new FloatingText(
                player.x, player.y - 58, 'IGNIS FLARE!', '#ffcc00', 18
            ));
            game.audio.playSoundEffect('flare_pickup');
        }
    }

    draw(ctx) {
        const flicker = Math.sin(this.age * 0.22);               // −1 → 1 flicker wave
        const r       = this.radius * (0.88 + Math.abs(flicker) * 0.22);
        const alpha   = 0.78 + Math.abs(flicker) * 0.22;
        const rot     = this.age * 0.022;                         // slow rotation

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(rot);

        // Outer soft halo — screen-blend warm glow
        ctx.globalCompositeOperation = 'screen';
        const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 2.8);
        halo.addColorStop(0,   'rgba(255, 220, 60, 0.45)');
        halo.addColorStop(0.5, 'rgba(255, 160, 20, 0.12)');
        halo.addColorStop(1,   'rgba(0,   0,   0,  0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        // 5-point star body
        ctx.shadowColor = '#fff8a0';
        ctx.shadowBlur  = 20;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        this._starPath(ctx, 5, r, r * 0.42);
        ctx.fillStyle = '#ffe566';
        ctx.fill();

        // White-hot inner core
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 230, 0.95)';
        ctx.fill();

        ctx.shadowBlur  = 0;
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // Builds a star path centred at (0, 0) with alternating outer / inner radii.
    _starPath(ctx, points, outerR, innerR) {
        const step = Math.PI / points;
        ctx.moveTo(0, -outerR);
        for (let i = 1; i < points * 2; i++) {
            const r     = i % 2 === 0 ? outerR : innerR;
            const angle = i * step - Math.PI / 2;
            ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath();
    }
}

// ─── CorruptionParticle ───────────────────────────────────────────────────────
// Static void pool left by WraithPrime's Void Trail ability. Persists for
// CORRUPTION_LIFETIME frames and doubles the Player's light-radius decay rate
// while they remain within CORRUPTION_DRAIN_ZONE pixels.

class CorruptionParticle {
    constructor(x, y) {
        this.x    = x;
        this.y    = y;
        this.age  = 0;
        this.life = 1.0;                          // 1 → 0 linear over lifetime
        this.decay = 1 / CORRUPTION_LIFETIME;
        this.pulseOffset = Math.random() * Math.PI * 2;
    }

    update() {
        this.age++;
        this.life -= this.decay;
    }

    get dead() { return this.life <= 0; }

    draw(ctx) {
        const pulse = 0.55 + 0.45 * Math.abs(Math.sin(this.age * 0.07 + this.pulseOffset));
        const r     = 5 + pulse * 3;
        const a     = this.life * pulse * 0.85;

        ctx.save();
        ctx.globalAlpha = a;

        // Outer void halo
        const halo = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, r * 3);
        halo.addColorStop(0,   'rgba(90,  0, 180, 0.55)');
        halo.addColorStop(0.5, 'rgba(40,  0,  80, 0.20)');
        halo.addColorStop(1,   'rgba(0,   0,   0, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core pool
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fillStyle   = '#5500aa';
        ctx.shadowColor = '#cc44ff';
        ctx.shadowBlur  = 12;
        ctx.fill();
        ctx.shadowBlur  = 0;

        ctx.restore();
    }
}

// ─── WraithPrime ──────────────────────────────────────────────────────────────
// Elite boss entity appearing at the end of Waves 5 and 10.
// 3× hitbox, Void Trail corruption, and a periodic Gravity Well that pulls
// both the Player cursor and the Hero toward the boss centre.
//
// Entry 016 — Boss Design and Pacing
// WraithPrime embodies Swink's (2009:126) principle of 'Scale and Weight':
// a physically massive presence communicates threat hierarchy through visual
// mass before any mechanical engagement begins. Its slow advance speed (0.5
// vs 0.9 for standard Wraithes) reinforces gravitational authority — the
// lumbering, unstoppable quality that distinguishes an elite encounter from
// a faster but weaker attacker. The Gravity Well ability collapses the
// player's spatial freedom every 4 seconds, demanding active repositioning
// and preventing passive kiting strategies (Swink, 2009:132). Void Trail
// corruption pools shrink the effective light radius, creating layered
// spatial pressure: the player must avoid both the boss and its persistent
// environmental residue, raising cognitive load without increasing raw damage.
// Pacing is controlled by gating the wave-complete transition behind
// WraithPrime.isDead, ensuring the encounter cannot be bypassed by timer.
//
// References:
//   Swink, S. (2009) Game Feel. Morgan Kaufmann, Burlington, MA.

class WraithPrime extends Enemy {
    constructor(x, y, game) {
        super(x, y, WRAITH_SPEED);
        this.game         = game;
        this.radius       = 12 * WRAITH_RADIUS_MULT;   // 36px
        this.hp           = WRAITH_HP;
        this.maxHp        = WRAITH_HP;
        this.isDead       = false;
        this.trailTimer   = 0;
        this.gravityTimer = 0;
        this.spawnAge     = 0;
        this.orbitAngle   = 0;
    }

    // Overrides Enemy.update fully to control the longer dissolve and inject
    // boss-specific abilities (game ref needed for corruption / shockwave spawn).
    update(hero) {
        this.age++;
        this.spawnAge++;

        if (this.dying) {
            this.dyingFrames++;
            this.alpha = Math.max(0, 1 - this.dyingFrames / WRAITH_DISSOLVE_FRAMES);
            if (this.dyingFrames >= WRAITH_DISSOLVE_FRAMES) {
                this.dead   = true;
                this.isDead = true;
            }
            return;
        }

        // Knockback / stun (inherited mechanic, reduced effectiveness at 3× mass)
        if (this.stunFrames > 0) {
            this.stunFrames--;
            this.x += this.knockbackVx * 0.4;   // boss resists knock
            this.y += this.knockbackVy * 0.4;
            this.knockbackVx *= 0.85;
            this.knockbackVy *= 0.85;
        } else {
            // Advance toward Hero
            const angle = Math.atan2(hero.y - this.y, hero.x - this.x);
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;
        }

        this.orbitAngle += 0.018;

        // Hero contact damage — 2× normal (scale + weight = force)
        if (Math.hypot(this.x - hero.x, this.y - hero.y) < this.radius + hero.radius) {
            hero.hp -= 0.16 * (1 - hero.damageResist);
        }

        // ── Void Trail ───────────────────────────────────────────────────────
        this.trailTimer++;
        if (this.trailTimer >= WRAITH_TRAIL_INTERVAL) {
            this.trailTimer = 0;
            this.game.corruptionParticles.push(new CorruptionParticle(this.x, this.y));
        }

        // ── Gravity Well ─────────────────────────────────────────────────────
        this.gravityTimer++;
        if (this.gravityTimer >= WRAITH_GRAVITY_INTERVAL) {
            this.gravityTimer = 0;
            this._triggerGravityWell();
        }
    }

    _triggerGravityWell() {
        const g    = this.game;
        const pull = WRAITH_GRAVITY_PULL;

        // Lerp Player cursor toward boss
        g.player.x += (this.x - g.player.x) * pull;
        g.player.y += (this.y - g.player.y) * pull;

        // Lerp Hero toward boss
        g.hero.x   += (this.x - g.hero.x) * pull;
        g.hero.y   += (this.y - g.hero.y) * pull;

        // Tactile feedback
        g.triggerShake(4, 14);
        g.shockWaves.push(new ShockWave(this.x, this.y, this.radius * 3.5, '#8800cc'));
        g.floatingTexts.push(new FloatingText(
            this.x, this.y - this.radius - 18, 'GRAVITY WELL', '#cc44ff', 13
        ));
    }

    draw(ctx) {
        const f     = Math.sin(this.age * 0.08 + this.flickerPhase);
        const scale = this.dying ? this.alpha : 1;
        const r     = this.radius;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.scale(scale, scale);

        // ── Outer void aura (screen-blend) ───────────────────────────────────
        ctx.globalCompositeOperation = 'screen';
        const aura = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 2.8);
        aura.addColorStop(0,    'rgba(100,  0, 220, 0.4)');
        aura.addColorStop(0.5,  'rgba(50,   0, 110, 0.15)');
        aura.addColorStop(1,    'rgba(0,    0,   0, 0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(0, 0, r * 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        // ── Wispy tendrils (12) ───────────────────────────────────────────────
        for (let i = 0; i < 12; i++) {
            const a   = (i / 12) * Math.PI * 2 + f * 0.18;
            const tr  = r * (0.78 + f * 0.14);
            ctx.beginPath();
            ctx.arc(
                Math.cos(a) * tr * 0.60,
                Math.sin(a) * tr * 0.60,
                7 + Math.abs(f) * 3.5,
                0, Math.PI * 2
            );
            ctx.fillStyle = 'rgba(55, 0, 100, 0.78)';
            ctx.fill();
        }

        // ── Main void body ────────────────────────────────────────────────────
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fillStyle   = '#0a0016';
        ctx.fill();
        ctx.strokeStyle = `rgba(160, 0, 240, 0.90)`;
        ctx.lineWidth   = 3.5;
        ctx.shadowColor = '#8800cc';
        ctx.shadowBlur  = 20;
        ctx.stroke();
        ctx.shadowBlur  = 0;

        // ── Pulsing void core ─────────────────────────────────────────────────
        const coreR = r * (0.35 + Math.abs(f) * 0.12);
        ctx.beginPath();
        ctx.arc(0, 0, coreR, 0, Math.PI * 2);
        ctx.fillStyle   = '#7700dd';
        ctx.shadowColor = '#dd66ff';
        ctx.shadowBlur  = 28;
        ctx.fill();
        ctx.shadowBlur  = 0;

        // ── Rotating orbital ring ─────────────────────────────────────────────
        ctx.rotate(this.orbitAngle);
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.25, 0.5, Math.PI * 1.5);
        ctx.strokeStyle = `rgba(180, 60, 255, ${0.55 + Math.abs(f) * 0.3})`;
        ctx.lineWidth   = 3;
        ctx.shadowColor = '#cc44ff';
        ctx.shadowBlur  = 18;
        ctx.stroke();

        // Counter-ring
        ctx.rotate(Math.PI);
        ctx.beginPath();
        ctx.arc(0, 0, r * 1.42, 0.8, Math.PI * 1.2);
        ctx.strokeStyle = `rgba(110, 0, 200, 0.35)`;
        ctx.lineWidth   = 1.5;
        ctx.shadowBlur  = 0;
        ctx.stroke();

        ctx.restore();

        // Stun ring drawn outside transform so it is screen-aligned
        this._drawStunRing(ctx);
    }

    // Boss is large enough that HP pips are meaningless — suppressed.
    _drawPips() {}
}

// ─── AudioManager ─────────────────────────────────────────────────────────────
// Manages two looping BGM tracks (normal ambience + boss encounter) and a Web
// Audio API procedural SFX engine.  A master duck factor (1.0 / 0.3) lets the
// pause system attenuate both tracks simultaneously without disturbing their
// individual target volumes, enabling correct restore after unpausing mid-boss.
//
// play() must be called from a user-gesture handler (Web Audio Autoplay Policy,
// Chrome 66+, Firefox 66+, Safari 11+).  AudioContext is created lazily inside
// play() so the first touch always occurs within that gesture scope.

class AudioManager {
    constructor(bgmSrc, bossBgmSrc) {
        this.bgm          = new Audio(bgmSrc);
        this.bgm.loop     = true;
        this.bossBgm      = new Audio(bossBgmSrc);
        this.bossBgm.loop = true;

        this.muted      = false;
        this._bgmVol    = 0.5;   // target vol for normal BGM (unducked)
        this._bossVol   = 0;     // target vol for boss BGM (starts silent)
        this._duck      = 1.0;   // master duck multiplier (0.3 when paused)

        this._bgmFade   = null;  // setInterval handle for BGM fade
        this._bossFade  = null;  // setInterval handle for boss BGM fade
        this._ctx       = null;  // Web Audio context — created lazily
    }

    // ── BGM control ──────────────────────────────────────────────────────────

    // Start both tracks. bossBgm opens at volume 0 (ready for startBossMusic).
    play() {
        this._getCtx();
        this.bgm.play().catch(() => {});
        this.bossBgm.volume = 0;
        this.bossBgm.play().catch(() => {});
    }

    // Instantly set the normal BGM volume.
    setVolume(v) {
        this._cancelFade('bgm');
        this._bgmVol = v;
        this._apply();
    }

    // Smooth fade for the normal BGM track (used by pause duck, game-over, etc.).
    fadeTo(targetVol, durationMs) {
        this._startFade('bgm', targetVol, durationMs);
    }

    // Crossfade: BGM → 0, boss track → 0.6 over 2 seconds.
    // Called when WraithPrime spawns (Ekman, 2008: audio layer as narrative signal).
    startBossMusic() {
        this._startFade('bgm',  0,   2000);
        this._startFade('boss', 0.6, 2000);
    }

    // Reverse crossfade: boss track → 0, BGM → 0.5 over 2 seconds.
    endBossMusic() {
        this._startFade('boss', 0,   2000);
        this._startFade('bgm',  0.5, 2000);
    }

    // Instant cut to normal BGM state — used on restart to skip any running fade.
    resetBossMusic() {
        this._cancelFade('boss');
        this._bossVol = 0;
        this._bgmVol  = 0.5;
        this._apply();
    }

    // Fade all tracks to the same target — used for game-over silence.
    fadeAllTo(targetVol, durationMs) {
        this._startFade('bgm',  targetVol, durationMs);
        this._startFade('boss', targetVol, durationMs);
    }

    // Apply a master duck factor to all tracks simultaneously (pause / unpause).
    // duck(0.3) replicates the previous fadeTo(0.15) behaviour for bgm at 0.5:
    // 0.5 × 0.3 = 0.15.  Also correctly attenuates boss music mid-encounter.
    duck(factor = 0.3) {
        this._duck = factor;
        this._apply();
    }

    unduck() {
        this._duck = 1.0;
        this._apply();
    }

    // Toggle mute.  Duck factor and target volumes are preserved so unmuting
    // restores the correct state regardless of the current music mode.
    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) {
            this.bgm.volume     = 0;
            this.bossBgm.volume = 0;
        } else {
            this._apply();
        }
        return this.muted;
    }

    // Stop all audio and reset to default state (exit to menu).
    stop() {
        this._cancelFade('bgm');
        this._cancelFade('boss');
        this.bgm.pause();
        this.bgm.currentTime     = 0;
        this.bossBgm.pause();
        this.bossBgm.currentTime = 0;
        this._bgmVol  = 0.5;
        this._bossVol = 0;
        this._duck    = 1.0;
        this._apply();
    }

    // Write computed volumes to the HTMLAudioElements.
    _apply() {
        if (this.muted) return;
        this.bgm.volume     = Math.max(0, Math.min(1, this._bgmVol  * this._duck));
        this.bossBgm.volume = Math.max(0, Math.min(1, this._bossVol * this._duck));
    }

    // Generic setInterval-based fade for either track.
    _startFade(track, target, durationMs) {
        this._cancelFade(track);
        const steps = 60;
        const ms    = Math.max(16, durationMs / steps);
        const start = track === 'bgm' ? this._bgmVol : this._bossVol;
        const delta = (target - start) / steps;
        let   step  = 0;
        const id = setInterval(() => {
            step++;
            const v = Math.max(0, Math.min(1, start + delta * step));
            if (track === 'bgm') this._bgmVol  = v;
            else                 this._bossVol = v;
            this._apply();
            if (step >= steps) this._cancelFade(track);
        }, ms);
        if (track === 'bgm') this._bgmFade  = id;
        else                 this._bossFade = id;
    }

    _cancelFade(track) {
        if (track === 'bgm'  && this._bgmFade)  { clearInterval(this._bgmFade);  this._bgmFade  = null; }
        if (track === 'boss' && this._bossFade) { clearInterval(this._bossFade); this._bossFade = null; }
    }

    // ── Procedural Sound Effects (Web Audio API) ────────────────────────────
    // AudioContext created lazily inside play() (gesture scope) and reused.
    // All SFX exit immediately when muted.

    _getCtx() {
        if (!this._ctx) {
            this._ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this._ctx.state === 'suspended') this._ctx.resume();
        return this._ctx;
    }

    playSoundEffect(type, data = {}) {
        if (this.muted) return;
        const ctx = this._getCtx();
        switch (type) {
            case 'flare_pickup':   this._sfxFlare(ctx);                      break;
            case 'corpse_collect': this._sfxCorpse(ctx);                     break;
            case 'nova_blast':     this._sfxNova(ctx);                       break;
            case 'combo_ping':     this._sfxComboPing(ctx, data.combo ?? 1); break;
            case 'dash_zip':       this._sfxDash(ctx);                       break;
        }
    }

    // High-pitched rising sine shimmer with reverb tail — rare luminous pickup.
    _sfxFlare(ctx) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        const lpf = ctx.createBiquadFilter();
        const dly = ctx.createDelay(0.5);
        const fb  = ctx.createGain();
        const out = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1760, now + 0.2);

        env.gain.setValueAtTime(0.4, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        lpf.type            = 'lowpass';
        lpf.frequency.value = 4000;
        lpf.Q.value         = 1.5;

        dly.delayTime.value = 0.08;
        fb.gain.value       = 0.38;

        out.gain.value = 0.42;

        osc.connect(env);
        env.connect(lpf);
        lpf.connect(out);
        lpf.connect(dly);
        dly.connect(fb);
        fb.connect(dly);
        dly.connect(out);
        out.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.35);
    }

    // Low-frequency triangle thump — shadow dissolving into the ground.
    _sfxCorpse(ctx) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        const lpf = ctx.createBiquadFilter();
        const out = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);

        env.gain.setValueAtTime(0.7, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        lpf.type            = 'lowpass';
        lpf.frequency.value = 500;
        lpf.Q.value         = 0.8;

        out.gain.value = 0.42;

        osc.connect(env);
        env.connect(lpf);
        lpf.connect(out);
        out.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }

    // White-noise burst with sweeping LPF — explosion cutting to vacuum.
    _sfxNova(ctx) {
        const now    = ctx.currentTime;
        const dur    = 0.8;
        const bufLen = Math.ceil(ctx.sampleRate * dur);
        const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const pcm    = buf.getChannelData(0);
        for (let i = 0; i < bufLen; i++) pcm[i] = Math.random() * 2 - 1;

        const src = ctx.createBufferSource();
        src.buffer = buf;

        const env = ctx.createGain();
        const lpf = ctx.createBiquadFilter();
        const out = ctx.createGain();

        env.gain.setValueAtTime(0.9, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + dur);

        lpf.type = 'lowpass';
        lpf.frequency.setValueAtTime(8000, now);
        lpf.frequency.exponentialRampToValueAtTime(200, now + dur);

        out.gain.value = 0.42;

        src.connect(env);
        env.connect(lpf);
        lpf.connect(out);
        out.connect(ctx.destination);

        src.start(now);
    }

    // Glassy square-wave ping with rising pitch per combo hit.
    _sfxComboPing(ctx, combo) {
        const now  = ctx.currentTime;
        const freq = Math.min(2200, 880 + (combo - 1) * 110);

        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        const lpf = ctx.createBiquadFilter();
        const out = ctx.createGain();

        osc.type            = 'square';
        osc.frequency.value = freq;

        env.gain.setValueAtTime(0.28, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        lpf.type            = 'lowpass';
        lpf.frequency.value = 3000;
        lpf.Q.value         = 3.0;

        out.gain.value = 0.42;

        osc.connect(env);
        env.connect(lpf);
        lpf.connect(out);
        out.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    // Short high-pitched 'zip' chirp for Lumen Dash.
    // Sine sweep: 1400 Hz → 2800 Hz → 900 Hz over 120ms.
    // High-pass at 800 Hz strips the low-mid body, leaving a bright,
    // airy 'whoosh' that reads as fast displacement without masking gameplay SFX.
    _sfxDash(ctx) {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        const hpf = ctx.createBiquadFilter();
        const out = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(2800, now + 0.05);
        osc.frequency.exponentialRampToValueAtTime(900,  now + 0.12);

        env.gain.setValueAtTime(0.5, now);
        env.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        hpf.type            = 'highpass';
        hpf.frequency.value = 800;
        hpf.Q.value         = 2.0;

        out.gain.value = 0.38;

        osc.connect(env);
        env.connect(hpf);
        hpf.connect(out);
        out.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
    }
}

// ─── Store ────────────────────────────────────────────────────────────────────

class Store {
    constructor(game) {
        this.game    = game;
        this.overlay = document.createElement('div');
        this.overlay.id = 'store-overlay';
        document.body.appendChild(this.overlay);
    }

    open(wave) {
        const pool   = [...UPGRADE_DEFS];
        const chosen = [];
        for (let i = 0; i < 3; i++) {
            const idx = Math.floor(Math.random() * pool.length);
            chosen.push(pool.splice(idx, 1)[0]);
        }

        this.overlay.innerHTML = `
            <div class="store-panel">
                <div class="store-header">
                    <h2>WAVE&nbsp;${wave}&nbsp;COMPLETE</h2>
                    <p>Select an upgrade</p>
                </div>
                <div class="store-cards">
                    ${chosen.map(u => `
                        <div class="store-card" data-id="${u.id}" style="--card-color:${u.color}">
                            <span class="card-icon">${u.icon}</span>
                            <div class="card-name">${u.name}</div>
                            <div class="card-stat">${u.stat}</div>
                            <div class="card-lore">${u.lore}</div>
                            <div class="card-level">LEVEL&nbsp;${this.game.upgrades[u.id] + 1}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        this.overlay.querySelectorAll('.store-card').forEach(card => {
            card.addEventListener('click', () => this._select(card.dataset.id));
        });

        this.overlay.style.display = 'flex';
    }

    hide() { this.overlay.style.display = 'none'; }

    _select(id) {
        this._applyUpgrade(id);
        this.hide();
        this.game._resumeFromStore();
    }

    _applyUpgrade(id) {
        this.game.upgrades[id]++;

        switch (id) {
            case 'lumen':   this.game.player.lightRadius *= 1.2;                                               break;
            case 'purge':   this.game.cleanFrames = Math.max(20, Math.round(this.game.cleanFrames - 18));     break;
            case 'armor':   this.game.hero.damageResist = Math.min(0.75, this.game.hero.damageResist + 0.15); break;
            case 'healing': this.game.healValue = Math.round(this.game.healValue * 1.2);                      break;
        }
    }
}

// ─── Game ─────────────────────────────────────────────────────────────────────

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx    = this.canvas.getContext('2d');

        this.lightCanvas = document.createElement('canvas');
        this.lightCtx    = this.lightCanvas.getContext('2d');

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.mouseX = this.canvas.width  / 2;
        this.mouseY = this.canvas.height / 2;
        this.canvas.addEventListener('mousemove', e => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });

        window.addEventListener('keydown', e => {
            if ((e.key === 'r' || e.key === 'R') && this.gameState === 'gameover') {
                this.restart();
            }
            if (e.key === 'm' || e.key === 'M') {
                if (this.gameState === 'gameover') {
                    this._exitToMenu();
                } else {
                    this._toggleMute();
                }
            }
            if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P') &&
                (this.gameState === 'playing' || this.gameState === 'paused')) {
                this._togglePause();
            }
            if (e.key === ' ') {
                e.preventDefault();
                if (this.gameState === 'menu') {
                    this._startGame();
                } else if (this.gameState === 'playing' && this.player.repelTimer >= REPEL_COOLDOWN) {
                    this.player.triggerRepel(this);
                }
            }
            if ((e.key === 'f' || e.key === 'F') && this.gameState === 'playing') {
                this.player.triggerNova(this);
            }
            // Shift triggers Lumen Dash
            if (e.key === 'Shift' && this.gameState === 'playing') {
                e.preventDefault();
                this.player.triggerDash(this);
            }
        });

        // Left-click triggers Nova; right-click triggers Lumen Dash.
        this.canvas.addEventListener('click', () => {
            if (this.gameState === 'playing') this.player.triggerNova(this);
        });
        this.canvas.addEventListener('contextmenu', e => {
            e.preventDefault();
            if (this.gameState === 'playing') this.player.triggerDash(this);
        });

        this._loadAssets();
        this._initEntities();
        this.store     = new Store(this);
        this._createPauseOverlay();
        this.audio     = new AudioManager('./assets/audio/bg_music.mp3', './assets/audio/boss_music.mp3');
        this.time      = 0;
        this.gameState = 'menu';    // Start on the main menu before Wave 1

        this.loop();
    }

    // Pre-load all sprite assets. Each image is assigned to the class prototype
    // so every current and future instance automatically gains access via the
    // prototype chain without per-instance memory duplication (Flanagan, 2020:214).
    // The game runs immediately with procedural fallbacks while images decode.
    _loadAssets() {
        const load = src => {
            const img = new Image();
            img.src   = src;
            return img;
        };

        const playerImg = load('assets/player.png');
        const heroImg   = load('assets/hero.png');
        const enemyImg  = load('assets/enemy.png');

        playerImg.onload = () => { Player.prototype.img = playerImg; };
        heroImg.onload   = () => { Hero.prototype.img   = heroImg;   };
        enemyImg.onload  = () => { Enemy.prototype.img  = enemyImg;  };

        playerImg.onerror = () => console.warn('assets/player.png not found — using procedural fallback.');
        heroImg.onerror   = () => console.warn('assets/hero.png not found — using procedural fallback.');
        enemyImg.onerror  = () => console.warn('assets/enemy.png not found — using procedural fallback.');

        // Store references for potential reload or debug inspection
        this.assets = { player: playerImg, hero: heroImg, enemy: enemyImg };
    }

    // Clamp to the largest requested shake so overlapping events don't cancel each other.
    triggerShake(intensity, duration) {
        if (intensity >= this.shakeIntensity) this.shakeIntensity = intensity;
        if (duration  >  this.shakeFrames)    this.shakeFrames    = duration;
    }

    _initEntities() {
        const cx = this.canvas.width  / 2;
        const cy = this.canvas.height / 2;

        this.player        = new Player(this.canvas);
        this.hero          = new Hero(cx, cy);
        this.enemies       = [];
        this.shadowPiles   = [];
        this.healOrbs      = [];
        this.particles     = [];
        this.shockWaves    = [];
        this.ambientPulses = [];
        this.floatingTexts = [];

        this.score              = 0;
        this.wave               = 1;
        this.waveTimer          = 0;
        this.spawnTimer         = 0;
        this.scoutTimer         = 0;
        this.currentSpawnFrames = ENEMY_SPAWN_FRAMES;
        this.currentEnemySpeed  = ENEMY_BASE_SPEED;
        this.cleanFrames        = SHADOW_CLEAN_FRAMES;
        this.healValue          = HEAL_ORB_VALUE;
        this.upgrades           = { lumen: 0, purge: 0, armor: 0, healing: 0 };

        this.shakeFrames    = 0;
        this.shakeIntensity = 0;
        this.flashFrames    = 0;         // white flash counter for Nova
        this.damageShakeCooldown = 0;    // prevents per-frame spam when hero is swarmed
        this.burstCooldown  = 0;         // 3s guard between double-spawn pulses

        this.ignisFlares     = [];       // active IgnisFlare pickups in the world
        this.flareSpawnTimer = 0;        // counts toward FLARE_SPAWN_FRAMES (45s interval)

        this.corruptionParticles = [];   // Void Trail pools from WraithPrime
        this.currentBoss         = null; // active WraithPrime reference, or null
        this.bossUIAlpha         = 0;    // drives boss health bar fade-in / fade-out

        this.gameOverTimer   = 0;        // frames elapsed in 'gameover' state (drives desaturation fade)
    }

    restart() {
        this._initEntities();
        this.store.hide();
        // Reset any running boss music crossfade before restoring the BGM.
        this.audio.resetBossMusic();
        this.audio.play();
        this.audio.fadeTo(0.5, 800);
        this.gameState = 'playing';
    }

    // Builds the DOM pause overlay with Resume and Exit to Menu buttons.
    // backdrop-filter: blur(8px) requires a real composited DOM layer — same
    // rationale as the Store overlay (see Entry 005).  mouseX/mouseY are always
    // captured by the passive mousemove listener regardless of game state, so
    // button hover is handled natively by CSS without any canvas hit-testing.
    _createPauseOverlay() {
        this.pauseOverlay = document.createElement('div');
        this.pauseOverlay.id = 'pause-overlay';
        this.pauseOverlay.innerHTML = `
            <div class="pause-panel">
                <h2 class="pause-header">PAUSED</h2>
                <button class="pause-btn" id="btn-pause-resume">RESUME</button>
                <button class="pause-btn" id="btn-pause-menu">EXIT TO MENU</button>
            </div>
        `;
        document.body.appendChild(this.pauseOverlay);
        document.getElementById('btn-pause-resume').addEventListener('click', () => this._togglePause());
        document.getElementById('btn-pause-menu').addEventListener('click',  () => this._exitToMenu());
    }

    // Toggles between 'playing' and 'paused'.  The DOM overlay provides
    // backdrop-filter blur; update() bypasses all game logic while paused.
    _togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.pauseOverlay.style.display = 'flex';
            // Duck all active music to 30% — affects both bgm and bossBgm
            // so pause feels equally quiet mid-boss-encounter (Collins, 2008).
            this.audio.duck();
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.pauseOverlay.style.display = 'none';
            this.audio.unduck();
        }
    }

    // Resets the simulation and returns to the main menu.
    // Called from the Pause overlay's 'Exit to Menu' button and from the
    // Game Over screen's M key binding.
    _exitToMenu() {
        this._initEntities();
        this.store.hide();
        this.pauseOverlay.style.display = 'none';
        this.audio.stop();
        this.gameState = 'menu';
    }

    // Delegates to AudioManager; the HUD icon re-reads audio.muted each frame.
    _toggleMute() {
        this.audio.toggleMute();
    }

    resize() {
        this.canvas.width       = window.innerWidth;
        this.canvas.height      = window.innerHeight;
        this.lightCanvas.width  = window.innerWidth;
        this.lightCanvas.height = window.innerHeight;
    }

    spawnEnemy() {
        if (this.enemies.length >= ENEMY_MAX_COUNT) return;

        // Burst pulse: spawn 2 when sparse, but guard with a 3s cooldown so a
        // Nova clear doesn't immediately flood the screen with a double-surge.
        const isSparse = this.enemies.length < Math.floor(ENEMY_MAX_COUNT / 2);
        const count    = (isSparse && this.burstCooldown <= 0) ? 2 : 1;
        if (count === 2) this.burstCooldown = BURST_COOLDOWN_FRAMES;

        for (let s = 0; s < count && this.enemies.length < ENEMY_MAX_COUNT; s++) {
            const w    = this.canvas.width;
            const h    = this.canvas.height;
            const edge = Math.floor(Math.random() * 4);
            let x, y;

            if      (edge === 0) { x = Math.random() * w; y = -20;    }
            else if (edge === 1) { x = w + 20;             y = Math.random() * h; }
            else if (edge === 2) { x = Math.random() * w; y = h + 20; }
            else                 { x = -20;                y = Math.random() * h; }

            this.enemies.push(new Enemy(x, y, this.currentEnemySpeed));
        }
    }

    _tickWave() {
        // Boss encounter: wave only resolves when the boss is dead.
        if (this.currentBoss) {
            if (this.currentBoss.dead) this._endBossWave();
            return;
        }

        this.waveTimer++;
        if (this.waveTimer >= WAVE_DURATION_FRAMES) {
            this.waveTimer = 0;

            if (BOSS_WAVES.includes(this.wave)) {
                this._spawnBoss();
                return;
            }

            this.currentSpawnFrames = Math.max(SPAWN_FRAMES_MIN, this.currentSpawnFrames - 15);
            this.currentEnemySpeed += SPEED_PER_WAVE;
            this.gameState = 'store';
            this.store.open(this.wave);
        }
    }

    // Spawns WraithPrime at the top-centre edge and locks standard spawning.
    _spawnBoss() {
        const cx = this.canvas.width  / 2;
        this.currentBoss = new WraithPrime(cx, -60, this);
        this.enemies.push(this.currentBoss);
        this.bossUIAlpha = 0;
        this.triggerShake(8, SHAKE_DURATION * 2);
        this.flashFrames = Math.floor(NOVA_FLASH_FRAMES * 0.6);
        this.shockWaves.push(new ShockWave(cx, -60, 200, '#8800cc'));
        this.floatingTexts.push(new FloatingText(
            cx, this.canvas.height / 2 - 80, '— WRAITH PRIME —', '#cc44ff', 20
        ));
        // Dynamic crossfade: ambient BGM ducks, boss music rises over 2s.
        this.audio.startBossMusic();
    }

    // Called once WraithPrime.dead becomes true. Cleans up, rewards the player,
    // then transitions to the upgrade store exactly as a normal wave completion would.
    _endBossWave() {
        const bossX = this.currentBoss.x;
        const bossY = this.currentBoss.y;

        this.audio.playSoundEffect('nova_blast');
        this.triggerShake(NOVA_SHAKE_INT, SHAKE_DURATION * 3);
        this.flashFrames = NOVA_FLASH_FRAMES;

        // Erase all corruption from the arena
        this.corruptionParticles = [];

        // 3 IgnisFlare pickups scattered around the boss's last position
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            this.ignisFlares.push(new IgnisFlare(
                bossX + Math.cos(angle) * 55,
                bossY + Math.sin(angle) * 55
            ));
        }

        this.floatingTexts.push(new FloatingText(bossX, bossY - 60, 'VANQUISHED', '#ffffff', 18));
        this.currentBoss = null;
        // Reverse crossfade: boss music fades out, ambient BGM returns over 2s.
        this.audio.endBossMusic();

        this.currentSpawnFrames = Math.max(SPAWN_FRAMES_MIN, this.currentSpawnFrames - 15);
        this.currentEnemySpeed += SPEED_PER_WAVE;
        this.gameState = 'store';
        this.store.open(this.wave);
    }

    _resumeFromStore() {
        this.wave++;
        this.spawnTimer = 0;
        this.gameState  = 'playing';
    }

    // Spawns an IgnisFlare pickup at a random ShadowPile position.
    // Falls back to a random central-area position if no piles exist.
    _spawnFlare() {
        let x, y;
        if (this.shadowPiles.length > 0) {
            const pile = this.shadowPiles[Math.floor(Math.random() * this.shadowPiles.length)];
            x = pile.x;
            y = pile.y;
        } else {
            x = this.canvas.width  * (0.2 + Math.random() * 0.6);
            y = this.canvas.height * (0.2 + Math.random() * 0.6);
        }
        this.ignisFlares.push(new IgnisFlare(x, y));
    }

    // ── Menu state update — minimal simulation for atmosphere ────────────────
    // Advances the Player (cursor tracking + orbital angle) and the Hero (gentle
    // wander) so the world looks alive behind the overlay.  Ambient sonar pulses
    // are also ticked so the dark arena feels populated.
    _updateMenu() {
        const cx = this.canvas.width  / 2;
        const cy = this.canvas.height / 2;

        // Player: trail + cursor follow + orbit (no repel/nova/combo ticks)
        this.player.trail.push({ x: this.player.x, y: this.player.y });
        if (this.player.trail.length > TRAIL_LENGTH) this.player.trail.shift();
        this.player.x = Math.max(this.player.radius, Math.min(this.canvas.width  - this.player.radius, this.mouseX));
        this.player.y = Math.max(this.player.radius, Math.min(this.canvas.height - this.player.radius, this.mouseY));
        this.player.orbitAngle += 0.035;
        this.player.currentLightRadius =
            this.player.lightRadius + Math.sin(this.time * PULSE_SPEED) * PULSE_AMPLITUDE;

        // Hero: quiet wander within the centre zone
        this.hero.state = 'wandering';
        this.hero._wander(cx, cy);

        // Ambient sonar pulses for atmosphere (no piles to ping)
        this.scoutTimer++;
        if (this.scoutTimer >= SCOUT_INTERVAL) {
            this.scoutTimer = 0;
            this.ambientPulses.push(new AmbientPulse(this.player.x, this.player.y));
        }
        for (let i = this.ambientPulses.length - 1; i >= 0; i--) {
            this.ambientPulses[i].update([]);
            if (this.ambientPulses[i].done) this.ambientPulses.splice(i, 1);
        }
    }

    // ── Menu → Playing transition ─────────────────────────────────────────────
    // Emits a "Deep Boom": heavy screen shake, full-screen flash, and a large
    // cyan shockwave ring expanding from the screen centre — signalling the
    // MenuCircle barrier dropping and Wave 1 beginning.
    _startGame() {
        const cx = this.canvas.width  / 2;
        const cy = this.canvas.height / 2;

        this.triggerShake(15, SHAKE_DURATION * 3);
        this.flashFrames = NOVA_FLASH_FRAMES;

        // Barrier-collapse shockwave — oversized to match the MenuCircle
        this.shockWaves.push(new ShockWave(cx, cy, MENU_CIRCLE_RADIUS * 1.8, '#00ffff'));

        // Radial burst of cyan particles
        for (let i = 0; i < 48; i++) {
            const angle = (i / 48) * Math.PI * 2;
            const p = new Particle(cx, cy, '#00ffff');
            p.vx = Math.cos(angle) * (4 + Math.random() * 4);
            p.vy = Math.sin(angle) * (4 + Math.random() * 4);
            this.particles.push(p);
        }

        // Satisfy the browser's autoplay policy: play() must be called inside a
        // user-gesture handler.  The 'keydown SPACE' event that reaches _startGame()
        // qualifies, so this is the correct and only place to begin playback.
        this.audio.play();
        this.audio.setVolume(0.5);

        this.gameState = 'playing';
    }

    update() {
        this.time++;
        if (this.gameState === 'menu')    { this._updateMenu(); return; }
        if (this.gameState === 'paused')  { return; }          // world fully frozen
        if (this.gameState === 'gameover') {
            // Fade all audio tracks to silence on the first gameover frame.
            // fadeAllTo() covers both BGM and boss music so mid-encounter death
            // doesn't leave the boss track audible behind the game-over screen.
            if (this.gameOverTimer === 0) this.audio.fadeAllTo(0, 3000);
            this.gameOverTimer++;
            return;
        }
        if (this.gameState !== 'playing') return;

        this._tickWave();

        // Standard spawns are suspended during boss encounters
        if (!this.currentBoss) {
            this.spawnTimer++;
            if (this.spawnTimer >= this.currentSpawnFrames) {
                this.spawnTimer = 0;
                this.spawnEnemy();
            }
            if (this.burstCooldown > 0) this.burstCooldown--;
        }

        this.player.update(this.mouseX, this.mouseY, this.shadowPiles, this);

        // Corruption proximity — builds drain when player is near any void pool.
        // Suppressed entirely while the player is dashing (invulnerability window).
        if (!this.player.dashActive) {
            for (const cp of this.corruptionParticles) {
                if (Math.hypot(this.player.x - cp.x, this.player.y - cp.y) < CORRUPTION_DRAIN_ZONE) {
                    this.player.corruptionDrain = Math.min(
                        CORRUPTION_MAX_DRAIN,
                        this.player.corruptionDrain + CORRUPTION_DRAIN_RATE
                    );
                    break;
                }
            }
        }

        this.hero.update(this.enemies, this.canvas.width / 2, this.canvas.height / 2);

        // Hero viewport clamp — slides along canvas edges rather than walking off
        const hr = this.hero.radius;
        this.hero.x = Math.max(hr, Math.min(this.canvas.width  - hr, this.hero.x));
        this.hero.y = Math.max(hr, Math.min(this.canvas.height - hr, this.hero.y));

        // Track hero HP before enemy updates to detect damage events
        const hpBefore = this.hero.hp;
        for (const enemy of this.enemies) enemy.update(this.hero);

        // Brief screen shake when hero takes a hit (60-frame spam guard)
        if (this.hero.hp < hpBefore && this.damageShakeCooldown <= 0) {
            this.triggerShake(3, 8);
            this.damageShakeCooldown = 60;
        }
        if (this.damageShakeCooldown > 0) this.damageShakeCooldown--;

        // Dead enemies (after dissolve) spawn ShadowPiles.
        // WraithPrime is removed silently — its death reward is handled by _endBossWave().
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (e.dead) {
                if (!(e instanceof WraithPrime)) {
                    this.shadowPiles.push(new ShadowPile(e.x, e.y));
                }
                this.enemies.splice(i, 1);
            }
        }

        // Corruption particle lifecycle
        for (let i = this.corruptionParticles.length - 1; i >= 0; i--) {
            this.corruptionParticles[i].update();
            if (this.corruptionParticles[i].dead) this.corruptionParticles.splice(i, 1);
        }

        // Boss UI alpha — fade in while alive, fade out while dissolving
        if (this.currentBoss) {
            if (!this.currentBoss.dying) {
                this.bossUIAlpha = Math.min(1, this.bossUIAlpha + 1 / BOSS_FADE_FRAMES);
            } else {
                this.bossUIAlpha = Math.max(0, this.bossUIAlpha - 1 / BOSS_FADE_FRAMES);
            }
        }

        for (let i = this.healOrbs.length - 1; i >= 0; i--) {
            this.healOrbs[i].update(this.hero, this);
            if (this.healOrbs[i].collected) this.healOrbs.splice(i, 1);
        }

        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].dead) this.particles.splice(i, 1);
        }

        for (let i = this.shockWaves.length - 1; i >= 0; i--) {
            this.shockWaves[i].update();
            if (this.shockWaves[i].done) this.shockWaves.splice(i, 1);
        }

        // Passive sonar — spawn a new AmbientPulse every SCOUT_INTERVAL frames
        this.scoutTimer++;
        if (this.scoutTimer >= SCOUT_INTERVAL) {
            this.scoutTimer = 0;
            this.ambientPulses.push(new AmbientPulse(this.player.x, this.player.y));
        }
        for (let i = this.ambientPulses.length - 1; i >= 0; i--) {
            this.ambientPulses[i].update(this.shadowPiles);
            if (this.ambientPulses[i].done) this.ambientPulses.splice(i, 1);
        }

        // Ignis Flare — periodic spawn (45s) and update / collection check
        if (this.ignisFlares.length === 0) {
            this.flareSpawnTimer++;
            if (this.flareSpawnTimer >= FLARE_SPAWN_FRAMES) {
                this.flareSpawnTimer = 0;
                this._spawnFlare();
            }
        }
        for (let i = this.ignisFlares.length - 1; i >= 0; i--) {
            this.ignisFlares[i].update(this.player, this);
            if (this.ignisFlares[i].collected) this.ignisFlares.splice(i, 1);
        }

        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            this.floatingTexts[i].update();
            if (this.floatingTexts[i].dead) this.floatingTexts.splice(i, 1);
        }

        this.hero.hp = Math.max(0, this.hero.hp);
        if (this.hero.hp <= 0) this.gameState = 'gameover';
    }

    drawGrid() {
        const ctx = this.ctx;
        const w   = this.canvas.width;
        const h   = this.canvas.height;

        const offsetX = (-(this.hero.x * GRID_PARALLAX) % GRID_SIZE + GRID_SIZE) % GRID_SIZE;
        const offsetY = (-(this.hero.y * GRID_PARALLAX) % GRID_SIZE + GRID_SIZE) % GRID_SIZE;

        ctx.save();
        ctx.strokeStyle = `rgba(180, 180, 220, ${GRID_OPACITY})`;
        ctx.lineWidth   = 0.5;
        ctx.beginPath();

        for (let x = offsetX; x <= w; x += GRID_SIZE) {
            ctx.moveTo(x, 0); ctx.lineTo(x, h);
        }
        for (let y = offsetY; y <= h; y += GRID_SIZE) {
            ctx.moveTo(0, y); ctx.lineTo(w, y);
        }

        ctx.stroke();
        ctx.restore();
    }

    drawLighting() {
        const lc = this.lightCtx;

        lc.clearRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);
        lc.fillStyle = 'rgba(0, 0, 0, 0.93)';
        lc.fillRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);

        lc.globalCompositeOperation = 'destination-out';

        const r    = this.player.currentLightRadius;
        const grad = lc.createRadialGradient(
            this.player.x, this.player.y, 0,
            this.player.x, this.player.y, r
        );
        grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        lc.fillStyle = grad;
        lc.beginPath();
        lc.arc(this.player.x, this.player.y, r, 0, Math.PI * 2);
        lc.fill();

        lc.globalCompositeOperation = 'source-over';
        this.ctx.drawImage(this.lightCanvas, 0, 0);
    }

    drawHUD() {
        const ctx  = this.ctx;
        const pad  = 22;
        const font = '"Courier New", monospace';

        ctx.save();
        ctx.textBaseline = 'alphabetic';

        // ── Left panel: Wave / Score / progress bar / repel / nova / dash ────
        const repelFrac  = Math.min(1, this.player.repelTimer / REPEL_COOLDOWN);
        const repelReady = repelFrac >= 1;
        const novaFrac   = Math.min(1, this.player.novaTimer  / NOVA_COOLDOWN);
        const novaReady  = novaFrac >= 1;
        const dashFrac   = Math.min(1, this.player.dashTimer  / DASH_COOLDOWN);
        const dashReady  = dashFrac >= 1;
        const streak     = this.player.streakActive;
        const flareOn    = this.player.flareActive;

        // Panel grows by 20px per active optional row (Flare bar + Streak row).
        // DASH row is always shown (122px base vs previous 102px).
        const panelH = 122 + (flareOn ? 20 : 0) + (streak ? 20 : 0);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.roundRect(pad - 8, pad - 14, 148, panelH, 6);
        ctx.fill();

        ctx.font      = `bold 13px ${font}`;
        ctx.fillStyle = 'rgba(200, 220, 255, 0.85)';
        ctx.textAlign = 'left';
        ctx.fillText(`WAVE   ${this.wave}`,  pad, pad);
        ctx.fillText(`SCORE  ${this.score}`, pad, pad + 22);

        // Wave-progress bar — hidden during boss encounters (boss HP bar replaces it)
        if (!this.currentBoss) {
            const pW = 130;
            ctx.fillStyle = 'rgba(80, 80, 100, 0.5)';
            ctx.fillRect(pad - 2, pad + 30, pW, 3);
            ctx.fillStyle   = '#00ffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur  = 6;
            ctx.fillRect(pad - 2, pad + 30, pW * (this.waveTimer / WAVE_DURATION_FRAMES), 3);
            ctx.shadowBlur  = 0;
        }

        // Repel charge row
        ctx.font      = `bold 11px ${font}`;
        ctx.fillStyle = repelReady ? '#00ffff' : 'rgba(130, 160, 190, 0.65)';
        ctx.fillText('REPEL', pad, pad + 52);

        ctx.fillStyle = 'rgba(60, 60, 80, 0.5)';
        ctx.fillRect(pad + 50, pad + 44, 70, 3);

        if (repelReady) {
            ctx.fillStyle   = '#00ffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur  = 8;
        } else {
            ctx.fillStyle = 'rgba(0, 180, 180, 0.5)';
        }
        ctx.fillRect(pad + 50, pad + 44, 70 * repelFrac, 3);
        ctx.shadowBlur = 0;

        // Nova charge row
        ctx.font      = `bold 11px ${font}`;
        ctx.fillStyle = novaReady ? '#ffffff' : 'rgba(180, 160, 130, 0.65)';
        ctx.fillText('NOVA', pad, pad + 72);

        ctx.fillStyle = 'rgba(60, 60, 80, 0.5)';
        ctx.fillRect(pad + 50, pad + 64, 70, 3);

        if (novaReady) {
            ctx.fillStyle   = '#ffffff';
            ctx.shadowColor = '#ffe566';
            ctx.shadowBlur  = 10;
        } else {
            ctx.fillStyle = 'rgba(180, 140, 60, 0.45)';
        }
        ctx.fillRect(pad + 50, pad + 64, 70 * novaFrac, 3);
        ctx.shadowBlur = 0;

        // Dash charge row
        ctx.font      = `bold 11px ${font}`;
        ctx.fillStyle = dashReady ? '#00ffff' : 'rgba(130, 160, 190, 0.65)';
        ctx.fillText('DASH', pad, pad + 92);

        ctx.fillStyle = 'rgba(60, 60, 80, 0.5)';
        ctx.fillRect(pad + 50, pad + 84, 70, 3);

        if (dashReady) {
            ctx.fillStyle   = '#ffffff';
            ctx.shadowColor = '#00ffff';
            ctx.shadowBlur  = 8;
        } else {
            ctx.fillStyle = 'rgba(0, 180, 180, 0.5)';
        }
        ctx.fillRect(pad + 50, pad + 84, 70 * dashFrac, 3);
        ctx.shadowBlur = 0;

        // Flare active bar — displayed directly below Dash when buff is running
        if (flareOn) {
            const flareFrac = this.player.flareTimer / FLARE_DURATION;
            ctx.font      = `bold 11px ${font}`;
            ctx.fillStyle = '#ffcc00';
            ctx.fillText('FLARE', pad, pad + 112);

            ctx.fillStyle = 'rgba(60, 60, 80, 0.5)';
            ctx.fillRect(pad + 50, pad + 104, 70, 3);

            ctx.fillStyle   = '#ffcc00';
            ctx.shadowColor = '#ffcc00';
            ctx.shadowBlur  = 8;
            ctx.fillRect(pad + 50, pad + 104, 70 * flareFrac, 3);
            ctx.shadowBlur  = 0;
        }

        // Streak indicator row — shifts down 20px when Flare bar is also visible
        if (streak) {
            const streakY = pad + 112 + (flareOn ? 20 : 0);
            const blinkA  = 0.7 + 0.3 * Math.abs(Math.sin(this.time * 0.12));
            ctx.font         = `bold 11px ${font}`;
            ctx.globalAlpha  = blinkA;
            ctx.fillStyle    = '#ffffff';
            ctx.shadowColor  = '#ffffff';
            ctx.shadowBlur   = 8;
            ctx.fillText(`STREAK  ×${this.player.comboCount}`, pad, streakY);
            ctx.shadowBlur   = 0;
            ctx.globalAlpha  = 1;
        }

        // ── Right panel: Upgrade indicators ──────────────────────────────────
        const BADGE_W   = 46;
        const BADGE_H   = 42;
        const BADGE_GAP = 6;
        const totalW    = UPGRADE_DEFS.length * BADGE_W + (UPGRADE_DEFS.length - 1) * BADGE_GAP;
        const rPanelX   = this.canvas.width - pad - totalW;
        const rPanelY   = pad - 14;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.roundRect(rPanelX - 8, rPanelY, totalW + 16, BADGE_H + 8, 6);
        ctx.fill();

        let bx = rPanelX;
        for (const def of UPGRADE_DEFS) {
            const lvl = this.upgrades[def.id];
            const lit = lvl > 0;
            const cx  = bx + BADGE_W / 2;

            ctx.font      = `16px ${font}`;
            ctx.textAlign = 'center';
            if (lit) {
                ctx.fillStyle   = def.color;
                ctx.shadowColor = def.color;
                ctx.shadowBlur  = 10;
            } else {
                ctx.fillStyle = 'rgba(100, 100, 120, 0.45)';
                ctx.shadowBlur = 0;
            }
            ctx.fillText(def.icon, cx, rPanelY + 18);
            ctx.shadowBlur = 0;

            ctx.font      = `bold 10px ${font}`;
            ctx.fillStyle = lit ? 'rgba(255,255,255,0.85)' : 'rgba(100,100,120,0.4)';
            ctx.fillText(lvl > 0 ? `×${lvl}` : '—', cx, rPanelY + 34);

            bx += BADGE_W + BADGE_GAP;
        }

        // ── Mute toggle icon — small speaker glyph below the upgrade badge panel ──
        // Centred over the badge panel so it reads as part of the same cluster.
        // Re-reads audio.muted each frame; no separate dirty flag needed.
        const muteX = rPanelX + totalW / 2;
        const muteY = rPanelY + BADGE_H + 20;

        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.font         = '15px sans-serif';
        ctx.globalAlpha  = this.audio.muted ? 0.45 : 0.72;
        ctx.fillText(this.audio.muted ? '🔇' : '🔊', muteX, muteY);

        ctx.font         = `9px ${font}`;
        ctx.fillStyle    = 'rgba(140, 160, 190, 0.38)';
        ctx.globalAlpha  = 1;
        ctx.fillText('[M]', muteX, muteY + 13);

        ctx.textAlign = 'left';
        ctx.restore();
    }

    // ── Boss UI Overlay ───────────────────────────────────────────────────────────
    // Wide health bar at top-centre. Deep purple fill, pulsing white glow border,
    // and a tracking-heavy 'WRAITH PRIME' nameplate. Fades in/out via bossUIAlpha.
    // Rendered above all world geometry (called after drawLighting + ctx.restore).
    drawBossUI() {
        if (!this.currentBoss || this.bossUIAlpha <= 0) return;

        const ctx   = this.ctx;
        const cw    = this.canvas.width;
        const boss  = this.currentBoss;
        const alpha = this.bossUIAlpha;
        const t     = this.time;
        const font  = '"Courier New", monospace';

        const barW  = cw * 0.60;
        const barH  = 14;
        const barX  = (cw - barW) / 2;
        const barY  = 32;
        const hpFrac = Math.max(0, boss.hp / boss.maxHp);

        ctx.save();
        ctx.globalAlpha = alpha;

        // ── Nameplate ────────────────────────────────────────────────────────
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.font         = `bold 14px ${font}`;

        // Letter-spaced title via wide character string for tracking effect
        const glowA = 0.70 + 0.30 * Math.abs(Math.sin(t * 0.04));
        ctx.fillStyle   = `rgba(210, 150, 255, ${glowA})`;
        ctx.shadowColor = '#cc44ff';
        ctx.shadowBlur  = 20;
        ctx.fillText('W  R  A  I  T  H    P  R  I  M  E', cw / 2, barY - 14);
        ctx.shadowBlur  = 0;

        // ── Bar tray ─────────────────────────────────────────────────────────
        ctx.fillStyle = 'rgba(0, 0, 0, 0.68)';
        ctx.beginPath();
        ctx.roundRect(barX - 3, barY - 3, barW + 6, barH + 6, 5);
        ctx.fill();

        // ── Pulsing white glow border ─────────────────────────────────────────
        const borderGlow = 0.50 + 0.50 * Math.abs(Math.sin(t * 0.055));
        ctx.strokeStyle = `rgba(255, 255, 255, ${borderGlow * 0.80})`;
        ctx.lineWidth   = 1.5;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur  = 10 + borderGlow * 10;
        ctx.beginPath();
        ctx.roundRect(barX - 3, barY - 3, barW + 6, barH + 6, 5);
        ctx.stroke();
        ctx.shadowBlur  = 0;

        // ── Deep purple HP fill ───────────────────────────────────────────────
        if (hpFrac > 0) {
            const fillW = barW * hpFrac;

            // Gradient: deep indigo → vivid purple toward the leading edge
            const fillGrad = ctx.createLinearGradient(barX, 0, barX + fillW, 0);
            fillGrad.addColorStop(0,   '#2d006e');
            fillGrad.addColorStop(0.7, '#5500bb');
            fillGrad.addColorStop(1,   '#8833ee');
            ctx.fillStyle   = fillGrad;
            ctx.shadowColor = '#9933ff';
            ctx.shadowBlur  = 10;
            ctx.beginPath();
            ctx.roundRect(barX, barY, fillW, barH, 3);
            ctx.fill();
            ctx.shadowBlur  = 0;

            // Shimmer highlight along the top edge
            ctx.fillStyle = 'rgba(200, 120, 255, 0.22)';
            ctx.fillRect(barX, barY, fillW, 3);
        }

        // ── HP fraction label (right-aligned beside the bar) ─────────────────
        ctx.font        = `bold 10px ${font}`;
        ctx.fillStyle   = 'rgba(190, 155, 255, 0.70)';
        ctx.textAlign   = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${boss.hp} / ${boss.maxHp}`, barX + barW - 4, barY + barH / 2);

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // ── Cinematic Game Over — Isbister (2016) on emotional weight of fail-states ─
    // The overlay fades in progressively, using gameOverTimer so content is
    // staggered: dark veil first, then epitaph, then stats, then prompts.
    // A deliberate serif font ('Georgia') contrasts the HUD's Courier New — its
    // elegance signals finality rather than technical readout (Visual Hierarchy
    // principle: font choice communicates hierarchy and emotional register).
    drawGameOver() {
        const ctx  = this.ctx;
        const cw   = this.canvas.width;
        const ch   = this.canvas.height;
        const cx   = cw / 2;
        const cy   = ch / 2;
        const t    = this.gameOverTimer;     // frames since gameover began
        const font = '"Courier New", monospace';

        ctx.save();
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';

        // Progressive dark veil — reaches full opacity by frame 60 (1s)
        const overlayA = Math.min(0.85, (t / 60) * 0.85);
        ctx.fillStyle = `rgba(0, 0, 0, ${overlayA})`;
        ctx.fillRect(0, 0, cw, ch);

        // Stagger content: nothing visible until frame 40, then fade in over 40 frames
        const contentA = Math.max(0, Math.min(1, (t - 40) / 40));
        if (contentA <= 0) { ctx.restore(); return; }
        ctx.globalAlpha = contentA;

        // ── Epitaph title — elegant serif signals finality, not a techy readout ──
        const titlePulse = 0.80 + 0.12 * Math.abs(Math.sin(this.time * 0.012));
        ctx.font        = `bold 52px Georgia, "Times New Roman", serif`;
        ctx.fillStyle   = `rgba(185, 55, 55, ${titlePulse})`;
        ctx.shadowColor = 'rgba(155, 25, 25, 0.75)';
        ctx.shadowBlur  = 30;
        ctx.fillText('THE LIGHT HAS FADED', cx, cy - 110);
        ctx.shadowBlur  = 0;

        // Thin decorative rule beneath the title
        const dW = 300;
        ctx.strokeStyle = 'rgba(160, 55, 55, 0.35)';
        ctx.lineWidth   = 0.5;
        ctx.beginPath();
        ctx.moveTo(cx - dW / 2, cy - 70); ctx.lineTo(cx + dW / 2, cy - 70);
        ctx.stroke();

        // ── Stats block ──────────────────────────────────────────────────────────
        ctx.font = `13px ${font}`;

        ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(185, 200, 230, 0.65)';
        ctx.fillText('Waves Survived', cx - 14, cy - 34);
        ctx.fillText('Shadows Purged', cx - 14, cy - 8);

        ctx.textAlign = 'left';
        ctx.font      = `bold 13px ${font}`;
        ctx.fillStyle = 'rgba(225, 235, 255, 0.92)';
        ctx.fillText(`${this.wave}`,  cx + 22, cy - 34);
        ctx.fillText(`${this.score}`, cx + 22, cy - 8);

        // Second rule
        ctx.strokeStyle = 'rgba(160, 55, 55, 0.35)';
        ctx.lineWidth   = 0.5;
        ctx.beginPath();
        ctx.moveTo(cx - dW / 2, cy + 18); ctx.lineTo(cx + dW / 2, cy + 18);
        ctx.stroke();

        // ── Prompts — pulsing so they draw the eye without overwhelming ───────────
        const promptA = 0.48 + 0.52 * Math.abs(Math.sin(this.time * 0.04));
        ctx.textAlign   = 'center';
        ctx.font        = `12px ${font}`;
        ctx.fillStyle   = `rgba(255, 247, 161, ${promptA})`;
        ctx.shadowColor = '#ffe566';
        ctx.shadowBlur  = promptA * 10;
        ctx.fillText('[R]  Restart          [M]  Return to Menu', cx, cy + 58);
        ctx.shadowBlur  = 0;

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    // ── Main menu overlay ─────────────────────────────────────────────────────
    // Draws over the already-rendered world (grid + entities + lighting) to
    // create a diegetic onboarding screen.  Three spatial layers:
    //   1. World-space elements  — MenuCircle ring, entity labels
    //   2. Screen-space title    — 'IGNIS FATUUS' + subtitle + SPACE prompt
    //   3. Screen-space sidebar  — How to Play panel (right edge)
    drawMenu() {
        const ctx  = this.ctx;
        const cw   = this.canvas.width;
        const ch   = this.canvas.height;
        const cx   = cw / 2;
        const cy   = ch / 2;
        const t    = this.time;
        const font = '"Courier New", monospace';

        ctx.save();

        // Subtle dark veil — darkens the world just enough for text legibility
        ctx.fillStyle = 'rgba(5, 5, 18, 0.50)';
        ctx.fillRect(0, 0, cw, ch);

        // ── MenuCircle — pulsing safe-zone barrier ring ───────────────────────
        const pulse = Math.sin(t * 0.028);
        const ringR = MENU_CIRCLE_RADIUS + pulse * 5;

        // Soft radial fill — a faint inner glow just inside the ring
        const ringGrad = ctx.createRadialGradient(cx, cy, ringR * 0.72, cx, cy, ringR * 1.14);
        ringGrad.addColorStop(0,    'rgba(0, 255, 255, 0)');
        ringGrad.addColorStop(0.72, 'rgba(0, 255, 255, 0)');
        ringGrad.addColorStop(0.88, 'rgba(0, 255, 255, 0.045)');
        ringGrad.addColorStop(1,    'rgba(0, 255, 255, 0)');
        ctx.beginPath();
        ctx.arc(cx, cy, ringR * 1.14, 0, Math.PI * 2);
        ctx.fillStyle = ringGrad;
        ctx.fill();

        // Primary ring stroke
        ctx.beginPath();
        ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.22 + 0.08 * pulse})`;
        ctx.lineWidth   = 1.5;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur  = 18;
        ctx.stroke();
        ctx.shadowBlur  = 0;

        // Inner echo ring
        ctx.beginPath();
        ctx.arc(cx, cy, ringR * 0.82, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 190, 255, ${0.07 + 0.04 * Math.abs(pulse)})`;
        ctx.lineWidth   = 0.8;
        ctx.stroke();

        // ── Diegetic labels — anchored to the live entity positions ──────────
        // These float in world space, communicating intent without pausing the
        // atmospheric animation (Rogers, 2014: diegetic UI principle).
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        const dA = 0.55 + 0.45 * Math.abs(Math.sin(t * 0.04));

        // "MOVE CURSOR" — below the Spark (Player)
        ctx.globalAlpha = dA;
        ctx.font        = `bold 11px ${font}`;
        ctx.fillStyle   = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur  = 8;
        ctx.fillText('MOVE  CURSOR', this.player.x, this.player.y + 30);
        ctx.shadowBlur  = 0;

        // "PROTECT THE HERO" — above the Hooded Shadow (Hero)
        ctx.fillStyle   = 'rgba(200, 224, 255, 0.88)';
        ctx.shadowColor = '#7ecfff';
        ctx.shadowBlur  = 6;
        ctx.fillText('PROTECT THE HERO', this.hero.x, this.hero.y - 38);
        ctx.shadowBlur  = 0;
        ctx.globalAlpha = 1;

        // ── Title: IGNIS FATUUS ───────────────────────────────────────────────
        const titleA = 0.88 + 0.12 * Math.abs(Math.sin(t * 0.018));
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';

        // Double-render pass for stronger bloom without a second canvas
        ctx.font      = `bold 58px ${font}`;
        ctx.fillStyle = `rgba(0, 255, 255, ${titleA})`;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur  = 42;
        ctx.fillText('IGNIS FATUUS', cx, ch * 0.14);
        ctx.shadowBlur  = 20;
        ctx.fillText('IGNIS FATUUS', cx, ch * 0.14);
        ctx.shadowBlur  = 0;

        // Subtitle
        ctx.font      = `11px ${font}`;
        ctx.fillStyle = 'rgba(140, 175, 220, 0.52)';
        ctx.fillText('— A GAME OF LIGHT AND SHADOW —', cx, ch * 0.14 + 46);

        // ── PRESS SPACE TO START — pulsing ethereal prompt ────────────────────
        const startA = 0.5 + 0.5 * Math.abs(Math.sin(t * 0.055));
        ctx.font        = `bold 15px ${font}`;
        ctx.fillStyle   = `rgba(255, 247, 161, ${startA})`;
        ctx.shadowColor = '#ffe566';
        ctx.shadowBlur  = startA * 16;
        ctx.fillText('PRESS  SPACE  TO  START', cx, ch * 0.84);
        ctx.shadowBlur  = 0;

        ctx.restore();

        // How to Play panel (own save/restore)
        this._drawHowToPlay(ctx);
    }

    // ── 'How to Play' right-edge panel ────────────────────────────────────────
    // A glass-style rounded panel listing the four core controls.
    // Positioned at the vertical midpoint of the right edge so it doesn't
    // compete with the title (top) or the start prompt (bottom).
    _drawHowToPlay(ctx) {
        const cw   = this.canvas.width;
        const ch   = this.canvas.height;
        const font = '"Courier New", monospace';
        const panW = 256;
        const panH = 186;
        const panX = cw - 28 - panW;
        const panY = ch / 2 - panH / 2;

        ctx.save();

        // Panel backdrop
        ctx.fillStyle = 'rgba(0, 0, 0, 0.60)';
        ctx.beginPath();
        ctx.roundRect(panX, panY, panW, panH, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.14)';
        ctx.lineWidth   = 1;
        ctx.stroke();

        // Header
        ctx.textBaseline = 'middle';
        ctx.textAlign    = 'left';
        ctx.font         = `bold 11px ${font}`;
        ctx.fillStyle    = 'rgba(0, 255, 255, 0.82)';
        ctx.shadowColor  = '#00ffff';
        ctx.shadowBlur   = 5;
        ctx.fillText('HOW  TO  PLAY', panX + 18, panY + 20);
        ctx.shadowBlur   = 0;

        // Divider
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.12)';
        ctx.lineWidth   = 0.5;
        ctx.beginPath();
        ctx.moveTo(panX + 12, panY + 34);
        ctx.lineTo(panX + panW - 12, panY + 34);
        ctx.stroke();

        const rows = [
            { key: 'SPACE', desc: 'Kinetic Repel  —  Push',       color: '#00ffff' },
            { key: 'F',     desc: 'Lumen Nova  —  Clear  (15s)',   color: '#ffffff' },
            { key: 'SHIFT', desc: 'Lumen Dash  —  Blink  (3s)',   color: '#00ffff' },
            { key: 'HOVER', desc: 'Cleanse Shadow Piles',          color: '#b44fff' },
            { key: 'COMBO', desc: '3+ Cleans  →  Light Boost',    color: '#4cff91' },
        ];

        ctx.font = `bold 10px ${font}`;
        let ry = panY + 50;
        for (const row of rows) {
            // Key badge — dark pill behind the key label
            ctx.fillStyle = 'rgba(12, 12, 32, 0.90)';
            ctx.beginPath();
            ctx.roundRect(panX + 14, ry - 8, 46, 16, 3);
            ctx.fill();

            ctx.textAlign = 'center';
            ctx.fillStyle = row.color;
            ctx.fillText(row.key, panX + 37, ry);

            ctx.textAlign = 'left';
            ctx.fillStyle = 'rgba(185, 208, 240, 0.72)';
            ctx.fillText(row.desc, panX + 70, ry);

            ry += 26;
        }

        ctx.restore();
    }

    // Draws a small cyan arrow at the viewport edge pointing toward the Hero
    // when they wander beyond HERO_POINTER_DIST from the screen centre.
    // The clamping uses the viewport-rectangle projection (min-t method) so the
    // arrow always hugs the nearest screen edge, not just a circle boundary.
    drawHeroPointer() {
        const { hero, canvas, ctx } = this;
        const cx = canvas.width  / 2;
        const cy = canvas.height / 2;
        const dx = hero.x - cx;
        const dy = hero.y - cy;
        const dist = Math.hypot(dx, dy);

        if (dist < HERO_POINTER_DIST) return;

        const margin = 30;
        const halfW  = canvas.width  / 2 - margin;
        const halfH  = canvas.height / 2 - margin;

        // Project direction onto rectangle edge
        const nx    = dx / dist;
        const ny    = dy / dist;
        const scale = Math.min(halfW / (Math.abs(nx) || 0.001), halfH / (Math.abs(ny) || 0.001));
        const ax    = cx + nx * scale;
        const ay    = cy + ny * scale;

        const angle      = Math.atan2(dy, dx);
        const blinkAlpha = 0.55 + 0.45 * Math.abs(Math.sin(this.time * 0.07));
        const sz         = 9;

        ctx.save();
        ctx.globalAlpha = blinkAlpha;
        ctx.translate(ax, ay);
        ctx.rotate(angle);

        // Filled arrowhead
        ctx.beginPath();
        ctx.moveTo(sz,       0);
        ctx.lineTo(-sz * 0.6, -sz * 0.65);
        ctx.lineTo(-sz * 0.6,  sz * 0.65);
        ctx.closePath();
        ctx.fillStyle   = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur  = 12;
        ctx.fill();

        // Small label beneath the arrow when far (> 2× threshold)
        if (dist > HERO_POINTER_DIST * 2) {
            ctx.rotate(-angle);
            ctx.font         = 'bold 9px "Courier New", monospace';
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'top';
            ctx.fillStyle    = 'rgba(0, 255, 255, 0.75)';
            ctx.shadowBlur   = 0;
            ctx.fillText('HERO', 0, sz + 4);
        }

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // Tactical minimap — 120px circular overview in the bottom-right corner.
    // Uses a world-to-minimap projection (MINIMAP_SCALE = 0.1) centred on the
    // viewport midpoint. Dots: Hero = teal, Enemies = red, Piles = green,
    // Player = warm yellow. Rendered with ctx.clip() so dots are masked to the circle.
    drawMinimap(ctx) {
        const R       = MINIMAP_RADIUS;
        const S       = MINIMAP_SCALE;
        const margin  = MINIMAP_MARGIN;
        const mmCX    = this.canvas.width  - margin - R;
        const mmCY    = this.canvas.height - margin - R;
        const worldCX = this.canvas.width  / 2;
        const worldCY = this.canvas.height / 2;

        // Project world coordinates onto the minimap surface
        const proj = (wx, wy) => ({
            x: mmCX + (wx - worldCX) * S,
            y: mmCY + (wy - worldCY) * S,
        });

        // ── Clipped interior (background + dots) ─────────────────────────────
        ctx.save();
        ctx.beginPath();
        ctx.arc(mmCX, mmCY, R, 0, Math.PI * 2);
        ctx.clip();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.68)';
        ctx.fillRect(mmCX - R, mmCY - R, R * 2, R * 2);

        // Shadow Piles — teal-green dots
        for (const pile of this.shadowPiles) {
            const p = proj(pile.x, pile.y);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#00ff88';
            ctx.fill();
        }

        // Corruption pools — faint purple smudges
        for (const cp of this.corruptionParticles) {
            const p = proj(cp.x, cp.y);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(140, 0, 220, 0.55)';
            ctx.fill();
        }

        // Enemies — red dots (skip dissolving); WraithPrime gets a larger purple dot
        for (const e of this.enemies) {
            if (e.dying) continue;
            if (e instanceof WraithPrime) continue; // drawn separately below
            const p = proj(e.x, e.y);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#ff3030';
            ctx.fill();
        }

        // Boss — large pulsing purple dot
        if (this.currentBoss && !this.currentBoss.dying) {
            const bp    = proj(this.currentBoss.x, this.currentBoss.y);
            const bPulse = 0.7 + 0.3 * Math.abs(Math.sin(this.time * 0.08));
            ctx.beginPath();
            ctx.arc(bp.x, bp.y, 5.5, 0, Math.PI * 2);
            ctx.fillStyle   = `rgba(180, 60, 255, ${bPulse})`;
            ctx.shadowColor = '#cc44ff';
            ctx.shadowBlur  = 8;
            ctx.fill();
            ctx.shadowBlur  = 0;
        }

        // Hero — teal dot (larger, with glow)
        const hp = proj(this.hero.x, this.hero.y);
        ctx.beginPath();
        ctx.arc(hp.x, hp.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle   = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur  = 5;
        ctx.fill();
        ctx.shadowBlur  = 0;

        // Player — warm yellow dot
        const pp = proj(this.player.x, this.player.y);
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff7a1';
        ctx.fill();

        ctx.restore(); // end clip

        // ── Cyan border ring — drawn after restore so it isn't clipped ───────
        ctx.beginPath();
        ctx.arc(mmCX, mmCY, R, 0, Math.PI * 2);
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth   = 1;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur  = 6;
        ctx.stroke();
        ctx.shadowBlur  = 0;
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // ── Screen shake ─────────────────────────────────────────────────────
        // Apply a random offset to the world canvas each frame the shake is active.
        // HUD, flash, and floating texts are drawn AFTER ctx.restore() so they stay
        // anchored to the screen — only world geometry appears to judder (Swink, 2008).
        let sx = 0, sy = 0;
        if (this.shakeFrames > 0) {
            const decay = this.shakeFrames / SHAKE_DURATION; // 1→0 linear falloff
            sx = (Math.random() - 0.5) * 2 * this.shakeIntensity * decay;
            sy = (Math.random() - 0.5) * 2 * this.shakeIntensity * decay;
            this.shakeFrames--;
            if (this.shakeFrames === 0) this.shakeIntensity = 0;
        }
        ctx.save();
        ctx.translate(sx, sy);

        // Gradual desaturation during game over (fades from colour to full grey over 2s).
        // Applied after ctx.save() so ctx.restore() automatically reverts the filter;
        // the HUD and cinematic overlay drawn after restore() remain in normal colour.
        if (this.gameState === 'gameover' && this.gameOverTimer > 0) {
            const grayFrac = Math.min(1, this.gameOverTimer / GAMEOVER_FADE_FRAMES);
            ctx.filter = `grayscale(${Math.round(grayFrac * 100)}%)`;
        }

        this.drawGrid();

        // Draw order: particles → ambient pulses → shockwaves → piles →
        //   corruption pools → flares → orbs → enemies → boss (above all) →
        //   hero → trail → player → lighting
        for (const p     of this.particles)            p.draw(ctx);
        for (const ap    of this.ambientPulses)        ap.draw(ctx);
        for (const sw    of this.shockWaves)           sw.draw(ctx);
        for (const pile  of this.shadowPiles)          pile.draw(ctx, this.cleanFrames, this.time);
        for (const cp    of this.corruptionParticles)  cp.draw(ctx);
        for (const flare of this.ignisFlares)          flare.draw(ctx);
        for (const orb   of this.healOrbs)             orb.draw(ctx);
        // Standard enemies first, then boss on top
        for (const e of this.enemies) {
            if (e !== this.currentBoss) e.draw(ctx);
        }
        if (this.currentBoss) this.currentBoss.draw(ctx);
        this.hero.draw(ctx);
        this.player.drawTrail(ctx);
        this.player.draw(ctx);

        this.drawLighting();

        ctx.restore(); // end screen shake — HUD and overlays below are unshaken

        // ── Nova white flash ─────────────────────────────────────────────────
        if (this.flashFrames > 0) {
            const fa = this.flashFrames / NOVA_FLASH_FRAMES;
            ctx.save();
            ctx.globalAlpha = fa * 0.80;
            ctx.fillStyle   = '#ffffff';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.restore();
            this.flashFrames--;
        }

        // Menu overlay — world renders beneath it; early-return suppresses HUD/minimap
        if (this.gameState === 'menu') {
            this.drawMenu();
            return;
        }

        // Boss UI layer — above all world elements, below standard HUD
        if (this.currentBoss) this.drawBossUI();

        // HUD, hero pointer and floating texts are suppressed during game over so
        // the cinematic overlay has a clean canvas to fade into.
        if (this.gameState !== 'gameover') {
            this.drawHUD();
            this.drawHeroPointer();
            for (const ft of this.floatingTexts) ft.draw(ctx);
            this.drawMinimap(ctx);
        }

        // Cinematic game-over drawn last so its dark veil covers everything
        if (this.gameState === 'gameover') this.drawGameOver();
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => new Game());
