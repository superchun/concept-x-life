import React, { useCallback, useMemo } from 'react';
import { Canvas, type Draw } from './Canvas';
import { ease, easeOut, lerp, p, rng } from './math';
import { FONT, H, W, rgba, type Rgb } from './theme';

type Pt = { tx: number; ty: number; sx: number; sy: number; d: number; ph: number };

const sample = (text: string, size: number, cy: number, step: number): Pt[] => {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${size}px ${FONT.serif}`;
  ctx.fillText(text, W / 2, cy);
  const data = ctx.getImageData(0, 0, W, H).data;
  const r = rng(text.length * 131 + size);
  const pts: Pt[] = [];
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      if (data[(y * W + x) * 4 + 3] < 128) continue;
      const ang = r() * Math.PI * 2;
      const dist = 300 + r() * 900;
      pts.push({
        tx: x + (r() - 0.5) * 1.5,
        ty: y + (r() - 0.5) * 1.5,
        sx: x + Math.cos(ang) * dist,
        sy: y + Math.sin(ang) * dist * 0.6,
        d: r(),
        ph: r() * 6.28,
      });
    }
  }
  return pts;
};

// 粒子从四周聚成文字，outAt 之后再散开
export const ParticleText: React.FC<{
  text: string;
  size: number;
  cy: number;
  color: Rgb;
  outAt?: number;
}> = ({ text, size, cy, color, outAt }) => {
  const pts = useMemo(() => sample(text, size, cy, 3), [text, size, cy]);
  const draw: Draw = useCallback(
    (ctx, fr) => {
      ctx.globalCompositeOperation = 'lighter';
      for (const q of pts) {
        const t = easeOut(p(fr, q.d * 40, q.d * 40 + 48));
        const o = outAt === undefined ? 0 : ease(p(fr, outAt + q.d * 12, outAt + q.d * 12 + 26));
        const x = lerp(q.sx, q.tx, t) + (q.sx - q.tx) * 0.25 * o;
        const y = lerp(q.sy, q.ty, t) + (q.sy - q.ty) * 0.25 * o;
        const a = t * (1 - o) * (0.7 + 0.3 * Math.sin(fr * 0.09 + q.ph) ** 2);
        if (a < 0.02) continue;
        ctx.fillStyle = rgba(color, a);
        ctx.fillRect(x, y, 2.4, 2.4);
      }
    },
    [pts, color, outAt],
  );
  return <Canvas draw={draw} />;
};
