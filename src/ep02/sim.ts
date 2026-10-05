import { clamp01, rng } from '../lib/math';

// 一夜：一步一分钟，八小时。到 STEPS 还没睡着就算睁眼到天亮。
export const N = 100;
export const STEPS = 480;

// 示意模型，不是对实验数据的拟合。两条规则共用同一批人、同一套参数。
export const CFG = {
  base: 0.22, // 不设防时，念头每分钟出现的概率上限（再乘以念头的强度）
  prime: 0.3, // 守门人举着画像带来的额外出现概率（乘以守门的力度）
  block: 0.45, // 找别的事想能挡掉的概率（乘以守门的力度和剩余精力）
  tire: 0.004, // 守门每分钟消耗的精力
  tighten: 0.1, // 它每来一次，守门的力度加多少
  relax: 0.004, // 它没来的每一分钟，守门的力度松多少
  guard0: 0.5, // 钉上牌子时的守门力度
  bump: 0.3, // 它来一次，清醒程度升多少
  calm: 0.015, // 它没来的每一分钟，清醒程度降多少
  floor: 0.25, // 守门本身让人保持的清醒程度（乘以守门的力度）
  awake0: 0.6, // 躺下时的清醒程度
  sleepBelow: 0.15, // 清醒程度低于它就睡着
};

export type Person = {
  strength: number; // 这个念头有多强
  stamina: number; // 精力耗得多慢
  habit: number; // 不赶它时，每来一次念头减弱的比例
  seed: number;
};

export type Night = {
  visits: number[]; // 它出现的分钟
  guard: Float32Array; // 每分钟的守门力度，0 表示没有守门
  awake: Float32Array; // 每分钟的清醒程度
  asleepAt: number; // 睡着的分钟，-1 表示睁眼到天亮
};

// 旧规则「不许想」：有人找别的事想，有人守门
export const suppressNight = (who: Person, cfg = CFG): Night => {
  const r = rng(who.seed);
  const visits: number[] = [];
  const guard = new Float32Array(STEPS + 1);
  const awake = new Float32Array(STEPS + 1);
  let a = who.strength;
  let g = cfg.guard0;
  let energy = 1;
  let u = cfg.awake0;
  let asleepAt = -1;
  guard[0] = g;
  awake[0] = u;
  for (let t = 1; t <= STEPS; t++) {
    const pVisit = clamp01(cfg.base * a + cfg.prime * g - cfg.block * g * energy);
    energy = Math.max(0, energy - (cfg.tire * g) / who.stamina);
    if (r() < pVisit) {
      visits.push(t);
      g = Math.min(1, g + cfg.tighten);
      u = Math.min(1, u + cfg.bump);
    } else {
      g = Math.max(0, g - cfg.relax);
      u = Math.max(cfg.floor * g, u - cfg.calm);
    }
    guard[t] = g;
    awake[t] = u;
    if (u < cfg.sleepBelow) {
      asleepAt = t;
      break;
    }
  }
  return { visits, guard, awake, asleepAt };
};

// 新规则「请它进来」：没有守门人，它每来一次，念头弱一点
export const inviteNight = (who: Person, cfg = CFG): Night => {
  const r = rng(who.seed);
  const visits: number[] = [];
  const guard = new Float32Array(STEPS + 1);
  const awake = new Float32Array(STEPS + 1);
  let a = who.strength;
  let u = cfg.awake0;
  let asleepAt = -1;
  awake[0] = u;
  for (let t = 1; t <= STEPS; t++) {
    if (r() < clamp01(cfg.base * a)) {
      visits.push(t);
      u = Math.min(1, u + cfg.bump * a);
      a *= 1 - who.habit;
    } else {
      u = Math.max(0, u - cfg.calm);
    }
    awake[t] = u;
    if (u < cfg.sleepBelow) {
      asleepAt = t;
      break;
    }
  }
  return { visits, guard, awake, asleepAt };
};

const peopleRng = rng(11);
export const PEOPLE: Person[] = Array.from({ length: N }, (_, i) => ({
  strength: 0.35 + peopleRng() * 0.65,
  stamina: 0.6 + peopleRng() * 0.8,
  habit: peopleRng() ** 1.3 * 0.22,
  seed: 2000 + i,
}));

export const SUPPRESS = PEOPLE.map((who) => suppressNight(who));
export const INVITE = PEOPLE.map((who) => inviteNight(who));

const asleep = (nights: Night[]) => nights.filter((n) => n.asleepAt >= 0).length;
// 字幕引用的数字
export const SUPPRESS_ASLEEP = asleep(SUPPRESS);
export const SUPPRESS_AWAKE = N - SUPPRESS_ASLEEP;
export const INVITE_ASLEEP = asleep(INVITE);
export const INVITE_AWAKE = N - INVITE_ASLEEP;

// 主角：念头强、精力一般。种子由 scripts/tune-ep02.ts 挑选。
export const HERO_SEED = 6;
export const HERO: Person = { strength: 0.9, stamina: 0.9, habit: 0.14, seed: HERO_SEED };
export const HERO_SUPPRESS = suppressNight(HERO);
export const HERO_INVITE = inviteNight(HERO);
