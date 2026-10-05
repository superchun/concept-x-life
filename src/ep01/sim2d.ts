import { gauss, rng } from '../lib/math';

// 二维地形：[cx, cy, 高度, 宽度]，第 0 个是最高峰
export const BUMPS: [number, number, number, number][] = [
  [0.66, 0.44, 1, 0.14],
  [0.24, 0.3, 0.45, 0.09],
  [0.34, 0.76, 0.5, 0.09],
  [0.84, 0.82, 0.38, 0.08],
  [0.12, 0.62, 0.32, 0.07],
  [0.47, 0.12, 0.3, 0.07],
  [0.91, 0.18, 0.28, 0.06],
];

export const f2 = (x: number, y: number) => {
  let v = 0;
  for (const [cx, cy, h, w] of BUMPS) {
    v += h * Math.exp(-((x - cx) * (x - cx) + (y - cy) * (y - cy)) / (2 * w * w));
  }
  return v;
};

const grad = (x: number, y: number): [number, number] => {
  const e = 0.002;
  return [(f2(x + e, y) - f2(x - e, y)) / (2 * e), (f2(x, y + e) - f2(x, y - e)) / (2 * e)];
};

const reflect = (v: number) => (v < 0.02 ? 0.04 - v : v > 0.98 ? 1.96 - v : v);

export const FIELD = {
  n: 420,
  steps: 470,
  // 噪声幅度从 hot 几何衰减到 cold，相当于降温
  hot: 0.01,
  cold: 0.0025,
  drift: 0.0006,
  friction: 0.9,
};

// pos[step] 是长度 2n 的数组。先让粒子各自爬到最近的小山顶，再加热、降温。
const simulate = () => {
  const r = rng(42);
  const { n, steps } = FIELD;
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const vx = new Float32Array(n);
  const vy = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let px = 0.04 + r() * 0.92;
    let py = 0.04 + r() * 0.92;
    for (let k = 0; k < 400; k++) {
      const [gx, gy] = grad(px, py);
      px = reflect(px + gx * 0.0006);
      py = reflect(py + gy * 0.0006);
    }
    x[i] = reflect(px + gauss(r) * 0.01);
    y[i] = reflect(py + gauss(r) * 0.01);
  }
  const pos: Float32Array[] = [];
  const temp = new Float32Array(steps + 1);
  for (let s = 0; s <= steps; s++) {
    const u = s / steps;
    // 前 8% 升温，之后降温
    const heat = Math.min(1, u / 0.08);
    // 前 85% 慢慢降到 cold（粒子还能翻山），最后 15% 再快速冻结
    const slow = FIELD.hot * Math.pow(FIELD.cold / FIELD.hot, Math.min(1, u / 0.85));
    const sigma = slow * Math.pow(0.1, Math.max(0, (u - 0.85) / 0.15)) * heat;
    temp[s] = sigma / FIELD.hot;
    const frame = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      frame[i * 2] = x[i];
      frame[i * 2 + 1] = y[i];
      const [gx, gy] = grad(x[i], y[i]);
      vx[i] = FIELD.friction * vx[i] + FIELD.drift * gx + sigma * gauss(r);
      vy[i] = FIELD.friction * vy[i] + FIELD.drift * gy + sigma * gauss(r);
      x[i] = reflect(x[i] + vx[i]);
      y[i] = reflect(y[i] + vy[i]);
    }
    pos.push(frame);
  }
  return { pos, temp };
};

export const FIELD_SIM = simulate();

const last = FIELD_SIM.pos[FIELD.steps];
let onMain = 0;
for (let i = 0; i < FIELD.n; i++) {
  const dx = last[i * 2] - BUMPS[0][0];
  const dy = last[i * 2 + 1] - BUMPS[0][1];
  if (Math.hypot(dx, dy) < 0.12) onMain++;
}
export const FIELD_MAIN_SHARE = onMain / FIELD.n;
