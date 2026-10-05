import { BAR } from '../lib/theme';
import { arriveAt, landFrame } from './level';
import { AT, SYMPTOMS } from './script';
import { N, SETTLE } from './sim';

// 音效时间表：at 是全片的帧号。关卡段内的时间点和 level.tsx 顶部的注释对应。
type Cue = { at: number; name: string; vol?: number };
const L = AT.level * BAR;
const cues: Cue[] = [];

// 开头：每上一级台阶，音高升一点
for (let k = 0; k < 11; k++) cues.push({ at: Math.round(landFrame(k)), name: `plus${k}` });
cues.push({ at: 104, name: 'bad' }, { at: 128, name: 'bad' });

// 症状：每屏推入一声，小虫出现一声
let from = AT.symptoms * BAR;
for (const s of SYMPTOMS) {
  cues.push({ at: from, name: 'whoosh' }, { at: from + Math.round(s.dur / 2), name: 'tick' });
  from += s.dur;
}
cues.push({ at: AT.title * BAR + 24, name: 'thud' });

// 关卡
cues.push(
  { at: L + 112, name: 'plus0' },
  { at: L + 138, name: 'plus2' },
  { at: L + 162, name: 'plus4' },
  { at: L + 192, name: 'bad' },
  { at: L + 222, name: 'bad' },
  { at: L + 270, name: 'reveal' },
  { at: L + 450, name: 'thud', vol: 0.6 },
  { at: L + 740, name: 'hurt' },
  { at: L + 756, name: 'hurt' },
  { at: L + 772, name: 'hurt' },
  { at: L + 900, name: 'whoosh' },
  { at: L + 975, name: 'bad' },
  { at: L + 1085, name: 'flip' },
  { at: L + 1170, name: 'reveal', vol: 0.7 },
  { at: L + 1440, name: 'fanfare' },
  { at: L + 1538, name: 'fanfare' },
  { at: L + 1890, name: 'thud', vol: 0.6 },
);
// 重跑：每三个人登顶响一声烟花，避免糊成一片
for (let i = 0; i < N; i += 3) {
  if (SETTLE[i] >= 0) cues.push({ at: L + Math.round(arriveAt(i)) + 8, name: 'pop', vol: 0.7 });
}

cues.push({ at: AT.action * BAR + 62, name: 'save' }, { at: AT.end * BAR + 22, name: 'tick' });

export const SFX = cues;
