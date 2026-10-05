import { P } from '../lib/theme';
import { guy } from '../ep01/world';

// 主角、小虫、天空、气泡沿用第一期的画法；这里只放第二期新增的角色和道具。
export { bubble, drawMotes, drawSky, guy, hero, monster } from '../ep01/world';

const INK: Record<string, string> = {
  w: P.white,
  g: P.grey,
  s: P.slate,
  d: P.dark,
  k: P.ink,
  y: P.yellow,
  o: P.orange,
  b: P.blue,
  n: P.navy,
  c: P.sky,
};

// 按字符图画一个像素角色。x 是中心，y 是底边；flip 左右翻转；scale 是每格画几个像素。
export const sprite = (
  ctx: CanvasRenderingContext2D,
  rows: string[],
  x: number,
  y: number,
  scale = 1,
  flip = false,
) => {
  const w = rows[0].length;
  rows.forEach((row, j) => {
    for (let i = 0; i < w; i++) {
      const ch = row[flip ? w - 1 - i : i];
      if (ch === '.') continue;
      ctx.fillStyle = INK[ch];
      ctx.fillRect(
        Math.round(x + (i - w / 2) * scale),
        Math.round(y - (rows.length - j) * scale),
        scale,
        scale,
      );
    }
  });
};

// 白熊，走路（朝左）。两帧只换腿。
const BEAR_WALK = [
  [
    '.ww.................',
    'wwwww....wwwwwwww...',
    'wkwwwwwwwwwwwwwwwww.',
    'wwwwwwwwwwwwwwwwwwww',
    'kwwwwwwwwwwwwwwwwwww',
    '.wwwwwwwwwwwwwwwwwww',
    '...gwwwwwwwwwwwwwwww',
    '....wwwwwwwwwwwwwww.',
    '....wwwggggggwwwww..',
    '....www......www....',
    '....www......www....',
    '....ggg......ggg....',
  ],
  [
    '.ww.................',
    'wwwww....wwwwwwww...',
    'wkwwwwwwwwwwwwwwwww.',
    'wwwwwwwwwwwwwwwwwwww',
    'kwwwwwwwwwwwwwwwwwww',
    '.wwwwwwwwwwwwwwwwwww',
    '...gwwwwwwwwwwwwwwww',
    '....wwwwwwwwwwwwwww.',
    '....wwwggggggwwwww..',
    '...www........www...',
    '..www..........www..',
    '..ggg..........ggg..',
  ],
];
// 白熊，坐着（正面）。yawn 时张嘴。
const BEAR_SIT = [
  '..ww........ww..',
  '.wwww......wwww.',
  '.wwwwwwwwwwwwww.',
  'wwwwwwwwwwwwwwww',
  'wwwkwwwwwwwwkwww',
  'wwwwwwwwwwwwwwww',
  'wwwwwwgkkgwwwwww',
  '.wwwwwggggwwwww.',
  '..wwwwwwwwwwww..',
  '.wwwwwwwwwwwwww.',
  'wwwwwwwwwwwwwwww',
  'wwwgwwwwwwwwgwww',
  'wwwgwwwwwwwwgwww',
  'wwwgwwwwwwwwgwww',
  'wwwwwwwwwwwwwwww',
  'gwwwwgwwwwgwwwwg',
  'gggggg....gggggg',
];
const BEAR_YAWN = BEAR_SIT.map((row, j) =>
  j === 4 ? 'wwkkwwwwwwwwkkww' : j === 7 ? '.wwwwwkkkkwwwww.' : j === 8 ? '..wwwwkkkkwwww..' : row,
);
// 白熊，蜷着睡
const BEAR_SLEEP = [
  '......wwwwwwww....',
  '.w.wwwwwwwwwwwww..',
  'wwwwwwwwwwwwwwwww.',
  'wwwwwwwwwwwwwwwwww',
  'wkkwwwwwwwwwwwwwww',
  'kwwwwwwwwwwwwwwwww',
  '.wwwggwwwwwwwggww.',
  '..gggggggggggggg..',
];
// 气泡和画像里的小熊头
const BEAR_HEAD = ['ww.....ww', 'wwwwwwwww', 'wwwwwwwww', 'wkwwwwwkw', 'wwwgkgwww', '.wwgggww.', '..wwwww..'];

export type BearPose = 'walk' | 'sit' | 'yawn' | 'sleep';
export const bear = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pose: BearPose,
  step = 0,
  flip = false,
  scale = 1,
) => {
  const rows =
    pose === 'walk' ? BEAR_WALK[step % 2] : pose === 'sit' ? BEAR_SIT : pose === 'yawn' ? BEAR_YAWN : BEAR_SLEEP;
  sprite(ctx, rows, x, y, scale, flip);
};
export const bearHead = (ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1) =>
  sprite(ctx, BEAR_HEAD, x, y, scale);

// 头顶的念头气泡，里面是一只小熊。x 是中心，y 是气泡尖的位置。
export const thought = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  const l = Math.round(x) - 7;
  const t = Math.round(y) - 15;
  ctx.fillStyle = P.white;
  ctx.fillRect(l + 1, t, 13, 1);
  ctx.fillRect(l, t + 1, 15, 11);
  ctx.fillRect(l + 1, t + 12, 13, 1);
  ctx.fillRect(l + 3, t + 13, 2, 1);
  ctx.fillRect(l + 2, t + 14, 1, 1);
  ctx.fillStyle = P.navy;
  ctx.fillRect(l + 1, t + 1, 13, 11);
  bearHead(ctx, x + 0.5, t + 10);
};

// 两个帮手是灰色的主角，和床上的主角同一比例（小人放大 2 倍）。守门人举着一张画像；赶羊的拿一根杆子。
const helper = (ctx: CanvasRenderingContext2D, x: number, y: number, step: number, blink: boolean) => {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(2, 2);
  guy(ctx, 0, 0, 8, P.slate, step, blink);
  ctx.restore();
};
export const guard = (ctx: CanvasRenderingContext2D, x: number, y: number, step = 0, blink = false) => {
  helper(ctx, x, y, step, blink);
  portrait(ctx, x + 12, y - 5);
};
export const shepherd = (ctx: CanvasRenderingContext2D, x: number, y: number, step = 0, blink = false) => {
  helper(ctx, x, y, step, blink);
  ctx.fillStyle = P.orange;
  ctx.fillRect(Math.round(x) + 7, Math.round(y) - 22, 1, 22);
  ctx.fillRect(Math.round(x) + 5, Math.round(y) - 23, 3, 1);
};
// 画像：一个小画框，里面是熊头。x 是中心，y 是底边。
export const portrait = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  const l = Math.round(x) - 6;
  const t = Math.round(y) - 11;
  ctx.fillStyle = P.orange;
  ctx.fillRect(l, t, 13, 11);
  ctx.fillStyle = P.navy;
  ctx.fillRect(l + 1, t + 1, 11, 9);
  bearHead(ctx, x + 0.5, y - 2);
};

const SHEEP = ['.wwwww..', 'wwwwwwkk', 'wwwwwwkk', '.wwwww..', '.d...d..'];
export const sheep = (ctx: CanvasRenderingContext2D, x: number, y: number, step = 0, flip = false) =>
  sprite(ctx, step % 2 ? SHEEP : [...SHEEP.slice(0, 4), '..d.d...'], x, y, 1, flip);

// 铃。ring 为真时歪向一边，铃舌甩出来。x 是中心，y 是挂点。
export const bell = (ctx: CanvasRenderingContext2D, x: number, y: number, ring = false) => {
  const l = Math.round(x) - 4 + (ring ? 1 : 0);
  const t = Math.round(y);
  ctx.fillStyle = P.grey;
  ctx.fillRect(Math.round(x), t, 1, 2);
  ctx.fillStyle = P.yellow;
  ctx.fillRect(l + 3, t + 2, 3, 1);
  ctx.fillRect(l + 2, t + 3, 5, 2);
  ctx.fillRect(l + 1, t + 5, 7, 3);
  ctx.fillRect(l, t + 8, 9, 1);
  ctx.fillStyle = P.orange;
  ctx.fillRect(l + 1, t + 7, 7, 1);
  ctx.fillRect(l + (ring ? 6 : 4), t + 9, 2, 2);
};

// 门。open 为 0 关着，1 全开（门板收成一条边，露出门外的夜色）。x 是中心，y 是地面。
export const door = (ctx: CanvasRenderingContext2D, x: number, y: number, open = 0) => {
  const l = Math.round(x) - 11;
  const t = Math.round(y) - 34;
  ctx.fillStyle = P.slate;
  ctx.fillRect(l, t, 22, 34);
  ctx.fillStyle = P.ink;
  ctx.fillRect(l + 2, t + 2, 18, 32);
  const w = Math.round(18 * (1 - open * 0.85));
  ctx.fillStyle = P.teal;
  ctx.fillRect(l + 2, t + 2, w, 32);
  ctx.fillStyle = P.dark;
  ctx.fillRect(l + 2 + w - 1, t + 2, 1, 32);
  if (w > 8) {
    ctx.fillRect(l + 4, t + 5, w - 5, 11);
    ctx.fillRect(l + 4, t + 19, w - 5, 12);
    ctx.fillStyle = P.yellow;
    ctx.fillRect(l + w - 2, t + 18, 2, 2);
  }
};

// 门上的规则牌：一块木牌，字由外层的 Txt 叠上去。x 是中心，y 是顶边。
export const board = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fixed = false) => {
  const l = Math.round(x - w / 2);
  ctx.fillStyle = P.ink;
  ctx.fillRect(l - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = fixed ? P.green : P.orange;
  ctx.fillRect(l, y, w, h);
  ctx.fillStyle = fixed ? P.teal : P.red;
  ctx.fillRect(l, y + h - 2, w, 2);
  ctx.fillStyle = P.grey;
  ctx.fillRect(l + 2, y + 2, 1, 1);
  ctx.fillRect(l + w - 3, y + 2, 1, 1);
};

// 床和躺着的主角。x 是床的中心，y 是地面。eyes：'open' 睁着，'shut' 闭着。
export const bed = (ctx: CanvasRenderingContext2D, x: number, y: number, eyes: 'open' | 'shut', breathe = 0) => {
  const l = Math.round(x) - 22;
  const t = Math.round(y) - 16;
  // 床头板和床架
  ctx.fillStyle = P.dark;
  ctx.fillRect(l, t - 6, 3, 22);
  ctx.fillRect(l + 41, t + 4, 3, 12);
  ctx.fillRect(l, t + 10, 44, 3);
  ctx.fillStyle = P.slate;
  ctx.fillRect(l + 3, t + 6, 38, 4);
  // 枕头
  ctx.fillStyle = P.white;
  ctx.fillRect(l + 4, t + 2, 10, 4);
  // 头：白脸，黄色睡帽
  ctx.fillStyle = P.white;
  ctx.fillRect(l + 6, t - 3, 6, 6);
  ctx.fillStyle = P.yellow;
  ctx.fillRect(l + 4, t - 4, 3, 7);
  ctx.fillRect(l + 3, t - 2, 1, 2);
  ctx.fillStyle = P.ink;
  if (eyes === 'open') {
    ctx.fillRect(l + 8, t - 2, 1, 2);
    ctx.fillRect(l + 10, t - 2, 1, 2);
  } else {
    ctx.fillRect(l + 8, t - 1, 1, 1);
    ctx.fillRect(l + 10, t - 1, 1, 1);
  }
  // 被子，睡着后随呼吸起伏一个像素
  ctx.fillStyle = P.blue;
  ctx.fillRect(l + 13, t - breathe, 28, 7 + breathe);
  ctx.fillStyle = P.sky;
  ctx.fillRect(l + 13, t - breathe, 28, 1);
  ctx.fillStyle = P.navy;
  ctx.fillRect(l + 13, t + 5, 28, 1);
};
