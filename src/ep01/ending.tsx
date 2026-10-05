import React, { useCallback } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { PixelCanvas, type Draw } from '../lib/PixelCanvas';
import { Txt } from '../lib/Text';
import { ease, easeOut, lerp, p } from '../lib/math';
import { P } from '../lib/theme';
import { bubble, drawMotes, drawSky, hero, monster } from './world';

const DAWN = 0.45;

// ---- 行动：症状里那张回家的地图。这次在第一个路口拐进没走过的街 ----
const OLD: [number, number][] = [[168, 54], [258, 54], [258, 144], [318, 144], [318, 174]];
const NEW: [number, number][] = [[168, 54], [168, 114], [228, 114], [228, 174], [318, 174]];
const MEET = 198; // 走到 TA 身边停下，按路程算
const along = (d: number): [number, number] => {
  for (let i = 1; i < NEW.length; i++) {
    const [ax, ay] = NEW[i - 1];
    const [bx, by] = NEW[i];
    const len = Math.abs(bx - ax) + Math.abs(by - ay);
    if (d <= len) return [lerp(ax, bx, d / len), lerp(ay, by, d / len)];
    d -= len;
  }
  return NEW[NEW.length - 1];
};
const road = (ctx: CanvasRenderingContext2D, pts: [number, number][], w: number, upTo = Infinity) => {
  for (let i = 1; i < pts.length && upTo > 0; i++) {
    const [ax, ay] = pts[i - 1];
    const len = Math.abs(pts[i][0] - ax) + Math.abs(pts[i][1] - ay);
    const t = Math.min(1, upTo / len);
    const bx = lerp(ax, pts[i][0], t);
    const by = lerp(ay, pts[i][1], t);
    ctx.fillRect(Math.min(ax, bx) - w / 2, Math.min(ay, by) - w / 2, Math.abs(bx - ax) + w, Math.abs(by - ay) + w);
    upTo -= len;
  }
};
// 路过时亮起来的三个街区：[出现帧, 画法]
const tree = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.fillStyle = P.plum;
  ctx.fillRect(x + 2, y + 6, 2, 4);
  ctx.fillStyle = P.green;
  ctx.fillRect(x, y + 1, 6, 5);
  ctx.fillStyle = P.lime;
  ctx.fillRect(x + 1, y, 4, 3);
};
export const SIGHTS = [58, 84, 110];
const drawSights = (ctx: CanvasRenderingContext2D, f: number) => {
  const grow = (i: number) => easeOut(p(f, SIGHTS[i], SIGHTS[i] + 10));
  // 小树林
  if (f >= SIGHTS[0]) {
    ctx.fillStyle = P.teal;
    ctx.fillRect(142, 88, 24, Math.round(24 * grow(0)));
    if (grow(0) >= 1) [[144, 90], [154, 89], [148, 100], [158, 101]].forEach(([x, y]) => tree(ctx, x, y));
  }
  // 湖，水面上有落日的倒影
  if (f >= SIGHTS[1]) {
    const w = Math.round(52 * grow(1));
    ctx.fillStyle = P.blue;
    ctx.fillRect(172, 118, w, 24);
    if (grow(1) >= 1) {
      ctx.fillStyle = P.sky;
      ctx.fillRect(176, 122, 44, 2);
      ctx.fillStyle = P.orange;
      ctx.fillRect(190, 128 + (Math.floor(f / 8) % 2), 16, 2);
      ctx.fillStyle = P.yellow;
      ctx.fillRect(194, 132, 8, 2);
    }
  }
  // 花圃
  if (f >= SIGHTS[2]) {
    ctx.fillStyle = P.green;
    ctx.fillRect(202, 148, 24, Math.round(24 * grow(2)));
    if (grow(2) >= 1) {
      [P.red, P.yellow, P.white, P.orange, P.yellow, P.red].forEach((c, i) => {
        ctx.fillStyle = c;
        ctx.fillRect(205 + (i % 3) * 7, 152 + Math.floor(i / 3) * 10 + ((i + Math.floor(f / 10)) % 2), 3, 3);
      });
    }
  }
};

const drawAction: Draw = (ctx, f) => {
  drawSky(ctx, f, DAWN, 0, false);
  drawMotes(ctx, f, DAWN);
  ctx.fillStyle = P.grey;
  ctx.fillRect(124, 24, 240, 176);
  ctx.fillStyle = P.ink;
  ctx.fillRect(126, 26, 236, 172);
  ctx.fillStyle = P.dark;
  for (let x = 138; x <= 348; x += 30) ctx.fillRect(x, 34, 2, 156);
  for (let y = 54; y <= 174; y += 30) ctx.fillRect(132, y - 1, 220, 2);
  drawSights(ctx, f);
  // 走了无数遍的老路
  ctx.fillStyle = P.teal;
  road(ctx, OLD, 5);
  // 在路口停一下，再拐弯
  const d = MEET * ease(p(f, 34, 138));
  ctx.fillStyle = P.yellow;
  road(ctx, NEW, 3, d);
  ctx.fillStyle = P.blue;
  ctx.fillRect(160, 40, 16, 12);
  ctx.fillStyle = P.orange;
  ctx.fillRect(322, 162, 16, 12);
  const hop = (at: number) => (f >= at && f < at + 24 ? Math.round(Math.abs(Math.sin(((f - at) / 12) * Math.PI)) * 4) : 0);
  // TA 从家那头走过来
  if (f >= 112) {
    const tx = lerp(300, 258, ease(p(f, 112, 138)));
    hero(ctx, tx, 176 - hop(150), 2, P.red, f < 138 ? Math.floor(f / 5) : 0, f + 31);
  }
  const [hx, hy] = along(d);
  const moving = f >= 34 && f < 138;
  if (f < 34) bubble(ctx, hx + 8, hy - 22, f);
  hero(ctx, hx, hy + 2 - hop(144), 2, P.yellow, moving ? Math.floor(f / 5) : 0, f);
  // 两人之间闪几下
  if (f >= 144) {
    ctx.fillStyle = P.yellow;
    [[243, 150], [249, 144], [237, 143]].forEach(([x, y], i) => {
      if (Math.floor((f + i * 5) / 6) % 3 === 0) ctx.fillRect(x, y, 2, 2);
    });
  }
};

export const Action: React.FC = () => {
  const f = useCurrentFrame();
  const drawCb = useCallback(drawAction, []);
  return (
    <AbsoluteFill>
      <PixelCanvas draw={drawCb} bloom />
      <Txt x={180} y={38} size={36} color={P.sky}>公司</Txt>
      <Txt x={340} y={160} size={36} color={P.orange}>家</Txt>
      {f >= 34 && f < 70 && <Txt x={184} y={76} size={36} color={P.yellow}>新路线</Txt>}
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
