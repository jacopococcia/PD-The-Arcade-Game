// 8-bit pixel-art sprite generator modeled after Sindaco Graziani:
// - Voluminous wavy silver-grey / salt-and-pepper hair
// - Signature thick dark eyebrows & light blue-grey eyes
// - Clean-shaven warm face with friendly smile (no mustache)
// - Open-collar white shirt, navy blazer & tricolore sash (in bust portrait)

const PALETTE: Record<string, string> = {
  '.': '', // transparent
  O: '#18181B', // 8-bit dark outline
  H: '#F1F5F9', // silver hair highlight
  G: '#CBD5E1', // silver hair mid
  S: '#94A3B8', // silver hair shadow
  D: '#64748B', // salt-and-pepper dark grey
  B: '#1E293B', // thick dark eyebrows / pupils
  W: '#FFFFFF', // sclera / shirt / teeth glint
  E: '#64748B', // blue-grey iris
  K: '#F6C8AA', // skin highlight
  F: '#E8AC89', // skin base
  N: '#CC8662', // skin shadow / nose / cheek fold
  M: '#9E5341', // mouth / smile line
  J: '#1E3A5F', // navy blazer
  L: '#162B47', // navy blazer shadow
  C: '#CBD5E1', // shirt collar shadow
  V: '#16A34A', // tricolore green
  R: '#DC2626', // tricolore red
};

// 18x20 8-bit head sprite (3/4 right-facing Mario Bros proportions)
const HEAD_8BIT_ROWS = [
  '.....OOOOOOO......',
  '...OOHGHGHGGSO....',
  '..OHGHGGHGGGGDSO..',
  '.OHGSDGGHGGSGDDDO.',
  '.OGDGGGSSSSGGDSSO.',
  '.OSGFFKKKKKFFSSDO.',
  '.OSFFKKKKKKKFFSDO.',
  '.ONFFBBBBFBBBBFNO.',
  '.ONFFWBEFFWBEFFNO.',
  'OOFKKKKKKKKKKKFNO.',
  'OFNFKKKKKKNKKKFFO.',
  '.OFFKKKKKNNNKKFFO.',
  '.OFFKKKMMMMMKFFO..',
  '..OFKKMWWWWWMFFO..',
  '..OFFKKKKKKKKFFO..',
  '...ONFFKKKKKFFO...',
  '....ONNFFFFNNO....',
  '.....OOOOOOOO.....',
];

// 28x30 8-bit bust portrait for Title Screen & Victory Modal
const PORTRAIT_8BIT_ROWS = [
  '........OOOOOOOOOOOO........',
  '......OOHGHGHGGHGGSSOO......',
  '....OOHGHGGHGGGHGGGGDSO.....',
  '...OHGGSDGGHGGHGGSGDDDDO....',
  '..OHGGDGGGSSGHGGSSGGDDSSO...',
  '..OGSDGGGGSSSSGGSSSGGDSSO...',
  '..OSGGDFFFFKKKKKKFFFFSSDO...',
  '..OSGDFFKKKKKKKKKKKKFFSSO...',
  '..ONSDFFKKKKKKKKKKKKFFNNO...',
  '..ONNFFBBBBBFKKFBBBBBFFNO...',
  '.OONFFFWEBWWFKKFWEBWWFFNOO..',
  '.OFNFFFKKKKKFNNFKKKKKFFNFO..',
  '.OFNFFFKKKKKNNNNKKKKKFFNFO..',
  '..ONFFFFKKKKNKKNKKKKFFFNO...',
  '..OOFFFFKKKKKKKKKKKKFFFOO...',
  '...OFFFFKKMMMMMMMKKKFFFO....',
  '...ONFFFKKMWWWWWMKKKFFNO....',
  '....ONFFFKKKKKKKKKKFFNO.....',
  '.....ONNFFKKKKKKKKFNNO......',
  '......OONNFFFFFFFFNOO.......',
  '.....OJJONNFFFFFFNOJJO......',
  '...OOJJJOWNFFFFFFNOJJJOO....',
  '..OJJJJJOWWNNNNNNWOJJJJJO...',
  '.OJJJJVRVOWWWWWWWWOJJJJJJO..',
  '.OJJJVRVWOWWWWWWWWOJJJJJJO..',
  'OJJJVRVWWWCWWWWWWCWWJJJJJJO.',
  'OJJVRVWWWWWWWWWWWWWWWJJJJJO.',
  'OJVRVWWJJJWWWWWWWWJJJJJJJJO.',
  'OLRVWWJJJJJWWWWWWJJJJJJJJLO.',
  'OOOOOOOOOOOOOOOOOOOOOOOOOOOO',
];

let cachedHeadCanvas: HTMLCanvasElement | null = null;
let cachedPortraitDataUrl: string | null = null;

function renderPixelMatrix(
  rows: string[],
  scale = 1
): HTMLCanvasElement {
  const height = rows.length;
  const width = rows[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = false;

  for (let y = 0; y < height; y++) {
    const row = rows[y];
    for (let x = 0; x < width; x++) {
      const ch = row[x];
      const color = PALETTE[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }

  return canvas;
}

export function getMayorHeadCanvas(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  if (!cachedHeadCanvas) {
    cachedHeadCanvas = renderPixelMatrix(HEAD_8BIT_ROWS, 1);
  }
  return cachedHeadCanvas;
}

export function getMayorPortraitDataUrl(): string {
  if (typeof document === 'undefined') return '';
  if (!cachedPortraitDataUrl) {
    const canvas = renderPixelMatrix(PORTRAIT_8BIT_ROWS, 6);
    cachedPortraitDataUrl = canvas.toDataURL('image/png');
  }
  return cachedPortraitDataUrl;
}
