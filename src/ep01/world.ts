import { rng } from '../lib/math';
import { LH, LW, P } from '../lib/theme';
import { PEAKS, f } from './sim';

// 关卡地形：x∈[0,1] 切成 NCOL 列，每列 4 像素宽。Lane 决定地面高度和山的最大高度。
export type Lane = { base: number; hmax: number };
export const MAIN_LANE: Lane = { base: 222, hmax: 120 };
export const X0 = 16;
export const CW = 4;
export const NCOL = 112;

export const colOf = (x: number) => Math.min(NCOL - 1, Math.max(0, Math.floor(x * NCOL)));
export const colH = (c: number, g: Lane) => Math.round(f((c + 0.5) / NCOL) * g.hmax);
// 第 c 列的中心 x 和地面 y
export const cx = (c: number) => X0 + c * CW + 2;
export const footY = (c: number, g: Lane) => g.base - colH(Math.min(NCOL - 1, Math.max(0, c)), g);
export const peakCol = (k: number) => colOf(PEAKS[k][0]);

const STARS = (() => {
  const r = rng(5);
  return Array.from({ length: 80 }, () => ({ x: Math.floor(r() * LW), y: Math.floor(r() * 190), ph: r() * 6.28 }));
})();

export const drawSky = (ctx: CanvasRenderingContext2D, fr: number, hills = true, shift = 0) => {
  ctx.fillStyle = P.ink;
  ctx.fillRect(0, 0, LW, LH);
  for (const s of STARS) {
    const tw = Math.sin(fr * 0.06 + s.ph);
    if (tw < -0.4) continue;
    ctx.fillStyle = tw > 0.6 ? P.grey : P.slate;
    ctx.fillRect(s.x, s.y, 1, 1);
  }
  if (!hills) return;
  // 远山剪影，镜头移动时跟得慢一些
  ctx.fillStyle = '#20233a';
  for (let x = 0; x < LW; x++) {
    const u = x + shift;
    const h = Math.round(34 + 14 * Math.sin(u * 0.021) + 8 * Math.sin(u * 0.057 + 1));
    ctx.fillRect(x, 222 - h, 1, h);
  }
};

export const drawTerrain = (ctx: CanvasRenderingContext2D, g: Lane) => {
  ctx.fillStyle = P.dark;
  ctx.fillRect(-LW, g.base, LW * 3, LH);
  ctx.fillStyle = P.green;
  ctx.fillRect(-LW, g.base, LW * 3, 1);
  for (let c = 0; c < NCOL; c++) {
    const h = colH(c, g);
    const x = X0 + c * CW;
    ctx.fillStyle = P.dark;
    ctx.fillRect(x, g.base - h, CW, h);
    ctx.fillStyle = P.lime;
    ctx.fillRect(x, g.base - h, CW, 1);
    ctx.fillStyle = P.green;
    ctx.fillRect(x, g.base - h + 1, CW, 1);
    // 土里零星的石子
    const k = (c * 7919) % 11;
    if (k < 3 && h > 8) {
      ctx.fillStyle = P.slate;
      ctx.fillRect(x + (k % 3), g.base - h + 4 + ((c * 31) % (h - 6)), 1, 1);
    }
  }
};

// 小人。x 是中心，y 是脚底。size ≤ 4 画 3×5 的小号（头 + 上衣 + 腿），否则画 5×10 的大号（带帽子）。
// color 是衣服和帽子的颜色，头一直是白的。
export const guy = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  step = 0,
) => {
  if (size <= 4) {
    const l = Math.round(x) - 1;
    const t = Math.round(y) - 5;
    ctx.fillStyle = P.white;
    ctx.fillRect(l, t, 3, 2);
    ctx.fillStyle = color;
    ctx.fillRect(l, t + 2, 3, 2);
    ctx.fillRect(step % 2 ? l + 1 : l, t + 4, 1, 1);
    if (step % 2 === 0) ctx.fillRect(l + 2, t + 4, 1, 1);
    return;
  }
  const l = Math.round(x) - 2;
  const t = Math.round(y) - 10;
  ctx.fillStyle = color;
  ctx.fillRect(l + 1, t, 3, 1);
  ctx.fillRect(l, t + 1, 5, 1);
  ctx.fillRect(l, t + 5, 5, 1);
  ctx.fillRect(l + 1, t + 6, 3, 2);
  ctx.fillStyle = P.white;
  ctx.fillRect(l + 1, t + 2, 3, 3);
  ctx.fillStyle = P.ink;
  ctx.fillRect(l + 1, t + 3, 1, 1);
  ctx.fillRect(l + 3, t + 3, 1, 1);
  ctx.fillStyle = P.grey;
  ctx.fillRect(l + 1, t + 8, 1, step % 2 ? 1 : 2);
  ctx.fillRect(l + 3, t + 8, 1, step % 2 ? 2 : 1);
};

// 头顶的「…」气泡
export const bubble = (ctx: CanvasRenderingContext2D, x: number, y: number, fr: number) => {
  const l = Math.round(x) - 5;
  const t = Math.round(y) - 8;
  ctx.fillStyle = P.white;
  ctx.fillRect(l, t, 11, 6);
  ctx.fillRect(l + 4, t + 6, 2, 1);
  ctx.fillStyle = P.ink;
  for (let i = 0; i < 3; i++) if (Math.floor(fr / 8) % 4 > i || fr < 0) ctx.fillRect(l + 2 + i * 3, t + 3, 1, 1);
};

export const flag = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, fr = 0) => {
  ctx.fillStyle = P.grey;
  ctx.fillRect(Math.round(x), Math.round(y) - 11, 1, 11);
  ctx.fillStyle = color;
  const w = Math.floor(fr / 6) % 2;
  ctx.fillRect(Math.round(x) + 1, Math.round(y) - 11, 5 + w, 2);
  ctx.fillRect(Math.round(x) + 1, Math.round(y) - 9, 6 - w, 2);
};

// 小山顶上的三样东西：外卖店、工位、沙发。x 是中心，y 是底边。
export const shop = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.fillStyle = P.white;
  ctx.fillRect(x - 6, y - 8, 12, 8);
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i % 2 ? P.white : P.red;
    ctx.fillRect(x - 7 + i * 2, y - 11, 2, 3);
  }
  ctx.fillStyle = P.ink;
  ctx.fillRect(x + 1, y - 5, 3, 5);
  ctx.fillStyle = P.sky;
  ctx.fillRect(x - 4, y - 6, 3, 3);
};
export const desk = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.fillStyle = P.grey;
  ctx.fillRect(x - 6, y - 5, 12, 2);
  ctx.fillRect(x - 5, y - 3, 1, 3);
  ctx.fillRect(x + 4, y - 3, 1, 3);
  ctx.fillStyle = P.slate;
  ctx.fillRect(x - 3, y - 11, 7, 5);
  ctx.fillRect(x, y - 6, 1, 1);
  ctx.fillStyle = P.cyan;
  ctx.fillRect(x - 2, y - 10, 5, 3);
};
export const sofa = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.fillStyle = P.plum;
  ctx.fillRect(x - 6, y - 8, 12, 4);
  ctx.fillStyle = P.red;
  ctx.fillRect(x - 7, y - 5, 14, 4);
  ctx.fillRect(x - 7, y - 7, 2, 3);
  ctx.fillRect(x + 5, y - 7, 2, 3);
  ctx.fillStyle = P.ink;
  ctx.fillRect(x - 6, y - 1, 1, 1);
  ctx.fillRect(x + 5, y - 1, 1, 1);
};

// BUG-001：一只蓝色甲虫，有触角、斑点和六条腿
const MONSTER = [
  '..a..........a..',
  '...a........a...',
  '....bbbbbbbb....',
  '..bbbbbbbbbbbb..',
  '.bbwwbbbbbbwwbb.',
  '.bbwkbbssbbwkbb.',
  'lbbbbbbssbbbbbbl',
  '.bbsbbbbbbbbsbb.',
  'lbbbbbbbbbbbbbbl',
  '..dddddddddddd..',
  '.l..l......l..l.',
];
// x 是中心，y 是底边，scale 是每个格子画几个像素
export const monster = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, squash = 0) => {
  const colors: Record<string, string> = { b: P.sky, d: P.blue, s: P.navy, a: P.grey, l: P.grey, w: P.white, k: P.ink };
  const sy = scale * (1 - squash);
  const sx = scale * (1 + squash);
  MONSTER.forEach((row, j) => {
    [...row].forEach((ch, i) => {
      if (ch === '.') return;
      ctx.fillStyle = colors[ch];
      ctx.fillRect(
        Math.round(x + (i - 8) * sx),
        Math.round(y - (MONSTER.length - j) * sy),
        Math.ceil(sx),
        Math.ceil(sy),
      );
    });
  });
};

// 像素烟花：先一道上升的尾迹，再炸开。age 是炸开后过了几帧，size 控制炸多大。
export const firework = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  age: number,
  seed: number,
  size = 1,
  fromY = y,
) => {
  if (age < -8 || age > 22) return;
  const colors = [P.yellow, P.lime, P.cyan, P.orange, P.white];
  if (age < 0) {
    ctx.fillStyle = P.white;
    const ry = Math.round(y + (fromY - y) * (-age / 8));
    ctx.fillRect(Math.round(x), ry, 1, 3);
    return;
  }
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + seed;
    const r = (i % 2 ? 0.9 : 0.55) * age * size;
    if (age > 15 && i % 2) continue;
    ctx.fillStyle = colors[(i + seed) % colors.length];
    const d = age < 6 ? 2 : 1;
    ctx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r + age * age * 0.02), d, d);
  }
};

// 到了同一座山顶的小人，按到达顺序在山顶附近排开：一排 per 个（左右交替），往上叠
export const pilePos = (peak: number, slot: number, g: Lane, per = 7): [number, number] => {
  const k = slot % per;
  const c = peakCol(peak) + (k % 2 ? -1 : 1) * Math.ceil(k / 2);
  return [cx(c), footY(c, g) - Math.floor(slot / per) * 5];
};
