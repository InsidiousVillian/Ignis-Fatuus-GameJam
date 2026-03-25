// ─── Constants ────────────────────────────────────────────────────────────────

const PLAYER_RADIUS       = 8;
const PLAYER_LIGHT_RADIUS = 130;
const PULSE_AMPLITUDE     = 15;    // max ± px added to light radius per cycle
const PULSE_SPEED         = 0.04;  // radians per frame (~1.5s period at 60fps)

const HERO_SPEED          = 1.8;
const HERO_ATTACK_RANGE   = 35;
const HERO_ATTACK_FRAMES  = 60;
const HERO_MAX_HP         = 100;
const GHOST_DRAIN_SPEED   = 0.025; // lerp rate — ghost bar chases real HP each frame

const ENEMY_SPEED         = 0.9;
const ENEMY_MAX_HP        = 3;
const ENEMY_SPAWN_FRAMES  = 180;

const SHADOW_CLEAN_FRAMES = 90;
const HEAL_ORB_LERP       = 0.05;
const HEAL_ORB_VALUE      = 20;

const GRID_SIZE           = 60;    // px between grid lines
const GRID_PARALLAX       = 0.04;  // grid shift fraction relative to Hero position
const GRID_OPACITY        = 0.07;

// ─── Particle ─────────────────────────────────────────────────────────────────

class Particle {
    constructor(x, y, color) {
        this.x     = x;
        this.y     = y;
        this.color = color;
        // Random outward drift, biased slightly backward for a trail feel
        this.vx    = (Math.random() - 0.5) * 1.6;
        this.vy    = (Math.random() - 0.5) * 1.6;
        this.life  = 0.7 + Math.random() * 0.3;  // initial opacity 0.7–1.0
        this.decay = 0.035 + Math.random() * 0.03; // fades in ~20–40 frames
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

// ─── Player ───────────────────────────────────────────────────────────────────

class Player {
    constructor(canvas) {
        this.x = canvas.width  / 2;
        this.y = canvas.height / 2;
        this.radius           = PLAYER_RADIUS;
        this.lightRadius      = PLAYER_LIGHT_RADIUS;
        this.currentLightRadius = PLAYER_LIGHT_RADIUS;
    }

    // time is the Game's frame counter, used to drive the Sine pulse
    update(mouseX, mouseY, shadowPiles, game) {
        this.x = mouseX;
        this.y = mouseY;

        // Sine wave breathing on the light radius — computed here so drawLighting
        // can read currentLightRadius without recalculating.
        this.currentLightRadius =
            this.lightRadius + Math.sin(game.time * PULSE_SPEED) * PULSE_AMPLITUDE;

        // Cleaner mechanic — reverse iteration keeps splice indices valid
        for (let i = shadowPiles.length - 1; i >= 0; i--) {
            const pile = shadowPiles[i];
            const dist = Math.hypot(this.x - pile.x, this.y - pile.y);

            if (dist < pile.radius + this.radius + 10) {
                pile.hoverFrames++;
                if (pile.hoverFrames >= SHADOW_CLEAN_FRAMES) {
                    game.healOrbs.push(new HealOrb(pile.x, pile.y));
                    shadowPiles.splice(i, 1);
                }
            } else {
                pile.hoverFrames = 0;
            }
        }
    }

    draw(ctx) {
        // Outer soft halo
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
        const halo = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius * 2.5
        );
        halo.addColorStop(0, 'rgba(255, 247, 161, 0.25)');
        halo.addColorStop(1, 'rgba(255, 247, 161, 0)');
        ctx.fillStyle = halo;
        ctx.fill();

        // Core spark
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle   = '#fff7a1';
        ctx.shadowColor = '#ffe566';
        ctx.shadowBlur  = 22;
        ctx.fill();
        ctx.shadowBlur  = 0;
    }
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

class Hero {
    constructor(x, y) {
        this.x           = x;
        this.y           = y;
        this.radius      = 14;
        this.speed       = HERO_SPEED;
        this.hp          = HERO_MAX_HP;
        this.maxHp       = HERO_MAX_HP;
        this.ghostHp     = HERO_MAX_HP; // trails behind real HP for the ghost bar effect
        this.attackTimer = 0;
        this.state       = 'idle';
    }

    update(enemies) {
        // Ghost HP bar chases actual HP each frame via lerp —
        // this produces the "drain delay" visual when damage is taken.
        this.ghostHp += (this.hp - this.ghostHp) * GHOST_DRAIN_SPEED;

        let nearest     = null;
        let nearestDist = Infinity;

        for (const enemy of enemies) {
            const dist = Math.hypot(this.x - enemy.x, this.y - enemy.y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest     = enemy;
            }
        }

        if (!nearest) { this.state = 'idle'; return; }

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
                if (nearest.hp <= 0) nearest.dead = true;
            }
        }
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
        // Jump ghostHp up with HP so heals feel instant, not ghosted
        this.ghostHp = Math.min(this.maxHp, this.ghostHp + amount);
    }

    draw(ctx) {
        // Hero body
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle   = '#7ecfff';
        ctx.shadowColor = '#7ecfff';
        ctx.shadowBlur  = 10;
        ctx.fill();
        ctx.shadowBlur  = 0;
        ctx.strokeStyle = '#c8eeff';
        ctx.lineWidth   = 2;
        ctx.stroke();

        // ── Health Bar ─────────────────────────────────────────────────────────
        const barW  = 40;
        const barH  = 6;
        const bx    = this.x - barW / 2;
        const by    = this.y - this.radius - 16;

        // 1. Dark border / background track
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);

        // 2. Ghost bar (shows previous health, drains slowly toward real HP)
        const ghostRatio = Math.max(0, this.ghostHp / this.maxHp);
        ctx.fillStyle = 'rgba(220, 80, 80, 0.65)';
        ctx.fillRect(bx, by, barW * ghostRatio, barH);

        // 3. Actual HP bar on top — shifts colour as HP drops
        const ratio = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = ratio > 0.5 ? '#4cff91' : ratio > 0.25 ? '#f5a623' : '#e74c3c';
        ctx.fillRect(bx, by, barW * ratio, barH);

        // 4. Thin highlight line along the top edge
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(bx, by, barW * ratio, 1);
    }
}

// ─── Enemy ────────────────────────────────────────────────────────────────────

class Enemy {
    constructor(x, y) {
        this.x      = x;
        this.y      = y;
        this.radius = 12;
        this.speed  = ENEMY_SPEED;
        this.hp     = ENEMY_MAX_HP;
        this.dead   = false;
    }

    update(hero) {
        const angle = Math.atan2(hero.y - this.y, hero.x - this.x);
        this.x += Math.cos(angle) * this.speed;
        this.y += Math.sin(angle) * this.speed;

        if (Math.hypot(this.x - hero.x, this.y - hero.y) < this.radius + hero.radius) {
            hero.hp -= 0.08;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle   = '#8b0000';
        ctx.fill();
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth   = 2;
        ctx.stroke();

        for (let i = 0; i < this.hp; i++) {
            ctx.beginPath();
            ctx.arc(this.x - (this.hp - 1) * 5 + i * 10, this.y - this.radius - 9, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#ff6b6b';
            ctx.fill();
        }
    }
}

// ─── ShadowPile ───────────────────────────────────────────────────────────────

class ShadowPile {
    constructor(x, y) {
        this.x           = x;
        this.y           = y;
        this.radius      = 18;
        this.hoverFrames = 0;
    }

    draw(ctx) {
        const progress = this.hoverFrames / SHADOW_CLEAN_FRAMES;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(20, 5, 30, 0.88)';
        ctx.fill();
        ctx.strokeStyle = `rgba(160, 60, 220, ${0.25 + progress * 0.75})`;
        ctx.lineWidth   = 1.5;
        ctx.stroke();

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

        // Emit trailing particles proportional to movement speed this frame
        const speed = Math.hypot(this.x - prevX, this.y - prevY);
        if (speed > 0.4) {
            // 1–2 particles per frame while in motion
            const count = speed > 2 ? 2 : 1;
            for (let i = 0; i < count; i++) {
                game.particles.push(new Particle(this.x, this.y, '#4cff91'));
            }
        }

        if (Math.hypot(this.x - hero.x, this.y - hero.y) < hero.radius + this.radius) {
            hero.heal(HEAL_ORB_VALUE);
            this.collected = true;
        }
    }

    draw(ctx) {
        // Inner orb
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle   = '#4cff91';
        ctx.shadowColor = '#4cff91';
        ctx.shadowBlur  = 20;
        ctx.fill();

        // Bright white core highlight
        ctx.beginPath();
        ctx.arc(this.x - 1.5, this.y - 1.5, this.radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();

        ctx.shadowBlur = 0;
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

        this.player      = new Player(this.canvas);
        this.hero        = new Hero(this.canvas.width / 2, this.canvas.height / 2);
        this.enemies     = [];
        this.shadowPiles = [];
        this.healOrbs    = [];
        this.particles   = [];

        this.spawnTimer = 0;
        this.time       = 0; // master frame counter, drives the Sine pulse

        this.loop();
    }

    resize() {
        this.canvas.width       = window.innerWidth;
        this.canvas.height      = window.innerHeight;
        this.lightCanvas.width  = window.innerWidth;
        this.lightCanvas.height = window.innerHeight;
    }

    spawnEnemy() {
        const w    = this.canvas.width;
        const h    = this.canvas.height;
        const edge = Math.floor(Math.random() * 4);
        let x, y;

        if      (edge === 0) { x = Math.random() * w; y = -20;    }
        else if (edge === 1) { x = w + 20;             y = Math.random() * h; }
        else if (edge === 2) { x = Math.random() * w; y = h + 20; }
        else                 { x = -20;                y = Math.random() * h; }

        this.enemies.push(new Enemy(x, y));
    }

    update() {
        this.time++;

        this.spawnTimer++;
        if (this.spawnTimer >= ENEMY_SPAWN_FRAMES) {
            this.spawnTimer = 0;
            this.spawnEnemy();
        }

        this.player.update(this.mouseX, this.mouseY, this.shadowPiles, this);
        this.hero.update(this.enemies);

        for (const enemy of this.enemies) enemy.update(this.hero);

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

        // Particle lifecycle
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].dead) this.particles.splice(i, 1);
        }

        this.hero.hp = Math.max(0, this.hero.hp);
    }

    drawGrid() {
        const ctx = this.ctx;
        const w   = this.canvas.width;
        const h   = this.canvas.height;

        // Parallax: grid offset shifts slowly with Hero position to imply spatial depth.
        // Modulo GRID_SIZE wraps the offset so lines appear to scroll seamlessly.
        const offsetX = (-(this.hero.x * GRID_PARALLAX) % GRID_SIZE + GRID_SIZE) % GRID_SIZE;
        const offsetY = (-(this.hero.y * GRID_PARALLAX) % GRID_SIZE + GRID_SIZE) % GRID_SIZE;

        ctx.save();
        ctx.strokeStyle = `rgba(180, 180, 220, ${GRID_OPACITY})`;
        ctx.lineWidth   = 0.5;
        ctx.beginPath();

        for (let x = offsetX; x <= w; x += GRID_SIZE) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
        }
        for (let y = offsetY; y <= h; y += GRID_SIZE) {
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
        }

        ctx.stroke();
        ctx.restore();
    }

    drawLighting() {
        const lc = this.lightCtx;

        lc.clearRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);
        lc.fillStyle = 'rgba(0, 0, 0, 0.93)';
        lc.fillRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);

        // destination-out punches a transparent hole through the black layer.
        // Using player.currentLightRadius (which already has the Sine pulse baked in)
        // means the radius breathes each frame without touching the composite mode itself.
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

        // Always restore to source-over so subsequent frames start clean
        lc.globalCompositeOperation = 'source-over';

        this.ctx.drawImage(this.lightCanvas, 0, 0);
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Deep background (#1a1a1a per design spec)
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Parallax grid drawn above the background, below all entities
        this.drawGrid();

        // Particles sit beneath orbs so the trail appears to come from behind
        for (const p    of this.particles)   p.draw(ctx);
        for (const pile of this.shadowPiles) pile.draw(ctx);
        for (const orb  of this.healOrbs)    orb.draw(ctx);
        for (const enemy of this.enemies)    enemy.draw(ctx);
        this.hero.draw(ctx);
        this.player.draw(ctx);

        this.drawLighting();
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────

window.addEventListener('DOMContentLoaded', () => new Game());
