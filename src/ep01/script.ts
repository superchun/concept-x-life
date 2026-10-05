import type { DialogLine } from '../lib/Text';
import { BAR } from '../lib/theme';
import { ANNEAL_MAIN, CLIMB_MAIN, N } from './sim';

export const TOTAL_BARS = 40;

// 各段起始小节。关卡段（复现、根因、补丁前半）是同一张连续地图。
export const AT = {
  symptoms: 0,
  title: 4,
  level: 6,
  race: 28,
  ending: 34,
} as const;

// 顶部进度条：[名称, 起始小节]
export const STAGES: [string, number][] = [
  ['症状', 0],
  ['复现', 6],
  ['根因', 14],
  ['补丁', 20],
  ['结论', 34],
];

// 开头六条症状，每条一屏 2 秒
export const SYMPTOM_FRAMES = 60;
export const SYMPTOMS = [
  '外卖，永远点那三家。',
  '歌单，三年没换过。',
  '理发，只会说「跟上次一样」。',
  '回家，永远走同一条路。',
  '想辞职两年了，简历还没改。',
  '和 TA 不算开心，但也挑不出错。',
];

const line = (bar: number, text: string, tone?: DialogLine['tone'], len = 1): DialogLine => ({
  at: bar * BAR,
  dur: len * BAR - 4,
  text,
  tone,
});

// 旁白里的数字直接来自仿真结果，不手写
export const LINES: DialogLine[] = [
  ...SYMPTOMS.map((text, i) => ({ at: i * SYMPTOM_FRAMES, dur: SYMPTOM_FRAMES - 2, text })),
  line(4, '这不是六个毛病。是[同一个 bug]。'),
  line(5, '《人生 bug 图鉴》第 001 号：[局部最优]。'),

  line(6, '来复现一下。派一个小人，去找[最高的山]。', 'fix'),
  line(7, '规则只有一条：只能往上走。'),
  line(8, '每一步都是对的。然后，它[不动了]。'),
  line(9, '把镜头拉远。最高的山，就在[隔壁]。', 'fix'),
  line(10, `再派 ${N} 个，规则不变。`),
  line(11, '每一个，都在认真往上爬。'),
  line(12, `到了最高那座山的：[${CLIMB_MAIN} 个]。`, 'fix'),
  line(13, `剩下 ${N - CLIMB_MAIN} 个，全[卡在]小山顶上。没人做错任何事。`),

  line(14, '人，也一样。'),
  line(15, '那三家外卖，是一座小山顶。'),
  line(16, '还行的工作，是。挑不出错的关系，也是。'),
  line(17, '离开它的每一步，都是[下坡]。所以你留了下来。'),

  line(20, '1983 年，三位科学家只改了一条规则。'),
  line(21, '偶尔，允许走一步[下坡]。这个办法叫[模拟退火]。', 'fix'),
  line(22, '像打铁：先烧红，再慢慢放凉。温度越高，越敢走下坡。'),
  line(23, '一开始，它到处乱撞，看起来毫无进步。', undefined, 2),
  line(25, '然后，温度慢慢降下来——'),
  line(26, '它停在了[最高的那座山]上。', 'fix', 2),

  line(28, `一个成功不算数。同一张地图，各 ${N} 人，同时出发。`),
  line(29, '上面是旧规则：很快，就没人动了。'),
  line(30, '年轻，就是[温度]还很高的时候。', 'fix'),
  line(31, '走错的那几步，不是浪费，是在看清[山的全貌]。', 'fix'),
  line(32, `[${ANNEAL_MAIN}] 比 ${CLIMB_MAIN}。`, 'fix'),
  line(33, `还有 ${N - ANNEAL_MAIN} 个没到：这个办法[不保证成功]。`),

  line(36, '这个 bug 修不掉。但今天，可以做一件[「暂时变差」]的事。', 'fix', 2),
  line(38, 'BUG-001 已收录。你还中过什么 bug？[评论区告诉我]。', 'fix', 2),
];
