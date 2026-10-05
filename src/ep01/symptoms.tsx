import React, { useCallback } from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { PixelCanvas, type Draw } from '../lib/PixelCanvas';
import { Txt } from '../lib/Text';
import { clamp01, ease, easeOut, lerp, p } from '../lib/math';
import { LH, LW, P, S } from '../lib/theme';
import { SYMPTOMS } from './script';
import { hero, monster } from './world';

const box = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, border: string) => {
  ctx.fillStyle = border;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
};
// 出现时放大再回弹
const punch = (f: number, at: number) => (f < at ? 0 : 1 + 0.5 * (1 - easeOut(p(f, at, at + 8))));

// 1 奶茶：选框在四个新品上转了一圈，跳回左边的老样子
const cup = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, k = 1) => {
  ctx.fillStyle = P.grey;
  ctx.fillRect(x + 2 * k, y - 15 * k, k, 5 * k);
  ctx.fillStyle = P.white;
  ctx.fillRect(x - 6 * k, y - 11 * k, 12 * k, 2 * k);
  ctx.fillStyle = color;
  ctx.fillRect(x - 5 * k, y - 9 * k, 10 * k, 9 * k);
  ctx.fillRect(x - 4 * k, y, 8 * k, 2 * k);
  ctx.fillStyle = P.ink;
  for (let i = 0; i < 3; i++) ctx.fillRect(x - 3 * k + i * 3 * k, y - 2 * k, k, k);
};
const NEW_CUPS: [number, number, string][] = [
  [254, 84, P.green],
  [316, 84, P.red],
  [254, 156, P.sky],
  [316, 156, P.yellow],
];
const TEA_HOVER = [0, 1, 3, 2, 0, 1];
const drawTea: Draw = (ctx, f) => {
  const back = f >= 40;
  box(ctx, 134, 44, 72, 132, P.dark, back ? P.yellow : P.slate);
  cup(ctx, 170, 126, P.orange, 3);
  const at = f >= 4 && !back ? TEA_HOVER[Math.min(5, Math.floor((f - 4) / 6))] : -1;
  NEW_CUPS.forEach(([x, y, c], i) => {
    box(ctx, x - 26, y - 32, 52, 60, P.dark, i === at ? P.yellow : P.slate);
    cup(ctx, x, y + 14, c, 2);
    ctx.fillStyle = P.yellow;
    ctx.fillRect(x + 12, y - 30, 12, 6);
  });
};
// 2 理发：脑子里闪过一个新发型，开口还是老样子
const drawHaircut: Draw = (ctx, f) => {
  for (const x of [176, 304]) {
    ctx.fillStyle = P.yellow;
    ctx.fillRect(x - 16, 80, 32, 36);
    if (x > 240 && f < 20 && Math.floor(f / 4) % 2 === 0) {
      ctx.fillStyle = P.red;
      ctx.fillRect(x - 17, 70, 34, 12);
      for (let i = 0; i < 5; i++) ctx.fillRect(x - 16 + i * 7, 60, 4, 10);
    } else {
      ctx.fillStyle = P.plum;
      ctx.fillRect(x - 19, 66, 38, 18);
      ctx.fillRect(x - 19, 84, 6, 12);
      ctx.fillRect(x + 13, 84, 6, 12);
    }
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
// 3 游戏：换了个新英雄，连输两把，选框回到第一个
const HEROES = [P.yellow, P.cyan, P.lime, P.red, P.plum];
const drawGame: Draw = (ctx, f) => {
  const pick = f >= 4 && f < 38 ? 3 : 0;
  HEROES.forEach((c, i) => {
    const x = 152 + i * 44;
    box(ctx, x - 19, 48, 38, 52, P.dark, i === pick ? P.yellow : P.slate);
    hero(ctx, x, 94, 3, c, 0, 9);
  });
  const lost = (f >= 12 ? 1 : 0) + (f >= 24 ? 1 : 0);
  if ((f >= 12 && f < 22) || (f >= 24 && f < 34)) box(ctx, 196, 116, 88, 30, P.red, P.ink);
  // 段位星星，输一把掉一颗
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < 3 - lost ? P.yellow : P.slate;
    ctx.fillRect(216 + i * 20, 162, 8, 8);
  }
};
// 4 学习：笔往下面没做过的题挪了挪，又回到第一题，再做一遍
const drawStudy: Draw = (ctx, f) => {
  box(ctx, 140, 30, 170, 162, P.white, P.grey);
  const done = [3, 3, 0, 0, 0];
  if (f >= 44) done[0] = 4;
  done.forEach((n, i) => {
    const y = 44 + i * 29;
    ctx.fillStyle = P.grey;
    ctx.fillRect(152, y, 70, 3);
    ctx.fillRect(152, y + 8, 46, 3);
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = k < n ? P.green : i >= 2 && k === 0 ? P.red : '#dfe3ea';
      ctx.fillRect(238 + k * 16, y, 11, 11);
      if (i >= 2 && k === 0) {
        ctx.fillStyle = P.white;
        ctx.fillRect(240, y + 2, 7, 7);
      }
    }
  });
  // 铅笔
  const row = f < 18 ? 3 * ease(p(f, 4, 18)) : f < 30 ? 3 + 0.08 * Math.sin(f * 1.6) : 3 * (1 - ease(p(f, 30, 42)));
  const px = 226;
  const py = Math.round(48 + row * 29);
  ctx.fillStyle = P.orange;
  for (let i = 0; i < 12; i++) ctx.fillRect(px - 14 + i, py - 14 + i, 3, 3);
  ctx.fillStyle = P.ink;
  ctx.fillRect(px - 1, py - 1, 2, 2);
};
// 5 工作：老方法一趟趟跑完，新方法才走了一小段就被划掉
const drawWork: Draw = (ctx, f) => {
  const dropped = f >= 36;
  box(ctx, 148, 66, 184, 20, P.dark, f >= 42 ? P.yellow : P.slate);
  ctx.fillStyle = P.lime;
  ctx.fillRect(150, 68, Math.round(((f % 12) / 12) * 180), 16);
  box(ctx, 148, 126, 184, 20, P.dark, P.slate);
  ctx.fillStyle = dropped ? P.slate : P.sky;
  ctx.fillRect(150, 128, Math.round(p(f, 4, 36) * 60), 16);
  if (dropped) {
    ctx.fillStyle = P.red;
    ctx.fillRect(144, 135, Math.round(p(f, 36, 42) * 192), 2);
  }
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

const DRAWS = [drawTea, drawHaircut, drawGame, drawStudy, drawWork, drawChat];

const Extras: React.FC<{ i: number; f: number }> = ({ i, f }) => {
  if (i === 0) {
    return (
      <>
        <Txt x={281} y={36} size={36} align="center" color={P.grey}>新品</Txt>
        <Txt x={170} y={150} size={48} align="center" color={P.yellow} scale={punch(f, 40)} opacity={f >= 40 ? 1 : 0}>老样子</Txt>
      </>
    );
  }
  if (i === 1) {
    return (
      <>
        <Txt x={176} y={126} size={36} align="center" color={P.grey}>上次</Txt>
        <Txt x={304} y={126} size={36} align="center" color={P.grey}>这次</Txt>
        <Txt x={240} y={40} size={48} align="center" color={P.yellow} scale={punch(f, 20)} opacity={f >= 20 ? 1 : 0}>「跟上次一样」</Txt>
      </>
    );
  }
  if (i === 2) {
    return (
      <>
        {((f >= 12 && f < 22) || (f >= 24 && f < 34)) && <Txt x={240} y={119} size={72} align="center">失败</Txt>}
        <Txt x={152} y={104} size={36} align="center" color={P.yellow} scale={punch(f, 40)} opacity={f >= 40 ? 1 : 0}>本命</Txt>
      </>
    );
  }
  if (i === 3) {
    return (
      <>
        <Txt x={316} y={52} size={36} color={P.green}>熟悉</Txt>
        <Txt x={316} y={126} size={36} color={P.red}>薄弱</Txt>
      </>
    );
  }
  if (i === 4) {
    return (
      <>
        <Txt x={150} y={52} size={36} color={P.lime}>老方法</Txt>
        <Txt x={150} y={112} size={36} color={f >= 36 ? P.grey : P.sky}>新方法</Txt>
        <Txt x={262} y={154} size={48} color={P.red} scale={punch(f, 36)} opacity={f >= 36 ? 1 : 0}>太慢</Txt>
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

const SHIFT = 90;
const drawPanel: Draw = (ctx) => {
  ctx.fillStyle = P.dark;
  ctx.fillRect(20, 26, 252, 196);
  ctx.fillStyle = '#20233a';
  ctx.fillRect(22, 28, 248, 192);
};

// ---- 症状：一条一屏，从右边推进来。左下角每过一屏多一只小虫。 ----
export const Symptoms: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{ background: P.ink }}>
      {SYMPTOMS.map((sym, i) => {
        const node = (
          <Sequence key={i} from={from} durationInFrames={sym.dur}>
            <Screen i={i} />
          </Sequence>
        );
        from += sym.dur;
        return node;
      })}
    </AbsoluteFill>
  );
};

const Screen: React.FC<{ i: number }> = ({ i }) => {
  const raw = useCurrentFrame();
  const { scene, dur, text } = SYMPTOMS[i];
  // 小动画按 60 帧设计，短屏就加速播放
  const f = (raw * 60) / dur;
  const back = Math.round((38 * dur) / 60);
  const slide = Math.round(((1 - easeOut(p(raw, 0, 5))) * LW) / 2) * S * 2;
  const draw: Draw = useCallback((ctx, fr) => DRAWS[scene](ctx, (fr * 60) / dur), [scene, dur]);
  const bugs: Draw = useCallback(
    (ctx, fr) => {
      const n = fr >= dur / 2 ? i + 1 : i;
      for (let j = 0; j < n; j++) {
        const hop = j === i ? Math.round(6 * Math.sin(clamp01((fr - dur / 2) / 8) * Math.PI)) : 0;
        monster(ctx, 30 + j * 20, 252 - hop, 1);
      }
    },
    [i, dur],
  );
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `translateX(${slide}px)` }}>
        <PixelCanvas draw={drawPanel} />
        <AbsoluteFill style={{ transform: `translate(${-SHIFT * S}px, ${4 * S}px)` }}>
          <PixelCanvas draw={draw} />
          <Extras i={scene} f={f} />
        </AbsoluteFill>
        <Txt x={284} y={70} size={96} color={P.yellow} scale={punch(raw, 2)} opacity={raw >= 2 ? 1 : 0}>{text[0]}</Txt>
        <Txt x={284} y={112} size={60} scale={punch(raw, 6)} opacity={raw >= 6 ? 1 : 0}>{text[1]}</Txt>
        {/* 第二行等小动画退回去的那一下再出现 */}
        <Txt x={284} y={136} size={60} color={P.sky} scale={punch(raw, back)} opacity={raw >= back ? 1 : 0}>{text[2]}</Txt>
      </AbsoluteFill>
      <PixelCanvas draw={bugs} />
    </AbsoluteFill>
  );
};

// 结尾闪回用：某一屏定格在「退回去」之后的样子，只留名字
export const Flash: React.FC<{ i: number }> = ({ i }) => {
  const { scene, text } = SYMPTOMS[i];
  const draw: Draw = useCallback((ctx) => DRAWS[scene](ctx, 58), [scene]);
  return (
    <AbsoluteFill style={{ background: P.ink }}>
      <PixelCanvas draw={drawPanel} />
      <AbsoluteFill style={{ transform: `translate(${-SHIFT * S}px, ${4 * S}px)` }}>
        <PixelCanvas draw={draw} />
        <Extras i={scene} f={58} />
      </AbsoluteFill>
      <Txt x={284} y={100} size={144} color={P.yellow}>{text[0]}</Txt>
    </AbsoluteFill>
  );
};

// ---- 标题：六只小虫并成一只，报出编号和名字 ----
const drawTitle: Draw = (ctx, f) => {
  ctx.fillStyle = P.ink;
  ctx.fillRect(0, 0, LW, LH);
  ctx.fillStyle = P.dark;
  for (let x = -60; x <= 60; x++) {
    const h = Math.round(26 * Math.exp(-(x * x) / 1400));
    ctx.fillRect(130 + x, 190 - h, 1, h);
    ctx.fillStyle = P.lime;
    ctx.fillRect(130 + x, 190 - h, 1, 1);
    ctx.fillStyle = P.dark;
  }
  if (f < 24) {
    for (let j = 0; j < 6; j++) {
      const t = ease(p(f, 1 + j * 2, 16 + j * 2));
      monster(ctx, lerp(30 + j * 20, 130, t), lerp(252, 150, t) - Math.sin(t * Math.PI) * 40, 1);
    }
    return;
  }
  if (f < 27) {
    ctx.fillStyle = P.white;
    ctx.fillRect(0, 0, LW, LH);
    return;
  }
  const land = clamp01((f - 27) / 9);
  monster(ctx, 130, 166 - Math.round(Math.sin(land * Math.PI) * 8), 5, f > 36 ? 0.04 * Math.sin(f * 0.2) : 0);
};

export const Title: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <PixelCanvas draw={drawTitle} bloom />
      {f >= 30 && <Txt x={236} y={70} size={72} color={P.sky} scale={punch(f, 30)}>BUG-001</Txt>}
      {f >= 40 && <Txt x={234} y={96} size={192} scale={punch(f, 40)}>局部最优</Txt>}
    </AbsoluteFill>
  );
};
