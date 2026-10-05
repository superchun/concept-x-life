import type { CaptionLine } from '../lib/Text';
import { BAR } from '../lib/theme';
import { INVITE_ASLEEP, INVITE_AWAKE, N, SUPPRESS_ASLEEP, SUPPRESS_AWAKE } from './sim';

export const TOTAL_BARS = 37;

// 各段起始小节（一小节 3 秒）。title 包含命名和词条卡；room 起是同一间卧室，不再切画面。
export const AT = { hook: 0, symptoms: 2, title: 7, lab: 10, room: 12, action: 34, end: 36 } as const;

// 顶部进度条：[名称, 起始小节]
export const STAGES: [string, number][] = [
  ['症状', 0],
  ['根因', 8],
  ['代价', 17],
  ['补丁', 22],
  ['结论', 30],
];

// 词条卡上的定义和出处
export const ENTRY = {
  id: 'BUG-002',
  name: '白熊效应',
  def: ['越是刻意[压抑]某个想法，', '这个想法反而[越频繁]地浮现在脑海中。'],
  source: '心理学家丹尼尔·韦格纳，1987 年',
};

// 症状六屏共 15 秒，每屏 2.5 秒。scene 是 symptoms.tsx 里小动画的编号。
// 每条都是同一个动作：告诉自己别做，结果更停不下来。
export const SYMPTOMS: { scene: number; dur: number; text: [string, string, string] }[] = [
  { scene: 0, dur: 75, text: ['一首歌', '不想再哼了', '又从头响了一遍'] },
  { scene: 1, dur: 75, text: ['奶茶', '说好今天不喝', '满脑子都是'] },
  { scene: 2, dur: 75, text: ['上台', '告诉自己别紧张', '手开始抖'] },
  { scene: 4, dur: 75, text: ['失眠', '告诉自己快睡', '越躺越清醒'] },
  { scene: 3, dur: 75, text: ['下班', '说好不想工作', '洗澡时又想起领导的一句话'] },
  { scene: 5, dur: 75, text: ['和 TA', '说好不再想', '又点开了头像'] },
];

// bar 和 len 都可以是小数，用来在两个小节里排三句
const line = (bar: number, text: string, opt: Partial<CaptionLine> & { len?: number } = {}): CaptionLine => ({
  at: Math.round(bar * BAR),
  dur: Math.round((opt.len ?? 1) * BAR) - 4,
  text,
  tone: opt.tone,
  big: opt.big,
});

// 屏幕文字。没有文字的小节是留给画面和音乐的。数字直接来自仿真结果。
// 第 8–9 小节的定义写在词条卡里，最后一问写在结尾画面里，都不在这张表上。
export const LINES: CaptionLine[] = [
  line(0, '你早就决定，[不再想]了。'),
  line(1, '所以，你[想到了今天]。'),
  line(7, '这些是[同一件事]。'),
  line(10, '他让人做了一个实验：五分钟内，[不要想白熊]。'),
  line(11, '想到一次，按一下铃。铃，[每分钟都在响]。'),
  line(12, '你的白熊，可能是一首歌，一句话，一个人。'),
  line(13, '要做到不想，得有人不停[找别的事想]。'),
  line(14, '还得有人[守着门]。他要一直记着它的样子。'),
  line(15, '它一直回来，\n不是因为你放不下。\n是因为你一直[守着门]。', { len: 2, big: true }),
  line(17, '删掉。盖住。骂自己。'),
  line(18, '想把它赶走，这很合理。只是守得越紧，它[来得越勤]。'),
  line(19, '人一累，找事的先睡着。[守门的还醒着]。'),
  line(20, '实验里也一样：禁令解除后，他们想得比别人[更多]。'),
  line(21, `一百个小人，[${SUPPRESS_AWAKE} 个]睁着眼到了天亮。`),
  line(22, '早在 1939 年，一位医生就开过相反的处方。'),
  line(23, '别赶它。[请它进来]。', { tone: 'fix' }),
  line(24, '它叫[矛盾意向]。', { tone: 'fix' }),
  line(26, '没人守门，也就没人一直[举着它]。', { tone: 'fix' }),
  line(27, '它也许还在。只是它在，你也能[睡]了。', { tone: 'fix' }),
  line(28, `同样一百个人：${SUPPRESS_ASLEEP}，变成 [${INVITE_ASLEEP} 个]睡着了。`, { tone: 'fix' }),
  line(29, `还有 ${INVITE_AWAKE} 个没睡着。这不是保证。`),
  line(30, '睡不着，就先[醒着]。', { len: 2 / 3, tone: 'fix' }),
  line(30 + 2 / 3, '手要抖，就[让它抖]。', { len: 2 / 3, tone: 'fix' }),
  line(31 + 1 / 3, '想 TA，就[想一会儿]。', { len: 2 / 3, tone: 'fix' }),
  line(32, '放下，不是把它赶走。\n是[不再守着门]。', { len: 2, big: true, tone: 'fix' }),
  line(35, '想，就[想吧]。', { tone: 'fix' }),
];

export const QUESTION = '你的白熊，是什么？';
export const POPULATION = N;
