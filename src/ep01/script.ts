import type { CaptionLine } from '../lib/Text';
import { ANNEAL_MAIN, CLIMB_MAIN } from './sim';

// 每段的起始小节和长度（一小节 3 秒）。改节奏只改这里和下面的字幕。
export const SCENES = {
  A: { bar: 0, len: 4 }, // hook
  B: { bar: 4, len: 2 }, // 标题
  C: { bar: 6, len: 10 }, // 爬山算法
  D: { bar: 16, len: 10 }, // 人也一样
  E: { bar: 26, len: 11 }, // 模拟退火
  F: { bar: 37, len: 6 }, // 高潮
  G: { bar: 43, len: 7 }, // 收尾
} as const;
export const TOTAL_BARS = 50;

// 成片里引用的两个数字直接来自仿真结果，不手写
export const CAPTIONS: CaptionLine[] = [
  { bar: 0, text: '每一次选择，你都选了[更好]的那一个。' },
  { bar: 1, text: '十年，没有走错一步。' },
  { bar: 2, text: '然后，你被[困住]了。' },
  { bar: 3, text: '这不是鸡汤。这是一道[算法题]。' },

  { bar: 6, text: '教计算机找最高点，最简单的办法，叫[爬山算法]。' },
  { bar: 7, text: '规则只有一条：[只往高处走]。' },
  { bar: 8, text: '不贪心，不偷懒。每一步，都是对的。' },
  { bar: 9, text: '现在，放 100 个点下去。' },
  { bar: 10, text: '每一个，都在认真往上爬。' },
  { bar: 11, text: `只有 [${CLIMB_MAIN} 个]，到了最高的那座山。` },
  { bar: 12, text: '剩下的，全停在了某个[小山顶]上。' },
  { bar: 13, text: '因为站在山顶，往哪走，都是下坡。' },
  { bar: 14, len: 2, text: '它们没做错任何事。只是规则不允许它们——[变差]。' },

  { bar: 16, text: '人，也一样。' },
  { bar: 17, text: '一份还行的工作。' },
  { bar: 18, text: '一座熟悉的城市。' },
  { bar: 19, text: '一件早就会做的事。' },
  { bar: 20, text: '离开它的每一步，都是[下坡]。' },
  { bar: 21, text: '所以你留了下来。这很合理。' },

  { bar: 26, text: '1983 年，三位 IBM 的研究员，给了算法一条新规则。', tone: 'hot' },
  { bar: 27, text: '它叫[模拟退火]。像打铁：先烧红，再慢慢放凉。', tone: 'hot' },
  { bar: 28, text: '允许自己，偶尔走一步[更差]的。', tone: 'hot' },
  { bar: 29, text: '温度越高，越敢走[下坡]。', tone: 'hot' },
  { bar: 30, len: 2, text: '一开始，它到处乱撞，看起来毫无进步。', tone: 'hot' },
  { bar: 32, text: '然后，温度慢慢降下来——', tone: 'hot' },
  { bar: 33, len: 2, text: '它停在了，[最高的那座山]上。', tone: 'hot' },
  { bar: 35, len: 2, text: `同样的 100 个点，同样的山。这次是 [${ANNEAL_MAIN} 个]。`, tone: 'hot' },

  { bar: 38, text: '年轻，就是[温度]还很高的时候。', tone: 'hot' },
  { bar: 40, text: '走错的那几步，不是浪费。', tone: 'hot' },
  { bar: 41, text: '是在看清，[山的全貌]。', tone: 'hot' },

  { bar: 43, text: '所以，别怕那一步[下坡]。', tone: 'hot' },
];
