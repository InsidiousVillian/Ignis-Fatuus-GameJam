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

const ENEMY_BASE_SPEED    = 0.9;
const ENEMY_MAX_HP        = 3;
const ENEMY_SPAWN_FRAMES  = 180;  // starting interval (decreases each wave)
const SPAWN_FRAMES_MIN    = 60;   // hard floor — never faster than this
const SPEED_PER_WAVE      = 0.08; // enemy speed added each wave

const SHADOW_CLEAN_FRAMES = 90;
const HEAL_ORB_LERP       = 0.05;
const HEAL_ORB_VALUE      = 20;
const SCORE_PER_PILE      = 100;

const WAVE_DURATION_FRAMES = 1800; // 30 seconds at 60fps

const GRID_SIZE           = 60;
const GRID_PARALLAX       = 0.04;
const GRID_OPACITY        = 0.07;

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

// ─── Player ───────────────────────────────────────────────────────────────────

class Player {
    constructor(canvas) {
        this.x = canvas.width  / 2;
        this.y = canvas.height / 2;
        this.radius             = PLAYER_RADIUS;
        this.lightRadius        = PLAYER_LIGHT_RADIUS;
        this.currentLightRadius = PLAYER_LIGHT_RADIUS;
    }

    update(mouseX, mouseY, shadowPiles, game) {
        this.x = mouseX;
        this.y = mouseY;

        this.currentLightRadius =
            this.lightRadius + Math.sin(game.time * PULSE_SPEED) * PULSE_AMPLITUDE;

        for (let i = shadowPiles.length - 1; i >= 0; i--) {
            const pile = shadowPiles[i];
            const dist = Math.hypot(this.x - pile.x, this.y - pile.y);

            if (dist < pile.radius + this.radius + 10) {
                pile.hoverFrames++;
                if (pile.hoverFrames >= SHADOW_CLEAN_FRAMES) {
                    game.healOrbs.push(new HealOrb(pile.x, pile.y));
                    game.score += SCORE_PER_PILE;
                    shadowPiles.splice(i, 1);
                }
            } else {
                pile.hoverFrames = 0;
            }
        }
    }

    draw(ctx) {
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
        this.ghostHp     = HERO_MAX_HP;
        this.attackTimer = 0;
        this.state       = 'idle'; // 'idle' | 'wandering' | 'chasing'
        // Wander target: a point near center the Hero drifts toward when idle
        this.wanderX     = x;
        this.wanderY     = y;
        this.wanderTimer = 0;
    }

    // centerX / centerY are the canvas midpoint, used for the wander fallback
    update(enemies, centerX, centerY) {
        this.ghostHp += (this.hp - this.ghostHp) * GHOST_DRAIN_SPEED;

        let nearest     = null;
        let nearestDist = Infinity;

        for (const enemy of enemies) {
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
                if (nearest.hp <= 0) nearest.dead = true;
            }
        }
    }

    // Slow patrol: pick a new random point within ~80px of centre every 3 seconds,
    // then drift toward it at 30% speed. Resets when enemies appear.
    _wander(cx, cy) {
        this.wanderTimer++;
        if (this.wanderTimer >= 180 || Math.hypot(this.x - this.wanderX, this.y - this.wanderY) < 5) {
            this.wanderTimer = 0;
            this.wanderX = cx + (Math.random() - 0.5) * 160;
            this.wanderY = cy + (Math.random() - 0.5) * 160;
        }

        const angle = Math.atan2(this.wanderY - this.y, this.wanderX - this.x);
        const dist  = Math.hypot(this.wanderX - this.x, this.wanderY - this.y);
        if (dist > 4) {
            this.x += Math.cos(angle) * this.speed * 0.3;
            this.y += Math.sin(angle) * this.speed * 0.3;
        }
    }

    heal(amount) {
        this.hp      = Math.min(this.maxHp, this.hp + amount);
        this.ghostHp = Math.min(this.maxHp, this.ghostHp + amount);
    }

    draw(ctx) {
        // Subtle outer ring while wandering — "guard stance" indicator
        if (this.state === 'wandering') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 5, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(126, 207, 255, 0.2)';
            ctx.lineWidth   = 2;
            ctx.stroke();
        }

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
        const barW = 40;
        const barH = 6;
        const bx   = this.x - barW / 2;
        const by   = this.y - this.radius - 16;

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
}

// ─── Enemy ────────────────────────────────────────────────────────────────────

class Enemy {
    // speed is supplied by Game so scaling difficulty is centralised there
    constructor(x, y, speed = ENEMY_BASE_SPEED) {
        this.x      = x;
        this.y      = y;
        this.radius = 12;
        this.speed  = speed;
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

        const speed = Math.hypot(this.x - prevX, this.y - prevY);
        if (speed > 0.4) {
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
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle   = '#4cff91';
        ctx.shadowColor = '#4cff91';
        ctx.shadowBlur  = 20;
        ctx.fill();

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

        // Restart on R key — only active in 'gameover' state
        window.addEventListener('keydown', e => {
            if ((e.key === 'r' || e.key === 'R') && this.gameState === 'gameover') {
                this.restart();
            }
        });

        this._initEntities();
        this.time      = 0;
        this.gameState = 'playing'; // 'playing' | 'gameover'

        this.loop();
    }

    // Separating entity init from constructor makes restart() clean and DRY
    _initEntities() {
        const cx = this.canvas.width  / 2;
        const cy = this.canvas.height / 2;

        this.player      = new Player(this.canvas);
        this.hero        = new Hero(cx, cy);
        this.enemies     = [];
        this.shadowPiles = [];
        this.healOrbs    = [];
        this.particles   = [];

        this.score              = 0;
        this.wave               = 1;
        this.waveTimer          = 0;
        this.spawnTimer         = 0;
        this.currentSpawnFrames = ENEMY_SPAWN_FRAMES;
        this.currentEnemySpeed  = ENEMY_BASE_SPEED;
    }

    restart() {
        this._initEntities();
        this.gameState = 'playing';
        // time keeps running — light pulse never "resets" visually
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

        this.enemies.push(new Enemy(x, y, this.currentEnemySpeed));
    }

    // ── Wave escalation ───────────────────────────────────────────────────────
    // Every WAVE_DURATION_FRAMES the wave increments. The spawn interval shrinks
    // by 15 frames per wave (floored at SPAWN_FRAMES_MIN) and enemy speed grows
    // by SPEED_PER_WAVE. Both values are stored on Game so spawnEnemy() always
    // reads the current difficulty without each Enemy needing game state access.
    _tickWave() {
        this.waveTimer++;
        if (this.waveTimer >= WAVE_DURATION_FRAMES) {
            this.waveTimer = 0;
            this.wave++;
            this.currentSpawnFrames = Math.max(
                SPAWN_FRAMES_MIN,
                this.currentSpawnFrames - 15
            );
            this.currentEnemySpeed += SPEED_PER_WAVE;
        }
    }

    update() {
        this.time++;

        // Simulation is fully frozen on game over; only time ticks (keeps light pulse alive)
        if (this.gameState !== 'playing') return;

        this._tickWave();

        this.spawnTimer++;
        if (this.spawnTimer >= this.currentSpawnFrames) {
            this.spawnTimer = 0;
            this.spawnEnemy();
        }

        this.player.update(this.mouseX, this.mouseY, this.shadowPiles, this);
        this.hero.update(this.enemies, this.canvas.width / 2, this.canvas.height / 2);

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

        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].dead) this.particles.splice(i, 1);
        }

        this.hero.hp = Math.max(0, this.hero.hp);

        // Transition to game over once Hero HP is fully drained
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

    // ── HUD ───────────────────────────────────────────────────────────────────
    // Drawn after the lighting layer so it is never obscured by the darkness overlay.
    drawHUD() {
        const ctx = this.ctx;
        const pad = 22;

        ctx.save();

        // Semi-transparent backing pill for readability against any background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.roundRect(pad - 8, pad - 14, 140, 52, 6);
        ctx.fill();

        ctx.font      = 'bold 13px "Courier New", monospace';
        ctx.fillStyle = 'rgba(200, 220, 255, 0.85)';
        ctx.fillText(`WAVE   ${this.wave}`,          pad, pad);
        ctx.fillText(`SCORE  ${this.score}`,          pad, pad + 22);

        ctx.restore();
    }

    // ── Game Over Overlay ─────────────────────────────────────────────────────
    // Rendered above the HUD, above the frozen game world.
    drawGameOver() {
        const ctx = this.ctx;
        const cx  = this.canvas.width  / 2;
        const cy  = this.canvas.height / 2;

        // Full-screen dark veil
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Title
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.font         = 'bold 56px "Courier New", monospace';
        ctx.fillStyle    = '#e74c3c';
        ctx.shadowColor  = '#e74c3c';
        ctx.shadowBlur   = 28;
        ctx.fillText('GAME OVER', cx, cy - 60);
        ctx.shadowBlur   = 0;

        // Stats
        ctx.font      = 'bold 20px "Courier New", monospace';
        ctx.fillStyle = 'rgba(200, 220, 255, 0.9)';
        ctx.fillText(`Wave Reached: ${this.wave}`, cx, cy);
        ctx.fillText(`Final Score:  ${this.score}`, cx, cy + 34);

        // Restart prompt — gentle pulse using the master time counter
        const alpha = 0.5 + 0.5 * Math.abs(Math.sin(this.time * 0.04));
        ctx.font      = '14px "Courier New", monospace';
        ctx.fillStyle = `rgba(255, 247, 161, ${alpha})`;
        ctx.fillText('PRESS  R  TO  RESTART', cx, cy + 90);

        ctx.restore();
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGrid();

        for (const p     of this.particles)   p.draw(ctx);
        for (const pile  of this.shadowPiles) pile.draw(ctx);
        for (const orb   of this.healOrbs)    orb.draw(ctx);
        for (const enemy of this.enemies)     enemy.draw(ctx);
        this.hero.draw(ctx);
        this.player.draw(ctx);

        this.drawLighting();

        // HUD and overlays sit above the darkness layer
        this.drawHUD();
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
