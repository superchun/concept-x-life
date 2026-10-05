import { rng } from '../lib/math';
import { LH, LW, P } from '../lib/theme';
import { PEAKS, f } from './sim';

// 关卡地形：x∈[0,1] 切成 NCOL 列，每列 4 像素宽。Lane 决定地面高度和山的最大高度。
export type Lane = { base: number; hmax: number };
export const MAIN_LANE: Lane = { base: 204, hmax: 108 };
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
    ctx.fillRect(x, 204 - h, 1, h);
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

// 小人：方身子、两只眼睛、两条会交替的腿。x 是中心，y 是脚底。
export const guy = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  step = 0,
) => {
  const l = Math.round(x - size / 2);
  const t = Math.round(y) - size - 1;
  ctx.fillStyle = color;
  ctx.fillRect(l, t, size, size);
  ctx.fillRect(l + (step % 2 ? 0 : 1), t + size, 1, 1);
  ctx.fillRect(l + size - 1 - (step % 2 ? 1 : 0), t + size, 1, 1);
  ctx.fillStyle = P.ink;
  const eh = size > 4 ? 2 : 1;
  ctx.fillRect(l + 1, t + 1, 1, eh);
  ctx.fillRect(l + size - 2, t + 1, 1, eh);
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

const MONSTER = [
  '....pppppp....',
  '..pppppppppp..',
  '.pppppppppppp.',
  '.ppwwppppwwpp.',
  'pppwkppppwkppp',
  'pppppppppppppp',
  'pppppkkkkppppp',
  'rrrrrrrrrrrrrr',
  '.rrrrrrrrrrrr.',
  '..rr..rr..rr..',
];
// BUG-001 的样子。x 是中心，y 是底边，scale 是每个格子画几个像素。
export const monster = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, squash = 0) => {
  const colors: Record<string, string> = { p: P.orange, r: P.red, w: P.white, k: P.ink };
  const sy = scale * (1 - squash);
  const sx = scale * (1 + squash);
  MONSTER.forEach((row, j) => {
    [...row].forEach((ch, i) => {
      if (ch === '.') return;
      ctx.fillStyle = colors[ch];
      ctx.fillRect(
        Math.round(x + (i - 7) * sx),
        Math.round(y - (MONSTER.length - j) * sy),
        Math.ceil(sx),
        Math.ceil(sy),
      );
    });
  });
};

// 一小簇像素烟花，age 是放出后过了几帧
export const firework = (ctx: CanvasRenderingContext2D, x: number, y: number, age: number, seed: number) => {
  if (age < 0 || age > 20) return;
  const colors = [P.yellow, P.lime, P.cyan, P.orange, P.white];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + seed;
    const r = (i % 2 ? 0.9 : 0.55) * age;
    if (age > 14 && i % 2) continue;
    ctx.fillStyle = colors[(i + seed) % colors.length | 0] ?? P.yellow;
    ctx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r + age * age * 0.02), 1, 1);
  }
};

// 到了同一座山顶的小人，按到达顺序在山顶附近排开：一排 per 个（左右交替），往上叠
export const pilePos = (peak: number, slot: number, g: Lane, per = 7): [number, number] => {
  const k = slot % per;
  const c = peakCol(peak) + (k % 2 ? -1 : 1) * Math.ceil(k / 2);
  return [cx(c), footY(c, g) - Math.floor(slot / per) * 5];
};
