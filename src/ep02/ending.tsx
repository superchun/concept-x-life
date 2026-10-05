import React, { useCallback } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { PixelCanvas, type Draw } from '../lib/PixelCanvas';
import { Txt, Typed } from '../lib/Text';
import { ease, p } from '../lib/math';
import { FONT, P } from '../lib/theme';
import { BUILDING, CLOSE, HERO_WIN, applyCam, camFrom, drawBuilding, plainRoom, toScreen, type Cam, type Plain } from './room';
import { ENTRY, QUESTION } from './script';
import { Flash } from './symptoms';
import { drawMotes, drawSky } from './world';

const NIGHT = 0.1;

// ---- 行动：回到开场的那张床。气泡又来了，这次他抬起手，又放下 ----
// 时间点（段内帧）：30 六个症状闪回  70 气泡冒出来  88 抬手  104 放下  114 「安心 −1」
// 112 起气泡自己往上飘、变淡  118–176 镜头拉远，每扇窗里都有一个气泡
export const FLASH: [number, number] = [30, 6]; // [起始帧, 每屏帧数]
export const BUBBLE_AT = 70;
export const LET_GO = 114;
const KEYS: [number, number, Cam][] = [[118, 176, BUILDING]];
const state = (f: number): Plain => ({
  bubbles: f >= BUBBLE_AT ? [[0, -Math.max(0, f - 112) * 0.14]] : [],
  arm: ease(p(f, 88, 98)) * (1 - ease(p(f, 104, 114))),
  armDx: -3,
  eyes: f >= 150 ? 'shut' : 'open',
  dots: false,
  alpha: 1 - p(f, 140, 166),
});
const drawOutro: Draw = (ctx, f) => {
  const cam = camFrom(KEYS, CLOSE, f);
  drawSky(ctx, f, NIGHT, 0, cam.z < 0.5);
  ctx.save();
  applyCam(ctx, cam);
  drawBuilding(ctx, cam, f, () => ({ lit: false, bubble: true }), { [HERO_WIN]: (c) => plainRoom(c, f, state(f), NIGHT) });
  ctx.restore();
  drawMotes(ctx, f, NIGHT);
};

export const Action: React.FC = () => {
  const f = useCurrentFrame();
  const drawCb = useCallback(drawOutro, []);
  const cam = camFrom(KEYS, CLOSE, f);
  const [hx, hy] = toScreen(cam, 90, 160);
  const flash = Math.floor((f - FLASH[0]) / FLASH[1]);
  return (
    <AbsoluteFill>
      <PixelCanvas draw={drawCb} bloom />
      {f >= LET_GO && f < LET_GO + 40 && cam.z > 1.5 && (
        <Txt x={hx + 40} y={hy - 30 - (f - LET_GO) * 0.7} size={48} color={P.orange} opacity={1 - p(f, LET_GO + 28, LET_GO + 40)}>
          安心 −1
        </Txt>
      )}
      {f >= FLASH[0] && flash < 6 && <Flash i={flash} />}
    </AbsoluteFill>
  );
};

// ---- 最后一帧：整栋楼，每扇窗里都有一个气泡。留一个问题 ----
export const End: React.FC = () => {
  const t = useCurrentFrame();
  const drawCb: Draw = useCallback((ctx, fr) => drawOutro(ctx, 180 + fr), []);
  return (
    <AbsoluteFill>
      <PixelCanvas draw={drawCb} bloom />
      <AbsoluteFill style={{ background: 'rgba(26,28,44,0.45)', opacity: p(t, 0, 8) }} />
      <AbsoluteFill style={{ top: 440, alignItems: 'center', fontFamily: FONT, fontSize: 120, color: P.white, textShadow: `0 8px 0 ${P.ink}` }}>
        <div style={{ minHeight: 120, lineHeight: '120px' }}>
          <Typed text={QUESTION} start={8} perChar={2.2} />
        </div>
      </AbsoluteFill>
      {t >= 40 && (
        <Txt x={240} y={238} size={36} align="center" color={P.white} opacity={0.8}>
          {`人生 bug 图鉴 · ${ENTRY.id.slice(-3)} ${ENTRY.name}`}
        </Txt>
      )}
    </AbsoluteFill>
  );
};
