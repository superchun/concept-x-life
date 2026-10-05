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

// 白熊，走路（朝左），四脚着地时和站着的人差不多高。两帧只换腿。
const BEAR_WALK = [
  [
    '..ww..........................',
    '.wwwww.......wwwwwwwwww.......',
    'wwwwwwww..wwwwwwwwwwwwwwww....',
    'wwkwwwwwwwwwwwwwwwwwwwwwwwww..',
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwww.',
    'kkwwwwwwwwwwwwwwwwwwwwwwwwwwww',
    'kwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
    '.wwwwwwwwwwwwwwwwwwwwwwwwwwwww',
    '..ggwwwwwwwwwwwwwwwwwwwwwwwwww',
    '....wwwwwwwwwwwwwwwwwwwwwwwwww',
    '.....wwwwwwwwwwwwwwwwwwwwwwww.',
    '.....wwwwwwggggggggggwwwwwww..',
    '.....wwwww..........wwwwww....',
    '.....wwwww..........wwwwww....',
    '.....wwww...........wwwww.....',
    '.....wwww...........wwwww.....',
    '.....wwww...........wwwww.....',
    '.....gggg...........ggggg.....',
  ],
  [
    '..ww..........................',
    '.wwwww.......wwwwwwwwww.......',
    'wwwwwwww..wwwwwwwwwwwwwwww....',
    'wwkwwwwwwwwwwwwwwwwwwwwwwwww..',
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwww.',
    'kkwwwwwwwwwwwwwwwwwwwwwwwwwwww',
    'kwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
    '.wwwwwwwwwwwwwwwwwwwwwwwwwwwww',
    '..ggwwwwwwwwwwwwwwwwwwwwwwwwww',
    '....wwwwwwwwwwwwwwwwwwwwwwwwww',
    '.....wwwwwwwwwwwwwwwwwwwwwwww.',
    '.....wwwwwwggggggggggwwwwwww..',
    '....wwwww............wwwwww...',
    '...wwwww..............wwwww...',
    '..wwwww...............wwwww...',
    '..wwww.................wwwww..',
    '..wwww.................wwwww..',
    '..gggg.................ggggg..',
  ],
];
// 白熊，坐着（正面），比站着的人略高
const BEAR_SIT = [
  '..www..........www..',
  '.wwwww........wwwww.',
  '.wwwwwwwwwwwwwwwwww.',
  'wwwwwwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwwwwwww',
  'wwwwkwwwwwwwwwwkwwww',
  'wwwwkwwwwwwwwwwkwwww',
  'wwwwwwwwwwwwwwwwwwww',
  'wwwwwwwggkkggwwwwwww',
  '.wwwwwwggggggwwwwww.',
  '..wwwwwwwwwwwwwwww..',
  '.wwwwwwwwwwwwwwwwww.',
  'wwwwwwwwwwwwwwwwwwww',
  'wwwwgwwwwwwwwwwgwwww',
  'wwwwgwwwwwwwwwwgwwww',
  'wwwwgwwwwwwwwwwgwwww',
  'wwwwgwwwwwwwwwwgwwww',
  'wwwwwwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwwwwwww',
  'gwwwwwgwwwwwwgwwwwwg',
  'gwwwwwgwwwwwwgwwwwwg',
  'ggggggg......ggggggg',
];
// 打哈欠：眼睛眯起来，张嘴
const BEAR_YAWN = [
  '..www..........www..',
  '.wwwww........wwwww.',
  '.wwwwwwwwwwwwwwwwww.',
  'wwwwwwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwwwwwww',
  'wwwkkkwwwwwwwwkkkwww',
  'wwwwwwwwwwwwwwwwwwww',
  'wwwwwwwggkkggwwwwwww',
  '.wwwwwwwkkkkwwwwwww.',
  '..wwwwwwkkkkwwwwww..',
  '.wwwwwwwwwwwwwwwwww.',
  'wwwwwwwwwwwwwwwwwwww',
  'wwwwgwwwwwwwwwwgwwww',
  'wwwwgwwwwwwwwwwgwwww',
  'wwwwgwwwwwwwwwwgwwww',
  'wwwwgwwwwwwwwwwgwwww',
  'wwwwwwwwwwwwwwwwwwww',
  'wwwwwwwwwwwwwwwwwwww',
  'gwwwwwgwwwwwwgwwwwwg',
  'gwwwwwgwwwwwwgwwwwwg',
  'ggggggg......ggggggg',
];
// 白熊，蜷着睡：头枕在前爪上，耳朵和闭着的眼睛朝外
const BEAR_SLEEP = [
  '..........wwwwwwwwww........',
  '..ww....wwwwwwwwwwwwwww.....',
  '.wwww.wwwwwwwwwwwwwwwwwww...',
  'wwwwwwwwwwwwwwwwwwwwwwwwww..',
  'wwwwwwwwwwwwwwwwwwwwwwwwwww.',
  'wwkkkwwwwgwwwwwwwwwwwwwwwwww',
  'wwwwwwwwwgwwwwwwwwwwwwwwwwww',
  'kkwwwwwwgwwwwwwwwwwwwwwwwwww',
  'kwwwwwwggwwwwwwwwwwwwwwwwwww',
  '.wwwwwwwwwwwwwwwwwwwggggwww.',
  '..wwwgggwwwwwwwwwwggggggww..',
  '...gggggggggggggggggggggg...',
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

// 气泡和画像里可以装的东西：白熊，或者每个人自己的那一样
export type IconKind = 'bear' | 'note' | 'talk' | 'paper' | 'face';
// x 是中心，y 是底边，占 9×7 格
export const icon = (ctx: CanvasRenderingContext2D, kind: IconKind, x: number, y: number) => {
  const l = Math.round(x - 0.5);
  const t = Math.round(y);
  if (kind === 'bear') return bearHead(ctx, x, y);
  if (kind === 'note') {
    ctx.fillStyle = P.sky;
    ctx.fillRect(l + 1, t - 7, 1, 6);
    ctx.fillRect(l + 1, t - 7, 3, 2);
    ctx.fillRect(l - 2, t - 3, 4, 3);
  } else if (kind === 'talk') {
    ctx.fillStyle = P.white;
    ctx.fillRect(l - 4, t - 7, 9, 5);
    ctx.fillRect(l - 2, t - 2, 2, 1);
    ctx.fillStyle = P.ink;
    for (let i = 0; i < 3; i++) ctx.fillRect(l - 2 + i * 2, t - 5, 1, 1);
  } else if (kind === 'paper') {
    ctx.fillStyle = P.white;
    ctx.fillRect(l - 3, t - 7, 7, 7);
    ctx.fillStyle = P.grey;
    ctx.fillRect(l - 2, t - 3, 5, 1);
    ctx.fillRect(l - 2, t - 1, 3, 1);
    ctx.fillStyle = P.orange;
    ctx.fillRect(l - 2, t - 6, 3, 2);
  } else {
    ctx.fillStyle = P.orange;
    ctx.fillRect(l - 2, t - 7, 4, 3);
    ctx.fillRect(l - 4, t - 3, 8, 3);
  }
};

// 头顶的念头气泡。x 是中心，y 是气泡尖的位置。
export const thought = (ctx: CanvasRenderingContext2D, x: number, y: number, kind: IconKind = 'bear') => {
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
  icon(ctx, kind, x + 0.5, t + 10);
};

// 两个帮手是灰色的主角，和床上的主角同一比例（小人放大 2 倍）。守门人举着一张画像；赶羊的拿一根杆子。
const helper = (ctx: CanvasRenderingContext2D, x: number, y: number, step: number, blink: boolean, lying = false) => {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y) - (lying ? 5 : 0));
  if (lying) ctx.rotate(-Math.PI / 2);
  ctx.scale(2, 2);
  guy(ctx, 0, 0, 8, P.slate, step, blink);
  ctx.restore();
};
export const guard = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  step = 0,
  blink = false,
  kind: IconKind = 'bear',
) => {
  helper(ctx, x, y, step, blink);
  portrait(ctx, x + 12, y - 5, kind);
};
// lying：累倒了，躺在地上
export const shepherd = (ctx: CanvasRenderingContext2D, x: number, y: number, step = 0, blink = false, lying = false) => {
  helper(ctx, x, y, step, blink || lying, lying);
  ctx.fillStyle = P.orange;
  if (lying) {
    ctx.fillRect(Math.round(x) - 4, Math.round(y) - 1, 22, 1);
    return;
  }
  ctx.fillRect(Math.round(x) + 7, Math.round(y) - 22, 1, 22);
  ctx.fillRect(Math.round(x) + 5, Math.round(y) - 23, 3, 1);
};
// 画像：一个小画框。x 是中心，y 是底边。
export const portrait = (ctx: CanvasRenderingContext2D, x: number, y: number, kind: IconKind = 'bear') => {
  const l = Math.round(x) - 6;
  const t = Math.round(y) - 11;
  ctx.fillStyle = P.orange;
  ctx.fillRect(l, t, 13, 11);
  ctx.fillStyle = P.navy;
  ctx.fillRect(l + 1, t + 1, 11, 9);
  icon(ctx, kind, x + 0.5, y - 2);
};

// 门上的锁。x 是中心，y 是底边。
export const lock = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  const l = Math.round(x) - 2;
  const t = Math.round(y);
  ctx.fillStyle = P.grey;
  ctx.fillRect(l + 1, t - 7, 3, 1);
  ctx.fillRect(l + 1, t - 6, 1, 2);
  ctx.fillRect(l + 3, t - 6, 1, 2);
  ctx.fillStyle = P.yellow;
  ctx.fillRect(l, t - 4, 5, 4);
  ctx.fillStyle = P.ink;
  ctx.fillRect(l + 2, t - 3, 1, 2);
};
// 睡着时飘出来的 z。x、y 是左上角。
export const zed = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.fillStyle = P.white;
  ctx.fillRect(Math.round(x), Math.round(y), 3, 1);
  ctx.fillRect(Math.round(x) + 1, Math.round(y) + 1, 1, 1);
  ctx.fillRect(Math.round(x), Math.round(y) + 2, 3, 1);
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

// 床和躺着的人。x 是床的中心，y 是地面。eyes：'open' 睁着，'shut' 闭着。cap 是睡帽的颜色，主角是黄色。
export const bed = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  eyes: 'open' | 'shut',
  breathe = 0,
  cap: string = P.yellow,
) => {
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
  ctx.fillStyle = cap;
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
