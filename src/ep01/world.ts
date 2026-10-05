import { BLOCK, FONT, TEXT, rgba, type Rgb } from '../lib/theme';
import { PEAKS, f } from './sim';

// 地形画成一列列方块，像横版游戏的关卡。x∈[0,1] 映射到 NCOL 列。
export const X0 = 120;
export const X1 = 1800;
export const BASE = 850;
export const HMAX = 440;
export const NCOL = 112;
export const CW = (X1 - X0) / NCOL;

export const colOf = (x: number) => Math.min(NCOL - 1, Math.max(0, Math.floor(x * NCOL)));
export const colH = (c: number) => Math.round((f((c + 0.5) / NCOL) * HMAX) / 6) * 6;
export const colX = (c: number) => X0 + c * CW;
// 第 k 座山顶的屏幕坐标
export const peakXY = (k: number): [number, number] => {
  const c = colOf(PEAKS[k][0]);
  return [colX(c) + CW / 2, BASE - colH(c)];
};

export const drawTerrain = (ctx: CanvasRenderingContext2D, alpha = 1) => {
  for (let c = 0; c < NCOL; c++) {
    const h = colH(c);
    const x = colX(c);
    ctx.fillStyle = rgba(BLOCK, alpha);
    ctx.fillRect(x, BASE - h, CW - 1, h);
    ctx.fillStyle = rgba(TEXT, 0.5 * alpha);
    ctx.fillRect(x, BASE - h, CW - 1, 3);
  }
  ctx.fillStyle = rgba(TEXT, 0.25 * alpha);
  ctx.fillRect(X0, BASE, X1 - X0, 2);
};

// 一个小方块，站在第 c 列顶上；k 是它在这一列里叠到第几层
export const agent = (
  ctx: CanvasRenderingContext2D,
  c: number,
  k: number,
  size: number,
  color: Rgb,
  alpha = 1,
  dy = 0,
) => {
  if (alpha <= 0.01) return;
  ctx.fillStyle = rgba(color, alpha);
  ctx.fillRect(colX(c) + (CW - 1 - size) / 2, BASE - colH(c) - 3 - (k + 1) * (size + 1) + dy, size, size);
};

export const label = (
  ctx: CanvasRenderingContext2D,
  str: string,
  sx: number,
  sy: number,
  o: { size?: number; c?: Rgb; alpha?: number; font?: string; align?: CanvasTextAlign; weight?: number } = {},
) => {
  const alpha = o.alpha ?? 1;
  if (alpha <= 0.01) return;
  ctx.font = `${o.weight ?? 600} ${o.size ?? 26}px ${o.font ?? FONT.sans}`;
  ctx.textAlign = o.align ?? 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = rgba(o.c ?? TEXT, alpha);
  ctx.fillText(str, sx, sy);
};
