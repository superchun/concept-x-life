import React, { useCallback } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { PixelCanvas, type Draw } from '../lib/PixelCanvas';
import { Txt, Typed } from '../lib/Text';
import { ease, lerp, p } from '../lib/math';
import { FONT, P } from '../lib/theme';
import { STEP_H, STEP_W, drawStairs } from './level';
import { Flash } from './symptoms';
import { applyCam, bubble, drawMotes, drawSky, hero, lerpCam, toScreen } from './world';

const DAWN = 0.45;

// ---- 行动：回到开头的十级台阶。这次他往下迈了一步，脚下才出现路 ----
// 时间点（段内帧）：0 站在顶上  30 六个症状闪回  66 往右探  96 起每 18 帧下一级
// 110–176 镜头拉远，露出右边更高的台阶  162 走过谷底  200 开始往上走
export const FLASH: [number, number] = [30, 6]; // [起始帧, 每屏帧数]
export const DOWN_T = [96, 114, 132, 150];
const TOP: [number, number] = [251, 210 - 10 * STEP_H];
const VALLEY = TOP[1] + 4 * STEP_H;
const FAR_X = 390;
const FAR_W = 10;
const FAR_N = 20;
const down = (k: number): [number, number] => (k <= 0 ? [TOP[0] + 3, TOP[1]] : [262 + (k - 1) * STEP_W + 8, TOP[1] + k * STEP_H]);
const far = (m: number): [number, number] => (m < 0 ? [FAR_X - 5, VALLEY] : [FAR_X + m * FAR_W + 5, VALLEY - (m + 1) * STEP_H]);
const hopTo = (a: [number, number], b: [number, number], t: number): [number, number, boolean] => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t) - Math.sin(t * Math.PI) * 5,
  t < 1,
];
const pos = (f: number): [number, number, boolean] => {
  if (f < DOWN_T[0]) return [TOP[0] + 3 * ease(p(f, 66, 80)), TOP[1], false];
  if (f < 162) {
    const k = DOWN_T.filter((t0) => f >= t0).length;
    return hopTo(down(k - 1), down(k), p(f, DOWN_T[k - 1], DOWN_T[k - 1] + 12));
  }
  if (f < 200) return [lerp(down(4)[0], far(-1)[0], p(f, 162, 200)), VALLEY, true];
  const m = Math.min(FAR_N - 1, Math.floor((f - 200) / 12));
  return hopTo(far(m - 1), far(m), p(f, 200 + m * 12, 200 + m * 12 + 9));
};
const CAM0 = { x: TOP[0] + 10, y: TOP[1] - 22, z: 2 };
const CAM1 = { x: 350, y: 84, z: 0.9 };
const outroCam = (f: number) => lerpCam(CAM0, CAM1, ease(p(f, 110, 176)));

const column = (ctx: CanvasRenderingContext2D, x: number, top: number, w: number, lit: boolean) => {
  ctx.fillStyle = P.dark;
  ctx.fillRect(x, top, w, 300 - top);
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.fillRect(x, top + 14, w, 300 - top);
  ctx.fillStyle = lit ? P.yellow : P.lime;
  ctx.fillRect(x, top, w, 1);
  ctx.fillStyle = lit ? P.orange : P.green;
  ctx.fillRect(x, top + 1, w, 1);
};

const drawOutro: Draw = (ctx, f) => {
  const cam = outroCam(f);
  drawSky(ctx, f, DAWN, cam.x);
  ctx.save();
  applyCam(ctx, cam);
  drawStairs(ctx, 11);
  // 往下的台阶：迈出去的那一刻才出现
  DOWN_T.forEach((t0, i) => {
    if (f >= t0) column(ctx, 262 + i * STEP_W, TOP[1] + (i + 1) * STEP_H, STEP_W, f >= t0 + 12);
  });
  if (f >= DOWN_T[3]) column(ctx, 262 + 4 * STEP_W, VALLEY, FAR_X - 262 - 4 * STEP_W, false);
  // 右边那段更高的台阶，开头的镜头里看不到
  const climbed = f < 200 ? 0 : Math.floor((f - 200) / 12) + 1;
  for (let m = 0; m < FAR_N; m++) column(ctx, FAR_X + m * FAR_W, VALLEY - (m + 1) * STEP_H, FAR_W, m < climbed);
  column(ctx, FAR_X + FAR_N * FAR_W, VALLEY - FAR_N * STEP_H, 200, false);
  const [x, y, moving] = pos(f);
  hero(ctx, x, y, 2, P.yellow, moving ? Math.floor(f / 3) : 0, f);
  if (f < FLASH[0]) bubble(ctx, x, y - 24, f);
  ctx.restore();
  drawMotes(ctx, f, DAWN);
};

export const Action: React.FC = () => {
  const f = useCurrentFrame();
  const drawCb = useCallback(drawOutro, []);
  const cam = outroCam(f);
  const [wx, wy] = toScreen(cam, TOP[0] + 26, TOP[1]);
  const [hx, hy] = toScreen(cam, ...down(1));
  const flash = Math.floor((f - FLASH[0]) / FLASH[1]);
  return (
    <AbsoluteFill>
      <PixelCanvas draw={drawCb} bloom />
      {f >= 66 && f < 104 && (
        <Txt x={wx} y={wy - 4} size={48} align="center" color={P.orange}>
          ↓ 更差
        </Txt>
      )}
      {f >= 108 && f < 144 && (
        <Txt x={hx + 14} y={hy - 30 - (f - 108) * 0.8} size={48} color={P.orange} opacity={1 - p(f, 132, 144)}>
          −1
        </Txt>
      )}
      {f >= FLASH[0] && flash < 6 && <Flash i={flash} />}
    </AbsoluteFill>
  );
};

// ---- 最后一帧：他已经在往那段更高的台阶上走。留一个问题 ----
const QUESTION = '困住你的[山]，是什么？';
export const End: React.FC = () => {
  const t = useCurrentFrame();
  const drawCb: Draw = useCallback((ctx, fr) => drawOutro(ctx, 180 + fr), []);
  return (
    <AbsoluteFill>
      <PixelCanvas draw={drawCb} bloom />
      <AbsoluteFill style={{ background: 'rgba(26,28,44,0.3)', opacity: p(t, 0, 8) }} />
      <AbsoluteFill style={{ top: 250, alignItems: 'center', fontFamily: FONT, fontSize: 120, color: P.white, textShadow: `0 8px 0 ${P.ink}` }}>
        <div style={{ minHeight: 120, lineHeight: '120px' }}>
          <Typed text={QUESTION} start={8} perChar={2.2} />
        </div>
      </AbsoluteFill>
      {t >= 40 && (
        <Txt x={240} y={238} size={36} align="center" color={P.white} opacity={0.8}>
          人生 bug 图鉴 · 001 局部最优
        </Txt>
      )}
    </AbsoluteFill>
  );
};
