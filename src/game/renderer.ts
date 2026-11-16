import {
  BounceAwning,
  Cocktail,
  CocktailKind,
  Enemy,
  FloatingText,
  LevelConfig,
  LevelLandmark,
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
  piane: {
    skyTop: '#4A90D9',
    skyBottom: '#FDE8B4',
    sunColor: '#FFF3B8',
    sunGlow: 'rgba(255, 214, 120, 0.35)',
    mountainFar: '#7E95B8',
    mountainSnow: '#F4F7FB',
    hillBack: '#7EA34D',
    hillFront: '#93A647',
    townSilhouette: '#B57B52',
    groundTop: '#769E3B',
    groundBody: '#7D5836',
    groundBorder: '#4A331D',
    isNight: false,
  },
  collemici: {
    skyTop: '#2E77B8',
    skyBottom: '#D6ECFA',
    sunColor: '#FFFBE0',
    sunGlow: 'rgba(255, 245, 190, 0.3)',
    mountainFar: '#6C84AB',
    mountainSnow: '#FFFFFF',
    hillBack: '#5D8E49',
    hillFront: '#467036',
    townSilhouette: '#9E7458',
    groundTop: '#4E9A3E',
    groundBody: '#725238',
    groundBorder: '#422D1D',
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
    skyTop: '#140814',
    skyBottom: '#4A1525',
    sunColor: '#FB923C',
    sunGlow: 'rgba(239, 68, 68, 0.28)',
    mountainFar: '#2A1830',
    mountainSnow: '#8E6D8A',
    hillBack: '#26171C',
    hillFront: '#1A1114',
    townSilhouette: '#2D171E',
    groundTop: '#57534E',
    groundBody: '#292524',
    groundBorder: '#1C1917',
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

  // 3. Abruzzo Hills / Flat Plains for Le Piane
  if (level.theme === 'piane') {
    drawLePianePlains(ctx, cameraX * 0.25, worldVisibleW, palette, time);
  } else {
    drawPaglietaHillsAndBorgo(ctx, cameraX * 0.28, worldVisibleW, palette, time);
  }

  // Apply World Camera + Shake
  ctx.save();
  ctx.translate(-cameraX + shakeX, shakeY);

  // Festive Luminarie Garlands in Level 4
  if (palette.isNight) {
    drawLuminarie(ctx, level.width, cameraX, worldVisibleW, time);
  }

  // 3b. Level Landmarks (Pizzeria da Filoteo, Istituto Agrario, Tractors, Hay Bales)
  if (level.landmarks) {
    for (const lm of level.landmarks) {
      if (lm.x + lm.w < cameraX - 120 || lm.x > cameraX + worldVisibleW + 120) continue;
      drawLandmark(ctx, lm, time);
    }
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
  const frontScroll = scroll * 1.15;
  const frontStart = Math.floor(frontScroll / span) * span - span;
  for (let bx = frontStart; bx < frontScroll + viewW + span; bx += span) {
    const px = bx - frontScroll;
    ctx.fillStyle = palette.hillFront;
    ctx.beginPath();
    ctx.moveTo(px, 600);
    ctx.quadraticCurveTo(px + 210, 440, px + 430, 495);
    ctx.quadraticCurveTo(px + 600, 445, px + 760, 520);
    ctx.lineTo(px + 760, 600);
    ctx.closePath();
    ctx.fill();
  }

  // Purge-night fire glow & rising smoke over distant Paglieta
  if (palette.isNight) {
    const pulse = 0.65 + 0.35 * Math.sin(time * 7);
    ctx.fillStyle = `rgba(239, 68, 68, ${0.14 * pulse})`;
    ctx.fillRect(0, 390, viewW, 150);
    ctx.fillStyle = `rgba(249, 115, 22, ${0.1 * pulse})`;
    ctx.fillRect(0, 440, viewW, 100);
  }
}

function drawLePianePlains(
  ctx: CanvasRenderingContext2D,
  scroll: number,
  viewW: number,
  palette: ThemePalette,
  time: number
): void {
  const span = 820;
  const start = Math.floor(scroll / span) * span - span;

  // Distant low rise with Paglieta borgo perched above the plain
  for (let bx = start; bx < scroll + viewW + span; bx += span) {
    const px = bx - scroll;
    ctx.fillStyle = palette.hillBack;
    ctx.beginPath();
    ctx.moveTo(px, 500);
    ctx.quadraticCurveTo(px + 200, 390, px + 430, 445);
    ctx.lineTo(px + 820, 455);
    ctx.lineTo(px + 820, 500);
    ctx.closePath();
    ctx.fill();

    // Distant Paglieta skyline
    const tx = px + 185;
    const ty = 398;
    ctx.fillStyle = palette.townSilhouette;
    ctx.fillRect(tx - 38, ty + 8, 30, 24);
    ctx.fillRect(tx - 8, ty + 2, 36, 30);
    ctx.fillRect(tx + 28, ty + 10, 26, 22);
    ctx.fillRect(tx + 4, ty - 24, 14, 30);
    ctx.beginPath();
    ctx.moveTo(tx + 2, ty - 24);
    ctx.lineTo(tx + 11, ty - 40);
    ctx.lineTo(tx + 20, ty - 24);
    ctx.closePath();
    ctx.fill();
  }

  // Wide flat cultivated plain ("Le Piane") — golden wheat & green crop strips
  ctx.fillStyle = '#B7B14A';
  ctx.fillRect(0, 452, viewW, 44);
  ctx.fillStyle = '#6D993E';
  ctx.fillRect(0, 492, viewW, 60);

  // Diagonal plowed field furrows in perspective
  const rowSpan = 160;
  const rowStart = Math.floor((scroll * 1.15) / rowSpan) * rowSpan - rowSpan;
  ctx.strokeStyle = 'rgba(72, 95, 34, 0.35)';
  ctx.lineWidth = 3;
  for (let rx = rowStart; rx < scroll * 1.15 + viewW + rowSpan; rx += rowSpan) {
    const x0 = rx - scroll * 1.15;
    ctx.beginPath();
    ctx.moveTo(x0 + 35, 454);
    ctx.lineTo(x0 - 20, 545);
    ctx.stroke();

    // Small distant poplar/cypress windbreak trees between fields
    ctx.fillStyle = '#4B6B2E';
    ctx.fillRect(x0 + 30, 434, 8, 20);
    ctx.beginPath();
    ctx.arc(x0 + 34, 430, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // Animated distant tractor plowing across the plain
  const bgTractorX = ((time * 32 - scroll * 0.65) % (viewW + 260)) - 120;
  const bgTractorY = 474;
  ctx.save();
  ctx.translate(bgTractorX, bgTractorY);
  ctx.fillStyle = '#C2410C';
  ctx.fillRect(-14, -10, 22, 10);
  ctx.fillRect(-10, -18, 12, 8);
  ctx.fillStyle = '#1E293B';
  ctx.beginPath();
  ctx.arc(-8, 2, 6, 0, Math.PI * 2);
  ctx.arc(7, 4, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLandmark(ctx: CanvasRenderingContext2D, lm: LevelLandmark, time: number): void {
  switch (lm.kind) {
    case 'tractor':
      drawTractorLandmark(ctx, lm, time);
      break;
    case 'hay_bale':
      drawHayBaleLandmark(ctx, lm);
      break;
    case 'pizzeria_filoteo':
      drawPizzeriaFiloteo(ctx, lm, time);
      break;
    case 'istituto_agrario':
      drawIstitutoAgrario(ctx, lm);
      break;
    case 'park_trees':
      drawParkScenery(ctx, lm);
      break;
    case 'ruspa':
      drawRuspaLandmark(ctx, lm, time);
      break;
    case 'pizzeria_tumini':
      drawPizzeriaTumini(ctx, lm, time);
      break;
    case 'soccer_field':
      drawSoccerField(ctx, lm, time);
      break;
    case 'purge_chaos':
      drawPurgeChaosLandmark(ctx, lm, time);
      break;
  }
}

function drawTractorLandmark(ctx: CanvasRenderingContext2D, lm: LevelLandmark, time: number): void {
  const { x, y, variant } = lm;
  const bodyColor = variant === 'green' ? '#15803D' : '#DC2626';
  const darkBody = variant === 'green' ? '#14532D' : '#991B1B';

  ctx.save();
  ctx.translate(x, y);

  // Exhaust smoke puffs
  const puff = (time * 1.8) % 1;
  ctx.fillStyle = `rgba(226, 232, 240, ${0.55 * (1 - puff)})`;
  ctx.beginPath();
  ctx.arc(105, -78 - puff * 26, 6 + puff * 6, 0, Math.PI * 2);
  ctx.fill();

  // Exhaust pipe
  ctx.fillStyle = '#334155';
  ctx.fillRect(102, -74, 6, 24);

  // Cab (roof aligns with platform at y - 85)
  ctx.fillStyle = '#E2E8F0';
  ctx.fillRect(24, -85, 58, 38);
  ctx.fillStyle = 'rgba(56, 189, 248, 0.55)';
  ctx.fillRect(30, -79, 46, 26);
  // Cab roof cap
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.roundRect(16, -91, 74, 9, 4);
  ctx.fill();

  // Engine Hood & Chassis
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.roundRect(14, -52, 108, 28, 6);
  ctx.fill();
  ctx.fillStyle = darkBody;
  ctx.fillRect(78, -46, 40, 6);

  // Front radiator grille & headlight
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(114, -48, 8, 20);
  ctx.fillStyle = '#FDE047';
  ctx.beginPath();
  ctx.arc(122, -43, 4, 0, Math.PI * 2);
  ctx.fill();

  // Big Rear Treaded Wheel
  ctx.fillStyle = '#18181B';
  ctx.beginPath();
  ctx.arc(36, -24, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FACC15';
  ctx.beginPath();
  ctx.arc(36, -24, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(36, -24, 4, 0, Math.PI * 2);
  ctx.fill();

  // Front Wheel
  ctx.fillStyle = '#18181B';
  ctx.beginPath();
  ctx.arc(104, -16, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FACC15';
  ctx.beginPath();
  ctx.arc(104, -16, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawHayBaleLandmark(ctx: CanvasRenderingContext2D, lm: LevelLandmark): void {
  const { x, y } = lm;
  ctx.save();
  ctx.translate(x, y);

  const drawBale = (bx: number, by: number) => {
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.arc(bx, by, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(bx, by, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bx, by, 12, 0.3, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(bx, by, 6, 0, Math.PI * 1.6);
    ctx.stroke();
  };

  drawBale(24, -22);
  drawBale(72, -22);
  drawBale(48, -58);
  ctx.restore();
}

function drawPizzeriaFiloteo(ctx: CanvasRenderingContext2D, lm: LevelLandmark, time: number): void {
  const { x, y, w } = lm;
  ctx.save();
  ctx.translate(x, y);

  // Brick oven chimney on the right with warm smoke puffs
  ctx.fillStyle = '#9A3412';
  ctx.fillRect(w - 58, -252, 28, 44);
  ctx.fillStyle = '#7C2D12';
  ctx.fillRect(w - 62, -256, 36, 8);
  for (let i = 0; i < 3; i++) {
    const t = (time * 0.7 + i * 0.33) % 1;
    ctx.fillStyle = `rgba(255, 247, 237, ${0.55 * (1 - t)})`;
    ctx.beginPath();
    ctx.arc(w - 44 + Math.sin(time * 2 + i) * 5, -264 - t * 38, 7 + t * 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Main warm stucco building
  ctx.fillStyle = '#F5E6C8';
  ctx.fillRect(0, -210, w, 210);
  ctx.strokeStyle = '#9A6B42';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, -210, w, 210);

  // Terracotta sloped roof trim (aligns with y = 330 roof platform)
  ctx.fillStyle = '#B93822';
  ctx.fillRect(-8, -216, w + 16, 14);
  ctx.fillStyle = '#7F1D1D';
  ctx.fillRect(-8, -204, w + 16, 4);

  // First floor balcony railing (aligns with y = 430 terrace platform)
  ctx.fillStyle = '#78350F';
  ctx.fillRect(8, -112, w - 16, 8);
  ctx.strokeStyle = '#292524';
  ctx.lineWidth = 2;
  for (let rx = 20; rx < w - 16; rx += 22) {
    ctx.beginPath();
    ctx.moveTo(rx, -112);
    ctx.lineTo(rx, -126);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(12, -126);
  ctx.lineTo(w - 12, -126);
  ctx.stroke();

  // Illuminated Signboard: "PIZZERIA DA FILOTEO"
  ctx.fillStyle = '#7F1D1D';
  ctx.beginPath();
  ctx.roundRect(26, -184, w - 52, 42, 8);
  ctx.fill();
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#FEF08A';
  ctx.font = '800 18px "Bricolage Grotesque", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PIZZERIA DA FILOTEO', w / 2, -163);

  // Warm glowing brick arch entrance & wood-fired oven glow
  ctx.fillStyle = '#EA580C';
  ctx.beginPath();
  ctx.roundRect(w / 2 - 36, -86, 72, 86, [36, 36, 0, 0]);
  ctx.fill();
  ctx.fillStyle = '#431407';
  ctx.beginPath();
  ctx.roundRect(w / 2 - 26, -76, 52, 76, [26, 26, 0, 0]);
  ctx.fill();

  // Glowing oven arch inside
  const ovenGlow = 0.7 + 0.3 * Math.sin(time * 8);
  ctx.fillStyle = `rgba(251, 146, 60, ${ovenGlow})`;
  ctx.beginPath();
  ctx.arc(w / 2, -16, 16, Math.PI, 0);
  ctx.fill();

  // Warm windows on left & right
  const drawWindow = (wx: number, wy: number) => {
    ctx.fillStyle = '#FDE047';
    ctx.fillRect(wx, wy, 42, 46);
    ctx.strokeStyle = '#5C3415';
    ctx.lineWidth = 3;
    ctx.strokeRect(wx, wy, 42, 46);
    ctx.beginPath();
    ctx.moveTo(wx + 21, wy);
    ctx.lineTo(wx + 21, wy + 46);
    ctx.moveTo(wx, wy + 23);
    ctx.lineTo(wx + 42, wy + 23);
    ctx.stroke();
  };
  drawWindow(36, -78);
  drawWindow(w - 78, -78);

  // Outdoor pizzeria table with pizza box
  ctx.fillStyle = '#78350F';
  ctx.fillRect(26, -24, 38, 5);
  ctx.fillRect(42, -19, 5, 19);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(32, -30, 24, 6);
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(38, -28, 12, 2);

  ctx.restore();
}

function drawIstitutoAgrario(ctx: CanvasRenderingContext2D, lm: LevelLandmark): void {
  const { x, y, w } = lm;
  ctx.save();
  ctx.translate(x, y);

  // Left & Right Wings (2 stories, weathered ochre concrete)
  ctx.fillStyle = '#B6AC9A';
  ctx.fillRect(0, -180, w, 180);
  ctx.strokeStyle = '#6E675C';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, -180, w, 180);

  // Central Monumental Block & Pediment (reaches roof platform y = 270)
  const midX = w / 2 - 125;
  ctx.fillStyle = '#C4BAA7';
  ctx.fillRect(midX, -270, 250, 270);
  ctx.strokeStyle = '#6E675C';
  ctx.strokeRect(midX, -270, 250, 270);

  // Triangular Classical Pediment on top
  ctx.fillStyle = '#9C9281';
  ctx.beginPath();
  ctx.moveTo(midX - 12, -270);
  ctx.lineTo(w / 2, -308);
  ctx.lineTo(midX + 262, -270);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Faded Institutional Sign: "ISTITUTO AGRARIO"
  ctx.fillStyle = '#44403C';
  ctx.fillRect(midX + 20, -252, 210, 34);
  ctx.strokeStyle = '#78716C';
  ctx.lineWidth = 2;
  ctx.strokeRect(midX + 20, -252, 210, 34);
  ctx.fillStyle = '#E7E5E4';
  ctx.font = '800 15px "Bricolage Grotesque", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ISTITUTO AGRARIO', w / 2, -238);
  ctx.fillStyle = '#A8A29E';
  ctx.font = '700 9px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('EX COMPLESSO ABBANDONATO', w / 2, -225);

  // Grid of dark / broken / boarded-up windows
  const drawAbandonedWindow = (wx: number, wy: number, boarded: boolean) => {
    ctx.fillStyle = '#1C1917';
    ctx.fillRect(wx, wy, 36, 48);
    ctx.strokeStyle = '#57534E';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(wx, wy, 36, 48);

    // Cracked glass shard highlight
    ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.beginPath();
    ctx.moveTo(wx + 2, wy + 2);
    ctx.lineTo(wx + 22, wy + 2);
    ctx.lineTo(wx + 2, wy + 24);
    ctx.closePath();
    ctx.fill();

    if (boarded) {
      // Wooden planks nailed across window
      ctx.fillStyle = '#78350F';
      ctx.save();
      ctx.translate(wx + 18, wy + 24);
      ctx.rotate(0.28);
      ctx.fillRect(-20, -4, 40, 7);
      ctx.rotate(-0.56);
      ctx.fillRect(-20, -4, 40, 7);
      ctx.restore();
    }
  };

  // Left Wing Windows (2 floors)
  [28, 92, 156].forEach((wx, idx) => {
    drawAbandonedWindow(wx, -152, idx === 1);
    drawAbandonedWindow(wx, -76, idx !== 1);
  });

  // Right Wing Windows (2 floors)
  [w - 192, w - 128, w - 64].forEach((wx, idx) => {
    drawAbandonedWindow(wx, -152, idx === 0);
    drawAbandonedWindow(wx, -76, idx === 2);
  });

  // Central Upper Windows
  drawAbandonedWindow(midX + 34, -196, false);
  drawAbandonedWindow(midX + 107, -196, true);
  drawAbandonedWindow(midX + 180, -196, false);

  // Portico Columns & Rusted Entrance Gate
  ctx.fillStyle = '#A89F8D';
  ctx.fillRect(midX + 16, -95, 16, 95);
  ctx.fillRect(midX + 218, -95, 16, 95);

  ctx.fillStyle = '#292524';
  ctx.fillRect(midX + 75, -86, 100, 86);
  // Rusty iron bars
  ctx.strokeStyle = '#7C2D12';
  ctx.lineWidth = 3;
  for (let gx = midX + 85; gx < midX + 170; gx += 16) {
    ctx.beginPath();
    ctx.moveTo(gx, -84);
    ctx.lineTo(gx, 0);
    ctx.stroke();
  }

  // Weathering cracks on plaster
  ctx.strokeStyle = 'rgba(68, 64, 60, 0.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(74, -180);
  ctx.lineTo(82, -150);
  ctx.lineTo(75, -130);
  ctx.moveTo(w - 95, -180);
  ctx.lineTo(w - 102, -140);
  ctx.stroke();

  // Creeping overgrown ivy & weeds along walls and roof
  const drawIvy = (ix: number, iy: number, len: number) => {
    ctx.fillStyle = '#3F6212';
    for (let k = 0; k < len; k += 12) {
      ctx.beginPath();
      ctx.arc(ix + Math.sin(k) * 4, iy + k, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#65A30D';
    for (let k = 6; k < len; k += 16) {
      ctx.beginPath();
      ctx.arc(ix + 4, iy + k, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  drawIvy(16, -180, 95);
  drawIvy(midX + 22, -270, 140);
  drawIvy(midX + 224, -180, 120);
  drawIvy(w - 28, -180, 110);

  // Overgrown bushes at the base
  ctx.fillStyle = '#365314';
  for (let bx = 18; bx < w - 18; bx += 68) {
    if (bx > midX + 60 && bx < midX + 185) continue;
    ctx.beginPath();
    ctx.arc(bx, -6, 14, Math.PI, 0);
    ctx.arc(bx + 18, -4, 11, Math.PI, 0);
    ctx.fill();
  }

  ctx.restore();
}

function drawParkScenery(ctx: CanvasRenderingContext2D, lm: LevelLandmark): void {
  const { x, y } = lm;
  ctx.save();
  ctx.translate(x, y);

  // Lush park trees in Collemici
  const treePositions = [55, 285, 510, 645];
  for (let i = 0; i < treePositions.length; i++) {
    const tx = treePositions[i];
    ctx.fillStyle = '#5C3A21';
    ctx.fillRect(tx - 6, -92, 12, 92);
    ctx.fillStyle = '#3F7D2D';
    ctx.beginPath();
    ctx.arc(tx, -108, 34, 0, Math.PI * 2);
    ctx.arc(tx - 20, -90, 24, 0, Math.PI * 2);
    ctx.arc(tx + 22, -90, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#65A30D';
    ctx.beginPath();
    ctx.arc(tx - 6, -116, 20, 0, Math.PI * 2);
    ctx.fill();
  }

  // Park benches
  for (const bx of [110, 560]) {
    ctx.fillStyle = '#78350F';
    ctx.fillRect(bx, -26, 48, 6);
    ctx.fillRect(bx, -16, 48, 5);
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(bx + 6, -26, 4, 26);
    ctx.fillRect(bx + 38, -26, 4, 26);
  }

  // Red & white construction barrier ("LAVORI")
  const cx = 345;
  ctx.fillStyle = '#475569';
  ctx.fillRect(cx + 6, -34, 4, 34);
  ctx.fillRect(cx + 58, -34, 4, 34);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(cx, -32, 68, 13);
  ctx.fillStyle = '#DC2626';
  ctx.fillRect(cx + 8, -32, 14, 13);
  ctx.fillRect(cx + 36, -32, 14, 13);

  ctx.restore();
}

function drawRuspaLandmark(ctx: CanvasRenderingContext2D, lm: LevelLandmark, time: number): void {
  const { x, y } = lm;
  ctx.save();
  ctx.translate(x, y);

  // Dirt mound being dug by the ruspa
  ctx.fillStyle = '#784826';
  ctx.beginPath();
  ctx.moveTo(105, 0);
  ctx.quadraticCurveTo(132, -32, 158, 0);
  ctx.closePath();
  ctx.fill();

  // Articulated Excavator Boom & Bucket animated digging
  const dig = Math.sin(time * 2.4 + x * 0.01);
  const armAngle = -0.35 + dig * 0.16;
  ctx.save();
  ctx.translate(92, -46);
  ctx.rotate(armAngle);
  // Main boom
  ctx.fillStyle = '#EA580C';
  ctx.fillRect(0, -7, 44, 12);
  ctx.strokeStyle = '#7C2D12';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, -7, 44, 12);

  // Forearm & Bucket
  ctx.translate(42, 0);
  ctx.rotate(0.85 - dig * 0.25);
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(0, -5, 34, 9);
  ctx.strokeRect(0, -5, 34, 9);

  // Steel Bucket
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.moveTo(30, -6);
  ctx.lineTo(48, -2);
  ctx.lineTo(44, 15);
  ctx.lineTo(26, 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Caterpillar Tracks
  ctx.fillStyle = '#18181B';
  ctx.beginPath();
  ctx.roundRect(12, -26, 92, 26, 12);
  ctx.fill();
  ctx.fillStyle = '#52525B';
  for (const wx of [26, 48, 70, 90]) {
    ctx.beginPath();
    ctx.arc(wx, -13, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Excavator Body
  ctx.fillStyle = '#F59E0B';
  ctx.beginPath();
  ctx.roundRect(10, -54, 90, 30, 5);
  ctx.fill();
  ctx.strokeStyle = '#92400E';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Cab (roof aligns cleanly with y - 85)
  ctx.fillStyle = '#FBBF24';
  ctx.fillRect(20, -85, 52, 34);
  ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
  ctx.fillRect(26, -79, 40, 23);
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(16, -89, 60, 6);

  // Flashing Amber Work Beacon
  const beaconOn = Math.sin(time * 8) > 0;
  ctx.fillStyle = beaconOn ? '#FDE047' : '#D97706';
  ctx.beginPath();
  ctx.arc(46, -94, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPizzeriaTumini(ctx: CanvasRenderingContext2D, lm: LevelLandmark, time: number): void {
  const { x, y, w } = lm;
  ctx.save();
  ctx.translate(x, y);

  // Stone oven chimney with warm smoke
  ctx.fillStyle = '#78350F';
  ctx.fillRect(26, -248, 26, 40);
  for (let i = 0; i < 3; i++) {
    const t = (time * 0.65 + i * 0.33) % 1;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * (1 - t)})`;
    ctx.beginPath();
    ctx.arc(39 + Math.sin(time * 2 + i) * 4, -256 - t * 34, 6 + t * 7, 0, Math.PI * 2);
    ctx.fill();
  }

  // Modern-Abruzzo Stone & Cream Facade
  ctx.fillStyle = '#EFE6D5';
  ctx.fillRect(0, -210, w, 210);
  ctx.fillStyle = '#B9A389';
  ctx.fillRect(0, -70, w, 70);
  ctx.strokeStyle = '#6B5340';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, -210, w, 210);

  // Roof Trim (aligns with y = 330)
  ctx.fillStyle = '#991B1B';
  ctx.fillRect(-8, -216, w + 16, 14);

  // Balcony Railing (aligns with y = 430)
  ctx.fillStyle = '#44403C';
  ctx.fillRect(8, -112, w - 16, 8);
  ctx.strokeStyle = '#1C1917';
  ctx.lineWidth = 2;
  for (let rx = 20; rx < w - 16; rx += 22) {
    ctx.beginPath();
    ctx.moveTo(rx, -112);
    ctx.lineTo(rx, -126);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(12, -126);
  ctx.lineTo(w - 12, -126);
  ctx.stroke();

  // Illuminated Signboard: "PIZZERIA TUMINI"
  ctx.fillStyle = '#18181B';
  ctx.beginPath();
  ctx.roundRect(30, -184, w - 60, 42, 8);
  ctx.fill();
  ctx.strokeStyle = '#EF4444';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#FDE047';
  ctx.font = '800 19px "Bricolage Grotesque", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PIZZERIA TUMINI', w / 2, -163);

  // Glowing Takeaway Counter & Door
  ctx.fillStyle = '#FEF08A';
  ctx.fillRect(34, -84, 96, 46);
  ctx.strokeStyle = '#57534E';
  ctx.lineWidth = 3;
  ctx.strokeRect(34, -84, 96, 46);

  // Glass Door
  ctx.fillStyle = '#334155';
  ctx.fillRect(154, -84, 54, 84);
  ctx.fillStyle = '#FDBA74';
  ctx.fillRect(162, -76, 38, 44);

  // Outdoor Umbrella Table
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(256, -72, 4, 72);
  ctx.fillStyle = '#DC2626';
  ctx.beginPath();
  ctx.moveTo(228, -72);
  ctx.lineTo(258, -94);
  ctx.lineTo(288, -72);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#78350F';
  ctx.fillRect(236, -24, 44, 5);

  ctx.restore();
}

function drawSoccerField(ctx: CanvasRenderingContext2D, lm: LevelLandmark, time: number): void {
  const { x, y, w } = lm;
  ctx.save();
  ctx.translate(x, y);

  // Striped Pitch Turf Overlay on top of ground edge
  for (let sx = 0; sx < w; sx += 92) {
    ctx.fillStyle = (sx / 92) % 2 === 0 ? '#16A34A' : '#15803D';
    ctx.fillRect(sx, 0, Math.min(92, w - sx), 16);
  }
  // White chalk lines
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(16, 0, w - 32, 3);
  ctx.fillRect(w / 2 - 2, 0, 4, 16);

  // Tall Floodlight Towers (Left & Right)
  for (const fx of [18, w - 26]) {
    ctx.fillStyle = '#64748B';
    ctx.fillRect(fx, -250, 8, 250);
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(fx - 14, -264, 36, 18);
    ctx.fillStyle = '#FEF08A';
    for (let b = 0; b < 3; b++) {
      ctx.beginPath();
      ctx.arc(fx - 6 + b * 10, -255, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Central Tribuna / Bleachers (x = 350..740 inside field -> world 2740..3130)
  const tribX = 350;
  const tribW = 390;
  ctx.fillStyle = '#475569';
  ctx.fillRect(tribX, -95, tribW, 95);
  ctx.fillStyle = '#334155';
  ctx.fillRect(tribX, -62, tribW, 8);
  ctx.fillRect(tribX, -30, tribW, 8);

  // Upper Press / Roof canopy (aligns with y = 355 -> -185)
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(tribX + 85, -185, 220, 12);
  ctx.fillStyle = '#64748B';
  ctx.fillRect(tribX + 95, -185, 8, 90);
  ctx.fillRect(tribX + 287, -185, 8, 90);

  // Scoreboard on top of bleachers
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(tribX + 125, -228, 140, 32);
  ctx.strokeStyle = '#FBBF24';
  ctx.lineWidth = 2;
  ctx.strokeRect(tribX + 125, -228, 140, 32);
  ctx.fillStyle = '#FDE047';
  ctx.font = '700 12px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAGLIETA 2 - 1', tribX + 195, -212);

  // Cheering/Rowdy Background Spectators in the bleachers!
  const fanColors = ['#DC2626', '#2563EB', '#F59E0B', '#FFFFFF'];
  for (let s = 0; s < 14; s++) {
    const sx = tribX + 20 + s * 26;
    const bounce = Math.abs(Math.sin(time * 7 + s * 1.1)) * 5;
    ctx.fillStyle = fanColors[s % fanColors.length];
    ctx.fillRect(sx - 5, -78 - bounce, 10, 14);
    ctx.fillStyle = '#FDBA74';
    ctx.beginPath();
    ctx.arc(sx, -83 - bounce, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Left & Right White Soccer Goalposts (crossbars at y - 105 -> 435)
  const drawGoal = (gx: number, facingRight: boolean) => {
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 5;
    ctx.strokeRect(gx, -105, 92, 105);

    // Goal net grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.32)';
    ctx.lineWidth = 1.5;
    for (let nx = gx + 12; nx < gx + 92; nx += 14) {
      ctx.beginPath();
      ctx.moveTo(nx, -103);
      ctx.lineTo(nx, 0);
      ctx.stroke();
    }
    for (let ny = -90; ny < 0; ny += 15) {
      ctx.beginPath();
      ctx.moveTo(gx + 2, ny);
      ctx.lineTo(gx + 90, ny);
      ctx.stroke();
    }

    // Thick front post accent
    ctx.fillStyle = '#E2E8F0';
    const postX = facingRight ? gx + 88 : gx;
    ctx.fillRect(postX, -107, 6, 107);
  };

  drawGoal(26, true);
  drawGoal(w - 116, false);

  ctx.restore();
}

function drawPurgeChaosLandmark(ctx: CanvasRenderingContext2D, lm: LevelLandmark, time: number): void {
  const { x, y, w } = lm;
  ctx.save();
  ctx.translate(x, y);

  // 1. Burning Oil Drum / Falò di Protesta on left
  const bx = 36;
  ctx.fillStyle = '#334155';
  ctx.fillRect(bx, -42, 30, 42);
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(bx, -30, 30, 4);
  ctx.fillRect(bx, -14, 30, 4);

  // Animated roaring flames + embers
  const flicker = Math.sin(time * 15 + x) * 4;
  ctx.fillStyle = 'rgba(249, 115, 22, 0.32)';
  ctx.beginPath();
  ctx.arc(bx + 15, -54, 30 + flicker * 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#EA580C';
  ctx.beginPath();
  ctx.moveTo(bx + 2, -42);
  ctx.lineTo(bx + 10, -72 - flicker);
  ctx.lineTo(bx + 17, -56);
  ctx.lineTo(bx + 23, -76 + flicker);
  ctx.lineTo(bx + 28, -42);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#FDE047';
  ctx.beginPath();
  ctx.moveTo(bx + 7, -42);
  ctx.lineTo(bx + 15, -62 - flicker * 0.5);
  ctx.lineTo(bx + 23, -42);
  ctx.closePath();
  ctx.fill();

  // 2. Tilted / Smashed Streetlamp
  ctx.save();
  ctx.translate(155, 0);
  ctx.rotate(0.18);
  ctx.fillStyle = '#475569';
  ctx.fillRect(-3, -118, 6, 118);
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(-3, -118, 22, 5);
  // Sparking broken bulb
  if (Math.sin(time * 18 + x) > 0.25) {
    ctx.fillStyle = '#FEF08A';
    ctx.beginPath();
    ctx.arc(16, -110, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 3. Overturned / Wrecked Sagra Stall & Scattered Bottles
  const sx = w * 0.55;
  ctx.save();
  ctx.translate(sx, 0);
  ctx.rotate(-0.14);
  ctx.fillStyle = '#78350F';
  ctx.fillRect(0, -44, 96, 44);
  ctx.fillStyle = '#991B1B';
  ctx.fillRect(-6, -54, 108, 12);
  // Graffiti / Banner: "NOTTE DEL GIUDIZIO"
  ctx.fillStyle = '#18181B';
  ctx.fillRect(8, -36, 80, 20);
  ctx.fillStyle = '#EF4444';
  ctx.font = '800 8px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TUTTO CONCESSO', 48, -26);
  ctx.restore();

  // Fallen bottles & knocked-over trash can on pavement
  ctx.fillStyle = '#16A34A';
  ctx.fillRect(sx + 125, -7, 13, 6);
  ctx.fillStyle = '#F59E0B';
  ctx.fillRect(sx + 148, -6, 12, 5);

  ctx.save();
  ctx.translate(w - 52, -12);
  ctx.rotate(1.42);
  ctx.fillStyle = '#64748B';
  ctx.fillRect(-12, -16, 24, 32);
  ctx.restore();

  ctx.restore();
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

  if (p.kind === 'ledge') {
    ctx.fillStyle = 'rgba(255, 250, 235, 0.35)';
    ctx.fillRect(p.x, p.y, p.w, 4);
    ctx.fillStyle = 'rgba(28, 25, 23, 0.28)';
    ctx.fillRect(p.x, p.y + 4, p.w, 3);
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

  // Head: Crisp 8-bit pixel-art sprite modeled after Sindaco Graziani
  const headImg = getMayorHeadCanvas();
  if (headImg && p.hitFlashTimer <= 0) {
    const headW = 28;
    const headH = Math.round((headImg.height / headImg.width) * headW);
    const tilt = Math.max(-0.08, Math.min(0.08, (p.vx / 400) * 0.07 * p.facing));

    ctx.save();
    ctx.translate(0, -42);
    ctx.rotate(tilt);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(headImg, Math.round(-headW / 2), Math.round(-headH / 2), headW, headH);
    ctx.restore();
  } else {
    // Solid white hit-flash head silhouette
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-10, -52, 20, 22);
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
  if (e.kind === 'tifoso') shirt = '#1D4ED8';
  if (e.kind === 'drunk_citizen') shirt = '#15803D';
  if (e.kind === 'armed_purger') shirt = '#27272A';
  if (e.kind === 'vandal') shirt = '#7F1D1D';
  if (e.hitFlash > 0 || (isWindup && Math.floor(time * 20) % 2 === 0)) {
    shirt = '#FCA5A5';
  }

  ctx.fillStyle = shirt;
  ctx.beginPath();
  ctx.roundRect(-12, -31, 24, 21, 4);
  ctx.fill();

  // Soccer jersey stripes & scarf for Tifoso Rissoso
  if (e.kind === 'tifoso') {
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(-6, -31, 5, 21);
    ctx.fillRect(4, -31, 5, 21);
    ctx.fillStyle = '#FACC15';
    ctx.fillRect(-13, -32, 26, 4);
  }

  // Head / Mask
  if (e.kind === 'armed_purger') {
    // Eerie smiling white Purge-style carnival mask!
    ctx.fillStyle = e.hitFlash > 0 ? '#FFFFFF' : '#F8FAFC';
    ctx.beginPath();
    ctx.arc(0, -39, 10.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#991B1B';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Glowing dark eye slits & painted red grin
    ctx.fillStyle = '#09090B';
    ctx.fillRect(1, -42, 6, 3);
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(3, -36, 4.5, 0.1, Math.PI * 0.85);
    ctx.stroke();
  } else {
    // Greenish face when drunk & about to vomit, otherwise flushed red
    const faceColor =
      e.hitFlash > 0
        ? '#FFFFFF'
        : e.kind === 'drunk_citizen'
          ? isWindup
            ? '#A3E635'
            : '#F59E8B'
          : '#F89B7E';
    ctx.fillStyle = faceColor;
    ctx.beginPath();
    ctx.arc(0, -39, 10, 0, Math.PI * 2);
    ctx.fill();

    // Hair / Hat
    if (e.kind === 'charger') {
      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.arc(-2, -43, 9.5, Math.PI * 0.85, Math.PI * 2);
      ctx.fill();
    } else if (e.kind === 'councilor_boss') {
      ctx.fillStyle = '#FACC15';
      ctx.beginPath();
      ctx.arc(0, -44, 10.5, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-12, -45, 24, 3);
    } else if (e.kind === 'tifoso') {
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(-10, -46, 20, 4);
      ctx.fillStyle = '#292524';
      ctx.fillRect(-9, -49, 18, 4);
    } else if (e.kind === 'vandal') {
      // Dark hood + bandana
      ctx.fillStyle = '#18181B';
      ctx.beginPath();
      ctx.arc(0, -42, 10.5, Math.PI * 0.8, Math.PI * 2.1);
      ctx.fill();
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(-7, -37, 16, 6);
    } else {
      ctx.fillStyle = '#292524';
      ctx.fillRect(-9, -48, 18, 6);
    }

    // Angry furrowed eyebrow + open shouting mouth (or dizzy eyes for drunk)
    ctx.strokeStyle = '#1C1917';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(0, -43);
    ctx.lineTo(7, -40);
    ctx.stroke();

    ctx.fillStyle = '#1C1917';
    ctx.fillRect(3, -39, 2.5, 2.5);
    ctx.fillStyle = e.kind === 'drunk_citizen' && isWindup ? '#65A30D' : '#7F1D1D';
    ctx.beginPath();
    ctx.ellipse(4, -34, 3.8, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Prop held in hand!
  if (e.kind === 'charger') {
    ctx.fillStyle = '#D97706';
    ctx.fillRect(6, -26, 15, 5);
  } else if (e.kind === 'flyer_thrower') {
    ctx.fillStyle = '#FDE047';
    ctx.beginPath();
    ctx.moveTo(6, -34);
    ctx.lineTo(18, -39);
    ctx.lineTo(18, -29);
    ctx.closePath();
    ctx.fill();
  } else if (e.kind === 'tifoso') {
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(9, -52, 3, 34);
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(12, -52, 14, 7);
    ctx.fillStyle = '#1D4ED8';
    ctx.fillRect(12, -45, 14, 6);
  } else if (e.kind === 'drunk_citizen') {
    // Tipped green wine/liquor bottle!
    ctx.save();
    ctx.translate(10, -25);
    ctx.rotate(0.5 + Math.sin(time * 5) * 0.25);
    ctx.fillStyle = '#16A34A';
    ctx.fillRect(-3, -12, 6, 14);
    ctx.fillRect(-1.5, -17, 3, 5);
    ctx.restore();
  } else if (e.kind === 'armed_purger' || e.kind === 'councilor_boss') {
    // Baseball bat / iron crowbar!
    ctx.save();
    ctx.translate(8, -24);
    ctx.rotate(isWindup ? -0.9 : -0.35);
    ctx.fillStyle = e.kind === 'councilor_boss' ? '#EF4444' : '#D97706';
    ctx.fillRect(-2, -22, 5, 24);
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(-3, -24, 7, 4);
    ctx.restore();
  } else if (e.kind === 'vandal') {
    // Bottle / Sledgehammer
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(8, -34, 6, 14);
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(10, -39, 2, 5);
  } else {
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
      const startPipX = cx - ((e.maxHp - 1) * 16) / 2;
      for (let i = 0; i < e.maxHp; i++) {
        ctx.fillStyle = i < e.hp ? '#EF4444' : '#334155';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(startPipX + i * 16, e.y - 14, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    if (isWindup) {
      ctx.fillStyle =
        e.kind === 'drunk_citizen'
          ? '#84CC16'
          : e.pendingAction === 'throw'
            ? '#F59E0B'
            : '#EF4444';
      ctx.font = '800 22px "Bricolage Grotesque", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(e.kind === 'drunk_citizen' ? '🤢' : '!', cx, e.y - 16);
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

  if (pr.kind === 'vomit_puddle') {
    // Bubbling green puddle on street
    const fade = Math.min(1, (pr.ttl ?? 1) * 1.4);
    ctx.globalAlpha = fade;
    ctx.fillStyle = '#65A30D';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#A3E635';
    ctx.beginPath();
    ctx.ellipse(-4, -1, 10, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.rotate(pr.rotation);
  if (pr.kind === 'flyer') {
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(-8, -6, 16, 12);
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-8, -6, 16, 12);
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(-5, -2, 10, 2);
    ctx.fillRect(-5, 2, 7, 2);
  } else if (pr.kind === 'bottle') {
    // Spinning glass bottle with spark wick
    ctx.fillStyle = '#15803D';
    ctx.fillRect(-4, -8, 8, 14);
    ctx.fillRect(-2, -13, 4, 5);
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.arc(0, -14, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (pr.kind === 'vomit_arc') {
    ctx.fillStyle = '#84CC16';
    ctx.beginPath();
    ctx.arc(0, 0, pr.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#BEF264';
    ctx.beginPath();
    ctx.arc(-2, -2, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (pr.kind === 'soccer_ball') {
    // Classic black-and-white soccer ball
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath();
    ctx.arc(0, 0, pr.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(0, 0, 3.2, 0, Math.PI * 2);
    ctx.arc(-5, -4, 2.2, 0, Math.PI * 2);
    ctx.arc(5, 4, 2.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (pr.kind === 'wrench') {
    // Spinning steel wrench
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(-9, -2.5, 18, 5);
    ctx.fillStyle = '#64748B';
    ctx.beginPath();
    ctx.arc(-9, 0, 4.5, 0.5, Math.PI * 2 - 0.5);
    ctx.arc(9, 0, 4.5, Math.PI + 0.5, Math.PI - 0.5);
    ctx.fill();
  } else if (pr.kind === 'brick') {
    // Spinning red/terracotta street brick
    ctx.fillStyle = '#B91C1C';
    ctx.fillRect(-8, -5, 16, 10);
    ctx.strokeStyle = '#7F1D1D';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-8, -5, 16, 10);
    ctx.fillStyle = '#FCA5A5';
    ctx.fillRect(-5, -2, 4, 2);
    ctx.fillRect(1, 1, 4, 2);
  } else {
    // Tomato
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(0, 0, pr.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#16A34A';
    ctx.fillRect(-3, -pr.radius - 1, 6, 3);
  }
  ctx.restore();
}
