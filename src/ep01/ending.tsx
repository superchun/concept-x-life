import React, { useCallback } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { PixelCanvas, type Draw } from '../lib/PixelCanvas';
import { Txt } from '../lib/Text';
import { easeOut, p } from '../lib/math';
import { P } from '../lib/theme';
import { drawMotes, drawSky, monster } from './world';

const DAWN = 0.45;

// ---- 行动：开头那份简历，这次光标落进正文，多了一行 ----
const drawAction: Draw = (ctx, f) => {
  drawSky(ctx, f, DAWN, 0, false);
  drawMotes(ctx, f, DAWN);
  ctx.fillStyle = P.grey;
  ctx.fillRect(140, 30, 200, 180);
  ctx.fillStyle = P.white;
  ctx.fillRect(142, 32, 196, 176);
  ctx.fillStyle = P.slate;
  ctx.fillRect(142, 32, 196, 16);
  ctx.fillStyle = P.grey;
  [62, 72, 82, 98, 108].forEach((y, i) => ctx.fillRect(156, y, [130, 96, 150, 118, 160][i], 3));
  // 新打出来的一行
  const typed = Math.round(p(f, 24, 58) * 140);
  ctx.fillStyle = P.green;
  ctx.fillRect(156, 124, typed, 3);
  if (f % 16 < 10) {
    ctx.fillStyle = P.ink;
    ctx.fillRect(157 + typed, 120, 1, 10);
  }
};

export const Action: React.FC = () => {
  const f = useCurrentFrame();
  const drawCb = useCallback(drawAction, []);
  const saved = f >= 62;
  return (
    <AbsoluteFill>
      <PixelCanvas draw={drawCb} bloom />
      <Txt x={148} y={35} size={36}>简历.doc</Txt>
      <Txt x={156} y={150} size={48} color={saved ? P.green : P.red} scale={saved ? 1 + 0.4 * (1 - easeOut(p(f, 62, 70))) : 1}>
        上次修改：{saved ? '刚刚' : '2 年前'}
      </Txt>
    </AbsoluteFill>
  );
};

// ---- 片尾：图鉴页。第一格是这期收录的，其余还没解锁 ----
const SLOT_W = 92;
const SLOT_H = 62;
const slotXY = (i: number): [number, number] => [44 + (i % 4) * (SLOT_W + 8), 62 + Math.floor(i / 4) * (SLOT_H + 20)];

const drawEnd: Draw = (ctx, t) => {
  drawSky(ctx, t, DAWN, 0, false);
  for (let i = 0; i < 8; i++) {
    if (t < 4 + i * 2) continue;
    const [x, y] = slotXY(i);
    ctx.fillStyle = i === 0 ? P.white : P.slate;
    ctx.fillRect(x, y, SLOT_W, SLOT_H);
    ctx.fillStyle = i === 0 ? P.navy : P.dark;
    ctx.fillRect(x + 2, y + 2, SLOT_W - 4, SLOT_H - 4);
  }
  const [x, y] = slotXY(0);
  const drop = easeOut(p(t, 22, 34));
  if (t >= 22) monster(ctx, x + SLOT_W / 2, y + SLOT_H - 12 - Math.round((1 - drop) * 40), 3, 0.05 * Math.sin(t * 0.2));
};

export const End: React.FC = () => {
  const t = useCurrentFrame();
  const drawCb = useCallback(drawEnd, []);
  return (
    <AbsoluteFill>
      <PixelCanvas draw={drawCb} bloom />
      <Txt x={240} y={28} size={96} align="center">
        人生 <span style={{ color: P.sky }}>bug</span> 图鉴
      </Txt>
      {Array.from({ length: 8 }, (_, i) => {
        if (t < 4 + i * 2) return null;
        const [x, y] = slotXY(i);
        return (
          <React.Fragment key={i}>
            {i > 0 && <Txt x={x + SLOT_W / 2} y={y + 16} size={96} align="center" color={P.slate}>?</Txt>}
            <Txt x={x + SLOT_W / 2} y={y + SLOT_H + 4} size={36} align="center" color={i === 0 ? P.white : P.slate}>
              {i === 0 ? (t >= 34 ? '001 局部最优' : '001') : `00${i + 1} ???`}
            </Txt>
          </React.Fragment>
        );
      })}
      {t >= 36 && t % 20 < 13 && <Txt x={slotXY(0)[0] + 6} y={slotXY(0)[1] + 6} size={36} color={P.yellow}>NEW</Txt>}
    </AbsoluteFill>
  );
};
