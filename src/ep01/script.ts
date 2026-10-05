import type { CaptionLine } from '../lib/Text';
import { BAR } from '../lib/theme';
import { ANNEAL_MAIN, CLIMB_MAIN, N } from './sim';

export const TOTAL_BARS = 34;

// 各段起始小节（一小节 3 秒）。关卡段是同一张连续地图。
export const AT = { hook: 0, symptoms: 2, title: 7, level: 8, action: 31, end: 33 } as const;

// 顶部进度条：[名称, 起始小节]
export const STAGES: [string, number][] = [
  ['症状', 0],
  ['根因', 8],
  ['代价', 15],
  ['补丁', 19],
  ['结论', 27],
];

// 症状六屏共 15 秒，每屏 2.5 秒。scene 是 symptoms.tsx 里小动画的编号。
// 每条都是同一个动作：试了一下新的，不如原来的，又退了回去。
export const SYMPTOMS: { scene: number; dur: number; text: [string, string, string] }[] = [
  { scene: 0, dur: 75, text: ['奶茶', '新品看了五分钟', '还是点了老样子'] },
  { scene: 1, dur: 75, text: ['理发', '想换个发型', '开口还是「跟上次一样」'] },
  { scene: 2, dur: 75, text: ['游戏', '新英雄输了两把', '换回了本命'] },
  { scene: 3, dur: 75, text: ['学习', '反复做熟悉的题', '回避薄弱环节'] },
  { scene: 4, dur: 75, text: ['工作', '新方法试了一天，嫌慢', '又换了回去'] },
  { scene: 5, dur: 75, text: ['和 TA', '挑不出错', '也不算开心'] },
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
  line(7, '这些是[同一件事]。'),
  line(9, '更熟的题。更快的方法。更不费力的关系。'),
  line(11, '你站在山顶。只是这座山[不高]。'),
  line(13, '困住你的不是懒，\n是你太会选[「更好」]。', { len: 2, big: true }),
  line(15, '去那座山，要先[下山]。', { tone: 'fix' }),
  line(16, '下山的每一步，都在[变差]。'),
  line(17, '这很合理。'),
  line(18, `一百个小人，[${N - CLIMB_MAIN} 个]停在小山上。`),
  line(19, '1983 年，有人改了这条规则。'),
  line(20, '偶尔，允许自己走一步[下坡]。', { tone: 'fix' }),
  line(21, '它叫[模拟退火]。', { tone: 'fix' }),
  line(22, '温度高时多试多错，降下来再往上走。', { len: 2 }),
  line(25, `同样一百个人：${CLIMB_MAIN}，变成 [${ANNEAL_MAIN}]。`, { tone: 'fix' }),
  line(26, `还有 ${N - ANNEAL_MAIN} 个没到。这不是保证，只是[机会]。`, { tone: 'fix' }),
  line(27, '年轻，是[温度]还高的时候。', { tone: 'fix' }),
  line(28, '走错的路不算浪费。你是在[看清地形]。', { tone: 'fix' }),
  line(29, '只肯往上走的人，\n[到不了最高的地方]。', { len: 2, big: true, tone: 'fix' }),
  line(32, '下一步，不必[更好]。', { tone: 'fix' }),
];
