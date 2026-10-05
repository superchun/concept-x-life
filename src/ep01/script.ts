import type { CaptionLine } from '../lib/Text';
import { ANNEAL_MAIN, CLIMB_MAIN, N } from './sim';

// 每段的起始小节和长度（一小节 3 秒）。改节奏只改这里和下面的旁白。
export const SCENES = {
  A: { bar: 0, len: 4 }, // 症状：六条日常现象
  B: { bar: 4, len: 2 }, // 图鉴条目卡
  C: { bar: 6, len: 10 }, // 复现：爬山规则
  D: { bar: 16, len: 10 }, // 根因：人也一样
  E: { bar: 26, len: 11 }, // 补丁：模拟退火
  F: { bar: 37, len: 6 }, // 回归测试：100 格由红变绿
  G: { bar: 43, len: 7 }, // 结论
} as const;
export const TOTAL_BARS = 50;

// 顶栏的阶段条：[名称, 从第几小节开始]
export const STAGES: [string, number][] = [
  ['症状', 0],
  ['复现', 6],
  ['根因', 16],
  ['补丁', 26],
  ['结论', 43],
];

// 开头的六条症状，从小事到大事
export const SYMPTOMS: [string, string][] = [
  ['🍜', '外卖永远点那三家'],
  ['🎧', '歌单三年没换过'],
  ['💇', '理发只会说「跟上次一样」'],
  ['🚇', '回家永远走同一条路'],
  ['💼', '想辞职两年了，简历还没改'],
  ['💬', '和 TA 不算开心，但也挑不出错'],
];

// 旁白里的数字直接来自仿真结果，不手写
export const CAPTIONS: CaptionLine[] = [
  { bar: 0, len: 3, text: '这些，你中了几条？' },
  { bar: 3, text: '它们不是六个毛病。是[同一个 bug]。' },
  { bar: 4, len: 2, text: '《人生 bug 图鉴》，第 001 号。' },

  { bar: 6, text: '先复现。派一个小方块，去找[最高的山]。', tone: 'fix' },
  { bar: 7, text: '它只有一条规则：只往高处走。' },
  { bar: 8, text: '不贪心，不偷懒。每一步，都是对的。' },
  { bar: 9, text: `再派 ${N} 个。` },
  { bar: 10, text: '每一个，都在认真往上爬。' },
  { bar: 11, text: `到了最高那座山的：[${CLIMB_MAIN} 个]。`, tone: 'fix' },
  { bar: 12, text: `剩下 ${N - CLIMB_MAIN} 个，全[卡在]了某个小山顶上。` },
  { bar: 13, text: '站在山顶，往哪走，都是下坡。' },
  { bar: 14, len: 2, text: '没人做错任何事。只是规则里，没有[「变差」]这个选项。' },

  { bar: 16, text: '人，也一样。' },
  { bar: 17, text: '那三家外卖，是一座小山顶。' },
  { bar: 18, text: '还行的工作，也是。' },
  { bar: 19, text: '挑不出错的关系，也是。' },
  { bar: 20, text: '离开它的每一步，都是[下坡]。' },
  { bar: 21, text: '所以你留了下来。这很合理。' },

  { bar: 26, text: '1983 年，有人给这条规则打了个[补丁]。', tone: 'fix' },
  { bar: 27, text: '它叫[模拟退火]。像打铁：先烧红，再慢慢放凉。', tone: 'fix' },
  { bar: 28, text: '只改了一行：允许偶尔走一步[更差]的。', tone: 'fix' },
  { bar: 29, text: '温度 T 越高，越敢走下坡。' },
  { bar: 30, len: 2, text: '一开始，它到处乱撞，看起来毫无进步。' },
  { bar: 32, text: '然后，温度慢慢降下来——' },
  { bar: 33, len: 2, text: '它停在了[最高的那座山]上。', tone: 'fix' },
  { bar: 35, len: 2, text: `一个成功不算数。同样的 ${N} 个，全部重跑。` },

  { bar: 38, text: '年轻，就是[温度]还很高的时候。', tone: 'fix' },
  { bar: 40, text: '走错的那几步，不是浪费。' },
  { bar: 41, text: '是在看清[山的全貌]。', tone: 'fix' },
  { bar: 42, text: `${ANNEAL_MAIN} 个到了。还有 ${N - ANNEAL_MAIN} 个没到：这个补丁[不保证成功]。` },

  { bar: 43, text: '但它证明了一件事：别怕那一步[下坡]。', tone: 'fix' },
  { bar: 46, len: 2, text: '这个 bug 修不掉，但有临时方案。' },
  { bar: 48, len: 2, text: '你还中过什么 bug？[评论区提交]。', tone: 'fix' },
];
