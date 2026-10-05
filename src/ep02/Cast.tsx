import React from 'react';
import { AbsoluteFill } from 'remotion';
import { PixelCanvas, type Draw } from '../lib/PixelCanvas';
import { Txt } from '../lib/Text';
import { LH, LW, P } from '../lib/theme';
import { bear, bed, bell, board, door, guard, hero, thought } from './world';

// 角色定妆图，不进成片。卧室里的东西和主角一样按 2 倍画，这里就是成片全景里的实际大小。
const draw: Draw = (ctx) => {
  ctx.fillStyle = '#1e2240';
  ctx.fillRect(0, 0, LW, LH);
  ctx.fillStyle = P.dark;
  ctx.fillRect(0, 124, LW, 2);
  ctx.fillRect(0, 246, LW, 2);
  board(ctx, 52, 30, 68, 18);
  ctx.save();
  ctx.scale(2, 2);
  // 上排：门、守门人、走路的熊、铃
  door(ctx, 26, 62, 0);
  guard(ctx, 60, 62);
  bear(ctx, 100, 62, 'walk');
  bell(ctx, 200, 30);
  bell(ctx, 220, 30, true);
  // 下排：床上的主角和念头气泡、坐着的熊、打哈欠、睡着、站着的主角
  bed(ctx, 30, 123, 'open');
  thought(ctx, 18, 100);
  bear(ctx, 80, 123, 'sit');
  bear(ctx, 108, 123, 'yawn');
  bear(ctx, 142, 123, 'sleep');
  bed(ctx, 190, 123, 'shut', 1);
  hero(ctx, 228, 123, 2, P.yellow, 0, 9);
  ctx.restore();
};

export const Cast: React.FC = () => (
  <AbsoluteFill style={{ background: P.ink }}>
    <PixelCanvas draw={draw} />
    <Txt x={52} y={33} size={48} align="center" color={P.ink}>不许想白熊</Txt>
  </AbsoluteFill>
);
