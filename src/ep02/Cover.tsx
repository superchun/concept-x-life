import React, { useCallback } from 'react';
import { AbsoluteFill } from 'remotion';
import { PixelCanvas, type Draw } from '../lib/PixelCanvas';
import { Rich } from '../lib/Text';
import { FONT, LH, LW, P, S } from '../lib/theme';
import { ENTRY } from './script';
import { bear, drawMotes, drawSky, monster } from './world';

// 封面，横竖各一张，画的是同一件事：那只不许想的白熊，自己举着「不许想」的牌子坐在面前。
// 横版 1920×1080：抖音主页的网格只显示中间 810 像素宽的竖条，所有内容都要落在 x 555–1365 之内。
// 竖版 1080×1920：重要的东西都放在中间 3:4 的范围里，全屏和网格两种裁法都不会切到。
type Layout = {
  lw: number;
  lh: number;
  ground: number; // 地面的 y
  bear: number; // 白熊每格画几个像素
  board: [number, number, number]; // 牌子：顶边 y、宽、高
  bug: [number, number];
  title: { top: number; size: number };
  sign: { top: number; size: number };
  label: { top: number; left: number; size: number };
};
const WIDE: Layout = {
  lw: LW,
  lh: LH,
  ground: 236,
  bear: 6,
  board: [178, 132, 32],
  bug: [156, 254],
  title: { top: 44, size: 132 },
  sign: { top: 178 * S, size: 96 },
  label: { top: 984, left: 40, size: 36 },
};
const TALL: Layout = {
  lw: 270,
  lh: 480,
  ground: 400,
  bear: 9,
  board: [312, 196, 46],
  bug: [28, 426],
  title: { top: 250, size: 156 },
  sign: { top: 312 * S, size: 144 },
  label: { top: 1756, left: 0, size: 48 },
};

const drawCover = (L: Layout): Draw => (ctx) => {
  // 天空的色带是按 270 高画的，竖版把它拉长到地面
  ctx.save();
  ctx.scale(1, L.ground / 226);
  drawSky(ctx, 0, 0, 0, false);
  ctx.restore();
  drawMotes(ctx, 40, 0);
  ctx.fillStyle = P.dark;
  ctx.fillRect(0, L.ground, L.lw, L.lh);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(0, L.ground + 10, L.lw, L.lh);
  ctx.fillStyle = P.slate;
  ctx.fillRect(0, L.ground, L.lw, 2);
  const cx = L.lw / 2;
  bear(ctx, cx, L.ground, 'sit', 0, false, L.bear);
  // 熊抱在身前的牌子
  const [by, bw, bh] = L.board;
  ctx.fillStyle = P.ink;
  ctx.fillRect(cx - bw / 2 - 2, by - 2, bw + 4, bh + 4);
  ctx.fillStyle = P.orange;
  ctx.fillRect(cx - bw / 2, by, bw, bh);
  ctx.fillStyle = P.red;
  ctx.fillRect(cx - bw / 2, by + bh - 4, bw, 4);
  // 两只前爪搭在牌子上沿
  ctx.fillStyle = P.white;
  for (const d of [-1, 1]) {
    ctx.fillRect(cx + d * (bw / 2 - L.bear * 2) - L.bear * 1.5, by - L.bear, L.bear * 3, L.bear * 2);
    ctx.fillStyle = P.grey;
    ctx.fillRect(cx + d * (bw / 2 - L.bear * 2) - L.bear * 1.5, by + L.bear - 2, L.bear * 3, 2);
    ctx.fillStyle = P.white;
  }
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
      <AbsoluteFill style={{ top: L.title.top, alignItems: 'center', fontFamily: FONT, color: P.white, textShadow: OUTLINE }}>
        <div style={row}>让你忘不掉的</div>
        <div style={row}>
          <Rich text="是[「别想」]" />
        </div>
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: L.lw * S,
          top: L.sign.top,
          height: L.board[2] * S,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT,
          fontSize: L.sign.size,
          color: P.ink,
        }}
      >
        不许想
      </div>
      <div style={{ position: 'absolute', left: L.label.left, width: L.lw * S, top: L.label.top, textAlign: 'center', fontFamily: FONT, fontSize: L.label.size, lineHeight: '48px', color: P.white }}>
        人生 <span style={{ color: P.sky }}>bug</span> 图鉴 · {ENTRY.id.slice(-3)} {ENTRY.name}
      </div>
    </AbsoluteFill>
  );
};

export const Cover: React.FC = () => <CoverOf L={WIDE} />;
export const CoverTall: React.FC = () => <CoverOf L={TALL} />;
