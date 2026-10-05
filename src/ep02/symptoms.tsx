import React, { useCallback } from 'react';
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion';
import { PixelCanvas, type Draw } from '../lib/PixelCanvas';
import { Rich, Txt, Typed, textLength } from '../lib/Text';
import { clamp01, ease, easeOut, lerp, p } from '../lib/math';
import { FONT, LH, LW, P, S } from '../lib/theme';
import { ENTRY, SYMPTOMS } from './script';
import { bearHead, monster } from './world';

const box = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill: string, border: string) => {
  ctx.fillStyle = border;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
};
// 出现时放大再回弹
const punch = (f: number, at: number) => (f < at ? 0 : 1 + 0.5 * (1 - easeOut(p(f, at, at + 8))));

// 六个小动画是同一个形状：按下去（第 8–20 帧），安静一会儿，第 38 帧弹回来，比原来更大。
const BACK = 38;

// 1 一首歌：按下暂停，音符没了；弹回来时音符从四面冒出来
const note = (ctx: CanvasRenderingContext2D, x: number, y: number, k: number, color: string) => {
  ctx.fillStyle = color;
  ctx.fillRect(x + 3 * k, y - 9 * k, k, 9 * k);
  ctx.fillRect(x + 3 * k, y - 9 * k, 4 * k, 2 * k);
  ctx.fillRect(x, y - 2 * k, 4 * k, 3 * k);
};
const NOTE_COLORS = [P.cyan, P.yellow, P.lime, P.orange];
const drawSong: Draw = (ctx, f) => {
  const paused = f >= 10 && f < BACK;
  const back = f >= BACK;
  const dy = paused ? 2 : 0;
  box(ctx, 196, 76 + dy, 88, 88, P.dark, back ? P.yellow : paused ? P.slate : P.grey);
  ctx.fillStyle = paused ? P.slate : P.white;
  if (paused) {
    for (let i = 0; i < 28; i++) ctx.fillRect(228 + i, 100 + dy + Math.round(i * 0.72), 1, 40 - Math.round(i * 1.44));
  } else {
    ctx.fillRect(222, 100, 12, 40);
    ctx.fillRect(246, 100, 12, 40);
  }
  if (!paused && !back) {
    note(ctx, 304, 78 - Math.round(3 * Math.sin(f * 0.5)), 2, P.cyan);
    note(ctx, 160, 112 + Math.round(3 * Math.sin(f * 0.5)), 2, P.yellow);
  }
  if (back) {
    const r = 58 + 26 * easeOut(p(f, BACK, BACK + 10));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + 0.4;
      const bob = Math.round(2 * Math.sin(f * 0.6 + i));
      note(ctx, Math.round(232 + Math.cos(a) * r * 1.25), Math.round(128 + Math.sin(a) * r * 0.85) + bob, i % 2 ? 3 : 2, NOTE_COLORS[i % 4]);
    }
  }
};

// 2 奶茶：杯子被推远，越来越小；弹回来变成三杯
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
const drawTea: Draw = (ctx, f) => {
  ctx.fillStyle = P.slate;
  ctx.fillRect(150, 168, 172, 2);
  if (f < BACK) {
    const k = f < 8 ? 4 : f < 13 ? 3 : f < 17 ? 2 : f < 21 ? 1 : 0;
    if (k) cup(ctx, 236, 160 - (4 - k) * 14, P.orange, k);
    return;
  }
  [176, 236, 296].forEach((x, i) => {
    const t = clamp01((f - BACK - i * 2) / 8);
    if (f < BACK + i * 2) return;
    cup(ctx, x, 160 - Math.round(Math.sin(t * Math.PI) * 10), i === 1 ? P.orange : i ? P.red : P.green, i === 1 ? 4 : 3);
  });
};

// 3 上台：握着话筒的手在抖，另一只手按住它；弹回来抖得更厉害
const fist = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.fillStyle = P.yellow;
  ctx.fillRect(x - 15, y - 13, 30, 26);
  ctx.fillStyle = P.orange;
  for (let i = 0; i < 3; i++) ctx.fillRect(x - 15, y - 6 + i * 7, 22, 1);
  ctx.fillRect(x - 15, y + 11, 30, 2);
};
const drawStage: Draw = (ctx, f) => {
  const back = f >= BACK;
  const amp = f < 8 ? 1.5 : f < 20 ? 1.5 * (1 - p(f, 8, 20)) : back ? 7 : 0;
  const dx = Math.round(amp * Math.sin(f * 2.4));
  const x = 236 + dx;
  // 话筒
  ctx.fillStyle = P.grey;
  ctx.fillRect(x - 4, 88, 8, 70);
  ctx.fillStyle = P.slate;
  ctx.fillRect(x - 10, 62, 20, 28);
  ctx.fillStyle = P.dark;
  for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) ctx.fillRect(x - 7 + i * 6, 66 + j * 6, 3, 3);
  fist(ctx, x, 132);
  // 另一只手从右边按上来，弹回来时被甩开
  if (f >= 8 && !back) fist(ctx, Math.round(lerp(330, 262, ease(p(f, 8, 18)))), 126);
  if (back) {
    ctx.fillStyle = P.white;
    const flick = Math.floor(f / 2) % 2;
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(176 - flick * 4, 100 + i * 22, 14, 2);
      ctx.fillRect(284 + flick * 4, 110 + i * 22, 14, 2);
    }
  }
};

// 4 下班：合上电脑；弹回来屏幕自己打开，邮件跳出来
const envelope = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) => {
  ctx.fillStyle = P.white;
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  ctx.fillStyle = P.slate;
  for (let i = 0; i < w / 2; i++) {
    const d = Math.round((i * h) / w);
    ctx.fillRect(x - w / 2 + i, y - h / 2 + d, 1, 1);
    ctx.fillRect(x + w / 2 - 1 - i, y - h / 2 + d, 1, 1);
  }
};
const drawWork: Draw = (ctx, f) => {
  const back = f >= BACK;
  const open = f < 8 ? 1 : f < 20 ? 1 - ease(p(f, 8, 20)) : back ? easeOut(p(f, BACK, BACK + 6)) : 0;
  const h = Math.round(4 + 70 * open);
  ctx.fillStyle = P.slate;
  ctx.fillRect(180, 160 - h, 112, h);
  if (open > 0.4) {
    ctx.fillStyle = back ? P.cyan : P.navy;
    ctx.fillRect(184, 164 - h, 104, h - 8);
    envelope(ctx, 236, 160 - h / 2, back ? 48 : 32, back ? 32 : 22);
    if (back) {
      ctx.fillStyle = P.red;
      ctx.fillRect(254, 160 - h / 2 - 22, 12, 12);
    }
  }
  ctx.fillStyle = P.grey;
  ctx.fillRect(170, 160, 132, 8);
  ctx.fillStyle = P.dark;
  ctx.fillRect(170, 166, 132, 2);
  if (back) {
    [
      [176, 70],
      [300, 62],
      [236, 44],
    ].forEach(([x, y], i) => {
      if (f < BACK + 3 + i * 3) return;
      const t = clamp01((f - BACK - 3 - i * 3) / 8);
      envelope(ctx, x, y + Math.round((1 - easeOut(t)) * 30), 28, 18);
    });
  }
};

// 5 失眠：闭上眼；弹回来睁得更大
const drawEyes: Draw = (ctx, f) => {
  const back = f >= BACK;
  const openAmt = f < 6 ? 1 : f < 18 ? 1 - ease(p(f, 6, 18)) : back ? 1 : 0;
  const w = back ? 56 : 44;
  const h = back ? 56 : Math.max(3, Math.round(32 * openAmt));
  for (const x of [190, 282]) {
    if (h <= 3) {
      ctx.fillStyle = P.grey;
      ctx.fillRect(x - w / 2, 118, w, 3);
      continue;
    }
    ctx.fillStyle = P.white;
    ctx.fillRect(x - w / 2 + 4, 120 - h / 2, w - 8, h);
    ctx.fillRect(x - w / 2, 120 - h / 2 + Math.min(4, h / 4), w, h - Math.min(8, h / 2));
    ctx.fillStyle = P.ink;
    const pw = back ? 12 : 16;
    const ph = Math.min(h - 4, back ? 12 : 18);
    ctx.fillRect(x - pw / 2, 120 - ph / 2, pw, ph);
  }
};

// 6 和 TA：把手机扣过去；弹回来翻回正面，头像亮着
const drawPhone: Draw = (ctx, f) => {
  const back = f >= BACK;
  const t = f < 8 ? 0 : f < 20 ? ease(p(f, 8, 20)) : back ? 1 - easeOut(p(f, BACK, BACK + 8)) : 1;
  const w = Math.max(4, Math.round(68 * Math.abs(Math.cos(t * Math.PI))));
  const l = 236 - Math.round(w / 2);
  const face = t < 0.5;
  const lit = back && face;
  box(ctx, l, 58, w, 122, face ? (lit ? P.blue : P.navy) : P.dark, lit ? P.yellow : P.slate);
  if (!face) {
    if (w > 30) {
      ctx.fillStyle = P.slate;
      ctx.fillRect(l + 8, 66, 10, 10);
    }
    return;
  }
  if (w < 44) return;
  const k = lit ? 1.3 : 1;
  ctx.fillStyle = P.orange;
  ctx.fillRect(236 - Math.round(11 * k), Math.round(104 - 11 * k), Math.round(22 * k), Math.round(22 * k));
  ctx.fillRect(236 - Math.round(18 * k), Math.round(104 + 14 * k), Math.round(36 * k), Math.round(14 * k));
  ctx.fillStyle = P.grey;
  ctx.fillRect(218, 160, 36, 4);
};

const DRAWS = [drawSong, drawTea, drawStage, drawWork, drawEyes, drawPhone];

const Extras: React.FC<{ i: number; f: number }> = ({ i, f }) => {
  const quiet = f >= 20 && f < BACK;
  if (i === 0) return quiet ? <Txt x={240} y={176} size={36} align="center" color={P.grey}>暂停</Txt> : null;
  if (i === 1) return quiet ? <Txt x={236} y={100} size={48} align="center" color={P.grey}>今天不喝</Txt> : null;
  if (i === 2) return quiet ? <Txt x={236} y={176} size={36} align="center" color={P.grey}>别紧张</Txt> : null;
  if (i === 3) return quiet ? <Txt x={236} y={120} size={48} align="center" color={P.grey}>下班</Txt> : null;
  if (i === 4) {
    return f >= BACK ? (
      <Txt x={236} y={170} size={60} align="center" color={P.yellow} scale={punch(f, BACK)}>03:17</Txt>
    ) : null;
  }
  return null;
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
  const back = Math.round((BACK * dur) / 60);
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
        {/* 第二行等小动画弹回来的那一下再出现 */}
        <Txt x={284} y={136} size={60} color={P.sky} scale={punch(raw, back)} opacity={raw >= back ? 1 : 0}>{text[2]}</Txt>
      </AbsoluteFill>
      <PixelCanvas draw={bugs} />
    </AbsoluteFill>
  );
};

// 结尾闪回用：某一屏定格在「弹回来」之后的样子，只留名字
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

// ---- 命名和词条卡：六只小虫并成一只，报出编号和名字（第 1 小节）；然后整体上移，打出定义并停住（第 2–3 小节）----
const CARD = 90; // 从这一帧起进入词条卡
const LIFT = 46; // 进入词条卡时标题上移多少（小画布像素）
const lift = (f: number) => Math.round(LIFT * ease(p(f, CARD, CARD + 14)));
const drawTitle: Draw = (ctx, f) => {
  ctx.fillStyle = P.ink;
  ctx.fillRect(0, 0, LW, LH);
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
  const up = lift(f);
  const land = clamp01((f - 27) / 9);
  monster(ctx, 130, 166 - up - Math.round(Math.sin(land * Math.PI) * 8), 5, f > 36 ? 0.04 * Math.sin(f * 0.2) : 0);
  if (f >= CARD + 14) {
    // 定义上方的分隔线，中间嵌一个小熊头
    ctx.fillStyle = P.dark;
    ctx.fillRect(60, 136, 360, 1);
    ctx.fillStyle = P.ink;
    ctx.fillRect(228, 132, 24, 9);
    bearHead(ctx, 240.5, 140);
  }
};

export const Title: React.FC = () => {
  const f = useCurrentFrame();
  const up = lift(f);
  const defStart = CARD + 22;
  const second = defStart + textLength(ENTRY.def[0]) * 2 + 10;
  const sourceAt = second + textLength(ENTRY.def[1]) * 2 + 16;
  return (
    <AbsoluteFill>
      <PixelCanvas draw={drawTitle} bloom />
      {f >= 30 && <Txt x={236} y={70 - up} size={72} color={P.sky} scale={punch(f, 30)}>{ENTRY.id}</Txt>}
      {f >= 40 && <Txt x={234} y={96 - up} size={192} scale={punch(f, 40)}>{ENTRY.name}</Txt>}
      {f >= defStart && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 152 * S,
            textAlign: 'center',
            fontFamily: FONT,
            fontSize: 72,
            lineHeight: '108px',
            color: P.white,
          }}
        >
          <div style={{ minHeight: 108 }}><Typed text={ENTRY.def[0]} start={defStart} perChar={2} /></div>
          <div style={{ minHeight: 108 }}><Typed text={ENTRY.def[1]} start={second} perChar={2} /></div>
        </div>
      )}
      {f >= sourceAt && (
        <Txt x={240} y={214} size={48} align="center" color={P.grey} opacity={p(f, sourceAt, sourceAt + 8)}>
          <Rich text={ENTRY.source} />
        </Txt>
      )}
    </AbsoluteFill>
  );
};
