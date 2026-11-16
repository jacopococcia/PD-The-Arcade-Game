import { audioEngine } from './audio';
import { LEVELS } from './levels';
import { renderGameFrame } from './renderer';
import {
  BounceAwning,
  Cocktail,
  CocktailKind,
  Enemy,
  FloatingText,
  GameScreenState,
  HudSnapshot,
  LevelConfig,
  MovingPlatform,
  Particle,
  Platform,
  Player,
  PowerupItem,
  Projectile,
  QuestionBlock,
} from './types';

const GRAVITY = 1950;
const MOVE_ACCEL = 2350;
const AIR_ACCEL = 1650;
const GROUND_FRICTION = 2100;
const MAX_SPEED = 310;
const SPRINT_SPEED = 395;
const JUMP_VEL = -715;
const AWNING_BOUNCE_VEL = -1040;
const COYOTE_TIME = 0.11;
const JUMP_BUFFER = 0.12;

const COCKTAIL_POINTS: Record<CocktailKind, number> = {
  spritz: 100,
  negroni: 150,
  mojito: 150,
  gin_tonic: 200,
  centerba: 300,
};

const COCKTAIL_LABELS: Record<CocktailKind, string> = {
  spritz: 'SPRITZ',
  negroni: 'NEGRONI',
  mojito: 'MOJITO',
  gin_tonic: 'GIN TONIC',
  centerba: 'CENTERBA!',
};

interface InputState {
  left: boolean;
  right: boolean;
  sprint: boolean;
  jumpHeld: boolean;
  jumpJustPressed: boolean;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private onHudChange: (hud: HudSnapshot) => void;

  private rafId: number | null = null;
  private lastTimestamp = 0;
  private elapsedTime = 0;

  private screen: GameScreenState = 'TITLE_MENU';
  private levelIndex = 0;
  private level: LevelConfig = LEVELS[0];

  private score = 0;
  private highScore = 0;
  private lives = 3;
  private readonly maxLives = 3;
  private combo = 0;
  private comboTimer = 0;
  private levelElapsed = 0;
  private totalCocktailsAllLevels = 0;

  private player!: Player;
  private safeSpawnX = 90;
  private safeSpawnY = 480;

  private questionBlocks: QuestionBlock[] = [];
  private awnings: BounceAwning[] = [];
  private movingPlatforms: MovingPlatform[] = [];
  private cocktails: Cocktail[] = [];
  private powerups: PowerupItem[] = [];
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];

  private cameraX = 0;
  private shakeTimer = 0;
  private shakeIntensity = 0;
  private hitstopTimer = 0;
  private goalLockedCooldown = 0;
  private goalReachedHintTimer = 0;

  private lastLevelStats = {
    cocktailsCollected: 0,
    cocktailsRequired: 0,
    timeBonus: 0,
    stars: 3,
  };

  private input: InputState = {
    left: false,
    right: false,
    sprint: false,
    jumpHeld: false,
    jumpJustPressed: false,
  };

  private touchInput = {
    left: false,
    right: false,
    jump: false,
  };

  private keysDown = new Set<string>();
  private lastHudKey = '';

  constructor(canvas: HTMLCanvasElement, onHudChange: (hud: HudSnapshot) => void) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not initialize 2D canvas context');
    }
    this.ctx = context;
    this.onHudChange = onHudChange;

    try {
      const saved = localStorage.getItem('paglieta_sindaco_highscore');
      if (saved) this.highScore = parseInt(saved, 10) || 0;
    } catch {
      // Ignore storage access issues
    }

    // Pre-allocate pools
    for (let i = 0; i < 160; i++) {
      this.particles.push({
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 3,
        color: '#fff',
        alpha: 1,
        life: 0,
        maxLife: 1,
        gravity: 300,
        active: false,
      });
    }
    for (let i = 0; i < 32; i++) {
      this.floatingTexts.push({
        x: 0,
        y: 0,
        vy: -50,
        text: '',
        color: '#fff',
        life: 0,
        maxLife: 1,
        active: false,
      });
    }

    this.loadLevel(0, false);
    this.bindEvents();
    this.handleResize();
    this.emitHud(true);
  }

  public startLoop(): void {
    if (this.rafId !== null) return;
    this.lastTimestamp = performance.now();
    const tick = (now: number) => {
      const rawDt = (now - this.lastTimestamp) / 1000;
      this.lastTimestamp = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.05);

      this.update(dt);
      this.render();

      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  public destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.unbindEvents();
  }

  public startNewGame(startLevel = 0): void {
    this.score = 0;
    this.lives = this.maxLives;
    this.totalCocktailsAllLevels = 0;
    this.loadLevel(startLevel, false);
    this.screen = 'PLAYING';
    this.emitHud(true);
  }

  public restartCurrentLevel(): void {
    this.lives = this.maxLives;
    this.loadLevel(this.levelIndex, this.player?.hasShield ?? false);
    this.screen = 'PLAYING';
    this.emitHud(true);
  }

  public nextLevel(): void {
    if (this.levelIndex + 1 < LEVELS.length) {
      const keepShield = this.player.hasShield;
      this.loadLevel(this.levelIndex + 1, keepShield);
      this.screen = 'PLAYING';
      this.emitHud(true);
    } else {
      this.screen = 'VICTORY';
      this.emitHud(true);
    }
  }

  public togglePause(): void {
    if (this.screen === 'PLAYING') {
      this.screen = 'PAUSED';
      this.clearAllInputs();
      this.emitHud(true);
    } else if (this.screen === 'PAUSED') {
      this.screen = 'PLAYING';
      this.emitHud(true);
    }
  }

  public returnToTitle(): void {
    this.screen = 'TITLE_MENU';
    this.clearAllInputs();
    this.loadLevel(0, false);
    this.emitHud(true);
  }

  public toggleMute(): void {
    audioEngine.toggleMute();
    this.emitHud(true);
  }

  public setTouchButton(btn: 'left' | 'right' | 'jump', pressed: boolean): void {
    if (btn === 'jump' && pressed && !this.touchInput.jump) {
      this.input.jumpJustPressed = true;
    }
    this.touchInput[btn] = pressed;
  }

  private loadLevel(index: number, keepShield: boolean): void {
    this.levelIndex = Math.max(0, Math.min(index, LEVELS.length - 1));
    this.level = LEVELS[this.levelIndex];
    this.combo = 0;
    this.comboTimer = 0;
    this.levelElapsed = 0;
    this.hitstopTimer = 0;
    this.shakeTimer = 0;
    this.goalLockedCooldown = 0;
    this.goalReachedHintTimer = 0;

    this.safeSpawnX = this.level.spawnX;
    this.safeSpawnY = this.level.spawnY;

    this.player = {
      x: this.level.spawnX,
      y: this.level.spawnY,
      w: 30,
      h: 46,
      vx: 0,
      vy: 0,
      facing: 1,
      grounded: false,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      invulnTimer: 0,
      hitFlashTimer: 0,
      hasShield: keepShield,
      scaleX: 1,
      scaleY: 1,
      runPhase: 0,
      onMovingPlatform: null,
    };

    this.questionBlocks = this.level.questionBlocks.map((q) => ({
      ...q,
      hit: false,
      bumpOffset: 0,
    }));

    this.awnings = this.level.awnings.map((a) => ({
      ...a,
      bouncePhase: 0,
    }));

    this.movingPlatforms = this.level.movingPlatforms.map((mp) => ({
      ...mp,
      x: mp.startX,
      y: mp.startY,
      prevX: mp.startX,
      prevY: mp.startY,
      progress: 0,
      direction: 1,
    }));

    this.cocktails = this.level.cocktails.map((c, idx) => ({
      ...c,
      collected: false,
      bobOffset: idx * 0.85,
    }));

    this.powerups = [];
    this.projectiles = [];

    this.enemies = this.level.enemies.map((e, idx) => ({
      ...e,
      vy: 0,
      aiState: 'patrol',
      stateTimer: 1.5 + idx * 0.4,
      hitFlash: 0,
      squashTimer: 0,
      shoutTimer: 0.8 + (idx % 3) * 0.7,
      walkPhase: idx * 1.2,
    }));

    for (const pt of this.particles) pt.active = false;
    for (const ft of this.floatingTexts) ft.active = false;

    this.cameraX = 0;
  }

  private update(dt: number): void {
    this.elapsedTime += dt;

    // On Title screen, smoothly pan camera across Paglieta
    if (this.screen === 'TITLE_MENU') {
      const viewW = this.getLogicalViewWidth();
      const maxCam = Math.max(0, this.level.width - viewW);
      this.cameraX = (Math.sin(this.elapsedTime * 0.18 - Math.PI / 2) * 0.5 + 0.5) * Math.min(maxCam, 950);
      return;
    }

    if (this.screen !== 'PLAYING') {
      return;
    }

    // Hitstop freeze frame for juicy impacts
    if (this.hitstopTimer > 0) {
      this.hitstopTimer -= dt;
      this.updateShake(dt);
      return;
    }

    this.levelElapsed += dt;
    if (this.goalLockedCooldown > 0) this.goalLockedCooldown -= dt;
    if (this.goalReachedHintTimer > 0) this.goalReachedHintTimer -= dt;

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 0;
    }

    this.syncInputFlags();
    this.updateMovingPlatforms(dt);
    this.updateQuestionBlocks(dt);
    this.updateAwnings(dt);
    this.updatePlayer(dt);
    this.updatePowerups(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.checkCocktailPickups();
    this.checkGoalArch();
    this.updateParticles(dt);
    this.updateFloatingTexts(dt);
    this.updateCamera(dt);
    this.updateShake(dt);

    this.input.jumpJustPressed = false;
    this.emitHud(false);
  }

  private syncInputFlags(): void {
    this.input.left =
      this.keysDown.has('ArrowLeft') || this.keysDown.has('KeyA') || this.touchInput.left;
    this.input.right =
      this.keysDown.has('ArrowRight') || this.keysDown.has('KeyD') || this.touchInput.right;
    this.input.sprint =
      this.keysDown.has('ShiftLeft') || this.keysDown.has('ShiftRight');
    this.input.jumpHeld =
      this.keysDown.has('Space') ||
      this.keysDown.has('ArrowUp') ||
      this.keysDown.has('KeyW') ||
      this.touchInput.jump;
  }

  private updateMovingPlatforms(dt: number): void {
    for (const mp of this.movingPlatforms) {
      mp.prevX = mp.x;
      mp.prevY = mp.y;
      const dx = mp.endX - mp.startX;
      const dy = mp.endY - mp.startY;
      const dist = Math.hypot(dx, dy) || 1;
      mp.progress += (mp.speed / dist) * dt * mp.direction;
      if (mp.progress >= 1) {
        mp.progress = 1;
        mp.direction = -1;
      } else if (mp.progress <= 0) {
        mp.progress = 0;
        mp.direction = 1;
      }
      // Smoothstep easing near ends
      const t = mp.progress * mp.progress * (3 - 2 * mp.progress);
      mp.x = mp.startX + dx * t;
      mp.y = mp.startY + dy * t;
    }
  }

  private updateQuestionBlocks(dt: number): void {
    for (const qb of this.questionBlocks) {
      if (qb.bumpOffset < 0) {
        qb.bumpOffset = Math.min(0, qb.bumpOffset + 75 * dt);
      }
    }
  }

  private updateAwnings(dt: number): void {
    for (const aw of this.awnings) {
      if (aw.bouncePhase > 0) {
        aw.bouncePhase = Math.max(0, aw.bouncePhase - dt * 3.5);
      }
    }
  }

  private updatePlayer(dt: number): void {
    const p = this.player;

    if (p.invulnTimer > 0) p.invulnTimer -= dt;
    if (p.hitFlashTimer > 0) p.hitFlashTimer -= dt;

    // Recover squash & stretch smoothly
    p.scaleX += (1 - p.scaleX) * Math.min(1, dt * 14);
    p.scaleY += (1 - p.scaleY) * Math.min(1, dt * 14);

    // Ride moving platform delta
    if (p.grounded && p.onMovingPlatform) {
      p.x += p.onMovingPlatform.x - p.onMovingPlatform.prevX;
      p.y += p.onMovingPlatform.y - p.onMovingPlatform.prevY;
    }

    // Horizontal Movement
    const dir = (this.input.right ? 1 : 0) - (this.input.left ? 1 : 0);
    const maxV = this.input.sprint ? SPRINT_SPEED : MAX_SPEED;
    const accel = p.grounded ? MOVE_ACCEL : AIR_ACCEL;

    if (dir !== 0) {
      p.facing = dir as 1 | -1;
      p.vx += dir * accel * dt;
      if (Math.abs(p.vx) > maxV) {
        p.vx = Math.sign(p.vx) * maxV;
      }
      if (p.grounded) {
        p.runPhase += dt * (this.input.sprint ? 19 : 14);
      }
    } else {
      const friction = p.grounded ? GROUND_FRICTION : GROUND_FRICTION * 0.45;
      if (Math.abs(p.vx) <= friction * dt) {
        p.vx = 0;
      } else {
        p.vx -= Math.sign(p.vx) * friction * dt;
      }
    }

    // Coyote time & Jump Buffer
    if (p.grounded) {
      p.coyoteTimer = COYOTE_TIME;
    } else {
      p.coyoteTimer = Math.max(0, p.coyoteTimer - dt);
    }

    if (this.input.jumpJustPressed) {
      p.jumpBufferTimer = JUMP_BUFFER;
    } else {
      p.jumpBufferTimer = Math.max(0, p.jumpBufferTimer - dt);
    }

    if (p.jumpBufferTimer > 0 && p.coyoteTimer > 0) {
      p.vy = JUMP_VEL;
      p.grounded = false;
      p.coyoteTimer = 0;
      p.jumpBufferTimer = 0;
      p.onMovingPlatform = null;
      p.scaleX = 0.78;
      p.scaleY = 1.26;
      this.spawnBurst(p.x + p.w / 2, p.y + p.h, '#FDE68A', 6, 90);
      audioEngine.playJump();
    }

    // Variable jump height on release
    if (!this.input.jumpHeld && p.vy < -220) {
      p.vy += GRAVITY * 1.45 * dt;
    }

    // Apply Gravity
    p.vy = Math.min(1050, p.vy + GRAVITY * dt);

    // Move X & Resolve Solid Horizontal Collisions
    p.x += p.vx * dt;
    p.x = Math.max(0, Math.min(p.x, this.level.width - p.w));

    const solids = this.getSolidObstacles();
    for (const s of solids) {
      if (this.aabb(p.x, p.y, p.w, p.h, s.x, s.y, s.w, s.h)) {
        if (p.vx > 0) {
          p.x = s.x - p.w;
          p.vx = 0;
        } else if (p.vx < 0) {
          p.x = s.x + s.w;
          p.vx = 0;
        }
      }
    }

    // Move Y & Resolve Vertical Collisions
    const prevBottom = p.y + p.h;
    const prevTop = p.y;
    const wasGrounded = p.grounded;
    p.y += p.vy * dt;
    p.grounded = false;
    p.onMovingPlatform = null;

    // 1. Check bouncy café awnings first when falling
    if (p.vy >= 0) {
      for (const aw of this.awnings) {
        if (
          p.x + p.w > aw.x + 4 &&
          p.x < aw.x + aw.w - 4 &&
          prevBottom <= aw.y + 14 &&
          p.y + p.h >= aw.y
        ) {
          p.y = aw.y - p.h;
          p.vy = AWNING_BOUNCE_VEL;
          p.scaleX = 0.72;
          p.scaleY = 1.36;
          aw.bouncePhase = 1;
          this.spawnBurst(p.x + p.w / 2, aw.y, '#FCA5A5', 10, 140);
          audioEngine.playAwningBounce();
          break;
        }
      }
    }

    // 2. Solid platforms & Question Blocks
    for (const s of solids) {
      if (this.aabb(p.x, p.y, p.w, p.h, s.x, s.y, s.w, s.h)) {
        if (p.vy >= 0 && prevBottom <= s.y + 18) {
          p.y = s.y - p.h;
          if (!wasGrounded && p.vy > 260) {
            p.scaleX = 1.24;
            p.scaleY = 0.78;
            this.spawnBurst(p.x + p.w / 2, s.y, '#E7D8C3', 5, 70);
          }
          p.vy = 0;
          p.grounded = true;
          if (s.kind === 'ground') {
            this.safeSpawnX = Math.max(s.x + 20, Math.min(p.x, s.x + s.w - p.w - 20));
            this.safeSpawnY = s.y - p.h - 2;
          }
        } else if (p.vy < 0 && prevTop >= s.y + s.h - 18) {
          p.y = s.y + s.h;
          p.vy = 40;
          if (s.qbRef) {
            this.triggerQuestionBlock(s.qbRef);
          } else {
            audioEngine.playBrickBump();
          }
        }
      }
    }

    // 3. One-way balconies
    if (p.vy >= 0) {
      for (const plat of this.level.platforms) {
        if (!plat.oneWay) continue;
        if (
          p.x + p.w > plat.x + 2 &&
          p.x < plat.x + plat.w - 2 &&
          prevBottom <= plat.y + 10 &&
          p.y + p.h >= plat.y
        ) {
          p.y = plat.y - p.h;
          if (!wasGrounded && p.vy > 240) {
            p.scaleX = 1.2;
            p.scaleY = 0.82;
          }
          p.vy = 0;
          p.grounded = true;
        }
      }

      // 4. Moving platforms (one-way landing)
      for (const mp of this.movingPlatforms) {
        if (
          p.x + p.w > mp.x + 2 &&
          p.x < mp.x + mp.w - 2 &&
          prevBottom <= mp.y + 14 &&
          p.y + p.h >= mp.y
        ) {
          p.y = mp.y - p.h;
          p.vy = 0;
          p.grounded = true;
          p.onMovingPlatform = mp;
        }
      }
    }

    // 5. Pit fall check
    if (p.y > this.level.height + 70) {
      this.handlePitFall();
    }
  }

  private getSolidObstacles(): Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    kind: Platform['kind'] | 'qblock';
    qbRef?: QuestionBlock;
  }> {
    const list: Array<{
      x: number;
      y: number;
      w: number;
      h: number;
      kind: Platform['kind'] | 'qblock';
      qbRef?: QuestionBlock;
    }> = [];
    for (const plat of this.level.platforms) {
      if (!plat.oneWay) {
        list.push({ x: plat.x, y: plat.y, w: plat.w, h: plat.h, kind: plat.kind });
      }
    }
    for (const qb of this.questionBlocks) {
      list.push({ x: qb.x, y: qb.y, w: qb.w, h: qb.h, kind: 'qblock', qbRef: qb });
    }
    return list;
  }

  private triggerQuestionBlock(qb: QuestionBlock): void {
    if (qb.hit) {
      audioEngine.playBrickBump();
      return;
    }
    qb.hit = true;
    qb.bumpOffset = -10;
    audioEngine.playBrickBump();
    audioEngine.playPowerup();
    this.spawnBurst(qb.x + qb.w / 2, qb.y, '#FDE047', 10, 130);

    this.powerups.push({
      id: `pu_${qb.id}`,
      x: qb.x + 5,
      y: qb.y - 30,
      vx: qb.reward === 'shield' ? 80 : 0,
      vy: -240,
      kind: qb.reward,
      collected: false,
    });
  }

  private updatePowerups(dt: number): void {
    const p = this.player;
    for (const pu of this.powerups) {
      if (pu.collected) continue;
      pu.vy = Math.min(700, pu.vy + 1100 * dt);
      pu.x += pu.vx * dt;
      pu.y += pu.vy * dt;

      // Bounce lightly on solid ground/platforms
      for (const plat of this.level.platforms) {
        if (this.aabb(pu.x, pu.y, 28, 28, plat.x, plat.y, plat.w, plat.h)) {
          if (pu.vy > 0 && pu.y + 28 - pu.vy * dt <= plat.y + 12) {
            pu.y = plat.y - 28;
            pu.vy = 0;
          }
        }
      }

      if (this.aabb(p.x, p.y, p.w, p.h, pu.x, pu.y, 28, 28)) {
        pu.collected = true;
        audioEngine.playPowerup();
        if (pu.kind === 'shield') {
          p.hasShield = true;
          this.score += 200;
          this.spawnFloatingText(pu.x + 14, pu.y, 'SCUDO ESPRESSO!', '#34D399');
          this.spawnBurst(pu.x + 14, pu.y + 14, '#34D399', 14, 160);
        } else {
          this.score += 250;
          this.spawnFloatingText(pu.x + 14, pu.y, '+250 SPRITZ DORATO!', '#FBBF24');
          this.spawnBurst(pu.x + 14, pu.y + 14, '#FBBF24', 14, 160);
        }
      }
    }
  }

  private updateEnemies(dt: number): void {
    const p = this.player;
    const pCx = p.x + p.w / 2;
    const pCy = p.y + p.h / 2;
    const prevPlayerBottom = p.y + p.h - p.vy * dt;

    for (const e of this.enemies) {
      if (e.hitFlash > 0) e.hitFlash -= dt;

      if (e.aiState === 'squashed') {
        e.squashTimer -= dt;
        continue;
      }

      // Shout bubble cycling
      e.shoutTimer -= dt;
      if (e.shoutTimer < -2.4) {
        e.shoutTimer = 1.6;
      }

      const eCx = e.x + e.w / 2;
      const eCy = e.y + e.h / 2;
      const distX = pCx - eCx;
      const distY = Math.abs(pCy - eCy);

      // AI State Machine with clear Windup Telegraphs
      if (
        e.kind === 'charger' ||
        e.kind === 'councilor_boss' ||
        e.kind === 'tifoso' ||
        e.kind === 'armed_purger'
      ) {
        if (e.aiState === 'patrol') {
          e.x += e.vx * dt;
          e.walkPhase += dt * (e.kind === 'tifoso' || e.kind === 'armed_purger' ? 13 : 10);
          if (e.x <= e.minX) {
            e.x = e.minX;
            e.vx = Math.abs(e.baseSpeed);
            e.facing = 1;
          } else if (e.x >= e.maxX) {
            e.x = e.maxX;
            e.vx = -Math.abs(e.baseSpeed);
            e.facing = -1;
          }

          // Detect Mayor on horizontal sightline -> Windup!
          if (Math.abs(distX) < 270 && distY < 62) {
            e.aiState = 'windup';
            e.stateTimer = e.kind === 'tifoso' || e.kind === 'armed_purger' ? 0.4 : 0.48;
            e.facing = distX >= 0 ? 1 : -1;
            e.vx = 0;
            audioEngine.playWindup();
          }
        } else if (e.aiState === 'windup') {
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) {
            e.aiState = 'charge';
            e.stateTimer = 0.95;
            const chargeSpd =
              e.kind === 'councilor_boss'
                ? 285
                : e.kind === 'armed_purger'
                  ? 265
                  : e.kind === 'tifoso'
                    ? 255
                    : 235;
            e.vx = e.facing * chargeSpd;
          }
        } else if (e.aiState === 'charge') {
          e.x += e.vx * dt;
          e.walkPhase += dt * 20;
          e.stateTimer -= dt;
          if (e.x <= e.minX || e.x >= e.maxX || e.stateTimer <= 0) {
            e.x = Math.max(e.minX, Math.min(e.x, e.maxX));
            e.aiState = 'cooldown';
            e.stateTimer = 0.65;
            e.vx = 0;
          }
        } else if (e.aiState === 'cooldown') {
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) {
            e.aiState = 'patrol';
            e.vx = e.facing * e.baseSpeed;
          }
        }
      } else if (e.kind === 'flyer_thrower' || e.kind === 'vandal' || e.kind === 'drunk_citizen') {
        if (e.aiState === 'patrol') {
          const wobble = e.kind === 'drunk_citizen' ? 0.6 + 0.5 * Math.sin(this.elapsedTime * 5 + e.x * 0.02) : 1;
          e.x += e.vx * wobble * dt;
          e.walkPhase += dt * (e.kind === 'drunk_citizen' ? 6 : 7);
          if (e.x <= e.minX) {
            e.x = e.minX;
            e.vx = Math.abs(e.baseSpeed);
            e.facing = 1;
          } else if (e.x >= e.maxX) {
            e.x = e.maxX;
            e.vx = -Math.abs(e.baseSpeed);
            e.facing = -1;
          }
          if (e.kind !== 'drunk_citizen') {
            e.facing = distX >= 0 ? 1 : -1;
          }
          e.stateTimer -= dt;
          if (e.stateTimer <= 0 && Math.abs(distX) < 430) {
            e.aiState = 'windup';
            e.stateTimer = e.kind === 'drunk_citizen' ? 0.55 : 0.45;
            audioEngine.playWindup();
          }
        } else if (e.aiState === 'windup') {
          if (e.kind !== 'drunk_citizen') {
            e.facing = distX >= 0 ? 1 : -1;
          }
          e.stateTimer -= dt;
          if (e.stateTimer <= 0) {
            if (e.kind === 'drunk_citizen') {
              // Vomits a cartoonish green arc that puddles on the street
              this.projectiles.push({
                x: eCx + e.facing * 12,
                y: e.y + 14,
                vx: e.facing * 115,
                vy: -140,
                radius: 7,
                kind: 'vomit_arc',
                active: true,
                rotation: 0,
              });
              this.spawnBurst(eCx + e.facing * 14, e.y + 14, '#84CC16', 6, 80);
              e.stateTimer = 2.6;
            } else if (e.kind === 'vandal') {
              // Lobs a spinning glass bottle / firecracker
              this.projectiles.push({
                x: eCx + e.facing * 14,
                y: e.y + 16,
                vx: e.facing * 225,
                vy: -330,
                radius: 8,
                kind: 'bottle',
                active: true,
                rotation: 0,
              });
              e.stateTimer = 2.0;
            } else {
              // Standard flyer thrower
              this.projectiles.push({
                x: eCx + e.facing * 14,
                y: e.y + 16,
                vx: e.facing * 205,
                vy: -310,
                radius: 8,
                kind: 'flyer',
                active: true,
                rotation: 0,
              });
              e.stateTimer = 2.1;
            }
            e.aiState = 'patrol';
          }
        }
      } else {
        // Standard Protester patrol
        e.x += e.vx * dt;
        e.walkPhase += dt * 10;
        if (e.x <= e.minX) {
          e.x = e.minX;
          e.vx = Math.abs(e.baseSpeed);
          e.facing = 1;
        } else if (e.x >= e.maxX) {
          e.x = e.maxX;
          e.vx = -Math.abs(e.baseSpeed);
          e.facing = -1;
        }
      }

      // Check Player <-> Enemy Collision
      if (this.aabb(p.x + 2, p.y + 2, p.w - 4, p.h - 2, e.x + 2, e.y + 2, e.w - 4, e.h - 2)) {
        const isStomp = p.vy > 30 && prevPlayerBottom <= e.y + e.h * 0.58;
        if (isStomp) {
          this.handleStompEnemy(e);
        } else if (p.invulnTimer <= 0) {
          this.damagePlayer(eCx);
        }
      }
    }

    this.enemies = this.enemies.filter((e) => !(e.aiState === 'squashed' && e.squashTimer <= 0));
  }

  private handleStompEnemy(e: Enemy): void {
    const p = this.player;
    e.hp -= 1;
    e.hitFlash = 0.25;
    p.vy = this.input.jumpHeld ? -660 : -510;
    p.grounded = false;
    p.scaleX = 1.28;
    p.scaleY = 0.74;

    this.hitstopTimer = 0.045;
    this.triggerShake(5.5, 0.16);
    audioEngine.playStomp();
    this.spawnBurst(e.x + e.w / 2, e.y + 10, '#FCA5A5', 12, 175);

    if (e.hp <= 0) {
      e.aiState = 'squashed';
      e.squashTimer = 0.35;
      const pts = e.kind === 'councilor_boss' ? 500 : 150;
      this.score += pts;
      this.spawnFloatingText(e.x + e.w / 2, e.y - 8, `+${pts}`, '#FDE047');
    } else {
      // Boss knocked into rage windup
      e.aiState = 'windup';
      e.stateTimer = 0.45;
      this.spawnFloatingText(e.x + e.w / 2, e.y - 12, 'COLPITO!', '#FB923C');
    }
  }

  private updateProjectiles(dt: number): void {
    const p = this.player;
    for (const pr of this.projectiles) {
      if (!pr.active) continue;

      if (pr.kind === 'vomit_puddle') {
        pr.ttl = (pr.ttl ?? 3.0) - dt;
        if (pr.ttl <= 0) {
          pr.active = false;
          continue;
        }
        if (
          p.invulnTimer <= 0 &&
          this.aabb(p.x + 4, p.y + p.h - 12, p.w - 8, 12, pr.x - 18, pr.y - 6, 36, 10)
        ) {
          pr.active = false;
          this.spawnBurst(pr.x, pr.y, '#84CC16', 8, 110);
          this.damagePlayer(pr.x);
        }
        continue;
      }

      pr.vy += 680 * dt;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;
      pr.rotation += dt * 9;

      // Ground impact for vomit_arc (creates puddle) and bottle (shatters into sparks)
      if (pr.kind === 'vomit_arc' || pr.kind === 'bottle') {
        let hitGroundY: number | null = null;
        for (const plat of this.level.platforms) {
          if (
            pr.x >= plat.x + 6 &&
            pr.x <= plat.x + plat.w - 6 &&
            pr.y + pr.radius >= plat.y &&
            pr.y - pr.vy * dt <= plat.y + 14 &&
            pr.vy > 0
          ) {
            hitGroundY = plat.y;
            break;
          }
        }
        if (hitGroundY !== null) {
          if (pr.kind === 'vomit_arc') {
            pr.kind = 'vomit_puddle';
            pr.y = hitGroundY - 2;
            pr.vx = 0;
            pr.vy = 0;
            pr.ttl = 3.2;
            continue;
          } else {
            pr.active = false;
            this.spawnBurst(pr.x, hitGroundY - 4, '#F59E0B', 10, 140);
            this.spawnBurst(pr.x, hitGroundY - 4, '#FEF08A', 5, 110);
            continue;
          }
        }
      }

      if (pr.y > this.level.height + 40) {
        pr.active = false;
        continue;
      }

      if (
        p.invulnTimer <= 0 &&
        this.aabb(p.x + 3, p.y + 3, p.w - 6, p.h - 6, pr.x - pr.radius, pr.y - pr.radius, pr.radius * 2, pr.radius * 2)
      ) {
        pr.active = false;
        this.spawnBurst(pr.x, pr.y, pr.kind === 'vomit_arc' ? '#84CC16' : '#EF4444', 8, 120);
        this.damagePlayer(pr.x);
      }
    }
    this.projectiles = this.projectiles.filter((pr) => pr.active);
  }

  private checkCocktailPickups(): void {
    const p = this.player;
    for (const c of this.cocktails) {
      if (c.collected) continue;
      if (this.aabb(p.x - 2, p.y - 2, p.w + 4, p.h + 4, c.x - 16, c.y - 18, 32, 36)) {
        c.collected = true;
        this.combo += 1;
        this.comboTimer = 3.2;

        const basePts = COCKTAIL_POINTS[c.kind];
        const mult = Math.min(3, 1 + Math.floor((this.combo - 1) / 2));
        const earned = basePts * mult;
        this.score += earned;
        this.totalCocktailsAllLevels += 1;
        this.saveHighScore();

        audioEngine.playCocktail(this.combo);
        this.spawnBurst(c.x, c.y, '#FDBA74', 12, 160);
        const label =
          mult > 1
            ? `+${earned} ${COCKTAIL_LABELS[c.kind]} x${mult}`
            : `+${earned} ${COCKTAIL_LABELS[c.kind]}`;
        this.spawnFloatingText(c.x, c.y - 16, label, '#FEF08A');
      }
    }
  }

  private checkGoalArch(): void {
    const p = this.player;
    const cx = p.x + p.w / 2;
    const bottom = p.y + p.h;
    if (Math.abs(cx - this.level.goalX) < 38 && bottom >= this.level.goalY - 125) {
      const collected = this.cocktails.filter((c) => c.collected && c.required).length;
      const required = this.cocktails.filter((c) => c.required).length;

      if (collected >= required) {
        const timeBonus = Math.max(0, Math.round((this.level.parTimeSeconds - this.levelElapsed) * 15));
        this.score += timeBonus;
        this.saveHighScore();

        const stars =
          this.lives === this.maxLives && timeBonus > 120
            ? 3
            : this.lives >= 2 || timeBonus > 40
              ? 2
              : 1;

        this.lastLevelStats = {
          cocktailsCollected: collected,
          cocktailsRequired: required,
          timeBonus,
          stars,
        };

        this.clearAllInputs();
        if (this.levelIndex + 1 >= LEVELS.length) {
          this.screen = 'VICTORY';
          audioEngine.playVictory();
        } else {
          this.screen = 'LEVEL_CLEAR';
          audioEngine.playLevelClear();
        }
        this.emitHud(true);
      } else {
        this.goalReachedHintTimer = 2.0;
        if (this.goalLockedCooldown <= 0) {
          this.goalLockedCooldown = 1.6;
          audioEngine.playGoalLocked();
          this.spawnFloatingText(
            this.level.goalX,
            this.level.goalY - 148,
            `Mancano ${required - collected} cocktail!`,
            '#FCD34D'
          );
        }
      }
    }
  }

  private damagePlayer(sourceX: number): void {
    const p = this.player;
    this.combo = 0;
    this.comboTimer = 0;

    if (p.hasShield) {
      p.hasShield = false;
      p.invulnTimer = 1.65;
      p.hitFlashTimer = 0.25;
      p.vy = -380;
      p.vx = p.x + p.w / 2 < sourceX ? -240 : 240;
      this.hitstopTimer = 0.06;
      this.triggerShake(7.5, 0.22);
      audioEngine.playHit();
      this.spawnFloatingText(p.x + p.w / 2, p.y - 10, 'SCUDO ROTTO!', '#6EE7B7');
      return;
    }

    this.lives -= 1;
    p.invulnTimer = 1.9;
    p.hitFlashTimer = 0.3;
    p.vy = -420;
    p.vx = p.x + p.w / 2 < sourceX ? -250 : 250;
    this.hitstopTimer = 0.075;
    this.triggerShake(10, 0.28);
    audioEngine.playHit();
    this.spawnBurst(p.x + p.w / 2, p.y + p.h / 2, '#EF4444', 14, 180);

    if (this.lives <= 0) {
      this.lives = 0;
      this.clearAllInputs();
      this.screen = 'GAME_OVER';
      audioEngine.playGameOver();
      this.emitHud(true);
    } else {
      this.spawnFloatingText(p.x + p.w / 2, p.y - 10, 'AHI!', '#FCA5A5');
    }
  }

  private handlePitFall(): void {
    this.combo = 0;
    this.lives -= 1;
    this.triggerShake(9, 0.25);
    audioEngine.playHit();

    if (this.lives <= 0) {
      this.lives = 0;
      this.clearAllInputs();
      this.screen = 'GAME_OVER';
      audioEngine.playGameOver();
      this.emitHud(true);
    } else {
      this.player.x = this.safeSpawnX;
      this.player.y = this.safeSpawnY;
      this.player.vx = 0;
      this.player.vy = 0;
      this.player.invulnTimer = 1.8;
      this.spawnFloatingText(this.safeSpawnX + 15, this.safeSpawnY - 12, '-1 VITA', '#FCA5A5');
    }
  }

  private spawnBurst(x: number, y: number, color: string, count: number, speed: number): void {
    let spawned = 0;
    for (const pt of this.particles) {
      if (pt.active) continue;
      const angle = Math.random() * Math.PI * 2;
      const spd = (0.35 + Math.random() * 0.75) * speed;
      pt.x = x;
      pt.y = y;
      pt.vx = Math.cos(angle) * spd;
      pt.vy = Math.sin(angle) * spd - 45;
      pt.size = 2.5 + Math.random() * 3.5;
      pt.color = color;
      pt.life = 0.35 + Math.random() * 0.3;
      pt.maxLife = pt.life;
      pt.alpha = 1;
      pt.gravity = 420;
      pt.active = true;
      spawned += 1;
      if (spawned >= count) break;
    }
  }

  private spawnFloatingText(x: number, y: number, text: string, color: string): void {
    for (const ft of this.floatingTexts) {
      if (ft.active) continue;
      ft.x = x;
      ft.y = y;
      ft.vy = -52;
      ft.text = text;
      ft.color = color;
      ft.life = 0.95;
      ft.maxLife = 0.95;
      ft.active = true;
      break;
    }
  }

  private updateParticles(dt: number): void {
    for (const pt of this.particles) {
      if (!pt.active) continue;
      pt.life -= dt;
      if (pt.life <= 0) {
        pt.active = false;
        continue;
      }
      pt.vy += pt.gravity * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.alpha = pt.life / pt.maxLife;
    }
  }

  private updateFloatingTexts(dt: number): void {
    for (const ft of this.floatingTexts) {
      if (!ft.active) continue;
      ft.life -= dt;
      if (ft.life <= 0) {
        ft.active = false;
        continue;
      }
      ft.y += ft.vy * dt;
    }
  }

  private updateCamera(dt: number): void {
    const viewW = this.getLogicalViewWidth();
    const targetX = this.player.x + this.player.w / 2 - viewW * 0.38;
    const maxCam = Math.max(0, this.level.width - viewW);
    const clamped = Math.max(0, Math.min(targetX, maxCam));
    this.cameraX += (clamped - this.cameraX) * Math.min(1, dt * 8.5);
  }

  private triggerShake(intensity: number, duration: number): void {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeTimer = Math.max(this.shakeTimer, duration);
  }

  private updateShake(dt: number): void {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) {
        this.shakeIntensity = 0;
      }
    }
  }

  private getLogicalViewWidth(): number {
    const dpr = window.devicePixelRatio || 1;
    const cssW = this.canvas.width / dpr;
    const cssH = this.canvas.height / dpr;
    const scale = cssH / this.level.height;
    return scale > 0 ? cssW / scale : 1138;
  }

  private render(): void {
    const dpr = window.devicePixelRatio || 1;
    const viewW = this.canvas.width / dpr;
    const viewH = this.canvas.height / dpr;

    this.ctx.save();
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const shakeMag = this.shakeTimer > 0 ? this.shakeIntensity * (this.shakeTimer / 0.25) : 0;
    const shakeX = shakeMag > 0 ? (Math.random() - 0.5) * 2 * shakeMag : 0;
    const shakeY = shakeMag > 0 ? (Math.random() - 0.5) * 2 * shakeMag : 0;

    const cocktailsCollected = this.cocktails.filter((c) => c.collected && c.required).length;
    const cocktailsRequired = this.cocktails.filter((c) => c.required).length;

    renderGameFrame({
      ctx: this.ctx,
      viewW,
      viewH,
      cameraX: this.cameraX,
      shakeX,
      shakeY,
      time: this.elapsedTime,
      level: this.level,
      player: this.player,
      questionBlocks: this.questionBlocks,
      awnings: this.awnings,
      movingPlatforms: this.movingPlatforms,
      cocktails: this.cocktails,
      powerups: this.powerups,
      enemies: this.enemies,
      projectiles: this.projectiles,
      particles: this.particles,
      floatingTexts: this.floatingTexts,
      cocktailsCollected,
      cocktailsRequired,
    });

    this.ctx.restore();
  }

  private saveHighScore(): void {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('paglieta_sindaco_highscore', String(this.highScore));
      } catch {
        // Ignore storage errors
      }
    }
  }

  private emitHud(force: boolean): void {
    const cocktailsCollected = this.cocktails.filter((c) => c.collected && c.required).length;
    const cocktailsRequired = this.cocktails.filter((c) => c.required).length;
    const sec = Math.floor(this.levelElapsed);

    // Direction of nearest uncollected cocktail if near goal or missing
    let missingDirection: -1 | 0 | 1 = 0;
    if (cocktailsCollected < cocktailsRequired && this.player.x > this.level.goalX - 550) {
      let nearestDist = Infinity;
      for (const c of this.cocktails) {
        if (!c.collected && c.required) {
          const d = c.x - (this.player.x + this.player.w / 2);
          if (Math.abs(d) < nearestDist) {
            nearestDist = Math.abs(d);
            missingDirection = d < 0 ? -1 : 1;
          }
        }
      }
    }

    const goalReachedHint = this.goalReachedHintTimer > 0;
    const key = [
      this.screen,
      this.levelIndex,
      this.score,
      this.lives,
      this.player.hasShield ? 1 : 0,
      cocktailsCollected,
      cocktailsRequired,
      this.combo,
      sec,
      missingDirection,
      goalReachedHint ? 1 : 0,
      audioEngine.isMuted() ? 1 : 0,
    ].join('|');

    if (!force && key === this.lastHudKey) return;
    this.lastHudKey = key;

    this.onHudChange({
      screen: this.screen,
      levelIndex: this.levelIndex,
      levelName: this.level.name,
      district: this.level.district,
      score: this.score,
      lives: this.lives,
      maxLives: this.maxLives,
      hasShield: this.player.hasShield,
      cocktailsCollected,
      cocktailsRequired,
      combo: this.combo,
      elapsedSeconds: sec,
      missingDirection,
      goalReachedHint,
      muted: audioEngine.isMuted(),
      levelStats: this.lastLevelStats,
      totalCocktailsAllLevels: this.totalCocktailsAllLevels,
      highScore: this.highScore,
    });
  }

  private aabb(
    ax: number,
    ay: number,
    aw: number,
    ah: number,
    bx: number,
    by: number,
    bw: number,
    bh: number
  ): boolean {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  private clearAllInputs(): void {
    this.keysDown.clear();
    this.touchInput.left = false;
    this.touchInput.right = false;
    this.touchInput.jump = false;
    this.input.left = false;
    this.input.right = false;
    this.input.sprint = false;
    this.input.jumpHeld = false;
    this.input.jumpJustPressed = false;
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }

    if (e.code === 'Escape' || e.code === 'KeyP') {
      if (this.screen === 'PLAYING' || this.screen === 'PAUSED') {
        this.togglePause();
        return;
      }
    }

    if (e.code === 'KeyM') {
      this.toggleMute();
      return;
    }

    if (e.code === 'Enter' || e.code === 'Space') {
      if (this.screen === 'TITLE_MENU') {
        this.startNewGame(0);
        return;
      }
      if (this.screen === 'LEVEL_CLEAR') {
        this.nextLevel();
        return;
      }
      if (this.screen === 'GAME_OVER') {
        this.restartCurrentLevel();
        return;
      }
      if (this.screen === 'VICTORY') {
        this.startNewGame(0);
        return;
      }
    }

    const isJumpKey = e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW';
    if (isJumpKey && !this.keysDown.has(e.code)) {
      this.input.jumpJustPressed = true;
    }
    this.keysDown.add(e.code);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keysDown.delete(e.code);
  };

  private handleBlur = (): void => {
    this.clearAllInputs();
  };

  private handleResize = (): void => {
    const parent = this.canvas.parentElement;
    const width = parent ? parent.clientWidth : window.innerWidth;
    const height = parent ? parent.clientHeight : window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.floor(width * dpr));
    this.canvas.height = Math.max(1, Math.floor(height * dpr));
  };

  private bindEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('resize', this.handleResize);
  }

  private unbindEvents(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('resize', this.handleResize);
  }
}
