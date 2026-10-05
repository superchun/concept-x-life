import React, { useCallback } from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { PixelCanvas, type Draw } from '../lib/PixelCanvas';
import { Txt } from '../lib/Text';
import { clamp01, ease, easeOut, lerp, p } from '../lib/math';
import { LH, LW, P, S } from '../lib/theme';
import { SYMPTOMS, SYMPTOM_FRAMES } from './script';
import { monster } from './world';

const box = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, border: string) => {
  ctx.fillStyle = border;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
};
// 出现时放大再回弹
const punch = (f: number, at: number) => (f < at ? 0 : 1 + 0.5 * (1 - easeOut(p(f, at, at + 8))));

// 1 外卖：列表划到底，又弹回最上面那三家
const drawTakeout: Draw = (ctx, f) => {
  box(ctx, 196, 30, 88, 162, P.dark, P.grey);
  ctx.save();
  ctx.beginPath();
  ctx.rect(200, 36, 80, 150);
  ctx.clip();
  const scroll = f < 24 ? -110 * ease(p(f, 4, 24)) : -110 * (1 - easeOut(p(f, 24, 33)));
  const thumbs = [P.orange, P.yellow, P.red, P.green, P.sky, P.plum, P.teal, P.blue, P.lime, P.cyan, P.orange, P.red];
  thumbs.forEach((c, i) => {
    const y = 40 + i * 20 + Math.round(scroll);
    ctx.fillStyle = c;
    ctx.fillRect(204, y, 14, 14);
    ctx.fillStyle = P.white;
    ctx.fillRect(222, y + 2, 34, 3);
    ctx.fillStyle = P.slate;
    ctx.fillRect(222, y + 8, 22, 2);
    if (i < 3 && f >= 34) {
      ctx.strokeStyle = P.yellow;
      ctx.lineWidth = 1;
      ctx.strokeRect(202.5, y - 1.5, 75, 17);
    }
  });
  ctx.restore();
};
// 2 歌单：唱片一直转，进度条走完又回到开头
const drawPlaylist: Draw = (ctx, f) => {
  for (let y = -36; y <= 36; y++) {
    for (let x = -36; x <= 36; x++) {
      const d = Math.hypot(x, y);
      if (d > 36) continue;
      ctx.fillStyle = d < 4 ? P.ink : d < 12 ? P.orange : Math.floor(d) % 6 === 0 ? P.slate : P.dark;
      ctx.fillRect(240 + x, 96 + y, 1, 1);
    }
  }
  const a = f * 0.35;
  ctx.fillStyle = P.white;
  ctx.fillRect(Math.round(240 + Math.cos(a) * 24) - 1, Math.round(96 + Math.sin(a) * 24) - 1, 3, 3);
  ctx.fillStyle = P.slate;
  ctx.fillRect(170, 156, 140, 4);
  ctx.fillStyle = P.lime;
  ctx.fillRect(170, 156, Math.round(((f * 7) % 140)), 4);
};
// 3 理发：上次和这次一模一样
const drawHaircut: Draw = (ctx, f) => {
  for (const x of [176, 304]) {
    ctx.fillStyle = P.yellow;
    ctx.fillRect(x - 16, 80, 32, 36);
    ctx.fillStyle = P.plum;
    ctx.fillRect(x - 19, 66, 38, 18);
    ctx.fillRect(x - 19, 84, 6, 12);
    ctx.fillRect(x + 13, 84, 6, 12);
    ctx.fillStyle = P.ink;
    ctx.fillRect(x - 8, 96, 3, 4);
    ctx.fillRect(x + 5, 96, 3, 4);
    ctx.fillRect(x - 4, 108, 8, 2);
  }
  // 剪刀开合
  const open = Math.floor(f / 5) % 2 ? 7 : 2;
  ctx.fillStyle = P.grey;
  for (let i = 0; i < 16; i++) {
    ctx.fillRect(232 + i, 92 - Math.round((open * i) / 16), 2, 2);
    ctx.fillRect(232 + i, 96 + Math.round((open * i) / 16), 2, 2);
  }
  ctx.fillStyle = P.red;
  ctx.fillRect(226, 88, 6, 5);
  ctx.fillRect(226, 96, 6, 5);
};
// 4 回家：同一条路越走越亮，别的街一直是暗的
const ROUTE: [number, number][] = [
  [168, 54],
  [258, 54],
  [258, 144],
  [318, 144],
  [318, 174],
];
const routeAt = (t: number): [number, number] => {
  const lens = ROUTE.slice(1).map((q, i) => Math.abs(q[0] - ROUTE[i][0]) + Math.abs(q[1] - ROUTE[i][1]));
  let d = clamp01(t) * lens.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i]) {
      return [lerp(ROUTE[i][0], ROUTE[i + 1][0], d / lens[i]), lerp(ROUTE[i][1], ROUTE[i + 1][1], d / lens[i])];
    }
    d -= lens[i];
  }
  return ROUTE[ROUTE.length - 1];
};
const drawCommute: Draw = (ctx, f) => {
  ctx.fillStyle = P.dark;
  for (let x = 138; x <= 348; x += 30) ctx.fillRect(x, 34, 2, 156);
  for (let y = 54; y <= 174; y += 30) ctx.fillRect(132, y - 1, 220, 2);
  const pass = Math.floor(f / 18);
  const colors = [P.slate, P.teal, P.green, P.lime];
  ctx.fillStyle = colors[Math.min(3, pass)];
  const w = 2 + Math.min(3, pass);
  ROUTE.slice(1).forEach((q, i) => {
    const a = ROUTE[i];
    ctx.fillRect(Math.min(a[0], q[0]) - w / 2, Math.min(a[1], q[1]) - w / 2, Math.abs(q[0] - a[0]) + w, Math.abs(q[1] - a[1]) + w);
  });
  ctx.fillStyle = P.blue;
  ctx.fillRect(160, 44, 16, 16);
  ctx.fillStyle = P.orange;
  ctx.fillRect(310, 170, 16, 14);
  const [dx, dy] = routeAt((f % 18) / 18);
  ctx.fillStyle = P.white;
  ctx.fillRect(Math.round(dx) - 3, Math.round(dy) - 3, 6, 6);
};
// 5 辞职：光标移到「发送」上，又挪开
const drawResume: Draw = (ctx, f) => {
  box(ctx, 150, 30, 180, 162, P.white, P.grey);
  ctx.fillStyle = P.slate;
  ctx.fillRect(152, 32, 176, 16);
  ctx.fillStyle = P.grey;
  [60, 70, 80, 96, 106, 116, 126].forEach((y, i) => ctx.fillRect(164, y, [120, 90, 140, 110, 150, 80, 130][i], 3));
  const hover = f >= 28 && f < 40;
  box(ctx, 268, 164, 52, 20, hover ? P.lime : P.green, P.ink);
  const cx = f < 40 ? lerp(190, 296, ease(p(f, 6, 28))) : lerp(296, 372, ease(p(f, 40, 56)));
  const cy = f < 40 ? lerp(120, 176, ease(p(f, 6, 28))) : lerp(176, 150, ease(p(f, 40, 56)));
  // 箭头光标
  ctx.fillStyle = P.ink;
  for (let i = 0; i < 9; i++) ctx.fillRect(Math.round(cx), Math.round(cy) + i, Math.min(i + 1, 10 - i) + 1, 1);
  ctx.fillStyle = P.white;
  for (let i = 1; i < 7; i++) ctx.fillRect(Math.round(cx) + 1, Math.round(cy) + i, Math.min(i, 7 - i), 1);
};
// 6 关系：三句话之后，对方正在输入，然后没了
const drawChat: Draw = (ctx, f) => {
  if (f >= 4) box(ctx, 130, 44, 100, 30, P.dark, P.grey);
  if (f >= 18) box(ctx, 246, 86, 104, 30, P.teal, P.lime);
  if (f >= 32) box(ctx, 130, 128, 52, 30, P.dark, P.grey);
  if (f >= 40 && f < 54) {
    box(ctx, 304, 166, 46, 22, P.teal, P.lime);
    ctx.fillStyle = P.white;
    for (let i = 0; i < 3; i++) if (Math.floor((f - 40) / 3) % 4 > i) ctx.fillRect(316 + i * 9, 175, 4, 4);
  }
};

const DRAWS = [drawTakeout, drawPlaylist, drawHaircut, drawCommute, drawResume, drawChat];

const Extras: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  if (i === 0) return <Txt x={292} y={44} size={48} color={P.yellow} scale={punch(f, 38)} opacity={f >= 38 ? 1 : 0}>第 147 次</Txt>;
  if (i === 1) return <Txt x={240} y={170} size={48} align="center" color={P.grey}>已循环 {1205 + Math.floor(f / 20)} 次</Txt>;
  if (i === 2) {
    return (
      <>
        <Txt x={176} y={126} size={36} align="center" color={P.grey}>上次</Txt>
        <Txt x={304} y={126} size={36} align="center" color={P.grey}>这次</Txt>
        <Txt x={240} y={40} size={48} align="center" color={P.yellow} scale={punch(f, 20)} opacity={f >= 20 ? 1 : 0}>「跟上次一样」</Txt>
      </>
    );
  }
  if (i === 3) {
    return (
      <>
        <Txt x={180} y={38} size={36} color={P.sky}>公司</Txt>
        <Txt x={330} y={172} size={36} color={P.orange}>家</Txt>
      </>
    );
  }
  if (i === 4) {
    return (
      <>
        <Txt x={158} y={35} size={36}>简历.doc</Txt>
        <Txt x={164} y={140} size={48} color={P.red} scale={punch(f, 14)} opacity={f >= 14 ? 1 : 0}>上次修改：2 年前</Txt>
        <Txt x={294} y={169} size={36} align="center" color={P.ink}>发送</Txt>
      </>
    );
  }
  return (
    <>
      {f >= 4 && <Txt x={142} y={53} size={48}>在干嘛</Txt>}
      {f >= 18 && <Txt x={258} y={95} size={48}>没干嘛</Txt>}
      {f >= 32 && <Txt x={144} y={137} size={48}>哦</Txt>}
    </>
  );
};

// 每屏右上角的连击数，和已经攒下的小怪
const Combo: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const n = f >= 36 ? i + 1 : i;
  const draw: Draw = useCallback(
    (ctx, fr) => {
      const k = fr >= 36 ? i + 1 : i;
      for (let j = 0; j < k; j++) monster(ctx, 30 + j * 20, 252 - (j === i ? Math.round(6 * Math.sin(clamp01((fr - 36) / 10) * Math.PI)) : 0), 1);
    },
    [i],
  );
  return (
    <>
      <PixelCanvas draw={draw} />
      {n > 0 && (
        <Txt x={464} y={232} size={72} align="right" color={P.sky} scale={i + 1 === n ? Math.max(1, punch(f, 36)) : 1}>
          老样子 ×{n}
        </Txt>
      )}
    </>
  );
};

// ---- 症状：一条一屏，每屏从右边推进来 ----
export const Symptoms: React.FC = () => (
  <AbsoluteFill>
    {SYMPTOMS.map((_, i) => (
      <Sequence key={i} from={i * SYMPTOM_FRAMES} durationInFrames={SYMPTOM_FRAMES}>
        <Screen i={i} />
      </Sequence>
    ))}
  </AbsoluteFill>
);

const SHIFT = 90;
const drawPanel: Draw = (ctx) => {
  ctx.fillStyle = P.dark;
  ctx.fillRect(20, 26, 252, 196);
  ctx.fillStyle = '#20233a';
  ctx.fillRect(22, 28, 248, 192);
};

const Screen: React.FC<{ i: number }> = ({ i }) => {
  const f = useCurrentFrame();
  const slide = Math.round(((1 - easeOut(p(f, 0, 6))) * LW) / 2) * S * 2;
  const [head, tail] = SYMPTOMS[i];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `translateX(${slide}px)` }}>
        <PixelCanvas draw={drawPanel} />
        <AbsoluteFill style={{ transform: `translate(${-SHIFT * S}px, ${4 * S}px)` }}>
          <PixelCanvas draw={DRAWS[i]} />
          <Extras i={i} />
        </AbsoluteFill>
        <Txt x={284} y={84} size={96} color={P.yellow} scale={punch(f, 3)} opacity={f >= 3 ? 1 : 0}>{head}</Txt>
        <Txt x={284} y={124} size={72} scale={punch(f, 12)} opacity={f >= 12 ? 1 : 0}>{tail}</Txt>
      </AbsoluteFill>
      <Combo i={i} />
    </AbsoluteFill>
  );
};

// ---- 标题：六只小怪并成一只，报出编号和名字 ----
const drawTitle: Draw = (ctx, f) => {
  // 脚下的小土包
  ctx.fillStyle = P.dark;
  for (let x = -60; x <= 60; x++) {
    const h = Math.round(26 * Math.exp(-(x * x) / 1400));
    ctx.fillRect(130 + x, 190 - h, 1, h);
    ctx.fillStyle = P.lime;
    ctx.fillRect(130 + x, 190 - h, 1, 1);
    ctx.fillStyle = P.dark;
  }
  if (f < 32) {
    for (let j = 0; j < 6; j++) {
      const t = ease(p(f, 2 + j * 3, 22 + j * 3));
      monster(ctx, lerp(30 + j * 20, 130, t), lerp(252, 150, t) - Math.sin(t * Math.PI) * 40, 1);
    }
    return;
  }
  if (f < 36) {
    ctx.fillStyle = P.white;
    ctx.fillRect(0, 0, LW, LH);
    return;
  }
  const land = clamp01((f - 36) / 10);
  monster(ctx, 130, 166 - Math.round(Math.sin(land * Math.PI) * 8), 5, f > 46 ? 0.04 * Math.sin(f * 0.2) : 0);
};

export const Title: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <PixelCanvas draw={drawTitle} />
      {f >= 44 && <Txt x={236} y={64} size={72} color={P.sky} scale={punch(f, 44)}>BUG-001</Txt>}
      {f >= 96 && <Txt x={234} y={90} size={192} scale={punch(f, 96)}>局部最优</Txt>}
      {f >= 120 && <Txt x={236} y={150} size={48} color={P.grey}>每一步都在变好，却到不了最好。</Txt>}
    </AbsoluteFill>
  );
};
