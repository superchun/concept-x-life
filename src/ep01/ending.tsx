import React, { useCallback } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { PixelCanvas, type Draw } from '../lib/PixelCanvas';
import { Rich, Txt, Typed } from '../lib/Text';
import { easeOut, p } from '../lib/math';
import { FONT, P, S } from '../lib/theme';
import { drawSky, monster } from './world';

// 图鉴页：4×2 个格子，第一格是这期收录的，其余还没解锁
const SLOT_W = 92;
const SLOT_H = 62;
const slotXY = (i: number): [number, number] => [44 + (i % 4) * (SLOT_W + 8), 60 + Math.floor(i / 4) * (SLOT_H + 20)];

const draw: Draw = (ctx, t) => {
  drawSky(ctx, t, false);
  if (t < 360) return;
  for (let i = 0; i < 8; i++) {
    if (t < 366 + i * 3) continue;
    const [x, y] = slotXY(i);
    ctx.fillStyle = i === 0 ? P.white : P.slate;
    ctx.fillRect(x, y, SLOT_W, SLOT_H);
    ctx.fillStyle = i === 0 ? P.navy : P.dark;
    ctx.fillRect(x + 2, y + 2, SLOT_W - 4, SLOT_H - 4);
  }
  const [x, y] = slotXY(0);
  const drop = easeOut(p(t, 396, 410));
  if (t >= 396) monster(ctx, x + SLOT_W / 2, y + SLOT_H - 12 - Math.round((1 - drop) * 40), 3, 0.05 * Math.sin(t * 0.2));
};

export const Ending: React.FC = () => {
  const t = useCurrentFrame();
  const drawCb = useCallback(draw, []);
  const todo = ['点一家没点过的外卖', '换一条没走过的路回家'];
  return (
    <AbsoluteFill>
      <PixelCanvas draw={drawCb} />
      {t < 180 && (
        <div style={{ position: 'absolute', left: 180, top: 250, fontFamily: FONT, fontSize: 120, lineHeight: '192px', color: P.white, opacity: 1 - p(t, 170, 178) }}>
          <div>
            <Typed text="只肯往上走的人，" start={8} perChar={2.4} />
          </div>
          <div>
            <Typed text="[到不了最高的地方]。" start={62} perChar={2.4} tone="fix" />
          </div>
        </div>
      )}
      {t >= 180 && t < 360 && (
        <div
          style={{
            position: 'absolute',
            left: 320,
            top: 150 + (1 - easeOut(p(t, 180, 190))) * 60,
            width: 1280,
            boxSizing: 'border-box',
            border: `8px solid ${P.yellow}`,
            background: P.ink,
            padding: '40px 64px',
            fontFamily: FONT,
            color: P.white,
            opacity: p(t, 180, 186) * (1 - p(t, 350, 358)),
          }}
        >
          <div style={{ fontSize: 48, color: P.yellow }}>今日任务</div>
          <div style={{ fontSize: 72, marginTop: 28 }}>
            <Rich text="做一件[「暂时变差」]的事" tone="fix" />
          </div>
          <div style={{ fontSize: 48, lineHeight: '96px', marginTop: 24 }}>
            {todo.map((s, i) => {
              const on = t >= 236 + i * 30;
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ width: 12 * S, height: 12 * S, marginRight: 32, boxSizing: 'border-box', border: `8px solid ${on ? P.lime : P.grey}`, background: on ? P.lime : 'transparent' }} />
                  {s}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 48, marginTop: 16, color: P.orange, opacity: t >= 300 ? 1 : 0 }}>奖励　温度 +1</div>
        </div>
      )}
      {t >= 360 && (
        <>
          <Txt x={240} y={26} size={96} align="center">
            人生 <span style={{ color: P.sky }}>bug</span> 图鉴
          </Txt>
          {Array.from({ length: 8 }, (_, i) => {
            if (t < 366 + i * 3) return null;
            const [x, y] = slotXY(i);
            return (
              <React.Fragment key={i}>
                {i > 0 && <Txt x={x + SLOT_W / 2} y={y + 16} size={96} align="center" color={P.slate}>?</Txt>}
                <Txt x={x + SLOT_W / 2} y={y + SLOT_H + 4} size={36} align="center" color={i === 0 ? P.white : P.slate}>
                  {i === 0 ? (t >= 410 ? '001 局部最优' : '001') : `00${i + 1} ???`}
                </Txt>
              </React.Fragment>
            );
          })}
          {t >= 414 && t % 20 < 13 && <Txt x={slotXY(0)[0] + 6} y={slotXY(0)[1] + 6} size={36} color={P.yellow}>NEW</Txt>}
        </>
      )}
    </AbsoluteFill>
  );
};
