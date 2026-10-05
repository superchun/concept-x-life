import React, { useCallback } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { PixelCanvas, type Draw } from '../lib/PixelCanvas';
import { Txt } from '../lib/Text';
import { clamp01, p } from '../lib/math';
import { P, S } from '../lib/theme';
import { ANNEAL, ANNEAL_RUNS, CLIMB, CLIMB_END, CLIMB_STEPS, HERO, MAIN, N, PEAKS, SETTLE, peakOf } from './sim';
import { bubble, colOf, cx, drawSky, drawTerrain, firework, flag, footY, guy, peakCol, pilePos, type Lane } from './world';

// 上下两条赛道是同一张地图：上面用旧规则，下面用新规则
const OLD: Lane = { base: 112, hmax: 64 };
const NEW: Lane = { base: 206, hmax: 64 };
const START = 40;
const END = 470;

const OLD_SLOT = (() => {
  const seen = PEAKS.map(() => 0);
  return CLIMB_END.map((x) => seen[peakOf(x)]++);
})();
// 新规则下登顶的人按登顶先后排位
const NEW_SLOT = (() => {
  const order = SETTLE.map((s, i) => [s, i]).filter(([s]) => s >= 0).sort((a, b) => a[0] - b[0]);
  const slot = new Array<number>(N).fill(-1);
  order.forEach(([, i], k) => (slot[i] = k));
  return slot;
})();

const stepAt = (t: number) => Math.round(clamp01((t - START) / (END - START)) * ANNEAL.steps);
const arriveFrame = (i: number) => START + (SETTLE[i] / ANNEAL.steps) * (END - START);
export const oldCount = (t: number) => {
  const idx = Math.round(p(t, START, START + 100) * CLIMB_STEPS);
  let n = 0;
  for (let i = 0; i < N; i++) if (peakOf(CLIMB_END[i]) === MAIN && Math.abs(CLIMB[i][idx] - CLIMB_END[i]) < 1e-6) n++;
  return n;
};
export const newCount = (t: number) => {
  const s = stepAt(t);
  let n = 0;
  for (let i = 0; i < N; i++) if (SETTLE[i] >= 0 && s >= SETTLE[i]) n++;
  return n;
};
const heatAt = (t: number) => clamp01(Math.log(HERO.ts[stepAt(t)] / ANNEAL.T1) / Math.log(ANNEAL.T0 / ANNEAL.T1));

const draw: Draw = (ctx, t) => {
  drawSky(ctx, t, false);
  // 有人登顶的那几帧，下面的赛道轻轻震一下
  let shake = 0;
  for (let i = 0; i < N; i++) if (SETTLE[i] >= 0 && t - arriveFrame(i) >= 0 && t - arriveFrame(i) < 3) shake = t % 2 ? 1 : -1;

  drawTerrain(ctx, NEW);
  // 上面的赛道画在下面那条的地面之上，所以先画下面
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 480, OLD.base + 1);
  ctx.clip();
  drawSky(ctx, t, false);
  drawTerrain(ctx, OLD);
  ctx.restore();
  ctx.fillStyle = P.slate;
  ctx.fillRect(0, OLD.base + 1, 480, 1);

  // 旧规则：爬到各自的山顶就停
  const idx = Math.round(p(t, START, START + 100) * CLIMB_STEPS);
  for (let i = 0; i < N; i++) {
    const fall = p(t, i * 0.3, 22 + i * 0.3);
    if (fall <= 0) continue;
    const x = CLIMB[i][idx];
    const k = peakOf(CLIMB_END[i]);
    const arrived = t >= START && Math.abs(x - CLIMB_END[i]) < 1e-6;
    const [px, py] = arrived ? pilePos(k, OLD_SLOT[i], OLD) : [cx(colOf(x)), footY(colOf(x), OLD)];
    guy(ctx, px, OLD.base - 90 + (py - OLD.base + 90) * fall * fall, 4, arrived ? (k === MAIN ? P.lime : P.slate) : P.grey, arrived ? 0 : Math.floor(t / 4) + i);
  }
  if (t >= 170) PEAKS.forEach((_, k) => k !== MAIN && bubble(ctx, cx(peakCol(k)), footY(peakCol(k), OLD) - 18, t));
  if (oldCount(t) > 0) flag(ctx, cx(peakCol(MAIN)) + 14, footY(peakCol(MAIN) + 3, OLD), P.lime, t);

  // 新规则：一边乱撞一边降温，稳定在最高峰的变绿
  ctx.save();
  ctx.translate(shake, 0);
  const s = stepAt(t);
  const heat = heatAt(t);
  for (let i = 0; i < N; i++) {
    const fall = p(t, i * 0.3, 22 + i * 0.3);
    if (fall <= 0) continue;
    const done = SETTLE[i] >= 0 && s >= SETTLE[i];
    const x = ANNEAL_RUNS[i][s];
    const [px, py] = done ? pilePos(MAIN, NEW_SLOT[i], NEW, 17) : [cx(colOf(x)), footY(colOf(x), NEW)];
    const lost = t >= END && !done;
    const color = done ? P.lime : lost ? P.orange : heat > 0.5 ? P.orange : heat > 0.15 ? P.yellow : P.white;
    guy(ctx, px, NEW.base - 90 + (py - NEW.base + 90) * fall * fall, 4, color, done || lost ? 0 : Math.floor(t / 2) + i);
    if (lost && t >= END + 20) bubble(ctx, px, py - 7, t);
    if (SETTLE[i] >= 0) firework(ctx, cx(peakCol(MAIN)) + ((i * 37) % 60) - 30, footY(peakCol(MAIN), NEW) - 24 - ((i * 13) % 22), t - arriveFrame(i), i);
  }
  if (newCount(t) > 0) flag(ctx, cx(peakCol(MAIN)) + 14, footY(peakCol(MAIN) + 3, NEW), P.yellow, t);
  ctx.restore();
};

// ---- 赛跑：同一张地图，旧规则对新规则 ----
export const Race: React.FC = () => {
  const t = useCurrentFrame();
  const drawCb = useCallback(draw, []);
  const heat = heatAt(t);
  const a = oldCount(t);
  const b = newCount(t);
  return (
    <AbsoluteFill>
      <PixelCanvas draw={drawCb} />
      <Txt x={16} y={24} size={48} color={P.grey}>旧规则　只能往上走</Txt>
      <Txt x={464} y={22} size={72} align="right" color={P.grey}>
        登顶 {a}
      </Txt>
      <Txt x={16} y={120} size={48} color={P.lime}>新规则　允许走下坡</Txt>
      <Txt x={464} y={118} size={72} align="right" color={P.lime}>
        登顶 {b}
      </Txt>
      <div style={{ position: 'absolute', left: 16 * S, top: 136 * S, display: 'flex', alignItems: 'center', gap: S, opacity: p(t, START, START + 6) }}>
        <span style={{ fontFamily: '"Fusion Pixel"', fontSize: 36, color: P.white, marginRight: 12 }}>温度</span>
        {Array.from({ length: 20 }, (_, i) => (
          <span key={i} style={{ width: 4 * S, height: 5 * S, background: i < Math.round(heat * 20) ? (i > 12 ? P.red : i > 5 ? P.orange : P.yellow) : P.dark }} />
        ))}
      </div>
    </AbsoluteFill>
  );
};
