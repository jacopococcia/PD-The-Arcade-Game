const MAYOR_PHOTO_URL = '/assets/aistudio/graziani-sindaco_dafad287.jpg';

let headCanvas: HTMLCanvasElement | null = null;
let portraitDataUrl: string | null = null;
let loadStarted = false;
const listeners = new Set<(url: string) => void>();

function removeGreenScreen(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  const imgData = ctx.getImageData(0, 0, width, height);
  const d = imgData.data;

  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];

    // Measure how much green dominates over max(r, b)
    const maxRB = Math.max(r, b);
    const greenExcess = g - maxRB;

    if (greenExcess > 24 && g > 75) {
      // Pure green screen background -> fully transparent
      d[i + 3] = 0;
    } else if (greenExcess > 6 && g > 65) {
      // Soft edge feathering + green despill
      const factor = 1 - (greenExcess - 6) / 18;
      d[i + 3] = Math.round(d[i + 3] * Math.max(0, Math.min(1, factor)));
      d[i + 1] = Math.min(g, maxRB + 4);
    }
  }

  ctx.putImageData(imgData, 0, 0);
}

export function initMayorSprite(): void {
  if (loadStarted || typeof window === 'undefined') return;
  loadStarted = true;

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = MAYOR_PHOTO_URL;

  img.onload = () => {
    try {
      // 1. Full portrait cutout for UI cards (Title Screen & Victory)
      const pCanvas = document.createElement('canvas');
      pCanvas.width = img.naturalWidth;
      pCanvas.height = img.naturalHeight;
      const pCtx = pCanvas.getContext('2d');
      if (pCtx) {
        pCtx.drawImage(img, 0, 0);
        removeGreenScreen(pCtx, pCanvas.width, pCanvas.height);
        portraitDataUrl = pCanvas.toDataURL('image/png');
        listeners.forEach((cb) => cb(portraitDataUrl!));
      }

      // 2. Tight head cutout (hair to chin) for the 2D platformer sprite
      const cropX = Math.round(img.naturalWidth * 0.06);
      const cropY = Math.round(img.naturalHeight * 0.015);
      const cropW = Math.round(img.naturalWidth * 0.88);
      const cropH = Math.round(img.naturalHeight * 0.62);

      const hCanvas = document.createElement('canvas');
      const targetW = 96;
      const targetH = Math.round((cropH / cropW) * targetW);
      hCanvas.width = targetW;
      hCanvas.height = targetH;

      const hCtx = hCanvas.getContext('2d');
      if (hCtx) {
        hCtx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, targetW, targetH);
        removeGreenScreen(hCtx, targetW, targetH);

        // Trim bottom shoulders/collar corners slightly into a clean head-and-jaw oval
        hCtx.globalCompositeOperation = 'destination-in';
        hCtx.beginPath();
        hCtx.ellipse(
          targetW / 2,
          targetH * 0.48,
          targetW * 0.48,
          targetH * 0.49,
          0,
          0,
          Math.PI * 2
        );
        hCtx.fill();
        hCtx.globalCompositeOperation = 'source-over';

        headCanvas = hCanvas;
      }
    } catch {
      // Fallback vector sprite remains active
    }
  };
}

export function getMayorHeadCanvas(): HTMLCanvasElement | null {
  if (!loadStarted) initMayorSprite();
  return headCanvas;
}

export function subscribeMayorPortrait(cb: (url: string) => void): () => void {
  if (!loadStarted) initMayorSprite();
  if (portraitDataUrl) {
    cb(portraitDataUrl);
  }
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}
