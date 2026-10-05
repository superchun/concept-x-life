import React, { useCallback } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { PixelCanvas, type Draw } from '../lib/PixelCanvas';
import { Txt } from '../lib/Text';
import { clamp01, ease, easeOut, lerp, mixHex, p, rng } from '../lib/math';
import { FONT, P, S } from '../lib/theme';
import {
  bear,
  bed,
  bell,
  bubble,
  door,
  drawMotes,
  drawSky,
  guard,
  hero,
  lock,
  portrait,
  sheep,
  shepherd,
  thought,
  zed,
  type IconKind,
} from './world';

// ---- 坐标 ----
// 一间卧室占 480×270，主角的卧室左上角是原点。整栋楼是 10×10 扇窗，窗与窗之间隔着墙。
// 镜头 z=1 时一间卧室正好铺满画面，z=0.05 时看到整栋楼。
// 卧室里的东西按 2 倍像素画：下面带 U 的坐标是「格」，1 格 = 2 像素。
export type Cam = { x: number; y: number; z: number };
const PITCH_X = 600;
const PITCH_Y = 360;
const COLS = 10;
const ROWS = 10;
const HC = 3;
const HR = 5;
export const HERO_WIN = HR * COLS + HC;
export const ROOM: Cam = { x: 240, y: 135, z: 1 };
// 整栋楼略偏左，给右边的月亮和太阳留位置
export const BUILDING: Cam = { x: (4.5 - HC) * PITCH_X + 740, y: (4.5 - HR) * PITCH_Y + 135, z: 0.05 };
const side = (k: number): Cam => ({ x: 240 + k * PITCH_X, y: 135, z: 1 });

// 缩放按倍数匀速变化，中心跟着缩放走，推近的那个点在画面里不乱跑
export const zoomCam = (a: Cam, b: Cam, t: number): Cam => {
  if (a.z === b.z) return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: a.z };
  const z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), t));
  const w = (1 / z - 1 / b.z) / (1 / a.z - 1 / b.z);
  return { x: lerp(b.x, a.x, w), y: lerp(b.y, a.y, w), z };
};
export const applyCam = (ctx: CanvasRenderingContext2D, c: Cam) => {
  ctx.translate(240, 135);
  ctx.scale(c.z, c.z);
  ctx.translate(-Math.round(c.x), -Math.round(c.y));
};
export const toScreen = (c: Cam, x: number, y: number): [number, number] => [
  (x - Math.round(c.x)) * c.z + 240,
  (y - Math.round(c.y)) * c.z + 135,
];
export const camFrom = (keys: [number, number, Cam][], start: Cam, u: number): Cam => {
  let cur = start;
  for (const [a, b, target] of keys) {
    if (u >= b) cur = target;
    else if (u >= a) return zoomCam(cur, target, ease(p(u, a, b)));
    else break;
  }
  return cur;
};

const FLOOR = 104; // 地面（格）
const BEDX = 58;
const DOORX = 204;
const HEAD: [number, number] = [BEDX - 13, FLOOR - 24]; // 主角头顶，气泡尖的位置（格）

// 卧室的墙、窗、地板。warm 是窗外的天色。
const roomBase = (ctx: CanvasRenderingContext2D, warm: number) => {
  ctx.fillStyle = '#20233a';
  ctx.fillRect(0, 0, 480, 270);
  ctx.fillStyle = P.slate;
  ctx.fillRect(244, 50, 84, 64);
  ctx.fillStyle = mixHex('#11121d', '#ef7d57', warm);
  ctx.fillRect(248, 54, 76, 56);
  ctx.fillStyle = mixHex(P.white, P.yellow, warm);
  ctx.fillRect(302, 62, 10, 10);
  ctx.fillStyle = P.slate;
  ctx.fillRect(284, 54, 4, 56);
  ctx.fillRect(248, 80, 76, 4);
  // 墙上的画、书架、钟
  ctx.fillStyle = P.slate;
  ctx.fillRect(34, 56, 40, 30);
  ctx.fillStyle = P.teal;
  ctx.fillRect(38, 60, 32, 22);
  ctx.fillStyle = P.plum;
  ctx.fillRect(38, 72, 32, 10);
  ctx.fillStyle = P.slate;
  ctx.fillRect(96, 74, 96, 4);
  [P.red, P.teal, P.grey, P.plum, P.navy, P.teal].forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(102 + i * 10, 74 - 14 - (i % 3) * 3, 8, 14 + (i % 3) * 3);
  });
  ctx.fillStyle = P.grey;
  ctx.fillRect(346, 66, 20, 20);
  ctx.fillStyle = P.ink;
  ctx.fillRect(348, 68, 16, 16);
  ctx.fillStyle = P.grey;
  ctx.fillRect(355, 71, 2, 6);
  ctx.fillRect(355, 75, 6, 2);
  ctx.fillStyle = P.dark;
  ctx.fillRect(0, 208, 480, 62);
  ctx.fillStyle = P.slate;
  ctx.fillRect(0, 208, 480, 2);
  // 床头柜和台灯
  ctx.fillStyle = P.slate;
  ctx.fillRect(166, 188, 22, 20);
  ctx.fillStyle = P.dark;
  ctx.fillRect(168, 196, 18, 2);
  ctx.fillStyle = P.grey;
  ctx.fillRect(176, 176, 2, 12);
  ctx.fillStyle = mixHex(P.slate, P.orange, 0.5);
  ctx.fillRect(170, 168, 14, 8);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 238, 480, 32);
};
const lightsOff = (ctx: CanvasRenderingContext2D, amount = 0.6) => {
  ctx.fillStyle = `rgba(17,18,29,${amount})`;
  ctx.fillRect(0, 0, 480, 270);
};

// ---- 整栋楼 ----
export type WinState = { lit: boolean; bubble?: boolean };
type RoomDraw = (ctx: CanvasRenderingContext2D) => void;
const BUBBLE_COLORS = [P.sky, P.orange, P.lime, P.yellow, P.red, P.cyan, P.white];
// rooms：需要画出细节的窗（窗号 → 画法），只在镜头够近时调用；其余的窗画成一个色块
export const drawBuilding = (
  ctx: CanvasRenderingContext2D,
  cam: Cam,
  fr: number,
  state: (i: number) => WinState,
  rooms: Record<number, RoomDraw>,
) => {
  const left = -HC * PITCH_X - 100;
  const top = -HR * PITCH_Y - 100;
  const right = (COLS - 1 - HC) * PITCH_X + 580;
  const bottom = (ROWS - 1 - HR) * PITCH_Y + 370;
  ctx.fillStyle = '#11121d';
  ctx.fillRect(left - 9000, bottom, 20000, 4000);
  ctx.fillStyle = P.dark;
  ctx.fillRect(left, top, right - left, bottom - top);
  ctx.fillStyle = P.slate;
  ctx.fillRect(left - 40, top - 60, right - left + 80, 60);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c;
      const ox = (c - HC) * PITCH_X;
      const oy = (r - HR) * PITCH_Y;
      const [sx, sy] = toScreen(cam, ox, oy);
      if (sx > 480 || sy > 270 || sx + 480 * cam.z < 0 || sy + 270 * cam.z < 0) continue;
      if (rooms[i] && cam.z > 0.3) {
        ctx.save();
        ctx.translate(ox, oy);
        rooms[i](ctx);
        ctx.restore();
        continue;
      }
      const st = state(i);
      ctx.fillStyle = st.lit ? P.yellow : '#232a52';
      ctx.fillRect(ox, oy, 480, 270);
      if (st.lit) {
        // 灯下有人守着门，白熊一闪一闪地来
        ctx.fillStyle = P.orange;
        ctx.fillRect(ox, oy + 210, 480, 60);
        ctx.fillStyle = P.slate;
        ctx.fillRect(ox + 320, oy + 110, 40, 100);
        if (Math.sin(fr * 0.25 + i * 2.3) > 0.2) {
          ctx.fillStyle = P.white;
          ctx.fillRect(ox + 380, oy + 150, 80, 60);
        }
      }
      if (st.bubble) {
        const bob = Math.sin(fr * 0.1 + i) > 0 ? 0 : 20;
        ctx.fillStyle = P.white;
        ctx.fillRect(ox + 140, oy + 40 + bob, 200, 140);
        ctx.fillRect(ox + 180, oy + 180 + bob, 40, 20);
        ctx.fillStyle = BUBBLE_COLORS[(i * 7) % BUBBLE_COLORS.length];
        ctx.fillRect(ox + 200, oy + 80 + bob, 80, 60);
      }
    }
  }
};

// ---- 开场和结尾共用的近景：只有床、主角和头顶的气泡 ----
export type Plain = { bubbles: [number, number][]; arm: number; armDx: number; eyes: 'open' | 'shut'; dots: boolean; alpha?: number };
export const plainRoom = (ctx: CanvasRenderingContext2D, fr: number, st: Plain, warm = 0) => {
  roomBase(ctx, warm);
  ctx.save();
  ctx.scale(2, 2);
  door(ctx, DOORX, FLOOR, 0);
  bed(ctx, BEDX, FLOOR, st.eyes, st.eyes === 'shut' ? Math.floor(fr / 24) % 2 : 0);
  if (st.arm > 0) {
    const h = Math.round(8 * st.arm);
    const x = BEDX - 4 + Math.round(st.armDx);
    ctx.fillStyle = P.yellow;
    ctx.fillRect(x, FLOOR - 16 - h, 2, h);
    ctx.fillStyle = P.white;
    ctx.fillRect(x - 1, FLOOR - 18 - h, 4, 3);
    if (st.dots) bubble(ctx, x + 12, FLOOR - 14 - h, fr);
  }
  ctx.globalAlpha = st.alpha ?? 1;
  for (const [dx, dy] of st.bubbles) thought(ctx, HEAD[0] + dx, HEAD[1] + dy);
  ctx.globalAlpha = 1;
  ctx.restore();
};
export const CLOSE: Cam = { x: 120, y: 165, z: 2 };

// ---- 开场：气泡拍掉一个，冒出两个；再拍，四个 ----
const hookState = (t: number): Plain => {
  const bubbles: [number, number][] =
    t < 10
      ? []
      : t < 42
        ? [[0, 0]]
        : t < 50
          ? []
          : t < 82
            ? [[-9, 0], [9, -5]]
            : t < 90
              ? []
              : [[-18, 2], [-3, -9], [13, 0], [28, -11]];
  const swing = (a: number) => (t >= a && t < a + 16 ? Math.sin(p(t, a, a + 16) * Math.PI) : 0);
  const hold = ease(p(t, 120, 130));
  return {
    bubbles,
    arm: Math.max(swing(34), swing(74), hold),
    armDx: -4 * swing(34) - 4 * swing(74) - 2 * hold,
    eyes: 'open',
    dots: t >= 150,
  };
};
const drawHook: Draw = (ctx, t) => {
  drawSky(ctx, t, 0, 0, false);
  ctx.save();
  applyCam(ctx, CLOSE);
  plainRoom(ctx, t, hookState(t));
  ctx.restore();
  drawMotes(ctx, t, 0);
};
export const Hook: React.FC = () => {
  const drawCb = useCallback(drawHook, []);
  return (
    <AbsoluteFill>
      <PixelCanvas draw={drawCb} bloom />
    </AbsoluteFill>
  );
};

// ---- 实验：五分钟，不要想白熊，想到一次按一下铃 ----
export const RINGS = [98, 109, 120, 131, 142, 153, 164];
const drawLab: Draw = (ctx, t) => {
  ctx.fillStyle = P.ink;
  ctx.fillRect(0, 0, 480, 270);
  ctx.fillStyle = P.dark;
  ctx.fillRect(20, 26, 252, 196);
  ctx.fillStyle = '#20233a';
  ctx.fillRect(22, 28, 248, 192);
  const ring = RINGS.some((r) => t >= r && t < r + 5);
  const thinking = RINGS.some((r) => t >= r - 5 && t < r + 4);
  ctx.save();
  ctx.translate(22, 28);
  ctx.scale(2, 2);
  ctx.fillStyle = P.slate;
  ctx.fillRect(0, 84, 124, 1);
  // 桌子和桌上的铃
  ctx.fillStyle = P.grey;
  ctx.fillRect(58, 66, 46, 3);
  ctx.fillRect(61, 69, 2, 15);
  ctx.fillRect(99, 69, 2, 15);
  bell(ctx, 80, 54, ring);
  hero(ctx, 40, 84, 2, P.cyan, 0, t);
  // 按铃的手
  ctx.fillStyle = P.cyan;
  ctx.fillRect(46, ring ? 64 : 70, ring ? 30 : 6, 2);
  if (thinking) thought(ctx, 40, 60);
  ctx.restore();
};
export const Lab: React.FC = () => {
  const t = useCurrentFrame();
  const drawCb = useCallback(drawLab, []);
  const n = RINGS.filter((r) => t >= r).length;
  const sec = Math.round(p(t, 94, 172) * 300);
  const pop = RINGS.some((r) => t >= r && t < r + 4) ? 1.2 : 1;
  return (
    <AbsoluteFill>
      <PixelCanvas draw={drawCb} bloom />
      <div
        style={{
          position: 'absolute',
          left: 96 * S,
          top: 40 * S,
          background: P.orange,
          border: `${S}px solid ${P.ink}`,
          padding: '8px 24px',
          fontFamily: FONT,
          fontSize: 48,
          lineHeight: '56px',
          color: P.ink,
        }}
      >
        不许想白熊
      </div>
      <Txt x={284} y={70} size={48} color={P.grey}>计时</Txt>
      <Txt x={284} y={88} size={144} color={P.white}>{`${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`}</Txt>
      <Txt x={284} y={140} size={48} color={P.grey}>铃响</Txt>
      <Txt x={284} y={158} size={144} color={P.yellow} scale={pop}>{`${n} 次`}</Txt>
    </AbsoluteFill>
  );
};

// ---- 卧室：第 12–33 小节，u 是这一段开始后的帧数（每小节 90 帧）----
//    0 一样东西从门口进来，被关在门外   72 钉上牌子        96 第一个帮手赶羊
//  186 第二个帮手守门                 205 推近看画像      270 金句一（字幕层盖住）
//  455 删掉 485 盖住 515 骂自己        540 锁越加越多      630 赶羊的累倒
//  720 门被挤开，熊涌进来             815 拉远到整栋楼    905 回到卧室
//  950 牌子移到中央                  1000 翻面           1050 牌子回到门上，天色转暖
// 1090 撤掉帮手，别的熊散去          1170 熊走到床边坐下  1275 打哈欠  1310 趴下
// 1370 主角闭眼                     1440 镜头经过另外三扇窗，各灭一盏灯
// 1620 拉远到整栋楼，灯一扇扇灭，天亮  1800 金句二（字幕层盖住）
const VISITS = (() => {
  const out: number[] = [];
  let t = 110;
  let gap = 58;
  while (t < 716) {
    out.push(Math.round(t));
    t += gap;
    gap = Math.max(11, gap * 0.86);
  }
  return out;
})();
export const ROOM_VISITS = VISITS;
const peeking = (u: number) => VISITS.some((t) => u >= t && u < t + 9);
const bellCount = (u: number) =>
  VISITS.filter((t) => u >= t).length + (u >= 720 ? Math.floor((Math.min(u, 810) - 720) / 3) : 0);
const lockCount = (u: number) =>
  u >= 720 ? 0 : (u >= 455 ? 1 : 0) + (u >= 485 ? 1 : 0) + (u >= 515 ? 1 : 0) + (u >= 540 ? Math.min(5, Math.floor((u - 540) / 18) + 1) : 0);
const FLOOD_X = [176, 144, 112, 86];
const KINDS: IconKind[] = ['note', 'talk', 'paper', 'face'];
export const OFF_A = 1492;
export const OFF_B = 1552;
export const OFF_C = 1612;
const HERO_OFF = 1400;
// 其余的窗在最后两小节里按打乱的顺序熄灯
const OFF_AT = (() => {
  const r = rng(23);
  const order = Array.from({ length: COLS * ROWS }, (_, i) => [r(), i]).sort((a, b) => a[0] - b[0]);
  const at = new Array<number>(COLS * ROWS).fill(0);
  order.forEach(([, i], k) => (at[i] = 1642 + Math.round(k * 1.25)));
  at[HERO_WIN] = HERO_OFF;
  at[HERO_WIN + 1] = OFF_A;
  at[HERO_WIN + 2] = OFF_B;
  at[HERO_WIN + 3] = OFF_C;
  return at;
})();
export const LAST_OFF = Math.max(...OFF_AT);

const warmth = (u: number) =>
  0.12 * ease(p(u, 1040, 1170)) + 0.18 * ease(p(u, 1170, 1440)) + 0.7 * ease(p(u, 1620, 1790));

const KEYS: [number, number, Cam][] = [
  [205, 235, { x: 372, y: 160, z: 2 }],
  [262, 292, ROOM],
  [815, 868, BUILDING],
  [905, 945, ROOM],
  [1440, 1462, side(1)],
  [1500, 1522, side(2)],
  [1560, 1582, side(3)],
  [1620, 1684, BUILDING],
];
const camAt = (u: number) => camFrom(KEYS, ROOM, u);

const drawHeroRoom = (ctx: CanvasRenderingContext2D, u: number) => {
  roomBase(ctx, warmth(u));
  ctx.save();
  ctx.scale(2, 2);
  const flood = u >= 720;
  const peek = peeking(u);
  // 开头从门口进来的那样东西：先是每个人自己的，最后定成白熊，被关在门外
  if (u >= 6 && u < 68) {
    const x = u < 52 ? lerp(DOORX, 150, ease(p(u, 6, 46))) : lerp(150, DOORX + 8, ease(p(u, 52, 66)));
    if (u < 38) thought(ctx, x, FLOOR - 6, KINDS[Math.min(3, Math.floor((u - 6) / 8))]);
    else bear(ctx, x, FLOOR, 'walk', Math.floor(u / 4));
  }
  const open = u < 54 ? 1 : u < 68 ? 1 - ease(p(u, 54, 68)) : flood ? 1 : peek ? 0.6 : 0;
  door(ctx, DOORX, FLOOR, open);
  if (peek) thought(ctx, DOORX + 1, FLOOR - 8);
  for (let k = 0; k < lockCount(u); k++) lock(ctx, DOORX - 5 + (k % 2) * 9, FLOOR - 26 + Math.floor(k / 2) * 7);
  if (u >= 8) bell(ctx, 228, 16, peek || (flood && u < 812 && u % 6 < 3));

  // 两个帮手
  const helpers = 1 - p(u, 1090, 1112);
  if (u >= 96 && helpers > 0) {
    ctx.globalAlpha = helpers;
    const hop = clamp01((u - 96) / 12);
    const tired = u >= 630;
    const sx = lerp(BEDX + 12, 118, easeOut(hop));
    shepherd(ctx, sx, FLOOR - Math.round(Math.sin(hop * Math.PI) * 10), 0, u % 80 < 4, tired);
    if (tired) for (let k = 0; k < 2; k++) zed(ctx, 128 + k * 5, FLOOR - 14 - k * 6 - ((u / 6) % 4));
    // 羊：在床和门之间来回走；赶羊的累倒后散开
    for (let k = 0; k < 5; k++) {
      const born = 104 + k * 8;
      if (u < born) continue;
      const drift = tired ? (u - 630) * (k % 2 ? 0.9 : -0.9) : 0;
      const x = 128 + ((k * 9 + u * 0.35) % 40) + drift;
      ctx.globalAlpha = helpers * (tired ? 1 - p(u, 650, 700) : 1);
      sheep(ctx, x, FLOOR, Math.floor(u / 5) + k, tired && k % 2 === 0);
    }
    ctx.globalAlpha = helpers;
    if (u >= 186) {
      const g = clamp01((u - 186) / 12);
      const kind: IconKind = u >= 210 && u < 262 ? [...KINDS, 'bear' as IconKind][Math.floor((u - 210) / 11) % 5] : 'bear';
      guard(ctx, lerp(BEDX + 12, 176, easeOut(g)), FLOOR - Math.round(Math.sin(g * Math.PI) * 14), 0, u % 90 < 4, kind);
    }
    ctx.globalAlpha = 1;
  }
  // 撤掉守门人之后，画像掉在地上
  if (u >= 1090 && u < 1150) {
    ctx.globalAlpha = 1 - p(u, 1130, 1150);
    portrait(ctx, 188, Math.min(FLOOR, FLOOR - 5 + Math.round(((u - 1090) * (u - 1090)) / 40)));
    ctx.globalAlpha = 1;
  }

  // 床和主角
  const asleep = u >= 1370;
  bed(ctx, BEDX, FLOOR, asleep ? 'shut' : 'open', asleep ? Math.floor(u / 24) % 2 : 0);
  if (asleep) for (let k = 0; k < 2; k++) zed(ctx, HEAD[0] + 4 + k * 5, HEAD[1] - 4 - k * 6 - ((u / 6) % 4));
  if (u >= 455 && u < 485) {
    // 删掉：一张照片被划掉
    portrait(ctx, BEDX + 4, FLOOR - 26, 'face');
    if (u >= 466) {
      ctx.fillStyle = P.red;
      for (let k = 0; k < 9; k++) {
        ctx.fillRect(BEDX - 1 + k, FLOOR - 36 + k, 2, 1);
        ctx.fillRect(BEDX + 8 - k, FLOOR - 36 + k, 2, 1);
      }
    }
  }
  if (u >= 485 && u < 720) {
    // 盖住：举着手机，屏幕的光照在脸上
    ctx.fillStyle = 'rgba(115,239,247,0.14)';
    ctx.fillRect(BEDX - 22, FLOOR - 30, 22, 18);
    ctx.fillStyle = P.cyan;
    ctx.fillRect(BEDX - 8, FLOOR - 27, 3, 5);
    ctx.fillStyle = P.grey;
    ctx.fillRect(BEDX - 7, FLOOR - 22, 1, 6);
  }
  if ((peek && u < 720) || (flood && u < 1090)) {
    thought(ctx, HEAD[0], HEAD[1]);
    if (flood) {
      thought(ctx, HEAD[0] + 17, HEAD[1] - 6);
      thought(ctx, HEAD[0] - 15, HEAD[1] - 3);
    }
  }

  // 熊：先是涌进来的一群，补丁之后只剩一只，走到床边坐下、打哈欠、趴下
  if (flood) {
    for (let k = FLOOD_X.length - 1; k >= 0; k--) {
      const a = 722 + k * 14;
      if (u < a) continue;
      const gone = k === 0 ? 0 : p(u, 1090 + k * 4, 1120 + k * 4);
      if (gone >= 1) continue;
      ctx.globalAlpha = 1 - gone;
      if (k > 0 || u < 1170) {
        const t = ease(p(u, a, a + 44));
        bear(ctx, lerp(DOORX + 6, FLOOD_X[k], t), FLOOR, 'walk', t < 1 ? Math.floor(u / 4) : 0);
      } else if (u < 1214) {
        bear(ctx, lerp(FLOOD_X[0], 108, ease(p(u, 1170, 1214))), FLOOR, 'walk', Math.floor(u / 4));
      } else if (u < 1310) {
        const yawn = u >= 1275 && u < 1302;
        bear(ctx, 106, FLOOR - (yawn ? 1 : 0), yawn ? 'yawn' : 'sit');
      } else {
        bear(ctx, 108, FLOOR, 'sleep');
        for (let j = 0; j < 2; j++) zed(ctx, 92 + j * 5, FLOOR - 16 - j * 6 - ((u / 6) % 4));
      }
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
  if (u >= HERO_OFF) lightsOff(ctx, 0.35 * p(u, HERO_OFF, HERO_OFF + 20));
};

// 另外三扇窗：没睡着的人、台上的人、看着头像的人。他们都没有赶熊。
const sideRoom = (ctx: CanvasRenderingContext2D, kind: 0 | 1 | 2, u: number, offAt: number) => {
  roomBase(ctx, warmth(u));
  ctx.save();
  ctx.scale(2, 2);
  if (kind === 0) {
    bed(ctx, BEDX, FLOOR, 'open', 0, P.cyan);
    bear(ctx, 108, FLOOR, 'sit');
  } else if (kind === 1) {
    ctx.fillStyle = P.plum;
    ctx.fillRect(116, FLOOR - 8, 96, 8);
    ctx.fillStyle = P.red;
    ctx.fillRect(116, FLOOR - 8, 96, 1);
    const j = Math.floor(u / 2) % 2 ? 1 : 0;
    hero(ctx, 160 + j, FLOOR - 8, 2, P.lime, 0, u);
    ctx.fillStyle = P.grey;
    ctx.fillRect(170 + j, FLOOR - 26, 1, 18);
    ctx.fillStyle = P.slate;
    ctx.fillRect(169 + j, FLOOR - 30, 3, 4);
    bear(ctx, 60, FLOOR, 'sit');
  } else {
    hero(ctx, 150, FLOOR, 2, P.orange, 0, u);
    ctx.fillStyle = P.cyan;
    ctx.fillRect(157, FLOOR - 14, 3, 5);
    thought(ctx, 166, FLOOR - 18, 'face');
    bear(ctx, 100, FLOOR, 'sleep');
  }
  ctx.restore();
  if (u >= offAt) lightsOff(ctx, 0.6 * p(u, offAt, offAt + 6));
};

const drawRoom: Draw = (ctx, u) => {
  const cam = camAt(u);
  const w = warmth(u);
  drawSky(ctx, u, w, 0, cam.z < 0.5);
  ctx.save();
  if (u >= 720 && u < 764 && u % 2) ctx.translate(1, 0);
  applyCam(ctx, cam);
  drawBuilding(ctx, cam, u, (i) => ({ lit: u < OFF_AT[i] }), {
    [HERO_WIN]: (c) => drawHeroRoom(c, u),
    [HERO_WIN + 1]: (c) => sideRoom(c, 0, u, OFF_A),
    [HERO_WIN + 2]: (c) => sideRoom(c, 1, u, OFF_B),
    [HERO_WIN + 3]: (c) => sideRoom(c, 2, u, OFF_C),
  });
  ctx.restore();
  if (cam.z < 0.5) drawMotes(ctx, u, w);
};

// 规则牌：钉在门上方；补丁段移到画面中央翻面，再回到门上
const BOARD: [number, number] = [DOORX * 2, 122];
const Sign: React.FC<{ u: number; cam: Cam }> = ({ u, cam }) => {
  if (u < 72 || cam.z < 0.5 || u >= 1440) return null;
  const [sx, sy] = toScreen(cam, ...BOARD);
  const center = ease(p(u, 950, 985)) * (1 - ease(p(u, 1050, 1075)));
  const flip = p(u, 1000, 1025);
  const patched = flip > 0.5;
  const scale = lerp(cam.z, 2.5, center) * (u < 80 ? 1 + 0.5 * (1 - easeOut(p(u, 72, 80))) : 1);
  return (
    <div
      style={{
        position: 'absolute',
        left: lerp(sx * S, 960, center),
        top: lerp(sy * S, 400, center),
        transform: `translate(-50%, -50%) scale(${scale}) scaleX(${Math.abs(Math.cos(flip * Math.PI))})`,
        background: patched ? P.green : P.orange,
        border: `${S}px solid ${P.ink}`,
        padding: '8px 24px',
        fontFamily: FONT,
        fontSize: 48,
        lineHeight: '56px',
        color: patched ? P.white : P.ink,
        whiteSpace: 'nowrap',
      }}
    >
      {patched ? '请它进来' : '不许想白熊'}
    </div>
  );
};

const COSTS: [number, string][] = [
  [458, '照片 −1'],
  [488, '时间 −1'],
  [518, '睡意 −1'],
  [1222, '安心 −1'],
];

export const Room: React.FC = () => {
  const u = useCurrentFrame();
  const drawCb = useCallback(drawRoom, []);
  const cam = camAt(u);
  const inRoom = cam.z > 0.9 && Math.abs(cam.x - 240) < 260;
  const [hx, hy] = toScreen(cam, HEAD[0] * 2, HEAD[1] * 2);
  const [bx, by] = toScreen(cam, 440, 36);
  const n = bellCount(u);
  const ringing = peeking(u) || (u >= 720 && u < 812);
  return (
    <AbsoluteFill>
      <PixelCanvas draw={drawCb} bloom />
      {inRoom &&
        COSTS.map(([a, s]) =>
          u < a || u >= a + 40 ? null : (
            <Txt key={s} x={hx + 30} y={hy - 34 - (u - a) * 0.7} size={48 * (cam.z > 2 ? 2 : 1)} color={P.orange} opacity={1 - p(u, a + 28, a + 40)}>
              {s}
            </Txt>
          ),
        )}
      {inRoom && u >= 515 && u < 552 && (
        <Txt x={hx - 10} y={hy - 18} size={36} align="center" color={P.grey} opacity={1 - p(u, 544, 552)}>
          怎么又想
        </Txt>
      )}
      {inRoom && n > 0 && u < 1440 && (
        <Txt x={bx} y={by + 2} size={48 * (cam.z > 2 ? 2 : 1)} align="right" color={u >= 1090 ? P.grey : P.yellow} scale={ringing && u % 6 < 3 ? 1.15 : 1}>
          {`× ${n}`}
        </Txt>
      )}
      <Sign u={u} cam={cam} />
    </AbsoluteFill>
  );
};
