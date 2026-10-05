// 用代码合成 8-bit 风格音效，写到 public/sfx。运行：npx tsx scripts/sfx.ts
import { mkdirSync, writeFileSync } from 'node:fs';

const SR = 44100;
type Osc = (phase: number) => number;
const square: Osc = (ph) => (ph % 1 < 0.5 ? 1 : -1);
const tri: Osc = (ph) => 4 * Math.abs((ph % 1) - 0.5) - 1;
const sine: Osc = (ph) => Math.sin(ph * 2 * Math.PI);

// 一个音：频率从 f0 滑到 f1，音量按指数衰减
const tone = (osc: Osc, f0: number, f1: number, dur: number, vol: number, decay = 4) => {
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    ph += (f0 + (f1 - f0) * t) / SR;
    const attack = Math.min(1, i / (0.004 * SR));
    out[i] = osc(ph) * vol * attack * Math.exp(-decay * t) * Math.min(1, (n - i) / (0.004 * SR));
  }
  return out;
};
let seed = 1;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
// 噪声：hold 越大越闷（采样保持）
const noise = (dur: number, vol: number, hold0: number, hold1: number, decay = 4) => {
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  let v = 0;
  let left = 0;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    if (left-- <= 0) {
      v = rnd();
      left = Math.round(hold0 + (hold1 - hold0) * t);
    }
    out[i] = v * vol * Math.min(1, i / 200) * Math.exp(-decay * t);
  }
  return out;
};
// 把几段声音按起始时间（秒）叠在一起
const mixAt = (...parts: [number, Float32Array][]) => {
  const len = Math.max(...parts.map(([at, a]) => Math.floor(at * SR) + a.length));
  const out = new Float32Array(len);
  for (const [at, a] of parts) {
    const o = Math.floor(at * SR);
    for (let i = 0; i < a.length; i++) out[o + i] += a[i];
  }
  return out;
};

const write = (name: string, data: Float32Array) => {
  const buf = Buffer.alloc(44 + data.length * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + data.length * 2, 4);
  buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(data.length * 2, 40);
  for (let i = 0; i < data.length; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, data[i])) * 32767), 44 + i * 2);
  }
  writeFileSync(`public/sfx/${name}.wav`, buf);
};

mkdirSync('public/sfx', { recursive: true });
const semi = (k: number) => Math.pow(2, k / 12);
// 上台阶：一步比一步高半个音到一个音
[0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17].forEach((k, i) => {
  const f = 523 * semi(k);
  write(`plus${i}`, mixAt([0, tone(square, f, f, 0.05, 0.16, 2)], [0.05, tone(square, f * 1.5, f * 1.5, 0.12, 0.14, 5)]));
});
write('bad', tone(square, 196, 131, 0.22, 0.18, 3));
write('hurt', tone(square, 262, 147, 0.12, 0.16, 3));
write('tick', tone(square, 1568, 1568, 0.03, 0.1, 2));
write('whoosh', noise(0.2, 0.16, 6, 1, 3));
write('thud', mixAt([0, tone(sine, 110, 45, 0.35, 0.5, 5)], [0, noise(0.12, 0.2, 10, 20, 6)]));
write('reveal', mixAt([0, tone(sine, 55, 55, 1.6, 0.4, 2.5)], [0, tone(tri, 82.5, 82.5, 1.6, 0.18, 2.5)], [0.02, tone(tri, 220, 330, 0.5, 0.1, 4)]));
write('flip', mixAt([0, tone(square, 300, 900, 0.14, 0.14, 2)], [0.16, tone(square, 1175, 1175, 0.1, 0.14, 4)]));
write('pop', mixAt([0, noise(0.09, 0.14, 2, 8, 5)], [0, tone(sine, 1400, 500, 0.12, 0.12, 5)]));
write(
  'fanfare',
  mixAt(
    [0, tone(square, 523, 523, 0.09, 0.15, 1.5)],
    [0.09, tone(square, 659, 659, 0.09, 0.15, 1.5)],
    [0.18, tone(square, 784, 784, 0.09, 0.15, 1.5)],
    [0.27, tone(square, 1047, 1047, 0.45, 0.15, 4)],
    [0.27, tone(tri, 523, 523, 0.45, 0.14, 4)],
  ),
);
write('save', mixAt([0, tone(sine, 880, 880, 0.5, 0.25, 5)], [0.12, tone(sine, 1320, 1320, 0.7, 0.25, 5)]));
console.log('已写入 public/sfx');
