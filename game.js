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

const MINIMAP_RADIUS = 60;    // px — half-width of the circular minimap
const MINIMAP_SCALE  = 0.10;  // world-to-minimap coordinate multiplier
const MINIMAP_MARGIN = 20;    // px inset from canvas corner

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
        // this.img is intentionally absent — resolved via Player.prototype.img after asset load
    }

    update(mouseX, mouseY, shadowPiles, game) {
        // Record previous position before moving (persistence-of-vision trail)
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > TRAIL_LENGTH) this.trail.shift();

        this.x = mouseX;
        this.y = mouseY;

        // Viewport clamp — player slides along the canvas boundary rather than
        // disappearing off-screen; radius used as the soft wall thickness.
        this.x = Math.max(this.radius, Math.min(game.canvas.width  - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(game.canvas.height - this.radius, this.y));

        this.orbitAngle += 0.035;

        // Combo window countdown — resets count and streak when expired
        if (this.comboTimer > 0) {
            this.comboTimer--;
            if (this.comboTimer === 0) {
                this.comboCount   = 0;
                this.streakActive = false;
            }
        }

        // Streak bonus: +50% light radius when combo streak is active
        this.streakBonus = this.streakActive ? this.lightRadius * COMBO_STREAK_BONUS : 0;
        this.currentLightRadius =
            this.lightRadius + this.streakBonus + Math.sin(game.time * PULSE_SPEED) * PULSE_AMPLITUDE;

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
                }
            } else {
                pile.hoverFrames = 0;
            }
        }
    }

    // Emit shockwave, knock back + stun all enemies within REPEL_RADIUS.
    // Initial knockback velocity of 15px/frame with 0.85 friction gives ~100px
    // total displacement over the stun window (geometric series: 15/(1-0.85) = 100).
    triggerRepel(game) {
        this.repelTimer = 0;
        game.triggerShake(REPEL_SHAKE_INT, SHAKE_DURATION);

        game.shockWaves.push(new ShockWave(this.x, this.y));

        // Radial particle burst
        for (let i = 0; i < 28; i++) {
            const angle = (i / 28) * Math.PI * 2;
            const p = new Particle(this.x, this.y, '#00ffff');
            p.vx = Math.cos(angle) * (3 + Math.random() * 2.5);
            p.vy = Math.sin(angle) * (3 + Math.random() * 2.5);
            game.particles.push(p);
        }

        for (const enemy of game.enemies) {
            if (enemy.dying) continue;
            const dist = Math.hypot(this.x - enemy.x, this.y - enemy.y);
            if (dist < REPEL_RADIUS && dist > 0) {
                const angle  = Math.atan2(enemy.y - this.y, enemy.x - this.x);
                const factor = 1 - dist / REPEL_RADIUS;   // stronger when closer
                enemy.knockbackVx = Math.cos(angle) * 15 * factor;
                enemy.knockbackVy = Math.sin(angle) * 15 * factor;
                enemy.stunFrames  = REPEL_STUN_FRAMES;
            }
        }
    }

    // Lumen Nova — instant 400px vaporise blast.  15s gated ability (F or click).
    // White-hot shockwave + heavy screen shake + white flash communicates "panic button".
    triggerNova(game) {
        if (this.novaTimer < NOVA_COOLDOWN) return;
        this.novaTimer = 0;

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

        // Vaporise all non-dissolving enemies within NOVA_RADIUS
        for (const enemy of game.enemies) {
            if (enemy.dying) continue;
            if (Math.hypot(this.x - enemy.x, this.y - enemy.y) < NOVA_RADIUS) {
                // Micro burst at enemy position
                for (let j = 0; j < 8; j++) {
                    const p = new Particle(enemy.x, enemy.y, '#ffaa00');
                    p.vx = (Math.random() - 0.5) * 5;
                    p.vy = (Math.random() - 0.5) * 5;
                    game.particles.push(p);
                }
                enemy.dying = true;
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

    // Draws fading cyan circles for the last TRAIL_LENGTH positions.
    // Opacity and radius both scale linearly with recency so the oldest dot is
    // almost invisible and the newest blends seamlessly into the core.
    drawTrail(ctx) {
        // Trail colour shifts to white during Lumen Streak — visual cue that
        // the player is in a boosted state.
        const col = this.streakActive ? '#ffffff' : '#00ffff';
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
    }

    draw(ctx) { this.drawSprite(ctx); }

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
            if (e.key === ' ') {
                e.preventDefault();
                if (this.gameState === 'playing' && this.player.repelTimer >= REPEL_COOLDOWN) {
                    this.player.triggerRepel(this);
                }
            }
            if ((e.key === 'f' || e.key === 'F') && this.gameState === 'playing') {
                this.player.triggerNova(this);
            }
        });

        // Left-click also triggers Nova (ability-gated — won't fire if not charged)
        this.canvas.addEventListener('click', () => {
            if (this.gameState === 'playing') this.player.triggerNova(this);
        });

        this._loadAssets();
        this._initEntities();
        this.store     = new Store(this);
        this.time      = 0;
        this.gameState = 'playing';

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
    }

    restart() {
        this._initEntities();
        this.store.hide();
        this.gameState = 'playing';
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
        this.waveTimer++;
        if (this.waveTimer >= WAVE_DURATION_FRAMES) {
            this.waveTimer = 0;
            this.currentSpawnFrames = Math.max(SPAWN_FRAMES_MIN, this.currentSpawnFrames - 15);
            this.currentEnemySpeed += SPEED_PER_WAVE;
            this.gameState = 'store';
            this.store.open(this.wave);
        }
    }

    _resumeFromStore() {
        this.wave++;
        this.spawnTimer = 0;
        this.gameState  = 'playing';
    }

    update() {
        this.time++;
        if (this.gameState !== 'playing') return;

        this._tickWave();

        this.spawnTimer++;
        if (this.spawnTimer >= this.currentSpawnFrames) {
            this.spawnTimer = 0;
            this.spawnEnemy();
        }
        if (this.burstCooldown > 0) this.burstCooldown--;

        this.player.update(this.mouseX, this.mouseY, this.shadowPiles, this);
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

        // Dead enemies (after dissolve completes) spawn ShadowPiles
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.enemies[i].dead) {
                this.shadowPiles.push(new ShadowPile(this.enemies[i].x, this.enemies[i].y));
                this.enemies.splice(i, 1);
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

        // ── Left panel: Wave / Score / progress bar / repel charge / nova ────
        const repelFrac  = Math.min(1, this.player.repelTimer / REPEL_COOLDOWN);
        const repelReady = repelFrac >= 1;
        const novaFrac   = Math.min(1, this.player.novaTimer  / NOVA_COOLDOWN);
        const novaReady  = novaFrac >= 1;
        const streak     = this.player.streakActive;

        // Panel height grows if streak is active (extra combo row)
        const panelH = streak ? 122 : 102;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.roundRect(pad - 8, pad - 14, 148, panelH, 6);
        ctx.fill();

        ctx.font      = `bold 13px ${font}`;
        ctx.fillStyle = 'rgba(200, 220, 255, 0.85)';
        ctx.textAlign = 'left';
        ctx.fillText(`WAVE   ${this.wave}`,  pad, pad);
        ctx.fillText(`SCORE  ${this.score}`, pad, pad + 22);

        // Wave-progress bar
        const pW = 130;
        ctx.fillStyle = 'rgba(80, 80, 100, 0.5)';
        ctx.fillRect(pad - 2, pad + 30, pW, 3);
        ctx.fillStyle   = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur  = 6;
        ctx.fillRect(pad - 2, pad + 30, pW * (this.waveTimer / WAVE_DURATION_FRAMES), 3);
        ctx.shadowBlur  = 0;

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

        // Streak indicator row (only when active)
        if (streak) {
            const blinkA = 0.7 + 0.3 * Math.abs(Math.sin(this.time * 0.12));
            ctx.font         = `bold 11px ${font}`;
            ctx.globalAlpha  = blinkA;
            ctx.fillStyle    = '#ffffff';
            ctx.shadowColor  = '#ffffff';
            ctx.shadowBlur   = 8;
            ctx.fillText(`STREAK  ×${this.player.comboCount}`, pad, pad + 92);
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

        ctx.textAlign = 'left';
        ctx.restore();
    }

    drawGameOver() {
        const ctx = this.ctx;
        const cx  = this.canvas.width  / 2;
        const cy  = this.canvas.height / 2;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';

        ctx.font        = 'bold 56px "Courier New", monospace';
        ctx.fillStyle   = '#e74c3c';
        ctx.shadowColor = '#e74c3c';
        ctx.shadowBlur  = 28;
        ctx.fillText('GAME OVER', cx, cy - 60);
        ctx.shadowBlur  = 0;

        ctx.font      = 'bold 20px "Courier New", monospace';
        ctx.fillStyle = 'rgba(200, 220, 255, 0.9)';
        ctx.fillText(`Wave Reached: ${this.wave}`, cx, cy);
        ctx.fillText(`Final Score:  ${this.score}`, cx, cy + 34);

        const alpha = 0.5 + 0.5 * Math.abs(Math.sin(this.time * 0.04));
        ctx.font      = '14px "Courier New", monospace';
        ctx.fillStyle = `rgba(255, 247, 161, ${alpha})`;
        ctx.fillText('PRESS  R  TO  RESTART', cx, cy + 90);

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

        // Enemies — red dots (skip dissolving)
        for (const e of this.enemies) {
            if (e.dying) continue;
            const p = proj(e.x, e.y);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#ff3030';
            ctx.fill();
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

        this.drawGrid();

        // Draw order: particles → ambient pulses → shockwaves → piles → orbs → enemies → hero → trail → player → lighting
        for (const p     of this.particles)     p.draw(ctx);
        for (const ap    of this.ambientPulses) ap.draw(ctx);
        for (const sw    of this.shockWaves)    sw.draw(ctx);
        for (const pile  of this.shadowPiles)   pile.draw(ctx, this.cleanFrames, this.time);
        for (const orb   of this.healOrbs)      orb.draw(ctx);
        for (const e     of this.enemies)       e.draw(ctx);
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

        this.drawHUD();
        this.drawHeroPointer();

        // Floating texts — drawn over HUD so they never disappear behind panels
        for (const ft of this.floatingTexts) ft.draw(ctx);

        if (this.gameState === 'gameover') this.drawGameOver();

        // Minimap drawn last so it sits above all other UI
        this.drawMinimap(ctx);
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => new Game());
