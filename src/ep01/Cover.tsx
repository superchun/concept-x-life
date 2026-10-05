import React, { useCallback } from 'react';
import { AbsoluteFill } from 'remotion';
import { PixelCanvas, type Draw } from '../lib/PixelCanvas';
import { Rich } from '../lib/Text';
import { FONT, LW, P } from '../lib/theme';
import { drawMotes, drawSky, flag, hero, monster, shop, sofa } from './world';

// 封面。抖音主页的网格会把横屏封面裁成竖条，所以标题、小人和高山的山顶都压在中间 42% 的宽度里。
const HILL: [number, number, number, number] = [236, 226, 44, 44]; // 中心, 底, 高, 宽度系数
const PEAK: [number, number, number, number] = [338, 226, 200, 40];
const topAt = ([cx, base, h, w]: number[], x: number) => base - Math.round((h * Math.exp(-(((x - cx) / w) ** 2))) / 2) * 2;
const hill = (ctx: CanvasRenderingContext2D, [cx, base, h, w]: number[], body: string, edge: string, shade: number) => {
  for (let x = 0; x < LW; x += 2) {
    const d = (x + 1 - cx) / w;
    const top = base - Math.round((h * Math.exp(-d * d)) / 2) * 2;
    ctx.fillStyle = body;
    ctx.fillRect(x, top, 2, 300 - top);
    ctx.fillStyle = `rgba(0,0,0,${shade})`;
    ctx.fillRect(x, top + 16, 2, 300 - top);
    ctx.fillStyle = edge;
    ctx.fillRect(x, top, 2, 1);
  }
};

const drawCover: Draw = (ctx) => {
  drawSky(ctx, 0, 0.45, 0, false);
  drawMotes(ctx, 40, 0.45);
  // 后面那座高山，山顶有光
  hill(ctx, PEAK, P.slate, P.yellow, 0.25);
  flag(ctx, PEAK[0], PEAK[1] - PEAK[2], P.yellow);
  // 前面这座小山，和山顶上的家当
  hill(ctx, HILL, P.dark, P.lime, 0.16);
  const top = HILL[1] - HILL[2];
  shop(ctx, HILL[0] - 28, topAt(HILL, HILL[0] - 28) + 1);
  sofa(ctx, HILL[0] + 28, topAt(HILL, HILL[0] + 28) + 1);
  hero(ctx, HILL[0], top, 4, P.yellow, 0, 9);
  monster(ctx, 148, 254, 2);
};

const OUTLINE = [-1, 0, 1].flatMap((x) => [-1, 0, 1].map((y) => `${x * 8}px ${y * 8}px 0 ${P.ink}`)).join(',');

export const Cover: React.FC = () => {
  const drawCb = useCallback(drawCover, []);
  return (
    <AbsoluteFill style={{ background: P.ink }}>
      <PixelCanvas draw={drawCb} bloom />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)' }} />
      <AbsoluteFill style={{ top: 110, left: -90, alignItems: 'center', fontFamily: FONT, color: P.white, textShadow: OUTLINE }}>
        <div style={{ fontSize: 144, lineHeight: '180px' }}>困住你的</div>
        <div style={{ fontSize: 144, lineHeight: '180px' }}>
          <Rich text="是[「更好」]" tone="fix" />
        </div>
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 980, textAlign: 'center', fontFamily: FONT, fontSize: 48, lineHeight: '48px', color: P.white }}>
        <span style={{ marginLeft: 120 }}>
          人生 <span style={{ color: P.sky }}>bug</span> 图鉴 · 001 局部最优
        </span>
      </div>
    </AbsoluteFill>
  );
};
