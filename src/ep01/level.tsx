import React, { useCallback } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { PixelCanvas, type Draw } from '../lib/PixelCanvas';
import { Txt, Typed } from '../lib/Text';
import { clamp01, ease, lerp, p } from '../lib/math';
import { FONT, P, S } from '../lib/theme';
import { ANNEAL, CLIMB, CLIMB_COUNTS, CLIMB_END, CLIMB_STEPS, HERO, MAIN, N, PEAKS, climbPath, peakOf } from './sim';
import { CW, MAIN_LANE as G, X0, bubble, colOf, cx, desk, drawSky, drawTerrain, firework, flag, footY, guy, peakCol, pilePos, shop, sofa } from './world';

// 这一段是同一张连续地图，t 是从「复现」开始算的帧数（每小节 90 帧）：
//   0  小人出场      90 往上爬       180 到顶、试探   270 镜头拉远
// 360  100 人下场   540 清点人数    630 卡住的冒泡
// 720  人也一样     810/900/945 山顶上的东西        990 走下坡又退回
// 1080 金句        1260 规则卡      1350 翻面        1440 温度条
// 1530 开始退火    1830 降温结束    1840 插旗
const DEMO = climbPath(0.6, 120);
const TOP = peakCol(3);
const T_RUN = 1530;
const T_COOL = 1830;

// 爬山结束后每个人在自己那座山顶上排第几
const SLOT = (() => {
  const seen = PEAKS.map(() => 0);
  return CLIMB_END.map((x) => seen[peakOf(x)]++);
})();

const annealStep = (t: number) => Math.round(p(t, T_RUN, T_COOL) * ANNEAL.steps);
const heatAt = (t: number) =>
  clamp01(Math.log(HERO.ts[annealStep(t)] / ANNEAL.T1) / Math.log(ANNEAL.T0 / ANNEAL.T1));

const heroCol = (t: number) => {
  if (t < 180) return colOf(DEMO[Math.round(p(t, 95, 175) * 120)]);
  if (t >= 185 && t < 215) return TOP + Math.round(2 * Math.sin(p(t, 185, 215) * Math.PI));
  if (t >= 215 && t < 245) return TOP - Math.round(2 * Math.sin(p(t, 215, 245) * Math.PI));
  if (t >= 1000 && t < 1060) return TOP + Math.round(3 * Math.sin(p(t, 1000, 1060) * Math.PI));
  if (t >= T_RUN) return colOf(HERO.xs[annealStep(t)]);
  return TOP;
};

const draw: Draw = (ctx, t) => {
  // 镜头：开头贴着小人，270 帧起拉远到全景
  const zoom = lerp(3, 1, ease(p(t, 275, 335)));
  const hx = t < 180 ? X0 + DEMO[Math.round(p(t, 95, 175) * 120)] * (CW * 112) : cx(TOP);
  const camX = lerp(hx, 240, ease(p(t, 275, 335)));
  const camY = lerp(footY(heroCol(t), G) - 14, 116, ease(p(t, 275, 335)));
  drawSky(ctx, t, true, camX * 0.3);
  ctx.save();
  ctx.translate(240, 116);
  ctx.scale(zoom, zoom);
  ctx.translate(-Math.round(camX), -Math.round(camY));
  drawTerrain(ctx, G);

  // 山顶上的三样东西，就是开头的症状
  if (t >= 810) shop(ctx, cx(peakCol(1)) + 9, footY(peakCol(1) + 2, G));
  if (t >= 900) desk(ctx, cx(peakCol(2)) + 9, footY(peakCol(2) + 2, G));
  if (t >= 945) sofa(ctx, cx(TOP) - 11, footY(TOP - 3, G));

  // 100 个小人
  if (t >= 360 && t < 760) {
    ctx.globalAlpha = 1 - p(t, 720, 760);
    const idx = Math.round(p(t, 400, 520) * CLIMB_STEPS);
    for (let i = 0; i < N; i++) {
      const fall = p(t, 360 + i * 0.4, 385 + i * 0.4);
      if (fall <= 0) continue;
      const x = CLIMB[i][idx];
      const k = peakOf(CLIMB_END[i]);
      const arrived = Math.abs(x - CLIMB_END[i]) < 1e-6 && t >= 400;
      const [px, py] = arrived ? pilePos(k, SLOT[i], G) : [cx(colOf(x)), footY(colOf(x), G)];
      const color = t >= 540 && k === MAIN ? P.lime : t >= 630 && k !== MAIN ? P.slate : [P.grey, P.sky, P.cyan][i % 3];
      guy(ctx, px, lerp(-12, py, fall * fall), 4, color, arrived ? 0 : Math.floor(t / 4) + i);
    }
    if (t >= 630) {
      PEAKS.forEach((_, k) => {
        if (k !== MAIN) bubble(ctx, cx(peakCol(k)), footY(peakCol(k), G) - Math.ceil(CLIMB_COUNTS[k] / 7) * 5 - 3, t);
      });
    }
    if (t >= 540) flag(ctx, cx(peakCol(MAIN)) + 14, footY(peakCol(MAIN) + 3, G), P.lime, t);
    ctx.globalAlpha = 1;
  }

  // 主角
  const col = heroCol(t);
  const heat = heatAt(t);
  const running = t >= T_RUN;
  const color = !running ? P.yellow : heat > 0.5 ? P.orange : heat > 0.12 ? P.yellow : P.lime;
  if (running) {
    // 最近几步的残影
    const s = annealStep(t);
    for (let k = Math.max(0, s - 8); k < s; k++) {
      ctx.globalAlpha = 0.08 * (k - (s - 8));
      guy(ctx, cx(colOf(HERO.xs[k])), footY(colOf(HERO.xs[k]), G), 8, color);
    }
    ctx.globalAlpha = 1;
  }
  const moving = (t >= 95 && t < 175) || (running && t < T_COOL);
  guy(ctx, cx(col), footY(col, G), t < 275 ? 6 : 8, color, moving ? Math.floor(t / 3) : 0);
  if (t >= 245 && t < 720) bubble(ctx, cx(col), footY(col, G) - 12, t - 245);
  if (t >= 1840) {
    flag(ctx, cx(col) + 6, footY(col, G), P.yellow, t);
    for (let i = 0; i < 4; i++) firework(ctx, cx(col) + [-18, 14, -6, 22][i], footY(col, G) - 26 - i * 5, t - 1846 - i * 9, i * 2);
  }
  ctx.restore();
};

const Card: React.FC<{ t: number }> = ({ t }) => {
  // 规则卡：先在左上角，补丁段移到中间翻面，再回到左上角
  const visible = (t >= 96 && t < 720) || t >= 1260;
  if (!visible) return null;
  const flip = p(t, 1350, 1376);
  const patched = flip > 0.5;
  const center = t >= 1260 ? 1 - ease(p(t, 1440, 1464)) : 0;
  const size = center > 0.5 ? 72 : 36;
  return (
    <div
      style={{
        position: 'absolute',
        left: lerp(64, 960, center),
        top: lerp(96, 400, center),
        transform: `translate(${-50 * center}%, ${-50 * center}%) scaleX(${Math.abs(Math.cos(flip * Math.PI))})`,
        border: `8px solid ${patched ? P.lime : P.white}`,
        background: P.ink,
        padding: center > 0.5 ? '36px 60px' : '14px 28px',
        fontFamily: FONT,
        fontSize: size,
        lineHeight: 1.2,
        color: P.white,
        whiteSpace: 'nowrap',
        opacity: t < 720 ? p(t, 96, 100) * (1 - p(t, 712, 720)) : p(t, 1260, 1266),
      }}
    >
      <span style={{ color: patched ? P.lime : P.yellow }}>{patched ? '新规则　' : '规则　'}</span>
      {patched ? '偶尔，允许走一步下坡' : '只能往上走'}
    </div>
  );
};

export const Level: React.FC = () => {
  const t = useCurrentFrame();
  const drawCb = useCallback(draw, []);
  const heat = heatAt(t);
  const col = heroCol(t);
  const quote = t >= 1080 && t < 1260;
  return (
    <AbsoluteFill>
      <PixelCanvas draw={drawCb} />
      {t >= 540 &&
        t < 760 &&
        PEAKS.map((_, k) => (
          <Txt
            key={k}
            x={cx(peakCol(k))}
            y={footY(peakCol(k), G) - Math.ceil(CLIMB_COUNTS[k] / 7) * 5 - (k === MAIN ? 34 : t >= 630 ? 28 : 20)}
            size={k === MAIN ? 96 : 48}
            align="center"
            color={k === MAIN ? P.lime : P.grey}
            opacity={1 - p(t, 720, 760)}
          >
            {CLIMB_COUNTS[k]}
          </Txt>
        ))}
      {t >= 810 && t < 990 && <Txt x={cx(peakCol(1)) + 9} y={footY(peakCol(1), G) - 28} size={36} align="center" color={P.yellow}>那三家外卖</Txt>}
      {t >= 900 && t < 990 && <Txt x={cx(peakCol(2)) + 9} y={footY(peakCol(2), G) - 28} size={36} align="center" color={P.yellow}>还行的工作</Txt>}
      {t >= 945 && t < 990 && <Txt x={cx(TOP) - 8} y={footY(TOP, G) - 30} size={36} align="center" color={P.yellow}>挑不出错的关系</Txt>}
      {['收入 −1', '面子 −1', '确定性 −1'].map((s, i) => {
        const a = 1004 + i * 14;
        if (t < a || t >= a + 34) return null;
        return (
          <Txt key={s} x={cx(col) + 10} y={footY(col, G) - 16 - (t - a) * 0.7} size={36} color={P.red} opacity={1 - p(t, a + 22, a + 34)}>
            {s}
          </Txt>
        );
      })}
      {quote && (
        <AbsoluteFill
          style={{
            background: 'rgba(26,28,44,0.94)',
            opacity: p(t, 1080, 1088) * (1 - p(t, 1250, 1260)),
            fontFamily: FONT,
            fontSize: 96,
            lineHeight: '156px',
            color: P.white,
            paddingLeft: 180,
            paddingTop: 300,
          }}
        >
          <div>
            <Typed text="待在舒适区，不是因为你懒。" start={1090} perChar={2.2} />
          </div>
          <div>
            <Typed text="是因为你太会选[「更好」]了。" start={1160} perChar={2.2} />
          </div>
        </AbsoluteFill>
      )}
      <Card t={t} />
      {t >= 1440 && (
        <div style={{ position: 'absolute', right: 64, top: 96, fontFamily: FONT, color: P.white, textAlign: 'right', opacity: p(t, 1440, 1448) }}>
          <span style={{ fontSize: 48 }}>温度　</span>
          <span style={{ fontSize: 72, color: heat > 0.5 ? P.orange : heat > 0.12 ? P.yellow : P.lime }}>
            {HERO.ts[annealStep(t)].toFixed(3)}
          </span>
          <div style={{ display: 'flex', gap: S, justifyContent: 'flex-end', marginTop: 12 }}>
            {Array.from({ length: 20 }, (_, i) => (
              <span
                key={i}
                style={{
                  width: 5 * S,
                  height: 6 * S,
                  background: i < Math.round(heat * 20) ? (i > 12 ? P.red : i > 5 ? P.orange : P.yellow) : P.dark,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
