import { gauss, rng } from '../lib/math';

// 一维地形：[中心, 高度, 宽度]。MAIN 是全局最高的那座山。
export const PEAKS: [number, number, number][] = [
  [0.08, 0.2, 0.035],
  [0.22, 0.34, 0.045],
  [0.37, 0.26, 0.04],
  [0.52, 0.42, 0.045],
  [0.74, 0.95, 0.055],
  [0.91, 0.3, 0.035],
];
export const MAIN = 4;

export const f = (x: number) => {
  let y = 0.03;
  for (const [c, h, w] of PEAKS) y += h * Math.exp(-((x - c) * (x - c)) / (2 * w * w));
  return y;
};

export const peakOf = (x: number) => {
  let best = 0;
  for (let i = 1; i < PEAKS.length; i++) {
    if (Math.abs(x - PEAKS[i][0]) < Math.abs(x - PEAKS[best][0])) best = i;
  }
  return best;
};

// 爬山：只往更高的一侧走，两侧都不更高就停
export const climbPath = (x0: number, steps: number, step = 0.0012) => {
  const xs = new Float32Array(steps + 1);
  let x = x0;
  xs[0] = x;
  for (let i = 1; i <= steps; i++) {
    const here = f(x);
    const l = f(x - step);
    const r = f(x + step);
    if (l > here || r > here) x += r > l ? step : -step;
    xs[i] = x;
  }
  return xs;
};

export const ANNEAL = { steps: 400, T0: 0.5, T1: 0.004, sigma: 0.07 };

// 模拟退火（求最大值）：变差 Δ 时以 e^(−Δ/T) 的概率接受，T 按几何级数降温
export const annealPath = (x0: number, seed: number, cfg = ANNEAL) => {
  const r = rng(seed);
  const xs = new Float32Array(cfg.steps + 1);
  const ts = new Float32Array(cfg.steps + 1);
  let x = x0;
  xs[0] = x;
  ts[0] = cfg.T0;
  for (let i = 1; i <= cfg.steps; i++) {
    const T = cfg.T0 * Math.pow(cfg.T1 / cfg.T0, i / cfg.steps);
    let nx = x + gauss(r) * cfg.sigma;
    if (nx < 0.02) nx = 0.04 - nx;
    if (nx > 0.98) nx = 1.96 - nx;
    const d = f(nx) - f(x);
    if (d > 0 || r() < Math.exp(d / T)) x = nx;
    xs[i] = x;
    ts[i] = T;
  }
  return { xs, ts };
};

export const N = 100;
export const CLIMB_STEPS = 140;

const startRng = rng(7);
export const STARTS = Array.from({ length: N }, () => 0.03 + startRng() * 0.94);
export const CLIMB = STARTS.map((x) => climbPath(x, CLIMB_STEPS));
export const CLIMB_END = CLIMB.map((xs) => xs[CLIMB_STEPS]);
export const CLIMB_COUNTS = PEAKS.map((_, k) => CLIMB_END.filter((x) => peakOf(x) === k).length);
export const CLIMB_MAIN = CLIMB_COUNTS[MAIN];

export const ANNEAL_END = STARTS.map((x, i) => annealPath(x, 1000 + i).xs[ANNEAL.steps]);
export const ANNEAL_MAIN = ANNEAL_END.filter((x) => peakOf(x) === MAIN).length;

// 主角：从最靠近大山的那座小山顶出发。种子由 scripts/tune.ts 挑选。
export const HERO_START = PEAKS[3][0];
export const HERO_SEED = 6;
export const HERO = annealPath(HERO_START, HERO_SEED);
