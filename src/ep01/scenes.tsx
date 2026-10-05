import React, { useCallback } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Canvas, type Draw } from '../lib/Canvas';
import { Rich, Typed } from '../lib/Text';
import { clamp01, ease, easeOut, lerp, mix, p } from '../lib/math';
import { BLOCK, DIM, FONT, GREEN, LINE, PANEL, RED, TEXT, YELLOW, rgba, type Rgb } from '../lib/theme';
import {
  ANNEAL,
  ANNEAL_MAIN,
  ANNEAL_RUNS,
  CLIMB,
  CLIMB_COUNTS,
  CLIMB_END,
  CLIMB_MAIN,
  CLIMB_STEPS,
  HERO,
  MAIN,
  N,
  PEAKS,
  SETTLE,
  climbPath,
  f,
  peakOf,
} from './sim';
import { SYMPTOMS } from './script';
import { BASE, CW, agent, colH, colOf, colX, drawTerrain, label, peakXY } from './world';

const panel: React.CSSProperties = {
  position: 'absolute',
  background: PANEL,
  border: `2px solid ${LINE}`,
  borderRadius: 16,
};
const mono: React.CSSProperties = { fontFamily: FONT.mono, color: rgba(TEXT) };
const sans: React.CSSProperties = { fontFamily: FONT.sans, fontWeight: 600, color: rgba(TEXT) };

// 山顶两侧各探出几格又退回来：往哪走都是下坡
const probes = (ctx: CanvasRenderingContext2D, peak: number, q: number, size: number) => {
  const c = colOf(PEAKS[peak][0]);
  const env = Math.sin(clamp01(q) * Math.PI);
  const d = Math.round(3 * Math.abs(Math.sin(q * Math.PI * 2)));
  for (const s of [-1, 1]) {
    if (d > 0) agent(ctx, c + s * d, 0, size, RED, 0.7 * env);
    label(ctx, '↓', colX(c + s * 5) + CW / 2, BASE - colH(c + s * 5) - 34, { size: 30, c: RED, alpha: env, font: FONT.mono });
  }
};

// ---- A：症状。六张卡片半小节一张，从小事到大事，最后并成一个 bug ----
export const SceneA: React.FC = () => {
  const frame = useCurrentFrame();
  const merge = ease(p(frame, 270, 300));
  return (
    <AbsoluteFill>
      {SYMPTOMS.map(([emoji, text], i) => {
        const at = i * 45;
        const pop = easeOut(p(frame, at, at + 9));
        const x = 120 + (i % 3) * 572;
        const y = 122 + Math.floor(i / 3) * 384;
        const stamp = easeOut(p(frame, at + 18, at + 28));
        return (
          <div
            key={text}
            style={{
              ...panel,
              ...sans,
              left: lerp(x, 692, merge),
              top: lerp(y, 314, merge) + (1 - pop) * 30,
              width: 536,
              height: 352,
              padding: '34px 38px',
              boxSizing: 'border-box',
              opacity: pop * (1 - p(frame, 288, 306)),
              transform: `rotate(${(1 - merge) * ((i % 2) * 2 - 1) * 1.2}deg) scale(${lerp(1, 0.86, merge)})`,
            }}
          >
            <div style={{ fontSize: 84, lineHeight: 1 }}>{emoji}</div>
            <div style={{ fontSize: 44, lineHeight: 1.35, marginTop: 26 }}>{text}</div>
            <div style={{ ...mono, position: 'absolute', left: 38, bottom: 30, fontSize: 24, color: rgba(DIM) }}>
              症状 #{String(i + 1).padStart(2, '0')}
            </div>
            <div
              style={{
                position: 'absolute',
                right: 30,
                bottom: 24,
                padding: '4px 16px',
                border: `3px solid ${rgba(RED)}`,
                borderRadius: 8,
                color: rgba(RED),
                fontSize: 28,
                opacity: stamp,
                transform: `rotate(-6deg) scale(${lerp(1.6, 1, stamp)})`,
              }}
            >
              我也是
            </div>
          </div>
        );
      })}
      <div
        style={{
          ...sans,
          position: 'absolute',
          left: 0,
          right: 0,
          top: 400,
          textAlign: 'center',
          fontSize: 120,
          letterSpacing: 6,
          opacity: p(frame, 300, 314),
        }}
      >
        6 条症状 <span style={{ color: rgba(DIM) }}>→</span> <span style={{ color: rgba(RED) }}>1 个 bug</span>
      </div>
    </AbsoluteFill>
  );
};

// ---- B：图鉴条目卡。左边是标本图，右边是编号、名称和几行说明 ----
const specimen: Draw = (ctx, fr) => {
  const hill = (x: number) => 150 * Math.exp(-((x - 0.36) ** 2) / 0.02) + 330 * Math.exp(-((x - 1.02) ** 2) / 0.03);
  for (let c = 0; c < 26; c++) {
    const h = Math.round(hill((c + 0.5) / 26) / 6) * 6 + 18;
    ctx.fillStyle = rgba(BLOCK);
    ctx.fillRect(196 + c * 18, 760 - h, 17, h);
    ctx.fillStyle = rgba(TEXT, 0.5);
    ctx.fillRect(196 + c * 18, 760 - h, 17, 3);
  }
  // 小方块在小山顶上左右试探，每次都退回来
  const d = Math.round(2 * Math.sin(fr * 0.12));
  const c = 9 + d;
  const h = Math.round(hill((c + 0.5) / 26) / 6) * 6 + 18;
  ctx.fillStyle = rgba(RED);
  ctx.fillRect(196 + c * 18, 760 - h - 21, 17, 17);
};

export const SceneB: React.FC = () => {
  const frame = useCurrentFrame();
  const rows: [string, React.ReactNode][] = [
    ['表现', '每一步都在变好，却到不了最好。'],
    ['高发', '越会做选择的人，越容易中。'],
    ['状态', <span style={{ color: rgba(RED) }}>● 未修复</span>],
  ];
  return (
    <AbsoluteFill>
      <div style={{ ...panel, left: 160, top: 250, width: 540, height: 540, opacity: p(frame, 0, 10) }} />
      <Canvas draw={specimen} opacity={p(frame, 4, 16)} />
      <div style={{ position: 'absolute', left: 790, top: 236, ...sans }}>
        <div style={{ ...mono, fontSize: 44, fontWeight: 700, color: rgba(RED), opacity: p(frame, 4, 14) }}>BUG-001</div>
        <div
          style={{
            fontSize: 190,
            lineHeight: 1.25,
            letterSpacing: 8,
            WebkitTextStroke: `3px ${rgba(TEXT)}`,
            opacity: p(frame, 10, 22),
            transform: `translateX(${(1 - easeOut(p(frame, 10, 26))) * 40}px)`,
          }}
        >
          局部最优
        </div>
        <div style={{ ...mono, fontSize: 30, letterSpacing: 14, color: rgba(DIM), opacity: p(frame, 22, 34) }}>
          LOCAL OPTIMUM
        </div>
        <div style={{ marginTop: 46, fontSize: 38, lineHeight: 1.9 }}>
          {rows.map(([k, v], i) => (
            <div key={k} style={{ opacity: p(frame, 40 + i * 14, 52 + i * 14) }}>
              <span style={{ color: rgba(DIM), marginRight: 34 }}>{k}</span>
              {v}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---- C：复现。只往高处走的规则，100 个方块只有少数到了最高的山 ----
const DEMO = climbPath(0.6, 120);

// 把一组方块按所在列叠起来画
const drawCrowd = (
  ctx: CanvasRenderingContext2D,
  xs: (i: number) => number,
  style: (i: number) => { c: Rgb; a: number; dy?: number } | null,
) => {
  const stack = new Map<number, number>();
  for (let i = 0; i < N; i++) {
    const s = style(i);
    if (!s) continue;
    const c = colOf(xs(i));
    const k = stack.get(c) ?? 0;
    stack.set(c, k + 1);
    agent(ctx, c, k, 9, s.c, s.a, s.dy ?? 0);
  }
};

const stackCounts = (ctx: CanvasRenderingContext2D, alpha: number) => {
  PEAKS.forEach((_, k) => {
    const [sx, sy] = peakXY(k);
    const main = k === MAIN;
    label(ctx, String(CLIMB_COUNTS[k]), sx, sy - CLIMB_COUNTS[k] * 10 - 40, {
      size: main ? 60 : 38,
      c: main ? GREEN : RED,
      alpha,
      font: FONT.mono,
      weight: 700,
    });
  });
};

export const SceneC: React.FC = () => {
  const frame = useCurrentFrame();
  const draw: Draw = useCallback((ctx, fr) => {
    drawTerrain(ctx, 1);
    // 演示用的单个方块：就落在大山脚下，却爬向了旁边的小山
    const demoA = p(fr, 16, 30) * (1 - p(fr, 250, 268));
    agent(ctx, colOf(DEMO[Math.round(clamp01((fr - 100) / 110) * 120)]), 0, 26, YELLOW, demoA);
    if (fr >= 270) {
      const idx = Math.round(clamp01((fr - 380) / 110) * CLIMB_STEPS);
      const green = p(fr, 452, 474);
      const red = p(fr, 540, 566);
      drawCrowd(
        ctx,
        (i) => CLIMB[i][idx],
        (i) => {
          const fall = p(fr, 270 + i * 0.5, 298 + i * 0.5);
          if (fall <= 0) return null;
          const main = peakOf(CLIMB_END[i]) === MAIN;
          return { c: main ? mix(TEXT, GREEN, green) : mix(TEXT, RED, red), a: 1, dy: -(1 - fall * fall) * 700 };
        },
      );
      stackCounts(ctx, green);
    }
    if (fr >= 630 && fr < 720) for (const k of [0, 1, 2, 3, 5]) probes(ctx, k, (fr - 630) / 90, 9);
  }, []);
  const bugLine = p(frame, 724, 740);
  return (
    <AbsoluteFill>
      <Canvas draw={draw} />
      <div style={{ ...panel, ...mono, left: 120, top: 112, padding: '22px 34px', fontSize: 32, lineHeight: 1.6, opacity: p(frame, 92, 106) }}>
        <div style={{ color: rgba(DIM) }}>function 下一步() {'{'}</div>
        <div>{'  '}if (那边更高) 走过去();</div>
        <div
          style={{
            color: rgba(mix(DIM, RED, bugLine)),
            textDecoration: bugLine > 0.5 ? `underline wavy ${rgba(RED)}` : undefined,
            textUnderlineOffset: 8,
          }}
        >
          {'  '}// 否则：原地不动
        </div>
        <div style={{ color: rgba(DIM) }}>{'}'}</div>
      </div>
    </AbsoluteFill>
  );
};

// ---- D：根因。把开头的症状贴回小山顶上 ----
const LIFE: [number, string][] = [
  [1, '🍜 那三家外卖'],
  [2, '💼 还行的工作'],
  [3, '💬 挑不出错的关系'],
];

export const SceneD: React.FC = () => {
  const frame = useCurrentFrame();
  const draw: Draw = useCallback((ctx, fr) => {
    const dim = lerp(1, 0.25, p(fr, 540, 575));
    drawTerrain(ctx, dim);
    const crowd = 1 - p(fr, 0, 40);
    if (crowd > 0) {
      drawCrowd(
        ctx,
        (i) => CLIMB_END[i],
        (i) => ({ c: peakOf(CLIMB_END[i]) === MAIN ? GREEN : RED, a: crowd }),
      );
      stackCounts(ctx, crowd);
    }
    if (fr >= 360 && fr < 450) {
      probes(ctx, 3, (fr - 360) / 90, 26);
      ['收入 ↓', '确定性 ↓', '面子 ↓'].forEach((s, i) => {
        const a = p(fr, 372 + i * 12, 386 + i * 12) * (1 - p(fr, 436, 450));
        label(ctx, s, 1050, 330 + i * 56, { size: 40, c: RED, alpha: a, weight: 600, align: 'left' });
      });
    }
    agent(ctx, colOf(PEAKS[3][0]), 0, 26, YELLOW, p(fr, 10, 40) * dim);
  }, []);
  return (
    <AbsoluteFill>
      <Canvas draw={draw} />
      {LIFE.map(([k, name], i) => {
        const [sx, sy] = peakXY(k);
        const a = easeOut(p(frame, 96 + i * 90, 110 + i * 90));
        return (
          <div
            key={name}
            style={{
              ...panel,
              ...sans,
              left: sx,
              top: sy - (k === 3 ? 118 : 92) - (1 - a) * 16,
              transform: 'translateX(-50%)',
              padding: '8px 22px',
              fontSize: 34,
              whiteSpace: 'nowrap',
              borderRadius: 10,
              opacity: a * (1 - p(frame, 540, 566)),
            }}
          >
            {name}
          </div>
        );
      })}
      {frame >= 540 && (
        <div style={{ position: 'absolute', left: 200, top: 250, ...sans, opacity: 1 - p(frame, 884, 898) }}>
          <div
            style={{
              ...mono,
              display: 'inline-block',
              fontSize: 30,
              fontWeight: 700,
              padding: '6px 20px',
              borderRadius: 8,
              background: rgba(RED),
              color: '#131316',
              opacity: p(frame, 546, 556),
            }}
          >
            根因 ROOT CAUSE
          </div>
          <div style={{ fontSize: 100, lineHeight: 1.6, letterSpacing: 4, marginTop: 30 }}>
            <div>
              <Typed text="待在舒适区，不是因为你懒。" start={556} perChar={2.4} cursor={false} />
            </div>
            <div>
              <Typed text="是因为你太会选[「更好」]了。" start={650} perChar={2.4} cursor={false} />
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---- E：补丁。模拟退火就是给规则改一行 ----
export const SceneE: React.FC = () => {
  const frame = useCurrentFrame();
  const step = Math.round(clamp01((frame - 290) / 400) * ANNEAL.steps);
  const T = HERO.ts[step];
  // 温度按对数刻度归一到 0..1
  const heat = clamp01(Math.log(T / ANNEAL.T1) / Math.log(ANNEAL.T0 / ANNEAL.T1));
  const draw: Draw = useCallback((ctx, fr) => {
    const a = p(fr, 270, 300);
    if (a <= 0) return;
    drawTerrain(ctx, a);
    const s = Math.round(clamp01((fr - 290) / 400) * ANNEAL.steps);
    const h = clamp01(Math.log(HERO.ts[s] / ANNEAL.T1) / Math.log(ANNEAL.T0 / ANNEAL.T1));
    const c = mix(GREEN, YELLOW, clamp01(h * 2.5));
    // 最近 14 步留下的脚印
    for (let k = Math.max(0, s - 14); k < s; k++) {
      agent(ctx, colOf(HERO.xs[k]), 0, 26, c, 0.28 * ((k - (s - 14)) / 14) * a);
    }
    agent(ctx, colOf(HERO.xs[s]), 0, 26, c, a);
  }, []);

  const shrink = ease(p(frame, 262, 296));
  return (
    <AbsoluteFill>
      <Canvas draw={draw} />
      {frame < 182 && (
        <div style={{ ...mono, position: 'absolute', left: 260, top: 290, fontSize: 40, lineHeight: 1.7, opacity: 1 - p(frame, 168, 182) }}>
          <div style={{ color: rgba(YELLOW) }}>
            <Typed text="commit 1983-05-13" start={8} cursor={false} />
          </div>
          <div style={{ color: rgba(DIM), opacity: p(frame, 34, 46) }}>Author: Kirkpatrick · Gelatt · Vecchi (IBM)</div>
          <div style={{ fontSize: 64, marginTop: 30, opacity: p(frame, 50, 64) }}>Optimization by Simulated Annealing</div>
          <div style={{ color: rgba(DIM), opacity: p(frame, 60, 74) }}>Science, vol. 220</div>
          <div style={{ ...sans, fontSize: 56, marginTop: 36, color: rgba(GREEN), opacity: p(frame, 96, 110) }}>模拟退火</div>
        </div>
      )}
      {frame >= 180 && (
        <div
          style={{
            ...panel,
            ...mono,
            left: lerp(200, 120, shrink),
            top: lerp(330, 104, shrink),
            transform: `scale(${lerp(1, 0.55, shrink)})`,
            transformOrigin: 'top left',
            padding: '26px 0',
            fontSize: 42,
            lineHeight: 1.8,
            whiteSpace: 'nowrap',
            opacity: p(frame, 184, 198),
          }}
        >
          <div style={{ padding: '0 40px', background: rgba(RED, 0.16), color: rgba(RED) }}>
            −{'  '}if (那边更高) 走过去();
          </div>
          <div style={{ padding: '0 40px', background: rgba(GREEN, 0.16), color: rgba(GREEN), opacity: p(frame, 204, 218) }}>
            +{'  '}if (那边更高 || 随机数 &lt; e<sup style={{ fontSize: 28 }}>−Δ/T</sup>) 走过去();
          </div>
          <div style={{ ...sans, padding: '14px 40px 0', fontSize: 30, color: rgba(DIM), opacity: p(frame, 222, 236) }}>
            Δ：这一步变差了多少　　T：温度
          </div>
        </div>
      )}
      {frame >= 270 && (
        <div style={{ ...mono, position: 'absolute', right: 120, top: 108, textAlign: 'right', opacity: p(frame, 276, 296) }}>
          <div style={{ ...sans, fontSize: 30, color: rgba(DIM) }}>温度 T</div>
          <div style={{ fontSize: 84, fontWeight: 700, color: rgba(mix(GREEN, YELLOW, clamp01(heat * 2.5))) }}>{T.toFixed(3)}</div>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', marginTop: 6 }}>
            {Array.from({ length: 20 }, (_, i) => (
              <span
                key={i}
                style={{ width: 12, height: 22, background: i < Math.round(heat * 20) ? rgba(YELLOW) : rgba(TEXT, 0.12) }}
              />
            ))}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---- F：回归测试。100 个格子各跑一遍退火，稳定在最高峰就变绿 ----
const COLS = 10;
const TW = 160;
const TH = 62;
const GAP = 8;
const GX = 120;
const GY = 196;
const RUN0 = 70;

const tileState = (i: number, fr: number): 'pass' | 'fail' | 'run' => {
  if (fr < RUN0 - 20) return peakOf(CLIMB_END[i]) === MAIN ? 'pass' : 'fail';
  const s = fr - RUN0;
  if (SETTLE[i] >= 0 && s >= SETTLE[i]) return 'pass';
  return s >= ANNEAL.steps ? 'fail' : 'run';
};
const stateRgb = { pass: GREEN, fail: RED, run: YELLOW };

const drawMatrix: Draw = (ctx, fr) => {
  const s = Math.max(0, Math.min(ANNEAL.steps, fr - RUN0));
  for (let i = 0; i < N; i++) {
    const appear = p(fr, i * 0.3, i * 0.3 + 10);
    if (appear <= 0) continue;
    const x0 = GX + (i % COLS) * (TW + GAP);
    const y0 = GY + Math.floor(i / COLS) * (TH + GAP);
    const c = stateRgb[tileState(i, fr)];
    ctx.fillStyle = rgba(c, 0.12 * appear);
    ctx.fillRect(x0, y0, TW, TH);
    ctx.fillStyle = rgba(c, 0.9 * appear);
    ctx.fillRect(x0, y0, 5, TH);
    // 缩小的地形剪影
    ctx.fillStyle = rgba(TEXT, 0.2 * appear);
    for (let k = 0; k < 36; k++) {
      const h = f((k + 0.5) / 36) * (TH - 16);
      ctx.fillRect(x0 + 12 + k * 4, y0 + TH - 5 - h, 3, h);
    }
    const x = fr < RUN0 ? CLIMB_END[i] : ANNEAL_RUNS[i][s];
    ctx.fillStyle = rgba(c, appear);
    ctx.fillRect(x0 + 12 + x * 144 - 4, y0 + TH - 5 - f(x) * (TH - 16) - 9, 8, 8);
  }
};

export const SceneF: React.FC = () => {
  const frame = useCurrentFrame();
  let pass = 0;
  for (let i = 0; i < N; i++) if (tileState(i, frame) === 'pass') pass++;
  const patched = frame >= RUN0 - 20;
  const done = frame >= RUN0 + ANNEAL.steps;
  return (
    <AbsoluteFill>
      <Canvas draw={drawMatrix} />
      <div style={{ position: 'absolute', left: 120, right: 120, top: 100, display: 'flex', alignItems: 'baseline', ...sans }}>
        <span style={{ fontSize: 40 }}>回归测试</span>
        <span
          style={{
            ...mono,
            fontSize: 26,
            marginLeft: 24,
            padding: '4px 16px',
            borderRadius: 8,
            color: '#131316',
            background: rgba(patched ? GREEN : RED),
          }}
        >
          {patched ? '补丁后' : '补丁前'}
        </span>
        <span style={{ ...mono, fontSize: 26, marginLeft: 24, color: rgba(DIM) }}>
          {done ? '运行结束' : patched ? `运行中 step ${Math.max(0, frame - RUN0)}/${ANNEAL.steps}` : `${CLIMB_MAIN}/${N} 通过`}
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ ...mono, fontSize: 84, fontWeight: 700, color: rgba(patched ? GREEN : RED) }}>{pass}</span>
        <span style={{ ...mono, fontSize: 40, marginLeft: 12, color: rgba(DIM) }}>/ {N}</span>
      </div>
    </AbsoluteFill>
  );
};

// ---- G：结论。金句、临时方案、片尾 ----
export const SceneG: React.FC = () => {
  const frame = useCurrentFrame();
  const draw: Draw = useCallback((ctx, fr) => {
    const a = 1 - p(fr, 76, 90);
    if (a <= 0) return;
    drawTerrain(ctx, a);
    // 从小山顶往下走，穿过山谷，朝最高的山去
    const t = ease(p(fr, 6, 84));
    agent(ctx, colOf(lerp(PEAKS[3][0], 0.66, t)), 0, 26, mix(YELLOW, GREEN, t), a);
  }, []);
  const todo = ['点一家没点过的外卖', '换一条没走过的路回家'];
  return (
    <AbsoluteFill>
      {frame < 90 && <Canvas draw={draw} />}
      {frame >= 90 && frame < 270 && (
        <div style={{ position: 'absolute', left: 200, top: 300, ...sans, fontSize: 116, lineHeight: 1.55, letterSpacing: 4, opacity: 1 - p(frame, 256, 268) }}>
          <div>
            <Typed text="只肯往上走的人，" start={96} perChar={2.6} cursor={false} />
          </div>
          <div>
            <Typed text="[到不了最高的地方]。" start={150} perChar={2.6} tone="fix" cursor={false} />
          </div>
        </div>
      )}
      {frame >= 270 && frame < 450 && (
        <div style={{ ...panel, ...sans, left: 300, top: 220, width: 1320, padding: '44px 60px', boxSizing: 'border-box', opacity: p(frame, 270, 282) * (1 - p(frame, 436, 448)) }}>
          <div style={{ ...mono, fontSize: 28, color: rgba(YELLOW) }}>临时方案 WORKAROUND</div>
          <div style={{ fontSize: 72, marginTop: 20, letterSpacing: 2 }}>
            <Rich text="今天，做一件[「暂时变差」]的事。" tone="fix" />
          </div>
          <div style={{ fontSize: 50, lineHeight: 1.9, marginTop: 30 }}>
            {todo.map((s, i) => {
              const on = frame >= 330 + i * 36;
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', opacity: p(frame, 296 + i * 16, 308 + i * 16) }}>
                  <span
                    style={{
                      width: 44,
                      height: 44,
                      marginRight: 26,
                      borderRadius: 8,
                      border: `3px solid ${rgba(on ? GREEN : DIM)}`,
                      background: on ? rgba(GREEN) : 'transparent',
                      color: '#131316',
                      fontSize: 36,
                      lineHeight: '44px',
                      textAlign: 'center',
                    }}
                  >
                    {on ? '✓' : ''}
                  </span>
                  {s}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {frame >= 450 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center', ...sans, opacity: p(frame, 450, 462) }}>
          <div style={{ fontSize: 150, letterSpacing: 10, WebkitTextStroke: `2px ${rgba(TEXT)}` }}>
            人生 <span style={{ color: rgba(RED), WebkitTextStroke: `2px ${rgba(RED)}` }}>bug</span> 图鉴
          </div>
          <div style={{ ...mono, fontSize: 34, marginTop: 30, color: rgba(DIM), opacity: p(frame, 474, 488) }}>
            BUG-001 局部最优 · <span style={{ color: rgba(GREEN) }}>已收录</span> · {ANNEAL_MAIN}/{N} 可缓解
          </div>
          <div style={{ ...mono, fontSize: 34, marginTop: 16, color: rgba(DIM), opacity: p(frame, 500, 514) }}>
            BUG-002 · <span style={{ color: rgba(YELLOW) }}>待收录</span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
