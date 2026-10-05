import React, { useCallback } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { PixelCanvas, type Draw } from '../lib/PixelCanvas';
import { Txt } from '../lib/Text';
import { clamp01, ease, lerp, p } from '../lib/math';
import { FONT, P, S } from '../lib/theme';
import {
  ANNEAL,
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
  peakOf,
} from './sim';
import {
  CW,
  FULL,
  MAIN_LANE as G,
  NCOL,
  X0,
  applyCam,
  bubble,
  colOf,
  cx,
  desk,
  drawMotes,
  drawSky,
  drawTerrain,
  firework,
  flag,
  footY,
  hero,
  guy,
  lerpCam,
  peakCol,
  pilePos,
  shop,
  sofa,
  toScreen,
  type Cam,
} from './world';

// 同一张连续地图。u 是这一段开始后的帧数（每小节 90 帧）：
//    0 小人在山脚      95 往上爬，路边立起三样东西   185 到顶、左右试探
//  270 镜头拉远        450 金句一（字幕层盖住）      630 镜头推近，虚线指向高山
//  730 下山三步又退回   900 一百个小人下场           990 规则牌移到中间
// 1085 规则牌翻面      1170 天色变暖                1260 主角开始退火
// 1440 一百人重跑      1535 重跑结束                1620 镜头扫过没到的人
// 1710 回到主角        1800 脚印点亮整张地图         1890 金句二（字幕层盖住）
const DEMO = climbPath(0.6, 120);
const START = colOf(0.6);
const TOP = peakCol(3);
const MAINC = peakCol(MAIN);
const RUN: [number, number] = [1260, 1440];
const RERUN: [number, number] = [1440, 1535];

const CLIMB_SLOT = (() => {
  const seen = PEAKS.map(() => 0);
  return CLIMB_END.map((x) => seen[peakOf(x)]++);
})();
// 重跑时登顶的人按登顶先后排位
const RERUN_SLOT = (() => {
  const order = SETTLE.map((s, i) => [s, i]).filter(([s]) => s >= 0).sort((a, b) => a[0] - b[0]);
  const slot = new Array<number>(N).fill(-1);
  order.forEach(([, i], k) => (slot[i] = k));
  return slot;
})();
// 主角退火时踩过的列，从左到右
const PRINTS = [...new Set(Array.from(HERO.xs, (x) => colOf(x)))].sort((a, b) => a - b);

const heroStep = (u: number) => Math.round(p(u, RUN[0], RUN[1]) * ANNEAL.steps);
const crowdStep = (u: number) => Math.round(p(u, RERUN[0], RERUN[1]) * ANNEAL.steps);
const heatOf = (step: number) => clamp01(Math.log(HERO.ts[step] / ANNEAL.T1) / Math.log(ANNEAL.T0 / ANNEAL.T1));
export const arriveAt = (i: number) => RERUN[0] + (SETTLE[i] / ANNEAL.steps) * (RERUN[1] - RERUN[0]);
const rerunCount = (u: number) => {
  const s = crowdStep(u);
  let n = 0;
  for (let i = 0; i < N; i++) if (SETTLE[i] >= 0 && s >= SETTLE[i]) n++;
  return n;
};

// 天色：温度高就是暖色黄昏，冷下来回到夜里，结尾是天快亮的颜色
const warmth = (u: number) => {
  if (u < 1170) return 0;
  if (u < RUN[0]) return ease(p(u, 1170, 1250));
  if (u < RUN[1]) return heatOf(heroStep(u));
  if (u < RERUN[1]) return heatOf(crowdStep(u));
  return 0.45 * ease(p(u, 1640, 1760));
};

const heroCol = (u: number) => {
  if (u < 180) return colOf(DEMO[Math.round(p(u, 95, 175) * 120)]);
  if (u >= 185 && u < 215) return TOP + Math.round(2 * Math.sin(p(u, 185, 215) * Math.PI));
  if (u >= 215 && u < 245) return TOP - Math.round(2 * Math.sin(p(u, 215, 245) * Math.PI));
  if (u >= 730 && u < 840) return TOP + Math.round(4 * (u < 800 ? ease(p(u, 730, 790)) : 1 - ease(p(u, 810, 840))));
  if (u >= RUN[0]) return colOf(HERO.xs[heroStep(u)]);
  return TOP;
};

const KEYS: [number, number, Cam][] = [
  [270, 420, FULL],
  [630, 665, { x: 300, y: 152, z: 2 }],
  [895, 925, FULL],
  [1620, 1650, { x: 120, y: 182, z: 2 }],
  [1650, 1705, { x: 205, y: 182, z: 2 }],
  [1710, 1745, { x: 330, y: 138, z: 2 }],
  [1800, 1840, FULL],
];
const camAt = (u: number): Cam => {
  const hx = u < 180 ? X0 + DEMO[Math.round(p(u, 95, 175) * 120)] * CW * NCOL : cx(TOP);
  let cur: Cam = { x: hx, y: footY(heroCol(Math.min(u, 270)), G) - 16, z: 3 };
  for (const [a, b, target] of KEYS) {
    if (u >= b) cur = target;
    else if (u >= a) return lerpCam(cur, target, ease(p(u, a, b)));
    else break;
  }
  return cur;
};

const draw: Draw = (ctx, u) => {
  const cam = camAt(u);
  const w = warmth(u);
  drawSky(ctx, u, w, cam.x);
  ctx.save();
  // 重跑时每有人登顶，画面轻轻震一下
  if (u >= RERUN[0] && u < RERUN[1] + 4) {
    for (let i = 0; i < N; i++) {
      if (SETTLE[i] >= 0 && u - arriveAt(i) >= 0 && u - arriveAt(i) < 3) {
        ctx.translate(u % 2 ? 1 : -1, 0);
        break;
      }
    }
  }
  applyCam(ctx, cam);
  drawTerrain(ctx, G, w);

  // 从小山顶指向高山的虚线
  if (u >= 640 && u < 900) {
    const n = Math.round(p(u, 640, 700) * (MAINC - TOP));
    ctx.fillStyle = P.yellow;
    for (let c = TOP + 2; c <= TOP + n; c += 2) ctx.fillRect(cx(c) - 1, footY(c, G) - 8, 2, 2);
  }
  // 上山路上立起的三样东西
  if (u >= 112) shop(ctx, cx(START - 2), footY(START - 2, G));
  if (u >= 138) desk(ctx, cx(START - 5), footY(START - 5, G));
  if (u >= 162) sofa(ctx, cx(TOP) - 11, footY(TOP - 3, G));
  // 主角走过的脚印，连起来是整张地图的轮廓
  if (u >= 1800) {
    const n = Math.round(p(u, 1800, 1876) * PRINTS.length);
    ctx.fillStyle = P.yellow;
    for (let k = 0; k < n; k++) ctx.fillRect(cx(PRINTS[k]) - 1, footY(PRINTS[k], G) - 3, 2, 2);
  }

  // 旧规则下的一百个小人
  if (u >= 900 && u < 1010) {
    ctx.globalAlpha = 1 - p(u, 990, 1010);
    const idx = Math.round(p(u, 918, 972) * CLIMB_STEPS);
    for (let i = 0; i < N; i++) {
      const fall = p(u, 900 + i * 0.2, 916 + i * 0.2);
      if (fall <= 0) continue;
      const x = CLIMB[i][idx];
      const k = peakOf(CLIMB_END[i]);
      const arrived = u >= 918 && Math.abs(x - CLIMB_END[i]) < 1e-6;
      const [px, py] = arrived ? pilePos(k, CLIMB_SLOT[i], G) : [cx(colOf(x)), footY(colOf(x), G)];
      const color = !arrived ? [P.grey, P.sky, P.cyan][i % 3] : k === MAIN ? P.lime : P.slate;
      guy(ctx, px, lerp(-12, py, fall * fall), 4, color, arrived ? 0 : Math.floor(u / 3) + i);
    }
    if (u >= 975) {
      PEAKS.forEach((_, k) => {
        if (k !== MAIN) bubble(ctx, cx(peakCol(k)), footY(peakCol(k), G) - Math.ceil(CLIMB_COUNTS[k] / 7) * 5 - 3, u);
      });
    }
    ctx.globalAlpha = 1;
  }
  // 新规则下重跑
  if (u >= RERUN[0] && u < 1740) {
    ctx.globalAlpha = 1 - p(u, 1712, 1740);
    const s = crowdStep(u);
    const heat = heatOf(s);
    const over = u >= RERUN[1];
    for (let i = 0; i < N; i++) {
      const done = SETTLE[i] >= 0 && s >= SETTLE[i];
      const x = ANNEAL_RUNS[i][s];
      const [px, py] = done ? pilePos(MAIN, RERUN_SLOT[i], G, 17) : [cx(colOf(x)), footY(colOf(x), G)];
      const lost = over && !done;
      const color = done ? [P.lime, P.yellow, P.cyan][RERUN_SLOT[i] % 3] : lost ? P.orange : heat > 0.5 ? P.white : P.grey;
      const hop = done && (u + RERUN_SLOT[i] * 5) % 18 < 4 ? 2 : 0;
      guy(ctx, px, py - hop, 4, color, done || lost ? 0 : Math.floor(u / 2) + i);
      if (lost && u >= RERUN[1] + 20) bubble(ctx, px, py - 7, u);
      if (SETTLE[i] >= 0) {
        const top = footY(MAINC, G);
        firework(ctx, cx(MAINC) + ((i * 37) % 170) - 85, top - 34 - ((i * 13) % 50), u - arriveAt(i) - 8, i, 1.6, top - 10);
      }
    }
    ctx.globalAlpha = 1;
  }

  // 主角。全景时放大一倍，保证手机上看得见
  const col = heroCol(u);
  const sc = cam.z < 1.5 ? 2 : 1;
  const running = u >= RUN[0] && u < RUN[1];
  const heat = heatOf(heroStep(u));
  const color = running && heat > 0.5 ? P.orange : P.yellow;
  if (running) {
    const s = heroStep(u);
    for (let k = Math.max(0, s - 10); k < s; k++) {
      ctx.globalAlpha = 0.06 * (k - (s - 10));
      hero(ctx, cx(colOf(HERO.xs[k])), footY(colOf(HERO.xs[k]), G), sc, color, 0, 9);
    }
    ctx.globalAlpha = 1;
  }
  const moving = (u >= 95 && u < 175) || (u >= 730 && u < 840) || running;
  // 登顶后蹦几下
  const hop = u >= RUN[1] && u < RUN[1] + 70 && (u - RUN[1]) % 14 < 6 ? 3 : 0;
  hero(ctx, cx(col), footY(col, G) - hop, sc, color, moving ? Math.floor(u / 3) : 0, u);
  if ((u >= 245 && u < 450) || (u >= 845 && u < 900)) bubble(ctx, cx(col), footY(col, G) - 12 * sc, u - 245);
  if (u >= RUN[1]) {
    flag(ctx, cx(col) + 4 * sc, footY(col, G), P.yellow, u);
    for (let i = 0; i < 3; i++) firework(ctx, cx(col) + [-20, 16, -4][i], footY(col, G) - 36 - i * 8, u - RUN[1] - 2 - i * 7, i * 2, 1.4, footY(col, G) - 8);
  }
  ctx.restore();
  drawMotes(ctx, u, w);
};

// 规则牌：平时在左上角，补丁段移到中间翻面，再回左上角
const Sign: React.FC<{ u: number }> = ({ u }) => {
  if (u < 20 || (u >= 440 && u < 990) || u >= 1620) return null;
  const flip = p(u, 1085, 1110);
  const patched = flip > 0.5;
  const center = u >= 990 ? 1 - ease(p(u, 1170, 1196)) : 0;
  const big = center > 0.5;
  return (
    <div
      style={{
        position: 'absolute',
        left: lerp(16 * S, 960, center),
        top: lerp(24 * S, 380, center),
        transform: `translate(${-50 * center}%, ${-50 * center}%) scaleX(${Math.abs(Math.cos(flip * Math.PI))})`,
        border: `${2 * S}px solid ${patched ? P.lime : P.white}`,
        background: P.ink,
        padding: big ? '36px 60px' : '12px 28px',
        fontFamily: FONT,
        fontSize: big ? 72 : 36,
        lineHeight: 1.2,
        color: P.white,
        whiteSpace: 'nowrap',
        opacity: u < 440 ? p(u, 20, 26) * (1 - p(u, 432, 440)) : p(u, 990, 996) * (1 - p(u, 1612, 1620)),
      }}
    >
      <span style={{ color: patched ? P.lime : P.yellow }}>{patched ? '新规则　' : '规则　'}</span>
      {patched ? '偶尔，允许走一步下坡' : '只能往上走'}
    </div>
  );
};

export const Level: React.FC = () => {
  const u = useCurrentFrame();
  const drawCb = useCallback(draw, []);
  const cam = camAt(u);
  const col = heroCol(u);
  const [hx, hy] = toScreen(cam, cx(col), footY(col, G));
  const n = rerunCount(u);
  const pop = n > rerunCount(u - 3) ? 1.2 : 1;
  const [mx, my] = toScreen(cam, cx(MAINC), footY(MAINC, G));
  return (
    <AbsoluteFill>
      <PixelCanvas draw={drawCb} bloom />
      {['分数 −1', '效率 −1', '体面 −1'].map((s, i) => {
        const a = 738 + i * 16;
        if (u < a || u >= a + 36) return null;
        return (
          <Txt key={s} x={hx + 14} y={hy - 30 - (u - a) * 0.8} size={48} color={P.orange} opacity={1 - p(u, a + 24, a + 36)}>
            {s}
          </Txt>
        );
      })}
      {u >= 975 && u < 1010 && (
        <>
          <Txt x={mx} y={my - 64} size={96} align="center" color={P.lime} opacity={1 - p(u, 990, 1010)}>
            {CLIMB_MAIN}
          </Txt>
          <Txt x={150} y={64} size={144} align="center" color={P.grey} opacity={1 - p(u, 990, 1010)}>
            {N - CLIMB_MAIN}
          </Txt>
        </>
      )}
      {u >= RERUN[0] + 6 && u < 1620 && (
        <Txt x={150} y={52} size={144} align="center" color={P.lime} scale={pop} opacity={1 - p(u, 1608, 1620)}>
          {n}
        </Txt>
      )}
      <Sign u={u} />
    </AbsoluteFill>
  );
};

// ---- 开头：十级台阶，一年一级。走到头，前面是断崖 ----
export const STEP_W = 16;
export const STEP_H = 9;
const stair = (i: number): [number, number] =>
  i < 0 ? [64, 210] : i >= 10 ? [251, 210 - 10 * STEP_H] : [80 + i * STEP_W + 8, 210 - (i + 1) * STEP_H];
// 十级台阶和地面。done 是已经踩亮的级数。
export const drawStairs = (ctx: CanvasRenderingContext2D, done: number) => {
  ctx.fillStyle = P.dark;
  ctx.fillRect(-200, 210, 440, 80);
  for (let i = 0; i <= 10; i++) {
    const x = i < 10 ? 80 + i * STEP_W : 240;
    const w = i < 10 ? STEP_W : 22;
    const top = 210 - Math.min(10, i + 1) * STEP_H;
    ctx.fillStyle = P.dark;
    ctx.fillRect(x, top, w, 290 - top);
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.fillRect(x, top + 14, w, 290 - top);
    // 踩过的台阶亮起来
    ctx.fillStyle = i < done ? P.yellow : P.lime;
    ctx.fillRect(x, top, w, 1);
    ctx.fillStyle = i < done ? P.orange : P.green;
    ctx.fillRect(x, top + 1, w, 1);
  }
  ctx.fillStyle = P.lime;
  ctx.fillRect(-200, 210, 280, 1);
};
const CLIMB_T: [number, number] = [6, 84];
// 第 k 次落脚的帧（k=0 是第一级）
export const landFrame = (k: number) => CLIMB_T[0] + ((k + 1) * (CLIMB_T[1] - CLIMB_T[0])) / 11;
const hookPos = (t: number): [number, number, boolean] => {
  if (t >= 100 && t < 124) return [251 + 8 * Math.sin(p(t, 100, 124) * Math.PI), 120, true];
  if (t >= 124 && t < 148) return [251 - 8 * Math.sin(p(t, 124, 148) * Math.PI), 120, true];
  const s = p(t, CLIMB_T[0], CLIMB_T[1]) * 11;
  const k = Math.min(10, Math.floor(s));
  const fr = Math.min(1, s - k);
  const [x0, y0] = stair(k - 1);
  const [x1, y1] = stair(k);
  return [lerp(x0, x1, fr), lerp(y0, y1, fr) - Math.sin(fr * Math.PI) * 6, s < 11];
};
const hookCam = (t: number): Cam => {
  const [x, y] = hookPos(t);
  return { x: x + 10, y: y - 22, z: 2 };
};
const drawHook: Draw = (ctx, t) => {
  const cam = hookCam(t);
  drawSky(ctx, t, 0, cam.x);
  ctx.save();
  applyCam(ctx, cam);
  drawStairs(ctx, Math.floor(p(t, CLIMB_T[0], CLIMB_T[1]) * 11));
  const [x, y, moving] = hookPos(t);
  hero(ctx, x, y, 2, P.yellow, moving ? Math.floor(t / 3) : 0, t);
  if (t >= 150) bubble(ctx, x, y - 24, t - 150);
  ctx.restore();
  drawMotes(ctx, t, 0);
};

export const Hook: React.FC = () => {
  const t = useCurrentFrame();
  const drawCb = useCallback(drawHook, []);
  const cam = hookCam(t);
  return (
    <AbsoluteFill>
      <PixelCanvas draw={drawCb} bloom />
      {Array.from({ length: 10 }, (_, k) => {
        const a = Math.round(landFrame(k));
        if (t < a || t >= a + 24) return null;
        const [sx, sy] = toScreen(cam, ...stair(k));
        return (
          <Txt key={k} x={sx} y={sy - 62 - (t - a) * 0.6} size={48} align="center" color={P.lime} opacity={1 - p(t, a + 14, a + 24)}>
            第 {k + 1} 年
          </Txt>
        );
      })}
      {[1, -1].map((d) => {
        const on = d > 0 ? t >= 104 && t < 124 : t >= 128 && t < 148;
        if (!on) return null;
        const [sx, sy] = toScreen(cam, 251 + d * 26, 120);
        return (
          <Txt key={d} x={sx} y={sy - 4} size={48} align="center" color={P.orange}>
            ↓ 更差
          </Txt>
        );
      })}
    </AbsoluteFill>
  );
};
