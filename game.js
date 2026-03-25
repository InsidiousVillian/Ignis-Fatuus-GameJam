// ─── Constants ────────────────────────────────────────────────────────────────

const PLAYER_RADIUS       = 8;
const PLAYER_LIGHT_RADIUS = 130;

const HERO_SPEED          = 1.8;
const HERO_ATTACK_RANGE   = 35;
const HERO_ATTACK_FRAMES  = 60;   // one attack per second at 60fps
const HERO_MAX_HP         = 100;

const ENEMY_SPEED         = 0.9;
const ENEMY_MAX_HP        = 3;
const ENEMY_SPAWN_FRAMES  = 180;  // new enemy every 3 seconds

const SHADOW_CLEAN_FRAMES = 90;   // 1.5s at 60fps
const HEAL_ORB_LERP       = 0.05;
const HEAL_ORB_VALUE      = 20;

// ─── Player ───────────────────────────────────────────────────────────────────

class Player {
    constructor(canvas) {
        this.x = canvas.width  / 2;
        this.y = canvas.height / 2;
        this.radius      = PLAYER_RADIUS;
        this.lightRadius = PLAYER_LIGHT_RADIUS;
    }

    update(mouseX, mouseY, shadowPiles, game) {
        this.x = mouseX;
        this.y = mouseY;

        // Cleaner mechanic: accumulate hover time over each ShadowPile.
        // Iterating in reverse so splicing inside the loop is safe.
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
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fff7a1';
        ctx.shadowColor = '#fff7a1';
        ctx.shadowBlur  = 14;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

class Hero {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius      = 14;
        this.speed       = HERO_SPEED;
        this.hp          = HERO_MAX_HP;
        this.maxHp       = HERO_MAX_HP;
        this.attackTimer = 0;
        this.state       = 'idle';   // 'idle' | 'chasing'
    }

    update(enemies) {
        // Locate nearest enemy as the chase target
        let nearest     = null;
        let nearestDist = Infinity;

        for (const enemy of enemies) {
            const dist = Math.hypot(this.x - enemy.x, this.y - enemy.y);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest     = enemy;
            }
        }

        if (!nearest) {
            this.state = 'idle';
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
                if (nearest.hp <= 0) nearest.dead = true;
            }
        }
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle   = '#7ecfff';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 2;
        ctx.stroke();

        // Floating health bar
        const barW = 36;
        const barH = 5;
        const bx   = this.x - barW / 2;
        const by   = this.y - this.radius - 13;

        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(bx, by, barW, barH);

        const ratio = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = ratio > 0.5 ? '#4cff91' : ratio > 0.25 ? '#f5a623' : '#e74c3c';
        ctx.fillRect(bx, by, barW * ratio, barH);
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

        // Passive damage to hero on contact
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

        // HP pip indicators above the sprite
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

        // Arc ring showing cleaner progress
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

    update(hero) {
        // Linear interpolation toward the Hero each frame
        this.x += (hero.x - this.x) * HEAL_ORB_LERP;
        this.y += (hero.y - this.y) * HEAL_ORB_LERP;

        if (Math.hypot(this.x - hero.x, this.y - hero.y) < hero.radius + this.radius) {
            hero.heal(HEAL_ORB_VALUE);
            this.collected = true;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle   = '#4cff91';
        ctx.shadowColor = '#4cff91';
        ctx.shadowBlur  = 16;
        ctx.fill();
        ctx.shadowBlur  = 0;
    }
}

// ─── Game ─────────────────────────────────────────────────────────────────────

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx    = this.canvas.getContext('2d');

        // Off-screen canvas used exclusively for the darkness/lighting pass
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

        // Master entity lists — Game is the single source of truth
        this.player     = new Player(this.canvas);
        this.hero       = new Hero(this.canvas.width / 2, this.canvas.height / 2);
        this.enemies    = [];
        this.shadowPiles = [];
        this.healOrbs   = [];

        this.spawnTimer = 0;

        this.loop();
    }

    resize() {
        this.canvas.width  = window.innerWidth;
        this.canvas.height = window.innerHeight;
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
        // Enemy spawning
        this.spawnTimer++;
        if (this.spawnTimer >= ENEMY_SPAWN_FRAMES) {
            this.spawnTimer = 0;
            this.spawnEnemy();
        }

        this.player.update(this.mouseX, this.mouseY, this.shadowPiles, this);
        this.hero.update(this.enemies);

        for (const enemy of this.enemies) {
            enemy.update(this.hero);
        }

        // Dead enemies become ShadowPiles
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.enemies[i].dead) {
                this.shadowPiles.push(new ShadowPile(this.enemies[i].x, this.enemies[i].y));
                this.enemies.splice(i, 1);
            }
        }

        // HealOrb lifecycle
        for (let i = this.healOrbs.length - 1; i >= 0; i--) {
            this.healOrbs[i].update(this.hero);
            if (this.healOrbs[i].collected) {
                this.healOrbs.splice(i, 1);
            }
        }

        this.hero.hp = Math.max(0, this.hero.hp);
    }

    drawLighting() {
        const lc = this.lightCtx;

        // 1. Fill the off-screen canvas with near-opaque black
        lc.clearRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);
        lc.fillStyle = 'rgba(0, 0, 0, 0.93)';
        lc.fillRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);

        // 2. Use destination-out to erase (reveal) the area around the Player,
        //    creating a soft radial light without an extra render pass.
        lc.globalCompositeOperation = 'destination-out';

        const grad = lc.createRadialGradient(
            this.player.x, this.player.y, 0,
            this.player.x, this.player.y, this.player.lightRadius
        );
        grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        lc.fillStyle = grad;
        lc.beginPath();
        lc.arc(this.player.x, this.player.y, this.player.lightRadius, 0, Math.PI * 2);
        lc.fill();

        lc.globalCompositeOperation = 'source-over';

        // 3. Composite the darkness layer on top of everything already drawn
        this.ctx.drawImage(this.lightCanvas, 0, 0);
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Background
        ctx.fillStyle = '#0d0d1a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw all entities before the lighting pass so they sit beneath the dark layer
        for (const pile  of this.shadowPiles) pile.draw(ctx);
        for (const orb   of this.healOrbs)    orb.draw(ctx);
        for (const enemy of this.enemies)     enemy.draw(ctx);
        this.hero.draw(ctx);
        this.player.draw(ctx);

        // Lighting overlay applied last
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
