import React, { useCallback } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Canvas, type Draw } from '../lib/Canvas';
import { BigText, Reveal } from '../lib/Text';
import { clamp01, ease, lerp, mix, p } from '../lib/math';
import { COLD, FONT, HOT, WHITE, rgba } from '../lib/theme';
import {
  ANNEAL,
  ANNEAL_END,
  ANNEAL_MAIN,
  CLIMB,
  CLIMB_COUNTS,
  CLIMB_END,
  CLIMB_MAIN,
  CLIMB_STEPS,
  HERO,
  MAIN,
  N,
  PEAKS,
  climbPath,
  f,
  peakOf,
} from './sim';
import { FIELD, FIELD_SIM } from './sim2d';
import { FULL, dot, drawField, drawLandscape, label, lerpCam, on, proj, type Cam } from './world';

const hud: React.CSSProperties = { position: 'absolute', fontFamily: FONT.mono, color: rgba(WHITE) };

// 山顶两侧各探出一步又退回来：往哪走都是下坡
const probes = (ctx: CanvasRenderingContext2D, cam: Cam, peak: number, q: number, word = '更差') => {
  const c = PEAKS[peak][0];
  const env = Math.sin(clamp01(q) * Math.PI);
  const d = 0.03 * Math.abs(Math.sin(q * Math.PI * 2));
  for (const s of [-1, 1]) {
    const [sx, sy] = on(c + s * d, cam);
    dot(ctx, sx, sy, 4, COLD, 0.75 * env);
    const [lx, ly] = on(c + s * 0.047, cam);
    label(ctx, `↓ ${word}`, lx + s * 40, ly - 6, { size: 30, c: COLD, alpha: env, font: FONT.mono });
  }
};

// ---- A：hook。十年每一步都选对，然后被困住，镜头拉开才看到真正的高山 ----
const ZOOM: Cam = { cx: 0.2, cy: 0.2, z: 3 };

export const SceneA: React.FC = () => {
  const frame = useCurrentFrame();
  const draw: Draw = useCallback((ctx, fr) => {
    const cam = lerpCam(ZOOM, FULL, ease(p(fr, 270, 335)));
    drawLandscape(ctx, cam, p(fr, 0, 12));
    const x = lerp(0.148, PEAKS[1][0], ease(p(fr, 8, 172)));
    if (fr >= 180 && fr < 270) probes(ctx, cam, 1, (fr - 180) / 90);
    const [hx, hy] = on(x, cam);
    dot(ctx, hx, hy, lerp(13, 8, p(fr, 270, 335)), HOT, p(fr, 4, 16));
    const a = p(fr, 322, 344);
    if (a > 0) {
      const [mx, my] = on(PEAKS[MAIN][0], cam);
      label(ctx, '你', hx, hy - 40, { size: 38, alpha: a, weight: 900 });
      label(ctx, '最高点', mx, my - 42, { size: 38, c: COLD, alpha: a, weight: 900 });
      dot(ctx, mx, my, 5, COLD, a * (0.6 + 0.4 * Math.sin(fr * 0.25)));
    }
  }, []);
  const days = Math.round(3650 * ease(p(frame, 8, 172)));
  return (
    <AbsoluteFill>
      <Canvas draw={draw} />
      <div style={{ ...hud, left: 130, top: 110, opacity: p(frame, 6, 20) * (1 - p(frame, 262, 280)) }}>
        <div style={{ fontSize: 30, color: rgba(WHITE, 0.55), letterSpacing: 4, fontFamily: FONT.sans }}>连续选对</div>
        <div style={{ fontSize: 96, fontWeight: 700, marginTop: 6 }}>
          {days.toLocaleString('en-US')}
          <span style={{ fontSize: 40, marginLeft: 14, fontFamily: FONT.serif }}>天</span>
        </div>
        <div style={{ fontSize: 32, color: rgba(COLD, 0.95), marginTop: 6, fontFamily: FONT.sans }}>向下 0 步</div>
      </div>
    </AbsoluteFill>
  );
};

// ---- B：标题卡。左对齐的编号 + 概念名 + 一句话定义 ----
export const SceneB: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: 1 - p(frame, 150, 168), color: rgba(WHITE) }}>
      <div style={{ position: 'absolute', left: 230, top: 236 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, opacity: p(frame, 0, 14) }}>
          <span style={{ fontFamily: FONT.mono, fontSize: 40, fontWeight: 700, color: rgba(HOT) }}>No.01</span>
          <span style={{ width: lerp(0, 420, ease(p(frame, 6, 40))), height: 2, background: rgba(WHITE, 0.5) }} />
        </div>
        <div style={{ fontFamily: FONT.serif, fontWeight: 900, fontSize: 250, letterSpacing: 10, lineHeight: 1.35 }}>
          <Reveal text="局部[最优]" start={10} tone="hot" perChar={7} />
        </div>
        <div style={{ fontFamily: FONT.mono, fontSize: 32, letterSpacing: 16, color: rgba(WHITE, 0.55), opacity: p(frame, 50, 68) }}>
          LOCAL OPTIMUM
        </div>
        <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 46, letterSpacing: 3, marginTop: 56 }}>
          <Reveal text="每一步都在变好，却到不了最好。" start={72} perChar={1.6} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---- C：爬山算法。100 个点，只有少数到了最高的山 ----
const DEMO = climbPath(0.6, 120);

const countsAbovePeaks = (ctx: CanvasRenderingContext2D, alpha: number) => {
  PEAKS.forEach(([c, h], k) => {
    const [sx, sy] = proj(c, h + 0.03, FULL);
    const main = k === MAIN;
    label(ctx, String(CLIMB_COUNTS[k]), sx, sy - 44, {
      size: main ? 64 : 40,
      c: main ? WHITE : COLD,
      alpha: alpha * (main ? 1 : 0.85),
      font: FONT.mono,
      weight: 700,
    });
  });
};

export const SceneC: React.FC = () => {
  const frame = useCurrentFrame();
  const draw: Draw = useCallback((ctx, fr) => {
    drawLandscape(ctx, FULL, 1);
    // 演示用的单个点：就落在大山脚下，却爬向了旁边的小山
    const demoA = p(fr, 16, 30) * (1 - p(fr, 250, 268));
    if (demoA > 0) {
      const [sx, sy] = on(DEMO[Math.round(clamp01((fr - 100) / 110) * 120)], FULL);
      dot(ctx, sx, sy, 9, HOT, demoA);
    }
    if (fr >= 270) {
      const blue = p(fr, 540, 572);
      for (let i = 0; i < N; i++) {
        const fall = p(fr, 270 + i * 0.5, 298 + i * 0.5);
        if (fall <= 0) continue;
        const x = CLIMB[i][Math.round(clamp01((fr - 380) / 110) * CLIMB_STEPS)];
        const [sx, sy] = on(x, FULL);
        const main = peakOf(CLIMB_END[i]) === MAIN;
        dot(
          ctx,
          sx,
          lerp(-30, sy, fall * fall),
          main ? lerp(4, 5.5, blue) : 4,
          main ? WHITE : mix(WHITE, COLD, blue),
          main ? 0.95 : lerp(0.9, 0.7, blue),
        );
      }
      countsAbovePeaks(ctx, p(fr, 452, 474));
    }
    if (fr >= 630 && fr < 720) {
      for (const k of [0, 1, 2, 3, 5]) probes(ctx, FULL, k, (fr - 630) / 90, '');
    }
  }, []);
  return (
    <AbsoluteFill>
      <Canvas draw={draw} />
      <div style={{ ...hud, left: 130, top: 100, opacity: p(frame, 10, 28) }}>
        <div style={{ fontFamily: FONT.serif, fontWeight: 900, fontSize: 52, letterSpacing: 6 }}>爬山算法</div>
        <div style={{ fontSize: 22, color: rgba(WHITE, 0.45), letterSpacing: 6, marginTop: 8 }}>HILL CLIMBING</div>
        <div style={{ fontSize: 36, color: rgba(COLD), marginTop: 26, opacity: p(frame, 96, 112) }}>
          if f(x′) &gt; f(x) : x ← x′
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---- D：人也一样。小山顶就是舒适区 ----
const LIFE: [number, string][] = [
  [1, '还行的工作'],
  [2, '熟悉的城市'],
  [3, '早就会做的事'],
];

export const SceneD: React.FC = () => {
  const frame = useCurrentFrame();
  const draw: Draw = useCallback((ctx, fr) => {
    const g = lerp(1, 0.2, p(fr, 540, 580));
    drawLandscape(ctx, FULL, g);
    const others = lerp(0.7, 0.28, p(fr, 0, 40)) * g;
    for (let i = 0; i < N; i++) {
      const [sx, sy] = on(CLIMB_END[i], FULL);
      const main = peakOf(CLIMB_END[i]) === MAIN;
      dot(ctx, sx, sy, 4, main ? WHITE : COLD, main ? others * 0.8 : others);
    }
    countsAbovePeaks(ctx, 1 - p(fr, 0, 24));
    LIFE.forEach(([k, name], i) => {
      const a = p(fr, 96 + i * 90, 116 + i * 90) * g;
      const [sx, sy] = proj(PEAKS[k][0], PEAKS[k][1] + 0.03, FULL);
      ctx.strokeStyle = rgba(WHITE, 0.35 * a);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, sy - 14);
      ctx.lineTo(sx, sy - 44);
      ctx.stroke();
      label(ctx, name, sx, sy - 72, { size: 38, alpha: a, weight: 700 });
    });
    if (fr >= 360 && fr < 450) {
      probes(ctx, FULL, 3, (fr - 360) / 90, '');
      const [vx, vy] = proj(0.602, 0.8, FULL);
      ['收入 ↓', '确定性 ↓', '面子 ↓'].forEach((s, i) => {
        const a = p(fr, 372 + i * 12, 386 + i * 12) * (1 - p(fr, 436, 450));
        label(ctx, s, vx, vy + i * 52, { size: 36, c: COLD, alpha: a, weight: 700, align: 'left' });
      });
    }
    const [hx, hy] = on(PEAKS[3][0], FULL);
    dot(ctx, hx, hy, 9, HOT, p(fr, 0, 30) * g);
  }, []);
  return (
    <AbsoluteFill>
      <Canvas draw={draw} />
      {frame >= 540 && (
        <BigText
          out={896}
          lines={[
            { text: '待在舒适区，不是因为你懒。', at: 552 },
            { text: '是因为你太会选[「更好」]了。', at: 650 },
          ]}
        />
      )}
    </AbsoluteFill>
  );
};

// ---- E：模拟退火。允许偶尔走一步更差的 ----
const PAPER = 'Optimization by Simulated Annealing';

export const SceneE: React.FC = () => {
  const frame = useCurrentFrame();
  const step = Math.round(clamp01((frame - 290) / 400) * ANNEAL.steps);
  const T = HERO.ts[step];
  // 温度按对数刻度归一到 0..1
  const heat = Math.log(T / ANNEAL.T1) / Math.log(ANNEAL.T0 / ANNEAL.T1);
  const draw: Draw = useCallback((ctx, fr) => {
    const a = p(fr, 270, 300);
    if (a <= 0) return;
    drawLandscape(ctx, FULL, a);
    const s = Math.round(clamp01((fr - 290) / 400) * ANNEAL.steps);
    const h = Math.log(HERO.ts[s] / ANNEAL.T1) / Math.log(ANNEAL.T0 / ANNEAL.T1);
    const c = mix(WHITE, HOT, clamp01(h * 1.2));
    const end = p(fr, 810, 840);
    if (end > 0) {
      for (let i = 0; i < N; i++) {
        const [sx, sy] = on(ANNEAL_END[i], FULL);
        dot(ctx, sx, sy, 4, mix(WHITE, HOT, 0.6), 0.85 * end);
      }
    }
    // 轨迹：最近 26 步
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const from = Math.max(0, s - 26);
    for (let k = from + 1; k <= s; k++) {
      const [x0, y0] = on(HERO.xs[k - 1], FULL);
      const [x1, y1] = on(HERO.xs[k], FULL);
      ctx.strokeStyle = rgba(c, 0.5 * ((k - from) / 26) ** 2 * a);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    ctx.restore();
    const [hx, hy] = on(HERO.xs[s], FULL);
    dot(ctx, hx, hy, 10, c, a * (1 - end * 0.3));
  }, []);

  const formulaT = ease(p(frame, 262, 296));
  return (
    <AbsoluteFill>
      <Canvas draw={draw} />
      {frame < 182 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 400,
            textAlign: 'center',
            fontFamily: FONT.latin,
            color: rgba(WHITE),
            opacity: 1 - p(frame, 166, 182),
          }}
        >
          <div style={{ fontSize: 70, fontStyle: 'italic' }}>
            {PAPER.slice(0, Math.round(p(frame, 10, 66) * PAPER.length))}
          </div>
          <div style={{ fontSize: 32, color: rgba(WHITE, 0.6), marginTop: 26, opacity: p(frame, 66, 84) }}>
            S. Kirkpatrick · C. D. Gelatt · M. P. Vecchi — <i>Science</i>, 13 May 1983
          </div>
          <div
            style={{
              width: 560,
              height: 4,
              margin: '46px auto 0',
              borderRadius: 2,
              opacity: p(frame, 92, 104),
              background: rgba(mix(HOT, COLD, p(frame, 104, 166))),
            }}
          />
        </div>
      )}
      {frame >= 180 && (
        <div
          style={{
            position: 'absolute',
            left: lerp(0, -700, formulaT),
            right: lerp(0, 700, formulaT),
            top: lerp(360, 70, formulaT),
            textAlign: 'center',
            transform: `scale(${lerp(1, 0.42, formulaT)})`,
            fontFamily: FONT.latin,
            fontStyle: 'italic',
            color: rgba(WHITE),
            opacity: p(frame, 184, 204) * (1 - p(frame, 800, 815)),
          }}
        >
          <div style={{ fontSize: 150 }}>
            P = e<sup style={{ fontSize: 84 }}>−Δ / T</sup>
          </div>
          <div
            style={{
              fontFamily: FONT.serif,
              fontStyle: 'normal',
              fontSize: 36,
              color: rgba(WHITE, 0.7),
              marginTop: 18,
              letterSpacing: 2,
              opacity: p(frame, 204, 222) * (1 - formulaT),
            }}
          >
            Δ：这一步变差了多少　　T：温度
          </div>
        </div>
      )}
      {frame >= 270 && frame < 815 && (
        <div style={{ ...hud, right: 150, top: 110, textAlign: 'right', opacity: p(frame, 276, 296) * (1 - p(frame, 800, 815)) }}>
          <div style={{ fontSize: 30, color: rgba(WHITE, 0.55), letterSpacing: 4, fontFamily: FONT.sans }}>温度 T</div>
          <div style={{ fontSize: 84, fontWeight: 700, color: rgba(mix(WHITE, HOT, clamp01(heat * 1.2))) }}>
            {T.toFixed(3)}
          </div>
          <div style={{ width: 300, height: 6, background: rgba(WHITE, 0.12), marginTop: 10, marginLeft: 'auto' }}>
            <div
              style={{
                width: `${clamp01(heat) * 100}%`,
                height: 6,
                marginLeft: 'auto',
                background: rgba(mix(WHITE, HOT, clamp01(heat * 1.2))),
              }}
            />
          </div>
        </div>
      )}
      {frame >= 815 && (
        <div style={{ ...hud, left: 130, top: 96 }}>
          {[
            { name: '只往上走', n: CLIMB_MAIN, at: 826, c: COLD, size: 72 },
            { name: '允许变差', n: ANNEAL_MAIN, at: 866, c: HOT, size: 128 },
          ].map((r) => (
            <div key={r.name} style={{ display: 'flex', alignItems: 'baseline', gap: 28, opacity: p(frame, r.at, r.at + 16) }}>
              <span style={{ fontFamily: FONT.serif, fontWeight: 700, fontSize: 42, width: 200 }}>{r.name}</span>
              <span
                style={{
                  fontSize: r.size,
                  fontWeight: 700,
                  color: rgba(r.c),
                }}
              >
                {Math.round(r.n * ease(p(frame, r.at, r.at + 30)))}
              </span>
              <span style={{ fontSize: 32, color: rgba(WHITE, 0.55), fontFamily: FONT.sans }}>/ {N} 到达最高点</span>
            </div>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---- F：高潮。几百个粒子先被困在小山顶，加热后四处流动，再冷却到最高峰 ----
const FIELD_START = 50;
const fieldStep = (fr: number) => clamp01((fr - FIELD_START) / (540 - FIELD_START - 20)) * FIELD.steps;

export const SceneF: React.FC = () => {
  const frame = useCurrentFrame();
  const draw: Draw = useCallback((ctx, fr) => drawField(ctx, fieldStep(fr), 1), []);
  const t = FIELD_SIM.temp[Math.floor(fieldStep(frame))];
  return (
    <AbsoluteFill>
      <Canvas draw={draw} />
      <div style={{ ...hud, left: 130, top: 90, fontSize: 22, letterSpacing: 5, color: rgba(WHITE, 0.45) }}>
        SIMULATED ANNEALING · n = {FIELD.n}
      </div>
      <div style={{ ...hud, right: 150, top: 80, fontSize: 36, color: rgba(mix(WHITE, HOT, clamp01(t * 1.4)), 0.9) }}>
        T = {t.toFixed(2)}
      </div>
    </AbsoluteFill>
  );
};

// ---- G：收尾。金句、今天就能做的事、片尾卡 ----
export const SceneG: React.FC = () => {
  const frame = useCurrentFrame();
  const draw: Draw = useCallback((ctx, fr) => {
    const a = 1 - p(fr, 60, 100);
    if (a > 0) drawField(ctx, FIELD.steps, a * 0.9);
  }, []);
  return (
    <AbsoluteFill>
      {frame < 100 && <Canvas draw={draw} />}
      {frame >= 90 && frame < 270 && (
        <BigText
          out={268}
          lines={[
            { text: '只肯往上走的人，', at: 98, tone: 'hot' },
            { text: '[到不了最高的地方]。', at: 150, size: 116, tone: 'hot' },
          ]}
        />
      )}
      {frame >= 270 && frame < 450 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 330,
            textAlign: 'center',
            fontFamily: FONT.serif,
            color: rgba(WHITE),
            opacity: 1 - p(frame, 434, 448),
          }}
        >
          <div style={{ fontSize: 68, fontWeight: 900, letterSpacing: 3 }}>
            <Reveal text="今天，做一件[「暂时变差」]的事。" start={278} tone="hot" perChar={1.8} />
          </div>
          <div style={{ display: 'inline-block', textAlign: 'left', marginTop: 54, fontSize: 48, fontWeight: 700, lineHeight: 1.9 }}>
            {['学一样你完全不会的。', '换一条没走过的路回家。'].map((s, i) => (
              <div key={s} style={{ opacity: p(frame, 334 + i * 34, 350 + i * 34) }}>
                <span style={{ color: rgba(HOT), marginRight: 22 }}>✓</span>
                {s}
              </div>
            ))}
          </div>
        </div>
      )}
      {frame >= 450 && (
        <AbsoluteFill style={{ opacity: 1 - p(frame, 598, 628), color: rgba(WHITE), textAlign: 'center' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 330 }}>
            <div style={{ fontFamily: FONT.serif, fontWeight: 900, fontSize: 150, letterSpacing: 12 }}>
              <Reveal text="概念[×]人生" start={456} tone="hot" perChar={4} />
            </div>
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 30,
                letterSpacing: 8,
                color: rgba(WHITE, 0.6),
                marginTop: 30,
                opacity: p(frame, 486, 504),
              }}
            >
              No.01 · 局部最优 · LOCAL OPTIMUM
            </div>
            <div style={{ fontFamily: FONT.sans, fontWeight: 600, fontSize: 44, letterSpacing: 3, marginTop: 70 }}>
              <Reveal text="关注我，下一期换一个概念看人生。" start={510} tone="hot" />
            </div>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
