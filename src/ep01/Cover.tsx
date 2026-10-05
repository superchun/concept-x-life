import React, { useCallback } from 'react';
import { AbsoluteFill } from 'remotion';
import { PixelCanvas, type Draw } from '../lib/PixelCanvas';
import { Rich } from '../lib/Text';
import { FONT, LH, LW, P, S } from '../lib/theme';
import { drawMotes, drawSky, flag, hero, monster, shop, sofa } from './world';

// 封面，横竖各一张，画的是同一件事：他站在小山顶上，身后是一座高得多的山。
// 横版 1920×1080：抖音主页的网格只显示中间 810 像素宽的竖条，所有内容都要落在 x 555–1365 之内。
// 竖版 1080×1920：重要的东西都放在中间 3:4 的范围里，全屏和网格两种裁法都不会切到。
type Layout = {
  lw: number;
  lh: number;
  hill: [number, number, number, number]; // 中心, 底, 高, 宽度系数
  peak: [number, number, number, number];
  bug: [number, number];
  man: number; // 主角放大几倍
  title: { top: number; left: number; size: number };
  label: { top: number; left: number; size: number };
};
const WIDE: Layout = {
  lw: LW,
  lh: LH,
  hill: [192, 226, 40, 34],
  peak: [296, 226, 116, 30],
  bug: [156, 254],
  man: 4,
  title: { top: 44, left: 0, size: 132 },
  label: { top: 984, left: 40, size: 36 },
};
const TALL: Layout = {
  lw: 270,
  lh: 480,
  hill: [92, 392, 46, 40],
  peak: [198, 392, 196, 40],
  bug: [28, 418],
  man: 6,
  title: { top: 250, left: 0, size: 168 },
  label: { top: 1624, left: 44, size: 48 },
};

const topAt = ([cx, base, h, w]: number[], x: number) => base - Math.round((h * Math.exp(-(((x - cx) / w) ** 2))) / 2) * 2;
const hill = (ctx: CanvasRenderingContext2D, g: number[], lw: number, body: string, edge: string, shade: number) => {
  for (let x = 0; x < lw; x += 2) {
    const top = topAt(g, x + 1);
    ctx.fillStyle = body;
    ctx.fillRect(x, top, 2, 600 - top);
    ctx.fillStyle = `rgba(0,0,0,${shade})`;
    ctx.fillRect(x, top + 16, 2, 600 - top);
    ctx.fillStyle = edge;
    ctx.fillRect(x, top, 2, 1);
  }
};

const drawCover = (L: Layout): Draw => (ctx) => {
  // 天空的色带是按 270 高画的，竖版把它拉长到地平线
  ctx.save();
  ctx.scale(1, L.hill[1] / 226);
  drawSky(ctx, 0, 0.45, 0, false);
  ctx.restore();
  drawMotes(ctx, 40, 0.45);
  // 后面那座高山，山顶有光
  hill(ctx, L.peak, L.lw, P.slate, P.yellow, 0.25);
  flag(ctx, L.peak[0], L.peak[1] - L.peak[2], P.yellow);
  // 前面这座小山，和山顶上的家当
  hill(ctx, L.hill, L.lw, P.dark, P.lime, 0.16);
  const [hx] = L.hill;
  shop(ctx, hx - 26, topAt(L.hill, hx - 26) + 1);
  sofa(ctx, hx + 26, topAt(L.hill, hx + 26) + 1);
  hero(ctx, hx, topAt(L.hill, hx), L.man, P.yellow, 0, 9);
  monster(ctx, L.bug[0], L.bug[1], 2);
};

const OUTLINE = [-1, 0, 1].flatMap((x) => [-1, 0, 1].map((y) => `${x * 8}px ${y * 8}px 0 ${P.ink}`)).join(',');

const CoverOf: React.FC<{ L: Layout }> = ({ L }) => {
  const drawCb = useCallback(drawCover(L), [L]);
  const row: React.CSSProperties = { fontSize: L.title.size, lineHeight: `${L.title.size + 36}px` };
  return (
    <AbsoluteFill style={{ background: P.ink }}>
      <PixelCanvas draw={drawCb} bloom lw={L.lw} lh={L.lh} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)' }} />
      <AbsoluteFill style={{ top: L.title.top, left: L.title.left, alignItems: 'center', fontFamily: FONT, color: P.white, textShadow: OUTLINE }}>
        <div style={row}>困住你的</div>
        <div style={row}>
          <Rich text="是[「更好」]" tone="fix" />
        </div>
      </AbsoluteFill>
      <div style={{ position: 'absolute', left: L.label.left, width: L.lw * S, top: L.label.top, textAlign: 'center', fontFamily: FONT, fontSize: L.label.size, lineHeight: '48px', color: P.white }}>
        人生 <span style={{ color: P.sky }}>bug</span> 图鉴 · 001 局部最优
      </div>
    </AbsoluteFill>
  );
};

export const Cover: React.FC = () => <CoverOf L={WIDE} />;
export const CoverTall: React.FC = () => <CoverOf L={TALL} />;
