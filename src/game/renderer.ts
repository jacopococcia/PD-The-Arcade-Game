import {
  BounceAwning,
  Cocktail,
  CocktailKind,
  Enemy,
  FloatingText,
  LevelConfig,
  MovingPlatform,
  Particle,
  Platform,
  Player,
  PowerupItem,
  Projectile,
  QuestionBlock,
} from './types';
import { getMayorHeadCanvas } from './mayorSprite';

interface ThemePalette {
  skyTop: string;
  skyBottom: string;
  sunColor: string;
  sunGlow: string;
  mountainFar: string;
  mountainSnow: string;
  hillBack: string;
  hillFront: string;
  townSilhouette: string;
  groundTop: string;
  groundBody: string;
  groundBorder: string;
  isNight: boolean;
}

const THEME_PALETTES: Record<LevelConfig['theme'], ThemePalette> = {
  morning: {
    skyTop: '#56A9E8',
    skyBottom: '#FDE7B6',
    sunColor: '#FFF5C0',
    sunGlow: 'rgba(255, 224, 130, 0.35)',
    mountainFar: '#7E96BA',
    mountainSnow: '#F4F7FB',
    hillBack: '#6E9A54',
    hillFront: '#537D3B',
    townSilhouette: '#C48A5A',
    groundTop: '#7EA345',
    groundBody: '#8C6239',
    groundBorder: '#573B21',
    isNight: false,
  },
  borgo: {
    skyTop: '#3E81C4',
    skyBottom: '#F5C48F',
    sunColor: '#FFE09E',
    sunGlow: 'rgba(255, 190, 100, 0.35)',
    mountainFar: '#7382A6',
    mountainSnow: '#EFEFF6',
    hillBack: '#7A8E4B',
    hillFront: '#5F7137',
    townSilhouette: '#B06A48',
    groundTop: '#B58963',
    groundBody: '#7D5137',
    groundBorder: '#4A2F20',
    isNight: false,
  },
  maiella: {
    skyTop: '#2E77B8',
    skyBottom: '#C8E6F7',
    sunColor: '#FFFBE0',
    sunGlow: 'rgba(255, 245, 190, 0.3)',
    mountainFar: '#6C84AB',
    mountainSnow: '#FFFFFF',
    hillBack: '#608C4C',
    hillFront: '#466E36',
    townSilhouette: '#9B7558',
    groundTop: '#6A9742',
    groundBody: '#78563A',
    groundBorder: '#45301F',
    isNight: false,
  },
  sagra: {
    skyTop: '#131C3B',
    skyBottom: '#352A54',
    sunColor: '#F6E7B0',
    sunGlow: 'rgba(246, 231, 176, 0.22)',
    mountainFar: '#273156',
    mountainSnow: '#93A2C7',
    hillBack: '#243C38',
    hillFront: '#1A2D2A',
    townSilhouette: '#3B2C3E',
    groundTop: '#8C6B50',
    groundBody: '#4E392C',
    groundBorder: '#2B1E17',
    isNight: true,
  },
};

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  viewW: number;
  viewH: number;
  cameraX: number;
  shakeX: number;
  shakeY: number;
  time: number;
  level: LevelConfig;
  player: Player;
  questionBlocks: QuestionBlock[];
  awnings: BounceAwning[];
  movingPlatforms: MovingPlatform[];
  cocktails: Cocktail[];
  powerups: PowerupItem[];
  enemies: Enemy[];
  projectiles: Projectile[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  cocktailsCollected: number;
  cocktailsRequired: number;
}

export function renderGameFrame(rc: RenderContext): void {
  const { ctx, viewW, viewH, cameraX, shakeX, shakeY, time, level } = rc;
  const palette = THEME_PALETTES[level.theme];

  // Uniform scale so 640px world height fills viewport height crisply
  const scale = viewH / level.height;
  const worldVisibleW = viewW / scale;

  ctx.save();
  ctx.scale(scale, scale);

  // 1. Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, level.height);
  skyGrad.addColorStop(0, palette.skyTop);
  skyGrad.addColorStop(1, palette.skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, worldVisibleW, level.height);

  // Stars & Festive Moon for Night Sagra
  if (palette.isNight) {
    ctx.fillStyle = 'rgba(255, 250, 220, 0.75)';
    for (let i = 0; i < 42; i++) {
      const sx = ((i * 197) % Math.max(1200, worldVisibleW)) - ((cameraX * 0.04) % 240);
      const sy = 28 + ((i * 83) % 230);
      const twinkle = 1 + 0.5 * Math.sin(time * 2.5 + i);
      ctx.fillRect(sx, sy, 2 * twinkle, 2 * twinkle);
    }
  }

  // Sun / Moon
  const sunX = worldVisibleW * 0.78 - cameraX * 0.03;
  const sunY = palette.isNight ? 98 : 112;
  ctx.fillStyle = palette.sunGlow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 64, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.sunColor;
  ctx.beginPath();
  ctx.arc(sunX, sunY, 34, 0, Math.PI * 2);
  ctx.fill();

  // Clouds (slow parallax)
  if (!palette.isNight) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    for (let i = 0; i < 7; i++) {
      const cx = ((i * 380 - cameraX * 0.12 + time * 8) % (worldVisibleW + 300)) - 140;
      const cy = 65 + (i % 3) * 48;
      drawCloud(ctx, cx, cy, 0.85 + (i % 2) * 0.25);
    }
  }

  // 2. Distant Maiella Mountain Massif (parallax 0.14)
  drawMaiellaRange(ctx, cameraX * 0.14, worldVisibleW, palette);

  // 3. Abruzzo Rolling Hills & Paglieta Borgo Silhouette (parallax 0.28)
  drawPaglietaHillsAndBorgo(ctx, cameraX * 0.28, worldVisibleW, palette, time);

  // Apply World Camera + Shake
  ctx.save();
  ctx.translate(-cameraX + shakeX, shakeY);

  // Festive Luminarie Garlands in Level 4
  if (palette.isNight) {
    drawLuminarie(ctx, level.width, cameraX, worldVisibleW, time);
  }

  // 4. Platforms
  for (const p of level.platforms) {
    if (p.x + p.w < cameraX - 80 || p.x > cameraX + worldVisibleW + 80) continue;
    drawPlatform(ctx, p, palette);
  }

  // 5. Moving Platforms (Abruzzo Market Carts)
  for (const mp of rc.movingPlatforms) {
    drawMovingPlatform(ctx, mp);
  }

  // 6. Bouncy Café Awnings
  for (const aw of rc.awnings) {
    drawAwning(ctx, aw);
  }

  // 7. Question Blocks (?)
  for (const qb of rc.questionBlocks) {
    drawQuestionBlock(ctx, qb, time);
  }

  // 8. Municipio Finish Arch
  drawMunicipioGoal(
    ctx,
    level.goalX,
    level.goalY,
    rc.cocktailsCollected >= rc.cocktailsRequired,
    rc.cocktailsCollected,
    rc.cocktailsRequired,
    time
  );

  // 9. Cocktails
  for (const c of rc.cocktails) {
    if (c.collected) continue;
    if (c.x < cameraX - 60 || c.x > cameraX + worldVisibleW + 60) continue;
    drawCocktail(ctx, c, time);
  }

  // 10. Powerups
  for (const pu of rc.powerups) {
    if (pu.collected) continue;
    drawPowerup(ctx, pu, time);
  }

  // 11. Angry Citizens
  for (const en of rc.enemies) {
    if (en.x + en.w < cameraX - 80 || en.x > cameraX + worldVisibleW + 80) continue;
    drawEnemy(ctx, en, time);
  }

  // 12. Projectiles (Volantini / Pomodori)
  for (const pr of rc.projectiles) {
    if (!pr.active) continue;
    drawProjectile(ctx, pr);
  }

  // 13. Il Sindaco (Player)
  drawMayor(ctx, rc.player, time);

  // 14. Particles
  for (const pt of rc.particles) {
    if (!pt.active) continue;
    ctx.globalAlpha = Math.max(0, pt.alpha);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 15. Floating Popups
  ctx.textAlign = 'center';
  for (const ft of rc.floatingTexts) {
    if (!ft.active) continue;
    const progress = 1 - ft.life / ft.maxLife;
    ctx.globalAlpha = Math.max(0, 1 - progress * progress);
    ctx.font = '800 16px "Bricolage Grotesque", sans-serif';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(18, 14, 12, 0.85)';
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
  }
  ctx.globalAlpha = 1;

  ctx.restore(); // end world camera
  ctx.restore(); // end viewport scale
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.beginPath();
  ctx.arc(x, y, 22 * s, 0, Math.PI * 2);
  ctx.arc(x + 22 * s, y - 8 * s, 26 * s, 0, Math.PI * 2);
  ctx.arc(x + 48 * s, y, 20 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawMaiellaRange(
  ctx: CanvasRenderingContext2D,
  scroll: number,
  viewW: number,
  palette: ThemePalette
): void {
  const span = 900;
  const start = Math.floor(scroll / span) * span - span;
  for (let bx = start; bx < scroll + viewW + span; bx += span) {
    const px = bx - scroll;
    // Main Maiella peaks
    ctx.fillStyle = palette.mountainFar;
    ctx.beginPath();
    ctx.moveTo(px, 540);
    ctx.lineTo(px + 170, 260);
    ctx.lineTo(px + 330, 355);
    ctx.lineTo(px + 540, 205);
    ctx.lineTo(px + 750, 340);
    ctx.lineTo(px + 900, 540);
    ctx.closePath();
    ctx.fill();

    // Snow caps
    ctx.fillStyle = palette.mountainSnow;
    ctx.beginPath();
    ctx.moveTo(px + 540, 205);
    ctx.lineTo(px + 472, 268);
    ctx.lineTo(px + 510, 258);
    ctx.lineTo(px + 542, 276);
    ctx.lineTo(px + 575, 255);
    ctx.lineTo(px + 615, 270);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(px + 170, 260);
    ctx.lineTo(px + 125, 304);
    ctx.lineTo(px + 165, 296);
    ctx.lineTo(px + 208, 306);
    ctx.closePath();
    ctx.fill();
  }
}

function drawPaglietaHillsAndBorgo(
  ctx: CanvasRenderingContext2D,
  scroll: number,
  viewW: number,
  palette: ThemePalette,
  time: number
): void {
  const span = 760;
  const start = Math.floor(scroll / span) * span - span;

  // Back hill with Paglieta church bell tower silhouette
  for (let bx = start; bx < scroll + viewW + span; bx += span) {
    const px = bx - scroll;
    ctx.fillStyle = palette.hillBack;
    ctx.beginPath();
    ctx.moveTo(px, 560);
    ctx.quadraticCurveTo(px + 190, 345, px + 390, 415);
    ctx.quadraticCurveTo(px + 580, 350, px + 760, 460);
    ctx.lineTo(px + 760, 560);
    ctx.closePath();
    ctx.fill();

    // Distant Paglieta hilltop town cluster & Campanile
    const tx = px + 185;
    const ty = 376;
    ctx.fillStyle = palette.townSilhouette;
    ctx.fillRect(tx - 46, ty + 6, 36, 30);
    ctx.fillRect(tx - 12, ty, 44, 36);
    ctx.fillRect(tx + 30, ty + 10, 32, 26);
    // Bell Tower (Chiesa di Santa Maria Assunta)
    ctx.fillRect(tx + 4, ty - 34, 18, 42);
    ctx.beginPath();
    ctx.moveTo(tx + 2, ty - 34);
    ctx.lineTo(tx + 13, ty - 54);
    ctx.lineTo(tx + 24, ty - 34);
    ctx.closePath();
    ctx.fill();

    // Warm lit windows at night
    if (palette.isNight) {
      ctx.fillStyle = '#FCD34D';
      ctx.fillRect(tx - 38, ty + 14, 6, 8);
      ctx.fillRect(tx + 10, ty - 24, 6, 8);
      ctx.fillRect(tx + 38, ty + 18, 6, 8);
    }

    // Olive trees on hills
    for (let o = 0; o < 3; o++) {
      const ox = px + 460 + o * 78;
      const oy = 398 + (o % 2) * 14;
      ctx.fillStyle = '#533B27';
      ctx.fillRect(ox - 2, oy, 4, 16);
      ctx.fillStyle = palette.isNight ? '#2B4A3C' : '#6A9450';
      ctx.beginPath();
      ctx.arc(ox, oy - 3, 14, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Front hill wave
  for (let bx = start; bx < scroll + viewW + span; bx += span) {
    const px = bx - scroll * 1.15;
    ctx.fillStyle = palette.hillFront;
    ctx.beginPath();
    ctx.moveTo(px, 600);
    ctx.quadraticCurveTo(px + 210, 440, px + 430, 495);
    ctx.quadraticCurveTo(px + 600, 445, px + 760, 520);
    ctx.lineTo(px + 760, 600);
    ctx.closePath();
    ctx.fill();
  }

  // Subtle celebratory banner in sagra night
  if (palette.isNight) {
    const pulse = 0.7 + 0.3 * Math.sin(time * 4);
    ctx.fillStyle = `rgba(251, 191, 36, ${0.08 * pulse})`;
    ctx.fillRect(0, 420, viewW, 120);
  }
}

function drawLuminarie(
  ctx: CanvasRenderingContext2D,
  levelWidth: number,
  cameraX: number,
  viewW: number,
  time: number
): void {
  const spacing = 220;
  const start = Math.max(0, Math.floor(cameraX / spacing) * spacing - spacing);
  const end = Math.min(levelWidth, cameraX + viewW + spacing);
  const bulbColors = ['#FBBF24', '#EF4444', '#10B981', '#F97316', '#38BDF8'];

  for (let x = start; x < end; x += spacing) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 120);
    ctx.quadraticCurveTo(x + spacing / 2, 168, x + spacing, 120);
    ctx.stroke();

    for (let b = 1; b <= 5; b++) {
      const t = b / 6;
      const bx = x + spacing * t;
      const sag = 4 * t * (1 - t) * 48;
      const by = 120 + sag;
      const color = bulbColors[(Math.floor(x / spacing) + b) % bulbColors.length];
      const glow = 0.65 + 0.35 * Math.sin(time * 5 + b + x * 0.01);

      ctx.fillStyle = color;
      ctx.globalAlpha = glow * 0.35;
      ctx.beginPath();
      ctx.arc(bx, by + 3, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.arc(bx, by + 3, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawPlatform(ctx: CanvasRenderingContext2D, p: Platform, palette: ThemePalette): void {
  if (p.kind === 'ground') {
    // Rich soil/stone base
    ctx.fillStyle = palette.groundBody;
    ctx.fillRect(p.x, p.y + 16, p.w, p.h - 16);

    // Subtle cobblestone blocks inside ground
    ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
    for (let sx = p.x + 12; sx < p.x + p.w - 28; sx += 44) {
      ctx.fillRect(sx, p.y + 28, 30, 14);
      ctx.fillRect(sx + 16, p.y + 52, 26, 14);
    }

    // Top turf / paving layer
    ctx.fillStyle = palette.groundTop;
    ctx.fillRect(p.x, p.y, p.w, 18);

    // Border highlights
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.fillRect(p.x, p.y, p.w, 4);
    ctx.fillStyle = palette.groundBorder;
    ctx.fillRect(p.x, p.y + 16, p.w, 3);
    return;
  }

  if (p.kind === 'balcony') {
    // One-way Italian wooden pergola / iron balcony
    ctx.fillStyle = '#5C3A21';
    ctx.fillRect(p.x, p.y, p.w, 10);
    ctx.fillStyle = '#9C683E';
    ctx.fillRect(p.x, p.y, p.w, 5);
    // Decorative wrought-iron brackets underneath
    ctx.strokeStyle = '#332924';
    ctx.lineWidth = 2.5;
    for (let bx = p.x + 14; bx < p.x + p.w - 10; bx += 36) {
      ctx.beginPath();
      ctx.moveTo(bx, p.y + 10);
      ctx.lineTo(bx, p.y + p.h);
      ctx.stroke();
    }
    return;
  }

  // Brick or Abruzzo Limestone platform
  const isStone = p.kind === 'stone';
  ctx.fillStyle = isStone ? '#D6C7B2' : '#B85435';
  ctx.fillRect(p.x, p.y, p.w, p.h);

  ctx.strokeStyle = isStone ? '#8F7E68' : '#732D19';
  ctx.lineWidth = 2;
  ctx.strokeRect(p.x + 1, p.y + 1, p.w - 2, p.h - 2);

  // Brick mortar lines
  ctx.fillStyle = isStone ? 'rgba(90, 75, 58, 0.3)' : 'rgba(60, 20, 10, 0.35)';
  for (let bx = p.x + 28; bx < p.x + p.w - 8; bx += 28) {
    ctx.fillRect(bx, p.y + 2, 2, p.h - 4);
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.fillRect(p.x + 2, p.y + 2, p.w - 4, 4);
}

function drawMovingPlatform(ctx: CanvasRenderingContext2D, mp: MovingPlatform): void {
  // Wooden market cart / suspended lift
  ctx.fillStyle = '#784826';
  ctx.fillRect(mp.x, mp.y, mp.w, mp.h);
  ctx.fillStyle = '#B87A48';
  ctx.fillRect(mp.x, mp.y, mp.w, 6);
  ctx.strokeStyle = '#3E220F';
  ctx.lineWidth = 2;
  ctx.strokeRect(mp.x + 1, mp.y + 1, mp.w - 2, mp.h - 2);

  // Brass rivets
  ctx.fillStyle = '#FBBF24';
  ctx.beginPath();
  ctx.arc(mp.x + 10, mp.y + 10, 3, 0, Math.PI * 2);
  ctx.arc(mp.x + mp.w - 10, mp.y + 10, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawAwning(ctx: CanvasRenderingContext2D, aw: BounceAwning): void {
  const squash = aw.bouncePhase > 0 ? Math.sin(aw.bouncePhase * Math.PI) * 6 : 0;
  const y = aw.y + squash;
  const h = aw.h - squash * 0.5;

  // Support poles
  ctx.fillStyle = '#44403C';
  ctx.fillRect(aw.x + 8, y + h - 2, 5, 26);
  ctx.fillRect(aw.x + aw.w - 13, y + h - 2, 5, 26);

  // Striped red & cream bar awning
  const stripes = 6;
  const sw = aw.w / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#DC2626' : '#FEF3C7';
    ctx.beginPath();
    ctx.roundRect(aw.x + i * sw, y, sw + 1, h, [4, 4, 6, 6]);
    ctx.fill();
  }
  ctx.strokeStyle = '#7F1D1D';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(aw.x, y, aw.w, h, 5);
  ctx.stroke();

  // Upward arrow cue on awning
  ctx.fillStyle = '#FEF08A';
  ctx.beginPath();
  ctx.moveTo(aw.x + aw.w / 2, y - 9);
  ctx.lineTo(aw.x + aw.w / 2 - 6, y - 2);
  ctx.lineTo(aw.x + aw.w / 2 + 6, y - 2);
  ctx.closePath();
  ctx.fill();
}

function drawQuestionBlock(ctx: CanvasRenderingContext2D, qb: QuestionBlock, time: number): void {
  const y = qb.y + qb.bumpOffset;
  ctx.save();
  if (qb.hit) {
    ctx.fillStyle = '#8C6E58';
    ctx.fillRect(qb.x, y, qb.w, qb.h);
    ctx.strokeStyle = '#4A3628';
    ctx.lineWidth = 2;
    ctx.strokeRect(qb.x + 1, y + 1, qb.w - 2, qb.h - 2);
  } else {
    const shimmer = 0.85 + 0.15 * Math.sin(time * 6);
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(qb.x, y, qb.w, qb.h);
    ctx.fillStyle = `rgba(254, 240, 138, ${0.45 * shimmer})`;
    ctx.fillRect(qb.x + 3, y + 3, qb.w - 6, 6);
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(qb.x + 1, y + 1, qb.w - 2, qb.h - 2);

    ctx.fillStyle = '#FFFBEB';
    ctx.font = '800 22px "Bricolage Grotesque", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('?', qb.x + qb.w / 2, y + qb.h / 2 + 1);
  }
  ctx.restore();
}

function drawCocktail(ctx: CanvasRenderingContext2D, c: Cocktail, time: number): void {
  const bob = Math.sin(time * 4.2 + c.bobOffset) * 5;
  const cx = c.x;
  const cy = c.y + bob;

  ctx.save();
  ctx.translate(cx, cy);

  // Soft aura behind cocktail
  const auraColor = getCocktailColor(c.kind).glow;
  ctx.fillStyle = auraColor;
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.fill();

  const colors = getCocktailColor(c.kind);

  // Stem & Base
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(0, 3);
  ctx.lineTo(0, 14);
  ctx.moveTo(-7, 14);
  ctx.lineTo(7, 14);
  ctx.stroke();

  if (c.kind === 'mojito' || c.kind === 'centerba') {
    // Highball / Collins glass
    ctx.fillStyle = colors.liquid;
    ctx.beginPath();
    ctx.roundRect(-8, -11, 16, 22, 3);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ice cubes & mint leaf
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(-4, -5, 5, 5);
    ctx.fillRect(1, 0, 5, 5);
    ctx.fillStyle = '#16A34A';
    ctx.beginPath();
    ctx.ellipse(-3, -12, 5, 2.5, -0.4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Balloon / Copa Spritz / Gin glass
    ctx.fillStyle = colors.liquid;
    ctx.beginPath();
    ctx.moveTo(-11, -9);
    ctx.quadraticCurveTo(-11, 5, 0, 5);
    ctx.quadraticCurveTo(11, 5, 11, -9);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Ice
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillRect(-5, -5, 5, 5);
    ctx.fillRect(1, -3, 4, 4);

    // Citrus slice on rim
    ctx.fillStyle = colors.garnish;
    ctx.beginPath();
    ctx.arc(9, -10, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFBEB';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  // Straw
  ctx.strokeStyle = '#F43F5E';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-3, -2);
  ctx.lineTo(-9, -16);
  ctx.stroke();

  // Twinkle sparkle
  const sp = 0.5 + 0.5 * Math.sin(time * 6 + c.bobOffset);
  ctx.fillStyle = `rgba(255,255,255,${sp})`;
  ctx.beginPath();
  ctx.arc(-6, -7, 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function getCocktailColor(kind: CocktailKind): {
  liquid: string;
  garnish: string;
  glow: string;
} {
  switch (kind) {
    case 'spritz':
      return { liquid: '#FF6B1A', garnish: '#FBBF24', glow: 'rgba(255, 107, 26, 0.25)' };
    case 'negroni':
      return { liquid: '#DC2626', garnish: '#FB923C', glow: 'rgba(220, 38, 38, 0.25)' };
    case 'mojito':
      return { liquid: '#34D399', garnish: '#A3E635', glow: 'rgba(52, 211, 153, 0.24)' };
    case 'gin_tonic':
      return { liquid: '#38BDF8', garnish: '#BEF264', glow: 'rgba(56, 189, 248, 0.25)' };
    case 'centerba':
      return { liquid: '#10B981', garnish: '#FDE047', glow: 'rgba(16, 185, 129, 0.3)' };
  }
}

function drawPowerup(ctx: CanvasRenderingContext2D, pu: PowerupItem, time: number): void {
  ctx.save();
  ctx.translate(pu.x + 14, pu.y + 14 + Math.sin(time * 5) * 3);
  if (pu.kind === 'shield') {
    // Espresso Scudo Tricolore
    ctx.fillStyle = 'rgba(16, 185, 129, 0.28)';
    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, Math.PI * 2);
    ctx.fill();

    // Cup
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(-9, -6, 16, 14, [2, 2, 7, 7]);
    ctx.fill();
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Handle
    ctx.beginPath();
    ctx.arc(8, 0, 4, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    // Espresso crema + Tricolore band
    ctx.fillStyle = '#5C3415';
    ctx.fillRect(-7, -5, 12, 4);
    ctx.fillStyle = '#16A34A';
    ctx.fillRect(-7, 2, 4, 3);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-3, 2, 4, 3);
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(1, 2, 4, 3);
  } else {
    // Golden Bonus Spritz
    ctx.fillStyle = 'rgba(251, 191, 36, 0.35)';
    ctx.beginPath();
    ctx.arc(0, 0, 19, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFBEB';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawMunicipioGoal(
  ctx: CanvasRenderingContext2D,
  goalX: number,
  goalY: number,
  unlocked: boolean,
  collected: number,
  required: number,
  time: number
): void {
  ctx.save();
  ctx.translate(goalX, goalY);

  // Stone Arch of Paglieta Municipio
  ctx.fillStyle = '#E7D8C3';
  ctx.fillRect(-44, -124, 18, 124);
  ctx.fillRect(26, -124, 18, 124);
  ctx.fillRect(-50, -138, 100, 22);

  ctx.strokeStyle = '#8C7A64';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(-44, -124, 18, 124);
  ctx.strokeRect(26, -124, 18, 124);
  ctx.strokeRect(-50, -138, 100, 22);

  // Banner across arch
  ctx.fillStyle = unlocked ? '#15803D' : '#475569';
  ctx.fillRect(-38, -114, 76, 22);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '800 10px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MUNICIPIO', 0, -103);

  // Glowing Tricolore portal inside arch when unlocked
  if (unlocked) {
    const pulse = 0.25 + 0.12 * Math.sin(time * 5);
    const grad = ctx.createLinearGradient(-26, 0, 26, 0);
    grad.addColorStop(0, `rgba(22, 163, 74, ${pulse})`);
    grad.addColorStop(0.5, `rgba(255, 255, 255, ${pulse + 0.1})`);
    grad.addColorStop(1, `rgba(220, 38, 38, ${pulse})`);
    ctx.fillStyle = grad;
    ctx.fillRect(-26, -92, 52, 92);
  } else {
    // Locked readout pill above arch
    ctx.fillStyle = 'rgba(15, 23, 42, 0.86)';
    ctx.beginPath();
    ctx.roundRect(-42, -172, 84, 24, 6);
    ctx.fill();
    ctx.fillStyle = '#FCD34D';
    ctx.font = '700 12px "JetBrains Mono", monospace';
    ctx.fillText(`${collected}/${required} 🍹`, 0, -159);
  }

  // Flagpole on top
  ctx.fillStyle = '#64748B';
  ctx.fillRect(-2, -196, 4, 58);
  const wave = Math.sin(time * 6) * 3;
  ctx.fillStyle = '#16A34A';
  ctx.fillRect(2, -194, 11, 18);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(13, -194 + wave * 0.3, 11, 18);
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(24, -194 + wave * 0.6, 11, 18);

  ctx.restore();
}

function drawMayor(ctx: CanvasRenderingContext2D, p: Player, time: number): void {
  // Blink when invulnerable
  if (p.invulnTimer > 0 && Math.floor(p.invulnTimer * 16) % 2 === 0) {
    return;
  }

  ctx.save();
  const cx = p.x + p.w / 2;
  const bottomY = p.y + p.h;
  ctx.translate(cx, bottomY);
  ctx.scale(p.facing * p.scaleX, p.scaleY);

  // Scudo Tricolore aura
  if (p.hasShield) {
    const aura = 0.25 + 0.1 * Math.sin(time * 7);
    ctx.strokeStyle = `rgba(34, 197, 94, ${aura + 0.45})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, -p.h / 2 - 2, 25, 31, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  const swing = p.grounded && Math.abs(p.vx) > 20 ? Math.sin(p.runPhase) * 6 : 0;

  // Shoes & Trousers
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(-9 + swing * 0.7, -12, 7, 12);
  ctx.fillRect(2 - swing * 0.7, -12, 7, 12);
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(-10 + swing * 0.7, -4, 9, 4);
  ctx.fillRect(2 - swing * 0.7, -4, 10, 4);

  // Navy Blazer Torso (matching photo)
  ctx.fillStyle = p.hitFlashTimer > 0 ? '#FFFFFF' : '#1E3A5F';
  ctx.beginPath();
  ctx.roundRect(-12, -31, 24, 21, 4);
  ctx.fill();

  if (p.hitFlashTimer <= 0) {
    // Open-collar crisp white dress shirt (no tie, matching photo)
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.moveTo(-6, -31);
    ctx.lineTo(6, -31);
    ctx.lineTo(0, -18);
    ctx.closePath();
    ctx.fill();

    // Open collar flaps
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-6, -31);
    ctx.lineTo(-2, -25);
    ctx.moveTo(6, -31);
    ctx.lineTo(2, -25);
    ctx.stroke();

    // Fascia Tricolore del Sindaco across the navy jacket
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(-12, -31, 24, 21, 4);
    ctx.clip();
    ctx.translate(0, -21);
    ctx.rotate(-0.65);
    ctx.fillStyle = '#16A34A';
    ctx.fillRect(-20, -4.5, 40, 3);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-20, -1.5, 40, 3);
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(-20, 1.5, 40, 3);
    ctx.restore();
  }

  // Arm
  const armAngle = !p.grounded ? -0.9 : swing * 0.08;
  ctx.save();
  ctx.translate(-3, -27);
  ctx.rotate(armAngle);
  ctx.fillStyle = p.hitFlashTimer > 0 ? '#FFFFFF' : '#162C47';
  ctx.fillRect(-3, 0, 6, 13);
  ctx.fillStyle = '#FDBA74';
  ctx.beginPath();
  ctx.arc(0, 14, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Head: Real photo cutout (green-screened) with matching clean-shaven silver-haired fallback
  const headImg = getMayorHeadCanvas();
  if (headImg && p.hitFlashTimer <= 0) {
    const headW = 28;
    const headH = Math.round((headImg.height / headImg.width) * headW);
    const tilt = Math.max(-0.12, Math.min(0.12, (p.vx / 400) * 0.1 * p.facing));

    ctx.save();
    ctx.translate(0, -42);
    ctx.rotate(tilt);

    // Subtle crisp backdrop halo so the silver hair reads clearly against bright skies
    ctx.shadowColor = 'rgba(15, 23, 42, 0.55)';
    ctx.shadowBlur = 4;
    ctx.drawImage(headImg, -headW / 2, -headH / 2, headW, headH);
    ctx.restore();
  } else {
    // Fallback matching Sindaco Graziani: clean-shaven, thick dark brows, full silver-grey wavy hair
    ctx.fillStyle = p.hitFlashTimer > 0 ? '#FFFFFF' : '#F2B89B';
    ctx.beginPath();
    ctx.ellipse(0, -39, 10.5, 11.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Full voluminous silver-grey hair
    ctx.fillStyle = '#CBD5E1';
    ctx.beginPath();
    ctx.arc(0, -44, 11.5, Math.PI * 0.92, Math.PI * 2.08);
    ctx.fill();
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(-11, -45, 4, 7);
    ctx.fillRect(7, -45, 3.5, 5);

    // Thick dark eyebrows + eyes + friendly clean-shaven smile
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-5, -43, 4.5, 2);
    ctx.fillRect(2, -43, 5, 2);
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(3.5, -40, 2.2, 2.5);
    ctx.strokeStyle = '#9A3412';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(2.5, -35, 3.5, 0.15, Math.PI * 0.75);
    ctx.stroke();
  }

  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, time: number): void {
  ctx.save();
  const cx = e.x + e.w / 2;
  const bottomY = e.y + e.h;
  ctx.translate(cx, bottomY);

  if (e.aiState === 'squashed') {
    ctx.scale(e.facing * 1.35, 0.35);
  } else {
    ctx.scale(e.facing, 1);
  }

  const isWindup = e.aiState === 'windup';
  const isBoss = e.kind === 'councilor_boss';
  const bodyScale = isBoss ? 1.24 : 1;
  ctx.scale(bodyScale, bodyScale);

  const swing = Math.sin(e.walkPhase) * 5;

  // Legs
  ctx.fillStyle = '#334155';
  ctx.fillRect(-8 + swing * 0.6, -12, 6, 12);
  ctx.fillRect(2 - swing * 0.6, -12, 6, 12);

  // Torso color by archetype
  let shirt = '#B91C1C';
  if (e.kind === 'charger') shirt = '#9333EA';
  if (e.kind === 'flyer_thrower') shirt = '#0284C7';
  if (e.kind === 'councilor_boss') shirt = '#18181B';
  if (e.hitFlash > 0 || (isWindup && Math.floor(time * 20) % 2 === 0)) {
    shirt = '#FCA5A5';
  }

  ctx.fillStyle = shirt;
  ctx.beginPath();
  ctx.roundRect(-12, -31, 24, 21, 4);
  ctx.fill();

  // Angry Citizen Head (slightly flushed red!)
  ctx.fillStyle = e.hitFlash > 0 ? '#FFFFFF' : '#F89B7E';
  ctx.beginPath();
  ctx.arc(0, -39, 10, 0, Math.PI * 2);
  ctx.fill();

  // Hair / Hat
  if (e.kind === 'charger') {
    // Kerchief / curls
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.arc(-2, -43, 9.5, Math.PI * 0.85, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'councilor_boss') {
    // Hard hat / top hat
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(0, -44, 10.5, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-12, -45, 24, 3);
  } else {
    ctx.fillStyle = '#292524';
    ctx.fillRect(-9, -48, 18, 6);
  }

  // Angry furrowed eyebrow + open shouting mouth
  ctx.strokeStyle = '#1C1917';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(0, -43);
  ctx.lineTo(7, -40);
  ctx.stroke();

  ctx.fillStyle = '#1C1917';
  ctx.fillRect(3, -39, 2.5, 2.5);
  ctx.fillStyle = '#7F1D1D';
  ctx.beginPath();
  ctx.ellipse(4, -34, 3.5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Prop held in hand!
  if (e.kind === 'charger') {
    // Rolling pin (matterello)
    ctx.fillStyle = '#D97706';
    ctx.fillRect(6, -26, 15, 5);
  } else if (e.kind === 'flyer_thrower') {
    // Megaphone
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.moveTo(6, -34);
    ctx.lineTo(18, -39);
    ctx.lineTo(18, -29);
    ctx.closePath();
    ctx.fill();
  } else {
    // Protest sign stick
    ctx.fillStyle = '#78350F';
    ctx.fillRect(9, -46, 3, 28);
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(3, -58, 16, 13);
    ctx.strokeStyle = '#991B1B';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(3, -58, 16, 13);
  }

  ctx.restore();

  // Unflipped overlays above enemy (HP pips for boss, Windup "!", or shout bubble)
  if (e.aiState !== 'squashed') {
    if (isBoss && e.maxHp > 1) {
      for (let i = 0; i < e.maxHp; i++) {
        ctx.fillStyle = i < e.hp ? '#EF4444' : '#334155';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx - 8 + i * 16, e.y - 14, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    if (isWindup) {
      ctx.fillStyle = '#EF4444';
      ctx.font = '800 22px "Bricolage Grotesque", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', cx, e.y - 16);
    } else if (e.shoutTimer > 0 && e.shoutText) {
      ctx.save();
      ctx.font = '700 11px "Plus Jakarta Sans", sans-serif';
      const tw = ctx.measureText(e.shoutText).width + 14;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
      ctx.beginPath();
      ctx.roundRect(cx - tw / 2, e.y - 34, tw, 20, 6);
      ctx.fill();
      ctx.fillStyle = '#991B1B';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e.shoutText, cx, e.y - 24);
      ctx.restore();
    }
  }
}

function drawProjectile(ctx: CanvasRenderingContext2D, pr: Projectile): void {
  ctx.save();
  ctx.translate(pr.x, pr.y);
  ctx.rotate(pr.rotation);
  if (pr.kind === 'flyer') {
    // Protest flyer spinning in air
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(-8, -6, 16, 12);
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-8, -6, 16, 12);
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(-5, -2, 10, 2);
    ctx.fillRect(-5, 2, 7, 2);
  } else {
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(0, 0, pr.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#16A34A';
    ctx.fillRect(-3, -pr.radius - 1, 6, 3);
  }
  ctx.restore();
}
