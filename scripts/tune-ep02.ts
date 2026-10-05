// 打印第二期成片里引用的仿真数字，并挑一个画面效果合适的主角种子。
// 运行：npx tsx scripts/tune-ep02.ts
import {
  HERO,
  INVITE,
  INVITE_ASLEEP,
  INVITE_AWAKE,
  STEPS,
  SUPPRESS,
  SUPPRESS_ASLEEP,
  SUPPRESS_AWAKE,
  inviteNight,
  suppressNight,
} from '../src/ep02/sim';

const mean = (xs: number[]) => Math.round((xs.reduce((s, x) => s + x, 0) / xs.length) * 10) / 10;
const firstHour = (visits: number[]) => visits.filter((t) => t <= 60).length;

console.log('不许想 睡着', SUPPRESS_ASLEEP, '睁眼到天亮', SUPPRESS_AWAKE);
console.log('请它进来 睡着', INVITE_ASLEEP, '没睡着', INVITE_AWAKE);
console.log(
  '平均出现次数 不许想',
  mean(SUPPRESS.map((n) => n.visits.length)),
  '请它进来',
  mean(INVITE.map((n) => n.visits.length)),
);
console.log(
  '第一个小时平均出现次数 不许想',
  mean(SUPPRESS.map((n) => firstHour(n.visits))),
  '请它进来',
  mean(INVITE.map((n) => firstHour(n.visits))),
);
console.log(
  '请它进来 平均入睡分钟',
  mean(INVITE.filter((n) => n.asleepAt >= 0).map((n) => n.asleepAt)),
);

// 主角：旧规则下睁眼到天亮，而且后半夜比前半夜来得更勤；新规则下它先来几次，然后睡着
const good: number[] = [];
for (let seed = 1; seed < 400 && good.length < 8; seed++) {
  const who = { ...HERO, seed };
  const s = suppressNight(who);
  const v = inviteNight(who);
  const early = s.visits.filter((t) => t <= STEPS / 2).length;
  const late = s.visits.length - early;
  if (s.asleepAt < 0 && late > early * 1.5 && v.asleepAt > 60 && v.asleepAt < 150 && v.visits.length >= 4 && v.visits.length <= 8) {
    good.push(seed);
  }
}
console.log('可用主角种子', good);
