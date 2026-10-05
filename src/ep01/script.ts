import type { CaptionLine } from '../lib/Text';
import { BAR } from '../lib/theme';
import { ANNEAL_MAIN, CLIMB_MAIN, N } from './sim';

export const TOTAL_BARS = 32;

// 各段起始小节（一小节 3 秒）。关卡段是同一张连续地图。
export const AT = { hook: 0, symptoms: 2, title: 6, level: 7, action: 30, end: 31 } as const;

// 顶部进度条：[名称, 起始小节]
export const STAGES: [string, number][] = [
  ['症状', 0],
  ['根因', 7],
  ['代价', 14],
  ['补丁', 18],
  ['结论', 26],
];

// 症状六屏共 12 秒：前四屏各 1.7 秒，后两屏各 2.7 秒。scene 是 symptoms.tsx 里小动画的编号。
export const SYMPTOMS: { scene: number; dur: number; text: [string, string] }[] = [
  { scene: 0, dur: 50, text: ['外卖', '只点那三家'] },
  { scene: 1, dur: 50, text: ['歌单', '三年没换'] },
  { scene: 3, dur: 50, text: ['回家', '只走一条路'] },
  { scene: 2, dur: 50, text: ['发型', '十年没变'] },
  { scene: 4, dur: 80, text: ['想辞职两年了', '简历还没改'] },
  { scene: 5, dur: 80, text: ['和 TA', '挑不出错，也不算开心'] },
];

const line = (bar: number, text: string, opt: Partial<CaptionLine> & { len?: number } = {}): CaptionLine => ({
  at: bar * BAR,
  dur: (opt.len ?? 1) * BAR - 4,
  text,
  tone: opt.tone,
  big: opt.big,
});

// 屏幕文字。没有文字的小节是留给画面和音乐的。数字直接来自仿真结果。
export const LINES: CaptionLine[] = [
  line(0, '这十年，你每一步都选了[更好]的。', { tone: 'fix' }),
  line(1, '所以，你被[困住]了。'),
  line(6, '这些是[同一件事]。'),
  line(8, '更好的外卖。更稳的工作。更不费力的关系。'),
  line(10, '你站在山顶。只是这座山[不高]。'),
  line(12, '困住你的不是懒，\n是你太会选[「更好」]。', { len: 2, big: true }),
  line(14, '去那座山，要先[下山]。', { tone: 'fix' }),
  line(15, '下山的每一步，都在[变差]。'),
  line(16, '这很合理。'),
  line(17, `一百个小人，[${N - CLIMB_MAIN} 个]停在小山上。`),
  line(18, '1983 年，有人改了这条规则。'),
  line(19, '偶尔，允许自己走一步[下坡]。', { tone: 'fix' }),
  line(20, '它叫[模拟退火]。', { tone: 'fix' }),
  line(21, '温度高时多试多错，降下来再往上走。', { len: 2 }),
  line(24, `同样一百个人：${CLIMB_MAIN}，变成 [${ANNEAL_MAIN}]。`, { tone: 'fix' }),
  line(25, `还有 ${N - ANNEAL_MAIN} 个没到。这不是保证，只是[机会]。`, { tone: 'fix' }),
  line(26, '年轻，是[温度]还高的时候。', { tone: 'fix' }),
  line(27, '走错的路不算浪费。你是在[看清地形]。', { tone: 'fix' }),
  line(28, '只肯往上走的人，\n[到不了最高的地方]。', { len: 2, big: true, tone: 'fix' }),
  line(30, '今天，把那份简历打开。只改[一行]。', { tone: 'fix' }),
  line(31, '你的山顶，是什么？'),
];
