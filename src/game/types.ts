export type GameScreenState =
  | 'TITLE_MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'LEVEL_CLEAR'
  | 'GAME_OVER'
  | 'VICTORY';

export type LevelTheme = 'morning' | 'borgo' | 'maiella' | 'sagra';

export type CocktailKind = 'spritz' | 'negroni' | 'mojito' | 'gin_tonic' | 'centerba';

export type EnemyKind = 'protester' | 'charger' | 'flyer_thrower' | 'councilor_boss';

export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: 'ground' | 'brick' | 'balcony' | 'stone';
  oneWay?: boolean;
}

export interface QuestionBlock {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  reward: 'shield' | 'bonus_spritz';
  hit: boolean;
  bumpOffset: number;
}

export interface BounceAwning {
  x: number;
  y: number;
  w: number;
  h: number;
  bouncePhase: number;
}

export interface MovingPlatform {
  x: number;
  y: number;
  w: number;
  h: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  speed: number;
  progress: number;
  direction: 1 | -1;
  prevX: number;
  prevY: number;
}

export interface Cocktail {
  id: string;
  x: number;
  y: number;
  kind: CocktailKind;
  collected: boolean;
  required: boolean;
  bobOffset: number;
  spawnAnim?: number;
}

export interface PowerupItem {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  kind: 'shield' | 'bonus_spritz';
  collected: boolean;
}

export type EnemyAIState = 'patrol' | 'windup' | 'charge' | 'cooldown' | 'squashed';

export interface Enemy {
  id: string;
  kind: EnemyKind;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  minX: number;
  maxX: number;
  baseSpeed: number;
  hp: number;
  maxHp: number;
  aiState: EnemyAIState;
  stateTimer: number;
  hitFlash: number;
  squashTimer: number;
  shoutText: string;
  shoutTimer: number;
  walkPhase: number;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  kind: 'tomato' | 'flyer';
  active: boolean;
  rotation: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  gravity: number;
  active: boolean;
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  active: boolean;
}

export interface LevelConfig {
  index: number;
  name: string;
  subtitle: string;
  district: string;
  theme: LevelTheme;
  width: number;
  height: number;
  spawnX: number;
  spawnY: number;
  goalX: number;
  goalY: number;
  parTimeSeconds: number;
  platforms: Platform[];
  questionBlocks: Omit<QuestionBlock, 'hit' | 'bumpOffset'>[];
  awnings: Omit<BounceAwning, 'bouncePhase'>[];
  movingPlatforms: Omit<MovingPlatform, 'x' | 'y' | 'progress' | 'direction' | 'prevX' | 'prevY'>[];
  cocktails: Omit<Cocktail, 'collected' | 'bobOffset'>[];
  enemies: Omit<
    Enemy,
    'vy' | 'aiState' | 'stateTimer' | 'hitFlash' | 'squashTimer' | 'shoutTimer' | 'walkPhase'
  >[];
}

export interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  invulnTimer: number;
  hitFlashTimer: number;
  hasShield: boolean;
  scaleX: number;
  scaleY: number;
  runPhase: number;
  onMovingPlatform: MovingPlatform | null;
}

export interface HudSnapshot {
  screen: GameScreenState;
  levelIndex: number;
  levelName: string;
  district: string;
  score: number;
  lives: number;
  maxLives: number;
  hasShield: boolean;
  cocktailsCollected: number;
  cocktailsRequired: number;
  combo: number;
  elapsedSeconds: number;
  missingDirection: -1 | 0 | 1;
  goalReachedHint: boolean;
  muted: boolean;
  levelStats: {
    cocktailsCollected: number;
    cocktailsRequired: number;
    timeBonus: number;
    stars: number;
  };
  totalCocktailsAllLevels: number;
  highScore: number;
}
