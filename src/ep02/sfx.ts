import { BAR } from '../lib/theme';
import { BUBBLE_AT, FLASH, LET_GO } from './ending';
import { LAST_OFF, OFF_A, OFF_B, OFF_C, RINGS, ROOM_VISITS } from './room';
import { AT, SYMPTOMS } from './script';

// 音效时间表：at 是全片的帧号。卧室段内的时间点和 room.tsx 里的注释对应。
type Cue = { at: number; name: string; vol?: number };
const cues: Cue[] = [];

// 开场：气泡冒出来，拍掉，再冒出来
cues.push(
  { at: 10, name: 'pop' },
  { at: 40, name: 'whoosh' },
  { at: 50, name: 'pop' },
  { at: 80, name: 'whoosh' },
  { at: 90, name: 'pop' },
  { at: 150, name: 'bad' },
);

// 症状：每屏推入一声，小虫出现一声
let from = AT.symptoms * BAR;
for (const s of SYMPTOMS) {
  cues.push({ at: from, name: 'whoosh' }, { at: from + Math.round(s.dur / 2), name: 'tick' });
  from += s.dur;
}
cues.push({ at: AT.title * BAR + 24, name: 'thud' }, { at: AT.title * BAR + 90, name: 'reveal', vol: 0.6 });

// 实验：每按一次铃响一声
for (const r of RINGS) cues.push({ at: AT.lab * BAR + r, name: 'bell' });

// 卧室
const R = AT.room * BAR;
let last = -99;
for (const t of ROOM_VISITS) {
  // 来得太密时隔一次响一声，避免糊成一片
  if (t - last < 14) continue;
  cues.push({ at: R + t, name: 'bell', vol: 0.7 });
  last = t;
}
for (let t = 722; t < 810; t += 12) cues.push({ at: R + t, name: 'bell', vol: 0.7 });
cues.push(
  { at: R + 10, name: 'bell', vol: 0.7 },
  { at: R + 66, name: 'thud' },
  { at: R + 72, name: 'tick' },
  { at: R + 96, name: 'pop' },
  { at: R + 205, name: 'reveal', vol: 0.7 },
  { at: R + 270, name: 'thud', vol: 0.6 },
  { at: R + 458, name: 'hurt' },
  { at: R + 488, name: 'hurt' },
  { at: R + 518, name: 'hurt' },
  { at: R + 720, name: 'whoosh' },
  { at: R + 815, name: 'reveal' },
  { at: R + 1000, name: 'flip' },
  { at: R + 1050, name: 'reveal', vol: 0.7 },
  { at: R + 1090, name: 'pop' },
  { at: R + 1222, name: 'hurt' },
  { at: R + 1370, name: 'save' },
  { at: R + OFF_A, name: 'tick' },
  { at: R + OFF_B, name: 'tick' },
  { at: R + OFF_C, name: 'tick' },
  { at: R + 1620, name: 'reveal', vol: 0.7 },
  { at: R + LAST_OFF, name: 'save' },
  { at: R + 1800, name: 'thud', vol: 0.6 },
);
// 整栋楼熄灯：每十扇窗响一声
for (let t = 1650; t < LAST_OFF; t += 13) cues.push({ at: R + t, name: 'tick', vol: 0.6 });

// 结尾：六个症状闪回，气泡再来，放下手
for (let i = 0; i < 6; i++) cues.push({ at: AT.action * BAR + FLASH[0] + i * FLASH[1], name: 'tick' });
cues.push(
  { at: AT.action * BAR + BUBBLE_AT, name: 'pop' },
  { at: AT.action * BAR + LET_GO, name: 'hurt' },
  { at: AT.action * BAR + 118, name: 'reveal', vol: 0.7 },
  { at: AT.end * BAR + 8, name: 'thud', vol: 0.6 },
);

export const SFX = cues;
