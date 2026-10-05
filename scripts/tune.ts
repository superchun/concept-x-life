// 打印成片里引用的仿真数字，并挑一个画面效果合适的主角种子。
// 运行：npx tsx scripts/tune.ts
import {
  ANNEAL,
  ANNEAL_MAIN,
  CLIMB_COUNTS,
  CLIMB_MAIN,
  HERO_START,
  MAIN,
  annealPath,
  peakOf,
} from '../src/ep01/sim';
import { FIELD, FIELD_MAIN_SHARE } from '../src/ep01/sim2d';

console.log('爬山 各山顶数量', CLIMB_COUNTS, '到达最高峰', CLIMB_MAIN);
console.log('退火 到达最高峰', ANNEAL_MAIN);

const good: number[] = [];
for (let seed = 1; seed < 400 && good.length < 8; seed++) {
  const { xs } = annealPath(HERO_START, seed);
  const visited = new Set<number>();
  for (let i = 0; i < 200; i++) visited.add(peakOf(xs[i]));
  let settled = true;
  for (let i = 290; i <= ANNEAL.steps; i++) if (peakOf(xs[i]) !== MAIN) settled = false;
  let early = false;
  for (let i = 0; i < 120; i++) if (peakOf(xs[i]) === MAIN && i > 100) early = true;
  if (visited.size >= 4 && settled && !early) good.push(seed);
}
console.log('可用主角种子', good);
console.log('二维场 粒子数', FIELD.n, '最终落在最高峰的比例', FIELD_MAIN_SHARE.toFixed(3));
